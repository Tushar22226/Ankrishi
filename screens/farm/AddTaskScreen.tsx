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

// Mock crops data for dropdown
const mockCrops = [
  { id: 'crop1', name: 'Wheat' },
  { id: 'crop2', name: 'Tomatoes' },
  { id: 'crop3', name: 'Rice' },
];

const AddTaskScreen = () => {
  const navigation = useNavigation();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [priority, setPriority] = useState('medium'); // 'low', 'medium', 'high'
  const [selectedCropId, setSelectedCropId] = useState('');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCropDropdown, setShowCropDropdown] = useState(false);
  
  const handleSave = () => {
    // Validate form
    if (!title || !selectedCropId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // In a real app, we would save the task data to a database
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
        <Text style={styles.title}>Add New Task</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
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
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Related Crop *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCropDropdown(!showCropDropdown)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedCropId
                  ? mockCrops.find(crop => crop.id === selectedCropId)?.name
                  : 'Select a crop'}
              </Text>
              <Ionicons
                name={showCropDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            
            {showCropDropdown && (
              <View style={styles.dropdownMenu}>
                {mockCrops.map(crop => (
                  <TouchableOpacity
                    key={crop.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedCropId(crop.id);
                      setShowCropDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedCropId === crop.id && styles.selectedDropdownItemText,
                      ]}
                    >
                      {crop.name}
                    </Text>
                    {selectedCropId === crop.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
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
  dropdownButton: {
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
  dropdownButtonText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
  },
  selectedDropdownItemText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: spacing.small,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activePriorityButton: {
    borderColor: 'transparent',
  },
  priorityButtonText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
  },
  activePriorityButtonText: {
    color: colors.white,
    fontWeight: 'bold',
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

export default AddTaskScreen;
