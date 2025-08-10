import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  borderRadius?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'medium',
  onPress,
  padding = 'medium',
  backgroundColor = colors.white,
  borderRadius: customBorderRadius,
  ...rest
}) => {
  // Get shadow based on elevation
  const getShadow = () => {
    switch (elevation) {
      case 'none':
        return shadows.none;
      case 'low':
        return shadows.sm;
      case 'medium':
        return shadows.md;
      case 'high':
        return {
          ...shadows.lg,
          shadowColor: colors.primary,
          elevation: 8,
        };
      default:
        return shadows.md;
    }
  };

  // Get padding based on size
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'medium':
        return spacing.md;
      case 'large':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  const cardStyle = {
    ...getShadow(),
    padding: getPadding(),
    backgroundColor,
    borderRadius: customBorderRadius || borderRadius.md,
  };

  // If onPress is provided, wrap in TouchableOpacity, otherwise use View
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.8}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default Card;
