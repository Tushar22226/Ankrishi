import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Linking } from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingQuote from '../../components/LoadingQuote';
import RateOrderModal from '../../components/RateOrderModal';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import MarketplaceService from '../../services/MarketplaceService';
import ReceiptService from '../../services/ReceiptService';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
// We'll use a simple function to generate unique IDs instead of uuid
import * as FileSystem from 'expo-file-system';

// Order status type
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered';

// Simple function to generate a unique ID
const generateUniqueId = () => {
  return Date.now().toString() + Math.floor(Math.random() * 10000).toString();
};

// Mock order data
const mockOrder = {
  id: 'ORD123456',
  status: 'confirmed' as OrderStatus,
  createdAt: new Date().getTime() - 86400000, // 1 day ago
  estimatedDelivery: new Date().getTime() + 86400000 * 3, // 3 days from now
  trackingHistory: [
    {
      status: 'pending',
      timestamp: new Date().getTime() - 86400000, // 1 day ago
      description: 'Order placed successfully',
    },
    {
      status: 'confirmed',
      timestamp: new Date().getTime() - 43200000, // 12 hours ago
      description: 'Order confirmed by seller',
    },
  ],
  shippingAddress: {
    name: 'John Doe',
    phone: '+91 9876543210',
    address: '123 Main Street, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  },
  paymentMethod: 'Cash on Delivery',
  items: [
    {
      id: '1',
      name: 'NPK Fertilizer',
      quantity: 2,
      price: 450,
      total: 900,
    },
  ],
  subtotal: 900,
  shippingFee: 50,
  total: 950,
};

const OrderTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get params from route
  const { orderId } = route.params as { orderId: string };

  // State
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading order details...');
  const [order, setOrder] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [productDetails, setProductDetails] = useState<any>(null);
  const [traceabilityLoading, setTraceabilityLoading] = useState(false);
  const [estimatedDeliveryText, setEstimatedDeliveryText] = useState('Loading...');
  const [deliveryTextCalculated, setDeliveryTextCalculated] = useState(false);
  const [productCache, setProductCache] = useState<{[key: string]: any}>({});
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Load order data
  useEffect(() => {
    loadOrderData();

    // Safety timeout to ensure loading state is never stuck
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout triggered - forcing loading to false');
      setLoading(false);
    }, 15000); // 15 seconds safety timeout

    return () => clearTimeout(safetyTimeout);
  }, []);

  // Load order data
  const loadOrderData = async () => {
    console.log('Starting to load order data for orderId:', orderId);

    try {
      setLoading(true);
      setLoadingMessage('Connecting to database...');

      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database request timeout')), 10000); // 10 second timeout
      });

      // Try to fetch the order from the database using MarketplaceService
      try {
        console.log('Attempting to fetch order from database...');
        setLoadingMessage('Fetching order details...');

        // Race between the actual request and timeout
        const orderData = await Promise.race([
          MarketplaceService.getOrder(orderId),
          timeoutPromise
        ]) as any;

        console.log('Database fetch result:', orderData ? 'Order found' : 'Order not found');

        if (orderData) {
          setLoadingMessage('Processing order data...');

          // Ensure required properties exist with defaults
          const completeOrderData = {
            ...orderData,
            // Add trackingInfo.trackingHistory if it doesn't exist
            trackingInfo: {
              ...(orderData.trackingInfo || {}),
              trackingHistory: orderData.trackingInfo?.trackingHistory ||
                               (orderData as any).trackingHistory || []
            }
          };
          setOrder(completeOrderData);

          // Get estimated delivery text with timeout (only if not already calculated)
          if (!deliveryTextCalculated) {
            try {
              console.log('Getting estimated delivery text...');
              setLoadingMessage('Calculating delivery estimates...');

              // Use a simpler delivery text calculation to avoid infinite loops
              const deliveryText = getSimpleDeliveryText(completeOrderData);
              setEstimatedDeliveryText(deliveryText);
              setDeliveryTextCalculated(true);
            } catch (error) {
              console.error('Error getting estimated delivery text:', error);
              setEstimatedDeliveryText('Estimated delivery date unavailable');
              setDeliveryTextCalculated(true);
            }
          }

          console.log('Order data loaded successfully from database');
          setLoading(false);
          return;
        }
      } catch (dbError) {
        console.error('Error fetching order from database:', dbError);
        console.log('Database fetch failed, will use mock data');
        setLoadingMessage('Loading sample data...');
      }

      // Fallback to mock data if database fetch fails
      console.log('Using mock order data for order ID:', orderId);

      // Create a complete order object with all required properties
      const orderData = {
        ...mockOrder,
        id: orderId,
        // Ensure trackingInfo.trackingHistory exists
        trackingInfo: {
          trackingHistory: (mockOrder as any).trackingHistory || []
        }
      };

      setOrder(orderData);

      // Set simple delivery text for mock data
      if (!deliveryTextCalculated) {
        const deliveryText = getSimpleDeliveryText(orderData);
        setEstimatedDeliveryText(deliveryText);
        setDeliveryTextCalculated(true);
      }

      console.log('Mock order data loaded successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error loading order data:', error);
      console.log('Setting loading to false due to error');
      setLoadingMessage('Error loading order details');
      setLoading(false);
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
        return colors.primary;
      case 'delivered':
        return colors.success;
      default:
        return colors.mediumGray;
    }
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
      default:
        return 'Unknown';
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Simple delivery text calculation without async operations
  const getSimpleDeliveryText = (order: any) => {
    console.log('Getting simple delivery text for order:', order?.id);

    if (!order) {
      return 'Unknown';
    }

    // For delivered orders, show the actual delivery date
    if (order.status === 'delivered' && order.deliveredAt) {
      return `Delivered on ${formatDate(order.deliveredAt)}`;
    }

    // For cancelled or returned orders
    if (order.status === 'cancelled' || order.status === 'returned') {
      return 'Not applicable';
    }

    // For regular pending or confirmed orders, calculate based on time of day
    if (order.status === 'pending' || order.status === 'confirmed') {
      try {
        const orderDate = new Date(order.createdAt);
        const orderHour = orderDate.getHours();
        const tomorrow = new Date(orderDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Format tomorrow's date
        const tomorrowDate = tomorrow.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        });

        // Morning/midnight orders (12am-12pm): Deliver tomorrow evening
        if (orderHour >= 0 && orderHour < 12) {
          return `Expected by ${tomorrowDate} evening (5pm-8pm)`;
        }
        // Evening/noon orders (12pm-12am): Deliver tomorrow morning
        else {
          return `Expected by ${tomorrowDate} morning (8am-11am)`;
        }
      } catch (error) {
        console.error('Error calculating delivery date:', error);
        return 'Estimated delivery date unavailable';
      }
    }

    // For processing or out_for_delivery orders, use the existing estimatedDelivery if available
    if (order.estimatedDelivery) {
      try {
        return `Estimated Delivery: ${formatDate(order.estimatedDelivery)}`;
      } catch (error) {
        console.error('Error formatting estimated delivery:', error);
      }
    }

    return 'Estimated delivery date unavailable';
  };

  // Check if an order contains prelisted products
  const isPrelistedProductOrder = async (order: any) => {
    if (!order || !order.items || order.items.length === 0) {
      console.log('No order items found');
      return { isPrelisted: false, harvestDate: null };
    }

    // Check each item in the order
    for (const item of order.items) {
      try {
        console.log('Checking product:', item.productId);

        // Check cache first
        let productData = productCache[item.productId];

        if (!productData) {
          console.log('Product not in cache, fetching from database...');

          // Add timeout for product fetching
          const productPromise = MarketplaceService.getProduct(item.productId);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Product fetch timeout')), 5000);
          });

          // Fetch the product details with timeout
          productData = await Promise.race([productPromise, timeoutPromise]) as any;

          // Cache the result
          if (productData) {
            setProductCache(prev => ({
              ...prev,
              [item.productId]: productData
            }));
          }
        } else {
          console.log('Using cached product data for:', item.productId);
        }

        // Check if this is a prelisted product
        if (productData && productData.isPrelisted) {
          console.log('Found prelisted product:', productData.name);

          // Look for harvest date in multiple possible locations
          let harvestDate = null;

          // First check in farmDetails
          if (productData.farmDetails && productData.farmDetails.harvestDate) {
            harvestDate = productData.farmDetails.harvestDate;
            console.log('Found harvest date in farmDetails:', new Date(harvestDate).toLocaleDateString());
          }
          // Then check in traceabilityInfo if not found in farmDetails
          else if (productData.traceabilityInfo && productData.traceabilityInfo.harvestDate) {
            harvestDate = productData.traceabilityInfo.harvestDate;
            console.log('Found harvest date in traceabilityInfo:', new Date(harvestDate).toLocaleDateString());
          }

          return {
            isPrelisted: true,
            harvestDate: harvestDate
          };
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        // Continue checking other items even if one fails
      }
    }

    console.log('No prelisted products found in order');
    return { isPrelisted: false, harvestDate: null };
  };

  // Calculate and format estimated delivery time based on order status and time of day
  const getEstimatedDeliveryText = async (order: any) => {
    console.log('Getting estimated delivery text for order:', order?.id);

    // Prevent multiple simultaneous calls
    if (calculatingDelivery) {
      console.log('Already calculating delivery text, skipping...');
      return estimatedDeliveryText;
    }

    setCalculatingDelivery(true);

    if (!order) {
      console.log('No order provided');
      setCalculatingDelivery(false);
      return 'Unknown';
    }

    // For delivered orders, show the actual delivery date
    if (order.status === 'delivered' && order.deliveredAt) {
      console.log('Order is delivered');
      setCalculatingDelivery(false);
      return `Delivered on ${formatDate(order.deliveredAt)}`;
    }

    // For cancelled or returned orders
    if (order.status === 'cancelled' || order.status === 'returned') {
      console.log('Order is cancelled or returned');
      setCalculatingDelivery(false);
      return 'Not applicable';
    }

    // Check if this is a prelisted product order with fallback
    let isPrelisted = false;
    let harvestDate = null;

    try {
      console.log('Checking for prelisted products...');
      const result = await isPrelistedProductOrder(order);
      isPrelisted = result.isPrelisted;
      harvestDate = result.harvestDate;
      console.log('Prelisted check result:', { isPrelisted, harvestDate });
    } catch (error) {
      console.error('Error checking prelisted products:', error);
      // Continue with regular delivery estimation
    }

    // For prelisted products with confirmed status, use harvest date for delivery estimation
    if (isPrelisted && harvestDate && (order.status === 'confirmed' || order.status === 'processing' || order.status === 'out_for_delivery')) {
      try {
        const harvestDay = new Date(harvestDate);
        const harvestDateFormatted = harvestDay.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        });

        // Add debug logging
        console.log(`Prelisted product with harvest date: ${new Date(harvestDate).toLocaleDateString()}`);
        console.log(`Setting delivery time to: ${harvestDateFormatted} evening (5pm-8pm)`);

        setCalculatingDelivery(false);
        return `Expected by ${harvestDateFormatted} evening (5pm-8pm)`;
      } catch (error) {
        console.error('Error formatting harvest date:', error);
        // Fall through to regular delivery estimation
      }
    }

    // For regular pending or confirmed orders, calculate based on time of day
    if (order.status === 'pending' || order.status === 'confirmed') {
      try {
        console.log('Calculating delivery for pending/confirmed order');
        const orderDate = new Date(order.createdAt);
        const orderHour = orderDate.getHours();
        const tomorrow = new Date(orderDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Format tomorrow's date
        const tomorrowDate = tomorrow.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        });

        // Morning/midnight orders (12am-12pm): Deliver tomorrow evening
        if (orderHour >= 0 && orderHour < 12) {
          setCalculatingDelivery(false);
          return `Expected by ${tomorrowDate} evening (5pm-8pm)`;
        }
        // Evening/noon orders (12pm-12am): Deliver tomorrow morning
        else {
          setCalculatingDelivery(false);
          return `Expected by ${tomorrowDate} morning (8am-11am)`;
        }
      } catch (error) {
        console.error('Error calculating delivery date:', error);
        // Fall through to default
      }
    }

    // For processing or out_for_delivery orders, use the existing estimatedDelivery if available
    if (order.estimatedDelivery) {
      try {
        setCalculatingDelivery(false);
        return `Estimated Delivery: ${formatDate(order.estimatedDelivery)}`;
      } catch (error) {
        console.error('Error formatting estimated delivery:', error);
      }
    }

    console.log('Using fallback delivery text');
    setCalculatingDelivery(false);
    return 'Estimated delivery date unavailable';
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Share receipt
  const shareReceipt = async () => {
    try {
      if (!order) return;

      // Set loading state
      setReceiptLoading(true);

      try {
        // Try to share receipt
        await ReceiptService.shareReceipt(order);
      } catch (shareError) {
        console.log('Sharing failed, falling back to alert:', shareError);
        // Fallback to showing receipt in alert
        showReceiptInAlert();
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      // Reset loading state
      setReceiptLoading(false);
    }
  };

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      if (!order || !order.items || order.items.length === 0) {
        throw new Error('No product information available');
      }

      // Get the first product from the order
      const productId = order.items[0].productId;
      if (!productId) {
        throw new Error('Product ID not found');
      }

      // Fetch the product details
      const product = await MarketplaceService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  };

  // Generate PDF content
  const generatePDFContent = (product: any, order: any) => {
    // Get the current user information
    const userName = userProfile?.displayName || 'Customer';
    const userGSTIN = userProfile?.gstin || 'Not Available';
    const userAddress = userProfile?.address || 'Not Available';

    // Get product image URL
    const productImageUrl = product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://via.placeholder.com/300x200?text=No+Image';

    // Get traceability information
    const traceabilityInfo = product.traceabilityInfo || {};
    const productJourney = product.productJourney || { stages: [] };

    // Generate HTML content for the PDF
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Traceability Certificate</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #2c3e50;
            background: white;
            margin: 0;
            padding: 10px;
            font-size: 12px;
          }

          .container {
            max-width: 210mm;
            width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 15px;
            text-align: center;
            position: relative;
          }

          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }

          .title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
          }

          .subtitle {
            font-size: 12px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }

          .certificate-id {
            position: absolute;
            top: 10px;
            right: 15px;
            background: rgba(255,255,255,0.2);
            padding: 4px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
          }

          .content {
            padding: 15px 12px;
          }

          .section {
            margin-bottom: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            padding: 12px;
            border-left: 3px solid #667eea;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .section-title::before {
            content: '';
            width: 2px;
            height: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 1px;
          }

          .subsection {
            margin: 10px 0;
            padding: 8px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e9ecef;
          }

          .subsection-title {
            font-size: 12px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e9ecef;
          }

          .product-image {
            width: 100%;
            max-width: 120px;
            height: 80px;
            object-fit: cover;
            display: block;
            margin: 0 auto 10px;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin-bottom: 10px;
          }

          .info-row {
            display: flex;
            align-items: flex-start;
            padding: 4px 0;
            border-bottom: 1px solid #f1f3f4;
            font-size: 11px;
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            font-weight: 600;
            color: #495057;
            min-width: 80px;
            margin-right: 8px;
            font-size: 10px;
          }

          .info-value {
            flex: 1;
            color: #6c757d;
            word-break: break-word;
            font-size: 10px;
          }

          .application-card {
            background: white;
            border-radius: 4px;
            padding: 8px;
            margin: 6px 0;
            border: 1px solid #e9ecef;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }

          .fertilizer-card {
            border-left: 2px solid #28a745;
          }

          .pesticide-card {
            border-left: 2px solid #ffc107;
          }

          .irrigation-card {
            border-left: 2px solid #17a2b8;
          }

          .application-title {
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 6px;
            color: #2c3e50;
          }

          .fertilizer-card .application-title {
            color: #28a745;
          }

          .pesticide-card .application-title {
            color: #ffc107;
          }

          .irrigation-card .application-title {
            color: #17a2b8;
          }



          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin: 10px 0;
          }

          .stat-card {
            background: white;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #e9ecef;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }

          .stat-number {
            font-size: 16px;
            font-weight: 700;
            color: #667eea;
            display: block;
          }

          .stat-label {
            font-size: 8px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }

          .journey-timeline {
            position: relative;
            padding-left: 15px;
          }

          .journey-timeline::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 0;
            width: 1px;
            background: linear-gradient(to bottom, #667eea, #764ba2);
          }

          .journey-stage {
            position: relative;
            background: white;
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }

          .journey-stage::before {
            content: '';
            position: absolute;
            left: -19px;
            top: 12px;
            width: 6px;
            height: 6px;
            background: #667eea;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 0 1px #667eea;
          }

          .journey-stage-title {
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 4px;
            font-size: 10px;
          }

          .footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 12px;
            font-size: 8px;
            line-height: 1.4;
          }

          .footer p {
            margin-bottom: 2px;
          }

          .no-data {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px dashed #dee2e6;
            font-size: 10px;
          }

          @media print {
            body {
              background: white;
              padding: 0;
              font-size: 10px;
            }
            .container {
              box-shadow: none;
              border-radius: 0;
              max-width: 100%;
            }
            .section {
              page-break-inside: avoid;
              margin-bottom: 10px;
            }
            .application-card {
              page-break-inside: avoid;
            }
          }

          @page {
            size: A4;
            margin: 15mm;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="certificate-id">Order: ${order.id}</div>
            <h1 class="title">🌱 Product Traceability Report</h1>
            <p class="subtitle">Ankrishi Marketplace</p>
          </div>

          <div class="content">
            <!-- Product Information Section -->
            <div class="section">
              <h2 class="section-title">📦 Product Information</h2>
              <img src="${productImageUrl}" alt="${product.name}" class="product-image">

              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">Product Name:</div>
                  <div class="info-value"><strong>${product.name}</strong></div>
                </div>
                <div class="info-row">
                  <div class="info-label">Category:</div>
                  <div class="info-value">${product.category}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Seller:</div>
                  <div class="info-value">${product.sellerName} ${product.sellerVerified ? '✅ (Verified)' : ''}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Description:</div>
                  <div class="info-value">${product.description}</div>
                </div>
              </div>
            </div>

            ${traceabilityInfo ? `
            <!-- Traceability Overview Section -->
            <div class="section">
              <h2 class="section-title">🌾 Farming Information</h2>

              ${(traceabilityInfo.fertilizers?.length > 0 ||
                 traceabilityInfo.pesticides?.length > 0 ||
                 traceabilityInfo.irrigationSchedule?.length > 0 ||
                 traceabilityInfo.qualityMetrics?.healthScore) ? `
              <!-- Data Summary -->
              <div class="stats-grid">
                ${traceabilityInfo.fertilizers?.length > 0 ? `
                <div class="stat-card">
                  <span class="stat-number">${traceabilityInfo.fertilizers.length}</span>
                  <div class="stat-label">Fertilizer Records</div>
                </div>` : ''}
                ${traceabilityInfo.pesticides?.length > 0 ? `
                <div class="stat-card">
                  <span class="stat-number">${traceabilityInfo.pesticides.length}</span>
                  <div class="stat-label">Pesticide Records</div>
                </div>` : ''}
                ${traceabilityInfo.irrigationSchedule?.length > 0 ? `
                <div class="stat-card">
                  <span class="stat-number">${traceabilityInfo.irrigationSchedule.length}</span>
                  <div class="stat-label">Irrigation Records</div>
                </div>` : ''}
                ${traceabilityInfo.qualityMetrics?.healthScore ? `
                <div class="stat-card">
                  <span class="stat-number">${traceabilityInfo.qualityMetrics.healthScore}%</span>
                  <div class="stat-label">Health Score</div>
                </div>` : ''}
              </div>` : ''}

              <!-- Crop Overview -->
              <div class="subsection">
                <h3 class="subsection-title">🌱 Crop Overview</h3>
                <div class="info-grid">
                  ${traceabilityInfo.cropName ? `
                  <div class="info-row">
                    <div class="info-label">Crop Name:</div>
                    <div class="info-value"><strong>${traceabilityInfo.cropName}</strong></div>
                  </div>` : ''}
                  ${traceabilityInfo.cropVariety ? `
                  <div class="info-row">
                    <div class="info-label">Variety:</div>
                    <div class="info-value">${traceabilityInfo.cropVariety}</div>
                  </div>` : ''}
                  ${traceabilityInfo.plantingDate ? `
                  <div class="info-row">
                    <div class="info-label">Planting Date:</div>
                    <div class="info-value">${new Date(traceabilityInfo.plantingDate).toLocaleDateString()}</div>
                  </div>` : ''}
                  ${traceabilityInfo.harvestDate ? `
                  <div class="info-row">
                    <div class="info-label">Harvest Date:</div>
                    <div class="info-value">${new Date(traceabilityInfo.harvestDate).toLocaleDateString()}</div>
                  </div>` : ''}
                  ${traceabilityInfo.expectedYield ? `
                  <div class="info-row">
                    <div class="info-label">Expected Yield:</div>
                    <div class="info-value">${traceabilityInfo.expectedYield} ${traceabilityInfo.yieldUnit || ''}</div>
                  </div>` : ''}
                </div>
              </div>

              <!-- Farm Details -->
              <div class="subsection">
                <h3 class="subsection-title">🏡 Farm Details</h3>
                <div class="info-grid">
                  ${traceabilityInfo.farmDetails?.farmName || traceabilityInfo.farmName ? `
                  <div class="info-row">
                    <div class="info-label">Farm Name:</div>
                    <div class="info-value"><strong>${traceabilityInfo.farmDetails?.farmName || traceabilityInfo.farmName}</strong></div>
                  </div>` : ''}
                  ${traceabilityInfo.farmerName ? `
                  <div class="info-row">
                    <div class="info-label">Farmer:</div>
                    <div class="info-value">${traceabilityInfo.farmerName}</div>
                  </div>` : ''}
                  ${traceabilityInfo.farmDetails?.farmLocation || traceabilityInfo.farmLocation ? `
                  <div class="info-row">
                    <div class="info-label">Farm Location:</div>
                    <div class="info-value">${traceabilityInfo.farmDetails?.farmLocation || traceabilityInfo.farmLocation}</div>
                  </div>` : ''}
                  ${traceabilityInfo.farmDetails?.farmingMethod ? `
                  <div class="info-row">
                    <div class="info-label">Farming Method:</div>
                    <div class="info-value">${traceabilityInfo.farmDetails.farmingMethod}</div>
                  </div>` : ''}
                  ${traceabilityInfo.farmDetails?.area ? `
                  <div class="info-row">
                    <div class="info-label">Farm Area:</div>
                    <div class="info-value">${traceabilityInfo.farmDetails.area} ${traceabilityInfo.farmDetails.areaUnit || ''}</div>
                  </div>` : ''}
                  ${traceabilityInfo.farmDetails?.soilType ? `
                  <div class="info-row">
                    <div class="info-label">Soil Type:</div>
                    <div class="info-value">${traceabilityInfo.farmDetails.soilType}</div>
                  </div>` : ''}
                </div>
              </div>
            </div>

            <!-- Fertilizer Applications Section -->
            <div class="section">
              <h2 class="section-title">🌿 Fertilizer Applications</h2>

              ${traceabilityInfo.fertilizers && traceabilityInfo.fertilizers.length > 0 ?
                traceabilityInfo.fertilizers.map((fert, index) => `
                <div class="application-card fertilizer-card">
                  <h4 class="application-title">🌿 ${index + 1}. ${fert.name || 'Unknown Fertilizer'}</h4>
                  <div class="info-grid">
                    ${fert.type ? `<div class="info-row"><div class="info-label">Type:</div><div class="info-value">${fert.type}</div></div>` : ''}
                    ${fert.quantity ? `<div class="info-row"><div class="info-label">Quantity Applied:</div><div class="info-value"><strong>${fert.quantity} ${fert.unit || ''}</strong></div></div>` : ''}
                    ${fert.applicationDate ? `<div class="info-row"><div class="info-label">Application Date:</div><div class="info-value">${new Date(fert.applicationDate).toLocaleDateString()}</div></div>` : ''}
                    ${fert.applicationMethod ? `<div class="info-row"><div class="info-label">Application Method:</div><div class="info-value">${fert.applicationMethod}</div></div>` : ''}
                    ${fert.weatherConditions ? `<div class="info-row"><div class="info-label">Weather Conditions:</div><div class="info-value">${fert.weatherConditions}</div></div>` : ''}
                    ${fert.soilMoisture ? `<div class="info-row"><div class="info-label">Soil Moisture:</div><div class="info-value">${fert.soilMoisture}</div></div>` : ''}
                    ${fert.nextApplication ? `<div class="info-row"><div class="info-label">Next Application Due:</div><div class="info-value">${new Date(fert.nextApplication).toLocaleDateString()}</div></div>` : ''}
                    ${fert.notes ? `<div class="info-row"><div class="info-label">Notes:</div><div class="info-value">${fert.notes}</div></div>` : ''}
                    ${fert.appliedBy ? `<div class="info-row"><div class="info-label">Applied By:</div><div class="info-value">${fert.appliedBy}</div></div>` : ''}
                    ${fert.cost ? `<div class="info-row"><div class="info-label">Cost:</div><div class="info-value">₹${fert.cost}</div></div>` : ''}
                    ${fert.supplier ? `<div class="info-row"><div class="info-label">Supplier:</div><div class="info-value">${fert.supplier}</div></div>` : ''}
                  </div>
                </div>
                `).join('') :
                '<div class="no-data">🌿 No fertilizer applications recorded in this crop cycle</div>'
              }
            </div>

            <!-- Pesticide Applications Section -->
            <div class="section">
              <h2 class="section-title">🛡️ Pesticide Applications</h2>
              ${traceabilityInfo.pesticides && traceabilityInfo.pesticides.length > 0 ?
                traceabilityInfo.pesticides.map((pest, index) => `
                <div class="application-card pesticide-card">
                  <h4 class="application-title">🛡️ ${index + 1}. ${pest.name || 'Unknown Pesticide'}</h4>
                  <div class="info-grid">
                    ${pest.type ? `<div class="info-row"><div class="info-label">Type:</div><div class="info-value">${pest.type}</div></div>` : ''}
                    ${pest.targetPest ? `<div class="info-row"><div class="info-label">Target Pest/Disease:</div><div class="info-value"><strong>${pest.targetPest}</strong></div></div>` : ''}
                    ${pest.quantity ? `<div class="info-row"><div class="info-label">Quantity Applied:</div><div class="info-value"><strong>${pest.quantity} ${pest.unit || ''}</strong></div></div>` : ''}
                    ${pest.concentration ? `<div class="info-row"><div class="info-label">Concentration:</div><div class="info-value">${pest.concentration}</div></div>` : ''}
                    ${pest.applicationDate ? `<div class="info-row"><div class="info-label">Application Date:</div><div class="info-value">${new Date(pest.applicationDate).toLocaleDateString()}</div></div>` : ''}
                    ${pest.applicationMethod ? `<div class="info-row"><div class="info-label">Application Method:</div><div class="info-value">${pest.applicationMethod}</div></div>` : ''}
                    ${pest.weatherConditions ? `<div class="info-row"><div class="info-label">Weather Conditions:</div><div class="info-value">${pest.weatherConditions}</div></div>` : ''}
                    ${pest.windSpeed ? `<div class="info-row"><div class="info-label">Wind Speed:</div><div class="info-value">${pest.windSpeed}</div></div>` : ''}
                    ${pest.temperature ? `<div class="info-row"><div class="info-label">Temperature:</div><div class="info-value">${pest.temperature}</div></div>` : ''}
                    ${pest.preHarvestInterval ? `<div class="info-row"><div class="info-label">Pre-Harvest Interval:</div><div class="info-value"><strong>${pest.preHarvestInterval} days</strong></div></div>` : ''}
                    ${pest.nextApplication ? `<div class="info-row"><div class="info-label">Next Application Due:</div><div class="info-value">${new Date(pest.nextApplication).toLocaleDateString()}</div></div>` : ''}
                    ${pest.safetyPrecautions ? `<div class="info-row"><div class="info-label">Safety Precautions:</div><div class="info-value">${pest.safetyPrecautions}</div></div>` : ''}
                    ${pest.notes ? `<div class="info-row"><div class="info-label">Notes:</div><div class="info-value">${pest.notes}</div></div>` : ''}
                    ${pest.appliedBy ? `<div class="info-row"><div class="info-label">Applied By:</div><div class="info-value">${pest.appliedBy}</div></div>` : ''}
                    ${pest.cost ? `<div class="info-row"><div class="info-label">Cost:</div><div class="info-value">₹${pest.cost}</div></div>` : ''}
                    ${pest.supplier ? `<div class="info-row"><div class="info-label">Supplier:</div><div class="info-value">${pest.supplier}</div></div>` : ''}
                  </div>
                </div>
                `).join('') :
                '<div class="no-data">🛡️ No pesticide applications recorded in this crop cycle</div>'
              }
            </div>

            <!-- Irrigation Schedule Section -->
            <div class="section">
              <h2 class="section-title">💧 Irrigation Schedule</h2>
              ${traceabilityInfo.irrigationSchedule && traceabilityInfo.irrigationSchedule.length > 0 ?
                traceabilityInfo.irrigationSchedule.map((irr, index) => `
                <div class="application-card irrigation-card">
                  <h4 class="application-title">💧 ${index + 1}. Irrigation Session</h4>
                  <div class="info-grid">
                    ${irr.date ? `<div class="info-row"><div class="info-label">Date:</div><div class="info-value"><strong>${new Date(irr.date).toLocaleDateString()}</strong></div></div>` : ''}
                    ${irr.startTime ? `<div class="info-row"><div class="info-label">Start Time:</div><div class="info-value">${irr.startTime}</div></div>` : ''}
                    ${irr.endTime ? `<div class="info-row"><div class="info-label">End Time:</div><div class="info-value">${irr.endTime}</div></div>` : ''}
                    ${irr.duration ? `<div class="info-row"><div class="info-label">Duration:</div><div class="info-value"><strong>${irr.duration}</strong></div></div>` : ''}
                    ${irr.waterSource ? `<div class="info-row"><div class="info-label">Water Source:</div><div class="info-value">${irr.waterSource}</div></div>` : ''}
                    ${irr.method ? `<div class="info-row"><div class="info-label">Irrigation Method:</div><div class="info-value">${irr.method}</div></div>` : ''}
                    ${irr.waterQuantity ? `<div class="info-row"><div class="info-label">Water Quantity:</div><div class="info-value"><strong>${irr.waterQuantity} ${irr.waterUnit || 'liters'}</strong></div></div>` : ''}
                    ${irr.soilMoistureBefore ? `<div class="info-row"><div class="info-label">Soil Moisture Before:</div><div class="info-value">${irr.soilMoistureBefore}%</div></div>` : ''}
                    ${irr.soilMoistureAfter ? `<div class="info-row"><div class="info-label">Soil Moisture After:</div><div class="info-value">${irr.soilMoistureAfter}%</div></div>` : ''}
                    ${irr.weatherConditions ? `<div class="info-row"><div class="info-label">Weather Conditions:</div><div class="info-value">${irr.weatherConditions}</div></div>` : ''}
                    ${irr.temperature ? `<div class="info-row"><div class="info-label">Temperature:</div><div class="info-value">${irr.temperature}°C</div></div>` : ''}
                    ${irr.humidity ? `<div class="info-row"><div class="info-label">Humidity:</div><div class="info-value">${irr.humidity}%</div></div>` : ''}
                    ${irr.status ? `<div class="info-row"><div class="info-label">Status:</div><div class="info-value">${irr.status}</div></div>` : ''}
                    ${irr.waterQuality ? `<div class="info-row"><div class="info-label">Water Quality:</div><div class="info-value">${irr.waterQuality}</div></div>` : ''}
                    ${irr.pressure ? `<div class="info-row"><div class="info-label">Pressure:</div><div class="info-value">${irr.pressure} PSI</div></div>` : ''}
                    ${irr.flowRate ? `<div class="info-row"><div class="info-label">Flow Rate:</div><div class="info-value">${irr.flowRate} L/min</div></div>` : ''}
                    ${irr.notes ? `<div class="info-row"><div class="info-label">Notes:</div><div class="info-value">${irr.notes}</div></div>` : ''}
                    ${irr.operator ? `<div class="info-row"><div class="info-label">Operator:</div><div class="info-value">${irr.operator}</div></div>` : ''}
                  </div>
                </div>
                `).join('') :
                '<div class="no-data">💧 No irrigation schedule recorded for this crop cycle</div>'
              }

            </div>

            ${(traceabilityInfo.qualityMetrics?.healthScore ||
               traceabilityInfo.qualityMetrics?.organicCertified !== undefined ||
               traceabilityInfo.qualityMetrics?.growingMethod ||
               traceabilityInfo.farmingPractices) ? `
            <!-- Quality Information Section -->
            <div class="section">
              <h2 class="section-title">🏆 Quality Information</h2>
              <div class="subsection">
                <div class="info-grid">
                  ${traceabilityInfo.qualityMetrics?.healthScore ? `
                  <div class="info-row">
                    <div class="info-label">Health Score:</div>
                    <div class="info-value"><strong>${traceabilityInfo.qualityMetrics.healthScore}%</strong></div>
                  </div>` : ''}
                  ${traceabilityInfo.qualityMetrics?.organicCertified !== undefined ? `
                  <div class="info-row">
                    <div class="info-label">Organic Certified:</div>
                    <div class="info-value">${traceabilityInfo.qualityMetrics.organicCertified ? 'Yes' : 'No'}</div>
                  </div>` : ''}
                  ${traceabilityInfo.qualityMetrics?.growingMethod ? `
                  <div class="info-row">
                    <div class="info-label">Growing Method:</div>
                    <div class="info-value">${traceabilityInfo.qualityMetrics.growingMethod}</div>
                  </div>` : ''}
                  ${traceabilityInfo.farmingPractices ? `
                  <div class="info-row">
                    <div class="info-label">Farming Practices:</div>
                    <div class="info-value">${traceabilityInfo.farmingPractices}</div>
                  </div>` : ''}
                </div>
              </div>
            </div>
            ` : ''}` : ''}

            ${productJourney.stages.length > 0 ? `
            <!-- Product Journey Section -->
            <div class="section">
              <h2 class="section-title">📍 Product Journey Timeline</h2>
              <div class="journey-timeline">
                ${productJourney.stages.map((stage: any, index: number) => `
                <div class="journey-stage">
                  <div class="journey-stage-title">${index + 1}. ${stage.stageName}</div>
                  <div class="info-grid">
                    <div class="info-row">
                      <div class="info-label">Date & Time:</div>
                      <div class="info-value"><strong>${new Date(stage.timestamp).toLocaleString()}</strong></div>
                    </div>
                    ${stage.description ? `
                    <div class="info-row">
                      <div class="info-label">Description:</div>
                      <div class="info-value">${stage.description}</div>
                    </div>` : ''}
                    ${stage.handledBy ? `
                    <div class="info-row">
                      <div class="info-label">Handled By:</div>
                      <div class="info-value">${stage.handledBy}</div>
                    </div>` : ''}
                  </div>
                </div>`).join('')}
              </div>
            </div>` : ''}

            <!-- Order Information Section -->
            <div class="section">
              <h2 class="section-title">📋 Order Information</h2>
              <div class="subsection">
                <div class="info-grid">
                  <div class="info-row">
                    <div class="info-label">Order ID:</div>
                    <div class="info-value"><strong>${order.id}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Order Date:</div>
                    <div class="info-value">${new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Customer Name:</div>
                    <div class="info-value">${userName}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">GSTIN:</div>
                    <div class="info-value">${userGSTIN || 'N/A'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Delivery Address:</div>
                    <div class="info-value">${userAddress}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Total Amount:</div>
                    <div class="info-value"><strong>₹${order.totalAmount}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Quantity:</div>
                    <div class="info-value">${order.items[0]?.quantity || 'N/A'} ${order.items[0]?.stockUnit || order.items[0]?.unit || ''}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>Ankrishi Marketplace</strong></p>
            <p>Product traceability report for Order #${order.id}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>© 2024 Ankrishi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate QR code for the PDF URL
  const generateQRCode = async (url: string) => {
    try {
      // Generate a QR code using a free QR code API
      // Using QR Server API which is more reliable
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      console.log('QR code URL:', qrCodeApiUrl);
      return qrCodeApiUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  // Handle view QR code button press
  const handleViewQRCode = async () => {
    try {
      console.log('Starting QR code generation process');
      // Set loading state before showing the modal
      setTraceabilityLoading(true); // Set button loading state
      setGeneratingQR(true);
      setUploadProgress(0);
      setUploadStatus('Initializing...');

      // Small delay to show the button loading state before showing the modal
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show the modal immediately so the loading indicator is visible
      setShowQRModal(true);

      // Check if we already have a QR code URL
      if (qrCodeUrl && pdfUrl) {
        setUploadProgress(100);
        setUploadStatus('Complete');
        setGeneratingQR(false);
        setTraceabilityLoading(false); // Reset button loading state
        return;
      }

      // Check if the order has a stored PDF URL
      if (order.pdfUrl) {
        // Generate QR code for the existing PDF URL
        setUploadStatus('Retrieving stored certificate...');
        setUploadProgress(50);
        const qrCode = await generateQRCode(order.pdfUrl);
        setQrCodeUrl(qrCode);
        setPdfUrl(order.pdfUrl);
        setUploadProgress(100);
        setUploadStatus('Complete');
        setGeneratingQR(false);
        setTraceabilityLoading(false); // Reset button loading state
        return;
      }

      // Fetch product details
      console.log('Fetching product details...');
      setUploadStatus('Fetching product details...');
      setUploadProgress(5);
      const product = await fetchProductDetails();
      console.log('Product details fetched:', product ? 'success' : 'failed');
      setProductDetails(product);
      setUploadProgress(10);

      // Generate PDF content
      setUploadStatus('Generating traceability certificate...');
      const pdfContent = generatePDFContent(product, order);
      setUploadProgress(20);

      // Generate a unique filename
      const filename = `traceability_${order.id}_${generateUniqueId()}.html`;

      // Create a reference to the storage location
      const storageRef = storage().ref(`traceability/${filename}`);
      let downloadUrl = '';

      try {
        // In React Native, we need to use a different approach since Blob is not directly available
        // Create a temporary file with the HTML content
        console.log('Creating temporary file...');
        setUploadStatus('Creating temporary file...');
        setUploadProgress(30);
        const tempFilePath = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(tempFilePath, pdfContent);
        console.log('Temporary file created at:', tempFilePath);
        setUploadProgress(40);

        // Upload the file to Firebase Storage
        console.log('Uploading file to Firebase Storage...');
        setUploadStatus('Uploading file to Firebase Storage...');
        setUploadProgress(10);

        // Create a task to track upload progress
        const uploadTask = storageRef.putFile(tempFilePath);

        // Listen for state changes, errors, and completion of the upload
        uploadTask.on('state_changed',
          (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.max(10, Math.floor(progress)));
            console.log('Upload is ' + progress + '% done');

            switch (snapshot.state) {
              case 'paused':
                setUploadStatus('Upload paused');
                console.log('Upload is paused');
                break;
              case 'running':
                setUploadStatus(`Uploading: ${Math.floor(progress)}%`);
                console.log('Upload is running');
                break;
            }
          },
          (error) => {
            // Handle unsuccessful uploads
            console.error('Upload error:', error);
            throw error;
          }
        );

        // Wait for the upload to complete
        await uploadTask;
        setUploadProgress(70);
        setUploadStatus('File uploaded successfully');
        console.log('File uploaded successfully');

        // Get the download URL
        setUploadStatus('Getting download URL...');
        setUploadProgress(80);
        downloadUrl = await storageRef.getDownloadURL();
        setPdfUrl(downloadUrl);
        setUploadProgress(85);
      } catch (fileError) {
        console.error('Error with file operations:', fileError);
        throw new Error('Failed to create or upload traceability file');
      }

      try {
        // Store the PDF URL in the order object
        if (downloadUrl) {
          setUploadStatus('Updating database...');
          setUploadProgress(90);
          await database().ref(`orders/${order.id}`).update({
            pdfUrl: downloadUrl,
          });

          // Update the local order object
          setOrder({
            ...order,
            pdfUrl: downloadUrl,
          });
        }
      } catch (dbError) {
        console.error('Error updating database:', dbError);
        // Continue with QR code generation even if database update fails
      }

      // Generate QR code for the PDF URL
      if (!downloadUrl) {
        // Use a fallback URL if no download URL is available
        downloadUrl = 'https://ankrishi.com/traceability';
      }
      setUploadStatus('Generating QR code...');
      setUploadProgress(95);
      console.log('Generating QR code for URL:', downloadUrl);
      const qrCode = await generateQRCode(downloadUrl);
      console.log('QR code generated:', qrCode ? 'success' : 'failed');
      setQrCodeUrl(qrCode);
      setUploadProgress(100);
      setUploadStatus('Complete');

      // QR code generation complete
      console.log('QR code generation complete');
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Notice', 'Product traceability information is not available for this order.');
      setShowQRModal(false); // Close the modal on error
    } finally {
      setGeneratingQR(false);
      setTraceabilityLoading(false); // Reset button loading state
    }
  };



  // Handle rating submission
  const handleRateOrder = async (rating: number, comment: string) => {
    try {
      setRatingSubmitting(true);

      // Submit the rating using MarketplaceService
      await MarketplaceService.completeOrder(
        orderId,
        { rating, comment },
        undefined // No farmer rating
      );

      // Update the local order object to reflect the rating
      setOrder({
        ...order,
        buyerRating: {
          rating,
          comment,
          timestamp: Date.now(),
        },
      });

      // Also update the product's ratings
      if (order?.items?.[0]?.productId) {
        try {
          // Get the current product
          const productId = order.items[0].productId;
          const product = await MarketplaceService.getProduct(productId);

          if (product) {
            // Add the new rating to the product's ratings array
            const newRating = {
              rating,
              review: comment,
              timestamp: Date.now(),
              reviewerName: userProfile?.displayName || 'Anonymous User',
              reviewerId: userProfile?.uid || '',
            };

            const ratings = product.ratings || [];
            ratings.push(newRating);

            // Calculate the new average rating
            const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

            // Update the product with the new ratings and average rating
            await MarketplaceService.updateProduct(productId, {
              ratings,
              averageRating,
            });

            console.log(`Updated product ${product.name} with new rating: ${rating}`);
          }
        } catch (productError) {
          console.error('Error updating product ratings:', productError);
          // Don't block the order rating process if product update fails
        }
      }

      Alert.alert('Success', 'Thank you for your rating!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
      setShowRatingModal(false);
    }
  };

  // Check if the order can be rated
  const canRateOrder = useMemo(() => {
    if (!order) return false;

    // Can only rate delivered orders
    if (order.status !== 'delivered') return false;

    // Can't rate if already rated
    if (order.buyerRating) return false;

    return true;
  }, [order]);

  // Show receipt in an alert as fallback
  const showReceiptInAlert = () => {
    // Create a more readable receipt format for the alert
    const receiptContent = `
Order #${order.id}
Date: ${formatDate(order.createdAt)}
Status: ${getStatusText(order.status)}

Customer: ${order.shippingAddress.name}
Address: ${order.shippingAddress.address}, ${order.shippingAddress.city}

Items:
${order.items.map((item: any) => `• ${item.name || item.productName || 'Product'} (${item.quantity}) - ₹${item.total || item.totalPrice || (item.price * item.quantity) || 0}`).join('\n')}

Subtotal: ₹${order.subtotal || order.totalAmount || calculateSubtotal(order.items)}
${order.shippingFee ? `Shipping: ₹${order.shippingFee}` : ''}
Total: ₹${order.total || order.totalAmount}
    `;

    Alert.alert(
      'Order Receipt',
      receiptContent,
      [
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <LoadingQuote
        loadingText={loadingMessage}
        style={styles.loadingContainer}
        type="marketplace"
      />
    );
  }

  // Order not found
  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>
          The order you're looking for doesn't exist or has been removed.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.goBackButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <Card style={styles.statusCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Status</Text>
          </View>

          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderIdText}>Order #{order.id}</Text>
              <Text style={styles.orderDateText}>
                Placed on {formatDate(order.createdAt)}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.deliveryInfoContainer}>
            <View style={styles.deliveryInfo}>
              <Ionicons
                name={order.status === 'delivered' ? "checkmark-circle" : "calendar"}
                size={24}
                color={order.status === 'delivered' ? colors.success : colors.primary}
              />
              <Text style={[styles.deliveryText, order.status === 'delivered' && styles.deliveredText]}>
                {estimatedDeliveryText}
              </Text>
            </View>

            {(order.status === 'pending' || order.status === 'confirmed') && (
              <View style={styles.deliveryNote}>
                <Ionicons name="information-circle" size={16} color={colors.info} />
                <Text style={styles.deliveryNoteText}>
                  {order.status === 'pending' ? 'Order will be confirmed soon' : 'Your order is being prepared'}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Tracking Timeline */}
        <Card style={styles.trackingCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Tracking Information</Text>
          </View>

          <View style={styles.timeline}>
            {['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'].map((status, index) => {
              const isCompleted = order.trackingInfo?.trackingHistory && order.trackingInfo.trackingHistory.some(
                (history: any) => history.status === status
              );
              const isCurrent = order.status === status;

              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isCompleted && styles.completedDot,
                      isCurrent && styles.currentDot,
                    ]}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      )}
                    </View>
                    {index < 4 && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.completedLine,
                      ]} />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineTitle,
                      isCompleted && styles.completedTitle,
                      isCurrent && styles.currentTitle,
                    ]}>
                      {getStatusText(status as OrderStatus)}
                    </Text>

                    {isCompleted && order.trackingInfo?.trackingHistory && (
                      <Text style={styles.timelineDate}>
                        {formatDate(
                          order.trackingInfo.trackingHistory.find(
                            (history: any) => history.status === status
                          )?.timestamp || Date.now()
                        )}{' '}
                        {formatTime(
                          order.trackingInfo.trackingHistory.find(
                            (history: any) => history.status === status
                          )?.timestamp || Date.now()
                        )}
                      </Text>
                    )}

                    {isCompleted && order.trackingInfo?.trackingHistory && (
                      <Text style={styles.timelineDescription}>
                        {order.trackingInfo.trackingHistory.find(
                          (history: any) => history.status === status
                        )?.description || `${getStatusText(status as OrderStatus)} status reached`}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Shipping Address */}
        <Card style={styles.addressCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Shipping Address</Text>
          </View>

          <View style={styles.addressContent}>
            <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
            <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
            <Text style={styles.addressText}>
              {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </Text>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>

          <View style={styles.paymentMethod}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.itemsContainer}>
            {order.items.map((item: any, index: number) => (
              <View key={item.id || `item-${index}`} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.productName || 'Product'}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.total || item.totalPrice || (item.price * item.quantity) || 0}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Show subtotal if available, otherwise calculate from items */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₹{order.subtotal || order.totalAmount || calculateSubtotal(order.items)}</Text>
          </View>

          {/* Show shipping fee if available */}
          {(order.shippingFee !== undefined && order.shippingFee > 0) ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping Fee</Text>
              <Text style={styles.totalValue}>₹{order.shippingFee}</Text>
            </View>
          ) : null}

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>₹{order.total || order.totalAmount}</Text>
            </View>
          </View>

          {/* Traceability QR Code Button */}
          <View style={styles.traceabilityButtonContainer}>
            <Button
              title="View Product Traceability"
              leftIcon={<Ionicons name="git-branch" size={20} color={colors.white} />}
              onPress={handleViewQRCode}
              style={styles.traceabilityButton}
              loading={traceabilityLoading}
            />
            <Text style={styles.traceabilityText}>
              Scan QR code to view detailed product journey and traceability information
            </Text>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarButtons}>
          {canRateOrder ? (
            <Button
              title="Rate Order"
              variant="outline"
              leftIcon={<Ionicons name="star" size={20} color={colors.secondary} />}
              onPress={() => setShowRatingModal(true)}
              style={styles.rateButton}
            />
          ) : (
            <View style={styles.buttonGroup}>
              <Button
                title="Share Receipt"
                variant="outline"
                leftIcon={<Ionicons name="share-social" size={20} color={receiptLoading ? colors.mediumGray : colors.primary} />}
                onPress={shareReceipt}
                style={styles.receiptButton}
                loading={receiptLoading}
                disabled={receiptLoading}
              />
            </View>
          )}

          <Button
            title="Contact Support"
            leftIcon={<Ionicons name="chatbubble-ellipses" size={20} color={colors.white} />}
            onPress={() => {
              // Navigate to support chat or show support options
              Alert.alert('Support', 'Support feature coming soon!');
            }}
            style={styles.supportButton}
          />
        </View>
      </View>

      {/* Rating Modal */}
      <RateOrderModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRateOrder}
        productName={order?.items?.[0]?.name || order?.items?.[0]?.productName || 'Product'}
      />

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowQRModal(false);
          // Reset loading states when modal is closed via back button
          if (generatingQR) {
            setGeneratingQR(false);
            setTraceabilityLoading(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContainer}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Product Traceability</Text>
              <TouchableOpacity onPress={() => {
                setShowQRModal(false);
                // Reset loading states when modal is closed
                if (generatingQR) {
                  setGeneratingQR(false);
                  setTraceabilityLoading(false);
                }
              }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeContainer}>
              {generatingQR ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>{uploadStatus}</Text>
                  {uploadProgress > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                      <Text style={styles.progressText}>{uploadProgress}%</Text>
                    </View>
                  )}
                </View>
              ) : qrCodeUrl ? (
                <>
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={styles.qrCodeImage}
                    onError={(e) => {
                      console.error('Image loading error:', e.nativeEvent.error);
                      setShowQRModal(false);
                      Alert.alert('Notice', 'Product traceability information is not available for this order.');
                    }}
                  />
                  <Text style={styles.qrCodeText}>Scan this QR code to view product traceability information</Text>
                  <Text style={styles.qrCodeUrlText}>{pdfUrl}</Text>
                </>
              ) : (
                <Text style={styles.errorText}>Product traceability information is not available for this order.</Text>
              )}
            </View>

            <View style={styles.qrModalActions}>
              <Button
                title="Open Certificate"
                onPress={() => {
                  if (pdfUrl) {
                    Linking.openURL(pdfUrl);
                  }
                }}
                style={styles.openCertificateButton}
                disabled={!pdfUrl}
              />
              <Button
                title="Close"
                variant="outline"
                onPress={() => {
                  setShowQRModal(false);
                  // Reset loading states when modal is closed
                  if (generatingQR) {
                    setGeneratingQR(false);
                    setTraceabilityLoading(false);
                  }
                }}
                style={styles.closeButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
    backgroundColor: colors.background,
  },
  loadingContainer: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: spacing.md,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  goBackButton: {
    width: 200,
  },
  // Card common styles
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
  // Status card styles
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderIdText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  orderDateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
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
  deliveryInfoContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  deliveredText: {
    color: colors.success,
    fontFamily: typography.fontFamily.bold,
  },
  deliveryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  deliveryNoteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  // Tracking card styles
  trackingCard: {
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  timeline: {
    marginLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  completedDot: {
    backgroundColor: colors.success,
  },
  currentDot: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  completedLine: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  completedTitle: {
    color: colors.textPrimary,
  },
  currentTitle: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  timelineDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timelineDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Address card styles
  addressCard: {
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
  addressContent: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  addressName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressPhone: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Summary card styles
  summaryCard: {
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
  paymentMethod: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  paymentLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  paymentValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
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
  // Bottom bar styles
  bottomSpacing: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    padding: spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomBarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rateButton: {
    flex: 1,
    marginRight: spacing.sm,
    borderColor: colors.secondary,
  },
  supportButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  // QR Code Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  qrModalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  qrModalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    minHeight: 250,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
  },
  qrCodeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  qrCodeUrlText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  qrModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  openCertificateButton: {
    flex: 1,
    marginRight: spacing.xs,
  },
  closeButton: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  buttonGroup: {
    flex: 1,
    flexDirection: 'row',
  },
  qrCodeButton: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  traceabilityButtonContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  progressContainer: {
    width: '100%',
    height: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    marginTop: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  traceabilityButton: {
    backgroundColor: colors.success,
    marginBottom: spacing.sm,
  },
  traceabilityText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OrderTrackingScreen;
