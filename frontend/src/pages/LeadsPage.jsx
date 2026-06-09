import { Box, Typography, Chip, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { leadsAPI } from '../services';

const statusColors = { new: 'info', contacted: 'default', interested: 'primary', test_drive: 'secondary', negotiation: 'warning', converted: 'success', lost: 'error' };

export default function LeadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsAPI.list().then((r) => r.data),
  });

  const columns = [
    { field: 'lead_number', headerName: 'Lead #', width: 150 },
    { field: 'customer_name', headerName: 'Customer', flex: 1 },
    { field: 'customer_phone', headerName: 'Phone', width: 130 },
    { field: 'source_name', headerName: 'Source', width: 120 },
    { field: 'vehicle_interest', headerName: 'Interest', flex: 1 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip label={p.value?.replace('_', ' ')} color={statusColors[p.value]} size="small" /> },
    { field: 'dealer_name', headerName: 'Dealer', flex: 1 },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700}>Lead Management</Typography>
      </Box>
      <DataTable rows={(data?.data || []).map((l) => ({ id: l.id, ...l }))} columns={columns} loading={isLoading} />
    </Box>
  );
}
