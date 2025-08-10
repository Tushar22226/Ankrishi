import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../../theme';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import UnderMaintenanceScreen from '../common/UnderMaintenanceScreen';

const PrelistedOrdersScreen = () => {
  const navigation = useNavigation();

  return (
    <UnderMaintenanceScreen 
      title="Your Prelisted Orders" 
      message="This feature will allow you to view and manage all orders for your prelisted products. You'll be able to track, update, and fulfill these orders once the feature is available."
    />
  );
};

export default PrelistedOrdersScreen;
