import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();
  const isFarmer = userProfile?.role === 'farmer';

  // Get order IDs from route params
  const { orderIds } = route.params as { orderIds: string[] };

  // Handle view orders
  const handleViewOrders = () => {
    if (isFarmer) {
      // Navigate to Orders screen in the My Farm stack for farmers
      navigation.navigate('My Farm', {
        screen: 'Orders'
      } as never);
    } else {
      // For non-farmers, navigate directly to the marketplace Orders screen
      navigation.navigate('Orders' as never);
    }
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    navigation.navigate('MarketplaceMain' as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={60} color={colors.white} />
            </View>
          </View>

          <Text style={styles.successTitle}>Order Placed Successfully!</Text>

          <Text style={styles.successMessage}>
            Your order has been placed successfully. You can track your order status in the Orders section.
          </Text>

          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderInfoTitle}>Order Information</Text>

            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID{orderIds.length > 1 ? 's' : ''}:</Text>
              {orderIds.map((orderId, index) => (
                <Text key={index} style={styles.orderId}>{orderId}</Text>
              ))}
            </View>

            <Text style={styles.orderNote}>
              {orderIds.length > 1
                ? 'Your items have been split into multiple orders based on sellers. Each order will be processed and delivered separately.'
                : 'Your order will be processed and delivered as per the selected delivery option.'}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <Button
              title="View My Orders"
              onPress={handleViewOrders}
              style={styles.viewOrdersButton}
            />

            <Button
              title="Continue Shopping"
              variant="outline"
              onPress={handleContinueShopping}
              style={styles.continueShoppingButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: getPlatformTopSpacing(),
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successContainer: {
    width: '100%',
    maxWidth: Math.min(500, width - 32),
    alignItems: 'center',
    padding: 28,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successTitle: {
    ...typography.h1,
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  orderInfoContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderInfoTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  orderIdContainer: {
    marginBottom: 16,
  },
  orderIdLabel: {
    ...typography.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  orderId: {
    ...typography.body,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  orderNote: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 8,
  },
  viewOrdersButton: {
    marginBottom: 16,
    height: 50,
    borderRadius: 10,
  },
  continueShoppingButton: {
    marginBottom: 8,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
  },
});

export default OrderSuccessScreen;
