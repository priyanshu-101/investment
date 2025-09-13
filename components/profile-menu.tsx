import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileMenu({ visible, onClose }: ProfileMenuProps) {
  const menuItems = [
    { 
      icon: '👤', 
      title: 'Profile', 
      color: '#4A90E2' 
    },
    { 
      icon: '💳', 
      title: 'Wallet', 
      value: '₹ 0.00',
      color: '#4A90E2' 
    },
    { 
      icon: '📊', 
      title: 'Backtest', 
      value: '50.00',
      color: '#4A90E2' 
    },
    { 
      icon: '📱', 
      title: 'Subscriptions', 
      color: '#4A90E2' 
    },
    { 
      icon: '🔑', 
      title: 'Change password', 
      color: '#4A90E2' 
    },
    { 
      icon: '🚪', 
      title: 'Logout', 
      color: '#4A90E2' 
    },
  ];

  const bottomItems = [
    {
      icon: '▶️',
      title: 'How to use?',
      color: '#FF0000'
    },
    {
      icon: '💬',
      title: 'Join Community',
      color: '#00BFFF'
    },
    {
      icon: '💚',
      title: 'Help Desk',
      color: '#25D366'
    }
  ];

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
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem}>
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
              <TouchableOpacity key={index} style={styles.menuItem}>
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
});
