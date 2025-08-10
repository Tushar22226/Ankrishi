import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import QuotesService from '../services/QuotesService';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  // Get a random quote for loading state
  const [loadingQuote, setLoadingQuote] = useState('');

  useEffect(() => {
    if (loading) {
      setLoadingQuote(QuotesService.getRandomQuote().text);
    }
  }, [loading]);
  // Determine button styles based on variant and size
  const getButtonStyles = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};

    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = {
          backgroundColor: colors.primary,
          borderWidth: 0,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 4,
        };
        break;
      case 'secondary':
        buttonStyle = {
          backgroundColor: colors.secondary,
          borderWidth: 0,
        };
        break;
      case 'outline':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: 0,
        };
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: borderRadius.sm,
        };
        break;
      case 'medium':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.lg,
          // Add a slight gradient effect with a border
          borderWidth: variant === 'primary' ? 0 : 1,
          borderColor: variant === 'primary' ? 'transparent' : colors.primary,
        };
        break;
    }

    // Full width style
    if (fullWidth) {
      buttonStyle.width = '100%';
    }

    // Disabled style
    if (disabled || loading) {
      buttonStyle.opacity = 0.6;
    }

    return buttonStyle;
  };

  // Determine text styles based on variant and size
  const getTextStyles = (): TextStyle => {
    let textStyleObj: TextStyle = {
      fontFamily: typography.fontFamily.medium,
      textAlign: 'center',
    };

    // Variant styles
    switch (variant) {
      case 'primary':
      case 'secondary':
        textStyleObj.color = colors.white;
        break;
      case 'outline':
      case 'text':
        textStyleObj.color = colors.primary;
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        textStyleObj.fontSize = typography.fontSize.sm;
        break;
      case 'medium':
        textStyleObj.fontSize = typography.fontSize.md;
        break;
      case 'large':
        textStyleObj.fontSize = typography.fontSize.lg;
        break;
    }

    return textStyleObj;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyles(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary}
          />
          {size !== 'small' && loadingQuote && (
            <Text
              style={[
                styles.loadingQuote,
                { color: variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {loadingQuote}
            </Text>
          )}
        </View>
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[styles.text, getTextStyles(), textStyle]}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingQuote: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    marginLeft: spacing.xs,
    maxWidth: 150,
  },
});

export default Button;
