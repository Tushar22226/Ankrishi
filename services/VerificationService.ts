import { database, storage } from '../firebase/config';
import { UserProfile, UserRole } from '../context/AuthContext';

export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export interface VerificationRequest {
  id: string;
  userId: string;
  userRole: UserRole;
  status: VerificationStatus;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
  
  // Common fields
  fullName: string;
  phoneNumber: string;
  selfiePhotoUrl?: string;
  
  // Farmer specific fields
  farmerId?: string;
  farmerIdPhotoUrl?: string;
  farmLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  farmingType?: string;
  
  // Vendor specific fields (individual)
  shopName?: string;
  shopType?: string;
  businessLicenseNumber?: string;
  businessLicensePhotoUrl?: string;
  shopLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  shopPhotoUrl?: string;
  isCompany?: boolean;
  
  // Company specific fields
  companyName?: string;
  companyRepName?: string;
  companyEmail?: string;
  companyRegistrationNumber?: string;
  companyRegistrationPhotoUrl?: string;
  companyAddress?: string;
  companyLogoUrl?: string;
  authorizationLetterUrl?: string;
  
  // Consultant specific fields
  expertise?: string;
  qualification?: string;
  qualificationPhotoUrl?: string;
  experience?: string;
  consultantId?: string;
  portfolioLink?: string;
}

class VerificationService {
  // Submit a verification request
  async submitVerificationRequest(request: Omit<VerificationRequest, 'id' | 'status' | 'submittedAt'>): Promise<string> {
    try {
      // Create a new verification request
      const verificationRef = database().ref('verificationRequests').push();
      
      const verificationRequest: VerificationRequest = {
        ...request,
        id: verificationRef.key!,
        status: 'pending',
        submittedAt: Date.now(),
      };
      
      // Save the verification request
      await verificationRef.set(verificationRequest);
      
      // Update the user's verification status
      await database().ref(`users/${request.userId}/verification`).update({
        status: 'pending',
        lastRequestId: verificationRef.key,
        lastRequestDate: Date.now(),
      });
      
      return verificationRef.key!;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }
  
  // Get a user's verification status
  async getVerificationStatus(userId: string): Promise<{
    status: VerificationStatus;
    lastRequestId?: string;
    lastRequestDate?: number;
  }> {
    try {
      const snapshot = await database().ref(`users/${userId}/verification`).once('value');
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      return { status: 'unverified' };
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw error;
    }
  }
  
  // Get a verification request by ID
  async getVerificationRequest(requestId: string): Promise<VerificationRequest | null> {
    try {
      const snapshot = await database().ref(`verificationRequests/${requestId}`).once('value');
      
      if (snapshot.exists()) {
        return snapshot.val() as VerificationRequest;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting verification request:', error);
      throw error;
    }
  }
  
  // Get all verification requests for a user
  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    try {
      const snapshot = await database()
        .ref('verificationRequests')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      
      if (snapshot.exists()) {
        const requests: VerificationRequest[] = [];
        
        snapshot.forEach((childSnapshot) => {
          requests.push(childSnapshot.val() as VerificationRequest);
        });
        
        return requests;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting user verification requests:', error);
      throw error;
    }
  }
  
  // Upload a verification document
  async uploadVerificationDocument(userId: string, uri: string, documentType: string): Promise<string> {
    try {
      const filename = `verification/${userId}/${documentType}_${Date.now()}`;
      const reference = storage().ref(filename);
      
      await reference.putFile(uri);
      
      const url = await reference.getDownloadURL();
      
      return url;
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw error;
    }
  }
  
  // Check if user has enough successful orders for verification
  async hasEnoughSuccessfulOrders(userId: string): Promise<boolean> {
    try {
      const userRef = database().ref(`users/${userId}`);
      const snapshot = await userRef.once('value');
      
      if (snapshot.exists()) {
        const userProfile = snapshot.val() as UserProfile;
        
        // Check if user has at least 5 successful orders
        return (userProfile.reputation?.successfulOrders || 0) >= 5;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking successful orders:', error);
      throw error;
    }
  }
}

export default new VerificationService();
