import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FAQ_DATA = [
  {
    id: 1,
    question: "What is Algorooms' goal?",
    answer:
      'Algorooms aims to democratize algorithmic trading by providing accessible, powerful trading strategies and tools for both beginners and experienced traders.',
  },
  {
    id: 2,
    question: 'How does Algorooms help me?',
    answer:
      'Algorooms provides pre-built trading strategies, backtesting tools, real-time market analysis, and educational resources to help you make informed trading decisions.',
  },
  {
    id: 3,
    question: 'What are the available subscription plans?',
    answer:
      'We offer three plans: Free (basic features), Limited (enhanced features), and Unlimited (full access to all features and strategies).',
  },
  {
    id: 4,
    question: 'What features are included in the Free plan?',
    answer:
      'The Free plan includes access to basic market data, limited strategy templates, and basic backtesting capabilities.',
  },
  {
    id: 5,
    question: 'What features are included in the Unlimited plan?',
    answer:
      'The Unlimited plan includes all features: unlimited strategies, advanced backtesting, real-time alerts, priority support, and exclusive market insights.',
  },
  {
    id: 6,
    question: 'What features are included in the Limited plan?',
    answer:
      'The Limited plan includes enhanced market data, more strategy templates, advanced backtesting, and email support.',
  },
  {
    id: 7,
    question: 'Are there any restrictions on broker access?',
    answer:
      'Broker access depends on your subscription plan. Free users have limited broker integrations, while Unlimited users get access to all supported brokers.',
  },
  {
    id: 8,
    question: 'Is access to strategy templates included in all plans?',
    answer:
      'Yes, all plans include access to strategy templates, but the number and complexity vary by plan. Free users get basic templates, while Unlimited users get access to all premium strategies.',
  },
];

const FAQItem = ({
  item,
  isExpanded,
  onToggle,
}: {
  item: typeof FAQ_DATA[0];
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <View style={styles.faqItem}>
    <TouchableOpacity style={styles.faqQuestion} onPress={onToggle}>
      <Text style={styles.faqQuestionText}>{item.question}</Text>
      <Text style={styles.faqIcon}>{isExpanded ? '−' : '+'}</Text>
    </TouchableOpacity>
    {isExpanded && (
      <View style={styles.faqAnswer}>
        <Text style={styles.faqAnswerText}>{item.answer}</Text>
      </View>
    )}
  </View>
);

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    features: ['Basic market data', 'Basic backtesting', 'Starter templates'],
  },
  {
    key: 'limited',
    name: 'Limited',
    monthly: 19,
    yearly: 180,
    features: ['Enhanced market data', 'Advanced backtesting', 'More templates', 'Email support'],
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    monthly: 39,
    yearly: 360,
    features: ['All premium strategies', 'Real-time alerts', 'Priority support', 'Exclusive insights'],
    popular: true,
  },
];

export function SubscriptionsAndFAQ() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const planPrices = useMemo(() => {
    return PLANS.map((p) => ({
      ...p,
      price: billingPeriod === 'monthly' ? `$${p.monthly}/mo` : `$${p.yearly}/yr`,
      periodLabel: billingPeriod === 'monthly' ? 'Billed monthly' : 'Billed annually',
    }));
  }, [billingPeriod]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={styles.subscriptionSection}>
          <Text style={styles.subscriptionTitle}>Choose Your Plan</Text>
          <View style={styles.subscriptionSubtitle}>
            <Text style={styles.subtitleText}>Start free, upgrade anytime to unlock more features.</Text>
          </View>

          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodTab, billingPeriod === 'monthly' && styles.periodTabActive]}
              onPress={() => setBillingPeriod('monthly')}
            >
              <Text style={[styles.periodTabText, billingPeriod === 'monthly' && styles.periodTabTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodTab, billingPeriod === 'yearly' && styles.periodTabActive]}
              onPress={() => setBillingPeriod('yearly')}
            >
              <Text style={[styles.periodTabText, billingPeriod === 'yearly' && styles.periodTabTextActive]}>Yearly</Text>
            </TouchableOpacity>
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
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          {FAQ_DATA.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isExpanded={expandedFAQ === item.id}
              onToggle={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
            />
          ))}
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: '#4A90E2',
  },
  periodTabText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  periodTabTextActive: {
    color: 'white',
    fontWeight: '600',
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

  faqSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  faqSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: 'white',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'white',
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    paddingRight: 12,
  },
  faqIcon: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: '300',
  },
  faqAnswer: {
    padding: 18,
    paddingTop: 0,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6c757d',
  },
});

export default SubscriptionsAndFAQ;