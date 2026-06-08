import { useState } from 'react';
import { Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Grid } from '@mui/material';
import { Add, CheckCircle, Cancel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { dealersAPI } from '../services';

const statusColors = { pending: 'warning', approved: 'success', rejected: 'error', suspended: 'default', inactive: 'default' };

const emptyForm = {
  businessName: '',
  contactPerson: '',
  email: '',
  phone: '',
  gstNumber: '',
  panNumber: '',
  address: { line1: '', line2: '', city: '', state: '', pincode: '' },
};

export default function DealersPage() {
  const [approveDialog, setApproveDialog] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dealers'],
    queryFn: () => dealersAPI.list().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => dealersAPI.approve(id, { status, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['dealers']);
      setApproveDialog(null);
      setNotes('');
      if (res.data?.data?.defaultPassword) {
        setSuccessMsg(`Dealer approved. Login: ${res.data.data.email} / ${res.data.data.defaultPassword}`);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: () => dealersAPI.create(form),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['dealers']);
      setAddDialog(false);
      setForm(emptyForm);
      const d = res.data?.data;
      setSuccessMsg(`Dealer created. Login: ${d?.email} / ${d?.defaultPassword || 'Dealer@123'}`);
    },
  });

  const columns = [
    { field: 'dealer_code', headerName: 'Code', width: 130 },
    { field: 'business_name', headerName: 'Business Name', flex: 1 },
    { field: 'contact_person', headerName: 'Contact', width: 150 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (p) => <Chip label={p.value} color={statusColors[p.value]} size="small" />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 180,
      renderCell: (p) => p.row.status === 'pending' && (
        <Box>
          <Button size="small" startIcon={<CheckCircle />} color="success" onClick={() => setApproveDialog({ id: p.row.id, status: 'approved' })}>Approve</Button>
          <Button size="small" startIcon={<Cancel />} color="error" onClick={() => setApproveDialog({ id: p.row.id, status: 'rejected' })}>Reject</Button>
        </Box>
      ),
    },
  ];

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const updateAddress = (field, value) => setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Dealer Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialog(true)}>Add Dealer</Button>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      <DataTable rows={(data?.data || []).map((d) => ({ id: d.id, ...d }))} columns={columns} loading={isLoading} />

      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Dealer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Business Name" required value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Contact Person" required value={form.contactPerson} onChange={(e) => updateForm('contactPerson', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Email (login)" type="email" required value={form.email} onChange={(e) => updateForm('email', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" required value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="GST Number" value={form.gstNumber} onChange={(e) => updateForm('gstNumber', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="PAN Number" value={form.panNumber} onChange={(e) => updateForm('panNumber', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address Line 1" value={form.address.line1} onChange={(e) => updateAddress('line1', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="City" value={form.address.city} onChange={(e) => updateAddress('city', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="State" value={form.address.state} onChange={(e) => updateAddress('state', e.target.value)} /></Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>Default login password: Dealer@123</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Create Dealer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(approveDialog)} onClose={() => setApproveDialog(null)}>
        <DialogTitle>{approveDialog?.status === 'approved' ? 'Approve Dealer' : 'Reject Dealer'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Notes" multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} margin="normal" />
          {approveDialog?.status === 'approved' && (
            <Alert severity="info">A login account will be created with default password Dealer@123</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(null)}>Cancel</Button>
          <Button variant="contained" color={approveDialog?.status === 'approved' ? 'success' : 'error'}
            onClick={() => approveMutation.mutate(approveDialog)} disabled={approveMutation.isPending}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
