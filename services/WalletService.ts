import { database } from '../firebase/config';

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
}

export interface Wallet {
  balance: number;
  transactions: Record<string, Transaction>;
}

class WalletService {
  // Get wallet data for a user
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      console.log(`Getting wallet data for user: ${userId}`);
      
      // Check if wallet exists for the user
      const walletRef = database().ref(`wallets/${userId}`);
      const snapshot = await walletRef.once('value');
      
      if (!snapshot.exists()) {
        console.log(`No wallet data found for user: ${userId}`);
        // Create a new wallet with 0 balance
        const newWallet: Wallet = {
          balance: 0,
          transactions: {}
        };
        await walletRef.set(newWallet);
        return newWallet;
      }
      
      // Get wallet data
      const walletData = snapshot.val() as Wallet;
      console.log(`Wallet data retrieved for user: ${userId}`);
      
      return walletData;
    } catch (error) {
      console.error('Error getting wallet data:', error);
      throw error;
    }
  }

  // Get current balance
  async getBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getWallet(userId);
      return wallet?.balance || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Add money to wallet
  async addBalance(userId: string, amount: number, description: string = 'Added funds'): Promise<Transaction> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const walletRef = database().ref(`wallets/${userId}`);
      const wallet = await this.getWallet(userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // Create transaction
      const transactionRef = database().ref(`wallets/${userId}/transactions`).push();
      const transaction: Transaction = {
        id: transactionRef.key!,
        amount,
        type: 'credit',
        description,
        timestamp: Date.now(),
        status: 'completed'
      };
      
      // Update wallet balance and add transaction
      await walletRef.update({
        balance: wallet.balance + amount,
        [`transactions/${transaction.id}`]: transaction
      });
      
      return transaction;
    } catch (error) {
      console.error('Error adding balance:', error);
      throw error;
    }
  }

  // Withdraw money from wallet
  async withdrawBalance(userId: string, amount: number, description: string = 'Withdrew funds'): Promise<Transaction> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const walletRef = database().ref(`wallets/${userId}`);
      const wallet = await this.getWallet(userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction
      const transactionRef = database().ref(`wallets/${userId}/transactions`).push();
      const transaction: Transaction = {
        id: transactionRef.key!,
        amount,
        type: 'debit',
        description,
        timestamp: Date.now(),
        status: 'completed'
      };
      
      // Update wallet balance and add transaction
      await walletRef.update({
        balance: wallet.balance - amount,
        [`transactions/${transaction.id}`]: transaction
      });
      
      return transaction;
    } catch (error) {
      console.error('Error withdrawing balance:', error);
      throw error;
    }
  }

  // Get all transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const wallet = await this.getWallet(userId);
      
      if (!wallet || !wallet.transactions) {
        return [];
      }
      
      // Convert transactions object to array and sort by timestamp (newest first)
      return Object.values(wallet.transactions).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }
}

export default new WalletService();
