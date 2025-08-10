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

const ExpenseManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Strategies for improving expense management
  const strategies = [
    {
      id: 'bulkPurchase',
      title: 'Collective Purchasing',
      description: 'Join with other farmers to buy inputs in bulk for better prices.',
      icon: 'cart',
      actions: [
        'Identify 5-10 neighboring farmers with similar input needs',
        'Create a purchasing group and assign a coordinator',
        'Negotiate with suppliers for bulk discounts',
      ],
    },
    {
      id: 'precision',
      title: 'Precision Farming',
      description: 'Use technology to apply inputs more efficiently and reduce waste.',
      icon: 'analytics',
      actions: [
        'Start with soil testing to understand exact nutrient needs',
        'Apply fertilizers and pesticides only where needed',
        'Consider investing in basic precision tools like soil moisture sensors',
      ],
    },
    {
      id: 'equipment',
      title: 'Equipment Sharing',
      description: 'Share expensive machinery with other farmers instead of purchasing outright.',
      icon: 'construct',
      actions: [
        'Identify equipment you use infrequently that could be shared',
        'Create a formal sharing agreement with clear terms',
        'Consider renting equipment through the app instead of buying',
      ],
    },
    {
      id: 'inputs',
      title: 'Input Optimization',
      description: 'Use inputs more efficiently to reduce costs without sacrificing yield.',
      icon: 'flask',
      actions: [
        'Consult with agricultural experts about optimal input usage',
        'Try alternative pest management techniques like IPM',
        'Track input usage and results to identify what works best',
      ],
    },
    {
      id: 'energy',
      title: 'Energy Cost Reduction',
      description: 'Reduce fuel and electricity costs through efficiency and alternatives.',
      icon: 'flash',
      actions: [
        'Maintain equipment regularly to improve fuel efficiency',
        'Consider solar pumps for irrigation if applicable',
        'Plan field operations to minimize travel distances',
      ],
    },
  ];

  // Expense categories and tips
  const expenseCategories = [
    {
      name: 'Seeds',
      tips: [
        'Save seeds from your best plants when possible',
        'Buy quality certified seeds for better yields',
        'Consider seed exchanges with other farmers',
      ],
    },
    {
      name: 'Fertilizers',
      tips: [
        'Use organic alternatives when possible',
        'Apply based on soil test results, not estimates',
        'Consider green manuring to reduce fertilizer needs',
      ],
    },
    {
      name: 'Pesticides',
      tips: [
        'Implement Integrated Pest Management (IPM)',
        'Use biological controls when possible',
        'Apply only when pest thresholds are reached',
      ],
    },
    {
      name: 'Labor',
      tips: [
        'Plan work schedules to maximize efficiency',
        'Consider mechanization for repetitive tasks',
        'Train workers for multiple tasks',
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
        <Text style={styles.headerTitle}>Improve Expense Management</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            Control Your Farm Expenses
          </Text>
          <Text style={styles.introText}>
            Managing expenses effectively is crucial for farm profitability. By implementing these strategies, you can reduce costs without compromising productivity.
          </Text>
        </View>

        {/* Strategies */}
        <View style={styles.strategiesContainer}>
          <Text style={styles.sectionTitle}>Cost-Saving Strategies</Text>

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

        {/* Expense Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Tips by Expense Category</Text>

          {expenseCategories.map((category, index) => (
            <Card key={index} style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>{category.name}</Text>

              {category.tips.map((tip, tipIndex) => (
                <View key={tipIndex} style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} style={styles.tipIcon} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Track Your Expenses"
            onPress={() => navigation.navigate('My Farm' as never, { screen: 'AddExpense' } as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="create" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="Compare Input Prices"
            onPress={() => navigation.navigate('Marketplace' as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="pricetag" size={18} color={colors.white} style={styles.buttonIcon} />}
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
  categoriesContainer: {
    padding: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  categoryTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  tipText: {
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

export default ExpenseManagementScreen;
