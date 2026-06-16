import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, Alert, Skeleton, LinearProgress,
  Tooltip, IconButton, InputAdornment, DialogContentText,
} from '@mui/material';
import { Add, Edit, Delete, AccountBalance, CreditCard } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '../services';
import StatCard from '../components/StatCard';

const EMPTY_BANK = { bank_name:'', account_number:'', account_type:'current', balance:'', notes:'' };
const EMPTY_LOAN = { lender_name:'', loan_type:'bank', bank_account_id:'', principal_amount:'', outstanding_amount:'', interest_rate:'', emi_amount:'', emi_date:'', start_date:'', end_date:'', status:'active', notes:'' };

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

// ── Bank Account Dialog (Add + Edit) ─────────────────────────────────────────
function BankDialog({ open, onClose, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [form, setForm] = useState(EMPTY_BANK);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        bank_name: editItem.bank_name || '',
        account_number: editItem.account_number || '',
        account_type: editItem.account_type || 'current',
        balance: editItem.balance || '',
        notes: editItem.notes || '',
      } : EMPTY_BANK);
      setErrors({}); mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) => isEdit ? financeAPI.updateBankAccount(editItem.id, data) : financeAPI.createBankAccount(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setForm(EMPTY_BANK); onClose(); },
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const handleSubmit = () => {
    if (!form.bank_name.trim()) { setErrors({ bank_name: 'Required' }); return; }
    mut.mutate({ ...form, balance: Number(form.balance || 0) });
  };

  const handleClose = () => { setForm(EMPTY_BANK); setErrors({}); mut.reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={8}><TextField fullWidth label="Bank Name" value={form.bank_name} onChange={set('bank_name')} required error={!!errors.bank_name} helperText={errors.bank_name} placeholder="e.g. SBI, HDFC, ICICI" /></Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="Account Type" value={form.account_type} onChange={set('account_type')}>
              {['current','savings','overdraft'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Account Number" value={form.account_number} onChange={set('account_number')} /></Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Current Balance" type="number" value={form.balance} onChange={set('balance')}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes (optional)" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Failed. Try again.'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Account')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Loan Dialog (Add + Edit) ──────────────────────────────────────────────────
function LoanDialog({ open, onClose, bankAccounts, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [form, setForm] = useState(EMPTY_LOAN);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        lender_name: editItem.lender_name || '',
        loan_type: editItem.loan_type || 'bank',
        bank_account_id: editItem.bank_account_id || '',
        principal_amount: editItem.principal_amount || '',
        outstanding_amount: editItem.outstanding_amount || '',
        interest_rate: editItem.interest_rate || '',
        emi_amount: editItem.emi_amount || '',
        emi_date: editItem.emi_date || '',
        start_date: editItem.start_date ? editItem.start_date.slice(0,10) : '',
        end_date: editItem.end_date ? editItem.end_date.slice(0,10) : '',
        status: editItem.status || 'active',
        notes: editItem.notes || '',
      } : EMPTY_LOAN);
      setErrors({}); mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) => isEdit ? financeAPI.updateLoan(editItem.id, data) : financeAPI.createLoan(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setForm(EMPTY_LOAN); onClose(); },
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const handleSubmit = () => {
    const errs = {};
    if (!form.lender_name.trim()) errs.lender_name = 'Required';
    if (!form.principal_amount || Number(form.principal_amount) <= 0) errs.principal_amount = 'Enter valid amount';
    if (!form.outstanding_amount && form.outstanding_amount !== 0) errs.outstanding_amount = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({ ...form, bank_account_id: form.bank_account_id || null });
  };

  const handleClose = () => { setForm(EMPTY_LOAN); setErrors({}); mut.reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Loan / Debt' : 'Add Loan / Debt'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={8}><TextField fullWidth label="Lender Name" value={form.lender_name} onChange={set('lender_name')} required error={!!errors.lender_name} helperText={errors.lender_name} placeholder="e.g. SBI, HDFC, John Doe" /></Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="Loan Type" value={form.loan_type} onChange={set('loan_type')}>
              {['bank','personal','partner','other'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth select label="Linked Bank Account (optional)" value={form.bank_account_id} onChange={set('bank_account_id')}>
              <MenuItem value="">None</MenuItem>
              {(bankAccounts||[]).map(b => <MenuItem key={b.id} value={b.id}>{b.bank_name} ({b.account_type})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Principal Amount" type="number" value={form.principal_amount} onChange={set('principal_amount')} required error={!!errors.principal_amount} helperText={errors.principal_amount} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Outstanding Amount" type="number" value={form.outstanding_amount} onChange={set('outstanding_amount')} required error={!!errors.outstanding_amount} helperText={errors.outstanding_amount} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Interest Rate (%)" type="number" value={form.interest_rate} onChange={set('interest_rate')} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="EMI Amount" type="number" value={form.emi_amount} onChange={set('emi_amount')} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="EMI Date (day)" type="number" value={form.emi_date} onChange={set('emi_date')} placeholder="e.g. 5" inputProps={{ min:1, max:31 }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" value={form.start_date} onChange={set('start_date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="End Date" type="date" value={form.end_date} onChange={set('end_date')} InputLabelProps={{ shrink: true }} /></Grid>
          {isEdit && (
            <Grid item xs={12}>
              <TextField fullWidth select label="Status" value={form.status} onChange={set('status')}>
                <MenuItem value="active">🔴 Active</MenuItem>
                <MenuItem value="closed">✅ Closed (Fully Repaid)</MenuItem>
              </TextField>
            </Grid>
          )}
          <Grid item xs={12}><TextField fullWidth label="Notes (optional)" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Failed. Try again.'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Loan')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
export default function FinancePage() {
  const [tab, setTab] = useState(0);
  const [bankDialog, setBankDialog] = useState(false);
  const [editBank, setEditBank] = useState(null);
  const [deleteBank, setDeleteBank] = useState(null);
  const [loanDialog, setLoanDialog] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [deleteLoan, setDeleteLoan] = useState(null);

  const qc = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ['finance','stats'], queryFn: () => financeAPI.stats().then(r => r.data.data) });
  const { data: bankAccounts = [], isLoading: bLoading } = useQuery({ queryKey: ['finance','banks'], queryFn: () => financeAPI.bankAccounts().then(r => r.data.data) });
  const { data: loans = [], isLoading: lLoading } = useQuery({ queryKey: ['finance','loans'], queryFn: () => financeAPI.loans().then(r => r.data.data) });

  const delBankMut = useMutation({ mutationFn: (id) => financeAPI.deleteBankAccount(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setDeleteBank(null); } });
  const delLoanMut = useMutation({ mutationFn: (id) => financeAPI.deleteLoan(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setDeleteLoan(null); } });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Bank & Loans</Typography>
          <Typography variant="body2" color="#64748b">Track bank accounts, loans and outstanding debts</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AccountBalance />} onClick={() => { setEditBank(null); setBankDialog(true); }}>Add Bank Account</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditLoan(null); setLoanDialog(true); }}>Add Loan / Debt</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Total Bank Balance', value: `₹${Number(stats?.total_bank_balance||0).toLocaleString('en-IN')}`, icon: <AccountBalance sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Outstanding Loans', value: `₹${Number(stats?.total_outstanding_loans||0).toLocaleString('en-IN')}`, icon: <CreditCard sx={{ fontSize: 20 }} />, color: '#ef4444' },
          { title: 'Active Loans', value: stats?.active_loans || 0, icon: <CreditCard sx={{ fontSize: 20 }} />, color: '#f59e0b' },
          { title: 'Monthly EMI Total', value: `₹${Number(stats?.monthly_emi_total||0).toLocaleString('en-IN')}`, icon: <CreditCard sx={{ fontSize: 20 }} />, color: '#8b5cf6' },
        ].map(s => <Grid item xs={12} sm={6} md={3} key={s.title}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Tab label="Bank Accounts" />
          <Tab label="Loans & Debts" />
        </Tabs>

        {/* Bank Accounts Tab */}
        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {bLoading ? <Box p={3}><Skeleton height={48} /><Skeleton height={48} /></Box> : (
              <Table>
                <TableHead><TableRow>{['Bank Name','Type','Account Number','Balance','Notes','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {bankAccounts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>No bank accounts added yet.</TableCell></TableRow>
                  ) : bankAccounts.map(b => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{b.bank_name}</TableCell>
                      <TableCell><Chip label={b.account_type} size="small" variant="outlined" /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#64748b' }}>{b.account_number || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#10b981', fontSize: '15px' }}>₹{Number(b.balance||0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{b.notes || '—'}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditBank(b); setBankDialog(true); }} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteBank(b)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Delete fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bankAccounts.length > 0 && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total Balance</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#10b981', fontSize: '16px' }}>₹{bankAccounts.reduce((s,b) => s + parseFloat(b.balance||0), 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Loans Tab */}
        {tab === 1 && (
          <Box sx={{ overflowX: 'auto' }}>
            {lLoading ? <Box p={3}><Skeleton height={48} /><Skeleton height={48} /></Box> : (
              <Table>
                <TableHead><TableRow>{['Lender','Type','Principal','Outstanding','Interest','EMI / Date','Status','Repaid','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {loans.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>No loans added yet.</TableCell></TableRow>
                  ) : loans.map(l => {
                    const repaidPct = l.principal_amount > 0
                      ? Math.min(100, ((l.principal_amount - l.outstanding_amount) / l.principal_amount) * 100)
                      : 0;
                    return (
                      <TableRow key={l.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{l.lender_name}</TableCell>
                        <TableCell><Chip label={l.loan_type} size="small" variant="outlined" /></TableCell>
                        <TableCell>₹{Number(l.principal_amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(l.outstanding_amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell>{l.interest_rate ? `${l.interest_rate}%` : '—'}</TableCell>
                        <TableCell>{l.emi_amount ? `₹${Number(l.emi_amount).toLocaleString('en-IN')}` : '—'}{l.emi_date ? ` / ${l.emi_date}th` : ''}</TableCell>
                        <TableCell><Chip label={l.status} size="small" color={l.status === 'active' ? 'error' : 'success'} /></TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Tooltip title={`${repaidPct.toFixed(1)}% repaid`}>
                            <Box>
                              <LinearProgress variant="determinate" value={repaidPct} sx={{ height: 6, borderRadius: 3, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                              <Typography variant="caption" color="#64748b">{repaidPct.toFixed(0)}%</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Edit / Update Outstanding"><IconButton size="small" onClick={() => { setEditLoan(l); setLoanDialog(true); }} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}><Edit fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteLoan(l)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Delete fontSize="small" /></IconButton></Tooltip>
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
      </Paper>

      <BankDialog open={bankDialog} onClose={() => { setBankDialog(false); setEditBank(null); }} editItem={editBank} />
      <LoanDialog open={loanDialog} onClose={() => { setLoanDialog(false); setEditLoan(null); }} bankAccounts={bankAccounts} editItem={editLoan} />
      <ConfirmDialog open={!!deleteBank} onClose={() => setDeleteBank(null)} onConfirm={() => delBankMut.mutate(deleteBank.id)} title="Delete Bank Account?" message={`Delete "${deleteBank?.bank_name}" account permanently?`} loading={delBankMut.isPending} />
      <ConfirmDialog open={!!deleteLoan} onClose={() => setDeleteLoan(null)} onConfirm={() => delLoanMut.mutate(deleteLoan.id)} title="Delete Loan?" message={`Delete loan from "${deleteLoan?.lender_name}" permanently?`} loading={delLoanMut.isPending} />
    </Box>
  );
}
