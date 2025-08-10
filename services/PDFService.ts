import { Share } from 'react-native';
import { formatDate, formatCurrency } from '../utils/formatUtils';

class PDFService {

  /**
   * Generate and share a financial report
   * @param title - The title of the report
   * @param subtitle - The subtitle of the report (e.g., date range)
   * @param summary - Summary data (income, expense, profit)
   * @param transactions - List of transactions
   * @param userInfo - Optional user information
   * @returns Promise resolving to the result of the share operation
   */
  async generateAndShareFinancialReport(
    title: string,
    subtitle: string,
    summary: { totalIncome: number; totalExpense: number; netProfit: number },
    transactions: Array<{
      id: string;
      date: number;
      type: string;
      description: string;
      category: string;
      amount: number;
      source?: string;
    }> | undefined,
    userInfo?: { name?: string; farmName?: string }
  ): Promise<any> {
    try {
      // Generate text report
      const textReport = this.generateTextReport(
        title,
        subtitle,
        summary,
        transactions,
        userInfo
      );

      // Share the text report
      await Share.share({
        title: title,
        message: textReport,
      });

      return { success: true };
    } catch (error) {
      console.error('Error generating or sharing report:', error);
      throw error;
    }
  }

  /**
   * Generate a text report
   * @param title - The title of the report
   * @param subtitle - The subtitle of the report (e.g., date range)
   * @param summary - Summary data (income, expense, profit)
   * @param transactions - List of transactions
   * @param userInfo - Optional user information
   * @returns Text content for the report
   */
  generateTextReport(
    title: string,
    subtitle: string,
    summary: { totalIncome: number; totalExpense: number; netProfit: number },
    transactions: Array<{
      id: string;
      date: number;
      type: string;
      description: string;
      category: string;
      amount: number;
      source?: string;
    }> | undefined,
    userInfo?: { name?: string; farmName?: string }
  ): string {
    // Ensure transactions is an array
    const safeTransactions = transactions || [];

    // Group transactions by type for better organization
    const incomeTransactions = safeTransactions.filter(t => t && t.amount > 0);
    const expenseTransactions = safeTransactions.filter(t => t && t.amount < 0);

    // Create a visually appealing header with formatting
    let report = `
╔══════════════════════════════════════╗
║       ${title}       ║
╚══════════════════════════════════════╝

${subtitle}
Generated on: ${new Date().toLocaleString()}`;

    if (userInfo?.name) {
      report += `\nUser: ${userInfo.name}`;
    }
    if (userInfo?.farmName) {
      report += `\nFarm: ${userInfo.farmName}`;
    }

    // Financial summary section with clear formatting
    report += `

╔══════════════════════════════════════╗
║           FINANCIAL SUMMARY           ║
╚══════════════════════════════════════╝

Total Income:  ${formatCurrency(summary.totalIncome)}
Total Expense: ${formatCurrency(summary.totalExpense)}
Net Profit:    ${formatCurrency(summary.netProfit)}

`;

    // Transaction details section
    report += `
╔══════════════════════════════════════╗
║          TRANSACTION DETAILS          ║
╚══════════════════════════════════════╝
`;

    // Income transactions with clear visual separation
    if (incomeTransactions.length > 0) {
      report += `
┌─────────────────────────────────────┐
│  INCOME TRANSACTIONS (${incomeTransactions.length})  │
└─────────────────────────────────────┘
`;

      incomeTransactions.forEach((transaction, index) => {
        try {
          const date = formatDate(transaction.date || Date.now());
          const type = (transaction.type || 'income').charAt(0).toUpperCase() + (transaction.type || 'income').slice(1);
          const amount = formatCurrency(transaction.amount || 0);

          report += `
${index + 1}. ${date} | ${type}
   ├─ Description: ${transaction.description || 'No description'}
   ├─ Category: ${transaction.category || 'Uncategorized'}
   ├─ Source: ${transaction.source || '-'}
   └─ Amount: ${amount}
`;
        } catch (error) {
          console.error('Error processing income transaction:', error, transaction);
          report += `
${index + 1}. Error processing transaction
`;
        }
      });
    }

    // Expense transactions with clear visual separation
    if (expenseTransactions.length > 0) {
      report += `
┌─────────────────────────────────────┐
│  EXPENSE TRANSACTIONS (${expenseTransactions.length})  │
└─────────────────────────────────────┘
`;

      expenseTransactions.forEach((transaction, index) => {
        try {
          const date = formatDate(transaction.date || Date.now());
          const type = (transaction.type || 'expense').charAt(0).toUpperCase() + (transaction.type || 'expense').slice(1);
          const amount = `-${formatCurrency(Math.abs(transaction.amount || 0))}`;

          report += `
${index + 1}. ${date} | ${type}
   ├─ Description: ${transaction.description || 'No description'}
   ├─ Category: ${transaction.category || 'Uncategorized'}
   ├─ Vendor: ${transaction.source || '-'}
   └─ Amount: ${amount}
`;
        } catch (error) {
          console.error('Error processing expense transaction:', error, transaction);
          report += `
${index + 1}. Error processing transaction
`;
        }
      });
    }

    // Additional information section
    report += `
╔══════════════════════════════════════╗
║        ADDITIONAL INFORMATION        ║
╚══════════════════════════════════════╝

• This report includes all transactions from your orders (sales, purchases, rentals) and additional income/expenses.
• For a more detailed analysis, please visit the Financial Health screen in the app.

──────────────────────────────────────
Generated by FarmConnect Financial Management System
For questions or support, please contact our support team.
`;

    return report;
  }

  // No PDF generation methods - using text-based reports only
}

export default new PDFService();
