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

// Requirement filter types
const requirementFilters = [
  { id: 'posted', label: 'Posted by You' },
  { id: 'applied', label: 'Applied by You' },
];

const YourRequirementsScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postedRequirements, setPostedRequirements] = useState<any[]>([]);
  const [appliedRequirements, setAppliedRequirements] = useState<any[]>([]);
  const [displayedRequirements, setDisplayedRequirements] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('posted');

  // Load requirements on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadRequirements();
    }
  }, [userProfile?.uid]);

  // Filter requirements when filter changes
  useEffect(() => {
    if (activeFilter === 'posted') {
      setDisplayedRequirements(postedRequirements);
    } else {
      setDisplayedRequirements(appliedRequirements);
    }
  }, [activeFilter, postedRequirements, appliedRequirements]);

  // Load requirements from Firebase
  const loadRequirements = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setLoading(true);
      
      // Fetch requirements posted by the user
      const postedSnapshot = await database()
        .ref('requirements')
        .orderByChild('userId')
        .equalTo(userProfile.uid)
        .once('value');
      
      const postedData = postedSnapshot.val();
      let postedArray: any[] = [];
      
      if (postedData) {
        postedArray = Object.values(postedData);
        postedArray.sort((a: any, b: any) => b.createdAt - a.createdAt);
      }
      
      setPostedRequirements(postedArray);
      
      // Fetch requirements where the user has applied/responded
      // This is more complex and would require a different query structure
      // For now, we'll fetch all requirements and filter client-side
      const allRequirementsSnapshot = await database()
        .ref('requirements')
        .once('value');
      
      const allRequirements = allRequirementsSnapshot.val();
      let appliedArray: any[] = [];
      
      if (allRequirements) {
        // Filter requirements where user has responded
        Object.values(allRequirements).forEach((req: any) => {
          if (req.responses) {
            const userResponses = Object.values(req.responses).filter(
              (response: any) => response.farmerId === userProfile.uid
            );
            
            if (userResponses.length > 0) {
              appliedArray.push({
                ...req,
                userResponse: userResponses[0],
              });
            }
          }
        });
        
        appliedArray.sort((a: any, b: any) => b.createdAt - a.createdAt);
      }
      
      setAppliedRequirements(appliedArray);
      
      // Set displayed requirements based on active filter
      if (activeFilter === 'posted') {
        setDisplayedRequirements(postedArray);
      } else {
        setDisplayedRequirements(appliedArray);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading requirements:', error);
      Alert.alert('Error', 'Failed to load your requirements. Please try again.');
      setPostedRequirements([]);
      setAppliedRequirements([]);
      setDisplayedRequirements([]);
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequirements();
    setRefreshing(false);
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
    const isPosted = activeFilter === 'posted';
    const screenToNavigate = isPosted ? 'RequirementManagement' : 'RequirementDetails';
    
    return (
      <Card
        style={styles.requirementCard}
        onPress={() => navigation.navigate(screenToNavigate, { requirementId: item.id })}
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

          {isPosted ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          ) : (
            <View style={[
              styles.responseBadge,
              { backgroundColor: getResponseStatusColor(item.userResponse?.status) }
            ]}>
              <Text style={styles.responseText}>
                {formatResponseStatus(item.userResponse?.status)}
              </Text>
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
          
          {!isPosted && item.userResponse && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Your Offer:</Text>
              <Text style={styles.detailValue}>
                ₹{item.userResponse.offeredPrice} per {item.quantityUnit}
              </Text>
            </View>
          )}
          
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

  // Get color for response status
  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'pending':
      default:
        return colors.warning;
    }
  };

  // Format response status
  const formatResponseStatus = (status: string) => {
    if (!status) return 'UNKNOWN';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your requirements...</Text>
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
        <Text style={styles.title}>Your Requirements</Text>
        <View style={styles.placeholder} />
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
        data={displayedRequirements}
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
              {activeFilter === 'posted'
                ? 'You have not posted any requirements yet.'
                : 'You have not applied to any requirements yet.'}
            </Text>
            
            {activeFilter === 'posted' && (
              <TouchableOpacity
                style={styles.addRequirementButton}
                onPress={() => navigation.navigate('AddRequirement')}
              >
                <Text style={styles.addRequirementButtonText}>Post a Requirement</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Add Requirement Button (only when viewing posted requirements) */}
      {activeFilter === 'posted' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddRequirement')}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
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
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
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
  statusBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  responseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  responseText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
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
    marginBottom: spacing.md,
  },
  addRequirementButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  addRequirementButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
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

export default YourRequirementsScreen;
