import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth'; // Firebase import zaroori hai

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  // --- Animation Controllers (Memory) ---
  const logoScale = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo Pop-in Pop-out (Dhadakne ki animation)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.08, // Thora sa bara hoga
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(logoScale, {
          toValue: 1, // Wapis normal size
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // 2. Circle Ripple Animation (Peeche se nikal kar phelna)
    Animated.loop(
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 2.5, // Phel kar kitna bara ho
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0, // Phelte hue ahista ahista ghayab ho jaye
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ])
    ).start();

    // 3. Loading Line (Left se Right jane ki animation)
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  // YAHAN LOGIC CHANGE KI GAYI HAI: Authentication Check
  useEffect(() => {
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      // Firebase se check karein ke kya user logged in hai?
      const currentUser = auth().currentUser;

      if (currentUser) {
        // Agar user logged in hai to seedha Dashboard bhejen
        navigation.replace('Dashboard');
      } else {
        // Agar user logged in nahi hai to Welcome (Login) screen par bhejen
        navigation.replace('Welcome');
      }
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigation]);

  // Loading line ki movement set karna
  const loadingTranslateX = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150], // Left se right jane ka fasla
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />

      {/* Main Content Area */}
      <View style={styles.centerContent}>
        
        {/* Animated Ripple Circle (Peeche wala) */}
        <Animated.View
          style={[
            styles.rippleCircle,
            {
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
            },
          ]}
        />

        {/* Animated Logo */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          {/* NOTE: Apna asli logo yahan laga len */}
          <Image
            source={require('../assets/logo.png')} // Apna image path theek kar len
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Area */}
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>CardioGuard</Text>
          <Text style={styles.subTitle}>PRECISION CARDIAC INTELLIGENCE</Text>
        </View>
      </View>

      {/* Bottom Loading Area */}
      <View style={styles.bottomContainer}>
        {/* Loading Bar Track */}
        <View style={styles.loadingTrack}>
          {/* Moving Line */}
          <Animated.View
            style={[
              styles.movingLine,
              { transform: [{ translateX: loadingTranslateX }] },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Syncing clinical data streams...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14', // Exact dark theme color
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  rippleCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1.5,
    borderColor: '#1E293B', // Circle ka color
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 150, // Image ka size apni marzi se set kar len
    height: 150,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#A5B4FC', // Light blueish color tasveer jesa
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 3.5, // Lafzon ke darmiyan space
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingTrack: {
    width: 200,
    height: 2,
    backgroundColor: '#1F2937', // Track ka background
    overflow: 'hidden',
    borderRadius: 1,
    marginBottom: 16,
  },
  movingLine: {
    width: 80,
    height: '100%',
    backgroundColor: '#818CF8', // Ghoomne wali line ka color
    borderRadius: 1,
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});