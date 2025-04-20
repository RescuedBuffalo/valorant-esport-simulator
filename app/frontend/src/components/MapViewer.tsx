import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Map callout interface
interface MapCallout {
  name: string;
  area_type: string;
  position: [number, number]; 
  size: [number, number];
  description: string;
  typical_roles: string[];
}

// Strategic point interface
interface StrategicPoint {
  name: string;
  type: string;
  position: [number, number];
  description: string;
}

// Map layout interface
interface MapLayout {
  name: string;
  image_url: string;
  width: number;
  height: number;
  callouts: Record<string, MapCallout>;
  sites: string[];
  attacker_spawn: [number, number];
  defender_spawn: [number, number];
}

// Fallback images for each map (in case the real ones fail to load)
const FALLBACK_IMAGES: Record<string, string> = {
  'haven': '/maps/haven_map.jpg',
  'bind': '/maps/bind_map.jpg',
  'split': '/maps/split_map.jpg',
  'ascent': '/maps/ascent_map.jpg',
};

// Default map layouts with basic information
const DEFAULT_MAP_LAYOUTS: Record<string, MapLayout> = {
  'haven': {
    name: 'Haven',
    image_url: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8afb5b8145f5e7a2/5ebc46f10e7139542fe54ae5/Haven_Loading_Screen.jpg',
    width: 1024,
    height: 1024,
    callouts: {},
    sites: ['A', 'B', 'C'],
    attacker_spawn: [0.5, 0.9],
    defender_spawn: [0.5, 0.1],
  },
  'bind': {
    name: 'Bind',
    image_url: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt0c118364c6320f60/5ebc46f1af7e315106b47d28/Bind_Loading_Screen.jpg',
    width: 1024,
    height: 1024,
    callouts: {},
    sites: ['A', 'B'],
    attacker_spawn: [0.1, 0.5],
    defender_spawn: [0.9, 0.5],
  },
  'split': {
    name: 'Split',
    image_url: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt643d7a506d2eece9/5ebc46fe248ff1147e4c1f1e/Split_Loading_Screen.jpg',
    width: 1024,
    height: 1024,
    callouts: {},
    sites: ['A', 'B'],
    attacker_spawn: [0.5, 0.9],
    defender_spawn: [0.5, 0.1],
  },
  'ascent': {
    name: 'Ascent',
    image_url: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blte5aefeb26bee12c8/5ebc46fba3f2e27c950d2aaa/Ascent_Loading_Screen.jpg',
    width: 1024,
    height: 1024,
    callouts: {},
    sites: ['A', 'B'],
    attacker_spawn: [0.5, 0.9],
    defender_spawn: [0.5, 0.1],
  }
};

// Haven map colors
const COLORS = {
  // Site colors
  A_SITE: '#ff9966',
  B_SITE: '#99cc99',
  C_SITE: '#9999ff',
  
  // Area colors
  ATTACKER_SPAWN: '#ff4655',
  DEFENDER_SPAWN: '#18e5ff',
  MID: '#cccccc',
  
  // Connection colors
  CONNECTOR: '#e6e6e6',
  LONG: '#f5f5f5',
  
  // Object colors
  BOX: '#8c8c8c',
  WALL: '#666666',
  CALLOUT: 'rgba(255, 255, 255, 0.7)',
  
  // UI colors
  BACKGROUND: '#1a1a1a',
  TEXT: '#ffffff',
  TEXT_SECONDARY: '#cccccc',
};

// Haven map callouts with polygon paths for hit detection
interface MapArea {
  name: string;
  type: string;
  color: string;
  polygon: [number, number][];
  description?: string;
}

