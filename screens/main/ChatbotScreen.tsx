import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import ChatbotService, { ChatMessage, ChatSuggestion } from '../../services/ChatbotService';
import Card from '../../components/Card';
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

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage = ChatbotService.createBotMessage(
      `Hello${userProfile?.displayName ? ' ' + userProfile.displayName : ''}! I'm your FarmConnect AI assistant. How can I help you today?\n\nYou can ask me about:\n• Crops, farming practices, and agricultural techniques\n• Weather forecasts and climate information\n• Market prices and trends\n• App features and how to use them\n• Upload a photo of your plants for disease detection\n\nWhat would you like to know?`
    );
    setMessages([welcomeMessage]);

    // Get initial suggestions
    const initialSuggestions = ChatbotService.getSuggestions();
    setSuggestions(initialSuggestions);

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

    // Add loading message from bot
    const loadingMessage = ChatbotService.createBotMessage(
      containsHindiOrMarathi ? 'आपका संदेश प्रोसेस किया जा रहा है...' : '',
      true
    );

    setMessages(prevMessages => [...prevMessages, userMessage, loadingMessage]);

    // Get response from chatbot service
    setLoading(true);
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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    // Function to render bullet points
    const renderBulletPoints = (text: string) => {
      // Check if the text contains bullet points (• or - at the beginning of a line)
      if (text.includes('•') || /^\s*-\s+/m.test(text)) {
        return renderFormattedText(text);
      }
      return text;
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Ask me anything about farming or the app</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

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

      <Card style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setImagePickerVisible(true)}
          disabled={loading}
        >
          <Ionicons
            name="image"
            size={24}
            color={loading ? colors.lightGray : colors.primary}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type your question..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
  },
  header: {
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  messagesContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 4,
  },
  errorMessageBubble: {
    backgroundColor: colors.errorLight,
  },
  diseaseMessageBubble: {
    backgroundColor: colors.info,
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
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  suggestionsList: {
    paddingBottom: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  imagePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imagePickerContent: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  imagePickerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  imagePickerSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  imagePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  imagePickerCloseButton: {
    padding: spacing.sm,
  },
  imagePickerCloseButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
});

export default ChatbotScreen;
