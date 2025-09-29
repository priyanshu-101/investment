import React, { createContext, ReactNode, useContext } from 'react';
import { useKiteConnect } from '../hooks/useKiteConnect';
import { KiteHolding, KiteOrder, KitePosition, KiteUser } from '../services/kiteConnect';

interface KiteConnectContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: KiteUser | null;
  positions: { net: KitePosition[]; day: KitePosition[] } | null;
  holdings: KiteHolding[] | null;
  orders: KiteOrder[] | null;
  error: string | null;
  login: () => void;
  logout: () => void;
  refreshData: () => void;
  clearError: () => void;
}

const KiteConnectContext = createContext<KiteConnectContextType | undefined>(undefined);

interface KiteConnectProviderProps {
  children: ReactNode;
}

export const KiteConnectProvider: React.FC<KiteConnectProviderProps> = ({ children }) => {
  const kiteData = useKiteConnect();

  return (
    <KiteConnectContext.Provider value={kiteData}>
      {children}
    </KiteConnectContext.Provider>
  );
};

export const useKiteConnectContext = (): KiteConnectContextType => {
  const context = useContext(KiteConnectContext);
  if (!context) {
    throw new Error('useKiteConnectContext must be used within a KiteConnectProvider');
  }
  return context;
};

export default KiteConnectContext;