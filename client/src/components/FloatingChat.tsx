import { apiBase } from "@/lib/queryClient";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageCircle, X, Send, Sparkles, RotateCcw, Leaf } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  { icon: '🌱', text: '¿Cómo reducir mi huella de carbono?' },
  { icon: '♻️', text: '¿Cómo separar residuos en casa?' },
  { icon: '💡', text: 'Consejos para ahorrar energía' },
];

function TypewriterText({
  content,
  isStreaming,
  onComplete,
  onProgress
}: {
  content: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  onProgress?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : content);
  const [isDone, setIsDone] = useState(!isStreaming);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      setIsDone(true);
      return;
    }

    let currentIndex = 0;
    setIsDone(false);
    setDisplayedText('');

    const totalLength = content.length;
    const chunkSize = totalLength > 600 ? 5 : totalLength > 250 ? 3 : 2;
    const intervalMs = 18;

    const interval = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= totalLength) {
        setDisplayedText(content);
        setIsDone(true);
        clearInterval(interval);
        onComplete?.();
        onProgress?.();
      } else {
        setDisplayedText(content.slice(0, currentIndex));
        onProgress?.();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [content, isStreaming, onComplete, onProgress]);

  return (
    <div className="relative text-sm leading-relaxed break-words whitespace-pre-wrap">
      <span>{displayedText}</span>
      {!isDone && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 rounded-sm align-middle"
        />
      )}
    </div>
  );
}

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    className="flex items-center gap-2 px-3.5 py-2 bg-muted/80 backdrop-blur-md rounded-2xl rounded-bl-none border border-border/50 text-xs shadow-sm w-fit"
  >
    <div className="flex items-center gap-1">
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
      />
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
      />
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
      />
    </div>
    <span className="font-medium text-[11px] text-muted-foreground">Gaia está redactando...</span>
  </motion.div>
);

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Generar sessionId único
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

  // Listen for bottom-nav "Chat" button custom event
  useEffect(() => {
    const handler = () => setIsOpen(prev => !prev);
    window.addEventListener('open-floating-chat', handler);
    return () => window.removeEventListener('open-floating-chat', handler);
  }, []);

  // Cargar historial cuando se abre el chat
  useEffect(() => {
    if (isOpen && sessionId && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen, sessionId]);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`${apiBase}/api/chat/history/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: Message) => ({ ...m, isStreaming: false })));
        }
      }
    } catch (error) {
      console.error('[Chat] Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
      setTimeout(() => scrollToBottom(false), 100);
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(true);
    }
  }, [messages.length, isLoading, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !user && messages.length === 0 && !showNameModal && !isLoadingHistory) {
      setShowNameModal(true);
    }
  }, [isOpen, user, messages.length, showNameModal, isLoadingHistory]);

  const handleSetName = () => {
    if (tempName.trim()) {
      setShowNameModal(false);
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `¡Hola ${tempName}! Soy Gaia, la guardiana de EcoGuardian. Estoy aquí para resolver tus dudas ambientales y guiarte hacia un impacto positivo. ¿En qué te ayudo hoy?`,
        isStreaming: true
      };
      setMessages([welcomeMessage]);
    }
  };

  const saveChatHistory = async (updatedMessages: Message[]) => {
    try {
      const displayName = user?.name || tempName;
      const cleanMessages = updatedMessages.map(({ role, content }) => ({ role, content }));
      await fetch(apiBase + '/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          userNickname: displayName,
          sessionId,
          messages: cleanMessages,
          title: `Chat - ${new Date().toLocaleDateString('es-ES')}`
        }),
      });
    } catch (error) {
      console.error('[Chat] Error saving history:', error);
    }
  };

  const handleStreamingDone = useCallback((index: number) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], isStreaming: false };
      }
      saveChatHistory(updated);
      return updated;
    });
  }, []);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const displayName = user?.name || tempName;
      const payload = { 
        messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        userName: displayName
      };
      
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

      const assistantMessage: Message = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        isStreaming: true
      };
      setMessages([...updatedMessages, assistantMessage]);
      
    } catch (error) {
      console.error('[Chat Error]:', error);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error 
          ? `Disculpa, tuve un problema: ${error.message}` 
          : 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        isStreaming: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chatSessionId', newSessionId);
    setSessionId(newSessionId);
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: `¡Hola de nuevo! He reiniciado nuestra conversación. ¿De qué tema ecológico te gustaría hablar?`,
      isStreaming: true
    };
    setMessages([welcomeMessage]);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40 hidden md:block"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 via-primary to-teal-500 shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all flex items-center justify-center text-white group border border-white/20"
            >
              <MessageCircle className="w-6 h-6 relative z-10" />
              <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[560px] max-h-[85vh]"
          >
            <div className="w-full h-full rounded-3xl bg-card/95 dark:bg-card/98 backdrop-blur-xl border border-border shadow-2xl flex flex-col overflow-hidden">
              
              {/* Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-teal-500/10 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-primary to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-foreground">Gaia</h3>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        IA
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Guardiana del Planeta
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetChat}
                    title="Reiniciar chat"
                    className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/40 scroll-smooth">
                <AnimatePresence mode="popLayout">
                  {isLoadingHistory ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center">
                      <TypingIndicator />
                    </motion.div>
                  ) : messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="h-full flex flex-col items-center justify-center text-center p-3"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-primary/20 border border-emerald-500/30 flex items-center justify-center mb-2.5 shadow-inner">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">¡Hola! Soy Gaia</h4>
                      <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                        Pregúntame sobre hábitos sostenibles, reciclaje y cuidado del planeta.
                      </p>

                      <div className="flex flex-col gap-1.5 w-full">
                        {SUGGESTIONS.map((s, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => sendMessage(s.text)}
                            className="p-2.5 text-left rounded-xl bg-card hover:bg-muted border border-border/70 text-xs font-medium text-foreground transition-all flex items-center gap-2 shadow-xs"
                          >
                            <span>{s.icon}</span>
                            <span className="truncate">{s.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      return (
                        <motion.div
                          key={msg.id || idx}
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 items-end`}
                        >
                          {!isUser && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-primary flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-xs mb-0.5">
                              G
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-xs ${
                              isUser
                                ? 'bg-gradient-to-br from-emerald-600 to-primary text-white rounded-br-xs'
                                : 'bg-card/95 dark:bg-muted/70 text-foreground border border-border/80 rounded-bl-xs'
                            }`}
                          >
                            {isUser ? (
                              <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <TypewriterText
                                content={msg.content}
                                isStreaming={msg.isStreaming}
                                onComplete={() => handleStreamingDone(idx)}
                                onProgress={() => scrollToBottom(true)}
                              />
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>

                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start gap-2 items-end">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-primary flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-xs mb-0.5">
                      G
                    </div>
                    <TypingIndicator />
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-border bg-card/80 backdrop-blur-md">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-1.5 items-center bg-background/90 rounded-full border border-border/80 px-2 py-1 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-inner"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregúntale a Gaia..."
                    disabled={isLoading}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-xs placeholder:text-muted-foreground/60 h-8"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading || !input.trim()}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-primary text-white hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Dialog */}
      <AnimatePresence>
        {showNameModal && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-5 shadow-2xl max-w-xs w-full border border-border"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                <Leaf className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">¡Bienvenido!</h2>
              <p className="text-xs text-muted-foreground mb-3">¿Cómo te gustaría que te llame Gaia?</p>
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSetName()}
                placeholder="Tu nombre o apodo"
                className="mb-3 rounded-xl text-xs h-9"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNameModal(false);
                    setTempName('');
                  }}
                  className="flex-1 rounded-xl text-xs"
                >
                  Omitir
                </Button>
                <Button
                  size="sm"
                  onClick={handleSetName}
                  disabled={!tempName.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-primary text-white text-xs"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}