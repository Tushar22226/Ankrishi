import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { OrderItem, PaymentMethod, ProductCategory } from '../../models/Product';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import WalletService from '../../services/WalletService';
import CartService, { CartItem, GroupedCartItems } from '../../services/CartService';

const GroupCheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [groupedItems, setGroupedItems] = useState<GroupedCartItems>({});
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<Record<string, 'delivery' | 'self_pickup'>>({});
  const [shippingAddresses, setShippingAddresses] = useState<Record<string, any>>({});

  // Load data on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadCheckoutData();
    } else {
      setLoading(false);
      Alert.alert('Error', 'You must be logged in to checkout');
      navigation.goBack();
    }
  }, [userProfile]);

  // Load checkout data
  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Get wallet balance
      const balance = await WalletService.getBalance(userProfile!.uid);
      setWalletBalance(balance);
      
      // Get grouped cart items
      const items = await CartService.getGroupedCartItems(userProfile!.uid);
      setGroupedItems(items);
      
      // Initialize delivery options and shipping addresses
      const deliveryOpts: Record<string, 'delivery' | 'self_pickup'> = {};
      const addresses: Record<string, any> = {};
      
      // Set default delivery option for each seller
      Object.keys(items).forEach(sellerId => {
        deliveryOpts[sellerId] = 'delivery';
        addresses[sellerId] = {
          name: userProfile?.displayName || '',
          phone: userProfile?.phoneNumber || '',
          address: '',
          city: '',
          state: '',
          pincode: '',
        };
      });
      
      setDeliveryOptions(deliveryOpts);
      setShippingAddresses(addresses);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading checkout data:', error);
      Alert.alert('Error', 'Failed to load checkout data');
      setLoading(false);
    }
  };

  // Calculate total price for a seller's items
  const calculateSellerTotal = (sellerId: string) => {
    if (!groupedItems[sellerId]) return 0;
    
    return Object.values(groupedItems[sellerId]).flat().reduce((total, item) => {
      const itemPrice = item.discountedPrice || item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  // Calculate delivery fee for a seller
  const calculateDeliveryFee = (sellerId: string) => {
    if (deliveryOptions[sellerId] === 'self_pickup') return 0;
    
    const totalPrice = calculateSellerTotal(sellerId);
    return totalPrice > 1000 ? 0 : 50; // Free delivery for orders over ₹1000
  };

  // Calculate total amount for a seller
  const calculateSellerTotalAmount = (sellerId: string) => {
    return calculateSellerTotal(sellerId) + calculateDeliveryFee(sellerId);
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return Object.keys(groupedItems).reduce((total, sellerId) => {
      return total + calculateSellerTotalAmount(sellerId);
    }, 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    try {
      // Validate shipping addresses
      for (const sellerId of Object.keys(groupedItems)) {
        if (deliveryOptions[sellerId] === 'delivery') {
          const address = shippingAddresses[sellerId];
          if (!address.name || !address.phone || !address.address || !address.city || !address.state || !address.pincode) {
            Alert.alert('Error', `Please fill in all shipping address fields for ${groupedItems[sellerId].items[0]?.seller || 'seller'}`);
            return;
          }
        } else {
          const address = shippingAddresses[sellerId];
          if (!address.name || !address.phone) {
            Alert.alert('Error', `Please provide your name and phone number for pickup from ${groupedItems[sellerId].items[0]?.seller || 'seller'}`);
            return;
          }
        }
      }

      // Check wallet balance
      const grandTotal = calculateGrandTotal();
      if (walletBalance === null || walletBalance < grandTotal) {
        Alert.alert('Insufficient Balance', 'You do not have enough balance in your Ankrishi-Wallet to complete this purchase. Please add funds to your wallet.');
        return;
      }

      setProcessingOrder(true);

      // Process each seller's order separately
      const orderIds: string[] = [];
      
      for (const sellerId of Object.keys(groupedItems)) {
        // Create order items
        const orderItems: OrderItem[] = [];
        
        // Process each category's items
        for (const category of Object.keys(groupedItems[sellerId]) as ProductCategory[]) {
          const items = groupedItems[sellerId][category];
          
          // For produce from farmers, we'll handle differently
          const isDirectFromFarmer = category === 'produce' && items.some(item => item.isDirectFromFarmer);
          
          // Add items to order
          for (const item of items) {
            const orderItem: OrderItem = {
              productId: item.productId,
              productName: item.name,
              productImage: item.image,
              quantity: item.quantity,
              price: item.discountedPrice || item.price,
              totalPrice: (item.discountedPrice || item.price) * item.quantity,
            };
            
            orderItems.push(orderItem);
          }
        }
        
        // Calculate amounts
        const totalPrice = calculateSellerTotal(sellerId);
        const deliveryFee = calculateDeliveryFee(sellerId);
        const totalAmount = calculateSellerTotalAmount(sellerId);
        
        // 1. Deduct money from buyer's wallet
        await WalletService.withdrawBalance(
          userProfile!.uid,
          totalAmount,
          `Payment for order from ${groupedItems[sellerId].items[0]?.seller || 'seller'}`
        );
        
        // 2. Add money to seller's wallet (only the product price, not delivery fee)
        await WalletService.addBalance(
          sellerId,
          totalPrice,
          `Payment received for order from ${userProfile?.displayName || 'buyer'}`
        );
        
        // 3. Store delivery fee if applicable
        if (deliveryFee > 0) {
          const deliveryFeesRef = database().ref('delivery_fees');
          await deliveryFeesRef.push({
            orderId: 'pending', // Will be updated after order creation
            buyerId: userProfile!.uid,
            sellerId: sellerId,
            amount: deliveryFee,
            timestamp: Date.now(),
          });
        }
        
        // Create order
        const orderId = await MarketplaceService.createDirectOrder(
          userProfile!.uid,
          sellerId,
          orderItems,
          shippingAddresses[sellerId],
          'wallet' as PaymentMethod,
          deliveryOptions[sellerId]
        );
        
        orderIds.push(orderId);
        
        // Create food_delivery entry if delivery option is selected
        if (deliveryOptions[sellerId] === 'delivery') {
          await database().ref(`food_delivery/${orderId}`).set({
            order_id: orderId,
            product_status: 'pending',
            delivery_charge: deliveryFee,
            cash_on_delivery: 0,
            customer_details: {
              name: shippingAddresses[sellerId].name,
              phone: shippingAddresses[sellerId].phone,
              address: shippingAddresses[sellerId].address,
              city: shippingAddresses[sellerId].city,
              state: shippingAddresses[sellerId].state,
              pincode: shippingAddresses[sellerId].pincode,
            },
          });
        }
      }
      
      // Clear cart after successful order
      await CartService.clearCart(userProfile!.uid);
      
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
        {Object.keys(groupedItems).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Button
              title="Continue Shopping"
              onPress={() => navigation.navigate('Marketplace' as never)}
              style={styles.continueButton}
            />
          </View>
        ) : (
          <>
            {/* Seller Orders */}
            {Object.keys(groupedItems).map((sellerId) => (
              <Card key={sellerId} style={styles.sellerCard}>
                <View style={styles.sellerHeader}>
                  <Text style={styles.sellerName}>
                    {groupedItems[sellerId].items[0]?.seller || 'Seller'}
                  </Text>
                </View>
                
                {/* Order Items */}
                {Object.keys(groupedItems[sellerId]).map((category) => (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    
                    {groupedItems[sellerId][category as ProductCategory].map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>
                          {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
                
                {/* Delivery Options */}
                <View style={styles.deliveryOptionsContainer}>
                  <Text style={styles.sectionTitle}>Delivery Options</Text>
                  
                  <View style={styles.deliveryOptions}>
                    <TouchableOpacity
                      style={[
                        styles.deliveryOption,
                        deliveryOptions[sellerId] === 'delivery' && styles.selectedDeliveryOption,
                      ]}
                      onPress={() => {
                        setDeliveryOptions({
                          ...deliveryOptions,
                          [sellerId]: 'delivery',
                        });
                      }}
                    >
                      <Ionicons name="home-outline" size={24} color={colors.textPrimary} />
                      <View style={styles.deliveryOptionInfo}>
                        <Text style={styles.deliveryOptionTitle}>Home Delivery</Text>
                        <Text style={styles.deliveryOptionDescription}>
                          Delivered to your doorstep
                        </Text>
                      </View>
                      {deliveryOptions[sellerId] === 'delivery' && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.deliveryOption,
                        deliveryOptions[sellerId] === 'self_pickup' && styles.selectedDeliveryOption,
                      ]}
                      onPress={() => {
                        setDeliveryOptions({
                          ...deliveryOptions,
                          [sellerId]: 'self_pickup',
                        });
                      }}
                    >
                      <Ionicons name="location-outline" size={24} color={colors.textPrimary} />
                      <View style={styles.deliveryOptionInfo}>
                        <Text style={styles.deliveryOptionTitle}>Self Pickup</Text>
                        <Text style={styles.deliveryOptionDescription}>
                          Pickup from seller's location
                        </Text>
                      </View>
                      {deliveryOptions[sellerId] === 'self_pickup' && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Order Summary */}
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(calculateSellerTotal(sellerId))}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(calculateDeliveryFee(sellerId))}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelTotal}>Total</Text>
                    <Text style={styles.summaryValueTotal}>
                      {formatCurrency(calculateSellerTotalAmount(sellerId))}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            
            {/* Grand Total */}
            <Card style={styles.grandTotalCard}>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(calculateGrandTotal())}
                </Text>
              </View>
              
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletBalanceLabel}>Wallet Balance</Text>
                <Text style={styles.walletBalanceValue}>
                  {walletBalance !== null ? formatCurrency(walletBalance) : 'Loading...'}
                </Text>
              </View>
            </Card>
            
            {/* Place Order Button */}
            <Button
              title="Place Order"
              onPress={handlePlaceOrder}
              loading={processingOrder}
              style={styles.placeOrderButton}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.small,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: spacing.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  continueButton: {
    marginTop: spacing.large,
  },
  sellerCard: {
    marginBottom: spacing.medium,
  },
  sellerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.small,
    marginBottom: spacing.small,
  },
  sellerName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  categorySection: {
    marginBottom: spacing.medium,
  },
  categoryTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  itemQuantity: {
    ...typography.body,
    color: colors.textSecondary,
    marginHorizontal: spacing.medium,
  },
  itemPrice: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  deliveryOptionsContainer: {
    marginTop: spacing.medium,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  deliveryOptions: {
    marginBottom: spacing.medium,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.small,
  },
  selectedDeliveryOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  deliveryOptionInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  deliveryOptionTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  deliveryOptionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryContainer: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  summaryLabelTotal: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  summaryValueTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  grandTotalCard: {
    marginBottom: spacing.medium,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  grandTotalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  grandTotalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletBalanceLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  walletBalanceValue: {
    ...typography.bodyBold,
    color: colors.success,
  },
  placeOrderButton: {
    marginBottom: spacing.extraLarge,
  },
});

export default GroupCheckoutScreen;
