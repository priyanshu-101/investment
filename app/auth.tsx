
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';


export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }
    
    setLoading(true);
    try {
      console.log('Attempting to register with:', email);
      
      const success = await register(email, password);
      if (success) {
        console.log('Registration successful');
        setInfo('Registration successful! You are now logged in.');
        router.replace('/');
      } else {
        Alert.alert('Registration Failed', 'This email is already registered. Please try logging in instead.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'An error occurred during registration.');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    setInfo('');
    
    try {
      console.log('Attempting to login with:', email);
      
      const success = await login(email, password);
      if (success) {
        console.log('Login successful');
        setInfo('Logged in successfully!');
        setTimeout(() => {
          router.replace('/');
        }, 500);
      } else {
        Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials or register first.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'An error occurred during login.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address');
    setLoading(true);
    try {
      // Get stored users
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      // Find user with matching email
      const user = users.find((user: any) => user.email === email);
      
      if (user) {
        Alert.alert('Password Recovery', `Password recovery instructions have been sent to ${email}. Please check your email.`);
        setMode('login');
      } else {
        Alert.alert('Error', 'No account found with this email address.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'An error occurred during password recovery.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#102A43", "#1E5A96"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerDecor}>
          <View style={[styles.bubble, { width: 140, height: 140, opacity: 0.12, right: -30, top: -20 }]} />
          <View style={[styles.bubble, { width: 90, height: 90, opacity: 0.15, left: -20, top: 20 }]} />
        </View>
        <View>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.brand}>Investment</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          {info ? <Text style={{ color: 'green', marginBottom: 8 }}>{info}</Text> : null}
          {loading && <ActivityIndicator size="small" color="#1E5A96" style={{ marginBottom: 12 }} />}
          {mode === 'login' && (
            <>
              <TextInput 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                style={inputStyle} 
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <TextInput 
                placeholder="Password" 
                value={password} 
                onChangeText={setPassword} 
                style={inputStyle} 
                secureTextEntry 
                textContentType="password"
              />
              <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
              <Button title="Register" onPress={()=>setMode('register')} />
              <Button title="Forgot Password?" onPress={()=>setMode('forgot')} />
            </>
          )}
          {mode === 'register' && (
            <>
              <TextInput 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                style={inputStyle} 
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <TextInput 
                placeholder="Password" 
                value={password} 
                onChangeText={setPassword} 
                style={inputStyle} 
                secureTextEntry 
                textContentType="newPassword"
              />
              <TextInput 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                style={inputStyle} 
                secureTextEntry 
                textContentType="newPassword"
              />
              <Button title={loading ? "Registering..." : "Register"} onPress={handleRegister} disabled={loading} />
              <Button title="Back to Login" onPress={()=>setMode('login')} />
            </>
          )}
          {mode === 'forgot' && (
            <>
              <TextInput 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                style={inputStyle} 
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Button title="Recover Password" onPress={handleForgotPassword} />
              <Button title="Back to Login" onPress={()=>setMode('login')} />
            </>
          )}
        </View>
        <Text style={styles.footerNote}>By continuing, you agree to our Terms & Privacy Policy</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}



const inputStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
  fontSize: 16,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#102A43',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
  // card, brandBadge, brandBadgeText removed
  title: {
    fontSize: 14,
    color: '#6c757d',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E5A96',
    marginTop: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6c757d',
    marginBottom: 24,
  },
  disclaimer: {
    marginTop: 12,
    color: '#9aa5b1',
    fontSize: 12,
  },
  footerNote: {
    position: 'absolute',
    bottom: 18,
    left: 24,
    right: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
});