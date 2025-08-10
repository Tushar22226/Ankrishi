import { Contract } from '../models/Contract';
import { formatDate, formatCurrency } from '../utils/formatUtils';
import storage from '@react-native-firebase/storage';
import ContractService from './ContractService';

class ContractPDFService {

  /**
   * Generate a contract PDF and save to Firebase Storage
   * @param contract Contract data
   * @returns Promise resolving to the download URL
   */
  async generateContractPDF(contract: Contract): Promise<string> {
    try {
      console.log('Generating contract PDF...');

      // Check if the contract already has a PDF URL stored
      if (contract.pdfUrl) {
        console.log('Contract already has a PDF URL:', contract.pdfUrl);
        return contract.pdfUrl;
      }

      // Create HTML content for the PDF
      const htmlContent = this.generateContractHTML(contract);

      // Generate a unique filename for the PDF
      const filename = `contract_${contract.id}_${Date.now()}.html`;

      // Get the user ID from the contract creator
      const userId = contract.creatorId;

      // Create a reference to the storage location
      const storageRef = storage().ref(`${userId}/contracts/${filename}`);

      // Convert HTML to a blob and upload directly
      console.log('Uploading HTML content to Firebase Storage...');

      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });

      // Upload the blob to Firebase Storage
      await storageRef.put(blob);
      console.log('File uploaded successfully');

      // Get the download URL
      const downloadUrl = await storageRef.getDownloadURL();
      console.log('Download URL:', downloadUrl);

      // Update the contract with the PDF URL
      await ContractService.updateContract(contract.id, { pdfUrl: downloadUrl });
      console.log('Contract updated with PDF URL');

