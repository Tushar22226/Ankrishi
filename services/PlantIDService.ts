import * as FileSystem from 'expo-file-system';
import { DiseaseInfo } from './CropDiseaseService';

// Define interfaces for Plant.ID API
interface PlantIDRequest {
  images: string[];
  modifiers?: string[];
  plant_language?: string;
  plant_details?: string[];
  disease_details?: string[];
}

interface PlantIDResponse {
  id: string;
  custom_id: string | null;
  meta_data: {
    date: string;
    datetime: string;
    latitude: number | null;
    longitude: number | null;
    date_time: string;
    timezone: string;
  };
  uploaded_datetime: string;
  finished_datetime: string;
  images: {
    file_name: string;
    url: string;
  }[];
  suggestions: PlantIDSuggestion[];
  modifiers: string[];
  secret: string;
  fail_cause: string | null;
  countable: boolean;
  feedback: string | null;
  is_plant_probability: number;
  is_plant: boolean;
  health_assessment: {
    is_healthy: boolean;
    is_healthy_probability: number;
    diseases: PlantIDDisease[];
  };
}

interface PlantIDSuggestion {
  id: string;
  name: string;
  probability: number;
  similar_images: {
    id: string;
    url: string;
    similarity: number;
    url_small: string;
  }[];
  details: {
    common_names: string[];
    url: string;
    description: {
      value: string;
      citation: string;
      license_name: string;
      license_url: string;
    };
    taxonomy: {
      class: string;
      family: string;
      genus: string;
      kingdom: string;
      order: string;
      phylum: string;
    };
    language: string;
    scientific_name: string;
    structured_name: {
      genus: string;
      species: string;
    };
  };
}

interface PlantIDDisease {
  name: string;
  probability: number;
  similar_images: {
    id: string;
    url: string;
    similarity: number;
    url_small: string;
  }[];
  entity_id: number;
  disease_details?: {
    local_name: string;
    description: string;
    treatment: {
      biological: string[];
      chemical: string[];
      prevention: string[];
    };
    classification: string[];
    language: string;
  };
}

// Define result interface for our app
export interface PlantIDResult {
  isPlant: boolean;
  plantName: string;
  plantProbability: number;
  isHealthy: boolean;
  healthProbability: number;
  disease: DiseaseInfo | null;
  diseaseProbability: number;
  originalResponse: PlantIDResponse;
}

class PlantIDService {
  private apiKey: string = 'U0htDnO6mFV9iIG4uUpbYqaZkqwcoC1P0dkJOAGbKDlw8G8RkP'; // API key for Plant.ID
  private apiUrl: string = 'https://api.plant.id/v2/health_assessment';

  // Convert image URI to base64
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  // Map Plant.ID disease to our DiseaseInfo format
  private mapToDisease(disease: PlantIDDisease): DiseaseInfo {
    // Determine severity based on probability
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (disease.probability > 0.8) {
      severity = 'high';
    } else if (disease.probability > 0.5) {
      severity = 'medium';
    }

    // Check if disease_details exists
    if (!disease.disease_details) {
      // Fallback if disease_details is missing
      const diseaseName = disease.name || 'Unknown Disease';
      const diseaseId = `disease_${disease.entity_id || Math.random().toString(36).substring(2, 9)}`;

      // Generate symptoms and causes based on disease name
      const symptoms: string[] = [];
      const causes: string[] = [];

      // Add common symptoms and causes based on disease name
      if (diseaseName.toLowerCase().includes('rust')) {
        symptoms.push(
          'Orange, yellow, or reddish-brown pustules on leaves',
          'Leaf spots that develop into pustules',
          'Premature leaf drop'
        );
        causes.push(
          'Fungal infection from Pucciniaceae family',
          'High humidity conditions',
          'Poor air circulation'
        );
      } else if (diseaseName.toLowerCase().includes('blight')) {
        symptoms.push(
          'Dark, water-soaked spots on leaves',
          'White, fuzzy growth in humid conditions',
          'Rapidly spreading brown lesions'
        );
        causes.push(
          'Fungal or bacterial pathogens',
          'Cool, wet weather conditions',
          'Poor air circulation'
        );
      } else {
        // Generic symptoms and causes
        symptoms.push(
          'Discoloration of plant tissue',
          'Abnormal growth patterns',
          'Reduced vigor'
        );
        causes.push(
          'Pathogenic organisms (fungi, bacteria, viruses)',
          'Environmental stress',
          'Nutrient deficiencies or excesses'
        );
      }

      return {
        id: diseaseId,
        name: diseaseName,
        description: 'No detailed information available for this disease.',
        symptoms: symptoms,
        causes: causes,
        treatments: ['Consult with a local agricultural extension service for specific treatment recommendations'],
        preventionMeasures: ['Practice good crop rotation', 'Ensure proper plant spacing for air circulation', 'Avoid overhead watering'],
        cropTypes: [],
        severity: severity
      };
    }

    // Extract treatments
    const treatments = [
      ...(disease.disease_details.treatment?.biological || []),
      ...(disease.disease_details.treatment?.chemical || [])
    ];

    // Generate a unique ID based on entity_id or name
    const diseaseId = `disease_${disease.entity_id || disease.name.toLowerCase().replace(/\s+/g, '_')}`;

    // Generate symptoms and causes based on disease name and description
    const symptoms: string[] = [];
    const causes: string[] = [];

    // Add common symptoms and causes based on disease name
    if (disease.name.toLowerCase().includes('rust')) {
      symptoms.push(
        'Orange, yellow, or reddish-brown pustules on leaves',
        'Leaf spots that develop into pustules',
        'Premature leaf drop',
        'Stunted growth'
      );
      causes.push(
        'Fungal infection from Pucciniaceae family',
        'High humidity conditions',
        'Poor air circulation',
        'Wet leaves for extended periods'
      );
    } else if (disease.name.toLowerCase().includes('blight')) {
      symptoms.push(
        'Dark, water-soaked spots on leaves',
        'White, fuzzy growth in humid conditions',
        'Rapidly spreading brown lesions',
        'Wilting and plant collapse'
      );
      causes.push(
        'Fungal or bacterial pathogens',
        'Cool, wet weather conditions',
        'Poor air circulation',
        'Infected plant material'
      );
    } else if (disease.name.toLowerCase().includes('mildew')) {
      symptoms.push(
        'White powdery coating on leaves',
        'Yellowing or browning of leaves',
        'Distorted new growth',
        'Premature leaf drop'
      );
      causes.push(
        'Fungal infection',
        'High humidity with moderate temperatures',
        'Poor air circulation',
        'Overcrowded plants'
      );
    } else if (disease.name.toLowerCase().includes('spot') || disease.name.toLowerCase().includes('leaf')) {
      symptoms.push(
        'Circular or irregular spots on leaves',
        'Spots with dark borders and lighter centers',
        'Yellowing around spots',
        'Leaf drop'
      );
      causes.push(
        'Fungal or bacterial pathogens',
        'Splashing water spreading spores',
        'Warm, wet conditions',
        'Poor sanitation'
      );
    } else {
      // Generic symptoms and causes for other diseases
      symptoms.push(
        'Discoloration of plant tissue',
        'Abnormal growth patterns',
        'Reduced vigor',
        'Visible damage to plant parts'
      );
      causes.push(
        'Pathogenic organisms (fungi, bacteria, viruses)',
        'Environmental stress',
        'Nutrient deficiencies or excesses',
        'Insect damage leading to infection'
      );
    }

    return {
      id: diseaseId,
      name: disease.name,
      description: disease.disease_details.description || 'No description available.',
      symptoms: symptoms,
      causes: causes,
      treatments: treatments,
      preventionMeasures: disease.disease_details.treatment?.prevention || [],
      cropTypes: [], // No common_names in the new API response
      severity: severity
    };
  }

