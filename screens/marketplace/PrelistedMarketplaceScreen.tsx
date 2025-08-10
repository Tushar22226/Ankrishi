import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, typography, spacing, shadows } from '../../theme';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import { Product } from '../../models/Product';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';

const PrelistedMarketplaceScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      const prelistedProducts = await MarketplaceService.getPrelistedProductsBySeller(userProfile.uid);
      setProducts(prelistedProducts);
    } catch (error) {
      console.error('Error loading your prelisted products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadProducts();
  }, [userProfile]);

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this prelisted product?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MarketplaceService.deletePrelistedProduct(productId);
              // Remove the product from the state
              setProducts(products.filter(product => product.id !== productId));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handlePublishProduct = async (product: Product) => {
    Alert.alert(
      'Publish Product',
      'Are you sure you want to publish this product to the marketplace now?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Publish',
          onPress: async () => {
            try {
              // Remove prelisted-specific fields
              const { endDate, deliveryTimeframe, isPrelisted, ...regularProduct } = product;

              // Add to regular products
              await MarketplaceService.addProduct(regularProduct);

              // Delete from prelisted products
              await MarketplaceService.deletePrelistedProduct(product.id);

              // Remove the product from the state
              setProducts(products.filter(p => p.id !== product.id));

              Alert.alert('Success', 'Product published to marketplace successfully');
            } catch (error) {
              console.error('Error publishing product:', error);
              Alert.alert('Error', 'Failed to publish product');
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    // Calculate days remaining until end date
    const endDate = new Date(item.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <View style={styles.productCard}>
        <TouchableOpacity
          style={styles.productContent}
          onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        >
          <Image
            source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>₹{item.discountedPrice || item.price}</Text>
              {item.discountedPrice && (
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              )}
            </View>

            <View style={styles.stockInfo}>
              <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.stockText}>
                Stock: {item.stock} {item.stockUnit}
              </Text>
            </View>

            <View style={styles.deliveryInfo}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.deliveryText}>
                Delivery in: {item.deliveryTimeframe.replace('week', ' Week').replace('weeks', ' Weeks')}
              </Text>
            </View>

            <View style={styles.expiryInfo}>
              <Ionicons name="calendar-outline" size={16} color={daysRemaining < 3 ? colors.error : colors.textSecondary} />
              <Text style={[styles.expiryText, daysRemaining < 3 && styles.urgentText]}>
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expires today'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={() => handlePublishProduct(item)}
          >
            <Ionicons name="arrow-up-circle" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Publish Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditProduct', { productId: item.id, isPrelisted: true })}
          >
            <Ionicons name="create" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <Ionicons name="trash" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Your Prelisted Products</Text>
        <View style={styles.placeholder} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your prelisted products...</Text>
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="leaf-outline"
          title="No Prelisted Products"
          message="You haven't added any prelisted products yet. Add products that you'll have available in the future."
          actionText="Add Prelisted Product"
          onAction={() => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'AddPrelistedProduct',
              })
            );
          }}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
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

      {/* Add Prelisted Product Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          navigation.dispatch(
            CommonActions.navigate({
              name: 'AddPrelistedProduct',
            })
          );
        }}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>
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
  productsList: {
    padding: spacing.md,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  productContent: {
    flexDirection: 'row',
    padding: spacing.sm,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stockText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deliveryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  urgentText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
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
  publishButton: {
    backgroundColor: colors.success,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default PrelistedMarketplaceScreen;
