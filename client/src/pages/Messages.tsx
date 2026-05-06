import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, ArrowLeft, Send, Loader2, Image as ImageIcon, Paperclip, Check, CheckCheck } from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  
  // Amigos (para iniciar chats nuevos)
  const { data: friendRecords = [], isLoading: loadingFriends } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    queryFn: () => apiRequest("GET", "/api/friends").then(r => r.json()),
  });

  // Conversaciones activas (con historial)
  const { data: conversations = [], isLoading: loadingConvos } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    queryFn: () => apiRequest("GET", "/api/conversations").then(r => r.json()),
  });

  // Mensajes de la conversación seleccionada
  const { data: messages = [], isLoading: loadingMsgs } = useQuery<any[]>({
    queryKey: ["/api/messages", selectedFriend?.id],
    queryFn: () => apiRequest("GET", `/api/messages?friendId=${selectedFriend?.id}`).then(r => r.json()),
    enabled: !!selectedFriend,
  });

  // ── WebSocket Setup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "new_message") {
          const msg = data.message;
          // Si estamos en el chat correcto, actualizamos la caché local
          if (selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id)) {
            qc.setQueryData(["/api/messages", selectedFriend.id], (old: any[]) => {
              if (!old) return [msg];
              if (old.find(m => m.id === msg.id)) return old; // evitar duplicados
              return [...old, msg];
            });
            
            // Marcar como leído si estoy en el chat y el mensaje es de mi amigo
            if (msg.senderId === selectedFriend.id) {
              ws.send(JSON.stringify({ type: "read", senderId: selectedFriend.id }));
            }
          }
          
          // Actualizar lista de conversaciones global
          qc.invalidateQueries({ queryKey: ["/api/conversations"] });

          // Notificación si no estoy en el chat con esa persona
          if (msg.senderId !== user.id && (!selectedFriend || msg.senderId !== selectedFriend.id)) {
            try {
              LocalNotifications.schedule({
                notifications: [{
                  title: msg.sender?.name || "Nuevo mensaje",
                  body: msg.type === "image" ? "📷 Imagen" : msg.content,
                  id: new Date().getTime(),
                }]
              });
            } catch(e) {}
          }
        }
        
        if (data.type === "typing" && selectedFriend && data.senderId === selectedFriend.id) {
          setFriendTyping(true);
          setTimeout(() => setFriendTyping(false), 3000);
        }

        if (data.type === "messages_read") {
          // Si mi amigo leyó mis mensajes, actualizar el check azul
          if (selectedFriend && data.readBy === selectedFriend.id) {
            qc.invalidateQueries({ queryKey: ["/api/messages", selectedFriend.id] });
          }
        }
      } catch (err) {}
    };

    return () => {
      ws.close();
    };
  }, [user, selectedFriend, qc]);

  // Enviar evento de "leído" al abrir el chat
  useEffect(() => {
    if (selectedFriend && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "read", senderId: selectedFriend.id }));
      qc.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  }, [selectedFriend, qc]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
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
      // Add optimistically to UI immediately (though WS will also echo it)
      qc.setQueryData(["/api/messages", selectedFriend?.id], (old: any[]) => {
        if (!old) return [newMsg];
        if (old.find(m => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      qc.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error al enviar mensaje" });
    },
  });

  // ── Image Upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFriend) return;
    
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!draft.trim()) return;
    sendMutation.mutate({ content: draft.trim(), type: "text" });
  };

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

  // Combinar amigos y conversaciones para la lista
  const chatList = [...conversations];
  friendRecords.forEach(fr => {
    if (!chatList.find(c => c.partner.id === fr.friend.id)) {
      chatList.push({ partner: fr.friend, lastMessage: null, unreadCount: 0 });
    }
  });

  const isMe = (msg: any) => msg.senderId === user?.id;

  // ── Componentes de UI ─────────────────────────────────────────────────────
  const ChatList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-xl font-bold">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {(loadingFriends || loadingConvos) && chatList.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : chatList.map((item) => (
          <div
            key={item.partner.id}
            onClick={() => openChat(item.partner)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted transition-colors ${
              selectedFriend?.id === item.partner.id ? "bg-primary/10" : ""
            }`}
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
                {item.lastMessage?.type === 'image' ? '📷 Imagen' : (item.lastMessage?.content || "Toca para chatear")}
              </p>
            </div>
            {item.unreadCount > 0 && (
              <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.unreadCount}
              </div>
            )}
          </div>
        ))}
        {chatList.length === 0 && !loadingFriends && !loadingConvos && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Agrega amigos para empezar a chatear</p>
          </div>
        )}
      </div>
    </div>
  );

  const ChatView = () => (
    <div className="flex flex-col h-full bg-background/50">
      <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-background">
        <button onClick={() => { setMobileView("list"); setSelectedFriend(null); }} className="md:hidden p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {selectedFriend && <SimpleAvatar name={selectedFriend.name} avatar={selectedFriend.avatar} size="md" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight truncate">{selectedFriend?.name}</p>
          <p className="text-xs text-primary font-medium h-4">
            {friendTyping ? "escribiendo..." : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {loadingMsgs && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />}
        
        {messages.map((msg: any, idx: number) => {
          const mine = isMe(msg);
          const showAvatar = !mine && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
          
          return (
            <div key={msg.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <div className="w-8 shrink-0 flex items-end">
                  {showAvatar && <SimpleAvatar name={selectedFriend?.name || "?"} avatar={selectedFriend?.avatar} size="sm" />}
                </div>
              )}
              
              <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                {msg.type === "image" && msg.attachmentUrl && (
                  <img src={msg.attachmentUrl} alt="Adjunto" className="max-w-full object-contain bg-black/5" />
                )}
                
                {msg.content && <p className="px-3 pt-2 pb-1 text-[15px] leading-relaxed">{msg.content}</p>}
                
                <div className={`flex items-center justify-end gap-1 px-2 pb-1 pt-0.5 ${!msg.content ? "pt-1" : ""}`}>
                  <span className={`text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {mine && (
                    msg.read ? <CheckCheck className="h-3 w-3 text-primary-foreground/90" /> : <Check className="h-3 w-3 text-primary-foreground/50" />
                  )}
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

      <div className="p-3 border-t border-border/50 flex gap-2 items-end bg-background">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full shrink-0 text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage || sendMutation.isPending}
        >
          {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
        </Button>
        
        <Input
          value={draft}
          onChange={handleTyping}
          placeholder="Escribe un mensaje..."
          className="rounded-3xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary min-h-[44px]"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        
        <Button
          onClick={handleSend}
          disabled={(!draft.trim() && !uploadingImage) || sendMutation.isPending}
          className="rounded-full shrink-0 h-11 w-11 p-0 shadow-md"
        >
          {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className={`w-full md:w-80 lg:w-96 border-r border-border/50 ${mobileView === "chat" ? "hidden md:flex" : "flex"} flex-col h-full shrink-0`}>
        <ChatList />
      </div>
      <div className={`flex-1 flex flex-col h-full ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {selectedFriend ? <ChatView /> : (
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