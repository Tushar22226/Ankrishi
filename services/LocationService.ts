import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

/**
 * Service for handling location-related functionality
 */
class LocationService {
  /**
   * Request location permissions from the user
   * @returns Promise resolving to a boolean indicating if permission was granted
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   * @returns Promise resolving to a boolean indicating if permission is granted
   */
  async checkLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Get the current location of the user
   * @returns Promise resolving to the user's location or null if unavailable
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const hasPermission = await this.checkLocationPermission();
      
      if (!hasPermission) {
        const granted = await this.requestLocationPermission();
        if (!granted) return null;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get an address from coordinates using reverse geocoding
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   * @returns Promise resolving to an address string or null if unavailable
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode.length > 0) {
        const addressParts = [
          geocode[0].district,
          geocode[0].city,
          geocode[0].region,
          geocode[0].postalCode,
        ].filter(Boolean);
        
        return addressParts.join(', ');
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  /**
   * Show an alert explaining why location permissions are needed
   * @param onRetry Callback function to retry requesting permissions
   */
  showLocationPermissionAlert(onRetry?: () => void): void {
    Alert.alert(
      'Location Access Required',
      'FarmConnects needs access to your location to provide you with location-based services such as finding nearby farmers, weather forecasts, and crop recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Location.openSettings();
            } else {
              // For Android
              Location.requestForegroundPermissionsAsync();
            }
          },
        },
        ...(onRetry ? [{ text: 'Retry', onPress: onRetry }] : []),
      ]
    );
  }
}

export default new LocationService();
