import { Box, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { inventoryAPI } from '../services';

export default function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryAPI.list().then((r) => r.data),
  });

  const columns = [
    { field: 'warehouse_name', headerName: 'Warehouse', flex: 1 },
    { field: 'vehicle_name', headerName: 'Vehicle', flex: 1 },
    { field: 'variant_name', headerName: 'Variant', flex: 1 },
    { field: 'sku', headerName: 'SKU', width: 120 },
    { field: 'quantity', headerName: 'Stock', width: 100 },
    { field: 'low_stock_threshold', headerName: 'Threshold', width: 100 },
    {
      field: 'is_low_stock', headerName: 'Status', width: 120,
      renderCell: (p) => <Chip label={p.value ? 'Low Stock' : 'In Stock'} color={p.value ? 'error' : 'success'} size="small" />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Inventory Management</Typography>
      <DataTable rows={(data?.data || []).map((i) => ({ id: i.id, ...i }))} columns={columns} loading={isLoading} />
    </Box>
  );
}
