import { Share, Platform, Alert } from 'react-native';
import { formatDate, formatCurrency } from '../utils/formatUtils';
import RNPrint from 'react-native-print';
import { storage } from '../firebase/config';

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

  /**
   * Generate HTML content for PDF
   * @param title - The title of the report
   * @param subtitle - The subtitle of the report (e.g., date range)
   * @param summary - Summary data (income, expense, profit)
   * @param transactions - List of transactions
   * @param userInfo - Optional user information
   * @returns HTML content for PDF generation
   */
  generateHTMLForPDF(
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
    userInfo?: { name?: string; farmName?: string; phoneNumber?: string; location?: string }
  ): string {
    const safeTransactions = transactions || [];
    const reportDate = new Date().toLocaleDateString();
    const reportTime = new Date().toLocaleTimeString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FarmConnect Financial Report</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4CAF50;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 5px;
          }
          .logo-tagline {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #2E7D32;
          }
          .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 15px;
          }
          .report-info {
            font-size: 12px;
            color: #888;
            margin-top: 15px;
          }

          /* Farmer Details Section */
          .farmer-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #4CAF50;
          }
          .farmer-details h3 {
            margin: 0 0 15px 0;
            color: #2E7D32;
            font-size: 18px;
          }
          .farmer-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .farmer-info-item {
            display: flex;
            align-items: center;
          }
          .farmer-info-label {
            font-weight: bold;
            color: #555;
            margin-right: 8px;
            min-width: 80px;
          }
          .farmer-info-value {
            color: #333;
          }

          /* Summary Section */
          .summary-container {
            margin-bottom: 30px;
          }
          .summary-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2E7D32;
            text-align: center;
          }
          .summary {
            display: flex;
            justify-content: space-around;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 12px;
            border: 2px solid #e9ecef;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .summary-item {
            text-align: center;
            flex: 1;
            padding: 0 15px;
          }
          .summary-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .income { color: #28a745; }
          .expense { color: #dc3545; }
          .profit { color: #28a745; }
          .loss { color: #dc3545; }

          /* Table Section */
          .table-container {
            margin-top: 30px;
            margin-bottom: 30px;
          }
          .table-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2E7D32;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #e8f5e8;
          }
          .transaction-type {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            min-width: 60px;
            text-align: center;
            font-size: 11px;
          }
          .type-income { background-color: rgba(40, 167, 69, 0.15); color: #28a745; }
          .type-expense { background-color: rgba(220, 53, 69, 0.15); color: #dc3545; }
          .type-sale { background-color: rgba(0, 123, 255, 0.15); color: #007bff; }
          .type-purchase { background-color: rgba(255, 193, 7, 0.15); color: #e68900; }
          .type-rental { background-color: rgba(111, 66, 193, 0.15); color: #6f42c1; }
          .amount-cell {
            font-weight: bold;
            text-align: right;
          }
          .amount-positive { color: #28a745; }
          .amount-negative { color: #dc3545; }

          /* Footer */
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .footer-logo {
            font-weight: bold;
            color: #4CAF50;
            font-size: 14px;
          }
          .page-info {
            text-align: right;
            font-size: 10px;
            color: #999;
            margin-top: 20px;
          }

          /* Print Styles */
          @media print {
            body { padding: 10px; font-size: 12px; }
            .summary-value { font-size: 18px; }
            table { font-size: 10px; }
            th { font-size: 11px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FarmConnect</div>
          <div class="logo-tagline">Smart Agricultural Financial Management</div>
          <div class="title">${title}</div>
          <div class="subtitle">${subtitle}</div>
          <div class="report-info">
            Generated on: ${reportDate} at ${reportTime}
          </div>
        </div>

        ${userInfo ? `
        <div class="farmer-details">
          <h3>Farmer Details</h3>
          <div class="farmer-info">
            ${userInfo.name ? `
            <div class="farmer-info-item">
              <span class="farmer-info-label">Name:</span>
              <span class="farmer-info-value">${userInfo.name}</span>
            </div>
            ` : ''}
            ${userInfo.farmName ? `
            <div class="farmer-info-item">
              <span class="farmer-info-label">Farm:</span>
              <span class="farmer-info-value">${userInfo.farmName}</span>
            </div>
            ` : ''}
            ${userInfo.phoneNumber ? `
            <div class="farmer-info-item">
              <span class="farmer-info-label">Phone:</span>
              <span class="farmer-info-value">${userInfo.phoneNumber}</span>
            </div>
            ` : ''}
            ${userInfo.location ? `
            <div class="farmer-info-item">
              <span class="farmer-info-label">Location:</span>
              <span class="farmer-info-value">${userInfo.location}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <div class="summary-container">
          <div class="summary-title">Financial Summary</div>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Income</div>
              <div class="summary-value income">Rs.${summary.totalIncome.toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Expense</div>
              <div class="summary-value expense">Rs.${summary.totalExpense.toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Net Profit</div>
              <div class="summary-value ${summary.netProfit >= 0 ? 'profit' : 'loss'}">
                Rs.${summary.netProfit.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <div class="table-container">
          <div class="table-title">Transaction Details (${safeTransactions.length} transactions)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Date</th>
                <th style="width: 15%;">Type</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 18%;">Category</th>
                <th style="width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${safeTransactions.map(transaction => {
                let typeClass = '';
                let typeDisplay = '';
                switch(transaction.type) {
                  case 'income':
                    typeClass = 'type-income';
                    typeDisplay = 'Income';
                    break;
                  case 'expense':
                    typeClass = 'type-expense';
                    typeDisplay = 'Expense';
                    break;
                  case 'sale':
                    typeClass = 'type-sale';
                    typeDisplay = 'Sale';
                    break;
                  case 'purchase':
                    typeClass = 'type-purchase';
                    typeDisplay = 'Purchase';
                    break;
                  case 'rental':
                    typeClass = 'type-rental';
                    typeDisplay = 'Rental';
                    break;
                  case 'contract_payment_received':
                    typeClass = 'type-income';
                    typeDisplay = 'Contract';
                    break;
                  case 'contract_payment_made':
                    typeClass = 'type-expense';
                    typeDisplay = 'Contract';
                    break;
                  default:
                    typeClass = 'type-income';
                    typeDisplay = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
                }

                return `
                <tr>
                  <td>${new Date(transaction.date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span class="transaction-type ${typeClass}">
                      ${typeDisplay}
                    </span>
                  </td>
                  <td>
                    <strong>${transaction.description}</strong>
                    ${transaction.source ? `<br><small style="color: #666;">Source: ${transaction.source}</small>` : ''}
                  </td>
                  <td>${transaction.category}</td>
                  <td class="amount-cell ${transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                    ${transaction.amount >= 0
                      ? 'Rs.' + transaction.amount.toLocaleString('en-IN')
                      : '-Rs.' + Math.abs(transaction.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This report was generated by <span class="footer-logo">FarmConnect</span> Financial Management System</p>
          <p>For questions or support, please contact our support team.</p>
          <p style="margin-top: 15px; font-size: 11px; color: #888;">
            This report includes all transactions from orders (sales, purchases, rentals) and additional income/expenses.<br>
            This document is confidential and intended for the named recipient only.
          </p>
        </div>

        <div class="page-info">
          Generated by FarmConnect v1.0 | Page 1 of 1
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Upload HTML content as PDF to Firebase Storage
   * @param htmlContent - HTML content to convert to PDF
   * @param fileName - Name for the file in storage
   * @param userId - User ID for organizing files
   * @returns Promise resolving to the download URL
   */
  async uploadHTMLAsPDFToStorage(htmlContent: string, fileName: string, userId: string): Promise<string> {
    try {
      // Create a reference to Firebase Storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storageRef = storage().ref(`reports/${userId}/${timestamp}_${fileName}.html`);

      // Clean the HTML content to ensure it's ASCII compatible
      const cleanHtmlContent = htmlContent
        .replace(/[^\x00-\x7F]/g, '') // Remove any remaining non-ASCII characters
        .replace(/'/g, "'") // Replace smart quotes
        .replace(/"/g, '"'); // Replace smart quotes

      // Upload the HTML content using UTF-8 encoding
      await storageRef.putString(cleanHtmlContent, 'raw', {
        contentType: 'text/html; charset=utf-8',
        customMetadata: {
          'uploadedAt': new Date().toISOString(),
          'generatedBy': 'FarmConnect',
          'reportType': 'financial'
        }
      });

      // Get the download URL
      const downloadURL = await storageRef.getDownloadURL();

      console.log('HTML report uploaded to Firebase Storage:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading HTML to Firebase Storage:', error);
      throw new Error('Failed to upload report to cloud storage');
    }
  }

  /**
   * Generate PDF using react-native-print and share it
   * @param title - The title of the report
   * @param subtitle - The subtitle of the report (e.g., date range)
   * @param summary - Summary data (income, expense, profit)
   * @param transactions - List of transactions
   * @param userInfo - Optional user information
   * @param userId - User ID for organizing files in storage
   * @returns Promise resolving to the result of the share operation
   */
  async generateAndSharePDF(
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
    userInfo?: { name?: string; farmName?: string; phoneNumber?: string; location?: string },
    userId?: string
  ): Promise<any> {
    try {
      // Generate HTML content
      const htmlContent = this.generateHTMLForPDF(title, subtitle, summary, transactions, userInfo);

      let shareMessage = `${title}\n\n${subtitle}\n\nGenerated by FarmConnect Financial Management System`;
      let downloadURL = '';

      // Try to upload HTML to Firebase Storage if userId is provided
      if (userId) {
        try {
          const timestamp = new Date().toISOString().split('T')[0];
          const fileName = `FarmConnect_Financial_Report_${timestamp}`;
          downloadURL = await this.uploadHTMLAsPDFToStorage(htmlContent, fileName, userId);
          shareMessage += `\n\n📄 View Report Online: ${downloadURL}\n\n🔗 This link will open the report in your browser where you can view, print, or save as PDF.`;
        } catch (uploadError) {
          console.warn('Failed to upload to Firebase Storage, falling back to print sharing:', uploadError);
        }
      }

      // Use react-native-print to generate and share PDF
      const printOptions = {
        html: htmlContent,
        jobName: `FarmConnect_Financial_Report_${new Date().toISOString().split('T')[0]}`,
      };

      try {
        // Print or share the PDF
        await RNPrint.print(printOptions);

        return {
          success: true,
          downloadURL: downloadURL || undefined,
          isCloudStored: !!downloadURL,
          method: 'print'
        };
      } catch (printError) {
        console.warn('Print failed, falling back to share:', printError);

        // Fallback: Share the HTML content or download URL
        if (downloadURL) {
          await Share.share({
            title: title,
            message: shareMessage,
            url: downloadURL,
          });
        } else {
          // Last resort: share as text
          await this.generateAndShareFinancialReport(title, subtitle, summary, transactions, userInfo);
        }

        return {
          success: true,
          downloadURL: downloadURL || undefined,
          isCloudStored: !!downloadURL,
          method: 'share'
        };
      }
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);

      // Fallback to text report if PDF generation fails
      Alert.alert(
        'PDF Generation Failed',
        'Unable to generate PDF. Would you like to share a text report instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Text Report',
            onPress: () => this.generateAndShareFinancialReport(title, subtitle, summary, transactions, userInfo)
          }
        ]
      );

      throw error;
    }
  }
}

export default new PDFService();
