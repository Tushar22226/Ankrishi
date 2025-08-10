import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import ContractService from '../../../services/ContractService';

// Define payment status type
type PaymentStatus = 'pending' | 'partial' | 'completed' | 'overdue';

// Define payment interface
interface Payment {
  id: string;
  date: number;
  amount: number;
  status: PaymentStatus;
  method: string;
  reference?: string;
  notes?: string;
}

interface PaymentsManagementProps {
  contractId: string;
  contractValue: number;
}

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

const PaymentsManagement: React.FC<PaymentsManagementProps> = ({ contractId, contractValue }) => {
  // State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Load payments on component mount
  useEffect(() => {
    loadPayments();
  }, [contractId]);

  // Load payments
  const loadPayments = async () => {
    try {
      setLoading(true);

      // Fetch payments from Firebase using ContractService
      const fetchedPayments = await ContractService.getPayments(contractId);

      // Convert to our Payment type
      const typedPayments: Payment[] = fetchedPayments.map(payment => ({
        id: payment.id,
        date: payment.date,
        amount: payment.amount,
        status: payment.status as PaymentStatus || 'completed',
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
      }));

      setPayments(typedPayments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading payments:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load payments');
    }
  };

  // Add a new payment
  const handleAddPayment = async () => {
    try {
      // Validate inputs
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      // Create payment data
      const paymentData = {
        date: paymentDate.getTime(),
        amount: Number(amount),
        method,
        reference: reference || undefined,
        notes: notes || undefined,
      };

      // Save to Firebase using ContractService
      await ContractService.addPayment(contractId, paymentData);

      // Reload payments to get the updated list
      await loadPayments();

      // Reset form
      resetForm();

      // Close modal
      setShowAddModal(false);

      Alert.alert('Success', 'Payment added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  // Reset form
  const resetForm = () => {
    setPaymentDate(new Date());
    setAmount('');
    setMethod('bank_transfer');
    setReference('');
    setNotes('');
  };

  // Calculate total paid amount
  const calculateTotalPaid = (): number => {
    return payments.reduce((total, payment) => {
      if (payment.status === 'completed' || payment.status === 'partial') {
        return total + payment.amount;
      }
      return total;
    }, 0);
  };

  // Calculate remaining amount
  const calculateRemainingAmount = (): number => {
    const totalPaid = calculateTotalPaid();
    return contractValue - totalPaid;
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'upi':
        return 'UPI';
      case 'check':
        return 'Check';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  // Get status color
  const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'partial':
        return colors.accent;
      case 'completed':
        return colors.success;
      case 'overdue':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  // Render payment item
  const renderPaymentItem = ({ item }: { item: Payment }) => {
    return (
      <Card style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentDateContainer}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.paymentDate}>{formatDate(new Date(item.date))}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>Amount:</Text>
            <Text style={styles.paymentDetailValue}>{formatCurrency(item.amount)}</Text>
          </View>

          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>Method:</Text>
            <Text style={styles.paymentDetailValue}>{getPaymentMethodLabel(item.method)}</Text>
          </View>

          {item.reference && (
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Reference:</Text>
              <Text style={styles.paymentDetailValue}>{item.reference}</Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.paymentNotes}>
              <Text style={styles.paymentNotesLabel}>Notes:</Text>
              <Text style={styles.paymentNotesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.paymentActions}>
          <Button
            title="Generate Receipt"
            onPress={() => Alert.alert('Receipt', 'Receipt generation will be implemented in the future.')}
            size="small"
            variant="outline"
            style={styles.paymentActionButton}
          />
        </View>
      </Card>
    );
  };

  const totalPaid = calculateTotalPaid();
  const remainingAmount = calculateRemainingAmount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Button
          title="Add Payment"
          onPress={() => setShowAddModal(true)}
          size="small"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <>
          {/* Payment Summary */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Contract Value:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(contractValue)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Paid:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining:</Text>
              <Text style={[
                styles.summaryValue,
                remainingAmount > 0 ? styles.remainingPositive : styles.remainingZero,
              ]}>
                {formatCurrency(remainingAmount)}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (totalPaid / contractValue) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((totalPaid / contractValue) * 100)}% Paid
              </Text>
            </View>
          </Card>

          {/* Payments List or Empty State */}
          {payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color={colors.lightGray} />
              <Text style={styles.emptyTitle}>No Payments</Text>
              <Text style={styles.emptyText}>
                No payments have been recorded for this contract yet.
              </Text>
              <Button
                title="Record Payment"
                onPress={() => setShowAddModal(true)}
                style={styles.emptyButton}
              />
            </View>
          ) : (
            <View style={{flex: 1, paddingBottom: spacing.xl}}>
              {payments.map(item => (
                <React.Fragment key={item.id}>
                  {renderPaymentItem({item})}
                </React.Fragment>
              ))}
            </View>
          )}
        </>
      )}

      {/* Add Payment Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {formatDate(paymentDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setPaymentDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount</Text>
              <TextInput
                style={styles.formInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Method</Text>
              <View style={styles.methodButtons}>
                {['cash', 'bank_transfer', 'upi', 'check'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.methodButton,
                      method === m && styles.methodButtonActive,
                    ]}
                    onPress={() => setMethod(m)}
                  >
                    <Text
                      style={[
                        styles.methodButtonText,
                        method === m && styles.methodButtonTextActive,
                      ]}
                    >
                      {getPaymentMethodLabel(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reference (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={reference}
                onChangeText={setReference}
                placeholder="Enter reference number"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter notes"
                multiline
              />
            </View>

            <Button
              title="Add Payment"
              onPress={handleAddPayment}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  summaryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  remainingPositive: {
    color: colors.warning,
  },
  remainingZero: {
    color: colors.success,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'right',
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
    marginBottom: spacing.xl,
  },
  emptyButton: {
    width: '80%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  paymentsList: {
    paddingBottom: spacing.xl,
  },
  paymentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  paymentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  paymentDetails: {
    marginBottom: spacing.md,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  paymentDetailLabel: {
    width: 100,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  paymentDetailValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  paymentNotes: {
    marginTop: spacing.sm,
  },
  paymentNotesLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  paymentNotesText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  paymentActionButton: {
    minWidth: 150,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  datePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  methodButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  methodButtonTextActive: {
    color: colors.white,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default PaymentsManagement;
