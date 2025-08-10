import { ProductLocation } from '../models/Product';
import ForecastService from './ForecastService';

// Define crop suitability parameters
interface CropParameters {
  name: string;
  optimalTemperature: {
    min: number;
    max: number;
  };
  waterRequirement: {
    min: number; // mm per week
    max: number;
  };
  growingSeason: string[]; // months (e.g., ['March', 'April', 'May'])
  soilMoisturePreference: {
    min: number; // percentage
    max: number;
  };
  profitPotential: number; // 1-10 scale
  marketDemand: number; // 1-10 scale
  diseaseRiskFactors: {
    highHumidity: number; // 0-1 scale
    highTemperature: number;
    rainfall: number;
  };
}

// Define crop recommendation output
export interface CropRecommendation {
  cropName: string;
  suitabilityScore: number; // 0-1 scale
  expectedYield: {
    min: number;
    max: number;
    unit: string;
  };
  expectedPrice: {
    min: number;
    max: number;
    currency: string;
  };
  growingPeriod: {
    start: number; // timestamp
    end: number;
  };
  waterRequirement: number; // mm for the entire growing period
  fertilizers: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  pesticides: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  risks: {
    name: string;
    probability: number; // 0-1 scale
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}

// Database of crops and their parameters
const cropDatabase: CropParameters[] = [
  // Cereal Crops
  {
    name: 'Rice',
    optimalTemperature: { min: 20, max: 35 },
    waterRequirement: { min: 30, max: 50 }, // mm per week
    growingSeason: ['June', 'July', 'August', 'September'],
    soilMoisturePreference: { min: 70, max: 90 },
    profitPotential: 7,
    marketDemand: 9,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.5,
      rainfall: 0.3,
    },
  },
  {
    name: 'Wheat',
    optimalTemperature: { min: 15, max: 24 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['November', 'December', 'January', 'February'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 6,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.4,
      rainfall: 0.7,
    },
  },
  {
    name: 'Maize (Corn)',
    optimalTemperature: { min: 18, max: 32 },
    waterRequirement: { min: 20, max: 30 },
    growingSeason: ['June', 'July', 'August', 'September'],
    soilMoisturePreference: { min: 50, max: 80 },
    profitPotential: 7,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.5,
      highTemperature: 0.3,
      rainfall: 0.6,
    },
  },
  {
    name: 'Bajra (Pearl Millet)',
    optimalTemperature: { min: 25, max: 35 },
    waterRequirement: { min: 10, max: 20 },
    growingSeason: ['June', 'July', 'August'],
    soilMoisturePreference: { min: 40, max: 60 },
    profitPotential: 5,
    marketDemand: 6,
    diseaseRiskFactors: {
      highHumidity: 0.4,
      highTemperature: 0.3,
      rainfall: 0.5,
    },
  },
  {
    name: 'Jowar (Sorghum)',
    optimalTemperature: { min: 25, max: 35 },
    waterRequirement: { min: 12, max: 22 },
    growingSeason: ['June', 'July', 'October', 'November'],
    soilMoisturePreference: { min: 40, max: 65 },
    profitPotential: 5,
    marketDemand: 6,
    diseaseRiskFactors: {
      highHumidity: 0.5,
      highTemperature: 0.3,
      rainfall: 0.4,
    },
  },

