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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import CartService from '../../services/CartService';
import { Product, ProductCategory } from '../../models/Product';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

const MarketplaceScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    if (userProfile?.uid) {
      loadCartCount();
    }
  }, [userProfile?.uid]);

  // Filter products when search query or active category changes
  useEffect(() => {
    filterProducts();
  }, [searchQuery, activeCategory, products]);

  // Load cart count
  const loadCartCount = async () => {
    if (!userProfile?.uid) return;

    try {
      const count = await CartService.getCartCount(userProfile.uid);
      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  // Load products from Firebase
  const loadProducts = async () => {
    try {
      setLoading(true);

      // Fetch featured products (verified products)
      const featuredProducts = await MarketplaceService.getFeaturedProducts(10);
      console.log('Featured products:', featuredProducts.map(p => ({ name: p.name, sellerVerified: p.sellerVerified })));

      // Fetch recent products
      const recentProducts = await MarketplaceService.getRecentProducts(20);
      console.log('Recent products:', recentProducts.map(p => ({ name: p.name, sellerVerified: p.sellerVerified })));

      // Fetch direct-from-farmer products
      const directFarmerProducts = await MarketplaceService.getZeroCommissionProducts();

      // Fetch recommended products for the current user
      let recommendedProducts: Product[] = [];
      if (userProfile?.uid) {
        console.log('Getting personalized recommendations for user', userProfile.uid);
        try {
          recommendedProducts = await MarketplaceService.getRecommendedProducts(userProfile.uid);
        } catch (recError) {
          console.error('Error getting recommended products:', recError);
        }
      }

      // Combine all products and remove duplicates
      const allProducts = [...featuredProducts, ...recentProducts, ...directFarmerProducts, ...recommendedProducts];

      // Ensure all products have the sellerVerified property set correctly
      const productsWithVerification = allProducts.map(product => {
        // Make sure sellerVerified is a boolean
        if (typeof product.sellerVerified !== 'boolean') {
          console.log(`Fixing sellerVerified for product ${product.name} (${product.id})`);
          return {
            ...product,
            sellerVerified: product.sellerVerified === true
          };
        }
        return product;
      });

      const uniqueProducts = Array.from(new Map(productsWithVerification.map(item => [item.id, item])).values());

      // Set products state
      setProducts(uniqueProducts);

    } catch (error) {
      console.error('Error loading data:', error);
      // If there's an error, set some fallback products so the UI isn't empty
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter products based on search query and active category
  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(product => product.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(filtered);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Render a product card
  const renderProductCard = ({ item }: { item: Product }) => {
    // Ensure sellerVerified is a boolean
    const isVerified = item.sellerVerified === true;

    return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
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

      {/* User Verification Badge */}
      {isVerified && (
        <View style={styles.verifiedSellerBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.white} />
          <Text style={styles.verifiedSellerText}>VERIFIED</Text>
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
            ₹{item.discountedPrice || item.price}
            {item.discountedPrice && (
              <Text style={styles.productOriginalPrice}> ₹{item.price}</Text>
            )}
          </Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={colors.secondary} />
            <Text style={styles.ratingText}>
              {(item.averageRating !== undefined && item.averageRating !== null)
                ? item.averageRating.toFixed(1)
                : '0.0'}
            </Text>
          </View>
        </View>

        <View style={styles.productFooter}>
          <View style={styles.sellerContainer}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.sellerName}
            </Text>
            {isVerified && (
              <View style={styles.inlineVerifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.white} />
              </View>
            )}
          </View>

          <Text style={styles.productLocation} numberOfLines={1}>
            {item.location.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  // Render category tab
  const renderCategoryTab = (category: ProductCategory | 'all', label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        activeCategory === category && styles.activeCategoryTab,
      ]}
      onPress={() => {
        setActiveCategory(category);
        // If a specific category is selected, filter products without navigating
        if (category !== 'all') {
          const filtered = products.filter(product => product.category === category);
          setFilteredProducts(filtered);
        } else {
          // If 'all' is selected, show all products
          setFilteredProducts(products);
        }
      }}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeCategory === category ? colors.primary : colors.mediumGray}
      />
      <Text
        style={[
          styles.categoryTabText,
          activeCategory === category && styles.activeCategoryTabText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Marketplace</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('UserProducts')}
            >
              <Ionicons name="basket-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
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

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {renderCategoryTab('all', 'All', 'grid')}
          {renderCategoryTab('fertilizer', 'Fertilizers', 'leaf')}
          {renderCategoryTab('equipment', 'Equipment', 'construct')}
          {renderCategoryTab('produce', 'Produce', 'nutrition')}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productsContainer}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basket" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'No products available in this category'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // Navigate to AddProduct screen in the Marketplace stack
          // This ensures we're using the correct navigator
          if (navigation.canGoBack()) {
            // If we can go back, we're already in the Marketplace stack
            navigation.navigate('AddProduct');
          } else {
            // Otherwise, we need to specify the full path
            navigation.navigate('Marketplace', { screen: 'AddProduct' });
          }
        }}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'relative',
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  cartButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
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
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  categoriesScrollContent: {
    paddingHorizontal: spacing.md,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
  },
  activeCategoryTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  categoryTabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  activeCategoryTabText: {
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
  verifiedSellerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedSellerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  sellerContainer: {
    flexDirection: 'row',
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
  inlineVerifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
  addButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
});

export default MarketplaceScreen;
