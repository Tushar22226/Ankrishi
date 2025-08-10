import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import {
  Farm,
  Crop,
  Equipment,
  SoilTestResult,
  FarmTask,
  MaintenanceRecord,
  FertilizerApplication,
  PesticideApplication,
  IrrigationSchedule
} from '../models/Farm';
import { generateId } from '../utils/idGenerator';

class FarmService {
  // Get farm data for a user
  async getFarmData(userId: string): Promise<Farm | null> {
    try {
      console.log(`Getting farm data for user: ${userId}`);
      
      // Check if farm exists for the user
      const farmRef = database().ref(`farms/${userId}`);
      const snapshot = await farmRef.once('value');
      
      if (!snapshot.exists()) {
        console.log(`No farm data found for user: ${userId}`);
        return null;
      }
      
      // Get farm data
      const farmData = snapshot.val() as Farm;
      console.log(`Farm data retrieved for user: ${userId}`);
      
      return farmData;
    } catch (error) {
      console.error('Error getting farm data:', error);
      throw error;
    }
  }
  
  // Create or update farm data
  async saveFarmData(farm: Farm): Promise<Farm> {
    try {
      console.log(`Saving farm data for user: ${farm.userId}`);
      
      // Update timestamp
      farm.updatedAt = Date.now();
      
      // Save to Firebase
      await database()
        .ref(`farms/${farm.userId}`)
        .set(farm);
      
      console.log(`Farm data saved for user: ${farm.userId}`);
      return farm;
    } catch (error) {
      console.error('Error saving farm data:', error);
      throw error;
    }
  }
  
