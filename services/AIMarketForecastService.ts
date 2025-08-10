import { ProductLocation } from '../models/Product';
import ForecastService from './ForecastService';
import { MarketPriceForecast } from './ForecastService';

// Define crop market parameters
interface CropMarketParameters {
  id: string;
  name: string;
  basePrice: number; // INR per kg
  seasonalityFactors: {
    [month: string]: number; // Multiplier for each month (1.0 is baseline)
  };
  weatherSensitivity: {
    temperature: number; // -1 to 1 scale (negative means price goes down with higher temp)
    rainfall: number;
    humidity: number;
  };
  supplyDemandFactor: number; // 0-1 scale (how much supply/demand affects price)
  volatility: number; // 0-1 scale (price volatility)
  storageLife: number; // in days
  substitutes: string[]; // IDs of substitute crops
}

// Database of crops and their market parameters
const cropMarketDatabase: CropMarketParameters[] = [
  // Cereal Crops
  {
    id: 'rice',
    name: 'Rice',
    basePrice: 40, // INR per kg
    seasonalityFactors: {
      'January': 1.05,
      'February': 1.1,
      'March': 1.15,
      'April': 1.2,
      'May': 1.15,
      'June': 1.0,
      'July': 0.9,
      'August': 0.85,
      'September': 0.9,
      'October': 0.95,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: -0.2, // Price decreases with higher temperature
      rainfall: 0.3, // Price increases with more rainfall
      humidity: 0.1
    },
    supplyDemandFactor: 0.7,
    volatility: 0.3,
    storageLife: 365, // Long storage life
    substitutes: ['wheat']
  },
  {
    id: 'wheat',
    name: 'Wheat',
    basePrice: 30,
    seasonalityFactors: {
      'January': 0.9,
      'February': 0.85,
      'March': 0.8,
      'April': 0.85,
      'May': 0.9,
      'June': 1.0,
      'July': 1.1,
      'August': 1.15,
      'September': 1.2,
      'October': 1.15,
      'November': 1.05,
      'December': 0.95
    },
    weatherSensitivity: {
      temperature: 0.3, // Price increases with higher temperature
      rainfall: -0.2, // Price decreases with more rainfall
      humidity: -0.1
    },
    supplyDemandFactor: 0.6,
    volatility: 0.25,
    storageLife: 300,
    substitutes: ['rice']
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    basePrice: 25,
    seasonalityFactors: {
      'January': 1.1,
      'February': 1.15,
      'March': 1.2,
      'April': 1.15,
      'May': 1.1,
      'June': 1.0,
      'July': 0.9,
      'August': 0.85,
      'September': 0.9,
      'October': 0.95,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: -0.1,
      rainfall: 0.4,
      humidity: 0.1
    },
    supplyDemandFactor: 0.6,
    volatility: 0.3,
    storageLife: 270,
    substitutes: ['wheat']
  },
  {
    id: 'bajra',
    name: 'Bajra (Pearl Millet)',
    basePrice: 22,
    seasonalityFactors: {
      'January': 1.1,
      'February': 1.15,
      'March': 1.2,
      'April': 1.15,
      'May': 1.1,
      'June': 1.0,
      'July': 0.9,
      'August': 0.85,
      'September': 0.9,
      'October': 0.95,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: -0.3,
      humidity: -0.1
    },
    supplyDemandFactor: 0.5,
    volatility: 0.3,
    storageLife: 240,
    substitutes: ['jowar']
  },
  {
    id: 'jowar',
    name: 'Jowar (Sorghum)',
    basePrice: 24,
    seasonalityFactors: {
      'January': 1.05,
      'February': 1.1,
      'March': 1.15,
      'April': 1.1,
      'May': 1.05,
      'June': 1.0,
      'July': 0.95,
      'August': 0.9,
      'September': 0.95,
      'October': 1.0,
      'November': 1.05,
      'December': 1.1
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: -0.3,
      humidity: -0.1
    },
    supplyDemandFactor: 0.5,
    volatility: 0.3,
    storageLife: 240,
    substitutes: ['bajra']
  },

  // Pulses (Dal)
  {
    id: 'moong',
    name: 'Moong Dal (Green Gram)',
    basePrice: 90,
    seasonalityFactors: {
      'January': 1.05,
      'February': 1.1,
      'March': 1.0,
      'April': 0.95,
      'May': 1.0,
      'June': 1.05,
      'July': 1.1,
      'August': 1.15,
      'September': 1.1,
      'October': 1.05,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: 0.1,
      rainfall: 0.2,
      humidity: -0.1
    },
    supplyDemandFactor: 0.7,
    volatility: 0.4,
    storageLife: 365,
    substitutes: ['masoor', 'toor']
  },
  {
    id: 'masoor',
    name: 'Masoor Dal (Red Lentil)',
    basePrice: 85,
    seasonalityFactors: {
      'January': 0.95,
      'February': 1.0,
      'March': 1.05,
      'April': 1.1,
      'May': 1.15,
      'June': 1.1,
      'July': 1.05,
      'August': 1.0,
      'September': 0.95,
      'October': 0.9,
      'November': 0.95,
      'December': 1.0
    },
    weatherSensitivity: {
      temperature: 0.1,
      rainfall: 0.2,
      humidity: -0.1
    },
    supplyDemandFactor: 0.7,
    volatility: 0.4,
    storageLife: 365,
    substitutes: ['moong', 'toor']
  },
  {
    id: 'chana',
    name: 'Chana (Chickpea)',
    basePrice: 70,
    seasonalityFactors: {
      'January': 0.9,
      'February': 0.85,
      'March': 0.9,
      'April': 0.95,
      'May': 1.0,
      'June': 1.05,
      'July': 1.1,
      'August': 1.15,
      'September': 1.1,
      'October': 1.05,
      'November': 1.0,
      'December': 0.95
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: 0.1,
      humidity: -0.2
    },
    supplyDemandFactor: 0.6,
    volatility: 0.35,
    storageLife: 365,
    substitutes: []
  },
  {
    id: 'toor',
    name: 'Toor Dal (Pigeon Pea)',
    basePrice: 95,
    seasonalityFactors: {
      'January': 1.0,
      'February': 1.05,
      'March': 1.1,
      'April': 1.15,
      'May': 1.1,
      'June': 1.05,
      'July': 1.0,
      'August': 0.95,
      'September': 0.9,
      'October': 0.95,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: 0.1,
      rainfall: 0.3,
      humidity: -0.1
    },
    supplyDemandFactor: 0.8,
    volatility: 0.45,
    storageLife: 365,
    substitutes: ['moong', 'masoor']
  },
  {
    id: 'urad',
    name: 'Urad Dal (Black Gram)',
    basePrice: 100,
    seasonalityFactors: {
      'January': 1.05,
      'February': 1.1,
      'March': 1.15,
      'April': 1.1,
      'May': 1.05,
      'June': 1.0,
      'July': 0.95,
      'August': 0.9,
      'September': 0.95,
      'October': 1.0,
      'November': 1.05,
      'December': 1.1
    },
    weatherSensitivity: {
      temperature: 0.1,
      rainfall: 0.2,
      humidity: -0.1
    },
    supplyDemandFactor: 0.7,
    volatility: 0.4,
    storageLife: 365,
    substitutes: ['moong']
  },

  // Vegetables
  {
    id: 'potato',
    name: 'Potato',
    basePrice: 20,
    seasonalityFactors: {
      'January': 0.8,
      'February': 0.9,
      'March': 1.0,
      'April': 1.1,
      'May': 1.2,
      'June': 1.3,
      'July': 1.2,
      'August': 1.1,
      'September': 1.0,
      'October': 0.9,
      'November': 0.8,
      'December': 0.7
    },
    weatherSensitivity: {
      temperature: 0.4,
      rainfall: 0.2,
      humidity: -0.3
    },
    supplyDemandFactor: 0.8,
    volatility: 0.5, // High volatility
    storageLife: 90,
    substitutes: []
  },
  {
    id: 'tomato',
    name: 'Tomato',
    basePrice: 35,
    seasonalityFactors: {
      'January': 1.2,
      'February': 1.1,
      'March': 1.0,
      'April': 0.9,
      'May': 0.8,
      'June': 0.7,
      'July': 0.8,
      'August': 0.9,
      'September': 1.0,
      'October': 1.1,
      'November': 1.2,
      'December': 1.3
    },
    weatherSensitivity: {
      temperature: -0.3,
      rainfall: 0.4,
      humidity: -0.2
    },
    supplyDemandFactor: 0.9,
    volatility: 0.7, // Very high volatility
    storageLife: 14, // Short storage life
    substitutes: []
  },
  {
    id: 'onion',
    name: 'Onion',
    basePrice: 25,
    seasonalityFactors: {
      'January': 0.9,
      'February': 0.85,
      'March': 0.9,
      'April': 0.95,
      'May': 1.0,
      'June': 1.1,
      'July': 1.2,
      'August': 1.3,
      'September': 1.2,
      'October': 1.1,
      'November': 1.0,
      'December': 0.95
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: -0.1,
      humidity: -0.3
    },
    supplyDemandFactor: 0.8,
    volatility: 0.6,
    storageLife: 120,
    substitutes: []
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    basePrice: 30,
    seasonalityFactors: {
      'January': 0.8,
      'February': 0.9,
      'March': 1.0,
      'April': 1.1,
      'May': 1.2,
      'June': 1.3,
      'July': 1.2,
      'August': 1.1,
      'September': 1.0,
      'October': 0.9,
      'November': 0.8,
      'December': 0.7
    },
    weatherSensitivity: {
      temperature: 0.3,
      rainfall: 0.2,
      humidity: -0.2
    },
    supplyDemandFactor: 0.7,
    volatility: 0.5,
    storageLife: 10,
    substitutes: []
  },
  {
    id: 'brinjal',
    name: 'Brinjal (Eggplant)',
    basePrice: 25,
    seasonalityFactors: {
      'January': 1.0,
      'February': 0.9,
      'March': 0.8,
      'April': 0.9,
      'May': 1.0,
      'June': 1.1,
      'July': 1.2,
      'August': 1.1,
      'September': 1.0,
      'October': 0.9,
      'November': 1.0,
      'December': 1.1
    },
    weatherSensitivity: {
      temperature: -0.1,
      rainfall: 0.3,
      humidity: -0.1
    },
    supplyDemandFactor: 0.7,
    volatility: 0.5,
    storageLife: 7,
    substitutes: []
  },

  // Cash Crops
  {
    id: 'soybean',
    name: 'Soybean',
    basePrice: 45,
    seasonalityFactors: {
      'January': 1.1,
      'February': 1.15,
      'March': 1.2,
      'April': 1.15,
      'May': 1.1,
      'June': 1.05,
      'July': 1.0,
      'August': 0.95,
      'September': 0.9,
      'October': 0.95,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: -0.1,
      rainfall: 0.3,
      humidity: 0.1
    },
    supplyDemandFactor: 0.6,
    volatility: 0.4,
    storageLife: 240,
    substitutes: []
  },
  {
    id: 'cotton',
    name: 'Cotton',
    basePrice: 60,
    seasonalityFactors: {
      'January': 1.0,
      'February': 1.05,
      'March': 1.1,
      'April': 1.15,
      'May': 1.1,
      'June': 1.05,
      'July': 1.0,
      'August': 0.95,
      'September': 0.9,
      'October': 0.95,
      'November': 1.0,
      'December': 1.05
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: -0.1,
      humidity: -0.2
    },
    supplyDemandFactor: 0.7,
    volatility: 0.4,
    storageLife: 365,
    substitutes: []
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    basePrice: 3, // per kg
    seasonalityFactors: {
      'January': 0.95,
      'February': 1.0,
      'March': 1.05,
      'April': 1.1,
      'May': 1.15,
      'June': 1.1,
      'July': 1.05,
      'August': 1.0,
      'September': 0.95,
      'October': 0.9,
      'November': 0.95,
      'December': 1.0
    },
    weatherSensitivity: {
      temperature: 0.1,
      rainfall: 0.4,
      humidity: 0.1
    },
    supplyDemandFactor: 0.5,
    volatility: 0.2,
    storageLife: 5, // Must be processed quickly
    substitutes: []
  },
  {
    id: 'groundnut',
    name: 'Groundnut (Peanut)',
    basePrice: 70,
    seasonalityFactors: {
      'January': 1.05,
      'February': 1.1,
      'March': 1.15,
      'April': 1.1,
      'May': 1.05,
      'June': 1.0,
      'July': 0.95,
      'August': 0.9,
      'September': 0.95,
      'October': 1.0,
      'November': 1.05,
      'December': 1.1
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: 0.1,
      humidity: -0.2
    },
    supplyDemandFactor: 0.6,
    volatility: 0.3,
    storageLife: 300,
    substitutes: []
  },
  {
    id: 'mustard',
    name: 'Mustard',
    basePrice: 50,
    seasonalityFactors: {
      'January': 0.9,
      'February': 0.85,
      'March': 0.9,
      'April': 0.95,
      'May': 1.0,
      'June': 1.05,
      'July': 1.1,
      'August': 1.15,
      'September': 1.1,
      'October': 1.05,
      'November': 1.0,
      'December': 0.95
    },
    weatherSensitivity: {
      temperature: 0.2,
      rainfall: -0.1,
      humidity: -0.2
    },
    supplyDemandFactor: 0.5,
    volatility: 0.3,
    storageLife: 300,
    substitutes: []
  },

  // Fruits
  {
    id: 'mango',
    name: 'Mango',
    basePrice: 80,
    seasonalityFactors: {
      'January': 1.5,
      'February': 1.3,
      'March': 1.1,
      'April': 0.9,
      'May': 0.7,
      'June': 0.6,
      'July': 0.8,
      'August': 1.0,
      'September': 1.2,
      'October': 1.4,
      'November': 1.6,
      'December': 1.7
    },
    weatherSensitivity: {
      temperature: -0.3,
      rainfall: 0.2,
      humidity: -0.1
    },
    supplyDemandFactor: 0.8,
    volatility: 0.6,
    storageLife: 14,
    substitutes: ['banana']
  },
  {
    id: 'banana',
    name: 'Banana',
    basePrice: 40,
    seasonalityFactors: {
      'January': 1.0,
      'February': 1.0,
      'March': 1.0,
      'April': 1.0,
      'May': 1.0,
      'June': 1.0,
      'July': 1.0,
      'August': 1.0,
      'September': 1.0,
      'October': 1.0,
      'November': 1.0,
      'December': 1.0
    },
    weatherSensitivity: {
      temperature: -0.1,
      rainfall: 0.3,
      humidity: 0.1
    },
    supplyDemandFactor: 0.6,
    volatility: 0.3,
    storageLife: 14,
    substitutes: []
  }
];

