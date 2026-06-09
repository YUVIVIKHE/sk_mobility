import { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardMedia, Chip, CircularProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert,
  IconButton, Tooltip,
} from '@mui/material';
import { Add, DirectionsCar, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesAPI } from '../services';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';
import { getUploadUrl } from '../utils/media';
import { parseVehicleDescription, buildVehiclePayload } from '../utils/vehicleForm';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'LPG', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'];

const emptyForm = {
  categoryId: '',
  name: '',
  brand: 'SK Mobility',
  description: '',
  basePrice: '',
  modelYear: '',
  fuelType: '',
  transmission: '',
  engineCc: '',
  seatingCapacity: '',
};

export default function VehiclesPage() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesAPI.list().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['vehicle-categories'],
    queryFn: () => vehiclesAPI.categories().then((r) => r.data.data),
    enabled: isAdmin,
  });

  const isEditing = Boolean(editingId);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setEditingId(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload, file }) => {
      if (id) {
        const { data: res } = await vehiclesAPI.update(id, payload);
        if (file) await vehiclesAPI.uploadImage(id, file, true);
        return res;
      }
      const { data: res } = await vehiclesAPI.create(payload);
      if (file) await vehiclesAPI.uploadImage(res.data.id, file);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      closeDialog();
    },
    onError: (err) => setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} vehicle`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vehiclesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setDeleteTarget(null);
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to delete vehicle'),
  });

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (vehicle) => {
    const parsed = parseVehicleDescription(vehicle.description);
    setEditingId(vehicle.id);
    setForm({
      categoryId: vehicle.category_id,
      name: vehicle.name,
      brand: vehicle.brand || 'SK Mobility',
      description: parsed.description,
      basePrice: String(vehicle.base_price),
      modelYear: parsed.modelYear,
      fuelType: parsed.fuelType,
      transmission: parsed.transmission,
      engineCc: parsed.engineCc,
      seatingCapacity: parsed.seatingCapacity,
    });
    setImageFile(null);
    setImagePreview(getUploadUrl(vehicle.primary_image));
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.categoryId || !form.name || !form.basePrice) {
      setError('Category, name, and base price are required');
      return;
    }
    saveMutation.mutate({
      id: editingId,
      payload: buildVehiclePayload(form),
      file: imageFile,
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Vehicle Catalog</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add Vehicle
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {(data?.data || []).map((vehicle) => {
          const imageUrl = getUploadUrl(vehicle.primary_image);
          return (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative' }}>
                  {imageUrl ? (
                    <CardMedia component="img" height={200} image={imageUrl} alt={vehicle.name} sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ height: 200, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DirectionsCar sx={{ fontSize: 48, color: 'grey.400' }} />
                    </Box>
                  )}
                  {isAdmin && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" sx={{ bgcolor: 'background.paper' }} onClick={() => openEditDialog(vehicle)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" sx={{ bgcolor: 'background.paper' }} color="error" onClick={() => setDeleteTarget(vehicle)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={600}>{vehicle.name}</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" my={1}>
                    <Chip label={vehicle.category_name} size="small" />
                    {vehicle.brand && <Chip label={vehicle.brand} size="small" variant="outlined" />}
                  </Box>
                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                    ₹{Number(vehicle.base_price).toLocaleString('en-IN')}
                  </Typography>
                  {vehicle.description && (
                    <Typography variant="body2" color="text.secondary" mt={1} noWrap>
                      {vehicle.description.split('\n')[0]}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Button variant="outlined" component="label" fullWidth sx={{ py: 2, borderStyle: 'dashed' }}>
                  {imageFile || imagePreview ? 'Change Image' : 'Upload Vehicle Image'}
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {imagePreview && (
                  <Box mt={2} textAlign="center">
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }} />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField select fullWidth required label="Category" value={form.categoryId} onChange={handleChange('categoryId')}>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Vehicle Name" value={form.name} onChange={handleChange('name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Brand / Make" value={form.brand} onChange={handleChange('brand')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={handleChange('description')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="number" label="Base Price (₹)" value={form.basePrice} onChange={handleChange('basePrice')} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Model Year" value={form.modelYear} onChange={handleChange('modelYear')} inputProps={{ min: 1990, max: 2030 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Fuel Type" value={form.fuelType} onChange={handleChange('fuelType')}>
                  <MenuItem value="">Select</MenuItem>
                  {FUEL_TYPES.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Transmission" value={form.transmission} onChange={handleChange('transmission')}>
                  <MenuItem value="">Select</MenuItem>
                  {TRANSMISSIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Engine Capacity (cc)" value={form.engineCc} onChange={handleChange('engineCc')} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Seating Capacity" value={form.seatingCapacity} onChange={handleChange('seatingCapacity')} inputProps={{ min: 1 }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Vehicle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will remove it from the catalog.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
