import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const IncomeStabilityScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Strategies for improving income stability
  const strategies = [
    {
      id: 'diversify',
      title: 'Diversify Crop Selection',
      description: 'Plant different crops that harvest at different times of the year to ensure a more consistent income stream.',
      icon: 'leaf',
      actions: [
        'Research crops that grow well in your region during different seasons',
        'Start with 2-3 new crops on a small portion of your land',
        'Track performance and expand successful crops next season',
      ],
    },
    {
      id: 'valueAdded',
      title: 'Create Value-Added Products',
      description: 'Process your raw agricultural products into higher-value items that can be sold throughout the year.',
      icon: 'basket',
      actions: [
        'Identify products you can make from your crops (jams, pickles, etc.)',
        'Learn basic food processing and preservation techniques',
        'Start small and test market demand before scaling up',
      ],
    },
    {
      id: 'contract',
      title: 'Explore Contract Farming',
      description: 'Partner with buyers who will commit to purchasing your crops at a predetermined price before planting.',
      icon: 'document-text',
      actions: [
        'Research companies that offer contract farming in your area',
        'Understand contract terms and negotiate fair prices',
        'Start with a small portion of your land for contract farming',
      ],
    },
    {
      id: 'offSeason',
      title: 'Off-Season Income Sources',
      description: 'Develop income streams that are active during your farm\'s slow seasons.',
      icon: 'calendar',
      actions: [
        'Consider renting out equipment during your off-season',
        'Offer your expertise as a consultant to other farmers',
        'Explore agri-tourism opportunities on your farm',
      ],
    },
    {
      id: 'directSales',
      title: 'Direct-to-Consumer Sales',
      description: 'Sell directly to consumers through farmers markets, CSAs, or online platforms to capture more value.',
      icon: 'people',
      actions: [
        'Research local farmers markets and their requirements',
        'Build a simple online presence to connect with customers',
        'Develop a consistent schedule for direct sales',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Improve Income Stability</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            Why Income Stability Matters
          </Text>
          <Text style={styles.introText}>
            Stable income helps you plan your finances, meet regular expenses, and build savings. As a farmer, your income may naturally fluctuate with seasons, but these strategies can help reduce that volatility.
          </Text>
        </View>

        {/* Strategies */}
        <View style={styles.strategiesContainer}>
          <Text style={styles.sectionTitle}>Recommended Strategies</Text>

          {strategies.map((strategy) => (
            <Card key={strategy.id} style={styles.strategyCard}>
              <View style={styles.strategyHeader}>
                <Ionicons name={strategy.icon} size={32} color={colors.primary} />
                <Text style={styles.strategyTitle}>{strategy.title}</Text>
              </View>
              
              <Text style={styles.strategyDescription}>
                {strategy.description}
              </Text>
              
              <View style={styles.actionContainer}>
                <Text style={styles.actionTitle}>Action Steps:</Text>
                {strategy.actions.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <Text style={styles.actionNumber}>{index + 1}.</Text>
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
              
              <Button
                title="Learn More"
                onPress={() => Alert.alert('Coming Soon', 'Detailed guides will be available in future updates.')}
                style={styles.learnMoreButton}
              />
            </Card>
          ))}
        </View>

        {/* Resources */}
        <View style={styles.resourcesContainer}>
          <Text style={styles.sectionTitle}>Helpful Resources</Text>
          
          <Card style={styles.resourceCard}>
            <Text style={styles.resourceTitle}>Government Programs</Text>
            <Text style={styles.resourceDescription}>
              Several government schemes support farmers in diversifying their income sources:
            </Text>
            <View style={styles.resourceList}>
              <Text style={styles.resourceItem}>• Pradhan Mantri Fasal Bima Yojana (PMFBY)</Text>
              <Text style={styles.resourceItem}>• Kisan Credit Card (KCC)</Text>
              <Text style={styles.resourceItem}>• National Food Security Mission (NFSM)</Text>
            </View>
            <Button
              title="Explore Programs"
              onPress={() => Alert.alert('Coming Soon', 'Program details will be available in future updates.')}
              style={styles.resourceButton}
            />
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Talk to an Expert"
            onPress={() => navigation.navigate('Consultants' as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="person" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="View Success Stories"
            onPress={() => Alert.alert('Coming Soon', 'Success stories will be available in future updates.')}
            style={styles.actionButton}
            leftIcon={<Ionicons name="star" size={18} color={colors.white} style={styles.buttonIcon} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  introContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    margin: spacing.md,
    borderRadius: borderRadius.md,
  },
  introTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  strategiesContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  strategyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  strategyTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  strategyDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  actionContainer: {
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  actionNumber: {
    width: 20,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
  },
  resourcesContainer: {
    padding: spacing.md,
  },
  resourceCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  resourceTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resourceDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.md,
  },
  resourceList: {
    marginBottom: spacing.md,
  },
  resourceItem: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.md,
  },
  resourceButton: {
    alignSelf: 'flex-start',
  },
  actionsContainer: {
    padding: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
});

export default IncomeStabilityScreen;
