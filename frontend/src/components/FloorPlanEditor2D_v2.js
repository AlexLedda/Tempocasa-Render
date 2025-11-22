import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save, Square, Move, Trash2, DoorOpen, Maximize2, Sofa, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';

// Libreria elementi predefiniti (dimensioni in cm)
const ELEMENT_LIBRARY = {
  doors: [
    { id: 'door-single', name: 'Porta Singola', width: 90, height: 210, icon: '🚪' },
    { id: 'door-double', name: 'Porta Doppia', width: 160, height: 210, icon: '🚪🚪' },
    { id: 'door-sliding', name: 'Porta Scorrevole', width: 120, height: 210, icon: '↔️' }
  ],
  windows: [
    { id: 'window-small', name: 'Finestra Piccola', width: 80, height: 120, icon: '🪟' },
    { id: 'window-medium', name: 'Finestra Media', width: 120, height: 150, icon: '🪟' },
    { id: 'window-large', name: 'Finestra Grande', width: 200, height: 180, icon: '🪟' }
  ],
  furniture: [
    { id: 'bed-single', name: 'Letto Singolo', width: 100, depth: 200, icon: '🛏️' },
    { id: 'bed-double', name: 'Letto Matrimoniale', width: 160, depth: 200, icon: '🛏️' },
    { id: 'sofa-2', name: 'Divano 2 posti', width: 150, depth: 90, icon: '🛋️' },
    { id: 'sofa-3', name: 'Divano 3 posti', width: 220, depth: 90, icon: '🛋️' },
    { id: 'table-dining', name: 'Tavolo Pranzo', width: 160, depth: 90, icon: '🪑' },
    { id: 'desk', name: 'Scrivania', width: 140, depth: 70, icon: '💻' },
    { id: 'wardrobe', name: 'Armadio', width: 200, depth: 60, icon: '👔' }
  ],
  floors: [
    { id: 'floor-parquet', name: 'Parquet', color: '#8B4513', pattern: 'wood', icon: '🪵' },
    { id: 'floor-tile-white', name: 'Piastrelle Bianche', color: '#F5F5F5', pattern: 'tile', icon: '⬜' },
    { id: 'floor-tile-gray', name: 'Piastrelle Grigie', color: '#9E9E9E', pattern: 'tile', icon: '◽' },
    { id: 'floor-marble', name: 'Marmo', color: '#E8E8E8', pattern: 'marble', icon: '💎' },
    { id: 'floor-concrete', name: 'Cemento', color: '#696969', pattern: 'solid', icon: '🧱' },
    { id: 'floor-carpet', name: 'Moquette', color: '#CD853F', pattern: 'carpet', icon: '🟫' }
  ]
};

