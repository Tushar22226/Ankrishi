import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';

// Mock soil test data
const mockSoilTests = [
  {
    id: 'test1',
    date: new Date(Date.now() - 86400000 * 30), // 30 days ago
    location: 'North Field',
    results: {
      pH: 6.8,
      nitrogen: 'Medium (45 kg/ha)',
      phosphorus: 'Low (12 kg/ha)',
      potassium: 'High (280 kg/ha)',
      organicMatter: '2.1%',
      texture: 'Loamy',
    },
    recommendations: [
      'Apply 50 kg/ha of phosphatic fertilizer',
      'Maintain current nitrogen levels',
      'No need for additional potassium',
    ],
  },
  {
    id: 'test2',
    date: new Date(Date.now() - 86400000 * 90), // 90 days ago
    location: 'South Field',
    results: {
      pH: 7.2,
      nitrogen: 'Low (25 kg/ha)',
      phosphorus: 'Medium (30 kg/ha)',
      potassium: 'Medium (150 kg/ha)',
      organicMatter: '1.8%',
      texture: 'Sandy Loam',
    },
    recommendations: [
      'Apply 75 kg/ha of nitrogenous fertilizer',
      'Apply 25 kg/ha of phosphatic fertilizer',
      'Apply 25 kg/ha of potassic fertilizer',
      'Add organic matter to improve soil structure',
    ],
  },
];

const SoilTestScreen = () => {
  const navigation = useNavigation();
  const [selectedTest, setSelectedTest] = useState(null);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getStatusColor = (value, type) => {
    switch (type) {
      case 'pH':
        if (value < 6.0 || value > 8.0) return colors.error;
        if (value < 6.5 || value > 7.5) return colors.warning;
        return colors.success;
      case 'nitrogen':
      case 'phosphorus':
      case 'potassium':
        if (value.includes('Low')) return colors.error;
        if (value.includes('Medium')) return colors.warning;
        return colors.success;
      case 'organicMatter':
        const percentage = parseFloat(value);
        if (percentage < 1.5) return colors.error;
        if (percentage < 2.5) return colors.warning;
        return colors.success;
      default:
        return colors.textPrimary;
    }
  };
  
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
      
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <View>
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
            onPress={() => {
              // In a real app, we would navigate to a screen to request a new soil test
              Alert.alert('Request Soil Test', 'This feature will allow you to request a professional soil test. Coming soon!');
            }}
          >
            <Text style={styles.requestText}>Request New Test</Text>
          </TouchableOpacity>
        </View>
        
        {mockSoilTests.map(test => (
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
        ))}
        
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.medium,
  },
  title: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
    padding: spacing.medium,
  },
  infoCard: {
    marginBottom: spacing.medium,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  infoText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
    flex: 1,
  },
  infoIcon: {
    marginLeft: spacing.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  requestText: {
    fontSize: typography.fontSizeRegular,
    color: colors.primary,
  },
  testCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.small,
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
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  testDate: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  testSummary: {
    flexDirection: 'row',
  },
  testSummaryItem: {
    alignItems: 'center',
    marginLeft: spacing.medium,
  },
  testSummaryLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  testSummaryValue: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
  },
  testSummaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsCard: {
    marginTop: spacing.medium,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  detailsTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  detailsDate: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  detailsLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  detailsLocationText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
    marginLeft: 4,
  },
  resultsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.medium,
  },
  resultItem: {
    width: '50%',
    marginBottom: spacing.small,
  },
  resultLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    marginTop: spacing.small,
  },
  recommendationsTitle: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  recommendationText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
    marginLeft: spacing.small,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SoilTestScreen;
