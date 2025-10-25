import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OptionChainData, optionChainService } from '../services/optionChainApi';

interface OptionChainModalProps {
  visible: boolean;
  indexName: string;
  underlyingPrice: number;
  onClose: () => void;
}

export function OptionChainModal({
  visible,
  indexName,
  underlyingPrice,
  onClose,
}: OptionChainModalProps) {
  const [optionChainData, setOptionChainData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOptionChain = async () => {
    setLoading(true);
    try {
      const data = await optionChainService.getOptionChain(indexName, underlyingPrice);
      setOptionChainData(data);
    } catch (error) {
      console.error('Failed to fetch option chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOptionChain();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchOptionChain();
    }
  }, [visible, indexName, underlyingPrice]);

  const getTextColor = (value: number, threshold: number) => {
    return value > threshold ? '#1abc9c' : '#e74c3c';
  };

  const getMaxValues = () => {
    if (!optionChainData) return {};
    
    const maxCallOI = Math.max(...optionChainData.strikes.map(s => s.callOI));
    const maxCallLTP = Math.max(...optionChainData.strikes.map(s => s.callLTP));
    const maxCallIV = Math.max(...optionChainData.strikes.map(s => s.callIV));
    const maxPutOI = Math.max(...optionChainData.strikes.map(s => s.putOI));
    const maxPutLTP = Math.max(...optionChainData.strikes.map(s => s.putLTP));
    const maxPutIV = Math.max(...optionChainData.strikes.map(s => s.putIV));

    return { maxCallOI, maxCallLTP, maxCallIV, maxPutOI, maxPutLTP, maxPutIV };
  };

  const maxValues = getMaxValues();

  const calculateSummary = () => {
    if (!optionChainData) return null;

    const totalCallOI = optionChainData.strikes.reduce((sum, strike) => sum + strike.callOI, 0);
    const totalPutOI = optionChainData.strikes.reduce((sum, strike) => sum + strike.putOI, 0);
    const totalCallVolume = optionChainData.strikes.reduce((sum, strike) => sum + strike.callVolume, 0);
    const totalPutVolume = optionChainData.strikes.reduce((sum, strike) => sum + strike.putVolume, 0);

    const oiDifference = totalCallOI - totalPutOI;
    const volumeDifference = totalCallVolume - totalPutVolume;
    const putCallRatio = totalCallOI > 0 ? (totalPutOI / totalCallOI).toFixed(2) : '0.00';

    return {
      totalCallOI,
      totalPutOI,
      totalCallVolume,
      totalPutVolume,
      oiDifference,
      volumeDifference,
      putCallRatio,
    };
  };

  const summary = calculateSummary();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>{indexName} - Option Chain</Text>
              <Text style={styles.headerSubtitle}>
                Underlying: ₹{optionChainData?.underlyingPrice.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info Bar */}
        {optionChainData && (
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Expiry Date</Text>
              <Text style={styles.infoValue}>{optionChainData.expiryDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(optionChainData.timestamp).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Content */}
        {loading && !optionChainData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a1f71" />
            <Text style={styles.loadingText}>Loading option chain...</Text>
          </View>
        ) : optionChainData ? (
          <ScrollView
            style={styles.tableContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            scrollEventThrottle={16}
          >
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.strikeCell]}>Strike</Text>
              <View style={styles.callSection}>
                <Text style={styles.tableHeaderCell}>CALL OI</Text>
                <Text style={styles.tableHeaderCell}>CALL LTP</Text>
                <Text style={styles.tableHeaderCell}>IV</Text>
              </View>
              <View style={styles.putSection}>
                <Text style={styles.tableHeaderCell}>IV</Text>
                <Text style={styles.tableHeaderCell}>PUT LTP</Text>
                <Text style={styles.tableHeaderCell}>PUT OI</Text>
              </View>
            </View>

            {/* Table Rows */}
            {optionChainData.strikes.map((strike, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  strike.strikePrice === Math.round(underlyingPrice / 50) * 50 &&
                    styles.atTheMoneyRow,
                ]}
              >
                <Text
                  style={[
                    styles.strikeCell,
                    strike.strikePrice === Math.round(underlyingPrice / 50) * 50 &&
                      styles.atmStrike,
                  ]}
                >
                  {strike.strikePrice}
                </Text>

                {/* CALL Side */}
                <View style={styles.callSection}>
                  <Text style={[
                    styles.cellText,
                    strike.callOI === maxValues.maxCallOI && styles.highlightedCell
                  ]}>
                    {optionChainService.formatNumber(strike.callOI)}
                  </Text>
                  <Text style={[
                    styles.cellText,
                    strike.callLTP === maxValues.maxCallLTP && styles.highlightedCell
                  ]}>
                    {optionChainService.formatPrice(strike.callLTP)}
                  </Text>
                  <Text style={[
                    styles.cellText,
                    { color: getTextColor(strike.callIV, 20) },
                    strike.callIV === maxValues.maxCallIV && styles.highlightedCell
                  ]}>
                    {strike.callIV.toFixed(2)}%
                  </Text>
                </View>

                {/* PUT Side */}
                <View style={styles.putSection}>
                  <Text style={[
                    styles.cellText,
                    { color: getTextColor(strike.putIV, 20) },
                    strike.putIV === maxValues.maxPutIV && styles.highlightedCell
                  ]}>
                    {strike.putIV.toFixed(2)}%
                  </Text>
                  <Text style={[
                    styles.cellText,
                    strike.putLTP === maxValues.maxPutLTP && styles.highlightedCell
                  ]}>
                    {optionChainService.formatPrice(strike.putLTP)}
                  </Text>
                  <Text style={[
                    styles.cellText,
                    strike.putOI === maxValues.maxPutOI && styles.highlightedCell
                  ]}>
                    {optionChainService.formatNumber(strike.putOI)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Summary Footer */}
            {summary && (
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Call OI</Text>
                    <Text style={styles.summaryValue}>
                      {optionChainService.formatNumber(summary.totalCallOI)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Put OI</Text>
                    <Text style={styles.summaryValue}>
                      {optionChainService.formatNumber(summary.totalPutOI)}
                    </Text>
                  </View>
                  <View style={[styles.summaryItem, styles.differenceItem]}>
                    <Text style={styles.summaryLabel}>OI Difference (Call - Put)</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color: summary.oiDifference >= 0 ? '#1abc9c' : '#e74c3c',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {summary.oiDifference >= 0 ? '+' : ''}{optionChainService.formatNumber(Math.abs(summary.oiDifference))}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>P/C Ratio</Text>
                    <Text style={styles.summaryValue}>{summary.putCallRatio}</Text>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Call Volume</Text>
                    <Text style={styles.summaryValue}>
                      {optionChainService.formatNumber(summary.totalCallVolume)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Put Volume</Text>
                    <Text style={styles.summaryValue}>
                      {optionChainService.formatNumber(summary.totalPutVolume)}
                    </Text>
                  </View>
                  <View style={[styles.summaryItem, styles.differenceItem]}>
                    <Text style={styles.summaryLabel}>Vol Diff</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color: summary.volumeDifference >= 0 ? '#1abc9c' : '#e74c3c',
                        },
                      ]}
                    >
                      {summary.volumeDifference >= 0 ? '+' : ''}{optionChainService.formatNumber(Math.abs(summary.volumeDifference))}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#1a1f71',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b3b3cc',
  },
  closeButton: {
    padding: 8,
  },
  infoBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoItem: {
    flex: 1,
    paddingRight: 16,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1f71',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  atTheMoneyRow: {
    backgroundColor: '#f0f4ff',
  },
  strikeCell: {
    width: 70,
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  atmStrike: {
    color: '#1a1f71',
    fontWeight: '800',
  },
  callSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  putSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    minWidth: 50,
  },
  highlightedCell: {
    backgroundColor: '#ffd700',
    fontWeight: '700',
    color: '#1a1f71',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  summarySection: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 2,
    borderTopColor: '#1a1f71',
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  differenceItem: {
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1f71',
    textAlign: 'center',
  },
});
