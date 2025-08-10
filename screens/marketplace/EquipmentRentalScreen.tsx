import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { Product } from '../../models/Product';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Equipment subcategories
const equipmentSubcategories = [
  { id: 'all', name: 'All Types' },
  { id: 'tractor', name: 'Tractors' },
  { id: 'harvester', name: 'Harvesters' },
  { id: 'irrigation', name: 'Irrigation' },
  { id: 'tools', name: 'Tools' },
  { id: 'other', name: 'Other' },
];

const EquipmentRentalScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [equipment, setEquipment] = useState<Product[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Product[]>([]);

  // Rental modal state
  const [rentalModalVisible, setRentalModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Product | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [totalRentalCost, setTotalRentalCost] = useState(0);

  // Load equipment on component mount
  useEffect(() => {
    loadEquipment();
  }, []);

  // Filter equipment when search query or active subcategory changes
  useEffect(() => {
    filterEquipment();
  }, [searchQuery, activeSubcategory, equipment]);

  // Load equipment from service
  const loadEquipment = async () => {
    try {
      setLoading(true);

      // Fetch equipment from Firebase
      try {
        const productsFromFirebase = await MarketplaceService.getProductsByCategory('equipment');
        console.log('Loaded equipment from Firebase:', productsFromFirebase.length);
        setEquipment(productsFromFirebase);
      } catch (firebaseError) {
        console.error('Error fetching from Firebase:', firebaseError);
        // Set empty array if there's an error
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      setEquipment([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter equipment based on search query and active subcategory
  const filterEquipment = () => {
    let filtered = [...equipment];

    // Filter by subcategory
    if (activeSubcategory !== 'all') {
      filtered = filtered.filter(item => item.subcategory === activeSubcategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredEquipment(filtered);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadEquipment();
  };

  // Handle opening the rental modal
  const handleOpenRentalModal = (item: Product) => {
    setSelectedEquipment(item);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 86400000)); // Tomorrow
    setRentalDays(1);
    setTotalRentalCost(item.discountedPrice || item.price);
    setRentalModalVisible(true);
  };

  // Handle date changes
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);

      // Calculate new end date and rental days
      const newEndDate = new Date(selectedDate);
      newEndDate.setDate(newEndDate.getDate() + rentalDays);
      setEndDate(newEndDate);

      // Update total cost
      if (selectedEquipment) {
        setTotalRentalCost(rentalDays * (selectedEquipment.discountedPrice || selectedEquipment.price));
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);

      // Calculate rental days
      const diffTime = Math.abs(selectedDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRentalDays(diffDays);

      // Update total cost
      if (selectedEquipment) {
        setTotalRentalCost(diffDays * (selectedEquipment.discountedPrice || selectedEquipment.price));
      }
    }
  };

  // Handle rental submission
  const handleRentEquipment = () => {
    if (!selectedEquipment) return;

    // In a real app, we would create an order in the database
    Alert.alert(
      'Confirm Rental',
      `You are about to rent ${selectedEquipment.name} for ${rentalDays} days from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} for ₹${totalRentalCost}. Proceed?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Create order
            const orderData = {
              userId: userProfile?.uid,
              sellerId: selectedEquipment.sellerId,
              items: [
                {
                  productId: selectedEquipment.id,
                  productName: selectedEquipment.name,
                  productImage: selectedEquipment.images[0]?.url,
                  quantity: 1,
                  price: selectedEquipment.discountedPrice || selectedEquipment.price,
                  totalPrice: totalRentalCost,
                  isRental: true,
                  rentalStartDate: startDate.getTime(),
                  rentalEndDate: endDate.getTime(),
                }
              ],
              totalAmount: totalRentalCost,
              status: 'pending',
              paymentStatus: 'pending',
              paymentMethod: 'cash_on_delivery',
              shippingAddress: {
                name: userProfile?.displayName || '',
                phone: userProfile?.phoneNumber || '',
                address: userProfile?.address || '',
                city: userProfile?.city || '',
                state: userProfile?.state || '',
                pincode: userProfile?.pincode || '',
              },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            // In a real app, we would save this order to Firebase
            console.log('Creating rental order:', orderData);

            // For now, just show a success message
            Alert.alert(
              'Rental Confirmed',
              `Your rental for ${selectedEquipment.name} has been confirmed. You will be contacted shortly for delivery details.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setRentalModalVisible(false);
                    navigation.navigate('My Farm' as never, { screen: 'Orders' } as never);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Render an equipment card
  const renderEquipmentCard = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetails' as never, { productId: item.id } as never)}
      >
        <Image
          source={{ uri: item.images[0]?.url }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {item.discountedPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((item.price - item.discountedPrice) / item.price) * 100)}% OFF
            </Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>
              ₹{item.discountedPrice || item.price}/day
              {item.discountedPrice && (
                <Text style={styles.productOriginalPrice}> ₹{item.price}</Text>
              )}
            </Text>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={colors.secondary} />
              <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.productFooter}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.sellerName}
            </Text>

            <Text style={styles.productLocation} numberOfLines={1}>
              {item.location.address}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Rent button */}
      <TouchableOpacity
        style={styles.rentButton}
        onPress={() => handleOpenRentalModal(item)}
      >
        <Text style={styles.rentButtonText}>Rent Now</Text>
      </TouchableOpacity>
    </View>
  );

  // Render subcategory tab
  const renderSubcategoryTab = (subcategory: { id: string; name: string }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryTab,
        activeSubcategory === subcategory.id && styles.activeSubcategoryTab,
      ]}
      onPress={() => setActiveSubcategory(subcategory.id)}
    >
      <Text
        style={[
          styles.subcategoryTabText,
          activeSubcategory === subcategory.id && styles.activeSubcategoryTabText,
        ]}
      >
        {subcategory.name}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading equipment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Navigate back to MarketplaceMain screen
              navigation.navigate('MarketplaceMain');
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Equipment Rental</Text>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart' as never)}
          >
            <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.mediumGray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.subcategoriesContainer}>
        <FlatList
          horizontal
          data={equipmentSubcategories}
          renderItem={({ item }) => renderSubcategoryTab(item)}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoriesContent}
        />
      </View>

      <FlatList
        data={filteredEquipment}
        renderItem={renderEquipmentCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productsContainer}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Equipment Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'No equipment available in this category'}
            </Text>
          </View>
        }
      />

      {/* Rental Modal */}
      <Modal
        visible={rentalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRentalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rent Equipment</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setRentalModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedEquipment && (
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.modalEquipmentInfo}>
                  <Image
                    source={{ uri: selectedEquipment.images[0]?.url }}
                    style={styles.modalEquipmentImage}
                    resizeMode="cover"
                  />

                  <View style={styles.modalEquipmentDetails}>
                    <Text style={styles.modalEquipmentName}>{selectedEquipment.name}</Text>
                    <Text style={styles.modalEquipmentPrice}>
                      ₹{selectedEquipment.discountedPrice || selectedEquipment.price}/day
                    </Text>
                  </View>
                </View>

                <View style={styles.dateSelectionContainer}>
                  <Text style={styles.dateSelectionTitle}>Select Rental Period</Text>

                  {/* Start Date */}
                  <View style={styles.datePickerRow}>
                    <Text style={styles.datePickerLabel}>Start Date:</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {startDate.toLocaleDateString()}
                      </Text>
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* End Date */}
                  <View style={styles.datePickerRow}>
                    <Text style={styles.datePickerLabel}>End Date:</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {endDate.toLocaleDateString()}
                      </Text>
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Date Pickers */}
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={onStartDateChange}
                      minimumDate={new Date()}
                    />
                  )}

                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={onEndDateChange}
                      minimumDate={new Date(startDate.getTime() + 86400000)} // Start date + 1 day
                    />
                  )}

                  {/* Rental Summary */}
                  <View style={styles.rentalSummary}>
                    <View style={styles.rentalSummaryRow}>
                      <Text style={styles.rentalSummaryLabel}>Rental Days:</Text>
                      <Text style={styles.rentalSummaryValue}>{rentalDays} days</Text>
                    </View>

                    <View style={styles.rentalSummaryRow}>
                      <Text style={styles.rentalSummaryLabel}>Daily Rate:</Text>
                      <Text style={styles.rentalSummaryValue}>
                        ₹{selectedEquipment.discountedPrice || selectedEquipment.price}
                      </Text>
                    </View>

                    <View style={styles.rentalSummaryRow}>
                      <Text style={styles.rentalSummaryLabel}>Total Cost:</Text>
                      <Text style={styles.rentalSummaryTotal}>₹{totalRentalCost}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmRentalButton}
                  onPress={handleRentEquipment}
                >
                  <Text style={styles.confirmRentalButtonText}>Confirm Rental</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  subcategoriesContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  subcategoriesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  subcategoryTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  activeSubcategoryTab: {
    backgroundColor: colors.primaryLight,
  },
  subcategoryTabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeSubcategoryTabText: {
    color: colors.primary,
  },
  productsContainer: {
    padding: spacing.md,
  },
  productCard: {
    flex: 1,
    margin: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.sm,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  productDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    height: 32, // Fixed height for 2 lines
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  productOriginalPrice: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.xs,
  },
  productLocation: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  rentButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  rentButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
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
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalScrollView: {
    padding: spacing.md,
  },
  modalEquipmentInfo: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  modalEquipmentImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  modalEquipmentDetails: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  modalEquipmentName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalEquipmentPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  dateSelectionContainer: {
    marginBottom: spacing.md,
  },
  dateSelectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  datePickerLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  datePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  rentalSummary: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  rentalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rentalSummaryLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  rentalSummaryValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  rentalSummaryTotal: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  confirmRentalButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  confirmRentalButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
});

export default EquipmentRentalScreen;
