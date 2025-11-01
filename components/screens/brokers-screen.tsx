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
                <View key={`${broker.id}-${index}`} style={styles.brokerCardLarge}>
                  {/* Left Section - Logo */}
                  <View style={styles.cardLeftSection}>
                    <View style={[styles.brokerLogoBig, { backgroundColor: broker.bgColor || '#E3F2FD' }]}>
                      <ThemedText style={[styles.brokerLogoBigText, { color: broker.color || '#1976D2' }]}>
                        {broker.logo || 'A'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Center Section - Broker Info */}
                  <View style={styles.brokerInfoSmall}>
                    <ThemedText style={styles.brokerNameLarge}>{broker.name}</ThemedText>
                    <ThemedText style={styles.brokerIdText}>{broker.userId || 'R10111359'}</ThemedText>
                  </View>

                  {/* Performance Section */}
                  <View style={styles.performanceSectionHorizontal}>
                    <ThemedText style={styles.performanceLabel}>Strategy Performance</ThemedText>
                    <ThemedText style={styles.performanceValue}>0.00 ↗</ThemedText>
                  </View>

                  {/* Right Section - Toggles and Menu */}
                  <View style={styles.cardRightSectionHorizontal}>
                    {/* Terminal Indicator */}
                    <View style={styles.toggleGroupVerticalSmall}>
                      <View style={styles.toggleGroupHorizontal}>
                        <View style={styles.terminalDot} />
                        <TouchableOpacity 
                          style={[
                            styles.largeToggle,
                            brokerToggles[broker.id]?.terminal && styles.largeToggleOn
                          ]}
                          onPress={() => toggleTerminal(broker.id)}
                        >
                          <View style={[
                            styles.largeToggleThumb,
                            brokerToggles[broker.id]?.terminal && styles.largeToggleThumbOn
                          ]} />
                        </TouchableOpacity>
                      </View>
                      <ThemedText style={styles.toggleLabelSmall}>Terminal</ThemedText>
                    </View>

                    {/* Trading Indicator */}
                    <View style={styles.toggleGroupVerticalSmall}>
                      <View style={styles.toggleGroupHorizontal}>
                        <View style={styles.tradingDot} />
                        <TouchableOpacity 
                          style={[
                            styles.largeToggle,
                            brokerToggles[broker.id]?.trading && styles.largeToggleOn
                          ]}
                          onPress={() => toggleTrading(broker.id)}
                        >
                          <View style={[
                            styles.largeToggleThumb,
                            brokerToggles[broker.id]?.trading && styles.largeToggleThumbOn
                          ]} />
                        </TouchableOpacity>
                      </View>
                      <ThemedText style={styles.toggleLabelSmall}>Trading Engine</ThemedText>
                    </View>

                    {/* Menu Button */}
                    <TouchableOpacity 
                      style={styles.menuButtonLarge}
                      onPress={() => handleDisconnectBroker(broker.id)}
                    >
                      <ThemedText style={styles.menuButtonTextLarge}>⋯</ThemedText>
                    </TouchableOpacity>
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
  brokerCardLarge: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 80,
    gap: 12,
  },
  cardLeftSection: {
    alignItems: 'center',
  },
  brokerLogoBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokerLogoBigText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  brokerInfoSmall: {
    minWidth: 120,
  },
  brokerNameLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  brokerIdText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  performanceSectionHorizontal: {
    alignItems: 'center',
    minWidth: 140,
  },
  performanceLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  performanceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardRightSectionHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 12,
  },
  toggleGroupHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleGroupVerticalSmall: {
    alignItems: 'center',
    gap: 3,
  },
  toggleLabelSmall: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },
  largeToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeToggleOn: {
    backgroundColor: '#48BB78',
  },
  largeToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    marginLeft: 3,
  },
  largeToggleThumbOn: {
    marginLeft: 'auto',
    marginRight: 3,
  },
  menuButtonLarge: {
    padding: 6,
  },
  menuButtonTextLarge: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
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
  brokerUserId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});