import { Box, Typography, Card, CardContent, TextField, Button, Alert, Chip, Grid } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authAPI, dealersAPI } from '../services';
import { useAuth, isDealer } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const dealerUser = isDealer(user);
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  const { data: dealerProfile } = useQuery({
    queryKey: ['dealer-me'],
    queryFn: () => dealersAPI.me().then((r) => r.data.data),
    enabled: dealerUser,
  });

  const updateMutation = useMutation({
    mutationFn: () => authAPI.updateProfile(form),
    onSuccess: () => setMessage('Profile updated successfully'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authAPI.changePassword(passwordForm),
    onSuccess: () => { setMessage('Password changed successfully'); setPasswordForm({ currentPassword: '', newPassword: '' }); },
  });

  const dealer = user?.dealer || dealerProfile;

  return (
    <Box maxWidth={600}>
      <Typography variant="h4" fontWeight={700} mb={3}>Profile Settings</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      {dealerUser && dealer && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Dealer Account</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Business</Typography><Typography fontWeight={600}>{dealer.business_name}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Dealer Code</Typography><Typography fontWeight={600}>{dealer.dealer_code}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Status</Typography><Chip label={dealer.status} color={dealer.status === 'approved' ? 'success' : 'warning'} size="small" /></Grid>
              {dealer.gst_number && <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">GST</Typography><Typography>{dealer.gst_number}</Typography></Grid>}
            </Grid>
          </CardContent>
        </Card>
      )}

      {dealerUser && !dealer && (
        <Alert severity="warning" sx={{ mb: 3 }}>Your login is not linked to a dealer profile. Contact admin to approve or create your dealer account.</Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Personal Information</Typography>
          <TextField fullWidth label="Email" value={user?.email || ''} disabled margin="normal" />
          <TextField fullWidth label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} margin="normal" />
          <TextField fullWidth label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} margin="normal" />
          <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} margin="normal" />
          <Button variant="contained" onClick={() => updateMutation.mutate()} sx={{ mt: 2 }}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Change Password</Typography>
          <TextField fullWidth label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} margin="normal" />
          <TextField fullWidth label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} margin="normal" />
          <Button variant="contained" onClick={() => passwordMutation.mutate()} sx={{ mt: 2 }}>Change Password</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
