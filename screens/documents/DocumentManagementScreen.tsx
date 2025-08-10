import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Mock document data
const mockDocuments = [
  {
    id: '1',
    title: 'Land Ownership Certificate',
    type: 'certificate',
    fileName: 'land_ownership_certificate.pdf',
    fileSize: 1.2, // in MB
    uploadDate: new Date(Date.now() - 86400000 * 180), // 180 days ago
    expiryDate: null,
    tags: ['land', 'ownership', 'legal'],
  },
  {
    id: '2',
    title: 'Crop Insurance Policy',
    type: 'insurance',
    fileName: 'crop_insurance_policy_2023.pdf',
    fileSize: 2.5, // in MB
    uploadDate: new Date(Date.now() - 86400000 * 90), // 90 days ago
    expiryDate: new Date(Date.now() + 86400000 * 275), // 275 days from now
    tags: ['insurance', 'crop', 'policy'],
  },
  {
    id: '3',
    title: 'Soil Test Report',
    type: 'report',
    fileName: 'soil_test_report_2023.pdf',
    fileSize: 3.7, // in MB
    uploadDate: new Date(Date.now() - 86400000 * 45), // 45 days ago
    expiryDate: null,
    tags: ['soil', 'test', 'report'],
  },
  {
    id: '4',
    title: 'Farm Equipment Invoice',
    type: 'invoice',
    fileName: 'tractor_invoice_2023.pdf',
    fileSize: 0.8, // in MB
    uploadDate: new Date(Date.now() - 86400000 * 120), // 120 days ago
    expiryDate: null,
    tags: ['invoice', 'equipment', 'purchase'],
  },
  {
    id: '5',
    title: 'Pesticide License',
    type: 'license',
    fileName: 'pesticide_license_2023.pdf',
    fileSize: 1.5, // in MB
    uploadDate: new Date(Date.now() - 86400000 * 150), // 150 days ago
    expiryDate: new Date(Date.now() + 86400000 * 215), // 215 days from now
    tags: ['license', 'pesticide', 'legal'],
  },
];

// Document categories
const documentCategories = [
  { id: 'all', name: 'All Documents' },
  { id: 'certificate', name: 'Certificates' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'report', name: 'Reports' },
  { id: 'invoice', name: 'Invoices' },
  { id: 'license', name: 'Licenses' },
  { id: 'other', name: 'Others' },
];

const DocumentManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);
  
  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would fetch data from a service
      // For now, let's use mock data
      setTimeout(() => {
        setDocuments(mockDocuments);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading documents:', error);
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
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
  const handleDocumentSelect = (document: any) => {
    navigation.navigate('DocumentViewer' as never, { documentId: document.id } as never);
  };
  
  // Handle document deletion
  const handleDocumentDelete = (document: any) => {
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
          onPress: () => {
            // In a real app, we would delete the document from the database
            // For now, let's just update the local state
            setDocuments(documents.filter(doc => doc.id !== document.id));
          },
        },
      ]
    );
  };
  
  // Render a document item
  const renderDocumentItem = ({ item }: { item: any }) => (
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
              Uploaded: {formatDate(new Date(item.uploadDate))}
            </Text>
            {item.expiryDate && (
              <Text style={styles.documentDateText}>
                Expires: {formatDate(new Date(item.expiryDate))}
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
          onPress={() => {
            // In a real app, we would share the document
            Alert.alert('Share', `Sharing "${item.title}" is not implemented yet.`);
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
        <Text style={styles.loadingText}>Loading documents...</Text>
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
        
        <Text style={styles.title}>Document Management</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDocument' as never)}
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
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
      
      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {documentCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              activeCategory === category.id && styles.activeCategoryButton,
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                activeCategory === category.id && styles.activeCategoryButtonText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
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
          
          <Button
            title="Upload New Document"
            onPress={() => navigation.navigate('AddDocument' as never)}
            style={styles.emptyButton}
          />
        </View>
      )}
      
      {/* Upload FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDocument' as never)}
      >
        <Ionicons name="add" size={24} color={colors.white} />
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
  categoriesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  categoryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  activeCategoryButton: {
    backgroundColor: colors.primaryLight,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeCategoryButtonText: {
    color: colors.primary,
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
