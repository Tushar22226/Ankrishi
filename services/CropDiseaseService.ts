import { Platform } from 'react-native';
// Using uuid for consistent ID generation
import { v4 as uuidv4 } from 'uuid';

// Define disease information interface
export interface DiseaseInfo {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  preventionMeasures: string[];
  cropTypes: string[];
  severity: 'low' | 'medium' | 'high';
  imageUrl?: string;
}

// Define prediction result interface
export interface PredictionResult {
  disease: DiseaseInfo;
  confidence: number;
  timestamp: number;
}

// Database of common crop diseases
const cropDiseaseDatabase: DiseaseInfo[] = [
  {
    id: 'late_blight',
    name: 'Late Blight',
    description: 'Late blight is a destructive disease affecting potatoes and tomatoes caused by the fungus-like organism Phytophthora infestans.',
    symptoms: [
      'Dark, water-soaked spots on leaves',
      'White, fuzzy growth on leaf undersides in humid conditions',
      'Rapidly spreading brown lesions',
      'Infected tubers with copper-brown, granular rot'
    ],
    causes: [
      'Fungus-like organism (Phytophthora infestans)',
      'Cool, wet weather conditions',
      'Poor air circulation',
      'Infected seed potatoes or transplants'
    ],
    treatments: [
      'Apply fungicides preventatively',
      'Remove and destroy infected plant material',
      'Increase plant spacing for better air circulation',
      'Use resistant varieties when available'
    ],
    preventionMeasures: [
      'Plant resistant varieties',
      'Ensure good drainage and air circulation',
      'Avoid overhead irrigation',
      'Practice crop rotation',
      'Use certified disease-free seed potatoes'
    ],
    cropTypes: ['Potato', 'Tomato'],
    severity: 'high'
  },
  {
    id: 'powdery_mildew',
    name: 'Powdery Mildew',
    description: 'Powdery mildew is a fungal disease that affects a wide range of plants, appearing as a white to gray powdery growth on leaf surfaces.',
    symptoms: [
      'White to gray powdery spots on leaves and stems',
      'Yellowing or distortion of leaves',
      'Stunted growth',
      'Premature leaf drop'
    ],
    causes: [
      'Fungal pathogens (various species)',
      'High humidity with moderate temperatures',
      'Poor air circulation',
      'Overcrowded plantings'
    ],
    treatments: [
      'Apply fungicides at first sign of disease',
      'Remove and destroy infected plant parts',
      'Apply neem oil or potassium bicarbonate sprays',
      'Increase air circulation around plants'
    ],
    preventionMeasures: [
      'Plant resistant varieties',
      'Ensure proper plant spacing',
      'Avoid overhead watering',
      'Prune to improve air circulation',
      'Rotate crops'
    ],
    cropTypes: ['Cucumber', 'Squash', 'Melon', 'Grape', 'Apple'],
    severity: 'medium'
  },
  {
    id: 'leaf_spot',
    name: 'Leaf Spot',
    description: 'Leaf spot is a common term for various fungal, bacterial, and viral diseases that cause spots on plant leaves.',
    symptoms: [
      'Circular or irregular spots on leaves',
      'Spots may have dark borders with lighter centers',
      'Yellowing around spots',
      'Spots may merge to form blotches',
      'Severe infections can cause defoliation'
    ],
    causes: [
      'Various fungi (Alternaria, Septoria, Cercospora)',
      'Bacteria (Pseudomonas, Xanthomonas)',
      'Wet conditions',
      'Splashing water spreading spores'
    ],
    treatments: [
      'Apply appropriate fungicides or bactericides',
      'Remove infected leaves',
      'Improve air circulation',
      'Avoid overhead watering'
    ],
    preventionMeasures: [
      'Rotate crops',
      'Use disease-free seeds',
      'Maintain proper plant spacing',
      'Water at the base of plants',
      'Clean up plant debris at the end of the season'
    ],
    cropTypes: ['Tomato', 'Pepper', 'Eggplant', 'Bean', 'Corn'],
    severity: 'medium'
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Rust diseases are caused by fungi that produce orange to reddish-brown pustules on plant tissues.',
    symptoms: [
      'Orange, yellow, or reddish-brown pustules on leaves and stems',
      'Pustules release powdery spores when touched',
      'Leaf distortion and yellowing',
      'Severe infections can cause defoliation'
    ],
    causes: [
      'Fungal pathogens (Puccinia, Uromyces, etc.)',
      'High humidity',
      'Moderate temperatures',
      'Extended leaf wetness'
    ],
    treatments: [
      'Apply fungicides labeled for rust control',
      'Remove and destroy infected plant parts',
      'Improve air circulation',
      'Avoid overhead watering'
    ],
    preventionMeasures: [
      'Plant resistant varieties',
      'Increase plant spacing',
      'Rotate crops',
      'Remove alternate hosts (for some rust species)',
      'Clean up plant debris at the end of the season'
    ],
    cropTypes: ['Wheat', 'Bean', 'Corn', 'Soybean'],
    severity: 'high'
  },
  {
    id: 'healthy',
    name: 'Healthy Plant',
    description: 'No disease detected. The plant appears to be healthy.',
    symptoms: [
      'No visible symptoms of disease',
      'Normal leaf color and shape',
      'Healthy growth pattern',
      'No spots, lesions, or abnormal growths'
    ],
    causes: [],
    treatments: [
      'Continue regular maintenance',
      'Monitor for any changes',
      'Follow good agricultural practices'
    ],
    preventionMeasures: [
      'Regular monitoring',
      'Proper watering and fertilization',
      'Good air circulation',
      'Crop rotation',
      'Sanitation practices'
    ],
    cropTypes: ['All crops'],
    severity: 'low'
  }
];

