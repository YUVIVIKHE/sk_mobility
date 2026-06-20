import { Box, Typography, Paper, alpha } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function DataTable({ title, rows, columns, loading, pageSize = 10, action, ...props }) {
  return (
    <Paper sx={{
      borderRadius: '18px',
      border: '1px solid rgba(226,232,240,0.8)',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {(title || action) && (
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(226,232,240,0.6)',
          bgcolor: 'rgba(248,250,252,0.6)',
        }}>
          {title && (
            <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>
              {title}
            </Typography>
          )}
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize } } }}
          autoHeight
          disableRowSelectionOnClick
          sx={{
            border: 0,
            fontFamily: '"Inter", sans-serif',
            fontSize: '13.5px',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'rgba(248,250,252,0.8)',
              borderBottom: '2px solid rgba(226,232,240,0.6)',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '11.5px',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#64748b',
            },
            '& .MuiDataGrid-row': {
              transition: 'background 0.15s ease',
              '&:hover': {
                bgcolor: alpha('#6366f1', 0.03),
                cursor: 'pointer',
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(241,245,249,0.8)',
              py: 1.25,
              color: '#334155',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid rgba(226,232,240,0.6)',
              bgcolor: 'rgba(248,250,252,0.5)',
            },
            '& .MuiDataGrid-selectedRowCount': { visibility: 'hidden' },
            '& .MuiDataGrid-overlay': { bgcolor: '#fff' },
          }}
          {...props}
        />
      </Box>
    </Paper>
  );
}
