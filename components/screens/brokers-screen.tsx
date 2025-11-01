import BrokerSelectionModal, { type Broker } from '@/components/broker-selection-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBrokers } from '../../hooks/useBrokers';
import { Header } from '../header';

export function BrokersScreen() {
  const { user } = useAuth();
  const [showBrokerModal, setShowBrokerModal] = useState<boolean>(false);
  const [brokerToggles, setBrokerToggles] = useState<Record<string, { terminal: boolean; trading: boolean }>>({});
  const [showMenuForBroker, setShowMenuForBroker] = useState<string | null>(null);
  
  const { 
    availableBrokers, 
    connectedBrokers, 
    loading, 
    error, 
    refreshBrokers, 
    connectBroker,
    disconnectBroker 
  } = useBrokers();

  const handleAddBroker = () => {
    setShowBrokerModal(true);
  };

  const handleSelectBroker = async (broker: Broker) => {
    console.log('Broker selected:', broker);
    setShowBrokerModal(false);
    await refreshBrokers();
  };

  const handleConnectBroker = async (params: any) => {
    const result = await connectBroker(params);
    if (result.success) {
      // Refresh brokers to show new broker on home page
      await refreshBrokers();
    }
    return result;
  };

  const handleMenuButtonPress = (brokerId: string) => {
    setShowMenuForBroker(showMenuForBroker === brokerId ? null : brokerId);
  };

  const handleDisconnectBroker = async (brokerId: string, brokerName: string) => {
    Alert.alert(
      'Disconnect Broker',
      `Are you sure you want to disconnect ${brokerName}? This broker will no longer appear on your home page.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowMenuForBroker(null)
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const result = await disconnectBroker(brokerId);
            if (result.success) {
              Alert.alert('Success', result.message);
              // Clear toggles for disconnected broker
              setBrokerToggles(prev => {
                const updated = { ...prev };
                delete updated[brokerId];
                return updated;
              });
              setShowMenuForBroker(null);
              // Refresh brokers to remove from home page
              await refreshBrokers();
            } else {
              Alert.alert('Error', result.message);
            }
          }
        }
      ]
    );
  };

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

  const handleCloseBrokerModal = () => {
    setShowBrokerModal(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <ThemedView style={[styles.container, styles.whiteBackground]}>
      <Header />
      <View style={styles.headerSection}>
        <ThemedText type="title" style={[styles.titleText, styles.blackText]}>
          Brokers
        </ThemedText>
        <TouchableOpacity 
          style={styles.topAddButton}
          onPress={handleAddBroker}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.topAddButtonText}>+ Add Broker</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <ThemedText style={styles.loadingText}>Loading Brokers...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Failed to load brokers</ThemedText>
            <ThemedText style={styles.errorMessage}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={refreshBrokers}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : connectedBrokers.length === 0 ? (
          <View style={styles.noBrokersContainer}>
            <View style={styles.illustrationContainer}>
              <Image 
                source={require('@/assets/images/Logo.png')} 
                style={styles.brokerImage}
                resizeMode="contain"
              />
            </View>
            
            <ThemedText style={styles.noBrokersText}>
              No Brokers connected. Please connect your brokers!
            </ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.brokersListContainer}>
              {connectedBrokers.map((broker, index) => (
                <View key={`${broker.id}-${index}`} style={styles.brokerCard}>
                  {/* Top Row - Logo, Info, Performance, Menu */}
                  <View style={styles.cardTopRow}>
                    {/* Logo */}
                    <View style={[styles.brokerLogo, { backgroundColor: broker.bgColor || '#E3F2FD' }]}>
                      <ThemedText style={[styles.brokerLogoText, { color: broker.color || '#1976D2' }]}>
                        {broker.logo || 'A'}
                      </ThemedText>
                    </View>

                    {/* Broker Name & ID */}
                    <View style={styles.brokerInfoLeft}>
                      <ThemedText style={styles.brokerName}>{broker.name}</ThemedText>
                      <ThemedText style={styles.brokerId}>{broker.userId || 'R10111359'}</ThemedText>
                    </View>

                    {/* Strategy Performance */}
                    <View style={styles.strategyPerformance}>
                      <ThemedText style={styles.strategyPerformanceLabel}>Strategy Performance</ThemedText>
                      <ThemedText style={styles.strategyPerformanceValue}>0.00 ↗</ThemedText>
                    </View>

                    {/* Menu Button */}
                    <View style={styles.menuContainer}>
                      <TouchableOpacity 
                        style={styles.menuButton}
                        onPress={() => handleMenuButtonPress(broker.id)}
                      >
                        <ThemedText style={styles.menuButtonText}>⋯</ThemedText>
                      </TouchableOpacity>

                      {showMenuForBroker === broker.id && (
                        <View style={styles.menuDropdown}>
                          <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => {
                              handleDisconnectBroker(broker.id, broker.name);
                              setShowMenuForBroker(null);
                            }}
                          >
                            <ThemedText style={styles.menuItemText}>Disconnect</ThemedText>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Bottom Row - Toggles */}
                  <View style={styles.cardBottomRow}>
                    {/* Terminal Toggle */}
                    <View style={styles.toggleSection}>
                      <View style={styles.toggleLabelRow}>
                        <View style={styles.terminalDot} />
                        <ThemedText style={styles.toggleLabel}>Terminal</ThemedText>
                      </View>
                      <TouchableOpacity 
                        style={[
                          styles.toggle,
                          brokerToggles[broker.id]?.terminal && styles.toggleOn
                        ]}
                        onPress={() => toggleTerminal(broker.id)}
                      >
                        <View style={[
                          styles.toggleThumb,
                          brokerToggles[broker.id]?.terminal && styles.toggleThumbOn
                        ]} />
                      </TouchableOpacity>
                    </View>

                    {/* Trading Toggle */}
                    <View style={styles.toggleSection}>
                      <View style={styles.toggleLabelRow}>
                        <View style={styles.tradingDot} />
                        <ThemedText style={styles.toggleLabel}>Trading Engine</ThemedText>
                      </View>
                      <TouchableOpacity 
                        style={[
                          styles.toggle,
                          brokerToggles[broker.id]?.trading && styles.toggleOn
                        ]}
                        onPress={() => toggleTrading(broker.id)}
                      >
                        <View style={[
                          styles.toggleThumb,
                          brokerToggles[broker.id]?.trading && styles.toggleThumbOn
                        ]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <BrokerSelectionModal
        visible={showBrokerModal}
        onClose={handleCloseBrokerModal}
        onSelectBroker={handleSelectBroker}
        onConnectBroker={handleConnectBroker}
        brokers={availableBrokers}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'left',
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  topAddButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topAddButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  blackText: {
    color: '#1E3A8A',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  noBrokersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  brokersListContainer: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  brokerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
    paddingLeft: 62,
  },
  brokerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brokerLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  brokerInfoLeft: {
    flex: 1,
  },
  brokerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  brokerId: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  strategyPerformance: {
    alignItems: 'center',
    minWidth: 110,
  },
  strategyPerformanceLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  strategyPerformanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  toggleSection: {
    alignItems: 'center',
    gap: 6,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  terminalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48BB78',
  },
  tradingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  toggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleOn: {
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
  menuButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
  },
  menuContainer: {
    position: 'relative',
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // No Brokers State Styles
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brokerImage: {
    width: 120,
    height: 120,
  },
  noBrokersText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  plusIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addAnotherButton: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  addAnotherText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  brokerUserId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});