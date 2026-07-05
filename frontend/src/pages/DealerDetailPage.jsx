import {
  Box, Typography, Grid, Card, CardContent, Chip, Button, Avatar,
  Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Alert, Tabs, Tab,
} from '@mui/material';
import {
  ArrowBack, Store, TrendingUp, ShoppingCart, AttachMoney,
  People, Build, CheckCircle, Cancel, Schedule, Phone, Email, Badge,
} from '@mui/icons-material';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dealersAPI } from '../services';

const TEAL = '#0d9488';

const STATUS_COLORS = {
  pending: 'warning', approved: 'success', rejected: 'error',
  suspended: 'default', inactive: 'default',
};

const ORDER_STATUS_COLORS = {
  pending: 'warning', approved: 'info', processing: 'primary',
  shipped: 'secondary', delivered: 'success', cancelled: 'error',
};

function InfoRow({ label, value }) {
  return (
    <Box display="flex" py={1} borderBottom="1px solid #f8fafc">
      <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 140, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

function KpiCard({ icon, label, value, color = TEAL, sub }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ color, display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value ?? '—'}</Typography>
        <Typography sx={{ fontSize: 12, color: '#64748b', mt: 0.5 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color, fontWeight: 600, mt: 0.25 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function DealerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { data: dealerData, isLoading: dealerLoading, isError } = useQuery({
    queryKey: ['dealer', id],
    queryFn: () => dealersAPI.get(id).then((r) => r.data.data),
    enabled: Boolean(id),
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['dealer-performance', id],
    queryFn: () => dealersAPI.performance(id).then((r) => r.data.data),
    enabled: Boolean(id),
  });

  if (dealerLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (isError || !dealerData) {
    return <Alert severity="error">Failed to load dealer details.</Alert>;
  }

  const dealer = dealerData;
  const perf = perfData || {};
  const orders = perf.recentOrders || [];
  const monthlyStats = perf.monthlyStats || [];

  return (
    <Box>
      {/* Back + Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dealers')}
          sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
        >
          Dealers
        </Button>
        <Typography sx={{ color: '#cbd5e1' }}>/</Typography>
        <Typography sx={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>{dealer.business_name}</Typography>
      </Box>

      {/* Dealer Hero Card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Box display="flex" alignItems="flex-start" gap={3} flexWrap="wrap">
          <Avatar sx={{ width: 64, height: 64, bgcolor: TEAL, fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
            {dealer.business_name?.[0]}
          </Avatar>
          <Box flex={1} minWidth={200}>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={0.5}>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{dealer.business_name}</Typography>
              <Chip label={dealer.status} color={STATUS_COLORS[dealer.status]} size="small" sx={{ textTransform: 'capitalize' }} />
              <Chip label={dealer.dealer_code} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontWeight: 700 }} />
            </Box>
            <Box display="flex" gap={3} flexWrap="wrap">
              {dealer.contact_person && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Badge sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: 13, color: '#475569' }}>{dealer.contact_person}</Typography>
                </Box>
              )}
              {dealer.phone && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Phone sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: 13, color: '#475569' }}>{dealer.phone}</Typography>
                </Box>
              )}
              {dealer.email && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Email sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: 13, color: '#475569' }}>{dealer.email}</Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            {dealer.gst_number && <Chip label={`GST: ${dealer.gst_number}`} size="small" variant="outlined" />}
            {dealer.pan_number && <Chip label={`PAN: ${dealer.pan_number}`} size="small" variant="outlined" />}
          </Box>
        </Box>
      </Paper>

      {/* KPI Stat Cards */}
      {perfLoading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} sx={{ color: TEAL }} /></Box>
      ) : (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <KpiCard icon={<ShoppingCart />} label="Total Orders" value={perf.totalOrders ?? dealer.total_orders ?? 0} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard icon={<AttachMoney />} label="Total Revenue"
              value={`₹${Number(perf.totalRevenue ?? dealer.total_revenue ?? 0).toLocaleString('en-IN')}`}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard icon={<People />} label="Total Leads"
              value={perf.totalLeads ?? 0}
              color="#0ea5e9"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard icon={<TrendingUp />} label="Performance Score"
              value={dealer.performance_score ? `${dealer.performance_score}/100` : 'N/A'}
              color="#16a34a"
              sub={dealer.performance_score > 70 ? 'Good' : dealer.performance_score > 40 ? 'Average' : 'Needs Attention'}
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <Box sx={{ borderBottom: '1px solid #f1f5f9', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontSize: 13, fontWeight: 600 } }}>
            <Tab label="Dealer Profile" />
            <Tab label="Recent Orders" />
            <Tab label="Order Status Breakdown" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        {tab === 0 && (
          <Box p={3}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                  Business Info
                </Typography>
                <InfoRow label="Business Name" value={dealer.business_name} />
                <InfoRow label="Contact Person" value={dealer.contact_person} />
                <InfoRow label="Email" value={dealer.email} />
                <InfoRow label="Phone" value={dealer.phone} />
                <InfoRow label="GST Number" value={dealer.gst_number} />
                <InfoRow label="PAN Number" value={dealer.pan_number} />
                <InfoRow label="Status" value={<Chip label={dealer.status} color={STATUS_COLORS[dealer.status]} size="small" />} />
                <InfoRow label="Member Since" value={dealer.created_at ? new Date(dealer.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                  Address
                </Typography>
                {(dealer.addresses || []).map((addr, i) => (
                  <Box key={i} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', mb: 1 }}>
                    <Typography sx={{ fontSize: 13, color: '#334155' }}>{addr.address_line1}</Typography>
                    {addr.address_line2 && <Typography sx={{ fontSize: 12, color: '#64748b' }}>{addr.address_line2}</Typography>}
                    <Typography sx={{ fontSize: 12, color: '#64748b' }}>{addr.city}, {addr.state} — {addr.pincode}</Typography>
                    {addr.is_primary && <Chip label="Primary" size="small" sx={{ mt: 0.5, bgcolor: `${TEAL}15`, color: TEAL, fontWeight: 700, height: 18, fontSize: 10 }} />}
                  </Box>
                ))}
                {(!dealer.addresses || dealer.addresses.length === 0) && (
                  <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>No address on file</Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Recent Orders Tab */}
        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Order #', 'Customer / Model', 'Amount', 'Status', 'Date'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {perfLoading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} sx={{ color: TEAL }} /></TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No orders yet</TableCell></TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell><Chip label={o.order_number} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontSize: 11 }} /></TableCell>
                    <TableCell>
                      <Typography fontSize={13} fontWeight={600}>{o.customer_name || '—'}</Typography>
                      <Typography fontSize={11} color="text.secondary">{o.vehicle_model || ''}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#10b981' }}>₹{Number(o.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell><Chip label={o.status} color={ORDER_STATUS_COLORS[o.status] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: 12 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Order Status Breakdown */}
        {tab === 2 && (
          <Box p={3}>
            {perfLoading ? (
              <CircularProgress size={24} sx={{ color: TEAL }} />
            ) : (
              <Grid container spacing={2}>
                {(perf.orderStatus || []).map((s) => (
                  <Grid item xs={6} sm={4} md={3} key={s.status}>
                    <Box sx={{ p: 2, borderRadius: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{s.count}</Typography>
                      <Chip label={s.status} color={ORDER_STATUS_COLORS[s.status] || 'default'} size="small" sx={{ textTransform: 'capitalize', mt: 0.5 }} />
                    </Box>
                  </Grid>
                ))}
                {(!perf.orderStatus || perf.orderStatus.length === 0) && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary">No order data available.</Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