  // Pulses (Dal)
  {
    name: 'Moong Dal (Green Gram)',
    optimalTemperature: { min: 25, max: 35 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['March', 'April', 'June', 'July'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 7,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.4,
      rainfall: 0.5,
    },
  },
  {
    name: 'Masoor Dal (Red Lentil)',
    optimalTemperature: { min: 18, max: 30 },
    waterRequirement: { min: 12, max: 20 },
    growingSeason: ['October', 'November', 'December'],
    soilMoisturePreference: { min: 45, max: 65 },
    profitPotential: 6,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.5,
      highTemperature: 0.4,
      rainfall: 0.6,
    },
  },
  {
    name: 'Chana (Chickpea)',
    optimalTemperature: { min: 15, max: 25 },
    waterRequirement: { min: 10, max: 20 },
    growingSeason: ['October', 'November', 'December'],
    soilMoisturePreference: { min: 40, max: 60 },
    profitPotential: 7,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.5,
      rainfall: 0.6,
    },
  },
  {
    name: 'Toor Dal (Pigeon Pea)',
    optimalTemperature: { min: 20, max: 30 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['June', 'July', 'August'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 7,
    marketDemand: 9,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.4,
      rainfall: 0.5,
    },
  },
  {
    name: 'Urad Dal (Black Gram)',
    optimalTemperature: { min: 25, max: 35 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['June', 'July', 'August'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 6,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.5,
      rainfall: 0.5,
    },
  },

  // Vegetables
  {
    name: 'Potato',
    optimalTemperature: { min: 15, max: 25 },
    waterRequirement: { min: 25, max: 35 },
    growingSeason: ['February', 'March', 'April', 'October', 'November'],
    soilMoisturePreference: { min: 60, max: 80 },
    profitPotential: 8,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.8,
      highTemperature: 0.4,
      rainfall: 0.7,
    },
  },
  {
    name: 'Tomato',
    optimalTemperature: { min: 20, max: 30 },
    waterRequirement: { min: 20, max: 30 },
    growingSeason: ['March', 'April', 'May', 'June', 'July'],
    soilMoisturePreference: { min: 60, max: 80 },
    profitPotential: 9,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.6,
      rainfall: 0.5,
    },
  },
  {
    name: 'Onion',
    optimalTemperature: { min: 15, max: 25 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['October', 'November', 'December', 'January'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 8,
    marketDemand: 9,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.5,
      rainfall: 0.7,
    },
  },
  {
    name: 'Cauliflower',
    optimalTemperature: { min: 15, max: 25 },
    waterRequirement: { min: 20, max: 30 },
    growingSeason: ['September', 'October', 'November'],
    soilMoisturePreference: { min: 60, max: 75 },
    profitPotential: 7,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.6,
      rainfall: 0.5,
    },
  },
  {
    name: 'Brinjal (Eggplant)',
    optimalTemperature: { min: 20, max: 30 },
    waterRequirement: { min: 20, max: 30 },
    growingSeason: ['February', 'March', 'July', 'August'],
    soilMoisturePreference: { min: 60, max: 80 },
    profitPotential: 7,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.5,
      rainfall: 0.6,
    },
  },

  // Cash Crops
  {
    name: 'Soybean',
    optimalTemperature: { min: 20, max: 30 },
    waterRequirement: { min: 20, max: 35 },
    growingSeason: ['June', 'July', 'August', 'September'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 7,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.5,
      rainfall: 0.4,
    },
  },
  {
    name: 'Cotton',
    optimalTemperature: { min: 20, max: 35 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['April', 'May', 'June', 'July'],
    soilMoisturePreference: { min: 40, max: 70 },
    profitPotential: 8,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.3,
      rainfall: 0.6,
    },
  },
  {
    name: 'Sugarcane',
    optimalTemperature: { min: 20, max: 35 },
    waterRequirement: { min: 30, max: 50 },
    growingSeason: ['March', 'April', 'May', 'June'],
    soilMoisturePreference: { min: 60, max: 85 },
    profitPotential: 8,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.5,
      highTemperature: 0.4,
      rainfall: 0.3,
    },
  },
  {
    name: 'Groundnut (Peanut)',
    optimalTemperature: { min: 25, max: 35 },
    waterRequirement: { min: 15, max: 25 },
    growingSeason: ['June', 'July', 'November', 'December'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 7,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.4,
      rainfall: 0.5,
    },
  },
  {
    name: 'Mustard',
    optimalTemperature: { min: 15, max: 25 },
    waterRequirement: { min: 10, max: 20 },
    growingSeason: ['October', 'November', 'December'],
    soilMoisturePreference: { min: 40, max: 60 },
    profitPotential: 6,
    marketDemand: 7,
    diseaseRiskFactors: {
      highHumidity: 0.5,
      highTemperature: 0.4,
      rainfall: 0.6,
    },
  },

  // Fruits
  {
    name: 'Mango',
    optimalTemperature: { min: 24, max: 35 },
    waterRequirement: { min: 20, max: 35 },
    growingSeason: ['February', 'March', 'April', 'May'],
    soilMoisturePreference: { min: 50, max: 70 },
    profitPotential: 9,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.7,
      highTemperature: 0.4,
      rainfall: 0.6,
    },
  },
  {
    name: 'Banana',
    optimalTemperature: { min: 20, max: 35 },
    waterRequirement: { min: 25, max: 40 },
    growingSeason: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    soilMoisturePreference: { min: 60, max: 80 },
    profitPotential: 8,
    marketDemand: 8,
    diseaseRiskFactors: {
      highHumidity: 0.6,
      highTemperature: 0.5,
      rainfall: 0.7,
    },
  },
];

