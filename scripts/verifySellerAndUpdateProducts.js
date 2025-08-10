const database = require('@react-native-firebase/database');

// User ID to verify
const SELLER_ID = 'EAkgPuphl7hT43vxjYk1dLPpP6U2'; // Replace with the seller ID you want to verify

async function verifySellerAndUpdateProducts(sellerId) {
  try {
    console.log(`Verifying seller: ${sellerId}`);
    
    // Check if user exists
    const userRef = database().ref(`users/${sellerId}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      console.log(`User with ID ${sellerId} not found.`);
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
    
    console.log(`✅ User ${sellerId} has been verified successfully.`);
    
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
    
    // Now update all products by this seller to include sellerVerified flag
    console.log(`\nUpdating products for seller ${sellerId}...`);
    
    const productsRef = database().ref('products');
    const productsSnapshot = await productsRef
      .orderByChild('sellerId')
      .equalTo(sellerId)
      .once('value');
    
    if (!productsSnapshot.exists()) {
      console.log(`No products found for seller ${sellerId}.`);
      return;
    }
    
    let updatedCount = 0;
    
    // Update each product
    const updatePromises = [];
    productsSnapshot.forEach((productSnapshot) => {
      const product = productSnapshot.val();
      console.log(`Updating product: ${product.name} (${product.id})`);
      
      // Update the sellerVerified field
      updatePromises.push(
        productsRef.child(product.id).update({
          sellerVerified: true,
          updatedAt: Date.now(),
        })
      );
      
      updatedCount++;
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`\n✅ Updated ${updatedCount} products with sellerVerified=true.`);
    console.log(`\nVerification complete. The seller and their products should now appear as verified in the app.`);
  } catch (error) {
    console.error('Error verifying seller and updating products:', error);
  }
}

// Run the function with the specified seller ID
verifySellerAndUpdateProducts(SELLER_ID);
