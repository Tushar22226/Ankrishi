// Utility functions for formatting data

/**
 * Format a date timestamp to a readable string
 * @param timestamp - The timestamp to format
 * @param includeTime - Whether to include the time in the formatted string
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number, includeTime: boolean = false): string => {
  if (!timestamp) return '-';

  const date = new Date(timestamp);

  if (includeTime) {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a currency amount to Indian Rupees
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null) return '₹0';

  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format a category name from snake_case to Title Case
 * @param category - The category name in snake_case
 * @returns Formatted category name
 */
export const formatCategoryName = (category: string): string => {
  if (!category) return '';

  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a percentage value
 * @param value - The percentage value
 * @param decimalPlaces - Number of decimal places to include
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimalPlaces: number = 1): string => {
  if (value === undefined || value === null) return '0%';

  return `${value.toFixed(decimalPlaces)}%`;
};

/**
 * Format a quantity with its unit
 * @param quantity - The quantity value
 * @param unit - The unit of measurement
 * @returns Formatted quantity string
 */
export const formatQuantity = (quantity: number, unit: string): string => {
  if (quantity === undefined || quantity === null) return '0';

  return `${quantity} ${unit}`;
};

/**
 * Format a stock quantity with its unit
 * @param quantity - The quantity value
 * @param unit - The stock unit (kg, quintal, ton, etc.)
 * @returns Formatted stock quantity string
 */
export const formatStockQuantity = (quantity: number, unit?: string): string => {
  if (quantity === undefined || quantity === null) return '0';

  // Format the unit display name
  let displayUnit = unit || 'units';

  // Handle special cases
  if (unit === 'kg') {
    displayUnit = 'kg';
  } else if (unit === 'quintal') {
    displayUnit = 'quintal';
  } else if (unit === 'ton') {
    displayUnit = 'ton';
  }

  return `${quantity} ${displayUnit}`;
};

/**
 * Format a phone number to a readable format
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Format Indian phone numbers (10 digits)
  if (phone.length === 10) {
    return `${phone.substring(0, 5)} ${phone.substring(5)}`;
  }

  return phone;
};

/**
 * Format an address to a single line
 * @param address - The address object
 * @returns Formatted address string
 */
export const formatAddress = (address: any): string => {
  if (!address) return '';

  const parts = [
    address.address,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);

  return parts.join(', ');
};
