import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export type Broker = {
  id: number;
  name: string;
  logo: string;
  color: string;
  bgColor: string;
};

interface BrokerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBroker: (broker: Broker) => void;
  brokers: Broker[];
}

const BrokerSelectionModal: React.FC<BrokerSelectionModalProps> = ({ visible, onClose, onSelectBroker, brokers }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrokers = brokers.filter((broker) =>
    broker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBrokerSelect = (broker: Broker) => {
    onSelectBroker(broker);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={[styles.modalContainer, styles.whiteBackground]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>Find your broker</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Brokers"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Popular Brokers Section */}
          <View style={styles.brokersSection}>
            <ThemedText style={styles.sectionTitle}>Popular Brokers</ThemedText>

            <View style={styles.brokersGrid}>
              {filteredBrokers.map((broker) => (
                <TouchableOpacity
                  key={broker.id}
                  style={styles.brokerItem}
                  onPress={() => handleBrokerSelect(broker)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.brokerLogo, { backgroundColor: broker.bgColor }]}>
                    <ThemedText style={[styles.brokerLogoText, { color: broker.color }]}>
                      {broker.logo}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.brokerName}>{broker.name}</ThemedText>
                  {broker.name === 'FINVASIA' && <View style={styles.redDot} />}
                </TouchableOpacity>
              ))}
            </View>

            {filteredBrokers.length === 0 && (
              <View style={styles.noResultsContainer}>
                <ThemedText style={styles.noResultsText}>
                  No brokers found matching &quot;{searchQuery}&quot;
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  whiteBackground: {
    backgroundColor: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  brokersSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 20,
  },
  brokersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  brokerItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  brokerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  brokerLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  brokerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default BrokerSelectionModal;