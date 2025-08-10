import database from '@react-native-firebase/database';
import {
  Transaction,
  Income,
  Expense,
  FinancialSummary,
  Budget,
  FinancialGoal,
  Loan,
  FinancialPlan,
  IncomeCategory,
  ExpenseCategory
} from '../models/Finance';
import { Order } from '../models/Product';
import MarketplaceService from './MarketplaceService';
import ContractService from './ContractService';

class FinanceService {
  // Add a new income transaction
  async addIncome(income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Create a reference to the transactions collection
      const transactionsRef = database().ref('transactions');

      // Generate a new transaction ID
      const newTransactionRef = transactionsRef.push();

      // Create the complete income object
      const completeIncome = {
        ...income,
        id: newTransactionRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the income to the database
      await newTransactionRef.set(completeIncome);

      return newTransactionRef.key as string;
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  }

  // Add a new expense transaction
  async addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Create a reference to the transactions collection
      const transactionsRef = database().ref('transactions');

      // Generate a new transaction ID
      const newTransactionRef = transactionsRef.push();

      // Create the complete expense object
      const completeExpense = {
        ...expense,
        id: newTransactionRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the expense to the database
      await newTransactionRef.set(completeExpense);

      return newTransactionRef.key as string;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Get a transaction by ID
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      // Create a reference to the transaction
      const transactionRef = database().ref(`transactions/${transactionId}`);

      // Get the transaction
      const snapshot = await transactionRef.once('value');

      if (snapshot.exists()) {
        return snapshot.val() as Transaction;
      }

      return null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  // Get transactions by user
  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    try {
      // Create a query to get transactions by user
      const transactionsRef = database().ref('transactions')
        .orderByChild('userId')
        .equalTo(userId);

      // Get the transactions
      const snapshot = await transactionsRef.once('value');

      if (snapshot.exists()) {
        const transactions: Transaction[] = [];

        snapshot.forEach((childSnapshot) => {
          transactions.push(childSnapshot.val() as Transaction);
          return undefined; // Needed for TypeScript
        });

        return transactions;
      }

      return [];
    } catch (error) {
      console.error('Error getting transactions by user:', error);
      throw error;
    }
  }

  // Get transactions by date range
  async getTransactionsByDateRange(userId: string, startDate: number, endDate: number): Promise<Transaction[]> {
    try {
      // Get all transactions for the user
      const transactions = await this.getTransactionsByUser(userId);

      // Filter transactions by date range
      return transactions.filter(transaction =>
        transaction.date >= startDate && transaction.date <= endDate
      );
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw error;
    }
  }

  // Get transactions by category
  async getTransactionsByCategory(userId: string, category: IncomeCategory | ExpenseCategory): Promise<Transaction[]> {
    try {
      // Get all transactions for the user
      const transactions = await this.getTransactionsByUser(userId);

      // Filter transactions by category
      return transactions.filter(transaction =>
        (transaction as any).category === category
      );
    } catch (error) {
      console.error('Error getting transactions by category:', error);
      throw error;
    }
  }

  // Update a transaction
  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      // Create a reference to the transaction
      const transactionRef = ref(database, `transactions/${transactionId}`);

      // Get the current transaction
      const snapshot = await get(transactionRef);

      if (snapshot.exists()) {
        const currentTransaction = snapshot.val() as Transaction;

        // Create the updated transaction
        const updatedTransaction = {
          ...currentTransaction,
          ...updates,
          updatedAt: Date.now(),
        };

        // Save the updated transaction
        await set(transactionRef, updatedTransaction);
      } else {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Delete a transaction
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      // Create a reference to the transaction
      const transactionRef = ref(database, `transactions/${transactionId}`);

      // Delete the transaction
      await set(transactionRef, null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Get order-based financial data
  async getOrderFinancialData(userId: string, startDate: number, endDate: number): Promise<{
    salesOrders: Order[];
    purchaseOrders: Order[];
    salesTotal: number;
    purchasesTotal: number;
  }> {
    try {
      // Get sales orders (where user is seller)
      const salesOrders = await MarketplaceService.getOrdersBySeller(userId);

      // Get purchase orders (where user is buyer)
      const purchaseOrders = await MarketplaceService.getOrdersByUser(userId);

      // Filter by date range
      const filteredSalesOrders = salesOrders.filter(
        order => order.createdAt >= startDate && order.createdAt <= endDate
      );

      const filteredPurchaseOrders = purchaseOrders.filter(
        order => order.createdAt >= startDate && order.createdAt <= endDate
      );

      // Calculate totals
      const salesTotal = filteredSalesOrders.reduce(
        (total, order) => total + order.totalAmount,
        0
      );

      const purchasesTotal = filteredPurchaseOrders.reduce(
        (total, order) => total + order.totalAmount,
        0
      );

      return {
        salesOrders: filteredSalesOrders,
        purchaseOrders: filteredPurchaseOrders,
        salesTotal,
        purchasesTotal
      };
    } catch (error) {
      console.error('Error getting order financial data:', error);
      throw error;
    }
  }

  // Get contract-based financial data
  async getContractFinancialData(userId: string, startDate: number, endDate: number): Promise<{
    contracts: any[];
    contractsTotal: number;
    paymentsReceived: number;
    paymentsMade: number;
  }> {
    try {
      // Get all contracts for the user
      const contracts = await ContractService.getUserContracts(userId);

      // Filter by date range (using contract creation date)
      const filteredContracts = contracts.filter(
        contract => contract.createdAt >= startDate && contract.createdAt <= endDate
      );

      let paymentsReceived = 0;
      let paymentsMade = 0;

      // Process payments for each contract
      for (const contract of filteredContracts) {
        // Check if the user is the creator of the contract
        const isCreator = contract.creatorId === userId;

        // Get payments for this contract
        if (contract.payments) {
          Object.values(contract.payments).forEach((payment: any) => {
            // Only count payments within the date range
            if (payment.date >= startDate && payment.date <= endDate) {
              // If user is creator, they receive payments
              if (isCreator) {
                paymentsReceived += payment.amount;
              } else {
                // If user is not creator, they make payments
                paymentsMade += payment.amount;
              }
            }
          });
        }
      }

      // Calculate total contract value
      const contractsTotal = filteredContracts.reduce(
        (total, contract) => total + (contract.value || 0),
        0
      );

      return {
        contracts: filteredContracts,
        contractsTotal,
        paymentsReceived,
        paymentsMade
      };
    } catch (error) {
      console.error('Error getting contract financial data:', error);
      throw error;
    }
  }

  // Generate a financial summary for a date range
  async generateFinancialSummary(userId: string, startDate: number, endDate: number): Promise<FinancialSummary> {
    try {
      // Get transactions for the date range
      const transactions = await this.getTransactionsByDateRange(userId, startDate, endDate);

      // Get order-based financial data
      const orderData = await this.getOrderFinancialData(userId, startDate, endDate);

      // Get contract-based financial data
      const contractData = await this.getContractFinancialData(userId, startDate, endDate);

      // Initialize summary
      const summary: FinancialSummary = {
        userId,
        period: 'custom',
        startDate,
        endDate,
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        incomeByCategory: {} as Record<IncomeCategory, number>,
        expenseByCategory: {} as Record<ExpenseCategory, number>,
        cropProfitability: {},
      };

      // Initialize income categories
      const incomeCategories: IncomeCategory[] = [
        'crop_sales', 'livestock_sales', 'equipment_rental', 'land_lease',
        'government_subsidy', 'insurance_claim', 'other_income'
      ];

      incomeCategories.forEach(category => {
        summary.incomeByCategory[category] = 0;
      });

      // Initialize expense categories
      const expenseCategories: ExpenseCategory[] = [
        'seeds', 'fertilizers', 'pesticides', 'equipment_purchase', 'equipment_rental',
        'equipment_maintenance', 'irrigation', 'labor', 'land_lease', 'fuel',
        'electricity', 'transportation', 'storage', 'marketing', 'loan_payment',
        'insurance', 'taxes', 'other_expense'
      ];

      expenseCategories.forEach(category => {
        summary.expenseByCategory[category] = 0;
      });

      // Process transactions
      transactions.forEach(transaction => {
        if ((transaction as Income).type === 'income') {
          const income = transaction as Income;
          summary.totalIncome += income.amount;
          summary.incomeByCategory[income.category] += income.amount;

          // Track crop profitability
          if (income.cropName) {
            if (!summary.cropProfitability[income.cropName]) {
              summary.cropProfitability[income.cropName] = {
                income: 0,
                expense: 0,
                profit: 0,
              };
            }

            summary.cropProfitability[income.cropName].income += income.amount;
            summary.cropProfitability[income.cropName].profit =
              summary.cropProfitability[income.cropName].income -
              summary.cropProfitability[income.cropName].expense;
          }
        } else if ((transaction as Expense).type === 'expense') {
          const expense = transaction as Expense;
          summary.totalExpense += expense.amount;
          summary.expenseByCategory[expense.category] += expense.amount;

          // Track crop profitability
          if (expense.cropName) {
            if (!summary.cropProfitability[expense.cropName]) {
              summary.cropProfitability[expense.cropName] = {
                income: 0,
                expense: 0,
                profit: 0,
              };
            }

            summary.cropProfitability[expense.cropName].expense += expense.amount;
            summary.cropProfitability[expense.cropName].profit =
              summary.cropProfitability[expense.cropName].income -
              summary.cropProfitability[expense.cropName].expense;
          }
        }
      });

      // Add sales from orders to income
      summary.totalIncome += orderData.salesTotal;
      if (!summary.incomeByCategory['crop_sales']) {
        summary.incomeByCategory['crop_sales'] = 0;
      }
      summary.incomeByCategory['crop_sales'] += orderData.salesTotal;

      // Add purchases from orders to expenses
      summary.totalExpense += orderData.purchasesTotal;

      // Add contract payments to income/expenses
      summary.totalIncome += contractData.paymentsReceived;
      summary.totalExpense += contractData.paymentsMade;

      // Add contract payments to appropriate categories
      if (!summary.incomeByCategory['other_income']) {
        summary.incomeByCategory['other_income'] = 0;
      }
      summary.incomeByCategory['other_income'] += contractData.paymentsReceived;

      if (!summary.expenseByCategory['other_expense']) {
        summary.expenseByCategory['other_expense'] = 0;
      }
      summary.expenseByCategory['other_expense'] += contractData.paymentsMade;

      // Categorize purchases based on product categories
      orderData.purchaseOrders.forEach(order => {
        order.items.forEach(item => {
          // Determine expense category based on product name or other attributes
          // This is a simple implementation - in a real app, you might have more detailed categorization
          let category: ExpenseCategory = 'other_expense';

          const productName = item.productName.toLowerCase();
          if (productName.includes('fertilizer') || productName.includes('nutrient')) {
            category = 'fertilizers';
          } else if (productName.includes('seed')) {
            category = 'seeds';
          } else if (productName.includes('pesticide') || productName.includes('insecticide') || productName.includes('fungicide')) {
            category = 'pesticides';
          } else if (productName.includes('equipment') || productName.includes('tool') || productName.includes('machinery')) {
            if (item.isRental) {
              category = 'equipment_rental';
            } else {
              category = 'equipment_purchase';
            }
          }

          if (!summary.expenseByCategory[category]) {
            summary.expenseByCategory[category] = 0;
          }
          summary.expenseByCategory[category] += item.totalPrice;
        });
      });

      // Calculate net profit
      summary.netProfit = summary.totalIncome - summary.totalExpense;

      return summary;
    } catch (error) {
      console.error('Error generating financial summary:', error);
      throw error;
    }
  }

  // Create a budget
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Create a reference to the budgets collection
      const budgetsRef = ref(database, 'budgets');

      // Generate a new budget ID
      const newBudgetRef = push(budgetsRef);

      // Create the complete budget object
      const completeBudget = {
        ...budget,
        id: newBudgetRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the budget to the database
      await set(newBudgetRef, completeBudget);

      return newBudgetRef.key as string;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  // Get budgets by user
  async getBudgetsByUser(userId: string): Promise<Budget[]> {
    try {
      // Create a query to get budgets by user
      const budgetsQuery = query(
        ref(database, 'budgets'),
        orderByChild('userId'),
        equalTo(userId)
      );

      // Get the budgets
      const snapshot = await get(budgetsQuery);

      if (snapshot.exists()) {
        const budgets: Budget[] = [];

        snapshot.forEach((childSnapshot) => {
          budgets.push(childSnapshot.val() as Budget);
        });

        return budgets;
      }

      return [];
    } catch (error) {
      console.error('Error getting budgets by user:', error);
      throw error;
    }
  }

  // Update a budget
  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    try {
      // Create a reference to the budget
      const budgetRef = ref(database, `budgets/${budgetId}`);

      // Get the current budget
      const snapshot = await get(budgetRef);

      if (snapshot.exists()) {
        const currentBudget = snapshot.val() as Budget;

        // Create the updated budget
        const updatedBudget = {
          ...currentBudget,
          ...updates,
          updatedAt: Date.now(),
        };

        // Save the updated budget
        await set(budgetRef, updatedBudget);
      } else {
        throw new Error(`Budget with ID ${budgetId} not found`);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  // Create a financial goal
  async createFinancialGoal(goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Create a reference to the goals collection
      const goalsRef = ref(database, 'financial_goals');

      // Generate a new goal ID
      const newGoalRef = push(goalsRef);

      // Create the complete goal object
      const completeGoal = {
        ...goal,
        id: newGoalRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the goal to the database
      await set(newGoalRef, completeGoal);

      return newGoalRef.key as string;
    } catch (error) {
      console.error('Error creating financial goal:', error);
      throw error;
    }
  }

  // Get financial goals by user
  async getFinancialGoalsByUser(userId: string): Promise<FinancialGoal[]> {
    try {
      // Create a query to get goals by user
      const goalsQuery = query(
        ref(database, 'financial_goals'),
        orderByChild('userId'),
        equalTo(userId)
      );

      // Get the goals
      const snapshot = await get(goalsQuery);

      if (snapshot.exists()) {
        const goals: FinancialGoal[] = [];

        snapshot.forEach((childSnapshot) => {
          goals.push(childSnapshot.val() as FinancialGoal);
        });

        return goals;
      }

      return [];
    } catch (error) {
      console.error('Error getting financial goals by user:', error);
      throw error;
    }
  }

  // Update a financial goal
  async updateFinancialGoal(goalId: string, updates: Partial<FinancialGoal>): Promise<void> {
    try {
      // Create a reference to the goal
      const goalRef = ref(database, `financial_goals/${goalId}`);

      // Get the current goal
      const snapshot = await get(goalRef);

      if (snapshot.exists()) {
        const currentGoal = snapshot.val() as FinancialGoal;

        // Create the updated goal
        const updatedGoal = {
          ...currentGoal,
          ...updates,
          updatedAt: Date.now(),
        };

        // Save the updated goal
        await set(goalRef, updatedGoal);
      } else {
        throw new Error(`Financial goal with ID ${goalId} not found`);
      }
    } catch (error) {
      console.error('Error updating financial goal:', error);
      throw error;
    }
  }

  // Create a loan
  async createLoan(loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Create a reference to the loans collection
      const loansRef = ref(database, 'loans');

      // Generate a new loan ID
      const newLoanRef = push(loansRef);

      // Create the complete loan object
      const completeLoan = {
        ...loan,
        id: newLoanRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the loan to the database
      await set(newLoanRef, completeLoan);

      return newLoanRef.key as string;
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  // Get loans by user
  async getLoansByUser(userId: string): Promise<Loan[]> {
    try {
      // Create a query to get loans by user
      const loansQuery = query(
        ref(database, 'loans'),
        orderByChild('userId'),
        equalTo(userId)
      );

      // Get the loans
      const snapshot = await get(loansQuery);

      if (snapshot.exists()) {
        const loans: Loan[] = [];

        snapshot.forEach((childSnapshot) => {
          loans.push(childSnapshot.val() as Loan);
        });

        return loans;
      }

      return [];
    } catch (error) {
      console.error('Error getting loans by user:', error);
      throw error;
    }
  }

  // Update a loan
  async updateLoan(loanId: string, updates: Partial<Loan>): Promise<void> {
    try {
      // Create a reference to the loan
      const loanRef = ref(database, `loans/${loanId}`);

      // Get the current loan
      const snapshot = await get(loanRef);

      if (snapshot.exists()) {
        const currentLoan = snapshot.val() as Loan;

        // Create the updated loan
        const updatedLoan = {
          ...currentLoan,
          ...updates,
          updatedAt: Date.now(),
        };

        // Save the updated loan
        await set(loanRef, updatedLoan);
      } else {
        throw new Error(`Loan with ID ${loanId} not found`);
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  }

  // Create a financial plan
  async createFinancialPlan(plan: Omit<FinancialPlan, 'id' | 'createdAt' | 'updatedAt' | 'lastReviewedAt'>): Promise<string> {
    try {
      // Create a reference to the plans collection
      const plansRef = ref(database, 'financial_plans');

      // Generate a new plan ID
      const newPlanRef = push(plansRef);

      // Create the complete plan object
      const completePlan = {
        ...plan,
        id: newPlanRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastReviewedAt: Date.now(),
      };

      // Save the plan to the database
      await set(newPlanRef, completePlan);

      return newPlanRef.key as string;
    } catch (error) {
      console.error('Error creating financial plan:', error);
      throw error;
    }
  }

  // Get financial plans by user
  async getFinancialPlansByUser(userId: string): Promise<FinancialPlan[]> {
    try {
      // Create a query to get plans by user
      const plansQuery = query(
        ref(database, 'financial_plans'),
        orderByChild('userId'),
        equalTo(userId)
      );

      // Get the plans
      const snapshot = await get(plansQuery);

      if (snapshot.exists()) {
        const plans: FinancialPlan[] = [];

        snapshot.forEach((childSnapshot) => {
          plans.push(childSnapshot.val() as FinancialPlan);
        });

        return plans;
      }

      return [];
    } catch (error) {
      console.error('Error getting financial plans by user:', error);
      throw error;
    }
  }

  // Update a financial plan
  async updateFinancialPlan(planId: string, updates: Partial<FinancialPlan>): Promise<void> {
    try {
      // Create a reference to the plan
      const planRef = ref(database, `financial_plans/${planId}`);

      // Get the current plan
      const snapshot = await get(planRef);

      if (snapshot.exists()) {
        const currentPlan = snapshot.val() as FinancialPlan;

        // Create the updated plan
        const updatedPlan = {
          ...currentPlan,
          ...updates,
          updatedAt: Date.now(),
          lastReviewedAt: Date.now(),
        };

        // Save the updated plan
        await set(planRef, updatedPlan);
      } else {
        throw new Error(`Financial plan with ID ${planId} not found`);
      }
    } catch (error) {
      console.error('Error updating financial plan:', error);
      throw error;
    }
  }
  // Calculate financial health score based on real data
  async calculateFinancialHealth(userId: string): Promise<any> {
    try {
      // Get data for the last year
      const endDate = Date.now();
      const startDate = endDate - (365 * 24 * 60 * 60 * 1000); // 1 year ago

      // Get financial summary
      const summary = await this.generateFinancialSummary(userId, startDate, endDate);

      // Get all transactions
      const transactions = await this.getTransactionsByUser(userId);

      // Get order data
      const orderData = await this.getOrderFinancialData(userId, startDate, endDate);

      // Get contract data
      const contractData = await this.getContractFinancialData(userId, startDate, endDate);

      // Initialize score variables
      let incomeStabilityScore = 0;
      let expenseManagementScore = 0;
      const monthlyIncome: Record<number, number> = {};

      // Group income by month
      transactions.forEach(transaction => {
        if ((transaction as Income).type === 'income') {
          const date = new Date(transaction.date);
          const monthYear = date.getMonth() + date.getFullYear() * 12;

          if (!monthlyIncome[monthYear]) {
            monthlyIncome[monthYear] = 0;
          }

          monthlyIncome[monthYear] += transaction.amount;
        }
      });

      // Add order sales to monthly income
      orderData.salesOrders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthYear = date.getMonth() + date.getFullYear() * 12;

        if (!monthlyIncome[monthYear]) {
          monthlyIncome[monthYear] = 0;
        }

        monthlyIncome[monthYear] += order.totalAmount;
      });

      // Add contract payments to monthly income
      contractData.contracts.forEach(contract => {
        if (contract.payments) {
          Object.values(contract.payments).forEach((payment: any) => {
            if (payment.date >= startDate && payment.date <= endDate) {
              const date = new Date(payment.date);
              const monthYear = date.getMonth() + date.getFullYear() * 12;

              if (!monthlyIncome[monthYear]) {
                monthlyIncome[monthYear] = 0;
              }

              // Only add payments received (not payments made)
              if (contract.creatorId === userId) {
                monthlyIncome[monthYear] += payment.amount;
              }
            }
          });
        }
      });

      // INCOME COMPONENT (Positive factor)
      // Calculate income stability based on variance
      let incomeScore = 0;
      const monthlyValues = Object.values(monthlyIncome);
      if (monthlyValues.length > 0) {
        const avgMonthlyIncome = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;

        // Base income score on total income (up to 40 points)
        // For farmers, even modest income should give some points
        if (summary.totalIncome > 0) {
          // Scale based on average monthly income (assuming ₹30,000/month is good for small farmer)
          incomeScore = Math.min(40, (avgMonthlyIncome / 30000) * 40);
        }

        // Add stability bonus (up to 20 points)
        if (avgMonthlyIncome > 0) {
          const variance = monthlyValues.reduce((sum, val) => sum + Math.pow(val - avgMonthlyIncome, 2), 0) / monthlyValues.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = stdDev / avgMonthlyIncome;

          // Lower variation = higher stability score
          const stabilityBonus = Math.max(0, 20 - (coefficientOfVariation * 50));
          incomeScore += stabilityBonus;
        }
      }
      // Store for later use
      incomeStabilityScore = Math.round(incomeScore);

      // EXPENSE COMPONENT (Negative factor)
      // Calculate expense management score - lower is better
      let expenseScore = 0;
      let expenseRatio = 1; // Default to 1 (100% expense ratio) if no data

      if (summary.totalIncome > 0) {
        expenseRatio = summary.totalExpense / summary.totalIncome;

        // Ideal expense ratio for farmers is around 60-70% of income
        // Score decreases as expenses approach or exceed income
        if (expenseRatio <= 0.6) {
          // Excellent expense management (below 60% of income)
          expenseScore = 35;
        } else if (expenseRatio <= 0.8) {
          // Good expense management (60-80% of income)
          expenseScore = 25;
        } else if (expenseRatio < 1) {
          // Fair expense management (80-100% of income)
          expenseScore = 15;
        } else {
          // Poor expense management (expenses exceed income)
          expenseScore = 0;
        }
      }
      // Store for later use
      expenseManagementScore = expenseScore;

      // DEBT COMPONENT (Negative factor)
      // Generate recommendations based on scores
      const recommendations = {
        income: [
          'Diversify your crop selection to spread harvests throughout the year',
          'Consider adding value-added products to your farm offerings',
          'Explore contract farming opportunities for guaranteed income',
        ],
        expenses: [
          'Group purchase fertilizers with neighboring farmers for bulk discounts',
          'Implement precision farming to reduce input waste',
          'Consider equipment sharing instead of purchasing new machinery',
        ],
        debt: [
          'Refinance high-interest loans through Kisan Credit Card',
          'Prioritize paying off loans with highest interest rates first',
          'Consider consolidating multiple small loans',
        ],
        savings: [
          'Aim to save 10% of each sale in a separate emergency account',
          'Explore agricultural insurance options to protect against crop failure',
          'Consider diversifying income sources beyond farming',
        ],
        planning: [
          'Create a seasonal budget that accounts for variable income',
          'Set specific financial goals with timelines',
          'Review and update your financial plan quarterly',
        ],
      };

      // In a real app, we would calculate based on actual debt data
      // For now, we'll use a placeholder value
      const hasTransactions = transactions.length > 0 ||
                             orderData.salesOrders.length > 0 ||
                             orderData.purchaseOrders.length > 0 ||
                             contractData.contracts.length > 0;

      // Assume no debt for now (best case)
      // In a real implementation, we would reduce score based on debt-to-income ratio
      const debtManagementScore = 15;

      // SAVINGS COMPONENT (Positive factor)
      let savingsScore = 0;
      let savingsRatio = 0;

      if (summary.totalIncome > 0) {
        savingsRatio = summary.netProfit / summary.totalIncome;

        // For farmers, even small savings are significant
        if (savingsRatio >= 0.2) {
          // Excellent savings (20%+ of income)
          savingsScore = 20;
        } else if (savingsRatio >= 0.1) {
          // Good savings (10-20% of income)
          savingsScore = 15;
        } else if (savingsRatio > 0) {
          // Some savings (0-10% of income)
          savingsScore = 10;
        }
      }

      // PLANNING COMPONENT (Positive factor)
      // In a real app, we would calculate based on budget adherence
      // For now, we'll use a placeholder value based on transaction consistency
      let planningScore = 0;

      // Simple heuristic: if transactions are spread across multiple months,
      // assume some level of planning
      const transactionMonths = new Set();
      transactions.forEach(t => {
        const date = new Date(t.date);
        transactionMonths.add(`${date.getMonth()}-${date.getFullYear()}`);
      });

      if (transactionMonths.size >= 3) {
        // Good planning (transactions across 3+ months)
        planningScore = 10;
      } else if (transactionMonths.size > 0) {
        // Some planning (transactions in 1-2 months)
        planningScore = 5;
      }

      // Calculate overall score using a simple addition method
      // The total possible score is 100 points:
      // - Income: up to 60 points (40 base + 20 stability)
      // - Expense Management: up to 35 points
      // - Debt Management: up to 15 points
      // - Savings: up to 20 points
      // - Financial Planning: up to 10 points

      // If there's no financial data at all, return 0
      if (summary.totalIncome === 0 && summary.totalExpense === 0 && transactions.length === 0) {
        return {
          overallScore: 0,
          categories: [
            {
              id: 'income',
              name: 'Income Stability',
              score: 0,
              description: 'No income data available to assess stability.',
              recommendations: recommendations.income,
            },
            {
              id: 'expenses',
              name: 'Expense Management',
              score: 0,
              description: 'No expense data available to assess management.',
              recommendations: recommendations.expenses,
            },
            {
              id: 'debt',
              name: 'Debt Management',
              score: 0,
              description: 'No debt data available to assess management.',
              recommendations: recommendations.debt,
            },
            {
              id: 'savings',
              name: 'Savings & Reserves',
              score: 0,
              description: 'No savings data available to assess reserves.',
              recommendations: recommendations.savings,
            },
            {
              id: 'planning',
              name: 'Financial Planning',
              score: 0,
              description: 'No planning data available to assess.',
              recommendations: recommendations.planning,
            },
          ],
          alerts: [],
          trends: {
            lastMonth: 0,
            lastQuarter: 0,
            lastYear: 0,
          },
          summary: summary
        };
      }

      // Simple addition of all scores
      // This makes the calculation more intuitive and transparent
      const overallScore = Math.min(100,
        incomeStabilityScore +
        expenseManagementScore +
        debtManagementScore +
        savingsScore +
        planningScore
      );

      // Calculate trends
      const threeMonthsAgo = endDate - (90 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = endDate - (180 * 24 * 60 * 60 * 1000);

      const lastQuarterSummary = await this.generateFinancialSummary(userId, threeMonthsAgo, endDate);
      const previousQuarterSummary = await this.generateFinancialSummary(userId, sixMonthsAgo, threeMonthsAgo);

      const lastMonthEnd = endDate;
      const lastMonthStart = endDate - (30 * 24 * 60 * 60 * 1000);
      const previousMonthEnd = lastMonthStart;
      const previousMonthStart = previousMonthEnd - (30 * 24 * 60 * 60 * 1000);

      const lastMonthSummary = await this.generateFinancialSummary(userId, lastMonthStart, lastMonthEnd);
      const previousMonthSummary = await this.generateFinancialSummary(userId, previousMonthStart, previousMonthEnd);

      // Calculate month-over-month change in net profit
      let lastMonthTrend = 0;
      if (previousMonthSummary.totalIncome > 0) {
        lastMonthTrend = Math.round(
          ((lastMonthSummary.netProfit - previousMonthSummary.netProfit) / previousMonthSummary.netProfit) * 100
        );
      }

      // Calculate quarter-over-quarter change
      let lastQuarterTrend = 0;
      if (previousQuarterSummary.totalIncome > 0) {
        lastQuarterTrend = Math.round(
          ((lastQuarterSummary.netProfit - previousQuarterSummary.netProfit) / previousQuarterSummary.netProfit) * 100
        );
      }

      // Placeholder for year-over-year trend
      const lastYearTrend = 12;

      // Generate alerts
      const alerts = [];

      // Only show alerts if there's actual financial data
      if (hasTransactions) {
        // Alert if expenses are too high
        if (summary.totalExpense > 0 && expenseRatio > 0.8) {
          alerts.push({
            id: 'high_expenses',
            type: 'warning',
            message: 'Your expenses are over 80% of your income. Look for ways to reduce costs.',
          });
        }

        // Alert if income is unstable
        if (incomeStabilityScore > 0 && incomeStabilityScore < 50) {
          alerts.push({
            id: 'income_instability',
            type: 'warning',
            message: 'Your income varies significantly. Consider diversifying income sources.',
          });
        }

        // Alert if savings are low
        if (summary.totalIncome > 0 && savingsRatio < 0.1) {
          alerts.push({
            id: 'low_savings',
            type: 'danger',
            message: 'Your emergency fund is insufficient. Aim to save at least 10% of your income.',
          });
        }
      }

      return {
        overallScore,
        categories: [
          {
            id: 'income',
            name: 'Income Stability',
            score: Math.round(incomeStabilityScore),
            description: 'This measures how consistent your income is throughout the year.',
            recommendations: recommendations.income,
          },
          {
            id: 'expenses',
            name: 'Expense Management',
            score: Math.round(expenseManagementScore),
            description: 'This measures how well you manage your expenses relative to income.',
            recommendations: recommendations.expenses,
          },
          {
            id: 'debt',
            name: 'Debt Management',
            score: debtManagementScore,
            description: 'This measures how well you manage loans and other debts.',
            recommendations: recommendations.debt,
          },
          {
            id: 'savings',
            name: 'Savings & Reserves',
            score: Math.round(savingsScore),
            description: 'This measures your ability to save and build financial reserves.',
            recommendations: recommendations.savings,
          },
          {
            id: 'planning',
            name: 'Financial Planning',
            score: planningScore,
            description: 'This measures how well you plan and budget your finances.',
            recommendations: recommendations.planning,
          },
        ],
        alerts,
        trends: {
          lastMonth: lastMonthTrend,
          lastQuarter: lastQuarterTrend,
          lastYear: lastYearTrend,
        },
        summary: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netProfit: summary.netProfit,
          incomeByCategory: summary.incomeByCategory,
          expenseByCategory: summary.expenseByCategory,
        }
      };
    } catch (error) {
      console.error('Error calculating financial health:', error);
      throw error;
    }
  }
}

export default new FinanceService();
