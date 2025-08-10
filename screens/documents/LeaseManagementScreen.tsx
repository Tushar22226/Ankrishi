import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Lease information content
const leaseInformation = {
  howLeasesWork: [
    'Farm leases are agreements where landowners (lessors) allow farmers (lessees) to use agricultural land for a specified period.',
    'Leases typically include terms for rent payment, duration, land use restrictions, and maintenance responsibilities.',
    'Common lease types include cash rent (fixed payment), crop-share (percentage of harvest), and flexible leases (combination of fixed and variable payments).',
    'Leases can be short-term (1-3 years) or long-term (5+ years) depending on farming needs and landowner preferences.',
  ],
  contractCreation: [
    'Identify suitable land and verify ownership through land records.',
    'Negotiate terms including rent, duration, payment schedule, and specific land use permissions.',
    'Document all agreements in a written contract reviewed by legal experts.',
    'Include clear clauses about land maintenance, improvements, and dispute resolution.',
    'Register the lease agreement with local authorities for legal protection.',
    'Conduct thorough land inspection and document existing conditions before signing.',
  ],
  farmerRights: [
    'Right to peaceful possession and use of the land as specified in the agreement.',
    'Protection from arbitrary termination before the lease period ends.',
    'Right to compensation for permanent improvements made with landowner consent.',
    'Right to harvest crops planted during the lease term, even if lease expires before harvest.',
    'Protection under various state tenancy laws that safeguard farmer interests.',
  ],
  disputeResolution: [
    'Document all communications and keep records of payments and receipts.',
    'Refer to the dispute resolution clause in your lease agreement.',
    'Seek mediation through local agricultural extension offices or farmer associations.',
    'File complaints with district agricultural officers or revenue departments.',
    'Consider legal action through consumer courts or civil courts if other methods fail.',
    'Contact farmer helplines and legal aid services for guidance and support.',
  ],
};

const LeaseManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('howLeasesWork');

  // Load lease information on component mount
  useEffect(() => {
    // Simulate loading for a better UX
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Render information section
  const renderInformationSection = (title: string, items: string[]) => (
    <Card style={styles.infoCard}>
      <Text style={styles.infoTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.infoItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.infoText}>{item}</Text>
        </View>
      ))}
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading leases...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeSection === 'howLeasesWork' && styles.activeTabButton,
          ]}
          onPress={() => setActiveSection('howLeasesWork')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeSection === 'howLeasesWork' && styles.activeTabButtonText,
            ]}
          >
            How Leases Work
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeSection === 'contractCreation' && styles.activeTabButton,
          ]}
          onPress={() => setActiveSection('contractCreation')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeSection === 'contractCreation' && styles.activeTabButtonText,
            ]}
          >
            Creating Contracts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeSection === 'farmerRights' && styles.activeTabButton,
          ]}
          onPress={() => setActiveSection('farmerRights')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeSection === 'farmerRights' && styles.activeTabButtonText,
            ]}
          >
            Your Rights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeSection === 'disputeResolution' && styles.activeTabButton,
          ]}
          onPress={() => setActiveSection('disputeResolution')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeSection === 'disputeResolution' && styles.activeTabButtonText,
            ]}
          >
            Dispute Resolution
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoHeader}>
          <Text style={styles.infoHeaderTitle}>
            {activeSection === 'howLeasesWork' && 'How Farm Leases Work'}
            {activeSection === 'contractCreation' && 'Creating Lease Contracts'}
            {activeSection === 'farmerRights' && 'Your Rights as a Farmer'}
            {activeSection === 'disputeResolution' && 'What to Do If You Feel Scammed'}
          </Text>
          <Text style={styles.infoHeaderSubtitle}>
            {activeSection === 'howLeasesWork' && 'Understanding the basics of agricultural land leasing'}
            {activeSection === 'contractCreation' && 'Steps to create a proper lease agreement'}
            {activeSection === 'farmerRights' && 'Legal protections for farmers in lease agreements'}
            {activeSection === 'disputeResolution' && 'Steps to resolve disputes in lease agreements'}
          </Text>
        </View>

        {renderInformationSection(
          activeSection === 'howLeasesWork' ? 'How Farm Leases Work' :
          activeSection === 'contractCreation' ? 'Creating Lease Contracts' :
          activeSection === 'farmerRights' ? 'Your Rights as a Farmer' :
          'What to Do If You Feel Scammed',
          leaseInformation[activeSection as keyof typeof leaseInformation]
        )}

        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>Important Note</Text>
          <Text style={styles.noteText}>
            This feature will be fully implemented in a future update. The information provided is for educational purposes only and should not be considered legal advice. Always consult with a legal professional before entering into any lease agreement.
          </Text>
        </View>
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
  placeholderButton: {
    width: 40,
    height: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: spacing.md,
    marginRight: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  infoHeader: {
    marginBottom: spacing.md,
  },
  infoHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoHeaderSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingRight: spacing.sm,
  },
  bulletPoint: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginRight: spacing.sm,
    width: 15,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  noteContainer: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  noteTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
});

export default LeaseManagementScreen;
