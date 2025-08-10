import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';

import VerificationService, { VerificationStatus } from '../../services/VerificationService';

const VerifyProfileScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);

        // Check verification status
        const status = await VerificationService.getVerificationStatus(userProfile.uid);
        setVerificationStatus(status.status);
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

    // Navigate to the appropriate form based on user role
    if (userProfile.role === 'farmer') {
      navigation.navigate('FarmerVerificationForm' as never);
    } else if (userProfile.role === 'vendor' || userProfile.role === 'buyer') {
      navigation.navigate('VendorTypeSelection' as never);
    } else if (userProfile.role === 'consultant') {
      // Temporary implementation - show coming soon message
      Alert.alert(
        'Coming Soon',
        'Consultant verification forms are currently being developed. Please check back soon!',
        [{ text: 'OK' }]
      );
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
          style={styles.startButton}
        />
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
    paddingTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingTop: spacing.xl,
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
});

export default VerifyProfileScreen;
