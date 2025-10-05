import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  'Deploy Strategy': [
    {
      id: 'custom-strategy',
      title: 'Custom Strategy',
      icon: '🎯',
      backgroundColor: '#e8f2ff',
      iconColor: '#4285f4',
    },
    {
      id: 'backtest-strategy',
      title: 'Backtest Strategy',
      icon: '📊',
      backgroundColor: '#e8fdf5',
      iconColor: '#10b981',
    },
    {
      id: 'live-strategy',
      title: 'Live Strategy',
      icon: '🔴',
      backgroundColor: '#fef2f2',
      iconColor: '#ef4444',
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

export function ProductsSection() {
  const [activeCategory, setActiveCategory] = useState('Index Algo');

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleProductClick = (product: Product) => {
    if (product.isPlaceholder) return; 
    console.log(`Clicked on ${product.title} in ${activeCategory} category`);
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
});