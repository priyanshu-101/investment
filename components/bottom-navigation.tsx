import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type TabType = 'Home' | 'Brokers' | 'Strategies' | 'Backtest' | 'Reports';

interface BottomNavigationProps {
  activeTab?: TabType;
  onTabPress?: (tab: TabType) => void;
}

export function BottomNavigation({ activeTab = 'Home', onTabPress }: BottomNavigationProps) {
  const [currentTab, setCurrentTab] = useState<TabType>(activeTab);

  const handleTabPress = (tab: TabType) => {
    setCurrentTab(tab);
    onTabPress?.(tab);
  };

  const tabs = [
    { 
      name: 'Home' as TabType, 
      icon: 'house.fill' as const,
      activeColor: '#007AFF',
      inactiveColor: '#8E8E93'
    },
    { 
      name: 'Brokers' as TabType, 
      icon: 'building.2.fill' as const,
      activeColor: '#007AFF',
      inactiveColor: '#8E8E93'
    },
    { 
      name: 'Strategies' as TabType, 
      icon: 'chart.bar.fill' as const,
      activeColor: '#007AFF',
      inactiveColor: '#8E8E93'
    },
    { 
      name: 'Backtest' as TabType, 
      icon: 'clock.fill' as const,
      activeColor: '#007AFF',
      inactiveColor: '#8E8E93'
    },
    { 
      name: 'Reports' as TabType, 
      icon: 'doc.text.fill' as const,
      activeColor: '#007AFF',
      inactiveColor: '#8E8E93'
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.name)}
          >
            <IconSymbol
              name={tab.icon}
              size={24}
              color={isActive ? tab.activeColor : tab.inactiveColor}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: isActive ? tab.activeColor : tab.inactiveColor }
              ]}
            >
              {tab.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
