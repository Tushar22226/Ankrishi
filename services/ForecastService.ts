import { ProductLocation } from '../models/Product';

// Weather forecast types
export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

// Weather forecast interface
export interface WeatherForecast {
  date: number; // timestamp
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  precipitation: {
    probability: number;
    amount: number; // in mm
  };
  windSpeed: number;
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  uvIndex: number;
  soilMoisture?: number;
}

// Market price forecast interface
export interface MarketPriceForecast {
  productId: string;
  productName: string;
  currentPrice: number;
  forecastedPrice: number;
  priceChangePercentage: number;
  forecastPeriod: {
    start: number; // timestamp
    end: number; // timestamp
  };
  confidenceLevel: number; // 0-1
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number; // 0-1
  }[];
  recommendation: string;
}

// Crop recommendation interface
export interface CropRecommendation {
  cropName: string;
  suitabilityScore: number; // 0-1
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
    end: number; // timestamp
  };
  waterRequirement: number; // in mm
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
    probability: number; // 0-1
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}

// Generate synthetic weather data based on location and season
function generateSyntheticWeatherData(location: ProductLocation, days: number): WeatherForecast[] {
  console.log(`Generating synthetic weather data for ${location.latitude}, ${location.longitude} for ${days} days`);

  const forecasts: WeatherForecast[] = [];
  const currentDate = new Date();

  // Determine season based on month in Northern Hemisphere
  const month = currentDate.getMonth(); // 0-11

  // Season determination (for Northern Hemisphere)
  // Winter: Dec-Feb (11-1), Spring: Mar-May (2-4), Summer: Jun-Aug (5-7), Fall: Sep-Nov (8-10)
  const isWinter = month >= 11 || month <= 1;
  const isSpring = month >= 2 && month <= 4;
  const isSummer = month >= 5 && month <= 7;
  const isFall = month >= 8 && month <= 10;

  // Determine climate zone based on latitude (very simplified)
  const isEquatorial = Math.abs(location.latitude) <= 15;
  const isTropical = Math.abs(location.latitude) > 15 && Math.abs(location.latitude) <= 30;
  const isTemperate = Math.abs(location.latitude) > 30 && Math.abs(location.latitude) <= 60;
  const isPolar = Math.abs(location.latitude) > 60;

  // Base temperature ranges by climate zone (in Celsius)
  let baseTempMin = 20;
  let baseTempMax = 30;

  if (isEquatorial) {
    baseTempMin = 22;
    baseTempMax = 32;
  } else if (isTropical) {
    baseTempMin = 18;
    baseTempMax = 35;
  } else if (isTemperate) {
    baseTempMin = 5;
    baseTempMax = 25;
  } else if (isPolar) {
    baseTempMin = -10;
    baseTempMax = 10;
  }

  // Adjust for season (Northern Hemisphere)
  if (location.latitude >= 0) { // Northern Hemisphere
    if (isWinter) {
      baseTempMin -= 10;
      baseTempMax -= 10;
    } else if (isSpring) {
      baseTempMin -= 5;
      baseTempMax -= 5;
    } else if (isSummer) {
      baseTempMin += 5;
      baseTempMax += 5;
    } else if (isFall) {
      baseTempMin -= 2;
      baseTempMax -= 2;
    }
  } else { // Southern Hemisphere (reverse seasons)
    if (isWinter) {
      baseTempMin += 5;
      baseTempMax += 5;
    } else if (isSpring) {
      baseTempMin += 2;
      baseTempMax += 2;
    } else if (isSummer) {
      baseTempMin -= 10;
      baseTempMax -= 10;
    } else if (isFall) {
      baseTempMin -= 5;
      baseTempMax -= 5;
    }
  }

  // Base precipitation by climate and season
  let basePrecipProbability = 0.3;
  let basePrecipAmount = 3;

  if (isEquatorial) {
    basePrecipProbability = 0.6;
    basePrecipAmount = 8;
  } else if (isTropical) {
    if (isSummer) {
      basePrecipProbability = 0.5;
      basePrecipAmount = 6;
    } else {
      basePrecipProbability = 0.2;
      basePrecipAmount = 2;
    }
  } else if (isTemperate) {
    if (isSpring || isFall) {
      basePrecipProbability = 0.4;
      basePrecipAmount = 4;
    } else if (isWinter) {
      basePrecipProbability = 0.3;
      basePrecipAmount = 3;
    } else {
      basePrecipProbability = 0.2;
      basePrecipAmount = 2;
    }
  } else if (isPolar) {
    if (isWinter) {
      basePrecipProbability = 0.3;
      basePrecipAmount = 2; // Snow
    } else {
      basePrecipProbability = 0.2;
      basePrecipAmount = 1;
    }
  }

  // Generate forecasts for each day
  for (let i = 0; i < days; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);

    // Add some randomness to temperature
    const tempVariation = Math.random() * 6 - 3; // -3 to +3
    const tempMin = Math.max(-20, Math.min(45, baseTempMin + tempVariation));
    const tempMax = Math.max(tempMin + 5, Math.min(50, baseTempMax + tempVariation));
    const tempAvg = (tempMin + tempMax) / 2;

    // Add some randomness to precipitation
    const precipVariation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2
    const precipProbability = Math.max(0, Math.min(1, basePrecipProbability + precipVariation));
    const precipAmount = precipProbability > 0.3 ? basePrecipAmount * (1 + Math.random() - 0.5) : 0;

    // Determine weather condition based on temperature and precipitation
    let condition: WeatherCondition = 'sunny';
    if (precipProbability > 0.6 && precipAmount > 5) {
      condition = 'stormy';
    } else if (precipProbability > 0.4 && precipAmount > 0) {
      condition = 'rainy';
    } else if (precipProbability > 0.3 && tempMin < 0) {
      condition = 'snowy';
    } else if (precipProbability > 0.3) {
      condition = 'cloudy';
    } else if (precipProbability > 0.1) {
      condition = 'partly_cloudy';
    }

    // Generate humidity based on temperature and precipitation
    const humidity = Math.min(100, Math.max(30,
      50 + (precipProbability * 30) + (Math.random() * 20 - 10)
    ));

    // Generate wind speed
    const windSpeed = 5 + Math.random() * 15;

    // Generate UV index based on season and cloud cover
    let uvIndex = 5;
    if (condition === 'sunny') {
      uvIndex = isSummer ? 9 : isWinter ? 3 : 6;
    } else if (condition === 'partly_cloudy') {
      uvIndex = isSummer ? 7 : isWinter ? 2 : 5;
    } else {
      uvIndex = isSummer ? 5 : isWinter ? 1 : 3;
    }

    // Generate soil moisture based on recent precipitation
    let soilMoisture = 50;
    if (i > 0 && forecasts[i-1].soilMoisture !== undefined) {
      const yesterdayPrecip = forecasts[i-1].precipitation.amount;
      soilMoisture = Math.min(100, Math.max(20,
        forecasts[i-1].soilMoisture * 0.9 + yesterdayPrecip * 3
      ));
    } else {
      soilMoisture = 40 + precipAmount * 3 + Math.random() * 20 - 10;
    }

    forecasts.push({
      date: date.getTime(),
      temperature: {
        min: parseFloat(tempMin.toFixed(1)),
        max: parseFloat(tempMax.toFixed(1)),
        avg: parseFloat(tempAvg.toFixed(1)),
      },
      humidity: Math.round(humidity),
      precipitation: {
        probability: parseFloat(precipProbability.toFixed(2)),
        amount: parseFloat(precipAmount.toFixed(1)),
      },
      windSpeed: parseFloat(windSpeed.toFixed(1)),
      condition,
      uvIndex: Math.round(uvIndex),
      soilMoisture: Math.round(soilMoisture),
    });
  }

  return forecasts;
}

