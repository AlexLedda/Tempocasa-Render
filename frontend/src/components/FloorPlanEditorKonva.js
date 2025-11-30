import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Grid3x3, Square, DoorOpen, Maximize2, Move, Save, Trash2, Search, Upload, Plus } from 'lucide-react';
import { EXTENDED_LIBRARY, getAllItems, searchItems } from '../data/extendedLibrary';

// Mantieni compatibilità per ora
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

const FloorPlanEditorKonva = ({ floorPlanImage, threeDData, onSave }) => {
  const stageRef = useRef(null);
  const [mode, setMode] = useState('view');
  const [scale, setScale] = useState(0.1); // 0.1 pixels per cm (default)
  const [wallThickness, setWallThickness] = useState(20); // cm
  
  // Elements
  const [walls, setWalls] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [furniture, setFurniture] = useState([]);
  
  // UI State
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);
  const [wallColor, setWallColor] = useState('#0f172a');
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Custom elements
  const [customElements, setCustomElements] = useState([]);
  
  // Scale calibration
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStart, setCalibrationStart] = useState(null);
  const [calibrationEnd, setCalibrationEnd] = useState(null);
  const [calibrationRealLength, setCalibrationRealLength] = useState(500); // cm
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [wallLengthInput, setWallLengthInput] = useState(''); // For numeric input during wall drawing
  const [showWallLengthInput, setShowWallLengthInput] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Background image
  const [backgroundImg, setBackgroundImg] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(0.5);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  // Measurements
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [measurementUnit, setMeasurementUnit] = useState('auto'); // 'cm', 'm', 'auto'
  
  // Copy/Paste clipboard
  const [clipboard, setClipboard] = useState(null);
  
  // Grid and canvas
  const [showGrid, setShowGrid] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(1);
  
  // Canvas dimensions
  const canvasWidth = 1400;
  const canvasHeight = 900;
  
  // Load background image and auto-fit
  useEffect(() => {
    if (floorPlanImage) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = floorPlanImage;
      img.onload = () => {
        setBackgroundImg(img);
        
        // Auto-fit image to canvas - FIX: ridotto a 60% per evitare immagini troppo grandi
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const autoScale = Math.min(scaleX, scaleY, 0.6); // Max 60% per dare spazio al disegno
        
        setImageScale(autoScale);
        
        // Center the image
        const centeredX = (canvasWidth - img.width * autoScale) / 2;
        const centeredY = (canvasHeight - img.height * autoScale) / 2;
        setImagePosition({ x: centeredX, y: centeredY });
        
        toast.info(`📐 Piantina caricata al ${(autoScale * 100).toFixed(0)}% - Usa slider Scala Immagine per regolare`);
        console.log('Background image loaded and fitted for Konva');
      };
    }
  }, [floorPlanImage]);
  
  // Snap to grid helper
  const snapToGridCoords = (x, y) => {
    if (!snapToGrid) return { x, y };
    const gridSize = scale * 10; // 10cm grid
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };
  
  // Measurement helper functions
  const pixelsToRealUnit = (pixels) => {
    // scale is pixels per cm, so pixels / scale = cm
    return pixels / scale;
  };
  
  const formatMeasurement = (cm) => {
    if (measurementUnit === 'cm') {
      return `${cm.toFixed(1)} cm`;
    } else if (measurementUnit === 'm') {
      return `${(cm / 100).toFixed(2)} m`;
    } else {
      // Auto: use m for > 100cm, cm otherwise
      if (cm >= 100) {
        return `${(cm / 100).toFixed(2)} m`;
      } else {
        return `${cm.toFixed(1)} cm`;
      }
    }
  };
  
  // Save to history
  const saveToHistory = () => {
    const currentState = {
      walls: JSON.parse(JSON.stringify(walls)),
      rooms: JSON.parse(JSON.stringify(rooms)),
      floors: JSON.parse(JSON.stringify(floors)),
      doors: JSON.parse(JSON.stringify(doors)),
      windows: JSON.parse(JSON.stringify(windows)),
      furniture: JSON.parse(JSON.stringify(furniture))
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  };
  
  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      
      setWalls(JSON.parse(JSON.stringify(state.walls)));
      setRooms(JSON.parse(JSON.stringify(state.rooms)));
      setFloors(JSON.parse(JSON.stringify(state.floors)));
      setDoors(JSON.parse(JSON.stringify(state.doors)));
      setWindows(JSON.parse(JSON.stringify(state.windows)));
      setFurniture(JSON.parse(JSON.stringify(state.furniture)));
      
      setHistoryIndex(newIndex);
      toast.success('Annullato');
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      
      setWalls(JSON.parse(JSON.stringify(state.walls)));
      setRooms(JSON.parse(JSON.stringify(state.rooms)));
      setFloors(JSON.parse(JSON.stringify(state.floors)));
      setDoors(JSON.parse(JSON.stringify(state.doors)));
      setWindows(JSON.parse(JSON.stringify(state.windows)));
      setFurniture(JSON.parse(JSON.stringify(state.furniture)));
      
      setHistoryIndex(newIndex);
      toast.success('Ripristinato');
    }
  };
  
  // Copy/Paste functions
  const copySelected = () => {
    if (!selectedId) {
      toast.error('Nessun elemento selezionato');
      return;
    }
    
    // Find selected element in all arrays
    const selectedWall = walls.find(w => w.id === selectedId);
    const selectedRoom = rooms.find(r => r.id === selectedId);
    const selectedFloor = floors.find(f => f.id === selectedId);
    const selectedDoor = doors.find(d => d.id === selectedId);
    const selectedWindow = windows.find(w => w.id === selectedId);
    const selectedFurniture = furniture.find(f => f.id === selectedId);
    
    const element = selectedWall || selectedRoom || selectedFloor || selectedDoor || selectedWindow || selectedFurniture;
    
    if (element) {
      let type = 'wall';
      if (selectedRoom) type = 'room';
      if (selectedFloor) type = 'floor';
      if (selectedDoor) type = 'door';
      if (selectedWindow) type = 'window';
      if (selectedFurniture) type = 'furniture';
      
      setClipboard({ type, element: JSON.parse(JSON.stringify(element)) });
      toast.success('Elemento copiato! Premi Ctrl+V per incollare');
    }
  };
  
  const pasteElement = () => {
    if (!clipboard) {
      toast.error('Nessun elemento da incollare');
      return;
    }
    
    const offset = 30; // Offset in pixels to avoid exact overlap
    const newElement = JSON.parse(JSON.stringify(clipboard.element));
    newElement.id = `${clipboard.type}-${Date.now()}`;
    
    // Apply offset
    if (newElement.x !== undefined) {
      newElement.x += offset;
      newElement.y += offset;
    }
    if (newElement.points) {
      // For walls
      newElement.points = newElement.points.map((p, i) => 
        i % 2 === 0 ? p + offset : p + offset
      );
    }
    
    // Add to appropriate array
    switch (clipboard.type) {
      case 'wall':
        setWalls([...walls, newElement]);
        break;
      case 'room':
        setRooms([...rooms, newElement]);
        break;
      case 'floor':
        setFloors([...floors, newElement]);
        break;
      case 'door':
        setDoors([...doors, newElement]);
        break;
      case 'window':
        setWindows([...windows, newElement]);
        break;
      case 'furniture':
        setFurniture([...furniture, newElement]);
        break;
    }
    
    saveToHistory();
    setSelectedId(newElement.id);
    toast.success('Elemento incollato!');
  };
  
  const duplicateSelected = () => {
    copySelected();
    if (clipboard) {
      pasteElement();
    }
  };
  
  // Handle canvas click
  const handleStageClick = (e) => {
    // Check if clicking on empty area
    if (e.target === e.target.getStage()) {
      // Place element from library if selected
      if (selectedLibraryItem && (mode === 'door' || mode === 'window' || mode === 'furniture' || mode === 'floor')) {
        const pos = e.target.getStage().getPointerPosition();
        const snapped = snapToGridCoords(pos.x, pos.y);
        
        if (mode === 'door') {
          const newDoor = {
            id: `door-${Date.now()}`,
            x: snapped.x,
            y: snapped.y,
            width: (selectedLibraryItem.width || 90) * scale,
            height: 10,
            fill: 'rgba(34, 197, 94, 0.5)',
            ...selectedLibraryItem
          };
          setDoors([...doors, newDoor]);
          saveToHistory();
          toast.success(`${selectedLibraryItem.name} aggiunta!`);
        } else if (mode === 'window') {
          const newWindow = {
            id: `window-${Date.now()}`,
            x: snapped.x,
            y: snapped.y,
            width: (selectedLibraryItem.width || 80) * scale,
            height: 10,
            fill: 'rgba(59, 130, 246, 0.5)',
            ...selectedLibraryItem
          };
          setWindows([...windows, newWindow]);
          saveToHistory();
          toast.success(`${selectedLibraryItem.name} aggiunta!`);
        } else if (mode === 'furniture') {
          const newFurniture = {
            id: `furniture-${Date.now()}`,
            x: snapped.x,
            y: snapped.y,
            width: (selectedLibraryItem.width || 100) * scale,
            height: (selectedLibraryItem.depth || 100) * scale,
            fill: 'rgba(168, 85, 247, 0.4)',
            ...selectedLibraryItem
          };
          setFurniture([...furniture, newFurniture]);
          saveToHistory();
          toast.success(`${selectedLibraryItem.name} aggiunto!`);
        } else if (mode === 'floor') {
          const newFloor = {
            id: `floor-${Date.now()}`,
            x: snapped.x,
            y: snapped.y,
            width: 400, // Default 4m
            height: 300, // Default 3m
            ...selectedLibraryItem
          };
          setFloors([...floors, newFloor]);
          saveToHistory();
          toast.success(`${selectedLibraryItem.name} aggiunto!`);
        }
        return;
      }
      
      setSelectedId(null);
      return;
    }
  };
  
  // Handle stage mouse down for drawing
  const handleStageMouseDown = (e) => {
    // Calibration mode
    if (isCalibrating) {
      const pos = e.target.getStage().getPointerPosition();
      if (!calibrationStart) {
        setCalibrationStart(pos);
      } else if (!calibrationEnd) {
        setCalibrationEnd(pos);
      }
      return;
    }
    
    if (mode === 'wall' && !isDrawing) {
      const pos = e.target.getStage().getPointerPosition();
      const snapped = snapToGridCoords(pos.x, pos.y);
      setDrawStart(snapped);
      setIsDrawing(true);
    }
  };
  
  // Handle stage mouse up for drawing
  const handleStageMouseUp = (e) => {
    if (mode === 'wall' && isDrawing && drawStart) {
      const pos = e.target.getStage().getPointerPosition();
      const snapped = snapToGridCoords(pos.x, pos.y);
      
      const newWall = {
        id: `wall-${Date.now()}`,
        points: [drawStart.x, drawStart.y, snapped.x, snapped.y],
        stroke: wallColor,
        strokeWidth: wallThickness * scale,
        thickness: wallThickness // Store in cm
      };
      
      setWalls([...walls, newWall]);
      saveToHistory();
      setIsDrawing(false);
      setDrawStart(null);
      toast.success('Muro aggiunto!');
    }
  };
  
  // Delete selected element
  const deleteSelected = () => {
    if (!selectedId) return;
    
    saveToHistory();
    
    if (selectedId.startsWith('wall-')) {
      setWalls(walls.filter(w => w.id !== selectedId));
      toast.success('Muro rimosso!');
    } else if (selectedId.startsWith('room-')) {
      setRooms(rooms.filter(r => r.id !== selectedId));
      toast.success('Stanza rimossa!');
    } else if (selectedId.startsWith('floor-')) {
      setFloors(floors.filter(f => f.id !== selectedId));
      toast.success('Pavimento rimosso!');
    } else if (selectedId.startsWith('door-')) {
      setDoors(doors.filter(d => d.id !== selectedId));
      toast.success('Porta rimossa!');
    } else if (selectedId.startsWith('window-')) {
      setWindows(windows.filter(w => w.id !== selectedId));
      toast.success('Finestra rimossa!');
    } else if (selectedId.startsWith('furniture-')) {
      setFurniture(furniture.filter(f => f.id !== selectedId));
      toast.success('Arredamento rimosso!');
    }
    
    setSelectedId(null);
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteElement();
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'v' || e.key === 'V') setMode('view');
        else if (e.key === 's' || e.key === 'S') setMode('move');
        else if (e.key === 'w' || e.key === 'W') setMode('wall');
        else if (e.key === 'g' || e.key === 'G') {
          setSnapToGrid(!snapToGrid);
          toast.info(`Snap to Grid: ${!snapToGrid ? 'ON' : 'OFF'}`);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, snapToGrid, history, historyIndex, clipboard, walls, rooms, floors, doors, windows, furniture]);
  
  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Editor 2D Pianta - Konva</h3>
          {selectedId && (
            <p className="text-sm text-blue-600 mt-1">
              ✓ Elemento selezionato: <strong>{selectedId}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {selectedId && (
            <>
              <Button onClick={copySelected} variant="outline" size="sm">
                📋 Copia
              </Button>
              <Button onClick={duplicateSelected} variant="outline" size="sm">
                📑 Duplica
              </Button>
              <Button onClick={deleteSelected} variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-1" />
                Elimina
              </Button>
            </>
          )}
          {clipboard && !selectedId && (
            <Button onClick={pasteElement} variant="outline" size="sm">
              📋 Incolla
            </Button>
          )}
          <Button
            onClick={() => {
              const data = { walls, rooms, floors, doors, windows, furniture };
              onSave(data);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Salva
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools">🛠️ Strumenti</TabsTrigger>
          <TabsTrigger value="library">📚 Libreria Elementi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tools" className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
                ↶ Undo
              </Button>
              <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
                ↷ Redo
              </Button>
            </div>
            
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant={snapToGrid ? 'default' : 'outline'}
                onClick={() => {
                  setSnapToGrid(!snapToGrid);
                  toast.info(`Snap to Grid: ${!snapToGrid ? 'ON' : 'OFF'}`);
                }}
              >
                🧲 Snap: {snapToGrid ? 'ON' : 'OFF'}
              </Button>
              
              <Button
                size="sm"
                variant={showGrid ? 'default' : 'outline'}
                onClick={() => {
                  setShowGrid(!showGrid);
                  toast.info(`Griglia: ${!showGrid ? 'Visibile' : 'Nascosta'}`);
                }}
              >
                📐 Griglia: {showGrid ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
          
          {/* Zoom Controls - Nuovo */}
          <Card className="p-3 bg-purple-50 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2 text-sm">🔍 Controlli Vista Canvas</h4>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newZoom = Math.max(0.5, canvasZoom - 0.1);
                  setCanvasZoom(newZoom);
                  toast.info(`Zoom: ${(newZoom * 100).toFixed(0)}%`);
                }}
                disabled={canvasZoom <= 0.5}
              >
                🔍-
              </Button>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded border">
                {(canvasZoom * 100).toFixed(0)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newZoom = Math.min(2, canvasZoom + 0.1);
                  setCanvasZoom(newZoom);
                  toast.info(`Zoom: ${(newZoom * 100).toFixed(0)}%`);
                }}
                disabled={canvasZoom >= 2}
              >
                🔍+
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCanvasZoom(1);
                  toast.info('Zoom reset a 100%');
                }}
              >
                ↺ Reset
              </Button>
            </div>
            <p className="text-xs text-purple-700 mt-2">
              💡 Usa zoom per vedere meglio i dettagli della piantina
            </p>
          </Card>
          
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => setMode('view')}
              variant={mode === 'view' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Move className="w-3 h-3 mr-1" />
              Seleziona
            </Button>
            <Button
              onClick={() => setMode('move')}
              variant={mode === 'move' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              🖐️ Sposta
            </Button>
            <Button
              onClick={() => setMode('wall')}
              variant={mode === 'wall' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Grid3x3 className="w-3 h-3 mr-1" />
              Muro
            </Button>
            <Button
              onClick={() => setMode('room')}
              variant={mode === 'room' ? 'default' : 'outline'}
              className="w-full text-xs px-1"
            >
              <Square className="w-3 h-3 mr-1" />
              Stanza
            </Button>
          </div>
          
          {mode === 'wall' && (
            <div className="bg-slate-50 p-3 rounded-lg space-y-3">
              <p className="text-sm text-slate-800">
                🧱 <strong>Muro:</strong> Clicca punto iniziale, poi clicca punto finale.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Colore Muro:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={wallColor}
                      onChange={(e) => setWallColor(e.target.value)}
                      className="w-12 h-8 rounded border-2 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">{wallColor}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Spessore Muro: {wallThickness}cm</Label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={wallThickness}
                    onChange={(e) => setWallThickness(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>10cm</span>
                    <span>50cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {mode === 'move' && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                🖐️ <strong>Modalità Sposta:</strong> Clicca e trascina qualsiasi elemento!
              </p>
            </div>
          )}
          
          {/* Scale Calibration */}
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md">
            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              📏 Calibrazione Scala
              <span className="text-xs bg-amber-200 px-2 py-1 rounded-full font-normal">Importante</span>
            </h4>
            <p className="text-xs text-amber-800 mb-3 leading-relaxed">
              <strong>Stile Homestyler:</strong> Traccia una linea su una dimensione nota della planimetria (es: larghezza porta, lunghezza parete) e inserisci la misura reale per calibrare tutto l'editor.
            </p>
            
            {!isCalibrating ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Scala attuale:</Label>
                  <span className="text-sm font-mono bg-white px-2 py-1 rounded">
                    {(1 / scale).toFixed(1)} px = 1 cm
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setIsCalibrating(true);
                    setCalibrationStart(null);
                    setCalibrationEnd(null);
                    toast.info('Clicca su due punti della planimetria per calibrare');
                  }}
                  className="w-full"
                >
                  🎯 Avvia Calibrazione
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {!calibrationStart && (
                  <p className="text-sm text-amber-800">
                    📍 <strong>Step 1:</strong> Clicca sul primo punto della linea di riferimento
                  </p>
                )}
                {calibrationStart && !calibrationEnd && (
                  <p className="text-sm text-amber-800">
                    📍 <strong>Step 2:</strong> Clicca sul secondo punto
                  </p>
                )}
                {calibrationStart && calibrationEnd && (
                  <div className="space-y-3">
                    <div className="bg-amber-100 border border-amber-300 rounded p-3">
                      <p className="text-xs font-semibold text-amber-900 mb-1">📏 Distanza tracciata:</p>
                      <p className="text-lg font-bold text-amber-800">
                        {Math.sqrt(
                          Math.pow(calibrationEnd.x - calibrationStart.x, 2) + 
                          Math.pow(calibrationEnd.y - calibrationStart.y, 2)
                        ).toFixed(0)} pixel
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold">Lunghezza reale di questa distanza:</Label>
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            value={calibrationRealLength}
                            onChange={(e) => setCalibrationRealLength(parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            min="1"
                            step="10"
                            placeholder="es: 300"
                          />
                        </div>
                        <select 
                          className="px-3 py-2 border-2 border-amber-400 rounded-lg"
                          onChange={(e) => {
                            if (e.target.value === 'm') {
                              setCalibrationRealLength(calibrationRealLength / 100);
                            } else if (e.target.value === 'cm' && calibrationRealLength < 10) {
                              setCalibrationRealLength(calibrationRealLength * 100);
                            }
                          }}
                        >
                          <option value="cm">cm</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        💡 Es: se hai tracciato una porta standard, inserisci 90cm o 0.9m
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const pixelLength = Math.sqrt(
                            Math.pow(calibrationEnd.x - calibrationStart.x, 2) + 
                            Math.pow(calibrationEnd.y - calibrationStart.y, 2)
                          );
                          const newScale = pixelLength / calibrationRealLength;
                          setScale(newScale);
                          setIsCalibrating(false);
                          setCalibrationStart(null);
                          setCalibrationEnd(null);
                          toast.success(`✅ Scala calibrata! 1cm = ${(1/newScale).toFixed(2)}px`);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        ✅ Applica e Salva
                      </Button>
                      <Button
                        onClick={() => {
                          setIsCalibrating(false);
                          setCalibrationStart(null);
                          setCalibrationEnd(null);
                          toast.info('Calibrazione annullata');
                        }}
                        variant="outline"
                        className="border-2"
                      >
                        ❌ Annulla
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Image Background Controls */}
          {floorPlanImage && backgroundImg && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🖼️ Controlli Immagine di Sfondo</h4>
              <p className="text-xs text-blue-700 mb-3">
                💡 <strong>Suggerimento:</strong> Usa questi controlli per allineare la planimetria con la griglia!
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Scala Immagine</Label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={imageScale}
                    onChange={(e) => setImageScale(parseFloat(e.target.value))}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-blue-600 mt-1">{(imageScale * 100).toFixed(0)}%</p>
                </div>
                
                <div>
                  <Label className="text-sm">Opacità</Label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={imageOpacity}
                    onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-blue-600 mt-1">{(imageOpacity * 100).toFixed(0)}%</p>
                </div>
                
                <div>
                  <Label className="text-sm">Posizione</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImagePosition({ ...imagePosition, x: imagePosition.x - 10 })}
                    >
                      ←
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImagePosition({ ...imagePosition, x: imagePosition.x + 10 })}
                    >
                      →
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImagePosition({ ...imagePosition, y: imagePosition.y - 10 })}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImagePosition({ ...imagePosition, y: imagePosition.y + 10 })}
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (backgroundImg) {
                          // Auto-fit
                          const scaleX = canvasWidth / backgroundImg.width;
                          const scaleY = canvasHeight / backgroundImg.height;
                          const autoScale = Math.min(scaleX, scaleY, 1);
                          setImageScale(autoScale);
                          
                          const centeredX = (canvasWidth - backgroundImg.width * autoScale) / 2;
                          const centeredY = (canvasHeight - backgroundImg.height * autoScale) / 2;
                          setImagePosition({ x: centeredX, y: centeredY });
                          setImageOpacity(0.5);
                        }
                      }}
                      title="Adatta immagine al canvas"
                    >
                      Fit
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Measurements Controls */}
          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-2">📐 Controlli Misure</h4>
            <p className="text-xs text-indigo-700 mb-3">
              Mostra/nascondi le dimensioni degli elementi in tempo reale
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mostra Misure:</Label>
                <Button
                  size="sm"
                  variant={showMeasurements ? 'default' : 'outline'}
                  onClick={() => {
                    setShowMeasurements(!showMeasurements);
                    toast.info(`Misure: ${!showMeasurements ? 'Visibili' : 'Nascoste'}`);
                  }}
                  className={showMeasurements ? 'bg-indigo-600' : ''}
                >
                  {showMeasurements ? '✅ Attivo' : '❌ Disattivo'}
                </Button>
              </div>
              
              {showMeasurements && (
                <div>
                  <Label className="text-sm mb-2 block">Unità di Misura:</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={measurementUnit === 'cm' ? 'default' : 'outline'}
                      onClick={() => setMeasurementUnit('cm')}
                      className="flex-1"
                    >
                      cm
                    </Button>
                    <Button
                      size="sm"
                      variant={measurementUnit === 'm' ? 'default' : 'outline'}
                      onClick={() => setMeasurementUnit('m')}
                      className="flex-1"
                    >
                      m
                    </Button>
                    <Button
                      size="sm"
                      variant={measurementUnit === 'auto' ? 'default' : 'outline'}
                      onClick={() => setMeasurementUnit('auto')}
                      className="flex-1"
                    >
                      Auto
                    </Button>
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">
                    {measurementUnit === 'auto' ? 'Auto: cm per <100cm, m altrimenti' : `Sempre in ${measurementUnit}`}
                  </p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Keyboard Shortcuts Help */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-slate-700 mb-1">⌨️ Scorciatoie:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
              <span><kbd className="bg-white px-1 rounded">V</kbd> Seleziona</span>
              <span><kbd className="bg-white px-1 rounded">S</kbd> Sposta</span>
              <span><kbd className="bg-white px-1 rounded">W</kbd> Muro</span>
              <span><kbd className="bg-white px-1 rounded">G</kbd> Toggle Snap</span>
              <span><kbd className="bg-white px-1 rounded">Ctrl+Z</kbd> Undo</span>
              <span><kbd className="bg-white px-1 rounded">Ctrl+Y</kbd> Redo</span>
              <span><kbd className="bg-white px-1 rounded">Ctrl+C</kbd> Copia</span>
              <span><kbd className="bg-white px-1 rounded">Ctrl+V</kbd> Incolla</span>
              <span><kbd className="bg-white px-1 rounded">Ctrl+D</kbd> Duplica</span>
              <span><kbd className="bg-white px-1 rounded">Canc</kbd> Elimina</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="library" className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca elementi... (es: divano, tavolo, porta)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const newCustom = {
                        id: `custom-${Date.now()}`,
                        name: file.name.split('.')[0],
                        imageUrl: event.target.result,
                        width: 100,
                        depth: 100,
                        icon: '🖼️',
                        isCustom: true
                      };
                      setCustomElements([...customElements, newCustom]);
                      toast.success('Elemento custom aggiunto!');
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              title="Carica elemento personalizzato"
            >
              <Upload className="w-4 h-4 mr-1" />
              Carica
            </Button>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              Tutti
            </Button>
            {Object.keys(EXTENDED_LIBRARY).map(catKey => (
              <Button
                key={catKey}
                size="sm"
                variant={selectedCategory === catKey ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(catKey)}
              >
                {EXTENDED_LIBRARY[catKey].icon} {EXTENDED_LIBRARY[catKey].name}
              </Button>
            ))}
            {customElements.length > 0 && (
              <Button
                size="sm"
                variant={selectedCategory === 'custom' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('custom')}
              >
                🖼️ Custom ({customElements.length})
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Custom Elements */}
            {selectedCategory === 'custom' && customElements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  🖼️ Elementi Personalizzati
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {customElements.map(item => (
                    <Button
                      key={item.id}
                      variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                      onClick={() => { 
                        setSelectedLibraryItem(item); 
                        setMode('furniture'); 
                      }}
                      className="h-auto flex-col py-3 relative"
                    >
                      <span className="text-2xl mb-1">{item.icon}</span>
                      <span className="text-xs text-center truncate w-full">{item.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Extended Library Categories */}
            {(selectedCategory === 'all' || Object.keys(EXTENDED_LIBRARY).includes(selectedCategory)) && 
              Object.keys(EXTENDED_LIBRARY)
                .filter(catKey => selectedCategory === 'all' || selectedCategory === catKey)
                .filter(catKey => {
                  if (!searchQuery) return true;
                  const category = EXTENDED_LIBRARY[catKey];
                  return category.items.some(item => 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map(catKey => {
                  const category = EXTENDED_LIBRARY[catKey];
                  const filteredItems = category.items.filter(item => 
                    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  if (filteredItems.length === 0) return null;
                  
                  return (
                    <div key={catKey}>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        {category.icon} {category.name} ({filteredItems.length})
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {filteredItems.map(item => (
                          <Button
                            key={item.id}
                            variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                            onClick={() => { 
                              setSelectedLibraryItem({ ...item, category: catKey }); 
                              setMode(catKey === 'floors' ? 'floor' : catKey === 'doors_windows' ? 'door' : 'furniture'); 
                            }}
                            className="h-auto flex-col py-2 text-xs"
                            style={{
                              backgroundColor: selectedLibraryItem?.id === item.id ? undefined : 
                                item.color ? item.color + '20' : undefined,
                              borderColor: item.color
                            }}
                          >
                            <span className="text-xl mb-1">{item.icon}</span>
                            <span className="text-xs text-center leading-tight">{item.name}</span>
                            {(item.width && item.depth) && (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                {item.width}x{item.depth}cm
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })
            }
            
            {/* OLD LIBRARY - Mantengo per compatibilità ma nascosto */}
            <div className="hidden">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🟫 Pavimenti
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.floors.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { 
                      setSelectedLibraryItem(item); 
                      setMode('floor'); 
                    }}
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

            {/* Porte */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <DoorOpen className="w-4 h-4" /> Porte
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.doors.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { 
                      setSelectedLibraryItem(item); 
                      setMode('door'); 
                    }}
                    className="h-auto flex-col py-3"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs text-center">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.width}cm</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Finestre */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Maximize2 className="w-4 h-4" /> Finestre
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.windows.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { 
                      setSelectedLibraryItem(item); 
                      setMode('window'); 
                    }}
                    className="h-auto flex-col py-3"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs text-center">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.width}cm</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Mobili */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🛋️ Arredamento
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_LIBRARY.furniture.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedLibraryItem?.id === item.id ? 'default' : 'outline'}
                    onClick={() => { 
                      setSelectedLibraryItem(item); 
                      setMode('furniture'); 
                    }}
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
          
          {/* Info quando elemento selezionato */}
          {selectedLibraryItem && (
            <div className="bg-green-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-green-800">
                ✅ <strong>{selectedLibraryItem.name}</strong> selezionato. Clicca sul canvas per posizionare.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Konva Stage */}
      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white mt-4 shadow-lg">
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          ref={stageRef}
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
          scaleX={canvasZoom}
          scaleY={canvasZoom}
        >
          <Layer>
            {/* Background Image */}
            {backgroundImg && (
              <KonvaImage
                image={backgroundImg}
                x={imagePosition.x}
                y={imagePosition.y}
                width={backgroundImg.width * imageScale}
                height={backgroundImg.height * imageScale}
                opacity={imageOpacity}
              />
            )}
            
            {/* Grid - Carta Millimetrata Style */}
            {showGrid && (
              <>
                {/* Linee sottili ogni 20px (griglia fine) */}
                {Array.from({ length: Math.ceil(canvasWidth / 20) + 1 }, (_, i) => (
                  <Line
                    key={`v-fine-${i}`}
                    points={[i * 20, 0, i * 20, canvasHeight]}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    opacity={0.5}
                    listening={false}
                  />
                ))}
                {Array.from({ length: Math.ceil(canvasHeight / 20) + 1 }, (_, i) => (
                  <Line
                    key={`h-fine-${i}`}
                    points={[0, i * 20, canvasWidth, i * 20]}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    opacity={0.5}
                    listening={false}
                  />
                ))}
                
                {/* Linee medie ogni 100px (griglia principale) */}
                {Array.from({ length: Math.ceil(canvasWidth / 100) + 1 }, (_, i) => (
                  <Line
                    key={`v-main-${i}`}
                    points={[i * 100, 0, i * 100, canvasHeight]}
                    stroke={i % 5 === 0 ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={i % 5 === 0 ? 2 : 1}
                    opacity={i % 5 === 0 ? 0.7 : 0.5}
                    listening={false}
                  />
                ))}
                {Array.from({ length: Math.ceil(canvasHeight / 100) + 1 }, (_, i) => (
                  <Line
                    key={`h-main-${i}`}
                    points={[0, i * 100, canvasWidth, i * 100]}
                    stroke={i % 5 === 0 ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={i % 5 === 0 ? 2 : 1}
                    opacity={i % 5 === 0 ? 0.7 : 0.5}
                    listening={false}
                  />
                ))}
                
                {/* Labels per griglia ogni 500px */}
                {Array.from({ length: Math.ceil(canvasWidth / 500) + 1 }, (_, i) => (
                  <Text
                    key={`label-v-${i}`}
                    x={i * 500 + 5}
                    y={5}
                    text={`${i * 5}m`}
                    fontSize={10}
                    fill="#64748b"
                    listening={false}
                  />
                ))}
                {Array.from({ length: Math.ceil(canvasHeight / 500) + 1 }, (_, i) => (
                  <Text
                    key={`label-h-${i}`}
                    x={5}
                    y={i * 500 + 5}
                    text={`${i * 5}m`}
                    fontSize={10}
                    fill="#64748b"
                    listening={false}
                  />
                ))}
              </>
            )}
            
            {/* Floors */}
            {floors.map((floor) => (
              <Rect
                key={floor.id}
                x={floor.x}
                y={floor.y}
                width={floor.width}
                height={floor.height}
                fill={floor.color || '#E8E8E8'}
                stroke={selectedId === floor.id ? '#3b82f6' : '#94a3b8'}
                strokeWidth={selectedId === floor.id ? 3 : 1}
                draggable={mode === 'move'}
                onClick={() => setSelectedId(floor.id)}
                onDragEnd={(e) => {
                  const newFloors = floors.map(f => {
                    if (f.id === floor.id) {
                      return { ...f, x: e.target.x(), y: e.target.y() };
                    }
                    return f;
                  });
                  setFloors(newFloors);
                  saveToHistory();
                }}
                shadowBlur={selectedId === floor.id ? 10 : 0}
                shadowColor={selectedId === floor.id ? 'rgba(59, 130, 246, 0.6)' : 'transparent'}
              />
            ))}
            
            {/* Doors */}
            {doors.map((door) => (
              <Rect
                key={door.id}
                x={door.x}
                y={door.y}
                width={door.width}
                height={door.height}
                fill={door.fill}
                stroke={selectedId === door.id ? '#22c55e' : '#16a34a'}
                strokeWidth={selectedId === door.id ? 3 : 2}
                draggable={mode === 'move'}
                onClick={() => setSelectedId(door.id)}
                onDragEnd={(e) => {
                  const newDoors = doors.map(d => {
                    if (d.id === door.id) {
                      return { ...d, x: e.target.x(), y: e.target.y() };
                    }
                    return d;
                  });
                  setDoors(newDoors);
                  saveToHistory();
                }}
                shadowBlur={selectedId === door.id ? 10 : 0}
                shadowColor={selectedId === door.id ? 'rgba(34, 197, 94, 0.5)' : 'transparent'}
              />
            ))}
            
            {/* Windows */}
            {windows.map((window) => (
              <Rect
                key={window.id}
                x={window.x}
                y={window.y}
                width={window.width}
                height={window.height}
                fill={window.fill}
                stroke={selectedId === window.id ? '#3b82f6' : '#2563eb'}
                strokeWidth={selectedId === window.id ? 3 : 2}
                draggable={mode === 'move'}
                onClick={() => setSelectedId(window.id)}
                onDragEnd={(e) => {
                  const newWindows = windows.map(w => {
                    if (w.id === window.id) {
                      return { ...w, x: e.target.x(), y: e.target.y() };
                    }
                    return w;
                  });
                  setWindows(newWindows);
                  saveToHistory();
                }}
                shadowBlur={selectedId === window.id ? 10 : 0}
                shadowColor={selectedId === window.id ? 'rgba(59, 130, 246, 0.5)' : 'transparent'}
              />
            ))}
            
            {/* Furniture */}
            {furniture.map((item) => (
              <Rect
                key={item.id}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                fill={item.fill}
                stroke={selectedId === item.id ? '#a855f7' : '#9333ea'}
                strokeWidth={2}
                draggable={mode === 'move'}
                onClick={() => setSelectedId(item.id)}
                onDragEnd={(e) => {
                  const newFurniture = furniture.map(f => {
                    if (f.id === item.id) {
                      return { ...f, x: e.target.x(), y: e.target.y() };
                    }
                    return f;
                  });
                  setFurniture(newFurniture);
                  saveToHistory();
                }}
                shadowBlur={selectedId === item.id ? 10 : 0}
                shadowColor={selectedId === item.id ? 'rgba(168, 85, 247, 0.5)' : 'transparent'}
              />
            ))}
            
            {/* Walls */}
            {walls.map((wall) => (
              <Group key={`wall-group-${wall.id}`}>
                {/* Invisible hit area for easier clicking */}
                <Line
                  points={wall.points}
                  stroke="transparent"
                  strokeWidth={Math.max(20, (wall.thickness || 20) * scale)}
                  lineCap="round"
                  onClick={() => setSelectedId(wall.id)}
                  hitStrokeWidth={30}
                />
                
                {/* Actual visible wall */}
                <Line
                  points={wall.points}
                  stroke={selectedId === wall.id ? '#ef4444' : wall.stroke}
                  strokeWidth={(wall.thickness || 20) * scale}
                  lineCap="round"
                  draggable={mode === 'move'}
                  onClick={() => setSelectedId(wall.id)}
                  onDragEnd={(e) => {
                    const newWalls = walls.map(w => {
                      if (w.id === wall.id) {
                        const node = e.target;
                        return {
                          ...w,
                          points: w.points.map((p, i) => 
                            i % 2 === 0 ? p + node.x() : p + node.y()
                          )
                        };
                      }
                      return w;
                    });
                    setWalls(newWalls);
                    e.target.position({ x: 0, y: 0 });
                    saveToHistory();
                  }}
                  shadowBlur={selectedId === wall.id ? 15 : 0}
                  shadowColor={selectedId === wall.id ? '#ef4444' : 'transparent'}
                  listening={mode !== 'move'}
                />
                
                {/* Selection handles for selected wall */}
                {selectedId === wall.id && (
                  <>
                    {/* Start point handle */}
                    <Circle
                      x={wall.points[0]}
                      y={wall.points[1]}
                      radius={8}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const newWalls = walls.map(w => {
                          if (w.id === wall.id) {
                            return {
                              ...w,
                              points: [e.target.x(), e.target.y(), w.points[2], w.points[3]]
                            };
                          }
                          return w;
                        });
                        setWalls(newWalls);
                      }}
                      onDragEnd={() => saveToHistory()}
                    />
                    
                    {/* End point handle */}
                    <Circle
                      x={wall.points[2]}
                      y={wall.points[3]}
                      radius={8}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const newWalls = walls.map(w => {
                          if (w.id === wall.id) {
                            return {
                              ...w,
                              points: [w.points[0], w.points[1], e.target.x(), e.target.y()]
                            };
                          }
                          return w;
                        });
                        setWalls(newWalls);
                      }}
                      onDragEnd={() => saveToHistory()}
                    />
                  </>
                )}
              </Group>
            ))}
            
            {/* Measurement Lines for Walls */}
            {showMeasurements && walls.map((wall) => {
              const [x1, y1, x2, y2] = wall.points;
              const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
              const lengthCm = pixelsToRealUnit(length);
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              
              // Calculate perpendicular offset for label
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const offsetDist = 25;
              const offsetX = Math.sin(angle) * offsetDist;
              const offsetY = -Math.cos(angle) * offsetDist;
              
              return (
                <Group key={`measure-${wall.id}`}>
                  <Text
                    x={midX + offsetX - 30}
                    y={midY + offsetY - 10}
                    text={formatMeasurement(lengthCm)}
                    fontSize={12}
                    fontStyle="bold"
                    fill="#1e40af"
                    padding={4}
                    align="center"
                  />
                </Group>
              );
            })}
            
            {/* Measurement Lines for Rooms/Floors */}
            {showMeasurements && [...rooms, ...floors].map((element) => {
              const widthCm = pixelsToRealUnit(element.width);
              const heightCm = pixelsToRealUnit(element.height);
              
              return (
                <Group key={`measure-${element.id}`}>
                  {/* Width measurement (top) */}
                  <Line
                    points={[element.x, element.y - 15, element.x + element.width, element.y - 15]}
                    stroke="#1e40af"
                    strokeWidth={1}
                    dash={[4, 4]}
                  />
                  <Text
                    x={element.x + element.width / 2 - 30}
                    y={element.y - 30}
                    text={formatMeasurement(widthCm)}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#1e40af"
                    align="center"
                  />
                  
                  {/* Height measurement (right) */}
                  <Line
                    points={[element.x + element.width + 15, element.y, element.x + element.width + 15, element.y + element.height]}
                    stroke="#1e40af"
                    strokeWidth={1}
                    dash={[4, 4]}
                  />
                  <Text
                    x={element.x + element.width + 20}
                    y={element.y + element.height / 2 - 10}
                    text={formatMeasurement(heightCm)}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#1e40af"
                    align="center"
                  />
                </Group>
              );
            })}
            
            {/* Measurement Lines for Doors/Windows */}
            {showMeasurements && [...doors, ...windows].map((element) => {
              const widthCm = pixelsToRealUnit(element.width);
              
              return (
                <Group key={`measure-${element.id}`}>
                  <Text
                    x={element.x + element.width / 2 - 25}
                    y={element.y - 20}
                    text={formatMeasurement(widthCm)}
                    fontSize={10}
                    fontStyle="bold"
                    fill="#0d9488"
                    align="center"
                  />
                </Group>
              );
            })}
            
            {/* Measurement Lines for Furniture */}
            {showMeasurements && furniture.map((item) => {
              const widthCm = pixelsToRealUnit(item.width);
              const heightCm = pixelsToRealUnit(item.height);
              
              return (
                <Group key={`measure-${item.id}`}>
                  <Text
                    x={item.x + item.width / 2 - 25}
                    y={item.y - 20}
                    text={`${formatMeasurement(widthCm)} × ${formatMeasurement(heightCm)}`}
                    fontSize={10}
                    fontStyle="bold"
                    fill="#7c3aed"
                    align="center"
                  />
                </Group>
              );
            })}
            
            {/* Drawing preview */}
            {isDrawing && drawStart && (
              <Circle
                x={drawStart.x}
                y={drawStart.y}
                radius={5}
                fill="#ef4444"
              />
            )}
            
            {/* Calibration line preview */}
            {isCalibrating && calibrationStart && (
              <Circle
                x={calibrationStart.x}
                y={calibrationStart.y}
                radius={8}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
            )}
            {isCalibrating && calibrationStart && calibrationEnd && (
              <>
                <Line
                  points={[
                    calibrationStart.x, 
                    calibrationStart.y, 
                    calibrationEnd.x, 
                    calibrationEnd.y
                  ]}
                  stroke="#f59e0b"
                  strokeWidth={4}
                  dash={[10, 5]}
                />
                <Circle
                  x={calibrationEnd.x}
                  y={calibrationEnd.y}
                  radius={8}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <Text
                  x={(calibrationStart.x + calibrationEnd.x) / 2 - 40}
                  y={(calibrationStart.y + calibrationEnd.y) / 2 - 30}
                  text={`${Math.sqrt(
                    Math.pow(calibrationEnd.x - calibrationStart.x, 2) + 
                    Math.pow(calibrationEnd.y - calibrationStart.y, 2)
                  ).toFixed(0)} px`}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#ffffff"
                  padding={8}
                  background="#f59e0b"
                />
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </Card>
  );
};

export default FloorPlanEditorKonva;
