/**
 * Utility functions for generating unique IDs
 */
import { Platform } from 'react-native';

/**
 * Generates a random string of specified length
 * @param length Length of the random string
 * @returns Random string
 */
const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

/**
 * Generates a unique ID with timestamp and random string
 * @returns Unique ID string
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = generateRandomString(8);
  return `${timestamp}-${randomStr}`;
};

/**
 * Generates a unique ID for a specific entity type
 * @param prefix Entity type prefix (e.g., 'user', 'crop', 'task')
 * @returns Unique ID with prefix
 */
export const generatePrefixedId = (prefix: string): string => {
  return `${prefix}_${generateId()}`;
};

/**
 * Generates a consistent group code that will be the same across devices
 * @param groupId The group ID to use as a seed
 * @returns A consistent group code in the format FG1234
 */
export const generateGroupCode = (groupId: string): string => {
  // Use a deterministic method to generate a 4-digit number from the groupId
  let numericValue = 0;

  // Sum the character codes of the groupId to create a seed
  for (let i = 0; i < groupId.length; i++) {
    numericValue += groupId.charCodeAt(i);
  }

  // Ensure it's a 4-digit number between 1000-9999
  const fourDigitNumber = (numericValue % 9000) + 1000;

  // Return the formatted group code
  return `FG${fourDigitNumber}`;
};
