import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
  Divider,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Map area types with colors
const AREA_TYPES = {
  'site': '#ff9966',
  'connector': '#e6e6e6',
  'long': '#f5f5f5',
  'mid': '#cccccc',
  'spawn': '#ffcc00',
  'attacker-spawn': '#ff4655',
  'defender-spawn': '#18e5ff',
};

interface Point {
  x: number;
  y: number;
}

interface MapArea {
  id: string;
  name: string;
  type: string;
  color: string;
  points: Point[];
  description?: string;
}

interface MapData {
  name: string;
  areas: MapArea[];
  version: string;
}

interface MapBuilderProps {
  onSaveComplete?: (mapData: MapData) => void;
}

const MapBuilder: React.FC<MapBuilderProps> = ({ onSaveComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for managing the map
  const [mapData, setMapData] = useState<MapData>({
    name: 'New Map',
    areas: [],
    version: '1.0'
  });
  
  // UI state
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [isCreatingArea, setIsCreatingArea] = useState(false);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [draggingAreaId, setDraggingAreaId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState<Point | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [currentArea, setCurrentArea] = useState<MapArea | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [mapName, setMapName] = useState('New Map');
  const [isSaving, setIsSaving] = useState(false);
  
  // Draw the map whenever data changes
  useEffect(() => {
    drawMap();
  }, [mapData, activeAreaId, isCreatingArea, tempPoints]);
  
  // Draw the map on the canvas
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw all areas
    mapData.areas.forEach(area => {
      const isActive = area.id === activeAreaId;
      drawArea(ctx, area, isActive);
    });
    
    // Draw area being created
    if (isCreatingArea && tempPoints.length > 0) {
      drawTempArea(ctx, tempPoints);
    }
  };
  
  // Draw background grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#8c8c8c';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
  
  // Draw a map area
  const drawArea = (ctx: CanvasRenderingContext2D, area: MapArea, isActive: boolean) => {
    if (area.points.length < 3) return;
    
    ctx.beginPath();
    ctx.moveTo(area.points[0].x, area.points[0].y);
    
    for (let i = 1; i < area.points.length; i++) {
      ctx.lineTo(area.points[i].x, area.points[i].y);
    }
    
    ctx.closePath();
    
    // Fill polygon
    ctx.fillStyle = area.color + (isActive ? 'FF' : '99'); // Full or 60% opacity
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = isActive ? '#ffffff' : '#cccccc';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.stroke();
    
    // Draw points if active
    if (isActive) {
      area.points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    
    // Draw label
    const centroid = calculateCentroid(area.points);
    ctx.fillStyle = '#ffffff';
    ctx.font = isActive ? 'bold 14px Arial' : '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(area.name, centroid.x, centroid.y);
  };
  
  // Draw the temporary area while creating
  const drawTempArea = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 1) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    // If we're actively creating, draw a line from the last point to the mouse
    if (lastMousePos && isCreatingArea) {
      ctx.lineTo(lastMousePos.x, lastMousePos.y);
    }
    
    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    // Draw lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Close the shape if we have enough points
    if (points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.closePath();
      ctx.fillStyle = '#ffffff33'; // White with 20% opacity
      ctx.fill();
    }
  };
  
  // Calculate centroid of a polygon
  const calculateCentroid = (points: Point[]): Point => {
    if (points.length === 0) return { x: 0, y: 0 };
    
    let sumX = 0;
    let sumY = 0;
    
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  };
  
  // Handle mouse down for drawing or selecting
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // If we're creating a new area
    if (isCreatingArea) {
      setTempPoints([...tempPoints, { x, y }]);
      return;
    }
    
    // Check if we're clicking on a point of the active area for dragging
    if (activeAreaId) {
      const activeArea = mapData.areas.find(area => area.id === activeAreaId);
      if (activeArea) {
        const pointIndex = activeArea.points.findIndex(
          point => Math.hypot(point.x - x, point.y - y) < 10
        );
        
        if (pointIndex !== -1) {
          setIsDraggingPoint(true);
          setDraggingPointIndex(pointIndex);
          setDraggingAreaId(activeAreaId);
          return;
        }
      }
    }
    
    // Check if we're clicking inside an area to select it
    for (let i = mapData.areas.length - 1; i >= 0; i--) {
      const area = mapData.areas[i];
      if (isPointInPolygon({ x, y }, area.points)) {
        setActiveAreaId(area.id);
        setLastMousePos({ x, y });
        return;
      }
    }
    
    // If we clicked on empty space
    setActiveAreaId(null);
  };
  
  // Handle mouse move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLastMousePos({ x, y });
    
    // If we're dragging a point
    if (isDraggingPoint && draggingPointIndex !== null && draggingAreaId) {
      const newAreas = [...mapData.areas];
      const areaIndex = newAreas.findIndex(area => area.id === draggingAreaId);
      
      if (areaIndex !== -1) {
        newAreas[areaIndex] = {
          ...newAreas[areaIndex],
          points: [
            ...newAreas[areaIndex].points.slice(0, draggingPointIndex),
            { x, y },
            ...newAreas[areaIndex].points.slice(draggingPointIndex + 1)
          ]
        };
        
        setMapData({ ...mapData, areas: newAreas });
      }
    }
  };
  
  // Handle mouse up
  const handleCanvasMouseUp = () => {
    setIsDraggingPoint(false);
    setDraggingPointIndex(null);
    setDraggingAreaId(null);
  };
  
  // Check if a point is inside a polygon
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    if (polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) && 
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };
  
  // Start creating a new area
  const startCreatingArea = () => {
    setIsCreatingArea(true);
    setTempPoints([]);
    setActiveAreaId(null);
  };
  
  // Finish creating the current area
  const finishCreatingArea = () => {
    if (tempPoints.length < 3) {
      showSnackbar('Need at least 3 points to create an area', 'error');
      return;
    }
    
    setIsCreatingArea(false);
    setCurrentArea({
      id: `area-${Date.now()}`,
      name: 'New Area',
      type: 'connector',
      color: AREA_TYPES['connector'],
      points: tempPoints
    });
    setShowAreaForm(true);
  };
  
  // Cancel creating the current area
  const cancelCreatingArea = () => {
    setIsCreatingArea(false);
    setTempPoints([]);
  };
  
  // Save area after form submission
  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentArea) return;
    
    // If editing existing area
    if (mapData.areas.some(area => area.id === currentArea.id)) {
      const newAreas = mapData.areas.map(area => 
        area.id === currentArea.id ? currentArea : area
      );
      setMapData({ ...mapData, areas: newAreas });
      showSnackbar('Area updated successfully', 'success');
    } else {
      // Adding new area
      setMapData({
        ...mapData,
        areas: [...mapData.areas, currentArea]
      });
      showSnackbar('New area added', 'success');
    }
    
    setShowAreaForm(false);
    setCurrentArea(null);
    setTempPoints([]);
  };
  
  // Edit an existing area
  const handleEditArea = () => {
    if (!activeAreaId) return;
    
    const area = mapData.areas.find(a => a.id === activeAreaId);
    if (area) {
      setCurrentArea({ ...area });
      setShowAreaForm(true);
    }
  };
  
  // Delete an area
  const handleDeleteArea = () => {
    if (!activeAreaId) return;
    
    const newAreas = mapData.areas.filter(area => area.id !== activeAreaId);
    setMapData({ ...mapData, areas: newAreas });
    setActiveAreaId(null);
    showSnackbar('Area deleted', 'info');
  };
  
  // Save the map as JSON
  const saveMap = () => {
    try {
      const mapJson = JSON.stringify({
        ...mapData,
        name: mapName
      }, null, 2);
      
      const blob = new Blob([mapJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mapName.toLowerCase().replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showSnackbar('Map saved successfully', 'success');
    } catch (error) {
      showSnackbar('Error saving map', 'error');
      console.error('Error saving map:', error);
    }
  };
  
  // Save map to backend API
  const saveMapToBackend = async () => {
    if (mapData.areas.length < 1) {
      showSnackbar('Add at least one area to the map', 'error');
      return;
    }
    
    if (!mapName.trim()) {
      showSnackbar('Please provide a map name', 'error');
      return;
    }
    
    // Prepare data to send
    const dataToSend = {
      ...mapData,
      name: mapName,
      sites: ['A', 'B'], // Default sites
      image_url: `/static/maps/${mapName.toLowerCase().replace(/\s+/g, '_')}.jpg`,
    };
    
    setIsSaving(true);

    try {
      // Save locally first to ensure we have the map data
      const mapJson = JSON.stringify(dataToSend, null, 2);
      const mapId = mapName.toLowerCase().replace(/\s+/g, '_');
      localStorage.setItem(`map_${mapId}`, mapJson);
      console.log(`Map saved to localStorage with key: map_${mapId}`);
      
      // Try to save to server
      console.log('Attempting to save map to server:', dataToSend);
      
      const response = await fetch('/api/maps/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      console.log('Server response status:', response.status);
      const responseText = await response.text();
      console.log('Server response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing server response:', e);
        result = { success: false, error: 'Invalid server response' };
      }
      
      if (result.success) {
        console.log('Map successfully saved to server');
        showSnackbar('Map saved successfully to server', 'success');
      } else {
        console.warn('Server save failed, but map saved locally:', result.error);
        showSnackbar(`Map saved locally (server error: ${result.error || 'Unknown error'})`, 'warning');
      }
      
      // Also download a local copy
      const blob = new Blob([mapJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mapName.toLowerCase().replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Call the callback if provided
      if (onSaveComplete) {
        onSaveComplete(dataToSend);
      }
    } catch (error) {
      console.error('Error saving map:', error);
      showSnackbar(`Saved locally (server error: ${error instanceof Error ? error.message : 'Connection failed'})`, 'warning');
      
      // Make sure to call the callback so we return to maps view
      if (onSaveComplete) {
        onSaveComplete(dataToSend);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Load a map from JSON file
  const loadMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const loadedMap = JSON.parse(content) as MapData;
        
        setMapData(loadedMap);
        setMapName(loadedMap.name);
        setActiveAreaId(null);
        showSnackbar('Map loaded successfully', 'success');
      } catch (error) {
        showSnackbar('Error loading map', 'error');
        console.error('Error loading map:', error);
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };
  
  // Show a snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Box sx={{ padding: 2 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>Map Builder</Typography>
        
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Map Name"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveMap}
                color="primary"
              >
                Save Map Locally
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveMapToBackend}
                color="secondary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save to Server'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Load Map
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={loadMap}
              />
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Tools</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={isCreatingArea ? "contained" : "outlined"}
              startIcon={<AddIcon />}
              onClick={startCreatingArea}
              disabled={isCreatingArea}
            >
              Add Area
            </Button>
            
            {isCreatingArea && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={finishCreatingArea}
                >
                  Finish Area
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={cancelCreatingArea}
                >
                  Cancel
                </Button>
              </>
            )}
            
            {activeAreaId && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditArea}
                >
                  Edit Area
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteArea}
                >
                  Delete Area
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 1, 
              backgroundColor: '#1a1a1a',
              border: '1px solid #333'
            }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              style={{ 
                width: '100%', 
                height: 'auto',
                cursor: isCreatingArea ? 'crosshair' : (isDraggingPoint ? 'grabbing' : 'default')
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              {isCreatingArea 
                ? "Click to add points. Need at least 3 points to create an area." 
                : "Click on an area to select it. Drag points to reshape."}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Areas</Typography>
            {mapData.areas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No areas defined yet. Click "Add Area" to start.
              </Typography>
            ) : (
              <Box sx={{ 
                maxHeight: 550, 
                overflowY: 'auto',
                '& > :not(:last-child)': { mb: 1 }
              }}>
                {mapData.areas.map(area => (
                  <Paper
                    key={area.id}
                    elevation={area.id === activeAreaId ? 3 : 1}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      borderLeft: `4px solid ${area.color}`,
                      backgroundColor: area.id === activeAreaId ? 'action.selected' : 'background.paper'
                    }}
                    onClick={() => setActiveAreaId(area.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">
                        {area.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {area.type}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Area Edit Dialog */}
      <Dialog open={showAreaForm} onClose={() => setShowAreaForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentArea?.id.startsWith('area-') && !mapData.areas.some(a => a.id === currentArea?.id)
            ? 'Add New Area'
            : 'Edit Area'}
        </DialogTitle>
        <form onSubmit={handleSaveArea}>
          <DialogContent>
            <TextField
              fullWidth
              label="Area Name"
              value={currentArea?.name || ''}
              onChange={(e) => setCurrentArea(prev => prev ? { ...prev, name: e.target.value } : null)}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Area Type</InputLabel>
              <Select
                value={currentArea?.type || ''}
                onChange={(e) => {
                  const type = e.target.value as string;
                  setCurrentArea(prev => prev 
                    ? { ...prev, type, color: AREA_TYPES[type as keyof typeof AREA_TYPES] } 
                    : null
                  );
                }}
                label="Area Type"
                required
              >
                {Object.entries(AREA_TYPES).map(([type, color]) => (
                  <MenuItem key={type} value={type}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          backgroundColor: color, 
                          mr: 1, 
                          borderRadius: 0.5 
                        }} 
                      />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Description (Optional)"
              value={currentArea?.description || ''}
              onChange={(e) => setCurrentArea(prev => prev ? { ...prev, description: e.target.value } : null)}
              margin="normal"
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAreaForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapBuilder; 