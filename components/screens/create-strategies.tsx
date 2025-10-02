import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface TradingStrategyProps {
  onStrategyCreated?: (strategyData: any) => void;
}

const TradingStrategy = ({ onStrategyCreated }: TradingStrategyProps) => {
  const [selectedStrategyType, setSelectedStrategyType] = useState('Time Based');
  const [selectedOrderType, setSelectedOrderType] = useState('MIS');
  const [startTime, setStartTime] = useState('09:16');
  const [squareOffTime, setSquareOffTime] = useState('15:15');
  const [selectedDays, setSelectedDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [strategyName, setStrategyName] = useState('');
  const [exitProfitAmount, setExitProfitAmount] = useState('');
  const [exitLossAmount, setExitLossAmount] = useState('');
  const [noTradeAfterTime, setNoTradeAfterTime] = useState('15:15');
  const [profitTrailing, setProfitTrailing] = useState('No Trailing');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [availableInstruments, setAvailableInstruments] = useState<string[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(false);
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState('');

  const strategyTypes = ['Time Based', 'Indicator Based'];
  const orderTypes = ['MIS', 'CNC', 'BTST'];
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const profitTrailingOptions = ['No Trailing', 'Lock Fix Profit', 'Trail Profit', 'Lock and Trail'];

  const fetchInstruments = async () => {
    setLoadingInstruments(true);
    try {
      let instruments: string[] = [];
      
      try {
        const marketIndices = await marketDataService.getMarketIndices();
        const indexSymbols = marketIndices.map(index => index.name.replace(/\s+/g, ''));
        instruments = indexSymbols;
      } catch {
        instruments = ['NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BANKEX'];
      }

      const popularStocks = [
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
        'SBIN', 'BHARTIARTL', 'ITC', 'HINDUNILVR', 'KOTAKBANK',
        'LT', 'ASIANPAINT', 'MARUTI', 'AXISBANK', 'WIPRO',
        'ONGC', 'ADANIPORTS', 'COALINDIA', 'NTPC', 'POWERGRID',
        'ULTRACEMCO', 'NESTLEIND', 'BAJFINANCE', 'M&M', 'TITAN',
        'SUNPHARMA', 'DRREDDY', 'BAJAJFINSV', 'TECHM', 'HCLTECH'
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
        'NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BANKEX',
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
        'SBIN', 'BHARTIARTL', 'ITC', 'HINDUNILVR', 'KOTAKBANK'
      ];
      setAvailableInstruments(fallbackInstruments);
    } finally {
      setLoadingInstruments(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSaveStrategy = () => {
    if (!strategyName.trim()) {
      alert('Please enter a strategy name');
      return;
    }

    const strategyData = {
      strategyName: strategyName.trim(),
      selectedStrategyType,
      selectedOrderType,
      startTime,
      squareOffTime,
      selectedDays,
      exitProfitAmount,
      exitLossAmount,
      noTradeAfterTime,
      profitTrailing,
      instruments: selectedInstruments,
    };

    console.log('Saving strategy:', strategyData);
    
    if (onStrategyCreated) {
      onStrategyCreated(strategyData);
    }

    setStrategyName('');
    setExitProfitAmount('');
    setExitLossAmount('');
    setSelectedInstruments([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Instruments</Text>
          {selectedInstruments.length > 0 && (
            <View style={styles.selectedInstruments}>
              {selectedInstruments.map((instrument, index) => (
                <View key={index} style={styles.instrumentChip}>
                  <Text style={styles.instrumentChipText}>{instrument}</Text>
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

        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>Readymade Templates</Text>
            <Ionicons name="open-outline" size={16} color="#1976d2" />
          </View>
          <View style={styles.section}>
            <View style={styles.orderLegsHeader}>
              <Text style={styles.orderLegsTitle}>Order Legs</Text>
              <TouchableOpacity style={styles.addLegButton}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addLegText}>ADD LEG</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Risk Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk management</Text>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.riskInput}
                value={exitProfitAmount}
                onChangeText={setExitProfitAmount}
                placeholder="Exit When Over All Profit In Amount (INR)"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.riskInput}
                value={exitLossAmount}
                onChangeText={setExitLossAmount}
                placeholder="Exit When Over All Loss In Amount(INR)"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.timeLabel}>No Trade After</Text>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  value={noTradeAfterTime}
                  onChangeText={setNoTradeAfterTime}
                  placeholder="15:15"
                />
                <Ionicons name="time-outline" size={20} color="#666" />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profit Trailing</Text>
            <View style={styles.profitTrailingContainer}>
              {profitTrailingOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => setProfitTrailing(option)}
                >
                  <View style={styles.radioButton}>
                    {profitTrailing === option && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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

      {/* Instrument Selection Modal */}
      {showInstrumentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Instruments</Text>
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
                  <Text style={styles.loadingText}>Loading instruments from API...</Text>
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
                      <Text style={[
                        styles.instrumentOptionText,
                        isSelected && styles.selectedInstrumentOptionText
                      ]}>
                        {instrument}
                      </Text>
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
  templatesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  templatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  templatesTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1976d2',
  },
  orderLegsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderLegsTitle: {
    fontSize: 16,
    fontWeight: '500',
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
  inputGroup: {
    marginBottom: 16,
  },
  riskInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 14,
    color: '#333',
  },
  profitTrailingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  instrumentChipText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
    marginRight: 6,
  },
  removeInstrument: {
    marginLeft: 4,
  },
  removeInstrumentText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
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
  instrumentOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedInstrumentOptionText: {
    color: '#1976d2',
    fontWeight: '600',
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
});

export default TradingStrategy;