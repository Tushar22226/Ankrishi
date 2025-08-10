// Farm management models
import { ProductLocation } from './Product';

// Crop status types
export type CropStatus = 'planning' | 'planting' | 'growing' | 'harvesting' | 'completed';

// Crop health types
export type CropHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// Farming method types
export type FarmingMethod = 'conventional' | 'organic' | 'natural' | 'integrated' | 'conservation';

// Equipment status types
export type EquipmentStatus = 'operational' | 'needs maintenance' | 'out of service';

// Soil test result interface
export interface SoilTestResult {
  id: string;
  date: number; // timestamp
  location: string;
  results: {
    pH: number;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    organicMatter: string;
    texture: string;
  };
  recommendations: string[];
}

// Maintenance record interface
export interface MaintenanceRecord {
  id: string;
  date: number; // timestamp
  type: 'Regular Service' | 'Repair' | 'Replacement' | 'Inspection';
  description: string;
  cost: number;
  performedBy?: string;
  notes?: string;
}

// Equipment interface
export interface Equipment {
  id: string;
  name: string;
  model: string;
  purchaseDate: number; // timestamp
  status: EquipmentStatus;
  image?: string;
  description?: string;
  lastMaintenance?: number; // timestamp
  nextMaintenance?: number; // timestamp
  maintenanceHistory: MaintenanceRecord[];
  specifications?: {
    [key: string]: string;
  };
}

// Irrigation schedule interface
export interface IrrigationSchedule {
  id: string;
  date: number; // timestamp
  duration: string;
  status?: 'completed' | 'scheduled' | 'missed';
}

// Fertilizer application interface
export interface FertilizerApplication {
  id: string;
  name: string;
  quantity: string;
  lastApplied: number; // timestamp
  nextApplication?: number; // timestamp
  notes?: string;
}

// Pesticide application interface
export interface PesticideApplication {
  id: string;
  name: string;
  quantity: string;
  lastApplied: number; // timestamp
  nextApplication?: number; // timestamp
  notes?: string;
}

// Crop interface
export interface Crop {
  id: string;
  name: string;
  variety: string;
  area: number;
  areaUnit: 'acre' | 'hectare';
  plantingDate: number; // timestamp
  harvestDate: number; // timestamp
  status: CropStatus;
  health: CropHealth;
  image?: string;
  description?: string;
  soilType?: string;
  fertilizers: FertilizerApplication[];
  pesticides: PesticideApplication[];
  irrigationSchedule: IrrigationSchedule[];
  notes?: string;
  expectedYield?: number;
  yieldUnit?: string;
  actualYield?: number;
}

// Task priority types
export type TaskPriority = 'low' | 'medium' | 'high';

// Task interface
export interface FarmTask {
  id: string;
  title: string;
  description?: string;
  dueDate: number; // timestamp
  priority: TaskPriority;
  status: 'pending' | 'completed';
  cropId?: string;
  cropName?: string;
  assignedTo?: string;
  createdAt: number; // timestamp
  completedAt?: number; // timestamp
}

// Farm interface
export interface Farm {
  id: string;
  userId: string;
  name: string;
  location: {
    address: string;
    coordinates: ProductLocation;
  };
  size: number;
  sizeUnit: 'acre' | 'hectare';
  soilType?: string;
  farmingMethod: FarmingMethod;
  description?: string;
  crops: Crop[];
  equipment: Equipment[];
  soilTests: SoilTestResult[];
  tasks: FarmTask[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}
