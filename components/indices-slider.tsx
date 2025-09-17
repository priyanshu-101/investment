import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const indices = [
  {
    name: 'NIFTY 50',
    value: '25,156.10',
    change: '+86.90',
    percent: '+0.35%',
    color: '#1abc9c',
  },
  {
    name: 'SENSEX',
    value: '82,090.13',
    change: '+304.39',
    percent: '+0.37%',
    color: '#1abc9c',
  },
  {
    name: 'NIFTY BANK',
    value: '52,145.75',
    change: '+245.80',
    percent: '+0.47%',
    color: '#1abc9c',
  },
  {
    name: 'NIFTY IT',
    value: '43,892.60',
    change: '-156.25',
    percent: '-0.36%',
    color: '#e74c3c',
  },
  {
    name: 'NIFTY AUTO',
    value: '26,785.45',
    change: '+189.30',
    percent: '+0.71%',
    color: '#1abc9c',
  },
  {
    name: 'NIFTY PHARMA',
    value: '21,456.90',
    change: '-89.15',
    percent: '-0.41%',
    color: '#e74c3c',
  },
  {
    name: 'NIFTY FMCG',
    value: '58,234.85',
    change: '+123.45',
    percent: '+0.21%',
    color: '#1abc9c',
  },
  {
    name: 'NIFTY METAL',
    value: '9,876.20',
    change: '+67.80',
    percent: '+0.69%',
    color: '#1abc9c',
  },
];

export function IndicesSlider() {
  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sectionTitle}>Market Indices</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        pagingEnabled={false}
        decelerationRate="fast"
      >
        {indices.map((item, idx) => (
          <View key={item.name} style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={[styles.change, { color: item.color }]}> 
              {item.change} <Text style={styles.percent}>({item.percent})</Text>
            </Text>
          </View>
        ))}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f71',
    marginBottom: 12,
    marginLeft: 4,
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
