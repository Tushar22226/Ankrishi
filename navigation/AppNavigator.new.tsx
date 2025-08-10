import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

// Delivery Screens
import DeliveryManagementScreen from '../screens/delivery/DeliveryManagementScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';

// Learning Screens
import ArticleScreen from '../screens/learning/ArticleScreen';

// Farm Management Screens
import FarmMapScreen from '../screens/farm/FarmMapScreen';
import CropManagementScreen from '../screens/farm/CropManagementScreen';
import CropDetailsScreen from '../screens/farm/CropDetailsScreen';
import AddCropScreen from '../screens/farm/AddCropScreen';
import TaskManagementScreen from '../screens/farm/TaskManagementScreen';
import AddTaskScreen from '../screens/farm/AddTaskScreen';
import EditFarmScreen from '../screens/farm/EditFarmScreen';
import SoilTestScreen from '../screens/farm/SoilTestScreen';
import WeatherForecastScreen from '../screens/farm/WeatherForecastScreen';
import EquipmentDetailsScreen from '../screens/farm/EquipmentDetailsScreen';

// Category Screens
import MarketplaceCategoryScreen from '../screens/categories/MarketplaceCategoryScreen';
import MarketplaceScreen from '../screens/main/MarketplaceScreen';
import ELearningScreen from '../screens/main/ELearningScreen';
import ChatbotScreen from '../screens/main/ChatbotScreen';
import MyFarmScreen from '../screens/main/MyFarmScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import VerifyProfileScreen from '../screens/profile/VerifyProfileScreen';
import VendorTypeSelectionScreen from '../screens/profile/VendorTypeSelectionScreen';
import FarmerVerificationForm from '../screens/profile/FarmerVerificationForm';
import AppGuideScreen from '../screens/guide/AppGuideScreen';

// Marketplace Screens
import FertilizerScreen from '../screens/marketplace/FertilizerScreen';
import EquipmentRentalScreen from '../screens/marketplace/EquipmentRentalScreen';
import ProduceScreen from '../screens/marketplace/ProduceScreen';
import AddProductScreen from '../screens/marketplace/AddProductScreen';
import AddPrelistedProductScreen from '../screens/marketplace/AddPrelistedProductScreen';
import AddRequirementScreen from '../screens/marketplace/AddRequirementScreen';
import RequirementsScreen from '../screens/marketplace/RequirementsScreen';
import RequirementDetailsScreen from '../screens/marketplace/RequirementDetailsScreen';
import RequirementManagementScreen from '../screens/marketplace/RequirementManagementScreen';
import YourRequirementsScreen from '../screens/marketplace/YourRequirementsScreen';
import EditProductScreen from '../screens/marketplace/EditProductScreen';
import ProductDetailsScreen from '../screens/marketplace/ProductDetailsScreen';
import OrderTrackingScreen from '../screens/marketplace/OrderTrackingScreen';
import OrderManagementScreen from '../screens/marketplace/OrderManagementScreen';
import FarmerStorefrontScreen from '../screens/marketplace/FarmerStorefrontScreen';
import NearbyFarmersScreen from '../screens/marketplace/NearbyFarmersScreen';
import DirectCheckoutScreen from '../screens/marketplace/DirectCheckoutScreen';
import UserProductsScreen from '../screens/marketplace/UserProductsScreen';
import CartScreen from '../screens/marketplace/CartScreen';
import PrelistedMarketplaceScreen from '../screens/marketplace/PrelistedMarketplaceScreen';
import PrelistedOrdersScreen from '../screens/marketplace/PrelistedOrdersScreen';
import ViewPrelistedProductsScreen from '../screens/marketplace/ViewPrelistedProductsScreen';
import UnderMaintenanceScreen from '../screens/common/UnderMaintenanceScreen';

