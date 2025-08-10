import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import ContractService from '../../../services/ContractService';

// Define delivery status type
type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';

// Define delivery interface
interface Delivery {
  id: string;
  date: number;
  status: DeliveryStatus;
  quantity: number;
  notes?: string;
  trackingId?: string;
  location?: string;
  updatedAt: number;
}

interface DeliveriesManagementProps {
  contractId: string;
}

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const DeliveriesManagement: React.FC<DeliveriesManagementProps> = ({ contractId }) => {
  // State
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Form state
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>('pending');

  // Load deliveries on component mount
  useEffect(() => {
    loadDeliveries();
  }, [contractId]);

  // Load deliveries
  const loadDeliveries = async () => {
    try {
      setLoading(true);

      // Fetch deliveries from Firebase using ContractService
      const fetchedDeliveries = await ContractService.getDeliveries(contractId);

      // Convert to our Delivery type
      const typedDeliveries: Delivery[] = fetchedDeliveries.map(delivery => ({
        id: delivery.id,
        date: delivery.date,
        status: delivery.status as DeliveryStatus,
        quantity: delivery.quantity,
        notes: delivery.notes,
        trackingId: delivery.trackingId,
        location: delivery.location,
        updatedAt: delivery.updatedAt || delivery.createdAt,
      }));

      setDeliveries(typedDeliveries);
      setLoading(false);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load deliveries');
    }
  };

  // Add a new delivery
  const handleAddDelivery = async () => {
    try {
      // Validate inputs
      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      // Create delivery data
      const deliveryData = {
        date: deliveryDate.getTime(),
        status: 'pending' as DeliveryStatus,
        quantity: Number(quantity),
        notes: notes || undefined,
        trackingId: trackingId || undefined,
        location: location || undefined,
      };

      // Save to Firebase using ContractService
      await ContractService.addDelivery(contractId, deliveryData);

      // Reload deliveries to get the updated list
      await loadDeliveries();

      // Reset form
      resetForm();

      // Close modal
      setShowAddModal(false);

      Alert.alert('Success', 'Delivery added successfully');
    } catch (error) {
      console.error('Error adding delivery:', error);
      Alert.alert('Error', 'Failed to add delivery');
    }
  };

  // Update delivery status
  const handleUpdateDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      // Create updates object
      const updates = {
        notes: notes || undefined,
        trackingId: trackingId || undefined,
        location: location || undefined,
      };

      // Update delivery in Firebase using ContractService
      await ContractService.updateDeliveryStatus(
        contractId,
        selectedDelivery.id,
        status,
        updates
      );

      // Reload deliveries to get the updated list
      await loadDeliveries();

      // Reset form
      resetForm();

      // Close modal
      setShowUpdateModal(false);

      Alert.alert('Success', 'Delivery updated successfully');
    } catch (error) {
      console.error('Error updating delivery:', error);
      Alert.alert('Error', 'Failed to update delivery');
    }
  };

  // Reset form
  const resetForm = () => {
    setDeliveryDate(new Date());
    setQuantity('');
    setNotes('');
    setTrackingId('');
    setLocation('');
    setStatus('pending');
    setSelectedDelivery(null);
  };

  // Open update modal
  const openUpdateModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setStatus(delivery.status);
    setNotes(delivery.notes || '');
    setTrackingId(delivery.trackingId || '');
    setLocation(delivery.location || '');
    setShowUpdateModal(true);
  };

  // Get status color
  const getStatusColor = (status: DeliveryStatus): string => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'in_transit':
        return colors.accent;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  // Render delivery item
  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    return (
      <Card style={styles.deliveryCard}>
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryDateContainer}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.deliveryDate}>{formatDate(new Date(item.date))}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.deliveryDetails}>
          <View style={styles.deliveryDetailRow}>
            <Text style={styles.deliveryDetailLabel}>Quantity:</Text>
            <Text style={styles.deliveryDetailValue}>{item.quantity}</Text>
          </View>

          {item.trackingId && (
            <View style={styles.deliveryDetailRow}>
              <Text style={styles.deliveryDetailLabel}>Tracking ID:</Text>
              <Text style={styles.deliveryDetailValue}>{item.trackingId}</Text>
            </View>
          )}

          {item.location && (
            <View style={styles.deliveryDetailRow}>
              <Text style={styles.deliveryDetailLabel}>Location:</Text>
              <Text style={styles.deliveryDetailValue}>{item.location}</Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.deliveryNotes}>
              <Text style={styles.deliveryNotesLabel}>Notes:</Text>
              <Text style={styles.deliveryNotesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.deliveryActions}>
          <Button
            title="Update Status"
            onPress={() => openUpdateModal(item)}
            size="small"
            variant="outline"
            style={styles.deliveryActionButton}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deliveries</Text>
        <Button
          title="Add Delivery"
          onPress={() => setShowAddModal(true)}
          size="small"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No Deliveries</Text>
          <Text style={styles.emptyText}>
            No deliveries have been scheduled for this contract yet.
          </Text>
          <Button
            title="Schedule Delivery"
            onPress={() => setShowAddModal(true)}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <View style={{flex: 1}}>
          {deliveries.map(item => (
            <React.Fragment key={item.id}>
              {renderDeliveryItem({item})}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Add Delivery Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Delivery Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {formatDate(deliveryDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={deliveryDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDeliveryDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quantity</Text>
              <TextInput
                style={styles.formInput}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Enter quantity"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tracking ID (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={trackingId}
                onChangeText={setTrackingId}
                placeholder="Enter tracking ID"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter notes"
                multiline
              />
            </View>

            <Button
              title="Add Delivery"
              onPress={handleAddDelivery}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>

      {/* Update Delivery Modal */}
      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Delivery Status</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowUpdateModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {(['pending', 'in_transit', 'delivered', 'cancelled'] as DeliveryStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusButton,
                      status === s && { backgroundColor: getStatusColor(s) },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        status === s && styles.statusButtonTextActive,
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tracking ID (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={trackingId}
                onChangeText={setTrackingId}
                placeholder="Enter tracking ID"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter notes"
                multiline
              />
            </View>

            <Button
              title="Update Delivery"
              onPress={handleUpdateDelivery}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    width: '80%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  deliveriesList: {
    paddingBottom: spacing.xl,
  },
  deliveryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deliveryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryDate: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  deliveryDetails: {
    marginBottom: spacing.md,
  },
  deliveryDetailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  deliveryDetailLabel: {
    width: 100,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  deliveryDetailValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  deliveryNotes: {
    marginTop: spacing.sm,
  },
  deliveryNotesLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  deliveryNotesText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deliveryActionButton: {
    minWidth: 120,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  datePickerButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statusButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  statusButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default DeliveriesManagement;
