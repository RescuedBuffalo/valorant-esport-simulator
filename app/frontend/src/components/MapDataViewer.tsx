import React from 'react';
import { 
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Grid,
  Stack,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapIcon from '@mui/icons-material/Map';
import RouteIcon from '@mui/icons-material/Route';
import BlockIcon from '@mui/icons-material/Block';
import FlagIcon from '@mui/icons-material/Flag';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Import interfaces directly from MapBuilder
interface Point {
  x: number;
  y: number;
}

interface NavNode {
  id: string;
  position: Point;
  connections: string[]; // IDs of connected nodes
  areaId: string; // The area this node belongs to
  cost: number; // Movement cost (higher for tactical or choke points)
  type: 'normal' | 'tactical' | 'choke'; // Node type
}

type CollisionBoundaryType = 'wall' | 'half-wall' | 'walkable-boundary';

interface CollisionBoundary {
  id: string;
  points: Point[];
  type: CollisionBoundaryType;
  height: number; // Height in game units (0 for floor, higher for walls)
}

interface MapArea {
  id: string;
  name: string;
  type: string;
  color: string;
  points: Point[];
  description?: string;
  walkable: boolean;
  team?: 'attackers' | 'defenders' | 'neutral';
  tactical: boolean;
  isChokePoint?: boolean;
}

interface MapData {
  name: string;
  areas: MapArea[];
  version: string;
  navGraph: NavNode[];
  collisionMesh: CollisionBoundary[];
  spawnPoints: { attackers: Point[], defenders: Point[] };
  bombsites: { [key: string]: Point[] };
  gridSize: number;
  width: number;
  height: number;
  scale: number;
  chokePoints: Point[];
  sightlines: { start: Point, end: Point, blocked: boolean }[];
}

interface MapDataViewerProps {
  mapData: MapData;
}

const MapDataViewer: React.FC<MapDataViewerProps> = ({ mapData }) => {
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Map Data - {mapData.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Metadata: {mapData.width}x{mapData.height} pixels | Grid size: {mapData.gridSize}px
        </Typography>
      </Paper>
      
      {/* Areas Summary */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Areas ({mapData.areas.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            {mapData.areas.map((area: MapArea) => (
              <Grid item xs={12} sm={6} md={4} key={area.id}>
                <Paper 
                  sx={{ 
                    p: 1.5, 
                    mb: 1,
                    borderLeft: `4px solid ${area.color}`
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {area.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {area.type}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                    <Chip 
                      label={area.walkable ? "Walkable" : "Non-walkable"} 
                      color={area.walkable ? "success" : "error"} 
                      size="small"
                    />
                    {area.tactical && (
                      <Chip 
                        label="Tactical" 
                        color="warning" 
                        size="small"
                      />
                    )}
                    {area.isChokePoint && (
                      <Chip 
                        label="Choke Point" 
                        color="primary" 
                        size="small"
                      />
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Navigation Graph */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Navigation Graph ({mapData.navGraph?.length || 0} nodes)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {mapData.navGraph && mapData.navGraph.length > 0 ? (
            <Box>
              <Typography variant="body2" paragraph>
                The navigation graph contains {mapData.navGraph.length} nodes with {
                  mapData.navGraph.reduce((sum: number, node: NavNode) => sum + (node.connections?.length || 0), 0)
                } connections.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Node Types:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip 
                  icon={<RouteIcon />} 
                  label={`Regular: ${mapData.navGraph.filter((n: NavNode) => n.type === 'normal').length}`}
                  size="small"
                />
                <Chip 
                  icon={<FlagIcon />} 
                  label={`Tactical: ${mapData.navGraph.filter((n: NavNode) => n.type === 'tactical').length}`}
                  color="warning"
                  size="small"
                />
                <Chip 
                  icon={<RouteIcon />} 
                  label={`Choke: ${mapData.navGraph.filter((n: NavNode) => n.type === 'choke').length}`}
                  color="primary"
                  size="small"
                />
              </Stack>
            </Box>
          ) : (
            <Typography color="text.secondary">
              No navigation graph data available.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Collision Boundaries */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Collision Boundaries ({mapData.collisionMesh?.length || 0})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {mapData.collisionMesh && mapData.collisionMesh.length > 0 ? (
            <Box>
              <Typography variant="body2" paragraph>
                The map has {mapData.collisionMesh.length} collision boundaries.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Boundary Types:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip 
                  icon={<BlockIcon />} 
                  label={`Walls: ${mapData.collisionMesh.filter(b => b.type === 'wall').length}`}
                  color="error"
                  size="small"
                />
                <Chip 
                  icon={<BlockIcon />} 
                  label={`Half-walls: ${mapData.collisionMesh.filter(b => b.type === 'half-wall').length}`}
                  color="warning"
                  size="small"
                />
                <Chip 
                  icon={<BlockIcon />} 
                  label={`Boundaries: ${mapData.collisionMesh.filter(b => b.type === 'walkable-boundary').length}`}
                  color="info"
                  size="small"
                />
              </Stack>
            </Box>
          ) : (
            <Typography color="text.secondary">
              No collision boundaries defined.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Spawn Points */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Spawn Points
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom color="error">
                Attacker Spawns ({mapData.spawnPoints?.attackers?.length || 0})
              </Typography>
              {mapData.spawnPoints?.attackers?.length > 0 ? (
                <Grid container spacing={1}>
                  {mapData.spawnPoints.attackers.map((spawn, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Chip 
                        label={`(${Math.round(spawn.x)}, ${Math.round(spawn.y)})`}
                        size="small"
                        color="error"
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No attacker spawn points defined.
                </Typography>
              )}
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom color="info">
                Defender Spawns ({mapData.spawnPoints?.defenders?.length || 0})
              </Typography>
              {mapData.spawnPoints?.defenders?.length > 0 ? (
                <Grid container spacing={1}>
                  {mapData.spawnPoints.defenders.map((spawn, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Chip 
                        label={`(${Math.round(spawn.x)}, ${Math.round(spawn.y)})`}
                        size="small"
                        color="info"
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No defender spawn points defined.
                </Typography>
              )}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
      
      {/* Tactical Data */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Tactical Data
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Bombsites
              </Typography>
              <Grid container spacing={2}>
                {Object.keys(mapData.bombsites || {}).map((site) => (
                  <Grid item xs={12} sm={4} key={site}>
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Site {site.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Points: {mapData.bombsites[site]?.length || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
                {Object.keys(mapData.bombsites || {}).length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary">
                      No bombsites defined.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
            
            <Divider />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Choke Points ({mapData.chokePoints?.length || 0})
              </Typography>
              {mapData.chokePoints && mapData.chokePoints.length > 0 ? (
                <Grid container spacing={1}>
                  {mapData.chokePoints.map((point, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Chip 
                        label={`CP ${index+1}: (${Math.round(point.x)}, ${Math.round(point.y)})`}
                        size="small"
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  No choke points identified.
                </Typography>
              )}
            </Box>
            
            <Divider />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Sightlines ({mapData.sightlines?.length || 0})
              </Typography>
              {mapData.sightlines && mapData.sightlines.length > 0 ? (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      icon={<VisibilityIcon />} 
                      label={`Clear: ${mapData.sightlines.filter(s => !s.blocked).length}`}
                      color="success"
                      size="small"
                    />
                    <Chip 
                      icon={<VisibilityOffIcon />} 
                      label={`Blocked: ${mapData.sightlines.filter(s => s.blocked).length}`}
                      color="error"
                      size="small"
                    />
                  </Stack>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No sightlines calculated.
                </Typography>
              )}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default MapDataViewer; 