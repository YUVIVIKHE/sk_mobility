import { Box, Grid, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import { Store, DirectionsCar, AttachMoney, People, Build, Inventory2 } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { dashboardAPI } from '../services';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const statusColors = {
  pending: 'warning', approved: 'info', processing: 'primary',
  shipped: 'secondary', delivered: 'success', cancelled: 'error',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', isAdmin ? 'admin' : 'dealer'],
    queryFn: () => (isAdmin ? dashboardAPI.admin() : dashboardAPI.dealer()).then((r) => r.data.data),
  });

  if (isLoading) {
    return <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>;
  }

  if (isError && !isAdmin) {
    const msg = error?.response?.data?.message || 'Unable to load dealer dashboard';
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>Dealer Dashboard</Typography>
        <Alert severity="error">{msg}. Ask admin to link your dealer profile or approve your registration.</Alert>
      </Box>
    );
  }

  const stats = data?.stats || {};

  const chartData = {
    labels: data?.monthlySales?.map((m) => m.month) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: data?.monthlySales?.map((m) => m.revenue) || [],
      borderColor: '#0D47A1',
      backgroundColor: 'rgba(13, 71, 161, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const orderColumns = [
    { field: 'order_number', headerName: 'Order #', flex: 1 },
    { field: 'business_name', headerName: 'Dealer', flex: 1 },
    { field: 'total_amount', headerName: 'Amount', flex: 1, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    {
      field: 'status', headerName: 'Status', flex: 1,
      renderCell: (params) => <Chip label={params.value} color={statusColors[params.value] || 'default'} size="small" />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        {isAdmin ? 'Super Admin Dashboard' : 'Dealer Dashboard'}
      </Typography>

      <Grid container spacing={3} mb={3}>
        {isAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Total Dealers" value={stats.total_dealers || 0} icon={<Store />} color="#0D47A1" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Vehicles Sold" value={stats.total_vehicles_sold || 0} icon={<DirectionsCar />} color="#009624" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Total Revenue" value={`₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`} icon={<AttachMoney />} color="#ED6C02" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Total Leads" value={stats.total_leads || 0} icon={<People />} color="#0288D1" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Service Requests" value={stats.service_requests || 0} icon={<Build />} color="#7B1FA2" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Low Stock Items" value={stats.low_stock_items || 0} icon={<Inventory2 />} color="#D32F2F" />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="My Orders" value={stats.total_orders || 0} icon={<DirectionsCar />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Revenue" value={`₹${Number(stats.revenue || 0).toLocaleString('en-IN')}`} icon={<AttachMoney />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Leads" value={stats.total_leads || 0} icon={<People />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Service Requests" value={stats.service_requests || 0} icon={<Build />} />
            </Grid>
          </>
        )}
      </Grid>

      {isAdmin && data?.monthlySales?.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Monthly Sales Trend</Typography>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Paper>
      )}

      {isAdmin && data?.recentOrders && (
        <DataTable
          title="Recent Orders"
          rows={data.recentOrders.map((o, i) => ({ id: i, ...o }))}
          columns={orderColumns}
        />
      )}
    </Box>
  );
}
