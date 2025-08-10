import { database } from '../firebase/config';

export type TransactionType = 'credit' | 'debit' | 'hold' | 'release' | 'transfer';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'held';
export type TransactionPurpose = 'order_payment' | 'order_refund' | 'manual_add' | 'manual_withdraw' | 'earnings' | 'other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: number;
  status: TransactionStatus;
  purpose?: TransactionPurpose;
  relatedTransactionId?: string;
  relatedOrderId?: string;
  relatedUserId?: string; // The other party in the transaction (buyer/seller)
}

export interface Wallet {
  balance: number;
  heldBalance: number; // Funds that are held but not yet transferred
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
        // Create a new wallet with 0 balance and 0 held balance
        const newWallet: Wallet = {
          balance: 0,
          heldBalance: 0,
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
  async addBalance(userId: string, amount: number, description: string = 'Added funds', purpose: TransactionPurpose = 'manual_add', relatedOrderId?: string, relatedUserId?: string): Promise<Transaction> {
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
        status: 'completed',
        purpose,
        relatedOrderId,
        relatedUserId
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
  async withdrawBalance(userId: string, amount: number, description: string = 'Withdrew funds', purpose: TransactionPurpose = 'manual_withdraw'): Promise<Transaction> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const walletRef = database().ref(`wallets/${userId}`);
      const wallet = await this.getWallet(userId);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check available balance (excluding held funds)
      const availableBalance = wallet.balance - (wallet.heldBalance || 0);

      if (availableBalance < amount) {
        throw new Error('Insufficient available balance. Some funds may be held for pending orders.');
      }

      // Create transaction
      const transactionRef = database().ref(`wallets/${userId}/transactions`).push();
      const transaction: Transaction = {
        id: transactionRef.key!,
        amount,
        type: 'debit',
        description,
        timestamp: Date.now(),
        status: 'completed',
        purpose
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

  // Hold balance for a pending order
  async holdBalance(userId: string, amount: number, description: string, orderId: string, sellerId: string): Promise<Transaction> {
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

      // Create hold transaction
      const transactionRef = database().ref(`wallets/${userId}/transactions`).push();
      const transaction: Transaction = {
        id: transactionRef.key!,
        amount,
        type: 'hold',
        description,
        timestamp: Date.now(),
        status: 'held',
        purpose: 'order_payment',
        relatedOrderId: orderId,
        relatedUserId: sellerId
      };

      // Update wallet with held balance and add transaction
      // Note: We don't reduce the actual balance yet, just mark it as held
      await walletRef.update({
        heldBalance: (wallet.heldBalance || 0) + amount,
        [`transactions/${transaction.id}`]: transaction
      });

      return transaction;
    } catch (error) {
      console.error('Error holding balance:', error);
      throw error;
    }
  }

  // Release held balance back to the buyer (if order is cancelled)
  async releaseHeldBalance(userId: string, amount: number, description: string, orderId: string, holdTransactionId: string): Promise<Transaction> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const walletRef = database().ref(`wallets/${userId}`);
      const wallet = await this.getWallet(userId);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if ((wallet.heldBalance || 0) < amount) {
        throw new Error('Insufficient held balance');
      }

      // Create release transaction
      const transactionRef = database().ref(`wallets/${userId}/transactions`).push();
      const transaction: Transaction = {
        id: transactionRef.key!,
        amount,
        type: 'release',
        description,
        timestamp: Date.now(),
        status: 'completed',
        purpose: 'order_refund',
        relatedOrderId: orderId,
        relatedTransactionId: holdTransactionId
      };

      // Update wallet to release held balance
      await walletRef.update({
        heldBalance: wallet.heldBalance - amount,
        [`transactions/${transaction.id}`]: transaction
      });

      return transaction;
    } catch (error) {
      console.error('Error releasing held balance:', error);
      throw error;
    }
  }

  // Transfer held balance from buyer to seller (when order is confirmed)
  async transferHeldBalance(
    buyerId: string,
    sellerId: string,
    amount: number,
    description: string,
    orderId: string,
    holdTransactionId: string
  ): Promise<{buyerTransaction: Transaction, sellerTransaction: Transaction}> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Get buyer and seller wallets
      const buyerWallet = await this.getWallet(buyerId);
      const sellerWallet = await this.getWallet(sellerId);

      if (!buyerWallet) {
        throw new Error('Buyer wallet not found');
      }

      if (!sellerWallet) {
        throw new Error('Seller wallet not found');
      }

      if ((buyerWallet.heldBalance || 0) < amount) {
        throw new Error('Insufficient held balance');
      }

      // Create buyer transaction (debit)
      const buyerTransactionRef = database().ref(`wallets/${buyerId}/transactions`).push();
      const buyerTransaction: Transaction = {
        id: buyerTransactionRef.key!,
        amount,
        type: 'debit',
        description: `${description} (transferred to seller)`,
        timestamp: Date.now(),
        status: 'completed',
        purpose: 'order_payment',
        relatedOrderId: orderId,
        relatedUserId: sellerId,
        relatedTransactionId: holdTransactionId
      };

      // Create seller transaction (credit)
      const sellerTransactionRef = database().ref(`wallets/${sellerId}/transactions`).push();
      const sellerTransaction: Transaction = {
        id: sellerTransactionRef.key!,
        amount,
        type: 'credit',
        description: `${description} (received from buyer)`,
        timestamp: Date.now(),
        status: 'completed',
        purpose: 'earnings',
        relatedOrderId: orderId,
        relatedUserId: buyerId,
        relatedTransactionId: buyerTransaction.id
      };

      // Update buyer wallet (reduce balance and held balance)
      await database().ref(`wallets/${buyerId}`).update({
        balance: buyerWallet.balance - amount,
        heldBalance: buyerWallet.heldBalance - amount,
        [`transactions/${buyerTransaction.id}`]: buyerTransaction
      });

      // Update seller wallet (increase balance)
      await database().ref(`wallets/${sellerId}`).update({
        balance: sellerWallet.balance + amount,
        [`transactions/${sellerTransaction.id}`]: sellerTransaction
      });

      return { buyerTransaction, sellerTransaction };
    } catch (error) {
      console.error('Error transferring held balance:', error);
      throw error;
    }
  }

  // Get available balance (total balance minus held funds)
  async getAvailableBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) return 0;

      return wallet.balance - (wallet.heldBalance || 0);
    } catch (error) {
      console.error('Error getting available balance:', error);
      throw error;
    }
  }

  // Get held balance
  async getHeldBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getWallet(userId);
      return wallet?.heldBalance || 0;
    } catch (error) {
      console.error('Error getting held balance:', error);
      throw error;
    }
  }

  // Get pending earnings (for farmers - money that will be received once delivery is completed)
  async getPendingEarnings(sellerId: string): Promise<number> {
    try {
      // Find all confirmed orders where this user is the seller and payment is held
      const ordersRef = database().ref('orders');
      const snapshot = await ordersRef
        .orderByChild('sellerId')
        .equalTo(sellerId)
        .once('value');

      if (!snapshot.exists()) {
        return 0;
      }

      const orders = snapshot.val();
      let pendingEarnings = 0;

      // Calculate total pending earnings from confirmed orders with held payments
      Object.values(orders).forEach((order: any) => {
        if (
          (order.status === 'confirmed' || order.status === 'out_for_delivery') &&
          order.holdTransactionId &&
          !order.paymentProcessed
        ) {
          pendingEarnings += order.totalAmount;
        }
      });

      return pendingEarnings;
    } catch (error) {
      console.error('Error getting pending earnings:', error);
      throw error;
    }
  }
}

export default new WalletService();
