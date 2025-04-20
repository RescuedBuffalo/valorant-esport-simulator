import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Fade,
  Grow
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlagIcon from '@mui/icons-material/Flag';

// Define types for map data
interface PlayerPosition {
  player_id: string;
  position: [number, number]; // x, y coordinates (0-1 scale)
  rotation: number; // Angle in degrees (0-360)
  callout: string | null; // Current map callout location
}

interface MapEvent {
  event_type: string; // "kill", "plant", "defuse", "ability", etc.
  position: [number, number]; // x, y coordinates (0-1 scale)
  timestamp: number; // Time in seconds from the start of the round
  player_id: string; // Player who triggered the event
  target_id?: string; // Target player (if applicable)
  details: Record<string, any>; // Additional event details
}

interface RoundMapData {
  map_name: string;
  player_positions: Record<string, PlayerPosition[]>; // player_id -> list of positions over time
  events: MapEvent[];
  spike_plant_position?: [number, number];
  attacker_positions: Record<string, [number, number]>; // player_id -> final position
  defender_positions: Record<string, [number, number]>; // player_id -> final position
}

// Map paths lookup
const MAP_IMAGES: Record<string, string> = {
  'Haven': '/static/maps/haven.jpg',
  'Bind': '/static/maps/bind.jpg',
  'Split': '/static/maps/split.jpg',
  'Ascent': '/static/maps/ascent.jpg',
  'Default': '/static/maps/default.jpg',
};

interface MapDisplayProps {
  mapData: RoundMapData;
  teamAPlayers: any[];
  teamBPlayers: any[];
  attackingSide: 'team_a' | 'team_b';
  playerAgents: Record<string, string>;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ 
  mapData, 
  teamAPlayers, 
  teamBPlayers, 
  attackingSide,
  playerAgents
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [timePosition, setTimePosition] = useState<number>(100); // 0-100% of the round time
  const [viewMode, setViewMode] = useState<string>('final'); // 'final', 'timeline', 'heatmap'
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // Create a map of player IDs to colors
  const playerColors = React.useMemo(() => {
    const colors: Record<string, string> = {};
    
    // Team A colors (shades of blue)
    teamAPlayers.forEach((player, index) => {
      colors[player.id] = `hsl(210, 100%, ${40 + (index * 5)}%)`;
    });
    
    // Team B colors (shades of red)
    teamBPlayers.forEach((player, index) => {
      colors[player.id] = `hsl(0, 100%, ${40 + (index * 5)}%)`;
    });
    
    return colors;
  }, [teamAPlayers, teamBPlayers]);
  
  // Create a map of player IDs to names
  const playerNames = React.useMemo(() => {
    const names: Record<string, string> = {};
    
    teamAPlayers.forEach(player => {
      names[player.id] = `${player.firstName} ${player.lastName}`;
    });
    
    teamBPlayers.forEach(player => {
      names[player.id] = `${player.firstName} ${player.lastName}`;
    });
    
    return names;
  }, [teamAPlayers, teamBPlayers]);
  
  // Get teams as sets for quick lookups
  const teamAPlayerIds = React.useMemo(() => new Set(teamAPlayers.map(p => p.id)), [teamAPlayers]);
  const teamBPlayerIds = React.useMemo(() => new Set(teamBPlayers.map(p => p.id)), [teamBPlayers]);
  
  // Determine which team a player is on
  const getPlayerTeam = (playerId: string): 'team_a' | 'team_b' => {
    return teamAPlayerIds.has(playerId) ? 'team_a' : 'team_b';
  };
  
  // Determine if a player is on the attacking side
  const isPlayerAttacking = (playerId: string): boolean => {
    const team = getPlayerTeam(playerId);
    return team === attackingSide;
  };
  
