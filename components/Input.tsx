import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  isPassword?: boolean;
  touched?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  isPassword = false,
  touched = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(!isPassword);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  const getBorderColor = () => {
    if (error && touched) return colors.error;
    if (isFocused) return colors.primary;
    return colors.lightGray; // Darker border color for better visibility
  };

  const getBackgroundColor = () => {
    if (isFocused) return colors.white;
    return colors.white; // Always white background for better contrast
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
            backgroundColor: getBackgroundColor(),
            shadowColor: isFocused ? colors.primary : 'transparent',
            shadowOffset: { width: 0, height: isFocused ? 2 : 0 },
            shadowOpacity: isFocused ? 0.1 : 0,
            shadowRadius: isFocused ? 4 : 0,
            elevation: isFocused ? 2 : 0,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            inputStyle,
            leftIcon ? { paddingLeft: 0 } : {},
            (rightIcon || isPassword) ? { paddingRight: 0 } : {},
          ]}
          placeholderTextColor={colors.mediumGray}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !passwordVisible}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.mediumGray}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {error && touched && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    minHeight: 50,
    maxHeight: 55,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  input: {
    flex: 1,
    height: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  iconContainer: {
    paddingHorizontal: spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 50,
  },
  error: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input;
