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
      const products: Product[] = [];

      // Get regular products
      const productsRef = database().ref('products');
      const snapshot = await productsRef
        .orderByChild('sellerId')
        .equalTo(userId)
        .once('value');

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: any) => {
          const product = childSnapshot.val() as Product;
          // Only include produce (crops)
          if (product.category === 'produce') {
            products.push(product);
          }
          return false; // Continue iteration
        });
      }

      // Get prelisted products
      const prelistedProductsRef = database().ref('prelisted_products');
      const prelistedSnapshot = await prelistedProductsRef
        .orderByChild('sellerId')
        .equalTo(userId)
        .once('value');

      if (prelistedSnapshot.exists()) {
        prelistedSnapshot.forEach((childSnapshot: any) => {
          const product = childSnapshot.val() as Product;
          // Only include produce (crops)
          if (product.category === 'produce') {
            product.isPrelisted = true; // Mark as prelisted
            products.push(product);
          }
          return false; // Continue iteration
        });
      }

      console.log(`Found ${products.length} crop products for user (regular and prelisted)`);
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

      // Log user information for debugging
      console.log('Generating risk assessment for user:', userProfile.uid);
      console.log('User location:', userProfile.location);
      console.log('User products:', userProfile.products ? userProfile.products.length : 0);

      // Get user's products (crops) - both regular and prelisted
      let userProducts = await RiskService.getUserProducts(userId);

      // If user has no products, create default products based on location
      if (userProducts.length === 0) {
        console.log('No user products found, using default crops for risk assessment');

        // Determine appropriate default crops based on location
        const defaultCrops: Array<{name: string, subcategory: string}> = [];

        // Determine climate zone based on latitude (very simplified)
        const latitude = Math.abs(userLocation.latitude);
        const isNorthernHemisphere = userLocation.latitude >= 0;
        const currentMonth = new Date().getMonth();

        // Tropical zone (between 23.5°N and 23.5°S)
        if (latitude <= 23.5) {
          defaultCrops.push({name: 'Rice', subcategory: 'grains'});
          defaultCrops.push({name: 'Sugarcane', subcategory: 'produce'});
          defaultCrops.push({name: 'Mango', subcategory: 'fruits'});
        }
        // Temperate zone
        else if (latitude <= 40) {
          defaultCrops.push({name: 'Wheat', subcategory: 'grains'});
          defaultCrops.push({name: 'Potato', subcategory: 'vegetables'});
          defaultCrops.push({name: 'Tomato', subcategory: 'vegetables'});
        }
        // Colder regions
        else {
          defaultCrops.push({name: 'Barley', subcategory: 'grains'});
          defaultCrops.push({name: 'Potato', subcategory: 'vegetables'});
          defaultCrops.push({name: 'Oats', subcategory: 'grains'});
        }

        // Create default product objects
        userProducts = defaultCrops.map(crop => ({
          id: generateId(),
          name: crop.name,
          description: `${crop.name} crop`,
          category: 'produce',
          subcategory: crop.subcategory as any,
          price: 30 + Math.floor(Math.random() * 20),
          currency: 'INR',
          stock: 50 + Math.floor(Math.random() * 100),
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
          tags: [crop.name.toLowerCase(), crop.subcategory]
        }));
      }

      // If user has products, log them for analysis
      if (userProducts.length > 0) {
        console.log('Getting specific risks for user products');

        // For each product, log the product name
        userProducts.forEach(product => {
          console.log(`Analyzing risks for ${product.name}`);
          // We'll use the product-specific risks in the detailed view
        });
      }

      // Generate weather forecast data
      const weatherForecast = RiskService.generateDefaultWeatherForecast(14);

      // Generate risk categories
      const weatherRisks = RiskService.generateWeatherRisks(weatherForecast, userLocation);
      const marketRisks = RiskService.generateMarketRisks(userProducts, userLocation);
      const pestDiseaseRisks = RiskService.generatePestDiseaseRisks(userProducts, weatherForecast, userLocation);

      // Calculate overall risk score (weighted average of category scores)
      // Adjust weights based on user's farm details if available
      let weatherWeight = 0.4;
      let marketWeight = 0.3;
      let pestWeight = 0.3;

      // If user has farm details, adjust weights based on farming method
      if (userProfile.farmDetails?.farmingMethod) {
        if (userProfile.farmDetails.farmingMethod === 'organic') {
          // Organic farming is more susceptible to pest/disease but less dependent on market fluctuations
          pestWeight = 0.4;
          weatherWeight = 0.4;
          marketWeight = 0.2;
        } else if (userProfile.farmDetails.farmingMethod === 'natural') {
          // Natural farming is highly susceptible to weather and pests
          weatherWeight = 0.45;
          pestWeight = 0.35;
          marketWeight = 0.2;
        }
      }

      const categoryScores = [
        { score: weatherRisks.score, weight: weatherWeight },
        { score: marketRisks.score, weight: marketWeight },
        { score: pestDiseaseRisks.score, weight: pestWeight }
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

      console.log('Risk assessment generated with',
        riskAssessment.riskCategories.length, 'categories and',
        riskAssessment.alerts.length, 'alerts');
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

    // Determine season based on location and current date
    const currentDate = new Date();
    const month = currentDate.getMonth(); // 0-11

    // Determine if we're in Northern or Southern hemisphere
    const isNorthernHemisphere = location.latitude >= 0;

    // Season determination (adjusted for hemisphere)
    let season: 'winter' | 'spring' | 'summer' | 'fall';
    if (isNorthernHemisphere) {
      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'fall';
      else season = 'winter';
    } else {
      if (month >= 2 && month <= 4) season = 'fall';
      else if (month >= 5 && month <= 7) season = 'winter';
      else if (month >= 8 && month <= 10) season = 'spring';
      else season = 'summer';
    }

    // Check for drought conditions
    const rainDays = weatherForecast.filter(day =>
      day.precipitation.probability > 0.4 && day.precipitation.amount > 1
    );

    if (rainDays.length < 3 && weatherForecast.length >= 7) {
      // Adjust drought risk based on location
      const isAridRegion = Math.abs(location.latitude) >= 15 && Math.abs(location.latitude) <= 35;
      const droughtProbability = isAridRegion ? 0.8 : 0.6;
      const droughtImpact: RiskImpact = isAridRegion ? 'high' : 'medium';

      const droughtRisk: Risk = {
        id: generateId(),
        name: 'Drought',
        probability: droughtProbability,
        impact: droughtImpact,
        timeframe: 'next 2 weeks',
        description: `Rainfall is predicted to be below average for the next two weeks. ${isAridRegion ? 'Your location is in an arid region, increasing the severity of drought impact.' : ''}`,
        mitigationSteps: [
          'Install drip irrigation system',
          'Plant drought-resistant crop varieties',
          'Create water harvesting structures',
          'Apply mulch to reduce evaporation',
          isAridRegion ? 'Consider deep soil moisture conservation techniques' : '',
        ].filter(step => step !== ''),
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(droughtRisk);
      categoryScore += isAridRegion ? 80 : 65;
    }

    // Check for heat wave
    const hotDays = weatherForecast.filter(day => day.temperature.max > 35);
    if (hotDays.length >= 3) {
      // Adjust heat wave risk based on location
      const isTropicalRegion = Math.abs(location.latitude) <= 23.5;
      const heatwaveProbability = isTropicalRegion ? 0.7 : 0.5;
      const heatwaveImpact: RiskImpact = isTropicalRegion ? 'high' : 'medium';

      const heatwaveRisk: Risk = {
        id: generateId(),
        name: 'Heat Wave',
        probability: heatwaveProbability,
        impact: heatwaveImpact,
        timeframe: 'next week',
        description: `Temperatures may exceed 35°C for ${hotDays.length} days in the next two weeks. ${isTropicalRegion ? 'Your tropical location increases the risk of heat stress on crops.' : ''}`,
        mitigationSteps: [
          'Install shade nets for sensitive crops',
          'Adjust irrigation schedule to early morning/evening',
          'Apply white kaolin clay to reduce heat stress',
          isTropicalRegion ? 'Consider temporary shade structures during peak heat' : '',
          'Ensure adequate hydration for field workers',
        ].filter(step => step !== ''),
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(heatwaveRisk);
      categoryScore += isTropicalRegion ? 75 : 60;
    }

    // Check for flooding risk
    const heavyRainDays = weatherForecast.filter(day =>
      day.precipitation.probability > 0.6 && day.precipitation.amount > 20
    );

    if (heavyRainDays.length >= 2) {
      // Adjust flooding risk based on location
      const isLowLying = location.latitude < 10 && location.latitude > -10; // Approximation for low-lying areas
      const floodProbability = isLowLying ? 0.7 : 0.5;
      const floodImpact: RiskImpact = isLowLying ? 'high' : 'medium';

      const floodRisk: Risk = {
        id: generateId(),
        name: 'Flooding',
        probability: floodProbability,
        impact: floodImpact,
        timeframe: 'next week',
        description: `Heavy rainfall expected with ${heavyRainDays.length} days of significant precipitation. ${isLowLying ? 'Your location in a low-lying area increases flooding risk.' : ''}`,
        mitigationSteps: [
          'Create drainage channels in fields',
          'Elevate seedbeds where possible',
          'Have pumps ready to remove excess water',
          'Consider flood-resistant crop varieties',
          isLowLying ? 'Prepare emergency field drainage systems' : '',
        ].filter(step => step !== ''),
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(floodRisk);
      categoryScore += isLowLying ? 80 : 65;
    }

    // Season-specific risks
    if (season === 'winter' && isNorthernHemisphere && location.latitude > 30) {
      // Frost risk for northern regions in winter
      const frostRisk: Risk = {
        id: generateId(),
        name: 'Frost Damage',
        probability: 0.6,
        impact: 'medium',
        timeframe: 'current season',
        description: 'Winter conditions in your northern location increase the risk of frost damage to sensitive crops.',
        mitigationSteps: [
          'Use frost covers for sensitive crops',
          'Install wind machines or heaters in orchards',
          'Apply anti-frost sprays where appropriate',
          'Irrigate soil before expected frost events',
          'Choose frost-resistant varieties for future plantings',
        ],
        category: 'weather',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        location
      };
      risks.push(frostRisk);
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
        description: `Normal weather variations may affect crop growth and development during the current ${season} season.`,
        mitigationSteps: [
          'Monitor weather forecasts regularly',
          'Maintain flexible irrigation schedule',
          'Have contingency plans for unexpected weather events',
          season === 'summer' ? 'Ensure adequate water supply' : '',
          season === 'winter' ? 'Be prepared for potential frost events' : '',
        ].filter(step => step !== ''),
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

    // Get current month for seasonal market analysis
    const currentMonth = new Date().getMonth();

    // Determine harvest seasons for common crops
    const isRiceHarvestSeason = currentMonth >= 9 && currentMonth <= 11; // Oct-Dec
    const isWheatHarvestSeason = currentMonth >= 2 && currentMonth <= 4; // Mar-May
    const isPotatoHarvestSeason = currentMonth >= 0 && currentMonth <= 2; // Jan-Mar
    const isTomatoHarvestSeason = currentMonth >= 3 && currentMonth <= 8; // Apr-Sep
    const isCottonHarvestSeason = currentMonth >= 9 && currentMonth <= 11; // Oct-Dec
    const isMangoHarvestSeason = currentMonth >= 3 && currentMonth <= 6; // Apr-Jul
    const isSugarcaneCrushingSeason = currentMonth >= 10 || currentMonth <= 2; // Nov-Mar

    // If user has products, generate market risks for each product
    if (userProducts.length > 0) {
      for (const product of userProducts) {
        const cropName = product.name.toLowerCase();
        let priceDropRisk = false;
        let priceDropProbability = 0.6;
        let priceDropImpact: RiskImpact = 'medium';
        let priceDropDescription = '';
        let priceDropPercentage = Math.floor(10 + Math.random() * 20);

        // Analyze specific crops based on current season and market conditions
        if (cropName.includes('rice')) {
          if (isRiceHarvestSeason) {
            // During harvest season, prices typically drop due to increased supply
            priceDropRisk = true;
            priceDropProbability = 0.8;
            priceDropImpact = 'high';
            priceDropDescription = `Harvest season for rice typically leads to price drops due to increased supply. Expect a ${priceDropPercentage}% price reduction in the coming weeks.`;
          } else if (currentMonth >= 5 && currentMonth <= 7) { // Jun-Aug
            // Off-season, prices may increase
            priceDropRisk = false;
            priceDropDescription = `Off-season for rice may lead to price increases of ${Math.floor(5 + Math.random() * 15)}% due to limited supply.`;
          }
        } else if (cropName.includes('wheat')) {
          if (isWheatHarvestSeason) {
            priceDropRisk = true;
            priceDropProbability = 0.7;
            priceDropImpact = 'medium';
            priceDropDescription = `Wheat harvest season typically leads to price drops. Expect a ${priceDropPercentage}% price reduction in the coming weeks.`;
          } else if (currentMonth >= 8 && currentMonth <= 10) { // Sep-Nov
            priceDropRisk = false;
            priceDropDescription = `Wheat prices typically rise during this period before the next planting season.`;
          }
        } else if (cropName.includes('potato')) {
          if (isPotatoHarvestSeason) {
            priceDropRisk = true;
            priceDropProbability = 0.8;
            priceDropImpact = 'high';
            priceDropDescription = `Potato harvest season leads to significant price drops. Consider cold storage options to sell later at higher prices.`;
          } else if (currentMonth >= 6 && currentMonth <= 8) { // Jul-Sep
            priceDropRisk = false;
            priceDropDescription = `Potato prices typically rise during this off-season period.`;
          }
        } else if (cropName.includes('tomato')) {
          if (isTomatoHarvestSeason) {
            priceDropRisk = true;
            priceDropProbability = 0.7;
            priceDropImpact = 'high';
            priceDropDescription = `Tomato prices are volatile during peak production season. Current market trends suggest a ${priceDropPercentage}% price drop.`;
          }
        } else if (cropName.includes('mango')) {
          if (isMangoHarvestSeason) {
            priceDropRisk = true;
            priceDropProbability = 0.7;
            priceDropImpact = 'medium';
            priceDropDescription = `Mango prices typically drop during peak harvest season. Consider value-added processing or export markets.`;
          } else {
            priceDropRisk = false;
            priceDropDescription = `Off-season for mangoes may present opportunities for premium pricing for any stored or late-variety fruits.`;
          }
        } else if (cropName.includes('sugarcane')) {
          if (isSugarcaneCrushingSeason) {
            priceDropRisk = true;
            priceDropProbability = 0.6;
            priceDropImpact = 'medium';
            priceDropDescription = `During crushing season, sugarcane prices may face downward pressure due to high supply. Consider forward contracts with sugar mills.`;
          }
        } else {
          // Generic crop price analysis
          priceDropRisk = Math.random() > 0.5;
          if (priceDropRisk) {
            priceDropDescription = `Market analysis indicates a potential ${priceDropPercentage}% drop in ${product.name} prices due to market conditions.`;
          } else {
            priceDropDescription = `Market analysis indicates a potential ${Math.floor(5 + Math.random() * 15)}% increase in ${product.name} prices. Consider this an opportunity.`;
          }
        }

        // Create the appropriate risk based on analysis
        if (priceDropRisk) {
          const priceDrop: Risk = {
            id: generateId(),
            name: `${product.name} Price Drop`,
            probability: priceDropProbability,
            impact: priceDropImpact,
            timeframe: 'next month',
            description: priceDropDescription,
            mitigationSteps: [
              'Consider forward contracts with buyers',
              'Explore crop storage options to sell later',
              'Diversify crop portfolio',
              'Explore value-added processing options',
              product.category === 'produce' ? 'Consider direct marketing to consumers for better margins' : '',
            ].filter(step => step !== ''),
            category: 'market',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(priceDrop);
          categoryScore += priceDropImpact === 'high' ? 75 : 60;
        } else {
          // Price increase opportunity (not a risk, but an opportunity)
          const priceIncrease: Risk = {
            id: generateId(),
            name: `${product.name} Price Increase`,
            probability: 0.6,
            impact: 'low', // Low risk, high opportunity
            timeframe: 'next month',
            description: priceDropDescription,
            mitigationSteps: [
              'Plan for increased production next season',
              'Consider delaying sales to benefit from higher prices',
              'Invest in quality improvement to maximize returns',
              'Explore premium market segments for higher value',
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

        // Add supply chain risk for perishable products
        if (product.category === 'produce' &&
            (cropName.includes('tomato') || cropName.includes('vegetable') ||
             cropName.includes('fruit') || cropName.includes('leafy'))) {
          const supplyChainRisk: Risk = {
            id: generateId(),
            name: 'Supply Chain Disruption',
            probability: 0.4,
            impact: 'high',
            timeframe: 'ongoing',
            description: `Perishable products like ${product.name} face significant supply chain risks including transportation delays and cold storage issues.`,
            mitigationSteps: [
              'Establish relationships with reliable transporters',
              'Invest in proper packaging to extend shelf life',
              'Consider local markets to reduce transportation time',
              'Explore cold chain solutions if available',
              'Develop contingency plans for transportation disruptions',
            ],
            category: 'market',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(supplyChainRisk);
          categoryScore += 65;
        }

        // Add market access risk based on location
        const isRemoteLocation = !location.address.toLowerCase().includes('city') &&
                               !location.address.toLowerCase().includes('urban');
        if (isRemoteLocation) {
          const marketAccessRisk: Risk = {
            id: generateId(),
            name: 'Market Access Limitations',
            probability: 0.5,
            impact: 'medium',
            timeframe: 'ongoing',
            description: `Your rural location may limit access to premium markets and increase transportation costs for ${product.name}.`,
            mitigationSteps: [
              'Form farmer groups to aggregate produce for better market access',
              'Explore digital marketing platforms to reach urban buyers',
              'Consider value addition to increase product value relative to transport costs',
              'Investigate local processing options to reduce bulk transportation',
            ],
            category: 'market',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cropId: product.id,
            cropName: product.name,
            location
          };
          risks.push(marketAccessRisk);
          categoryScore += 55;
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
          'Explore direct marketing channels to consumers',
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
        // Generate crop-specific risks based on product name and weather conditions
        const cropName = product.name.toLowerCase();

        // Rice-specific risks
        if (cropName.includes('rice')) {
          if (avgTemperature > 25 && avgHumidity > 70) {
            const blastRisk: Risk = {
              id: generateId(),
              name: 'Rice Blast Disease',
              probability: 0.6,
              impact: 'high',
              timeframe: 'next few weeks',
              description: `High temperature and humidity conditions are highly favorable for rice blast disease in your ${product.name} crop.`,
              mitigationSteps: [
                'Apply preventive fungicide treatment',
                'Ensure proper water management',
                'Use resistant rice varieties if available',
                'Avoid excessive nitrogen application',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(blastRisk);
            categoryScore += 75;
          }

          if (isWet) {
            const bacterialBlightRisk: Risk = {
              id: generateId(),
              name: 'Bacterial Leaf Blight',
              probability: 0.5,
              impact: 'high',
              timeframe: 'current season',
              description: `Wet conditions increase the risk of bacterial leaf blight in your ${product.name} crop, which can reduce yields by up to 70%.`,
              mitigationSteps: [
                'Use disease-free seeds',
                'Avoid excessive nitrogen fertilization',
                'Maintain proper field drainage',
                'Consider copper-based bactericides in severe cases',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(bacterialBlightRisk);
            categoryScore += 70;
          }
        }

        // Wheat-specific risks
        else if (cropName.includes('wheat')) {
          if (avgHumidity > 75 && avgTemperature > 20) {
            const rustRisk: Risk = {
              id: generateId(),
              name: 'Wheat Rust',
              probability: 0.7,
              impact: 'high',
              timeframe: 'next few weeks',
              description: `Humid conditions are highly favorable for wheat rust development in your ${product.name} crop.`,
              mitigationSteps: [
                'Apply fungicide at first sign of infection',
                'Plant resistant varieties in future seasons',
                'Monitor fields regularly for early detection',
                'Maintain proper spacing for air circulation',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(rustRisk);
            categoryScore += 80;
          }
        }

        // Tomato-specific risks
        else if (cropName.includes('tomato')) {
          if (avgHumidity > 60 && isWet) {
            const blightRisk: Risk = {
              id: generateId(),
              name: 'Tomato Late Blight',
              probability: 0.6,
              impact: 'high',
              timeframe: 'immediate',
              description: `Wet and humid conditions are creating ideal environment for late blight in your ${product.name} crop.`,
              mitigationSteps: [
                'Apply fungicide preventatively',
                'Improve air circulation by proper spacing and pruning',
                'Avoid overhead irrigation',
                'Remove and destroy infected plants',
                'Consider copper-based fungicides for organic production',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(blightRisk);
            categoryScore += 75;
          }
        }

        // Potato-specific risks
        else if (cropName.includes('potato')) {
          if (avgTemperature > 15 && avgTemperature < 25 && avgHumidity > 80) {
            const lateBlightRisk: Risk = {
              id: generateId(),
              name: 'Potato Late Blight',
              probability: 0.7,
              impact: 'high',
              timeframe: 'immediate',
              description: `Current temperature and humidity conditions are ideal for potato late blight development in your ${product.name} crop.`,
              mitigationSteps: [
                'Apply fungicide preventatively',
                'Increase hilling to protect tubers',
                'Ensure good field drainage',
                'Consider early harvest if infection is detected',
                'Destroy crop debris after harvest',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(lateBlightRisk);
            categoryScore += 80;
          }
        }

        // Mango-specific risks
        else if (cropName.includes('mango')) {
          if (avgHumidity > 70 && avgTemperature > 25) {
            const anthracnoseRisk: Risk = {
              id: generateId(),
              name: 'Mango Anthracnose',
              probability: 0.6,
              impact: 'medium',
              timeframe: 'flowering and fruiting period',
              description: `Warm and humid conditions favor anthracnose development in your ${product.name} trees, affecting both flowers and fruits.`,
              mitigationSteps: [
                'Apply fungicide before flowering',
                'Prune trees to improve air circulation',
                'Harvest fruits at proper maturity',
                'Handle fruits carefully to avoid injury',
                'Maintain orchard sanitation by removing fallen fruits and leaves',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(anthracnoseRisk);
            categoryScore += 65;
          }
        }

        // Sugarcane-specific risks
        else if (cropName.includes('sugarcane')) {
          if (avgTemperature > 30) {
            const borersRisk: Risk = {
              id: generateId(),
              name: 'Sugarcane Borers',
              probability: 0.5,
              impact: 'medium',
              timeframe: 'current season',
              description: `High temperatures increase borer activity in ${product.name} fields, potentially reducing sugar content and yield.`,
              mitigationSteps: [
                'Release biological control agents like Trichogramma',
                'Apply appropriate insecticides if infestation is severe',
                'Remove and destroy dead hearts',
                'Avoid excessive nitrogen application',
                'Plant resistant varieties in future plantings',
              ],
              category: 'pest',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cropId: product.id,
              cropName: product.name,
              location
            };
            risks.push(borersRisk);
            categoryScore += 60;
          }
        }

        // Generic risks for all crops
        if (avgTemperature > 25 && avgHumidity > 70 && !risks.some(r => r.cropId === product.id && r.name.includes('Fungal'))) {
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

        if (avgTemperature > 28 && !risks.some(r => r.cropId === product.id && r.name.includes('Insect'))) {
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

    // Add weather alerts based on forecast
    const heavyRainDays = weatherForecast.filter(day =>
      day.precipitation.probability > 0.7 && day.precipitation.amount > 30
    );

    if (heavyRainDays.length > 0) {
      // Check if any crops are particularly vulnerable to heavy rain
      const vulnerableCrops = userProducts.filter(product =>
        product.name.toLowerCase().includes('cotton') ||
        product.name.toLowerCase().includes('wheat') ||
        product.name.toLowerCase().includes('harvested')
      );

      const alertMessage = vulnerableCrops.length > 0 ?
        `Heavy rainfall expected in the next few days. ${vulnerableCrops.map(p => p.name).join(', ')} may be particularly vulnerable. Take precautions to prevent waterlogging.` :
        `Heavy rainfall expected in the next few days. Take precautions to prevent waterlogging.`;

      alerts.push({
        id: generateId(),
        type: 'warning',
        message: alertMessage,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      });
    }

    // Check for heat wave
    const hotDays = weatherForecast.filter(day => day.temperature.max > 38);
    if (hotDays.length >= 3) {
      // Check if any crops are particularly vulnerable to heat
      const heatSensitiveCrops = userProducts.filter(product =>
        product.name.toLowerCase().includes('leafy') ||
        product.name.toLowerCase().includes('vegetable') ||
        product.name.toLowerCase().includes('tomato')
      );

      if (heatSensitiveCrops.length > 0) {
        alerts.push({
          id: generateId(),
          type: 'danger',
          message: `Heat wave expected with temperatures above 38°C for ${hotDays.length} days. ${heatSensitiveCrops.map(p => p.name).join(', ')} are at high risk. Implement shade and increase irrigation immediately.`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
        });
      } else {
        alerts.push({
          id: generateId(),
          type: 'warning',
          message: `Heat wave expected with temperatures above 38°C for ${hotDays.length} days. Adjust irrigation schedules and monitor crops closely.`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
        });
      }
    }

    // Add location-specific government scheme information
    const locationAddress = userProducts[0]?.location?.address?.toLowerCase() || '';
    let governmentScheme = 'New government crop insurance scheme available. Application deadline in 2 weeks.';

    // Customize based on location (simplified example)
    if (locationAddress.includes('maharashtra')) {
      governmentScheme = 'Maharashtra government crop insurance scheme available. Application deadline in 2 weeks. Visit nearest Krishi Kendra for details.';
    } else if (locationAddress.includes('punjab')) {
      governmentScheme = 'Punjab government subsidy for wheat farmers available. Application deadline in 3 weeks. Visit local agriculture office for details.';
    } else if (locationAddress.includes('karnataka')) {
      governmentScheme = 'Karnataka government irrigation subsidy available for farmers. Application deadline in 10 days. Apply online at agriculture.karnataka.gov.in.';
    }

    alerts.push({
      id: generateId(),
      type: 'info',
      message: governmentScheme,
      createdAt: Date.now(),
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    });

    // Add crop-specific alerts
    for (const product of userProducts) {
      const cropName = product.name.toLowerCase();

      // Rice-specific alerts
      if (cropName.includes('rice')) {
        const avgHumidity = weatherForecast.reduce((sum, day) => sum + day.humidity, 0) / weatherForecast.length;
        if (avgHumidity > 80) {
          alerts.push({
            id: generateId(),
            type: 'warning',
            message: `High humidity levels detected. Your rice crop is at increased risk of blast disease. Consider preventative fungicide application.`,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
            cropId: product.id,
          });
        }
      }

      // Mango-specific alerts
      else if (cropName.includes('mango') && product.isPrelisted) {
        alerts.push({
          id: generateId(),
          type: 'info',
          message: `Your prelisted mango crop has high demand in urban markets. Consider connecting with premium buyers for better prices.`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days
          cropId: product.id,
        });
      }
    }

    return alerts;
  }
};

export default RiskService;
