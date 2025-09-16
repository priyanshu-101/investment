
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../firebaseConfig';


export default function AuthScreen() {
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
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful:', userCredential.user.uid);
      
      setInfo('Registration successful! You are now logged in.');
      router.replace('/');
    } catch (e: any) {
      console.error('Registration error:', e);
      
      let errorMessage = 'Registration failed';
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please try logging in instead.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (e.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase Authentication is not properly configured. Please check your Firebase project settings and ensure Authentication is enabled.';
      } else if (e.code === 'auth/api-key-not-valid') {
        errorMessage = 'Invalid API key. Please check your Firebase configuration.';
      } else {
        errorMessage = e.message || 'An unknown error occurred during registration.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      console.log('Attempting to login with:', email);
      console.log('Auth object:', auth);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.uid);
      
      setInfo('Logged in successfully!');
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    } catch (e) {
      console.error('Login error:', e);
      const errorMessage = (e as any).code || (e as Error).message;
      Alert.alert('Login failed', errorMessage);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Password reset email sent. Please check your inbox.');
      setMode('login');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
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
              <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={inputStyle} autoCapitalize="none" />
              <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={inputStyle} secureTextEntry />
              <Button title="Login" onPress={handleLogin} />
              <Button title="Register" onPress={()=>setMode('register')} />
              <Button title="Forgot Password?" onPress={()=>setMode('forgot')} />
            </>
          )}
          {mode === 'register' && (
            <>
              <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={inputStyle} autoCapitalize="none" />
              <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={inputStyle} secureTextEntry />
              <TextInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} style={inputStyle} secureTextEntry />
              <Button title="Register" onPress={handleRegister} />
              <Button title="Back to Login" onPress={()=>setMode('login')} />
            </>
          )}
          {mode === 'forgot' && (
            <>
              <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={inputStyle} autoCapitalize="none" />
              <Button title="Send Password Reset Email" onPress={handleForgotPassword} />
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