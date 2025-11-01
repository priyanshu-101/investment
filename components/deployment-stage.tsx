import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface DeploymentStageData {
  index: number;
  entryTime: string;
  exitTime?: string;
  callPutType: 'CE' | 'PE';
  type: string; // e.g., 'BUY', 'SELL'
  strike: string;
  bidPrice: number;
  askPrice: number;
  quantity: number;
  ltp: number;
  pnl: number;
}

export type DeploymentStage = DeploymentStageData;

interface DeploymentStageDisplayProps {
  stages: DeploymentStage[];
}

export function DeploymentStageDisplay({ stages }: DeploymentStageDisplayProps) {
  if (!stages || stages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deployment Stages</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tableContainer}
      >
        <View>
          {/* Header Row */}
          <View style={styles.row}>
            <View style={[styles.cell, styles.headerCell, styles.indexColumn]}>
              <Text style={styles.headerText}>Index</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.timeColumn]}>
              <Text style={styles.headerText}>Entry Time</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.timeColumn]}>
              <Text style={styles.headerText}>Exit Time</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.typeColumn]}>
              <Text style={styles.headerText}>Type</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.strikeColumn]}>
              <Text style={styles.headerText}>Strike</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.priceColumn]}>
              <Text style={styles.headerText}>Bid</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.priceColumn]}>
              <Text style={styles.headerText}>Ask</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.qtyColumn]}>
              <Text style={styles.headerText}>Qty</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.priceColumn]}>
              <Text style={styles.headerText}>LTP</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.pnlColumn]}>
              <Text style={styles.headerText}>P/L</Text>
            </View>
          </View>

          {/* Data Rows */}
          {stages.map((stage, index) => (
            <View key={index} style={[styles.row, index % 2 === 0 && styles.rowAlternate]}>
              <View style={[styles.cell, styles.indexColumn]}>
                <Text style={styles.cellText}>{stage.index}</Text>
              </View>
              <View style={[styles.cell, styles.timeColumn]}>
                <Text style={styles.cellText}>{stage.entryTime}</Text>
              </View>
              <View style={[styles.cell, styles.timeColumn]}>
                <Text style={styles.cellText}>{stage.exitTime || '-'}</Text>
              </View>
              <View style={[styles.cell, styles.typeColumn]}>
                <Text style={[styles.cellText, styles.badgeText]}>
                  {stage.callPutType}
                </Text>
              </View>
              <View style={[styles.cell, styles.strikeColumn]}>
                <Text style={styles.cellText}>{stage.type}</Text>
              </View>
              <View style={[styles.cell, styles.strikeColumn]}>
                <Text style={styles.cellText}>{stage.strike}</Text>
              </View>
              <View style={[styles.cell, styles.priceColumn]}>
                <Text style={styles.cellText}>₹{stage.bidPrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.cell, styles.priceColumn]}>
                <Text style={styles.cellText}>₹{stage.askPrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.cell, styles.qtyColumn]}>
                <Text style={styles.cellText}>{stage.quantity}</Text>
              </View>
              <View style={[styles.cell, styles.priceColumn]}>
                <Text style={styles.cellText}>₹{stage.ltp.toFixed(2)}</Text>
              </View>
              <View style={[styles.cell, styles.pnlColumn]}>
                <Text style={[
                  styles.cellText,
                  stage.pnl >= 0 ? styles.profitText : styles.lossText
                ]}>
                  {stage.pnl >= 0 ? '+' : ''}₹{stage.pnl.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableContainer: {
    maxHeight: 250,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowAlternate: {
    backgroundColor: '#fafbfc',
  },
  headerCell: {
    backgroundColor: '#f3f4f6',
  },
  cell: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 8,
    justifyContent: 'center',
  },
  indexColumn: {
    width: 40,
  },
  timeColumn: {
    width: 80,
  },
  typeColumn: {
    width: 60,
  },
  strikeColumn: {
    width: 70,
  },
  priceColumn: {
    width: 80,
  },
  qtyColumn: {
    width: 50,
  },
  pnlColumn: {
    width: 80,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  cellText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  badgeText: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },
  profitText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  lossText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
