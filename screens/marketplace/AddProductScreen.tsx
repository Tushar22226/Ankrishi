import React, { useState } from 'react';
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
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
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

// Product categories
const productCategories = [
  { id: 'fertilizer', name: 'Fertilizer', icon: 'leaf' },
  { id: 'equipment', name: 'Equipment', icon: 'construct' },
  { id: 'produce', name: 'Produce', icon: 'nutrition' },
];

// Subcategories by category
const subcategories: Record<ProductCategory, { id: string; name: string }[]> = {
  fertilizer: [
    { id: 'organic', name: 'Organic' },
    { id: 'chemical', name: 'Chemical' },
    { id: 'biofertilizer', name: 'Bio-fertilizer' },
    { id: 'micronutrient', name: 'Micronutrient' },
  ],
  equipment: [
    { id: 'tractor', name: 'Tractor' },
    { id: 'harvester', name: 'Harvester' },
    { id: 'irrigation', name: 'Irrigation' },
    { id: 'tools', name: 'Tools' },
    { id: 'other', name: 'Other' },
  ],
  produce: [
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'fruits', name: 'Fruits' },
    { id: 'grains', name: 'Grains' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'other', name: 'Other' },
  ],
};

const AddProductScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { userProfile } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState<StockQuantityUnit>('kg');
  const [ripeness, setRipeness] = useState<ProduceRipeness | ''>('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  // Scientific verification state
  const [isScientificallyVerified, setIsScientificallyVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('');
  const [verificationResults, setVerificationResults] = useState<{
    parameter: string;
    value: string;
    unit?: string;
    standardValue?: string;
    isPassing: boolean;
  }[]>([]);
  const [verificationDate, setVerificationDate] = useState(new Date());
  const [verifiedBy, setVerifiedBy] = useState('');
  const [verificationCertificateUrl, setVerificationCertificateUrl] = useState('');

  // Certification state
  const [certifications, setCertifications] = useState<{
    type: string;
    isSelected: boolean;
  }[]>([
    { type: 'organic', isSelected: false },
    { type: 'natural_farming', isSelected: false },
    { type: 'gmo_free', isSelected: false },
    { type: 'pesticide_free', isSelected: false },
    { type: 'fair_trade', isSelected: false },
    { type: 'aacc', isSelected: false },
  ]);

  // AACC certification details
  const [aaccDetails, setAaccDetails] = useState({
    certificateNumber: '',
    grade: 'A' as 'A+' | 'A' | 'B+' | 'B' | 'C',
    qualityScore: '85',
    safetyScore: '90',
    authenticityVerified: true,
    testingLab: '',
    testingDate: new Date(),
    standardsCompliance: ['Food Safety', 'Quality Assurance'],
    showDatePicker: false,
  });

  // Product journey state
  const [enableProductJourney, setEnableProductJourney] = useState(false);
  const [journeyStages, setJourneyStages] = useState<{
    stageName: string;
    description: string;
  }[]>([
    { stageName: 'Harvesting', description: '' },
    { stageName: 'Processing', description: '' },
    { stageName: 'Packaging', description: '' },
    { stageName: 'Distribution', description: '' },
  ]);

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
  });

  // Handle image selection
  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add the selected image to the images array
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle location detection
  const handleDetectLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your location');
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = `${geocode[0].district || ''}, ${geocode[0].city || ''}, ${geocode[0].region || ''}, ${geocode[0].postalCode || ''}`;

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address.trim(),
        });
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert('Error', 'Failed to detect location');
    } finally {
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

    if (!price) {
      newErrors.price = 'Product price is required';
      isValid = false;
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
      isValid = false;
    } else {
      newErrors.price = '';
    }

    if (!stock) {
      newErrors.stock = 'Product stock is required';
      isValid = false;
    } else if (isNaN(Number(stock)) || Number(stock) <= 0) {
      newErrors.stock = 'Stock must be a positive number';
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

    // Validate verification results if scientific verification is enabled
    if (isScientificallyVerified) {
      if (!verificationMethod.trim()) {
        newErrors.verificationMethod = 'Please enter a verification method';
        isValid = false;
      } else {
        newErrors.verificationMethod = '';
      }

      if (verificationResults.length === 0) {
        newErrors.verificationResults = 'Please add at least one test result';
        isValid = false;
      } else {
        const invalidResults = verificationResults.some(
          result => !result.parameter.trim() || !result.value.trim()
        );
        if (invalidResults) {
          newErrors.verificationResults = 'Please complete all test result fields';
          isValid = false;
        } else {
          newErrors.verificationResults = '';
        }
      }
    }

    // Validate journey stages if product journey is enabled
    if (enableProductJourney) {
      const invalidStages = journeyStages.some(stage => !stage.description.trim());
      if (invalidStages) {
        newErrors.journeyStages = 'Please complete all journey stage descriptions';
        isValid = false;
      } else {
        newErrors.journeyStages = '';
      }
    }

    // Validate AACC certification details if AACC is selected
    const aaccSelected = certifications.find(cert => cert.type === 'aacc')?.isSelected;
    if (aaccSelected) {
      if (!aaccDetails.certificateNumber.trim()) {
        newErrors.aaccCertificateNumber = 'AACC certificate number is required';
        isValid = false;
      } else {
        newErrors.aaccCertificateNumber = '';
      }

      if (!aaccDetails.testingLab.trim()) {
        newErrors.aaccTestingLab = 'Testing laboratory name is required';
        isValid = false;
      } else {
        newErrors.aaccTestingLab = '';
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
        // Add ripeness for produce category
        ...(category === 'produce' && ripeness ? { ripeness } : {}),
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

        // Add certifications if any selected
        certifications: certifications.filter(cert => cert.isSelected).length > 0 ?
          certifications.filter(cert => cert.isSelected).map(cert => {
            const certData = {
              type: cert.type as CertificationType,
              issuedBy: userProfile?.displayName || 'Self-certified',
              issuedDate: Date.now(),
              expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year validity
              verificationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
            };

            // Add AACC specific details if this is an AACC certification
            if (cert.type === 'aacc') {
              return {
                ...certData,
                aaccDetails: {
                  certificateNumber: aaccDetails.certificateNumber,
                  grade: aaccDetails.grade,
                  qualityScore: Number(aaccDetails.qualityScore),
                  safetyScore: Number(aaccDetails.safetyScore),
                  authenticityVerified: aaccDetails.authenticityVerified,
                  testingLab: aaccDetails.testingLab,
                  testingDate: aaccDetails.testingDate.getTime(),
                  standardsCompliance: aaccDetails.standardsCompliance,
                  qrCodeUrl: `https://farmconnect.com/verify/${aaccDetails.certificateNumber}`,
                }
              };
            }

            return certData;
          }) : undefined,

        // Add product journey if enabled
        productJourney: enableProductJourney ? {
          journeyId: Math.random().toString(36).substring(2, 15),
          stages: journeyStages.map((stage, index) => ({
            stageName: stage.stageName,
            location: location!, // Use the product location for all stages for now
            timestamp: Date.now() - ((journeyStages.length - index) * 24 * 60 * 60 * 1000), // Simulate past dates
            handledBy: userProfile?.displayName || 'Unknown',
            description: stage.description,
          })),
          qrCodeUrl: '', // This would be generated by a backend service
        } : undefined,
      };

      // Add the product to Firebase
      await MarketplaceService.addProduct(product);

      setLoading(false);
      Alert.alert(
        'Success',
        'Product added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MarketplaceMain'),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding product:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>


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

          <Text style={styles.label}>Description</Text>
          <View style={styles.descriptionContainer}>
            <TextInput
              placeholder="Enter product description (e.g. quality, benefits, usage)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              style={styles.descriptionInput}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}

          {/* Category Selection */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="apps" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Product Category</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.label}>Select Category</Text>
          <View style={styles.categoryContainer}>
            {productCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.activeCategoryButton,
                ]}
                onPress={() => {
                  setCategory(cat.id as ProductCategory);
                  setSubcategory('');
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={24}
                  color={category === cat.id ? colors.primary : colors.mediumGray}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.id && styles.activeCategoryText,
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

          {/* Subcategory Selection */}
          {category && (
            <>
              <Text style={styles.label}>Subcategory</Text>
              <View style={styles.subcategoryContainer}>
                {subcategories[category as ProductCategory].map((subcat) => (
                  <TouchableOpacity
                    key={subcat.id}
                    style={[
                      styles.subcategoryButton,
                      subcategory === subcat.id && styles.activeSubcategoryButton,
                    ]}
                    onPress={() => setSubcategory(subcat.id)}
                  >
                    <Text
                      style={[
                        styles.subcategoryText,
                        subcategory === subcat.id && styles.activeSubcategoryText,
                      ]}
                    >
                      {subcat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.subcategory ? (
                <Text style={styles.errorText}>{errors.subcategory}</Text>
              ) : null}

              {/* Ripeness Selection for Produce */}
              {category === 'produce' && (subcategory === 'fruits' || subcategory === 'vegetables') && (
                <>
                  <Text style={styles.label}>Ripeness Level</Text>
                  <View style={styles.subcategoryContainer}>
                    {(['ripe', 'unripe', 'slightly_unripe', 'overripe'] as const).map((ripenessOption) => (
                      <TouchableOpacity
                        key={ripenessOption}
                        style={[
                          styles.subcategoryButton,
                          ripeness === ripenessOption && styles.activeSubcategoryButton,
                        ]}
                        onPress={() => setRipeness(ripenessOption)}
                      >
                        <Text
                          style={[
                            styles.subcategoryText,
                            ripeness === ripenessOption && styles.activeSubcategoryText,
                          ]}
                        >
                          {ripenessOption === 'ripe' ? 'Ripe' :
                           ripenessOption === 'unripe' ? 'Unripe' :
                           ripenessOption === 'slightly_unripe' ? 'Slightly Unripe' :
                           'Overripe'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
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
                label="Stock Quantity"
                placeholder="Enter available quantity"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                error={errors.stock}
                touched={true}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.unitOptions}>
                    {['kg', 'quintal', 'ton', 'piece', 'dozen', 'box', 'packet'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[styles.unitOption, stockUnit === unit && styles.selectedUnitOption]}
                        onPress={() => setStockUnit(unit as StockQuantityUnit)}
                      >
                        <Text style={[styles.unitText, stockUnit === unit && styles.selectedUnitText]}>
                          {unit === 'kg' ? 'Kilogram' :
                           unit === 'quintal' ? 'Quintal (100 kg)' :
                           unit === 'ton' ? 'Ton (1000 kg)' :
                           unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Product Images */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="images" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Product Images</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.label}>Add up to 5 images (tap to add)</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.mainImageBadge}>
                    <Text style={styles.mainImageText}>Main</Text>
                  </View>
                )}
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImage}
              >
                <Ionicons name="camera" size={30} color={colors.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
          {errors.images ? (
            <Text style={styles.errorText}>{errors.images}</Text>
          ) : (
            <Text style={styles.helperText}>First image will be the main product image</Text>
          )}

          {/* Additional Information */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>
          <View style={styles.divider} />

          {/* Tags */}
          <Input
            label="Tags (Comma Separated)"
            placeholder="e.g. organic, fertilizer, premium"
            value={tags}
            onChangeText={setTags}
          />
          <Text style={styles.helperText}>Add tags to help buyers find your product</Text>

          {/* Transparency Information (Only for Farmers) */}
          {userProfile?.role === 'farmer' && (
            <View style={styles.transparencySection}>
              <Text style={styles.sectionTitle}>Transparency Information</Text>
              <Text style={styles.transparencyDescription}>
                Adding transparency information helps buyers trust your products and increases sales.
              </Text>

              <View style={styles.transparencyBadge}>
                <Ionicons name="leaf" size={20} color={colors.white} />
                <Text style={styles.transparencyBadgeText}>Direct from Farmer</Text>
              </View>

              <Text style={styles.transparencyNote}>
                Your product will be listed as "Direct from Farmer" with 0% commission.
              </Text>
            </View>
          )}

          {/* Scientific Verification */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Scientific Verification</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.verificationContainer}>
            <View style={styles.verificationHeader}>
              <Text style={styles.verificationTitle}>
                Verify product quality with scientific testing
              </Text>
              <TouchableOpacity
                style={[
                  styles.verificationToggle,
                  isScientificallyVerified && styles.verificationToggleActive
                ]}
                onPress={() => setIsScientificallyVerified(!isScientificallyVerified)}
              >
                <View style={[
                  styles.toggleCircle,
                  isScientificallyVerified && styles.toggleCircleActive
                ]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.verificationDescription}>
              Scientifically verified products get 30% more views and sell faster.
            </Text>

            {isScientificallyVerified && (
              <View style={styles.verificationForm}>
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Verification Method"
                      placeholder="e.g. Lab Testing, Quality Certification"
                      value={verificationMethod}
                      onChangeText={setVerificationMethod}
                      error={errors.verificationMethod}
                      touched={true}
                    />
                  </View>

                  <View style={styles.halfInput}>
                    <Input
                      label="Verified By"
                      placeholder="e.g. Lab Name, Institution"
                      value={verifiedBy}
                      onChangeText={setVerifiedBy}
                    />
                  </View>
                </View>

                <Input
                  label="Certificate URL (Optional)"
                  placeholder="e.g. https://example.com/certificate.pdf"
                  value={verificationCertificateUrl}
                  onChangeText={setVerificationCertificateUrl}
                />

                <Text style={styles.label}>Test Results</Text>

                {verificationResults.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultRow}>
                      <Input
                        label="Parameter"
                        placeholder="e.g. Protein Content"
                        value={result.parameter}
                        onChangeText={(text) => {
                          const newResults = [...verificationResults];
                          newResults[index].parameter = text;
                          setVerificationResults(newResults);
                        }}
                        containerStyle={styles.resultInput}
                      />

                      <Input
                        label="Value"
                        placeholder="e.g. 12.5"
                        value={result.value}
                        onChangeText={(text) => {
                          const newResults = [...verificationResults];
                          newResults[index].value = text;
                          setVerificationResults(newResults);
                        }}
                        containerStyle={styles.resultInput}
                      />

                      <Input
                        label="Unit"
                        placeholder="e.g. %"
                        value={result.unit}
                        onChangeText={(text) => {
                          const newResults = [...verificationResults];
                          newResults[index].unit = text;
                          setVerificationResults(newResults);
                        }}
                        containerStyle={styles.resultUnitInput}
                      />
                    </View>

                    <View style={styles.resultRow}>
                      <Input
                        label="Standard Value (Optional)"
                        placeholder="e.g. Min 10%"
                        value={result.standardValue}
                        onChangeText={(text) => {
                          const newResults = [...verificationResults];
                          newResults[index].standardValue = text;
                          setVerificationResults(newResults);
                        }}
                        containerStyle={[styles.resultInput, { flex: 2 }]}
                      />

                      <View style={[styles.resultInput, { flex: 1, justifyContent: 'flex-end' }]}>
                        <Text style={styles.passFailLabel}>Status</Text>
                        <TouchableOpacity
                          style={[styles.passFailButton, result.isPassing ? styles.passingButton : styles.failingButton]}
                          onPress={() => {
                            const newResults = [...verificationResults];
                            newResults[index].isPassing = !newResults[index].isPassing;
                            setVerificationResults(newResults);
                          }}
                        >
                          <Text style={styles.passFailText}>
                            {result.isPassing ? 'PASS' : 'FAIL'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.removeResultButton}
                      onPress={() => {
                        const newResults = [...verificationResults];
                        newResults.splice(index, 1);
                        setVerificationResults(newResults);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                {errors.verificationResults ? (
                  <Text style={styles.errorText}>{errors.verificationResults}</Text>
                ) : null}

                <Button
                  title="Add Test Result"
                  variant="outline"
                  size="small"
                  onPress={() => {
                    setVerificationResults([
                      ...verificationResults,
                      { parameter: '', value: '', unit: '', standardValue: '', isPassing: true }
                    ]);
                  }}
                  leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
                  style={styles.addResultButton}
                />
              </View>
            )}
          </View>

          {/* Certifications */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="ribbon" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Certifications</Text>
          </View>
          <View style={styles.divider} />

          <Text style={styles.label}>Select applicable certifications</Text>
          <View style={styles.certificationsContainer}>
            {certifications.map((cert, index) => (
              <TouchableOpacity
                key={cert.type}
                style={[
                  styles.certificationButton,
                  cert.isSelected && styles.certificationButtonActive
                ]}
                onPress={() => {
                  const newCertifications = [...certifications];
                  newCertifications[index].isSelected = !newCertifications[index].isSelected;
                  setCertifications(newCertifications);
                }}
              >
                <View style={styles.certCheckbox}>
                  {cert.isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
                <Text style={[
                  styles.certificationText,
                  cert.isSelected && styles.certificationTextActive
                ]}>
                  {cert.type.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>
            Certified products appear in special categories and get premium visibility
          </Text>

          {/* AACC Certification Details */}
          {certifications.find(cert => cert.type === 'aacc')?.isSelected && (
            <View style={styles.aaccContainer}>
              <View style={styles.aaccHeader}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                <Text style={styles.aaccTitle}>AACC Certification Details</Text>
              </View>

              <Text style={styles.aaccDescription}>
                Agricultural and Allied Commodities Certification (AACC) verifies the quality, safety, and authenticity of your products.
              </Text>

              <Input
                label="Certificate Number"
                placeholder="Enter AACC certificate number"
                value={aaccDetails.certificateNumber}
                onChangeText={(text) => setAaccDetails({...aaccDetails, certificateNumber: text})}
                error={errors.aaccCertificateNumber}
                touched={true}
              />

              <Text style={styles.label}>Certificate Grade</Text>
              <View style={styles.gradeContainer}>
                {(['A+', 'A', 'B+', 'B', 'C'] as const).map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.gradeButton,
                      aaccDetails.grade === grade && styles.activeGradeButton
                    ]}
                    onPress={() => setAaccDetails({...aaccDetails, grade})}
                  >
                    <Text style={[
                      styles.gradeText,
                      aaccDetails.grade === grade && styles.activeGradeText
                    ]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Quality Score (0-100)"
                    placeholder="e.g., 85"
                    value={aaccDetails.qualityScore}
                    onChangeText={(text) => setAaccDetails({...aaccDetails, qualityScore: text})}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    label="Safety Score (0-100)"
                    placeholder="e.g., 90"
                    value={aaccDetails.safetyScore}
                    onChangeText={(text) => setAaccDetails({...aaccDetails, safetyScore: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label="Testing Laboratory"
                placeholder="Enter the name of the testing lab"
                value={aaccDetails.testingLab}
                onChangeText={(text) => setAaccDetails({...aaccDetails, testingLab: text})}
                error={errors.aaccTestingLab}
                touched={true}
              />

              <Text style={styles.label}>Testing Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setAaccDetails({...aaccDetails, showDatePicker: true})}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                <Text style={styles.dateText}>
                  {aaccDetails.testingDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Standards Compliance</Text>
              <View style={styles.standardsContainer}>
                {['Food Safety', 'Quality Assurance', 'Organic', 'Sustainable', 'Fair Trade'].map((standard) => (
                  <TouchableOpacity
                    key={standard}
                    style={[
                      styles.standardButton,
                      aaccDetails.standardsCompliance.includes(standard) && styles.activeStandardButton
                    ]}
                    onPress={() => {
                      const updatedStandards = aaccDetails.standardsCompliance.includes(standard)
                        ? aaccDetails.standardsCompliance.filter(s => s !== standard)
                        : [...aaccDetails.standardsCompliance, standard];
                      setAaccDetails({...aaccDetails, standardsCompliance: updatedStandards});
                    }}
                  >
                    <Text style={[
                      styles.standardText,
                      aaccDetails.standardsCompliance.includes(standard) && styles.activeStandardText
                    ]}>
                      {standard}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.authenticityContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAaccDetails({...aaccDetails, authenticityVerified: !aaccDetails.authenticityVerified})}
                >
                  <View style={[styles.checkboxBox, aaccDetails.authenticityVerified && styles.checkboxChecked]}>
                    {aaccDetails.authenticityVerified && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Authenticity Verified</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Product Journey Tracking */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="git-network" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Product Journey Tracking</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.journeyContainer}>
            <View style={styles.journeyHeader}>
              <Text style={styles.journeyTitle}>
                Enable product journey tracking
              </Text>
              <TouchableOpacity
                style={[
                  styles.journeyToggle,
                  enableProductJourney && styles.journeyToggleActive
                ]}
                onPress={() => setEnableProductJourney(!enableProductJourney)}
              >
                <View style={[
                  styles.toggleCircle,
                  enableProductJourney && styles.toggleCircleActive
                ]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.journeyDescription}>
              Let customers trace the journey of your product from farm to table.
            </Text>

            {enableProductJourney && (
              <View style={styles.journeyForm}>
                {journeyStages.map((stage, index) => (
                  <View key={index} style={styles.stageItem}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageNumberContainer}>
                        <Text style={styles.stageNumber}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stageName}>{stage.stageName}</Text>
                    </View>

                    <TextInput
                      placeholder={`Describe the ${stage.stageName.toLowerCase()} process`}
                      value={stage.description}
                      onChangeText={(text) => {
                        const newStages = [...journeyStages];
                        newStages[index].description = text;
                        setJourneyStages(newStages);
                      }}
                      multiline
                      style={styles.stageInput}
                    />
                  </View>
                ))}

                {errors.journeyStages ? (
                  <Text style={styles.errorText}>{errors.journeyStages}</Text>
                ) : null}

                <Button
                  title="Add Custom Stage"
                  variant="outline"
                  size="small"
                  onPress={() => {
                    setJourneyStages([
                      ...journeyStages,
                      { stageName: 'Custom Stage', description: '' }
                    ]);
                  }}
                  leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
                  style={styles.addStageButton}
                />
              </View>
            )}
          </View>

          {/* Location */}
          <View style={[styles.sectionHeader, {marginTop: spacing.md}]}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Product Location</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.locationContainer}>
            {location ? (
              <View style={styles.locationInfo}>
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location" size={20} color={colors.white} />
                </View>
                <Text style={styles.locationText}>{location.address}</Text>
              </View>
            ) : (
              <View style={styles.locationPlaceholderContainer}>
                <Ionicons name="location-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.locationPlaceholder}>
                  No location detected
                </Text>
              </View>
            )}

            <Button
              title={locationLoading ? 'Detecting...' : 'Detect Location'}
              variant="outline"
              size="small"
              onPress={handleDetectLocation}
              loading={locationLoading}
              leftIcon={
                !locationLoading && (
                  <Ionicons name="locate" size={16} color={colors.primary} />
                )
              }
            />
          </View>
          {errors.location ? (
            <Text style={styles.errorText}>{errors.location}</Text>
          ) : null}
          <Text style={styles.helperText}>Location helps buyers find products near them</Text>

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <Button
              title="Add Product"
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
              Your product will be reviewed before being listed on the marketplace
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
    padding:10,
    flexGrow: 1,
  },
  cardContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
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
    width: '100%',
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
  placeholder: {
    width: 40,
  },
  formCard: {
    width: '100%',
    maxWidth: 600,
    borderRadius: borderRadius.lg,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginBottom: spacing.md,
  },
  descriptionContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    padding: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  activeCategoryButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activeCategoryText: {
    color: colors.primary,
  },
  subcategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  subcategoryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeSubcategoryButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  subcategoryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeSubcategoryText: {
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  mainImageText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    textAlign: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  locationPlaceholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationPlaceholder: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  submitButtonContainer: {
    marginTop: spacing.md,
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
  transparencySection: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  transparencyDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  transparencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  transparencyBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  transparencyNote: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },

  // Scientific Verification Styles
  verificationContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  passFailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  passFailButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passingButton: {
    backgroundColor: colors.successLight,
  },
  failingButton: {
    backgroundColor: colors.errorLight,
  },
  passFailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  verificationTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  verificationToggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightGray,
    padding: 2,
    justifyContent: 'center',
  },
  verificationToggleActive: {
    backgroundColor: colors.primary,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  verificationDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  verificationForm: {
    marginTop: spacing.md,
  },
  resultItem: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  resultUnitInput: {
    width: 80,
  },
  removeResultButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  addResultButton: {
    marginTop: spacing.sm,
  },

  // Certification Styles
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  certificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  certificationButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  certCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  certificationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  certificationTextActive: {
    color: colors.primary,
  },

  // Product Journey Styles
  journeyContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  journeyTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  journeyToggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightGray,
    padding: 2,
    justifyContent: 'center',
  },
  journeyToggleActive: {
    backgroundColor: colors.primary,
  },
  journeyDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  journeyForm: {
    marginTop: spacing.md,
  },
  stageItem: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stageNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stageNumber: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  stageName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  stageInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    height: 80,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  addStageButton: {
    marginTop: spacing.sm,
  },

  // AACC certification styles
  aaccContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  aaccHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aaccTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  aaccDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gradeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  activeGradeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  gradeText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
  },
  activeGradeText: {
    color: colors.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  standardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  standardButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeStandardButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  standardText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeStandardText: {
    color: colors.primary,
  },
  // Unit selection styles
  pickerContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  unitOptions: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  unitOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceLight,
  },
  selectedUnitOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  unitText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  selectedUnitText: {
    color: colors.primary,
  },
  authenticityContainer: {
    marginBottom: spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
});

export default AddProductScreen;
