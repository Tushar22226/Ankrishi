import React, { useState, useEffect } from 'react';
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
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Contract, ContractType } from '../../models/Contract';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import ContractService from '../../services/ContractService';
import LoadingQuote from '../../components/LoadingQuote';

// Contract types
const contractTypes: { value: ContractType; label: string }[] = [
  { value: 'supply', label: 'Supply Contract' },
  { value: 'purchase', label: 'Purchase Agreement' },
  { value: 'rental', label: 'Equipment Rental' },
  { value: 'service', label: 'Service Agreement' },
  { value: 'labor', label: 'Labor Contract' },
  { value: 'farming', label: 'Farming Contract' },
];

const AddContractScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    contractTerms: true,
    farmingDetails: false,
    aaccCertification: false,
    structuredBidding: false,
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContractType>('supply');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [secondPartyUsername, setSecondPartyUsername] = useState('');
  const [isTender, setIsTender] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 30)); // 30 days from now
  const [tenderEndDate, setTenderEndDate] = useState(new Date(Date.now() + 86400000 * 7)); // 7 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTenderEndDatePicker, setShowTenderEndDatePicker] = useState(false);
  const [showPaymentScheduleDatePicker, setShowPaymentScheduleDatePicker] = useState<number | null>(null);
  const [terms, setTerms] = useState<string[]>(['']);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [qualityStandards, setQualityStandards] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Contract farming state
  const [cropType, setCropType] = useState('');
  const [landArea, setLandArea] = useState('');
  const [landAreaUnit, setLandAreaUnit] = useState<'acre' | 'hectare'>('acre');
  const [expectedYield, setExpectedYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState('');
  const [farmingPractices, setFarmingPractices] = useState<string[]>(['']);
  const [seedProvision, setSeedProvision] = useState(false);
  const [inputProvision, setInputProvision] = useState(false);
  const [harvestingSupport, setHarvestingSupport] = useState(false);
  const [qualityParameters, setQualityParameters] = useState<{
    parameter: string;
    minValue: string;
    maxValue: string;
    unit: string;
  }[]>([{ parameter: '', minValue: '', maxValue: '', unit: '' }]);
  const [paymentSchedule, setPaymentSchedule] = useState<{
    milestone: string;
    percentage: string;
    estimatedDate: Date;
  }[]>([{ milestone: 'Advance', percentage: '30', estimatedDate: startDate }]);

  // AACC certification requirements state
  const [requireAacc, setRequireAacc] = useState(false);
  const [aaccRequirements, setAaccRequirements] = useState({
    minimumGrade: 'A' as 'A+' | 'A' | 'B+' | 'B' | 'C',
    minimumQualityScore: '80',
    minimumSafetyScore: '85',
    requiredStandards: ['Food Safety', 'Quality Assurance'],
    testingLabPreferences: '',
    certificationCostCoverage: 'shared' as 'buyer' | 'farmer' | 'shared',
    costSharingRatio: '50',
  });

  // Structured bidding state
  const [enableStructuredBidding, setEnableStructuredBidding] = useState(false);
  const [bidParameters, setBidParameters] = useState<{
    name: string;
    description: string;
    type: 'numeric' | 'boolean' | 'text' | 'date';
    unit?: string;
    minValue?: string;
    maxValue?: string;
    isRequired: boolean;
    weight: string;
  }[]>([
    {
      name: 'Price',
      description: 'Bid price per unit',
      type: 'numeric',
      unit: '₹',
      isRequired: true,
      weight: '50'
    }
  ]);
  const [evaluationMethod, setEvaluationMethod] = useState<'automatic' | 'manual'>('automatic');
  const [minimumQualifications, setMinimumQualifications] = useState<string[]>(['']);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle date changes
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);

      // If end date is before start date, update it
      if (endDate < selectedDate) {
        setEndDate(new Date(selectedDate.getTime() + 86400000 * 30)); // 30 days after start date
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleTenderEndDateChange = (event: any, selectedDate?: Date) => {
    setShowTenderEndDatePicker(false);
    if (selectedDate) {
      setTenderEndDate(selectedDate);
    }
  };

  // Handle payment schedule date change
  const handlePaymentScheduleDateChange = (event: any, selectedDate?: Date) => {
    setShowPaymentScheduleDatePicker(null);
    if (selectedDate && showPaymentScheduleDatePicker !== null) {
      const updatedSchedule = [...paymentSchedule];
      updatedSchedule[showPaymentScheduleDatePicker].estimatedDate = selectedDate;
      setPaymentSchedule(updatedSchedule);
    }
  };

  // Add a new term
  const addTerm = () => {
    setTerms([...terms, '']);
  };

  // Update a term
  const updateTerm = (index: number, value: string) => {
    const updatedTerms = [...terms];
    updatedTerms[index] = value;
    setTerms(updatedTerms);
  };

  // Remove a term
  const removeTerm = (index: number) => {
    if (terms.length > 1) {
      const updatedTerms = [...terms];
      updatedTerms.splice(index, 1);
      setTerms(updatedTerms);
    }
  };

  // Add a new quality standard
  const addQualityStandard = () => {
    setQualityStandards([...qualityStandards, '']);
  };

  // Update a quality standard
  const updateQualityStandard = (index: number, value: string) => {
    const updatedStandards = [...qualityStandards];
    updatedStandards[index] = value;
    setQualityStandards(updatedStandards);
  };

  // Remove a quality standard
  const removeQualityStandard = (index: number) => {
    if (qualityStandards.length > 1) {
      const updatedStandards = [...qualityStandards];
      updatedStandards.splice(index, 1);
      setQualityStandards(updatedStandards);
    }
  };

  // Farming practices functions
  const addFarmingPractice = () => {
    setFarmingPractices([...farmingPractices, '']);
  };

  const updateFarmingPractice = (index: number, value: string) => {
    const updatedPractices = [...farmingPractices];
    updatedPractices[index] = value;
    setFarmingPractices(updatedPractices);
  };

  const removeFarmingPractice = (index: number) => {
    if (farmingPractices.length > 1) {
      const updatedPractices = [...farmingPractices];
      updatedPractices.splice(index, 1);
      setFarmingPractices(updatedPractices);
    }
  };

  // Quality parameters functions
  const addQualityParameter = () => {
    setQualityParameters([...qualityParameters, { parameter: '', minValue: '', maxValue: '', unit: '' }]);
  };

  const updateQualityParameter = (index: number, field: keyof typeof qualityParameters[0], value: string) => {
    const updatedParameters = [...qualityParameters];
    updatedParameters[index][field] = value;
    setQualityParameters(updatedParameters);
  };

  const removeQualityParameter = (index: number) => {
    if (qualityParameters.length > 1) {
      const updatedParameters = [...qualityParameters];
      updatedParameters.splice(index, 1);
      setQualityParameters(updatedParameters);
    }
  };

  // Payment schedule functions
  const addPaymentSchedule = () => {
    setPaymentSchedule([...paymentSchedule, { milestone: '', percentage: '', estimatedDate: new Date() }]);
  };

  const updatePaymentSchedule = (index: number, field: keyof typeof paymentSchedule[0], value: string | Date) => {
    const updatedSchedule = [...paymentSchedule];
    updatedSchedule[index][field] = value as any;
    setPaymentSchedule(updatedSchedule);
  };

  const removePaymentSchedule = (index: number) => {
    if (paymentSchedule.length > 1) {
      const updatedSchedule = [...paymentSchedule];
      updatedSchedule.splice(index, 1);
      setPaymentSchedule(updatedSchedule);
    }
  };

  // Bid parameters functions
  const addBidParameter = () => {
    setBidParameters([...bidParameters, {
      name: '',
      description: '',
      type: 'numeric',
      isRequired: false,
      weight: '10'
    }]);
  };

  const updateBidParameter = (index: number, field: keyof typeof bidParameters[0], value: any) => {
    const updatedParameters = [...bidParameters];
    updatedParameters[index][field] = value;
    setBidParameters(updatedParameters);
  };

  const removeBidParameter = (index: number) => {
    if (bidParameters.length > 1) {
      const updatedParameters = [...bidParameters];
      updatedParameters.splice(index, 1);
      setBidParameters(updatedParameters);
    }
  };

  // Minimum qualifications functions
  const addMinimumQualification = () => {
    setMinimumQualifications([...minimumQualifications, '']);
  };

  const updateMinimumQualification = (index: number, value: string) => {
    const updatedQualifications = [...minimumQualifications];
    updatedQualifications[index] = value;
    setMinimumQualifications(updatedQualifications);
  };

  const removeMinimumQualification = (index: number) => {
    if (minimumQualifications.length > 1) {
      const updatedQualifications = [...minimumQualifications];
      updatedQualifications.splice(index, 1);
      setMinimumQualifications(updatedQualifications);
    }
  };

  // Check if username exists
  const checkUsername = async () => {
    if (!secondPartyUsername) {
      setUsernameError('');
      return;
    }

    try {
      const exists = await ContractService.checkUsernameExists(secondPartyUsername);

      if (!exists) {
        setUsernameError('Username does not exist');
      } else if (secondPartyUsername === userProfile?.username) {
        setUsernameError('You cannot create a contract with yourself');
      } else {
        setUsernameError('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username');
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!value.trim()) {
      newErrors.value = 'Contract value is required';
    } else if (isNaN(Number(value)) || Number(value) <= 0) {
      newErrors.value = 'Contract value must be a positive number';
    }

    if (quantity && (isNaN(Number(quantity)) || Number(quantity) <= 0)) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    if (pricePerUnit && (isNaN(Number(pricePerUnit)) || Number(pricePerUnit) <= 0)) {
      newErrors.pricePerUnit = 'Price per unit must be a positive number';
    }

    if (!isTender && !secondPartyUsername.trim()) {
      newErrors.secondPartyUsername = 'Second party username is required for direct contracts';
    } else if (secondPartyUsername && usernameError) {
      newErrors.secondPartyUsername = usernameError;
    }

    if (startDate >= endDate) {
      newErrors.dates = 'End date must be after start date';
    }

    if (isTender && tenderEndDate > startDate) {
      newErrors.tenderEndDate = 'Tender end date must be on or before contract start date';
    }

    // Check if at least one term is provided
    const validTerms = terms.filter(term => term.trim().length > 0);
    if (validTerms.length === 0) {
      newErrors.terms = 'At least one contract term is required';
    }

    // Validate farming contract fields
    if (type === 'farming') {
      if (!cropType.trim()) {
        newErrors.cropType = 'Crop type is required';
      }

      if (!landArea.trim()) {
        newErrors.landArea = 'Land area is required';
      } else if (isNaN(Number(landArea)) || Number(landArea) <= 0) {
        newErrors.landArea = 'Land area must be a positive number';
      }

      if (!expectedYield.trim()) {
        newErrors.expectedYield = 'Expected yield is required';
      } else if (isNaN(Number(expectedYield)) || Number(expectedYield) <= 0) {
        newErrors.expectedYield = 'Expected yield must be a positive number';
      }

      if (!yieldUnit.trim()) {
        newErrors.yieldUnit = 'Yield unit is required';
      }

      // Check if at least one farming practice is provided
      const validPractices = farmingPractices.filter(practice => practice.trim().length > 0);
      if (validPractices.length === 0) {
        newErrors.farmingPractices = 'At least one farming practice is required';
      }

      // Validate quality parameters
      const invalidParameters = qualityParameters.some(
        param => !param.parameter.trim() || (param.minValue && isNaN(Number(param.minValue))) || (param.maxValue && isNaN(Number(param.maxValue)))
      );
      if (invalidParameters) {
        newErrors.qualityParameters = 'Please provide valid quality parameters';
      }

      // Validate payment schedule
      const invalidSchedule = paymentSchedule.some(
        schedule => !schedule.milestone.trim() || !schedule.percentage.trim() || isNaN(Number(schedule.percentage))
      );
      if (invalidSchedule) {
        newErrors.paymentSchedule = 'Please provide valid payment schedule details';
      }

      // Check if total percentage adds up to 100%
      const totalPercentage = paymentSchedule.reduce((sum, schedule) => sum + (Number(schedule.percentage) || 0), 0);
      if (totalPercentage !== 100) {
        newErrors.paymentScheduleTotal = 'Payment schedule percentages must add up to 100%';
      }

      // Validate AACC certification requirements if enabled
      if (requireAacc) {
        if (isNaN(Number(aaccRequirements.minimumQualityScore)) ||
            Number(aaccRequirements.minimumQualityScore) < 0 ||
            Number(aaccRequirements.minimumQualityScore) > 100) {
          newErrors.minimumQualityScore = 'Quality score must be between 0 and 100';
          isValid = false;
        }

        if (isNaN(Number(aaccRequirements.minimumSafetyScore)) ||
            Number(aaccRequirements.minimumSafetyScore) < 0 ||
            Number(aaccRequirements.minimumSafetyScore) > 100) {
          newErrors.minimumSafetyScore = 'Safety score must be between 0 and 100';
          isValid = false;
        }

        if (aaccRequirements.certificationCostCoverage === 'shared' &&
            (isNaN(Number(aaccRequirements.costSharingRatio)) ||
             Number(aaccRequirements.costSharingRatio) < 0 ||
             Number(aaccRequirements.costSharingRatio) > 100)) {
          newErrors.costSharingRatio = 'Cost sharing ratio must be between 0 and 100';
          isValid = false;
        }
      }
    }

    // Validate structured bidding fields
    if (enableStructuredBidding) {
      // Validate bid parameters
      const invalidBidParams = bidParameters.some(
        param => !param.name.trim() || !param.description.trim() || !param.weight.trim() || isNaN(Number(param.weight))
      );
      if (invalidBidParams) {
        newErrors.bidParameters = 'Please provide valid bid parameters';
      }

      // Check if weights add up to 100%
      const totalWeight = bidParameters.reduce((sum, param) => sum + (Number(param.weight) || 0), 0);
      if (totalWeight !== 100) {
        newErrors.bidParametersWeight = 'Bid parameter weights must add up to 100%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setLoading(true);

      // If it's a tender, we don't need a second party yet
      let secondPartyId = '';

      // If it's not a tender, verify the second party exists
      if (!isTender && secondPartyUsername) {
        const secondParty = await ContractService.getUserByUsername(secondPartyUsername);

        if (!secondParty) {
          setErrors({
            ...errors,
            secondPartyUsername: 'Username does not exist',
          });
          setLoading(false);
          return;
        }

        secondPartyId = secondParty.uid;
      }

      // Filter out empty terms and quality standards
      const filteredTerms = terms.filter(term => term.trim().length > 0);
      const filteredQualityStandards = qualityStandards.filter(standard => standard.trim().length > 0);

      // Filter out empty farming practices
      const filteredFarmingPractices = farmingPractices.filter(practice => practice.trim().length > 0);

      // Filter out empty quality parameters
      const filteredQualityParameters = qualityParameters.filter(param => param.parameter.trim().length > 0);

      // Filter out empty payment schedule items
      const filteredPaymentSchedule = paymentSchedule.filter(item => item.milestone.trim().length > 0);

      // Filter out empty bid parameters
      const filteredBidParameters = bidParameters.filter(param => param.name.trim().length > 0);

      // Filter out empty minimum qualifications
      const filteredMinimumQualifications = minimumQualifications.filter(qual => qual.trim().length > 0);

      // Create contract data
      const contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        type,
        creatorId: userProfile.uid,
        creatorRole: userProfile.role,
        parties: {
          firstPartyId: userProfile.uid,
          firstPartyUsername: userProfile.username || '',
          secondPartyId: secondPartyId || undefined,
          secondPartyUsername: !isTender ? secondPartyUsername : undefined,
        },
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        tenderEndDate: isTender ? tenderEndDate.getTime() : undefined,
        value: Number(value),
        status: isTender ? 'pending' : 'active',
        description,
        terms: filteredTerms,
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit || undefined,
        pricePerUnit: pricePerUnit ? Number(pricePerUnit) : undefined,
        paymentTerms: paymentTerms || undefined,
        deliveryTerms: deliveryTerms || undefined,
        qualityStandards: filteredQualityStandards.length > 0 ? filteredQualityStandards : undefined,
        bids: [],
        isTender,

        // Add farming details if it's a farming contract
        farmingDetails: type === 'farming' ? {
          cropType,
          landArea: Number(landArea),
          landAreaUnit,
          expectedYield: Number(expectedYield),
          yieldUnit,
          farmingPractices: filteredFarmingPractices,
          seedProvision,
          inputProvision,
          harvestingSupport,
          qualityParameters: filteredQualityParameters.map(param => ({
            parameter: param.parameter,
            minValue: param.minValue ? Number(param.minValue) : undefined,
            maxValue: param.maxValue ? Number(param.maxValue) : undefined,
            unit: param.unit,
          })),
          paymentSchedule: filteredPaymentSchedule.map(item => ({
            milestone: item.milestone,
            percentage: Number(item.percentage),
            estimatedDate: item.estimatedDate ? item.estimatedDate.getTime() : undefined,
          })),
          // Add AACC certification requirements if enabled
          aaccRequirements: requireAacc ? {
            isRequired: true,
            minimumGrade: aaccRequirements.minimumGrade,
            minimumQualityScore: Number(aaccRequirements.minimumQualityScore),
            minimumSafetyScore: Number(aaccRequirements.minimumSafetyScore),
            requiredStandards: aaccRequirements.requiredStandards,
            testingLabPreferences: aaccRequirements.testingLabPreferences ?
              aaccRequirements.testingLabPreferences.split(',').map(lab => lab.trim()) :
              undefined,
            certificationCostCoverage: aaccRequirements.certificationCostCoverage,
            costSharingRatio: aaccRequirements.certificationCostCoverage === 'shared' ?
              Number(aaccRequirements.costSharingRatio) :
              undefined,
          } : undefined,
        } : undefined,

        // Add structured bidding if enabled
        structuredBidding: enableStructuredBidding ? {
          isEnabled: true,
          bidParameters: filteredBidParameters.map(param => ({
            name: param.name,
            description: param.description,
            type: param.type,
            unit: param.unit,
            minValue: param.minValue ? Number(param.minValue) : undefined,
            maxValue: param.maxValue ? Number(param.maxValue) : undefined,
            isRequired: param.isRequired,
            weight: Number(param.weight),
          })),
          evaluationMethod,
          minimumQualifications: filteredMinimumQualifications.length > 0 ? filteredMinimumQualifications : undefined,
        } : undefined,
      };

      // Save contract to database
      await ContractService.createContract(contractData);

      setLoading(false);
      Alert.alert(
        'Success',
        isTender ? 'Tender created successfully' : 'Contract created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating contract:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to create contract: ' + (error as Error).message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>
          {isTender ? 'Create Tender' : 'Add Contract'}
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          {/* Basic Information Section */}
          <SectionHeader
            title="Basic Information"
            icon="information-circle-outline"
            isExpanded={expandedSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}
            description="Type, title, value, parties"
          />

          {expandedSections.basicInfo && (
            <View style={styles.sectionContent}>
              {/* Contract Type */}
              <Text style={styles.label}>Contract Type</Text>
              <View style={styles.typesContainer}>
                {contractTypes.map((contractType) => (
                  <TouchableOpacity
                    key={contractType.value}
                    style={[
                      styles.typeButton,
                      type === contractType.value && styles.activeTypeButton,
                    ]}
                    onPress={() => setType(contractType.value)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        type === contractType.value && styles.activeTypeText,
                      ]}
                    >
                      {contractType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tender Switch */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Create as Tender</Text>
                <Switch
                  value={isTender}
                  onValueChange={setIsTender}
                  trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                  thumbColor={isTender ? colors.primary : colors.gray}
                />
              </View>

              {isTender && (
                <Text style={styles.tenderInfo}>
                  Creating a tender allows other users to bid on your contract before it becomes active.
                </Text>
              )}

              {/* Contract Title */}
              <Input
                label="Contract Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter contract title"
                error={errors.title}
              />

              {/* Contract Description */}
              <Input
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the contract"
                multiline
                numberOfLines={3}
                error={errors.description}
              />

              {/* Contract Value */}
              <Input
                label="Contract Value (₹)"
                value={value}
                onChangeText={setValue}
                placeholder="Enter total contract value"
                keyboardType="numeric"
                error={errors.value}
              />

              {/* Quantity and Unit */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    error={errors.quantity}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    label="Unit"
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="e.g., kg, quintal"
                    error={errors.unit}
                  />
                </View>
              </View>

              {/* Price Per Unit */}
              <Input
                label="Price Per Unit (₹)"
                value={pricePerUnit}
                onChangeText={setPricePerUnit}
                placeholder="Enter price per unit"
                keyboardType="numeric"
                error={errors.pricePerUnit}
              />

              {/* Second Party Username */}
              {!isTender && (
                <Input
                  label="Second Party Username"
                  value={secondPartyUsername}
                  onChangeText={setSecondPartyUsername}
                  placeholder="Enter username of the other party"
                  onBlur={checkUsername}
                  error={errors.secondPartyUsername || usernameError}
                />
              )}

              {/* Contract Dates */}
              <Text style={styles.label}>Contract Period</Text>
              <Text style={styles.helperText}>You can select any future dates for your contract.</Text>

              {/* Start Date */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                <Text style={styles.dateText}>
                  Start Date: {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                  minimumDate={new Date()}
                  // No maximum date - allow selection of any future date
                />
              )}

              {/* End Date */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                <Text style={styles.dateText}>
                  End Date: {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={new Date(startDate.getTime() + 86400000)} // At least 1 day after start date
                  // No maximum date - allow selection of any future date
                />
              )}

              {errors.dates && <Text style={styles.errorText}>{errors.dates}</Text>}

              {/* Tender End Date */}
              {isTender && (
                <>
                  <Text style={styles.label}>Tender Closing Date</Text>
                  <Text style={styles.helperText}>Select a date on or before the contract start date.</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowTenderEndDatePicker(true)}
                  >
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                    <Text style={styles.dateText}>
                      Tender Closes: {tenderEndDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  {showTenderEndDatePicker && (
                    <DateTimePicker
                      value={tenderEndDate}
                      mode="date"
                      display="default"
                      onChange={handleTenderEndDateChange}
                      minimumDate={new Date()}
                      // Allow tender end date to be up to the start date (inclusive)
                      maximumDate={startDate}
                    />
                  )}

                  {errors.tenderEndDate && (
                    <Text style={styles.errorText}>{errors.tenderEndDate}</Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* Contract Terms Section */}
          <SectionHeader
            title="Contract Terms & Standards"
            icon="document-text-outline"
            isExpanded={expandedSections.contractTerms}
            onToggle={() => toggleSection('contractTerms')}
            description="Terms, payment, delivery, quality"
          />

          {expandedSections.contractTerms && (
            <View style={styles.sectionContent}>
              {/* Contract Terms */}
              <Text style={styles.label}>Contract Terms</Text>
              {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

              {terms.map((term, index) => (
                <View key={index} style={styles.termContainer}>
                  <TextInput
                    style={styles.termInput}
                    value={term}
                    onChangeText={(value) => updateTerm(index, value)}
                    placeholder={`Term ${index + 1}`}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.termRemoveButton}
                    onPress={() => removeTerm(index)}
                    disabled={terms.length === 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={terms.length === 1 ? colors.lightGray : colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <Button
                title="Add Term"
                onPress={addTerm}
                variant="outline"
                size="small"
                style={styles.addButton}
                leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
              />

              {/* Payment Terms */}
              <Input
                label="Payment Terms"
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                placeholder="Specify payment terms"
                multiline
                numberOfLines={2}
              />

              {/* Delivery Terms */}
              <Input
                label="Delivery Terms"
                value={deliveryTerms}
                onChangeText={setDeliveryTerms}
                placeholder="Specify delivery terms"
                multiline
                numberOfLines={2}
              />

              {/* Quality Standards */}
              <Text style={styles.label}>Quality Standards</Text>

              {qualityStandards.map((standard, index) => (
                <View key={index} style={styles.termContainer}>
                  <TextInput
                    style={styles.termInput}
                    value={standard}
                    onChangeText={(value) => updateQualityStandard(index, value)}
                    placeholder={`Standard ${index + 1}`}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.termRemoveButton}
                    onPress={() => removeQualityStandard(index)}
                    disabled={qualityStandards.length === 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={qualityStandards.length === 1 ? colors.lightGray : colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <Button
                title="Add Quality Standard"
                onPress={addQualityStandard}
                variant="outline"
                size="small"
                style={styles.addButton}
                leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
              />
            </View>
          )}

          {/* Contract Farming Section */}
          {type === 'farming' && (
            <>
              <SectionHeader
                title="Contract Farming Details"
                icon="leaf-outline"
                isExpanded={expandedSections.farmingDetails}
                onToggle={() => toggleSection('farmingDetails')}
                description="Crop, practices, quality"
              />

              {expandedSections.farmingDetails && (
                <View style={styles.sectionContent}>

              {/* Crop Type */}
              <Input
                label="Crop Type"
                value={cropType}
                onChangeText={setCropType}
                placeholder="e.g., Wheat, Rice, Cotton"
                error={errors.cropType}
              />

              {/* Land Area and Unit */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Land Area"
                    value={landArea}
                    onChangeText={setLandArea}
                    placeholder="Enter land area"
                    keyboardType="numeric"
                    error={errors.landArea}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Area Unit</Text>
                  <View style={styles.unitSelector}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        landAreaUnit === 'acre' && styles.activeUnitButton,
                      ]}
                      onPress={() => setLandAreaUnit('acre')}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          landAreaUnit === 'acre' && styles.activeUnitButtonText,
                        ]}
                      >
                        Acre
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        landAreaUnit === 'hectare' && styles.activeUnitButton,
                      ]}
                      onPress={() => setLandAreaUnit('hectare')}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          landAreaUnit === 'hectare' && styles.activeUnitButtonText,
                        ]}
                      >
                        Hectare
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Expected Yield and Unit */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Expected Yield"
                    value={expectedYield}
                    onChangeText={setExpectedYield}
                    placeholder="Enter expected yield"
                    keyboardType="numeric"
                    error={errors.expectedYield}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    label="Yield Unit"
                    value={yieldUnit}
                    onChangeText={setYieldUnit}
                    placeholder="e.g., kg, quintal, ton"
                    error={errors.yieldUnit}
                  />
                </View>
              </View>

              {/* Farming Practices */}
              <Text style={styles.label}>Farming Practices</Text>
              {errors.farmingPractices && <Text style={styles.errorText}>{errors.farmingPractices}</Text>}

              {farmingPractices.map((practice, index) => (
                <View key={index} style={styles.termContainer}>
                  <TextInput
                    style={styles.termInput}
                    value={practice}
                    onChangeText={(value) => updateFarmingPractice(index, value)}
                    placeholder={`Practice ${index + 1} (e.g., Organic, No-till)`}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.termRemoveButton}
                    onPress={() => removeFarmingPractice(index)}
                    disabled={farmingPractices.length === 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={farmingPractices.length === 1 ? colors.lightGray : colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <Button
                title="Add Farming Practice"
                onPress={addFarmingPractice}
                variant="outline"
                size="small"
                style={styles.addButton}
                leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
              />

              {/* Support Provisions */}
              <Text style={styles.label}>Support Provisions</Text>
              <Text style={styles.helperText}>Select the support that will be provided to the farmer</Text>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setSeedProvision(!seedProvision)}
                >
                  <View style={[styles.checkboxBox, seedProvision && styles.checkboxChecked]}>
                    {seedProvision && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Seed Provision</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setInputProvision(!inputProvision)}
                >
                  <View style={[styles.checkboxBox, inputProvision && styles.checkboxChecked]}>
                    {inputProvision && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Input Provision (Fertilizers, etc.)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setHarvestingSupport(!harvestingSupport)}
                >
                  <View style={[styles.checkboxBox, harvestingSupport && styles.checkboxChecked]}>
                    {harvestingSupport && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Harvesting Support</Text>
                </TouchableOpacity>
              </View>

              {/* Quality Parameters */}
              <Text style={styles.label}>Quality Parameters</Text>
              {errors.qualityParameters && <Text style={styles.errorText}>{errors.qualityParameters}</Text>}

              {qualityParameters.map((param, index) => (
                <View key={index} style={styles.qualityParamContainer}>
                  <Input
                    label="Parameter Name"
                    value={param.parameter}
                    onChangeText={(value) => updateQualityParameter(index, 'parameter', value)}
                    placeholder="e.g., Moisture Content"
                    containerStyle={styles.parameterInput}
                  />

                  <View style={styles.row}>
                    <View style={styles.thirdInput}>
                      <Input
                        label="Min Value"
                        value={param.minValue}
                        onChangeText={(value) => updateQualityParameter(index, 'minValue', value)}
                        placeholder="Min"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.thirdInput}>
                      <Input
                        label="Max Value"
                        value={param.maxValue}
                        onChangeText={(value) => updateQualityParameter(index, 'maxValue', value)}
                        placeholder="Max"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.thirdInput}>
                      <Input
                        label="Unit"
                        value={param.unit}
                        onChangeText={(value) => updateQualityParameter(index, 'unit', value)}
                        placeholder="e.g., %"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeParameterButton}
                    onPress={() => removeQualityParameter(index)}
                    disabled={qualityParameters.length === 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={qualityParameters.length === 1 ? colors.lightGray : colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <Button
                title="Add Quality Parameter"
                onPress={addQualityParameter}
                variant="outline"
                size="small"
                style={styles.addButton}
                leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
              />

              {/* Payment Schedule */}
              <Text style={styles.label}>Payment Schedule</Text>
              <Text style={styles.helperText}>Define payment milestones (total must equal 100%)</Text>
              {errors.paymentSchedule && <Text style={styles.errorText}>{errors.paymentSchedule}</Text>}
              {errors.paymentScheduleTotal && <Text style={styles.errorText}>{errors.paymentScheduleTotal}</Text>}

              {paymentSchedule.map((schedule, index) => (
                <View key={index} style={styles.paymentScheduleContainer}>
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Input
                        label="Milestone"
                        value={schedule.milestone}
                        onChangeText={(value) => updatePaymentSchedule(index, 'milestone', value)}
                        placeholder="e.g., Advance, Harvest"
                      />
                    </View>

                    <View style={styles.halfInput}>
                      <Input
                        label="Percentage (%)"
                        value={schedule.percentage}
                        onChangeText={(value) => updatePaymentSchedule(index, 'percentage', value)}
                        placeholder="e.g., 30"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowPaymentScheduleDatePicker(index)}
                  >
                    <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                    <Text style={styles.dateText}>
                      Estimated Date: {schedule.estimatedDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  {showPaymentScheduleDatePicker === index && (
                    <DateTimePicker
                      value={schedule.estimatedDate}
                      mode="date"
                      display="default"
                      onChange={handlePaymentScheduleDateChange}
                      minimumDate={startDate}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.removeScheduleButton}
                    onPress={() => removePaymentSchedule(index)}
                    disabled={paymentSchedule.length === 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={paymentSchedule.length === 1 ? colors.lightGray : colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <Button
                title="Add Payment Milestone"
                onPress={addPaymentSchedule}
                variant="outline"
                size="small"
                style={styles.addButton}
                leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
              />
                </View>
              )}

              {/* AACC Certification Requirements */}
              <SectionHeader
                title="AACC Certification Requirements"
                icon="shield-checkmark"
                isExpanded={expandedSections.aaccCertification}
                onToggle={() => toggleSection('aaccCertification')}
                description="Quality & safety standards"
              />

              {expandedSections.aaccCertification && (
                <View style={styles.sectionContent}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Require AACC Certification</Text>
                    <Switch
                      value={requireAacc}
                      onValueChange={setRequireAacc}
                      trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                      thumbColor={requireAacc ? colors.primary : colors.gray}
                    />
                  </View>

                  {requireAacc && (
                    <>
                      <Text style={styles.helperText}>
                        Agricultural and Allied Commodities Certification (AACC) ensures the quality, safety, and authenticity of agricultural products.
                      </Text>

                      <Text style={styles.label}>Minimum Grade Required</Text>
                      <View style={styles.gradeContainer}>
                        {(['A+', 'A', 'B+', 'B', 'C'] as const).map((grade) => (
                          <TouchableOpacity
                            key={grade}
                            style={[
                              styles.gradeButton,
                              aaccRequirements.minimumGrade === grade && styles.activeGradeButton
                            ]}
                            onPress={() => setAaccRequirements({...aaccRequirements, minimumGrade: grade})}
                          >
                            <Text style={[
                              styles.gradeText,
                              aaccRequirements.minimumGrade === grade && styles.activeGradeText
                            ]}>
                              {grade}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={styles.row}>
                        <View style={styles.halfInput}>
                          <Input
                            label="Minimum Quality Score (0-100)"
                            value={aaccRequirements.minimumQualityScore}
                            onChangeText={(text) => setAaccRequirements({...aaccRequirements, minimumQualityScore: text})}
                            keyboardType="numeric"
                            error={errors.minimumQualityScore}
                          />
                        </View>

                        <View style={styles.halfInput}>
                          <Input
                            label="Minimum Safety Score (0-100)"
                            value={aaccRequirements.minimumSafetyScore}
                            onChangeText={(text) => setAaccRequirements({...aaccRequirements, minimumSafetyScore: text})}
                            keyboardType="numeric"
                            error={errors.minimumSafetyScore}
                          />
                        </View>
                      </View>

                      <Text style={styles.label}>Required Standards</Text>
                      <View style={styles.standardsContainer}>
                        {['Food Safety', 'Quality Assurance', 'Organic', 'Sustainable', 'Fair Trade'].map((standard) => (
                          <TouchableOpacity
                            key={standard}
                            style={[
                              styles.standardButton,
                              aaccRequirements.requiredStandards.includes(standard) && styles.activeStandardButton
                            ]}
                            onPress={() => {
                              const updatedStandards = aaccRequirements.requiredStandards.includes(standard)
                                ? aaccRequirements.requiredStandards.filter(s => s !== standard)
                                : [...aaccRequirements.requiredStandards, standard];
                              setAaccRequirements({...aaccRequirements, requiredStandards: updatedStandards});
                            }}
                          >
                            <Text style={[
                              styles.standardText,
                              aaccRequirements.requiredStandards.includes(standard) && styles.activeStandardText
                            ]}>
                              {standard}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Input
                        label="Testing Laboratory Preferences (Comma Separated)"
                        placeholder="e.g., National Food Lab, AgriTest, Quality Control Center"
                        value={aaccRequirements.testingLabPreferences}
                        onChangeText={(text) => setAaccRequirements({...aaccRequirements, testingLabPreferences: text})}
                      />

                      <Text style={styles.label}>Certification Cost Coverage</Text>
                      <View style={styles.costCoverageContainer}>
                        {(['buyer', 'farmer', 'shared'] as const).map((coverage) => (
                          <TouchableOpacity
                            key={coverage}
                            style={[
                              styles.coverageButton,
                              aaccRequirements.certificationCostCoverage === coverage && styles.activeCoverageButton
                            ]}
                            onPress={() => setAaccRequirements({...aaccRequirements, certificationCostCoverage: coverage})}
                          >
                            <Text style={[
                              styles.coverageText,
                              aaccRequirements.certificationCostCoverage === coverage && styles.activeCoverageText
                            ]}>
                              {coverage.charAt(0).toUpperCase() + coverage.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {aaccRequirements.certificationCostCoverage === 'shared' && (
                        <Input
                          label="Buyer's Cost Share Percentage (%)"
                          placeholder="e.g., 50"
                          value={aaccRequirements.costSharingRatio}
                          onChangeText={(text) => setAaccRequirements({...aaccRequirements, costSharingRatio: text})}
                          keyboardType="numeric"
                          error={errors.costSharingRatio}
                        />
                      )}
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* Structured Bidding Section */}
          {isTender && (
            <>
              <SectionHeader
                title="Structured Bidding"
                icon="options-outline"
                isExpanded={expandedSections.structuredBidding}
                onToggle={() => toggleSection('structuredBidding')}
                description="Bid evaluation parameters"
              />

              {expandedSections.structuredBidding && (
                <View style={styles.sectionContent}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Enable Structured Bidding</Text>
                    <Switch
                      value={enableStructuredBidding}
                      onValueChange={setEnableStructuredBidding}
                      trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                      thumbColor={enableStructuredBidding ? colors.primary : colors.gray}
                    />
                  </View>

              {enableStructuredBidding && (
                    <>
                      <Text style={styles.helperText}>
                        Structured bidding allows you to define specific parameters for evaluating bids beyond just price.
                      </Text>

                      {/* Bid Parameters */}
                      <Text style={styles.label}>Bid Parameters</Text>
                      <Text style={styles.helperText}>Define parameters for bid evaluation (weights must total 100%)</Text>
                      {errors.bidParameters && <Text style={styles.errorText}>{errors.bidParameters}</Text>}
                      {errors.bidParametersWeight && <Text style={styles.errorText}>{errors.bidParametersWeight}</Text>}

                      {bidParameters.map((param, index) => (
                        <View key={index} style={styles.bidParamContainer}>
                          <View style={styles.row}>
                            <View style={styles.halfInput}>
                              <Input
                                label="Parameter Name"
                                value={param.name}
                                onChangeText={(value) => updateBidParameter(index, 'name', value)}
                                placeholder="e.g., Price, Quality"
                              />
                            </View>

                            <View style={styles.halfInput}>
                              <Input
                                label="Weight (%)"
                                value={param.weight}
                                onChangeText={(value) => updateBidParameter(index, 'weight', value)}
                                placeholder="e.g., 50"
                                keyboardType="numeric"
                              />
                            </View>
                          </View>

                          <Input
                            label="Description"
                            value={param.description}
                            onChangeText={(value) => updateBidParameter(index, 'description', value)}
                            placeholder="Describe what this parameter measures"
                            multiline
                          />

                          <View style={styles.row}>
                            <View style={styles.halfInput}>
                              <Text style={styles.label}>Parameter Type</Text>
                              <View style={styles.typeSelector}>
                                {(['numeric', 'boolean', 'text', 'date'] as const).map((type) => (
                                  <TouchableOpacity
                                    key={type}
                                    style={[
                                      styles.typeButton,
                                      param.type === type && styles.activeTypeButton,
                                      { marginRight: spacing.xs, marginBottom: spacing.xs }
                                    ]}
                                    onPress={() => updateBidParameter(index, 'type', type)}
                                  >
                                    <Text
                                      style={[
                                        styles.typeText,
                                        param.type === type && styles.activeTypeText,
                                      ]}
                                    >
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>

                            <View style={styles.halfInput}>
                              <View style={styles.checkbox} style={{ marginTop: spacing.lg }}>
                                <TouchableOpacity
                                  onPress={() => updateBidParameter(index, 'isRequired', !param.isRequired)}
                                >
                                  <View style={[styles.checkboxBox, param.isRequired && styles.checkboxChecked]}>
                                    {param.isRequired && <Ionicons name="checkmark" size={16} color={colors.white} />}
                                  </View>
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Required Parameter</Text>
                              </View>
                            </View>
                          </View>

                          {param.type === 'numeric' && (
                            <View style={styles.row}>
                              <View style={styles.thirdInput}>
                                <Input
                                  label="Min Value"
                                  value={param.minValue}
                                  onChangeText={(value) => updateBidParameter(index, 'minValue', value)}
                                  placeholder="Min"
                                  keyboardType="numeric"
                                />
                              </View>

                              <View style={styles.thirdInput}>
                                <Input
                                  label="Max Value"
                                  value={param.maxValue}
                                  onChangeText={(value) => updateBidParameter(index, 'maxValue', value)}
                                  placeholder="Max"
                                  keyboardType="numeric"
                                />
                              </View>

                              <View style={styles.thirdInput}>
                                <Input
                                  label="Unit"
                                  value={param.unit}
                                  onChangeText={(value) => updateBidParameter(index, 'unit', value)}
                                  placeholder="e.g., ₹, kg"
                                />
                              </View>
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.removeParameterButton}
                            onPress={() => removeBidParameter(index)}
                            disabled={bidParameters.length === 1}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color={bidParameters.length === 1 ? colors.lightGray : colors.error}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <Button
                        title="Add Bid Parameter"
                        onPress={addBidParameter}
                        variant="outline"
                        size="small"
                        style={styles.addButton}
                        leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
                      />

                      {/* Evaluation Method */}
                      <Text style={styles.label}>Evaluation Method</Text>
                      <View style={styles.evaluationMethodContainer}>
                        <TouchableOpacity
                          style={[
                            styles.evaluationMethodButton,
                            evaluationMethod === 'automatic' && styles.activeEvaluationMethodButton,
                          ]}
                          onPress={() => setEvaluationMethod('automatic')}
                        >
                          <Ionicons
                            name="calculator-outline"
                            size={24}
                            color={evaluationMethod === 'automatic' ? colors.primary : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.evaluationMethodText,
                              evaluationMethod === 'automatic' && styles.activeEvaluationMethodText,
                            ]}
                          >
                            Automatic
                          </Text>
                          <Text style={styles.evaluationMethodDescription}>
                            System calculates scores based on parameter weights
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.evaluationMethodButton,
                            evaluationMethod === 'manual' && styles.activeEvaluationMethodButton,
                          ]}
                          onPress={() => setEvaluationMethod('manual')}
                        >
                          <Ionicons
                            name="person-outline"
                            size={24}
                            color={evaluationMethod === 'manual' ? colors.primary : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.evaluationMethodText,
                              evaluationMethod === 'manual' && styles.activeEvaluationMethodText,
                            ]}
                          >
                            Manual
                          </Text>
                          <Text style={styles.evaluationMethodDescription}>
                            You'll review and score each bid manually
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Minimum Qualifications */}
                      <Text style={styles.label}>Minimum Qualifications (Optional)</Text>
                      <Text style={styles.helperText}>Define minimum requirements for bidders</Text>

                      {minimumQualifications.map((qualification, index) => (
                        <View key={index} style={styles.termContainer}>
                          <TextInput
                            style={styles.termInput}
                            value={qualification}
                            onChangeText={(value) => updateMinimumQualification(index, value)}
                            placeholder={`Qualification ${index + 1} (e.g., 3+ years experience)`}
                            multiline
                          />

                          <TouchableOpacity
                            style={styles.termRemoveButton}
                            onPress={() => removeMinimumQualification(index)}
                            disabled={minimumQualifications.length === 1}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color={minimumQualifications.length === 1 ? colors.lightGray : colors.error}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <Button
                        title="Add Qualification"
                        onPress={addMinimumQualification}
                        variant="outline"
                        size="small"
                        style={styles.addButton}
                        leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
                      />
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <Button
              title={isTender ? 'Create Tender' : 'Create Contract'}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
              leftIcon={<Ionicons name="checkmark-circle" size={24} color={colors.white} />}
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
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    margin: spacing.md,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
    width: '95%',
    maxWidth: 550,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.veryLightGray,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    justifyContent: 'space-between',
  },
  typeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: '30%',
    alignItems: 'center',
  },
  activeTypeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTypeText: {
    color: colors.primary,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  switchLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  tenderInfo: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  termContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  termInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  termRemoveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  submitButtonContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // Section styles
  sectionDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // Unit selector styles
  unitSelector: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  unitButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  activeUnitButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  unitButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeUnitButtonText: {
    color: colors.primary,
  },

  // Checkbox styles
  checkboxContainer: {
    marginBottom: spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },

  // Quality parameter styles
  qualityParamContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  parameterInput: {
    marginBottom: spacing.sm,
  },
  thirdInput: {
    width: '32%',
    marginRight: '2%',
  },
  removeParameterButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },

  // Payment schedule styles
  paymentScheduleContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  removeScheduleButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },

  // Bid parameter styles
  bidParamContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTypeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTypeText: {
    color: colors.primary,
  },

  // Evaluation method styles
  evaluationMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  evaluationMethodButton: {
    width: '48%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  activeEvaluationMethodButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  evaluationMethodText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  activeEvaluationMethodText: {
    color: colors.primary,
  },
  evaluationMethodDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // AACC certification styles
  aaccHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gradeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  activeGradeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  gradeText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },
  activeGradeText: {
    color: colors.primary,
  },
  standardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  standardButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeStandardButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  standardText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeStandardText: {
    color: colors.primary,
  },
  costCoverageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  coverageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  activeCoverageButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  coverageText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeCoverageText: {
    color: colors.primary,
  },

  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.lightGray,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: spacing.md,
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  sectionHeaderDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    width: '100%',
  },
  sectionContent: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
});

// Section Header Component
const SectionHeader = ({ title, icon, isExpanded, onToggle, description }) => {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionHeaderLeft}>
        {icon && <Ionicons name={icon} size={24} color={colors.primary} style={styles.sectionIcon} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          {description && <Text style={styles.sectionHeaderDescription}>{description}</Text>}
        </View>
      </View>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={24}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

export default AddContractScreen;
