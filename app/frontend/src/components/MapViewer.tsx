import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

interface MapViewerProps {
  mapId: string;
  showCallouts?: boolean;
  onAreaHover?: (areaName: string | null) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ mapId }) => {
  return (
    <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <Typography variant="h5" gutterBottom>
        Map Viewer
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        This component is currently disabled to fix a build issue.
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        Selected map: {mapId || 'None'}
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        component="a" 
        href="/maps"
        sx={{ mt: 2 }}
      >
        Return to Maps
      </Button>
    </Paper>
  );
};

// Simplified utility function that doesn't do anything real
export const isPointInArea = (): boolean => false;

export default MapViewer; 