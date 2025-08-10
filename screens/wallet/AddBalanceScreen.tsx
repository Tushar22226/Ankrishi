import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

const AddBalanceScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
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
    
    if (numAmount > 10000) {
      setError('Maximum amount is ₹10,000');
      return false;
    }
    
    setError('');
    return true;
  };

  // Handle add balance
  const handleAddBalance = async () => {
    if (!validateAmount() || !user) return;
    
    try {
      setLoading(true);
      const numAmount = parseFloat(amount);
      await WalletService.addBalance(user.uid, numAmount, 'Added via wallet screen');
      
      Alert.alert(
        'Success',
        `₹${numAmount.toFixed(2)} has been added to your wallet`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error adding balance:', error);
      Alert.alert('Error', error.message || 'Failed to add balance');
    } finally {
      setLoading(false);
    }
  };

  // Handle quick amount selection
  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
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
        <Text style={styles.title}>Add Balance</Text>
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
              <Ionicons name="wallet-outline" size={40} color={colors.primary} />
            </View>
            
            <Text style={styles.label}>Enter Amount</Text>
            
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
              />
            </View>
            
            <Text style={styles.label}>Quick Select</Text>
            <View style={styles.quickAmountContainer}>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(100)}
              >
                <Text style={styles.quickAmountText}>₹100</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(200)}
              >
                <Text style={styles.quickAmountText}>₹200</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(500)}
              >
                <Text style={styles.quickAmountText}>₹500</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(1000)}
              >
                <Text style={styles.quickAmountText}>₹1000</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(2000)}
              >
                <Text style={styles.quickAmountText}>₹2000</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(5000)}
              >
                <Text style={styles.quickAmountText}>₹5000</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.infoText}>
              Add money to your Ankrishi-Wallet to make quick payments for products, 
              services, and other features within the app. The maximum amount you can 
              add at once is ₹10,000.
            </Text>
            
            <Button
              title="Add Balance"
              onPress={handleAddBalance}
              loading={loading}
              disabled={loading}
              size="large"
              style={styles.buttonContainer}
              leftIcon={<Ionicons name="add-circle-outline" size={20} color={colors.white} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddBalanceScreen;
