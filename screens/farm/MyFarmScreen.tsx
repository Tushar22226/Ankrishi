import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Mock farm data
const mockFarmData = {
  id: 'farm1',
  name: 'Green Valley Farm',
  location: {
    address: 'Pune, Maharashtra',
    coordinates: {
      latitude: 18.5204,
      longitude: 73.8567,
    },
  },
  size: 5.5, // in acres
  crops: [
    {
      id: 'crop1',
      name: 'Wheat',
      variety: 'HD-2967',
      area: 2.5, // in acres
      plantingDate: new Date(Date.now() - 86400000 * 60), // 60 days ago
      harvestDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
      status: 'growing',
      health: 'good',
      image: 'https://via.placeholder.com/100x100?text=Wheat',
    },
    {
      id: 'crop2',
      name: 'Tomatoes',
      variety: 'Pusa Ruby',
      area: 1.0, // in acres
      plantingDate: new Date(Date.now() - 86400000 * 45), // 45 days ago
      harvestDate: new Date(Date.now() + 86400000 * 15), // 15 days from now
      status: 'growing',
      health: 'excellent',
      image: 'https://via.placeholder.com/100x100?text=Tomatoes',
    },
    {
      id: 'crop3',
      name: 'Soybeans',
      variety: 'JS-335',
      area: 2.0, // in acres
      plantingDate: new Date(Date.now() - 86400000 * 30), // 30 days ago
      harvestDate: new Date(Date.now() + 86400000 * 60), // 60 days from now
      status: 'growing',
      health: 'fair',
      image: 'https://via.placeholder.com/100x100?text=Soybeans',
    },
  ],
  soil: {
    type: 'Loamy',
    ph: 6.8,
    organicMatter: 'Medium',
    fertility: 'Good',
    lastTestedDate: new Date(Date.now() - 86400000 * 90), // 90 days ago
  },
  irrigation: {
    type: 'Drip Irrigation',
    source: 'Well',
    schedule: 'Every 3 days',
    lastIrrigationDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  equipment: [
    { id: 'equip1', name: 'Tractor', status: 'operational' },
    { id: 'equip2', name: 'Harvester', status: 'maintenance' },
    { id: 'equip3', name: 'Sprinkler System', status: 'operational' },
  ],
  tasks: [
    {
      id: 'task1',
      title: 'Apply Fertilizer',
      description: 'Apply NPK fertilizer to wheat crop',
      dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      priority: 'high',
      status: 'pending',
    },
    {
      id: 'task2',
      title: 'Pest Control',
      description: 'Spray pesticide on tomato plants',
      dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
      priority: 'medium',
      status: 'pending',
    },
    {
      id: 'task3',
      title: 'Irrigation Maintenance',
      description: 'Check and clean drip irrigation system',
      dueDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
      priority: 'low',
      status: 'pending',
    },
  ],
};

const MyFarmScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [farmData, setFarmData] = useState<any>(null);

  // Load farm data on component mount
  useEffect(() => {
    loadFarmData();
  }, []);

  // Load farm data
  const loadFarmData = async () => {
    try {
      setLoading(true);

      // In a real app, we would fetch data from a service
      // For now, let's use mock data
      setTimeout(() => {
        setFarmData(mockFarmData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading farm data:', error);
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

  // Get crop status color
  const getCropStatusColor = (status: string) => {
    switch (status) {
      case 'growing':
        return colors.success;
      case 'harvested':
        return colors.primary;
      case 'planned':
        return colors.info;
      case 'failed':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  // Get crop health color
  const getCropHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return colors.success;
      case 'good':
        return colors.primary;
      case 'fair':
        return colors.warning;
      case 'poor':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  // Get task priority color
  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.mediumGray;
    }
  };

  // Get equipment status color
  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return colors.success;
      case 'maintenance':
        return colors.warning;
      case 'repair':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading farm data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Farm</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadFarmData}
        >
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Farm Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.farmHeader}>
            <View>
              <Text style={styles.farmName}>{farmData.name}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.locationText}>{farmData.location.address}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditFarm' as never)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.farmDetails}>
            <View style={styles.farmDetailItem}>
              <Text style={styles.farmDetailLabel}>Size</Text>
              <Text style={styles.farmDetailValue}>{farmData.size} acres</Text>
            </View>

            <View style={styles.farmDetailItem}>
              <Text style={styles.farmDetailLabel}>Soil Type</Text>
              <Text style={styles.farmDetailValue}>{farmData.soil.type}</Text>
            </View>

            <View style={styles.farmDetailItem}>
              <Text style={styles.farmDetailLabel}>Irrigation</Text>
              <Text style={styles.farmDetailValue}>{farmData.irrigation.type}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewMapButton}
            onPress={() => navigation.navigate('FarmMap' as never)}
          >
            <Text style={styles.viewMapButtonText}>View Farm Map</Text>
            <Ionicons name="map" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Current Crops */}
        <Card style={styles.cropsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Crops</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CropManagement' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {farmData.crops.map((crop: any) => (
            <TouchableOpacity
              key={crop.id}
              style={styles.cropItem}
              onPress={() => navigation.navigate('CropDetails' as never, { cropId: crop.id } as never)}
            >
              <Image
                source={{ uri: crop.image }}
                style={styles.cropImage}
                resizeMode="cover"
              />

              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>{crop.name}</Text>
                <Text style={styles.cropVariety}>{crop.variety}</Text>

                <View style={styles.cropMetaRow}>
                  <View style={styles.cropMeta}>
                    <Text style={styles.cropMetaLabel}>Area:</Text>
                    <Text style={styles.cropMetaValue}>{crop.area} acres</Text>
                  </View>

                  <View style={styles.cropMeta}>
                    <Text style={styles.cropMetaLabel}>Planted:</Text>
                    <Text style={styles.cropMetaValue}>{formatDate(new Date(crop.plantingDate))}</Text>
                  </View>
                </View>

                <View style={styles.cropStatusRow}>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getCropStatusColor(crop.status) },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getCropHealthColor(crop.health) },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {crop.health.charAt(0).toUpperCase() + crop.health.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCrop' as never)}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add New Crop</Text>
          </TouchableOpacity>
        </Card>

        {/* Upcoming Tasks */}
        <Card style={styles.tasksCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('TaskManagement' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {farmData.tasks.map((task: any) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => navigation.navigate('TaskDetails' as never, { taskId: task.id } as never)}
            >
              <View
                style={[
                  styles.taskPriorityIndicator,
                  { backgroundColor: getTaskPriorityColor(task.priority) },
                ]}
              />

              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription} numberOfLines={1}>
                  {task.description}
                </Text>

                <View style={styles.taskMeta}>
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={styles.taskMetaText}>
                      Due: {formatDate(new Date(task.dueDate))}
                    </Text>
                  </View>

                  <View style={styles.taskPriorityBadge}>
                    <Text
                      style={[
                        styles.taskPriorityText,
                        { color: getTaskPriorityColor(task.priority) },
                      ]}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.taskCheckbox}
                onPress={() => {
                  // In a real app, we would update the task status
                  alert(`Marking task "${task.title}" as complete`);
                }}
              >
                <Ionicons
                  name={task.status === 'completed' ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTask' as never)}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add New Task</Text>
          </TouchableOpacity>
        </Card>

        {/* Equipment */}
        <Card style={styles.equipmentCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('EquipmentManagement' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {farmData.equipment.map((equipment: any) => (
            <TouchableOpacity
              key={equipment.id}
              style={styles.equipmentItem}
              onPress={() => navigation.navigate('EquipmentDetails' as never, { equipmentId: equipment.id } as never)}
            >
              <View style={styles.equipmentIcon}>
                <Ionicons name="construct" size={24} color={colors.primary} />
              </View>

              <View style={styles.equipmentInfo}>
                <Text style={styles.equipmentName}>{equipment.name}</Text>

                <View style={styles.equipmentStatusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getEquipmentStatusColor(equipment.status) },
                    ]}
                  />
                  <Text style={styles.equipmentStatusText}>
                    {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEquipment' as never)}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add New Equipment</Text>
          </TouchableOpacity>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SoilTest' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="flask" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Soil Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('WeatherForecast' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                <Ionicons name="partly-sunny" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Weather</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ExpenseTracker' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.error }]}>
                <Ionicons name="cash" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reports' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="bar-chart" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Warehouse' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="cube" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Warehouse</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: typography.fontSize.xl,
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
  overviewCard: {
    margin: spacing.md,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  farmName: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  farmDetailItem: {
    alignItems: 'center',
  },
  farmDetailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  farmDetailValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  viewMapButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginRight: spacing.xs,
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
  cropsCard: {
    margin: spacing.md,
    marginTop: 0,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  cropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  cropImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  cropVariety: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cropMetaRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  cropMeta: {
    flexDirection: 'row',
    marginRight: spacing.md,
  },
  cropMetaLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  cropMetaValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  cropStatusRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
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
  tasksCard: {
    margin: spacing.md,
    marginTop: 0,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  taskPriorityIndicator: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  taskDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  taskPriorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  taskPriorityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  taskCheckbox: {
    marginLeft: spacing.md,
  },
  equipmentCard: {
    margin: spacing.md,
    marginTop: 0,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  equipmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  equipmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentStatusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
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
    marginTop: spacing.md,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: '1%',
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

export default MyFarmScreen;
