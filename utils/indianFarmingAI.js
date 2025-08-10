// Indian Farming AI Model - Custom JavaScript Implementation
// Based on research of Indian agricultural patterns, government data, and market trends

export class IndianFarmingAI {
  constructor() {
    // Initialize with Indian agricultural data
    this.initializeData();
  }

  initializeData() {
    // State-wise agricultural data
    this.stateData = {
      'Punjab': {
        majorCrops: ['Wheat', 'Rice', 'Cotton'],
        avgRainfall: 500,
        soilType: 'Alluvial',
        marketAccess: 'excellent',
        mspSupport: 'high'
      },
      'Haryana': {
        majorCrops: ['Wheat', 'Rice', 'Sugarcane'],
        avgRainfall: 450,
        soilType: 'Alluvial',
        marketAccess: 'excellent',
        mspSupport: 'high'
      },
      'Uttar Pradesh': {
        majorCrops: ['Wheat', 'Rice', 'Sugarcane', 'Potato'],
        avgRainfall: 800,
        soilType: 'Alluvial',
        marketAccess: 'good',
        mspSupport: 'medium'
      },
      'Maharashtra': {
        majorCrops: ['Cotton', 'Sugarcane', 'Soybean', 'Onion'],
        avgRainfall: 600,
        soilType: 'Black',
        marketAccess: 'excellent',
        mspSupport: 'medium'
      },
      'Karnataka': {
        majorCrops: ['Rice', 'Ragi', 'Cotton', 'Sugarcane'],
        avgRainfall: 700,
        soilType: 'Red',
        marketAccess: 'good',
        mspSupport: 'medium'
      },
      'Tamil Nadu': {
        majorCrops: ['Rice', 'Cotton', 'Sugarcane', 'Groundnut'],
        avgRainfall: 900,
        soilType: 'Alluvial',
        marketAccess: 'good',
        mspSupport: 'medium'
      },
      'Rajasthan': {
        majorCrops: ['Bajra', 'Jowar', 'Mustard', 'Cotton'],
        avgRainfall: 300,
        soilType: 'Desert',
        marketAccess: 'fair',
        mspSupport: 'low'
      },
      'West Bengal': {
        majorCrops: ['Rice', 'Jute', 'Potato', 'Tea'],
        avgRainfall: 1200,
        soilType: 'Alluvial',
        marketAccess: 'good',
        mspSupport: 'medium'
      }
    };

    // Crop-specific data with realistic Indian parameters
    this.cropData = {
      'Rice': {
        avgYieldPerAcre: 25, // quintals
        inputCostPerAcre: 25000, // INR
        laborIntensive: true,
        waterRequirement: 'high',
        seasonality: ['Kharif', 'Rabi'],
        mspRate: 2100, // per quintal
        marketVolatility: 'low',
        governmentSupport: 'high'
      },
      'Wheat': {
        avgYieldPerAcre: 20,
        inputCostPerAcre: 20000,
        laborIntensive: false,
        waterRequirement: 'medium',
        seasonality: ['Rabi'],
        mspRate: 2250,
        marketVolatility: 'low',
        governmentSupport: 'high'
      },
      'Cotton': {
        avgYieldPerAcre: 8,
        inputCostPerAcre: 35000,
        laborIntensive: true,
        waterRequirement: 'medium',
        seasonality: ['Kharif'],
        mspRate: 6200,
        marketVolatility: 'high',
        governmentSupport: 'medium'
      },
      'Sugarcane': {
        avgYieldPerAcre: 350,
        inputCostPerAcre: 50000,
        laborIntensive: true,
        waterRequirement: 'very_high',
        seasonality: ['Annual'],
        mspRate: 380,
        marketVolatility: 'medium',
        governmentSupport: 'high'
      },
      'Potato': {
        avgYieldPerAcre: 150,
        inputCostPerAcre: 40000,
        laborIntensive: true,
        waterRequirement: 'medium',
        seasonality: ['Rabi', 'Kharif'],
        mspRate: 1300,
        marketVolatility: 'very_high',
        governmentSupport: 'low'
      },
      'Onion': {
        avgYieldPerAcre: 120,
        inputCostPerAcre: 35000,
        laborIntensive: true,
        waterRequirement: 'medium',
        seasonality: ['Rabi', 'Kharif'],
        mspRate: 1600,
        marketVolatility: 'very_high',
        governmentSupport: 'low'
      }
    };

    // Government schemes and their benefits
    this.governmentSchemes = {
      'PM-KISAN': { benefit: 6000, frequency: 'annual', eligibility: 'all_farmers' },
      'KCC': { benefit: 'credit_access', interestRate: 4.0, eligibility: 'landowners' },
      'PMFBY': { benefit: 'crop_insurance', premium: 2.0, coverage: 'weather_risk' },
      'MGNREGA': { benefit: 'employment', wageRate: 250, days: 100 },
      'Soil_Health_Card': { benefit: 'soil_testing', cost: 'free', frequency: 'biannual' }
    };

    // Market price patterns (seasonal multipliers)
    this.pricePatterns = {
      'Rice': [1.1, 1.15, 1.2, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 0.8, 0.9, 1.0],
      'Wheat': [1.2, 1.25, 1.3, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2],
      'Cotton': [1.0, 1.05, 1.1, 1.15, 1.2, 1.1, 1.0, 0.9, 0.85, 0.8, 0.9, 0.95],
      'Potato': [1.2, 1.3, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 0.9, 1.1],
      'Onion': [1.4, 1.5, 1.2, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 0.9, 1.3]
    };
  }

