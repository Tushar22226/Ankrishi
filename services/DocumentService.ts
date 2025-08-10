import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';

// Document interface
export interface Document {
  id: string;
  title: string;
  type: 'certificate' | 'insurance' | 'report' | 'invoice' | 'license' | 'other';
  fileName: string;
  fileSize: number;
  uploadDate: number;
  expiryDate?: number | null;
  tags: string[];
  url: string;
  userId: string;
}

class DocumentService {
  // Get all documents for a user
  async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      console.log(`Getting documents for user: ${userId}`);

      // Query documents for the user
      const documentsRef = database().ref('documents');
      const query = documentsRef.orderByChild('userId').equalTo(userId);
      const snapshot = await query.once('value');

      const documents: Document[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const document = {
            id: child.key as string,
            ...child.val()
          };
          documents.push(document);
          return undefined; // Required for TypeScript with forEach
        });
      }

      console.log(`Found ${documents.length} documents for user ${userId}`);
      return documents;
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }

  // Get a document by ID
  async getDocumentById(documentId: string): Promise<Document | null> {
    try {
      console.log(`Getting document with ID: ${documentId}`);

      const documentRef = database().ref(`documents/${documentId}`);
      const snapshot = await documentRef.once('value');

      if (snapshot.exists()) {
        const document = {
          id: snapshot.key as string,
          ...snapshot.val()
        };
        return document;
      }

      console.log(`No document found with ID: ${documentId}`);
      return null;
    } catch (error) {
      console.error(`Error getting document with ID ${documentId}:`, error);
      return null;
    }
  }

  // Upload a document
  async uploadDocument(
    userId: string,
    uri: string,
    title: string,
    type: Document['type'],
    fileName: string,
    fileSize: number,
    expiryDate: number | null,
    tags: string[]
  ): Promise<Document | null> {
    try {
      console.log(`Uploading document for user: ${userId}`);

      // Generate a unique filename
      const storageFileName = `${userId}/documents/${Date.now()}_${fileName}`;
      const storageRef = storage().ref(storageFileName);

      // Upload the file
      await storageRef.putFile(uri);

      // Get download URL
      const url = await storageRef.getDownloadURL();

      // Create document object
      const document: Omit<Document, 'id'> = {
        title,
        type,
        fileName,
        fileSize,
        uploadDate: Date.now(),
        expiryDate,
        tags,
        url,
        userId
      };

      // Save to database
      const documentsRef = database().ref('documents');
      const newDocumentRef = documentsRef.push();
      await newDocumentRef.set(document);

      // Return the complete document
      return {
        id: newDocumentRef.key as string,
        ...document
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  }

  // Delete a document
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      console.log(`Deleting document with ID: ${documentId}`);

      // Get the document to get the storage path
      const document = await this.getDocumentById(documentId);

      if (!document) {
        console.log(`No document found with ID: ${documentId}`);
        return false;
      }

      // Delete from storage if URL exists
      if (document.url) {
        try {
          // Extract the storage path from the URL
          const storageRef = storage().refFromURL(document.url);
          await storageRef.delete();
          console.log(`Deleted document file from storage: ${document.url}`);
        } catch (storageError) {
          console.error('Error deleting document from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const documentRef = database().ref(`documents/${documentId}`);
      await documentRef.remove();
      console.log(`Deleted document from database: ${documentId}`);

      return true;
    } catch (error) {
      console.error(`Error deleting document with ID ${documentId}:`, error);
      return false;
    }
  }

  // Share a document
  async shareDocument(documentId: string): Promise<boolean> {
    try {
      console.log(`Sharing document with ID: ${documentId}`);

      // Get the document
      const document = await this.getDocumentById(documentId);

      if (!document) {
        console.log(`No document found with ID: ${documentId}`);
        return false;
      }

      // Share the document URL
      await Share.share({
        title: document.title,
        message: `View document: ${document.url}`
      });

      return true;
    } catch (error) {
      console.error(`Error sharing document with ID ${documentId}:`, error);
      return false;
    }
  }
}

export default new DocumentService();
