import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Boxes, MessageSquare, Sparkles, Zap, Upload, ArrowRight, LayoutTemplate } from 'lucide-react';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Health check
    axios.get(`${API}/`).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-foreground">
              Vision3D
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/chat')}
              className="hidden sm:flex text-muted-foreground hover:text-primary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            <Button
              onClick={() => navigate('/workspace')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              Inizia Ora
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-display">Nuovo Motore AI Disponibile</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold font-display tracking-tight leading-[1.1]">
            Dai vita alle tue <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Idee Architettoniche
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            La piattaforma all-in-one che trasforma schizzi e piantine 2D in 
            modelli 3D fotorealistici grazie all'intelligenza artificiale.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              size="lg"
              onClick={() => navigate('/workspace')}
              className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 rounded-full transition-all hover:scale-105"
            >
              <Zap className="w-5 h-5 mr-2" />
              Crea Progetto
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/chat')}
              className="h-12 px-8 text-base border-border hover:bg-muted/50 rounded-full"
            >
              <LayoutTemplate className="w-5 h-5 mr-2" />
              Esplora Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Upload />}
              title="Importazione Universale"
              description="Carica PDF, JPG o PNG. Il nostro sistema riconosce automaticamente muri, porte e finestre."
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <FeatureCard 
              icon={<Boxes />}
              title="Modellazione Instantanea"
              description="Guarda la tua piantina trasformarsi in un modello 3D navigabile in pochi secondi."
              color="text-purple-500"
              bg="bg-purple-500/10"
            />
            <FeatureCard 
              icon={<Sparkles />}
              title="Rendering AI"
              description="Applica stili e materiali fotorealistici con un semplice prompt testuale."
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-primary px-6 py-16 md:px-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-primary-foreground mb-6 relative z-10">
              Pronto a rivoluzionare il tuo workflow?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto relative z-10">
              Unisciti a migliaia di architetti e designer che usano Vision3D per risparmiare tempo.
            </p>
            
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/workspace')}
              className="h-12 px-8 text-base bg-background text-primary hover:bg-background/90 shadow-lg border-0 rounded-full relative z-10"
            >
              Inizia Gratuitamente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            <span className="font-bold font-display">Vision3D</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Powered by Tempocasa Tech
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper Component for consistency
const FeatureCard = ({ icon, title, description, color, bg }) => (
  <Card className="border border-border/50 bg-background/50 hover:bg-background hover:shadow-lg hover:border-primary/20 transition-all duration-300">
    <CardHeader>
      <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-4`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <CardTitle className="font-display text-xl">{title}</CardTitle>
      <CardDescription className="text-base leading-relaxed">
        {description}
      </CardDescription>
    </CardHeader>
  </Card>
);

import React from 'react'; // Checking if React needs to be imported for cloneElement
export default HomePage;