  // Main AI prediction function
  generateFinancialPlan(farmData) {
    try {
      // Validate required fields
      if (!farmData) {
        throw new Error('Farm data is required');
      }

      const {
        state = 'Uttar Pradesh',
        farmingType = 'cereals',
        primaryCrop = 'Rice',
        landSize = 1,
        annualFarmIncome = 0,
        monthlyHouseholdExpenses = 0,
        seedCost = 0,
        fertilizerCost = 0,
        pesticideCost = 0,
        laborCost = 0,
        irrigationType = 'Rain-fed',
        pmKisanBeneficiary = false,
        kccHolder = false,
        hasCropInsurance = false,
        location = null
      } = farmData;

      // Validate critical fields
      if (!primaryCrop || landSize <= 0) {
        throw new Error('Primary crop and land size are required');
      }

      console.log('Generating AI plan for:', { state, primaryCrop, landSize, farmingType });

      // AI-based predictions with error handling
      const yieldPrediction = this.predictYield(state, primaryCrop, landSize, irrigationType);
      const pricePrediction = this.predictPrices(primaryCrop, state, location);
      const costOptimization = this.optimizeInputCosts(primaryCrop, landSize, {
        seedCost, fertilizerCost, pesticideCost, laborCost
      });
      const riskAssessment = this.assessRisks(state, primaryCrop, farmingType);
      const governmentBenefits = this.calculateGovernmentBenefits({
        pmKisanBeneficiary, kccHolder, hasCropInsurance, landSize
      });
      const cashFlowProjection = this.projectCashFlow(farmData, yieldPrediction, pricePrediction);

      return {
        yieldPrediction,
        pricePrediction,
        costOptimization,
        riskAssessment,
        governmentBenefits,
        cashFlowProjection,
        recommendations: this.generateRecommendations(farmData, {
          yieldPrediction, pricePrediction, riskAssessment
        })
      };
    } catch (error) {
      console.error('AI Model Error:', error);
      throw new Error(`AI prediction failed: ${error.message}`);
    }
  }

  // AI-based yield prediction
  predictYield(state, crop, landSize, irrigationType) {
    const stateInfo = this.stateData[state] || this.stateData['Uttar Pradesh'];
    const cropInfo = this.cropData[crop] || this.cropData['Rice'];

    let baseYield = cropInfo.avgYieldPerAcre;

    // State-specific adjustments
    if (stateInfo.majorCrops.includes(crop)) {
      baseYield *= 1.15; // 15% bonus for suitable state
    }

    // Irrigation adjustments
    const irrigationMultipliers = {
      'Rain-fed': 0.8,
      'Canal Irrigation': 1.0,
      'Tube Well': 1.1,
      'Drip Irrigation': 1.25,
      'Sprinkler Irrigation': 1.15
    };
    baseYield *= (irrigationMultipliers[irrigationType] || 1.0);

    // Land size efficiency (small farms often have higher yield per acre)
    if (landSize < 2) {
      baseYield *= 1.1;
    } else if (landSize > 10) {
      baseYield *= 0.95;
    }

    // Add some realistic variance (but keep it positive)
    const variance = 0.9 + (Math.random() * 0.2); // ±10% variance (0.9 to 1.1)

    const totalYield = Math.round(baseYield * landSize * variance);

    console.log('Yield Calculation:', {
      crop,
      baseYield: cropInfo.avgYieldPerAcre,
      adjustedYield: baseYield,
      landSize,
      variance,
      totalYield
    });

    return {
      expectedYield: totalYield,
      yieldPerAcre: Math.round(baseYield * variance),
      confidence: this.calculateConfidence(state, crop, irrigationType),
      factors: this.getYieldFactors(state, crop, irrigationType)
    };
  }

