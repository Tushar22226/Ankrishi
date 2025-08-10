import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import database from '@react-native-firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, ParamListBase } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import CartService from '../../services/CartService';
import { Product } from '../../models/Product';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { formatStockQuantity, formatDate, formatCategoryName } from '../../utils/formatUtils';

const ProductDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get product ID from route params
  const { productId } = route.params as { productId: string };

  // State
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showNegotiateDialog, setShowNegotiateDialog] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [isMinimumQuantitySatisfied, setIsMinimumQuantitySatisfied] = useState(true);
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  // Load product details
  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  // Check if minimum quantity requirement is satisfied
  useEffect(() => {
    if (product && product.category === 'produce' && product.minimumOrderQuantity) {
      setIsMinimumQuantitySatisfied(quantity >= product.minimumOrderQuantity);
    } else {
      setIsMinimumQuantitySatisfied(true);
    }
  }, [product, quantity]);

  // Load product details from Firebase
  const loadProductDetails = async () => {
    try {
      setLoading(true);

      // Fetch the product from Firebase using MarketplaceService
      const productData = await MarketplaceService.getProduct(productId);

      if (!productData) {
        console.error('Product not found:', productId);
        Alert.alert('Error', 'Product not found');
        return;
      }

      // Ensure required fields exist to prevent runtime errors
      const sanitizedProduct = {
        ...productData,
        images: productData.images || [],
        ratings: productData.ratings || [],
        averageRating: productData.averageRating || 0,
        farmDetails: productData.farmDetails || {},
        location: productData.location || { address: 'Location not available' },
        sellerRating: productData.sellerRating || 0,
        transparencyInfo: productData.transparencyInfo || undefined
      };

      // Check seller verification status directly from the database
      try {
        const verificationSnapshot = await database().ref(`users/${sanitizedProduct.sellerId}/verification`).once('value');
        if (verificationSnapshot.exists()) {
          const verification = verificationSnapshot.val();
          sanitizedProduct.sellerVerified = verification.status === 'verified';
        }
      } catch (verificationError) {
        console.error('Error checking seller verification:', verificationError);
      }

      // Set the product data
      setProduct(sanitizedProduct);

      // Check if product is out of stock
      setIsOutOfStock(sanitizedProduct.stock <= 0);

      // If this is a direct-from-farmer product, fetch additional farmer details
      if (sanitizedProduct.isDirectFromFarmer && sanitizedProduct.sellerId) {
        try {
          const farmerData = await MarketplaceService.getFarmerProfile(sanitizedProduct.sellerId);

          if (farmerData.profile) {
            // Update the product with additional farmer details if needed
            setProduct(prevProduct => {
              if (!prevProduct) return sanitizedProduct;

              return {
                ...prevProduct,
                farmDetails: {
                  ...prevProduct.farmDetails,
                  farmName: farmerData.profile?.farmDetails?.name || farmerData.profile?.displayName || 'Farm',
                  farmingMethod: farmerData.profile?.farmDetails?.farmingMethod || 'conventional',
                  certifications: farmerData.profile?.farmDetails?.certifications || [],
                  farmerVerified: farmerData.profile?.reputation?.verifiedStatus || false,
                }
              };
            });
          }
        } catch (farmerError) {
          console.error('Error fetching farmer details:', farmerError);
          // Continue with the product display even if farmer details fail to load
        }
      }

    } catch (error) {
      console.error('Error loading product details:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      // Check if user is logged in
      if (!userProfile) {
        Alert.alert(
          'Login Required',
          'You need to login to continue with purchase',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login' as never)
            }
          ]
        );
        return;
      }

      // Check if user is trying to add their own product to cart
      if (userProfile && product && userProfile.uid === product.sellerId) {
        Alert.alert('Error', 'You cannot purchase your own product');
        return;
      }

      // Check if product is out of stock
      if (!product || product.stock <= 0) {
        Alert.alert('Error', 'Product is out of stock');
        return;
      }

      // Check if product is available in the requested quantity
      if (product.stock < quantity) {
        Alert.alert('Error', 'Product is not available in the requested quantity');
        return;
      }

      // Check if minimum order quantity is satisfied
      if (product.category === 'produce' && product.minimumOrderQuantity && quantity < product.minimumOrderQuantity) {
        Alert.alert('Minimum Order Quantity', `This product requires a minimum order of ${product.minimumOrderQuantity} ${product.stockUnit}.`);
        return;
      }

      // Add to cart using CartService
      await CartService.addToCart(userProfile.uid, product, quantity);

      // Show success message
      Alert.alert(
        'Added to Cart',
        `${quantity} ${product.name} added to your cart.`,
        [
          {
            text: 'Continue Shopping',
            style: 'cancel'
          },
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart' as never)
          }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add item to cart');
    }
  };

  // Handle custom quantity input
  const handleCustomQuantitySubmit = () => {
    const parsedQuantity = parseInt(customQuantity);
    if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
      // Ensure quantity doesn't exceed stock
      const newQuantity = Math.min(parsedQuantity, product?.stock || 1);
      setQuantity(newQuantity);
    }
    setShowQuantityDialog(false);
    setCustomQuantity('');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Handle negotiation
  const handleNegotiateSubmit = async () => {
    try {
      if (!product || !userProfile) {
        Alert.alert('Error', 'Product information or user profile is missing');
        return;
      }

      // Check if negotiation is available for this product
      if (!product.negotiatedPrice) {
        Alert.alert('Error', 'Negotiation is not available for this product');
        setShowNegotiateDialog(false);
        return;
      }

      const parsedPrice = parseFloat(negotiatedPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        Alert.alert('Error', 'Please enter a valid price');
        return;
      }

      // Check if minimum quantity requirement is satisfied
      if (product.category === 'produce' && product.minimumOrderQuantity && quantity < product.minimumOrderQuantity) {
        Alert.alert('Error', `Minimum order quantity is ${product.minimumOrderQuantity} ${product.stockUnit}`);
        return;
      }

      // Calculate total price based on per-unit negotiated price
      const totalNegotiatedPrice = parsedPrice * quantity;

      // Check if the negotiated price (per unit) matches the farmer's negotiated price (per unit)
      if (product.negotiatedPrice && parsedPrice >= product.negotiatedPrice) {
        // Negotiation successful
        setShowNegotiateDialog(false);

        // Create a modified product with negotiated price
        const negotiatedProduct = {
          ...product,
          price: product.price, // Keep original price for reference
          discountedPrice: parsedPrice, // Use negotiated price as discounted price
          isNegotiated: true,
          negotiatedPricePerUnit: parsedPrice,
          totalNegotiatedPrice: totalNegotiatedPrice
        };

        // If this is a prelisted product, redirect to DirectCheckout
        if (product.isPrelisted) {
          // Navigate to DirectCheckout with negotiated price information
          navigation.navigate('DirectCheckout', {
            productId: product.id,
            quantity,
            farmerId: product.sellerId,
            isNegotiated: true,
            negotiatedPrice: parsedPrice,
            totalNegotiatedPrice: totalNegotiatedPrice
          });
        } else {
          // For regular products, add to cart
          await CartService.addToCart(userProfile.uid, negotiatedProduct, quantity);

          // Show success message
          Alert.alert(
            'Negotiation Successful',
            `Your offer of ${formatCurrency(parsedPrice)} per ${product.stockUnit} was accepted. The item has been added to your cart.`,
            [
              {
                text: 'Continue Shopping',
                style: 'cancel'
              },
              {
                text: 'View Cart',
                onPress: () => navigation.navigate('Cart' as never)
              }
            ]
          );
        }
      } else {
        // Negotiation failed
        Alert.alert(
          'Negotiation Failed',
          'Your offer was not accepted. Please try a different price.',
          [
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error in negotiation:', error);
      Alert.alert('Error', 'Something went wrong with the negotiation. Please try again.');
    }
  };

  // Handle buy now
  const handleBuyNow = async () => {
    try {
      // Check if product is in stock
      if (!product || product.stock < quantity) {
        Alert.alert('Error', 'Product is out of stock or not available in the requested quantity');
        return;
      }

      // Check if user is logged in
      if (!userProfile) {
        Alert.alert(
          'Login Required',
          'You need to login to continue with purchase',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login' as never)
            }
          ]
        );
        return;
      }

      // Check if user is trying to buy their own product
      if (userProfile.uid === product.sellerId) {
        Alert.alert('Error', 'You cannot purchase your own product');
        return;
      }

      // Navigate to checkout screen - use the correct screen name
      navigation.navigate('DirectCheckout', {
        productId: product.id,
        quantity,
        farmerId: product.sellerId,
        isPrelisted: product.isPrelisted || false
      });
    } catch (error) {
      console.error('Error in buy now flow:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  // Product not found
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorText}>
          The product you're looking for doesn't exist or has been removed.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.navigate('Marketplace', { screen: 'MarketplaceMain' })}
          style={styles.goBackButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((image, index) => (
                <Image
                  key={`image-${index}`}
                  source={{ uri: image.url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              <View style={[styles.productImage, { backgroundColor: colors.lightGray, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>No image available</Text>
              </View>
            )}
          </ScrollView>

          {/* Image indicators */}
          <View style={styles.imageIndicators}>
            {product.images && product.images.length > 0 ? (
              product.images.map((_, index) => (
                <View
                  key={`indicator-${index}`}
                  style={[
                    styles.imageIndicator,
                    index === 0 && styles.activeImageIndicator,
                  ]}
                />
              ))
            ) : (
              <View style={[styles.imageIndicator, styles.activeImageIndicator]} />
            )}
          </View>

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Navigate back to MarketplaceMain screen
              navigation.navigate('Marketplace', { screen: 'MarketplaceMain' });
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Discount badge */}
          {product.discountedPrice && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.secondary} />
              <Text style={styles.ratingText}>
                {product.averageRating !== undefined && product.averageRating !== null
                  ? product.averageRating.toFixed(1)
                  : '0.0'}
                {product.ratings && product.ratings.length > 0 && (
                  <Text style={styles.ratingCount}> ({product.ratings.length})</Text>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ₹{product.discountedPrice || product.price}
              {product.discountedPrice && (
                <Text style={styles.originalPrice}> ₹{product.price}</Text>
              )}
            </Text>
            <Text style={[styles.stockInfo, isOutOfStock && styles.outOfStockText]}>
              {product.stock > 0 ?
                `In Stock (${formatStockQuantity(product.stock, product.stockUnit)})` :
                'Out of Stock'}
            </Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {/* Product Details Section */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{formatCategoryName(product.category)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subcategory:</Text>
                <Text style={styles.detailValue}>{formatCategoryName(product.subcategory)}</Text>
              </View>

              {product.category === 'produce' && product.ripeness && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ripeness:</Text>
                  <Text style={styles.detailValue}>{formatCategoryName(product.ripeness)}</Text>
                </View>
              )}

              {product.availabilityMode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Availability:</Text>
                  <Text style={styles.detailValue}>
                    {product.availabilityMode === 'delivery_only' ? 'Delivery Only' :
                     product.availabilityMode === 'pickup_available' ? 'Pickup Available' :
                     product.availabilityMode === 'market_only' ? 'Market Only' : 'All Options'}
                  </Text>
                </View>
              )}

              {product.tags && product.tags.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tags:</Text>
                  <View style={styles.tagsContainer}>
                    {product.tags.map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Additional produce-specific details */}
              {product.category === 'produce' && (
                <>
                  {product.minimumOrderQuantity !== undefined && product.minimumOrderQuantity > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Minimum Order:</Text>
                      <Text style={styles.detailValue}>{product.minimumOrderQuantity} {product.stockUnit}</Text>
                    </View>
                  )}

                  {product.farmDetails?.harvestDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Harvest Date:</Text>
                      <Text style={styles.detailValue}>{formatDate(product.farmDetails.harvestDate)}</Text>
                    </View>
                  )}

                  {product.shelfLife !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shelf Life:</Text>
                      <Text style={styles.detailValue}>{product.shelfLife} days</Text>
                    </View>
                  )}
                </>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Listed On:</Text>
                <Text style={styles.detailValue}>{formatDate(product.createdAt)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>{formatDate(product.updatedAt)}</Text>
              </View>
            </Card>
          </View>

          {/* Scientific Verification Section */}
          {product.scientificVerification && product.scientificVerification.isVerified && (
            <View style={styles.scientificContainer}>
              <Text style={styles.sectionTitle}>Scientific Verification</Text>
              <Card style={styles.scientificCard}>
                <View style={styles.scientificHeader}>
                  <Ionicons name="flask" size={24} color={colors.success} />
                  <Text style={styles.scientificTitle}>Scientifically Verified</Text>
                </View>

                {product.scientificVerification.verificationDate && (
                  <View style={styles.scientificRow}>
                    <Text style={styles.scientificLabel}>Verification Date:</Text>
                    <Text style={styles.scientificValue}>
                      {formatDate(product.scientificVerification.verificationDate)}
                    </Text>
                  </View>
                )}

                {product.scientificVerification.verifiedBy && (
                  <View style={styles.scientificRow}>
                    <Text style={styles.scientificLabel}>Verified By:</Text>
                    <Text style={styles.scientificValue}>{product.scientificVerification.verifiedBy}</Text>
                  </View>
                )}

                {product.scientificVerification.verificationMethod && (
                  <View style={styles.scientificRow}>
                    <Text style={styles.scientificLabel}>Verification Method:</Text>
                    <Text style={styles.scientificValue}>{product.scientificVerification.verificationMethod}</Text>
                  </View>
                )}

                {product.scientificVerification.verificationResults && product.scientificVerification.verificationResults.length > 0 && (
                  <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Test Results:</Text>
                    {product.scientificVerification.verificationResults.map((result, index) => (
                      <View key={index} style={styles.resultItem}>
                        <View style={styles.resultHeader}>
                          <Text style={styles.resultParameter}>{result.parameter}</Text>
                          <View style={[styles.resultStatus, result.isPassing ? styles.passingStatus : styles.failingStatus]}>
                            <Text style={styles.resultStatusText}>
                              {result.isPassing ? 'PASS' : 'FAIL'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.resultValues}>
                          <Text style={styles.resultValue}>
                            {result.value} {result.unit || ''}
                          </Text>
                          {result.standardValue && (
                            <Text style={styles.resultStandard}>
                              Standard: {result.standardValue}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {product.scientificVerification.certificateUrl && (
                  <TouchableOpacity
                    style={styles.certificateButton}
                    onPress={() => Linking.openURL(product.scientificVerification.certificateUrl || '')}
                  >
                    <Ionicons name="document-text" size={18} color={colors.primary} />
                    <Text style={styles.certificateButtonText}>View Certificate</Text>
                  </TouchableOpacity>
                )}
              </Card>
            </View>
          )}

          {/* Certifications Section */}
          {product.certifications && product.certifications.length > 0 && (
            <View style={styles.certificationsContainer}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <Card style={styles.certificationsCard}>
                {product.certifications.map((certification, index) => (
                  <View key={index} style={styles.certificationItem}>
                    <View style={styles.certificationHeader}>
                      <View style={styles.certificationTypeContainer}>
                        <Ionicons
                          name={certification.type === 'aacc' ? 'shield-checkmark' : 'ribbon'}
                          size={20}
                          color={certification.type === 'aacc' ? colors.success : colors.primary}
                        />
                        <Text style={styles.certificationType}>
                          {certification.type === 'organic' ? 'Organic Certified' :
                           certification.type === 'natural_farming' ? 'Natural Farming' :
                           certification.type === 'gmo_free' ? 'GMO Free' :
                           certification.type === 'pesticide_free' ? 'Pesticide Free' :
                           certification.type === 'fair_trade' ? 'Fair Trade' :
                           certification.type === 'aacc' ? 'AACC Certified' : certification.type}
                        </Text>
                      </View>
                      {certification.type === 'aacc' && certification.aaccDetails?.grade && (
                        <View style={styles.aaccGradeContainer}>
                          <Text style={styles.aaccGradeLabel}>Grade:</Text>
                          <Text style={styles.aaccGradeValue}>{certification.aaccDetails.grade}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.certificationDetails}>
                      <View style={styles.certificationRow}>
                        <Text style={styles.certificationLabel}>Issued By:</Text>
                        <Text style={styles.certificationValue}>{certification.issuedBy}</Text>
                      </View>

                      <View style={styles.certificationRow}>
                        <Text style={styles.certificationLabel}>Issue Date:</Text>
                        <Text style={styles.certificationValue}>{formatDate(certification.issuedDate)}</Text>
                      </View>

                      <View style={styles.certificationRow}>
                        <Text style={styles.certificationLabel}>Expiry Date:</Text>
                        <Text style={styles.certificationValue}>{formatDate(certification.expiryDate)}</Text>
                      </View>

                      {certification.verificationCode && (
                        <View style={styles.certificationRow}>
                          <Text style={styles.certificationLabel}>Verification Code:</Text>
                          <Text style={styles.certificationValue}>{certification.verificationCode}</Text>
                        </View>
                      )}

                      {/* AACC Specific Details */}
                      {certification.type === 'aacc' && certification.aaccDetails && (
                        <View style={styles.aaccDetailsContainer}>
                          <Text style={styles.aaccDetailsTitle}>AACC Details</Text>

                          <View style={styles.aaccScoresContainer}>
                            <View style={styles.aaccScoreItem}>
                              <Text style={styles.aaccScoreValue}>{certification.aaccDetails.qualityScore}</Text>
                              <Text style={styles.aaccScoreLabel}>Quality Score</Text>
                            </View>

                            <View style={styles.aaccScoreItem}>
                              <Text style={styles.aaccScoreValue}>{certification.aaccDetails.safetyScore}</Text>
                              <Text style={styles.aaccScoreLabel}>Safety Score</Text>
                            </View>
                          </View>

                          {certification.aaccDetails.testingLab && (
                            <View style={styles.certificationRow}>
                              <Text style={styles.certificationLabel}>Testing Lab:</Text>
                              <Text style={styles.certificationValue}>{certification.aaccDetails.testingLab}</Text>
                            </View>
                          )}

                          {certification.aaccDetails.testingDate && (
                            <View style={styles.certificationRow}>
                              <Text style={styles.certificationLabel}>Testing Date:</Text>
                              <Text style={styles.certificationValue}>{formatDate(certification.aaccDetails.testingDate)}</Text>
                            </View>
                          )}

                          {certification.aaccDetails.standardsCompliance && certification.aaccDetails.standardsCompliance.length > 0 && (
                            <View style={styles.complianceContainer}>
                              <Text style={styles.complianceTitle}>Standards Compliance:</Text>
                              <View style={styles.complianceBadgesContainer}>
                                {certification.aaccDetails.standardsCompliance.map((standard, stdIndex) => (
                                  <View key={stdIndex} style={styles.complianceBadge}>
                                    <Text style={styles.complianceBadgeText}>{standard}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      )}

                      {certification.certificateUrl && (
                        <View>
                          <TouchableOpacity
                            style={styles.viewCertificateButton}
                            onPress={() => Linking.openURL(certification.certificateUrl || '')}
                          >
                            <Ionicons name="document-text" size={16} color={colors.primary} />
                            <Text style={styles.viewCertificateText}>View Certificate</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.certificateImageContainer}
                            onPress={() => Linking.openURL(certification.certificateUrl || '')}
                          >
                            <Image
                              source={{ uri: certification.certificateUrl }}
                              style={styles.certificateImage}
                              resizeMode="contain"
                            />
                            <View style={styles.certificateImageOverlay}>
                              <Text style={styles.certificateImageText}>Tap to view full certificate</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* Product Journey Section */}
          {product.productJourney && product.productJourney.stages && product.productJourney.stages.length > 0 && (
            <View style={styles.journeyContainer}>
              <Text style={styles.sectionTitle}>Product Journey</Text>
              <Card style={styles.journeyCard}>
                <View style={styles.journeyHeader}>
                  <Ionicons name="git-network" size={24} color={colors.primary} />
                  <Text style={styles.journeyTitle}>Farm to Table Journey</Text>
                </View>

                <View style={styles.journeyStagesContainer}>
                  {product.productJourney.stages.map((stage, index) => (
                    <View key={index} style={styles.journeyStage}>
                      <View style={styles.journeyStageHeader}>
                        <View style={styles.journeyStageNumberContainer}>
                          <Text style={styles.journeyStageNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.journeyStageName}>{stage.stageName}</Text>
                        <Text style={styles.journeyStageDate}>{formatDate(stage.timestamp)}</Text>
                      </View>

                      {stage.description && (
                        <Text style={styles.journeyStageDescription}>{stage.description}</Text>
                      )}

                      {stage.location && (
                        <View style={styles.journeyStageLocation}>
                          <Ionicons name="location" size={16} color={colors.primary} />
                          <Text style={styles.journeyStageLocationText}>{stage.location.address}</Text>
                        </View>
                      )}

                      {stage.imageUrl && (
                        <Image source={{ uri: stage.imageUrl }} style={styles.journeyStageImage} />
                      )}

                      {stage.handledBy && (
                        <View style={styles.journeyStageHandledBy}>
                          <Ionicons name="person" size={16} color={colors.textSecondary} />
                          <Text style={styles.journeyStageHandledByText}>Handled by: {stage.handledBy}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

              </Card>
            </View>
          )}

          <View style={styles.sellerContainer}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <TouchableOpacity
              style={styles.sellerInfo}
              onPress={() => navigation.navigate('FarmerStorefront', { farmerId: product.sellerId })}
            >
              <View style={styles.sellerNameContainer}>
                <View style={styles.sellerNameWrapper}>
                  <Text style={styles.sellerName}>{product.sellerName}</Text>
                  {product.isDirectFromFarmer && (
                    <View style={styles.directBadge}>
                      <Text style={styles.directBadgeText}>Direct from Farmer</Text>
                    </View>
                  )}
                  {product.farmDetails?.farmerVerified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.verifiedIcon} />
                  )}
                  {product.sellerVerified === true && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={18} color={colors.white} />
                      <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                    </View>
                  )}
                </View>
                <View style={styles.sellerRatingContainer}>
                  <Ionicons name="star" size={14} color={colors.secondary} />
                  <Text style={styles.sellerRatingText}>
                    {(product.sellerRating || 0).toFixed(1)}
                    {product.sellerTotalRatings > 0 && (
                      <Text style={styles.sellerRatingCount}> ({product.sellerTotalRatings})</Text>
                    )}
                  </Text>
                </View>
              </View>
              <Text style={styles.sellerLocation}>{product.location?.address || 'Location not available'}</Text>

              <View style={styles.viewProfileContainer}>
                <Text style={styles.viewProfileText}>View Seller Profile</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {product.isDirectFromFarmer && product.transparencyInfo && (
            <View style={styles.transparencyContainer}>
              <Text style={styles.sectionTitle}>Product Transparency</Text>
              <Card style={styles.transparencyCard}>
                {product.transparencyInfo.originStory && (
                  <View style={styles.transparencyItem}>
                    <Text style={styles.transparencyLabel}>Origin Story:</Text>
                    <Text style={styles.transparencyText}>{product.transparencyInfo.originStory}</Text>
                  </View>
                )}

                {product.transparencyInfo.productionProcess && product.transparencyInfo.productionProcess.length > 0 && (
                  <View style={styles.transparencyItem}>
                    <Text style={styles.transparencyLabel}>Production Process:</Text>
                    {product.transparencyInfo.productionProcess.map((step, index) => (
                      <View key={index} style={styles.processStep}>
                        <Text style={styles.processStepNumber}>{index + 1}</Text>
                        <Text style={styles.processStepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {product.transparencyInfo.sustainabilityScore !== undefined && (
                  <View style={styles.transparencyItem}>
                    <Text style={styles.transparencyLabel}>Sustainability Score:</Text>
                    <View style={styles.sustainabilityScore}>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Ionicons
                          key={score}
                          name="leaf"
                          size={16}
                          color={score <= product.transparencyInfo!.sustainabilityScore! ? colors.success : colors.lightGray}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {product.farmDetails?.farmingMethod && (
                  <View style={styles.transparencyItem}>
                    <Text style={styles.transparencyLabel}>Farming Method:</Text>
                    <Text style={styles.transparencyText}>
                      {product.farmDetails.farmingMethod.charAt(0).toUpperCase() + product.farmDetails.farmingMethod.slice(1)}
                    </Text>
                  </View>
                )}

                {product.farmDetails?.certifications && product.farmDetails.certifications.length > 0 && (
                  <View style={styles.transparencyItem}>
                    <Text style={styles.transparencyLabel}>Certifications:</Text>
                    <View style={styles.certificationsContainer}>
                      {product.farmDetails.certifications.map((cert, index) => (
                        <View key={index} style={styles.certificationBadge}>
                          <Text style={styles.certificationText}>{cert}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.reviewsContainer}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.reviewsSummary}>
                <Text style={styles.reviewsCount}>
                  {product.ratings ? product.ratings.length : 0} Reviews
                </Text>
                <View style={styles.reviewsAverageContainer}>
                  <Ionicons name="star" size={18} color={colors.secondary} />
                  <Text style={styles.reviewsAverage}>
                    {product.averageRating !== undefined && product.averageRating !== null
                      ? product.averageRating.toFixed(1)
                      : '0.0'}
                  </Text>
                </View>
              </View>
            </View>

            {product.ratings && product.ratings.length > 0 ? (
              product.ratings.map((rating, index) => (
                <Card key={`review-${index}`} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View style={styles.reviewerAvatar}>
                        <Ionicons name="person-circle" size={24} color={colors.mediumGray} />
                      </View>
                      <View style={styles.reviewerDetails}>
                        <Text style={styles.reviewerName}>
                          {rating.reviewerName || 'Anonymous User'}
                        </Text>
                        <View style={styles.reviewRating}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Ionicons
                              key={`star-${i}`}
                              name={i < rating.rating ? 'star' : 'star-outline'}
                              size={14}
                              color={colors.secondary}
                              style={styles.reviewStar}
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(rating.timestamp).toLocaleDateString()}
                    </Text>
                  </View>

                  {rating.review ? (
                    <Text style={styles.reviewText}>{rating.review}</Text>
                  ) : (
                    <Text style={styles.noReviewText}>No written review</Text>
                  )}
                </Card>
              ))
            ) : (
              <Card style={styles.emptyReviewsCard}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.lightGray} />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to review this product</Text>
              </Card>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        {/* Check if current user is the seller */}
        {userProfile && product && userProfile.uid === product.sellerId ? (
          <View style={styles.ownProductContainer}>
            <View style={styles.ownProductInfo}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <Text style={styles.ownProductText}>This is your product. You cannot purchase your own products.</Text>
            </View>
            <Button
              title="Edit Product"
              variant="outline"
              onPress={() => {
                navigation.navigate('EditProduct', { productId: product.id });
              }}
              style={styles.editButton}
            />
          </View>
        ) : (
          <>
            {isOutOfStock ? (
              <View style={styles.outOfStockContainer}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <Text style={styles.outOfStockMessage}>This product is currently out of stock</Text>
              </View>
            ) : (
              <View style={styles.quantityContainer}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    <Ionicons name="remove" size={20} color={(quantity <= 1 || isOutOfStock) ? colors.lightGray : colors.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowQuantityDialog(true)}
                    disabled={isOutOfStock}
                  >
                    <Text style={[styles.quantityText, isOutOfStock && styles.disabledText]}>{quantity}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                  >
                    <Ionicons name="add" size={20} color={(quantity >= product.stock || isOutOfStock) ? colors.lightGray : colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.totalPriceContainer}>
                  <Text style={styles.totalPriceLabel}>Total:</Text>
                  <Text style={styles.totalPriceValue}>
                    ₹{((product.discountedPrice || product.price) * quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.actionButtons}>
              {product.isPrelisted ? (
                // Prelisted product buttons
                <>
                  <Button
                    title="Negotiate"
                    onPress={() => setShowNegotiateDialog(true)}
                    style={[styles.negotiateButton,
                      (!isMinimumQuantitySatisfied || !product.negotiatedPrice || isOutOfStock) && styles.disabledOutlineButton]}
                    leftIcon={<Ionicons name="chatbubble-outline" size={18}
                      color={(!isMinimumQuantitySatisfied || !product.negotiatedPrice || isOutOfStock) ? colors.lightGray : colors.primary}
                      style={styles.buttonIcon} />}
                    disabled={!isMinimumQuantitySatisfied || !product.negotiatedPrice || isOutOfStock}
                  />

                  <Button
                    title="Direct Checkout"
                    onPress={handleBuyNow}
                    style={[styles.buyNowButton, isOutOfStock && styles.disabledButton]}
                    leftIcon={<Ionicons name="flash-outline" size={18} color={isOutOfStock ? colors.lightGray : colors.white} style={styles.buttonIcon} />}
                    disabled={isOutOfStock || !isMinimumQuantitySatisfied}
                  />
                </>
              ) : (
                // Regular product buttons
                <>
                  <Button
                    title="Add to Cart"
                    variant="outline"
                    onPress={handleAddToCart}
                    style={[styles.cartButton, isOutOfStock && styles.disabledOutlineButton]}
                    leftIcon={<Ionicons name="cart-outline" size={18} color={isOutOfStock ? colors.lightGray : colors.primary} style={styles.buttonIcon} />}
                    disabled={isOutOfStock}
                  />

                  <Button
                    title="Negotiate"
                    onPress={() => setShowNegotiateDialog(true)}
                    style={[styles.negotiateButton,
                      (!isMinimumQuantitySatisfied || !product.negotiatedPrice || isOutOfStock) && styles.disabledOutlineButton]}
                    leftIcon={<Ionicons name="chatbubble-outline" size={18}
                      color={(!isMinimumQuantitySatisfied || !product.negotiatedPrice || isOutOfStock) ? colors.lightGray : colors.primary}
                      style={styles.buttonIcon} />}
                    disabled={!isMinimumQuantitySatisfied || !product.negotiatedPrice || isOutOfStock}
                  />
                </>
              )}

              {product.category === 'produce' && product.minimumOrderQuantity && !isMinimumQuantitySatisfied && (
                <View style={styles.warningContainer}>
                  <Text style={styles.minimumOrderWarning}>
                    Minimum order: {product.minimumOrderQuantity} {product.stockUnit}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Custom Quantity Dialog */}
      <Modal
        visible={showQuantityDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuantityDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Custom Quantity</Text>

            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              value={customQuantity}
              onChangeText={setCustomQuantity}
              placeholder={`Enter quantity (max ${product?.stock})`}
              autoFocus
            />

            {product?.category === 'produce' && product?.minimumOrderQuantity && (
              <Text style={styles.minimumQuantityText}>
                Minimum order: {product.minimumOrderQuantity} {product.stockUnit}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowQuantityDialog(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCustomQuantitySubmit}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Negotiation Dialog */}
      <Modal
        visible={showNegotiateDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNegotiateDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Negotiate Price</Text>

            <View style={styles.negotiationDetails}>
              <Text style={styles.negotiationLabel}>Product:</Text>
              <Text style={styles.negotiationValue}>{product?.name}</Text>
            </View>

            <View style={styles.negotiationDetails}>
              <Text style={styles.negotiationLabel}>Quantity:</Text>
              <Text style={styles.negotiationValue}>{quantity} {product?.stockUnit}</Text>
            </View>

            <View style={styles.negotiationDetails}>
              <Text style={styles.negotiationLabel}>Current Price:</Text>
              <Text style={styles.negotiationValue}>₹{(product?.discountedPrice || product?.price || 0).toFixed(2)} per {product?.stockUnit}</Text>
            </View>

            <View style={styles.negotiationDetails}>
              <Text style={styles.negotiationLabel}>Quantity:</Text>
              <Text style={styles.negotiationValue}>{quantity} {product?.stockUnit}</Text>
            </View>

            <View style={styles.priceInputContainer}>
              <Text style={styles.priceInputLabel}>Your Offer (per {product?.stockUnit}):</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={negotiatedPrice}
                  onChangeText={setNegotiatedPrice}
                  placeholder={`Enter price per ${product?.stockUnit}`}
                  autoFocus
                />
              </View>
            </View>

            <Text style={styles.negotiationHint}>
              Enter your offer price per {product?.stockUnit}. If accepted, total will be ₹{negotiatedPrice ? (parseFloat(negotiatedPrice) * quantity).toFixed(2) : '0.00'} + delivery charges.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNegotiateDialog(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleNegotiateSubmit}
              >
                <Text style={styles.confirmButtonText}>Submit Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  goBackButton: {
    width: 200,
  },
  // Image gallery styles
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  productImage: {
    width: 400,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    opacity: 0.5,
    marginHorizontal: spacing.xs,
  },
  activeImageIndicator: {
    opacity: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  // Product info styles
  productInfoContainer: {
    padding: spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  productName: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  ratingCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stockInfo: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
  },
  outOfStockText: {
    color: colors.error,
    fontFamily: typography.fontFamily.bold,
  },
  disabledText: {
    color: colors.lightGray,
  },
  outOfStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  outOfStockMessage: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
    marginBottom: spacing.lg,
  },
  // Seller info styles
  sellerContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sellerInfo: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sellerNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sellerNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  directBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  directBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  verifiedIcon: {
    marginLeft: spacing.xs,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sellerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerRatingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  sellerRatingCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  sellerLocation: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  viewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewProfileText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  // Transparency styles
  transparencyContainer: {
    marginBottom: spacing.lg,
  },
  transparencyCard: {
    padding: spacing.md,
  },
  transparencyItem: {
    marginBottom: spacing.md,
  },
  transparencyLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  transparencyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  processStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    lineHeight: 20,
    marginRight: spacing.sm,
  },
  processStepText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  sustainabilityScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  certificationBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  certificationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  // Product Details styles
  detailsContainer: {
    marginBottom: spacing.lg,
  },

  // Scientific Verification styles
  scientificContainer: {
    marginBottom: spacing.lg,
  },
  scientificCard: {
    padding: spacing.md,
  },
  scientificHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  scientificTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  scientificRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scientificLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  scientificValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  resultsContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    paddingTop: spacing.md,
  },
  resultsTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  resultParameter: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  resultStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  passingStatus: {
    backgroundColor: colors.successLight,
  },
  failingStatus: {
    backgroundColor: colors.errorLight,
  },
  resultStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  resultValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  resultStandard: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  certificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  certificateButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },

  // Certifications styles
  certificationsContainer: {
    marginBottom: spacing.lg,
  },
  certificationsCard: {
    padding: spacing.md,
  },
  certificationItem: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
    paddingBottom: spacing.md,
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  certificationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certificationType: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  aaccGradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  aaccGradeLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  aaccGradeValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  certificationDetails: {
    marginTop: spacing.xs,
  },
  certificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  certificationLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  certificationValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  aaccDetailsContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  aaccDetailsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  aaccScoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  aaccScoreItem: {
    alignItems: 'center',
  },
  aaccScoreValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  aaccScoreLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  complianceContainer: {
    marginTop: spacing.sm,
  },
  complianceTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  complianceBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  complianceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  complianceBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  viewCertificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewCertificateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  certificateImageContainer: {
    width: '100%',
    height: 200,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  certificateImage: {
    width: '100%',
    height: '100%',
  },
  certificateImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.xs,
  },
  certificateImageText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },

  // Product Journey styles
  journeyContainer: {
    marginBottom: spacing.lg,
  },
  journeyCard: {
    padding: spacing.md,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  journeyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  journeyStagesContainer: {
    marginTop: spacing.sm,
  },
  journeyStage: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  journeyStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  journeyStageNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  journeyStageNumber: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  journeyStageName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  journeyStageDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  journeyStageDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  journeyStageLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  journeyStageLocationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  journeyStageImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  journeyStageHandledBy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyStageHandledByText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  qrCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  qrCodeButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  detailsCard: {
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
    paddingBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 2,
  },
  tagBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },

  // Reviews styles
  reviewsContainer: {
    marginBottom: spacing.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  reviewsAverageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  reviewsAverage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.secondary,
    marginLeft: spacing.xs,
  },
  reviewCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStar: {
    marginRight: 2,
  },
  reviewDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  reviewText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  noReviewText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyReviewsCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  noReviewsText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  noReviewsSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  // Bottom bar styles
  bottomSpacing: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quantityContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  quantityText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
    minWidth: 24,
    textAlign: 'center',
  },
  totalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  totalPriceLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  totalPriceValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  negotiateButton: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  negotiationUnavailableText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cartButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  buyButton: {
    flex: 1,
  },
  directBuyButton: {
    width: '100%',
    backgroundColor: colors.success,
  },
  disabledButton: {
    backgroundColor: colors.lightGray,
    opacity: 0.7,
  },
  disabledOutlineButton: {
    borderColor: colors.lightGray,
    opacity: 0.7,
  },
  warningContainer: {
    marginTop: spacing.xs,
    width: '100%',
  },
  minimumOrderWarning: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
  minimumQuantityText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  negotiationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  negotiationLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  negotiationValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  priceInputContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  priceInputLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  currencySymbol: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  calculationResult: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  calculationLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  calculationFormula: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  negotiationHint: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  ownProductContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ownProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  ownProductText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.info,
    marginHorizontal: spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  editButton: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});

export default ProductDetailsScreen;
