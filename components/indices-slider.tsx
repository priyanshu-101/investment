import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMarketData } from '../hooks/useMarketData';

export function IndicesSlider() {
  const { 
    data: indices, 
    loading, 
    error, 
    lastUpdated, 
    isMarketOpen, 
    nextMarketEvent, 
    refreshData 
  } = useMarketData({
    autoRefresh: true,
    refreshInterval: 5000, // 5 seconds for fast updates
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Market Indices</Text>
      </View>

      {nextMarketEvent && (
        <Text style={styles.nextEventText}>{nextMarketEvent}</Text>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        pagingEnabled={false}
        decelerationRate="fast"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && indices.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a1f71" />
            <Text style={styles.loadingText}>Loading market data...</Text>
          </View>
        ) : (
          indices.map((item, idx) => (
            <View key={item.name || idx} style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.value}>{item.value}</Text>
              <Text style={[styles.change, { color: item.color }]}> 
                {item.change} <Text style={styles.percent}>({item.percent})</Text>
              </Text>
              {loading && (
                <View style={styles.cardLoading}>
                  <ActivityIndicator size="small" color="#1a1f71" />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    paddingVertical: 15,
    backgroundColor: 'white',
    paddingLeft: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f71',
    marginLeft: 4,
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
    fontWeight: '500',
    color: '#64748b',
  },
  lastUpdatedContainer: {
    marginBottom: 8,
    marginRight: 16,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
  },
  nextEventText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
  },
  scrollContent: {
    paddingRight: 16,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  cardLoading: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  name: {
    fontWeight: '600',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
  percent: {
    fontSize: 13,
    fontWeight: '500',
  },
});
