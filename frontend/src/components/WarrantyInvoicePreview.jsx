// Extended Warranty Certificate - matches extended-warranty.html format exactly
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function WarrantyInvoicePreview({ data }) {
  if (!data) return null;
  const { bill, items = [], company = {}, taxSummary = {} } = data;

  const cgst = Number(taxSummary?.cgstAmount || 0);
  const sgst = Number(taxSummary?.sgstAmount || 0);
  const subtotal = Number(bill.subtotal || 0);
  const total = Number(bill.total_amount || 0);
  const cgstRate = taxSummary?.cgstRate || 9;
  const sgstRate = taxSummary?.sgstRate || 9;

  const s = {
    page: { width: '210mm', minHeight: '297mm', margin: 'auto', background: '#fff', padding: '20px', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box' },
    topTitle: { fontSize: '14px', marginBottom: '15px' },
    banner: { background: '#1d1d1d', color: '#fff', height: '120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', marginBottom: '20px' },
    logoLeft: { width: '180px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', lineHeight: 1.3 },
    bannerCenter: { textAlign: 'center', lineHeight: '28px', fontSize: '14px' },
    logoRight: { fontSize: '42px', fontStyle: 'italic', fontWeight: 'bold' },
    certTitle: { textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' },
    infoRow: { display: 'flex', marginBottom: '10px', fontSize: '14px' },
    label: { width: '160px' },
    value: { flex: 1, fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '14px', background: '#f3f3f3' },
    td: { border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '14px' },
    totalSection: { textAlign: 'right', marginTop: '20px', fontSize: '18px', fontWeight: 'bold' },
    amountWords: { marginTop: '25px', fontSize: '14px' },
    footer: { marginTop: '60px', fontSize: '14px', fontWeight: 'bold' },
  };

  // Warranty-specific data
  const warrantyItem = items[0] || {};
  const startDate = warrantyItem.warranty_start || bill.warranty_start || '—';
  const endDate = warrantyItem.warranty_end || bill.warranty_end || '—';
  const periodOfCover = bill.warranty_period || warrantyItem.warranty_period || '24 Months';

  return (
    <div style={s.page} id="warranty-invoice-print">
      {/* Tax Invoice label top-left */}
      <div style={s.topTitle}>Tax Invoice</div>

      {/* Dark Banner */}
      <div style={s.banner}>
        <div style={s.logoLeft}>
          CW<br />
          CORPORATE WARRANTY
        </div>
        <div style={s.bannerCenter}>
          {company.company_name || 'SK MOBILITY'}<br />
          {company.company_address || '—'}<br />
          {company.company_email || '—'}
        </div>
        <div style={s.logoRight}>
          {company.brand_name || 'Chetak'}
        </div>
      </div>

      {/* Certificate Title */}
      <div style={s.certTitle}>EXTENDED WARRANTY CERTIFICATE</div>

      {/* Info Grid */}
      <div style={s.infoGrid}>
        {/* Left Column */}
        <div>
          {[
            ['GSTIN', company.gst_number || '—'],
            ['Invoice No.', bill.bill_number || '—'],
            ['Invoice Date', bill.issued_at ? new Date(bill.issued_at).toLocaleDateString('en-IN') : '—'],
            ['Registration No.', bill.registration_no || '—'],
            ['Customer Name', bill.customer_name || '—'],
            ['Mobile', bill.customer_phone || '—'],
          ].map(([lbl, val]) => (
            <div key={lbl} style={s.infoRow}>
              <div style={s.label}>{lbl}</div>
              <div style={s.value}>: {val}</div>
            </div>
          ))}
          <div style={s.infoRow}>
            <div style={s.label}>Customer Address</div>
            <div style={s.value}>
              : {bill.customer_address || bill.delivery_address || '—'}
            </div>
          </div>
          {[
            ['City', bill.customer_city || '—'],
            ['State', bill.customer_state || 'Maharashtra'],
            ['State Code', bill.state_code || 'MH'],
          ].map(([lbl, val]) => (
            <div key={lbl} style={s.infoRow}>
              <div style={s.label}>{lbl}</div>
              <div style={s.value}>: {val}</div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div>
          {[
            ['SAC Code', bill.sac_code || '999799'],
            ['Registration', bill.chassis_registration || '—'],
            ['Date Of Vehicle Sale', bill.vehicle_sale_date ? new Date(bill.vehicle_sale_date).toLocaleDateString('en-IN') : (bill.issued_at ? new Date(bill.issued_at).toLocaleDateString('en-IN') : '—')],
            ['Odometer Reading', bill.odometer_reading || '—'],
            ['Chassis No.', bill.chassis_no || '—'],
            ['Engine No.', bill.motor_no || bill.engine_no || '—'],
            ['Model', bill.vehicle_model || '—'],
            ['Comments', bill.comments || '—'],
            ['Period Of Cover', periodOfCover],
          ].map(([lbl, val]) => (
            <div key={lbl} style={s.infoRow}>
              <div style={s.label}>{lbl}</div>
              <div style={s.value}>: {val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Table */}
      <table style={s.table}>
        <thead>
          <tr>
            {['Programme Type','Start Date','Expiry Date','Rate',`Taxable Amount`,`CGST (${cgstRate}%)`,`SGST (${sgstRate}%)`,`Amount`].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((it, i) => {
            const itCgst = Number(it.tax_amount || 0) / 2;
            const itSgst = Number(it.tax_amount || 0) / 2;
            const itTotal = Number(it.total_amount) + Number(it.tax_amount || 0);
            return (
              <tr key={i}>
                <td style={s.td}>{it.programme_type || 'EW'}</td>
                <td style={s.td}>{it.warranty_start || startDate}</td>
                <td style={s.td}>{it.warranty_end || endDate}</td>
                <td style={s.td}>{fmt(it.unit_price || it.total_amount)}</td>
                <td style={s.td}>{fmt(it.total_amount)}</td>
                <td style={s.td}>{fmt(itCgst)}</td>
                <td style={s.td}>{fmt(itSgst)}</td>
                <td style={s.td}>{fmt(itTotal)}</td>
              </tr>
            );
          }) : (
            <tr>
              <td style={s.td}>EW</td>
              <td style={s.td}>{startDate}</td>
              <td style={s.td}>{endDate}</td>
              <td style={s.td}>{fmt(subtotal)}</td>
              <td style={s.td}>{fmt(subtotal)}</td>
              <td style={s.td}>{fmt(cgst)}</td>
              <td style={s.td}>{fmt(sgst)}</td>
              <td style={s.td}>{fmt(total)}</td>
            </tr>
          )}
          {/* Total row */}
          <tr>
            <td colSpan={3} style={s.td}><strong>TOTAL</strong></td>
            <td style={s.td}>{fmt(subtotal)}</td>
            <td style={s.td}>{fmt(subtotal)}</td>
            <td style={s.td}>{fmt(cgst)}</td>
            <td style={s.td}>{fmt(sgst)}</td>
            <td style={s.td}><strong>{fmt(total)}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Total Payable */}
      <div style={s.totalSection}>
        Total Payable Amount : {fmt(total)}
      </div>

      {/* Amount in Words */}
      <div style={s.amountWords}>
        <strong>Amount In Words :</strong> {bill.amount_in_words || `${fmt(total)} Only`}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        Dealer Name & Stamp
      </div>
    </div>
  );
}
