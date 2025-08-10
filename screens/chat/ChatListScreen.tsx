import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase/config';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Chat interface
interface Chat {
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
}

const ChatListScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats
  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    setError(null);

    // Reference to chats where the current user is a participant
    const chatsRef = database().ref('chats');

    const onChatsUpdate = chatsRef.orderByChild(`participants/${userProfile.uid}`).equalTo(true).on('value', async (snapshot) => {
      try {
        if (!snapshot.exists()) {
          setChats([]);
          setLoading(false);
          return;
        }

        const chatsList: Chat[] = [];
        const promises: Promise<void>[] = [];

        snapshot.forEach((childSnapshot) => {
          const chatData = childSnapshot.val();
          const chatId = childSnapshot.key || '';
          const participants = chatData.participants || {};

          // Check if this is a group chat
          if (chatData.isGroup) {
            // Handle group chat
            const groupDetails = chatData.groupDetails || {};

            // Count unread messages
            let unreadCount = 0;
            if (chatData.messages) {
              Object.values(chatData.messages).forEach((message: any) => {
                if (message.senderId !== userProfile.uid && !message.seen) {
                  unreadCount++;
                }
              });
            }

            chatsList.push({
              id: chatId,
              lastMessage: chatData.lastMessage || {
                text: 'Group created',
                timestamp: Date.now(),
                senderId: '',
              },
              participants,
              recipientId: groupDetails.id || chatId.replace('group_', ''),
              recipientName: groupDetails.name || 'Group Chat',
              recipientPhoto: groupDetails.logo || '',
              unreadCount,
              updatedAt: chatData.updatedAt || Date.now(),
              isGroup: true,
              groupDetails,
            });

            return false; // Continue iteration
          }

          // Handle individual chat
          // Find the recipient ID (the other participant)
          const recipientId = Object.keys(participants).find(id => id !== userProfile.uid) || '';

          if (!recipientId) return false;

          // Get recipient user data
          const promise = database().ref(`users/${recipientId}`).once('value').then((userSnapshot) => {
            if (!userSnapshot.exists()) return;

            const userData = userSnapshot.val();

            // Count unread messages
            let unreadCount = 0;
            if (chatData.messages) {
              Object.values(chatData.messages).forEach((message: any) => {
                if (message.senderId === recipientId && !message.seen) {
                  unreadCount++;
                }
              });
            }

            chatsList.push({
              id: chatId,
              lastMessage: chatData.lastMessage || {
                text: 'Start a conversation',
                timestamp: Date.now(),
                senderId: '',
              },
              participants,
              recipientId,
              recipientName: userData.displayName || 'Unknown User',
              recipientPhoto: userData.photoURL || '',
              unreadCount,
              updatedAt: chatData.updatedAt || Date.now(),
              isGroup: false,
            });
          });

          promises.push(promise);
          return false; // Continue iteration
        });

        // Wait for all promises to resolve
        await Promise.all(promises);

        // Sort chats by updatedAt timestamp (most recent first)
        chatsList.sort((a, b) => b.updatedAt - a.updatedAt);

        setChats(chatsList);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    // Clean up listener when component unmounts
    return () => {
      chatsRef.off('value', onChatsUpdate);
    };
  }, [userProfile]);

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const now = new Date();
    const messageDate = new Date(timestamp);

    // If message is from today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If message is from this week, show day name
    const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }

    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Navigate to chat screen
  const openChat = (chat: Chat) => {
    navigation.navigate('ChatScreen' as never, {
      chatId: chat.id,
      recipientId: chat.recipientId,
      recipientName: chat.recipientName,
      recipientPhoto: chat.recipientPhoto,
      isGroup: chat.isGroup || false,
      groupDetails: chat.groupDetails,
    } as never);
  };

  // Start a new chat (navigate to consultants screen)
  const startNewChat = () => {
    navigation.navigate('Consultants' as never);
  };

  // Render a chat item
  const renderChatItem = ({ item }: { item: Chat }) => {
    const isMyLastMessage = item.lastMessage.senderId === userProfile?.uid;
    const isSystemMessage = item.lastMessage.senderId === 'system';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => openChat(item)}
      >
        {item.isGroup ? (
          // Group chat avatar
          item.recipientPhoto ? (
            <Image
              source={{ uri: item.recipientPhoto }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.groupAvatarPlaceholder]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
          )
        ) : (
          // Individual chat avatar
          <Image
            source={
              item.recipientPhoto
                ? { uri: item.recipientPhoto }
                : { uri: `https://via.placeholder.com/100/2196F3/FFFFFF?text=${item.recipientName.charAt(0)}` }
            }
            style={styles.profileImage}
          />
        )}

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.chatName}>
                  {item.recipientName}
                  {item.isGroup && item.groupDetails?.memberCount && (
                    <Text style={styles.memberCount}> ({item.groupDetails.memberCount})</Text>
                  )}
                </Text>
                {item.recipientVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.chatIconButton}
                onPress={() => openChat(item)}
              >
                <Ionicons
                  name={item.isGroup ? "people" : "chatbubble-ellipses"}
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.chatTime}>{formatTime(item.lastMessage.timestamp)}</Text>
          </View>

          <View style={styles.chatPreview}>
            <Text
              style={[
                styles.chatMessage,
                item.unreadCount > 0 && !isMyLastMessage && styles.unreadMessage,
                isSystemMessage && styles.systemMessage
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {!isSystemMessage && isMyLastMessage && 'You: '}
              {item.isGroup && !isSystemMessage && !isMyLastMessage && item.lastMessage.senderId && (
                <Text style={styles.senderName}>
                  {item.lastMessage.senderId === userProfile?.uid
                    ? 'You: '
                    : `${item.participantDetails?.[item.lastMessage.senderId]?.displayName || 'Member'}: `}
                </Text>
              )}
              {item.lastMessage.text}
            </Text>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote
          loadingText="Loading your conversations..."
          showIndicator={true}
          indicatorSize="large"
          indicatorColor={colors.primary}
        />
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
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={startNewChat}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Start a conversation with an agricultural consultant to get personalized advice.
          </Text>
          <TouchableOpacity
            style={styles.startChatButton}
            onPress={startNewChat}
          >
            <Text style={styles.startChatText}>Find Consultants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  startChatButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  startChatText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  chatList: {
    padding: spacing.sm,
  },
  chatItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  groupAvatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
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
  memberCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  chatIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTime: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  unreadMessage: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  systemMessage: {
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  senderName: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: spacing.sm,
  },
  unreadCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
});

export default ChatListScreen;
