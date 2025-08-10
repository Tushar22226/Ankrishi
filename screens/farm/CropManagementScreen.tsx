import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../theme';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import { Crop, CropStatus, CropHealth } from '../../models/Farm';

const CropManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [crops, setCrops] = useState<Crop[]>([]);

  // Load crops on component mount
  useEffect(() => {
    loadCrops();
  }, []);

  // Load crops from Firebase
  const loadCrops = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // Get crops from Firebase
      const cropData = await FarmService.getCrops(userProfile.uid);
      setCrops(cropData);
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crops. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadCrops();
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

  // Render crop item
  const renderCropItem = ({ item }: { item: Crop }) => (
    <Card style={styles.cropCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CropDetails', { cropId: item.id })}
      >
        <View style={styles.cropHeader}>
          <Text style={styles.cropName}>{item.name}</Text>
          <View style={[styles.cropBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.cropBadgeText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cropDetails}>
          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Variety:</Text>
            <Text style={styles.cropDetailValue}>{item.variety}</Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Area:</Text>
            <Text style={styles.cropDetailValue}>{item.area} {item.areaUnit}</Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Health:</Text>
            <Text style={[styles.cropDetailValue, { color: getHealthColor(item.health) }]}>
              {item.health.charAt(0).toUpperCase() + item.health.slice(1)}
            </Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Planted:</Text>
            <Text style={styles.cropDetailValue}>{formatDate(item.plantingDate)}</Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Harvest:</Text>
            <Text style={styles.cropDetailValue}>
              {formatDate(item.harvestDate)} ({getDaysUntilHarvest(item.harvestDate)} days)
            </Text>
          </View>
        </View>

        <View style={styles.cropActions}>
          <TouchableOpacity
            style={styles.cropActionButton}
            onPress={() => navigation.navigate('CropDetails', { cropId: item.id })}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={styles.cropActionText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color={colors.lightGray} />
      <Text style={styles.emptyTitle}>No Crops Added Yet</Text>
      <Text style={styles.emptyText}>
        Start tracking your crops by adding your first crop.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddCrop')}
      >
        <Text style={styles.emptyButtonText}>Add Your First Crop</Text>
      </TouchableOpacity>
    </View>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading crops...</Text>
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
        <Text style={styles.title}>Crop Management</Text>
      </View>

      <FlatList
        data={crops}
        renderItem={renderCropItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.cropsList, crops.length === 0 && styles.emptyList]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCrop')}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
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
  cropsList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cropCard: {
    marginBottom: 16,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cropBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cropBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  cropDetails: {
    marginTop: 8,
  },
  cropDetail: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  cropDetailLabel: {
    width: 80,
    fontSize: 14,
    color: colors.textSecondary,
  },
  cropDetailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  cropActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cropActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cropActionText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default CropManagementScreen;
