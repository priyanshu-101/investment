import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

function HelloWorldScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.helloText}>
        Hello World
      </ThemedText>
    </ThemedView>
  );
}

export default function HomeScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HelloWorld" component={HelloWorldScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helloText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
