// Vehicle Tax Invoice - matches vehicle-invoice.html format exactly
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function VehicleInvoicePreview({ data }) {
  if (!data) return null;
  const { bill, items = [], company = {}, taxSummary = {} } = data;

  const cgst = Number(taxSummary?.cgstAmount || 0);
  const sgst = Number(taxSummary?.sgstAmount || 0);
  const subtotal = Number(bill.subtotal || 0);
  const pmSubsidy = Number(bill.pm_drive_incentive || 0);
  const stateSubsidy = Number(bill.state_subsidy || 0);
  const total = Number(bill.total_amount || 0);

  const item = items[0] || {};
  const hsnCode = item.hsn_code || '87116020';

  const style = {
    invoice: { width: '210mm', minHeight: '297mm', margin: 'auto', background: '#fff', padding: '25px', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', boxSizing: 'border-box' },
    topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '12px', marginBottom: '10px' },
    logo: { textAlign: 'center', fontSize: '38px', fontStyle: 'italic', fontWeight: 'bold' },
    recipient: { textAlign: 'right', fontSize: '13px' },
    centerInfo: { textAlign: 'center', marginTop: '10px' },
    hr: { margin: '10px 0', border: 'none', borderTop: '1px solid #000' },
    details: { display: 'flex', justifyContent: 'space-between', gap: '20px' },
    halfCol: { width: '50%' },
    detailRow: { display: 'flex', marginBottom: '6px' },
    label: { width: '150px', fontWeight: 'normal' },
    value: { flex: 1, fontWeight: 'bold' },
    addressSection: { marginTop: '15px' },
    addressBox: { marginTop: '8px', marginBottom: '10px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' },
    th: { border: '1px solid #000', padding: '8px', textAlign: 'center', background: '#f3f3f3' },
    td: { border: '1px solid #000', padding: '8px', textAlign: 'center' },
    tdLeft: { border: '1px solid #000', padding: '8px', textAlign: 'left' },
    amountWords: { marginTop: '15px', border: '1px solid #000', padding: '8px' },
    terms: { marginTop: '30px', fontSize: '12px', lineHeight: '20px' },
    footer: { marginTop: '50px', textAlign: 'right' },
  };

  return (
    <div style={style.invoice} id="vehicle-invoice-print">
      {/* Top Header */}
      <div style={style.topHeader}>
        <div>
          <strong>Branch Address :</strong><br />
          {company.company_name || 'SK Mobility'}<br />
          {company.company_address || '—'}<br />
          Mobile : {company.company_phone || '—'}<br />
          Email : {company.company_email || '—'}
        </div>
        <div style={style.logo}>{company.brand_name || 'Chetak'}</div>
        <div style={style.recipient}>Original For Recipient</div>
      </div>

      {/* Center Info */}
      <div style={style.centerInfo}>
        <h2 style={{ fontSize: '18px', marginBottom: '5px' }}>{company.company_name || 'SK Mobility'}</h2>
        {company.dealer_code && <h3 style={{ fontSize: '14px', marginBottom: '3px' }}>Dealer's PM E-DRIVE Code : {company.dealer_code}</h3>}
        <h1 style={{ fontSize: '28px', marginTop: '10px' }}>TAX INVOICE (Vehicle)</h1>
      </div>

      <hr style={style.hr} />

      {/* Customer + Invoice Details */}
      <div style={style.details}>
        <div style={style.halfCol}>
          {[
            ['Customer Type', bill.customer_type || 'Individual'],
            ['Customer Name', bill.customer_name || '—'],
            ['Customer Phone', bill.customer_phone || '—'],
            ['Customer Email', bill.customer_email || '—'],
            ['Customer Aadhaar', bill.customer_aadhaar || '—'],
            ['Customer PAN', bill.customer_pan || '—'],
          ].map(([lbl, val]) => (
            <div key={lbl} style={style.detailRow}>
              <div style={style.label}>{lbl}</div>
              <div style={style.value}>: {val}</div>
            </div>
          ))}
        </div>
        <div style={style.halfCol}>
          {[
            ['Invoice No.', bill.bill_number || '—'],
            ['Invoice Date', bill.issued_at ? new Date(bill.issued_at).toLocaleDateString('en-IN') : '—'],
            ['Booking No.', bill.order_number || '—'],
            ['Chassis No.', bill.chassis_no || '—'],
            ['Battery Capacity', bill.battery_capacity || '—'],
            ['Motor No.', bill.motor_no || '—'],
            ['Color', bill.color || '—'],
          ].map(([lbl, val]) => (
            <div key={lbl} style={style.detailRow}>
              <div style={style.label}>{lbl}</div>
              <div style={style.value}>: {val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Addresses */}
      <div style={style.addressSection}>
        <strong>Bill To Address</strong>
        <div style={style.addressBox}>
          {bill.customer_name || '—'}<br />
          {bill.delivery_address || bill.customer_address || '—'}<br />
          Mobile : {bill.customer_phone || '—'}
        </div>
        <strong>Delivery Address</strong>
        <div style={style.addressBox}>
          {company.company_address || '—'}
        </div>
      </div>

      {/* Invoice Table */}
      <table style={style.table}>
        <tbody>
          <tr>
            {['S.No','Model Name / HSN Code','Unit Price','Qty','Disc','Taxable Amount','CGST','SGST','Amount'].map(h => (
              <th key={h} style={style.th}>{h}</th>
            ))}
          </tr>
          {/* Item rows */}
          {items.length > 0 ? items.map((it, i) => (
            <tr key={i}>
              <td style={style.td}>{i + 1}</td>
              <td style={style.tdLeft}>{it.description || '—'} / {it.hsn_code || hsnCode}</td>
              <td style={style.td}>{fmt(it.unit_price)}</td>
              <td style={style.td}>{it.quantity || 1}</td>
              <td style={style.td}>{fmt(it.discount || 0)}</td>
              <td style={style.td}>{fmt(it.total_amount)}</td>
              <td style={style.td}>{fmt(Number(it.tax_amount || 0) / 2)}</td>
              <td style={style.td}>{fmt(Number(it.tax_amount || 0) / 2)}</td>
              <td style={style.td}>{fmt(Number(it.total_amount) + Number(it.tax_amount || 0))}</td>
            </tr>
          )) : (
            <tr>
              <td style={style.td}>1</td>
              <td style={style.tdLeft}>{bill.vehicle_model || 'Vehicle'} / {hsnCode}</td>
              <td style={style.td}>{fmt(subtotal)}</td>
              <td style={style.td}>1</td>
              <td style={style.td}>0.00</td>
              <td style={style.td}>{fmt(subtotal)}</td>
              <td style={style.td}>{fmt(cgst)}</td>
              <td style={style.td}>{fmt(sgst)}</td>
              <td style={style.td}>{fmt(subtotal + cgst + sgst)}</td>
            </tr>
          )}

          <tr>
            <td style={style.td}>{ (items.length || 1) + 1}</td>
            <td style={style.tdLeft}>Round Off</td>
            <td colSpan={7} style={style.td}></td>
            <td style={style.td}>NA</td>
          </tr>

          {pmSubsidy > 0 && (
            <tr>
              <td style={style.td}>{(items.length || 1) + 2}</td>
              <td style={style.tdLeft}>PM E-DRIVE Incentive from Govt. of India</td>
              <td colSpan={7} style={style.td}></td>
              <td style={style.td}>-{fmt(pmSubsidy)}</td>
            </tr>
          )}

          <tr>
            <td style={style.td}>{(items.length || 1) + (pmSubsidy > 0 ? 3 : 2)}</td>
            <td style={style.tdLeft}>Sub Total</td>
            <td colSpan={7} style={style.td}></td>
            <td style={style.td}>{fmt(total - stateSubsidy)}</td>
          </tr>

          <tr>
            <td style={style.td}>{(items.length || 1) + (pmSubsidy > 0 ? 4 : 3)}</td>
            <td style={style.tdLeft}>State Govt. Subsidy</td>
            <td colSpan={7} style={style.td}></td>
            <td style={style.td}>{stateSubsidy > 0 ? `-${fmt(stateSubsidy)}` : 'NA'}</td>
          </tr>

          <tr>
            <td style={style.td}>{(items.length || 1) + (pmSubsidy > 0 ? 5 : 4)}</td>
            <td style={style.tdLeft}><strong>Total Amount</strong></td>
            <td colSpan={7} style={style.td}></td>
            <td style={style.td}><strong>{fmt(total)}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={style.amountWords}>
        <strong>AMOUNT IN WORDS :</strong> {bill.amount_in_words || `RS ${fmt(total)} ONLY`}
      </div>

      {/* Terms */}
      <div style={style.terms}>
        <strong>Terms and Conditions :</strong><br />
        a. Terms and conditions as agreed by you during online booking shall apply.<br />
        b. Subsidies applicable, if any, are subject to approval from respective Government departments.<br />
        c. Ex-showroom price is inclusive of charger and charging cable.
      </div>

      {/* Footer */}
      <div style={style.footer}>
        For {company.company_name || 'SK Mobility'}
      </div>
    </div>
  );
}
