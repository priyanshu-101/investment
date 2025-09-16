// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHJ3poPEsKgA6w2Fpc_fHaED5KvWRb-ds",
  authDomain: "investment-7b452.firebaseapp.com",
  projectId: "investment-7b452",
  storageBucket: "investment-7b452.firebasestorage.app",
  messagingSenderId: "315649007268",
  appId: "1:315649007268:web:d30244bc7a8cb1bb081031",
  measurementId: "G-F143C6QQMM"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
const auth: Auth = getAuth(app);

// Initialize Analytics (only on web, not supported in React Native)
let analytics;
if (Platform.OS === 'web') {
  try {
    analytics = getAnalytics(app);
  } catch (error: any) {
    console.log('Analytics not supported in this environment:', error.message);
  }
}

export { analytics, auth };

