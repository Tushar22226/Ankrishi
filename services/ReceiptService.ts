import { Share, Alert } from 'react-native';
import { Order, OrderStatus } from '../models/Product';
import RNPrint from 'react-native-print';
import { storage } from '../firebase/config';

// Format date for receipt
const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format currency for receipt
const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) {
    return '₹0';
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

class ReceiptService {
  // Generate professional receipt HTML content for PDF
  generateReceiptHTML(order: Order): string {
    const receiptDate = new Date().toLocaleDateString('en-IN');
    const receiptTime = new Date().toLocaleTimeString('en-IN');

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);
    const deliveryCharges = 200; // Fixed delivery charges of ₹200
    const calculatedTotal = subtotal + deliveryCharges;

    // Get order items with proper formatting
    const itemsHTML = order.items.map((item, index) => `
      <tr class="item-row">
        <td class="item-number">${index + 1}</td>
        <td class="item-details">
          <div class="item-name">${item.productName || 'Product'}</div>
          ${item.isRental ? `<div class="item-rental">Rental Period: ${item.rentalPeriod || 'N/A'}</div>` : ''}
        </td>
        <td class="item-quantity">${item.quantity}</td>
        <td class="item-price">${formatCurrency(item.price)}</td>
        <td class="item-total">${formatCurrency(item.totalPrice || item.price * item.quantity)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FarmConnect Receipt - Order #${order.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background-color: #f8f9fa;
            padding: 20px;
          }

          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          /* Header Section */
          .receipt-header {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }

          .receipt-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
          }

          .company-logo {
            font-size: 48px;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }

          .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }

          .company-tagline {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }

          .receipt-title {
            font-size: 24px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            border-radius: 25px;
            display: inline-block;
            position: relative;
            z-index: 1;
          }

          /* Receipt Info Bar */
          .receipt-info-bar {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 3px solid #4CAF50;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
          }

          .receipt-number {
            font-size: 18px;
            font-weight: bold;
            color: #2E7D32;
          }

          .receipt-date {
            font-size: 14px;
            color: #666;
          }

          .receipt-status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            color: white;
            background-color: ${this.getStatusColor(order.status)};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* Content Section */
          .receipt-content {
            padding: 30px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }

          .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
          }

          .info-section h3 {
            color: #2E7D32;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: flex-start;
          }

          .info-label {
            font-weight: 600;
            color: #555;
            min-width: 100px;
            margin-right: 10px;
          }

          .info-value {
            color: #333;
            flex: 1;
          }

          /* Items Table */
          .items-section {
            margin: 30px 0;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #2E7D32;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #4CAF50;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .items-table th {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .items-table th:first-child { width: 8%; text-align: center; }
          .items-table th:nth-child(2) { width: 45%; }
          .items-table th:nth-child(3) { width: 12%; text-align: center; }
          .items-table th:nth-child(4) { width: 17.5%; text-align: right; }
          .items-table th:nth-child(5) { width: 17.5%; text-align: right; }

          .item-row {
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s;
          }

          .item-row:hover {
            background-color: #f8f9fa;
          }

          .item-row:last-child {
            border-bottom: none;
          }

          .items-table td {
            padding: 15px 12px;
            vertical-align: top;
          }

          .item-number {
            text-align: center;
            font-weight: bold;
            color: #666;
            background: #f8f9fa;
          }

          .item-details {
            padding-left: 15px;
          }

          .item-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
          }

          .item-rental {
            font-size: 12px;
            color: #666;
            font-style: italic;
          }

          .item-quantity {
            text-align: center;
            font-weight: 600;
            color: #333;
          }

          .item-price, .item-total {
            text-align: right;
            font-weight: 600;
            color: #333;
          }

          /* Totals Section */
          .totals-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 8px;
            margin-top: 20px;
            border: 2px solid #e9ecef;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }

          .totals-row:last-child {
            border-bottom: none;
            padding-top: 15px;
            margin-top: 10px;
            border-top: 2px solid #4CAF50;
          }

          .totals-label {
            font-weight: 600;
            color: #555;
          }

          .totals-value {
            font-weight: bold;
            color: #333;
          }

          .total-amount {
            font-size: 24px;
            color: #2E7D32;
            font-weight: bold;
          }

          /* Footer */
          .receipt-footer {
            background: #2E7D32;
            color: white;
            padding: 25px 30px;
            text-align: center;
          }

          .footer-message {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
          }

          .footer-contact {
            font-size: 14px;
            margin-bottom: 10px;
            opacity: 0.9;
          }

          .footer-copyright {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }

          /* Print Styles */
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .receipt-container {
              box-shadow: none;
              border-radius: 0;
            }
            .item-row:hover {
              background-color: transparent;
            }
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            body { padding: 10px; }
            .receipt-content { padding: 20px; }
            .info-grid {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            .receipt-info-bar {
              flex-direction: column;
              text-align: center;
            }
            .items-table th, .items-table td {
              padding: 10px 8px;
              font-size: 12px;
            }
            .company-name { font-size: 24px; }
            .receipt-title { font-size: 18px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="receipt-header">
            <div class="company-logo">🌱</div>
            <div class="company-name">FarmConnect</div>
            <div class="company-tagline">Connecting Farmers Directly to Consumers</div>
            <div class="receipt-title">PURCHASE RECEIPT</div>
          </div>

          <!-- Receipt Info Bar -->
          <div class="receipt-info-bar">
            <div class="receipt-number">Receipt #${order.id.substring(0, 8).toUpperCase()}</div>
            <div class="receipt-date">
              <div>Date: ${receiptDate}</div>
              <div>Time: ${receiptTime}</div>
            </div>
            <div class="receipt-status">${this.getFormattedStatus(order.status)}</div>
          </div>

          <!-- Content -->
          <div class="receipt-content">
            <!-- Customer & Order Info -->
            <div class="info-grid">
              <div class="info-section">
                <h3>👤 Customer Information</h3>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${order.shippingAddress?.name || 'Not specified'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${order.shippingAddress?.phone || 'Not specified'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span class="info-value">
                    ${order.shippingAddress?.address || ''}<br>
                    ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}
                  </span>
                </div>
              </div>

              <div class="info-section">
                <h3>📋 Order Information</h3>
                <div class="info-row">
                  <span class="info-label">Order ID:</span>
                  <span class="info-value">${order.id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">${formatDate(order.createdAt)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment:</span>
                  <span class="info-value">${this.getFormattedPaymentMethod(order.paymentMethod)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value">${this.getFormattedStatus(order.status)}</span>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <h2 class="section-title">🛒 Order Items</h2>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Details</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>

            <!-- Totals Section -->
            <div class="totals-section">
              <div class="totals-row">
                <span class="totals-label">Subtotal:</span>
                <span class="totals-value">${formatCurrency(subtotal)}</span>
              </div>
              <div class="totals-row">
                <span class="totals-label">Delivery Charges:</span>
                <span class="totals-value">${formatCurrency(deliveryCharges)}</span>
              </div>
              <div class="totals-row">
                <span class="totals-label total-amount">TOTAL AMOUNT:</span>
                <span class="totals-value total-amount">${formatCurrency(calculatedTotal)}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="receipt-footer">
            <div class="footer-message">Thank you for choosing FarmConnect! 🙏</div>
            <div class="footer-contact">
              📧 tusharshah4992@gmail.com | 📞 +91-8140631419
            </div>
            <div class="footer-contact">
              🌐 https://ankrishi.netlify.app | Follow us on social media
            </div>
            <div class="footer-copyright">
              © ${new Date().getFullYear()} FarmConnect. All rights reserved. | Supporting farmers, serving consumers.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get status color for receipt
  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return '#FFA500'; // Orange
      case 'confirmed':
        return '#3498DB'; // Blue
      case 'processing':
        return '#3498DB'; // Blue
      case 'out_for_delivery':
        return '#9B59B6'; // Purple
      case 'delivered':
        return '#2ECC71'; // Green
      case 'cancelled':
        return '#E74C3C'; // Red
      case 'returned':
        return '#E74C3C'; // Red
      default:
        return '#95A5A6'; // Gray
    }
  }

  // Get formatted status text
  getFormattedStatus(status: OrderStatus): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get formatted payment method text
  getFormattedPaymentMethod(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'upi':
        return 'UPI Payment';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'wallet':
        return 'Digital Wallet';
      default:
        return paymentMethod || 'Not specified';
    }
  }

  // Upload HTML content as PDF to Firebase Storage
  async uploadHTMLAsPDFToStorage(htmlContent: string, fileName: string, orderId: string): Promise<string> {
    try {
      // Create a reference to Firebase Storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storageRef = storage().ref(`receipts/${orderId}/${timestamp}_${fileName}.html`);

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
          'receiptType': 'order_receipt',
          'orderId': orderId
        }
      });

      // Get the download URL
      const downloadURL = await storageRef.getDownloadURL();

      console.log('Receipt uploaded to Firebase Storage:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading receipt to Firebase Storage:', error);
      throw new Error('Failed to upload receipt to cloud storage');
    }
  }

  // Generate and share receipt PDF
  async shareReceipt(order: Order): Promise<void> {
    try {
      console.log('Generating professional receipt PDF for sharing...');

      // Generate HTML content for the receipt
      const htmlContent = this.generateReceiptHTML(order);

      let shareMessage = `FarmConnect Receipt - Order #${order.id}\n\nGenerated by FarmConnect Order Management System`;
      let downloadURL = '';

      // Try to upload HTML to Firebase Storage
      try {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `FarmConnect_Receipt_${order.id}_${timestamp}`;
        downloadURL = await this.uploadHTMLAsPDFToStorage(htmlContent, fileName, order.id);
        shareMessage += `\n\n📄 View Receipt Online: ${downloadURL}\n\n🔗 This link will open the receipt in your browser where you can view, print, or save as PDF.`;
      } catch (uploadError) {
        console.warn('Failed to upload to Firebase Storage, falling back to print sharing:', uploadError);
      }

      // Use react-native-print to generate and share PDF
      const printOptions = {
        html: htmlContent,
        jobName: `FarmConnect_Receipt_${order.id}_${new Date().toISOString().split('T')[0]}`,
      };

      try {
        // Print or share the PDF
        await RNPrint.print(printOptions);

        console.log('Receipt PDF generated and shared successfully');
      } catch (printError) {
        console.warn('Print failed, falling back to share:', printError);

        // Fallback: Share the HTML content or download URL
        if (downloadURL) {
          await Share.share({
            title: `FarmConnect Receipt - Order #${order.id}`,
            message: shareMessage,
            url: downloadURL,
          });
        } else {
          // Last resort: share as text
          await this.shareReceiptAsText(order);
        }
      }
    } catch (error) {
      console.error('Error generating or sharing receipt:', error);

      // Fallback to text receipt if PDF generation fails
      Alert.alert(
        'PDF Generation Failed',
        'Unable to generate PDF receipt. Would you like to share a text receipt instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Text Receipt',
            onPress: () => this.shareReceiptAsText(order)
          }
        ]
      );

      throw error;
    }
  }

  // Fallback method to share receipt as text
  async shareReceiptAsText(order: Order): Promise<void> {
    try {
      console.log('Generating text receipt for sharing...');

      // Generate text receipt
      const textReceipt = `
🌱 FarmConnect Receipt
=====================

📋 Order Details:
Order ID: ${order.id}
Date: ${formatDate(order.createdAt)}
Status: ${this.getFormattedStatus(order.status)}
Payment: ${this.getFormattedPaymentMethod(order.paymentMethod)}

👤 Customer Information:
Name: ${order.shippingAddress?.name || 'Not specified'}
Phone: ${order.shippingAddress?.phone || 'Not specified'}
Address: ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}

🛒 Items Ordered:
${order.items.map((item, index) => `${index + 1}. ${item.productName || 'Product'} x ${item.quantity} = ${formatCurrency(item.totalPrice || item.price * item.quantity)}`).join('\n')}

💰 Payment Summary:
Subtotal: ${formatCurrency(order.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0))}
Delivery Charges: ${formatCurrency(200)}
TOTAL: ${formatCurrency(order.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0) + 200)}

Thank you for choosing FarmConnect! 🙏
Connecting farmers directly to consumers.
      `;

      // Share the text receipt
      await Share.share({
        title: `FarmConnect Receipt - Order #${order.id}`,
        message: textReceipt,
      });
    } catch (error) {
      console.error('Error sharing text receipt:', error);
      throw error;
    }
  }
}

export default new ReceiptService();
