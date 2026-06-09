import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0D47A1', light: '#5472D3', dark: '#002171' },
    secondary: { main: '#00C853', light: '#5EFC82', dark: '#009624' },
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    error: { main: '#D32F2F' },
    warning: { main: '#ED6C02' },
    info: { main: '#0288D1' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '16px',
          borderRadius: '0.9em',
          padding: '0.8em 1.2em 0.8em 1em',
          transition: 'all ease-in-out 0.2s',
          lineHeight: 1.4,
        },
        contained: {
          border: '2px solid #24b4fb',
          backgroundColor: '#24b4fb',
          color: '#fff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#0071e2',
            borderColor: '#0071e2',
            boxShadow: 'none',
          },
          '&.Mui-disabled': {
            backgroundColor: '#24b4fb99',
            borderColor: '#24b4fb99',
            color: '#fff',
          },
        },
        outlined: {
          border: '2px solid #24b4fb',
          color: '#24b4fb',
          '&:hover': {
            border: '2px solid #0071e2',
            color: '#0071e2',
            backgroundColor: 'rgba(36,180,251,0.08)',
          },
        },
        text: {
          color: '#24b4fb',
          '&:hover': {
            color: '#0071e2',
            backgroundColor: 'rgba(36,180,251,0.08)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: { styleOverrides: { root: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } } },
  },
});

export default theme;
