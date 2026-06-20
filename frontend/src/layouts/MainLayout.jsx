import {
  Box, Drawer, AppBar, Toolbar, Typography, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Menu, MenuItem, Badge, Divider,
  useTheme, useMediaQuery, InputBase, alpha, Tooltip, Chip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Store, DirectionsCar, ShoppingCart, Payment,
  Inventory, People, Build, Logout, Notifications, Receipt,
  AdminPanelSettings, Assessment, Handyman, Search, Settings, ElectricCar,
  Groups, Handshake, AccountBalance, RequestQuote, KeyboardArrowRight,
} from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { logout } from '../store/authSlice';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';
import { notificationsAPI } from '../services';

const DRAWER_WIDTH = 260;

// Sidebar dark palette
const SB = {
  bg: '#0f1729',
  surface: '#162039',
  hover: 'rgba(255,255,255,0.06)',
  active: 'rgba(99,102,241,0.18)',
  activeBorder: '#6366f1',
  text: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.4)',
  label: 'rgba(255,255,255,0.25)',
  divider: 'rgba(255,255,255,0.07)',
};

const adminMenu = [
  { section: 'OVERVIEW', items: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Reports', icon: <Assessment />, path: '/reports' },
  ]},
  { section: 'MANAGEMENT', items: [
    { text: 'Dealers', icon: <Store />, path: '/dealers' },
    { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
    { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
    { text: 'Leads', icon: <People />, path: '/leads' },
  ]},
  { section: 'FINANCE', items: [
    { text: 'Payments', icon: <Payment />, path: '/payments' },
    { text: 'Billing', icon: <Receipt />, path: '/billing' },
  ]},
  { section: 'OPERATIONS', items: [
    { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
    { text: 'Services', icon: <Build />, path: '/services' },
    { text: 'Spare Parts', icon: <Handyman />, path: '/spare-parts' },
  ]},
  { section: 'BUSINESS', items: [
    { text: 'HR Management', icon: <Groups />, path: '/hr' },
    { text: 'Partners', icon: <Handshake />, path: '/partners' },
    { text: 'Office Expenses', icon: <RequestQuote />, path: '/expenses' },
    { text: 'Bank & Loans', icon: <AccountBalance />, path: '/finance' },
  ]},
  { section: 'SYSTEM', items: [
    { text: 'Admin Panel', icon: <AdminPanelSettings />, path: '/admin' },
  ]},
];

const dealerMenu = [
  { section: 'OVERVIEW', items: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  ]},
  { section: 'BUSINESS', items: [
    { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
    { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
    { text: 'Payments', icon: <Payment />, path: '/payments' },
    { text: 'Leads', icon: <People />, path: '/leads' },
  ]},
  { section: 'SERVICE', items: [
    { text: 'Services', icon: <Build />, path: '/services' },
  ]},
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

  const menuGroups = isSuperAdmin(user) ? adminMenu : dealerMenu;
  const allItems = menuGroups.flatMap(g => g.items);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsAPI.unreadCount().then((r) => r.data.data.count),
    refetchInterval: 60000,
  });

  const currentPage = allItems.find((m) => location.pathname.startsWith(m.path))?.text || 'SK Mobility';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: SB.bg }}>

      {/* ── Logo ── */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.5)',
          flexShrink: 0,
        }}>
          <ElectricCar sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            SK Mobility
          </Typography>
          <Typography sx={{ fontSize: '11px', color: SB.muted, lineHeight: 1 }}>
            EV Dealer Platform
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mx: 2.5, height: '1px', bgcolor: SB.divider }} />

      {/* ── Nav ── */}
      <Box sx={{
        flex: 1, overflowY: 'auto', px: 1.5, py: 2,
        scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {menuGroups.map((group, gi) => (
          <Box key={group.section} mb={0.5} mt={gi > 0 ? 1.5 : 0}>
            <Typography sx={{
              px: 1.5, pb: 0.75, pt: 0.25, display: 'block',
              fontWeight: 700, fontSize: '10px', color: SB.label,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              {group.section}
            </Typography>
            {group.items.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <ListItemButton
                  key={item.path}
                  selected={active}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  sx={{
                    borderRadius: '10px',
                    mb: 0.25, px: 1.5, py: 0.85,
                    position: 'relative',
                    backgroundColor: active ? SB.active : 'transparent',
                    borderLeft: active ? `3px solid ${SB.activeBorder}` : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: active ? SB.active : SB.hover,
                    },
                    '&.Mui-selected': {
                      backgroundColor: SB.active,
                      '&:hover': { backgroundColor: SB.active },
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 34,
                    color: active ? '#818cf8' : SB.muted,
                    transition: 'color 0.15s',
                  }}>
                    {item.icon && <Box sx={{ fontSize: 18, display: 'flex' }}>{item.icon}</Box>}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '13.5px',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#e0e7ff' : SB.text,
                      letterSpacing: '-0.01em',
                    }}
                  />
                  {active && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#818cf8', flexShrink: 0, ml: 0.5 }} />
                  )}
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ mx: 2.5, height: '1px', bgcolor: SB.divider }} />

      {/* ── User Card ── */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          p: 1.5, borderRadius: '12px', bgcolor: SB.surface,
          border: `1px solid ${SB.divider}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(99,102,241,0.4)' },
        }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Avatar sx={{
            width: 32, height: 32, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            fontSize: '12px', fontWeight: 700,
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }} noWrap>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: SB.muted, lineHeight: 1.3, textTransform: 'capitalize' }} noWrap>
              {user?.role?.replace('_', ' ') || 'User'}
            </Typography>
          </Box>
          <KeyboardArrowRight sx={{ fontSize: 16, color: SB.muted, flexShrink: 0 }} />
        </Box>
      </Box>

      {/* User dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        PaperProps={{
          sx: {
            mb: 1, minWidth: 200, border: '1px solid #f1f5f9',
            borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" color="#94a3b8">{user?.email}</Typography>
        </Box>
        <Divider sx={{ borderColor: '#f1f5f9' }} />
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ py: 1.2, fontSize: '14px', gap: 1.5 }}>
          <Settings fontSize="small" sx={{ color: '#94a3b8' }} /> Profile & Settings
        </MenuItem>
        <MenuItem
          onClick={() => dispatch(logout()).then(() => navigate('/login'))}
          sx={{ py: 1.2, fontSize: '14px', gap: 1.5, color: '#ef4444' }}
        >
          <Logout fontSize="small" /> Sign out
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f4ff' }}>

      {/* ── AppBar ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(240,244,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: 'text.primary',
          borderBottom: '1px solid rgba(226,232,240,0.8)',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: (t) => t.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} size="small"
              sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', width: 36, height: 36 }}
            >
              <MenuIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          {/* Search bar */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
            px: 1.5, py: 0.75, flex: 1, maxWidth: 420,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              borderColor: '#6366f1',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
            },
          }}>
            <Search sx={{ fontSize: 17, color: '#94a3b8', flexShrink: 0 }} />
            <InputBase
              placeholder="Search orders, dealers, vehicles..."
              sx={{ fontSize: '13.5px', color: '#374151', flex: 1 }}
              inputProps={{ 'aria-label': 'global search' }}
            />
            <Box sx={{
              display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, flexShrink: 0,
            }}>
              <Typography sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', px: 0.7, py: 0.15, borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>
                ⌘K
              </Typography>
            </Box>
          </Box>

          <Box flex={1} />

          {/* Page title on mobile */}
          <Typography variant="subtitle1" fontWeight={700}
            sx={{ display: { md: 'none' }, color: '#0f172a', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            {currentPage}
          </Typography>

          {/* Breadcrumb on desktop */}
          <Typography variant="body2" fontWeight={600} color="#64748b"
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            {currentPage}
          </Typography>

          <Box flex={1} />

          {/* Notifications */}
          <Tooltip title="Notifications" arrow>
            <IconButton
              size="small"
              onClick={() => navigate('/notifications')}
              sx={{
                bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                width: 38, height: 38, transition: 'all 0.2s',
                '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)', boxShadow: '0 2px 8px rgba(99,102,241,0.2)' },
              }}
            >
              <Badge badgeContent={unreadData || 0} color="error">
                <Notifications sx={{ fontSize: 18, color: '#374151' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User pill */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
              pl: 0.75, pr: 1.5, py: 0.6,
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#6366f1', boxShadow: '0 2px 8px rgba(99,102,241,0.15)' },
            }}
          >
            <Avatar sx={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              fontSize: '11px', fontWeight: 700,
              boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Typography variant="body2" fontWeight={700}
              sx={{ color: '#0f172a', fontSize: '13px', display: { xs: 'none', sm: 'block' } }}
            >
              {user?.first_name}
            </Typography>
            {isSuperAdmin(user) && (
              <Chip label="Admin" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', display: { xs: 'none', lg: 'flex' } }} />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ── */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: SB.bg, border: 'none', boxShadow: '8px 0 32px rgba(0,0,0,0.25)' } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: SB.bg, border: 'none', boxShadow: '1px 0 0 rgba(255,255,255,0.05)' } }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* ── Main Content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: '#f0f4ff',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '1600px' }} className="sk-page-enter">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
