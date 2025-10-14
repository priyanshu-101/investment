import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CandleChart from '../candlechart';

interface LiveChartScreenProps {
  strategyData: any;
  instruments: string[];
  interval: string;
  chartType: string;
}

const { width: screenWidth } = Dimensions.get('window');

const LiveChartScreen: React.FC<LiveChartScreenProps> = ({
  strategyData,
  instruments,
  interval,
  chartType
}) => {
  const router = useRouter();
  const [selectedInstrument, setSelectedInstrument] = useState(instruments[0] || '');
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [selectedAction, setSelectedAction] = useState<'Buy' | 'Sell' | 'Both'>('Both');

  const intervals = ['1M', '3M', '5M', '15M', '30M', '1H', '1D'];
  const chartTypes = ['Candle', 'Bars', 'Hollow candles', 'Line', 'OHLC'];
  const actionTypes = ['Buy', 'Sell', 'Both'];

  const handleBack = () => {
    router.back();
  };

  const handlePatternDetected = (pattern: string) => {
    Alert.alert(
      'Pattern Detected!',
      `${pattern} pattern detected for ${selectedInstrument}`,
      [
        {
          text: 'Create Alert',
          onPress: () => {
            // TODO: Implement alert creation
            console.log('Creating alert for pattern:', pattern);
          }
        },
        { text: 'OK' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Live Trading Charts</Text>
          <Text style={styles.strategyName}>{strategyData?.strategyName || 'Strategy'}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>

      {/* Strategy Info */}
      <View style={styles.strategyInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Strategy Type:</Text>
          <Text style={styles.infoValue}>{strategyData?.selectedStrategyType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Instruments:</Text>
          <Text style={styles.infoValue}>{instruments.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Risk:Reward:</Text>
          <Text style={styles.infoValue}>{strategyData?.riskManagement?.riskRewardRatio || '1:3'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trading Action:</Text>
          <Text style={[
            styles.infoValue,
            selectedAction === 'Buy' && styles.buyInfoValue,
            selectedAction === 'Sell' && styles.sellInfoValue,
            selectedAction === 'Both' && styles.bothInfoValue
          ]}>
            {selectedAction}
          </Text>
        </View>
      </View>

      {/* Instrument Selector */}
      {instruments.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.instrumentSelector}
        >
          {instruments.map((instrument) => (
            <TouchableOpacity
              key={instrument}
              style={[
                styles.instrumentButton,
                selectedInstrument === instrument && styles.activeInstrumentButton
              ]}
              onPress={() => setSelectedInstrument(instrument)}
            >
              <Text style={[
                styles.instrumentButtonText,
                selectedInstrument === instrument && styles.activeInstrumentButtonText
              ]}>
                {instrument}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Chart Controls */}
      <View style={styles.chartControls}>
        {/* Action Type Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.actionSelector}
        >
          {actionTypes.map((action) => (
            <TouchableOpacity
              key={action}
              style={[
                styles.actionButton,
                selectedAction === action && styles.activeActionButton
              ]}
              onPress={() => setSelectedAction(action as 'Buy' | 'Sell' | 'Both')}
            >
              <Text style={[
                styles.actionButtonText,
                selectedAction === action && styles.activeActionButtonText
              ]}>
                {action}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interval Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.intervalSelector}
        >
          {intervals.map((interval) => (
            <TouchableOpacity
              key={interval}
              style={[
                styles.controlButton,
                selectedInterval === interval && styles.activeControlButton
              ]}
              onPress={() => setSelectedInterval(interval)}
            >
              <Text style={[
                styles.controlButtonText,
                selectedInterval === interval && styles.activeControlButtonText
              ]}>
                {interval}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart Type Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chartTypeSelector}
        >
          {chartTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.controlButton,
                selectedChartType === type && styles.activeControlButton
              ]}
              onPress={() => setSelectedChartType(type)}
            >
              <Text style={[
                styles.controlButtonText,
                selectedChartType === type && styles.activeControlButtonText
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Live Chart */}
      <View style={styles.chartContainer}>
        {selectedInstrument && (
          <ScrollView 
            style={styles.chartScrollView}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContent}
          >
            <CandleChart
              instrument={selectedInstrument}
              interval={selectedInterval}
              chartType={selectedChartType as 'Candle' | 'Bars' | 'Hollow candles' | 'Line' | 'OHLC'}
              height={450}
              isRealTime={true}
              onCandlePatternDetected={handlePatternDetected}
              action={selectedAction}
            />
          </ScrollView>
        )}
      </View>

      {/* Strategy Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[
            styles.strategyActionButton,
            selectedAction === 'Buy' && styles.buyActionButton,
            selectedAction === 'Sell' && styles.sellActionButton,
            selectedAction === 'Both' && styles.bothActionButton
          ]}
          onPress={() => {
            Alert.alert(
              'Start Strategy',
              `Starting ${selectedAction} strategy for ${selectedInstrument}`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons 
            name="play" 
            size={20} 
            color={selectedAction === 'Buy' ? '#4caf50' : selectedAction === 'Sell' ? '#f44336' : '#1976d2'} 
          />
          <Text style={[
            styles.strategyActionButtonText,
            selectedAction === 'Buy' && styles.buyActionButtonText,
            selectedAction === 'Sell' && styles.sellActionButtonText,
            selectedAction === 'Both' && styles.bothActionButtonText
          ]}>
            Start {selectedAction} Strategy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.strategyActionButton, styles.secondaryStrategyButton]}
          onPress={() => {
            Alert.alert('Pause Strategy', 'Strategy paused', [{ text: 'OK' }]);
          }}
        >
          <Ionicons name="pause" size={20} color="#1976d2" />
          <Text style={[styles.strategyActionButtonText, styles.secondaryStrategyButtonText]}>Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.strategyActionButton, styles.dangerButton]}
          onPress={() => {
            Alert.alert('Stop Strategy', 'Strategy stopped', [{ text: 'OK' }]);
          }}
        >
          <Ionicons name="stop" size={20} color="#fff" />
          <Text style={[styles.strategyActionButtonText, styles.dangerButtonText]}>Stop</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  strategyName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  strategyInfo: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  buyInfoValue: {
    color: '#4caf50',
  },
  sellInfoValue: {
    color: '#f44336',
  },
  bothInfoValue: {
    color: '#1976d2',
  },
  instrumentSelector: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  instrumentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  activeInstrumentButton: {
    backgroundColor: '#1976d2',
  },
  instrumentButtonText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  activeInstrumentButtonText: {
    color: '#fff',
  },
  chartControls: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionSelector: {
    marginBottom: 12,
  },
  intervalSelector: {
    marginBottom: 12,
  },
  chartTypeSelector: {
    // Styles applied via controlButton
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  activeControlButton: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  controlButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeControlButtonText: {
    color: '#fff',
  },
  chartContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  chartScrollView: {
    flex: 1,
  },
  chartScrollContent: {
    flexGrow: 1,
    minHeight: 450,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  activeActionButton: {
    backgroundColor: '#1976d2',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  activeActionButtonText: {
    color: '#fff',
  },
  strategyActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    gap: 8,
  },
  buyActionButton: {
    backgroundColor: '#4caf50',
  },
  sellActionButton: {
    backgroundColor: '#f44336',
  },
  bothActionButton: {
    backgroundColor: '#1976d2',
  },
  secondaryStrategyButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  dangerButton: {
    backgroundColor: '#f44336',
    borderWidth: 0,
  },
  strategyActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buyActionButtonText: {
    color: '#fff',
  },
  sellActionButtonText: {
    color: '#fff',
  },
  bothActionButtonText: {
    color: '#fff',
  },
  secondaryStrategyButtonText: {
    color: '#1976d2',
  },
  dangerButtonText: {
    color: '#fff',
  },
});

export default LiveChartScreen;
