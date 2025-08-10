import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

// Delivery Screens
import DeliveryManagementScreen from '../screens/delivery/DeliveryManagementScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';

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
import MultiProductCheckoutScreen from '../screens/marketplace/MultiProductCheckoutScreen';
import UserProductsScreen from '../screens/marketplace/UserProductsScreen';
import CartScreen from '../screens/marketplace/CartScreen';
import PrelistedMarketplaceScreen from '../screens/marketplace/PrelistedMarketplaceScreen';
import PrelistedOrdersScreen from '../screens/marketplace/PrelistedOrdersScreen';
import ViewPrelistedProductsScreen from '../screens/marketplace/ViewPrelistedProductsScreen';
import OrderSuccessScreen from '../screens/marketplace/OrderSuccessScreen';
import AddAddressScreen from '../screens/marketplace/AddAddressScreen';
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
// AddDocumentScreen removed as per requirements
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
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    <AuthStack.Screen name="DeliveryManagement" component={DeliveryManagementScreen} />
  </AuthStack.Navigator>
);

// Home Stack Navigator
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />

    {/* Category Screens */}
    <HomeStack.Screen name="MarketplaceCategory" component={MarketplaceCategoryScreen} options={{ headerShown: false }} />

    {/* Settings Screens */}
    <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="AppGuide" component={AppGuideScreen} options={{ headerShown: false }} />

    {/* Wallet Screens */}
    <HomeStack.Screen name="ShowAllTransaction" component={ShowAllTransactionScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="AddBalance" component={AddBalanceScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="WithdrawMoney" component={WithdrawMoneyScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: false }} />

    {/* Verification Screens */}
    <HomeStack.Screen name="VerifyProfile" component={VerifyProfileScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="VendorTypeSelection" component={VendorTypeSelectionScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FarmerVerificationForm" component={FarmerVerificationForm} options={{ headerShown: false }} />

    {/* Support Screens */}
    <HomeStack.Screen name="SupportMain" component={SupportScreen} options={{ headerShown: false }} />

    {/* New Crisis Support Features */}
    <HomeStack.Screen name="CrisisSupport" component={CrisisSupportScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FinancialHealth" component={FinancialHealthScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FinancialPlanInput" component={FinancialPlanInputScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FinancialPlanView" component={FinancialPlanViewScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="RiskManagement" component={RiskManagementScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="InsuranceQuotes" component={InsuranceQuotesScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="Consultants" component={ConsultantsScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FarmerNetwork" component={FarmerNetworkScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="SchemeNavigator" component={SchemeNavigatorScreen} options={{ headerShown: false }} />

    {/* Financial Improvement Screens */}
    <HomeStack.Screen name="IncomeStability" component={IncomeStabilityScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ExpenseManagement" component={ExpenseManagementScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="DebtManagement" component={DebtManagementScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="Savings" component={SavingsScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FinancialPlanning" component={FinancialPlanningScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="DetailedReport" component={DetailedReportScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="SideIncome" component={SideIncomeScreen} options={{ headerShown: false }} />

    {/* Existing Screens */}
    <HomeStack.Screen name="Forecast" component={ForecastScreen} />
    <HomeStack.Screen name="AIForecast" component={AIForecastScreen} />
    <HomeStack.Screen name="FinancialPlan" component={FinancialPlanScreen} />
    <HomeStack.Screen name="CropDiseaseDetection" component={CropDiseaseDetectionScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="SensorData" component={ImprovedSensorDataScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="SensorDataReportView" component={ImprovedSensorDataReportViewScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="LeaseManagement" component={LeaseManagementScreen} />
    <HomeStack.Screen name="DocumentManagement" component={DocumentManagementScreen} />
    {/* AddDocumentScreen removed as per requirements */}
    <HomeStack.Screen name="ContractManagement" component={ContractManagementScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="AddContract" component={AddContractScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ContractDetails" component={ContractDetailsScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ContractDetailsManagement" component={ContractDetailsManagementScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="FarmBuySell" component={FarmBuySellScreen} />
    <HomeStack.Screen name="ApplySchemes" component={ApplySchemesScreen} />
  </HomeStack.Navigator>
);

// Marketplace Stack Navigator
const MarketplaceStackNavigator = () => (
  <MarketplaceStack.Navigator
    initialRouteName="MarketplaceMain"
    screenOptions={({ navigation }) => ({
      headerLeft: () => (
        <Ionicons
          name="arrow-back"
          size={24}
          color="#000"
          style={{ marginLeft: 10 }}
          onPress={() => {
            // Navigate back to MarketplaceMain instead of the previous screen
            navigation.navigate('MarketplaceMain');
          }}
        />
      )
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
    <MarketplaceStack.Screen name="Orders" component={OrdersScreen} />
    <MarketplaceStack.Screen name="FarmerStorefront" component={FarmerStorefrontScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="NearbyFarmers" component={NearbyFarmersScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="DirectCheckout" component={DirectCheckoutScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="MultiProductCheckout" component={MultiProductCheckoutScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="UserProducts" component={UserProductsScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="PrelistedMarketplace" component={PrelistedMarketplaceScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="ViewPrelistedProducts" component={ViewPrelistedProductsScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
    <MarketplaceStack.Screen name="AddAddress" component={AddAddressScreen} options={{ headerShown: false }} />
  </MarketplaceStack.Navigator>
);

// Import ArticleScreen
import ArticleScreen from '../screens/learning/ArticleScreen';

// E-Learning Stack Navigator
const ELearningStackNavigator = () => (
  <ELearningStack.Navigator>
    <ELearningStack.Screen name="ELearningMain" component={ELearningScreen} options={{ headerShown: false }} />
    <ELearningStack.Screen name="ArticleScreen" component={ArticleScreen} options={{ headerShown: false }} />
  </ELearningStack.Navigator>
);

// Chatbot Stack Navigator
const ChatbotStackNavigator = () => (
  <ChatbotStack.Navigator>
    <ChatbotStack.Screen name="ChatbotMain" component={ChatbotScreen} options={{ headerShown: false }} />
  </ChatbotStack.Navigator>
);

// Import farm management screens
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

// My Farm Stack Navigator
const MyFarmStackNavigator = () => {
  return (
    <MyFarmStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MyFarmStack.Screen
        name="MyFarmMain"
        component={MyFarmScreen}
        options={{
          headerShown: false,
          title: 'My Farm'
        }}
      />
    <MyFarmStack.Screen
      name="ExpenseTracker"
      component={ExpenseTrackerScreen}
      options={{ title: 'Expense Tracker' }}
    />
    <MyFarmStack.Screen
      name="AddIncome"
      component={AddIncomeScreen}
      options={{ title: 'Add Income' }}
    />
    <MyFarmStack.Screen
      name="AddExpense"
      component={AddExpenseScreen}
      options={{ title: 'Add Expense' }}
    />
    <MyFarmStack.Screen
      name="Reports"
      component={ReportsScreen}
      options={{ title: 'Reports' }}
    />
    <MyFarmStack.Screen
      name="Orders"
      component={OrdersScreen}
      options={{ title: 'Orders' }}
    />
    <MyFarmStack.Screen name="DetailedReport" component={DetailedReportScreen} options={{ headerShown: false }} />
    <MyFarmStack.Screen name="PrelistedProducts" component={PrelistedMarketplaceScreen} options={{ headerShown: false }} />
    <MyFarmStack.Screen name="PrelistedOrders" component={PrelistedOrdersScreen} options={{ headerShown: false }} />
    <MyFarmStack.Screen name="AddPrelistedProduct" component={AddPrelistedProductScreen} options={{ headerShown: false }} />
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
const SupportStackNavigator = () => (
  <SupportStack.Navigator>
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

// Main Tab Navigator
const TabNavigator = () => {
  const { hasPendingOrders } = useOrderNotification();
  const { userProfile } = useAuth();
  const isFarmer = userProfile?.role === 'farmer';

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

          // For Marketplace tab, show a red dot if there are pending orders
          if (route.name === 'Marketplace' && hasPendingOrders) {
            return (
              <View style={{ position: 'relative' }}>
                <Ionicons name={iconName as any} size={size} color={color} />
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#FF0000',
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: 'white',
                  }}
                />
              </View>
            );
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
    <Tab.Screen name="Home" component={HomeStackNavigator} />
    <Tab.Screen name="Marketplace" component={MarketplaceStackNavigator} />
    <Tab.Screen name="E-Learning" component={ELearningStackNavigator} />
    <Tab.Screen name="Chatbot" component={ChatbotStackNavigator} />
    {isFarmer && (
      <Tab.Screen
        name="My Farm"
        component={MyFarmStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();

            // Navigate to My Farm and reset to main screen
            navigation.navigate('My Farm', {
              screen: 'MyFarmMain'
            });
          },
        })}
      />
    )}
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

  // Determine which navigator to show
  console.log("==== NAVIGATION DECISION ====");
  console.log("Loading:", loading);
  console.log("ShowSplash:", showSplash);
  console.log("User:", user ? `Logged in (${user.uid})` : "Not logged in");
  console.log("UserProfile:", userProfile ? "Exists" : "Does not exist");

  if (userProfile) {
    console.log("Profile complete flag:", userProfile?.profileComplete);
    console.log("Profile complete type:", typeof userProfile.profileComplete);

    // Check if profile has all required fields
    const hasBasicInfo = userProfile.displayName && userProfile.username && userProfile.age && userProfile.phoneNumber;

    let hasRoleSpecificInfo = false;
    if (userProfile.role === 'farmer') {
      hasRoleSpecificInfo = !!(userProfile.farmDetails?.landOwned);
    } else if (userProfile.role === 'vendor') {
      hasRoleSpecificInfo = !!(userProfile.vendorDetails?.businessName && userProfile.vendorDetails?.businessType);
    } else if (userProfile.role === 'consultant') {
      hasRoleSpecificInfo = !!(userProfile.consultantDetails?.specialization && userProfile.consultantDetails?.experience);
    }

    console.log("Has basic info:", hasBasicInfo);
    console.log("Has role-specific info:", hasRoleSpecificInfo);
    console.log("Profile should be considered complete:", hasBasicInfo && hasRoleSpecificInfo);
    console.log("Profile data:", JSON.stringify(userProfile, null, 2));
  }

  // Determine if profile is actually complete based on required fields
  let isProfileActuallyComplete = false;
  if (userProfile) {
    // Check if profileComplete flag is explicitly set to true
    if (userProfile.profileComplete === true) {
      console.log("Profile is marked as complete with profileComplete=true flag");
      isProfileActuallyComplete = true;
    } else {
      // Fallback to checking individual fields
      console.log("Checking individual profile fields for completeness");
      const hasBasicInfo = !!(userProfile.displayName && userProfile.username && userProfile.age && userProfile.phoneNumber);
      console.log("Has basic info:", hasBasicInfo);

      let hasRoleSpecificInfo = false;
      if (userProfile.role === 'farmer') {
        hasRoleSpecificInfo = !!(userProfile.farmDetails?.landOwned);
      } else if (userProfile.role === 'vendor') {
        hasRoleSpecificInfo = !!(userProfile.vendorDetails?.businessName && userProfile.vendorDetails?.businessType);
      } else if (userProfile.role === 'consultant') {
        hasRoleSpecificInfo = !!(userProfile.consultantDetails?.specialization && userProfile.consultantDetails?.experience);
      } else if (userProfile.role === 'buyer') {
        // Buyers don't need additional role-specific info
        hasRoleSpecificInfo = true;
      }
      console.log("Has role-specific info:", hasRoleSpecificInfo);

      isProfileActuallyComplete = !!(hasBasicInfo && hasRoleSpecificInfo);
    }

    console.log("Final profile completeness determination:", isProfileActuallyComplete);
  }

  let currentNavigator;
  if (loading || showSplash) {
    console.log("DECISION: Showing splash screen");
    currentNavigator = (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Splash" component={SplashScreen} />
      </AuthStack.Navigator>
    );
  } else if (user && userProfile && isProfileActuallyComplete) {
    // User is logged in and profile is actually complete with all required fields
    if (userProfile.role === 'delivery_partner') {
      // Delivery partners see the delivery management screen instead of the main app
      console.log("DECISION: User is a delivery partner, showing DeliveryManagementScreen");
      currentNavigator = (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
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
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </AuthStack.Navigator>
    );
  } else {
    // User is not logged in, show auth flow
    console.log("DECISION: User not logged in, showing AuthNavigator");
    currentNavigator = <AuthNavigator />;
  }

  // Use a single NavigationContainer to avoid context issues
  return (
    <NavigationContainer>
      {currentNavigator}
    </NavigationContainer>
  );
};

export default AppNavigator;
