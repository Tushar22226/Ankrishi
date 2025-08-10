import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import RiskService from '../../services/RiskService';
import { RiskAssessment } from '../../models/Risk';

const RiskManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<RiskAssessment | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load risk data
  useEffect(() => {
    const loadRiskData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userProfile) {
          throw new Error('User profile not available');
        }

        if (!userProfile.location) {
          throw new Error('Location information is required for risk assessment');
        }

        // Generate risk assessment using RiskService
        const riskAssessment = await RiskService.generateRiskAssessment(
          userProfile.uid,
          userProfile
        );

        setRiskData(riskAssessment);
      } catch (error) {
        console.error('Error loading risk data:', error);
        setError('Failed to load risk assessment data. Please try again.');
        Alert.alert('Error', 'Failed to load risk assessment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRiskData();
  }, [userProfile]);

  // Toggle expanded category
  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  // Toggle expanded risk
  const toggleRisk = (riskId: string) => {
    if (expandedRisk === riskId) {
      setExpandedRisk(null);
    } else {
      setExpandedRisk(riskId);
    }
  };

  // Get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return colors.success;
    if (score <= 60) return colors.warning;
    return colors.error;
  };

  // Get risk probability color
  const getRiskProbabilityColor = (probability: number) => {
    if (probability <= 0.3) return colors.success;
    if (probability <= 0.6) return colors.warning;
    return colors.error;
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  // Get alert color based on type
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.info;
    }
  };

  // Get risk score explanation
  const getRiskScoreExplanation = (score: number) => {
    if (score <= 30) {
      return 'Your overall risk level is low. Continue monitoring and implementing best practices.';
    } else if (score <= 60) {
      return 'Your overall risk level is moderate. Review the specific risks and consider implementing the suggested mitigation steps.';
    } else {
      return 'Your overall risk level is high. Immediate attention is recommended for the high-impact risks identified.';
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote
          loadingText="Analyzing risk factors for your crops..."
          showIndicator={true}
          indicatorSize="large"
          indicatorColor={colors.primary}
        />
      </View>
    );
  }

  // Error state
  if (error || !riskData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Unable to load risk data'}</Text>
        <Button
          title="Try Again"
          onPress={() => navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'RiskManagement' }],
            })
          )}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Management</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Overall Risk Score */}
        <View style={styles.scoreContainer}>
          <View style={[
            styles.scoreCircle,
            { borderColor: getRiskScoreColor(riskData.overallRiskScore) }
          ]}>
            <Text style={[
              styles.scoreValue,
              { color: getRiskScoreColor(riskData.overallRiskScore) }
            ]}>
              {riskData.overallRiskScore}
            </Text>
            <Text style={styles.scoreLabel}>Risk Level</Text>
          </View>

          <View style={styles.riskLevelContainer}>
            <View style={styles.riskLevelItem}>
              <View style={[styles.riskLevelIndicator, { backgroundColor: colors.success }]} />
              <Text style={styles.riskLevelText}>Low Risk (0-30)</Text>
            </View>
            <View style={styles.riskLevelItem}>
              <View style={[styles.riskLevelIndicator, { backgroundColor: colors.warning }]} />
              <Text style={styles.riskLevelText}>Medium Risk (31-60)</Text>
            </View>
            <View style={styles.riskLevelItem}>
              <View style={[styles.riskLevelIndicator, { backgroundColor: colors.error }]} />
              <Text style={styles.riskLevelText}>High Risk (61-100)</Text>
            </View>
          </View>

          {/* Risk score explanation */}
          <Text style={styles.riskScoreExplanation}>
            {getRiskScoreExplanation(riskData.overallRiskScore)}
          </Text>
        </View>

        {/* Alerts */}
        {riskData.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.sectionTitle}>Risk Alerts</Text>

            {riskData.alerts.map(alert => (
              <View
                key={alert.id}
                style={[
                  styles.alertItem,
                  { borderLeftColor: getAlertColor(alert.type) },
                ]}
              >
                <Ionicons
                  name={getAlertIcon(alert.type) as any}
                  size={24}
                  color={getAlertColor(alert.type)}
                  style={styles.alertIcon}
                />
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Risk Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>

          {riskData.riskCategories.map(category => (
            <Card key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryTitleContainer}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <View
                    style={[
                      styles.categoryScoreBadge,
                      { backgroundColor: getRiskScoreColor(category.score) },
                    ]}
                  >
                    <Text style={styles.categoryScoreText}>{category.score}</Text>
                  </View>
                </View>

                <Ionicons
                  name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedCategory === category.id && (
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryDescription}>{category.description}</Text>

                  {category.risks.length === 0 ? (
                    <Text style={styles.noRisksText}>No specific risks identified in this category.</Text>
                  ) : (
                    // Risks
                    category.risks.map(risk => (
                      <View key={risk.id} style={styles.riskContainer}>
                        <TouchableOpacity
                          style={styles.riskHeader}
                          onPress={() => toggleRisk(risk.id)}
                        >
                          <View style={styles.riskTitleContainer}>
                            <Text style={styles.riskTitle}>{risk.name}</Text>
                            <View style={styles.riskMetaContainer}>
                              <View style={[
                                styles.riskProbabilityBadge,
                                { backgroundColor: getRiskProbabilityColor(risk.probability) },
                              ]}>
                                <Text style={styles.riskProbabilityText}>
                                  {Math.round(risk.probability * 100)}%
                                </Text>
                              </View>
                              <View style={[
                                styles.riskImpactBadge,
                                { backgroundColor: getImpactColor(risk.impact) },
                              ]}>
                                <Text style={styles.riskImpactText}>
                                  {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <Ionicons
                            name={expandedRisk === risk.id ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>

                        {expandedRisk === risk.id && (
                          <View style={styles.riskDetails}>
                            <View style={styles.riskDetailItem}>
                              <Text style={styles.riskDetailLabel}>Timeframe:</Text>
                              <Text style={styles.riskDetailValue}>{risk.timeframe}</Text>
                            </View>

                            {risk.cropName && (
                              <View style={styles.riskDetailItem}>
                                <Text style={styles.riskDetailLabel}>Affected Crop:</Text>
                                <Text style={styles.riskDetailValue}>{risk.cropName}</Text>
                              </View>
                            )}

                            <View style={styles.riskDetailItem}>
                              <Text style={styles.riskDetailLabel}>Description:</Text>
                              <Text style={styles.riskDetailValue}>{risk.description}</Text>
                            </View>

                            <Text style={styles.mitigationTitle}>Mitigation Steps:</Text>
                            {risk.mitigationSteps.map((step, index) => (
                              <View key={index} style={styles.mitigationStep}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.mitigationIcon} />
                                <Text style={styles.mitigationText}>{step}</Text>
                              </View>
                            ))}

                            <Button
                              title="Create Action Plan"
                              onPress={() => Alert.alert('Action Plan', `This would create a detailed action plan for mitigating ${risk.name}`)}
                              style={styles.actionPlanButton}
                            />
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Get Insurance Quotes"
            onPress={() => navigation.navigate('InsuranceQuotes' as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="shield" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="Weather Forecasts"
            onPress={() => navigation.navigate('Forecast' as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="cloudy" size={18} color={colors.white} style={styles.buttonIcon} />}
          />

          <Button
            title="Connect with Risk Advisor"
            onPress={() => navigation.navigate('Consultants' as never)}
            style={styles.actionButton}
            leftIcon={<Ionicons name="people" size={18} color={colors.white} style={styles.buttonIcon} />}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            This risk assessment is based on current data and predictive models. Actual outcomes may vary. We recommend consulting with agricultural experts for personalized risk management strategies.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 150,
  },
  scrollContainer: {
    flex: 1,
  },
  // Overall Score styles
  scoreContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    marginBottom: spacing.md,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
  },
  scoreLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  riskLevelContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  riskLevelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  riskLevelIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  riskLevelText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  riskScoreExplanation: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  noRisksText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  // Alerts styles
  alertsContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  alertIcon: {
    marginRight: spacing.md,
  },
  alertMessage: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  // Categories styles
  categoriesContainer: {
    padding: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  categoryScoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScoreText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  categoryDetails: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  categoryDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  // Risk styles
  riskContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  riskTitleContainer: {
    flex: 1,
  },
  riskTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  riskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskProbabilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  riskProbabilityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  riskImpactBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  riskImpactText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  riskDetails: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  riskDetailItem: {
    marginBottom: spacing.sm,
  },
  riskDetailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  riskDetailValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.sm,
  },
  mitigationTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  mitigationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mitigationIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  mitigationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.sm,
  },
  actionPlanButton: {
    marginTop: spacing.md,
  },
  // Action buttons styles
  actionsContainer: {
    padding: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  // Disclaimer styles
  disclaimerContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    margin: spacing.md,
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
  },
});

export default RiskManagementScreen;
