import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Picker,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { kiteConnect } from '../../services/kiteConnect';
import { marketDataService } from '../../services/marketDataApi';

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

interface TradingStrategyProps {
  onStrategyCreated?: (strategyData: any) => void;
}

const TradingStrategy = ({ onStrategyCreated }: TradingStrategyProps) => {
  // Existing state
  const [selectedStrategyType, setSelectedStrategyType] = useState('Candle Based');
  const [selectedChartType, setSelectedChartType] = useState('Candle');
  const [selectedOrderType, setSelectedOrderType] = useState('MIS');
  const [selectedTransactionType, setSelectedTransactionType] = useState('Buy');
  const [startTime, setStartTime] = useState('09:16');
  const [squareOffTime, setSquareOffTime] = useState('15:15');
  const [selectedDays, setSelectedDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [strategyName, setStrategyName] = useState('');
  const [exitProfitAmount, setExitProfitAmount] = useState('5000');
  const [exitLossAmount, setExitLossAmount] = useState('1000');
  const [noTradeAfterTime, setNoTradeAfterTime] = useState('15:15');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [availableInstruments, setAvailableInstruments] = useState<string[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(false);
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState('');

  // New candle-based strategy state
  const [selectedInterval, setSelectedInterval] = useState('1M');
  const [orderLegs, setOrderLegs] = useState<OrderLeg[]>([]);
  const [showOrderLegModal, setShowOrderLegModal] = useState(false);
  const [currentEditingLeg, setCurrentEditingLeg] = useState<OrderLeg | null>(null);
  const [riskRewardRatio, setRiskRewardRatio] = useState('1:3');
  const [overallStopLoss, setOverallStopLoss] = useState('0.001'); // 0.1%
  const [overallProfit, setOverallProfit] = useState('0.005'); // 0.5%
  const [maxLossAmount, setMaxLossAmount] = useState('1000');
  const [maxProfitAmount, setMaxProfitAmount] = useState('5000');
  
  // Dynamic data from Zerodha
  const [marketData, setMarketData] = useState<any>({});
  const [liveQuotes, setLiveQuotes] = useState<any>({});
  const [candleData, setCandleData] = useState<any>({});
  const [loadingMarketData, setLoadingMarketData] = useState(false);

  const strategyTypes = ['Candle Based', 'Time Based', 'Indicator Based'];
  const chartTypes = ['Candle', 'Line', 'OHLC'];
  const orderTypes = ['MIS', 'CNC', 'BTST'];
  const transactionTypes = ['Buy', 'Sell'];
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

  // Fetch live market data from Zerodha
  const fetchMarketData = useCallback(async () => {
    if (!selectedInstruments.length) {
      return;
    }

    setLoadingMarketData(true);
    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) {
        console.log('Not authenticated with Zerodha');
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

      try {
        const marketIndices = await marketDataService.getMarketIndices();
        const indexSymbols = marketIndices.map((index) => index.name.replace(/\s+/g, ''));
        instruments = indexSymbols;
      } catch {
        instruments = ['NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BANKEX'];
      }

      const popularStocks = [
        'RELIANCE',
        'TCS',
        'INFY',
        'HDFCBANK',
        'ICICIBANK',
        'SBIN',
        'BHARTIARTL',
        'ITC',
        'HINDUNILVR',
        'KOTAKBANK',
        'LT',
        'ASIANPAINT',
        'MARUTI',
        'AXISBANK',
        'WIPRO',
        'ONGC',
        'ADANIPORTS',
        'COALINDIA',
        'NTPC',
        'POWERGRID',
        'ULTRACEMCO',
        'NESTLEIND',
        'BAJFINANCE',
        'M&M',
        'TITAN',
        'SUNPHARMA',
        'DRREDDY',
        'BAJAJFINSV',
        'TECHM',
        'HCLTECH',
      ];

      const isAuthenticated = await kiteConnect.isAuthenticated();
      if (isAuthenticated) {
        try {
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
            .slice(0, 200);

          instruments = [...instruments, ...kiteInstruments, ...popularStocks];
        } catch {
          instruments = [...instruments, ...popularStocks];
        }
      } else {
        instruments = [...instruments, ...popularStocks];
      }

      setAvailableInstruments([...new Set(instruments)].sort());
    } catch {
      const fallbackInstruments = [
        'NIFTY50',
        'BANKNIFTY',
        'FINNIFTY',
        'SENSEX',
        'BANKEX',
        'RELIANCE',
        'TCS',
        'INFY',
        'HDFCBANK',
        'ICICIBANK',
        'SBIN',
        'BHARTIARTL',
        'ITC',
        'HINDUNILVR',
        'KOTAKBANK',
      ];
      setAvailableInstruments(fallbackInstruments);
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
    }
  }, [fetchMarketData, selectedInstruments.length]);

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

  const handleSaveStrategy = () => {
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
    
    if (onStrategyCreated) {
      onStrategyCreated(strategyData);
    }

    Alert.alert('Success', 'Strategy created successfully!');
    
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
                onPress={() => setSelectedStrategyType(type)}
              >
                <Text style={[
                  styles.tabText,
                  selectedStrategyType === type && styles.activeTabText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart Type - Only for Candle Based */}
        {selectedStrategyType === 'Candle Based' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chart Type</Text>
            <View style={styles.tabContainer}>
              {chartTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.tab,
                    selectedChartType === type && styles.activeTab
                  ]}
                  onPress={() => setSelectedChartType(type)}
                >
                  <Text style={[
                    styles.tabText,
                    selectedChartType === type && styles.activeTabText
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

        {/* Order Legs Section */}
        <View style={styles.section}>
          <View style={styles.orderLegsHeader}>
            <Text style={styles.orderLegsTitle}>
              {selectedStrategyType === 'Candle Based' ? 'Entry/Exit Conditions' : 'Order Legs'}
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

        {/* Risk Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Management</Text>
          
          <View style={styles.riskRow}>
            <View style={styles.riskInputContainer}>
              <Text style={styles.riskLabel}>Risk : Reward</Text>
              <TextInput
                style={styles.riskInput}
                value={riskRewardRatio}
                onChangeText={setRiskRewardRatio}
                placeholder="1:3"
              />
            </View>
          </View>

          <View style={styles.riskRow}>
            <View style={styles.riskInputContainer}>
              <Text style={styles.riskLabel}>Overall Stop Loss (%)</Text>
              <TextInput
                style={styles.riskInput}
                value={overallStopLoss}
                onChangeText={setOverallStopLoss}
                placeholder="0.1%"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.riskInputContainer}>
              <Text style={styles.riskLabel}>Overall Profit (%)</Text>
              <TextInput
                style={styles.riskInput}
                value={overallProfit}
                onChangeText={setOverallProfit}
                placeholder="0.5%"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.riskRow}>
            <View style={styles.riskInputContainer}>
              <Text style={styles.riskLabel}>Max Loss (₹)</Text>
              <TextInput
                style={styles.riskInput}
                value={maxLossAmount}
                onChangeText={setMaxLossAmount}
                placeholder="1000"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.riskInputContainer}>
              <Text style={styles.riskLabel}>Max Profit (₹)</Text>
              <TextInput
                style={styles.riskInput}
                value={maxProfitAmount}
                onChangeText={setMaxProfitAmount}
                placeholder="5000"
                keyboardType="numeric"
              />
            </View>
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
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={currentEditingLeg.instrument}
                          onValueChange={(value) => setCurrentEditingLeg(prev => prev ? {...prev, instrument: value} : null)}
                          style={styles.picker}
                        >
                          {selectedInstruments.map((instrument) => (
                            <Picker.Item key={instrument} label={instrument} value={instrument} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>

                  {/* Entry Conditions for Candle Based */}
                  {selectedStrategyType === 'Candle Based' && (
                    <View style={styles.formSection}>
                      <Text style={styles.formSectionTitle}>Entry Condition</Text>
                      
                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Candle Type</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={currentEditingLeg.entryCondition?.candleType}
                            onValueChange={(value) => setCurrentEditingLeg(prev => prev ? {
                              ...prev, 
                              entryCondition: {...prev.entryCondition!, candleType: value}
                            } : null)}
                            style={styles.picker}
                          >
                            {candlePatterns.map((pattern) => (
                              <Picker.Item key={pattern.id} label={pattern.name} value={pattern.name} />
                            ))}
                          </Picker>
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
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={currentEditingLeg.exitCondition?.candleType}
                              onValueChange={(value) => setCurrentEditingLeg(prev => prev ? {
                                ...prev,
                                exitCondition: {...prev.exitCondition!, candleType: value}
                              } : null)}
                              style={styles.picker}
                            >
                              {candlePatterns.map((pattern) => (
                                <Picker.Item key={pattern.id} label={pattern.name} value={pattern.name} />
                              ))}
                            </Picker>
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
});

export default TradingStrategy;