const HAVEN_AREAS: MapArea[] = [
  {
    name: "A Site",
    type: "site",
    color: COLORS.A_SITE,
    polygon: [
      [0.65, 0.28], [0.8, 0.28], [0.8, 0.4], [0.65, 0.4]
    ],
    description: "A bomb site"
  },
  {
    name: "A Lobby",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.75, 0.4], [0.88, 0.40], [0.88, 0.52], [0.75, 0.52]
    ]
  },
  {
    name: "A Long",
    type: "long",
    color: COLORS.LONG,
    polygon: [
      [0.8, 0.28], [0.95, 0.28], [0.95, 0.4], [0.8, 0.4]
    ]
  },
  {
    name: "A Heaven",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.6, 0.20], [0.75, 0.2], [0.75, 0.28], [0.6, 0.28]
    ]
  },
  {
    name: "Sewer/A Short",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.7, 0.52], [0.85, 0.52], [0.85, 0.62], [0.7, 0.62]
    ]
  },
  {
    name: "A Link",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.55, 0.32], [0.65, 0.32], [0.65, 0.45], [0.55, 0.45]
    ]
  },
  {
    name: "B Site",
    type: "site",
    color: COLORS.B_SITE,
    polygon: [
      [0.42, 0.42], [0.58, 0.42], [0.58, 0.58], [0.42, 0.58]
    ],
    description: "B bomb site"
  },
  {
    name: "Mid Window",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.48, 0.58], [0.52, 0.58], [0.52, 0.65], [0.48, 0.65]
    ]
  },
  {
    name: "Window",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.48, 0.65], [0.52, 0.65], [0.52, 0.72], [0.48, 0.72]
    ]
  },
  {
    name: "Mid Doors",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.38, 0.58], [0.48, 0.58], [0.48, 0.65], [0.38, 0.65]
    ]
  },
  {
    name: "Mid Courtyard",
    type: "mid",
    color: COLORS.MID,
    polygon: [
      [0.38, 0.65], [0.62, 0.65], [0.62, 0.78], [0.38, 0.78]
    ]
  },
  {
    name: "C Site",
    type: "site",
    color: COLORS.C_SITE,
    polygon: [
      [0.2, 0.75], [0.35, 0.75], [0.35, 0.9], [0.2, 0.9]
    ],
    description: "C bomb site"
  },
  {
    name: "C Long",
    type: "long",
    color: COLORS.LONG,
    polygon: [
      [0.1, 0.8], [0.2, 0.8], [0.2, 0.9], [0.1, 0.9]
    ]
  },
  {
    name: "C Lobby",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.35, 0.8], [0.45, 0.8], [0.45, 0.9], [0.35, 0.9]
    ]
  },
  {
    name: "C Cubby",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.5, 0.8], [0.6, 0.8], [0.6, 0.9], [0.5, 0.9]
    ]
  },
  {
    name: "Garage",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.28, 0.58], [0.4, 0.58], [0.4, 0.75], [0.28, 0.75]
    ]
  },
  {
    name: "C Link",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.35, 0.42], [0.45, 0.42], [0.45, 0.55], [0.35, 0.55]
    ]
  },
  {
    name: "Long B",
    type: "connector",
    color: COLORS.CONNECTOR,
    polygon: [
      [0.3, 0.4], [0.42, 0.4], [0.42, 0.55], [0.3, 0.55]
    ]
  },
  {
    name: "Attacker Spawn",
    type: "spawn",
    color: COLORS.ATTACKER_SPAWN,
    polygon: [
      [0.35, 0.9], [0.65, 0.9], [0.65, 1.0], [0.35, 1.0]
    ]
  },
  {
    name: "Defender Spawn",
    type: "spawn",
    color: COLORS.DEFENDER_SPAWN,
    polygon: [
      [0.35, 0], [0.65, 0], [0.65, 0.15], [0.35, 0.15]
    ]
  },
  {
    name: "T Spawn",
    type: "spawn",
    color: COLORS.ATTACKER_SPAWN,
    polygon: [
      [0.75, 0.6], [0.9, 0.6], [0.9, 0.7], [0.75, 0.7]
    ]
  },
  {
    name: "CT Spawn",
    type: "spawn",
    color: COLORS.DEFENDER_SPAWN,
    polygon: [
      [0.1, 0.4], [0.25, 0.4], [0.25, 0.5], [0.1, 0.5]
    ]
  }
];

