import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';

// Mock equipment data
const mockEquipment = {
  equipment1: {
    id: 'equipment1',
    name: 'Tractor',
    model: 'John Deere 5045D',
    purchaseDate: new Date(Date.now() - 86400000 * 365 * 2), // 2 years ago
    status: 'operational',
    image: 'https://via.placeholder.com/100x100?text=Tractor',
    description: '45 HP tractor with 8-speed transmission',
    lastMaintenance: new Date(Date.now() - 86400000 * 30), // 30 days ago
    nextMaintenance: new Date(Date.now() + 86400000 * 60), // 60 days from now
    maintenanceHistory: [
      {
        date: new Date(Date.now() - 86400000 * 30),
        type: 'Regular Service',
        description: 'Oil change, filter replacement, general inspection',
        cost: 5000,
      },
      {
        date: new Date(Date.now() - 86400000 * 120),
        type: 'Repair',
        description: 'Fuel pump replacement',
        cost: 8000,
      },
      {
        date: new Date(Date.now() - 86400000 * 210),
        type: 'Regular Service',
        description: 'Oil change, filter replacement, general inspection',
        cost: 5000,
      },
    ],
    specifications: {
      engine: '45 HP',
      transmission: '8-speed',
      fuelType: 'Diesel',
      fuelCapacity: '60 L',
      weight: '1800 kg',
    },
  },
  equipment2: {
    id: 'equipment2',
    name: 'Water Pump',
    model: 'Kirloskar KSB-5HP',
    purchaseDate: new Date(Date.now() - 86400000 * 365), // 1 year ago
    status: 'needs maintenance',
    image: 'https://via.placeholder.com/100x100?text=Water+Pump',
    description: '5 HP water pump for irrigation',
    lastMaintenance: new Date(Date.now() - 86400000 * 90), // 90 days ago
    nextMaintenance: new Date(Date.now() - 86400000 * 10), // 10 days ago (overdue)
    maintenanceHistory: [
      {
        date: new Date(Date.now() - 86400000 * 90),
        type: 'Regular Service',
        description: 'Bearing replacement, general inspection',
        cost: 2000,
      },
      {
        date: new Date(Date.now() - 86400000 * 180),
        type: 'Repair',
        description: 'Impeller replacement',
        cost: 3500,
      },
    ],
    specifications: {
      power: '5 HP',
      flow: '500 LPM',
      head: '30 m',
      phase: 'Single',
      weight: '45 kg',
    },
  },
};

const EquipmentDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { equipmentId } = route.params || { equipmentId: 'equipment1' };
  
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'maintenance', 'specifications'
  
  useEffect(() => {
    // In a real app, we would fetch data from a service
    // For now, let's use mock data
    setTimeout(() => {
      setEquipment(mockEquipment[equipmentId]);
      setLoading(false);
    }, 500);
  }, [equipmentId]);
  
  if (loading || !equipment) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading equipment details...</Text>
      </View>
    );
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return colors.success;
      case 'needs maintenance':
        return colors.warning;
      case 'out of service':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };
  
  const isMaintenanceOverdue = () => {
    return equipment.nextMaintenance < new Date();
  };
  
  const renderDetailsTab = () => (
    <View>
      <View style={styles.equipmentImageContainer}>
        <Image
          source={{ uri: equipment.image }}
          style={styles.equipmentImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Model</Text>
            <Text style={styles.detailValue}>{equipment.model}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Purchase Date</Text>
            <Text style={styles.detailValue}>{formatDate(equipment.purchaseDate)}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(equipment.status) },
                ]}
              />
              <Text style={styles.statusText}>
                {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Next Maintenance</Text>
            <Text
              style={[
                styles.detailValue,
                isMaintenanceOverdue() && styles.overdueText,
              ]}
            >
              {formatDate(equipment.nextMaintenance)}
              {isMaintenanceOverdue() ? ' (Overdue)' : ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{equipment.description}</Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.maintenanceButton]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Ionicons name="construct" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Maintenance History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.scheduleButton]}
          onPress={() => {
            // In a real app, we would navigate to schedule maintenance screen
            alert('Schedule maintenance feature coming soon');
          }}
        >
          <Ionicons name="calendar" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Schedule Maintenance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderMaintenanceTab = () => (
    <View>
      <View style={styles.maintenanceSummary}>
        <View style={styles.maintenanceItem}>
          <Text style={styles.maintenanceLabel}>Last Maintenance</Text>
          <Text style={styles.maintenanceValue}>{formatDate(equipment.lastMaintenance)}</Text>
        </View>
        
        <View style={styles.maintenanceItem}>
          <Text style={styles.maintenanceLabel}>Next Maintenance</Text>
          <Text
            style={[
              styles.maintenanceValue,
              isMaintenanceOverdue() && styles.overdueText,
            ]}
          >
            {formatDate(equipment.nextMaintenance)}
            {isMaintenanceOverdue() ? ' (Overdue)' : ''}
          </Text>
        </View>
      </View>
      
      <Text style={styles.historyTitle}>Maintenance History</Text>
      
      {equipment.maintenanceHistory.map((record, index) => (
        <Card key={index} style={styles.maintenanceCard}>
          <View style={styles.maintenanceHeader}>
            <View>
              <Text style={styles.maintenanceType}>{record.type}</Text>
              <Text style={styles.maintenanceDate}>{formatDate(record.date)}</Text>
            </View>
            
            <Text style={styles.maintenanceCost}>₹{record.cost}</Text>
          </View>
          
          <Text style={styles.maintenanceDescription}>{record.description}</Text>
        </Card>
      ))}
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // In a real app, we would navigate to add maintenance record screen
          alert('Add maintenance record feature coming soon');
        }}
      >
        <Ionicons name="add-circle" size={20} color={colors.primary} />
        <Text style={styles.addButtonText}>Add Maintenance Record</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderSpecificationsTab = () => (
    <View>
      <Card style={styles.specificationsCard}>
        {Object.entries(equipment.specifications).map(([key, value], index) => (
          <View key={index} style={styles.specificationItem}>
            <Text style={styles.specificationLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Text style={styles.specificationValue}>{value}</Text>
          </View>
        ))}
      </Card>
      
      <TouchableOpacity
        style={styles.documentButton}
        onPress={() => {
          // In a real app, we would navigate to view equipment documents
          alert('View equipment documents feature coming soon');
        }}
      >
        <Ionicons name="document-text" size={20} color={colors.primary} />
        <Text style={styles.documentButtonText}>View Equipment Documents</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{equipment.name}</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'details' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('details')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'details' && styles.activeTabButtonText,
            ]}
          >
            Details
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'maintenance' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'maintenance' && styles.activeTabButtonText,
            ]}
          >
            Maintenance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'specifications' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('specifications')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'specifications' && styles.activeTabButtonText,
            ]}
          >
            Specifications
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
        {activeTab === 'specifications' && renderSpecificationsTab()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.medium,
  },
  title: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.medium,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    padding: spacing.medium,
  },
  equipmentImageContainer: {
    height: 200,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    marginBottom: spacing.medium,
  },
  equipmentImage: {
    width: '100%',
    height: '100%',
  },
  detailsSection: {
    marginBottom: spacing.medium,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.small,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSizeMedium,
    color: colors.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.small,
  },
  statusText: {
    fontSize: typography.fontSizeMedium,
    color: colors.textPrimary,
  },
  overdueText: {
    color: colors.error,
  },
  descriptionContainer: {
    marginTop: spacing.small,
  },
  descriptionLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.small,
    marginHorizontal: 4,
  },
  maintenanceButton: {
    backgroundColor: colors.primary,
  },
  scheduleButton: {
    backgroundColor: colors.secondary,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.small,
  },
  maintenanceSummary: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  maintenanceItem: {
    flex: 1,
  },
  maintenanceLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  maintenanceValue: {
    fontSize: typography.fontSizeMedium,
    color: colors.textPrimary,
  },
  historyTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  maintenanceCard: {
    marginBottom: spacing.medium,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  maintenanceType: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  maintenanceDate: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  maintenanceCost: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  maintenanceDescription: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
  },
  addButtonText: {
    fontSize: typography.fontSizeRegular,
    color: colors.primary,
    marginLeft: spacing.small,
  },
  specificationsCard: {
    marginBottom: spacing.medium,
  },
  specificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specificationLabel: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
  },
  specificationValue: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    marginTop: spacing.small,
  },
  documentButtonText: {
    fontSize: typography.fontSizeRegular,
    color: colors.primary,
    marginLeft: spacing.small,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default EquipmentDetailsScreen;