const FloorPlanEditor2D = ({ floorPlanImage, threeDData, onSave }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [mode, setMode] = useState('view');
  
  // Debug: Log when component receives image
  useEffect(() => {
    console.log('FloorPlanEditor2D - floorPlanImage:', floorPlanImage);
  }, [floorPlanImage]);
  const [rooms, setRooms] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [walls, setWalls] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [scale, setScale] = useState(0.1); // 0.1 pixels per cm = 10 pixels per metro
  const [wallHeight, setWallHeight] = useState(280); // 280 cm = 2.8m
  const [wallThickness, setWallThickness] = useState(20); // 20 cm
  const [wallColor, setWallColor] = useState('#0f172a'); // Default: dark slate
  const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState(null);
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Snap to grid
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  
  // Resize controls
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Image controls
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageOpacity, setImageOpacity] = useState(0.5);

  useEffect(() => {
    if (threeDData) {
      try {
        const data = typeof threeDData === 'string' ? JSON.parse(threeDData) : threeDData;
        if (data.rooms) setRooms(data.rooms.map(r => ({ ...r, x: (r.x || 0) * scale, y: (r.y || 0) * scale })));
        if (data.doors) setDoors(data.doors.map(d => ({ ...d, x: d.position[0] * scale, y: d.position[1] * scale })));
        if (data.windows) setWindows(data.windows.map(w => ({ ...w, x: w.position[0] * scale, y: w.position[1] * scale })));
        if (data.walls) setWalls(data.walls);
        if (data.furniture) setFurniture(data.furniture.map(f => ({ ...f, x: f.x * scale, y: f.y * scale })));
      } catch (e) {
        console.error('Error loading 3D data:', e);
      }
    }
  }, [threeDData]);

  const [backgroundImg, setBackgroundImg] = useState(null);

  useEffect(() => {
    // Load background image into memory
    if (floorPlanImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log('Background image loaded for canvas');
        setBackgroundImg(img);
      };
      img.onerror = () => {
        console.error('Failed to load background image');
        setBackgroundImg(null);
      };
      img.src = floorPlanImage;
    } else {
      setBackgroundImg(null);
    }
  }, [floorPlanImage]);

  // Save current state to history
  const saveToHistory = () => {
    const currentState = {
      rooms: JSON.parse(JSON.stringify(rooms)),
      doors: JSON.parse(JSON.stringify(doors)),
      windows: JSON.parse(JSON.stringify(windows)),
      walls: JSON.parse(JSON.stringify(walls)),
      floors: JSON.parse(JSON.stringify(floors)),
      furniture: JSON.parse(JSON.stringify(furniture))
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      
      setRooms(JSON.parse(JSON.stringify(state.rooms)));
      setDoors(JSON.parse(JSON.stringify(state.doors)));
      setWindows(JSON.parse(JSON.stringify(state.windows)));
      setWalls(JSON.parse(JSON.stringify(state.walls)));
      setFloors(JSON.parse(JSON.stringify(state.floors)));
      setFurniture(JSON.parse(JSON.stringify(state.furniture)));
      
      setHistoryIndex(newIndex);
      toast.success('Annullato');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      
      setRooms(JSON.parse(JSON.stringify(state.rooms)));
      setDoors(JSON.parse(JSON.stringify(state.doors)));
      setWindows(JSON.parse(JSON.stringify(state.windows)));
      setWalls(JSON.parse(JSON.stringify(state.walls)));
      setFloors(JSON.parse(JSON.stringify(state.floors)));
      setFurniture(JSON.parse(JSON.stringify(state.furniture)));
      
      setHistoryIndex(newIndex);
      toast.success('Ripristinato');
    }
  };

  // Snap coordinates to grid
  const snapToGridCoords = (x, y) => {
    if (!snapToGrid) return { x, y };
    
    const gridSize = scale * 10; // 10cm grid
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  useEffect(() => {
    drawCanvas();
  }, [rooms, doors, windows, walls, floors, selectedElement, furniture, backgroundImg, mousePos, isDrawing, startPoint, mode, imageScale, imagePosition, imageOpacity, isResizing, wallColor, zoom, panOffset]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Delete/Backspace - Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        deleteSelected();
        saveToHistory();
      }
      
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Keyboard shortcuts for tools (only if not typing in an input)
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'v' || e.key === 'V') {
          setMode('view');
          setSelectedLibraryItem(null);
          setIsDragging(false);
        } else if (e.key === 'm' || e.key === 'M') {
          if (selectedElement) setMode('move');
        } else if (e.key === 'w' || e.key === 'W') {
          setMode('wall');
          setSelectedLibraryItem(null);
          setIsDrawing(false);
          setStartPoint(null);
        } else if (e.key === 'f' || e.key === 'F') {
          setMode('floor');
          setSelectedLibraryItem(null);
        } else if (e.key === 'r' || e.key === 'R') {
          setMode('room');
          setSelectedLibraryItem(null);
        } else if (e.key === 'd' || e.key === 'D') {
          setMode('door');
        } else if (e.key === 'g' || e.key === 'G') {
          setSnapToGrid(!snapToGrid);
          toast.info(`Snap to Grid: ${!snapToGrid ? 'ON' : 'OFF'}`);
        } else if (e.key === 'Escape') {
          setMode('view');
          setSelectedElement(null);
          setIsDrawing(false);
          setStartPoint(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedElement, rooms, doors, windows, walls, furniture, floors, history, historyIndex, snapToGrid]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image if available with controls
    if (backgroundImg) {
      ctx.save();
      ctx.globalAlpha = imageOpacity;
      
      const imgWidth = canvas.width * imageScale;
      const imgHeight = canvas.height * imageScale;
      const imgX = imagePosition.x + (canvas.width - imgWidth) / 2;
      const imgY = imagePosition.y + (canvas.height - imgHeight) / 2;
      
      ctx.drawImage(backgroundImg, imgX, imgY, imgWidth, imgHeight);
      ctx.restore();
    }

    // Draw grid (every 100cm = 1m)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    for (let i = 0; i < canvas.width; i += scale * 100) { // 100 cm grid
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += scale * 100) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw floors FIRST (bottom layer)
    floors.forEach((floor, idx) => {
      const isSelected = selectedElement?.type === 'floor' && selectedElement?.idx === idx;
      
      const width = (floor.width || 4) * scale;
      const depth = (floor.depth || 3) * scale;
      
      // Draw floor with color
      ctx.fillStyle = floor.color || '#E8E8E8';
      ctx.fillRect(floor.x || 0, floor.y || 0, width, depth);
      
      // Draw pattern overlay
      if (floor.pattern === 'tile') {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        const tileSize = scale * 50; // 50cm tiles
        for (let x = floor.x; x < floor.x + width; x += tileSize) {
          for (let y = floor.y; y < floor.y + depth; y += tileSize) {
            ctx.strokeRect(x, y, tileSize, tileSize);
          }
        }
      } else if (floor.pattern === 'wood') {
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        const plankHeight = scale * 15; // 15cm planks
        for (let y = floor.y; y < floor.y + depth; y += plankHeight) {
          ctx.beginPath();
          ctx.moveTo(floor.x, y);
          ctx.lineTo(floor.x + width, y);
          ctx.stroke();
        }
      }
      
      // Draw border
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#94a3b8';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(floor.x || 0, floor.y || 0, width, depth);
      
      // Draw resize handles for selected floor
      if (isSelected && mode === 'view') {
        drawResizeHandles(ctx, floor.x, floor.y, width, depth);
      }
      
      // Draw label
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(`${floor.name || 'Pavimento'}`, (floor.x || 0) + 5, (floor.y || 0) + 15);
    });

    // Draw rooms
    rooms.forEach((room) => {
      const isSelected = selectedElement?.type === 'room' && selectedElement?.id === room.id;
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.15)';
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#64748b';
      ctx.lineWidth = isSelected ? 3 : 2;
      
      const width = (room.width || 4) * scale;
      const depth = (room.depth || 3) * scale;
      
      ctx.fillRect(room.x || 0, room.y || 0, width, depth);
      ctx.strokeRect(room.x || 0, room.y || 0, width, depth);
      
      // Draw resize handles for selected room
      if (isSelected && mode === 'view') {
        drawResizeHandles(ctx, room.x, room.y, width, depth);
      }
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px Inter';
      ctx.fillText(`${room.type || 'Stanza'}`, (room.x || 0) + 5, (room.y || 0) + 20);
      ctx.font = '12px Inter';
      ctx.fillText(`${room.width}x${room.depth}cm`, (room.x || 0) + 5, (room.y || 0) + 35);
    });

    // Draw furniture
    furniture.forEach((item, idx) => {
      const isSelected = selectedElement?.type === 'furniture' && selectedElement?.idx === idx;
      ctx.fillStyle = isSelected ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.25)';
      ctx.strokeStyle = isSelected ? '#a855f7' : '#9333ea';
      ctx.lineWidth = 2;
      
      const width = (item.width || 1) * scale;
      const depth = (item.depth || 1) * scale;
      
      ctx.fillRect(item.x - width/2, item.y - depth/2, width, depth);
      ctx.strokeRect(item.x - width/2, item.y - depth/2, width, depth);
      
      // Draw resize handles for selected furniture
      if (isSelected && mode === 'view') {
        drawResizeHandles(ctx, item.x - width/2, item.y - depth/2, width, depth);
      }
      
      ctx.fillStyle = '#581c87';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon || '📦', item.x, item.y + 5);
      ctx.textAlign = 'left';
    });

    // Draw doors
    doors.forEach((door, idx) => {
      const isSelected = selectedElement?.type === 'door' && selectedElement?.idx === idx;
      ctx.fillStyle = isSelected ? '#f59e0b' : '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      
      const doorWidth = (door.width || 0.9) * scale;
      ctx.fillRect(door.x - doorWidth / 2, door.y - 5, doorWidth, 10);
      ctx.strokeRect(door.x - doorWidth / 2, door.y - 5, doorWidth, 10);
      
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🚪', door.x, door.y + 4);
      ctx.textAlign = 'left';
    });

    // Draw windows
    windows.forEach((window, idx) => {
      const isSelected = selectedElement?.type === 'window' && selectedElement?.idx === idx;
      ctx.fillStyle = isSelected ? '#06b6d4' : '#22d3ee';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 2;
      
      const windowWidth = (window.width || 1.2) * scale;
      ctx.fillRect(window.x - windowWidth / 2, window.y - 3, windowWidth, 6);
      ctx.strokeRect(window.x - windowWidth / 2, window.y - 3, windowWidth, 6);
      
      ctx.fillStyle = '#164e63';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🪟', window.x, window.y + 4);
      ctx.textAlign = 'left';
    });

    // Draw walls (coordinates are already in pixels)
    walls.forEach((wall, idx) => {
      const isSelected = selectedElement?.type === 'wall' && selectedElement?.idx === idx;
      
      if (isSelected) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 8;
      } else {
        ctx.strokeStyle = wall.color || '#0f172a'; // Use wall's custom color
        ctx.lineWidth = 6;
      }
      
      ctx.beginPath();
      ctx.moveTo(wall.start[0], wall.start[1]);
      ctx.lineTo(wall.end[0], wall.end[1]);
      ctx.stroke();
      
      // Draw small circles at endpoints for visibility
      ctx.fillStyle = isSelected ? '#ef4444' : (wall.color || '#0f172a');
      ctx.beginPath();
      ctx.arc(wall.start[0], wall.start[1], 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wall.end[0], wall.end[1], 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw resize handles for selected wall endpoints
      if (isSelected && mode === 'view') {
        const handleSize = 10;
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Start point handle
        ctx.fillRect(wall.start[0] - handleSize/2, wall.start[1] - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(wall.start[0] - handleSize/2, wall.start[1] - handleSize/2, handleSize, handleSize);
        
        // End point handle
        ctx.fillRect(wall.end[0] - handleSize/2, wall.end[1] - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(wall.end[0] - handleSize/2, wall.end[1] - handleSize/2, handleSize, handleSize);
      }
    });
    
    // Draw temporary wall while drawing
    if (mode === 'wall' && isDrawing && startPoint && mousePos) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 6;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw start point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left - panOffset.x) / zoom;
    let y = (e.clientY - rect.top - panOffset.y) / zoom;
    
    // Apply snap to grid
    const snapped = snapToGridCoords(x, y);
    x = snapped.x;
    y = snapped.y;

    if (mode === 'wall') {
      if (!isDrawing) {
        setStartPoint({ x, y });
        setIsDrawing(true);
      } else {
        // Store wall with pixel coordinates and color
        const newWall = {
          start: [startPoint.x, startPoint.y],
          end: [x, y],
          height: wallHeight,
          thickness: wallThickness,
          color: wallColor
        };
        setWalls([...walls, newWall]);
        setIsDrawing(false);
        setStartPoint(null);
        saveToHistory();
        toast.success('Muro aggiunto!');
      }
    } else if (mode === 'floor') {
      if (!isDrawing) {
        setStartPoint({ x, y });
        setIsDrawing(true);
      } else {
        const width = Math.abs(x - startPoint.x) / scale;
        const depth = Math.abs(y - startPoint.y) / scale;
        const newFloor = {
          id: `floor${floors.length + 1}`,
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width: Math.max(width, 10),
          depth: Math.max(depth, 10),
          ...selectedLibraryItem
        };
        setFloors([...floors, newFloor]);
        setIsDrawing(false);
        setStartPoint(null);
        toast.success('Pavimento aggiunto!');
      }
    } else if (mode === 'room') {
      if (!isDrawing) {
        setStartPoint({ x, y });
        setIsDrawing(true);
      } else {
        const width = Math.abs(x - startPoint.x) / scale;
        const depth = Math.abs(y - startPoint.y) / scale;
        const newRoom = {
          id: `room${rooms.length + 1}`,
          type: 'custom',
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width: Math.max(width, 10), // min 10cm
          depth: Math.max(depth, 10),
          height: wallHeight
        };
        setRooms([...rooms, newRoom]);
        setIsDrawing(false);
        setStartPoint(null);
        toast.success('Stanza aggiunta!');
      }
    } else if (mode === 'door' && selectedLibraryItem) {
      const newDoor = {
        x,
        y,
        ...selectedLibraryItem,
        icon: selectedLibraryItem.icon
      };
      setDoors([...doors, newDoor]);
      toast.success(`${selectedLibraryItem.name} aggiunta!`);
    } else if (mode === 'window' && selectedLibraryItem) {
      const newWindow = {
        x,
        y,
        ...selectedLibraryItem,
        icon: selectedLibraryItem.icon
      };
      setWindows([...windows, newWindow]);
      toast.success(`${selectedLibraryItem.name} aggiunta!`);
    } else if (mode === 'furniture' && selectedLibraryItem) {
      const newFurniture = {
        x,
        y,
        ...selectedLibraryItem,
        icon: selectedLibraryItem.icon
      };
      setFurniture([...furniture, newFurniture]);
      toast.success(`${selectedLibraryItem.name} aggiunto!`);
    } else if (mode === 'move') {
      // Start dragging selected element
      if (selectedElement) {
        setIsDragging(true);
        
        if (selectedElement.type === 'room') {
          setDragOffset({ x: x - selectedElement.data.x, y: y - selectedElement.data.y });
        } else if (selectedElement.type === 'door' || selectedElement.type === 'window') {
          setDragOffset({ x: x - selectedElement.data.x, y: y - selectedElement.data.y });
        } else if (selectedElement.type === 'furniture') {
          setDragOffset({ x: x - selectedElement.data.x, y: y - selectedElement.data.y });
        } else if (selectedElement.type === 'wall') {
          setDragOffset({ x: x - selectedElement.start[0], y: y - selectedElement.start[1] });
        }
      }
    } else if (mode === 'view') {
      let selected = null;
      
      // Check walls first (increased tolerance for easier selection)
      walls.forEach((wall, idx) => {
        const x1 = wall.start[0];
        const y1 = wall.start[1];
        const x2 = wall.end[0];
        const y2 = wall.end[1];
        
        const dist = pointToLineDistance(x, y, x1, y1, x2, y2);
        if (dist < 15) { // Increased from 10 to 15 for easier clicking
          selected = { type: 'wall', idx, start: wall.start, end: wall.end, data: wall };
        }
      });
      
      // Check floors
      floors.forEach((floor, idx) => {
        const width = (floor.width || 4) * scale;
        const depth = (floor.depth || 3) * scale;
        if (x >= floor.x && x <= floor.x + width && y >= floor.y && y <= floor.y + depth) {
          selected = { type: 'floor', idx, data: floor };
        }
      });
      
      // Check rooms
      rooms.forEach(room => {
        const width = (room.width || 4) * scale;
        const depth = (room.depth || 3) * scale;
        if (x >= room.x && x <= room.x + width && y >= room.y && y <= room.y + depth) {
          selected = { type: 'room', id: room.id, data: room };
        }
      });
      
      // Check furniture
      furniture.forEach((item, idx) => {
        const width = (item.width || 1) * scale;
        const depth = (item.depth || 1) * scale;
        if (x >= item.x - width/2 && x <= item.x + width/2 && 
            y >= item.y - depth/2 && y <= item.y + depth/2) {
          selected = { type: 'furniture', idx, data: item };
        }
      });
      
      // Check doors
      doors.forEach((door, idx) => {
        const doorWidth = (door.width || 0.9) * scale;
        if (x >= door.x - doorWidth / 2 && x <= door.x + doorWidth / 2 && 
            y >= door.y - 5 && y <= door.y + 5) {
          selected = { type: 'door', idx, data: door };
        }
      });
      
      // Check windows
      windows.forEach((window, idx) => {
        const windowWidth = (window.width || 1.2) * scale;
        if (x >= window.x - windowWidth / 2 && x <= window.x + windowWidth / 2 && 
            y >= window.y - 3 && y <= window.y + 3) {
          selected = { type: 'window', idx, data: window };
        }
      });
      
      setSelectedElement(selected);
    }
  };

  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const drawResizeHandles = (ctx, x, y, width, height) => {
    const handleSize = 8;
    const handles = [
      { x: x, y: y, pos: 'nw' }, // top-left
      { x: x + width, y: y, pos: 'ne' }, // top-right
      { x: x + width, y: y + height, pos: 'se' }, // bottom-right
      { x: x, y: y + height, pos: 'sw' }, // bottom-left
      { x: x + width/2, y: y, pos: 'n' }, // top-middle
      { x: x + width/2, y: y + height, pos: 's' }, // bottom-middle
      { x: x, y: y + height/2, pos: 'w' }, // left-middle
      { x: x + width, y: y + height/2, pos: 'e' }, // right-middle
    ];

    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    });
  };

  const getResizeHandle = (mouseX, mouseY, x, y, width, height) => {
    const handleSize = 8;
    const threshold = 10;
    const handles = [
      { x: x, y: y, pos: 'nw' },
      { x: x + width, y: y, pos: 'ne' },
      { x: x + width, y: y + height, pos: 'se' },
      { x: x, y: y + height, pos: 'sw' },
      { x: x + width/2, y: y, pos: 'n' },
      { x: x + width/2, y: y + height, pos: 's' },
      { x: x, y: y + height/2, pos: 'w' },
      { x: x + width, y: y + height/2, pos: 'e' },
    ];

    for (const handle of handles) {
      const dist = Math.sqrt(Math.pow(mouseX - handle.x, 2) + Math.pow(mouseY - handle.y, 2));
      if (dist < threshold) {
        return handle.pos;
      }
    }
    return null;
  };

  const getWallEndpointHandle = (mouseX, mouseY, wall) => {
    const threshold = 10;
    
    // Check start point
    const distStart = Math.sqrt(Math.pow(mouseX - wall.start[0], 2) + Math.pow(mouseY - wall.start[1], 2));
    if (distStart < threshold) {
      return 'start';
    }
    
    // Check end point
    const distEnd = Math.sqrt(Math.pow(mouseX - wall.end[0], 2) + Math.pow(mouseY - wall.end[1], 2));
    if (distEnd < threshold) {
      return 'end';
    }
    
    return null;
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'room') {
      setRooms(rooms.filter(r => r.id !== selectedElement.id));
      toast.success('Stanza rimossa!');
    } else if (selectedElement.type === 'door') {
      setDoors(doors.filter((_, idx) => idx !== selectedElement.idx));
      toast.success('Porta rimossa!');
    } else if (selectedElement.type === 'window') {
      setWindows(windows.filter((_, idx) => idx !== selectedElement.idx));
      toast.success('Finestra rimossa!');
    } else if (selectedElement.type === 'furniture') {
      setFurniture(furniture.filter((_, idx) => idx !== selectedElement.idx));
      toast.success('Arredamento rimosso!');
    } else if (selectedElement.type === 'wall') {
      setWalls(walls.filter((_, idx) => idx !== selectedElement.idx));
      toast.success('Muro rimosso!');
    } else if (selectedElement.type === 'floor') {
      setFloors(floors.filter((_, idx) => idx !== selectedElement.idx));
      toast.success('Pavimento rimosso!');
    }
    
    setSelectedElement(null);
  };

  const generateWalls = () => {
    const generatedWalls = [];
    rooms.forEach(room => {
      const x = room.x / scale;
      const y = room.y / scale;
      const w = room.width;
      const d = room.depth;
      
      generatedWalls.push(
        { start: [x, y], end: [x + w, y], height: wallHeight, thickness: 0.2 },
        { start: [x + w, y], end: [x + w, y + d], height: wallHeight, thickness: 0.2 },
        { start: [x + w, y + d], end: [x, y + d], height: wallHeight, thickness: 0.2 },
        { start: [x, y + d], end: [x, y], height: wallHeight, thickness: 0.2 }
      );
    });
    return generatedWalls;
  };

  const handleSave = () => {
    const data = {
      rooms: rooms.map(r => ({
        id: r.id,
        type: r.type,
        width: r.width,
        depth: r.depth,
        height: r.height,
        x: r.x / scale,
        y: r.y / scale
      })),
      doors: doors.map(d => ({
        position: [d.x / scale, d.y / scale],
        width: d.width,
        height: d.height,
        name: d.name
      })),
      windows: windows.map(w => ({
        position: [w.x / scale, w.y / scale],
        width: w.width,
        height: w.height,
        name: w.name
      })),
      furniture: furniture.map(f => ({
        x: f.x / scale,
        y: f.y / scale,
        width: f.width,
        depth: f.depth,
        name: f.name,
        icon: f.icon
      })),
      walls: [...walls, ...generateWalls()]
    };
    
    onSave(data);
    toast.success('Modello 3D generato! Scorri in basso per vederlo.');
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-2 border-slate-200 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Editor 2D Pianta</h3>
          {selectedElement && (
            <p className="text-sm text-blue-600 mt-1">
              ✓ Elemento selezionato: <strong>{selectedElement.type === 'wall' ? 'Muro' : selectedElement.type}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {selectedElement && (
            <Button
              onClick={deleteSelected}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Elimina {selectedElement.type === 'wall' ? 'Muro' : selectedElement.type}
            </Button>
          )}
          <Button
            data-testid="save-2d-changes"
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Genera Render 3D
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools">Strumenti</TabsTrigger>
          <TabsTrigger value="library">Libreria Elementi</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            <Button
              onClick={() => { setMode('view'); setSelectedLibraryItem(null); setIsDragging(false); }}
              variant={mode === 'view' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Move className="w-3 h-3 mr-1" />
              Seleziona
            </Button>
            <Button
              onClick={() => { setMode('move'); setSelectedLibraryItem(null); }}
              variant={mode === 'move' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
              disabled={!selectedElement}
            >
              ✋ Sposta
            </Button>
            <Button
              onClick={() => { setMode('wall'); setSelectedLibraryItem(null); setIsDrawing(false); setStartPoint(null); setIsDragging(false); }}
              variant={mode === 'wall' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Grid3x3 className="w-3 h-3 mr-1" />
              Muro
            </Button>
            <Button
              onClick={() => { setMode('floor'); setSelectedLibraryItem(null); setIsDrawing(false); setStartPoint(null); setIsDragging(false); }}
              variant={mode === 'floor' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              🟫 Pavimento
            </Button>
            <Button
              onClick={() => { setMode('room'); setSelectedLibraryItem(null); setIsDrawing(false); setStartPoint(null); setIsDragging(false); }}
              variant={mode === 'room' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Square className="w-3 h-3 mr-1" />
              Stanza
            </Button>
            <Button
              onClick={() => { setMode('door'); setIsDragging(false); }}
              variant={mode === 'door' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <DoorOpen className="w-3 h-3 mr-1" />
              Porte
            </Button>
            <Button
              onClick={() => { setMode('window'); setIsDragging(false); }}
              variant={mode === 'window' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Finestre
            </Button>
          </div>

          {mode === 'view' && selectedElement && (selectedElement.type === 'room' || selectedElement.type === 'furniture' || selectedElement.type === 'wall' || selectedElement.type === 'floor') && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                {selectedElement.type === 'wall' ? (
                  <>🎯 <strong>Ridimensiona Muro:</strong> Trascina i quadratini blu agli estremi del muro per modificarne lunghezza e angolazione.</>
                ) : (
                  <>🎯 <strong>Ridimensiona:</strong> Trascina i quadratini blu agli angoli/lati dell'elemento per ridimensionare.</>
                )}
              </p>
            </div>
          )}
          {mode === 'move' && selectedElement && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                ✋ <strong>Sposta:</strong> Clicca sull'elemento selezionato ({selectedElement.type}) e trascinalo nella nuova posizione.
              </p>
            </div>
          )}
          {mode === 'move' && !selectedElement && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Prima seleziona un elemento (modalità "Seleziona"), poi attiva "Sposta".
              </p>
            </div>
          )}
          {mode === 'wall' && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-800 mb-2">
                🧱 <strong>Muro:</strong> Clicca punto iniziale, poi clicca punto finale per tracciare un muro.
              </p>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm">Colore Muro:</Label>
                <input
                  type="color"
                  value={wallColor}
                  onChange={(e) => setWallColor(e.target.value)}
                  className="w-12 h-8 rounded border-2 cursor-pointer"
                />
                <span className="text-xs text-slate-600">{wallColor}</span>
              </div>
              {walls.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                      setStartPoint(null);
                      toast.info('Disegno annullato');
                    } else {
                      const newWalls = [...walls];
                      newWalls.pop();
                      setWalls(newWalls);
                      toast.success('Ultimo muro rimosso!');
                    }
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {isDrawing ? 'Annulla disegno' : 'Rimuovi ultimo muro'}
                </Button>
              )}
            </div>
          )}
          {mode === 'floor' && !selectedLibraryItem && (
            <div className="bg-amber-50 p-3 rounded-lg">
              <p className="text-sm text-amber-800">
                👉 Vai alla tab <strong>Libreria Elementi</strong> e seleziona un tipo di pavimento.
              </p>
            </div>
          )}
          {mode === 'floor' && selectedLibraryItem && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ <strong>{selectedLibraryItem.name}</strong> selezionato. Clicca sul canvas per disegnare il pavimento (rettangolo).
              </p>
            </div>
          )}
          {mode === 'room' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                📐 <strong>Stanza:</strong> Clicca per iniziare, poi clicca di nuovo per finire il rettangolo.
              </p>
            </div>
          )}
          {(mode === 'door' || mode === 'window' || mode === 'furniture') && !selectedLibraryItem && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                👉 Vai alla tab <strong>Libreria Elementi</strong> e seleziona un elemento da posizionare.
              </p>
            </div>
          )}
          {selectedLibraryItem && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ <strong>{selectedLibraryItem.name}</strong> selezionato. Clicca sul canvas per posizionare.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🟫 Pavimenti
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.floors.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { setSelectedLibraryItem(item); setMode('floor'); }}
                    className="h-auto flex-col py-3"
                    style={{
                      backgroundColor: selectedLibraryItem?.id === item.id ? undefined : item.color + '20',
                      borderColor: item.color
                    }}
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs text-center">{item.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <DoorOpen className="w-4 h-4" /> Porte
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.doors.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { setSelectedLibraryItem(item); setMode('door'); }}
                    className="h-auto flex-col py-3"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.width}cm</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Maximize2 className="w-4 h-4" /> Finestre
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.windows.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { setSelectedLibraryItem(item); setMode('window'); }}
                    className="h-auto flex-col py-3"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.width}cm</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sofa className="w-4 h-4" /> Arredamento
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {ELEMENT_LIBRARY.furniture.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { setSelectedLibraryItem(item); setMode('furniture'); }}
                    className="h-auto flex-col py-3"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs text-center">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.width}x{item.depth}cm</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {floorPlanImage && backgroundImg && (
        <Card className="p-4 bg-blue-50 border-blue-200 mb-4 mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">🖼️ Controlli Immagine di Sfondo</h4>
          <p className="text-xs text-blue-700 mb-3">
            💡 <strong>Suggerimento:</strong> Usa questi controlli per allineare la planimetria con la griglia prima di disegnare i muri!
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Scala Immagine: {(imageScale * 100).toFixed(0)}%</Label>
              <Input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={imageScale}
                onChange={(e) => setImageScale(parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Opacità: {(imageOpacity * 100).toFixed(0)}%</Label>
              <Input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={imageOpacity}
                onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Posizione</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImagePosition({ x: imagePosition.x - 10, y: imagePosition.y })}
                >←</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImagePosition({ x: imagePosition.x + 10, y: imagePosition.y })}
                >→</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImagePosition({ x: imagePosition.x, y: imagePosition.y - 10 })}
                >↑</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImagePosition({ x: imagePosition.x, y: imagePosition.y + 10 })}
                >↓</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImagePosition({ x: 0, y: 0 })}
                >Reset</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white mt-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={(e) => {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if clicking on a resize handle
            if (mode === 'view' && selectedElement) {
              let handle = null;
              
              if (selectedElement.type === 'room') {
                const room = selectedElement.data;
                const width = (room.width || 4) * scale;
                const depth = (room.depth || 3) * scale;
                handle = getResizeHandle(x, y, room.x, room.y, width, depth);
              } else if (selectedElement.type === 'floor') {
                const floor = selectedElement.data;
                const width = (floor.width || 4) * scale;
                const depth = (floor.depth || 3) * scale;
                handle = getResizeHandle(x, y, floor.x, floor.y, width, depth);
              } else if (selectedElement.type === 'furniture') {
                const item = selectedElement.data;
                const width = (item.width || 1) * scale;
                const depth = (item.depth || 1) * scale;
                handle = getResizeHandle(x, y, item.x - width/2, item.y - depth/2, width, depth);
              } else if (selectedElement.type === 'wall') {
                const wall = selectedElement.data;
                handle = getWallEndpointHandle(x, y, wall);
              }
              
              if (handle) {
                setIsResizing(true);
                setResizeHandle(handle);
                setResizeStart({ x, y });
                setHasInteracted(false);
                e.stopPropagation();
                return;
              }
            }
            
            // Handle dragging in move mode
            if (mode === 'move' && selectedElement) {
              setIsDragging(true);
              setDraggedElement(selectedElement);
              setHasInteracted(false);
              
              if (selectedElement.type === 'wall') {
                const midX = (selectedElement.start[0] + selectedElement.end[0]) / 2;
                const midY = (selectedElement.start[1] + selectedElement.end[1]) / 2;
                setDragOffset({ x: x - midX, y: y - midY });
              } else if (selectedElement.type === 'room' || selectedElement.type === 'floor') {
                setDragOffset({ x: x - selectedElement.data.x, y: y - selectedElement.data.y });
              } else if (selectedElement.type === 'door' || selectedElement.type === 'window' || selectedElement.type === 'furniture') {
                setDragOffset({ x: x - selectedElement.data.x, y: y - selectedElement.data.y });
              }
            }
          }}
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({ x, y });
            
            // Handle resizing
            if (isResizing && resizeHandle && selectedElement) {
              setHasInteracted(true);
              const newX = x;
              const newY = y;
              
              if (selectedElement.type === 'room') {
                const idx = rooms.findIndex(r => r.id === selectedElement.id);
                if (idx !== -1) {
                  const newRooms = [...rooms];
                  const room = newRooms[idx];
                  let newRoom = { ...room };
                  
                  if (resizeHandle.includes('e')) {
                    const newWidth = Math.max(10, (newX - room.x) / scale);
                    newRoom.width = newWidth;
                  }
                  if (resizeHandle.includes('w')) {
                    const oldRight = room.x + room.width * scale;
                    newRoom.x = newX;
                    newRoom.width = Math.max(10, (oldRight - newX) / scale);
                  }
                  if (resizeHandle.includes('s')) {
                    const newDepth = Math.max(10, (newY - room.y) / scale);
                    newRoom.depth = newDepth;
                  }
                  if (resizeHandle.includes('n')) {
                    const oldBottom = room.y + room.depth * scale;
                    newRoom.y = newY;
                    newRoom.depth = Math.max(10, (oldBottom - newY) / scale);
                  }
                  
                  newRooms[idx] = newRoom;
                  setRooms(newRooms);
                  setSelectedElement({ ...selectedElement, data: newRoom });
                }
              } else if (selectedElement.type === 'floor') {
                const idx = selectedElement.idx;
                if (idx !== undefined) {
                  const newFloors = [...floors];
                  const floor = newFloors[idx];
                  let newFloor = { ...floor };
                  
                  if (resizeHandle.includes('e')) {
                    const newWidth = Math.max(10, (newX - floor.x) / scale);
                    newFloor.width = newWidth;
                  }
                  if (resizeHandle.includes('w')) {
                    const oldRight = floor.x + floor.width * scale;
                    newFloor.x = newX;
                    newFloor.width = Math.max(10, (oldRight - newX) / scale);
                  }
                  if (resizeHandle.includes('s')) {
                    const newDepth = Math.max(10, (newY - floor.y) / scale);
                    newFloor.depth = newDepth;
                  }
                  if (resizeHandle.includes('n')) {
                    const oldBottom = floor.y + floor.depth * scale;
                    newFloor.y = newY;
                    newFloor.depth = Math.max(10, (oldBottom - newY) / scale);
                  }
                  
                  newFloors[idx] = newFloor;
                  setFloors(newFloors);
                  setSelectedElement({ ...selectedElement, data: newFloor });
                }
              } else if (selectedElement.type === 'furniture') {
                const idx = selectedElement.idx;
                if (idx !== undefined) {
                  const newFurniture = [...furniture];
                  const item = newFurniture[idx];
                  let newItem = { ...item };
                  
                  const centerX = item.x;
                  const centerY = item.y;
                  
                  if (resizeHandle.includes('e')) {
                    const distFromCenter = Math.abs(newX - centerX);
                    newItem.width = Math.max(10, distFromCenter * 2 / scale);
                  }
                  if (resizeHandle.includes('w')) {
                    const distFromCenter = Math.abs(centerX - newX);
                    newItem.width = Math.max(10, distFromCenter * 2 / scale);
                  }
                  if (resizeHandle.includes('s')) {
                    const distFromCenter = Math.abs(newY - centerY);
                    newItem.depth = Math.max(10, distFromCenter * 2 / scale);
                  }
                  if (resizeHandle.includes('n')) {
                    const distFromCenter = Math.abs(centerY - newY);
                    newItem.depth = Math.max(10, distFromCenter * 2 / scale);
                  }
                  
                  newFurniture[idx] = newItem;
                  setFurniture(newFurniture);
                  setSelectedElement({ ...selectedElement, data: newItem });
                }
              } else if (selectedElement.type === 'wall') {
                const idx = selectedElement.idx;
                if (idx !== undefined) {
                  const newWalls = [...walls];
                  const wall = newWalls[idx];
                  let newWall = { ...wall };
                  
                  if (resizeHandle === 'start') {
                    newWall.start = [newX, newY];
                  } else if (resizeHandle === 'end') {
                    newWall.end = [newX, newY];
                  }
                  
                  newWalls[idx] = newWall;
                  setWalls(newWalls);
                  setSelectedElement({ ...selectedElement, data: newWall, start: newWall.start, end: newWall.end });
                }
              }
            }
            
            // Handle dragging
            if (isDragging && draggedElement && mode === 'move') {
              setHasInteracted(true);
              if (draggedElement.type === 'wall') {
                const idx = draggedElement.idx;
                const newWalls = [...walls];
                const wall = newWalls[idx];
                
                // Calculate the new center position
                const newCenterX = x - dragOffset.x;
                const newCenterY = y - dragOffset.y;
                
                // Calculate the current center
                const oldCenterX = (wall.start[0] + wall.end[0]) / 2;
                const oldCenterY = (wall.start[1] + wall.end[1]) / 2;
                
                // Calculate the delta
                const deltaX = newCenterX - oldCenterX;
                const deltaY = newCenterY - oldCenterY;
                
                newWalls[idx] = {
                  ...wall,
                  start: [wall.start[0] + deltaX, wall.start[1] + deltaY],
                  end: [wall.end[0] + deltaX, wall.end[1] + deltaY]
                };
                
                setWalls(newWalls);
                setSelectedElement({ ...draggedElement, start: newWalls[idx].start, end: newWalls[idx].end, data: newWalls[idx] });
              } else if (draggedElement.type === 'room') {
                const idx = rooms.findIndex(r => r.id === draggedElement.id);
                if (idx !== -1) {
                  const newRooms = [...rooms];
                  newRooms[idx] = {
                    ...newRooms[idx],
                    x: x - dragOffset.x,
                    y: y - dragOffset.y
                  };
                  setRooms(newRooms);
                  setSelectedElement({ ...draggedElement, data: newRooms[idx] });
                }
              } else if (draggedElement.type === 'floor') {
                const idx = draggedElement.idx;
                if (idx !== undefined) {
                  const newFloors = [...floors];
                  newFloors[idx] = {
                    ...newFloors[idx],
                    x: x - dragOffset.x,
                    y: y - dragOffset.y
                  };
                  setFloors(newFloors);
                  setSelectedElement({ ...draggedElement, data: newFloors[idx] });
                }
              } else if (draggedElement.type === 'door') {
                const idx = draggedElement.idx;
                const newDoors = [...doors];
                newDoors[idx] = {
                  ...newDoors[idx],
                  x: x - dragOffset.x,
                  y: y - dragOffset.y
                };
                setDoors(newDoors);
                setSelectedElement({ ...draggedElement, data: newDoors[idx] });
              } else if (draggedElement.type === 'window') {
                const idx = draggedElement.idx;
                const newWindows = [...windows];
                newWindows[idx] = {
                  ...newWindows[idx],
                  x: x - dragOffset.x,
                  y: y - dragOffset.y
                };
                setWindows(newWindows);
                setSelectedElement({ ...draggedElement, data: newWindows[idx] });
              } else if (draggedElement.type === 'furniture') {
                const idx = draggedElement.idx;
                const newFurniture = [...furniture];
                newFurniture[idx] = {
                  ...newFurniture[idx],
                  x: x - dragOffset.x,
                  y: y - dragOffset.y
                };
                setFurniture(newFurniture);
                setSelectedElement({ ...draggedElement, data: newFurniture[idx] });
              }
            }
          }}
          onMouseUp={(e) => {
            if (isResizing) {
              setIsResizing(false);
              setResizeHandle(null);
              setResizeStart(null);
              if (hasInteracted) {
                toast.success('Elemento ridimensionato!');
              }
              setHasInteracted(false);
              return;
            }
            if (isDragging) {
              setIsDragging(false);
              setDraggedElement(null);
              if (hasInteracted) {
                toast.success('Elemento spostato!');
              }
              setHasInteracted(false);
              return;
            }
            
            // If not resizing or dragging, handle as click
            if (!hasInteracted) {
              handleCanvasClick(e);
            }
            setHasInteracted(false);
          }}
          onMouseLeave={() => {
            setMousePos(null);
            if (isResizing) {
              setIsResizing(false);
              setResizeHandle(null);
              setResizeStart(null);
            }
            if (isDragging) {
              setIsDragging(false);
              setDraggedElement(null);
            }
          }}
          className="w-full"
          style={{
            cursor: isResizing ? 'nwse-resize' : 
                    isDragging ? 'move' : 
                    mode === 'move' ? 'move' : 
                    'crosshair'
          }}
          data-testid="floor-plan-canvas"
        />
      </div>
      
      {floorPlanImage && (
        <div className="mt-2 text-xs text-slate-500">
          URL immagine: {floorPlanImage.substring(0, 80)}...
          {backgroundImg && <span className="text-green-600 ml-2">✓ Caricata</span>}
          {!backgroundImg && <span className="text-orange-600 ml-2">⏳ Caricamento...</span>}
        </div>
      )}

      <div className="mt-4 grid grid-cols-5 gap-3">
        <div>
          <Label>Altezza Muri (cm)</Label>
          <Input
            type="number"
            step="10"
            value={wallHeight}
            onChange={(e) => setWallHeight(parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Spessore Muri (cm)</Label>
          <Input
            type="number"
            step="5"
            value={wallThickness}
            onChange={(e) => setWallThickness(parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Scala (px/cm)</Label>
          <Input
            type="number"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Elementi</Label>
          <p className="text-sm mt-1 text-slate-600">
            {rooms.length} stanze<br/>
            {doors.length} porte, {windows.length} finestre<br/>
            {furniture.length} mobili
          </p>
        </div>
        <div>
          <Label className="text-sm">Struttura</Label>
          <p className="text-sm mt-1 text-slate-600">
            {walls.length} muri<br/>
            {floors.length} pavimenti
          </p>
        </div>
      </div>

      {selectedElement && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">✓ Selezionato: {selectedElement.type === 'wall' ? 'Muro' : selectedElement.type === 'room' ? 'Stanza' : selectedElement.type === 'floor' ? 'Pavimento' : selectedElement.type === 'door' ? 'Porta' : selectedElement.type === 'window' ? 'Finestra' : 'Arredamento'}</h4>
              <div className="text-sm space-y-1 mt-2">
                {selectedElement.type === 'room' && (
                  <>
                    <p>ID: {selectedElement.data.id}</p>
                    <p>Dimensioni: {selectedElement.data.width}cm x {selectedElement.data.depth}cm x {selectedElement.data.height}cm</p>
                  </>
                )}
                {selectedElement.type === 'floor' && (
                  <>
                    <p>Tipo: {selectedElement.data.name}</p>
                    <p>Dimensioni: {selectedElement.data.width}cm x {selectedElement.data.depth}cm</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span>Colore:</span>
                      <div className="w-6 h-6 rounded border-2" style={{ backgroundColor: selectedElement.data.color }}></div>
                      <span className="text-xs">{selectedElement.data.color}</span>
                    </div>
                  </>
                )}
                {selectedElement.type === 'door' && (
                  <p>Porta: {selectedElement.data.name} ({selectedElement.data.width}cm)</p>
                )}
                {selectedElement.type === 'window' && (
                  <p>Finestra: {selectedElement.data.name} ({selectedElement.data.width}cm)</p>
                )}
                {selectedElement.type === 'furniture' && (
                  <p>Arredo: {selectedElement.data.name} ({selectedElement.data.width}x{selectedElement.data.depth}cm)</p>
                )}
                {selectedElement.type === 'wall' && (
                  <>
                    <p>Lunghezza: {(Math.sqrt(Math.pow((selectedElement.end[0] - selectedElement.start[0]), 2) + Math.pow((selectedElement.end[1] - selectedElement.start[1]), 2)) / scale).toFixed(0)}cm, spessore {wallThickness}cm</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span>Colore:</span>
                      <div className="w-6 h-6 rounded border-2" style={{ backgroundColor: selectedElement.data.color || wallColor }}></div>
                      <span className="text-xs">{selectedElement.data.color || wallColor}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                💡 Premi <kbd className="px-2 py-1 bg-white rounded border">Canc</kbd> o clicca sul pulsante per eliminare
              </p>
            </div>
            <Button onClick={deleteSelected} variant="destructive" size="lg">
              <Trash2 className="w-5 h-5 mr-2" />
              Elimina
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FloorPlanEditor2D;