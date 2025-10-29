import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Area, CartesianChart, Line } from "victory-native";
import { useStrategies } from "../../hooks/useStrategies";
import { useBrokers } from "../../hooks/useBrokers";

export function StrategyTemplate() {
  const { strategies, loading, error, refreshStrategies, subscribeToStrategy } = useStrategies();
  const { connectedBrokers } = useBrokers();
  const hasConnectedBroker = connectedBrokers.length > 0;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);

  // Handle strategy subscription
  const handleStrategySubscription = async (strategyId: string) => {
    try {
      const success = await subscribeToStrategy(strategyId);
      if (success) {
        // Show success message or update UI
        console.log('Successfully subscribed to strategy:', strategyId);
      } else {
        // Show error message
        console.error('Failed to subscribe to strategy');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const handleLockedSubscription = () => {
    Alert.alert(
      "Connect Broker",
      "Please connect at least one broker before running strategies.",
      [{ text: "OK" }]
    );
  };

  // Handle refresh with animation
  const handleRefresh = async () => {
    try {
      await refreshStrategies();
      
      // Animate refresh
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Animation on mount and when data loads
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  // Smooth animation for data updates every 5 seconds (preserve scroll position)
  useEffect(() => {
    if (strategies.length > 0) {
      // Subtle animation that doesn't affect scroll position
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [strategies, fadeAnim]);

  const formatCurrency = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${Math.floor(value).toLocaleString('en-IN')}`;
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getReturnColor = (value: number): string => {
    if (value > 40000) return '#22c55e'; // Green for high returns
    if (value > 20000) return '#f59e0b'; // Orange for medium returns
    return '#ef4444'; // Red for low returns
  };

  if (!hasConnectedBroker) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedTitle}>Connect a broker to continue</Text>
        <Text style={styles.lockedSubtitle}>Add at least one broker before running strategies.</Text>
        <TouchableOpacity style={styles.lockedButton} onPress={handleRefresh}>
          <Text style={styles.lockedButtonText}>Refresh Brokers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Strategies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load strategies</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      onScroll={(event) => {
        currentScrollY.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Strategy Templates</Text>
        </View>
        <View style={styles.headerButtons}>
          {loading && <ActivityIndicator size="small" color="#4A90E2" />}
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {strategies.map((strategy, index) => (
        <Animated.View 
          key={strategy.id} 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.cardTitle}>{strategy.shortName}</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: getRiskColor(strategy.risk) }]}>
                  <Text style={styles.badgeText}>{strategy.risk} Risk</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{strategy.category}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricsSection}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Max DD</Text>
                <Text style={[styles.metricValue, { color: "#ef4444" }]}>
                  {strategy.maxDrawdown.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Margin</Text>
                <Text style={[styles.metricValue, { color: "#22c55e" }]}>
                  {formatCurrency(strategy.margin)}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Win Rate</Text>
                <Text style={[styles.metricValue, { color: "#4A90E2" }]}>
                  {strategy.winRate.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.performanceSection}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceTitle}>Performance</Text>
              <View style={styles.returnInfo}>
                <Text style={styles.returnLabel}>Total Return</Text>
                <Text style={[styles.returnValue, { color: getReturnColor(strategy.totalReturn) }]}>
                  {formatCurrency(strategy.totalReturn)}
                </Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <CartesianChart 
                data={strategy.performance}
                xKey="month"
                yKeys={["value"]}
                domainPadding={{ left: 0, right: 0, top: 20, bottom: 0 }}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Defs>
                      <LinearGradient id={`gradient_${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#4A90E2" stopOpacity={0.5} />
                        <Stop offset="50%" stopColor="#4A90E2" stopOpacity={0.2} />
                        <Stop offset="100%" stopColor="#4A90E2" stopOpacity={0.0} />
                      </LinearGradient>
                    </Defs>
                    <Area
                      points={points.value}
                      y0={chartBounds.bottom}
                      color={`url(#gradient_${index})`}
                    />
                    <Line
                      points={points.value}
                      color="#4A90E2"
                      strokeWidth={3}
                    />
                  </>
                )}
              </CartesianChart>
            </View>
          </View>

          <View style={styles.additionalMetrics}>
            <View style={styles.additionalMetric}>
              <Text style={styles.additionalLabel}>Sharpe Ratio</Text>
              <Text style={styles.additionalValue}>{strategy.sharpeRatio.toFixed(2)}</Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: strategy.isActive ? '#22c55e' : '#ef4444' }]} />
              <Text style={styles.statusText}>
                {strategy.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.button,
              { backgroundColor: strategy.isActive ? "#EAF1FF" : "#f3f4f6" }
            ]}
            onPress={() => {
              if (!hasConnectedBroker) {
                handleLockedSubscription();
                return;
              }

              if (strategy.isActive) {
                handleStrategySubscription(strategy.id);
              }
            }}
            disabled={!strategy.isActive}
          >
            <Text style={[
              styles.buttonText,
              { color: strategy.isActive ? "#4A90E2" : "#6b7280" }
            ]}>
              {strategy.isActive ? "Add to my strategy" : "Strategy Paused"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
  },
  lastUpdated: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  viewAll: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    marginBottom: 16,
  },
  titleSection: {
    marginBottom: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "500",
  },
  metricsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  metric: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  performanceSection: {
    marginVertical: 16,
  },
  performanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  returnInfo: {
    alignItems: "flex-end",
  },
  returnLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  returnValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  chartContainer: {
    height: 180,
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 8,
  },
  additionalMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  additionalMetric: {
    alignItems: "flex-start",
  },
  additionalLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  additionalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#EAF1FF",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    textAlign: "center",
    color: "#4A90E2",
    fontWeight: "600",
    fontSize: 14,
  },
});
