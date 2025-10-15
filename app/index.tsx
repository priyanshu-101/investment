import { BottomNavigation } from '@/components/bottom-navigation';
import {
    BacktestScreen,
    BrokersScreen,
    HomeScreen,
    ReportsScreen,
    StrategiesScreen
} from '@/components/screens';
import ProfileScreen from '@/components/screens/profile-screen';
import WalletScreen from '@/components/screens/wallet-screen';
import { ThemedView } from '@/components/themed-view';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();

function MainScreen() {
  const [activeTab, setActiveTab] = React.useState<'Home' | 'Brokers' | 'Strategies' | 'Backtest' | 'Reports'>('Home');

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Brokers':
        return <BrokersScreen />;
      case 'Strategies':
        return <StrategiesScreen />;
      case 'Backtest':
        return <BacktestScreen />;
      case 'Reports':
        return <ReportsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <ThemedView style={[styles.mainContainer, styles.whiteBackground]}>
      {renderContent()}
      <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} />
    </ThemedView>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!loading && !isAuthenticated) {
      console.log('Redirecting to auth - loading:', loading, 'isAuthenticated:', isAuthenticated);
      router.replace('/auth');
    }
  }, [isAuthenticated, loading]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  // If not authenticated and loading is complete, let the redirect happen
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 16, color: '#666' }}>Redirecting to login...</Text>
      </View>
    );
  }

  // User is authenticated, show main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Backtest" component={BacktestScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
  },
});
