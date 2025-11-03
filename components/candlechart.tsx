import { Ionicons } from '@expo/vector-icons';
import { Canvas, Group, Line, Path, Rect, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
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

export type ChartType = 
  | 'Candle' 
  | 'Bars' 
  | 'Hollow candles' 
  | 'Line' 
  | 'OHLC'
  | 'Area'
  | 'HLC area'
  | 'Baseline'
  | 'Columns'
  | 'High-low'
  | 'Heikin Ashi'
  | 'Renko'
  | 'Line break'
  | 'Kagi'
  | 'Point & figure'
  | 'Line with markers'
  | 'Step line';

interface CandleChartProps {
  instrument: string;
  interval: string;
  height?: number;
  isRealTime?: boolean;
  chartType?: ChartType;
  onCandlePatternDetected?: (pattern: string) => void;
  onChartTypeChange?: (chartType: ChartType) => void;
  action?: 'Buy' | 'Sell' | 'Both';
}

const { width: screenWidth } = Dimensions.get('window');

const CandleChart: React.FC<CandleChartProps> = ({
  instrument,
  interval,
  height = 300,
  isRealTime = false,
  chartType = 'Candle',
  onCandlePatternDetected,
  onChartTypeChange,
  action = 'Both'
}) => {
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(interval);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [showChartTypeModal, setShowChartTypeModal] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chartWidth = screenWidth - 32;
  const chartHeight = height - 60; // Reserve space for controls
  const candleWidth = 8;
  const candleSpacing = 2;
  const axisPadding = 40; // Space for Y-axis labels
  const bottomPadding = 30; // Space for X-axis labels
  const actualChartWidth = chartWidth - axisPadding;
  const actualChartHeight = chartHeight - bottomPadding;

  const timeframes = ['1M', '3M', '5M', '15M', '30M', '1H', '1D'];

  // Generate dynamic mock candle data with realistic market movements
  const generateMockCandleData = (timeframe: string): CandleData[] => {
    const data: CandleData[] = [];
    const now = new Date();
    
    // Different base prices for different instruments
    const instrumentPrices: { [key: string]: number } = {
      'NIFTY': 22000,
      'BANKNIFTY': 48000,
      'NIFTYBANK': 48000,
      'NIFTYAUTO': 18000,
      'NIFTYFMCG': 55000,
      'NIFTYIT': 35000,
      'NIFTYPHARMA': 15000,
      'NIFTYMETAL': 6500,
      'NIFTYENERGY': 25000,
      'NIFTYPSU': 6500,
    };
    
    const basePrice = instrumentPrices[instrument] || 22000;
    let currentPrice = basePrice;
    
    let intervalMinutes = 1;
    let dataPoints = 200; // More data points for better visualization

    switch (timeframe) {
      case '1M': intervalMinutes = 1; dataPoints = 200; break;
      case '3M': intervalMinutes = 3; dataPoints = 150; break;
      case '5M': intervalMinutes = 5; dataPoints = 120; break;
      case '15M': intervalMinutes = 15; dataPoints = 80; break;
      case '30M': intervalMinutes = 30; dataPoints = 60; break;
      case '1H': intervalMinutes = 60; dataPoints = 40; break;
      case '1D': intervalMinutes = 1440; dataPoints = 30; break;
    }
    
    // Adjust trend based on action
    let trendMultiplier = 0;
    switch (action) {
      case 'Buy': trendMultiplier = 0.001; break; // Slight upward trend
      case 'Sell': trendMultiplier = -0.001; break; // Slight downward trend
      case 'Both': trendMultiplier = 0; break; // Neutral trend
    }
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60000));
      
      // Simulate realistic price movement with trend and volatility
      const trend = Math.sin(i / 10) * basePrice * 0.001; // Slight trend
      const volatility = basePrice * (0.001 + Math.random() * 0.002); // Variable volatility
      const priceChange = trend + (Math.random() - 0.5) * volatility;
      currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.85); // Prevent going too low
      
      const open = currentPrice;
      const close = open + (Math.random() - 0.5) * volatility * 0.8 + trendMultiplier * basePrice;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.floor(Math.random() * 2000000) + 500000; // Higher volume for realism
      
      data.push({
        timestamp: timestamp.toISOString(),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: volume
      });

      currentPrice = close;
    }
    
    return data;
  };


  // Helper function for chart icons
  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'Bars':
        return 'bar-chart';
      case 'Candle':
        return 'trending-up';
      case 'Hollow candles':
        return 'trending-up-outline';
      case 'Line':
        return 'analytics';
      case 'OHLC':
        return 'stats-chart';
      case 'Area':
        return 'color-fill';
      case 'HLC area':
        return 'layers';
      case 'Baseline':
        return 'swap-horizontal';
      case 'Columns':
        return 'albums';
      case 'High-low':
        return 'pulse';
      case 'Heikin Ashi':
        return 'trending-up';
      case 'Renko':
        return 'grid';
      case 'Line break':
        return 'remove';
      case 'Kagi':
        return 'git-branch';
      case 'Point & figure':
        return 'grid-outline';
      case 'Line with markers':
        return 'radio-button-on';
      case 'Step line':
        return 'stats-chart';
      default:
        return 'bar-chart';
    }
  };

  // Fetch historical candle data
  const fetchCandleData = async (timeframe: string = selectedTimeframe) => {
    setLoading(true);
    setError(null);
    
    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) {
        console.log('Not authenticated with Zerodha - using mock data');
        // Use mock data when not authenticated
        const mockData = generateMockCandleData(timeframe);
        setCandleData(mockData);
        setLivePrice(mockData[mockData.length - 1]?.close || 0);
        setLoading(false);
        return;
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

  // Memoized chart bounds calculation
  const getChartBounds = useMemo(() => {
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
  }, [candleData]);

  // Convert price to Y coordinate
  const priceToY = (price: number, bounds: any) => {
    return actualChartHeight - ((price - bounds.minPrice) / bounds.priceRange) * actualChartHeight;
  };

  // Memoized Y-axis labels
  const generateYAxisLabels = useMemo(() => {
    const bounds = getChartBounds;
    const labels = [];
    const numLabels = 5;
    const priceStep = bounds.priceRange / (numLabels - 1);
    
    for (let i = 0; i < numLabels; i++) {
      const price = bounds.minPrice + (i * priceStep);
      const y = actualChartHeight - ((price - bounds.minPrice) / bounds.priceRange) * actualChartHeight;
      labels.push({
        price: price.toFixed(2),
        y: y
      });
    }
    return labels;
  }, [getChartBounds, actualChartHeight]);

  // Memoized X-axis labels
  const generateXAxisLabels = useMemo(() => {
    if (candleData.length === 0) return [];
    const labels = [];
    const numLabels = 5;
    const step = Math.max(1, Math.floor(candleData.length / numLabels));
    
    for (let i = 0; i < numLabels; i++) {
      const index = i * step;
      if (index < candleData.length) {
        const candle = candleData[index];
        const time = new Date(candle.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        const x = axisPadding + (index * (candleWidth + candleSpacing)) + candleWidth / 2;
        labels.push({
          time: timeStr,
          x: x
        });
      }
    }
    return labels;
  }, [candleData, axisPadding, candleWidth, candleSpacing]);

  // Generate chart paths based on chart type
  const generateChartPaths = useMemo(() => {
    if (candleData.length === 0) return [];
    
    const bounds = getChartBounds;
    const paths: any[] = [];
    
    candleData.forEach((candle, index) => {
      const x = axisPadding + (index * (candleWidth + candleSpacing)) + candleWidth / 2;
      const openY = priceToY(candle.open, bounds);
      const closeY = priceToY(candle.close, bounds);
      const highY = priceToY(candle.high, bounds);
      const lowY = priceToY(candle.low, bounds);
      
      const isGreen = candle.close > candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = bodyBottom - bodyTop;
      
      paths.push({
        type: chartType.toLowerCase(),
        x,
        openY,
        closeY,
        highY,
        lowY,
        bodyTop,
        bodyHeight,
        isGreen,
        candle,
        candleWidth
      });
    });
    
    return paths;
  }, [candleData, chartType, axisPadding, candleWidth, candleSpacing, getChartBounds]);

  const changeTimeframe = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    fetchCandleData(timeframe);
  };

  useEffect(() => {
    fetchCandleData();
    if (isRealTime) {
      connectWebSocket();
      
      // More frequent refresh for real-time charts with dynamic updates
      intervalRef.current = setInterval(() => {
        // Update live price dynamically
        if (candleData.length > 0) {
          const lastCandle = candleData[candleData.length - 1];
          const basePrice = lastCandle.close;
          
          // Instrument-specific volatility
          const instrumentVolatility: { [key: string]: number } = {
            'NIFTY': 0.002, 'BANKNIFTY': 0.003, 'NIFTYBANK': 0.003,
            'NIFTYAUTO': 0.004, 'NIFTYFMCG': 0.002, 'NIFTYIT': 0.003,
            'NIFTYPHARMA': 0.003, 'NIFTYMETAL': 0.005, 'NIFTYENERGY': 0.004, 'NIFTYPSU': 0.005,
          };
          
          const volatility = instrumentVolatility[instrument] || 0.003;
          const priceChange = (Math.random() - 0.5) * basePrice * volatility;
          const newPrice = Math.max(basePrice + priceChange, basePrice * 0.95);
          
          setLivePrice(newPrice);
          
          // Update last candle
          setCandleData(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              close: newPrice,
              high: Math.max(updated[lastIndex].high, newPrice),
              low: Math.min(updated[lastIndex].low, newPrice)
            };
            return updated;
          });
        }
        
        // Occasionally refresh full data
        if (Math.random() < 0.3) {
          fetchCandleData();
        }
      }, isRealTime ? 3000 : 60000); // 3 seconds for real-time updates
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [instrument, isRealTime, action]);

  const renderChart = useCallback(() => {
    const paths = generateChartPaths;
    const bounds = getChartBounds;
    const yAxisLabels = generateYAxisLabels;
    const xAxisLabels = generateXAxisLabels;
    
    return (
      <Canvas style={{ width: chartWidth, height: chartHeight }}>
        <Group>
          {/* Y-axis (Price axis) */}
          <Line
            p1={{ x: axisPadding, y: 0 }}
            p2={{ x: axisPadding, y: actualChartHeight }}
            color="rgba(128, 128, 128, 0.8)"
            strokeWidth={2}
          />
          
          {/* X-axis (Time axis) */}
          <Line
            p1={{ x: axisPadding, y: actualChartHeight }}
            p2={{ x: chartWidth, y: actualChartHeight }}
            color="rgba(128, 128, 128, 0.8)"
            strokeWidth={2}
          />
          
          {/* Grid lines (horizontal) */}
          {yAxisLabels.map((label, index) => (
            <Line
              key={`grid-h-${index}`}
              p1={{ x: axisPadding, y: label.y }}
              p2={{ x: chartWidth, y: label.y }}
              color="rgba(128, 128, 128, 0.2)"
              strokeWidth={1}
            />
          ))}
          
          {/* Grid lines (vertical) */}
          {xAxisLabels.map((label, index) => (
            <Line
              key={`grid-v-${index}`}
              p1={{ x: label.x, y: 0 }}
              p2={{ x: label.x, y: actualChartHeight }}
              color="rgba(128, 128, 128, 0.2)"
              strokeWidth={1}
            />
          ))}
          
          
          {/* Chart elements based on type */}
          {paths.map((path, index) => {
            const color = path.isGreen ? "#4CAF50" : "#F44336";
            
            switch (chartType) {
              case 'Bars':
                return (
                  <Group key={`bar-${index}`}>
                    {/* High-Low line (vertical bar) */}
                    <Line
                      p1={{ x: path.x, y: path.highY }}
                      p2={{ x: path.x, y: path.lowY }}
                      color={color}
                      strokeWidth={3}
                    />
                    
                    {/* Open tick (left horizontal line) */}
                    <Line
                      p1={{ x: path.x - 4, y: path.openY }}
                      p2={{ x: path.x, y: path.openY }}
                      color={color}
                      strokeWidth={3}
                    />
                    
                    {/* Close tick (right horizontal line) */}
                    <Line
                      p1={{ x: path.x, y: path.closeY }}
                      p2={{ x: path.x + 4, y: path.closeY }}
                      color={color}
                      strokeWidth={3}
                    />
                  </Group>
                );
                
              case 'Hollow candles':
                return (
                  <Group key={`hollow-candle-${index}`}>
                    {/* High-Low line */}
                    <Line
                      p1={{ x: path.x, y: path.highY }}
                      p2={{ x: path.x, y: path.lowY }}
                      color={color}
                      strokeWidth={1}
                    />
                    
                    {/* Hollow candle body (outline only) */}
                    <Rect
                      x={path.x - path.candleWidth / 2}
                      y={path.bodyTop}
                      width={path.candleWidth}
                      height={Math.max(path.bodyHeight, 1)}
                      color={color}
                      style="stroke"
                      strokeWidth={2}
                    />
                  </Group>
                );
                
              case 'Line':
                // For Line chart, connect close prices
                if (index === 0) return null;
                const prevPath = paths[index - 1];
                return (
                  <Line
                    key={`line-${index}`}
                    p1={{ x: prevPath.x, y: prevPath.closeY }}
                    p2={{ x: path.x, y: path.closeY }}
                    color="#1976d2"
                    strokeWidth={2}
                  />
                );
                
              case 'OHLC':
                return (
                  <Group key={`ohlc-${index}`}>
                    {/* High-Low line (vertical) */}
                    <Line
                      p1={{ x: path.x, y: path.highY }}
                      p2={{ x: path.x, y: path.lowY }}
                      color={color}
                      strokeWidth={2}
                    />
                    
                    {/* Open tick (left horizontal line) */}
                    <Line
                      p1={{ x: path.x - 6, y: path.openY }}
                      p2={{ x: path.x, y: path.openY }}
                      color={color}
                      strokeWidth={3}
                    />
                    
                    {/* Close tick (right horizontal line) */}
                    <Line
                      p1={{ x: path.x, y: path.closeY }}
                      p2={{ x: path.x + 6, y: path.closeY }}
                      color={color}
                      strokeWidth={3}
                    />
                  </Group>
                );
                
              case 'Area':
                // Area chart - filled area under line
                if (index === 0) return null;
                const prevAreaPath = paths[index - 1];
                const areaPath = Skia.Path.Make();
                areaPath.moveTo(prevAreaPath.x, actualChartHeight);
                areaPath.lineTo(prevAreaPath.x, prevAreaPath.closeY);
                areaPath.lineTo(path.x, path.closeY);
                areaPath.lineTo(path.x, actualChartHeight);
                areaPath.close();
                return (
                  <Path
                    key={`area-${index}`}
                    path={areaPath}
                    color="rgba(25, 118, 210, 0.3)"
                  />
                );
                
              case 'HLC area':
                // HLC area - area between high, low, and close
                if (index === 0) return null;
                const prevHlcPath = paths[index - 1];
                const hlcAreaPath = Skia.Path.Make();
                hlcAreaPath.moveTo(prevHlcPath.x, prevHlcPath.highY);
                hlcAreaPath.lineTo(prevHlcPath.x, prevHlcPath.lowY);
                hlcAreaPath.lineTo(path.x, path.lowY);
                hlcAreaPath.lineTo(path.x, path.highY);
                hlcAreaPath.close();
                return (
                  <Path
                    key={`hlc-area-${index}`}
                    path={hlcAreaPath}
                    color="rgba(25, 118, 210, 0.2)"
                  />
                );
                
              case 'Baseline':
                // Baseline chart - line chart with horizontal baseline
                if (index === 0) return null;
                const baselinePrice = bounds.minPrice + (bounds.priceRange / 2);
                const baselineY = priceToY(baselinePrice, bounds);
                const prevBaselinePath = paths[index - 1];
                return (
                  <Group key={`baseline-${index}`}>
                    <Line
                      p1={{ x: prevBaselinePath.x, y: prevBaselinePath.closeY }}
                      p2={{ x: path.x, y: path.closeY }}
                      color="#1976d2"
                      strokeWidth={2}
                    />
                    <Line
                      p1={{ x: prevBaselinePath.x, y: baselineY }}
                      p2={{ x: path.x, y: baselineY }}
                      color="rgba(128, 128, 128, 0.5)"
                      strokeWidth={1}
                    />
                  </Group>
                );
                
              case 'Columns':
                // Columns - vertical bars representing close price
                const columnHeight = actualChartHeight - path.closeY;
                return (
                  <Rect
                    key={`column-${index}`}
                    x={path.x - path.candleWidth / 2}
                    y={path.closeY}
                    width={path.candleWidth}
                    height={columnHeight}
                    color={color}
                  />
                );
                
              case 'High-low':
                // High-low bars - vertical lines with horizontal ticks
                return (
                  <Group key={`high-low-${index}`}>
                    <Line
                      p1={{ x: path.x, y: path.highY }}
                      p2={{ x: path.x, y: path.lowY }}
                      color={color}
                      strokeWidth={2}
                    />
                    <Line
                      p1={{ x: path.x - 3, y: path.highY }}
                      p2={{ x: path.x + 3, y: path.highY }}
                      color={color}
                      strokeWidth={2}
                    />
                    <Line
                      p1={{ x: path.x - 3, y: path.lowY }}
                      p2={{ x: path.x + 3, y: path.lowY }}
                      color={color}
                      strokeWidth={2}
                    />
                  </Group>
                );
                
              case 'Heikin Ashi':
                // Heikin Ashi candles - smoothed candle chart
                const haClose = (path.candle.open + path.candle.high + path.candle.low + path.candle.close) / 4;
                const haOpen = index === 0 
                  ? (path.candle.open + path.candle.close) / 2
                  : (paths[index - 1].candle.open + paths[index - 1].candle.close) / 2;
                const haHigh = Math.max(path.candle.high, haOpen, haClose);
                const haLow = Math.min(path.candle.low, haOpen, haClose);
                const haOpenY = priceToY(haOpen, bounds);
                const haCloseY = priceToY(haClose, bounds);
                const haHighY = priceToY(haHigh, bounds);
                const haLowY = priceToY(haLow, bounds);
                const haIsGreen = haClose > haOpen;
                const haColor = haIsGreen ? "#4CAF50" : "#F44336";
                const haBodyTop = Math.min(haOpenY, haCloseY);
                const haBodyHeight = Math.abs(haCloseY - haOpenY);
                return (
                  <Group key={`heikin-ashi-${index}`}>
                    <Line
                      p1={{ x: path.x, y: haHighY }}
                      p2={{ x: path.x, y: haLowY }}
                      color={haColor}
                      strokeWidth={1}
                    />
                    <Rect
                      x={path.x - path.candleWidth / 2}
                      y={haBodyTop}
                      width={path.candleWidth}
                      height={Math.max(haBodyHeight, 1)}
                      color={haColor}
                    />
                  </Group>
                );
                
              case 'Renko':
                // Renko chart - bricks based on price movement
                const renkoSize = bounds.priceRange * 0.01; // 1% of price range
                const renkoBricks = Math.floor(Math.abs(path.close - (index > 0 ? paths[index - 1].close : path.open)) / renkoSize);
                if (renkoBricks === 0) return null;
                const renkoDirection = path.close > (index > 0 ? paths[index - 1].close : path.open);
                const renkoColor = renkoDirection ? "#4CAF50" : "#F44336";
                const renkoY = priceToY(path.close, bounds);
                return (
                  <Rect
                    key={`renko-${index}`}
                    x={path.x - path.candleWidth}
                    y={renkoY - path.candleWidth}
                    width={path.candleWidth * 2}
                    height={path.candleWidth * 2}
                    color={renkoColor}
                    style="stroke"
                    strokeWidth={2}
                  />
                );
                
              case 'Line break':
                // Line break - line chart with breaks on direction change
                if (index === 0) return null;
                const prevLineBreak = paths[index - 1];
                const directionChanged = 
                  (path.close > prevLineBreak.close && prevLineBreak.close < (index > 1 ? paths[index - 2].close : prevLineBreak.close)) ||
                  (path.close < prevLineBreak.close && prevLineBreak.close > (index > 1 ? paths[index - 2].close : prevLineBreak.close));
                if (directionChanged) {
                  return (
                    <Line
                      key={`line-break-${index}`}
                      p1={{ x: prevLineBreak.x, y: prevLineBreak.closeY }}
                      p2={{ x: path.x, y: path.closeY }}
                      color="#1976d2"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
                
              case 'Kagi':
                // Kagi chart - connected lines that change thickness based on direction
                if (index === 0) return null;
                const prevKagi = paths[index - 1];
                const kagiDirection = path.close >= prevKagi.close;
                const kagiColor = kagiDirection ? "#4CAF50" : "#F44336";
                const kagiThickness = kagiDirection ? 3 : 2;
                return (
                  <Line
                    key={`kagi-${index}`}
                    p1={{ x: prevKagi.x, y: prevKagi.closeY }}
                    p2={{ x: path.x, y: path.closeY }}
                    color={kagiColor}
                    strokeWidth={kagiThickness}
                  />
                );
                
              case 'Point & figure':
                // Point & Figure - boxes representing price movement
                const pnfBoxSize = bounds.priceRange * 0.01;
                if (index === 0) return null;
                const prevPnf = paths[index - 1];
                const pnfChange = Math.abs(path.close - prevPnf.close);
                const pnfBoxes = Math.floor(pnfChange / pnfBoxSize);
                const pnfUp = path.close > prevPnf.close;
                const pnfColor = pnfUp ? "#4CAF50" : "#F44336";
                const pnfElements = Array.from({ length: Math.min(pnfBoxes, 5) }).map((_, i) => {
                  const boxY = priceToY(path.close - (i * pnfBoxSize), bounds);
                  return (
                    <Rect
                      key={`pnf-${index}-${i}`}
                      x={path.x - path.candleWidth / 2}
                      y={boxY - path.candleWidth / 2}
                      width={path.candleWidth}
                      height={path.candleWidth}
                      color={pnfColor}
                      style={pnfUp ? "fill" : "stroke"}
                      strokeWidth={2}
                    />
                  );
                });
                return (
                  <Group key={`pnf-group-${index}`}>
                    {pnfElements}
                  </Group>
                );
                
              case 'Line with markers':
                // Line with markers - line chart with dots
                if (index === 0) return null;
                const prevMarkerPath = paths[index - 1];
                return (
                  <Group key={`line-marker-${index}`}>
                    <Line
                      p1={{ x: prevMarkerPath.x, y: prevMarkerPath.closeY }}
                      p2={{ x: path.x, y: path.closeY }}
                      color="#1976d2"
                      strokeWidth={2}
                    />
                    <Rect
                      x={path.x - 3}
                      y={path.closeY - 3}
                      width={6}
                      height={6}
                      color="#1976d2"
                    />
                  </Group>
                );
                
              case 'Step line':
                // Step line - line chart with steps
                if (index === 0) return null;
                const prevStepPath = paths[index - 1];
                return (
                  <Group key={`step-line-${index}`}>
                    <Line
                      p1={{ x: prevStepPath.x, y: prevStepPath.closeY }}
                      p2={{ x: path.x, y: prevStepPath.closeY }}
                      color="#1976d2"
                      strokeWidth={2}
                    />
                    <Line
                      p1={{ x: path.x, y: prevStepPath.closeY }}
                      p2={{ x: path.x, y: path.closeY }}
                      color="#1976d2"
                      strokeWidth={2}
                    />
                  </Group>
                );
                
              case 'Candle':
              default:
                return (
                  <Group key={`candle-${index}`}>
                    {/* High-Low line */}
                    <Line
                      p1={{ x: path.x, y: path.highY }}
                      p2={{ x: path.x, y: path.lowY }}
                      color={color}
                      strokeWidth={1}
                    />
                    
                    {/* Filled candle body */}
                    <Rect
                      x={path.x - path.candleWidth / 2}
                      y={path.bodyTop}
                      width={path.candleWidth}
                      height={Math.max(path.bodyHeight, 1)}
                      color={color}
                    />
                  </Group>
                );
            }
          })}
        </Group>
      </Canvas>
    );
  }, [generateChartPaths, generateYAxisLabels, generateXAxisLabels, getChartBounds, chartWidth, chartHeight, axisPadding, actualChartHeight, chartType]);

  return (
    <View style={styles.container}>
      {/* Header with price info */}
      <View style={styles.header}>
        <View style={styles.priceInfo}>
          <View style={styles.instrumentRow}>
            <Text style={styles.instrumentName}>{instrument}</Text>
            <View style={styles.chartTypeIndicator}>
              <Text style={styles.chartTypeText}>{chartType}</Text>
            </View>
            <View style={styles.actionIndicator}>
              <Text style={[
                styles.actionText,
                action === 'Buy' && styles.buyActionText,
                action === 'Sell' && styles.sellActionText,
                action === 'Both' && styles.bothActionText
              ]}>
                {action}
              </Text>
            </View>
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

      {/* Toolbar with timeframe and chart type */}
      <View style={styles.toolbar}>
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
        
        {/* Chart Type Button */}
        <TouchableOpacity 
          style={styles.chartTypeButton}
          onPress={() => setShowChartTypeModal(true)}
        >
          <Ionicons 
            name={getChartIcon(chartType) as any} 
            size={18} 
            color="#1976d2" 
          />
        </TouchableOpacity>
      </View>

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
          <View style={styles.chartWithAxes}>
            {/* Y-axis labels overlay */}
            <View style={styles.yAxisContainer}>
              {generateYAxisLabels.map((label, index) => (
                <Text key={`y-label-${index}`} style={[styles.axisLabel, { top: label.y }]}>
                  ₹{label.price}
                </Text>
              ))}
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ 
                minWidth: Math.max(chartWidth, candleData.length * (candleWidth + candleSpacing) + axisPadding) 
              }}
              scrollEventThrottle={16}
            >
              <View style={styles.chartContainer}>
                {renderChart()}
                
                {/* X-axis labels overlay */}
                <View style={styles.xAxisContainer}>
                  {generateXAxisLabels.map((label, index) => (
                    <Text key={`x-label-${index}`} style={[styles.axisLabel, { left: label.x - 20 }]}>
                      {label.time}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
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

      {/* Chart Type Selection Modal */}
      <Modal visible={showChartTypeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.chartTypeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Chart Type</Text>
              <TouchableOpacity 
                onPress={() => setShowChartTypeModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.chartTypeScrollView}>
              <View style={styles.chartTypeList}>
                {([
                  'Candle', 
                  'Bars', 
                  'Hollow candles', 
                  'Line', 
                  'OHLC',
                  'Area',
                  'HLC area',
                  'Baseline',
                  'Columns',
                  'High-low',
                  'Heikin Ashi',
                  'Renko',
                  'Line break',
                  'Kagi',
                  'Point & figure',
                  'Line with markers',
                  'Step line'
                ] as ChartType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chartTypeOption,
                      chartType === type && styles.selectedChartTypeOption
                    ]}
                    onPress={() => {
                      // Update chart type via callback to parent component
                      if (onChartTypeChange) {
                        onChartTypeChange(type);
                      }
                      setShowChartTypeModal(false);
                    }}
                  >
                    <View style={styles.chartTypeOptionIcon}>
                      <Ionicons 
                        name={getChartIcon(type) as any} 
                        size={24} 
                        color={chartType === type ? '#1976d2' : '#666'} 
                      />
                    </View>
                    <Text style={[
                      styles.chartTypeOptionText,
                      chartType === type && styles.selectedChartTypeOptionText
                    ]}>
                      {type}
                    </Text>
                    {chartType === type && (
                      <Ionicons name="checkmark" size={20} color="#1976d2" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  chartTypeIndicator: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1976d2',
    marginRight: 8,
  },
  chartTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  actionIndicator: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  actionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  buyActionText: {
    color: '#4caf50',
  },
  sellActionText: {
    color: '#f44336',
  },
  bothActionText: {
    color: '#1976d2',
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeframeContainer: {
    flex: 1,
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
  chartArea: {
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
  chartWithAxes: {
    position: 'relative',
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
  },
  xAxisContainer: {
    position: 'absolute',
    left: 40,
    right: 0,
    bottom: 0,
    height: 30,
    zIndex: 10,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(128, 128, 128, 0.8)',
    fontWeight: '500',
  },
  chartContainer: {
    position: 'relative',
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
  chartTypeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  chartTypeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  chartTypeScrollView: {
    maxHeight: 500,
  },
  chartTypeList: {
    paddingHorizontal: 20,
  },
  chartTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedChartTypeOption: {
    backgroundColor: '#e3f2fd',
  },
  chartTypeOptionIcon: {
    marginRight: 16,
    width: 30,
    alignItems: 'center',
  },
  chartTypeOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedChartTypeOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
});

export default CandleChart;