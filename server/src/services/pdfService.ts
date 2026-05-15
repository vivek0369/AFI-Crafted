import PDFDocument from 'pdfkit';
import { IReport } from '../models/Report';
import path from 'path';

export const generateReportPDF = (report: IReport): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --- Header ---
    const logoPath = path.join(__dirname, '../../assets/logo.png');
    try {
      doc.image(logoPath, 50, 45, { width: 60 });
    } catch (e) {
      // Skip logo if not found
    }

    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('AFI - Crafted', 120, 50)
      .fontSize(10)
      .text('Professional Timber Calculations', 120, 75)
      .text('info@afi-crafted.com | www.afi-crafted.com', 120, 90)
      .moveDown();

    // --- Horizontal Line ---
    doc.strokeColor('#eeeeee').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

    // --- Report Info ---
    doc
      .fillColor('#000000')
      .fontSize(14)
      .text('ESTIMATE REPORT', 50, 135, { align: 'center' })
      .moveDown();

    doc
      .fontSize(10)
      .font('Helvetica-Bold').text('Estimate ID:', 50, 170)
      .font('Helvetica').text(report._id.toString().toUpperCase().slice(-8), 130, 170)
      .font('Helvetica-Bold').text('Date:', 50, 185)
      .font('Helvetica').text(new Date(report.date).toLocaleDateString(), 130, 185)
      .font('Helvetica-Bold').text('Project Title:', 300, 170)
      .font('Helvetica').text(report.title, 380, 170)
      .font('Helvetica-Bold').text('Client:', 300, 185)
      .font('Helvetica').text(report.client, 380, 185)
      .moveDown(2);

    // --- Table Header ---
    const tableTop = 230;
    doc.font('Helvetica-Bold');
    generateTableRow(doc, tableTop, 'Item Name', 'Length', 'Girth/W', 'Nos', 'Volume', 'Value');
    generateHr(doc, tableTop + 15);
    doc.font('Helvetica');

    // --- Table Content ---
    let i = 0;
    let position = tableTop + 30;

    for (const entry of report.entries) {
      const g_w = entry.girth || entry.width || '-';
      generateTableRow(
        doc,
        position,
        entry.name,
        `${entry.length}m`,
        `${g_w}`,
        `${entry.nos}`,
        `${entry.volume.toFixed(3)} ${report.unit}`,
        `$${entry.value.toFixed(2)}`
      );
      generateHr(doc, position + 15);
      position += 25;
      i++;

      // Handle page break
      if (position > 700) {
        doc.addPage();
        position = 50;
      }
    }

    // --- Summary ---
    const summaryTop = position + 30;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Volume:', 350, summaryTop)
      .text(`${report.totalVolume.toFixed(3)} ${report.unit}`, 450, summaryTop, { align: 'right', width: 100 })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor('#7B3A10') // Brand color
      .text('Grand Total:', 350, summaryTop + 25)
      .text(`$${report.totalValue.toFixed(2)}`, 450, summaryTop + 25, { align: 'right', width: 100 });

    // --- Footer ---
    doc
      .fillColor('#aaaaaa')
      .fontSize(8)
      .text(
        'This is a computer-generated estimate. Thank you for choosing AFI - Crafted.',
        50,
        750,
        { align: 'center', width: 500 }
      );

    doc.end();
  });
};

function generateTableRow(doc: PDFKit.PDFDocument, y: number, item: string, len: string, gw: string, nos: string, vol: string, val: string) {
  doc
    .fontSize(9)
    .text(item, 50, y, { width: 150 })
    .text(len, 200, y, { width: 50 })
    .text(gw, 260, y, { width: 50 })
    .text(nos, 320, y, { width: 30 })
    .text(vol, 360, y, { width: 80, align: 'right' })
    .text(val, 450, y, { width: 100, align: 'right' });
}

function generateHr(doc: PDFKit.PDFDocument, y: number) {
  doc.strokeColor('#eeeeee').lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
}
