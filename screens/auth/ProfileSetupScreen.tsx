import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
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
import { UserRole, UserProfile } from '../../context/AuthContext';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { storage, database } from '../../firebase/config';

const ProfileSetupScreen = () => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Role-specific form state
  // Farmer details
  const [landOwned, setLandOwned] = useState('');
  const [landUnit, setLandUnit] = useState<'acres' | 'hectares'>('acres');
  const [cattleCount, setCattleCount] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Vendor details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [productsOffered, setProductsOffered] = useState('');

  // Consultant details
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [qualifications, setQualifications] = useState('');

  // Form validation
  const [errors, setErrors] = useState({
    displayName: '',
    username: '',
    age: '',
    phoneNumber: '',
    landOwned: '',
    cattleCount: '',
    monthlyIncome: '',
    businessName: '',
    businessType: '',
    productsOffered: '',
    specialization: '',
    experience: '',
    qualifications: '',
  });

  // Handle profile image selection
  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle location detection
  const handleDetectLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your location');
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = `${geocode[0].district || ''}, ${geocode[0].city || ''}, ${geocode[0].region || ''}, ${geocode[0].postalCode || ''}`;

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address.trim(),
        });
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert('Error', 'Failed to detect location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Upload profile image to Firebase Storage
  const uploadProfileImage = async (): Promise<string | null> => {
    if (!profileImage || !user) {
      console.warn('No profile image or user available for upload');
      return null;
    }

    try {
      console.log('Starting profile image upload process');

      // Create a reference to the file in Firebase Storage
      const imageRef = storage().ref(`profile_images/${user.uid}`);
      console.log('Created storage reference:', `profile_images/${user.uid}`);

      // Convert image URI to blob
      console.log('Fetching image from URI');
      const response = await fetch(profileImage);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      console.log('Converting image to blob');
      const blob = await response.blob();

      if (!blob) {
        throw new Error('Failed to convert image to blob');
      }

      console.log('Uploading blob to Firebase Storage, size:', blob.size);

      // Upload the blob to Firebase Storage
      const uploadTask = imageRef.put(blob);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(2) + '%');
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        }
      );

      // Wait for upload to complete
      await uploadTask;
      console.log('Upload completed successfully');

      // Get the download URL
      const downloadURL = await imageRef.getDownloadURL();
      console.log('Image uploaded successfully. URL:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      // Don't throw the error, just return null and let the caller handle it
      return null;
    }
  };

  // Handle profile setup
  const handleProfileSetup = async () => {
    // Validate form
    let isValid = true;
    const newErrors = { ...errors };

    // Basic profile validation - these are required for all users
    if (!displayName) {
      newErrors.displayName = 'Name is required';
      isValid = false;
    } else {
      newErrors.displayName = '';
    }

    if (!username) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else {
      newErrors.username = '';
    }

    if (!age) {
      newErrors.age = 'Age is required';
      isValid = false;
    } else if (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 120) {
      newErrors.age = 'Please enter a valid age (18-120)';
      isValid = false;
    } else {
      newErrors.age = '';
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else {
      newErrors.phoneNumber = '';
    }

    // Role-specific validation - each role has its own required fields
    if (role === 'farmer') {
      // For farmers, land owned is required
      if (!landOwned) {
        newErrors.landOwned = 'Land area is required';
        isValid = false;
      } else if (isNaN(Number(landOwned)) || Number(landOwned) <= 0) {
        newErrors.landOwned = 'Please enter a valid land area';
        isValid = false;
      } else {
        newErrors.landOwned = '';
      }

      // Cattle count can be 0 but must be a valid number if provided
      if (cattleCount && (isNaN(Number(cattleCount)) || Number(cattleCount) < 0)) {
        newErrors.cattleCount = 'Please enter a valid number';
        isValid = false;
      } else {
        newErrors.cattleCount = '';
      }
    } else if (role === 'vendor') {
      // For vendors, business name and type are required
      if (!businessName) {
        newErrors.businessName = 'Business name is required';
        isValid = false;
      } else {
        newErrors.businessName = '';
      }

      if (!businessType) {
        newErrors.businessType = 'Business type is required';
        isValid = false;
      } else {
        newErrors.businessType = '';
      }

      if (!productsOffered) {
        newErrors.productsOffered = 'Products/services offered is required';
        isValid = false;
      } else {
        newErrors.productsOffered = '';
      }
    } else if (role === 'consultant') {
      // For consultants, specialization and experience are required
      if (!specialization) {
        newErrors.specialization = 'Specialization is required';
        isValid = false;
      } else {
        newErrors.specialization = '';
      }

      if (!experience) {
        newErrors.experience = 'Experience is required';
        isValid = false;
      } else if (isNaN(Number(experience)) || Number(experience) < 0) {
        newErrors.experience = 'Please enter a valid number';
        isValid = false;
      } else {
        newErrors.experience = '';
      }

      if (!qualifications) {
        newErrors.qualifications = 'Qualifications are required';
        isValid = false;
      } else {
        newErrors.qualifications = '';
      }
    }

    setErrors(newErrors);

    if (!isValid) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    // Submit form
    setLoading(true);

    try {
      console.log('Submitting profile data with all required fields');

      // Upload profile image if selected
      let photoURL = null;
      if (profileImage) {
        try {
          photoURL = await uploadProfileImage();
          if (!photoURL) {
            console.warn('Failed to upload profile image, continuing without image');
          }
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          // Continue without image if upload fails
        }
      }

      const profileData: Partial<UserProfile> = {
        displayName,
        username,
        age: Number(age),
        phoneNumber,
        role,
        location: location || undefined,
        profileComplete: true, // Mark as complete only when all required fields are filled
      };

      // Add photoURL if image was uploaded successfully
      if (photoURL) {
        profileData.photoURL = photoURL;
      }

      // Add role-specific details
      if (role === 'farmer') {
        profileData.farmDetails = {
          landOwned: Number(landOwned),
          landUnit,
          cattleCount: cattleCount ? Number(cattleCount) : 0,
          monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        };
      } else if (role === 'vendor') {
        profileData.vendorDetails = {
          businessName,
          businessType,
          productsOffered: [productsOffered],
        };
      } else if (role === 'consultant') {
        profileData.consultantDetails = {
          specialization: [specialization],
          experience: Number(experience),
          qualifications: [qualifications],
        };
      }

      console.log('Updating user profile with data:', JSON.stringify(profileData, null, 2));

      await updateUserProfile(profileData);
      console.log('Profile updated successfully with profileComplete=true');

      // Add a short delay to allow the database update to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message
      Alert.alert(
        'Profile Setup Complete',
        'Your profile has been successfully set up. You will now be redirected to the home screen.',
        [{
          text: 'OK',
          onPress: () => {
            // Force a reload of the user profile after the alert is dismissed
            if (user) {
              console.log('Forcing profile refresh after setup completion');
              database().ref(`users/${user.uid}`).once('value').then(snapshot => {
                if (snapshot.exists()) {
                  const refreshedProfile = snapshot.val();
                  console.log('Refreshed profile after setup:', refreshedProfile);
                }
              }).catch(error => {
                console.error('Error refreshing profile:', error);
              });
            }
          }
        }]
      );

      // Navigation to home is handled by the auth context
    } catch (error: any) {
      console.error('Profile setup failed:', error);
      Alert.alert(
        'Profile Setup Failed',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Tell us more about yourself</Text>
        </View>

        <Card style={styles.card}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              style={styles.profileImageButton}
              onPress={handleSelectImage}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={40} color={colors.lightGray} />
                </View>
              )}
              <View style={styles.profileImageEditButton}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Form */}
          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              touched={true}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.mediumGray} />}
            />

            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              touched={true}
              leftIcon={<Ionicons name="at-outline" size={20} color={colors.mediumGray} />}
            />

            <Input
              label="Age"
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              error={errors.age}
              touched={true}
              leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.mediumGray} />}
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

            {/* Role Selection */}
            <Text style={styles.sectionTitle}>I am a:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'farmer' && styles.activeRoleButton,
                ]}
                onPress={() => setRole('farmer')}
              >
                <Ionicons
                  name="leaf"
                  size={24}
                  color={role === 'farmer' ? colors.primary : colors.mediumGray}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'farmer' && styles.activeRoleText,
                  ]}
                >
                  Farmer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'vendor' && styles.activeRoleButton,
                ]}
                onPress={() => setRole('vendor')}
              >
                <Ionicons
                  name="business"
                  size={24}
                  color={role === 'vendor' ? colors.primary : colors.mediumGray}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'vendor' && styles.activeRoleText,
                  ]}
                >
                  Vendor
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'buyer' && styles.activeRoleButton,
                ]}
                onPress={() => setRole('buyer')}
              >
                <Ionicons
                  name="cart"
                  size={24}
                  color={role === 'buyer' ? colors.primary : colors.mediumGray}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'buyer' && styles.activeRoleText,
                  ]}
                >
                  Buyer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'consultant' && styles.activeRoleButton,
                ]}
                onPress={() => setRole('consultant')}
              >
                <Ionicons
                  name="briefcase"
                  size={24}
                  color={role === 'consultant' ? colors.primary : colors.mediumGray}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'consultant' && styles.activeRoleText,
                  ]}
                >
                  Consultant
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role-specific questions */}
            {role === 'farmer' && (
              <View style={styles.roleQuestionsContainer}>
                <Text style={styles.sectionTitle}>Farmer Details</Text>

                <View style={styles.rowContainer}>
                  <View style={styles.inputRow}>
                    <Input
                      label="Land Owned"
                      placeholder="Enter amount"
                      value={landOwned}
                      onChangeText={setLandOwned}
                      keyboardType="numeric"
                      error={errors.landOwned}
                      touched={true}
                      containerStyle={styles.rowInput}
                    />

                    <View style={styles.unitSelector}>
                      <Text style={styles.unitLabel}>Unit</Text>
                      <View style={styles.unitButtons}>
                        <TouchableOpacity
                          style={[
                            styles.unitButton,
                            landUnit === 'acres' && styles.activeUnitButton,
                          ]}
                          onPress={() => setLandUnit('acres')}
                        >
                          <Text style={[
                            styles.unitButtonText,
                            landUnit === 'acres' && styles.activeUnitButtonText,
                          ]}>
                            Acres
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.unitButton,
                            landUnit === 'hectares' && styles.activeUnitButton,
                          ]}
                          onPress={() => setLandUnit('hectares')}
                        >
                          <Text style={[
                            styles.unitButtonText,
                            landUnit === 'hectares' && styles.activeUnitButtonText,
                          ]}>
                            Hectares
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <Input
                  label="Number of Cattle (if any)"
                  placeholder="Enter number"
                  value={cattleCount}
                  onChangeText={setCattleCount}
                  keyboardType="numeric"
                  error={errors.cattleCount}
                  touched={true}
                />

                <Input
                  label="Monthly Income (optional)"
                  placeholder="Enter amount in ₹"
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  keyboardType="numeric"
                  error={errors.monthlyIncome}
                  touched={true}
                  leftIcon={<Ionicons name="cash-outline" size={20} color={colors.mediumGray} />}
                />
              </View>
            )}

            {role === 'vendor' && (
              <View style={styles.roleQuestionsContainer}>
                <Text style={styles.sectionTitle}>Vendor Details</Text>

                <Input
                  label="Business Name"
                  placeholder="Enter your business name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  error={errors.businessName}
                  touched={true}
                  leftIcon={<Ionicons name="business-outline" size={20} color={colors.mediumGray} />}
                />

                <Input
                  label="Business Type"
                  placeholder="e.g., Fertilizer Supplier, Equipment Dealer"
                  value={businessType}
                  onChangeText={setBusinessType}
                  error={errors.businessType}
                  touched={true}
                />

                <Input
                  label="Products/Services Offered"
                  placeholder="e.g., Fertilizers, Seeds, Equipment"
                  value={productsOffered}
                  onChangeText={setProductsOffered}
                  error={errors.productsOffered}
                  touched={true}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {role === 'consultant' && (
              <View style={styles.roleQuestionsContainer}>
                <Text style={styles.sectionTitle}>Consultant Details</Text>

                <Input
                  label="Specialization"
                  placeholder="e.g., Crop Management, Soil Health"
                  value={specialization}
                  onChangeText={setSpecialization}
                  error={errors.specialization}
                  touched={true}
                />

                <Input
                  label="Years of Experience"
                  placeholder="Enter number of years"
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                  error={errors.experience}
                  touched={true}
                />

                <Input
                  label="Qualifications"
                  placeholder="e.g., B.Sc Agriculture, PhD"
                  value={qualifications}
                  onChangeText={setQualifications}
                  error={errors.qualifications}
                  touched={true}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            {/* Location */}
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              {location ? (
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.locationText}>{location.address}</Text>
                </View>
              ) : (
                <Text style={styles.locationPlaceholder}>
                  No location detected
                </Text>
              )}

              <Button
                title={locationLoading ? 'Detecting...' : 'Detect Location'}
                variant="outline"
                size="small"
                onPress={handleDetectLocation}
                loading={locationLoading}
                leftIcon={
                  !locationLoading && (
                    <Ionicons name="locate" size={16} color={colors.primary} />
                  )
                }
              />
            </View>

            <Button
              title="Complete Setup"
              onPress={handleProfileSetup}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  card: {
    padding: spacing.lg,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileImageButton: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  profileImageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  formContainer: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  activeRoleButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activeRoleText: {
    color: colors.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  locationPlaceholder: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.md,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  // Role-specific question styles
  roleQuestionsContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  rowContainer: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rowInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  unitSelector: {
    width: 120,
  },
  unitLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  unitButtons: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  unitButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  activeUnitButton: {
    backgroundColor: colors.primaryLight,
  },
  unitButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeUnitButtonText: {
    color: colors.primary,
  },
});

export default ProfileSetupScreen;
