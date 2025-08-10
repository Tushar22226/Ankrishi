import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const AddRequirementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Basic form state
  const [productType, setProductType] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');

  // Check if user is vendor or buyer
  useEffect(() => {
    if (userProfile && userProfile.role !== 'vendor' && userProfile.role !== 'buyer') {
      Alert.alert(
        'Access Restricted',
        'Only vendors and buyers can post requirements.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [userProfile, navigation]);

  // Handle form submission
  const handleSubmit = () => {
    // Validation will be added later
    Alert.alert('Feature in Development', 'This feature is being implemented.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Post Requirement</Text>
          <View style={styles.placeholder} />
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          
          {/* Form fields will be added here */}
          <Input
            label="Item Name"
            placeholder="e.g., Tomato, Wheat, Apple"
            value={itemName}
            onChangeText={setItemName}
            required
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Post Requirement"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  formCard: {
    margin: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});

export default AddRequirementScreen;
