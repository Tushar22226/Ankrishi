import React, { useState, useEffect, useMemo } from 'react';
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
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingQuote from '../../components/LoadingQuote';
import RateOrderModal from '../../components/RateOrderModal';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import ReceiptService from '../../services/ReceiptService';

// Order status type
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered';

// Mock order data
const mockOrder = {
  id: 'ORD123456',
  status: 'confirmed' as OrderStatus,
  createdAt: new Date().getTime() - 86400000, // 1 day ago
  estimatedDelivery: new Date().getTime() + 86400000 * 3, // 3 days from now
  trackingHistory: [
    {
      status: 'pending',
      timestamp: new Date().getTime() - 86400000, // 1 day ago
      description: 'Order placed successfully',
    },
    {
      status: 'confirmed',
      timestamp: new Date().getTime() - 43200000, // 12 hours ago
      description: 'Order confirmed by seller',
    },
  ],
  shippingAddress: {
    name: 'John Doe',
    phone: '+91 9876543210',
    address: '123 Main Street, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  },
  paymentMethod: 'Cash on Delivery',
  items: [
    {
      id: '1',
      name: 'NPK Fertilizer',
      quantity: 2,
      price: 450,
      total: 900,
    },
  ],
  subtotal: 900,
  shippingFee: 50,
  total: 950,
};

const OrderTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get params from route
  const { orderId } = route.params as { orderId: string };

  // State
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Load order data
  useEffect(() => {
    loadOrderData();
  }, []);

  // Load order data
  const loadOrderData = async () => {
    try {
      setLoading(true);

      // Try to fetch the order from the database using MarketplaceService
      try {
        const orderData = await MarketplaceService.getOrder(orderId);
        if (orderData) {
          // Ensure required properties exist with defaults
          const completeOrderData = {
            ...orderData,
            // Add trackingInfo.trackingHistory if it doesn't exist
            trackingInfo: {
              ...(orderData.trackingInfo || {}),
              trackingHistory: orderData.trackingInfo?.trackingHistory ||
                               (orderData as any).trackingHistory || []
            }
          };
          setOrder(completeOrderData);
          setLoading(false);
          return;
        }
      } catch (dbError) {
        console.error('Error fetching order from database:', dbError);
      }

      // Fallback to mock data if database fetch fails
      console.log('Using mock order data for order ID:', orderId);

      // Create a complete order object with all required properties
      const orderData = {
        ...mockOrder,
        id: orderId,
        // Ensure trackingInfo.trackingHistory exists
        trackingInfo: {
          trackingHistory: (mockOrder as any).trackingHistory || []
        }
      };

      setOrder(orderData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading order data:', error);
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'processing':
        return colors.info;
      case 'out_for_delivery':
        return colors.primary;
      case 'delivered':
        return colors.success;
      default:
        return colors.mediumGray;
    }
  };

  // Get status text
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Unknown';
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate subtotal from items
  const calculateSubtotal = (items: any[] | undefined) => {
    if (!items || !Array.isArray(items)) {
      return 0;
    }

    return items.reduce((total, item) => {
      // Use totalPrice, total, or calculate from price * quantity
      const itemTotal = item.totalPrice || item.total || (item.price * item.quantity) || 0;
      return total + itemTotal;
    }, 0);
  };

  // Share receipt
  const shareReceipt = async () => {
    try {
      if (!order) return;

      try {
        // Try to share receipt
        await ReceiptService.shareReceipt(order);
      } catch (shareError) {
        console.log('Sharing failed, falling back to alert:', shareError);
        // Fallback to showing receipt in alert
        showReceiptInAlert();
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  };



  // Handle rating submission
  const handleRateOrder = async (rating: number, comment: string) => {
    try {
      setRatingSubmitting(true);

      // Submit the rating using MarketplaceService
      await MarketplaceService.completeOrder(
        orderId,
        { rating, comment },
        undefined // No farmer rating
      );

      // Update the local order object to reflect the rating
      setOrder({
        ...order,
        buyerRating: {
          rating,
          comment,
          timestamp: Date.now(),
        },
      });

      // Also update the product's ratings
      if (order?.items?.[0]?.productId) {
        try {
          // Get the current product
          const productId = order.items[0].productId;
          const product = await MarketplaceService.getProduct(productId);

          if (product) {
            // Add the new rating to the product's ratings array
            const newRating = {
              rating,
              review: comment,
              timestamp: Date.now(),
              reviewerName: userProfile?.displayName || 'Anonymous User',
              reviewerId: userProfile?.uid || '',
            };

            const ratings = product.ratings || [];
            ratings.push(newRating);

            // Calculate the new average rating
            const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

            // Update the product with the new ratings and average rating
            await MarketplaceService.updateProduct(productId, {
              ratings,
              averageRating,
            });

            console.log(`Updated product ${product.name} with new rating: ${rating}`);
          }
        } catch (productError) {
          console.error('Error updating product ratings:', productError);
          // Don't block the order rating process if product update fails
        }
      }

      Alert.alert('Success', 'Thank you for your rating!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
      setShowRatingModal(false);
    }
  };

  // Check if the order can be rated
  const canRateOrder = useMemo(() => {
    if (!order) return false;

    // Can only rate delivered orders
    if (order.status !== 'delivered') return false;

    // Can't rate if already rated
    if (order.buyerRating) return false;

    return true;
  }, [order]);

  // Show receipt in an alert as fallback
  const showReceiptInAlert = () => {
    // Create a more readable receipt format for the alert
    const receiptContent = `
Order #${order.id}
Date: ${formatDate(order.createdAt)}
Status: ${getStatusText(order.status)}

Customer: ${order.shippingAddress.name}
Address: ${order.shippingAddress.address}, ${order.shippingAddress.city}

Items:
${order.items.map((item: any) => `• ${item.name || item.productName || 'Product'} (${item.quantity}) - ₹${item.total || item.totalPrice || (item.price * item.quantity) || 0}`).join('\n')}

Subtotal: ₹${order.subtotal || order.totalAmount || calculateSubtotal(order.items)}
${order.shippingFee ? `Shipping: ₹${order.shippingFee}` : ''}
Total: ₹${order.total || order.totalAmount}
    `;

    Alert.alert(
      'Order Receipt',
      receiptContent,
      [
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <LoadingQuote
        loadingText="Loading order details..."
        style={styles.loadingContainer}
      />
    );
  }

  // Order not found
  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>
          The order you're looking for doesn't exist or has been removed.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.goBackButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <Card style={styles.statusCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Status</Text>
          </View>

          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderIdText}>Order #{order.id}</Text>
              <Text style={styles.orderDateText}>
                Placed on {formatDate(order.createdAt)}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.deliveryInfo}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.deliveryText}>
              Estimated Delivery: {formatDate(order.estimatedDelivery)}
            </Text>
          </View>
        </Card>

        {/* Tracking Timeline */}
        <Card style={styles.trackingCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Tracking Information</Text>
          </View>

          <View style={styles.timeline}>
            {['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'].map((status, index) => {
              const isCompleted = order.trackingInfo?.trackingHistory && order.trackingInfo.trackingHistory.some(
                (history: any) => history.status === status
              );
              const isCurrent = order.status === status;

              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isCompleted && styles.completedDot,
                      isCurrent && styles.currentDot,
                    ]}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      )}
                    </View>
                    {index < 4 && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.completedLine,
                      ]} />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineTitle,
                      isCompleted && styles.completedTitle,
                      isCurrent && styles.currentTitle,
                    ]}>
                      {getStatusText(status as OrderStatus)}
                    </Text>

                    {isCompleted && order.trackingInfo?.trackingHistory && (
                      <Text style={styles.timelineDate}>
                        {formatDate(
                          order.trackingInfo.trackingHistory.find(
                            (history: any) => history.status === status
                          )?.timestamp || Date.now()
                        )}{' '}
                        {formatTime(
                          order.trackingInfo.trackingHistory.find(
                            (history: any) => history.status === status
                          )?.timestamp || Date.now()
                        )}
                      </Text>
                    )}

                    {isCompleted && order.trackingInfo?.trackingHistory && (
                      <Text style={styles.timelineDescription}>
                        {order.trackingInfo.trackingHistory.find(
                          (history: any) => history.status === status
                        )?.description || `${getStatusText(status as OrderStatus)} status reached`}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Shipping Address */}
        <Card style={styles.addressCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Shipping Address</Text>
          </View>

          <View style={styles.addressContent}>
            <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
            <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
            <Text style={styles.addressText}>
              {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </Text>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>

          <View style={styles.paymentMethod}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.itemsContainer}>
            {order.items.map((item: any, index: number) => (
              <View key={item.id || `item-${index}`} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.productName || 'Product'}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.total || item.totalPrice || (item.price * item.quantity) || 0}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Show subtotal if available, otherwise calculate from items */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₹{order.subtotal || order.totalAmount || calculateSubtotal(order.items)}</Text>
          </View>

          {/* Show shipping fee if available */}
          {(order.shippingFee !== undefined && order.shippingFee > 0) ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping Fee</Text>
              <Text style={styles.totalValue}>₹{order.shippingFee}</Text>
            </View>
          ) : null}

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>₹{order.total || order.totalAmount}</Text>
            </View>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarButtons}>
          {canRateOrder ? (
            <Button
              title="Rate Order"
              variant="outline"
              leftIcon={<Ionicons name="star" size={20} color={colors.secondary} />}
              onPress={() => setShowRatingModal(true)}
              style={styles.rateButton}
            />
          ) : (
            <Button
              title="Share Receipt"
              variant="outline"
              leftIcon={<Ionicons name="share-social" size={20} color={colors.primary} />}
              onPress={shareReceipt}
              style={styles.receiptButton}
            />
          )}

          <Button
            title="Contact Support"
            leftIcon={<Ionicons name="chatbubble-ellipses" size={20} color={colors.white} />}
            onPress={() => {
              // Navigate to support chat or show support options
              Alert.alert('Support', 'Support feature coming soon!');
            }}
            style={styles.supportButton}
          />
        </View>
      </View>

      {/* Rating Modal */}
      <RateOrderModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRateOrder}
        productName={order?.items?.[0]?.name || order?.items?.[0]?.productName || 'Product'}
      />
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
  // Card common styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    marginHorizontal: -spacing.sm,
    marginTop: -spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  // Status card styles
  statusCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 3,
    maxWidth: 370,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderIdText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  orderDateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  // Tracking card styles
  trackingCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 3,
    maxWidth: 370,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  timeline: {
    marginLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  completedDot: {
    backgroundColor: colors.success,
  },
  currentDot: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  completedLine: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  completedTitle: {
    color: colors.textPrimary,
  },
  currentTitle: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  timelineDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timelineDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Address card styles
  addressCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 3,
    maxWidth: 370,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  addressContent: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  addressName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressPhone: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Summary card styles
  summaryCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 3,
    maxWidth: 370,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  paymentLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  paymentValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  itemsContainer: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  totalContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  grandTotalLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    padding: spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomBarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rateButton: {
    flex: 1,
    marginRight: spacing.sm,
    borderColor: colors.secondary,
  },
  supportButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});

export default OrderTrackingScreen;
