import { ProductLocation } from './Product';

// Contract types
export type ContractType = 'supply' | 'purchase' | 'rental' | 'service' | 'labor' | 'farming';

// Contract status
export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';

// Contract interface
export interface Contract {
  id: string;
  title: string;
  type: ContractType;
  creatorId: string;
  creatorRole: 'farmer' | 'vendor' | 'buyer' | 'consultant';
  parties: {
    firstPartyId: string;
    firstPartyUsername: string;
    firstPartyVerified?: boolean;
    secondPartyId?: string;
    secondPartyUsername?: string;
    secondPartyVerified?: boolean;
  };
  startDate: number; // timestamp
  endDate: number; // timestamp
  tenderEndDate?: number; // timestamp for tender closing
  value: number;
  status: ContractStatus;
  description: string;
  terms: string[];
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
  location?: ProductLocation;
  paymentTerms?: string;
  deliveryTerms?: string;
  qualityStandards?: string[];
  documents?: string[]; // URLs to contract documents
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: number;
  }[];
  bids?: ContractBid[];
  createdAt: number;
  updatedAt: number;
  isTender: boolean; // Whether this contract is open for bidding
  chatId?: string; // ID of the chat associated with this contract

  // Contract farming specific fields
  farmingDetails?: {
    cropType: string;
    landArea: number;
    landAreaUnit: 'acre' | 'hectare';
    expectedYield: number;
    yieldUnit: string;
    farmingPractices: string[];
    seedProvision: boolean;
    inputProvision: boolean;
    harvestingSupport: boolean;
    qualityParameters: {
      parameter: string;
      minValue?: number;
      maxValue?: number;
      unit?: string;
    }[];
    paymentSchedule: {
      milestone: string;
      percentage: number;
      estimatedDate?: number;
    }[];
    // AACC certification requirements
    aaccRequirements?: {
      isRequired: boolean;
      minimumGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
      minimumQualityScore: number; // 0-100
      minimumSafetyScore: number; // 0-100
      requiredStandards: string[];
      testingLabPreferences?: string[];
      certificationCostCoverage: 'buyer' | 'farmer' | 'shared';
      costSharingRatio?: number; // If shared, percentage covered by buyer (0-100)
    };
  };

  // Structured bidding fields
  structuredBidding?: {
    isEnabled: boolean;
    bidParameters: {
      name: string;
      description: string;
      type: 'numeric' | 'boolean' | 'text' | 'date';
      unit?: string;
      minValue?: number;
      maxValue?: number;
      isRequired: boolean;
      weight: number; // Weight in the overall bid evaluation (0-100)
    }[];
    evaluationMethod: 'automatic' | 'manual';
    minimumQualifications?: string[];
  }
}

// Contract bid interface
export interface ContractBid {
  id: string;
  contractId: string;
  bidderId: string;
  bidderUsername: string;
  bidderRole: 'farmer' | 'vendor' | 'buyer' | 'consultant';
  bidAmount: number;
  bidDate: number;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  // Company details
  companyName?: string;
  companyAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  gstNumber?: string;
  experience?: string;
  counterOffer?: {
    amount: number;
    date: number;
    status: 'pending' | 'accepted' | 'rejected';
  };

  // Structured bid parameters
  structuredParameters?: {
    parameterName: string;
    value: string | number | boolean;
  }[];

  // Bid score (calculated based on structured parameters)
  bidScore?: number;

  // Supporting documents
  supportingDocuments?: {
    name: string;
    url: string;
    type: string;
    uploadedAt: number;
  }[];
}

// Contract template interface
export interface ContractTemplate {
  id: string;
  title: string;
  type: ContractType;
  description: string;
  terms: string[];
  paymentTerms?: string;
  deliveryTerms?: string;
  qualityStandards?: string[];
  createdAt: number;
  updatedAt: number;
}
