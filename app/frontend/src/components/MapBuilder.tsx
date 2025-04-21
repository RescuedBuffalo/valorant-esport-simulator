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
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  ButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import BrushIcon from '@mui/icons-material/Brush';
import PolylineIcon from '@mui/icons-material/Polyline';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RouteIcon from '@mui/icons-material/Route';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PanToolIcon from '@mui/icons-material/PanTool';
import SettingsIcon from '@mui/icons-material/Settings';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import { v4 as uuidv4 } from 'uuid';
// Import our new MapDataViewer component
import MapDataViewer from './MapDataViewer';

// Import metrics utilities
import { recordUserInteraction, recordMapBuilderMetric, recordError } from '../utils/metrics';

// Updated map area types with colors and properties
const AREA_TYPES = {
  'site': { color: '#ff9966', walkable: true, team: 'neutral', tactical: true },
  'connector': { color: '#82b1ff', walkable: true, team: 'neutral', tactical: false },
  'long': { color: '#80cbc4', walkable: true, team: 'neutral', tactical: false },
  'mid': { color: '#ce93d8', walkable: true, team: 'neutral', tactical: false },
  'spawn': { color: '#ffcc00', walkable: true, team: 'neutral', tactical: false },
  'attacker-spawn': { color: '#ff4655', walkable: true, team: 'attackers', tactical: false },
  'defender-spawn': { color: '#18e5ff', walkable: true, team: 'defenders', tactical: false },
  'obstacle': { color: '#5c6bc0', walkable: false, team: 'neutral', tactical: false },
  'low-cover': { color: '#8d6e63', walkable: false, team: 'neutral', tactical: true },
  'high-cover': { color: '#455a64', walkable: false, team: 'neutral', tactical: true },
};

// Define interface for a 2D vector
interface Vector2D {
  x: number;
  y: number;
}

// Base Point interface for coordinates
interface Point {
  x: number;
  y: number;
}

// Enhanced interface for grid cells when using paint brush
interface GridCell {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
}

// Navigation node for pathfinding
interface NavNode {
  id: string;
  position: Point;
  connections: string[]; // IDs of connected nodes
  areaId: string; // The area this node belongs to
  cost: number; // Movement cost (higher for tactical or choke points)
  type: 'normal' | 'tactical' | 'choke'; // Node type
}

// Collision boundary types
type CollisionBoundaryType = 'wall' | 'half-wall' | 'walkable-boundary';

// Collision boundary interface
interface CollisionBoundary {
  id: string;
  points: Point[];
  type: CollisionBoundaryType;
  height: number; // Height in game units (0 for floor, higher for walls)
}

// Action for undo history
type UndoAction = 
  | { type: 'ADD_POLYGON_POINT'; pointIndex: number; areaId: string | null }
  | { type: 'PAINT_CELL'; cell: GridCell; color: string }
  | { type: 'ADD_NAV_NODE'; nodeId: string }
  | { type: 'ADD_COLLISION'; boundaryId: string };

// Enhanced MapArea interface with additional properties for gameplay
interface MapArea {
  id: string;
  name: string;
  type: string;
  color: string;
  points: Point[];
  description?: string;
  cells?: GridCell[]; // Optional cells for painted areas
  
  // Enhanced properties for gameplay
  walkable: boolean; // Can agents walk through this area
  team?: 'attackers' | 'defenders' | 'neutral'; // Which team this area belongs to
  tactical: boolean; // Is this a tactically important area (site, choke point)
  coverPoints?: Point[]; // Positions where agents can take cover
  entrancePoints?: Point[]; // Entry points to this area
  
  // Collision and nav mesh data
  navNodes?: NavNode[]; // Navigation nodes within this area
  collisionBoundaries?: CollisionBoundary[]; // Collision boundaries
  
  // Navigation properties
  defaultPathCost?: number; // Base movement cost through this area
  isChokePoint?: boolean; // Is this a narrow passage between larger areas
}

// Enhanced MapData interface
interface MapData {
  name: string;
  areas: MapArea[];
  version: string;
  
  // Enhanced properties for simulation
  navGraph: NavNode[]; // Full navigation graph for the map
  collisionMesh: CollisionBoundary[]; // All collision boundaries
  spawnPoints: { attackers: Point[], defenders: Point[] }; // Spawn locations
  bombsites: { a?: Point[], b?: Point[], c?: Point[] }; // Bombsite locations
  
  // Metadata
  gridSize: number; // Size of grid cells
  width: number; // Map width in pixels
  height: number; // Map height in pixels
  scale: number; // Pixels to game units scale
  
  // Tactical data
  chokePoints: Point[]; // Critical narrow passages
  sightlines: { start: Point, end: Point, blocked: boolean }[]; // Lines of sight
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
    version: '1.0',
    navGraph: [],
    collisionMesh: [],
    spawnPoints: { attackers: [], defenders: [] },
    bombsites: {},
    gridSize: 64, // Updated default grid size to 64
    width: 1200,
    height: 1200,
    scale: 1,
    chokePoints: [],
    sightlines: [],
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
  
  // New state for paint brush and undo functionality
  const [drawMode, setDrawMode] = useState<'polygon' | 'brush'>('polygon');
  const [isPainting, setIsPainting] = useState(false);
  const [tempPaintedCells, setTempPaintedCells] = useState<GridCell[]>([]);
  const [gridSize, setGridSize] = useState(64); // Updated default grid size
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([]);
  const [currentPaintColor, setCurrentPaintColor] = useState(AREA_TYPES['connector'].color);
  
  // Add state for tab selection
  const [activeTab, setActiveTab] = useState<'canvas' | 'data'>('canvas');
  
  // New state for zoom, pan, and grid settings
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [gridWidth, setGridWidth] = useState(64);
  const [gridHeight, setGridHeight] = useState(64);
  const [activeToolMode, setActiveToolMode] = useState<'draw' | 'pan'>('draw');
  
  // Draw the map whenever data changes
  useEffect(() => {
    console.log(`State updated - drawMode: ${drawMode}, tempPaintedCells: ${tempPaintedCells.length}, isCreatingArea: ${isCreatingArea}, isPainting: ${isPainting}`);
    drawMap();
  }, [mapData, activeAreaId, isCreatingArea, tempPoints, tempPaintedCells, drawMode, isPainting, zoom, pan, gridSize]);
  
  // Draw the map on the canvas
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Update canvas dimensions if needed
    if (canvas.width !== mapData.width || canvas.height !== mapData.height) {
      canvas.width = mapData.width;
      canvas.height = mapData.height;
    }
    
