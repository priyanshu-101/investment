import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const ChartScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chart Screen</Text>
      <Text style={styles.subtitle}>This is a placeholder chart screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});