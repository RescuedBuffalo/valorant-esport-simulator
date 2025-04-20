import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import PreviewIcon from '@mui/icons-material/Preview';
import InfoIcon from '@mui/icons-material/Info';
import MapViewer from './MapViewer';
import MapBuilder from './MapBuilder';

interface MapViewerInterfaceProps {
  mapId: string;
  showCallouts?: boolean;
  showStrategicPoints?: boolean;
}

const MapViewerInterface: React.FC<MapViewerInterfaceProps> = ({
  mapId,
  showCallouts = true,
  showStrategicPoints = false,
}) => {
  const [mode, setMode] = useState<'view' | 'build'>('view');
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const handleModeChange = (_: React.SyntheticEvent, newMode: 'view' | 'build') => {
    setMode(newMode);
  };

  const handleAreaHover = (areaName: string | null) => {
    setHoveredArea(areaName);
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
            showStrategicPoints={showStrategicPoints}
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
        <MapBuilder />
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
    </Box>
  );
};

export default MapViewerInterface; 