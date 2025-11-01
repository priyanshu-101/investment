import { StrategyTemplate } from '@/components/screens/StrategyTemplate';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header } from '../header';
import { IndicesSlider } from '../indices-slider';
import { ProductsSection } from '../products-section';

interface Broker {
  id: string;
  name: string;
  userId?: string;
  bgColor?: string;
  color?: string;
  logo?: string;
}

interface HomeScreenProps {
  connectedBrokers?: Broker[];
  onNavigateToStrategies?: () => void;
  onNavigateToBrokers?: () => void;
}

export function HomeScreen({ connectedBrokers = [], onNavigateToStrategies, onNavigateToBrokers }: HomeScreenProps) {
  const { user } = useAuth();
  const [brokerToggles, setBrokerToggles] = useState<Record<string, { terminal: boolean; trading: boolean }>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  const toggleTerminal = (brokerId: string) => {
    setBrokerToggles(prev => ({
      ...prev,
      [brokerId]: {
        ...prev[brokerId],
        terminal: !prev[brokerId]?.terminal
      }
    }));
  };

  const toggleTrading = (brokerId: string) => {
    setBrokerToggles(prev => ({
      ...prev,
      [brokerId]: {
        ...prev[brokerId],
        trading: !prev[brokerId]?.trading
      }
    }));
  };

  const userName = user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    const createFloatingAnimation = (animValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloatingAnimation(floatAnim1, 0);
    createFloatingAnimation(floatAnim2, 300);
    createFloatingAnimation(floatAnim3, 600);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4A90E2" barStyle="light-content" />
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <IndicesSlider />
        <View style={styles.noticeContainer}>
          {/* <Text style={styles.noticeText}>
            Dear users, due to some technical issue from meta,{'\n'}
            whatsapp support is not available for today. Please{'\n'}
            share your queries on different number +91-{'\n'}
            7669284138 (Whatsapp chat only).
          </Text> */}
        </View>

        {/* Animated Card */}
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {connectedBrokers.length === 0 ? (
            // Show "Add Broker" card when no brokers are connected
            <View style={styles.cardContainer}>
              <View style={styles.illustrationContainer}>
                <View style={styles.handsContainer}>
                  <View style={styles.papersContainer}>
                    <Image
                      source={require('@/assets/images/Logo.png')}
                      style={styles.paper}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>

              <Animated.Text
                style={[
                  styles.title,
                  {
                    opacity: titleAnim,
                    transform: [{
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      })
                    }]
                  }
                ]}
              >
                Add new Broker
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.subtitle,
                  {
                    opacity: titleAnim,
                    transform: [{
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }]
                  }
                ]}
              >
                No brokers added at the moment
              </Animated.Text>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity style={styles.addButton} onPress={onNavigateToBrokers}>
                  <Text style={styles.addButtonText}>+ Add Broker</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : (
            // Show connected brokers cards
            <ScrollView style={styles.brokersContainer} scrollEnabled={false}>
              {connectedBrokers.map((broker, index) => (
                <View key={`${broker.id}-${index}`} style={styles.brokerCard}>
                  {/* Header with Welcome Message */}
                  <View style={styles.cardTopSection}>
                    <Text style={styles.welcomeText}>Hello {userName},</Text>
                  </View>

                  {/* Subscription Warning */}
                  <Text style={styles.subscriptionWarning}>
                    Time to renew! Your subscription has expired.
                  </Text>

                  {/* Navigation Dots */}
                  <View style={styles.dotsContainer}>
                    <View style={[styles.dot, styles.activeDot]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>

                  {/* Broker Chip with Navigation */}
                  <View style={styles.brokerChipContainer}>
                    <TouchableOpacity style={styles.navArrow}>
                      <Text style={styles.navArrowText}>‹</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.brokerChip}>
                      <View style={[styles.brokerChipLogo, { backgroundColor: broker.bgColor || '#E3F2FD' }]}>
                        <Text style={[styles.brokerChipLogoText, { color: broker.color || '#1976D2' }]}>
                          {broker.logo || 'A'}
                        </Text>
                      </View>
                      <Text style={styles.brokerChipText}>
                        {broker.name} ({broker.userId || 'R10111359'})
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.navArrow}>
                      <Text style={styles.navArrowText}>›</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Broker Details Row */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>{broker.name}</Text>
                      <Text style={styles.detailValue}>{broker.userId || 'R10111359'}</Text>
                    </View>
                    <View style={styles.performanceSection}>
                      <Text style={styles.detailLabel}>Strategies Performance</Text>
                      <Text style={styles.performanceValue}>₹0.00</Text>
                    </View>
                  </View>

                  {/* Feature Toggles */}
                  <View style={styles.togglesContainer}>
                    {/* Terminal */}
                    <View style={styles.toggleSection}>
                      <View style={styles.toggleLabelContainer}>
                        <View style={styles.terminalDot} />
                        <Text style={styles.toggleLabel}>Terminal</Text>
                        <Text style={styles.infoIcon}>ℹ</Text>
                      </View>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleOffText}>Off</Text>
                        <TouchableOpacity 
                          style={[
                            styles.toggleSwitch,
                            brokerToggles[broker.id]?.terminal && styles.toggleSwitchOn
                          ]}
                          onPress={() => toggleTerminal(broker.id)}
                        >
                          <View style={[
                            styles.toggleThumb,
                            brokerToggles[broker.id]?.terminal && styles.toggleThumbOn
                          ]} />
                        </TouchableOpacity>
                        <Text style={styles.toggleOnText}>On</Text>
                      </View>
                    </View>

                    {/* Trading Engine */}
                    <View style={styles.toggleSection}>
                      <View style={styles.toggleLabelContainer}>
                        <View style={styles.tradingDot} />
                        <Text style={styles.toggleLabel}>Trading Engine</Text>
                      </View>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleOffText}>Off</Text>
                        <TouchableOpacity 
                          style={[
                            styles.toggleSwitch,
                            brokerToggles[broker.id]?.trading && styles.toggleSwitchOn
                          ]}
                          onPress={() => toggleTrading(broker.id)}
                        >
                          <View style={[
                            styles.toggleThumb,
                            brokerToggles[broker.id]?.trading && styles.toggleThumbOn
                          ]} />
                        </TouchableOpacity>
                        <Text style={styles.toggleOnText}>On</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        <ProductsSection onNavigateToStrategies={onNavigateToStrategies} />
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <StrategyTemplate />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { paddingBottom: 40 },
  noticeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeText: { color: '#FF9500', fontSize: 16, lineHeight: 20 },
  mainContent: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    alignItems: 'flex-start',
  },
  cardContainer: {
    backgroundColor: '#1a1f71',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  illustrationContainer: {
    marginBottom: 60,
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
  },
  handsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 200,
    height: 140,
  },
  leftHand: { position: 'absolute', left: 10, bottom: 0, zIndex: 2 },
  rightHand: { position: 'absolute', right: 10, bottom: 0, zIndex: 2 },
  hand: {
    width: 50,
    height: 70,
    backgroundColor: '#F4C2A1',
    borderRadius: 25,
    position: 'relative',
  },
  leftThumb: {
    width: 18,
    height: 25,
    backgroundColor: '#F4C2A1',
    borderRadius: 12,
    position: 'absolute',
    top: 12,
    right: -8,
  },
  rightThumb: {
    width: 18,
    height: 25,
    backgroundColor: '#F4C2A1',
    borderRadius: 12,
    position: 'absolute',
    top: 12,
    left: -8,
  },
  papersContainer: { position: 'absolute', top: 10, left: 60, right: 60, zIndex: 1 },
  paper: {
    width: 100,
    height: 125,

  },
  redPaper: { backgroundColor: '#FF6B6B', left: -8, top: 0, zIndex: 3 },
  whitePaper: { backgroundColor: '#FFFFFF', left: 12, top: 8, zIndex: 2 },
  orangePaper: { backgroundColor: '#FF8E53', left: 32, top: 2, zIndex: 1 },
  title: { color: 'white', fontSize: 32, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 18, marginBottom: 60, textAlign: 'center' },
  addButton: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: { color: '#4A90E2', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  
  // Broker Display Styles
  brokersContainer: {
    width: '100%',
    marginBottom: 20,
  },
  brokerCard: {
    backgroundColor: '#1E3A6A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    minHeight: 280,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subscriptionWarning: {
    fontSize: 13,
    color: '#FBBF24',
    marginBottom: 16,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#FBBF24',
  },
  brokerChipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  brokerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    marginHorizontal: 8,
  },
  brokerChipLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brokerChipLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  brokerChipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailSection: {
    flex: 1,
  },
  performanceSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  performanceValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  togglesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleSection: {
    flex: 1,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  terminalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
  },
  tradingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  toggleLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  infoIcon: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleOffText: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  toggleOnText: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: '#48BB78',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginLeft: 2,
  },
  toggleThumbOn: {
    marginLeft: 'auto',
    marginRight: 2,
  },
});
