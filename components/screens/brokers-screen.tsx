import BrokerSelectionModal, { type Broker } from '@/components/broker-selection-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Header } from '../header';

// Mock broker data - replace with actual broker data
const brokersData = [
  { id: 1, name: 'STOXKART', logo: 'S', color: '#4CAF50', bgColor: '#E8F5E8' },
  { id: 2, name: 'Upstox', logo: 'up', color: '#9C27B0', bgColor: '#F3E5F5' },
  { id: 3, name: 'FINVASIA', logo: '∞', color: '#FF9800', bgColor: '#FFF3E0' },
  { id: 4, name: 'FYERS', logo: 'F', color: '#2196F3', bgColor: '#E3F2FD' },
  { id: 5, name: 'XTS', logo: '∑', color: '#FF5722', bgColor: '#FFE8E0' },
  { id: 6, name: 'Dhan', logo: 'B', color: '#607D8B', bgColor: '#ECEFF1' },
  { id: 7, name: 'IIFL', logo: '⬡', color: '#FF5722', bgColor: '#FFE8E0' },
  { id: 8, name: 'Zerodha', logo: 'Z', color: '#FF6B35', bgColor: '#FFE8E0' },
  { id: 9, name: 'Alice', logo: 'a', color: '#00BCD4', bgColor: '#E0F7FA' },
];



// Updated BrokersScreen Component
export function BrokersScreen() {
  const [showBrokerModal, setShowBrokerModal] = useState<boolean>(false);
  const [selectedBrokers, setSelectedBrokers] = useState<Broker[]>([]);

  const handleAddBroker = () => {
    setShowBrokerModal(true);
  };

  const handleSelectBroker = (broker: Broker) => {
    setSelectedBrokers(prev => [...prev, broker]);
    console.log('Broker selected:', broker);
    // You can add logic here to handle broker connection/authentication
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
        {selectedBrokers.length === 0 ? (
          <>
            <View style={styles.illustrationContainer}>
              <Image 
                source={require('@/assets/images/broker.png')} 
                style={styles.brokerImage}
                resizeMode="contain"
              />
            </View>
            
            <ThemedText style={styles.noBrokersText}>
              No Brokers found. Please Add brokers!
            </ThemedText>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddBroker}
              activeOpacity={0.7}
            >
              <View style={styles.buttonContent}>
                <ThemedText style={styles.plusIcon}>+</ThemedText>
                <ThemedText style={styles.buttonText}>Add Broker</ThemedText>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.brokersListContainer}>
            {selectedBrokers.map((broker, index) => (
              <View key={`${broker.id}-${index}`} style={styles.connectedBrokerCard}>
                <View style={[styles.connectedBrokerLogo, { backgroundColor: broker.bgColor }]}>
                  <ThemedText style={[styles.connectedBrokerLogoText, { color: broker.color }]}>
                    {broker.logo}
                  </ThemedText>
                </View>
                <ThemedText style={styles.connectedBrokerName}>{broker.name}</ThemedText>
                <View style={styles.connectedStatus}>
                  <View style={styles.statusDot} />
                  <ThemedText style={styles.statusText}>Connected</ThemedText>
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
        )}
      </View>

      <BrokerSelectionModal
        visible={showBrokerModal}
        onClose={handleCloseBrokerModal}
        onSelectBroker={handleSelectBroker}
        brokers={brokersData as Broker[]}
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
});