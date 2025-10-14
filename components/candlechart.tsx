import { Canvas, Group, Line, Rect } from '@shopify/react-native-skia';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { kiteConnect } from '../services/kiteConnect'; // Assume kiteConnect is properly configured and exported

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleChartProps {
  instrument: string;
  interval: string;
  height?: number;
  isRealTime?: boolean;
  onCandlePatternDetected?: (pattern: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const CandleChart: React.FC<CandleChartProps> = ({
  instrument,
  interval,
  height = 300,
  isRealTime = false,
  onCandlePatternDetected
}) => {
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(interval);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const chartWidth = screenWidth - 32;
  const chartHeight = height - 60; // Reserve space for controls
  const candleWidth = 8;
  const candleSpacing = 2;

  const timeframes = ['1M', '3M', '5M', '15M', '30M', '1H', '1D'];

  // Fetch historical candle data
  const fetchCandleData = async (timeframe: string = selectedTimeframe) => {
    setLoading(true);
    setError(null);
    
    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) {
        throw new Error('Not authenticated with Zerodha');
      }

      const to = new Date();
      const from = new Date();
      
      // Set date range based on timeframe
      switch (timeframe) {
        case '1M':
        case '3M':
        case '5M':
          from.setDate(from.getDate() - 2); // 2 days for intraday
          break;
        case '15M':
        case '30M':
          from.setDate(from.getDate() - 7); // 1 week
          break;
        case '1H':
          from.setDate(from.getDate() - 30); // 1 month
          break;
        case '1D':
          from.setDate(from.getDate() - 365); // 1 year
          break;
        default:
          from.setDate(from.getDate() - 7);
      }

      const historicalData = await kiteConnect.getHistoricalData(
        instrument,
        timeframe.toLowerCase(),
        from.toISOString().split('T')[0],
        to.toISOString().split('T')[0]
      );

      if (historicalData && historicalData.length > 0) {
        const formattedData: CandleData[] = historicalData.map((candle: any) => ({
          timestamp: candle.date || candle.timestamp,
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseInt(candle.volume || candle.oi || 0)
        }));

        setCandleData(formattedData.slice(-100)); // Keep last 100 candles for performance
        
        // Calculate price change
        if (formattedData.length >= 2) {
          const latest = formattedData[formattedData.length - 1];
          const previous = formattedData[formattedData.length - 2];
          const change = latest.close - previous.close;
          const changePercent = (change / previous.close) * 100;
          
          setPriceChange(change);
          setPriceChangePercent(changePercent);
          setLivePrice(latest.close);
        }

        // Detect candle patterns
        detectCandlePatterns(formattedData.slice(-5)); // Check last 5 candles
      }
    } catch (err) {
      console.error('Error fetching candle data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection for live updates
  const connectWebSocket = async () => {
    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) return;

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = await kiteConnect.getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for', instrument);
        // Subscribe to instrument updates
        wsRef.current?.send(JSON.stringify({
          a: 'subscribe',
          v: [instrument]
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.ltp) {
            setLivePrice(data.ltp);
            updateLastCandle(data);
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed for', instrument);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  };

  // Update last candle with live data
  const updateLastCandle = (liveData: any) => {
    setCandleData(prevData => {
      if (prevData.length === 0) return prevData;
      
      const updatedData = [...prevData];
      const lastCandle = updatedData[updatedData.length - 1];
      
      // Update the last candle with live price
      updatedData[updatedData.length - 1] = {
        ...lastCandle,
        close: liveData.ltp || lastCandle.close,
        high: Math.max(lastCandle.high, liveData.ltp || lastCandle.high),
        low: Math.min(lastCandle.low, liveData.ltp || lastCandle.low),
        volume: liveData.volume || lastCandle.volume
      };
      
      return updatedData;
    });
  };

  // Detect candle patterns
  const detectCandlePatterns = (candles: CandleData[]) => {
    if (candles.length < 3) return;

    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    const beforePrevious = candles[candles.length - 3];

    // Doji pattern
    const isDoji = Math.abs(latest.close - latest.open) <= (latest.high - latest.low) * 0.1;
    
    // Hammer pattern
    const bodySize = Math.abs(latest.close - latest.open);
    const lowerShadow = Math.min(latest.open, latest.close) - latest.low;
    const upperShadow = latest.high - Math.max(latest.open, latest.close);
    const isHammer = lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5;
    
    // Engulfing patterns
    const isBullishEngulfing = 
      previous.close < previous.open && // Previous red candle
      latest.close > latest.open && // Current green candle
      latest.open < previous.close && // Opens below previous close
      latest.close > previous.open; // Closes above previous open
      
    const isBearishEngulfing = 
      previous.close > previous.open && // Previous green candle
      latest.close < latest.open && // Current red candle
      latest.open > previous.close && // Opens above previous close
      latest.close < previous.open; // Closes below previous open

    // Trigger callbacks for detected patterns
    if (isDoji && onCandlePatternDetected) {
      onCandlePatternDetected('Doji');
    }
    if (isHammer && onCandlePatternDetected) {
      onCandlePatternDetected('Hammer');
    }
    if (isBullishEngulfing && onCandlePatternDetected) {
      onCandlePatternDetected('Bullish Engulfing');
    }
    if (isBearishEngulfing && onCandlePatternDetected) {
      onCandlePatternDetected('Bearish Engulfing');
    }
  };

  // Calculate chart scaling
  const getChartBounds = () => {
    if (candleData.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    
    const prices = candleData.flatMap(candle => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    return {
      minPrice: minPrice - priceRange * 0.1, // Add 10% padding
      maxPrice: maxPrice + priceRange * 0.1,
      priceRange: priceRange * 1.2
    };
  };

  // Convert price to Y coordinate
  const priceToY = (price: number, bounds: any) => {
    return chartHeight - ((price - bounds.minPrice) / bounds.priceRange) * chartHeight;
  };

  // Generate candle paths
  const generateCandlePaths = () => {
    if (candleData.length === 0) return [];
    
    const bounds = getChartBounds();
    const paths: any[] = [];
    
    candleData.forEach((candle, index) => {
      const x = index * (candleWidth + candleSpacing) + candleWidth / 2;
      const openY = priceToY(candle.open, bounds);
      const closeY = priceToY(candle.close, bounds);
      const highY = priceToY(candle.high, bounds);
      const lowY = priceToY(candle.low, bounds);
      
      const isGreen = candle.close > candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = bodyBottom - bodyTop;
      
      paths.push({
        type: 'candle',
        x,
        bodyTop,
        bodyHeight,
        highY,
        lowY,
        isGreen,
        candle
      });
    });
    
    return paths;
  };

  const changeTimeframe = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    fetchCandleData(timeframe);
  };

  useEffect(() => {
    fetchCandleData();
    if (isRealTime) {
      connectWebSocket();
      
      // More frequent refresh for real-time charts
      intervalRef.current = setInterval(() => {
        fetchCandleData();
      }, isRealTime ? 10000 : 60000); // 10 seconds for real-time, 1 minute for preview
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [instrument, isRealTime]);

  const renderChart = () => {
    const paths = generateCandlePaths();
    
    return (
      <Canvas style={{ width: chartWidth, height: chartHeight }}>
        <Group>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <Line
              key={`grid-${index}`}
              p1={{ x: 0, y: chartHeight * ratio }}
              p2={{ x: chartWidth, y: chartHeight * ratio }}
              color="rgba(128, 128, 128, 0.2)"
              strokeWidth={1}
            />
          ))}
          
          {/* Candles */}
          {paths.map((path, index) => (
            <Group key={`candle-${index}`}>
              {/* High-Low line */}
              <Line
                p1={{ x: path.x, y: path.highY }}
                p2={{ x: path.x, y: path.lowY }}
                color={path.isGreen ? "#4CAF50" : "#F44336"}
                strokeWidth={1}
              />
              
              {/* Candle body */}
              <Rect
                x={path.x - candleWidth / 2}
                y={path.bodyTop}
                width={candleWidth}
                height={Math.max(path.bodyHeight, 1)}
                color={path.isGreen ? "#4CAF50" : "#F44336"}
              />
            </Group>
          ))}
        </Group>
      </Canvas>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with price info */}
      <View style={styles.header}>
        <View style={styles.priceInfo}>
          <View style={styles.instrumentRow}>
            <Text style={styles.instrumentName}>{instrument}</Text>
            {isRealTime && (
              <View style={styles.realTimeIndicator}>
                <View style={styles.realTimeDot} />
                <Text style={styles.realTimeText}>LIVE</Text>
              </View>
            )}
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              ₹{livePrice?.toFixed(2) || '0.00'}
            </Text>
            <Text style={[
              styles.priceChange,
              priceChange >= 0 ? styles.positiveChange : styles.negativeChange
            ]}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
        
        {loading && <ActivityIndicator size="small" color="#1976d2" />}
      </View>

      {/* Timeframe selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.timeframeContainer}
      >
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.activeTimeframeButton
            ]}
            onPress={() => changeTimeframe(timeframe)}
          >
            <Text style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.activeTimeframeText
            ]}>
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chart area */}
      <View style={styles.chartContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchCandleData()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : candleData.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderChart()}
          </ScrollView>
        )}
      </View>

      {/* Volume indicator */}
      {candleData.length > 0 && (
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeLabel}>
            Volume: {candleData[candleData.length - 1]?.volume.toLocaleString() || '0'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  priceInfo: {
    flex: 1,
  },
  instrumentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  instrumentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  realTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  realTimeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#F44336',
  },
  timeframeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  activeTimeframeButton: {
    backgroundColor: '#1976d2',
  },
  timeframeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  activeTimeframeText: {
    color: '#fff',
  },
  chartContainer: {
    height: 300,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  volumeContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  volumeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default CandleChart;