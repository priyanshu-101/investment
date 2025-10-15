import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';


export default function AuthScreen() {
  const { login, register, resetPassword, isAuthenticated, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => {
    console.log('Auth screen - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
    if (!authLoading && isAuthenticated) {
      console.log('Auth screen - redirecting to main app');
      router.replace('/');
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to main app
  }

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
    if (!email) {
      return Alert.alert('Error', 'Please enter your email address');
    }

    if (!password || password.length < 6) {
      return Alert.alert('Error', 'Please enter a new password with at least 6 characters.');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Error', 'New password and confirm password do not match.');
    }

    setLoading(true);
    try {
      const success = await resetPassword(email, password);

      if (success) {
        Alert.alert(
          'Password Updated',
          'Your password has been reset successfully. Please use your new password to log in.'
        );
        setPassword('');
        setConfirmPassword('');
        setMode('login');
      } else {
        Alert.alert('Error', 'No account found with this email address.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'An error occurred during password recovery. Please try again.');
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
        <View style={styles.formContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.brand}>Investment Tracker</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Create a new account' : 'Reset your password'}
            </Text>
          </View>
          {info ? <Text style={styles.successText}>{info}</Text> : null}
          {loading && <ActivityIndicator size="large" color="#4A90E2" style={{ marginBottom: 16 }} />}
          {mode === 'login' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  placeholder="Enter your email" 
                  value={email} 
                  onChangeText={setEmail} 
                  style={styles.input} 
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput 
                  placeholder="Enter your password" 
                  value={password} 
                  onChangeText={setPassword} 
                  style={styles.input} 
                  secureTextEntry 
                  textContentType="password"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.buttonContainer}>
                <View style={styles.primaryButton}>
                  <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} color="#4A90E2" />
                </View>
              </View>
              <View style={styles.linkContainer}>
                <Text style={styles.linkText} onPress={()=>setMode('forgot')}>Forgot Password?</Text>
              </View>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.secondaryButton}>
                <Button title="Create New Account" onPress={()=>setMode('register')} color="#64748b" />
              </View>
            </>
          )}
          {mode === 'register' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  placeholder="Enter your email" 
                  value={email} 
                  onChangeText={setEmail} 
                  style={styles.input} 
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput 
                  placeholder="Create a password (min 6 characters)" 
                  value={password} 
                  onChangeText={setPassword} 
                  style={styles.input} 
                  secureTextEntry 
                  textContentType="newPassword"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput 
                  placeholder="Re-enter your password" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  style={styles.input} 
                  secureTextEntry 
                  textContentType="newPassword"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.buttonContainer}>
                <View style={styles.primaryButton}>
                  <Button title={loading ? "Creating Account..." : "Register"} onPress={handleRegister} disabled={loading} color="#4A90E2" />
                </View>
              </View>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.secondaryButton}>
                <Button title="Back to Login" onPress={()=>setMode('login')} color="#64748b" />
              </View>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  placeholder="Enter your registered email" 
                  value={email} 
                  onChangeText={setEmail} 
                  style={styles.input} 
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  placeholder="Enter a new password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry
                  textContentType="newPassword"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry
                  textContentType="newPassword"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.buttonContainer}>
                <View style={styles.primaryButton}>
                  <Button title={loading ? "Updating..." : "Recover Password"} onPress={handleForgotPassword} color="#4A90E2" disabled={loading} />
                </View>
              </View>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.secondaryButton}>
                <Button title="Back to Login" onPress={()=>setMode('login')} color="#64748b" />
              </View>
            </>
          )}
        </View>
        <Text style={styles.footerNote}>By continuing, you agree to our Terms & Privacy Policy</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    backgroundColor: '#4A90E2',
    borderRadius: 999,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  headerSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  successText: {
    color: '#10b981',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  linkContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  footerNote: {
    position: 'absolute',
    bottom: 18,
    left: 24,
    right: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});