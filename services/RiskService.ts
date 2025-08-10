import { database } from '../firebase/config';
import {
  Risk,
  RiskCategory,
  RiskAlert,
  RiskAssessment,
  RiskImpact,
  RiskAlertType
} from '../models/Risk';
import { Product, ProductLocation } from '../models/Product';
import { UserProfile } from '../context/AuthContext';
import { WeatherForecast } from '../models/Forecast';

// Simple ID generator function
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

// Create a simple object with functions instead of a class
const RiskService = {
  // Get user's products (crops) from Firebase
  getUserProducts: async (userId: string): Promise<Product[]> => {
    try {
      console.log(`Getting products for user: ${userId}`);
      const productsRef = database().ref('products');
      const snapshot = await productsRef
        .orderByChild('sellerId')
        .equalTo(userId)
        .once('value');

      if (!snapshot.exists()) {
        console.log('No products found for user');
        return [];
      }

      const products: Product[] = [];
      snapshot.forEach((childSnapshot: any) => {
        const product = childSnapshot.val() as Product;
        // Only include produce (crops)
        if (product.category === 'produce') {
          products.push(product);
        }
        return false; // Continue iteration
      });

      console.log(`Found ${products.length} crop products for user`);
      return products;
    } catch (error) {
      console.error('Error fetching user products:', error);
      return []; // Return empty array on error
    }
  },

  // Generate default weather forecast data
  generateDefaultWeatherForecast: (days: number): WeatherForecast[] => {
    console.log(`Generating default weather forecast for ${days} days`);
    const forecast: WeatherForecast[] = [];

    const currentDate = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      forecast.push({
        date: date.getTime(),
        temperature: {
          min: 20 + Math.random() * 5,
          max: 30 + Math.random() * 5,
          avg: 25 + Math.random() * 5,
        },
        humidity: 60 + Math.random() * 20,
        precipitation: {
          probability: Math.random() * 0.7,
          amount: Math.random() * 10,
        },
        windSpeed: 5 + Math.random() * 10,
        condition: ['sunny', 'partly_cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)] as any,
        uvIndex: Math.floor(1 + Math.random() * 10),
        soilMoisture: 40 + Math.random() * 30,
      });
    }

    return forecast;
  },

  // Generate a risk assessment for a user
  generateRiskAssessment: async (userId: string, userProfile: UserProfile): Promise<RiskAssessment> => {
    try {
      console.log(`Generating risk assessment for user: ${userId}`);

      // Get user's location
      const userLocation = userProfile.location;
      if (!userLocation) {
        throw new Error('User location not available');
      }

      // Get user's products (crops)
      let userProducts = await RiskService.getUserProducts(userId);

      // If user has no products, create a default product for demonstration
      if (userProducts.length === 0) {
        console.log('No user products found, using default crops for risk assessment');
        userProducts = [
          {
            id: generateId(),
            name: 'Rice',
            description: 'Rice crop',
            category: 'produce',
            subcategory: 'grains',
            price: 40,
            currency: 'INR',
            stock: 100,
            images: [],
            sellerId: userId,
            sellerName: userProfile.displayName || 'Farmer',
            location: userLocation,
            ratings: [],
            averageRating: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true,
            isVerified: false,
            tags: ['rice', 'grain']
          },
          {
            id: generateId(),
            name: 'Wheat',
            description: 'Wheat crop',
            category: 'produce',
            subcategory: 'grains',
            price: 30,
            currency: 'INR',
            stock: 100,
            images: [],
            sellerId: userId,
            sellerName: userProfile.displayName || 'Farmer',
            location: userLocation,
            ratings: [],
            averageRating: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true,
            isVerified: false,
            tags: ['wheat', 'grain']
          }
        ];
      }

      // Generate weather forecast data
      const weatherForecast = RiskService.generateDefaultWeatherForecast(14);

      // Generate risk categories
      const weatherRisks = RiskService.generateWeatherRisks(weatherForecast, userLocation);
      const marketRisks = RiskService.generateMarketRisks(userProducts, userLocation);
      const pestDiseaseRisks = RiskService.generatePestDiseaseRisks(userProducts, weatherForecast, userLocation);

      // Calculate overall risk score (weighted average of category scores)
      const categoryScores = [
        { score: weatherRisks.score, weight: 0.4 },
        { score: marketRisks.score, weight: 0.3 },
        { score: pestDiseaseRisks.score, weight: 0.3 }
      ];

      const overallRiskScore = Math.round(
        categoryScores.reduce((sum, item) => sum + item.score * item.weight, 0)
      );

      // Generate alerts
      const alerts = RiskService.generateAlerts(
        weatherForecast,
        userProducts,
        [weatherRisks, marketRisks, pestDiseaseRisks]
      );

      // Create risk assessment
      const riskAssessment: RiskAssessment = {
        id: generateId(),
        userId,
        overallRiskScore,
        riskCategories: [weatherRisks, marketRisks, pestDiseaseRisks],
        alerts,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location: userLocation
      };

      console.log('Risk assessment generated successfully');
      return riskAssessment;
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      throw error;
    }
  },

  // Generate weather-related risks
  generateWeatherRisks: (
    weatherForecast: WeatherForecast[],
    location: ProductLocation
  ): RiskCategory => {
    console.log('Generating weather risks');

    const risks: Risk[] = [];
    let categoryScore = 0;

    // Check for drought conditions
    const rainDays = weatherForecast.filter(day =>
      day.precipitation.probability > 0.4 && day.precipitation.amount > 1
    );

    if (rainDays.length < 3 && weatherForecast.length >= 7) {
      const droughtRisk: Risk = {
        id: generateId(),
        name: 'Drought',
        probability: 0.7,
        impact: 'high',
        timeframe: 'next 2 weeks',
        description: 'Rainfall is predicted to be below average for the next two weeks.',
        mitigationSteps: [
          'Install drip irrigation system',
          'Plant drought-resistant crop varieties',
          'Create water harvesting structures',
          'Apply mulch to reduce evaporation',
        ],
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(droughtRisk);
      categoryScore += 75;
    }

    // Check for heat wave
    const hotDays = weatherForecast.filter(day => day.temperature.max > 35);
    if (hotDays.length >= 3) {
      const heatwaveRisk: Risk = {
        id: generateId(),
        name: 'Heat Wave',
        probability: 0.6,
        impact: 'medium',
        timeframe: 'next week',
        description: `Temperatures may exceed 35°C for ${hotDays.length} days in the next two weeks.`,
        mitigationSteps: [
          'Install shade nets for sensitive crops',
          'Adjust irrigation schedule to early morning/evening',
          'Apply white kaolin clay to reduce heat stress',
        ],
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(heatwaveRisk);
      categoryScore += 60;
    }

    // If no specific risks identified, add a general weather risk
    if (risks.length === 0) {
      const generalWeatherRisk: Risk = {
        id: generateId(),
        name: 'Weather Variability',
        probability: 0.3,
        impact: 'low',
        timeframe: 'ongoing',
        description: 'Normal weather variations may affect crop growth and development.',
        mitigationSteps: [
          'Monitor weather forecasts regularly',
          'Maintain flexible irrigation schedule',
          'Have contingency plans for unexpected weather events',
        ],
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(generalWeatherRisk);
      categoryScore = 30;
    } else {
      // Calculate average score if multiple risks exist
      categoryScore = Math.min(100, Math.round(categoryScore / risks.length));
    }

    return {
      id: 'weather',
      name: 'Weather Risks',
      score: categoryScore,
      description: 'Risks related to upcoming weather patterns that may affect your crops.',
      risks,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  },

  // Generate market-related risks
  generateMarketRisks: (
    userProducts: Product[],
    location: ProductLocation
  ): RiskCategory => {
    console.log('Generating market risks');

    const risks: Risk[] = [];
    let categoryScore = 0;

    // If user has products, generate market risks for each product
    if (userProducts.length > 0) {
      for (const product of userProducts) {
        // Price drop risk (simulated)
        if (Math.random() > 0.5) {
          const priceDrop: Risk = {
            id: generateId(),
            name: `${product.name} Price Drop`,
            probability: 0.6,
            impact: 'high',
            timeframe: 'next month',
            description: `Market analysis indicates a potential ${Math.floor(10 + Math.random() * 20)}% drop in ${product.name} prices due to market conditions.`,
            mitigationSteps: [
              'Consider forward contracts with buyers',
              'Explore crop storage options to sell later',
              'Diversify crop portfolio',
              'Explore value-added processing options',
            ],
            category: 'market',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(priceDrop);
          categoryScore += 70;
        } else {
          // Price increase opportunity (not a risk, but an opportunity)
          const priceIncrease: Risk = {
            id: generateId(),
            name: `${product.name} Price Increase`,
            probability: 0.6,
            impact: 'low', // Low risk, high opportunity
            timeframe: 'next month',
            description: `Market analysis indicates a potential ${Math.floor(5 + Math.random() * 15)}% increase in ${product.name} prices. Consider this an opportunity.`,
            mitigationSteps: [
              'Plan for increased production next season',
              'Consider delaying sales to benefit from higher prices',
              'Invest in quality improvement to maximize returns',
            ],
            category: 'market',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(priceIncrease);
          categoryScore += 30; // Lower score as it's an opportunity
        }
      }
    }

    // If no specific risks identified, add a general market risk
    if (risks.length === 0) {
      const generalMarketRisk: Risk = {
        id: generateId(),
        name: 'Market Volatility',
        probability: 0.4,
        impact: 'medium',
        timeframe: 'ongoing',
        description: 'Agricultural markets are subject to price fluctuations due to supply and demand factors.',
        mitigationSteps: [
          'Diversify crop portfolio to spread risk',
          'Establish relationships with multiple buyers',
          'Stay informed about market trends',
          'Consider crop insurance or forward contracts',
        ],
        category: 'market',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(generalMarketRisk);
      categoryScore = 50;
    } else {
      // Calculate average score if multiple risks exist
      categoryScore = Math.min(100, Math.round(categoryScore / risks.length));
    }

    return {
      id: 'market',
      name: 'Market Risks',
      score: categoryScore,
      description: 'Price volatility and market factors that may affect your expected returns.',
      risks,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  },

  // Generate pest and disease risks
  generatePestDiseaseRisks: (
    userProducts: Product[],
    weatherForecast: WeatherForecast[],
    location: ProductLocation
  ): RiskCategory => {
    console.log('Generating pest and disease risks');

    const risks: Risk[] = [];
    let categoryScore = 0;

    // Calculate average weather conditions
    const avgTemperature = weatherForecast.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherForecast.length;
    const avgHumidity = weatherForecast.reduce((sum, day) => sum + day.humidity, 0) / weatherForecast.length;
    const isWet = weatherForecast.filter(day => day.precipitation.amount > 5).length > 3;

    // If user has products, generate pest/disease risks for each product
    if (userProducts.length > 0) {
      for (const product of userProducts) {
        // Generate generic risks based on weather conditions
        if (avgTemperature > 25 && avgHumidity > 70) {
          // Fungal disease risk
          const fungalRisk: Risk = {
            id: generateId(),
            name: 'Fungal Disease',
            probability: 0.5,
            impact: 'medium',
            timeframe: 'next few weeks',
            description: `High temperature and humidity conditions are favorable for fungal diseases in ${product.name}.`,
            mitigationSteps: [
              'Apply preventive fungicide treatment',
              'Ensure proper plant spacing for air circulation',
              'Implement drip irrigation to keep foliage dry',
              'Remove infected plant material promptly',
            ],
            category: 'pest',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(fungalRisk);
          categoryScore += 60;
        }

        if (avgTemperature > 28) {
          // Insect infestation risk
          const insectRisk: Risk = {
            id: generateId(),
            name: 'Insect Infestation',
            probability: 0.4,
            impact: 'medium',
            timeframe: 'current season',
            description: `Warm conditions increase the risk of insect pests in ${product.name} crops.`,
            mitigationSteps: [
              'Implement regular field monitoring',
              'Use pheromone traps for early detection',
              'Consider biological control methods',
              'Apply targeted insecticides if necessary',
            ],
            category: 'pest',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(insectRisk);
          categoryScore += 55;
        }
      }
    }

    // If no specific risks identified, add a general pest/disease risk
    if (risks.length === 0) {
      const generalPestRisk: Risk = {
        id: generateId(),
        name: 'General Pest & Disease',
        probability: 0.3,
        impact: 'medium',
        timeframe: 'ongoing',
        description: 'All crops are susceptible to some level of pest and disease pressure.',
        mitigationSteps: [
          'Implement regular crop monitoring',
          'Practice crop rotation',
          'Maintain field hygiene',
          'Use resistant varieties when available',
        ],
        category: 'pest',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(generalPestRisk);
      categoryScore = 40;
    } else {
      // Calculate average score if multiple risks exist
      categoryScore = Math.min(100, Math.round(categoryScore / risks.length));
    }

    return {
      id: 'pest',
      name: 'Pest & Disease Risks',
      score: categoryScore,
      description: 'Potential pest and disease threats that may affect your crops.',
      risks,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  },

  // Generate alerts based on high-priority risks
  generateAlerts: (
    weatherForecast: WeatherForecast[],
    userProducts: Product[],
    riskCategories: RiskCategory[]
  ): RiskAlert[] => {
    console.log('Generating risk alerts');

    const alerts: RiskAlert[] = [];

    // Add alerts for high-impact, high-probability risks
    for (const category of riskCategories) {
      for (const risk of category.risks) {
        if (risk.impact === 'high' && risk.probability > 0.5) {
          alerts.push({
            id: generateId(),
            type: 'warning',
            message: `${risk.name} risk detected: ${risk.description}`,
            createdAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            riskId: risk.id,
            cropId: risk.cropId,
            location: risk.location
          });
        }
      }
    }

    // Add weather alerts
    const heavyRainDays = weatherForecast.filter(day =>
      day.precipitation.probability > 0.7 && day.precipitation.amount > 30
    );

    if (heavyRainDays.length > 0) {
      alerts.push({
        id: generateId(),
        type: 'warning',
        message: `Heavy rainfall expected in the next few days. Take precautions to prevent waterlogging.`,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      });
    }

    // Add information about government schemes (simulated)
    alerts.push({
      id: generateId(),
      type: 'info',
      message: 'New government crop insurance scheme available. Application deadline in 2 weeks.',
      createdAt: Date.now(),
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    });

    return alerts;
  }
};

export default RiskService;
