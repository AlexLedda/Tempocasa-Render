import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Grid3x3, Square, DoorOpen, Maximize2, Move, Save, Trash2 } from 'lucide-react';

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

const FloorPlanEditorKonva = ({ floorPlanImage, threeDData, onSave }) => {
  const stageRef = useRef(null);
  const [mode, setMode] = useState('view');
  const [scale] = useState(0.1); // 0.1 pixels per cm
  
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
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Background image
  const [backgroundImg, setBackgroundImg] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(0.5);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
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
        
        // Auto-fit image to canvas
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const autoScale = Math.min(scaleX, scaleY, 1); // Don't scale up
        
        setImageScale(autoScale);
        
        // Center the image
        const centeredX = (canvasWidth - img.width * autoScale) / 2;
        const centeredY = (canvasHeight - img.height * autoScale) / 2;
        setImagePosition({ x: centeredX, y: centeredY });
        
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
  
  // Handle canvas click
  const handleStageClick = (e) => {
    // Deselect when clicked on empty area
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }
  };
  
  // Handle stage mouse down for drawing
  const handleStageMouseDown = (e) => {
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
        strokeWidth: 6
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
  }, [selectedId, snapToGrid, history, historyIndex]);
  
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
            <Button onClick={deleteSelected} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Elimina
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
            </div>
          </div>
          
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
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-800 mb-2">
                🧱 <strong>Muro:</strong> Clicca punto iniziale, poi clicca punto finale.
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Colore Muro:</Label>
                <input
                  type="color"
                  value={wallColor}
                  onChange={(e) => setWallColor(e.target.value)}
                  className="w-12 h-8 rounded border-2 cursor-pointer"
                />
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
                        setImagePosition({ x: 0, y: 0 });
                        setImageScale(1);
                        setImageOpacity(0.5);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
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
              <span><kbd className="bg-white px-1 rounded">Canc</kbd> Elimina</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="library">
          <p className="text-sm text-slate-600">Libreria elementi in arrivo...</p>
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
            
            {/* Grid */}
            {Array.from({ length: 9 }, (_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 100, 0, i * 100, 600]}
                stroke="#94a3b8"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 100, 800, i * 100]}
                stroke="#94a3b8"
                strokeWidth={1}
              />
            ))}
            
            {/* Walls */}
            {walls.map((wall) => (
              <Line
                key={wall.id}
                points={wall.points}
                stroke={wall.stroke}
                strokeWidth={wall.strokeWidth}
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
                shadowBlur={selectedId === wall.id ? 12 : 0}
                shadowColor={selectedId === wall.id ? 'rgba(239, 68, 68, 0.8)' : 'transparent'}
              />
            ))}
            
            {/* Drawing preview */}
            {isDrawing && drawStart && (
              <Circle
                x={drawStart.x}
                y={drawStart.y}
                radius={5}
                fill="#ef4444"
              />
            )}
          </Layer>
        </Stage>
      </div>
    </Card>
  );
};

export default FloorPlanEditorKonva;
