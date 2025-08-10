import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';
import Card from '../../components/Card';
import WalletService, { Transaction } from '../../services/WalletService';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const EarningsScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load wallet data
  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get wallet balance
      const balance = await WalletService.getBalance(user.uid);
      setWalletBalance(balance);
      
      // Get transactions
      const transactionsList = await WalletService.getTransactions(user.uid);
      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    loadWalletData();
  }, [user]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Calculate earnings statistics
  const calculateEarnings = () => {
    if (!transactions.length) return { today: 0, thisWeek: 0, thisMonth: 0 };
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    
    // Only count delivery fee credits
    transactions.forEach(transaction => {
      if (transaction.type === 'credit' && transaction.description.includes('Delivery fee')) {
        if (transaction.timestamp >= todayStart) {
          today += transaction.amount;
        }
        if (transaction.timestamp >= weekStart) {
          thisWeek += transaction.amount;
        }
        if (transaction.timestamp >= monthStart) {
          thisMonth += transaction.amount;
        }
      }
    });
    
    return { today, thisWeek, thisMonth };
  };
  
  const earnings = calculateEarnings();
  
  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'credit';
    const isDeliveryFee = item.description.includes('Delivery fee');
    
    // Only show delivery fee transactions
    if (!isDeliveryFee) return null;
    
    return (
      <Card style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={[styles.transactionIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="bicycle" size={20} color={colors.primary} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{item.description}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
          </View>
          <Text style={[styles.transactionAmount, { color: colors.success }]}>
            +₹{item.amount.toFixed(2)}
          </Text>
        </View>
      </Card>
    );
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
        <Text style={styles.headerTitle}>Delivery Earnings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Wallet Balance */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          <Text style={styles.balanceTitle}>Wallet Balance</Text>
        </View>
        
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Text style={styles.balanceAmount}>₹{walletBalance?.toFixed(2) || '0.00'}</Text>
        )}
      </Card>
      
      {/* Earnings Summary */}
      <Card style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Ionicons name="stats-chart" size={24} color={colors.primary} />
          <Text style={styles.earningsTitle}>Earnings Summary</Text>
        </View>
        
        <View style={styles.earningsGrid}>
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Today</Text>
            <Text style={styles.earningsValue}>₹{earnings.today.toFixed(2)}</Text>
          </View>
          
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>This Week</Text>
            <Text style={styles.earningsValue}>₹{earnings.thisWeek.toFixed(2)}</Text>
          </View>
          
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>This Month</Text>
            <Text style={styles.earningsValue}>₹{earnings.thisMonth.toFixed(2)}</Text>
          </View>
        </View>
      </Card>
      
      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Delivery Earnings</Text>
        
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.transactionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle" size={60} color={colors.lightGray} />
              <Text style={styles.emptyText}>
                No delivery earnings yet. Complete deliveries to earn money.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: '#2E3A59',
  },
  balanceCard: {
    margin: spacing.md,
    padding: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#2E3A59',
    marginLeft: spacing.sm,
  },
  balanceAmount: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  earningsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  earningsTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#2E3A59',
    marginLeft: spacing.sm,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    alignItems: 'center',
    flex: 1,
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: '#6B7280',
    marginBottom: spacing.xs,
  },
  earningsValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#4CAF50',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#2E3A59',
    marginBottom: spacing.sm,
  },
  transactionsList: {
    paddingBottom: spacing.xl,
  },
  transactionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: '#2E3A59',
  },
  transactionDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: spacing.xs,
  },
  transactionAmount: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default EarningsScreen;
