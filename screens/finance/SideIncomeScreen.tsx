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

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card with Transportation Question */}
        <Card style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle" size={28} color={colors.primary} style={styles.cardHeaderIcon} />
            <Text style={styles.cardHeaderTitle}>Delivery Partner Program</Text>
          </View>

          <View style={styles.divider} />

          {/* Transportation Question */}
          <View style={styles.questionSection}>
            <Text style={styles.transportationTitle}>Do you have a transportation vehicle?</Text>
            <Text style={styles.transportationDescription}>
              (Car, motorcycle, bicycle, or any other vehicle that can be used for transportation)
            </Text>

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, hasTransportation && styles.activeText]}>
                {hasTransportation ? 'Yes' : 'No'}
              </Text>
              <Switch
                value={hasTransportation}
                onValueChange={setHasTransportation}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={hasTransportation ? colors.primary : colors.mediumGray}
                style={styles.switch}
              />
            </View>
          </View>

          {hasTransportation && (
            <View style={styles.opportunityContainer}>
              <View style={styles.opportunityHeader}>
                <Ionicons name="star" size={28} color={colors.secondary} />
                <Text style={styles.opportunityHeaderText}>Great Opportunity!</Text>
              </View>

              <Text style={styles.opportunityDescription}>
                You have a great opportunity to work with us as a delivery partner.
                Earn extra income by delivering farm products to customers in your area.
              </Text>

              <View style={styles.benefitsRow}>
                <View style={styles.benefitBadge}>
                  <Ionicons name="time-outline" size={16} color={colors.white} />
                  <Text style={styles.benefitBadgeText}>Flexible Hours</Text>
                </View>
                <View style={styles.benefitBadge}>
                  <Ionicons name="cash-outline" size={16} color={colors.white} />
                  <Text style={styles.benefitBadgeText}>Extra Income</Text>
                </View>
              </View>

              <Button
                title={isApplying ? "Applying..." : "Apply Now"}
                onPress={handleApplyNow}
                style={styles.applyButton}
                disabled={isApplying}
                leftIcon={isApplying ?
                  <ActivityIndicator size="small" color={colors.white} /> :
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                }
              />
            </View>
          )}
        </Card>

        {/* Side Income Opportunities */}
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="cash" size={24} color={colors.primary} style={styles.sectionTitleIcon} />
          <Text style={styles.sectionTitle}>Explore Side Income Opportunities</Text>
        </View>

        {sideIncomeOpportunities.map((opportunity) => (
          <Card key={opportunity.id} style={styles.opportunityCard}>
            <View style={styles.opportunityIconContainer}>
              <Ionicons name={opportunity.icon as any} size={32} color={colors.white} />
            </View>

            <View style={styles.opportunityContent}>
              <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
              <Text style={styles.opportunitySubtitle}>{opportunity.description}</Text>

              <View style={styles.earningsContainer}>
                <Ionicons name="cash-outline" size={18} color={colors.success} />
                <Text style={styles.earningsText}>Potential earnings: {opportunity.earnings}</Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.requirementsTitle}>Requirements:</Text>
                {opportunity.requirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}

                <Text style={styles.benefitsTitle}>Benefits:</Text>
                {opportunity.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
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
    marginTop:40,
    backgroundColor: colors.background,
    ...Platform.select({
      android: {
        paddingTop: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: getPlatformTopSpacing() + 12,
    paddingBottom: 12,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
        marginBottom: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 80,
  },
  mainCard: {
    padding: 0,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardHeaderIcon: {
    marginRight: 12,
  },
  cardHeaderTitle: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: 0,
  },
  questionSection: {
    padding: 16,
  },
  transportationTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '600',
  },
  transportationDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
    fontSize: 16,
  },
  activeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  opportunityContainer: {
    marginTop: 0,
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  opportunityHeaderText: {
    ...typography.h3,
    color: colors.secondary,
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  opportunityDescription: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  benefitsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 4,
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  benefitBadgeText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 13,
    marginLeft: 6,
  },
  applyButton: {
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  opportunityCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
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
  opportunityIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  opportunityContent: {
    flex: 1,
    paddingRight: 4,
  },
  opportunityTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
    fontSize: 17,
    fontWeight: '600',
  },
  opportunitySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  earningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  earningsText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  infoContainer: {
    marginTop: 4,
  },
  requirementsTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  benefitsTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default SideIncomeScreen;
