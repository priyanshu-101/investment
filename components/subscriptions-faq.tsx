import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Image, Linking } from 'react-native';

const BANK_DETAILS = {
  accountHolder: 'Rajendra Kumar Burdak',
  bank: 'SBI Bank',
  branch: 'Sewad Bari',
  accountNumber: '61239912933',
  ifscCode: 'SBIN0032348',
  upi: '9672093921@ybl',
};

const UPI_METHODS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: '₹',
    color: '#5F2E8A',
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    icon: '🔵',
    color: '#4285F4',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: '🌕',
    color: '#1F51B6',
  },
];

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    monthly: 499,
    yearly: 499,
    features: ['Unlimited Backtest for 7 days', 'Unlimited Portfolio Backtest for 7 days'],
  },
  {
    key: 'pro',
    name: 'PRO',
    monthly: 1499,
    yearly: 1499,
    features: ['Unlimited Backtest for 30 days', 'Unlimited Portfolio Backtest for 30 days'],
    popular: true,
  },
  {
    key: 'proplus',
    name: 'PRO+',
    monthly: 2499,
    yearly: 2499,
    features: ['Unlimited Backtest for 90 days', 'Unlimited Portfolio Backtest for 90 days'],
  },
];

export function SubscriptionsAndFAQ() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const planPrices = useMemo(() => {
    return PLANS.map((p) => ({
      ...p,
      price: `₹${p.monthly}`,
      periodLabel: 'One-time payment',
    }));
  }, []);

  const handleBuyCredits = (planKey: string) => {
    setSelectedPlan(planKey);
    setShowPaymentModal(true);
  };

  const handleUPIPayment = async (method: string) => {
    const upiID = BANK_DETAILS.upi;
    const payeeName = BANK_DETAILS.accountHolder;
    const amount = selectedPlan ? PLANS.find(p => p.key === selectedPlan)?.monthly || 0 : 0;
    
    const upiUrl = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&tn=Investment%20Platform%20Payment`;
    
    try {
      await Linking.openURL(upiUrl);
    } catch (error) {
      alert(`Unable to open UPI app. Please try again or use manual payment.`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={styles.subscriptionSection}>
          <Text style={styles.subscriptionTitle}>Choose Your Plan</Text>
          <View style={styles.subscriptionSubtitle}>
            <Text style={styles.subtitleText}>Select a plan to unlock unlimited backtesting features.</Text>
          </View>

          <View style={styles.plansGrid}>
            {planPrices.map((plan) => (
              <View key={plan.key} style={styles.planCard}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.periodLabel}</Text>
                <View style={{ height: 12 }} />
                {plan.features.map((f, idx) => (
                  <Text key={idx} style={styles.featureText}>• {f}</Text>
                ))}
                <View style={{ height: 16 }} />
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => handleBuyCredits(plan.key)}
                >
                  <Text style={styles.selectButtonText}>Buy Credits</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bankSection}>
          <Text style={styles.bankSectionTitle}>Bank Account Details</Text>
          <View style={styles.bankCard}>
            <Text style={styles.bankLabel}>Account Holder</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.accountHolder}</Text>
            
            <Text style={styles.bankLabel}>Bank</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.bank}</Text>
            
            <Text style={styles.bankLabel}>Branch</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.branch}</Text>
            
            <Text style={styles.bankLabel}>Account Number</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.accountNumber}</Text>
            
            <Text style={styles.bankLabel}>IFSC Code</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.ifscCode}</Text>
            
            <Text style={styles.bankLabel}>UPI</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.upi}</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <SafeAreaView style={styles.paymentModalContainer}>
          <View style={styles.paymentModalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.paymentCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.paymentModalTitle}>Payment</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.paymentModalContent}>
            <View style={styles.phonepeContainer}>
              <View style={styles.phonepeLogo}>
                <Text style={styles.phonepeLogoText}>₹</Text>
              </View>
              <Text style={styles.phonepeText}>PhonePe</Text>
            </View>

            <Text style={styles.acceptedText}>ACCEPTED HERE</Text>

            <View style={styles.qrContainer}>
              <Image
                source={require('../assets/images/qr-code.jpg')}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.scanText}>Scan & Pay Using PhonePe App</Text>

            <Text style={styles.orText}>OR</Text>

            <Text style={styles.upiMethodsTitle}>Pay with UPI</Text>
            <View style={styles.upiMethodsContainer}>
              {UPI_METHODS.map((method) => (
                <TouchableOpacity 
                  key={method.id}
                  style={[styles.upiButton, { borderColor: method.color }]}
                  onPress={() => handleUPIPayment(method.id)}
                >
                  <Text style={styles.upiIcon}>{method.icon}</Text>
                  <Text style={styles.upiButtonText}>{method.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Payment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>Rajendra Kumar Burdak</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>UPI:</Text>
                <Text style={styles.detailValue}>9672093921@ybl</Text>
              </View>
            </View>

            <View style={styles.copyrightContainer}>
              <Text style={styles.copyrightText}>© 2025, All rights reserved</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subscriptionSection: {
    marginBottom: 32,
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
  },
  subscriptionSubtitle: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1E5A96',
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#17a2b8',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },
  planPrice: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  planPeriod: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  featureText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    marginVertical: 2,
  },
  selectButton: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  selectButtonText: {
    color: '#1E5A96',
    fontSize: 14,
    fontWeight: '700',
  },

  bankSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  bankSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  bankCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bankValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },

  paymentModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  paymentCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '500',
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  paymentModalContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  phonepeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phonepeLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5F2E8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phonepeLogoText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  phonepeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  acceptedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5F2E8A',
    marginBottom: 24,
    letterSpacing: 1,
  },
  qrContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  scanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  copyrightContainer: {
    marginVertical: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  orText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginVertical: 16,
  },
  upiMethodsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  upiMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  upiButton: {
    flex: 1,
    minWidth: 100,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  upiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
});

export default SubscriptionsAndFAQ;