      return downloadUrl;
    } catch (error) {
      console.error('Error in contract PDF generation process:', error);
      throw error;
    }
  }

  /**
   * Generate an HTML representation of the contract
   * @param contract Contract data
   * @returns HTML representation of the contract
   */
  generateContractHTML(contract: Contract): string {
    // Format dates
    const startDate = formatDate(contract.startDate);
    const endDate = formatDate(contract.endDate);
    const createdDate = formatDate(contract.createdAt);

    // Format contract terms as text
    const termsText = contract.terms.map((term, index) => `${index + 1}. ${term}`).join('\n');

    // Format quality standards as text if they exist
    const qualityStandardsText = contract.qualityStandards
      ? contract.qualityStandards.map((standard, index) => `- ${standard}`).join('\n')
      : '';

    // Format contract ID with leading zeros for formal appearance
    const formattedContractId = `AK-${contract.id.padStart(8, '0')}`;

    // Get current date in Indian format for the stamp
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate the HTML content
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contract Agreement</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 20px;
      color: #000;
      line-height: 1.5;
      background-color: #fff;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #000;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      background-color: #fff;
    }
    .header {
      border-bottom: 3px double #000;
      padding: 20px;
      text-align: center;
    }
    .title {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .subtitle {
      margin: 10px 0 0;
      font-size: 16px;
      font-style: italic;
    }
    .content {
      padding: 20px;
    }
    .section {
      margin-bottom: 25px;
      border-bottom: 1px solid #000;
      padding-bottom: 20px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 15px;
      text-align: center;
    }
    .info-row {
      display: flex;
      margin-bottom: 12px;
    }
    .info-label {
      font-weight: bold;
      width: 180px;
    }
    .info-value {
      flex: 1;
    }
    .terms-list {
      margin: 0;
      padding-left: 20px;
    }
    .term-item {
      margin-bottom: 8px;
      text-align: justify;
    }
    .signature-area {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      border-top: 1px solid #000;
      width: 45%;
      padding-top: 10px;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      border-top: 1px solid #000;
    }
    .stamp {
      position: relative;
      display: inline-block;
      color: #8B0000;
      padding: 15px;
      border: 3px double #8B0000;
      border-radius: 5px;
      font-weight: bold;
      transform: rotate(-15deg);
      margin: 30px 0;
      font-size: 18px;
    }
    .contract-number {
      text-align: right;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .contract-date {
      text-align: right;
      margin-bottom: 20px;
    }
    .witness-section {
      margin-top: 40px;
    }
    .witness-title {
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
    }
    .witness-signatures {
      display: flex;
      justify-content: space-between;
    }
    .witness-box {
      width: 45%;
      border-top: 1px dotted #000;
      padding-top: 5px;
      text-align: center;
    }
    .legal-notice {
      font-size: 11px;
      text-align: justify;
      margin-top: 30px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">CONTRACT AGREEMENT</h1>
      <p class="subtitle">ankrishi - Connecting Farmers to Prosperity</p>
    </div>

    <div class="content">
      <div class="contract-number">Contract No: ${formattedContractId}</div>
      <div class="contract-date">Date: ${currentDate}</div>

      <div class="section">
        <h2 class="section-title">${contract.title}</h2>
        <p style="text-align: center;"><strong>${contract.type.charAt(0).toUpperCase() + contract.type.slice(1)} Contract</strong></p>
        <p style="text-align: justify;">
          This agreement is made and entered into on this ${new Date(contract.createdAt).getDate()} day of
          ${new Date(contract.createdAt).toLocaleDateString('en-IN', {month: 'long'})} ${new Date(contract.createdAt).getFullYear()},
          by and between the parties identified below.
        </p>
      </div>

      <div class="section">
        <h2 class="section-title">CONTRACT DETAILS</h2>
        <div class="info-row">
          <div class="info-label">Contract Type:</div>
          <div class="info-value">${contract.type.charAt(0).toUpperCase() + contract.type.slice(1)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Contract Period:</div>
          <div class="info-value">${startDate} to ${endDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Contract Value:</div>
          <div class="info-value">${formatCurrency(contract.value)}</div>
        </div>`;

    if (contract.quantity && contract.unit) {
      html += `
        <div class="info-row">
          <div class="info-label">Quantity:</div>
          <div class="info-value">${contract.quantity} ${contract.unit}</div>
        </div>`;
    }

    if (contract.pricePerUnit && contract.unit) {
      html += `
        <div class="info-row">
          <div class="info-label">Price Per Unit:</div>
          <div class="info-value">${formatCurrency(contract.pricePerUnit)} per ${contract.unit}</div>
        </div>`;
    }

    if (contract.paymentTerms) {
      html += `
        <div class="info-row">
          <div class="info-label">Payment Terms:</div>
          <div class="info-value">${contract.paymentTerms}</div>
        </div>`;
    }

    if (contract.deliveryTerms) {
      html += `
        <div class="info-row">
          <div class="info-label">Delivery Terms:</div>
          <div class="info-value">${contract.deliveryTerms}</div>
        </div>`;
    }

    html += `
      </div>`; // Close contract details section

    html += `
      <div class="section">
        <h2 class="section-title">PARTIES</h2>
        <div class="info-row">
          <div class="info-label">First Party:</div>
          <div class="info-value">${contract.parties.firstPartyUsername} (${contract.creatorRole})</div>
        </div>
        <div class="info-row">
          <div class="info-label">Second Party:</div>
          <div class="info-value">${contract.parties.secondPartyUsername || 'Not Assigned'}</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">CONTRACT DESCRIPTION</h2>
        <p>${contract.description}</p>
      </div>

      <div class="section">
        <h2 class="section-title">TERMS AND CONDITIONS</h2>
        <ol class="terms-list">
          ${contract.terms.map(term => `<li class="term-item">${term}</li>`).join('')}
        </ol>
      </div>`;

    if (contract.qualityStandards && contract.qualityStandards.length > 0) {
      html += `
      <div class="section">
        <h2 class="section-title">QUALITY STANDARDS</h2>
        <ul>
          ${contract.qualityStandards.map(standard => `<li>${standard}</li>`).join('')}
        </ul>
      </div>`;
    }

    html += `
      <div class="section">
        <h2 class="section-title">SIGNATURES</h2>
        <div class="signature-area">
          <div class="signature-box">
            ${contract.parties.firstPartyUsername}<br>
            (First Party)<br>
            ${contract.creatorRole.charAt(0).toUpperCase() + contract.creatorRole.slice(1)}
          </div>
          <div class="signature-box">
            ${contract.parties.secondPartyUsername || '___________________'}<br>
            (Second Party)<br>
            ${contract.parties.secondPartyRole ? (contract.parties.secondPartyRole.charAt(0).toUpperCase() + contract.parties.secondPartyRole.slice(1)) : '___________________'}
          </div>
        </div>

        <div class="witness-section">
          <div class="witness-title">IN THE PRESENCE OF WITNESSES:</div>
          <div class="witness-signatures">
            <div class="witness-box">
              Witness 1<br>
              Name: ___________________<br>
              Address: ___________________
            </div>
            <div class="witness-box">
              Witness 2<br>
              Name: ___________________<br>
              Address: ___________________
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <div class="stamp">LEGALLY BINDING DOCUMENT</div>
        </div>

        <div class="legal-notice">
          This contract is governed by the laws of India. Any disputes arising out of or in connection with this contract shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996. The place of arbitration shall be in the jurisdiction where the contract is executed. This document is executed in duplicate, with each party retaining one original copy having identical legal effect.
        </div>
      </div>
    </div>

    <div class="footer">
      <p>This document is legally binding once signed by both parties.</p>
      <p>Generated by ankrishi Contract Management System on ${currentDate}</p>
      <p>© ${new Date().getFullYear()} ankrishi. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return html;
  }
}

export default new ContractPDFService();
