import { useState } from 'react';
import {
  Box, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import { Download, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import InvoicePreview from '../components/InvoicePreview';
import { billingAPI } from '../services';

export default function BillingPage() {
  const [previewId, setPreviewId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billingAPI.list().then((r) => r.data.data),
  });

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['bill-detail', previewId],
    queryFn: () => billingAPI.get(previewId).then((r) => r.data.data),
    enabled: Boolean(previewId),
  });

  const handleDownload = async (id, billNumber) => {
    const response = await billingAPI.pdf(id);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${billNumber}.pdf`;
    link.click();
  };

  const partyName = (row) => {
    if (row.order_type === 'customer') return row.customer_name || '—';
    return row.dealer_name || '—';
  };

  const columns = [
    { field: 'bill_number', headerName: 'Invoice #', width: 160 },
    { field: 'order_number', headerName: 'Order #', width: 140 },
    {
      field: 'party', headerName: 'Bill To', flex: 1,
      valueGetter: (_, row) => partyName(row),
    },
    { field: 'subtotal', headerName: 'Taxable', width: 110, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { field: 'tax_amount', headerName: 'GST', width: 100, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { field: 'total_amount', headerName: 'Total', width: 120, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    {
      field: 'status', headerName: 'Status', width: 90,
      renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'issued' ? 'success' : 'default'} />,
    },
    {
      field: 'issued_at', headerName: 'Date', width: 110,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—',
    },
    {
      field: 'actions', headerName: 'Actions', width: 180,
      renderCell: (p) => (
        <Box display="flex" gap={0.5}>
          <Button size="small" startIcon={<Visibility />} onClick={() => setPreviewId(p.row.id)}>View</Button>
          <Button size="small" startIcon={<Download />} onClick={() => handleDownload(p.row.id, p.row.bill_number)}>PDF</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>Billing & Invoicing</Typography>
      <Typography color="text.secondary" mb={3}>
        GST tax invoices auto-generated on order creation. View or download formatted invoices below.
      </Typography>
      <DataTable rows={(data || []).map((b) => ({ id: b.id, ...b }))} columns={columns} loading={isLoading} />

      <Dialog open={Boolean(previewId)} onClose={() => setPreviewId(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Tax Invoice Preview
          {previewData?.bill && (
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleDownload(previewData.bill.id, previewData.bill.bill_number)}
            >
              Download PDF
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <InvoicePreview data={previewData} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
