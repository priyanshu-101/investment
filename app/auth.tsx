import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();

  const onGooglePress = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}> 
      <LinearGradient
        colors={["#102A43", "#1E5A96"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative header */}
        <View style={styles.headerDecor}>
          <View style={[styles.bubble, { width: 140, height: 140, opacity: 0.12, right: -30, top: -20 }]} />
          <View style={[styles.bubble, { width: 90, height: 90, opacity: 0.15, left: -20, top: 20 }]} />
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>I</Text>
          </View>

          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.brand}>Investment</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TouchableOpacity style={styles.googleButton} onPress={onGooglePress} activeOpacity={0.9}>
            <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerNote}>By continuing, you agree to our Terms & Privacy Policy</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

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
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E5A96',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
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