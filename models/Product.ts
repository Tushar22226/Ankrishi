// Product types for the marketplace
export type ProductCategory = 'fertilizer' | 'equipment' | 'produce';

// Stock quantity units
export type StockQuantityUnit = 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen' | 'box' | 'packet';
export type ProductSubcategory =
  // Fertilizer subcategories
  | 'organic' | 'chemical' | 'biofertilizer'
  // Equipment subcategories
  | 'tractor' | 'harvester' | 'irrigation' | 'drone' | 'sensor' | 'tools'
  // Produce subcategories
  | 'fruits' | 'vegetables' | 'grains' | 'pulses' | 'spices';

// Product availability modes
export type ProductAvailabilityMode = 'delivery_only' | 'pickup_available' | 'market_only' | 'all';

// Produce ripeness levels
export type ProduceRipeness = 'ripe' | 'unripe' | 'slightly_unripe' | 'overripe';

// Certification types
export type CertificationType =
  | 'organic'
  | 'natural_farming'
  | 'gmo_free'
  | 'pesticide_free'
  | 'fair_trade'
  | 'aacc'; // Agricultural and Allied Commodities Certification

export type RentalPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'seasonal';

export interface ProductLocation {
  latitude: number;
  longitude: number;
  address: string;
  district?: string;
  state?: string;
}

export interface ProductRating {
  userId: string;
  rating: number; // 1-5
  review?: string;
  timestamp: number;
}

export interface ProductImage {
  url: string;
  isMain: boolean;
  uploadedAt: number;
}

// Base product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory: ProductSubcategory;
  price: number;
  discountedPrice?: number;
  currency: string;
  stock: number;
  stockUnit: StockQuantityUnit;
  images: ProductImage[];
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  sellerVerified?: boolean; // Indicates if the seller is verified
  location: ProductLocation;
  ratings: ProductRating[];
  averageRating: number;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  isVerified: boolean;
  tags: string[];
  // Availability mode for the product
  availabilityMode?: ProductAvailabilityMode; // Indicates how the product can be obtained (default: 'all')
  // Direct farmer-to-buyer fields
  isDirectFromFarmer?: boolean; // Indicates if this product is sold directly by a farmer
  farmDetails?: {
    farmName?: string;
    farmingMethod?: 'conventional' | 'organic' | 'natural';
    certifications?: string[];
    harvestDate?: number;
    farmLocation?: string;
    farmerId?: string;
    farmerVerified?: boolean;
  };
  // Transparency fields
  transparencyInfo?: {
    originStory?: string; // Story of how the product was grown/made
    productionProcess?: string[]; // Steps in the production process
    sustainabilityScore?: number; // 1-5 rating of sustainability
    carbonFootprint?: number; // Carbon footprint in kg CO2
    waterUsage?: number; // Water usage in liters
    chemicalsUsed?: string[]; // List of chemicals used, if any
  };
  // Scientific verification fields
  scientificVerification?: {
    isVerified: boolean;
    verificationDate?: number;
    verifiedBy?: string;
    verificationMethod?: string;
    verificationResults?: {
      parameter: string;
      value: string;
      unit?: string;
      standardValue?: string;
      isPassing: boolean;
    }[];
    certificateUrl?: string;
    expiryDate?: number;
  };
  // Product journey tracking
  productJourney?: {
    journeyId: string;
    stages: {
      stageName: string;
      location: ProductLocation;
      timestamp: number;
      handledBy: string;
      description?: string;
      imageUrl?: string;
    }[];
    qrCodeUrl?: string;
  };
  // Certification details
  certifications?: {
    type: CertificationType;
    issuedBy: string;
    issuedDate: number;
    expiryDate: number;
    certificateUrl?: string;
    verificationCode?: string;
    // AACC specific fields
    aaccDetails?: {
      certificateNumber: string;
      grade: 'A+' | 'A' | 'B+' | 'B' | 'C';
      qualityScore: number; // 0-100
      safetyScore: number; // 0-100
      authenticityVerified: boolean;
      testingLab: string;
      testingDate: number;
      standardsCompliance: string[];
      qrCodeUrl?: string;
    };
  }[];
}

