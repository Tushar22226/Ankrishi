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
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { Product, ProductCategory, ProductSubcategory, ProductImage, StockQuantityUnit, ProduceRipeness } from '../../models/Product';
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
const subcategories = {
  fertilizer: [
    { id: 'organic', name: 'Organic' },
    { id: 'chemical', name: 'Chemical' },
    { id: 'biofertilizer', name: 'Bio-fertilizer' },
  ],
  equipment: [
    { id: 'tractor', name: 'Tractor' },
    { id: 'harvester', name: 'Harvester' },
    { id: 'irrigation', name: 'Irrigation' },
    { id: 'drone', name: 'Drone' },
    { id: 'sensor', name: 'Sensor' },
    { id: 'tools', name: 'Tools' },
  ],
  produce: [
    { id: 'fruits', name: 'Fruits' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'grains', name: 'Grains' },
    { id: 'pulses', name: 'Pulses' },
    { id: 'spices', name: 'Spices' },
  ],
};

const EditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get product ID from route params
  const { productId } = route.params as { productId: string };

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
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  // Load product data on component mount
  useEffect(() => {
    loadProductData();
  }, [productId]);

  // Load product data
  const loadProductData = async () => {
    try {
      setLoading(true);

      // Get product details
      const product = await MarketplaceService.getProduct(productId);

      if (!product) {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
        return;
      }

      // Check if the current user is the owner of the product
      if (userProfile?.uid !== product.sellerId) {
        Alert.alert('Error', 'You can only edit your own products');
        navigation.goBack();
        return;
      }

      // Set original product
      setOriginalProduct(product);

      // Set form values
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setSubcategory(product.subcategory);
      setPrice(product.price.toString());
      setDiscountedPrice(product.discountedPrice?.toString() || '');
      setStock(product.stock.toString());
      setStockUnit(product.stockUnit || 'kg');
      setExistingImages(product.images || []);
      setTags(product.tags?.join(', ') || '');
      setLocation(product.location);
      // Set ripeness if product is produce
      if (product.category === 'produce' && 'ripeness' in product) {
        setRipeness(product.ripeness || '');
      }

    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert('Error', 'Failed to load product data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle remove existing image
  const handleRemoveExistingImage = (index: number) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  // Handle location detection
  const handleDetectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your location');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
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
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!name) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }

    if (!description) {
      newErrors.description = 'Product description is required';
      isValid = false;
    }

    if (!category) {
      newErrors.category = 'Product category is required';
      isValid = false;
    }

    if (!subcategory) {
      newErrors.subcategory = 'Product subcategory is required';
      isValid = false;
    }

    if (!price) {
      newErrors.price = 'Product price is required';
      isValid = false;
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Product price must be a positive number';
      isValid = false;
    }

    if (discountedPrice && (isNaN(Number(discountedPrice)) || Number(discountedPrice) <= 0)) {
      newErrors.discountedPrice = 'Discounted price must be a positive number';
      isValid = false;
    }

    if (discountedPrice && Number(discountedPrice) >= Number(price)) {
      newErrors.discountedPrice = 'Discounted price must be less than regular price';
      isValid = false;
    }

    if (!stock) {
      newErrors.stock = 'Product stock is required';
      isValid = false;
    } else if (isNaN(Number(stock)) || Number(stock) < 0) {
      newErrors.stock = 'Product stock must be a non-negative number';
      isValid = false;
    }

    if (existingImages.length === 0 && images.length === 0) {
      newErrors.images = 'At least one product image is required';
      isValid = false;
    }

    if (!location) {
      newErrors.location = 'Product location is required';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      // Scroll to the top to show errors
      return;
    }

    // Submit form
    setSubmitting(true);

    try {
      // Upload new images to Firebase Storage
      const uploadedNewImages = await Promise.all(
        images.map(async (uri, index) => {
          try {
            // Convert URI to blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Upload to Firebase Storage
            return await MarketplaceService.uploadProductImage(blob, productId, index === 0 && existingImages.length === 0);
          } catch (error) {
            console.error('Error uploading image:', error);
            // Fallback to local URI if upload fails
            return {
              url: uri,
              isMain: index === 0 && existingImages.length === 0,
              uploadedAt: Date.now(),
            };
          }
        })
      );

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedNewImages];

      // Create the updated product object
      const updatedProduct: Partial<Product> = {
        name,
        description,
        category: category as ProductCategory,
        subcategory: subcategory as ProductSubcategory,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
        stock: Number(stock),
        stockUnit,
        images: allImages,
        location: location!,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        // Add ripeness for produce category
        ...(category === 'produce' && ripeness ? { ripeness } : {}),
      };

      // Update the product in Firebase
      await MarketplaceService.updateProduct(productId, updatedProduct);

      setSubmitting(false);
      Alert.alert(
        'Success',
        'Product updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('UserProducts' as never);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating product:', error);
      setSubmitting(false);
      Alert.alert('Error', 'Failed to update product');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }

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

          <Text style={styles.title}>Edit Product</Text>

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
              style={styles.textArea}
            />

            {/* Category Selection */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {productCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.selectedCategoryButton,
                  ]}
                  onPress={() => {
                    setCategory(cat.id as ProductCategory);
                    setSubcategory(''); // Reset subcategory when category changes
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.id ? colors.white : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.selectedCategoryText,
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
                <Text style={[styles.label, { marginTop: spacing.md }]}>Subcategory</Text>
                <View style={styles.subcategoryContainer}>
                  {subcategories[category].map((subcat) => (
                    <TouchableOpacity
                      key={subcat.id}
                      style={[
                        styles.subcategoryButton,
                        subcategory === subcat.id && styles.selectedSubcategoryButton,
                      ]}
                      onPress={() => setSubcategory(subcat.id)}
                    >
                      <Text
                        style={[
                          styles.subcategoryText,
                          subcategory === subcat.id && styles.selectedSubcategoryText,
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
                    <Text style={[styles.label, { marginTop: spacing.md }]}>Ripeness Level</Text>
                    <View style={styles.subcategoryContainer}>
                      {(['ripe', 'unripe', 'slightly_unripe', 'overripe'] as const).map((ripenessOption) => (
                        <TouchableOpacity
                          key={ripenessOption}
                          style={[
                            styles.subcategoryButton,
                            ripeness === ripenessOption && styles.selectedSubcategoryButton,
                          ]}
                          onPress={() => setRipeness(ripenessOption)}
                        >
                          <Text
                            style={[
                              styles.subcategoryText,
                              ripeness === ripenessOption && styles.selectedSubcategoryText,
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
            <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
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
                  error={errors.discountedPrice}
                  touched={true}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Stock Quantity"
                  placeholder="Enter stock quantity"
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

            {/* Images */}
            <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              <Ionicons name="images" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Product Images</Text>
            </View>
            <View style={styles.divider} />

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <View style={styles.imagesContainer}>
                <Text style={styles.imagesLabel}>Current Images:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {existingImages.map((image, index) => (
                    <View key={`existing-${index}`} style={styles.imageContainer}>
                      <Image source={{ uri: image.url }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveExistingImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                      {image.isMain && (
                        <View style={styles.mainImageBadge}>
                          <Text style={styles.mainImageText}>Main</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* New Images */}
            {images.length > 0 && (
              <View style={styles.imagesContainer}>
                <Text style={styles.imagesLabel}>New Images:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((image, index) => (
                    <View key={`new-${index}`} style={styles.imageContainer}>
                      <Image source={{ uri: image }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleSelectImage}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
            {errors.images ? (
              <Text style={styles.errorText}>{errors.images}</Text>
            ) : null}

            {/* Location */}
            <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>
                {location
                  ? location.address
                  : 'No location selected'}
              </Text>
              <TouchableOpacity
                style={styles.detectLocationButton}
                onPress={handleDetectLocation}
              >
                <Ionicons name="locate" size={20} color={colors.white} />
                <Text style={styles.detectLocationText}>Detect Location</Text>
              </TouchableOpacity>
            </View>
            {errors.location ? (
              <Text style={styles.errorText}>{errors.location}</Text>
            ) : null}

            {/* Tags */}
            <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              <Ionicons name="pricetags" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Tags</Text>
            </View>
            <View style={styles.divider} />

            <Input
              label="Tags (comma separated)"
              placeholder="e.g. organic, fresh, seasonal"
              value={tags}
              onChangeText={setTags}
            />

            {/* Submit Button */}
            <View style={styles.submitButtonContainer}>
              <Button
                title="Update Product"
                onPress={handleSubmit}
                loading={submitting}
                fullWidth
                style={styles.submitButton}
                leftIcon={
                  !submitting && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  )
                }
              />
              <Text style={styles.submitNote}>
                Your updated product will be reviewed before being listed on the marketplace
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
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.xs,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  selectedCategoryText: {
    color: colors.white,
  },
  subcategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  subcategoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedSubcategoryButton: {
    backgroundColor: colors.primaryLight,
  },
  subcategoryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  selectedSubcategoryText: {
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
    marginBottom: spacing.md,
  },
  imagesLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainImageText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  addImageText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  detectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Unit selection styles
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
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
    borderRadius: borderRadius.md,
  },
  detectLocationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  submitButtonContainer: {
    marginTop: spacing.lg,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  submitNote: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
});

export default EditProductScreen;
