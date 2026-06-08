import { Box, Typography, List, ListItem, ListItemText, IconButton, Chip, Button } from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../services';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.list().then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700}>Notifications</Typography>
        <Button onClick={() => markAllRead.mutate()}>Mark All Read</Button>
      </Box>
      <List>
        {(data?.data || []).map((n) => (
          <ListItem key={n.id} sx={{ bgcolor: n.is_read ? 'transparent' : 'action.hover', mb: 1, borderRadius: 2 }}
            secondaryAction={!n.is_read && (
              <IconButton onClick={() => markRead.mutate(n.id)}><MarkEmailRead /></IconButton>
            )}>
            <ListItemText
              primary={<Box display="flex" alignItems="center" gap={1}>{n.title} <Chip label={n.type} size="small" /></Box>}
              secondary={<>{n.message}<br /><Typography variant="caption">{new Date(n.created_at).toLocaleString('en-IN')}</Typography></>}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
