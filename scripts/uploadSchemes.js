const firebase = require('@react-native-firebase/app');
const database = require('@react-native-firebase/database');
const fs = require('fs');
const path = require('path');

// Initialize Firebase if not already initialized
if (firebase.apps.length === 0) {
  firebase.initializeApp();
}

// Function to upload schemes to Firebase
async function uploadSchemesToFirebase() {
  try {
    console.log('Starting upload of government schemes to Firebase...');
    
    // Read schemes from JSON file
    const filePath = path.join(__dirname, '../data/governmentSchemes.json');
    const schemesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Reference to the schemes collection in Firebase
    const schemesRef = database().ref('governmentSchemes');
    
    // Clear existing schemes (optional)
    await schemesRef.remove();
    console.log('Cleared existing schemes');
    
    // Upload each scheme
    for (const scheme of schemesData.schemes) {
      const schemeRef = schemesRef.child(scheme.id);
      await schemeRef.set(scheme);
      console.log(`Uploaded scheme: ${scheme.title}`);
    }
    
    console.log(`Successfully uploaded ${schemesData.schemes.length} government schemes to Firebase`);
  } catch (error) {
    console.error('Error uploading schemes to Firebase:', error);
  }
}

// Execute the upload function
uploadSchemesToFirebase()
  .then(() => console.log('Upload process completed'))
  .catch(error => console.error('Upload process failed:', error));
