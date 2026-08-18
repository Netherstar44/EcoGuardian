import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Share2, Upload, Pause, Play, Volume2,
  VolumeX, ChevronUp, ChevronDown, Smile, Loader2, Plus, ArrowLeft, Send
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { shareContent } from "@/lib/share";

const CATEGORIES = ["limpieza", "reciclaje", "compostaje", "energía", "agua", "biodiversidad", "otro"];

function formatRelativeTime(dateStr: string | Date | undefined) {
  if (!dateStr) return "Hace un momento";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Hace un momento";
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  const days = Math.floor(diffInSeconds / 86400);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function Reels() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newReel, setNewReel] = useState({
    title: "",
    description: "",
    category: "limpieza",
    videoBase64: "",
    thumbnailBase64: "",
  });

  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number>(0);
  const showControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationCooldown = useRef<boolean>(false);
  const viewedReels = useRef<Set<number>>(new Set());
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialUrlHandled = useRef<boolean>(false);

  // Fetch all reels
  const { data: reels = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/reels"],
    queryFn: () => apiRequest("GET", "/api/reels").then(r => r.json()),
  });

  const currentReel = reels[currentReelIndex];

  // Fetch comments for current reel
  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["/api/reels", currentReel?.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/reels/${currentReel?.id}/comments`).then(r => r.json()),
    enabled: !!currentReel?.id,
  });

  // Fetch reactions for current reel
  const { data: reactions } = useQuery({
    queryKey: ["/api/reels", currentReel?.id, "reactions"],
    queryFn: () => apiRequest("GET", `/api/reels/${currentReel?.id}/reactions`).then(r => r.json()),
    enabled: !!currentReel?.id,
    refetchInterval: 3000,
  });

  // Handle deep linking from URL ?id=XYZ or /reels?id=XYZ on first load
  useEffect(() => {
    if (!initialUrlHandled.current && reels.length > 0) {
      initialUrlHandled.current = true;
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get("id");
      if (queryId) {
        const foundIndex = reels.findIndex(r => r.id === Number(queryId));
        if (foundIndex !== -1) {
          setCurrentReelIndex(foundIndex);
        }
      }
    }
  }, [reels]);

  // Sync active reel to URL parameter
  useEffect(() => {
    if (currentReel?.id) {
      const currentUrlId = new URLSearchParams(window.location.search).get("id");
      if (currentUrlId !== String(currentReel.id)) {
        const newUrl = `${window.location.pathname}?id=${currentReel.id}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [currentReel?.id]);

  // Register real view when reel is viewed for >1.5s
  useEffect(() => {
    if (!currentReel?.id) return;
    if (viewTimer.current) clearTimeout(viewTimer.current);

    setIsVideoLoading(true);
    setIsPlaying(true);

    viewTimer.current = setTimeout(() => {
      if (currentReel?.id && !viewedReels.current.has(currentReel.id)) {
        viewedReels.current.add(currentReel.id);
        apiRequest("POST", `/api/reels/${currentReel.id}/view`).catch(() => {});
        
        // Optimistically update view count in local query cache
        queryClient.setQueryData(["/api/reels"], (old: any[]) => {
          if (!old) return old;
          return old.map(r => r.id === currentReel.id ? { ...r, viewCount: (r.viewCount || 0) + 1 } : r);
        });
      }
    }, 1500);

    return () => {
      if (viewTimer.current) clearTimeout(viewTimer.current);
    };
  }, [currentReel?.id, queryClient]);

  // Create Reel mutation
  const createReelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reels", newReel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reels"] });
      toast({ title: "✅ Video publicado", description: "Tu EcoReel está en línea" });
      setNewReel({
        title: "",
        description: "",
        category: "limpieza",
        videoBase64: "",
        thumbnailBase64: "",
      });
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error al publicar",
        description: err?.message || "No se pudo subir el video. Verifica el tamaño del archivo.",
      });
    },
  });

  // Like mutation
  const likeReelMutation = useMutation({
    mutationFn: async () => {
      if (!currentReel?.id) return;
      return apiRequest("POST", `/api/reels/${currentReel.id}/reactions`, {
        type: "like",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reels", currentReel?.id, "reactions"] });
    },
  });

  // Comment mutation
  const commentReelMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentReel?.id) return;
      return apiRequest("POST", `/api/reels/${currentReel.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reels", currentReel?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reels"] });
      toast({ title: "✅ Comentario publicado" });
      setNewComment("");
      setShowEmojiPicker(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error al comentar",
        description: err?.message || "No se pudo enviar el comentario.",
      });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentReelMutation.isPending) return;
    commentReelMutation.mutate(newComment.trim());
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>, field: "videoBase64" | "thumbnailBase64") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = field === "videoBase64";
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = isVideo ? "50MB" : "5MB";

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: `El archivo supera el límite de ${maxLabel}. Intenta comprimir el video.`,
      });
      e.target.value = "";
      return;
    }

    if (isVideo && !file.type.startsWith("video/")) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Solo se permiten archivos de video." });
      e.target.value = "";
      return;
    }

    toast({ title: "📂 Cargando archivo...", description: "Procesando, un momento." });

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewReel(prev => ({ ...prev, [field]: event.target?.result as string }));
      toast({ title: isVideo ? "✅ Video listo" : "✅ Portada lista", description: "Archivo cargado correctamente." });
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo leer el archivo." });
    };
    reader.readAsDataURL(file);
  };

  const togglePlayPause = () => {
    const video = activeVideoRef.current;
    if (video) {
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
    setShowControls(true);
    if (showControlsTimer.current) clearTimeout(showControlsTimer.current);
    showControlsTimer.current = setTimeout(() => setShowControls(false), 1200);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const nextReel = useCallback(() => {
    if (navigationCooldown.current) return;
    if (currentReelIndex < reels.length - 1) {
      navigationCooldown.current = true;
      if (activeVideoRef.current) activeVideoRef.current.pause();
      setCurrentReelIndex(prev => prev + 1);
      setShowComments(false);
      setShowEmojiPicker(false);
      setTimeout(() => { navigationCooldown.current = false; }, 350);
    }
  }, [currentReelIndex, reels.length]);

  const prevReel = useCallback(() => {
    if (navigationCooldown.current) return;
    if (currentReelIndex > 0) {
      navigationCooldown.current = true;
      if (activeVideoRef.current) activeVideoRef.current.pause();
      setCurrentReelIndex(prev => prev - 1);
      setShowComments(false);
      setShowEmojiPicker(false);
      setTimeout(() => { navigationCooldown.current = false; }, 350);
    }
  }, [currentReelIndex]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 45) nextReel();
    else if (diff < -45) prevReel();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments || isCreateOpen) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        nextReel();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        prevReel();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m") {
        setIsMuted(m => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextReel, prevReel, showComments, isCreateOpen]);

  // Share reel with specific URL
  const handleShareReel = async () => {
    if (!currentReel) return;
    const url = `${window.location.origin}/reels?id=${currentReel.id}`;
    const result = await shareContent({
      title: currentReel.title || "EcoReel",
      text: `¡Mira "${currentReel.title || 'este EcoReel'}" de ${currentReel.author?.name || 'la comunidad'} en EcoGuardián!`,
      url
    }).catch(() => null);

    if (result === 'clipboard') {
      toast({ title: "✅ Enlace copiado", description: "El enlace específico al video se copió al portapapeles." });
    }
  };

  if (isLoading && reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Cargando EcoReels...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-black/95 text-white relative select-none overflow-hidden">
      
      {/* Upload Video Dialog */}
      {user && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <button
              className="absolute top-4 right-4 z-40 h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all text-white border border-white/20"
              title="Crear EcoReel"
            >
              <Plus className="h-6 w-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                🌱 Crea tu EcoReel
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="reel-title">Título del video</Label>
                <Input
                  id="reel-title"
                  value={newReel.title}
                  onChange={(e) => setNewReel(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Limpiando la ribera del río"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reel-category">Categoría</Label>
                <select
                  id="reel-category"
                  value={newReel.category}
                  onChange={(e) => setNewReel(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reel-description">Descripción</Label>
                <Textarea
                  id="reel-description"
                  value={newReel.description}
                  onChange={(e) => setNewReel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Cuéntale a la comunidad sobre tu iniciativa ecológica..."
                  className="bg-background border-border min-h-20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reel-video">Video <span className="text-muted-foreground text-xs">(máx. 50MB)</span></Label>
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${newReel.videoBase64 ? "border-green-500 bg-green-500/10" : "border-border"}`}>
                  {newReel.videoBase64 ? (
                    <div className="flex items-center justify-center gap-2 text-green-500 font-medium text-sm">
                      <span>✅ Video cargado con éxito</span>
                      <button type="button" onClick={() => setNewReel(p => ({ ...p, videoBase64: "" }))} className="ml-2 text-xs text-red-500 underline">Quitar</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Selecciona un video de tu dispositivo</p>
                      <Input
                        id="reel-video"
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoSelect(e, "videoBase64")}
                        className="bg-background border-border"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reel-thumbnail">Portada opcional <span className="text-muted-foreground text-xs">(máx. 5MB)</span></Label>
                <div className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors ${newReel.thumbnailBase64 ? "border-green-500 bg-green-500/10" : "border-border"}`}>
                  {newReel.thumbnailBase64 ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={newReel.thumbnailBase64} alt="preview" className="h-14 w-14 object-cover rounded-lg" />
                      <span className="text-sm text-green-500 font-medium">Portada lista</span>
                      <button type="button" onClick={() => setNewReel(p => ({ ...p, thumbnailBase64: "" }))} className="text-xs text-red-500 underline">Quitar</button>
                    </div>
                  ) : (
                    <Input
                      id="reel-thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleVideoSelect(e, "thumbnailBase64")}
                      className="bg-background border-border"
                    />
                  )}
                </div>
              </div>

              <Button
                onClick={() => createReelMutation.mutate()}
                disabled={createReelMutation.isPending || !newReel.title.trim() || !newReel.videoBase64}
                className="w-full font-bold h-11"
              >
                {createReelMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Subiendo video...</span>
                ) : (
                  "Publicar EcoReel"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {currentReel ? (
        <div className="w-full h-full flex items-center justify-center relative max-w-lg md:max-w-xl mx-auto py-0 md:py-2">
          
          {/* Main Reel Card container */}
          <div
            className="w-full h-[100dvh] md:h-[calc(100vh-4.5rem)] md:max-h-[820px] md:rounded-3xl bg-neutral-950 relative overflow-hidden flex flex-col shadow-2xl md:border md:border-neutral-800"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mobile Back Button */}
            <button
              onClick={() => setLocation('/')}
              className="md:hidden absolute top-4 left-4 z-30 h-10 w-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white active:scale-95 transition-transform border border-white/20"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Mute/Unmute Toggle */}
            <button
              onClick={toggleMute}
              className="absolute top-4 left-16 md:left-4 z-30 h-10 w-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 active:scale-95 transition-all border border-white/20"
              title={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted ? <VolumeX className="h-5 w-5 text-red-400" /> : <Volume2 className="h-5 w-5 text-emerald-400" />}
            </button>

            {/* Clean Video Element with Dedicated Key for absolute user/video synchronization */}
            <div
              className="flex-1 w-full h-full relative flex items-center justify-center bg-black cursor-pointer"
              onClick={togglePlayPause}
            >
              {/* Individual key ensures zero state reuse between different reels */}
              <video
                key={currentReel.id}
                ref={activeVideoRef}
                src={currentReel.videoUrl}
                poster={currentReel.thumbnailUrl || undefined}
                className="w-full h-full object-cover md:object-contain"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onWaiting={() => setIsVideoLoading(true)}
                onPlaying={() => {
                  setIsVideoLoading(false);
                  setIsPlaying(true);
                }}
                onLoadedData={() => {
                  setIsVideoLoading(false);
                  activeVideoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
                }}
              />

              {/* Loading buffer spinner */}
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-10">
                  <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                </div>
              )}

              {/* Play / Pause tap indicator */}
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                  >
                    <div className="bg-black/60 backdrop-blur-md rounded-full p-5 shadow-2xl border border-white/20">
                      {isPlaying ? (
                        <Pause className="h-10 w-10 text-white fill-white" />
                      ) : (
                        <Play className="h-10 w-10 text-white fill-white translate-x-0.5" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom gradient overlay for info readability */}
              <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

              {/* Video Info Overlay (Bottom Left) */}
              <div className="absolute bottom-6 left-4 right-20 z-20 pointer-events-none">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-white mb-2 shadow-sm">
                  #{currentReel.category}
                </div>
                
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-md line-clamp-2">
                  {currentReel.title}
                </h2>
                
                {currentReel.description && (
                  <p className="text-xs sm:text-sm text-neutral-200 mt-1 line-clamp-2 drop-shadow leading-relaxed">
                    {currentReel.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2.5 text-xs text-neutral-300">
                  <div className="flex items-center gap-1.5 font-semibold text-white bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{currentReel.author?.name || "Comunidad"}</span>
                  </div>
                  <span className="bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-neutral-300 font-medium">
                    👁️ {currentReel.viewCount || 0} vistas
                  </span>
                </div>
              </div>

              {/* Right Floating Actions (TikTok/Instagram style) */}
              {!showComments && (
                <div
                  className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Like Button */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => likeReelMutation.mutate()}
                    className="flex flex-col items-center gap-1 group"
                    title="Me gusta"
                  >
                    <div className={`h-12 w-12 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg transition-all ${
                      reactions?.userReaction === 'like' 
                        ? "bg-red-500/20 text-red-500 border border-red-500/40" 
                        : "bg-black/50 text-white hover:bg-black/70 border border-white/20"
                    }`}>
                      <Heart className={`h-6 w-6 ${reactions?.userReaction === 'like' ? "fill-red-500" : ""}`} />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow">
                      {reactions?.counts?.like || 0}
                    </span>
                  </motion.button>

                  {/* Comments Button */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setShowComments(true)}
                    className="flex flex-col items-center gap-1 group"
                    title="Ver comentarios"
                  >
                    <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all border border-white/20 shadow-lg">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow">
                      {comments?.length ?? currentReel.commentsCount ?? 0}
                    </span>
                  </motion.button>

                  {/* Share Button */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={handleShareReel}
                    className="flex flex-col items-center gap-1 group"
                    title="Compartir enlace específico"
                  >
                    <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all border border-white/20 shadow-lg">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow">
                      Compartir
                    </span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Desktop Navigation Arrows on the right side */}
            <div className="hidden md:flex flex-col gap-2 absolute right-[-4rem] top-1/2 -translate-y-1/2 z-30">
              <button
                onClick={prevReel}
                disabled={currentReelIndex === 0}
                className="h-11 w-11 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
                title="Video anterior (Flecha Arriba)"
              >
                <ChevronUp className="h-6 w-6" />
              </button>
              <button
                onClick={nextReel}
                disabled={currentReelIndex === reels.length - 1}
                className="h-11 w-11 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
                title="Siguiente video (Flecha Abajo)"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>

            {/* Comments Overlay Drawer */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                  className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl flex flex-col z-30 md:rounded-3xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Comments Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">Comentarios</h3>
                      <span className="text-xs font-bold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
                        {comments.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowComments(false)}
                      className="h-8 w-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {comments.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                        <span className="text-4xl mb-2">💬</span>
                        <p className="font-semibold text-sm text-neutral-200">Aún no hay comentarios</p>
                        <p className="text-xs text-neutral-500 mt-1">¡Sé el primero en compartir tu opinión!</p>
                      </div>
                    ) : (
                      comments.map((comment: any) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 items-start bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800/80"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                            {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-xs text-white truncate">
                                {comment.author?.name || "Usuario"}
                              </p>
                              <span className="text-[10px] text-neutral-500 shrink-0">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-200 mt-1 break-words leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Comment Input Box */}
                  {user ? (
                    <div className="p-3 bg-neutral-900 border-t border-neutral-800 relative">
                      <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                        <div className="flex-1 relative flex items-center bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700 focus-within:border-primary transition-colors">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit(e);
                              }
                            }}
                            placeholder="Escribe un comentario..."
                            className="flex-1 bg-transparent text-white text-xs sm:text-sm outline-none placeholder:text-neutral-500 pr-2"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(prev => !prev)}
                            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                            title="Insertar emoji"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                        </div>

                        <Button
                          type="submit"
                          disabled={commentReelMutation.isPending || !newComment.trim()}
                          size="sm"
                          className="rounded-full h-9 w-9 p-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                          title="Enviar comentario"
                        >
                          {commentReelMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>

                      {/* Emoji Picker Popup */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-16 right-4 z-50 shadow-2xl">
                          <EmojiPicker
                            onEmojiClick={(emojiData) => setNewComment(prev => prev + emojiData.emoji)}
                            width={300}
                            height={340}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-center">
                      <p className="text-xs text-neutral-400">Inicia sesión para dejar un comentario</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <span className="text-5xl mb-4">🎬</span>
          <h3 className="text-xl font-bold text-white mb-2">Aún no hay videos disponibles</h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6">
            Sé el primero en compartir un EcoReel sobre tus iniciativas ecológicas con la comunidad.
          </p>
          {user && (
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-full gap-2 font-bold px-6 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Crear el primer EcoReel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}