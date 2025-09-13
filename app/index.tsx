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
import React from 'react';
import { StyleSheet } from 'react-native';

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
