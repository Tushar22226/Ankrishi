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
import { Ionicons, MaterialCommunityIcons, AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
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

const SensorDataScreen = () => {
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
          style={{
            overflow: 'hidden',
            borderRadius: 10,
            borderWidth: isSelected ? 1 : 0,
            borderColor: isSelected ? info.color : 'transparent',
            backgroundColor: isSelected ? info.color + '10' : colors.white,
            height: '100%',
          }}
        >
          <View style={styles.sensorCardContent}>
            <View style={[
              styles.sensorIconContainer,
              {
                backgroundColor: isSelected ? info.color : info.color + '15',
                borderColor: isSelected ? info.color : 'transparent',
              }
            ]}>
              <Ionicons
                name={info.icon as any}
                size={18}
                color={isSelected ? colors.white : info.color}
              />
            </View>

            <View style={styles.sensorTypeInfo}>
              <Text style={[
                styles.sensorTypeName,
                { color: isSelected ? info.color : colors.textPrimary }
              ]} numberOfLines={2}>
                {info.name}
              </Text>
              <Text style={[
                styles.sensorTypeUnit,
                { color: isSelected ? info.color : colors.textSecondary }
              ]}>
                {info.unit}
              </Text>
            </View>

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
          style={{
            overflow: 'hidden',
            borderRadius: borderRadius.xl,
            borderLeftWidth: 4,
            borderLeftColor: statusColor,
          }}
        >
          <View style={styles.recentReadingContent}>
            <View style={styles.recentReadingHeader}>
              <View style={styles.recentReadingHeaderLeft}>
                <View style={[styles.recentReadingIconContainer, { backgroundColor: sensorInfo.color }]}>
                  <Ionicons name={sensorInfo.icon as any} size={22} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.recentReadingName}>{sensorInfo.name}</Text>
                  <Text style={styles.recentReadingDate}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name={statusIcon} size={16} color={statusColor} />
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {item.analysis.status.charAt(0).toUpperCase() + item.analysis.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.recentReadingBody}>
              <View style={styles.recentReadingValueContainer}>
                <View style={[styles.recentReadingValueBadge, { backgroundColor: sensorInfo.color + '15' }]}>
                  <Text style={[styles.recentReadingValue, { color: sensorInfo.color }]}>
                    {item.sensorData.value}
                    <Text style={styles.recentReadingUnit}> {sensorInfo.unit}</Text>
                  </Text>
                </View>

                <View style={styles.normalRangeContainer}>
                  <Text style={styles.normalRangeLabel}>Normal Range:</Text>
                  <Text style={styles.normalRangeValue}>
                    {sensorInfo.normalRange.min} - {sensorInfo.normalRange.max} {sensorInfo.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.recentReadingAnalysisSection}>
                <Text style={styles.recentReadingAnalysisText} numberOfLines={2} ellipsizeMode="tail">
                  {item.analysis.interpretation}
                </Text>
              </View>
            </View>

            <View style={styles.recentReadingFooter}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('SensorDataReportView' as never, { reportId: item.id } as never)}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
                <AntDesign name="arrowright" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
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
              <Text style={styles.modalTitle}>Enter {info.name} Reading</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeInputModal}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <View style={[styles.modalSensorInfo, { backgroundColor: info.color + '10' }]}>
                <View style={[styles.modalSensorIcon, { backgroundColor: info.color }]}>
                  <Ionicons name={info.icon as any} size={32} color={colors.white} />
                </View>

                <View style={styles.modalSensorDetails}>
                  <Text style={[styles.modalSensorName, { color: info.color }]}>{info.name}</Text>
                  <Text style={styles.modalSensorDescription}>{info.description}</Text>
                  <View style={styles.modalRangeContainer}>
                    <Text style={styles.modalRangeLabel}>Normal Range:</Text>
                    <View style={[styles.modalRangeBadge, { backgroundColor: info.color + '20' }]}>
                      <Text style={[styles.modalRangeValue, { color: info.color }]}>
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
          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.white} />
              </View>
              <Text style={styles.statValue}>{summaryData.goodReadings}</Text>
              <Text style={styles.statLabel}>Good</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.warning + '15' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.warning }]}>
                <Ionicons name="alert-circle" size={16} color={colors.white} />
              </View>
              <Text style={styles.statValue}>{summaryData.warningReadings}</Text>
              <Text style={styles.statLabel}>Warning</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.error + '15' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
                <Ionicons name="close-circle" size={16} color={colors.white} />
              </View>
              <Text style={styles.statValue}>{summaryData.criticalReadings}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
          </View>

          {/* Hero Section */}
          <Card style={styles.heroCard}>
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
                <View style={styles.iconBackground}>
                  <MaterialCommunityIcons name="chip" size={30} color={colors.primary} />
                </View>
              </View>
            </View>
          </Card>

          {/* Sensor Type Selection */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="hardware-chip" size={18} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Select Sensor Type</Text>
            </View>
          </View>

          <View style={styles.sensorTypeGridContainer}>
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
        </ScrollView>
      )}

      {/* Input Modal */}
      {renderInputModal()}
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
    shadowColor: colors.primary,
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

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 'auto',
    width: '94%',
    alignSelf: 'center',
  },
  statCard: {
    width: '31%',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  statIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // Hero Section
  heroCard: {
    marginVertical: 10,
    marginHorizontal: 'auto',
    width: '94%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  heroTitle: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  heroText: {
    fontSize: 12,
    color: colors.white,
    lineHeight: 16,
    marginBottom: 12,
    opacity: 0.9,
  },
  addReadingButton: {
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  addReadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
  },
  addReadingButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 6,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 16,
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
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 3,
  },

  // Sensor Type Cards
  sensorTypeGridContainer: {
    marginHorizontal: 'auto',
    width: '94%',
    alignSelf: 'center',
  },
  sensorTypeGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorTypeCard: {
    width: (screenWidth - 60) / 3,
    height: 100,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sensorCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  sensorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  sensorTypeInfo: {
    alignItems: 'center',
  },
  sensorTypeName: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sensorTypeUnit: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Recent Readings
  recentReadingsList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentReadingCard: {
    width: screenWidth * 0.85,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
  },
  recentReadingContent: {
    padding: 12,
  },

  recentReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentReadingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentReadingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  recentReadingName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recentReadingDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  recentReadingBody: {
    marginBottom: 10,
  },
  recentReadingValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentReadingValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recentReadingValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentReadingUnit: {
    fontSize: 12,
  },
  normalRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  normalRangeLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginRight: 4,
  },
  normalRangeValue: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  recentReadingAnalysisSection: {
    marginBottom: 8,
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
  },
  recentReadingAnalysisText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  recentReadingFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 3,
  },

  // Empty State
  emptyStateCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginHorizontal: 8,
  },
  emptyStateContent: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.primary + '15',
  },
  emptyStateTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
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

  // Modal
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
    borderBottomColor: colors.veryLightGray,
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
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalSensorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  modalSensorIcon: {
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
  modalSensorDetails: {
    flex: 1,
  },
  modalSensorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSensorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  modalRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modalRangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  modalRangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalRangeValue: {
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
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.white,
    height: 100,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 10,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    padding: 16,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default SensorDataScreen;