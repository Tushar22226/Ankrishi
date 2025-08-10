import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import ChatbotService, { ChatMessage, ChatSuggestion } from '../../services/ChatbotService';

import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import * as ImagePicker from 'expo-image-picker';

const ChatbotScreen = () => {
  const { userProfile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Animation values
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  // Initialize chat with welcome message
  useEffect(() => {
    const initializeChat = async () => {
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const welcomeMessage = ChatbotService.createBotMessage(
        `Hello${userProfile?.displayName ? ' ' + userProfile.displayName : ''}! I'm your FarmConnect AI assistant. How can I help you today?\n\nYou can ask me about:\n• Crops, farming practices, and agricultural techniques\n• Weather forecasts and climate information\n• Market prices and trends\n• App features and how to use them\n• Upload a photo of your plants for disease detection\n\nWhat would you like to know?`
      );
      setMessages([welcomeMessage]);

      // Get initial suggestions
      const initialSuggestions = ChatbotService.getSuggestions();
      setSuggestions(initialSuggestions);

      setInitialLoading(false);

      // Fade in animation
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    };

    initializeChat();

    // Request camera permissions
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos of your plants for disease detection.',
          [{ text: 'OK' }]
        );
      }
    })();

    // Request media library permissions
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select photos of your plants for disease detection.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isTyping, typingAnimation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Clear input
    setInputText('');

    // Check if the message contains Hindi/Marathi text
    const containsHindiOrMarathi = /[\u0900-\u097F]/.test(text);

    // Add user message to chat
    const userMessage = ChatbotService.createUserMessage(text);
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Show typing indicator
    setIsTyping(true);
    setLoading(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add loading message from bot
    const loadingMessage = ChatbotService.createBotMessage(
      containsHindiOrMarathi ? 'आपका संदेश प्रोसेस किया जा रहा है...' : '',
      true
    );

    setMessages(prevMessages => [...prevMessages, loadingMessage]);
    setIsTyping(false);

    try {
      const response = await ChatbotService.getResponse(text);

      // Replace loading message with actual response
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === loadingMessage.id
            ? response
            : msg
        )
      );

      // Update suggestions based on the conversation
      const newSuggestions = ChatbotService.getSuggestions(
        [...messages, userMessage, response]
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error getting chatbot response:', error);

      // Replace loading message with error message
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: containsHindiOrMarathi
                  ? 'क्षमा करें, मुझे एक त्रुटि मिली। कृपया पुनः प्रयास करें।'
                  : 'Sorry, I encountered an error. Please try again.',
                isLoading: false,
                isError: true
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload for disease detection
  const handleImageUpload = async (useCamera: boolean = false) => {
    try {
      // Hide image picker options
      setImagePickerVisible(false);

      // Launch image picker or camera
      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images' as any,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images' as any,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (result.canceled) {
        console.log('Image picker canceled');
        return;
      }

      // Get the selected image
      const imageUri = result.assets[0].uri;

      // Add user message with image attachment
      const userMessage = ChatbotService.createUserMessage(
        'I want to check if my plant has a disease.',
        [{
          type: 'image',
          url: imageUri,
          name: 'Plant Image'
        }]
      );

      // Add loading message from bot
      const loadingMessage = ChatbotService.createBotMessage('Analyzing your plant image...', true);
      loadingMessage.isDiseaseDetection = true;

      setMessages(prevMessages => [...prevMessages, userMessage, loadingMessage]);

      // Analyze the image
      setLoading(true);
      try {
        const response = await ChatbotService.analyzeImage(imageUri);

        // Replace loading message with analysis result
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === loadingMessage.id
              ? response
              : msg
          )
        );

        // Update suggestions based on disease detection
        const newSuggestions = ChatbotService.getSuggestions(
          [...messages, userMessage, response],
          'crop'
        );
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error analyzing image:', error);

        // Replace loading message with error message
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  text: 'Sorry, I encountered an error analyzing your image. Please try again.',
                  isLoading: false,
                  isError: true
                }
              : msg
          )
        );
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error with image picker:', error);
      Alert.alert(
        'Error',
        'There was a problem accessing your camera or photos. Please check your permissions and try again.'
      );
    }
  };

  // Handle suggestion press
  const handleSuggestionPress = (suggestion: ChatSuggestion) => {
    handleSendMessage(suggestion.text);
  };

  // Handle link press in messages
  const handleLinkPress = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
        Alert.alert('Cannot Open Link', 'The link could not be opened.');
      }
    });
  };

  // Render a chat message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    // Function to render message text with formatting
    const renderFormattedText = (text: string) => {
      // Split text by newlines to handle paragraphs
      const paragraphs = text.split('\n');

      return (
        <>
          {paragraphs.map((paragraph, index) => {
            // Skip empty paragraphs
            if (!paragraph.trim()) {
              return <Text key={index} style={{ height: 8 }} />;
            }

            // Check for bold text (wrapped in ** **)
            const boldPattern = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            // Find all bold text
            while ((match = boldPattern.exec(paragraph)) !== null) {
              // Add text before the bold part
              if (match.index > lastIndex) {
                parts.push(
                  <Text key={`${index}-${lastIndex}`}>
                    {paragraph.substring(lastIndex, match.index)}
                  </Text>
                );
              }

              // Add the bold text
              parts.push(
                <Text
                  key={`${index}-${match.index}`}
                  style={{ fontFamily: typography.fontFamily.bold }}
                >
                  {match[1]}
                </Text>
              );

              lastIndex = match.index + match[0].length;
            }

            // Add any remaining text
            if (lastIndex < paragraph.length) {
              parts.push(
                <Text key={`${index}-${lastIndex}`}>
                  {paragraph.substring(lastIndex)}
                </Text>
              );
            }

            // If no bold parts were found, just return the paragraph
            if (parts.length === 0) {
              return (
                <Text key={index} style={{ marginBottom: 4 }}>
                  {paragraph}
                </Text>
              );
            }

            // Return the paragraph with formatted parts
            return (
              <Text key={index} style={{ marginBottom: 4 }}>
                {parts}
              </Text>
            );
          })}
        </>
      );
    };

    // Function to render links in web search results
    const renderLinks = (text: string) => {
      // Simple regex to find URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);

      return parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <Text
              key={index}
              style={styles.linkText}
              onPress={() => handleLinkPress(part)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      });
    };



    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="leaf" size={20} color={colors.white} />
          </View>
        )}

        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.botMessageBubble,
          item.isError && styles.errorMessageBubble,
          item.isDiseaseDetection && styles.diseaseMessageBubble
        ]}>
          {/* Show attachments if any */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => {
                if (attachment.type === 'image') {
                  return (
                    <View key={index} style={styles.imageAttachmentContainer}>
                      <Image
                        source={{ uri: attachment.url }}
                        style={styles.imageAttachment}
                        resizeMode="cover"
                      />
                      {attachment.metadata && attachment.metadata.disease && (
                        <View style={styles.imageMetadataContainer}>
                          <Text style={styles.imageMetadataText}>
                            {attachment.metadata.disease.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          )}

          {/* Show loading indicator or message text */}
          {item.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isUser ? colors.white : colors.primary} />
              {item.text && (
                <Text style={[styles.loadingText, isUser ? styles.userMessageText : styles.botMessageText]}>
                  {item.text}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText,
              item.isError && styles.errorMessageText
            ]}>
              {item.isWebSearch ? renderLinks(item.text) : renderFormattedText(item.text)}
            </Text>
          )}

          {/* Show disease detection info button */}
          {item.isDiseaseDetection && !item.isLoading && !item.isError && (
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => {
                // Show more information about the disease
                if (item.attachments && item.attachments[0]?.metadata) {
                  const disease = item.attachments[0].metadata.disease;
                  Alert.alert(
                    disease.name,
                    `Severity: ${disease.severity.toUpperCase()}\n\n${disease.description}`,
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <Ionicons name="information-circle" size={20} color={colors.white} />
              <Text style={styles.infoButtonText}>More Info</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render a suggestion chip
  const renderSuggestion = ({ item }: { item: ChatSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionChip}
      onPress={() => handleSuggestionPress(item)}
      disabled={loading}
    >
      <Text style={styles.suggestionText} numberOfLines={1}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  // Show initial loading screen
  if (initialLoading) {
    return (
      <View style={styles.container}>
        <LoadingQuote
          loadingText="Initializing AI Assistant..."
          showIndicator={true}
          indicatorSize="large"
          indicatorColor={colors.primary}
          type="general"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIndicator}>
              <Ionicons name="sparkles" size={20} color={colors.white} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>AI Assistant</Text>
              <View style={styles.statusContainer}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.subtitle}>Online • Ready to help</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Animated.View style={[styles.chatContainer, { opacity: fadeAnimation }]}>
        {messages.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="Start a Conversation"
            message="Ask me anything about farming, crops, weather, or how to use the app. I'm here to help!"
            actionText="Ask a Question"
            onAction={() => {
              // Focus on input or show suggestions
            }}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicatorContainer}>
            <View style={styles.botAvatar}>
              <Ionicons name="leaf" size={16} color={colors.white} />
            </View>
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDots, { opacity: typingAnimation }]}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </Animated.View>
            </View>
          </View>
        )}
      </Animated.View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggested Questions</Text>
          <FlatList
            horizontal
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          />
        </View>
      )}

      {/* Image picker modal */}
      {imagePickerVisible && (
        <View style={styles.imagePickerModal}>
          <View style={styles.imagePickerContent}>
            <Text style={styles.imagePickerTitle}>Upload Plant Image</Text>
            <Text style={styles.imagePickerSubtitle}>
              Take a photo or choose from your gallery to analyze your plant for diseases
            </Text>

            <View style={styles.imagePickerButtons}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => handleImageUpload(true)}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={styles.imagePickerButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => handleImageUpload(false)}
              >
                <Ionicons name="images" size={24} color={colors.primary} />
                <Text style={styles.imagePickerButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imagePickerCloseButton}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.imagePickerCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setImagePickerVisible(true)}
            disabled={loading}
          >
            <Ionicons
              name="image"
              size={20}
              color={loading ? colors.lightGray : colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <Input
              style={styles.enhancedInput}
              placeholder="Type your question..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
              containerStyle={styles.inputContainerStyle}
            />
            <Text style={styles.characterCount}>
              {inputText.length}/500
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={16} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...getPlatformTopSpacing('paddingTop', spacing.lg, spacing.xl),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  headerText: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: spacing.xs,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  messagesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    marginLeft: spacing.xs,
    ...shadows.xs,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    maxWidth: '100%',
    ...shadows.xs,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  errorMessageBubble: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  diseaseMessageBubble: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  messageText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.lineHeight.md,
  },
  userMessageText: {
    color: colors.white,
  },
  botMessageText: {
    color: colors.textPrimary,
  },
  errorMessageText: {
    color: colors.error,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontFamily: typography.fontFamily.medium,
  },
  attachmentsContainer: {
    marginBottom: spacing.md,
  },
  imageAttachmentContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imageAttachment: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  imageMetadataContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.xs,
  },
  imageMetadataText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsList: {
    paddingBottom: spacing.xs,
  },
  suggestionChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...shadows.xs,
    minWidth: 100,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Typing indicator styles
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  typingBubble: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...shadows.xs,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mediumGray,
    marginHorizontal: 1,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    ...shadows.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  inputContainerStyle: {
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  enhancedInput: {
    minHeight: 36,
    maxHeight: 100,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    backgroundColor: 'transparent',
    paddingVertical: spacing.xs,
  },
  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    ...shadows.none,
  },
  imagePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imagePickerContent: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  imagePickerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  imagePickerSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  imagePickerButtons: {
    width: '100%',
    flexDirection: 'column',
    marginBottom: spacing.lg,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...shadows.xs,
  },
  imagePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  imagePickerCloseButton: {
    padding: spacing.md,
  },
  imagePickerCloseButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
});

export default ChatbotScreen;
