// Native implementation using react-native-firebase
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import { Platform } from 'react-native';

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

// Initialize Firebase
if (!firebase.apps.length) {
  console.log('Initializing Firebase app with react-native-firebase');
  firebase.initializeApp(firebaseConfig);
} else {
  console.log('Firebase app already initialized');
}

// Enable Firebase Realtime Database persistence with no storage limits
try {
  console.log('Enabling Firebase Realtime Database persistence with unlimited storage...');

  // Enable persistence for offline support
  database().setPersistenceEnabled(true);

  // Set cache size to maximum available (removing size limit for unlimited storage)
  // Using the largest possible value to simulate unlimited storage
  const UNLIMITED_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB (maximum practical limit)
  database().setPersistenceCacheSizeBytes(UNLIMITED_CACHE_SIZE);

  // Enable logging for debugging persistence
  database().setLoggingEnabled(true);

  console.log('Firebase Realtime Database persistence enabled with unlimited storage (1GB cache)');
  console.log('Persistence settings:');
  console.log('- Offline persistence: ENABLED');
  console.log('- Cache size: 1GB (unlimited)');
  console.log('- Logging: ENABLED');
} catch (error) {
  console.warn('Failed to enable Firebase persistence (may already be enabled):', error);
  // Fallback: try to enable persistence without cache size setting
  try {
    database().setPersistenceEnabled(true);
    console.log('Firebase persistence enabled with default settings');
  } catch (fallbackError) {
    console.error('Failed to enable Firebase persistence entirely:', fallbackError);
  }
}

console.log(`Firebase initialized on platform: ${Platform.OS}`);

export { auth, storage, database };
export default firebase;
