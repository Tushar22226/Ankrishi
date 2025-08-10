import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import CartService, { CartItem } from '../../services/CartService';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';



const CartScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Load cart items on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadCartItems();
    } else {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  // Load cart items
  const loadCartItems = async () => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch cart items from CartService
      const items = await CartService.getCartItems(userProfile.uid);
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.discountedPrice || item.price;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  // Calculate shipping fee
  const calculateShippingFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 1000 ? 0 : 50; // Free shipping for orders over ₹1000
  };

  // Calculate total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateShippingFee();
  };

  // Handle quantity change
  const handleQuantityChange = async (itemId: string, increment: boolean) => {
    if (!userProfile?.uid) return;

    try {
      setUpdatingQuantity(itemId);

      // Find the item
      const itemIndex = cartItems.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      const item = cartItems[itemIndex];
      let newQuantity = item.quantity;

      if (increment) {
        if (item.quantity < item.stock) {
          newQuantity = item.quantity + 1;
        } else {
          Alert.alert('Maximum Limit', `Only ${item.stock} units available`);
          setUpdatingQuantity(null);
          return;
        }
      } else {
        if (item.quantity > 1) {
          newQuantity = item.quantity - 1;
        } else {
          // Ask if user wants to remove the item
          Alert.alert(
            'Remove Item',
            'Do you want to remove this item from your cart?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setUpdatingQuantity(null),
              },
              {
                text: 'Remove',
                onPress: () => handleRemoveItem(itemId),
              },
            ]
          );
          return;
        }
      }

      // Update the quantity in the database
      await CartService.updateCartItemQuantity(userProfile.uid, itemId, newQuantity);

      // Update the local state
      const updatedItems = [...cartItems];
      updatedItems[itemIndex] = { ...item, quantity: newQuantity };

      setCartItems(updatedItems);
      setUpdatingQuantity(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setUpdatingQuantity(null);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: string) => {
    if (!userProfile?.uid) return;

    try {
      setUpdatingQuantity(itemId);

      // Remove the item from the database
      await CartService.removeFromCart(userProfile.uid, itemId);

      // Update the local state
      const updatedItems = cartItems.filter(item => item.id !== itemId);

      setCartItems(updatedItems);
      setUpdatingQuantity(null);
    } catch (error) {
      console.error('Error removing item:', error);
      setUpdatingQuantity(null);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!userProfile) {
      Alert.alert(
        'Login Required',
        'You need to login to proceed to checkout',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login' as never)
          }
        ]
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add items to proceed to checkout.');
      return;
    }

    setCheckingOut(true);

    // Navigate to the checkout screen
    // In a future implementation, we would pass the cart items to the checkout screen
    setTimeout(() => {
      setCheckingOut(false);
      navigation.navigate('DirectCheckout' as never, {
        fromCart: true
      } as never);
    }, 500);
  };

  // Render a cart item
  const renderCartItem = ({ item }: { item: any }) => (
    <Card style={styles.cartItemCard}>
      <TouchableOpacity
        style={styles.itemImage}
        onPress={() => navigation.navigate('ProductDetails' as never, { productId: item.productId } as never)}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetails' as never, { productId: item.productId } as never)}
        >
          <Text style={styles.itemName}>{item.name}</Text>
        </TouchableOpacity>

        <Text style={styles.itemSeller}>{item.seller}</Text>

        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>
            {formatCurrency(item.discountedPrice || item.price)}
            {item.discountedPrice && (
              <Text style={styles.itemOriginalPrice}>
                {' '}{formatCurrency(item.price)}
              </Text>
            )}
          </Text>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, false)}
              disabled={updatingQuantity === item.id}
            >
              <Ionicons
                name="remove"
                size={16}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.quantityContainer}>
              {updatingQuantity === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.quantityText}>{item.quantity}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, true)}
              disabled={updatingQuantity === item.id || item.quantity >= item.stock}
            >
              <Ionicons
                name="add"
                size={16}
                color={item.quantity >= item.stock ? colors.lightGray : colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
        disabled={updatingQuantity === item.id}
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Shopping Cart</Text>

        <View style={styles.placeholder} />
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.cartItemsList}
            showsVerticalScrollIndicator={false}
          />

          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(calculateSubtotal())}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Fee</Text>
              <Text style={styles.summaryValue}>
                {calculateShippingFee() === 0
                  ? 'Free'
                  : formatCurrency(calculateShippingFee())}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(calculateTotal())}
              </Text>
            </View>

            <Button
              title="Proceed to Checkout"
              onPress={handleCheckout}
              loading={checkingOut}
              fullWidth
              style={styles.checkoutButton}
            />
          </Card>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>
            Add items to your cart to proceed with your purchase.
          </Text>

          <Button
            title="Continue Shopping"
            onPress={() => navigation.navigate('Marketplace' as never)}
            style={styles.continueButton}
          />
        </View>
      )}
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
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
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
  placeholder: {
    width: 40,
  },
  cartItemsList: {
    padding: spacing.md,
    paddingBottom: 200, // Extra space for the summary card
  },
  cartItemCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  itemSeller: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  itemOriginalPrice: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    width: 36,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  removeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  checkoutButton: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: spacing.xl,
  },
  continueButton: {
    width: '80%',
  },
});

export default CartScreen;
