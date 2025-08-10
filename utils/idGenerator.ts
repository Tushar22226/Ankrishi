/**
 * Utility functions for generating unique IDs
 */

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
