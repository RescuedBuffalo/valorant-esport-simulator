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
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Brush as BrushIcon,
  Polyline as PolylineIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Undo as UndoIcon,
  Route as RouteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  PanTool as PanToolIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import { v4 as uuidv4 } from 'uuid';
// Import our new MapDataViewer component
import MapDataViewer from './MapDataViewer';

// Import metrics utilities
import { 
  recordUserInteraction, 
  recordMapBuilderMetric, 
  recordError, 
  recordMapBuilderObjectCount,
  measureMapBuilderOperation,
  recordMapBuilderCollision,
  recordMapBuilderPathfinding
} from '../utils/metrics';

// Updated map area types with colors and properties
const AREA_TYPES = {
  'site': { color: '#ff9966', walkable: true, team: 'neutral', tactical: true, label: 'Site' },
  'connector': { color: '#82b1ff', walkable: true, team: 'neutral', tactical: false, label: 'Connector' },
  'long': { color: '#80cbc4', walkable: true, team: 'neutral', tactical: false, label: 'Long' },
  'mid': { color: '#ce93d8', walkable: true, team: 'neutral', tactical: false, label: 'Mid' },
  'spawn': { color: '#ffcc00', walkable: true, team: 'neutral', tactical: false, label: 'Spawn' },
  'attacker-spawn': { color: '#ff4655', walkable: true, team: 'attackers', tactical: false, label: 'Attacker Spawn' },
  'defender-spawn': { color: '#18e5ff', walkable: true, team: 'defenders', tactical: false, label: 'Defender Spawn' },
  'obstacle': { color: '#5c6bc0', walkable: false, team: 'neutral', tactical: false, label: 'Obstacle' },
  'low-cover': { color: '#8d6e63', walkable: false, team: 'neutral', tactical: true, label: 'Low Cover' },
  'high-cover': { color: '#455a64', walkable: false, team: 'neutral', tactical: true, label: 'High Cover' },
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
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default grid settings
  const DEFAULT_TILE_SIZE = 64; // Size of each tile in pixels
  const DEFAULT_GRID_TILES = 16; // Default number of tiles (16x16 grid)
  
  // State for managing the map
  const [mapData, setMapData] = useState<MapData>({
    name: 'New Map',
    areas: [],
    version: '1.0',
    navGraph: [],
    collisionMesh: [],
    spawnPoints: { attackers: [], defenders: [] },
    bombsites: {},
    gridSize: DEFAULT_TILE_SIZE, // Still stored in pixels for rendering
    width: DEFAULT_GRID_TILES * DEFAULT_TILE_SIZE, // Width in pixels
    height: DEFAULT_GRID_TILES * DEFAULT_TILE_SIZE, // Height in pixels
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
  
  // Grid and canvas state
  const [drawMode, setDrawMode] = useState<'polygon' | 'brush'>('polygon');
  const [isPainting, setIsPainting] = useState(false);
  const [tempPaintedCells, setTempPaintedCells] = useState<GridCell[]>([]);
  const [gridSize, setGridSize] = useState(DEFAULT_TILE_SIZE); // Tile size in pixels
  const [gridTiles, setGridTiles] = useState(DEFAULT_GRID_TILES); // Number of tiles (not pixels)
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([]);
  const [currentPaintColor, setCurrentPaintColor] = useState(AREA_TYPES['connector'].color);
  
  // Add state for tab selection
  const [activeTab, setActiveTab] = useState<'canvas' | 'data'>('canvas');
  
  // New state for zoom, pan, and grid settings
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE); // Pixel size of each tile
  const [tilesX, setTilesX] = useState(DEFAULT_GRID_TILES); // Number of tiles horizontally
  const [tilesY, setTilesY] = useState(DEFAULT_GRID_TILES); // Number of tiles vertically
  const [activeToolMode, setActiveToolMode] = useState<'draw' | 'pan'>('draw');
  
  // Initialize the canvas and grid
  useEffect(() => {
    // Set up canvas with the correct dimensions
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Calculate dimensions based on grid tiles and tile size
      const width = tilesX * tileSize;
      const height = tilesY * tileSize;
      
      canvas.width = width;
      canvas.height = height;
      
      // Update map data to match
      setMapData(prev => ({
        ...prev,
        width,
        height,
        gridSize: tileSize
      }));
      
      // Draw the initial grid
      drawMap();
    }
    
    // Load saved dark mode preference
    const savedDarkMode = localStorage.getItem('mapBuilder_darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);
  
  // Draw the map whenever relevant state changes
  useEffect(() => {
    console.log(`State updated - drawMode: ${drawMode}, tempPaintedCells: ${tempPaintedCells.length}, isCreatingArea: ${isCreatingArea}, isPainting: ${isPainting}, zoom: ${zoom}`);
    drawMap();
  }, [mapData, activeAreaId, isCreatingArea, tempPoints, tempPaintedCells, drawMode, isPainting, zoom, pan, gridSize]);
  
  // Draw the map on the canvas
  const drawMap = () => {
    const canvas = canvasRef.current;
    const viewportCanvas = viewportCanvasRef.current;
    
    if (!canvas || !viewportCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const viewportCtx = viewportCanvas.getContext('2d');
    
    if (!ctx || !viewportCtx) return;
    
    // Update fixed map canvas dimensions if needed
    if (canvas.width !== mapData.width || canvas.height !== mapData.height) {
      canvas.width = mapData.width;
      canvas.height = mapData.height;
    }
    
    // The viewport canvas should always match its displayed size
    const parentElement = viewportCanvas.parentElement;
    if (parentElement) {
      const rect = parentElement.getBoundingClientRect();
      viewportCanvas.width = rect.width;
      viewportCanvas.height = rect.height;
    }
    
    // Clear both canvases with the current background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    viewportCtx.fillStyle = backgroundColor;
    viewportCtx.fillRect(0, 0, viewportCanvas.width, viewportCanvas.height);
    
    // ---- Draw on the fixed map canvas first ----
    
    // Draw background grid 
    drawGrid(ctx, canvas.width, canvas.height, false);
    
    // Draw all areas on the fixed map canvas
    mapData.areas.forEach(area => {
      const isActive = area.id === activeAreaId;
      
      // Draw polygon areas
      if (area.points && area.points.length >= 3) {
        drawArea(ctx, area, isActive);
      }
      
      // Draw painted areas (cells)
      if (area.cells && area.cells.length > 0) {
        drawPaintedCells(ctx, area.cells, area.color, isActive);
      }
    });
    
    // Draw area being created on the fixed map canvas
    if (isCreatingArea && tempPoints.length > 0) {
      drawTempArea(ctx, tempPoints);
    }
    
    // Draw temporary painted cells when using brush
    if (tempPaintedCells.length > 0) {
      drawPaintedCells(ctx, tempPaintedCells, currentPaintColor, true);
    }
    
    // ---- Now draw the viewport with zoom and pan ----
    
    // Calculate the position and size of the map in the viewport
    const viewportCenter = {
      x: viewportCanvas.width / 2,
      y: viewportCanvas.height / 2
    };
    
    // Save the viewport context state
    viewportCtx.save();
    
    // Transform the viewport context based on zoom and pan
    viewportCtx.translate(viewportCenter.x + pan.x, viewportCenter.y + pan.y);
    viewportCtx.scale(zoom, zoom);
    viewportCtx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Draw the map canvas onto the viewport canvas
    viewportCtx.drawImage(canvas, 0, 0);
    
    // FIX: Don't draw the extended grid when zoomed out
    // The extended grid is causing the grid to extend beyond boundaries
    
    // Restore the viewport context
    viewportCtx.restore();
  };
  
  // Draw background grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, isExtendedGrid: boolean = false) => {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = isExtendedGrid ? 0.5 / zoom : 0.5;
    
    // If this is the extended grid, we need to position it differently
    const offsetX = isExtendedGrid ? -width / 4 : 0;
    const offsetY = isExtendedGrid ? -height / 4 : 0;
    
    // Calculate grid boundaries
    const startX = Math.floor(offsetX / gridSize) * gridSize;
    const startY = Math.floor(offsetY / gridSize) * gridSize;
    const endX = startX + width;
    const endY = startY + height;
    
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
    if (!isExtendedGrid) {
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.lineTo(0, endY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(endX, 0);
      ctx.stroke();
    }
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
  
  // Calculate canvas coordinates from mouse event considering zoom and pan
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): { x: number, y: number } => {
    const canvas = canvasRef.current;
    const viewportCanvas = viewportCanvasRef.current;
    
    if (!canvas || !viewportCanvas) {
      return { x: 0, y: 0 };
    }
    
    const rect = viewportCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the offset of the map canvas within the viewport
    const viewportCenter = {
      x: viewportCanvas.width / 2,
      y: viewportCanvas.height / 2
    };
    
    // Calculate the position within the map canvas
    const canvasX = (mouseX - viewportCenter.x - pan.x) / zoom + canvas.width / 2;
    const canvasY = (mouseY - viewportCenter.y - pan.y) / zoom + canvas.height / 2;
    
    return { x: canvasX, y: canvasY };
  };
  
  // Get cell coordinates with static grid size regardless of zoom level
  const getCellFromPosition = (x: number, y: number): GridCell => {
    // Make sure to get the exact grid position by properly snapping to grid
    // We use gridSize directly because the grid size stays constant regardless of zoom
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
    
    // If we're in paint brush mode and it's a left-click
    if (drawMode === 'brush' && e.button === 0) {
      console.log("Brush tool is active, processing click");
      
      // Instead of just setting isPainting to true, immediately paint the clicked cell
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
    
    // If we're creating a new area with polygon tool - REMOVED, no longer needed
    
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
    
    if (isPanning) {
      if (lastMousePos) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    const { x, y } = getCanvasCoordinates(e);
    
    // If left mouse button is held down while moving and we're in brush mode
    if (drawMode === 'brush' && e.buttons === 1) {
      const currentCell = getCellFromPosition(x, y);
      
      // Ensure we're within the canvas bounds
      if (
        currentCell.x >= 0 && 
        currentCell.x < canvas.width && 
        currentCell.y >= 0 && 
        currentCell.y < canvas.height
      ) {
        // When the mouse moves fast, we need to interpolate between the last valid cell
        // and the current cell to ensure a continuous painting action
        if (lastValidCell && 
            (lastValidCell.gridX !== currentCell.gridX || lastValidCell.gridY !== currentCell.gridY)) {
          interpolateCells(lastValidCell, currentCell);
        }
        
        // Only add if not already in tempPaintedCells
        if (!cellExists(tempPaintedCells, currentCell)) {
          setTempPaintedCells(prev => [...prev, currentCell]);
          
          // Add to undo history
          setUndoHistory(prev => [...prev, { 
            type: 'PAINT_CELL', 
            cell: currentCell,
            color: currentPaintColor
          }]);
        }
        
        setLastValidCell(currentCell);
      }
      return;
    }
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  // Handle right-click to remove paint
  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Prevent the default context menu
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Only handle right-click in brush mode
    if (drawMode === 'brush') {
      const { x, y } = getCanvasCoordinates(e);
      const cell = getCellFromPosition(x, y);
      
      // Check if there's a painted cell at this position
      const existingCellIndex = tempPaintedCells.findIndex(
        c => c.gridX === cell.gridX && c.gridY === cell.gridY
      );
      
      if (existingCellIndex !== -1) {
        // Remove the cell from tempPaintedCells
        const updatedCells = [...tempPaintedCells];
        updatedCells.splice(existingCellIndex, 1);
        setTempPaintedCells(updatedCells);
        
        // Record user interaction for metrics
        recordUserInteraction('MapBuilder', 'erase_cell', {
          gridX: cell.gridX,
          gridY: cell.gridY
        });
        
        console.log(`Removed cell at grid position (${cell.gridX}, ${cell.gridY})`);
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
    if (Math.abs(denom) < 0.0001) {
      // Record collision check "miss" for parallel lines
      recordMapBuilderCollision('miss');
      return false;
    }
    
    // Calculate parameters for both lines
    const d3 = { x: p3.x - p1.x, y: p3.y - p1.y };
    const t = (d3.x * d2.y - d3.y * d2.x) / denom;
    const u = (d3.x * d1.y - d3.y * d1.x) / denom;
    
    // Check if intersection is within both line segments
    const result = t >= 0 && t <= 1 && u >= 0 && u <= 1;
    
    // Record collision metric
    recordMapBuilderCollision(result ? 'hit' : 'miss');
    
    return result;
  };
  
  // Generate line of sight between two points, checking for obstacles
  const checkLineOfSight = async (start: Point, end: Point): Promise<boolean> => {
    // Use our performance measurement utility for pathfinding and sightlines
    return await measureMapBuilderOperation(async () => {
      // Count the number of collision checks for this sight line
      let collisionChecks = 0;
      let collisionHits = 0;
      
      // Check if line of sight is blocked by any non-walkable area
      for (const area of mapData.areas) {
        if (!area.walkable && area.points.length >= 3) {
          // Check if the line intersects with any edge of the polygon
          for (let i = 0; i < area.points.length; i++) {
            const p1 = area.points[i];
            const p2 = area.points[(i + 1) % area.points.length];
            
            collisionChecks++;
            
            if (linesIntersect(start, end, p1, p2)) {
              collisionHits++;
              // Record the aggregated collision metrics
              recordMapBuilderCollision('hit', collisionHits);
              recordMapBuilderCollision('miss', collisionChecks - collisionHits);
              
              return false; // Line of sight is blocked
            }
          }
        }
      }
      
      // Record the final collision metrics
      recordMapBuilderCollision('miss', collisionChecks - collisionHits);
      
      return true; // Line of sight is clear
    }, 'line_of_sight_check');
  };
  
  // Function to generate all important sightlines on the map
  const generateSightlines = async (): Promise<{ start: Point, end: Point, blocked: boolean }[]> => {
    return await measureMapBuilderOperation(async () => {
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
      
      // Measure complexity by the number of sight lines to check
      const numSightlines = (tacticalPoints.length * (tacticalPoints.length - 1)) / 2;
      let complexity: 'low' | 'medium' | 'high' = 'low';
      
      if (numSightlines > 100) {
        complexity = 'high';
      } else if (numSightlines > 30) {
        complexity = 'medium';
      }
      
      // Record pathfinding metric for this operation
      recordMapBuilderPathfinding('sightline_generation', complexity, 0);
      
      // Generate sightlines between tactical points
      for (let i = 0; i < tacticalPoints.length; i++) {
        for (let j = i + 1; j < tacticalPoints.length; j++) {
          const start = tacticalPoints[i];
          const end = tacticalPoints[j];
          
          const isBlocked = !(await checkLineOfSight(start, end));
          sightlines.push({ start, end, blocked: isBlocked });
        }
      }
      
      return sightlines;
    }, 'generate_sightlines');
  };
  
  // Enhanced function to prepare map data for saving
  const prepareMapDataForSave = async (): Promise<MapData> => {
    // Create a copy of the current map data
    const enhancedMapData: MapData = {
        ...mapData,
      name: mapName,
      width: canvasRef.current?.width || (tilesX * tileSize),
      height: canvasRef.current?.height || (tilesY * tileSize),
      gridSize: tileSize,
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
    
    // Generate sightlines (now async)
    enhancedMapData.sightlines = await generateSightlines();
    
    return enhancedMapData;
  };
  
  // Override the saveMap function
  const saveMap = async () => {
    if (mapData.areas.length === 0) {
      showSnackbar('Map must have at least one area', 'error');
      return;
    }
    
    try {
      const enhancedMapData = await prepareMapDataForSave();
      
      // Save to localStorage
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
      const mapToSave = data || await prepareMapDataForSave();
      
      // Log the map data for debugging
      console.log("Saving map data to backend:", mapToSave);
      
      // Record object counts before saving
      const objectCounts = {
        areas: mapToSave.areas.length,
        navNodes: mapToSave.navGraph.length,
        collisionBoundaries: mapToSave.collisionMesh.length,
        chokePoints: mapToSave.chokePoints.length,
        sightlines: mapToSave.sightlines.length,
        spawnPoints: mapToSave.spawnPoints.attackers.length + mapToSave.spawnPoints.defenders.length,
      };
      
      // Record the object counts for metrics
      recordMapBuilderObjectCount(objectCounts);
      
      // Use the performance measuring wrapper
      const savedMap = await measureMapBuilderOperation(async () => {
        // Simulate save operation for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Replace with actual API call
        return mapToSave;
      }, 'save_map');
      
      // Show success message
      showSnackbar("Map saved successfully!", "success");
      
      // Update map name in state
      savedMap.name = mapName;
      setMapData(savedMap);
      
      // Call the callback if provided
      if (onSaveComplete) {
        onSaveComplete(savedMap);
      }
      
      // Record successful save metric
      recordMapBuilderMetric('save', 'map', 1);
      
      return savedMap;
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
  const handleSaveToBackend = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Record the user interaction
    recordUserInteraction('MapBuilder', 'save_map_to_backend', {
      mapName,
      areasCount: mapData.areas.length,
      navNodeCount: mapData.navGraph.length,
      collisionBoundaryCount: mapData.collisionMesh.length
    });
    
    await saveMapToBackend();
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
  
  // Add a function to create a new map with specified grid dimensions
  const createNewMapWithGrid = (tileSize: number, tilesX: number, tilesY: number): MapData => {
    // Calculate width and height based on tile size and count
    const width = tilesX * tileSize;
    const height = tilesY * tileSize;
    
    return {
      name: mapName || 'New Map',
      areas: [],
      version: '1.0',
      navGraph: [],
      collisionMesh: [],
      spawnPoints: { attackers: [], defenders: [] },
      bombsites: {},
      gridSize: tileSize, // Pixel size of each tile
      width: width, // Total width in pixels
      height: height, // Total height in pixels
      scale: 1,
      chokePoints: [],
      sightlines: [],
    };
  };
  
  // Grid settings dialog
  const [gridDialogOpen, setGridDialogOpen] = useState(false);
  const [tempTilesX, setTempTilesX] = useState(tilesX);
  const [tempTilesY, setTempTilesY] = useState(tilesY);
  const [tempTileSize, setTempTileSize] = useState(tileSize);
  const [gridValidationError, setGridValidationError] = useState<string | null>(null);

  const handleGridDialogOpen = () => {
    setTempTilesX(tilesX);
    setTempTilesY(tilesY);
    setTempTileSize(tileSize);
    setGridValidationError(null);
    setGridDialogOpen(true);
  };

  const handleGridDialogClose = () => {
    setGridDialogOpen(false);
    setGridValidationError(null);
  };

  const applyGridSettings = () => {
    // Validate grid settings
    if (tempTilesX < 8 || tempTilesX > 64 || tempTilesY < 8 || tempTilesY > 64) {
      setGridValidationError('Grid dimensions must be between 8x8 and 64x64 tiles');
      return;
    }

    if (tempTileSize < 16 || tempTileSize > 128) {
      setGridValidationError('Tile size must be between 16 and 128 pixels');
      return;
    }

    const newWidth = tempTilesX * tempTileSize;
    const newHeight = tempTilesY * tempTileSize;

    setTilesX(tempTilesX);
    setTilesY(tempTilesY);
    setTileSize(tempTileSize);

    // If we have a canvas, resize it
    if (canvasRef.current) {
      canvasRef.current.width = newWidth;
      canvasRef.current.height = newHeight;
    }

    // Update map data with new dimensions
    setMapData(prevData => ({
      ...prevData,
      width: newWidth,
      height: newHeight,
      gridSize: tempTileSize
    }));

    // Close dialog
    setGridDialogOpen(false);
    setGridValidationError(null);

    // Record the grid settings change metric
    recordUserInteraction('MapBuilder', 'apply_grid_settings', {
      tilesX: tempTilesX,
      tilesY: tempTilesY,
      tileSize: tempTileSize
    });
  };
  
  // Grid settings dialog JSX
  const renderGridSettingsDialog = () => (
    <Dialog open={gridDialogOpen} onClose={handleGridDialogClose}>
      <DialogTitle>Grid Settings</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Set the grid dimensions in tiles and the size of each tile in pixels.
        </DialogContentText>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Grid Width (tiles)"
            type="number"
            InputProps={{ inputProps: { min: 8, max: 64 } }}
            value={tempTilesX}
            onChange={(e) => setTempTilesX(Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="Grid Height (tiles)"
            type="number"
            InputProps={{ inputProps: { min: 8, max: 64 } }}
            value={tempTilesY}
            onChange={(e) => setTempTilesY(Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="Tile Size (pixels)"
            type="number"
            InputProps={{ inputProps: { min: 16, max: 128 } }}
            value={tempTileSize}
            onChange={(e) => setTempTileSize(Number(e.target.value))}
            fullWidth
          />
          {gridValidationError && (
            <Typography color="error">{gridValidationError}</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleGridDialogClose}>Cancel</Button>
        <Button onClick={applyGridSettings} color="primary">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
  
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

  // Background color state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const backgroundColor = isDarkMode ? '#111111' : '#ffffff';
  const gridColor = isDarkMode ? '#8c8c8c' : '#cccccc';
  const axisColor = isDarkMode ? '#ff6b6b' : '#ff3333';

  // Toggle between dark and light mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      // Save to localStorage for persistence
      localStorage.setItem('mapBuilder_darkMode', newValue.toString());
      return newValue;
    });
    
    // Record the mode change for metrics
    recordUserInteraction('MapBuilder', 'toggle_dark_mode', {
      isDarkMode: !isDarkMode
    });
    
    // Force a redraw
    drawMap();
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2, mb: 4, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header with map name editor */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          label="Map Name"
          variant="outlined"
          size="small"
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>
      
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
          height: 'calc(100vh - 200px)',
          bgcolor: backgroundColor
        }}>
          {/* The hidden fixed-size map canvas (not displayed, used for drawing) */}
          <canvas
            ref={canvasRef}
            style={{ 
              display: 'none', // Hidden from view
            }}
          />
          
          {/* The visible viewport canvas (displays content with zoom/pan) */}
          <canvas
            ref={viewportCanvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseEnter={handleCanvasMouseEnter}
            onMouseLeave={handleCanvasMouseLeave}
            onContextMenu={handleCanvasContextMenu}
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
                onClick={finishCreatingArea}
                startIcon={<CheckCircleIcon />}
                disabled={tempPoints.length < 3}
              >
                Finish Area
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={cancelCreatingArea}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Box>
          )}
          
          {/* Toolbar overlay */}
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 1,
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Tool Mode Selector */}
              <ToggleButtonGroup
                value={activeToolMode}
                exclusive
                size="small"
                aria-label="tool mode"
              >
                <ToggleButton 
                  value="draw" 
                  onClick={() => handleToolModeChange('draw')}
                  aria-label="draw mode"
                >
                  <Tooltip title="Draw Mode">
                    <BrushIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton 
                  value="pan" 
                  onClick={() => handleToolModeChange('pan')}
                  aria-label="pan mode"
                >
                  <Tooltip title="Pan Mode">
                    <PanToolIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              {/* Only show drawing tools when in draw mode */}
              {activeToolMode === 'draw' && (
                <>
                  {/* Removed Polygon Tool, only keeping Brush */}
                  <ToggleButtonGroup
                    value="brush"
                    exclusive
                    size="small"
                    aria-label="drawing mode"
                  >
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
                  <ToggleButtonGroup
                    value={currentPaintColor}
                    exclusive
                    size="small"
                    aria-label="area color"
                  >
                    {Object.entries(AREA_TYPES).map(([type, details]) => (
                      <ToggleButton
                        key={type}
                        value={details.color}
                        onClick={() => setCurrentPaintColor(details.color)}
                        aria-label={`${details.label} color`}
                        sx={{ 
                          backgroundColor: details.color + '99', 
                          '&.Mui-selected': { backgroundColor: details.color + 'CC' },
                          '&:hover': { backgroundColor: details.color + 'AA' }
                        }}
                      >
                        <Tooltip title={details.label}>
                          <Box sx={{ width: 20, height: 20 }} />
                        </Tooltip>
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  
                  {/* Create/Add Area Button */}
                  <Tooltip title="Start painting new area">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<BrushIcon />}
                      onClick={startPaintingMode}
                      disabled={drawMode === 'brush' && tempPaintedCells.length === 0}
                    >
                      Paint Area
                    </Button>
                  </Tooltip>
                  
                  {/* Undo Button */}
                  <Tooltip title="Undo Last Action">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={handleUndo}
                        disabled={undoHistory.length === 0}
                        color="primary"
                      >
                        <UndoIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
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
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
              
              {/* Background Color Toggle */}
              <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton onClick={toggleDarkMode} size="small" sx={{ mr: 1 }}>
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              
              {/* Grid Settings Button */}
              <Tooltip title="Grid Settings">
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleGridDialogOpen} 
                  sx={{ mr: 1 }}
                >
                  <SettingsIcon sx={{ mr: 0.5 }} /> Grid ({mapData.width / mapData.gridSize}×{mapData.height / mapData.gridSize})
                </Button>
              </Tooltip>
            </Box>
          </Box>
          
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
                onClick={finishPainting}
                startIcon={<CheckCircleIcon />}
                disabled={tempPaintedCells.length === 0}
              >
                Finish Painting
              </Button>
              <Button
                variant="outlined"
                color="error"
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
      {renderGridSettingsDialog()}
      
      {/* Area edit dialog */}
      {showAreaForm && currentArea && (
        <Dialog open={showAreaForm} onClose={() => setShowAreaForm(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSaveArea}>
            <DialogTitle>
              {currentArea.id.includes('temp-') ? 'Create New Area' : 'Edit Area'}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Area Name"
                fullWidth
                value={currentArea.name}
                onChange={(e) => setCurrentArea({...currentArea, name: e.target.value})}
                required
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Area Type</InputLabel>
                <Select
                  value={currentArea.type}
                  onChange={(e) => {
                    const newType = e.target.value as string;
                    // Use type assertion to tell TypeScript this is a valid key
                    const areaColor = AREA_TYPES[newType as keyof typeof AREA_TYPES]?.color || currentArea.color;
                    setCurrentArea({
                      ...currentArea, 
                      type: newType,
                      color: areaColor
                    });
                  }}
                >
                  {Object.entries(AREA_TYPES).map(([type, details]) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            backgroundColor: details.color,
                            borderRadius: '50%'
                          }} 
                        />
                        {details.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Walkable
                </Typography>
                <ToggleButtonGroup
                  value={currentArea.walkable}
                  exclusive
                  onChange={(_, newValue) => {
                    // Don't allow deselecting, only switching
                    if (newValue !== null) {
                      setCurrentArea({...currentArea, walkable: newValue});
                    }
                  }}
                >
                  <ToggleButton value={true} color="success">
                    <Tooltip title="Agents can walk through this area">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DragIndicatorIcon />
                        <Typography variant="body2">Walkable</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value={false} color="error">
                    <Tooltip title="Agents cannot walk through this area (wall/obstacle)">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BlockIcon />
                        <Typography variant="body2">Blocked</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Tactical Importance
                </Typography>
                <ToggleButtonGroup
                  value={currentArea.tactical}
                  exclusive
                  onChange={(_, newValue) => {
                    if (newValue !== null) {
                      setCurrentArea({...currentArea, tactical: newValue});
                    }
                  }}
                >
                  <ToggleButton value={true} color="primary">
                    <Tooltip title="This is a tactically important area (site, choke point)">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LockIcon />
                        <Typography variant="body2">Tactical</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value={false}>
                    <Tooltip title="Standard area with no special tactical significance">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ClearIcon />
                        <Typography variant="body2">Standard</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
              
              <TextField
                margin="dense"
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                value={currentArea.description || ''}
                onChange={(e) => setCurrentArea({...currentArea, description: e.target.value})}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowAreaForm(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">Save</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default MapBuilder; 