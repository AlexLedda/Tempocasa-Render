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
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [scale, setScale] = useState(0.1); // 0.1 pixels per cm = 10 pixels per metro
  const [wallHeight, setWallHeight] = useState(280); // 280 cm = 2.8m
  const [wallThickness, setWallThickness] = useState(20); // 20 cm
  const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);
  const [mousePos, setMousePos] = useState(null);

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

  useEffect(() => {
    drawCanvas();
  }, [rooms, doors, windows, walls, selectedElement, furniture, backgroundImg, mousePos, isDrawing, startPoint, mode]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image if available
    if (backgroundImg) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
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
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
      }
      
      ctx.beginPath();
      ctx.moveTo(wall.start[0], wall.start[1]);
      ctx.lineTo(wall.end[0], wall.end[1]);
      ctx.stroke();
      
      // Draw small circles at endpoints for visibility
      ctx.fillStyle = isSelected ? '#ef4444' : '#0f172a';
      ctx.beginPath();
      ctx.arc(wall.start[0], wall.start[1], 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wall.end[0], wall.end[1], 4, 0, Math.PI * 2);
      ctx.fill();
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'wall') {
      if (!isDrawing) {
        setStartPoint({ x, y });
        setIsDrawing(true);
      } else {
        // Store wall with pixel coordinates, not converted
        const newWall = {
          start: [startPoint.x, startPoint.y],
          end: [x, y],
          height: wallHeight,
          thickness: wallThickness
        };
        setWalls([...walls, newWall]);
        setIsDrawing(false);
        setStartPoint(null);
        toast.success('Muro aggiunto!');
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
    } else if (mode === 'view') {
      let selected = null;
      
      // Check walls first
      walls.forEach((wall, idx) => {
        const x1 = wall.start[0];
        const y1 = wall.start[1];
        const x2 = wall.end[0];
        const y2 = wall.end[1];
        
        const dist = pointToLineDistance(x, y, x1, y1, x2, y2);
        if (dist < 10) {
          selected = { type: 'wall', idx, start: wall.start, end: wall.end, data: wall };
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
      setWalls(walls.filter((_, idx) => idx !== selectedElement.idx));
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
          <div className="grid grid-cols-5 gap-2">
            <Button
              onClick={() => { setMode('view'); setSelectedLibraryItem(null); }}
              variant={mode === 'view' ? 'default' : 'outline'}
              className="w-full"
            >
              <Move className="w-4 h-4 mr-1" />
              Seleziona
            </Button>
            <Button
              onClick={() => { setMode('wall'); setSelectedLibraryItem(null); setIsDrawing(false); setStartPoint(null); }}
              variant={mode === 'wall' ? 'default' : 'outline'}
              className="w-full"
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Muro
            </Button>
            <Button
              onClick={() => { setMode('room'); setSelectedLibraryItem(null); setIsDrawing(false); setStartPoint(null); }}
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

          {mode === 'wall' && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-800">
                🧱 <strong>Muro:</strong> Clicca punto iniziale, poi clicca punto finale per tracciare un muro.
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

      {floorPlanImage && (
        <div className="bg-green-50 p-3 rounded-lg mb-4 mt-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Immagine di sfondo attiva!</strong> Traccia direttamente sopra la piantina.
          </p>
        </div>
      )}

      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white mt-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({ x, y });
          }}
          onMouseLeave={() => setMousePos(null)}
          className="w-full cursor-crosshair"
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
                    <p>Dimensioni: {selectedElement.data.width}cm x {selectedElement.data.depth}cm x {selectedElement.data.height}cm</p>
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
                  <p>Muro: lunghezza {Math.sqrt(Math.pow((selectedElement.end[0] - selectedElement.start[0]), 2) + Math.pow((selectedElement.end[1] - selectedElement.start[1]), 2)).toFixed(0)}cm, spessore {wallThickness}cm</p>
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