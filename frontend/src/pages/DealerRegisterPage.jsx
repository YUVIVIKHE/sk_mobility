import { Box, Card, CardContent, TextField, Button, Typography, Alert, Grid } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealersAPI } from '../services';

export default function DealerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: '', contactPerson: '', email: '', phone: '', gstNumber: '', panNumber: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' },
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dealersAPI.register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Alert severity="success">Registration submitted! Awaiting admin approval. <Button onClick={() => navigate('/login')}>Go to Login</Button></Alert>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" py={4} px={2} bgcolor="background.default">
      <Card sx={{ maxWidth: 700, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>Dealer Registration - SK Mobility</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Business Name" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Person" required value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="PAN Number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Address Line 1" value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Pincode" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} /></Grid>
            </Grid>
            <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 3 }}>Submit Registration</Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
