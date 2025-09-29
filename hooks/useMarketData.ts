import { useCallback, useEffect, useRef, useState } from 'react';
import { IndexData, marketDataService } from '../services/marketDataApi';

export interface UseMarketDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  symbols?: string[];
}

export interface MarketDataState {
  data: IndexData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isMarketOpen: boolean;
  nextMarketEvent: string | null;
}

export function useMarketData(options: UseMarketDataOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds default
    symbols
  } = options;

  const [state, setState] = useState<MarketDataState>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null,
    isMarketOpen: false,
    nextMarketEvent: null,
  });

  const intervalRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const fetchMarketData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch market data and status in parallel
      const [marketData, marketStatus] = await Promise.all([
        marketDataService.getMarketIndices(symbols),
        marketDataService.getMarketStatus()
      ]);

      if (isMountedRef.current) {
        setState({
          data: marketData,
          loading: false,
          error: null,
          lastUpdated: new Date(),
          isMarketOpen: marketStatus.isOpen,
          nextMarketEvent: marketStatus.isOpen 
            ? (marketStatus.nextClose || null) 
            : (marketStatus.nextOpen || null),
        });
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch market data',
        }));
      }
    }
  }, [symbols]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMarketData();
      }, refreshInterval);
    }
  }, [autoRefresh, refreshInterval, fetchMarketData]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchMarketData();
  }, [fetchMarketData]);

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchMarketData();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
      isMountedRef.current = false;
    };
  }, [fetchMarketData, startAutoRefresh, stopAutoRefresh]);

  // Auto-refresh is already handled in the main useEffect above
  // App state management removed to avoid React Native compatibility issues

  return {
    ...state,
    refreshData,
    startAutoRefresh,
    stopAutoRefresh,
  };
}