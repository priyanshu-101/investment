import { useCallback, useEffect, useState } from 'react';
import { strategiesApi, StrategyApiData } from '../services/strategiesApi';

interface UseStrategiesReturn {
  strategies: StrategyApiData[];
  loading: boolean;
  error: string | null;
  refreshStrategies: () => Promise<void>;
  subscribeToStrategy: (strategyId: string) => Promise<boolean>;
}

export const useStrategies = (): UseStrategiesReturn => {
  const [strategies, setStrategies] = useState<StrategyApiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchStrategies = useCallback(async (showLoading = false) => {
    try {
      if (showLoading || isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      
      const data = await strategiesApi.fetchStrategies();
      setStrategies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
      console.error('Strategy fetch error:', err);
    } finally {
      if (showLoading || isInitialLoad) {
        setLoading(false);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  const refreshStrategies = async () => {
    await fetchStrategies(true);
  };

  const subscribeToStrategy = async (strategyId: string): Promise<boolean> => {
    try {
      const success = await strategiesApi.subscribeToStrategy(strategyId);
      if (success) {
        // Refresh strategies to get updated subscription status (silent refresh)
        await fetchStrategies(false);
      }
      return success;
    } catch (err) {
      console.error('Strategy subscription error:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchStrategies(true);

    // Auto-refresh every 5 seconds for live updates (silent refresh)
    const interval = setInterval(() => {
      fetchStrategies(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStrategies]);

  return {
    strategies,
    loading,
    error,
    refreshStrategies,
    subscribeToStrategy,
  };
};