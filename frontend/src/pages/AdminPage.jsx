import {
  Box, Typography, Tabs, Tab, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Alert, CircularProgress, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Switch, FormControlLabel, Tooltip, Avatar, Grid, Divider, Checkbox,
  FormGroup,
} from '@mui/material';
import {
  PersonAdd, Edit, Block, CheckCircle, Lock, AdminPanelSettings, ManageAccounts,
  Close, Security, Group,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services';

const TEAL = '#0d9488';

const ROLES = ['super_admin', 'dealer', 'service', 'hr', 'accountant'];
const ROLE_COLORS = {
  super_admin: 'error', dealer: 'primary', service: 'info',
  hr: 'secondary', accountant: 'warning',
};

function UserRow({ u, onEdit, onToggle }) {
  return (
    <TableRow hover>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: TEAL }}>
            {u.first_name?.[0]}{u.last_name?.[0]}
          </Avatar>
          <Box>
            <Typography fontSize={13} fontWeight={600}>{u.first_name} {u.last_name}</Typography>
            <Typography fontSize={11} color="text.secondary">{u.email}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={u.role_name || 'N/A'}
          color={ROLE_COLORS[u.role_name] || 'default'}
          size="small"
          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={u.is_active ? 'Active' : 'Inactive'}
          color={u.is_active ? 'success' : 'default'}
          size="small"
        />
      </TableCell>
      <TableCell sx={{ color: '#94a3b8', fontSize: 12 }}>
        {u.last_login_at ? new Date(u.last_login_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}
      </TableCell>
      <TableCell>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit User">
            <IconButton size="small" onClick={() => onEdit(u)} sx={{ color: TEAL }}>
              <Edit sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={u.is_active ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => onToggle(u)}
              sx={{ color: u.is_active ? '#ef4444' : '#16a34a' }}>
              {u.is_active ? <Block sx={{ fontSize: 15 }} /> : <CheckCircle sx={{ fontSize: 15 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [form, setForm] = useState({});
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users().then((r) => r.data.data || r.data),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminAPI.roles().then((r) => r.data.data || []),
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => adminAPI.permissions().then((r) => r.data.data || []),
    enabled: permOpen,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminAPI.auditLogs().then((r) => r.data.data || r.data),
    enabled: tab === 2,
  });

  const users = useMemo(() => (Array.isArray(usersData) ? usersData : []), [usersData]);
  const auditLogs = useMemo(() => (Array.isArray(auditData) ? auditData : []), [auditData]);

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const createMut = useMutation({
    mutationFn: (data) => adminAPI.createUser(data),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setCreateOpen(false); setForm({}); notify('User created successfully'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create user'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setEditOpen(false); setSelectedUser(null); notify('User updated'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to update user'),
  });

  const toggleMut = useMutation({
    mutationFn: (user) => adminAPI.updateUser(user.id, { isActive: !user.is_active }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); notify('User status updated'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to update status'),
  });

  const permMut = useMutation({
    mutationFn: ({ roleId, permIds }) => adminAPI.assignRolePermissions(roleId, permIds),
    onSuccess: () => { qc.invalidateQueries(['admin-roles']); setPermOpen(false); notify('Role permissions updated'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to save permissions'),
  });

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ firstName: user.first_name, lastName: user.last_name, roleId: user.role_id, email: user.email });
    setError('');
    setEditOpen(true);
  };

  const openPermDialog = (role) => {
    setSelectedRole(role);
    setSelectedPerms((role.permissions || []).map((p) => p.id || p));
    setPermOpen(true);
  };

  const togglePerm = (id) => {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Group permissions by module
  const permsByModule = useMemo(() => {
    return allPermissions.reduce((acc, p) => {
      const mod = p.module || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {});
  }, [allPermissions]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Admin Panel</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.25 }}>Manage users, roles, and system permissions</Typography>
        </Box>
        {tab === 0 && (
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => { setForm({}); setError(''); setCreateOpen(true); }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            Create User
          </Button>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid #f1f5f9', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontSize: 13, fontWeight: 600 } }}>
            <Tab label={<Box display="flex" alignItems="center" gap={1}><ManageAccounts sx={{ fontSize: 16 }} /> Users<Chip label={users.length} size="small" sx={{ height: 18, fontSize: 10 }} /></Box>} />
            <Tab label={<Box display="flex" alignItems="center" gap={1}><Security sx={{ fontSize: 16 }} /> Roles & Permissions</Box>} />
            <Tab label={<Box display="flex" alignItems="center" gap={1}><AdminPanelSettings sx={{ fontSize: 16 }} /> Audit Logs</Box>} />
          </Tabs>
        </Box>

        {/* Users Tab */}
        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['User', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} sx={{ color: TEAL }} /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No users found</TableCell></TableRow>
                ) : users.map((u) => (
                  <UserRow key={u.id} u={u} onEdit={openEdit} onToggle={(user) => toggleMut.mutate(user)} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Roles & Permissions Tab */}
        {tab === 1 && (
          <Box p={3}>
            <Grid container spacing={2}>
              {roles.map((role) => (
                <Grid item xs={12} md={6} lg={4} key={role.id}>
                  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #f1f5f9', borderRadius: '12px', height: '100%' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Group sx={{ fontSize: 16, color: TEAL }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{role.name?.replace(/_/g, ' ')}</Typography>
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{(role.permissions || []).length} permissions</Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Edit Permissions">
                        <IconButton size="small" onClick={() => openPermDialog(role)} sx={{ color: TEAL }}>
                          <Lock sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#64748b', mb: 1 }}>{role.description || 'System role'}</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(role.permissions || []).slice(0, 6).map((p) => (
                        <Chip key={p.id || p} label={typeof p === 'string' ? p : p.name} size="small"
                          sx={{ fontSize: 10, height: 18, bgcolor: '#f1f5f9', color: '#475569' }} />
                      ))}
                      {(role.permissions || []).length > 6 && (
                        <Chip label={`+${(role.permissions || []).length - 6} more`} size="small"
                          sx={{ fontSize: 10, height: 18, bgcolor: `${TEAL}15`, color: TEAL, fontWeight: 700 }} />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Audit Logs Tab */}
        {tab === 2 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['User', 'Action', 'Module', 'Entity', 'Time'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLoading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} sx={{ color: TEAL }} /></TableCell></TableRow>
                ) : auditLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No audit logs</TableCell></TableRow>
                ) : auditLogs.map((a, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 13 }}>{a.user_email}</TableCell>
                    <TableCell><Chip label={a.action} size="small" color={a.action === 'DELETE' ? 'error' : a.action === 'CREATE' ? 'success' : 'default'} sx={{ fontSize: 10 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#475569' }}>{a.module}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#64748b' }}>{a.entity_type}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#94a3b8' }}>{a.created_at ? new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Create User Dialog ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}><PersonAdd sx={{ color: TEAL }} /> Create New User</Box>
          <IconButton size="small" onClick={() => setCreateOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name *" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name *" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email *" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Role *" value={form.roleName || ''} onChange={(e) => setForm({ ...form, roleName: e.target.value })} size="small">
                {ROLES.map((r) => <MenuItem key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password *" type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} size="small" helperText="Minimum 8 characters" />
            </Grid>
          </Grid>
          <Alert severity="info" icon={false} sx={{ fontSize: 12 }}>
            The user will receive login credentials and can change their password on first login.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={createMut.isPending}
            onClick={() => {
              if (!form.firstName || !form.lastName || !form.email || !form.roleName || !form.password)
                return setError('All required fields must be filled');
              if (form.password.length < 8) return setError('Password must be at least 8 characters');
              createMut.mutate(form);
            }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {createMut.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}><Edit sx={{ color: TEAL }} /> Edit User</Box>
          <IconButton size="small" onClick={() => setEditOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="First Name" value={editForm.firstName || ''} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} size="small" />
          <TextField fullWidth label="Last Name" value={editForm.lastName || ''} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} size="small" />
          <TextField select fullWidth label="Role" value={editForm.roleName || editForm.roleId || ''} onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value })} size="small">
            {ROLES.map((r) => <MenuItem key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: selectedUser?.id, data: editForm })}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {updateMut.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Role Permissions Dialog ── */}
      <Dialog open={permOpen} onClose={() => setPermOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Lock sx={{ color: TEAL }} />
            Permissions for: <strong style={{ textTransform: 'capitalize' }}>{selectedRole?.name?.replace(/_/g, ' ')}</strong>
          </Box>
          <IconButton size="small" onClick={() => setPermOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {Object.keys(permsByModule).length === 0 ? (
            <Box textAlign="center" py={3}><CircularProgress size={24} sx={{ color: TEAL }} /></Box>
          ) : (
            <Grid container spacing={2}>
              {Object.entries(permsByModule).map(([module, perms]) => (
                <Grid item xs={12} sm={6} md={4} key={module}>
                  <Box sx={{ p: 1.5, border: '1px solid #f1f5f9', borderRadius: '10px' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em', mb: 1 }}>
                      {module}
                    </Typography>
                    <FormGroup>
                      {perms.map((p) => (
                        <FormControlLabel
                          key={p.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedPerms.includes(p.id)}
                              onChange={() => togglePerm(p.id)}
                              sx={{ '&.Mui-checked': { color: TEAL } }}
                            />
                          }
                          label={<Typography sx={{ fontSize: 12 }}>{p.name}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              {selectedPerms.length} permission{selectedPerms.length !== 1 ? 's' : ''} selected
            </Typography>
          </Box>
          <Button onClick={() => setPermOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={permMut.isPending}
            onClick={() => permMut.mutate({ roleId: selectedRole?.id, permIds: selectedPerms })}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {permMut.isPending ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
