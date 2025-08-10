import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingQuote from '../../components/LoadingQuote';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

// Mock schemes data
const mockSchemes = [
  {
    id: '1',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'insurance',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    description: 'A crop insurance scheme that provides financial support to farmers in case of crop failure due to natural calamities, pests, and diseases.',
    eligibility: [
      'All farmers growing notified crops in notified areas',
      'Both loanee and non-loanee farmers are eligible',
      'Sharecroppers and tenant farmers are also eligible',
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
    successRate: 85,
    relevanceScore: 95,
    applicationStatus: null,
  },
  {
    id: '2',
    title: 'PM Kisan Samman Nidhi Yojana',
    category: 'financial',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    description: 'A central sector scheme to provide income support to all landholding farmers\' families in the country to supplement their financial needs.',
    eligibility: [
      'All landholding farmers\' families, which have cultivable landholding in their names',
      'Small and marginal farmer families having combined landholding up to 2 hectares',
      'Institutional landholders are not eligible',
    ],
    benefits: [
      'Direct income support of Rs. 6,000 per year to eligible farmer families',
      'Amount paid in three equal installments of Rs. 2,000 each',
      'Direct transfer to bank accounts of beneficiaries',
    ],
    applicationProcess: [
      'Apply online through the PM-KISAN portal or mobile app',
      'Visit your local Common Service Center (CSC)',
      'Contact your local agriculture officer for assistance',
    ],
    documents: [
      'Aadhaar Card',
      'Land Records',
      'Bank Account Details',
      'Passport Size Photograph',
    ],
    lastDate: null, // Ongoing scheme
    status: 'active',
    website: 'https://pmkisan.gov.in/',
    successRate: 92,
    relevanceScore: 90,
    applicationStatus: 'approved',
  },
  {
    id: '3',
    title: 'Kisan Credit Card (KCC)',
    category: 'credit',
    ministry: 'Ministry of Finance',
    description: 'A credit scheme to provide adequate and timely credit support to farmers for their cultivation needs.',
    eligibility: [
      'All farmers - individual/joint borrowers who are owner cultivators',
      'Tenant farmers, oral lessees & share croppers',
      'SHGs or Joint Liability Groups of farmers including tenant farmers, share croppers etc.',
    ],
    benefits: [
      'Short-term credit for cultivation of crops',
      'Post-harvest expenses',
      'Working capital for maintenance of farm assets',
      'Investment credit for agriculture and allied activities',
    ],
    applicationProcess: [
      'Apply at your nearest bank branch',
      'Submit the application form along with required documents',
      'Bank will process your application and issue the KCC',
    ],
    documents: [
      'Passport size photograph',
      'Land records / title deeds',
      'Identity proof (Aadhaar card, voter ID, etc.)',
      'Address proof',
    ],
    lastDate: null, // Ongoing scheme
    status: 'active',
    website: 'https://www.nabard.org/content.aspx?id=591',
    successRate: 88,
    relevanceScore: 85,
    applicationStatus: 'in_progress',
  },
  {
    id: '4',
    title: 'Soil Health Card Scheme',
    category: 'technical',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    description: 'A scheme to issue soil health cards to farmers containing crop-wise recommendations for nutrients and fertilizers to help farmers improve productivity through judicious use of inputs.',
    eligibility: [
      'All farmers across the country',
    ],
    benefits: [
      'Soil health assessment',
      'Recommendations for appropriate dosage of nutrients',
      'Improvement in soil health and crop yield',
      'Promotion of sustainable farming practices',
    ],
    applicationProcess: [
      'Contact local agriculture department or Krishi Vigyan Kendra',
      'Submit soil samples for testing',
      'Receive soil health card with recommendations',
    ],
    documents: [
      'Aadhaar Card',
      'Land Records',
    ],
    lastDate: null, // Ongoing scheme
    status: 'active',
    website: 'https://soilhealth.dac.gov.in/',
    successRate: 90,
    relevanceScore: 75,
    applicationStatus: null,
  },
  {
    id: '5',
    title: 'Agriculture Infrastructure Fund',
    category: 'infrastructure',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    description: 'A financing facility for the creation of post-harvest management infrastructure and community farming assets.',
    eligibility: [
      'Farmers',
      'Primary Agricultural Credit Societies (PACS)',
      'Marketing Cooperative Societies',
      'Farmer Producers Organizations (FPOs)',
      'Self Help Groups (SHGs)',
      'Joint Liability Groups (JLGs)',
      'Multipurpose Cooperative Societies',
      'Agri-entrepreneurs',
      'Start-ups',
      'Aggregation Infrastructure Providers',
    ],
    benefits: [
      'Interest subvention of 3% per annum, up to a limit of Rs. 2 crore',
      'Credit guarantee coverage under CGTMSE scheme for loans up to Rs. 2 crore',
      'Funding for setting up of cold stores and chains, warehousing, silos, etc.',
    ],
    applicationProcess: [
      'Apply online through the Agriculture Infrastructure Fund portal',
      'Submit the application form along with project details',
      'Bank will appraise the project and sanction the loan',
    ],
    documents: [
      'Identity proof',
      'Address proof',
      'Land documents (if applicable)',
      'Project report',
      'Cost estimates',
      'NOCs/permissions from local authorities',
    ],
    lastDate: new Date(2029, 3, 1), // April 1, 2029
    status: 'active',
    website: 'https://agriinfra.dac.gov.in/',
    successRate: 70,
    relevanceScore: 60,
    applicationStatus: null,
  },
];

// Scheme categories
const schemeCategories = [
  { id: 'all', name: 'All Schemes', icon: 'apps' },
  { id: 'financial', name: 'Financial Support', icon: 'cash' },
  { id: 'insurance', name: 'Insurance', icon: 'shield' },
  { id: 'credit', name: 'Credit & Loans', icon: 'card' },
  { id: 'technical', name: 'Technical Support', icon: 'construct' },
  { id: 'infrastructure', name: 'Infrastructure', icon: 'business' },
];

// Application status options
const applicationStatusOptions = [
  { id: 'not_applied', label: 'Not Applied', color: colors.textSecondary },
  { id: 'in_progress', label: 'In Progress', color: colors.warning },
  { id: 'approved', label: 'Approved', color: colors.success },
  { id: 'rejected', label: 'Rejected', color: colors.error },
];

const SchemeNavigatorScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState(mockSchemes);
  const [filteredSchemes, setFilteredSchemes] = useState(mockSchemes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  // Load schemes data
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);

        // In a real app, this would fetch data from the backend
        // For now, we'll use mock data with a simulated delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setSchemes(mockSchemes);
        setFilteredSchemes(mockSchemes);
      } catch (error) {
        console.error('Error loading schemes data:', error);
        Alert.alert('Error', 'Failed to load government schemes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSchemes();
  }, [userProfile]);

  // Filter schemes based on search query and category
  useEffect(() => {
    let filtered = schemes;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(scheme => scheme.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scheme =>
        scheme.title.toLowerCase().includes(query) ||
        scheme.description.toLowerCase().includes(query) ||
        scheme.ministry.toLowerCase().includes(query)
      );
    }

    // Sort by relevance score
    filtered = [...filtered].sort((a, b) => b.relevanceScore - a.relevanceScore);

    setFilteredSchemes(filtered);
  }, [schemes, searchQuery, selectedCategory]);

  // Toggle expanded scheme
  const toggleScheme = (schemeId: string) => {
    if (expandedScheme === schemeId) {
      setExpandedScheme(null);
    } else {
      setExpandedScheme(schemeId);
    }
  };

  // Handle search
  const handleSearch = () => {
    // Search is handled in the useEffect
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Handle apply for scheme
  const handleApplyForScheme = (schemeId: string) => {
    Alert.alert(
      'Apply for Scheme',
      'Would you like to start the application process for this scheme?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Apply',
          onPress: () => {
            // In a real app, this would navigate to an application form
            Alert.alert('Application Started', 'You will be guided through the application process step by step.');

            // Update the scheme's application status
            setSchemes(prevSchemes =>
              prevSchemes.map(scheme =>
                scheme.id === schemeId
                  ? { ...scheme, applicationStatus: 'in_progress' }
                  : scheme
              )
            );
          },
        },
      ]
    );
  };

  // Handle check application status
  const handleCheckStatus = (schemeId: string) => {
    const scheme = schemes.find(s => s.id === schemeId);
    if (!scheme) return;

    if (scheme.applicationStatus === 'in_progress') {
      Alert.alert(
        'Application Status',
        'Your application is being processed. Estimated completion time: 7-10 working days.',
        [
          {
            text: 'OK',
            style: 'cancel',
          },
          {
            text: 'Track Details',
            onPress: () => Alert.alert('Track Application', 'This would show detailed tracking information'),
          },
        ]
      );
    } else if (scheme.applicationStatus === 'approved') {
      Alert.alert(
        'Application Approved',
        'Your application has been approved. You will receive benefits according to the scheme guidelines.',
        [
          {
            text: 'OK',
            style: 'cancel',
          },
          {
            text: 'View Details',
            onPress: () => Alert.alert('Approval Details', 'This would show approval details and next steps'),
          },
        ]
      );
    } else if (scheme.applicationStatus === 'rejected') {
      Alert.alert(
        'Application Rejected',
        'Your application was not approved. Please check the rejection reason and reapply if eligible.',
        [
          {
            text: 'OK',
            style: 'cancel',
          },
          {
            text: 'View Reason',
            onPress: () => Alert.alert('Rejection Reason', 'This would show the reason for rejection'),
          },
          {
            text: 'Reapply',
            onPress: () => handleApplyForScheme(schemeId),
          },
        ]
      );
    }
  };

  // Get application status label and color
  const getApplicationStatus = (status: string | null) => {
    if (!status) return applicationStatusOptions[0];
    return applicationStatusOptions.find(option => option.id === status) || applicationStatusOptions[0];
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'Ongoing';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <LoadingQuote
        loadingText="Loading government schemes..."
        style={styles.loadingContainer}
      />
    );
  }

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
        <Text style={styles.headerTitle}>Government Schemes</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search schemes by name, description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={schemeCategories}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.selectedCategoryButton,
              ]}
              onPress={() => handleCategorySelect(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={selectedCategory === item.id ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === item.id && styles.selectedCategoryButtonText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Schemes List */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.schemesContainer}>
          {filteredSchemes.length > 0 ? (
            filteredSchemes.map(scheme => (
              <Card key={scheme.id} style={styles.schemeCard}>
                <TouchableOpacity
                  style={styles.schemeHeader}
                  onPress={() => toggleScheme(scheme.id)}
                >
                  <View style={styles.schemeTitleContainer}>
                    <Text style={styles.schemeTitle}>{scheme.title}</Text>
                    <View style={styles.schemeMetaContainer}>
                      <Text style={styles.schemeMinistry}>{scheme.ministry}</Text>
                      <View style={styles.schemeStatusContainer}>
                        <View
                          style={[
                            styles.schemeStatusBadge,
                            { backgroundColor: getApplicationStatus(scheme.applicationStatus).color },
                          ]}
                        >
                          <Text style={styles.schemeStatusText}>
                            {getApplicationStatus(scheme.applicationStatus).label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Ionicons
                    name={expandedScheme === scheme.id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <View style={styles.schemePreview}>
                  <Text style={styles.schemeDescription} numberOfLines={expandedScheme === scheme.id ? undefined : 2}>
                    {scheme.description}
                  </Text>
                </View>

                {expandedScheme === scheme.id && (
                  <View style={styles.schemeDetails}>
                    {/* Eligibility */}
                    <View style={styles.schemeSection}>
                      <Text style={styles.schemeSectionTitle}>Eligibility</Text>
                      {scheme.eligibility.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.success} style={styles.listItemIcon} />
                          <Text style={styles.listItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Benefits */}
                    <View style={styles.schemeSection}>
                      <Text style={styles.schemeSectionTitle}>Benefits</Text>
                      {scheme.benefits.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="star" size={18} color={colors.secondary} style={styles.listItemIcon} />
                          <Text style={styles.listItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Application Process */}
                    <View style={styles.schemeSection}>
                      <Text style={styles.schemeSectionTitle}>Application Process</Text>
                      {scheme.applicationProcess.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.listItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Required Documents */}
                    <View style={styles.schemeSection}>
                      <Text style={styles.schemeSectionTitle}>Required Documents</Text>
                      {scheme.documents.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="document-text" size={18} color={colors.primary} style={styles.listItemIcon} />
                          <Text style={styles.listItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Additional Info */}
                    <View style={styles.schemeSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Last Date</Text>
                          <Text style={styles.infoValue}>{formatDate(scheme.lastDate)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Success Rate</Text>
                          <Text style={styles.infoValue}>{scheme.successRate}%</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.schemeActions}>
                      {scheme.applicationStatus === null ? (
                        <Button
                          title="Apply Now"
                          onPress={() => handleApplyForScheme(scheme.id)}
                          style={styles.applyButton}
                          leftIcon={<Ionicons name="paper-plane" size={18} color={colors.white} style={styles.buttonIcon} />}
                        />
                      ) : (
                        <Button
                          title="Check Status"
                          onPress={() => handleCheckStatus(scheme.id)}
                          style={styles.statusButton}
                          leftIcon={<Ionicons name="time" size={18} color={colors.white} style={styles.buttonIcon} />}
                        />
                      )}

                      <Button
                        title="Visit Website"
                        variant="outline"
                        onPress={() => Alert.alert('Open Website', `This would open ${scheme.website}`)}
                        style={styles.websiteButton}
                        leftIcon={<Ionicons name="globe" size={18} color={colors.primary} style={styles.buttonIcon} />}
                      />
                    </View>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={64} color={colors.lightGray} />
              <Text style={styles.noResultsText}>No schemes found matching your search</Text>
              <Button
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                style={styles.clearFiltersButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
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
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  categoriesContainer: {
    marginBottom: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  selectedCategoryButtonText: {
    color: colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  schemesContainer: {
    padding: spacing.md,
  },
  schemeCard: {
    marginBottom: spacing.md,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  schemeTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  schemeTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  schemeMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schemeMinistry: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  schemeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schemeStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  schemeStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  schemePreview: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  schemeDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  schemeDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  schemeSection: {
    marginBottom: spacing.md,
  },
  schemeSectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  listItemIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  listItemText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  schemeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  applyButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusButton: {
    flex: 1,
    marginRight: spacing.sm,
    backgroundColor: colors.info,
  },
  websiteButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noResultsText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  clearFiltersButton: {
    marginTop: spacing.md,
  },
});

export default SchemeNavigatorScreen;
