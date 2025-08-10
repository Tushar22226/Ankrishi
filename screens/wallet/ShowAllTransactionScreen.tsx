import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';
import WalletService, { Transaction } from '../../services/WalletService';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const ShowAllTransactionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Create styles with the current theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
      paddingBottom: spacing.md,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    backButton: {
      marginRight: spacing.md,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    transactionItem: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
    },
    creditTransaction: {
      borderLeftColor: colors.success,
    },
    debitTransaction: {
      borderLeftColor: colors.error,
    },
    holdTransaction: {
      borderLeftColor: colors.warning,
    },
    releaseTransaction: {
      borderLeftColor: colors.info,
    },
    transferTransaction: {
      borderLeftColor: colors.primary,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    creditIcon: {
      backgroundColor: colors.primaryLight,
    },
    debitIcon: {
      backgroundColor: colors.error + '20', // 20% opacity
    },
    holdIcon: {
      backgroundColor: colors.warning + '20', // 20% opacity
    },
    releaseIcon: {
      backgroundColor: colors.info + '20', // 20% opacity
    },
    transferIcon: {
      backgroundColor: colors.primary + '20', // 20% opacity
    },
    transactionDetails: {
      flex: 1,
    },
    transactionType: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    transactionDescription: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    transactionDate: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    transactionAmount: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      textAlign: 'right',
    },
    creditAmount: {
      color: colors.success,
    },
    debitAmount: {
      color: colors.error,
    },
  });

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const transactionsList = await WalletService.getTransactions(user.uid);
        setTransactions(transactionsList);
      } catch (error) {
        console.error('Error loading transactions:', error);
        Alert.alert('Error', 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get transaction style based on type
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'credit':
        return styles.creditTransaction;
      case 'debit':
        return styles.debitTransaction;
      case 'hold':
        return styles.holdTransaction;
      case 'release':
        return styles.releaseTransaction;
      case 'transfer':
        return styles.transferTransaction;
      default:
        return styles.debitTransaction;
    }
  };

  // Get transaction icon style based on type
  const getTransactionIconStyle = (type: string) => {
    switch (type) {
      case 'credit':
        return styles.creditIcon;
      case 'debit':
        return styles.debitIcon;
      case 'hold':
        return styles.holdIcon;
      case 'release':
        return styles.releaseIcon;
      case 'transfer':
        return styles.transferIcon;
      default:
        return styles.debitIcon;
    }
  };

  // Get transaction icon name based on type
  const getTransactionIconName = (type: string) => {
    switch (type) {
      case 'credit':
        return 'arrow-down';
      case 'debit':
        return 'arrow-up';
      case 'hold':
        return 'time';
      case 'release':
        return 'refresh';
      case 'transfer':
        return 'swap-horizontal';
      default:
        return 'arrow-up';
    }
  };

  // Get transaction icon color based on type
  const getTransactionIconColor = (type: string) => {
    switch (type) {
      case 'credit':
        return colors.primary;
      case 'debit':
        return colors.error;
      case 'hold':
        return colors.warning;
      case 'release':
        return colors.info;
      case 'transfer':
        return colors.primary;
      default:
        return colors.error;
    }
  };

  // Get transaction type text based on type
  const getTransactionTypeText = (item: Transaction) => {
    switch (item.type) {
      case 'credit':
        return 'Money Added';
      case 'debit':
        return 'Money Withdrawn';
      case 'hold':
        return 'Money Held for Order';
      case 'release':
        return 'Held Money Released';
      case 'transfer':
        return 'Money Transferred';
      default:
        return 'Transaction';
    }
  };

  // Get transaction amount prefix based on type
  const getTransactionAmountPrefix = (type: string) => {
    switch (type) {
      case 'credit':
      case 'release':
        return '+';
      case 'debit':
      case 'hold':
      case 'transfer':
        return '-';
      default:
        return '';
    }
  };

  // Get transaction amount style based on type
  const getTransactionAmountStyle = (type: string) => {
    switch (type) {
      case 'credit':
      case 'release':
        return styles.creditAmount;
      case 'debit':
      case 'hold':
      case 'transfer':
        return styles.debitAmount;
      default:
        return styles.debitAmount;
    }
  };

  // Render a transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <View
        style={[
          styles.transactionItem,
          getTransactionStyle(item.type)
        ]}
      >
        <View style={[
          styles.transactionIcon,
          getTransactionIconStyle(item.type)
        ]}>
          <Ionicons
            name={getTransactionIconName(item.type)}
            size={20}
            color={getTransactionIconColor(item.type)}
          />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {getTransactionTypeText(item)}
          </Text>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
          {item.status === 'held' && (
            <Text style={[styles.transactionDate, {color: colors.warning}]}>Status: Funds on hold</Text>
          )}
        </View>

        <Text style={[
          styles.transactionAmount,
          getTransactionAmountStyle(item.type)
        ]}>
          {getTransactionAmountPrefix(item.type)} ₹{item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={60} color={colors.lightGray} />
      <Text style={styles.emptyText}>
        No transactions yet. Add money to your wallet to get started.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
      </View>
    </View>
  );
};

export default ShowAllTransactionScreen;
