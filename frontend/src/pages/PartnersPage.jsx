import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, Alert, Skeleton, IconButton,
  Tooltip, InputAdornment, DialogContentText,
} from '@mui/material';
import { Add, Edit, Delete, Handshake, TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersAPI } from '../services';
import StatCard from '../components/StatCard';

const PARTNER_TYPES = ['partner','investor','supplier','other'];
const EMPTY_PARTNER = { name:'', type:'partner', phone:'', email:'', notes:'' };
const EMPTY_TX = () => ({ partner_id:'', type:'given', amount:'', date: new Date().toISOString().slice(0,10), description:'' });

function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700} color="error.main">{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} sx={{ minWidth: 100 }}>{loading ? 'Deleting...' : 'Delete'}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Partner Dialog (Add + Edit) ───────────────────────────────────────────────
function PartnerDialog({ open, onClose, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [form, setForm] = useState(EMPTY_PARTNER);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(isEdit ? { name: editItem.name||'', type: editItem.type||'partner', phone: editItem.phone||'', email: editItem.email||'', notes: editItem.notes||'' } : EMPTY_PARTNER);
      setErrors({}); mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) => isEdit ? partnersAPI.update(editItem.id, data) : partnersAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setForm(EMPTY_PARTNER); onClose(); },
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const handleSubmit = () => {
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    mut.mutate(form);
  };

  const handleClose = () => { setForm(EMPTY_PARTNER); setErrors({}); mut.reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={8}><TextField fullWidth label="Partner Name" value={form.name} onChange={set('name')} required error={!!errors.name} helperText={errors.name} /></Grid>
          <Grid item xs={4}><TextField fullWidth select label="Type" value={form.type} onChange={set('type')}>{PARTNER_TYPES.map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Failed. Try again.'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Partner')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Transaction Dialog (Add + Edit) ──────────────────────────────────────────
function TransactionDialog({ open, onClose, partners, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [form, setForm] = useState(EMPTY_TX());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        partner_id: editItem.partner_id || '',
        type: editItem.type || 'given',
        amount: editItem.amount || '',
        date: editItem.date ? editItem.date.slice(0,10) : new Date().toISOString().slice(0,10),
        description: editItem.description || '',
      } : EMPTY_TX());
      setErrors({}); mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) => isEdit ? partnersAPI.updateTransaction(editItem.id, data) : partnersAPI.createTransaction(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setForm(EMPTY_TX()); onClose(); },
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const handleSubmit = () => {
    const errs = {};
    if (!form.partner_id) errs.partner_id = 'Select a partner';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter valid amount';
    if (!form.date) errs.date = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({ ...form, amount: Number(form.amount) });
  };

  const handleClose = () => { setForm(EMPTY_TX()); setErrors({}); mut.reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Transaction' : 'Record Transaction'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <TextField fullWidth select label="Partner" value={form.partner_id} onChange={set('partner_id')} required error={!!errors.partner_id} helperText={errors.partner_id}>
              {(partners||[]).length === 0 ? <MenuItem disabled>No partners</MenuItem> : (partners||[]).map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.type})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Type" value={form.type} onChange={set('type')}>
              <MenuItem value="given">💸 Money Given (to partner)</MenuItem>
              <MenuItem value="received">💰 Money Received (from partner)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Amount" type="number" value={form.amount} onChange={set('amount')} required error={!!errors.amount} helperText={errors.amount} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Date" type="date" value={form.date} onChange={set('date')} InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Description" value={form.description} onChange={set('description')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Failed. Try again.'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 140 }}>
          {mut.isPending ? (isEdit ? 'Saving...' : 'Recording...') : (isEdit ? 'Save Changes' : 'Save Transaction')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Partners Page ────────────────────────────────────────────────────────
export default function PartnersPage() {
  const [tab, setTab] = useState(0);
  const [partnerDialog, setPartnerDialog] = useState(false);
  const [editPartner, setEditPartner] = useState(null);
  const [deletePartner, setDeletePartner] = useState(null);
  const [txDialog, setTxDialog] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);

  const qc = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ['partners','stats'], queryFn: () => partnersAPI.stats().then(r => r.data.data) });
  const { data: partners = [], isLoading: pLoading } = useQuery({ queryKey: ['partners','list'], queryFn: () => partnersAPI.list().then(r => r.data.data) });
  const { data: txData, isLoading: tLoading } = useQuery({ queryKey: ['partners','transactions'], queryFn: () => partnersAPI.allTransactions().then(r => r.data) });
  const transactions = txData?.data || [];

  const delPartnerMut = useMutation({ mutationFn: (id) => partnersAPI.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setDeletePartner(null); } });
  const delTxMut = useMutation({ mutationFn: (id) => partnersAPI.deleteTransaction(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setDeleteTx(null); } });

  const netBalance = parseFloat(stats?.net_balance || 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Partner Transactions</Typography>
          <Typography variant="body2" color="#64748b">Track money given/received from business partners</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Handshake />} onClick={() => { setEditPartner(null); setPartnerDialog(true); }}>Add Partner</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTx(null); setTxDialog(true); }}>Record Transaction</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Total Partners', value: stats?.total_partners || 0, icon: <Handshake sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'Total Given', value: `₹${Number(stats?.total_given||0).toLocaleString('en-IN')}`, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: '#ef4444' },
          { title: 'Total Received', value: `₹${Number(stats?.total_received||0).toLocaleString('en-IN')}`, icon: <TrendingDown sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Net Balance', value: `₹${Math.abs(netBalance).toLocaleString('en-IN')}`, icon: <AccountBalance sx={{ fontSize: 20 }} />, color: netBalance >= 0 ? '#10b981' : '#ef4444', subtitle: netBalance >= 0 ? 'In your favour' : 'You owe' },
        ].map(s => <Grid item xs={12} sm={6} md={3} key={s.title}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Tab label="Partners" />
          <Tab label="All Transactions" />
        </Tabs>

        {/* Partners Tab */}
        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {pLoading ? <Box p={3}><Skeleton height={48} /><Skeleton height={48} /></Box> : (
              <Table>
                <TableHead><TableRow>{['Name','Type','Phone','Total Given','Total Received','Net','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {partners.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>No partners yet. Add your first partner.</TableCell></TableRow>
                  ) : partners.map(p => {
                    const net = parseFloat(p.total_received) - parseFloat(p.total_given);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell><Chip label={p.type} size="small" variant="outlined" /></TableCell>
                        <TableCell>{p.phone || '—'}</TableCell>
                        <TableCell sx={{ color: '#ef4444' }}>₹{Number(p.total_given).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ color: '#10b981' }}>₹{Number(p.total_received).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: net >= 0 ? '#10b981' : '#ef4444' }}>{net >= 0 ? '+' : '-'}₹{Math.abs(net).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditPartner(p); setPartnerDialog(true); }} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}><Edit fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeletePartner(p)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Delete fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Transactions Tab */}
        {tab === 1 && (
          <Box sx={{ overflowX: 'auto' }}>
            {tLoading ? <Box p={3}><Skeleton height={48} /><Skeleton height={48} /></Box> : (
              <Table>
                <TableHead><TableRow>{['Date','Partner','Type','Amount','Description','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>No transactions yet.</TableCell></TableRow>
                  ) : transactions.map(tx => (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(tx.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tx.partner_name}</TableCell>
                      <TableCell>
                        <Chip label={tx.type === 'given' ? '💸 Given' : '💰 Received'} size="small"
                          sx={{ bgcolor: tx.type === 'given' ? '#fef2f2' : '#f0fdf4', color: tx.type === 'given' ? '#ef4444' : '#10b981', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: tx.type === 'given' ? '#ef4444' : '#10b981' }}>
                        {tx.type === 'given' ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>{tx.description || '—'}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditTx(tx); setTxDialog(true); }} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTx(tx)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Delete fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>

      <PartnerDialog open={partnerDialog} onClose={() => { setPartnerDialog(false); setEditPartner(null); }} editItem={editPartner} />
      <TransactionDialog open={txDialog} onClose={() => { setTxDialog(false); setEditTx(null); }} partners={partners} editItem={editTx} />
      <ConfirmDialog open={!!deletePartner} onClose={() => setDeletePartner(null)} onConfirm={() => delPartnerMut.mutate(deletePartner.id)} title="Delete Partner?" message={`Delete "${deletePartner?.name}"? All their transactions will also be deleted.`} loading={delPartnerMut.isPending} />
      <ConfirmDialog open={!!deleteTx} onClose={() => setDeleteTx(null)} onConfirm={() => delTxMut.mutate(deleteTx.id)} title="Delete Transaction?" message={`Delete this ₹${Number(deleteTx?.amount||0).toLocaleString('en-IN')} transaction permanently?`} loading={delTxMut.isPending} />
    </Box>
  );
}
