import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { SavedReport } from './storage';

export async function generateLocalPDF(report: SavedReport) {
  try {
    // Verify sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return;
    }

    // Calculate details
    const baseTotal = report.entries.reduce((sum, e) => sum + e.value, 0);
    const taxAmt = (baseTotal * (report.tax || 0)) / 100;
    const discountAmt = report.discount || 0;

    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 20px; }
          body { font-family: 'Helvetica', Arial, sans-serif; padding: 10px; color: #000; line-height: 1.4; }
          
          .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .brand-section { flex: 1; }
          .brand-name { font-size: 24px; font-weight: bold; color: #000; }
          .brand-sub { font-size: 10px; color: #444; margin-top: 2px; }
          
          .estimate-label { font-size: 28px; font-weight: bold; color: #000; text-align: right; letter-spacing: 2px; }
          
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 25px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; }
          .info-col { flex: 1; }
          .info-item { font-size: 11px; margin-bottom: 4px; }
          .info-label { font-weight: bold; color: #555; width: 80px; display: inline-block; }
          
          table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table.items th { background-color: #f2f2f2; border: 1px solid #000; text-align: center; padding: 8px; font-size: 11px; font-weight: bold; }
          table.items td { border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center; }
          .text-left { text-align: left !important; }
          
          .bottom-section { display: flex; justify-content: space-between; margin-top: 20px; }
          .notes-section { flex: 1; font-size: 10px; padding-right: 40px; color: #666; }
          
          .summary-box { width: 220px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
          .summary-row.total { border-top: 1px solid #000; margin-top: 5px; padding-top: 8px; font-weight: bold; font-size: 14px; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 9px; color: #888; }
        </style>
      </head>
      <body>
        <div class="top-row">
          <div class="brand-section">
            <div class="brand-name">AFI - CRAFTED</div>
            <div class="brand-sub">QUALITY TIMBER & CRAFTSMANSHIP</div>
          </div>
          <div class="estimate-label">ESTIMATE</div>
        </div>

        <div class="info-grid">
          <div class="info-col">
            <div class="info-item"><span class="info-label">Party Name:</span> ${report.client || 'Cash Customer'}</div>
            <div class="info-item"><span class="info-label">Project:</span> ${report.title}</div>
          </div>
          <div class="info-col" style="text-align: right;">
            <div class="info-item"><span class="info-label">Date:</span> ${new Date(report.date).toLocaleDateString('en-GB')}</div>
            <div class="info-item"><span class="info-label">Estimate #:</span> EST-${report.id.slice(-6).toUpperCase()}</div>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="width: 30px;">Sr.</th>
              <th class="text-left">Description</th>
              <th>Size</th>
              <th>Nos</th>
              <th>Volume (${report.unit})</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${report.entries.map((e, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="text-left">${e.name}</td>
                <td>${e.length} x ${e.girth || e.width}${e.thickness ? ' x ' + e.thickness : ''}</td>
                <td>${e.nos || 1}</td>
                <td>${e.volume.toFixed(3)}</td>
                <td>${e.rate || '-'}</td>
                <td>${e.value.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="bottom-section">
          <div class="notes-section">
            <strong>Notes & Terms:</strong><br/>
            1. Goods once sold will not be taken back.<br/>
            2. Subject to local jurisdiction.<br/>
            3. This is a computer generated estimate.
          </div>
          <div class="summary-box">
            <div class="summary-row">
              <span>Sub Total:</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>
            ${report.tax ? `
              <div class="summary-row">
                <span>Add Tax (${report.tax}%):</span>
                <span>+${taxAmt.toFixed(2)}</span>
              </div>
            ` : ''}
            ${report.discount ? `
              <div class="summary-row">
                <span>Less Discount:</span>
                <span>-${discountAmt.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="summary-row total">
              <span>Grand Total:</span>
              <span>${report.totalValue.toFixed(2)}</span>
            </div>
            <div class="summary-row" style="font-size: 10px; color: #666; margin-top: 4px;">
              <span>Total Qty:</span>
              <span>${report.entries.reduce((s, e) => s + (parseInt(e.nos as any) || 1), 0)} Pcs</span>
            </div>
          </div>
        </div>

        <div class="footer">
          AFI - Crafted | Powered by Timber Calc App
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  
  await Sharing.shareAsync(uri, { 
    mimeType: 'application/pdf', 
    dialogTitle: report.title, 
    UTI: 'com.adobe.pdf' 
  });
  } catch (error: any) {
    console.error('PDF Error:', error);
    Alert.alert('PDF Error', 'Failed to generate PDF: ' + error.message);
  }
}
