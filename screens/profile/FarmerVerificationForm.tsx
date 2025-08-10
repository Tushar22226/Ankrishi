import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import VerificationService from '../../services/VerificationService';
import LocationService from '../../services/LocationService';

const FarmerVerificationForm = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [farmerId, setFarmerId] = useState('');
  const [farmerIdPhoto, setFarmerIdPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [farmingType, setFarmingType] = useState('');
  const [farmLocation, setFarmLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(userProfile?.location || null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    fullName: '',
    phoneNumber: '',
    farmerId: '',
    farmerIdPhoto: '',
    selfiePhoto: '',
    farmingType: '',
    farmLocation: '',
  });

  // Handle image selection
  const handleSelectImage = async (type: 'farmerId' | 'selfie') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'farmerId') {
          setFarmerIdPhoto(result.assets[0].uri);
          setErrors({ ...errors, farmerIdPhoto: '' });
        } else {
          setSelfiePhoto(result.assets[0].uri);
          setErrors({ ...errors, selfiePhoto: '' });
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle camera capture
  const handleCaptureImage = async (type: 'farmerId' | 'selfie') => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'farmerId') {
          setFarmerIdPhoto(result.assets[0].uri);
          setErrors({ ...errors, farmerIdPhoto: '' });
        } else {
          setSelfiePhoto(result.assets[0].uri);
          setErrors({ ...errors, selfiePhoto: '' });
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  // Handle location detection
  const handleDetectLocation = async () => {
    try {
      setLocationLoading(true);

      const location = await LocationService.getCurrentLocation();

      if (!location) {
        Alert.alert('Error', 'Failed to detect location');
        setLocationLoading(false);
        return;
      }

      const address = await LocationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );

      setFarmLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || 'Unknown location',
      });

      setErrors({ ...errors, farmLocation: '' });
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert('Error', 'Failed to detect location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!fullName) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    } else {
      newErrors.fullName = '';
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else {
      newErrors.phoneNumber = '';
    }

    if (!farmerId) {
      newErrors.farmerId = 'Farmer ID is required';
      isValid = false;
    } else {
      newErrors.farmerId = '';
    }

    if (!farmerIdPhoto) {
      newErrors.farmerIdPhoto = 'Farmer ID photo is required';
      isValid = false;
    } else {
      newErrors.farmerIdPhoto = '';
    }

    if (!selfiePhoto) {
      newErrors.selfiePhoto = 'Selfie photo is required';
      isValid = false;
    } else {
      newErrors.selfiePhoto = '';
    }

    if (!farmingType) {
      newErrors.farmingType = 'Farming type is required';
      isValid = false;
    } else {
      newErrors.farmingType = '';
    }

    if (!farmLocation) {
      newErrors.farmLocation = 'Farm location is required';
      isValid = false;
    } else {
      newErrors.farmLocation = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setLoading(true);

      // Upload images
      let farmerIdPhotoUrl = '';
      let selfiePhotoUrl = '';

      if (farmerIdPhoto) {
        farmerIdPhotoUrl = await VerificationService.uploadVerificationDocument(
          userProfile.uid,
          farmerIdPhoto,
          'farmerId'
        );
      }

      if (selfiePhoto) {
        selfiePhotoUrl = await VerificationService.uploadVerificationDocument(
          userProfile.uid,
          selfiePhoto,
          'selfie'
        );
      }

      // Submit verification request
      await VerificationService.submitVerificationRequest({
        userId: userProfile.uid,
        userRole: userProfile.role,
        fullName,
        phoneNumber,
        farmerId,
        farmerIdPhotoUrl,
        selfiePhotoUrl,
        farmLocation: farmLocation || undefined,
        farmingType,
      });

      Alert.alert(
        'Verification Request Submitted',
        'Your verification request has been submitted and is pending review.',
        [{ text: 'OK', onPress: () => navigation.navigate('VerifyProfile') }]
      );
    } catch (error) {
      console.error('Error submitting verification request:', error);
      Alert.alert('Error', 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Farmer Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>
        Please provide the following information to verify your farmer account.
      </Text>

      <Card style={styles.formCard}>
        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            touched={true}
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.mediumGray} />}
          />

          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
            touched={true}
            leftIcon={<Ionicons name="call-outline" size={20} color={colors.mediumGray} />}
          />

          <Input
            label="Farmer ID / Kisan Credit Card Number"
            placeholder="Enter your Farmer ID or KCC number"
            value={farmerId}
            onChangeText={setFarmerId}
            error={errors.farmerId}
            touched={true}
            leftIcon={<Ionicons name="card-outline" size={20} color={colors.mediumGray} />}
          />

          <Text style={styles.sectionTitle}>Farmer ID Photo</Text>
          <View style={styles.imageUploadContainer}>
            {farmerIdPhoto ? (
              <Image source={{ uri: farmerIdPhoto }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={40} color={colors.mediumGray} />
                <Text style={styles.uploadPlaceholderText}>Upload ID Photo</Text>
              </View>
            )}

            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleSelectImage('farmerId')}
              >
                <Ionicons name="images-outline" size={20} color={colors.white} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleCaptureImage('farmerId')}
              >
                <Ionicons name="camera-outline" size={20} color={colors.white} />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {errors.farmerIdPhoto ? (
              <Text style={styles.errorText}>{errors.farmerIdPhoto}</Text>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Live Selfie Photo</Text>
          <View style={styles.imageUploadContainer}>
            {selfiePhoto ? (
              <Image source={{ uri: selfiePhoto }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="person-outline" size={40} color={colors.mediumGray} />
                <Text style={styles.uploadPlaceholderText}>Take Selfie</Text>
              </View>
            )}

            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleSelectImage('selfie')}
              >
                <Ionicons name="images-outline" size={20} color={colors.white} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleCaptureImage('selfie')}
              >
                <Ionicons name="camera-outline" size={20} color={colors.white} />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {errors.selfiePhoto ? (
              <Text style={styles.errorText}>{errors.selfiePhoto}</Text>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Farm Location</Text>
          <View style={styles.locationContainer}>
            {farmLocation ? (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.locationText}>{farmLocation.address}</Text>
              </View>
            ) : (
              <Text style={styles.locationPlaceholder}>No location detected</Text>
            )}

            <Button
              title={locationLoading ? 'Detecting...' : 'Detect Location'}
              onPress={handleDetectLocation}
              type="outline"
              size="small"
              loading={locationLoading}
              style={styles.locationButton}
            />

            {errors.farmLocation ? (
              <Text style={styles.errorText}>{errors.farmLocation}</Text>
            ) : null}
          </View>

          <Input
            label="Farming Type"
            placeholder="e.g., Crop, Dairy, Poultry, Horticulture"
            value={farmingType}
            onChangeText={setFarmingType}
            error={errors.farmingType}
            touched={true}
            leftIcon={<Ionicons name="leaf-outline" size={20} color={colors.mediumGray} />}
          />

          <Button
            title="Submit for Verification"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 18,
    paddingTop: getPlatformTopSpacing(),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E3A59',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 42,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
    marginHorizontal: 24,
    lineHeight: 22,
  },
  formCard: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  formContainer: {
    padding: 20,
    gap: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 10,
  },
  imageUploadContainer: {
    marginBottom: 20,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 10,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  imageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#EF4444',
    marginTop: 6,
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2E3A59',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  locationPlaceholder: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationButton: {
    alignSelf: 'flex-end',
  },
  submitButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 12,
  },
});

export default FarmerVerificationForm;
