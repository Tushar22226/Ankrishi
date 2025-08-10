import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { database } from '../../firebase/config';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

// Side income opportunities
const sideIncomeOpportunities = [
  {
    id: 'delivery',
    title: 'Delivery Partner',
    description: 'Use your vehicle to deliver farm products to customers',
    icon: 'bicycle',
    requirements: ['Transportation vehicle', 'Valid driver\'s license', 'Smartphone with internet'],
    earnings: '₹200-500 per delivery',
    benefits: [
      'Flexible working hours',
      'Work when you want',
      'Earn extra income during off-season',
    ],
  },
  {
    id: 'aggregator',
    title: 'Local Aggregator',
    description: 'Collect produce from nearby farms and sell to vendors',
    icon: 'people',
    requirements: ['Good network of local farmers', 'Basic business knowledge', 'Transportation'],
    earnings: '5-10% commission on sales',
    benefits: [
      'Build your local network',
      'No upfront investment needed',
      'Help other farmers access markets',
    ],
  },
  {
    id: 'processing',
    title: 'Food Processing',
    description: 'Convert raw produce into processed goods for higher value',
    icon: 'restaurant',
    requirements: ['Basic processing equipment', 'Food safety knowledge', 'Storage space'],
    earnings: '30-50% markup on processed goods',
    benefits: [
      'Add value to unsold produce',
      'Extend shelf life of products',
      'Access premium markets',
    ],
  },
  {
    id: 'training',
    title: 'Farming Trainer',
    description: 'Share your knowledge with new farmers',
    icon: 'school',
    requirements: ['Farming experience', 'Communication skills', 'Willingness to teach'],
    earnings: '₹500-1000 per training session',
    benefits: [
      'Share your expertise',
      'Build your reputation',
      'Network with other farmers',
    ],
  },
  {
    id: 'equipment',
    title: 'Equipment Rental',
    description: 'Rent out your farming equipment when not in use',
    icon: 'construct',
    requirements: ['Ownership of farming equipment', 'Maintenance knowledge', 'Storage space'],
    earnings: '10-15% of equipment value per month',
    benefits: [
      'Generate income from idle equipment',
      'Help other farmers access equipment',
      'Build local relationships',
    ],
  },
];

const SideIncomeScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [hasTransportation, setHasTransportation] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // Request location permission on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  // Handle apply now button press
  const handleApplyNow = async () => {
    if (!userProfile?.uid) {
      Alert.alert('Error', 'You must be logged in to apply');
      return;
    }

    try {
      setIsApplying(true);

      // Get current location if not already available
      let currentLocation = location;
      if (!currentLocation && locationPermission) {
        currentLocation = await Location.getCurrentPositionAsync({});
      }

      // Create transport applicant entry in database
      const applicantRef = database().ref('transport_applicants').push();
      
      await applicantRef.set({
        userId: userProfile.uid,
        name: userProfile.displayName || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        location: currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        } : null,
        hasTransportation: hasTransportation,
        status: 'pending',
        appliedAt: Date.now(),
      });

      setIsApplying(false);
      Alert.alert(
        'Application Submitted',
        'Thank you for your interest! Our team will contact you soon with more details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsApplying(false);
      Alert.alert('Error', 'Failed to submit your application. Please try again later.');
    }
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
        <Text style={styles.headerTitle}>Side Income Opportunities</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Transportation Question */}
        <Card style={styles.transportationCard}>
          <Text style={styles.transportationTitle}>Do you have a transportation vehicle?</Text>
          <Text style={styles.transportationDescription}>
            (Car, motorcycle, bicycle, or any other vehicle that can be used for transportation)
          </Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{hasTransportation ? 'Yes' : 'No'}</Text>
            <Switch
              value={hasTransportation}
              onValueChange={setHasTransportation}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={hasTransportation ? colors.primary : colors.mediumGray}
            />
          </View>

          {hasTransportation && (
            <View style={styles.opportunityContainer}>
              <View style={styles.opportunityHeader}>
                <Ionicons name="star" size={24} color={colors.secondary} />
                <Text style={styles.opportunityHeaderText}>Great Opportunity!</Text>
              </View>
              
              <Text style={styles.opportunityDescription}>
                You have a great opportunity to work with us as a delivery partner. 
                Earn extra income by delivering farm products to customers in your area.
              </Text>

              <Button
                title={isApplying ? "Applying..." : "Apply Now"}
                onPress={handleApplyNow}
                style={styles.applyButton}
                disabled={isApplying}
                leftIcon={isApplying ? 
                  <ActivityIndicator size="small" color={colors.white} /> : 
                  <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                }
              />
            </View>
          )}
        </Card>

        {/* Side Income Opportunities */}
        <Text style={styles.sectionTitle}>Explore Side Income Opportunities</Text>
        
        {sideIncomeOpportunities.map((opportunity) => (
          <Card key={opportunity.id} style={styles.opportunityCard}>
            <View style={styles.opportunityIconContainer}>
              <Ionicons name={opportunity.icon as any} size={32} color={colors.white} />
            </View>
            
            <View style={styles.opportunityContent}>
              <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
              <Text style={styles.opportunitySubtitle}>{opportunity.description}</Text>
              
              <View style={styles.earningsContainer}>
                <Ionicons name="cash-outline" size={16} color={colors.success} />
                <Text style={styles.earningsText}>Potential earnings: {opportunity.earnings}</Text>
              </View>
              
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              {opportunity.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
              
              <Text style={styles.benefitsTitle}>Benefits:</Text>
              {opportunity.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="arrow-forward" size={14} color={colors.secondary} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingTop: getPlatformTopSpacing() + spacing.medium,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.large,
    marginBottom: spacing.medium,
  },
  transportationCard: {
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  transportationTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  transportationDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.medium,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  opportunityContainer: {
    marginTop: spacing.medium,
    padding: spacing.medium,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.medium,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  opportunityHeaderText: {
    ...typography.h3,
    color: colors.secondary,
    marginLeft: spacing.small,
  },
  opportunityDescription: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  applyButton: {
    backgroundColor: colors.success,
  },
  opportunityCard: {
    flexDirection: 'row',
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  opportunityIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  opportunityContent: {
    flex: 1,
  },
  opportunityTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  opportunitySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  earningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  earningsText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '500',
    marginLeft: spacing.tiny,
  },
  requirementsTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.tiny,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.tiny,
  },
  requirementText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.tiny,
  },
  benefitsTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.small,
    marginBottom: spacing.tiny,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.tiny,
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.tiny,
  },
});

export default SideIncomeScreen;