// Farm Management Screens
import ExpenseTrackerScreen from '../screens/farm/ExpenseTrackerScreen';
import AddIncomeScreen from '../screens/farm/AddIncomeScreen';
import AddExpenseScreen from '../screens/farm/AddExpenseScreen';
import ReportsScreen from '../screens/farm/ReportsScreen';
import OrdersScreen from '../screens/farm/OrdersScreen';
import IncomeBreakdownScreen from '../screens/farm/IncomeBreakdownScreen';
import ExpenseBreakdownScreen from '../screens/farm/ExpenseBreakdownScreen';
import WarehouseScreen from '../screens/farm/WarehouseScreen';

// AI Screens
import ForecastScreen from '../screens/ai/ForecastScreen';
import AIForecastScreen from '../screens/ai/AIForecastScreen';
import FinancialPlanScreen from '../screens/ai/FinancialPlanScreen';
import CropDiseaseDetectionScreen from '../screens/ai/CropDiseaseDetectionScreen';
import ImprovedSensorDataScreen from '../screens/ai/ImprovedSensorDataScreen';
import ImprovedSensorDataReportViewScreen from '../screens/ai/ImprovedSensorDataReportViewScreen';

// Document Screens
import LeaseManagementScreen from '../screens/documents/LeaseManagementScreen';
import DocumentManagementScreen from '../screens/documents/DocumentManagementScreen';
import ContractManagementScreen from '../screens/documents/ContractManagementScreen';
import AddContractScreen from '../screens/documents/AddContractScreen';
import ContractDetailsScreen from '../screens/documents/ContractDetailsScreen';
import ContractDetailsManagementScreen from '../screens/documents/ContractDetailsManagementScreen';
import FarmBuySellScreen from '../screens/documents/FarmBuySellScreen';

// Government Schemes Screens
import ApplySchemesScreen from '../screens/schemes/ApplySchemesScreen';

// Support Screens
import SupportScreen from '../screens/support/SupportScreen';
import CrisisSupportScreen from '../screens/support/CrisisSupportScreen';
import FinancialHealthScreen from '../screens/finance/FinancialHealthScreen';
import FinancialPlanInputScreen from '../screens/finance/FinancialPlanInputScreen';
import FinancialPlanViewScreen from '../screens/finance/FinancialPlanViewScreen';
import RiskManagementScreen from '../screens/risk/RiskManagementScreen';
import InsuranceQuotesScreen from '../screens/risk/InsuranceQuotesScreen';
import ConsultantsScreen from '../screens/risk/ConsultantsScreen';
import FarmerNetworkScreen from '../screens/community/FarmerNetworkScreen';
import GroupDetailsScreen from '../screens/community/GroupDetailsScreen';
import SchemeNavigatorScreen from '../screens/schemes/SchemeNavigatorScreen';

// Wallet Screens
import ShowAllTransactionScreen from '../screens/wallet/ShowAllTransactionScreen';
import AddBalanceScreen from '../screens/wallet/AddBalanceScreen';
import WithdrawMoneyScreen from '../screens/wallet/WithdrawMoneyScreen';
import EarningsScreen from '../screens/wallet/EarningsScreen';

// Chat Screens
import ChatScreen from '../screens/chat/ChatScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';

// Financial Improvement Screens
import IncomeStabilityScreen from '../screens/finance/IncomeStabilityScreen';
import ExpenseManagementScreen from '../screens/finance/ExpenseManagementScreen';
import DebtManagementScreen from '../screens/finance/DebtManagementScreen';
import SavingsScreen from '../screens/finance/SavingsScreen';
import FinancialPlanningScreen from '../screens/finance/FinancialPlanningScreen';
import DetailedReportScreen from '../screens/finance/DetailedReportScreen';
import SideIncomeScreen from '../screens/finance/SideIncomeScreen';

// Define stack navigators
const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const MarketplaceStack = createNativeStackNavigator();
const ELearningStack = createNativeStackNavigator();
const ChatbotStack = createNativeStackNavigator();
const MyFarmStack = createNativeStackNavigator();
const SupportStack = createNativeStackNavigator();

