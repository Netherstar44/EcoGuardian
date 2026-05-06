import { apiBase } from "@/lib/queryClient";
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex gap-1 py-2"
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
  </motion.div>
);

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('chatSessionId');
    if (stored) {
      setSessionId(stored);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chatSessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId && messages.length === 0) {
      loadChatHistory();
    }
  }, [sessionId]);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`${apiBase}/api/chat/history/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('[Chat] Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!user && messages.length === 0 && !showNameModal && !isLoadingHistory) {
      setShowNameModal(true);
    }
  }, [user, messages.length, showNameModal, isLoadingHistory]);

  const handleSetName = () => {
    if (tempName.trim()) {
      setShowNameModal(false);
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `¡Hola ${tempName}! Soy Gaia, la guardiana del planeta. Estoy aquí para ayudarte con tus dudas sobre sostenibilidad y medio ambiente. ¿En qué puedo ayudarte?`
      };
      setMessages([welcomeMessage]);
    }
  };

  const saveChatHistory = async (updatedMessages: Message[]) => {
    try {
      const displayName = user?.name || tempName;
      await fetch(apiBase + '/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          userNickname: displayName,
          sessionId,
          messages: updatedMessages,
          title: `Chat - ${new Date().toLocaleDateString('es-ES')}`
        }),
      });
    } catch (error) {
      console.error('[Chat] Error saving history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const displayName = user?.name || tempName;
      const payload = { messages: updatedMessages, userName: displayName };
      
      const response = await fetch(apiBase + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.response) throw new Error('No response from server');

      const assistantMessage: Message = { role: 'assistant', content: data.response };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
      
    } catch (error) {
      console.error('[Chat Error]:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error 
          ? `Disculpa, tuve un problema: ${error.message}` 
          : 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col p-4">
      <div className="w-full h-full rounded-3xl bg-card/95 dark:bg-card/98 backdrop-blur-xl border border-border shadow-2xl flex flex-col overflow-hidden max-w-4xl mx-auto">
        <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <div>
            <h3 className="font-bold text-foreground">Gaia</h3>
            <p className="text-xs text-muted-foreground">Guardiana del Planeta</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
          <AnimatePresence mode="popLayout">
            {isLoadingHistory ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex items-center justify-center">
                <TypingIndicator />
              </motion.div>
            ) : messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-3xl">🌍</span>
                  </div>
                  <p className="text-muted-foreground">Pregúntame sobre sostenibilidad</p>
                </div>
              </motion.div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-primary to-accent text-white rounded-br-none' : 'bg-muted text-foreground border border-border rounded-bl-none shadow-md'}`}>
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-muted border border-border text-foreground rounded-2xl rounded-bl-none px-4 shadow-md">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-4 border-t border-border bg-card/80 backdrop-blur-sm flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="bg-background border-border rounded-full"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full bg-gradient-to-br from-primary to-accent text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-border"
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">¡Bienvenido!</h2>
              <p className="text-muted-foreground mb-4">¿Cuál es tu nombre?</p>
              <Input value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSetName()} placeholder="Tu nombre o apodo" className="mb-4 rounded-full" autoFocus />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowNameModal(false); setTempName(''); }} className="flex-1 rounded-full">Cancelar</Button>
                <Button onClick={handleSetName} disabled={!tempName.trim()} className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent text-white">Continuar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}