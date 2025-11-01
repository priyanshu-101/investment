import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BrokerApiData, BrokerConnectionParams } from '../services/brokersApi';

export type Broker = BrokerApiData;

interface BrokerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBroker: (broker: Broker) => void;
  brokers: Broker[];
  onConnectBroker?: (params: BrokerConnectionParams) => Promise<{ success: boolean; message: string; broker?: BrokerApiData }>;
}

const BrokerSelectionModal: React.FC<BrokerSelectionModalProps> = ({ visible, onClose, onSelectBroker, brokers, onConnectBroker }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [brokerId, setBrokerId] = useState('');
  const [appName, setAppName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecretKey, setApiSecretKey] = useState('');

  const brokerRedirectUrls: Record<string, string> = {
    'angel one': 'https://www.angelone.in/',
    'aliceblue': 'https://www.paytmmoney.com/',
    'shoonya': 'https://bigul.co/',
    'finvasia': 'https://groww.in/',
    'tradejini': 'https://groww.in/',
    'fyers': 'https://kite.zerodha.com/',
    'dhan': 'https://www.angelone.in/',
    'upstox': 'https://www.paytmmoney.com/',
    'paytm money': 'https://www.paytmmoney.com/',
    'bigul': 'https://bigul.co/',
    'groww': 'https://groww.in/',
    'zerodha': 'https://kite.zerodha.com/',
    'default': 'https://www.angelone.in/',
  };

  const getRedirectUrl = (brokerName: string): string => {
    return brokerRedirectUrls[brokerName.toLowerCase()] || brokerRedirectUrls['default'];
  };

  const filteredBrokers = brokers
    .filter(broker => broker.name.toLowerCase() >= 'angel one'.toLowerCase())
    .filter(broker => broker.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleBrokerSelect = (broker: Broker) => {
    setSelectedBroker(broker);
    setShowConfigForm(true);
    setBrokerId('');
    setAppName('');
    setApiKey('');
    setApiSecretKey('');
  };

  const handleBackFromConfig = () => {
    setShowConfigForm(false);
    setSelectedBroker(null);
  };

  const handleSubmitConfig = async () => {
    if (selectedBroker && onConnectBroker) {
      if (!brokerId || !apiKey || !apiSecretKey) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      try {
        const connectionParams: BrokerConnectionParams = {
          brokerId: selectedBroker.id,
          appName: appName || 'Investment App',
          apiKey,
          apiSecretKey
        };

        const result = await onConnectBroker(connectionParams);
        
        if (result.success && result.broker) {
          onSelectBroker(result.broker);
          Alert.alert('Success', result.message);
          onClose();
          setShowConfigForm(false);
          setSelectedBroker(null);
        } else {
          Alert.alert('Connection Failed', result.message);
        }
      } catch {
        Alert.alert('Error', 'Failed to connect broker. Please try again.');
      }
    } else {
      // Fallback for brokers that don't need API connection
      if (selectedBroker) {
        onSelectBroker(selectedBroker);
        onClose();
        setShowConfigForm(false);
        setSelectedBroker(null);
      }
    }
  };

  const openYouTubeLink = () => {
    const youtubeUrl = `https://www.youtube.com/results?search_query=how+to+add+${selectedBroker?.name}+broker`;
    Linking.openURL(youtubeUrl);
  };

  const copyToClipboard = () => {
    // In a real app, you'd use Clipboard API
    // Clipboard.setString('https://web.algorooms.com/connect-broker');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={[styles.modalContainer, styles.whiteBackground]}>
        {!showConfigForm ? (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Find your broker</ThemedText>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
          </>
        ) : (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleBackFromConfig} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Add new broker</ThemedText>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedBroker && (
                <View style={styles.brokerHeader}>
                  <View style={[styles.selectedBrokerLogo, { backgroundColor: selectedBroker.bgColor }]}>
                    <ThemedText style={[styles.selectedBrokerLogoText, { color: selectedBroker.color }]}>
                      {selectedBroker.logo}
                    </ThemedText>
                  </View>
                  <View style={styles.brokerHeaderText}>
                    <ThemedText style={styles.selectedBrokerName}>{selectedBroker.name}</ThemedText>
                    <TouchableOpacity style={styles.youtubeLink} onPress={openYouTubeLink}>
                      <ThemedText style={styles.youtubeLinkText}>
                        How to add {selectedBroker.name} broker?
                      </ThemedText>
                      <Ionicons name="logo-youtube" size={20} color="#FF0000" style={styles.youtubeIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Broker ID"
                    placeholderTextColor="#9CA3AF"
                    value={brokerId}
                    onChangeText={setBrokerId}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="App Name (Any)"
                    placeholderTextColor="#9CA3AF"
                    value={appName}
                    onChangeText={setAppName}
                  />
                  <View style={styles.requiredDot} />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="API Key"
                    placeholderTextColor="#9CA3AF"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="API Secret Key"
                    placeholderTextColor="#9CA3AF"
                    value={apiSecretKey}
                    onChangeText={setApiSecretKey}
                    secureTextEntry
                  />
                </View>

                <View style={styles.redirectSection}>
                  <View style={styles.redirectHeader}>
                    <ThemedText style={styles.redirectLabel}>Redirect Url :</ThemedText>
                    <TouchableOpacity>
                      <Ionicons name="information-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.urlContainer}>
                    <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                      <Ionicons name="copy-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <ThemedText style={styles.urlText}>
                      {selectedBroker ? getRedirectUrl(selectedBroker.name) : 'https://web.algorooms.com/connect-broker'}
                    </ThemedText>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleSubmitConfig}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.submitButtonText}>Connect Broker</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}
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
  
  // Configuration Form Styles
  brokerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  selectedBrokerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedBrokerLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  brokerHeaderText: {
    flex: 1,
  },
  selectedBrokerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  youtubeLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  youtubeLinkText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  youtubeIcon: {
    marginLeft: 4,
  },
  formContainer: {
    paddingBottom: 40,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  requiredDot: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -4 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  redirectSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  redirectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  redirectLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyButton: {
    marginRight: 12,
    padding: 4,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: '#2563EB',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BrokerSelectionModal;