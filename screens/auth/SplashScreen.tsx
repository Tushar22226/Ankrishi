import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, Platform } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import QuotesService, { FarmerQuote } from '../../services/QuotesService';

// Remove navigation dependency - we'll handle this in AppNavigator
const SplashScreen = () => {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const quoteAnim = React.useRef(new Animated.Value(0)).current;

  // Get a random quote
  const [quote, setQuote] = useState<FarmerQuote>(QuotesService.getRandomQuote());

  useEffect(() => {
    // Start animations - disable useNativeDriver on web platform
    const useNativeDriver = Platform.OS !== 'web';
    console.log(`Animation using native driver: ${useNativeDriver}`);

    // Animate logo first
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: useNativeDriver,
        easing: Easing.ease,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: useNativeDriver,
        easing: Easing.elastic(1),
      }),
    ]).start();

    // Then animate quote with a delay
    setTimeout(() => {
      Animated.timing(quoteAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNativeDriver,
        easing: Easing.ease,
      }).start();
    }, 1200);

    // No navigation logic here - we'll handle this in AppNavigator
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Replace with your app logo */}
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>ankrishi</Text>
        <Text style={styles.subtitle}>Connecting Farmers to Prosperity</Text>
      </Animated.View>

      {/* Farmer quote */}
      <Animated.View
        style={[
          styles.quoteContainer,
          {
            opacity: quoteAnim,
            transform: [{ translateY: quoteAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}]
          }
        ]}
      >
        <Text style={styles.quoteText}>{quote.text}</Text>
        {quote.author && (
          <Text style={styles.quoteAuthor}>- {quote.author}</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.black,
    opacity: 0.8,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: spacing.md,
    padding: spacing.md,
    maxWidth: 300,
    marginTop: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  quoteText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.black,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.black,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});

export default SplashScreen;
