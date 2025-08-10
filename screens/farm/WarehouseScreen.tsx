import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Mock warehouse data
const mockWarehouseData = {
  id: 'warehouse1',
  name: 'Main Storage Facility',
  location: {
    address: 'Pune, Maharashtra',
    coordinates: {
      latitude: 18.5204,
      longitude: 73.8567,
    },
  },
  capacity: {
    total: 1000, // in quintals
    used: 650, // in quintals
    available: 350, // in quintals
  },
  storageConditions: {
    temperature: {
      current: 18, // in Celsius
      optimal: 15, // in Celsius
      status: 'good', // good, warning, critical
    },
    humidity: {
      current: 55, // in percentage
      optimal: 50, // in percentage
      status: 'good', // good, warning, critical
    },
    ventilation: 'Adequate',
    pestControl: 'Regular fumigation',
    lastInspection: new Date(Date.now() - 86400000 * 15), // 15 days ago
  },
  inventory: [
    {
      id: 'item1',
      name: 'Wheat',
      variety: 'HD-2967',
      quantity: 300, // in quintals
      harvestDate: new Date(Date.now() - 86400000 * 60), // 60 days ago
      expiryDate: new Date(Date.now() + 86400000 * 120), // 120 days from now
      quality: 'A',
      image: 'https://via.placeholder.com/100x100?text=Wheat',
      status: 'stored',
    },
    {
      id: 'item2',
      name: 'Rice',
      variety: 'Basmati',
      quantity: 200, // in quintals
      harvestDate: new Date(Date.now() - 86400000 * 90), // 90 days ago
      expiryDate: new Date(Date.now() + 86400000 * 90), // 90 days from now
      quality: 'A+',
      image: 'https://via.placeholder.com/100x100?text=Rice',
      status: 'stored',
    },
    {
      id: 'item3',
      name: 'Soybeans',
      variety: 'JS-335',
      quantity: 150, // in quintals
      harvestDate: new Date(Date.now() - 86400000 * 45), // 45 days ago
      expiryDate: new Date(Date.now() + 86400000 * 150), // 150 days from now
      quality: 'B+',
      image: 'https://via.placeholder.com/100x100?text=Soybeans',
      status: 'stored',
    },
  ],
  recentActivities: [
    {
      id: 'activity1',
      type: 'deposit',
      item: 'Wheat',
      quantity: 50, // in quintals
      date: new Date(Date.now() - 86400000 * 5), // 5 days ago
      performedBy: 'Rajesh Kumar',
    },
    {
      id: 'activity2',
      type: 'withdrawal',
      item: 'Rice',
      quantity: 20, // in quintals
      date: new Date(Date.now() - 86400000 * 10), // 10 days ago
      performedBy: 'Sunil Sharma',
    },
    {
      id: 'activity3',
      type: 'inspection',
      item: 'All',
      date: new Date(Date.now() - 86400000 * 15), // 15 days ago
      performedBy: 'Priya Patel',
      notes: 'Regular monthly inspection. All conditions normal.',
    },
  ],
};

const WarehouseScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [warehouseData, setWarehouseData] = useState<any>(null);

  // Load warehouse data on component mount
  useEffect(() => {
    loadWarehouseData();
  }, []);

  // Load warehouse data
  const loadWarehouseData = async () => {
    try {
      setLoading(true);

      // In a real app, we would fetch data from a service
      // For now, let's use mock data
      setTimeout(() => {
        setWarehouseData(mockWarehouseData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading warehouse data:', error);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'critical':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'arrow-down-circle';
      case 'withdrawal':
        return 'arrow-up-circle';
      case 'inspection':
        return 'search';
      default:
        return 'ellipsis-horizontal-circle';
    }
  };

  // Get activity color
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return colors.success;
      case 'withdrawal':
        return colors.primary;
      case 'inspection':
        return colors.info;
      default:
        return colors.mediumGray;
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote type="farm" />
      </View>
    );
  }

  // Calculate capacity percentage
  const capacityPercentage = (warehouseData.capacity.used / warehouseData.capacity.total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Warehouse Management</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadWarehouseData}
        >
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Warehouse Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.warehouseHeader}>
            <View>
              <Text style={styles.warehouseName}>{warehouseData.name}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.locationText}>{warehouseData.location.address}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                // In a real app, navigate to edit warehouse screen
                alert('Edit Warehouse functionality would go here');
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.capacityContainer}>
            <Text style={styles.sectionSubtitle}>Storage Capacity</Text>

            <View style={styles.capacityBarContainer}>
              <View style={styles.capacityBar}>
                <View
                  style={[
                    styles.capacityFill,
                    {
                      width: `${capacityPercentage}%`,
                      backgroundColor: capacityPercentage > 90
                        ? colors.error
                        : capacityPercentage > 70
                          ? colors.warning
                          : colors.success
                    }
                  ]}
                />
              </View>
              <Text style={styles.capacityText}>
                {warehouseData.capacity.used} / {warehouseData.capacity.total} quintals ({capacityPercentage.toFixed(1)}% used)
              </Text>
            </View>

            <View style={styles.capacityDetails}>
              <View style={styles.capacityDetail}>
                <Text style={styles.capacityDetailLabel}>Total</Text>
                <Text style={styles.capacityDetailValue}>{warehouseData.capacity.total} quintals</Text>
              </View>

              <View style={styles.capacityDetail}>
                <Text style={styles.capacityDetailLabel}>Used</Text>
                <Text style={styles.capacityDetailValue}>{warehouseData.capacity.used} quintals</Text>
              </View>

              <View style={styles.capacityDetail}>
                <Text style={styles.capacityDetailLabel}>Available</Text>
                <Text style={styles.capacityDetailValue}>{warehouseData.capacity.available} quintals</Text>
              </View>
            </View>
          </View>

          <View style={styles.conditionsContainer}>
            <Text style={styles.sectionSubtitle}>Storage Conditions</Text>

            <View style={styles.conditionsGrid}>
              <View style={styles.conditionItem}>
                <View style={styles.conditionHeader}>
                  <Ionicons name="thermometer" size={20} color={colors.primary} />
                  <Text style={styles.conditionTitle}>Temperature</Text>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(warehouseData.storageConditions.temperature.status) }
                    ]}
                  />
                </View>
                <Text style={styles.conditionValue}>
                  {warehouseData.storageConditions.temperature.current}°C
                </Text>
                <Text style={styles.conditionOptimal}>
                  Optimal: {warehouseData.storageConditions.temperature.optimal}°C
                </Text>
              </View>

              <View style={styles.conditionItem}>
                <View style={styles.conditionHeader}>
                  <Ionicons name="water" size={20} color={colors.primary} />
                  <Text style={styles.conditionTitle}>Humidity</Text>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(warehouseData.storageConditions.humidity.status) }
                    ]}
                  />
                </View>
                <Text style={styles.conditionValue}>
                  {warehouseData.storageConditions.humidity.current}%
                </Text>
                <Text style={styles.conditionOptimal}>
                  Optimal: {warehouseData.storageConditions.humidity.optimal}%
                </Text>
              </View>

              <View style={styles.conditionItem}>
                <View style={styles.conditionHeader}>
                  <Ionicons name="leaf" size={20} color={colors.primary} />
                  <Text style={styles.conditionTitle}>Ventilation</Text>
                </View>
                <Text style={styles.conditionValue}>
                  {warehouseData.storageConditions.ventilation}
                </Text>
              </View>

              <View style={styles.conditionItem}>
                <View style={styles.conditionHeader}>
                  <Ionicons name="shield" size={20} color={colors.primary} />
                  <Text style={styles.conditionTitle}>Pest Control</Text>
                </View>
                <Text style={styles.conditionValue}>
                  {warehouseData.storageConditions.pestControl}
                </Text>
              </View>
            </View>

            <Text style={styles.lastInspection}>
              Last Inspection: {formatDate(warehouseData.storageConditions.lastInspection)}
            </Text>
          </View>
        </Card>

        {/* Inventory */}
        <Card style={styles.inventoryCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <TouchableOpacity
              onPress={() => {
                // In a real app, navigate to full inventory screen
                alert('View All Inventory functionality would go here');
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {warehouseData.inventory.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.inventoryItem}
              onPress={() => {
                // In a real app, navigate to inventory item details
                alert(`View details for ${item.name}`);
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.inventoryImage}
                resizeMode="cover"
              />

              <View style={styles.inventoryInfo}>
                <Text style={styles.inventoryName}>{item.name} ({item.variety})</Text>
                <Text style={styles.inventoryQuantity}>{item.quantity} quintals</Text>
                <View style={styles.inventoryMeta}>
                  <Text style={styles.inventoryMetaText}>
                    Harvest: {formatDate(item.harvestDate)}
                  </Text>
                  <Text style={styles.inventoryMetaText}>
                    Expiry: {formatDate(item.expiryDate)}
                  </Text>
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityText}>Quality: {item.quality}</Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // In a real app, navigate to add inventory screen
              alert('Add Inventory Item functionality would go here');
            }}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Inventory Item</Text>
          </TouchableOpacity>
        </Card>

        {/* Recent Activities */}
        <Card style={styles.activitiesCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity
              onPress={() => {
                // In a real app, navigate to full activity log
                alert('View All Activities functionality would go here');
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {warehouseData.recentActivities.map((activity: any) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: getActivityColor(activity.type) }]}>
                <Ionicons name={getActivityIcon(activity.type)} size={20} color={colors.white} />
              </View>

              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>
                  {activity.type === 'deposit' && `Added ${activity.quantity} quintals of ${activity.item}`}
                  {activity.type === 'withdrawal' && `Removed ${activity.quantity} quintals of ${activity.item}`}
                  {activity.type === 'inspection' && `Inspection of ${activity.item}`}
                </Text>
                <Text style={styles.activityMeta}>
                  {formatDate(activity.date)} • {activity.performedBy}
                </Text>
                {activity.notes && (
                  <Text style={styles.activityNotes}>{activity.notes}</Text>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // In a real app, navigate to log activity screen
              alert('Log Activity functionality would go here');
            }}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Log New Activity</Text>
          </TouchableOpacity>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // In a real app, navigate to add inventory screen
                alert('Add Inventory functionality would go here');
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="add-circle" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Add Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // In a real app, navigate to remove inventory screen
                alert('Remove Inventory functionality would go here');
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                <Ionicons name="remove-circle" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Remove Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // In a real app, navigate to inspection screen
                alert('Inspection functionality would go here');
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="search" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Inspection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // In a real app, navigate to reports screen
                alert('Reports functionality would go here');
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="document-text" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  overviewCard: {
    margin: spacing.md,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  warehouseName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.veryLightGray,
  },
  capacityContainer: {
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  capacityBarContainer: {
    marginBottom: spacing.sm,
  },
  capacityBar: {
    height: 12,
    backgroundColor: colors.veryLightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 6,
  },
  capacityText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  capacityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityDetail: {
    alignItems: 'center',
    flex: 1,
  },
  capacityDetailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  capacityDetailValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  conditionsContainer: {
    marginBottom: spacing.md,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  conditionItem: {
    width: '48%',
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conditionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  conditionOptimal: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  lastInspection: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.italic || typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  inventoryCard: {
    margin: spacing.md,
    marginTop: 0,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  inventoryImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inventoryQuantity: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  inventoryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inventoryMetaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  qualityBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  qualityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  activitiesCard: {
    margin: spacing.md,
    marginTop: 0,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  activityMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  activityNotes: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionsCard: {
    margin: spacing.md,
    marginTop: 0,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default WarehouseScreen;
