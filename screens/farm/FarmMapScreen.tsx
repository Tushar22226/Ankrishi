import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import { Farm } from '../../models/Farm';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Card from '../../components/Card';

const FarmMapScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Load farm data
  useEffect(() => {
    loadFarmData();
  }, []);

  // Load farm data from Firebase
  const loadFarmData = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // Get farm data from Firebase
      const farmData = await FarmService.getFarmData(userProfile.uid);

      if (farmData) {
        setFarm(farmData);
      } else {
        // Create a new farm if none exists
        const newFarm = await FarmService.createFarm(userProfile.uid, {
          name: userProfile.farmName || 'My Farm',
          location: {
            address: userProfile.location?.address || '',
            coordinates: {
              latitude: userProfile.location?.latitude || 18.5204,
              longitude: userProfile.location?.longitude || 73.8567,
            }
          },
          size: 5.5,
          sizeUnit: 'acre',
          farmingMethod: 'conventional',
        });

        setFarm(newFarm);
      }
    } catch (error) {
      console.error('Error loading farm data:', error);
      Alert.alert('Error', 'Failed to load farm data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle map ready
  const handleMapReady = () => {
    setMapReady(true);
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading farm map...</Text>
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
        <Text style={styles.title}>Farm Map</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Card */}
        <Card style={styles.mapCard}>
          <View style={styles.mapContainer}>
            {!mapReady && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {Platform.OS === 'web' ? (
              <View style={[styles.map, styles.webMapPlaceholder]}>
                <Ionicons name="map-outline" size={64} color={colors.lightGray} />
                <Text style={styles.webMapText}>Map view is not available on web</Text>
              </View>
            ) : (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: farm?.location.coordinates.latitude || 18.5204,
                  longitude: farm?.location.coordinates.longitude || 73.8567,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onMapReady={handleMapReady}
              >
                <Marker
                  coordinate={{
                    latitude: farm?.location.coordinates.latitude || 18.5204,
                    longitude: farm?.location.coordinates.longitude || 73.8567,
                  }}
                  title={farm?.name || 'My Farm'}
                  description={farm?.location.address || ''}
                >
                  <View style={styles.customMarker}>
                    <Ionicons name="location" size={32} color={colors.primary} />
                  </View>
                </Marker>
              </MapView>
            )}
          </View>

          <View style={styles.farmInfoContainer}>
            <Text style={styles.farmName}>{farm?.name || 'My Farm'}</Text>
            <View style={styles.farmAddressContainer}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.farmAddress}>{farm?.location.address || 'No address provided'}</Text>
            </View>
          </View>
        </Card>

        {/* Farm Details Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Farm Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{farm?.size || 0} {farm?.sizeUnit || 'acre'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Farming Method</Text>
              <Text style={styles.detailValue}>
                {farm?.farmingMethod ? farm.farmingMethod.charAt(0).toUpperCase() + farm.farmingMethod.slice(1) : 'Conventional'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Crops</Text>
              <Text style={styles.detailValue}>{farm?.crops?.length || 0} crops</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Equipment</Text>
              <Text style={styles.detailValue}>{farm?.equipment?.length || 0} items</Text>
            </View>
          </View>

          {farm?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.descriptionText}>{farm.description}</Text>
            </View>
          )}
        </Card>

        {/* Actions Card */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditFarm')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="create" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Edit Farm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CropManagement')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="leaf" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Manage Crops</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SoilTest')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="flask" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Soil Tests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('WeatherForecast')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                <Ionicons name="partly-sunny" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionText}>Weather</Text>
            </TouchableOpacity>
          </View>
        </Card>

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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mapCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  webMapText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  customMarker: {
    alignItems: 'center',
  },
  farmInfoContainer: {
    padding: 16,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  farmAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
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
  bottomSpacing: {
    height: 32,
  },
});

export default FarmMapScreen;
