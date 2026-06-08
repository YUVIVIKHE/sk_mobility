const PDFDocument = require('pdfkit');

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => {
  if (n < 20) return ones[n];
  return `${tens[Math.floor(n / 10)]}${ones[n % 10] ? ` ${ones[n % 10]}` : ''}`.trim();
};

const convertNumber = (num) => {
  if (num === 0) return 'Zero';
  let n = Math.floor(num);
  const parts = [];
  if (n >= 10000000) { parts.push(`${convertNumber(Math.floor(n / 10000000))} Crore`); n %= 10000000; }
  if (n >= 100000) { parts.push(`${convertNumber(Math.floor(n / 100000))} Lakh`); n %= 100000; }
  if (n >= 1000) { parts.push(`${convertNumber(Math.floor(n / 1000))} Thousand`); n %= 1000; }
  if (n >= 100) { parts.push(`${ones[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n > 0) parts.push(twoDigits(n));
  return parts.join(' ');
};

const amountInWords = (amount) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = `${convertNumber(rupees)} Rupees`;
  if (paise > 0) words += ` and ${convertNumber(paise)} Paise`;
  return `${words} Only`;
};

const drawLine = (doc, y, margin = 40) => {
  doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
};

const drawCell = (doc, x, y, w, h, text, opts = {}) => {
  doc.rect(x, y, w, h).strokeColor('#cccccc').lineWidth(0.5).stroke();
  doc.fillColor(opts.color || '#000000').font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(opts.size || 8)
    .text(text, x + 4, y + (h - (opts.size || 8)) / 2 - 1, { width: w - 8, align: opts.align || 'left', lineBreak: false });
};

const defaultCompany = {
  company_name: 'SK Mobility Pvt. Ltd.',
  company_address: 'Plot 45, MIDC Andheri East, Mumbai, Maharashtra - 400093',
  company_email: 'info@skmobility.com',
  company_phone: '1800-756-6624',
  gst_number: '27AABCS1234M1Z5',
  pan_number: 'AABCS1234M',
  bank_name: 'HDFC Bank',
  bank_account: '50200012345678',
  bank_ifsc: 'HDFC0001234',
};

/**
 * Render a GST Tax Invoice PDF to a writable stream.
 */
const renderTaxInvoice = (doc, { bill, items, company }) => {
  const c = { ...defaultCompany, ...company };
  const margin = 40;
  const pageW = doc.page.width;
  const contentW = pageW - margin * 2;
  const issuedDate = formatDate(bill.issued_at || bill.created_at);
  const taxRate = items[0]?.tax_rate || 18;
  const cgstRate = taxRate / 2;
  const sgstRate = taxRate / 2;
  const cgstAmt = Number(bill.tax_amount) / 2;
  const sgstAmt = Number(bill.tax_amount) / 2;

  const billToName = bill.order_type === 'customer'
    ? bill.customer_name
    : bill.dealer_name || '—';
  const billToPhone = bill.order_type === 'customer' ? bill.customer_phone : bill.dealer_phone;
  const billToEmail = bill.order_type === 'customer' ? bill.customer_email : bill.dealer_email;
  const billToGst = bill.order_type === 'dealer' ? bill.dealer_gst : null;
  const billToAddress = bill.delivery_address || bill.dealer_address || '—';

  // ── Header band ──
  doc.rect(margin, 40, contentW, 72).fill('#0D47A1');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text(c.company_name, margin + 14, 52);
  doc.font('Helvetica').fontSize(9)
    .text(c.company_address, margin + 14, 78, { width: contentW * 0.55 })
    .text(`GSTIN: ${c.gst_number}`, margin + 14, 98)
    .text(`PAN: ${c.pan_number || '—'}`, margin + 180, 98);

  doc.font('Helvetica-Bold').fontSize(16).text('TAX INVOICE', pageW - margin - 140, 55, { width: 130, align: 'right' });
  doc.font('Helvetica').fontSize(8).text('Original for Recipient', pageW - margin - 140, 76, { width: 130, align: 'right' });

  let y = 128;

  // ── Invoice meta row ──
  const metaH = 52;
  const colW = contentW / 2;
  doc.rect(margin, y, colW, metaH).strokeColor('#cccccc').stroke();
  doc.rect(margin + colW, y, colW, metaH).strokeColor('#cccccc').stroke();

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(8).text('Invoice Details', margin + 8, y + 6);
  doc.font('Helvetica').fontSize(8)
    .text(`Invoice No: ${bill.bill_number}`, margin + 8, y + 20)
    .text(`Invoice Date: ${issuedDate}`, margin + 8, y + 32)
    .text(`Order No: ${bill.order_number || '—'}`, margin + 8, y + 44);

  doc.font('Helvetica-Bold').fontSize(8).text('Place of Supply', margin + colW + 8, y + 6);
  doc.font('Helvetica').fontSize(8)
    .text('State: Maharashtra', margin + colW + 8, y + 20)
    .text('Supply Type: Taxable', margin + colW + 8, y + 32)
    .text(`Payment Terms: Due on Receipt`, margin + colW + 8, y + 44);

  y += metaH + 8;

  // ── Bill To ──
  const billToH = 68;
  doc.rect(margin, y, contentW, billToH).strokeColor('#cccccc').stroke();
  doc.fillColor('#0D47A1').font('Helvetica-Bold').fontSize(9).text('Bill To', margin + 8, y + 6);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text(billToName || '—', margin + 8, y + 20);
  doc.font('Helvetica').fontSize(8)
    .text(billToAddress, margin + 8, y + 32, { width: contentW * 0.6 })
    .text(`Phone: ${billToPhone || '—'}`, margin + 8, y + 52);
  if (billToEmail) doc.text(`Email: ${billToEmail}`, margin + 200, y + 52);
  if (billToGst) doc.font('Helvetica-Bold').fontSize(8).text(`GSTIN: ${billToGst}`, pageW - margin - 180, y + 20, { width: 170, align: 'right' });

  y += billToH + 10;

  // ── Items table ──
  const cols = [
    { label: '#', w: 24, align: 'center' },
    { label: 'Description / HSN', w: 168, align: 'left' },
    { label: 'Qty', w: 32, align: 'center' },
    { label: 'Rate (₹)', w: 58, align: 'right' },
    { label: 'Taxable (₹)', w: 62, align: 'right' },
    { label: 'GST%', w: 36, align: 'center' },
    { label: 'Tax (₹)', w: 52, align: 'right' },
    { label: 'Total (₹)', w: 62, align: 'right' },
  ];

  const tableW = cols.reduce((s, c2) => s + c2.w, 0);
  const tableX = margin + (contentW - tableW) / 2;
  const headerH = 20;
  const rowH = 22;

  doc.rect(tableX, y, tableW, headerH).fill('#f0f4f8');
  let cx = tableX;
  cols.forEach((col) => {
    drawCell(doc, cx, y, col.w, headerH, col.label, { bold: true, size: 7, align: col.align, color: '#0D47A1' });
    cx += col.w;
  });
  y += headerH;

  items.forEach((item, idx) => {
    const lineTax = Number(item.tax_amount || 0);
    const lineTotal = Number(item.total_amount) + lineTax;
    const desc = `${item.description}  [HSN: 8703]`;
    const currentRowH = rowH;
    cx = tableX;
    const vals = [
      String(idx + 1),
      desc,
      String(item.quantity),
      fmt(item.unit_price),
      fmt(item.total_amount),
      `${item.tax_rate || taxRate}%`,
      fmt(lineTax),
      fmt(lineTotal),
    ];
    cols.forEach((col, i) => {
      drawCell(doc, cx, y, col.w, currentRowH, vals[i], { size: 7, align: col.align });
      cx += col.w;
    });
    y += currentRowH;
  });

  y += 12;

  // ── Totals panel ──
  const totalsW = 220;
  const totalsX = pageW - margin - totalsW;
  const totalsRows = [
    ['Subtotal', fmt(bill.subtotal)],
    [`CGST @ ${cgstRate}%`, fmt(cgstAmt)],
    [`SGST @ ${sgstRate}%`, fmt(sgstAmt)],
  ];
  if (Number(bill.discount_amount) > 0) {
    totalsRows.push(['Discount', `- ${fmt(bill.discount_amount)}`]);
  }
  totalsRows.push(['Grand Total', fmt(bill.total_amount)]);

  totalsRows.forEach(([label, value], i) => {
    const isGrand = i === totalsRows.length - 1;
    doc.rect(totalsX, y, totalsW, 18).strokeColor('#cccccc').stroke();
    doc.font(isGrand ? 'Helvetica-Bold' : 'Helvetica').fontSize(isGrand ? 9 : 8).fillColor('#000')
      .text(label, totalsX + 8, y + 5)
      .text(value, totalsX + 8, y + 5, { width: totalsW - 16, align: 'right' });
    y += 18;
  });

  y += 10;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#333')
    .text('Amount in Words:', margin, y);
  doc.font('Helvetica').fontSize(8).fillColor('#000')
    .text(amountInWords(Number(bill.total_amount)), margin + 90, y, { width: contentW - 90 });

  y += 28;
  drawLine(doc, y);
  y += 10;

  // ── Bank & footer ──
  doc.font('Helvetica-Bold').fontSize(8).text('Bank Details', margin, y);
  doc.font('Helvetica').fontSize(8)
    .text(`Bank: ${c.bank_name}`, margin, y + 14)
    .text(`A/C No: ${c.bank_account}`, margin, y + 26)
    .text(`IFSC: ${c.bank_ifsc}`, margin, y + 38);

  doc.font('Helvetica-Bold').fontSize(8).text('Terms & Conditions', margin + 220, y);
  doc.font('Helvetica').fontSize(7)
    .text('1. Goods once sold will not be taken back.', margin + 220, y + 14, { width: 200 })
    .text('2. Subject to Mumbai jurisdiction.', margin + 220, y + 26)
    .text('3. This is a computer-generated invoice.', margin + 220, y + 38);

  doc.font('Helvetica-Bold').fontSize(8)
    .text('For SK Mobility', pageW - margin - 120, y + 50, { width: 120, align: 'right' });
  doc.font('Helvetica').fontSize(7)
    .text('Authorized Signatory', pageW - margin - 120, y + 78, { width: 120, align: 'right' });

  doc.fontSize(7).fillColor('#888')
    .text(`Generated on ${new Date().toLocaleString('en-IN')} | ${c.company_email} | ${c.company_phone}`, margin, doc.page.height - 40, {
      width: contentW,
      align: 'center',
    });
};

module.exports = { renderTaxInvoice, amountInWords, fmt };
