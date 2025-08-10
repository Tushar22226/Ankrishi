import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

// Mock farm data
const mockFarmData = {
  id: 'farm1',
  name: 'Green Valley Farm',
  location: {
    address: 'Pune, Maharashtra',
    coordinates: {
      latitude: 18.5204,
      longitude: 73.8567,
    },
  },
  size: 5.5, // in acres
  soilType: 'Loamy',
  farmingMethod: 'Conventional',
  description: 'A family-owned farm specializing in wheat, rice, and vegetable cultivation.',
};

const EditFarmScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [size, setSize] = useState('');
  const [soilType, setSoilType] = useState('');
  const [farmingMethod, setFarmingMethod] = useState('');
  const [description, setDescription] = useState('');
  
  // Load farm data on component mount
  useEffect(() => {
    // In a real app, we would fetch data from a service
    // For now, let's use mock data
    setName(mockFarmData.name);
    setAddress(mockFarmData.location.address);
    setSize(mockFarmData.size.toString());
    setSoilType(mockFarmData.soilType);
    setFarmingMethod(mockFarmData.farmingMethod);
    setDescription(mockFarmData.description);
  }, []);
  
  const handleSave = () => {
    // Validate form
    if (!name || !address || !size) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // In a real app, we would save the farm data to a database
    Alert.alert(
      'Success',
      'Farm details updated successfully',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
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
        <Text style={styles.title}>Edit Farm Details</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Farm Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter farm name"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter farm address"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Farm Size (acres) *</Text>
            <TextInput
              style={styles.input}
              value={size}
              onChangeText={setSize}
              placeholder="Enter farm size in acres"
              keyboardType="numeric"
            />
          </View>
        </Card>
        
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Farm Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Soil Type</Text>
            <TextInput
              style={styles.input}
              value={soilType}
              onChangeText={setSoilType}
              placeholder="e.g., Loamy, Clay, Sandy"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Farming Method</Text>
            <TextInput
              style={styles.input}
              value={farmingMethod}
              onChangeText={setFarmingMethod}
              placeholder="e.g., Conventional, Organic, Natural"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter farm description..."
              multiline
              numberOfLines={4}
            />
          </View>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.medium,
  },
  title: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
    padding: spacing.medium,
  },
  formCard: {
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  formGroup: {
    marginBottom: spacing.medium,
  },
  label: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: spacing.small,
  },
  saveButton: {
    marginBottom: spacing.medium,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default EditFarmScreen;
