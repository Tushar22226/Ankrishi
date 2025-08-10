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
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { Product } from '../../models/Product';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Marketplace categories
const marketplaceCategories = [
  {
    id: 'fertilizer',
    name: 'Fertilizers',
    icon: 'leaf',
    screen: 'Fertilizer',
    image: 'https://via.placeholder.com/100x100?text=Fertilizers',
  },
  {
    id: 'equipment',
    name: 'Equipment Rental',
    icon: 'construct',
    screen: 'EquipmentRental',
    image: 'https://via.placeholder.com/100x100?text=Equipment',
  },
  {
    id: 'produce',
    name: 'Fresh Produce',
    icon: 'nutrition',
    screen: 'Produce',
    image: 'https://via.placeholder.com/100x100?text=Produce',
  },
  {
    id: 'seeds',
    name: 'Seeds',
    icon: 'seed',
    screen: 'Seeds',
    image: 'https://via.placeholder.com/100x100?text=Seeds',
  },
  {
    id: 'organic',
    name: 'Organic Products',
    icon: 'leaf-outline',
    screen: 'Organic',
    image: 'https://via.placeholder.com/100x100?text=Organic',
  },
];



const MarketplaceScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [directFarmerProducts, setDirectFarmerProducts] = useState<Product[]>([]);
  const [organicProducts, setOrganicProducts] = useState<Product[]>([]);
  const [verifiedProducts, setVerifiedProducts] = useState<Product[]>([]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);

      // Get featured products
      const featured = await MarketplaceService.getFeaturedProducts();
      setFeaturedProducts(featured);

      // Get recent products
      const recent = await MarketplaceService.getRecentProducts();
      setRecentProducts(recent);

      // Get direct from farmer products
      const directProducts = await MarketplaceService.getZeroCommissionProducts();
      setDirectFarmerProducts(directProducts);

      // Get organic certified products
      // In a real implementation, this would call a specific method in MarketplaceService
      // For now, we'll filter from recent products as a simulation
      const organic = recent.filter(product =>
        product.certifications?.some(cert => cert.type === 'organic') ||
        product.farmDetails?.farmingMethod === 'organic'
      );
      setOrganicProducts(organic);

      // Get scientifically verified products
      // In a real implementation, this would call a specific method in MarketplaceService
      // For now, we'll filter from recent products as a simulation
      const verified = recent.filter(product =>
        product.scientificVerification?.isVerified
      );
      setVerifiedProducts(verified);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results
      navigation.navigate('SearchResults' as never, { query: searchQuery } as never);
    }
  };

  // Render a category card
  const renderCategoryCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => {
        // Always navigate to the screen through the MarketplaceMain screen
        // This ensures proper back navigation
        navigation.navigate(item.screen as never);
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.categoryImage}
        resizeMode="cover"
      />
      <View style={styles.categoryOverlay}>
        <Ionicons name={item.icon as any} size={24} color={colors.white} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render a product card
  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails' as never, { productId: item.id } as never)}
    >
      <Image
        source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/200x150?text=No+Image' }}
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

      {item.isDirectFromFarmer && (
        <View style={styles.directBadge}>
          <Text style={styles.directBadgeText}>Direct</Text>
        </View>
      )}

      {/* Scientific Verification Badge */}
      {item.scientificVerification?.isVerified && (
        <View style={[styles.verifiedBadge, { top: item.isDirectFromFarmer ? 30 : 8 }]}>
          <Ionicons name="checkmark-circle" size={12} color={colors.white} />
          <Text style={styles.verifiedBadgeText}>Verified</Text>
        </View>
      )}

      {/* Seller Verification Badge */}
      {item.sellerVerified && (
        <View style={[styles.sellerVerifiedBadge, {
          top: item.isDirectFromFarmer && item.scientificVerification?.isVerified ? 52 :
               item.isDirectFromFarmer || item.scientificVerification?.isVerified ? 30 : 8
        }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.white} />
          <Text style={styles.sellerVerifiedBadgeText}>VERIFIED SELLER</Text>
        </View>
      )}

      {/* Organic Certification Badge */}
      {item.certifications?.some(cert => cert.type === 'organic') && (
        <View style={[styles.organicBadge, {
          top: item.isDirectFromFarmer && item.scientificVerification?.isVerified ? 52 :
               item.isDirectFromFarmer || item.scientificVerification?.isVerified ? 30 : 8
        }]}>
          <Ionicons name="leaf" size={12} color={colors.white} />
          <Text style={styles.organicBadgeText}>Organic</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>
            {formatCurrency(item.discountedPrice || item.price)}
            {item.discountedPrice && (
              <Text style={styles.productOriginalPrice}> {formatCurrency(item.price)}</Text>
            )}
          </Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={colors.secondary} />
            <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.sellerName} numberOfLines={1}>
          {item.sellerName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Marketplace</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('UserProducts' as never)}
            >
              <Ionicons name="basket-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('My Farm' as never, { screen: 'Orders' } as never)}
            >
              <Ionicons name="document-text-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Cart' as never)}
            >
              <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading marketplace...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('UserProducts' as never)}
          >
            <Ionicons name="basket-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('My Farm' as never, { screen: 'Orders' } as never)}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Cart' as never)}
          >
            <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, equipment, etc."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.mediumGray} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => navigation.navigate('NearbyFarmers' as never)}
          >
            <Ionicons name="location" size={20} color={colors.success} />
          </TouchableOpacity>
        </View>

        {/* Direct from Farmers Banner */}
        <TouchableOpacity
          style={styles.farmerBanner}
          onPress={() => navigation.navigate('NearbyFarmers' as never)}
        >
          <View style={styles.farmerBannerContent}>
            <Ionicons name="leaf" size={24} color={colors.white} />
            <View style={styles.farmerBannerText}>
              <Text style={styles.farmerBannerTitle}>Buy Direct from Farmers</Text>
              <Text style={styles.farmerBannerSubtitle}>0% Commission • Support Local Farmers</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>

          <FlatList
            horizontal
            data={marketplaceCategories}
            renderItem={renderCategoryCard}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        {/* Direct from Farmer Products */}
        {directFarmerProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Direct from Farmers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('NearbyFarmers' as never)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={directFarmerProducts}
              renderItem={renderProductCard}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          </View>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={featuredProducts}
              renderItem={renderProductCard}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          </View>
        )}

        {/* Recent Products */}
        {recentProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={recentProducts}
              renderItem={renderProductCard}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          </View>
        )}

        {/* Organic Products */}
        {organicProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Organic Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Organic' as never)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.organicBanner}>
              <View style={styles.organicBannerContent}>
                <Ionicons name="leaf-outline" size={24} color={colors.white} />
                <View style={styles.organicBannerText}>
                  <Text style={styles.organicBannerTitle}>Certified Organic</Text>
                  <Text style={styles.organicBannerSubtitle}>Pesticide-free • Sustainably grown</Text>
                </View>
              </View>
            </View>

            <FlatList
              horizontal
              data={organicProducts}
              renderItem={renderProductCard}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          </View>
        )}

        {/* Verified Products */}
        {verifiedProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Scientifically Verified</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.verifiedBanner}>
              <View style={styles.verifiedBannerContent}>
                <Ionicons name="shield-checkmark" size={24} color={colors.white} />
                <View style={styles.verifiedBannerText}>
                  <Text style={styles.verifiedBannerTitle}>Quality Verified</Text>
                  <Text style={styles.verifiedBannerSubtitle}>Lab tested • Quality assured</Text>
                </View>
              </View>
            </View>

            <FlatList
              horizontal
              data={verifiedProducts}
              renderItem={renderProductCard}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          </View>
        )}

        {/* Sell Button */}
        {userProfile?.role === 'farmer' || userProfile?.role === 'vendor' ? (
          <TouchableOpacity
            style={styles.sellButton}
            onPress={() => {
              // Navigate to AddProduct screen
              navigation.navigate('AddProduct' as never);
            }}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        ) : null}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  farmerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  farmerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerBannerText: {
    marginLeft: spacing.sm,
  },
  farmerBannerTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  farmerBannerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.8,
  },
  organicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  organicBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organicBannerText: {
    marginLeft: spacing.sm,
  },
  organicBannerTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  organicBannerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.8,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  verifiedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBannerText: {
    marginLeft: spacing.sm,
  },
  verifiedBannerTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  verifiedBannerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.md,
  },
  categoryCard: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  productsContainer: {
    paddingHorizontal: spacing.md,
  },
  productCard: {
    width: 180,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginRight: spacing.md,
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
  directBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  directBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginLeft: 2,
  },
  organicBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  organicBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginLeft: 2,
  },
  sellerVerifiedBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  sellerVerifiedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginLeft: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
  sellerName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  sellButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default MarketplaceScreen;
