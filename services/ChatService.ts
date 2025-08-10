import { database } from '../firebase/config';

// Chat message interface
export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  seen: boolean;
}

// Chat interface
export interface Chat {
  id: string;
  lastMessage: {
    text: string;
    timestamp: number;
    senderId: string;
  };
  participants: {
    [key: string]: boolean;
  };
  participantDetails?: {
    [key: string]: {
      displayName: string;
      photoURL: string;
      role: string;
    };
  };
  recipientId: string;
  recipientName: string;
  recipientPhoto: string;
  unreadCount: number;
  updatedAt: number;
  isGroup?: boolean;
  groupDetails?: {
    id: string;
    name: string;
    logo?: string | null;
    memberCount?: number;
    adminId?: string;
  };
  contractId?: string; // Reference to a contract if this chat is related to a contract
}

class ChatService {
  // Create or get a chat between two users
  async createOrGetChat(
    userId1: string,
    userId2: string,
    user1Details: {
      displayName: string;
      photoURL?: string;
      role: string;
    },
    user2Details: {
      displayName: string;
      photoURL?: string;
      role: string;
    },
    contractId?: string
  ): Promise<string> {
    try {
      console.log(`Creating or getting chat between ${userId1} and ${userId2}`);

      // Create a unique chat ID based on user IDs (sorted to ensure consistency)
      const chatId = [userId1, userId2].sort().join('_');

      // Check if chat already exists
      const chatRef = database().ref(`chats/${chatId}`);
      const snapshot = await chatRef.once('value');

      if (snapshot.exists()) {
        console.log(`Chat ${chatId} already exists`);
        
        // If the chat exists but doesn't have contractId, update it
        if (contractId && !snapshot.val().contractId) {
          await chatRef.update({
            contractId,
            updatedAt: database.ServerValue.TIMESTAMP,
          });
        }
        
        return chatId;
      }

      // Create new chat
      await chatRef.set({
        id: chatId,
        participants: {
          [userId1]: true,
          [userId2]: true,
        },
        participantDetails: {
          [userId1]: {
            displayName: user1Details.displayName,
            photoURL: user1Details.photoURL || '',
            role: user1Details.role,
          },
          [userId2]: {
            displayName: user2Details.displayName,
            photoURL: user2Details.photoURL || '',
            role: user2Details.role,
          }
        },
        recipientId: userId2, // From perspective of user1
        recipientName: user2Details.displayName,
        recipientPhoto: user2Details.photoURL || '',
        lastMessage: {
          text: 'Chat started',
          timestamp: database.ServerValue.TIMESTAMP,
          senderId: 'system',
        },
        unreadCount: 0,
        createdAt: database.ServerValue.TIMESTAMP,
        updatedAt: database.ServerValue.TIMESTAMP,
        contractId: contractId || null,
      });

      console.log(`Chat ${chatId} created successfully`);
      return chatId;
    } catch (error) {
      console.error('Error creating or getting chat:', error);
      throw error;
    }
  }

  // Send a message in a chat
  async sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    isSystemMessage: boolean = false
  ): Promise<string> {
    try {
      console.log(`Sending message in chat ${chatId}`);

      // Add message to Firebase
      const messagesRef = database().ref(`chats/${chatId}/messages`);
      const newMessageRef = messagesRef.push();
      
      await newMessageRef.set({
        text,
        senderId: isSystemMessage ? 'system' : senderId,
        timestamp: database.ServerValue.TIMESTAMP,
        seen: false,
      });

      // Update last message in chat
      await database().ref(`chats/${chatId}`).update({
        lastMessage: {
          text,
          timestamp: database.ServerValue.TIMESTAMP,
          senderId: isSystemMessage ? 'system' : senderId,
        },
        updatedAt: database.ServerValue.TIMESTAMP,
      });

      console.log(`Message sent successfully in chat ${chatId}`);
      return newMessageRef.key || '';
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Format a contract message with details
  formatContractMessage(
    contractTitle: string,
    contractType: string,
    bidAmount: number,
    startDate: number,
    endDate: number
  ): string {
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const formatCurrency = (amount: number) => {
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    return `🎉 Congratulations! Your bid has been accepted.

📄 Contract Details:
- Title: ${contractTitle}
- Type: ${contractType}
- Amount: ${formatCurrency(bidAmount)}
- Period: ${formatDate(startDate)} to ${formatDate(endDate)}

This chat has been created for you to communicate about this contract. You can discuss delivery details, payment terms, and any other aspects of the contract here.

We recommend finalizing all important details in writing through this chat for future reference.`;
  }
}

export default new ChatService();
