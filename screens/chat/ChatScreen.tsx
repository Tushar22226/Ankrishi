import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase/config';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

// Message interface
interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  seen: boolean;
}

// Chat screen props
interface ChatScreenParams {
  chatId: string;
  recipientId: string;
  recipientName: string;
  recipientPhoto: string;
  isGroup?: boolean;
  groupDetails?: {
    id: string;
    name: string;
    logo?: string | null;
    memberCount?: number;
    adminId?: string;
  };
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId, recipientId, recipientName, recipientPhoto, isGroup, groupDetails } = route.params as ChatScreenParams;
  const { userProfile, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [participantDetails, setParticipantDetails] = useState<{[key: string]: any}>({});
  const flatListRef = useRef<FlatList>(null);

  // Fetch messages and listen for new ones
  useEffect(() => {
    if (!userProfile || !user) return;

    setLoading(true);

    // Reference to messages in this chat
    const messagesRef = database().ref(`chats/${chatId}/messages`);

    // Listen for new messages
    const onMessagesUpdate = messagesRef.orderByChild('timestamp').on('value', (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const messagesData: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        messagesData.push({
          id: childSnapshot.key || '',
          text: message.text,
          senderId: message.senderId,
          timestamp: message.timestamp,
          seen: message.seen || false,
        });
        return false; // Continue iteration
      });

      // Sort messages by timestamp
      messagesData.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(messagesData);
      setLoading(false);

      // Mark messages as seen if they're from the recipient
      messagesData.forEach((message) => {
        if (message.senderId === recipientId && !message.seen) {
          database().ref(`chats/${chatId}/messages/${message.id}`).update({
            seen: true,
          });
        }
      });
    });

    // For group chats, fetch participant details
    if (isGroup) {
      // Get all participants
      const participantsRef = database().ref(`chats/${chatId}/participantDetails`);
      participantsRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
          setParticipantDetails(snapshot.val() || {});
        }
      });

      // Listen for typing status in group chats
      const groupTypingRef = database().ref(`chats/${chatId}/typing`);
      const onGroupTypingUpdate = groupTypingRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
          setTypingUsers([]);
          setTyping(false);
          return;
        }

        const typingData = snapshot.val();
        const typingUserIds = Object.keys(typingData).filter(
          id => id !== userProfile.uid && typingData[id]
        );

        setTypingUsers(typingUserIds);
        setTyping(typingUserIds.length > 0);
      });

      // Clean up group typing listener
      return () => {
        groupTypingRef.off('value', onGroupTypingUpdate);

        // Clear typing status
        database().ref(`chats/${chatId}/typing/${userProfile.uid}`).remove();
      };
    } else {
      // For individual chats
      // Listen for recipient's online status
      const userStatusRef = database().ref(`users/${recipientId}/isOnline`);
      const onStatusUpdate = userStatusRef.on('value', (snapshot) => {
        setRecipientOnline(snapshot.val() || false);
      });

      // Listen for typing status
      const typingRef = database().ref(`chats/${chatId}/typing/${recipientId}`);
      const onTypingUpdate = typingRef.on('value', (snapshot) => {
        setTyping(snapshot.val() || false);
      });

      // Clean up individual chat listeners
      return () => {
        messagesRef.off('value', onMessagesUpdate);
        userStatusRef.off('value', onStatusUpdate);
        typingRef.off('value', onTypingUpdate);

        // Update user's online status when leaving
        database().ref(`users/${userProfile.uid}`).update({
          isOnline: false,
        });

        // Clear typing status
        database().ref(`chats/${chatId}/typing/${userProfile.uid}`).remove();
      };
    }

    // Update user's online status
    database().ref(`users/${userProfile.uid}`).update({
      isOnline: true,
    });
  }, [chatId, recipientId, userProfile, user]);

  // Send a new message
  const sendMessage = () => {
    if (!newMessage.trim() || !userProfile || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Clear typing status
    database().ref(`chats/${chatId}/typing/${userProfile.uid}`).remove();

    // Add message to Firebase
    const messagesRef = database().ref(`chats/${chatId}/messages`);
    const newMessageRef = messagesRef.push();
    newMessageRef.set({
      text: messageText,
      senderId: userProfile.uid,
      timestamp: database.ServerValue.TIMESTAMP,
      seen: false,
    });

    // Update last message in chat
    database().ref(`chats/${chatId}`).update({
      lastMessage: {
        text: messageText,
        timestamp: database.ServerValue.TIMESTAMP,
        senderId: userProfile.uid,
      },
      updatedAt: database.ServerValue.TIMESTAMP,
    });
  };

  // Handle typing status
  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!userProfile || !user) return;

    // Update typing status
    if (text.length > 0) {
      database().ref(`chats/${chatId}/typing/${userProfile.uid}`).set(true);
    } else {
      database().ref(`chats/${chatId}/typing/${userProfile.uid}`).remove();
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render a message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === userProfile?.uid;
    const isSystemMessage = item.senderId === 'system';

    // Get sender details for group chats
    const senderDetails = isGroup && !isMyMessage && !isSystemMessage
      ? participantDetails[item.senderId] || null
      : null;

    const senderName = senderDetails?.displayName || 'Unknown User';
    const senderPhoto = senderDetails?.photoURL || '';

    // For system messages
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMyMessage && (
          <Image
            source={
              isGroup
                ? (senderPhoto
                    ? { uri: senderPhoto }
                    : { uri: `https://via.placeholder.com/100/2196F3/FFFFFF?text=${senderName.charAt(0)}` })
                : (recipientPhoto
                    ? { uri: recipientPhoto }
                    : { uri: `https://via.placeholder.com/100/2196F3/FFFFFF?text=${recipientName.charAt(0)}` })
            }
            style={styles.messageSenderAvatar}
          />
        )}

        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          !isMyMessage && styles.theirMessageBubbleShadow
        ]}>
          {!isMyMessage && isGroup && (
            <Text style={styles.messageSenderName}>
              {isGroup ? senderName : recipientName}
            </Text>
          )}

          <Text style={[
            styles.messageText,
            !isMyMessage && styles.theirMessageText
          ]}>
            {item.text}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              !isMyMessage && styles.theirMessageTime
            ]}>
              {formatTime(item.timestamp)}
            </Text>

            {isMyMessage && (
              <Ionicons
                name={item.seen ? "checkmark-done" : "checkmark"}
                size={16}
                color={item.seen ? colors.primary : colors.textSecondary}
                style={styles.seenIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {isGroup ? (
          // Group chat header
          <>
            {recipientPhoto ? (
              <Image
                source={{ uri: recipientPhoto }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.groupAvatarPlaceholder]}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{recipientName}</Text>
              <View style={styles.statusContainer}>
                <Ionicons name="people" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.statusText}>
                  {groupDetails?.memberCount || Object.keys(participantDetails).length || 1} members
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.groupInfoButton}
              onPress={() => {
                // Check if user exists
                if (!user) {
                  Alert.alert(
                    'Not Available',
                    'Group details are not available right now. Please try again later.',
                    [{ text: 'OK' }]
                  );
                  return;
                }

                // Create a complete group data object with all required fields
                const completeGroupData = {
                  id: groupDetails?.id || recipientId.replace('group_', ''),
                  name: recipientName || 'Group Chat',
                  description: groupDetails?.description || 'Group chat for collaboration and communication',
                  logo: recipientPhoto || null,
                  members: groupDetails?.memberCount || Object.keys(participantDetails).length || 1,
                  location: groupDetails?.location || 'Unknown location',
                  code: groupDetails?.code || `FG${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                  tags: groupDetails?.tags || ['chat', 'group'],
                  adminId: groupDetails?.adminId || user.uid,
                  createdBy: groupDetails?.createdBy || user.uid,
                  createdAt: groupDetails?.createdAt || Date.now(),
                  isJoined: true,
                };

                console.log('Navigating to GroupDetails from ChatScreen with data:',
                  JSON.stringify(completeGroupData, null, 2));

                navigation.navigate('GroupDetails' as never, {
                  groupId: completeGroupData.id,
                  groupData: completeGroupData,
                } as never);
              }}
            >
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </>
        ) : (
          // Individual chat header
          <>
            <Image
              source={
                recipientPhoto
                  ? { uri: recipientPhoto }
                  : { uri: `https://via.placeholder.com/100/2196F3/FFFFFF?text=${recipientName.charAt(0)}` }
              }
              style={styles.profileImage}
            />

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.headerName}>{recipientName}</Text>
                {route.params.recipientVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                  </View>
                )}
              </View>
              <View style={styles.statusContainer}>
                {recipientOnline ? (
                  <>
                    <View style={styles.onlineIndicator} />
                    <Text style={styles.statusText}>Online</Text>
                  </>
                ) : (
                  <Text style={styles.statusText}>Offline</Text>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {loading || !user || !userProfile ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {!user || !userProfile ? 'Waiting for authentication...' : 'Loading messages...'}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {typing && (
            <View style={styles.typingContainer}>
              {isGroup ? (
                <Text style={styles.typingText}>
                  {typingUsers.length === 1
                    ? `${participantDetails[typingUsers[0]]?.displayName || 'Someone'} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </Text>
              ) : (
                <Text style={styles.typingText}>{recipientName} is typing...</Text>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={handleTyping}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
  },
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    maxWidth: '80%',
  },
  systemMessageText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.italic,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  groupAvatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfoButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  header: {
    flexDirection:"row",
    alignItems:'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs / 2,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
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
  messagesContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  messageGroup: {
    marginBottom: spacing.sm,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: spacing.xs,
  },
  messageSenderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.xs,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: spacing.xs,
  },
  theirMessageBubble: {
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: spacing.xs,
  },
  theirMessageBubbleShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageSenderName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    lineHeight: typography.lineHeight.md,
  },
  theirMessageText: {
    color: colors.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.8,
  },
  theirMessageTime: {
    color: colors.textSecondary,
    opacity: 1,
  },
  seenIcon: {
    marginLeft: spacing.xs / 2,
  },
  typingContainer: {
    padding: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  typingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.italic,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    maxHeight: 100,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default ChatScreen;
