import database from '@react-native-firebase/database';
import LocationService from './LocationService';
import governmentSchemesData from '../data/governmentSchemes.json';

// Scheme interface
export interface GovernmentScheme {
  id: string;
  title: string;
  category: 'financial' | 'insurance' | 'credit' | 'technical' | 'marketing' | 'infrastructure';
  ministry: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  applicationProcess: string[];
  documents: string[];
  lastDate: number | null; // timestamp or null for ongoing schemes
  status: 'active' | 'inactive' | 'upcoming';
  website: string;
  successRate?: number;
  relevanceScore?: number;
  applicationStatus?: string | null;
  // Income eligibility
  incomeEligibility?: {
    min?: number;
    max?: number;
  };
  // Location eligibility
  locationEligibility?: {
    states?: string[];
    districts?: string[];
    national?: boolean; // If true, available across India
  };
}

class SchemeService {
  // Get all schemes
  async getAllSchemes(): Promise<GovernmentScheme[]> {
    try {
      console.log('Fetching all government schemes from local JSON file');

      // Get schemes from local JSON file
      const schemes: GovernmentScheme[] = governmentSchemesData.schemes.map((scheme, index) => ({
        ...scheme,
        relevanceScore: 100 - index // Add a relevance score based on order in the file
      }));

      console.log(`Retrieved ${schemes.length} government schemes from JSON file`);
      return schemes;
    } catch (error) {
      console.error('Error fetching government schemes:', error);
      // Return empty array instead of using local data
      return [];
    }
  }

  // Get scheme by ID
  async getSchemeById(schemeId: string): Promise<GovernmentScheme | null> {
    try {
      console.log(`Fetching government scheme with ID: ${schemeId}`);

      // Get scheme from Firebase
      const schemeRef = database().ref(`governmentSchemes/${schemeId}`);
      const snapshot = await schemeRef.once('value');

      if (!snapshot.exists()) {
        console.log(`No scheme found with ID: ${schemeId}`);
        return null;
      }

      // Return scheme data
      const scheme: GovernmentScheme = {
        id: snapshot.key as string,
        ...snapshot.val()
      };

      console.log(`Retrieved scheme: ${scheme.title}`);
      return scheme;
    } catch (error) {
      console.error(`Error fetching government scheme with ID ${schemeId}:`, error);
      throw error;
    }
  }

  // Filter schemes by income
  async filterSchemesByIncome(income: number): Promise<GovernmentScheme[]> {
    try {
      console.log(`Filtering schemes by income: ₹${income}`);

      // Get all schemes
      const allSchemes = await this.getAllSchemes();

      // Filter by income eligibility
      const filteredSchemes = allSchemes.filter(scheme => {
        // If no income eligibility is specified, include the scheme
        if (!scheme.incomeEligibility) return true;

        const { min, max } = scheme.incomeEligibility;

        // Check if income is within range
        if (min !== undefined && max !== undefined) {
          return income >= min && income <= max;
        }

        // Check if income is above minimum
        if (min !== undefined) {
          return income >= min;
        }

        // Check if income is below maximum
        if (max !== undefined) {
          return income <= max;
        }

        // If no specific criteria, include the scheme
        return true;
      });

      console.log(`Found ${filteredSchemes.length} schemes matching income criteria`);
      return filteredSchemes;
    } catch (error) {
      console.error('Error filtering schemes by income:', error);
      throw error;
    }
  }

