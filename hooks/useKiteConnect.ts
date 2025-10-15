import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { kiteConnect, KiteHolding, KiteOrder, KitePosition, KiteUser } from '../services/kiteConnect';

interface UseKiteConnectState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: KiteUser | null;
  positions: { net: KitePosition[]; day: KitePosition[] } | null;
  holdings: KiteHolding[] | null;
  orders: KiteOrder[] | null;
  error: string | null;
}

interface UseKiteConnectActions {
  login: () => void;
  logout: () => void;
  refreshData: () => void;
  clearError: () => void;
}

export const useKiteConnect = (): UseKiteConnectState & UseKiteConnectActions => {
  const [state, setState] = useState<UseKiteConnectState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    positions: null,
    holdings: null,
    orders: null,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for deep links (OAuth callback)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      handleAuthCallback(event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAuthCallback(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const isAuth = await kiteConnect.isAuthenticated();
      
      if (isAuth) {
        await fetchUserData();
      }
      
      setState(prev => ({
        ...prev,
        isAuthenticated: isAuth,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error checking auth status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check authentication status',
      }));
    }
  };

  const fetchUserData = async () => {
    try {
      const [user, positions, holdings, orders] = await Promise.all([
        kiteConnect.getProfile().catch(err => {
          console.warn('Failed to fetch profile:', err);
          return null;
        }),
        kiteConnect.getPositions().catch(err => {
          console.warn('Failed to fetch positions:', err);
          return null;
        }),
        kiteConnect.getHoldings().catch(err => {
          console.warn('Failed to fetch holdings:', err);
          return null;
        }),
        kiteConnect.getOrders().catch(err => {
          console.warn('Failed to fetch orders:', err);
          return null;
        }),
      ]);

      setState(prev => ({
        ...prev,
        user,
        positions,
        holdings,
        orders,
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch user data',
      }));
    }
  };

  const handleAuthCallback = async (url: string) => {
    try {
      // Only handle Kite Connect URLs - check for specific patterns
      if (!url.includes('request_token=') || (!url.includes('kite.trade') && !url.includes('zerodha'))) {
        return; // Not a valid Kite Connect callback, ignore silently
      }

      const urlObj = new URL(url);
      const requestToken = urlObj.searchParams.get('request_token');
      const status = urlObj.searchParams.get('status');

      // Only process if this is a valid Kite Connect callback
      if (requestToken && status) {
        if (status === 'success' && requestToken) {
          setState(prev => ({ ...prev, isLoading: true }));
          
          // Exchange request token for access token
          const { access_token } = await kiteConnect.generateSession(requestToken);
          
          if (access_token) {
            setState(prev => ({ ...prev, isAuthenticated: true }));
            await fetchUserData();
            Alert.alert('Success', 'Successfully logged in to Kite Connect!');
          }
        } else {
          const errorDescription = urlObj.searchParams.get('error_description') || 'Authentication failed';
          Alert.alert('Login Failed', errorDescription);
        }
      }
      // If no request_token or status, it's not a Kite Connect callback - ignore silently
    } catch (error) {
      console.error('Error handling auth callback:', error);
      // Only show error if this was actually a Kite Connect URL
      if (url.includes('kite.trade') || url.includes('request_token=')) {
        Alert.alert('Error', 'Failed to complete authentication');
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(() => {
    try {
      const loginUrl = kiteConnect.generateLoginURL();
      Linking.openURL(loginUrl);
    } catch (error) {
      console.error('Error opening login URL:', error);
      Alert.alert('Error', 'Failed to open login page');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await kiteConnect.logout();
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        positions: null,
        holdings: null,
        orders: null,
        error: null,
      });
      
      Alert.alert('Success', 'Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to logout',
      }));
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    await fetchUserData();
    setState(prev => ({ ...prev, isLoading: false }));
  }, [state.isAuthenticated]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshData,
    clearError,
  };
};

// Additional hooks for specific data fetching
export const useKiteQuotes = (instruments: string[]) => {
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (instruments.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await kiteConnect.getQuote(instruments);
      setQuotes(data);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  }, [instruments]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
};

export const useKiteHistoricalData = (
  instrumentToken: string,
  interval: string,
  fromDate: string,
  toDate: string
) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = useCallback(async () => {
    if (!instrumentToken || !interval || !fromDate || !toDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const historicalData = await kiteConnect.getHistoricalData(
        instrumentToken,
        interval,
        fromDate,
        toDate
      );
      setData(historicalData);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  }, [instrumentToken, interval, fromDate, toDate]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return { data, loading, error, refetch: fetchHistoricalData };
};