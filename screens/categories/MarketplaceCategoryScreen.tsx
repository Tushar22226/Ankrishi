import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import Card from '../../components/Card';

interface FeatureItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  screen: string;
  color: string;
}

const marketplaceFeatures: FeatureItem[] = [
  {
    id: 'browse',
    title: 'Browse Products',
    icon: 'search',
    description: 'Explore all available products',
    screen: 'Marketplace',
    color: '#4CAF50',
  },
  {
    id: 'sell',
    title: 'Sell Products',
    icon: 'add-circle',
    description: 'List your products for sale',
    screen: 'AddProduct',
    color: '#2196F3',
  },
  {
    id: 'your-products',
    title: 'Your Products',
    icon: 'list',
    description: 'Manage your listed products',
    screen: 'UserProducts',
    color: '#FF9800',
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: 'cart',
    description: 'View and manage your orders',
    screen: 'Orders',
    color: '#9C27B0',
  },
  {
    id: 'produce',
    title: 'Produce',
    icon: 'nutrition',
    description: 'Browse fresh produce',
    screen: 'Produce',
    color: '#8BC34A',
  },
  {
    id: 'fertilizer',
    title: 'Fertilizers',
    icon: 'flask',
    description: 'Browse fertilizers and chemicals',
    screen: 'Fertilizer',
    color: '#795548',
  },
  {
    id: 'equipment',
    title: 'Equipment Rental',
    icon: 'construct',
    description: 'Rent farming equipment',
    screen: 'EquipmentRental',
    color: '#607D8B',
  },
];

const MarketplaceCategoryScreen = () => {
  const navigation = useNavigation();

  const handleFeaturePress = (feature: FeatureItem) => {
    navigation.navigate(feature.screen as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>All Marketplace Features</Text>
        
        <View style={styles.featuresGrid}>
          {marketplaceFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={32} color={colors.white} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    ...shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});

export default MarketplaceCategoryScreen;
