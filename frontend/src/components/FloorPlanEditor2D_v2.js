import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save, Square, Move, Trash2, DoorOpen, Maximize2, Sofa, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';

// Libreria elementi predefiniti
const ELEMENT_LIBRARY = {
  doors: [
    { id: 'door-single', name: 'Porta Singola', width: 0.9, height: 2.1, icon: '🚪' },
    { id: 'door-double', name: 'Porta Doppia', width: 1.6, height: 2.1, icon: '🚪🚪' },
    { id: 'door-sliding', name: 'Porta Scorrevole', width: 1.2, height: 2.1, icon: '↔️' }
  ],
  windows: [
    { id: 'window-small', name: 'Finestra Piccola', width: 0.8, height: 1.2, icon: '🪟' },
    { id: 'window-medium', name: 'Finestra Media', width: 1.2, height: 1.5, icon: '🪟' },
    { id: 'window-large', name: 'Finestra Grande', width: 2.0, height: 1.8, icon: '🪟' }
  ],
  furniture: [
    { id: 'bed-single', name: 'Letto Singolo', width: 1.0, depth: 2.0, icon: '🛏️' },
    { id: 'bed-double', name: 'Letto Matrimoniale', width: 1.6, depth: 2.0, icon: '🛏️' },
    { id: 'sofa-2', name: 'Divano 2 posti', width: 1.5, depth: 0.9, icon: '🛋️' },
    { id: 'sofa-3', name: 'Divano 3 posti', width: 2.2, depth: 0.9, icon: '🛋️' },
    { id: 'table-dining', name: 'Tavolo Pranzo', width: 1.6, depth: 0.9, icon: '🪑' },
    { id: 'desk', name: 'Scrivania', width: 1.4, depth: 0.7, icon: '💻' },
    { id: 'wardrobe', name: 'Armadio', width: 2.0, depth: 0.6, icon: '👔' }
  ]
};

