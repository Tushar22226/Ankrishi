import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography } from '../../theme';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import { Crop, CropStatus, CropHealth, FertilizerApplication, PesticideApplication, IrrigationSchedule } from '../../models/Farm';

const CropDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cropId } = route.params || {};
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fertilizers' | 'pesticides' | 'irrigation'>('overview');

  // Load crop data on component mount
  useEffect(() => {
    if (cropId && userProfile?.uid) {
      loadCropData();
    } else {
      setLoading(false);
      Alert.alert('Error', 'Crop ID not provided');
      navigation.goBack();
    }
  }, [cropId]);

  // Load crop data from Firebase
  const loadCropData = async () => {
    if (!userProfile?.uid || !cropId) return;

    try {
      setLoading(true);

      // Get crop from Firebase
      const cropData = await FarmService.getCrop(userProfile.uid, cropId as string);

      if (cropData) {
        setCrop(cropData);
      } else {
        Alert.alert('Error', 'Crop not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading crop:', error);
      Alert.alert('Error', 'Failed to load crop data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate days until harvest
  const getDaysUntilHarvest = (harvestDate: number) => {
    const today = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = harvest.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get status color
  const getStatusColor = (status: CropStatus) => {
    switch (status) {
      case 'planning':
        return colors.info;
      case 'planting':
        return colors.warning;
      case 'growing':
        return colors.primary;
      case 'harvesting':
        return colors.success;
      case 'completed':
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  // Get health color
  const getHealthColor = (health: CropHealth) => {
    switch (health) {
      case 'excellent':
        return colors.success;
      case 'good':
        return colors.primary;
      case 'fair':
        return colors.warning;
      case 'poor':
      case 'critical':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Add fertilizer
  const handleAddFertilizer = () => {
    // In a real app, we would navigate to add fertilizer screen
    Alert.alert('Coming Soon', 'Add fertilizer feature will be available soon.');
  };

  // Add pesticide
  const handleAddPesticide = () => {
    // In a real app, we would navigate to add pesticide screen
    Alert.alert('Coming Soon', 'Add pesticide feature will be available soon.');
  };

  // Add irrigation schedule
  const handleAddIrrigation = () => {
    // In a real app, we would navigate to add irrigation schedule screen
    Alert.alert('Coming Soon', 'Add irrigation schedule feature will be available soon.');
  };

  // Mark irrigation as completed
  const handleMarkIrrigationCompleted = (irrigationId: string) => {
    // In a real app, we would update the irrigation status in Firebase
    Alert.alert('Coming Soon', 'Mark as completed feature will be available soon.');
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading crop details...</Text>
      </View>
    );
  }

  if (!crop) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Crop not found</Text>
        <TouchableOpacity
          style={styles.backToListButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToListText}>Back to Crop List</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>{crop.name}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'fertilizers' && styles.activeTabButton]}
          onPress={() => setActiveTab('fertilizers')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'fertilizers' && styles.activeTabButtonText]}>
            Fertilizers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pesticides' && styles.activeTabButton]}
          onPress={() => setActiveTab('pesticides')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'pesticides' && styles.activeTabButtonText]}>
            Pesticides
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'irrigation' && styles.activeTabButton]}
          onPress={() => setActiveTab('irrigation')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'irrigation' && styles.activeTabButtonText]}>
            Irrigation
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <>
            <Card style={styles.overviewCard}>
              <View style={styles.cropHeader}>
                <View>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropVariety}>{crop.variety}</Text>
                </View>

                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(crop.status) }]}>
                    <Text style={styles.statusText}>
                      {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.healthContainer}>
                    <Text style={styles.healthLabel}>Health: </Text>
                    <Text style={[styles.healthText, { color: getHealthColor(crop.health) }]}>
                      {crop.health.charAt(0).toUpperCase() + crop.health.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {crop.image ? (
                <View style={styles.cropImageContainer}>
                  <Image
                    source={{ uri: crop.image }}
                    style={styles.cropImage}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.placeholderImageContainer}>
                  <Ionicons name="leaf-outline" size={64} color={colors.lightGray} />
                  <Text style={styles.placeholderText}>No image available</Text>
                </View>
              )}

              <View style={styles.cropDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Area</Text>
                    <Text style={styles.detailValue}>{crop.area} {crop.areaUnit}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Soil Type</Text>
                    <Text style={styles.detailValue}>{crop.soilType || 'Not specified'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Planted On</Text>
                    <Text style={styles.detailValue}>{formatDate(crop.plantingDate)}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Expected Harvest</Text>
                    <Text style={styles.detailValue}>{formatDate(crop.harvestDate)}</Text>
                  </View>
                </View>

                {crop.expectedYield && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Expected Yield</Text>
                      <Text style={styles.detailValue}>
                        {crop.expectedYield} {crop.yieldUnit}
                      </Text>
                    </View>

                    {crop.actualYield && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Actual Yield</Text>
                        <Text style={styles.detailValue}>
                          {crop.actualYield} {crop.yieldUnit}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.harvestCountdown}>
                  <Text style={styles.countdownLabel}>Days to Harvest</Text>
                  <Text style={styles.countdownValue}>{getDaysUntilHarvest(crop.harvestDate)}</Text>
                </View>
              </View>
            </Card>

            {crop.description && (
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{crop.description}</Text>
              </Card>
            )}

            <Card style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>

              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setActiveTab('fertilizers')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="flask" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.actionText}>Fertilizers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setActiveTab('pesticides')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                    <Ionicons name="bug" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.actionText}>Pesticides</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setActiveTab('irrigation')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                    <Ionicons name="water" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.actionText}>Irrigation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('TaskManagement')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                    <Ionicons name="list" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.actionText}>Tasks</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'fertilizers' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Fertilizer Applications</Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={handleAddFertilizer}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {crop.fertilizers && crop.fertilizers.length > 0 ? (
              crop.fertilizers.map((fertilizer: FertilizerApplication, index: number) => (
                <View key={fertilizer.id || index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{fertilizer.name}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {fertilizer.quantity} • Last applied: {formatDate(fertilizer.lastApplied)}
                    </Text>
                    {fertilizer.notes && (
                      <Text style={styles.listItemNotes}>{fertilizer.notes}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyListContainer}>
                <Ionicons name="flask-outline" size={48} color={colors.lightGray} />
                <Text style={styles.emptyListText}>
                  No fertilizer applications recorded yet
                </Text>
                <TouchableOpacity
                  style={styles.emptyListButton}
                  onPress={handleAddFertilizer}
                >
                  <Text style={styles.emptyListButtonText}>Add Fertilizer Application</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {activeTab === 'pesticides' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Pesticide Applications</Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={handleAddPesticide}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {crop.pesticides && crop.pesticides.length > 0 ? (
              crop.pesticides.map((pesticide: PesticideApplication, index: number) => (
                <View key={pesticide.id || index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{pesticide.name}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {pesticide.quantity} • Last applied: {formatDate(pesticide.lastApplied)}
                    </Text>
                    {pesticide.notes && (
                      <Text style={styles.listItemNotes}>{pesticide.notes}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyListContainer}>
                <Ionicons name="bug-outline" size={48} color={colors.lightGray} />
                <Text style={styles.emptyListText}>
                  No pesticide applications recorded yet
                </Text>
                <TouchableOpacity
                  style={styles.emptyListButton}
                  onPress={handleAddPesticide}
                >
                  <Text style={styles.emptyListButtonText}>Add Pesticide Application</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {activeTab === 'irrigation' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Irrigation Schedule</Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={handleAddIrrigation}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {crop.irrigationSchedule && crop.irrigationSchedule.length > 0 ? (
              crop.irrigationSchedule.map((irrigation: IrrigationSchedule, index: number) => (
                <View key={irrigation.id || index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>
                      {formatDate(irrigation.date)}
                    </Text>
                    <Text style={styles.listItemSubtitle}>
                      Duration: {irrigation.duration}
                      {irrigation.status ? ` • ${irrigation.status.charAt(0).toUpperCase() + irrigation.status.slice(1)}` : ''}
                    </Text>
                  </View>

                  {irrigation.status === 'scheduled' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkIrrigationCompleted(irrigation.id)}
                    >
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyListContainer}>
                <Ionicons name="water-outline" size={48} color={colors.lightGray} />
                <Text style={styles.emptyListText}>
                  No irrigation schedules recorded yet
                </Text>
                <TouchableOpacity
                  style={styles.emptyListButton}
                  onPress={handleAddIrrigation}
                >
                  <Text style={styles.emptyListButtonText}>Add Irrigation Schedule</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

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
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 16,
  },
  backToListButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToListText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 32 : 48,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  overviewCard: {
    marginBottom: 16,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cropVariety: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cropImageContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImageContainer: {
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  cropDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  harvestCountdown: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  countdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionButton: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tabContentCard: {
    marginBottom: 16,
  },
  tabContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addItemButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  listItemNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButton: {
    padding: 8,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyListText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyListButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyListButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default CropDetailsScreen;
