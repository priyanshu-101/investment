import { useCallback, useEffect, useState } from 'react';
import { BrokerApiData, BrokerConnectionParams, brokersApi } from '../services/brokersApi';

interface UseBrokersReturn {
  availableBrokers: BrokerApiData[];
  connectedBrokers: BrokerApiData[];
  loading: boolean;
  error: string | null;
  refreshBrokers: () => Promise<void>;
  connectBroker: (params: BrokerConnectionParams) => Promise<{ success: boolean; message: string; broker?: BrokerApiData }>;
  disconnectBroker: (brokerId: string) => Promise<{ success: boolean; message: string }>;
}

export const useBrokers = (): UseBrokersReturn => {
  const [availableBrokers, setAvailableBrokers] = useState<BrokerApiData[]>([]);
  const [connectedBrokers, setConnectedBrokers] = useState<BrokerApiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrokers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [available, connected] = await Promise.all([
        brokersApi.fetchAvailableBrokers(),
        brokersApi.getConnectedBrokers()
      ]);
      
      setAvailableBrokers(available);
      setConnectedBrokers(connected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brokers');
      console.error('Broker fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBrokers = useCallback(async () => {
    await fetchBrokers();
  }, [fetchBrokers]);

  const connectBroker = useCallback(async (params: BrokerConnectionParams) => {
    try {
      setLoading(true);
      const result = await brokersApi.connectBroker(params);
      
      if (result.success && result.broker) {
        // Update the connected brokers list
        setConnectedBrokers(prev => [...prev, result.broker!]);
        
        // Update available brokers to reflect connection status
        setAvailableBrokers(prev => 
          prev.map(broker => 
            broker.id === result.broker!.id ? result.broker! : broker
          )
        );
      }
      
      return result;
    } catch (err) {
      console.error('Broker connection error:', err);
      return {
        success: false,
        message: 'Failed to connect broker'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectBroker = useCallback(async (brokerId: string) => {
    try {
      setLoading(true);
      const result = await brokersApi.disconnectBroker(brokerId);
      
      if (result.success) {
        // Remove from connected brokers
        setConnectedBrokers(prev => prev.filter(broker => broker.id !== brokerId));
        
        // Update available brokers to reflect disconnection
        setAvailableBrokers(prev => 
          prev.map(broker => 
            broker.id === brokerId 
              ? { ...broker, isConnected: false, status: 'disconnected' as const }
              : broker
          )
        );
      }
      
      return result;
    } catch (err) {
      console.error('Broker disconnection error:', err);
      return {
        success: false,
        message: 'Failed to disconnect broker'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  return {
    availableBrokers,
    connectedBrokers,
    loading,
    error,
    refreshBrokers,
    connectBroker,
    disconnectBroker,
  };
};