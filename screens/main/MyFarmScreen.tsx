import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import FinanceService from '../../services/FinanceService';
import MarketplaceService from '../../services/MarketplaceService';
import { Transaction, Income, Expense, FinancialSummary } from '../../models/Finance';
import { Product, Order } from '../../models/Product';
import LoadingQuote from '../../components/LoadingQuote';

const MyFarmScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State for active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'finances' | 'products'>('overview');

  // State for data
  const [loading, setLoading] = useState<boolean>(true);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesOrders, setSalesOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Order[]>([]);

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userProfile) {
        loadData();
      }
      return () => {};
    }, [userProfile])
  );

  // Load all data
  const loadData = async () => {
    if (!userProfile) {
      console.error('User profile not found');
      return;
    }

    setLoading(true);
    try {
      // Calculate date range for last 30 days
      const endDate = Date.now();
      const startDate = endDate - (30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Load financial summary
      const summary = await FinanceService.generateFinancialSummary(userProfile.uid, startDate, endDate);
      setFinancialSummary(summary);

      // Load transactions
      const transactions = await FinanceService.getTransactionsByUser(userProfile.uid);
      // Sort by date in descending order
      const sortedTransactions = transactions.sort((a, b) => b.date - a.date);
      setRecentTransactions(sortedTransactions);

      // Load products
      const products = await MarketplaceService.getProductsBySeller(userProfile.uid);
      setMyProducts(products);

      // Load orders (purchases)
      const userOrders = await MarketplaceService.getOrdersByUser(userProfile.uid);
      setOrders(userOrders);
      setPurchaseOrders(userOrders);

      // Load sales orders (where user is seller)
      const sellerOrders = await MarketplaceService.getOrdersBySeller(userProfile.uid);
      setSalesOrders(sellerOrders);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (date: number | Date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Render tab content
  const renderTabContent = () => {
    // If loading, show loading indicator
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingQuote type="finance" />
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Financial Summary Card */}
            <Card style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Financial Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={[styles.summaryValue, styles.incomeText]}>
                    {formatCurrency(financialSummary?.totalIncome || 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={[styles.summaryValue, styles.expenseText]}>
                    {formatCurrency(financialSummary?.totalExpense || 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Profit</Text>
                  <Text style={[styles.summaryValue, styles.profitText]}>
                    {formatCurrency(financialSummary?.netProfit || 0)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('DetailedReport' as never)}
              >
                <Text style={styles.viewMoreText}>View Detailed Reports</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </Card>

            {/* Recent Transactions */}
            <Card style={styles.transactionsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Transactions</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('finances')}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 3).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          (transaction as any).type === 'income'
                            ? styles.incomeIcon
                            : styles.expenseIcon,
                        ]}
                      >
                        <Ionicons
                          name={(transaction as any).type === 'income' ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={colors.white}
                        />
                      </View>
                      <View>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.date)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        (transaction as any).type === 'income'
                          ? styles.incomeText
                          : styles.expenseText,
                      ]}
                    >
                      {(transaction as any).type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="wallet-outline" size={40} color={colors.lightGray} />
                  <Text style={styles.emptyStateText}>No transactions yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add income or expenses to see them here
                  </Text>
                </View>
              )}
            </Card>

            {/* My Products */}
            <Card style={styles.productsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>My Products</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('products')}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {myProducts.length > 0 ? (
                myProducts.slice(0, 2).map((product) => (
                  <View key={product.id} style={styles.productItem}>
                    <Image
                      source={{
                        uri: product.images && product.images.length > 0
                          ? product.images[0].url
                          : 'https://via.placeholder.com/100x100?text=No+Image'
                      }}
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>
                        {formatCurrency(product.price)}/{product.unit}
                      </Text>
                      <Text style={styles.productStock}>
                        Stock: {product.quantity} {product.unit}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => navigation.navigate('EditProduct' as never, { productId: product.id } as never)}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="basket-outline" size={40} color={colors.lightGray} />
                  <Text style={styles.emptyStateText}>No products listed</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add products to start selling
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => navigation.navigate('AddProduct' as never)}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.addProductText}>Add New Product</Text>
              </TouchableOpacity>
            </Card>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => navigation.navigate('AddIncome' as never)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success }]}>
                    <Ionicons name="cash" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.quickActionText}>Add Income</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => navigation.navigate('AddExpense' as never)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.error }]}>
                    <Ionicons name="wallet" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.quickActionText}>Add Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => navigation.navigate('FinancialHealthScreen' as never)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.info }]}>
                    <Ionicons name="bar-chart" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.quickActionText}>Financial Health</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => navigation.navigate('Orders' as never)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.warning }]}>
                    <Ionicons name="list" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.quickActionText}>View Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => navigation.navigate('Warehouse' as never)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}>
                    <Ionicons name="cube" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.quickActionText}>Warehouse</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        );

      case 'finances':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Financial Management</Text>

            {/* Transactions List */}
            <Card style={styles.fullWidthCard}>
              <Text style={styles.cardTitle}>All Transactions</Text>

              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          (transaction as any).type === 'income'
                            ? styles.incomeIcon
                            : styles.expenseIcon,
                        ]}
                      >
                        <Ionicons
                          name={(transaction as any).type === 'income' ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={colors.white}
                        />
                      </View>
                      <View>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.date)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        (transaction as any).type === 'income'
                          ? styles.incomeText
                          : styles.expenseText,
                      ]}
                    >
                      {(transaction as any).type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="wallet-outline" size={40} color={colors.lightGray} />
                  <Text style={styles.emptyStateText}>No transactions yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add income or expenses to see them here
                  </Text>
                </View>
              )}

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AddIncome' as never)}
                >
                  <Ionicons name="add-circle" size={20} color={colors.success} />
                  <Text style={[styles.actionButtonText, { color: colors.success }]}>Add Income</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AddExpense' as never)}
                >
                  <Ionicons name="add-circle" size={20} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        );

      case 'products':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>My Products</Text>

            {/* Products List */}
            <Card style={styles.fullWidthCard}>
              <Text style={styles.cardTitle}>All Products</Text>

              {myProducts.length > 0 ? (
                myProducts.map((product) => (
                  <View key={product.id} style={styles.productItem}>
                    <Image
                      source={{
                        uri: product.images && product.images.length > 0
                          ? product.images[0].url
                          : 'https://via.placeholder.com/100x100?text=No+Image'
                      }}
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>
                        {formatCurrency(product.price)}/{product.unit}
                      </Text>
                      <Text style={styles.productStock}>
                        Stock: {product.quantity} {product.unit}
                      </Text>
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditProduct' as never, { productId: product.id } as never)}
                      >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editButton, { marginTop: spacing.sm }]}
                        onPress={() => navigation.navigate('ProductDetails' as never, { productId: product.id } as never)}
                      >
                        <Ionicons name="eye-outline" size={20} color={colors.info} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="basket-outline" size={40} color={colors.lightGray} />
                  <Text style={styles.emptyStateText}>No products listed</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add products to start selling
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => navigation.navigate('AddProduct' as never)}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.addProductText}>Add New Product</Text>
              </TouchableOpacity>
            </Card>

            {/* Sales Orders */}
            <Card style={styles.fullWidthCard}>
              <Text style={styles.cardTitle}>Recent Sales</Text>

              {salesOrders.length > 0 ? (
                salesOrders.slice(0, 3).map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderItem}
                    onPress={() => navigation.navigate('OrderDetails' as never, { orderId: order.id } as never)}
                  >
                    <View style={styles.orderLeft}>
                      <View
                        style={[
                          styles.orderStatusBadge,
                          { backgroundColor: getOrderStatusColor(order.status) },
                        ]}
                      >
                        <Text style={styles.orderStatusText}>{order.status}</Text>
                      </View>
                      <View>
                        <Text style={styles.orderTitle}>
                          Order #{order.id.substring(0, 8)}
                        </Text>
                        <Text style={styles.orderDate}>
                          {formatDate(order.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderAmount}>
                      {formatCurrency(order.totalAmount)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="cart-outline" size={40} color={colors.lightGray} />
                  <Text style={styles.emptyStateText}>No sales yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your sales will appear here
                  </Text>
                </View>
              )}

              {salesOrders.length > 0 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => navigation.navigate('Orders' as never, { initialTab: 'sales' } as never)}
                >
                  <Text style={styles.viewMoreText}>View All Sales</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  // Helper function to get color for order status
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'shipped':
        return colors.primary;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {userProfile?.displayName || 'Farmer'}
          </Text>
          <Text style={styles.farmName}>
            {userProfile?.farmName || 'Your Farm'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Ionicons name="person-circle" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'finances' && styles.activeTab]}
          onPress={() => setActiveTab('finances')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'finances' && styles.activeTabText,
            ]}
          >
            Finances
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'products' && styles.activeTabText,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  greeting: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  farmName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
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
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  viewMoreText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  transactionsCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  incomeIcon: {
    backgroundColor: colors.success,
  },
  expenseIcon: {
    backgroundColor: colors.error,
  },
  transactionDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  transactionDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
  },
  productsCard: {
    marginBottom: spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    backgroundColor: colors.lightGray,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  productPrice: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  productStock: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  editButton: {
    padding: spacing.sm,
  },
  productActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addProductText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  quickActionsContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  tabContent: {
    padding: spacing.md,
  },
  tabTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  tabDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  comingSoonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  fullWidthCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 150,
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  orderStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    textTransform: 'capitalize',
  },
  orderTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  orderAmount: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
});

export default MyFarmScreen;