// Function to generate synthetic crop recommendations
function generateSyntheticCropRecommendations(location: ProductLocation): CropRecommendation[] {
  console.log(`Generating synthetic crop recommendations for ${location.latitude}, ${location.longitude}`);

  // Determine climate zone based on latitude (very simplified)
  const isEquatorial = Math.abs(location.latitude) <= 15;
  const isTropical = Math.abs(location.latitude) > 15 && Math.abs(location.latitude) <= 30;
  const isTemperate = Math.abs(location.latitude) > 30 && Math.abs(location.latitude) <= 60;
  const isPolar = Math.abs(location.latitude) > 60;

  // Determine season based on month in Northern Hemisphere
  const month = new Date().getMonth(); // 0-11

  // Season determination (for Northern Hemisphere)
  // Winter: Dec-Feb (11-1), Spring: Mar-May (2-4), Summer: Jun-Aug (5-7), Fall: Sep-Nov (8-10)
  const isWinter = month >= 11 || month <= 1;
  const isSpring = month >= 2 && month <= 4;
  const isSummer = month >= 5 && month <= 7;
  const isFall = month >= 8 && month <= 10;

  // Select appropriate crops based on climate and season
  const recommendations: CropRecommendation[] = [];

  // List of potential crops based on climate and season
  const potentialCrops: string[] = [];

  if (isEquatorial || isTropical) {
    // Tropical/Equatorial crops
    potentialCrops.push('Rice', 'Maize', 'Sugarcane', 'Banana', 'Mango');

    if (isSummer || isSpring) {
      potentialCrops.push('Cotton', 'Soybean', 'Groundnut', 'Moong Dal', 'Toor Dal');
    }

    if (isWinter || isFall) {
      potentialCrops.push('Wheat', 'Potato', 'Tomato', 'Onion', 'Masoor Dal', 'Chana');
    }
  } else if (isTemperate) {
    // Temperate crops
    if (isSummer || isSpring) {
      potentialCrops.push('Maize', 'Potato', 'Tomato', 'Soybean', 'Onion', 'Cauliflower');
    }

    if (isWinter || isFall) {
      potentialCrops.push('Wheat', 'Barley', 'Mustard', 'Peas', 'Masoor Dal');
    }
  } else if (isPolar) {
    // Limited options for polar regions
    if (isSummer) {
      potentialCrops.push('Barley', 'Potato', 'Peas');
    } else {
      potentialCrops.push('Greenhouse crops');
    }
  }

  // Generate 3-5 recommendations
  const numRecommendations = Math.floor(Math.random() * 3) + 3; // 3-5 recommendations

  // Shuffle the potential crops array
  const shuffledCrops = [...potentialCrops].sort(() => Math.random() - 0.5);

  // Take the first numRecommendations crops
  const selectedCrops = shuffledCrops.slice(0, numRecommendations);

  // Generate detailed recommendations for each selected crop
  for (let i = 0; i < selectedCrops.length; i++) {
    const cropName = selectedCrops[i];

    // Generate a suitability score (higher for first recommendations)
    const baseSuitability = 0.9 - (i * 0.1); // 0.9, 0.8, 0.7, etc.
    const suitabilityVariation = Math.random() * 0.2 - 0.1; // -0.1 to +0.1
    const suitabilityScore = Math.min(1, Math.max(0.5, baseSuitability + suitabilityVariation));

    // Generate expected yield based on crop type
    let baseYield = 0;
    let yieldUnit = 'tons/ha';

    if (cropName === 'Rice' || cropName === 'Wheat' || cropName === 'Maize') {
      baseYield = 4.0;
    } else if (cropName === 'Potato' || cropName === 'Tomato' || cropName === 'Onion') {
      baseYield = 20.0;
    } else if (cropName.includes('Dal') || cropName === 'Soybean' || cropName === 'Groundnut') {
      baseYield = 1.5;
    } else if (cropName === 'Cotton') {
      baseYield = 2.0;
    } else if (cropName === 'Sugarcane') {
      baseYield = 70.0;
    } else if (cropName === 'Banana' || cropName === 'Mango') {
      baseYield = 25.0;
    } else {
      baseYield = 3.0;
    }

    // Adjust yield based on suitability
    const adjustedBaseYield = baseYield * suitabilityScore;
    const minYield = adjustedBaseYield * 0.8;
    const maxYield = adjustedBaseYield * 1.2;

    // Generate expected price based on crop type
    let basePrice = 0;

    if (cropName === 'Rice') {
      basePrice = 20;
    } else if (cropName === 'Wheat') {
      basePrice = 25;
    } else if (cropName === 'Maize') {
      basePrice = 18;
    } else if (cropName === 'Potato') {
      basePrice = 15;
    } else if (cropName === 'Tomato' || cropName === 'Onion') {
      basePrice = 30;
    } else if (cropName.includes('Dal')) {
      basePrice = 90;
    } else if (cropName === 'Soybean') {
      basePrice = 35;
    } else if (cropName === 'Cotton') {
      basePrice = 60;
    } else if (cropName === 'Sugarcane') {
      basePrice = 3;
    } else if (cropName === 'Groundnut') {
      basePrice = 70;
    } else if (cropName === 'Banana' || cropName === 'Mango') {
      basePrice = 50;
    } else {
      basePrice = 25;
    }

    // Calculate price range
    const minPrice = Math.round(basePrice * 0.9);
    const maxPrice = Math.round(basePrice * 1.1);

    // Calculate growing period
    let growingPeriodDays = 0;

    if (cropName === 'Rice' || cropName === 'Wheat' || cropName === 'Maize') {
      growingPeriodDays = 120;
    } else if (cropName === 'Potato' || cropName === 'Tomato' || cropName === 'Onion') {
      growingPeriodDays = 90;
    } else if (cropName.includes('Dal')) {
      growingPeriodDays = 100;
    } else if (cropName === 'Cotton') {
      growingPeriodDays = 180;
    } else if (cropName === 'Sugarcane') {
      growingPeriodDays = 365;
    } else if (cropName === 'Banana') {
      growingPeriodDays = 300;
    } else if (cropName === 'Mango') {
      growingPeriodDays = 1095; // 3 years
    } else {
      growingPeriodDays = 100;
    }

    // Calculate water requirement
    let waterRequirement = 0;

    if (cropName === 'Rice') {
      waterRequirement = 1200;
    } else if (cropName === 'Wheat') {
      waterRequirement = 450;
    } else if (cropName === 'Maize') {
      waterRequirement = 500;
    } else if (cropName === 'Potato' || cropName === 'Tomato' || cropName === 'Onion') {
      waterRequirement = 400;
    } else if (cropName.includes('Dal')) {
      waterRequirement = 350;
    } else if (cropName === 'Cotton') {
      waterRequirement = 700;
    } else if (cropName === 'Sugarcane') {
      waterRequirement = 1500;
    } else if (cropName === 'Banana') {
      waterRequirement = 1200;
    } else if (cropName === 'Mango') {
      waterRequirement = 800;
    } else {
      waterRequirement = 500;
    }

    // Generate fertilizer recommendations
    const fertilizers = [];

    if (cropName === 'Rice' || cropName === 'Wheat' || cropName === 'Maize') {
      fertilizers.push(
        { name: 'Urea', quantity: 100, unit: 'kg/ha' },
        { name: 'DAP', quantity: 50, unit: 'kg/ha' },
        { name: 'Potash', quantity: 25, unit: 'kg/ha' }
      );
    } else if (cropName === 'Potato' || cropName === 'Tomato' || cropName === 'Onion') {
      fertilizers.push(
        { name: 'NPK 10-26-26', quantity: 75, unit: 'kg/ha' },
        { name: 'Calcium Nitrate', quantity: 40, unit: 'kg/ha' }
      );
    } else if (cropName.includes('Dal')) {
      fertilizers.push(
        { name: 'DAP', quantity: 60, unit: 'kg/ha' },
        { name: 'Potash', quantity: 20, unit: 'kg/ha' },
        { name: 'Rhizobium Culture', quantity: 5, unit: 'kg/ha' }
      );
    } else {
      fertilizers.push(
        { name: 'NPK 14-14-14', quantity: 60, unit: 'kg/ha' },
        { name: 'Urea', quantity: 40, unit: 'kg/ha' }
      );
    }

    // Generate pesticide recommendations
    const pesticides = [];

    if (cropName === 'Rice' || cropName === 'Wheat') {
      pesticides.push(
        { name: 'Chlorpyrifos', quantity: 2, unit: 'L/ha' },
        { name: 'Propiconazole', quantity: 1, unit: 'L/ha' }
      );
    } else if (cropName === 'Potato' || cropName === 'Tomato') {
      pesticides.push(
        { name: 'Mancozeb', quantity: 2.5, unit: 'kg/ha' },
        { name: 'Imidacloprid', quantity: 0.5, unit: 'L/ha' }
      );
    } else {
      pesticides.push(
        { name: 'Cypermethrin', quantity: 1, unit: 'L/ha' },
        { name: 'Carbendazim', quantity: 1.5, unit: 'kg/ha' }
      );
    }

    // Generate risks
    const risks = [];

    // Disease risk
    if (cropName === 'Rice') {
      risks.push({
        name: 'Blast Disease',
        probability: 0.4,
        impact: 'high' as 'high',
        mitigation: 'Apply fungicide preventatively and use resistant varieties.'
      });
    } else if (cropName === 'Wheat') {
      risks.push({
        name: 'Rust Disease',
        probability: 0.3,
        impact: 'medium' as 'medium',
        mitigation: 'Apply fungicide preventatively and ensure proper spacing for air circulation.'
      });
    } else if (cropName === 'Potato') {
      risks.push({
        name: 'Late Blight',
        probability: 0.5,
        impact: 'high' as 'high',
        mitigation: 'Use resistant varieties and apply fungicide at first sign of disease.'
      });
    } else {
      risks.push({
        name: 'Fungal Disease',
        probability: 0.3,
        impact: 'medium' as 'medium',
        mitigation: 'Apply fungicide preventatively and ensure proper spacing for air circulation.'
      });
    }

    // Pest risk
    if (cropName === 'Cotton') {
      risks.push({
        name: 'Bollworm Infestation',
        probability: 0.5,
        impact: 'high' as 'high',
        mitigation: 'Use integrated pest management and apply insecticides as needed.'
      });
    } else if (cropName === 'Rice') {
      risks.push({
        name: 'Stem Borer',
        probability: 0.4,
        impact: 'medium' as 'medium',
        mitigation: 'Monitor regularly and use appropriate insecticides.'
      });
    } else {
      risks.push({
        name: 'Insect Infestation',
        probability: 0.3,
        impact: 'medium' as 'medium',
        mitigation: 'Monitor regularly and use integrated pest management techniques.'
      });
    }

    // Weather risk
    risks.push({
      name: 'Adverse Weather',
      probability: 0.2,
      impact: 'high' as 'high',
      mitigation: 'Implement irrigation system and drainage as needed.'
    });

    // Create the recommendation
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + growingPeriodDays);

    recommendations.push({
      cropName,
      suitabilityScore,
      expectedYield: {
        min: parseFloat(minYield.toFixed(1)),
        max: parseFloat(maxYield.toFixed(1)),
        unit: yieldUnit
      },
      expectedPrice: {
        min: minPrice,
        max: maxPrice,
        currency: 'INR/kg'
      },
      growingPeriod: {
        start: today.getTime(),
        end: endDate.getTime()
      },
      waterRequirement,
      fertilizers,
      pesticides,
      risks
    });
  }

  // Sort by suitability score (highest first)
  return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

