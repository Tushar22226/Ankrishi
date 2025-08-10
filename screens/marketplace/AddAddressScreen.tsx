import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';

const AddAddressScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: userProfile?.displayName || '',
    phone: userProfile?.phoneNumber || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!address.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!address.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(address.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!address.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!address.pincode.trim()) {
      newErrors.pincode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(address.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save address
  const handleSaveAddress = async () => {
    if (!validateForm() || !userProfile) return;

    try {
      setLoading(true);

      // Save address to database
      await MarketplaceService.saveUserAddress(userProfile.uid, address);

      Alert.alert(
        'Success',
        'Address saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the MultiProductCheckout screen
              navigation.navigate('Marketplace', { screen: 'MultiProductCheckout' } as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Address</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Input
                placeholder="Enter your full name"
                value={address.name}
                onChangeText={(text) => setAddress({ ...address, name: text })}
                error={errors.name}
                touched={true}
                leftIcon={<Ionicons name="person-outline" size={20} color={colors.mediumGray} />}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Input
                placeholder="Enter your phone number"
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: text })}
                keyboardType="phone-pad"
                error={errors.phone}
                touched={true}
                leftIcon={<Ionicons name="call-outline" size={20} color={colors.mediumGray} />}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Input
                placeholder="Enter your address"
                value={address.address}
                onChangeText={(text) => setAddress({ ...address, address: text })}
                multiline
                numberOfLines={3}
                error={errors.address}
                touched={true}
                leftIcon={<Ionicons name="home-outline" size={20} color={colors.mediumGray} />}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>City</Text>
                <Input
                  placeholder="City"
                  value={address.city}
                  onChangeText={(text) => setAddress({ ...address, city: text })}
                  error={errors.city}
                  touched={true}
                  leftIcon={<Ionicons name="business-outline" size={20} color={colors.mediumGray} />}
                />
              </View>

              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>State</Text>
                <Input
                  placeholder="State"
                  value={address.state}
                  onChangeText={(text) => setAddress({ ...address, state: text })}
                  error={errors.state}
                  touched={true}
                  leftIcon={<Ionicons name="map-outline" size={20} color={colors.mediumGray} />}
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>PIN Code</Text>
              <Input
                placeholder="PIN Code"
                value={address.pincode}
                onChangeText={(text) => setAddress({ ...address, pincode: text })}
                keyboardType="number-pad"
                error={errors.pincode}
                touched={true}
                leftIcon={<Ionicons name="location-outline" size={20} color={colors.mediumGray} />}
              />
            </View>

            <Button
              title="Save Address"
              onPress={handleSaveAddress}
              loading={loading}
              disabled={loading}
              size="large"
              style={styles.saveButton}
              leftIcon={<Ionicons name="save-outline" size={20} color={colors.white} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: getPlatformTopSpacing(),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  formField: {
    marginBottom: 16,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  saveButton: {
    marginTop: 16,
    height: 50,
    borderRadius: 10,
  },
});

export default AddAddressScreen;
