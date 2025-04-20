import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import MapViewerInterface from '../components/MapViewerInterface';
import MapBuilder from '../components/MapBuilder';

interface MapInfo {
  id: string;
  name: string;
}

const Maps = () => {
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [showCallouts, setShowCallouts] = useState(true);
  const [showStrategicPoints, setShowStrategicPoints] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [availableMaps, setAvailableMaps] = useState<MapInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch available maps from the backend
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/maps/');
        const data = await response.json();
        
        if (data.maps && Object.keys(data.maps).length > 0) {
          const mapList = Object.keys(data.maps).map(mapName => ({
            id: mapName.toLowerCase().replace(/\s+/g, '_'),
            name: mapName
          }));
          
          setAvailableMaps(mapList);
          
          // Set the first map as selected if we have maps and none is selected
          if (mapList.length > 0 && !selectedMap) {
            setSelectedMap(mapList[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching maps:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaps();
  }, []);
  
  const handleMapChange = (_: React.SyntheticEvent, newMap: string) => {
    setSelectedMap(newMap);
  };

  const handleCreateMap = () => {
    setIsBuilderMode(true);
  };

  const handleSaveMap = (mapData: any) => {
    setIsBuilderMode(false);
    // Refresh the map list after saving
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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
            
            {availableMaps.length > 0 ? (
              <>
                <Tabs
                  value={selectedMap}
                  onChange={handleMapChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 2 }}
                >
                  {availableMaps.map(map => (
                    <Tab key={map.id} label={map.name} value={map.id} />
                  ))}
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
              </>
            ) : (
              <Typography>
                No maps available. Create your first map by clicking the + button.
              </Typography>
            )}
          </Paper>
          
          {selectedMap && (
            <Box sx={{ mb: 4 }}>
              <MapViewerInterface
                mapId={selectedMap}
                showCallouts={showCallouts}
                showStrategicPoints={showStrategicPoints}
              />
            </Box>
          )}
          
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
                zIndex: 1000
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </>
      ) : (
        <Box sx={{ mb: 4 }}>
          <MapBuilder onSaveComplete={handleSaveMap} />
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
                  zIndex: 1000
                }}
              >
                <CancelIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default Maps; 