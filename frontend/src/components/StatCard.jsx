import { Box, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const sparklinePath = (values, w = 80, h = 32) => {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return `M ${pts.join(' L ')}`;
};

// Derive a soft bg and darker text color from the accent color
const makeStyle = (color) => ({
  iconBg: `${color}18`,
  iconColor: color,
  accentBg: `${color}09`,
});

export default function StatCard({ title, value, subtitle, icon, color = '#6366f1', trend, loading, sparkline }) {
  if (loading) {
    return (
      <Box sx={{ bgcolor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Skeleton width={80} height={14} />
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '12px' }} />
        </Box>
        <Skeleton width={90} height={38} sx={{ mb: 1 }} />
        <Skeleton width={120} height={14} />
      </Box>
    );
  }

  const s = makeStyle(color);

  return (
    <Box sx={{
      bgcolor: '#fff',
      border: '1px solid',
      borderColor: 'rgba(226,232,240,0.8)',
      borderRadius: '18px',
      p: 2.5,
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      '&:hover': {
        boxShadow: `0 8px 28px rgba(0,0,0,0.09), 0 2px 8px ${color}22`,
        transform: 'translateY(-2px)',
        borderColor: `${color}30`,
      },
      // subtle top accent bar
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)`,
        borderRadius: '18px 18px 0 0',
        opacity: 0,
        transition: 'opacity 0.25s ease',
      },
      '&:hover::before': { opacity: 1 },
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
        <Typography sx={{
          fontSize: '12.5px', fontWeight: 600, color: '#64748b',
          lineHeight: 1.4, letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{
            width: 42, height: 42, borderRadius: '12px',
            bgcolor: s.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: s.iconColor,
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            '&:hover': { transform: 'scale(1.1)' },
          }}>
            {icon}
          </Box>
        )}
      </Box>

      <Typography sx={{
        fontSize: { xs: '1.65rem', sm: '1.9rem' },
        fontWeight: 800,
        color: '#0f172a',
        lineHeight: 1.05,
        letterSpacing: '-0.03em',
        mb: 0.75,
        wordBreak: 'break-word',
      }}>
        {value}
      </Typography>

      {subtitle && (
        <Typography sx={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>
          {subtitle}
        </Typography>
      )}

      <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5}>
        {trend !== undefined ? (
          <Box display="flex" alignItems="center" gap={0.5}
            sx={{
              bgcolor: trend >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              borderRadius: '6px', px: 0.75, py: 0.25,
            }}
          >
            {trend >= 0
              ? <TrendingUp sx={{ fontSize: 13, color: '#10b981' }} />
              : <TrendingDown sx={{ fontSize: 13, color: '#ef4444' }} />
            }
            <Typography sx={{
              fontSize: '11.5px', fontWeight: 700,
              color: trend >= 0 ? '#059669' : '#dc2626',
            }}>
              {trend >= 0 ? '+' : ''}{Math.abs(trend)}% vs last month
            </Typography>
          </Box>
        ) : <Box />}

        {/* Sparkline */}
        {sparkline && sparkline.length > 1 && (
          <svg width="80" height="32" style={{ overflow: 'visible' }}>
            <path
              d={sparklinePath(sparkline)}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          </svg>
        )}
      </Box>
    </Box>
  );
}
