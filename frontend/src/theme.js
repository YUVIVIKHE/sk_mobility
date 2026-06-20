import { createTheme, alpha } from '@mui/material/styles';

const P = {
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 900: '#312e81' },
  emerald: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
  amber: { 400: '#fbbf24', 500: '#f59e0b' },
  red: { 400: '#f87171', 500: '#ef4444' },
  sky: { 500: '#0ea5e9' },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: P.indigo[500], light: P.indigo[400], dark: P.indigo[600], contrastText: '#fff' },
    secondary: { main: P.emerald[500], light: P.emerald[400], dark: P.emerald[600] },
    background: { default: '#f0f4ff', paper: '#ffffff' },
    error: { main: P.red[500] },
    warning: { main: P.amber[500] },
    info: { main: P.sky[500] },
    success: { main: P.emerald[500] },
    text: { primary: P.slate[900], secondary: P.slate[500] },
    divider: P.slate[200],
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.55, fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 4px rgba(0,0,0,0.06)',
    '0 4px 8px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
    '0 8px 16px -4px rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.06)',
    '0 16px 32px -8px rgba(0,0,0,0.12), 0 8px 16px -8px rgba(0,0,0,0.06)',
    '0 24px 48px -12px rgba(0,0,0,0.20)',
    '0 32px 64px -16px rgba(0,0,0,0.25)',
    ...Array(17).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes sk-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sk-pulse-ring { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .sk-page-enter { animation: sk-fadeUp 0.3s ease both; }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '10px',
          padding: '8px 18px',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          letterSpacing: '0.01em',
          lineHeight: 1.5,
        },
        contained: {
          background: `linear-gradient(135deg, ${P.indigo[500]} 0%, ${P.indigo[600]} 100%)`,
          color: '#fff',
          boxShadow: `0 2px 8px ${alpha(P.indigo[500], 0.35)}, 0 1px 2px ${alpha(P.indigo[500], 0.2)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${P.indigo[400]} 0%, ${P.indigo[500]} 100%)`,
            boxShadow: `0 4px 16px ${alpha(P.indigo[500], 0.45)}, 0 2px 4px ${alpha(P.indigo[500], 0.25)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)', boxShadow: `0 2px 6px ${alpha(P.indigo[500], 0.3)}` },
          '&.Mui-disabled': { background: P.slate[200], color: P.slate[400], boxShadow: 'none' },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${P.emerald[500]} 0%, ${P.emerald[600]} 100%)`,
          boxShadow: `0 2px 8px ${alpha(P.emerald[500], 0.35)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${P.emerald[400]} 0%, ${P.emerald[500]} 100%)`,
            boxShadow: `0 4px 16px ${alpha(P.emerald[500], 0.45)}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          border: `1.5px solid ${P.slate[200]}`,
          color: P.slate[700],
          backgroundColor: '#fff',
          '&:hover': {
            border: `1.5px solid ${P.indigo[400]}`,
            color: P.indigo[500],
            backgroundColor: alpha(P.indigo[500], 0.04),
            boxShadow: `0 2px 8px ${alpha(P.indigo[500], 0.15)}`,
          },
        },
        text: {
          color: P.indigo[500],
          '&:hover': { backgroundColor: alpha(P.indigo[500], 0.06) },
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: `1px solid ${P.slate[100]}`,
          borderRadius: 16,
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: `1px solid ${P.slate[100]}`,
          backgroundImage: 'none',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '12px',
          borderRadius: '8px',
          height: '26px',
        },
        colorSuccess: { backgroundColor: alpha(P.emerald[500], 0.12), color: P.emerald[600] },
        colorError: { backgroundColor: alpha(P.red[500], 0.10), color: P.red[500] },
        colorWarning: { backgroundColor: alpha(P.amber[500], 0.12), color: '#b45309' },
        colorInfo: { backgroundColor: alpha(P.sky[500], 0.10), color: '#0369a1' },
        colorPrimary: { backgroundColor: alpha(P.indigo[500], 0.10), color: P.indigo[600] },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#fff',
            transition: 'box-shadow 0.2s ease',
            '& fieldset': { borderColor: P.slate[200] },
            '&:hover fieldset': { borderColor: P.indigo[400] },
            '&.Mui-focused fieldset': { borderColor: P.indigo[500], borderWidth: '2px' },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(P.indigo[500], 0.12)}` },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: P.indigo[500] },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: P.indigo[500], borderWidth: '2px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
          '&.Mui-selected': {
            backgroundColor: alpha(P.indigo[500], 0.1),
            color: P.indigo[600],
            '& .MuiListItemIcon-root': { color: P.indigo[500] },
            '&:hover': { backgroundColor: alpha(P.indigo[500], 0.15) },
          },
          '&:hover': { backgroundColor: alpha(P.slate[900], 0.04) },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: P.slate[50],
            fontWeight: 700,
            fontSize: '11.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: P.slate[500],
            borderBottom: `2px solid ${P.slate[100]}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${P.slate[100]}`,
          fontSize: '14px',
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.15s',
          '&:hover': { backgroundColor: alpha(P.indigo[500], 0.03) },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none', backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none', backgroundImage: 'none' },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontSize: '13px', fontWeight: 700 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '10px', border: '1px solid' },
        standardError: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
        standardSuccess: { borderColor: '#6ee7b7', backgroundColor: '#f0fdf4' },
        standardWarning: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
        standardInfo: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.10)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '18px', fontWeight: 700, paddingBottom: '8px' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '14px',
          minHeight: '44px',
          '&.Mui-selected': { color: P.indigo[500] },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: '3px', borderRadius: '3px 3px 0 0', backgroundColor: P.indigo[500] },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '13px',
          borderRadius: '8px !important',
          border: `1px solid ${P.slate[200]} !important`,
          color: P.slate[600],
          '&.Mui-selected': {
            backgroundColor: alpha(P.indigo[500], 0.08),
            color: P.indigo[600],
            borderColor: `${P.indigo[300]} !important`,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: P.slate[900],
          fontSize: '12px',
          fontWeight: 500,
          borderRadius: '6px',
          padding: '5px 10px',
        },
        arrow: { color: P.slate[900] },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        thumb: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
        track: { borderRadius: 22 },
        switchBase: {
          '&.Mui-checked': { '& + .MuiSwitch-track': { backgroundColor: P.indigo[500] } },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        bar: { borderRadius: 4 },
      },
    },
  },
});

export default theme;
