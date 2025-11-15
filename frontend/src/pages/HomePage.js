import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Box, MessageSquare, Sparkles, Zap, Upload, Pencil } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Test API connection
    const testConnection = async () => {
      try {
        const response = await axios.get(`${API}/`);
        console.log('API Connected:', response.data);
      } catch (error) {
        console.error('API Connection Error:', error);
      }
    };
    testConnection();
  }, []);

  const handleGetStarted = () => {
    navigate('/workspace');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Vision3D
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                data-testid="chat-nav-button"
                variant="ghost"
                onClick={() => navigate('/chat')}
                className="hover:bg-blue-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat
              </Button>
              <Button
                data-testid="workspace-nav-button"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30"
              >
                Inizia
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Alimentato da AI GPT-5 & Claude Sonnet 4
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-700 bg-clip-text text-transparent">
                Trasforma Piantine 2D
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                in Modelli 3D
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Carica le tue piantine in PDF o immagini, disegnale direttamente nell'app, 
              e guarda come la nostra AI le trasforma in rendering 3D professionali.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                data-testid="hero-get-started-button"
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/30 rounded-2xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Inizia Gratuitamente
              </Button>
              <Button
                data-testid="hero-chat-button"
                size="lg"
                variant="outline"
                onClick={() => navigate('/chat')}
                className="text-lg px-8 py-6 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Parla con l'AI
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Funzionalità Potenti
            </h2>
            <p className="text-lg text-slate-600">
              Tutto ciò di cui hai bisogno per creare rendering 3D professionali
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Carica o Disegna</CardTitle>
                <CardDescription className="text-base">
                  Carica piantine in PDF o immagini (PNG/JPG), oppure disegnale direttamente nell'app con strumenti intuitivi.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                  <Cube className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Conversione 3D Automatica</CardTitle>
                <CardDescription className="text-base">
                  La nostra AI analizza le piantine e le converte in modelli 3D completi con pareti, porte e finestre.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">AI Auto-Apprendente</CardTitle>
                <CardDescription className="text-base">
                  L'assistente AI impara dalle tue preferenze e feedback, offrendo suggerimenti sempre più personalizzati.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 shadow-2xl shadow-blue-500/30">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Pronto a Iniziare?
            </h2>
            <p className="text-xl text-blue-50 mb-8">
              Trasforma le tue piantine in rendering 3D professionali in pochi minuti.
            </p>
            <Button
              data-testid="cta-get-started-button"
              size="lg"
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50 shadow-xl rounded-2xl"
            >
              <Zap className="w-5 h-5 mr-2" />
              Inizia Ora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto text-center text-slate-600">
          <p>© 2025 Vision3D. Alimentato da AI per architetti e designer.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;