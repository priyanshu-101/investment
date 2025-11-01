import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface DeploymentModalProps {
  visible: boolean;
  strategyName: string;
  strategyId: string;
  onClose: () => void;
  onDeploy: (deploymentData: DeploymentData) => Promise<void>;
}

export interface DeploymentData {
  quantityMultiplier: number;
  maxProfit: number;
  maxLoss: number;
  brokerName: string;
  squareOffTime: string;
  deploymentType: 'Live' | 'ForwardTest';
  termsAccepted: boolean;
}

export function DeploymentModal({
  visible,
  strategyName,
  strategyId,
  onClose,
  onDeploy,
}: DeploymentModalProps) {
  const [formData, setFormData] = useState<DeploymentData>({
    quantityMultiplier: 1,
    maxProfit: 0,
    maxLoss: 2500,
    brokerName: '',
    squareOffTime: '15:11',
    deploymentType: 'ForwardTest',
    termsAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [brokerDropdownOpen, setBrokerDropdownOpen] = useState(false);
  const brokers = ['Zerodha', 'Angel', 'Shoonya'];

  useEffect(() => {
    // Reset form when modal opens
    if (visible) {
      setFormData({
        quantityMultiplier: 1,
        maxProfit: 0,
        maxLoss: 2500,
        brokerName: '',
        squareOffTime: '15:11',
        deploymentType: 'ForwardTest',
        termsAccepted: false,
      });
    }
  }, [visible]);

  const handleDeploy = async () => {
    if (!formData.brokerName) {
      Alert.alert('Error', 'Please select a broker');
      return;
    }

    if (!formData.termsAccepted) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await onDeploy(formData);
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Deployment error:', error);
      Alert.alert('Error', 'Failed to deploy strategy');
    }
  };

  const handleSquareOffTimeChange = (text: string) => {
    // Allow only time format HH:MM
    const cleaned = text.replace(/[^0-9:]/g, '');
    if (cleaned.length <= 5) {
      setFormData({ ...formData, squareOffTime: cleaned });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Deploy {strategyName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Quantity Multiplier */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity Multiplier</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={String(formData.quantityMultiplier)}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 1;
                  setFormData({ ...formData, quantityMultiplier: num });
                }}
              />
            </View>

            {/* Max Profit */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Max Profit (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={String(formData.maxProfit)}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  setFormData({ ...formData, maxProfit: num });
                }}
              />
            </View>

            {/* Max Loss */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Max Loss (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="2500"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={String(formData.maxLoss)}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 2500;
                  setFormData({ ...formData, maxLoss: num });
                }}
              />
            </View>

            {/* Broker Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Broker Name</Text>
              <TouchableOpacity
                style={styles.brokerButton}
                onPress={() => setBrokerDropdownOpen(!brokerDropdownOpen)}
              >
                <Text style={[styles.brokerButtonText, !formData.brokerName && { color: '#999' }]}>
                  {formData.brokerName || 'Select Broker'}
                </Text>
                <Text style={styles.brokerDropdownIcon}>
                  {brokerDropdownOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {brokerDropdownOpen && (
                <View style={styles.brokerDropdown}>
                  {brokers.map((broker) => (
                    <TouchableOpacity
                      key={broker}
                      style={styles.brokerDropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, brokerName: broker });
                        setBrokerDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.brokerDropdownItemText}>{broker}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Square Off Time */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Square Off Time</Text>
              <TextInput
                style={styles.input}
                placeholder="15:11"
                placeholderTextColor="#999"
                value={formData.squareOffTime}
                onChangeText={handleSquareOffTimeChange}
                maxLength={5}
              />
            </View>

            {/* Deployment Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Deployment Type</Text>
              <View style={styles.deploymentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.deploymentTypeButton,
                    formData.deploymentType === 'Live' && styles.deploymentTypeButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, deploymentType: 'Live' })
                  }
                >
                  <Text
                    style={[
                      styles.deploymentTypeText,
                      formData.deploymentType === 'Live' && styles.deploymentTypeTextActive,
                    ]}
                  >
                    Live
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deploymentTypeButton,
                    formData.deploymentType === 'ForwardTest' && styles.deploymentTypeButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, deploymentType: 'ForwardTest' })
                  }
                >
                  <Text
                    style={[
                      styles.deploymentTypeText,
                      formData.deploymentType === 'ForwardTest' && styles.deploymentTypeTextActive,
                    ]}
                  >
                    Forward Test
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setFormData({ ...formData, termsAccepted: !formData.termsAccepted })
                }
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData.termsAccepted && styles.checkboxBoxChecked,
                  ]}
                >
                  {formData.termsAccepted && (
                    <Text style={styles.checkboxMark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }}>
                <Text style={styles.termsText}>
                  I accept all the{' '}
                  <Text style={styles.termsLink}>terms & conditions</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deployButton, !formData.termsAccepted && styles.deployButtonDisabled]}
              onPress={handleDeploy}
              disabled={loading || !formData.termsAccepted}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deployButtonText}>Deploy</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffe0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  brokerButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  brokerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  brokerDropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  brokerDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: -8,
    marginHorizontal: -1,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  brokerDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brokerDropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  deploymentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  deploymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  deploymentTypeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  deploymentTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  deploymentTypeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deploymentTypeTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 13,
    color: '#666',
  },
  termsLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  deployButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  deployButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deployButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
