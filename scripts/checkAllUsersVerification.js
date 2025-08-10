const database = require('@react-native-firebase/database');

async function checkAllUsersVerification() {
  try {
    console.log('Checking verification status for all users...');
    
    // Get all users
    const usersRef = database().ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('No users found in the database.');
      return;
    }
    
    let totalUsers = 0;
    let usersWithVerificationData = 0;
    let verifiedUsers = 0;
    let pendingUsers = 0;
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      totalUsers++;
      
      console.log(`\nUser: ${user.displayName || 'Unknown'} (${user.uid})`);
      console.log(`Role: ${user.role || 'Unknown'}`);
      
      if (user.verification) {
        usersWithVerificationData++;
        console.log(`Verification status: ${user.verification.status}`);
        console.log(`Last request date: ${new Date(user.verification.lastRequestDate || 0).toLocaleString()}`);
        
        if (user.verification.status === 'verified') {
          verifiedUsers++;
          console.log('✅ USER IS VERIFIED');
        } else if (user.verification.status === 'pending') {
          pendingUsers++;
          console.log('⏳ USER VERIFICATION IS PENDING');
        } else {
          console.log('❌ USER IS NOT VERIFIED');
        }
      } else {
        console.log('❌ No verification data found for this user');
      }
      
      // Check reputation data
      if (user.reputation && user.reputation.verifiedStatus) {
        console.log('⚠️ User has verifiedStatus=true in reputation data');
      }
    });
    
    console.log('\n--- SUMMARY ---');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with verification data: ${usersWithVerificationData}`);
    console.log(`Verified users: ${verifiedUsers}`);
    console.log(`Pending verification: ${pendingUsers}`);
    console.log(`Unverified users: ${totalUsers - verifiedUsers - pendingUsers}`);
  } catch (error) {
    console.error('Error checking user verification:', error);
  }
}

// Run the function
checkAllUsersVerification();
