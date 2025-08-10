import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import DocumentService from '../../services/DocumentService';

// Document types
const documentTypes = [
  { id: 'certificate', name: 'Certificate', icon: 'ribbon' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-checkmark' },
  { id: 'report', name: 'Report', icon: 'document-text' },
  { id: 'invoice', name: 'Invoice', icon: 'receipt' },
  { id: 'license', name: 'License', icon: 'card' },
  { id: 'other', name: 'Other', icon: 'folder-open' },
];

// Interface for selected file
interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

const AddDocumentScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('User cancelled document picker');
        return;
      }

      const file = result.assets[0];
      
      // Convert to our expected format
      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
        size: file.size || 0
      });

      // If title is empty, use the file name as default title
      if (!title) {
        setTitle(file.name.split('.')[0]);
      }

      console.log('Selected document:', file);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Upload document
  const handleUploadDocument = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Please select a document type');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    if (!userProfile?.uid) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setUploading(true);

      // Parse expiry date if provided
      let expiryTimestamp: number | null = null;
      if (expiryDate) {
        const date = new Date(expiryDate);
        if (!isNaN(date.getTime())) {
          expiryTimestamp = date.getTime();
        }
      }

      // Parse tags
      const tagsList = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Upload document
      const document = await DocumentService.uploadDocument(
        userProfile.uid,
        selectedFile.uri,
        title,
        selectedType as any,
        selectedFile.name,
        selectedFile.size,
        expiryTimestamp,
        tagsList
      );

      if (document) {
        Alert.alert('Success', 'Document uploaded successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Add Document</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Document Information</Text>

          {/* Document Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Document Title</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter document title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Document Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Document Type</Text>
            <View style={styles.typeContainer}>
              {documentTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && styles.typeButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={
                      selectedType === type.id
                        ? colors.white
                        : colors.textPrimary
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.id && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Expiry Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Expiry Date (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Tags */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tags (Comma Separated)</Text>
            <TextInput
              style={styles.formInput}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g. important, farm, certificate"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* File Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select File</Text>
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={pickDocument}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
              <Text style={styles.filePickerButtonText}>
                {selectedFile ? selectedFile.name : 'Choose a file'}
              </Text>
            </TouchableOpacity>

            {selectedFile && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileInfoText}>
                  Size: {formatFileSize(selectedFile.size)}
                </Text>
                <Text style={styles.fileInfoText}>
                  Type: {selectedFile.type}
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Button
          title={uploading ? 'Uploading...' : 'Upload Document'}
          onPress={handleUploadDocument}
          disabled={uploading}
          style={styles.uploadButton}
        />

        {uploading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingIndicator}
          />
        )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  typeButtonTextSelected: {
    color: colors.white,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  filePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  fileInfo: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  fileInfoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  uploadButton: {
    marginTop: spacing.md,
  },
  loadingIndicator: {
    marginTop: spacing.md,
  },
});

export default AddDocumentScreen;
