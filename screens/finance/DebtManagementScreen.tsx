import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const DebtManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Strategies for improving debt management
  const strategies = [
    {
      id: 'kisanCard',
      title: 'Kisan Credit Card',
      description: 'Use KCC for lower interest rates and better terms for agricultural loans.',
      icon: 'card',
      actions: [
        'Apply for a Kisan Credit Card at your nearest bank',
        'Use it for seasonal agricultural operations',
        'Repay on time to maintain good credit and avoid penalties',
      ],
    },
    {
      id: 'refinance',
      title: 'Refinance High-Interest Loans',
      description: 'Replace expensive loans with lower-interest alternatives to reduce your debt burden.',
      icon: 'swap-horizontal',
      actions: [
        'List all your current loans and their interest rates',
        'Research government schemes with lower rates',
        'Approach banks or microfinance institutions for refinancing options',
      ],
    },
    {
      id: 'prioritize',
      title: 'Prioritize Debt Repayment',
      description: 'Focus on paying off high-interest loans first to reduce overall interest costs.',
      icon: 'list',
      actions: [
        'Rank your loans by interest rate (highest to lowest)',
        'Pay minimum on all loans, but extra on the highest-rate loan',
        'Once highest-rate loan is paid off, move to the next highest',
      ],
    },
    {
      id: 'consolidate',
      title: 'Consolidate Multiple Loans',
      description: 'Combine several small loans into one larger loan with better terms.',
      icon: 'git-merge',
      actions: [
        'Identify all small loans that could be consolidated',
        'Approach a bank or cooperative for a consolidation loan',
        'Ensure the new loan has better terms than your existing loans',
      ],
    },
    {
      id: 'negotiate',
      title: 'Negotiate with Lenders',
      description: 'Work with your lenders to modify loan terms if you\'re facing difficulties.',
      icon: 'chatbubbles',
      actions: [
        'Approach lenders before missing payments',
        'Explain your situation honestly and propose a solution',
        'Get any new agreements in writing',
      ],
    },
  ];

  // Loan schemes
  const loanSchemes = [
    {
      name: 'Kisan Credit Card (KCC)',
      provider: 'Various Banks',
      interestRate: '7-9%',
      features: [
        'Revolving credit for short-term crop loans',
        'Interest subvention for timely repayment',
        'Personal accident insurance coverage',
      ],
    },
    {
      name: 'PM-KISAN Scheme',
      provider: 'Government of India',
      interestRate: 'N/A (Direct Benefit Transfer)',
      features: [
        '₹6,000 per year in three equal installments',
        'Direct transfer to farmer bank accounts',
        'Can help reduce dependence on loans',
      ],
    },
    {
      name: 'NABARD Refinance Scheme',
      provider: 'NABARD through Banks',
      interestRate: 'Varies',
      features: [
        'Long-term loans for farm development',
        'Lower interest rates than commercial loans',
        'Flexible repayment options',
      ],
    },
  ];

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
        <Text style={styles.headerTitle}>Improve Debt Management</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            Managing Farm Debt Effectively
          </Text>
          <Text style={styles.introText}>
            Debt is often necessary for farming operations, but managing it wisely is crucial for your financial health. These strategies can help you reduce interest costs and avoid debt traps.
          </Text>
        </View>

        {/* Warning Signs */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>Warning Signs of Debt Problems</Text>
          <View style={styles.warningItem}>
            <Ionicons name="warning" size={24} color={colors.error} style={styles.warningIcon} />
            <Text style={styles.warningText}>Using new loans to pay off old ones</Text>
          </View>
          <View style={styles.warningItem}>
            <Ionicons name="warning" size={24} color={colors.error} style={styles.warningIcon} />
            <Text style={styles.warningText}>Spending more than 50% of income on debt payments</Text>
          </View>
          <View style={styles.warningItem}>
            <Ionicons name="warning" size={24} color={colors.error} style={styles.warningIcon} />
            <Text style={styles.warningText}>Borrowing from informal lenders at very high rates</Text>
          </View>
          <View style={styles.warningItem}>
            <Ionicons name="warning" size={24} color={colors.error} style={styles.warningIcon} />
            <Text style={styles.warningText}>Missing loan payments regularly</Text>
          </View>
        </View>

        {/* Strategies */}
        <View style={styles.strategiesContainer}>
          <Text style={styles.sectionTitle}>Debt Management Strategies</Text>

          {strategies.map((strategy) => (
            <Card key={strategy.id} style={styles.strategyCard}>
              <View style={styles.strategyHeader}>
                <Ionicons name={strategy.icon} size={32} color={colors.primary} />
                <Text style={styles.strategyTitle}>{strategy.title}</Text>
              </View>
              
              <Text style={styles.strategyDescription}>
                {strategy.description}
              </Text>
              
              <View style={styles.actionContainer}>
                <Text style={styles.actionTitle}>Action Steps:</Text>
                {strategy.actions.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <Text style={styles.actionNumber}>{index + 1}.</Text>
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
              
              <Button
                title="Learn More"
                onPress={() => Alert.alert('Coming Soon', 'Detailed guides will be available in future updates.')}
                style={styles.learnMoreButton}
              />
            </Card>
          ))}
        </View>

        {/* Loan Schemes */}
        <View style={styles.schemesContainer}>
          <Text style={styles.sectionTitle}>Recommended Loan Schemes</Text>
          
          {loanSchemes.map((scheme, index) => (
            <Card key={index} style={styles.schemeCard}>
              <Text style={styles.schemeTitle}>{scheme.name}</Text>
              <View style={styles.schemeDetails}>
                <Text style={styles.schemeLabel}>Provider:</Text>
                <Text style={styles.schemeValue}>{scheme.provider}</Text>
              </View>
              <View style={styles.schemeDetails}>
                <Text style={styles.schemeLabel}>Interest Rate:</Text>
                <Text style={styles.schemeValue}>{scheme.interestRate}</Text>
              </View>
              <Text style={styles.featuresTitle}>Key Features:</Text>
              {scheme.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} style={styles.featureIcon} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Loan Calculator"
            onPress={() => Alert.alert('Coming Soon', 'Loan calculator will be available in future updates.')}
            style={styles.actionButton}
            leftIcon={<Ionicons name="calculator" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="Talk to a Financial Advisor"
            onPress={() => navigation.navigate('Consultants' as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="person" size={18} color={colors.white} style={styles.buttonIcon} />}
          />
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
  scrollContainer: {
    flex: 1,
  },
  introContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    margin: spacing.md,
    borderRadius: borderRadius.md,
  },
  introTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  warningContainer: {
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    margin: spacing.md,
    borderRadius: borderRadius.md,
  },
  warningTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.error,
    marginBottom: spacing.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  warningIcon: {
    marginRight: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  strategiesContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  strategyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  strategyTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  strategyDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  actionContainer: {
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  actionNumber: {
    width: 20,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
  },
  schemesContainer: {
    padding: spacing.md,
  },
  schemeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  schemeTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  schemeDetails: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  schemeLabel: {
    width: 100,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  schemeValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  featuresTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  featureIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  actionsContainer: {
    padding: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
});

export default DebtManagementScreen;
