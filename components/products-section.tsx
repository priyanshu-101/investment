import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { StrategyApiData } from '../services/strategiesApi';

type ProductCategory = {
  id: string;
  title: string;
  active: boolean;
};

type Product = {
  id: string;
  title: string;
  icon: string;
  backgroundColor: string;
  iconColor: string;
  isPlaceholder?: boolean;
};

type ProductCategoryId = ProductCategory['id'];

const productCategories: ProductCategory[] = [
  { id: 'Index Algo', title: 'Index Algo', active: true },
  { id: 'Stock Algo', title: 'Stock Algo', active: false },
  { id: 'Deploy Strategy', title: 'Deploy Strategy', active: false },
  { id: 'Commodity Algo', title: 'Commodity Algo', active: false },
  { id: 'FNO', title: 'FNO', active: false },
];

const productsByCategory: Record<ProductCategoryId, Product[]> = {
  'Deploy Strategy': [],
  'Index Algo': [
    {
      id: 'nifty',
      title: 'Nifty',
      icon: '📈',
      backgroundColor: '#e8f2ff',
      iconColor: '#4285f4',
    },
    {
      id: 'bank-nifty',
      title: 'Bank Nifty',
      icon: '🏦',
      backgroundColor: '#e8fdf5',
      iconColor: '#10b981',
    },
    {
      id: 'fin-nifty',
      title: 'Fin Nifty',
      icon: '💰',
      backgroundColor: '#fef2f2',
      iconColor: '#ef4444',
    },
    {
      id: 'sensex',
      title: 'Sensex',
      icon: '📊',
      backgroundColor: '#fdf2f8',
      iconColor: '#ec4899',
    },
    {
      id: 'bankex',
      title: 'Bankex',
      icon: '🏛️',
      backgroundColor: '#f0f9ff',
      iconColor: '#0ea5e9',
    },
    {
      id: 'midcap-nifty',
      title: 'Midcap Nifty',
      icon: '📉',
      backgroundColor: '#f0fdf4',
      iconColor: '#22c55e',
    },
  ],
  'Stock Algo': [
    {
      id: 'stock-intraday',
      title: 'Stock Intraday',
      icon: '⚡',
      backgroundColor: '#e8f2ff',
      iconColor: '#4285f4',
    },
    {
      id: 'stock-option',
      title: 'Stock Option',
      icon: '📈',
      backgroundColor: '#e8fdf5',
      iconColor: '#10b981',
    },
    {
      id: 'stock-btst',
      title: 'Stock BTST',
      icon: '🌙',
      backgroundColor: '#fef2f2',
      iconColor: '#ef4444',
    },
    {
      id: 'stock-positional',
      title: 'Stock Positional',
      icon: '📊',
      backgroundColor: '#fdf2f8',
      iconColor: '#ec4899',
    },
    {
      id: 'stock-future',
      title: 'Stock Future',
      icon: '🔮',
      backgroundColor: '#f0f9ff',
      iconColor: '#0ea5e9',
    },
    {
      id: 'stock-placeholder',
      title: '',
      icon: '',
      backgroundColor: 'transparent',
      iconColor: 'transparent',
      isPlaceholder: true,
    },
  ],
  'Commodity Algo': [
    {
      id: 'silver-mcx',
      title: 'Silver MCX Future',
      icon: '🥈',
      backgroundColor: '#f1f5f9',
      iconColor: '#64748b',
    },
    {
      id: 'crude-oil-mcx',
      title: 'Crude Oil MCX Future',
      icon: '🛢️',
      backgroundColor: '#1e1b4b',
      iconColor: '#fbbf24',
    },
    {
      id: 'gold-mcx',
      title: 'Gold MCX Options',
      icon: '🥇',
      backgroundColor: '#fef3c7',
      iconColor: '#d97706',
    },
  ],
  'FNO': [
    {
      id: 'futures',
      title: 'Futures',
      icon: '📈',
      backgroundColor: '#e8f2ff',
      iconColor: '#4285f4',
    },
    {
      id: 'options',
      title: 'Options',
      icon: '⚙️',
      backgroundColor: '#e8fdf5',
      iconColor: '#10b981',
    },
    {
      id: 'option-strategies',
      title: 'Option Strategies',
      icon: '🧠',
      backgroundColor: '#fef2f2',
      iconColor: '#ef4444',
    },
    {
      id: 'covered-call',
      title: 'Covered Call',
      icon: '🛡️',
      backgroundColor: '#fdf2f8',
      iconColor: '#ec4899',
    },
    {
      id: 'iron-condor',
      title: 'Iron Condor',
      icon: '🦅',
      backgroundColor: '#f0f9ff',
      iconColor: '#0ea5e9',
    },
    {
      id: 'butterfly',
      title: 'Butterfly',
      icon: '🦋',
      backgroundColor: '#f0fdf4',
      iconColor: '#22c55e',
    },
  ],
};

