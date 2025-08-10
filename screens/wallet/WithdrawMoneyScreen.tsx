import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import WalletService from '../../services/WalletService';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const WithdrawMoneyScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [error, setError] = useState('');

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
      padding: spacing.lg,
    },
    formContainer: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    balanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    balanceLabel: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginRight: spacing.sm,
    },
    balanceAmount: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.success,
    },
    infoText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      lineHeight: typography.lineHeight.md,
    },
    buttonContainer: {
      marginTop: spacing.lg,
    },
    walletIcon: {
      alignSelf: 'center',
      marginBottom: spacing.lg,
      backgroundColor: colors.primaryLight,
      padding: spacing.md,
      borderRadius: borderRadius.round,
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    currencySymbol: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginRight: spacing.xs,
    },
    quickAmountContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    quickAmountButton: {
      backgroundColor: colors.surfaceLight,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      width: '30%',
      alignItems: 'center',
    },
    quickAmountText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
    },
  });

  // Load current balance
  useEffect(() => {
    const loadBalance = async () => {
      if (!user) return;
      
      try {
        setLoadingBalance(true);
        const balance = await WalletService.getBalance(user.uid);
        setCurrentBalance(balance);
      } catch (error) {
        console.error('Error loading balance:', error);
        Alert.alert('Error', 'Failed to load current balance');
      } finally {
        setLoadingBalance(false);
      }
    };

    loadBalance();
  }, [user]);

  // Validate amount
  const validateAmount = () => {
    if (!amount.trim()) {
      setError('Please enter an amount');
      return false;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    
    if (numAmount > currentBalance) {
      setError('Amount exceeds your current balance');
      return false;
    }
    
    setError('');
    return true;
  };

  // Handle withdraw money
  const handleWithdrawMoney = async () => {
    if (!validateAmount() || !user) return;
    
    try {
      setLoading(true);
      const numAmount = parseFloat(amount);
      await WalletService.withdrawBalance(user.uid, numAmount, 'Withdrawn via wallet screen');
      
      Alert.alert(
        'Success',
        `₹${numAmount.toFixed(2)} has been withdrawn from your wallet`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error withdrawing money:', error);
      Alert.alert('Error', error.message || 'Failed to withdraw money');
    } finally {
      setLoading(false);
    }
  };

  // Handle quick amount selection
  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setError('');
  };

  // Handle max amount
  const handleMaxAmount = () => {
    setAmount(currentBalance.toString());
    setError('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Withdraw Money</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.walletIcon}>
              <Ionicons name="cash-outline" size={40} color={colors.primary} />
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Current Balance:</Text>
              {loadingBalance ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.balanceAmount}>₹{currentBalance.toFixed(2)}</Text>
              )}
            </View>
            
            <Text style={styles.label}>Enter Amount to Withdraw</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Input
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                error={error}
                touched={true}
                containerStyle={{ flex: 1 }}
                leftIcon={<Ionicons name="cash-outline" size={20} color={colors.mediumGray} />}
                rightIcon={
                  <TouchableOpacity onPress={handleMaxAmount}>
                    <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium }}>
                      MAX
                    </Text>
                  </TouchableOpacity>
                }
              />
            </View>
            
            <Text style={styles.label}>Quick Select</Text>
            <View style={styles.quickAmountContainer}>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(100)}
                disabled={currentBalance < 100}
              >
                <Text style={styles.quickAmountText}>₹100</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(200)}
                disabled={currentBalance < 200}
              >
                <Text style={styles.quickAmountText}>₹200</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(500)}
                disabled={currentBalance < 500}
              >
                <Text style={styles.quickAmountText}>₹500</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(1000)}
                disabled={currentBalance < 1000}
              >
                <Text style={styles.quickAmountText}>₹1000</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(Math.floor(currentBalance / 2))}
                disabled={currentBalance <= 0}
              >
                <Text style={styles.quickAmountText}>Half</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={handleMaxAmount}
                disabled={currentBalance <= 0}
              >
                <Text style={styles.quickAmountText}>All</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.infoText}>
              Withdraw money from your Ankrishi-Wallet to your bank account. The amount 
              will be transferred within 1-3 business days. A small processing fee may apply.
            </Text>
            
            <Button
              title="Withdraw Money"
              onPress={handleWithdrawMoney}
              loading={loading}
              disabled={loading || loadingBalance || currentBalance <= 0}
              size="large"
              style={styles.buttonContainer}
              leftIcon={<Ionicons name="arrow-down-outline" size={20} color={colors.white} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default WithdrawMoneyScreen;
