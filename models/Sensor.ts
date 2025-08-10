// Sensor data models for FarmConnect app

// Sensor types
export type SensorType = 
  | 'soil_moisture' 
  | 'soil_temperature' 
  | 'soil_ph' 
  | 'soil_npk' 
  | 'air_temperature' 
  | 'air_humidity' 
  | 'light_intensity' 
  | 'rainfall' 
  | 'water_level' 
  | 'water_ph' 
  | 'water_ec';

// Sensor descriptions and normal ranges
export const SensorInfo: Record<SensorType, {
  name: string;
  description: string;
  unit: string;
  normalRange: {
    min: number;
    max: number;
  };
  icon: string; // Ionicons name
  color: string;
}> = {
  soil_moisture: {
    name: 'Soil Moisture',
    description: 'Measures the water content in soil, helping farmers optimize irrigation and prevent water stress or waterlogging in crops.',
    unit: '%',
    normalRange: { min: 20, max: 60 },
    icon: 'water-outline',
    color: '#3498db'
  },
  soil_temperature: {
    name: 'Soil Temperature',
    description: 'Monitors soil temperature which affects seed germination, root growth, and microbial activity in the soil.',
    unit: '°C',
    normalRange: { min: 15, max: 35 },
    icon: 'thermometer-outline',
    color: '#e74c3c'
  },
  soil_ph: {
    name: 'Soil pH',
    description: 'Measures soil acidity or alkalinity, which affects nutrient availability to plants and overall soil health.',
    unit: 'pH',
    normalRange: { min: 5.5, max: 7.5 },
    icon: 'flask-outline',
    color: '#9b59b6'
  },
  soil_npk: {
    name: 'Soil NPK',
    description: 'Measures levels of essential nutrients (Nitrogen, Phosphorus, Potassium) in soil, helping optimize fertilizer application.',
    unit: 'ppm',
    normalRange: { min: 100, max: 300 },
    icon: 'leaf-outline',
    color: '#2ecc71'
  },
  air_temperature: {
    name: 'Air Temperature',
    description: 'Monitors ambient temperature which affects plant growth, development, and stress responses.',
    unit: '°C',
    normalRange: { min: 15, max: 35 },
    icon: 'thermometer-outline',
    color: '#f39c12'
  },
  air_humidity: {
    name: 'Air Humidity',
    description: 'Measures atmospheric moisture which affects plant transpiration, disease pressure, and overall crop health.',
    unit: '%',
    normalRange: { min: 40, max: 80 },
    icon: 'water-outline',
    color: '#3498db'
  },
  light_intensity: {
    name: 'Light Intensity',
    description: 'Measures sunlight levels which affect photosynthesis, flowering, and overall plant growth.',
    unit: 'lux',
    normalRange: { min: 10000, max: 50000 },
    icon: 'sunny-outline',
    color: '#f1c40f'
  },
  rainfall: {
    name: 'Rainfall',
    description: 'Measures precipitation which affects irrigation needs, soil moisture, and potential for erosion or flooding.',
    unit: 'mm',
    normalRange: { min: 0, max: 50 },
    icon: 'rainy-outline',
    color: '#3498db'
  },
  water_level: {
    name: 'Water Level',
    description: 'Monitors water levels in tanks, reservoirs, or fields, helping manage irrigation resources efficiently.',
    unit: 'cm',
    normalRange: { min: 10, max: 100 },
    icon: 'water-outline',
    color: '#3498db'
  },
  water_ph: {
    name: 'Water pH',
    description: 'Measures acidity or alkalinity of irrigation water, which affects nutrient availability and plant health.',
    unit: 'pH',
    normalRange: { min: 6.0, max: 7.5 },
    icon: 'flask-outline',
    color: '#9b59b6'
  },
  water_ec: {
    name: 'Water EC',
    description: 'Measures electrical conductivity of water, indicating dissolved salt content which affects plant water uptake.',
    unit: 'mS/cm',
    normalRange: { min: 0.5, max: 3.0 },
    icon: 'flash-outline',
    color: '#e67e22'
  }
};

// Sensor data interface
export interface SensorData {
  id: string;
  userId: string;
  sensorType: SensorType;
  value: number;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

// Sensor analysis result interface
export interface SensorAnalysis {
  status: 'good' | 'warning' | 'critical';
  value: number;
  normalRange: {
    min: number;
    max: number;
  };
  deviation: number; // How far from normal range (percentage)
  interpretation: string;
  possibleCauses: string[];
  recommendations: string[];
  additionalInfo?: string;
}

// Sensor report interface
export interface SensorReport {
  id: string;
  userId: string;
  sensorData: SensorData;
  analysis: SensorAnalysis;
  createdAt: number;
}
