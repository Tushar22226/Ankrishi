import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import LoadingQuote from '../../components/LoadingQuote';

import { useAuth } from '../../context/AuthContext';
import ForecastService from '../../services/ForecastService';
import AICropForecastService from '../../services/AICropForecastService';
import AIMarketForecastService from '../../services/AIMarketForecastService';
import { CropRecommendation } from '../../services/ForecastService';
import { MarketPriceForecast } from '../../services/ForecastService';
import { colors, spacing, typography } from '../../theme';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const AIForecastScreen = () => {
  const { userProfile } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [marketForecasts, setMarketForecasts] = useState<MarketPriceForecast[]>([]);
  const [selectedTab, setSelectedTab] = useState<'crops' | 'market'>('crops');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userProfile?.location) {
        setError('Location information is missing. Please update your profile with your farm location.');
        setLoading(false);
        return;
      }

      // Load crop recommendations
      const cropRecs = await AICropForecastService.getCropRecommendations(userProfile.location);
      setCropRecommendations(cropRecs);

      // Load market forecasts
      const marketFcsts = await AIMarketForecastService.getMarketPriceForecasts(userProfile.location);
      setMarketForecasts(marketFcsts);

    } catch (error) {
      console.error('Error loading AI forecast data:', error);
      setError('Failed to load forecast data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderCropRecommendations = () => {
    if (cropRecommendations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No crop recommendations available</Text>
        </View>
      );
    }

    return (
      <View>
        {cropRecommendations.map((crop, index) => (
          <View key={index} style={styles.cropCard}>
            <View style={styles.cropHeader}>
              <Text style={styles.cropName}>{crop.cropName}</Text>
              <View style={styles.suitabilityContainer}>
                <Text style={styles.suitabilityText}>
                  {Math.round(crop.suitabilityScore * 100)}% Match
                </Text>
                <View
                  style={[
                    styles.suitabilityIndicator,
                    {
                      backgroundColor:
                        crop.suitabilityScore > 0.7 ? colors.success :
                        crop.suitabilityScore > 0.5 ? colors.warning :
                        colors.error
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.cropDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  Growing Period: {formatDate(crop.growingPeriod.start)} - {formatDate(crop.growingPeriod.end)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  Expected Yield: {crop.expectedYield.min.toFixed(1)}-{crop.expectedYield.max.toFixed(1)} {crop.expectedYield.unit}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  Expected Price: ₹{crop.expectedPrice.min}-{crop.expectedPrice.max} {crop.expectedPrice.currency}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  Water Requirement: {crop.waterRequirement} mm
                </Text>
              </View>
            </View>

            {crop.risks.length > 0 && (
              <View style={styles.risksContainer}>
                <Text style={styles.sectionTitle}>Potential Risks:</Text>
                {crop.risks.map((risk, riskIndex) => (
                  <View key={riskIndex} style={styles.riskItem}>
                    <View style={styles.riskHeader}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color={risk.impact === 'high' ? colors.error :
                               risk.impact === 'medium' ? colors.warning :
                               colors.textSecondary}
                      />
                      <Text style={styles.riskName}>{risk.name}</Text>
                      <Text style={[
                        styles.riskImpact,
                        {
                          color: risk.impact === 'high' ? colors.error :
                                 risk.impact === 'medium' ? colors.warning :
                                 colors.textSecondary
                        }
                      ]}>
                        {risk.impact.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.riskMitigation}>{risk.mitigation}</Text>
                  </View>
                ))}
              </View>
            )}

            {crop.fertilizers.length > 0 && (
              <View style={styles.fertilizersContainer}>
                <Text style={styles.sectionTitle}>Recommended Fertilizers:</Text>
                {crop.fertilizers.map((fertilizer, fertIndex) => (
                  <Text key={fertIndex} style={styles.fertilizerItem}>
                    • {fertilizer.name}: {fertilizer.quantity} {fertilizer.unit}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMarketForecasts = () => {
    if (marketForecasts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No market forecasts available</Text>
        </View>
      );
    }

    return (
      <View>
        {marketForecasts.map((forecast, index) => {
          // Create chart data
          const chartData = {
            labels: ['Current', 'Forecast'],
            datasets: [
              {
                data: [forecast.currentPrice, forecast.forecastedPrice],
                color: (opacity = 1) => forecast.priceChange >= 0 ? `rgba(46, 204, 113, ${opacity})` : `rgba(231, 76, 60, ${opacity})`,
                strokeWidth: 2
              }
            ],
            legend: [`${forecast.productName} Price`]
          };

          return (
            <View key={index} style={styles.marketCard}>
              <View style={styles.marketHeader}>
                <Text style={styles.marketProductName}>{forecast.productName}</Text>
                <View style={styles.priceChangeContainer}>
                  <Ionicons
                    name={forecast.priceChangePercentage >= 0 ? "trending-up-outline" : "trending-down-outline"}
                    size={18}
                    color={forecast.priceChangePercentage >= 0 ? colors.success : colors.error}
                  />
                  <Text style={[
                    styles.priceChangeText,
                    {color: forecast.priceChangePercentage >= 0 ? colors.success : colors.error}
                  ]}>
                    {forecast.priceChangePercentage >= 0 ? '+' : ''}{forecast.priceChangePercentage.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Current Price</Text>
                  <Text style={styles.priceValue}>₹{forecast.currentPrice}</Text>
                </View>
                <View style={styles.priceArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Forecasted Price</Text>
                  <Text style={[
                    styles.priceValue,
                    {color: forecast.priceChangePercentage >= 0 ? colors.success : colors.error}
                  ]}>
                    ₹{forecast.forecastedPrice}
                  </Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={Dimensions.get('window').width - 60}
                  height={180}
                  chartConfig={{
                    backgroundColor: colors.surfaceLight,
                    backgroundGradientFrom: colors.surfaceLight,
                    backgroundGradientTo: colors.surfaceLight,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: colors.primary,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>

              <View style={styles.forecastDetails}>
                <Text style={styles.forecastDate}>
                  Forecast Date: {new Date(forecast.forecastPeriod.end).toLocaleDateString()}
                </Text>
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(forecast.confidenceLevel * 100)}%
                </Text>
              </View>

              {forecast.factors.length > 0 && (
                <View style={styles.factorsContainer}>
                  <Text style={styles.sectionTitle}>Market Factors:</Text>
                  {forecast.factors.map((factor, factorIndex) => (
                    <View key={factorIndex} style={styles.factorItem}>
                      <Ionicons
                        name={factor.impact === 'positive' ? 'arrow-up-circle-outline' :
                              factor.impact === 'negative' ? 'arrow-down-circle-outline' :
                              'remove-circle-outline'}
                        size={18}
                        color={factor.impact === 'positive' ? colors.success :
                              factor.impact === 'negative' ? colors.error :
                              colors.textSecondary}
                      />
                      <Text style={styles.factorText}>{factor.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>AI Recommendation:</Text>
                <Text style={styles.recommendationText}>{forecast.recommendation}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>


      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'crops' && styles.activeTab]}
          onPress={() => setSelectedTab('crops')}
        >
          <Ionicons
            name="leaf"
            size={20}
            color={selectedTab === 'crops' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'crops' && styles.activeTabText,
            ]}
          >
            Crop Recommendations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'market' && styles.activeTab]}
          onPress={() => setSelectedTab('market')}
        >
          <Ionicons
            name="bar-chart"
            size={20}
            color={selectedTab === 'market' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'market' && styles.activeTabText,
            ]}
          >
            Market Forecast
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingQuote
          loadingText="Loading AI forecasts..."
          style={styles.loadingContainer}
        />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.aiInfoContainer}>
            <View style={styles.aiInfoIcon}>
              <Ionicons name="analytics-outline" size={24} color={colors.white} />
            </View>
            <View style={styles.aiInfoContent}>
              <Text style={styles.aiInfoTitle}>AI-Powered Forecasting</Text>
              <Text style={styles.aiInfoText}>
                Our AI analyzes weather patterns, soil conditions, and market trends to provide personalized recommendations.
              </Text>
            </View>
          </View>

          {selectedTab === 'crops' ? renderCropRecommendations() : renderMarketForecasts()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  aiInfoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  aiInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  aiInfoContent: {
    flex: 1,
  },
  aiInfoTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  aiInfoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Crop recommendation styles
  cropCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cropName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  suitabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suitabilityText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  suitabilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cropDetails: {
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  risksContainer: {
    marginBottom: spacing.md,
  },
  riskItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  riskName: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  riskImpact: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
  },
  riskMitigation: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  fertilizersContainer: {
    marginBottom: spacing.sm,
  },
  fertilizerItem: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  // Market forecast styles
  marketCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  marketProductName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  priceChangeText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  priceArrow: {
    paddingHorizontal: spacing.sm,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  forecastDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  forecastDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  confidenceText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  factorsContainer: {
    marginBottom: spacing.md,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  factorText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  recommendationContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.md,
  },
  recommendationTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recommendationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
});

export default AIForecastScreen;
