import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, shadows } from '../../theme';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import { Product } from '../../models/Product';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

const ViewPrelistedProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const prelistedProducts = await MarketplaceService.getPrelistedProducts(50);
      setProducts(prelistedProducts);
    } catch (error) {
      console.error('Error loading prelisted products:', error);
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
  }, []);

  const renderProductItem = ({ item }: { item: Product }) => {
    // Calculate days remaining until end date
    const endDate = new Date(item.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.isDirectFromFarmer && (
            <View style={styles.directFarmerBadge}>
              <Text style={styles.directFarmerText}>Direct from Farmer</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>₹{item.discountedPrice || item.price}</Text>
            {item.discountedPrice && (
              <Text style={styles.originalPrice}>₹{item.price}</Text>
            )}
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

          {item.sellerVerified && (
            <View style={styles.verifiedContainer}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>Verified Seller</Text>
            </View>
          )}
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
        <Text style={styles.headerTitle}>Prelisted Products</Text>
        <View style={styles.placeholder} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prelisted products...</Text>
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="leaf-outline"
          title="No Prelisted Products"
          message="There are no prelisted products available at the moment. Check back later or explore the marketplace for available products."
          actionText="Go to Marketplace"
          onAction={() => navigation.navigate('Marketplace')}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          numColumns={1}
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
  productsList: {
    padding: spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  productImageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  directFarmerBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderBottomRightRadius: 4,
  },
  directFarmerText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  productInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
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
    marginBottom: spacing.xs,
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
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.success,
    marginLeft: spacing.xs,
  },
});

export default ViewPrelistedProductsScreen;
