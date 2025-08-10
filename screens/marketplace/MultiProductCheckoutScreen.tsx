import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import CartService, { CartItem } from '../../services/CartService';
import WalletService from '../../services/WalletService';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { database } from '../../firebase/config';
import { PaymentMethod } from '../../models/Order';

const MultiProductCheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get params from route
  const { fromCart, cartItems } = route.params as {
    fromCart?: boolean;
    cartItems?: CartItem[];
  };

  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CartItem[]>([]);
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'self_pickup'>('delivery');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [fromCart, cartItems]);

  // Reload saved addresses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userProfile?.uid) {
        loadSavedAddresses();
      }
      return () => {};
    }, [userProfile?.uid])
  );

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!userProfile) return;

      try {
        setLoadingWallet(true);
        const balance = await WalletService.getBalance(userProfile.uid);
        setWalletBalance(balance);
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        Alert.alert('Error', 'Failed to load wallet balance');
      } finally {
        setLoadingWallet(false);
      }
    };

    loadWalletBalance();
  }, [userProfile]);

  // Load saved addresses
  const loadSavedAddresses = async () => {
    try {
      console.log('Loading saved addresses...');
      if (!userProfile?.uid) return;

      // Load saved addresses
      const addresses = await MarketplaceService.getUserAddresses(userProfile.uid);
      console.log('Loaded addresses:', addresses.length);
      setSavedAddresses(addresses);

      // If we have saved addresses and the current address is empty, use the first saved address
      if (addresses.length > 0 && !shippingAddress.address) {
        setShippingAddress(addresses[0]);
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      if (fromCart && cartItems && cartItems.length > 0) {
        // Set products from cart items
        setProducts(cartItems);
      } else {
        Alert.alert('Error', 'No products found in cart');
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

        // Load saved addresses
        await loadSavedAddresses();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load checkout data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return products.reduce((total, item) => {
      const itemPrice = item.discountedPrice || item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  // Calculate delivery fee
  const calculateDeliveryFee = () => {
    if (deliveryOption === 'self_pickup') return 0;

    return 100; // Fixed delivery fee of ₹100
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return calculateSubtotal() + calculateDeliveryFee();
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
      } else {
        // For self-pickup, we still need basic contact information
        if (!shippingAddress.name || !shippingAddress.phone) {
          Alert.alert('Error', 'Please provide your name and phone number for pickup');
          return;
        }
      }

      if (!userProfile) {
        Alert.alert('Error', 'You must be logged in to place an order');
        return;
      }

      // Check wallet balance
      const totalAmount = calculateTotalAmount();
      if (walletBalance === null || walletBalance < totalAmount) {
        Alert.alert('Insufficient Balance', 'You do not have enough balance in your Ankrishi-Wallet to complete this purchase. Please add funds to your wallet.');
        return;
      }

      setProcessingOrder(true);

      // Group products by seller
      const groupedProducts: Record<string, CartItem[]> = {};
      products.forEach(product => {
        if (!groupedProducts[product.sellerId]) {
          groupedProducts[product.sellerId] = [];
        }
        groupedProducts[product.sellerId].push(product);
      });

      // Process each seller's order separately
      const orderIds: string[] = [];

      for (const sellerId in groupedProducts) {
        const sellerProducts = groupedProducts[sellerId];

        // Create order items
        const orderItems = sellerProducts.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.discountedPrice || item.price,
          quantity: item.quantity,
          image: item.image,
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
            sellerId: sellerId,
            amount: sellerDeliveryFee,
            timestamp: Date.now(),
            holdTransactionId: holdTransaction.id
          };
          await deliveryFeesRef.push(deliveryFeeData);
        }

        // Create order with payment hold information
        const orderId = await MarketplaceService.createOrder(
          userProfile.uid,
          sellerId,
          orderItems,
          shippingAddress,
          'wallet' as PaymentMethod,
          deliveryOption,
          undefined, // deliveryAgentId
          holdTransaction.id // Store the hold transaction ID with the order
        );

        // Update the hold transaction with the order ID
        await database().ref(`wallets/${userProfile.uid}/transactions/${holdTransaction.id}`).update({
          relatedOrderId: orderId
        });

        // Update the delivery fee record with the order ID
        if (sellerDeliveryFee > 0) {
          const deliveryFeesSnapshot = await database().ref('delivery_fees')
            .orderByChild('buyerId')
            .equalTo(userProfile.uid)
            .once('value');

          if (deliveryFeesSnapshot.exists()) {
            // Find the most recent entry for this buyer
            let mostRecentKey = null;
            let mostRecentTimestamp = 0;

            deliveryFeesSnapshot.forEach((childSnapshot) => {
              const data = childSnapshot.val();
              if (data.timestamp > mostRecentTimestamp && data.orderId === 'pending') {
                mostRecentTimestamp = data.timestamp;
                mostRecentKey = childSnapshot.key;
              }
              return false; // Continue iteration
            });

            if (mostRecentKey) {
              await database().ref(`delivery_fees/${mostRecentKey}`).update({
                orderId: orderId
              });
            }
          }
        }

        orderIds.push(orderId);
      }

      // Clear cart after successful order
      await CartService.clearCart(userProfile.uid);

      // Navigate to order success screen
      navigation.navigate('OrderSuccess' as never, { orderIds } as never);
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

        <Text style={styles.title}>Checkout</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Products Summary */}
        <Card style={styles.productsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Products Summary</Text>
          </View>

          <FlatList
            data={products}
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
                  <Text style={styles.sellerName}>Seller: {item.seller}</Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </Card>

        {/* Delivery Options */}
        <Card style={styles.deliveryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Delivery Options</Text>
          </View>

          <View style={styles.deliveryOptions}>
            {/* Home Delivery Option */}
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'delivery' && styles.selectedDeliveryOption,
              ]}
              onPress={() => setDeliveryOption('delivery')}
            >
              <View style={styles.deliveryOptionContent}>
                <View style={styles.deliveryOptionIcon}>
                  <Ionicons
                    name="home-outline"
                    size={24}
                    color={deliveryOption === 'delivery' ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.deliveryOptionInfo}>
                  <Text
                    style={[
                      styles.deliveryOptionTitle,
                      deliveryOption === 'delivery' && styles.selectedDeliveryOptionTitle,
                    ]}
                  >
                    Home Delivery
                  </Text>
                  <Text style={styles.deliveryOptionDescription}>
                    Get your products delivered to your doorstep (₹100 delivery fee)
                  </Text>
                </View>
              </View>

              {deliveryOption === 'delivery' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Self Pickup Option */}
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'self_pickup' && styles.selectedDeliveryOption,
              ]}
              onPress={() => setDeliveryOption('self_pickup')}
            >
              <View style={styles.deliveryOptionContent}>
                <View style={styles.deliveryOptionIcon}>
                  <Ionicons
                    name="location-outline"
                    size={24}
                    color={deliveryOption === 'self_pickup' ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.deliveryOptionInfo}>
                  <Text
                    style={[
                      styles.deliveryOptionTitle,
                      deliveryOption === 'self_pickup' && styles.selectedDeliveryOptionTitle,
                    ]}
                  >
                    Self Pickup
                  </Text>
                  <Text style={styles.deliveryOptionDescription}>
                    Pick up your products from the seller's location
                  </Text>
                </View>
              </View>

              {deliveryOption === 'self_pickup' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Shipping Address */}
        {deliveryOption === 'delivery' && (
          <Card style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowAddressModal(true)}
              >
                <Text style={styles.editButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addressInfo}>
              <Text style={styles.addressName}>{shippingAddress.name}</Text>
              <Text style={styles.addressPhone}>{shippingAddress.phone}</Text>
              <Text style={styles.addressText}>
                {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
              </Text>
            </View>
          </Card>
        )}

        {/* Contact Information for Self Pickup */}
        {deliveryOption === 'self_pickup' && (
          <Card style={styles.contactCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>

            <View style={styles.contactFields}>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={shippingAddress.name}
                onChangeText={(text) => setShippingAddress({ ...shippingAddress, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={shippingAddress.phone}
                onChangeText={(text) => setShippingAddress({ ...shippingAddress, phone: text })}
              />
            </View>
          </Card>
        )}

        {/* Payment Method */}
        <Card style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentOptions}>
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

            <View style={styles.walletBalance}>
              <Text style={styles.walletBalanceLabel}>Available Balance:</Text>
              <Text style={styles.walletBalanceValue}>
                {loadingWallet ? 'Loading...' : formatCurrency(walletBalance || 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryItems}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Subtotal</Text>
              <Text style={styles.summaryItemValue}>{formatCurrency(calculateSubtotal())}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Delivery Fee</Text>
              <Text style={styles.summaryItemValue}>
                {calculateDeliveryFee() === 0 ? 'FREE' : formatCurrency(calculateDeliveryFee())}
              </Text>
            </View>

            <View style={[styles.summaryItem, styles.totalItem]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(calculateTotalAmount())}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <Button
          title={`Place Order • ${formatCurrency(calculateTotalAmount())}`}
          onPress={handlePlaceOrder}
          loading={processingOrder}
          fullWidth
          style={styles.placeOrderButton}
        />
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addressList}>
              {savedAddresses.length > 0 ? (
                savedAddresses.map((address, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.addressItem}
                    onPress={() => {
                      setShippingAddress(address);
                      setShowAddressModal(false);
                    }}
                  >
                    <View style={styles.addressItemContent}>
                      <Text style={styles.addressName}>{address.name}</Text>
                      <Text style={styles.addressPhone}>{address.phone}</Text>
                      <Text style={styles.addressText}>
                        {address.address}, {address.city}, {address.state} - {address.pincode}
                      </Text>
                    </View>

                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={
                        address.address === shippingAddress.address
                          ? colors.primary
                          : colors.lightGray
                      }
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noAddressContainer}>
                  <Text style={styles.noAddressText}>No saved addresses found</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.addAddressContainer}>
              <Button
                title="Add New Address"
                onPress={() => {
                  setShowAddressModal(false);
                  navigation.navigate('Marketplace', { screen: 'AddAddress' } as never);
                }}
                variant="outline"
                fullWidth
              />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Extra padding for the footer
  },
  productsCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  productItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  productTotal: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  sellerName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  deliveryCard: {
    marginBottom: spacing.md,
  },
  deliveryOptions: {
    padding: spacing.md,
  },
  deliveryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectedDeliveryOption: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  deliveryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deliveryOptionInfo: {
    flex: 1,
  },
  deliveryOptionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedDeliveryOptionTitle: {
    color: colors.primary,
  },
  deliveryOptionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  addressCard: {
    marginBottom: spacing.md,
  },
  addressInfo: {
    padding: spacing.md,
  },
  addressName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressPhone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  editButton: {
    padding: spacing.xs,
  },
  editButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  contactCard: {
    marginBottom: spacing.md,
  },
  contactFields: {
    padding: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  paymentCard: {
    marginBottom: spacing.md,
  },
  paymentOptions: {
    padding: spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectedPaymentOption: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedPaymentOptionTitle: {
    color: colors.primary,
  },
  paymentOptionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  walletBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  walletBalanceLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  walletBalanceValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryItems: {
    padding: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryItemLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  summaryItemValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  totalItem: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    ...shadows.md,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  addressList: {
    maxHeight: 300,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  addressItemContent: {
    flex: 1,
  },
  noAddressContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAddressText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addAddressContainer: {
    padding: spacing.md,
  },
});

export default MultiProductCheckoutScreen;
