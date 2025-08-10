import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import { Crop, CropStatus, CropHealth } from '../../models/Farm';
// import { Picker } from '@react-native-picker/picker';

// Custom Dropdown Component
const CustomDropdown = ({
  value,
  options,
  onSelect,
  isVisible,
  setIsVisible,
  placeholder = 'Select an option'
}: {
  value: string;
  options: {label: string; value: string}[];
  onSelect: (value: string) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  placeholder?: string;
}) => {
  // Prevent event propagation
  const handlePress = (e: any) => {
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  const handleOptionPress = (optionValue: string, e: any) => {
    e.stopPropagation();
    onSelect(optionValue);
    setIsVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={handlePress}
      >
        <Text style={styles.dropdownButtonText}>
          {value ? options.find(option => option.value === value)?.label || placeholder : placeholder}
        </Text>
        <Ionicons
          name={isVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.dropdownItem, value === option.value && styles.dropdownItemSelected]}
              onPress={(e) => handleOptionPress(option.value, e)}
            >
              <Text
                style={[styles.dropdownItemText, value === option.value && styles.dropdownItemTextSelected]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const AddCropScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState<'acre' | 'hectare'>('acre');
  const [soilType, setSoilType] = useState('');
  const [description, setDescription] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [harvestDate, setHarvestDate] = useState(new Date(Date.now() + 86400000 * 90)); // 90 days from now
  const [status, setStatus] = useState<CropStatus>('planning');
  const [health, setHealth] = useState<CropHealth>('good');
  const [expectedYield, setExpectedYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState('kg');

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);

  // Dropdown state
  const [showAreaUnitDropdown, setShowAreaUnitDropdown] = useState(false);
  const [showYieldUnitDropdown, setShowYieldUnitDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showHealthDropdown, setShowHealthDropdown] = useState(false);

  // Save crop to Firebase
  const handleSave = async () => {
    // Validate form
    if (!name || !variety || !area) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!userProfile?.uid) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setLoading(true);

      // Create crop object
      const cropData: Partial<Crop> = {
        name,
        variety,
        area: parseFloat(area),
        areaUnit,
        plantingDate: plantingDate.getTime(),
        harvestDate: harvestDate.getTime(),
        status,
        health,
        soilType: soilType || undefined,
        description: description || undefined,
        expectedYield: expectedYield ? parseFloat(expectedYield) : undefined,
        yieldUnit: expectedYield ? yieldUnit : undefined,
        fertilizers: [],
        pesticides: [],
        irrigationSchedule: [],
      };

      // Save to Firebase
      await FarmService.addCrop(userProfile.uid, cropData);

      setLoading(false);
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
    } catch (error) {
      setLoading(false);
      console.error('Error saving crop:', error);
      Alert.alert('Error', 'Failed to save crop. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Saving crop...</Text>
      </View>
    );
  }

  // Close all dropdowns when tapping outside
  const closeAllDropdowns = () => {
    setShowAreaUnitDropdown(false);
    setShowYieldUnitDropdown(false);
    setShowStatusDropdown(false);
    setShowHealthDropdown(false);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={closeAllDropdowns}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Crop</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={[styles.formGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>Area *</Text>
              <TextInput
                style={styles.input}
                value={area}
                onChangeText={setArea}
                placeholder="e.g., 2.5"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <CustomDropdown
                value={areaUnit}
                options={[
                  { label: 'Acre', value: 'acre' },
                  { label: 'Hectare', value: 'hectare' }
                ]}
                onSelect={(value) => setAreaUnit(value as 'acre' | 'hectare')}
                isVisible={showAreaUnitDropdown}
                setIsVisible={setShowAreaUnitDropdown}
                placeholder="Select unit"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Soil Type</Text>
            <TextInput
              style={styles.input}
              value={soilType}
              onChangeText={setSoilType}
              placeholder="e.g., Loamy, Clay, Sandy"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>Expected Yield</Text>
              <TextInput
                style={styles.input}
                value={expectedYield}
                onChangeText={setExpectedYield}
                placeholder="e.g., 1000"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <CustomDropdown
                value={yieldUnit}
                options={[
                  { label: 'kg', value: 'kg' },
                  { label: 'ton', value: 'ton' },
                  { label: 'quintal', value: 'quintal' }
                ]}
                onSelect={(value) => setYieldUnit(value)}
                isVisible={showYieldUnitDropdown}
                setIsVisible={setShowYieldUnitDropdown}
                placeholder="Select unit"
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
              textAlignVertical="top"
            />
          </View>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Status & Dates</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Status</Text>
            <CustomDropdown
              value={status}
              options={[
                { label: 'Planning', value: 'planning' },
                { label: 'Planting', value: 'planting' },
                { label: 'Growing', value: 'growing' },
                { label: 'Harvesting', value: 'harvesting' },
                { label: 'Completed', value: 'completed' }
              ]}
              onSelect={(value) => setStatus(value as CropStatus)}
              isVisible={showStatusDropdown}
              setIsVisible={setShowStatusDropdown}
              placeholder="Select status"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Health</Text>
            <CustomDropdown
              value={health}
              options={[
                { label: 'Excellent', value: 'excellent' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
                { label: 'Critical', value: 'critical' }
              ]}
              onSelect={(value) => setHealth(value as CropHealth)}
              isVisible={showHealthDropdown}
              setIsVisible={setShowHealthDropdown}
              placeholder="Select health status"
            />
          </View>

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
              <Text style={styles.dateText}>{formatDate(harvestDate)}</Text>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>

            {showHarvestDatePicker && (
              <DateTimePicker
                value={harvestDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowHarvestDatePicker(false);
                  if (selectedDate) {
                    setHarvestDate(selectedDate);
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 32 : 48,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  buttonContainer: {
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default AddCropScreen;
