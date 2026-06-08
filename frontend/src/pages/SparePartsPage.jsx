import { Box, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { sparePartsAPI } from '../services';

export default function SparePartsPage() {
  const { data: parts, isLoading } = useQuery({
    queryKey: ['spare-parts'],
    queryFn: () => sparePartsAPI.list().then((r) => r.data),
  });

  const { data: stock } = useQuery({
    queryKey: ['spare-stock'],
    queryFn: () => sparePartsAPI.stock().then((r) => r.data.data),
  });

  const partColumns = [
    { field: 'part_number', headerName: 'Part #', width: 130 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'category_name', headerName: 'Category', width: 130 },
    { field: 'unit_price', headerName: 'Price', width: 110, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
  ];

  const stockColumns = [
    { field: 'part_number', headerName: 'Part #', width: 130 },
    { field: 'part_name', headerName: 'Name', flex: 1 },
    { field: 'warehouse_name', headerName: 'Warehouse', flex: 1 },
    { field: 'quantity', headerName: 'Qty', width: 80 },
    { field: 'is_low_stock', headerName: 'Status', width: 120, renderCell: (p) => <Chip label={p.value ? 'Low' : 'OK'} color={p.value ? 'error' : 'success'} size="small" /> },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Spare Parts Management</Typography>
      <DataTable title="Parts Catalog" rows={(parts?.data || []).map((p) => ({ id: p.id, ...p }))} columns={partColumns} loading={isLoading} />
      <Box mt={3}>
        <DataTable title="Stock Levels" rows={(stock || []).map((s, i) => ({ id: i, ...s }))} columns={stockColumns} />
      </Box>
    </Box>
  );
}
