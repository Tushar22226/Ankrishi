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
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import FinanceService from '../../services/FinanceService';
import { ExpenseCategory } from '../../models/Finance';

const ExpenseBreakdownScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<any>(null);

  // Load data when component mounts
  useEffect(() => {
    if (userProfile?.uid) {
      loadData();
    }
  }, [userProfile]);

  // Load expense data
  const loadData = async () => {
    if (!userProfile?.uid) {
      console.error('User profile not found');
      return;
    }

    try {
      setLoading(true);

      // Get date range (last 6 months by default)
      const now = new Date();
      const endDate = now.getTime();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();

      // Generate financial summary using real data
      const summary = await FinanceService.generateFinancialSummary(
        userProfile.uid,
        startDate,
        endDate
      );

      setExpenseData(summary.expenseByCategory);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load expense data. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get category name
  const getCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get all expense categories
  const getAllExpenseCategories = () => {
    if (!expenseData) return [];

    const categories = Object.entries(expenseData)
      .map(([category, amount]) => ({ category, amount: amount as number }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return categories;
  };

  // Calculate total expense
  const getTotalExpense = () => {
    if (!expenseData) return 0;

    return Object.values(expenseData).reduce((sum, amount) => sum + (amount as number), 0);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading expense breakdown...</Text>
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
        <Text style={styles.title}>Expense Breakdown</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Expense Summary</Text>
          <Text style={styles.totalExpenseValue}>{formatCurrency(getTotalExpense())}</Text>
          <Text style={styles.totalExpenseLabel}>Total Expenses (Last 6 Months)</Text>
        </Card>

        {/* Expense Categories */}
        <Card style={styles.categoriesCard}>
          <Text style={styles.cardTitle}>Expenses by Category</Text>

          {getAllExpenseCategories().map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>
                  {getCategoryName(item.category)}
                </Text>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.categoryBarContainer}>
                <View
                  style={[
                    styles.categoryBar,
                    { width: `${(item.amount / getTotalExpense()) * 100}%` },
                  ]}
                />
              </View>

              <Text style={styles.categoryPercentage}>
                {((item.amount / getTotalExpense()) * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </Card>

        {/* Add Expense Button */}
        <Button
          title="Add New Expense"
          onPress={() => navigation.navigate('AddExpense' as never)}
          style={styles.addButton}
          leftIcon={<Ionicons name="add-circle" size={20} color={colors.white} />}
        />

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
    flexDirection: 'row',
    alignItems: 'center',
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
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    padding: 16,
  },
  totalExpenseValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
    marginVertical: 12,
  },
  totalExpenseLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoriesCard: {
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
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    backgroundColor: colors.error,
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  addButton: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default ExpenseBreakdownScreen;
