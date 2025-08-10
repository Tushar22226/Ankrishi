import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import database from '@react-native-firebase/database';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import VerificationService, { VerificationStatus } from '../../services/VerificationService';

const VerifyProfileScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
  const [hasEnoughOrders, setHasEnoughOrders] = useState(false);
  const [successfulOrdersCount, setSuccessfulOrdersCount] = useState(0);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);

        // Check verification status
        const status = await VerificationService.getVerificationStatus(userProfile.uid);
        setVerificationStatus(status.status);

        // Get user's reputation to check successful orders count
        const userRef = database().ref(`users/${userProfile.uid}`);
        const snapshot = await userRef.once('value');

        if (snapshot.exists()) {
          const userData = snapshot.val() as UserProfile;
          const orderCount = userData.reputation?.successfulOrders || 0;
          setSuccessfulOrdersCount(orderCount);
          setHasEnoughOrders(orderCount >= 5);
        } else {
          setSuccessfulOrdersCount(0);
          setHasEnoughOrders(false);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        Alert.alert('Error', 'Failed to check verification status');
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [userProfile]);

  const handleStartVerification = () => {
    if (!userProfile) return;

    if (!hasEnoughOrders) {
      Alert.alert(
        'Not Eligible',
        'You need at least 5 successful orders to apply for verification.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to the appropriate form based on user role
    if (userProfile.role === 'farmer') {
      navigation.navigate('FarmerVerificationForm');
    } else if (userProfile.role === 'vendor' || userProfile.role === 'buyer') {
      navigation.navigate('VendorTypeSelection');
    } else if (userProfile.role === 'consultant') {
      navigation.navigate('ConsultantVerificationForm');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator,
            verificationStatus === 'verified' && styles.verifiedIndicator,
            verificationStatus === 'pending' && styles.pendingIndicator,
          ]}>
            <Ionicons
              name={
                verificationStatus === 'verified' ? 'checkmark' :
                verificationStatus === 'pending' ? 'time' : 'alert'
              }
              size={24}
              color={colors.white}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {verificationStatus === 'verified' ? 'Verified Account' :
               verificationStatus === 'pending' ? 'Verification Pending' : 'Unverified Account'}
            </Text>
            <Text style={styles.statusDescription}>
              {verificationStatus === 'verified' ? 'Your account has been verified.' :
               verificationStatus === 'pending' ? 'Your verification request is being reviewed.' :
               'Verify your account to build trust with other users.'}
            </Text>
          </View>
        </View>
      </Card>

      {verificationStatus === 'unverified' && (
        <Button
          title="Start Verification Process"
          onPress={handleStartVerification}
          disabled={!hasEnoughOrders}
          style={styles.startButton}
        />
      )}

      {verificationStatus === 'unverified' && (
        <View style={styles.orderProgressContainer}>
          <Text style={styles.requirementText}>
            {hasEnoughOrders
              ? 'You have completed the required number of orders for verification.'
              : successfulOrdersCount === 0
                ? 'You need at least 5 successful orders to apply for verification.'
                : successfulOrdersCount === 1
                  ? 'You have 1 successful order. Complete 4 more to apply for verification.'
                  : successfulOrdersCount === 4
                    ? 'You have 4 successful orders. Just 1 more to apply for verification!'
                    : `You have ${successfulOrdersCount} successful orders. Complete ${5 - successfulOrdersCount} more to apply for verification.`
            }
          </Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(successfulOrdersCount / 5 * 100, 100)}%` },
                  successfulOrdersCount === 0 ? styles.progressBarEmpty :
                  successfulOrdersCount < 3 ? styles.progressBarLow :
                  successfulOrdersCount < 5 ? styles.progressBarMedium :
                  styles.progressBarFull
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {successfulOrdersCount} / 5 successful orders
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: 30,
  },
  contentContainer: {
    padding: 18,
    paddingTop: getPlatformTopSpacing(),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingTop: getPlatformTopSpacing(),
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#2E3A59',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E3A59',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 42,
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  statusIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  verifiedIndicator: {
    backgroundColor: '#10B981',
  },
  pendingIndicator: {
    backgroundColor: '#F59E0B',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 6,
  },
  statusDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  startButton: {
    marginTop: 20,
    marginHorizontal: 4,
    height: 52,
    borderRadius: 12,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 24,
    fontStyle: 'italic',
  },
  orderProgressContainer: {
    marginTop: 16,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressBarEmpty: {
    backgroundColor: '#9CA3AF',
  },
  progressBarLow: {
    backgroundColor: '#F59E0B',
  },
  progressBarMedium: {
    backgroundColor: '#3B82F6',
  },
  progressBarFull: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
  },
});

export default VerifyProfileScreen;
