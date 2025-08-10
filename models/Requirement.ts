// Product requirement types for the marketplace
import { ProductLocation } from './Product';

// Product type for requirements
export type RequirementProductType = 'fruit' | 'vegetable' | 'cereal';

// Packaging size units
export type PackagingSizeUnit = 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen' | 'box' | 'packet';

// Delivery time slots
export type DeliveryTimeSlot = 'morning' | 'afternoon' | 'evening';

// Payment terms
export type PaymentTerm = 'advance' | 'on_delivery' | 'credit';

// Requirement type
export type RequirementType = 'bid' | 'first_come_first_serve';

// Certification types
export type RequirementCertificationType =
  | 'organic'
  | 'natural_farming'
  | 'gmo_free'
  | 'pesticide_free'
  | 'fair_trade'
  | 'aacc'; // Agricultural and Allied Commodities Certification

// Product requirement interface
export interface ProductRequirement {
  id: string;
  userId: string;
  userName: string;
  userVerified?: boolean;
  
  // Basic requirement details
  productType: RequirementProductType;
  itemName: string;
  description?: string;
  
  // Quantity and packaging
  quantityRequired: number;
  quantityUnit: PackagingSizeUnit;
  preferredPackagingSize: number;
  preferredPackagingUnit: PackagingSizeUnit;
  
  // Quality and specifications
  gradeRequirements?: string;
  qualitySpecifications?: string[];
  
  // Delivery details
  expectedDeliveryDate: number; // timestamp
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  deliveryHandler: 'buyer' | 'farmer';
  deliveryOption: 'pickup' | 'delivery';
  preferredDeliveryTimeSlot?: DeliveryTimeSlot;
  deliveryLocation: ProductLocation;
  
  // Price and payment
  priceRangeMin?: number;
  priceRangeMax?: number;
  currency: string;
  paymentTerms: PaymentTerm;
  creditPeriodDays?: number; // Only if paymentTerms is 'credit'
  
  // Requirement type
  requirementType: RequirementType;
  bidEndDate?: number; // Only if requirementType is 'bid'
  
  // Additional specifications
  certifications?: RequirementCertificationType[];
  traceabilityRequired?: boolean;
  pesticidefreeRequired?: boolean;
  moistureContentMax?: number; // For cereals
  
  // Status and timestamps
  status: 'open' | 'in_progress' | 'fulfilled' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  fulfilledAt?: number;
  cancelledAt?: number;
  
  // Responses/bids
  responses?: RequirementResponse[];
}

// Requirement response/bid interface
export interface RequirementResponse {
  id: string;
  requirementId: string;
  farmerId: string;
  farmerName: string;
  farmerVerified?: boolean;
  
  // Offer details
  offeredQuantity: number;
  offeredPrice: number;
  currency: string;
  
  // Product details
  productDetails?: {
    harvestDate?: number;
    grade?: string;
    certifications?: RequirementCertificationType[];
    farmLocation?: string;
    moistureContent?: number;
    pesticidefree?: boolean;
  };
  
  // Delivery details
  proposedDeliveryDate: number;
  canHandleDelivery: boolean;
  
  // Status and timestamps
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  acceptedAt?: number;
  rejectedAt?: number;
  
  // Additional notes
  notes?: string;
}