class AIMarketForecastService {
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

  // Get month name for a future date
  private getMonthName(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[date.getMonth()];
  }

  // Calculate market price forecast based on weather and other factors
  private calculateMarketPriceForecast(
    crop: CropMarketParameters,
    avgTemperature: number,
    totalRainfall: number,
    avgHumidity: number,
    forecastDays: number
  ): MarketPriceForecast {
    // Get current month and forecast month
    const currentMonth = this.getCurrentMonth();
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + forecastDays);
    const forecastMonth = this.getMonthName(forecastDate);

    // Base price adjusted for seasonality
    const currentSeasonalFactor = crop.seasonalityFactors[currentMonth] || 1.0;
    const forecastSeasonalFactor = crop.seasonalityFactors[forecastMonth] || 1.0;
    const currentPrice = Math.round(crop.basePrice * currentSeasonalFactor);

    // Calculate weather impact
    const temperatureImpact = (avgTemperature - 25) * crop.weatherSensitivity.temperature / 10;
    const rainfallImpact = (totalRainfall - 50) * crop.weatherSensitivity.rainfall / 100;
    const humidityImpact = (avgHumidity - 60) * crop.weatherSensitivity.humidity / 100;
    const weatherImpact = temperatureImpact + rainfallImpact + humidityImpact;

