import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatCard({ title, value, subtitle, icon, color = 'primary.main', trend, loading, valueSx }) {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent><Skeleton height={80} /></CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box flex={1} minWidth={0}>
            <Typography color="text.secondary" variant="body2" gutterBottom noWrap>{title}</Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                lineHeight: 1.25,
                wordBreak: 'break-word',
                fontSize: { xs: '1.15rem', sm: '1.35rem' },
                ...valueSx,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              typeof subtitle === 'string' ? (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                  {subtitle}
                </Typography>
              ) : (
                <Box mt={0.75}>{subtitle}</Box>
              )
            )}
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={0.5}>
                {trend >= 0 ? <TrendingUp color="success" fontSize="small" /> : <TrendingDown color="error" fontSize="small" />}
                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} ml={0.5}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box sx={{ bgcolor: `${color}15`, p: 1.25, borderRadius: 2, color, display: 'flex', flexShrink: 0 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
