import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';

// Define document interface
interface ContractDocument {
  id: string;
  name: string;
  type: 'note' | 'template' | 'generated';
  content: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  templateType?: string;
}

interface DocumentsManagementProps {
  contractId: string;
  documents: ContractDocument[];
}

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentsManagement: React.FC<DocumentsManagementProps> = ({ contractId, documents: initialDocuments }) => {
  // State
  const [documents, setDocuments] = useState<ContractDocument[]>(initialDocuments || []);
  const [isLoading, setIsLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Note form state
  const [noteName, setNoteName] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Template form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  // Load documents on component mount
  useEffect(() => {
    if (!initialDocuments || initialDocuments.length === 0) {
      loadDocuments();
    }
  }, [contractId, initialDocuments]);

  // Load documents
  const loadDocuments = async () => {
    try {
      setIsLoading(true);

      // In a real app, this would fetch documents from Firebase
      // For now, we'll use mock data if no documents were passed
      if (!initialDocuments || initialDocuments.length === 0) {
        const mockDocuments: ContractDocument[] = [
          {
            id: '1',
            name: 'Contract Terms',
            type: 'note',
            content: 'This contract is for the supply of 100kg of wheat at ₹25 per kg. Delivery expected by end of month.',
            createdBy: 'Farmer',
            createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
            updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          },
          {
            id: '2',
            name: 'Payment Schedule',
            type: 'template',
            content: 'Payment 1: ₹1,250 (50%) - On signing\nPayment 2: ₹1,250 (50%) - On delivery',
            createdBy: 'Farmer',
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
            updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            templateType: 'payment_schedule',
          },
        ];

        setDocuments(mockDocuments);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading documents:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load documents');
    }
  };

  // Add a new note
  const handleAddNote = () => {
    if (!noteName.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }

    if (!noteContent.trim()) {
      Alert.alert('Error', 'Please enter note content');
      return;
    }

    try {
      // Create a new note document
      const newNote: ContractDocument = {
        id: Date.now().toString(),
        name: noteName.trim(),
        type: 'note',
        content: noteContent.trim(),
        createdBy: 'Current User',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add the note to the list
      setDocuments([...documents, newNote]);

      // Reset form
      setNoteName('');
      setNoteContent('');

      // Close modal
      setShowNoteModal(false);

      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  // Add a new template
  const handleAddTemplate = () => {
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a template title');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a template type');
      return;
    }

    if (!templateContent.trim()) {
      Alert.alert('Error', 'Please enter template content');
      return;
    }

    try {
      // Create a new template document
      const newTemplate: ContractDocument = {
        id: Date.now().toString(),
        name: templateName.trim(),
        type: 'template',
        content: templateContent.trim(),
        createdBy: 'Current User',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateType: selectedTemplate,
      };

      // Add the template to the list
      setDocuments([...documents, newTemplate]);

      // Reset form
      setTemplateName('');
      setSelectedTemplate('');
      setTemplateContent('');

      // Close modal
      setShowTemplateModal(false);

      Alert.alert('Success', 'Template added successfully');
    } catch (error) {
      console.error('Error adding template:', error);
      Alert.alert('Error', 'Failed to add template');
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      // Use react-native-document-picker
      const result = await DocumentPicker.pick({
        type: [
          types.pdf,
          types.images,
          types.doc,
          types.docx
        ],
        allowMultiSelection: false,
      });

      // DocumentPicker.pick returns an array in newer versions
      const file = Array.isArray(result) ? result[0] : result;

      // Convert to our expected format
      setSelectedFile({
        uri: file.uri,
        name: file.name || 'Document',
        type: file.type || '',
        size: file.size || 0
      });
      setDocumentName(file.name || 'Document');
      setDocumentType(file.type || '');

      console.log('Selected document:', file);
    } catch (error) {
      // Handle user cancellation
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled document picker');
      } else {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  // Upload document
  const handleUploadDocument = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    if (!documentName.trim()) {
      Alert.alert('Error', 'Please enter a document name');
      return;
    }

    try {
      setUploading(true);

      // In a real app, this would upload the file to Firebase Storage
      // For now, we'll simulate the upload

      // Create a new document object
      const newDocument: ContractDocument = {
        id: Date.now().toString(),
        name: documentName.trim(),
        type: documentType || selectedFile.type || 'application/octet-stream',
        size: selectedFile.size || 0,
        url: selectedFile.uri,
        uploadedBy: 'Current User',
        uploadedAt: Date.now(),
      };

      // Add the document to the list
      setDocuments([...documents, newDocument]);

      // Reset form
      setSelectedFile(null);
      setDocumentName('');
      setDocumentType('');

      // Close modal
      setShowAddModal(false);

      setUploading(false);
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  // View document
  const handleViewDocument = async (document: ContractDocument) => {
    try {
      // In a real app, this would open the document in a viewer
      // For now, we'll just show an alert
      Alert.alert(
        'View Document',
        `This would open the document "${document.name}" in a viewer.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Share',
            onPress: () => handleShareDocument(document),
          },
        ]
      );
    } catch (error) {
      console.error('Error viewing document:', error);
      Alert.alert('Error', 'Failed to view document');
    }
  };

  // Share document
  const handleShareDocument = async (document: ContractDocument) => {
    try {
      // In a real app, this would download the file and share it
      // For now, we'll just show an alert
      Alert.alert(
        'Share Document',
        `This would share the document "${document.name}" with others.`
      );
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };

  // Delete document
  const handleDeleteDocument = (document: ContractDocument) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, this would delete the file from Firebase Storage
              // For now, we'll just remove it from the list
              const updatedDocuments = documents.filter(doc => doc.id !== document.id);
              setDocuments(updatedDocuments);

              Alert.alert('Success', 'Document deleted successfully');
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  // Get icon for document type
  const getDocumentIcon = (type: string): any => {
    if (type.startsWith('image/')) {
      return 'image-outline' as const;
    } else if (type.includes('pdf')) {
      return 'document-text-outline' as const;
    } else if (type.includes('word') || type.includes('document')) {
      return 'document-outline' as const;
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return 'grid-outline' as const;
    } else {
      return 'document-outline' as const;
    }
  };

  // Render document item
  const renderDocumentItem = ({ item }: { item: ContractDocument }) => {
    return (
      <Card style={styles.documentCard}>
        <TouchableOpacity
          style={styles.documentCardContent}
          onPress={() => handleViewDocument(item)}
        >
          <View style={styles.documentIconContainer}>
            <Ionicons
              name={getDocumentIcon(item.type)}
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.documentDetails}>
            <Text style={styles.documentName}>{item.name}</Text>
            <Text style={styles.documentInfo}>
              {formatFileSize(item.size)} • {formatDate(new Date(item.uploadedAt))}
            </Text>
            <Text style={styles.documentUploader}>
              Uploaded by: {item.uploadedBy}
            </Text>
          </View>

          <View style={styles.documentActions}>
            <TouchableOpacity
              style={styles.documentActionButton}
              onPress={() => handleShareDocument(item)}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.documentActionButton}
              onPress={() => handleDeleteDocument(item)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <Button
          title="Upload Document"
          onPress={() => setShowAddModal(true)}
          size="small"
        />
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No Documents</Text>
          <Text style={styles.emptyText}>
            No documents have been uploaded for this contract yet.
          </Text>
          <Button
            title="Upload Document"
            onPress={() => setShowAddModal(true)}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.documentsList}
        />
      )}

      {/* Upload Document Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddModal(false);
                  setSelectedFile(null);
                  setDocumentName('');
                  setDocumentType('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Document Name</Text>
              <TextInput
                style={styles.formInput}
                value={documentName}
                onChangeText={setDocumentName}
                placeholder="Enter document name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select File</Text>
              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={pickDocument}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                <Text style={styles.filePickerButtonText}>
                  {selectedFile
                    ? selectedFile.name
                    : 'Choose a file'}
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <Text style={styles.fileInfo}>
                  {formatFileSize(selectedFile.size || 0)}
                </Text>
              )}
            </View>

            <Button
              title={uploading ? 'Uploading...' : 'Upload Document'}
              onPress={handleUploadDocument}
              disabled={uploading || !selectedFile}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
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
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    width: '80%',
  },
  documentsList: {
    paddingBottom: spacing.xl,
  },
  documentCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  documentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentInfo: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  documentUploader: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentActionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center',
  },
  filePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  fileInfo: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default DocumentsManagement;
