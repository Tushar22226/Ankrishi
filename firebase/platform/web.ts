// Mock implementation for web platform
// This avoids the issues with Firebase web SDK in Expo web

console.log('Using mock Firebase implementation for web');

// Mock app
const app = {
  name: 'mock-app',
  options: {
    apiKey: "AIzaSyD8KBE9d301YtNNUAYbttWwGZTiVls0UJE",
    authDomain: "specials-b71a7.firebaseapp.com",
    databaseURL: "https://specials-b71a7-default-rtdb.firebaseio.com",
    projectId: "specials-b71a7",
    storageBucket: "specials-b71a7.appspot.com",
    messagingSenderId: "1095494963212",
    appId: "1:1095494963212:android:bf90980b3898188c4c5e29"
  }
};

// Mock auth
const auth = () => ({
  currentUser: null,
  onAuthStateChanged: (callback) => {
    console.log('Mock auth: onAuthStateChanged called');
    // Call the callback with null (no user)
    callback(null);
    // Return a no-op unsubscribe function
    return () => {};
  },
  signInWithEmailAndPassword: async () => {
    console.log('Mock auth: signInWithEmailAndPassword called');
    throw new Error('Authentication not available in web preview');
  },
  createUserWithEmailAndPassword: async () => {
    console.log('Mock auth: createUserWithEmailAndPassword called');
    throw new Error('Authentication not available in web preview');
  },
  signInWithCredential: async () => {
    console.log('Mock auth: signInWithCredential called');
    throw new Error('Authentication not available in web preview');
  },
  signOut: async () => {
    console.log('Mock auth: signOut called');
    return Promise.resolve();
  },
  PhoneAuthProvider: {
    credential: (verificationId, code) => ({
      verificationId,
      code
    })
  }
});

// Mock database
const database = () => ({
  ref: (path) => ({
    once: async () => ({
      exists: () => false,
      val: () => null
    }),
    set: async () => Promise.resolve()
  })
});

// Mock storage
const storage = () => ({
  ref: (path) => ({
    putFile: async () => Promise.resolve({ downloadURL: 'https://example.com/mock-image.jpg' }),
    getDownloadURL: async () => Promise.resolve('https://example.com/mock-image.jpg')
  })
});

console.log('Mock Firebase initialized for web platform');

export { auth, storage, database };
export default app;
