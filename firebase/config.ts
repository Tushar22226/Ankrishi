// firebase/config.ts
// This file exports the platform-specific Firebase implementation
import { Platform } from 'react-native';

console.log('Firebase config module is being loaded');
console.log(`Current platform: ${Platform.OS}`);

// Import the platform-specific Firebase implementation
import firebase, { auth, storage, database } from './platform';

// Export the initialized services
export { auth, storage, database };
export default firebase;
