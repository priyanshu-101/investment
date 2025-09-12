import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function Header() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.nameButton}>
        <Text style={styles.nameText}>Investment</Text>
      </TouchableOpacity>

      <View style={styles.centerControls}>
        <TouchableOpacity style={styles.goButton}>
          <Text style={styles.goText}>GO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.bellIcon}>
            <View style={styles.bellBody} />
            <View style={styles.bellHandle} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.chartIcon}>
            <View style={[styles.chartBar, { height: 8 }]} />
            <View style={[styles.chartBar, { height: 12 }]} />
            <View style={[styles.chartBar, { height: 6 }]} />
            <View style={[styles.chartBar, { height: 10 }]} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.profileButton}>
        <Text style={styles.profileText}>P</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nameButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nameText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  goButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bellIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBody: {
    width: 16,
    height: 14,
    backgroundColor: '#666',
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  bellHandle: {
    width: 4,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    position: 'absolute',
    top: -2,
  },
  chartIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  chartBar: {
    width: 3,
    backgroundColor: '#666',
    borderRadius: 1,
  },
  profileButton: {
    width: 36,
    height: 36,
    backgroundColor: '#1E5A96',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
