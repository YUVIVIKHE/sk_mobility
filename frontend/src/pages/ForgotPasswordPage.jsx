import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { authAPI } from '../services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>Forgot Password</Typography>
          {sent ? (
            <Alert severity="success">If the email exists, a reset link has been sent.</Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required margin="normal" />
              <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }}>Send Reset Link</Button>
            </form>
          )}
          <Button component={RouterLink} to="/login" sx={{ mt: 2 }}>Back to Login</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
