import { Box, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { servicesAPI } from '../services';

const statusColors = { requested: 'info', scheduled: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'error' };

export default function ServicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesAPI.list().then((r) => r.data),
  });

  const columns = [
    { field: 'request_number', headerName: 'Request #', width: 150 },
    { field: 'customer_name', headerName: 'Customer', flex: 1 },
    { field: 'customer_phone', headerName: 'Phone', width: 130 },
    { field: 'service_type', headerName: 'Type', width: 120 },
    { field: 'vehicle_name', headerName: 'Vehicle', flex: 1 },
    { field: 'vin_number', headerName: 'VIN', width: 140 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip label={p.value?.replace('_', ' ')} color={statusColors[p.value]} size="small" /> },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Service Management</Typography>
      <DataTable rows={(data?.data || []).map((s) => ({ id: s.id, ...s }))} columns={columns} loading={isLoading} />
    </Box>
  );
}
