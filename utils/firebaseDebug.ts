// Firebase initialization checker for debugging
import { auth } from '../firebaseConfig';

export const checkFirebaseInit = () => {
  console.log('=== Firebase Configuration Check ===');
  console.log('Auth instance:', auth);
  console.log('Auth app:', auth.app);
  console.log('Auth app name:', auth.app.name);
  console.log('Auth app options:', auth.app.options);
  console.log('Current user:', auth.currentUser);
  console.log('=== End Firebase Check ===');
};

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // This will trigger Firebase to check if it can connect
    const user = auth.currentUser;
    console.log('Current user state:', user);
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};