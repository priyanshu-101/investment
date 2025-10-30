import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Note: Using React Native's built-in Picker for now
// For production, consider using @react-native-picker/picker
import { useAuth } from '../../contexts/AuthContext';
import { kiteConnect } from '../../services/kiteConnect';
import { marketDataService } from '../../services/marketDataApi';
import { StrategyApiData } from '../../services/strategiesApi';
import CandleChart from '../candlechart';
import { PasswordModal } from '../password-modal';

interface CandlePattern {
  id: string;
  name: string;
  type: 'bullish' | 'bearish';
}

interface OrderLeg {
  id: string;
  action: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit' | 'SL' | 'SL-M';
  quantity: string;
  instrument: string;
  lotSize: number;
  entryCondition?: {
    candleType: string;
    candleColor: string;
    candleTime: string;
  };
  exitCondition?: {
    candleType: string;
    candleColor: string;
    profitTarget: string;
    stopLoss: string;
  };
}

interface ExitLeg {
  id: string;
  action: 'Sell';
  orderType: 'Market' | 'Limit' | 'SL' | 'SL-M';
  quantity: string;
  instrument: string;
  condition?: string;
  priceOffset?: string;
  triggerType?: 'LTP' | 'Target' | 'OffsetFromEntry';
}

interface TradingStrategyProps {
  onStrategyCreated?: (strategyData: any) => void;
  navigation?: any;
}