class CropDiseaseService {
  private modelLoaded: boolean = false;
  private isLoading: boolean = false;
  private resultCache: Map<string, PredictionResult> = new Map();

  // Initialize the model
  async initialize(): Promise<boolean> {
    console.log('CropDiseaseService.initialize called');

    if (this.modelLoaded) {
      console.log('Model already loaded, returning true');
      return true;
    }

    if (this.isLoading) {
      console.log('Model is currently loading, waiting for completion');
      // Wait for the current loading process to complete
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (this.modelLoaded) {
            clearInterval(checkLoaded);
            console.log('Model finished loading during wait, returning true');
            resolve(true);
          }
        }, 500);
      });
    }

    this.isLoading = true;
    console.log('Starting model initialization');

    try {
      console.log('Initializing crop disease detection model...');

      // Simulate model loading delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.modelLoaded = true;
      this.isLoading = false;
      console.log('Model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error initializing model:', error);
      this.isLoading = false;
      return false;
    }
  }

  // Generate a unique ID for an image based on its URI
  private generateImageId(imageUri: string): string {
    // Create a UUID based on the image URI to ensure consistency
    return uuidv4({ random: this.stringToUint8Array(imageUri) });
  }

  // Convert string to Uint8Array for UUID generation
  private stringToUint8Array(str: string): Uint8Array {
    const arr = new Uint8Array(16);
    let i = 0;
    for (let j = 0; j < str.length && i < 16; j++) {
      arr[i % 16] = (arr[i % 16] + str.charCodeAt(j)) % 256;
      i++;
    }
    return arr;
  }



  // Analyze image and predict disease using direct API call
  async analyzeImage(imageUri: string): Promise<PredictionResult | null> {
    try {
      console.log(`CropDiseaseService.analyzeImage called with: ${imageUri}`);

      // Generate a unique ID for this image
      const imageId = this.generateImageId(imageUri);
      console.log('Generated image ID:', imageId);

      // Check if we have a cached result for this image
      if (this.resultCache.has(imageId)) {
        console.log('Using cached result for image:', imageId);
        return this.resultCache.get(imageId)!;
      }

      // Ensure API is initialized
      if (!this.modelLoaded) {
        console.log('API not initialized, initializing...');
        await this.initialize();
      }

      // Import PlantIDService dynamically to avoid circular dependencies
      const PlantIDService = (await import('./PlantIDService')).default;

      console.log('Calling Plant.ID API directly...');
      const plantIdResult = await PlantIDService.identifyAndAssessHealth(imageUri);

      if (!plantIdResult) {
        console.log('Plant.ID API failed');
        throw new Error('Failed to analyze image with Plant.ID API');
      }

      console.log('Received result from Plant.ID:', plantIdResult);

      // If it's not a plant or there's no disease detected, return healthy plant
      if (!plantIdResult.isPlant || !plantIdResult.disease) {
        console.log('Not a plant or no disease detected, returning healthy plant status');
        const healthyPlant = this.getDiseaseById('healthy');
        if (!healthyPlant) {
          throw new Error('Could not find healthy plant status in database');
        }

        return {
          disease: healthyPlant,
          confidence: 0.95,
          timestamp: Date.now()
        };
      }

      // Create the prediction result
      const result: PredictionResult = {
        disease: plantIdResult.disease,
        confidence: plantIdResult.diseaseProbability,
        timestamp: Date.now()
      };
      console.log('Created prediction result:', result);

      // Cache the result
      this.resultCache.set(imageId, result);
      console.log('Cached result for future use');

      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  // Get all diseases in the database
  getAllDiseases(): DiseaseInfo[] {
    return cropDiseaseDatabase;
  }

  // Get disease by ID
  getDiseaseById(id: string): DiseaseInfo | null {
    return cropDiseaseDatabase.find(disease => disease.id === id) || null;
  }
}

export default new CropDiseaseService();
