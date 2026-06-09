import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Menu, MenuItem, Badge, Divider, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Store, DirectionsCar, ShoppingCart, Payment,
  Inventory, People, Build, Settings, Logout, Notifications, Receipt,
  AdminPanelSettings, Assessment, Handyman,
} from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { logout } from '../store/authSlice';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';
import { notificationsAPI } from '../services';

const DRAWER_WIDTH = 260;

const adminMenu = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Dealers', icon: <Store />, path: '/dealers' },
  { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
  { text: 'Payments', icon: <Payment />, path: '/payments' },
  { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
  { text: 'Leads', icon: <People />, path: '/leads' },
  { text: 'Services', icon: <Build />, path: '/services' },
  { text: 'Spare Parts', icon: <Handyman />, path: '/spare-parts' },
  { text: 'Billing', icon: <Receipt />, path: '/billing' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Admin', icon: <AdminPanelSettings />, path: '/admin' },
];

const dealerMenu = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
  { text: 'Payments', icon: <Payment />, path: '/payments' },
  { text: 'Leads', icon: <People />, path: '/leads' },
  { text: 'Services', icon: <Build />, path: '/services' },
  { text: 'Profile', icon: <Settings />, path: '/profile' },
];

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const menuItems = isSuperAdmin(user) ? adminMenu : dealerMenu;

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsAPI.unreadCount().then((r) => r.data.data.count),
    refetchInterval: 60000,
  });

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight={700}>SK Mobility</Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>Dealer & Service Platform</Typography>
      </Box>
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: location.pathname.startsWith(item.path) ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {menuItems.find((m) => location.pathname.startsWith(m.path))?.text || 'SK Mobility'}
          </Typography>
          <IconButton onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unreadData || 0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.first_name} {user?.last_name}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon> Profile
            </MenuItem>
            <MenuItem onClick={() => dispatch(logout()).then(() => navigate('/login'))}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
            {drawer}
          </Drawer>
        ) : (
          <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: 1, borderColor: 'divider' } }} open>
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
