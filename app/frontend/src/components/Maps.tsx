import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Paper,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapViewer from './MapViewer';

// Map data
const MAPS = [
  {
    id: 'haven',
    name: 'Haven',
    description: '3 sites. 3 opportunities. Multiple routes to the same win.',
    image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8afb5b8145f5e7a2/5ebc46f10e7139542fe54ae5/Haven_Loading_Screen.jpg',
  },
  {
    id: 'bind',
    name: 'Bind',
    description: 'Two sites, tight spaces, teleporters, one-way doors.',
    image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt0c118364c6320f60/5ebc46f1af7e315106b47d28/Bind_Loading_Screen.jpg',
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Vertical gameplay. Seize the high ground to take control.',
    image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt643d7a506d2eece9/5ebc46fe248ff1147e4c1f1e/Split_Loading_Screen.jpg',
  },
  {
    id: 'ascent',
    name: 'Ascent',
    description: 'An open playground for aggressive gunplay and skill shots.',
    image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blte5aefeb26bee12c8/5ebc46fba3f2e27c950d2aaa/Ascent_Loading_Screen.jpg',
  }
];

const Maps: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const handleMapClick = (mapId: string) => {
    setSelectedMap(mapId);
    setSelectedTab(0); // Reset to map view tab
  };

  const handleClose = () => {
    setSelectedMap(null);
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Render map grid selection
  const renderMapGrid = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Valorant Maps
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore the strategic layouts of Valorant's competitive maps. Click on a map to view details.
        </Typography>
        
        <Grid container spacing={3}>
          {MAPS.map((map) => (
            <Grid item xs={12} sm={6} md={3} key={map.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea onClick={() => handleMapClick(map.id)}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={map.image}
                    alt={map.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {map.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {map.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render selected map view
  const renderMapView = () => {
    if (!selectedMap) return null;
    
    const map = MAPS.find(m => m.id === selectedMap);
    if (!map) return null;

    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleClose}
            sx={{ mr: 2 }}
          >
            Back to Maps
          </Button>
          <Typography variant="h4">
            {map.name}
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          {map.description}
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleChangeTab} aria-label="map view tabs">
            <Tab label="Map View" />
            <Tab label="Callouts" />
            <Tab label="Strategy" />
          </Tabs>
        </Box>
        
        {selectedTab === 0 && (
          <MapViewer mapId={selectedMap} />
        )}
        
        {selectedTab === 1 && (
          <MapViewer mapId={selectedMap} showCallouts={true} />
        )}
        
        {selectedTab === 2 && (
          <MapViewer mapId={selectedMap} showCallouts={true} showStrategicPoints={true} />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {selectedMap ? renderMapView() : renderMapGrid()}
    </Box>
  );
};

export default Maps; 