class AICropForecastService {
  private forecastService: typeof ForecastService;

  constructor() {
    this.forecastService = ForecastService;
  }

  // Get the current month name
  private getCurrentMonth(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
  }

  // Calculate crop suitability based on weather forecast
  private calculateCropSuitability(
    crop: CropParameters,
    avgTemperature: number,
    totalRainfall: number,
    avgHumidity: number
  ): number {
    // Check if current month is in growing season
    const currentMonth = this.getCurrentMonth();
    const isGrowingSeason = crop.growingSeason.includes(currentMonth);
    if (!isGrowingSeason) {
      return 0.2; // Low suitability if not in growing season
    }

    // Temperature suitability (0-1)
    let tempSuitability = 0;
    if (avgTemperature >= crop.optimalTemperature.min && avgTemperature <= crop.optimalTemperature.max) {
      tempSuitability = 1;
    } else {
      const minDiff = Math.abs(avgTemperature - crop.optimalTemperature.min);
      const maxDiff = Math.abs(avgTemperature - crop.optimalTemperature.max);
      const closestDiff = Math.min(minDiff, maxDiff);
      tempSuitability = Math.max(0, 1 - (closestDiff / 10)); // Decrease by 0.1 for each degree away from optimal
    }

    // Water suitability (0-1)
    let waterSuitability = 0;
    const weeklyRainfall = totalRainfall / 7; // Convert to weekly
    if (weeklyRainfall >= crop.waterRequirement.min && weeklyRainfall <= crop.waterRequirement.max) {
      waterSuitability = 1;
    } else if (weeklyRainfall < crop.waterRequirement.min) {
      // If rainfall is less than required, assume irrigation can supplement
      waterSuitability = 0.7;
    } else {
      // Too much rainfall
      const excessRainfall = weeklyRainfall - crop.waterRequirement.max;
      waterSuitability = Math.max(0, 1 - (excessRainfall / 20)); // Decrease by 0.05 for each mm of excess
    }

    // Disease risk based on humidity and temperature
    const humidityRisk = avgHumidity / 100 * crop.diseaseRiskFactors.highHumidity;
    const tempRisk = (avgTemperature > 30 ? 1 : avgTemperature / 30) * crop.diseaseRiskFactors.highTemperature;
    const rainfallRisk = (totalRainfall > 50 ? 1 : totalRainfall / 50) * crop.diseaseRiskFactors.rainfall;
    const diseaseRisk = (humidityRisk + tempRisk + rainfallRisk) / 3;

    // Market factors
    const marketFactor = (crop.profitPotential + crop.marketDemand) / 20; // 0-1 scale

    // Calculate overall suitability
    const overallSuitability = (
      tempSuitability * 0.3 +
      waterSuitability * 0.3 +
      (1 - diseaseRisk) * 0.2 +
      marketFactor * 0.2
    );

    return Math.min(1, Math.max(0, overallSuitability));
  }

