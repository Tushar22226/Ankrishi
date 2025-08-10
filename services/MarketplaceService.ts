import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import {
  Product,
  Fertilizer,
  Equipment,
  Produce,
  Order,
  OrderStatus,
  ProductImage,
  OrderItem,
  PaymentMethod,
  PaymentStatus
} from '../models/Product';
import { UserProfile } from '../context/AuthContext';
import ReputationService from './ReputationService';

class MarketplaceService {
  // Add a new product to the marketplace
  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageRating'>): Promise<string> {
    try {
      // Create a reference to the products collection
      const productsRef = database().ref('products');

      // Generate a new product ID
      const newProductRef = productsRef.push();
      const productId = newProductRef.key;

      if (!productId) {
        throw new Error('Failed to generate product ID');
      }

      // Calculate average rating if ratings exist
      const averageRating = product.ratings && product.ratings.length > 0
        ? product.ratings.reduce((sum, rating) => sum + rating.rating, 0) / product.ratings.length
        : 0;

      // Create the complete product object
      const completeProduct = {
        ...product,
        id: productId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        averageRating,
      };

      // Save the product to the database
      await newProductRef.set(completeProduct);

      return productId;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  // Upload product images
  async uploadProductImage(file: Blob, productId: string, isMain: boolean = false): Promise<ProductImage> {
    try {
      // Create a reference to the product image in storage
      const filename = `products/${productId}/${Date.now()}`;
      const imageRef = storage().ref(filename);

      // Upload the file
      await imageRef.put(file);

      // Get the download URL
      const url = await imageRef.getDownloadURL();

      // Return the image object
      return {
        url,
        isMain,
        uploadedAt: Date.now(),
      };
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  // Get a product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      // Create a reference to the product
      const productRef = database().ref(`products/${productId}`);

      // Get the product
      const snapshot = await productRef.once('value');

      if (snapshot.exists()) {
        const product = snapshot.val() as Product;

        // Ensure product has ratings array
        if (!product.ratings) {
          product.ratings = [];
        }

        // Ensure product has averageRating
        if (product.averageRating === undefined || product.averageRating === null) {
          product.averageRating = product.ratings.length > 0
            ? product.ratings.reduce((sum, rating) => sum + rating.rating, 0) / product.ratings.length
            : 0;
        }

        // Check seller verification status
        const isSellerVerified = await this.checkSellerVerificationStatus(product.sellerId);
        product.sellerVerified = isSellerVerified;

        console.log(`Product ${product.name} (${product.id}) seller verification status:`, isSellerVerified ? 'VERIFIED' : 'NOT VERIFIED');
        console.log(`Product ${product.name} (${product.id}) has ${product.ratings.length} ratings with average ${product.averageRating.toFixed(1)}`);

        // Update the product in the database with the verification status and ratings info
        await productRef.update({
          sellerVerified: isSellerVerified,
          ratings: product.ratings,
          averageRating: product.averageRating
        });

        return product;
      }

      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      // Create a query to get products by category
      const productsRef = database().ref('products')
        .orderByChild('category')
        .equalTo(category);

      // Get the products
      const snapshot = await productsRef.once('value');

      if (snapshot.exists()) {
        const products: Product[] = [];

        snapshot.forEach((childSnapshot) => {
          products.push(childSnapshot.val() as Product);
          return undefined; // Needed for TypeScript
        });

        return products;
      }

      return [];
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  }

  // Get products by seller
  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    try {
      // Create a query to get products by seller
      const productsRef = database().ref('products')
        .orderByChild('sellerId')
        .equalTo(sellerId);

      // Get the products
      const snapshot = await productsRef.once('value');

      if (snapshot.exists()) {
        const products: Product[] = [];

        snapshot.forEach((childSnapshot) => {
          products.push(childSnapshot.val() as Product);
          return undefined; // Needed for TypeScript
        });

        return products;
      }

      return [];
    } catch (error) {
      console.error('Error getting products by seller:', error);
      throw error;
    }
  }

  // Update a product
  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      // Create a reference to the product
      const productRef = database().ref(`products/${productId}`);

      // Get the current product
      const snapshot = await productRef.once('value');

      if (snapshot.exists()) {
        const currentProduct = snapshot.val() as Product;

        // Create the updated product
        const updatedProduct = {
          ...currentProduct,
          ...updates,
          updatedAt: Date.now(),
        };

        // Save the updated product
        await productRef.set(updatedProduct);
      } else {
        throw new Error(`Product with ID ${productId} not found`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    try {
      // Create a reference to the product
      const productRef = database().ref(`products/${productId}`);

      // Delete the product
      await productRef.remove();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Create a new order
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Create a reference to the orders collection
      const ordersRef = database().ref('orders');

      // Generate a new order ID
      const newOrderRef = ordersRef.push();
      const orderId = newOrderRef.key;

      if (!orderId) {
        throw new Error('Failed to generate order ID');
      }

      // Create the complete order object
      const completeOrder = {
        ...order,
        id: orderId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the order to the database
      await newOrderRef.set(completeOrder);

      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Get an order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      // Create a reference to the order
      const orderRef = database().ref(`orders/${orderId}`);

      // Get the order
      const snapshot = await orderRef.once('value');

      if (snapshot.exists()) {
        return snapshot.val() as Order;
      }

      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  // Get orders by user
  async getOrdersByUser(userId: string): Promise<Order[]> {
    try {
      // Create a query to get orders by user
      const ordersRef = database().ref('orders')
        .orderByChild('userId')
        .equalTo(userId);

      // Get the orders
      const snapshot = await ordersRef.once('value');

      if (snapshot.exists()) {
        const orders: Order[] = [];

        snapshot.forEach((childSnapshot) => {
          orders.push(childSnapshot.val() as Order);
          return undefined; // Needed for TypeScript
        });

        // Sort by createdAt in descending order
        return orders.sort((a, b) => b.createdAt - a.createdAt);
      }

      return [];
    } catch (error) {
      console.error('Error getting orders by user:', error);
      throw error;
    }
  }

  // Get orders by seller
  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    try {
      // Create a query to get orders by seller
      const ordersRef = database().ref('orders')
        .orderByChild('sellerId')
        .equalTo(sellerId);

      // Get the orders
      const snapshot = await ordersRef.once('value');

      if (snapshot.exists()) {
        const orders: Order[] = [];

        snapshot.forEach((childSnapshot) => {
          orders.push(childSnapshot.val() as Order);
          return undefined; // Needed for TypeScript
        });

        // Sort by createdAt in descending order
        return orders.sort((a, b) => b.createdAt - a.createdAt);
      }

      return [];
    } catch (error) {
      console.error('Error getting orders by seller:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      // Create a reference to the order
      const orderRef = database().ref(`orders/${orderId}`);

      // Get the current order
      const snapshot = await orderRef.once('value');

      if (snapshot.exists()) {
        const currentOrder = snapshot.val() as Order;

        // Create the updated order
        const updatedOrder = {
          ...currentOrder,
          status,
          updatedAt: Date.now(),
        };

        // Add timestamp for specific status changes
        if (status === 'delivered') {
          updatedOrder.deliveredAt = Date.now();

          // Update seller's reputation when order is delivered
          if (currentOrder.status !== 'delivered' && currentOrder.sellerId) {
            await this.updateSellerSuccessfulOrders(currentOrder.sellerId);
          }
        } else if (status === 'cancelled') {
          updatedOrder.cancelledAt = Date.now();
        } else if (status === 'returned') {
          updatedOrder.returnedAt = Date.now();
        }

        // Save the updated order
        await orderRef.set(updatedOrder);
      } else {
        throw new Error(`Order with ID ${orderId} not found`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Update seller's successful orders count
  private async updateSellerSuccessfulOrders(sellerId: string): Promise<void> {
    try {
      // Get the seller's profile
      const sellerRef = database().ref(`users/${sellerId}`);
      const snapshot = await sellerRef.once('value');

      if (snapshot.exists()) {
        const sellerProfile = snapshot.val() as UserProfile;

        // Initialize reputation if it doesn't exist
        if (!sellerProfile.reputation) {
          sellerProfile.reputation = {
            rating: 0,
            totalRatings: 0,
            successfulOrders: 0,
            verifiedStatus: false,
            badges: [],
            reviews: []
          };
        }

        // Increment successful orders count
        const successfulOrders = (sellerProfile.reputation.successfulOrders || 0) + 1;

        // Update the seller's reputation
        await sellerRef.child('reputation').update({
          successfulOrders
        });

        console.log(`Updated seller ${sellerId} successful orders to ${successfulOrders}`);
      }
    } catch (error) {
      console.error('Error updating seller successful orders:', error);
      // Don't throw the error to prevent blocking the order status update
    }
  }

  // Update order tracking information
  async updateOrderTracking(orderId: string, trackingInfo: Order['trackingInfo']): Promise<void> {
    try {
      // Create a reference to the order tracking info
      const trackingRef = database().ref(`orders/${orderId}/trackingInfo`);

      // Save the tracking information
      await trackingRef.set(trackingInfo);

      // Update the order's updatedAt timestamp
      const updatedAtRef = database().ref(`orders/${orderId}/updatedAt`);
      await updatedAtRef.set(Date.now());
    } catch (error) {
      console.error('Error updating order tracking:', error);
      throw error;
    }
  }

  // Search products by name or description
  async searchProducts(searchQuery: string): Promise<Product[]> {
    try {
      // Get all products
      const productsRef = database().ref('products');
      const snapshot = await productsRef.once('value');

      if (snapshot.exists()) {
        const products: Product[] = [];
        const queryLower = searchQuery.toLowerCase();

        snapshot.forEach((childSnapshot) => {
          const product = childSnapshot.val() as Product;

          // Check if the product name or description contains the query
          if (
            product.name.toLowerCase().includes(queryLower) ||
            product.description.toLowerCase().includes(queryLower) ||
            product.tags.some(tag => tag.toLowerCase().includes(queryLower))
          ) {
            products.push(product);
          }
          return undefined; // Needed for TypeScript
        });

        return products;
      }

      return [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Get recommended products for a user
  async getRecommendedProducts(userId: string): Promise<Product[]> {
    try {
      // In a real app, this would use an algorithm to recommend products
      // For now, just return some random products

      // Get all products
      const productsRef = database().ref('products');
      const snapshot = await productsRef.once('value');

      if (snapshot.exists()) {
        const products: Product[] = [];

        snapshot.forEach((childSnapshot) => {
          products.push(childSnapshot.val() as Product);
          return undefined; // Needed for TypeScript
        });

        // Shuffle the products and return the first 5
        return products
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);
      }

      return [];
    } catch (error) {
      console.error('Error getting recommended products:', error);
      throw error;
    }
  }

  // Get featured products (verified products)
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      // Get verified products
      const productsRef = database().ref('products')
        .orderByChild('isVerified')
        .equalTo(true)
        .limitToLast(limit);

      const snapshot = await productsRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const products: Product[] = [];
      const userVerificationPromises: Promise<{userId: string, isVerified: boolean}>[] = [];

      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val() as Product;
        products.push(product);

        // Queue up verification status check for each seller
        userVerificationPromises.push(
          this.checkSellerVerificationStatus(product.sellerId)
            .then(isVerified => ({ userId: product.sellerId, isVerified }))
        );

        return undefined; // Needed for TypeScript
      });

      // Wait for all verification checks to complete
      const verificationResults = await Promise.all(userVerificationPromises);

      // Create a map of user IDs to verification status
      const verificationMap = new Map<string, boolean>();
      verificationResults.forEach(result => {
        verificationMap.set(result.userId, result.isVerified);
      });

      // Update products with seller verification status
      const updatePromises = [];
      products.forEach(product => {
        const isVerified = verificationMap.get(product.sellerId) || false;
        product.sellerVerified = isVerified;
        console.log(`Featured product ${product.name} (${product.id}) seller verification:`, isVerified ? 'VERIFIED' : 'NOT VERIFIED');

        // Update the product in the database with the verification status
        updatePromises.push(
          database().ref(`products/${product.id}`).update({
            sellerVerified: isVerified
          })
        );
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Sort by createdAt in descending order
      return products.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting featured products:', error);
      throw error;
    }
  }

  // Get recent products
  async getRecentProducts(limit: number = 20): Promise<Product[]> {
    try {
      const productsRef = database().ref('products')
        .orderByChild('createdAt')
        .limitToLast(limit);

      const snapshot = await productsRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const products: Product[] = [];
      const userVerificationPromises: Promise<{userId: string, isVerified: boolean}>[] = [];

      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val() as Product;
        products.push(product);

        // Queue up verification status check for each seller
        userVerificationPromises.push(
          this.checkSellerVerificationStatus(product.sellerId)
            .then(isVerified => ({ userId: product.sellerId, isVerified }))
        );

        return undefined; // Needed for TypeScript
      });

      // Wait for all verification checks to complete
      const verificationResults = await Promise.all(userVerificationPromises);

      // Create a map of user IDs to verification status
      const verificationMap = new Map<string, boolean>();
      verificationResults.forEach(result => {
        verificationMap.set(result.userId, result.isVerified);
      });

      // Update products with seller verification status
      const updatePromises = [];
      products.forEach(product => {
        const isVerified = verificationMap.get(product.sellerId) || false;
        product.sellerVerified = isVerified;
        console.log(`Recent product ${product.name} (${product.id}) seller verification:`, isVerified ? 'VERIFIED' : 'NOT VERIFIED');

        // Update the product in the database with the verification status
        updatePromises.push(
          database().ref(`products/${product.id}`).update({
            sellerVerified: isVerified
          })
        );
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Sort by createdAt in descending order
      return products.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting recent products:', error);
      throw error;
    }
  }

  // Get farmer profile with products
  async getFarmerProfile(farmerId: string): Promise<{
    profile: UserProfile | null;
    products: Product[];
  }> {
    try {
      // Get farmer profile
      const userRef = database().ref(`users/${farmerId}`);
      const userSnapshot = await userRef.once('value');

      let profile = null;
      if (userSnapshot.exists()) {
        profile = userSnapshot.val() as UserProfile;
      }

      // Get farmer's products
      const products = await this.getProductsBySeller(farmerId);

      return { profile, products };
    } catch (error) {
      console.error('Error getting farmer profile:', error);
      throw error;
    }
  }

  // Get nearby farmers
  async getNearbyFarmers(
    latitude: number,
    longitude: number,
    radiusInKm: number = 50
  ): Promise<Array<UserProfile & { distance?: number }>> {
    try {
      // Get all users
      const usersRef = database().ref('users');
      const snapshot = await usersRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const farmers: Array<UserProfile & { distance?: number }> = [];

      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val() as UserProfile;

        // Only include farmers
        if (user.role !== 'farmer') {
          return undefined;
        }

        // Skip users without location
        if (!user.location) {
          return undefined;
        }

        // Calculate distance
        const distance = this.calculateDistance(
          latitude,
          longitude,
          user.location.latitude,
          user.location.longitude
        );

        // Include farmers within the radius
        if (distance <= radiusInKm) {
          farmers.push({
            ...user,
            distance // Add distance to the farmer object
          });
        }

        return undefined; // Needed for TypeScript
      });

      // Sort by distance
      return farmers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } catch (error) {
      console.error('Error getting nearby farmers:', error);
      throw error;
    }
  }

  // Check if a seller is verified
  async checkSellerVerificationStatus(sellerId: string): Promise<boolean> {
    try {
      // First check the new verification path
      const verificationSnapshot = await database().ref(`users/${sellerId}/verification`).once('value');

      if (verificationSnapshot.exists()) {
        const verification = verificationSnapshot.val();
        const isVerified = verification.status === 'verified';
        console.log(`Seller ${sellerId} verification status:`, isVerified ? 'VERIFIED' : 'NOT VERIFIED');
        return isVerified;
      }

      // If no verification data, check the legacy reputation.verifiedStatus field
      const reputationSnapshot = await database().ref(`users/${sellerId}/reputation`).once('value');

      if (reputationSnapshot.exists()) {
        const reputation = reputationSnapshot.val();
        const isVerified = reputation.verifiedStatus === true;
        console.log(`Seller ${sellerId} legacy verification status:`, isVerified ? 'VERIFIED' : 'NOT VERIFIED');
        return isVerified;
      }

      console.log(`Seller ${sellerId} has no verification data`);
      return false;
    } catch (error) {
      console.error('Error checking seller verification status:', error);
      return false;
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Create a direct order between farmer and buyer
  async createDirectOrder(
    buyerId: string,
    farmerId: string,
    items: OrderItem[],
    shippingAddress: Order['shippingAddress'],
    paymentMethod: PaymentMethod,
    deliveryOption: 'self_pickup' | 'delivery',
    deliveryAgentId?: string
  ): Promise<string> {
    try {
      // Prevent users from buying their own products
      if (buyerId === farmerId) {
        throw new Error('Users cannot purchase their own products');
      }

      // Calculate total amount
      const totalAmount = items.reduce((total, item) => total + item.totalPrice, 0);

      // Create order object
      const order = {
        userId: buyerId,
        sellerId: farmerId,
        items,
        totalAmount,
        status: 'pending' as OrderStatus,
        paymentStatus: (paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed') as PaymentStatus,
        paymentMethod,
        shippingAddress,
        deliveryOption,
        deliveryAgentId,
        isDirectFarmerOrder: true, // Flag for direct farmer-to-buyer orders
        commissionPercentage: 0, // Zero commission for direct orders
      };

      // Create the order
      const orderId = await this.createOrder(order);

      return orderId;
    } catch (error) {
      console.error('Error creating direct order:', error);
      throw error;
    }
  }

  // Complete an order and update reputation
  async completeOrder(
    orderId: string,
    buyerRating?: { rating: number; comment?: string },
    farmerRating?: { rating: number; comment?: string }
  ): Promise<void> {
    try {
      // Get the order
      const order = await this.getOrder(orderId);

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Update order status to delivered
      await this.updateOrderStatus(orderId, 'delivered');

      // Add buyer rating for farmer if provided
      if (buyerRating) {
        await ReputationService.addRating({
          userId: order.userId,
          targetUserId: order.sellerId,
          orderId,
          rating: buyerRating.rating,
          comment: buyerRating.comment
        });
      }

      // Add farmer rating for buyer if provided
      if (farmerRating) {
        await ReputationService.addRating({
          userId: order.sellerId,
          targetUserId: order.userId,
          orderId,
          rating: farmerRating.rating,
          comment: farmerRating.comment
        });
      }
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  }

  // Get top-rated farmers
  async getTopRatedFarmers(limit: number = 10): Promise<UserProfile[]> {
    try {
      // Get all users
      const usersRef = database().ref('users');
      const snapshot = await usersRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const farmers: UserProfile[] = [];

      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val() as UserProfile;

        // Only include farmers with reputation
        if (user.role !== 'farmer' || !user.reputation) {
          return undefined;
        }

        farmers.push(user);
        return undefined; // Needed for TypeScript
      });

      // Sort by rating and limit
      return farmers
        .sort((a, b) => {
          const ratingA = a.reputation?.rating || 0;
          const ratingB = b.reputation?.rating || 0;

          // If ratings are equal, sort by number of ratings
          if (ratingA === ratingB) {
            return (b.reputation?.totalRatings || 0) - (a.reputation?.totalRatings || 0);
          }

          return ratingB - ratingA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top-rated farmers:', error);
      throw error;
    }
  }

  // Get zero-commission products (direct from farmer)
  async getZeroCommissionProducts(): Promise<Product[]> {
    try {
      // Get all products
      const productsRef = database().ref('products');
      const snapshot = await productsRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const products: Product[] = [];
      const userVerificationPromises: Promise<{userId: string, isVerified: boolean}>[] = [];

      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val() as Product;

        // Only include products from verified farmers
        if (product.isDirectFromFarmer && product.isVerified) {
          products.push(product);

          // Queue up verification status check for each seller
          userVerificationPromises.push(
            this.checkSellerVerificationStatus(product.sellerId)
              .then(isVerified => ({ userId: product.sellerId, isVerified }))
          );
        }
        return undefined; // Needed for TypeScript
      });

      // Wait for all verification checks to complete
      const verificationResults = await Promise.all(userVerificationPromises);

      // Create a map of user IDs to verification status
      const verificationMap = new Map<string, boolean>();
      verificationResults.forEach(result => {
        verificationMap.set(result.userId, result.isVerified);
      });

      // Update products with seller verification status
      products.forEach(product => {
        product.sellerVerified = verificationMap.get(product.sellerId) || false;
        console.log(`Direct farmer product ${product.name} (${product.id}) seller verification:`, product.sellerVerified ? 'VERIFIED' : 'NOT VERIFIED');
      });

      return products;
    } catch (error) {
      console.error('Error getting zero-commission products:', error);
      throw error;
    }
  }
}

export default new MarketplaceService();
