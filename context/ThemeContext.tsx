import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar, Platform } from 'react-native';
import { colors as lightColors } from '../theme';

// Define dark mode colors
const darkColors = {
  ...lightColors,
  primary: '#66BB6A', // Lighter green for dark mode
  primaryLight: '#81C784',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2C2C2C',
  white: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  lightGray: '#333333',
  mediumGray: '#666666',
  danger: '#FF5252', // Brighter red for dark mode
};

// Theme context interface
interface ThemeContextType {
  isDarkMode: boolean;
  colors: typeof lightColors;
  toggleDarkMode: () => void;
  theme: 'light' | 'dark';
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from AsyncStorage
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem('darkMode');
        if (storedPreference !== null) {
          setIsDarkMode(JSON.parse(storedPreference));
        }
      } catch (error) {
        console.error('Error loading dark mode preference:', error);
      }
    };

    loadDarkModePreference();
  }, []);

  // Update StatusBar based on theme
  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(isDarkMode ? '#121212' : '#FFFFFF');
    }
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  // Get current theme colors
  const colors = isDarkMode ? darkColors : lightColors;
  const theme = isDarkMode ? 'dark' as const : 'light' as const;

  const value: ThemeContextType = {
    isDarkMode,
    colors,
    toggleDarkMode,
    theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
