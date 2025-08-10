import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get order IDs from route params
  const { orderIds } = route.params as { orderIds: string[] };
  
  // Handle view orders
  const handleViewOrders = () => {
    navigation.navigate('Orders' as never);
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
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
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
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    padding: spacing.large,
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    marginBottom: spacing.large,
  },
  successTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  successMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.large,
    textAlign: 'center',
  },
  orderInfoContainer: {
    width: '100%',
    padding: spacing.medium,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.large,
  },
  orderInfoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  orderIdContainer: {
    marginBottom: spacing.medium,
  },
  orderIdLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  orderId: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.small,
  },
  orderNote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttonsContainer: {
    width: '100%',
  },
  viewOrdersButton: {
    marginBottom: spacing.medium,
  },
  continueShoppingButton: {
    marginBottom: spacing.small,
  },
});

export default OrderSuccessScreen;
