import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const ThreeDEditor = ({ threeDData, onUpdate }) => {
  const [data, setData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedWall, setSelectedWall] = useState(null);

  useEffect(() => {
    if (threeDData) {
      try {
        const parsed = typeof threeDData === 'string' ? JSON.parse(threeDData) : threeDData;
        setData(parsed);
      } catch (e) {
        console.error('Error parsing 3D data:', e);
      }
    }
  }, [threeDData]);

  if (!data) return null;

  const updateRoom = (roomId, field, value) => {
    const updated = {
      ...data,
      rooms: data.rooms.map(room => 
        room.id === roomId ? { ...room, [field]: parseFloat(value) || 0 } : room
      )
    };
    setData(updated);
  };

  const updateWall = (wallIndex, field, value) => {
    const updated = {
      ...data,
      walls: data.walls.map((wall, idx) => 
        idx === wallIndex ? { ...wall, [field]: parseFloat(value) || 0 } : wall
      )
    };
    setData(updated);
  };

  const addRoom = () => {
    const newRoom = {
      id: `room${data.rooms.length + 1}`,
      type: 'custom',
      width: 4,
      depth: 3,
      height: 2.8
    };
    setData({ ...data, rooms: [...data.rooms, newRoom] });
    toast.success('Stanza aggiunta!');
  };

  const deleteRoom = (roomId) => {
    setData({
      ...data,
      rooms: data.rooms.filter(room => room.id !== roomId)
    });
    toast.success('Stanza rimossa!');
  };

  const addDoor = () => {
    const newDoor = {
      position: [0, 0],
      width: 0.9,
      height: 2.1
    };
    setData({
      ...data,
      doors: [...(data.doors || []), newDoor]
    });
    toast.success('Porta aggiunta!');
  };

  const addWindow = () => {
    const newWindow = {
      position: [0, 1.5],
      width: 1.2,
      height: 1.5
    };
    setData({
      ...data,
      windows: [...(data.windows || []), newWindow]
    });
    toast.success('Finestra aggiunta!');
  };

  const handleSave = () => {
    onUpdate(data);
    toast.success('Modifiche salvate!');
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-2 border-slate-200 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900">Editor 3D</h3>
        <Button
          data-testid="save-3d-changes"
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Salva Modifiche
        </Button>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rooms">Stanze</TabsTrigger>
          <TabsTrigger value="walls">Muri</TabsTrigger>
          <TabsTrigger value="elements">Elementi</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Stanze ({data.rooms?.length || 0})</h4>
            <Button
              data-testid="add-room-button"
              onClick={addRoom}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi Stanza
            </Button>
          </div>

          {data.rooms?.map((room, idx) => (
            <Card key={room.id} className="p-4 border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="font-medium">{room.id}</h5>
                  <p className="text-sm text-slate-500">{room.type}</p>
                </div>
                <Button
                  data-testid={`delete-room-${room.id}`}
                  onClick={() => deleteRoom(room.id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Larghezza (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={room.width}
                    onChange={(e) => updateRoom(room.id, 'width', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Profondità (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={room.depth}
                    onChange={(e) => updateRoom(room.id, 'depth', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Altezza (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={room.height}
                    onChange={(e) => updateRoom(room.id, 'height', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="walls" className="space-y-4 mt-4">
          <h4 className="font-semibold">Muri ({data.walls?.length || 0})</h4>
          {data.walls?.map((wall, idx) => (
            <Card key={idx} className="p-4 border">
              <h5 className="font-medium mb-3">Muro {idx + 1}</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Altezza (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={wall.height}
                    onChange={(e) => updateWall(idx, 'height', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Spessore (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={wall.thickness}
                    onChange={(e) => updateWall(idx, 'thickness', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="elements" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Button
              data-testid="add-door-button"
              onClick={addDoor}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi Porta
            </Button>
            <Button
              data-testid="add-window-button"
              onClick={addWindow}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi Finestra
            </Button>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold">Porte ({data.doors?.length || 0})</h5>
            {data.doors?.map((door, idx) => (
              <Card key={idx} className="p-3 border">
                <p className="text-sm">Porta {idx + 1}: {door.width}m x {door.height}m</p>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold">Finestre ({data.windows?.length || 0})</h5>
            {data.windows?.map((window, idx) => (
              <Card key={idx} className="p-3 border">
                <p className="text-sm">Finestra {idx + 1}: {window.width}m x {window.height}m</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ThreeDEditor;