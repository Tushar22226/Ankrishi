import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';


// Farming types
const farmingTypes = [
  { label: 'Crop Farming', value: 'crops' },
  { label: 'Fruit Farming', value: 'fruits' },
  { label: 'Vegetable Farming', value: 'vegetables' },
  { label: 'Dairy Farming', value: 'dairy' }
];

// Crop types
const cropTypes = [
  'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton',
  'Soybean', 'Potato', 'Tomato', 'Onion', 'Chili',
  'Lentils (Dal)', 'Chickpea', 'Mustard', 'Groundnut', 'Sunflower'
];

// Fruit types
const fruitTypes = [
  'Mango', 'Banana', 'Apple', 'Orange', 'Grapes',
  'Watermelon', 'Papaya', 'Guava', 'Pomegranate', 'Pineapple'
];

// Vegetable types
const vegetableTypes = [
  'Potato', 'Tomato', 'Onion', 'Cabbage', 'Cauliflower',
  'Brinjal', 'Okra', 'Spinach', 'Carrot', 'Peas'
];

// Dairy types
const dairyTypes = [
  'Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Cheese', 'Butter',
  'Ghee', 'Curd', 'Paneer', 'Milk Powder'
];

// Custom Dropdown component to replace Picker
const CustomDropdown = ({
  options,
  selectedValue,
  onValueChange,
  placeholder
}: {
  options: { label: string; value: string }[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder || 'Select an option';

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>{displayText}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder || 'Select an option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item.value && styles.selectedOptionText
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const FinancialPlanInputScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Form state
  const [farmingType, setFarmingType] = useState('crops'); // Default to crops
  const [cropType, setCropType] = useState('');
  const [landSize, setLandSize] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [planDuration, setPlanDuration] = useState('6'); // Default 6 months

  // Additional inputs
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [selectedVegetables, setSelectedVegetables] = useState<string[]>([]);

  // Format options for dropdowns
  const farmingTypeOptions = farmingTypes;

  const cropOptions = [
    { label: 'Select a crop', value: '' },
    ...cropTypes.map(crop => ({ label: crop, value: crop }))
  ];

  const fruitOptions = [
    { label: 'Select a fruit', value: '' },
    ...fruitTypes.map(fruit => ({ label: fruit, value: fruit }))
  ];

  const vegetableOptions = [
    { label: 'Select a vegetable', value: '' },
    ...vegetableTypes.map(vegetable => ({ label: vegetable, value: vegetable }))
  ];

  const dairyOptions = [
    { label: 'Select a dairy product', value: '' },
    ...dairyTypes.map(dairy => ({ label: dairy, value: dairy }))
  ];

  const durationOptions = [
    { label: '3 months', value: '3' },
    { label: '6 months', value: '6' },
    { label: '12 months', value: '12' },
    { label: '24 months', value: '24' }
  ];

  // Generate financial plan
  const generateFinancialPlan = () => {
    // Validate inputs
    if (!farmingType || !landSize || !monthlyIncome || !monthlyExpenses) {
      Alert.alert('Missing Information', 'Please fill in all required fields (farming type, land size, monthly income, and monthly expenses).');
      return;
    }

    // Create plan data
    const planData = {
      userId: userProfile?.uid,
      userName: userProfile?.displayName,
      farmingType,
      cropType,
      landSize: parseFloat(landSize),
      expectedYield: parseFloat(expectedYield || '0'),
      currentSavings: parseFloat(currentSavings || '0'),
      monthlyIncome: parseFloat(monthlyIncome),
      monthlyExpenses: parseFloat(monthlyExpenses),
      loanAmount: parseFloat(loanAmount || '0'),
      interestRate: parseFloat(interestRate || '0'),
      planDuration: parseInt(planDuration),
      selectedCrops,
      selectedFruits,
      selectedVegetables,
      createdAt: Date.now(),
    };

    // Navigate to plan view screen
    navigation.navigate('FinancialPlanView' as never, { planData } as never);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Financial Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Farming Type</Text>

          {/* Farming Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Farming Type *</Text>
            <CustomDropdown
              options={farmingTypeOptions}
              selectedValue={farmingType}
              onValueChange={(value) => setFarmingType(value)}
              placeholder="Select farming type"
            />
          </View>

          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Land Size */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Land Size (in acres) *</Text>
            <TextInput
              style={styles.textInput}
              value={landSize}
              onChangeText={setLandSize}
              placeholder="Enter land size"
              keyboardType="numeric"
            />
          </View>

          {/* Primary Product based on farming type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {farmingType === 'crops' ? 'Primary Crop' :
               farmingType === 'fruits' ? 'Primary Fruit' :
               farmingType === 'vegetables' ? 'Primary Vegetable' :
               'Primary Dairy Product'}
            </Text>
            <CustomDropdown
              options={
                farmingType === 'crops' ? cropOptions :
                farmingType === 'fruits' ? fruitOptions :
                farmingType === 'vegetables' ? vegetableOptions :
                dairyOptions
              }
              selectedValue={cropType}
              onValueChange={(value) => setCropType(value)}
              placeholder={
                farmingType === 'crops' ? 'Select a crop' :
                farmingType === 'fruits' ? 'Select a fruit' :
                farmingType === 'vegetables' ? 'Select a vegetable' :
                'Select a dairy product'
              }
            />
          </View>

          {/* Expected Yield */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {farmingType === 'dairy' ? 'Expected Production (in liters/kg)' : 'Expected Yield (in quintals)'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={expectedYield}
              onChangeText={setExpectedYield}
              placeholder={farmingType === 'dairy' ? 'Enter expected production' : 'Enter expected yield'}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Financial Information</Text>

          {/* Current Savings */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Savings (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={currentSavings}
              onChangeText={setCurrentSavings}
              placeholder="Enter current savings"
              keyboardType="numeric"
            />
          </View>

          {/* Monthly Income */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Income (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              placeholder="Enter monthly income"
              keyboardType="numeric"
            />
          </View>

          {/* Monthly Expenses */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Expenses (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={monthlyExpenses}
              onChangeText={setMonthlyExpenses}
              placeholder="Enter monthly expenses"
              keyboardType="numeric"
            />
          </View>

          {/* Loan Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loan Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={loanAmount}
              onChangeText={setLoanAmount}
              placeholder="Enter loan amount"
              keyboardType="numeric"
            />
          </View>

          {/* Interest Rate */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Interest Rate (%)</Text>
            <TextInput
              style={styles.textInput}
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder="Enter interest rate"
              keyboardType="numeric"
            />
          </View>

          {/* Plan Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Plan Duration (months)</Text>
            <CustomDropdown
              options={durationOptions}
              selectedValue={planDuration}
              onValueChange={(value) => setPlanDuration(value)}
              placeholder="Select duration"
            />
          </View>
        </Card>

        <Button
          title="Generate Financial Plan"
          onPress={generateFinancialPlan}
          style={styles.generateButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  scrollContainer: {
    padding: spacing.md,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  generateButton: {
    marginBottom: spacing.xl,
  },
  // Custom dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  dropdownButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
});

export default FinancialPlanInputScreen;
