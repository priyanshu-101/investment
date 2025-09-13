import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../header';

export function BacktestScreen() {
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('3 Months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const timeframes = [
    '1 Month',
    '3 Months',
    '6 Months',
    '1 Year',
    '2 Years',
    'Custom Range',
  ];

  const handleTimeframeSelect = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
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
          >
            <Text style={styles.dropdownText}>
              {selectedStrategy || 'Select Strategy'}
            </Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
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
            <Text style={styles.creditText}>Backtest credit : 50 / 50</Text>
            <Ionicons
              name={showInfo ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportText}>Export to PDF</Text>
            <Ionicons
              name="document-outline"
              size={16}
              color="#666"
              style={styles.exportIcon}
            />
          </TouchableOpacity>

          {showInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.bulletBlack}>
                • 12 months backtest will utilize 12 backtest credits, with each
                month consuming one credit.
              </Text>
              <Text style={styles.bulletOrange}>
                • Backtest results are hypothetical results and generated based
                on the conditions used on historical data, and don’t represent
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

        {/* No Data */}
        <View style={styles.noDataContainer}>
          <Image
            source={require('@/assets/images/backtest.png')}
            style={styles.noDataImage}
            resizeMode="contain"
          />
          <Text style={styles.noDataText}>No backtest data.</Text>
        </View>
      </ScrollView>
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
    marginBottom: 30,
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
  },
});
