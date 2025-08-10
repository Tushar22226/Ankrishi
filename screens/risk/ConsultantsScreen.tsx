import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { database, storage } from '../../firebase/config';
import LoadingQuote from '../../components/LoadingQuote';

// Consultant interface
interface Consultant {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  consultantDetails?: {
    experience: number;
    specialization: string[];
    qualifications: string[];
  };
  experience?: number;
  specialization?: string[];
  qualifications?: string[];
  reputation?: {
    rating: number;
    totalRatings: number;
    successfulOrders: number;
  };
  rating?: number;
  bio?: string;
  isOnline?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distance?: number; // Distance in km from current user
}

const ConsultantsScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Fetch consultants from Firebase
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userProfile || !userProfile.location) {
          setError('Your location is not available. Please update your profile.');
          setLoading(false);
          return;
        }

        const userLat = userProfile.location.latitude;
        const userLon = userProfile.location.longitude;

        // Get users with role = 'consultant'
        const usersRef = database().ref('users');
        const snapshot = await usersRef
          .orderByChild('role')
          .equalTo('consultant')
          .once('value');

        if (!snapshot.exists()) {
          console.log('No consultants found');
          setConsultants([]);
          setLoading(false);
          return;
        }

        const consultantsList: Consultant[] = [];
        snapshot.forEach((childSnapshot) => {
          const consultant = childSnapshot.val();

          // Skip if no location data
          if (!consultant.location || !consultant.location.latitude || !consultant.location.longitude) {
            return false; // Continue iteration
          }

          // Calculate distance
          const distance = calculateDistance(
            userLat,
            userLon,
            consultant.location.latitude,
            consultant.location.longitude
          );

          // Only include consultants within 30km
          if (distance <= 30) {
            // Get specialization from consultantDetails
            const specialization = consultant.consultantDetails?.specialization
              ? Array.isArray(consultant.consultantDetails.specialization)
                ? consultant.consultantDetails.specialization[0]
                : consultant.consultantDetails.specialization
              : 'General Agriculture';

            // Format experience
            const experienceYears = consultant.consultantDetails?.experience || 1;
            const experienceText = `${experienceYears} ${experienceYears === 1 ? 'year' : 'years'}`;

            // Create bio if not available
            const bio = consultant.bio ||
              `Agricultural consultant with ${experienceText} of experience specializing in ${specialization}.`;

            consultantsList.push({
              uid: childSnapshot.key || '',
              displayName: consultant.displayName || 'Unknown Consultant',
              email: consultant.email || '',
              photoURL: consultant.photoURL || '',
              consultantDetails: consultant.consultantDetails,
              specialization: specialization,
              experience: experienceText,
              rating: consultant.reputation?.rating || 4.5,
              bio: bio,
              isOnline: consultant.isOnline || false,
              location: consultant.location,
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
            });
          }
          return false; // Continue iteration
        });

        // Sort by distance
        consultantsList.sort((a, b) => (a.distance || 999) - (b.distance || 999));

        setConsultants(consultantsList);
      } catch (err) {
        console.error('Error fetching consultants:', err);
        setError('Failed to load consultants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, [userProfile]);

  // Start chat with consultant
  const startChat = (consultant: Consultant) => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to chat with consultants');
      return;
    }

    // Create a chat ID using both user IDs (sorted to ensure consistency)
    const chatId = [userProfile.uid, consultant.uid].sort().join('_');

    // Create or update chat in Firebase
    const chatRef = database().ref(`chats/${chatId}`);
    chatRef.update({
      participants: {
        [userProfile.uid]: true,
        [consultant.uid]: true,
      },
      participantDetails: {
        [userProfile.uid]: {
          displayName: userProfile.displayName || 'You',
          photoURL: userProfile.photoURL || '',
          role: userProfile.role || 'farmer',
        },
        [consultant.uid]: {
          displayName: consultant.displayName,
          photoURL: consultant.photoURL || '',
          role: 'consultant',
          specialization: consultant.specialization,
        }
      },
      lastMessage: {
        text: 'Chat started',
        timestamp: database.ServerValue.TIMESTAMP,
        senderId: userProfile.uid,
      },
      createdAt: database.ServerValue.TIMESTAMP,
      updatedAt: database.ServerValue.TIMESTAMP,
    });

    // Update user's chats list
    database().ref(`users/${userProfile.uid}/chats/${chatId}`).set(true);
    database().ref(`users/${consultant.uid}/chats/${chatId}`).set(true);

    // Navigate to chat screen
    navigation.navigate('ChatScreen' as never, {
      chatId,
      recipientId: consultant.uid,
      recipientName: consultant.displayName,
      recipientPhoto: consultant.photoURL,
    } as never);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote
          loadingText="Finding the best agricultural consultants..."
          showIndicator={true}
          indicatorSize="large"
          indicatorColor={colors.primary}
        />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Advisors</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Available Agricultural Consultants</Text>
        <Text style={styles.description}>
          Connect with experienced agricultural consultants who can provide personalized
          advice on risk management, crop selection, and farming practices.
        </Text>

        {consultants.length === 0 ? (
          <Card style={styles.noConsultantsCard}>
            <Ionicons name="people" size={48} color={colors.textSecondary} style={styles.noConsultantsIcon} />
            <Text style={styles.noConsultantsText}>No consultants available at the moment.</Text>
            <Text style={styles.noConsultantsSubtext}>Please check back later or contact support for assistance.</Text>
          </Card>
        ) : (
          consultants.map((consultant) => (
            <Card key={consultant.uid} style={styles.consultantCard}>
              <View style={styles.consultantHeader}>
                <View style={styles.profileImageContainer}>
                  <Image
                    source={
                      consultant.photoURL
                        ? { uri: consultant.photoURL }
                        : { uri: `https://via.placeholder.com/100/2196F3/FFFFFF?text=${consultant.displayName.charAt(0)}` }
                    }
                    style={styles.profileImage}
                  />
                  {consultant.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.consultantInfo}>
                  <Text style={styles.consultantName}>{consultant.displayName}</Text>
                  <Text style={styles.consultantSpecialization}>{consultant.specialization}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color={colors.warning} />
                    <Text style={styles.ratingText}>{consultant.rating.toFixed(1)}</Text>
                    <Text style={styles.experienceText}> • {consultant.experience}</Text>
                    {consultant.distance !== undefined && (
                      <View style={styles.distanceContainer}>
                        <Ionicons name="location" size={14} color={colors.primary} style={styles.distanceIcon} />
                        <Text style={styles.distanceText}>{consultant.distance} km away</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.consultantBio}>{consultant.bio}</Text>

              <Button
                title="Chat with Advisor"
                onPress={() => startChat(consultant)}
                style={styles.chatButton}
                icon={<Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.white} />}
              />
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.md,
  },
  noConsultantsCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noConsultantsIcon: {
    marginBottom: spacing.md,
  },
  noConsultantsText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noConsultantsSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  consultantCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  consultantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  consultantInfo: {
    flex: 1,
  },
  consultantName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  consultantSpecialization: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs / 2,
  },
  experienceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 4,
    borderRadius: borderRadius.sm,
  },
  distanceIcon: {
    marginRight: spacing.xs / 2,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  consultantBio: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  chatButton: {
    marginTop: spacing.sm,
  },
});

export default ConsultantsScreen;