    // Calculate market dynamics (simplified)
    const seasonalChange = forecastSeasonalFactor - currentSeasonalFactor;
    const randomMarketFactor = (Math.random() - 0.5) * crop.volatility * 0.2;

    // Calculate total price change
    const totalPriceChangeFactor = seasonalChange + weatherImpact + randomMarketFactor;
    const priceChangePercentage = totalPriceChangeFactor * 100;

    // Calculate forecasted price
    const forecastedPrice = Math.max(
      Math.round(currentPrice * (1 + totalPriceChangeFactor)),
      Math.round(crop.basePrice * 0.7) // Price can't go below 70% of base price
    );

    // Generate factors that influenced the forecast
    const factors = [];

    // Seasonal factors
    if (Math.abs(seasonalChange) > 0.05) {
      factors.push({
        name: seasonalChange > 0
          ? `Seasonal demand increase in ${forecastMonth}`
          : `Seasonal supply increase in ${forecastMonth}`,
        impact: seasonalChange > 0 ? 'positive' : 'negative',
        weight: Math.abs(seasonalChange) * 5
      });
    }

    // Weather factors
    if (Math.abs(temperatureImpact) > 0.02) {
      factors.push({
        name: `${avgTemperature > 25 ? 'Higher' : 'Lower'} than optimal temperature`,
        impact: temperatureImpact > 0 ? 'positive' : 'negative',
        weight: Math.abs(temperatureImpact) * 10
      });
    }

