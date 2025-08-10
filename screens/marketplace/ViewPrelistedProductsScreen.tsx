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

const ViewPrelistedProductsScreen = () => {
  const navigation = useNavigation();

  return (
    <UnderMaintenanceScreen 
      title="View Prelisted Products" 
      message="This feature will allow you to browse all prelisted products from farmers and vendors. You'll be able to view details and place orders once the feature is available."
    />
  );
};

export default ViewPrelistedProductsScreen;
