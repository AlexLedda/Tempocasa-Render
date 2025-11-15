import { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Box, Upload, Pencil, Home, Loader2, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Plane } from '@react-three/fiber';
import * as THREE from 'three';

const Scene3D = ({ threeData }) => {
  if (!threeData) return null;

  try {
    const data = typeof threeData === 'string' ? JSON.parse(threeData) : threeData;
    
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        
        {/* Walls */}
        {data.walls && data.walls.map((wall, idx) => {
          const start = wall.start;
          const end = wall.end;
          const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
          const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
          const centerX = (start[0] + end[0]) / 2;
          const centerZ = (start[1] + end[1]) / 2;
          
          return (
            <mesh
              key={`wall-${idx}`}
              position={[centerX, wall.height / 2, centerZ]}
              rotation={[0, angle, 0]}
              castShadow
            >
              <boxGeometry args={[length, wall.height, wall.thickness]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
          );
        })}
        
        {/* Rooms visualization */}
        {data.rooms && data.rooms.map((room, idx) => (
          <mesh
            key={`room-${idx}`}
            position={[idx * 6 - 3, room.height / 2, 0]}
            castShadow
          >
            <boxGeometry args={[room.width, room.height, room.depth]} />
            <meshStandardMaterial color="#94a3b8" opacity={0.7} transparent />
          </mesh>
        ))}
        
        <OrbitControls enablePan enableZoom enableRotate />
      </>
    );
  } catch (error) {
    console.error('Error rendering 3D scene:', error);
    return null;
  }
};

const WorkspacePage = () => {
  const navigate = useNavigate();
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [planName, setPlanName] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasContext, setCanvasContext] = useState(null);

  useEffect(() => {
    loadFloorPlans();
  }, []);

  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      setCanvasContext(ctx);
    }
  }, [activeTab]);

  const loadFloorPlans = async () => {
    try {
      const response = await axios.get(`${API}/floorplans?user_id=${userId}`);
      setFloorPlans(response.data);
    } catch (error) {
      console.error('Error loading floor plans:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!planName) {
        setPlanName(file.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !planName) {
      toast.error('Seleziona un file e inserisci un nome');
      return;
    }

    setLoading(true);
    try {
      // Create floor plan
      const createResponse = await axios.post(`${API}/floorplans`, {
        user_id: userId,
        name: planName,
        file_type: uploadFile.type.includes('pdf') ? 'pdf' : 'image'
      });

      const planId = createResponse.data.id;

      // Upload file
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      await axios.post(`${API}/floorplans/${planId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Piantina caricata con successo!');
      setUploadFile(null);
      setPlanName('');
      loadFloorPlans();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Errore durante il caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCanvas = async () => {
    if (!canvasRef.current || !planName) {
      toast.error('Disegna qualcosa e inserisci un nome');
      return;
    }

    setLoading(true);
    try {
      const canvasData = canvasRef.current.toDataURL();
      
      const response = await axios.post(`${API}/floorplans`, {
        user_id: userId,
        name: planName,
        file_type: 'canvas',
        canvas_data: canvasData
      });

      toast.success('Disegno salvato con successo!');
      setPlanName('');
      // Clear canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      loadFloorPlans();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert3D = async (planId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/floorplans/${planId}/convert-3d`);
      toast.success('Conversione 3D completata!');
      loadFloorPlans();
      
      // Load the converted plan
      const planResponse = await axios.get(`${API}/floorplans/${planId}`);
      setSelectedPlan(planResponse.data);
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Errore durante la conversione');
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e) => {
    if (!canvasContext) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    canvasContext.beginPath();
    canvasContext.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasContext) return;
    const rect = canvasRef.current.getBoundingClientRect();
    canvasContext.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    canvasContext.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Vision3D
              </span>
            </div>
            <Button
              data-testid="home-button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-blue-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Upload/Draw */}
          <Card className="p-6 bg-white/90 backdrop-blur-sm border-2 border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Crea Nuova Piantina</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" data-testid="upload-tab">
                  <Upload className="w-4 h-4 mr-2" />
                  Carica File
                </TabsTrigger>
                <TabsTrigger value="draw" data-testid="draw-tab">
                  <Pencil className="w-4 h-4 mr-2" />
                  Disegna
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label htmlFor="planName">Nome Piantina</Label>
                  <Input
                    id="planName"
                    data-testid="plan-name-input"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Es: Appartamento Milano"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fileUpload">Carica File (PDF, PNG, JPG)</Label>
                  <Input
                    id="fileUpload"
                    data-testid="file-upload-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                </div>
                
                {uploadFile && (
                  <p className="text-sm text-slate-600">File selezionato: {uploadFile.name}</p>
                )}
                
                <Button
                  data-testid="upload-button"
                  onClick={handleUpload}
                  disabled={loading || !uploadFile || !planName}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Carica Piantina
                </Button>
              </TabsContent>
              
              <TabsContent value="draw" className="space-y-4">
                <div>
                  <Label htmlFor="drawPlanName">Nome Piantina</Label>
                  <Input
                    id="drawPlanName"
                    data-testid="draw-plan-name-input"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Es: Progetto Casa"
                    className="mt-2"
                  />
                </div>
                
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    data-testid="drawing-canvas"
                    width={600}
                    height={400}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full cursor-crosshair bg-white"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    data-testid="clear-canvas-button"
                    variant="outline"
                    onClick={() => {
                      if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                      }
                    }}
                    className="flex-1"
                  >
                    Cancella
                  </Button>
                  <Button
                    data-testid="save-canvas-button"
                    onClick={handleSaveCanvas}
                    disabled={loading || !planName}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Salva Disegno
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Right Panel - Floor Plans List */}
          <Card className="p-6 bg-white/90 backdrop-blur-sm border-2 border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Le Tue Piantine</h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {floorPlans.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nessuna piantina ancora. Carica o disegna la prima!</p>
              ) : (
                floorPlans.map((plan) => (
                  <Card key={plan.id} className="p-4 border hover:border-blue-400 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                        <p className="text-sm text-slate-500">
                          {plan.file_type} • {plan.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!plan.three_d_data && (
                          <Button
                            data-testid={`convert-button-${plan.id}`}
                            size="sm"
                            onClick={() => handleConvert3D(plan.id)}
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <Box className="w-4 h-4 mr-1" />
                            Converti 3D
                          </Button>
                        )}
                        {plan.three_d_data && (
                          <Button
                            data-testid={`view-button-${plan.id}`}
                            size="sm"
                            onClick={() => setSelectedPlan(plan)}
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Visualizza
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 3D Viewer */}
        {selectedPlan && selectedPlan.three_d_data && (
          <Card className="mt-8 p-6 bg-white/90 backdrop-blur-sm border-2 border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Vista 3D: {selectedPlan.name}</h2>
              <Button
                data-testid="close-3d-viewer-button"
                variant="outline"
                onClick={() => setSelectedPlan(null)}
              >
                Chiudi
              </Button>
            </div>
            
            <div className="h-[500px] bg-slate-100 rounded-lg overflow-hidden" data-testid="3d-canvas">
              <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                <Suspense fallback={null}>
                  <Scene3D threeData={selectedPlan.three_d_data} />
                </Suspense>
              </Canvas>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;