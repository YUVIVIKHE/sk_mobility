import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider, Grid,
} from '@mui/material';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function InvoicePreview({ data }) {
  if (!data) return null;

  const { bill, items, company, taxSummary } = data;
  const c = company || {};

  const billToName = bill.order_type === 'customer' ? bill.customer_name : bill.dealer_name;
  const billToPhone = bill.order_type === 'customer' ? bill.customer_phone : bill.dealer_phone;
  const billToGst = bill.order_type === 'dealer' ? bill.dealer_gst : null;
  const address = bill.delivery_address || bill.dealer_address || '—';

  return (
    <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden', maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2.5 }}>
        <Grid container justifyContent="space-between" alignItems="flex-start">
          <Grid item>
            <Typography variant="h5" fontWeight={700}>{c.company_name || 'SK Mobility Pvt. Ltd.'}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              {c.company_address || 'Mumbai, Maharashtra'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              GSTIN: {c.gst_number || '—'} | PAN: {c.pan_number || '—'}
            </Typography>
          </Grid>
          <Grid item textAlign="right">
            <Typography variant="h6" fontWeight={700}>TAX INVOICE</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Original for Recipient</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Meta */}
      <Grid container sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Grid item xs={6} sx={{ p: 2, borderRight: 1, borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={700} color="primary">INVOICE DETAILS</Typography>
          <Typography variant="body2">Invoice No: <strong>{bill.bill_number}</strong></Typography>
          <Typography variant="body2">Date: {new Date(bill.issued_at || bill.created_at).toLocaleDateString('en-IN')}</Typography>
          <Typography variant="body2">Order No: {bill.order_number || '—'}</Typography>
        </Grid>
        <Grid item xs={6} sx={{ p: 2 }}>
          <Typography variant="caption" fontWeight={700} color="primary">PLACE OF SUPPLY</Typography>
          <Typography variant="body2">State: Maharashtra</Typography>
          <Typography variant="body2">Supply Type: Taxable</Typography>
        </Grid>
      </Grid>

      {/* Bill To */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" fontWeight={700} color="primary">BILL TO</Typography>
        <Typography variant="subtitle1" fontWeight={600}>{billToName || '—'}</Typography>
        <Typography variant="body2" color="text.secondary">{address}</Typography>
        <Typography variant="body2">Phone: {billToPhone || '—'}</Typography>
        {billToGst && <Typography variant="body2">GSTIN: {billToGst}</Typography>}
      </Box>

      {/* Items table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description / HSN</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Taxable</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>GST%</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Tax</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, i) => {
              const lineTax = Number(item.tax_amount || 0);
              const lineTotal = Number(item.total_amount) + lineTax;
              return (
                <TableRow key={item.id || i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    {item.description}
                    <Typography variant="caption" color="text.secondary" display="block">HSN: 8703</Typography>
                  </TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">{fmt(item.unit_price)}</TableCell>
                  <TableCell align="right">{fmt(item.total_amount)}</TableCell>
                  <TableCell align="center">{item.tax_rate}%</TableCell>
                  <TableCell align="right">{fmt(lineTax)}</TableCell>
                  <TableCell align="right">{fmt(lineTotal)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ minWidth: 240 }}>
          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography variant="body2">Subtotal</Typography>
            <Typography variant="body2">{fmt(bill.subtotal)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography variant="body2">CGST @ {taxSummary?.cgstRate}%</Typography>
            <Typography variant="body2">{fmt(taxSummary?.cgstAmount)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography variant="body2">SGST @ {taxSummary?.sgstRate}%</Typography>
            <Typography variant="body2">{fmt(taxSummary?.sgstAmount)}</Typography>
          </Box>
          {Number(bill.discount_amount) > 0 && (
            <Box display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2">Discount</Typography>
              <Typography variant="body2">- {fmt(bill.discount_amount)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={700}>Grand Total</Typography>
            <Typography fontWeight={700} color="primary.main">{fmt(bill.total_amount)}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" fontWeight={700}>Bank Details</Typography>
            <Typography variant="body2">Bank: {c.bank_name || 'HDFC Bank'}</Typography>
            <Typography variant="body2">A/C: {c.bank_account || '—'}</Typography>
            <Typography variant="body2">IFSC: {c.bank_ifsc || '—'}</Typography>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Typography variant="caption" fontWeight={700}>For {c.company_name || 'SK Mobility'}</Typography>
            <Box sx={{ mt: 4 }}>
              <Typography variant="caption" color="text.secondary">Authorized Signatory</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
