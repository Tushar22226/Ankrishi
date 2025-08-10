// Risk management models
import { ProductLocation } from './Product';

// Risk impact levels
export type RiskImpact = 'low' | 'medium' | 'high';

// Risk alert types
export type RiskAlertType = 'info' | 'warning' | 'danger';

// Risk interface
export interface Risk {
  id: string;
  name: string;
  probability: number; // 0-1
  impact: RiskImpact;
  timeframe: string;
  description: string;
  mitigationSteps: string[];
  category: string; // ID of the parent category
  createdAt: number;
  updatedAt: number;
  // Optional fields
  cropId?: string;
  cropName?: string;
  location?: ProductLocation;
  userId?: string; // If this is a user-specific risk
}

// Risk category interface
export interface RiskCategory {
  id: string;
  name: string;
  score: number; // 0-100
  description: string;
  risks: Risk[];
  createdAt: number;
  updatedAt: number;
}

// Risk alert interface
export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  message: string;
  createdAt: number;
  expiresAt?: number;
  userId?: string; // If this is a user-specific alert
  riskId?: string; // If this alert is related to a specific risk
  cropId?: string; // If this alert is related to a specific crop
  location?: ProductLocation;
}

// Risk assessment interface
export interface RiskAssessment {
  id: string;
  userId: string;
  overallRiskScore: number; // 0-100
  riskCategories: RiskCategory[];
  alerts: RiskAlert[];
  createdAt: number;
  updatedAt: number;
  location?: ProductLocation;
}

// Risk action plan interface
export interface RiskActionPlan {
  id: string;
  userId: string;
  riskId: string;
  name: string;
  description: string;
  steps: {
    id: string;
    description: string;
    isCompleted: boolean;
    dueDate?: number;
    completedDate?: number;
  }[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
