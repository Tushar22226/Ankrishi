import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface SocialButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  title,
  style,
  textStyle,
  ...rest
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      activeOpacity={0.8}
      {...rest}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      {title && (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
    minWidth: 50,
    minHeight: 50,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
});

export default SocialButton;
