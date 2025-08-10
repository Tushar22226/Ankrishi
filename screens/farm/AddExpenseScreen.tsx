import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MyFarmStackParamList } from '../../navigation/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ExpenseCategory } from '../../models/Finance';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import FinanceService from '../../services/FinanceService';
import LoadingQuote from '../../components/LoadingQuote';

// Expense categories
const expenseCategories = [
  { id: 'seeds', name: 'Seeds', icon: 'seed' },
  { id: 'fertilizers', name: 'Fertilizers', icon: 'flask' },
  { id: 'pesticides', name: 'Pesticides', icon: 'bug' },
  { id: 'equipment_purchase', name: 'Equipment Purchase', icon: 'construct' },
  { id: 'equipment_rental', name: 'Equipment Rental', icon: 'construct' },
  { id: 'equipment_maintenance', name: 'Equipment Maintenance', icon: 'construct' },
  { id: 'irrigation', name: 'Irrigation', icon: 'water' },
  { id: 'labor', name: 'Labor', icon: 'people' },
  { id: 'land_lease', name: 'Land Lease', icon: 'map' },
  { id: 'fuel', name: 'Fuel', icon: 'speedometer' },
  { id: 'electricity', name: 'Electricity', icon: 'flash' },
  { id: 'transportation', name: 'Transportation', icon: 'car' },
  { id: 'storage', name: 'Storage', icon: 'cube' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone' },
  { id: 'loan_payment', name: 'Loan Payment', icon: 'card' },
  { id: 'insurance', name: 'Insurance', icon: 'shield' },
  { id: 'taxes', name: 'Taxes', icon: 'document-text' },
  { id: 'other_expense', name: 'Other Expense', icon: 'wallet' },
];

// Recurring frequencies
const recurringFrequencies = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'yearly', name: 'Yearly' },
];

type AddExpenseScreenNavigationProp = NativeStackNavigationProp<MyFarmStackParamList, 'AddExpense'>;

const AddExpenseScreen = () => {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const { userProfile } = useAuth();

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vendor, setVendor] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('');
  const [loading, setLoading] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    amount: '',
    description: '',
    category: '',
    recurringFrequency: '',
  });

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    let isValid = true;
    const newErrors = { ...errors };

    if (!amount) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
      isValid = false;
    } else {
      newErrors.amount = '';
    }

    if (!description) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else {
      newErrors.description = '';
    }

    if (!category) {
      newErrors.category = 'Category is required';
      isValid = false;
    } else {
      newErrors.category = '';
    }

    if (isRecurring && !recurringFrequency) {
      newErrors.recurringFrequency = 'Recurring frequency is required';
      isValid = false;
    } else {
      newErrors.recurringFrequency = '';
    }

    setErrors(newErrors);

    if (!isValid) {
      return;
    }

    // Submit form
    setLoading(true);

    try {
      if (!userProfile?.uid) {
        throw new Error('User not authenticated');
      }

      // Create expense object
      const expenseData = {
        userId: userProfile.uid,
        type: 'expense' as const,
        amount: Number(amount),
        currency: 'INR',
        date: date.getTime(),
        description,
        category: category as ExpenseCategory,
        vendor: vendor || undefined,
        cropName: cropName || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        quantityUnit: unit || undefined,
        paymentMethod: 'cash', // Default payment method
      };

      // Save expense to database
      await FinanceService.addExpense(expenseData);

      // If it's a recurring expense, we could handle that here
      // For now, we'll just save it as a one-time expense

      setLoading(false);
      Alert.alert(
        'Success',
        'Expense added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyFarmMain'),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add expense: ' + (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          {/* Amount */}
          <Input
            label="Amount (₹)"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            leftIcon={<Ionicons name="cash-outline" size={20} color={colors.mediumGray} />}
            error={errors.amount}
            touched={true}
          />

          {/* Description */}
          <Input
            label="Description"
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            leftIcon={<Ionicons name="create-outline" size={20} color={colors.mediumGray} />}
            error={errors.description}
            touched={true}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContainer}
          >
            <View style={styles.categoriesContainer}>
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.activeCategoryButton,
                  ]}
                  onPress={() => setCategory(cat.id as ExpenseCategory)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.id ? colors.primary : colors.mediumGray}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.activeCategoryText,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {errors.category ? (
            <Text style={styles.errorText}>{errors.category}</Text>
          ) : null}

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.mediumGray} />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Vendor */}
          <Input
            label="Vendor/Supplier (Optional)"
            placeholder="Enter vendor name"
            value={vendor}
            onChangeText={setVendor}
          />

          {/* Additional Fields */}
          {(category === 'seeds' || category === 'fertilizers' || category === 'pesticides') && (
            <>
              <Input
                label="Crop Name (Optional)"
                placeholder="Enter crop name"
                value={cropName}
                onChangeText={setCropName}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Quantity (Optional)"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    label="Unit (Optional)"
                    placeholder="e.g. kg, liters"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            </>
          )}

          {/* Recurring Expense */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Recurring Expense</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={isRecurring ? colors.primary : colors.mediumGray}
            />
          </View>

          {isRecurring && (
            <>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyContainer}>
                {recurringFrequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.id}
                    style={[
                      styles.frequencyButton,
                      recurringFrequency === freq.id && styles.activeFrequencyButton,
                    ]}
                    onPress={() => setRecurringFrequency(freq.id)}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        recurringFrequency === freq.id && styles.activeFrequencyText,
                      ]}
                    >
                      {freq.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.recurringFrequency ? (
                <Text style={styles.errorText}>{errors.recurringFrequency}</Text>
              ) : null}
            </>
          )}

          {/* Submit Button */}
          <Button
            title="Add Expense"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />
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
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  formCard: {
    marginVertical: spacing.md,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoriesScrollContainer: {
    paddingBottom: spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  categoryButton: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryButton: {
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 99, 71, 0.1)', // Light red for expense
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  activeCategoryText: {
    color: colors.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  switchLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  frequencyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeFrequencyButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  frequencyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeFrequencyText: {
    color: colors.primary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default AddExpenseScreen;
