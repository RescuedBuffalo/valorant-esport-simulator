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
  source?: 'local' | 'server';
}

const Maps = () => {
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [showCallouts, setShowCallouts] = useState(true);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [availableMaps, setAvailableMaps] = useState<MapInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load maps from localStorage
  const loadLocalMaps = (): MapInfo[] => {
    const localMaps: MapInfo[] = [];
    
    // Check localStorage for maps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('map_')) {
        try {
          const mapData = JSON.parse(localStorage.getItem(key) || '');
          localMaps.push({
            id: key.replace('map_', ''),
            name: mapData.name || 'Unknown Map',
            source: 'local'
          });
        } catch (e) {
          console.error('Error parsing local map:', e);
        }
      }
    }
    
    return localMaps;
  };
  
  // Fetch available maps from the backend
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setIsLoading(true);
        
        // Get local maps first
        const localMaps = loadLocalMaps();
        console.log('Local maps found:', localMaps.length, localMaps.map(m => m.name));
        let allMaps = [...localMaps];
        
        // Try to fetch from server
        let serverMaps: MapInfo[] = [];
        try {
          console.log('Fetching maps from server...');
          const response = await fetch('/api/maps/');
          console.log('Server response status:', response.status);
          const data = await response.json();
          console.log('Server maps data:', data);
          
          if (data.maps && Object.keys(data.maps).length > 0) {
            serverMaps = Object.keys(data.maps).map(mapName => ({
              id: mapName.toLowerCase().replace(/\s+/g, '_'),
              name: mapName,
              source: 'server' as const
            }));
            console.log('Server maps found:', serverMaps.length, serverMaps.map(m => m.name));
            
            // Merge server maps with local maps, preferring server versions if both exist
            const existingIds = new Set(allMaps.map(m => m.id));
            const uniqueServerMaps = serverMaps.filter(m => !existingIds.has(m.id));
            allMaps = [...allMaps, ...uniqueServerMaps];
          } else {
            console.log('No maps found on server or invalid response format');
          }
        } catch (error) {
          console.warn('Error fetching maps from server, using local maps only:', error);
        }
        
        // Check which local maps exist on server for reference
        for (const localMap of localMaps) {
          const existsOnServer = serverMaps.some(m => m.id === localMap.id);
          console.log(`Map "${localMap.name}" (${localMap.id}): ${existsOnServer ? 'exists on server' : 'local only'}`);
        }
        
        setAvailableMaps(allMaps);
        
        // Set the first map as selected if we have maps and none is selected
        if (allMaps.length > 0 && !selectedMap) {
          setSelectedMap(allMaps[0].id);
        }
      } catch (error) {
        console.error('Error loading maps:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaps();
  }, [isBuilderMode]); // Re-run when leaving builder mode to refresh maps
  
  // Check if a map with given ID exists on the server
  const checkMapExistsOnServer = async (mapId: string): Promise<boolean> => {
    try {
      console.log(`Checking if map "${mapId}" exists on server...`);
      const response = await fetch('/api/maps/');
      if (!response.ok) {
        console.warn(`Server returned ${response.status} when checking for map ${mapId}`);
        return false;
      }
      
      const data = await response.json();
      if (data.maps && Object.keys(data.maps).length > 0) {
        // Convert server map names to IDs for comparison
        const serverMapIds = Object.keys(data.maps).map(name => 
          name.toLowerCase().replace(/\s+/g, '_')
        );
        const exists = serverMapIds.includes(mapId);
        console.log(`Map ${mapId} ${exists ? 'exists' : 'does not exist'} on server`);
        return exists;
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking if map ${mapId} exists on server:`, error);
      return false;
    }
  };
  
  const handleMapChange = (_: React.SyntheticEvent, newMap: string) => {
    setSelectedMap(newMap);
  };

  const handleCreateMap = () => {
    setIsBuilderMode(true);
  };

  const handleSaveMap = async (mapData: any) => {
    setIsBuilderMode(false);
    
    // Optional: Check if the map was successfully saved to server
    if (mapData && mapData.name) {
      const mapId = mapData.name.toLowerCase().replace(/\s+/g, '_');
      const existsOnServer = await checkMapExistsOnServer(mapId);
      console.log(`After saving: Map "${mapData.name}" ${existsOnServer ? 'was saved to server successfully' : 'was NOT saved to server'}`);
    }
    
    // No need to reload, we'll re-fetch on effect
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
                    <Tab 
                      key={map.id} 
                      label={`${map.name}${map.source === 'local' ? ' (Local)' : ''}`} 
                      value={map.id} 
                    />
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