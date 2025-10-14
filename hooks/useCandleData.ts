import { useCallback, useEffect, useState } from 'react';
import { kiteConnect } from '../services/kiteConnect';
import { webSocketService } from '../services/websocketservice';

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseCandleDataOptions {
  instrument: string;
  interval: string;
  autoRefresh?: boolean;
  isRealTime?: boolean;
  onPatternDetected?: (pattern: string, data: CandleData) => void;
}

export const useCandleData = ({
  instrument,
  interval,
  autoRefresh = true,
  isRealTime = false,
  onPatternDetected
}: UseCandleDataOptions) => {
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const fetchHistoricalData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) {
        throw new Error('Not authenticated');
      }

      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);

      const data = await kiteConnect.getHistoricalData(
        instrument,
        interval.toLowerCase(),
        from.toISOString().split('T')[0],
        to.toISOString().split('T')[0]
      );

      if (data) {
        const formattedData: CandleData[] = data.map((candle: any) => ({
          timestamp: candle.date || candle.timestamp,
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseInt(candle.volume || 0)
        }));

        setCandleData(formattedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [instrument, interval]);

  const handleLiveUpdate = useCallback((data: any) => {
    if (data.ltp) {
      setLivePrice(data.ltp);
      
      // Update last candle with live data
      setCandleData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const updatedData = [...prevData];
        const lastCandle = updatedData[updatedData.length - 1];
        
        updatedData[updatedData.length - 1] = {
          ...lastCandle,
          close: data.ltp,
          high: Math.max(lastCandle.high, data.ltp),
          low: Math.min(lastCandle.low, data.ltp),
          volume: data.volume || lastCandle.volume
        };
        
        return updatedData;
      });
    }
  }, []);

  useEffect(() => {
    fetchHistoricalData();

    if (autoRefresh) {
      // Connect to WebSocket for live updates
      webSocketService.connect();
      webSocketService.subscribe(instrument, handleLiveUpdate);
    }

    return () => {
      if (autoRefresh) {
        webSocketService.unsubscribe(instrument, handleLiveUpdate);
      }
    };
  }, [instrument, interval, autoRefresh, fetchHistoricalData, handleLiveUpdate]);

  const refresh = useCallback(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return {
    candleData,
    loading,
    error,
    livePrice,
    refresh
  };
};