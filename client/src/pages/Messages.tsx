import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, ArrowLeft, Send, Loader2 } from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";

function SimpleAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Friends list ──────────────────────────────────────────────────────────
  const { data: friendRecords = [], isLoading: loadingFriends } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    queryFn: () => apiRequest("GET", "/api/friends").then(r => r.json()),
  });

  // ── Messages for selected conversation ───────────────────────────────────
  const { data: messages = [], isLoading: loadingMsgs } = useQuery<any[]>({
    queryKey: ["/api/messages", selectedFriend?.id],
    queryFn: async () => {
      if (!selectedFriend) return [];
      // Try the query-param format first
      const res = await apiRequest("GET", `/api/messages?friendId=${selectedFriend.id}`);
      if (res.ok) return res.json();
      // Fallback: path-param format
      const res2 = await apiRequest("GET", `/api/messages/${selectedFriend.id}`);
      if (res2.ok) return res2.json();
      // Endpoint doesn't exist yet — return empty instead of crashing
      return [];
    },
    enabled: !!selectedFriend,
    refetchInterval: 3000,
  });

  // ── Send message mutation ─────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: selectedFriend!.id,
        content: text,
      });
      // If backend returns error JSON, throw so onError fires
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/messages", selectedFriend?.id] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: err?.message || "No se pudo enviar el mensaje",
      });
    },
  });

  // ── Auto-scroll & Notifications ───────────────────────────────────────────
  const [prevMsgCount, setPrevMsgCount] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Check for new messages
    if (messages && messages.length > prevMsgCount && prevMsgCount > 0) {
      const newMsg = messages[messages.length - 1];
      // If I didn't send it, notify me
      if (newMsg.senderId !== user?.id && newMsg.sender?.id !== user?.id) {
        const senderName = selectedFriend?.name || "Alguien";
        try {
          LocalNotifications.schedule({
            notifications: [{
              title: "Nuevo mensaje",
              body: `${senderName} te envió un mensaje`,
              id: new Date().getTime(),
            }]
          });
        } catch(e) {}
      }
    }
    setPrevMsgCount(messages?.length || 0);
  }, [messages, selectedFriend, user]);

  // ── URL param ?friend=id ──────────────────────────────────────────────────
  useEffect(() => {
    if (!friendRecords.length) return;
    const params = new URLSearchParams(location.split("?")[1]);
    const fId = params.get("friend");
    if (fId) {
      const rec = friendRecords.find(r => String(r.friend.id) === fId);
      if (rec) openChat(rec);
    }
  }, [location, friendRecords]);

  const openChat = (record: any) => {
    setSelectedFriend(record.friend);
    setMobileView("chat");
  };

  const handleBack = () => {
    setMobileView("list");
    setSelectedFriend(null);
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    setDraft("");
    sendMutation.mutate(text);
  };

  const isMe = (msg: any) =>
    msg.senderId === user?.id || msg.sender?.id === user?.id;

  // ── Friends list panel ────────────────────────────────────────────────────
  const FriendsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold">Mensajes</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loadingFriends && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {friendRecords.map((rec) => (
          <div
            key={rec.id}
            onClick={() => openChat(rec)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer active:bg-primary/10 hover:bg-muted transition-colors ${
              selectedFriend?.id === rec.friend.id ? "bg-primary/10" : ""
            }`}
          >
            <SimpleAvatar name={rec.friend.name || "?"} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{rec.friend.name}</p>
              <p className="text-xs text-muted-foreground truncate">Toca para chatear</p>
            </div>
          </div>
        ))}
        {friendRecords.length === 0 && !loadingFriends && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No tienes amigos aún.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Chat panel ────────────────────────────────────────────────────────────
  const ChatView = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/50 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="md:hidden p-1 rounded-lg active:bg-muted transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {selectedFriend && <SimpleAvatar name={selectedFriend.name} size="md" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight truncate">{selectedFriend?.name}</p>
          <p className="text-xs text-muted-foreground">
            {loadingMsgs ? "Cargando..." : "Activo"}
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
        {loadingMsgs && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loadingMsgs && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              Inicia la conversación con {selectedFriend?.name} 👋
            </p>
          </div>
        )}
        {messages.map((msg: any, idx: number) => {
          const mine = isMe(msg);
          return (
            <div key={msg.id ?? idx} className={`flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && <SimpleAvatar name={selectedFriend?.name || "?"} size="sm" />}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                mine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                <p>{msg.content ?? msg.text}</p>
                {msg.createdAt && (
                  <p className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {/* Optimistic sending bubble */}
        {sendMutation.isPending && (
          <div className="flex justify-end">
            <div className="max-w-[75%] px-3 py-2 rounded-2xl text-sm bg-primary/50 text-primary-foreground rounded-br-sm opacity-70 animate-pulse">
              <p>...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border/50 flex gap-2 items-center">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="rounded-full bg-muted border-0 focus-visible:ring-1"
          onKeyDown={e => {
            if (e.key === "Enter") { handleSend(); e.preventDefault(); }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!draft.trim() || sendMutation.isPending}
          size="icon"
          className="rounded-full shrink-0 h-10 w-10"
        >
          {sendMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`
        w-full md:w-72 border-r border-border/50
        ${mobileView === "chat" ? "hidden md:flex" : "flex"}
        flex-col h-full
      `}>
        <FriendsList />
      </div>
      <div className={`
        flex-1 flex flex-col h-full
        ${mobileView === "list" ? "hidden md:flex" : "flex"}
      `}>
        {selectedFriend ? (
          <ChatView />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un amigo para chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}