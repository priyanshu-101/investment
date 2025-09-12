import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet } from 'react-native';

export function BrokersScreen() {
  return (
    <ThemedView style={[styles.container, styles.whiteBackground]}>
      <ThemedText type="title" style={[styles.titleText, styles.blackText]}>
        Brokers
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  blackText: {
    color: '#000000',
  },
});
