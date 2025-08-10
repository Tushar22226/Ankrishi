import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { indianFarmingAI } from '../../utils/indianFarmingAI';

// Indian states and major agricultural districts
const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'West Bengal'
];

// Farming types specific to Indian agriculture
const farmingTypes = [
  { label: 'Cereal Crops (Rice, Wheat, etc.)', value: 'cereals' },
  { label: 'Cash Crops (Cotton, Sugarcane, etc.)', value: 'cash_crops' },
  { label: 'Pulses & Oilseeds', value: 'pulses_oilseeds' },
  { label: 'Horticulture (Fruits & Vegetables)', value: 'horticulture' },
  { label: 'Dairy & Livestock', value: 'dairy_livestock' },
  { label: 'Poultry', value: 'poultry' },
  { label: 'Mixed Farming', value: 'mixed' }
];

// Crops by category
const cropsByCategory = {
  cereals: ['Rice', 'Wheat', 'Maize', 'Bajra', 'Jowar', 'Ragi', 'Barley'],
  cash_crops: ['Cotton', 'Sugarcane', 'Jute', 'Tobacco'],
  pulses_oilseeds: ['Arhar', 'Moong', 'Urad', 'Chana', 'Masoor', 'Groundnut', 'Mustard', 'Sunflower', 'Soybean'],
  horticulture: ['Mango', 'Banana', 'Apple', 'Orange', 'Tomato', 'Potato', 'Onion', 'Cabbage', 'Cauliflower'],
  dairy_livestock: ['Cow Milk', 'Buffalo Milk', 'Goat', 'Sheep'],
  poultry: ['Broiler', 'Layer', 'Duck'],
  mixed: ['Multiple Crops']
};

// Soil types common in India
const soilTypes = [
  'Alluvial Soil', 'Black Soil (Regur)', 'Red Soil', 'Laterite Soil',
  'Desert Soil', 'Mountain Soil', 'Saline Soil'
];

// Irrigation types
const irrigationTypes = [
  'Rain-fed', 'Canal Irrigation', 'Tube Well', 'Drip Irrigation',
  'Sprinkler Irrigation', 'Tank Irrigation', 'Well Irrigation'
];

// Land ownership types
const landOwnershipTypes = [
  { label: 'Own Land', value: 'owned' },
  { label: 'Leased Land', value: 'leased' },
  { label: 'Sharecropping', value: 'sharecropping' },
  { label: 'Contract Farming', value: 'contract' }
];

// Loan purposes
const loanPurposes = [
  'Crop Production', 'Farm Equipment', 'Irrigation Setup', 'Land Purchase',
  'Livestock Purchase', 'Storage/Warehouse', 'Processing Unit', 'Working Capital'
];

const FinancialPlanInputScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Location & Climate Data
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [soilType, setSoilType] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Farm Details
  const [farmingType, setFarmingType] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [secondaryCrop, setSecondaryCrop] = useState('');
  const [landSize, setLandSize] = useState('');
  const [landOwnership, setLandOwnership] = useState('owned');
  const [irrigationType, setIrrigationType] = useState('');

  // Input Costs (per acre/season) - Essential for Indian farmers
  const [seedCost, setSeedCost] = useState('');
  const [fertilizerCost, setFertilizerCost] = useState('');
  const [pesticideCost, setPesticideCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [irrigationCost, setIrrigationCost] = useState('');
  const [machineryRent, setMachineryRent] = useState('');

  // Financial Details
  const [annualFarmIncome, setAnnualFarmIncome] = useState('');
  const [nonFarmIncome, setNonFarmIncome] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [existingLoans, setExistingLoans] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [monthlyHouseholdExpenses, setMonthlyHouseholdExpenses] = useState('');

  // Insurance & Government Schemes
  const [hasCropInsurance, setHasCropInsurance] = useState(false);
  const [pmKisanBeneficiary, setPmKisanBeneficiary] = useState(false);
  const [kccHolder, setKccHolder] = useState(false);
  const [soilHealthCard, setSoilHealthCard] = useState(false);

  // Loan Requirements
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanDuration, setLoanDuration] = useState('12');

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Get user location
  const getLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for better recommendations');
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (address.length > 0) {
        setState(address[0].region || '');
        setDistrict(address[0].district || address[0].city || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please enter manually.');
    }
    setIsLocationLoading(false);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!state) newErrors.state = 'Please select state';
    if (!farmingType) newErrors.farmingType = 'Please select farming type';
    if (!primaryCrop) newErrors.primaryCrop = 'Please select primary crop';
    if (!landSize || parseFloat(landSize) <= 0) newErrors.landSize = 'Please enter valid land size';
    if (!annualFarmIncome || parseFloat(annualFarmIncome) <= 0) newErrors.annualFarmIncome = 'Please enter valid farm income';
    if (!monthlyHouseholdExpenses || parseFloat(monthlyHouseholdExpenses) <= 0) newErrors.monthlyHouseholdExpenses = 'Please enter valid household expenses';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate input costs automatically based on crop and land size
  const calculateInputCosts = () => {
    const landSizeNum = parseFloat(landSize || '0');
    if (landSizeNum <= 0 || !primaryCrop) return;

    // Standard input costs per acre for different crops (in INR)
    const standardCosts: {[key: string]: {seed: number, fertilizer: number, pesticide: number, labor: number}} = {
      'Rice': { seed: 2000, fertilizer: 8000, pesticide: 3000, labor: 15000 },
      'Wheat': { seed: 1500, fertilizer: 6000, pesticide: 2000, labor: 12000 },
      'Cotton': { seed: 3000, fertilizer: 10000, pesticide: 8000, labor: 20000 },
      'Sugarcane': { seed: 15000, fertilizer: 12000, pesticide: 5000, labor: 25000 },
      'Tomato': { seed: 5000, fertilizer: 15000, pesticide: 10000, labor: 30000 },
      'Potato': { seed: 8000, fertilizer: 12000, pesticide: 8000, labor: 25000 }
    };

    const costs = standardCosts[primaryCrop] || { seed: 2000, fertilizer: 8000, pesticide: 3000, labor: 15000 };

    setSeedCost((costs.seed * landSizeNum).toString());
    setFertilizerCost((costs.fertilizer * landSizeNum).toString());
    setPesticideCost((costs.pesticide * landSizeNum).toString());
    setLaborCost((costs.labor * landSizeNum).toString());
  };

  // Auto-calculate when crop or land size changes
  useEffect(() => {
    if (primaryCrop && landSize) {
      calculateInputCosts();
    }
  }, [primaryCrop, landSize]);

  // Fill test data for quick testing
  const fillTestData = () => {
    setState('Punjab');
    setDistrict('Ludhiana');
    setFarmingType('cereals');
    setPrimaryCrop('Rice');
    setLandSize('2');
    setIrrigationType('Tube Well');
    setAnnualFarmIncome('300000'); // Realistic for 2-acre rice farm in Punjab
    setNonFarmIncome('60000'); // Added non-farm income (dairy/labor)
    setMonthlyHouseholdExpenses('10000'); // Realistic household expenses
    setCurrentSavings('50000');
    setPmKisanBeneficiary(true);
    setKccHolder(true);
    setHasCropInsurance(true);

    // Auto-calculate costs
    setTimeout(() => {
      calculateInputCosts();
    }, 100);
  };

  // Generate financial plan using AI
  const generateFinancialPlan = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    try {
      console.log('Starting financial plan generation...');

      // Prepare data for AI model with proper validation
      const farmData = {
        state: state || 'Uttar Pradesh',
        district: district || '',
        location: location || null,
        farmingType: farmingType || 'cereals',
        primaryCrop: primaryCrop || 'Rice',
        landSize: parseFloat(landSize) || 1,
        irrigationType: irrigationType || 'Rain-fed',
        seedCost: parseFloat(seedCost || '0'),
        fertilizerCost: parseFloat(fertilizerCost || '0'),
        pesticideCost: parseFloat(pesticideCost || '0'),
        laborCost: parseFloat(laborCost || '0'),
        annualFarmIncome: parseFloat(annualFarmIncome) || 0,
        nonFarmIncome: parseFloat(nonFarmIncome || '0'),
        monthlyHouseholdExpenses: parseFloat(monthlyHouseholdExpenses) || 0,
        currentSavings: parseFloat(currentSavings || '0'),
        pmKisanBeneficiary: pmKisanBeneficiary || false,
        kccHolder: kccHolder || false,
        hasCropInsurance: hasCropInsurance || false,
        loanAmount: parseFloat(loanAmount || '0'),
        loanPurpose: loanPurpose || ''
      };

      console.log('Farm data prepared:', farmData);

      // Generate AI-based financial plan
      const aiPlan = indianFarmingAI.generateFinancialPlan(farmData);

      console.log('AI plan generated successfully');

      // Navigate to plan view with AI-generated data
      (navigation as any).navigate('FinancialPlanView', {
        planData: {
          ...farmData,
          aiPredictions: aiPlan,
          createdAt: Date.now(),
          planType: 'ai_generated'
        }
      });

    } catch (error) {
      console.error('Financial plan generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Error',
        `Failed to generate financial plan: ${errorMessage}. Please check your inputs and try again.`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Farmer Financial Plan</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Planning for Indian Farmers</Text>
        </View>

        {/* Test Data Button - Remove in production */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={fillTestData}
        >
          <Ionicons name="flash" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Location Section */}
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Location Details</Text>
          </View>

          <TouchableOpacity
            style={styles.locationButton}
            onPress={getLocation}
            disabled={isLocationLoading}
          >
            {isLocationLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="location" size={20} color={colors.primary} />
            )}
            <Text style={styles.locationButtonText}>
              {isLocationLoading ? 'Getting Location...' : 'Get Current Location'}
            </Text>
          </TouchableOpacity>

          <Input
            label="State *"
            value={state}
            onChangeText={setState}
            placeholder="Select your state"
            leftIcon={<Ionicons name="map-outline" size={20} color={colors.mediumGray} />}
            error={errors.state}
            touched={!!state}
          />

          <Input
            label="District"
            value={district}
            onChangeText={setDistrict}
            placeholder="Enter your district"
            leftIcon={<Ionicons name="business-outline" size={20} color={colors.mediumGray} />}
          />
        </Card>

        {/* Farm Details Section */}
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Farm Details</Text>
          </View>

          <Input
            label="Farming Type *"
            value={farmingType}
            onChangeText={setFarmingType}
            placeholder="Select farming type"
            leftIcon={<Ionicons name="flower-outline" size={20} color={colors.mediumGray} />}
            error={errors.farmingType}
            touched={!!farmingType}
          />

          <Input
            label="Primary Crop *"
            value={primaryCrop}
            onChangeText={setPrimaryCrop}
            placeholder="Select primary crop"
            leftIcon={<Ionicons name="nutrition-outline" size={20} color={colors.mediumGray} />}
            error={errors.primaryCrop}
            touched={!!primaryCrop}
          />

          <Input
            label="Land Size (Acres) *"
            value={landSize}
            onChangeText={setLandSize}
            placeholder="Enter land size in acres"
            keyboardType="numeric"
            leftIcon={<Ionicons name="resize-outline" size={20} color={colors.mediumGray} />}
            error={errors.landSize}
            touched={!!landSize}
          />

          <Input
            label="Irrigation Type"
            value={irrigationType}
            onChangeText={setIrrigationType}
            placeholder="Select irrigation type"
            leftIcon={<Ionicons name="water-outline" size={20} color={colors.mediumGray} />}
          />
        </Card>

        {/* Input Costs Section */}
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Input Costs per Season</Text>
          </View>

          <TouchableOpacity
            style={styles.autoCalculateButton}
            onPress={calculateInputCosts}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <Text style={styles.autoCalculateText}>Auto Calculate Costs</Text>
          </TouchableOpacity>

          <Input
            label="Seed Cost (₹)"
            value={seedCost}
            onChangeText={setSeedCost}
            placeholder="Enter seed cost"
            keyboardType="numeric"
            leftIcon={<Ionicons name="leaf-outline" size={20} color={colors.mediumGray} />}
          />

          <Input
            label="Fertilizer Cost (₹)"
            value={fertilizerCost}
            onChangeText={setFertilizerCost}
            placeholder="Enter fertilizer cost"
            keyboardType="numeric"
            leftIcon={<Ionicons name="flask-outline" size={20} color={colors.mediumGray} />}
          />

          <Input
            label="Pesticide Cost (₹)"
            value={pesticideCost}
            onChangeText={setPesticideCost}
            placeholder="Enter pesticide cost"
            keyboardType="numeric"
            leftIcon={<Ionicons name="bug-outline" size={20} color={colors.mediumGray} />}
          />

          <Input
            label="Labor Cost (₹)"
            value={laborCost}
            onChangeText={setLaborCost}
            placeholder="Enter labor cost"
            keyboardType="numeric"
            leftIcon={<Ionicons name="people-outline" size={20} color={colors.mediumGray} />}
          />
        </Card>

        {/* Financial Details Section */}
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Financial Details</Text>
          </View>

          <Input
            label="Annual Farm Income (₹) *"
            value={annualFarmIncome}
            onChangeText={setAnnualFarmIncome}
            placeholder="Enter annual farm income"
            keyboardType="numeric"
            leftIcon={<Ionicons name="trending-up-outline" size={20} color={colors.mediumGray} />}
            error={errors.annualFarmIncome}
            touched={!!annualFarmIncome}
          />

          <Input
            label="Non-Farm Income (₹)"
            value={nonFarmIncome}
            onChangeText={setNonFarmIncome}
            placeholder="Enter non-farm income (optional)"
            keyboardType="numeric"
            leftIcon={<Ionicons name="business-outline" size={20} color={colors.mediumGray} />}
          />

          <Input
            label="Monthly Household Expenses (₹) *"
            value={monthlyHouseholdExpenses}
            onChangeText={setMonthlyHouseholdExpenses}
            placeholder="Enter monthly household expenses"
            keyboardType="numeric"
            leftIcon={<Ionicons name="home-outline" size={20} color={colors.mediumGray} />}
            error={errors.monthlyHouseholdExpenses}
            touched={!!monthlyHouseholdExpenses}
          />

          <Input
            label="Current Savings (₹)"
            value={currentSavings}
            onChangeText={setCurrentSavings}
            placeholder="Enter current savings"
            keyboardType="numeric"
            leftIcon={<Ionicons name="card-outline" size={20} color={colors.mediumGray} />}
          />
        </Card>

        {/* Government Schemes Section */}
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Government Schemes</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>PM-KISAN Beneficiary</Text>
            <Switch
              value={pmKisanBeneficiary}
              onValueChange={setPmKisanBeneficiary}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={pmKisanBeneficiary ? colors.primary : colors.mediumGray}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>KCC (Kisan Credit Card) Holder</Text>
            <Switch
              value={kccHolder}
              onValueChange={setKccHolder}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={kccHolder ? colors.primary : colors.mediumGray}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Crop Insurance</Text>
            <Switch
              value={hasCropInsurance}
              onValueChange={setHasCropInsurance}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={hasCropInsurance ? colors.primary : colors.mediumGray}
            />
          </View>
        </Card>

        {/* Loan Section */}
        {parseFloat(loanAmount || '0') > 0 && (
          <Card style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Loan Details</Text>
            </View>

            <Input
              label="Loan Amount (₹)"
              value={loanAmount}
              onChangeText={setLoanAmount}
              placeholder="Enter loan amount"
              keyboardType="numeric"
              leftIcon={<Ionicons name="cash-outline" size={20} color={colors.mediumGray} />}
            />

            <Input
              label="Loan Purpose"
              value={loanPurpose}
              onChangeText={setLoanPurpose}
              placeholder="Select loan purpose"
              leftIcon={<Ionicons name="document-text-outline" size={20} color={colors.mediumGray} />}
            />
          </Card>
        )}

        {/* Generate Button */}
        <Button
          title="Generate Financial Plan"
          onPress={generateFinancialPlan}
          style={styles.generateButton}
        />

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>What You'll Get:</Text>
          </View>
          <Text style={styles.infoText}>• Location-based crop recommendations</Text>
          <Text style={styles.infoText}>• Realistic input cost calculations</Text>
          <Text style={styles.infoText}>• Government scheme benefits</Text>
          <Text style={styles.infoText}>• Seasonal cash flow projections</Text>
          <Text style={styles.infoText}>• Market price predictions</Text>
          <Text style={styles.infoText}>• Risk management strategies</Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  testButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#2E7D32',
    marginLeft: spacing.sm,
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    marginBottom: spacing.md,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  locationButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  autoCalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  autoCalculateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: '#2E7D32',
    marginLeft: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  switchLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: '#2E7D32',
    flex: 1,
  },
  generateButton: {
    marginVertical: spacing.lg,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: spacing.md,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCard: {
    padding: spacing.lg,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginTop: spacing.md,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.3)',
  },
  infoTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#2E7D32',
    marginLeft: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: '#1B5E20',
    marginBottom: spacing.sm,
    lineHeight: 22,
    paddingLeft: spacing.md,
  },
});

export default FinancialPlanInputScreen;
