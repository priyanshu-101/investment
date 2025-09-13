import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';

export function BrokersScreen() {
  const handleAddBroker = () => {
    console.log('Add Broker pressed');
  };

  return (
    <ThemedView style={[styles.container, styles.whiteBackground]}>
      <ThemedText type="title" style={[styles.titleText, styles.blackText]}>
        Brokers
      </ThemedText>
      
      <View style={styles.contentContainer}>
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('@/assets/images/broker.png')} 
            style={styles.brokerImage}
            resizeMode="contain"
          />
        </View>
        
        <ThemedText style={styles.noBrokersText}>
          No Brokers found. Please Add brokers!
        </ThemedText>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddBroker}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <ThemedText style={styles.plusIcon}>+</ThemedText>
            <ThemedText style={styles.buttonText}>Add Broker</ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'left',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  blackText: {
    color: '#1E3A8A',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -80,
  },
  illustrationContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrapper: {
    width: 220,
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monitorFrame: {
    width: 160,
    height: 120,
    alignItems: 'center',
    position: 'relative',
  },
  screen: {
    width: 140,
    height: 90,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#9CA3AF',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  gearIcon: {
    position: 'absolute',
    top: -15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  profileCard: {
    width: '90%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileInfo: {
    flex: 1,
  },
  infoLine: {
    height: 3,
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
    marginBottom: 3,
  },
  monitorBase: {
    width: 20,
    height: 15,
    backgroundColor: '#9CA3AF',
    marginTop: -2,
    borderRadius: 2,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
  },
  brokerImage: {
    width: 200,
    height: 200,
  },
  noBrokersText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 150,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '500',
  },
});