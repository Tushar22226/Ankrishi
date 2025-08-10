import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { RootStackParamList } from '../../navigation/types';

type FinancialPlanViewScreenRouteProp = RouteProp<
  RootStackParamList,
  'FinancialPlanView'
>;

interface PlanData {
  userId: string;
  userName: string;
  farmingType: string;
  cropType: string;
  landSize: number;
  expectedYield: number;
  currentSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  loanAmount: number;
  interestRate: number;
  planDuration: number;
  selectedCrops: string[];
  selectedFruits: string[];
  selectedVegetables: string[];
  createdAt: number;
}

interface MonthlyProjection {
  month: number;
  income: number;
  expenses: number;
  savings: number;
  loanBalance: number;
  cashFlow: number;
}

interface ExpenseCategory {
  name: string;
  percentage: number;
  amount: number;
  recommendation?: string;
}

const FinancialPlanViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<FinancialPlanViewScreenRouteProp>();
  const { planData } = route.params;


  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netSavings, setNetSavings] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [savingsRecommendations, setSavingsRecommendations] = useState<string[]>([]);

  // Calculate financial projections
  useEffect(() => {
    calculateProjections();
    generateRecommendations();
    calculateExpenseCategories();
    generateSavingsRecommendations();
  }, [planData]);

  const calculateProjections = () => {
    const monthlyProjections: MonthlyProjection[] = [];
    let runningIncome = 0;
    let runningExpenses = 0;
    let runningSavings = planData.currentSavings;
    let loanBalance = planData.loanAmount;

    // Calculate monthly loan payment if there's a loan
    const monthlyLoanPayment = calculateMonthlyLoanPayment(
      planData.loanAmount,
      planData.interestRate,
      planData.planDuration
    );

    // Generate projections for each month
    for (let month = 1; month <= planData.planDuration; month++) {
      // Basic monthly income and expenses
      let monthlyIncome = planData.monthlyIncome;
      let monthlyExpenses = planData.monthlyExpenses + monthlyLoanPayment;

      // Add crop income for harvest months (assuming harvest every 3 months)
      if (month % 3 === 0 && planData.expectedYield > 0) {
        // Simple estimation of crop income
        const cropIncome = estimateCropIncome(planData.cropType, planData.expectedYield);
        monthlyIncome += cropIncome / (planData.planDuration / 3); // Distribute across harvest months
      }

      // Calculate monthly cash flow
      const cashFlow = monthlyIncome - monthlyExpenses;

      // Update savings
      runningSavings += cashFlow;

      // Update loan balance
      if (loanBalance > 0) {
        // Simple interest calculation
        const interestPayment = (loanBalance * (planData.interestRate / 100)) / 12;
        const principalPayment = monthlyLoanPayment - interestPayment;
        loanBalance = Math.max(0, loanBalance - principalPayment);
      }

      // Update running totals
      runningIncome += monthlyIncome;
      runningExpenses += monthlyExpenses;

      // Add to projections
      monthlyProjections.push({
        month,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        savings: runningSavings,
        loanBalance,
        cashFlow,
      });
    }

    setProjections(monthlyProjections);
    setTotalIncome(runningIncome);
    setTotalExpenses(runningExpenses);
    setNetSavings(runningSavings - planData.currentSavings);
  };

  const calculateMonthlyLoanPayment = (principal: number, rate: number, months: number): number => {
    if (principal === 0 || rate === 0 || months === 0) return 0;

    // Convert annual rate to monthly
    const monthlyRate = rate / 100 / 12;

    // Calculate monthly payment using loan formula
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const estimateCropIncome = (cropType: string, yield_: number): number => {
    // Simple estimation based on crop type and yield
    // In a real app, this would use market data and more sophisticated models
    const pricePerQuintal: Record<string, number> = {
      'Rice': 2000,
      'Wheat': 1800,
      'Corn': 1500,
      'Sugarcane': 300,
      'Cotton': 5000,
      'Soybean': 3500,
      'Potato': 1200,
      'Tomato': 1500,
      'Onion': 1800,
      'Chili': 6000,
      'Lentils (Dal)': 5500,
      'Chickpea': 4500,
      'Mustard': 4000,
      'Groundnut': 5000,
      'Sunflower': 3800,
    };

    const price = pricePerQuintal[cropType] || 2000; // Default price if crop not found
    return yield_ * price;
  };

  const calculateExpenseCategories = () => {
    const categories: ExpenseCategory[] = [];
    const monthlyExpense = planData.monthlyExpenses;

    // Define expense categories based on farming type
    if (planData.farmingType === 'crops') {
      categories.push(
        {
          name: 'Seeds',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Consider buying quality certified seeds for better yield.'
        },
        {
          name: 'Fertilizers',
          percentage: 25,
          amount: monthlyExpense * 0.25,
          recommendation: 'Use organic fertilizers where possible to reduce costs and improve soil health.'
        },
        {
          name: 'Pesticides',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Implement integrated pest management to reduce pesticide costs.'
        },
        {
          name: 'Irrigation',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Consider drip irrigation to save water and reduce costs.'
        },
        {
          name: 'Labor',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Use mechanization for routine tasks to reduce labor costs.'
        },
        {
          name: 'Other',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Track miscellaneous expenses closely to identify cost-saving opportunities.'
        }
      );
    } else if (planData.farmingType === 'fruits') {
      categories.push(
        {
          name: 'Saplings/Plants',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Invest in high-quality disease-resistant varieties.'
        },
        {
          name: 'Fertilizers',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Use balanced fertilizers specific to fruit trees.'
        },
        {
          name: 'Pesticides',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Use organic pest control methods where possible.'
        },
        {
          name: 'Irrigation',
          percentage: 25,
          amount: monthlyExpense * 0.25,
          recommendation: 'Install drip irrigation for water conservation and better fruit quality.'
        },
        {
          name: 'Labor',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Train workers in proper harvesting techniques to reduce fruit damage.'
        },
        {
          name: 'Other',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Consider investing in cold storage to extend shelf life and get better prices.'
        }
      );
    } else if (planData.farmingType === 'vegetables') {
      categories.push(
        {
          name: 'Seeds/Seedlings',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Use hybrid seeds for better yield and disease resistance.'
        },
        {
          name: 'Fertilizers',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Apply fertilizers based on soil testing results.'
        },
        {
          name: 'Pesticides',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Use neem-based pesticides for organic vegetable production.'
        },
        {
          name: 'Irrigation',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Consider mulching to reduce water usage and weed growth.'
        },
        {
          name: 'Labor',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Stagger planting to distribute labor needs throughout the season.'
        },
        {
          name: 'Other',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Invest in proper packaging to reduce post-harvest losses.'
        }
      );
    } else if (planData.farmingType === 'dairy') {
      categories.push(
        {
          name: 'Feed',
          percentage: 40,
          amount: monthlyExpense * 0.40,
          recommendation: 'Grow your own fodder to reduce feed costs.'
        },
        {
          name: 'Veterinary Care',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Regular preventive care reduces expensive treatments later.'
        },
        {
          name: 'Labor',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Invest in basic milking machines to reduce labor costs.'
        },
        {
          name: 'Housing',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Proper housing reduces disease and increases productivity.'
        },
        {
          name: 'Equipment',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Maintain equipment regularly to avoid costly breakdowns.'
        },
        {
          name: 'Other',
          percentage: 5,
          amount: monthlyExpense * 0.05,
          recommendation: 'Consider value-added products like cheese or ghee to increase income.'
        }
      );
    }

    setExpenseCategories(categories);
  };

  const generateSavingsRecommendations = () => {
    const savingsRecs: string[] = [];

    // General savings recommendations
    savingsRecs.push('Track all expenses meticulously to identify areas for cost reduction.');
    savingsRecs.push('Join farmer groups to purchase inputs in bulk at discounted prices.');

    // Farming type specific recommendations
    if (planData.farmingType === 'crops') {
      savingsRecs.push('Implement crop rotation to reduce fertilizer and pesticide needs.');
      savingsRecs.push('Consider intercropping to maximize land use and spread risk.');
      savingsRecs.push('Use soil testing to apply only necessary fertilizers, avoiding waste.');
      savingsRecs.push('Invest in rainwater harvesting to reduce irrigation costs.');
    } else if (planData.farmingType === 'fruits') {
      savingsRecs.push('Prune trees properly to increase yield and reduce disease incidence.');
      savingsRecs.push('Use mulching to reduce water usage and weed control costs.');
      savingsRecs.push('Consider direct marketing to consumers for better prices.');
      savingsRecs.push('Implement integrated pest management to reduce pesticide costs.');
    } else if (planData.farmingType === 'vegetables') {
      savingsRecs.push('Use succession planting to ensure continuous harvest and income.');
      savingsRecs.push('Invest in low-cost polyhouses for off-season vegetable production.');
      savingsRecs.push('Save seeds from your best plants for the next season.');
      savingsRecs.push('Use drip irrigation and mulching to reduce water costs.');
    } else if (planData.farmingType === 'dairy') {
      savingsRecs.push('Grow your own fodder crops to reduce feed costs.');
      savingsRecs.push('Maintain proper records of each animal to cull low-producing animals.');
      savingsRecs.push('Learn basic veterinary care to reduce dependence on expensive services.');
      savingsRecs.push('Process milk into products like curd or ghee to increase shelf life and value.');
    }

    // Add recommendations based on financial situation
    if (planData.monthlyExpenses > planData.monthlyIncome * 0.7) {
      savingsRecs.push('Your expenses are high relative to income. Consider reducing non-essential expenses.');
    }

    if (planData.loanAmount > 0) {
      savingsRecs.push('Prioritize paying off high-interest loans to reduce interest expenses.');
    }

    setSavingsRecommendations(savingsRecs);
  };

  const generateRecommendations = () => {
    const recs: string[] = [];

    // Basic financial recommendations
    if (planData.monthlyExpenses > planData.monthlyIncome * 0.8) {
      recs.push('Consider reducing monthly expenses to improve cash flow.');
    }

    if (planData.loanAmount > planData.monthlyIncome * 12) {
      recs.push('Your loan amount is high relative to your income. Consider debt reduction strategies.');
    }

    if (planData.currentSavings < planData.monthlyExpenses * 3) {
      recs.push('Build an emergency fund of at least 3 months of expenses.');
    }

    // Farming type specific recommendations
    if (planData.farmingType === 'crops') {
      recs.push('Consider crop insurance to protect against weather-related losses.');
      if (planData.landSize > 2) {
        recs.push('Consider diversifying crops to reduce risk and improve soil health.');
      }
    } else if (planData.farmingType === 'fruits') {
      recs.push('Consider value-added processing to increase income from your fruit production.');
      recs.push('Explore export markets for premium prices on high-quality fruits.');
    } else if (planData.farmingType === 'vegetables') {
      recs.push('Consider direct marketing through farmers markets for better prices.');
      recs.push('Explore organic certification for premium pricing.');
    } else if (planData.farmingType === 'dairy') {
      recs.push('Consider selling directly to consumers for better margins.');
      recs.push('Explore value-added dairy products to increase income.');
    }

    // Add more recommendations based on projections
    const lastMonth = projections[projections.length - 1];
    if (lastMonth && lastMonth.cashFlow < 0) {
      recs.push('Your projected cash flow is negative. Consider additional income sources or expense reduction.');
    }

    if (lastMonth && lastMonth.savings < planData.currentSavings) {
      recs.push('Your financial plan shows decreasing savings. Review your income and expense projections.');
    }

    // Add some general recommendations
    recs.push('Consider government schemes and subsidies for farmers to reduce costs.');
    recs.push('Explore crop insurance options to protect against yield losses.');

    setRecommendations(recs);
  };



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
        <Text style={styles.headerTitle}>Your Financial Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Summary Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Projected Income:</Text>
            <Text style={styles.summaryValue}>₹{totalIncome.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Projected Expenses:</Text>
            <Text style={styles.summaryValue}>₹{totalExpenses.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Savings:</Text>
            <Text style={[
              styles.summaryValue,
              { color: netSavings >= 0 ? colors.success : colors.error }
            ]}>
              ₹{netSavings.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Plan Duration:</Text>
            <Text style={styles.summaryValue}>{planData.planDuration} months</Text>
          </View>
        </Card>

        {/* Monthly Projections */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Projections</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, styles.monthCell]}>Month</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Income</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Expenses</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Cash Flow</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Savings</Text>
                {planData.loanAmount > 0 && (
                  <Text style={[styles.tableHeader, styles.amountCell]}>Loan Balance</Text>
                )}
              </View>

              {/* Table Rows */}
              {projections.map((projection, index) => (
                <View key={index} style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow
                ]}>
                  <Text style={[styles.tableCell, styles.monthCell]}>{projection.month}</Text>
                  <Text style={[styles.tableCell, styles.amountCell]}>
                    ₹{projection.income.toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, styles.amountCell]}>
                    ₹{projection.expenses.toLocaleString()}
                  </Text>
                  <Text style={[
                    styles.tableCell,
                    styles.amountCell,
                    { color: projection.cashFlow >= 0 ? colors.success : colors.error }
                  ]}>
                    ₹{projection.cashFlow.toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, styles.amountCell]}>
                    ₹{projection.savings.toLocaleString()}
                  </Text>
                  {planData.loanAmount > 0 && (
                    <Text style={[styles.tableCell, styles.amountCell]}>
                      ₹{projection.loanBalance.toLocaleString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Expected Expenses by Category */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Expected Expenses by Category</Text>
          <Text style={styles.cardSubtitle}>
            Based on your {planData.farmingType} farming type
          </Text>

          {expenseCategories.map((category, index) => (
            <View key={index} style={styles.expenseCategoryItem}>
              <View style={styles.expenseCategoryHeader}>
                <Text style={styles.expenseCategoryName}>{category.name}</Text>
                <Text style={styles.expenseCategoryPercentage}>{category.percentage}%</Text>
              </View>
              <View style={styles.expenseCategoryBar}>
                <View
                  style={[
                    styles.expenseCategoryFill,
                    { width: `${category.percentage}%` }
                  ]}
                />
              </View>
              <View style={styles.expenseCategoryDetails}>
                <Text style={styles.expenseCategoryAmount}>
                  ₹{category.amount.toLocaleString()}
                </Text>
                <Text style={styles.expenseCategoryRecommendation}>
                  {category.recommendation}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Savings Recommendations */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>How to Save More</Text>

          {savingsRecommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="cash-outline" size={20} color={colors.success} style={styles.recommendationIcon} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </Card>

        {/* General Recommendations */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Financial Recommendations</Text>

          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.recommendationIcon} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </Card>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  header: {
    marginTop:40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableHeader: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    padding: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    padding: spacing.sm,
  },
  monthCell: {
    width: 60,
    textAlign: 'center',
  },
  amountCell: {
    width: 120,
    textAlign: 'right',
  },
  evenRow: {
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: colors.background,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Expense category styles
  expenseCategoryItem: {
    marginBottom: spacing.md,
  },
  expenseCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  expenseCategoryName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  expenseCategoryPercentage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  expenseCategoryBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  expenseCategoryFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  expenseCategoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseCategoryAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    width: '25%',
  },
  expenseCategoryRecommendation: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    width: '75%',
  },
});

export default FinancialPlanViewScreen;
