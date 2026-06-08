import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.resetPassword({ token: searchParams.get('token'), password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>Reset Password</Typography>
          {success ? <Alert severity="success">Password reset! Redirecting to login...</Alert> : (
            <form onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField fullWidth label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required margin="normal" inputProps={{ minLength: 8 }} />
              <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }}>Reset Password</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
