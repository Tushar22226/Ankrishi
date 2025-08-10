import { ProductLocation } from './Product';

// Weather forecast interface
export interface WeatherForecast {
  date: number; // timestamp
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number; // percentage
  precipitation: {
    probability: number; // 0-1
    amount: number; // mm
  };
  windSpeed: number; // km/h
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  uvIndex: number;
  soilMoisture?: number; // percentage
}

// Market price forecast interface
export interface MarketPriceForecast {
  productId: string;
  productName: string;
  location: ProductLocation;
  currentPrice: number;
  forecastedPrice: number;
  priceChange: number;
  priceChangePercentage: number;
  forecastDate: number; // timestamp
  confidence: number; // 0-1
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
  waterRequirement: number; // mm
  growingPeriod: {
    start: number; // timestamp
    end: number; // timestamp
  };
  fertilizers: {
    name: string;
    quantity: number;
    unit: string;
    timing: string;
  }[];
  risks: {
    name: string;
    probability: number; // 0-1
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
  suitableSoilTypes: string[];
  idealTemperatureRange: {
    min: number;
    max: number;
  };
  idealRainfallRange: {
    min: number;
    max: number;
  };
  notes?: string;
}

// Pest forecast interface
export interface PestForecast {
  cropName: string;
  location: ProductLocation;
  pests: {
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
    probability: number; // 0-1
    expectedTimeframe: {
      start: number; // timestamp
      end: number; // timestamp
    };
    affectedCropStage: string;
    symptoms: string[];
    preventiveMeasures: string[];
    treatments: {
      name: string;
      type: 'chemical' | 'biological' | 'cultural';
      effectiveness: number; // 0-1
      applicationMethod: string;
    }[];
  }[];
  forecastDate: number; // timestamp
  validityPeriod: number; // days
}

// Disease forecast interface
export interface DiseaseForecast {
  cropName: string;
  location: ProductLocation;
  diseases: {
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
    probability: number; // 0-1
    expectedTimeframe: {
      start: number; // timestamp
      end: number; // timestamp
    };
    affectedCropStage: string;
    symptoms: string[];
    preventiveMeasures: string[];
    treatments: {
      name: string;
      type: 'chemical' | 'biological' | 'cultural';
      effectiveness: number; // 0-1
      applicationMethod: string;
    }[];
  }[];
  forecastDate: number; // timestamp
  validityPeriod: number; // days
}

// Irrigation recommendation interface
export interface IrrigationRecommendation {
  cropName: string;
  location: ProductLocation;
  currentSoilMoisture: number; // percentage
  recommendedIrrigation: {
    amount: number; // mm
    timing: number; // timestamp
    duration: number; // minutes
    method: 'drip' | 'sprinkler' | 'flood' | 'furrow';
  };
  nextIrrigationDate: number; // timestamp
  waterSavingTips: string[];
  forecastDate: number; // timestamp
}

// Fertilizer recommendation interface
export interface FertilizerRecommendation {
  cropName: string;
  location: ProductLocation;
  soilType?: string;
  soilNutrients?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    organicMatter: number;
  };
  recommendedFertilizers: {
    name: string;
    type: 'organic' | 'chemical' | 'biofertilizer';
    nutrientContent: {
      nitrogen?: number;
      phosphorus?: number;
      potassium?: number;
      other?: Record<string, number>;
    };
    quantity: number;
    unit: string;
    applicationMethod: string;
    timing: number; // timestamp
  }[];
  forecastDate: number; // timestamp
}