  // Create a new farm
  async createFarm(userId: string, farmData: Partial<Farm>): Promise<Farm> {
    try {
      console.log(`Creating new farm for user: ${userId}`);
      
      // Create farm object
      const farm: Farm = {
        id: generateId(),
        userId,
        name: farmData.name || 'My Farm',
        location: farmData.location || {
          address: '',
          coordinates: { latitude: 0, longitude: 0 }
        },
        size: farmData.size || 0,
        sizeUnit: farmData.sizeUnit || 'acre',
        farmingMethod: farmData.farmingMethod || 'conventional',
        crops: farmData.crops || [],
        equipment: farmData.equipment || [],
        soilTests: farmData.soilTests || [],
        tasks: farmData.tasks || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Save to Firebase
      await this.saveFarmData(farm);
      
      console.log(`New farm created for user: ${userId}`);
      return farm;
    } catch (error) {
      console.error('Error creating farm:', error);
      throw error;
    }
  }
  
  // Get crops for a farm
  async getCrops(userId: string): Promise<Crop[]> {
    try {
      console.log(`Getting crops for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        console.log(`No farm found for user: ${userId}`);
        return [];
      }
      
      return farm.crops || [];
    } catch (error) {
      console.error('Error getting crops:', error);
      throw error;
    }
  }
  
  // Get a specific crop
  async getCrop(userId: string, cropId: string): Promise<Crop | null> {
    try {
      console.log(`Getting crop ${cropId} for user: ${userId}`);
      
      // Get all crops
      const crops = await this.getCrops(userId);
      
      // Find the specific crop
      const crop = crops.find(c => c.id === cropId);
      
      if (!crop) {
        console.log(`Crop ${cropId} not found for user: ${userId}`);
        return null;
      }
      
      return crop;
    } catch (error) {
      console.error('Error getting crop:', error);
      throw error;
    }
  }
  
  // Add a new crop
  async addCrop(userId: string, cropData: Partial<Crop>): Promise<Crop> {
    try {
      console.log(`Adding new crop for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Create crop object
      const crop: Crop = {
        id: generateId(),
        name: cropData.name || '',
        variety: cropData.variety || '',
        area: cropData.area || 0,
        areaUnit: cropData.areaUnit || 'acre',
        plantingDate: cropData.plantingDate || Date.now(),
        harvestDate: cropData.harvestDate || (Date.now() + 86400000 * 90), // 90 days from now
        status: cropData.status || 'planning',
        health: cropData.health || 'good',
        image: cropData.image,
        description: cropData.description,
        soilType: cropData.soilType,
        fertilizers: cropData.fertilizers || [],
        pesticides: cropData.pesticides || [],
        irrigationSchedule: cropData.irrigationSchedule || [],
        notes: cropData.notes,
        expectedYield: cropData.expectedYield,
        yieldUnit: cropData.yieldUnit,
        actualYield: cropData.actualYield
      };
      
      // Add crop to farm
      farm.crops = [...(farm.crops || []), crop];
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`New crop added for user: ${userId}`);
      return crop;
    } catch (error) {
      console.error('Error adding crop:', error);
      throw error;
    }
  }
  
  // Update a crop
  async updateCrop(userId: string, cropId: string, cropData: Partial<Crop>): Promise<Crop> {
    try {
      console.log(`Updating crop ${cropId} for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Find the crop index
      const cropIndex = farm.crops.findIndex(c => c.id === cropId);
      
      if (cropIndex === -1) {
        throw new Error(`Crop ${cropId} not found for user: ${userId}`);
      }
      
      // Update crop
      farm.crops[cropIndex] = {
        ...farm.crops[cropIndex],
        ...cropData,
      };
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`Crop ${cropId} updated for user: ${userId}`);
      return farm.crops[cropIndex];
    } catch (error) {
      console.error('Error updating crop:', error);
      throw error;
    }
  }
  
  // Delete a crop
  async deleteCrop(userId: string, cropId: string): Promise<boolean> {
    try {
      console.log(`Deleting crop ${cropId} for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Filter out the crop
      farm.crops = farm.crops.filter(c => c.id !== cropId);
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`Crop ${cropId} deleted for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting crop:', error);
      throw error;
    }
  }
  
  // Get equipment for a farm
  async getEquipment(userId: string): Promise<Equipment[]> {
    try {
      console.log(`Getting equipment for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        console.log(`No farm found for user: ${userId}`);
        return [];
      }
      
      return farm.equipment || [];
    } catch (error) {
      console.error('Error getting equipment:', error);
      throw error;
    }
  }
  
  // Get a specific equipment
  async getEquipmentById(userId: string, equipmentId: string): Promise<Equipment | null> {
    try {
      console.log(`Getting equipment ${equipmentId} for user: ${userId}`);
      
      // Get all equipment
      const equipment = await this.getEquipment(userId);
      
      // Find the specific equipment
      const item = equipment.find(e => e.id === equipmentId);
      
      if (!item) {
        console.log(`Equipment ${equipmentId} not found for user: ${userId}`);
        return null;
      }
      
      return item;
    } catch (error) {
      console.error('Error getting equipment:', error);
      throw error;
    }
  }
  
  // Add new equipment
  async addEquipment(userId: string, equipmentData: Partial<Equipment>): Promise<Equipment> {
    try {
      console.log(`Adding new equipment for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Create equipment object
      const equipment: Equipment = {
        id: generateId(),
        name: equipmentData.name || '',
        model: equipmentData.model || '',
        purchaseDate: equipmentData.purchaseDate || Date.now(),
        status: equipmentData.status || 'operational',
        image: equipmentData.image,
        description: equipmentData.description,
        lastMaintenance: equipmentData.lastMaintenance,
        nextMaintenance: equipmentData.nextMaintenance,
        maintenanceHistory: equipmentData.maintenanceHistory || [],
        specifications: equipmentData.specifications
      };
      
      // Add equipment to farm
      farm.equipment = [...(farm.equipment || []), equipment];
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`New equipment added for user: ${userId}`);
      return equipment;
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    }
  }
  
  // Update equipment
  async updateEquipment(userId: string, equipmentId: string, equipmentData: Partial<Equipment>): Promise<Equipment> {
    try {
      console.log(`Updating equipment ${equipmentId} for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Find the equipment index
      const equipmentIndex = farm.equipment.findIndex(e => e.id === equipmentId);
      
      if (equipmentIndex === -1) {
        throw new Error(`Equipment ${equipmentId} not found for user: ${userId}`);
      }
      
      // Update equipment
      farm.equipment[equipmentIndex] = {
        ...farm.equipment[equipmentIndex],
        ...equipmentData,
      };
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`Equipment ${equipmentId} updated for user: ${userId}`);
      return farm.equipment[equipmentIndex];
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }
  
  // Add maintenance record to equipment
  async addMaintenanceRecord(userId: string, equipmentId: string, recordData: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    try {
      console.log(`Adding maintenance record for equipment ${equipmentId}, user: ${userId}`);
      
      // Get equipment
      const equipment = await this.getEquipmentById(userId, equipmentId);
      
      if (!equipment) {
        throw new Error(`Equipment ${equipmentId} not found for user: ${userId}`);
      }
      
      // Create maintenance record
      const record: MaintenanceRecord = {
        id: generateId(),
        date: recordData.date || Date.now(),
        type: recordData.type || 'Regular Service',
        description: recordData.description || '',
        cost: recordData.cost || 0,
        performedBy: recordData.performedBy,
        notes: recordData.notes
      };
      
      // Add record to equipment
      const updatedEquipment: Equipment = {
        ...equipment,
        maintenanceHistory: [...equipment.maintenanceHistory, record],
        lastMaintenance: record.date,
        // Set next maintenance to 90 days from now by default
        nextMaintenance: Date.now() + 86400000 * 90
      };
      
      // Update equipment
      await this.updateEquipment(userId, equipmentId, updatedEquipment);
      
      console.log(`Maintenance record added for equipment ${equipmentId}`);
      return record;
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      throw error;
    }
  }
  
  // Get soil tests for a farm
  async getSoilTests(userId: string): Promise<SoilTestResult[]> {
    try {
      console.log(`Getting soil tests for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        console.log(`No farm found for user: ${userId}`);
        return [];
      }
      
      return farm.soilTests || [];
    } catch (error) {
      console.error('Error getting soil tests:', error);
      throw error;
    }
  }
  
  // Add soil test result
  async addSoilTest(userId: string, testData: Partial<SoilTestResult>): Promise<SoilTestResult> {
    try {
      console.log(`Adding soil test for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Create soil test object
      const soilTest: SoilTestResult = {
        id: generateId(),
        date: testData.date || Date.now(),
        location: testData.location || '',
        results: testData.results || {
          pH: 0,
          nitrogen: '',
          phosphorus: '',
          potassium: '',
          organicMatter: '',
          texture: ''
        },
        recommendations: testData.recommendations || []
      };
      
      // Add soil test to farm
      farm.soilTests = [...(farm.soilTests || []), soilTest];
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`Soil test added for user: ${userId}`);
      return soilTest;
    } catch (error) {
      console.error('Error adding soil test:', error);
      throw error;
    }
  }
  
  // Get tasks for a farm
  async getTasks(userId: string): Promise<FarmTask[]> {
    try {
      console.log(`Getting tasks for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        console.log(`No farm found for user: ${userId}`);
        return [];
      }
      
      return farm.tasks || [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }
  
  // Add a new task
  async addTask(userId: string, taskData: Partial<FarmTask>): Promise<FarmTask> {
    try {
      console.log(`Adding task for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Create task object
      const task: FarmTask = {
        id: generateId(),
        title: taskData.title || '',
        description: taskData.description,
        dueDate: taskData.dueDate || (Date.now() + 86400000), // Tomorrow by default
        priority: taskData.priority || 'medium',
        status: 'pending',
        cropId: taskData.cropId,
        cropName: taskData.cropName,
        assignedTo: taskData.assignedTo,
        createdAt: Date.now(),
        completedAt: undefined
      };
      
      // Add task to farm
      farm.tasks = [...(farm.tasks || []), task];
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`Task added for user: ${userId}`);
      return task;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }
  
  // Update task status
  async updateTaskStatus(userId: string, taskId: string, status: 'pending' | 'completed'): Promise<FarmTask> {
    try {
      console.log(`Updating task ${taskId} status to ${status} for user: ${userId}`);
      
      // Get farm data
      const farm = await this.getFarmData(userId);
      
      if (!farm) {
        throw new Error(`No farm found for user: ${userId}`);
      }
      
      // Find the task index
      const taskIndex = farm.tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Task ${taskId} not found for user: ${userId}`);
      }
      
      // Update task status
      farm.tasks[taskIndex] = {
        ...farm.tasks[taskIndex],
        status,
        completedAt: status === 'completed' ? Date.now() : undefined
      };
      
      // Save updated farm data
      await this.saveFarmData(farm);
      
      console.log(`Task ${taskId} status updated to ${status}`);
      return farm.tasks[taskIndex];
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
  
  // Upload image to Firebase Storage
  async uploadImage(userId: string, uri: string, type: 'crop' | 'equipment' | 'farm'): Promise<string> {
    try {
      console.log(`Uploading ${type} image for user: ${userId}`);
      
      // Generate a unique filename
      const filename = `${type}_${Date.now()}.jpg`;
      const storageRef = storage().ref(`users/${userId}/${type}Images/${filename}`);
      
      // Upload the file
      await storageRef.putFile(uri);
      
      // Get download URL
      const downloadURL = await storageRef.getDownloadURL();
      
      console.log(`Image uploaded successfully: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

export default new FarmService();
