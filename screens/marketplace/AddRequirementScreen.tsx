import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import database from '@react-native-firebase/database';
import { RequirementProductType, PackagingSizeUnit, DeliveryTimeSlot, PaymentTerm, RequirementType } from '../../models/Requirement';

const AddRequirementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Basic form state
  const [productType, setProductType] = useState<'fruit' | 'vegetable' | 'cereal' | ''>('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');

  // Quantity and packaging
  const [quantityRequired, setQuantityRequired] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<'kg' | 'quintal' | 'ton'>('kg');
  const [packagingSize, setPackagingSize] = useState('');
  const [packagingUnit, setPackagingUnit] = useState<'kg' | 'box' | 'packet'>('kg');

  // Quality requirements
  const [gradeRequirements, setGradeRequirements] = useState('');

  // Delivery details
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryHandler, setDeliveryHandler] = useState<'buyer' | 'farmer'>('farmer');
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('delivery');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // Price and payment
  const [priceRangeMin, setPriceRangeMin] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'advance' | 'on_delivery' | 'credit'>('on_delivery');

  // Requirement type
  const [requirementType, setRequirementType] = useState<'bid' | 'first_come_first_serve'>('first_come_first_serve');

  // Additional specifications
  const [certifications, setCertifications] = useState<string[]>([]);
  const [traceabilityRequired, setTraceabilityRequired] = useState(false);
  const [pesticidefreeRequired, setPesticidefreeRequired] = useState(false);
  const [moistureContentMax, setMoistureContentMax] = useState('');

  // Check if user is vendor or buyer
  useEffect(() => {
    if (userProfile && userProfile.role !== 'vendor' && userProfile.role !== 'buyer') {
      Alert.alert(
        'Access Restricted',
        'Only vendors and buyers can post requirements.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [userProfile, navigation]);

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!productType) {
        Alert.alert('Error', 'Please select a product type');
        setLoading(false);
        return;
      }

      if (!itemName) {
        Alert.alert('Error', 'Please enter an item name');
        setLoading(false);
        return;
      }

      if (!quantityRequired) {
        Alert.alert('Error', 'Please enter the quantity required');
        setLoading(false);
        return;
      }

      // Create requirement object
      const requirementId = database().ref('requirements').push().key;

      if (!requirementId) {
        throw new Error('Failed to generate requirement ID');
      }

      const requirement = {
        id: requirementId,
        userId: userProfile?.uid,
        userName: userProfile?.displayName || '',
        userVerified: userProfile?.reputation?.verifiedStatus || false,

        // Basic requirement details
        productType,
        itemName,
        description,

        // Quantity and packaging
        quantityRequired: Number(quantityRequired),
        quantityUnit,
        preferredPackagingSize: packagingSize ? Number(packagingSize) : 0,
        preferredPackagingUnit: packagingUnit,

        // Quality and specifications
        gradeRequirements,

        // Delivery details
        expectedDeliveryDate: expectedDeliveryDate.getTime(),
        deliveryHandler,
        deliveryOption,
        preferredDeliveryTimeSlot: deliveryTimeSlot,
        deliveryLocation: {
          latitude: 0, // Would be set from user's location in a real app
          longitude: 0,
          address: 'User Address', // Would be set from user's address in a real app
        },

        // Price and payment
        priceRangeMin: priceRangeMin ? Number(priceRangeMin) : undefined,
        priceRangeMax: priceRangeMax ? Number(priceRangeMax) : undefined,
        currency: 'INR',
        paymentTerms,

        // Requirement type
        requirementType,
        bidEndDate: requirementType === 'bid' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime() : undefined, // 7 days from now

        // Additional specifications
        certifications,
        traceabilityRequired,
        pesticidefreeRequired,
        moistureContentMax: moistureContentMax ? Number(moistureContentMax) : undefined,

        // Status and timestamps
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),

        // Empty responses array
        responses: [],
      };

      // Save to Firebase
      await database().ref(`requirements/${requirementId}`).set(requirement);

      // Success message
      Alert.alert(
        'Success',
        'Your requirement has been posted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error posting requirement:', error);
      Alert.alert('Error', 'Failed to post requirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        <Card style={styles.formCard} elevation="medium" borderRadius={borderRadius.lg}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          {/* Product Type Selection */}
          <Text style={styles.inputLabel}>Product Type</Text>
          <View style={styles.productTypeContainer}>
            <TouchableOpacity
              style={[
                styles.productTypeButton,
                productType === 'fruit' && styles.selectedProductType,
              ]}
              onPress={() => setProductType('fruit')}
            >
              <Ionicons
                name="nutrition-outline"
                size={20}
                color={productType === 'fruit' ? colors.white : colors.textPrimary}
              />
              <Text
                style={[
                  styles.productTypeText,
                  productType === 'fruit' && styles.selectedProductTypeText,
                ]}
              >
                Fruit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.productTypeButton,
                productType === 'vegetable' && styles.selectedProductType,
              ]}
              onPress={() => setProductType('vegetable')}
            >
              <Ionicons
                name="leaf-outline"
                size={20}
                color={productType === 'vegetable' ? colors.white : colors.textPrimary}
              />
              <Text
                style={[
                  styles.productTypeText,
                  productType === 'vegetable' && styles.selectedProductTypeText,
                ]}
              >
                Vegetable
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.productTypeButton,
                productType === 'cereal' && styles.selectedProductType,
              ]}
              onPress={() => setProductType('cereal')}
            >
              <Ionicons
                name="basket-outline"
                size={20}
                color={productType === 'cereal' ? colors.white : colors.textPrimary}
              />
              <Text
                style={[
                  styles.productTypeText,
                  productType === 'cereal' && styles.selectedProductTypeText,
                ]}
              >
                Cereal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Item Name */}
          <Input
            label="Item Name"
            placeholder="e.g., Tomato, Wheat, Apple"
            value={itemName}
            onChangeText={setItemName}
            required
          />

          {/* Description */}
          <Input
            label="Description"
            placeholder="Describe your requirements in detail"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Quantity & Packaging</Text>

          {/* Quantity Required */}
          <View style={styles.rowContainer}>
            <View style={styles.flex7}>
              <Input
                label="Quantity Required"
                placeholder="e.g., 500"
                value={quantityRequired}
                onChangeText={setQuantityRequired}
                keyboardType="numeric"
                required
              />
            </View>
            <View style={styles.flex3}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitsContainer}>
                {['kg', 'quintal', 'ton'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      quantityUnit === unit && styles.unitButtonActive,
                    ]}
                    onPress={() => setQuantityUnit(unit as 'kg' | 'quintal' | 'ton')}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        quantityUnit === unit && styles.unitButtonTextActive,
                      ]}
                    >
                      {unit.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Preferred Packaging */}
          <View style={styles.rowContainer}>
            <View style={styles.flex7}>
              <Input
                label="Preferred Packaging Size"
                placeholder="e.g., 25"
                value={packagingSize}
                onChangeText={setPackagingSize}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex3}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitsContainer}>
                {['kg', 'box', 'packet'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      packagingUnit === unit && styles.unitButtonActive,
                    ]}
                    onPress={() => setPackagingUnit(unit as 'kg' | 'box' | 'packet')}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        packagingUnit === unit && styles.unitButtonTextActive,
                      ]}
                    >
                      {unit.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Quality Requirements</Text>

          {/* Grade/Quality Requirements */}
          <Input
            label="Grade/Quality Requirements"
            placeholder="e.g., A-grade, organic, export quality"
            value={gradeRequirements}
            onChangeText={setGradeRequirements}
          />

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Delivery Details</Text>

          {/* Expected Delivery Date */}
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputLabel}>Expected Delivery Date</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {expectedDeliveryDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={expectedDeliveryDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setExpectedDeliveryDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          {/* Delivery Handler */}
          <Text style={styles.inputLabel}>Who will handle delivery?</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                deliveryHandler === 'farmer' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryHandler('farmer')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryHandler === 'farmer' && styles.selectedOptionText,
                ]}
              >
                Farmer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                deliveryHandler === 'buyer' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryHandler('buyer')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryHandler === 'buyer' && styles.selectedOptionText,
                ]}
              >
                I will pick up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Option */}
          <Text style={styles.inputLabel}>Delivery Option</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                deliveryOption === 'pickup' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryOption('pickup')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryOption === 'pickup' && styles.selectedOptionText,
                ]}
              >
                Pickup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                deliveryOption === 'delivery' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryOption('delivery')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryOption === 'delivery' && styles.selectedOptionText,
                ]}
              >
                Delivery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preferred Delivery Time Slot */}
          <Text style={styles.inputLabel}>Preferred Delivery Time Slot</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.timeSlotButton,
                deliveryTimeSlot === 'morning' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryTimeSlot('morning')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryTimeSlot === 'morning' && styles.selectedOptionText,
                ]}
              >
                Morning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeSlotButton,
                deliveryTimeSlot === 'afternoon' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryTimeSlot('afternoon')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryTimeSlot === 'afternoon' && styles.selectedOptionText,
                ]}
              >
                Afternoon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeSlotButton,
                deliveryTimeSlot === 'evening' && styles.selectedOption,
              ]}
              onPress={() => setDeliveryTimeSlot('evening')}
            >
              <Text
                style={[
                  styles.optionText,
                  deliveryTimeSlot === 'evening' && styles.selectedOptionText,
                ]}
              >
                Evening
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Price & Payment</Text>

          {/* Price Range */}
          <View style={styles.rowContainer}>
            <View style={styles.flex1}>
              <Input
                label="Min Price (₹)"
                placeholder="e.g., 50"
                value={priceRangeMin}
                onChangeText={setPriceRangeMin}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <Input
                label="Max Price (₹)"
                placeholder="e.g., 70"
                value={priceRangeMax}
                onChangeText={setPriceRangeMax}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Payment Terms */}
          <Text style={styles.inputLabel}>Payment Terms</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.paymentTermButton,
                paymentTerms === 'advance' && styles.selectedOption,
              ]}
              onPress={() => setPaymentTerms('advance')}
            >
              <Text
                style={[
                  styles.optionText,
                  paymentTerms === 'advance' && styles.selectedOptionText,
                ]}
              >
                Advance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentTermButton,
                paymentTerms === 'on_delivery' && styles.selectedOption,
              ]}
              onPress={() => setPaymentTerms('on_delivery')}
            >
              <Text
                style={[
                  styles.optionText,
                  paymentTerms === 'on_delivery' && styles.selectedOptionText,
                ]}
              >
                On Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentTermButton,
                paymentTerms === 'credit' && styles.selectedOption,
              ]}
              onPress={() => setPaymentTerms('credit')}
            >
              <Text
                style={[
                  styles.optionText,
                  paymentTerms === 'credit' && styles.selectedOptionText,
                ]}
              >
                Credit
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Requirement Type</Text>

          {/* Requirement Type */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.requirementTypeButton,
                requirementType === 'first_come_first_serve' && styles.selectedOption,
              ]}
              onPress={() => setRequirementType('first_come_first_serve')}
            >
              <Text
                style={[
                  styles.optionText,
                  requirementType === 'first_come_first_serve' && styles.selectedOptionText,
                ]}
              >
                First Come First Serve
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.requirementTypeButton,
                requirementType === 'bid' && styles.selectedOption,
              ]}
              onPress={() => setRequirementType('bid')}
            >
              <Text
                style={[
                  styles.optionText,
                  requirementType === 'bid' && styles.selectedOptionText,
                ]}
              >
                Bid
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Additional Specifications</Text>

          {/* Certifications */}
          <Text style={styles.inputLabel}>Certifications Required</Text>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                if (certifications.includes('organic')) {
                  setCertifications(certifications.filter(c => c !== 'organic'));
                } else {
                  setCertifications([...certifications, 'organic']);
                }
              }}
            >
              <View style={[styles.checkbox, certifications.includes('organic') && styles.checkboxChecked]}>
                {certifications.includes('organic') && (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Organic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                if (certifications.includes('pesticide_free')) {
                  setCertifications(certifications.filter(c => c !== 'pesticide_free'));
                } else {
                  setCertifications([...certifications, 'pesticide_free']);
                }
              }}
            >
              <View style={[styles.checkbox, certifications.includes('pesticide_free') && styles.checkboxChecked]}>
                {certifications.includes('pesticide_free') && (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Pesticide Free</Text>
            </TouchableOpacity>
          </View>

          {/* Traceability */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTraceabilityRequired(!traceabilityRequired)}
          >
            <View style={[styles.checkbox, traceabilityRequired && styles.checkboxChecked]}>
              {traceabilityRequired && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Traceability Required (Farm Location, Farmer Details)</Text>
          </TouchableOpacity>

          {/* Pesticide-free confirmation */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPesticidefreeRequired(!pesticidefreeRequired)}
          >
            <View style={[styles.checkbox, pesticidefreeRequired && styles.checkboxChecked]}>
              {pesticidefreeRequired && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Pesticide-free confirmation</Text>
          </TouchableOpacity>

          {/* Moisture Content (only for cereals) */}
          {productType === 'cereal' && (
            <Input
              label="Maximum Moisture Content (%)"
              placeholder="e.g., 14"
              value={moistureContentMax}
              onChangeText={setMoistureContentMax}
              keyboardType="numeric"
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Post Requirement"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="large"
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    width: '100%',
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  formCard: {
    margin: spacing.md,
    padding: spacing.lg,
    width: '92%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    width: '100%',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    width: '100%',
  },
  productTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    width: '100%',
  },
  productTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surfaceLight,
  },
  selectedProductType: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  productTypeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  selectedProductTypeText: {
    color: colors.white,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    width: '100%',
  },
  flex1: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  flex3: {
    flex: 3,
    marginLeft: spacing.sm,
    minWidth: 150,
  },
  flex7: {
    flex: 7,
  },
  // Unit selection styles
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  unitButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  datePickerButton: {
    marginBottom: spacing.md,
    width: '100%',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 100,
    backgroundColor: colors.surfaceLight,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    color: colors.white,
  },
  timeSlotButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  paymentTermButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  requirementTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    marginBottom: spacing.md,
    width: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 4,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
});

export default AddRequirementScreen;
