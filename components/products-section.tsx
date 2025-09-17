import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const productCategories = [
  { id: 'popular', title: 'Popular', active: true },
  { id: 'stock', title: 'Stock', active: false },
  { id: 'fno', title: 'FNO', active: false },
  { id: 'algo', title: 'Algo', active: false },
  { id: 'integration', title: 'Integration', active: false },
];

const products = [
  {
    id: 'stock-baskets',
    title: 'Stock Baskets',
    icon: '🛒',
    backgroundColor: '#e8f2ff',
    iconColor: '#4285f4',
  },
  {
    id: 'ipo',
    title: 'IPO',
    icon: '📢',
    backgroundColor: '#e8fdf5',
    iconColor: '#10b981',
  },
  {
    id: 'option-pair',
    title: 'Option Pair',
    icon: '📈',
    backgroundColor: '#fef2f2',
    iconColor: '#ef4444',
  },
  {
    id: 'scalper-algo',
    title: 'Scalper Algo',
    icon: '🎯',
    backgroundColor: '#fdf2f8',
    iconColor: '#ec4899',
  },
  {
    id: 'option-chain',
    title: 'Option Chain',
    icon: '📊',
    backgroundColor: '#f0f9ff',
    iconColor: '#0ea5e9',
  },
  {
    id: 'one-click-algo',
    title: 'One Click Algo',
    icon: '⚡',
    backgroundColor: '#f0fdf4',
    iconColor: '#22c55e',
  },
];

export function ProductsSection() {
  const [activeCategory, setActiveCategory] = useState('popular');

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Products</Text>
        
        {/* Category Tabs */}
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
              onPress={() => setActiveCategory(category.id)}
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

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <View style={[styles.productIcon, { backgroundColor: product.backgroundColor }]}>
                <Text style={[styles.iconText, { color: product.iconColor }]}>
                  {product.icon}
                </Text>
              </View>
              <Text style={styles.productTitle}>{product.title}</Text>
            </TouchableOpacity>
          ))}
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
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: 'white',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  productIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 24,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
});