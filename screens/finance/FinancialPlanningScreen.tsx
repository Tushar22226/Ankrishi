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

const FinancialPlanningScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Strategies for improving financial planning
  const strategies = [
    {
      id: 'seasonalBudget',
      title: 'Create a Seasonal Budget',
      description: 'Develop a budget that accounts for the seasonal nature of farming income and expenses.',
      icon: 'calendar',
      actions: [
        'Map out your expected income and expenses for each season',
        'Identify periods of high income and high expenses',
        'Plan to save during high-income periods for low-income periods',
      ],
    },
    {
      id: 'goals',
      title: 'Set Specific Financial Goals',
      description: 'Define clear, measurable financial goals with specific timelines.',
      icon: 'flag',
      actions: [
        'Identify short-term (1 year), medium-term (2-5 years), and long-term (5+ years) goals',
        'Make goals specific and measurable (e.g., "Save ₹50,000 for a new tractor by December")',
        'Break down large goals into smaller milestones',
      ],
    },
    {
      id: 'review',
      title: 'Regular Financial Reviews',
      description: 'Set aside time to review and update your financial plan regularly.',
      icon: 'refresh',
      actions: [
        'Schedule quarterly reviews of your budget and financial goals',
        'Compare actual income and expenses with your projections',
        'Adjust your plan based on what you learn',
      ],
    },
    {
      id: 'recordKeeping',
      title: 'Improve Record Keeping',
      description: 'Maintain detailed records of all farm transactions and financial activities.',
      icon: 'document-text',
      actions: [
        'Use the FarmConnect app to track all income and expenses',
        'Keep receipts and documentation for all transactions',
        'Categorize expenses properly for better analysis',
      ],
    },
    {
      id: 'cashFlow',
      title: 'Cash Flow Management',
      description: 'Plan for and manage the timing of income and expenses to ensure you always have enough cash.',
      icon: 'swap-vertical',
      actions: [
        'Create a cash flow forecast for the next 12 months',
        'Identify potential cash shortfalls in advance',
        'Arrange for credit or loans before you need them',
      ],
    },
  ];

  // Planning tools
  const planningTools = [
    {
      name: 'Farm Budget Template',
      description: 'A customizable template for creating a comprehensive farm budget.',
      comingSoon: true,
    },
    {
      name: 'Crop Profitability Calculator',
      description: 'Compare the potential profitability of different crops before planting.',
      comingSoon: true,
    },
    {
      name: 'Cash Flow Forecasting Tool',
      description: 'Project your cash flow for the next 12 months to identify potential shortfalls.',
      comingSoon: true,
    },
    {
      name: 'Financial Goal Tracker',
      description: 'Set and track progress toward your financial goals.',
      comingSoon: true,
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
        <Text style={styles.headerTitle}>Improve Financial Planning</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            Plan for Financial Success
          </Text>
          <Text style={styles.introText}>
            Good financial planning is essential for farm success. It helps you make informed decisions, prepare for challenges, and work toward your long-term goals. These strategies will help you develop a solid financial plan for your farm.
          </Text>
        </View>

        {/* Benefits of Financial Planning */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.sectionTitle}>Benefits of Financial Planning</Text>
          <Card style={styles.benefitsCard}>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Reduced Financial Stress</Text>
                <Text style={styles.benefitText}>Planning ahead helps you anticipate challenges and prepare for them.</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="trending-up" size={24} color={colors.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Better Investment Decisions</Text>
                <Text style={styles.benefitText}>Evaluate potential investments based on your overall financial plan.</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="cash" size={24} color={colors.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Improved Profitability</Text>
                <Text style={styles.benefitText}>Identify and focus on the most profitable aspects of your farm.</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="home" size={24} color={colors.primary} style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Long-term Security</Text>
                <Text style={styles.benefitText}>Build a foundation for your family's future and farm succession.</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Strategies */}
        <View style={styles.strategiesContainer}>
          <Text style={styles.sectionTitle}>Financial Planning Strategies</Text>

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

        {/* Planning Tools */}
        <View style={styles.toolsContainer}>
          <Text style={styles.sectionTitle}>Planning Tools</Text>

          {planningTools.map((tool, index) => (
            <Card key={index} style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <Text style={styles.toolTitle}>{tool.name}</Text>
                {tool.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </View>

              <Text style={styles.toolDescription}>
                {tool.description}
              </Text>

              <Button
                title="Access Tool"
                onPress={() => Alert.alert('Coming Soon', 'This tool will be available in future updates.')}
                style={styles.toolButton}
                disabled={tool.comingSoon}
              />
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Create a Budget"
            onPress={() => Alert.alert('Coming Soon', 'Budget creation tool will be available in future updates.')}
            style={styles.actionButton}
            leftIcon={<Ionicons name="create" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="Track Your Finances"
            onPress={() => navigation.navigate('My Farm' as never, { screen: 'Reports' } as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="analytics" size={18} color={colors.white} style={styles.buttonIcon} />}
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
  benefitsContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  benefitsCard: {
    padding: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  benefitIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  benefitText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  strategiesContainer: {
    padding: spacing.md,
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
  toolsContainer: {
    padding: spacing.md,
  },
  toolCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toolTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  comingSoonBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  toolDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  toolButton: {
    alignSelf: 'flex-start',
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

export default FinancialPlanningScreen;
