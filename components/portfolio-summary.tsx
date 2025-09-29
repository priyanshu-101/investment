import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useKiteConnectContext } from '../contexts/KiteConnectContext';
import { KiteHolding, KiteOrder, KitePosition } from '../services/kiteConnect';

interface PortfolioSummaryProps {
  style?: any;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ style }) => {
  const { positions, holdings, orders, refreshData, isLoading, isAuthenticated } = useKiteConnectContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.notAuthenticatedText}>
          Please login with Kite Connect to view your portfolio
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color="#387ed1" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  const calculateTotalPnL = () => {
    let totalPnL = 0;
    
    // Add PnL from positions
    if (positions?.net) {
      totalPnL += positions.net.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    }
    
    // Add PnL from holdings
    if (holdings) {
      totalPnL += holdings.reduce((sum, holding) => sum + (holding.pnl || 0), 0);
    }
    
    return totalPnL;
  };

  const totalPnL = calculateTotalPnL();
  const totalValue = holdings?.reduce((sum, holding) => sum + (holding.last_price * holding.quantity), 0) || 0;

  return (
    <ScrollView
      style={[styles.container, style]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Portfolio Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Portfolio Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Value:</Text>
          <Text style={styles.summaryValue}>₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total P&L:</Text>
          <Text style={[styles.summaryValue, { color: totalPnL >= 0 ? '#28a745' : '#dc3545' }]}>
            ₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Holdings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Holdings ({holdings?.length || 0})</Text>
        {holdings && holdings.length > 0 ? (
          holdings.map((holding, index) => (
            <HoldingCard key={`${holding.tradingsymbol}-${index}`} holding={holding} />
          ))
        ) : (
          <Text style={styles.emptyText}>No holdings found</Text>
        )}
      </View>

      {/* Positions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Positions ({positions?.net?.length || 0})</Text>
        {positions?.net && positions.net.length > 0 ? (
          positions.net.map((position, index) => (
            <PositionCard key={`${position.tradingsymbol}-${index}`} position={position} />
          ))
        ) : (
          <Text style={styles.emptyText}>No positions found</Text>
        )}
      </View>

      {/* Recent Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders ({orders?.slice(0, 5).length || 0})</Text>
        {orders && orders.length > 0 ? (
          orders.slice(0, 5).map((order, index) => (
            <OrderCard key={`${order.order_id}-${index}`} order={order} />
          ))
        ) : (
          <Text style={styles.emptyText}>No recent orders</Text>
        )}
      </View>
    </ScrollView>
  );
};

const HoldingCard: React.FC<{ holding: KiteHolding }> = ({ holding }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.symbolText}>{holding.tradingsymbol}</Text>
      <Text style={[styles.pnlText, { color: holding.pnl >= 0 ? '#28a745' : '#dc3545' }]}>
        ₹{holding.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Qty: {holding.quantity}</Text>
      <Text style={styles.cardLabel}>Avg: ₹{holding.average_price.toFixed(2)}</Text>
      <Text style={styles.cardLabel}>LTP: ₹{holding.last_price.toFixed(2)}</Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Value: ₹{(holding.last_price * holding.quantity).toLocaleString('en-IN')}</Text>
      <Text style={[styles.cardLabel, { color: holding.day_change_percentage >= 0 ? '#28a745' : '#dc3545' }]}>
        {holding.day_change_percentage.toFixed(2)}%
      </Text>
    </View>
  </View>
);

const PositionCard: React.FC<{ position: KitePosition }> = ({ position }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.symbolText}>{position.tradingsymbol}</Text>
      <Text style={[styles.pnlText, { color: position.pnl >= 0 ? '#28a745' : '#dc3545' }]}>
        ₹{position.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Qty: {position.quantity}</Text>
      <Text style={styles.cardLabel}>Avg: ₹{position.average_price.toFixed(2)}</Text>
      <Text style={styles.cardLabel}>LTP: ₹{position.last_price.toFixed(2)}</Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Product: {position.product}</Text>
      <Text style={styles.cardLabel}>Exchange: {position.exchange}</Text>
    </View>
  </View>
);

const OrderCard: React.FC<{ order: KiteOrder }> = ({ order }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.symbolText}>{order.tradingsymbol}</Text>
      <Text style={[styles.statusText, getStatusColor(order.status)]}>
        {order.status}
      </Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>{order.transaction_type} {order.quantity}</Text>
      <Text style={styles.cardLabel}>₹{order.price.toFixed(2)}</Text>
      <Text style={styles.cardLabel}>{order.order_type}</Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Filled: {order.filled_quantity}</Text>
      <Text style={styles.cardLabel}>Product: {order.product}</Text>
    </View>
  </View>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETE':
      return { color: '#28a745' };
    case 'CANCELLED':
    case 'REJECTED':
      return { color: '#dc3545' };
    case 'OPEN':
      return { color: '#007bff' };
    default:
      return { color: '#6c757d' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#387ed1',
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pnlText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default PortfolioSummary;