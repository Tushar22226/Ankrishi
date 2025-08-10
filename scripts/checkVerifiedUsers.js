const database = require('@react-native-firebase/database');

async function checkVerifiedUsers() {
  try {
    console.log('Checking for verified users...');
    
    // Get all users
    const usersRef = database().ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('No users found in the database.');
      return;
    }
    
    let verifiedUsers = 0;
    let totalUsers = 0;
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      totalUsers++;
      
      if (user.verification && user.verification.status === 'verified') {
        verifiedUsers++;
        console.log(`Verified user found: ${user.displayName || 'Unknown'} (${user.uid})`);
      }
    });
    
    console.log(`Found ${verifiedUsers} verified users out of ${totalUsers} total users.`);
  } catch (error) {
    console.error('Error checking verified users:', error);
  }
}

// Run the function
checkVerifiedUsers();
