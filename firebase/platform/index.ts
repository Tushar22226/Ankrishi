// Platform-specific Firebase implementation
import { Platform } from 'react-native';

// Define types for our Firebase exports
type FirebaseApp = any;
type Auth = any;
type Storage = any;
type Database = any;

// Default mock implementations
let firebase: FirebaseApp = {
  apps: [],
  initializeApp: () => ({ name: 'mock-app' })
};

let auth: Auth = () => ({
  currentUser: null,
  onAuthStateChanged: (cb: any) => {
    cb(null);
    return () => {};
  }
});

let storage: Storage = () => ({
  ref: () => ({
    putFile: async () => Promise.resolve({ downloadURL: 'https://example.com/mock-image.jpg' }),
    getDownloadURL: async () => Promise.resolve('https://example.com/mock-image.jpg')
  })
});

let database: Database = () => ({
  ref: () => ({
    once: async () => ({ exists: () => false, val: () => null }),
    set: async () => Promise.resolve()
  })
});

try {
  if (Platform.OS === 'web') {
    console.log('Using web Firebase implementation');
    // On web, we'll use our mock implementations defined above
    console.log('Using mock Firebase implementation for web platform');
  } else {
    console.log(`Using native Firebase implementation for ${Platform.OS}`);
    // For native platforms, use the real implementations
    const nativeImpl = require('./native');
    firebase = nativeImpl.default;
    auth = nativeImpl.auth;
    storage = nativeImpl.storage;
    database = nativeImpl.database;
  }
} catch (error) {
  console.error('Error loading Firebase implementation:', error);
  console.log('Using fallback mock implementations');
  // We'll use the default mock implementations defined above
}

export { auth, storage, database };
export default firebase;
