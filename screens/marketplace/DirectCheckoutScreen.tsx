import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
    FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import database from '@react-native-firebase/database';
import { Product, OrderItem, PaymentMethod, ProductAvailabilityMode } from '../../models/Product';
import { UserProfile } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import WalletService from '../../services/WalletService';
import CartService from '../../services/CartService';

const DirectCheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get params from route
  const { productId, quantity, farmerId, isNegotiated, negotiatedPrice, totalNegotiatedPrice, fromCart, cartItems, isPrelisted } = route.params as {
    productId?: string;
    quantity?: number;
    farmerId?: string;
    isNegotiated?: boolean;
    negotiatedPrice?: number; // Per unit price
    totalNegotiatedPrice?: number; // Total price for all units
    fromCart?: boolean;
    cartItems?: any[];
    isPrelisted?: boolean; // Flag to indicate if this is a prelisted product
  };

  // State for multiple products
  const [multipleProducts, setMultipleProducts] = useState<boolean>(false);

  // State
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<UserProfile | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<'self_pickup' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [processingOrder, setProcessingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Load product and farmer details
  useEffect(() => {
    loadData();
  }, [productId, farmerId, fromCart, cartItems]);

  // State for available balance (total balance minus held funds)
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [heldBalance, setHeldBalance] = useState<number | null>(null);

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!userProfile) return;

      try {
        setLoadingWallet(true);
        // Get total balance
        const balance = await WalletService.getBalance(userProfile.uid);
        setWalletBalance(balance);

        // Get held balance
        const held = await WalletService.getHeldBalance(userProfile.uid);
        setHeldBalance(held);

        // Calculate available balance
        const available = await WalletService.getAvailableBalance(userProfile.uid);
        setAvailableBalance(available);
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        Alert.alert('Error', 'Failed to load wallet balance');
      } finally {
        setLoadingWallet(false);
      }
    };

    loadWalletBalance();
  }, [userProfile]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      if (fromCart && cartItems && cartItems.length > 0) {
        // Handle checkout from cart with multiple items
        setMultipleProducts(true);

        // Get the first product details to display
        const firstProductData = await MarketplaceService.getProduct(cartItems[0].productId);
        if (!firstProductData) {
          Alert.alert('Error', 'Product not found');
          navigation.goBack();
          return;
        }

        setProduct(firstProductData);

        // Set delivery option based on product availability mode
        if (firstProductData.availabilityMode === 'market_only') {
          // Market-only products can only be picked up
          setDeliveryOption('self_pickup');
        } else if (firstProductData.availabilityMode === 'pickup_available') {
          // Default to pickup for pickup_available products
          setDeliveryOption('self_pickup');
        } else if (firstProductData.availabilityMode === 'delivery_only') {
          // Delivery-only products can only be delivered
          setDeliveryOption('delivery');
        }

        // Get farmer profile from the first product
        const firstFarmerId = cartItems[0].sellerId;
        const { profile } = await MarketplaceService.getFarmerProfile(firstFarmerId);

        if (!profile) {
          Alert.alert('Error', 'Farmer not found');
          navigation.goBack();
          return;
        }

        setFarmer(profile);
      } else if (productId) {
        // Handle single product checkout
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

        // Update product with isPrelisted flag if it came from route params
        setProduct({
          ...productData,
          isPrelisted: isPrelisted || productData.isPrelisted || false
        });

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
        const { profile } = await MarketplaceService.getFarmerProfile(farmerId!);

        if (!profile) {
          Alert.alert('Error', 'Farmer not found');
          navigation.goBack();
          return;
        }

        setFarmer(profile);
      } else {
        Alert.alert('Error', 'Invalid checkout parameters');
        navigation.goBack();
        return;
      }

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
    if (multipleProducts && cartItems) {
      // Calculate total for multiple products
      return cartItems.reduce((total, item) => {
        const itemPrice = item.discountedPrice || item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
    } else if (product) {
      // Calculate for single product
      // If this is a negotiated order, use the negotiated price per unit * quantity
      if (isNegotiated && negotiatedPrice) {
        return negotiatedPrice * (quantity || 0);
      }

      // Otherwise use the regular price
      const itemPrice = product.discountedPrice || product.price;
      return itemPrice * (quantity || 0);
    }

    return 0;
  };

  // Calculate delivery fee
  const calculateDeliveryFee = () => {
    if (deliveryOption === 'self_pickup') return 0;

    // Fixed delivery fee of ₹100 for all products
    let deliveryFee = 100;

    // Special handling for prelisted products
    if (multipleProducts && cartItems) {
      // Check if we have multiple prelisted products with different harvest dates
      const prelistedProducts = cartItems.filter(item => item.isPrelisted);

      if (prelistedProducts.length > 0) {
        // Get unique harvest dates
        const harvestDates = new Set();
        prelistedProducts.forEach(item => {
          // Check for harvest date in farmDetails first
          if (item.farmDetails?.harvestDate) {
            harvestDates.add(new Date(item.farmDetails.harvestDate).toDateString());
          }
          // Then check in traceabilityInfo if not found in farmDetails
          else if (item.traceabilityInfo?.harvestDate) {
            harvestDates.add(new Date(item.traceabilityInfo.harvestDate).toDateString());
          }
        });

        // If we have multiple prelisted products with different harvest dates
        if (harvestDates.size > 1) {
          // Add 50 extra per item after the first one
          deliveryFee += (harvestDates.size - 1) * 50;
        }

        // Check if any product is harvesting tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toDateString();

        const hasProductHarvestingTomorrow = Array.from(harvestDates).some(
          date => date === tomorrowString
        );

        // No extra charges if harvesting tomorrow
        if (hasProductHarvestingTomorrow) {
          deliveryFee = 100;
        }
      }
    } else if (product?.isPrelisted) {
      // Single prelisted product
      let harvestDate = null;

      // Check for harvest date in farmDetails first
      if (product.farmDetails?.harvestDate) {
        harvestDate = new Date(product.farmDetails.harvestDate);
      }
      // Then check in traceabilityInfo if not found in farmDetails
      else if (product.traceabilityInfo?.harvestDate) {
        harvestDate = new Date(product.traceabilityInfo.harvestDate);
      }

      if (harvestDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // If not harvesting tomorrow, add 100 extra
        if (harvestDate.toDateString() !== tomorrow.toDateString()) {
          deliveryFee += 100;
        }
      } else {
        // No harvest date found, use standard fee
        console.log('No harvest date found for prelisted product, using standard fee');
      }
    }

    return deliveryFee;
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

      // Check if we have product information
      if (!multipleProducts && !product) {
        Alert.alert('Error', 'Product information is missing');
        return;
      }

      // Check if we have cart items for multiple products
      if (multipleProducts && (!cartItems || cartItems.length === 0)) {
        Alert.alert('Error', 'Cart items are missing');
        return;
      }

      // Double-check that user is not buying their own product
      if (!multipleProducts && product && userProfile.uid === product.sellerId) {
        Alert.alert('Error', 'You cannot purchase your own product');
        navigation.goBack();
        return;
      }

      // Check if user has sufficient total balance
      if (walletBalance === null || walletBalance < calculateTotalAmount()) {
        Alert.alert('Insufficient Balance', 'You do not have enough balance in your Ankrishi-Wallet to complete this purchase. Please add funds to your wallet.');
        return;
      }

      // Check if user has sufficient available balance (total balance minus held funds)
      if (availableBalance === null || availableBalance < calculateTotalAmount()) {
        Alert.alert(
          'Insufficient Available Balance',
          `You have ₹${walletBalance?.toFixed(2)} in your wallet, but ₹${heldBalance?.toFixed(2)} is currently held for pending orders. Your available balance is ₹${availableBalance?.toFixed(2)}. Please add more funds or wait for your held funds to be released.`
        );
        return;
      }

      setProcessingOrder(true);

      if (multipleProducts && cartItems && cartItems.length > 0) {
        // Handle multiple products from cart
        const orderIds: string[] = [];

        // Group products by seller
        const groupedProducts: Record<string, any[]> = {};
        cartItems.forEach(item => {
          if (!groupedProducts[item.sellerId]) {
            groupedProducts[item.sellerId] = [];
          }
          groupedProducts[item.sellerId].push(item);
        });

        // Process each seller's order separately
        for (const sellerId in groupedProducts) {
          const sellerProducts = groupedProducts[sellerId];

          // Create order items
          const orderItems = sellerProducts.map(item => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image || '',
            quantity: item.quantity,
            price: item.discountedPrice || item.price,
            totalPrice: (item.discountedPrice || item.price) * item.quantity,
            isNegotiated: false,
            negotiatedPrice: undefined,
            isPrelisted: item.isPrelisted || false,
            // Include harvest date for prelisted products
            ...(item.isPrelisted && item.farmDetails?.harvestDate ? {
              harvestDate: item.farmDetails.harvestDate
            } : {})
          }));

          // Calculate total price for this seller's products
          const sellerSubtotal = sellerProducts.reduce((total, item) => {
            const itemPrice = item.discountedPrice || item.price;
            return total + (itemPrice * item.quantity);
          }, 0);

          // Calculate delivery fee for this order
          const sellerDeliveryFee = sellerSubtotal > 1000 ? 0 : (deliveryOption === 'self_pickup' ? 0 : 50);

          // Calculate total amount for this order
          const sellerTotalAmount = sellerSubtotal + sellerDeliveryFee;

          // 1. Hold money in buyer's wallet (don't transfer yet)
          const holdTransaction = await WalletService.holdBalance(
            userProfile.uid,
            sellerTotalAmount,
            `Payment for order from ${sellerProducts[0].seller} - Pending confirmation`,
            'pending', // Will be updated after order creation
            sellerId
          );

          // 2. Store delivery fee information if applicable
          let deliveryFeeData = null;
          if (sellerDeliveryFee > 0) {
            const deliveryFeesRef = database().ref('delivery_fees');
            deliveryFeeData = {
              orderId: 'pending', // Will be updated after order creation
              buyerId: userProfile.uid,
              farmerId: sellerId,
              amount: sellerDeliveryFee,
              timestamp: Date.now(),
              holdTransactionId: holdTransaction.id
            };
            await deliveryFeesRef.push(deliveryFeeData);
          }

          // Create order with payment hold information
          const orderId = await MarketplaceService.createDirectOrder(
            userProfile.uid,
            sellerId,
            orderItems,
            shippingAddress,
            paymentMethod,
            deliveryOption,
            undefined, // deliveryAgentId
            holdTransaction.id // Store the hold transaction ID with the order
          );

          // Update the hold transaction with the order ID
          await database().ref(`wallets/${userProfile.uid}/transactions/${holdTransaction.id}`).update({
            relatedOrderId: orderId
          });

          // Update delivery fee record with the order ID if applicable
          if (sellerDeliveryFee > 0 && deliveryFeeData) {
            // Find the delivery fee record we just created
            const deliveryFeesRef = database().ref('delivery_fees');
            const snapshot = await deliveryFeesRef.orderByChild('timestamp')
              .equalTo(deliveryFeeData.timestamp)
              .once('value');

            if (snapshot.exists()) {
              // Update the first matching record
              const deliveryFeeRecords = snapshot.val();
              const deliveryFeeId = Object.keys(deliveryFeeRecords)[0];
              await deliveryFeesRef.child(deliveryFeeId).update({
                orderId: orderId
              });
            }
          }

          // Create food_delivery entry if delivery option is selected
          if (deliveryOption === 'delivery') {
            // Create food_delivery entry
            await database().ref(`food_delivery/${orderId}`).set({
              order_id: orderId,
              product_status: 'pending',
              delivery_charge: sellerDeliveryFee,
              cash_on_delivery: 0, // Not using cash on delivery
              customer_details: {
                name: shippingAddress.name,
                phone: shippingAddress.phone,
                address: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
              },
              created_at: Date.now(),
              updated_at: Date.now(),
              payment_method: 'wallet',
              // Check if any products are prelisted
              is_prelisted: sellerProducts.some(item => item.isPrelisted),
              // If there are prelisted products, find the earliest harvest date
              harvest_date: (() => {
                // Get all prelisted products
                const prelistedProducts = sellerProducts.filter(item => item.isPrelisted);
                if (prelistedProducts.length === 0) return null;

                // Collect all harvest dates from different possible locations
                const harvestDates = [];

                for (const item of prelistedProducts) {
                  // Check farmDetails first
                  if (item.farmDetails?.harvestDate) {
                    harvestDates.push(item.farmDetails.harvestDate);
                  }
                  // Then check traceabilityInfo
                  else if (item.traceabilityInfo?.harvestDate) {
                    harvestDates.push(item.traceabilityInfo.harvestDate);
                  }
                }

                if (harvestDates.length === 0) return null;

                // Find the earliest harvest date
                return Math.min(...harvestDates);
              })(),
              // For prelisted products, set expected delivery date to the evening of harvest date
              expected_delivery_date: (() => {
                // Get all prelisted products
                const prelistedProducts = sellerProducts.filter(item => item.isPrelisted);
                if (prelistedProducts.length === 0) return null;

                // Collect all harvest dates from different possible locations
                const harvestDates = [];

                for (const item of prelistedProducts) {
                  // Check farmDetails first
                  if (item.farmDetails?.harvestDate) {
                    harvestDates.push(item.farmDetails.harvestDate);
                  }
                  // Then check traceabilityInfo
                  else if (item.traceabilityInfo?.harvestDate) {
                    harvestDates.push(item.traceabilityInfo.harvestDate);
                  }
                }

                if (harvestDates.length === 0) return null;

                // Find the earliest harvest date
                const earliestHarvestDate = Math.min(...harvestDates);
                const deliveryDate = new Date(earliestHarvestDate);
                deliveryDate.setHours(17, 0, 0, 0); // 5pm on harvest date
                return deliveryDate.getTime();
              })()
            });
          }

          orderIds.push(orderId);
        }

        // Clear cart after successful orders
        await CartService.clearCart(userProfile.uid);

        // Navigate to order success screen with multiple order IDs
        navigation.navigate('OrderSuccess' as never, { orderIds } as never);
        return; // Exit early to avoid the rest of the function
      } else {
        // Handle single product checkout
        // Calculate amounts
        const totalPrice = calculateTotalPrice();
        const deliveryFee = calculateDeliveryFee();
        const totalAmount = calculateTotalAmount();

        // Create order item
        const orderItem: OrderItem = {
          productId: product!.id,
          productName: product!.name,
          productImage: product!.images[0]?.url || '',
          quantity: quantity || 0,
          price: isNegotiated && negotiatedPrice ? negotiatedPrice : (product!.discountedPrice || product!.price),
          totalPrice: totalPrice,
          isNegotiated: isNegotiated || false,
          negotiatedPrice: negotiatedPrice, // Per unit price
          isPrelisted: product!.isPrelisted || false,
          // Include harvest date for prelisted products
          ...(product!.isPrelisted ? (() => {
            // Check for harvest date in multiple locations
            if (product!.farmDetails?.harvestDate) {
              return { harvestDate: product!.farmDetails.harvestDate };
            } else if (product!.traceabilityInfo?.harvestDate) {
              return { harvestDate: product!.traceabilityInfo.harvestDate };
            }
            return {};
          })() : {})
        };

        // 1. Hold money in buyer's wallet (don't transfer yet)
        const holdTransaction = await WalletService.holdBalance(
          userProfile.uid,
          totalAmount,
          `Payment for ${product!.name} (${quantity} units) - Pending confirmation`,
          'pending', // Will be updated after order creation
          farmerId!
        );

        // 2. Store delivery fee information if applicable
        let deliveryFeeData = null;
        if (deliveryFee > 0) {
          const deliveryFeesRef = database().ref('delivery_fees');
          deliveryFeeData = {
            orderId: 'pending', // Will be updated after order creation
            buyerId: userProfile.uid,
            farmerId: farmerId,
            amount: deliveryFee,
            timestamp: Date.now(),
            productId: product!.id,
            productName: product!.name,
            holdTransactionId: holdTransaction.id
          };
          await deliveryFeesRef.push(deliveryFeeData);
        }

        // Create direct order with payment hold information
        const orderId = await MarketplaceService.createDirectOrder(
          userProfile.uid,
          farmerId!,
          [orderItem],
          shippingAddress,
          paymentMethod,
          deliveryOption,
          undefined, // deliveryAgentId
          holdTransaction.id // Store the hold transaction ID with the order
        );

        // Update the hold transaction with the order ID
        await database().ref(`wallets/${userProfile.uid}/transactions/${holdTransaction.id}`).update({
          relatedOrderId: orderId
        });

        // Update delivery fee record with the order ID if applicable
        if (deliveryFee > 0 && deliveryFeeData) {
          // Find the delivery fee record we just created
          const deliveryFeesRef = database().ref('delivery_fees');
          const snapshot = await deliveryFeesRef.orderByChild('timestamp')
            .equalTo(deliveryFeeData.timestamp)
            .once('value');

          if (snapshot.exists()) {
            // Update the first matching record
            const deliveryFeeRecords = snapshot.val();
            const deliveryFeeId = Object.keys(deliveryFeeRecords)[0];
            await deliveryFeesRef.child(deliveryFeeId).update({
              orderId: orderId
            });
          }
        }

        // Create food_delivery entry if delivery option is selected
        if (deliveryOption === 'delivery') {
          // Create food_delivery entry
          await database().ref(`food_delivery/${orderId}`).set({
            product_id: product!.id,
            order_id: orderId,
            product_status: 'pending',
            delivery_charge: deliveryFee,
            cash_on_delivery: 0, // Not using cash on delivery
            customer_details: {
              name: shippingAddress.name,
              phone: shippingAddress.phone,
              address: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              pincode: shippingAddress.pincode,
            },
            created_at: Date.now(),
            updated_at: Date.now(),
            is_negotiated: isNegotiated || false,
            negotiated_price_per_unit: negotiatedPrice || 0,
            total_negotiated_price: totalPrice,
            cash_on_delivery_amount: 0, // Not using cash on delivery
            payment_method: 'wallet',
            // Add prelisted product information
            is_prelisted: product!.isPrelisted || false,
            // Get harvest date from multiple possible locations
            harvest_date: product!.isPrelisted ? (() => {
              if (product!.farmDetails?.harvestDate) {
                return product!.farmDetails.harvestDate;
              } else if (product!.traceabilityInfo?.harvestDate) {
                return product!.traceabilityInfo.harvestDate;
              }
              return null;
            })() : null,
            // For prelisted products, set expected delivery date to the evening of harvest date
            expected_delivery_date: product!.isPrelisted ? (() => {
              let harvestDate = null;

              if (product!.farmDetails?.harvestDate) {
                harvestDate = product!.farmDetails.harvestDate;
              } else if (product!.traceabilityInfo?.harvestDate) {
                harvestDate = product!.traceabilityInfo.harvestDate;
              }

              if (!harvestDate) return null;

              const deliveryDate = new Date(harvestDate);
              deliveryDate.setHours(17, 0, 0, 0); // 5pm on harvest date
                return deliveryDate.getTime();
              })() : null
          });
        }

        // Clear cart if coming from cart
        if (fromCart) {
          await CartService.clearCart(userProfile.uid);
        }

        // Navigate to order success screen
        navigation.navigate('OrderSuccess' as never, { orderIds: [orderId] } as never);
      } // Close the else statement
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
            <Text style={styles.sectionTitle}>
              {multipleProducts ? 'Products Summary' : 'Product Summary'}
            </Text>
          </View>

          {multipleProducts && cartItems ? (
            // Multiple products from cart
            <FlatList
              data={cartItems}
              renderItem={({ item }) => (
                <View style={styles.productItem}>
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/100x100?text=Product' }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>
                      {formatCurrency(item.discountedPrice || item.price)} x {item.quantity}
                    </Text>
                    <Text style={styles.productTotal}>
                      {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                    </Text>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            // Single product
            <View style={styles.productItem}>
              <Image
                source={{ uri: product?.images[0]?.url || 'https://via.placeholder.com/100x100?text=Product' }}
                style={styles.productImage}
                resizeMode="cover"
              />

              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product?.name}</Text>
                {isNegotiated ? (
                  <>
                    <Text style={styles.productPrice}>
                      {formatCurrency(negotiatedPrice || 0)} x {quantity} <Text style={styles.negotiatedTag}>(Negotiated)</Text>
                    </Text>
                    <Text style={styles.productTotal}>
                      {formatCurrency(calculateTotalPrice())}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.productPrice}>
                      {formatCurrency(product?.discountedPrice || product?.price || 0)} x {quantity}
                    </Text>
                    <Text style={styles.productTotal}>
                      {formatCurrency(calculateTotalPrice())}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}
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
                      : `Delivery fee: ${formatCurrency(calculateDeliveryFee())}`}
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
            <View style={styles.walletBalanceContainer}>
              <Text style={styles.walletBalanceLabel}>Wallet Balance:</Text>
              {loadingWallet ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View>
                  <Text style={styles.walletBalanceAmount}>
                    ₹{walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={styles.walletAvailableBalance}>
                    Available: ₹{availableBalance !== null ? availableBalance.toFixed(2) : '0.00'}
                  </Text>
                  {heldBalance !== null && heldBalance > 0 && (
                    <Text style={styles.walletHeldBalance}>
                      Held: ₹{heldBalance.toFixed(2)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                styles.selectedPaymentOption,
              ]}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.paymentOptionIcon}>
                  <Ionicons
                    name="wallet-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.paymentOptionInfo}>
                  <Text
                    style={[
                      styles.paymentOptionTitle,
                      styles.selectedPaymentOptionTitle,
                    ]}
                  >
                    Ankrishi-Wallet
                  </Text>
                  <Text style={styles.paymentOptionDescription}>
                    Pay directly from your Ankrishi-Wallet
                  </Text>
                </View>
              </View>

              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryContent}>
            {isNegotiated ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{quantity} {product?.stockUnit} × {formatCurrency(negotiatedPrice || 0)} (Negotiated)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(calculateTotalPrice())}</Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{quantity} {product?.stockUnit} × {formatCurrency(product?.discountedPrice || product?.price || 0)}</Text>
                <Text style={styles.summaryValue}>{formatCurrency(calculateTotalPrice())}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <View style={{flex: 1}}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                {(product?.isPrelisted || (multipleProducts && cartItems?.some(item => item.isPrelisted))) && (
                  <Text style={styles.deliveryFeeNote}>
                    {product?.isPrelisted ? (() => {
                      // Get harvest date from multiple possible locations
                      let harvestDate = null;

                      if (product.farmDetails?.harvestDate) {
                        harvestDate = new Date(product.farmDetails.harvestDate);
                      } else if (product.traceabilityInfo?.harvestDate) {
                        harvestDate = new Date(product.traceabilityInfo.harvestDate);
                      }

                      if (harvestDate) {
                        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));
                        return harvestDate.toDateString() === tomorrow.toDateString() ?
                          "Standard fee for next-day harvest" :
                          "Additional fee for non-next-day harvest";
                      } else {
                        return "Standard delivery fee";
                      }
                    })() : multipleProducts ? (
                      "Fee based on harvest dates"
                    ) : "Standard delivery fee"}
                  </Text>
                )}
              </View>
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
  negotiatedTag: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700',
    marginLeft: 4,
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
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedPaymentOptionTitle: {
    color: '#4CAF50',
  },
  walletBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9F0',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1E7DD',
  },
  walletBalanceLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2E3A59',
  },
  walletBalanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  walletAvailableBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: 2,
  },
  walletHeldBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
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
  deliveryFeeNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default DirectCheckoutScreen;
