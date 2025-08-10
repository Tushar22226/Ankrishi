import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import SchemeService, { GovernmentScheme } from '../../services/SchemeService';

// Mock scheme data (same as in ViewSchemesScreen)
const mockSchemes = [
  {
    id: '1',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'insurance',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    description: 'A crop insurance scheme that aims to reduce the premium burden on farmers and ensure early settlement of crop assurance claims for the full insured sum.',
    eligibility: [
      'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas',
      'Compulsory for farmers availing crop loans for notified crops',
      'Voluntary for non-loanee farmers',
    ],
    benefits: [
      'Insurance coverage and financial support to farmers in the event of crop failure',
      'Stabilizing the income of farmers to ensure their continuance in farming',
      'Encouraging farmers to adopt innovative and modern agricultural practices',
    ],
    applicationProcess: [
      'Approach the nearest bank branch or insurance company',
      'Fill the application form and submit required documents',
      'Pay the premium amount',
    ],
    documents: [
      'Aadhaar Card',
      'Land Records (7/12 extract)',
      'Bank Account Details',
      'Passport Size Photograph',
    ],
    lastDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
    status: 'active',
    website: 'https://pmfby.gov.in/',
    formFields: [
      { id: 'name', label: 'Full Name', type: 'text', required: true },
      { id: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true },
      { id: 'mobile', label: 'Mobile Number', type: 'text', required: true },
      { id: 'address', label: 'Address', type: 'text', required: true },
      { id: 'landArea', label: 'Land Area (in acres)', type: 'text', required: true },
      { id: 'crop', label: 'Crop Type', type: 'text', required: true },
      { id: 'season', label: 'Crop Season', type: 'text', required: true },
      { id: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { id: 'accountNumber', label: 'Bank Account Number', type: 'text', required: true },
      { id: 'ifsc', label: 'IFSC Code', type: 'text', required: true },
    ],
  },
  // Other schemes...
];

const ApplySchemesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get scheme ID from route params
  const { schemeId } = route.params as { schemeId: string };

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scheme, setScheme] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentsChecklist, setDocumentsChecklist] = useState<Record<string, boolean>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load scheme on component mount
  useEffect(() => {
    loadScheme();
  }, [schemeId]);

  // Initialize form data and documents checklist when scheme is loaded
  useEffect(() => {
    if (scheme) {
      // Initialize form data with empty values
      const initialFormData: Record<string, string> = {};
      scheme.formFields.forEach((field: any) => {
        initialFormData[field.id] = '';
      });

      // Pre-fill with user profile data if available
      if (userProfile) {
        if (userProfile.displayName) initialFormData.name = userProfile.displayName;
        if (userProfile.phoneNumber) initialFormData.mobile = userProfile.phoneNumber;
        // Add more pre-filled fields as needed
      }

      setFormData(initialFormData);

      // Initialize documents checklist
      const initialChecklist: Record<string, boolean> = {};
      scheme.documents.forEach((doc: string) => {
        initialChecklist[doc] = false;
      });
      setDocumentsChecklist(initialChecklist);
    }
  }, [scheme, userProfile]);

  // Load scheme
  const loadScheme = async () => {
    try {
      setLoading(true);

      // Fetch scheme from SchemeService
      console.log('Fetching scheme with ID:', schemeId);
      const foundScheme = await SchemeService.getSchemeById(schemeId);

      if (foundScheme) {
        console.log('Found scheme:', foundScheme.title);
        setScheme(foundScheme);
      } else {
        console.log('Scheme not found in database');
        Alert.alert('Error', 'Scheme not found');
        navigation.goBack();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading scheme:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load scheme details');
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

  // Handle form input change
  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));

    // Clear error for this field
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: '',
      }));
    }
  };

  // Handle document checkbox toggle
  const handleDocumentToggle = (document: string) => {
    setDocumentsChecklist(prev => ({
      ...prev,
      [document]: !prev[document],
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate form fields
    scheme.formFields.forEach((field: any) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
        isValid = false;
      }
    });

    // Validate documents checklist
    const allDocumentsChecked = Object.values(documentsChecklist).every(checked => checked);
    if (!allDocumentsChecked) {
      newErrors.documents = 'Please confirm you have all required documents';
      isValid = false;
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields and check all documents');
      return;
    }

    try {
      setSubmitting(true);

      // In a real app, we would submit the form to a service
      // For now, let's simulate a submission
      setTimeout(() => {
        setSubmitting(false);
        Alert.alert(
          'Application Submitted',
          'Your application has been submitted successfully. You can track the status in the My Applications section.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ViewSchemes' as never),
            },
          ]
        );
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitting(false);
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading application form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Apply for Scheme</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Scheme Info */}
        <Card style={styles.schemeInfoCard}>
          <Text style={styles.schemeTitle}>{scheme.title}</Text>
          <Text style={styles.schemeMinistry}>{scheme.ministry}</Text>

          {scheme.lastDate && (
            <View style={styles.lastDateContainer}>
              <Text style={styles.lastDateLabel}>Last Date for Application:</Text>
              <Text style={styles.lastDateValue}>
                {formatDate(new Date(scheme.lastDate))}
              </Text>
            </View>
          )}
        </Card>

        {/* Application Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Application Form</Text>

          {scheme.formFields.map((field: any) => (
            <View key={field.id} style={styles.formField}>
              <Input
                label={field.label}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                value={formData[field.id]}
                onChangeText={(value) => handleInputChange(field.id, value)}
                error={errors[field.id]}
                touched={true}
                required={field.required}
              />
            </View>
          ))}
        </Card>

        {/* Required Documents */}
        <Card style={styles.documentsCard}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <Text style={styles.documentsDescription}>
            Please confirm that you have the following documents ready for submission:
          </Text>

          {scheme.documents.map((document: string, index: number) => (
            <View key={index} style={styles.documentItem}>
              <Text style={styles.documentName}>{document}</Text>
              <Switch
                value={documentsChecklist[document]}
                onValueChange={() => handleDocumentToggle(document)}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={documentsChecklist[document] ? colors.primary : colors.mediumGray}
              />
            </View>
          ))}

          {errors.documents && (
            <Text style={styles.errorText}>{errors.documents}</Text>
          )}
        </Card>

        {/* Terms and Conditions */}
        <Card style={styles.termsCard}>
          <View style={styles.termsHeader}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SchemeTerms' as never, { schemeId: scheme.id } as never)}
            >
              <Text style={styles.viewFullTermsText}>View Full Terms</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By submitting this application, I hereby declare that all the information provided is true and correct to the best of my knowledge. I understand that any false statement may result in the rejection of my application or cancellation of benefits.
          </Text>

          <View style={styles.termsCheckbox}>
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={termsAccepted ? colors.primary : colors.mediumGray}
            />
            <Text style={styles.termsCheckboxText}>
              I accept the terms and conditions
            </Text>
          </View>

          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}
        </Card>

        {/* Submit Button */}
        <View style={styles.submitButtonContainer}>
          <Button
            title="Submit Application"
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
          />
        </View>

        {/* Bottom spacing */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
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
  schemeInfoCard: {
    margin: spacing.md,
  },
  schemeTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  schemeMinistry: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  lastDateContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  lastDateLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  lastDateValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  formCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formField: {
    marginBottom: spacing.md,
  },
  documentsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  documentsDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  termsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  termsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewFullTermsText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  termsText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsCheckboxText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: spacing.xs,
  },
  submitButtonContainer: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ApplySchemesScreen;
