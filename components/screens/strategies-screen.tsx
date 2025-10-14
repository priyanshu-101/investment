import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useStrategies } from '../../hooks/useStrategies';
import { StrategyApiData } from '../../services/strategiesApi';
import { Header } from '../header';
import TradingStrategy from './create-strategies';

export function StrategiesScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState('Create Strategy');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState('Date');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [createdStrategies, setCreatedStrategies] = useState<StrategyApiData[]>([]);

  const { user, isAuthenticated } = useAuth();
  const {
    strategies,
    loading,
    error,
    refreshStrategies,
    subscribeToStrategy
  } = useStrategies();

  const loadCreatedStrategies = useCallback(async () => {
    try {
      if (!user?.id) return;
      const key = `createdStrategies_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsedStrategies = JSON.parse(stored);
        setCreatedStrategies(parsedStrategies);
      }
    } catch (error) {
      console.error('Error loading created strategies:', error);
    }
  }, [user?.id]);

  // Load created strategies from AsyncStorage when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadCreatedStrategies();
    } else {
      setCreatedStrategies([]);
    }
  }, [user?.id, loadCreatedStrategies]);

  const saveCreatedStrategies = async (strategies: StrategyApiData[]) => {
    try {
      if (!user?.id) return;
      const key = `createdStrategies_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(strategies));
    } catch (error) {
      console.error('Error saving created strategies:', error);
    }
  };

  const tabs = [
    'Create Strategy',
    'My Strategies',
    'Deployed Strategies',
    'Strategy Template',
    'My Portfolio',
  ];

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: offset, animated: true });
    }
  };

  const getFilteredStrategies = (): StrategyApiData[] => {
    const allStrategies = [...strategies, ...createdStrategies];
    let filteredStrategies = allStrategies;
    
    switch (activeTab) {
      case 'My Strategies':
        filteredStrategies = allStrategies;
        break;
      case 'Deployed Strategies':
        filteredStrategies = allStrategies.filter(s => s.isActive === true);
        break;
      case 'Strategy Template':
        filteredStrategies = allStrategies.filter(s => 
          s.category === 'Template' || s.category === 'Algorithm' || s.category === 'Custom'
        );
        break;
      default:
        filteredStrategies = allStrategies;
    }

    if (searchQuery.trim()) {
      filteredStrategies = filteredStrategies.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortOption === 'A-Z') {
      filteredStrategies.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'Date') {
      filteredStrategies.sort((a, b) => 
        new Date(b.backtestedFrom || '').getTime() - new Date(a.backtestedFrom || '').getTime()
      );
    } else if (sortOption === 'Performance') {
      filteredStrategies.sort((a, b) => b.totalReturn - a.totalReturn);
    } else if (sortOption === 'Risk') {
      const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
      filteredStrategies.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
    }

    return filteredStrategies;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshStrategies();
    } catch (err) {
      console.error('Refresh error:', err);
      Alert.alert('Error', 'Failed to refresh strategies');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubscribeToStrategy = async (strategyId: string, strategyName: string) => {
    try {
      if (strategyId.startsWith('created_')) {
        const updatedStrategies = createdStrategies.map(strategy =>
          strategy.id === strategyId
            ? { ...strategy, isActive: true }
            : strategy
        );
        setCreatedStrategies(updatedStrategies);
        await saveCreatedStrategies(updatedStrategies);
        Alert.alert('Success', `${strategyName} has been deployed successfully!`);
        return;
      }

      const success = await subscribeToStrategy(strategyId);
      if (success) {
        Alert.alert('Success', `Successfully subscribed to ${strategyName}`);
      } else {
        Alert.alert('Error', 'Failed to subscribe to strategy');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      Alert.alert('Error', 'An error occurred while subscribing');
    }
  };

  const handleStrategyCreated = async (strategyData: any) => {
    if (!isAuthenticated || !user) {
      Alert.alert('Authentication Required', 'Please log in to create strategies.');
      return;
    }

    const newStrategy: StrategyApiData = {
      id: `created_${user.id}_${Date.now()}`,
      name: strategyData.strategyName || 'Custom Strategy',
      shortName: strategyData.strategyName?.substring(0, 10) || 'Custom',
      maxDrawdown: -5.0,
      margin: 50000,
      totalReturn: 0,
      winRate: 0,
      sharpeRatio: 0,
      performance: [],
      isActive: false,
      risk: 'Medium' as 'Medium',
      category: 'Custom',
      description: `${strategyData.selectedStrategyType} strategy created on ${new Date().toLocaleDateString()}`,
      minInvestment: 25000,
      expectedReturn: 15,
      backtestedFrom: new Date().toISOString().split('T')[0],
      instruments: strategyData.instruments || [],
    };

    const updatedStrategies = [newStrategy, ...createdStrategies];
    setCreatedStrategies(updatedStrategies);
    await saveCreatedStrategies(updatedStrategies);

    setActiveTab('My Strategies');

    Alert.alert(
      'Strategy Created!',
      `${newStrategy.name} has been created successfully and added to your strategies.`,
      [{ text: 'OK' }]
    );
  };

  const StrategyCard = ({ strategy, onSubscribe }: { 
    strategy: StrategyApiData; 
    onSubscribe: (id: string, name: string) => void; 
  }) => (
    <TouchableOpacity style={styles.strategyCard}>
      <View style={styles.cardHeader}>
        <View>
          <ThemedText style={styles.strategyName}>{strategy.name}</ThemedText>
          <ThemedText style={styles.strategyCategory}>{strategy.category}</ThemedText>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(strategy.risk) }]}>
          <ThemedText style={styles.riskText}>{strategy.risk}</ThemedText>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <ThemedText style={styles.metricLabel}>Return</ThemedText>
          <ThemedText style={styles.metricValue}>
            {strategy.totalReturn > 0 ? '+' : ''}₹{strategy.totalReturn.toLocaleString('en-IN')}
          </ThemedText>
        </View>
        <View style={styles.metric}>
          <ThemedText style={styles.metricLabel}>Win Rate</ThemedText>
          <ThemedText style={styles.metricValue}>{strategy.winRate.toFixed(1)}%</ThemedText>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <ThemedText style={styles.metricLabel}>Drawdown</ThemedText>
          <ThemedText style={[styles.metricValue, { color: '#ff4444' }]}>
            {strategy.maxDrawdown.toFixed(1)}%
          </ThemedText>
        </View>
        <View style={styles.metric}>
          <ThemedText style={styles.metricLabel}>Sharpe</ThemedText>
          <ThemedText style={styles.metricValue}>{strategy.sharpeRatio.toFixed(2)}</ThemedText>
        </View>
      </View>

      {strategy.description && (
        <ThemedText style={styles.description} numberOfLines={2}>
          {strategy.description}
        </ThemedText>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: strategy.isActive ? '#22c55e' : '#ef4444' }]} />
          <ThemedText style={styles.statusText}>
            {strategy.isActive ? 'Active' : 'Inactive'}
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={() => onSubscribe(strategy.id, strategy.name)}
        >
          <ThemedText style={styles.subscribeButtonText}>
            {strategy.isActive ? 'Deploy' : 'Subscribe'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Header />
      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => scrollBy(0)} style={styles.arrowButton}>
          <ThemedText style={styles.arrowText}>◀</ThemedText>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsWrapper}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                if (tab === 'My Portfolio') {
                  navigation.navigate('Backtest' as never);
                } else {
                  setActiveTab(tab);
                }
              }}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            >
              <ThemedText
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => scrollBy(200)} style={styles.arrowButton}>
          <ThemedText style={styles.arrowText}>▶</ThemedText>
        </TouchableOpacity>
      </View>
      {(activeTab === 'My Strategies' || activeTab === 'Deployed Strategies' || activeTab === 'Strategy Template') && (
        <ThemedView style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Strategies"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOpen(!sortOpen)}
            >
              <ThemedText style={styles.sortText}>Sort By {sortOption}</ThemedText>
            </TouchableOpacity>

            {sortOpen && (
              <View style={styles.dropdown}>
                {['Date', 'A-Z', 'Performance', 'Risk'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      setSortOption(option);
                      setSortOpen(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <ThemedText style={styles.dropdownText}>{option}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ThemedView>
      )}

      {/* Main Content */}
      {activeTab === 'Create Strategy' ? (
        <TradingStrategy onStrategyCreated={handleStrategyCreated} navigation={navigation} />
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading && strategies.length === 0 ? (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a4aff" />
              <ThemedText style={styles.loadingText}>Loading strategies...</ThemedText>
            </ThemedView>
          ) : error ? (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : getFilteredStrategies().length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Image
                source={require('@/assets/images/strategy.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <ThemedText style={styles.emptyText}>
                {activeTab === 'Deployed Strategies' ? 'No Deployed Strategies' : 'No Strategies Found'}
              </ThemedText>
              <TouchableOpacity 
                style={[styles.createButton, activeTab === 'Deployed Strategies' && styles.createButtonDotted]}
                onPress={() => setActiveTab('Create Strategy')}
              >
                <ThemedText style={styles.createButtonText}>+ Create Strategy</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <View style={styles.strategiesGrid}>
              {getFilteredStrategies().map((strategy) => (
                <StrategyCard 
                  key={strategy.id} 
                  strategy={strategy} 
                  onSubscribe={handleSubscribeToStrategy}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  arrowButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#444',
  },
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    marginHorizontal: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  activeTab: {
    backgroundColor: '#e9edff',
  },
  tabText: {
    fontSize: 14,
    color: '#444',
  },
  activeTabText: {
    color: '#2d4cff',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 14,
    color: '#222',
  },
  sortButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sortText: { fontSize: 14, color: '#222' },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 10,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a4aff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  strategiesGrid: {
    paddingBottom: 20,
  },
  strategyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  strategyCategory: {
    fontSize: 12,
    color: '#666',
  },
  riskBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  subscribeButton: {
    backgroundColor: '#4a4aff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  subscribeButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyImage: { width: 180, height: 180, marginBottom: 20 },
  emptyText: { fontSize: 14, color: '#666', marginBottom: 20 },
  createButton: {
    borderWidth: 1,
    borderColor: '#4a4aff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  createButtonDotted: {
    borderStyle: 'dashed',
  },
  createButtonText: { fontSize: 14, color: '#4a4aff', fontWeight: '500' },
});