  // Filter schemes by location
  async filterSchemesByLocation(location: { address: string }): Promise<GovernmentScheme[]> {
    try {
      console.log(`Filtering schemes by location: ${location.address}`);

      // Get all schemes
      const allSchemes = await this.getAllSchemes();

      // Extract state from address
      const address = location.address.toLowerCase();
      const stateMatch = address.match(/([a-z]+)\s*,\s*\d+/i) || // Match "State, Pincode" pattern
                         address.match(/,\s*([a-z]+)\s*$/i);     // Match ", State" at the end

      const state = stateMatch ? stateMatch[1].trim() : '';
      console.log(`Extracted state: ${state}`);

      // Filter by location eligibility
      const filteredSchemes = allSchemes.filter(scheme => {
        // If no location eligibility is specified or scheme is national, include it
        if (!scheme.locationEligibility || scheme.locationEligibility.national) return true;

        // Check if state is in eligible states
        if (scheme.locationEligibility.states && state) {
          return scheme.locationEligibility.states.some(s =>
            s.toLowerCase() === state.toLowerCase()
          );
        }

        // If no match found but scheme has location restrictions, exclude it
        if (scheme.locationEligibility.states && scheme.locationEligibility.states.length > 0) {
          return false;
        }

        // Default to including the scheme
        return true;
      });

      console.log(`Found ${filteredSchemes.length} schemes matching location criteria`);
      return filteredSchemes;
    } catch (error) {
      console.error('Error filtering schemes by location:', error);
      throw error;
    }
  }

  // Filter schemes by both income and location
  async filterSchemes(income: number, location: { address: string }): Promise<GovernmentScheme[]> {
    try {
      console.log(`Filtering schemes by income: ₹${income} and location: ${location.address}`);

      // Get all schemes
      const allSchemes = await this.getAllSchemes();

      // Extract state from address
      const address = location.address.toLowerCase();
      const stateMatch = address.match(/([a-z]+)\s*,\s*\d+/i) || // Match "State, Pincode" pattern
                         address.match(/,\s*([a-z]+)\s*$/i);     // Match ", State" at the end

      const state = stateMatch ? stateMatch[1].trim() : '';

      // Filter by both criteria
      const filteredSchemes = allSchemes.filter(scheme => {
        // Income eligibility check
        let incomeEligible = true;
        if (scheme.incomeEligibility) {
          const { min, max } = scheme.incomeEligibility;

          if (min !== undefined && max !== undefined) {
            incomeEligible = income >= min && income <= max;
          } else if (min !== undefined) {
            incomeEligible = income >= min;
          } else if (max !== undefined) {
            incomeEligible = income <= max;
          }
        }

        // Location eligibility check
        let locationEligible = true;
        if (scheme.locationEligibility && !scheme.locationEligibility.national) {
          if (scheme.locationEligibility.states && state) {
            locationEligible = scheme.locationEligibility.states.some(s =>
              s.toLowerCase() === state.toLowerCase()
            );
          } else if (scheme.locationEligibility.states && scheme.locationEligibility.states.length > 0) {
            locationEligible = false;
          }
        }

        return incomeEligible && locationEligible;
      });

      console.log(`Found ${filteredSchemes.length} schemes matching both income and location criteria`);
      return filteredSchemes;
    } catch (error) {
      console.error('Error filtering schemes by income and location:', error);
      throw error;
    }
  }

  // Apply for a scheme
  async applyForScheme(userId: string, schemeId: string, applicationData: any): Promise<string> {
    try {
      console.log(`User ${userId} applying for scheme ${schemeId}`);

      // Create a reference to the applications collection
      const applicationsRef = database().ref('schemeApplications');

      // Generate a new application ID
      const newApplicationRef = applicationsRef.push();

      // Create the application object
      const application = {
        id: newApplicationRef.key,
        userId,
        schemeId,
        applicationData,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the application to the database
      await newApplicationRef.set(application);

      console.log(`Application submitted with ID: ${application.id}`);
      return application.id;
    } catch (error) {
      console.error('Error applying for scheme:', error);
      throw error;
    }
  }

  // Get user's scheme applications
  async getUserApplications(userId: string): Promise<any[]> {
    try {
      console.log(`Fetching scheme applications for user ${userId}`);

      // Get applications from Firebase
      const applicationsRef = database().ref('schemeApplications')
        .orderByChild('userId')
        .equalTo(userId);

      const snapshot = await applicationsRef.once('value');

      if (!snapshot.exists()) {
        console.log('No applications found for this user');
        return [];
      }

      // Convert to array
      const applications: any[] = [];
      snapshot.forEach((childSnapshot) => {
        applications.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
        return undefined; // Required for TypeScript with forEach
      });

      console.log(`Retrieved ${applications.length} applications for user ${userId}`);
      return applications;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }
}

export default new SchemeService();
