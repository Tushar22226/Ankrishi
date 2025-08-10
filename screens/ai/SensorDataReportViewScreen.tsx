import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Share,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { SensorType, SensorInfo } from '../../models/Sensor';
import SensorService from '../../services/SensorService';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
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

const SensorDataReportViewScreen = () => {
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

  // Render report content
  const renderReportContent = () => {
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
      <>
        {/* Report Header Card */}
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
                  <Ionicons name={sensorInfo.icon as any} size={22} color={colors.white} />
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
                      left: `${Math.max(0, Math.min(100, ((report.sensorData.value - sensorInfo.normalRange.min) /
                        (sensorInfo.normalRange.max - sensorInfo.normalRange.min)) * 100))}%`,
                      backgroundColor: statusColor
                    }
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </Card>

        {/* Category Navigation */}
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

        {/* Category Content */}
        <Card style={styles.categoryContentCard}>
          {renderCategoryContent(sensorInfo)}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareReport}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[sensorInfo.color, sensorInfo.color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="share-social" size={16} color={colors.white} />
              <Text style={styles.buttonText}>Share Report</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.newReadingButton, { borderColor: sensorInfo.color }]}
            onPress={() => navigation.navigate('SensorData' as never)}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="add-circle" size={16} color={sensorInfo.color} />
              <Text style={[styles.secondaryButtonText, { color: sensorInfo.color }]}>New Reading</Text>
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Render category content based on active category
  const renderCategoryContent = (sensorInfo: any) => {
    if (!report) return null;

    switch (activeCategory) {
      case 'analysis':
        return (
          <View style={styles.categoryContentContainer}>
            <View style={styles.categoryContentHeader}>
              <Ionicons name="analytics-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.categoryContentTitle}>Detailed Analysis</Text>
            </View>

            <Text style={styles.analysisText}>{report.analysis.interpretation}</Text>

            <View style={styles.analysisFactorsContainer}>
              <Text style={styles.analysisFactorsTitle}>Key Factors:</Text>
              {report.analysis.factors?.map((factor: string, index: number) => (
                <View key={index} style={styles.analysisFactorItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: sensorInfo.color }]} />
                  <Text style={styles.analysisFactorText}>{factor}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'cropImpact':
        return (
          <View style={styles.categoryContentContainer}>
            <View style={styles.categoryContentHeader}>
              <Ionicons name="leaf-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.categoryContentTitle}>Crop Impact Analysis</Text>
            </View>

            <View style={styles.cropImpactContainer}>
              <View style={styles.cropImpactSection}>
                <Text style={styles.cropImpactSectionTitle}>Short-term Effects (1-7 days)</Text>
                <Text style={styles.cropImpactText}>
                  {report.cropImpact?.shortTerm ||
                    `Current ${sensorInfo.name.toLowerCase()} levels may ${report.analysis.status === 'good' ?
                      'promote healthy growth and development' :
                      report.analysis.status === 'warning' ?
                        'cause mild stress to crops, potentially slowing growth' :
                        'significantly stress your crops, potentially causing damage'}.`
                  }
                </Text>
              </View>

              <View style={styles.cropImpactSection}>
                <Text style={styles.cropImpactSectionTitle}>Medium-term Effects (1-4 weeks)</Text>
                <Text style={styles.cropImpactText}>
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

              <View style={styles.cropImpactSection}>
                <Text style={styles.cropImpactSectionTitle}>Affected Crop Varieties</Text>
                <View style={styles.cropVarietiesContainer}>
                  {(report.cropImpact?.affectedVarieties || ['Wheat', 'Rice', 'Maize', 'Pulses']).map((crop: string, index: number) => (
                    <View key={index} style={styles.cropVarietyTag}>
                      <Text style={styles.cropVarietyText}>{crop}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      case 'actions':
        return (
          <View style={styles.categoryContentContainer}>
            <View style={styles.categoryContentHeader}>
              <Ionicons name="construct-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.categoryContentTitle}>Recommended Actions</Text>
            </View>

            <View style={styles.actionsContainer}>
              <View style={styles.timeframeSection}>
                <View style={styles.timeframeHeader}>
                  <Ionicons name="time-outline" size={16} color={sensorInfo.color} />
                  <Text style={styles.timeframeTitle}>Immediate Actions (24-48 hours)</Text>
                </View>

                {(report.recommendations?.immediate || report.recommendations?.slice(0, 2) || ['Monitor crop response', 'Adjust irrigation schedule']).map((action: string, index: number) => (
                  <View key={index} style={styles.actionItem}>
                    <View style={[styles.actionPriority, { backgroundColor: colors.error }]} />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.timeframeSection}>
                <View style={styles.timeframeHeader}>
                  <Ionicons name="calendar-outline" size={16} color={sensorInfo.color} />
                  <Text style={styles.timeframeTitle}>Short-term Actions (This Week)</Text>
                </View>

                {(report.recommendations?.shortTerm || report.recommendations?.slice(2, 4) || ['Review fertilization program', 'Check for signs of pest pressure']).map((action: string, index: number) => (
                  <View key={index} style={styles.actionItem}>
                    <View style={[styles.actionPriority, { backgroundColor: colors.warning }]} />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.timeframeSection}>
                <View style={styles.timeframeHeader}>
                  <Ionicons name="calendar-outline" size={16} color={sensorInfo.color} />
                  <Text style={styles.timeframeTitle}>Long-term Actions (Next Month)</Text>
                </View>

                {(report.recommendations?.longTerm || report.recommendations?.slice(4) || ['Consider soil amendments', 'Plan for crop rotation']).map((action: string, index: number) => (
                  <View key={index} style={styles.actionItem}>
                    <View style={[styles.actionPriority, { backgroundColor: colors.success }]} />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case 'economics':
        return (
          <View style={styles.categoryContentContainer}>
            <View style={styles.categoryContentHeader}>
              <Ionicons name="cash-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.categoryContentTitle}>Economic Impact</Text>
            </View>

            <View style={styles.economicsContainer}>
              <View style={styles.economicImpactCard}>
                <View style={styles.economicImpactHeader}>
                  <MaterialIcons name="trending-up" size={18} color={report.analysis.status === 'good' ? colors.success : colors.error} />
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
          </View>
        );

      case 'risk':
        return (
          <View style={styles.categoryContentContainer}>
            <View style={styles.categoryContentHeader}>
              <Ionicons name="warning-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.categoryContentTitle}>Risk Assessment</Text>
            </View>

            <View style={styles.riskContainer}>
              <View style={styles.riskLevelContainer}>
                <Text style={styles.riskLevelLabel}>Overall Risk Level:</Text>
                <View style={[
                  styles.riskLevelIndicator,
                  {
                    backgroundColor: report.analysis.status === 'good' ? colors.success :
                                    report.analysis.status === 'warning' ? colors.warning : colors.error
                  }
                ]}>
                  <Text style={styles.riskLevelText}>
                    {report.analysis.status === 'good' ? 'LOW' :
                     report.analysis.status === 'warning' ? 'MODERATE' : 'HIGH'}
                  </Text>
                </View>
              </View>

              <View style={styles.riskFactorsContainer}>
                <Text style={styles.riskFactorsTitle}>Risk Factors:</Text>

                <View style={styles.riskFactorItem}>
                  <View style={[
                    styles.riskFactorSeverity,
                    {
                      backgroundColor: report.analysis.status === 'good' ? colors.success :
                                      report.analysis.status === 'warning' ? colors.warning : colors.error
                    }
                  ]} />
                  <View style={styles.riskFactorContent}>
                    <Text style={styles.riskFactorName}>Crop Stress</Text>
                    <Text style={styles.riskFactorDescription}>
                      {report.analysis.status === 'good' ? 'Minimal stress on crops' :
                       report.analysis.status === 'warning' ? 'Moderate stress may affect growth' : 'High stress levels likely to damage crops'}
                    </Text>
                  </View>
                </View>

                <View style={styles.riskFactorItem}>
                  <View style={[
                    styles.riskFactorSeverity,
                    {
                      backgroundColor: report.analysis.status === 'good' ? colors.success :
                                      report.analysis.status === 'warning' ? colors.warning : colors.error
                    }
                  ]} />
                  <View style={styles.riskFactorContent}>
                    <Text style={styles.riskFactorName}>Disease Susceptibility</Text>
                    <Text style={styles.riskFactorDescription}>
                      {report.analysis.status === 'good' ? 'Low risk of disease development' :
                       report.analysis.status === 'warning' ? 'Increased risk of common diseases' : 'High risk of multiple disease pressures'}
                    </Text>
                  </View>
                </View>

                <View style={styles.riskFactorItem}>
                  <View style={[
                    styles.riskFactorSeverity,
                    {
                      backgroundColor: report.analysis.status === 'good' ? colors.success :
                                      report.analysis.status === 'warning' ? colors.warning : colors.error
                    }
                  ]} />
                  <View style={styles.riskFactorContent}>
                    <Text style={styles.riskFactorName}>Resource Efficiency</Text>
                    <Text style={styles.riskFactorDescription}>
                      {report.analysis.status === 'good' ? 'Optimal resource utilization' :
                       report.analysis.status === 'warning' ? 'Reduced efficiency, higher input costs' : 'Poor efficiency, significantly higher costs'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.mitigationContainer}>
                <Text style={styles.mitigationTitle}>Risk Mitigation:</Text>
                <Text style={styles.mitigationText}>
                  {report.analysis.status === 'good' ?
                    'Continue current practices while monitoring for any changes.' :
                    report.analysis.status === 'warning' ?
                      'Implement recommended actions to prevent escalation of issues. Regular monitoring is essential.' :
                      'Immediate intervention required. Follow all recommended actions and consider consulting with an agricultural expert.'}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'trends':
        return (
          <View style={styles.categoryContentContainer}>
            <View style={styles.categoryContentHeader}>
              <Ionicons name="trending-up-outline" size={20} color={sensorInfo.color} />
              <Text style={styles.categoryContentTitle}>Historical Trends</Text>
            </View>

            <View style={styles.trendsContainer}>
              <View style={styles.trendSummaryContainer}>
                <Text style={styles.trendSummaryTitle}>Trend Summary:</Text>
                <Text style={styles.trendSummaryText}>
                  {`Based on your historical readings, your ${sensorInfo.name.toLowerCase()} levels have been ${
                    report.analysis.status === 'good' ?
                      'consistently within optimal range' :
                      report.analysis.status === 'warning' ?
                        'fluctuating between optimal and concerning levels' :
                        'frequently outside the optimal range'
                  }.`}
                </Text>
              </View>

              <View style={styles.trendComparisonContainer}>
                <Text style={styles.trendComparisonTitle}>Comparison to Previous Readings:</Text>

                <View style={styles.trendComparisonItem}>
                  <View style={styles.trendComparisonLabel}>
                    <Text style={styles.trendComparisonLabelText}>Current Reading:</Text>
                  </View>
                  <View style={styles.trendComparisonValue}>
                    <Text style={styles.trendComparisonValueText}>{report.sensorData.value} {sensorInfo.unit}</Text>
                  </View>
                </View>

                <View style={styles.trendComparisonItem}>
                  <View style={styles.trendComparisonLabel}>
                    <Text style={styles.trendComparisonLabelText}>30-Day Average:</Text>
                  </View>
                  <View style={styles.trendComparisonValue}>
                    <Text style={styles.trendComparisonValueText}>
                      {(report.trends?.thirtyDayAvg || (report.sensorData.value * 0.9).toFixed(1))} {sensorInfo.unit}
                    </Text>
                    <View style={styles.trendIndicatorContainer}>
                      <Ionicons
                        name={report.sensorData.value > (report.trends?.thirtyDayAvg || report.sensorData.value * 0.9) ? "arrow-up" : "arrow-down"}
                        size={16}
                        color={report.analysis.status === 'good' ? colors.success : colors.warning}
                      />
                      <Text style={[
                        styles.trendIndicatorText,
                        { color: report.analysis.status === 'good' ? colors.success : colors.warning }
                      ]}>
                        {Math.abs(((report.sensorData.value - (report.trends?.thirtyDayAvg || report.sensorData.value * 0.9)) /
                          (report.trends?.thirtyDayAvg || report.sensorData.value * 0.9) * 100).toFixed(1))}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.trendComparisonItem}>
                  <View style={styles.trendComparisonLabel}>
                    <Text style={styles.trendComparisonLabelText}>Seasonal Average:</Text>
                  </View>
                  <View style={styles.trendComparisonValue}>
                    <Text style={styles.trendComparisonValueText}>
                      {(report.trends?.seasonalAvg || (report.sensorData.value * 1.1).toFixed(1))} {sensorInfo.unit}
                    </Text>
                    <View style={styles.trendIndicatorContainer}>
                      <Ionicons
                        name={report.sensorData.value > (report.trends?.seasonalAvg || report.sensorData.value * 1.1) ? "arrow-up" : "arrow-down"}
                        size={16}
                        color={report.analysis.status === 'good' ? colors.success : colors.error}
                      />
                      <Text style={[
                        styles.trendIndicatorText,
                        { color: report.analysis.status === 'good' ? colors.success : colors.error }
                      ]}>
                        {Math.abs(((report.sensorData.value - (report.trends?.seasonalAvg || report.sensorData.value * 1.1)) /
                          (report.trends?.seasonalAvg || report.sensorData.value * 1.1) * 100).toFixed(1))}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.forecastContainer}>
                <Text style={styles.forecastTitle}>Forecast:</Text>
                <Text style={styles.forecastText}>
                  {`Based on current trends and seasonal patterns, ${sensorInfo.name.toLowerCase()} levels are expected to ${
                    report.analysis.status === 'good' ?
                      'remain stable within the optimal range' :
                      report.analysis.status === 'warning' ?
                        'fluctuate and may require monitoring and intervention' :
                        'worsen without immediate corrective action'
                  } over the next 2-4 weeks.`}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.categoryContentContainer}>
            <Text style={styles.defaultText}>Select a category to view detailed information.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Set status bar color based on report */}
      {report && (
        <StatusBar
          backgroundColor={SensorInfo[report.sensorData.sensorType].color}
          barStyle="light-content"
        />
      )}

      {/* Header with Gradient */}
      <LinearGradient
        colors={report ?
          [SensorInfo[report.sensorData.sensorType].color, SensorInfo[report.sensorData.sensorType].color + 'DD'] :
          [colors.primary, colors.primary + 'DD']
        }
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

          <Text style={styles.headerTitle}>
            {report ? `${SensorInfo[report.sensorData.sensorType].name} Analysis` : 'Sensor Analysis'}
          </Text>

          <TouchableOpacity style={styles.headerRight}>
            <Ionicons name="help-circle-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <LoadingQuote category="farming" />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          bounces={true}
        >
          {renderReportContent()}
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
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.3,
  },
  headerRight: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80,
  },

  // Report Header Card
  reportHeaderCard: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerGradient: {
    padding: 14,
  },
  reportHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sensorIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  },
  reportDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  readingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  readingValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    marginBottom: 4,
  },
  rangeContainer: {
    alignItems: 'flex-end',
  },
  rangeLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  rangeValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBackground: {
    height: '100%',
    width: '100%',
  },
  progressIndicator: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    transform: [{ translateX: -7 }],
  },

  // Category Navigation
  categoryScrollContainer: {
    marginBottom: 12,
  },
  categoryContainer: {
    paddingVertical: 6,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  activeCategoryButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Category Content
  categoryContentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryContentContainer: {
    padding: 14,
  },
  categoryContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContentTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },

  // Analysis Category
  analysisText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 14,
  },
  analysisFactorsContainer: {
    marginTop: 8,
  },
  analysisFactorsTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analysisFactorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  analysisFactorText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },

  // Crop Impact Category
  cropImpactContainer: {
    marginTop: 8,
  },
  cropImpactSection: {
    marginBottom: 14,
  },
  cropImpactSectionTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cropImpactText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cropVarietiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  cropVarietyTag: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropVarietyText: {
    fontSize: 12,
    color: colors.textPrimary,
  },

  // Actions Category
  actionsContainer: {
    marginTop: 8,
  },
  timeframeSection: {
    marginBottom: 14,
  },
  timeframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeframeTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 8,
  },
  actionPriority: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },

  // Economics Category
  economicsContainer: {
    marginTop: 8,
  },
  economicImpactCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  economicImpactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 20,
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
    marginBottom: 8,
  },
  economicFactorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  economicFactorContent: {
    marginLeft: 8,
    flex: 1,
  },
  economicFactorName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  economicFactorValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Risk Category
  riskContainer: {
    marginTop: 8,
  },
  riskLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  riskLevelLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  riskLevelIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskLevelText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  riskFactorsContainer: {
    marginBottom: 14,
  },
  riskFactorsTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  riskFactorItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  riskFactorSeverity: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 8,
  },
  riskFactorContent: {
    flex: 1,
  },
  riskFactorName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  riskFactorDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  mitigationContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
  },
  mitigationTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mitigationText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Trends Category
  trendsContainer: {
    marginTop: 8,
  },
  trendSummaryContainer: {
    marginBottom: 14,
  },
  trendSummaryTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendSummaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  trendComparisonContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  trendComparisonTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendComparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendComparisonLabel: {
    flex: 1,
  },
  trendComparisonLabelText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  trendComparisonValue: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  trendComparisonValueText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginRight: 8,
  },
  trendIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIndicatorText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  forecastContainer: {
    marginTop: 8,
  },
  forecastTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  forecastText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  newReadingButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default SensorDataReportViewScreen;