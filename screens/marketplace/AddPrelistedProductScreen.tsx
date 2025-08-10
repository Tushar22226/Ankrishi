import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import MarketplaceService from '../../services/MarketplaceService';
import { Product, ProductCategory, ProductSubcategory, CertificationType, StockQuantityUnit, ProduceRipeness } from '../../models/Product';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Product categories
const productCategories = [
  { id: 'fertilizer', name: 'Fertilizer', icon: 'leaf' },
  { id: 'equipment', name: 'Equipment', icon: 'construct' },
  { id: 'produce', name: 'Produce', icon: 'nutrition' },
];

// Delivery timeframe options
const deliveryTimeframeOptions = [
  { id: '1week', name: '1 Week', days: 7 },
  { id: '2weeks', name: '2 Weeks', days: 14 },
  { id: '3weeks', name: '3 Weeks', days: 21 },
  { id: '4weeks', name: '4 Weeks', days: 28 },
];

const AddPrelistedProductScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { userProfile } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState<StockQuantityUnit>('kg');
  const [ripeness, setRipeness] = useState<ProduceRipeness | ''>('');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('');
