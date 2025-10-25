import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BANK_DETAILS = {
  accountHolder: 'Rajendra Kumar Burdak',
  bank: 'SBI Bank',
  branch: 'Sewad Bari',
  accountNumber: '61239912933',
  ifscCode: 'SBIN0032348',
  upi: '9672093921@ybl',
};

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
  const planPrices = useMemo(() => {
    return PLANS.map((p) => ({
      ...p,
      price: `₹${p.monthly}`,
      periodLabel: 'One-time payment',
    }));
  }, []);

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
                <TouchableOpacity style={styles.selectButton}>
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
});

export default SubscriptionsAndFAQ;