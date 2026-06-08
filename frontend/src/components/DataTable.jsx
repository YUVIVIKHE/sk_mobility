import { Paper, Typography, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function DataTable({ title, rows, columns, loading, pageSize = 10, ...props }) {
  return (
    <Paper sx={{ p: 2 }}>
      {title && (
        <Typography variant="h6" fontWeight={600} mb={2}>{title}</Typography>
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
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }}
          {...props}
        />
      </Box>
    </Paper>
  );
}
