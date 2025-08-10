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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography } from '../../theme';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import MarketplaceService from '../../services/MarketplaceService';
import { Crop, CropStatus, CropHealth, FertilizerApplication, PesticideApplication, IrrigationSchedule } from '../../models/Farm';

const CropDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cropId } = (route.params as any) || {};
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fertilizers' | 'pesticides' | 'irrigation'>('overview');

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editedCrop, setEditedCrop] = useState<Partial<Crop>>({});
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState<boolean>(false);

  // Modal states
  const [showFertilizerModal, setShowFertilizerModal] = useState<boolean>(false);
  const [showPesticideModal, setShowPesticideModal] = useState<boolean>(false);
  const [showIrrigationModal, setShowIrrigationModal] = useState<boolean>(false);

  // Form states for adding items
  const [fertilizerForm, setFertilizerForm] = useState({
    name: '',
    quantity: '',
    notes: '',
    applicationDate: new Date(),
    nextApplication: new Date(Date.now() + 86400000 * 30), // 30 days from now
  });
  const [pesticideForm, setPesticideForm] = useState({
    name: '',
    quantity: '',
    notes: '',
    applicationDate: new Date(),
    nextApplication: new Date(Date.now() + 86400000 * 30), // 30 days from now
  });
  const [irrigationForm, setIrrigationForm] = useState({
    date: new Date(),
    duration: '',
    status: 'scheduled' as 'completed' | 'scheduled' | 'missed',
  });

  // Date picker states for forms
  const [showFertilizerDatePicker, setShowFertilizerDatePicker] = useState<boolean>(false);
  const [showFertilizerNextDatePicker, setShowFertilizerNextDatePicker] = useState<boolean>(false);
  const [showPesticideDatePicker, setShowPesticideDatePicker] = useState<boolean>(false);
  const [showPesticideNextDatePicker, setShowPesticideNextDatePicker] = useState<boolean>(false);
  const [showIrrigationDatePicker, setShowIrrigationDatePicker] = useState<boolean>(false);

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
        setEditedCrop(cropData);
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

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // Cancel edit - reset to original crop data
      setEditedCrop(crop || {});
    }
    setIsEditMode(!isEditMode);
  };

  // Save crop changes
  const saveCropChanges = async () => {
    if (!userProfile?.uid || !cropId || !crop) return;

    try {
      setLoading(true);

      // Update crop in Firebase
      const updatedCrop = await FarmService.updateCrop(userProfile.uid, cropId as string, editedCrop);

      setCrop(updatedCrop);
      setIsEditMode(false);

      Alert.alert('Success', 'Crop details updated successfully');
    } catch (error) {
      console.error('Error updating crop:', error);
      Alert.alert('Error', 'Failed to update crop details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Check if crop is eligible for pre-listing (14-16 days before harvest)
  const isEligibleForPreListing = () => {
    if (!crop) return false;
    const daysUntilHarvest = getDaysUntilHarvest(crop.harvestDate);
    // For testing purposes, show if harvest is within 30 days (change back to 14-16 for production)
    return daysUntilHarvest >= 1 && daysUntilHarvest <= 30;
  };

  // Handle pre-list product navigation
  const handlePreListProduct = () => {
    if (!crop || !userProfile) return;

    // Create comprehensive traceability data
    const traceabilityData = {
      cropId: crop.id,
      cropName: crop.name,
      cropVariety: crop.variety,
      farmerId: userProfile.uid,
      farmerName: userProfile.displayName || 'Unknown Farmer',
      farmDetails: {
        farmName: userProfile.farmDetails?.name || userProfile.displayName || 'Farm',
        farmingMethod: userProfile.farmDetails?.farmingMethod || 'conventional',
        farmLocation: userProfile.address || 'Location not specified',
        area: crop.area,
        areaUnit: crop.areaUnit,
        soilType: crop.soilType || 'Not specified',
      },
      plantingDate: crop.plantingDate,
      harvestDate: crop.harvestDate,
      expectedYield: crop.expectedYield,
      yieldUnit: crop.yieldUnit,
      cropHealth: crop.health,
      cropStatus: crop.status,
      description: crop.description,
      // Fertilizer applications with dates
      fertilizers: crop.fertilizers?.map(fertilizer => ({
        name: fertilizer.name,
        quantity: fertilizer.quantity,
        applicationDate: fertilizer.lastApplied,
        nextApplication: fertilizer.nextApplication,
        notes: fertilizer.notes,
      })) || [],
      // Pesticide applications with dates
      pesticides: crop.pesticides?.map(pesticide => ({
        name: pesticide.name,
        quantity: pesticide.quantity,
        applicationDate: pesticide.lastApplied,
        nextApplication: pesticide.nextApplication,
        notes: pesticide.notes,
      })) || [],
      // Irrigation schedule details
      irrigationSchedule: crop.irrigationSchedule?.map(irrigation => ({
        date: irrigation.date,
        duration: irrigation.duration,
        status: irrigation.status,
      })) || [],
      // Product journey stages
      productJourney: {
        journeyId: generateId(),
        stages: [
          {
            stageName: 'Seed Planting',
            location: {
              address: userProfile.address || 'Farm Location',
              latitude: userProfile.location?.latitude || 0,
              longitude: userProfile.location?.longitude || 0,
            },
            timestamp: crop.plantingDate,
            handledBy: userProfile.displayName || 'Farmer',
            description: `${crop.name} (${crop.variety}) planted on ${formatDate(crop.plantingDate)}`,
          },
          {
            stageName: 'Crop Growing',
            location: {
              address: userProfile.address || 'Farm Location',
              latitude: userProfile.location?.latitude || 0,
              longitude: userProfile.location?.longitude || 0,
            },
            timestamp: Date.now(),
            handledBy: userProfile.displayName || 'Farmer',
            description: `Crop is currently growing. Health status: ${crop.health}`,
          },
          {
            stageName: 'Ready for Harvest',
            location: {
              address: userProfile.address || 'Farm Location',
              latitude: userProfile.location?.latitude || 0,
              longitude: userProfile.location?.longitude || 0,
            },
            timestamp: crop.harvestDate,
            handledBy: userProfile.displayName || 'Farmer',
            description: `Expected harvest date: ${formatDate(crop.harvestDate)}`,
          },
        ],
      },
      // Certification and quality data
      qualityMetrics: {
        healthScore: crop.health === 'excellent' ? 95 : crop.health === 'good' ? 85 : crop.health === 'fair' ? 75 : 65,
        organicCertified: userProfile.farmDetails?.farmingMethod === 'organic',
        growingMethod: userProfile.farmDetails?.farmingMethod || 'conventional',
      },
    };

    // Navigate to pre-list product screen with traceability data
    navigation.navigate('AddPrelistedProduct' as never, {
      cropData: crop,
      traceabilityData,
    } as never);
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
    setFertilizerForm({
      name: '',
      quantity: '',
      notes: '',
      applicationDate: new Date(),
      nextApplication: new Date(Date.now() + 86400000 * 30),
    });
    setShowFertilizerModal(true);
  };

  // Save fertilizer
  const saveFertilizer = async () => {
    if (!fertilizerForm.name.trim() || !fertilizerForm.quantity.trim()) {
      Alert.alert('Error', 'Please fill in fertilizer name and quantity');
      return;
    }

    if (!userProfile?.uid || !cropId || !crop) return;

    try {
      const newFertilizer: FertilizerApplication = {
        id: generateId(),
        name: fertilizerForm.name.trim(),
        quantity: fertilizerForm.quantity.trim(),
        lastApplied: fertilizerForm.applicationDate.getTime(),
        nextApplication: fertilizerForm.nextApplication.getTime(),
        notes: fertilizerForm.notes.trim() || undefined,
      };

      const updatedFertilizers = [...(crop.fertilizers || []), newFertilizer];
      const updatedCrop = await FarmService.updateCrop(userProfile.uid, cropId as string, {
        fertilizers: updatedFertilizers,
      });

      setCrop(updatedCrop);
      setShowFertilizerModal(false);
      Alert.alert('Success', 'Fertilizer application added successfully');
    } catch (error) {
      console.error('Error adding fertilizer:', error);
      Alert.alert('Error', 'Failed to add fertilizer application');
    }
  };

  // Add pesticide
  const handleAddPesticide = () => {
    setPesticideForm({
      name: '',
      quantity: '',
      notes: '',
      applicationDate: new Date(),
      nextApplication: new Date(Date.now() + 86400000 * 30),
    });
    setShowPesticideModal(true);
  };

  // Save pesticide
  const savePesticide = async () => {
    if (!pesticideForm.name.trim() || !pesticideForm.quantity.trim()) {
      Alert.alert('Error', 'Please fill in pesticide name and quantity');
      return;
    }

    if (!userProfile?.uid || !cropId || !crop) return;

    try {
      const newPesticide: PesticideApplication = {
        id: generateId(),
        name: pesticideForm.name.trim(),
        quantity: pesticideForm.quantity.trim(),
        lastApplied: pesticideForm.applicationDate.getTime(),
        nextApplication: pesticideForm.nextApplication.getTime(),
        notes: pesticideForm.notes.trim() || undefined,
      };

      const updatedPesticides = [...(crop.pesticides || []), newPesticide];
      const updatedCrop = await FarmService.updateCrop(userProfile.uid, cropId as string, {
        pesticides: updatedPesticides,
      });

      setCrop(updatedCrop);
      setShowPesticideModal(false);
      Alert.alert('Success', 'Pesticide application added successfully');
    } catch (error) {
      console.error('Error adding pesticide:', error);
      Alert.alert('Error', 'Failed to add pesticide application');
    }
  };

  // Add irrigation schedule
  const handleAddIrrigation = () => {
    setIrrigationForm({
      date: new Date(),
      duration: '',
      status: 'scheduled',
    });
    setShowIrrigationModal(true);
  };

  // Save irrigation
  const saveIrrigation = async () => {
    if (!irrigationForm.duration.trim()) {
      Alert.alert('Error', 'Please fill in irrigation duration');
      return;
    }

    if (!userProfile?.uid || !cropId || !crop) return;

    try {
      const newIrrigation: IrrigationSchedule = {
        id: generateId(),
        date: irrigationForm.date.getTime(),
        duration: irrigationForm.duration.trim(),
        status: irrigationForm.status,
      };

      const updatedIrrigation = [...(crop.irrigationSchedule || []), newIrrigation];
      const updatedCrop = await FarmService.updateCrop(userProfile.uid, cropId as string, {
        irrigationSchedule: updatedIrrigation,
      });

      setCrop(updatedCrop);
      setShowIrrigationModal(false);
      Alert.alert('Success', 'Irrigation schedule added successfully');
    } catch (error) {
      console.error('Error adding irrigation:', error);
      Alert.alert('Error', 'Failed to add irrigation schedule');
    }
  };

  // Mark irrigation as completed
  const handleMarkIrrigationCompleted = async (irrigationId: string) => {
    if (!userProfile?.uid || !cropId || !crop) return;

    try {
      const updatedIrrigation = crop.irrigationSchedule.map(irrigation =>
        irrigation.id === irrigationId
          ? { ...irrigation, status: 'completed' as const }
          : irrigation
      );

      const updatedCrop = await FarmService.updateCrop(userProfile.uid, cropId as string, {
        irrigationSchedule: updatedIrrigation,
      });

      setCrop(updatedCrop);
      Alert.alert('Success', 'Irrigation marked as completed');
    } catch (error) {
      console.error('Error updating irrigation:', error);
      Alert.alert('Error', 'Failed to update irrigation status');
    }
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

        <View style={styles.headerActions}>
          {isEditMode ? (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleEditMode}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { marginLeft: 8 }]}
                onPress={saveCropChanges}
              >
                <Ionicons name="checkmark" size={24} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleEditMode}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
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
                    {isEditMode ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={styles.editInput}
                          value={editedCrop.area?.toString() || ''}
                          onChangeText={(text) => setEditedCrop({...editedCrop, area: parseFloat(text) || 0})}
                          keyboardType="numeric"
                          placeholder="Area"
                        />
                        <Text style={styles.unitText}>{crop.areaUnit}</Text>
                      </View>
                    ) : (
                      <Text style={styles.detailValue}>{crop.area} {crop.areaUnit}</Text>
                    )}
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Soil Type</Text>
                    {isEditMode ? (
                      <TextInput
                        style={styles.editInput}
                        value={editedCrop.soilType || ''}
                        onChangeText={(text) => setEditedCrop({...editedCrop, soilType: text})}
                        placeholder="Soil type"
                      />
                    ) : (
                      <Text style={styles.detailValue}>{crop.soilType || 'Not specified'}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Planted On</Text>
                    <Text style={styles.detailValue}>{formatDate(crop.plantingDate)}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Expected Harvest</Text>
                    {isEditMode ? (
                      <TouchableOpacity
                        style={styles.dateEditButton}
                        onPress={() => setShowHarvestDatePicker(true)}
                      >
                        <Text style={styles.dateEditText}>
                          {formatDate(editedCrop.harvestDate || crop.harvestDate)}
                        </Text>
                        <Ionicons name="calendar" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.detailValue}>{formatDate(crop.harvestDate)}</Text>
                    )}
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

                {/* Pre-List Product Button */}
                {isEligibleForPreListing() && (
                  <View style={styles.preListContainer}>
                    <View style={styles.preListAlert}>
                      <Ionicons name="storefront" size={24} color={colors.primary} />
                      <View style={styles.preListTextContainer}>
                        <Text style={styles.preListTitle}>Ready for Pre-Listing!</Text>
                        <Text style={styles.preListSubtitle}>
                          Your crop is {getDaysUntilHarvest(crop.harvestDate)} days away from harvest.
                          Pre-list it now to secure buyers.
                        </Text>
                      </View>
                    </View>
                    <Button
                      title="Pre-List in Marketplace"
                      onPress={handlePreListProduct}
                      style={styles.preListButton}
                      leftIcon={<Ionicons name="add-circle" size={20} color={colors.white} />}
                    />
                  </View>
                )}
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
                      style={styles.irrigationActionButton}
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

      {/* Date Picker for Harvest Date */}
      {showHarvestDatePicker && (
        <DateTimePicker
          value={new Date(editedCrop.harvestDate || crop.harvestDate)}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowHarvestDatePicker(false);
            if (selectedDate) {
              setEditedCrop({...editedCrop, harvestDate: selectedDate.getTime()});
            }
          }}
        />
      )}

      {/* Fertilizer Modal */}
      <Modal
        visible={showFertilizerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFertilizerModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Fertilizer Application</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={saveFertilizer}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Fertilizer Name"
              placeholder="e.g., NPK 10-26-26"
              value={fertilizerForm.name}
              onChangeText={(text) => setFertilizerForm({...fertilizerForm, name: text})}
            />

            <Input
              label="Quantity"
              placeholder="e.g., 50 kg"
              value={fertilizerForm.quantity}
              onChangeText={(text) => setFertilizerForm({...fertilizerForm, quantity: text})}
            />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Application Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowFertilizerDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDate(fertilizerForm.applicationDate.getTime())}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Next Application (Optional)</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowFertilizerNextDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDate(fertilizerForm.nextApplication.getTime())}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Notes (Optional)"
              placeholder="Additional notes about application"
              value={fertilizerForm.notes}
              onChangeText={(text) => setFertilizerForm({...fertilizerForm, notes: text})}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {showFertilizerDatePicker && (
            <DateTimePicker
              value={fertilizerForm.applicationDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowFertilizerDatePicker(false);
                if (selectedDate) {
                  setFertilizerForm({...fertilizerForm, applicationDate: selectedDate});
                }
              }}
            />
          )}

          {showFertilizerNextDatePicker && (
            <DateTimePicker
              value={fertilizerForm.nextApplication}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowFertilizerNextDatePicker(false);
                if (selectedDate) {
                  setFertilizerForm({...fertilizerForm, nextApplication: selectedDate});
                }
              }}
            />
          )}
        </View>
      </Modal>

      {/* Pesticide Modal */}
      <Modal
        visible={showPesticideModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPesticideModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Pesticide Application</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={savePesticide}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Pesticide Name"
              placeholder="e.g., Chlorpyrifos"
              value={pesticideForm.name}
              onChangeText={(text) => setPesticideForm({...pesticideForm, name: text})}
            />

            <Input
              label="Quantity"
              placeholder="e.g., 2 liters"
              value={pesticideForm.quantity}
              onChangeText={(text) => setPesticideForm({...pesticideForm, quantity: text})}
            />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Application Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowPesticideDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDate(pesticideForm.applicationDate.getTime())}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Next Application (Optional)</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowPesticideNextDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDate(pesticideForm.nextApplication.getTime())}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Notes (Optional)"
              placeholder="Additional notes about application"
              value={pesticideForm.notes}
              onChangeText={(text) => setPesticideForm({...pesticideForm, notes: text})}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {showPesticideDatePicker && (
            <DateTimePicker
              value={pesticideForm.applicationDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPesticideDatePicker(false);
                if (selectedDate) {
                  setPesticideForm({...pesticideForm, applicationDate: selectedDate});
                }
              }}
            />
          )}

          {showPesticideNextDatePicker && (
            <DateTimePicker
              value={pesticideForm.nextApplication}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPesticideNextDatePicker(false);
                if (selectedDate) {
                  setPesticideForm({...pesticideForm, nextApplication: selectedDate});
                }
              }}
            />
          )}
        </View>
      </Modal>

      {/* Irrigation Modal */}
      <Modal
        visible={showIrrigationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowIrrigationModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Irrigation Schedule</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={saveIrrigation}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Irrigation Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowIrrigationDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDate(irrigationForm.date.getTime())}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Duration"
              placeholder="e.g., 2 hours"
              value={irrigationForm.duration}
              onChangeText={(text) => setIrrigationForm({...irrigationForm, duration: text})}
            />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    irrigationForm.status === 'scheduled' && styles.statusButtonActive
                  ]}
                  onPress={() => setIrrigationForm({...irrigationForm, status: 'scheduled'})}
                >
                  <Text style={[
                    styles.statusButtonText,
                    irrigationForm.status === 'scheduled' && styles.statusButtonTextActive
                  ]}>Scheduled</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    irrigationForm.status === 'completed' && styles.statusButtonActive
                  ]}
                  onPress={() => setIrrigationForm({...irrigationForm, status: 'completed'})}
                >
                  <Text style={[
                    styles.statusButtonText,
                    irrigationForm.status === 'completed' && styles.statusButtonTextActive
                  ]}>Completed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {showIrrigationDatePicker && (
            <DateTimePicker
              value={irrigationForm.date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowIrrigationDatePicker(false);
                if (selectedDate) {
                  setIrrigationForm({...irrigationForm, date: selectedDate});
                }
              }}
            />
          )}
        </View>
      </Modal>
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
    borderBottomColor: colors.lightGray,
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
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
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
    borderTopColor: colors.lightGray,
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
    borderBottomColor: colors.lightGray,
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
  irrigationActionButton: {
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
  // Edit mode styles
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  unitText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.textSecondary,
  },
  dateEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  dateEditText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    marginTop: Platform.OS === 'android' ? 32 : 48,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  // Pre-list product styles
  preListContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  preListAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  preListTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  preListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  preListSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  preListButton: {
    marginTop: 8,
  },
});

export default CropDetailsScreen;
