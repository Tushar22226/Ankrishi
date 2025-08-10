import database from '@react-native-firebase/database';
import { SensorData, SensorType, SensorInfo, SensorAnalysis, SensorReport } from '../models/Sensor';

// Generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

class SensorService {
  // Save sensor data to Firebase
  async saveSensorData(userId: string, sensorType: SensorType, value: number, notes?: string, location?: any): Promise<SensorData> {
    try {
      console.log(`Saving sensor data for user ${userId}, sensor type: ${sensorType}, value: ${value}`);

      // Create sensor data object
      const sensorData: SensorData = {
        id: generateId(),
        userId,
        sensorType,
        value,
        timestamp: Date.now(),
        notes,
        location
      };

      // Save to Firebase
      await database()
        .ref(`sensorData/${userId}/${sensorData.id}`)
        .set(sensorData);

      console.log('Sensor data saved successfully');
      return sensorData;
    } catch (error) {
      console.error('Error saving sensor data:', error);
      throw error;
    }
  }

  // Get sensor data for a user
  async getUserSensorData(userId: string, sensorType?: SensorType): Promise<SensorData[]> {
    try {
      console.log(`Getting sensor data for user ${userId}${sensorType ? `, sensor type: ${sensorType}` : ''}`);

      let query = database().ref(`sensorData/${userId}`);

      const snapshot = await query.once('value');

      if (!snapshot.exists()) {
        console.log('No sensor data found');
        return [];
      }

      const sensorDataList: SensorData[] = [];

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val() as SensorData;

        // Filter by sensor type if specified
        if (!sensorType || data.sensorType === sensorType) {
          sensorDataList.push(data);
        }

        return false; // Continue iteration
      });

      // Sort by timestamp (newest first)
      sensorDataList.sort((a, b) => b.timestamp - a.timestamp);

