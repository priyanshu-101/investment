import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProfileMenu } from './profile-menu';



export function Header() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const router = useRouter();

  const handleNavigation = (screen: string) => {
    switch (screen) {
      case 'Backtest':
        navigation.navigate('Backtest');
        break;
      case 'Wallet':
        navigation.navigate('Wallet');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
      case 'Subscriptions':
        router.push('/subscriptions');
        break;
      case 'Logout':
        console.log('Logging out user');
        break;
      default:
        console.log(`Screen ${screen} not implemented yet`);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.nameButton} onPress={() => navigation.navigate('Main', { activeTab: 'Home' })}>
          <Text style={styles.nameText}>Investment</Text>
        </TouchableOpacity>

        <View style={styles.centerControls}>
          <TouchableOpacity 
            style={styles.goButton}
            onPress={() => router.push('/subscriptions')}
          >
            <Text style={styles.goText}>GO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.bellIcon}>
              <View style={styles.bellBody} />
              <View style={styles.bellHandle} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.chartIcon}>
              <View style={[styles.chartBar, { height: 8 }]} />
              <View style={[styles.chartBar, { height: 12 }]} />
              <View style={[styles.chartBar, { height: 6 }]} />
              <View style={[styles.chartBar, { height: 10 }]} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => setShowProfileMenu(true)}
        >
          <Text style={styles.profileText}>P</Text>
        </TouchableOpacity>

        <ProfileMenu 
          visible={showProfileMenu} 
          onClose={() => setShowProfileMenu(false)} 
          onNavigate={handleNavigation}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
  },
  nameButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nameText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  goButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bellIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBody: {
    width: 16,
    height: 14,
    backgroundColor: '#666',
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  bellHandle: {
    width: 4,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    position: 'absolute',
    top: -2,
  },
  chartIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  chartBar: {
    width: 3,
    backgroundColor: '#666',
    borderRadius: 1,
  },
  profileButton: {
    width: 36,
    height: 36,
    backgroundColor: '#1E5A96',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // FAQ Modal Styles
  faqContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6c757d',
    fontWeight: '300',
  },
  faqContent: {
    flex: 1,
    padding: 16,
  },
  faqItem: {
    backgroundColor: 'white',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  // Subscription Plans Styles
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
  subtitleHighlight: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
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
  backtestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backtestButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  backtestIcon: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: '#1E5A96',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    minHeight: 200,
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
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
  prevButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  planName: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 16,
  },
  planPrice: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  planPeriod: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  faqSection: {
    marginTop: 16,
  },
  faqSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
});