const FloorPlanEditor2D = ({ floorPlanImage, threeDData, onSave }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [mode, setMode] = useState('view');
  const [rooms, setRooms] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [walls, setWalls] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [scale, setScale] = useState(10);
  const [wallHeight, setWallHeight] = useState(2.8);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);

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

  useEffect(() => {
    drawCanvas();
  }, [rooms, doors, windows, walls, selectedElement, furniture, floorPlanImage]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    for (let i = 0; i < canvas.width; i += scale * 1) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += scale * 1) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    ctx.setLineDash([]);

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
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px Inter';
      ctx.fillText(`${room.type || 'Stanza'}`, (room.x || 0) + 5, (room.y || 0) + 20);
      ctx.font = '12px Inter';
      ctx.fillText(`${room.width}x${room.depth}m`, (room.x || 0) + 5, (room.y || 0) + 35);
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

    // Draw walls
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    walls.forEach((wall) => {
      const isSelected = selectedElement?.type === 'wall' && 
                        selectedElement?.start[0] === wall.start[0] && 
                        selectedElement?.start[1] === wall.start[1];
      
      if (isSelected) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
      }
      
      ctx.beginPath();
      ctx.moveTo(wall.start[0] * scale, wall.start[1] * scale);
      ctx.lineTo(wall.end[0] * scale, wall.end[1] * scale);
      ctx.stroke();
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'room') {
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
          width: Math.max(width, 1),
          depth: Math.max(depth, 1),
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
    } else if (mode === 'view') {
      let selected = null;
      
      // Check walls first
      walls.forEach((wall) => {
        const x1 = wall.start[0] * scale;
        const y1 = wall.start[1] * scale;
        const x2 = wall.end[0] * scale;
        const y2 = wall.end[1] * scale;
        
        const dist = pointToLineDistance(x, y, x1, y1, x2, y2);
        if (dist < 10) {
          selected = { type: 'wall', start: wall.start, end: wall.end, data: wall };
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
      setWalls(walls.filter(w => 
        !(w.start[0] === selectedElement.start[0] && w.start[1] === selectedElement.start[1])
      ));
      toast.success('Muro rimosso!');
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
        <h3 className="text-xl font-bold text-slate-900">Editor 2D Pianta</h3>
        <div className="flex gap-2">
          {selectedElement && (
            <Button
              onClick={deleteSelected}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Elimina {selectedElement.type}
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
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => { setMode('view'); setSelectedLibraryItem(null); }}
              variant={mode === 'view' ? 'default' : 'outline'}
              className="w-full"
            >
              <Move className="w-4 h-4 mr-1" />
              Seleziona
            </Button>
            <Button
              onClick={() => { setMode('room'); setSelectedLibraryItem(null); }}
              variant={mode === 'room' ? 'default' : 'outline'}
              className="w-full"
            >
              <Square className="w-4 h-4 mr-1" />
              Stanza
            </Button>
            <Button
              onClick={() => setMode('door')}
              variant={mode === 'door' ? 'default' : 'outline'}
              className="w-full"
            >
              <DoorOpen className="w-4 h-4 mr-1" />
              Porte
            </Button>
            <Button
              onClick={() => setMode('window')}
              variant={mode === 'window' ? 'default' : 'outline'}
              className="w-full"
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Finestre
            </Button>
          </div>

          {mode === 'room' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                📐 <strong>Stanza:</strong> Clicca per iniziare, poi clicca di nuovo per finire.
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
                    <span className="text-xs text-slate-500">{item.width}m</span>
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
                    <span className="text-xs text-slate-500">{item.width}m</span>
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
                    <span className="text-xs text-slate-500">{item.width}x{item.depth}m</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {floorPlanImage && (
        <div className="bg-green-50 p-3 rounded-lg mb-4 mt-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Immagine di sfondo attiva!</strong> Traccia direttamente sopra la piantina.
          </p>
        </div>
      )}

      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50 relative mt-4" style={{ height: '600px', position: 'relative' }}>
        {floorPlanImage ? (
          <>
            <img 
              ref={imageRef}
              src={floorPlanImage}
              alt="Floor plan background"
              onLoad={() => console.log('Image loaded successfully')}
              onError={(e) => console.error('Image load error:', e)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 1,
                display: 'block'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 5,
              right: 5,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              zIndex: 20
            }}>
              Immagine: {floorPlanImage.substring(floorPlanImage.lastIndexOf('/') + 1, floorPlanImage.lastIndexOf('/') + 20)}...
            </div>
          </>
        ) : (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#64748b',
            zIndex: 0
          }}>
            <p>Nessuna immagine di riferimento</p>
            <p className="text-xs">Carica una piantina per vederla qui</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            zIndex: 10,
            background: 'transparent'
          }}
          data-testid="floor-plan-canvas"
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <div>
          <Label>Altezza Muri (m)</Label>
          <Input
            type="number"
            step="0.1"
            value={wallHeight}
            onChange={(e) => setWallHeight(parseFloat(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Scala (px/m)</Label>
          <Input
            type="number"
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Elementi</Label>
          <p className="text-sm mt-1 text-slate-600">
            {rooms.length} stanze, {doors.length} porte, {windows.length} finestre, {furniture.length} mobili
          </p>
        </div>
        <div>
          <Label className="text-sm">Muri</Label>
          <p className="text-sm mt-1 text-slate-600">
            {walls.length} muri
          </p>
        </div>
      </div>

      {selectedElement && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Selezionato: {selectedElement.type}</h4>
              <div className="text-sm space-y-1 mt-2">
                {selectedElement.type === 'room' && (
                  <>
                    <p>ID: {selectedElement.data.id}</p>
                    <p>Dimensioni: {selectedElement.data.width}m x {selectedElement.data.depth}m x {selectedElement.data.height}m</p>
                  </>
                )}
                {selectedElement.type === 'door' && (
                  <p>Porta: {selectedElement.data.name} ({selectedElement.data.width}m)</p>
                )}
                {selectedElement.type === 'window' && (
                  <p>Finestra: {selectedElement.data.name} ({selectedElement.data.width}m)</p>
                )}
                {selectedElement.type === 'furniture' && (
                  <p>Arredo: {selectedElement.data.name} ({selectedElement.data.width}x{selectedElement.data.depth}m)</p>
                )}
                {selectedElement.type === 'wall' && (
                  <p>Muro: da [{selectedElement.start[0].toFixed(1)}, {selectedElement.start[1].toFixed(1)}] a [{selectedElement.end[0].toFixed(1)}, {selectedElement.end[1].toFixed(1)}]</p>
                )}
              </div>
            </div>
            <Button onClick={deleteSelected} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FloorPlanEditor2D;