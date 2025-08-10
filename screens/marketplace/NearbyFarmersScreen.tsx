import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { UserProfile } from '../../context/AuthContext';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

const NearbyFarmersScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmers, setFarmers] = useState<UserProfile[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  // Load nearby farmers
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  // Refresh control
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNearbyFarmers();
    setRefreshing(false);
  };
  
  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        await getUserLocation();
      } else {
        setLocationPermission(false);
        setLoading(false);
        Alert.alert(
          'Location Permission Denied',
          'We need your location to find nearby farmers. Please enable location services in your device settings.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      setLoading(false);
    }
  };
  
  // Get user location
  const getUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      await loadNearbyFarmers(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting user location:', error);
      setLoading(false);
      
      // Try to use user's profile location if available
      if (userProfile?.location) {
        setUserLocation({
          latitude: userProfile.location.latitude,
          longitude: userProfile.location.longitude,
        });
        
        await loadNearbyFarmers(
          userProfile.location.latitude,
          userProfile.location.longitude
        );
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please try again later.'
        );
      }
    }
  };
  
  // Load nearby farmers
  const loadNearbyFarmers = async (
    latitude?: number,
    longitude?: number
  ) => {
    try {
      setLoading(true);
      
      // Use provided coordinates or user location
      const lat = latitude || userLocation?.latitude;
      const lng = longitude || userLocation?.longitude;
      
      if (!lat || !lng) {
        throw new Error('Location coordinates not available');
      }
      
      // Get nearby farmers
      const nearbyFarmers = await MarketplaceService.getNearbyFarmers(lat, lng, 50);
      setFarmers(nearbyFarmers);
    } catch (error) {
      console.error('Error loading nearby farmers:', error);
      Alert.alert('Error', 'Failed to load nearby farmers');
    } finally {
      setLoading(false);
    }
  };
  
  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return 'Unknown distance';
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    
    return `${distance.toFixed(1)} km`;
  };
  
  // Format rating
  const formatRating = (rating?: number) => {
    if (!rating) return '0.0';
    return rating.toFixed(1);
  };
  
  // Render a farmer item
  const renderFarmerItem = ({ item }: { item: UserProfile }) => (
    <Card style={styles.farmerCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('FarmerStorefront' as never, { farmerId: item.uid } as never)}
      >
        <View style={styles.farmerCardContent}>
          <View style={styles.farmerImageContainer}>
            {item.farmDetails?.images && item.farmDetails.images.length > 0 ? (
              <Image
                source={{ uri: item.farmDetails.images[0] }}
                style={styles.farmerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.farmerImagePlaceholder}>
                <Ionicons name="person" size={32} color={colors.lightGray} />
              </View>
            )}
          </View>
          
          <View style={styles.farmerInfo}>
            <View style={styles.farmerNameContainer}>
              <Text style={styles.farmerName}>
                {item.displayName || 'Farmer'}
              </Text>
              
              {item.reputation?.verifiedStatus && (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              )}
            </View>
            
            <Text style={styles.farmName}>
              {item.farmDetails?.name || 'Farm'}
            </Text>
            
            <View style={styles.farmerMeta}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={colors.secondary} />
                <Text style={styles.ratingText}>
                  {formatRating(item.reputation?.rating)}
                </Text>
              </View>
              
              <View style={styles.distanceContainer}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.distanceText}>
                  {formatDistance(item.distance)}
                </Text>
              </View>
            </View>
            
            {item.reputation?.badges && item.reputation.badges.length > 0 && (
              <View style={styles.badgesContainer}>
                {item.reputation.badges.slice(0, 2).map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
                
                {item.reputation.badges.length > 2 && (
                  <Text style={styles.moreBadges}>+{item.reputation.badges.length - 2}</Text>
                )}
              </View>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding nearby farmers...</Text>
      </View>
    );
  }
  
  // Location permission denied
  if (locationPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Nearby Farmers</Text>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.permissionDenied}>
          <Ionicons name="location-off" size={64} color={colors.lightGray} />
          <Text style={styles.permissionDeniedTitle}>Location Access Required</Text>
          <Text style={styles.permissionDeniedText}>
            We need access to your location to find nearby farmers. Please enable location services in your device settings.
          </Text>
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Nearby Farmers</Text>
        
        <View style={styles.placeholder} />
      </View>
      
      {farmers.length > 0 ? (
        <FlatList
          data={farmers}
          renderItem={renderFarmerItem}
          keyExtractor={item => item.uid}
          contentContainerStyle={styles.farmersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No Farmers Found Nearby</Text>
          <Text style={styles.emptyText}>
            We couldn't find any farmers in your area. Try expanding your search radius or check back later.
          </Text>
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  loadingText: {
    marginTop: spacing.small,
    ...typography.body,
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    ...shadows.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  farmersList: {
    padding: spacing.medium,
  },
  farmerCard: {
    marginBottom: spacing.medium,
  },
  farmerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
  },
  farmerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.lightBackground,
    ...shadows.small,
  },
  farmerImage: {
    width: '100%',
    height: '100%',
  },
  farmerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
  },
  farmerInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  farmerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginRight: spacing.tiny,
  },
  farmName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  farmerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.tiny,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: spacing.tiny,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: spacing.tiny,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny / 2,
    borderRadius: borderRadius.small,
    marginRight: spacing.small,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
  },
  moreBadges: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  retryButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  permissionDeniedTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  permissionDeniedText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
});

export default NearbyFarmersScreen;
