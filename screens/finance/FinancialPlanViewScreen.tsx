import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { RootStackParamList } from '../../navigation/types';

type FinancialPlanViewScreenRouteProp = RouteProp<
  RootStackParamList,
  'FinancialPlanView'
>;

interface PlanData {
  userId?: string;
  userName?: string;
  farmingType: string;
  primaryCrop: string;
  cropType?: string; // For backward compatibility
  landSize: number;
  expectedYield?: number;
  currentSavings: number;
  annualFarmIncome?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  monthlyHouseholdExpenses?: number;
  loanAmount: number;
  loanType?: string;
  loanDuration?: number;
  customInterestRate?: number | null;
  monthlyLoanPayment?: number | null;
  interestRate?: number;
  planDuration?: number;
  selectedCrops?: string[];
  selectedFruits?: string[];
  selectedVegetables?: string[];
  createdAt: number;
  planType?: string;
  state?: string;
  district?: string;
  irrigationType?: string;
  aiPredictions?: {
    yieldPrediction: any;
    pricePrediction: any;
    costOptimization: any;
    riskAssessment: any;
    governmentBenefits: any;
    cashFlowProjection: any;
    recommendations: any[];
  };
}

interface MonthlyProjection {
  month: number;
  calendarMonth?: number;
  monthName?: string;
  year?: number;
  income: number;
  expenses: number;
  savings: number;
  loanBalance: number;
  cashFlow: number;
}

interface ExpenseCategory {
  name: string;
  percentage: number;
  amount: number;
  recommendation?: string;
}

const FinancialPlanViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<FinancialPlanViewScreenRouteProp>();
  const { planData } = route.params;


  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netSavings, setNetSavings] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [savingsRecommendations, setSavingsRecommendations] = useState<string[]>([]);

  // Calculate financial projections
  useEffect(() => {
    calculateProjections();
    generateRecommendations();
    calculateExpenseCategories();
    generateSavingsRecommendations();
  }, [planData]);

  const calculateProjections = () => {
    const monthlyProjections: MonthlyProjection[] = [];
    let runningIncome = 0;
    let runningExpenses = 0;
    let runningSavings = planData.currentSavings;
    let loanBalance = planData.loanAmount;

    // Use AI predictions if available, otherwise fallback to old logic
    if (planData.aiPredictions?.cashFlowProjection) {
      // Use AI-generated cash flow projections
      const aiProjections = planData.aiPredictions.cashFlowProjection.monthlyProjections;

      aiProjections.forEach((projection: any, index: number) => {
        runningSavings += projection.netCashFlow;
        runningIncome += projection.income;
        runningExpenses += projection.expenses;

        monthlyProjections.push({
          month: projection.month,
          income: projection.income,
          expenses: projection.expenses,
          savings: Math.round(runningSavings),
          loanBalance: Math.round(loanBalance),
          cashFlow: projection.netCashFlow,
        });
      });

      setProjections(monthlyProjections);
      setTotalIncome(planData.aiPredictions.cashFlowProjection.annualIncome);
      setTotalExpenses(planData.aiPredictions.cashFlowProjection.annualExpenses);
      setNetSavings(planData.aiPredictions.cashFlowProjection.netAnnualIncome);
      return;
    }

    // Fallback to old calculation logic
    const cropType = planData.primaryCrop || planData.cropType || '';
    const monthlyIncome = planData.monthlyIncome || (planData.annualFarmIncome || 0) / 12;
    const monthlyExpenses = planData.monthlyExpenses || planData.monthlyHouseholdExpenses || 0;
    const interestRate = planData.interestRate || 4.0;
    const planDuration = planData.planDuration || 12;

    // Calculate monthly loan payment if there's a loan
    const monthlyLoanPayment = planData.monthlyLoanPayment ||
      calculateMonthlyLoanPayment(
        planData.loanAmount,
        interestRate,
        planData.loanDuration || planDuration
      );

    // Get harvest schedule based on farming type
    const harvestSchedule = getHarvestSchedule(planData.farmingType, cropType);

    // Calculate total crop income for the plan duration using AI prediction
    const totalCropIncome = planData.expectedYield && planData.expectedYield > 0 ?
      estimateCropIncome(cropType, planData.expectedYield, 6, planData.landSize) : 0;

    // Generate projections for 12 months starting from today
    const today = new Date();
    const startMonth = today.getMonth() + 1; // Current month (1-12)
    const startYear = today.getFullYear();

    for (let i = 0; i < 12; i++) {
      // Calculate actual calendar month and year
      const currentDate = new Date(startYear, today.getMonth() + i, 1);
      const calendarMonth = currentDate.getMonth() + 1; // 1-12
      const year = currentDate.getFullYear();
      const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Basic monthly income (regular income like dairy, salary, etc.)
      let currentMonthlyIncome = monthlyIncome;

      // Add seasonal crop income based on harvest schedule
      if (harvestSchedule.includes(calendarMonth) && totalCropIncome > 0) {
        // Distribute crop income across harvest months
        currentMonthlyIncome += totalCropIncome / harvestSchedule.length;
      }

      // Calculate monthly expenses (including loan payment)
      let currentMonthlyExpenses = monthlyExpenses;
      if (loanBalance > 0 && monthlyLoanPayment > 0) {
        currentMonthlyExpenses += monthlyLoanPayment;
      }

      // Calculate monthly cash flow
      const cashFlow = currentMonthlyIncome - currentMonthlyExpenses;

      // Update savings
      runningSavings += cashFlow;

      // Update loan balance with proper EMI calculation
      if (loanBalance > 0 && monthlyLoanPayment > 0) {
        const monthlyInterestRate = (interestRate / 100) / 12;
        const interestPayment = loanBalance * monthlyInterestRate;
        const principalPayment = Math.max(0, monthlyLoanPayment - interestPayment);

        // Ensure we don't pay more principal than remaining balance
        const actualPrincipalPayment = Math.min(principalPayment, loanBalance);
        loanBalance = Math.max(0, loanBalance - actualPrincipalPayment);
      }

      // Update running totals
      runningIncome += currentMonthlyIncome;
      runningExpenses += currentMonthlyExpenses;

      // Add to projections with actual calendar information
      monthlyProjections.push({
        month: i + 1, // Sequential month number for display
        calendarMonth, // Actual calendar month (1-12)
        monthName, // Full month name with year
        year,
        income: Math.round(currentMonthlyIncome),
        expenses: Math.round(currentMonthlyExpenses),
        savings: Math.round(runningSavings),
        loanBalance: Math.round(loanBalance),
        cashFlow: Math.round(cashFlow),
      });
    }

    setProjections(monthlyProjections);
    setTotalIncome(Math.round(runningIncome));
    setTotalExpenses(Math.round(runningExpenses));
    setNetSavings(Math.round(runningSavings - planData.currentSavings));
  };

  // Get realistic harvest schedule based on farming type and crop
  const getHarvestSchedule = (farmingType: string, cropType: string): number[] => {
    // Default harvest months based on farming type and crop
    const harvestSchedules: Record<string, number[]> = {
      // Crops - typically 1-2 harvests per year
      'Rice': [4, 10], // Kharif and Rabi seasons
      'Wheat': [4], // Rabi harvest
      'Corn': [6, 11], // Kharif and Rabi
      'Sugarcane': [12], // Annual harvest
      'Cotton': [10], // Kharif harvest
      'Soybean': [9], // Kharif harvest
      'Lentils (Dal)': [4], // Rabi harvest
      'Chickpea': [4], // Rabi harvest
      'Mustard': [4], // Rabi harvest
      'Groundnut': [6, 10], // Two seasons
      'Sunflower': [6, 11], // Two seasons

      // Fruits - seasonal harvests
      'Mango': [5, 6], // Summer harvest
      'Banana': [3, 6, 9, 12], // Year-round with peaks
      'Apple': [9, 10], // Autumn harvest
      'Orange': [12, 1], // Winter harvest
      'Grapes': [3, 4], // Spring harvest
      'Watermelon': [5, 6], // Summer harvest
      'Papaya': [2, 4, 6, 8, 10, 12], // Multiple harvests
      'Guava': [11, 12], // Winter harvest
      'Pomegranate': [10, 11], // Post-monsoon
      'Pineapple': [6], // Summer harvest

      // Vegetables - multiple harvests
      'Potato': [3, 11], // Two main seasons (spring and post-monsoon)
      'Tomato': [2, 4, 6, 8, 10, 12], // Multiple harvests year-round
      'Onion': [4, 11], // Two seasons (rabi and kharif)
      'Cabbage': [1, 2, 11, 12], // Winter crops (cool season)
      'Cauliflower': [1, 2, 12], // Winter harvest only (cool season)
      'Brinjal': [1, 3, 5, 7, 9, 11], // Multiple harvests (warm season)
      'Okra': [6, 7, 8, 9], // Monsoon/summer season (warm season)
      'Spinach': [1, 2, 11, 12], // Winter leafy (cool season)
      'Carrot': [1, 2, 12], // Winter harvest (cool season)
      'Peas': [1, 2, 3], // Winter harvest (cool season)
    };

    // For dairy, income is monthly
    if (farmingType === 'dairy') {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Monthly income
    }

    // Get specific crop schedule or default based on farming type
    const schedule = harvestSchedules[cropType];
    if (schedule) {
      return schedule;
    }

    // Default schedules by farming type
    switch (farmingType) {
      case 'crops':
        return [4, 10]; // Two seasons
      case 'fruits':
        return [6]; // Annual harvest
      case 'vegetables':
        return [3, 6, 9, 12]; // Quarterly harvests
      default:
        return [6, 12]; // Bi-annual
    }
  };

  const calculateMonthlyLoanPayment = (principal: number, rate: number, months: number): number => {
    if (principal === 0 || rate === 0 || months === 0) return 0;

    // Convert annual rate to monthly
    const monthlyRate = rate / 100 / 12;

    // Calculate monthly payment using loan formula
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  // AI Rules-Based Price Prediction Model
  const getMarketPricePrediction = (cropType: string, month: number, landSize: number) => {
    // Base prices per quintal (current market rates)
    const basePrices: Record<string, number> = {
      'Rice': 2100, 'Wheat': 2250, 'Corn': 1850, 'Sugarcane': 380, 'Cotton': 6200,
      'Soybean': 4600, 'Lentils (Dal)': 6500, 'Chickpea': 5800, 'Mustard': 5200,
      'Groundnut': 5500, 'Sunflower': 6000,
      'Mango': 3200, 'Banana': 1200, 'Apple': 8500, 'Orange': 2800, 'Grapes': 4500,
      'Watermelon': 800, 'Papaya': 1500, 'Guava': 2000, 'Pomegranate': 6000, 'Pineapple': 2500,
      'Potato': 1300, 'Tomato': 2800, 'Onion': 1600, 'Cabbage': 1000, 'Cauliflower': 1800,
      'Brinjal': 2200, 'Okra': 3000, 'Spinach': 2500, 'Carrot': 2000, 'Peas': 4000,
      'Cow Milk': 35, 'Buffalo Milk': 45, 'Goat Milk': 60 // per liter
    };

    const basePrice = basePrices[cropType] || 2000;

    // AI Rules for price prediction
    let priceMultiplier = 1.0;

    // Rule 1: Seasonal demand patterns
    const seasonalFactors: Record<string, Record<number, number>> = {
      'Rice': { 1: 1.1, 2: 1.15, 3: 1.2, 4: 0.85, 5: 0.9, 6: 0.95, 7: 1.0, 8: 1.05, 9: 1.1, 10: 0.8, 11: 0.9, 12: 1.0 },
      'Wheat': { 1: 1.2, 2: 1.25, 3: 1.3, 4: 0.8, 5: 0.85, 6: 0.9, 7: 0.95, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.15, 12: 1.2 },
      'Tomato': { 1: 1.3, 2: 1.4, 3: 0.7, 4: 0.6, 5: 0.8, 6: 0.9, 7: 1.1, 8: 1.2, 9: 1.3, 10: 0.8, 11: 1.2, 12: 1.4 },
      'Onion': { 1: 1.4, 2: 1.5, 3: 1.2, 4: 0.9, 5: 0.8, 6: 0.7, 7: 0.8, 8: 0.9, 9: 1.0, 10: 1.1, 11: 0.9, 12: 1.3 },
      'Mango': { 1: 0.0, 2: 0.0, 3: 0.5, 4: 1.2, 5: 1.0, 6: 0.8, 7: 0.3, 8: 0.0, 9: 0.0, 10: 0.0, 11: 0.0, 12: 0.0 },
      'Potato': { 1: 1.2, 2: 1.3, 3: 0.8, 4: 0.7, 5: 0.8, 6: 0.9, 7: 1.0, 8: 1.1, 9: 1.2, 10: 1.3, 11: 0.9, 12: 1.1 },
      'Cauliflower': { 1: 1.0, 2: 0.9, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.2, 12: 1.1 },
      'Cabbage': { 1: 1.0, 2: 0.9, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.2, 12: 1.1 },
      'Peas': { 1: 1.0, 2: 0.9, 3: 0.8, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.3, 12: 1.2 },
      'Carrot': { 1: 1.0, 2: 0.9, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.2, 12: 1.1 }
    };

    const seasonalFactor = seasonalFactors[cropType]?.[month] || 1.0;
    priceMultiplier *= seasonalFactor;

    // Rule 2: Supply-demand based on farm size (market saturation)
    if (landSize > 10) {
      priceMultiplier *= 0.95; // Large farms may face lower prices due to bulk selling
    } else if (landSize < 2) {
      priceMultiplier *= 1.05; // Small farms may get premium prices in local markets
    }

    // Rule 3: Quality premium for organic/good practices
    const qualityPremium = 1.08; // Assume 8% premium for good farming practices
    priceMultiplier *= qualityPremium;

    // Rule 4: Market volatility factor (random but controlled)
    const volatilityFactor = 0.9 + (Math.random() * 0.2); // ±10% volatility
    priceMultiplier *= volatilityFactor;

    // Rule 5: Government MSP (Minimum Support Price) floor
    const mspFloor = 0.85; // Never go below 85% of base price
    priceMultiplier = Math.max(priceMultiplier, mspFloor);

    return Math.round(basePrice * priceMultiplier);
  };

  const estimateCropIncome = (cropType: string, yield_: number, month: number = 6, landSize: number = 1) => {
    const predictedPrice = getMarketPricePrediction(cropType, month, landSize);
    return yield_ * predictedPrice;
  };

  // Helper functions for price analysis
  const getMarketFactorsText = (cropType: string, month: number, landSize: number): string => {
    const factors = [];

    // Seasonal factor analysis
    const seasonalFactors: Record<string, Record<number, number>> = {
      'Rice': { 1: 1.1, 2: 1.15, 3: 1.2, 4: 0.85, 5: 0.9, 6: 0.95, 7: 1.0, 8: 1.05, 9: 1.1, 10: 0.8, 11: 0.9, 12: 1.0 },
      'Wheat': { 1: 1.2, 2: 1.25, 3: 1.3, 4: 0.8, 5: 0.85, 6: 0.9, 7: 0.95, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.15, 12: 1.2 },
      'Tomato': { 1: 1.3, 2: 1.4, 3: 0.7, 4: 0.6, 5: 0.8, 6: 0.9, 7: 1.1, 8: 1.2, 9: 1.3, 10: 0.8, 11: 1.2, 12: 1.4 },
      'Onion': { 1: 1.4, 2: 1.5, 3: 1.2, 4: 0.9, 5: 0.8, 6: 0.7, 7: 0.8, 8: 0.9, 9: 1.0, 10: 1.1, 11: 0.9, 12: 1.3 },
      'Mango': { 1: 0.0, 2: 0.0, 3: 0.5, 4: 1.2, 5: 1.0, 6: 0.8, 7: 0.3, 8: 0.0, 9: 0.0, 10: 0.0, 11: 0.0, 12: 0.0 },
      'Potato': { 1: 1.2, 2: 1.3, 3: 0.8, 4: 0.7, 5: 0.8, 6: 0.9, 7: 1.0, 8: 1.1, 9: 1.2, 10: 1.3, 11: 0.9, 12: 1.1 },
      'Cauliflower': { 1: 1.0, 2: 0.9, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.2, 12: 1.1 },
      'Cabbage': { 1: 1.0, 2: 0.9, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.2, 12: 1.1 },
      'Peas': { 1: 1.0, 2: 0.9, 3: 0.8, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.3, 12: 1.2 },
      'Carrot': { 1: 1.0, 2: 0.9, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.0, 11: 1.2, 12: 1.1 }
    };

    const seasonalFactor = seasonalFactors[cropType]?.[month] || 1.0;
    if (seasonalFactor > 1.1) {
      factors.push('High seasonal demand');
    } else if (seasonalFactor < 0.9) {
      factors.push('Low seasonal demand');
    } else {
      factors.push('Normal seasonal demand');
    }

    // Farm size factor
    if (landSize > 10) {
      factors.push('Large farm (bulk pricing)');
    } else if (landSize < 2) {
      factors.push('Small farm (premium pricing)');
    } else {
      factors.push('Medium farm (standard pricing)');
    }

    // Quality premium
    factors.push('Quality premium (+8%)');

    // MSP protection
    factors.push('MSP floor protection');

    return factors.join(', ');
  };

  const getPriceRecommendation = (cropType: string, month: number, predictedPrice: number): string => {
    const basePrices: Record<string, number> = {
      'Rice': 2100, 'Wheat': 2250, 'Corn': 1850, 'Sugarcane': 380, 'Cotton': 6200,
      'Soybean': 4600, 'Lentils (Dal)': 6500, 'Chickpea': 5800, 'Mustard': 5200,
      'Groundnut': 5500, 'Sunflower': 6000,
      'Mango': 3200, 'Banana': 1200, 'Apple': 8500, 'Orange': 2800, 'Grapes': 4500,
      'Watermelon': 800, 'Papaya': 1500, 'Guava': 2000, 'Pomegranate': 6000, 'Pineapple': 2500,
      'Potato': 1300, 'Tomato': 2800, 'Onion': 1600, 'Cabbage': 1000, 'Cauliflower': 1800,
      'Brinjal': 2200, 'Okra': 3000, 'Spinach': 2500, 'Carrot': 2000, 'Peas': 4000
    };

    const basePrice = basePrices[cropType] || 2000;
    const priceRatio = predictedPrice / basePrice;

    if (priceRatio > 1.2) {
      return 'Excellent pricing! Consider maximizing harvest quality for premium rates.';
    } else if (priceRatio > 1.1) {
      return 'Good pricing expected. Focus on timely harvest and proper storage.';
    } else if (priceRatio < 0.9) {
      return 'Lower prices expected. Consider value addition or direct marketing.';
    } else {
      return 'Average pricing expected. Maintain quality standards for best returns.';
    }
  };

  const getPriceTrendAnalysis = (cropType: string, landSize: number): string => {
    const analysis = [];

    // Crop-specific analysis
    if (['Tomato', 'Onion', 'Potato'].includes(cropType)) {
      analysis.push('High price volatility crop - prices can vary significantly based on weather and supply.');
    } else if (['Rice', 'Wheat'].includes(cropType)) {
      analysis.push('Stable pricing with government support through MSP and procurement.');
    } else if (['Mango', 'Apple', 'Grapes'].includes(cropType)) {
      analysis.push('Premium fruit with export potential - focus on quality for better prices.');
    }

    // Farm size analysis
    if (landSize > 10) {
      analysis.push('Large farm advantage: Consider contract farming for price stability.');
    } else if (landSize < 2) {
      analysis.push('Small farm advantage: Direct marketing can yield 15-20% higher prices.');
    }

    // General market advice
    analysis.push('Monitor market prices weekly and consider storage options during peak harvest.');

    return analysis.join(' ');
  };

  const calculateExpenseCategories = () => {
    const categories: ExpenseCategory[] = [];

    // Use AI predictions if available, otherwise fallback to old logic
    if (planData.aiPredictions?.costOptimization) {
      const costData = planData.aiPredictions.costOptimization;
      const breakdown = costData.optimizedBreakdown;
      const totalCost = costData.standardTotal;

      categories.push(
        {
          name: 'Seeds',
          percentage: Math.round((breakdown.seeds / totalCost) * 100),
          amount: breakdown.seeds,
          recommendation: 'Use certified seeds from government sources for better yield and disease resistance.'
        },
        {
          name: 'Fertilizers',
          percentage: Math.round((breakdown.fertilizer / totalCost) * 100),
          amount: breakdown.fertilizer,
          recommendation: 'Follow soil health card recommendations for optimal fertilizer use.'
        },
        {
          name: 'Pesticides',
          percentage: Math.round((breakdown.pesticide / totalCost) * 100),
          amount: breakdown.pesticide,
          recommendation: 'Use integrated pest management (IPM) to reduce pesticide dependency.'
        },
        {
          name: 'Labor',
          percentage: Math.round((breakdown.labor / totalCost) * 100),
          amount: breakdown.labor,
          recommendation: 'Consider mechanization for routine tasks to optimize labor costs.'
        },
        {
          name: 'Others',
          percentage: Math.round((breakdown.others / totalCost) * 100),
          amount: breakdown.others,
          recommendation: 'Track miscellaneous expenses to identify cost-saving opportunities.'
        }
      );

      setExpenseCategories(categories);
      return;
    }

    // Fallback to old logic
    const monthlyExpense = planData.monthlyExpenses || planData.monthlyHouseholdExpenses || 0;
    const farmingType = planData.farmingType || 'cereals';

    // Define expense categories based on farming type
    if (farmingType === 'crops' || farmingType === 'cereals') {
      categories.push(
        {
          name: 'Seeds',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Consider buying quality certified seeds for better yield.'
        },
        {
          name: 'Fertilizers',
          percentage: 25,
          amount: monthlyExpense * 0.25,
          recommendation: 'Use organic fertilizers where possible to reduce costs and improve soil health.'
        },
        {
          name: 'Pesticides',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Implement integrated pest management to reduce pesticide costs.'
        },
        {
          name: 'Irrigation',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Consider drip irrigation to save water and reduce costs.'
        },
        {
          name: 'Labor',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Use mechanization for routine tasks to reduce labor costs.'
        },
        {
          name: 'Other',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Track miscellaneous expenses closely to identify cost-saving opportunities.'
        }
      );
    } else if (farmingType === 'fruits' || farmingType === 'horticulture') {
      categories.push(
        {
          name: 'Saplings/Plants',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Invest in high-quality disease-resistant varieties.'
        },
        {
          name: 'Fertilizers',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Use balanced fertilizers specific to fruit trees.'
        },
        {
          name: 'Pesticides',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Use organic pest control methods where possible.'
        },
        {
          name: 'Irrigation',
          percentage: 25,
          amount: monthlyExpense * 0.25,
          recommendation: 'Install drip irrigation for water conservation and better fruit quality.'
        },
        {
          name: 'Labor',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Train workers in proper harvesting techniques to reduce fruit damage.'
        },
        {
          name: 'Other',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Consider investing in cold storage to extend shelf life and get better prices.'
        }
      );
    } else if (farmingType === 'vegetables') {
      categories.push(
        {
          name: 'Seeds/Seedlings',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Use hybrid seeds for better yield and disease resistance.'
        },
        {
          name: 'Fertilizers',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Apply fertilizers based on soil testing results.'
        },
        {
          name: 'Pesticides',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Use neem-based pesticides for organic vegetable production.'
        },
        {
          name: 'Irrigation',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Consider mulching to reduce water usage and weed growth.'
        },
        {
          name: 'Labor',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Stagger planting to distribute labor needs throughout the season.'
        },
        {
          name: 'Other',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Invest in proper packaging to reduce post-harvest losses.'
        }
      );
    } else if (farmingType === 'dairy' || farmingType === 'dairy_livestock') {
      categories.push(
        {
          name: 'Feed',
          percentage: 40,
          amount: monthlyExpense * 0.40,
          recommendation: 'Grow your own fodder to reduce feed costs.'
        },
        {
          name: 'Veterinary Care',
          percentage: 15,
          amount: monthlyExpense * 0.15,
          recommendation: 'Regular preventive care reduces expensive treatments later.'
        },
        {
          name: 'Labor',
          percentage: 20,
          amount: monthlyExpense * 0.20,
          recommendation: 'Invest in basic milking machines to reduce labor costs.'
        },
        {
          name: 'Housing',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Proper housing reduces disease and increases productivity.'
        },
        {
          name: 'Equipment',
          percentage: 10,
          amount: monthlyExpense * 0.10,
          recommendation: 'Maintain equipment regularly to avoid costly breakdowns.'
        },
        {
          name: 'Other',
          percentage: 5,
          amount: monthlyExpense * 0.05,
          recommendation: 'Consider value-added products like cheese or ghee to increase income.'
        }
      );
    }

    setExpenseCategories(categories);
  };

  const generateSavingsRecommendations = () => {
    const savingsRecs: string[] = [];

    // General savings recommendations
    savingsRecs.push('Track all expenses meticulously to identify areas for cost reduction.');
    savingsRecs.push('Join farmer groups to purchase inputs in bulk at discounted prices.');

    // Farming type specific recommendations
    if (planData.farmingType === 'crops') {
      savingsRecs.push('Implement crop rotation to reduce fertilizer and pesticide needs.');
      savingsRecs.push('Consider intercropping to maximize land use and spread risk.');
      savingsRecs.push('Use soil testing to apply only necessary fertilizers, avoiding waste.');
      savingsRecs.push('Invest in rainwater harvesting to reduce irrigation costs.');
    } else if (planData.farmingType === 'fruits') {
      savingsRecs.push('Prune trees properly to increase yield and reduce disease incidence.');
      savingsRecs.push('Use mulching to reduce water usage and weed control costs.');
      savingsRecs.push('Consider direct marketing to consumers for better prices.');
      savingsRecs.push('Implement integrated pest management to reduce pesticide costs.');
    } else if (planData.farmingType === 'vegetables') {
      savingsRecs.push('Use succession planting to ensure continuous harvest and income.');
      savingsRecs.push('Invest in low-cost polyhouses for off-season vegetable production.');
      savingsRecs.push('Save seeds from your best plants for the next season.');
      savingsRecs.push('Use drip irrigation and mulching to reduce water costs.');
    } else if (planData.farmingType === 'dairy') {
      savingsRecs.push('Grow your own fodder crops to reduce feed costs.');
      savingsRecs.push('Maintain proper records of each animal to cull low-producing animals.');
      savingsRecs.push('Learn basic veterinary care to reduce dependence on expensive services.');
      savingsRecs.push('Process milk into products like curd or ghee to increase shelf life and value.');
    }

    // Add recommendations based on financial situation
    if (planData.monthlyExpenses > planData.monthlyIncome * 0.7) {
      savingsRecs.push('Your expenses are high relative to income. Consider reducing non-essential expenses.');
    }

    if (planData.loanAmount > 0) {
      savingsRecs.push('Prioritize paying off high-interest loans to reduce interest expenses.');
    }

    setSavingsRecommendations(savingsRecs);
  };

  const generateRecommendations = () => {
    const recs: string[] = [];

    // Basic financial recommendations
    if (planData.monthlyExpenses > planData.monthlyIncome * 0.8) {
      recs.push('Consider reducing monthly expenses to improve cash flow.');
    }

    if (planData.loanAmount > planData.monthlyIncome * 12) {
      recs.push('Your loan amount is high relative to your income. Consider debt reduction strategies.');
    }

    if (planData.currentSavings < planData.monthlyExpenses * 3) {
      recs.push('Build an emergency fund of at least 3 months of expenses.');
    }

    // Farming type specific recommendations
    if (planData.farmingType === 'crops') {
      recs.push('Consider crop insurance to protect against weather-related losses.');
      if (planData.landSize > 2) {
        recs.push('Consider diversifying crops to reduce risk and improve soil health.');
      }
    } else if (planData.farmingType === 'fruits') {
      recs.push('Consider value-added processing to increase income from your fruit production.');
      recs.push('Explore export markets for premium prices on high-quality fruits.');
    } else if (planData.farmingType === 'vegetables') {
      recs.push('Consider direct marketing through farmers markets for better prices.');
      recs.push('Explore organic certification for premium pricing.');
    } else if (planData.farmingType === 'dairy') {
      recs.push('Consider selling directly to consumers for better margins.');
      recs.push('Explore value-added dairy products to increase income.');
    }

    // Add more recommendations based on projections
    const lastMonth = projections[projections.length - 1];
    if (lastMonth && lastMonth.cashFlow < 0) {
      recs.push('Your projected cash flow is negative. Consider additional income sources or expense reduction.');
    }

    if (lastMonth && lastMonth.savings < planData.currentSavings) {
      recs.push('Your financial plan shows decreasing savings. Review your income and expense projections.');
    }

    // Add government scheme recommendations
    recs.push('Apply for PM-KISAN scheme for ₹6,000 annual income support.');
    recs.push('Consider Pradhan Mantri Fasal Bima Yojana for crop insurance at subsidized rates.');
    recs.push('Explore KCC (Kisan Credit Card) for easy access to credit at 4% interest.');
    recs.push('Check eligibility for Interest Subvention Scheme for additional 3% interest reduction.');

    if (planData.loanAmount > 0) {
      recs.push('Your loan qualifies for subsidized interest rates under government schemes.');
    }

    // Add farming type specific government schemes
    if (planData.farmingType === 'dairy') {
      recs.push('Apply for National Livestock Mission for dairy development support.');
    } else if (planData.farmingType === 'fruits' || planData.farmingType === 'vegetables') {
      recs.push('Consider Mission for Integrated Development of Horticulture (MIDH) benefits.');
    }

    setRecommendations(recs);
  };



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
        <Text style={styles.headerTitle}>Your Financial Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Summary Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Projected Income:</Text>
            <Text style={styles.summaryValue}>₹{totalIncome.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Projected Expenses:</Text>
            <Text style={styles.summaryValue}>₹{totalExpenses.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Savings:</Text>
            <Text style={[
              styles.summaryValue,
              { color: netSavings >= 0 ? colors.success : colors.error }
            ]}>
              ₹{netSavings.toLocaleString()}
            </Text>
          </View>

          {/* Plan Viability Status */}
          {planData.aiPredictions?.cashFlowProjection && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Plan Status:</Text>
              <Text style={[
                styles.summaryValue,
                {
                  color: planData.aiPredictions.cashFlowProjection.isViable ? colors.success : colors.warning,
                  fontWeight: 'bold'
                }
              ]}>
                {planData.aiPredictions.cashFlowProjection.isViable ? '✅ Viable' : '⚠️ Needs Adjustment'}
              </Text>
            </View>
          )}

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Plan Duration:</Text>
            <Text style={styles.summaryValue}>12 months (from today)</Text>
          </View>

          {planData.loanAmount > 0 && (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Loan Amount:</Text>
                <Text style={styles.summaryValue}>₹{planData.loanAmount.toLocaleString()}</Text>
              </View>

              {planData.loanType && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Loan Type:</Text>
                  <Text style={styles.summaryValue}>{planData.loanType}</Text>
                </View>
              )}

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Interest Rate:</Text>
                <Text style={styles.summaryValue}>
                  {planData.interestRate}% per annum {planData.customInterestRate ? '(Custom)' : '(Subsidized)'}
                </Text>
              </View>

              {planData.loanDuration && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Loan Duration:</Text>
                  <Text style={styles.summaryValue}>{planData.loanDuration} months</Text>
                </View>
              )}

              {planData.monthlyLoanPayment && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly EMI:</Text>
                  <Text style={styles.summaryValue}>₹{planData.monthlyLoanPayment.toLocaleString()} (Fixed)</Text>
                </View>
              )}
            </>
          )}
        </Card>

        {/* Monthly Projections */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Projections</Text>
            <Text style={styles.cardSubtitle}>
              Based on {planData.farmingType} farming with realistic harvest cycles
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableContainer}>
            <View>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, styles.monthCell]}>Month</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Income</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Expenses</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Cash Flow</Text>
                <Text style={[styles.tableHeader, styles.amountCell]}>Total Savings</Text>
                {planData.loanAmount > 0 && (
                  <Text style={[styles.tableHeader, styles.amountCell]}>Loan Balance</Text>
                )}
              </View>

              {/* Table Rows */}
              {projections.map((projection, index) => {
                const isHarvestMonth = projection.income > (planData.monthlyIncome || planData.annualFarmIncome / 12 || 0);
                const monthDisplay = projection.monthName ?
                  projection.monthName.split(' ')[0].substring(0, 3) : // Show first 3 letters of month
                  `Month ${projection.month}`;

                return (
                  <View key={index} style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow,
                    isHarvestMonth && styles.harvestRow
                  ]}>
                    <View style={[styles.tableCell, styles.monthCell, styles.monthCellContainer]}>
                      <Text style={styles.monthText}>{monthDisplay}</Text>
                      {isHarvestMonth && (
                        <Text style={styles.harvestIndicator}>🌾</Text>
                      )}
                    </View>

                    <Text style={[
                      styles.tableCell,
                      styles.amountCell,
                      isHarvestMonth && styles.harvestIncome
                    ]}>
                      ₹{projection.income.toLocaleString()}
                    </Text>

                    <Text style={[styles.tableCell, styles.amountCell]}>
                      ₹{projection.expenses.toLocaleString()}
                    </Text>

                    <Text style={[
                      styles.tableCell,
                      styles.amountCell,
                      {
                        color: projection.cashFlow >= 0 ? colors.success : colors.error,
                        fontFamily: typography.fontFamily.bold
                      }
                    ]}>
                      {projection.cashFlow >= 0 ? '+' : ''}₹{projection.cashFlow.toLocaleString()}
                    </Text>

                    <Text style={[
                      styles.tableCell,
                      styles.amountCell,
                      {
                        color: projection.savings >= planData.currentSavings ? colors.success : colors.warning,
                        fontFamily: typography.fontFamily.medium
                      }
                    ]}>
                      ₹{projection.savings.toLocaleString()}
                    </Text>

                    {planData.loanAmount > 0 && (
                      <Text style={[
                        styles.tableCell,
                        styles.amountCell,
                        { color: projection.loanBalance > 0 ? colors.warning : colors.success }
                      ]}>
                        ₹{projection.loanBalance.toLocaleString()}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Text style={styles.harvestIndicator}>🌾</Text>
              <Text style={styles.legendText}>Harvest Month</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Positive Cash Flow</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Negative Cash Flow</Text>
            </View>
          </View>
        </Card>

        {/* Expected Harvest Prices */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI-Predicted Harvest Prices</Text>
            <Text style={styles.cardSubtitle}>
              Smart price predictions based on seasonal patterns, market conditions, and farm size
            </Text>
          </View>

          {/* Use AI predictions if available, otherwise fallback to old logic */}
          {planData.aiPredictions?.pricePrediction ? (
            // AI-based price predictions
            <>
              {planData.aiPredictions.pricePrediction.monthlyPrices.map((priceData: any, index: number) => {
                const monthName = new Date(2024, priceData.month - 1, 1).toLocaleString('default', { month: 'long' });
                const isCurrentSeason = priceData.month >= new Date().getMonth() + 1;

                return (
                  <View key={index} style={styles.priceItem}>
                    <View style={styles.priceHeader}>
                      <Text style={styles.priceMonth}>{monthName} (Month {priceData.month})</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceValue}>₹{priceData.price.toLocaleString()}</Text>
                        <Text style={styles.priceUnit}>per quintal</Text>
                      </View>
                    </View>

                    <View style={styles.priceDetails}>
                      <View style={styles.priceFactors}>
                        <Text style={styles.factorLabel}>AI Market Factors:</Text>
                        {priceData.factors.map((factor: string, factorIndex: number) => (
                          <Text key={factorIndex} style={styles.factorText}>• {factor}</Text>
                        ))}
                      </View>

                      <View style={styles.priceRecommendation}>
                        <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                        <Text style={styles.recommendationText}>
                          {planData.aiPredictions.pricePrediction.recommendation}
                        </Text>
                      </View>
                    </View>

                    {isCurrentSeason && (
                      <View style={styles.seasonBadge}>
                        <Text style={styles.seasonBadgeText}>Current Season</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* AI Price Trend Analysis */}
              <View style={styles.priceTrend}>
                <Text style={styles.trendTitle}>AI Price Trend Analysis</Text>
                <Text style={styles.trendText}>
                  Average Price: ₹{planData.aiPredictions.pricePrediction.averagePrice}/quintal |
                  Volatility: {planData.aiPredictions.pricePrediction.volatility} |
                  MSP Rate: ₹{planData.aiPredictions.pricePrediction.mspRate}/quintal
                </Text>
                <Text style={styles.trendText}>
                  {planData.aiPredictions.pricePrediction.recommendation}
                </Text>
              </View>
            </>
          ) : (
            // Fallback to old price prediction logic
            <>
              {getHarvestSchedule(planData.farmingType, planData.primaryCrop || planData.cropType).map((month, index) => {
                const predictedPrice = getMarketPricePrediction(planData.primaryCrop || planData.cropType, month, planData.landSize);
                const monthName = new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' });
                const isCurrentSeason = month >= new Date().getMonth() + 1;

                return (
                  <View key={index} style={styles.priceItem}>
                    <View style={styles.priceHeader}>
                      <Text style={styles.priceMonth}>{monthName} (Month {month})</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceValue}>₹{predictedPrice.toLocaleString()}</Text>
                        <Text style={styles.priceUnit}>per quintal</Text>
                      </View>
                    </View>

                    <View style={styles.priceDetails}>
                      <View style={styles.priceFactors}>
                        <Text style={styles.factorLabel}>Market Factors:</Text>
                        <Text style={styles.factorText}>
                          {getMarketFactorsText(planData.primaryCrop || planData.cropType, month, planData.landSize)}
                        </Text>
                      </View>

                      <View style={styles.priceRecommendation}>
                        <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                        <Text style={styles.recommendationText}>
                          {getPriceRecommendation(planData.primaryCrop || planData.cropType, month, predictedPrice)}
                        </Text>
                      </View>
                    </View>

                    {isCurrentSeason && (
                      <View style={styles.seasonBadge}>
                        <Text style={styles.seasonBadgeText}>Current Season</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Overall price trend */}
              <View style={styles.priceTrend}>
                <Text style={styles.trendTitle}>Price Trend Analysis</Text>
                <Text style={styles.trendText}>
                  {getPriceTrendAnalysis(planData.primaryCrop || planData.cropType, planData.landSize)}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Expected Expenses by Category */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Expected Expenses by Category</Text>
          <Text style={styles.cardSubtitle}>
            Based on your {planData.farmingType} farming type
          </Text>

          {expenseCategories.map((category, index) => (
            <View key={index} style={styles.expenseCategoryItem}>
              <View style={styles.expenseCategoryHeader}>
                <Text style={styles.expenseCategoryName}>{category.name}</Text>
                <Text style={styles.expenseCategoryPercentage}>{category.percentage}%</Text>
              </View>
              <View style={styles.expenseCategoryBar}>
                <View
                  style={[
                    styles.expenseCategoryFill,
                    { width: `${category.percentage}%` }
                  ]}
                />
              </View>
              <View style={styles.expenseCategoryDetails}>
                <Text style={styles.expenseCategoryAmount}>
                  ₹{category.amount.toLocaleString()}
                </Text>
                <Text style={styles.expenseCategoryRecommendation}>
                  {category.recommendation}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Savings Recommendations */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>How to Save More</Text>

          {savingsRecommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="cash-outline" size={20} color={colors.success} style={styles.recommendationIcon} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </Card>

        {/* AI Cash Flow Recommendations */}
        {planData.aiPredictions?.cashFlowProjection?.recommendations && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>AI Cash Flow Analysis</Text>
            <Text style={styles.cardSubtitle}>
              Smart recommendations based on your income vs expenses analysis
            </Text>

            {planData.aiPredictions.cashFlowProjection.recommendations.map((recommendation: string, index: number) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons
                  name={recommendation.includes('deficit') ? "warning-outline" : "checkmark-circle"}
                  size={20}
                  color={recommendation.includes('deficit') ? colors.warning : colors.success}
                  style={styles.recommendationIcon}
                />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* General Recommendations */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Financial Recommendations</Text>

          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.recommendationIcon} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </Card>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: getPlatformTopSpacing(),
  },
  header: {
    marginTop:40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableHeader: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    padding: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    padding: spacing.sm,
  },
  monthCell: {
    width: 60,
    textAlign: 'center',
  },
  amountCell: {
    width: 120,
    textAlign: 'right',
  },
  evenRow: {
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: colors.background,
  },
  // Enhanced table styles
  tableContainer: {
    marginVertical: spacing.sm,
  },
  harvestRow: {
    backgroundColor: '#f0f8e8', // Light green background for harvest months
  },
  monthCellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  harvestIndicator: {
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  harvestIncome: {
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  // Legend styles
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  // Expense category styles
  expenseCategoryItem: {
    marginBottom: spacing.md,
  },
  expenseCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  expenseCategoryName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  expenseCategoryPercentage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  expenseCategoryBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  expenseCategoryFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  expenseCategoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseCategoryAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    width: '25%',
  },
  expenseCategoryRecommendation: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    width: '75%',
  },
  // Price prediction styles
  priceItem: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceMonth: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  priceUnit: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  priceDetails: {
    marginTop: spacing.sm,
  },
  priceFactors: {
    marginBottom: spacing.sm,
  },
  factorLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  factorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  priceRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  seasonBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  seasonBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  priceTrend: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  trendTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  trendText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});

export default FinancialPlanViewScreen;
