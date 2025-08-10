import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';

// Import Firebase services based on platform
let firebase: any;
let auth: any;
let storage: any;
let database: any;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8KBE9d301YtNNUAYbttWwGZTiVls0UJE",
  authDomain: "specials-b71a7.firebaseapp.com",
  databaseURL: "https://specials-b71a7-default-rtdb.firebaseio.com",
  projectId: "specials-b71a7",
  storageBucket: "specials-b71a7.appspot.com",
  messagingSenderId: "1095494963212",
  appId: "1:1095494963212:android:bf90980b3898188c4c5e29"
};

// Initialize Firebase and export the instances
export const initializeFirebase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        console.log('Web platform detected, using mock Firebase implementation');

        // Mock implementations for web
        firebase = {
          apps: [],
          initializeApp: () => ({ name: 'mock-app' })
        };

        auth = () => ({
          currentUser: null,
          onAuthStateChanged: (cb: any) => {
            cb(null);
            return () => {};
          }
        });

        storage = () => ({});
        database = () => ({});

        console.log('Mock Firebase initialized for web');
        resolve();
        return;
      }

      // For native platforms, use react-native-firebase
      console.log('Native platform detected, using react-native-firebase');

      // Dynamic imports to avoid web platform issues
      const rnFirebase = require('@react-native-firebase/app').default;
      const rnAuth = require('@react-native-firebase/auth').default;
      const rnStorage = require('@react-native-firebase/storage').default;
      const rnDatabase = require('@react-native-firebase/database').default;

      // Assign to our module variables
      firebase = rnFirebase;
      auth = rnAuth;
      storage = rnStorage;
      database = rnDatabase;

      // Check if Firebase is already initialized
      if (!firebase.apps.length) {
        console.log('No Firebase app instance found, creating new one');
        firebase.initializeApp(firebaseConfig);
      } else {
        console.log('Firebase app already initialized');
      }

      // With react-native-firebase, services are initialized automatically
      console.log('Firebase initialization complete');
      resolve();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      reject(error);
    }
  });
};

// Export the Firebase services
export { auth, storage, database, firebase };

// Firebase Initializer Component
interface FirebaseInitializerProps {
  children: React.ReactNode;
}

const FirebaseInitializer: React.FC<FirebaseInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log(`Firebase initialization attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
        await initializeFirebase();

        // Add a small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For web platform, we'll skip the auth verification
        if (Platform.OS === 'web') {
          console.log('Web platform detected, skipping auth verification');
          setIsInitialized(true);
          return;
        }

        // Verify that auth is available by trying to access the current user
        // This won't throw an error even if not signed in, but will throw if auth isn't initialized
        try {
          const currentUser = auth().currentUser;
          console.log('Auth check - Current user:', currentUser ? 'Signed in' : 'Not signed in');
        } catch (authError) {
          throw new Error(`Auth verification failed: ${authError}`);
        }

        console.log('Firebase initialization verified successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('Firebase initialization failed:', err);

        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying Firebase initialization in 1 second...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        } else {
          setError(err as Error);
        }
      }
    };

    if (!isInitialized && !error) {
      initialize();
    }
  }, [retryCount, isInitialized, error]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to initialize Firebase</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <Text style={styles.errorHint}>Please restart the app or check your internet connection</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Initializing Firebase...</Text>
        {retryCount > 0 && (
          <Text style={styles.retryText}>Retry attempt {retryCount}/{MAX_RETRIES}</Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  retryText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
  },
});

export default FirebaseInitializer;