interface ProductsSectionProps {
  onNavigateToStrategies?: () => void;
}

export function ProductsSection({ onNavigateToStrategies }: ProductsSectionProps) {
  const [activeCategory, setActiveCategory] = useState('Index Algo');
  const [userStrategies, setUserStrategies] = useState<StrategyApiData[]>([]);
  const [showStrategiesModal, setShowStrategiesModal] = useState(false);
  const [selectedProductStrategies, setSelectedProductStrategies] = useState<StrategyApiData[]>([]);
  const [selectedProductTitle, setSelectedProductTitle] = useState('');
  const { user } = useAuth();

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'Deploy Strategy') {
      // Set the active tab for Strategies screen and navigate
      AsyncStorage.setItem('activeStrategiesTab', 'Deployed Strategies')
        .then(() => {
          if (onNavigateToStrategies) {
            onNavigateToStrategies();
          }
        })
        .catch(err => console.error('Error setting active tab:', err));
      return;
    }
    setActiveCategory(categoryId);
  };

  // Load user strategies from AsyncStorage
  const loadUserStrategies = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const key = `createdStrategies_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const strategies = JSON.parse(stored);
        setUserStrategies(strategies);
        console.log(`Loaded ${strategies.length} user strategies`);
      }
    } catch (error) {
      console.error('Error loading user strategies:', error);
    }
  }, [user?.id]);

  // Load strategies when component mounts or user changes
  useEffect(() => {
    loadUserStrategies();
  }, [user?.id, loadUserStrategies]);

  // Map product IDs to instrument keywords for filtering
  const getProductInstrumentKeywords = (productId: string): string[] => {
    const productInstrumentMap: Record<string, string[]> = {
      'nifty': ['NIFTY', 'NIFTY50'],
      'bank-nifty': ['BANKNIFTY', 'BANK NIFTY'],
      'fin-nifty': ['FINNIFTY', 'FIN NIFTY'],
      'sensex': ['SENSEX'],
      'bankex': ['BANKEX'],
      'midcap-nifty': ['MIDCPNIFTY', 'MIDCAP NIFTY'],
      'stock-intraday': ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK'],
      'stock-option': ['CE', 'PE'],
      'stock-btst': ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK'],
      'stock-positional': ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK'],
      'stock-future': ['FUT'],
      'silver-mcx': ['SILVER'],
      'crude-oil-mcx': ['CRUDE', 'CRUDE OIL'],
      'gold-mcx': ['GOLD'],
    };
    return productInstrumentMap[productId] || [];
  };

  // Filter strategies by product
  const getStrategiesForProduct = (productId: string): StrategyApiData[] => {
    const instrumentKeywords = getProductInstrumentKeywords(productId);
    
    return userStrategies.filter(strategy => {
      const instruments = strategy.instruments || strategy.fullStrategyData?.instruments || [];
      
      // Check if any instrument matches the product keywords
      return instruments.some((instrument: string) => 
        instrumentKeywords.some(keyword => 
          instrument.toUpperCase().includes(keyword.toUpperCase())
        )
      );
    });
  };

  const handleProductClick = (product: Product) => {
    console.log(`Product clicked: ${product.title} (${product.id})`);
    
    if (product.isPlaceholder) {
      console.log('Product is placeholder, ignoring click');
      return; 
    }
    
    if (!user?.id) {
      console.log('User not authenticated');
      Alert.alert('Authentication Required', 'Please log in to view strategies');
      return;
    }

    // Get strategies for this product
    const productStrategies = getStrategiesForProduct(product.id);
    console.log(`Found ${productStrategies.length} strategies for ${product.title}:`, productStrategies);
    
    // Set the strategies and show modal
    setSelectedProductStrategies(productStrategies);
    setSelectedProductTitle(product.title);
    setShowStrategiesModal(true);
  };

  const currentProducts = productsByCategory[activeCategory as keyof typeof productsByCategory] || [];
  const renderProductGrid = () => {
    const rows = [];
    const itemsPerRow = 3;
    
    for (let i = 0; i < currentProducts.length; i += itemsPerRow) {
      const rowItems = currentProducts.slice(i, i + itemsPerRow);
      
      rows.push(
        <View key={`row-${i}`} style={styles.productRow}>
          {rowItems.map((product, index) => (
            <TouchableOpacity 
              key={product.id} 
              style={[
                styles.productCard,
                product.isPlaceholder && styles.placeholderCard
              ]}
              onPress={() => handleProductClick(product)}
              activeOpacity={product.isPlaceholder ? 1 : 0.7}
              disabled={product.isPlaceholder}
            >
              {!product.isPlaceholder && (
                <>
                  <View style={[styles.productIcon, { backgroundColor: product.backgroundColor }]}>
                    <Text style={[styles.iconText, { color: product.iconColor }]}>
                      {product.icon}
                    </Text>
                  </View>
                  <Text style={styles.productTitle}>{product.title}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
          {rowItems.length < itemsPerRow && (
            Array.from({ length: itemsPerRow - rowItems.length }).map((_, emptyIndex) => (
              <View key={`empty-${i}-${emptyIndex}`} style={styles.productCard} />
            ))
          )}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Products</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {productCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tab,
                activeCategory === category.id && styles.activeTab
              ]}
              onPress={() => handleCategoryChange(category.id)}
            >
              <Text style={[
                styles.tabText,
                activeCategory === category.id && styles.activeTabText
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.productsGrid}>
          {currentProducts.length > 0 ? (
            renderProductGrid()
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products available for {activeCategory}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Strategies Modal */}
      <Modal
        visible={showStrategiesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStrategiesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Strategies for {selectedProductTitle}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStrategiesModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.strategiesList}>
              {selectedProductStrategies.length > 0 ? (
                selectedProductStrategies.map((strategy) => (
                  <View key={strategy.id} style={styles.strategyCard}>
                    <View style={styles.strategyHeader}>
                      <Text style={styles.strategyName}>{strategy.name}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: strategy.isActive ? '#22c55e' : '#6b7280' }
                      ]}>
                        <Text style={styles.statusText}>
                          {strategy.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.strategyDescription}>{strategy.description}</Text>
                    <View style={styles.strategyDetails}>
                      <Text style={styles.strategyDetail}>Type: {strategy.strategyType || strategy.category}</Text>
                      <Text style={styles.strategyDetail}>
                        Instruments: {(strategy.instruments || []).join(', ')}
                      </Text>
                      <Text style={styles.strategyDetail}>
                        Created: {new Date(strategy.createdAt || '').toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStrategies}>
                  <Text style={styles.emptyStrategiesText}>
                    No strategies found for {selectedProductTitle}
                  </Text>
                  <Text style={styles.emptyStrategiesSubtext}>
                    Create a strategy with {selectedProductTitle} instruments to see it here.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingRight: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  productsGrid: {
    minHeight: 200,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  productCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    marginHorizontal: 4,
    minHeight: 100,
  },
  placeholderCard: {
    backgroundColor: 'transparent',
  },
  productIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  iconText: {
    fontSize: 24,
  },
  productTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  productCount: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 8,
  },
  productCountText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  strategiesList: {
    maxHeight: 400,
    padding: 16,
  },
  strategyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  strategyDetails: {
    gap: 4,
  },
  strategyDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyStrategies: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStrategiesText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStrategiesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});