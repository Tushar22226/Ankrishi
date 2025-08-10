import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { Product, OrderItem, PaymentMethod, ProductAvailabilityMode } from '../../models/Product';
import { UserProfile } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

const DirectCheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get params from route
  const { productId, quantity, farmerId } = route.params as {
    productId: string;
    quantity: number;
    farmerId: string;
  };

  // State
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<UserProfile | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<'self_pickup' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [processingOrder, setProcessingOrder] = useState(false);

  // Load product and farmer details
  useEffect(() => {
    loadData();
  }, [productId, farmerId]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // Get product details
      const productData = await MarketplaceService.getProduct(productId);

      if (!productData) {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
        return;
      }

      // Check if user is trying to buy their own product
      if (userProfile && userProfile.uid === productData.sellerId) {
        Alert.alert('Error', 'You cannot purchase your own product');
        navigation.goBack();
        return;
      }

      setProduct(productData);

      // Set delivery option based on product availability mode
      if (productData.availabilityMode === 'market_only') {
        // Market-only products can only be picked up
        setDeliveryOption('self_pickup');
      } else if (productData.availabilityMode === 'pickup_available') {
        // Default to pickup for pickup_available products
        setDeliveryOption('self_pickup');
      } else if (productData.availabilityMode === 'delivery_only') {
        // Delivery-only products can only be delivered
        setDeliveryOption('delivery');
      }
      // For 'all' or undefined, keep the default ('delivery')

      // Get farmer profile
      const { profile } = await MarketplaceService.getFarmerProfile(farmerId);

      if (!profile) {
        Alert.alert('Error', 'Farmer not found');
        navigation.goBack();
        return;
      }

      setFarmer(profile);

      // Pre-fill shipping address if user profile has address
      if (userProfile) {
        setShippingAddress({
          name: userProfile.displayName || '',
          phone: userProfile.phoneNumber || '',
          address: userProfile.location?.address || '',
          city: '',
          state: '',
          pincode: '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!product) return 0;

    const itemPrice = product.discountedPrice || product.price;
    return itemPrice * quantity;
  };

  // Calculate delivery fee
  const calculateDeliveryFee = () => {
    if (deliveryOption === 'self_pickup') return 0;

    const totalPrice = calculateTotalPrice();
    return totalPrice > 1000 ? 0 : 50; // Free delivery for orders over ₹1000
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return calculateTotalPrice() + calculateDeliveryFee();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    try {
      // Validate based on delivery option
      if (deliveryOption === 'delivery') {
        // Validate shipping address for delivery
        if (
          !shippingAddress.name ||
          !shippingAddress.phone ||
          !shippingAddress.address ||
          !shippingAddress.city ||
          !shippingAddress.state ||
          !shippingAddress.pincode
        ) {
          Alert.alert('Error', 'Please fill in all shipping address fields');
          return;
        }

        // Check if product is available for delivery
        if (product?.availabilityMode === 'market_only') {
          Alert.alert('Error', 'This product is only available for pickup at the market');
          return;
        }
      } else {
        // For self-pickup, we still need basic contact information
        if (!shippingAddress.name || !shippingAddress.phone) {
          Alert.alert('Error', 'Please provide your name and phone number for pickup');
          return;
        }

        // Check if product is available for pickup
        if (product?.availabilityMode === 'delivery_only') {
          Alert.alert('Error', 'This product is only available for delivery');
          return;
        }
      }

      if (!userProfile) {
        Alert.alert('Error', 'You must be logged in to place an order');
        return;
      }

      if (!product) {
        Alert.alert('Error', 'Product information is missing');
        return;
      }

      // Double-check that user is not buying their own product
      if (userProfile.uid === product.sellerId) {
        Alert.alert('Error', 'You cannot purchase your own product');
        navigation.goBack();
        return;
      }

      setProcessingOrder(true);

      // Create order item
      const orderItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0]?.url || '',
        quantity,
        price: product.discountedPrice || product.price,
        totalPrice: (product.discountedPrice || product.price) * quantity,
      };

      // Create direct order
      const orderId = await MarketplaceService.createDirectOrder(
        userProfile.uid,
        farmerId,
        [orderItem],
        shippingAddress,
        paymentMethod,
        deliveryOption
      );

      // Navigate to order tracking screen
      navigation.navigate('OrderTracking' as never, { orderId } as never);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading checkout...</Text>
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

        <Text style={styles.title}>Direct Checkout</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 10,
        }}
      >
        {/* Direct from Farmer Badge */}
        <View style={styles.directBadgeContainer}>
          <View style={styles.directBadge}>
            <Ionicons name="leaf" size={16} color={colors.white} />
            <Text style={styles.directBadgeText}>Direct from Farmer</Text>
          </View>
          <Text style={styles.directBadgeSubtext}>
            0% Commission • Support Local Farmers
          </Text>
        </View>

        {/* Product Summary */}
        <Card style={styles.productCard}>
          <View style={styles.productHeader}>
            <Text style={styles.sectionTitle}>Product Summary</Text>
          </View>

          <View style={styles.productItem}>
            <Image
              source={{ uri: product?.images[0]?.url || 'https://via.placeholder.com/100x100?text=Product' }}
              style={styles.productImage}
              resizeMode="cover"
            />

            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product?.name}</Text>
              <Text style={styles.productPrice}>
                {formatCurrency(product?.discountedPrice || product?.price || 0)} x {quantity}
              </Text>
              <Text style={styles.productTotal}>
                {formatCurrency(calculateTotalPrice())}
              </Text>
            </View>
          </View>
        </Card>

        {/* Farmer Info */}
        <Card style={styles.farmerCard}>
          <View style={styles.farmerHeader}>
            <Text style={styles.sectionTitle}>Farmer Information</Text>
          </View>

          <View style={styles.farmerInfo}>
            <View style={styles.farmerNameContainer}>
              <Text style={styles.farmerName}>{farmer?.displayName}</Text>
              {farmer?.reputation?.verifiedStatus && (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              )}
            </View>

            <Text style={styles.farmerLocation}>
              {farmer?.location?.address || 'Location not available'}
            </Text>

            <View style={styles.farmerRating}>
              <Ionicons name="star" size={14} color={colors.secondary} />
              <Text style={styles.farmerRatingText}>
                {farmer?.reputation?.rating?.toFixed(1) || '0.0'} ({farmer?.reputation?.totalRatings || 0} ratings)
              </Text>
            </View>
          </View>
        </Card>

        {/* Delivery Options */}
        <Card style={styles.deliveryCard}>
          <View style={styles.deliveryHeader}>
            <Text style={styles.sectionTitle}>Delivery Options</Text>
            {product?.availabilityMode && (
              <View style={styles.availabilityBadgeContainer}>
                {product.availabilityMode === 'market_only' && (
                  <View style={[styles.availabilityBadge, styles.marketOnlyBadge]}>
                    <Ionicons name="storefront" size={14} color={colors.white} />
                    <Text style={styles.availabilityBadgeText}>Market Only</Text>
                  </View>
                )}
                {product.availabilityMode === 'pickup_available' && (
                  <View style={[styles.availabilityBadge, styles.pickupBadge]}>
                    <Ionicons name="location" size={14} color={colors.white} />
                    <Text style={styles.availabilityBadgeText}>Pickup Available</Text>
                  </View>
                )}
                {product.availabilityMode === 'delivery_only' && (
                  <View style={[styles.availabilityBadge, styles.deliveryBadge]}>
                    <Ionicons name="car" size={14} color={colors.white} />
                    <Text style={styles.availabilityBadgeText}>Delivery Only</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.deliveryOptions}>
            {/* Home Delivery Option - Disabled for market_only products */}
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'delivery' && styles.selectedDeliveryOption,
                product?.availabilityMode === 'market_only' && styles.disabledDeliveryOption,
              ]}
              onPress={() => {
                if (product?.availabilityMode !== 'market_only') {
                  setDeliveryOption('delivery');
                } else {
                  Alert.alert('Not Available', 'This product is only available for pickup at the market.');
                }
              }}
              disabled={product?.availabilityMode === 'market_only'}
            >
              <View style={styles.deliveryOptionContent}>
                <View style={[styles.deliveryOptionIcon, product?.availabilityMode === 'market_only' && styles.disabledIcon]}>
                  <Ionicons
                    name="car"
                    size={24}
                    color={deliveryOption === 'delivery' && product?.availabilityMode !== 'market_only' ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.deliveryOptionInfo}>
                  <Text
                    style={[
                      styles.deliveryOptionTitle,
                      deliveryOption === 'delivery' && product?.availabilityMode !== 'market_only' && styles.selectedDeliveryOptionTitle,
                      product?.availabilityMode === 'market_only' && styles.disabledText,
                    ]}
                  >
                    Home Delivery
                  </Text>

                  <Text style={[styles.deliveryOptionDescription, product?.availabilityMode === 'market_only' && styles.disabledText]}>
                    {product?.availabilityMode === 'market_only'
                      ? 'Not available for this product'
                      : calculateDeliveryFee() > 0
                        ? `Delivery fee: ${formatCurrency(calculateDeliveryFee())}`
                        : 'Free delivery'}
                  </Text>
                </View>
              </View>

              {deliveryOption === 'delivery' && product?.availabilityMode !== 'market_only' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Self Pickup Option - Disabled for delivery_only products */}
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'self_pickup' && styles.selectedDeliveryOption,
                product?.availabilityMode === 'delivery_only' && styles.disabledDeliveryOption,
              ]}
              onPress={() => {
                if (product?.availabilityMode !== 'delivery_only') {
                  setDeliveryOption('self_pickup');
                } else {
                  Alert.alert('Not Available', 'This product is only available for home delivery.');
                }
              }}
              disabled={product?.availabilityMode === 'delivery_only'}
            >
              <View style={styles.deliveryOptionContent}>
                <View style={[styles.deliveryOptionIcon, product?.availabilityMode === 'delivery_only' && styles.disabledIcon]}>
                  <Ionicons
                    name="location"
                    size={24}
                    color={deliveryOption === 'self_pickup' && product?.availabilityMode !== 'delivery_only' ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.deliveryOptionInfo}>
                  <Text
                    style={[
                      styles.deliveryOptionTitle,
                      deliveryOption === 'self_pickup' && product?.availabilityMode !== 'delivery_only' && styles.selectedDeliveryOptionTitle,
                      product?.availabilityMode === 'delivery_only' && styles.disabledText,
                    ]}
                  >
                    Self Pickup
                  </Text>

                  <Text style={[styles.deliveryOptionDescription, product?.availabilityMode === 'delivery_only' && styles.disabledText]}>
                    {product?.availabilityMode === 'delivery_only'
                      ? 'Not available for this product'
                      : product?.availabilityMode === 'market_only'
                        ? 'Pickup from market stall'
                        : 'Pickup from farmer\'s location'}
                  </Text>

                  {product?.availabilityMode === 'market_only' && (
                    <Text style={styles.marketLocationText}>
                      {farmer?.farmDetails?.farmLocation || 'Market location will be provided'}
                    </Text>
                  )}
                </View>
              </View>

              {deliveryOption === 'self_pickup' && product?.availabilityMode !== 'delivery_only' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Shipping Address */}
        {deliveryOption === 'delivery' && (
          <Card style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
            </View>

            <View style={styles.addressForm}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingAddress.name}
                    onChangeText={(text) => setShippingAddress({ ...shippingAddress, name: text })}
                    placeholder="Enter your full name"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingAddress.phone}
                    onChangeText={(text) => setShippingAddress({ ...shippingAddress, phone: text })}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingAddress.address}
                    onChangeText={(text) => setShippingAddress({ ...shippingAddress, address: text })}
                    placeholder="Enter your address"
                    multiline
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingAddress.city}
                    onChangeText={(text) => setShippingAddress({ ...shippingAddress, city: text })}
                    placeholder="City"
                  />
                </View>

                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingAddress.state}
                    onChangeText={(text) => setShippingAddress({ ...shippingAddress, state: text })}
                    placeholder="State"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>PIN Code</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingAddress.pincode}
                    onChangeText={(text) => setShippingAddress({ ...shippingAddress, pincode: text })}
                    placeholder="PIN Code"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Payment Method */}
        <Card style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash_on_delivery' && styles.selectedPaymentOption,
              ]}
              onPress={() => setPaymentMethod('cash_on_delivery')}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.paymentOptionIcon}>
                  <Ionicons
                    name="cash"
                    size={24}
                    color={paymentMethod === 'cash_on_delivery' ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.paymentOptionInfo}>
                  <Text
                    style={[
                      styles.paymentOptionTitle,
                      paymentMethod === 'cash_on_delivery' && styles.selectedPaymentOptionTitle,
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                </View>
              </View>

              {paymentMethod === 'cash_on_delivery' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'upi' && styles.selectedPaymentOption,
              ]}
              onPress={() => setPaymentMethod('upi')}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.paymentOptionIcon}>
                  <Ionicons
                    name="phone-portrait"
                    size={24}
                    color={paymentMethod === 'upi' ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.paymentOptionInfo}>
                  <Text
                    style={[
                      styles.paymentOptionTitle,
                      paymentMethod === 'upi' && styles.selectedPaymentOptionTitle,
                    ]}
                  >
                    UPI Payment
                  </Text>
                </View>
              </View>

              {paymentMethod === 'upi' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(calculateTotalPrice())}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>{formatCurrency(calculateDeliveryFee())}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee</Text>
              <Text style={styles.summaryValue}>₹0.00</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(calculateTotalAmount())}</Text>
            </View>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotalLabel}>Total:</Text>
          <Text style={styles.bottomTotalValue}>{formatCurrency(calculateTotalAmount())}</Text>
        </View>

        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={processingOrder}
          style={styles.placeOrderButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Lighter background for better contrast
    paddingTop: getPlatformTopSpacing(),
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingTop: getPlatformTopSpacing(),
  },
  loadingText: {
    marginTop: 12,
    ...typography.body,
    color: '#2E3A59', // Darker text for better readability
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', 16, 48),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF2', // Lighter border color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA', // Light background for the button
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E3A59', // Darker text for better readability
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 42,
  },
  directBadgeContainer: {
    alignItems: 'center',
    padding: 20,
    marginVertical: 12,
    width: '100%',
    alignSelf: 'center',
  },
  directBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50', // Brighter green for better visibility
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24, // More rounded corners
    marginBottom: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  directBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
  directBadgeSubtext: {
    fontSize: 14,
    color: '#6B7280', // Softer color for subtext
    marginTop: 4,
  },
  productCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '90%',
  },
  productHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF2', // Lighter border color
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#FAFBFC', // Subtle background color for header
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E3A59', // Darker text for better readability
    letterSpacing: 0.2,
  },
  productItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F5F7FA', // Background color for image placeholder
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
  },
  productTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4CAF50',
  },
  farmerCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '90%',
  },
  farmerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#FAFBFC',
  },
  farmerInfo: {
    padding: 18,
  },
  farmerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  farmerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2E3A59',
    marginRight: 6,
  },
  farmerLocation: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  farmerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  farmerRatingText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
    fontWeight: '500',
  },
  deliveryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '90%',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#FAFBFC',
  },
  deliveryOptions: {
    padding: 16,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedDeliveryOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0F9F0',
    borderWidth: 2,
  },
  deliveryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deliveryOptionInfo: {
    flex: 1,
  },
  deliveryOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 4,
  },
  selectedDeliveryOptionTitle: {
    color: '#4CAF50',
  },
  deliveryOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  addressCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '90%',
  },
  addressHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#FAFBFC',
  },
  addressForm: {
    padding: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#4B5563',
    backgroundColor: '#FFFFFF',
  },
  paymentCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '90%',
  },
  paymentHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#FAFBFC',
  },
  paymentOptions: {
    padding: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedPaymentOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0F9F0',
    borderWidth: 2,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
  },
  selectedPaymentOptionTitle: {
    color: '#4CAF50',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '90%',
  },
  summaryHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#FAFBFC',
  },
  summaryContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#EBEEF2',
    paddingTop: 16,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  bottomSpacing: {
    height: 100,
    width: '100%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EBEEF2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginRight: 8,
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  placeOrderButton: {
    minWidth: 160,
    height: 48,
    borderRadius: 24,
  },
  // New styles for availability modes
  availabilityBadgeContainer: {
    marginLeft: 12,
    flexDirection: 'row',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  availabilityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 4,
  },
  marketOnlyBadge: {
    backgroundColor: '#F97316', // Bright orange
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  pickupBadge: {
    backgroundColor: '#3B82F6', // Bright blue
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  deliveryBadge: {
    backgroundColor: '#10B981', // Bright green
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledDeliveryOption: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  disabledIcon: {
    backgroundColor: '#F3F4F6',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  marketLocationText: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default DirectCheckoutScreen;
