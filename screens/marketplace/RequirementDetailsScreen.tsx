import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const RequirementDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();
  const { requirementId } = route.params as { requirementId: string };

  // State
  const [loading, setLoading] = useState(true);
  const [requirement, setRequirement] = useState<any>(null);
  const [userResponse, setUserResponse] = useState<any>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQuantity, setBidQuantity] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasAcceptedResponse, setHasAcceptedResponse] = useState(false);

  // First come first serve response state
  const [fcfsResponse, setFcfsResponse] = useState({
    canFulfill: false,
    hasCertifications: false,
    canProvideTraceability: false,
    isPesticideFree: false,
    moistureContent: '',
  });
  const [showFcfsForm, setShowFcfsForm] = useState(false);

  // Certification images state
  const [certificationImages, setCertificationImages] = useState<{[key: string]: string}>({});

  // Traceability information state
  const [traceabilityInfo, setTraceabilityInfo] = useState({
    farmName: userProfile?.farmDetails?.name || '',
    farmingPractices: '',
    harvestDate: new Date(),
    farmLocation: userProfile?.address || '',
  });

  // Date picker state
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);

  // Price input for first-come-first-serve
  const [fcfsPrice, setFcfsPrice] = useState('');
  const [fcfsPriceUnit, setFcfsPriceUnit] = useState<'kg' | 'quintal' | 'ton'>('kg');

  // Form validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Load requirement details on component mount
  useEffect(() => {
    loadRequirementDetails();

    // Set up real-time listener for requirement updates
    const requirementRef = database().ref(`requirements/${requirementId}`);
    const onRequirementUpdate = requirementRef.on('value', snapshot => {
      const requirementData = snapshot.val();
      if (requirementData) {
        setRequirement(requirementData);

        // Check if requirement has any accepted responses
        let foundAcceptedResponse = false;
        if (requirementData.responses) {
          const responses = Object.values(requirementData.responses);
          foundAcceptedResponse = responses.some((response: any) => response.status === 'accepted');
          setHasAcceptedResponse(foundAcceptedResponse);
        }

        // If requirement status is not 'open', disable bidding
        if (requirementData.status !== 'open') {
          setHasAcceptedResponse(true);
        }

        // Check if current user's response status has changed
        if (userProfile?.uid && requirementData.responses) {
          const responses = requirementData.responses;
          const userResponseData = Object.values(responses).find(
            (response: any) => response.farmerId === userProfile.uid
          );

          if (userResponseData) {
            setUserResponse(userResponseData);
          }
        }
      }
    });

    // Clean up listener on unmount
    return () => {
      requirementRef.off('value', onRequirementUpdate);
    };
  }, [requirementId, userProfile?.uid]);

  // Load requirement details from Firebase
  const loadRequirementDetails = async () => {
    try {
      setLoading(true);

      // Fetch requirement details
      const snapshot = await database()
        .ref(`requirements/${requirementId}`)
        .once('value');

      const requirementData = snapshot.val();

      if (requirementData) {
        setRequirement(requirementData);

        // Check if requirement has any accepted responses
        let foundAcceptedResponse = false;
        if (requirementData.responses) {
          const responses = Object.values(requirementData.responses);
          foundAcceptedResponse = responses.some((response: any) => response.status === 'accepted');
          setHasAcceptedResponse(foundAcceptedResponse);
        }

        // Check if current user has already responded
        if (userProfile?.uid && requirementData.responses) {
          const responses = requirementData.responses;
          const userResponseData = Object.values(responses).find(
            (response: any) => response.farmerId === userProfile.uid
          );

          if (userResponseData) {
            setUserResponse(userResponseData);
          }
        }

        // Initialize bid quantity with the required quantity
        if (requirementData.quantityRequired) {
          setBidQuantity(requirementData.quantityRequired.toString());
        }

        // If requirement status is not 'open', disable bidding
        if (requirementData.status !== 'open') {
          setHasAcceptedResponse(true);
        }
      } else {
        Alert.alert('Error', 'Requirement not found');
        navigation.goBack();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading requirement details:', error);
      Alert.alert('Error', 'Failed to load requirement details. Please try again.');
      setLoading(false);
      navigation.goBack();
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get color for response status
  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'pending':
      default:
        return colors.warning;
    }
  };

  // Handle certification image selection
  const handleSelectCertificateImage = async (certType: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update the certification image
        setCertificationImages({
          ...certificationImages,
          [certType]: result.assets[0].uri
        });

        // Clear any error for this certification
        if (errors[`certification_${certType}`]) {
          const newErrors = {...errors};
          delete newErrors[`certification_${certType}`];
          setErrors(newErrors);
        }
      }
    } catch (error) {
      console.error('Error selecting certificate image:', error);
      Alert.alert('Error', 'Failed to select certificate image');
    }
  };

  // Handle removing a certification image
  const handleRemoveCertificateImage = (certType: string) => {
    const newCertificationImages = {...certificationImages};
    delete newCertificationImages[certType];
    setCertificationImages(newCertificationImages);
  };

  // Handle bid submission
  const handleBidSubmit = async () => {
    // Validate inputs
    if (!bidPrice) {
      Alert.alert('Error', 'Please enter a bid price');
      return;
    }

    if (!bidQuantity) {
      Alert.alert('Error', 'Please enter a quantity');
      return;
    }

    try {
      setSubmitting(true);

      // Create response object
      const responseId = database().ref(`requirements/${requirementId}/responses`).push().key;

      if (!responseId) {
        throw new Error('Failed to generate response ID');
      }

      const response = {
        id: responseId,
        requirementId,
        farmerId: userProfile?.uid,
        farmerName: userProfile?.displayName || 'Unknown Farmer',
        farmerVerified: userProfile?.reputation?.verifiedStatus || false,

        // Offer details
        offeredQuantity: Number(bidQuantity),
        offeredPrice: Number(bidPrice),
        currency: 'INR',

        // Product details
        productDetails: {
          farmLocation: userProfile?.address || 'Unknown',
        },

        // Delivery details
        proposedDeliveryDate: requirement.expectedDeliveryDate,
        canHandleDelivery: requirement.deliveryHandler === 'farmer',

        // Status and timestamps
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),

        // Additional notes
        notes: bidNotes,
      };

      // Save to Firebase
      await database().ref(`requirements/${requirementId}/responses/${responseId}`).set(response);

      // Update local state
      setUserResponse(response);
      setShowBidForm(false);

      // Success message
      Alert.alert('Success', 'Your bid has been submitted successfully');
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle first-come-first-serve response submission
  const handleFcfsSubmit = async () => {
    try {
      // Validate form
      const newErrors: {[key: string]: string} = {};
      let isValid = true;

      // Check if user can fulfill the requirement
      if (!fcfsResponse.canFulfill) {
        newErrors.canFulfill = 'You must confirm that you can fulfill this requirement';
        isValid = false;
      }

      // Validate price input
      if (!fcfsPrice) {
        newErrors.fcfsPrice = 'Please enter your offered price';
        isValid = false;
      } else if (isNaN(Number(fcfsPrice)) || Number(fcfsPrice) <= 0) {
        newErrors.fcfsPrice = 'Please enter a valid price';
        isValid = false;
      }

      // Validate certifications if required
      if (requirement.certifications?.length > 0 && fcfsResponse.hasCertifications) {
        for (const cert of requirement.certifications) {
          if (!certificationImages[cert]) {
            newErrors[`certification_${cert}`] = `Please upload a certificate image for ${cert.replace('_', ' ')}`;
            isValid = false;
          }
        }
      }

      // Validate traceability information if required
      if (requirement.traceabilityRequired && fcfsResponse.canProvideTraceability) {
        if (!traceabilityInfo.farmName) {
          newErrors.farmName = 'Farm name is required';
          isValid = false;
        }
        if (!traceabilityInfo.farmingPractices) {
          newErrors.farmingPractices = 'Farming practices information is required';
          isValid = false;
        }
      }

      // Validate moisture content if required
      if (requirement.productType === 'cereal' && requirement.moistureContentMax) {
        if (!fcfsResponse.moistureContent) {
          newErrors.moistureContent = 'Please enter the moisture content';
          isValid = false;
        } else if (Number(fcfsResponse.moistureContent) > requirement.moistureContentMax) {
          newErrors.moistureContent = `Moisture content must be less than ${requirement.moistureContentMax}%`;
          isValid = false;
        }
      }

      setErrors(newErrors);

      if (!isValid) {
        return;
      }

      setSubmitting(true);

      // Create response object
      const responseId = database().ref(`requirements/${requirementId}/responses`).push().key;

      if (!responseId) {
        throw new Error('Failed to generate response ID');
      }

      // Upload certification images if available
      const certificationsData = [];

      if (fcfsResponse.hasCertifications && requirement.certifications?.length > 0) {
        for (const cert of requirement.certifications) {
          if (certificationImages[cert]) {
            try {
              // Convert URI to blob
              const response = await fetch(certificationImages[cert]);
              const blob = await response.blob();

              // Upload to Firebase Storage
              const filename = `requirements/${requirementId}/responses/${responseId}/certificates/${cert}_${Date.now()}`;
              const imageRef = storage().ref(filename);

              await imageRef.put(blob);
              const certificateUrl = await imageRef.getDownloadURL();

              certificationsData.push({
                type: cert,
                issuedBy: userProfile?.displayName || 'Self-certified',
                issuedDate: Date.now(),
                expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year validity
                certificateUrl,
                verificationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
              });
            } catch (error) {
              console.error(`Error uploading ${cert} certificate image:`, error);
              // Continue without the certificate image if upload fails
            }
          }
        }
      }

      const response = {
        id: responseId,
        requirementId,
        farmerId: userProfile?.uid,
        farmerName: userProfile?.displayName || 'Unknown Farmer',
        farmerVerified: userProfile?.reputation?.verifiedStatus || false,

        // Offer details
        offeredQuantity: requirement.quantityRequired,
        offeredPrice: Number(fcfsPrice),
        offeredPriceUnit: fcfsPriceUnit,
        currency: 'INR',

        // Product details
        productDetails: {
          farmLocation: userProfile?.address || 'Unknown',
          certifications: certificationsData,
          pesticidefree: fcfsResponse.isPesticideFree,
          moistureContent: fcfsResponse.moistureContent ? Number(fcfsResponse.moistureContent) : undefined,
        },

        // Traceability information if provided
        traceabilityInfo: fcfsResponse.canProvideTraceability ? {
          farmName: traceabilityInfo.farmName,
          farmingPractices: traceabilityInfo.farmingPractices,
          harvestDate: traceabilityInfo.harvestDate.getTime(),
          farmLocation: traceabilityInfo.farmLocation,
        } : undefined,

        // Delivery details
        proposedDeliveryDate: requirement.expectedDeliveryDate,
        canHandleDelivery: requirement.deliveryHandler === 'farmer',

        // Status and timestamps
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),

        // Additional notes
        notes: bidNotes,
      };

      // Save to Firebase
      await database().ref(`requirements/${requirementId}/responses/${responseId}`).set(response);

      // Update local state
      setUserResponse(response);
      setShowFcfsForm(false);

      // Success message
      Alert.alert('Success', 'Your response has been submitted successfully');
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading requirement details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Requirement Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Requirement Header */}
        <Card style={styles.headerCard}>
          <View style={styles.requirementHeader}>
            <View style={styles.typeContainer}>
              <Ionicons
                name={requirement?.requirementType === 'bid' ? 'hammer' : 'flash'}
                size={18}
                color={requirement?.requirementType === 'bid' ? colors.secondary : colors.success}
              />
              <Text style={styles.typeText}>
                {requirement?.requirementType === 'bid' ? 'Bidding' : 'First Come First Serve'}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {requirement?.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.productName}>{requirement?.itemName}</Text>

          <View style={styles.userInfoContainer}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
            <Text style={styles.postedByText}>
              Posted by: {requirement?.userName}
              {requirement?.userVerified && (
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              )}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(requirement?.createdAt)}
            </Text>
          </View>
        </Card>

        {/* Requirement Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Requirement Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product Type:</Text>
            <Text style={styles.detailValue}>
              {requirement?.productType?.charAt(0).toUpperCase() + requirement?.productType?.slice(1)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {requirement?.quantityRequired} {requirement?.quantityUnit}
            </Text>
          </View>

          {requirement?.preferredPackagingSize > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Packaging:</Text>
              <Text style={styles.detailValue}>
                {requirement?.preferredPackagingSize} {requirement?.preferredPackagingUnit} packages
              </Text>
            </View>
          )}

          {requirement?.gradeRequirements && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quality:</Text>
              <Text style={styles.detailValue}>{requirement?.gradeRequirements}</Text>
            </View>
          )}

          {requirement?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{requirement?.description}</Text>
            </View>
          )}
        </Card>

        {/* Delivery Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected Delivery:</Text>
            <Text style={styles.detailValue}>
              {formatDate(requirement?.expectedDeliveryDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Option:</Text>
            <Text style={styles.detailValue}>
              {requirement?.deliveryOption === 'pickup' ? 'Pickup' : 'Delivery'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Handled By:</Text>
            <Text style={styles.detailValue}>
              {requirement?.deliveryHandler === 'buyer' ? 'Buyer will pickup' : 'Farmer will deliver'}
            </Text>
          </View>

          {requirement?.preferredDeliveryTimeSlot && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time Slot:</Text>
              <Text style={styles.detailValue}>
                {requirement?.preferredDeliveryTimeSlot.charAt(0).toUpperCase() +
                 requirement?.preferredDeliveryTimeSlot.slice(1)}
              </Text>
            </View>
          )}
        </Card>

        {/* Price and Payment */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Price & Payment</Text>

          {(requirement?.priceRangeMin || requirement?.priceRangeMax) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price Range:</Text>
              <Text style={styles.detailValue}>
                {requirement?.priceRangeMin ? `₹${requirement.priceRangeMin}` : ''}
                {requirement?.priceRangeMin && requirement?.priceRangeMax ? ' - ' : ''}
                {requirement?.priceRangeMax ? `₹${requirement.priceRangeMax}` : ''}
                {' per '}{requirement?.quantityUnit}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Terms:</Text>
            <Text style={styles.detailValue}>
              {requirement?.paymentTerms === 'advance' ? 'Advance Payment' :
               requirement?.paymentTerms === 'on_delivery' ? 'Payment on Delivery' : 'Credit'}
            </Text>
          </View>
        </Card>

        {/* Additional Specifications */}
        {(requirement?.certifications?.length > 0 ||
          requirement?.traceabilityRequired ||
          requirement?.pesticidefreeRequired ||
          requirement?.moistureContentMax) && (
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Additional Specifications</Text>

            {requirement?.certifications?.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Certifications:</Text>
                <Text style={styles.detailValue}>
                  {requirement.certifications.join(', ')}
                </Text>
              </View>
            )}

            {requirement?.traceabilityRequired && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Traceability:</Text>
                <Text style={styles.detailValue}>Required</Text>
              </View>
            )}

            {requirement?.pesticidefreeRequired && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pesticide-free:</Text>
                <Text style={styles.detailValue}>Required</Text>
              </View>
            )}

            {requirement?.moistureContentMax && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Max Moisture:</Text>
                <Text style={styles.detailValue}>{requirement.moistureContentMax}%</Text>
              </View>
            )}
          </Card>
        )}

        {/* Farmer Response Section */}
        {userProfile?.role === 'farmer' && (
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>
              {userResponse ? 'Your Response' : 'Respond to Requirement'}
            </Text>

            {userResponse ? (
              // Show user's existing response
              <View>
                <View style={styles.responseStatusContainer}>
                  <Text style={styles.responseStatusLabel}>Status:</Text>
                  <View style={[styles.responseStatusBadge, { backgroundColor: getResponseStatusColor(userResponse.status) }]}>
                    <Text style={styles.responseStatusText}>
                      {userResponse.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Your Offer:</Text>
                  <Text style={styles.detailValue}>
                    ₹{userResponse.offeredPrice} per {requirement.quantityUnit}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>
                    {userResponse.offeredQuantity} {requirement.quantityUnit}
                  </Text>
                </View>

                {userResponse.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.detailValue}>{userResponse.notes}</Text>
                  </View>
                )}

                <Text style={styles.responseTimestamp}>
                  Submitted on {formatDate(userResponse.createdAt)}
                </Text>
              </View>
            ) : requirement.requirementType === 'bid' ? (
              // Show bid form for bidding requirements
              hasAcceptedResponse || requirement.status !== 'open' ? (
                <View style={styles.responsePromptContainer}>
                  <Text style={styles.responsePromptText}>
                    This requirement already has an accepted response or is no longer open for bidding.
                  </Text>
                </View>
              ) : showBidForm ? (
                <View style={styles.bidFormContainer}>
                  <Input
                    label="Your Bid Price (₹ per unit)"
                    placeholder="e.g., 50"
                    value={bidPrice}
                    onChangeText={setBidPrice}
                    keyboardType="numeric"
                    required
                  />

                  <Input
                    label={`Quantity (${requirement.quantityUnit})`}
                    placeholder={`e.g., ${requirement.quantityRequired}`}
                    value={bidQuantity}
                    onChangeText={setBidQuantity}
                    keyboardType="numeric"
                    required
                  />

                  <Input
                    label="Additional Notes"
                    placeholder="Any additional information about your offer"
                    value={bidNotes}
                    onChangeText={setBidNotes}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.bidFormButtons}>
                    <Button
                      title="Cancel"
                      onPress={() => setShowBidForm(false)}
                      type="secondary"
                      style={styles.bidFormButton}
                    />
                    <Button
                      title="Submit Bid"
                      onPress={handleBidSubmit}
                      loading={submitting}
                      style={styles.bidFormButton}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.responsePromptContainer}>
                  <Text style={styles.responsePromptText}>
                    This is a bidding requirement. You can submit your price offer.
                  </Text>
                  <Button
                    title="Place a Bid"
                    onPress={() => setShowBidForm(true)}
                    fullWidth
                  />
                </View>
              )
            ) : (
              // Show first-come-first-serve form
              hasAcceptedResponse || requirement.status !== 'open' ? (
                <View style={styles.responsePromptContainer}>
                  <Text style={styles.responsePromptText}>
                    This requirement already has an accepted response or is no longer open for responses.
                  </Text>
                </View>
              ) : showFcfsForm ? (
                <View style={styles.fcfsFormContainer}>
                  <Text style={styles.fcfsFormTitle}>Confirm You Can Meet These Requirements:</Text>

                  <View style={styles.checkboxRow}>
                    <Switch
                      value={fcfsResponse.canFulfill}
                      onValueChange={(value) => setFcfsResponse({...fcfsResponse, canFulfill: value})}
                      trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                      thumbColor={fcfsResponse.canFulfill ? colors.primary : colors.mediumGray}
                    />
                    <Text style={styles.checkboxLabel}>
                      I can fulfill this requirement
                    </Text>
                  </View>

                  {/* Price Input */}
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.inputLabel}>Your Offered Price</Text>
                    <View style={styles.rowContainer}>
                      <View style={styles.priceInputWrapper}>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Enter price"
                          value={fcfsPrice}
                          onChangeText={setFcfsPrice}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.unitSelectorWrapper}>
                        <Text style={styles.perUnitText}>per</Text>
                        <View style={styles.unitsContainer}>
                          {['kg', 'quintal', 'ton'].map((unit) => (
                            <TouchableOpacity
                              key={unit}
                              style={[
                                styles.unitButton,
                                fcfsPriceUnit === unit && styles.unitButtonActive,
                              ]}
                              onPress={() => setFcfsPriceUnit(unit as 'kg' | 'quintal' | 'ton')}
                            >
                              <Text
                                style={[
                                  styles.unitButtonText,
                                  fcfsPriceUnit === unit && styles.unitButtonTextActive,
                                ]}
                              >
                                {unit.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                    {errors.fcfsPrice && <Text style={styles.errorText}>{errors.fcfsPrice}</Text>}
                  </View>

                  {requirement.certifications?.length > 0 && (
                    <View style={styles.certificationSection}>
                      <View style={styles.checkboxRow}>
                        <Switch
                          value={fcfsResponse.hasCertifications}
                          onValueChange={(value) => setFcfsResponse({...fcfsResponse, hasCertifications: value})}
                          trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                          thumbColor={fcfsResponse.hasCertifications ? colors.primary : colors.mediumGray}
                        />
                        <Text style={styles.checkboxLabel}>
                          I have the required certifications
                        </Text>
                      </View>

                      {fcfsResponse.hasCertifications && (
                        <View style={styles.certificationsContainer}>
                          <Text style={styles.certificationsTitle}>Upload Certification Images:</Text>

                          {requirement.certifications.map((cert) => (
                            <View key={cert} style={styles.certificationItem}>
                              <Text style={styles.certificationName}>
                                {cert.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </Text>

                              {certificationImages[cert] ? (
                                <View style={styles.certificateImageContainer}>
                                  <Image
                                    source={{ uri: certificationImages[cert] }}
                                    style={styles.certificateImage}
                                    resizeMode="cover"
                                  />
                                  <TouchableOpacity
                                    style={styles.removeCertificateButton}
                                    onPress={() => handleRemoveCertificateImage(cert)}
                                  >
                                    <Ionicons name="close-circle" size={24} color={colors.error} />
                                  </TouchableOpacity>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={styles.addCertificateButton}
                                  onPress={() => handleSelectCertificateImage(cert)}
                                >
                                  <Ionicons name="camera" size={24} color={colors.primary} />
                                  <Text style={styles.addCertificateText}>Upload Certificate</Text>
                                </TouchableOpacity>
                              )}

                              {errors[`certification_${cert}`] && (
                                <Text style={styles.errorText}>{errors[`certification_${cert}`]}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {requirement.traceabilityRequired && (
                    <View style={styles.traceabilitySection}>
                      <View style={styles.checkboxRow}>
                        <Switch
                          value={fcfsResponse.canProvideTraceability}
                          onValueChange={(value) => setFcfsResponse({...fcfsResponse, canProvideTraceability: value})}
                          trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                          thumbColor={fcfsResponse.canProvideTraceability ? colors.primary : colors.mediumGray}
                        />
                        <Text style={styles.checkboxLabel}>
                          I can provide traceability information
                        </Text>
                      </View>

                      {fcfsResponse.canProvideTraceability && (
                        <View style={styles.traceabilityContainer}>
                          <Text style={styles.traceabilityTitle}>Traceability Information:</Text>

                          <Input
                            label="Farm Name"
                            placeholder="Enter your farm name"
                            value={traceabilityInfo.farmName}
                            onChangeText={(value) => setTraceabilityInfo({...traceabilityInfo, farmName: value})}
                            error={errors.farmName}
                          />

                          <Input
                            label="Farming Practices"
                            placeholder="Describe your farming practices"
                            value={traceabilityInfo.farmingPractices}
                            onChangeText={(value) => setTraceabilityInfo({...traceabilityInfo, farmingPractices: value})}
                            multiline
                            numberOfLines={3}
                            error={errors.farmingPractices}
                          />

                          <Input
                            label="Farm Location"
                            placeholder="Enter your farm location"
                            value={traceabilityInfo.farmLocation}
                            onChangeText={(value) => setTraceabilityInfo({...traceabilityInfo, farmLocation: value})}
                          />

                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowHarvestDatePicker(true)}
                          >
                            <Text style={styles.inputLabel}>Harvest Date</Text>
                            <View style={styles.dateDisplay}>
                              <Text style={styles.dateText}>
                                {traceabilityInfo.harvestDate.toLocaleDateString()}
                              </Text>
                              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            </View>
                          </TouchableOpacity>

                          {showHarvestDatePicker && (
                            <DateTimePicker
                              value={traceabilityInfo.harvestDate}
                              mode="date"
                              display="default"
                              onChange={(event, selectedDate) => {
                                setShowHarvestDatePicker(false);
                                if (selectedDate) {
                                  setTraceabilityInfo({...traceabilityInfo, harvestDate: selectedDate});
                                }
                              }}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {requirement.pesticidefreeRequired && (
                    <View style={styles.checkboxRow}>
                      <Switch
                        value={fcfsResponse.isPesticideFree}
                        onValueChange={(value) => setFcfsResponse({...fcfsResponse, isPesticideFree: value})}
                        trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                        thumbColor={fcfsResponse.isPesticideFree ? colors.primary : colors.mediumGray}
                      />
                      <Text style={styles.checkboxLabel}>
                        My product is pesticide-free
                      </Text>
                    </View>
                  )}

                  {requirement.productType === 'cereal' && requirement.moistureContentMax && (
                    <Input
                      label={`Moisture Content (max ${requirement.moistureContentMax}%)`}
                      placeholder="e.g., 12"
                      value={fcfsResponse.moistureContent}
                      onChangeText={(value) => setFcfsResponse({...fcfsResponse, moistureContent: value})}
                      keyboardType="numeric"
                    />
                  )}

                  <Input
                    label="Additional Notes"
                    placeholder="Any additional information about your offer"
                    value={bidNotes}
                    onChangeText={setBidNotes}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.bidFormButtons}>
                    <Button
                      title="Cancel"
                      onPress={() => setShowFcfsForm(false)}
                      type="secondary"
                      style={styles.bidFormButton}
                    />
                    <Button
                      title="Submit Response"
                      onPress={handleFcfsSubmit}
                      loading={submitting}
                      disabled={!fcfsResponse.canFulfill}
                      style={styles.bidFormButton}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.responsePromptContainer}>
                  <Text style={styles.responsePromptText}>
                    This is a first-come-first-serve requirement. You can respond if you meet the criteria.
                  </Text>
                  <Button
                    title="Respond to Requirement"
                    onPress={() => setShowFcfsForm(true)}
                    fullWidth
                  />
                </View>
              )
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Certification styles
  certificationSection: {
    marginBottom: spacing.md,
  },
  certificationsContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.xl,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  certificationsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  certificationItem: {
    marginBottom: spacing.md,
  },
  certificationName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  certificateImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  certificateImage: {
    width: '100%',
    height: '100%',
  },
  removeCertificateButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  addCertificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceLight,
  },
  addCertificateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: spacing.xs,
  },
  // Traceability styles
  traceabilitySection: {
    marginBottom: spacing.md,
  },
  traceabilityContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.xl,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  traceabilityTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  // Price input styles
  priceInputContainer: {
    marginBottom: spacing.md,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  priceInputWrapper: {
    flex: 1,
    marginRight: spacing.md,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  unitSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perUnitText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  unitsContainer: {
    flexDirection: 'row',
  },
  unitButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lightGray,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  fcfsFormContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fcfsFormTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  headerCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  statusContainer: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  productName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  postedByText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  detailsCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    paddingBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    width: 120,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
  },
  descriptionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  responseStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  responseStatusLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  responseStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  responseStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  responseTimestamp: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'right',
  },
  bidFormContainer: {
    width: '100%',
  },
  bidFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  bidFormButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  responsePromptContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  responsePromptText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  fcfsFormContainer: {
    width: '100%',
  },
  fcfsFormTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default RequirementDetailsScreen;
