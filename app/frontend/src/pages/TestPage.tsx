import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TestPage: React.FC = () => {
  return (
    <Paper sx={{ p: 4, m: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Page
        </Typography>
        <Typography variant="body1">
          If you're seeing this page, routing is working correctly!
        </Typography>
      </Box>
    </Paper>
  );
};

export default TestPage; 