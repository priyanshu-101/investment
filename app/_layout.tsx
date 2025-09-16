import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E5A96" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack 
        initialRouteName={user ? "index" : "auth"} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="auth" />
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
