import { useState } from 'react';
import {
  Box, Typography, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Download, Visibility, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import InvoicePreview from '../components/InvoicePreview';
import { billingAPI } from '../services';

const printInvoice = (containerId) => {
  const content = document.getElementById(containerId);
  if (!content) return;
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fff; }
        @page { size: A4; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>${content.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};

export default function BillingPage() {
  const [previewId, setPreviewId] = useState(null);
  const [billTypeFilter, setBillTypeFilter] = useState('all');

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

  const filteredData = (data || []).filter(b => {
    if (billTypeFilter === 'all') return true;
    return (b.bill_type || 'vehicle') === billTypeFilter;
  });

  const printId = previewData?.bill?.bill_type === 'warranty'
    ? 'warranty-invoice-print'
    : 'vehicle-invoice-print';

  const columns = [
    { field: 'bill_number', headerName: 'Invoice #', width: 180 },
    { field: 'order_number', headerName: 'Order #', width: 140 },
    {
      field: 'bill_type', headerName: 'Type', width: 110,
      renderCell: (p) => (
        <Chip
          label={p.value === 'warranty' ? 'Warranty' : 'Vehicle'}
          size="small"
          color={p.value === 'warranty' ? 'secondary' : 'primary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'party', headerName: 'Bill To', flex: 1,
      valueGetter: (_, row) => partyName(row),
    },
    { field: 'subtotal', headerName: 'Taxable', width: 110, valueFormatter: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { field: 'tax_amount', headerName: 'GST', width: 100, valueFormatter: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { field: 'total_amount', headerName: 'Total', width: 120, valueFormatter: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    {
      field: 'status', headerName: 'Status', width: 90,
      renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'issued' ? 'success' : 'default'} />,
    },
    {
      field: 'issued_at', headerName: 'Date', width: 110,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—',
    },
    {
      field: 'actions', headerName: 'Actions', width: 200,
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
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Billing & Invoicing</Typography>
          <Typography color="text.secondary" mt={0.5}>
            GST tax invoices auto-generated on order creation.
          </Typography>
        </Box>
        <ToggleButtonGroup value={billTypeFilter} exclusive onChange={(_, v) => v && setBillTypeFilter(v)} size="small">
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="vehicle">Vehicle Invoice</ToggleButton>
          <ToggleButton value="warranty">Warranty Certificate</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box mb={3} />
      <DataTable rows={filteredData.map((b) => ({ id: b.id, ...b }))} columns={columns} loading={isLoading} />

      <Dialog open={Boolean(previewId)} onClose={() => setPreviewId(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            {previewData?.bill?.bill_type === 'warranty' ? 'Extended Warranty Certificate' : 'Vehicle Tax Invoice'}
            {previewData?.bill?.bill_number && (
              <Typography variant="caption" color="text.secondary" display="block">
                #{previewData.bill.bill_number}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            {previewData?.bill && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => printInvoice(printId)}
                >
                  Print
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => handleDownload(previewData.bill.id, previewData.bill.bill_number)}
                >
                  Download PDF
                </Button>
              </>
            )}
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: '#f5f5f5', p: 2 }}>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <Box sx={{ transform: 'scale(0.75)', transformOrigin: 'top center', width: '133%', ml: '-16%' }}>
              <InvoicePreview data={previewData} />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
