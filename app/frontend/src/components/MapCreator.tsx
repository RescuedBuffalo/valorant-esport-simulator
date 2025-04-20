import React, { useState, useRef, useEffect, useCallback, MouseEvent, ChangeEvent } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { ChromePicker, ColorResult } from 'react-color';
import axios from 'axios';

// Types
interface Point {
  x: number;
  y: number;
}

interface Area {
  id: string;
  name: string;
  points: Point[];
  color: string;
  type: string;
}

interface MapCreatorProps {
  onMapCreated?: (mapId: string) => void;
}

// Area types
const AREA_TYPES = [
  'site',
  'attacker_spawn',
  'defender_spawn',
  'mid',
  'corridor',
  'lobby',
  'connector',
  'heaven',
  'hell',
  'bombsite_a',
  'bombsite_b',
  'bombsite_c',
];

// Default colors for area types
const DEFAULT_COLORS: Record<string, string> = {
  site: '#ff9800',
  attacker_spawn: '#f44336',
  defender_spawn: '#2196f3',
  mid: '#4caf50',
  corridor: '#9c27b0',
  lobby: '#ffeb3b',
  connector: '#03a9f4',
  heaven: '#8bc34a',
  hell: '#795548',
  bombsite_a: '#e91e63',
  bombsite_b: '#673ab7',
  bombsite_c: '#ff5722',
};

