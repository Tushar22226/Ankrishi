import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import TabView, { TabItem } from '../../components/TabView';
import DocumentService, { Document } from '../../services/DocumentService';

// No mock documents - we'll use real data from Firebase

// Document categories
const documentCategories = [
  { id: 'all', name: 'All Documents', icon: 'documents-outline' },
  { id: 'certificate', name: 'Certificates', icon: 'ribbon' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-checkmark' },
  { id: 'report', name: 'Reports', icon: 'document-text' },
  { id: 'invoice', name: 'Invoices', icon: 'receipt' },
  { id: 'license', name: 'Licenses', icon: 'card' },
  { id: 'other', name: 'Others', icon: 'folder-open' },
];

const DocumentManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize the tabs to avoid re-creating them on each render
  const tabItems = useMemo<TabItem[]>(() => {
    return documentCategories.map(category => ({
      key: category.id,
      title: category.name,
      icon: category.icon
    }));
  }, [documentCategories]);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true);

      if (!userProfile?.uid) {
        console.error('User ID not found');
        setLoading(false);
        return;
      }

      // Fetch documents from Firebase
      const fetchedDocuments = await DocumentService.getUserDocuments(userProfile.uid);

      if (fetchedDocuments.length === 0) {
        console.log('No documents found for user');
      } else {
        console.log(`Loaded ${fetchedDocuments.length} documents`);
      }

      setDocuments(fetchedDocuments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading documents:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load documents. Please try again.');
    }
  };

  // Format date
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format file size
  const formatFileSize = (size: number) => {
    return `${size.toFixed(1)} MB`;
  };

  // Get filtered documents
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(doc => doc.type === activeCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          doc.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  // Get document icon
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return 'ribbon';
      case 'insurance':
        return 'shield-checkmark';
      case 'report':
        return 'document-text';
      case 'invoice':
        return 'receipt';
      case 'license':
        return 'card';
      default:
        return 'document';
    }
  };

  // Get document icon color
  const getDocumentIconColor = (type: string) => {
    switch (type) {
      case 'certificate':
        return colors.success;
      case 'insurance':
        return colors.info;
      case 'report':
        return colors.primary;
      case 'invoice':
        return colors.warning;
      case 'license':
        return colors.secondary;
      default:
        return colors.mediumGray;
    }
  };

  // Handle document selection
  const handleDocumentSelect = async (document: Document) => {
    try {
      // Show loading indicator
      setLoading(true);

      // Get the document URL
      const url = document.url;

      if (!url) {
        Alert.alert('Error', 'Document URL not found');
        setLoading(false);
        return;
      }

      // Show loading message
      Alert.alert(
        'Opening Document',
        'The document will open in your browser.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false)
          },
          {
            text: 'Open',
            onPress: async () => {
              // Use Linking to open the URL in the browser
              const canOpen = await Linking.canOpenURL(url);

              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Error', 'Cannot open this document URL');
              }

              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
      setLoading(false);
    }
  };

  // Handle document deletion
  const handleDocumentDelete = (document: Document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"?`,
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
              // Show loading indicator
              setLoading(true);

              // Delete document from Firebase
              const success = await DocumentService.deleteDocument(document.id);

              if (success) {
                // Update local state
                setDocuments(documents.filter(doc => doc.id !== document.id));
                Alert.alert('Success', 'Document deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete document. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render a document item
  const renderDocumentItem = ({ item }: { item: Document }) => (
    <Card style={styles.documentCard}>
      <TouchableOpacity
        style={styles.documentContent}
        onPress={() => handleDocumentSelect(item)}
      >
        <View
          style={[
            styles.documentIcon,
            { backgroundColor: getDocumentIconColor(item.type) + '20' }, // 20% opacity
          ]}
        >
          <Ionicons
            name={getDocumentIcon(item.type) as any}
            size={24}
            color={getDocumentIconColor(item.type)}
          />
        </View>

        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>{item.title}</Text>

          <View style={styles.documentMeta}>
            <Text style={styles.documentFileName}>{item.fileName}</Text>
            <Text style={styles.documentFileSize}>{formatFileSize(item.fileSize)}</Text>
          </View>

          <View style={styles.documentDates}>
            <Text style={styles.documentDateText}>
              Uploaded: {formatDate(item.uploadDate)}
            </Text>
            {item.expiryDate && (
              <Text style={styles.documentDateText}>
                Expires: {formatDate(item.expiryDate)}
              </Text>
            )}
          </View>

          <View style={styles.tagsContainer}>
            {item.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.documentAction}
          onPress={() => handleDocumentSelect(item)}
        >
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.documentAction}
          onPress={async () => {
            try {
              // Share the document
              const success = await DocumentService.shareDocument(item.id);
              if (!success) {
                Alert.alert('Error', 'Failed to share document. Please try again.');
              }
            } catch (error) {
              console.error('Error sharing document:', error);
              Alert.alert('Error', 'Failed to share document. Please try again.');
            }
          }}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.documentAction}
          onPress={() => handleDocumentDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <LoadingQuote />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.mediumGray} />
          <TouchableOpacity
            style={styles.searchInput}
            onPress={() => navigation.navigate('DocumentSearch' as never)}
          >
            <Text style={styles.searchPlaceholder}>
              Search documents by title or tags...
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories - Improved Tab Bar */}
      <TabView
        tabs={tabItems}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
        style={styles.tabsContainer}
        scrollable={true}
        equalWidth={false}
        showBadges={false}
      />

      {getFilteredDocuments().length > 0 ? (
        <FlatList
          data={getFilteredDocuments()}
          renderItem={renderDocumentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.documentsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No Documents Found</Text>
          <Text style={styles.emptyText}>
            You don't have any documents in this category.
          </Text>

          <Text style={styles.emptySubtext}>
            Contract PDFs will appear here automatically when generated.
          </Text>
        </View>
      )}

      {/* View PDF FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (documents.length > 0) {
            // Navigate to the first document if available
            const firstDocument = getFilteredDocuments()[0];
            if (firstDocument) {
              handleDocumentSelect(firstDocument);
            }
          } else {
            // Show message if no documents
            Alert.alert(
              'No Documents',
              'You don\'t have any documents yet. Generate a contract PDF first.',
              [{ text: 'OK' }]
            );
          }
        }}
      >
        <Ionicons name="document-text" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
    marginBottom: spacing.sm,
  },
  documentsList: {
    padding: spacing.md,
  },
  documentCard: {
    marginBottom: spacing.md,
  },
  documentContent: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  documentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  documentFileName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  documentFileSize: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  documentDates: {
    marginBottom: spacing.xs,
  },
  documentDateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  documentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  documentAction: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
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
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    width: 40,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default DocumentManagementScreen;
