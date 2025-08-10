import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

const FinancialPlanScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [financialPlan, setFinancialPlan] = useState<any>(null);
  
  // Load financial plan on component mount
  useEffect(() => {
    loadFinancialPlan();
  }, []);
  
  // Load financial plan
  const loadFinancialPlan = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would fetch data from a service
      // For now, let's simulate loading with a timeout
      setTimeout(() => {
        setFinancialPlan(mockFinancialPlan);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading financial plan:', error);
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating your financial plan...</Text>
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
        
        <Text style={styles.title}>Financial Plan</Text>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadFinancialPlan}
        >
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Overview */}
        <Card style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Plan Overview</Text>
          
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{financialPlan.name}</Text>
            <Text style={styles.planDescription}>{financialPlan.description}</Text>
            
            <View style={styles.planPeriod}>
              <View style={styles.periodItem}>
                <Text style={styles.periodLabel}>Start Date</Text>
                <Text style={styles.periodValue}>
                  {formatDate(financialPlan.startDate)}
                </Text>
              </View>
              
              <View style={styles.periodItem}>
                <Text style={styles.periodLabel}>End Date</Text>
                <Text style={styles.periodValue}>
                  {formatDate(financialPlan.endDate)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.projectionSummary}>
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>Projected Income</Text>
              <Text style={[styles.projectionValue, styles.incomeText]}>
                {formatCurrency(financialPlan.projectedIncome)}
              </Text>
            </View>
            
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>Projected Expenses</Text>
              <Text style={[styles.projectionValue, styles.expenseText]}>
                {formatCurrency(financialPlan.projectedExpenses)}
              </Text>
            </View>
            
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>Projected Profit</Text>
              <Text style={[styles.projectionValue, styles.profitText]}>
                {formatCurrency(financialPlan.projectedProfit)}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Financial Goals */}
        <Card style={styles.goalsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Financial Goals</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('FinancialGoals' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {financialPlan.goals.slice(0, 3).map((goal: any, index: number) => (
            <View key={index} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <View style={styles.goalTypeContainer}>
                  <View
                    style={[
                      styles.goalTypeBadge,
                      { backgroundColor: getGoalTypeColor(goal.type) },
                    ]}
                  >
                    <Text style={styles.goalTypeText}>
                      {formatGoalType(goal.type)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.goalDueDate}>
                  Due: {formatDate(goal.targetDate)}
                </Text>
              </View>
              
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
              
              <View style={styles.goalProgress}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${(goal.currentAmount / goal.targetAmount) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>
                    {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
        
        {/* Budgets */}
        <Card style={styles.budgetsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Budgets</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Budgets' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {financialPlan.budgets.slice(0, 2).map((budget: any, index: number) => (
            <View key={index} style={styles.budgetItem}>
              <Text style={styles.budgetName}>{budget.name}</Text>
              
              <View style={styles.budgetPeriod}>
                <Text style={styles.budgetPeriodText}>
                  {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                </Text>
              </View>
              
              <View style={styles.budgetAmount}>
                <Text style={styles.budgetAmountLabel}>Total Budget:</Text>
                <Text style={styles.budgetAmountValue}>
                  {formatCurrency(budget.totalBudget)}
                </Text>
              </View>
              
              <Text style={styles.budgetCategoriesTitle}>Top Allocations:</Text>
              
              {Object.entries(budget.allocations)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 3)
                .map(([category, amount]: any, idx: number) => (
                  <View key={idx} style={styles.budgetCategory}>
                    <Text style={styles.budgetCategoryName}>
                      {formatCategory(category)}
                    </Text>
                    <Text style={styles.budgetCategoryAmount}>
                      {formatCurrency(amount)}
                    </Text>
                  </View>
                ))}
            </View>
          ))}
        </Card>
        
        {/* Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>AI Recommendations</Text>
          
          {financialPlan.recommendations.map((recommendation: any, index: number) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <Ionicons
                  name={getRecommendationIcon(recommendation.type)}
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.recommendationType}>
                  {formatRecommendationType(recommendation.type)}
                </Text>
              </View>
              
              <Text style={styles.recommendationText}>
                {recommendation.text}
              </Text>
              
              {recommendation.impact && (
                <View style={styles.recommendationImpact}>
                  <Text style={styles.impactLabel}>Potential Impact:</Text>
                  <Text style={styles.impactValue}>
                    {recommendation.impact}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Download Plan"
            variant="outline"
            leftIcon={<Ionicons name="download" size={16} color={colors.primary} />}
            onPress={() => {
              // In a real app, we would download the plan
              alert('Download feature coming soon!');
            }}
            style={styles.actionButton}
          />
          
          <Button
            title="Share Plan"
            variant="outline"
            leftIcon={<Ionicons name="share" size={16} color={colors.primary} />}
            onPress={() => {
              // In a real app, we would share the plan
              alert('Share feature coming soon!');
            }}
            style={styles.actionButton}
          />
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// Helper functions
const getGoalTypeColor = (type: string) => {
  switch (type) {
    case 'income_target':
      return colors.success;
    case 'expense_reduction':
      return colors.error;
    case 'profit_margin':
      return colors.primary;
    case 'debt_reduction':
      return colors.warning;
    case 'savings':
      return colors.info;
    case 'investment':
      return colors.secondary;
    default:
      return colors.mediumGray;
  }
};

const formatGoalType = (type: string) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCategory = (category: string) => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'income':
      return 'trending-up';
    case 'expense':
      return 'trending-down';
    case 'investment':
      return 'bar-chart';
    case 'savings':
      return 'wallet';
    case 'debt':
      return 'card';
    default:
      return 'bulb';
  }
};

const formatRecommendationType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1) + ' Recommendation';
};

// Mock data
const mockFinancialPlan = {
  id: '1',
  userId: 'user123',
  name: 'Farm Growth Plan 2023-2024',
  description: 'A comprehensive financial plan to maximize farm profitability and achieve long-term financial goals.',
  startDate: Date.now(),
  endDate: Date.now() + 31536000000, // 1 year from now
  goals: [
    {
      id: 'goal1',
      type: 'income_target',
      name: 'Increase Crop Sales',
      description: 'Increase total crop sales revenue through improved yield and market access.',
      targetAmount: 500000,
      currentAmount: 150000,
      startDate: Date.now(),
      targetDate: Date.now() + 31536000000, // 1 year from now
      isCompleted: false,
    },
    {
      id: 'goal2',
      type: 'expense_reduction',
      name: 'Reduce Fertilizer Costs',
      description: 'Optimize fertilizer usage to reduce costs without affecting yield.',
      targetAmount: 50000,
      currentAmount: 10000,
      startDate: Date.now(),
      targetDate: Date.now() + 15768000000, // 6 months from now
      isCompleted: false,
    },
    {
      id: 'goal3',
      type: 'savings',
      name: 'Emergency Fund',
      description: 'Build an emergency fund for unexpected farm expenses.',
      targetAmount: 100000,
      currentAmount: 25000,
      startDate: Date.now(),
      targetDate: Date.now() + 23652000000, // 9 months from now
      isCompleted: false,
    },
    {
      id: 'goal4',
      type: 'investment',
      name: 'New Tractor Purchase',
      description: 'Save for a down payment on a new tractor.',
      targetAmount: 200000,
      currentAmount: 50000,
      startDate: Date.now(),
      targetDate: Date.now() + 31536000000, // 1 year from now
      isCompleted: false,
    },
  ],
  budgets: [
    {
      id: 'budget1',
      name: 'Kharif Season Budget',
      startDate: Date.now(),
      endDate: Date.now() + 15768000000, // 6 months from now
      totalBudget: 300000,
      allocations: {
        seeds: 50000,
        fertilizers: 80000,
        pesticides: 40000,
        labor: 100000,
        irrigation: 30000,
      },
    },
    {
      id: 'budget2',
      name: 'Rabi Season Budget',
      startDate: Date.now() + 15768000000, // 6 months from now
      endDate: Date.now() + 31536000000, // 1 year from now
      totalBudget: 250000,
      allocations: {
        seeds: 40000,
        fertilizers: 70000,
        pesticides: 30000,
        labor: 80000,
        irrigation: 30000,
      },
    },
  ],
  projectedIncome: 800000,
  projectedExpenses: 550000,
  projectedProfit: 250000,
  recommendations: [
    {
      type: 'income',
      text: 'Consider diversifying crop selection to include high-value crops like vegetables or fruits which can increase revenue per acre.',
      impact: 'Potential 20-30% increase in revenue per acre',
    },
    {
      type: 'expense',
      text: 'Implement precision farming techniques to optimize fertilizer and pesticide usage, reducing waste and costs.',
      impact: 'Potential 15-20% reduction in input costs',
    },
    {
      type: 'investment',
      text: 'Investing in drip irrigation can reduce water usage and labor costs while improving crop yield.',
      impact: 'ROI of 25-30% over 3 years',
    },
  ],
  lastReviewedAt: Date.now(),
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
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  overviewCard: {
    margin: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  planInfo: {
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  planPeriod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodItem: {
    flex: 1,
  },
  periodLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  periodValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  projectionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  projectionItem: {
    alignItems: 'center',
  },
  projectionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  projectionValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
  },
  incomeText: {
    color: colors.success,
  },
  expenseText: {
    color: colors.error,
  },
  profitText: {
    color: colors.primary,
  },
  goalsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  goalItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  goalTypeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  goalDueDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  goalName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  goalDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  goalProgress: {
    marginTop: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  progressPercentage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  budgetsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  budgetItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  budgetName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  budgetPeriod: {
    marginBottom: spacing.sm,
  },
  budgetPeriodText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  budgetAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetAmountLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  budgetAmountValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  budgetCategoriesTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  budgetCategory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  budgetCategoryName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  budgetCategoryAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  recommendationsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  recommendationItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recommendationType: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  recommendationText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  recommendationImpact: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  impactLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  impactValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    margin: spacing.md,
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default FinancialPlanScreen;