  // Generate crop recommendations based on weather forecast
  async getCropRecommendations(location: ProductLocation): Promise<CropRecommendation[]> {
    try {
      // Get weather forecast - note that Open-Meteo has a 16-day limit
      // but we'll use whatever data we get for our recommendations
      console.log('AICropForecastService: Getting weather forecast for crop recommendations');
      const weatherForecast = await this.forecastService.getWeatherForecast(location, 16); // Request max 16 days

      if (!weatherForecast || weatherForecast.length === 0) {
        console.error('AICropForecastService: No weather forecast data available');
        throw new Error('No weather forecast data available');
      }

      console.log(`AICropForecastService: Received ${weatherForecast.length} days of weather forecast (max 16 days)`);

      // We can still make recommendations with the data we have

      // Calculate average weather conditions
      const avgTemperature = weatherForecast.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherForecast.length;
      const totalRainfall = weatherForecast.reduce((sum, day) => sum + day.precipitation.amount, 0);
      const avgHumidity = weatherForecast.reduce((sum, day) => sum + day.humidity, 0) / weatherForecast.length;

      console.log(`AICropForecastService: Weather analysis - Avg Temp: ${avgTemperature.toFixed(1)}°C, Total Rainfall: ${totalRainfall.toFixed(1)}mm, Avg Humidity: ${avgHumidity.toFixed(1)}%`);

      // Calculate suitability for each crop
      const recommendations: CropRecommendation[] = [];

      for (const crop of cropDatabase) {
        const suitabilityScore = this.calculateCropSuitability(
          crop,
          avgTemperature,
          totalRainfall,
          avgHumidity
        );

        // Only include crops with reasonable suitability
        if (suitabilityScore > 0.4) {
          // Calculate expected yield based on suitability (tons per hectare)
          const baseYield =
            // Cereal Crops
            crop.name === 'Rice' ? 4.0 :
            crop.name === 'Wheat' ? 3.0 :
            crop.name === 'Maize' ? 5.0 :
            crop.name === 'Bajra (Pearl Millet)' ? 2.0 :
            crop.name === 'Jowar (Sorghum)' ? 2.5 :

            // Pulses (Dal)
            crop.name === 'Moong Dal (Green Gram)' ? 1.0 :
            crop.name === 'Masoor Dal (Red Lentil)' ? 1.2 :
            crop.name === 'Chana (Chickpea)' ? 1.5 :
            crop.name === 'Toor Dal (Pigeon Pea)' ? 1.3 :
            crop.name === 'Urad Dal (Black Gram)' ? 1.0 :

            // Vegetables
            crop.name === 'Potato' ? 20.0 :
            crop.name === 'Tomato' ? 25.0 :
            crop.name === 'Onion' ? 18.0 :
            crop.name === 'Cauliflower' ? 15.0 :
            crop.name === 'Brinjal (Eggplant)' ? 22.0 :

            // Cash Crops
            crop.name === 'Soybean' ? 2.5 :
            crop.name === 'Cotton' ? 1.5 :
            crop.name === 'Sugarcane' ? 70.0 :
            crop.name === 'Groundnut (Peanut)' ? 2.0 :
            crop.name === 'Mustard' ? 1.2 :

            // Fruits
            crop.name === 'Mango' ? 10.0 :
            crop.name === 'Banana' ? 30.0 :

            // Default
            3.0;

          const yieldVariation = baseYield * 0.3; // 30% variation
          const minYield = baseYield - yieldVariation * (1 - suitabilityScore);
          const maxYield = baseYield + yieldVariation * suitabilityScore;

          // Calculate expected price (INR per kg)
          const basePrice =
            // Cereal Crops
            crop.name === 'Rice' ? 20 :
            crop.name === 'Wheat' ? 25 :
            crop.name === 'Maize' ? 18 :
            crop.name === 'Bajra (Pearl Millet)' ? 22 :
            crop.name === 'Jowar (Sorghum)' ? 24 :

            // Pulses (Dal)
            crop.name === 'Moong Dal (Green Gram)' ? 90 :
            crop.name === 'Masoor Dal (Red Lentil)' ? 85 :
            crop.name === 'Chana (Chickpea)' ? 70 :
            crop.name === 'Toor Dal (Pigeon Pea)' ? 95 :
            crop.name === 'Urad Dal (Black Gram)' ? 100 :

            // Vegetables
            crop.name === 'Potato' ? 15 :
            crop.name === 'Tomato' ? 30 :
            crop.name === 'Onion' ? 25 :
            crop.name === 'Cauliflower' ? 30 :
            crop.name === 'Brinjal (Eggplant)' ? 25 :

            // Cash Crops
            crop.name === 'Soybean' ? 35 :
            crop.name === 'Cotton' ? 60 :
            crop.name === 'Sugarcane' ? 3 :
            crop.name === 'Groundnut (Peanut)' ? 70 :
            crop.name === 'Mustard' ? 50 :

            // Fruits
            crop.name === 'Mango' ? 80 :
            crop.name === 'Banana' ? 40 :

            // Default
            25;

          const priceVariation = basePrice * 0.2; // 20% variation
          const minPrice = basePrice - priceVariation;
          const maxPrice = basePrice + priceVariation;

          // Calculate growing period
          const growingPeriodMonths =
            // Cereal Crops
            crop.name === 'Rice' ? 4 :
            crop.name === 'Wheat' ? 4 :
            crop.name === 'Maize' ? 3 :
            crop.name === 'Bajra (Pearl Millet)' ? 3 :
            crop.name === 'Jowar (Sorghum)' ? 4 :

            // Pulses (Dal)
            crop.name === 'Moong Dal (Green Gram)' ? 3 :
            crop.name === 'Masoor Dal (Red Lentil)' ? 4 :
            crop.name === 'Chana (Chickpea)' ? 4 :
            crop.name === 'Toor Dal (Pigeon Pea)' ? 5 :
            crop.name === 'Urad Dal (Black Gram)' ? 3 :

            // Vegetables
            crop.name === 'Potato' ? 3 :
            crop.name === 'Tomato' ? 3 :
            crop.name === 'Onion' ? 4 :
            crop.name === 'Cauliflower' ? 3 :
            crop.name === 'Brinjal (Eggplant)' ? 3 :

            // Cash Crops
            crop.name === 'Soybean' ? 4 :
            crop.name === 'Cotton' ? 6 :
            crop.name === 'Sugarcane' ? 12 :
            crop.name === 'Groundnut (Peanut)' ? 4 :
            crop.name === 'Mustard' ? 3 :

            // Fruits
            crop.name === 'Mango' ? 36 : // Tree crop, takes years
            crop.name === 'Banana' ? 12 :

            // Default
            4;

          const startDate = new Date(); // Today
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + growingPeriodMonths);

          // Generate fertilizer recommendations
          const fertilizers = [];

          // Cereal Crops
          if (crop.name === 'Rice' || crop.name === 'Wheat' || crop.name === 'Maize') {
            fertilizers.push(
              { name: 'Urea', quantity: 100, unit: 'kg/ha' },
              { name: 'DAP', quantity: 50, unit: 'kg/ha' },
              { name: 'Potash', quantity: 25, unit: 'kg/ha' }
            );
          }
          // Millets
          else if (crop.name === 'Bajra (Pearl Millet)' || crop.name === 'Jowar (Sorghum)') {
            fertilizers.push(
              { name: 'Urea', quantity: 80, unit: 'kg/ha' },
              { name: 'DAP', quantity: 40, unit: 'kg/ha' },
              { name: 'Potash', quantity: 20, unit: 'kg/ha' }
            );
          }
          // Pulses (Dal)
          else if (crop.name === 'Moong Dal (Green Gram)' || crop.name === 'Masoor Dal (Red Lentil)' ||
                   crop.name === 'Chana (Chickpea)' || crop.name === 'Toor Dal (Pigeon Pea)' ||
                   crop.name === 'Urad Dal (Black Gram)') {
            fertilizers.push(
              { name: 'DAP', quantity: 60, unit: 'kg/ha' },
              { name: 'Potash', quantity: 20, unit: 'kg/ha' },
              { name: 'Rhizobium Culture', quantity: 5, unit: 'kg/ha' }
            );
          }
          // Vegetables
          else if (crop.name === 'Potato' || crop.name === 'Tomato' || crop.name === 'Brinjal (Eggplant)') {
            fertilizers.push(
              { name: 'NPK 10-26-26', quantity: 75, unit: 'kg/ha' },
              { name: 'Calcium Nitrate', quantity: 40, unit: 'kg/ha' }
            );
          }
          else if (crop.name === 'Onion' || crop.name === 'Cauliflower') {
            fertilizers.push(
              { name: 'NPK 15-15-15', quantity: 70, unit: 'kg/ha' },
              { name: 'Ammonium Sulfate', quantity: 50, unit: 'kg/ha' }
            );
          }
          // Cash Crops
          else if (crop.name === 'Cotton') {
            fertilizers.push(
              { name: 'Urea', quantity: 120, unit: 'kg/ha' },
              { name: 'DAP', quantity: 60, unit: 'kg/ha' },
              { name: 'Potash', quantity: 40, unit: 'kg/ha' }
            );
          }
          else if (crop.name === 'Sugarcane') {
            fertilizers.push(
              { name: 'Urea', quantity: 150, unit: 'kg/ha' },
              { name: 'DAP', quantity: 80, unit: 'kg/ha' },
              { name: 'Potash', quantity: 60, unit: 'kg/ha' }
            );
          }
          // Oilseeds
          else if (crop.name === 'Groundnut (Peanut)' || crop.name === 'Mustard' || crop.name === 'Soybean') {
            fertilizers.push(
              { name: 'NPK 12-32-16', quantity: 70, unit: 'kg/ha' },
              { name: 'Gypsum', quantity: 200, unit: 'kg/ha' }
            );
          }
          // Fruits
          else if (crop.name === 'Mango' || crop.name === 'Banana') {
            fertilizers.push(
              { name: 'NPK 14-14-14', quantity: 100, unit: 'kg/ha' },
              { name: 'Organic Manure', quantity: 500, unit: 'kg/ha' },
              { name: 'Micronutrient Mixture', quantity: 15, unit: 'kg/ha' }
            );
          }
          // Default for any other crops
          else {
            fertilizers.push(
              { name: 'NPK 14-14-14', quantity: 60, unit: 'kg/ha' },
              { name: 'Urea', quantity: 40, unit: 'kg/ha' }
            );
          }

          // Calculate risks based on weather and crop factors
          const risks: {
            name: string;
            probability: number;
            impact: 'low' | 'medium' | 'high';
            mitigation: string;
          }[] = [];

          // Disease risk
          if (avgHumidity > 75 && avgTemperature > 25) {
            const diseaseProbability = crop.diseaseRiskFactors.highHumidity * crop.diseaseRiskFactors.highTemperature;
            risks.push({
              name: 'Fungal Disease',
              probability: diseaseProbability,
              impact: diseaseProbability > 0.6 ? 'high' : diseaseProbability > 0.3 ? 'medium' : 'low',
              mitigation: 'Apply fungicide preventatively and ensure proper spacing for air circulation.'
            });
          }

          // Pest risk
          if (avgTemperature > 28) {
            risks.push({
              name: 'Insect Infestation',
              probability: 0.4 + (avgTemperature - 28) * 0.05,
              impact: 'medium' as 'medium',
              mitigation: 'Monitor regularly and use integrated pest management techniques.'
            });
          }

          // Water stress risk
          if (totalRainfall < crop.waterRequirement.min * 4) { // 4 weeks
            risks.push({
              name: 'Water Stress',
              probability: 0.7,
              impact: 'high' as 'high',
              mitigation: 'Implement irrigation system and mulch to retain soil moisture.'
            });
          }

          // Generate pesticide recommendations
          const pesticides = [];

          // Cereal Crops
          if (crop.name === 'Rice' || crop.name === 'Wheat') {
            pesticides.push(
              { name: 'Chlorpyrifos', quantity: 2, unit: 'L/ha' },
              { name: 'Propiconazole', quantity: 1, unit: 'L/ha' }
            );
          }
          else if (crop.name === 'Maize' || crop.name === 'Bajra (Pearl Millet)' || crop.name === 'Jowar (Sorghum)') {
            pesticides.push(
              { name: 'Deltamethrin', quantity: 1, unit: 'L/ha' },
              { name: 'Thiamethoxam', quantity: 0.5, unit: 'kg/ha' }
            );
          }
          // Pulses (Dal)
          else if (crop.name === 'Moong Dal (Green Gram)' || crop.name === 'Masoor Dal (Red Lentil)' ||
                   crop.name === 'Chana (Chickpea)' || crop.name === 'Toor Dal (Pigeon Pea)' ||
                   crop.name === 'Urad Dal (Black Gram)') {
            pesticides.push(
              { name: 'Quinalphos', quantity: 1.5, unit: 'L/ha' },
              { name: 'Carbendazim', quantity: 1, unit: 'kg/ha' }
            );
          }
          // Vegetables
          else if (crop.name === 'Potato' || crop.name === 'Tomato') {
            pesticides.push(
              { name: 'Mancozeb', quantity: 2.5, unit: 'kg/ha' },
              { name: 'Imidacloprid', quantity: 0.5, unit: 'L/ha' }
            );
          }
          else if (crop.name === 'Onion' || crop.name === 'Cauliflower' || crop.name === 'Brinjal (Eggplant)') {
            pesticides.push(
              { name: 'Spinosad', quantity: 0.5, unit: 'L/ha' },
              { name: 'Copper Oxychloride', quantity: 2.5, unit: 'kg/ha' }
            );
          }
          // Cash Crops
          else if (crop.name === 'Cotton') {
            pesticides.push(
              { name: 'Profenofos', quantity: 2, unit: 'L/ha' },
              { name: 'Diafenthiuron', quantity: 1, unit: 'kg/ha' }
            );
          }
          else if (crop.name === 'Sugarcane') {
            pesticides.push(
              { name: 'Fipronil', quantity: 1.5, unit: 'L/ha' },
              { name: 'Hexaconazole', quantity: 1, unit: 'L/ha' }
            );
          }
          // Oilseeds
          else if (crop.name === 'Groundnut (Peanut)' || crop.name === 'Mustard' || crop.name === 'Soybean') {
            pesticides.push(
              { name: 'Chlorantraniliprole', quantity: 0.3, unit: 'L/ha' },
              { name: 'Tebuconazole', quantity: 1, unit: 'L/ha' }
            );
          }
          // Fruits
          else if (crop.name === 'Mango' || crop.name === 'Banana') {
            pesticides.push(
              { name: 'Carbendazim', quantity: 1, unit: 'kg/ha' },
              { name: 'Imidacloprid', quantity: 0.5, unit: 'L/ha' },
              { name: 'Mineral Oil', quantity: 10, unit: 'L/ha' }
            );
          }
          // Default for any other crops
          else {
            pesticides.push(
              { name: 'Cypermethrin', quantity: 1, unit: 'L/ha' },
              { name: 'Carbendazim', quantity: 1.5, unit: 'kg/ha' }
            );
          }

          // Add to recommendations
          recommendations.push({
            cropName: crop.name,
            suitabilityScore,
            expectedYield: {
              min: parseFloat(minYield.toFixed(1)),
              max: parseFloat(maxYield.toFixed(1)),
              unit: 'tons/ha'
            },
            expectedPrice: {
              min: Math.round(minPrice),
              max: Math.round(maxPrice),
              currency: 'INR/kg'
            },
            growingPeriod: {
              start: startDate.getTime(),
              end: endDate.getTime()
            },
            waterRequirement: Math.round(crop.waterRequirement.min * growingPeriodMonths * 4), // 4 weeks per month
            fertilizers,
            pesticides,
            risks
          });
        }
      }

      // Sort by suitability score (highest first)
      return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    } catch (error) {
      console.error('Error generating crop recommendations:', error);
      console.log('AICropForecastService: Returning empty recommendations array due to error');
      // Return an empty array when there's an error
      return [];
    }
  }
}

export default new AICropForecastService();
