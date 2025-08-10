import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

// Mock delivery data
const MOCK_DELIVERIES = [
  {
    id: '1',
    status: 'pending',
    pickupLocation: 'Farmer Market, Pune',
    deliveryLocation: '123 Main St, Mumbai',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    productName: 'Organic Tomatoes',
    quantity: '10 kg',
    paymentMethod: 'Cash on Delivery',
    amount: '₹950',
    date: '2023-06-15',
    time: '14:00-16:00',
  },
  {
    id: '2',
    status: 'in_transit',
    pickupLocation: 'Green Farms, Nashik',
    deliveryLocation: '456 Park Avenue, Thane',
    customerName: 'Priya Patel',
    customerPhone: '+91 87654 32109',
    productName: 'Fresh Apples',
    quantity: '5 kg',
    paymentMethod: 'Prepaid',
    amount: '₹750',
    date: '2023-06-15',
    time: '16:00-18:00',
  },
  {
    id: '3',
    status: 'delivered',
    pickupLocation: 'Organic Valley, Nagpur',
    deliveryLocation: '789 Lake View, Pune',
    customerName: 'Amit Kumar',
    customerPhone: '+91 76543 21098',
    productName: 'Organic Rice',
    quantity: '25 kg',
    paymentMethod: 'Cash on Delivery',
    amount: '₹1,250',
    date: '2023-06-14',
    time: '10:00-12:00',
  },
  {
    id: '4',
    status: 'pending',
    pickupLocation: 'Fresh Harvest, Kolhapur',
    deliveryLocation: '234 River Road, Mumbai',
    customerName: 'Sneha Desai',
    customerPhone: '+91 65432 10987',
    productName: 'Fresh Vegetables Assortment',
    quantity: '8 kg',
    paymentMethod: 'Cash on Delivery',
    amount: '₹850',
    date: '2023-06-16',
    time: '09:00-11:00',
  },
  {
    id: '5',
    status: 'cancelled',
    pickupLocation: 'Sunshine Farms, Aurangabad',
    deliveryLocation: '567 Hill View, Nashik',
    customerName: 'Vikram Singh',
    customerPhone: '+91 54321 09876',
    productName: 'Premium Mangoes',
    quantity: '3 kg',
    paymentMethod: 'Prepaid',
    amount: '₹650',
    date: '2023-06-14',
    time: '13:00-15:00',
  },
];

// Delivery partner profile
const DELIVERY_PARTNER = {
  name: 'Rajesh Kumar',
  id: 'DP12345',
  phone: '+91 98765 12345',
  vehicle: 'Motorcycle',
  rating: 4.8,
  totalDeliveries: 156,
  earnings: {
    today: '₹850',
    thisWeek: '₹4,250',
    thisMonth: '₹18,500',
  },
};

const DeliveryManagementScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'pending' | 'in_transit' | 'delivered' | 'all'>('pending');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Filter deliveries based on active tab
  const filteredDeliveries = activeTab === 'all'
    ? MOCK_DELIVERIES
    : MOCK_DELIVERIES.filter(delivery => delivery.status === activeTab);

  // Handle delivery status update
  const handleUpdateStatus = (delivery: any, newStatus: string) => {
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
          onPress: () => {
            // In a real app, this would update the database
            Alert.alert('Success', `Delivery #${delivery.id} marked as ${newStatus}`);
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
          onPress: () => {
            // Navigate back to login screen
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              })
            );
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
      <Card
        style={[
          styles.deliveryCard,
          isSelected && styles.selectedDeliveryCard,
        ]}
        onPress={() => setSelectedDelivery(isSelected ? null : item)}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryId}>
            <Text style={styles.deliveryIdText}>Delivery #{item.id}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.deliveryDate}>{item.date} • {item.time}</Text>
        </View>

        <View style={styles.deliveryDetails}>
          <View style={styles.deliveryDetail}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.deliveryDetailLabel}>Pickup:</Text>
            <Text style={styles.deliveryDetailText}>{item.pickupLocation}</Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="navigate" size={16} color={colors.accent} />
            <Text style={styles.deliveryDetailLabel}>Deliver to:</Text>
            <Text style={styles.deliveryDetailText}>{item.deliveryLocation}</Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Customer:</Text>
            <Text style={styles.deliveryDetailText}>{item.customerName}</Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="call" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Phone:</Text>
            <Text style={styles.deliveryDetailText}>{item.customerPhone}</Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="basket" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Product:</Text>
            <Text style={styles.deliveryDetailText}>{item.productName} ({item.quantity})</Text>
          </View>

          <View style={styles.deliveryDetail}>
            <Ionicons name="cash" size={16} color={colors.textSecondary} />
            <Text style={styles.deliveryDetailLabel}>Payment:</Text>
            <Text style={styles.deliveryDetailText}>{item.paymentMethod} - {item.amount}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.deliveryActions}>
            {item.status === 'pending' && (
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

            {(item.status === 'pending' || item.status === 'in_transit') && (
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
              icon={<Ionicons name="navigate-outline" size={16} color={colors.primary} />}
            />

            <Button
              title="Call Customer"
              onPress={() => Alert.alert('Call', `Calling ${item.customerPhone}...`)}
              size="small"
              variant="outline"
              style={styles.actionButton}
              icon={<Ionicons name="call-outline" size={16} color={colors.primary} />}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{DELIVERY_PARTNER.name}</Text>
            <Text style={styles.profileId}>ID: {DELIVERY_PARTNER.id}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{DELIVERY_PARTNER.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{DELIVERY_PARTNER.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{DELIVERY_PARTNER.earnings.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'in_transit' && styles.activeTab]}
            onPress={() => setActiveTab('in_transit')}
          >
            <Text style={[styles.tabText, activeTab === 'in_transit' && styles.activeTabText]}>
              In Transit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'delivered' && styles.activeTab]}
            onPress={() => setActiveTab('delivered')}
          >
            <Text style={[styles.tabText, activeTab === 'delivered' && styles.activeTabText]}>
              Delivered
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.deliveriesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Deliveries</Text>
            <Text style={styles.emptyText}>
              There are no deliveries in this category at the moment.
            </Text>
          </View>
        }
      />

      {/* Earnings Section */}
      <Card style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>Earnings</Text>
        <View style={styles.earningsDetails}>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Today</Text>
            <Text style={styles.earningValue}>{DELIVERY_PARTNER.earnings.today}</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>This Week</Text>
            <Text style={styles.earningValue}>{DELIVERY_PARTNER.earnings.thisWeek}</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>This Month</Text>
            <Text style={styles.earningValue}>{DELIVERY_PARTNER.earnings.thisMonth}</Text>
          </View>
        </View>
      </Card>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.xl, spacing.xl * 2),
    paddingBottom: spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileInfo: {
    marginLeft: spacing.sm,
  },
  profileName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.white,
  },
  profileId: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.8,
  },
  logoutButton: {
    padding: spacing.xs,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    marginTop: -spacing.lg,
    zIndex: 1,
  },
  statsCard: {
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
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGray,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  deliveryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  selectedDeliveryCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  deliveryId: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: borderRadius.sm,
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
  },
  deliveryDetails: {
    marginBottom: spacing.sm,
  },
  deliveryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deliveryDetailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    width: 70,
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
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
  earningsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: spacing.md,
    padding: spacing.md,
  },
  earningsTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  earningsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningItem: {
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  earningValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.success,
    marginTop: spacing.xs / 2,
  },
});

export default DeliveryManagementScreen;
