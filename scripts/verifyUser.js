const database = require('@react-native-firebase/database');

// User ID to verify
const USER_ID = 'EAkgPuphl7hT43vxjYk1dLPpP6U2'; // Replace with the user ID you want to verify

async function verifyUser(userId) {
  try {
    console.log(`Verifying user: ${userId}`);
    
    // Check if user exists
    const userRef = database().ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      console.log(`User with ID ${userId} not found.`);
      return;
    }
    
    const user = snapshot.val();
    console.log(`Found user: ${user.displayName || 'Unknown'} (${user.uid})`);
    
    // Update verification status
    await userRef.child('verification').update({
      status: 'verified',
      lastRequestId: 'manual_verification',
      lastRequestDate: Date.now(),
    });
    
    console.log(`✅ User ${userId} has been verified successfully.`);
    
    // Also update reputation data for backward compatibility
    if (user.reputation) {
      await userRef.child('reputation').update({
        verifiedStatus: true,
      });
      console.log(`✅ Updated reputation.verifiedStatus to true for backward compatibility.`);
    } else {
      // Create reputation data if it doesn't exist
      await userRef.child('reputation').set({
        rating: 0,
        totalRatings: 0,
        successfulOrders: 0,
        verifiedStatus: true,
        badges: ['Verified'],
      });
      console.log(`✅ Created reputation data with verifiedStatus=true.`);
    }
    
    console.log(`\nVerification complete. The user should now appear as verified in the app.`);
  } catch (error) {
    console.error('Error verifying user:', error);
  }
}

// Run the function with the specified user ID
verifyUser(USER_ID);
