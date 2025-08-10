import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { Order, OrderStatus } from '../../models/Product';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import LoadingQuote from '../../components/LoadingQuote';

// Order types for filtering
const orderTypes = [
  { id: 'all', label: 'All Orders' },
  { id: 'purchase', label: 'Purchases' },
  { id: 'sale', label: 'Sales' },
];

// Order statuses for filtering
const orderStatuses = [
  { id: 'all', label: 'All Statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'processing', label: 'Processing' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeOrderType, setActiveOrderType] = useState('all');
  const [activeOrderStatus, setActiveOrderStatus] = useState('all');

  // Load orders on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        await loadOrders();
      } catch (error) {
        console.error('Error in useEffect fetchOrders:', error);
      }
    };

    fetchOrders();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid]);

  // Filter orders when filters change
  useEffect(() => {
    filterOrders();
  }, [activeOrderType, activeOrderStatus, orders]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
  }, []);

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);

      if (!userProfile?.uid) {
        throw new Error('User not authenticated');
      }

      // Fetch orders where user is buyer (purchases)
      const buyerOrders = await MarketplaceService.getOrdersByUser(userProfile.uid);

      // Add type field for filtering
      const purchaseOrders = buyerOrders.map(order => ({
        ...order,
        type: 'purchase'
      }));

      // Fetch orders where user is seller (sales)
      const sellerOrders = await MarketplaceService.getOrdersBySeller(userProfile.uid);

      // Add type field for filtering
      const saleOrders = sellerOrders.map(order => ({
        ...order,
        type: 'sale'
      }));

      // Combine and set orders
      const allOrders = [...purchaseOrders, ...saleOrders];

      console.log(`Loaded ${allOrders.length} orders (${purchaseOrders.length} purchases, ${saleOrders.length} sales)`);

      // Set orders and update loading state
      setOrders(allOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');

      // Set empty orders array instead of using mock data
      setOrders([]);
      setLoading(false);
    }
  };

  // Filter orders based on active filters
  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by order type
    if (activeOrderType !== 'all') {
      filtered = filtered.filter(order => order.type === activeOrderType);
    }

    // Filter by order status
    if (activeOrderStatus !== 'all') {
      filtered = filtered.filter(order => order.status === activeOrderStatus);
    }

    // Sort by createdAt (newest first)
    filtered.sort((a, b) => {
      const dateA = a.createdAt || 0;
      const dateB = b.createdAt || 0;
      return dateB - dateA;
    });

    setFilteredOrders(filtered);
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (date: Date | number | undefined) => {
    if (!date) {
      return 'N/A';
    }

    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
        return colors.mediumGray;
    }
  };

  // Get status icon
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'confirmed':
        return 'checkmark-circle';
      case 'processing':
        return 'construct';
      case 'out_for_delivery':
        return 'car';
      case 'delivered':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      case 'returned':
        return 'return-down-back';
      default:
        return 'help-circle';
    }
  };

  // Get formatted status
  const getFormattedStatus = (status: OrderStatus) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render an order item
  const renderOrderItem = ({ item }: { item: Order & { type: 'purchase' | 'sale' } }) => {
    // Get the order date - ensure it's a valid date
    const orderDate = item.createdAt ? new Date(item.createdAt) : undefined;

    // Get the total amount - default to 0 if undefined
    const totalAmount = item.totalAmount || 0;

    // Get the other party name (seller for purchases, buyer for sales)
    const otherPartyName = item.type === 'purchase'
      ? item.shippingAddress?.name || 'Unknown Seller'
      : item.shippingAddress?.name || 'Unknown Buyer';

    // Get the items summary
    const itemsSummary = item.items && item.items.length > 0
      ? item.items.map(i => `${i.quantity}x ${i.productName || i.productId}`).join(', ')
      : 'No items';

    // Determine if the current user is the seller of this order
    const isUserSeller = item.type === 'sale' && item.sellerId === userProfile?.uid;

    // Navigate to OrderManagement if user is seller, otherwise to OrderTracking
    const handleOrderPress = () => {
      if (isUserSeller) {
        // Navigate to OrderManagement for sellers to manage their orders
        navigation.navigate('Marketplace' as never, {
          screen: 'OrderManagement',
          params: { orderId: item.id }
        } as never);
      } else {
        // Navigate to OrderTracking for buyers to track their orders
        navigation.navigate('Marketplace' as never, {
          screen: 'OrderTracking',
          params: { orderId: item.id }
        } as never);
      }
    };

    return (
      <Card
        style={styles.orderCard}
        onPress={handleOrderPress}
        elevation="medium"
        borderRadius={borderRadius.lg}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderType}>
            <Ionicons
              name={item.type === 'purchase' ? 'cart' : 'cash'}
              size={16}
              color={item.type === 'purchase' ? colors.info : colors.success}
            />
            <Text style={styles.orderTypeText}>
              {item.type === 'purchase' ? 'Purchase' : 'Sale'}
            </Text>
          </View>

          <View style={styles.orderStatus}>
            <Ionicons
              name={getStatusIcon(item.status)}
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text
              style={[
                styles.orderStatusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getFormattedStatus(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderId}>{item.id.substring(0, 8)}...</Text>
          </View>

          <Text style={styles.orderItems}>
            {itemsSummary}
          </Text>

          <View style={styles.orderParty}>
            {item.type === 'purchase' ? (
              <Text style={styles.orderPartyText}>
                <Text style={styles.orderPartyLabel}>From: </Text>
                {otherPartyName}
              </Text>
            ) : (
              <Text style={styles.orderPartyText}>
                <Text style={styles.orderPartyLabel}>To: </Text>
                {otherPartyName}
              </Text>
            )}
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.orderDate}>
              Ordered: {formatDate(orderDate)}
            </Text>

            <Text style={styles.orderTotal}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* Order Type Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {orderTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterButton,
                activeOrderType === type.id && styles.activeFilterButton,
              ]}
              onPress={() => setActiveOrderType(type.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeOrderType === type.id && styles.activeFilterButtonText,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Order Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {orderStatuses.map((status) => (
            <TouchableOpacity
              key={status.id}
              style={[
                styles.filterButton,
                activeOrderStatus === status.id && styles.activeFilterButton,
              ]}
              onPress={() => setActiveOrderStatus(status.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeOrderStatus === status.id && styles.activeFilterButtonText,
                ]}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Ionicons name="document-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptyText}>
            {activeOrderType !== 'all' || activeOrderStatus !== 'all'
              ? 'You don\'t have any orders matching the selected filters.'
              : 'You haven\'t placed or received any orders yet. Start by browsing products in the marketplace.'}
          </Text>

          {activeOrderType === 'all' && activeOrderStatus === 'all' && (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Marketplace' as never, { screen: 'MarketplaceMain' } as never)}
            >
              <Text style={styles.browseButtonText}>Browse Marketplace</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: spacing.sm,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.md,
  },
  filterButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  activeFilterButton: {
    backgroundColor: colors.primaryLight,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeFilterButtonText: {
    color: colors.primary,
  },
  ordersList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  orderCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    backgroundColor: colors.surfaceLight,
  },
  orderType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  orderTypeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  orderStatusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  orderContent: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  orderItems: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  orderParty: {
    marginBottom: spacing.sm,
  },
  orderPartyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  orderPartyLabel: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderIdLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  orderId: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  orderDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  orderTotal: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  browseButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
  },
});

export default OrdersScreen;
