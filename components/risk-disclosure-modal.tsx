import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface RiskDisclosureModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function RiskDisclosureModal({ visible, onAccept }: RiskDisclosureModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAccept = () => {
    if (termsAccepted) {
      setTermsAccepted(false);
      onAccept();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Risk disclosures on derivatives</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.disclosureItem}>
                <View style={styles.bulletCircle} />
                <Text style={styles.disclosureText}>
                  9 out of 10 individual traders in equity Futures and Options Segment, incurred net losses.
                </Text>
              </View>

              <View style={styles.disclosureItem}>
                <View style={styles.bulletCircle} />
                <Text style={styles.disclosureText}>
                  On an average, loss makers registered net trading loss close to ₹50,000.
                </Text>
              </View>

              <View style={styles.disclosureItem}>
                <View style={styles.bulletCircle} />
                <Text style={styles.disclosureText}>
                  Over and above the net trading losses incurred, loss makers expended an additional 28% of net trading losses as transaction costs.
                </Text>
              </View>

              <View style={styles.disclosureItem}>
                <View style={styles.bulletCircle} />
                <Text style={styles.disclosureText}>
                  Those making net trading profits, incurred between 15% to 50% of such profits as transaction cost.
                </Text>
              </View>

              <View style={styles.sourceSection}>
                <Text style={styles.sourceLabel}>Source: </Text>
                <Text style={styles.sourceText}>
                  <Text style={styles.sourceLink}>SEBI</Text> study dated January 25, 2023 on "Analysis of Profit and Loss of Individual Traders dealing in equity Futures and Options (F&O) Segment", wherein Aggregate Level findings are based on annual Profit/Loss incurred by individual traders in equity F&O during FY 2021-22.
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  I accept all the <Text style={styles.link}>terms & conditions</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.understandButton, !termsAccepted && styles.understandButtonDisabled]}
                onPress={handleAccept}
                disabled={!termsAccepted}
              >
                <Text style={styles.understandButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  disclosureItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bulletCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
    marginRight: 12,
    marginTop: 4,
    flexShrink: 0,
  },
  disclosureText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    flex: 1,
  },
  sourceSection: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  sourceText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  sourceLink: {
    color: '#2563EB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E40AF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  link: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  understandButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  understandButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  understandButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
