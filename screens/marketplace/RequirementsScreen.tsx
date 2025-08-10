import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import database from '@react-native-firebase/database';
import { RequirementType } from '../../models/Requirement';

// Requirement filter types
const requirementFilters = [
  { id: 'all', label: 'All Requirements' },
  { id: 'bid', label: 'Bidding' },
  { id: 'first_come_first_serve', label: 'First Come First Serve' },
];

const RequirementsScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');

  // Load requirements on component mount
  useEffect(() => {
    loadRequirements();
  }, []);

  // Filter requirements when filter changes
  useEffect(() => {
    filterRequirements();
  }, [activeFilter, requirements]);

  // Load requirements from Firebase
  const loadRequirements = async () => {
    try {
      setLoading(true);
      
      // Fetch all requirements
      const snapshot = await database().ref('requirements').once('value');
      const requirementsData = snapshot.val();
      
      if (requirementsData) {
        // Convert object to array
        const requirementsArray = Object.values(requirementsData);
        
        // Sort by createdAt (newest first)
        requirementsArray.sort((a: any, b: any) => b.createdAt - a.createdAt);
        
        setRequirements(requirementsArray);
      } else {
        setRequirements([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading requirements:', error);
      Alert.alert('Error', 'Failed to load requirements. Please try again.');
      setRequirements([]);
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequirements();
    setRefreshing(false);
  };

  // Filter requirements based on active filter
  const filterRequirements = () => {
    if (activeFilter === 'all') {
      setFilteredRequirements(requirements);
    } else {
      const filtered = requirements.filter(
        (req) => req.requirementType === activeFilter
      );
      setFilteredRequirements(filtered);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render a requirement item
  const renderRequirementItem = ({ item }: { item: any }) => {
    return (
      <Card
        style={styles.requirementCard}
        onPress={() => navigation.navigate('RequirementDetails', { requirementId: item.id })}
        elevation="medium"
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <Ionicons
              name={item.requirementType === 'bid' ? 'hammer' : 'flash'}
              size={16}
              color={item.requirementType === 'bid' ? colors.secondary : colors.success}
            />
            <Text style={styles.typeText}>
              {item.requirementType === 'bid' ? 'Bidding' : 'First Come First Serve'}
            </Text>
          </View>

          {item.userVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.white} />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productName}>{item.itemName}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {item.productType.charAt(0).toUpperCase() + item.productType.slice(1)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {item.quantityRequired} {item.quantityUnit}
            </Text>
          </View>
          
          {(item.priceRangeMin || item.priceRangeMax) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price Range:</Text>
              <Text style={styles.detailValue}>
                {item.priceRangeMin ? `₹${item.priceRangeMin}` : ''}
                {item.priceRangeMin && item.priceRangeMax ? ' - ' : ''}
                {item.priceRangeMax ? `₹${item.priceRangeMax}` : ''}
                {' per '}{item.quantityUnit}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery:</Text>
            <Text style={styles.detailValue}>
              {item.deliveryOption === 'pickup' ? 'Pickup' : 'Delivery'}
              {item.preferredDeliveryTimeSlot ? ` (${item.preferredDeliveryTimeSlot})` : ''}
            </Text>
          </View>
          
          <View style={styles.footerRow}>
            <Text style={styles.dateText}>
              Posted: {formatDate(item.createdAt)}
            </Text>
            
            {item.requirementType === 'bid' && item.bidEndDate && (
              <Text style={styles.bidEndText}>
                Bidding ends: {formatDate(item.bidEndDate)}
              </Text>
            )}
          </View>
        </View>
      </Card>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading requirements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Requirements</Text>
        
        <TouchableOpacity
          style={styles.yourRequirementsButton}
          onPress={() => navigation.navigate('YourRequirements')}
        >
          <Ionicons name="list" size={20} color={colors.primary} />
          <Text style={styles.yourRequirementsText}>Your Requirements</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={requirementFilters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.id && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === item.id && styles.activeFilterButtonText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Requirements List */}
      <FlatList
        data={filteredRequirements}
        renderItem={renderRequirementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.requirementsList}
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
            <Ionicons name="document-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Requirements Found</Text>
            <Text style={styles.emptyText}>
              {activeFilter !== 'all'
                ? `No ${activeFilter === 'bid' ? 'bidding' : 'first come first serve'} requirements available.`
                : 'No requirements have been posted yet.'}
            </Text>
          </View>
        }
      />

      {/* Add Requirement Button (for vendors and buyers) */}
      {userProfile?.role === 'vendor' || userProfile?.role === 'buyer' ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddRequirement')}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      ) : null}
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
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  yourRequirementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  yourRequirementsText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
  },
  filterButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  activeFilterButton: {
    backgroundColor: colors.primaryLight,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeFilterButtonText: {
    color: colors.primary,
  },
  requirementsList: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  requirementCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  cardContent: {
    padding: spacing.md,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  bidEndText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
});

export default RequirementsScreen;
