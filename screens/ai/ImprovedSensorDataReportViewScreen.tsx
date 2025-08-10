import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Share,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { SensorType, SensorInfo } from '../../models/Sensor';
import SensorService from '../../services/SensorService';
import LoadingQuote from '../../components/LoadingQuote';

const { width: screenWidth } = Dimensions.get('window');

// Define the categories for the report
const REPORT_CATEGORIES = [
  { id: 'analysis', label: 'Analysis', icon: 'analytics-outline' },
  { id: 'cropImpact', label: 'Crop Impact', icon: 'leaf-outline' },
  { id: 'actions', label: 'Actions', icon: 'construct-outline' },
  { id: 'economics', label: 'Economics', icon: 'cash-outline' },
  { id: 'risk', label: 'Risk', icon: 'warning-outline' },
  { id: 'trends', label: 'Trends', icon: 'trending-up-outline' },
];

const ImprovedSensorDataReportViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();
  const reportId = route.params?.reportId;

  // State variables
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('analysis');

  // Load report data when component mounts
  useEffect(() => {
    if (!reportId) {
      Alert.alert('Error', 'Report ID not found');
      navigation.goBack();
      return;
    }

    loadReport();
  }, [reportId]);

  // Load report data
  const loadReport = async () => {
    try {
      setLoading(true);
      const reportData = await SensorService.getSensorReport(reportId);

      if (!reportData) {
        Alert.alert('Error', 'Report not found');
        navigation.goBack();
        return;
      }

      setReport(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Failed to load report data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Handle share report
  const handleShareReport = async () => {
    if (!report) return;

    try {
      const sensorInfo = SensorInfo[report.sensorData.sensorType];
      const message = `
Farm Sensor Report - ${sensorInfo.name}
Reading: ${report.sensorData.value} ${sensorInfo.unit}
Status: ${report.analysis.status.toUpperCase()}
Date: ${new Date(report.createdAt).toLocaleString()}

Analysis: ${report.analysis.interpretation}

Recommendations: ${report.recommendations.join('\n- ')}
      `;

      await Share.share({
        message,
        title: `Farm Sensor Report - ${sensorInfo.name}`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  // Render report header
  const renderReportHeader = () => {
    if (!report) return null;

    const sensorInfo = SensorInfo[report.sensorData.sensorType];
    const statusColor =
      report.analysis.status === 'good' ? colors.success :
      report.analysis.status === 'warning' ? colors.warning :
      colors.error;

    const statusText =
      report.analysis.status === 'good' ? 'Optimal' :
      report.analysis.status === 'warning' ? 'Warning' :
      'Critical';

    const statusIcon =
      report.analysis.status === 'good' ? 'checkmark-circle' :
      report.analysis.status === 'warning' ? 'alert-circle' :
      'close-circle';

    return (
      <Card style={styles.reportHeaderCard}>
        <LinearGradient
          colors={[colors.white, colors.surfaceLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.reportHeaderTop}>
            <View style={styles.sensorMetaInfo}>
              <View style={[styles.sensorIconContainer, { backgroundColor: sensorInfo.color }]}>
                <Ionicons name={sensorInfo.icon as any} size={24} color={colors.white} />
              </View>
              <View style={styles.reportHeaderInfo}>
                <Text style={styles.sensorName}>{sensorInfo.name}</Text>
                <Text style={styles.reportDate}>
                  {new Date(report.createdAt).toLocaleDateString()} • {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon} size={14} color={colors.white} style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.readingContainer}>
            <View style={styles.readingValueContainer}>
              <Text style={styles.readingValue}>{report.sensorData.value}</Text>
              <Text style={styles.readingUnit}>{sensorInfo.unit}</Text>
            </View>

            <View style={styles.rangeContainer}>
              <Text style={styles.rangeLabel}>Normal Range</Text>
              <Text style={styles.rangeValue}>
                {sensorInfo.normalRange.min} - {sensorInfo.normalRange.max} {sensorInfo.unit}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[colors.error, colors.warning, colors.success]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressBarBackground}
              />
              <View
                style={[
                  styles.progressIndicator,
                  {
                    left: `${Math.min(95, Math.max(5, ((report.sensorData.value - sensorInfo.normalRange.min) /
                      (sensorInfo.normalRange.max - sensorInfo.normalRange.min)) * 100))}%`,
                    backgroundColor: statusColor
                  }
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </Card>
    );
  };

  // Render category navigation
  const renderCategoryNavigation = () => {
    if (!report) return null;

    const sensorInfo = SensorInfo[report.sensorData.sensorType];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollContainer}
        contentContainerStyle={styles.categoryContainer}
      >
        {REPORT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              activeCategory === category.id && [styles.activeCategoryButton, { borderColor: sensorInfo.color }]
            ]}
            onPress={() => handleCategoryChange(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={activeCategory === category.id ? sensorInfo.color : colors.textSecondary}
              style={styles.categoryIcon}
            />
            <Text
              style={[
                styles.categoryLabel,
                activeCategory === category.id && { color: sensorInfo.color, fontWeight: 'bold' }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render category content based on active category
  const renderCategoryContent = () => {
    if (!report) return null;

    const sensorInfo = SensorInfo[report.sensorData.sensorType];

    switch (activeCategory) {
      case 'analysis':
        return (
          <Card style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Ionicons name="analytics-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.contentCardTitle}>Detailed Analysis</Text>
            </View>

            <View style={styles.contentCardBody}>
              <Text style={styles.analysisText}>{report.analysis.interpretation}</Text>

              <View style={styles.factorsContainer}>
                <Text style={styles.factorsTitle}>Key Factors:</Text>
                {report.analysis.factors?.map((factor: string, index: number) => (
                  <View key={index} style={styles.factorItem}>
                    <View style={[styles.bulletPoint, { backgroundColor: sensorInfo.color }]} />
                    <Text style={styles.factorText}>{factor}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.expertInsightContainer}>
                <View style={styles.expertInsightHeader}>
                  <FontAwesome5 name="user-graduate" size={16} color={colors.primary} />
                  <Text style={styles.expertInsightTitle}>Expert Insight</Text>
                </View>
                <Text style={styles.expertInsightText}>
                  {report.analysis.status === 'good' ?
                    `Your ${sensorInfo.name.toLowerCase()} readings are within optimal range. This indicates good management practices and favorable conditions for crop growth.` :
                    report.analysis.status === 'warning' ?
                    `Your ${sensorInfo.name.toLowerCase()} readings require attention. Consider implementing the recommended actions to prevent potential crop stress.` :
                    `Your ${sensorInfo.name.toLowerCase()} readings are critical. Immediate action is required to prevent significant crop damage and yield loss.`
                  }
                </Text>
              </View>
            </View>
          </Card>
        );

      case 'cropImpact':
        return (
          <Card style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Ionicons name="leaf-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.contentCardTitle}>Crop Impact Analysis</Text>
            </View>

            <View style={styles.contentCardBody}>
              <View style={styles.impactSection}>
                <Text style={styles.impactSectionTitle}>Short-term Effects (1-7 days)</Text>
                <Text style={styles.impactText}>
                  {report.cropImpact?.shortTerm ||
                    `Current ${sensorInfo.name.toLowerCase()} levels may ${report.analysis.status === 'good' ?
                      'promote healthy growth and development' :
                      report.analysis.status === 'warning' ?
                        'cause mild stress to crops, potentially slowing growth' :
                        'significantly stress your crops, potentially causing damage'}.`
                  }
                </Text>
              </View>

              <View style={styles.impactSection}>
                <Text style={styles.impactSectionTitle}>Medium-term Effects (1-4 weeks)</Text>
                <Text style={styles.impactText}>
                  {report.cropImpact?.mediumTerm ||
                    `If ${sensorInfo.name.toLowerCase()} levels remain at current readings, expect ${
                      report.analysis.status === 'good' ?
                        'continued healthy development and potentially increased yields' :
                        report.analysis.status === 'warning' ?
                          'reduced growth rates and potential yield impacts of 10-20%' :
                          'significant crop stress, potential yield reductions of 30-50%, and possible crop failure in sensitive varieties'
                    }.`
                  }
                </Text>
              </View>

              <View style={styles.cropVarietiesSection}>
                <Text style={styles.impactSectionTitle}>Affected Crop Varieties</Text>
                <View style={styles.cropVarietiesContainer}>
                  {(report.cropImpact?.affectedVarieties || ['Wheat', 'Rice', 'Maize', 'Pulses']).map((crop: string, index: number) => (
                    <View key={index} style={styles.cropVarietyTag}>
                      <Text style={styles.cropVarietyText}>{crop}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Card>
        );

      case 'actions':
        return (
          <Card style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Ionicons name="construct-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.contentCardTitle}>Recommended Actions</Text>
            </View>

            <View style={styles.contentCardBody}>
              <View style={styles.timeframeSection}>
                <View style={styles.timeframeHeader}>
                  <Ionicons name="time-outline" size={16} color={sensorInfo.color} />
                  <Text style={styles.timeframeTitle}>Immediate Actions (24-48 hours)</Text>
                </View>

                <View style={styles.actionsList}>
                  {(report.recommendations?.immediate || report.recommendations?.slice(0, 2) || ['Monitor crop response', 'Adjust irrigation schedule']).map((action: string, index: number) => (
                    <View key={index} style={styles.actionItem}>
                      <View style={[styles.actionPriority, { backgroundColor: colors.error }]} />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.timeframeSection}>
                <View style={styles.timeframeHeader}>
                  <Ionicons name="calendar-outline" size={16} color={sensorInfo.color} />
                  <Text style={styles.timeframeTitle}>Short-term Actions (This Week)</Text>
                </View>

                <View style={styles.actionsList}>
                  {(report.recommendations?.shortTerm || report.recommendations?.slice(2, 4) || ['Review fertilization program', 'Check for signs of pest pressure']).map((action: string, index: number) => (
                    <View key={index} style={styles.actionItem}>
                      <View style={[styles.actionPriority, { backgroundColor: colors.warning }]} />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.timeframeSection}>
                <View style={styles.timeframeHeader}>
                  <Ionicons name="calendar-outline" size={16} color={sensorInfo.color} />
                  <Text style={styles.timeframeTitle}>Long-term Actions (Next Month)</Text>
                </View>

                <View style={styles.actionsList}>
                  {(report.recommendations?.longTerm || report.recommendations?.slice(4) || ['Consider soil amendments', 'Plan for crop rotation']).map((action: string, index: number) => (
                    <View key={index} style={styles.actionItem}>
                      <View style={[styles.actionPriority, { backgroundColor: colors.success }]} />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.communityTipContainer}>
                <View style={styles.communityTipHeader}>
                  <FontAwesome5 name="users" size={16} color={colors.secondary} />
                  <Text style={styles.communityTipTitle}>Community Tip</Text>
                </View>
                <Text style={styles.communityTipText}>
                  Nearby farmers with similar readings have reported success with {
                    report.analysis.status === 'good' ?
                      'maintaining current practices and monitoring regularly.' :
                    report.analysis.status === 'warning' ?
                      'adjusting irrigation schedules and applying organic amendments.' :
                      'immediate intervention using targeted treatments and consulting with local agricultural experts.'
                  }
                </Text>
              </View>
            </View>
          </Card>
        );

      case 'economics':
        return (
          <Card style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Ionicons name="cash-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.contentCardTitle}>Economic Impact</Text>
            </View>

            <View style={styles.contentCardBody}>
              <View style={styles.economicImpactCard}>
                <View style={styles.economicImpactHeader}>
                  <MaterialCommunityIcons name="trending-up" size={18} color={report.analysis.status === 'good' ? colors.success : colors.error} />
                  <Text style={styles.economicImpactTitle}>Potential Yield Impact</Text>
                </View>

                <View style={styles.economicImpactValue}>
                  <Text style={[
                    styles.economicImpactPercentage,
                    {
                      color: report.analysis.status === 'good' ? colors.success :
                             report.analysis.status === 'warning' ? colors.warning : colors.error
                    }
                  ]}>
                    {report.analysis.status === 'good' ? '+5% to +15%' :
                     report.analysis.status === 'warning' ? '-5% to -15%' : '-15% to -40%'}
                  </Text>
                  <Text style={styles.economicImpactDescription}>
                    {report.analysis.status === 'good' ? 'Potential yield increase' : 'Potential yield decrease'}
                  </Text>
                </View>
              </View>

              <View style={styles.economicFactorsContainer}>
                <Text style={styles.economicFactorsTitle}>Cost Implications:</Text>

                <View style={styles.economicFactorItem}>
                  <Ionicons name="water-outline" size={16} color={sensorInfo.color} />
                  <View style={styles.economicFactorContent}>
                    <Text style={styles.economicFactorName}>Water Usage</Text>
                    <Text style={styles.economicFactorValue}>
                      {report.analysis.status === 'good' ? 'Optimal efficiency' :
                       report.analysis.status === 'warning' ? 'May need 10-15% more' : 'May need 25-40% more'}
                    </Text>
                  </View>
                </View>

                <View style={styles.economicFactorItem}>
                  <MaterialCommunityIcons name="fertilizer" size={16} color={sensorInfo.color} />
                  <View style={styles.economicFactorContent}>
                    <Text style={styles.economicFactorName}>Fertilizer Requirements</Text>
                    <Text style={styles.economicFactorValue}>
                      {report.analysis.status === 'good' ? 'Standard application' :
                       report.analysis.status === 'warning' ? 'May need adjustment' : 'Significant adjustment needed'}
                    </Text>
                  </View>
                </View>

                <View style={styles.economicFactorItem}>
                  <Ionicons name="medkit-outline" size={16} color={sensorInfo.color} />
                  <View style={styles.economicFactorContent}>
                    <Text style={styles.economicFactorName}>Pest/Disease Management</Text>
                    <Text style={styles.economicFactorValue}>
                      {report.analysis.status === 'good' ? 'Minimal intervention' :
                       report.analysis.status === 'warning' ? 'Increased monitoring' : 'Intensive management needed'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        );

      case 'risk':
        return (
          <Card style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Ionicons name="warning-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.contentCardTitle}>Risk Assessment</Text>
            </View>

            <View style={styles.contentCardBody}>
              <View style={styles.riskLevelContainer}>
                <Text style={styles.riskLevelLabel}>Overall Risk Level:</Text>
                <View style={[
                  styles.riskLevelBadge,
                  {
                    backgroundColor: report.analysis.status === 'good' ? colors.success + '15' :
                                    report.analysis.status === 'warning' ? colors.warning + '15' :
                                    colors.error + '15'
                  }
                ]}>
                  <Ionicons
                    name={
                      report.analysis.status === 'good' ? 'shield-checkmark' :
                      report.analysis.status === 'warning' ? 'shield-half' :
                      'shield'
                    }
                    size={18}
                    color={
                      report.analysis.status === 'good' ? colors.success :
                      report.analysis.status === 'warning' ? colors.warning :
                      colors.error
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    styles.riskLevelText,
                    {
                      color: report.analysis.status === 'good' ? colors.success :
                            report.analysis.status === 'warning' ? colors.warning :
                            colors.error
                    }
                  ]}>
                    {report.analysis.status === 'good' ? 'Low Risk' :
                     report.analysis.status === 'warning' ? 'Moderate Risk' :
                     'High Risk'}
                  </Text>
                </View>
              </View>

              <View style={styles.riskFactorsContainer}>
                <Text style={styles.riskFactorsTitle}>Potential Risk Factors:</Text>

                <View style={styles.riskFactorsList}>
                  {(report.risk?.factors || [
                    report.analysis.status === 'good' ?
                      'Minor fluctuations in readings' :
                      report.analysis.status === 'warning' ?
                        'Sustained suboptimal conditions' :
                        'Critical sensor readings',
                    report.analysis.status === 'good' ?
                      'Seasonal weather changes' :
                      report.analysis.status === 'warning' ?
                        'Increased pest susceptibility' :
                        'Significant crop stress',
                    report.analysis.status === 'good' ?
                      'Normal environmental variations' :
                      report.analysis.status === 'warning' ?
                        'Potential yield reduction' :
                        'High probability of crop failure'
                  ]).map((factor: string, index: number) => (
                    <View key={index} style={styles.riskFactorItem}>
                      <Ionicons
                        name="alert-circle"
                        size={16}
                        color={
                          report.analysis.status === 'good' ? colors.success :
                          report.analysis.status === 'warning' ? colors.warning :
                          colors.error
                        }
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.riskFactorText}>{factor}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.mitigationContainer}>
                <Text style={styles.mitigationTitle}>Risk Mitigation:</Text>

                <View style={styles.mitigationList}>
                  {(report.risk?.mitigation || [
                    report.analysis.status === 'good' ?
                      'Continue regular monitoring' :
                      report.analysis.status === 'warning' ?
                        'Implement recommended actions promptly' :
                        'Take immediate corrective measures',
                    report.analysis.status === 'good' ?
                      'Maintain current management practices' :
                      report.analysis.status === 'warning' ?
                        'Increase monitoring frequency' :
                        'Consult with agricultural experts',
                    report.analysis.status === 'good' ?
                      'Plan for seasonal adjustments' :
                      report.analysis.status === 'warning' ?
                        'Prepare contingency plans' :
                        'Consider crop insurance claims if applicable'
                  ]).map((strategy: string, index: number) => (
                    <View key={index} style={styles.mitigationItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={sensorInfo.color}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.mitigationText}>{strategy}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Card>
        );

      case 'trends':
        return (
          <Card style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Ionicons name="trending-up-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.contentCardTitle}>Trend Analysis</Text>
            </View>

            <View style={styles.contentCardBody}>
              <View style={styles.trendSummaryContainer}>
                <Text style={styles.trendSummaryTitle}>Recent Trend:</Text>
                <View style={styles.trendSummaryContent}>
                  <View style={[
                    styles.trendDirectionBadge,
                    {
                      backgroundColor: report.analysis.status === 'good' ? colors.success + '15' :
                                      report.analysis.status === 'warning' ? colors.warning + '15' :
                                      colors.error + '15'
                    }
                  ]}>
                    <Ionicons
                      name={
                        report.analysis.status === 'good' ? 'trending-up' :
                        report.analysis.status === 'warning' ? 'trending-down' :
                        'trending-down'
                      }
                      size={18}
                      color={
                        report.analysis.status === 'good' ? colors.success :
                        report.analysis.status === 'warning' ? colors.warning :
                        colors.error
                      }
                    />
                  </View>
                  <Text style={styles.trendSummaryText}>
                    {report.trends?.summary ||
                      (report.analysis.status === 'good' ?
                        `Your ${sensorInfo.name.toLowerCase()} readings have been stable and within optimal range.` :
                        report.analysis.status === 'warning' ?
                          `Your ${sensorInfo.name.toLowerCase()} readings have been gradually moving outside the optimal range.` :
                          `Your ${sensorInfo.name.toLowerCase()} readings have significantly deteriorated and require immediate attention.`)
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.historicalDataContainer}>
                <Text style={styles.historicalDataTitle}>Historical Context:</Text>
                <Text style={styles.historicalDataText}>
                  {report.trends?.historical ||
                    (report.analysis.status === 'good' ?
                      `Based on historical data, your current ${sensorInfo.name.toLowerCase()} readings are consistent with successful growing seasons in the past.` :
                      report.analysis.status === 'warning' ?
                        `Historical data suggests that current ${sensorInfo.name.toLowerCase()} readings may lead to reduced yields if not addressed.` :
                        `Historical data indicates that current ${sensorInfo.name.toLowerCase()} readings are associated with significant crop stress and potential failure.`)
                  }
                </Text>
              </View>

              <View style={styles.forecastContainer}>
                <Text style={styles.forecastTitle}>Forecast:</Text>
                <Text style={styles.forecastText}>
                  {report.trends?.forecast ||
                    (report.analysis.status === 'good' ?
                      `If current conditions persist, expect continued optimal growth and development over the next 2-4 weeks.` :
                      report.analysis.status === 'warning' ?
                        `Without intervention, ${sensorInfo.name.toLowerCase()} readings may continue to deteriorate, potentially reaching critical levels within 1-2 weeks.` :
                        `Immediate intervention is required to prevent further deterioration and potential crop failure.`)
                  }
                </Text>
              </View>

              <View style={styles.seasonalFactorsContainer}>
                <View style={styles.seasonalFactorsHeader}>
                  <Ionicons name="calendar" size={16} color={sensorInfo.color} />
                  <Text style={styles.seasonalFactorsTitle}>Seasonal Factors</Text>
                </View>
                <Text style={styles.seasonalFactorsText}>
                  {report.trends?.seasonal ||
                    `Current season may ${report.analysis.status === 'good' ? 'continue to provide favorable conditions' : 'present challenges'} for maintaining optimal ${sensorInfo.name.toLowerCase()} levels. ${
                      report.analysis.status === 'good' ?
                        'Regular monitoring is recommended to maintain current conditions.' :
                        report.analysis.status === 'warning' ?
                          'Consider seasonal adjustments to your management practices.' :
                          'Significant interventions may be necessary to counteract seasonal effects.'
                    }`
                  }
                </Text>
              </View>
            </View>
          </Card>
        );

      default:
        return (
          <View style={styles.emptyCategoryContainer}>
            <Text style={styles.emptyCategoryText}>Select a category to view detailed information</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sensor Report</Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareReport}
          >
            <Ionicons name="share-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <LoadingQuote category="farming" />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Report Header */}
          {renderReportHeader()}

          {/* Category Navigation */}
          {renderCategoryNavigation()}

          {/* Category Content */}
          <View style={styles.categoryContentContainer}>
            {renderCategoryContent()}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Button
              title="Share Report"
              variant="outline"
              size="medium"
              leftIcon={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
              style={styles.actionButton}
              onPress={handleShareReport}
            />

            <Button
              title="Add New Reading"
              variant="primary"
              size="medium"
              leftIcon={<Ionicons name="add-circle-outline" size={18} color={colors.white} />}
              style={styles.actionButton}
              onPress={() => navigation.navigate('SensorData' as never)}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerGradient: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 14 : 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },

  // Report Header Card
  reportHeaderCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerGradient: {
    padding: 16,
  },
  reportHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sensorMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reportHeaderInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  readingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  readingValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  readingValue: {
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  readingUnit: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  rangeContainer: {
    alignItems: 'flex-end',
  },
  rangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  rangeValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBackground: {
    height: '100%',
    width: '100%',
  },
  progressIndicator: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: -4,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // Category Navigation
  categoryScrollContainer: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: colors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCategoryButton: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Category Content
  categoryContentContainer: {
    marginBottom: 20,
  },
  contentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  contentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentCardTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contentCardBody: {
    padding: 16,
  },

  // Analysis Tab
  analysisText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
  },
  factorsContainer: {
    marginBottom: 16,
  },
  factorsTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  factorText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  expertInsightContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  expertInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expertInsightTitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expertInsightText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Crop Impact Tab
  impactSection: {
    marginBottom: 16,
  },
  impactSectionTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  impactText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cropVarietiesSection: {
    marginTop: 8,
  },
  cropVarietiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cropVarietyTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  cropVarietyText: {
    fontSize: 12,
    color: colors.textPrimary,
  },

  // Actions Tab
  timeframeSection: {
    marginBottom: 16,
  },
  timeframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeframeTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionsList: {
    marginLeft: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionPriority: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  communityTipContainer: {
    backgroundColor: colors.secondary + '10',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    marginTop: 8,
  },
  communityTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communityTipTitle: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  communityTipText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Economics Tab
  economicImpactCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  economicImpactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  economicImpactTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  economicImpactValue: {
    alignItems: 'center',
  },
  economicImpactPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  economicImpactDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  economicFactorsContainer: {
    marginTop: 8,
  },
  economicFactorsTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  economicFactorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  economicFactorContent: {
    marginLeft: 12,
    flex: 1,
  },
  economicFactorName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  economicFactorValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Risk Tab
  riskLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  riskLevelLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  riskLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  riskFactorsContainer: {
    marginBottom: 16,
  },
  riskFactorsTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  riskFactorsList: {
    marginLeft: 4,
  },
  riskFactorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskFactorText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  mitigationContainer: {
    marginTop: 8,
  },
  mitigationTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mitigationList: {
    marginLeft: 4,
  },
  mitigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mitigationText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },

  // Trends Tab
  trendSummaryContainer: {
    marginBottom: 16,
  },
  trendSummaryTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendDirectionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendSummaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  historicalDataContainer: {
    marginBottom: 16,
  },
  historicalDataTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historicalDataText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  forecastContainer: {
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  forecastText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  seasonalFactorsContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
  },
  seasonalFactorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  seasonalFactorsTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  seasonalFactorsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Empty Category
  emptyCategoryContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ImprovedSensorDataReportViewScreen;