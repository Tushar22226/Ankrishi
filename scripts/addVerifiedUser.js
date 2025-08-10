const database = require('@react-native-firebase/database');

async function addVerifiedUser() {
  try {
    console.log('Adding a verified test user...');
    
    // Check if the test user already exists
    const testUserRef = database().ref('users/test_verified_user');
    const snapshot = await testUserRef.once('value');
    
    if (snapshot.exists()) {
      console.log('Test verified user already exists. Updating verification status...');
      await testUserRef.child('verification').update({
        status: 'verified',
        lastRequestDate: Date.now()
      });
    } else {
      // Create a new test user with verified status
      const testUser = {
        uid: 'test_verified_user',
        displayName: 'Verified Test Farmer',
        email: 'verified_test@example.com',
        role: 'farmer',
        createdAt: Date.now(),
        profileComplete: true,
        reputation: {
          rating: 4.8,
          totalRatings: 25,
          successfulOrders: 15,
          verifiedStatus: true,
          badges: ['Top Seller', 'Organic Certified']
        },
        verification: {
          status: 'verified',
          lastRequestDate: Date.now()
        },
        farmDetails: {
          name: 'Verified Test Farm',
          size: 5,
          sizeUnit: 'acres',
          farmingType: 'Organic'
        },
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'New Delhi, India'
        }
      };
      
      await testUserRef.set(testUser);
    }
    
    console.log('Verified test user added/updated successfully.');
    
    // Now add a product for this verified user
    const productsRef = database().ref('products');
    const newProductRef = productsRef.push();
    const productId = newProductRef.key;
    
    if (!productId) {
      throw new Error('Failed to generate product ID');
    }
    
    const testProduct = {
      id: productId,
      name: 'Organic Tomatoes (Verified Seller)',
      description: 'Fresh organic tomatoes from a verified seller',
      category: 'vegetables',
      subcategory: 'tomatoes',
      price: 40,
      discountedPrice: 35,
      currency: 'INR',
      stock: 100,
      stockUnit: 'kg',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
          id: 'tomato_image_1'
        }
      ],
      sellerId: 'test_verified_user',
      sellerName: 'Verified Test Farmer',
      sellerRating: 4.8,
      sellerVerified: true,
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'New Delhi, India'
      },
      ratings: [],
      averageRating: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isVerified: true,
      isDirectFromFarmer: true,
      tags: ['organic', 'tomatoes', 'vegetables', 'verified']
    };
    
    await newProductRef.set(testProduct);
    
    console.log('Test product for verified user added successfully.');
  } catch (error) {
    console.error('Error adding verified test user:', error);
  }
}

// Run the function
addVerifiedUser();