    // Clear canvas with a dark background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformation
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw background grid
    drawGrid(ctx, canvas.width / zoom, canvas.height / zoom);
    
    // Log drawing state
    console.log(`Drawing map with ${mapData.areas.length} areas, activeAreaId: ${activeAreaId}, tempPaintedCells: ${tempPaintedCells.length}`);
    
    // Draw all areas
    mapData.areas.forEach(area => {
      const isActive = area.id === activeAreaId;
      
      // Draw polygon areas
      if (area.points && area.points.length >= 3) {
        drawArea(ctx, area, isActive);
      }
      
      // Draw painted areas (cells)
      if (area.cells && area.cells.length > 0) {
        console.log(`Drawing area ${area.id} with ${area.cells.length} cells, color: ${area.color}`);
        drawPaintedCells(ctx, area.cells, area.color, isActive);
      }
    });
    
    // Draw area being created
    if (isCreatingArea && tempPoints.length > 0) {
      drawTempArea(ctx, tempPoints);
    }
    
    // Draw temporary painted cells when using brush
    if (tempPaintedCells.length > 0) {
      console.log(`Drawing ${tempPaintedCells.length} temporary painted cells with color ${currentPaintColor}`);
      drawPaintedCells(ctx, tempPaintedCells, currentPaintColor, true);
    }
    
