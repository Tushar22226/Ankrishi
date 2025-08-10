import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../theme';

interface LocationPermissionProviderProps {
  children: React.ReactNode;
}

/**
 * Component that requests location permissions when the app starts
 */
const LocationPermissionProvider: React.FC<LocationPermissionProviderProps> = ({ children }) => {
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    // Request location permission when the component mounts
    const checkPermission = async () => {
      try {
        console.log('Checking location permission...');

        // Check if permission is already granted
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') {
          // Show modal explaining why we need location permission
          setShowPermissionModal(true);
        } else {
          // Permission already granted, continue
          setPermissionChecked(true);
        }
      } catch (error) {
        console.error('Error in LocationPermissionProvider:', error);
        // Continue anyway in case of error
        setPermissionChecked(true);
      }
    };

    checkPermission();
  }, []);

  // Handle requesting permission after user sees explanation
  const handleRequestPermission = async () => {
    try {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Show system settings alert if permission denied
        showLocationPermissionAlert();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    } finally {
      // Hide modal and continue with the app regardless of outcome
      setShowPermissionModal(false);
      setPermissionChecked(true);
    }
  };

  // Show an alert explaining why location permissions are needed
  const showLocationPermissionAlert = (): void => {
    Alert.alert(
      'Location Access Required',
      'FarmConnects needs access to your location to provide you with location-based services such as finding nearby farmers, weather forecasts, and crop recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settings',
          onPress: () => {
            Location.openSettings();
          },
        },
      ]
    );
  };

  // Handle skipping permission
  const handleSkipPermission = () => {
    setShowPermissionModal(false);
    setPermissionChecked(true);
  };

  return (
    <>
      {/* Permission explanation modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={48} color={colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Location Access</Text>

            <Text style={styles.modalText}>
              FarmConnects uses your location to provide you with:
            </Text>

            <View style={styles.benefitContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text style={styles.benefitText}>Find nearby farmers</Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="cloudy" size={24} color={colors.primary} />
                <Text style={styles.benefitText}>Local weather forecasts</Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="leaf" size={24} color={colors.primary} />
                <Text style={styles.benefitText}>Crop recommendations</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipPermission}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.allowButton}
                onPress={handleRequestPermission}
              >
                <Text style={styles.allowButtonText}>Allow Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Render children once permission flow is complete */}
      {permissionChecked ? children : null}
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  benefitText: {
    fontSize: 15,
    color: '#4B5563',
    marginLeft: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  allowButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  allowButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default LocationPermissionProvider;