// Strategic points for Haven
const HAVEN_STRATEGIC_POINTS = [
  { name: "A Long Control", x: 0.85, y: 0.35, type: "control", description: "Important for A site control" },
  { name: "Garage Control", x: 0.34, y: 0.65, type: "control", description: "Key for C site rotations" },
  { name: "Mid Control", x: 0.5, y: 0.7, type: "control", description: "Allows flexibility to attack any site" },
  { name: "B Window", x: 0.5, y: 0.65, type: "entry", description: "Key visibility into B site" },
  { name: "C Logs", x: 0.25, y: 0.82, type: "defense", description: "Strong defensive position" }
];

interface MapViewerProps {
  mapId: string;
  showCallouts?: boolean;
  showStrategicPoints?: boolean;
  onAreaHover?: (areaName: string | null) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({
  mapId,
  showCallouts = true,
  showStrategicPoints = false,
  onAreaHover,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Convert polygon points to SVG path format
  const polygonToPath = (polygon: [number, number][], width: number, height: number): string => {
    return polygon.map((point, index) => {
      const x = point[0] * width;
      const y = point[1] * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };
  
  // Get transform style for panning and zooming
  const svgTransform = useMemo(() => {
    return `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`;
  }, [offset.x, offset.y, zoom]);
  
  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setDragging(false);
  };
  
  const handleMouseLeave = () => {
    setDragging(false);
  };
  
  // Handle area hover
  const handleAreaHover = (areaName: string) => {
    setHoveredArea(areaName);
    if (onAreaHover) {
      onAreaHover(areaName);
    }
  };
  
  const handleAreaLeave = () => {
    setHoveredArea(null);
    if (onAreaHover) {
      onAreaHover(null);
    }
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Simulate map reload
    setTimeout(() => setLoading(false), 1000);
  };
  
  // Determine if we should render the custom map or use an image
  const shouldRenderCustomMap = mapId === 'haven';
  
  // Render the SVG map for Haven
  const renderHavenMap = () => {
    const SVG_WIDTH = 800;
    const SVG_HEIGHT = 800;
    
    return (
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        style={{
          width: '100%',
          height: 'auto',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          overflow: 'visible',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <g style={{ transform: svgTransform, transformOrigin: 'center' }}>
          {/* Background */}
          <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill={COLORS.BACKGROUND} />
          
          {/* Map areas */}
          {HAVEN_AREAS.map((area) => {
            const isHovered = hoveredArea === area.name;
            const pathString = polygonToPath(area.polygon, SVG_WIDTH, SVG_HEIGHT);
            
            return (
              <g key={area.name}>
                <path
                  d={pathString}
                  fill={isHovered ? area.color : `${area.color}99`}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1}
                  onMouseEnter={() => handleAreaHover(area.name)}
                  onMouseLeave={handleAreaLeave}
                />
                
                {showCallouts && (
                  <text
                    x={area.polygon.reduce((sum, point) => sum + point[0], 0) / area.polygon.length * SVG_WIDTH}
                    y={area.polygon.reduce((sum, point) => sum + point[1], 0) / area.polygon.length * SVG_HEIGHT}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={COLORS.TEXT}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontSize={isHovered ? 14 : 12}
                  >
                    {area.name}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Strategic points */}
          {showStrategicPoints && HAVEN_STRATEGIC_POINTS.map((point) => (
            <g key={point.name}>
              <circle
                cx={point.x * SVG_WIDTH}
                cy={point.y * SVG_HEIGHT}
                r={8}
                fill="#ffeb3b"
                stroke="#000000"
                strokeWidth={1}
                onMouseEnter={() => handleAreaHover(point.name)}
                onMouseLeave={handleAreaLeave}
              />
              <text
                x={point.x * SVG_WIDTH}
                y={(point.y * SVG_HEIGHT) - 12}
                textAnchor="middle"
                fill={COLORS.TEXT}
                fontSize={12}
              >
                {point.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    );
  };
  
  const renderFallbackMap = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 500,
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h5">
          Custom map for {mapId} not implemented yet
        </Typography>
        <Typography variant="body1">
          Only Haven has a custom-drawn map implementation currently
        </Typography>
      </Box>
    );
  };
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: 800,
          margin: '0 auto',
          borderRadius: 2,
          backgroundColor: COLORS.BACKGROUND,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 500,
            flexDirection: 'column',
            gap: 2,
            p: 3
          }}>
            <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
              {error}
            </Alert>
            <Button variant="contained" startIcon={<RestartAltIcon />} onClick={handleRetry}>
              Try Again
            </Button>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {shouldRenderCustomMap ? renderHavenMap() : renderFallbackMap()}
            
            {/* Area information tooltip */}
            {hoveredArea && (
              <Box sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: 'white',
                padding: 1.5,
                borderRadius: 1,
                maxWidth: '40%',
                zIndex: 10
              }}>
                <Typography variant="subtitle1">{hoveredArea}</Typography>
                {HAVEN_AREAS.find(area => area.name === hoveredArea)?.description && (
                  <Typography variant="body2">
                    {HAVEN_AREAS.find(area => area.name === hoveredArea)?.description}
                  </Typography>
                )}
                {HAVEN_STRATEGIC_POINTS.find(point => point.name === hoveredArea)?.description && (
                  <Typography variant="body2">
                    {HAVEN_STRATEGIC_POINTS.find(point => point.name === hoveredArea)?.description}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
        
        {/* Zoom controls */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16, 
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 1,
          p: 0.5,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 5
        }}>
          <IconButton size="small" onClick={handleZoomIn} sx={{ color: 'white' }}>
            <ZoomInIcon />
          </IconButton>
          <IconButton size="small" onClick={handleZoomOut} sx={{ color: 'white' }}>
            <ZoomOutIcon />
          </IconButton>
          <IconButton size="small" onClick={handleResetZoom} sx={{ color: 'white' }}>
            <RestartAltIcon />
          </IconButton>
        </Box>
      </Paper>
      
      {/* Map legend */}
      <Paper sx={{ mt: 2, p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 15, height: 15, borderRadius: '50%', bgcolor: COLORS.ATTACKER_SPAWN, mr: 1 }} />
          <Typography variant="body2">Attacker Spawn</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 15, height: 15, borderRadius: '50%', bgcolor: COLORS.DEFENDER_SPAWN, mr: 1 }} />
          <Typography variant="body2">Defender Spawn</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 15, height: 15, borderRadius: 0, bgcolor: COLORS.A_SITE, mr: 1 }} />
          <Typography variant="body2">A Site</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 15, height: 15, borderRadius: 0, bgcolor: COLORS.B_SITE, mr: 1 }} />
          <Typography variant="body2">B Site</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 15, height: 15, borderRadius: 0, bgcolor: COLORS.C_SITE, mr: 1 }} />
          <Typography variant="body2">C Site</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 15, height: 15, borderRadius: 0, bgcolor: COLORS.CONNECTOR + '99', mr: 1 }} />
          <Typography variant="body2">Connectors</Typography>
        </Box>
        {showStrategicPoints && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 15, height: 15, borderRadius: '50%', bgcolor: '#ffeb3b', mr: 1 }} />
            <Typography variant="body2">Strategic Points</Typography>
          </Box>
        )}
      </Paper>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
        Note: Hover over areas to see details. Drag to pan and use controls to zoom.
      </Typography>
    </Box>
  );
};

// Export a utility function to use in other components
export const isPointInArea = (
  point: [number, number], 
  areaName: string, 
  mapId: string = 'haven'
): boolean => {
  if (mapId !== 'haven') return false;
  
  const area = HAVEN_AREAS.find(a => a.name === areaName);
  if (!area) return false;
  
  // Use the point in polygon algorithm
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = area.polygon.length - 1; i < area.polygon.length; j = i++) {
    const xi = area.polygon[i][0];
    const yi = area.polygon[i][1];
    const xj = area.polygon[j][0];
    const yj = area.polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

export default MapViewer; 