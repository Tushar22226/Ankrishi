import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { OrderNotificationProvider } from './context/OrderNotificationContext';
import LocationPermissionProvider from './components/LocationPermissionProvider';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  // We don't need to check Firebase initialization here anymore
  // because it's handled by the FirebaseInitializer component

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <LocationPermissionProvider>
              <OrderNotificationProvider>
                <AppNavigator />
                <StatusBar style="auto" />
              </OrderNotificationProvider>
            </LocationPermissionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
