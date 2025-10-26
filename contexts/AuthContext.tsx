import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasSeenRiskDisclosure: boolean;
  acceptRiskDisclosure: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenRiskDisclosure, setHasSeenRiskDisclosure] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('Checking auth state...');
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const parsedUser = JSON.parse(currentUser);
        console.log('Found stored user:', parsedUser.email);
        setUser(parsedUser);
      } else {
        console.log('No stored user found');
        setUser(null);
      }

      const riskDisclosureSeen = await AsyncStorage.getItem('riskDisclosureSeen');
      setHasSeenRiskDisclosure(!!riskDisclosureSeen);
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      console.log('Auth check complete, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt for:', email);
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      const foundUser = users.find((u: User) => u.email === email && u.password === password);
      
      if (foundUser) {
        console.log('Login successful, setting user:', foundUser.email);
        await AsyncStorage.setItem('currentUser', JSON.stringify(foundUser));
        setUser(foundUser);
        setHasSeenRiskDisclosure(false);
        await AsyncStorage.removeItem('riskDisclosureSeen');
        return true;
      } else {
        console.log('Login failed - user not found or invalid credentials');
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      const userExists = users.find((u: User) => u.email === email);
      if (userExists) {
        return false;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        password,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
      
      const userIndex = users.findIndex((u: User) => u.email === email);
      if (userIndex === -1) {
        return false;
      }

      const updatedUser = {
        ...users[userIndex],
        password: newPassword,
      };

      users[userIndex] = updatedUser;
      await AsyncStorage.setItem('users', JSON.stringify(users));

      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const parsedCurrentUser: User = JSON.parse(currentUser);
        if (parsedCurrentUser.email === email) {
          await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }

      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('riskDisclosureSeen');
      setUser(null);
      setHasSeenRiskDisclosure(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const acceptRiskDisclosure = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem('riskDisclosureSeen', 'true');
      setHasSeenRiskDisclosure(true);
    } catch (error) {
      console.error('Error accepting risk disclosure:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    resetPassword,
    logout,
    isAuthenticated: !!user,
    hasSeenRiskDisclosure,
    acceptRiskDisclosure,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};