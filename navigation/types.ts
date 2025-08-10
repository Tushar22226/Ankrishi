import { Product } from '../models/Product';

export type MyFarmStackParamList = {
  MyFarmMain: undefined;
  ExpenseTracker: undefined;
  AddIncome: undefined;
  AddExpense: undefined;
  Reports: undefined;
  Orders: undefined;
  DetailedReport: undefined;
  PrelistedProducts: undefined;
  IncomeBreakdown: undefined;
  ExpenseBreakdown: undefined;
  Warehouse: undefined;
  FarmMap: undefined;
  CropManagement: undefined;
  CropDetails: { cropId: string };
  AddCrop: undefined;
  TaskManagement: undefined;
  AddTask: undefined;
  EditFarm: undefined;
  SoilTest: undefined;
  WeatherForecast: undefined;
  EquipmentDetails: { equipmentId: string };
};

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Main tabs
  Main: undefined;
  Home: undefined;
  Marketplace: undefined;
  Learning: undefined;
  Profile: undefined;
  'My Farm': { screen?: keyof MyFarmStackParamList; params?: any };

  // Verification screens
  VerifyProfile: undefined;
  VendorTypeSelection: undefined;
  FarmerVerificationForm: undefined;
  IndividualVendorVerificationForm: undefined;
  CompanyVerificationForm: undefined;
  ConsultantVerificationForm: undefined;

  // Marketplace screens
  ProductDetails: { productId: string };
  AddProduct: undefined;
  FarmerStorefront: { farmerId: string };
  DirectCheckout: {
    productId: string;
    quantity: number;
    farmerId: string;
  };
  Checkout: {
    productId: string;
    quantity: number;
    buyNow?: boolean;
  };
  OrderTrackingScreen: {
    productId: string;
    quantity: number;
  };

  // Finance screens
  FinancialHealthScreen: undefined;
  FinancialPlanInput: undefined;
  FinancialPlanView: {
    planData: {
      userId: string;
      userName: string;
      cropType: string;
      landSize: number;
      expectedYield: number;
      currentSavings: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      loanAmount: number;
      interestRate: number;
      planDuration: number;
      selectedCrops: string[];
      selectedFruits: string[];
      selectedVegetables: string[];
      createdAt: number;
    }
  };

  // Other screens
  Settings: undefined;
  Notifications: undefined;

  // Sensor screens
  SensorData: undefined;
  SensorDataReportView: { reportId: string };
};
