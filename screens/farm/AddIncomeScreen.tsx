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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { IncomeCategory } from '../../models/Finance';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import FinanceService from '../../services/FinanceService';
import LoadingQuote from '../../components/LoadingQuote';

// Income categories
const incomeCategories = [
  { id: 'crop_sales', name: 'Crop Sales', icon: 'leaf' },
  { id: 'livestock_sales', name: 'Livestock Sales', icon: 'paw' },
  { id: 'equipment_rental', name: 'Equipment Rental', icon: 'construct' },
  { id: 'land_lease', name: 'Land Lease', icon: 'map' },
  { id: 'government_subsidy', name: 'Government Subsidy', icon: 'business' },
  { id: 'insurance_claim', name: 'Insurance Claim', icon: 'shield' },
  { id: 'other_income', name: 'Other Income', icon: 'cash' },
];

const AddIncomeScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncomeCategory | ''>('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [source, setSource] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    amount: '',
    description: '',
    category: '',
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

      // Create income object
      const incomeData = {
        userId: userProfile.uid,
        type: 'income' as const,
        amount: Number(amount),
        currency: 'INR',
        date: date.getTime(),
        description,
        category: category as IncomeCategory,
        source: source || undefined,
        cropName: cropName || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        quantityUnit: unit || undefined,
        pricePerUnit: quantity && Number(amount) > 0 && Number(quantity) > 0
          ? Number(amount) / Number(quantity)
          : undefined,
      };

      // Save income to database
      await FinanceService.addIncome(incomeData);

      setLoading(false);
      Alert.alert(
        'Success',
        'Income added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding income:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add income: ' + (error as Error).message);
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
          <View style={styles.categoriesContainer}>
            {incomeCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.activeCategoryButton,
                ]}
                onPress={() => setCategory(cat.id as IncomeCategory)}
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

          {/* Additional Fields */}
          {category === 'crop_sales' && (
            <>
              <Input
                label="Crop Name"
                placeholder="Enter crop name"
                value={cropName}
                onChangeText={setCropName}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Quantity"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    label="Unit"
                    placeholder="e.g. kg, quintal"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            </>
          )}

          {category === 'livestock_sales' && (
            <Input
              label="Details"
              placeholder="Enter livestock details"
              value={source}
              onChangeText={setSource}
            />
          )}

          {category === 'equipment_rental' && (
            <Input
              label="Equipment Details"
              placeholder="Enter equipment details"
              value={source}
              onChangeText={setSource}
            />
          )}

          {category === 'government_subsidy' && (
            <Input
              label="Scheme Name"
              placeholder="Enter scheme name"
              value={source}
              onChangeText={setSource}
            />
          )}

          {/* Submit Button */}
          <Button
            title="Add Income"
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
    marginTop:40,
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  categoryButton: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: '1.5%',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default AddIncomeScreen;
