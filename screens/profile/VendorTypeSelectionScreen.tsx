import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Button from '../../components/Button';

const VendorTypeSelectionScreen = () => {
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(null);

  const handleContinue = () => {
    if (!selectedType) return;

    // Temporary implementation - show coming soon message
    Alert.alert(
      'Coming Soon',
      `${selectedType === 'individual' ? 'Individual vendor' : 'Company'} verification forms are currently being developed. Please check back soon!`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('VerifyProfile' as never)
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Vendor Type</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>
        Please select your vendor type to continue with the verification process.
      </Text>

      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedType === 'individual' && styles.selectedCard,
        ]}
        onPress={() => setSelectedType('individual')}
      >
        <View style={styles.optionContent}>
          <View style={[
            styles.optionIcon,
            selectedType === 'individual' && styles.selectedIcon,
          ]}>
            <Ionicons
              name="person"
              size={24}
              color={selectedType === 'individual' ? colors.white : colors.textPrimary}
            />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Individual Seller / Shop Owner</Text>
            <Text style={styles.optionDescription}>
              Select this if you are an individual seller or own a small shop.
            </Text>
          </View>
        </View>
        {selectedType === 'individual' && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.optionCard,
          selectedType === 'company' && styles.selectedCard,
        ]}
        onPress={() => setSelectedType('company')}
      >
        <View style={styles.optionContent}>
          <View style={[
            styles.optionIcon,
            selectedType === 'company' && styles.selectedIcon,
          ]}>
            <Ionicons
              name="business"
              size={24}
              color={selectedType === 'company' ? colors.white : colors.textPrimary}
            />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Registered Business / Company</Text>
            <Text style={styles.optionDescription}>
              Select this if you represent a registered business or company.
            </Text>
          </View>
        </View>
        {selectedType === 'company' && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={!selectedType}
        style={styles.continueButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop:20,
  },
  contentContainer: {
    padding: 18,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E3A59',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 42,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
    marginHorizontal: 24,
    lineHeight: 22,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginHorizontal: 4,
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0F9F0',
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedIcon: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  continueButton: {
    marginTop: 24,
    marginHorizontal: 4,
    height: 52,
    borderRadius: 12,
  },
});

export default VendorTypeSelectionScreen;
