import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Boxes, Home, Send, Sparkles, Loader2, Bot, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ChatPage = () => {
  const navigate = useNavigate();
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-5');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    try {
      const response = await axios.post(`${API}/conversations`, {
        user_id: userId,
        title: 'Conversazione AI'
      });
      setConversationId(response.data.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Errore nella creazione della conversazione');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        conversation_id: conversationId,
        message: inputMessage,
        model: selectedModel
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        model: response.data.model,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">Vision3D AI</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-primary">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </nav>

      <div className="flex-1 pt-24 pb-8 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <Card className="h-[calc(100vh-8rem)] flex flex-col border-border/50 shadow-lg overflow-hidden bg-background/50 backdrop-blur-sm">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Architect Assistant</h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-muted-foreground">Online • Ready to help</span>
                </div>
              </div>
            </div>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5">GPT-5 (OpenAI)</SelectItem>
                <SelectItem value="claude-4-sonnet-20250514">Claude Sonnet 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-0 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 rotate-3 transition-transform hover:rotate-6">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold font-display mb-2">Come posso aiutarti oggi?</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Chiedimi di analizzare una piantina, suggerire materiali o ottimizzare gli spazi della tua casa.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {['Come ottimizzo un soggiorno piccolo?', 'Quali colori per una camera moderna?', 'Spiegami come caricare una piantina', 'Analizza le tendenze 2025'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      className="h-auto py-3 px-4 text-left justify-start whitespace-normal text-muted-foreground hover:text-primary hover:border-primary/50"
                      onClick={() => setInputMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-white border border-border rounded-tl-sm'
                        }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.model && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/10">
                          <Sparkles className="w-3 h-3 opacity-70" />
                          <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium">{msg.model}</span>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 bg-background border-t border-border/50">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi un messaggio all'AI..."
                  disabled={loading}
                  className="pr-4 py-6 shadow-sm border-muted-foreground/20 focus-visible:ring-primary"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="h-[50px] w-[50px] rounded-xl shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-muted-foreground">L'IA può commettere errori. Verifica le informazioni importanti.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;