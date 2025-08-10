import React, { useState, useEffect } from 'react';
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
import { colors, typography, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import FinanceService from '../../services/FinanceService';
import PDFService from '../../services/PDFService';
import { isIncome, isExpense } from '../../models/Finance';

// Combined transaction type for displaying in the table
interface TransactionRow {
  id: string;
  date: number;
  type: 'income' | 'expense' | 'sale' | 'purchase' | 'rental' | 'contract_payment_received' | 'contract_payment_made';
  description: string;
  category: string;
  amount: number;
  source?: string;
  contractId?: string;
}

const DetailedReportScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).getTime(), // Last 3 months
    endDate: new Date().getTime(),
  });
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  });

  // Load data on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadTransactionData();
    }
  }, [userProfile]);

  // Load transaction data
  const loadTransactionData = async () => {
    try {
      setLoading(true);

      if (!userProfile?.uid) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }

      // Get all transactions (income and expenses)
      const allTransactions = await FinanceService.getTransactionsByDateRange(
        userProfile.uid,
        dateRange.startDate,
        dateRange.endDate
      );

      // Get order data (sales, purchases, rentals)
      const orderData = await FinanceService.getOrderFinancialData(
        userProfile.uid,
        dateRange.startDate,
        dateRange.endDate
      );

      // Get contract data
      const contractData = await FinanceService.getContractFinancialData(
        userProfile.uid,
        dateRange.startDate,
        dateRange.endDate
      );

      // Process transactions into a unified format
      const processedTransactions: TransactionRow[] = [];

      // Process income and expense transactions
      allTransactions.forEach(transaction => {
        if (isIncome(transaction)) {
          processedTransactions.push({
            id: transaction.id,
            date: transaction.date,
            type: 'income',
            description: transaction.description,
            category: formatCategoryName(transaction.category),
            amount: transaction.amount,
            source: transaction.source,
          });
        } else if (isExpense(transaction)) {
          processedTransactions.push({
            id: transaction.id,
            date: transaction.date,
            type: 'expense',
            description: transaction.description,
            category: formatCategoryName(transaction.category),
            amount: -transaction.amount, // Negative for expenses
            source: transaction.vendor,
          });
        }
      });

      // Process sales orders
      orderData.salesOrders.forEach(order => {
        processedTransactions.push({
          id: order.id,
          date: order.createdAt,
          type: 'sale',
          description: `Sale: Order #${order.id.substring(0, 8)}`,
          category: 'Sales',
          amount: order.totalAmount,
          source: order.shippingAddress?.name || 'Customer',
        });
      });

      // Process purchase orders
      orderData.purchaseOrders.forEach(order => {
        // Check if it's a rental or purchase
        const isRental = order.items.some(item => item.isRental);

        processedTransactions.push({
          id: order.id,
          date: order.createdAt,
          type: isRental ? 'rental' : 'purchase',
          description: `${isRental ? 'Rental' : 'Purchase'}: Order #${order.id.substring(0, 8)}`,
          category: isRental ? 'Equipment Rental' : 'Purchase',
          amount: -order.totalAmount, // Negative for purchases
          source: 'Vendor',
        });
      });

      // Process contract payments
      contractData.contracts.forEach(contract => {
        if (contract.payments) {
          Object.entries(contract.payments).forEach(([paymentId, payment]: [string, any]) => {
            // Only include payments within the date range
            if (payment.date >= dateRange.startDate && payment.date <= dateRange.endDate) {
              const isCreator = contract.creatorId === userProfile?.uid;

              // If user is creator, they receive payments
              if (isCreator) {
                processedTransactions.push({
                  id: paymentId,
                  date: payment.date,
                  type: 'contract_payment_received',
                  description: `Payment received for contract: ${contract.title || 'Contract'}`,
                  category: 'Contract Payment',
                  amount: payment.amount,
                  source: contract.parties?.secondPartyUsername || 'Contract Party',
                  contractId: contract.id
                });
              } else {
                // If user is not creator, they make payments
                processedTransactions.push({
                  id: paymentId,
                  date: payment.date,
                  type: 'contract_payment_made',
                  description: `Payment made for contract: ${contract.title || 'Contract'}`,
                  category: 'Contract Payment',
                  amount: -payment.amount, // Negative for payments made
                  source: contract.parties?.firstPartyUsername || 'Contract Creator',
                  contractId: contract.id
                });
              }
            }
          });
        }
      });

      // Sort by date (newest first)
      processedTransactions.sort((a, b) => b.date - a.date);

      // Calculate summary
      const totalIncome = processedTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = processedTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      setSummary({
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      });

      setTransactions(processedTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transaction data:', error);
      Alert.alert('Error', 'Failed to load transaction data. Please try again.');
      setLoading(false);
    }
  };

  // Format category name for display
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string): string => {
    switch (type) {
      case 'income':
        return 'arrow-down';
      case 'expense':
        return 'arrow-up';
      case 'sale':
        return 'cart';
      case 'purchase':
        return 'basket';
      case 'rental':
        return 'calendar';
      case 'contract_payment_received':
        return 'document-text';
      case 'contract_payment_made':
        return 'document-text';
      default:
        return 'document';
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'income':
      case 'sale':
      case 'contract_payment_received':
        return colors.success;
      case 'expense':
      case 'purchase':
      case 'rental':
      case 'contract_payment_made':
        return colors.error;
      default:
        return colors.textPrimary;
    }
  };

  // We're now using PDFService.generateAndSharePDF instead of a local function

  // Share report as PDF
  const shareReport = async () => {
    try {
      setSharingPdf(true);

      // Format date range for the message
      const startDateStr = new Date(dateRange.startDate).toLocaleDateString();
      const endDateStr = new Date(dateRange.endDate).toLocaleDateString();

      // Prepare user information for the PDF
      const userInfo = {
        name: userProfile?.displayName,
        farmName: userProfile?.farmDetails?.name || userProfile?.displayName + "'s Farm",
        phoneNumber: userProfile?.phoneNumber,
        location: userProfile?.location?.address ||
                 (userProfile?.location?.latitude && userProfile?.location?.longitude
                   ? `${userProfile.location.latitude.toFixed(4)}, ${userProfile.location.longitude.toFixed(4)}`
                   : undefined)
      };

      // Generate and share PDF report
      const result = await PDFService.generateAndSharePDF(
        'Financial Transactions Report',
        `Period: ${startDateStr} to ${endDateStr}`,
        {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netProfit: summary.netProfit
        },
        transactions,
        userInfo,
        userProfile?.uid // Pass user ID for Firebase Storage upload
      );

      // Show success message based on result
      let successMessage = 'Report has been processed successfully!';

      if (result.method === 'print') {
        successMessage = result.isCloudStored
          ? 'Report has been uploaded to cloud storage and print dialog opened! You can print or save as PDF.'
          : 'Print dialog opened! You can print or save the report as PDF.';
      } else if (result.isCloudStored) {
        successMessage = 'Report has been uploaded to cloud storage and shared successfully! The download link has been included in the share message.';
      } else {
        successMessage = 'Report has been shared successfully!';
      }

      Alert.alert(
        'Success',
        successMessage,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sharing PDF report:', error);
      // The PDFService will handle fallback to text report if PDF generation fails
      // So we don't need to show an additional error here unless it's a different type of error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('PDF Generation Failed')) {
        Alert.alert('Error', 'Failed to share report. Please try again.');
      }
    } finally {
      setSharingPdf(false);
    }
  };

  // We're now using PDFService.generateTextReport instead of a local function

  // Loading state
  if (loading) {
    return <LoadingQuote loadingText="Loading transaction data..." />;
  }

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
        <Text style={styles.headerTitle}>Detailed Transactions</Text>
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Financial Summary</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.incomeText]}>
              ₹{summary.totalIncome.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, styles.expenseText]}>
              ₹{summary.totalExpense.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Profit</Text>
            <Text
              style={[
                styles.summaryValue,
                summary.netProfit >= 0 ? styles.profitText : styles.lossText,
              ]}
            >
              ₹{summary.netProfit.toLocaleString()}
            </Text>
          </View>
        </View>
      </Card>

      {/* Share Button */}
      <View style={styles.shareButtonContainer}>
        <Button
          title="Share Report"
          leftIcon={<Ionicons name="share-outline" size={20} color={colors.white} />}
          onPress={shareReport}
          loading={sharingPdf}
          style={styles.shareButton}
        />
      </View>

      {/* Transactions Table */}
      <Card style={styles.tableCard}>
        <Text style={styles.tableTitle}>All Transactions</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.dateCell]}>Date</Text>
          <Text style={[styles.tableHeaderCell, styles.typeCell]}>Type</Text>
          <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.amountCell]}>Amount</Text>
        </View>

        {/* Table Content */}
        <ScrollView style={styles.tableContent}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No transactions found for this period</Text>
            </View>
          ) : (
            transactions.map(transaction => (
              <View
                key={`${transaction.id}-${transaction.type}`}
                style={[
                  styles.tableRow,
                  transaction.amount >= 0 ? styles.incomeRow : styles.expenseRow,
                ]}
              >
                <Text style={[styles.tableCell, styles.dateCell]}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
                <View style={[styles.tableCell, styles.typeCell]}>
                  <Ionicons
                    name={getTransactionTypeIcon(transaction.type) as any}
                    size={16}
                    color={getTransactionTypeColor(transaction.type)}
                    style={styles.typeIcon}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      { color: getTransactionTypeColor(transaction.type) },
                    ]}
                  >
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.descriptionCell]}>
                  <Text style={styles.descriptionText} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {transaction.category}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tableCell,
                    styles.amountCell,
                    transaction.amount >= 0 ? styles.incomeText : styles.expenseText,
                  ]}
                >
                  {transaction.amount >= 0
                    ? `₹${transaction.amount.toLocaleString()}`
                    : `-₹${Math.abs(transaction.amount).toLocaleString()}`}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </Card>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          This report includes all transactions from your orders (sales, purchases, rentals) and additional income/expenses.
          The report will be uploaded to secure cloud storage and you can print, save as PDF, or share the download link.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
    marginTop:17,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0,
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
  summaryCard: {
    marginHorizontal: 'auto',
    marginVertical: spacing.md,
    width: '92%',
    alignSelf: 'center',
  },
  summaryTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
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
    color: colors.success,
  },
  lossText: {
    color: colors.error,
  },
  shareButtonContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    width: '92%',
    alignSelf: 'center',
  },
  shareButton: {
    width: '100%',
  },
  tableCard: {
    flex: 1,
    marginHorizontal: 'auto',
    marginBottom: spacing.md,
    width: '92%',
    alignSelf: 'center',
  },
  tableTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableHeaderCell: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  tableContent: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  incomeRow: {
    backgroundColor: 'rgba(40, 167, 69, 0.05)',
  },
  expenseRow: {
    backgroundColor: 'rgba(220, 53, 69, 0.05)',
  },
  tableCell: {
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  dateCell: {
    width: '20%',
    fontSize: typography.fontSize.sm,
  },
  typeCell: {
    width: '20%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: spacing.xs,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  descriptionCell: {
    width: '40%',
    flexDirection: 'column',
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  amountCell: {
    width: '20%',
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  disclaimerContainer: {
    padding: spacing.md,
    marginHorizontal: 'auto',
    marginBottom: spacing.md,
    width: '92%',
    alignSelf: 'center',
  },
  disclaimerText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default DetailedReportScreen;
