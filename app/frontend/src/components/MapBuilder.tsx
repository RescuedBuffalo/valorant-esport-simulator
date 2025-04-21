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
import { v4 as uuidv4 } from 'uuid';

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

// New interface for grid cells when using paint brush
interface GridCell {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
}

// Action for undo history
type UndoAction = 
  | { type: 'ADD_POLYGON_POINT'; pointIndex: number; areaId: string | null }
  | { type: 'PAINT_CELL'; cell: GridCell; color: string };

interface MapArea {
  id: string;
  name: string;
  type: string;
  color: string;
  points: Point[];
  description?: string;
  cells?: GridCell[]; // Optional cells for painted areas
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
  
  // New state for paint brush and undo functionality
  const [drawMode, setDrawMode] = useState<'polygon' | 'brush'>('polygon');
  const [isPainting, setIsPainting] = useState(false);
  const [tempPaintedCells, setTempPaintedCells] = useState<GridCell[]>([]);
  const [gridSize, setGridSize] = useState(20); // Grid cell size
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([]);
  const [currentPaintColor, setCurrentPaintColor] = useState(AREA_TYPES['connector']);
  
  // Draw the map whenever data changes
  useEffect(() => {
    console.log(`State updated - drawMode: ${drawMode}, tempPaintedCells: ${tempPaintedCells.length}, isCreatingArea: ${isCreatingArea}, isPainting: ${isPainting}`);
    drawMap();
  }, [mapData, activeAreaId, isCreatingArea, tempPoints, tempPaintedCells, drawMode, isPainting]);
  
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
  };
  
  // Draw background grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#8c8c8c';
    ctx.lineWidth = 0.5;
    
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
  
  // Get mouse coordinates relative to the canvas with improved accuracy
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
    
    console.log(`Raw mouse at (${e.clientX}, ${e.clientY}), canvas coordinates: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    
    return { x, y };
  };
  
  // Get cell coordinates from mouse position with proper snapping to grid
  const getCellFromPosition = (x: number, y: number): GridCell => {
    // Make sure to get the exact grid position by properly snapping to grid
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);
    
    // Calculate the exact cell coordinates
    const cellX = gridX * gridSize;
    const cellY = gridY * gridSize;
    
    // Ensure these values are within canvas boundaries
    const safeGridX = Math.max(0, Math.min(gridX, Math.floor(canvasRef.current?.width || 1200) / gridSize - 1));
    const safeGridY = Math.max(0, Math.min(gridY, Math.floor(canvasRef.current?.height || 1200) / gridSize - 1));
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
  
  // Handle mouse down for drawing or selecting
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
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
  
  // Handle mouse move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsMouseOverCanvas(true);
    
    const { x, y } = getCanvasCoordinates(e);
    
    setLastMousePos({ x, y });
    
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
  
  // Handle mouse up
  const handleCanvasMouseUp = () => {
    console.log("Canvas mouseUp event");
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
    
    if (lastAction.type === 'ADD_POLYGON_POINT') {
      // Remove the last point from tempPoints
      if (tempPoints.length > 0) {
        setTempPoints(tempPoints.slice(0, -1));
      }
    } else if (lastAction.type === 'PAINT_CELL') {
      // Remove the last painted cell
      if (tempPaintedCells.length > 0) {
        setTempPaintedCells(tempPaintedCells.slice(0, -1));
      }
    }
    
    // Remove the last action from history
    setUndoHistory(undoHistory.slice(0, -1));
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
      cells: tempPaintedCells
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
      showSnackbar('Need at least 3 points to create an area', 'error');
      return;
    }
    
    setIsCreatingArea(false);
    setCurrentArea({
      id: `area-${Date.now()}`,
      name: 'New Area',
      type: 'connector',
      color: currentPaintColor,
      points: tempPoints
    });
    setShowAreaForm(true);
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
    setTempPaintedCells([]);
    // Clear undo history after saving
    setUndoHistory([]);
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
  
  // Save map to the backend
  const saveMapToBackend = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...mapData,
          name: mapName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save map to server');
      }
      
      const result = await response.json();
      
      setIsSaving(false);
      showSnackbar('Map saved to server successfully', 'success');
      
      if (onSaveComplete) {
        onSaveComplete({
          ...mapData,
          name: mapName
        });
      }
      
      return result;
    } catch (error) {
      setIsSaving(false);
      showSnackbar('Error saving map to server', 'error');
      console.error('Error saving map to server:', error);
      return null;
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
    
    const color = AREA_TYPES[type as keyof typeof AREA_TYPES] || '#cccccc';
    setCurrentArea({
      ...currentArea,
      type,
      color
    });
  };
  
  // Set current paint color based on area type
  const handleSetPaintColor = (type: string) => {
    const color = AREA_TYPES[type as keyof typeof AREA_TYPES] || '#cccccc';
    setCurrentPaintColor(color);
  };
  
  // Explicitly forceUpdate function to refresh the canvas when needed
  const forceCanvasUpdate = () => {
    console.log("Forcing canvas update");
    drawMap();
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
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="area-type-label">Area Type</InputLabel>
                <Select
                  labelId="area-type-label"
                  value={Object.keys(AREA_TYPES).find(
                    key => AREA_TYPES[key as keyof typeof AREA_TYPES] === currentPaintColor
                  ) || 'connector'}
                  label="Area Type"
                  onChange={(e) => handleSetPaintColor(e.target.value)}
                  size="small"
                >
                  {Object.entries(AREA_TYPES).map(([type, color]) => (
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
              
              <Divider orientation="vertical" flexItem />
              
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={saveMapToBackend}
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

              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  console.log("Debug button clicked, current state:");
                  console.log(`drawMode: ${drawMode}`);
                  console.log(`tempPaintedCells: ${JSON.stringify(tempPaintedCells)}`);
                  console.log(`isPainting: ${isPainting}`);
                  console.log(`isCreatingArea: ${isCreatingArea}`);
                  forceCanvasUpdate();
                }}
                size="small"
              >
                Debug State
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Drawing Controls */}
      {(isCreatingArea || isPainting || drawMode === 'brush') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {isCreatingArea && (
              <>
                <Typography variant="body1">
                  Creating polygon area. Click to add points, at least 3 needed.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={finishCreatingArea}
                >
                  Finish Area
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={cancelCreatingArea}
                >
                  Cancel
                </Button>
              </>
            )}
            
            {drawMode === 'brush' && (
              <>
                <Typography variant="body1">
                  Brush tool active: Click cells to paint them. Hold and drag to paint multiple cells.
                </Typography>
                {tempPaintedCells.length > 0 && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={finishPainting}
                    >
                      Save Painted Area
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={cancelPainting}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        </Paper>
      )}
      
      {/* Canvas Container */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={1200}
          style={{
            backgroundColor: '#111111',
            cursor: isCreatingArea ? 'crosshair' : (drawMode === 'brush' ? 'cell' : 'default')
          }}
          onMouseDown={(e) => {
            console.log("Canvas mouseDown event");
            handleCanvasMouseDown(e);
          }}
          onMouseMove={(e) => {
            handleCanvasMouseMove(e);
          }}
          onMouseUp={() => {
            console.log("Canvas mouseUp event");
            handleCanvasMouseUp();
          }}
          onMouseEnter={(e) => {
            handleCanvasMouseEnter(e);
          }}
          onMouseLeave={(e) => {
            handleCanvasMouseLeave(e);
          }}
        />
      </Paper>
      
      {/* Area Dialog */}
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
                {Object.entries(AREA_TYPES).map(([type, color]) => (
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
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapBuilder; 