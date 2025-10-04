import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Header } from '../header';

import { useStrategies } from '@/hooks/useStrategies';
import type { StrategyApiData } from '@/services/strategiesApi';

const screenWidth = Dimensions.get('window').width;

type BacktestResult = {
  strategy: string;
  timeframe: string;
  totalReturn: string;
  winRate: string;
  maxDrawdown: string;
  sharpeRatio: string;
  totalTrades: number;
  profitableTrades: number;
  monthlyReturns: number[];
  performanceData: { date: string; value: number; trades: number }[];
  riskMetrics: {
    volatility: string;
    beta: string;
    alpha: string;
    calmarRatio: string;
  };
  tradeAnalysis: {
    avgWin: string;
    avgLoss: string;
    maxWin: string;
    maxLoss: string;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
};

type StrategyOption = {
  id: string;
  name: string;
  creditsPerMonth: number;
  shortName: string;
  risk: StrategyApiData['risk'];
  margin?: number;
  totalReturn?: number;
};

export function BacktestScreen() {
  const { strategies, loading: strategiesLoading } = useStrategies();
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('3 Months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [credits, setCredits] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const timeframes = [
    '1 Month',
    '3 Months',
    '6 Months',
    '1 Year',
    '2 Years',
    'Custom Range',
  ];

  const getMonthsFromTimeframe = (timeframe: string): number => {
    switch (timeframe) {
      case '1 Month':
        return 1;
      case '3 Months':
        return 3;
      case '6 Months':
        return 6;
      case '1 Year':
        return 12;
      case '2 Years':
        return 24;
      case 'Custom Range':
        return 6;
      default:
        return 1;
    }
  };

  const generateMockData = (strategy: StrategyApiData, months: number): BacktestResult => {
    const monthlyReturns = Array.from({ length: months }, () => Math.random() * 8 - 2);
    const performanceData = Array.from({ length: months }, (_, i) => ({
      date: new Date(2023, i, 1).toISOString().split('T')[0],
      value: monthlyReturns.slice(0, i + 1).reduce((acc, val) => acc + val, 100),
      trades: Math.floor(Math.random() * 20 + 10),
    }));

    return {
      strategy: strategy.name,
      timeframe: selectedTimeframe,
      totalReturn: strategy.totalReturn?.toFixed(2) || (Math.random() * 40 - 10).toFixed(2),
      winRate: strategy.winRate?.toFixed(1) || (Math.random() * 40 + 40).toFixed(1),
      maxDrawdown: Math.abs(strategy.maxDrawdown ?? Math.random() * 20 + 5).toFixed(2),
      sharpeRatio: strategy.sharpeRatio?.toFixed(2) || (Math.random() * 2 + 0.5).toFixed(2),
      totalTrades: Math.floor(Math.random() * 100 + 50),
      profitableTrades: Math.floor(Math.random() * 60 + 30),
      monthlyReturns,
      performanceData,
      riskMetrics: {
        volatility: (Math.random() * 15 + 10).toFixed(2),
        beta: (Math.random() * 0.5 + 0.8).toFixed(2),
        alpha: (Math.random() * 5 - 2).toFixed(2),
        calmarRatio: (Math.random() * 1 + 0.5).toFixed(2),
      },
      tradeAnalysis: {
        avgWin: (Math.random() * 3 + 1).toFixed(2),
        avgLoss: (Math.random() * 2 + 0.5).toFixed(2),
        maxWin: (Math.random() * 10 + 5).toFixed(2),
        maxLoss: (Math.random() * 8 + 3).toFixed(2),
        consecutiveWins: Math.floor(Math.random() * 8 + 3),
        consecutiveLosses: Math.floor(Math.random() * 5 + 2),
      },
    };
  };

  const handleTimeframeSelect = (timeframe: string) => {
    if (timeframe === 'Custom Range') {
      setShowCustomDateModal(true);
    } else {
      setSelectedTimeframe(timeframe);
    }
  };

  const handleCustomDateSubmit = () => {
    if (!customStartDate || !customEndDate) {
      Alert.alert('Error', 'Please enter both start and end dates');
      return;
    }
    setSelectedTimeframe('Custom Range');
    setShowCustomDateModal(false);
  };

  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    setIsDropdownOpen(false);
  };

  const strategyOptions = useMemo<StrategyOption[]>(
    () =>
      strategies.map((strategy) => ({
        id: strategy.id,
        name: strategy.name,
        creditsPerMonth: Math.max(1, Math.round(Math.abs(strategy.maxDrawdown || 0) / 5)),
        shortName: strategy.shortName,
        risk: strategy.risk,
        margin: strategy.margin,
        totalReturn: strategy.totalReturn,
      })),
    [strategies]
  );

  const getSelectedStrategyDetails = (): StrategyApiData | undefined =>
    strategies.find((strategy) => strategy.id === selectedStrategy);

  const runBacktest = () => {
    if (!selectedStrategy) {
      Alert.alert('Error', 'Please select a strategy first');
      return;
    }

    const selectedStrategyOption = strategyOptions.find(
      (option) => option.id === selectedStrategy
    );
    const requiredCredits = (selectedStrategyOption?.creditsPerMonth ?? 1) *
      getMonthsFromTimeframe(selectedTimeframe);

    if (credits < requiredCredits) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${requiredCredits} credits but only have ${credits} available.`
      );
      return;
    }

    Alert.alert(
      'Confirm Backtest',
      `This will use ${requiredCredits} credits. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => executeBacktest(requiredCredits),
        },
      ]
    );
  };

  const executeBacktest = async (requiredCredits: number) => {
    setIsLoading(true);

    const strategyDetails = getSelectedStrategyDetails();

    setTimeout(() => {
      if (strategyDetails) {
        const mockResults = generateMockData(strategyDetails, getMonthsFromTimeframe(selectedTimeframe));
        setBacktestResults(mockResults);
        setCredits((prev) => prev - requiredCredits);
        Alert.alert('Success', 'Backtest completed successfully!');
      }
      setIsLoading(false);
    }, 2000);
  };

  const generatePDFContent = (results: BacktestResult): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Backtest Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .positive { color: green; }
        .negative { color: red; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Backtest Report</h1>
        <h2>${results.strategy}</h2>
        <p>Period: ${results.timeframe} | Date: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="section">
        <h3>Performance Summary</h3>
        <div class="metric">Total Return: <span class="${parseFloat(results.totalReturn) >= 0 ? 'positive' : 'negative'}">${results.totalReturn}%</span></div>
        <div class="metric">Win Rate: <span>${results.winRate}%</span></div>
        <div class="metric">Max Drawdown: <span class="negative">-${results.maxDrawdown}%</span></div>
        <div class="metric">Sharpe Ratio: <span>${results.sharpeRatio}</span></div>
        <div class="metric">Total Trades: <span>${results.totalTrades}</span></div>
        <div class="metric">Profitable Trades: <span class="positive">${results.profitableTrades}</span></div>
    </div>

    <div class="section">
        <h3>Risk Metrics</h3>
        <div class="metric">Volatility: <span>${results.riskMetrics.volatility}%</span></div>
        <div class="metric">Beta: <span>${results.riskMetrics.beta}</span></div>
        <div class="metric">Alpha: <span>${results.riskMetrics.alpha}%</span></div>
        <div class="metric">Calmar Ratio: <span>${results.riskMetrics.calmarRatio}</span></div>
    </div>

    <div class="section">
        <h3>Trade Analysis</h3>
        <div class="metric">Average Win: <span class="positive">${results.tradeAnalysis.avgWin}%</span></div>
        <div class="metric">Average Loss: <span class="negative">${results.tradeAnalysis.avgLoss}%</span></div>
        <div class="metric">Max Win: <span class="positive">${results.tradeAnalysis.maxWin}%</span></div>
        <div class="metric">Max Loss: <span class="negative">${results.tradeAnalysis.maxLoss}%</span></div>
        <div class="metric">Consecutive Wins: <span>${results.tradeAnalysis.consecutiveWins}</span></div>
        <div class="metric">Consecutive Losses: <span>${results.tradeAnalysis.consecutiveLosses}</span></div>
    </div>

    <div class="section">
        <h3>Monthly Performance</h3>
        <table>
            <tr><th>Month</th><th>Return (%)</th><th>Cumulative (%)</th></tr>
            ${results.monthlyReturns.map((ret, i) => `
                <tr>
                    <td>Month ${i + 1}</td>
                    <td class="${ret >= 0 ? 'positive' : 'negative'}">${ret.toFixed(2)}%</td>
                    <td>${results.monthlyReturns.slice(0, i + 1).reduce((acc, val) => acc + val, 0).toFixed(2)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>
</body>
</html>`;
  };

  const generateTransactionData = (results: BacktestResult): string => {
    const transactions = [];
    
    results.performanceData.forEach((data, index) => {
      for (let i = 0; i < data.trades; i++) {
        const isProfit = Math.random() > 0.4;
        const amount = isProfit 
          ? Math.random() * 5000 + 1000 
          : -(Math.random() * 3000 + 500);
        
        transactions.push({
          date: data.date,
          type: Math.random() > 0.5 ? 'BUY' : 'SELL',
          symbol: ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS'][Math.floor(Math.random() * 4)],
          quantity: Math.floor(Math.random() * 100 + 10),
          price: (Math.random() * 2000 + 100).toFixed(2),
          amount: amount.toFixed(2),
          status: isProfit ? 'PROFIT' : 'LOSS'
        });
      }
    });

    const csvHeader = 'Date,Type,Symbol,Quantity,Price,Amount,Status\n';
    const csvData = transactions
      .map(t => `${t.date},${t.type},${t.symbol},${t.quantity},${t.price},${t.amount},${t.status}`)
      .join('\n');

    return csvHeader + csvData;
  };

  const exportToPDF = async () => {
    if (!backtestResults) {
      Alert.alert('Error', 'No backtest data to export');
      return;
    }

    try {
      const htmlContent = generatePDFContent(backtestResults);
      const filename = `backtest_${backtestResults.strategy.replace(/\s+/g, '_')}_${Date.now()}.html`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, htmlContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('Success', 'PDF report exported successfully!');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const exportTransactions = async () => {
    if (!backtestResults) {
      Alert.alert('Error', 'No backtest data to export');
      return;
    }

    try {
      const csvContent = generateTransactionData(backtestResults);
      const filename = `transactions_${backtestResults.strategy.replace(/\s+/g, '_')}_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('Success', 'Transaction data exported successfully!');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export transactions');
    }
  };

  const resetBacktest = () => {
    Alert.alert('Reset', 'Are you sure you want to reset the backtest?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setBacktestResults(null);
          setSelectedStrategy('');
          setSelectedTimeframe('3 Months');
        },
      },
    ]);
  };

  return (
    <ThemedView style={[styles.container, styles.whiteBackground]}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={[styles.titleText, styles.blackText]}>
          Choose Strategy to Backtest
        </ThemedText>

        {/* Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading}
          >
            <Text style={styles.dropdownText}>
              {selectedStrategy ? 
                strategyOptions.find(s => s.id === selectedStrategy)?.name || selectedStrategy 
                : 'Select Strategy'
              }
            </Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {strategiesLoading ? (
                <View style={styles.dropdownItem}>
                  <ActivityIndicator size="small" color="#2B5CE6" />
                  <Text style={styles.dropdownItemText}>Loading strategies...</Text>
                </View>
              ) : strategyOptions.length === 0 ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>No strategies available</Text>
                </View>
              ) : (
                strategyOptions.map((strategy) => (
                  <TouchableOpacity
                    key={strategy.id}
                    style={styles.dropdownItem}
                    onPress={() => handleStrategySelect(strategy.id)}
                  >
                    <Text style={styles.dropdownItemText}>{strategy.name}</Text>
                    <Text style={styles.creditsText}>
                      {strategy.creditsPerMonth} credit/month
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Timeframes */}
        <View style={styles.timeframeContainer}>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe &&
                  styles.selectedTimeframeButton,
              ]}
              onPress={() => handleTimeframeSelect(timeframe)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe &&
                    styles.selectedTimeframeText,
                ]}
              >
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.creditContainer}
            onPress={() => setShowInfo(!showInfo)}
          >
            <Text style={styles.creditText}>
              Backtest credit : {credits} / 50
            </Text>
            <Ionicons
              name={showInfo ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportToPDF}
              disabled={!backtestResults}
            >
              <Text style={styles.exportText}>Export to PDF</Text>
              <Ionicons
                name="document-outline"
                size={16}
                color={backtestResults ? '#666' : '#ccc'}
                style={styles.exportIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportTransactions}
              disabled={!backtestResults}
            >
              <Text style={styles.exportText}>Transactions</Text>
              <Ionicons
                name="download-outline"
                size={16}
                color={backtestResults ? '#666' : '#ccc'}
                style={styles.exportIcon}
              />
            </TouchableOpacity>
          </View>

          {showInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.bulletBlack}>
                • 12 months backtest will utilize 12 backtest credits, with each
                month consuming one credit.
              </Text>
              <Text style={styles.bulletOrange}>
                • Backtest results are hypothetical results and generated based
                on the conditions used on historical data, and dont represent
                actual returns or future returns.
              </Text>
              <Text style={styles.bulletOrange}>
                • Export backtest once generated as it is not saved anywhere.
              </Text>
              <Text style={styles.bulletOrange}>
                • Export Transaction Details into the excel once generated as it
                is not saved anywhere.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.runButton,
            (!selectedStrategy || isLoading) && styles.runButtonDisabled,
          ]}
          onPress={runBacktest}
          disabled={!selectedStrategy || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.runButtonText}>Run Backtest</Text>
          )}
        </TouchableOpacity>

        {backtestResults ? (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Backtest Results</Text>
              <TouchableOpacity onPress={resetBacktest}>
                <Ionicons name="refresh" size={24} color="#2B5CE6" />
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Performance Chart</Text>
              <LineChart
                data={{
                  labels: backtestResults.performanceData.map((_, i) => `M${i + 1}`),
                  datasets: [{
                    data: backtestResults.performanceData.map(d => d.value),
                  }]
                }}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(43, 92, 230, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#2B5CE6"
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>Performance Summary</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Strategy:</Text>
                <Text style={styles.resultValue}>{backtestResults.strategy}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Timeframe:</Text>
                <Text style={styles.resultValue}>{backtestResults.timeframe}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Return:</Text>
                <Text
                  style={[
                    styles.resultValue,
                    styles.resultValueHighlight,
                    { color: parseFloat(backtestResults.totalReturn) >= 0 ? '#28a745' : '#dc3545' },
                  ]}
                >
                  {backtestResults.totalReturn}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Win Rate:</Text>
                <Text style={styles.resultValue}>{backtestResults.winRate}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Max Drawdown:</Text>
                <Text style={[styles.resultValue, { color: '#dc3545' }]}>
                  -{backtestResults.maxDrawdown}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Sharpe Ratio:</Text>
                <Text style={styles.resultValue}>{backtestResults.sharpeRatio}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Trades:</Text>
                <Text style={styles.resultValue}>{backtestResults.totalTrades}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Profitable Trades:</Text>
                <Text style={[styles.resultValue, { color: '#28a745' }]}>
                  {backtestResults.profitableTrades}
                </Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>Risk Metrics</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Volatility:</Text>
                <Text style={styles.resultValue}>{backtestResults.riskMetrics.volatility}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Beta:</Text>
                <Text style={styles.resultValue}>{backtestResults.riskMetrics.beta}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Alpha:</Text>
                <Text style={styles.resultValue}>{backtestResults.riskMetrics.alpha}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Calmar Ratio:</Text>
                <Text style={styles.resultValue}>{backtestResults.riskMetrics.calmarRatio}</Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>Trade Analysis</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Average Win:</Text>
                <Text style={[styles.resultValue, { color: '#28a745' }]}>
                  {backtestResults.tradeAnalysis.avgWin}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Average Loss:</Text>
                <Text style={[styles.resultValue, { color: '#dc3545' }]}>
                  -{backtestResults.tradeAnalysis.avgLoss}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Max Win:</Text>
                <Text style={[styles.resultValue, { color: '#28a745' }]}>
                  {backtestResults.tradeAnalysis.maxWin}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Max Loss:</Text>
                <Text style={[styles.resultValue, { color: '#dc3545' }]}>
                  -{backtestResults.tradeAnalysis.maxLoss}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Consecutive Wins:</Text>
                <Text style={styles.resultValue}>{backtestResults.tradeAnalysis.consecutiveWins}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Consecutive Losses:</Text>
                <Text style={styles.resultValue}>{backtestResults.tradeAnalysis.consecutiveLosses}</Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>Monthly Returns</Text>
              <View style={styles.monthlyReturnsGrid}>
                {backtestResults.monthlyReturns.map((returnVal, index) => (
                  <View key={index} style={styles.monthlyReturnItem}>
                    <Text style={styles.monthLabel}>M{index + 1}</Text>
                    <Text
                      style={[
                        styles.monthValue,
                        { color: returnVal >= 0 ? '#28a745' : '#dc3545' }
                      ]}
                    >
                      {returnVal >= 0 ? '+' : ''}{returnVal.toFixed(2)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Image
              source={require('@/assets/images/backtest.png')}
              style={styles.noDataImage}
              resizeMode="contain"
            />
            <Text style={styles.noDataText}>No backtest data.</Text>
            <Text style={styles.noDataSubtext}>
              Select a strategy and timeframe to run your first backtest
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCustomDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Date Range</Text>

            <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2023-01-01"
              value={customStartDate}
              onChangeText={setCustomStartDate}
            />

            <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2023-12-31"
              value={customEndDate}
              onChangeText={setCustomEndDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowCustomDateModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSubmit}
                onPress={handleCustomDateSubmit}
              >
                <Text style={styles.modalButtonTextSubmit}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2B5CE6',
    marginBottom: 30,
  },
  blackText: {
    color: '#000000',
  },
  dropdownContainer: {
    marginBottom: 30,
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  creditsText: {
    fontSize: 12,
    color: '#999',
  },
  timeframeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  timeframeButton: {
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E8FF',
  },
  selectedTimeframeButton: {
    backgroundColor: '#2B5CE6',
  },
  timeframeText: {
    fontSize: 14,
    color: '#2B5CE6',
    fontWeight: '500',
  },
  selectedTimeframeText: {
    color: '#FFFFFF',
  },
  cardContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    marginBottom: 20,
  },
  creditContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  creditText: {
    fontSize: 16,
    color: '#6C757D',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  exportText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  exportIcon: {
    marginLeft: 4,
  },
  infoContainer: {
    marginTop: 15,
    width: '100%',
  },
  bulletBlack: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  bulletOrange: {
    fontSize: 14,
    color: '#FF8C00',
    marginBottom: 8,
  },
  runButton: {
    backgroundColor: '#2B5CE6',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  runButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
  },
  noDataImage: {
    width: 180,
    height: 140,
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '600',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  resultValueHighlight: {
    fontSize: 16,
  },
  monthlyReturnsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthlyReturnItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  monthValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonSubmit: {
    flex: 1,
    backgroundColor: '#2B5CE6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSubmit: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});