import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header } from '../header';

export function HomeScreen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    const createFloatingAnimation = (animValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloatingAnimation(floatAnim1, 0);
    createFloatingAnimation(floatAnim2, 300);
    createFloatingAnimation(floatAnim3, 600);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4A90E2" barStyle="light-content" />
      
      <Header />
      
      {/* Important Notice */}
      <View style={styles.noticeContainer}>
        <Text style={styles.noticeText}>
          Dear users, due to some technical issue from meta,{'\n'}
          whatsapp support is not available for today. Please{'\n'}
          share your queries on different number +91-{'\n'}
          7669284138 (Whatsapp chat only).
        </Text>
      </View>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        <View style={styles.illustrationContainer}>
          <View style={styles.handsContainer}>
            <View style={styles.leftHand}>
              <View style={styles.hand} />
              <View style={styles.leftThumb} />
            </View>
            
            <View style={styles.papersContainer}>
              <Animated.View 
                style={[
                  styles.paper, 
                  styles.redPaper,
                  {
                    transform: [
                      { rotate: '-12deg' },
                      { 
                        translateY: floatAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10],
                        })
                      }
                    ]
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.paper, 
                  styles.whitePaper,
                  {
                    transform: [
                      { rotate: '2deg' },
                      { 
                        translateY: floatAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8],
                        })
                      }
                    ]
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.paper, 
                  styles.orangePaper,
                  {
                    transform: [
                      { rotate: '18deg' },
                      { 
                        translateY: floatAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -12],
                        })
                      }
                    ]
                  }
                ]} 
              />
            </View>
            
            <View style={styles.rightHand}>
              <View style={styles.hand} />
              <View style={styles.rightThumb} />
            </View>
          </View>
        </View>

        <Animated.Text 
          style={[
            styles.title,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }
              ]
            }
          ]}
        >
          Add new Broker
        </Animated.Text>
        
        <Animated.Text 
          style={[
            styles.subtitle,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }
              ]
            }
          ]}
        >
          No brokers added at the moment
        </Animated.Text>

        <Animated.View 
          style={{
            transform: [{ scale: pulseAnim }]
          }}
        >
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Broker</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f71',
  },
  noticeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeText: {
    color: '#FF9500',
    fontSize: 14,
    lineHeight: 20,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#1a1f71',
    paddingHorizontal: 32, 
    paddingTop: 40, 
    alignItems: 'center',
  },
  greeting: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 50,
  },
  illustrationContainer: {
    marginBottom: 60,
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
  },
  handsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 200,
    height: 140,
  },
  leftHand: {
    position: 'absolute',
    left: 10,
    bottom: 0,
    zIndex: 2,
  },
  rightHand: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    zIndex: 2,
  },
  hand: {
    width: 50,
    height: 70,
    backgroundColor: '#F4C2A1', 
    borderRadius: 25,
    position: 'relative',
  },
  leftThumb: {
    width: 18,
    height: 25,
    backgroundColor: '#F4C2A1',
    borderRadius: 12,
    position: 'absolute',
    top: 12,
    right: -8,
  },
  rightThumb: {
    width: 18,
    height: 25,
    backgroundColor: '#F4C2A1',
    borderRadius: 12,
    position: 'absolute',
    top: 12,
    left: -8,
  },
  papersContainer: {
    position: 'absolute',
    top: 10,
    left: 60,
    right: 60,
    zIndex: 1,
  },
  paper: {
    width: 45,
    height: 65,
    borderRadius: 6,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  redPaper: {
    backgroundColor: '#FF6B6B',
    transform: [{ rotate: '-12deg' }],
    left: -8,
    top: 0,
    zIndex: 3,
  },
  whitePaper: {
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '2deg' }],
    left: 12,
    top: 8,
    zIndex: 2,
  },
  orangePaper: {
    backgroundColor: '#FF8E53',
    transform: [{ rotate: '18deg' }],
    left: 32,
    top: 2,
    zIndex: 1,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    marginBottom: 60,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#E8F4FF', 
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#4A90E2', 
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});