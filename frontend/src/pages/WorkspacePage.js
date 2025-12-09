import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { Boxes, Upload, Pencil, Home, Loader2, Eye, Plus, Save, Trash2, RotateCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import FloorPlanEditor2D from '../components/FloorPlanEditor2D_v2';
import FloorPlanEditorKonva from '../components/FloorPlanEditorKonva';

extend({ OrbitControls });

const CameraControls = () => {
  const { camera, gl } = useThree();
  const controlsRef = React.useRef();

  React.useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => controlsRef.current?.update());
  return null;
};

const Scene3D = ({ threeData }) => {
  if (!threeData) return null;

  try {
    const data = typeof threeData === 'string' ? JSON.parse(threeData) : threeData;

    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.5} />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
          <gridHelper args={[50, 50, 0xe2e8f0, 0xe2e8f0]} rotation={[-Math.PI / 2, 0, 0]} />
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
              rotation={[0, -angle, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[length, wall.height, wall.thickness]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
            </mesh>
          );
        })}

        <CameraControls />
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
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
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
      if (!planName) setPlanName(file.name.split('.')[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !planName) return toast.error('Seleziona un file e inserisci un nome');

    setLoading(true);
    try {
      const createResponse = await axios.post(`${API}/floorplans`, {
        user_id: userId,
        name: planName,
        file_type: uploadFile.type.includes('pdf') ? 'pdf' : 'image'
      });

      const formData = new FormData();
      formData.append('file', uploadFile);

      await axios.post(`${API}/floorplans/${createResponse.data.id}/upload`, formData, {
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
    if (!canvasRef.current || !planName) return toast.error('Disegna qualcosa e inserisci un nome');

    setLoading(true);
    try {
      const canvasData = canvasRef.current.toDataURL();
      const response = await axios.post(`${API}/floorplans`, {
        user_id: userId,
        name: planName,
        file_type: 'canvas',
        canvas_data: canvasData
      });

      toast.success('Disegno salvato! Apertura editor...');
      setSelectedPlan(response.data);
      setPlanName('');
      loadFloorPlans();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate3D = async (updatedData) => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      await axios.patch(`${API}/floorplans/${selectedPlan.id}`, { three_d_data: JSON.stringify(updatedData) });
      const planResponse = await axios.get(`${API}/floorplans/${selectedPlan.id}`);
      setSelectedPlan(planResponse.data);
      toast.success('Modello 3D aggiornato!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Errore aggiornamento');
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

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">Vision3D</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-primary">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8">
        {!selectedPlan ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Creation Panel */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-display">Nuovo Progetto</CardTitle>
                <CardDescription>Carica una piantina esistente o disegnane una nuova</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Upload className="w-4 h-4 mr-2" /> Carica
                    </TabsTrigger>
                    <TabsTrigger value="draw" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Pencil className="w-4 h-4 mr-2" /> Disegna
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="planName">Nome Progetto</Label>
                      <Input
                        id="planName"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Es. Ristrutturazione Bagno"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fileUpload">File (PDF, Immagine)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                        <Input
                          id="fileUpload"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-8 h-8 opacity-50" />
                          <span className="text-sm font-medium">
                            {uploadFile ? uploadFile.name : "Trascina o clicca per caricare"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={loading || !uploadFile || !planName}
                      className="w-full h-11"
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Crea Progetto
                    </Button>
                  </TabsContent>

                  <TabsContent value="draw" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome Progetto</Label>
                      <Input
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Es. Schizzo Cucina"
                      />
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden shadow-inner bg-slate-50">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={() => setIsDrawing(false)}
                        onMouseLeave={() => setIsDrawing(false)}
                        className="w-full h-auto cursor-crosshair touch-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                      }} className="flex-1">
                        <Trash2 className="w-4 h-4 mr-2" /> Pulisci
                      </Button>
                      <Button onClick={handleSaveCanvas} disabled={loading || !planName} className="flex-1">
                        <Save className="w-4 h-4 mr-2" /> Salva
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* List Panel */}
            <Card className="border-border/50 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-2xl font-display">I Tuoi Progetti</CardTitle>
                <CardDescription>Gestisci e modifica le tue piantine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {floorPlans.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                      <Boxes className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>Nessun progetto trovato</p>
                    </div>
                  ) : (
                    floorPlans.map((plan) => (
                      <div key={plan.id} className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium uppercase tracking-wider">
                              {plan.file_type}
                            </span>
                            <span className="text-xs text-muted-foreground">{plan.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" onClick={() => setSelectedPlan(plan)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {plan.three_d_data && (
                            <Button size="icon" variant="ghost" onClick={() => setSelectedPlan(plan)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Editor Header */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)}>
                  <Home className="w-5 h-5 text-muted-foreground" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold font-display">{selectedPlan.name}</h2>
                  <p className="text-sm text-muted-foreground">Editor Progetto</p>
                </div>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <div className="text-xs font-medium px-3 py-1 bg-background rounded-md shadow-sm">Modo Editor</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 h-[800px]">
              {/* 2D Context Panel */}
              <Card className="lg:col-span-1 border-border/50 shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="py-4 border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Riferimento 2D</CardTitle>
                </CardHeader>
                <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
                  {selectedPlan.file_url ? (
                    <img src={selectedPlan.file_url} alt="Reference" className="max-w-full max-h-full object-contain shadow-lg rounded" />
                  ) : (
                    <div className="text-muted-foreground text-sm">Nessuna immagine di riferimento</div>
                  )}
                </div>
              </Card>

              {/* Main Editor Area */}
              <Card className="lg:col-span-2 border-border/50 shadow-sm flex flex-col overflow-hidden">
                <Tabs defaultValue="editor" className="flex flex-col h-full">
                  <div className="px-4 py-2 border-b border-border/50 flex justify-between items-center bg-muted/30">
                    <TabsList>
                      <TabsTrigger value="editor"><Pencil className="w-3 h-3 mr-2" />Editor Strutturale</TabsTrigger>
                      <TabsTrigger value="preview" disabled={!selectedPlan.three_d_data}><Eye className="w-3 h-3 mr-2" />Anteprima 3D</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 relative bg-slate-50 overflow-hidden">
                    <TabsContent value="editor" className="h-full m-0 p-0 absolute inset-0">
                      <FloorPlanEditorKonva
                        floorPlanImage={selectedPlan.file_url}
                        threeDData={selectedPlan.three_d_data}
                        onSave={handleUpdate3D}
                      />
                    </TabsContent>

                    <TabsContent value="preview" className="h-full m-0 p-0 absolute inset-0">
                      {selectedPlan.three_d_data ? (
                        <Canvas camera={{ position: [15, 20, 15], fov: 45 }}>
                          <color attach="background" args={['#f8fafc']} />
                          <fog attach="fog" args={['#f8fafc', 20, 60]} />
                          <Suspense fallback={null}>
                            <Scene3D threeData={selectedPlan.three_d_data} />
                          </Suspense>
                          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
                        </Canvas>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Nessun dato 3D disponibile
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;