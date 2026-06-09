import { useState } from 'react';
import {
  Box, Typography, Chip, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Grid, Paper, Collapse, IconButton,
} from '@mui/material';
import { Payment, ExpandMore, ExpandLess, ReceiptLong, CheckCircle, PendingActions, ShoppingCart } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { paymentsAPI } from '../services';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtShort = (v) => {
  const n = Number(v || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return fmt(n);
};

const paymentStatusColors = { paid: 'success', partial: 'warning', pending: 'error' };
const paymentRecordColors = { completed: 'success', pending: 'warning', failed: 'error', refunded: 'default' };

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [payDialog, setPayDialog] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'upi',
    transactionRef: '',
    notes: '',
  });

  const { data: summary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => paymentsAPI.summary().then((r) => r.data.data),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['payment-orders'],
    queryFn: () => paymentsAPI.orderSummaries().then((r) => r.data.data),
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsAPI.list().then((r) => r.data),
  });

  const { data: orderPayments = [] } = useQuery({
    queryKey: ['payments', expandedOrder],
    queryFn: () => paymentsAPI.list({ orderId: expandedOrder }).then((r) => r.data.data),
    enabled: Boolean(expandedOrder),
  });

  const payMutation = useMutation({
    mutationFn: (payload) => paymentsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-orders']);
      queryClient.invalidateQueries(['payment-summary']);
      queryClient.invalidateQueries(['payments']);
      setPayDialog(null);
      setSuccess('Payment recorded successfully');
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Payment failed'),
  });

  const openPayDialog = (order) => {
    setPayForm({
      amount: String(order.remaining_amount),
      paymentMethod: 'upi',
      transactionRef: '',
      notes: '',
    });
    setPayDialog(order);
    setError('');
  };

  const handlePay = () => {
    if (!payDialog) return;
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (amount > payDialog.remaining_amount + 0.01) {
      setError(`Amount cannot exceed remaining ${fmt(payDialog.remaining_amount)}`);
      return;
    }
    if (['upi', 'bank_transfer', 'cheque'].includes(payForm.paymentMethod) && !payForm.transactionRef.trim()) {
      setError('Transaction reference is required');
      return;
    }
    payMutation.mutate({
      orderId: payDialog.id,
      amount,
      paymentMethod: payForm.paymentMethod,
      transactionRef: payForm.transactionRef.trim() || undefined,
      notes: payForm.notes.trim() || undefined,
    });
  };

  const orderColumns = [
    { field: 'order_number', headerName: 'Order #', width: 150 },
    ...(isAdmin ? [
      { field: 'dealer_name', headerName: 'Dealer', flex: 1 },
      { field: 'dealer_code', headerName: 'Code', width: 120 },
    ] : []),
    { field: 'total_amount', headerName: 'Order Total', width: 130, valueFormatter: (v) => fmt(v) },
    { field: 'paid_amount', headerName: 'Paid', width: 120, valueFormatter: (v) => fmt(v) },
    { field: 'remaining_amount', headerName: 'Remaining', width: 130, valueFormatter: (v) => fmt(v) },
    {
      field: 'payment_status', headerName: 'Payment Status', width: 140,
      renderCell: (p) => <Chip label={p.value} color={paymentStatusColors[p.value]} size="small" />,
    },
    { field: 'order_status', headerName: 'Order Status', width: 120, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" /> },
    {
      field: 'actions', headerName: 'Actions', width: 160,
      renderCell: (p) => (
        <Box display="flex" gap={1}>
          {p.row.remaining_amount > 0 && (
            <Button size="small" variant="contained" startIcon={<Payment />} onClick={() => openPayDialog(p.row)}>
              Pay
            </Button>
          )}
          <IconButton size="small" onClick={() => setExpandedOrder(expandedOrder === p.row.id ? null : p.row.id)}>
            {expandedOrder === p.row.id ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      ),
    },
  ];

  const paymentColumns = [
    { field: 'payment_number', headerName: 'Payment #', width: 160 },
    ...(isAdmin ? [{ field: 'dealer_name', headerName: 'Dealer', flex: 1 }] : []),
    { field: 'order_number', headerName: 'Order', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 130, valueFormatter: (v) => fmt(v) },
    { field: 'payment_method', headerName: 'Method', width: 120 },
    { field: 'payment_type', headerName: 'Type', width: 100 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (p) => <Chip label={p.value} color={paymentRecordColors[p.value]} size="small" />,
    },
    { field: 'paid_at', headerName: 'Paid At', width: 160, valueFormatter: (v) => (v ? new Date(v).toLocaleString('en-IN') : '—') },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        {isAdmin ? 'Payment Management' : 'My Order Payments'}
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && !payDialog && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Order Total"
            value={fmtShort(summary?.orderTotal)}
            subtitle={Number(summary?.orderTotal || 0) >= 100000 ? fmt(summary?.orderTotal) : undefined}
            icon={<ReceiptLong />}
            color="#0D47A1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid Amount"
            value={fmtShort(summary?.paidTotal)}
            subtitle={Number(summary?.paidTotal || 0) >= 100000 ? fmt(summary?.paidTotal) : undefined}
            icon={<CheckCircle />}
            color="#009624"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Remaining"
            value={fmtShort(summary?.remainingTotal)}
            subtitle={Number(summary?.remainingTotal || 0) >= 100000 ? fmt(summary?.remainingTotal) : undefined}
            icon={<PendingActions />}
            color="#ED6C02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Orders"
            value={summary?.orderCount ?? 0}
            subtitle={(
              <Box display="flex" gap={0.5} flexWrap="wrap">
                <Chip label={`${summary?.paidCount || 0} paid`} size="small" color="success" variant="outlined" />
                <Chip label={`${summary?.partialCount || 0} partial`} size="small" color="warning" variant="outlined" />
                <Chip label={`${summary?.pendingCount || 0} pending`} size="small" color="error" variant="outlined" />
              </Box>
            )}
            icon={<ShoppingCart />}
            color="#0288D1"
          />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Orders & Balances" />
        <Tab label="Payment History" />
      </Tabs>

      {tab === 0 && (
        <>
          <DataTable
            rows={orders.map((o) => ({ id: o.id, ...o }))}
            columns={orderColumns}
            loading={ordersLoading}
          />
          {expandedOrder && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Payments for order {orders.find((o) => o.id === expandedOrder)?.order_number}
              </Typography>
              <Collapse in={Boolean(expandedOrder)}>
                {orderPayments.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No payments recorded yet.</Typography>
                ) : (
                  orderPayments.map((p) => (
                    <Box key={p.id} display="flex" gap={2} py={1} borderBottom="1px solid #eee" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>{p.payment_number}</Typography>
                      <Typography variant="body2">{fmt(p.amount)}</Typography>
                      <Chip label={p.payment_method} size="small" variant="outlined" />
                      <Chip label={p.status} size="small" color={paymentRecordColors[p.status]} />
                      {p.transaction_ref && <Typography variant="caption" color="text.secondary">Ref: {p.transaction_ref}</Typography>}
                    </Box>
                  ))
                )}
              </Collapse>
            </Paper>
          )}
        </>
      )}

      {tab === 1 && (
        <DataTable
          rows={(paymentsData?.data || []).map((p) => ({ id: p.id, ...p }))}
          columns={paymentColumns}
          loading={paymentsLoading}
        />
      )}

      <Dialog open={Boolean(payDialog)} onClose={() => setPayDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Pay for Order {payDialog?.order_number}</DialogTitle>
        <DialogContent>
          {error && payDialog && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Order Total</Typography>
                <Typography fontWeight={600}>{fmt(payDialog?.total_amount)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Remaining</Typography>
                <Typography fontWeight={600} color="warning.main">{fmt(payDialog?.remaining_amount)}</Typography>
              </Grid>
            </Grid>
            <TextField
              fullWidth label="Amount" type="number" margin="normal" required
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              inputProps={{ min: 1, max: payDialog?.remaining_amount, step: 0.01 }}
              helperText="Pay full remaining or enter partial amount"
            />
            <TextField
              select fullWidth label="Payment Method" margin="normal" required
              value={payForm.paymentMethod}
              onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
            >
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
              {isAdmin && <MenuItem value="cash">Cash</MenuItem>}
            </TextField>
            {payForm.paymentMethod !== 'cash' && (
              <TextField
                fullWidth label="Transaction / UTR Reference" margin="normal" required
                value={payForm.transactionRef}
                onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })}
              />
            )}
            <TextField
              fullWidth label="Notes" margin="normal" multiline rows={2}
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handlePay} disabled={payMutation.isPending}>
            {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
