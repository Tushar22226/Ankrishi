import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import FinanceService from '../../services/FinanceService';
import MarketplaceService from '../../services/MarketplaceService';
import ContractService from '../../services/ContractService';
import { IncomeCategory, ExpenseCategory } from '../../models/Finance';

// Time periods for filtering
const timePeriods = [
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'halfYear', label: 'Last 6 Months' },
  { id: 'year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

const ReportsScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);
  const [activeTimePeriod, setActiveTimePeriod] = useState('halfYear');

  // Load data when time period changes
  useEffect(() => {
    if (userProfile?.uid) {
      loadData();
    }
  }, [activeTimePeriod, userProfile]);

  // Reload data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userProfile?.uid) {
        loadData();
      }
      return () => {};
    }, [userProfile, activeTimePeriod])
  );

  // Calculate date range based on active time period
  const getDateRange = () => {
    const now = new Date();
    const endDate = now.getTime();
    let startDate = endDate;

    switch (activeTimePeriod) {
      case 'month':
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case 'quarter':
        // Start of current quarter
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1).getTime();
        break;
      case 'halfYear':
        // 6 months ago
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();
        break;
      case 'year':
        // 1 year ago
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
        break;
      default:
        // Default to 6 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();
    }

    return { startDate, endDate };
  };

  // Load data
  const loadData = async () => {
    if (!userProfile?.uid) {
      console.error('User profile not found');
      return;
    }

    try {
      setLoading(true);

      // Get date range based on selected time period
      const { startDate, endDate } = getDateRange();

      // Generate financial summary using real data
      const summary = await FinanceService.generateFinancialSummary(
        userProfile.uid,
        startDate,
        endDate
      );

      // Get monthly data for the chart
      const monthlyData = await generateMonthlyData(userProfile.uid, startDate, endDate);

      // Combine all data
      const realFinancialData = {
        summary: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netProfit: summary.netProfit,
          profitMargin: summary.totalIncome > 0
            ? (summary.netProfit / summary.totalIncome) * 100
            : 0,
        },
        incomeByCategory: summary.incomeByCategory,
        expenseByCategory: summary.expenseByCategory,
        monthlyData: monthlyData,
        cropProfitability: Object.entries(summary.cropProfitability || {}).map(([crop, data]) => ({
          crop,
          income: data.income,
          expense: data.expense,
          profit: data.profit,
        })),
      };

      setFinancialData(realFinancialData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load financial data. Please try again.');
    }
  };

  // Generate monthly data for the chart
  const generateMonthlyData = async (userId: string, startDate: number, endDate: number) => {
    try {
      // Get all transactions for the date range
      const transactions = await FinanceService.getTransactionsByDateRange(
        userId,
        startDate,
        endDate
      );

      // Get order data
      const orderData = await FinanceService.getOrderFinancialData(
        userId,
        startDate,
        endDate
      );

      // Create a map to store monthly data
      const monthlyMap: Record<string, { month: string, income: number, expense: number }> = {};

      // Process transactions
      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('default', { month: 'short' });

        if (!monthlyMap[monthYear]) {
          monthlyMap[monthYear] = {
            month: monthName,
            income: 0,
            expense: 0,
          };
        }

        if ('type' in transaction && transaction.type === 'income') {
          monthlyMap[monthYear].income += transaction.amount;
        } else {
          monthlyMap[monthYear].expense += Math.abs(transaction.amount);
        }
      });

      // Process sales orders
      orderData.salesOrders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('default', { month: 'short' });

        if (!monthlyMap[monthYear]) {
          monthlyMap[monthYear] = {
            month: monthName,
            income: 0,
            expense: 0,
          };
        }

        monthlyMap[monthYear].income += order.totalAmount;
      });

      // Process purchase orders
      orderData.purchaseOrders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('default', { month: 'short' });

        if (!monthlyMap[monthYear]) {
          monthlyMap[monthYear] = {
            month: monthName,
            income: 0,
            expense: 0,
          };
        }

        monthlyMap[monthYear].expense += order.totalAmount;
      });

      // Convert map to array and sort by date
      const monthlyData = Object.values(monthlyMap).sort((a, b) => {
        const monthA = new Date(a.month + ' 1, 2000').getTime();
        const monthB = new Date(b.month + ' 1, 2000').getTime();
        return monthA - monthB;
      });

      return monthlyData;
    } catch (error) {
      console.error('Error generating monthly data:', error);
      return [];
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get top income categories
  const getTopIncomeCategories = () => {
    const categories = Object.entries(financialData.incomeByCategory)
      .map(([category, amount]) => ({ category, amount: amount as number }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return categories;
  };

  // Get top expense categories
  const getTopExpenseCategories = () => {
    const categories = Object.entries(financialData.expenseByCategory)
      .map(([category, amount]) => ({ category, amount: amount as number }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return categories;
  };

  // Get category name
  const getCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading financial reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Reports</Text>
      </View>

      {/* Time Period Filter */}
      <View style={styles.timePeriodSelectionWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timePeriodsContainer}
        >
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.timePeriodButton,
                activeTimePeriod === period.id && styles.activeTimePeriodButton,
              ]}
              onPress={() => setActiveTimePeriod(period.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timePeriodText,
                  activeTimePeriod === period.id && styles.activeTimePeriodText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Financial Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Financial Summary</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>
                {formatCurrency(financialData.summary.totalIncome)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, styles.expenseText]}>
                {formatCurrency(financialData.summary.totalExpense)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net Profit</Text>
              <Text
                style={[
                  styles.summaryValue,
                  financialData.summary.netProfit >= 0 ? styles.profitText : styles.lossText,
                ]}
              >
                {formatCurrency(financialData.summary.netProfit)}
              </Text>
            </View>
          </View>

          <View style={styles.profitMarginContainer}>
            <Text style={styles.profitMarginLabel}>Profit Margin</Text>
            <View style={styles.profitMarginBarContainer}>
              <View
                style={[
                  styles.profitMarginBar,
                  { width: `${Math.max(0, Math.min(100, financialData.summary.profitMargin))}%` },
                ]}
              />
            </View>
            <Text style={styles.profitMarginText}>
              {financialData.summary.profitMargin.toFixed(1)}%
            </Text>
          </View>
        </Card>

        {/* Monthly Trend */}
        <Card style={styles.trendCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('DetailedReport')}
            >
              <Text style={styles.viewMoreText}>View More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            {/* In a real app, we would use a chart library like react-native-chart-kit */}
            {/* For now, let's create a simple bar chart */}
            <View style={styles.chartYAxis}>
              <Text style={styles.chartYAxisLabel}>₹20K</Text>
              <Text style={styles.chartYAxisLabel}>₹15K</Text>
              <Text style={styles.chartYAxisLabel}>₹10K</Text>
              <Text style={styles.chartYAxisLabel}>₹5K</Text>
              <Text style={styles.chartYAxisLabel}>₹0</Text>
            </View>

            <View style={styles.chartContent}>
              {financialData.monthlyData.map((month, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartIncome,
                        { height: `${(month.income / 20000) * 100}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.chartExpense,
                        { height: `${(month.expense / 20000) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartXAxisLabel}>{month.month}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.incomeColor]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.expenseColor]} />
              <Text style={styles.legendText}>Expenses</Text>
            </View>
          </View>
        </Card>

        {/* Income Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Income Breakdown</Text>

          {getTopIncomeCategories().map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownCategory}>
                  {getCategoryName(item.category)}
                </Text>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.breakdownBarContainer}>
                <View
                  style={[
                    styles.breakdownBar,
                    styles.incomeBar,
                    { width: `${(item.amount / financialData.summary.totalIncome) * 100}%` },
                  ]}
                />
              </View>

              <Text style={styles.breakdownPercentage}>
                {((item.amount / financialData.summary.totalIncome) * 100).toFixed(1)}%
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('IncomeBreakdown')}
          >
            <Text style={styles.viewAllText}>View All Income Categories</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Expense Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Expense Breakdown</Text>

          {getTopExpenseCategories().map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownCategory}>
                  {getCategoryName(item.category)}
                </Text>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.breakdownBarContainer}>
                <View
                  style={[
                    styles.breakdownBar,
                    styles.expenseBar,
                    { width: `${(item.amount / financialData.summary.totalExpense) * 100}%` },
                  ]}
                />
              </View>

              <Text style={styles.breakdownPercentage}>
                {((item.amount / financialData.summary.totalExpense) * 100).toFixed(1)}%
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('ExpenseBreakdown')}
          >
            <Text style={styles.viewAllText}>View All Expense Categories</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Crop Profitability */}
        <Card style={styles.cropCard}>
          <Text style={styles.cardTitle}>Crop Profitability</Text>

          {financialData.cropProfitability.map((crop, index) => (
            <View key={index} style={styles.cropItem}>
              <Text style={styles.cropName}>{crop.crop}</Text>

              <View style={styles.cropFinancials}>
                <View style={styles.cropFinancialItem}>
                  <Text style={styles.cropFinancialLabel}>Income</Text>
                  <Text style={[styles.cropFinancialValue, styles.incomeText]}>
                    {formatCurrency(crop.income)}
                  </Text>
                </View>

                <View style={styles.cropFinancialItem}>
                  <Text style={styles.cropFinancialLabel}>Expense</Text>
                  <Text style={[styles.cropFinancialValue, styles.expenseText]}>
                    {formatCurrency(crop.expense)}
                  </Text>
                </View>

                <View style={styles.cropFinancialItem}>
                  <Text style={styles.cropFinancialLabel}>Profit</Text>
                  <Text style={[styles.cropFinancialValue, styles.profitText]}>
                    {formatCurrency(crop.profit)}
                  </Text>
                </View>
              </View>

              <View style={styles.profitMarginContainer}>
                <View style={styles.profitMarginBarContainer}>
                  <View
                    style={[
                      styles.profitMarginBar,
                      { width: `${Math.max(0, Math.min(100, (crop.profit / crop.income) * 100))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.profitMarginText}>
                  {((crop.profit / crop.income) * 100).toFixed(1)}% Margin
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Export Options */}
        <Card style={styles.exportCard}>
          <Text style={styles.cardTitle}>Export Reports</Text>

          <View style={styles.exportButtons}>
            <Button
              title="Export as PDF"
              variant="outline"
              size="small"
              leftIcon={<Ionicons name="document-text" size={16} color={colors.primary} />}
              onPress={() => navigation.navigate('DetailedReport')}
              style={styles.exportButton}
            />

            <Button
              title="Export as CSV"
              variant="outline"
              size="small"
              leftIcon={<Ionicons name="document" size={16} color={colors.primary} />}
              onPress={() => {
                // In a real app, we would generate and export a CSV
                alert('CSV export feature coming soon!');
              }}
              style={styles.exportButton}
            />
          </View>
        </Card>

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
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  timePeriodSelectionWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    marginBottom: 8,
  },
  timePeriodsContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePeriodButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.white,
    marginRight: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  activeTimePeriodButton: {
    backgroundColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderColor: colors.primary,
    transform: [{ scale: 1.05 }],
  },
  timePeriodText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTimePeriodText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  summaryCard: {
    marginVertical: 12,
    marginHorizontal: 'auto',
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
  lossText: {
    color: colors.error,
  },
  profitMarginContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  profitMarginLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  profitMarginBarContainer: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  profitMarginBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  profitMarginText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'right',
  },
  trendCard: {
    marginVertical: 12,
    marginHorizontal: 'auto',
    marginTop: 0,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chartYAxis: {
    width: 36,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  chartYAxisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  chartContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lightGray,
    paddingLeft: 6,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    width: 16,
    height: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chartIncome: {
    width: 8,
    backgroundColor: colors.success,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  chartExpense: {
    width: 8,
    backgroundColor: colors.error,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  chartXAxisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  incomeColor: {
    backgroundColor: colors.success,
  },
  expenseColor: {
    backgroundColor: colors.error,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdownCard: {
    marginVertical: 12,
    marginHorizontal: 'auto',
    marginTop: 0,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  breakdownItem: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  breakdownBarContainer: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  incomeBar: {
    backgroundColor: colors.success,
  },
  expenseBar: {
    backgroundColor: colors.error,
  },
  breakdownPercentage: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginRight: 4,
  },
  cropCard: {
    marginVertical: 12,
    marginHorizontal: 'auto',
    marginTop: 0,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  cropItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  cropName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cropFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cropFinancialItem: {
    alignItems: 'center',
  },
  cropFinancialLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cropFinancialValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  exportCard: {
    marginVertical: 12,
    marginHorizontal: 'auto',
    marginTop: 0,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default ReportsScreen;