// Fertilizer specific properties
export interface Fertilizer extends Product {
  category: 'fertilizer';
  subcategory: 'organic' | 'chemical' | 'biofertilizer';
  weight: number;
  weightUnit: 'g' | 'kg' | 'ton';
  composition: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    other?: Record<string, number>;
  };
  applicationMethod: string;
  certifications?: string[];
  manufacturer: string;
  expiryDate?: number;
}

// Equipment specific properties
export interface Equipment extends Product {
  category: 'equipment';
  subcategory: 'tractor' | 'harvester' | 'irrigation' | 'drone' | 'sensor' | 'tools';
  brand: string;
  model: string;
  manufactureYear?: number;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  specifications: Record<string, string>;
  isForRent: boolean;
  isForSale: boolean;
  rentalPrice?: number;
  rentalPeriod?: RentalPeriod;
  deposit?: number;
  availability: {
    startDate?: number;
    endDate?: number;
    availableDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  };
}

// Produce specific properties
export interface Produce extends Product {
  category: 'produce';
  subcategory: 'fruits' | 'vegetables' | 'grains' | 'pulses' | 'spices';
  harvestDate: number;
  shelfLife?: number; // in days
  organicCertified: boolean;
  growingMethod?: 'conventional' | 'organic' | 'hydroponic';
  grade?: 'A' | 'B' | 'C';
  ripeness?: ProduceRipeness; // Ripeness level for fruits and vegetables
  minimumOrderQuantity?: number;
  nutritionalInfo?: Record<string, string>;
  seasonality?: {
    startMonth: number; // 1-12
    endMonth: number; // 1-12
  };
}

// Helper function to check product type
export function isFertilizer(product: Product): product is Fertilizer {
  return product.category === 'fertilizer';
}

export function isEquipment(product: Product): product is Equipment {
  return product.category === 'equipment';
}

export function isProduce(product: Product): product is Produce {
  return product.category === 'produce';
}

// Order status
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

// Payment status
export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

// Payment method
export type PaymentMethod =
  | 'cash_on_delivery'
  | 'upi'
  | 'bank_transfer'
  | 'wallet';

// Order item
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  totalPrice: number;
  isRental?: boolean;
  rentalPeriod?: RentalPeriod;
  rentalStartDate?: number;
  rentalEndDate?: number;
}

// Order interface
export interface Order {
  id: string;
  userId: string;
  sellerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingInfo?: {
    trackingId?: string;
    carrier?: string;
    estimatedDelivery?: number;
    trackingUrl?: string;
    trackingHistory?: {
      status: string;
      timestamp: number;
      location?: string;
    }[];
  };
  createdAt: number;
  updatedAt: number;
  deliveredAt?: number;
  cancelledAt?: number;
  returnedAt?: number;
  notes?: string;
  // Direct farmer-to-buyer fields
  isDirectFarmerOrder?: boolean; // Flag for direct farmer-to-buyer orders
  commissionPercentage?: number; // Commission percentage (0 for direct orders)
  deliveryOption?: 'self_pickup' | 'delivery'; // Whether the buyer will pick up or have it delivered
  deliveryAgentId?: string; // ID of the delivery agent (if applicable)
  // Rating and feedback
  buyerRating?: {
    rating: number;
    comment?: string;
    timestamp: number;
  };
  sellerRating?: {
    rating: number;
    comment?: string;
    timestamp: number;
  };
  // Transparency tracking
  transparencyTracking?: {
    farmLocation?: ProductLocation;
    harvestDate?: number;
    processingDate?: number;
    packagingDate?: number;
    qualityChecks?: {
      checkName: string;
      result: string;
      timestamp: number;
      performedBy: string;
    }[];
    transportRoute?: {
      startLocation: ProductLocation;
      endLocation: ProductLocation;
      distance: number;
      estimatedTime: number;
      actualTime?: number;
      transportMethod: string;
    };
  };
}
