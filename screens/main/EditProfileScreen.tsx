import React, { useState, useEffect } from 'react';
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

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile, updateUserProfile } = useAuth();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Load user profile data
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setUsername(userProfile.username || '');
      setAge(userProfile.age ? String(userProfile.age) : '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setProfileImage(userProfile.photoURL || null);

      // Load role-specific data
      if (userProfile.role === 'farmer' && userProfile.farmDetails) {
        setLandOwned(userProfile.farmDetails.landOwned ? String(userProfile.farmDetails.landOwned) : '');
        setLandUnit(userProfile.farmDetails.landUnit || 'acres');
        setCattleCount(userProfile.farmDetails.cattleCount ? String(userProfile.farmDetails.cattleCount) : '');
        setMonthlyIncome(userProfile.farmDetails.monthlyIncome ? String(userProfile.farmDetails.monthlyIncome) : '');
      } else if (userProfile.role === 'vendor' && userProfile.vendorDetails) {
        setBusinessName(userProfile.vendorDetails.businessName || '');
        setBusinessType(userProfile.vendorDetails.businessType || '');
        setProductsOffered(userProfile.vendorDetails.productsOffered?.[0] || '');
      } else if (userProfile.role === 'consultant' && userProfile.consultantDetails) {
        setSpecialization(userProfile.consultantDetails.specialization?.[0] || '');
        setExperience(userProfile.consultantDetails.experience ? String(userProfile.consultantDetails.experience) : '');
        setQualifications(userProfile.consultantDetails.qualifications?.[0] || '');
      }
    }
  }, [userProfile]);

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
        setNewProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Upload profile image to Firebase Storage
  const uploadProfileImage = async (imageUri: string): Promise<string | null> => {
    if (!user) {
      console.warn('No user available for upload');
      return null;
    }

    try {
      console.log('Starting profile image upload process');

      // Create a reference to the file in Firebase Storage
      const imageRef = storage().ref(`profile_images/${user.uid}`);
      console.log('Created storage reference:', `profile_images/${user.uid}`);

      // Convert image URI to blob
      console.log('Fetching image from URI');
      const response = await fetch(imageUri);

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
        (snapshot: any) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(2) + '%');
        },
        (error: any) => {
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

  // Handle save profile
  const handleSaveProfile = async () => {
    // Validate form
    let isValid = true;
    const newErrors = { ...errors };

    // Basic profile validation
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

    // Role-specific validation
    if (userProfile?.role === 'farmer') {
      if (!landOwned) {
        newErrors.landOwned = 'Land area is required';
        isValid = false;
      } else if (isNaN(Number(landOwned)) || Number(landOwned) <= 0) {
        newErrors.landOwned = 'Please enter a valid land area';
        isValid = false;
      } else {
        newErrors.landOwned = '';
      }
    } else if (userProfile?.role === 'vendor') {
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
    } else if (userProfile?.role === 'consultant') {
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
      console.log('Updating profile data');

      // Upload new profile image if selected
      let photoURL = userProfile?.photoURL || null;
      if (newProfileImage) {
        try {
          photoURL = await uploadProfileImage(newProfileImage);
          if (!photoURL) {
            console.warn('Failed to upload profile image, continuing with existing image');
          }
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          // Continue without updating image if upload fails
        }
      }

      const profileData: Partial<UserProfile> = {
        displayName,
        username,
        age: Number(age),
        phoneNumber,
      };

      // Add photoURL if image was uploaded successfully
      if (photoURL) {
        profileData.photoURL = photoURL;
      }

      // Add role-specific details
      if (userProfile?.role === 'farmer') {
        profileData.farmDetails = {
          ...(userProfile.farmDetails || {}),
          landOwned: Number(landOwned),
          landUnit,
          cattleCount: cattleCount ? Number(cattleCount) : 0,
          monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        };
      } else if (userProfile?.role === 'vendor') {
        profileData.vendorDetails = {
          ...(userProfile.vendorDetails || {}),
          businessName,
          businessType,
          productsOffered: [productsOffered],
        };
      } else if (userProfile?.role === 'consultant') {
        profileData.consultantDetails = {
          ...(userProfile.consultantDetails || {}),
          specialization: [specialization],
          experience: Number(experience),
          qualifications: [qualifications],
        };
      }

      console.log('Updating user profile with data:', JSON.stringify(profileData, null, 2));

      await updateUserProfile(profileData);
      console.log('Profile updated successfully');

      // Show success message
      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated.',
        [{
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          }
        }]
      );
    } catch (error: any) {
      console.error('Profile update failed:', error);
      Alert.alert(
        'Profile Update Failed',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Render role-specific fields
  const renderRoleSpecificFields = () => {
    if (!userProfile) return null;

    if (userProfile.role === 'farmer') {
      return (
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
      );
    } else if (userProfile.role === 'vendor') {
      return (
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
      );
    } else if (userProfile.role === 'consultant') {
      return (
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
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              style={styles.profileImageButton}
              onPress={handleSelectImage}
            >
              {newProfileImage ? (
                <Image
                  source={{ uri: newProfileImage }}
                  style={styles.profileImage}
                />
              ) : profileImage ? (
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

            {/* Role-specific fields */}
            {renderRoleSpecificFields()}

            {/* Verification Option */}
            <View style={styles.verificationContainer}>
              <View style={styles.verificationHeader}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                <Text style={styles.verificationTitle}>Account Verification</Text>
              </View>
              <Text style={styles.verificationDescription}>
                Verify your account to build trust with other users and unlock additional features.
              </Text>
              <Button
                title="Verify Profile"
                onPress={() => navigation.navigate('VerifyProfile')}
                type="outline"
                fullWidth
                style={styles.verifyButton}
              />
            </View>

            <Button
              title="Save Changes"
              onPress={handleSaveProfile}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.lg,
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
    alignItems: 'flex-end',
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
    color: colors.textPrimary,
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
  submitButton: {
    marginTop: spacing.md,
  },
  verificationContainer: {
    backgroundColor: '#F0F9F0',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
    marginLeft: 10,
  },
  verificationDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  verifyButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
  },
});

export default EditProfileScreen;
