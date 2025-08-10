import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

// Dummy insurance companies data
// Helper function to create a colored circle with text as an image source
const createLogoSource = (text: string, bgColor: string) => {
  return {
    uri: `https://via.placeholder.com/100/${bgColor.replace('#', '')}/FFFFFF?text=${text}`
  };
};

const insuranceCompanies = [
  {
    id: '1',
    name: 'Kisan Suraksha Insurance',
    logo: createLogoSource('KSI', '#4CAF50'),
    description: 'Comprehensive crop insurance for all types of crops with quick claim settlement.',
    coverageTypes: ['Crop Damage', 'Natural Disasters', 'Pest Attacks'],
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Bharat Krishi Bima',
    logo: createLogoSource('BKB', '#2196F3'),
    description: 'Government-backed insurance scheme with subsidized premiums for small farmers.',
    coverageTypes: ['Weather Risks', 'Yield Protection', 'Revenue Protection'],
    rating: 4.2,
  },
  {
    id: '3',
    name: 'AgriSure Insurance',
    logo: createLogoSource('ASI', '#FF9800'),
    description: 'Specialized insurance for high-value crops with personalized risk assessment.',
    coverageTypes: ['Crop-specific Coverage', 'Equipment Protection', 'Liability Coverage'],
    rating: 4.7,
  },
];

const InsuranceQuotesScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Handle get quote button press
  const handleGetQuote = (companyId: string) => {
    setSelectedCompany(companyId);
    Alert.alert(
      'Request Submitted',
      'Your insurance quote request has been submitted. A representative will contact you soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance Quotes</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Available Insurance Providers</Text>
        <Text style={styles.description}>
          Compare and request quotes from top agricultural insurance providers.
          Protect your crops and livelihood from unforeseen risks.
        </Text>

        {insuranceCompanies.map((company) => (
          <Card key={company.id} style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <Image source={company.logo} style={styles.companyLogo} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{company.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text style={styles.ratingText}>{company.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.companyDescription}>{company.description}</Text>

            <View style={styles.coverageContainer}>
              <Text style={styles.coverageTitle}>Coverage Types:</Text>
              <View style={styles.coverageList}>
                {company.coverageTypes.map((type, index) => (
                  <View key={index} style={styles.coverageItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.coverageText}>{type}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Button
              title={selectedCompany === company.id ? "Quote Requested" : "Get Quote"}
              onPress={() => handleGetQuote(company.id)}
              style={styles.quoteButton}
              disabled={selectedCompany === company.id}
            />
          </Card>
        ))}

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Disclaimer: The insurance quotes provided are for informational purposes only.
            Actual coverage, premiums, and terms may vary. Please contact the insurance
            provider directly for detailed information.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.md,
  },
  companyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  companyDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  coverageContainer: {
    marginBottom: spacing.md,
  },
  coverageTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  coverageList: {
    flexDirection: 'column',
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  coverageText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  quoteButton: {
    marginTop: spacing.md,
  },
  disclaimerContainer: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
  },
});

export default InsuranceQuotesScreen;