  // Load map image
  useEffect(() => {
    if (!mapData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get map image path
    const mapImagePath = MAP_IMAGES[mapData.map_name] || MAP_IMAGES['Default'];
    
    // Load map image
    const mapImage = new Image();
    mapImage.onload = () => {
      setIsLoaded(true);
      renderMap();
    };
    mapImage.src = mapImagePath;
    
    // Function to render the map
    const renderMap = () => {
      if (!canvas || !ctx || !mapImage) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw map
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
      
      // Determine which positions to show based on view mode
      if (viewMode === 'final') {
        // Draw final positions
        drawFinalPositions(ctx);
      } else if (viewMode === 'timeline') {
        // Draw positions at the current time
        drawTimelinePositions(ctx);
      } else if (viewMode === 'heatmap') {
        // Draw heatmap of player positions
        drawHeatmap(ctx);
      }
      
      // Draw events (kills, plants, etc.)
      drawEvents(ctx);
    };
    
    // Function to draw events
    const drawEvents = (ctx: CanvasRenderingContext2D) => {
      // Draw all events
      drawEventMarkers(ctx, mapData.events);
    };
    
    // Function to draw final positions
    const drawFinalPositions = (ctx: CanvasRenderingContext2D) => {
      // Draw attacker positions
      Object.entries(mapData.attacker_positions).forEach(([playerId, position]) => {
        const color = playerColors[playerId] || '#ff0000';
        const isAttacking = isPlayerAttacking(playerId);
        
        // Draw player icon
        drawPlayerIcon(ctx, position, color, isAttacking, playerId);
      });
      
      // Draw defender positions
      Object.entries(mapData.defender_positions).forEach(([playerId, position]) => {
        const color = playerColors[playerId] || '#0000ff';
        const isAttacking = isPlayerAttacking(playerId);
        
        // Draw player icon
        drawPlayerIcon(ctx, position, color, isAttacking, playerId);
      });
      
      // Draw spike plant position if it exists
      if (mapData.spike_plant_position) {
        drawSpikeIcon(ctx, mapData.spike_plant_position);
      }
    };
    
    // Function to draw positions at a specific time
    const drawTimelinePositions = (ctx: CanvasRenderingContext2D) => {
      // Get all events and sort by timestamp
      const allEvents = [...mapData.events].sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate max timestamp
      const maxTimestamp = allEvents.length > 0 ? allEvents[allEvents.length - 1].timestamp : 0;
      
      // Calculate current timestamp based on slider position
      const currentTimestamp = (timePosition / 100) * maxTimestamp;
      
      // For each player, find their position at the current time
      Object.entries(mapData.player_positions).forEach(([playerId, positions]) => {
        // Skip if no positions
        if (positions.length === 0) return;
        
        // Find the latest position before or at the current time
        let latestPosition: PlayerPosition | null = null;
        
        for (const position of positions) {
          // Find events that affected this player
          const playerEvents = allEvents.filter(e => 
            (e.player_id === playerId || e.target_id === playerId) && 
            e.timestamp <= currentTimestamp
          );
          
          // If player was killed, skip positions after death
          const wasKilled = playerEvents.some(e => 
            e.event_type === 'kill' && e.target_id === playerId
          );
          
          if (wasKilled) continue;
          
          // Update latest position
          latestPosition = position;
        }
        
        // Draw player if they have a position at this time
        if (latestPosition) {
          const color = playerColors[playerId] || '#ff0000';
          const isAttacking = isPlayerAttacking(playerId);
          
          // Draw player icon
          drawPlayerIcon(ctx, latestPosition.position, color, isAttacking, playerId);
        }
      });
      
      // Draw events up to the current time
      const eventsToShow = allEvents.filter(e => e.timestamp <= currentTimestamp);
      drawEventMarkers(ctx, eventsToShow);
      
      // Draw spike plant if it occurred before or at the current time
      const plantEvent = allEvents.find(e => e.event_type === 'plant' && e.timestamp <= currentTimestamp);
      if (plantEvent && mapData.spike_plant_position) {
        drawSpikeIcon(ctx, mapData.spike_plant_position);
      }
    };
    
    // Function to draw a heatmap of player positions
    const drawHeatmap = (ctx: CanvasRenderingContext2D) => {
      // Create a separate canvas for the heatmap
      const heatmapCanvas = document.createElement('canvas');
      heatmapCanvas.width = canvas.width;
      heatmapCanvas.height = canvas.height;
      const heatmapCtx = heatmapCanvas.getContext('2d');
      if (!heatmapCtx) return;
      
      // Clear heatmap canvas
      heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
      
      // Draw heatmap points for all player positions
      Object.entries(mapData.player_positions).forEach(([playerId, positions]) => {
        const isTeamA = teamAPlayerIds.has(playerId);
        const alpha = 0.05; // Lower alpha for less intense points
        
        positions.forEach(pos => {
          const x = pos.position[0] * canvas.width;
          const y = pos.position[1] * canvas.height;
          
          // Draw a gradient circle centered at the position
          const gradient = heatmapCtx.createRadialGradient(x, y, 0, x, y, 20);
          gradient.addColorStop(0, isTeamA ? `rgba(0, 0, 255, ${alpha})` : `rgba(255, 0, 0, ${alpha})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          heatmapCtx.fillStyle = gradient;
          heatmapCtx.beginPath();
          heatmapCtx.arc(x, y, 20, 0, Math.PI * 2);
          heatmapCtx.fill();
        });
      });
      
      // Draw the heatmap on the main canvas with transparency
      ctx.globalAlpha = 0.7;
      ctx.drawImage(heatmapCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
      
      // Draw key locations like spike plant and kills
      if (mapData.spike_plant_position) {
        drawSpikeIcon(ctx, mapData.spike_plant_position);
      }
      
      // Draw kill events
      const killEvents = mapData.events.filter(e => e.event_type === 'kill');
      drawEventMarkers(ctx, killEvents);
    };
    
    // Function to draw player icon
    const drawPlayerIcon = (
      ctx: CanvasRenderingContext2D, 
      position: [number, number], 
      color: string, 
      isAttacking: boolean,
      playerId: string
    ) => {
      const x = position[0] * canvas.width;
      const y = position[1] * canvas.height;
      const radius = 10;
      
      // Draw circle for player
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isAttacking ? '#ff0000' : '#0000ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw player agent initial
      const agent = playerAgents[playerId] || '?';
      ctx.font = '10px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agent.charAt(0), x, y);
      
      // Draw player name on hover (implemented in the canvas interactions)
    };
    
    // Function to draw spike icon
    const drawSpikeIcon = (ctx: CanvasRenderingContext2D, position: [number, number]) => {
      const x = position[0] * canvas.width;
      const y = position[1] * canvas.height;
      
      // Draw spike icon (simple red diamond)
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 8, y);
      ctx.closePath();
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    
    // Function to draw event markers
    const drawEventMarkers = (ctx: CanvasRenderingContext2D, events: MapEvent[]) => {
      events.forEach(event => {
        const x = event.position[0] * canvas.width;
        const y = event.position[1] * canvas.height;
        
        if (event.event_type === 'kill') {
          // Draw X for kill
          ctx.beginPath();
          ctx.moveTo(x - 5, y - 5);
          ctx.lineTo(x + 5, y + 5);
          ctx.moveTo(x + 5, y - 5);
          ctx.lineTo(x - 5, y + 5);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (event.event_type === 'plant') {
          // Plant is handled by drawSpikeIcon
        }
      });
    };
    
    // Initial render
    renderMap();
    
    // Set up render loop for interactivity
    let animationFrame: number;
    const renderLoop = () => {
      renderMap();
      animationFrame = requestAnimationFrame(renderLoop);
    };
    
    // Start render loop
    renderLoop();
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [mapData, zoom, viewMode, timePosition, playerColors, teamAPlayerIds, teamBPlayerIds, attackingSide, playerAgents]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoom(1);
  };
  
  // Handle view mode change
  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: string,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };
  
  // Handle timeline slider change
  const handleTimelineChange = (_event: Event, newValue: number | number[]) => {
    setTimePosition(newValue as number);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2, position: 'relative', overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Map: {mapData.map_name}
      </Typography>
      
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="final" aria-label="final positions">
            Final Positions
          </ToggleButton>
          <ToggleButton value="timeline" aria-label="timeline">
            Timeline
          </ToggleButton>
          <ToggleButton value="heatmap" aria-label="heatmap">
            Heatmap
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Box>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton onClick={handleResetZoom} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Timeline slider (only visible in timeline mode) */}
      {viewMode === 'timeline' && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Slider
            value={timePosition}
            onChange={handleTimelineChange}
            aria-label="Round timeline"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
          />
        </Box>
      )}
      
      {/* Map container with canvas */}
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          width: '100%', 
          height: 500, 
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#222',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '& canvas': {
            transformOrigin: 'center',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-out'
          }
        }}
      >
        {/* Loading state */}
        {!isLoaded && (
          <Typography color="text.secondary">
            Loading map...
          </Typography>
        )}
        
        {/* Map canvas */}
        <Fade in={isLoaded}>
          <canvas
            ref={canvasRef}
            width={1024}
            height={1024}
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Fade>
      </Box>
      
      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ color: '#0000ff', mr: 0.5 }} />
          <Typography variant="body2">Defender</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ color: '#ff0000', mr: 0.5 }} />
          <Typography variant="body2">Attacker</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ color: '#ff0000', mr: 0.5 }} />
          <Typography variant="body2">Kill</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FlagIcon sx={{ color: '#ff0000', mr: 0.5 }} />
          <Typography variant="body2">Spike Plant</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MapDisplay;