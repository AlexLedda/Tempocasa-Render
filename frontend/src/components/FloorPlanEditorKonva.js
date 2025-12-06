import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Trash2, Move, MousePointer, Type, Square, LayoutTemplate, DoorOpen, Maximize, ZoomIn, ZoomOut, Save, Download, Home, Settings2, Grid, ScanLine, Ruler, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import { detectRooms } from '../utils/roomDetection';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useBackgroundLayer } from '../hooks/useBackgroundLayer';
import { calculateSmartSnap, pixelsToRealUnit, formatMeasurement, snapToGridCoords } from '../utils/editorUtils';
import axios from 'axios';
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
  const [tempEnd, setTempEnd] = useState(null); // For preview line
  const [snapLines, setSnapLines] = useState([]); // Visual guides for smart snapping
  const [wallLengthInput, setWallLengthInput] = useState(''); // For numeric input during wall drawing
  const [showWallLengthInput, setShowWallLengthInput] = useState(false);

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

  // --- CUSTOM HOOKS ---

  // History Management (Undo/Redo)
  const {
    history,
    historyIndex,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useEditorHistory();

  // Background Image Management
  const {
    backgroundImg,
    imageOpacity,
    setImageOpacity,
    imageScale,
    setImageScale,
    imagePosition,
    setImagePosition,
    loadFloorPlan
  } = useBackgroundLayer(canvasWidth, canvasHeight);

  // Initialize Background if prop changes
  useEffect(() => {
    if (floorPlanImage) {
      loadFloorPlan(floorPlanImage);
    }
  }, [floorPlanImage]);

  // Wrapper for saveToHistory to maintain compatibility
  const saveToHistory = () => {
    const currentState = {
      walls,
      rooms,
      floors,
      doors,
      windows,
      furniture
    };
    addToHistory(currentState);
  };

  // Wrappers for undo/redo to update local state
  const handleUndo = () => {
    const state = undo();
    if (state) restoreState(state);
  };

  const handleRedo = () => {
    const state = redo();
    if (state) restoreState(state);
  };

  const restoreState = (state) => {
    setWalls(state.walls);
    setRooms(state.rooms);
    setFloors(state.floors);
    setDoors(state.doors);
    setWindows(state.windows);
    setFurniture(state.furniture);
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
      // If we are in wall mode and drawing, we handle clicks in handleStageMouseDown
      // But if we want to double click to finish, we can handle it here or in a separate handler

      // Place element from library if selected
      if (selectedLibraryItem && (mode === 'door' || mode === 'window' || mode === 'furniture' || mode === 'floor')) {
        const pos = e.target.getStage().getPointerPosition();
        const snapped = snapToGridCoords(pos.x, pos.y, scale * 10, snapToGrid);

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

      // Deselect if not placing anything and not drawing wall
      if (!isDrawing) {
        setSelectedId(null);
      }
      return;
    }
  };

  // Room Detection Integration
  const runRoomDetection = (currentWalls) => {
    // Run detection logic
    const detectedRooms = detectRooms(currentWalls);

    if (detectedRooms.length > 0) {
      // Find NEW rooms only (compare by approximate centroid or area to avoid duplicates strictly?)
      // For now, simpler: Try to merge or just replace?
      // Replacing "auto-generated" rooms might be annoying if user customized them.
      // Strategy: Only add if no room exists in roughly that center.

      let newRoomsAdded = 0;
      const updatedRooms = [...rooms];

      detectedRooms.forEach(dRoom => {
        // Calculate centroid
        const cx = dRoom.points.reduce((sum, p) => sum + p.x, 0) / dRoom.points.length;
        const cy = dRoom.points.reduce((sum, p) => sum + p.y, 0) / dRoom.points.length;

        // Check if a room already exists covering this centroid
        const exists = rooms.some(r => {
          // Simple bounding box check or point-in-polygon logic
          // Here we just check distance to center
          return Math.abs(r.x + r.width / 2 - cx) < 50 && Math.abs(r.y + r.height / 2 - cy) < 50;
        });

        if (!exists) {
          // Create proper room object matching our schema
          // bounding box
          const minX = Math.min(...dRoom.points.map(p => p.x));
          const minY = Math.min(...dRoom.points.map(p => p.y));
          const maxX = Math.max(...dRoom.points.map(p => p.x));
          const maxY = Math.max(...dRoom.points.map(p => p.y));

          const newRoom = {
            id: dRoom.id,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            name: 'Nuova Stanza',
            type: 'living_room',
            opacity: 0.3,
            fill: '#e0f2fe', // Light blue
            customPoints: dRoom.points.flatMap(p => [p.x - minX, p.y - minY]) // Local coordinates for Polygon
          };

          updatedRooms.push(newRoom);
          newRoomsAdded++;
        }
      });

      if (newRoomsAdded > 0) {
        setRooms(updatedRooms);
        toast.success(`🏠 ${newRoomsAdded} Stanza/e rilevata/e automaticamente!`);
      }
    }
  };

  // Handle continuous wall drawing
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

    // Wall drawing logic - Continuous Mode
    if (mode === 'wall') {
      const pos = e.target.getStage().getPointerPosition();

      // USE SMART SNAP instead of simple grid snap
      const smartResult = calculateSmartSnap(pos.x, pos.y, walls, snapToGrid, scale);
      const snapped = { x: smartResult.x, y: smartResult.y };

      if (!isDrawing) {
        // First click: Start drawing
        setIsDrawing(true);
        setDrawStart(snapped);
        setTempEnd(snapped);
      } else {
        // Second click (or subsequent): Complete segment and start next
        const newWall = {
          id: `wall-${Date.now()}`,
          points: [drawStart.x, drawStart.y, snapped.x, snapped.y],
          stroke: wallColor,
          strokeWidth: wallThickness * scale,
          thickness: wallThickness // Store in cm
        };

        // Don't create wall if length is 0 (double click on same spot)
        if (drawStart.x !== snapped.x || drawStart.y !== snapped.y) {
          const updatedWalls = [...walls, newWall];
          setWalls(updatedWalls);
          saveToHistory();

          // Try to detect rooms immediately
          runRoomDetection(updatedWalls);

          // Continue drawing from the end point
          setDrawStart(snapped);
          setTempEnd(snapped);
        }
      }
    }
  };

  // Handle mouse move for preview and guides
  const handleStageMouseMove = (e) => {
    if (mode === 'wall' && isDrawing) {
      const pos = e.target.getStage().getPointerPosition();

      // Calculate Smart Snap
      const smartResult = calculateSmartSnap(pos.x, pos.y, walls, snapToGrid, scale);

      setTempEnd({ x: smartResult.x, y: smartResult.y });
      setSnapLines(smartResult.guidelines); // Update visual guidelines
    } else {
      // Clear guidelines when not drawing
      if (snapLines.length > 0) setSnapLines([]);
    }
  };

  // Handle mouse up (mostly for other tools now)
  const handleStageMouseUp = (e) => {
    // For wall mode, we do nothing on mouse up as we use click-click logic
    // drawing is finished by Esc or double click (handled by logic)

    // Reset dragging state if needed for other checks
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
        } else if (e.key === 'Escape') {
          // Cancel drawing or measurements
          if (isDrawing) {
            setIsDrawing(false);
            setDrawStart(null);
            setTempEnd(null);
            toast.info('Disegno annullato');
          } else if (isCalibrating) {
            setIsCalibrating(false);
            setCalibrationStart(null);
            setCalibrationEnd(null);
            toast.info('Calibrazione annullata');
          } else {
            setSelectedId(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, snapToGrid, history, historyIndex, clipboard, walls, rooms, floors, doors, windows, furniture]);

  return (
    <div className="flex h-[calc(100vh-120px)] w-full bg-slate-50 border rounded-xl shadow-lg overflow-hidden">
      {/* LEFT SIDEBAR - Tools & Library */}
      <div className="w-[320px] bg-white border-r flex flex-col z-10 shadow-lg">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">📐</span> Editor Pianta
          </h3>
          {selectedId && (
            <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 truncate">
              Selezione: <strong>{selectedId}</strong>
            </div>
          )}
        </div>

        <Tabs defaultValue="tools" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-2 rounded-none p-0 border-b h-12">
            <TabsTrigger value="tools" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500">🛠️ Strumenti</TabsTrigger>
            <TabsTrigger value="library" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500">📚 Libreria</TabsTrigger>
          </TabsList>

          {/* TAB TOOLS */}
          <TabsContent value="tools" className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Quick Actions (Undo/Redo/Save) */}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={!canUndo} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" /> Undo
              </Button>
              <Button size="sm" variant="outline" onClick={handleRedo} disabled={!canRedo} className="w-full">
                <RotateCw className="h-4 w-4 mr-2" /> Redo
              </Button>
              <Button
                onClick={() => {
                  const data = { walls, rooms, floors, doors, windows, furniture };
                  onSave(data);
                }}
                className="col-span-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow"
              >
                <Save className="w-4 h-4 mr-2" /> Salva Progetto
              </Button>
            </div>

            {/* Drawing Modes */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modalità Disegno</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setMode('view')}
                  variant={mode === 'view' ? 'default' : 'outline'}
                  className={`w-full justify-start ${mode === 'view' ? 'bg-slate-800 text-white hover:bg-slate-900' : ''}`}
                >
                  <Move className="w-4 h-4 mr-2" /> Seleziona
                </Button>
                <Button
                  onClick={() => setMode('move')}
                  variant={mode === 'move' ? 'default' : 'outline'}
                  className={`w-full justify-start ${mode === 'move' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}`}
                >
                  <span className="mr-2">🖐️</span> Sposta
                </Button>
                <Button
                  onClick={() => setMode('wall')}
                  variant={mode === 'wall' ? 'default' : 'outline'}
                  className={`col-span-2 w-full justify-start h-12 ${mode === 'wall' ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-200' : ''}`}
                >
                  <Grid3x3 className="w-5 h-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span>Muri</span>
                    <span className="text-[10px] opacity-80 font-normal">Disegna stanze • "W"</span>
                  </div>
                </Button>
                <Button
                  onClick={() => setMode('room')}
                  variant={mode === 'room' ? 'default' : 'outline'}
                  className={`col-span-2 w-full justify-start ${mode === 'room' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
                >
                  <Square className="w-4 h-4 mr-2" /> Stanza Rettangolare
                </Button>
              </div>
            </div>

            {/* Contextual Properties (Wall Settings) */}
            {mode === 'wall' && (
              <Card className="p-3 bg-blue-50 border-blue-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-blue-900">Impostazioni Muro</h4>
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded border cursor-pointer"
                      style={{ backgroundColor: wallColor }}
                      title="Colore Muro"
                    >
                      <input
                        type="color"
                        value={wallColor}
                        onChange={(e) => setWallColor(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-blue-700">
                    <span>Spessore: <strong>{wallThickness}cm</strong></span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={wallThickness}
                    onChange={(e) => setWallThickness(parseInt(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-blue-400">
                    <span>10cm</span>
                    <span>50cm</span>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-blue-800 bg-blue-100 p-2 rounded leading-tight">
                  💡 <strong>Tip:</strong> Clicca per iniziare, muovi il mouse, clicca per aggiungere angoli. <strong>Esc</strong> per finire.
                </div>
              </Card>
            )}

            {/* Selected Item Actions */}
            {selectedId && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Azioni Selezione</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={copySelected} variant="outline" size="sm" className="w-full">
                    📋 Copia
                  </Button>
                  <Button onClick={duplicateSelected} variant="outline" size="sm" className="w-full">
                    📑 Duplica
                  </Button>
                  <Button onClick={deleteSelected} variant="destructive" size="sm" className="col-span-2 w-full">
                    <Trash2 className="w-4 h-4 mr-2" /> Elimina
                  </Button>
                </div>
              </div>
            )}

            {clipboard && !selectedId && (
              <Button onClick={pasteElement} variant="secondary" className="w-full border-dashed border-2">
                📋 Incolla Ultimo Elemento
              </Button>
            )}

            {/* Calibration Compact */}
            <div className="pt-4 border-t">
              <Button
                variant={isCalibrating ? "destructive" : "ghost"}
                size="sm"
                className="w-full justify-start text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                onClick={() => {
                  if (isCalibrating) {
                    setIsCalibrating(false);
                    setCalibrationStart(null);
                    setCalibrationEnd(null);
                  } else {
                    setIsCalibrating(true);
                    setCalibrationStart(null);
                    setCalibrationEnd(null);
                    toast.info('Clicca su due punti per calibrare');
                  }
                }}
              >
                <span className="mr-2">📏</span> {isCalibrating ? "Annulla Calibrazione" : "Calibra Scala"}
              </Button>
              {isCalibrating && (
                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
                  {!calibrationStart ? "1. Clicca primo punto" : !calibrationEnd ? "2. Clicca secondo punto" : "3. Imposta distanza reale"}
                  {calibrationStart && calibrationEnd && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        value={calibrationRealLength}
                        onChange={(e) => setCalibrationRealLength(parseFloat(e.target.value))}
                        className="w-16 px-1 py-0.5 border rounded text-xs"
                      />
                      <select className="text-xs border rounded" onChange={(e) => {
                        if (e.target.value === 'm') setCalibrationRealLength(calibrationRealLength / 100);
                        else if (e.target.value === 'cm' && calibrationRealLength < 10) setCalibrationRealLength(calibrationRealLength * 100);
                      }}>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                      </select>
                      <Button size="xs" className="h-6 text-[10px]" onClick={() => {
                        const pixelLength = Math.sqrt(Math.pow(calibrationEnd.x - calibrationStart.x, 2) + Math.pow(calibrationEnd.y - calibrationStart.y, 2));
                        const newScale = pixelLength / calibrationRealLength;
                        setScale(newScale);
                        setIsCalibrating(false);
                        setCalibrationStart(null);
                        setCalibrationEnd(null);
                        toast.success("Calibrato!");
                      }}>OK</Button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </TabsContent>

          {/* TAB LIBRARY */}
          <TabsContent value="library" className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => document.getElementById('custom-upload').click()}>
                <Upload className="w-3.5 h-3.5" />
              </Button>
              <input id="custom-upload" type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCustomElements([...customElements, {
                      id: `custom-${Date.now()}`, name: file.name.split('.')[0], imageUrl: ev.target.result, width: 100, depth: 100, icon: '🖼️', isCustom: true
                    }]);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1 flex-wrap">
              <span
                onClick={() => setSelectedCategory('all')}
                className={`cursor-pointer px-2 py-1 rounded-full text-[10px] border ${selectedCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                Tutti
              </span>
              {Object.keys(EXTENDED_LIBRARY).map(catKey => (
                <span
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`cursor-pointer px-2 py-1 rounded-full text-[10px] border ${selectedCategory === catKey ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {EXTENDED_LIBRARY[catKey].name}
                </span>
              ))}
            </div>

            {/* Library Grid */}
            <div className="space-y-4 pb-4">
              {/* Custom Elements */}
              {selectedCategory === 'custom' && customElements.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {customElements.map(item => (
                    <div key={item.id} onClick={() => { setSelectedLibraryItem(item); setMode('furniture'); }}
                      className={`cursor-pointer border rounded p-2 flex flex-col items-center hover:bg-slate-50 ${selectedLibraryItem?.id === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] mt-1 text-center truncate w-full">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Standard Library */}
              {(selectedCategory === 'all' || Object.keys(EXTENDED_LIBRARY).includes(selectedCategory)) &&
                Object.keys(EXTENDED_LIBRARY)
                  .filter(catKey => selectedCategory === 'all' || selectedCategory === catKey)
                  .map(catKey => {
                    const category = EXTENDED_LIBRARY[catKey];
                    const filtered = category.items.filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (!filtered.length) return null;
                    return (
                      <div key={catKey}>
                        <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase">{category.name}</h5>
                        <div className="grid grid-cols-3 gap-2">
                          {filtered.map(item => (
                            <div
                              key={item.id}
                              onClick={() => { setSelectedLibraryItem({ ...item, category: catKey }); setMode(catKey === 'floors' ? 'floor' : catKey === 'doors_windows' ? 'door' : 'furniture'); }}
                              className={`cursor-pointer border rounded p-2 flex flex-col items-center transition-all hover:scale-105 ${selectedLibraryItem?.id === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:border-blue-300'}`}
                            >
                              <span className="text-2xl">{item.icon}</span>
                              <span className="text-[10px] mt-1 text-center leading-tight">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* MAIN WORKSPACE - Canvas & Floating Controls */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden cursor-crosshair">

        {/* TOP RIGHT - VIEW CONTROLS */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 p-2 bg-white/90 backdrop-blur shadow-sm border rounded-lg">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCanvasZoom(Math.min(2, canvasZoom + 0.1))}><span className="text-lg">+</span></Button>
            <span className="text-xs font-mono w-8 text-center">{(canvasZoom * 100).toFixed(0)}%</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCanvasZoom(Math.max(0.5, canvasZoom - 0.1))}><span className="text-lg">-</span></Button>
          </div>
          <div className="h-px bg-slate-200 my-1"></div>
          <Button
            size="sm"
            variant={snapToGrid ? "secondary" : "ghost"}
            className={`h-8 justify-start text-xs ${snapToGrid ? 'bg-blue-100 text-blue-700' : ''}`}
            onClick={() => { setSnapToGrid(!snapToGrid); toast.info(`Snap: ${!snapToGrid ? 'ON' : 'OFF'}`); }}
          >
            <span className="mr-2">🧲</span> Snap
          </Button>
          <Button
            size="sm"
            variant={showGrid ? "secondary" : "ghost"}
            className={`h-8 justify-start text-xs ${showGrid ? 'bg-blue-100 text-blue-700' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
          >
            <span className="mr-2">#</span> Grid
          </Button>
          <Button
            size="sm"
            variant={showMeasurements ? "secondary" : "ghost"}
            className={`h-8 justify-start text-xs ${showMeasurements ? 'bg-blue-100 text-blue-700' : ''}`}
            onClick={() => setShowMeasurements(!showMeasurements)}
          >
            <span className="mr-2">📏</span> Misure
          </Button>
        </div>

        {/* TOP CENTER - IMAGE CONTROLS (Floating HUD) */}
        {backgroundImg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur shadow-md border rounded-full px-4 py-2 flex items-center gap-4 transition-all hover:bg-white hover:shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Sfondo</span>
              <div className="h-4 w-px bg-slate-300 mx-1"></div>
            </div>

            <div className="flex items-center gap-2 group">
              <span className="text-xs text-slate-400 group-hover:text-blue-500">👁️</span>
              <input
                type="range" min="0" max="1" step="0.1"
                value={imageOpacity} onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                className="w-20 accent-blue-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 group">
              <span className="text-xs text-slate-400 group-hover:text-blue-500">🔍</span>
              <input
                type="range" min="0.1" max="3" step="0.05"
                value={imageScale} onChange={(e) => setImageScale(parseFloat(e.target.value))}
                className="w-20 accent-blue-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setImagePosition({ x: imagePosition.x - 10, y: imagePosition.y })}>←</Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setImagePosition({ x: imagePosition.x, y: imagePosition.y - 10 })}>↑</Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setImagePosition({ x: imagePosition.x, y: imagePosition.y + 10 })}>↓</Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setImagePosition({ x: imagePosition.x + 10, y: imagePosition.y })}>→</Button>
            </div>
          </div>
        )}

        {/* BOTTOM RIGHT - ZOOM RESET */}
        <div className="absolute bottom-4 right-4 z-20">
          <Button size="sm" variant="outline" className="bg-white shadow-sm" onClick={() => setCanvasZoom(1)}>
            Reset Vista
          </Button>
        </div>

        {/* KONVA STAGE */}
        <Stage
          width={canvasWidth}
          height={canvasHeight}

          ref={stageRef}
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
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

            {/* Wall Drawing Preview Line */}
            {isDrawing && drawStart && tempEnd && (
              <>
                <Line
                  points={[drawStart.x, drawStart.y, tempEnd.x, tempEnd.y]}
                  stroke="#3b82f6"
                  strokeWidth={wallThickness * scale * 0.5}
                  dash={[10, 5]}
                  opacity={0.7}
                />
                <Circle
                  x={tempEnd.x}
                  y={tempEnd.y}
                  radius={5}
                  fill="#3b82f6"
                  opacity={0.5}
                />
                {/* Length label for preview */}
                {showMeasurements && (
                  <Text
                    x={(drawStart.x + tempEnd.x) / 2}
                    y={(drawStart.y + tempEnd.y) / 2 - 20}
                    text={formatMeasurement(
                      pixelsToRealUnit(
                        Math.sqrt(
                          Math.pow(tempEnd.x - drawStart.x, 2) +
                          Math.pow(tempEnd.y - drawStart.y, 2)
                        ), scale
                      ), measurementUnit
                    )}
                    fontSize={14}
                    fill="#3b82f6"
                    align="center"
                    stroke="white"
                    strokeWidth={2}
                  />
                )}
              </>
            )}

            {/* Measurement Lines for Walls */}
            {showMeasurements && walls.map((wall) => {
              const [x1, y1, x2, y2] = wall.points;
              const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
              const lengthCm = pixelsToRealUnit(length, scale);
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
                    text={formatMeasurement(lengthCm, measurementUnit)}
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
              const widthCm = pixelsToRealUnit(element.width, scale);
              const heightCm = pixelsToRealUnit(element.height, scale);

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
                    text={formatMeasurement(widthCm, measurementUnit)}
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
                    text={formatMeasurement(heightCm, measurementUnit)}
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
              const widthCm = pixelsToRealUnit(element.width, scale);
              // const heightCm = pixelsToRealUnit(element.height, scale); // unused in this block?

              return (
                <Group key={`measure-${element.id}`}>
                  <Text
                    x={element.x + element.width / 2 - 25}
                    y={element.y - 20}
                    text={formatMeasurement(widthCm, measurementUnit)}
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
              const widthCm = pixelsToRealUnit(item.width, scale);
              const heightCm = pixelsToRealUnit(item.height, scale);

              return (
                <Group key={`measure-${item.id}`}>
                  <Text
                    x={item.x + item.width / 2 - 25}
                    y={item.y - 20}
                    text={`${formatMeasurement(widthCm, measurementUnit)} × ${formatMeasurement(heightCm, measurementUnit)}`}
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
            {/* Smart Snap Guidelines */}
            {isDrawing && snapLines.map((line, i) => (
              <Line
                key={`snap-guide-${i}`}
                points={line.points}
                stroke={line.stroke}
                dash={line.dash}
                strokeWidth={1}
                opacity={0.8}
              />
            ))}

          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default FloorPlanEditorKonva;
