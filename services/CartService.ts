import { database } from '../firebase/config';
import { Product } from '../models/Product';

// Define cart item interface
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  discountedPrice: number | null;
  quantity: number;
  image: string;
  seller: string;
  sellerId: string;
  stock: number;
}

class CartService {
  // Add item to cart
  async addToCart(userId: string, product: Product, quantity: number = 1): Promise<void> {
    try {
      // Check if user is trying to add their own product
      if (userId === product.sellerId) {
        throw new Error('You cannot add your own product to cart');
      }

      // Check if product is in stock
      if (product.stock < quantity) {
        throw new Error(`Only ${product.stock} units available`);
      }

      // Reference to user's cart
      const cartRef = database().ref(`carts/${userId}`);

      // Check if item already exists in cart
      const snapshot = await cartRef.orderByChild('productId').equalTo(product.id).once('value');
      
      if (snapshot.exists()) {
        // Item already exists, update quantity
        const cartItemId = Object.keys(snapshot.val())[0];
        const currentItem = snapshot.val()[cartItemId];
        
        // Check if new quantity exceeds stock
        if (currentItem.quantity + quantity > product.stock) {
          throw new Error(`Cannot add ${quantity} more units. Only ${product.stock - currentItem.quantity} more units available.`);
        }
        
        // Update quantity
        await cartRef.child(cartItemId).update({
          quantity: currentItem.quantity + quantity,
          updatedAt: Date.now()
        });
      } else {
        // Item doesn't exist, add new item
        const cartItem: CartItem = {
          id: cartRef.push().key!,
          productId: product.id,
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice || null,
          quantity,
          image: product.images[0]?.url || '',
          seller: product.sellerName,
          sellerId: product.sellerId,
          stock: product.stock
        };
        
        // Add to cart
        await cartRef.child(cartItem.id).set({
          ...cartItem,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Get cart items
  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      // Reference to user's cart
      const cartRef = database().ref(`carts/${userId}`);
      
      // Get cart items
      const snapshot = await cartRef.once('value');
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const cartItems: CartItem[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const item = childSnapshot.val() as CartItem;
        cartItems.push(item);
        return undefined; // Needed for TypeScript
      });
      
      return cartItems;
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItemQuantity(userId: string, itemId: string, quantity: number): Promise<void> {
    try {
      // Check if quantity is valid
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      
      // Reference to cart item
      const cartItemRef = database().ref(`carts/${userId}/${itemId}`);
      
      // Get current item
      const snapshot = await cartItemRef.once('value');
      
      if (!snapshot.exists()) {
        throw new Error('Cart item not found');
      }
      
      const item = snapshot.val() as CartItem;
      
      // Check if new quantity exceeds stock
      if (quantity > item.stock) {
        throw new Error(`Only ${item.stock} units available`);
      }
      
      // Update quantity
      await cartItemRef.update({
        quantity,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(userId: string, itemId: string): Promise<void> {
    try {
      // Reference to cart item
      const cartItemRef = database().ref(`carts/${userId}/${itemId}`);
      
      // Remove item
      await cartItemRef.remove();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Clear cart
  async clearCart(userId: string): Promise<void> {
    try {
      // Reference to user's cart
      const cartRef = database().ref(`carts/${userId}`);
      
      // Remove all items
      await cartRef.remove();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Get cart count
  async getCartCount(userId: string): Promise<number> {
    try {
      // Reference to user's cart
      const cartRef = database().ref(`carts/${userId}`);
      
      // Get cart items
      const snapshot = await cartRef.once('value');
      
      if (!snapshot.exists()) {
        return 0;
      }
      
      // Count items
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        const item = childSnapshot.val() as CartItem;
        count += item.quantity;
        return undefined; // Needed for TypeScript
      });
      
      return count;
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  }
}

export default new CartService();