    // Restore the canvas context
    ctx.restore();
  };
  
  // Draw background grid with zoom and pan support
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#8c8c8c';
    ctx.lineWidth = 0.5;
    
    // Calculate grid boundaries with panning offset
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
    const endX = startX + width + gridSize * 2;
    const endY = startY + height + gridSize * 2;
    
    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    // Draw axes at origin for reference
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
  };
  
  // Draw painted cells
  const drawPaintedCells = (ctx: CanvasRenderingContext2D, cells: GridCell[], color: string, isActive: boolean) => {
    console.log(`Drawing ${cells.length} painted cells with color ${color}`);
    cells.forEach(cell => {
      ctx.fillStyle = color + (isActive ? 'FF' : '99'); // Full or 60% opacity
      ctx.fillRect(cell.x, cell.y, gridSize, gridSize);
      
      // Draw cell border
      ctx.strokeStyle = isActive ? '#ffffff' : '#cccccc';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(cell.x, cell.y, gridSize, gridSize);
    });
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
    
    if (points.length > 2) {
      // Close the path if we have enough points
      ctx.closePath();
      ctx.fillStyle = currentPaintColor + '80'; // 50% opacity
      ctx.fill();
    }
    
    // Draw the line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
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
  };
  
  // Calculate the centroid of a polygon
  const calculateCentroid = (points: Point[]): Point => {
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
  
  // Get mouse coordinates with zoom and pan adjustments
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scale factors in case the canvas is being displayed at a different size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get relative mouse position and apply scaling
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;
    
    // Apply boundary checks to ensure coordinates stay within canvas
    x = Math.max(0, Math.min(x, canvas.width));
    y = Math.max(0, Math.min(y, canvas.height));
    
    // Adjust for zoom and pan
    x = (x - pan.x) / zoom;
    y = (y - pan.y) / zoom;
    
    console.log(`Raw mouse at (${e.clientX}, ${e.clientY}), canvas coordinates: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    
    return { x, y };
  };
  
  // Get cell coordinates with zoom and pan adjustments
  const getCellFromPosition = (x: number, y: number): GridCell => {
    // Make sure to get the exact grid position by properly snapping to grid
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);
    
    // Calculate the exact cell coordinates
    const cellX = gridX * gridSize;
    const cellY = gridY * gridSize;
    
    // Ensure these values are within canvas boundaries
    const maxGridX = Math.floor((canvasRef.current?.width || 1200) / gridSize - 1);
    const maxGridY = Math.floor((canvasRef.current?.height || 1200) / gridSize - 1);
    
    const safeGridX = Math.max(0, Math.min(gridX, maxGridX));
    const safeGridY = Math.max(0, Math.min(gridY, maxGridY));
    const safeCellX = safeGridX * gridSize;
    const safeCellY = safeGridY * gridSize;
    
    console.log(`Converting position (${x}, ${y}) to grid (${safeGridX}, ${safeGridY}) at cell (${safeCellX}, ${safeCellY})`);
    
    return {
      x: safeCellX,
      y: safeCellY,
      gridX: safeGridX,
      gridY: safeGridY
    };
  };
  
  // Check if a cell already exists in the current painted cells
  const cellExists = (cells: GridCell[], newCell: GridCell): boolean => {
    const exists = cells.some(cell => cell.gridX === newCell.gridX && cell.gridY === newCell.gridY);
    console.log(`Checking if cell (${newCell.gridX}, ${newCell.gridY}) exists: ${exists}`);
    return exists;
  };
  
  // Keep track of the last valid cell to handle fast movement
  const [lastValidCell, setLastValidCell] = useState<GridCell | null>(null);
  
  // Handle canvas mouse down with support for panning
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // If panning mode is active, start panning
    if (activeToolMode === 'pan') {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    const { x, y } = getCanvasCoordinates(e);
    
    console.log(`MouseDown at (${x}, ${y}), drawMode: ${drawMode}`);
    
    // If we're in paint brush mode
    if (drawMode === 'brush') {
      console.log("Brush tool is active, processing click");
      
      // Add the clicked cell
      const cell = getCellFromPosition(x, y);
      setLastValidCell(cell); // Update the last valid cell
      
      console.log(`Adding cell at grid position (${cell.gridX}, ${cell.gridY})`);
      
      // Only add if not already in tempPaintedCells
      if (!cellExists(tempPaintedCells, cell)) {
        console.log(`Cell is new, adding to tempPaintedCells (now ${tempPaintedCells.length + 1} cells)`);
        const updatedCells = [...tempPaintedCells, cell];
        setTempPaintedCells(updatedCells);
        console.log("Updated tempPaintedCells:", updatedCells);
        
        // Add to undo history
        setUndoHistory([...undoHistory, { 
          type: 'PAINT_CELL', 
          cell,
          color: currentPaintColor
        }]);
      } else {
        console.log("Cell already exists in tempPaintedCells, not adding");
      }
      return;
    }
    
    // If we're creating a new area with polygon tool
    if (isCreatingArea) {
      const newPoint = { x, y };
      setTempPoints([...tempPoints, newPoint]);
      
      // Add to undo history
      setUndoHistory([...undoHistory, { 
        type: 'ADD_POLYGON_POINT', 
        pointIndex: tempPoints.length,
        areaId: null
      }]);
      
      return;
    }
    
    // Check if we're clicking on a point of the active area for dragging
    if (activeAreaId) {
      const activeArea = mapData.areas.find(area => area.id === activeAreaId);
      if (activeArea && activeArea.points) {
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
      
      // Check polygon areas
      if (area.points && area.points.length >= 3 && isPointInPolygon({ x, y }, area.points)) {
        setActiveAreaId(area.id);
        setLastMousePos({ x, y });
        return;
      }
      
      // Check painted areas (cells)
      if (area.cells && area.cells.length > 0) {
        const cell = getCellFromPosition(x, y);
        if (cellExists(area.cells, cell)) {
          setActiveAreaId(area.id);
          setLastMousePos({ x, y });
          return;
        }
      }
    }
    
    // If we clicked on empty space
    setActiveAreaId(null);
  };
  
  // Track if mouse is currently over the canvas
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
  
  // Handle mouse move with support for panning
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsMouseOverCanvas(true);
    
    // Handle panning
    if (isPanning && lastMousePos) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      
      setPan(prevPan => ({
        x: prevPan.x + dx,
        y: prevPan.y + dy
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    const { x, y } = getCanvasCoordinates(e);
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    // If we're painting with brush (only in drag mode)
    if (e.buttons === 1 && drawMode === 'brush') {
      console.log(`MouseMove with button pressed, attempting to paint at (${x}, ${y})`);
      const cell = getCellFromPosition(x, y);
      setLastValidCell(cell); // Update the last valid cell
      
      // Only add cell if it doesn't already exist in tempPaintedCells
      if (!cellExists(tempPaintedCells, cell)) {
        console.log(`Adding dragged cell at (${cell.gridX}, ${cell.gridY})`);
        const updatedCells = [...tempPaintedCells, cell];
        setTempPaintedCells(updatedCells);
        
        // Add to undo history
        setUndoHistory([...undoHistory, { 
          type: 'PAINT_CELL', 
          cell,
          color: currentPaintColor
        }]);
      }
      return;
    }
    
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
  
  // Handle mouse up with support for panning
  const handleCanvasMouseUp = () => {
    console.log("Canvas mouseUp event");
    setIsPanning(false);
    setIsDraggingPoint(false);
    setDraggingPointIndex(null);
    setDraggingAreaId(null);
  };
  
  // Add event listeners for window mouse up to handle cases when mouse is released outside canvas
  useEffect(() => {
    const handleWindowMouseUp = (e: MouseEvent) => {
      if (!isMouseOverCanvas) {
        console.log("Window mouseUp event (outside canvas)");
        handleCanvasMouseUp();
      }
    };
    
    // Add global event listeners
    window.addEventListener('mouseup', handleWindowMouseUp);
    
    // Cleanup
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isMouseOverCanvas]);
  
  // Perform undo action
  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    
    const lastAction = undoHistory[undoHistory.length - 1];
    
    // Handle different undo actions
    if (lastAction.type === 'ADD_POLYGON_POINT') {
      setTempPoints(tempPoints.slice(0, -1));
    } else if (lastAction.type === 'PAINT_CELL') {
      setTempPaintedCells(tempPaintedCells.filter(cell => 
        !(cell.gridX === lastAction.cell.gridX && cell.gridY === lastAction.cell.gridY)
      ));
    } else if (lastAction.type === 'ADD_NAV_NODE') {
      setMapData(prev => ({
        ...prev,
        navGraph: prev.navGraph.filter(node => node.id !== lastAction.nodeId)
      }));
    } else if (lastAction.type === 'ADD_COLLISION') {
      setMapData(prev => ({
        ...prev,
        collisionMesh: prev.collisionMesh.filter(boundary => boundary.id !== lastAction.boundaryId)
      }));
    }
    
    // Remove the action from history
    setUndoHistory(undoHistory.slice(0, -1));
    
    // Force canvas update
    drawMap();
    
    // Record the undo action metric
    recordUserInteraction('MapBuilder', 'undo', {
      actionType: lastAction.type
    });
  };
  
  // Start painting with brush
  const startPaintingMode = () => {
    console.log("Activating brush tool");
    setDrawMode('brush');
    setIsCreatingArea(false);
    setTempPoints([]);
    setActiveAreaId(null);
    // Initialize but don't clear existing painted cells
    if (tempPaintedCells.length === 0) {
      console.log("Initializing empty tempPaintedCells array");
    } else {
      console.log(`Keeping ${tempPaintedCells.length} existing painted cells`);
    }
  };
  
  // Start polygon drawing mode
  const startPolygonMode = () => {
    setDrawMode('polygon');
    setIsPainting(false);
    setTempPaintedCells([]);
  };
  
  // Finish painting with brush
  const finishPainting = () => {
    console.log(`Finishing painting with ${tempPaintedCells.length} cells`);
    if (tempPaintedCells.length === 0) {
      showSnackbar('No cells painted', 'error');
      return;
    }
    
    setIsPainting(false);
    const newAreaId = `area-${Date.now()}`;
    console.log(`Creating new area with ID: ${newAreaId}`);
    setCurrentArea({
      id: newAreaId,
      name: 'Painted Area',
      type: 'connector',
      color: currentPaintColor,
      points: [],
      cells: tempPaintedCells,
      walkable: true,
      tactical: false,
    });
    setShowAreaForm(true);
  };
  
  // Cancel painting
  const cancelPainting = () => {
    console.log("Canceling painting, clearing cells");
    setIsPainting(false);
    setTempPaintedCells([]);
    // Clear undo history related to this painting session
    setUndoHistory(undoHistory.filter(action => action.type !== 'PAINT_CELL'));
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
  
  // Start creating a new area with polygon tool
  const startCreatingArea = () => {
    setDrawMode('polygon');
    setIsCreatingArea(true);
    setTempPoints([]);
    setActiveAreaId(null);
  };
  
  // Finish creating the current area with polygon tool
  const finishCreatingArea = () => {
    if (tempPoints.length < 3) {
      showSnackbar("You need at least 3 points to create an area.", "warning");
      return;
    }
    
    setIsCreatingArea(false);
    setShowAreaForm(true);
    
    // Create a new temporary area
    const newArea: MapArea = {
      id: uuidv4(),
      name: "",
      type: "connector",
      color: AREA_TYPES['connector'].color,
      points: [...tempPoints],
      walkable: AREA_TYPES['connector'].walkable,
      tactical: AREA_TYPES['connector'].tactical,
    };
    
    setCurrentArea(newArea);
    
    // Record the area creation metric
    recordMapBuilderMetric('create', 'area', 1);
    recordUserInteraction('MapBuilder', 'finish_creating_area', {
      pointCount: tempPoints.length
    });
  };
  
  // Cancel creating the current area
  const cancelCreatingArea = () => {
    setIsCreatingArea(false);
    setTempPoints([]);
    // Clear undo history related to this polygon creation
    setUndoHistory(undoHistory.filter(action => 
      action.type !== 'ADD_POLYGON_POINT' || action.areaId !== null
    ));
  };
  
  // Save area after form submission
  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentArea) return;
    
    const isNew = !mapData.areas.find(area => area.id === currentArea.id);
    
    // Create a new array with the modified areas
    const updatedAreas = isNew
      ? [...mapData.areas, currentArea]
      : mapData.areas.map(area => area.id === currentArea.id ? currentArea : area);
    
    // Update the map data with the new areas
    setMapData({
      ...mapData,
      areas: updatedAreas
    });
    
    // Reset state
    setShowAreaForm(false);
    setCurrentArea(null);
    setTempPoints([]);
    
    // Force canvas update
    drawMap();
    
    // Record the area save metric
    recordMapBuilderMetric(isNew ? 'create' : 'edit', 'area', 1);
    recordUserInteraction('MapBuilder', isNew ? 'save_new_area' : 'update_area', {
      areaId: currentArea.id,
      areaType: currentArea.type,
      areaName: currentArea.name
    });
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
    
    // Find the area
    const areaToDelete = mapData.areas.find(area => area.id === activeAreaId);
    if (!areaToDelete) return;
    
    // Create a new array without the deleted area
    const updatedAreas = mapData.areas.filter(area => area.id !== activeAreaId);
    
    // Update the map data
    setMapData({
      ...mapData,
      areas: updatedAreas
    });
    
    // Reset the active area
    setActiveAreaId(null);
    
    // Force canvas update
    drawMap();
    
    // Record the area deletion metric
    recordMapBuilderMetric('delete', 'area', 1);
    recordUserInteraction('MapBuilder', 'delete_area', {
      areaId: activeAreaId,
      areaType: areaToDelete.type,
      areaName: areaToDelete.name
    });
  };
  
  // Add new function to generate navigation nodes in an area
  const generateNavNodesForArea = (area: MapArea, density: number = 3): NavNode[] => {
    if (area.points.length < 3) return [];
    
    const nodes: NavNode[] = [];
    const centroid = calculateCentroid(area.points);
    
    // Create a central node
    const centralNode: NavNode = {
      id: `node_${area.id}_center`,
      position: centroid,
      connections: [],
      areaId: area.id,
      cost: area.tactical ? 2 : 1, // Higher cost for tactical areas
      type: area.tactical ? 'tactical' : 'normal'
    };
    nodes.push(centralNode);
    
    // Create nodes along the boundary
    const boundaryNodes: NavNode[] = [];
    for (let i = 0; i < area.points.length; i++) {
      const start = area.points[i];
      const end = area.points[(i + 1) % area.points.length];
      
      // Create nodes along each edge of the polygon
      for (let j = 1; j <= density; j++) {
        const t = j / (density + 1);
        const position = {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t
        };
        
        const node: NavNode = {
          id: `node_${area.id}_edge${i}_${j}`,
          position,
          connections: [],
          areaId: area.id,
          cost: 1,
          type: 'normal'
        };
        boundaryNodes.push(node);
      }
    }
    
    // Connect boundary nodes to the central node and adjacent boundary nodes
    boundaryNodes.forEach((node, index) => {
      node.connections.push(centralNode.id);
      centralNode.connections.push(node.id);
      
      // Connect to adjacent boundary nodes
      const prevIndex = (index === 0) ? boundaryNodes.length - 1 : index - 1;
      const nextIndex = (index === boundaryNodes.length - 1) ? 0 : index + 1;
      
      node.connections.push(boundaryNodes[prevIndex].id);
      node.connections.push(boundaryNodes[nextIndex].id);
    });
    
    return [centralNode, ...boundaryNodes];
  };
  
  // Function to connect navigation nodes between adjacent areas
  const connectAdjacentAreas = (areas: MapArea[], navGraph: NavNode[]): NavNode[] => {
    const updatedGraph = [...navGraph];
    
    // Check each pair of areas for adjacency
    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const area1 = areas[i];
        const area2 = areas[j];
        
        if (!area1.navNodes || !area2.navNodes) continue;
        
        // Find nodes that are close to each other
        for (const node1 of area1.navNodes) {
          for (const node2 of area2.navNodes) {
            const distance = Math.sqrt(
              Math.pow(node1.position.x - node2.position.x, 2) +
              Math.pow(node1.position.y - node2.position.y, 2)
            );
            
            // If nodes are close enough, connect them
            if (distance < 50) { // Threshold distance
              const node1Index = updatedGraph.findIndex(n => n.id === node1.id);
              const node2Index = updatedGraph.findIndex(n => n.id === node2.id);
              
              if (node1Index >= 0 && node2Index >= 0) {
                // Add connections if they don't already exist
                if (!updatedGraph[node1Index].connections.includes(node2.id)) {
                  updatedGraph[node1Index].connections.push(node2.id);
                }
                
                if (!updatedGraph[node2Index].connections.includes(node1.id)) {
                  updatedGraph[node2Index].connections.push(node1.id);
                }
                
                // Mark as choke points if the areas are of different types
                if (area1.type !== area2.type) {
                  if (updatedGraph[node1Index].type !== 'tactical') {
                    updatedGraph[node1Index].type = 'choke';
                    updatedGraph[node1Index].cost += 1;
                  }
                  
                  if (updatedGraph[node2Index].type !== 'tactical') {
                    updatedGraph[node2Index].type = 'choke';
                    updatedGraph[node2Index].cost += 1;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return updatedGraph;
  };
  
  // Function to generate collision boundaries from area polygons
  const generateCollisionBoundaries = (area: MapArea): CollisionBoundary[] => {
    const boundaries: CollisionBoundary[] = [];
    
    // Skip if area doesn't have enough points for a polygon
    if (area.points.length < 3) return boundaries;
    
    // If the area is not walkable, create a solid boundary
    if (!area.walkable) {
      boundaries.push({
        id: `collision_${area.id}_solid`,
        points: [...area.points],
        type: 'wall',
        height: 100 // Full height wall
      });
      return boundaries;
    }
    
    // For walkable areas, create boundary borders
    for (let i = 0; i < area.points.length; i++) {
      const start = area.points[i];
      const end = area.points[(i + 1) % area.points.length];
      
      // Check if this edge is shared with another walkable area
      // If it is, don't create a boundary
      let isSharedEdge = false;
      
      for (const otherArea of mapData.areas) {
        if (otherArea.id === area.id || !otherArea.walkable || otherArea.points.length < 3) continue;
        
        // Check each edge of the other area
        for (let j = 0; j < otherArea.points.length; j++) {
          const otherStart = otherArea.points[j];
          const otherEnd = otherArea.points[(j + 1) % otherArea.points.length];
          
          // Check if edges overlap
          if ((arePointsClose(start, otherStart) && arePointsClose(end, otherEnd)) ||
              (arePointsClose(start, otherEnd) && arePointsClose(end, otherStart))) {
            isSharedEdge = true;
            break;
          }
        }
        
        if (isSharedEdge) break;
      }
      
      // If not a shared edge, create a boundary
      if (!isSharedEdge) {
        boundaries.push({
          id: `collision_${area.id}_edge${i}`,
          points: [start, end],
          type: 'wall',
          height: 100 // Full height wall
        });
      }
    }
    
    return boundaries;
  };
  
  // Utility function to check if two points are close enough to be considered the same
  const arePointsClose = (p1: Point, p2: Point, threshold: number = 5): boolean => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < threshold;
  };
  
  // Function to identify and mark choke points
  const identifyChokePoints = (areas: MapArea[]): Point[] => {
    const chokePoints: Point[] = [];
    
    // Identify choke points between areas
    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const area1 = areas[i];
        const area2 = areas[j];
        
        if (!area1.walkable || !area2.walkable) continue;
        
        // Find common edges or close points
        for (let k = 0; k < area1.points.length; k++) {
          const start1 = area1.points[k];
          const end1 = area1.points[(k + 1) % area1.points.length];
          
          for (let l = 0; l < area2.points.length; l++) {
            const start2 = area2.points[l];
            const end2 = area2.points[(l + 1) % area2.points.length];
            
            // Check for overlapping or close edges
            if (linesIntersect(start1, end1, start2, end2) ||
                (arePointsClose(start1, start2) && arePointsClose(end1, end2)) ||
                (arePointsClose(start1, end2) && arePointsClose(end1, start2))) {
              
              // Calculate midpoint of the shared edge
              const midpoint = {
                x: (start1.x + end1.x + start2.x + end2.x) / 4,
                y: (start1.y + end1.y + start2.y + end2.y) / 4
              };
              
              chokePoints.push(midpoint);
            }
          }
        }
      }
    }
    
    return chokePoints;
  };
  
  // Function to check if two line segments intersect
  const linesIntersect = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
    // Calculate direction vectors
    const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const d2 = { x: p4.x - p3.x, y: p4.y - p3.y };
    
    // Calculate the cross product denominator
    const denom = d1.x * d2.y - d1.y * d2.x;
    
    // If lines are parallel
    if (Math.abs(denom) < 0.0001) return false;
    
    // Calculate parameters for both lines
    const d3 = { x: p3.x - p1.x, y: p3.y - p1.y };
    const t = (d3.x * d2.y - d3.y * d2.x) / denom;
    const u = (d3.x * d1.y - d3.y * d1.x) / denom;
    
    // Check if intersection is within both line segments
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };
  
  // Generate line of sight between two points, checking for obstacles
  const checkLineOfSight = (start: Point, end: Point): boolean => {
    // Check if line of sight is blocked by any non-walkable area
    for (const area of mapData.areas) {
      if (!area.walkable && area.points.length >= 3) {
        // Check if the line intersects with any edge of the polygon
        for (let i = 0; i < area.points.length; i++) {
          const p1 = area.points[i];
          const p2 = area.points[(i + 1) % area.points.length];
          
          if (linesIntersect(start, end, p1, p2)) {
            return false; // Line of sight is blocked
          }
        }
      }
    }
    
    return true; // Line of sight is clear
  };
  
  // Function to generate all important sightlines on the map
  const generateSightlines = (): { start: Point, end: Point, blocked: boolean }[] => {
    const sightlines: { start: Point, end: Point, blocked: boolean }[] = [];
    const tacticalPoints: Point[] = [];
    
    // Collect tactical points (area centroids, bombsites, etc.)
    for (const area of mapData.areas) {
      if (area.tactical && area.points.length >= 3) {
        tacticalPoints.push(calculateCentroid(area.points));
      }
    }
    
    // Add bombsites
    if (mapData.bombsites.a) tacticalPoints.push(...mapData.bombsites.a);
    if (mapData.bombsites.b) tacticalPoints.push(...mapData.bombsites.b);
    if (mapData.bombsites.c) tacticalPoints.push(...mapData.bombsites.c);
    
    // Add choke points
    tacticalPoints.push(...mapData.chokePoints);
    
    // Generate sightlines between tactical points
    for (let i = 0; i < tacticalPoints.length; i++) {
      for (let j = i + 1; j < tacticalPoints.length; j++) {
        const start = tacticalPoints[i];
        const end = tacticalPoints[j];
        
        const isBlocked = !checkLineOfSight(start, end);
        sightlines.push({ start, end, blocked: isBlocked });
      }
    }
    
    return sightlines;
  };
  
  // Enhanced function to prepare map data for saving
  const prepareMapDataForSave = (): MapData => {
    // Create a copy of the current map data
    const enhancedMapData: MapData = {
      ...mapData,
      name: mapName,
      width: canvasRef.current?.width || 1200,
      height: canvasRef.current?.height || 1200,
      gridSize: gridSize,
    };
    
    // Process each area to add necessary gameplay information
    const processedAreas = enhancedMapData.areas.map(area => {
      // Default walkable and tactical properties based on area type
      const areaType = area.type && AREA_TYPES[area.type as keyof typeof AREA_TYPES] 
        ? AREA_TYPES[area.type as keyof typeof AREA_TYPES] 
        : AREA_TYPES['connector'];
      
      const processedArea: MapArea = {
        ...area,
        walkable: areaType.walkable,
        tactical: areaType.tactical,
        team: areaType.team as 'attackers' | 'defenders' | 'neutral',
      };
      
      // Generate nav nodes if area is walkable
      if (processedArea.walkable) {
        processedArea.navNodes = generateNavNodesForArea(processedArea);
      }
      
      // Generate collision boundaries
      processedArea.collisionBoundaries = generateCollisionBoundaries(processedArea);
      
      return processedArea;
    });
    
    enhancedMapData.areas = processedAreas;
    
    // Collect all nav nodes
    const allNavNodes: NavNode[] = [];
    for (const area of processedAreas) {
      if (area.navNodes) {
        allNavNodes.push(...area.navNodes);
      }
    }
    
    // Connect adjacent areas in the navigation graph
    enhancedMapData.navGraph = connectAdjacentAreas(processedAreas, allNavNodes);
    
    // Collect all collision boundaries
    const allCollisionBoundaries: CollisionBoundary[] = [];
    for (const area of processedAreas) {
      if (area.collisionBoundaries) {
        allCollisionBoundaries.push(...area.collisionBoundaries);
      }
    }
    enhancedMapData.collisionMesh = allCollisionBoundaries;
    
    // Identify spawn points
    enhancedMapData.spawnPoints = {
      attackers: [],
      defenders: []
    };
    
    for (const area of processedAreas) {
      if (area.type === 'attacker-spawn' && area.points.length >= 3) {
        const center = calculateCentroid(area.points);
        enhancedMapData.spawnPoints.attackers.push(center);
      } else if (area.type === 'defender-spawn' && area.points.length >= 3) {
        const center = calculateCentroid(area.points);
        enhancedMapData.spawnPoints.defenders.push(center);
      }
    }
    
    // Identify bombsites
    enhancedMapData.bombsites = {};
    for (const area of processedAreas) {
      if (area.type === 'site' && area.points.length >= 3) {
        const center = calculateCentroid(area.points);
        
        // Determine site label from area name
        const siteLabel = area.name.toLowerCase().includes('a') ? 'a' : 
                          area.name.toLowerCase().includes('b') ? 'b' :
                          area.name.toLowerCase().includes('c') ? 'c' : null;
        
        if (siteLabel) {
          enhancedMapData.bombsites[siteLabel] = enhancedMapData.bombsites[siteLabel] || [];
          enhancedMapData.bombsites[siteLabel]?.push(center);
        }
      }
    }
    
    // Identify choke points
    enhancedMapData.chokePoints = identifyChokePoints(processedAreas);
    
    // Generate sightlines
    enhancedMapData.sightlines = generateSightlines();
    
    return enhancedMapData;
  };
  
  // Override the saveMap function
  const saveMap = () => {
    if (mapData.areas.length === 0) {
      showSnackbar('Map must have at least one area', 'error');
      return;
    }
    
    const enhancedMapData = prepareMapDataForSave();
    
    // Save to localStorage
    try {
      const mapId = mapName.toLowerCase().replace(/\s+/g, '_');
      localStorage.setItem(`map_${mapId}`, JSON.stringify(enhancedMapData));
      showSnackbar(`Map "${mapName}" saved locally`, 'success');
      
      // Also try to save to backend
      saveMapToBackend(enhancedMapData);
    } catch (error) {
      console.error('Error saving map:', error);
      showSnackbar('Error saving map locally', 'error');
    }
  };
  
  // Override the saveMapToBackend function to fix the type issue with onClick
  const saveMapToBackend = async (data?: MapData) => {
    try {
      setIsSaving(true);
      
      // Prepare the map data for saving if not provided
      const mapToSave = data || prepareMapDataForSave();
      
      // Log the map data for debugging
      console.log("Saving map data to backend:", mapToSave);
      
      // Simulate save operation for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Replace with actual API call
      
      // Show success message
      showSnackbar("Map saved successfully!", "success");
      
      // Update map name in state
      mapToSave.name = mapName;
      setMapData(mapToSave);
      
      // Call the callback if provided
      if (onSaveComplete) {
        onSaveComplete(mapToSave);
      }
      
      // Record successful save metric
      recordMapBuilderMetric('save', 'map', 1);
      
      return mapToSave;
    } catch (error) {
      console.error("Error saving map:", error);
      showSnackbar("Failed to save map. Please try again.", "error");
      
      // Record the error
      recordError('api_error', 'saveMapToBackend', error instanceof Error ? error.message : 'Unknown error');
      
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Load map from file
  const handleLoadMapFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const mapData = JSON.parse(event.target?.result as string) as MapData;
        setMapData(mapData);
        setMapName(mapData.name);
        showSnackbar('Map loaded successfully', 'success');
      } catch (error) {
        showSnackbar('Error loading map file', 'error');
        console.error('Error loading map file:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Display snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Set area type and automatically set corresponding color
  const handleSetAreaType = (type: string) => {
    if (!currentArea) return;
    
    const color = AREA_TYPES[type as keyof typeof AREA_TYPES]?.color || '#cccccc';
    setCurrentArea({
      ...currentArea,
      type,
      color
    });
  };
  
  // Set current paint color based on area type
  const handleSetPaintColor = (type: string) => {
    const color = AREA_TYPES[type as keyof typeof AREA_TYPES]?.color || '#cccccc';
    setCurrentPaintColor(color);
  };
  
  // Explicitly forceUpdate function to refresh the canvas when needed
  const forceCanvasUpdate = () => {
    console.log("Forcing canvas update");
    drawMap();
  };
  
  // We'll create a wrapper function that properly handles the onClick event
  const handleSaveToBackend = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Record the user interaction
    recordUserInteraction('MapBuilder', 'save_map_to_backend', {
      mapName,
      areasCount: mapData.areas.length,
      navNodeCount: mapData.navGraph.length,
      collisionBoundaryCount: mapData.collisionMesh.length
    });
    
    saveMapToBackend();
  };

  // Add a useEffect to track tab changes for metrics
  useEffect(() => {
    if (activeTab) {
      recordUserInteraction('MapBuilder', 'change_tab', {
        tab: activeTab
      });
    }
  }, [activeTab]);
  
  // Add a useEffect to track initial load
  useEffect(() => {
    recordUserInteraction('MapBuilder', 'component_loaded', {
      hasExistingData: mapData.areas.length > 0
    });
  }, []);

  // Function to handle zoom in
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, 5)); // Limit max zoom to 5x
    
    // Record the zoom action metric
    recordUserInteraction('MapBuilder', 'zoom_in', {
      newZoom: zoom * 1.2
    });
  };
  
  // Function to handle zoom out
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.2)); // Limit min zoom to 0.2x
    
    // Record the zoom action metric
    recordUserInteraction('MapBuilder', 'zoom_out', {
      newZoom: zoom / 1.2
    });
  };
  
  // Function to reset zoom and pan
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    
    // Record the reset view action metric
    recordUserInteraction('MapBuilder', 'reset_view');
  };
  
  // Function to toggle between drawing and panning tools
  const handleToolModeChange = (mode: 'draw' | 'pan') => {
    setActiveToolMode(mode);
    
    // If switching to draw mode, ensure we're not panning
    if (mode === 'draw') {
      setIsPanning(false);
    }
    
    // Record the tool change metric
    recordUserInteraction('MapBuilder', 'change_tool_mode', { mode });
  };
  
  // Function to apply grid size changes
  const applyGridSettings = () => {
    // Update grid size state and map data
    setGridSize(gridWidth);
    setMapData(prev => ({
      ...prev,
      gridSize: gridWidth,
      width: canvasRef.current?.width || 1200,
      height: canvasRef.current?.height || 1200
    }));
    
    // Close the settings dialog
    setShowGridSettings(false);
    
    // Record grid size change metric
    recordMapBuilderMetric('update', 'grid_size', 1);
    recordUserInteraction('MapBuilder', 'update_grid_size', {
      width: gridWidth,
      height: gridHeight
    });
  };

  // Handle mouse entering canvas
  const handleCanvasMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseOverCanvas(true);
    console.log("Mouse entered canvas");
    
    // If button is pressed and we have a last valid cell, continue from there
    if (e.buttons === 1 && drawMode === 'brush' && lastValidCell) {
      const { x, y } = getCanvasCoordinates(e);
      console.log(`Mouse re-entered with button down, connecting from last valid cell at (${lastValidCell.gridX}, ${lastValidCell.gridY})`);
      
      // Use linear interpolation to fill in missing cells between last valid cell and current position
      const currentCell = getCellFromPosition(x, y);
      interpolateCells(lastValidCell, currentCell);
    }
  };
  
  // Handle mouse leaving canvas
  const handleCanvasMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseOverCanvas(false);
    console.log("Mouse left canvas");
    handleCanvasMouseUp();
  };
  
  // Interpolate cells between two points for continuous painting when mouse moves fast
  const interpolateCells = (startCell: GridCell, endCell: GridCell) => {
    console.log(`Interpolating cells from (${startCell.gridX}, ${startCell.gridY}) to (${endCell.gridX}, ${endCell.gridY})`);
    
    // Calculate the differences and determine number of steps needed for interpolation
    const dx = endCell.gridX - startCell.gridX;
    const dy = endCell.gridY - startCell.gridY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    if (steps <= 1) {
      console.log("No interpolation needed, cells are adjacent");
      return; // No interpolation needed for adjacent cells
    }
    
    console.log(`Interpolating ${steps} steps`);
    const newCells: GridCell[] = [];
    
    // Generate the interpolated cells
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const interpGridX = Math.round(startCell.gridX + dx * t);
      const interpGridY = Math.round(startCell.gridY + dy * t);
      const interpCellX = interpGridX * gridSize;
      const interpCellY = interpGridY * gridSize;
      
      const interpCell: GridCell = {
        x: interpCellX,
        y: interpCellY,
        gridX: interpGridX,
        gridY: interpGridY
      };
      
      // Only add if the cell doesn't already exist in tempPaintedCells
      if (!cellExists(tempPaintedCells, interpCell) && 
          !newCells.some(cell => cell.gridX === interpCell.gridX && cell.gridY === interpCell.gridY)) {
        console.log(`Adding interpolated cell at (${interpCell.gridX}, ${interpCell.gridY})`);
        newCells.push(interpCell);
      }
    }
    
    if (newCells.length > 0) {
      // Add all the new cells at once
      console.log(`Adding ${newCells.length} interpolated cells`);
      setTempPaintedCells([...tempPaintedCells, ...newCells]);
      
      // Add each cell to the undo history
      const newUndoHistory = [...undoHistory];
      newCells.forEach(cell => {
        newUndoHistory.push({
          type: 'PAINT_CELL',
          cell,
          color: currentPaintColor
        });
      });
      setUndoHistory(newUndoHistory);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%' 
    }}>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Map Name"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {/* Tool Mode Selector */}
              <ToggleButtonGroup
                value={activeToolMode}
                exclusive
                size="small"
                aria-label="tool mode"
                sx={{ mr: 1 }}
              >
                <ToggleButton 
                  value="draw" 
                  onClick={() => handleToolModeChange('draw')}
                  aria-label="draw tool"
                >
                  <Tooltip title="Drawing Tools">
                    <BrushIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton 
                  value="pan" 
                  onClick={() => handleToolModeChange('pan')}
                  aria-label="pan tool"
                >
                  <Tooltip title="Pan Tool">
                    <PanToolIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              {/* Zoom Controls */}
              <ButtonGroup size="small" aria-label="zoom controls" sx={{ mr: 1 }}>
                <Tooltip title="Zoom In">
                  <Button onClick={handleZoomIn}>
                    <ZoomInIcon />
                  </Button>
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <Button onClick={handleZoomOut}>
                    <ZoomOutIcon />
                  </Button>
                </Tooltip>
                <Tooltip title="Reset View">
                  <Button onClick={handleResetView}>
                    <FitScreenIcon />
                  </Button>
                </Tooltip>
              </ButtonGroup>
              
              {/* Grid Settings Button */}
              <Tooltip title="Grid Settings">
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setShowGridSettings(true)} 
                  sx={{ mr: 1 }}
                >
                  <SettingsIcon sx={{ mr: 0.5 }} /> Grid
                </Button>
              </Tooltip>
              
              {/* Only show drawing tools when in draw mode */}
              {activeToolMode === 'draw' && (
                <>
                  {/* Drawing Mode Selector */}
                  <ToggleButtonGroup
                    value={drawMode}
                    exclusive
                    size="small"
                    aria-label="drawing mode"
                  >
                    <ToggleButton 
                      value="polygon" 
                      onClick={startPolygonMode}
                      aria-label="polygon tool"
                    >
                      <Tooltip title="Polygon Tool">
                        <PolylineIcon />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton 
                      value="brush" 
                      onClick={() => {
                        console.log("Brush tool button clicked");
                        startPaintingMode();
                        // Force redraw after short delay to ensure state is updated
                        setTimeout(forceCanvasUpdate, 100);
                      }}
                      aria-label="brush tool"
                    >
                      <Tooltip title="Brush Tool (Click to paint squares)">
                        <BrushIcon />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  {/* Color Selector */}
                  <FormControl size="small" sx={{ minWidth: 120, mx: 1 }}>
                    <InputLabel id="area-type-label">Area Type</InputLabel>
                    <Select
                      labelId="area-type-label"
                      value={Object.keys(AREA_TYPES).find(
                        key => AREA_TYPES[key as keyof typeof AREA_TYPES]?.color === currentPaintColor
                      ) || 'connector'}
                      label="Area Type"
                      onChange={(e) => handleSetPaintColor(e.target.value)}
                      size="small"
                    >
                      {Object.entries(AREA_TYPES).map(([type, { color }]) => (
                        <MenuItem key={type} value={type}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              mr: 1,
                              backgroundColor: color,
                              display: 'inline-block',
                              verticalAlign: 'text-bottom',
                            }}
                          />
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={startCreatingArea}
                    disabled={isCreatingArea || isPainting}
                    size="small"
                  >
                    Add Area
                  </Button>
                  
                  <Tooltip title="Undo Last Action">
                    <span>
                      <IconButton 
                        onClick={handleUndo} 
                        disabled={undoHistory.length === 0}
                        size="small"
                      >
                        <UndoIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Divider orientation="vertical" flexItem />
                  
                  {activeAreaId && (
                    <>
                      <Button 
                        variant="outlined" 
                        startIcon={<EditIcon />}
                        onClick={handleEditArea}
                        size="small"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteArea}
                        size="small"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </>
              )}
              
              <Divider orientation="vertical" flexItem />
              
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSaveToBackend}
                disabled={isSaving}
                size="small"
              >
                Save to Server
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={saveMap}
                size="small"
              >
                Download
              </Button>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                size="small"
              >
                Upload
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleLoadMapFromFile}
                />
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Add tabs for switching between canvas and data view */}
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)} 
          aria-label="map builder tabs"
        >
          <Tab value="canvas" label="Canvas" icon={<BrushIcon />} iconPosition="start" />
          <Tab value="data" label="Map Data" icon={<RouteIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Canvas View */}
      {activeTab === 'canvas' && (
        <Box sx={{ 
          flex: 1, 
          position: 'relative',
          border: '1px solid #ccc', 
          borderRadius: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 200px)'
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseEnter={handleCanvasMouseEnter}
            onMouseLeave={handleCanvasMouseLeave}
            style={{ 
              display: 'block', 
              width: '100%', 
              height: '100%',
              cursor: activeToolMode === 'pan' ? 'grab' : (isDraggingPoint ? 'grabbing' : 
                      isCreatingArea ? 'crosshair' : (drawMode === 'brush' ? 'cell' : 'default'))
            }}
          />
          
          {/* Area creation controls */}
          {isCreatingArea && (
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: 16, 
                display: 'flex', 
                gap: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: 1,
                borderRadius: 1,
              }}
            >
              <Button 
                variant="contained" 
                color="success" 
                size="small"
                onClick={finishCreatingArea}
                startIcon={<CheckCircleIcon />}
                disabled={tempPoints.length < 3}
              >
                Finish
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={cancelCreatingArea}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Box>
          )}
          
          {/* Painting controls */}
          {isPainting && (
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: 16, 
                display: 'flex', 
                gap: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: 1,
                borderRadius: 1,
              }}
            >
              <Button 
                variant="contained" 
                color="success" 
                size="small"
                onClick={finishPainting}
                startIcon={<CheckCircleIcon />}
                disabled={tempPaintedCells.length === 0}
              >
                Finish
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={cancelPainting}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Box>
          )}
          
          {/* Zoom indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <ZoomInIcon fontSize="small" />
            {(zoom * 100).toFixed(0)}%
          </Box>
        </Box>
      )}
      
      {/* Data View */}
      {activeTab === 'data' && (
        <Box sx={{ flex: 1, overflow: 'auto', height: 'calc(100vh - 200px)' }}>
          <MapDataViewer mapData={mapData} />
        </Box>
      )}
      
      {/* Grid Settings Dialog */}
      <Dialog open={showGridSettings} onClose={() => setShowGridSettings(false)}>
        <DialogTitle>Grid Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure the grid size. Smaller values create a finer grid, larger values create a coarser grid.
          </Typography>
          <Box sx={{ py: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Grid Size"
                type="number"
                value={gridWidth}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 16 && value <= 256) {
                    setGridWidth(value);
                    setGridHeight(value);
                  }
                }}
                inputProps={{ min: 16, max: 256 }}
                helperText="Value between 16 and 256 (pixels)"
                variant="outlined"
                fullWidth
              />
            </FormControl>
            
            <Typography variant="body2" gutterBottom>
              Current grid: {gridSize}px × {gridSize}px
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGridSettings(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyGridSettings}>Apply</Button>
        </DialogActions>
      </Dialog>
      
      {/* Area edit dialog */}
      <Dialog open={showAreaForm} onClose={() => setShowAreaForm(false)}>
        <DialogTitle>
          {currentArea?.id.startsWith('area-') ? 'Add New Area' : 'Edit Area'}
        </DialogTitle>
        <form onSubmit={handleSaveArea}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Area Name"
              fullWidth
              variant="outlined"
              value={currentArea?.name || ''}
              onChange={(e) => currentArea && setCurrentArea({ ...currentArea, name: e.target.value })}
              required
            />
            
            <FormControl fullWidth margin="dense">
              <InputLabel id="area-type-select-label">Area Type</InputLabel>
              <Select
                labelId="area-type-select-label"
                value={currentArea?.type || 'connector'}
                label="Area Type"
                onChange={(e) => handleSetAreaType(e.target.value)}
                required
              >
                {Object.entries(AREA_TYPES).map(([type, { color }]) => (
                  <MenuItem key={type} value={type}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        mr: 1,
                        backgroundColor: color,
                        display: 'inline-block',
                        verticalAlign: 'text-bottom',
                      }}
                    />
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={currentArea?.description || ''}
              onChange={(e) => currentArea && setCurrentArea({ ...currentArea, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAreaForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapBuilder; 