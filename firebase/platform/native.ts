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

console.log(`Firebase initialized on platform: ${Platform.OS}`);

export { auth, storage, database };
export default firebase;