export const MapCreator: React.FC<MapCreatorProps> = ({ onMapCreated }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // State
  const [mapName, setMapName] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [currentArea, setCurrentArea] = useState<Area | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [areaType, setAreaType] = useState<string>('site');
  const [areaName, setAreaName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [mapExists, setMapExists] = useState<boolean>(false);
  const [isCheckingMap, setIsCheckingMap] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#FF5733');

  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all areas
    drawAreas();

    // Draw current area if it exists
    if (currentArea && currentArea.points.length > 0) {
      drawArea(currentArea);
    }
  }, [areas, currentArea]);

  // Draw all areas
  const drawAreas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    areas.forEach(area => {
      drawArea(area);
    });
  }, [areas]);

  // Draw a single area
  const drawArea = useCallback((area: Area) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (area.points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(area.points[0].x, area.points[0].y);

    for (let i = 1; i < area.points.length; i++) {
      ctx.lineTo(area.points[i].x, area.points[i].y);
    }

    // Close the path if there are more than 2 points
    if (area.points.length > 2) {
      ctx.closePath();
    }

    // Fill the area
    ctx.fillStyle = area.color + '80'; // Add transparency
    ctx.fill();

    // Draw the outline
    ctx.strokeStyle = area.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the points
    area.points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw area name in the center
    if (area.points.length > 2) {
      const centerX = area.points.reduce((sum, point) => sum + point.x, 0) / area.points.length;
      const centerY = area.points.reduce((sum, point) => sum + point.y, 0) / area.points.length;

      ctx.font = '14px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(area.name, centerX, centerY);
    }
  }, []);

  // Handle mouse down event
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!currentArea) {
      // Start a new area if not currently drawing
      const newAreaId = `area_${Date.now()}`;
      const newArea: Area = {
        id: newAreaId,
        name: areaName || `Area ${areas.length + 1}`,
        points: [{ x, y }],
        color: DEFAULT_COLORS[areaType] || '#ff9800',
        type: areaType
      };
      setCurrentArea(newArea);
      setIsDrawing(true);
    } else {
      // Add point to existing area
      setCurrentArea({
        ...currentArea,
        points: [...currentArea.points, { x, y }]
      });
    }
  }, [currentArea, areaName, areaType, areas.length]);

  // Handle mouse move event
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentArea || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    for (let gridX = 0; gridX < canvas.width; gridX += 50) {
      ctx.beginPath();
      ctx.moveTo(gridX, 0);
      ctx.lineTo(gridX, canvas.height);
      ctx.stroke();
    }
    for (let gridY = 0; gridY < canvas.height; gridY += 50) {
      ctx.beginPath();
      ctx.moveTo(0, gridY);
      ctx.lineTo(canvas.width, gridY);
      ctx.stroke();
    }

    // Draw all areas
    areas.forEach(area => {
      drawArea(area);
    });

    // Draw current area
    ctx.beginPath();
    ctx.moveTo(currentArea.points[0].x, currentArea.points[0].y);

    for (let i = 1; i < currentArea.points.length; i++) {
      ctx.lineTo(currentArea.points[i].x, currentArea.points[i].y);
    }

    // Draw line to current mouse position
    ctx.lineTo(x, y);

    ctx.strokeStyle = currentArea.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    currentArea.points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [isDrawing, currentArea, areas, drawArea]);

  // Complete the current area
  const completeArea = useCallback(() => {
    if (!currentArea || currentArea.points.length < 3) {
      // Need at least 3 points to form a polygon
      setCurrentArea(null);
      setIsDrawing(false);
      return;
    }

    setAreas([...areas, currentArea]);
    setCurrentArea(null);
    setIsDrawing(false);
    setAreaName('');
  }, [currentArea, areas]);

  // Handle area deletion
  const deleteArea = useCallback((id: string) => {
    setAreas(areas.filter(area => area.id !== id));
    if (selectedArea === id) {
      setSelectedArea(null);
    }
  }, [areas, selectedArea]);

  // Handle area selection
  const selectArea = useCallback((id: string) => {
    setSelectedArea(id === selectedArea ? null : id);
  }, [selectedArea]);

  // Change area color
  const changeAreaColor = useCallback((color: string) => {
    if (!selectedArea) return;

    setAreas(areas.map(area => 
      area.id === selectedArea ? { ...area, color } : area
    ));
  }, [selectedArea, areas]);

  // Undo last point in current area
  const undoLastPoint = useCallback(() => {
    if (!currentArea || currentArea.points.length <= 1) return;

    setCurrentArea({
      ...currentArea,
      points: currentArea.points.slice(0, -1)
    });
  }, [currentArea]);

  // Save map to backend
  const saveMap = useCallback(async () => {
    if (!mapName || areas.length === 0) {
      setSaveError('Please provide a map name and create at least one area');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Format the data for the backend
      const mapData = {
        name: mapName,
        areas: areas.map(area => ({
          name: area.name,
          type: area.type,
          color: area.color,
          coordinates: area.points.map(point => [point.x, point.y])
        }))
      };

      // Send the data to the backend
      const response = await axios.post('/api/maps', mapData);

      if (response.data.success) {
        setSaveSuccess(true);
        if (onMapCreated) {
          onMapCreated(response.data.map_id);
        }
      } else {
        setSaveError(response.data.error || 'Failed to save map');
      }
    } catch (error) {
      setSaveError('An error occurred while saving the map');
      console.error('Error saving map:', error);
    } finally {
      setIsSaving(false);
    }
  }, [mapName, areas, onMapCreated]);

  // Check if map exists
  const checkMapExists = useCallback(async () => {
    if (!mapName.trim()) return;
    
    setIsCheckingMap(true);
    
    try {
      const mapId = mapName.toLowerCase().replace(/\s+/g, '_');
      const response = await axios.get(`/api/maps/${mapId}/exists`);
      setMapExists(response.data.exists);
    } catch (error) {
      console.error('Error checking map:', error);
      setMapExists(false);
    } finally {
      setIsCheckingMap(false);
    }
  }, [mapName]);

  // Check map existence when name changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapName.trim()) {
        checkMapExists();
      } else {
        setMapExists(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [mapName, checkMapExists]);

  // Handle color change from the color picker
  const handleColorChange = (newColor: ColorResult) => {
    setColor(newColor.hex);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Create New Map</Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Map Name"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              error={mapExists}
              helperText={mapExists ? 'A map with this name already exists' : ''}
              InputProps={{
                endAdornment: isCheckingMap ? <CircularProgress size={20} /> : null
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveMap}
                disabled={isSaving || areas.length === 0 || !mapName || mapExists}
                sx={{ flexGrow: 1 }}
              >
                {isSaving ? <CircularProgress size={24} /> : 'Save Map'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>
        )}

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>Map saved successfully!</Alert>
        )}

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" sx={{ mb: 2 }}>Drawing Tools</Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Area Name"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              disabled={currentArea !== null}
              placeholder={`Area ${areas.length + 1}`}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={currentArea !== null}>
              <InputLabel>Area Type</InputLabel>
              <Select
                value={areaType}
                label="Area Type"
                onChange={(e) => setAreaType(e.target.value)}
              >
                {AREA_TYPES.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {isDrawing ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={completeArea}
                    disabled={!currentArea || currentArea.points.length < 3}
                    sx={{ flexGrow: 1 }}
                  >
                    Complete Area
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    onClick={undoLastPoint}
                    disabled={!currentArea || currentArea.points.length <= 1}
                  >
                    Undo
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsDrawing(true)}
                  disabled={currentArea !== null}
                  sx={{ flexGrow: 1 }}
                >
                  Start New Area
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box ref={containerRef} sx={{ position: 'relative', mb: 3 }}>
          <Box
            component="canvas"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            sx={{
              width: '100%',
              height: 'auto',
              border: '1px solid #ccc',
              cursor: isDrawing ? 'crosshair' : 'pointer',
              backgroundColor: '#e0e0e0',
            }}
          />
          
          {isDrawing && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: 1,
              }}
            >
              Drawing: {currentArea?.name || 'New Area'} ({currentArea?.points.length || 0} points)
            </Box>
          )}
        </Box>
        
        <Typography variant="h6" sx={{ mb: 2 }}>Defined Areas</Typography>
        
        {areas.length === 0 ? (
          <Alert severity="info">No areas defined yet. Use the drawing tools to create map areas.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {areas.map(area => (
              <Chip
                key={area.id}
                label={area.name}
                onClick={() => selectArea(area.id)}
                onDelete={() => deleteArea(area.id)}
                deleteIcon={<DeleteIcon />}
                sx={{
                  backgroundColor: area.color + '40',
                  borderColor: area.color,
                  border: '1px solid',
                  boxShadow: selectedArea === area.id ? '0 0 0 2px #000' : 'none',
                  mb: 1
                }}
              />
            ))}
          </Box>
        )}
        
        {selectedArea && (
          <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography variant="subtitle1">
              Edit Area: {areas.find(a => a.id === selectedArea)?.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Button
                startIcon={<ColorLensIcon />}
                onClick={() => setShowColorPicker(true)}
                variant="outlined"
                size="small"
              >
                Change Color
              </Button>
              
              <Box
                sx={{
                  ml: 2,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: areas.find(a => a.id === selectedArea)?.color || '#000',
                  border: '1px solid #ccc'
                }}
              />
            </Box>
            
            <Dialog
              open={showColorPicker}
              onClose={() => setShowColorPicker(false)}
              maxWidth="xs"
              fullWidth
            >
              <DialogTitle>Choose Color</DialogTitle>
              <DialogContent>
                <ChromePicker
                  color={areas.find(a => a.id === selectedArea)?.color || '#000'}
                  onChange={handleColorChange}
                  disableAlpha
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowColorPicker(false)}>Done</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapCreator; 