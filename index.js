import { registerRootComponent } from 'expo';
import React from 'react';
import FirebaseInitializer from './components/FirebaseInitializer';
import App from './App';

// Create a wrapper component that ensures Firebase is initialized
const AppWithFirebase = () => {
  console.log('Rendering AppWithFirebase wrapper');
  return (
    <FirebaseInitializer>
      <App />
    </FirebaseInitializer>
  );
};

// Register the root component
registerRootComponent(AppWithFirebase);
