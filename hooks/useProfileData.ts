import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKiteConnect } from './useKiteConnect';

interface WalletData {
  balance: number;
  totalAdded: number;
  totalWithdrawn: number;
  totalProfit: number;
  transactions: Array<{
    id: number;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
    status: string;
  }>;
}

interface BacktestData {
  credits: number;
  totalRuns: number;
  lastResult?: {
    strategy: string;
    totalReturn: string;
    winRate: string;
  };
}

interface PortfolioData {
  totalValue: number;
  totalPnL: number;
  positionsCount: number;
  holdingsCount: number;
}

interface ProfileMenuData {
  wallet: WalletData;
  backtest: BacktestData;
  portfolio: PortfolioData;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useProfileData = (): ProfileMenuData => {
  const { user, isAuthenticated } = useAuth();
  const { 
    positions, 
    holdings, 
    orders, 
    isAuthenticated: kiteAuthenticated,
    refreshData: refreshKiteData 
  } = useKiteConnect();

  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    totalAdded: 0,
    totalWithdrawn: 0,
    totalProfit: 0,
    transactions: []
  });

  const [backtestData, setBacktestData] = useState<BacktestData>({
    credits: 0,
    totalRuns: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate portfolio data from Kite Connect
  const portfolioData: PortfolioData = {
    totalValue: 0,
    totalPnL: 0,
    positionsCount: 0,
    holdingsCount: 0
  };

  if (holdings) {
    portfolioData.totalValue = holdings.reduce((sum, holding) => 
      sum + (holding.last_price * holding.quantity), 0
    );
    portfolioData.totalPnL = holdings.reduce((sum, holding) => 
      sum + (holding.pnl || 0), 0
    );
    portfolioData.holdingsCount = holdings.length;
  }

  if (positions?.net) {
    portfolioData.totalPnL += positions.net.reduce((sum, pos) => 
      sum + (pos.pnl || 0), 0
    );
    portfolioData.positionsCount = positions.net.length;
  }

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    if (!user) return;

    try {
      const walletKey = `wallet_data_${user.id}`;
      const savedWallet = await AsyncStorage.getItem(walletKey);
      
      if (savedWallet) {
        const parsedWallet = JSON.parse(savedWallet);
        setWalletData(parsedWallet);
      } else {
        // Initialize with default values for new users
        const defaultWallet: WalletData = {
          balance: 50000,
          totalAdded: 75000,
          totalWithdrawn: 25000,
          totalProfit: 7500,
          transactions: [
            { id: 1, type: 'credit', amount: 10000, description: 'Added money', date: '2024-01-15', status: 'completed' },
            { id: 2, type: 'debit', amount: 5000, description: 'Strategy investment', date: '2024-01-14', status: 'completed' },
            { id: 3, type: 'credit', amount: 2500, description: 'Strategy profit', date: '2024-01-13', status: 'completed' },
            { id: 4, type: 'debit', amount: 1000, description: 'Withdrawal fee', date: '2024-01-12', status: 'completed' },
            { id: 5, type: 'credit', amount: 15000, description: 'Added money', date: '2024-01-10', status: 'completed' }
          ]
        };
        
        await AsyncStorage.setItem(walletKey, JSON.stringify(defaultWallet));
        setWalletData(defaultWallet);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  }, [user]);

  // Load backtest data
  const loadBacktestData = useCallback(async () => {
    if (!user) return;

    try {
      const creditsKey = `backtest_credits_${user.id}`;
      const runsKey = `backtest_runs_${user.id}`;
      const lastResultKey = `backtest_last_result_${user.id}`;

      const [savedCredits, savedRuns, savedLastResult] = await Promise.all([
        AsyncStorage.getItem(creditsKey),
        AsyncStorage.getItem(runsKey),
        AsyncStorage.getItem(lastResultKey)
      ]);

      const credits = savedCredits ? parseInt(savedCredits, 10) : 50;
      const totalRuns = savedRuns ? parseInt(savedRuns, 10) : 0;
      const lastResult = savedLastResult ? JSON.parse(savedLastResult) : undefined;

      setBacktestData({
        credits,
        totalRuns,
        lastResult
      });
    } catch (error) {
      console.error('Error loading backtest data:', error);
    }
  }, [user]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadWalletData(),
        loadBacktestData(),
        kiteAuthenticated ? refreshKiteData() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadWalletData, loadBacktestData, kiteAuthenticated, refreshKiteData]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  return {
    wallet: walletData,
    backtest: backtestData,
    portfolio: portfolioData,
    isLoading,
    error,
    refreshData
  };
};

// Helper function to format currency values
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Helper function to format percentage values
export const formatPercentage = (value: string): string => {
  const numValue = parseFloat(value);
  return isNaN(numValue) ? value : `${numValue.toFixed(2)}%`;
};
