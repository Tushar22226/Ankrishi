import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import LoadingQuote from '../../components/LoadingQuote';
import WalletService from '../../services/WalletService';
import database from '@react-native-firebase/database';

// Define order status types
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';

const OrderManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get orderId from route params
  const { orderId } = route.params as { orderId: string };

  // State variables
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [preparationTimeRemaining, setPreparationTimeRemaining] = useState<number | null>(null);
  const [preparationDeadline, setPreparationDeadline] = useState<Date | null>(null);
  const [isPrelistedProduct, setIsPrelistedProduct] = useState<boolean>(false);
  const [harvestDate, setHarvestDate] = useState<number | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Get available status options based on current order status
  const getAvailableStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed'];
      case 'confirmed':
        return ['processing'];
      default:
        // No options for processing, out_for_delivery, delivered, etc.
        return [];
    }
  };

  // Status options for the seller to choose from
  const [statusOptions, setStatusOptions] = useState<OrderStatus[]>([]);

  // Load order data
  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  // Calculate preparation deadline based on order creation time and product type
  const calculatePreparationDeadline = (createdAt: number): Date => {
    // PRELISTED PRODUCT HANDLING
    if (isPrelistedProduct) {
      // For prelisted products with a harvest date
      if (harvestDate) {
        // For PENDING orders: 24-hour confirmation window from order creation
        if (order?.status === 'pending') {
          const confirmDeadline = new Date(createdAt);
          confirmDeadline.setTime(confirmDeadline.getTime() + (24 * 60 * 60 * 1000)); // Exactly 24 hours
          console.log('Prelisted order is PENDING - Confirmation deadline:', confirmDeadline.toLocaleString());
          return confirmDeadline;
        }

        // For CONFIRMED or PROCESSING orders: Delivery at 5pm on harvest date
        if (order?.status === 'confirmed' || order?.status === 'processing') {
          const harvestDeadline = new Date(harvestDate);
          harvestDeadline.setHours(17, 0, 0, 0); // 5pm on harvest date
          console.log('Prelisted order is CONFIRMED/PROCESSING - Delivery deadline:', harvestDeadline.toLocaleString());
          return harvestDeadline;
        }

        // For other statuses, default to harvest date at 5pm
        const defaultDeadline = new Date(harvestDate);
        defaultDeadline.setHours(17, 0, 0, 0); // 5pm on harvest date
        console.log('Prelisted order with OTHER STATUS - Using harvest date:', defaultDeadline.toLocaleString());
        return defaultDeadline;
      }

      // For prelisted products WITHOUT a harvest date (fallback)
      console.log('Prelisted product WITHOUT harvest date - Using 24-hour window');
      const fallbackDeadline = new Date(createdAt);
      fallbackDeadline.setTime(fallbackDeadline.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      return fallbackDeadline;
    }

    // REGULAR PRODUCT HANDLING
    const orderDate = new Date(createdAt);
    const orderHour = orderDate.getHours();

    // Morning/midnight orders (12am-12pm): Prepare before 5pm same day
    if (orderHour >= 0 && orderHour < 12) {
      const deadline = new Date(createdAt);
      deadline.setHours(17, 0, 0, 0); // 5pm same day
      console.log('Regular morning order - Prepare by 5pm today:', deadline.toLocaleString());
      return deadline;
    }
    // Evening/noon orders (12pm-12am): Prepare before 5am next day
    else {
      const deadline = new Date(createdAt);
      deadline.setDate(deadline.getDate() + 1);
      deadline.setHours(5, 0, 0, 0); // 5am next day
      console.log('Regular evening order - Prepare by 5am tomorrow:', deadline.toLocaleString());
      return deadline;
    }
  };

  // Calculate remaining preparation time in milliseconds
  const calculateRemainingTime = (deadline: Date): number => {
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    return Math.max(0, remaining);
  };

  // Format time remaining in hours and minutes
  const formatTimeRemaining = (milliseconds: number): string => {
    // PRELISTED PRODUCT HANDLING
    if (isPrelistedProduct) {
      // If we have a harvest date
      if (harvestDate) {
        // For CONFIRMED or PROCESSING orders: Show time until harvest date delivery
        if (order?.status === 'confirmed' || order?.status === 'processing') {
          const now = new Date();
          const harvestDay = new Date(harvestDate);

          // Set both dates to midnight to compare just the days
          const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const harvestDayOnly = new Date(harvestDay.getFullYear(), harvestDay.getMonth(), harvestDay.getDate());

          // Calculate days until harvest
          const daysUntilHarvest = Math.ceil((harvestDayOnly.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

          // Format based on days until harvest
          if (daysUntilHarvest < 0) {
            return 'Delivery date passed';
          } else if (daysUntilHarvest === 0) {
            return 'Delivery TODAY at 5:00 PM';
          } else if (daysUntilHarvest === 1) {
            return 'Delivery TOMORROW at 5:00 PM';
          } else {
            return `Delivery in ${daysUntilHarvest} days at 5:00 PM`;
          }
        }

        // For PENDING orders: Show confirmation time remaining
        if (order?.status === 'pending') {
          if (milliseconds <= 0) {
            return 'CONFIRMATION TIME EXPIRED';
          }

          const hours = Math.floor(milliseconds / (1000 * 60 * 60));
          const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

          if (hours > 0) {
            return `${hours}h ${minutes}m to confirm order`;
          } else {
            return `${minutes}m to confirm order`;
          }
        }
      }

      // Fallback for prelisted products without harvest date or other statuses
      if (milliseconds <= 0) {
        return 'Time window expired';
      }

      const hours = Math.floor(milliseconds / (1000 * 60 * 60));
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m remaining`;
    }

    // REGULAR PRODUCT HANDLING
    if (milliseconds <= 0) {
      return 'Time expired';
    }

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    // For confirmed or processing orders, show "Preparing" instead of "remaining"
    if (order?.status === 'confirmed' || order?.status === 'processing') {
      if (hours > 0) {
        return `Preparing: ${hours}h ${minutes}m`;
      } else {
        return `Preparing: ${minutes}m`;
      }
    } else {
      // For pending orders, show "remaining"
      if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
      } else {
        return `${minutes}m remaining`;
      }
    }
  };

  // Check if order is recent enough to confirm
  const isOrderRecent = (createdAt: number): boolean => {
    const orderTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();

    // PRELISTED PRODUCT HANDLING
    if (isPrelistedProduct) {
      // Exactly 24 hours for prelisted products
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      const timeElapsed = currentTime - orderTime;
      const hoursElapsed = timeElapsed / (60 * 60 * 1000);
      const deadlineTime = orderTime + twentyFourHoursInMs;
      const deadlineDate = new Date(deadlineTime);
      const isWithinWindow = timeElapsed < twentyFourHoursInMs;

      // Detailed logging for debugging
      console.log('---------------------------------------------');
      console.log('PRELISTED PRODUCT ORDER CONFIRMATION WINDOW:');
      console.log(`Order placed at: ${new Date(orderTime).toLocaleString()}`);
      console.log(`Current time: ${new Date(currentTime).toLocaleString()}`);
      console.log(`Confirmation deadline: ${deadlineDate.toLocaleString()}`);
      console.log(`Time elapsed: ${hoursElapsed.toFixed(2)} hours`);
      console.log(`Time remaining: ${((twentyFourHoursInMs - timeElapsed) / (60 * 60 * 1000)).toFixed(2)} hours`);
      console.log(`Can still confirm: ${isWithinWindow}`);
      console.log('---------------------------------------------');

      return isWithinWindow;
    }
    // REGULAR PRODUCT HANDLING
    else {
      // 3 hours for regular products
      const threeHoursInMs = 3 * 60 * 60 * 1000;
      const timeElapsed = currentTime - orderTime;
      const hoursElapsed = timeElapsed / (60 * 60 * 1000);
      const deadlineTime = orderTime + threeHoursInMs;
      const deadlineDate = new Date(deadlineTime);
      const isWithinWindow = timeElapsed < threeHoursInMs;

      // Detailed logging for debugging
      console.log('---------------------------------------------');
      console.log('REGULAR PRODUCT ORDER CONFIRMATION WINDOW:');
      console.log(`Order placed at: ${new Date(orderTime).toLocaleString()}`);
      console.log(`Current time: ${new Date(currentTime).toLocaleString()}`);
      console.log(`Confirmation deadline: ${deadlineDate.toLocaleString()}`);
      console.log(`Time elapsed: ${hoursElapsed.toFixed(2)} hours`);
      console.log(`Time remaining: ${((threeHoursInMs - timeElapsed) / (60 * 60 * 1000)).toFixed(2)} hours`);
      console.log(`Can still confirm: ${isWithinWindow}`);
      console.log('---------------------------------------------');

      return isWithinWindow;
    }
  };

  // Check if it's midnight (between 11pm and 5am)
  const isMidnight = (): boolean => {
    const currentHour = new Date().getHours();
    return currentHour >= 23 || currentHour < 5;
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    try {
      setUpdating(true);

      // Update order status
      await MarketplaceService.updateOrderStatus(orderId, 'confirmed');

      // Update the local order object
      setOrder({
        ...order,
        status: 'confirmed',
        trackingHistory: [
          ...(order.trackingHistory || []),
          {
            status: 'confirmed',
            timestamp: Date.now(),
            description: 'Order confirmed by seller'
          }
        ]
      });

      // Recalculate preparation deadline for the confirmed order
      const deadline = calculatePreparationDeadline(order.createdAt);
      setPreparationDeadline(deadline);
      setPreparationTimeRemaining(calculateRemainingTime(deadline));

      // Detailed logging for prelisted orders
      if (isPrelistedProduct) {
        console.log('---------------------------------------------');
        console.log('PRELISTED ORDER CONFIRMED:');
        if (harvestDate) {
          console.log(`Harvest date: ${new Date(harvestDate).toLocaleDateString()}`);
          console.log(`Delivery scheduled for: 5:00 PM on ${new Date(harvestDate).toLocaleDateString()}`);
        } else {
          console.log('No harvest date found for this prelisted order');
        }
        console.log(`New preparation deadline: ${deadline.toLocaleString()}`);
        console.log('---------------------------------------------');
      }

      setSelectedStatus('confirmed');

      // Show different messages for prelisted products vs regular products
      if (isPrelistedProduct) {
        if (harvestDate) {
          const harvestDateStr = new Date(harvestDate).toLocaleDateString();
          const now = new Date();
          const harvestDay = new Date(harvestDate);
          const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const harvestDayOnly = new Date(harvestDay.getFullYear(), harvestDay.getMonth(), harvestDay.getDate());
          const daysUntilHarvest = Math.ceil((harvestDayOnly.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

          let deliveryText = '';
          if (daysUntilHarvest < 0) {
            deliveryText = `The harvest date (${harvestDateStr}) has already passed.`;
          } else if (daysUntilHarvest === 0) {
            deliveryText = `Delivery is scheduled for TODAY at 5:00 PM.`;
          } else if (daysUntilHarvest === 1) {
            deliveryText = `Delivery is scheduled for TOMORROW at 5:00 PM.`;
          } else {
            deliveryText = `Delivery is scheduled for ${harvestDateStr} at 5:00 PM (in ${daysUntilHarvest} days).`;
          }

          Alert.alert(
            'PRELISTED ORDER CONFIRMED',
            `Your prelisted product order has been confirmed successfully.\n\n${deliveryText}\n\nThe product will be prepared for delivery at 5:00 PM on the harvest date.\n\nPayment will be processed after delivery is completed.`
          );
        } else {
          Alert.alert(
            'PRELISTED ORDER CONFIRMED',
            `Your prelisted product order has been confirmed successfully.\n\nSince no harvest date was specified, the order will be processed according to standard delivery timelines.\n\nPayment will be processed after delivery is completed.`
          );
        }
      } else {
        Alert.alert('Order Confirmed', 'Your order has been confirmed successfully. Payment will be processed after delivery.');
      }

      setUpdating(false);
    } catch (error) {
      console.error('Error confirming order:', error);
      Alert.alert('Error', 'Failed to confirm order. Please try again.');
      setUpdating(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    try {
      setUpdating(true);

      // Check if this order has a held payment that needs to be released back to the buyer
      if (order.holdTransactionId) {
        try {
          // Release the held funds back to the buyer
          await WalletService.releaseHeldBalance(
            order.userId, // buyer
            order.totalAmount, // amount
            `Refund for cancelled order #${order.id} - Order cancelled by seller`, // description
            order.id, // orderId
            order.holdTransactionId // holdTransactionId
          );

          console.log(`Successfully released held funds for order ${order.id}`);
        } catch (releaseError) {
          console.error('Error releasing held funds:', releaseError);
          Alert.alert(
            'Refund Error',
            'There was an error processing the refund. Please contact support.'
          );
          setUpdating(false);
          return;
        }
      }

      // Update order status
      await MarketplaceService.updateOrderStatus(orderId, 'cancelled');

      // Update the local order object
      setOrder({
        ...order,
        status: 'cancelled',
        trackingHistory: [
          ...(order.trackingHistory || []),
          {
            status: 'cancelled',
            timestamp: Date.now(),
            description: 'Order cancelled by seller'
          }
        ]
      });

      setSelectedStatus('cancelled');
      Alert.alert('Success', 'Order has been cancelled and payment has been refunded to the buyer');
      setUpdating(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
      setUpdating(false);
    }
  };

  // Auto-cancel old pending orders
  useEffect(() => {
    if (!order || order.status !== 'pending') return;

    // If order confirmation window has expired and it's not midnight, auto-cancel
    if (!isOrderRecent(order.createdAt) && !isMidnight()) {
      Alert.alert(
        isPrelistedProduct ? 'PRELISTED ORDER CONFIRMATION EXPIRED' : 'ORDER CONFIRMATION EXPIRED',
        isPrelistedProduct
          ? `This prelisted product order was placed more than 24 hours ago (on ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}) and has not been confirmed.\n\nAccording to the prelisted order policy, it must be cancelled.`
          : `This order was placed more than 3 hours ago (on ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}) and has not been confirmed.\n\nAccording to the order policy, it must be cancelled.`,
        [
          {
            text: 'Cancel Order Now',
            onPress: handleCancelOrder,
            style: 'destructive'
          }
        ]
      );
    }
  }, [order, isPrelistedProduct]);

  // Recalculate preparation deadline when order status, prelisted status, or harvest date changes
  useEffect(() => {
    if (!order) return;

    // Calculate preparation deadline if order is pending, confirmed, or processing
    if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') {
      const deadline = calculatePreparationDeadline(order.createdAt);
      setPreparationDeadline(deadline);
      setPreparationTimeRemaining(calculateRemainingTime(deadline));

      // Detailed logging for debugging
      console.log('---------------------------------------------');
      console.log(`RECALCULATED DEADLINE:`);
      console.log(`Order type: ${isPrelistedProduct ? 'PRELISTED PRODUCT' : 'REGULAR PRODUCT'}`);
      console.log(`Order status: ${order.status.toUpperCase()}`);
      console.log(`Has harvest date: ${harvestDate ? 'YES' : 'NO'}`);
      if (harvestDate) {
        console.log(`Harvest date: ${new Date(harvestDate).toLocaleString()}`);
      }
      console.log(`New deadline: ${deadline.toLocaleString()}`);
      console.log(`Time remaining: ${formatTimeRemaining(calculateRemainingTime(deadline))}`);
      console.log('---------------------------------------------');
    }
  }, [order?.status, isPrelistedProduct, harvestDate]);

  // Update preparation time remaining
  useEffect(() => {
    if (!order || (order.status !== 'pending' && order.status !== 'confirmed' && order.status !== 'processing') || !preparationDeadline) return;

    const timer = setInterval(() => {
      const remaining = calculateRemainingTime(preparationDeadline);
      setPreparationTimeRemaining(remaining);

      // Update progress animation
      const totalTime = preparationDeadline.getTime() - new Date(order.createdAt).getTime();
      const progress = 1 - (remaining / totalTime);
      Animated.timing(progressAnimation, {
        toValue: Math.min(1, Math.max(0, progress)),
        duration: 300,
        useNativeDriver: false,
        easing: Easing.linear
      }).start();

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order, preparationDeadline]);

  // Generate comprehensive traceability report for pre-listed products
  const generateTraceabilityReport = () => {
    if (!order || !isPrelistedProduct) {
      Alert.alert('Info', 'Traceability reports are only available for pre-listed products.');
      return;
    }

    // Extract traceability data from order items
    const traceabilityData = order.items.find((item: any) => item.traceabilityInfo);

    if (!traceabilityData?.traceabilityInfo) {
      Alert.alert('Info', 'No traceability data available for this order.');
      return;
    }

    const traceInfo = traceabilityData.traceabilityInfo;
    const currentDate = new Date().toLocaleDateString();
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'Not delivered yet';

    // Create comprehensive report with detailed farming data
    const reportContent = `
COMPREHENSIVE TRACEABILITY REPORT
=================================

Order Information:
- Order ID: ${order.id}
- Order Date: ${orderDate}
- Delivery Date: ${deliveryDate}
- Order Status: ${order.status.toUpperCase()}
- Report Generated: ${currentDate}

Crop Overview:
- Crop Name: ${traceInfo.cropName || 'N/A'}
- Variety: ${traceInfo.cropVariety || 'N/A'}
- Planting Date: ${traceInfo.plantingDate ? new Date(traceInfo.plantingDate).toLocaleDateString() : 'N/A'}
- Harvest Date: ${traceInfo.harvestDate ? new Date(traceInfo.harvestDate).toLocaleDateString() : 'N/A'}
- Expected Yield: ${traceInfo.expectedYield || 'N/A'} ${traceInfo.yieldUnit || ''}
- Crop Health: ${traceInfo.cropHealth || 'N/A'}
- Growing Method: ${traceInfo.qualityMetrics?.growingMethod || 'N/A'}

Farm Details:
- Farm Name: ${traceInfo.farmDetails?.farmName || 'N/A'}
- Farmer: ${traceInfo.farmerName || 'N/A'}
- Farm Location: ${traceInfo.farmDetails?.farmLocation || 'N/A'}
- Farming Method: ${traceInfo.farmDetails?.farmingMethod || 'N/A'}
- Farm Area: ${traceInfo.farmDetails?.area || 'N/A'} ${traceInfo.farmDetails?.areaUnit || ''}
- Soil Type: ${traceInfo.farmDetails?.soilType || 'N/A'}

DETAILED FERTILIZER APPLICATIONS:
${traceInfo.fertilizers && traceInfo.fertilizers.length > 0
  ? traceInfo.fertilizers.map((fert: any, index: number) => `
${index + 1}. FERTILIZER: ${fert.name || 'Unknown Fertilizer'}
   - Type: ${fert.type || 'N/A'}
   - Quantity Applied: ${fert.quantity || 'N/A'} ${fert.unit || ''}
   - Application Date: ${fert.applicationDate ? new Date(fert.applicationDate).toLocaleDateString() : 'N/A'}
   - Application Time: ${fert.applicationDate ? new Date(fert.applicationDate).toLocaleTimeString() : 'N/A'}
   - Application Method: ${fert.applicationMethod || 'N/A'}
   - Weather Conditions: ${fert.weatherConditions || 'N/A'}
   - Soil Moisture: ${fert.soilMoisture || 'N/A'}
   - Next Application Due: ${fert.nextApplication ? new Date(fert.nextApplication).toLocaleDateString() : 'N/A'}
   - Application Notes: ${fert.notes || 'No additional notes'}
   - Applied By: ${fert.appliedBy || 'N/A'}
   - Cost: ₹${fert.cost || 'N/A'}
   - Supplier: ${fert.supplier || 'N/A'}`).join('\n')
  : '- No fertilizer applications recorded in this crop cycle'}

DETAILED PESTICIDE APPLICATIONS:
${traceInfo.pesticides && traceInfo.pesticides.length > 0
  ? traceInfo.pesticides.map((pest: any, index: number) => `
${index + 1}. PESTICIDE: ${pest.name || 'Unknown Pesticide'}
   - Type: ${pest.type || 'N/A'}
   - Target Pest/Disease: ${pest.targetPest || 'N/A'}
   - Quantity Applied: ${pest.quantity || 'N/A'} ${pest.unit || ''}
   - Concentration: ${pest.concentration || 'N/A'}
   - Application Date: ${pest.applicationDate ? new Date(pest.applicationDate).toLocaleDateString() : 'N/A'}
   - Application Time: ${pest.applicationDate ? new Date(pest.applicationDate).toLocaleTimeString() : 'N/A'}
   - Application Method: ${pest.applicationMethod || 'N/A'}
   - Weather Conditions: ${pest.weatherConditions || 'N/A'}
   - Wind Speed: ${pest.windSpeed || 'N/A'}
   - Temperature: ${pest.temperature || 'N/A'}
   - Pre-Harvest Interval: ${pest.preHarvestInterval || 'N/A'} days
   - Next Application Due: ${pest.nextApplication ? new Date(pest.nextApplication).toLocaleDateString() : 'N/A'}
   - Safety Precautions: ${pest.safetyPrecautions || 'Standard safety measures'}
   - Application Notes: ${pest.notes || 'No additional notes'}
   - Applied By: ${pest.appliedBy || 'N/A'}
   - Cost: ₹${pest.cost || 'N/A'}
   - Supplier: ${pest.supplier || 'N/A'}`).join('\n')
  : '- No pesticide applications recorded in this crop cycle'}

DETAILED IRRIGATION SCHEDULE:
${traceInfo.irrigationSchedule && traceInfo.irrigationSchedule.length > 0
  ? traceInfo.irrigationSchedule.map((irr: any, index: number) => `
${index + 1}. IRRIGATION SESSION
   - Date: ${irr.date ? new Date(irr.date).toLocaleDateString() : 'N/A'}
   - Start Time: ${irr.startTime || 'N/A'}
   - End Time: ${irr.endTime || 'N/A'}
   - Duration: ${irr.duration || 'N/A'}
   - Water Source: ${irr.waterSource || 'N/A'}
   - Irrigation Method: ${irr.method || 'N/A'}
   - Water Quantity: ${irr.waterQuantity || 'N/A'} ${irr.waterUnit || 'liters'}
   - Soil Moisture Before: ${irr.soilMoistureBefore || 'N/A'}%
   - Soil Moisture After: ${irr.soilMoistureAfter || 'N/A'}%
   - Weather Conditions: ${irr.weatherConditions || 'N/A'}
   - Temperature: ${irr.temperature || 'N/A'}°C
   - Humidity: ${irr.humidity || 'N/A'}%
   - Status: ${irr.status || 'Completed'}
   - Water Quality: ${irr.waterQuality || 'N/A'}
   - Pressure: ${irr.pressure || 'N/A'} PSI
   - Flow Rate: ${irr.flowRate || 'N/A'} L/min
   - Notes: ${irr.notes || 'No additional notes'}
   - Operator: ${irr.operator || 'N/A'}`).join('\n')
  : '- No irrigation schedule recorded for this crop cycle'}

COMPLETE PRODUCT JOURNEY:
${traceInfo.productJourney?.stages && traceInfo.productJourney.stages.length > 0
  ? traceInfo.productJourney.stages.map((stage: any, index: number) => `
${index + 1}. STAGE: ${stage.stageName || 'Unknown Stage'}
   - Date & Time: ${stage.timestamp ? new Date(stage.timestamp).toLocaleString() : 'N/A'}
   - Location: ${stage.location?.address || 'N/A'}
   - GPS Coordinates: ${stage.location?.latitude && stage.location?.longitude ? `${stage.location.latitude}, ${stage.location.longitude}` : 'N/A'}
   - Handled By: ${stage.handledBy || 'N/A'}
   - Handler Contact: ${stage.handlerContact || 'N/A'}
   - Temperature: ${stage.temperature || 'N/A'}°C
   - Humidity: ${stage.humidity || 'N/A'}%
   - Storage Conditions: ${stage.storageConditions || 'N/A'}
   - Quality Check: ${stage.qualityCheck || 'N/A'}
   - Batch Number: ${stage.batchNumber || 'N/A'}
   - Vehicle/Container ID: ${stage.vehicleId || 'N/A'}
   - Description: ${stage.description || 'No additional details'}
   - Photos Available: ${stage.imageUrl ? 'Yes' : 'No'}`).join('\n')
  : '- No detailed product journey stages recorded'}

QUALITY METRICS & CERTIFICATIONS:
- Overall Health Score: ${traceInfo.qualityMetrics?.healthScore || 'N/A'}%
- Organic Certified: ${traceInfo.qualityMetrics?.organicCertified ? 'Yes' : 'No'}
- Growing Method: ${traceInfo.qualityMetrics?.growingMethod || 'N/A'}
- Pesticide Residue Test: ${traceInfo.qualityMetrics?.pesticideResidueTest || 'N/A'}
- Heavy Metal Test: ${traceInfo.qualityMetrics?.heavyMetalTest || 'N/A'}
- Microbiological Test: ${traceInfo.qualityMetrics?.microbiologicalTest || 'N/A'}
- Nutritional Analysis: ${traceInfo.qualityMetrics?.nutritionalAnalysis || 'N/A'}
- Shelf Life: ${traceInfo.qualityMetrics?.shelfLife || 'N/A'} days
- Storage Requirements: ${traceInfo.qualityMetrics?.storageRequirements || 'N/A'}

BUYER INFORMATION:
- Buyer Name: ${order.buyerName || order.shippingAddress?.name || 'N/A'}
- Contact Number: ${order.shippingAddress?.phone || 'N/A'}
- Delivery Address: ${order.shippingAddress ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}` : 'N/A'}

ORDER SUMMARY:
- Total Amount: ₹${order.totalAmount || 'N/A'}
- Quantity Ordered: ${order.items[0]?.quantity || 'N/A'} ${order.items[0]?.stockUnit || order.items[0]?.unit || ''}
- Product Price: ₹${order.items[0]?.price || 'N/A'} per ${order.items[0]?.stockUnit || order.items[0]?.unit || 'unit'}
- Payment Method: ${order.paymentMethod || 'N/A'}
- Payment Status: ${order.paymentStatus || 'N/A'}

REGULATORY COMPLIANCE:
- Food Safety Standards: ${traceInfo.compliance?.foodSafety || 'N/A'}
- Traceability Standards: ${traceInfo.compliance?.traceability || 'ISO 22005:2007'}
- Organic Standards: ${traceInfo.compliance?.organic || 'N/A'}
- Export Standards: ${traceInfo.compliance?.export || 'N/A'}

=================================
CERTIFICATION STATEMENT:
This comprehensive traceability report certifies the complete farm-to-consumer journey of the agricultural product. All farming practices, inputs used, and handling procedures have been documented in accordance with international traceability standards.

Report Generated: ${currentDate}
Generated By: Ankrishi Marketplace Traceability System
Digital Signature: ${order.id}-${Date.now()}
=================================
    `;

    // Show the report in an alert (in a real app, you might want to export as PDF or share)
    Alert.alert(
      'Traceability Report Generated',
      'The comprehensive traceability report has been generated. In a production app, this would be exported as a PDF or shared with relevant parties.',
      [
        {
          text: 'View Report',
          onPress: () => {
            // In a real app, you would navigate to a detailed report screen or export as PDF
            console.log('TRACEABILITY REPORT:\n', reportContent);
            Alert.alert('Report Content', reportContent.substring(0, 1000) + '...\n\n(Full report logged to console)');
          }
        },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  // Load order data
  const loadOrderData = async () => {
    try {
      setLoading(true);

      // Fetch the order from the database
      const orderData = await MarketplaceService.getOrder(orderId);

      if (orderData) {
        // Verify that the current user is the seller
        if (orderData.sellerId !== userProfile?.uid) {
          Alert.alert('Access Denied', 'You can only manage orders that you sold.');
          navigation.goBack();
          return;
        }

        // Check if this is a prelisted product order by examining the items
        // Initialize variables to track prelisted product status
        let isPrelistedOrder = false;
        let harvestDateFromProduct = null;

        // First check if any items have the isPrelisted flag directly
        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            if (item.isPrelisted) {
              isPrelistedOrder = true;

              // Look for harvest date in multiple possible locations within the item
              if (item.harvestDate) {
                harvestDateFromProduct = item.harvestDate;
                console.log('Found harvest date directly in item:', new Date(item.harvestDate).toLocaleDateString());
                break;
              }
              // Check in farmDetails
              else if (item.farmDetails && item.farmDetails.harvestDate) {
                harvestDateFromProduct = item.farmDetails.harvestDate;
                console.log('Found harvest date in item.farmDetails:', new Date(item.farmDetails.harvestDate).toLocaleDateString());
                break;
              }
              // Check in traceabilityInfo
              else if (item.traceabilityInfo && item.traceabilityInfo.harvestDate) {
                harvestDateFromProduct = item.traceabilityInfo.harvestDate;
                console.log('Found harvest date in item.traceabilityInfo:', new Date(item.traceabilityInfo.harvestDate).toLocaleDateString());
                break;
              }
            }
          }

          // If we didn't find any prelisted items with the flag, try fetching product details
          if (!isPrelistedOrder) {
            for (const item of orderData.items) {
              // If the item has a productId, fetch the product details
              if (item.productId) {
                try {
                  // Try to get the product from both regular and prelisted products
                  const productData = await MarketplaceService.getProduct(item.productId);

                  if (productData && productData.isPrelisted) {
                    isPrelistedOrder = true;
                    console.log('Found prelisted product from database');

                    // Look for harvest date in multiple possible locations
                    // First check in farmDetails
                    if (productData.farmDetails && productData.farmDetails.harvestDate) {
                      harvestDateFromProduct = productData.farmDetails.harvestDate;
                      console.log('Found harvest date in farmDetails:', new Date(productData.farmDetails.harvestDate).toLocaleDateString());
                    }
                    // Then check in traceabilityInfo if not found in farmDetails
                    else if (productData.traceabilityInfo && productData.traceabilityInfo.harvestDate) {
                      harvestDateFromProduct = productData.traceabilityInfo.harvestDate;
                      console.log('Found harvest date in traceabilityInfo:', new Date(productData.traceabilityInfo.harvestDate).toLocaleDateString());
                    }
                    // Log if no harvest date found
                    else {
                      console.log('No harvest date found for prelisted product. Product data:', JSON.stringify(productData, null, 2));
                    }

                    // We found a prelisted product, no need to check further
                    break;
                  }
                } catch (error) {
                  console.error('Error fetching product details:', error);
                }
              }
            }
          }
        }

        // Update state with prelisted product information
        setIsPrelistedProduct(isPrelistedOrder);
        setHarvestDate(harvestDateFromProduct);

        setOrder(orderData);
        setSelectedStatus(orderData.status as OrderStatus);

        // Set available status options based on current order status
        const availableOptions = getAvailableStatusOptions(orderData.status as OrderStatus);
        setStatusOptions(availableOptions);

        // Calculate preparation deadline if order is pending, confirmed, or processing
        if (orderData.status === 'pending' || orderData.status === 'confirmed' || orderData.status === 'processing') {
          const deadline = calculatePreparationDeadline(orderData.createdAt);
          setPreparationDeadline(deadline);
          setPreparationTimeRemaining(calculateRemainingTime(deadline));
        }
      } else {
        Alert.alert('Error', 'Order not found.');
        navigation.goBack();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order data. Please try again.');
      setLoading(false);
      navigation.goBack();
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedStatus || selectedStatus === order.status) return;

    try {
      setUpdating(true);

      // Update the order status in the database
      await MarketplaceService.updateOrderStatus(orderId, selectedStatus);

      // Update the local order object
      setOrder({
        ...order,
        status: selectedStatus,
        trackingHistory: [
          ...(order.trackingHistory || []),
          {
            status: selectedStatus,
            timestamp: Date.now(),
            description: `Order ${getStatusText(selectedStatus)}`
          }
        ]
      });

      // Recalculate preparation deadline for confirmed and processing statuses
      if (selectedStatus === 'confirmed' || selectedStatus === 'processing') {
        const deadline = calculatePreparationDeadline(order.createdAt);
        setPreparationDeadline(deadline);
        setPreparationTimeRemaining(calculateRemainingTime(deadline));

        // Detailed logging for prelisted orders
        if (isPrelistedProduct) {
          console.log('---------------------------------------------');
          console.log(`PRELISTED ORDER STATUS UPDATED TO: ${selectedStatus.toUpperCase()}`);
          if (harvestDate) {
            console.log(`Harvest date: ${new Date(harvestDate).toLocaleDateString()}`);
            console.log(`Delivery scheduled for: 5:00 PM on ${new Date(harvestDate).toLocaleDateString()}`);
          } else {
            console.log('No harvest date found for this prelisted order');
          }
          console.log(`New preparation deadline: ${deadline.toLocaleString()}`);
          console.log('---------------------------------------------');
        }
      }

      // Update status options based on the new status
      const newOptions = getAvailableStatusOptions(selectedStatus);
      setStatusOptions(newOptions);

      Alert.alert('Success', `Order status updated to ${getStatusText(selectedStatus)}`);
      setUpdating(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
      setUpdating(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';

    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate subtotal from items
  const calculateSubtotal = (items: any[] | undefined) => {
    if (!items || !Array.isArray(items)) {
      return 0;
    }

    return items.reduce((total, item) => {
      // Use totalPrice, total, or calculate from price * quantity
      const itemTotal = item.totalPrice || item.total || (item.price * item.quantity) || 0;
      return total + itemTotal;
    }, 0);
  };

  // Get status text
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'processing':
        return colors.info;
      case 'out_for_delivery':
        return colors.secondary;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'returned':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Management</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Order Info Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Information</Text>
          </View>

          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{order.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>

            {/* Preparation Time (shown for pending, confirmed, and processing orders) */}
            {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') && preparationTimeRemaining !== null && preparationDeadline && (
              <View style={styles.preparationTimeContainer}>
                <View style={styles.preparationTimeHeader}>
                  <Ionicons name="time-outline" size={20} color={colors.warning} />
                  <Text style={styles.preparationTimeTitle}>
                    {isPrelistedProduct ? "Prelisted Product Order" : "Order Preparation Time"}
                  </Text>
                </View>

                {isPrelistedProduct && (
                  <View style={styles.prelistedInfoContainer}>
                    <Text style={[styles.prelistedInfoText, {fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.primary}]}>
                      PRELISTED PRODUCT ORDER
                    </Text>

                    {harvestDate ? (
                      <>
                        <Text style={styles.prelistedInfoText}>
                          {order.status === 'pending' ? (
                            "You have EXACTLY 24 HOURS from order placement to confirm this prelisted order. " +
                            "After 24 hours, unconfirmed orders will be automatically cancelled.\n\n" +
                            "Once confirmed, delivery will be scheduled for 5:00 PM on the harvest date."
                          ) : order.status === 'confirmed' ? (
                            "This prelisted order has been CONFIRMED. " +
                            "The product will be prepared for delivery at 5:00 PM on the harvest date."
                          ) : order.status === 'processing' ? (
                            "This prelisted order is being PROCESSED. " +
                            "The product is being prepared for delivery at 5:00 PM on the harvest date."
                          ) : (
                            "This is a prelisted product order with a scheduled harvest date. " +
                            "Delivery is scheduled for 5:00 PM on the harvest date."
                          )}
                        </Text>

                        <View style={[styles.harvestDateContainer, {marginTop: 12, backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8}]}>
                          <Ionicons name="calendar" size={20} color={colors.primary} />
                          <Text style={[styles.harvestDateText, {fontSize: 16, marginLeft: 8}]}>
                            Harvest Date: {new Date(harvestDate).toLocaleDateString()}
                          </Text>
                        </View>

                        {order.status === 'pending' && (
                          <View style={{marginTop: 12, backgroundColor: colors.warning + '20', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.warning}}>
                            <Text style={{color: colors.warning, fontWeight: 'bold'}}>
                              Confirmation Deadline: {new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={styles.prelistedInfoText}>
                        This is a prelisted product order. You have exactly 24 hours from order placement to confirm this order.
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.preparationTimeInfo}>
                  <Text style={[styles.preparationTimeText, {fontWeight: 'bold'}]}>
                    {/* PRELISTED PRODUCT HANDLING */}
                    {isPrelistedProduct ? (
                      harvestDate ? (
                        order.status === 'pending' ? (
                          // Pending prelisted order with harvest date
                          `CONFIRM WITHIN: 24 hours (by ${new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString()})`
                        ) : order.status === 'confirmed' || order.status === 'processing' ? (
                          // Confirmed/processing prelisted order with harvest date
                          (() => {
                            const now = new Date();
                            const harvestDay = new Date(harvestDate);
                            const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const harvestDayOnly = new Date(harvestDay.getFullYear(), harvestDay.getMonth(), harvestDay.getDate());
                            const daysUntilHarvest = Math.ceil((harvestDayOnly.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

                            if (daysUntilHarvest < 0) {
                              return `DELIVERY WAS SCHEDULED FOR: 5:00 PM on ${new Date(harvestDate).toLocaleDateString()}`;
                            } else if (daysUntilHarvest === 0) {
                              return `DELIVERY SCHEDULED: TODAY at 5:00 PM`;
                            } else if (daysUntilHarvest === 1) {
                              return `DELIVERY SCHEDULED: TOMORROW at 5:00 PM`;
                            } else {
                              return `DELIVERY SCHEDULED: ${new Date(harvestDate).toLocaleDateString()} at 5:00 PM (in ${daysUntilHarvest} days)`;
                            }
                          })()
                        ) : (
                          // Other status prelisted order with harvest date
                          `DELIVERY SCHEDULED: ${new Date(harvestDate).toLocaleDateString()} at 5:00 PM`
                        )
                      ) : (
                        // Prelisted order without harvest date
                        order.status === 'pending' ? (
                          `CONFIRM WITHIN: 24 hours (by ${new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString()})`
                        ) : (
                          `ORDER STATUS: ${order.status.toUpperCase()}`
                        )
                      )
                    ) : (
                      /* REGULAR PRODUCT HANDLING */
                      order.status === 'confirmed' || order.status === 'processing' ? (
                        `PREPARING FOR DELIVERY BY: ${preparationDeadline.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} on ${preparationDeadline.toLocaleDateString()}`
                      ) : (
                        `PREPARE BY: ${preparationDeadline.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} on ${preparationDeadline.toLocaleDateString()}`
                      )
                    )}
                  </Text>
                  <Text style={styles.preparationTimeRemaining}>
                    {formatTimeRemaining(preparationTimeRemaining)}
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground} />
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]}
                  />
                </View>

                {/* Action buttons for recent pending orders */}
                {isOrderRecent(order.createdAt) && order.status === 'pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <Button
                      title={isPrelistedProduct ? "CONFIRM PRELISTED ORDER" : "Confirm Order"}
                      onPress={handleConfirmOrder}
                      disabled={updating}
                      loading={updating}
                      style={[styles.confirmButton, isPrelistedProduct && {backgroundColor: colors.primary, paddingVertical: 12}]}
                      leftIcon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
                    />
                    <Button
                      title={isPrelistedProduct ? "CANCEL PRELISTED ORDER" : "Cancel Order"}
                      onPress={handleCancelOrder}
                      disabled={updating}
                      variant="outline"
                      style={[styles.cancelButton, isPrelistedProduct && {borderWidth: 2, paddingVertical: 12}]}
                      leftIcon={<Ionicons name="close-circle" size={20} color={colors.error} />}
                    />
                  </View>
                )}

                {/* Message for expired confirmation window */}
                {!isOrderRecent(order.createdAt) && order.status === 'pending' && (
                  <View style={[styles.expiredConfirmationContainer, {backgroundColor: colors.error + '15', borderWidth: 2, borderColor: colors.error}]}>
                    <Ionicons name="alert-circle" size={28} color={colors.error} />
                    <View style={{flex: 1, marginLeft: 10}}>
                      <Text style={{color: colors.error, fontWeight: 'bold', fontSize: 16, marginBottom: 5}}>
                        CONFIRMATION WINDOW EXPIRED
                      </Text>
                      <Text style={{color: colors.error}}>
                        {isPrelistedProduct
                          ? `The 24-hour confirmation window for this prelisted order has expired. It was placed on ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}.\n\nThis order will be automatically cancelled according to the prelisted order policy.`
                          : `The 3-hour confirmation window for this order has expired. It was placed on ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}.\n\nThis order will be automatically cancelled according to the order policy.`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* Customer Info Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>

          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{order.shippingAddress?.name || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{order.shippingAddress?.phone || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {order.shippingAddress?.address || 'N/A'},
                {order.shippingAddress?.city || ''},
                {order.shippingAddress?.state || ''} -
                {order.shippingAddress?.pincode || ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Order Items Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Items</Text>
          </View>

          <View style={styles.itemsContainer}>
            {order.items.map((item: any, index: number) => (
              <View key={item.id || `item-${index}`} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.productName || 'Product'}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(item.total || item.totalPrice || (item.price * item.quantity) || 0)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.subtotal || order.totalAmount || calculateSubtotal(order.items))}</Text>
            </View>

            {/* Show shipping fee if available */}
            {(order.shippingFee !== undefined && order.shippingFee > 0) ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping Fee</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.shippingFee)}</Text>
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(order.total || order.totalAmount)}</Text>
            </View>
          </View>
        </Card>

        {/* Status Update Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sync-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Update Order Status</Text>
          </View>

          {statusOptions.length > 0 ? (
            <>
              <Text style={styles.statusUpdateText}>
                {order.status === 'pending' ? 'Confirm this order:' :
                 order.status === 'confirmed' ? 'Mark this order as processing:' :
                 `Select a new status for this order:`}
              </Text>

              <View style={styles.statusOptions}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      selectedStatus === status && styles.selectedStatusOption,
                    ]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[
                      styles.statusOptionText,
                      selectedStatus === status && styles.selectedStatusText,
                    ]}>
                      {getStatusText(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title={order.status === 'pending' ? 'Confirm Order' :
                       order.status === 'confirmed' ? 'Start Processing' :
                       'Update Status'}
                onPress={updateOrderStatus}
                disabled={updating || selectedStatus === order.status}
                loading={updating}
                style={styles.updateButton}
              />
            </>
          ) : (
            <View style={styles.noOptionsContainer}>
              {order.status === 'processing' ? (
                <>
                  <Ionicons name="lock-closed" size={40} color={colors.info} />
                  <Text style={[styles.noOptionsTitle, { color: colors.info }]}>Processing in Progress</Text>
                  <Text style={styles.noOptionsText}>
                    This order is being processed. The status cannot be changed manually after this stage.
                    The delivery system will automatically update the status as the order progresses.
                  </Text>
                </>
              ) : order.status === 'delivered' ? (
                <>
                  <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                  <Text style={styles.noOptionsTitle}>Order Complete</Text>
                  <Text style={styles.noOptionsText}>
                    This order has been delivered successfully. No further status updates are needed.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="information-circle" size={40} color={colors.secondary} />
                  <Text style={[styles.noOptionsTitle, { color: colors.secondary }]}>Status Locked</Text>
                  <Text style={styles.noOptionsText}>
                    This order is currently {getStatusText(order.status).toLowerCase()}.
                    The status cannot be changed manually at this stage.
                  </Text>
                </>
              )}
            </View>
          )}
        </Card>

        {/* Traceability Report Button for Pre-listed Products */}
        {isPrelistedProduct && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Product Traceability</Text>
            </View>

            <Text style={styles.traceabilityDescription}>
              Generate a comprehensive traceability report that includes complete farm-to-consumer journey,
              fertilizer and pesticide applications, irrigation details, and quality metrics.
            </Text>

            <Button
              title="Generate Traceability Report"
              onPress={generateTraceabilityReport}
              style={styles.traceabilityButton}
              leftIcon={<Ionicons name="document-text" size={20} color={colors.white} />}
            />
          </Card>
        )}

        <View style={styles.bottomSpacing} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 3,
    maxWidth: 370,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    marginHorizontal: -spacing.sm,
    marginTop: -spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  orderInfo: {
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  customerInfo: {
    marginBottom: spacing.sm,
  },
  deliveryPartnerInfo: {
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  itemsContainer: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  totalContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  grandTotalLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  statusUpdateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statusOptions: {
    marginBottom: spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  selectedStatusOption: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.primary,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  statusOptionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  selectedStatusText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  updateButton: {
    marginTop: spacing.md,
  },
  noOptionsContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  noOptionsTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  noOptionsText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },
  // Preparation time styles
  preparationTimeContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.warning + '10', // 10% opacity
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30', // 30% opacity
  },
  preparationTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  preparationTimeTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.warning,
    marginLeft: spacing.xs,
  },
  preparationTimeInfo: {
    marginBottom: spacing.sm,
  },
  preparationTimeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  preparationTimeRemaining: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.warning,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.lightGray,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.error,
  },
  // Prelisted product styles
  prelistedInfoContainer: {
    backgroundColor: colors.primary + '10', // 10% opacity
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary + '50', // 50% opacity
  },
  prelistedInfoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  harvestDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  harvestDateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  expiredConfirmationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10', // 10% opacity
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30', // 30% opacity
  },
  expiredConfirmationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  // Traceability styles
  traceabilityDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  traceabilityButton: {
    backgroundColor: colors.primary,
  },
});

export default OrderManagementScreen;
