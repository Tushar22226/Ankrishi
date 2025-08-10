import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import CartService, { CartItem } from '../../services/CartService';
import WalletService from '../../services/WalletService';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { database } from '../../firebase/config';
import { PaymentMethod } from '../../models/Order';

const MultiProductCheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  // Get params from route
  const { fromCart, cartItems } = route.params as {
    fromCart?: boolean;
    cartItems?: CartItem[];
  };

  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CartItem[]>([]);
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'self_pickup'>('delivery');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [fromCart, cartItems]);

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!userProfile) return;

      try {
        setLoadingWallet(true);
        const balance = await WalletService.getBalance(userProfile.uid);
        setWalletBalance(balance);
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        Alert.alert('Error', 'Failed to load wallet balance');
      } finally {
        setLoadingWallet(false);
      }
    };

    loadWalletBalance();
  }, [userProfile]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      if (fromCart && cartItems && cartItems.length > 0) {
        // Set products from cart items
        setProducts(cartItems);
      } else {
        Alert.alert('Error', 'No products found in cart');
        navigation.goBack();
        return;
      }

      // Pre-fill shipping address if user profile has address
      if (userProfile) {
        setShippingAddress({
          name: userProfile.displayName || '',
          phone: userProfile.phoneNumber || '',
          address: userProfile.location?.address || '',
          city: '',
          state: '',
          pincode: '',
        });

        // Load saved addresses
        const addresses = await MarketplaceService.getUserAddresses(userProfile.uid);
        setSavedAddresses(addresses);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load checkout data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
