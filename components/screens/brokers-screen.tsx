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
    await refreshBrokers();
  };

  const handleConnectBroker = async (params: any) => {
    return await connectBroker(params);
  };

  const handleDisconnectBroker = async (brokerId: string) => {
    const result = await disconnectBroker(brokerId);
    if (result.success) {
      Alert.alert('Success', result.message);
      // Clear toggles for disconnected broker
      setBrokerToggles(prev => {
        const updated = { ...prev };
        delete updated[brokerId];
        return updated;
      });
    } else {
      Alert.alert('Error', result.message);
    }
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

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <ThemedView style={[styles.container, styles.whiteBackground]}>
      <Header />
      <ThemedText type="title" style={[styles.titleText, styles.blackText]}>
        Brokers
      </ThemedText>
      
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
          <>
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
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddBroker}
              activeOpacity={0.7}
            >
              <View style={styles.buttonContent}>
                <ThemedText style={styles.plusIcon}>+</ThemedText>
                <ThemedText style={styles.buttonText}>Connect Broker</ThemedText>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.brokersListContainer}>
              {connectedBrokers.map((broker, index) => (
                <View key={`${broker.id}-${index}`} style={styles.connectedBrokerCard}>
                  {/* Header with Broker Name and Disconnect */}
                  <View style={styles.cardTopSection}>
                    <ThemedText style={styles.welcomeText}>Hello {userName},</ThemedText>
                    <TouchableOpacity 
                      style={styles.disconnectButton}
                      onPress={() => handleDisconnectBroker(broker.id)}
                    >
                      <ThemedText style={styles.disconnectText}>×</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Subscription Warning */}
                  <ThemedText style={styles.subscriptionWarning}>
                    Time to renew! Your subscription has expired.
                  </ThemedText>

                  {/* Broker Name Chip */}
                  <View style={styles.brokerChip}>
                    <View style={[styles.brokerChipLogo, { backgroundColor: broker.bgColor || '#E3F2FD' }]}>
                      <ThemedText style={[styles.brokerChipLogoText, { color: broker.color || '#1976D2' }]}>
                        {broker.logo || 'A'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.brokerChipText}>
                      {broker.name} ({broker.userId || 'R10111359'})
                    </ThemedText>
                  </View>

                  {/* Navigation Arrows */}
                  <View style={styles.navigationContainer}>
                    <TouchableOpacity style={styles.navArrow}>
                      <ThemedText style={styles.navArrowText}>‹</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navArrow}>
                      <ThemedText style={styles.navArrowText}>›</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Broker Details Row */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailSection}>
                      <ThemedText style={styles.detailLabel}>{broker.name}</ThemedText>
                      <ThemedText style={styles.detailValue}>{broker.userId || 'R10111359'}</ThemedText>
                    </View>
                    <View style={styles.performanceSection}>
                      <ThemedText style={styles.detailLabel}>Strategies Performance</ThemedText>
                      <ThemedText style={styles.performanceValue}>₹0.00</ThemedText>
                    </View>
                  </View>

                  {/* Feature Toggles */}
                  <View style={styles.togglesContainer}>
                    {/* Terminal */}
                    <View style={styles.toggleSection}>
                      <View style={styles.toggleLabelContainer}>
                        <View style={styles.terminalDot} />
                        <ThemedText style={styles.toggleLabel}>Terminal</ThemedText>
                        <ThemedText style={styles.infoIcon}>ℹ</ThemedText>
                      </View>
                      <View style={styles.toggleRow}>
                        <ThemedText style={styles.toggleOffText}>Off</ThemedText>
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
                        <ThemedText style={styles.toggleOnText}>On</ThemedText>
                      </View>
                    </View>

                    {/* Trading Engine */}
                    <View style={styles.toggleSection}>
                      <View style={styles.toggleLabelContainer}>
                        <View style={styles.tradingDot} />
                        <ThemedText style={styles.toggleLabel}>Trading Engine</ThemedText>
                      </View>
                      <View style={styles.toggleRow}>
                        <ThemedText style={styles.toggleOffText}>Off</ThemedText>
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
                        <ThemedText style={styles.toggleOnText}>On</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.addAnotherButton}
                onPress={handleAddBroker}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.addAnotherText}>+ Add Another Broker</ThemedText>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  blackText: {
    color: '#1E3A8A',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  brokersListContainer: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 20,
  },
  connectedBrokerCard: {
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
  brokerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  performanceSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  performanceValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  disconnectButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
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

  // Enhanced Broker Card Styles
  brokerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  brokerUserId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});