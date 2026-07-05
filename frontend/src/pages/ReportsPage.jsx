import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Divider, Alert, Chip, CircularProgress, Paper, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import { Download, BarChart, Preview } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services';

const TEAL = '#0d9488';

const REPORT_TYPES = [
  {
    type: 'sales',
    title: 'Sales Report',
    desc: 'All order and delivery data by dealer',
    icon: '🛵',
    color: '#10b981',
  },
  {
    type: 'revenue',
    title: 'Revenue Report',
    desc: 'Payments, methods, and amounts collected',
    icon: '💰',
    color: '#f59e0b',
  },
  {
    type: 'inventory',
    title: 'Inventory Report',
    desc: 'Stock levels across all warehouses',
    icon: '📦',
    color: '#0ea5e9',
  },
  {
    type: 'leads',
    title: 'Lead Conversion',
    desc: 'Lead pipeline, sources, and conversion rates',
    icon: '🎯',
    color: '#8b5cf6',
  },
  {
    type: 'dealers',
    title: 'Dealer Performance',
    desc: 'Ranking by revenue, orders, and score',
    icon: '🏆',
    color: '#ef4444',
  },
];

// Quick preview data fetched inline per report type
function ReportPreview({ type, dateFrom, dateTo }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-preview', type, dateFrom, dateTo],
    queryFn: () =>
      dashboardAPI.exportReport(type, 'csv', { from: dateFrom, to: dateTo })
        .then((r) => {
          // Parse first 6 rows of CSV for preview
          const text = new TextDecoder().decode(r.data);
          const lines = text.split('\n').filter(Boolean);
          const headers = lines[0]?.split(',').map((h) => h.replace(/"/g, '').trim());
          const rows = lines.slice(1, 7).map((l) =>
            l.split(',').map((v) => v.replace(/"/g, '').trim())
          );
          return { headers, rows, totalRows: lines.length - 1 };
        }),
    enabled: Boolean(type),
    staleTime: 60000,
  });

  if (isLoading) return <Box py={3} textAlign="center"><CircularProgress size={20} sx={{ color: TEAL }} /></Box>;
  if (isError || !data?.headers) return <Alert severity="warning" sx={{ mt: 1 }}>Preview unavailable</Alert>;

  return (
    <Box mt={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Preview — first {Math.min(data.rows.length, 6)} of {data.totalRows} rows
        </Typography>
        <Chip label={`${data.totalRows} rows`} size="small" sx={{ bgcolor: `${TEAL}15`, color: TEAL, fontWeight: 700 }} />
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 200, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {data.headers.map((h) => (
                <TableCell key={h} sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em', bgcolor: '#f8fafc', py: 0.75 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row, i) => (
              <TableRow key={i} hover>
                {row.map((cell, j) => (
                  <TableCell key={j} sx={{ fontSize: 11, py: 0.5, maxWidth: 140 }}>
                    <Typography noWrap fontSize={11}>{cell || '—'}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [previewType, setPreviewType] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const handleExport = async (type, format) => {
    setDownloading(`${type}-${format}`);
    setError('');
    try {
      const response = await dashboardAPI.exportReport(type, format, { from: dateFrom, to: dateTo });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${dateFrom}-to-${dateTo}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Export failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Reports & Analytics</Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.25 }}>Export and preview business data with date range filters</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Date Range Filter */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', mb: 1.5 }}>Date Range Filter</Typography>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="From Date" type="date" size="small" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="To Date" type="date" size="small" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <Box display="flex" gap={1} flexWrap="wrap">
            {[
              { label: 'This Month', from: firstOfMonth, to: today },
              { label: 'Last 3 Months', from: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0], to: today },
              { label: 'This Year', from: `${new Date().getFullYear()}-01-01`, to: today },
            ].map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                size="small"
                onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                sx={{ cursor: 'pointer', bgcolor: dateFrom === p.from && dateTo === p.to ? `${TEAL}15` : '#f1f5f9', color: dateFrom === p.from && dateTo === p.to ? TEAL : '#475569', fontWeight: 600 }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Report Cards */}
      <Grid container spacing={2.5}>
        {REPORT_TYPES.map((report) => (
          <Grid item xs={12} md={6} key={report.type}>
            <Card sx={{ borderRadius: 2, border: '1px solid #f1f5f9', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                {/* Card header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '10px',
                      bgcolor: `${report.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {report.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{report.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{report.desc}</Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<Preview sx={{ fontSize: 14 }} />}
                    onClick={() => setPreviewType(previewType === report.type ? null : report.type)}
                    sx={{ fontSize: 12, color: previewType === report.type ? TEAL : '#64748b', borderColor: previewType === report.type ? TEAL : '#e2e8f0', border: '1px solid' }}
                  >
                    {previewType === report.type ? 'Hide' : 'Preview'}
                  </Button>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Export buttons */}
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={downloading === `${report.type}-xlsx` ? <CircularProgress size={12} color="inherit" /> : <Download sx={{ fontSize: 14 }} />}
                    disabled={Boolean(downloading)}
                    onClick={() => handleExport(report.type, 'xlsx')}
                    sx={{ bgcolor: report.color, '&:hover': { filter: 'brightness(0.9)', bgcolor: report.color }, fontSize: 12, flex: 1 }}
                  >
                    Excel (.xlsx)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={downloading === `${report.type}-csv` ? <CircularProgress size={12} color="inherit" /> : <Download sx={{ fontSize: 14 }} />}
                    disabled={Boolean(downloading)}
                    onClick={() => handleExport(report.type, 'csv')}
                    sx={{ fontSize: 12, flex: 1, borderColor: report.color, color: report.color }}
                  >
                    CSV (.csv)
                  </Button>
                </Box>

                {/* Inline preview */}
                {previewType === report.type && (
                  <ReportPreview type={report.type} dateFrom={dateFrom} dateTo={dateTo} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