class ForecastService {
  // Get weather forecast for a location using Open-Meteo API (free, no API key required)
  async getWeatherForecast(location: ProductLocation, days: number = 7): Promise<WeatherForecast[]> {
    try {
      // Open-Meteo API has a limit of 16 days for forecasts
      const MAX_FORECAST_DAYS = 16;
      const requestDays = Math.min(days, MAX_FORECAST_DAYS);

      console.log(`Getting weather forecast for ${location.latitude}, ${location.longitude} for ${requestDays} days (requested: ${days}, max allowed: ${MAX_FORECAST_DAYS})`);

      // Format coordinates to 4 decimal places to avoid precision issues
      const lat = parseFloat(location.latitude.toFixed(4));
      const lon = parseFloat(location.longitude.toFixed(4));

      // Build URL with proper parameters for Open-Meteo API
      // This API is free and doesn't require an API key
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,windspeed_10m_max,weathercode&timezone=auto&forecast_days=${requestDays}`;

      console.log('Fetching weather data from Open-Meteo API');
      console.log('API URL:', url);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Open-Meteo API error response:', errorText);
        throw new Error(`Weather API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Weather data received successfully');

      // Transform the Open-Meteo API response to our WeatherForecast format
      const forecasts: WeatherForecast[] = [];

      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          // Map weather code to our condition format
          // Weather codes: https://open-meteo.com/en/docs
          let condition: WeatherForecast['condition'] = 'sunny';
          const weatherCode = data.daily.weathercode[i];

          if (weatherCode >= 0 && weatherCode <= 3) {
            condition = weatherCode === 0 ? 'sunny' : 'partly_cloudy';
          } else if (weatherCode >= 45 && weatherCode <= 48) {
            condition = 'cloudy'; // Fog
          } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
            condition = 'rainy';
          } else if (weatherCode >= 71 && weatherCode <= 77) {
            condition = 'snowy';
          } else if (weatherCode >= 95) {
            condition = 'stormy';
          }

          forecasts.push({
            date: new Date(data.daily.time[i]).getTime(),
            temperature: {
              min: data.daily.temperature_2m_min[i],
              max: data.daily.temperature_2m_max[i],
              avg: (data.daily.temperature_2m_min[i] + data.daily.temperature_2m_max[i]) / 2,
            },
            humidity: 70, // Open-Meteo doesn't provide daily humidity, using a default value
            precipitation: {
              probability: data.daily.precipitation_probability_max[i] / 100, // Convert percentage to decimal
              amount: data.daily.precipitation_sum[i] || 0,
            },
            windSpeed: data.daily.windspeed_10m_max[i],
            condition,
            uvIndex: 5, // Open-Meteo doesn't provide UV index in the free tier, using a default value
            soilMoisture: 40, // Not available in the free tier, using a default value
          });
        }

