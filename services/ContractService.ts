import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import { Contract, ContractBid, ContractStatus, ContractType } from '../models/Contract';
import { UserProfile } from '../context/AuthContext';
import ChatService from './ChatService';

class ContractService {
  // Get all contracts for a user
  async getUserContracts(userId: string): Promise<Contract[]> {
    try {
      console.log(`Getting contracts for user: ${userId}`);

      // Query contracts where the user is either the creator or a party
      const contractsRef = database().ref('contracts');

      // Get contracts where user is the creator
      const creatorQuery = contractsRef.orderByChild('creatorId').equalTo(userId);
      const creatorSnapshot = await creatorQuery.once('value');

      // Get contracts where user is the first party
      const firstPartyQuery = contractsRef.orderByChild('parties/firstPartyId').equalTo(userId);
      const firstPartySnapshot = await firstPartyQuery.once('value');

      // Get contracts where user is the second party
      const secondPartyQuery = contractsRef.orderByChild('parties/secondPartyId').equalTo(userId);
      const secondPartySnapshot = await secondPartyQuery.once('value');

      // Combine all contracts
      const contracts: Contract[] = [];

      // Helper function to add contract with bids array check
      const addContract = (child: any) => {
        const contract = child.val() as Contract;

        // Convert bids from object to array if it exists but is not an array
        if (contract.bids && !Array.isArray(contract.bids)) {
          console.log(`Converting bids from object to array for contract ${contract.id}`);
          const bidsObj = contract.bids;
          const bidsArray: ContractBid[] = [];

          // Convert object to array
          Object.keys(bidsObj).forEach(key => {
            if (bidsObj[key]) {
              bidsArray.push({
                ...bidsObj[key],
                id: bidsObj[key].id || key // Ensure ID is set
              });
            }
          });

          contract.bids = bidsArray;
          console.log(`Converted ${bidsArray.length} bids to array for contract ${contract.id}`);
        } else if (!contract.bids) {
          console.log(`Initializing empty bids array for contract ${contract.id}`);
          contract.bids = [];
        }

        contracts.push(contract);
      };

      creatorSnapshot.forEach((child) => {
        addContract(child);
      });

      firstPartySnapshot.forEach((child) => {
        // Avoid duplicates
        if (!contracts.some(c => c.id === child.key)) {
          addContract(child);
        }
      });

      secondPartySnapshot.forEach((child) => {
        // Avoid duplicates
        if (!contracts.some(c => c.id === child.key)) {
          addContract(child);
        }
      });

      // Get all tenders
      const tendersQuery = contractsRef.orderByChild('isTender').equalTo(true);
      const tendersSnapshot = await tendersQuery.once('value');

      tendersSnapshot.forEach((child) => {
        // Only include tenders that are not already in the list
        if (!contracts.some(c => c.id === child.key)) {
          // Add all tenders, even if they're expired or not pending
          addContract(child);
        }
      });

      console.log(`Found ${contracts.length} contracts for user ${userId}`);
      return contracts;
    } catch (error) {
      console.error('Error getting user contracts:', error);
      throw error;
    }
  }

  // Get a single contract by ID
  async getContractById(contractId: string): Promise<Contract | null> {
    try {
      console.log(`Getting contract with ID: ${contractId}`);

      const contractRef = database().ref(`contracts/${contractId}`);
      const snapshot = await contractRef.once('value');

      if (snapshot.exists()) {
        const contract = snapshot.val() as Contract;

        console.log('Raw contract data:', JSON.stringify(contract));

        // Convert bids from object to array if it exists but is not an array
        if (contract.bids && !Array.isArray(contract.bids)) {
          console.log('Converting bids from object to array');
          const bidsObj = contract.bids;
          const bidsArray: ContractBid[] = [];

          // Convert object to array
          Object.keys(bidsObj).forEach(key => {
            if (bidsObj[key]) {
              bidsArray.push({
                ...bidsObj[key],
                id: bidsObj[key].id || key // Ensure ID is set
              });
            }
          });

          contract.bids = bidsArray;
          console.log(`Converted ${bidsArray.length} bids to array`);
        } else if (!contract.bids) {
          console.log(`Initializing empty bids array for contract ${contractId}`);
          contract.bids = [];

          // Update the contract in the database to fix the issue
          await contractRef.update({ bids: {} });
        }

        console.log('Processed contract bids:', contract.bids);
        return contract;
      }

      return null;
    } catch (error) {
      console.error(`Error getting contract ${contractId}:`, error);
      throw error;
    }
  }

