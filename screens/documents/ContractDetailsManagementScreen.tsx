import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Contract } from '../../models/Contract';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import ContractService from '../../services/ContractService';
import LoadingQuote from '../../components/LoadingQuote';
import ContractOverview from './components/ContractOverview';
import DeliveriesManagement from './components/DeliveriesManagement';
import PaymentsManagement from './components/PaymentsManagement';

// Define route params type
type ParamList = {
  ContractDetailsManagement: {
    contractId: string;
  };
};

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

const ContractDetailsManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'ContractDetailsManagement'>>();
  const { userProfile } = useAuth();
  const { contractId } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'payments'>('overview');

  // Load contract on component mount
  useEffect(() => {
    loadContract();
  }, [contractId]);

  // Load contract
  const loadContract = async () => {
    try {
      setLoading(true);

      console.log('Loading contract with ID:', contractId);
      const contractData = await ContractService.getContractById(contractId);

      if (contractData) {
        console.log('Contract loaded successfully:', contractData);
        setContract(contractData);
      } else {
        console.error('Contract not found with ID:', contractId);
        Alert.alert('Error', 'Contract not found');
        navigation.goBack();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading contract:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load contract: ' + (error as Error).message);
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'cancelled':
      case 'terminated':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  // Update contract status
  const handleUpdateContractStatus = async (newStatus: 'active' | 'completed' | 'cancelled') => {
    if (!contract) return;

    try {
      // Confirm with user
      Alert.alert(
        'Update Contract Status',
        `Are you sure you want to change the contract status to ${newStatus}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Update',
            onPress: async () => {
              // Update contract status
              await ContractService.updateContract(contract.id, {
                status: newStatus,
              });

              // Reload contract
              loadContract();

              Alert.alert('Success', `Contract status updated to ${newStatus}`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating contract status:', error);
      Alert.alert('Error', 'Failed to update contract status');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote
          loadingText="Loading contract details..."
          showIndicator={true}
          indicatorSize="large"
          indicatorColor={colors.primary}
        />
      </View>
    );
  }

  // Render error state if contract not found
  if (!contract) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Contract Not Found</Text>
        <Text style={styles.errorText}>The contract you're looking for could not be found.</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
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
        <Text style={styles.title}>Contract Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contract Header */}
      <View style={styles.contractHeader}>
        <View style={styles.contractTitleContainer}>
          <Text style={styles.contractTitle}>{contract.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(contract.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.contractSubtitle}>
          {contract.type.charAt(0).toUpperCase() + contract.type.slice(1)} Contract
        </Text>
      </View>

      {/* Simplified Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === 'overview' ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'overview' && styles.activeTabButtonText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'deliveries' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('deliveries')}
        >
          <Ionicons
            name="cube-outline"
            size={18}
            color={activeTab === 'deliveries' ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'deliveries' && styles.activeTabButtonText,
            ]}
          >
            Deliveries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'payments' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('payments')}
        >
          <Ionicons
            name="cash-outline"
            size={18}
            color={activeTab === 'payments' ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'payments' && styles.activeTabButtonText,
            ]}
          >
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'overview' && (
          <ContractOverview
            contract={contract}
            onUpdateStatus={handleUpdateContractStatus}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveriesManagement
            contractId={contract.id}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsManagement
            contractId={contract.id}
            contractValue={contract.value}
          />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorButton: {
    width: '80%',
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  contractHeader: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    marginBottom: spacing.sm,
  },
  contractTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  contractTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  contractSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  tabButton: {
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    flex: 1,
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  tabIcon: {
    marginBottom: spacing.xs,
  },
  tabButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primary,
  },
  contentContainer: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});

export default ContractDetailsManagementScreen;
