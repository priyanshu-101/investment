import BrokerSelectionModal, { type Broker } from '@/components/broker-selection-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBrokers } from '../../hooks/useBrokers';
import { Header } from '../header';



export function BrokersScreen() {
  const [showBrokerModal, setShowBrokerModal] = useState<boolean>(false);
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
    await refreshBrokers(); // Refresh to get updated connected status
  };

  const handleConnectBroker = async (params: any) => {
    return await connectBroker(params);
  };

  const handleDisconnectBroker = async (brokerId: string) => {
    const result = await disconnectBroker(brokerId);
    if (result.success) {
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleCloseBrokerModal = () => {
    setShowBrokerModal(false);
  };

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
          <View style={styles.brokersListContainer}>
            {connectedBrokers.map((broker, index) => (
              <View key={`${broker.id}-${index}`} style={styles.connectedBrokerCard}>
                <View style={[styles.connectedBrokerLogo, { backgroundColor: broker.bgColor }]}>
                  <ThemedText style={[styles.connectedBrokerLogoText, { color: broker.color }]}>
                    {broker.logo}
                  </ThemedText>
                </View>
                <View style={styles.brokerInfo}>
                  <ThemedText style={styles.connectedBrokerName}>{broker.name}</ThemedText>
                  {broker.userId && (
                    <ThemedText style={styles.brokerUserId}>ID: {broker.userId}</ThemedText>
                  )}
                </View>
                <View style={styles.connectedStatus}>
                  <View style={[styles.statusDot, { 
                    backgroundColor: broker.status === 'connected' ? '#4CAF50' : '#FF4444' 
                  }]} />
                  <ThemedText style={[styles.statusText, { 
                    color: broker.status === 'connected' ? '#4CAF50' : '#FF4444' 
                  }]}>
                    {broker.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={styles.disconnectButton}
                  onPress={() => handleDisconnectBroker(broker.id)}
                >
                  <ThemedText style={styles.disconnectText}>×</ThemedText>
                </TouchableOpacity>
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
    marginBottom: 40,
  },
  blackText: {
    color: '#1E3A8A',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -80,
  },
  illustrationContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokerImage: {
    width: 200,
    height: 200,
  },
  noBrokersText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 150,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '500',
  },
  
  // Connected Brokers Styles
  brokersListContainer: {
    width: '100%',
    alignItems: 'center',
  },
  connectedBrokerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  connectedBrokerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  connectedBrokerLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedBrokerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  addAnotherButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addAnotherText: {
    fontSize: 16,
    color: '#3B82F6',
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
  disconnectButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  disconnectText: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: 'bold',
  },
});