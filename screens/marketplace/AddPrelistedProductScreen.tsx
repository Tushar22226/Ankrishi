import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, ParamListBase, CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { Product, ProductCategory, ProductSubcategory, CertificationType, StockQuantityUnit, ProduceRipeness } from '../../models/Product';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import DateTimePicker from '@react-native-community/datetimepicker';

// Product categories
const productCategories = [
  { id: 'fertilizer', name: 'Fertilizer', icon: 'leaf' },
  { id: 'equipment', name: 'Equipment', icon: 'construct' },
  { id: 'produce', name: 'Produce', icon: 'nutrition' },
];

// Delivery timeframe options - will be dynamically calculated based on harvest date
const getDeliveryTimeframeOptions = (harvestDate?: Date) => {
  if (!harvestDate) {
    // Default options when no harvest date
    return [
      { id: '1week', name: '1 Week', days: 7 },
      { id: '2weeks', name: '2 Weeks', days: 14 },
      { id: '3weeks', name: '3 Weeks', days: 21 },
      { id: '4weeks', name: '4 Weeks', days: 28 },
    ];
  }

  const currentDate = new Date();
  const daysUntilHarvest = Math.ceil((harvestDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  const options = [];

  // Add options based on harvest date
  if (daysUntilHarvest <= 7) {
    options.push({ id: 'harvest', name: `${daysUntilHarvest} days (At Harvest)`, days: daysUntilHarvest });
    options.push({ id: '1week', name: '1 Week after harvest', days: daysUntilHarvest + 7 });
  } else if (daysUntilHarvest <= 14) {
    options.push({ id: 'harvest', name: `${daysUntilHarvest} days (At Harvest)`, days: daysUntilHarvest });
    options.push({ id: '1week', name: '1 Week after harvest', days: daysUntilHarvest + 7 });
    options.push({ id: '2weeks', name: '2 Weeks after harvest', days: daysUntilHarvest + 14 });
  } else if (daysUntilHarvest <= 21) {
    options.push({ id: 'harvest', name: `${daysUntilHarvest} days (At Harvest)`, days: daysUntilHarvest });
    options.push({ id: '1week', name: '1 Week after harvest', days: daysUntilHarvest + 7 });
    options.push({ id: '2weeks', name: '2 Weeks after harvest', days: daysUntilHarvest + 14 });
  } else {
    options.push({ id: 'harvest', name: `${daysUntilHarvest} days (At Harvest)`, days: daysUntilHarvest });
    options.push({ id: '1week', name: '1 Week after harvest', days: daysUntilHarvest + 7 });
    options.push({ id: '2weeks', name: '2 Weeks after harvest', days: daysUntilHarvest + 14 });
    options.push({ id: '3weeks', name: '3 Weeks after harvest', days: daysUntilHarvest + 21 });
  }

  return options;
};

const AddPrelistedProductScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { userProfile } = useAuth();

  // Get route params for crop-based pre-listing
  const route = useRoute();
  const routeParams = route.params as any;
  const cropData = routeParams?.cropData;
  const traceabilityData = routeParams?.traceabilityData;

  // Form state - Initialize with crop data if available
  const [name, setName] = useState(cropData?.name || '');
  const [description, setDescription] = useState(cropData?.description || '');
  const [category, setCategory] = useState<ProductCategory | ''>(cropData ? 'produce' : '');
  const [subcategory, setSubcategory] = useState(cropData ? 'vegetables' : '');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stock, setStock] = useState(cropData?.expectedYield?.toString() || '');
  const [stockUnit, setStockUnit] = useState<StockQuantityUnit>(cropData?.yieldUnit as StockQuantityUnit || 'kg');
  const [ripeness, setRipeness] = useState<ProduceRipeness | ''>('');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  // Scientific verification state
  const [isScientificallyVerified, setIsScientificallyVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [verificationDate, setVerificationDate] = useState(new Date());
  const [verificationCertificateUrl, setVerificationCertificateUrl] = useState('');
  const [verificationResults, setVerificationResults] = useState<Array<{
    parameter: string;
    value: string;
    unit: string;
    standardValue: string;
    isPassing: boolean;
  }>>([]);

  // Certifications state
  const [certifications, setCertifications] = useState<Array<{
    type: CertificationType;
    isSelected: boolean;
  }>>([]);

  // AACC certification details
  const [aaccDetails, setAaccDetails] = useState({
    certificateNumber: '',
    testingLab: '',
    testDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  });

  // Product journey state
  const [journeyStages, setJourneyStages] = useState<Array<{
    stage: string;
    description: string;
  }>>([]);

  // Traceability state - Initialize with comprehensive crop data if available
  const [enableTraceability, setEnableTraceability] = useState(cropData ? true : false);
  const [traceabilityInfo, setTraceabilityInfo] = useState({
    farmName: traceabilityData?.farmDetails?.farmName || userProfile?.farmDetails?.name || '',
    farmingPractices: traceabilityData?.farmDetails?.farmingMethod || '',
    harvestDate: cropData ? new Date(cropData.harvestDate) : new Date(),
    farmLocation: traceabilityData?.farmDetails?.farmLocation || userProfile?.address || '',
    // Additional comprehensive traceability data
    ...(traceabilityData && {
      cropId: traceabilityData.cropId,
      cropName: traceabilityData.cropName,
      cropVariety: traceabilityData.cropVariety,
      plantingDate: traceabilityData.plantingDate,
      expectedYield: traceabilityData.expectedYield,
      cropHealth: traceabilityData.cropHealth,
      fertilizers: traceabilityData.fertilizers,
      pesticides: traceabilityData.pesticides,
      irrigationSchedule: traceabilityData.irrigationSchedule,
      productJourney: traceabilityData.productJourney,
      qualityMetrics: traceabilityData.qualityMetrics,
    }),
  });
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [deliveryTimeframeOptions, setDeliveryTimeframeOptions] = useState(() =>
    getDeliveryTimeframeOptions(cropData ? new Date(cropData.harvestDate) : undefined)
  );

  // Helper function to calculate delivery timeframe based on harvest date
  const calculateDeliveryTimeframe = (harvestDate: Date): string => {
    // Default to "at harvest" option for crop-based pre-listing
    return 'harvest';
  };

  // Set traceability to required for produce category
  useEffect(() => {
    if (category === 'produce') {
      setEnableTraceability(true);
    }
  }, [category]);

  // Update delivery timeframe options when harvest date changes
  useEffect(() => {
    if (cropData && traceabilityInfo.harvestDate) {
      const newOptions = getDeliveryTimeframeOptions(new Date(traceabilityInfo.harvestDate));
      setDeliveryTimeframeOptions(newOptions);

      // Auto-select the "at harvest" option if not already set
      if (!deliveryTimeframe) {
        const suggestedTimeframe = calculateDeliveryTimeframe(new Date(traceabilityInfo.harvestDate));
        setDeliveryTimeframe(suggestedTimeframe);
      }
    }
  }, [cropData, traceabilityInfo.harvestDate, deliveryTimeframe]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    stock: '',
    images: '',
    location: '',
    verificationMethod: '',
    verificationResults: '',
    journeyStages: '',
    aaccCertificateNumber: '',
    aaccTestingLab: '',
    deliveryTimeframe: '',
  });

  // Helper functions
  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permission to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need location permission to get your current location');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addresses[0];

      const addressString = [
        address.name,
        address.street,
        address.district,
        address.city,
        address.region,
        address.postalCode,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');

      setLocation({
        latitude,
        longitude,
        address: addressString,
      });

      setLocationLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
      setLocationLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    let isValid = true;
    const newErrors = { ...errors };

    if (!name) {
      newErrors.name = 'Product name is required';
      isValid = false;
    } else {
      newErrors.name = '';
    }

    if (!description) {
      newErrors.description = 'Product description is required';
      isValid = false;
    } else {
      newErrors.description = '';
    }

    if (!category) {
      newErrors.category = 'Product category is required';
      isValid = false;
    } else {
      newErrors.category = '';
    }

    if (!subcategory) {
      newErrors.subcategory = 'Product subcategory is required';
      isValid = false;
    } else {
      newErrors.subcategory = '';
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Valid price is required';
      isValid = false;
    } else {
      newErrors.price = '';
    }

    if (!stock || isNaN(Number(stock)) || Number(stock) <= 0) {
      newErrors.stock = 'Valid stock quantity is required';
      isValid = false;
    } else {
      newErrors.stock = '';
    }

    if (images.length === 0) {
      newErrors.images = 'At least one product image is required';
      isValid = false;
    } else {
      newErrors.images = '';
    }

    if (!location) {
      newErrors.location = 'Product location is required';
      isValid = false;
    } else {
      newErrors.location = '';
    }

    // Validate delivery timeframe
    if (!deliveryTimeframe) {
      newErrors.deliveryTimeframe = 'Delivery timeframe is required';
      isValid = false;
    } else {
      newErrors.deliveryTimeframe = '';
    }

    // Validate verification method if scientific verification is enabled
    if (isScientificallyVerified) {
      if (!verificationMethod) {
        newErrors.verificationMethod = 'Verification method is required';
        isValid = false;
      } else {
        newErrors.verificationMethod = '';
      }

      if (verificationResults.length === 0) {
        newErrors.verificationResults = 'At least one test result is required';
        isValid = false;
      } else {
        const validResults = verificationResults.every(result => result.parameter && result.value);
        if (!validResults) {
          newErrors.verificationResults = 'All test results must have parameter and value';
          isValid = false;
        } else {
          newErrors.verificationResults = '';
        }
      }
    }

    // Validate traceability information if category is produce and user is a farmer
    if (category === 'produce' && userProfile?.role === 'farmer') {
      if (!traceabilityInfo.farmName) {
        newErrors.farmName = 'Farm name is required for produce category';
        isValid = false;
      }

      if (!traceabilityInfo.farmingPractices) {
        newErrors.farmingPractices = 'Farming practices are required for produce category';
        isValid = false;
      }

      if (!traceabilityInfo.farmLocation) {
        newErrors.farmLocation = 'Farm location is required for produce category';
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (!isValid) {
      // Scroll to the top to show errors
      return;
    }

    // Submit form
    setLoading(true);

    try {
      // Upload images to Firebase Storage
      const uploadedImages = await Promise.all(
        images.map(async (uri, index) => {
          try {
            // Convert URI to blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Upload to Firebase Storage
            return await MarketplaceService.uploadProductImage(blob, 'temp-id', index === 0);
          } catch (error) {
            console.error('Error uploading image:', error);
            // Fallback to local URI if upload fails
            return {
              url: uri,
              isMain: index === 0,
              uploadedAt: Date.now(),
            };
          }
        })
      );

      // Calculate end date based on delivery timeframe
      const selectedTimeframe = deliveryTimeframeOptions.find(option => option.id === deliveryTimeframe);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (selectedTimeframe?.days || 28)); // Default to 4 weeks if not found

      // Create the product object
      const product = {
        name,
        description,
        category: category as ProductCategory,
        subcategory: subcategory as ProductSubcategory,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
        currency: 'INR',
        stock: Number(stock),
        stockUnit,
        images: uploadedImages,
        sellerId: userProfile?.uid || '',
        sellerName: userProfile?.displayName || '',
        sellerRating: userProfile?.reputation?.rating || 0,
        location: location!,
        isActive: true,
        isVerified: userProfile?.reputation?.verifiedStatus || false,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        ratings: [], // Empty ratings array for new product
        // Add direct farmer fields
        isDirectFromFarmer: userProfile?.role === 'farmer',
        // Add ripeness, minimum order quantity, and negotiated price for produce category
        ...(category === 'produce' && ripeness ? { ripeness } : {}),
        ...(category === 'produce' && minimumOrderQuantity ? { minimumOrderQuantity: parseInt(minimumOrderQuantity, 10) || 0 } : {}),
        ...(category === 'produce' && negotiatedPrice ? { negotiatedPrice: parseInt(negotiatedPrice, 10) || 0 } : {}),
        // Add prelisted product specific fields
        deliveryTimeframe,
        endDate: endDate.getTime(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        farmDetails: userProfile?.role === 'farmer' ? {
          farmName: userProfile?.farmDetails?.name || userProfile?.displayName || 'Farm',
          farmingMethod: userProfile?.farmDetails?.farmingMethod || 'conventional',
          certifications: userProfile?.farmDetails?.certifications || [],
          farmerId: userProfile?.uid,
          farmerVerified: userProfile?.reputation?.verifiedStatus || false,
        } : undefined,
        transparencyInfo: userProfile?.role === 'farmer' ? {
          originStory: `Grown at ${userProfile?.farmDetails?.name || userProfile?.displayName || 'our farm'}.`,
          sustainabilityScore: 4,
        } : undefined,

        // Add comprehensive traceability information if enabled
        traceabilityInfo: userProfile?.role === 'farmer' && enableTraceability ? {
          farmName: traceabilityInfo.farmName,
          farmingPractices: traceabilityInfo.farmingPractices,
          harvestDate: traceabilityInfo.harvestDate.getTime(),
          farmLocation: traceabilityInfo.farmLocation,
          // Include comprehensive crop data if available
          ...(traceabilityData && {
            cropId: traceabilityData.cropId,
            cropName: traceabilityData.cropName,
            cropVariety: traceabilityData.cropVariety,
            farmerId: traceabilityData.farmerId,
            farmerName: traceabilityData.farmerName,
            plantingDate: traceabilityData.plantingDate,
            expectedYield: traceabilityData.expectedYield,
            yieldUnit: traceabilityData.yieldUnit,
            cropHealth: traceabilityData.cropHealth,
            cropStatus: traceabilityData.cropStatus,
            fertilizers: traceabilityData.fertilizers,
            pesticides: traceabilityData.pesticides,
            irrigationSchedule: traceabilityData.irrigationSchedule,
            productJourney: traceabilityData.productJourney,
            qualityMetrics: traceabilityData.qualityMetrics,
            farmDetails: traceabilityData.farmDetails,
          }),
        } : undefined,

        // Add pre-listing specific metadata
        isPrelisted: true,
        prelistingMetadata: cropData ? {
          cropId: cropData.id,
          daysUntilHarvest: Math.ceil((cropData.harvestDate - Date.now()) / (1000 * 60 * 60 * 24)),
          prelistedAt: Date.now(),
          farmingPractices: traceabilityData ? {
            fertilizerApplications: traceabilityData.fertilizers?.length || 0,
            pesticideApplications: traceabilityData.pesticides?.length || 0,
            irrigationSessions: traceabilityData.irrigationSchedule?.length || 0,
            organicCertified: traceabilityData.qualityMetrics?.organicCertified || false,
            healthScore: traceabilityData.qualityMetrics?.healthScore || 0,
          } : undefined,
        } : undefined,

        // Add scientific verification if enabled
        scientificVerification: isScientificallyVerified ? {
          isVerified: true,
          verificationDate: verificationDate.getTime(),
          verifiedBy: verifiedBy || userProfile?.displayName || 'Self-verified',
          verificationMethod,
          verificationResults: verificationResults.map(result => ({
            ...result,
            isPassing: result.isPassing, // Use the actual passing status
          })),
          certificateUrl: verificationCertificateUrl || undefined,
          expiryDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days validity
        } : undefined,
      };

      // Add the product to Firebase in the prelisted_products path
      await MarketplaceService.addPrelistedProduct(product);

      setLoading(false);
      Alert.alert(
        'Success',
        'Prelisted product added successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'PrelistedProducts',
                })
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding prelisted product:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add prelisted product');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Prelisted Product</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.cardContainer}>
          <Card style={styles.formCard}>
            {/* Basic Information */}
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <View style={styles.divider} />

            <Input
              label="Product Name"
              placeholder="Enter product name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              touched={true}
            />

            <Input
              label="Description"
              placeholder="Enter product description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              error={errors.description}
              touched={true}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {productCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.id as ProductCategory)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.id ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.id && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category ? (
              <Text style={styles.errorText}>{errors.category}</Text>
            ) : null}

            <Input
              label="Subcategory"
              placeholder="E.g., Organic, Dairy, Tools"
              value={subcategory}
              onChangeText={setSubcategory}
              error={errors.subcategory}
              touched={true}
            />

            {/* Crop-based Pre-listing Info */}
            {cropData && traceabilityData && (
              <>
                <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
                  <Ionicons name="leaf" size={24} color={colors.success} />
                  <Text style={styles.sectionTitle}>Crop Information</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.cropInfoContainer}>
                  <Text style={styles.cropInfoTitle}>Pre-listing from Crop: {cropData.name}</Text>
                  <Text style={styles.cropInfoSubtitle}>
                    Harvest Date: {new Date(cropData.harvestDate).toLocaleDateString()}
                  </Text>

                  <View style={styles.traceabilityPreview}>
                    <Text style={styles.traceabilityPreviewTitle}>Included Traceability Data:</Text>

                    <View style={styles.traceabilityItem}>
                      <Ionicons name="leaf" size={16} color={colors.success} />
                      <Text style={styles.traceabilityItemText}>
                        {traceabilityData.fertilizers?.length || 0} fertilizer applications
                      </Text>
                    </View>

                    <View style={styles.traceabilityItem}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.warning} />
                      <Text style={styles.traceabilityItemText}>
                        {traceabilityData.pesticides?.length || 0} pesticide applications
                      </Text>
                    </View>

                    <View style={styles.traceabilityItem}>
                      <Ionicons name="water" size={16} color={colors.info} />
                      <Text style={styles.traceabilityItemText}>
                        {traceabilityData.irrigationSchedule?.length || 0} irrigation sessions
                      </Text>
                    </View>

                    <View style={styles.traceabilityItem}>
                      <Ionicons name="analytics" size={16} color={colors.primary} />
                      <Text style={styles.traceabilityItemText}>
                        Health Score: {traceabilityData.qualityMetrics?.healthScore || 'N/A'}%
                      </Text>
                    </View>

                    <View style={styles.traceabilityItem}>
                      <Ionicons name="location" size={16} color={colors.primary} />
                      <Text style={styles.traceabilityItemText}>
                        Complete farm-to-consumer journey tracking
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cropInfoNote}>
                    <Ionicons name="information-circle" size={16} color={colors.info} />
                    <Text style={styles.cropInfoNoteText}>
                      This product will include comprehensive traceability information from your crop management data.
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Delivery Timeframe */}
            <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
              <Ionicons name="time" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Delivery Timeframe</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.label}>When can you deliver this product?</Text>
            <View style={styles.timeframeContainer}>
              {deliveryTimeframeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.timeframeButton,
                    deliveryTimeframe === option.id && styles.timeframeButtonActive,
                  ]}
                  onPress={() => setDeliveryTimeframe(option.id)}
                >
                  <Text
                    style={[
                      styles.timeframeButtonText,
                      deliveryTimeframe === option.id && styles.timeframeButtonTextActive,
                    ]}
                  >
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.deliveryTimeframe ? (
              <Text style={styles.errorText}>{errors.deliveryTimeframe}</Text>
            ) : null}

            {/* Auto-calculation note for crop-based pre-listing */}
            {cropData && (
              <View style={styles.autoCalculationNote}>
                <Ionicons name="information-circle" size={16} color={colors.info} />
                <Text style={styles.autoCalculationText}>
                  Delivery timeframe is automatically calculated based on your harvest date ({new Date(traceabilityInfo.harvestDate).toLocaleDateString()}). You can change it manually if needed.
                </Text>
              </View>
            )}

            {/* Price and Stock */}
            <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
              <Ionicons name="pricetag" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Price (₹)"
                  placeholder="Enter price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  error={errors.price}
                  touched={true}
                />
              </View>

              <View style={styles.halfInput}>
                <Input
                  label="Discounted Price (₹) (Optional)"
                  placeholder="Enter discounted price"
                  value={discountedPrice}
                  onChangeText={setDiscountedPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Expected Stock Quantity"
                  placeholder="Enter expected quantity"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  error={errors.stock}
                  touched={true}
                  helperText="Estimated quantity you expect to harvest"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitsContainer}>
                  {['kg', 'quintal', 'ton', 'g', 'l', 'ml', 'unit', 'bag', 'box'].map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        stockUnit === unit && styles.unitButtonActive,
                      ]}
                      onPress={() => setStockUnit(unit as StockQuantityUnit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          stockUnit === unit && styles.unitButtonTextActive,
                        ]}
                      >
                        {unit.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Images */}
            <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
              <Ionicons name="images" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Product Images</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="add" size={24} color={colors.primary} />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
            {errors.images ? (
              <Text style={styles.errorText}>{errors.images}</Text>
            ) : null}

            {/* Location */}
            <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Product Location</Text>
            </View>
            <View style={styles.divider} />

            {location ? (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.locationText}>{location.address}</Text>
                <TouchableOpacity onPress={handleGetLocation}>
                  <Text style={styles.updateLocationText}>Update</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.getLocationButton}
                onPress={handleGetLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="location" size={20} color={colors.white} />
                    <Text style={styles.getLocationText}>Get Current Location</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {errors.location ? (
              <Text style={styles.errorText}>{errors.location}</Text>
            ) : null}

            {/* Negotiated Price (for produce category only) */}
            {category === 'produce' && (
              <>
                <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
                  <Ionicons name="cash" size={24} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Negotiation Settings</Text>
                </View>
                <View style={styles.divider} />

                <Input
                  label="Negotiated Price (₹) (Hidden from buyers)"
                  placeholder="Enter your minimum acceptable price"
                  value={negotiatedPrice}
                  onChangeText={setNegotiatedPrice}
                  keyboardType="numeric"
                  helperText="This is the minimum price you're willing to accept during negotiations. It will not be shown to buyers."
                />

                {category === 'produce' && (
                  <Input
                    label="Minimum Order Quantity (kg)"
                    placeholder="Enter minimum order quantity"
                    value={minimumOrderQuantity}
                    onChangeText={setMinimumOrderQuantity}
                    keyboardType="numeric"
                    helperText="Buyers must order at least this amount to purchase your product."
                  />
                )}

                {category === 'produce' && (
                  <>
                    <Text style={styles.label}>Ripeness</Text>
                    <View style={styles.categoriesContainer}>
                      {['ripe', 'unripe', 'slightly_unripe', 'overripe'].map((ripe) => {
                        const ripeName = ripe.replace('_', ' ');
                        return (
                          <TouchableOpacity
                            key={ripe}
                            style={[
                              styles.categoryButton,
                              ripeness === ripe && styles.categoryButtonActive,
                            ]}
                            onPress={() => setRipeness(ripe as ProduceRipeness)}
                          >
                            <Text
                              style={[
                                styles.categoryButtonText,
                                ripeness === ripe && styles.categoryButtonTextActive,
                              ]}
                            >
                              {ripeName.charAt(0).toUpperCase() + ripeName.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </>
            )}

            {/* Traceability Section */}
            {userProfile?.role === 'farmer' && (
              <>
                <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
                  <Ionicons name="git-branch" size={24} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Traceability Information</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.traceabilitySection}>
                  <View style={styles.traceabilityHeader}>
                    <Text style={styles.traceabilityTitle}>
                      Enable traceability information {category === 'produce' && <Text style={styles.requiredStar}>*</Text>}
                    </Text>
                    {category !== 'produce' && (
                      <TouchableOpacity
                        style={[
                          styles.traceabilityToggle,
                          enableTraceability && styles.traceabilityToggleActive
                        ]}
                        onPress={() => setEnableTraceability(!enableTraceability)}
                      >
                        <View style={[
                          styles.toggleCircle,
                          enableTraceability && styles.toggleCircleActive
                        ]} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.traceabilityDescription}>
                    Provide information about your farm and harvesting practices to build trust with buyers.
                    {category === 'produce' && ' Required for produce category.'}
                  </Text>

                  {enableTraceability && (
                    <View style={styles.traceabilityContainer}>
                      <Input
                        label="Farm Name"
                        placeholder="Enter your farm name"
                        value={traceabilityInfo.farmName}
                        onChangeText={(value) => setTraceabilityInfo({...traceabilityInfo, farmName: value})}
                      />

                      <Input
                        label="Farming Practices"
                        placeholder="Describe your farming practices"
                        value={traceabilityInfo.farmingPractices}
                        onChangeText={(value) => setTraceabilityInfo({...traceabilityInfo, farmingPractices: value})}
                        multiline
                        numberOfLines={3}
                      />

                      <Input
                        label="Farm Location"
                        placeholder="Enter your farm location"
                        value={traceabilityInfo.farmLocation}
                        onChangeText={(value) => setTraceabilityInfo({...traceabilityInfo, farmLocation: value})}
                      />

                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowHarvestDatePicker(true)}
                      >
                        <Text style={styles.inputLabel}>Harvest Date</Text>
                        <View style={styles.dateDisplay}>
                          <Text style={styles.dateText}>
                            {traceabilityInfo.harvestDate.toLocaleDateString()}
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        </View>
                      </TouchableOpacity>

                      {showHarvestDatePicker && (
                        <DateTimePicker
                          value={traceabilityInfo.harvestDate}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowHarvestDatePicker(false);
                            if (selectedDate) {
                              setTraceabilityInfo({...traceabilityInfo, harvestDate: selectedDate});

                              // Update delivery timeframe options and auto-select
                              const newOptions = getDeliveryTimeframeOptions(selectedDate);
                              setDeliveryTimeframeOptions(newOptions);

                              const suggestedTimeframe = calculateDeliveryTimeframe(selectedDate);
                              setDeliveryTimeframe(suggestedTimeframe);
                            }
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Submit Button */}
            <View style={styles.submitButtonContainer}>
              <Button
                title="Add Prelisted Product"
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                style={styles.submitButton}
                leftIcon={
                  !loading && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  )
                }
              />
              <Text style={styles.submitNote}>
                Your product will be listed as a prelisted product until the end date
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  cardContainer: {
    padding: spacing.md,
  },
  formCard: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  categoryButtonTextActive: {
    color: colors.white,
  },
  timeframeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  timeframeButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeframeButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  timeframeButtonTextActive: {
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  halfInput: {
    width: '48%',
  },
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  submitButtonContainer: {
    marginTop: spacing.lg,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  submitNote: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 2,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  addImageText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
  },
  updateLocationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  getLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  getLocationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  // Traceability styles
  traceabilitySection: {
    marginBottom: spacing.md,
  },
  traceabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  traceabilityTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  requiredStar: {
    color: colors.error,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
  },
  traceabilityToggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightGray,
    padding: 2,
    justifyContent: 'center',
  },
  traceabilityToggleActive: {
    backgroundColor: colors.primary,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  traceabilityDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  traceabilityContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  datePickerButton: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Crop information styles
  cropInfoContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  cropInfoTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cropInfoSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
    marginBottom: spacing.md,
  },
  traceabilityPreview: {
    marginBottom: spacing.md,
  },
  traceabilityPreviewTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  traceabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  traceabilityItemText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  cropInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  cropInfoNoteText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.info,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
  // Auto-calculation note styles
  autoCalculationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  autoCalculationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.info,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
});

export default AddPrelistedProductScreen;