import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
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
  const { user } = useAuthContext();

  const storageKey = useMemo(() => (user ? `broker_connections_${user.id}` : null), [user]);

  const loadPersistedBrokers = useCallback(async (): Promise<BrokerApiData[]> => {
    if (!storageKey) {
      return [];
    }

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((broker: BrokerApiData) => ({
        ...broker,
        isConnected: true,
        status: 'connected',
      }));
    } catch (error) {
      console.error('Broker persistence load error:', error);
      return [];
    }
  }, [storageKey]);

  const persistBrokerConnection = useCallback(async (broker: BrokerApiData) => {
    if (!storageKey) {
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      const existing = Array.isArray(parsed) ? parsed : [];
      const updated = existing.filter((item: BrokerApiData) => item.id !== broker.id);

      updated.push({
        ...broker,
        isConnected: true,
        status: 'connected',
      });

      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Broker persistence save error:', error);
    }
  }, [storageKey]);

  const removePersistedBroker = useCallback(async (brokerId: string) => {
    if (!storageKey) {
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        await AsyncStorage.removeItem(storageKey);
        return;
      }

      const updated = parsed.filter((item: BrokerApiData) => item.id !== brokerId);

      if (updated.length === 0) {
        await AsyncStorage.removeItem(storageKey);
      } else {
        await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Broker persistence remove error:', error);
    }
  }, [storageKey]);

  const fetchBrokers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [available, persisted] = await Promise.all([
        brokersApi.fetchAvailableBrokers(),
        loadPersistedBrokers(),
      ]);

      const mergedMap = new Map<string, BrokerApiData>();

      available.forEach((broker) => {
        mergedMap.set(broker.id, broker);
      });

      persisted.forEach((broker) => {
        const existing = mergedMap.get(broker.id);
        if (existing) {
          mergedMap.set(broker.id, {
            ...existing,
            ...broker,
            isConnected: true,
            status: 'connected',
          });
        } else {
          mergedMap.set(broker.id, broker);
        }
      });

      const mergedAvailable = Array.from(mergedMap.values());
      const mergedConnected = mergedAvailable.filter((broker) => broker.isConnected);

      setAvailableBrokers(mergedAvailable);
      setConnectedBrokers(mergedConnected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brokers');
      console.error('Broker fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadPersistedBrokers]);

  const refreshBrokers = useCallback(async () => {
    await fetchBrokers();
  }, [fetchBrokers]);

  const connectBroker = useCallback(async (params: BrokerConnectionParams) => {
    try {
      setLoading(true);
      const result = await brokersApi.connectBroker(params);

      if (result.success && result.broker) {
        const brokerWithUser: BrokerApiData = {
          ...result.broker,
          userId: user?.id || result.broker.userId,
          isConnected: true,
          status: 'connected',
        };

        setConnectedBrokers((prev) => {
          const exists = prev.find((broker) => broker.id === brokerWithUser.id);
          if (exists) {
            return prev.map((broker) => (broker.id === brokerWithUser.id ? brokerWithUser : broker));
          }
          return [...prev, brokerWithUser];
        });

        setAvailableBrokers((prev) => {
          const exists = prev.find((broker) => broker.id === brokerWithUser.id);
          if (exists) {
            return prev.map((broker) => (broker.id === brokerWithUser.id ? brokerWithUser : broker));
          }
          return [...prev, brokerWithUser];
        });

        await persistBrokerConnection(brokerWithUser);

        return {
          ...result,
          broker: brokerWithUser,
        };
      }

      return result;
    } catch (err) {
      console.error('Broker connection error:', err);
      return {
        success: false,
        message: 'Failed to connect broker',
      };
    } finally {
      setLoading(false);
    }
  }, [persistBrokerConnection, user]);

  const disconnectBroker = useCallback(async (brokerId: string) => {
    try {
      setLoading(true);
      const result = await brokersApi.disconnectBroker(brokerId);

      if (result.success) {
        setConnectedBrokers((prev) => prev.filter((broker) => broker.id !== brokerId));

        setAvailableBrokers((prev) =>
          prev.map((broker) =>
            broker.id === brokerId
              ? { ...broker, isConnected: false, status: 'disconnected', userId: undefined }
              : broker,
          ),
        );

        await removePersistedBroker(brokerId);
      }

      return result;
    } catch (err) {
      console.error('Broker disconnection error:', err);
      return {
        success: false,
        message: 'Failed to disconnect broker',
      };
    } finally {
      setLoading(false);
    }
  }, [removePersistedBroker]);

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