    if (Math.abs(rainfallImpact) > 0.02) {
      factors.push({
        name: `${totalRainfall > 50 ? 'Above average' : 'Below average'} rainfall`,
        impact: rainfallImpact > 0 ? 'positive' : 'negative',
        weight: Math.abs(rainfallImpact) * 10
      });
    }

    // Storage and supply factors
    if (crop.storageLife < 30 && forecastDays > crop.storageLife / 2) {
      factors.push({
        name: 'Limited storage life affecting supply',
        impact: 'positive', // Short storage life tends to increase prices
        weight: 0.3
      });
    }

    // Generate recommendation based on price trend
    let recommendation = '';
    if (priceChangePercentage > 10) {
      recommendation = `Prices for ${crop.name} are expected to rise significantly. Consider delaying sales if storage is available.`;
    } else if (priceChangePercentage > 5) {
      recommendation = `Prices for ${crop.name} are expected to rise moderately. Monitor market conditions closely.`;
    } else if (priceChangePercentage < -10) {
      recommendation = `Prices for ${crop.name} are expected to fall significantly. Consider selling soon or exploring value-added products.`;
    } else if (priceChangePercentage < -5) {
      recommendation = `Prices for ${crop.name} are expected to fall moderately. Consider forward contracts to lock in current prices.`;
    } else {
      recommendation = `Prices for ${crop.name} are expected to remain stable. Sell based on your storage capacity and quality considerations.`;
    }

