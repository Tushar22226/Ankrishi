import React, { useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';

const AddCropScreen = () => {
  const navigation = useNavigation();
  
  // Form state
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [area, setArea] = useState('');
  const [soilType, setSoilType] = useState('');
  const [description, setDescription] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(new Date(Date.now() + 86400000 * 90)); // 90 days from now
  
  // Date picker state
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  
  const handleSave = () => {
    // Validate form
    if (!name || !variety || !area || !soilType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // In a real app, we would save the crop data to a database
    Alert.alert(
      'Success',
      'Crop added successfully',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <Text style={styles.title}>Add New Crop</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Crop Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Crop Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Wheat, Rice, Tomatoes"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Variety *</Text>
            <TextInput
              style={styles.input}
              value={variety}
              onChangeText={setVariety}
              placeholder="e.g., HD-2967, Basmati, Pusa Ruby"
            />
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: spacing.small }]}>
              <Text style={styles.label}>Area (acres) *</Text>
              <TextInput
                style={styles.input}
                value={area}
                onChangeText={setArea}
                placeholder="e.g., 2.5"
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Soil Type *</Text>
              <TextInput
                style={styles.input}
                value={soilType}
                onChangeText={setSoilType}
                placeholder="e.g., Loamy, Clay"
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter crop description..."
              multiline
              numberOfLines={4}
            />
          </View>
        </Card>
        
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Dates</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Planting Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowPlantingDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(plantingDate)}</Text>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            {showPlantingDatePicker && (
              <DateTimePicker
                value={plantingDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPlantingDatePicker(false);
                  if (selectedDate) {
                    setPlantingDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Expected Harvest Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowHarvestDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(expectedHarvestDate)}</Text>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            {showHarvestDatePicker && (
              <DateTimePicker
                value={expectedHarvestDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowHarvestDatePicker(false);
                  if (selectedDate) {
                    setExpectedHarvestDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Save Crop"
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
  formRow: {
    flexDirection: 'row',
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
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
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

export default AddCropScreen;
