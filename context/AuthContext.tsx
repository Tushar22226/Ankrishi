import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import { auth, database } from '../firebase/config';

// Define user roles
export type UserRole = 'farmer' | 'vendor' | 'buyer' | 'consultant';

// Define user profile interface
export interface UserProfile {
  uid: string;
  displayName?: string;
  username?: string;
  age?: number;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: number;
  profileComplete: boolean;
  // Reputation system fields
  reputation?: {
    rating: number; // Average rating (1-5)
    totalRatings: number; // Total number of ratings received
    successfulOrders: number; // Number of successfully completed orders
    verifiedStatus: boolean; // Whether the user is verified
    badges?: string[]; // Achievement badges (e.g., "Top Seller", "Organic Certified")
    reviews?: Array<{
      userId: string;
      orderId: string;
      rating: number;
      comment?: string;
      timestamp: number;
    }>;
  };
  // Verification status
  verification?: {
    status: 'unverified' | 'pending' | 'verified';
    lastRequestId?: string;
    lastRequestDate?: number;
  };
  // Farm details for farmers
  farmDetails?: {
    name?: string;
    description?: string;
    size?: number; // in acres/hectares
    sizeUnit?: 'acres' | 'hectares';
    cropTypes?: string[];
    farmingMethod?: 'conventional' | 'organic' | 'natural';
    certifications?: string[];
    establishedYear?: number;
    images?: string[];
    landOwned?: number;
    landUnit?: 'acres' | 'hectares';
    cattleCount?: number;
    monthlyIncome?: number;
  };
  // Vendor details
  vendorDetails?: {
    businessName?: string;
    businessType?: string;
    productsOffered?: string[];
    servicesOffered?: string[];
    yearEstablished?: number;
    businessDescription?: string;
    licenseNumber?: string;
  };
  // Consultant details
  consultantDetails?: {
    specialization?: string[];
    experience?: number;
    qualifications?: string[];
    servicesOffered?: string[];
    ratePerHour?: number;
    availability?: string;
  };
}

// Define a generic User type that works with both implementations
type User = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName?: string | null;
};

// Define auth context interface
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (verificationId: string, code: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize Firebase Auth
  useEffect(() => {
    console.log(`Initializing Firebase Auth on platform: ${Platform.OS}`);

    // With react-native-firebase, auth() is a function that returns the auth instance
    try {
      // Just accessing auth() will throw if Firebase isn't initialized
      auth(); // This will throw if Firebase isn't initialized
      console.log('Firebase auth is available and ready to use');
      setInitialized(true);
    } catch (error) {
      console.error('Firebase auth is not initialized yet:', error);
      // We'll still set initialized to true to allow the app to continue,
      // but this is a serious error that needs to be fixed
      setInitialized(true);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!initialized) {
      console.log('Auth not initialized yet, skipping auth state listener setup');
      return;
    }

    console.log('Setting up auth state listener');
    try {
      // Use auth().onAuthStateChanged for both implementations
      const unsubscribe = auth().onAuthStateChanged(async (currentUser: User | null) => {
        console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
        setUser(currentUser);

      if (currentUser) {
        try {
          // Fetch user profile from database
          const userRef = database().ref(`users/${currentUser.uid}`);
          const snapshot = await userRef.once('value');

          if (snapshot.exists()) {
            const profile = snapshot.val() as UserProfile;
            console.log('User profile loaded:', profile);
            console.log('Profile complete status:', profile.profileComplete);

            setUserProfile(profile);
          } else {
            console.log('No user profile found, creating initial profile');
            // Create a basic profile
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || undefined,
              phoneNumber: currentUser.phoneNumber || undefined,
              role: 'farmer', // Default role
              createdAt: Date.now(),
              profileComplete: false, // User needs to complete profile setup
              reputation: {
                rating: 0,
                totalRatings: 0,
                successfulOrders: 0,
                verifiedStatus: false,
                badges: [],
                reviews: []
              },
              verification: {
                status: 'unverified'
              }
            };

            await userRef.set(initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
      });

      console.log('Auth state listener set up successfully');
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
      // Return a no-op function as the cleanup function
      return () => {};
    }
  }, [initialized]);

  // Sign up with email
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      // Create initial user profile
      const initialProfile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        role: 'farmer', // Default role
        createdAt: Date.now(),
        profileComplete: false, // Profile is not complete until all required fields are filled
        reputation: {
          rating: 0,
          totalRatings: 0,
          successfulOrders: 0,
          verifiedStatus: false,
          badges: [],
          reviews: []
        },
        verification: {
          status: 'unverified'
        }
      };

      await database().ref(`users/${userCredential.user.uid}`).set(initialProfile);
      setUserProfile(initialProfile);

      console.log('Created initial profile with profileComplete=false');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign in with email
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign in with phone
  const signInWithPhone = async (verificationId: string, code: string) => {
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, code);
      await auth().signInWithCredential(credential);
    } catch (error) {
      console.error('Error signing in with phone:', error);
      throw error;
    }
  };

  // Log out
  const logOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('Updating user profile for user:', user.uid);
      const userRef = database().ref(`users/${user.uid}`);
      const snapshot = await userRef.once('value');

      if (snapshot.exists()) {
        const currentProfile = snapshot.val() as UserProfile;
        console.log('Current profile:', currentProfile);

        // Create updated profile by merging current profile with new data
        const updatedProfile = { ...currentProfile, ...profile };
        console.log('Updated profile to be saved:', updatedProfile);

        // Save to database
        await userRef.set(updatedProfile);
        console.log('Profile saved to database successfully');

        // Update local state
        setUserProfile(updatedProfile);
        console.log('Local userProfile state updated');

        // Force a refresh of the profile from the database to ensure we have the latest data
        const refreshSnapshot = await userRef.once('value');
        if (refreshSnapshot.exists()) {
          const refreshedProfile = refreshSnapshot.val() as UserProfile;
          console.log('Refreshed profile from database:', refreshedProfile);
          setUserProfile(refreshedProfile);
        }
      } else {
        console.error('User profile does not exist in database');
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithPhone,
    logOut,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
