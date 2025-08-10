import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { useAuth } from '../../context/AuthContext';
import { database, auth } from '../../firebase/config';
import WalletService from '../../services/WalletService';
import { Order, OrderStatus } from '../../models/Product';

// Define delivery status types
type DeliveryStatus = 'pending_pickup' | 'in_transit' | 'delivered' | 'cancelled' | 'all';

// Define tab types
type TabType = 'available' | 'my_deliveries';

// Define delivery item interface
interface DeliveryItem {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  order: Order;
  pickupTime?: string;
  deliveryTime?: string;
  assignedAt: number;
  updatedAt: number;
  deliveryPartnerId?: string;
}

// Define delivery partner stats interface
interface DeliveryPartnerStats {
  name: string;
  id: string;
  phone: string;
  vehicle: string;
  rating: number;
  totalDeliveries: number;
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

const DeliveryManagementScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DeliveryPartnerStats | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Load wallet balance
  useEffect(() => {
    if (!user) return;

    const loadWalletBalance = async () => {
      try {
        setLoadingWallet(true);
        const balance = await WalletService.getBalance(user.uid);
        const availableBalance = await WalletService.getAvailableBalance(user.uid);
        const heldBalance = await WalletService.getHeldBalance(user.uid);
        setWalletBalance(balance);
      } catch (error) {
        console.error('Error loading wallet balance:', error);
      } finally {
        setLoadingWallet(false);
      }
    };

    loadWalletBalance();
  }, [user]);

  // Load delivery partner stats
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        // Get delivery partner profile
        const statsRef = database().ref(`delivery_partners/${user.uid}`);
        const snapshot = await statsRef.once('value');

