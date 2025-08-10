import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, AntDesign, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImprovedSensorDataScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State variables
  const [selectedSensorType, setSelectedSensorType] = useState<SensorType | null>(null);
  const [sensorValue, setSensorValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [recentReadings, setRecentReadings] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState({
    totalReadings: 0,
    criticalReadings: 0,
    warningReadings: 0,
    goodReadings: 0,
    latestReading: null as any,
    mostUsedSensor: null as SensorType | null,
  });

  // Get all sensor types
  const sensorTypes = Object.keys(SensorInfo) as SensorType[];

  // Load data when component mounts
  useEffect(() => {
    StatusBar.setBackgroundColor(colors.primary);
    StatusBar.setBarStyle('light-content');
    loadRecentReadings();
  }, []);

  // Load recent sensor readings
  const loadRecentReadings = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      const reports = await SensorService.getUserSensorReports(userProfile.uid);

      // Sort by creation date (newest first)
      const sortedReports = reports.sort((a, b) => b.createdAt - a.createdAt);

      // Get the 5 most recent readings for display
      const recentReports = sortedReports.slice(0, 5);
      setRecentReadings(recentReports);

      // Calculate summary data
      const criticalCount = sortedReports.filter(r => r.analysis.status === 'critical').length;
      const warningCount = sortedReports.filter(r => r.analysis.status === 'warning').length;
      const goodCount = sortedReports.filter(r => r.analysis.status === 'good').length;

      // Find most used sensor type
      const sensorTypeCounts = sortedReports.reduce((acc, report) => {
        const type = report.sensorData.sensorType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<SensorType, number>);

      let mostUsedSensor: SensorType | null = null;
      let maxCount = 0;

      Object.entries(sensorTypeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsedSensor = type as SensorType;
        }
      });

      setSummaryData({
        totalReadings: sortedReports.length,
        criticalReadings: criticalCount,
        warningReadings: warningCount,
        goodReadings: goodCount,
        latestReading: sortedReports.length > 0 ? sortedReports[0] : null,
        mostUsedSensor,
      });

      return sortedReports;
    } catch (error) {
      console.error('Error loading recent readings:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentReadings();
    setIsRefreshing(false);
  };

  // Handle sensor type selection
  const handleSelectSensorType = (type: SensorType) => {
    setSelectedSensorType(type);
    setSensorValue('');
    setShowInputModal(true);
  };

  // Open input modal
  const openInputModal = () => {
    if (!selectedSensorType) {
      Alert.alert('Select Sensor', 'Please select a sensor type first');
      return;
    }
    setShowInputModal(true);
  };

  // Close input modal
  const closeInputModal = () => {
    setShowInputModal(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate inputs
    if (!selectedSensorType) {
      Alert.alert('Error', 'Please select a sensor type');
      return;
    }

    if (!sensorValue || isNaN(parseFloat(sensorValue))) {
      Alert.alert('Error', 'Please enter a valid sensor value');
      return;
    }

    if (!userProfile?.uid) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setSubmitting(true);

      // Save sensor data
      const sensorData = await SensorService.saveSensorData(
        userProfile.uid,
        selectedSensorType,
        parseFloat(sensorValue),
        notes,
        userProfile.location
      );

      // Generate sensor report
      const report = await SensorService.generateSensorReport(sensorData);

      // Close modal and reset form
      setShowInputModal(false);
      setSensorValue('');
      setNotes('');

      // Refresh readings
      await loadRecentReadings();

      // Navigate to report view screen
      navigation.navigate('SensorDataReportView' as never, { reportId: report.id } as never);

    } catch (error) {
      console.error('Error submitting sensor data:', error);
      Alert.alert('Error', 'Failed to submit sensor data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render sensor type card
  const renderSensorTypeCard = ({ item }: { item: SensorType }) => {
    const info = SensorInfo[item];
    const isSelected = selectedSensorType === item;

    return (
      <TouchableOpacity
        style={styles.sensorTypeCard}
        onPress={() => handleSelectSensorType(item)}
        activeOpacity={0.7}
      >
        <Card
          elevation={isSelected ? 'high' : 'medium'}
          style={[
            styles.sensorTypeCardContent,
            {
              borderWidth: isSelected ? 2 : 0,
              borderColor: isSelected ? info.color : 'transparent',
              backgroundColor: isSelected ? info.color + '10' : colors.white,
            }
          ]}
        >
          <View style={styles.sensorCardInner}>
            <View style={[
              styles.sensorIconContainer,
              {
                backgroundColor: isSelected ? info.color : info.color + '15',
              }
            ]}>
              <Ionicons
                name={info.icon as any}
                size={22}
                color={isSelected ? colors.white : info.color}
              />
            </View>

            <Text style={[
              styles.sensorTypeName,
              { color: isSelected ? info.color : colors.textPrimary }
            ]} numberOfLines={2}>
              {info.name}
            </Text>

            <Text style={styles.sensorTypeUnit}>
              {info.unit}
            </Text>

            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: info.color }]}>
                <Ionicons name="checkmark" size={10} color={colors.white} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render recent reading card
  const renderRecentReadingCard = ({ item }: { item: any }) => {
    const sensorInfo = SensorInfo[item.sensorData.sensorType];
    const statusColor =
      item.analysis.status === 'good' ? colors.success :
      item.analysis.status === 'warning' ? colors.warning :
      colors.error;

    const statusIcon =
      item.analysis.status === 'good' ? 'checkmark-circle' :
      item.analysis.status === 'warning' ? 'alert-circle' :
      'close-circle';

    return (
      <TouchableOpacity
        style={styles.recentReadingCard}
        onPress={() => navigation.navigate('SensorDataReportView' as never, { reportId: item.id } as never)}
        activeOpacity={0.8}
      >
        <Card
          elevation="medium"
          style={styles.recentReadingCardContent}
        >
          <LinearGradient
            colors={[colors.white, colors.surfaceLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.readingCardGradient}
          >
            <View style={styles.readingCardHeader}>
              <View style={styles.readingCardHeaderLeft}>
                <View style={[styles.readingCardIcon, { backgroundColor: sensorInfo.color }]}>
                  <Ionicons name={sensorInfo.icon as any} size={22} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.readingCardTitle}>{sensorInfo.name}</Text>
                  <Text style={styles.readingCardDate}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name={statusIcon} size={16} color={statusColor} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.analysis.status.charAt(0).toUpperCase() + item.analysis.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.readingCardBody}>
              <View style={styles.readingValueSection}>
                <View style={[styles.readingValueBadge, { backgroundColor: sensorInfo.color + '15' }]}>
                  <Text style={[styles.readingValue, { color: sensorInfo.color }]}>
                    {item.sensorData.value}
                    <Text style={styles.readingUnit}> {sensorInfo.unit}</Text>
                  </Text>
                </View>

                <View style={styles.normalRangeContainer}>
                  <Text style={styles.normalRangeLabel}>Normal Range:</Text>
                  <Text style={styles.normalRangeValue}>
                    {sensorInfo.normalRange.min} - {sensorInfo.normalRange.max} {sensorInfo.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.analysisContainer}>
                <Text style={styles.analysisText} numberOfLines={2} ellipsizeMode="tail">
                  {item.analysis.interpretation}
                </Text>
              </View>
            </View>

            <View style={styles.readingCardFooter}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('SensorDataReportView' as never, { reportId: item.id } as never)}
              >
                <Text style={styles.viewDetailsText}>View Full Analysis</Text>
                <AntDesign name="arrowright" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render input modal
  const renderInputModal = () => {
    if (!selectedSensorType) return null;

    const info = SensorInfo[selectedSensorType];

    return (
      <Modal
        visible={showInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeInputModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeInputModal}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLine} />
              <Text style={styles.modalTitle}>Add {info.name} Reading</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeInputModal}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <View style={[styles.sensorInfoCard, { borderColor: info.color }]}>
                <View style={[styles.sensorInfoIconContainer, { backgroundColor: info.color }]}>
                  <Ionicons name={info.icon as any} size={28} color={colors.white} />
                </View>

                <View style={styles.sensorInfoContent}>
                  <Text style={[styles.sensorInfoName, { color: info.color }]}>{info.name}</Text>
                  <Text style={styles.sensorInfoDescription}>{info.description}</Text>
                  <View style={styles.sensorInfoRangeContainer}>
                    <Text style={styles.sensorInfoRangeLabel}>Normal Range:</Text>
                    <View style={[styles.sensorInfoRangeBadge, { backgroundColor: info.color + '20' }]}>
                      <Text style={[styles.sensorInfoRangeValue, { color: info.color }]}>
                        {info.normalRange.min} - {info.normalRange.max} {info.unit}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.inputSection}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="analytics-outline" size={20} color={info.color} />
                  <Text style={[styles.inputLabel, { color: info.color }]}>Sensor Value ({info.unit})</Text>
                </View>
                <TextInput
                  style={[styles.input, { borderColor: info.color + '50' }]}
                  value={sensorValue}
                  onChangeText={setSensorValue}
                  placeholder={`Enter value (e.g., ${info.normalRange.min})`}
                  keyboardType="numeric"
                  returnKeyType="done"
                  autoFocus
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputSection}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="create-outline" size={20} color={info.color} />
                  <Text style={[styles.inputLabel, { color: info.color }]}>Additional Notes (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.notesInput, { borderColor: info.color + '50' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any additional information about this reading..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.expertTipContainer}>
                <View style={styles.expertTipHeader}>
                  <FontAwesome5 name="lightbulb" size={16} color={colors.warning} />
                  <Text style={styles.expertTipTitle}>Expert Tip</Text>
                </View>
                <Text style={styles.expertTipText}>
                  {info.name === 'Soil Moisture' ?
                    'For accurate soil moisture readings, take measurements at the same depth and time of day. Early morning readings are most reliable.' :
                  info.name === 'Soil pH' ?
                    'Soil pH affects nutrient availability. Most crops prefer a pH between 6.0-7.0. Test multiple areas for a comprehensive assessment.' :
                    'Regular monitoring helps identify trends and prevent crop stress before visible symptoms appear.'}
                </Text>
              </View>

              <Button
                title="Analyze Sensor Data"
                variant="primary"
                size="large"
                fullWidth
                loading={submitting}
                leftIcon={<Ionicons name="analytics" size={22} color={colors.white} />}
                style={styles.submitButton}
                onPress={handleSubmit}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
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

          <Text style={styles.headerTitle}>Farm Sensor Hub</Text>

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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Hero Section */}
          <Card style={styles.heroCard}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>Smart Sensor Analytics</Text>
                  <Text style={styles.heroText}>
                    Track your farm's vital signs with precision. Enter sensor readings to get AI-powered analysis and recommendations.
                  </Text>

                  <TouchableOpacity
                    style={styles.addReadingButton}
                    onPress={openInputModal}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addReadingButtonContent}>
                      <Ionicons name="add-circle" size={16} color={colors.white} />
                      <Text style={styles.addReadingButtonText}>Add New Reading</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.heroIconContainer}>
                  <MaterialCommunityIcons name="chip" size={40} color={colors.white} />
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <Card style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
              </View>
              <Text style={styles.statValue}>{summaryData.goodReadings}</Text>
              <Text style={styles.statLabel}>Good</Text>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: colors.warning + '10' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.warning }]}>
                <Ionicons name="alert-circle" size={18} color={colors.white} />
              </View>
              <Text style={styles.statValue}>{summaryData.warningReadings}</Text>
              <Text style={styles.statLabel}>Warning</Text>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: colors.error + '10' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
                <Ionicons name="close-circle" size={18} color={colors.white} />
              </View>
              <Text style={styles.statValue}>{summaryData.criticalReadings}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </Card>
          </View>

          {/* Sensor Type Selection */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="hardware-chip" size={18} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Select Sensor Type</Text>
            </View>
          </View>

          <View style={styles.sensorTypeContainer}>
            <FlatList
              data={sensorTypes}
              renderItem={renderSensorTypeCard}
              keyExtractor={(item) => item}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.sensorTypeGrid}
            />
          </View>

          {/* Recent Readings Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="time" size={18} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Recent Readings</Text>
            </View>

            {recentReadings.length > 0 && (
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={() => navigation.navigate('SensorHistory' as never)}
              >
                <Text style={styles.sectionActionText}>View All</Text>
                <Feather name="chevron-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {recentReadings.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentReadingsList}
              data={recentReadings}
              renderItem={renderRecentReadingCard}
              keyExtractor={(item) => item.id}
              decelerationRate="fast"
              snapToInterval={screenWidth * 0.85 + 15}
              snapToAlignment="center"
              pagingEnabled
            />
          ) : (
            <Card style={styles.emptyStateCard}>
              <View style={styles.emptyStateContent}>
                <View style={styles.emptyStateIconContainer}>
                  <Ionicons name="analytics" size={48} color={colors.primary} />
                </View>
                <Text style={styles.emptyStateTitle}>No Readings Yet</Text>
                <Text style={styles.emptyStateText}>
                  Select a sensor type and add your first reading to get started with sensor analytics.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={openInputModal}
                >
                  <Text style={styles.emptyStateButtonText}>Add First Reading</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Community Insights Section */}
          {recentReadings.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="people" size={18} color={colors.primary} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Community Insights</Text>
                </View>
              </View>

              <Card style={styles.communityCard}>
                <View style={styles.communityCardContent}>
                  <View style={styles.communityIconContainer}>
                    <FontAwesome5 name="users" size={20} color={colors.white} />
                  </View>
                  <View style={styles.communityTextContainer}>
                    <Text style={styles.communityTitle}>Compare with nearby farmers</Text>
                    <Text style={styles.communityText}>
                      Share your sensor data with nearby farmers to compare readings and collaborate on solutions.
                    </Text>
                    <TouchableOpacity
                      style={styles.communityButton}
                      onPress={() => navigation.navigate('FarmerNetwork' as never)}
                    >
                      <Text style={styles.communityButtonText}>Connect with Community</Text>
                      <AntDesign name="arrowright" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      )}

      {/* Input Modal */}
      {renderInputModal()}
    </SafeAreaView>
  );
}

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
  headerRight: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },

  // Hero Section
  heroCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  heroGradient: {
    padding: 0,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.9,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReadingButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addReadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.secondary,
  },
  addReadingButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '31%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sectionActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },

  // Sensor Type Cards
  sensorTypeContainer: {
    marginBottom: 20,
  },
  sensorTypeGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorTypeCard: {
    width: (screenWidth - 80) / 3,
    height: 110,
    margin: 6,
  },
  sensorTypeCardContent: {
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sensorCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  sensorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  sensorTypeName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  sensorTypeUnit: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },

  // Recent Reading Cards
  recentReadingsList: {
    paddingVertical: 8,
  },
  recentReadingCard: {
    width: screenWidth * 0.85,
    marginHorizontal: 8,
  },
  recentReadingCardContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  readingCardGradient: {
    padding: 16,
  },
  readingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readingCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  readingCardTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  readingCardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  readingCardBody: {
    marginBottom: 12,
  },
  readingValueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readingValueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readingValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  readingUnit: {
    fontSize: 14,
  },
  normalRangeContainer: {
    alignItems: 'flex-end',
  },
  normalRangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  normalRangeValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  analysisContainer: {
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 12,
  },
  analysisText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  readingCardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },

  // Empty State
  emptyStateCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  emptyStateContent: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.primary + '15',
  },
  emptyStateTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },

  // Community Card
  communityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  communityCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  communityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  communityTextContainer: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  communityText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  modalHeaderLine: {
    width: 40,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
  },
  sensorInfoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
  },
  sensorInfoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sensorInfoContent: {
    flex: 1,
  },
  sensorInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sensorInfoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  sensorInfoRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sensorInfoRangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  sensorInfoRangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sensorInfoRangeValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.white,
    height: 100,
    textAlignVertical: 'top',
  },
  expertTipContainer: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  expertTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expertTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
    marginLeft: 8,
  },
  expertTipText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default ImprovedSensorDataScreen;
