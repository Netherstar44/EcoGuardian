import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Share2, Upload, Pause, Play, Volume2,
  VolumeX, ChevronUp, ChevronDown, Smile, Loader2, Plus, ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { shareContent } from "@/lib/share";

const CATEGORIES = ["limpieza", "reciclaje", "compostaje", "energía", "agua", "biodiversidad", "otro"];

export default function Reels() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newReel, setNewReel] = useState({
    title: "",
    description: "",
    category: "limpieza",
    videoBase64: "",
    thumbnailBase64: "",
  });
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState<boolean[]>([]);
  const [showControls, setShowControls] = useState(false);
  const touchStartY = useRef<number>(0);
  const showControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ["/api/reels"],
    queryFn: () => apiRequest("GET", "/api/reels").then(r => r.json()),
  });

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/reels/${reels[currentReelIndex]?.id}/comments`],
    queryFn: () => apiRequest("GET", `/api/reels/${reels[currentReelIndex]?.id}/comments`).then(r => r.json()),
    enabled: !!reels[currentReelIndex]?.id && showComments,
  });

  const { data: reactions } = useQuery({
    queryKey: [`/api/reels/${reels[currentReelIndex]?.id}/reactions`],
    queryFn: () => apiRequest("GET", `/api/reels/${reels[currentReelIndex]?.id}/reactions`).then(r => r.json()),
    enabled: !!reels[currentReelIndex]?.id,
    refetchInterval: 2000,
  });

  const createReelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reels", newReel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reels"] });
      toast({ title: "✅ Video publicado", description: "Tu video está en línea" });
      setNewReel({
        title: "",
        description: "",
        category: "limpieza",
        videoBase64: "",
        thumbnailBase64: "",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error al publicar",
        description: err?.message || "No se pudo subir el video. Verifica el tamaño del archivo.",
      });
    },
  });

  const likeReelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/reels/${reels[currentReelIndex].id}/reactions`, {
        type: "like",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reels/${reels[currentReelIndex].id}/reactions`] });
    },
  });

  const commentReelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/reels/${reels[currentReelIndex].id}/comments`, {
        content: newComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reels/${reels[currentReelIndex].id}/comments`] });
      toast({ title: "Comentario publicado" });
      setNewComment("");
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>, field: "videoBase64" | "thumbnailBase64") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = field === "videoBase64";
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB video, 5MB image
    const maxLabel = isVideo ? "50MB" : "5MB";

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: `El archivo supera el límite de ${maxLabel}. Intenta comprimir el video.`,
      });
      e.target.value = ""; // reset input
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

  const currentReel = reels[currentReelIndex];

  const togglePlayWithControls = () => {
    const video = videoRefs.current[currentReelIndex];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(prev => { const s = [...prev]; s[currentReelIndex] = true; return s; });
      } else {
        video.pause();
        setIsPlaying(prev => { const s = [...prev]; s[currentReelIndex] = false; return s; });
      }
    }
    // Show controls briefly on tap (mobile-friendly)
    setShowControls(true);
    if (showControlsTimer.current) clearTimeout(showControlsTimer.current);
    showControlsTimer.current = setTimeout(() => setShowControls(false), 1500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) nextReel();
    else if (diff < -50) prevReel();
  };

  const nextReel = () => {
    if (currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(currentReelIndex + 1);
      setShowComments(false);
    }
  };

  const prevReel = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(currentReelIndex - 1);
      setShowComments(false);
    }
  };

  const handleShareReel = async () => {
    if (!currentReel) return;
    const url = `${window.location.origin}/reels`;
    const result = await shareContent({
      title: currentReel.title || "EcoReel",
      text: `¡Mira este Reel ecológico de ${currentReel.author?.name || 'la comunidad'} en EcoGuardián!`,
      url
    }).catch(() => null);

    if (result === 'clipboard') {
      toast({ title: "Enlace copiado", description: "El enlace se ha copiado al portapapeles." });
    }
  };

  if (isLoading && reels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Cargando videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black text-white flex flex-col fixed inset-0 z-[100] md:static md:h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col relative h-full">
        {currentReel ? (
          <div
            className="flex-1 flex flex-col relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Back button (Mobile only) */}
            <button 
              onClick={() => setLocation('/')}
              className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform md:hidden"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            {/* Floating upload button */}
            {user && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                  <Plus className="h-6 w-6 text-white" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crea tu EcoReel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="reel-title">Título</Label>
                    <Input
                      id="reel-title"
                      value={newReel.title}
                      onChange={(e) => setNewReel(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título de tu video"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reel-category">Categoría</Label>
                    <select
                      id="reel-category"
                      value={newReel.category}
                      onChange={(e) => setNewReel(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reel-description">Descripción</Label>
                    <Textarea
                      id="reel-description"
                      value={newReel.description}
                      onChange={(e) => setNewReel(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe tu video..."
                      className="bg-background border-border min-h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reel-video">Video <span className="text-muted-foreground text-xs">(máx. 50MB)</span></Label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${newReel.videoBase64 ? "border-green-400 bg-green-50/50" : "border-border"}`}>
                      {newReel.videoBase64 ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <span className="text-xl">✅</span>
                          <span className="text-sm font-medium">Video cargado correctamente</span>
                          <button type="button" onClick={() => setNewReel(p => ({ ...p, videoBase64: "" }))} className="ml-2 text-xs text-red-500 underline">Quitar</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Selecciona un video de tu galería</p>
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

                  <div className="space-y-2">
                    <Label htmlFor="reel-thumbnail">Portada / Thumbnail <span className="text-muted-foreground text-xs">(opcional, máx. 5MB)</span></Label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${newReel.thumbnailBase64 ? "border-green-400 bg-green-50/50" : "border-border"}`}>
                      {newReel.thumbnailBase64 ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <img src={newReel.thumbnailBase64} alt="preview" className="h-16 w-16 object-cover rounded-lg" />
                          <span className="text-sm font-medium">Portada lista</span>
                          <button type="button" onClick={() => setNewReel(p => ({ ...p, thumbnailBase64: "" }))} className="ml-2 text-xs text-red-500 underline">Quitar</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Imagen de portada (opcional)</p>
                          <Input
                            id="reel-thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleVideoSelect(e, "thumbnailBase64")}
                            className="bg-background border-border"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => createReelMutation.mutate()}
                    disabled={createReelMutation.isPending || !newReel.title || !newReel.videoBase64}
                    className="w-full"
                  >
                    {createReelMutation.isPending ? "Subiendo..." : "Publicar Video"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

            {/* Video Section — full screen on mobile */}
            <div className="flex-1 bg-black relative">
              <video
                ref={(el) => { videoRefs.current[currentReelIndex] = el; }}
                src={currentReel.videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                onClick={togglePlayWithControls}
              />

              {/* Play/Pause indicator — tap-triggered, not hover */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
                style={{ opacity: showControls ? 1 : 0 }}
              >
                <div className="bg-black/40 rounded-full p-4">
                  {isPlaying[currentReelIndex] === false ? (
                    <Play className="h-14 w-14 text-white" />
                  ) : (
                    <Pause className="h-14 w-14 text-white" />
                  )}
                </div>
              </div>

              {/* Swipe hint arrows — top/bottom, not left/right */}
              {currentReelIndex > 0 && (
                <button
                  onClick={prevReel}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 active:bg-white/40 rounded-full p-2 transition-colors z-10"
                >
                  <ChevronUp className="h-5 w-5 text-white" />
                </button>
              )}
              {currentReelIndex < reels.length - 1 && (
                <button
                  onClick={nextReel}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/20 active:bg-white/40 rounded-full p-2 transition-colors z-10"
                >
                  <ChevronDown className="h-5 w-5 text-white" />
                </button>
              )}

              {/* Video Info — bottom left overlay, transparent with text shadow */}
              <div className="absolute bottom-16 left-0 right-16 p-4 pr-2 pointer-events-none">
                <p className="text-xs font-semibold text-blue-400 mb-1 drop-shadow-md">{currentReel.category}</p>
                <h2 className="text-base font-bold text-white mb-1 leading-tight drop-shadow-md">{currentReel.title}</h2>
                <p className="text-xs text-gray-200 line-clamp-2 drop-shadow-md">{currentReel.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-300 drop-shadow-md">
                  <span className="font-semibold text-white mr-2">{currentReel.author?.name}</span>
                  <span>👁️ {currentReel.viewCount || 0}</span>
                </div>
              </div>

              {/* Actions — overlay on right side (TikTok/Instagram style) */}
              {!showComments && (
                <div className="absolute right-2 bottom-32 flex flex-col items-center gap-5 z-10">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => likeReelMutation.mutate()}
                    className="flex flex-col items-center gap-1"
                  >
                    <Heart className={`h-7 w-7 drop-shadow ${reactions?.userReaction === 'like' ? "fill-red-500 text-red-500" : "text-white"}`} />
                    <span className="text-xs font-bold text-white drop-shadow">{reactions?.counts?.like || 0}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowComments(true)}
                    className="flex flex-col items-center gap-1"
                  >
                    <MessageCircle className="h-7 w-7 text-white drop-shadow" />
                    <span className="text-xs font-bold text-white drop-shadow">{comments?.length || 0}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShareReel}
                    className="flex flex-col items-center gap-1"
                  >
                    <Share2 className="h-7 w-7 text-white drop-shadow" />
                    <span className="text-xs font-bold text-white drop-shadow">Compartir</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Comments panel — full screen bottom sheet on mobile */}
            <AnimatePresence>
              {showComments && (
              <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="absolute inset-0 bg-gray-900/95 flex flex-col z-20"
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h3 className="font-bold">Comentarios</h3>
                    <button
                      onClick={() => setShowComments(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.map((comment: any) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <p className="font-semibold text-sm text-white">{comment.author?.name}</p>
                        <p className="text-sm text-gray-300">{comment.content}</p>
                      </motion.div>
                    ))}
                  </div>

                  {user && (
                    <div className="p-4 border-t border-gray-800 space-y-2">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Escribe un comentario..."
                          className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="ml-2 text-gray-400 hover:text-white"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>

                      {showEmojiPicker && (
                        <div className="absolute bottom-20 right-0 z-50">
                          <EmojiPicker
                            onEmojiClick={(e) => setNewComment(prev => prev + e.emoji)}
                            width="min(320px, 90vw)"
                            height={350}
                          />
                        </div>
                      )}

                      <Button
                        onClick={() => commentReelMutation.mutate()}
                        disabled={commentReelMutation.isPending || !newComment.trim()}
                        className="w-full"
                        size="sm"
                      >
                        Enviar
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-gray-300 mb-4">No hay videos disponibles</p>
              {user && (
                <p className="text-sm text-gray-400">¡Sé el primero en compartir un EcoReel!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}