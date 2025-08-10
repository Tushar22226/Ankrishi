import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Animated,
  Easing,
  ImageBackground,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import CropDiseaseService, { PredictionResult } from '../../services/CropDiseaseService';
import LoadingQuote from '../../components/LoadingQuote';
import { LinearGradient } from 'expo-linear-gradient';

const CropDiseaseDetectionScreen = () => {
  // Navigation
  const navigation = useNavigation();

  // State variables
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  // Create a rotating animation for the loading spinner
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Start animations when component mounts
  useEffect(() => {
    // Fade in and scale animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  // Start spinning animation when analyzing
  useEffect(() => {
    if (analyzing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web'
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [analyzing]);

  // Initialize the service and check permissions
  useEffect(() => {
    const initService = async () => {
      try {
        // Check camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setCameraPermission(status === 'granted');

        // Initialize the service
        const initialized = await CropDiseaseService.initialize();
        setModelLoaded(initialized);
      } catch (error) {
        console.error('Error initializing disease detection service:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize the disease detection service. Please try again later.'
        );
      } finally {
        setInitializing(false);
      }
    };

    initService();
  }, []);



  // Handle image selection from gallery
  const handleSelectImage = async () => {
    try {
      // Request permission to access the media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      // Process selected image
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setResult(null); // Clear previous results
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle image capture from camera
  const handleCaptureImage = async () => {
    try {
      // Check and request camera permission if needed
      if (!cameraPermission) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your camera');
          return;
        }
        setCameraPermission(true);
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      // Process captured image
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setResult(null); // Clear previous results
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  // Handle disease detection
  const handleDetectDisease = async () => {
    // Validate prerequisites
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select an image first');
      return;
    }

    if (!modelLoaded) {
      Alert.alert('Model Not Ready', 'Please wait for the AI model to finish loading');
      return;
    }

    // Start analysis
    setAnalyzing(true);

    try {
      // Call the disease detection service
      const predictionResult = await CropDiseaseService.analyzeImage(selectedImage);
      setResult(predictionResult);
    } catch (error) {
      console.error('Error detecting disease:', error);
      Alert.alert('Detection Error', 'Failed to analyze the image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Render disease information
  const renderDiseaseInfo = () => {
    if (!result) return null;

    const { disease, confidence } = result;
    const confidencePercent = (confidence * 100).toFixed(1);

    // Determine severity color
    const severityColor =
      disease.severity === 'low' ? colors.success :
      disease.severity === 'medium' ? colors.warning :
      colors.error;

    // Determine confidence color
    const confidenceColor =
      confidence > 0.9 ? colors.success :
      confidence > 0.8 ? colors.warning :
      colors.error;

    return (
      <Animated.View style={[
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <Card style={styles.resultCard}>
          {/* Result Header */}
          <View style={styles.resultHeader}>
            <View style={styles.resultHeaderTop}>
              <MaterialCommunityIcons
                name={disease.id === 'healthy' ? "check-circle" : "alert-circle"}
                size={28}
                color={disease.id === 'healthy' ? colors.success : colors.error}
              />
              <Text style={styles.resultTitle}>{disease.name}</Text>
            </View>

            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>Confidence:</Text>
              <View style={styles.confidenceMeter}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${confidencePercent}%`,
                      backgroundColor: confidenceColor
                    }
                  ]}
                />
              </View>
              <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
                {confidencePercent}%
              </Text>
            </View>
          </View>

          {/* Disease Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{disease.description}</Text>
          </View>

          {/* Severity Indicator */}
          <View style={styles.severityContainer}>
            <View style={styles.severityLabelContainer}>
              <MaterialCommunityIcons
                name="alert-octagon"
                size={20}
                color={severityColor}
              />
              <Text style={styles.severityLabel}>Severity Level:</Text>
              <Text style={[styles.severityValue, { color: severityColor }]}>
                {disease.severity.charAt(0).toUpperCase() + disease.severity.slice(1)}
              </Text>
            </View>
            <View style={styles.severityBar}>
              <View style={styles.severityBarBackground} />
              <View
                style={[
                  styles.severityBarFill,
                  {
                    width: disease.severity === 'low' ? '33%' :
                           disease.severity === 'medium' ? '66%' : '100%',
                    backgroundColor: severityColor
                  }
                ]}
              />
            </View>
          </View>

          {/* Symptoms Section */}
          {disease.symptoms && disease.symptoms.length > 0 && (
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="leaf-maple" size={22} color={colors.error} />
                <Text style={styles.sectionTitle}>Symptoms</Text>
              </View>
              {disease.symptoms.map((symptom, index) => (
                <View key={`symptom-${index}`} style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>{symptom}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Causes Section */}
          {disease.causes && disease.causes.length > 0 && (
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="virus" size={22} color={colors.warning} />
                <Text style={styles.sectionTitle}>Causes</Text>
              </View>
              {disease.causes.map((cause, index) => (
                <View key={`cause-${index}`} style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>{cause}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Treatments Section */}
          {disease.treatments && disease.treatments.length > 0 && (
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="medical-bag" size={22} color={colors.primary} />
                <Text style={styles.sectionTitle}>Treatments</Text>
              </View>
              {disease.treatments.map((treatment, index) => (
                <View key={`treatment-${index}`} style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>{treatment}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Prevention Section */}
          {disease.preventionMeasures && disease.preventionMeasures.length > 0 && (
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="shield-check" size={22} color={colors.success} />
                <Text style={styles.sectionTitle}>Prevention</Text>
              </View>
              {disease.preventionMeasures.map((measure, index) => (
                <View key={`prevention-${index}`} style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>{measure}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.resultFooter}>
            <Text style={styles.footerText}>
              Analyzed on {new Date().toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </Animated.View>
    );
  };



  // Toggle tips visibility
  const toggleTips = () => {
    setShowTips(!showTips);
  };

  // Tips section
  const renderTips = () => {
    return (
      <Card style={[styles.tipsCard, !showTips && styles.tipsCardHidden]}>
        <View style={styles.tipsHeader}>
          <MaterialCommunityIcons name="lightbulb-on" size={24} color={colors.warning} />
          <Text style={styles.tipsTitle}>Tips for Better Results</Text>
          <TouchableOpacity onPress={toggleTips} style={styles.tipsCloseButton}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Take photos in good lighting conditions</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Focus on the affected area of the plant</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Include both healthy and diseased parts for comparison</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.tipText}>Avoid shadows and reflections in your photos</Text>
          </View>
        </View>
      </Card>
    );
  };

  // Loading state
  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <LoadingQuote loadingText="Connecting to disease detection API..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Crop Disease Detection</Text>

        <TouchableOpacity
          style={styles.tipsButton}
          onPress={toggleTips}
        >
          <MaterialCommunityIcons
            name={showTips ? "lightbulb-on" : "lightbulb-outline"}
            size={24}
            color={showTips ? colors.warning : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tips Card */}
        {renderTips()}

        {/* Main Content */}
        <Animated.View style={[
          styles.mainContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconContainer}>
              <MaterialCommunityIcons name="leaf" size={28} color={colors.white} />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Plant Disease Scanner</Text>
              <Text style={styles.bannerText}>
                Take or upload a photo of your crop to identify diseases and get treatment recommendations
              </Text>
            </View>
          </View>

          {/* Image Selection Card */}
          <Card style={styles.imageSelectionCard}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="image-search" size={22} color={colors.primary} />
              {' '}Select Plant Image
            </Text>

            {/* Selected Image Preview */}
            {selectedImage ? (
              <View style={styles.selectedImageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />

                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleSelectImage}
                  >
                    <MaterialCommunityIcons name="image-plus" size={20} color={colors.white} />
                    <Text style={styles.changeImageText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.imageOptions}>
                <TouchableOpacity
                  style={styles.imageOptionButton}
                  onPress={handleCaptureImage}
                >
                  <View style={styles.imageOptionIcon}>
                    <MaterialCommunityIcons name="camera" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.imageOptionText}>Take Photo</Text>
                </TouchableOpacity>

                <View style={styles.imageOptionDivider}>
                  <Text style={styles.imageOptionDividerText}>or</Text>
                </View>

                <TouchableOpacity
                  style={styles.imageOptionButton}
                  onPress={handleSelectImage}
                >
                  <View style={styles.imageOptionIcon}>
                    <MaterialCommunityIcons name="image-multiple" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Analyze Button */}
            {selectedImage && (
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  (!modelLoaded || analyzing) && styles.analyzeButtonDisabled
                ]}
                onPress={handleDetectDisease}
                disabled={!modelLoaded || analyzing}
              >
                {analyzing ? (
                  <View style={styles.analyzeButtonContent}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <MaterialCommunityIcons name="loading" size={24} color={colors.white} />
                    </Animated.View>
                    <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  </View>
                ) : (
                  <View style={styles.analyzeButtonContent}>
                    <MaterialCommunityIcons name="magnify" size={24} color={colors.white} />
                    <Text style={styles.analyzeButtonText}>Analyze Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Model Loading Indicator */}
            {!modelLoaded && (
              <View style={styles.modelLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.modelLoadingText}>
                  Connecting to disease detection API...
                </Text>
              </View>
            )}
          </Card>

          {/* Analysis Results */}
          {analyzing && (
            <Card style={styles.analysisCard}>
              <View style={styles.analysisContent}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <MaterialCommunityIcons name="leaf-circle" size={48} color={colors.primary} />
                </Animated.View>
                <Text style={styles.analysisTitle}>Analyzing your plant...</Text>
                <Text style={styles.analysisSubtitle}>
                  Our AI is examining the image for disease patterns
                </Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            </Card>
          )}

          {/* Results */}
          {result && !analyzing && renderDiseaseInfo()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width: windowWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Main Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', spacing.md),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  mainContent: {
    width: '100%',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Banner Styles
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  bannerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.9,
  },

  // Tips Card Styles
  tipsCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    overflow: 'hidden',
  },
  tipsCardHidden: {
    display: 'none',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.warning + '10',
  },
  tipsTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  tipsCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsList: {
    padding: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },

  // Image Selection Card Styles
  imageSelectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  imageOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  imageOptionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  imageOptionIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  imageOptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  imageOptionDivider: {
    width: 40,
    alignItems: 'center',
  },
  imageOptionDividerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  selectedImageContainer: {
    width: '100%',
    height: windowWidth * 0.6,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  imageActions: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  changeImageText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    marginLeft: spacing.xs,
  },

  // Analyze Button Styles
  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },

  // Model Loading Styles
  modelLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  modelLoadingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
    marginLeft: spacing.sm,
  },

  // Analysis Card Styles
  analysisCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  analysisContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  analysisTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  analysisSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  progressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // Result Card Styles
  resultCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  resultHeader: {
    marginBottom: spacing.md,
  },
  resultHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  confidenceLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 80,
  },
  confidenceMeter: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    width: 50,
    textAlign: 'right',
  },

  // Description Styles
  descriptionContainer: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Severity Styles
  severityContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  severityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  severityLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  severityValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  severityBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  severityBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
  },
  severityBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Info Section Styles
  infoSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Footer Styles
  resultFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});

export default CropDiseaseDetectionScreen;
