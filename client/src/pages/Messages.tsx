import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, ArrowLeft, Send, Loader2, Image as ImageIcon, 
  Paperclip, Check, CheckCheck, Smile, X
} from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared Sub-components ──────────────────────────────────────────────────
function SimpleAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  if (avatar) {
    return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ── GIF Picker Component ────────────────────────────────────────────────────
function GifPicker({ onSelect, onClose, position }: { onSelect: (url: string) => void, onClose: () => void, position: { bottom: number, left: number } }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("trending");
  const [searched, setSearched] = useState(false);

  const loadCategory = async (cat: string) => {
    setLoading(true);
    setActiveCategory(cat);
    setSearched(false);
    try {
      const res = await fetch(`/api/gifs/category?cat=${cat}`);
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch (err) {}
    setLoading(false);
  };

  const loadTrending = async () => {
    setLoading(true);
    setActiveCategory("trending");
    setSearched(false);
    try {
      const res = await fetch("/api/gifs/trending");
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch (err) {}
    setLoading(false);
  };

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setActiveCategory("");
    try {
      const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    loadTrending();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div 
        className="absolute inset-0 pointer-events-auto" 
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        style={{
          position: "fixed",
          bottom: position.bottom,
          left: position.left,
          width: "300px",
          maxHeight: "400px",
        }}
        className="pointer-events-auto bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-2 border-b border-border/50 flex gap-2">
          <Input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search(query)}
            placeholder="Buscar GIF..."
            className="h-8 text-xs rounded-full"
            autoFocus
          />
          <Button size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => search(query)}>Ir</Button>
        </div>

        {!searched && (
          <div className="flex gap-1 p-2 overflow-x-auto no-scrollbar border-b border-border/20 shrink-0">
            {["trending", "feliz", "triste", "gracias", "amor", "baile"].map(cat => (
              <button 
                key={cat} 
                onClick={() => cat === "trending" ? loadTrending() : loadCategory(cat)}
                className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {gifs.map(gif => (
                <button 
                  key={gif.id} 
                  onClick={() => onSelect(gif.url)}
                  className="rounded-lg overflow-hidden hover:opacity-80 active:scale-95 transition-all bg-muted aspect-video"
                >
                  <img src={gif.preview} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-2 py-1 text-[8px] text-muted-foreground/50 text-right bg-muted/20">Powered by GIPHY</div>
      </motion.div>
    </div>,
    document.body
  );
}

// ── Main Page Component ─────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [location] = useLocation();
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifPickerPos, setGifPickerPos] = useState({ bottom: 0, left: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedFriendRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifBtnRef = useRef<HTMLButtonElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sync ref with state
  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: friendRecords = [], isLoading: loadingFriends } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    queryFn: () => apiRequest("GET", "/api/friends").then(r => r.json()),
  });

  const { data: conversations = [], isLoading: loadingConvos } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    queryFn: () => apiRequest("GET", "/api/conversations").then(r => r.json()),
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery<any[]>({
    queryKey: ["/api/messages", selectedFriend?.id],
    queryFn: () => apiRequest("GET", `/api/messages?friendId=${selectedFriend?.id}`).then(r => r.json()),
    enabled: !!selectedFriend,
  });

  // ── WebSocket Setup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("[WS] Connected");
        socket?.send(JSON.stringify({ type: "auth", userId: user.id }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const currentFriend = selectedFriendRef.current;
          
          if (data.type === "new_message") {
            const msg = data.message;
            // Si estamos en el chat correcto (usar Number() para evitar líos de tipos)
            if (currentFriend && (Number(msg.senderId) === Number(currentFriend.id) || Number(msg.receiverId) === Number(currentFriend.id))) {
              qc.setQueryData(["/api/messages", currentFriend.id], (old: any[]) => {
                const list = old || [];
                if (list.find(m => m.id === msg.id)) return list;
                return [...list, msg];
              });
              
              // Marcar como leído si estoy en el chat y el mensaje es de mi amigo
              if (Number(msg.senderId) === Number(currentFriend.id)) {
                socket?.send(JSON.stringify({ type: "read", senderId: currentFriend.id }));
              }
            }
            
            // Siempre invalidar conversaciones para actualizar sidebar y unread counts
            qc.invalidateQueries({ queryKey: ["/api/conversations"] });

            // Notificación si no estoy en el chat
            if (Number(msg.senderId) !== Number(user.id) && (!currentFriend || Number(msg.senderId) !== Number(currentFriend.id))) {
              try {
                LocalNotifications.schedule({
                  notifications: [{
                    title: msg.sender?.name || "Nuevo mensaje",
                    body: msg.type === "image" ? "📷 Imagen" : msg.type === "gif" ? "🎬 GIF" : msg.content,
                    id: new Date().getTime(),
                  }]
                });
              } catch(e) {}
            }
          }
          
          if (data.type === "typing" && currentFriend && Number(data.senderId) === Number(currentFriend.id)) {
            setFriendTyping(true);
            setTimeout(() => setFriendTyping(false), 3000);
          }

          if (data.type === "messages_read") {
            if (currentFriend && Number(data.readBy) === Number(currentFriend.id)) {
              qc.invalidateQueries({ queryKey: ["/api/messages", currentFriend.id] });
            }
          }
        } catch (err) {
          console.error("[WS] Message error:", err);
        }
      };

      socket.onclose = () => {
        console.log("[WS] Disconnected, reconnecting...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("[WS] Socket error:", err);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null; // Prevent reconnect on intentional close
        socket.close();
      }
    };
  }, [user?.id, qc]);

  useEffect(() => {
    if (selectedFriend && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "read", senderId: selectedFriend.id }));
      qc.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  }, [selectedFriend?.id, qc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, friendTyping]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (payload: { content?: string, type: string, attachmentUrl?: string }) => {
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: selectedFriend!.id,
        ...payload
      });
      if (!res.ok) throw new Error("Error al enviar");
      return res.json();
    },
    onSuccess: (newMsg) => {
      setDraft("");
      setShowGifPicker(false);
      qc.setQueryData(["/api/messages", selectedFriend?.id], (old: any[]) => {
        if (!old) return [newMsg];
        if (old.find(m => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      qc.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => toast({ variant: "destructive", title: "Error al enviar mensaje" }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFriend) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await apiRequest("POST", "/api/messages/upload", { imageBase64: base64 });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        sendMutation.mutate({ type: "image", attachmentUrl: url, content: "" });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ variant: "destructive", title: "Error subiendo imagen" });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    sendMutation.mutate({ content: draft.trim(), type: "text" });
  }, [draft, sendMutation, selectedFriend]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    if (!isTyping && wsRef.current?.readyState === WebSocket.OPEN && selectedFriend) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({ type: "typing", receiverId: selectedFriend.id }));
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const openChat = (friendData: any) => {
    setSelectedFriend(friendData);
    setMobileView("chat");
  };

  const chatList = [...conversations];
  friendRecords.forEach(fr => {
    if (!chatList.find(c => c.partner.id === fr.friend.id)) {
      chatList.push({ partner: fr.friend, lastMessage: null, unreadCount: 0 });
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Chat List Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border/50 ${mobileView === "chat" ? "hidden md:flex" : "flex"} flex-col h-full shrink-0`}>
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {(loadingFriends || loadingConvos) && chatList.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : chatList.map((item) => (
            <div
              key={item.partner.id}
              onClick={() => openChat(item.partner)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted transition-colors ${selectedFriend?.id === item.partner.id ? "bg-primary/10" : ""}`}
            >
              <SimpleAvatar name={item.partner.name} avatar={item.partner.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold truncate">{item.partner.name}</p>
                  {item.lastMessage && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${item.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                  {item.lastMessage?.type === 'image' ? '📷 Imagen' : item.lastMessage?.type === 'gif' ? '🎬 GIF' : (item.lastMessage?.content || "Toca para chatear")}
                </p>
              </div>
              {item.unreadCount > 0 && <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{item.unreadCount}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat View */}
      <div className={`flex-1 flex flex-col h-full ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {selectedFriend ? (
          <div className="flex flex-col h-full bg-background/50">
            {/* Chat Header */}
            <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-background">
              <button onClick={() => { setMobileView("list"); setSelectedFriend(null); }} className="md:hidden p-2 rounded-full hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <SimpleAvatar name={selectedFriend.name} avatar={selectedFriend.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight truncate">{selectedFriend?.name}</p>
                <p className="text-xs text-primary font-medium h-4">{friendTyping ? "escribiendo..." : ""}</p>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {loadingMsgs && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />}
              {messages.map((msg: any, idx: number) => {
                const mine = msg.senderId === user?.id;
                const showAvatar = !mine && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && <div className="w-8 shrink-0 flex items-end">{showAvatar && <SimpleAvatar name={selectedFriend?.name || "?"} avatar={selectedFriend?.avatar} size="sm" />}</div>}
                    <div className={`max-w-[75%] rounded-2xl overflow-hidden ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                      {(msg.type === "image" || msg.type === "gif") && msg.attachmentUrl && (
                        <img src={msg.attachmentUrl} alt="" className="max-w-full object-contain bg-black/5 max-h-[300px]" />
                      )}
                      {msg.content && <p className="px-3 pt-2 pb-1 text-[15px] leading-relaxed">{msg.content}</p>}
                      <div className={`flex items-center justify-end gap-1 px-2 pb-1 pt-0.5 ${!msg.content ? "pt-1" : ""}`}>
                        <span className={`text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {mine && (msg.read ? <CheckCheck className="h-3 w-3 text-primary-foreground/90" /> : <Check className="h-3 w-3 text-primary-foreground/50" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {friendTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 shrink-0 flex items-end"><SimpleAvatar name={selectedFriend?.name || "?"} size="sm" /></div>
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border/50 flex gap-2 items-end bg-background">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="rounded-full shrink-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage || sendMutation.isPending}>
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                </Button>
                <Button 
                  ref={gifBtnRef}
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full shrink-0 text-muted-foreground"
                  onClick={() => {
                    if (gifBtnRef.current) {
                      const r = gifBtnRef.current.getBoundingClientRect();
                      setGifPickerPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, Math.min(r.left, window.innerWidth - 310)) });
                    }
                    setShowGifPicker(!showGifPicker);
                  }}
                >
                  <span className="text-[10px] font-bold border-2 border-muted-foreground rounded px-0.5 leading-none">GIF</span>
                </Button>
              </div>
              <Input
                value={draft}
                onChange={handleTyping}
                placeholder="Escribe un mensaje..."
                className="rounded-3xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary min-h-[44px]"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button onClick={handleSend} disabled={(!draft.trim() && !uploadingImage) || sendMutation.isPending} className="rounded-full shrink-0 h-11 w-11 p-0 shadow-md">
                {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
              </Button>
            </div>
            
            <AnimatePresence>
              {showGifPicker && (
                <GifPicker 
                  position={gifPickerPos}
                  onClose={() => setShowGifPicker(false)}
                  onSelect={(url) => sendMutation.mutate({ type: "gif", attachmentUrl: url, content: "" })}
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground/50">Tus Mensajes</p>
              <p className="text-sm opacity-60">Selecciona un chat para empezar a escribir</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}