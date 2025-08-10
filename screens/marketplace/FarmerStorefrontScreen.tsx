import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import ReputationService from '../../services/ReputationService';
import { Product } from '../../models/Product';
import { UserProfile } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

const FarmerStorefrontScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get farmer ID from route params
  const { farmerId } = route.params as { farmerId: string };

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmer, setFarmer] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  // Load farmer data
  useEffect(() => {
    loadFarmerData();
  }, [farmerId]);

  // Refresh control
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFarmerData();
    setRefreshing(false);
  };

  // Load farmer data
  const loadFarmerData = async () => {
    try {
      setLoading(true);

      // Get farmer profile and products
      const { profile, products } = await MarketplaceService.getFarmerProfile(farmerId);

      if (profile) {
        setFarmer(profile);
        setProducts(products);
      } else {
        Alert.alert('Error', 'Farmer not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading farmer data:', error);
      Alert.alert('Error', 'Failed to load farmer data');
    } finally {
      setLoading(false);
    }
  };

  // Handle contact farmer
  const handleContactFarmer = () => {
    if (!farmer) return;

    Alert.alert(
      'Contact Farmer',
      'How would you like to contact the farmer?',
      [
        {
          text: 'Call',
          onPress: () => {
            if (farmer.phoneNumber) {
              Linking.openURL(`tel:${farmer.phoneNumber}`);
            } else {
              Alert.alert('Error', 'Phone number not available');
            }
          },
        },
        {
          text: 'Message',
          onPress: () => {
            // Navigate to Home stack first, then to ChatScreen
            navigation.navigate('Home' as never, {
              screen: 'ChatScreen',
              params: {
                chatId: `user_${userProfile?.uid}_${farmerId}`,
                recipientId: farmerId,
                recipientName: farmer?.displayName || 'Farmer',
                recipientPhoto: farmer?.photoURL || '',
                isGroup: false
              }
            } as never);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Format rating
  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  // Render a product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetails' as never, { productId: item.id } as never)}
      >
        <Image
          source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image' }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {item.isDirectFromFarmer && (
          <View style={styles.directBadge}>
            <Text style={styles.directBadgeText}>Direct</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>

          <View style={styles.productMeta}>
            <Text style={styles.productCategory}>
              {item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1)}
            </Text>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={colors.secondary} />
              <Text style={styles.ratingText}>
                {formatRating(item.averageRating)}
                {item.ratings && item.ratings.length > 0 && (
                  <Text style={styles.productRatingCount}> ({item.ratings.length})</Text>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ₹{item.discountedPrice || item.price}
              {item.discountedPrice && (
                <Text style={styles.originalPrice}> ₹{item.price}</Text>
              )}
            </Text>

            <Text style={styles.stockInfo}>
              {item.stock > 0 ? `In Stock (${item.stock})` : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  // Render farmer badges
  const renderBadges = () => {
    if (!farmer?.reputation?.badges || farmer.reputation.badges.length === 0) {
      return null;
    }

    return (
      <View style={styles.badgesContainer}>
        {farmer.reputation.badges.map((badge, index) => (
          <View key={index} style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render reviews
  const renderReviews = () => {
    if (!farmer?.reputation?.reviews || farmer.reputation.reviews.length === 0) {
      return (
        <View style={styles.emptyReviews}>
          <Ionicons name="star-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyReviewsText}>No reviews yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.reviewsContainer}>
        {farmer.reputation.reviews.map((review, index) => (
          <Card key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.rating ? 'star' : 'star-outline'}
                    size={16}
                    color={colors.secondary}
                  />
                ))}
              </View>

              <Text style={styles.reviewDate}>
                {new Date(review.timestamp).toLocaleDateString()}
              </Text>
            </View>

            {review.comment && (
              <Text style={styles.reviewComment}>{review.comment}</Text>
            )}
          </Card>
        ))}
      </View>
    );
  };

  // Render about section
  const renderAboutSection = () => {
    if (!farmer) return null;

    return (
      <View style={styles.aboutSection}>
        <Card style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>Farm Details</Text>

          {farmer.farmDetails?.name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farm Name:</Text>
              <Text style={styles.detailValue}>{farmer.farmDetails.name}</Text>
            </View>
          )}

          {farmer.farmDetails?.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{farmer.farmDetails.description}</Text>
            </View>
          )}

          {farmer.farmDetails?.farmingMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farming Method:</Text>
              <Text style={styles.detailValue}>
                {farmer.farmDetails.farmingMethod.charAt(0).toUpperCase() +
                 farmer.farmDetails.farmingMethod.slice(1)}
              </Text>
            </View>
          )}

          {farmer.farmDetails?.size && farmer.farmDetails?.sizeUnit && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farm Size:</Text>
              <Text style={styles.detailValue}>
                {farmer.farmDetails.size} {farmer.farmDetails.sizeUnit}
              </Text>
            </View>
          )}

          {farmer.farmDetails?.establishedYear && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Established:</Text>
              <Text style={styles.detailValue}>{farmer.farmDetails.establishedYear}</Text>
            </View>
          )}

          {farmer.farmDetails?.certifications && farmer.farmDetails.certifications.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Certifications:</Text>
              <Text style={styles.detailValue}>
                {farmer.farmDetails.certifications.join(', ')}
              </Text>
            </View>
          )}

          {farmer.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{farmer.location.address}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          {farmer.displayName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{farmer.displayName}</Text>
            </View>
          )}

          {farmer.phoneNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{farmer.phoneNumber}</Text>
            </View>
          )}

          {farmer.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{farmer.email}</Text>
            </View>
          )}
        </Card>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading farmer profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Farmer Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              {farmer?.photoURL ? (
                <Image
                  source={{ uri: farmer.photoURL }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : farmer?.farmDetails?.images && farmer.farmDetails.images.length > 0 ? (
                <Image
                  source={{ uri: farmer.farmDetails.images[0] }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="leaf" size={48} color={colors.lightGray} />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.farmerName}>
                  {farmer?.displayName || 'Farmer'}
                </Text>

                {farmer?.reputation?.verifiedStatus && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
              </View>

              <Text style={styles.farmName}>
                {farmer?.farmDetails?.name || 'Farm'}
              </Text>

              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={colors.secondary} />
                <Text style={styles.ratingText}>
                  {formatRating(farmer?.reputation?.rating || 0)}
                </Text>
                <Text style={styles.ratingCount}>
                  ({farmer?.reputation?.totalRatings || 0} ratings)
                </Text>
              </View>

              <Text style={styles.location}>
                {farmer?.location?.address || 'Location not available'}
              </Text>
            </View>
          </View>

          {renderBadges()}

          <View style={styles.actionButtons}>
            <Button
              title="Contact Farmer"
              onPress={handleContactFarmer}
              icon={<Ionicons name="chatbubble-outline" size={18} color={colors.white} />}
              style={styles.contactButton}
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'products' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('products')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'products' && styles.activeTabText,
              ]}
            >
              Products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'about' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('about')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'about' && styles.activeTabText,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'reviews' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'reviews' && styles.activeTabText,
              ]}
            >
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'products' && (
            <>
              {products.length > 0 ? (
                <View style={styles.productsGrid}>
                  {products.map((product) => (
                    <View key={product.id} style={styles.productItem}>
                      {renderProductItem({ item: product })}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyProducts}>
                  <Ionicons name="basket-outline" size={48} color={colors.lightGray} />
                  <Text style={styles.emptyProductsText}>No products available</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'about' && renderAboutSection()}

          {activeTab === 'reviews' && renderReviews()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop:30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  loadingText: {
    marginTop: spacing.small,
    ...typography.body,
    color: colors.textPrimary,
  },
  header: {
    height: 180,
    ...getPlatformTopSpacing('paddingTop', 12, 16),
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileSection: {
    marginTop: -85,
    marginHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    backgroundColor: colors.lightBackground,
    ...shadows.small,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 6,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginRight: 6,
    fontSize: 18,
    fontWeight: '700',
  },
  farmName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  productRatingCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
  ratingCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    fontSize: 12,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    marginHorizontal: -2,
  },
  badge: {
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 16,
  },
  contactButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 46,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  activeTabText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
    paddingTop: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productItem: {
    width: '50%',
    padding: 6,
  },
  productCard: {
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  productImage: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  directBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  directBadgeText: {
    ...typography.captionBold,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  originalPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginLeft: 4,
    fontSize: 12,
  },
  stockInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
  },
  emptyProductsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.small,
  },
  aboutSection: {
    gap: 10,
  },
  aboutCard: {
    padding: 10,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.small,
  },
  detailLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    width: 120,
  },
  detailValue: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  reviewsContainer: {
    gap: spacing.medium,
  },
  reviewCard: {
    padding: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reviewComment: {
    ...typography.body,
    color: colors.textPrimary,
  },
  emptyReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
  },
  emptyReviewsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.small,
  },
});

export default FarmerStorefrontScreen;
