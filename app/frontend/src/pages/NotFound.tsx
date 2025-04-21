import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <Paper elevation={3} sx={{ p: 6, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          404 - Page Not Found
        </Typography>
        <Typography variant="body1" paragraph>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
            size="large"
          >
            Go Home
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotFound; 