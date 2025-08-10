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

// Produce subcategories
const produceSubcategories = [
  { id: 'all', name: 'All Types' },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'fruits', name: 'Fruits' },
  { id: 'grains', name: 'Grains' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'other', name: 'Other' },
];

const ProduceScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [produce, setProduce] = useState<Product[]>([]);
  const [filteredProduce, setFilteredProduce] = useState<Product[]>([]);

  // Load produce on component mount
  useEffect(() => {
    loadProduce();
  }, []);

  // Filter produce when search query or active subcategory changes
  useEffect(() => {
    filterProduce();
  }, [searchQuery, activeSubcategory, produce]);

  // Load produce from service
  const loadProduce = async () => {
    try {
      setLoading(true);

      // Try to fetch produce from Firebase
      try {
        const productsFromFirebase = await MarketplaceService.getProductsByCategory('produce');

        if (productsFromFirebase && productsFromFirebase.length > 0) {
          console.log('Loaded produce from Firebase:', productsFromFirebase.length);
          setProduce(productsFromFirebase);
          return;
        }
      } catch (firebaseError) {
        console.error('Error fetching from Firebase:', firebaseError);
      }

      // Fallback to mock data if Firebase fetch fails or returns empty
      console.log('Using mock produce data');
      const mockProduce: Product[] = [
        {
          id: '1',
          name: 'Fresh Tomatoes',
          description: 'Organically grown tomatoes. Harvested yesterday. Sweet and juicy.',
          category: 'produce',
          subcategory: 'vegetables',
          price: 40,
          currency: 'INR',
          stock: 50,
          images: [
            {
              url: 'https://via.placeholder.com/300x200?text=Tomatoes',
              isMain: true,
              uploadedAt: Date.now(),
            },
          ],
          sellerId: '123',
          sellerName: 'Organic Farms',
          sellerRating: 4.7,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'Pune, Maharashtra',
          },
          ratings: [],
          averageRating: 4.6,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          isVerified: true,
          tags: ['produce', 'vegetables', 'organic', 'tomatoes'],
        },
        {
          id: '2',
          name: 'Alphonso Mangoes',
          description: 'Premium Alphonso mangoes from Ratnagiri. Sweet, aromatic, and perfect ripeness.',
          category: 'produce',
          subcategory: 'fruits',
          price: 300,
          discountedPrice: 250,
          currency: 'INR',
          stock: 30,
          images: [
            {
              url: 'https://via.placeholder.com/300x200?text=Mangoes',
              isMain: true,
              uploadedAt: Date.now(),
            },
          ],
          sellerId: '456',
          sellerName: 'Fruit Paradise',
          sellerRating: 4.8,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'Pune, Maharashtra',
          },
          ratings: [],
          averageRating: 4.7,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          isVerified: true,
          tags: ['produce', 'fruits', 'mangoes', 'alphonso'],
        },
        {
          id: '3',
          name: 'Organic Wheat',
          description: 'Organically grown wheat. No pesticides or chemical fertilizers used.',
          category: 'produce',
          subcategory: 'grains',
          price: 35,
          currency: 'INR',
          stock: 200,
          images: [
            {
              url: 'https://via.placeholder.com/300x200?text=Wheat',
              isMain: true,
              uploadedAt: Date.now(),
            },
          ],
          sellerId: '123',
          sellerName: 'Organic Farms',
          sellerRating: 4.7,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'Pune, Maharashtra',
          },
          ratings: [],
          averageRating: 4.5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          isVerified: true,
          tags: ['produce', 'grains', 'organic', 'wheat'],
        },
        {
          id: '4',
          name: 'Farm Fresh Milk',
          description: 'Fresh cow milk delivered daily. No preservatives or additives.',
          category: 'produce',
          subcategory: 'dairy',
          price: 60,
          currency: 'INR',
          stock: 20,
          images: [
            {
              url: 'https://via.placeholder.com/300x200?text=Milk',
              isMain: true,
              uploadedAt: Date.now(),
            },
          ],
          sellerId: '789',
          sellerName: 'Dairy Fresh',
          sellerRating: 4.6,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'Pune, Maharashtra',
          },
          ratings: [],
          averageRating: 4.4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          isVerified: true,
          tags: ['produce', 'dairy', 'milk', 'fresh'],
        },
        {
          id: '5',
          name: 'Fresh Potatoes',
          description: 'Farm-fresh potatoes. Perfect for all cooking needs.',
          category: 'produce',
          subcategory: 'vegetables',
          price: 30,
          currency: 'INR',
          stock: 100,
          images: [
            {
              url: 'https://via.placeholder.com/300x200?text=Potatoes',
              isMain: true,
              uploadedAt: Date.now(),
            },
          ],
          sellerId: '123',
          sellerName: 'Organic Farms',
          sellerRating: 4.7,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'Pune, Maharashtra',
          },
          ratings: [],
          averageRating: 4.3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          isVerified: true,
          tags: ['produce', 'vegetables', 'potatoes'],
        },
        {
          id: '6',
          name: 'Organic Rice',
          description: 'Premium quality organic rice. Long grain and aromatic.',
          category: 'produce',
          subcategory: 'grains',
          price: 80,
          currency: 'INR',
          stock: 150,
          images: [
            {
              url: 'https://via.placeholder.com/300x200?text=Rice',
              isMain: true,
              uploadedAt: Date.now(),
            },
          ],
          sellerId: '123',
          sellerName: 'Organic Farms',
          sellerRating: 4.7,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'Pune, Maharashtra',
          },
          ratings: [],
          averageRating: 4.5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          isVerified: true,
          tags: ['produce', 'grains', 'organic', 'rice'],
        },
      ];

      setProduce(mockProduce);
    } catch (error) {
      console.error('Error loading produce:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter produce based on search query and active subcategory
  const filterProduce = () => {
    let filtered = [...produce];

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

    setFilteredProduce(filtered);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadProduce();
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    // In a real app, we would add the product to the cart in a CartService
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  // Handle buy now
  const handleBuyNow = (product: Product) => {
    navigation.navigate('ProductDetails' as never, {
      productId: product.id,
      action: 'buy'
    } as never);
  };

  // Handle rent
  const handleRent = (product: Product) => {
    navigation.navigate('ProductDetails' as never, {
      productId: product.id,
      action: 'rent'
    } as never);
  };

  // Render a produce card
  const renderProduceCard = ({ item }: { item: Product }) => (
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
              ₹{item.discountedPrice || item.price}/kg
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

      {/* Action buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cartButton]}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="cart-outline" size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => handleBuyNow(item)}
        >
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rentButton]}
          onPress={() => handleRent(item)}
        >
          <Text style={styles.rentButtonText}>Rent</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.loadingText}>Loading produce...</Text>
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

          <Text style={styles.title}>Fresh Produce</Text>

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
            placeholder="Search produce..."
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
          data={produceSubcategories}
          renderItem={({ item }) => renderSubcategoryTab(item)}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoriesContent}
        />
      </View>

      <FlatList
        data={filteredProduce}
        renderItem={renderProduceCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productsContainer}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="nutrition-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Produce Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'No produce available in this category'}
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.xs,
  },
  cartButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  buyButton: {
    backgroundColor: colors.primary,
  },
  rentButton: {
    backgroundColor: colors.secondary,
  },
  buyButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  rentButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
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
});

export default ProduceScreen;
