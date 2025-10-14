import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { AuthProvider } from '../contexts/AuthContext';
import { KiteConnectProvider } from '../contexts/KiteConnectContext';

function AppLayout() {
  return (
    <KiteConnectProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="index" />
          <Stack.Screen name="chart-screen" />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </KiteConnectProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
