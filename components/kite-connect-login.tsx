import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useKiteConnectContext } from '../contexts/KiteConnectContext';

interface KiteConnectLoginProps {
  onSuccess?: () => void;
  style?: any;
}

export const KiteConnectLogin: React.FC<KiteConnectLoginProps> = ({ onSuccess, style }) => {
  const { isAuthenticated, isLoading, user, login, logout, error } = useKiteConnectContext();

  React.useEffect(() => {
    if (isAuthenticated && onSuccess) {
      onSuccess();
    }
  }, [isAuthenticated, onSuccess]);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#387ed1" />
        <Text style={styles.loadingText}>Connecting to Kite...</Text>
      </View>
    );
  }

  if (isAuthenticated && user) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Welcome, {user.user_name}!</Text>
          <Text style={styles.userDetails}>ID: {user.user_id}</Text>
          <Text style={styles.userDetails}>Broker: {user.broker}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect to Kite</Text>
        <Text style={styles.subtitle}>
          Login with your Zerodha Kite account to access live market data and trading features
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.loginButton} onPress={login}>
        <Text style={styles.buttonText}>Login with Kite</Text>
      </TouchableOpacity>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          • This app uses Kite Connect API{'\n'}
          • Your credentials are secure{'\n'}
          • Real-time market data access{'\n'}
          • Paper trading available
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#387ed1',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#387ed1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#387ed1',
    fontSize: 16,
  },
  disclaimer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(56, 126, 209, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#387ed1',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#387ed1',
    lineHeight: 18,
  },
});

export default KiteConnectLogin;