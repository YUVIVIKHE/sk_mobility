import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { dashboardAPI } from '../services';

const reports = [
  { type: 'sales', title: 'Sales Report', desc: 'Order and sales data' },
  { type: 'revenue', title: 'Revenue Report', desc: 'Payment and revenue analytics' },
  { type: 'inventory', title: 'Inventory Report', desc: 'Stock levels across warehouses' },
  { type: 'leads', title: 'Lead Conversion', desc: 'Lead pipeline and conversion' },
  { type: 'dealers', title: 'Dealer Performance', desc: 'Dealer rankings and metrics' },
];

export default function ReportsPage() {
  const handleExport = async (type, format) => {
    const response = await dashboardAPI.exportReport(type, format);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-report.${format === 'csv' ? 'csv' : 'xlsx'}`;
    link.click();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Reports & Analytics</Typography>
      <Grid container spacing={3}>
        {reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.type}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>{report.title}</Typography>
                <Typography color="text.secondary" variant="body2" mb={2}>{report.desc}</Typography>
                <Box display="flex" gap={1}>
                  <Button size="small" variant="contained" startIcon={<Download />} onClick={() => handleExport(report.type, 'xlsx')}>Excel</Button>
                  <Button size="small" variant="outlined" startIcon={<Download />} onClick={() => handleExport(report.type, 'csv')}>CSV</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
