import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import ContractService from '../../services/ContractService';
import { Contract } from '../../models/Contract';
import TabView, { TabItem } from '../../components/TabView';

// Define route params type
type ContractManagementParams = {
  initialTab?: string;
};

const ContractManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, ContractManagementParams>, string>>();
  const { userProfile } = useAuth();

  // Get initial tab from route params or default to 'all'
  const initialTab = route.params?.initialTab || 'all';

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const scrollY = useState(new Animated.Value(0))[0];

  // Load contracts when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userProfile) {
        loadContracts();
      }
      return () => {};
    }, [userProfile])
  );

  // Load contracts
  const loadContracts = async (isRefreshing = false) => {
    if (!userProfile) {
      console.error('User profile not found');
      return;
    }

    try {
      if (!isRefreshing) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch contracts from the service
      const userContracts = await ContractService.getUserContracts(userProfile.uid);
      setContracts(userContracts);

      if (!isRefreshing) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      if (!isRefreshing) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
      Alert.alert('Error', 'Failed to load contracts. Please try again.');
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    loadContracts(true);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get filtered contracts
  const getFilteredContracts = () => {
    if (activeTab === 'all') {
      return contracts;
    } else if (activeTab === 'tenders') {
      // Show all tenders regardless of status
      return contracts.filter(contract => contract.isTender);
    } else if (activeTab === 'farming') {
      // Show all farming contracts
      return contracts.filter(contract => contract.type === 'farming');
    } else {
      return contracts.filter(contract => contract.status === activeTab);
    }
  };

  // Configure tabs without badge counts for a cleaner interface
  const tabs = useMemo<TabItem[]>(() => {
    return [
      {
        key: 'all',
        title: 'All Contracts',
      },
      {
        key: 'active',
        title: 'Active',
      },
      {
        key: 'tenders',
        title: 'Tenders',
        icon: 'megaphone',
      },
      {
        key: 'farming',
        title: 'Farming',
        icon: 'leaf',
      }
    ];
  }, [contracts]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'terminated':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  // Get contract type icon
  const getContractTypeIcon = (type: string) => {
    switch (type) {
      case 'supply':
        return 'cart';
      case 'purchase':
        return 'basket';
      case 'rental':
        return 'construct';
      case 'service':
        return 'briefcase';
      case 'farming':
        return 'leaf';
      default:
        return 'document-text';
    }
  };

  // Render a contract item - simplified for better readability
  const renderContractItem = ({ item }: { item: Contract }) => {
    // Determine if the current user is the first or second party
    const isFirstParty = userProfile && item.parties.firstPartyId === userProfile.uid;
    const isSecondParty = userProfile && item.parties.secondPartyId === userProfile.uid;

    // Format party names
    const firstPartyName = isFirstParty
      ? `${item.parties.firstPartyUsername} (You)`
      : item.parties.firstPartyUsername;

    const secondPartyName = item.parties.secondPartyUsername
      ? (isSecondParty
          ? `${item.parties.secondPartyUsername} (You)`
          : item.parties.secondPartyUsername)
      : item.isTender
          ? 'Open for Bids'
          : 'Not Specified';

    // Create a single badges array to display all relevant badges
    const badges = [];

    if (item.isTender) {
      badges.push({
        icon: 'megaphone',
        text: 'Tender',
        color: colors.accent
      });
    }

    if (item.type === 'farming') {
      badges.push({
        icon: 'leaf',
        text: 'Farming',
        color: colors.primary
      });
    }

    if (item.structuredBidding?.isEnabled) {
      badges.push({
        icon: 'list',
        text: 'Structured Bidding',
        color: colors.secondary
      });
    }

    return (
      <Card style={styles.contractCard}>
        {/* Contract Header with Title and Status */}
        <View style={styles.contractHeader}>
          <View style={styles.contractTitleContainer}>
            <Ionicons
              name={getContractTypeIcon(item.type) as any}
              size={20}
              color={colors.primary}
              style={styles.contractTypeIcon}
            />
            <Text style={styles.contractTitle}>{item.title}</Text>
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

        {/* Badges Section - consolidated in one place */}
        {badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {badges.map((badge, index) => (
              <View
                key={index}
                style={[styles.badge, { backgroundColor: badge.color }]}
              >
                <Ionicons name={badge.icon} size={14} color={colors.white} />
                <Text style={styles.badgeText}>{badge.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Essential Contract Details */}
        <View style={styles.contractDetails}>
          <View style={styles.contractDetailRow}>
            <Text style={styles.contractDetailLabel}>Parties:</Text>
            <View style={styles.contractDetailValue}>
              <View style={styles.partyRow}>
                <Text style={styles.contractParty}>{firstPartyName}</Text>
                {item.parties.firstPartyVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                  </View>
                )}
              </View>
              <View style={styles.partyRow}>
                <Text style={styles.contractParty}>{secondPartyName}</Text>
                {item.parties.secondPartyVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.contractDetailRow}>
            <Text style={styles.contractDetailLabel}>Period:</Text>
            <Text style={styles.contractDetailValue}>
              {formatDate(new Date(item.startDate))} - {formatDate(new Date(item.endDate))}
            </Text>
          </View>

          <View style={styles.contractDetailRow}>
            <Text style={styles.contractDetailLabel}>Value:</Text>
            <Text style={styles.contractDetailValue}>
              {formatCurrency(item.value)}
            </Text>
          </View>
        </View>

        {/* Contract Actions */}
        <View style={styles.contractActions}>
          <Button
            title="View Details"
            variant="solid"
            size="small"
            onPress={() => {
              // @ts-ignore - Ignore the type error for navigation
              navigation.navigate('ContractDetails', { contractId: item.id });
            }}
            style={styles.contractActionButton}
          />

          {item.documents && item.documents.length > 0 && (
            <Button
              title="Documents"
              variant="outline"
              size="small"
              icon="document-text-outline"
              onPress={() => {
                // @ts-ignore - Ignore the type error for navigation
                navigation.navigate('DocumentViewer', { documentIds: item.documents });
              }}
              style={styles.contractActionButton}
            />
          )}
        </View>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote type="general" loadingText="Loading contracts..." />
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

        <Text style={styles.title}>Contract Management</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // @ts-ignore - Ignore the type error for navigation
            navigation.navigate('AddContract');
          }}
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <TabView
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        style={styles.tabsContainer}
        scrollable={false}
        equalWidth={true}
        showBadges={false}
      />

      {getFilteredContracts().length > 0 ? (
        <Animated.FlatList
          data={getFilteredContracts()}
          renderItem={renderContractItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contractsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary, colors.secondary]}
              tintColor={colors.primary}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary, colors.secondary]}
              tintColor={colors.primary}
            />
          }
        >
          <Ionicons name="document-text-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No Contracts Found</Text>
          <Text style={styles.emptyText}>
            You don't have any contracts in this category.
          </Text>

          <Button
            title="Add New Contract"
            onPress={() => {
              // @ts-ignore - Ignore the type error for navigation
              navigation.navigate('AddContract');
            }}
            style={styles.emptyButton}
          />
        </ScrollView>
      )}
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    zIndex: 10,
    marginBottom: spacing.sm,
  },
  contractsList: {
    padding: spacing.md,
  },
  contractCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    padding: spacing.sm, // Add padding to the card for better spacing
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  contractTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contractTypeIcon: {
    marginRight: spacing.xs,
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
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  contractDetails: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  contractDetailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  contractDetailLabel: {
    width: 80,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  contractDetailValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  contractParty: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  contractActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  contractActionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
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
});

export default ContractManagementScreen;
