import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, shadows } from '../../theme';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import { Order, OrderStatus } from '../../models/Product';
import MarketplaceService from '../../services/MarketplaceService';

const PrelistedOrdersScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      const prelistedOrders = await MarketplaceService.getPrelistedOrdersBySeller(userProfile.uid);
      setOrders(prelistedOrders);
    } catch (error) {
      console.error('Error loading prelisted orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, [userProfile]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.info;
      case 'shipped':
        return colors.primary;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const handleUpdateStatus = (orderId: string, currentStatus: OrderStatus) => {
    const statusOptions: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    // Filter out the current status and any previous statuses
    const currentIndex = statusOptions.indexOf(currentStatus);
    const availableStatuses = statusOptions.filter((_, index) => index > currentIndex || index === statusOptions.length - 1);

    // Create alert buttons for each available status
    const buttons = availableStatuses.map(status => ({
      text: getStatusText(status),
      onPress: async () => {
        try {
          await MarketplaceService.updateOrderStatus(orderId, status);
          // Update the order in the state
          setOrders(orders.map(order =>
            order.id === orderId ? { ...order, status } : order
          ));
          Alert.alert('Success', `Order status updated to ${getStatusText(status)}`);
        } catch (error) {
          console.error('Error updating order status:', error);
          Alert.alert('Error', 'Failed to update order status');
        }
      },
    }));

    // Add cancel button
    buttons.unshift({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Update Order Status',
      'Select the new status for this order:',
      buttons as any
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const orderDate = new Date(item.createdAt);
    const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderId}>{item.id.substring(0, 8)}...</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>Ordered on: {formattedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>Items: {item.items.length}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>Total: ₹{item.totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>Buyer: {item.userName || 'Anonymous'}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.updateButton]}
            onPress={() => handleUpdateStatus(item.id, item.status)}
          >
            <Ionicons name="refresh" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          >
            <Ionicons name="eye" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prelisted Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prelisted orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Prelisted Orders"
          message="You don't have any orders for your prelisted products yet. When customers place orders, they will appear here."
          actionText="View Your Products"
          onAction={() => navigation.navigate('PrelistedMarketplace')}
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  ordersList: {
    padding: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  orderId: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  orderInfo: {
    padding: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  updateButton: {
    backgroundColor: colors.primary,
  },
  viewButton: {
    backgroundColor: colors.info,
  },
});

export default PrelistedOrdersScreen;
