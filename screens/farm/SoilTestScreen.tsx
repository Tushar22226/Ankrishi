import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import { SoilTestResult } from '../../models/Farm';

const SoilTestScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [soilTests, setSoilTests] = useState<SoilTestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<SoilTestResult | null>(null);

  // Load soil tests on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadSoilTests();
    } else {
      setLoading(false);
    }
  }, []);

  // Load soil tests from Firebase
  const loadSoilTests = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // Get soil tests from Firebase
      const tests = await FarmService.getSoilTests(userProfile.uid);
      setSoilTests(tests);

      // Select the most recent test by default if available
      if (tests.length > 0) {
        const sortedTests = [...tests].sort((a, b) => b.date - a.date);
        setSelectedTest(sortedTests[0]);
      }
    } catch (error) {
      console.error('Error loading soil tests:', error);
      Alert.alert('Error', 'Failed to load soil test data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Request new soil test
  const handleRequestTest = () => {
    Alert.alert(
      'Request Soil Test',
      'This feature will allow you to request a professional soil test. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (value: any, type: string) => {
    switch (type) {
      case 'pH':
        if (value < 6.0 || value > 8.0) return colors.error;
        if (value < 6.5 || value > 7.5) return colors.warning;
        return colors.success;
      case 'nitrogen':
      case 'phosphorus':
      case 'potassium':
        if (typeof value === 'string' && value.includes('Low')) return colors.error;
        if (typeof value === 'string' && value.includes('Medium')) return colors.warning;
        return colors.success;
      case 'organicMatter':
        const percentage = typeof value === 'string' ? parseFloat(value) : value;
        if (percentage < 1.5) return colors.error;
        if (percentage < 2.5) return colors.warning;
        return colors.success;
      default:
        return colors.textPrimary;
    }
  };

  // Render test details
  const renderTestDetails = () => {
    if (!selectedTest) return null;

    return (
      <Card style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Soil Test Results</Text>
          <Text style={styles.detailsDate}>{formatDate(selectedTest.date)}</Text>
        </View>

        <View style={styles.detailsLocation}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.detailsLocationText}>{selectedTest.location}</Text>
        </View>

        <View style={styles.resultsContainer}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>pH</Text>
            <Text style={[styles.resultValue, { color: getStatusColor(selectedTest.results.pH, 'pH') }]}>
              {selectedTest.results.pH}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Nitrogen</Text>
            <Text style={[styles.resultValue, { color: getStatusColor(selectedTest.results.nitrogen, 'nitrogen') }]}>
              {selectedTest.results.nitrogen}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Phosphorus</Text>
            <Text style={[styles.resultValue, { color: getStatusColor(selectedTest.results.phosphorus, 'phosphorus') }]}>
              {selectedTest.results.phosphorus}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Potassium</Text>
            <Text style={[styles.resultValue, { color: getStatusColor(selectedTest.results.potassium, 'potassium') }]}>
              {selectedTest.results.potassium}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Organic Matter</Text>
            <Text style={[styles.resultValue, { color: getStatusColor(selectedTest.results.organicMatter, 'organicMatter') }]}>
              {selectedTest.results.organicMatter}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Texture</Text>
            <Text style={styles.resultValue}>{selectedTest.results.texture}</Text>
          </View>
        </View>

        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          {selectedTest.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading soil test data...</Text>
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
        <Text style={styles.title}>Soil Test</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Soil Health Analysis</Text>
              <Text style={styles.infoText}>
                Regular soil testing helps you understand your soil's nutrient levels and pH, allowing for precise fertilizer application and better crop management.
              </Text>
            </View>
            <View style={styles.infoIcon}>
              <Ionicons name="flask" size={48} color={colors.primary} />
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Previous Tests</Text>
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestTest}
          >
            <Text style={styles.requestText}>Request New Test</Text>
          </TouchableOpacity>
        </View>

        {soilTests.length > 0 ? (
          soilTests.map(test => (
            <TouchableOpacity
              key={test.id}
              style={[
                styles.testCard,
                selectedTest?.id === test.id && styles.selectedTestCard,
              ]}
              onPress={() => setSelectedTest(test)}
            >
              <View style={styles.testCardContent}>
                <View>
                  <Text style={styles.testLocation}>{test.location}</Text>
                  <Text style={styles.testDate}>{formatDate(test.date)}</Text>
                </View>

                <View style={styles.testSummary}>
                  <View style={styles.testSummaryItem}>
                    <Text style={styles.testSummaryLabel}>pH</Text>
                    <Text style={[styles.testSummaryValue, { color: getStatusColor(test.results.pH, 'pH') }]}>
                      {test.results.pH}
                    </Text>
                  </View>

                  <View style={styles.testSummaryItem}>
                    <Text style={styles.testSummaryLabel}>N</Text>
                    <View style={[styles.testSummaryDot, { backgroundColor: getStatusColor(test.results.nitrogen, 'nitrogen') }]} />
                  </View>

                  <View style={styles.testSummaryItem}>
                    <Text style={styles.testSummaryLabel}>P</Text>
                    <View style={[styles.testSummaryDot, { backgroundColor: getStatusColor(test.results.phosphorus, 'phosphorus') }]} />
                  </View>

                  <View style={styles.testSummaryItem}>
                    <Text style={styles.testSummaryLabel}>K</Text>
                    <View style={[styles.testSummaryDot, { backgroundColor: getStatusColor(test.results.potassium, 'potassium') }]} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Soil Tests Yet</Text>
            <Text style={styles.emptyText}>
              Regular soil testing helps you understand your soil's nutrient levels and make better decisions for your crops.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleRequestTest}
            >
              <Text style={styles.emptyButtonText}>Request Your First Soil Test</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderTestDetails()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 32 : 48,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoIcon: {
    marginLeft: 16,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  requestText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  testCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTestCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  testCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  testDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  testSummary: {
    flexDirection: 'row',
  },
  testSummaryItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  testSummaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  testSummaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testSummaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  detailsCard: {
    marginTop: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  detailsDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailsLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsLocationText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  resultsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  resultItem: {
    width: '50%',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default SoilTestScreen;
