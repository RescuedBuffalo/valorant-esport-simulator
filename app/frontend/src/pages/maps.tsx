import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Fab,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MapViewerInterface from '../components/MapViewerInterface';
import MapBuilder from '../components/MapBuilder';

const Maps = () => {
  const [selectedMap, setSelectedMap] = useState('haven');
  const [showCallouts, setShowCallouts] = useState(true);
  const [showStrategicPoints, setShowStrategicPoints] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  
  const handleMapChange = (_: React.SyntheticEvent, newMap: string) => {
    setSelectedMap(newMap);
  };

  const handleCreateMap = () => {
    setIsBuilderMode(true);
  };

  const handleSaveMap = (mapData: any) => {
    // This will be implemented to save the map data
    setIsBuilderMode(false);
    // We would update the map list here once the map is saved
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Maps
      </Typography>
      
      {!isBuilderMode ? (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select a Map
            </Typography>
            
            <Tabs
              value={selectedMap}
              onChange={handleMapChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab label="Haven" value="haven" />
              <Tab label="Bind" value="bind" />
              <Tab label="Split" value="split" />
              <Tab label="Ascent" value="ascent" />
            </Tabs>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showCallouts}
                    onChange={(e) => setShowCallouts(e.target.checked)}
                  />
                }
                label="Show Callouts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showStrategicPoints}
                    onChange={(e) => setShowStrategicPoints(e.target.checked)}
                  />
                }
                label="Show Strategic Points"
              />
            </Box>
          </Paper>
          
          <Box sx={{ mb: 4 }}>
            <MapViewerInterface
              mapId={selectedMap}
              showCallouts={showCallouts}
              showStrategicPoints={showStrategicPoints}
            />
          </Box>
          
          {/* Create Map Button */}
          <Tooltip title="Create new map">
            <Fab 
              color="primary" 
              aria-label="add" 
              onClick={handleCreateMap}
              sx={{ 
                position: 'fixed', 
                bottom: 24, 
                right: 24,
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </>
      ) : (
        <Box sx={{ mb: 4 }}>
          <MapBuilder onSaveComplete={(mapData) => {
            setIsBuilderMode(false);
            // Reload maps or add to the list
            // We could update the tab list here
          }} />
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Tooltip title="Cancel and return to maps">
              <Fab 
                color="secondary" 
                aria-label="close" 
                onClick={() => setIsBuilderMode(false)}
                sx={{ 
                  position: 'fixed', 
                  bottom: 24, 
                  right: 24,
                }}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default Maps; 