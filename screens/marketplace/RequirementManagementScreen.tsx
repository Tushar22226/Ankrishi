import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import database from '@react-native-firebase/database';

const RequirementManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();
  const { requirementId } = route.params as { requirementId: string };
  
  // State
  const [loading, setLoading] = useState(true);
  const [requirement, setRequirement] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [processingResponse, setProcessingResponse] = useState<string | null>(null);
  
  // Load requirement details on component mount
  useEffect(() => {
    loadRequirementDetails();
  }, [requirementId]);
  
  // Load requirement details from Firebase
  const loadRequirementDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch requirement details
      const snapshot = await database()
        .ref(`requirements/${requirementId}`)
        .once('value');
      
      const requirementData = snapshot.val();
      
      if (requirementData) {
        // Check if the current user is the owner of this requirement
        if (requirementData.userId !== userProfile?.uid) {
          Alert.alert('Access Denied', 'You can only manage your own requirements');
          navigation.goBack();
          return;
        }
        
        setRequirement(requirementData);
        
        // Process responses
        if (requirementData.responses) {
          const responsesArray = Object.values(requirementData.responses);
          responsesArray.sort((a: any, b: any) => {
            // Sort by status (accepted first, then pending, then rejected)
            if (a.status === 'accepted' && b.status !== 'accepted') return -1;
            if (a.status !== 'accepted' && b.status === 'accepted') return 1;
            if (a.status === 'pending' && b.status === 'rejected') return -1;
            if (a.status === 'rejected' && b.status === 'pending') return 1;
            
            // If same status, sort by price (for bids) or date
            if (requirementData.requirementType === 'bid') {
              return a.offeredPrice - b.offeredPrice; // Lowest price first
            } else {
              return a.createdAt - b.createdAt; // Earliest first
            }
          });
          
          setResponses(responsesArray);
        } else {
          setResponses([]);
        }
      } else {
        Alert.alert('Error', 'Requirement not found');
        navigation.goBack();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading requirement details:', error);
      Alert.alert('Error', 'Failed to load requirement details. Please try again.');
      setLoading(false);
      navigation.goBack();
    }
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Handle accepting a response
  const handleAcceptResponse = async (responseId: string) => {
    try {
      setProcessingResponse(responseId);
      
      // Check if any response is already accepted
      const hasAcceptedResponse = responses.some(response => response.status === 'accepted');
      
      if (hasAcceptedResponse) {
        Alert.alert(
          'Response Already Accepted',
          'You have already accepted a response for this requirement. Do you want to change your selection?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Change Selection', 
              onPress: async () => {
                // Update all responses to rejected except the current one
                const updates: any = {};
                
                // First set all to rejected
                responses.forEach(response => {
                  if (response.id !== responseId) {
                    updates[`requirements/${requirementId}/responses/${response.id}/status`] = 'rejected';
                    updates[`requirements/${requirementId}/responses/${response.id}/rejectedAt`] = Date.now();
                  }
                });
                
                // Then set the selected one to accepted
                updates[`requirements/${requirementId}/responses/${responseId}/status`] = 'accepted';
                updates[`requirements/${requirementId}/responses/${responseId}/acceptedAt`] = Date.now();
                
                // Update requirement status to in_progress
                updates[`requirements/${requirementId}/status`] = 'in_progress';
                
                // Apply all updates
                await database().ref().update(updates);
                
                // Reload data
                loadRequirementDetails();
                
                Alert.alert('Success', 'Response accepted successfully');
              }
            }
          ]
        );
      } else {
        // No accepted response yet, proceed with accepting this one
        const updates: any = {};
        
        // Set all other responses to rejected
        responses.forEach(response => {
          if (response.id !== responseId) {
            updates[`requirements/${requirementId}/responses/${response.id}/status`] = 'rejected';
            updates[`requirements/${requirementId}/responses/${response.id}/rejectedAt`] = Date.now();
          }
        });
        
        // Set the selected one to accepted
        updates[`requirements/${requirementId}/responses/${responseId}/status`] = 'accepted';
        updates[`requirements/${requirementId}/responses/${responseId}/acceptedAt`] = Date.now();
        
        // Update requirement status to in_progress
        updates[`requirements/${requirementId}/status`] = 'in_progress';
        
        // Apply all updates
        await database().ref().update(updates);
        
        // Reload data
        loadRequirementDetails();
        
        Alert.alert('Success', 'Response accepted successfully');
      }
    } catch (error) {
      console.error('Error accepting response:', error);
      Alert.alert('Error', 'Failed to accept response. Please try again.');
    } finally {
      setProcessingResponse(null);
    }
  };
  
  // Handle rejecting a response
  const handleRejectResponse = async (responseId: string) => {
    try {
      setProcessingResponse(responseId);
      
      // Update response status
      await database()
        .ref(`requirements/${requirementId}/responses/${responseId}`)
        .update({
          status: 'rejected',
          rejectedAt: Date.now(),
        });
      
      // Reload data
      loadRequirementDetails();
      
      Alert.alert('Success', 'Response rejected successfully');
    } catch (error) {
      console.error('Error rejecting response:', error);
      Alert.alert('Error', 'Failed to reject response. Please try again.');
    } finally {
      setProcessingResponse(null);
    }
  };
  
  // Render a response item
  const renderResponseItem = ({ item }: { item: any }) => {
    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';
    
    return (
      <Card style={styles.responseCard}>
        <View style={styles.responseHeader}>
          <View style={styles.farmerInfo}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
            <Text style={styles.farmerName}>
              {item.farmerName}
              {item.farmerVerified && (
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              )}
            </Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: isAccepted ? colors.success : isRejected ? colors.error : colors.warning }
          ]}>
            <Text style={styles.statusText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.responseContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price Offered:</Text>
            <Text style={styles.detailValue}>
              ₹{item.offeredPrice} per {requirement?.quantityUnit}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {item.offeredQuantity} {requirement?.quantityUnit}
            </Text>
          </View>
          
          {item.productDetails?.certifications?.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Certifications:</Text>
              <Text style={styles.detailValue}>
                {item.productDetails.certifications.join(', ')}
              </Text>
            </View>
          )}
          
          {item.productDetails?.pesticidefree && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pesticide-free:</Text>
              <Text style={styles.detailValue}>Yes</Text>
            </View>
          )}
          
          {item.productDetails?.moistureContent && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Moisture:</Text>
              <Text style={styles.detailValue}>{item.productDetails.moistureContent}%</Text>
            </View>
          )}
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
          
          <Text style={styles.responseDate}>
            Submitted on {formatDate(item.createdAt)}
          </Text>
          
          {isPending && (
            <View style={styles.actionButtons}>
              <Button
                title="Reject"
                onPress={() => handleRejectResponse(item.id)}
                type="secondary"
                loading={processingResponse === item.id}
                disabled={!!processingResponse}
                style={styles.actionButton}
              />
              <Button
                title="Accept"
                onPress={() => handleAcceptResponse(item.id)}
                loading={processingResponse === item.id}
                disabled={!!processingResponse}
                style={styles.actionButton}
              />
            </View>
          )}
        </View>
      </Card>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading requirement details...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Requirement</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Requirement Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.requirementHeader}>
            <View style={styles.typeContainer}>
              <Ionicons
                name={requirement?.requirementType === 'bid' ? 'hammer' : 'flash'}
                size={18}
                color={requirement?.requirementType === 'bid' ? colors.secondary : colors.success}
              />
              <Text style={styles.typeText}>
                {requirement?.requirementType === 'bid' ? 'Bidding' : 'First Come First Serve'}
              </Text>
            </View>
            
            <View style={[
              styles.statusContainer,
              { backgroundColor: getStatusColor(requirement?.status) }
            ]}>
              <Text style={styles.statusText}>
                {requirement?.status?.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.productName}>{requirement?.itemName}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity:</Text>
            <Text style={styles.summaryValue}>
              {requirement?.quantityRequired} {requirement?.quantityUnit}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expected Delivery:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(requirement?.expectedDeliveryDate)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Posted:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(requirement?.createdAt)}
            </Text>
          </View>
        </Card>
        
        {/* Responses Section */}
        <View style={styles.responsesSection}>
          <Text style={styles.sectionTitle}>Responses</Text>
          
          {responses.length === 0 ? (
            <View style={styles.emptyResponsesContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.lightGray} />
              <Text style={styles.emptyResponsesTitle}>No Responses Yet</Text>
              <Text style={styles.emptyResponsesText}>
                You haven't received any responses to this requirement yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={responses}
              renderItem={renderResponseItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.responsesList}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Get color for requirement status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return colors.info;
    case 'in_progress':
      return colors.success;
    case 'fulfilled':
      return colors.primary;
    case 'cancelled':
      return colors.error;
    default:
      return colors.mediumGray;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  statusContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  productName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 120,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  responsesSection: {
    width: '100%',
    maxWidth: 600,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyResponsesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  emptyResponsesTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyResponsesText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  responsesList: {
    width: '100%',
  },
  responseCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  responseContent: {
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 120,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  notesContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  notesLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  responseDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default RequirementManagementScreen;
