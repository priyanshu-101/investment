import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Header } from '../header';

export function StrategiesScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState('My Strategies');

  const tabs = [
    'Create Strategy',
    'My Strategies',
    'Deployed Strategies',
    'Strategy Template',
    'My Portfolio',

  ];

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: offset, animated: true });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Header />
      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => scrollBy(0)} style={styles.arrowButton}>
          <ThemedText style={styles.arrowText}>◀</ThemedText>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsWrapper}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            >
              <ThemedText
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => scrollBy(200)} style={styles.arrowButton}>
          <ThemedText style={styles.arrowText}>▶</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedView style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Strategies"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sortButton}>
          <ThemedText style={styles.sortText}>Sort By Date</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.emptyState}>
        <Image
          source={require('@/assets/images/strategy.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.emptyText}>No Strategy Created</ThemedText>
        <TouchableOpacity style={styles.createButton}>
          <ThemedText style={styles.createButtonText}>+ Create Strategy</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  arrowButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#444',
  },
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    marginHorizontal: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  activeTab: {
    backgroundColor: '#e9edff',
  },
  tabText: {
    fontSize: 14,
    color: '#444',
  },
  activeTabText: {
    color: '#2d4cff',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 14,
    color: '#222',
  },
  sortButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sortText: { fontSize: 14, color: '#222' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyImage: { width: 180, height: 180, marginBottom: 20 },
  emptyText: { fontSize: 14, color: '#666', marginBottom: 20 },
  createButton: {
    borderWidth: 1,
    borderColor: '#4a4aff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  createButtonText: { fontSize: 14, color: '#4a4aff', fontWeight: '500' },
});
