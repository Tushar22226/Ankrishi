import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../../theme';
import Card from '../../components/Card';

// Mock crop data
const mockCrops = [
  {
    id: 'crop1',
    name: 'Wheat',
    variety: 'HD-2967',
    area: 2.5, // in acres
    plantingDate: new Date(Date.now() - 86400000 * 60), // 60 days ago
    harvestDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
    status: 'growing',
    health: 'good',
  },
  {
    id: 'crop2',
    name: 'Tomatoes',
    variety: 'Pusa Ruby',
    area: 1.0, // in acres
    plantingDate: new Date(Date.now() - 86400000 * 45), // 45 days ago
    harvestDate: new Date(Date.now() + 86400000 * 15), // 15 days from now
    status: 'growing',
    health: 'excellent',
  },
  {
    id: 'crop3',
    name: 'Rice',
    variety: 'Basmati',
    area: 2.0, // in acres
    plantingDate: new Date(Date.now() - 86400000 * 30), // 30 days ago
    harvestDate: new Date(Date.now() + 86400000 * 60), // 60 days from now
    status: 'growing',
    health: 'fair',
  },
];

const CropManagementScreen = () => {
  const navigation = useNavigation();

  const renderCropItem = ({ item }) => (
    <Card style={styles.cropCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CropDetails', { cropId: item.id })}
      >
        <View style={styles.cropHeader}>
          <Text style={styles.cropName}>{item.name}</Text>
          <View style={styles.cropBadge}>
            <Text style={styles.cropBadgeText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cropDetails}>
          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Variety:</Text>
            <Text style={styles.cropDetailValue}>{item.variety}</Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Area:</Text>
            <Text style={styles.cropDetailValue}>{item.area} acres</Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Health:</Text>
            <Text style={styles.cropDetailValue}>{item.health}</Text>
          </View>

          <View style={styles.cropDetail}>
            <Text style={styles.cropDetailLabel}>Harvest in:</Text>
            <Text style={styles.cropDetailValue}>
              {Math.ceil((item.harvestDate - new Date()) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Crop Management</Text>
      </View>

      <FlatList
        data={mockCrops}
        renderItem={renderCropItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cropsList}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCrop')}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.medium,
  },
  title: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cropsList: {
    padding: spacing.medium,
  },
  cropCard: {
    marginBottom: spacing.medium,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  cropName: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cropBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cropBadgeText: {
    color: colors.white,
    fontSize: typography.fontSizeSmall,
  },
  cropDetails: {
    marginTop: spacing.small,
  },
  cropDetail: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cropDetailLabel: {
    width: 80,
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  cropDetailValue: {
    fontSize: typography.fontSizeSmall,
    color: colors.textPrimary,
  },
  addButton: {
    position: 'absolute',
    right: spacing.large,
    bottom: spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default CropManagementScreen;