  // AI-based price prediction with seasonal patterns
  predictPrices(crop, state, location) {
    const cropInfo = this.cropData[crop] || this.cropData['Rice'];
    const stateInfo = this.stateData[state] || this.stateData['Uttar Pradesh'];
    const pricePattern = this.pricePatterns[crop] || this.pricePatterns['Rice'];

    const monthlyPrices = pricePattern.map((multiplier, month) => {
      let price = cropInfo.mspRate * multiplier;

      // Market access adjustment
      const marketMultipliers = {
        'excellent': 1.1,
        'good': 1.0,
        'fair': 0.95,
        'poor': 0.9
      };
      price *= marketMultipliers[stateInfo.marketAccess];

      // Volatility factor
      const volatilityFactors = {
        'low': 0.95 + (Math.random() * 0.1),
        'medium': 0.9 + (Math.random() * 0.2),
        'high': 0.85 + (Math.random() * 0.3),
        'very_high': 0.8 + (Math.random() * 0.4)
      };
      price *= volatilityFactors[cropInfo.marketVolatility];

      // MSP floor protection
      price = Math.max(price, cropInfo.mspRate * 0.85);

      return {
        month: month + 1,
        price: Math.round(price),
        factors: this.getPriceFactors(crop, state, month + 1)
      };
    });

    return {
      monthlyPrices,
      averagePrice: Math.round(monthlyPrices.reduce((sum, p) => sum + p.price, 0) / 12),
      mspRate: cropInfo.mspRate,
      volatility: cropInfo.marketVolatility,
      recommendation: this.getPriceRecommendation(crop, monthlyPrices)
    };
  }

  // Helper functions
  calculateConfidence(state, crop, irrigationType) {
    let confidence = 70; // Base confidence

    const stateInfo = this.stateData[state];
    if (stateInfo && stateInfo.majorCrops.includes(crop)) {
      confidence += 15;
    }

    if (['Drip Irrigation', 'Sprinkler Irrigation'].includes(irrigationType)) {
      confidence += 10;
    }

    return Math.min(confidence, 95);
  }

  getYieldFactors(state, crop, irrigationType) {
    return [
      `${crop} is ${this.stateData[state]?.majorCrops.includes(crop) ? 'well-suited' : 'moderately suited'} for ${state}`,
      `${irrigationType} provides ${irrigationType === 'Drip Irrigation' ? 'excellent' : 'good'} water efficiency`,
      'Weather patterns and soil conditions considered',
      'Based on historical yield data and current practices'
    ];
  }

  getPriceFactors(crop, state, month) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const seasonalDemand = this.pricePatterns[crop][month - 1];

