import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save, Square, Circle, Move, Trash2, DoorOpen, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

const FloorPlanEditor2D = ({ floorPlanImage, threeDData, onSave }) => {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('view'); // view, room, door, window, move
  const [rooms, setRooms] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [walls, setWalls] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [scale, setScale] = useState(10); // pixels per meter
  const [wallHeight, setWallHeight] = useState(2.8);
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    // Load background image using backend proxy to bypass CORS
    const loadImageViaProxy = async () => {
      if (!floorPlanImage) {
        console.log('No floor plan image provided');
        setBackgroundImage(null);
        return;
      }

      console.log('Loading background image via proxy:', floorPlanImage);
      
      try {
        // Use backend proxy endpoint
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const proxyUrl = `${API_URL}/api/proxy-image?url=${encodeURIComponent(floorPlanImage)}`;
        
        console.log('Proxy URL:', proxyUrl);
        
        // Create image from proxy URL
        const img = new Image();
        img.onload = () => {
          console.log('Background image loaded successfully via proxy');
          setBackgroundImage(img);
          toast.success('Immagine caricata!');
        };
        img.onerror = (e) => {
          console.error('Error loading image from proxy:', e);
          toast.error('Impossibile caricare l\'immagine. Continua senza sfondo.');
          setBackgroundImage('error');
        };
        img.src = proxyUrl;
        
      } catch (error) {
        console.error('Error setting up proxy image:', error);
        toast.error('Errore nel caricamento. Continua senza sfondo.');
        setBackgroundImage('error');
      }
    };

    loadImageViaProxy();
  }, [floorPlanImage]);

  useEffect(() => {
    // Load existing 3D data if available
    if (threeDData) {
      try {
        const data = typeof threeDData === 'string' ? JSON.parse(threeDData) : threeDData;
        if (data.rooms) setRooms(data.rooms.map(r => ({ ...r, x: (r.x || 0) * scale, y: (r.y || 0) * scale })));
        if (data.doors) setDoors(data.doors.map(d => ({ ...d, x: d.position[0] * scale, y: d.position[1] * scale })));
        if (data.windows) setWindows(data.windows.map(w => ({ ...w, x: w.position[0] * scale, y: w.position[1] * scale })));
        if (data.walls) setWalls(data.walls);
      } catch (e) {
        console.error('Error loading 3D data:', e);
      }
    }
  }, [threeDData]);

  useEffect(() => {
    drawCanvas();
  }, [rooms, doors, windows, walls, selectedElement, backgroundImage]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image FIRST if available
    if (backgroundImage && backgroundImage !== 'error') {
      try {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      } catch (e) {
        console.error('Error drawing background image:', e);
      }
    }

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += scale * 1) { // 1 meter grid
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

    // Draw rooms
    rooms.forEach((room, idx) => {
      const isSelected = selectedElement?.type === 'room' && selectedElement?.id === room.id;
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.2)';
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#94a3b8';
      ctx.lineWidth = isSelected ? 3 : 2;
      
      const width = (room.width || 4) * scale;
      const depth = (room.depth || 3) * scale;
      
      ctx.fillRect(room.x || 0, room.y || 0, width, depth);
      ctx.strokeRect(room.x || 0, room.y || 0, width, depth);
      
      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px Inter';
      ctx.fillText(`${room.type || 'Stanza'} (${room.width}x${room.depth}m)`, 
        (room.x || 0) + 5, (room.y || 0) + 20);
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
      
      // Icon
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 10px Inter';
      ctx.fillText('D', door.x - 5, door.y + 3);
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
      
      // Icon
      ctx.fillStyle = '#164e63';
      ctx.font = 'bold 10px Inter';
      ctx.fillText('W', window.x - 5, window.y + 3);
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
    } else if (mode === 'door') {
      const newDoor = {
        x,
        y,
        width: 0.9,
        height: 2.1
      };
      setDoors([...doors, newDoor]);
      toast.success('Porta aggiunta!');
    } else if (mode === 'window') {
      const newWindow = {
        x,
        y,
        width: 1.2,
        height: 1.5
      };
      setWindows([...windows, newWindow]);
      toast.success('Finestra aggiunta!');
    } else if (mode === 'view') {
      // Select element
      let selected = null;
      
      // Check rooms
      rooms.forEach(room => {
        const width = (room.width || 4) * scale;
        const depth = (room.depth || 3) * scale;
        if (x >= room.x && x <= room.x + width && y >= room.y && y <= room.y + depth) {
          selected = { type: 'room', id: room.id, data: room };
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
    }
    
    setSelectedElement(null);
  };

  const handleSave = () => {
    // Convert to 3D format
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
        height: d.height
      })),
      windows: windows.map(w => ({
        position: [w.x / scale, w.y / scale],
        width: w.width,
        height: w.height
      })),
      walls: generateWalls()
    };
    
    onSave(data);
    toast.success('Modello 3D generato! Scorri in basso per vederlo.')
  };

  const generateWalls = () => {
    // Generate walls from rooms
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
              Elimina
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

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Button
          onClick={() => setMode('view')}
          variant={mode === 'view' ? 'default' : 'outline'}
          className="w-full"
        >
          <Move className="w-4 h-4 mr-2" />
          Seleziona
        </Button>
        <Button
          onClick={() => setMode('room')}
          variant={mode === 'room' ? 'default' : 'outline'}
          className="w-full"
        >
          <Square className="w-4 h-4 mr-2" />
          Stanza
        </Button>
        <Button
          onClick={() => setMode('door')}
          variant={mode === 'door' ? 'default' : 'outline'}
          className="w-full"
        >
          <DoorOpen className="w-4 h-4 mr-2" />
          Porta
        </Button>
        <Button
          onClick={() => setMode('window')}
          variant={mode === 'window' ? 'default' : 'outline'}
          className="w-full"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Finestra
        </Button>
      </div>

      {mode === 'room' && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            📐 <strong>Modalità Stanza:</strong> Clicca per iniziare, poi clicca di nuovo per finire il rettangolo.
          </p>
        </div>
      )}
      {mode === 'door' && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">
            🚪 <strong>Modalità Porta:</strong> Clicca dove vuoi posizionare la porta.
          </p>
        </div>
      )}
      {mode === 'window' && (
        <div className="bg-cyan-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-cyan-800">
            🪟 <strong>Modalità Finestra:</strong> Clicca dove vuoi posizionare la finestra.
          </p>
        </div>
      )}

      {floorPlanImage && !backgroundImage && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">
            ⏳ <strong>Caricamento immagine di sfondo...</strong>
          </p>
          <p className="text-xs text-yellow-600 mt-1">URL: {floorPlanImage?.substring(0, 50)}...</p>
        </div>
      )}

      {floorPlanImage && backgroundImage && backgroundImage !== 'error' && (
        <div className="bg-green-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Immagine caricata!</strong> Puoi ora tracciare sulla piantina.
          </p>
        </div>
      )}

      {floorPlanImage && backgroundImage === 'error' && (
        <div className="bg-orange-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-orange-800">
            ⚠️ <strong>Impossibile caricare l'immagine nel canvas.</strong> Usa l'anteprima sopra come riferimento e disegna sulla griglia.
          </p>
          <p className="text-xs text-orange-600 mt-1">Nota: L'immagine è visibile nell'anteprima in alto. Puoi comunque tracciare gli elementi guardando quella.</p>
        </div>
      )}

      {!floorPlanImage && (
        <div className="bg-slate-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-slate-600">
            ℹ️ <strong>Nessuna immagine di riferimento.</strong> Disegna liberamente sulla griglia.
          </p>
        </div>
      )}

      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white relative">
        {floorPlanImage && (
          <img 
            src={floorPlanImage}
            alt="Floor plan background"
            className="absolute inset-0 w-full h-full object-contain opacity-40"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          className="cursor-crosshair w-full relative z-10"
          data-testid="floor-plan-canvas"
          style={{ background: 'transparent' }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
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
            {rooms.length} stanze, {doors.length} porte, {windows.length} finestre
          </p>
        </div>
      </div>

      {selectedElement && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Elemento Selezionato: {selectedElement.type}</h4>
          <div className="text-sm space-y-1">
            {selectedElement.type === 'room' && (
              <>
                <p>ID: {selectedElement.data.id}</p>
                <p>Dimensioni: {selectedElement.data.width}m x {selectedElement.data.depth}m</p>
                <p>Altezza: {selectedElement.data.height}m</p>
              </>
            )}
            {selectedElement.type === 'door' && (
              <>
                <p>Larghezza: {selectedElement.data.width}m</p>
                <p>Altezza: {selectedElement.data.height}m</p>
              </>
            )}
            {selectedElement.type === 'window' && (
              <>
                <p>Larghezza: {selectedElement.data.width}m</p>
                <p>Altezza: {selectedElement.data.height}m</p>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default FloorPlanEditor2D;