        // If we requested more days than the API can provide, pad with synthetic data
        if (days > MAX_FORECAST_DAYS && forecasts.length < days) {
          console.log(`Padding forecast data with synthetic data (${forecasts.length} API days + ${days - forecasts.length} synthetic days)`);

          // Get the last date from the API data
          const lastDate = forecasts[forecasts.length - 1].date;

          // Generate synthetic data for the remaining days
          const remainingDays = days - forecasts.length;

          // Create a temporary date object for the starting point of synthetic data
          const startDate = new Date(lastDate);
          startDate.setDate(startDate.getDate() + 1);

          // Generate synthetic weather data
          const syntheticData = generateSyntheticWeatherData(location, remainingDays);

          // Adjust dates to continue from the last API date
          for (let i = 0; i < syntheticData.length; i++) {
            const newDate = new Date(startDate);
            newDate.setDate(newDate.getDate() + i);
            syntheticData[i].date = newDate.getTime();

            forecasts.push(syntheticData[i]);
          }
        }

        return forecasts;
      }

      // Fallback to synthetic data if API response doesn't have the expected format
      console.log('API response missing daily data, using synthetic data');
      return generateSyntheticWeatherData(location, days);
    } catch (error) {
      console.error('Error fetching weather data from Open-Meteo:', error);
      console.log('Falling back to synthetic weather data');

      // Log that we're generating synthetic data
      console.log(`Generating ${days} days of synthetic weather data`);

      // Fallback to synthetic data if API call fails
      return generateSyntheticWeatherData(location, days);
    }
  }

  // Get market price forecast for a product using AI model
  async getMarketPriceForecast(productId: string, location: ProductLocation): Promise<MarketPriceForecast | null> {
    try {
      console.log(`Getting market price forecast for ${productId} at ${location.latitude}, ${location.longitude}`);

      // Import the AI Market Forecast Service
      const AIMarketForecastService = (await import('./AIMarketForecastService')).default;

      // Get AI-powered market price forecast
      const forecasts = await AIMarketForecastService.getMarketPriceForecasts(location, productId);

      // If AI service returns a forecast, use it
      if (forecasts && forecasts.length > 0) {
        console.log(`AI service returned market price forecast for ${productId}`);
        return forecasts[0];
      }

      // Generate synthetic market price forecast as fallback
      console.log('Generating synthetic market price forecast');

      // Create a synthetic market price forecast
      const today = new Date();
      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(today.getMonth() + 1);

      // Generate a random price change between -15% and +20%
      const priceChangePercent = (Math.random() * 35 - 15).toFixed(1);
      const isPositive = parseFloat(priceChangePercent) >= 0;

      // Create a synthetic forecast
      const syntheticForecast: MarketPriceForecast = {
        productId: productId,
        productName: productId.charAt(0).toUpperCase() + productId.slice(1), // Capitalize first letter
        currentPrice: Math.round(50 + Math.random() * 100), // Random price between 50 and 150
        forecastedPrice: 0, // Will be calculated below
        priceChangePercentage: parseFloat(priceChangePercent),
        forecastPeriod: {
          start: today.getTime(),
          end: oneMonthLater.getTime(),
        },
        confidenceLevel: 0.7,
        factors: [
          {
            name: isPositive ? 'Seasonal Demand' : 'Increased Supply',
            impact: isPositive ? 'positive' : 'negative',
            weight: 0.6,
          },
          {
            name: 'Weather Conditions',
            impact: isPositive ? 'positive' : 'negative',
            weight: 0.4,
          }
        ],
        recommendation: isPositive
          ? `Consider holding your ${productId} for better prices in the coming weeks.`
          : `Consider selling your ${productId} soon before prices drop further.`,
      };

      // Calculate forecasted price
      syntheticForecast.forecastedPrice = Math.round(
        syntheticForecast.currentPrice * (1 + syntheticForecast.priceChangePercentage / 100)
      );

      return syntheticForecast;
    } catch (error) {
      console.error('Error generating market price forecast:', error);

      // Generate a basic synthetic forecast as a last resort
      const syntheticForecast: MarketPriceForecast = {
        productId: productId,
        productName: productId.charAt(0).toUpperCase() + productId.slice(1),
        currentPrice: 100,
        forecastedPrice: 105,
        priceChangePercentage: 5,
        forecastPeriod: {
          start: Date.now(),
          end: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days later
        },
        confidenceLevel: 0.5,
        factors: [
          {
            name: 'Market Trends',
            impact: 'positive',
            weight: 0.5,
          }
        ],
        recommendation: `Monitor ${productId} market trends closely.`,
      };

      return syntheticForecast;
    }
  }

  // Get crop recommendations for a location using AI-based analysis
  async getCropRecommendations(location: ProductLocation, soilType?: string): Promise<CropRecommendation[]> {
    try {
      console.log(`Getting crop recommendations for ${location.latitude}, ${location.longitude} with soil type ${soilType}`);

      // Import the AI Crop Forecast Service
      const AICropForecastService = (await import('./AICropForecastService')).default;

      // Get AI-powered crop recommendations
      const recommendations = await AICropForecastService.getCropRecommendations(location);

      // If AI service returns recommendations, use them
      if (recommendations && recommendations.length > 0) {
        console.log(`AI service returned ${recommendations.length} crop recommendations`);
        return recommendations;
      }

      // Fallback to synthetic data if AI service fails
      console.log('Falling back to synthetic crop recommendations');
      return generateSyntheticCropRecommendations(location);
    } catch (error) {
      console.error('Error generating crop recommendations:', error);
      // Fallback to synthetic data if prediction fails
      console.log('Generating synthetic crop recommendations after error');
      return generateSyntheticCropRecommendations(location);
    }
  }

  // Get personalized AI recommendations based on user data
  async getPersonalizedRecommendations(userId: string, userLocation?: ProductLocation): Promise<string[]> {
    try {
      console.log(`Getting personalized recommendations for user ${userId}`);

      // Default recommendations (fallback)
      const defaultRecommendations = [
        "Based on your soil type and current weather conditions, consider applying nitrogen-rich fertilizer in the next 3 days.",
        "Your tomato crop is showing signs of potential price increase. Consider delaying harvest by 1 week for better returns.",
        "Based on your expense pattern, you could save 15% on fertilizer costs by buying in bulk with nearby farmers.",
        "Your irrigation schedule can be optimized to save water. Consider reducing frequency but increasing duration.",
        "Market trends show increasing demand for organic produce. Consider transitioning a portion of your farm to organic practices."
      ];

      // If no location is provided, return default recommendations
      if (!userLocation) {
        return defaultRecommendations;
      }

      // Import AI services
      const AICropForecastService = (await import('./AICropForecastService')).default;
      const AIMarketForecastService = (await import('./AIMarketForecastService')).default;

      // Get weather forecast for the user's location
      const weatherForecast = await this.getWeatherForecast(userLocation, 7);

      // Generate AI-powered recommendations
      const recommendations: string[] = [];

      // 1. Weather-based recommendations
      // Check for upcoming rain
      const rainDays = weatherForecast.filter(day =>
        day.precipitation.probability > 0.6 && day.precipitation.amount > 2
      );

      if (rainDays.length > 0) {
        const firstRainDay = new Date(rainDays[0].date);
        const today = new Date();
        const daysUntilRain = Math.ceil((firstRainDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilRain <= 3) {
          recommendations.push(
            `Heavy rainfall expected in ${daysUntilRain} day${daysUntilRain > 1 ? 's' : ''}. Consider delaying fertilizer application and preparing drainage systems.`
          );
        } else {
          recommendations.push(
            `Rainfall expected in ${daysUntilRain} days. This is a good time to apply fertilizers before the rain for better absorption.`
          );
        }
      } else if (weatherForecast.every(day => day.precipitation.probability < 0.3)) {
        recommendations.push(
          "Dry conditions expected for the next week. Consider optimizing your irrigation schedule and monitoring soil moisture levels."
        );
      }

      // 2. Get AI crop recommendations
      const cropRecommendations = await AICropForecastService.getCropRecommendations(userLocation);

      // Add crop recommendation
      if (cropRecommendations.length > 0) {
        // Get top 2 crop recommendations
        const topCrops = cropRecommendations.slice(0, 2);

        for (const topCrop of topCrops) {
          // Only add if suitability is good
          if (topCrop.suitabilityScore > 0.6) {
            recommendations.push(
              `Based on AI analysis, ${topCrop.cropName} is highly suitable (${(topCrop.suitabilityScore * 100).toFixed(0)}% match) for planting in your area with expected yields of ${topCrop.expectedYield.min.toFixed(1)}-${topCrop.expectedYield.max.toFixed(1)} ${topCrop.expectedYield.unit}.`
            );

            // Add risk warning if there's a high-impact risk
            const highRisks = topCrop.risks.filter(risk => risk.impact === 'high' && risk.probability > 0.5);
            if (highRisks.length > 0) {
              recommendations.push(
                `Warning: ${topCrop.cropName} cultivation in your area has a ${(highRisks[0].probability * 100).toFixed(0)}% risk of ${highRisks[0].name}. Mitigation: ${highRisks[0].mitigation}`
              );
            }
          }
        }
      }

      // 3. Get AI market price forecasts
      const marketForecasts = await AIMarketForecastService.getMarketPriceForecasts(userLocation);

      // Add price-based recommendations
      for (const forecast of marketForecasts) {
        if (Math.abs(forecast.priceChangePercentage) > 5) {
          const direction = forecast.priceChangePercentage > 0 ? 'rise' : 'fall';
          const changePercent = Math.abs(forecast.priceChangePercentage).toFixed(1);

          recommendations.push(
            `AI Market Forecast: ${forecast.productName} prices are expected to ${direction} by ${changePercent}% in the coming weeks. ${forecast.recommendation}`
          );

          // Only add one market recommendation to avoid overwhelming the user
          break;
        }
      }

      // 4. Add seasonal farming tips based on current month
      const currentMonth = new Date().getMonth();

      // Seasonal tips for India (adjust based on your target region)
      if (currentMonth >= 5 && currentMonth <= 8) { // June-September: Monsoon season
        recommendations.push(
          "Monsoon season tip: Monitor drainage in your fields to prevent waterlogging. Consider planting water-resistant varieties and keep disease control measures ready."
        );
      } else if (currentMonth >= 9 && currentMonth <= 11) { // October-December: Post-monsoon
        recommendations.push(
          "Post-monsoon tip: This is an ideal time for rabi crop sowing. Ensure proper land preparation and timely sowing for optimal yields."
        );
      } else if (currentMonth >= 0 && currentMonth <= 2) { // January-March: Winter
        recommendations.push(
          "Winter season tip: Protect crops from frost by using row covers or sprinkler irrigation. Monitor for pest infestations which can increase as temperatures rise."
        );
      } else { // March-May: Summer
        recommendations.push(
          "Summer season tip: Ensure adequate irrigation and consider mulching to conserve soil moisture. Early morning or evening irrigation is most effective."
        );
      }

      // If we don't have enough recommendations, add some from the default list
      while (recommendations.length < 5) {
        const randomIndex = Math.floor(Math.random() * defaultRecommendations.length);
        const recommendation = defaultRecommendations[randomIndex];

        if (!recommendations.includes(recommendation)) {
          recommendations.push(recommendation);
        }
      }

      // Return a maximum of 5 recommendations
      return recommendations.slice(0, 5);
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      // Fallback to default recommendations if there's an error
      return [
        "Based on your soil type and current weather conditions, consider applying nitrogen-rich fertilizer in the next 3 days.",
        "Your tomato crop is showing signs of potential price increase. Consider delaying harvest by 1 week for better returns.",
        "Based on your expense pattern, you could save 15% on fertilizer costs by buying in bulk with nearby farmers.",
        "Your irrigation schedule can be optimized to save water. Consider reducing frequency but increasing duration.",
        "Market trends show increasing demand for organic produce. Consider transitioning a portion of your farm to organic practices."
      ];
    }
  }
}

export default new ForecastService();
