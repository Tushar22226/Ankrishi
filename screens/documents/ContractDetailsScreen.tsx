import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Contract, ContractBid } from '../../models/Contract';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import ContractService from '../../services/ContractService';
import LoadingQuote from '../../components/LoadingQuote';

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return colors.success;
    case 'pending':
      return colors.warning;
    case 'completed':
      return colors.primary;
    case 'cancelled':
      return colors.error;
    case 'expired':
      return colors.textSecondary;
    default:
      return colors.textSecondary;
  }
};

// Get grade badge style
const getGradeBadgeStyle = (grade: string): { backgroundColor: string } => {
  switch (grade) {
    case 'A+':
      return { backgroundColor: '#4CAF50' }; // Dark green
    case 'A':
      return { backgroundColor: '#8BC34A' }; // Light green
    case 'B+':
      return { backgroundColor: '#CDDC39' }; // Lime
    case 'B':
      return { backgroundColor: '#FFEB3B' }; // Yellow
    case 'C':
      return { backgroundColor: '#FFC107' }; // Amber
    default:
      return { backgroundColor: colors.primary };
  }
};

type ParamList = {
  ContractDetails: {
    contractId: string;
  };
};

const ContractDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'ContractDetails'>>();
  const { userProfile } = useAuth();
  const { contractId } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState(false);
  const [rejectingBid, setRejectingBid] = useState(false);

  // Load contract on component mount
  useEffect(() => {
    loadContract();
  }, [contractId]);

  // Load contract
  const loadContract = async () => {
    try {
      setLoading(true);

      console.log('Loading contract with ID:', contractId);
      const contractData = await ContractService.getContractById(contractId);

      if (contractData) {
        console.log('Contract loaded successfully:', contractData);

        // Ensure bids array exists and is an array
        if (!contractData.bids || !Array.isArray(contractData.bids)) {
          console.log('Initializing empty bids array');
          contractData.bids = [];
        }

        setContract(contractData);
      } else {
        console.error('Contract not found with ID:', contractId);
        Alert.alert('Error', 'Contract not found');
        navigation.goBack();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading contract:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load contract: ' + (error as Error).message);
    }
  };

  // Submit a bid
  const handleSubmitBid = async () => {
    if (!contract || !userProfile) {
      Alert.alert('Error', 'Contract or user profile not found');
      return;
    }

    // Validate required fields
    if (!bidAmount.trim()) {
      Alert.alert('Error', 'Please enter a bid amount');
      return;
    }

    if (!companyName.trim()) {
      Alert.alert('Error', userProfile.role === 'farmer' ? 'Please enter your farm name' : 'Please enter your company name');
      return;
    }

    if (!companyAddress.trim()) {
      Alert.alert('Error', userProfile.role === 'farmer' ? 'Please enter your farm address' : 'Please enter your company address');
      return;
    }

    if (!contactPerson.trim()) {
      Alert.alert('Error', 'Please enter contact person name');
      return;
    }

    if (!contactPhone.trim()) {
      Alert.alert('Error', 'Please enter contact phone number');
      return;
    }

    const amount = Number(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Bid amount must be a positive number');
      return;
    }

    try {
      setSubmittingBid(true);

      const bid: Omit<ContractBid, 'id'> = {
        contractId: contract.id,
        bidderId: userProfile.uid,
        bidderUsername: userProfile.username || '',
        bidderRole: userProfile.role,
        bidAmount: amount,
        bidDate: Date.now(),
        status: 'pending',
        notes: bidNotes.trim() || undefined,
        // Company details
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        experience: experience.trim() || undefined,
      };

      await ContractService.submitBid(bid);

      setSubmittingBid(false);
      setBidAmount('');
      setBidNotes('');
      setCompanyName('');
      setCompanyAddress('');
      setContactPerson('');
      setContactPhone('');
      setContactEmail('');
      setGstNumber('');
      setExperience('');

      Alert.alert('Success', 'Bid submitted successfully');

      // Reload contract to show the new bid
      loadContract();
    } catch (error) {
      console.error('Error submitting bid:', error);
      setSubmittingBid(false);
      Alert.alert('Error', 'Failed to submit bid: ' + (error as Error).message);
    }
  };

  // Accept a bid
  const handleAcceptBid = async (bid: ContractBid) => {
    if (!contract || !userProfile) {
      Alert.alert('Error', 'Contract or user profile not found');
      return;
    }

    // Only the contract creator can accept bids
    if (contract.creatorId !== userProfile.uid) {
      Alert.alert('Error', 'Only the contract creator can accept bids');
      return;
    }

    // Confirm before accepting
    Alert.alert(
      'Confirm Acceptance',
      `Are you sure you want to accept the bid from ${bid.bidderUsername} for ${formatCurrency(bid.bidAmount)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Accept Bid',
          onPress: async () => {
            try {
              setAcceptingBid(true);

              console.log('Accepting bid with details:', {
                contractId: contract.id,
                bidId: bid.id,
                bidderId: bid.bidderId,
                bidderUsername: bid.bidderUsername
              });

              // Accept the bid and get the chat ID
              const result = await ContractService.acceptBid(
                contract.id,
                bid.id,
                bid.bidderId,
                bid.bidderUsername
              );

              setAcceptingBid(false);

              // Show success message and ask if they want to open the chat
              Alert.alert(
                'Bid Accepted',
                'The bid has been accepted successfully. A chat has been created for you to communicate with the other party.',
                [
                  {
                    text: 'View Contract',
                    onPress: () => loadContract()
                  },
                  {
                    text: 'Open Chat',
                    onPress: () => {
                      // Navigate to the chat screen
                      // @ts-ignore - Navigation types are complex
                      navigation.navigate('ChatScreen', {
                        chatId: result.chatId,
                        recipientId: bid.bidderId,
                        recipientName: bid.bidderUsername,
                        recipientPhoto: '',
                        isGroup: false,
                      });
                    }
                  }
                ]
              );

              // Reload contract to show the updated status
              loadContract();
            } catch (error) {
              console.error('Error accepting bid:', error);
              setAcceptingBid(false);

              // Show a more detailed error message
              const errorMessage = (error as Error).message;
              Alert.alert(
                'Error',
                `Failed to accept bid: ${errorMessage}`,
                [
                  {
                    text: 'OK'
                  },
                  {
                    text: 'Try Again',
                    onPress: () => loadContract()
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Reject a bid
  const handleRejectBid = async (bid: ContractBid) => {
    if (!contract || !userProfile) {
      Alert.alert('Error', 'Contract or user profile not found');
      return;
    }

    // Only the contract creator can reject bids
    if (contract.creatorId !== userProfile.uid) {
      Alert.alert('Error', 'Only the contract creator can reject bids');
      return;
    }

    // Confirm before rejecting
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to reject the bid from ${bid.bidderUsername} for ${formatCurrency(bid.bidAmount)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject Bid',
          style: 'destructive',
          onPress: async () => {
            try {
              setRejectingBid(true);

              console.log('Rejecting bid with details:', {
                contractId: contract.id,
                bidId: bid.id,
                bidderId: bid.bidderId,
                bidderUsername: bid.bidderUsername
              });

              // Update the bid status to rejected
              await ContractService.updateBidStatus(contract.id, bid.id, 'rejected');

              setRejectingBid(false);

              Alert.alert('Success', 'Bid rejected successfully');

              // Reload contract to show the updated status
              loadContract();
            } catch (error) {
              console.error('Error rejecting bid:', error);
              setRejectingBid(false);

              // Show a more detailed error message
              const errorMessage = (error as Error).message;
              Alert.alert(
                'Error',
                `Failed to reject bid: ${errorMessage}`,
                [
                  {
                    text: 'OK'
                  },
                  {
                    text: 'Try Again',
                    onPress: () => loadContract()
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Helper function to convert between acres and hectares
  const convertLandArea = (value: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return value;

    // Convert from acres to hectares
    if ((fromUnit === 'acres' || fromUnit === 'acre') && (toUnit === 'hectares' || toUnit === 'hectare')) {
      return value * 0.404686; // 1 acre = 0.404686 hectares
    }

    // Convert from hectares to acres
    if ((fromUnit === 'hectares' || fromUnit === 'hectare') && (toUnit === 'acres' || toUnit === 'acre')) {
      return value * 2.47105; // 1 hectare = 2.47105 acres
    }

    return value; // Default case, should not happen
  };

  // Check if farmer has enough land area for the contract
  const hasSufficientLandArea = (): boolean => {
    if (!contract || !userProfile || userProfile.role !== 'farmer') {
      return false;
    }

    // Only check land area for farming contracts
    if (contract.type !== 'farming' || !contract.farmingDetails) {
      return true; // Not a farming contract, so land area is not relevant
    }

    // Get the contract's required land area
    const contractLandArea = contract.farmingDetails.landArea;
    const contractLandUnit = contract.farmingDetails.landAreaUnit;

    // Get the farmer's land area
    const farmerLandArea = userProfile.farmDetails?.landOwned || 0;
    const farmerLandUnit = userProfile.farmDetails?.landUnit || 'acres';

    // Convert to the same unit for comparison (using contract's unit as the base)
    const normalizedFarmerLandArea = convertLandArea(farmerLandArea, farmerLandUnit, contractLandUnit);

    console.log('Land area comparison:', {
      contractLandArea,
      contractLandUnit,
      farmerLandArea,
      farmerLandUnit,
      normalizedFarmerLandArea
    });

    // Check if farmer has enough land
    return normalizedFarmerLandArea >= contractLandArea;
  };

  // Check if user can bid
  const canBid = (): boolean => {
    if (!contract || !userProfile) {
      console.log('Cannot bid: contract or userProfile is null');
      return false;
    }

    // Ensure bids array exists and is an array
    if (!contract.bids || !Array.isArray(contract.bids)) {
      console.log('Initializing empty bids array for canBid check');
      contract.bids = [];
    }

    // For debugging
    const isCreator = contract.creatorId === userProfile.uid;
    const isSecondParty = contract.parties.secondPartyId === userProfile.uid;
    const isTender = contract.isTender;
    const tenderEnded = contract.tenderEndDate && contract.tenderEndDate < Date.now();
    const hasAlreadyBid = Array.isArray(contract.bids) &&
      contract.bids.some(bid => bid.bidderId === userProfile.uid);

    console.log('Checking if user can bid:', {
      userRole: userProfile.role,
      isCreator,
      isSecondParty,
      isTender,
      tenderEnded,
      hasAlreadyBid,
      bidsLength: Array.isArray(contract.bids) ? contract.bids.length : 0
    });

    // User cannot bid on their own contract
    if (isCreator) {
      console.log('Cannot bid: user is the creator');
      return false;
    }

    // User cannot bid if they are already the second party
    if (isSecondParty) {
      console.log('Cannot bid: user is already the second party');
      return false;
    }

    // User cannot bid if the contract is not a tender
    if (!isTender) {
      console.log('Cannot bid: contract is not a tender');
      return false;
    }

    // User cannot bid if the tender has ended
    if (tenderEnded) {
      console.log('Cannot bid: tender has ended');
      return false;
    }

    // User cannot bid if they have already bid
    if (hasAlreadyBid) {
      console.log('Cannot bid: user has already bid');
      return false;
    }

    // User must be a vendor, buyer, or farmer to bid
    if (userProfile.role !== 'vendor' && userProfile.role !== 'buyer' && userProfile.role !== 'farmer') {
      console.log('Cannot bid: user is not a vendor, buyer, or farmer');
      return false;
    }

    // For farmers, check if they have enough land area for farming contracts
    if (userProfile.role === 'farmer' && contract.type === 'farming' && !hasSufficientLandArea()) {
      console.log('Cannot bid: farmer does not have enough land area');
      return false;
    }

    console.log('User can bid!');
    return true;
  };

  // Check if user has already submitted a bid
  const hasUserBid = (): boolean => {
    if (!contract || !userProfile || !Array.isArray(contract.bids)) {
      return false;
    }

    return contract.bids.some(bid => bid.bidderId === userProfile.uid);
  };

  // Get user's bid if they have submitted one
  const getUserBid = (): ContractBid | undefined => {
    if (!contract || !userProfile || !Array.isArray(contract.bids)) {
      return undefined;
    }

    return contract.bids.find(bid => bid.bidderId === userProfile.uid);
  };

  // Check if user can accept bids
  const canAcceptBids = (): boolean => {
    if (!contract || !userProfile) {
      console.log('Cannot accept bids: contract or userProfile is null');
      return false;
    }

    // Ensure bids array exists and is an array
    if (!contract.bids || !Array.isArray(contract.bids)) {
      console.log('Initializing empty bids array for canAcceptBids check');
      contract.bids = [];
    }

    console.log('Checking if user can accept bids:', {
      isCreator: contract.creatorId === userProfile.uid,
      isTender: contract.isTender,
      hasBids: Array.isArray(contract.bids) && contract.bids.length > 0,
      hasSecondParty: !!contract.parties.secondPartyId
    });

    // Only the contract creator can accept bids
    if (contract.creatorId !== userProfile.uid) {
      console.log('Cannot accept bids: user is not the creator');
      return false;
    }

    // Cannot accept bids if the contract is not a tender
    if (!contract.isTender) {
      console.log('Cannot accept bids: contract is not a tender');
      return false;
    }

    // Cannot accept bids if there are no bids
    if (!Array.isArray(contract.bids) || contract.bids.length === 0) {
      console.log('Cannot accept bids: no bids available');
      return false;
    }

    // Cannot accept bids if the contract already has a second party
    if (contract.parties.secondPartyId) {
      console.log('Cannot accept bids: contract already has a second party');
      return false;
    }

    // Check if there are any pending bids
    const hasPendingBids = Array.isArray(contract.bids) &&
      contract.bids.some(bid => bid.status === 'pending');
    if (!hasPendingBids) {
      console.log('Cannot accept bids: no pending bids');
      return false;
    }

    console.log('User can accept bids!');
    return true;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Contract not found</Text>
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

        <Text style={styles.title}>Contract Details</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.contractCard}>
          <View style={styles.contractHeader}>
            <Text style={styles.contractTitle}>{contract.title}</Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(contract.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Text>
            </View>
          </View>

          {contract.isTender && (
            <View style={styles.tenderHeader}>
              <View style={styles.tenderBadge}>
                <Ionicons name="megaphone" size={16} color={colors.white} />
                <Text style={styles.tenderText}>Tender</Text>
              </View>

              {userProfile && (userProfile.role === 'vendor' || userProfile.role === 'buyer' || userProfile.role === 'farmer') && (
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    hasUserBid() ? styles.alreadyAppliedButton : !canBid() && styles.disabledApplyButton
                  ]}
                  onPress={() => {
                    if (hasUserBid()) {
                      // If user has already bid, scroll to their bid status
                      Alert.alert(
                        'Bid Already Submitted',
                        'You have already applied to this tender. Scroll down to see your bid status.',
                        [
                          { text: 'OK', onPress: () => console.log('OK Pressed') }
                        ]
                      );
                    } else if (canBid()) {
                      // Scroll to the bid form at the bottom
                      Alert.alert(
                        'Apply to Tender',
                        'Scroll down to the bottom of the page to submit your bid with company details.',
                        [
                          { text: 'OK', onPress: () => console.log('OK Pressed') }
                        ]
                      );
                    } else {
                      // Explain why they can't bid
                      let message = 'You cannot apply to this tender.';

                      if (contract.creatorId === userProfile.uid) {
                        message = 'You cannot apply to your own tender.';
                      } else if (contract.parties.secondPartyId === userProfile.uid) {
                        message = 'You are already a party to this contract.';
                      } else if (contract.tenderEndDate && contract.tenderEndDate < Date.now()) {
                        message = 'This tender has already closed.';
                      } else if (userProfile.role === 'farmer' && contract.type === 'farming' && !hasSufficientLandArea()) {
                        const requiredArea = contract.farmingDetails?.landArea || 0;
                        const requiredUnit = contract.farmingDetails?.landAreaUnit || 'acre';
                        const farmerArea = userProfile.farmDetails?.landOwned || 0;
                        const farmerUnit = userProfile.farmDetails?.landUnit || 'acres';
                        message = `You don't have enough land area for this contract. Required: ${requiredArea} ${requiredUnit}, Your land: ${farmerArea} ${farmerUnit}.`;
                      }

                      Alert.alert('Cannot Apply', message);
                    }
                  }}
                >
                  <Ionicons
                    name={hasUserBid() ? "checkmark-done-circle" : canBid() ? "checkmark-circle" : "information-circle"}
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.applyButtonText}>
                    {hasUserBid() ? 'Already Applied' : canBid() ? 'Apply to Tender' : 'Tender Info'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.contractDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {contract.type.charAt(0).toUpperCase() + contract.type.slice(1)} Contract
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Parties:</Text>
              <View style={styles.partiesContainer}>
                <View style={styles.partyRow}>
                  <Text style={styles.partyText}>
                    {contract.parties.firstPartyUsername} (Creator)
                  </Text>
                  {contract.parties.firstPartyVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                    </View>
                  )}
                </View>
                {contract.parties.secondPartyUsername && (
                  <View style={styles.partyRow}>
                    <Text style={styles.partyText}>
                      {contract.parties.secondPartyUsername}
                    </Text>
                    {contract.parties.secondPartyVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Period:</Text>
              <Text style={styles.detailValue}>
                {formatDate(new Date(contract.startDate))} - {formatDate(new Date(contract.endDate))}
              </Text>
            </View>

            {contract.isTender && contract.tenderEndDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tender Closes:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(new Date(contract.tenderEndDate))}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Value:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(contract.value)}
              </Text>
            </View>

            {contract.quantity && contract.unit && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>
                  {contract.quantity} {contract.unit}
                </Text>
              </View>
            )}

            {contract.pricePerUnit && contract.unit && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price Per Unit:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(contract.pricePerUnit)} per {contract.unit}
                </Text>
              </View>
            )}

            <View style={styles.descriptionContainer}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{contract.description}</Text>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.detailLabel}>Terms:</Text>
              {contract.terms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <Text style={styles.termNumber}>{index + 1}.</Text>
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
            </View>

            {contract.paymentTerms && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Terms:</Text>
                <Text style={styles.detailValue}>{contract.paymentTerms}</Text>
              </View>
            )}

            {contract.deliveryTerms && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Terms:</Text>
                <Text style={styles.detailValue}>{contract.deliveryTerms}</Text>
              </View>
            )}

            {contract.qualityStandards && contract.qualityStandards.length > 0 && (
              <View style={styles.termsContainer}>
                <Text style={styles.detailLabel}>Quality Standards:</Text>
                {contract.qualityStandards.map((standard, index) => (
                  <View key={index} style={styles.termItem}>
                    <Text style={styles.termNumber}>{index + 1}.</Text>
                    <Text style={styles.termText}>{standard}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Farming Contract Details */}
            {contract.type === 'farming' && contract.farmingDetails && (
              <View style={styles.farmingDetailsContainer}>
                <Text style={styles.farmingSectionTitle}>Farming Contract Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Crop Type:</Text>
                  <Text style={styles.detailValue}>{contract.farmingDetails.cropType}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Land Area:</Text>
                  <Text style={styles.detailValue}>
                    {contract.farmingDetails.landArea} {contract.farmingDetails.landAreaUnit}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expected Yield:</Text>
                  <Text style={styles.detailValue}>
                    {contract.farmingDetails.expectedYield} {contract.farmingDetails.yieldUnit}
                  </Text>
                </View>

                <View style={styles.termsContainer}>
                  <Text style={styles.detailLabel}>Farming Practices:</Text>
                  {contract.farmingDetails.farmingPractices.map((practice, index) => (
                    <View key={index} style={styles.termItem}>
                      <Text style={styles.termNumber}>{index + 1}.</Text>
                      <Text style={styles.termText}>{practice}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.supportProvisionContainer}>
                  <Text style={styles.detailLabel}>Support Provisions:</Text>
                  <View style={styles.supportProvisionList}>
                    <View style={styles.supportProvisionItem}>
                      <View style={[
                        styles.supportProvisionIndicator,
                        contract.farmingDetails.seedProvision ? styles.provisionIncluded : styles.provisionExcluded
                      ]}>
                        <Ionicons
                          name={contract.farmingDetails.seedProvision ? "checkmark" : "close"}
                          size={16}
                          color={colors.white}
                        />
                      </View>
                      <Text style={styles.supportProvisionText}>Seed Provision</Text>
                    </View>

                    <View style={styles.supportProvisionItem}>
                      <View style={[
                        styles.supportProvisionIndicator,
                        contract.farmingDetails.inputProvision ? styles.provisionIncluded : styles.provisionExcluded
                      ]}>
                        <Ionicons
                          name={contract.farmingDetails.inputProvision ? "checkmark" : "close"}
                          size={16}
                          color={colors.white}
                        />
                      </View>
                      <Text style={styles.supportProvisionText}>Input Provision (Fertilizers, etc.)</Text>
                    </View>

                    <View style={styles.supportProvisionItem}>
                      <View style={[
                        styles.supportProvisionIndicator,
                        contract.farmingDetails.harvestingSupport ? styles.provisionIncluded : styles.provisionExcluded
                      ]}>
                        <Ionicons
                          name={contract.farmingDetails.harvestingSupport ? "checkmark" : "close"}
                          size={16}
                          color={colors.white}
                        />
                      </View>
                      <Text style={styles.supportProvisionText}>Harvesting Support</Text>
                    </View>
                  </View>
                </View>

                {contract.farmingDetails.qualityParameters && contract.farmingDetails.qualityParameters.length > 0 && (
                  <View style={styles.qualityParametersContainer}>
                    <Text style={styles.detailLabel}>Quality Parameters:</Text>
                    {contract.farmingDetails.qualityParameters.map((param, index) => (
                      <View key={index} style={styles.qualityParameterItem}>
                        <Text style={styles.qualityParameterName}>{param.parameter}</Text>
                        <View style={styles.qualityParameterValues}>
                          {param.minValue !== undefined && (
                            <Text style={styles.qualityParameterValue}>
                              Min: {param.minValue}{param.unit ? ` ${param.unit}` : ''}
                            </Text>
                          )}
                          {param.maxValue !== undefined && (
                            <Text style={styles.qualityParameterValue}>
                              Max: {param.maxValue}{param.unit ? ` ${param.unit}` : ''}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {contract.farmingDetails.paymentSchedule && contract.farmingDetails.paymentSchedule.length > 0 && (
                  <View style={styles.paymentScheduleContainer}>
                    <Text style={styles.detailLabel}>Payment Schedule:</Text>
                    {contract.farmingDetails.paymentSchedule.map((schedule, index) => (
                      <View key={index} style={styles.paymentScheduleItem}>
                        <View style={styles.paymentScheduleHeader}>
                          <Text style={styles.paymentMilestone}>{schedule.milestone}</Text>
                          <Text style={styles.paymentPercentage}>{schedule.percentage}%</Text>
                        </View>
                        {schedule.estimatedDate && (
                          <Text style={styles.paymentDate}>
                            Estimated Date: {formatDate(new Date(schedule.estimatedDate))}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* AACC Certification Requirements */}
                {contract.farmingDetails.aaccRequirements && contract.farmingDetails.aaccRequirements.isRequired && (
                  <View style={styles.aaccRequirementsContainer}>
                    <View style={styles.aaccHeader}>
                      <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                      <Text style={styles.aaccTitle}>AACC Certification Required</Text>
                    </View>

                    <Text style={styles.aaccDescription}>
                      This contract requires Agricultural and Allied Commodities Certification (AACC)
                      to ensure quality, safety, and authenticity of the produce.
                    </Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Minimum Grade:</Text>
                      <View style={[
                        styles.gradeBadge,
                        getGradeBadgeStyle(contract.farmingDetails.aaccRequirements.minimumGrade)
                      ]}>
                        <Text style={styles.gradeText}>
                          {contract.farmingDetails.aaccRequirements.minimumGrade}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quality Score:</Text>
                      <Text style={styles.detailValue}>
                        Minimum {contract.farmingDetails.aaccRequirements.minimumQualityScore}/100
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Safety Score:</Text>
                      <Text style={styles.detailValue}>
                        Minimum {contract.farmingDetails.aaccRequirements.minimumSafetyScore}/100
                      </Text>
                    </View>

                    {contract.farmingDetails.aaccRequirements.requiredStandards &&
                     contract.farmingDetails.aaccRequirements.requiredStandards.length > 0 && (
                      <View style={styles.standardsContainer}>
                        <Text style={styles.detailLabel}>Required Standards:</Text>
                        <View style={styles.standardsList}>
                          {contract.farmingDetails.aaccRequirements.requiredStandards.map((standard, index) => (
                            <View key={index} style={styles.standardBadge}>
                              <Text style={styles.standardText}>{standard}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {contract.farmingDetails.aaccRequirements.testingLabPreferences &&
                     contract.farmingDetails.aaccRequirements.testingLabPreferences.length > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Testing Labs:</Text>
                        <Text style={styles.detailValue}>
                          {contract.farmingDetails.aaccRequirements.testingLabPreferences.join(', ')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cost Coverage:</Text>
                      <Text style={styles.detailValue}>
                        {contract.farmingDetails.aaccRequirements.certificationCostCoverage === 'buyer' ? 'Buyer Pays' :
                         contract.farmingDetails.aaccRequirements.certificationCostCoverage === 'farmer' ? 'Farmer Pays' :
                         `Shared (Buyer: ${contract.farmingDetails.aaccRequirements.costSharingRatio}%, Farmer: ${100 - (contract.farmingDetails.aaccRequirements.costSharingRatio || 0)}%)`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Contract Activated Section - Show when contract is active (no longer a tender) */}
          {!contract.isTender && contract.status === 'active' && contract.parties.secondPartyId && (
            <View style={styles.contractActivatedContainer}>
              <View style={styles.contractActivatedHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.contractActivatedTitle}>Contract Activated</Text>
              </View>

              <Text style={styles.contractActivatedInfo}>
                This contract has been activated and is now binding between both parties.
              </Text>

              <View style={styles.contractActivatedDetails}>
                <Text style={styles.contractActivatedLabel}>Contract Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) }]}>
                  <Text style={styles.statusText}>
                    {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.contractActivatedDetails}>
                <Text style={styles.contractActivatedLabel}>Parties:</Text>
                <View style={styles.contractActivatedParties}>
                  <Text style={styles.contractActivatedPartyText}>
                    {contract.parties.firstPartyUsername} (Creator)
                  </Text>
                  <Text style={styles.contractActivatedPartyText}>
                    {contract.parties.secondPartyUsername} (Selected Bidder)
                  </Text>
                </View>
              </View>

              <View style={styles.contractActivatedActions}>
                <Button
                  title="Manage Contract"
                  onPress={() => {
                    // Navigate to contract management screen
                    // @ts-ignore - Navigation types are complex
                    navigation.navigate('ContractDetailsManagement', {
                      contractId: contract.id
                    });
                  }}
                  style={styles.contractActivatedButton}
                />

                {contract.chatId && (
                  <Button
                    title="Open Chat"
                    onPress={() => {
                      // Navigate to the chat screen
                      // @ts-ignore - Navigation types are complex
                      navigation.navigate('ChatScreen', {
                        chatId: contract.chatId,
                        recipientId: contract.parties.secondPartyId,
                        recipientName: contract.parties.secondPartyUsername,
                        recipientPhoto: '',
                        isGroup: false,
                      });
                    }}
                    variant="outline"
                    style={{...styles.contractActivatedButton, marginLeft: spacing.md}}
                  />
                )}
              </View>
            </View>
          )}

          {/* Bids Section for Farmers (Creators) - Only show if still a tender */}
          {contract.isTender && contract.creatorId === userProfile?.uid && (
            <View style={styles.bidsContainer}>
              <Text style={styles.sectionTitle}>All Bids</Text>

              {!Array.isArray(contract.bids) || contract.bids.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No bids have been submitted for this tender yet.
                  </Text>
                </View>
              ) : (
                // Show all bids to the creator
                contract.bids.map((bid, index) => (
                <Card key={index} style={styles.bidCard}>
                  <View style={styles.bidHeader}>
                    <Text style={styles.bidderName}>{bid.bidderUsername}</Text>
                    <Text style={styles.bidAmount}>{formatCurrency(bid.bidAmount)}</Text>
                  </View>

                  <View style={styles.bidDetails}>
                    <Text style={styles.bidDate}>
                      Bid Date: {formatDate(new Date(bid.bidDate))}
                    </Text>

                    {/* Company Details */}
                    {bid.companyName && (
                      <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>{bid.companyName}</Text>
                        {bid.companyAddress && (
                          <Text style={styles.companyInfo}>Address: {bid.companyAddress}</Text>
                        )}
                        {bid.contactPerson && (
                          <Text style={styles.companyInfo}>Contact: {bid.contactPerson}</Text>
                        )}
                        {bid.contactPhone && (
                          <Text style={styles.companyInfo}>Phone: {bid.contactPhone}</Text>
                        )}
                        {bid.contactEmail && (
                          <Text style={styles.companyInfo}>Email: {bid.contactEmail}</Text>
                        )}
                        {bid.gstNumber && (
                          <Text style={styles.companyInfo}>GST: {bid.gstNumber}</Text>
                        )}
                        {bid.experience && (
                          <Text style={styles.companyInfo}>Experience: {bid.experience}</Text>
                        )}
                      </View>
                    )}

                    {bid.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Additional Notes:</Text>
                        <Text style={styles.bidNotes}>{bid.notes}</Text>
                      </View>
                    )}
                  </View>

                  {/* Bid Status Badges */}
                  {bid.status === 'accepted' && (
                    <View style={styles.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                      <Text style={styles.acceptedText}>Accepted</Text>
                    </View>
                  )}

                  {bid.status === 'rejected' && (
                    <View style={[styles.acceptedBadge, { backgroundColor: colors.error }]}>
                      <Ionicons name="close-circle" size={16} color={colors.white} />
                      <Text style={styles.acceptedText}>Rejected</Text>
                    </View>
                  )}

                  {/* Action Buttons for Contract Creator */}
                  {canAcceptBids() && bid.status === 'pending' && (
                    <View style={styles.bidActions}>
                      <Button
                        title="Accept"
                        onPress={() => handleAcceptBid(bid)}
                        loading={acceptingBid}
                        size="small"
                        style={styles.bidActionButton}
                      />
                      <Button
                        title="Reject"
                        onPress={() => handleRejectBid(bid)}
                        loading={rejectingBid}
                        size="small"
                        variant="outline"
                        style={{ ...styles.bidActionButton, marginLeft: spacing.sm }}
                      />
                    </View>
                  )}
                </Card>
                ))
              )}
            </View>
          )}

          {/* Bid Status Section for Bidders - Only show if still a tender */}
          {contract.isTender && hasUserBid() && userProfile &&
           (userProfile.role === 'vendor' || userProfile.role === 'buyer' || userProfile.role === 'farmer') &&
           contract.creatorId !== userProfile.uid && (
            <View style={styles.bidsContainer}>
              <Text style={styles.sectionTitle}>Your Bid Status</Text>

              {(() => {
                const userBid = getUserBid();
                if (!userBid) return null;

                return (
                  <Card style={styles.bidCard}>
                    <View style={styles.bidHeader}>
                      <Text style={styles.bidderName}>{userBid.bidderUsername}</Text>
                      <Text style={styles.bidAmount}>{formatCurrency(userBid.bidAmount)}</Text>
                    </View>

                    <View style={styles.bidDetails}>
                      <Text style={styles.bidLabel}>Bid Date:</Text>
                      <Text style={styles.bidValue}>{formatDate(new Date(userBid.bidDate))}</Text>
                    </View>

                    <View style={styles.bidDetails}>
                      <Text style={styles.bidLabel}>Status:</Text>
                      <View style={[
                        styles.bidStatusBadge,
                        userBid.status === 'accepted' ? styles.acceptedStatusBadge :
                        userBid.status === 'rejected' ? styles.rejectedStatusBadge :
                        styles.pendingStatusBadge
                      ]}>
                        <Text style={styles.bidStatusBadgeText}>
                          {userBid.status.charAt(0).toUpperCase() + userBid.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {userBid.notes && (
                      <View style={styles.bidDetails}>
                        <Text style={styles.bidLabel}>Your Notes:</Text>
                        <Text style={styles.bidValue}>{userBid.notes}</Text>
                      </View>
                    )}

                    <Text style={styles.bidStatusMessage}>
                      {userBid.status === 'accepted'
                        ? 'Congratulations! Your bid has been accepted. The contract is now active.'
                        : userBid.status === 'rejected'
                        ? 'Your bid has been rejected. You may apply to other tenders.'
                        : 'Your bid is currently under review. You will be notified when the status changes.'}
                    </Text>

                    {userBid.status === 'accepted' && (
                      <View style={styles.bidAcceptedActions}>
                        <Button
                          title="View Contract Details"
                          onPress={() => {
                            // Reload the contract to show the activated contract view
                            loadContract();

                            Alert.alert(
                              'Bid Accepted',
                              'Your bid has been accepted and the contract is now active. You can now proceed with the contract terms.',
                              [
                                { text: 'OK' }
                              ]
                            );
                          }}
                          style={styles.bidAcceptedButton}
                        />
                      </View>
                    )}
                  </Card>
                );
              })()}
            </View>
          )}

          {/* Contract Participant Section - Show when contract is active and user is a participant */}
          {!contract.isTender && contract.status === 'active' &&
           userProfile && (contract.parties.secondPartyId === userProfile.uid) && (
            <View style={styles.contractParticipantContainer}>
              <View style={styles.contractParticipantHeader}>
                <Ionicons name="checkmark-done-circle" size={24} color={colors.success} />
                <Text style={styles.contractParticipantTitle}>You're a Contract Participant</Text>
              </View>

              <Text style={styles.contractParticipantInfo}>
                Your bid has been accepted and you are now a participant in this contract.
              </Text>

              <View style={styles.contractParticipantDetails}>
                <Text style={styles.contractParticipantLabel}>Your Role:</Text>
                <Text style={styles.contractParticipantValue}>Selected Bidder</Text>
              </View>

              <View style={styles.contractParticipantDetails}>
                <Text style={styles.contractParticipantLabel}>Contract With:</Text>
                <Text style={styles.contractParticipantValue}>{contract.parties.firstPartyUsername}</Text>
              </View>

              <View style={styles.contractParticipantActions}>
                <Button
                  title="Manage Contract"
                  onPress={() => {
                    // Navigate to contract management screen
                    // @ts-ignore - Navigation types are complex
                    navigation.navigate('ContractDetailsManagement', {
                      contractId: contract.id
                    });
                  }}
                  style={styles.contractParticipantButton}
                />

                {contract.chatId && (
                  <Button
                    title="Open Chat"
                    onPress={() => {
                      // Navigate to the chat screen
                      // @ts-ignore - Navigation types are complex
                      navigation.navigate('ChatScreen', {
                        chatId: contract.chatId,
                        recipientId: contract.creatorId,
                        recipientName: contract.parties.firstPartyUsername,
                        recipientPhoto: '',
                        isGroup: false,
                      });
                    }}
                    variant="outline"
                    style={{...styles.contractParticipantButton, marginLeft: spacing.md}}
                  />
                )}
              </View>
            </View>
          )}

          {/* Apply to Tender Button (for vendors, buyers, and farmers) */}
          {contract.isTender && userProfile && (userProfile.role === 'vendor' || userProfile.role === 'buyer' || userProfile.role === 'farmer') &&
           !canBid() && !hasUserBid() && (
            <View style={styles.applyTenderContainer}>
              <Text style={styles.sectionTitle}>Tender Application</Text>
              <Text style={styles.applyTenderInfo}>
                {contract.creatorId === userProfile.uid
                  ? 'You cannot apply to your own tender.'
                  : contract.parties.secondPartyId === userProfile.uid
                  ? 'You are already a party to this contract.'
                  : contract.tenderEndDate && contract.tenderEndDate < Date.now()
                  ? 'This tender has already closed.'
                  : userProfile.role === 'farmer' && contract.type === 'farming' && !hasSufficientLandArea()
                  ? `You don't have enough land area for this contract. Required: ${contract.farmingDetails?.landArea || 0} ${contract.farmingDetails?.landAreaUnit || 'acre'}, Your land: ${userProfile.farmDetails?.landOwned || 0} ${userProfile.farmDetails?.landUnit || 'acres'}.`
                  : 'You cannot apply to this tender.'}
              </Text>
            </View>
          )}

          {/* Submit Bid Section - Only show if user can bid and hasn't already bid */}
          {canBid() && !hasUserBid() && (
            <View style={styles.submitBidContainer}>
              <Text style={styles.sectionTitle}>Submit Your Bid</Text>
              <Text style={styles.applyTenderInfo}>
                As a {userProfile?.role}, you can apply to this tender by submitting your bid and {userProfile?.role === 'farmer' ? 'farm' : 'company'} details below.
              </Text>

              <Text style={styles.bidFormLabel}>Bid Amount</Text>
              <TextInput
                style={styles.bidInput}
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder="Enter bid amount (₹)"
                keyboardType="numeric"
              />

              <Text style={styles.bidFormLabel}>{userProfile?.role === 'farmer' ? 'Farm Details' : 'Company Details'}</Text>
              <TextInput
                style={styles.bidInput}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder={userProfile?.role === 'farmer' ? 'Farm Name *' : 'Company Name *'}
              />

              <TextInput
                style={styles.bidInput}
                value={companyAddress}
                onChangeText={setCompanyAddress}
                placeholder={userProfile?.role === 'farmer' ? "Farm Address *" : "Company Address *"}
                multiline
              />

              <TextInput
                style={styles.bidInput}
                value={contactPerson}
                onChangeText={setContactPerson}
                placeholder="Contact Person Name *"
              />

              <TextInput
                style={styles.bidInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Contact Phone Number *"
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.bidInput}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="Contact Email (optional)"
                keyboardType="email-address"
              />

              {userProfile?.role !== 'farmer' && (
                <TextInput
                  style={styles.bidInput}
                  value={gstNumber}
                  onChangeText={setGstNumber}
                  placeholder="GST Number (optional)"
                />
              )}

              <TextInput
                style={styles.bidInput}
                value={experience}
                onChangeText={setExperience}
                placeholder={userProfile?.role === 'farmer' ? "Farming Experience in years (optional)" : "Experience in years (optional)"}
                keyboardType="numeric"
              />

              <Text style={styles.bidFormLabel}>Additional Notes</Text>
              <TextInput
                style={styles.bidNotesInput}
                value={bidNotes}
                onChangeText={setBidNotes}
                placeholder="Additional notes (optional)"
                multiline
              />

              {/* AACC Certification Compliance Section for Farming Contracts */}
              {contract.type === 'farming' && contract.farmingDetails?.aaccRequirements?.isRequired && (
                <View style={styles.aaccComplianceContainer}>
                  <View style={styles.aaccHeader}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                    <Text style={styles.aaccComplianceTitle}>AACC Certification Compliance</Text>
                  </View>

                  <Text style={styles.aaccComplianceDescription}>
                    This contract requires AACC certification. By submitting a bid, you confirm that you can meet the following requirements:
                  </Text>

                  <View style={styles.aaccComplianceRequirements}>
                    <View style={styles.aaccComplianceItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.aaccComplianceText}>
                        Minimum Grade: <Text style={styles.aaccComplianceHighlight}>{contract.farmingDetails.aaccRequirements.minimumGrade}</Text>
                      </Text>
                    </View>

                    <View style={styles.aaccComplianceItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.aaccComplianceText}>
                        Minimum Quality Score: <Text style={styles.aaccComplianceHighlight}>{contract.farmingDetails.aaccRequirements.minimumQualityScore}/100</Text>
                      </Text>
                    </View>

                    <View style={styles.aaccComplianceItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.aaccComplianceText}>
                        Minimum Safety Score: <Text style={styles.aaccComplianceHighlight}>{contract.farmingDetails.aaccRequirements.minimumSafetyScore}/100</Text>
                      </Text>
                    </View>

                    {contract.farmingDetails.aaccRequirements.requiredStandards &&
                     contract.farmingDetails.aaccRequirements.requiredStandards.length > 0 && (
                      <View style={styles.aaccComplianceItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <View style={styles.aaccComplianceStandards}>
                          <Text style={styles.aaccComplianceText}>Required Standards:</Text>
                          <Text style={styles.aaccComplianceHighlight}>
                            {contract.farmingDetails.aaccRequirements.requiredStandards.join(', ')}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.aaccComplianceItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.aaccComplianceText}>
                        Certification Cost: <Text style={styles.aaccComplianceHighlight}>
                          {contract.farmingDetails.aaccRequirements.certificationCostCoverage === 'buyer' ? 'Buyer Pays' :
                           contract.farmingDetails.aaccRequirements.certificationCostCoverage === 'farmer' ? 'Farmer Pays' :
                           `Shared (Buyer: ${contract.farmingDetails.aaccRequirements.costSharingRatio}%, Farmer: ${100 - (contract.farmingDetails.aaccRequirements.costSharingRatio || 0)}%)`}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.requiredFieldsNote}>* Required fields</Text>

              <Button
                title="Submit Bid"
                onPress={handleSubmitBid}
                loading={submittingBid}
                style={styles.submitBidButton}
              />
            </View>
          )}

          {/* User's Bid Status Section - Show if user has already bid */}
          {contract.isTender && hasUserBid() && userProfile && (userProfile.role === 'vendor' || userProfile.role === 'buyer' || userProfile.role === 'farmer') && (
            <View style={styles.userBidStatusContainer}>
              <Text style={styles.sectionTitle}>Your Bid Status</Text>

              {(() => {
                const userBid = getUserBid();
                if (!userBid) return null;

                return (
                  <View style={styles.userBidStatus}>
                    <View style={styles.bidStatusRow}>
                      <Text style={styles.bidStatusLabel}>Bid Amount:</Text>
                      <Text style={styles.bidStatusValue}>{formatCurrency(userBid.bidAmount)}</Text>
                    </View>

                    <View style={styles.bidStatusRow}>
                      <Text style={styles.bidStatusLabel}>Submission Date:</Text>
                      <Text style={styles.bidStatusValue}>{formatDate(new Date(userBid.bidDate))}</Text>
                    </View>

                    <View style={styles.bidStatusRow}>
                      <Text style={styles.bidStatusLabel}>Status:</Text>
                      <View style={[
                        styles.bidStatusBadge,
                        userBid.status === 'accepted' ? styles.acceptedStatusBadge :
                        userBid.status === 'rejected' ? styles.rejectedStatusBadge :
                        styles.pendingStatusBadge
                      ]}>
                        <Text style={styles.bidStatusBadgeText}>
                          {userBid.status.charAt(0).toUpperCase() + userBid.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.bidStatusMessage}>
                      {userBid.status === 'accepted'
                        ? 'Congratulations! Your bid has been accepted. The contract is now active.'
                        : userBid.status === 'rejected'
                        ? 'Your bid has been rejected. You may apply to other tenders.'
                        : 'Your bid is currently under review. You will be notified when the status changes.'}
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}
        </Card>
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
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  contractCard: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contractTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  tenderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tenderText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 150,
    justifyContent: 'center',
  },
  disabledApplyButton: {
    backgroundColor: colors.accent,
  },
  alreadyAppliedButton: {
    backgroundColor: colors.success,
  },
  applyButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  contractDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    width: '35%',
  },
  detailValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  partiesContainer: {
    flex: 1,
  },
  partyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  descriptionContainer: {
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  termsContainer: {
    marginBottom: spacing.md,
  },
  termItem: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  termNumber: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    width: 20,
  },
  termText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  bidsContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  bidCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bidderName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  bidAmount: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  bidDetails: {
    marginBottom: spacing.sm,
  },
  bidDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  bidNotes: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  notesContainer: {
    marginTop: spacing.sm,
  },
  notesLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  companyDetails: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  companyInfo: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bidActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  bidActionButton: {
    minWidth: 100,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  acceptedText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  applyTenderContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  applyTenderInfo: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  submitBidContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
  },
  bidFormLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  bidInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  bidNotesInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    height: 100,
    textAlignVertical: 'top',
  },
  requiredFieldsNote: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // User Bid Status Styles
  userBidStatusContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  userBidStatus: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  bidStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bidStatusLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    width: '40%',
  },
  bidStatusValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  bidStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  pendingStatusBadge: {
    backgroundColor: colors.warning,
  },
  acceptedStatusBadge: {
    backgroundColor: colors.success,
  },
  rejectedStatusBadge: {
    backgroundColor: colors.error,
  },
  bidStatusBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  bidStatusMessage: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bidLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    width: 100,
  },
  bidValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },

  // Contract Activated Styles
  contractActivatedContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  contractActivatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contractActivatedTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  contractActivatedInfo: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  contractActivatedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contractActivatedLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 120,
  },
  contractActivatedParties: {
    flex: 1,
  },
  contractActivatedPartyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  contractActivatedActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contractActivatedButton: {
    minWidth: 200,
  },

  // Bid Accepted Styles
  bidAcceptedActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bidAcceptedButton: {
    minWidth: 200,
    backgroundColor: colors.success,
  },

  // Contract Participant Styles
  contractParticipantContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  contractParticipantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contractParticipantTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  contractParticipantInfo: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  contractParticipantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contractParticipantLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 120,
  },
  contractParticipantValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  contractParticipantActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contractParticipantButton: {
    minWidth: 200,
    backgroundColor: colors.success,
  },
  submitBidButton: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },

  // Farming contract details styles
  farmingDetailsContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
  },
  farmingSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  supportProvisionContainer: {
    marginVertical: spacing.md,
  },
  supportProvisionList: {
    marginTop: spacing.xs,
  },
  supportProvisionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  supportProvisionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  provisionIncluded: {
    backgroundColor: colors.success,
  },
  provisionExcluded: {
    backgroundColor: colors.error,
  },
  supportProvisionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  qualityParametersContainer: {
    marginVertical: spacing.md,
  },
  qualityParameterItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  qualityParameterName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  qualityParameterValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qualityParameterValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  paymentScheduleContainer: {
    marginVertical: spacing.md,
  },
  paymentScheduleItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  paymentScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  paymentMilestone: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  paymentPercentage: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  paymentDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  // AACC certification styles
  aaccRequirementsContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  aaccHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aaccTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  aaccDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  gradeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeAPlusBadge: {
    backgroundColor: '#4CAF50', // Dark green
  },
  gradeABadge: {
    backgroundColor: '#8BC34A', // Light green
  },
  gradeBPlusBadge: {
    backgroundColor: '#CDDC39', // Lime
  },
  gradeBBadge: {
    backgroundColor: '#FFEB3B', // Yellow
  },
  gradeCBadge: {
    backgroundColor: '#FFC107', // Amber
  },
  gradeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  standardsContainer: {
    marginVertical: spacing.md,
  },
  standardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  standardBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  standardText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },

  // AACC Compliance styles for bid form
  aaccComplianceContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  aaccComplianceTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  aaccComplianceDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  aaccComplianceRequirements: {
    marginTop: spacing.sm,
  },
  aaccComplianceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  aaccComplianceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  aaccComplianceHighlight: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  aaccComplianceStandards: {
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default ContractDetailsScreen;
