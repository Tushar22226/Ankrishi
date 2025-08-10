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

const PrelistedMarketplaceScreen = () => {
  const navigation = useNavigation();

  return (
    <UnderMaintenanceScreen 
      title="Your Prelisted Products" 
      message="This feature will allow you to view and manage all your prelisted products. You'll be able to edit, remove, or publish them to the marketplace when ready."
    />
  );
};

export default PrelistedMarketplaceScreen;
