import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import PreviewIcon from '@mui/icons-material/Preview';
import InfoIcon from '@mui/icons-material/Info';
import MapViewer from './MapViewer';
import MapBuilder from './MapBuilder';

interface MapViewerInterfaceProps {
  mapId: string;
  showCallouts?: boolean;
}

const MapViewerInterface: React.FC<MapViewerInterfaceProps> = ({
  mapId,
  showCallouts = true,
}) => {
  const [mode, setMode] = useState<'view' | 'build'>('view');
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleModeChange = (_: React.SyntheticEvent, newMode: 'view' | 'build') => {
    setMode(newMode);
  };

  const handleAreaHover = (areaName: string | null) => {
    setHoveredArea(areaName);
  };

  const handleMapSave = useCallback((mapData: any) => {
    // Save the map to localStorage
    try {
      const mapId = mapData.name.toLowerCase().replace(/\s+/g, '_');
      localStorage.setItem(`map_${mapId}`, JSON.stringify(mapData));
      
      setSnackbarMessage(`Map "${mapData.name}" saved successfully!`);
      setSnackbarOpen(true);
      
      // Switch back to view mode after saving
      setMode('view');
    } catch (error) {
      console.error('Error saving map:', error);
      setSnackbarMessage('Error saving map. Please try again.');
      setSnackbarOpen(true);
    }
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={mode}
          onChange={handleModeChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<PreviewIcon />} 
            iconPosition="start" 
            label="View Mode" 
            value="view" 
          />
          <Tab 
            icon={<BuildIcon />} 
            iconPosition="start" 
            label="Build Mode" 
            value="build" 
          />
        </Tabs>
      </Paper>

      {mode === 'view' ? (
        <Box>
          <MapViewer 
            mapId={mapId} 
            showCallouts={showCallouts}
            onAreaHover={handleAreaHover}
          />
          
          {hoveredArea && (
            <Paper sx={{ mt: 2, p: 2 }}>
              <Typography variant="h6">{hoveredArea}</Typography>
              <Typography variant="body2" color="text.secondary">
                Current Position: Hover over the map to see area details
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <MapBuilder onSaveComplete={handleMapSave} />
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {mode === 'view' 
            ? 'View mode: Explore the map and see callouts' 
            : 'Build mode: Create and edit map areas'}
        </Typography>
        <Tooltip title="Switch to Build Mode to create custom maps with polygons and callouts. In View Mode, you can explore existing maps.">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapViewerInterface; 