  // Identify plant and assess health
  async identifyAndAssessHealth(imageUri: string): Promise<PlantIDResult | null> {
    try {
      console.log('Converting image to base64...');
      const base64Image = await this.imageToBase64(imageUri);

      console.log('Preparing request to Plant.ID API...');
      const requestData: PlantIDRequest = {
        images: [base64Image],
        modifiers: ["health_only", "similar_images"],
        disease_details: ["description", "treatment", "classification"]
      };

      console.log('Sending request to Plant.ID API...');
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Plant.ID API error:', errorText);
        throw new Error(`Plant.ID API error: ${response.status} ${response.statusText}`);
      }

      const data: PlantIDResponse = await response.json();
      console.log('Received response from Plant.ID API:', JSON.stringify(data, null, 2));

      // Validate response structure
      if (!data) {
        console.error('Plant.ID API returned empty data');
        throw new Error('Invalid API response: empty data');
      }

      // Initialize with safe defaults
      const result: PlantIDResult = {
        isPlant: false,
        plantName: 'Unknown',
        plantProbability: 0,
        isHealthy: true,
        healthProbability: 0,
        disease: null,
        diseaseProbability: 0,
        originalResponse: data
      };

      // Safely extract plant information
      if (data.is_plant !== undefined) {
        result.isPlant = data.is_plant;
      }

      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        const topSuggestion = data.suggestions[0];
        if (topSuggestion.name) {
          result.plantName = topSuggestion.name;
        }
        if (topSuggestion.probability !== undefined) {
          result.plantProbability = topSuggestion.probability;
        }
      }

      // Safely extract health assessment
      if (data.health_assessment) {
        if (data.health_assessment.is_healthy !== undefined) {
          result.isHealthy = data.health_assessment.is_healthy;
        }

        if (data.health_assessment.is_healthy_probability !== undefined) {
          result.healthProbability = data.health_assessment.is_healthy_probability;
        }

        // Safely extract disease information
        if (data.health_assessment.diseases &&
            Array.isArray(data.health_assessment.diseases) &&
            data.health_assessment.diseases.length > 0) {

          const topDisease = data.health_assessment.diseases[0];
          try {
            result.disease = this.mapToDisease(topDisease);
            result.diseaseProbability = topDisease.probability || 0.7;
          } catch (mapError) {
            console.error('Error mapping disease data:', mapError);
            // Keep disease as null
          }
        } else {
          console.log('No diseases found in the response');
        }
      } else {
        console.log('No health assessment found in the response');
      }

      return result;
    } catch (error) {
      console.error('Error in Plant.ID service:', error);
      return null;
    }
  }
}

export default new PlantIDService();
