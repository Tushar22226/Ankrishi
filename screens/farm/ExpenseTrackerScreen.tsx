import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { ExpenseCategory, IncomeCategory } from '../../models/Finance';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Mock transaction data
const mockTransactions = [
  {
    id: '1',
    type: 'expense',
    category: 'fertilizers',
    amount: 3500,
    date: new Date(Date.now() - 86400000 * 2), // 2 days ago
    description: 'NPK fertilizer purchase',
  },
  {
    id: '2',
    type: 'income',
    category: 'crop_sales',
    amount: 12000,
    date: new Date(Date.now() - 86400000 * 4), // 4 days ago
    description: 'Wheat harvest sale',
  },
  {
    id: '3',
    type: 'expense',
    category: 'seeds',
    amount: 2000,
    date: new Date(Date.now() - 86400000 * 5), // 5 days ago
    description: 'Wheat seeds for next season',
  },
  {
    id: '4',
    type: 'expense',
    category: 'labor',
    amount: 5000,
    date: new Date(Date.now() - 86400000 * 7), // 7 days ago
    description: 'Harvesting labor cost',
  },
  {
    id: '5',
    type: 'income',
    category: 'livestock_sales',
    amount: 8000,
    date: new Date(Date.now() - 86400000 * 10), // 10 days ago
    description: 'Sold 2 cows',
  },
  {
    id: '6',
    type: 'expense',
    category: 'equipment_maintenance',
    amount: 1500,
    date: new Date(Date.now() - 86400000 * 12), // 12 days ago
    description: 'Tractor maintenance',
  },
  {
    id: '7',
    type: 'expense',
    category: 'fuel',
    amount: 800,
    date: new Date(Date.now() - 86400000 * 15), // 15 days ago
    description: 'Diesel for tractor',
  },
  {
    id: '8',
    type: 'income',
    category: 'crop_sales',
    amount: 15000,
    date: new Date(Date.now() - 86400000 * 20), // 20 days ago
    description: 'Rice harvest sale',
  },
];

// Mock financial summary
const mockFinancialSummary = {
  totalIncome: 35000,
  totalExpense: 13800,
  netProfit: 21200,
  incomeByCategory: {
    crop_sales: 27000,
    livestock_sales: 8000,
    equipment_rental: 0,
    land_lease: 0,
    government_subsidy: 0,
    insurance_claim: 0,
    other_income: 0,
  },
  expenseByCategory: {
    seeds: 2000,
    fertilizers: 3500,
    pesticides: 0,
    equipment_purchase: 0,
    equipment_rental: 0,
    equipment_maintenance: 1500,
    irrigation: 0,
    labor: 5000,
    land_lease: 0,
    fuel: 800,
    electricity: 0,
    transportation: 0,
    storage: 0,
    marketing: 0,
    loan_payment: 0,
    insurance: 0,
    taxes: 0,
    other_expense: 1000,
  },
};

// Time periods for filtering
const timePeriods = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' },
  { id: 'today', label: 'Today' },
];

// Transaction types for filtering
const transactionTypes = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
];

const ExpenseTrackerScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [activeTimePeriod, setActiveTimePeriod] = useState('month');
  const [activeTransactionType, setActiveTransactionType] = useState('all');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter transactions when filters change
  useEffect(() => {
    filterTransactions();
  }, [activeTimePeriod, activeTransactionType]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // In a real app, we would fetch data from a service
      // For now, let's use mock data
      setTimeout(() => {
        setTransactions(mockTransactions);
        setFinancialSummary(mockFinancialSummary);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Filter transactions based on active filters
  const filterTransactions = () => {
    let filtered = [...mockTransactions];

    // Filter by time period
    if (activeTimePeriod !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (activeTimePeriod) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'week':
          const day = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - day);
          break;
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      filtered = filtered.filter(transaction => new Date(transaction.date) >= startDate);
    }

    // Filter by transaction type
    if (activeTransactionType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === activeTransactionType);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(filtered);

    // Calculate financial summary for filtered transactions
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      incomeByCategory: {} as Record<string, number>,
      expenseByCategory: {} as Record<string, number>,
    };

    filtered.forEach(transaction => {
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;

        if (!summary.incomeByCategory[transaction.category]) {
          summary.incomeByCategory[transaction.category] = 0;
        }

        summary.incomeByCategory[transaction.category] += transaction.amount;
      } else {
        summary.totalExpense += transaction.amount;

        if (!summary.expenseByCategory[transaction.category]) {
          summary.expenseByCategory[transaction.category] = 0;
        }

        summary.expenseByCategory[transaction.category] += transaction.amount;
      }
    });

    summary.netProfit = summary.totalIncome - summary.totalExpense;

    setFinancialSummary(summary);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get category icon
  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'income') {
      switch (category as IncomeCategory) {
        case 'crop_sales':
          return 'leaf';
        case 'livestock_sales':
          return 'paw';
        case 'equipment_rental':
          return 'construct';
        case 'land_lease':
          return 'map';
        case 'government_subsidy':
          return 'business';
        case 'insurance_claim':
          return 'shield';
        default:
          return 'cash';
      }
    } else {
      switch (category as ExpenseCategory) {
        case 'seeds':
          return 'seed';
        case 'fertilizers':
          return 'flask';
        case 'pesticides':
          return 'bug';
        case 'equipment_purchase':
        case 'equipment_rental':
        case 'equipment_maintenance':
          return 'construct';
        case 'irrigation':
          return 'water';
        case 'labor':
          return 'people';
        case 'land_lease':
          return 'map';
        case 'fuel':
          return 'speedometer';
        case 'electricity':
          return 'flash';
        case 'transportation':
          return 'car';
        case 'storage':
          return 'cube';
        case 'marketing':
          return 'megaphone';
        case 'loan_payment':
          return 'card';
        case 'insurance':
          return 'shield';
        case 'taxes':
          return 'document-text';
        default:
          return 'wallet';
      }
    }
  };

  // Get category name
  const getCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render a transaction item
  const renderTransactionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => navigation.navigate('TransactionDetails' as never, { transactionId: item.id } as never)}
    >
      <View
        style={[
          styles.transactionIcon,
          item.type === 'income' ? styles.incomeIcon : styles.expenseIcon,
        ]}
      >
        <Ionicons
          name={getCategoryIcon(item.category, item.type) as any}
          size={20}
          color={colors.white}
        />
      </View>

      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionCategory}>
            {getCategoryName(item.category)}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(new Date(item.date))}</Text>
        </View>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          item.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
        ]}
      >
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading financial data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Tracker</Text>
      </View>

      {/* Financial Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Financial Summary</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.incomeText]}>
              {formatCurrency(financialSummary.totalIncome)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, styles.expenseText]}>
              {formatCurrency(financialSummary.totalExpense)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Profit</Text>
            <Text
              style={[
                styles.summaryValue,
                financialSummary.netProfit >= 0 ? styles.profitText : styles.lossText,
              ]}
            >
              {formatCurrency(financialSummary.netProfit)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title="Add Income"
            variant="outline"
            size="small"
            leftIcon={<Ionicons name="add-circle" size={16} color={colors.primary} />}
            onPress={() => navigation.navigate('AddIncome')}
            style={styles.actionButton}
          />

          <Button
            title="Add Expense"
            variant="outline"
            size="small"
            leftIcon={<Ionicons name="remove-circle" size={16} color={colors.primary} />}
            onPress={() => navigation.navigate('AddExpense')}
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {timePeriods.map(period => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.filterButton,
                activeTimePeriod === period.id && styles.activeFilterButton,
              ]}
              onPress={() => setActiveTimePeriod(period.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeTimePeriod === period.id && styles.activeFilterButtonText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.typeFiltersContainer}>
          {transactionTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeFilterButton,
                activeTransactionType === type.id && styles.activeTypeFilterButton,
              ]}
              onPress={() => setActiveTransactionType(type.id)}
            >
              <Text
                style={[
                  styles.typeFilterButtonText,
                  activeTransactionType === type.id && styles.activeTypeFilterButtonText,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transactions</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AllTransactions' as never)}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.transactionsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>
              You haven't recorded any transactions in this period.
            </Text>
          </View>
        )}
      </View>
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
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  summaryCard: {
    margin: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
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
  lossText: {
    color: colors.error,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: spacing.sm,
  },
  filtersScrollContent: {
    paddingHorizontal: spacing.md,
  },
  filterButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  activeFilterButton: {
    backgroundColor: colors.primaryLight,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeFilterButtonText: {
    color: colors.primary,
  },
  typeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  typeFilterButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTypeFilterButton: {
    borderBottomColor: colors.primary,
  },
  typeFilterButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTypeFilterButtonText: {
    color: colors.primary,
  },
  transactionsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transactionsTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  transactionsList: {
    paddingBottom: spacing.xl,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  incomeIcon: {
    backgroundColor: colors.success,
  },
  expenseIcon: {
    backgroundColor: colors.error,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionCategory: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  transactionDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    marginLeft: spacing.md,
  },
  incomeAmount: {
    color: colors.success,
  },
  expenseAmount: {
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExpenseTrackerScreen;