        if (snapshot.exists()) {
          setStats(snapshot.val());
        } else {
          // Create initial stats if they don't exist
          const initialStats: DeliveryPartnerStats = {
            name: userProfile?.displayName || 'Delivery Partner',
            id: user.uid,
            phone: userProfile?.phoneNumber || '',
            vehicle: 'Motorcycle',
            rating: 0,
            totalDeliveries: 0,
            earnings: {
              today: 0,
              thisWeek: 0,
              thisMonth: 0
            }
          };

          await statsRef.set(initialStats);
          setStats(initialStats);
        }
      } catch (error) {
        console.error('Error loading delivery partner stats:', error);
      }
    };

    loadStats();
  }, [user, userProfile]);

  // Load deliveries
  const loadDeliveries = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const newDeliveries: DeliveryItem[] = [];

      // 1. Get all available orders (confirmed or processing) that don't have a delivery yet
      const ordersRef = database().ref('orders');
      const availableOrdersSnapshot = await ordersRef
        .orderByChild('status')
        .startAt('confirmed')
        .endAt('processing')
        .once('value');

      if (availableOrdersSnapshot.exists()) {
        const availableOrders: Order[] = [];
        availableOrdersSnapshot.forEach((orderSnapshot) => {
          const order = orderSnapshot.val() as Order;
          availableOrders.push(order);
          return false;
        });

        // 2. Get all existing deliveries
        const allDeliveriesRef = database().ref('deliveries');
        const allDeliveriesSnapshot = await allDeliveriesRef.once('value');
        const existingOrderIds = new Set<string>();

        if (allDeliveriesSnapshot.exists()) {
          allDeliveriesSnapshot.forEach((deliverySnapshot) => {
            const delivery = deliverySnapshot.val() as DeliveryItem;
            existingOrderIds.add(delivery.orderId);
            return false;
          });
        }

        // 3. Create delivery items for orders that don't have deliveries yet
        for (const order of availableOrders) {
          if (!existingOrderIds.has(order.id)) {
            // Create a new delivery entry
            const newDeliveryRef = database().ref('deliveries').push();
            const deliveryId = newDeliveryRef.key;

            if (deliveryId) {
              const now = Date.now();
              const newDelivery: DeliveryItem = {
                id: deliveryId,
                orderId: order.id,
                status: 'pending_pickup',
                order,
                assignedAt: now,
                updatedAt: now
              };

              // Save to database
              await newDeliveryRef.set(newDelivery);

              // Add to local state
              newDeliveries.push(newDelivery);
            }
          }
        }
      }

      // 4. Get all unassigned deliveries (available for pickup)
      const unassignedDeliveriesRef = database().ref('deliveries');
      const unassignedDeliveriesSnapshot = await unassignedDeliveriesRef
        .orderByChild('status')
        .equalTo('pending_pickup')
        .once('value');

      if (unassignedDeliveriesSnapshot.exists()) {
        unassignedDeliveriesSnapshot.forEach((childSnapshot) => {
          const delivery = childSnapshot.val() as DeliveryItem;
          // Only add unassigned deliveries that aren't already in our list
          if (!delivery.deliveryPartnerId && !newDeliveries.some(d => d.id === delivery.id)) {
            newDeliveries.push(delivery);
          }
          return false;
        });
      }

      // 5. Get all deliveries assigned to this delivery partner
      const assignedDeliveriesRef = database().ref('deliveries');
      const assignedDeliveriesSnapshot = await assignedDeliveriesRef
        .orderByChild('deliveryPartnerId')
        .equalTo(user.uid)
        .once('value');

      if (assignedDeliveriesSnapshot.exists()) {
        assignedDeliveriesSnapshot.forEach((childSnapshot) => {
          const delivery = childSnapshot.val() as DeliveryItem;
          // Only add if not already in the list
          if (!newDeliveries.some(d => d.id === delivery.id)) {
            newDeliveries.push(delivery);
          }
          return false;
        });
      }

      setDeliveries(newDeliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load deliveries on mount
  useEffect(() => {
    loadDeliveries();
  }, [user]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  // Handle selecting a delivery for assignment
  const handleSelectOrder = async (delivery: DeliveryItem) => {
    if (!user) return;

    try {
      // Confirm with the delivery partner
      Alert.alert(
        'Take Order',
        `Are you sure you want to take this delivery order?\n\nPickup from: ${delivery.order?.sellerAddress?.city || 'Seller location'}\nDeliver to: ${delivery.order?.shippingAddress?.address || 'Customer address'}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Take Order',
            onPress: async () => {
              try {
                // Update delivery with delivery partner ID
                const deliveryRef = database().ref(`deliveries/${delivery.id}`);
                await deliveryRef.update({
                  deliveryPartnerId: user.uid,
                  updatedAt: Date.now(),
                });

                // Update local state
                setDeliveries(deliveries.map(d =>
                  d.id === delivery.id
                    ? { ...d, deliveryPartnerId: user.uid, updatedAt: Date.now() }
                    : d
                ));

                Alert.alert('Success', 'Order assigned to you successfully');
              } catch (error) {
                console.error('Error assigning order:', error);
                Alert.alert('Error', 'Failed to assign order');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error selecting order:', error);
      Alert.alert('Error', 'Failed to select order');
    }
  };

  // Get deliveries based on active tab
  const displayedDeliveries = activeTab === 'available'
    ? deliveries.filter(delivery => !delivery.deliveryPartnerId)
    : deliveries.filter(delivery => delivery.deliveryPartnerId === user?.uid);

  // Handle delivery status update
  const handleUpdateStatus = async (delivery: DeliveryItem, newStatus: DeliveryStatus) => {
    Alert.alert(
      'Update Delivery Status',
      `Are you sure you want to mark this delivery as ${newStatus}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async () => {
            try {
              // Update delivery status in database
              const deliveryRef = database().ref(`deliveries/${delivery.id}`);
              await deliveryRef.update({
                status: newStatus,
                updatedAt: Date.now(),
                ...(newStatus === 'in_transit' ? { pickupTime: new Date().toISOString() } : {}),
                ...(newStatus === 'delivered' ? { deliveryTime: new Date().toISOString() } : {}),
              });

              // Get the order details
              const orderRef = database().ref(`orders/${delivery.orderId}`);
              const orderSnapshot = await orderRef.once('value');
              const orderData = orderSnapshot.val();
              let orderStatus: OrderStatus = 'pending';

              switch (newStatus) {
                case 'in_transit':
                  orderStatus = 'out_for_delivery';
                  break;
                case 'delivered':
                  orderStatus = 'delivered';
                  break;
                case 'cancelled':
                  orderStatus = 'cancelled';
                  break;
                default:
                  break;
              }

              // Update order status
              await orderRef.update({
                status: orderStatus,
                updatedAt: Date.now(),
              });

              // Update local state
              setDeliveries(deliveries.map(d =>
                d.id === delivery.id
                  ? { ...d, status: newStatus, updatedAt: Date.now() }
                  : d
              ));

              // Handle payment transfer if delivered or cancelled
              if (newStatus === 'delivered' && orderData) {
                // Check if this order has a held payment that needs to be transferred
                if (orderData.holdTransactionId) {
                  try {
                    // Transfer the held funds from buyer to seller
                    await WalletService.transferHeldBalance(
                      orderData.userId, // buyer
                      orderData.sellerId, // seller
                      orderData.totalAmount, // amount
                      `Payment for order #${orderData.id} - Delivery completed`, // description
                      orderData.id, // orderId
                      orderData.holdTransactionId // holdTransactionId
                    );

                    // Mark the order as payment processed
                    await orderRef.update({
                      paymentProcessed: true,
                      paymentProcessedAt: Date.now()
                    });

                    console.log(`Successfully transferred held funds for order ${orderData.id}`);

                    // Send notification to seller and buyer
                    Alert.alert('Payment Processed', 'Payment has been transferred to the seller');
                  } catch (transferError) {
                    console.error('Error transferring held funds:', transferError);
                    Alert.alert(
                      'Payment Error',
                      'There was an error processing the payment. Please contact support.'
                    );
                  }
                }
              } else if (newStatus === 'cancelled' && orderData) {
                // Check if this order has a held payment that needs to be released
                if (orderData.holdTransactionId) {
                  try {
                    // Release the held funds back to the buyer
                    await WalletService.releaseHeldBalance(
                      orderData.userId, // buyer
                      orderData.totalAmount, // amount
                      `Refund for cancelled order #${orderData.id} - Delivery cancelled`, // description
                      orderData.id, // orderId
                      orderData.holdTransactionId // holdTransactionId
                    );

                    console.log(`Successfully released held funds for order ${orderData.id}`);

                    // Send notification to buyer
                    Alert.alert('Refund Processed', 'Payment has been refunded to the buyer');
                  } catch (releaseError) {
                    console.error('Error releasing held funds:', releaseError);
                    Alert.alert(
                      'Refund Error',
                      'There was an error processing the refund. Please contact support.'
                    );
                  }
                }
              }

              // Add delivery fee to delivery partner's wallet if delivery is completed
              if (newStatus === 'delivered' && user) {
                await WalletService.addBalance(
                  user.uid,
                  50,
                  `Delivery fee for order #${delivery.id}`
                );

                // Refresh wallet balance
                const newBalance = await WalletService.getBalance(user.uid);
                setWalletBalance(newBalance);

                // Update delivery partner stats
                if (stats) {
                  const statsRef = database().ref(`delivery_partners/${user?.uid}`);
                  const updatedStats = {
                    ...stats,
                    totalDeliveries: stats.totalDeliveries + 1,
                    earnings: {
                      ...stats.earnings,
                      today: stats.earnings.today + 50, // Add delivery fee
                      thisWeek: stats.earnings.thisWeek + 50,
                      thisMonth: stats.earnings.thisMonth + 50,
                    }
                  };

                  await statsRef.update(updatedStats);
                  setStats(updatedStats);
                }
              }

              Alert.alert('Success', `Delivery #${delivery.id} marked as ${newStatus}`);
            } catch (error) {
              console.error('Error updating delivery status:', error);
              Alert.alert('Error', 'Failed to update delivery status');
            }
          },
        },
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Sign out from Firebase
              await auth().signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  // Render delivery item
  const renderDeliveryItem = ({ item }: { item: any }) => {
    const isSelected = selectedDelivery?.id === item.id;

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending':
          return colors.warning;
        case 'in_transit':
          return colors.accent;
        case 'delivered':
          return colors.success;
        case 'cancelled':
          return colors.error;
        default:
          return colors.gray;
      }
    };

    // Get status text
    const getStatusText = (status: string) => {
      switch (status) {
        case 'pending':
          return 'Pending Pickup';
        case 'in_transit':
          return 'In Transit';
        case 'delivered':
          return 'Delivered';
        case 'cancelled':
          return 'Cancelled';
        default:
          return status;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.deliveryCard,
          isSelected && styles.selectedDeliveryCard,
        ]}
        onPress={() => setSelectedDelivery(isSelected ? null : item)}
        activeOpacity={0.7}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryId}>
            <Text style={styles.deliveryIdText}>Delivery #{item.id.substring(0, 6)}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <Text style={styles.deliveryDate}>
            {new Date(item.updatedAt).toLocaleDateString()} • {new Date(item.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>

        <View style={styles.deliveryDetails}>
          <View style={styles.deliveryDetail}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.deliveryDetailLabel}>Pickup:</Text>
            <Text style={styles.deliveryDetailText}>
              {item.order?.sellerAddress?.city || 'Seller location'}
            </Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="navigate" size={16} color={colors.accent} />
            <Text style={styles.deliveryDetailLabel}>Deliver to:</Text>
            <Text style={styles.deliveryDetailText}>
              {item.order?.shippingAddress?.address}, {item.order?.shippingAddress?.city}
            </Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Customer:</Text>
            <Text style={styles.deliveryDetailText}>
              {item.order?.shippingAddress?.name || 'Customer'}
            </Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="call" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Phone:</Text>
            <Text style={styles.deliveryDetailText}>
              {item.order?.shippingAddress?.phone || 'N/A'}
            </Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="basket" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Product:</Text>
            <Text style={styles.deliveryDetailText}>
              {item.order?.items?.map(i => i.productName).join(', ') || 'Products'}
              ({item.order?.items?.reduce((total, i) => total + i.quantity, 0) || 0} items)
            </Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="cash" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Payment:</Text>
            <Text style={styles.deliveryDetailText}>
              {item.order?.paymentMethod === 'wallet' ? 'Ankrishi-Wallet' : 'Cash on Delivery'} - ₹{item.order?.totalAmount?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {!item.deliveryPartnerId && activeTab === 'available' && (
          <View style={styles.deliveryActions}>
            <Button
              title="Take Order"
              onPress={() => handleSelectOrder(item)}
              size="medium"
              style={styles.takeOrderButton}
              leftIcon={<Ionicons name="bicycle" size={20} color={colors.white} />}
            />
          </View>
        )}

        {/* Actions for assigned deliveries */}
        {isSelected && item.deliveryPartnerId === user?.uid && (
          <View style={styles.deliveryActions}>
            {item.status === 'pending_pickup' && (
              <Button
                title="Pick Up"
                onPress={() => handleUpdateStatus(item, 'in_transit')}
                size="small"
                style={styles.actionButton}
              />
            )}

            {item.status === 'in_transit' && (
              <Button
                title="Mark as Delivered"
                onPress={() => handleUpdateStatus(item, 'delivered')}
                size="small"
                style={styles.actionButton}
              />
            )}

            {(item.status === 'pending_pickup' || item.status === 'in_transit') && (
              <Button
                title="Cancel Delivery"
                onPress={() => handleUpdateStatus(item, 'cancelled')}
                size="small"
                variant="outline"
                style={styles.actionButton}
              />
            )}

            <Button
              title="Navigate"
              onPress={() => Alert.alert('Navigation', 'Opening maps for navigation...')}
              size="small"
              variant="outline"
              style={styles.actionButton}
              leftIcon={<Ionicons name="navigate-outline" size={16} color={colors.primary} />}
            />

            <Button
              title="Call Customer"
              onPress={() => Alert.alert('Call', `Calling ${item.order?.shippingAddress?.phone || 'Customer'}...`)}
              size="small"
              variant="outline"
              style={styles.actionButton}
              leftIcon={<Ionicons name="call-outline" size={16} color={colors.primary} />}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.displayName || 'Delivery Partner'}</Text>
            <Text style={styles.profileId}>ID: {user?.uid || 'Unknown'}</Text>
          </View>
          <TouchableOpacity
            style={styles.walletContainer}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            {loadingWallet ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.walletBalance}>₹{walletBalance?.toFixed(2) || '0.00'}</Text>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>



      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={activeTab === 'available' ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Available Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my_deliveries' && styles.activeTab]}
            onPress={() => setActiveTab('my_deliveries')}
          >
            <Ionicons
              name="bicycle"
              size={20}
              color={activeTab === 'my_deliveries' ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'my_deliveries' && styles.activeTabText]}>
              My Deliveries
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={displayedDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.deliveriesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'available' ? 'No Available Orders' : 'No Deliveries'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'available'
                ? 'There are no available orders to take at the moment. Pull down to refresh.'
                : 'You have no assigned deliveries yet. Take an order from the Available Orders tab.'}
            </Text>
          </View>
        }
      />


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.xl, spacing.xl * 1.5),
    paddingBottom: spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  walletBalance: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  profileName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  profileId: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  logoutButton: {
    padding: spacing.xs,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.lightGray,
    alignSelf: 'center',
  },
  tabsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
  deliveriesList: {
    paddingBottom: spacing.xl * 2,
  },
  deliveryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  selectedDeliveryCard: {
    backgroundColor: colors.surfaceLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  deliveryHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deliveryId: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deliveryIdText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  deliveryDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  deliveryDetails: {
    marginBottom: spacing.sm,
  },
  deliveryDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  deliveryDetailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    width: 80,
  },
  deliveryDetailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  deliveryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  actionButton: {
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    minWidth: 140,
  },
  takeOrderButton: {
    backgroundColor: colors.success,
    marginVertical: spacing.md,
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

});

export default DeliveryManagementScreen;
