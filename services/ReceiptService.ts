import { Share } from 'react-native';
import { Order } from '../models/Product';

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
  // Generate HTML content for the receipt
  generateReceiptHTML(order: Order): string {
    // Get order items
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName || item.productId}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    // Generate the HTML content
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FarmConnect Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .receipt-header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .receipt-title {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .receipt-subtitle {
            margin: 5px 0 0;
            font-size: 14px;
          }
          .receipt-info {
            padding: 20px;
            border-bottom: 1px solid #ddd;
          }
          .receipt-section {
            margin-bottom: 20px;
          }
          .receipt-section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4CAF50;
            border-bottom: 1px solid #4CAF50;
            padding-bottom: 5px;
          }
          .receipt-row {
            display: flex;
            margin-bottom: 5px;
          }
          .receipt-label {
            font-weight: bold;
            width: 150px;
          }
          .receipt-value {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f2f2f2;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
          }
          .receipt-total {
            background-color: #f9f9f9;
            padding: 15px 20px;
            text-align: right;
            font-weight: bold;
            border-top: 2px solid #ddd;
          }
          .receipt-footer {
            background-color: #f2f2f2;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .receipt-logo {
            text-align: center;
            margin-bottom: 10px;
          }
          .green-text {
            color: #4CAF50;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background-color: #4CAF50;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <div class="receipt-logo">
              <!-- Logo placeholder -->
              <span style="font-size: 40px; font-weight: bold;">🌱</span>
            </div>
            <h1 class="receipt-title">FarmConnect</h1>
            <p class="receipt-subtitle">Direct from Farmers to Consumers</p>
          </div>

          <div class="receipt-info">
            <div class="receipt-section">
              <div class="receipt-section-title">Order Information</div>
              <div class="receipt-row">
                <div class="receipt-label">Order ID:</div>
                <div class="receipt-value">${order.id}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Order Date:</div>
                <div class="receipt-value">${formatDate(order.createdAt)}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Status:</div>
                <div class="receipt-value">
                  <span class="status-badge" style="background-color: ${this.getStatusColor(order.status)}">
                    ${this.getFormattedStatus(order.status)}
                  </span>
                </div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Payment Method:</div>
                <div class="receipt-value">${order.paymentMethod || 'Not specified'}</div>
              </div>
            </div>

            <div class="receipt-section">
              <div class="receipt-section-title">Customer Information</div>
              <div class="receipt-row">
                <div class="receipt-label">Name:</div>
                <div class="receipt-value">${order.shippingAddress?.name || 'Not specified'}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Phone:</div>
                <div class="receipt-value">${order.shippingAddress?.phone || 'Not specified'}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Address:</div>
                <div class="receipt-value">
                  ${order.shippingAddress?.address || ''},
                  ${order.shippingAddress?.city || ''},
                  ${order.shippingAddress?.state || ''} -
                  ${order.shippingAddress?.pincode || ''}
                </div>
              </div>
            </div>

            <div class="receipt-section">
              <div class="receipt-section-title">Order Details</div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left;">Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>
          </div>

          <div class="receipt-total">
            <div style="margin-bottom: 5px;">Subtotal: ${formatCurrency(order.subtotal)}</div>
            <div style="margin-bottom: 5px;">Shipping Fee: ${formatCurrency(order.shippingFee)}</div>
            <div style="font-size: 18px; color: #4CAF50;">Total Amount: ${formatCurrency(order.total)}</div>
          </div>

          <div class="receipt-footer">
            <p>Thank you for shopping with FarmConnect!</p>
            <p>For any queries, please contact our support at support@farmconnect.com</p>
            <p>© ${new Date().getFullYear()} FarmConnect. All rights reserved.</p>
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

  // Share receipt directly
  async shareReceipt(order: Order): Promise<void> {
    try {
      console.log('Generating text receipt for sharing...');

      // Generate text receipt
      const textReceipt = `
FarmConnect Receipt
==================

Order ID: ${order.id}
Date: ${formatDate(order.createdAt)}
Status: ${this.getFormattedStatus(order.status)}

Customer: ${order.shippingAddress?.name || 'Not specified'}
Address: ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}

Items:
${order.items.map(item => `- ${item.name || item.productName || item.productId || 'Product'} x ${item.quantity} = ${formatCurrency(item.total)}`).join('\n')}

Total Amount: ${formatCurrency(order.total)}

Thank you for shopping with FarmConnect!
      `;

      // Share the text receipt
      await Share.share({
        title: `FarmConnect Order Receipt #${order.id}`,
        message: textReceipt,
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      throw error;
    }
  }
}

export default new ReceiptService();