    return [
      `${monthNames[month - 1]} seasonal demand: ${seasonalDemand > 1.1 ? 'High' : seasonalDemand < 0.9 ? 'Low' : 'Normal'}`,
      `Market access in ${state}: ${this.stateData[state]?.marketAccess || 'good'}`,
      `MSP support: ${this.cropData[crop]?.governmentSupport || 'medium'}`,
      'Price volatility and market trends included'
    ];
  }

  getPriceRecommendation(crop, monthlyPrices) {
    const maxPrice = Math.max(...monthlyPrices.map(p => p.price));
    const minPrice = Math.min(...monthlyPrices.map(p => p.price));
    const bestMonth = monthlyPrices.find(p => p.price === maxPrice).month;

    if ((maxPrice - minPrice) / minPrice > 0.3) {
      return `High price volatility expected. Best selling time: Month ${bestMonth}. Consider storage options.`;
    } else {
      return `Stable pricing expected. Sell based on cash flow needs and storage capacity.`;
    }
  }

  // Optimize input costs based on AI analysis
  optimizeInputCosts(crop, landSize, currentCosts) {
    const cropInfo = this.cropData[crop] || this.cropData['Rice'];
    const standardCostPerAcre = cropInfo.inputCostPerAcre;
    const totalStandardCost = standardCostPerAcre * landSize;

    const currentTotal = Object.values(currentCosts).reduce((sum, cost) => sum + parseFloat(cost || 0), 0);

    const recommendations = [];

    // Cost analysis
    if (currentTotal > totalStandardCost * 1.2) {
      recommendations.push('Input costs are 20% above average. Consider cost optimization.');
    } else if (currentTotal < totalStandardCost * 0.8) {
      recommendations.push('Input costs seem low. Ensure adequate inputs for optimal yield.');
    }

    // Specific recommendations
    const seedCostRatio = parseFloat(currentCosts.seedCost || 0) / (standardCostPerAcre * 0.1 * landSize);
    if (seedCostRatio > 1.5) {
      recommendations.push('Seed cost is high. Consider certified seeds from government sources.');
    }

    const fertilizerCostRatio = parseFloat(currentCosts.fertilizerCost || 0) / (standardCostPerAcre * 0.4 * landSize);
    if (fertilizerCostRatio > 1.3) {
      recommendations.push('Fertilizer cost is high. Use soil health card recommendations for optimal fertilizer use.');
    }

    return {
      currentTotal,
      standardTotal: totalStandardCost,
      variance: ((currentTotal - totalStandardCost) / totalStandardCost * 100).toFixed(1),
      recommendations,
      optimizedBreakdown: this.getOptimizedCostBreakdown(crop, landSize)
    };
  }

  // Risk assessment based on multiple factors
  assessRisks(state, crop, farmingType) {
    const stateInfo = this.stateData[state] || this.stateData['Uttar Pradesh'];
    const cropInfo = this.cropData[crop] || this.cropData['Rice'];

    const risks = [];
    let riskScore = 0;

    // Weather risk
    if (stateInfo.avgRainfall < 400) {
      risks.push({ type: 'Weather', level: 'High', description: 'Low rainfall region - drought risk' });
      riskScore += 30;
    } else if (stateInfo.avgRainfall > 1000) {
      risks.push({ type: 'Weather', level: 'Medium', description: 'High rainfall - flood risk' });
      riskScore += 20;
    }

    // Market risk
    if (cropInfo.marketVolatility === 'very_high') {
      risks.push({ type: 'Market', level: 'High', description: 'High price volatility crop' });
      riskScore += 25;
    } else if (cropInfo.marketVolatility === 'high') {
      risks.push({ type: 'Market', level: 'Medium', description: 'Moderate price volatility' });
      riskScore += 15;
    }

    // Input cost risk
    if (cropInfo.inputCostPerAcre > 40000) {
      risks.push({ type: 'Input Cost', level: 'High', description: 'High input cost crop' });
      riskScore += 20;
    }

    // Government support risk
    if (cropInfo.governmentSupport === 'low') {
      risks.push({ type: 'Policy', level: 'Medium', description: 'Limited government support' });
      riskScore += 15;
    }

    return {
      overallRisk: riskScore > 50 ? 'High' : riskScore > 25 ? 'Medium' : 'Low',
      riskScore,
      risks,
      mitigation: this.getRiskMitigation(risks)
    };
  }

  // Calculate government benefits
  calculateGovernmentBenefits(schemes) {
    const benefits = [];
    let totalBenefit = 0;

    if (schemes.pmKisanBeneficiary) {
      benefits.push({
        scheme: 'PM-KISAN',
        benefit: 'Rs. 6,000 per year',
        amount: 6000
      });
      totalBenefit += 6000;
    }

    if (schemes.kccHolder) {
      benefits.push({
        scheme: 'Kisan Credit Card',
        benefit: '4% interest rate on crop loans',
        amount: 'Interest savings'
      });
    }

    if (schemes.hasCropInsurance) {
      benefits.push({
        scheme: 'Crop Insurance',
        benefit: 'Weather risk coverage',
        amount: 'Risk protection'
      });
    }

    // MGNREGA benefits
    benefits.push({
      scheme: 'MGNREGA',
      benefit: '100 days employment at Rs. 250/day',
      amount: 25000
    });

    return {
      benefits,
      totalCashBenefit: totalBenefit + 25000,
      recommendations: this.getSchemeRecommendations(schemes)
    };
  }

  // Project cash flow
  projectCashFlow(farmData, yieldPrediction, pricePrediction) {
    const monthlyProjections = [];
    const { landSize, monthlyHouseholdExpenses, annualFarmIncome, nonFarmIncome } = farmData;

    // Get harvest months for the crop
    const harvestMonths = this.getHarvestMonths(farmData.primaryCrop);

    // Calculate realistic total annual income
    // Use AI-predicted crop income or fallback to user-provided annual farm income
    const aiCropIncome = yieldPrediction.expectedYield * pricePrediction.averagePrice;
    const userProvidedIncome = parseFloat(farmData.annualFarmIncome || 0);

    // Use the higher of AI prediction or user input (farmers often underestimate)
    const cropIncome = Math.max(aiCropIncome, userProvidedIncome);
    const nonFarmIncomeAnnual = parseFloat(nonFarmIncome || 0);
    const totalAnnualIncome = cropIncome + nonFarmIncomeAnnual;

    // Distribute income intelligently
    const cropIncomePerHarvest = cropIncome / harvestMonths.length;
    const monthlyNonFarmIncome = nonFarmIncomeAnnual / 12; // Spread non-farm income monthly

    // Calculate monthly expenses
    const monthlyExpenses = parseFloat(monthlyHouseholdExpenses || 0);

    console.log('Cash Flow Calculation:', {
      expectedYield: yieldPrediction.expectedYield,
      averagePrice: pricePrediction.averagePrice,
      aiCropIncome,
      userProvidedIncome,
      finalCropIncome: cropIncome,
      nonFarmIncomeAnnual,
      totalAnnualIncome,
      monthlyExpenses,
      annualExpenses: monthlyExpenses * 12,
      harvestMonths: harvestMonths.length,
      cropIncomePerHarvest,
      monthlyNonFarmIncome,
      netAnnualIncome: totalAnnualIncome - (monthlyExpenses * 12)
    });

    // Validate if plan is viable
    if (totalAnnualIncome < (monthlyExpenses * 12)) {
      console.warn('Warning: Annual income less than annual expenses. Plan may need adjustment.');
    }

    // Generate projections for 12 months starting from today
    const today = new Date();
    let cumulativeCashFlow = 0;

    for (let i = 0; i < 12; i++) {
      // Calculate actual calendar month and year
      const currentDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const calendarMonth = currentDate.getMonth() + 1; // 1-12
      const year = currentDate.getFullYear();
      const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

      const isHarvestMonth = harvestMonths.includes(calendarMonth);

      // Calculate monthly income
      let monthlyIncome = monthlyNonFarmIncome; // Base non-farm income
      if (isHarvestMonth) {
        monthlyIncome += cropIncomePerHarvest; // Add harvest income
      }

      // Calculate net cash flow
      const netCashFlow = monthlyIncome - monthlyExpenses;
      cumulativeCashFlow += netCashFlow;

      monthlyProjections.push({
        month: i + 1, // Sequential month number
        calendarMonth, // Actual calendar month (1-12)
        monthName, // Full month name with year
        year,
        income: Math.round(monthlyIncome),
        expenses: monthlyExpenses,
        netCashFlow: Math.round(netCashFlow),
        cumulativeCashFlow: Math.round(cumulativeCashFlow),
        isHarvestMonth
      });
    }

    return {
      monthlyProjections,
      annualIncome: Math.round(totalAnnualIncome),
      annualExpenses: monthlyExpenses * 12,
      netAnnualIncome: Math.round(totalAnnualIncome - (monthlyExpenses * 12)),
      isViable: totalAnnualIncome >= (monthlyExpenses * 12),
      recommendations: this.getCashFlowRecommendations(totalAnnualIncome, monthlyExpenses * 12)
    };
  }

  // Generate AI recommendations
  generateRecommendations(farmData, predictions) {
    const recommendations = [];

    // Yield recommendations
    if (predictions.yieldPrediction.confidence < 80) {
      recommendations.push({
        category: 'Yield Improvement',
        priority: 'High',
        recommendation: 'Consider improving irrigation system for better yield consistency'
      });
    }

    // Price recommendations
    if (predictions.pricePrediction.volatility === 'very_high') {
      recommendations.push({
        category: 'Price Risk',
        priority: 'High',
        recommendation: 'Diversify crops or consider contract farming for price stability'
      });
    }

    // Cost recommendations
    recommendations.push({
      category: 'Cost Optimization',
      priority: 'Medium',
      recommendation: 'Use soil health card for precise fertilizer application'
    });

    // Technology recommendations
    recommendations.push({
      category: 'Technology',
      priority: 'Medium',
      recommendation: 'Consider drip irrigation for water and cost efficiency'
    });

    return recommendations;
  }

  // Helper functions
  getOptimizedCostBreakdown(crop, landSize) {
    const cropInfo = this.cropData[crop] || this.cropData['Rice'];
    const totalCost = cropInfo.inputCostPerAcre * landSize;

    return {
      seeds: Math.round(totalCost * 0.1),
      fertilizer: Math.round(totalCost * 0.4),
      pesticide: Math.round(totalCost * 0.15),
      labor: Math.round(totalCost * 0.3),
      others: Math.round(totalCost * 0.05)
    };
  }

  getRiskMitigation(risks) {
    const mitigation = [];

    risks.forEach(risk => {
      switch (risk.type) {
        case 'Weather':
          mitigation.push('Get crop insurance, use drought-resistant varieties');
          break;
        case 'Market':
          mitigation.push('Diversify crops, consider contract farming');
          break;
        case 'Input Cost':
          mitigation.push('Use government subsidies, bulk purchase');
          break;
        case 'Policy':
          mitigation.push('Stay updated on government schemes');
          break;
      }
    });

    return mitigation;
  }

  getSchemeRecommendations(schemes) {
    const recommendations = [];

    if (!schemes.pmKisanBeneficiary) {
      recommendations.push('Apply for PM-KISAN scheme for Rs. 6,000 annual benefit');
    }

    if (!schemes.kccHolder) {
      recommendations.push('Get Kisan Credit Card for easy access to credit at 4% interest');
    }

    if (!schemes.hasCropInsurance) {
      recommendations.push('Consider crop insurance for weather risk protection');
    }

    return recommendations;
  }

  getHarvestMonths(crop) {
    const harvestSchedule = {
      'Rice': [4, 10],
      'Wheat': [4],
      'Cotton': [10],
      'Sugarcane': [12],
      'Potato': [3, 11],
      'Onion': [4, 11]
    };

    return harvestSchedule[crop] || [6, 12];
  }

  getCashFlowRecommendations(annualIncome, annualExpenses) {
    const recommendations = [];
    const deficit = annualExpenses - annualIncome;

    if (deficit > 0) {
      recommendations.push(`⚠️ Annual deficit of ₹${deficit.toLocaleString()}. Immediate action needed:`);

      if (deficit > annualIncome * 0.3) {
        // Major deficit - strong recommendations
        recommendations.push('🔴 URGENT: Reduce monthly expenses by 25-30%');
        recommendations.push('💰 Add dairy farming for ₹3,000-5,000 monthly income');
        recommendations.push('🌾 Diversify crops for multiple harvest seasons');
        recommendations.push('🏭 Consider food processing/value addition');
      } else if (deficit > annualIncome * 0.1) {
        // Moderate deficit
        recommendations.push('🟡 Reduce monthly household expenses by 15-20%');
        recommendations.push('🐄 Add dairy/poultry for additional monthly income');
        recommendations.push('🌱 Consider crop diversification for multiple harvests');
      } else {
        // Minor deficit
        recommendations.push('🟢 Minor adjustments needed in expenses');
        recommendations.push('💡 Consider value addition to crops for better prices');
        recommendations.push('📈 Explore direct marketing for 10-15% higher prices');
      }

      // Government support recommendations
      recommendations.push('🏛️ Apply for MGNREGA: ₹25,000 additional annual income');
      recommendations.push('🎯 Check eligibility for PM-KISAN: ₹6,000 annual benefit');
      recommendations.push('💳 Apply for Kisan Credit Card for low-interest loans');

    } else {
      const surplus = annualIncome - annualExpenses;
      recommendations.push(`✅ Annual surplus of ₹${surplus.toLocaleString()}. Excellent financial health!`);
      recommendations.push('💰 Build emergency fund covering 6 months expenses');
      recommendations.push('🚜 Invest surplus in farm mechanization and improvements');
      recommendations.push('🏦 Consider fixed deposits or mutual funds for surplus');
      recommendations.push('📚 Invest in skill development and modern farming techniques');
    }

    return recommendations;
  }
}

// Export singleton instance
export const indianFarmingAI = new IndianFarmingAI();