// Define tab navigator
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <AuthStack.Screen name="DeliveryManagement" component={DeliveryManagementScreen} />
    </AuthStack.Navigator>
  );
};

// Home Stack Navigator
const HomeStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <HomeStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />

      {/* Category Screens */}
      <HomeStack.Screen name="MarketplaceCategory" component={MarketplaceCategoryScreen} options={{ headerShown: false }} />

      {/* Settings Screens */}
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AppGuide" component={AppGuideScreen} options={{ headerShown: false }} />

      {/* Verification Screens */}
      <HomeStack.Screen name="VerifyProfile" component={VerifyProfileScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="VendorTypeSelection" component={VendorTypeSelectionScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FarmerVerificationForm" component={FarmerVerificationForm} options={{ headerShown: false }} />

      {/* Wallet Screens */}
      <HomeStack.Screen name="ShowAllTransaction" component={ShowAllTransactionScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AddBalance" component={AddBalanceScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="WithdrawMoney" component={WithdrawMoneyScreen} options={{ headerShown: false }} />

      {/* Chat Screens */}
      <HomeStack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />

      {/* Financial Improvement Screens */}
      <HomeStack.Screen name="IncomeStability" component={IncomeStabilityScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ExpenseManagement" component={ExpenseManagementScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="DebtManagement" component={DebtManagementScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Savings" component={SavingsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FinancialPlanning" component={FinancialPlanningScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="SideIncome" component={SideIncomeScreen} options={{ headerShown: false }} />

      {/* Support Screens */}
      <HomeStack.Screen name="SupportMain" component={SupportScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="CrisisSupport" component={CrisisSupportScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FinancialHealth" component={FinancialHealthScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FinancialPlanInput" component={FinancialPlanInputScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FinancialPlanView" component={FinancialPlanViewScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="RiskManagement" component={RiskManagementScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="InsuranceQuotes" component={InsuranceQuotesScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Consultants" component={ConsultantsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FarmerNetwork" component={FarmerNetworkScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="SchemeNavigator" component={SchemeNavigatorScreen} options={{ headerShown: false }} />

      {/* Existing Screens */}
      <HomeStack.Screen name="Forecast" component={ForecastScreen} />
      <HomeStack.Screen name="AIForecast" component={AIForecastScreen} />
      <HomeStack.Screen name="FinancialPlan" component={FinancialPlanScreen} />
      <HomeStack.Screen name="CropDiseaseDetection" component={CropDiseaseDetectionScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="SensorData" component={ImprovedSensorDataScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="SensorDataReportView" component={ImprovedSensorDataReportViewScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="LeaseManagement" component={LeaseManagementScreen} />
      <HomeStack.Screen name="DocumentManagement" component={DocumentManagementScreen} />
      <HomeStack.Screen name="ContractManagement" component={ContractManagementScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AddContract" component={AddContractScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ContractDetails" component={ContractDetailsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ContractDetailsManagement" component={ContractDetailsManagementScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FarmBuySell" component={FarmBuySellScreen} />
      <HomeStack.Screen name="ApplySchemes" component={ApplySchemesScreen} />
    </HomeStack.Navigator>
  );
};

// Marketplace Stack Navigator
const MarketplaceStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <MarketplaceStack.Navigator
      initialRouteName="MarketplaceMain"
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.textPrimary}
            style={{ marginLeft: 10 }}
            onPress={() => {
              // Navigate back to MarketplaceMain instead of the previous screen
              navigation.navigate('MarketplaceMain');
            }}
          />
        ),
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary
      })}
    >
      <MarketplaceStack.Screen name="MarketplaceMain" component={MarketplaceScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="Fertilizer" component={FertilizerScreen} />
      <MarketplaceStack.Screen name="EquipmentRental" component={EquipmentRentalScreen} />
      <MarketplaceStack.Screen name="Produce" component={ProduceScreen} />
      <MarketplaceStack.Screen name="AddProduct" component={AddProductScreen} />
      <MarketplaceStack.Screen name="AddRequirement" component={AddRequirementScreen} />
      <MarketplaceStack.Screen name="Requirements" component={RequirementsScreen} />
      <MarketplaceStack.Screen name="RequirementDetails" component={RequirementDetailsScreen} />
      <MarketplaceStack.Screen name="RequirementManagement" component={RequirementManagementScreen} />
      <MarketplaceStack.Screen name="YourRequirements" component={YourRequirementsScreen} />
      <MarketplaceStack.Screen name="AddPrelistedProduct" component={AddPrelistedProductScreen} />
      <MarketplaceStack.Screen name="EditProduct" component={EditProductScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <MarketplaceStack.Screen name="OrderManagement" component={OrderManagementScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="FarmerStorefront" component={FarmerStorefrontScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="NearbyFarmers" component={NearbyFarmersScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="DirectCheckout" component={DirectCheckoutScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="UserProducts" component={UserProductsScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="PrelistedMarketplace" component={PrelistedMarketplaceScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="PrelistedOrders" component={PrelistedOrdersScreen} options={{ headerShown: false }} />
      <MarketplaceStack.Screen name="ViewPrelistedProducts" component={ViewPrelistedProductsScreen} options={{ headerShown: false }} />
    </MarketplaceStack.Navigator>
  );
};

// E-Learning Stack Navigator
const ELearningStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <ELearningStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary
      }}
    >
      <ELearningStack.Screen name="ELearningMain" component={ELearningScreen} options={{ headerShown: false }} />
      <ELearningStack.Screen name="ArticleScreen" component={ArticleScreen} options={{ headerShown: false }} />
    </ELearningStack.Navigator>
  );
};

// Chatbot Stack Navigator
const ChatbotStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <ChatbotStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary
      }}
    >
      <ChatbotStack.Screen name="ChatbotMain" component={ChatbotScreen} options={{ headerShown: false }} />
    </ChatbotStack.Navigator>
  );
};

// My Farm Stack Navigator
const MyFarmStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <MyFarmStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary
      }}
    >
      <MyFarmStack.Screen name="MyFarmMain" component={MyFarmScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
      <MyFarmStack.Screen name="AddIncome" component={AddIncomeScreen} />
      <MyFarmStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <MyFarmStack.Screen name="Reports" component={ReportsScreen} />
      <MyFarmStack.Screen name="Orders" component={OrdersScreen} />
      <MyFarmStack.Screen name="DetailedReport" component={DetailedReportScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="PrelistedProducts" component={PrelistedMarketplaceScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="IncomeBreakdown" component={IncomeBreakdownScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="ExpenseBreakdown" component={ExpenseBreakdownScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="Warehouse" component={WarehouseScreen} options={{ headerShown: false }} />

      {/* Farm Management Screens */}
      <MyFarmStack.Screen name="FarmMap" component={FarmMapScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="CropManagement" component={CropManagementScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="CropDetails" component={CropDetailsScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="AddCrop" component={AddCropScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="TaskManagement" component={TaskManagementScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="AddTask" component={AddTaskScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="EditFarm" component={EditFarmScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="SoilTest" component={SoilTestScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="WeatherForecast" component={WeatherForecastScreen} options={{ headerShown: false }} />
      <MyFarmStack.Screen name="EquipmentDetails" component={EquipmentDetailsScreen} options={{ headerShown: false }} />
    </MyFarmStack.Navigator>
  );
};

// Support Stack Navigator
const SupportStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <SupportStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary
      }}
    >
      <SupportStack.Screen name="SupportMain" component={SupportScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="CrisisSupport" component={CrisisSupportScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="FinancialHealth" component={FinancialHealthScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="RiskManagement" component={RiskManagementScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="InsuranceQuotes" component={InsuranceQuotesScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="Consultants" component={ConsultantsScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="FarmerNetwork" component={FarmerNetworkScreen} options={{ headerShown: false }} />
      <SupportStack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ headerShown: false }} />
    </SupportStack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'E-Learning') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'My Farm') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mediumGray,
        tabBarStyle: {
          backgroundColor: isDarkMode ? colors.surface : colors.white,
          borderTopColor: colors.lightGray,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Marketplace" component={MarketplaceStackNavigator} />
      <Tab.Screen name="E-Learning" component={ELearningStackNavigator} />
      <Tab.Screen name="Chatbot" component={ChatbotStackNavigator} />
      <Tab.Screen name="My Farm" component={MyFarmStackNavigator} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, userProfile, loading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  // Effect to handle the splash screen timing
  React.useEffect(() => {
    console.log("AppNavigator effect - loading:", loading, "showSplash:", showSplash);

    // Proceed when auth loading is complete
    if (!loading) {
      console.log("Auth loading complete, setting timer to hide splash screen");
      // Wait for 3 seconds before hiding the splash screen
      const timer = setTimeout(() => {
        console.log("Timer complete, hiding splash screen");
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Check if the user profile is complete
  let isProfileActuallyComplete = false;
  if (user && userProfile) {
    // Check if the profile is marked as complete
    if (userProfile.profileComplete) {
      console.log("Profile is marked as complete, checking required fields");
      
      // Check if all required fields are present
      const requiredFields = ['displayName', 'username', 'role'];
      const missingFields = requiredFields.filter(field => !userProfile[field]);
      
      if (missingFields.length === 0) {
        console.log("All required fields are present");
        isProfileActuallyComplete = true;
      } else {
        console.log("Missing required fields:", missingFields);
      }
    } else {
      console.log("Profile is not marked as complete");
    }
    
    console.log("Final profile completeness determination:", isProfileActuallyComplete);
  }

  let currentNavigator;
  const { colors } = useTheme();

  if (loading || showSplash) {
    console.log("DECISION: Showing splash screen");
    currentNavigator = (
      <AuthStack.Navigator screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}>
        <AuthStack.Screen name="Splash" component={SplashScreen} />
      </AuthStack.Navigator>
    );
  } else if (user && userProfile && isProfileActuallyComplete) {
    // User is logged in and profile is actually complete with all required fields
    if (userProfile.role === 'delivery_partner') {
      // Delivery partners see the delivery management screen instead of the main app
      console.log("DECISION: User is a delivery partner, showing DeliveryManagementScreen");
      currentNavigator = (
        <AuthStack.Navigator screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}>
          <AuthStack.Screen name="DeliveryManagement" component={DeliveryManagementScreen} />
          <AuthStack.Screen name="Earnings" component={EarningsScreen} />
        </AuthStack.Navigator>
      );
    } else {
      // Regular users see the main app
      console.log("DECISION: User authenticated and profile actually complete, showing TabNavigator");
      currentNavigator = <TabNavigator />;
    }
  } else if (user && userProfile) {
    // User is logged in but profile is not complete with all required fields
    console.log("DECISION: User logged in but profile incomplete, showing ProfileSetup");
    currentNavigator = (
      <AuthStack.Navigator screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}>
        <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </AuthStack.Navigator>
    );
  } else {
    // User is not logged in, show auth flow
    console.log("DECISION: User not logged in, showing AuthNavigator");
    currentNavigator = <AuthNavigator />;
  }

  // Use a single NavigationContainer to avoid context issues
  const { isDarkMode } = useTheme(); // We already have colors from above

  // Create a custom theme based on the current theme mode
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.white,
      text: colors.textPrimary,
      border: colors.lightGray,
      notification: colors.primary,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.lightGray,
      notification: colors.primary,
    },
  };

  // Select the appropriate theme based on dark mode setting
  const theme = isDarkMode ? customDarkTheme : customLightTheme;

  return (
    <NavigationContainer theme={theme}>
      {currentNavigator}
    </NavigationContainer>
  );
};

export default AppNavigator;