  // Create a new contract
  async createContract(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Creating new contract');

      // Create a reference to the contracts collection
      const contractsRef = database().ref('contracts');

      // Generate a new contract ID
      const newContractRef = contractsRef.push();

      // Check verification status for first party
      const firstPartyVerified = await this.checkUserVerificationStatus(contract.parties.firstPartyId);

      // Check verification status for second party if it exists
      let secondPartyVerified = false;
      if (contract.parties.secondPartyId) {
        secondPartyVerified = await this.checkUserVerificationStatus(contract.parties.secondPartyId);
      }

      // Update parties with verification status
      const updatedParties = {
        ...contract.parties,
        firstPartyVerified,
        secondPartyVerified: contract.parties.secondPartyId ? secondPartyVerified : undefined
      };

      // Create the complete contract object
      const completeContract: Contract = {
        ...contract,
        parties: updatedParties,
        id: newContractRef.key!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Initialize bids as an empty object for Firebase (will be converted to array when retrieved)
        bids: {},
      };

      // Save the contract to the database
      await newContractRef.set(completeContract);

      console.log(`Contract created with ID: ${newContractRef.key}`);
      return newContractRef.key!;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  // Update an existing contract
  async updateContract(contractId: string, updates: Partial<Contract>): Promise<void> {
    try {
      console.log(`Updating contract with ID: ${contractId}`);

      // Get the contract reference
      const contractRef = database().ref(`contracts/${contractId}`);

      // Add updated timestamp
      updates.updatedAt = Date.now();

      // Update the contract
      await contractRef.update(updates);

      console.log(`Contract ${contractId} updated successfully`);
    } catch (error) {
      console.error(`Error updating contract ${contractId}:`, error);
      throw error;
    }
  }

  // Delete a contract
  async deleteContract(contractId: string): Promise<void> {
    try {
      console.log(`Deleting contract with ID: ${contractId}`);

      // Get the contract reference
      const contractRef = database().ref(`contracts/${contractId}`);

      // Delete the contract
      await contractRef.remove();

      console.log(`Contract ${contractId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting contract ${contractId}:`, error);
      throw error;
    }
  }

  // Submit a bid for a contract
  async submitBid(bid: Omit<ContractBid, 'id'>): Promise<string> {
    try {
      console.log(`Submitting bid for contract: ${bid.contractId}`);

      // First, check if the contract exists and get its current state
      const contractRef = database().ref(`contracts/${bid.contractId}`);
      const contractSnapshot = await contractRef.once('value');

      if (!contractSnapshot.exists()) {
        throw new Error(`Contract with ID ${bid.contractId} not found`);
      }

      // Create a reference to the bids collection for this contract
      const bidsRef = database().ref(`contracts/${bid.contractId}/bids`);

      // Generate a new bid ID
      const newBidRef = bidsRef.push();

      // Create the complete bid object
      const completeBid: ContractBid = {
        ...bid,
        id: newBidRef.key!,
      };

      console.log('Saving bid with data:', JSON.stringify(completeBid));

      // Save the bid to the database
      await newBidRef.set(completeBid);

      // Update the contract's updatedAt timestamp
      await contractRef.update({
        updatedAt: Date.now()
      });

      console.log(`Bid submitted with ID: ${newBidRef.key}`);

      // Verify the bid was saved correctly
      const verifyBidRef = database().ref(`contracts/${bid.contractId}/bids/${newBidRef.key}`);
      const verifyBidSnapshot = await verifyBidRef.once('value');

      if (verifyBidSnapshot.exists()) {
        console.log('Bid verification successful:', verifyBidSnapshot.val());
      } else {
        console.error('Bid verification failed: Bid not found after saving');
      }

      return newBidRef.key!;
    } catch (error) {
      console.error('Error submitting bid:', error);
      throw error;
    }
  }

  // Accept a bid for a contract
  async acceptBid(contractId: string, bidId: string, secondPartyId: string, secondPartyUsername: string): Promise<{chatId: string}> {
    try {
      console.log(`Accepting bid ${bidId} for contract ${contractId}`);

      // Verify the bid exists
      const bidRef = database().ref(`contracts/${contractId}/bids/${bidId}`);
      const bidSnapshot = await bidRef.once('value');

      if (!bidSnapshot.exists()) {
        throw new Error(`Bid with ID ${bidId} not found for contract ${contractId}`);
      }

      const bidData = bidSnapshot.val() as ContractBid;
      console.log('Found bid to accept:', bidData);

      // Update the bid status
      await bidRef.update({ status: 'accepted' });

      // Get the current contract data
      const contractRef = database().ref(`contracts/${contractId}`);
      const contractSnapshot = await contractRef.once('value');

      if (!contractSnapshot.exists()) {
        throw new Error(`Contract with ID ${contractId} not found`);
      }

      const contract = contractSnapshot.val() as Contract;

      // Check verification status for second party
      const secondPartyVerified = await this.checkUserVerificationStatus(secondPartyId);

      // Create a new parties object with the updated values
      const updatedParties = {
        ...contract.parties,
        secondPartyId: secondPartyId,
        secondPartyUsername: secondPartyUsername,
        secondPartyVerified
      };

      // Update the contract with the new parties object
      await contractRef.update({
        status: 'active',
        isTender: false,
        parties: updatedParties,
        updatedAt: Date.now(),
      });

      // Get user details for chat creation
      const firstPartyRef = database().ref(`users/${contract.creatorId}`);
      const secondPartyRef = database().ref(`users/${secondPartyId}`);

      const [firstPartySnapshot, secondPartySnapshot] = await Promise.all([
        firstPartyRef.once('value'),
        secondPartyRef.once('value')
      ]);

      const firstPartyData = firstPartySnapshot.val() || {
        displayName: contract.parties.firstPartyUsername,
        role: 'farmer'
      };

      const secondPartyData = secondPartySnapshot.val() || {
        displayName: secondPartyUsername,
        role: 'vendor'
      };

      // Create a chat between the two parties
      const chatId = await ChatService.createOrGetChat(
        contract.creatorId,
        secondPartyId,
        {
          displayName: firstPartyData.displayName || contract.parties.firstPartyUsername,
          photoURL: firstPartyData.photoURL || '',
          role: firstPartyData.role || 'farmer'
        },
        {
          displayName: secondPartyData.displayName || secondPartyUsername,
          photoURL: secondPartyData.photoURL || '',
          role: secondPartyData.role || 'vendor'
        },
        contractId
      );

      // Send a message with contract details
      const contractMessage = ChatService.formatContractMessage(
        contract.title,
        contract.type,
        bidData.bidAmount,
        contract.startDate,
        contract.endDate
      );

      await ChatService.sendMessage(
        chatId,
        'system',
        contractMessage,
        true
      );

      // Update the contract with the chatId
      await contractRef.update({
        chatId: chatId
      });

      // Verify the update was successful
      const verifyBidSnapshot = await bidRef.once('value');
      console.log('Bid after update:', verifyBidSnapshot.val());

      const verifyContractSnapshot = await contractRef.once('value');
      console.log('Contract after update:', verifyContractSnapshot.val());

      console.log(`Bid ${bidId} accepted for contract ${contractId}`);
      console.log(`Chat created with ID: ${chatId}`);

      return { chatId };
    } catch (error) {
      console.error(`Error accepting bid ${bidId} for contract ${contractId}:`, error);
      throw error;
    }
  }

  // Check if a username exists
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      console.log(`Checking if username exists: ${username}`);

      const usersRef = database().ref('users');
      const query = usersRef.orderByChild('username').equalTo(username);
      const snapshot = await query.once('value');

      return snapshot.exists();
    } catch (error) {
      console.error(`Error checking if username ${username} exists:`, error);
      throw error;
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      console.log(`Getting user by username: ${username}`);

      const usersRef = database().ref('users');
      const query = usersRef.orderByChild('username').equalTo(username);
      const snapshot = await query.once('value');

      if (snapshot.exists()) {
        // There should be only one user with this username
        let user: UserProfile | null = null;
        snapshot.forEach((child) => {
          user = child.val() as UserProfile;
        });
        return user;
      }

      return null;
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      throw error;
    }
  }

  // Update bid status
  async updateBidStatus(
    contractId: string,
    bidId: string,
    status: 'pending' | 'accepted' | 'rejected'
  ): Promise<void> {
    try {
      console.log(`Updating bid ${bidId} status to ${status} for contract ${contractId}`);

      // Verify the bid exists
      const bidRef = database().ref(`contracts/${contractId}/bids/${bidId}`);
      const bidSnapshot = await bidRef.once('value');

      if (!bidSnapshot.exists()) {
        throw new Error(`Bid with ID ${bidId} not found for contract ${contractId}`);
      }

      console.log('Found bid to update:', bidSnapshot.val());

      // Update the bid status
      await bidRef.update({ status });

      // Update the contract's updatedAt timestamp
      const contractRef = database().ref(`contracts/${contractId}`);
      await contractRef.update({
        updatedAt: Date.now()
      });

      // Verify the update was successful
      const verifyBidSnapshot = await bidRef.once('value');
      console.log('Bid after update:', verifyBidSnapshot.val());

      console.log(`Bid ${bidId} status updated to ${status} for contract ${contractId}`);
    } catch (error) {
      console.error(`Error updating bid ${bidId} status for contract ${contractId}:`, error);
      throw error;
    }
  }
  // Define delivery status type
  async addDelivery(
    contractId: string,
    delivery: {
      date: number;
      status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
      quantity: number;
      notes?: string;
      trackingId?: string;
      location?: string;
    }
  ): Promise<string> {
    try {
      console.log(`Adding delivery for contract: ${contractId}`);

      // Verify the contract exists
      const contractRef = database().ref(`contracts/${contractId}`);
      const contractSnapshot = await contractRef.once('value');

      if (!contractSnapshot.exists()) {
        throw new Error(`Contract with ID ${contractId} not found`);
      }

      // Create a reference to the deliveries collection for this contract
      const deliveriesRef = database().ref(`contracts/${contractId}/deliveries`);

      // Generate a new delivery ID
      const newDeliveryRef = deliveriesRef.push();

      // Create the complete delivery object
      const completeDelivery = {
        ...delivery,
        id: newDeliveryRef.key!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the delivery to the database
      await newDeliveryRef.set(completeDelivery);

      // Update the contract's updatedAt timestamp
      await contractRef.update({
        updatedAt: Date.now()
      });

      console.log(`Delivery added with ID: ${newDeliveryRef.key}`);
      return newDeliveryRef.key!;
    } catch (error) {
      console.error('Error adding delivery:', error);
      throw error;
    }
  }

  // Update delivery status
  async updateDeliveryStatus(
    contractId: string,
    deliveryId: string,
    status: 'pending' | 'in_transit' | 'delivered' | 'cancelled',
    updates?: {
      notes?: string;
      trackingId?: string;
      location?: string;
    }
  ): Promise<void> {
    try {
      console.log(`Updating delivery ${deliveryId} status to ${status} for contract ${contractId}`);

      // Verify the delivery exists
      const deliveryRef = database().ref(`contracts/${contractId}/deliveries/${deliveryId}`);
      const deliverySnapshot = await deliveryRef.once('value');

      if (!deliverySnapshot.exists()) {
        throw new Error(`Delivery with ID ${deliveryId} not found for contract ${contractId}`);
      }

      // Update the delivery
      await deliveryRef.update({
        status,
        ...(updates || {}),
        updatedAt: Date.now()
      });

      // Update the contract's updatedAt timestamp
      const contractRef = database().ref(`contracts/${contractId}`);
      await contractRef.update({
        updatedAt: Date.now()
      });

      console.log(`Delivery ${deliveryId} status updated to ${status}`);
    } catch (error) {
      console.error(`Error updating delivery ${deliveryId} status:`, error);
      throw error;
    }
  }

  // Get deliveries for a contract
  async getDeliveries(contractId: string): Promise<any[]> {
    try {
      console.log(`Getting deliveries for contract: ${contractId}`);

      // Verify the contract exists
      const contractRef = database().ref(`contracts/${contractId}`);
      const contractSnapshot = await contractRef.once('value');

      if (!contractSnapshot.exists()) {
        throw new Error(`Contract with ID ${contractId} not found`);
      }

      // Get the deliveries
      const deliveriesRef = database().ref(`contracts/${contractId}/deliveries`);
      const deliveriesSnapshot = await deliveriesRef.once('value');

      const deliveries: any[] = [];

      if (deliveriesSnapshot.exists()) {
        deliveriesSnapshot.forEach((child) => {
          deliveries.push({
            ...child.val(),
            id: child.key
          });
        });
      }

      console.log(`Found ${deliveries.length} deliveries for contract ${contractId}`);
      return deliveries;
    } catch (error) {
      console.error(`Error getting deliveries for contract ${contractId}:`, error);
      throw error;
    }
  }

  // Add payment
  async addPayment(
    contractId: string,
    payment: {
      date: number;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<string> {
    try {
      console.log(`Adding payment for contract: ${contractId}`);

      // Verify the contract exists
      const contractRef = database().ref(`contracts/${contractId}`);
      const contractSnapshot = await contractRef.once('value');

      if (!contractSnapshot.exists()) {
        throw new Error(`Contract with ID ${contractId} not found`);
      }

      // Create a reference to the payments collection for this contract
      const paymentsRef = database().ref(`contracts/${contractId}/payments`);

      // Generate a new payment ID
      const newPaymentRef = paymentsRef.push();

      // Create the complete payment object
      const completePayment = {
        ...payment,
        id: newPaymentRef.key!,
        status: 'completed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the payment to the database
      await newPaymentRef.set(completePayment);

      // Update the contract's updatedAt timestamp
      await contractRef.update({
        updatedAt: Date.now()
      });

      console.log(`Payment added with ID: ${newPaymentRef.key}`);
      return newPaymentRef.key!;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  }

  // Get payments for a contract
  async getPayments(contractId: string): Promise<any[]> {
    try {
      console.log(`Getting payments for contract: ${contractId}`);

      // Verify the contract exists
      const contractRef = database().ref(`contracts/${contractId}`);
      const contractSnapshot = await contractRef.once('value');

      if (!contractSnapshot.exists()) {
        throw new Error(`Contract with ID ${contractId} not found`);
      }

      // Get the payments
      const paymentsRef = database().ref(`contracts/${contractId}/payments`);
      const paymentsSnapshot = await paymentsRef.once('value');

      const payments: any[] = [];

      if (paymentsSnapshot.exists()) {
        paymentsSnapshot.forEach((child) => {
          payments.push({
            ...child.val(),
            id: child.key
          });
        });
      }

      console.log(`Found ${payments.length} payments for contract ${contractId}`);
      return payments;
    } catch (error) {
      console.error(`Error getting payments for contract ${contractId}:`, error);
      throw error;
    }
  }

  // Check if a user is verified
  async checkUserVerificationStatus(userId: string): Promise<boolean> {
    try {
      // First check the new verification path
      const verificationSnapshot = await database().ref(`users/${userId}/verification`).once('value');

      if (verificationSnapshot.exists()) {
        const verification = verificationSnapshot.val();
        return verification.status === 'verified';
      }

      // If no verification data, check the legacy reputation.verifiedStatus field
      const reputationSnapshot = await database().ref(`users/${userId}/reputation`).once('value');

      if (reputationSnapshot.exists()) {
        const reputation = reputationSnapshot.val();
        return reputation.verifiedStatus === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking user verification status:', error);
      return false;
    }
  }
}

export default new ContractService();
