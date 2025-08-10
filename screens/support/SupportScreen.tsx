import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { useAuth } from '../../context/AuthContext';
import LoadingQuote from '../../components/LoadingQuote';

const SupportScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Support options
  const supportOptions = [
    {
      id: '1',
      title: 'Financial Support',
      description: 'Get help with financial issues, loans, and debt management',
      icon: 'cash-outline',
      color: colors.success,
      screen: 'FinancialHealth',
    },
    {
      id: '2',
      title: 'Mental Health Support',
      description: 'Access mental health resources and crisis helplines',
      icon: 'heart-outline',
      color: colors.error,
      screen: 'CrisisSupport',
    },
    {
      id: '3',
      title: 'Technical Assistance',
      description: 'Get help with app features and technical issues',
      icon: 'settings-outline',
      color: colors.primary,
      action: 'contact',
    },
    {
      id: '4',
      title: 'Report Scam',
      description: 'Report fraudulent activities or scams',
      icon: 'warning-outline',
      color: colors.warning,
      action: 'report',
    },
    {
      id: '5',
      title: 'Community Support',
      description: 'Connect with other farmers for advice and support',
      icon: 'people-outline',
      color: colors.accent,
      screen: 'FarmerNetwork',
    },
    {
      id: '6',
      title: 'Government Schemes',
      description: 'Learn about government support schemes for farmers',
      icon: 'shield-outline',
      color: '#8BC34A',
      screen: 'ViewSchemes',
    },
  ];

  // Handle support option press
  const handleSupportOptionPress = (option) => {
    if (option.screen) {
      // @ts-ignore - Navigation types are complex
      navigation.navigate(option.screen);
    } else if (option.action === 'contact') {
      Alert.alert(
        'Contact Support',
        'How would you like to contact our support team?',
        [
          {
            text: 'Email',
            onPress: () => Linking.openURL('mailto:support@farmconnect.com'),
          },
          {
            text: 'Phone',
            onPress: () => Linking.openURL('tel:+918000000000'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else if (option.action === 'report') {
      Alert.alert(
        'Report a Scam',
        'Please describe the issue you encountered. Our team will investigate and get back to you within 24 hours.',
        [
          {
            text: 'Report via Email',
            onPress: () => Linking.openURL('mailto:report@farmconnect.com?subject=Scam Report'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Render support option card
  const renderSupportOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={styles.supportCard}
      onPress={() => handleSupportOptionPress(option)}
    >
      <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
        <Ionicons name={option.icon} size={24} color={colors.white} />
      </View>
      <View style={styles.supportCardContent}>
        <Text style={styles.supportCardTitle}>{option.title}</Text>
        <Text style={styles.supportCardDescription}>{option.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote type="general" loadingText="Loading support options..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support Center</Text>
        <Text style={styles.subtitle}>
          We're here to help you succeed. How can we assist you today?
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.supportOptionsContainer}>
          {supportOptions.map(renderSupportOption)}
        </View>

        <Card style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency Support</Text>
          <Text style={styles.emergencyDescription}>
            If you're experiencing a crisis or emergency situation, please contact our 24/7 helpline immediately.
          </Text>
          <Button
            title="Call Emergency Helpline"
            onPress={() => Linking.openURL('tel:+911800117100')}
            icon="call"
            style={styles.emergencyButton}
          />
        </Card>

        <View style={styles.bottomSpacing} />
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
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.9,
  },
  scrollContainer: {
    flex: 1,
  },
  supportOptionsContainer: {
    padding: spacing.md,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  supportCardContent: {
    flex: 1,
  },
  supportCardTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  supportCardDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  emergencyCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FFEBEE',
    borderColor: colors.error,
    borderWidth: 1,
  },
  emergencyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  emergencyDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emergencyButton: {
    backgroundColor: colors.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupportScreen;
