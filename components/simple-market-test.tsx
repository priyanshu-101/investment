import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { marketDataService } from '../services/marketDataApi';

export function SimpleMarketTest() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Testing market data directly...');
        const result = await marketDataService.getMarketIndices();
        console.log('📊 Raw result:', result);
        setData(result);
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Data Test</Text>
      {data.slice(0, 3).map((item: any, index: number) => (
        <View key={index} style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.value}>Value: {item.value}</Text>
          <Text style={styles.change}>Change: {item.change}</Text>
          <Text style={styles.percent}>Percent: {item.percent}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  item: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  change: {
    fontSize: 14,
    color: '#666',
  },
  percent: {
    fontSize: 14,
    color: '#999',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});