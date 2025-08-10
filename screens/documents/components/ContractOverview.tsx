import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import { Contract } from '../../../models/Contract';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import ContractPDFService from '../../../services/ContractPDFService';

interface ContractOverviewProps {
  contract: Contract;
  onUpdateStatus: (status: 'active' | 'completed' | 'cancelled') => void;
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

const ContractOverview: React.FC<ContractOverviewProps> = ({ contract, onUpdateStatus }) => {
  // State for PDF generation
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Calculate contract progress
  const calculateProgress = (): number => {
    // If contract is completed, return 100%
    if (contract.status === 'completed') return 100;
    // If contract is cancelled, return progress at time of cancellation
    if (contract.status === 'cancelled') {
      // If we have a cancellation date, use that, otherwise use current date
      const now = contract.cancelledAt ? contract.cancelledAt : Date.now();
      const start = contract.startDate;
      const end = contract.endDate;

      if (now <= start) return 0;
      if (now >= end) return 100;

      const total = end - start;
      const elapsed = now - start;
      return Math.round((elapsed / total) * 100);
    }

    // For active contracts, calculate based on current date
    const now = Date.now();
    const start = contract.startDate;
    const end = contract.endDate;

    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  // Calculate days remaining
  const calculateDaysRemaining = (): number => {
    const now = Date.now();
    const end = contract.endDate;

    if (now >= end) return 0;

    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  // Get navigation
  const navigation = useNavigation();

  // Handle chat with other party
  const handleChatWithParty = () => {
    if (!contract.chatId) {
      Alert.alert('Chat Unavailable', 'No chat has been created for this contract yet.');
      return;
    }

    // Navigate to chat screen
    // @ts-ignore - Navigation types are complex
    navigation.navigate('ChatScreen', {
      chatId: contract.chatId,
      recipientId: contract.parties.secondPartyId,
      recipientName: contract.parties.secondPartyUsername,
      recipientPhoto: '',
      isGroup: false,
    });
  };

  // Modern Android permission handling
  const requestModernStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need runtime permission for this
    }

    try {
      // For Android 13+ (API level 33+), we don't need to request storage permissions
      // for PDF generation as the files are created in the app-specific directory
      // and shared via content:// URIs
      console.log('Using modern Android storage approach - no explicit permission needed');
      return true;
    } catch (error) {
      console.error('Error with storage permission check:', error);
      return true; // Proceed anyway as modern Android doesn't require explicit permission
    }
  };

  // Handle PDF generation
  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);

      // Check modern storage approach (no explicit permission needed for Android 13+)
      await requestModernStoragePermission();

      // Generate and share the PDF
      await ContractPDFService.generateContractPDF(contract);

      // No need for an alert as the Share dialog will appear
      console.log('PDF generation and sharing process completed');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        'PDF Generation Failed',
        'There was an error generating the contract PDF. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const progress = calculateProgress();
  const daysRemaining = calculateDaysRemaining();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Contract Summary */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Summary</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contract ID:</Text>
          <Text style={styles.detailValue}>{contract.id}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{contract.type.charAt(0).toUpperCase() + contract.type.slice(1)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Period:</Text>
          <Text style={styles.detailValue}>
            {formatDate(new Date(contract.startDate))} - {formatDate(new Date(contract.endDate))}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Value:</Text>
          <Text style={styles.detailValue}>{formatCurrency(contract.value)}</Text>
        </View>

        {contract.quantity && contract.unit && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{contract.quantity} {contract.unit}</Text>
          </View>
        )}

        {contract.pricePerUnit && contract.unit && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price Per Unit:</Text>
            <Text style={styles.detailValue}>{formatCurrency(contract.pricePerUnit)} per {contract.unit}</Text>
          </View>
        )}
      </Card>

      {/* Contract Progress */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Progress</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
                contract.status === 'completed' ? styles.progressCompleted : null,
                contract.status === 'cancelled' ? styles.progressCancelled : null,
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
        </View>

        <View style={styles.progressDetails}>
          <View style={styles.progressDetailItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.progressDetailText}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </Text>
          </View>

          <View style={styles.progressDetailItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.progressDetailText}>
              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)} status
            </Text>
          </View>
        </View>
      </Card>

      {/* Parties Information */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Parties</Text>

        <View style={styles.partyContainer}>
          <View style={styles.partyIcon}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
          <View style={styles.partyDetails}>
            <Text style={styles.partyName}>{contract.parties.firstPartyUsername}</Text>
            <Text style={styles.partyRole}>Creator ({contract.creatorRole})</Text>
          </View>
        </View>

        <View style={styles.partySeparator} />

        <View style={styles.partyContainer}>
          <View style={[styles.partyIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
          <View style={styles.partyDetails}>
            <Text style={styles.partyName}>{contract.parties.secondPartyUsername || 'Not Assigned'}</Text>
            <Text style={styles.partyRole}>Second Party</Text>
          </View>
        </View>

        {contract.chatId && (
          <Button
            title="Chat with Other Party"
            onPress={handleChatWithParty}
            icon="chatbubble-ellipses-outline"
            style={styles.chatButton}
          />
        )}
      </Card>

      {/* Actions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Actions</Text>

        <View style={styles.actionsContainer}>
          {contract.status === 'active' && (
            <>
              <Button
                title="Mark as Completed"
                onPress={() => onUpdateStatus('completed')}
                style={styles.actionButton}
                variant="outline"
              />

              <Button
                title="Cancel Contract"
                onPress={() => onUpdateStatus('cancelled')}
                style={[styles.actionButton, styles.cancelButton]}
                variant="outline"
              />
            </>
          )}

          {contract.status === 'completed' && (
            <Button
              title="Reactivate Contract"
              onPress={() => onUpdateStatus('active')}
              style={styles.actionButton}
              variant="outline"
            />
          )}

          {contract.status === 'cancelled' && (
            <Button
              title="Reactivate Contract"
              onPress={() => onUpdateStatus('active')}
              style={styles.actionButton}
              variant="outline"
            />
          )}

          {/* PDF Share Button */}
          <Button
            title={generatingPdf ? "Generating PDF..." : "Share as PDF"}
            onPress={handleGeneratePdf}
            disabled={generatingPdf}
            icon="share-outline"
            style={styles.pdfButton}
            variant="outline"
            leftIcon={
              generatingPdf ?
                <ActivityIndicator size="small" color={colors.primary} /> :
                <Ionicons name="share-outline" size={20} color={colors.primary} />
            }
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    width: 120,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 12,
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
  progressCompleted: {
    backgroundColor: colors.primary,
  },
  progressCancelled: {
    backgroundColor: colors.error,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDetailText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  partyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  partyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  partyDetails: {
    flex: 1,
  },
  partyName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  partyRole: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  partySeparator: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  chatButton: {
    marginTop: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  cancelButton: {
    borderColor: colors.error,
  },
  pdfButton: {
    marginTop: spacing.md,
    borderColor: colors.primary,
    width: '100%',
  },
});

export default ContractOverview;
