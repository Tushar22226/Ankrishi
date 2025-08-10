// Finance models for tracking income, expenses, and financial planning

// Transaction categories
export type IncomeCategory = 
  | 'crop_sales' 
  | 'livestock_sales' 
  | 'equipment_rental' 
  | 'land_lease' 
  | 'government_subsidy' 
  | 'insurance_claim' 
  | 'other_income';

export type ExpenseCategory = 
  | 'seeds' 
  | 'fertilizers' 
  | 'pesticides' 
  | 'equipment_purchase' 
  | 'equipment_rental' 
  | 'equipment_maintenance' 
  | 'irrigation' 
  | 'labor' 
  | 'land_lease' 
  | 'fuel' 
  | 'electricity' 
  | 'transportation' 
  | 'storage' 
  | 'marketing' 
  | 'loan_payment' 
  | 'insurance' 
  | 'taxes' 
  | 'other_expense';

// Base transaction interface
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  date: number; // timestamp
  description: string;
  attachments?: string[]; // URLs to receipts or other documents
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

// Income transaction
export interface Income extends Transaction {
  type: 'income';
  category: IncomeCategory;
  source?: string;
  cropId?: string;
  cropName?: string;
  quantity?: number;
  quantityUnit?: string;
  pricePerUnit?: number;
  orderId?: string; // If income is from an order
}

// Expense transaction
export interface Expense extends Transaction {
  type: 'expense';
  category: ExpenseCategory;
  vendor?: string;
  paymentMethod?: string;
  cropId?: string; // If expense is related to a specific crop
  cropName?: string;
  orderId?: string; // If expense is from an order
}

// Helper functions to check transaction type
export function isIncome(transaction: Transaction): transaction is Income {
  return (transaction as Income).type === 'income';
}

export function isExpense(transaction: Transaction): transaction is Expense {
  return (transaction as Expense).type === 'expense';
}

// Financial summary interface
export interface FinancialSummary {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate: number;
  endDate: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  incomeByCategory: Record<IncomeCategory, number>;
  expenseByCategory: Record<ExpenseCategory, number>;
  cropProfitability?: Record<string, {
    income: number;
    expense: number;
    profit: number;
  }>;
}

// Budget interface
export interface Budget {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: number;
  endDate: number;
  totalBudget: number;
  allocations: {
    category: ExpenseCategory;
    amount: number;
    spent: number;
    remaining: number;
  }[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

// Financial goal interface
export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: number;
  targetDate: number;
  category: 'savings' | 'equipment' | 'land' | 'expansion' | 'debt_repayment' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'in_progress' | 'achieved' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

// Loan interface
export interface Loan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  lender: string;
  principalAmount: number;
  interestRate: number; // Annual percentage rate
  startDate: number;
  endDate: number;
  installmentAmount: number;
  installmentFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  totalInstallments: number;
  paidInstallments: number;
  remainingAmount: number;
  nextPaymentDate: number;
  status: 'active' | 'paid' | 'defaulted';
  documents?: string[]; // URLs to loan documents
  createdAt: number;
  updatedAt: number;
}

// Financial plan interface
export interface FinancialPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: number;
  endDate: number;
  goals: FinancialGoal[];
  budgets: Budget[];
  loans: Loan[];
  recommendations: {
    id: string;
    title: string;
    description: string;
    category: 'income_increase' | 'expense_reduction' | 'investment' | 'risk_management' | 'other';
    potentialImpact: 'low' | 'medium' | 'high';
    implementationDifficulty: 'easy' | 'medium' | 'hard';
    isImplemented: boolean;
  }[];
  createdAt: number;
  updatedAt: number;
  lastReviewedAt: number;
}
