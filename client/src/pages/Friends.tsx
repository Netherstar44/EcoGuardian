import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Heart, Check, X, Loader2,
  Search, UserMinus, MessageCircle, Leaf, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Link } from "wouter";

type Section = "requests" | "friends" | "search";

const tabs: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "requests", label: "Solicitudes", icon: UserPlus },
  { id: "friends",  label: "Mis Amigos",  icon: Users },
  { id: "search",   label: "Buscar",      icon: Search },
];

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ── Solicitud card ─────────────────────────────────────────────────────────────
function RequestCard({ request, onAccept, onReject, busy }: {
  request: any; onAccept: () => void; onReject: () => void; busy: boolean;
}) {
  const r = request.requester;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={r?.name || "?"} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{r?.name || "Usuario"}</p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <Leaf className="h-3 w-3 fill-green-500 text-green-500" /> {r?.points ?? 0} eco-puntos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={onAccept} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Confirmar</>}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={onReject} disabled={busy}>
              <X className="h-4 w-4 mr-1" />Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Amigo card ─────────────────────────────────────────────────────────────────
// getFriends devuelve: { id (friendshipId), userId, friendId, status, friend: User }
function FriendCard({ record, onRemove, busy }: {
  record: any; onRemove: () => void; busy: boolean;
}) {
  const f = record.friend;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={f?.name || "?"} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{f?.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground truncate">{f?.city || f?.country || "Sin ubicación"}</p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <Leaf className="h-3 w-3 fill-green-500 text-green-500" /> {f?.points ?? 0} pts
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/user/${f?.id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <User className="h-4 w-4 mr-1" />Ver perfil
              </Button>
            </Link>
            <Link href={`/messages?friend=${f?.id}`}>
              <Button size="sm" variant="outline" className="px-3">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="sm" variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
              onClick={onRemove} disabled={busy} title="Eliminar amigo"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Buscar usuario card ────────────────────────────────────────────────────────
function SearchUserCard({ u, currentUserId, friendRecords, requestRecords, onAdd, addingId }: {
  u: any; currentUserId: number; friendRecords: any[]; requestRecords: any[];
  onAdd: (id: number) => void; addingId: number | null;
}) {
  if (u.id === currentUserId) return null;

  // isFriend: el campo `friend` dentro de cada record tiene el id del otro usuario
  const isFriend = friendRecords.some((r: any) => r.friend?.id === u.id);
  // isPending: yo envié solicitud (userId=me, friendId=u.id) — aparece en mis sent, no en requests
  // O el otro me envió solicitud (aparece en requestRecords como requester.id === u.id)
  const isPending = requestRecords.some((r: any) => r.requester?.id === u.id);
  const isAdding = addingId === u.id;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={u.name || "?"} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.city || u.country || "Sin ubicación"}</p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <Leaf className="h-3 w-3 fill-green-500 text-green-500" /> {u.points ?? 0} eco-puntos
              </p>
            </div>
          </div>
          {isFriend ? (
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Check className="h-4 w-4 mr-1 text-green-500" />Ya son amigos
            </Button>
          ) : isPending ? (
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />Solicitud pendiente
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={() => onAdd(u.id)} disabled={isAdding}>
              {isAdding
                ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                : <UserPlus className="h-4 w-4 mr-1" />}
              Agregar amigo
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function Friends() {
  const [activeTab, setActiveTab] = useState<Section>("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 350);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requestRecords = [], isLoading: loadingRequests } = useQuery<any[]>({
    queryKey: ["/api/friends/requests"],
    queryFn: () => apiRequest("GET", "/api/friends/requests").then(r => r.json()),
  });

  // friendRecords: [{ id (friendshipId), userId, friendId, status, friend: User }]
  const { data: friendRecords = [], isLoading: loadingFriends } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    queryFn: () => apiRequest("GET", "/api/friends").then(r => r.json()),
  });

  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: () => apiRequest("GET", `/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()),
    enabled: debouncedQuery.length >= 2,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/friends/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ title: "✅ ¡Ahora son amigos!" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al aceptar solicitud" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/friends/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "Solicitud eliminada" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al rechazar solicitud" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/friends/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ title: "Amigo eliminado" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al eliminar amigo" }),
  });

  const addMutation = useMutation({
    mutationFn: (friendId: number) => apiRequest("POST", "/api/friends/add", { friendId }),
    onSuccess: () => {
      setAddingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "✅ Solicitud enviada" });
    },
    onError: () => {
      setAddingId(null);
      toast({ variant: "destructive", title: "No se pudo enviar la solicitud" });
    },
  });

  const handleAdd = (friendId: number) => {
    setAddingId(friendId);
    addMutation.mutate(friendId);
  };

  const pendingCount = Array.isArray(requestRecords) ? requestRecords.length : 0;
  const friendsCount = Array.isArray(friendRecords) ? friendRecords.length : 0;
  const searchUsers: any[] = searchResults?.users || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Amigos</h1>
        <p className="text-muted-foreground mt-1">Conecta con otros EcoGuardianes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge =
            tab.id === "requests" && pendingCount > 0 ? pendingCount :
            tab.id === "friends"  && friendsCount > 0 ? friendsCount : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {badge !== null && (
                <span className={`ml-1 text-[11px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                  tab.id === "requests" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* SOLICITUDES */}
        {activeTab === "requests" && (
          <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loadingRequests ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : pendingCount === 0 ? (
              <div className="text-center py-16">
                <UserPlus className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-1">No hay solicitudes pendientes</h3>
                <p className="text-muted-foreground text-sm mb-4">Cuando alguien te agregue, aparecerá aquí.</p>
                <Button onClick={() => setActiveTab("search")}>
                  <Search className="h-4 w-4 mr-2" />Buscar personas
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {requestRecords.map((req: any) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={() => acceptMutation.mutate(req.id)}
                      onReject={() => rejectMutation.mutate(req.id)}
                      busy={acceptMutation.isPending || rejectMutation.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* MIS AMIGOS */}
        {activeTab === "friends" && (
          <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loadingFriends ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : friendsCount === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-1">Aún no tienes amigos</h3>
                <p className="text-muted-foreground text-sm mb-4">¡Empieza a conectar con otros EcoGuardianes!</p>
                <Button onClick={() => setActiveTab("search")}>
                  <UserPlus className="h-4 w-4 mr-2" />Agregar amigos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {friendRecords.map((record: any) => (
                    <FriendCard
                      key={record.id}
                      record={record}
                      onRemove={() => removeMutation.mutate(record.id)}
                      busy={removeMutation.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* BUSCAR */}
        {activeTab === "search" && (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre..."
                className="pl-10 h-12 rounded-xl bg-background border-border"
                autoFocus
              />
            </div>

            {debouncedQuery.length < 2 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Escribe al menos 2 caracteres para buscar</p>
              </div>
            ) : loadingSearch ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : searchUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron usuarios con ese nombre</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchUsers.map((u: any) => (
                  <SearchUserCard
                    key={u.id}
                    u={u}
                    currentUserId={user!.id}
                    friendRecords={Array.isArray(friendRecords) ? friendRecords : []}
                    requestRecords={Array.isArray(requestRecords) ? requestRecords : []}
                    onAdd={handleAdd}
                    addingId={addingId}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}