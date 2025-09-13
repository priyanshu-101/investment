import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const handleTimeframeSelect = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  return (
    <ThemedView style={[styles.container, styles.whiteBackground]}>
      <ThemedText type="title" style={[styles.titleText, styles.blackText]}>
        Choose Strategy to Backtest
      </ThemedText>

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

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.creditContainer}
          onPress={() => setShowInfo(!showInfo)}
        >
          <View style={styles.creditRow}>
            <Text style={styles.creditText}>Backtest credit : 50 / 50</Text>
          </View>
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
              • Backtest results are hypothetical results and generated based on
              the conditions used on historical data, and don't represent actual
              returns or future returns.
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
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
    marginBottom: 40,
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
  },
  creditContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditText: {
    fontSize: 16,
    color: '#6C757D',
    marginRight: 10,
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
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 10,
  },
  exportText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  exportIcon: {
    marginLeft: 4,
  },
});
