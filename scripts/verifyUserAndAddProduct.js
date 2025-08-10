// This script verifies a user and adds a product with verified status
// Run this script to test the verification badge display

const database = require('@react-native-firebase/database');

async function verifyUserAndAddProduct() {
  try {
    // 1. Get the first user from the database
    const usersRef = database().ref('users');
    const usersSnapshot = await usersRef.limitToFirst(1).once('value');
    
    if (!usersSnapshot.exists()) {
      console.log('No users found in the database.');
      return;
    }
    
    let userId = null;
    let userName = null;
    
    usersSnapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      userId = user.uid;
      userName = user.displayName || 'Unknown User';
    });
    
    if (!userId) {
      console.log('Could not find a user to verify.');
      return;
    }
    
    console.log(`Verifying user: ${userName} (${userId})`);
    
    // 2. Update the user's verification status
    await database().ref(`users/${userId}/verification`).set({
      status: 'verified',
      lastRequestId: 'manual_verification',
      lastRequestDate: Date.now()
    });
    
    console.log(`User ${userName} has been verified.`);
    
    // 3. Add a product for this verified user
    const productsRef = database().ref('products');
    const newProductRef = productsRef.push();
    const productId = newProductRef.key;
    
    if (!productId) {
      throw new Error('Failed to generate product ID');
    }
    
    const verifiedProduct = {
      id: productId,
      name: `Verified Product - ${new Date().toISOString()}`,
      description: 'This product is from a verified seller',
      category: 'vegetables',
      subcategory: 'mixed',
      price: 100,
      discountedPrice: 80,
      currency: 'INR',
      stock: 50,
      stockUnit: 'kg',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1742&q=80',
          id: 'verified_product_image'
        }
      ],
      sellerId: userId,
      sellerName: userName,
      sellerVerified: true,
      isVerified: true,
      isDirectFromFarmer: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['verified', 'test']
    };
    
    await newProductRef.set(verifiedProduct);
    
    console.log(`Added verified product: ${verifiedProduct.name}`);
    console.log('Done! The verification badge should now be visible in the app.');
    
  } catch (error) {
    console.error('Error in verifyUserAndAddProduct:', error);
  }
}

// Run the function
verifyUserAndAddProduct();
