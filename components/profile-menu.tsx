import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, useProfileData } from '../hooks/useProfileData';

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export function ProfileMenu({ visible, onClose, onNavigate }: ProfileMenuProps) {
  const { user, isAuthenticated } = useAuth();
  const { wallet, backtest, portfolio, isLoading, refreshData, refreshBacktestData } = useProfileData();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menuItems = [
    { 
      icon: '👤', 
      title: 'Profile', 
      color: '#4A90E2',
      screen: 'Profile'
    },
    { 
      icon: '💳', 
      title: 'Wallet', 
      value: formatCurrency(wallet.balance),
      color: '#4A90E2',
      screen: 'Wallet'
    },
    { 
      icon: '📊', 
      title: 'Backtest', 
      value: `${backtest.credits} credits`,
      color: '#4A90E2',
      screen: 'Backtest'
    },
    { 
      icon: '📈', 
      title: 'Portfolio', 
      value: formatCurrency(portfolio.totalValue),
      color: '#4A90E2',
      screen: 'Portfolio'
    },
    { 
      icon: '📱', 
      title: 'Subscriptions', 
      color: '#4A90E2',
      screen: 'Subscriptions'
    },
    { 
      icon: '🔑', 
      title: 'Change password', 
      color: '#4A90E2',
      screen: 'ChangePassword'
    },
    { 
      icon: '🚪', 
      title: 'Logout', 
      color: '#4A90E2',
      screen: 'Logout'
    },
  ];

  const bottomItems = [
    {
      icon: '▶️',
      title: 'How to use?',
      color: '#FF0000',
      screen: 'Tutorial'
    },
    {
      icon: '💬',
      title: 'Join Community',
      color: '#00BFFF',
      screen: 'Community'
    },
    {
      icon: '💚',
      title: 'Help Desk',
      color: '#25D366',
      screen: 'HelpDesk'
    }
  ];

  const handleMenuItemPress = (screen: string) => {
    onClose();
    onNavigate(screen);
  };

  const handleBottomItemPress = (screen: string) => {
    setActiveModal(screen);
  };

  const handleRefreshData = async () => {
    await refreshData();
  };

  // Refresh backtest data when profile menu becomes visible
  useEffect(() => {
    if (visible && isAuthenticated) {
      refreshBacktestData();
    }
  }, [visible, isAuthenticated, refreshBacktestData]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuContent}>
            {isAuthenticated && user && (
              <>
                <View style={styles.userInfo}>
                  <View style={styles.refreshContainer}>
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={handleRefreshData}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#4A90E2" />
                      ) : (
                        <Text style={styles.refreshText}>↻</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                {item.value && (
                  <Text style={styles.menuItemValue}>{item.value}</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <View style={styles.separator} />
            
            {bottomItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => handleBottomItemPress(item.screen)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={activeModal === 'Tutorial'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>How to use?</Text>
            <Text style={styles.modalText}>UPCOMING</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={activeModal === 'Community'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Join Community</Text>
            <Text style={styles.modalText}>UPCOMING</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={activeModal === 'HelpDesk'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Help Desk</Text>
            <View style={styles.contactContainer}>
              <Text style={styles.contactLabel}>Email:</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:satyamalgovestment@zohomail.com')}>
                <Text style={styles.contactValue}>satyamalgoinvestment@zohomail.com</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.contactContainer}>
              <Text style={styles.contactLabel}>WhatsApp:</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/919828618998')}>
                <Text style={styles.contactValue}>+91 98286818998</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  menuContent: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
    color: 'white',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuItemValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'flex-end',
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  refreshText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxWidth: '80%',
    width: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#666',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  contactContainer: {
    marginVertical: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  contactValue: {
    fontSize: 14,
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
});
