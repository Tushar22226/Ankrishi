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

type ContractDetailsScreenRouteProp = RouteProp<
  { ContractDetails: { contractId: string } },
  'ContractDetails'
>;

const ContractDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ContractDetailsScreenRouteProp>();
  const { userProfile } = useAuth();
  const { contractId } = route.params;

  const [loading, setLoading] = useState<boolean>(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidQuantity, setBidQuantity] = useState<string>('');
  const [bidNotes, setBidNotes] = useState<string>('');
  const [submittingBid, setSubmittingBid] = useState<boolean>(false);
  const [showBidForm, setShowBidForm] = useState<boolean>(false);

  // Load contract data
  useEffect(() => {
    const loadContract = async () => {
      try {
        setLoading(true);
        console.log(`Loading contract with ID: ${contractId}`);
        const contractData = await ContractService.getContractById(contractId);
        console.log(`Contract loaded successfully: ${JSON.stringify(contractData)}`);
        setContract(contractData);
      } catch (error) {
        console.error('Error loading contract:', error);
        Alert.alert('Error', 'Failed to load contract details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [contractId]);

  // Check if user has already bid on this contract
  const hasUserBid = (): boolean => {
    if (!contract || !userProfile) return false;
    
    const userBids = contract.bids?.filter(
      (bid) => bid.bidderId === userProfile.uid
    );
    
    return userBids && userBids.length > 0;
  };

  // Check if user can bid on this contract
  const canBid = (): boolean => {
    if (!contract || !userProfile) return false;
    
    // Log bid eligibility factors
    const isCreator = contract.creatorId === userProfile.uid;
    const isSecondParty = contract.parties.secondPartyId === userProfile.uid;
    const isTender = contract.isTender === true;
    const tenderEnded = contract.tenderEndDate ? new Date(contract.tenderEndDate) < new Date() : false;
    const bidsLength = contract.bids?.length || 0;
    const hasAlreadyBid = hasUserBid();
    
    console.log(`Checking if user can bid: ${JSON.stringify({
      isCreator,
      isSecondParty,
      isTender,
      tenderEnded,
      bidsLength,
      hasAlreadyBid,
      userRole: userProfile.role
    })}`);
    
    // User cannot bid if they are the creator
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
    
    return true;
  };

  // Submit a bid
  const submitBid = async () => {
    if (!contract || !userProfile) return;
    
    try {
      setSubmittingBid(true);
      
      const amount = parseFloat(bidAmount);
      const quantity = bidQuantity ? parseInt(bidQuantity, 10) : undefined;
      
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid bid amount.');
        return;
      }
      
      if (bidQuantity && (isNaN(quantity!) || quantity! <= 0)) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
        return;
      }
      
      const newBid: ContractBid = {
        id: `bid_${Date.now()}`,
        bidderId: userProfile.uid,
        bidderName: userProfile.username || userProfile.displayName || 'Unknown User',
        bidderVerified: userProfile.isVerified || false,
        amount,
        quantity,
        notes: bidNotes,
        timestamp: Date.now(),
        status: 'pending',
      };
      
      await ContractService.addBidToContract(contractId, newBid);
      
      Alert.alert(
        'Bid Submitted',
        'Your bid has been submitted successfully. You will be notified if it is accepted.',
        [{ text: 'OK', onPress: () => setShowBidForm(false) }]
      );
      
      // Refresh contract data
      const updatedContract = await ContractService.getContractById(contractId);
      setContract(updatedContract);
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
    } finally {
      setSubmittingBid(false);
    }
  };