const TradingStrategy = ({ onStrategyCreated, navigation }: TradingStrategyProps) => {
  const { user } = useAuth();
  
  // Existing state
  const [selectedStrategyType, setSelectedStrategyType] = useState('Time Based');
  const [selectedChartType, setSelectedChartType] = useState('Candle');
  const [selectedOrderType, setSelectedOrderType] = useState('MIS');
  const [selectedTransactionType, setSelectedTransactionType] = useState('Buy');
  const [startTime, setStartTime] = useState('09:16');
  const [squareOffTime, setSquareOffTime] = useState('15:15');
  const [selectedDays, setSelectedDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [strategyName, setStrategyName] = useState('');
  const [exitProfitAmount] = useState('5000');
  const [exitLossAmount] = useState('1000');
  const [noTradeAfterTime] = useState('15:15');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [availableInstruments, setAvailableInstruments] = useState<string[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(false);
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState('');

  // Enhanced candle-based strategy state
  const [selectedInterval, setSelectedInterval] = useState('1M');
  const [orderLegs, setOrderLegs] = useState<OrderLeg[]>([]);
  const [showOrderLegModal, setShowOrderLegModal] = useState(false);
  const [currentEditingLeg, setCurrentEditingLeg] = useState<OrderLeg | null>(null);
  const [riskRewardRatio, setRiskRewardRatio] = useState('1:3');
  const [overallStopLoss, setOverallStopLoss] = useState(true);
  const [overallProfit, setOverallProfit] = useState(true);
  const [maxLossAmount, setMaxLossAmount] = useState('1000');
  const [maxProfitAmount, setMaxProfitAmount] = useState('5000');
  
  // Entry Conditions
  const [firstCandleColor, setFirstCandleColor] = useState('Green');
  const [firstCandleTiming, setFirstCandleTiming] = useState('Start');
  const [secondCandleColor, setSecondCandleColor] = useState('Red');
  const [secondCandleTiming, setSecondCandleTiming] = useState('Close');
  const [candleTimeSelection, setCandleTimeSelection] = useState('Start');
  const [timeRange, setTimeRange] = useState('1 sec to 10 sec');
  
  // Order Leg Configuration
  const [selectedOrderAction, setSelectedOrderAction] = useState('Buy');
  const [lotSize, setLotSize] = useState('75');
  const [optionType, setOptionType] = useState('CE');
  const [expiryType, setExpiryType] = useState('Weekly');
  const [moneynessType, setMoneynessType] = useState('ATM');
  const [entryPriceType, setEntryPriceType] = useState('Market');
  const [atmStrike, setAtmStrike] = useState('OTM-1');
  const [stopLossType, setStopLossType] = useState('Previous Candle - High');
  const [slTrailType, setSlTrailType] = useState('On Candle Close');
  
  // Exit Conditions
  const [exitOptionType, setExitOptionType] = useState('CE');
  const [exitCandleTiming, setExitCandleTiming] = useState('Start');
  const [exitCandleColor, setExitCandleColor] = useState('Green');
  const [exitSlHit, setExitSlHit] = useState(false);
  
  // Exit Condition Legs
  const [exitLegsIndex, setExitLegsIndex] = useState<ExitLeg[]>([]);
  const [exitLegsSelling, setExitLegsSelling] = useState<ExitLeg[]>([]);
  const [showExitLegModal, setShowExitLegModal] = useState(false);
  const [currentEditingExitLeg, setCurrentEditingExitLeg] = useState<ExitLeg | null>(null);
  const [exitLegType, setExitLegType] = useState<'index' | 'selling'>('index');
  
  // Modal states for dropdowns
  const [showCandleColorModal, setShowCandleColorModal] = useState(false);
  const [showCandleTimingModal, setShowCandleTimingModal] = useState(false);
  const [showLotSizeModal, setShowLotSizeModal] = useState(false);
  const [showMoneynessModal, setShowMoneynessModal] = useState(false);
  const [showAtmStrikeModal, setShowAtmStrikeModal] = useState(false);
  const [showSlTypeModal, setShowSlTypeModal] = useState(false);
  const [showSlTrailModal, setShowSlTrailModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [showChartTypeModal, setShowChartTypeModal] = useState(false);
  const [currentDropdownType, setCurrentDropdownType] = useState('');
  
  // Dynamic data from Zerodha
  const [liveQuotes, setLiveQuotes] = useState<any>({});
  const [candleData, setCandleData] = useState<any>({});
  const [loadingMarketData, setLoadingMarketData] = useState(false);

  // Password protection for candle strategy
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Live candle chart state
  const [showLiveChart, setShowLiveChart] = useState(false);
  const [selectedChartInstrument, setSelectedChartInstrument] = useState<string>('');
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);

  // Password verification handlers
  const handlePasswordSuccess = () => {
    setIsPasswordVerified(true);
    setSelectedStrategyType('Candle Based');
  };

  const handlePasswordClose = () => {
    setShowPasswordModal(false);
  };

  // Handle candle pattern detection
  const handleCandlePatternDetected = (pattern: string) => {
    setDetectedPatterns(prev => {
      if (!prev.includes(pattern)) {
        return [...prev, pattern];
      }
      return prev;
    });
  };

  // Show live chart for selected instrument
  const showLiveChartForInstrument = (instrument: string) => {
    setSelectedChartInstrument(instrument);
    setShowLiveChart(true);
    // Clear previous patterns when switching instruments
    setDetectedPatterns([]);
  };

  const handleStrategyTypePress = (type: string) => {
    if (type === 'Candle Based' && !isPasswordVerified) {
      setShowPasswordModal(true);
    } else {
      setSelectedStrategyType(type);
    }
  };

  const strategyTypes = ['Candle Based', 'Time Based', 'Indicator Based'];
  const chartTypes = ['Candle', 'Bars', 'Hollow candles', 'Line', 'OHLC'];
  const orderTypes = ['MIS', 'CNC', 'BTST'];
  const transactionTypes = ['Buy', 'Sell', 'Both'];
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const intervals = ['1M', '3M', '5M', '10M', '15M', '30M', '1H', '4H', '1Day'];

  const candlePatterns: CandlePattern[] = [
    { id: '1', name: 'Green/Red', type: 'bullish' },
    { id: '2', name: 'Doji', type: 'bullish' },
    { id: '3', name: 'Hammer', type: 'bullish' },
    { id: '4', name: 'Shooting Star', type: 'bearish' },
    { id: '5', name: 'Engulfing Bull', type: 'bullish' },
    { id: '6', name: 'Engulfing Bear', type: 'bearish' },
    { id: '7', name: 'Morning Star', type: 'bullish' },
    { id: '8', name: 'Evening Star', type: 'bearish' },
  ];

  // Dropdown data
  const candleColors = ['Green', 'Red'];
  const candleTimings = ['Start', 'Close'];
  const lotSizes = ['25', '50', '75', '100', '125', '150'];
  const moneynessTypes = ['ATM', 'ITM', 'OTM'];
  const atmStrikes = ['ITM-5', 'ITM-3', 'ITM-2', 'ITM-1', 'ATM', 'OTM-1', 'OTM-2', 'OTM-3', 'OTM-5'];
  const slTypes = ['Previous Candle - High', 'Previous Candle - Low', 'SAME Candle - High', 'SAME Candle - Low'];
  const slTrailTypes = ['On Candle Close', 'On Candle Start', 'On Price Movement'];
  const timeRanges = ['1 sec to 10 sec', '1 sec to 30 sec', '1 sec to 60 sec', '5 sec to 30 sec'];

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
      default:
        return 'bar-chart';
    }
  };

  // Dropdown handlers
  const handleDropdownSelect = (type: string, value: string) => {
    switch (type) {
      case 'firstCandleColor':
        setFirstCandleColor(value);
        break;
      case 'firstCandleTiming':
        setFirstCandleTiming(value);
        break;
      case 'secondCandleColor':
        setSecondCandleColor(value);
        break;
      case 'secondCandleTiming':
        setSecondCandleTiming(value);
        break;
      case 'candleTimeSelection':
        setCandleTimeSelection(value);
        break;
      case 'timeRange':
        setTimeRange(value);
        break;
      case 'lotSize':
        setLotSize(value);
        break;
      case 'moneynessType':
        setMoneynessType(value);
        break;
      case 'atmStrike':
        setAtmStrike(value);
        break;
      case 'stopLossType':
        setStopLossType(value);
        break;
      case 'slTrailType':
        setSlTrailType(value);
        break;
    }
  };

  // Fetch live market data from Zerodha
  const fetchMarketData = useCallback(async () => {
    if (!selectedInstruments.length) {
      return;
    }

    setLoadingMarketData(true);
    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) {
        console.log('Not authenticated with Zerodha - using mock data');
        // Use mock data when not authenticated
        const mockQuotes: any = {};
        selectedInstruments.forEach(instrument => {
          mockQuotes[instrument] = {
            last_price: Math.floor(Math.random() * 1000) + 100,
            net_change: (Math.random() - 0.5) * 50,
            net_change_percent: (Math.random() - 0.5) * 5
          };
        });
        setLiveQuotes(mockQuotes);
        setLoadingMarketData(false);
        return;
      }

      // Get live quotes for selected instruments
      const quotes = await kiteConnect.getQuote(selectedInstruments);
      setLiveQuotes(quotes);

      // Get historical candle data
      const candlePromises = selectedInstruments.map(async (instrument) => {
        try {
          const from = new Date();
          from.setDate(from.getDate() - 7); // Last 7 days
          const to = new Date();

          const candles = await kiteConnect.getHistoricalData(
            instrument,
            selectedInterval.toLowerCase(),
            from.toISOString().split('T')[0],
            to.toISOString().split('T')[0]
          );
          return { instrument, candles };
        } catch (error) {
          console.error(`Error fetching candles for ${instrument}:`, error);
          return { instrument, candles: [] };
        }
      });

      const candleResults = await Promise.all(candlePromises);
      const candleMap: any = {};
      candleResults.forEach((result) => {
        candleMap[result.instrument] = result.candles;
      });
      setCandleData(candleMap);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoadingMarketData(false);
    }
  }, [selectedInstruments, selectedInterval]);

  const fetchInstruments = useCallback(async () => {
    setLoadingInstruments(true);
    try {
      let instruments: string[] = [];

      // First try to get market indices from API
      try {
        const marketIndices = await marketDataService.getMarketIndices();
        const indexSymbols = marketIndices.map((index) => index.name);
        instruments = [...instruments, ...indexSymbols];
      } catch (error) {
        console.log('Market indices API failed:', error);
      }

      // Try to get instruments from Zerodha API if authenticated
      const isAuthenticated = await kiteConnect.isAuthenticated();
      if (isAuthenticated) {
        try {
          console.log('Fetching instruments from Zerodha API...');
          const allInstruments = await kiteConnect.getInstruments();
          
          const kiteInstruments = allInstruments
            .filter((instrument: any) => {
              const symbol = instrument.tradingsymbol || instrument.trading_symbol;
              const exchange = instrument.exchange;
              const instrumentType = instrument.instrument_type;

              return (
                (exchange === 'NSE' && instrumentType === 'EQ') ||
                (exchange === 'NSE' && symbol?.includes('NIFTY')) ||
                (exchange === 'BSE' && symbol?.includes('SENSEX'))
              );
            })
            .map((instrument: any) => instrument.tradingsymbol || instrument.trading_symbol)
            .filter((symbol: string) => symbol && symbol.length > 0)
            .slice(0, 300); // Increased limit for more instruments

          instruments = [...instruments, ...kiteInstruments];
          console.log(`Fetched ${kiteInstruments.length} instruments from Zerodha`);
        } catch (error) {
          console.log('Zerodha instruments API failed:', error);
        }
      }

      // If no instruments from APIs, show error
      if (instruments.length === 0) {
        throw new Error('No instruments available from any API source');
      }

      setAvailableInstruments([...new Set(instruments)].sort());
      console.log(`Total unique instruments loaded: ${instruments.length}`);
    } catch (error) {
      console.error('Failed to fetch instruments:', error);
      setAvailableInstruments([]);
      Alert.alert(
        'API Error', 
        'Unable to fetch instruments from API. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: fetchInstruments }]
      );
    } finally {
      setLoadingInstruments(false);
    }
  }, []);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  useEffect(() => {
    if (selectedInstruments.length > 0) {
      fetchMarketData();
      
      // Auto-select first instrument for live chart if none selected
      if (selectedStrategyType === 'Candle Based' && !selectedChartInstrument && selectedInstruments.length > 0) {
        setSelectedChartInstrument(selectedInstruments[0]);
      }
    }
  }, [fetchMarketData, selectedInstruments, selectedStrategyType, selectedChartInstrument]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addOrderLeg = () => {
    const newLeg: OrderLeg = {
      id: Date.now().toString(),
      action: 'Buy',
      orderType: 'Market',
      quantity: '1',
      instrument: selectedInstruments[0] || '',
      lotSize: 1,
      entryCondition: {
        candleType: 'Green/Red',
        candleColor: 'Green',
        candleTime: '09:15',
      },
      exitCondition: {
        candleType: 'Green/Red',
        candleColor: 'Red',
        profitTarget: '100',
        stopLoss: '50',
      }
    };
    setCurrentEditingLeg(newLeg);
    setShowOrderLegModal(true);
  };

  const saveOrderLeg = (leg: OrderLeg) => {
    const existingIndex = orderLegs.findIndex(l => l.id === leg.id);
    if (existingIndex >= 0) {
      const updatedLegs = [...orderLegs];
      updatedLegs[existingIndex] = leg;
      setOrderLegs(updatedLegs);
    } else {
      setOrderLegs(prev => [...prev, leg]);
    }
    setShowOrderLegModal(false);
    setCurrentEditingLeg(null);
  };

  const deleteOrderLeg = (id: string) => {
    setOrderLegs(prev => prev.filter(leg => leg.id !== id));
  };

  const addExitLeg = (type: 'index' | 'selling') => {
    const newExitLeg: ExitLeg = {
      id: Date.now().toString(),
      action: 'Sell',
      orderType: 'Market',
      quantity: '1',
      instrument: selectedInstruments[0] || '',
      triggerType: 'LTP',
      priceOffset: '10',
      condition: 'When LTP ≥ Entry Price + 10',
    };
    setCurrentEditingExitLeg(newExitLeg);
    setExitLegType(type);
    setShowExitLegModal(true);
  };

  const saveExitLeg = (leg: ExitLeg) => {
    if (exitLegType === 'index') {
      const existingIndex = exitLegsIndex.findIndex(l => l.id === leg.id);
      if (existingIndex >= 0) {
        const updatedLegs = [...exitLegsIndex];
        updatedLegs[existingIndex] = leg;
        setExitLegsIndex(updatedLegs);
      } else {
        setExitLegsIndex(prev => [...prev, leg]);
      }
    } else {
      const existingIndex = exitLegsSelling.findIndex(l => l.id === leg.id);
      if (existingIndex >= 0) {
        const updatedLegs = [...exitLegsSelling];
        updatedLegs[existingIndex] = leg;
        setExitLegsSelling(updatedLegs);
      } else {
        setExitLegsSelling(prev => [...prev, leg]);
      }
    }
    setShowExitLegModal(false);
    setCurrentEditingExitLeg(null);
  };

  const deleteExitLeg = (id: string, type: 'index' | 'selling') => {
    if (type === 'index') {
      setExitLegsIndex(prev => prev.filter(leg => leg.id !== id));
    } else {
      setExitLegsSelling(prev => prev.filter(leg => leg.id !== id));
    }
  };

  // Map strategy types to product categories
  const getStrategyCategory = (strategyType: string, instruments: string[]): string => {
    // Check if instruments contain index-related symbols
    const indexKeywords = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
    const hasIndexInstruments = instruments.some(instrument => 
      indexKeywords.some(keyword => instrument.toUpperCase().includes(keyword))
    );

    // Check if instruments contain commodity-related symbols
    const commodityKeywords = ['GOLD', 'SILVER', 'CRUDE', 'NATURALGAS', 'COPPER'];
    const hasCommodityInstruments = instruments.some(instrument => 
      commodityKeywords.some(keyword => instrument.toUpperCase().includes(keyword))
    );

    // Check if instruments contain FNO-related symbols (options/futures)
    const fnoKeywords = ['CE', 'PE', 'FUT'];
    const hasFnoInstruments = instruments.some(instrument => 
      fnoKeywords.some(keyword => instrument.toUpperCase().includes(keyword))
    );

    // Determine category based on strategy type and instruments
    if (strategyType === 'Candle Based') {
      if (hasIndexInstruments) return 'Index Algo';
      if (hasCommodityInstruments) return 'Commodity Algo';
      if (hasFnoInstruments) return 'FNO';
      return 'Stock Algo';
    } else if (strategyType === 'Time Based') {
      if (hasIndexInstruments) return 'Index Algo';
      if (hasCommodityInstruments) return 'Commodity Algo';
      if (hasFnoInstruments) return 'FNO';
      return 'Stock Algo';
    } else if (strategyType === 'Indicator Based') {
      return 'Deploy Strategy';
    }

    // Default fallback
    return 'Stock Algo';
  };

  // Save strategy to user-specific storage organized by categories
  const saveStrategyToStorage = async (strategyData: any) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in to save strategies.');
      return false;
    }

    try {
      // Determine the category for this strategy
      const strategyCategory = getStrategyCategory(strategyData.selectedStrategyType, strategyData.instruments);
      
      // Create category-specific storage key
      const categoryKey = `createdStrategies_${user.id}_${strategyCategory.replace(/\s+/g, '_')}`;
      const existingStrategies = await AsyncStorage.getItem(categoryKey);
      const strategies: StrategyApiData[] = existingStrategies ? JSON.parse(existingStrategies) : [];

      // Create a new strategy object with proper structure
      const newStrategy: StrategyApiData = {
        id: Date.now().toString(),
        name: strategyData.strategyName,
        shortName: strategyData.strategyName.substring(0, 10) + '...',
        category: strategyCategory, // Use the determined category
        strategyType: strategyData.selectedStrategyType,
        description: `${strategyData.selectedStrategyType} strategy for ${strategyData.instruments.join(', ')}`,
        totalReturn: 0, // Will be calculated later
        winRate: 0, // Will be calculated later
        sharpeRatio: 0, // Will be calculated later
        maxDrawdown: 0, // Will be calculated later
        margin: 0, // Will be calculated later
        performance: [], // Will be populated later
        risk: 'Medium' as const,
        isActive: false,
        createdAt: new Date().toISOString(),
        fullStrategyData: strategyData,
        userId: user.id,
        instruments: strategyData.instruments,
      };

      // Add the new strategy to the beginning of the array
      const updatedStrategies = [newStrategy, ...strategies];
      
      // Save to category-specific AsyncStorage
      await AsyncStorage.setItem(categoryKey, JSON.stringify(updatedStrategies));
      
      // Also save to the general strategies list for backward compatibility
      const generalKey = `createdStrategies_${user.id}`;
      const generalStrategies = await AsyncStorage.getItem(generalKey);
      const allStrategies: StrategyApiData[] = generalStrategies ? JSON.parse(generalStrategies) : [];
      const updatedAllStrategies = [newStrategy, ...allStrategies];
      await AsyncStorage.setItem(generalKey, JSON.stringify(updatedAllStrategies));
      
      console.log(`Strategy saved to category: ${strategyCategory}`);
      return true;
    } catch (error) {
      console.error('Error saving strategy:', error);
      Alert.alert('Error', 'Failed to save strategy. Please try again.');
      return false;
    }
  };

  const handleSaveStrategy = async () => {
    if (!strategyName.trim()) {
      Alert.alert('Error', 'Please enter a strategy name');
      return;
    }

    if (selectedInstruments.length === 0) {
      Alert.alert('Error', 'Please select at least one instrument');
      return;
    }

    if (selectedStrategyType === 'Candle Based' && orderLegs.length === 0) {
      Alert.alert('Error', 'Please add at least one order leg for candle-based strategy');
      return;
    }

    const strategyData = {
      strategyName: strategyName.trim(),
      selectedStrategyType,
      selectedChartType,
      selectedOrderType,
      selectedTransactionType,
      startTime,
      squareOffTime,
      selectedDays,
      selectedInterval,
      instruments: selectedInstruments,
      orderLegs,
      exitConditions: {
        exitLegsIndex,
        exitLegsSelling,
        exitOptionType,
        exitCandleTiming,
        exitCandleColor,
        exitSlHit,
      },
      chartConfiguration: {
        supportedChartTypes: ['Candle', 'Bars', 'Hollow candles', 'Line', 'OHLC'],
        defaultChartType: selectedChartType,
        dynamicChartSwitching: true,
      },
      riskManagement: {
        riskRewardRatio,
        overallStopLoss,
        overallProfit,
        maxLossAmount,
        maxProfitAmount,
        exitProfitAmount,
        exitLossAmount,
        noTradeAfterTime,
      },
      marketData: {
        liveQuotes,
        candleData,
      },
      createdAt: new Date().toISOString(),
    };

    console.log('Saving strategy:', strategyData);
    
    // Save strategy to user-specific storage
    const saveSuccess = await saveStrategyToStorage(strategyData);
    
    if (!saveSuccess) {
      return; // Error already handled in saveStrategyToStorage
    }
    
    // Get the category for display
    const strategyCategory = getStrategyCategory(strategyData.selectedStrategyType, strategyData.instruments);
    
    if (onStrategyCreated) {
      onStrategyCreated(strategyData);
    }

    if (selectedStrategyType === 'Candle Based') {
      // Navigate to live chart screen for candle-based strategies
      if (navigation) {
        navigation.navigate('live-chart-screen', {
          strategyData: JSON.stringify(strategyData),
          instruments: JSON.stringify(selectedInstruments),
          interval: selectedInterval,
          chartType: selectedChartType
        });
      } else {
        Alert.alert('Success', `Strategy created and saved to ${strategyCategory} category! Navigate to Live Charts to view real-time data.`);
      }
    } else {
      Alert.alert('Success', `Strategy created and saved to ${strategyCategory} category!`, [
        {
          text: 'OK',
          style: 'default'
        }
      ]);
    }
    
    // Reset form
    setStrategyName('');
    setOrderLegs([]);
    setSelectedInstruments([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Strategy Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategy Type</Text>
          <View style={styles.tabContainer}>
            {strategyTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.tab,
                  selectedStrategyType === type && styles.activeTab
                ]}
                onPress={() => handleStrategyTypePress(type)}
              >
                <View style={styles.tabContent}>
                  <Text style={[
                    styles.tabText,
                    selectedStrategyType === type && styles.activeTabText
                  ]}>
                    {type}
                  </Text>
                  {type === 'Candle Based' && !isPasswordVerified && (
                    <Ionicons 
                      name="lock-closed" 
                      size={16} 
                      color={selectedStrategyType === type ? "#fff" : "#666"} 
                      style={styles.lockIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart Type Dropdown - Only for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chart Type</Text>
            <TouchableOpacity 
              style={styles.chartTypeSelector}
              onPress={() => setShowChartTypeModal(true)}
            >
              <View style={styles.chartTypeButton}>
                <View style={styles.chartTypeIconContainer}>
                  <Ionicons 
                    name={getChartIcon(selectedChartType) as any} 
                    size={20} 
                    color="#1976d2" 
                  />
                </View>
                <Text style={styles.chartTypeButtonText}>{selectedChartType}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Instruments Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Instruments</Text>
          {selectedInstruments.length > 0 && (
            <View style={styles.selectedInstruments}>
              {selectedInstruments.map((instrument, index) => (
                <View key={index} style={styles.instrumentChip}>
                  <Text style={styles.instrumentChipText}>{instrument}</Text>
                  <View style={styles.instrumentPrice}>
                    {liveQuotes[instrument] && (
                      <Text style={styles.priceText}>
                        ₹{liveQuotes[instrument].last_price?.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedInstruments(prev => prev.filter((_, i) => i !== index))}
                    style={styles.removeInstrument}
                  >
                    <Text style={styles.removeInstrumentText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity 
            style={styles.addInstrumentsBox}
            onPress={() => {
              if (availableInstruments.length === 0 && !loadingInstruments) {
                fetchInstruments();
              }
              setShowInstrumentModal(true);
            }}
          >
            <Text style={styles.plusIcon}>+</Text>
            <Text style={styles.addInstrumentsText}>
              {loadingInstruments ? 'Loading Instruments...' : 'Add Instruments.'}
            </Text>
          </TouchableOpacity>
        </View>



        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.orderTypeLabel}>Transaction Type</Text>
          <View style={styles.radioContainer}>
            {transactionTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() => setSelectedTransactionType(type)}
              >
                <View style={styles.radioButton}>
                  {selectedTransactionType === type && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Type */}
        <View style={styles.section}>
          <Text style={styles.orderTypeLabel}>Order Type</Text>
          <View style={styles.radioContainer}>
            {orderTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() => setSelectedOrderType(type)}
              >
                <View style={styles.radioButton}>
                  {selectedOrderType === type && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Settings */}
        <View style={styles.timeSection}>
          <View style={styles.timeInputContainer}>
            <Text style={styles.timeLabel}>Start time</Text>
            <View style={styles.timeInputWrapper}>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:16"
              />
              <Ionicons name="time-outline" size={20} color="#666" />
            </View>
          </View>

          <View style={styles.timeInputContainer}>
            <Text style={styles.timeLabel}>Square off</Text>
            <View style={styles.timeInputWrapper}>
              <TextInput
                style={styles.timeInput}
                value={squareOffTime}
                onChangeText={setSquareOffTime}
                placeholder="15:15"
              />
              <Ionicons name="time-outline" size={20} color="#666" />
            </View>
          </View>
        </View>

        {/* Trading Days */}
        <View style={styles.daysContainer}>
          {weekDays.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDays.includes(day) && styles.activeDayButton
              ]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[
                styles.dayText,
                selectedDays.includes(day) && styles.activeDayText
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interval Selection for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interval</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.intervalContainer}>
              {intervals.map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.intervalButton,
                    selectedInterval === interval && styles.activeIntervalButton
                  ]}
                  onPress={() => setSelectedInterval(interval)}
                >
                  <Text style={[
                    styles.intervalText,
                    selectedInterval === interval && styles.activeIntervalText
                  ]}>
                    {interval}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Live Market Candle Display for Candle Based Strategies */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <View style={styles.liveChartHeader}>
              <Text style={styles.sectionTitle}>Live Market Candles</Text>
              <View style={styles.liveChartControls}>
                <TouchableOpacity 
                  style={styles.liveChartToggle}
                  onPress={() => setShowLiveChart(!showLiveChart)}
                >
                  <Ionicons 
                    name={showLiveChart ? "eye-off" : "eye"} 
                    size={16} 
                    color="#1976d2" 
                  />
                  <Text style={styles.liveChartToggleText}>
                    {showLiveChart ? 'Hide' : 'Show'} Live Chart
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* No Instruments Selected Message */}
            {selectedInstruments.length === 0 && (
              <View style={styles.noInstrumentsContainer}>
                <Ionicons name="information-circle" size={24} color="#1976d2" />
                <Text style={styles.noInstrumentsText}>
                  Please select instruments above to view live market candles
                </Text>
              </View>
            )}

            {/* Detected Patterns Display */}
            {detectedPatterns.length > 0 && (
              <View style={styles.patternsContainer}>
                <Text style={styles.patternsTitle}>Detected Patterns:</Text>
                <View style={styles.patternsList}>
                  {detectedPatterns.map((pattern, index) => (
                    <View key={index} style={styles.patternChip}>
                      <Text style={styles.patternText}>{pattern}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instrument Selection for Live Chart */}
            {showLiveChart && (
              <View style={styles.instrumentChartSelector}>
                <Text style={styles.chartSelectorLabel}>Select Instrument for Live Chart:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.instrumentChartList}>
                  {selectedInstruments.map((instrument) => (
                    <TouchableOpacity
                      key={instrument}
                      style={[
                        styles.instrumentChartButton,
                        selectedChartInstrument === instrument && styles.selectedInstrumentChartButton
                      ]}
                      onPress={() => showLiveChartForInstrument(instrument)}
                    >
                      <Text style={[
                        styles.instrumentChartText,
                        selectedChartInstrument === instrument && styles.selectedInstrumentChartText
                      ]}>
                        {instrument}
                      </Text>
                      {liveQuotes[instrument] && (
                        <Text style={styles.instrumentChartPrice}>
                          ₹{liveQuotes[instrument].last_price?.toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Live Candle Chart */}
            {showLiveChart && selectedChartInstrument && (
              <View style={styles.liveChartContainer}>
                <CandleChart
                  instrument={selectedChartInstrument}
                  interval={selectedInterval}
                  height={350}
                  isRealTime={true}
                  chartType={selectedChartType as 'Candle' | 'Bars' | 'Hollow candles' | 'Line' | 'OHLC'}
                  onCandlePatternDetected={handleCandlePatternDetected}
                  action={selectedTransactionType as 'Buy' | 'Sell' | 'Both'}
                />
              </View>
            )}

            {/* Market Status Indicator */}
            {selectedInstruments.length > 0 && (
              <View style={styles.marketStatusContainer}>
                <View style={styles.marketStatusHeader}>
                  <Ionicons name="pulse" size={16} color="#4CAF50" />
                  <Text style={styles.marketStatusTitle}>Market Status</Text>
                </View>
                <View style={styles.marketStatusGrid}>
                  {selectedInstruments.slice(0, 3).map((instrument) => {
                    const quote = liveQuotes[instrument];
                    return (
                      <View key={instrument} style={styles.marketStatusItem}>
                        <Text style={styles.marketStatusInstrument}>{instrument}</Text>
                        <Text style={styles.marketStatusPrice}>
                          ₹{quote?.last_price?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={[
                          styles.marketStatusChange,
                          quote?.net_change >= 0 ? styles.positiveChange : styles.negativeChange
                        ]}>
                          {quote?.net_change >= 0 ? '+' : ''}{quote?.net_change?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Enhanced Entry Conditions for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entry Condition</Text>
            
            {/* First Candle Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Select Candle I</Text>
              <View style={styles.conditionControls}>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setCurrentDropdownType('firstCandleColor');
                      setShowCandleColorModal(true);
                    }}
                  >
                    <Text style={styles.dropdownText}>{firstCandleColor}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setCurrentDropdownType('firstCandleTiming');
                      setShowCandleTimingModal(true);
                    }}
                  >
                    <Text style={styles.dropdownText}>{firstCandleTiming}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Second Candle Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Select Candle II</Text>
              <View style={styles.conditionControls}>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity style={styles.dropdownButton}>
                    <Text style={styles.dropdownText}>{secondCandleColor}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity style={styles.dropdownButton}>
                    <Text style={styles.dropdownText}>{secondCandleTiming}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Candle Time Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Select II Candle Time</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>{candleTimeSelection}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Range */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Time Range</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>{timeRange}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.addLegButton}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addLegText}>+ ADD LEG</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Order Leg Section for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Leg</Text>
            
            {/* Buy/Sell Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Buy/Sell</Text>
              <View style={styles.radioContainer}>
                {['Buy', 'Sell'].map((action) => (
                  <TouchableOpacity
                    key={action}
                    style={styles.radioOption}
                    onPress={() => setSelectedOrderAction(action)}
                  >
                    <View style={styles.radioButton}>
                      {selectedOrderAction === action && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lot Size */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Lot</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {
                    setCurrentDropdownType('lotSize');
                    setShowLotSizeModal(true);
                  }}
                >
                  <Text style={styles.dropdownText}>Lot → {lotSize}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* CE/PE Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>CE/PE</Text>
              <View style={styles.radioContainer}>
                {['CE', 'PE'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setOptionType(type)}
                  >
                    <View style={styles.radioButton}>
                      {optionType === type && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Weekly/Monthly */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Weekly/Monthly</Text>
              <View style={styles.radioContainer}>
                {['Weekly', 'Monthly'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setExpiryType(type)}
                  >
                    <View style={styles.radioButton}>
                      {expiryType === type && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ATM/ITM/OTM */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>ATM/ITM/OTM</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>{moneynessType}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Entry Price */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Entry - ON Market price</Text>
              <View style={styles.radioContainer}>
                {['Market', 'Limit'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setEntryPriceType(type)}
                  >
                    <View style={styles.radioButton}>
                      {entryPriceType === type && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ATM Options */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>ATM Options</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>{atmStrike}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stop Loss Configuration */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>SL - Previous Candle - High / SAME Candle - Low</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>{stopLossType}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SL Trail */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>SL Trail</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton}>
                  <Text style={styles.dropdownText}>{slTrailType}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>THEN Previous-I / Low ok</Text>
              <TouchableOpacity style={styles.okButton}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Legs Section */}
        <View style={styles.section}>
          <View style={styles.orderLegsHeader}>
            <Text style={styles.orderLegsTitle}>
              {selectedStrategyType === 'Candle Based' ? 'Configured Order Legs' : 'Order Legs'}
            </Text>
            <TouchableOpacity style={styles.addLegButton} onPress={addOrderLeg}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addLegText}>ADD LEG</Text>
            </TouchableOpacity>
          </View>

          {orderLegs.map((leg) => (
            <View key={leg.id} style={styles.orderLegCard}>
              <View style={styles.orderLegHeader}>
                <Text style={styles.orderLegTitle}>
                  {leg.action} {leg.instrument} - {leg.quantity} Qty
                </Text>
                <View style={styles.orderLegActions}>
                  <TouchableOpacity 
                    onPress={() => {
                      setCurrentEditingLeg(leg);
                      setShowOrderLegModal(true);
                    }}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color="#1976d2" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => deleteOrderLeg(leg.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={16} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {selectedStrategyType === 'Candle Based' && (
                <View style={styles.orderLegDetails}>
                  <Text style={styles.conditionText}>
                    Entry: {leg.entryCondition?.candleType} - {leg.entryCondition?.candleColor} at {leg.entryCondition?.candleTime}
                  </Text>
                  <Text style={styles.conditionText}>
                    Exit: {leg.exitCondition?.candleType} - {leg.exitCondition?.candleColor}
                  </Text>
                  <Text style={styles.conditionText}>
                    Target: ₹{leg.exitCondition?.profitTarget} | SL: ₹{leg.exitCondition?.stopLoss}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Exit Conditions for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <>
            {/* Exit Condition - Buying */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exit Condition - Buying</Text>
              
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Exit CE/PE</Text>
                <View style={styles.radioContainer}>
                  {['CE', 'PE'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.radioOption}
                      onPress={() => setExitOptionType(type)}
                    >
                      <View style={styles.radioButton}>
                        {exitOptionType === type && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Candle Start/Close</Text>
                <View style={styles.radioContainer}>
                  {['Start', 'Close'].map((timing) => (
                    <TouchableOpacity
                      key={timing}
                      style={styles.radioOption}
                      onPress={() => setExitCandleTiming(timing)}
                    >
                      <View style={styles.radioButton}>
                        {exitCandleTiming === timing && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>{timing}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Green/Red</Text>
                <View style={styles.radioContainer}>
                  {['Green', 'Red'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={styles.radioOption}
                      onPress={() => setExitCandleColor(color)}
                    >
                      <View style={styles.radioButton}>
                        {exitCandleColor === color && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>{color}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>or SL HIT</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setExitSlHit(!exitSlHit)}
                  >
                    <View style={styles.radioButton}>
                      {exitSlHit && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioText}>SL HIT</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {exitLegsIndex.map((leg) => (
                <View key={leg.id} style={styles.orderLegCard}>
                  <View style={styles.orderLegHeader}>
                    <Text style={styles.orderLegTitle}>
                      {leg.action} {leg.instrument} - {leg.quantity} Qty
                    </Text>
                    <View style={styles.orderLegActions}>
                      <TouchableOpacity 
                        onPress={() => {
                          setCurrentEditingExitLeg(leg);
                          setExitLegType('index');
                          setShowExitLegModal(true);
                        }}
                        style={styles.editButton}
                      >
                        <Ionicons name="pencil" size={16} color="#1976d2" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteExitLeg(leg.id, 'index')}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash" size={16} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.orderLegDetails}>
                    <Text style={styles.conditionText}>
                      {leg.condition}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>...</Text>
                <TouchableOpacity style={styles.addLegButton} onPress={() => addExitLeg('index')}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addLegText}>+ ADD LEG</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Exit Condition - Selling */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exit Condition - Selling</Text>
              
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Exit CE/PE</Text>
                <View style={styles.radioContainer}>
                  {['CE', 'PE'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.radioOption}
                      onPress={() => setExitOptionType(type)}
                    >
                      <View style={styles.radioButton}>
                        {exitOptionType === type && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Candle Start/Close</Text>
                <View style={styles.radioContainer}>
                  {['Start', 'Close'].map((timing) => (
                    <TouchableOpacity
                      key={timing}
                      style={styles.radioOption}
                      onPress={() => setExitCandleTiming(timing)}
                    >
                      <View style={styles.radioButton}>
                        {exitCandleTiming === timing && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>{timing}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Green/Red</Text>
                <View style={styles.radioContainer}>
                  {['Green', 'Red'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={styles.radioOption}
                      onPress={() => setExitCandleColor(color)}
                    >
                      <View style={styles.radioButton}>
                        {exitCandleColor === color && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>{color}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>or SL HIT</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setExitSlHit(!exitSlHit)}
                  >
                    <View style={styles.radioButton}>
                      {exitSlHit && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioText}>SL HIT</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {exitLegsSelling.map((leg) => (
                <View key={leg.id} style={styles.orderLegCard}>
                  <View style={styles.orderLegHeader}>
                    <Text style={styles.orderLegTitle}>
                      {leg.action} {leg.instrument} - {leg.quantity} Qty
                    </Text>
                    <View style={styles.orderLegActions}>
                      <TouchableOpacity 
                        onPress={() => {
                          setCurrentEditingExitLeg(leg);
                          setExitLegType('selling');
                          setShowExitLegModal(true);
                        }}
                        style={styles.editButton}
                      >
                        <Ionicons name="pencil" size={16} color="#1976d2" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteExitLeg(leg.id, 'selling')}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash" size={16} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.orderLegDetails}>
                    <Text style={styles.conditionText}>
                      {leg.condition}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>...</Text>
                <TouchableOpacity style={styles.addLegButton} onPress={() => addExitLeg('selling')}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addLegText}>+ ADD LEG</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Enhanced Risk Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk : Reward</Text>
          
          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>Risk : Reward :- 1:3</Text>
            <TextInput
              style={styles.riskInput}
              value={riskRewardRatio}
              onChangeText={setRiskRewardRatio}
              placeholder="1:3"
            />
          </View>

          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>OVERALL Stop Lose</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  overallStopLoss && styles.toggleButtonActive
                ]}
                onPress={() => setOverallStopLoss(!overallStopLoss)}
              >
                <Text style={[
                  styles.toggleText,
                  overallStopLoss && styles.toggleTextActive
                ]}>
                  {overallStopLoss ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>Max Lose</Text>
            <TextInput
              style={styles.riskInput}
              value={maxLossAmount}
              onChangeText={setMaxLossAmount}
              placeholder="1000"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>OVERALL Profit</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  overallProfit && styles.toggleButtonActive
                ]}
                onPress={() => setOverallProfit(!overallProfit)}
              >
                <Text style={[
                  styles.toggleText,
                  overallProfit && styles.toggleTextActive
                ]}>
                  {overallProfit ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>Max Profit</Text>
            <TextInput
              style={styles.riskInput}
              value={maxProfitAmount}
              onChangeText={setMaxProfitAmount}
              placeholder="5000"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Section */}
        <View style={styles.saveSection}>
          <View style={styles.strategyNameContainer}>
            <Text style={styles.requiredIndicator}>*</Text>
            <TextInput
              style={styles.strategyNameInput}
              value={strategyName}
              onChangeText={setStrategyName}
              placeholder="Strategy name"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.printButton}>
              <Ionicons name="print-outline" size={20} color="#1976d2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveStrategy}
            >
              <Text style={styles.saveButtonText}>Save & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Order Leg Modal */}
      <Modal visible={showOrderLegModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.orderLegModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentEditingLeg?.id ? 'Edit Order Leg' : 'Add Order Leg'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowOrderLegModal(false);
                  setCurrentEditingLeg(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.orderLegForm}>
              {currentEditingLeg && (
                <>
                  {/* Basic Order Details */}
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Order Details</Text>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Action</Text>
                      <View style={styles.radioContainer}>
                        {['Buy', 'Sell'].map((action) => (
                          <TouchableOpacity
                            key={action}
                            style={styles.radioOption}
                            onPress={() => setCurrentEditingLeg(prev => prev ? {...prev, action: action as 'Buy' | 'Sell'} : null)}
                          >
                            <View style={styles.radioButton}>
                              {currentEditingLeg.action === action && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={styles.radioText}>{action}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Quantity</Text>
                      <TextInput
                        style={styles.formInput}
                        value={currentEditingLeg.quantity}
                        onChangeText={(value) => setCurrentEditingLeg(prev => prev ? {...prev, quantity: value} : null)}
                        placeholder="1"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Instrument</Text>
                      <View style={styles.dropdownContainer}>
                        <ScrollView style={styles.dropdownScroll}>
                          {selectedInstruments.map((instrument) => (
                            <TouchableOpacity
                              key={instrument}
                              style={[
                                styles.dropdownOption,
                                currentEditingLeg.instrument === instrument && styles.selectedDropdownOption
                              ]}
                              onPress={() => setCurrentEditingLeg(prev => (prev ? { ...prev, instrument } : null))}
                            >
                              <Text style={[
                                styles.dropdownOptionText,
                                currentEditingLeg.instrument === instrument && styles.selectedDropdownOptionText
                              ]}>
                                {instrument}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  {/* Entry Conditions for Candle Based */}
                  {selectedStrategyType === 'Candle Based' && (
                    <View style={styles.formSection}>
                      <Text style={styles.formSectionTitle}>Entry Condition</Text>
                      
                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Candle Type</Text>
                        <View style={styles.dropdownContainer}>
                          <ScrollView style={styles.dropdownScroll}>
                            {candlePatterns.map((pattern) => (
                              <TouchableOpacity
                                key={pattern.id}
                                style={[
                                  styles.dropdownOption,
                                  currentEditingLeg.entryCondition?.candleType === pattern.name && styles.selectedDropdownOption
                                ]}
                                onPress={() => setCurrentEditingLeg(prev => (prev ? {
                                  ...prev,
                                  entryCondition: { ...prev.entryCondition!, candleType: pattern.name }
                                } : null))}
                              >
                                <Text style={[
                                  styles.dropdownOptionText,
                                  currentEditingLeg.entryCondition?.candleType === pattern.name && styles.selectedDropdownOptionText
                                ]}>
                                  {pattern.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Candle Color</Text>
                        <View style={styles.radioContainer}>
                          {['Green', 'Red'].map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={styles.radioOption}
                              onPress={() => setCurrentEditingLeg(prev => prev ? {
                                ...prev,
                                entryCondition: {...prev.entryCondition!, candleColor: color}
                              } : null)}
                            >
                              <View style={styles.radioButton}>
                                {currentEditingLeg.entryCondition?.candleColor === color && <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={styles.radioText}>{color}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Entry Time</Text>
                        <TextInput
                          style={styles.formInput}
                          value={currentEditingLeg.entryCondition?.candleTime}
                          onChangeText={(value) => setCurrentEditingLeg(prev => prev ? {
                            ...prev,
                            entryCondition: {...prev.entryCondition!, candleTime: value}
                          } : null)}
                          placeholder="09:15"
                        />
                      </View>
                    </View>
                  )}

                  {/* Exit Conditions */}
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Exit Condition</Text>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Profit Target (₹)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={currentEditingLeg.exitCondition?.profitTarget}
                        onChangeText={(value) => setCurrentEditingLeg(prev => prev ? {
                          ...prev,
                          exitCondition: {...prev.exitCondition!, profitTarget: value}
                        } : null)}
                        placeholder="100"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Stop Loss (₹)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={currentEditingLeg.exitCondition?.stopLoss}
                        onChangeText={(value) => setCurrentEditingLeg(prev => prev ? {
                          ...prev,
                          exitCondition: {...prev.exitCondition!, stopLoss: value}
                        } : null)}
                        placeholder="50"
                        keyboardType="numeric"
                      />
                    </View>

                    {selectedStrategyType === 'Candle Based' && (
                      <>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Exit Candle Type</Text>
                          <View style={styles.dropdownContainer}>
                            <ScrollView style={styles.dropdownScroll}>
                              {candlePatterns.map((pattern) => (
                                <TouchableOpacity
                                  key={pattern.id}
                                  style={[
                                    styles.dropdownOption,
                                    currentEditingLeg.exitCondition?.candleType === pattern.name && styles.selectedDropdownOption
                                  ]}
                                  onPress={() => setCurrentEditingLeg(prev => prev ? {
                                    ...prev,
                                    exitCondition: {...prev.exitCondition!, candleType: pattern.name}
                                  } : null)}
                                >
                                  <Text style={[
                                    styles.dropdownOptionText,
                                    currentEditingLeg.exitCondition?.candleType === pattern.name && styles.selectedDropdownOptionText
                                  ]}>
                                    {pattern.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Exit Candle Color</Text>
                          <View style={styles.radioContainer}>
                            {['Green', 'Red'].map((color) => (
                              <TouchableOpacity
                                key={color}
                                style={styles.radioOption}
                                onPress={() => setCurrentEditingLeg(prev => prev ? {
                                  ...prev,
                                  exitCondition: {...prev.exitCondition!, candleColor: color}
                                } : null)}
                              >
                                <View style={styles.radioButton}>
                                  {currentEditingLeg.exitCondition?.candleColor === color && <View style={styles.radioButtonInner} />}
                                </View>
                                <Text style={styles.radioText}>{color}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => currentEditingLeg && saveOrderLeg(currentEditingLeg)}
              >
                <Text style={styles.modalButtonText}>Save Order Leg</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Leg Modal */}
      <Modal visible={showExitLegModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.orderLegModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentEditingExitLeg?.id ? 'Edit Exit Leg' : 'Add Exit Leg'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowExitLegModal(false);
                  setCurrentEditingExitLeg(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.orderLegForm}>
              {currentEditingExitLeg && (
                <>
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Exit Order Details</Text>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Action</Text>
                      <View style={styles.radioContainer}>
                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setCurrentEditingExitLeg(prev => prev ? {...prev, action: 'Sell'} : null)}
                        >
                          <View style={styles.radioButton}>
                            {currentEditingExitLeg.action === 'Sell' && <View style={styles.radioButtonInner} />}
                          </View>
                          <Text style={styles.radioText}>Sell</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Quantity</Text>
                      <TextInput
                        style={styles.formInput}
                        value={currentEditingExitLeg.quantity}
                        onChangeText={(value) => setCurrentEditingExitLeg(prev => prev ? {...prev, quantity: value} : null)}
                        placeholder="1"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Instrument</Text>
                      <View style={styles.dropdownContainer}>
                        <ScrollView style={styles.dropdownScroll}>
                          {selectedInstruments.map((instrument) => (
                            <TouchableOpacity
                              key={instrument}
                              style={[
                                styles.dropdownOption,
                                currentEditingExitLeg.instrument === instrument && styles.selectedDropdownOption
                              ]}
                              onPress={() => setCurrentEditingExitLeg(prev => (prev ? { ...prev, instrument } : null))}
                            >
                              <Text style={[
                                styles.dropdownOptionText,
                                currentEditingExitLeg.instrument === instrument && styles.selectedDropdownOptionText
                              ]}>
                                {instrument}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Exit Trigger Condition</Text>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Trigger Type</Text>
                      <View style={styles.radioContainer}>
                        {['LTP', 'Target', 'OffsetFromEntry'].map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={styles.radioOption}
                            onPress={() => setCurrentEditingExitLeg(prev => prev ? {...prev, triggerType: type as 'LTP' | 'Target' | 'OffsetFromEntry'} : null)}
                          >
                            <View style={styles.radioButton}>
                              {currentEditingExitLeg.triggerType === type && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={styles.radioText}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Price Offset (₹)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={currentEditingExitLeg.priceOffset}
                        onChangeText={(value) => {
                          const offset = value;
                          let condition = '';
                          if (currentEditingExitLeg.triggerType === 'LTP') {
                            condition = `When LTP ≥ Entry Price + ${offset}`;
                          } else if (currentEditingExitLeg.triggerType === 'Target') {
                            condition = `When LTP ≥ ₹${offset}`;
                          } else {
                            condition = `When LTP ≥ Entry Price + ₹${offset}`;
                          }
                          setCurrentEditingExitLeg(prev => prev ? {...prev, priceOffset: value, condition} : null);
                        }}
                        placeholder="10"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Condition Preview</Text>
                      <Text style={styles.previewText}>{currentEditingExitLeg.condition}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => currentEditingExitLeg && saveExitLeg(currentEditingExitLeg)}
              >
                <Text style={styles.modalButtonText}>Save Exit Leg</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Instrument Selection Modal */}
      {showInstrumentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Instruments</Text>
              {loadingMarketData && (
                <ActivityIndicator size="small" color="#1976d2" />
              )}
              <TouchableOpacity 
                onPress={() => {
                  setShowInstrumentModal(false);
                  setInstrumentSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search instruments..."
                placeholderTextColor="#999"
                value={instrumentSearchQuery}
                onChangeText={setInstrumentSearchQuery}
              />
            </View>
            
            <ScrollView style={styles.instrumentList}>
              {loadingInstruments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1976d2" />
                  <Text style={styles.loadingText}>Loading instruments from Zerodha API...</Text>
                </View>
              ) : availableInstruments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No instruments available</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={fetchInstruments}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                availableInstruments
                  .filter(instrument => 
                    instrument.toLowerCase().includes(instrumentSearchQuery.toLowerCase())
                  )
                  .map((instrument) => {
                  const isSelected = selectedInstruments.includes(instrument);
                  const quote = liveQuotes[instrument];
                  return (
                    <TouchableOpacity
                      key={instrument}
                      style={[
                        styles.instrumentOption,
                        isSelected && styles.selectedInstrumentOption
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedInstruments(prev => prev.filter(item => item !== instrument));
                        } else {
                          setSelectedInstruments(prev => [...prev, instrument]);
                        }
                      }}
                    >
                      <View style={styles.instrumentInfo}>
                        <Text style={[
                          styles.instrumentOptionText,
                          isSelected && styles.selectedInstrumentOptionText
                        ]}>
                          {instrument}
                        </Text>
                        {quote && (
                          <View style={styles.quoteInfo}>
                            <Text style={styles.priceText}>₹{quote.last_price?.toFixed(2)}</Text>
                            <Text style={[
                              styles.changeText,
                              quote.net_change >= 0 ? styles.positiveChange : styles.negativeChange
                            ]}>
                              {quote.net_change >= 0 ? '+' : ''}{quote.net_change?.toFixed(2)} ({quote.net_change_percent?.toFixed(2)}%)
                            </Text>
                          </View>
                        )}
                      </View>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowInstrumentModal(false)}
              >
                <Text style={styles.modalButtonText}>Done ({selectedInstruments.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
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
            
            <View style={styles.chartTypeList}>
              {chartTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chartTypeOption,
                    selectedChartType === type && styles.selectedChartTypeOption
                  ]}
                  onPress={() => {
                    setSelectedChartType(type);
                    setShowChartTypeModal(false);
                  }}
                >
                  <View style={styles.chartTypeOptionIcon}>
                    <Ionicons 
                      name={getChartIcon(type) as any} 
                      size={24} 
                      color={selectedChartType === type ? '#1976d2' : '#666'} 
                    />
                  </View>
                  <Text style={[
                    styles.chartTypeOptionText,
                    selectedChartType === type && styles.selectedChartTypeOptionText
                  ]}>
                    {type}
                  </Text>
                  {selectedChartType === type && (
                    <Ionicons name="checkmark" size={20} color="#1976d2" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Universal Dropdown Modal */}
      <Modal visible={showCandleColorModal || showCandleTimingModal || showLotSizeModal || showMoneynessModal || showAtmStrikeModal || showSlTypeModal || showSlTrailModal || showTimeRangeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCandleColorModal(false);
                  setShowCandleTimingModal(false);
                  setShowLotSizeModal(false);
                  setShowMoneynessModal(false);
                  setShowAtmStrikeModal(false);
                  setShowSlTypeModal(false);
                  setShowSlTrailModal(false);
                  setShowTimeRangeModal(false);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {(() => {
                let options: string[] = [];
                if (showCandleColorModal) options = candleColors;
                else if (showCandleTimingModal) options = candleTimings;
                else if (showLotSizeModal) options = lotSizes;
                else if (showMoneynessModal) options = moneynessTypes;
                else if (showAtmStrikeModal) options = atmStrikes;
                else if (showSlTypeModal) options = slTypes;
                else if (showSlTrailModal) options = slTrailTypes;
                else if (showTimeRangeModal) options = timeRanges;

                return options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => {
                      handleDropdownSelect(currentDropdownType, option);
                      setShowCandleColorModal(false);
                      setShowCandleTimingModal(false);
                      setShowLotSizeModal(false);
                      setShowMoneynessModal(false);
                      setShowAtmStrikeModal(false);
                      setShowSlTypeModal(false);
                      setShowSlTrailModal(false);
                      setShowTimeRangeModal(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Protection Modal */}
      <PasswordModal
        visible={showPasswordModal}
        onClose={handlePasswordClose}
        onSuccess={handlePasswordSuccess}
        title="Access Candle Strategy"
        message="This feature requires password verification. Please enter your password to continue."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1976d2',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    marginLeft: 6,
  },
  selectedInstruments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  instrumentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  instrumentChipText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    marginRight: 6,
  },
  instrumentPrice: {
    marginRight: 6,
  },
  priceText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '500',
  },
  removeInstrument: {
    marginLeft: 4,
  },
  removeInstrumentText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  addInstrumentsBox: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  plusIcon: {
    fontSize: 32,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addInstrumentsText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  orderTypeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1976d2',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  timeInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 4,
    gap: 2,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeDayButton: {
    backgroundColor: '#1976d2',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  activeDayText: {
    color: '#fff',
  },
  intervalContainer: {
    paddingVertical: 8,
  },
  intervalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  activeIntervalButton: {
    backgroundColor: '#1976d2',
  },
  intervalText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  activeIntervalText: {
    color: '#fff',
  },
  orderLegsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderLegsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addLegButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addLegText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  orderLegCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderLegHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderLegTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  orderLegActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  orderLegDetails: {
    gap: 4,
  },
  conditionText: {
    fontSize: 12,
    color: '#666',
  },
  riskRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  riskInputContainer: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  riskInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  saveSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  strategyNameContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  requiredIndicator: {
    position: 'absolute',
    top: -8,
    right: 8,
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
    zIndex: 1,
  },
  strategyNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  saveButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  printButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    paddingVertical: 20,
  },
  orderLegModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxHeight: '90%',
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  instrumentList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  instrumentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedInstrumentOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  instrumentInfo: {
    flex: 1,
  },
  instrumentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedInstrumentOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  quoteInfo: {
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  positiveChange: {
    color: '#4caf50',
  },
  negativeChange: {
    color: '#f44336',
  },
  checkmark: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orderLegForm: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 150,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDropdownOption: {
    backgroundColor: '#e3f2fd',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  // Enhanced Candle Strategy Styles
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 12,
  },
  conditionControls: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  dropdownWrapper: {
    flex: 1,
    minWidth: 80,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  okButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    alignItems: 'flex-end',
  },
  toggleButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4caf50',
  },
  toggleText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  // Chart Type Selector Styles
  chartTypeSelector: {
    marginBottom: 16,
  },
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  chartTypeIconContainer: {
    marginRight: 12,
  },
  chartTypeButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  chartTypeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    paddingVertical: 20,
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
  // Live Chart Styles
  liveChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveChartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveChartToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
    gap: 6,
  },
  liveChartToggleText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  patternsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  patternsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  patternsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  patternChip: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  patternText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  instrumentChartSelector: {
    marginBottom: 16,
  },
  chartSelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  instrumentChartList: {
    paddingVertical: 8,
  },
  instrumentChartButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    minWidth: 80,
  },
  selectedInstrumentChartButton: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  instrumentChartText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedInstrumentChartText: {
    color: '#fff',
  },
  instrumentChartPrice: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  liveChartContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  marketStatusContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  marketStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  marketStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  marketStatusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  marketStatusItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  marketStatusInstrument: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  marketStatusPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  marketStatusChange: {
    fontSize: 10,
    fontWeight: '600',
  },
  noInstrumentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
    marginBottom: 16,
    gap: 12,
  },
  noInstrumentsText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default TradingStrategy;