    return {
      productId: crop.id,
      productName: crop.name,
      currentPrice,
      forecastedPrice,
      priceChangePercentage,
      forecastPeriod: {
        start: new Date().getTime(),
        end: forecastDate.getTime(),
      },
      factors,
      recommendation,
      confidenceLevel: 0.7 - (Math.abs(totalPriceChangeFactor) * 0.2) // Lower confidence for extreme predictions
    };
  }

  // Get market price forecasts for all crops or a specific crop
  async getMarketPriceForecasts(
    location: ProductLocation,
    cropId?: string,
    forecastDays: number = 30
  ): Promise<MarketPriceForecast[]> {
    try {
      // Get weather forecast - note that Open-Meteo has a 16-day limit
      // but we'll use whatever data we get for our predictions
      console.log('AIMarketForecastService: Getting weather forecast for market price predictions');
      const weatherForecast = await this.forecastService.getWeatherForecast(location, forecastDays);

      if (!weatherForecast || weatherForecast.length === 0) {
        console.error('AIMarketForecastService: No weather forecast data available');
        throw new Error('No weather forecast data available');
      }

      // We might get fewer days than requested due to API limitations, but that's OK
      console.log(`AIMarketForecastService: Received ${weatherForecast.length} days of weather forecast (requested: ${forecastDays})`);

      // We can still make predictions with the data we have
      const actualForecastDays = weatherForecast.length;

      // Calculate average weather conditions
      const avgTemperature = weatherForecast.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherForecast.length;
      const totalRainfall = weatherForecast.reduce((sum, day) => sum + day.precipitation.amount, 0);
      const avgHumidity = weatherForecast.reduce((sum, day) => sum + day.humidity, 0) / weatherForecast.length;

      console.log(`AIMarketForecastService: Weather analysis - Avg Temp: ${avgTemperature.toFixed(1)}°C, Total Rainfall: ${totalRainfall.toFixed(1)}mm, Avg Humidity: ${avgHumidity.toFixed(1)}%`);

      // Filter crops if cropId is provided
      const cropsToForecast = cropId
        ? cropMarketDatabase.filter(crop => crop.id === cropId)
        : cropMarketDatabase;

      // Generate forecasts
      const forecasts = cropsToForecast.map(crop =>
        this.calculateMarketPriceForecast(
          crop,
          avgTemperature,
          totalRainfall,
          avgHumidity,
          forecastDays
        )
      );

      return forecasts;
    } catch (error) {
      console.error('Error generating market price forecasts:', error);
      console.log('AIMarketForecastService: Returning empty forecasts array due to error');
      // Return an empty array when there's an error
      return [];
    }
  }
}

export default new AIMarketForecastService();
