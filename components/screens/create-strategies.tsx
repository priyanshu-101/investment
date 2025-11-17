import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
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
import CandleChart, { ChartType } from '../candlechart';
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
  numberOfLots?: string;
  optionType?: 'CE' | 'PE';
  expiryType?: 'Weekly' | 'Monthly';
  moneynessType?: 'ATM' | 'ITM' | 'OTM';
  slPercentage?: string;
  tpPercentage?: string;
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
  action: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit' | 'SL' | 'SL-M';
  quantity: string;
  instrument: string;
  condition?: string;
  priceOffset?: string;
  triggerType?: 'LTP' | 'Target' | 'OffsetFromEntry';
}

interface TradingStrategyProps {
  onStrategyCreated?: (strategyData: any) => void;
  onStrategyUpdated?: (strategy: StrategyApiData, strategyData: any) => void;
  onEditComplete?: () => void;
  editingStrategy?: StrategyApiData | null;
  navigation?: any;
}

const TradingStrategy = ({ onStrategyCreated, onStrategyUpdated, onEditComplete, editingStrategy, navigation }: TradingStrategyProps) => {
  const { user } = useAuth();
  
  // Existing state
  const [selectedStrategyType, setSelectedStrategyType] = useState('Time Based');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('Candle');
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
  const [allInstruments, setAllInstruments] = useState<string[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(false);
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeEditingStrategy, setActiveEditingStrategy] = useState<StrategyApiData | null>(null);

  // Enhanced candle-based strategy state
  const [selectedInterval, setSelectedInterval] = useState('1M');
  const [orderLegs, setOrderLegs] = useState<OrderLeg[]>([]);
  const [orderLegsSelling, setOrderLegsSelling] = useState<OrderLeg[]>([]);
  const [showOrderLegModal, setShowOrderLegModal] = useState(false);
  const [currentEditingLeg, setCurrentEditingLeg] = useState<OrderLeg | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openLegDropdown, setOpenLegDropdown] = useState<{ legId: string; type: 'expiry' | 'moneyness' | 'sl' | 'tp' } | null>(null);
  const [riskRewardRatio, setRiskRewardRatio] = useState('1:3');
  const [overallStopLoss, setOverallStopLoss] = useState(true);
  const [overallProfit, setOverallProfit] = useState(true);
  const [maxLossAmount, setMaxLossAmount] = useState('1000');
  const [maxProfitAmount, setMaxProfitAmount] = useState('5000');
  
  // Entry Conditions - Buying
  const [entryFirstCandleColorBuying, setEntryFirstCandleColorBuying] = useState('Green');
  const [entryFirstCandleTimingBuying, setEntryFirstCandleTimingBuying] = useState('Start');
  const [entrySecondCandleColorBuying, setEntrySecondCandleColorBuying] = useState('Red');
  const [entrySecondCandleTimingBuying, setEntrySecondCandleTimingBuying] = useState('Close');
  const [entryCandleTimeSelectionBuying, setEntryCandleTimeSelectionBuying] = useState('Start');
  const [entryTimeRangeBuying, setEntryTimeRangeBuying] = useState('1');
  
  // Entry Conditions - Selling
  const [entryFirstCandleColorSelling, setEntryFirstCandleColorSelling] = useState('Green');
  const [entryFirstCandleTimingSelling, setEntryFirstCandleTimingSelling] = useState('Start');
  const [entrySecondCandleColorSelling, setEntrySecondCandleColorSelling] = useState('Red');
  const [entrySecondCandleTimingSelling, setEntrySecondCandleTimingSelling] = useState('Close');
  const [entryCandleTimeSelectionSelling, setEntryCandleTimeSelectionSelling] = useState('Start');
  const [entryTimeRangeSelling, setEntryTimeRangeSelling] = useState('1');
  
  // Order Leg Configuration
  const [selectedOrderAction, setSelectedOrderAction] = useState('Buy');
  const [numberOfLots, setNumberOfLots] = useState('1');
  const [optionType, setOptionType] = useState('CE');
  const [expiryType, setExpiryType] = useState('Weekly');
  const [moneynessType, setMoneynessType] = useState('ATM');
  const [entryPriceType, setEntryPriceType] = useState('Market');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [atmStrike, setAtmStrike] = useState('OTM-1');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stopLossType, setStopLossType] = useState('Previous Candle - High');
  const [slTrailType, setSlTrailType] = useState('On Candle Close');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previousCandleSelection, setPreviousCandleSelection] = useState('High');
  const [sameCandleSelection, setSameCandleSelection] = useState('Low');
  const [previousMinusOneSelection, setPreviousMinusOneSelection] = useState('High');
  
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
  
  // Exit Condition Modal (for the form shown in image)
  const [showExitConditionModal, setShowExitConditionModal] = useState(false);
  const [exitConditionModalType, setExitConditionModalType] = useState<'buying' | 'selling'>('buying');
  // Show additional exit conditions (last two)
  const [showAdditionalExitConditions, setShowAdditionalExitConditions] = useState(false);
  // Show additional entry conditions (last two) - Buying shows automatically
  const [showAdditionalEntryConditions, setShowAdditionalEntryConditions] = useState(true);
  // Show Entry Condition - Selling
  const [showEntryConditionSelling, setShowEntryConditionSelling] = useState(false);
  // Separate state for second selling button
  const [showEntryConditionSellingSecond, setShowEntryConditionSellingSecond] = useState(false);
  // Separate state for modal form fields
  const [modalExitOptionType, setModalExitOptionType] = useState('CE');
  const [modalExitCandleTiming, setModalExitCandleTiming] = useState('Start');
  const [modalExitCandleColor, setModalExitCandleColor] = useState('Green');
  const [modalExitSlHit, setModalExitSlHit] = useState(false);
  
  // Modal states for dropdowns
  const [showCandleColorModal, setShowCandleColorModal] = useState(false);
  const [showCandleTimingModal, setShowCandleTimingModal] = useState(false);
  const [showMoneynessModal, setShowMoneynessModal] = useState(false);
  const [showAtmStrikeModal, setShowAtmStrikeModal] = useState(false);
  const [showSlTypeModal, setShowSlTypeModal] = useState(false);
  const [showSlTrailModal, setShowSlTrailModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [showChartTypeModal, setShowChartTypeModal] = useState(false);
   
  const [showPreviousCandleModal, setShowPreviousCandleModal] = useState(false);
   
  const [showSameCandleModal, setShowSameCandleModal] = useState(false);
   
  const [showPreviousMinusOneModal, setShowPreviousMinusOneModal] = useState(false);
  const [currentDropdownType, setCurrentDropdownType] = useState('');
  
  // Dynamic data from Zerodha
  const [liveQuotes, setLiveQuotes] = useState<any>({});
  const [candleData, setCandleData] = useState<any>({});
  const [loadingMarketData, setLoadingMarketData] = useState(false);

  // Password protection for candle strategy
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Asset class selection for Candle Based strategy
  const [showAssetClassModal, setShowAssetClassModal] = useState(false);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('');

  // Live candle chart state
  const [showLiveChart, setShowLiveChart] = useState(false);
  const [selectedChartInstrument, setSelectedChartInstrument] = useState<string>('');
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);

  // Password verification handlers
  const handlePasswordSuccess = () => {
    setIsPasswordVerified(true);
    setSelectedStrategyType('Candle Based');
    setShowPasswordModal(false);
    // Show asset class selection modal after password verification
    setShowAssetClassModal(true);
  };

  // Handle asset class selection for Candle Based strategy
  const handleAssetClassSelect = (assetClass: string) => {
    setSelectedAssetClass(assetClass);
    // Set chart type to OHLC as per flowchart
    setSelectedChartType('OHLC');
    setShowAssetClassModal(false);
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

  const resetForm = useCallback(() => {
    setStrategyName('');
    setSelectedStrategyType('Time Based');
    setSelectedChartType('Candle');
    setSelectedOrderType('MIS');
    setSelectedTransactionType('Buy');
    setStartTime('09:16');
    setSquareOffTime('15:15');
    setSelectedDays(['MON', 'TUE', 'WED', 'THU', 'FRI']);
    setSelectedInstruments([]);
    setShowInstrumentModal(false);
    setInstrumentSearchQuery('');
    setSelectedCategory('');
    setActiveEditingStrategy(null);
    setSelectedInterval('1M');
    setOrderLegs([]);
    setOrderLegsSelling([]);
    setShowOrderLegModal(false);
    setCurrentEditingLeg(null);
    setRiskRewardRatio('1:3');
    setOverallStopLoss(true);
    setOverallProfit(true);
    setMaxLossAmount('1000');
    setMaxProfitAmount('5000');
    // Entry Conditions - Buying
    setEntryFirstCandleColorBuying('Green');
    setEntryFirstCandleTimingBuying('Start');
    setEntrySecondCandleColorBuying('Red');
    setEntrySecondCandleTimingBuying('Close');
    setEntryCandleTimeSelectionBuying('Start');
    setEntryTimeRangeBuying('1');
    
    // Entry Conditions - Selling
    setEntryFirstCandleColorSelling('Green');
    setEntryFirstCandleTimingSelling('Start');
    setEntrySecondCandleColorSelling('Red');
    setEntrySecondCandleTimingSelling('Close');
    setEntryCandleTimeSelectionSelling('Start');
    setEntryTimeRangeSelling('1');
    setSelectedOrderAction('Buy');
    setNumberOfLots('1');
    setOptionType('CE');
    setExpiryType('Weekly');
    setMoneynessType('ATM');
    setEntryPriceType('Market');
    setAtmStrike('OTM-1');
    setStopLossType('Previous Candle - High');
    setSlTrailType('On Candle Close');
    setPreviousCandleSelection('High');
    setSameCandleSelection('Low');
    setPreviousMinusOneSelection('High');
    setExitOptionType('CE');
    setExitCandleTiming('Start');
    setExitCandleColor('Green');
    setExitSlHit(false);
    setExitLegsIndex([]);
    setExitLegsSelling([]);
    setShowExitLegModal(false);
    setCurrentEditingExitLeg(null);
    setExitLegType('index');
    setShowExitConditionModal(false);
    setExitConditionModalType('buying');
    setModalExitOptionType('CE');
    setModalExitCandleTiming('Start');
    setModalExitCandleColor('Green');
    setModalExitSlHit(false);
    setShowCandleColorModal(false);
    setShowCandleTimingModal(false);
    setShowMoneynessModal(false);
    setShowAtmStrikeModal(false);
    setShowSlTypeModal(false);
    setShowSlTrailModal(false);
    setShowTimeRangeModal(false);
    setShowChartTypeModal(false);
    setShowPreviousCandleModal(false);
    setShowSameCandleModal(false);
    setShowPreviousMinusOneModal(false);
    setCurrentDropdownType('');
    setLiveQuotes({});
    setCandleData({});
    setShowLiveChart(false);
    setSelectedChartInstrument('');
    setDetectedPatterns([]);
    setShowPasswordModal(false);
    setIsPasswordVerified(false);
    setShowAssetClassModal(false);
    setSelectedAssetClass('');
  }, []);

  const handleStrategyTypePress = (type: string) => {
    if (activeEditingStrategy) {
      return;
    }
    if (type === 'Candle Based' && !isPasswordVerified) {
      setShowPasswordModal(true);
    } else {
      setSelectedStrategyType(type);
    }
  };

  const strategyTypes = ['Candle Based', 'Time Based', 'Indicator Based'];
  const chartTypes: ('Candle' | 'Bars' | 'Hollow candles' | 'Line' | 'OHLC' | 'Area' | 'HLC area' | 'Baseline' | 'Columns' | 'High-low' | 'Heikin Ashi' | 'Renko' | 'Line break' | 'Kagi' | 'Point & figure' | 'Line with markers' | 'Step line')[] = [
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
  ];
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
  const moneynessTypes = ['ATM', 'ITM', 'OTM'];
  const atmStrikes = ['ITM-5', 'ITM-3', 'ITM-2', 'ITM-1', 'ATM', 'OTM-1', 'OTM-2', 'OTM-3', 'OTM-5'];
  const slTypes = ['Previous Candle - High', 'Previous Candle - Low', 'SAME Candle - High', 'SAME Candle - Low'];
  const slTrailTypes = ['New', 'On Candle Close', 'On Candle Start'];
   
  const highLowOptions = ['High', 'Low'];
  const timeRanges = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  useEffect(() => {
    if (editingStrategy) {
      const data = editingStrategy.fullStrategyData || {};
      const entryConditions = data.entryConditions || {};
      const exitConditions = data.exitConditions || {};
      const riskManagement = data.riskManagement || {};
      const marketData = data.marketData || {};
      const type = data.selectedStrategyType || editingStrategy.strategyType || 'Time Based';
      setActiveEditingStrategy(editingStrategy);
      setStrategyName(data.strategyName || editingStrategy.name || '');
      setSelectedStrategyType(type);
      setIsPasswordVerified(type === 'Candle Based');
      setSelectedChartType(data.selectedChartType || data.chartConfiguration?.defaultChartType || 'Candle');
      setSelectedOrderType(data.selectedOrderType || 'MIS');
      setSelectedTransactionType(data.selectedTransactionType || 'Buy');
      setStartTime(data.startTime || '09:16');
      setSquareOffTime(data.squareOffTime || '15:15');
      setSelectedDays(Array.isArray(data.selectedDays) && data.selectedDays.length ? data.selectedDays : ['MON', 'TUE', 'WED', 'THU', 'FRI']);
      setSelectedInterval(data.selectedInterval || '1M');
      setSelectedInstruments(Array.isArray(data.instruments) ? data.instruments : []);
      setOrderLegs(Array.isArray(data.orderLegs) ? data.orderLegs : []);
      setOrderLegsSelling(Array.isArray(data.orderLegsSelling) ? data.orderLegsSelling : []);
      // Load Entry Conditions - Buying
      setEntryFirstCandleColorBuying(entryConditions.entryFirstCandleColorBuying || 'Green');
      setEntryFirstCandleTimingBuying(entryConditions.entryFirstCandleTimingBuying || 'Start');
      setEntrySecondCandleColorBuying(entryConditions.entrySecondCandleColorBuying || 'Red');
      setEntrySecondCandleTimingBuying(entryConditions.entrySecondCandleTimingBuying || 'Close');
      setEntryCandleTimeSelectionBuying(entryConditions.entryCandleTimeSelectionBuying || 'Start');
      setEntryTimeRangeBuying(entryConditions.entryTimeRangeBuying || '1');
      // Load Entry Conditions - Selling
      setEntryFirstCandleColorSelling(entryConditions.entryFirstCandleColorSelling || 'Green');
      setEntryFirstCandleTimingSelling(entryConditions.entryFirstCandleTimingSelling || 'Start');
      setEntrySecondCandleColorSelling(entryConditions.entrySecondCandleColorSelling || 'Red');
      setEntrySecondCandleTimingSelling(entryConditions.entrySecondCandleTimingSelling || 'Close');
      setEntryCandleTimeSelectionSelling(entryConditions.entryCandleTimeSelectionSelling || 'Start');
      setEntryTimeRangeSelling(entryConditions.entryTimeRangeSelling || '1');
      // Load Exit Conditions
      setExitLegsIndex(Array.isArray(exitConditions.exitLegsIndex) ? exitConditions.exitLegsIndex : []);
      setExitLegsSelling(Array.isArray(exitConditions.exitLegsSelling) ? exitConditions.exitLegsSelling : []);
      setExitOptionType(exitConditions.exitOptionType || 'CE');
      setExitCandleTiming(exitConditions.exitCandleTiming || 'Start');
      setExitCandleColor(exitConditions.exitCandleColor || 'Green');
      setExitSlHit(Boolean(exitConditions.exitSlHit));
      setRiskRewardRatio(riskManagement.riskRewardRatio || '1:3');
      setOverallStopLoss(typeof riskManagement.overallStopLoss === 'boolean' ? riskManagement.overallStopLoss : true);
      setOverallProfit(typeof riskManagement.overallProfit === 'boolean' ? riskManagement.overallProfit : true);
      setMaxLossAmount(riskManagement.maxLossAmount || '1000');
      setMaxProfitAmount(riskManagement.maxProfitAmount || '5000');
      setLiveQuotes(marketData.liveQuotes || {});
      setCandleData(marketData.candleData || {});
      setShowLiveChart(false);
      setDetectedPatterns([]);
      setSelectedChartInstrument(data.selectedChartInstrument || (Array.isArray(data.instruments) && data.instruments.length ? data.instruments[0] : ''));
      setShowInstrumentModal(false);
      setShowOrderLegModal(false);
      setShowExitLegModal(false);
      setCurrentEditingLeg(null);
      setCurrentEditingExitLeg(null);
      setExitLegType('index');
      setInstrumentSearchQuery('');
      setShowPasswordModal(false);
    } else {
      setActiveEditingStrategy(null);
    }
  }, [editingStrategy]);

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

  // Helper function to get lot size (quantity per 1 lot) based on instrument name
  const getLotSizeForInstrument = (instrument: string): number => {
    const instrumentUpper = instrument.toUpperCase();
    
    // Index lot sizes
    if (instrumentUpper.includes('NIFTY') && !instrumentUpper.includes('BANK') && !instrumentUpper.includes('FIN') && !instrumentUpper.includes('MIDCP')) {
      return 75; // Nifty: 75 quantity per 1 lot
    }
    if (instrumentUpper.includes('SENSEX')) {
      return 20; // Sensex: 20 quantity per 1 lot
    }
    if (instrumentUpper.includes('FINNIFTY') || instrumentUpper.includes('FIN NIFTY')) {
      return 65; // Fin nifty: 65 quantity per 1 lot
    }
    if (instrumentUpper.includes('BANKNIFTY') || instrumentUpper.includes('BANK NIFTY')) {
      return 35; // Bank nifty: 35 quantity per 1 lot
    }
    if (instrumentUpper.includes('BANKEX')) {
      return 30; // Bankex: 30 quantity per 1 lot
    }
    if (instrumentUpper.includes('MIDCPNIFTY') || instrumentUpper.includes('MIDCAP NIFTY') || instrumentUpper.includes('MIDCP NIFTY')) {
      return 140; // Midcap nifty: 140 quantity per 1 lot
    }
    
    // Commodity lot sizes
    if (instrumentUpper.includes('CRUDEOIL NOV') || instrumentUpper.includes('CRUDE OIL NOV')) {
      if (instrumentUpper.includes('MINI')) {
        return 10; // Crude oil mini Nov: 10 quantity per 1 lot
      }
      return 100; // Crude oil Nov: 100 quantity per 1 lot
    }
    if (instrumentUpper.includes('NATURALGAS NOV') || instrumentUpper.includes('NATURAL GAS NOV')) {
      if (instrumentUpper.includes('MINI')) {
        return 250; // Natural gas mini Nov: 250 quantity per 1 lot
      }
      return 1250; // Natural gas Nov: 1250 quantity per 1 lot
    }
    if (instrumentUpper.includes('SILVER MINI NOV')) {
      return 5; // Silver mini Nov: 5 quantity per 1 lot
    }
    if (instrumentUpper.includes('GOLD MINI DEC')) {
      return 10; // Gold mini Dec: 10 quantity per 1 lot
    }
    
    // Stock Options lot sizes (from handwritten list)
    const stockLotSizes: Record<string, number> = {
      'ADANIENT': 300,
      'ADANIPORTS': 475,
      'ADANIPORT': 475,
      'APOLLOHOSP': 125,
      'ASIANPAINT': 250,
      'AXISBANK': 625,
      'AXIS BANK': 625,
      'BAJAJ-AUTO': 75,
      'BAJAJAUTO': 75,
      'BAJFINANCE': 750,
      'BAJAJ FINANCE': 750,
      'BAJAJFINSV': 250,
      'BEL': 1425,
      'BHARTIARTL': 475,
      'CIPLA': 375,
      'COALINDIA': 1350,
      'DRREDDY': 625,
      'EICHERMOT': 175,
      'ETERNAL': 2425,
      'GRASIM': 250,
      'HCLTECH': 350,
      'HDFCBANK': 550,
      'HDFC BANK': 550,
      'HDFCLIFE': 1100,
      'HDFC LIFE': 1100,
      'HINDUNILVR': 300,
      'HINDALCO': 700,
      'ICICIBANK': 700,
      'ICICI BANK': 700,
      'INFY': 400,
      'INDIGO': 150,
      'ITC': 1600,
      'JIOFIN': 2350,
      'JSWSTEEL': 675,
      'KOTAKBANK': 400,
      'KOTAK BANK': 400,
      'LT': 300,
      'M&M': 200,
      'MARUTI': 50,
      'MAXHEALTH': 525,
      'NESTLEIND': 500,
      'NTPC': 1500,
      'ONGC': 2250,
      'POWERGRID': 1900,
      'RELIANCE': 500,
      'SBIN': 750,
      'SBILIFE': 375,
      'SBI LIFE': 375,
      'SHRIRAMFIN': 825,
      'SUNPHARMA': 350,
      'TATACONSUM': 550,
      'TATA CONSUM': 550,
      'TATASTEEL': 5500,
      'TATA STEEL': 5500,
      'TCS': 175,
      'TECHM': 600,
      'TITAN': 175,
      'TMPV': 800,
      'TRENT': 100,
      'ULTRACEMCO': 50,
      'WIPRO': 3000,
    };
    
    // Check for exact match first
    if (stockLotSizes[instrumentUpper]) {
      return stockLotSizes[instrumentUpper];
    }
    
    // Check for partial matches (in case instrument name has variations)
    for (const [key, value] of Object.entries(stockLotSizes)) {
      if (instrumentUpper.includes(key) || key.includes(instrumentUpper)) {
        return value;
      }
    }
    
    // Default lot size if instrument not found
    return 50;
  };

  // Dropdown handlers
  const handleDropdownSelect = (type: string, value: string) => {
    switch (type) {
      // Entry Conditions - Buying
      case 'entryFirstCandleColorBuying':
        setEntryFirstCandleColorBuying(value);
        break;
      case 'entryFirstCandleTimingBuying':
        setEntryFirstCandleTimingBuying(value);
        break;
      case 'entrySecondCandleColorBuying':
        setEntrySecondCandleColorBuying(value);
        break;
      case 'entrySecondCandleTimingBuying':
        setEntrySecondCandleTimingBuying(value);
        break;
      case 'entryCandleTimeSelectionBuying':
        setEntryCandleTimeSelectionBuying(value);
        break;
      case 'entryTimeRangeBuying':
        setEntryTimeRangeBuying(value);
        break;
      // Entry Conditions - Selling
      case 'entryFirstCandleColorSelling':
        setEntryFirstCandleColorSelling(value);
        break;
      case 'entryFirstCandleTimingSelling':
        setEntryFirstCandleTimingSelling(value);
        break;
      case 'entrySecondCandleColorSelling':
        setEntrySecondCandleColorSelling(value);
        break;
      case 'entrySecondCandleTimingSelling':
        setEntrySecondCandleTimingSelling(value);
        break;
      case 'entryCandleTimeSelectionSelling':
        setEntryCandleTimeSelectionSelling(value);
        break;
      case 'entryTimeRangeSelling':
        setEntryTimeRangeSelling(value);
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
      case 'previousCandle':
        setPreviousCandleSelection(value);
        break;
      case 'sameCandle':
        setSameCandleSelection(value);
        break;
      case 'previousMinusOne':
        setPreviousMinusOneSelection(value);
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

      // Add fallback company names for each category
      // Base companies that appear in both Stock Options and Stock Intraday
      const baseStockCompanies = [
        'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE',
        'BAJAJFINSV', 'BEL', 'BHARTIARTL', 'CIPLA', 'COALINDIA', 'DRREDDY', 'EICHERMOT', 'ETERNAL',
        'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HINDUNILVR', 'HINDALCO', 'ICICIBANK',
        'INFY', 'INDIGO', 'ITC', 'JIOFIN', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'M&M', 'MARUTI',
        'MAXHEALTH', 'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBIN', 'SBILIFE',
        'SHRIRAMFIN', 'SUNPHARMA', 'TATACONSUM', 'TATASTEEL', 'TCS', 'TECHM', 'TITAN', 'TRENT',
        'TMPV', 'ULTRACEMCO', 'WIPRO'
      ];

      const fallbackInstruments = [
        // Index Options - only specified indices
        'NIFTY 50', 'BANK NIFTY', 'SENSEX', 'FINNIFTY', 'BANKEX', 'MIDCAP NIFTY',
        // Stock Options - same base companies (without CE/PE)
        ...baseStockCompanies,
        // Stock Intraday - same base companies
        ...baseStockCompanies,
        // Commodity - only specified commodities
        'CRUDEOIL NOV', 'CRUDE OIL NOV', 'CRUDEOIL MINI NOV', 'CRUDE OIL MINI NOV',
        'NATURALGAS NOV', 'NATURAL GAS NOV', 'NATURALGAS MINI NOV', 'NATURAL GAS MINI NOV',
        'SILVER MINI NOV', 'GOLD MINI DEC'
      ];
      instruments = [...instruments, ...fallbackInstruments];

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

              // Include all types: EQ (equity), CE/PE (options), FUT (futures), and commodities
              return (
                (exchange === 'NSE' && (instrumentType === 'EQ' || instrumentType === 'CE' || instrumentType === 'PE' || instrumentType === 'FUT')) ||
                (exchange === 'NSE' && symbol?.includes('NIFTY')) ||
                (exchange === 'BSE' && symbol?.includes('SENSEX')) ||
                (exchange === 'MCX' || exchange === 'BSE' && (instrumentType === 'EQ' || symbol?.includes('GOLD') || symbol?.includes('SILVER') || symbol?.includes('CRUDE')))
              );
            })
            .map((instrument: any) => instrument.tradingsymbol || instrument.trading_symbol)
            .filter((symbol: string) => symbol && symbol.length > 0)
            .slice(0, 1000); // Increased limit for more instruments

          instruments = [...instruments, ...kiteInstruments];
          console.log(`Fetched ${kiteInstruments.length} instruments from Zerodha`);
        } catch (error) {
          console.log('Zerodha instruments API failed:', error);
        }
      }

      // Always have fallback instruments available
      const uniqueInstruments = [...new Set(instruments)].sort();
      setAllInstruments(uniqueInstruments);
      setAvailableInstruments(uniqueInstruments);
      console.log(`Total unique instruments loaded: ${uniqueInstruments.length}`);
    } catch (error) {
      console.error('Failed to fetch instruments:', error);
      // Even on error, use fallback instruments
      const fallbackInstruments = [
        // Index Options - only specified indices
        'NIFTY 50', 'BANK NIFTY', 'SENSEX', 'FINNIFTY', 'BANKEX', 'MIDCAP NIFTY',
        // Stock Options
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN',
        // Commodity - only specified commodities
        'CRUDEOIL NOV', 'CRUDE OIL NOV', 'CRUDEOIL MINI NOV', 'CRUDE OIL MINI NOV',
        'NATURALGAS NOV', 'NATURAL GAS NOV', 'NATURALGAS MINI NOV', 'NATURAL GAS MINI NOV',
        'SILVER MINI NOV', 'GOLD MINI DEC'
      ];
      setAllInstruments(fallbackInstruments);
      setAvailableInstruments(fallbackInstruments);
    } finally {
      setLoadingInstruments(false);
    }
  }, []);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  // Filter instruments by category
  const filterInstrumentsByCategory = useCallback((category: string, instruments: string[]): string[] => {
    if (!category) return instruments;
    
    switch (category) {
      case 'Index Options':
        // Filter for index options - only specified indices
        return instruments.filter(inst => {
          const upper = inst.toUpperCase();
          return (
            upper.includes('NIFTY 50') || upper.includes('BANK NIFTY') || upper.includes('BANKNIFTY') ||
            upper.includes('SENSEX') || upper.includes('FINNIFTY') || 
            upper.includes('BANKEX') || upper.includes('MIDCAP NIFTY') || upper.includes('MIDCPNIFTY')
          );
        });
      
      case 'Stock Options':
        // Filter for stock options - show same base companies as Stock Intraday (without CE/PE)
        return instruments.filter(inst => {
          const upper = inst.toUpperCase();
          const isIndex = upper.includes('NIFTY 50') || upper.includes('BANK NIFTY') || upper.includes('BANKNIFTY') ||
                         upper.includes('SENSEX') || upper.includes('FINNIFTY') ||
                         upper.includes('BANKEX') || upper.includes('MIDCAP NIFTY') || upper.includes('MIDCPNIFTY');
          const isCommodity = upper.includes('CRUDEOIL NOV') || upper.includes('CRUDE OIL NOV') || 
                             upper.includes('CRUDEOIL MINI NOV') || upper.includes('CRUDE OIL MINI NOV') ||
                             upper.includes('NATURALGAS NOV') || upper.includes('NATURAL GAS NOV') ||
                             upper.includes('NATURALGAS MINI NOV') || upper.includes('NATURAL GAS MINI NOV') ||
                             upper.includes('SILVER MINI NOV') || upper.includes('GOLD MINI DEC');
          const hasOption = upper.includes(' CE') || upper.includes(' PE') || upper.endsWith('CE') || upper.endsWith('PE');
          const hasFuture = upper.includes('FUT');
          return (
            !isIndex && !isCommodity && !hasOption && !hasFuture
          );
        });
      
      case 'Stock Intraday':
        // Filter for stocks (EQ type, no options/futures)
        // Show same base companies as Stock Options but without CE/PE
        return instruments.filter(inst => {
          const upper = inst.toUpperCase();
          const isIndex = upper.includes('NIFTY 50') || upper.includes('BANK NIFTY') || upper.includes('BANKNIFTY') ||
                         upper.includes('SENSEX') || upper.includes('FINNIFTY') ||
                         upper.includes('BANKEX') || upper.includes('MIDCAP NIFTY') || upper.includes('MIDCPNIFTY');
          const isCommodity = upper.includes('CRUDEOIL NOV') || upper.includes('CRUDE OIL NOV') || 
                             upper.includes('CRUDEOIL MINI NOV') || upper.includes('CRUDE OIL MINI NOV') ||
                             upper.includes('NATURALGAS NOV') || upper.includes('NATURAL GAS NOV') ||
                             upper.includes('NATURALGAS MINI NOV') || upper.includes('NATURAL GAS MINI NOV') ||
                             upper.includes('SILVER MINI NOV') || upper.includes('GOLD MINI DEC');
          const hasOption = upper.includes(' CE') || upper.includes(' PE') || upper.endsWith('CE') || upper.endsWith('PE');
          const hasFuture = upper.includes('FUT');
          return (
            !isIndex && !isCommodity && !hasOption && !hasFuture
          );
        });
      
      case 'Commodity':
        // Filter for commodities - only specified commodities
        return instruments.filter(inst => {
          const upper = inst.toUpperCase();
          return (
            upper.includes('CRUDEOIL NOV') || upper.includes('CRUDE OIL NOV') ||
            upper.includes('CRUDEOIL MINI NOV') || upper.includes('CRUDE OIL MINI NOV') ||
            upper.includes('NATURALGAS NOV') || upper.includes('NATURAL GAS NOV') ||
            upper.includes('NATURALGAS MINI NOV') || upper.includes('NATURAL GAS MINI NOV') ||
            upper.includes('SILVER MINI NOV') || upper.includes('GOLD MINI DEC')
          );
        });
      
      default:
        return instruments;
    }
  }, []);

  // Update filtered instruments when allInstruments changes and a category is selected
  useEffect(() => {
    if (selectedCategory && allInstruments.length > 0) {
      const filtered = filterInstrumentsByCategory(selectedCategory, allInstruments);
      setAvailableInstruments(filtered);
    }
  }, [allInstruments, selectedCategory, filterInstrumentsByCategory]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    // Use allInstruments if available, otherwise use availableInstruments
    const instrumentsToFilter = allInstruments.length > 0 ? allInstruments : availableInstruments;
    
    if (instrumentsToFilter.length > 0) {
      const filtered = filterInstrumentsByCategory(category, instrumentsToFilter);
      setAvailableInstruments(filtered);
      setShowInstrumentModal(true);
    } else {
      // If no instruments loaded yet, ensure they're loaded first
      if (!loadingInstruments && allInstruments.length === 0) {
        fetchInstruments();
      }
      // Still show modal - it will update when instruments load
      setShowInstrumentModal(true);
    }
  }, [allInstruments, availableInstruments, filterInstrumentsByCategory, loadingInstruments, fetchInstruments]);

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
    const instrument = selectedInstruments[0] || '';
    const lotSize = instrument ? getLotSizeForInstrument(instrument) : 1;
    const lots = parseInt(numberOfLots || '1') || 1; // Default to 1 if empty or 0
    const calculatedQuantity = lots * lotSize;
    const newLeg: any = {
      id: Date.now().toString(),
      action: selectedOrderAction as 'Buy' | 'Sell',
      orderType: 'Market',
      quantity: calculatedQuantity.toString(), // Set quantity based on number of lots
      instrument: instrument,
      lotSize: lotSize, // Store lot size based on instrument
      numberOfLots: numberOfLots || '1', // Store number of lots from above selection
      optionType: optionType || 'CE',
      expiryType: expiryType || 'Weekly',
      moneynessType: moneynessType || 'ATM',
      slPercentage: '30',
      tpPercentage: '',
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
    setOrderLegs(prev => [...prev, newLeg]);
  };

  // Update all legs when numberOfLots changes from above
  useEffect(() => {
    if (orderLegs.length > 0 && numberOfLots) {
      const lots = parseInt(numberOfLots || '1') || 1;
      setOrderLegs(prev => prev.map(leg => {
        if (leg.instrument && leg.lotSize) {
          const calculatedQuantity = lots * leg.lotSize;
          return {
            ...leg,
            numberOfLots: numberOfLots,
            quantity: calculatedQuantity.toString()
          };
        }
        return leg;
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfLots]);

  const duplicateOrderLeg = (leg: OrderLeg) => {
    // Create a complete copy of the leg with a new ID
    const duplicatedLeg: any = {
      ...leg,
      id: Date.now().toString(),
      // Ensure all fields are copied
      action: leg.action,
      orderType: leg.orderType,
      quantity: leg.quantity,
      instrument: leg.instrument,
      lotSize: leg.lotSize,
      numberOfLots: (leg as any).numberOfLots || leg.quantity ? Math.floor(parseInt(leg.quantity || '0') / (leg.lotSize || 1)).toString() : '1',
      optionType: leg.optionType || 'CE',
      expiryType: leg.expiryType || 'Weekly',
      moneynessType: leg.moneynessType || 'ATM',
      slPercentage: leg.slPercentage || '30',
      tpPercentage: leg.tpPercentage || '',
      entryCondition: leg.entryCondition ? { ...leg.entryCondition } : undefined,
      exitCondition: leg.exitCondition ? { ...leg.exitCondition } : undefined,
    };
    setOrderLegs(prev => [...prev, duplicatedLeg]);
  };

  const updateOrderLeg = (id: string, updates: Partial<OrderLeg>) => {
    // Check if leg exists in buying order legs
    const existsInBuying = orderLegs.some(leg => leg.id === id);
    if (existsInBuying) {
      setOrderLegs(prev => prev.map(leg => 
        leg.id === id ? { ...leg, ...updates } : leg
      ));
    } else {
      // Update in selling order legs
      setOrderLegsSelling(prev => prev.map(leg => 
        leg.id === id ? { ...leg, ...updates } : leg
      ));
    }
  };

  const saveOrderLeg = (leg: OrderLeg) => {
    // Check if leg exists in buying order legs
    const existingIndexBuying = orderLegs.findIndex(l => l.id === leg.id);
    if (existingIndexBuying >= 0) {
      const updatedLegs = [...orderLegs];
      updatedLegs[existingIndexBuying] = leg;
      setOrderLegs(updatedLegs);
    } else {
      // Check if leg exists in selling order legs
      const existingIndexSelling = orderLegsSelling.findIndex(l => l.id === leg.id);
      if (existingIndexSelling >= 0) {
        const updatedLegs = [...orderLegsSelling];
        updatedLegs[existingIndexSelling] = leg;
        setOrderLegsSelling(updatedLegs);
      } else {
        // If not found in either, add to buying by default (or could add to selling based on context)
        setOrderLegs(prev => [...prev, leg]);
      }
    }
    setShowOrderLegModal(false);
    setCurrentEditingLeg(null);
  };

  const deleteOrderLeg = (id: string) => {
    // Check if leg exists in buying order legs
    const existsInBuying = orderLegs.some(leg => leg.id === id);
    if (existsInBuying) {
      setOrderLegs(prev => prev.filter(leg => leg.id !== id));
    } else {
      // Delete from selling order legs
      setOrderLegsSelling(prev => prev.filter(leg => leg.id !== id));
    }
  };

  const addExitLeg = (type: 'index' | 'selling') => {
    const newExitLeg: ExitLeg = {
      id: Date.now().toString(),
      action: type === 'index' ? 'Buy' : 'Sell', // 'Buy' for Buying exit condition, 'Sell' for Selling exit condition
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
    // Ensure action matches the exit condition type
    const legWithCorrectAction: ExitLeg = {
      ...leg,
      action: (exitLegType === 'index' ? 'Buy' : 'Sell') as 'Buy' | 'Sell'
    };
    
    if (exitLegType === 'index') {
      const existingIndex = exitLegsIndex.findIndex(l => l.id === leg.id);
      if (existingIndex >= 0) {
        const updatedLegs = [...exitLegsIndex];
        updatedLegs[existingIndex] = legWithCorrectAction;
        setExitLegsIndex(updatedLegs);
      } else {
        setExitLegsIndex(prev => [...prev, legWithCorrectAction]);
      }
    } else {
      const existingIndex = exitLegsSelling.findIndex(l => l.id === leg.id);
      if (existingIndex >= 0) {
        const updatedLegs = [...exitLegsSelling];
        updatedLegs[existingIndex] = legWithCorrectAction;
        setExitLegsSelling(updatedLegs);
      } else {
        setExitLegsSelling(prev => [...prev, legWithCorrectAction]);
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
    const indexKeywords = ['NIFTY 50', 'BANK NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'BANKEX', 'MIDCAP NIFTY', 'MIDCPNIFTY'];
    const hasIndexInstruments = instruments.some(instrument => 
      indexKeywords.some(keyword => instrument.toUpperCase().includes(keyword))
    );

    // Check if instruments contain commodity-related symbols - only specified commodities
    const commodityKeywords = ['CRUDEOIL NOV', 'CRUDE OIL NOV', 'CRUDEOIL MINI NOV', 'CRUDE OIL MINI NOV',
                              'NATURALGAS NOV', 'NATURAL GAS NOV', 'NATURALGAS MINI NOV', 'NATURAL GAS MINI NOV',
                              'SILVER MINI NOV', 'GOLD MINI DEC'];
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
  const saveStrategyToStorage = async (
    strategyData: any,
    existingStrategy?: StrategyApiData | null
  ): Promise<{ strategy: StrategyApiData; category: string } | false> => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in to save strategies.');
      return false;
    }

    try {
      const strategyCategory = getStrategyCategory(strategyData.selectedStrategyType, strategyData.instruments);
      const categoryKey = `createdStrategies_${user.id}_${strategyCategory.replace(/\s+/g, '_')}`;
      const generalKey = `createdStrategies_${user.id}`;

      if (existingStrategy) {
        const updatedStrategy: StrategyApiData = {
          ...existingStrategy,
          name: strategyData.strategyName,
          shortName: strategyData.strategyName.substring(0, 10) + '...',
          category: strategyCategory,
          strategyType: strategyData.selectedStrategyType,
          description: `${strategyData.selectedStrategyType} strategy for ${strategyData.instruments.join(', ')}`,
          fullStrategyData: strategyData,
          instruments: strategyData.instruments,
        };

        const generalStrategiesRaw = await AsyncStorage.getItem(generalKey);
        const generalStrategies: StrategyApiData[] = generalStrategiesRaw ? JSON.parse(generalStrategiesRaw) : [];
        const updatedGeneral = generalStrategies.map((strategy) =>
          strategy.id === existingStrategy.id ? updatedStrategy : strategy
        );
        await AsyncStorage.setItem(generalKey, JSON.stringify(updatedGeneral));

        const previousCategory = existingStrategy.category;
        if (previousCategory) {
          const previousCategoryKey = `createdStrategies_${user.id}_${previousCategory.replace(/\s+/g, '_')}`;
          const previousCategoryRaw = await AsyncStorage.getItem(previousCategoryKey);
          if (previousCategoryRaw) {
            let previousStrategies: StrategyApiData[] = JSON.parse(previousCategoryRaw);
            if (previousCategory === strategyCategory) {
              previousStrategies = previousStrategies.map((strategy) =>
                strategy.id === existingStrategy.id ? updatedStrategy : strategy
              );
              await AsyncStorage.setItem(previousCategoryKey, JSON.stringify(previousStrategies));
            } else {
              previousStrategies = previousStrategies.filter((strategy) => strategy.id !== existingStrategy.id);
              await AsyncStorage.setItem(previousCategoryKey, JSON.stringify(previousStrategies));
            }
          }
        }

        if (strategyCategory !== previousCategory) {
          const currentCategoryRaw = await AsyncStorage.getItem(categoryKey);
          const currentCategoryStrategies: StrategyApiData[] = currentCategoryRaw ? JSON.parse(currentCategoryRaw) : [];
          const updatedCategory = [
            updatedStrategy,
            ...currentCategoryStrategies.filter((strategy) => strategy.id !== existingStrategy.id),
          ];
          await AsyncStorage.setItem(categoryKey, JSON.stringify(updatedCategory));
        } else {
          const currentCategoryRaw = await AsyncStorage.getItem(categoryKey);
          const currentCategoryStrategies: StrategyApiData[] = currentCategoryRaw ? JSON.parse(currentCategoryRaw) : [];
          const updatedCategory = currentCategoryStrategies.map((strategy) =>
            strategy.id === existingStrategy.id ? updatedStrategy : strategy
          );
          await AsyncStorage.setItem(categoryKey, JSON.stringify(updatedCategory));
        }

        console.log(`Strategy updated in category: ${strategyCategory}`);
        return { strategy: updatedStrategy, category: strategyCategory };
      }

      const existingStrategiesRaw = await AsyncStorage.getItem(categoryKey);
      const strategies: StrategyApiData[] = existingStrategiesRaw ? JSON.parse(existingStrategiesRaw) : [];

      const newStrategy: StrategyApiData = {
        id: Date.now().toString(),
        name: strategyData.strategyName,
        shortName: strategyData.strategyName.substring(0, 10) + '...',
        category: strategyCategory,
        strategyType: strategyData.selectedStrategyType,
        description: `${strategyData.selectedStrategyType} strategy for ${strategyData.instruments.join(', ')}`,
        totalReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        margin: 0,
        performance: [],
        risk: 'Medium' as const,
        isActive: false,
        createdAt: new Date().toISOString(),
        fullStrategyData: strategyData,
        userId: user.id,
        instruments: strategyData.instruments,
      };

      const updatedStrategies = [newStrategy, ...strategies];
      await AsyncStorage.setItem(categoryKey, JSON.stringify(updatedStrategies));

      const generalStrategiesRaw = await AsyncStorage.getItem(generalKey);
      const allStrategies: StrategyApiData[] = generalStrategiesRaw ? JSON.parse(generalStrategiesRaw) : [];
      const updatedAllStrategies = [newStrategy, ...allStrategies];
      await AsyncStorage.setItem(generalKey, JSON.stringify(updatedAllStrategies));

      console.log(`Strategy saved to category: ${strategyCategory}`);
      return { strategy: newStrategy, category: strategyCategory };
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

    if (selectedStrategyType === 'Candle Based' && orderLegs.length === 0 && orderLegsSelling.length === 0) {
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
      orderLegsSelling,
      entryConditions: {
        // Entry Conditions - Buying
        entryFirstCandleColorBuying,
        entryFirstCandleTimingBuying,
        entrySecondCandleColorBuying,
        entrySecondCandleTimingBuying,
        entryCandleTimeSelectionBuying,
        entryTimeRangeBuying,
        // Entry Conditions - Selling
        entryFirstCandleColorSelling,
        entryFirstCandleTimingSelling,
        entrySecondCandleColorSelling,
        entrySecondCandleTimingSelling,
        entryCandleTimeSelectionSelling,
        entryTimeRangeSelling,
      },
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
      createdAt: activeEditingStrategy ? activeEditingStrategy.createdAt : new Date().toISOString(),
    };

    console.log('Saving strategy:', strategyData);
    
    // Save strategy to user-specific storage
    const saveSuccess = await saveStrategyToStorage(strategyData, activeEditingStrategy);
    
    if (!saveSuccess) {
      return; // Error already handled in saveStrategyToStorage
    }
    
    // Get the category for display
    const strategyCategory = getStrategyCategory(strategyData.selectedStrategyType, strategyData.instruments);
    
    if (activeEditingStrategy) {
      // Update existing strategy
      if (onStrategyUpdated) {
        onStrategyUpdated(activeEditingStrategy, strategyData);
      }
      
      if (onEditComplete) {
        onEditComplete();
      }

      Alert.alert('Success', `Strategy updated successfully in ${strategyCategory} category!`, [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
          }
        }
      ]);
    } else {
      // Create new strategy
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
      
      // Reset form for new strategy
      resetForm();
    }
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

        {/* Chart Type Dropdown - Only for Candle Based after asset class selection */}
        {selectedStrategyType === 'Candle Based' && selectedAssetClass && (
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
        <View style={[styles.section, styles.instrumentsSection]}>
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
          <View style={styles.categoryContainer}>
            {['Index Options', 'Stock Options', 'Stock Intraday', 'Commodity'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => {
                  if (allInstruments.length === 0 && !loadingInstruments) {
                    fetchInstruments();
                  }
                  handleCategorySelect(category);
                }}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryButtonText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                  chartType={selectedChartType}
                  onCandlePatternDetected={handleCandlePatternDetected}
                  onChartTypeChange={(type) => setSelectedChartType(type)}
                  action={selectedTransactionType as 'Buy' | 'Sell' | 'Both'}
                />
              </View>
            )}

            {/* Chart Type Indicator */}
            {showLiveChart && selectedChartInstrument && (
              <View style={styles.chartTypeIndicator}>
                <Text style={styles.chartTypeIndicatorText}>
                  Displaying: <Text style={styles.chartTypeIndicatorBold}>{selectedChartType}</Text> Chart
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Enhanced Entry Conditions for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <>
            {/* Entry Condition - Buying */}
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entry Condition - Buying</Text>
            
            {/* First Candle Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Select Candle I</Text>
              <View style={styles.conditionControls}>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                        setCurrentDropdownType('entryFirstCandleColorBuying');
                      setShowCandleColorModal(true);
                    }}
                  >
                      <Text style={styles.dropdownText}>{entryFirstCandleColorBuying}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                        setCurrentDropdownType('entryFirstCandleTimingBuying');
                      setShowCandleTimingModal(true);
                    }}
                  >
                      <Text style={styles.dropdownText}>{entryFirstCandleTimingBuying}</Text>
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
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                        setCurrentDropdownType('entrySecondCandleColorBuying');
                      setShowCandleColorModal(true);
                    }}
                  >
                      <Text style={styles.dropdownText}>{entrySecondCandleColorBuying}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                        setCurrentDropdownType('entrySecondCandleTimingBuying');
                      setShowCandleTimingModal(true);
                    }}
                  >
                      <Text style={styles.dropdownText}>{entrySecondCandleTimingBuying}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Candle Time Selection */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Select II Candle Time</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {
                      setCurrentDropdownType('entryCandleTimeSelectionBuying');
                    setShowCandleTimingModal(true);
                  }}
                >
                    <Text style={styles.dropdownText}>{entryCandleTimeSelectionBuying}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Range */}
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Time Range</Text>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {
                      setCurrentDropdownType('entryTimeRangeBuying');
                    setShowTimeRangeModal(true);
                  }}
                >
                    <Text style={styles.dropdownText}>{entryTimeRangeBuying} sec</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Order Leg Section for Entry Condition - Buying */}
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

              {/* Lot Size - Input with calculated quantity */}
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Lot</Text>
                <View style={styles.dropdownWrapper}>
                  {selectedInstruments.length > 0 ? (
                    <View style={styles.lotSizeInputContainer}>
                      <View style={styles.lotSizeInputRow}>
                        <TextInput
                          style={styles.lotSizeInput}
                          value={numberOfLots}
                          onChangeText={(value) => {
                            const numericValue = value.replace(/[^0-9]/g, '');
                            setNumberOfLots(numericValue);
                          }}
                          keyboardType="numeric"
                          placeholder="1"
                          placeholderTextColor="#999"
                        />
                        <Text style={styles.lotSizeLabel}>Lots</Text>
                      </View>
                      <Text style={styles.lotSizeText}>
                        {numberOfLots ? (
                          <>
                            = {parseInt(numberOfLots) * getLotSizeForInstrument(selectedInstruments[0])} Quantity
                            {' '}(1 Lot = {getLotSizeForInstrument(selectedInstruments[0])} Qty)
                          </>
                        ) : (
                          <>Enter number of lots</>
                        )}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.lotSizeDisplay}>
                      <Text style={styles.lotSizeText}>
                        Select instrument to see lot size
                      </Text>
                    </View>
                  )}
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
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setCurrentDropdownType('moneynessType');
                      setShowMoneynessModal(true);
                    }}
                  >
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

              {/* SAME Candle */}
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>SAME Candle</Text>
                <View style={styles.conditionControls}>
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setCurrentDropdownType('sameCandle');
                        setShowSameCandleModal(true);
                      }}
                    >
                      <Text style={styles.dropdownText}>{sameCandleSelection}</Text>
                      <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* SL Trail */}
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>SL Trail</Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setCurrentDropdownType('slTrailType');
                      setShowSlTrailModal(true);
                    }}
                  >
                    <Text style={styles.dropdownText}>{slTrailType}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* THEN Previous-1 */}
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>THEN Previous-1</Text>
                <View style={styles.conditionControls}>
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setCurrentDropdownType('previousMinusOne');
                        setShowPreviousMinusOneModal(true);
                      }}
                    >
                      <Text style={styles.dropdownText}>{previousMinusOneSelection}</Text>
                      <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.okButton}
                    onPress={() => {
                      const instrument = selectedInstruments[0] || '';
                      if (!instrument) {
                        Alert.alert('Error', 'Please select an instrument first');
                        return;
                      }
                      
                      const lotSize = getLotSizeForInstrument(instrument);
                      const lots = parseInt(numberOfLots || '1') || 1;
                      const calculatedQuantity = lots * lotSize;
                      
                      const isBuy = selectedOrderAction === 'Buy';
                      const entryFirstCandleColor = isBuy ? entryFirstCandleColorBuying : entryFirstCandleColorSelling;
                      const entryFirstCandleTiming = isBuy ? entryFirstCandleTimingBuying : entryFirstCandleTimingSelling;
                      const entrySecondCandleColor = isBuy ? entrySecondCandleColorBuying : entrySecondCandleColorSelling;
                      const entrySecondCandleTiming = isBuy ? entrySecondCandleTimingBuying : entrySecondCandleTimingSelling;
                      const entryCandleTimeSelection = isBuy ? entryCandleTimeSelectionBuying : entryCandleTimeSelectionSelling;
                      const entryTimeRange = isBuy ? entryTimeRangeBuying : entryTimeRangeSelling;
                      
                      const newLeg: OrderLeg = {
                        id: Date.now().toString(),
                        action: selectedOrderAction as 'Buy' | 'Sell',
                        orderType: entryPriceType === 'Market' ? 'Market' : 'Limit',
                        quantity: calculatedQuantity.toString(),
                        instrument: instrument,
                        lotSize: lotSize,
                        numberOfLots: numberOfLots || '1',
                        optionType: optionType,
                        expiryType: expiryType,
                        moneynessType: moneynessType,
                        entryCondition: {
                          candleType: `${entryFirstCandleColor}/${entrySecondCandleColor}`,
                          candleColor: `${entryFirstCandleColor}, ${entrySecondCandleColor}`,
                          candleTime: `${entryFirstCandleTiming}, ${entrySecondCandleTiming}, ${entryCandleTimeSelection}, ${entryTimeRange}`
                        },
                        exitCondition: {
                          candleType: 'N/A',
                          candleColor: 'N/A',
                          profitTarget: '0',
                          stopLoss: '0'
                        },
                        firstCandleColor: entryFirstCandleColor,
                        firstCandleTiming: entryFirstCandleTiming,
                        secondCandleColor: entrySecondCandleColor,
                        secondCandleTiming: entrySecondCandleTiming,
                        candleTimeSelection: entryCandleTimeSelection,
                        timeRange: entryTimeRange,
                        sameCandleSelection: sameCandleSelection,
                        previousMinusOneSelection: previousMinusOneSelection,
                        slTrailType: slTrailType
                      } as any;
                      
                      setOrderLegs(prev => [...prev, newLeg]);
                      Alert.alert('Success', 'Order leg configured successfully!');
                    }}
                  >
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Configured Order Legs Section for Entry Condition - Buying */}
          {selectedStrategyType === 'Candle Based' && (
            <View style={styles.section}>
              <View style={styles.orderLegsHeader}>
                <Text style={styles.orderLegsTitle}>Configured Order Legs</Text>
              </View>

              <TouchableOpacity style={styles.addLegButton} onPress={addOrderLeg}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addLegText}>+ ADD LEG</Text>
              </TouchableOpacity>

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
                </View>
              ))}
            </View>
          )}

          {/* Second Entry Condition - Buying */}
          {selectedStrategyType === 'Candle Based' && showAdditionalEntryConditions && (
            <>
              {/* Entry Condition - Buying */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Entry Condition - Buying</Text>
                
                {/* First Candle Selection */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Select Candle I</Text>
                  <View style={styles.conditionControls}>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('entryFirstCandleColorBuying');
                          setShowCandleColorModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{entryFirstCandleColorBuying}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('entryFirstCandleTimingBuying');
                          setShowCandleTimingModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{entryFirstCandleTimingBuying}</Text>
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
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('entrySecondCandleColorBuying');
                          setShowCandleColorModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{entrySecondCandleColorBuying}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('entrySecondCandleTimingBuying');
                          setShowCandleTimingModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{entrySecondCandleTimingBuying}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Candle Time Selection */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Select II Candle Time</Text>
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setCurrentDropdownType('entryCandleTimeSelectionBuying');
                        setShowCandleTimingModal(true);
                      }}
                    >
                      <Text style={styles.dropdownText}>{entryCandleTimeSelectionBuying}</Text>
                      <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Time Range */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Time Range</Text>
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setCurrentDropdownType('entryTimeRangeBuying');
                        setShowTimeRangeModal(true);
                      }}
                    >
                      <Text style={styles.dropdownText}>{entryTimeRangeBuying} sec</Text>
                      <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Order Leg Section for Entry Condition - Buying */}
              {selectedStrategyType === 'Candle Based' && showAdditionalEntryConditions && (
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

                  {/* Lot Size - Input with calculated quantity */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>Lot</Text>
                    <View style={styles.dropdownWrapper}>
                      {selectedInstruments.length > 0 ? (
                        <View style={styles.lotSizeInputContainer}>
                          <View style={styles.lotSizeInputRow}>
                            <TextInput
                              style={styles.lotSizeInput}
                              value={numberOfLots}
                              onChangeText={(value) => {
                                const numericValue = value.replace(/[^0-9]/g, '');
                                setNumberOfLots(numericValue);
                              }}
                              keyboardType="numeric"
                              placeholder="1"
                              placeholderTextColor="#999"
                            />
                            <Text style={styles.lotSizeLabel}>Lots</Text>
                          </View>
                          <Text style={styles.lotSizeText}>
                            {numberOfLots ? (
                              <>
                                = {parseInt(numberOfLots) * getLotSizeForInstrument(selectedInstruments[0])} Quantity
                                {' '}(1 Lot = {getLotSizeForInstrument(selectedInstruments[0])} Qty)
                              </>
                            ) : (
                              <>Enter number of lots</>
                            )}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.lotSizeDisplay}>
                          <Text style={styles.lotSizeText}>
                            Select instrument to see lot size
                          </Text>
                        </View>
                      )}
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
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('moneynessType');
                          setShowMoneynessModal(true);
                        }}
                      >
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

                  {/* SAME Candle */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>SAME Candle</Text>
                    <View style={styles.conditionControls}>
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            setCurrentDropdownType('sameCandle');
                            setShowSameCandleModal(true);
                          }}
                        >
                          <Text style={styles.dropdownText}>{sameCandleSelection}</Text>
                          <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* SL Trail */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>SL Trail</Text>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('slTrailType');
                          setShowSlTrailModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{slTrailType}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* THEN Previous-1 */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>THEN Previous-1</Text>
                    <View style={styles.conditionControls}>
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            setCurrentDropdownType('previousMinusOne');
                            setShowPreviousMinusOneModal(true);
                          }}
                        >
                          <Text style={styles.dropdownText}>{previousMinusOneSelection}</Text>
                          <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity 
                        style={styles.okButton}
                        onPress={() => {
                          const instrument = selectedInstruments[0] || '';
                          if (!instrument) {
                            Alert.alert('Error', 'Please select an instrument first');
                            return;
                          }
                          
                          const lotSize = getLotSizeForInstrument(instrument);
                          const lots = parseInt(numberOfLots || '1') || 1;
                          const calculatedQuantity = lots * lotSize;
                          
                          const isBuy = selectedOrderAction === 'Buy';
                          const entryFirstCandleColor = isBuy ? entryFirstCandleColorBuying : entryFirstCandleColorSelling;
                          const entryFirstCandleTiming = isBuy ? entryFirstCandleTimingBuying : entryFirstCandleTimingSelling;
                          const entrySecondCandleColor = isBuy ? entrySecondCandleColorBuying : entrySecondCandleColorSelling;
                          const entrySecondCandleTiming = isBuy ? entrySecondCandleTimingBuying : entrySecondCandleTimingSelling;
                          const entryCandleTimeSelection = isBuy ? entryCandleTimeSelectionBuying : entryCandleTimeSelectionSelling;
                          const entryTimeRange = isBuy ? entryTimeRangeBuying : entryTimeRangeSelling;
                          
                          const newLeg: OrderLeg = {
                            id: Date.now().toString(),
                            action: selectedOrderAction as 'Buy' | 'Sell',
                            orderType: entryPriceType === 'Market' ? 'Market' : 'Limit',
                            quantity: calculatedQuantity.toString(),
                            instrument: instrument,
                            lotSize: lotSize,
                            numberOfLots: numberOfLots || '1',
                            optionType: optionType,
                            expiryType: expiryType,
                            moneynessType: moneynessType,
                            entryCondition: {
                              candleType: `${entryFirstCandleColor}/${entrySecondCandleColor}`,
                              candleColor: `${entryFirstCandleColor}, ${entrySecondCandleColor}`,
                              candleTime: `${entryFirstCandleTiming}, ${entrySecondCandleTiming}, ${entryCandleTimeSelection}, ${entryTimeRange}`
                            },
                            exitCondition: {
                              candleType: 'N/A',
                              candleColor: 'N/A',
                              profitTarget: '0',
                              stopLoss: '0'
                            },
                            firstCandleColor: entryFirstCandleColor,
                            firstCandleTiming: entryFirstCandleTiming,
                            secondCandleColor: entrySecondCandleColor,
                            secondCandleTiming: entrySecondCandleTiming,
                            candleTimeSelection: entryCandleTimeSelection,
                            timeRange: entryTimeRange,
                            sameCandleSelection: sameCandleSelection,
                            previousMinusOneSelection: previousMinusOneSelection,
                            slTrailType: slTrailType
                          } as any;
                          
                          setOrderLegs(prev => [...prev, newLeg]);
                          Alert.alert('Success', 'Order leg configured successfully!');
                        }}
                      >
                        <Text style={styles.okButtonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Configured Order Legs Section for Entry Condition - Buying */}
              {selectedStrategyType === 'Candle Based' && showAdditionalEntryConditions && (
                <View style={styles.section}>
                  <View style={styles.orderLegsHeader}>
                    <Text style={styles.orderLegsTitle}>Configured Order Legs</Text>
                  </View>

                  <TouchableOpacity style={styles.addLegButton} onPress={addOrderLeg}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addLegText}>+ ADD LEG</Text>
                  </TouchableOpacity>

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
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Buttons to show Entry Condition - Selling */}
          {selectedStrategyType === 'Candle Based' && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={[
                  styles.addLegButton,
                  showEntryConditionSelling && !showEntryConditionSellingSecond && styles.disabledButton
                ]} 
                onPress={() => {
                  setShowEntryConditionSelling(true);
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addLegText}>+ ADD ENTRY CONDITION - SELLING</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Second Button to show Entry Condition - Selling */}
          {selectedStrategyType === 'Candle Based' && showAdditionalEntryConditions && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={[
                  styles.addLegButton,
                  showEntryConditionSellingSecond && styles.disabledButton
                ]} 
                onPress={() => {
                  if (!showEntryConditionSellingSecond) {
                    setShowEntryConditionSellingSecond(true);
                    // Show the sections when second button is clicked
                    if (!showEntryConditionSelling) {
                      setShowEntryConditionSelling(true);
                    }
                  }
                }}
                disabled={showEntryConditionSellingSecond}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addLegText}>+ ADD ENTRY CONDITION - SELLING</Text>
              </TouchableOpacity>
            </View>
          )}

            {/* Entry Condition - Selling */}
            {selectedStrategyType === 'Candle Based' && showEntryConditionSelling && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Entry Condition - Selling</Text>
                  
                  {/* First Candle Selection */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>Select Candle I</Text>
                    <View style={styles.conditionControls}>
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            setCurrentDropdownType('entryFirstCandleColorSelling');
                            setShowCandleColorModal(true);
                          }}
                        >
                          <Text style={styles.dropdownText}>{entryFirstCandleColorSelling}</Text>
                          <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            setCurrentDropdownType('entryFirstCandleTimingSelling');
                            setShowCandleTimingModal(true);
                          }}
                        >
                          <Text style={styles.dropdownText}>{entryFirstCandleTimingSelling}</Text>
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
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            setCurrentDropdownType('entrySecondCandleColorSelling');
                            setShowCandleColorModal(true);
                          }}
                        >
                          <Text style={styles.dropdownText}>{entrySecondCandleColorSelling}</Text>
                          <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            setCurrentDropdownType('entrySecondCandleTimingSelling');
                            setShowCandleTimingModal(true);
                          }}
                        >
                          <Text style={styles.dropdownText}>{entrySecondCandleTimingSelling}</Text>
                          <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Candle Time Selection */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>Select II Candle Time</Text>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('entryCandleTimeSelectionSelling');
                          setShowCandleTimingModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{entryCandleTimeSelectionSelling}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Time Range */}
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>Time Range</Text>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('entryTimeRangeSelling');
                          setShowTimeRangeModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{entryTimeRangeSelling} sec</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Order Leg Section for Entry Condition - Selling */}
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

                {/* Lot Size - Input with calculated quantity */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Lot</Text>
                  <View style={styles.dropdownWrapper}>
                    {selectedInstruments.length > 0 ? (
                      <View style={styles.lotSizeInputContainer}>
                        <View style={styles.lotSizeInputRow}>
                          <TextInput
                            style={styles.lotSizeInput}
                            value={numberOfLots}
                            onChangeText={(value) => {
                              const numericValue = value.replace(/[^0-9]/g, '');
                              setNumberOfLots(numericValue);
                            }}
                            keyboardType="numeric"
                            placeholder="1"
                            placeholderTextColor="#999"
                          />
                          <Text style={styles.lotSizeLabel}>Lots</Text>
                        </View>
                        <Text style={styles.lotSizeText}>
                          {numberOfLots ? (
                            <>
                              = {parseInt(numberOfLots) * getLotSizeForInstrument(selectedInstruments[0])} Quantity
                              {' '}(1 Lot = {getLotSizeForInstrument(selectedInstruments[0])} Qty)
                            </>
                          ) : (
                            <>Enter number of lots</>
                          )}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.lotSizeDisplay}>
                        <Text style={styles.lotSizeText}>
                          Select instrument to see lot size
                        </Text>
                      </View>
                    )}
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
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setCurrentDropdownType('moneynessType');
                        setShowMoneynessModal(true);
                      }}
                    >
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

                {/* SAME Candle */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>SAME Candle</Text>
                  <View style={styles.conditionControls}>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('sameCandle');
                          setShowSameCandleModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{sameCandleSelection}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* SL Trail */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>SL Trail</Text>
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setCurrentDropdownType('slTrailType');
                        setShowSlTrailModal(true);
                      }}
                    >
                      <Text style={styles.dropdownText}>{slTrailType}</Text>
                      <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* THEN Previous-1 */}
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>THEN Previous-1</Text>
                  <View style={styles.conditionControls}>
                    <View style={styles.dropdownWrapper}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          setCurrentDropdownType('previousMinusOne');
                          setShowPreviousMinusOneModal(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>{previousMinusOneSelection}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                      style={styles.okButton}
                      onPress={() => {
                        const instrument = selectedInstruments[0] || '';
                        if (!instrument) {
                          Alert.alert('Error', 'Please select an instrument first');
                          return;
                        }
                        
                        const lotSize = getLotSizeForInstrument(instrument);
                        const lots = parseInt(numberOfLots || '1') || 1;
                        const calculatedQuantity = lots * lotSize;
                        
                        // Always use selling entry conditions for selling order leg
                        const newLeg: OrderLeg = {
                          id: Date.now().toString(),
                          action: selectedOrderAction as 'Buy' | 'Sell',
                          orderType: entryPriceType === 'Market' ? 'Market' : 'Limit',
                          quantity: calculatedQuantity.toString(),
                          instrument: instrument,
                          lotSize: lotSize,
                          numberOfLots: numberOfLots || '1',
                          optionType: optionType,
                          expiryType: expiryType,
                          moneynessType: moneynessType,
                          entryCondition: {
                            candleType: `${entryFirstCandleColorSelling}/${entrySecondCandleColorSelling}`,
                            candleColor: `${entryFirstCandleColorSelling}, ${entrySecondCandleColorSelling}`,
                            candleTime: `${entryFirstCandleTimingSelling}, ${entrySecondCandleTimingSelling}, ${entryCandleTimeSelectionSelling}, ${entryTimeRangeSelling}`
                          },
                          exitCondition: {
                            candleType: 'N/A',
                            candleColor: 'N/A',
                            profitTarget: '0',
                            stopLoss: '0'
                          },
                          firstCandleColor: entryFirstCandleColorSelling,
                          firstCandleTiming: entryFirstCandleTimingSelling,
                          secondCandleColor: entrySecondCandleColorSelling,
                          secondCandleTiming: entrySecondCandleTimingSelling,
                          candleTimeSelection: entryCandleTimeSelectionSelling,
                          timeRange: entryTimeRangeSelling,
                          sameCandleSelection: sameCandleSelection,
                          previousMinusOneSelection: previousMinusOneSelection,
                          slTrailType: slTrailType
                        } as any;
                        
                        setOrderLegsSelling(prev => [...prev, newLeg]);
                        Alert.alert('Success', 'Order leg configured successfully!');
                      }}
                    >
                      <Text style={styles.okButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Configured Order Legs Section for Entry Condition - Selling */}
              <View style={styles.section}>
                <View style={styles.orderLegsHeader}>
                  <Text style={styles.orderLegsTitle}>Configured Order Legs</Text>
                </View>

                <TouchableOpacity style={styles.addLegButton} onPress={() => {
                  // Add a new leg to selling order legs
                  const instrument = selectedInstruments[0] || '';
                  if (!instrument) {
                    Alert.alert('Error', 'Please select an instrument first');
                    return;
                  }
                  
                  const lotSize = getLotSizeForInstrument(instrument);
                  const lots = parseInt(numberOfLots || '1') || 1;
                  const calculatedQuantity = lots * lotSize;
                  
                  const newLeg: OrderLeg = {
                    id: Date.now().toString(),
                    action: selectedOrderAction as 'Buy' | 'Sell',
                    orderType: entryPriceType === 'Market' ? 'Market' : 'Limit',
                    quantity: calculatedQuantity.toString(),
                    instrument: instrument,
                    lotSize: lotSize,
                    numberOfLots: numberOfLots || '1',
                    optionType: optionType,
                    expiryType: expiryType,
                    moneynessType: moneynessType,
                    entryCondition: {
                      candleType: `${entryFirstCandleColorSelling}/${entrySecondCandleColorSelling}`,
                      candleColor: `${entryFirstCandleColorSelling}, ${entrySecondCandleColorSelling}`,
                      candleTime: `${entryFirstCandleTimingSelling}, ${entrySecondCandleTimingSelling}, ${entryCandleTimeSelectionSelling}, ${entryTimeRangeSelling}`
                    },
                    exitCondition: {
                      candleType: 'N/A',
                      candleColor: 'N/A',
                      profitTarget: '0',
                      stopLoss: '0'
                    },
                    firstCandleColor: entryFirstCandleColorSelling,
                    firstCandleTiming: entryFirstCandleTimingSelling,
                    secondCandleColor: entrySecondCandleColorSelling,
                    secondCandleTiming: entrySecondCandleTimingSelling,
                    candleTimeSelection: entryCandleTimeSelectionSelling,
                    timeRange: entryTimeRangeSelling,
                    sameCandleSelection: sameCandleSelection,
                    previousMinusOneSelection: previousMinusOneSelection,
                    slTrailType: slTrailType
                  } as any;
                  
                  setOrderLegsSelling(prev => [...prev, newLeg]);
                }}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addLegText}>+ ADD LEG</Text>
                </TouchableOpacity>

                {orderLegsSelling.map((leg) => (
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
                          onPress={() => {
                            setOrderLegsSelling(prev => prev.filter(l => l.id !== leg.id));
                          }}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash" size={16} color="#f44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              </>
            )}
          </>
        )}

        {/* Enhanced Order Leg Section removed - Order legs now only shown with their respective entry condition buttons */}

        {/* Order Legs Section removed - Order legs now only shown with their respective entry condition buttons */}

        {/* Button to show additional entry conditions - Removed: Buying entry condition shows automatically */}

        {/* Exit Conditions for Candle Based - Below Order Leg */}
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

        {/* Exit Conditions for Candle Based */}
        {selectedStrategyType === 'Candle Based' && showAdditionalExitConditions && (
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

        {/* Button to show additional exit conditions */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[
                styles.addLegButton,
                showAdditionalExitConditions && styles.disabledButton
              ]} 
              onPress={() => !showAdditionalExitConditions && setShowAdditionalExitConditions(true)}
              disabled={showAdditionalExitConditions}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addLegText}>+ ADD EXIT CONDITIONS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Risk Management */}
        <View style={styles.section}>

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
                              onPress={() => {
                                const lotSize = getLotSizeForInstrument(instrument);
                                const lots = parseInt((currentEditingLeg as any).numberOfLots || '1');
                                const calculatedQuantity = lots * lotSize;
                                setCurrentEditingLeg(prev => (prev ? { 
                                  ...prev, 
                                  instrument,
                                  lotSize: lotSize,
                                  quantity: calculatedQuantity.toString()
                                } : null));
                              }}
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

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Lots</Text>
                      <View style={styles.lotSizeInputRowModal}>
                        <TextInput
                          style={styles.lotSizeInputModal}
                          value={(currentEditingLeg as any).numberOfLots || ''}
                          onChangeText={(value) => {
                            // Only allow numeric input, allow empty for clearing
                            const numericValue = value.replace(/[^0-9]/g, '');
                            const lots = parseInt(numericValue || '0');
                            if (currentEditingLeg?.instrument && lots > 0) {
                              const lotSize = getLotSizeForInstrument(currentEditingLeg.instrument);
                              const calculatedQuantity = lots * lotSize;
                              setCurrentEditingLeg(prev => prev ? {
                                ...prev,
                                quantity: calculatedQuantity.toString(),
                                numberOfLots: numericValue
                              } : null);
                            } else {
                              setCurrentEditingLeg(prev => prev ? {
                                ...prev,
                                numberOfLots: numericValue
                              } : null);
                            }
                          }}
                          keyboardType="numeric"
                          placeholder="1"
                          placeholderTextColor="#999"
                        />
                        <Text style={styles.lotSizeLabelModal}>Lots</Text>
                      </View>
                      {currentEditingLeg.instrument && (
                        <View style={styles.lotSizeInfo}>
                          <Text style={styles.lotSizeInfoText}>
                            {(currentEditingLeg as any).numberOfLots ? (
                              <>
                                {(currentEditingLeg as any).numberOfLots} Lot(s) = {currentEditingLeg.quantity} Quantity
                                {' '}(1 Lot = {getLotSizeForInstrument(currentEditingLeg.instrument)} Qty)
                              </>
                            ) : (
                              <>Enter number of lots</>
                            )}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Quantity</Text>
                      <TextInput
                        style={styles.formInput}
                        value={currentEditingLeg.quantity}
                        onChangeText={(value) => {
                          // Allow manual quantity entry but update lots if instrument is selected
                          setCurrentEditingLeg(prev => {
                            if (prev && prev.instrument) {
                              const lotSize = getLotSizeForInstrument(prev.instrument);
                              const numericValue = value.replace(/[^0-9]/g, '');
                              const quantity = parseInt(numericValue || '0');
                              const calculatedLots = Math.floor(quantity / lotSize);
                              return {
                                ...prev,
                                quantity: numericValue,
                                numberOfLots: calculatedLots > 0 ? calculatedLots.toString() : '1'
                              };
                            }
                            return prev ? {...prev, quantity: value} : null;
                          });
                        }}
                        placeholder="1"
                        keyboardType="numeric"
                      />
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
                        {(exitLegType === 'index' ? ['Buy'] : ['Sell']).map((action) => (
                          <TouchableOpacity
                            key={action}
                            style={styles.radioOption}
                            onPress={() => setCurrentEditingExitLeg(prev => prev ? {...prev, action: action as 'Buy' | 'Sell'} : null)}
                          >
                            <View style={styles.radioButton}>
                              {currentEditingExitLeg.action === action && <View style={styles.radioButtonInner} />}
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
              <Text style={styles.modalTitle}>
                {selectedCategory ? `Select ${selectedCategory}` : 'Select Instruments'}
              </Text>
              {loadingMarketData && (
                <ActivityIndicator size="small" color="#1976d2" />
              )}
              <TouchableOpacity 
                onPress={() => {
                  setShowInstrumentModal(false);
                  setInstrumentSearchQuery('');
                  // Reset to show all instruments when modal closes
                  if (allInstruments.length > 0) {
                    setAvailableInstruments(allInstruments);
                  }
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
                onPress={() => {
                  // Auto-select the last added instrument when OK/Done is clicked
                  if (selectedInstruments.length > 0) {
                    const lastInstrument = selectedInstruments[selectedInstruments.length - 1];
                    
                    // For Candle Based strategy, select it as chart instrument
                    if (selectedStrategyType === 'Candle Based') {
                      setSelectedChartInstrument(lastInstrument);
                    }
                    
                    // For all strategy types, the last added instrument is now selected
                    // It will be available in selectedInstruments array and ready to use
                    // The instrument is automatically highlighted/selected in the UI
                  }
                  setShowInstrumentModal(false);
                  setInstrumentSearchQuery('');
                  // Reset to show all instruments when modal closes
                  if (allInstruments.length > 0) {
                    setAvailableInstruments(allInstruments);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>OK ({selectedInstruments.length})</Text>
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
            
            <ScrollView style={styles.chartTypeScrollView}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Universal Dropdown Modal */}
      <Modal visible={showCandleColorModal || showCandleTimingModal || showMoneynessModal || showAtmStrikeModal || showSlTypeModal || showSlTrailModal || showTimeRangeModal || showSameCandleModal || showPreviousMinusOneModal || showPreviousCandleModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCandleColorModal(false);
                  setShowCandleTimingModal(false);
                  setShowMoneynessModal(false);
                  setShowAtmStrikeModal(false);
                  setShowSlTypeModal(false);
                  setShowSlTrailModal(false);
                  setShowTimeRangeModal(false);
                  setShowSameCandleModal(false);
                  setShowPreviousMinusOneModal(false);
                  setShowPreviousCandleModal(false);
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
                else if (showMoneynessModal) options = moneynessTypes;
                else if (showAtmStrikeModal) options = atmStrikes;
                else if (showSlTypeModal) options = slTypes;
                else if (showSlTrailModal) options = slTrailTypes;
                else if (showTimeRangeModal) options = timeRanges;
                else if (showSameCandleModal || showPreviousMinusOneModal || showPreviousCandleModal) options = highLowOptions;

                return options.map((option) => {
                  // Add "sec" suffix for time range options
                  const displayText = showTimeRangeModal ? `${option} sec` : option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        handleDropdownSelect(currentDropdownType, option);
                        setShowCandleColorModal(false);
                        setShowCandleTimingModal(false);
                        setShowMoneynessModal(false);
                        setShowAtmStrikeModal(false);
                        setShowSlTypeModal(false);
                        setShowSlTrailModal(false);
                        setShowTimeRangeModal(false);
                        setShowSameCandleModal(false);
                        setShowPreviousMinusOneModal(false);
                        setShowPreviousCandleModal(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{displayText}</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Exit Condition Modal */}
      <Modal visible={showExitConditionModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.orderLegModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Exit Condition - {exitConditionModalType === 'buying' ? 'Buying' : 'Selling'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowExitConditionModal(false);
                  // Reset modal form fields
                  setModalExitOptionType('CE');
                  setModalExitCandleTiming('Start');
                  setModalExitCandleColor('Green');
                  setModalExitSlHit(false);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.orderLegForm}>
              <View style={styles.formSection}>
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Exit CE/PE</Text>
                  <View style={styles.radioContainer}>
                    {['CE', 'PE'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.radioOption}
                        onPress={() => setModalExitOptionType(type)}
                      >
                        <View style={styles.radioButton}>
                          {modalExitOptionType === type && <View style={styles.radioButtonInner} />}
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
                        onPress={() => setModalExitCandleTiming(timing)}
                      >
                        <View style={styles.radioButton}>
                          {modalExitCandleTiming === timing && <View style={styles.radioButtonInner} />}
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
                        onPress={() => setModalExitCandleColor(color)}
                      >
                        <View style={styles.radioButton}>
                          {modalExitCandleColor === color && <View style={styles.radioButtonInner} />}
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
                      onPress={() => setModalExitSlHit(!modalExitSlHit)}
                    >
                      <View style={styles.radioButton}>
                        {modalExitSlHit && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>SL HIT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  // Update the main form fields with modal values
                  setExitOptionType(modalExitOptionType);
                  setExitCandleTiming(modalExitCandleTiming);
                  setExitCandleColor(modalExitCandleColor);
                  setExitSlHit(modalExitSlHit);
                  // Close modal
                  setShowExitConditionModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Asset Class Selection Modal for Candle Based Strategy */}
      <Modal visible={showAssetClassModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Asset Class</Text>
              <TouchableOpacity 
                onPress={() => setShowAssetClassModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.assetClassContainer}>
              <Text style={styles.assetClassDescription}>
                Select the type of instruments you want to trade:
              </Text>
              
              <View style={styles.assetClassList}>
                {['Index Options', 'Stock Options', 'Stock Intraday', 'Commodity'].map((assetClass) => (
                  <TouchableOpacity
                    key={assetClass}
                    style={[
                      styles.assetClassOption,
                      selectedAssetClass === assetClass && styles.selectedAssetClassOption
                    ]}
                    onPress={() => handleAssetClassSelect(assetClass)}
                  >
                    <Text style={[
                      styles.assetClassOptionText,
                      selectedAssetClass === assetClass && styles.selectedAssetClassOptionText
                    ]}>
                      {assetClass}
                    </Text>
                    {selectedAssetClass === assetClass && (
                      <Ionicons name="checkmark" size={20} color="#1976d2" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instrumentsSection: {
    marginBottom: 40,
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 32,
    paddingBottom: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
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
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  legRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonBuy: {
    backgroundColor: '#4caf50',
  },
  actionButtonSell: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  quantityInput: {
    minWidth: 50,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  lotLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  optionTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1976d2',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTypeText: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 12,
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemLast: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  menuItemDelete: {
    color: '#f44336',
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  atmInputContainer: {
    flex: 1,
  },
  atmLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  atmInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  percentageInputContainer: {
    flex: 1,
  },
  percentageInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  onPriceLabel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  onPriceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  legDropdownMenuContainer: {
    position: 'relative',
    marginTop: 4,
    zIndex: 1000,
  },
  legDropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  legDropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legDropdownOptionLast: {
    borderBottomWidth: 0,
  },
  legDropdownOptionText: {
    fontSize: 14,
    color: '#333',
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
  lotSizeDisplay: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  lotSizeText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  lotSizeInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  lotSizeInfoText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  lotSizeInputContainer: {
    flex: 1,
  },
  lotSizeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  lotSizeInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    minWidth: 60,
  },
  lotSizeLabel: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 8,
  },
  lotSizeInputRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lotSizeInputModal: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    minWidth: 60,
  },
  lotSizeLabelModal: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 8,
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
  chartTypeScrollView: {
    maxHeight: 400,
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
  // Asset Class Selection Styles
  assetClassContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  assetClassDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  assetClassList: {
    gap: 12,
  },
  assetClassOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedAssetClassOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  assetClassOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedAssetClassOptionText: {
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
  chartTypeIndicator: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    marginTop: 16,
    alignItems: 'center',
  },
  chartTypeIndicatorText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  chartTypeIndicatorBold: {
    fontWeight: 'bold',
  },
});

export default TradingStrategy;