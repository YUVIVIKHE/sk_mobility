import { Box, Typography, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { adminAPI } from '../services';

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users().then((r) => r.data),
    enabled: tab === 0,
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminAPI.roles().then((r) => r.data.data),
    enabled: tab === 1,
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminAPI.auditLogs().then((r) => r.data),
    enabled: tab === 2,
  });

  const userColumns = [
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'first_name', headerName: 'First Name', width: 130 },
    { field: 'last_name', headerName: 'Last Name', width: 130 },
    { field: 'role_name', headerName: 'Role', width: 130 },
    { field: 'is_active', headerName: 'Active', width: 90, valueFormatter: (v) => (v ? 'Yes' : 'No') },
    { field: 'last_login_at', headerName: 'Last Login', width: 150, valueFormatter: (v) => v ? new Date(v).toLocaleString('en-IN') : '-' },
  ];

  const auditColumns = [
    { field: 'user_email', headerName: 'User', flex: 1 },
    { field: 'action', headerName: 'Action', width: 120 },
    { field: 'module', headerName: 'Module', width: 120 },
    { field: 'entity_type', headerName: 'Entity', width: 100 },
    { field: 'created_at', headerName: 'Time', width: 170, valueFormatter: (v) => new Date(v).toLocaleString('en-IN') },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>Admin Panel</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Users" />
        <Tab label="Roles & Permissions" />
        <Tab label="Audit Logs" />
      </Tabs>

      {tab === 0 && <DataTable rows={(users?.data || []).map((u) => ({ id: u.id, ...u }))} columns={userColumns} loading={usersLoading} />}
      {tab === 1 && (
        <Box>
          {(roles || []).map((role) => (
            <Box key={role.id} mb={2} p={2} bgcolor="background.paper" borderRadius={2}>
              <Typography variant="h6">{role.name}</Typography>
              <Typography variant="body2" color="text.secondary">{role.description}</Typography>
              <Typography variant="caption">{role.permissions?.length || 0} permissions assigned</Typography>
            </Box>
          ))}
        </Box>
      )}
      {tab === 2 && <DataTable rows={(auditLogs?.data || []).map((a) => ({ id: a.id, ...a }))} columns={auditColumns} loading={auditLoading} />}
    </Box>
  );
}
