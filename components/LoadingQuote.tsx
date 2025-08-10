import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../theme';
import QuotesService, { FarmerQuote, QuoteCategory } from '../services/QuotesService';

// Map our component types to QuoteService categories
type QuoteType = 'finance' | 'marketplace' | 'weather' | 'general';
const categoryMap: Record<QuoteType, QuoteCategory> = {
  finance: 'wisdom',
  marketplace: 'hardwork',
  weather: 'motivation',
  general: 'respect'
};

interface LoadingQuoteProps {
  loadingText?: string;
  showIndicator?: boolean;
  indicatorSize?: 'small' | 'large';
  indicatorColor?: string;
  style?: object;
  type?: QuoteType;
}

/**
 * A reusable loading component that displays a motivational quote for farmers
 * along with a loading indicator and custom loading text.
 */
const LoadingQuote: React.FC<LoadingQuoteProps> = ({
  loadingText = 'Loading...',
  showIndicator = true,
  indicatorSize = 'large',
  indicatorColor = colors.primary,
  style,
  type = 'general',
}) => {
  const [quote, setQuote] = useState<FarmerQuote | null>(null);

  // Get a random quote when component mounts
  useEffect(() => {
    // Map the type to a category and get a quote
    const category = categoryMap[type];
    if (category) {
      setQuote(QuotesService.getQuoteByCategory(category));
    } else {
      setQuote(QuotesService.getRandomQuote());
    }
  }, [type]);

  return (
    <View style={[styles.container, style]}>
      {showIndicator && (
        <ActivityIndicator size={indicatorSize} color={indicatorColor} />
      )}

      <Text style={styles.loadingText}>{loadingText}</Text>

      {quote && (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>{quote.text}</Text>
          {quote.author && (
            <Text style={styles.quoteAuthor}>- {quote.author}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  quoteContainer: {
    backgroundColor: colors.surfaceLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    borderRadius: spacing.sm,
    maxWidth: 300,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  quoteAuthor: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
});

export default LoadingQuote;
