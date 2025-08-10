import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import LoadingQuote from '../../components/LoadingQuote';

// Define order status types
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';

const OrderManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get orderId from route params
  const { orderId } = route.params as { orderId: string };

  // State variables
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  // Status options for the seller to choose from
  const statusOptions: OrderStatus[] = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'];

  // Load order data
  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  // Load order data
  const loadOrderData = async () => {
    try {
      setLoading(true);

      // Fetch the order from the database
      const orderData = await MarketplaceService.getOrder(orderId);

      if (orderData) {
        // Verify that the current user is the seller
        if (orderData.sellerId !== userProfile?.uid) {
          Alert.alert('Access Denied', 'You can only manage orders that you sold.');
          navigation.goBack();
          return;
        }

        setOrder(orderData);
        setSelectedStatus(orderData.status as OrderStatus);
      } else {
        Alert.alert('Error', 'Order not found.');
        navigation.goBack();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order data. Please try again.');
      setLoading(false);
      navigation.goBack();
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedStatus || selectedStatus === order.status) return;

    try {
      setUpdating(true);

      // Update the order status in the database
      await MarketplaceService.updateOrderStatus(orderId, selectedStatus);

      // Update the local order object
      setOrder({
        ...order,
        status: selectedStatus,
        trackingHistory: [
          ...(order.trackingHistory || []),
          {
            status: selectedStatus,
            timestamp: Date.now(),
            description: `Order ${getStatusText(selectedStatus)}`
          }
        ]
      });

      Alert.alert('Success', `Order status updated to ${getStatusText(selectedStatus)}`);
      setUpdating(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
      setUpdating(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';

    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
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
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return 'Unknown';
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
        return colors.secondary;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'returned':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Management</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Order Info Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Information</Text>
          </View>

          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{order.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Customer Info Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>

          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{order.shippingAddress?.name || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{order.shippingAddress?.phone || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {order.shippingAddress?.address || 'N/A'},
                {order.shippingAddress?.city || ''},
                {order.shippingAddress?.state || ''} -
                {order.shippingAddress?.pincode || ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Delivery Partners Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Delivery Partners</Text>
          </View>

          <View style={styles.deliveryPartnerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Porter</Text>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        </Card>

        {/* Order Items Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Items</Text>
          </View>

          <View style={styles.itemsContainer}>
            {order.items.map((item: any, index: number) => (
              <View key={item.id || `item-${index}`} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.productName || 'Product'}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(item.total || item.totalPrice || (item.price * item.quantity) || 0)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.subtotal || order.totalAmount || calculateSubtotal(order.items))}</Text>
            </View>

            {/* Show shipping fee if available */}
            {(order.shippingFee !== undefined && order.shippingFee > 0) ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping Fee</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.shippingFee)}</Text>
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(order.total || order.totalAmount)}</Text>
            </View>
          </View>
        </Card>

        {/* Status Update Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sync-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Update Order Status</Text>
          </View>

          <Text style={styles.statusUpdateText}>
            Select a new status for this order:
          </Text>

          <View style={styles.statusOptions}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.selectedStatusOption,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <Text style={[
                  styles.statusOptionText,
                  selectedStatus === status && styles.selectedStatusText,
                ]}>
                  {getStatusText(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Update Status"
            onPress={updateOrderStatus}
            disabled={updating || selectedStatus === order.status}
            loading={updating}
            style={styles.updateButton}
          />
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
    paddingTop: getPlatformTopSpacing(),
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
    color: colors.textPrimary,
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
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  card: {
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
  orderInfo: {
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
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
  customerInfo: {
    marginBottom: spacing.sm,
  },
  deliveryPartnerInfo: {
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.secondary,
    fontStyle: 'italic',
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
  statusUpdateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statusOptions: {
    marginBottom: spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  selectedStatusOption: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.primary,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  statusOptionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  selectedStatusText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  updateButton: {
    marginTop: spacing.md,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default OrderManagementScreen;
