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

const SavingsScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Strategies for improving savings
  const strategies = [
    {
      id: 'emergency',
      title: 'Build an Emergency Fund',
      description: 'Create a dedicated savings account for unexpected expenses or crop failures.',
      icon: 'shield',
      actions: [
        'Open a separate savings account specifically for emergencies',
        'Set aside 10% of each sale or income source',
        'Aim for enough to cover 3-6 months of expenses',
      ],
    },
    {
      id: 'insurance',
      title: 'Agricultural Insurance',
      description: 'Protect your crops and income against natural disasters and market fluctuations.',
      icon: 'umbrella',
      actions: [
        'Research crop insurance options through PMFBY',
        'Consider weather-based insurance for your region',
        'Evaluate livestock insurance if applicable',
      ],
    },
    {
      id: 'diversify',
      title: 'Diversify Income Sources',
      description: 'Develop multiple income streams to reduce dependency on a single crop or market.',
      icon: 'git-branch',
      actions: [
        'Identify 2-3 potential additional income sources',
        'Start small with the most promising option',
        'Gradually expand as you gain experience',
      ],
    },
    {
      id: 'valueChain',
      title: 'Move Up the Value Chain',
      description: 'Process your agricultural products to capture more value and increase margins.',
      icon: 'trending-up',
      actions: [
        'Identify simple processing you can do (drying, sorting, packaging)',
        'Research local demand for processed products',
        'Start with minimal investment in basic equipment',
      ],
    },
    {
      id: 'automate',
      title: 'Automate Your Savings',
      description: 'Set up systems to save automatically without having to make a decision each time.',
      icon: 'repeat',
      actions: [
        'Set up automatic transfers to savings after each sale',
        'Use recurring deposits for regular income',
        'Consider SIP (Systematic Investment Plans) for long-term goals',
      ],
    },
  ];

  // Savings options
  const savingsOptions = [
    {
      name: 'Bank Savings Account',
      returnRate: '2.5-3.5% p.a.',
      liquidity: 'High',
      risk: 'Very Low',
      suitableFor: 'Emergency funds and short-term savings',
    },
    {
      name: 'Fixed Deposits',
      returnRate: '5-6% p.a.',
      liquidity: 'Medium',
      risk: 'Low',
      suitableFor: 'Medium-term goals (1-3 years)',
    },
    {
      name: 'Post Office Savings',
      returnRate: '4-7.6% p.a.',
      liquidity: 'Medium to Low',
      risk: 'Very Low',
      suitableFor: 'Long-term savings with government backing',
    },
    {
      name: 'Kisan Vikas Patra',
      returnRate: '~6.9% p.a.',
      liquidity: 'Low',
      risk: 'Very Low',
      suitableFor: 'Long-term savings with guaranteed returns',
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
        <Text style={styles.headerTitle}>Improve Savings & Reserves</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            Building Financial Security
          </Text>
          <Text style={styles.introText}>
            Savings and financial reserves are crucial for farmers to weather unexpected challenges like crop failures, market fluctuations, or personal emergencies. These strategies will help you build a stronger financial foundation.
          </Text>
        </View>

        {/* Why Savings Matter */}
        <View style={styles.whyContainer}>
          <Text style={styles.sectionTitle}>Why Savings Matter for Farmers</Text>
          <Card style={styles.whyCard}>
            <View style={styles.whyItem}>
              <Ionicons name="rainy" size={24} color={colors.primary} style={styles.whyIcon} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>Weather Unpredictability</Text>
                <Text style={styles.whyItemText}>Savings help you survive crop losses due to droughts, floods, or other weather events.</Text>
              </View>
            </View>

            <View style={styles.whyItem}>
              <Ionicons name="trending-down" size={24} color={colors.primary} style={styles.whyIcon} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>Market Fluctuations</Text>
                <Text style={styles.whyItemText}>When prices drop, savings allow you to hold your produce until prices improve.</Text>
              </View>
            </View>

            <View style={styles.whyItem}>
              <Ionicons name="medkit" size={24} color={colors.primary} style={styles.whyIcon} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>Health Emergencies</Text>
                <Text style={styles.whyItemText}>Medical emergencies can be covered without going into debt or selling assets.</Text>
              </View>
            </View>

            <View style={styles.whyItem}>
              <Ionicons name="school" size={24} color={colors.primary} style={styles.whyIcon} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>Children's Education</Text>
                <Text style={styles.whyItemText}>Savings ensure your children can get quality education regardless of harvest timing.</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Strategies */}
        <View style={styles.strategiesContainer}>
          <Text style={styles.sectionTitle}>Savings Strategies</Text>

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

        {/* Savings Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Savings Options for Farmers</Text>

          {savingsOptions.map((option, index) => (
            <Card key={index} style={styles.optionCard}>
              <Text style={styles.optionTitle}>{option.name}</Text>

              <View style={styles.optionDetails}>
                <View style={styles.optionDetail}>
                  <Text style={styles.optionLabel}>Returns:</Text>
                  <Text style={styles.optionValue}>{option.returnRate}</Text>
                </View>

                <View style={styles.optionDetail}>
                  <Text style={styles.optionLabel}>Liquidity:</Text>
                  <Text style={styles.optionValue}>{option.liquidity}</Text>
                </View>

                <View style={styles.optionDetail}>
                  <Text style={styles.optionLabel}>Risk Level:</Text>
                  <Text style={styles.optionValue}>{option.risk}</Text>
                </View>

                <View style={styles.optionDetail}>
                  <Text style={styles.optionLabel}>Best For:</Text>
                  <Text style={styles.optionValue}>{option.suitableFor}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Savings Calculator"
            onPress={() => Alert.alert('Coming Soon', 'Savings calculator will be available in future updates.')}
            style={styles.actionButton}
            leftIcon={<Ionicons name="calculator" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="Track Your Savings"
            onPress={() => navigation.navigate('My Farm' as never, { screen: 'AddIncome' } as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="trending-up" size={18} color={colors.white} style={styles.buttonIcon} />}
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
  whyContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  whyCard: {
    padding: spacing.md,
  },
  whyItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  whyIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  whyTextContainer: {
    flex: 1,
  },
  whyItemTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  whyItemText: {
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
  optionsContainer: {
    padding: spacing.md,
  },
  optionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionDetails: {
    marginBottom: spacing.sm,
  },
  optionDetail: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  optionLabel: {
    width: 100,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  optionValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
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

export default SavingsScreen;
