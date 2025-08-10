import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import ForecastService from '../../services/ForecastService';
import MarketplaceService from '../../services/MarketplaceService';
import { Product } from '../../models/Product';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { database } from '../../firebase/config';
// Import the FinancialPlanInputScreen directly
import FinancialPlanInputScreen from '../finance/FinancialPlanInputScreen';

// Feature card interface
interface FeatureCard {
  id: string;
  title: string;
  icon: string;
  screen: string;
  description: string;
  color: string;
  role: 'all' | 'farmer' | 'vendor' | 'buyer';
}

// Feature cards data
const featureCards: FeatureCard[] = [
  // Essential Features


  // New Crisis Support Features
  {
    id: '20',
    title: 'Crisis Support',
    icon: 'heart',
    screen: 'CrisisSupport',
    description: 'Mental health and crisis resources',
    color: '#E91E63',
    role: 'all',
  },
  {
    id: '21',
    title: 'Financial Health',
    icon: 'pulse',
    screen: 'FinancialHealth',
    description: 'Check your financial stability score',
    color: '#00BCD4',
    role: 'farmer',
  },
  {
    id: '22',
    title: 'Risk Management',
    icon: 'shield',
    screen: 'RiskManagement',
    description: 'Identify and mitigate farming risks',
    color: '#FF5722',
    role: 'farmer',
  },
  {
    id: '23',
    title: 'Farmer Network',
    icon: 'people',
    screen: 'FarmerNetwork',
    description: 'Connect with other farmers',
    color: '#4CAF50',
    role: 'farmer',
  },
  {
    id: '24',
    title: 'Scheme Navigator',
    icon: 'compass',
    screen: 'SchemeNavigator',
    description: 'Find and apply for government schemes',
    color: '#3F51B5',
    role: 'farmer',
  },

  // AI and Forecasting
  {
    id: '7',
    title: 'AI Forecasts',
    icon: 'cloud',
    screen: 'Forecast',
    description: 'Weather and market predictions',
    color: '#03A9F4',
    role: 'farmer',
  },
  {
    id: '8',
    title: 'AI Chatbot',
    icon: 'chatbubble-ellipses',
    screen: 'ChatbotMain',
    description: 'Get farming advice and support',
    color: '#673AB7',
    role: 'all',
  },
  {
    id: '28',
    title: 'Disease Detection',
    icon: 'leaf',
    screen: 'CropDiseaseDetection',
    description: 'Detect crop diseases with AI',
    color: '#8BC34A',
    role: 'farmer',
  },
  {
    id: '29',
    title: 'Sensor Data',
    icon: 'analytics',
    screen: 'SensorData',
    description: 'Track and analyze farm sensor data',
    color: '#3F51B5',
    role: 'farmer',
  },

  // Financial Management
  {
    id: '9',
    title: 'Financial Plan',
    icon: 'calculator',
    screen: 'FinancialPlanInput',
    description: 'Create a personalized financial plan',
    color: '#009688',
    role: 'farmer',
  },
  {
    id: '10',
    title: 'Add Income',
    icon: 'cash',
    screen: 'AddIncome',
    description: 'Record your income',
    color: '#4CAF50',
    role: 'farmer',
  },
  {
    id: '11',
    title: 'Add Expense',
    icon: 'wallet',
    screen: 'AddExpense',
    description: 'Track your expenses',
    color: '#FF5722',
    role: 'farmer',
  },
  {
    id: '12',
    title: 'Reports',
    icon: 'bar-chart',
    screen: 'Reports',
    description: 'View financial reports',
    color: '#3F51B5',
    role: 'farmer',
  },

  // Document Management
  {
    id: '13',
    title: 'Lease Management',
    icon: 'document-text',
    screen: 'LeaseManagement',
    description: 'Manage land leases',
    color: '#795548',
    role: 'farmer',
  },
  {
    id: '14',
    title: 'Documents',
    icon: 'folder',
    screen: 'DocumentManagement',
    description: 'Store important documents',
    color: '#607D8B',
    role: 'all',
  },
  {
    id: '15',
    title: 'Contracts',
    icon: 'create',
    screen: 'ContractManagement',
    description: 'Manage farming contracts',
    color: '#9E9E9E',
    role: 'all',
  },
  {
    id: '25',
    title: 'Tenders',
    icon: 'megaphone',
    screen: 'ContractManagement',
    description: 'Browse and bid on tenders',
    color: '#FF9800',
    role: 'all',
  },
  // Add duplicates in Essential category for better visibility
  // Other Features
  {
    id: '16',
    title: 'Farm Buy/Sell',
    icon: 'business',
    screen: 'FarmBuySell',
    description: 'Buy or sell farmland',
    color: '#E91E63',
    role: 'all',
  }
];