      console.log(`Found ${sensorDataList.length} sensor data entries`);
      return sensorDataList;
    } catch (error) {
      console.error('Error getting sensor data:', error);
      throw error;
    }
  }

  // Analyze sensor data and generate a report
  analyzeSensorData(sensorData: SensorData): SensorAnalysis {
    console.log(`Analyzing sensor data: ${sensorData.sensorType}, value: ${sensorData.value}`);

    const sensorInfo = SensorInfo[sensorData.sensorType];
    const { normalRange } = sensorInfo;

    // Determine status based on value
    let status: 'good' | 'warning' | 'critical' = 'good';
    let interpretation = '';
    let possibleCauses: string[] = [];
    let recommendations: string[] = [];

    // Calculate deviation from normal range (as percentage)
    let deviation = 0;

    if (sensorData.value < normalRange.min) {
      // Below normal range
      deviation = ((normalRange.min - sensorData.value) / normalRange.min) * 100;

      if (deviation > 30) {
        status = 'critical';
      } else {
        status = 'warning';
      }
    } else if (sensorData.value > normalRange.max) {
      // Above normal range
      deviation = ((sensorData.value - normalRange.max) / normalRange.max) * 100;

      if (deviation > 30) {
        status = 'critical';
      } else {
        status = 'warning';
      }
    }

    // Generate interpretation and recommendations based on sensor type and status
    switch (sensorData.sensorType) {
      case 'soil_moisture':
        if (sensorData.value < normalRange.min) {
          interpretation = `Soil moisture is too low (${sensorData.value}${sensorInfo.unit}), indicating potential drought stress for plants.`;
          possibleCauses = [
            'Insufficient irrigation',
            'High temperatures causing rapid evaporation',
            'Poor soil water retention capacity',
            'Inadequate mulching'
          ];
          recommendations = [
            'Increase irrigation frequency and amount',
            'Apply organic mulch to reduce evaporation',
            'Consider adding organic matter to improve soil water retention',
            'Irrigate during cooler parts of the day to reduce evaporation'
          ];
        } else if (sensorData.value > normalRange.max) {
          interpretation = `Soil moisture is too high (${sensorData.value}${sensorInfo.unit}), indicating potential waterlogging issues.`;
          possibleCauses = [
            'Excessive irrigation',
            'Poor drainage',
            'Heavy rainfall',
            'High water table'
          ];
          recommendations = [
            'Reduce irrigation frequency and amount',
            'Improve field drainage',
            'Consider raised beds for better drainage',
            'Avoid irrigation if heavy rainfall is expected'
          ];
        } else {
          interpretation = `Soil moisture is within optimal range (${sensorData.value}${sensorInfo.unit}), providing good growing conditions for plants.`;
          recommendations = [
            'Maintain current irrigation practices',
            'Monitor regularly for any changes'
          ];
        }
        break;

      case 'soil_ph':
        if (sensorData.value < normalRange.min) {
          interpretation = `Soil pH is too acidic (${sensorData.value}${sensorInfo.unit}), which can limit nutrient availability for plants.`;
          possibleCauses = [
            'Acid rain',
            'Excessive application of ammonium-based fertilizers',
            'Naturally acidic soil parent material',
            'Leaching of base cations in high rainfall areas'
          ];
          recommendations = [
            'Apply agricultural lime to raise pH',
            'Use less acidifying fertilizers',
            'Consider dolomitic lime if magnesium is also low',
            'Retest soil after treatment to monitor changes'
          ];
        } else if (sensorData.value > normalRange.max) {
          interpretation = `Soil pH is too alkaline (${sensorData.value}${sensorInfo.unit}), which can reduce availability of micronutrients.`;
          possibleCauses = [
            'Naturally calcareous soils',
            'Excessive liming',
            'Irrigation with alkaline water',
            'Poor drainage in arid regions'
          ];
          recommendations = [
            'Apply elemental sulfur or acidifying amendments',
            'Use acidifying fertilizers like ammonium sulfate',
            'Add organic matter to buffer pH',
            'Consider gypsum for sodic soils'
          ];
        } else {
          interpretation = `Soil pH is within optimal range (${sensorData.value}${sensorInfo.unit}), providing good nutrient availability for most crops.`;
          recommendations = [
            'Maintain current soil management practices',
            'Continue regular soil testing to monitor pH'
          ];
        }
        break;

      // Add more cases for other sensor types as needed
      default:
        if (status === 'good') {
          interpretation = `${sensorInfo.name} is within optimal range (${sensorData.value}${sensorInfo.unit}).`;
          recommendations = ['Continue monitoring regularly'];
        } else if (status === 'warning') {
          interpretation = `${sensorInfo.name} is outside optimal range (${sensorData.value}${sensorInfo.unit}), which may affect crop performance.`;
          recommendations = ['Monitor more frequently', 'Consider adjusting management practices'];
        } else {
          interpretation = `${sensorInfo.name} is significantly outside optimal range (${sensorData.value}${sensorInfo.unit}), requiring immediate attention.`;
          recommendations = ['Take immediate corrective action', 'Consult with an agricultural expert'];
        }
    }

    return {
      status,
      value: sensorData.value,
      normalRange,
      deviation,
      interpretation,
      possibleCauses,
      recommendations
    };
  }

  // Generate and save a sensor report
  async generateSensorReport(sensorData: SensorData): Promise<SensorReport> {
    try {
      console.log(`Generating sensor report for sensor data ID: ${sensorData.id}`);

      // Analyze the sensor data
      const analysis = this.analyzeSensorData(sensorData);

      // Create report object
      const report: SensorReport = {
        id: generateId(),
        userId: sensorData.userId,
        sensorData,
        analysis,
        createdAt: Date.now()
      };

      // Save report to Firebase
      await database()
        .ref(`sensorReports/${sensorData.userId}/${report.id}`)
        .set(report);

      console.log('Sensor report generated and saved successfully');
      return report;
    } catch (error) {
      console.error('Error generating sensor report:', error);
      throw error;
    }
  }

  // Get sensor reports for a user
  async getUserSensorReports(userId: string, limit: number = 10): Promise<SensorReport[]> {
    try {
      console.log(`Getting sensor reports for user ${userId}, limit: ${limit}`);

      const snapshot = await database()
        .ref(`sensorReports/${userId}`)
        .limitToLast(limit)
        .once('value');

      if (!snapshot.exists()) {
        console.log('No sensor reports found');
        return [];
      }

      const reports: SensorReport[] = [];

      snapshot.forEach((childSnapshot) => {
        reports.push(childSnapshot.val() as SensorReport);
        return false; // Continue iteration
      });

      // Sort by creation date (newest first)
      reports.sort((a, b) => b.createdAt - a.createdAt);

      console.log(`Found ${reports.length} sensor reports`);
      return reports;
    } catch (error) {
      console.error('Error getting sensor reports:', error);
      throw error;
    }
  }

  // Get a specific sensor report by ID
  async getSensorReport(reportId: string): Promise<SensorReport | null> {
    try {
      console.log(`Getting sensor report with ID: ${reportId}`);

      // Since we don't know the user ID in advance, we need to search across all users
      const usersSnapshot = await database()
        .ref('sensorReports')
        .once('value');

      if (!usersSnapshot.exists()) {
        console.log('No sensor reports found');
        return null;
      }

      let report: SensorReport | null = null;

      // Iterate through each user's reports
      usersSnapshot.forEach((userSnapshot) => {
        // Check if this user has the report we're looking for
        if (userSnapshot.hasChild(reportId)) {
          report = userSnapshot.child(reportId).val() as SensorReport;
          return true; // Stop iteration
        }
        return false; // Continue iteration
      });

      if (report) {
        console.log(`Found sensor report with ID: ${reportId}`);
        return report;
      } else {
        console.log(`No sensor report found with ID: ${reportId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting sensor report with ID ${reportId}:`, error);
      throw error;
    }
  }
}

export default new SensorService();
