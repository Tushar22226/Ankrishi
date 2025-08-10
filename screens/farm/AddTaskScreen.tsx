import React, { useState, useEffect } from 'react';
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
import { Crop, FarmTask, TaskPriority } from '../../models/Farm';

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

const AddTaskScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCrops, setLoadingCrops] = useState<boolean>(true);
  const [crops, setCrops] = useState<Crop[]>([]);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 86400000)); // Tomorrow
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedCropId, setSelectedCropId] = useState<string>('');

  // UI state
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showCropDropdown, setShowCropDropdown] = useState<boolean>(false);

  // Load crops on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadCrops();
    } else {
      setLoadingCrops(false);
    }
  }, []);

  // Load crops from Firebase
  const loadCrops = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoadingCrops(true);

      // Get crops from Firebase
      const cropData = await FarmService.getCrops(userProfile.uid);
      setCrops(cropData);
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crops. Please try again.');
    } finally {
      setLoadingCrops(false);
    }
  };

  // Save task to Firebase
  const handleSave = async () => {
    // Validate form
    if (!title) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!userProfile?.uid) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setLoading(true);

      // Get crop name if crop is selected
      let cropName;
      if (selectedCropId) {
        const crop = crops.find(c => c.id === selectedCropId);
        cropName = crop?.name;
      }

      // Create task object
      const taskData: Partial<FarmTask> = {
        title,
        description: description || undefined,
        dueDate: dueDate.getTime(),
        priority,
        cropId: selectedCropId || undefined,
        cropName: cropName || undefined,
      };

      // Save to Firebase
      await FarmService.addTask(userProfile.uid, taskData);

      setLoading(false);
      Alert.alert(
        'Success',
        'Task added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Saving task...</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => {
        setShowCropDropdown(false);
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Task</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Apply fertilizer, Irrigate field"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Related Crop</Text>
            {loadingCrops ? (
              <View style={styles.loadingCropsContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingCropsText}>Loading crops...</Text>
              </View>
            ) : crops.length > 0 ? (
              <CustomDropdown
                value={selectedCropId}
                options={[
                  { label: 'Select a crop', value: '' },
                  ...crops.map(crop => ({ label: crop.name, value: crop.id }))
                ]}
                onSelect={(value) => setSelectedCropId(value)}
                isVisible={showCropDropdown}
                setIsVisible={setShowCropDropdown}
                placeholder="Select a crop"
              />
            ) : (
              <View style={styles.noCropsContainer}>
                <Text style={styles.noCropsText}>No crops available. Add crops in Crop Management.</Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityButtons}>
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  priority === 'low' && styles.activePriorityButton,
                  { backgroundColor: priority === 'low' ? colors.success : colors.background },
                ]}
                onPress={() => setPriority('low')}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === 'low' && styles.activePriorityButtonText,
                  ]}
                >
                  Low
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  priority === 'medium' && styles.activePriorityButton,
                  { backgroundColor: priority === 'medium' ? colors.warning : colors.background },
                ]}
                onPress={() => setPriority('medium')}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === 'medium' && styles.activePriorityButtonText,
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  priority === 'high' && styles.activePriorityButton,
                  { backgroundColor: priority === 'high' ? colors.error : colors.background },
                ]}
                onPress={() => setPriority('high')}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === 'high' && styles.activePriorityButtonText,
                  ]}
                >
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Task"
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
    padding: 16,
    paddingBottom: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
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
  loadingCropsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  loadingCropsText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
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
  noCropsContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  noCropsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activePriorityButton: {
    borderColor: 'transparent',
  },
  priorityButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  activePriorityButtonText: {
    color: colors.white,
    fontWeight: 'bold',
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

export default AddTaskScreen;
