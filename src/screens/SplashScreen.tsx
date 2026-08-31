import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background wave shapes */}
      <View style={styles.waveLarge} />
      <View style={styles.waveMedium} />

      {/* Floating health icons */}
      <Text style={[styles.floatIcon, { top: height * 0.1, left: width * 0.08 }]}>👟</Text>
      <Text style={[styles.floatIcon, { top: height * 0.08, right: width * 0.1 }]}>💧</Text>
      <Text style={[styles.floatIcon, { top: height * 0.22, left: width * 0.06 }]}>❤️</Text>
      <Text style={[styles.floatIcon, { top: height * 0.28, right: width * 0.08 }]}>😴</Text>
      <Text style={[styles.floatIcon, { top: height * 0.55, left: width * 0.1 }]}>🍎</Text>
      <Text style={[styles.floatIcon, { top: height * 0.58, right: width * 0.08 }]}>📊</Text>

      {/* Center content */}
      <Animated.View style={[styles.center, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.forkIcon}>🍴</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.appName}>
          <Text style={styles.appNameDark}>Team</Text>
          <Text style={styles.appNameOrange}>Cal</Text>
        </Text>
        <Text style={styles.tagline}>Healthier, day by day.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLarge: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: width + 80,
    height: height * 0.28,
    borderRadius: (width + 80) / 2,
    backgroundColor: 'rgba(255, 106, 43, 0.18)',
  },
  waveMedium: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: width + 120,
    height: height * 0.22,
    borderRadius: (width + 120) / 2,
    backgroundColor: 'rgba(255, 106, 43, 0.28)',
  },
  floatIcon: {
    position: 'absolute',
    fontSize: 22,
    opacity: 0.35,
  },
  center: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FF6A2B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  forkIcon: {
    fontSize: 44,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appNameDark: {
    color: '#182241',
  },
  appNameOrange: {
    color: '#FF6A2B',
  },
  tagline: {
    fontSize: 15,
    color: '#8B8D97',
    marginTop: 6,
    fontWeight: '400',
  },
});
