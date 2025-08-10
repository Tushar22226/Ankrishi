import database from '@react-native-firebase/database';
import { UserProfile } from '../context/AuthContext';

interface RatingData {
  userId: string;
  targetUserId: string;
  orderId: string;
  rating: number;
  comment?: string;
}

class ReputationService {
  // Add a rating for a user
  async addRating(data: RatingData): Promise<void> {
    try {
      const { userId, targetUserId, orderId, rating, comment } = data;
      
      // Get the target user's profile
      const userRef = database().ref(`users/${targetUserId}`);
      const snapshot = await userRef.once('value');
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }
      
      const userProfile = snapshot.val() as UserProfile;
      
      // Initialize reputation if it doesn't exist
      if (!userProfile.reputation) {
        userProfile.reputation = {
          rating: 0,
          totalRatings: 0,
          successfulOrders: 0,
          verifiedStatus: false,
          badges: [],
          reviews: []
        };
      }
      
      // Initialize reviews array if it doesn't exist
      if (!userProfile.reputation.reviews) {
        userProfile.reputation.reviews = [];
      }
      
      // Check if this user has already rated this order
      const existingReviewIndex = userProfile.reputation.reviews.findIndex(
        review => review.orderId === orderId && review.userId === userId
      );
      
      const timestamp = Date.now();
      
      if (existingReviewIndex >= 0) {
        // Update existing review
        userProfile.reputation.reviews[existingReviewIndex] = {
          userId,
          orderId,
          rating,
          comment,
          timestamp
        };
      } else {
        // Add new review
        userProfile.reputation.reviews.push({
          userId,
          orderId,
          rating,
          comment,
          timestamp
        });
        
        // Increment successful orders count
        userProfile.reputation.successfulOrders += 1;
      }
      
      // Recalculate average rating
      const totalRatings = userProfile.reputation.reviews.length;
      const sumRatings = userProfile.reputation.reviews.reduce(
        (sum, review) => sum + review.rating, 
        0
      );
      
      userProfile.reputation.rating = totalRatings > 0 ? sumRatings / totalRatings : 0;
      userProfile.reputation.totalRatings = totalRatings;
      
      // Update badges based on new reputation
      userProfile.reputation.badges = this.calculateBadges(userProfile);
      
      // Update the user profile in the database
      await userRef.update({ reputation: userProfile.reputation });
    } catch (error) {
      console.error('Error adding rating:', error);
      throw error;
    }
  }
  
  // Get a user's reputation
  async getUserReputation(userId: string): Promise<UserProfile['reputation'] | null> {
    try {
      const userRef = database().ref(`users/${userId}`);
      const snapshot = await userRef.once('value');
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const userProfile = snapshot.val() as UserProfile;
      return userProfile.reputation || null;
    } catch (error) {
      console.error('Error getting user reputation:', error);
      throw error;
    }
  }
  
  // Calculate badges based on user's reputation
  private calculateBadges(userProfile: UserProfile): string[] {
    const badges: string[] = [];
    const { reputation } = userProfile;
    
    if (!reputation) return badges;
    
    // Verified badge
    if (reputation.verifiedStatus) {
      badges.push('Verified');
    }
    
    // Rating badges
    if (reputation.rating >= 4.5 && reputation.totalRatings >= 10) {
      badges.push('Top Rated');
    } else if (reputation.rating >= 4.0 && reputation.totalRatings >= 5) {
      badges.push('Highly Rated');
    }
    
    // Order volume badges
    if (reputation.successfulOrders >= 50) {
      badges.push('Experienced Seller');
    } else if (reputation.successfulOrders >= 20) {
      badges.push('Established Seller');
    } else if (reputation.successfulOrders >= 5) {
      badges.push('Trusted Seller');
    }
    
    // Add farming method badge if available
    if (userProfile.farmDetails?.farmingMethod === 'organic') {
      badges.push('Organic Farmer');
    } else if (userProfile.farmDetails?.farmingMethod === 'natural') {
      badges.push('Natural Farming');
    }
    
    return badges;
  }
  
  // Verify a user (typically done by admin or after document verification)
  async verifyUser(userId: string): Promise<void> {
    try {
      const userRef = database().ref(`users/${userId}`);
      const snapshot = await userRef.once('value');
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }
      
      const userProfile = snapshot.val() as UserProfile;
      
      // Initialize reputation if it doesn't exist
      if (!userProfile.reputation) {
        userProfile.reputation = {
          rating: 0,
          totalRatings: 0,
          successfulOrders: 0,
          verifiedStatus: true,
          badges: ['Verified'],
          reviews: []
        };
      } else {
        userProfile.reputation.verifiedStatus = true;
        
        // Update badges
        if (!userProfile.reputation.badges) {
          userProfile.reputation.badges = ['Verified'];
        } else if (!userProfile.reputation.badges.includes('Verified')) {
          userProfile.reputation.badges.push('Verified');
        }
      }
      
      // Update the user profile in the database
      await userRef.update({ reputation: userProfile.reputation });
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  }
}

export default new ReputationService();
