import { Platform } from 'react-native';
import { spacing } from '../theme';

/**
 * Returns platform-specific top margin/padding values
 * @param baseValue The base spacing value to use for iOS and web
 * @param androidValue The spacing value to use for Android (defaults to baseValue * 1.5)
 * @returns The appropriate spacing value based on platform
 */
export const getTopSpacing = (baseValue: number, androidValue?: number): number => {
  if (Platform.OS === 'android') {
    // Add additional 10dp to Android spacing
    return androidValue !== undefined ? androidValue + 10 : baseValue * 1.5 + 10;
  }
  return baseValue;
};

/**
 * Returns platform-specific style object with top margin/padding
 * @param property The style property to set ('marginTop' or 'paddingTop')
 * @param baseValue The base spacing value to use for iOS and web
 * @param androidValue The spacing value to use for Android (defaults to baseValue * 1.5)
 * @returns A style object with the appropriate property and value
 */
export const getPlatformTopSpacing = (
  property: 'marginTop' | 'paddingTop',
  baseValue: number,
  androidValue?: number
): { [key: string]: number } => {
  const value = getTopSpacing(baseValue, androidValue);
  return { [property]: value };
};

/**
 * Returns a complete style object with platform-specific top spacing
 * @param baseStyles The base styles object to extend
 * @param property The style property to set ('marginTop' or 'paddingTop')
 * @param baseValue The base spacing value to use for iOS and web
 * @param androidValue The spacing value to use for Android (defaults to baseValue * 1.5)
 * @returns A new style object with the platform-specific top spacing added
 */
export const withPlatformTopSpacing = (
  baseStyles: object,
  property: 'marginTop' | 'paddingTop',
  baseValue: number,
  androidValue?: number
): object => {
  return {
    ...baseStyles,
    ...getPlatformTopSpacing(property, baseValue, androidValue)
  };
};