// Feature categories for SwaRail-style UI
interface FeatureCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
}

const featureCategories: FeatureCategory[] = [
  {
    id: 'essential',
    title: 'Essential',
    icon: 'star',
    color: '#4CAF50',
  },
  {
    id: 'crisis',
    title: 'Support',
    icon: 'heart',
    color: '#E91E63',
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: 'cash',
    color: '#3F51B5',
  },
  {
    id: 'ai',
    title: 'AI Tools',
    icon: 'bulb',
    color: '#673AB7',
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: 'document',
    color: '#795548',
  },
];

// Map features to categories
const getCategoryForFeature = (featureId: string): string => {
  const id = parseInt(featureId, 10);
  if (id >= 1 && id <= 6 || id === 19 || id === 26 || id === 27) return 'essential';
  if (id >= 20 && id <= 24) return 'crisis';
  if (id >= 7 && id <= 8 || id === 28 || id === 29) return 'ai';
  if (id >= 9 && id <= 12) return 'financial';
  if (id >= 13 && id <= 16 || id === 25) return 'documents';
  return 'essential';
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile, logOut } = useAuth();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  // No longer need selected category state
  const [showAlert, setShowAlert] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Group feature cards by category and filter by user role
  const featureCardsByCategory = featureCategories.reduce((acc, category) => {
    acc[category.id] = featureCards.filter(card =>
      (card.role === 'all' || (userProfile && card.role === userProfile.role)) &&
      getCategoryForFeature(card.id) === category.id
    );
    return acc;
  }, {} as Record<string, FeatureCard[]>);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Fetch unread messages count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = () => {
      // Reference to user's chats
      const userChatsRef = database().ref(`users/${user.uid}/chats`);

      userChatsRef.on('value', async (snapshot) => {
        if (!snapshot.exists()) {
          setUnreadMessages(0);
          return;
        }

        let totalUnread = 0;
        const chatIds = Object.keys(snapshot.val());

        // Check each chat for unread messages
        for (const chatId of chatIds) {
          const messagesRef = database().ref(`chats/${chatId}/messages`);

          try {
            const messagesSnapshot = await messagesRef.orderByChild('seen').equalTo(false).once('value');

            if (messagesSnapshot.exists()) {
              // Count only messages that are not from the current user
              messagesSnapshot.forEach((messageSnapshot) => {
                const message = messageSnapshot.val();
                if (message.senderId !== user.uid) {
                  totalUnread++;
                }
                return false; // Continue iteration
              });
            }
          } catch (error) {
            console.error('Error fetching messages for chat', chatId, error);
          }
        }

        setUnreadMessages(totalUnread);
      });

      // Clean up listener
      return () => userChatsRef.off('value');
    };

    const unsubscribe = fetchUnreadMessages();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const loadData = async () => {
    try {
      setRefreshing(true);

      // Get weather forecast
      if (userProfile?.location) {
        try {
          const forecast = await ForecastService.getWeatherForecast(userProfile.location, 1);
          setWeatherForecast(forecast[0]);
        } catch (weatherError) {
          console.log('Using mock weather data due to API issue');
          // If there's an error, we'll use the mock data that's returned by the service
        }
      }

      // Get AI recommendations
      if (user) {
        const recs = await ForecastService.getPersonalizedRecommendations(user.uid);
        setRecommendations(recs);
      }

      // Get featured products
      const products = await MarketplaceService.getRecommendedProducts(user?.uid || '');
      setFeaturedProducts(products);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadData();
  };

  // No longer need category selection as all categories are displayed

  // Function to navigate to Financial Plan Input
  const navigateToFinancialPlanInput = () => {
    console.log('Navigating to FinancialPlanInput');
    // Direct navigation to the screen
    navigation.navigate('FinancialPlanInput' as never);
  };

  // Render weather widget
  const renderWeatherWidget = () => {
    if (!weatherForecast) return null;

    return (
      <Card style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherTitle}>Today's Weather</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Forecast' as never)}>
            <Text style={styles.viewMore}>View More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weatherContent}>
          <View style={styles.weatherIconContainer}>
            <Ionicons
              name={
                weatherForecast.condition === 'sunny'
                  ? 'sunny'
                  : weatherForecast.condition === 'partly_cloudy'
                  ? 'partly-sunny'
                  : weatherForecast.condition === 'cloudy'
                  ? 'cloud'
                  : weatherForecast.condition === 'rainy'
                  ? 'rainy'
                  : weatherForecast.condition === 'stormy'
                  ? 'thunderstorm'
                  : 'snow'
              }
              size={48}
              color={colors.primary}
            />
          </View>

          <View style={styles.weatherDetails}>
            <Text style={styles.temperature}>
              {weatherForecast.temperature.avg}°C
            </Text>
            <Text style={styles.weatherCondition}>
              {weatherForecast.condition.charAt(0).toUpperCase() +
                weatherForecast.condition.slice(1).replace('_', ' ')}
            </Text>
            <Text style={styles.weatherSubtext}>
              H: {weatherForecast.temperature.max}° L: {weatherForecast.temperature.min}°
            </Text>
          </View>

          <View style={styles.weatherStats}>
            <View style={styles.weatherStat}>
              <Ionicons name="water-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.weatherStatText}>{weatherForecast.humidity}%</Text>
            </View>
            <View style={styles.weatherStat}>
              <Ionicons name="umbrella-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.weatherStatText}>
                {(weatherForecast.precipitation.probability * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.weatherStat}>
              <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.weatherStatText}>{weatherForecast.windSpeed} km/h</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // Render crisis alert
  const renderCrisisAlert = () => {
    if (!showAlert) return null;

    return (
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => navigation.navigate('CrisisSupport' as never)}
      >
        <View style={styles.alertContent}>
          <View style={styles.alertIconContainer}>
            <Ionicons name="heart" size={24} color={colors.white} />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>Need support?</Text>
            <Text style={styles.alertDescription}>
              We're here to help. Access mental health resources, financial guidance, and community support.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.alertCloseButton}
          onPress={(e) => {
            e.stopPropagation();
            setShowAlert(false);
          }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render AI recommendations
  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    // Only show the first 2 recommendations to make it smaller
    const limitedRecommendations = recommendations.slice(0, 2);

    return (
      <View style={styles.recommendationsContainer}>
        <Card style={styles.recommendationsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AIForecast' as never)}>
              <Text style={styles.viewMore}>AI Forecast</Text>
            </TouchableOpacity>
          </View>

          {limitedRecommendations.map((item, index) => (
            <View key={`recommendation-${index}`} style={styles.recommendationItem}>
              <Ionicons name="bulb-outline" size={20} color={colors.secondary} />
              <Text style={styles.recommendationText} numberOfLines={2}>{item}</Text>
            </View>
          ))}
        </Card>
      </View>
    );
  };

  // Render featured products
  const renderFeaturedProducts = () => {
    if (featuredProducts.length === 0) return null;

    return (
      <View style={styles.featuredProductsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Marketplace' as never)}>
            <Text style={styles.viewMore}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredProductsScroll}
        >
          {featuredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => {
                // Navigate to ProductDetails in the Marketplace stack
                navigation.navigate('Marketplace' as never, {
                  screen: 'ProductDetails',
                  params: { productId: product.id }
                } as never);
              }}
            >
              <Image
                source={{ uri: product.images[0]?.url || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>
                  ₹{product.discountedPrice || product.price}
                  {product.discountedPrice && (
                    <Text style={styles.productOriginalPrice}> ₹{product.price}</Text>
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userProfileContainer}>
          <View style={styles.userProfileImageContainer}>
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.userProfileImage} />
            ) : (
              <View style={styles.userProfileImagePlaceholder}>
                <Ionicons name="person" size={24} color={colors.mediumGray} />
              </View>
            )}
          </View>
          <View style={styles.userProfileInfo}>
            <Text style={styles.greeting}>
              Hello, {userProfile?.displayName || 'Farmer'}
            </Text>
            <Text style={styles.userProfileUsername}>
              @{userProfile?.username || 'username'}
            </Text>
            <Text style={styles.userProfileRole}>
              {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'User'}
            </Text>
          </View>
        </View>

        <View style={styles.headerButtons}>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('ChatList' as never)}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
            </TouchableOpacity>

            {unreadMessages > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  backgroundColor: '#FF0000',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'white',
                  elevation: 4,
                  zIndex: 999,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Crisis Alert */}
        {renderCrisisAlert()}

        {/* Weather Widget */}
        {renderWeatherWidget()}

        {/* Feature Categories Cards */}
        {featureCategories.map((category) => {
          const categoryFeatures = featureCardsByCategory[category.id] || [];
          if (categoryFeatures.length === 0) return null;

          // Using horizontal ScrollView instead of grid

          return (
            <Card key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryCardHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={24} color={colors.white} />
                </View>
                <Text style={styles.categoryCardTitle}>{category.title}</Text>
              </View>

              <View style={styles.categoryFeaturesContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuresScrollContent}
                >
                  {categoryFeatures.map((feature) => (
                    <TouchableOpacity
                      key={feature.id}
                      style={styles.featureItem}
                      onPress={() => {
                      // Handle navigation to screens in different navigators
                      if (feature.screen === 'MyFarmMain') {
                        navigation.navigate('My Farm' as never);
                      } else if (feature.screen === 'Orders') {
                        navigation.navigate('My Farm' as never, { screen: 'Orders' } as never);
                      } else if (feature.screen === 'UserProducts') {
                        navigation.navigate('Marketplace' as never, { screen: 'UserProducts' } as never);
                      }
                      // Handle Marketplace screens
                      else if (feature.screen === 'Fertilizer' || feature.screen === 'EquipmentRental' ||
                              feature.screen === 'AddProduct' || feature.screen === 'Produce') {
                        navigation.navigate('Marketplace' as never, { screen: feature.screen } as never);
                      }
                      // Handle Chatbot screens
                      else if (feature.screen === 'ChatbotMain') {
                        navigation.navigate('Chatbot' as never);
                      }
                      // Handle E-Learning screens
                      else if (feature.screen === 'ELearningMain') {
                        navigation.navigate('E-Learning' as never);
                      }
                      // Handle Farm Management screens
                      else if (feature.screen === 'AddIncome' || feature.screen === 'AddExpense' || feature.screen === 'Reports') {
                        console.log('Navigating to screen:', feature.screen);
                        navigation.navigate('My Farm' as never, { screen: feature.screen } as never);
                      }
                      // Special case for Financial Plan Input
                      else if (feature.screen === 'FinancialPlanInput') {
                        console.log('Navigating to FinancialPlanInput from feature card');
                        navigateToFinancialPlanInput();
                      }
                      // Special case for Tenders
                      else if (feature.title === 'Tenders') {
                        console.log('Navigating to Tenders');
                        navigation.navigate('ContractManagement' as never, { initialTab: 'tenders' } as never);
                      }
                      // For screens in the current navigator (Home stack)
                      else {
                        console.log('Navigating to screen:', feature.screen);
                        navigation.navigate(feature.screen as never);
                      }
                    }}
                  >
                    <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                      <Ionicons name={feature.icon as any} size={24} color={colors.white} />
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle} numberOfLines={1}>
                        {feature.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Card>
          );
        })}

        {/* AI Recommendations */}
        {renderRecommendations()}

        {/* Featured Products */}
        {renderFeaturedProducts()}
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  userProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userProfileImageContainer: {
    marginRight: spacing.md,
  },
  userProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userProfileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  userProfileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  userProfileUsername: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  userProfileRole: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    marginLeft: spacing.sm,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
    zIndex: 10,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Crisis Alert styles
  alertCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)', // Light red color
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    marginHorizontal:10,
    marginTop:10,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertTextContainer: {
    flex: 1,
    marginRight: spacing.xl,
  },
  alertTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  alertDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  alertCloseButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Weather styles
  weatherCard: {
    marginBottom: spacing.lg,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weatherTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  viewMore: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  temperature: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  weatherCondition: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  weatherSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  weatherStats: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: spacing.md,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  weatherStatText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  // Categories styles
  categoryCard: {
    marginHorizontal: 0,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    alignSelf: 'center',
    width: '94%',
    // Use platform-specific shadow
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
      : shadows.sm),
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  categoryIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  categoryCardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  categoryFeaturesContainer: {
    marginTop: spacing.xs,
  },
  featuresScrollContent: {
    paddingHorizontal: spacing.xxs,
    paddingBottom: spacing.xs,
  },
  // Feature styles
  sectionTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  featureItem: {
    width: 75,
    padding: 12,
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureTextContainer: {
    width: '100%',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  // Recommendations styles
  recommendationsContainer: {
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  recommendationsCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    alignSelf: 'stretch',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    lineHeight: typography.lineHeight.sm,
  },
  // Products styles
  featuredProductsContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  featuredProductsScroll: {
    paddingRight: spacing.md,
  },
  productCard: {
    width: 150,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    // Use platform-specific shadow
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
      : shadows.sm),
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  productOriginalPrice: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },

});

export default HomeScreen;
