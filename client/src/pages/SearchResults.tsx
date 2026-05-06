import { shareContent } from "@/lib/share";
import { apiBase } from "@/lib/queryClient";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, UserPlus, FileText, Filter, X, 
  MessageCircle, Share2, Search, MapPin, Leaf,
  ChevronLeft, ChevronRight, Smile, Send, Loader2,
  Image as ImageIcon, Link2, Check, Facebook, Twitter,
  Pencil, MoreHorizontal, Trash2, Plus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { api, buildUrl } from "@shared/routes";
import { createPortal } from "react-dom";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// â”€â”€â”€ Reaction facial animation styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const reactionAnimStyles = `
  @keyframes rxn-like-thumb { 0%,100%{transform:rotate(0deg) translateY(0)} 25%{transform:rotate(-18deg) translateY(-1px)} 55%{transform:rotate(12deg) translateY(1px)} 75%{transform:rotate(-8deg) translateY(0)} }
  .rxn-hover-like:hover svg { animation: rxn-like-thumb 0.7s cubic-bezier(.36,.07,.19,.97) infinite; transform-origin: bottom center; }
  @keyframes rxn-love-beat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.22)} 30%{transform:scale(1)} 45%{transform:scale(1.15)} 60%{transform:scale(1)} }
  .rxn-hover-love:hover svg { animation: rxn-love-beat 0.75s ease infinite; transform-origin: center; }
  @keyframes rxn-care-eye-l { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-1.5px)} }
  @keyframes rxn-care-eye-r { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-1.5px)} }
  @keyframes rxn-care-heart  { 0%,100%{transform:scale(1) translateY(0)} 40%{transform:scale(1.18) translateY(-1px)} 70%{transform:scale(0.92) translateY(0.5px)} }
  @keyframes rxn-care-arm-l  { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(-12deg)} 70%{transform:rotate(5deg)} }
  @keyframes rxn-care-arm-r  { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(12deg)} 70%{transform:rotate(-5deg)} }
  @keyframes rxn-care-smile  { 0%,100%{transform:scaleX(1)} 40%{transform:scaleX(1.1)} }
  .rxn-hover-care:hover .care-eye-l { animation: rxn-care-eye-l 1.1s ease infinite; }
  .rxn-hover-care:hover .care-eye-r { animation: rxn-care-eye-r 1.1s ease infinite 0.05s; }
  .rxn-hover-care:hover .care-heart { animation: rxn-care-heart 0.9s ease infinite; transform-origin: 18px 8px; }
  .rxn-hover-care:hover .care-arm-l { animation: rxn-care-arm-l 1.1s ease infinite; transform-origin: 10px 20px; }
  .rxn-hover-care:hover .care-arm-r { animation: rxn-care-arm-r 1.1s ease infinite; transform-origin: 26px 20px; }
  .rxn-hover-care:hover .care-smile { animation: rxn-care-smile 1.1s ease infinite; transform-origin: 18px 27px; }
  @keyframes rxn-haha-head   { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(9deg)} 60%{transform:rotate(-6deg)} 80%{transform:rotate(5deg)} }
  @keyframes rxn-haha-eye-l  { 0%,100%{transform:scaleY(1) scaleX(1)} 30%{transform:scaleY(0.3) scaleX(1.2)} 60%{transform:scaleY(0.5) scaleX(1.1)} }
  @keyframes rxn-haha-eye-r  { 0%,100%{transform:scaleY(1) scaleX(1)} 25%{transform:scaleY(0.3) scaleX(1.2)} 55%{transform:scaleY(0.5) scaleX(1.1)} }
  @keyframes rxn-haha-mouth  { 0%,100%{transform:scaleY(1) translateY(0)} 30%{transform:scaleY(1.15) translateY(1px)} 60%{transform:scaleY(0.9) translateY(-0.5px)} }
  @keyframes rxn-haha-tear-l { 0%{transform:translateY(0) scaleY(0.3);opacity:0} 20%{opacity:1} 60%{transform:translateY(6px) scaleY(1.4);opacity:0.9} 100%{transform:translateY(11px) scaleY(0.4);opacity:0} }
  @keyframes rxn-haha-tear-r { 0%{transform:translateY(0) scaleY(0.3);opacity:0} 30%{opacity:1} 70%{transform:translateY(6px) scaleY(1.4);opacity:0.9} 100%{transform:translateY(11px) scaleY(0.4);opacity:0} }
  @keyframes rxn-haha-cheek  { 0%,100%{opacity:0.4} 30%{opacity:0.7} 60%{opacity:0.5} }
  .rxn-hover-haha:hover .haha-head  { animation: rxn-haha-head 0.55s cubic-bezier(.36,.07,.19,.97) infinite; transform-origin: 18px 18px; }
  .rxn-hover-haha:hover .haha-eye-l { animation: rxn-haha-eye-l 0.55s ease infinite; transform-origin: 12px 15px; }
  .rxn-hover-haha:hover .haha-eye-r { animation: rxn-haha-eye-r 0.55s ease infinite 0.08s; transform-origin: 24px 15px; }
  .rxn-hover-haha:hover .haha-mouth { animation: rxn-haha-mouth 0.55s ease infinite; transform-origin: 18px 24px; }
  .rxn-hover-haha:hover .haha-tear-l { animation: rxn-haha-tear-l 0.9s ease infinite; transform-origin: 9px 17px; }
  .rxn-hover-haha:hover .haha-tear-r { animation: rxn-haha-tear-r 0.9s ease infinite 0.2s; transform-origin: 27px 17px; }
  .rxn-hover-haha:hover .haha-cheek  { animation: rxn-haha-cheek 0.55s ease infinite; }
  @keyframes rxn-wow-brow-l  { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-2.5px)} 70%{transform:translateY(-1.5px)} }
  @keyframes rxn-wow-brow-r  { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-2.5px)} 70%{transform:translateY(-1.5px)} }
  @keyframes rxn-wow-eye-l   { 0%,100%{transform:scale(1)} 40%{transform:scale(1.25)} }
  @keyframes rxn-wow-eye-r   { 0%,100%{transform:scale(1)} 45%{transform:scale(1.25)} }
  @keyframes rxn-wow-mouth   { 0%,100%{transform:scaleY(1)} 40%{transform:scaleY(1.4)} 70%{transform:scaleY(1.2)} }
  @keyframes rxn-wow-pupil-l { 0%,100%{transform:translate(0,0)} 50%{transform:translate(0.5px,-0.8px)} }
  @keyframes rxn-wow-pupil-r { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-0.5px,-0.8px)} }
  @keyframes rxn-wow-sweat   { 0%,60%{transform:translateY(0);opacity:0} 65%{opacity:1} 100%{transform:translateY(5px);opacity:0} }
  .rxn-hover-wow:hover .wow-brow-l { animation: rxn-wow-brow-l 1.2s ease infinite; }
  .rxn-hover-wow:hover .wow-brow-r { animation: rxn-wow-brow-r 1.2s ease infinite 0.06s; }
  .rxn-hover-wow:hover .wow-eye-l  { animation: rxn-wow-eye-l 1.2s ease infinite; transform-origin: 12.5px 17px; }
  .rxn-hover-wow:hover .wow-eye-r  { animation: rxn-wow-eye-r 1.2s ease infinite 0.06s; transform-origin: 23.5px 17px; }
  .rxn-hover-wow:hover .wow-mouth  { animation: rxn-wow-mouth 1.2s ease infinite; transform-origin: 18px 26px; }
  .rxn-hover-wow:hover .wow-pupil-l{ animation: rxn-wow-pupil-l 1.2s ease infinite; }
  .rxn-hover-wow:hover .wow-pupil-r{ animation: rxn-wow-pupil-r 1.2s ease infinite; }
  .rxn-hover-wow:hover .wow-sweat  { animation: rxn-wow-sweat 1.8s ease infinite 0.6s; }
  @keyframes rxn-sad-brow-l  { 0%,100%{transform:rotate(0deg) translateY(0)} 50%{transform:rotate(12deg) translateY(1.5px)} }
  @keyframes rxn-sad-brow-r  { 0%,100%{transform:rotate(0deg) translateY(0)} 50%{transform:rotate(-12deg) translateY(1.5px)} }
  @keyframes rxn-sad-eye-l   { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.75)} }
  @keyframes rxn-sad-eye-r   { 0%,100%{transform:scaleY(1)} 55%{transform:scaleY(0.75)} }
  @keyframes rxn-sad-tear-l  { 0%,40%{transform:translateY(0);opacity:0} 45%{opacity:0.9} 90%{transform:translateY(8px);opacity:0.4} 100%{transform:translateY(10px);opacity:0} }
  @keyframes rxn-sad-tear-r  { 0%,55%{transform:translateY(0);opacity:0} 60%{opacity:0.9} 100%{transform:translateY(8px);opacity:0} }
  @keyframes rxn-sad-face    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(1px)} }
  .rxn-hover-sad:hover .sad-brow-l { animation: rxn-sad-brow-l 1.6s ease infinite; transform-origin: 8px 12px; }
  .rxn-hover-sad:hover .sad-brow-r { animation: rxn-sad-brow-r 1.6s ease infinite 0.1s; transform-origin: 28px 12px; }
  .rxn-hover-sad:hover .sad-eye-l  { animation: rxn-sad-eye-l 1.6s ease infinite; transform-origin: 12px 17.5px; }
  .rxn-hover-sad:hover .sad-eye-r  { animation: rxn-sad-eye-r 1.6s ease infinite 0.1s; transform-origin: 24px 17.5px; }
  .rxn-hover-sad:hover .sad-tear-l { animation: rxn-sad-tear-l 2s ease infinite; transform-origin: 12px 19px; }
  .rxn-hover-sad:hover .sad-tear-r { animation: rxn-sad-tear-r 2s ease infinite 0.5s; transform-origin: 24px 19px; }
  .rxn-hover-sad:hover .sad-face   { animation: rxn-sad-face 1.6s ease infinite; }
  @keyframes rxn-angry-face  { 0%,100%{transform:scale(1)} 30%{transform:scale(1.04)} 60%{transform:scale(0.98)} }
  @keyframes rxn-angry-brow-l{ 0%,100%{transform:rotate(0deg) translateY(0)} 40%{transform:rotate(20deg) translateY(2px)} 70%{transform:rotate(15deg) translateY(1.5px)} }
  @keyframes rxn-angry-brow-r{ 0%,100%{transform:rotate(0deg) translateY(0)} 40%{transform:rotate(-20deg) translateY(2px)} 70%{transform:rotate(-15deg) translateY(1.5px)} }
  @keyframes rxn-angry-eye-l { 0%,100%{transform:scaleY(1)} 35%{transform:scaleY(0.5)} 65%{transform:scaleY(0.65)} }
  @keyframes rxn-angry-eye-r { 0%,100%{transform:scaleY(1)} 40%{transform:scaleY(0.5)} 70%{transform:scaleY(0.65)} }
  @keyframes rxn-angry-vein  { 0%,100%{opacity:0;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes rxn-angry-steam-l{ 0%{transform:translateY(0) scaleX(1);opacity:0} 20%{opacity:0.8} 100%{transform:translateY(-8px) scaleX(0.5);opacity:0} }
  @keyframes rxn-angry-steam-r{ 0%{transform:translateY(0) scaleX(1);opacity:0} 30%{opacity:0.8} 100%{transform:translateY(-8px) scaleX(0.5);opacity:0} }
  @keyframes rxn-angry-mouth { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(1.08)} }
  @keyframes rxn-angry-glow  { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
  .rxn-hover-angry:hover .angry-face  { animation: rxn-angry-face 0.5s ease infinite; transform-origin: 18px 19px; }
  .rxn-hover-angry:hover .angry-brow-l{ animation: rxn-angry-brow-l 0.5s ease infinite; transform-origin: 11px 14px; }
  .rxn-hover-angry:hover .angry-brow-r{ animation: rxn-angry-brow-r 0.5s ease infinite 0.04s; transform-origin: 25px 14px; }
  .rxn-hover-angry:hover .angry-eye-l { animation: rxn-angry-eye-l 0.5s ease infinite; transform-origin: 12px 18px; }
  .rxn-hover-angry:hover .angry-eye-r { animation: rxn-angry-eye-r 0.5s ease infinite 0.04s; transform-origin: 24px 18px; }
  .rxn-hover-angry:hover .angry-vein  { animation: rxn-angry-vein 0.9s ease infinite; }
  .rxn-hover-angry:hover .angry-steam-l{ animation: rxn-angry-steam-l 1s ease infinite 0.1s; }
  .rxn-hover-angry:hover .angry-steam-r{ animation: rxn-angry-steam-r 1s ease infinite 0.35s; }
  .rxn-hover-angry:hover .angry-mouth { animation: rxn-angry-mouth 0.5s ease infinite; transform-origin: 18px 25px; }
  .rxn-hover-angry:hover .angry-glow  { animation: rxn-angry-glow 0.5s ease infinite; }
`;

const reactions = [
  { id: "like",  label: "Me gusta",      color: "#1877F2" },
  { id: "love",  label: "Me encanta",    color: "#F33E58" },
  { id: "care",  label: "Me importa",    color: "#F7B125" },
  { id: "haha",  label: "Me divierte",   color: "#F7B125" },
  { id: "wow",   label: "Me asombra",    color: "#F59E0B" },
  { id: "sad",   label: "Me entristece", color: "#6B9FD4" },
  { id: "angry", label: "Me enoja",      color: "#E9710F" },
];

export default function SearchResults() {
  const [location, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState("all");

  const queryClient = useQueryClient();

  // Extract query from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    setSearchInput(q);
  }, []);

  const debouncedQuery = useDebounce(searchInput, 500);

  // Update query and URL when debounced input changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLocation(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    }
  }, [debouncedQuery, setLocation]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: () => apiRequest("GET", `/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSearch = () => {
    if (searchInput.trim().length >= 2) {
      setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const filteredUsers = filterType === "all" || filterType === "people" ? results?.users || [] : [];
  const filteredPosts = filterType === "all" || filterType === "posts" ? results?.posts || [] : [];

  return (
    <div className="search-results-page w-full">
      <style>{reactionAnimStyles}</style>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resultados de búsqueda</h1>
          <p className="text-muted-foreground">
            {debouncedQuery && `Buscando: "${debouncedQuery}"`}
          </p>
        </div>

        {/* Search input */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar en EcoGuardián..."
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <Button onClick={handleSearch} disabled={searchInput.trim().length < 2}>
            Buscar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 pb-4 border-b border-border overflow-x-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 whitespace-nowrap rounded-full transition-colors ${
              filterType === "all"
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <Filter className="h-4 w-4 inline mr-2" />
            Todo
          </button>
          <button
            onClick={() => setFilterType("people")}
            className={`px-4 py-2 whitespace-nowrap rounded-full transition-colors ${
              filterType === "people"
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Personas
          </button>
          <button
            onClick={() => setFilterType("posts")}
            className={`px-4 py-2 whitespace-nowrap rounded-full transition-colors ${
              filterType === "posts"
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Publicaciones
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full" />
            </div>
          </div>
        ) : debouncedQuery.length < 2 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg">Escribe para buscar</p>
          </div>
        ) : filteredUsers.length === 0 && filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <X className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg">No se encontraron resultados</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Personas */}
            {filteredUsers.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">
                  <Users className="h-5 w-5 inline mr-2" />
                  Personas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user: any) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-bold text-lg">{user.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              {user.city || user.country || "Sin ubicación"}
                            </p>
                            <p className="text-xs text-yellow-600 font-bold mb-4">
                              {user.points} 🌱 eco-puntos
                            </p>
                            <Button className="w-full">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Agregar a amigos
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Publicaciones */}
            {filteredPosts.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">
                  <FileText className="h-5 w-5 inline mr-2" />
                  Publicaciones
                </h2>
                <div className="space-y-4">
                  {filteredPosts.map((post: any) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {post.author?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <h3 className="font-semibold text-foreground">{post.author?.name}</h3>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(post.createdAt), "d 'de' MMMM", { locale: es })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                {post.category}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Leaf className="h-3 w-3" />
                                {post.author?.points} puntos
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const loc = post.content?.match(/\n\nðŸ“ (.+)$/);
                            const text = loc ? post.content.replace(/\n\nðŸ“ .+$/, '') : post.content;
                            return (
                              <>
                                <p className="whitespace-pre-wrap text-foreground/90 break-words overflow-hidden">{text}</p>
                                {loc && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-2.5 py-1 w-fit">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span>{loc[1]}</span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          <PostImageGallery imageUrl={post.imageUrl} />
                        </CardContent>
                        <CardFooter className="bg-muted/30 pt-2 pb-2 flex flex-col gap-0 overflow-visible">
                          <PostFooter post={post} />
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Image Gallery + Lightbox (Facebook-style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PostImageGallery({ imageUrl }: { imageUrl: string | null | undefined }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!imageUrl) return null;

  // Parse: may be JSON array of URLs or a single URL string
  let urls: string[] = [];
  try {
    const parsed = JSON.parse(imageUrl);
    urls = Array.isArray(parsed) ? parsed : [imageUrl];
  } catch {
    urls = [imageUrl];
  }

  const n = urls.length;

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx(i => (i === null ? 0 : (i - 1 + n) % n));
  const next = () => setLightboxIdx(i => (i === null ? 0 : (i + 1) % n));

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx]);

  // Grid layouts matching Facebook
  const gridClass =
    n === 1 ? "grid-cols-1" :
    n === 2 ? "grid-cols-2" :
    n === 3 ? "grid-cols-3" :
    "grid-cols-2";

  const visibleUrls = n > 4 ? urls.slice(0, 4) : urls;
  const hiddenCount = n > 4 ? n - 4 : 0;

  return (
    <>
      <div className={`mt-3 grid gap-0.5 rounded-xl overflow-hidden ${gridClass}`}>
        {visibleUrls.map((src, idx) => {
          const isLast = hiddenCount > 0 && idx === visibleUrls.length - 1;
          // Single image: natural aspect ratio, blurred background, max height
          if (n === 1) {
            return (
              <div
                key={idx}
                className="relative w-full bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ maxHeight: "min(420px, 85vw)", minHeight: 80 }}
                onClick={() => openLightbox(idx)}
              >
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${src})`, filter: "blur(20px) brightness(0.45)", transform: "scale(1.15)" }} />
                <img src={src} alt="" className="relative z-10 w-full object-contain" style={{ maxHeight: "min(420px, 85vw)", display: "block" }} />
              </div>
            );
          }
          // Multi-image: aspect-ratio tiles so they never stretch
          // On mobile (small screens) use taller ratio, on PC use shorter
          const aspectClass = n === 2 ? "aspect-[3/2] sm:aspect-[4/3]" : "aspect-square sm:aspect-[5/4]";
          return (
            <div
              key={idx}
              className={`relative cursor-pointer overflow-hidden bg-black group ${aspectClass}`}
              onClick={() => openLightbox(idx)}
            >
              <img src={src} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
              {isLast && hiddenCount > 0 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{hiddenCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox portal */}
      {lightboxIdx !== null && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {n > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
              {lightboxIdx + 1} / {n}
            </div>
          )}

          {/* Prev */}
          {n > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 text-white bg-white/10 hover:bg-white/25 rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Image */}
          <motion.img
            key={lightboxIdx}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            src={urls[lightboxIdx]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {n > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 text-white bg-white/10 hover:bg-white/25 rounded-full p-2 transition-colors"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Thumbnail strip for 3+ images */}
          {n > 2 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {urls.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                  className={`h-10 w-10 rounded-md overflow-hidden border-2 transition-all ${i === lightboxIdx ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>,
        document.body
      )}
    </>
  );
}

// â”€â”€â”€ Post Footer with reactions and comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PostFooter({ post }: { post: any }) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Reaction counts row */}
      <PostReactionCounts postId={post.id} onCommentsClick={() => setCommentsOpen(v => !v)} />

      {/* Action buttons row - Like | Comment | Share */}
      <div className="flex items-center border-t border-border/40 py-1 overflow-visible">
        <PostReactions postId={post.id} />
        <button
          onClick={() => setCommentsOpen(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Comentar</span>
        </button>
        <PostShare postId={post.id} />
      </div>

      {/* Comments section - below action buttons like Facebook */}
      <PostComments postId={post.id} open={commentsOpen} setOpen={setCommentsOpen} />
    </div>
  );
}

// â”€â”€â”€ Reaction counts summary row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PostReactionCounts({ postId, onCommentsClick }: { postId: number; onCommentsClick: () => void }) {
  const reactionsUrl = buildUrl(api.posts.reactions.get.path, { id: postId });
  const commentsUrl = buildUrl(api.posts.comments.list.path, { id: postId });

  const { data: reactData } = useQuery<{ counts: Record<string, number>; userReaction: string | null }>({
    queryKey: [reactionsUrl],
    queryFn: async () => {
      const res = await fetch(apiBase + reactionsUrl, { credentials: "include" });
      if (!res.ok) return { counts: {}, userReaction: null };
      return res.json();
    },
  });

  const { data: commentsData } = useQuery<any[]>({
    queryKey: [commentsUrl],
    queryFn: async () => {
      const res = await fetch(apiBase + commentsUrl, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const total = reactData ? Object.values(reactData.counts).reduce((a, b) => a + b, 0) : 0;
  const commentCount = commentsData?.length ?? 0;

  if (total === 0 && commentCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-1 py-1.5 text-xs text-muted-foreground">
      {total > 0 ? (
        <div className="flex items-center gap-1">
          {Object.entries(reactData?.counts || {})
            .filter(([, c]) => c > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type]) => {
              const r = reactions.find((r) => r.id === type);
              if (!r) return null;
              const Icon = ReactionIcons[r.id];
              return (
                <span key={type} className="leading-none flex items-center">
                  <Icon size={14} color={r.color} />
                </span>
              );
            })}
          <span className="ml-1">{total}</span>
        </div>
      ) : <div />}
      {commentCount > 0 && (
        <button onClick={onCommentsClick} className="hover:underline">
          {commentCount} comentario{commentCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

// â”€â”€â”€ Reactions (Facebook-style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PostReactions({ postId }: { postId: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [reactionPopupPos, setReactionPopupPos] = useState({ bottom: 0, left: 0 });
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reactionsUrl = buildUrl(api.posts.reactions.get.path, { id: postId });

  const { data } = useQuery<{ counts: Record<string, number>; userReaction: string | null }>({
    queryKey: [reactionsUrl],
    queryFn: async () => {
      const res = await fetch(apiBase + reactionsUrl, { credentials: "include" });
      if (!res.ok) return { counts: {}, userReaction: null };
      return res.json();
    },
  });

  const setReaction = useMutation({
    mutationFn: async (type: string) => {
      await apiRequest(
        api.posts.reactions.set.method,
        buildUrl(api.posts.reactions.set.path, { id: postId }),
        { type }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactionsUrl] });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async () => {
      await apiRequest(
        api.posts.reactions.remove.method,
        buildUrl(api.posts.reactions.remove.path, { id: postId })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactionsUrl] });
    },
  });

  const userReaction = data?.userReaction ?? null;
  const currentReaction = reactions.find((r) => r.id === userReaction);

  const handleMouseEnterBtn = () => {
    if (!user) return;
    leaveTimeout.current && clearTimeout(leaveTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (reactionBtnRef.current) {
        const rect = reactionBtnRef.current.getBoundingClientRect();
        const popupWidth = 340;
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 8));
        const bottom = window.innerHeight - rect.top + 8;
        setReactionPopupPos({ bottom, left });
      }
      setOpen(true);
    }, 400);
  };

  const handleMouseLeaveBtn = () => {
    hoverTimeout.current && clearTimeout(hoverTimeout.current);
    leaveTimeout.current = setTimeout(() => {
      setOpen(false);
      setHoveredReaction(null);
    }, 300);
  };

  const handleMouseEnterPopup = () => {
    leaveTimeout.current && clearTimeout(leaveTimeout.current);
  };

  const handleMouseLeavePopup = () => {
    leaveTimeout.current = setTimeout(() => {
      setOpen(false);
      setHoveredReaction(null);
    }, 300);
  };

  const handleClickBtn = () => {
    if (!user) return;
    hoverTimeout.current && clearTimeout(hoverTimeout.current);
    if (!open) {
      if (userReaction) removeReaction.mutate();
      else setReaction.mutate("like");
    }
  };

  const handleSelectReaction = (reactionId: string) => {
    setOpen(false);
    setHoveredReaction(null);
    setReaction.mutate(reactionId);
  };

  useEffect(() => () => {
    hoverTimeout.current && clearTimeout(hoverTimeout.current);
    leaveTimeout.current && clearTimeout(leaveTimeout.current);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <motion.button
          ref={reactionBtnRef}
          onMouseEnter={handleMouseEnterBtn}
          onMouseLeave={handleMouseLeaveBtn}
          onClick={handleClickBtn}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors select-none
            ${userReaction
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          style={userReaction && currentReaction ? { color: currentReaction.color } : {}}
        >
          <motion.span
            key={userReaction ?? "default"}
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="leading-none flex items-center"
          >
            {currentReaction
              ? (() => { const Icon = ReactionIcons[currentReaction.id]; return <Icon size={18} color={currentReaction.color} />; })()
              : <ReactionIcons.like size={18} color="currentColor" />
            }
          </motion.span>
          <span className="leading-none">
            {currentReaction ? currentReaction.label : "Reaccionar"}
          </span>
        </motion.button>

        {createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.75, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: 8 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                onMouseEnter={handleMouseEnterPopup}
                onMouseLeave={handleMouseLeavePopup}
                style={{
                  position: "fixed",
                  bottom: reactionPopupPos.bottom,
                  left: reactionPopupPos.left,
                  zIndex: 99999,
                  minWidth: "max-content",
                }}
                className="flex items-center gap-1 px-3 py-2 bg-background border border-border rounded-full shadow-2xl"
              >
                {reactions.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 500, damping: 22 }}
                    onHoverStart={() => setHoveredReaction(r.id)}
                    onHoverEnd={() => setHoveredReaction(null)}
                    onClick={() => handleSelectReaction(r.id)}
                    className={`relative flex flex-col items-center cursor-pointer rxn-hover-${r.id}`}
                  >
                    <motion.span
                      animate={hoveredReaction === r.id ? { scale: 1.5, y: -8 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="leading-none block flex items-center justify-center"
                      style={{ display: "flex" }}
                    >
                      {(() => { const Icon = ReactionIcons[r.id]; return <Icon size={26} color={r.color} />; })()}
                    </motion.span>
                    <AnimatePresence>
                      {hoveredReaction === r.id && (
                        <motion.span
                          initial={{ opacity: 0, y: 4, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground text-background shadow-md pointer-events-none"
                        >
                          {r.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
}

// --- Share (native cross-platform) ----------------------------------------
function PostShare({ postId }: { postId: number }) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = `${window.location.origin}/community?postId=${postId}`;
    const result = await shareContent({
      title: "EcoGuardian",
      text: "Mira esta publicacion de la comunidad en EcoGuardian!",
      url
    }).catch(() => null);

    if (result === 'clipboard') {
      toast({ title: "Enlace copiado!", description: "Listo para compartir." });
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleShare}
      className="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Share2 className="h-4 w-4" />
      <span className="hidden xs:inline sm:inline">Compartir</span>
    </motion.button>
  );
}

// â”€â”€â”€ Comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type CommentSort = "new" | "old" | "relevant";

function PostComments({ postId, open, setOpen }: { postId: number; open: boolean; setOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [commentSort, setCommentSort] = useState<CommentSort>("new");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [commentImageBase64, setCommentImageBase64] = useState<string | null>(null);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifSearched, setGifSearched] = useState(false);
  const [activeGifCategory, setActiveGifCategory] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const gifBtnRef = useRef<HTMLButtonElement>(null);
  const [emojiPos, setEmojiPos] = useState({ bottom: 0, left: 0 });
  const [gifPos, setGifPos] = useState({ bottom: 0, left: 0 });

  const commentsUrl = buildUrl(api.posts.comments.list.path, { id: postId });

  const { data, isLoading } = useQuery<any[]>({
    queryKey: [commentsUrl],
    queryFn: async () => {
      const res = await fetch(apiBase + commentsUrl, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, imageBase64 }: { content: string; imageBase64?: string | null }) => {
      await apiRequest(
        api.posts.comments.create.method,
        buildUrl(api.posts.comments.create.path, { id: postId }),
        { content, imageBase64: imageBase64 || undefined }
      );
    },
    onSuccess: () => {
      setValue("");
      setCommentImage(null);
      setCommentImageBase64(null);
      queryClient.invalidateQueries({ queryKey: [commentsUrl] });
    },
  });

  useEffect(() => {
    if (!showEmojiPicker && !showGifSearch) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const emojiPortal = document.querySelector("[data-emoji-portal]");
      const gifPortal = document.querySelector("[data-gif-portal]");
      if (emojiBtnRef.current?.contains(target) || gifBtnRef.current?.contains(target)) return;
      if (emojiPortal?.contains(target) || gifPortal?.contains(target)) return;
      setShowEmojiPicker(false);
      setShowGifSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker, showGifSearch]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setValue(prev => prev + emojiData.emoji);
    commentInputRef.current?.focus();
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCommentImage(result);
      setCommentImageBase64(result.split(",")[1] || result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (showGifSearch && gifs.length === 0 && !gifSearched && !activeGifCategory) {
      loadGifCategory("trending");
    }
  }, [showGifSearch]);

  const searchGifs = async (q: string) => {
    if (!q.trim()) return;
    setGifLoading(true);
    setGifSearched(true);
    try {
      const res = await fetch(`${apiBase}/api/gifs/search?q=${encodeURIComponent(q.trim())}`, { credentials: "include" });
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch { setGifs([]); }
    setGifLoading(false);
  };

  const loadGifCategory = async (cat: string) => {
    setActiveGifCategory(cat);
    setGifSearched(false);
    setGifLoading(true);
    try {
      const endpoint = cat === "trending" ? `/api/gifs/trending` : `/api/gifs/category?cat=${encodeURIComponent(cat)}`;
      const res = await fetch(apiBase + endpoint, { credentials: "include" });
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch { setGifs([]); }
    setGifLoading(false);
  };

  const handleSelectGif = (gifUrl: string) => {
    setCommentImage(gifUrl);
    setCommentImageBase64(gifUrl);
    setShowGifSearch(false);
    setGifs([]);
    setGifQuery("");
    setGifSearched(false);
    setActiveGifCategory(null);
  };

  const sortedComments = React.useMemo(() => {
    if (!data) return [];
    const copy = [...data];
    if (commentSort === "new") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (commentSort === "old") return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, commentSort]);

  const canSubmit = value.trim().length > 0 || !!commentImage;

  if (!open) return null;

  return (
    <div className="border-t border-border/40 pt-3 mt-1 space-y-3 px-1">
      {/* Sort options */}
      {(data?.length ?? 0) > 1 && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground mr-1">Ordenar:</span>
          {(["new","old","relevant"] as CommentSort[]).map(s => (
            <button key={s} onClick={() => setCommentSort(s)}
              className={`px-2 py-0.5 rounded-full transition-colors ${commentSort === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
              {s === "new" ? "Recientes" : s === "old" ? "Antiguos" : "Relevantes"}
            </button>
          ))}
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {sortedComments.map((comment: any) => (
            <div key={comment.id} className="flex gap-2 group">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {comment.author?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-2xl px-3 py-2">
                  <p className="font-semibold text-sm leading-tight">{comment.author?.name}</p>
                  {comment.content && <p className="text-sm mt-0.5 break-words">{comment.content}</p>}
                  {comment.imageUrl && (
                    <img src={comment.imageUrl} alt="" className="mt-2 rounded-xl max-h-48 object-cover" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 px-1">
                  {format(new Date(comment.createdAt), "d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment image preview */}
      {commentImage && (
        <div className="relative inline-block">
          <img src={commentImage} alt="" className="h-20 w-20 rounded-xl object-cover border border-border" />
          <button onClick={() => { setCommentImage(null); setCommentImageBase64(null); }}
            className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full p-0.5 hover:bg-foreground/80 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Emoji picker portal */}
      {showEmojiPicker && createPortal(
        <div data-emoji-portal style={{ position: "fixed", bottom: emojiPos.bottom, left: emojiPos.left, zIndex: 99999 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.AUTO} width={300} height={380} />
        </div>,
        document.body
      )}

      {/* Input row */}
      <div className="flex items-center bg-muted rounded-2xl px-3 py-2 gap-1 min-w-0">
        <textarea
          ref={commentInputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={user ? `Comentar como ${user.name}...` : "Inicia sesión para comentar"}
          disabled={!user}
          rows={1}
          className="flex-1 min-w-0 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground min-h-[20px] max-h-[80px] leading-5"
          style={{ overflow: "hidden" }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 80) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canSubmit) {
              e.preventDefault();
              addComment.mutate({ content: value.trim(), imageBase64: commentImageBase64 });
            }
          }}
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            ref={emojiBtnRef}
            type="button"
            onClick={() => {
              if (emojiBtnRef.current) {
                const r = emojiBtnRef.current.getBoundingClientRect();
                setEmojiPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, Math.min(r.left, window.innerWidth - 310)) });
              }
              setShowEmojiPicker(v => !v);
              setShowGifSearch(false);
            }}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            ref={gifBtnRef}
            type="button"
            onClick={() => {
              if (gifBtnRef.current) {
                const r = gifBtnRef.current.getBoundingClientRect();
                const panelW = Math.min(340, window.innerWidth - 16);
                const leftPos = Math.max(8, Math.min(r.right - panelW, window.innerWidth - panelW - 8));
                setGifPos({ bottom: window.innerHeight - r.top + 8, left: leftPos });
              }
              const opening = !showGifSearch;
              setShowGifSearch(v => !v);
              setShowEmojiPicker(false);
              if (opening && !activeGifCategory) loadGifCategory("trending");
            }}
            className="text-muted-foreground hover:text-primary transition-colors p-1 text-xs font-bold"
          >
            GIF
          </button>
          {canSubmit && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => addComment.mutate({ content: value.trim(), imageBase64: commentImageBase64 })}
              className="text-primary hover:text-primary/80 transition-colors p-1"
            >
              {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </motion.button>
          )}
        </div>
      </div>

      {/* GIF picker portal */}
      {showGifSearch && createPortal(
        <motion.div
          data-gif-portal
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: "fixed", bottom: gifPos.bottom, left: gifPos.left, zIndex: 99999, width: Math.min(340, window.innerWidth - 16) }}
          className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <input
                value={gifQuery}
                onChange={e => setGifQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchGifs(gifQuery)}
                placeholder="Buscar GIFs..."
                className="flex-1 bg-transparent text-sm outline-none"
                autoFocus
              />
              {gifQuery && (
                <button onClick={() => { setGifQuery(""); setGifSearched(false); loadGifCategory("trending"); }}>
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="h-48 overflow-y-auto px-2 pb-2">
            {gifLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : gifs.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {gifs.map((gif: any, i: number) => (
                  <button key={i} onClick={() => handleSelectGif(gif.url || gif.preview)}
                    className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity">
                    <img src={gif.preview || gif.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center py-8 text-xs text-muted-foreground">Selecciona una categoría o busca</div>
            )}
          </div>
          <div className="px-3 py-1.5 border-t border-border/30 flex justify-end">
            <span className="text-[9px] text-muted-foreground/50 tracking-wider">Powered by GIPHY</span>
          </div>
        </motion.div>,
        document.body
      )}

      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
    </div>
  );
}

// â”€â”€â”€ Custom SVG reaction icons (animated on hover) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ReactionIcons: Record<string, (props: { size?: number; color?: string }) => JSX.Element> = {
  like: ({ size = 22, color = "#1877F2" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 22V11M2 13v7a2 2 0 002 2h11.5a2 2 0 001.97-1.67l1.1-7A2 2 0 0016.6 11H13V6a3 3 0 00-3-3L7 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  love: ({ size = 22, color = "#F33E58" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 15 3 8.5a5 5 0 019-3 5 5 0 019 3C21 15 12 21 12 21z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  care: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="care-face-g" cx="42%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFE566"/><stop offset="100%" stopColor="#FFCC2E"/></radialGradient>
        <radialGradient id="care-heart-g" cx="35%" cy="30%" r="65%"><stop offset="0%" stopColor="#FF8FA3"/><stop offset="100%" stopColor="#E8335A"/></radialGradient>
      </defs>
      <circle cx="18" cy="20" r="13" fill="url(#care-face-g)"/>
      <ellipse cx="13" cy="14" rx="4" ry="2.5" fill="#fff" opacity="0.18"/>
      <ellipse cx="9" cy="23" rx="3.5" ry="2" fill="#FFB347" opacity="0.38"/>
      <ellipse cx="27" cy="23" rx="3.5" ry="2" fill="#FFB347" opacity="0.38"/>
      <g className="care-eye-l"><ellipse cx="13" cy="19.5" rx="2.5" ry="2.8" fill="#fff"/><ellipse cx="13" cy="18.8" rx="1.4" ry="1.6" fill="#3E2000"/><circle cx="13.7" cy="18.2" r="0.55" fill="#fff"/></g>
      <g className="care-eye-r"><ellipse cx="23" cy="19.5" rx="2.5" ry="2.8" fill="#fff"/><ellipse cx="23" cy="18.8" rx="1.4" ry="1.6" fill="#3E2000"/><circle cx="23.7" cy="18.2" r="0.55" fill="#fff"/></g>
      <g className="care-smile"><path d="M12 25.5 Q18 30 24 25.5" stroke="#C47A00" strokeWidth="1.8" strokeLinecap="round" fill="none"/></g>
      <g className="care-heart"><path d="M18 13 C18 13 12.5 9 12.5 5.8 a3.2 3.2 0 0 1 5.5-.5 a3.2 3.2 0 0 1 5.5.5 C23.5 9 18 13 18 13Z" fill="url(#care-heart-g)"/></g>
      <g className="care-arm-l"><path d="M8 17 C5.5 15 3.5 16.5 4 19 C4.5 21.5 7 22 9.5 20.5" stroke="#FFCC2E" strokeWidth="3.2" strokeLinecap="round" fill="none"/></g>
      <g className="care-arm-r"><path d="M28 17 C30.5 15 32.5 16.5 32 19 C31.5 21.5 29 22 26.5 20.5" stroke="#FFCC2E" strokeWidth="3.2" strokeLinecap="round" fill="none"/></g>
    </svg>
  ),
  haha: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="haha-face-g" cx="42%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFE566"/><stop offset="100%" stopColor="#FFC200"/></radialGradient>
        <radialGradient id="haha-mouth-g" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#A0522D"/><stop offset="100%" stopColor="#5C2A00"/></radialGradient>
      </defs>
      <g className="haha-head">
        <circle cx="18" cy="18" r="15" fill="url(#haha-face-g)"/>
        <ellipse cx="7.5" cy="21" rx="4" ry="2.2" fill="#FF9060" className="haha-cheek" opacity="0.42"/>
        <ellipse cx="28.5" cy="21" rx="4" ry="2.2" fill="#FF9060" className="haha-cheek" opacity="0.42"/>
        <g className="haha-eye-l"><ellipse cx="12" cy="15" rx="3.5" ry="2.5" fill="#fff" opacity="0.9"/><path d="M9 15.8 Q12 12.5 15 15.8" stroke="#3E2000" strokeWidth="2" strokeLinecap="round" fill="none"/></g>
        <g className="haha-eye-r"><ellipse cx="24" cy="15" rx="3.5" ry="2.5" fill="#fff" opacity="0.9"/><path d="M21 15.8 Q24 12.5 27 15.8" stroke="#3E2000" strokeWidth="2" strokeLinecap="round" fill="none"/></g>
        <g className="haha-tear-l"><path d="M9 18 Q8 16 9 14.5 Q10 16 9 18Z" fill="#7EC8F0"/></g>
        <g className="haha-tear-r"><path d="M27 18 Q26 16 27 14.5 Q28 16 27 18Z" fill="#7EC8F0"/></g>
        <g className="haha-mouth">
          <path d="M8 22 Q18 33 28 22" fill="url(#haha-mouth-g)"/>
          <rect x="11.5" y="22" width="13" height="4" rx="1.5" fill="#fff"/>
          <ellipse cx="18" cy="27.5" rx="4.5" ry="2.5" fill="#FF7BAC"/>
        </g>
      </g>
    </svg>
  ),
  wow: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wow-face-g" cx="42%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFE566"/><stop offset="100%" stopColor="#FFCC2E"/></radialGradient>
      </defs>
      <circle cx="18" cy="19" r="14" fill="url(#wow-face-g)"/>
      <g className="wow-brow-l"><path d="M9 12 Q13 9.5 15 11" stroke="#5C3800" strokeWidth="2" strokeLinecap="round" fill="none"/></g>
      <g className="wow-brow-r"><path d="M27 12 Q23 9.5 21 11" stroke="#5C3800" strokeWidth="2" strokeLinecap="round" fill="none"/></g>
      <g className="wow-eye-l"><ellipse cx="12.5" cy="17" rx="3.5" ry="3.5" fill="#fff"/><ellipse cx="12.5" cy="17.5" rx="2" ry="2" fill="#3E2000" className="wow-pupil-l"/></g>
      <g className="wow-eye-r"><ellipse cx="23.5" cy="17" rx="3.5" ry="3.5" fill="#fff"/><ellipse cx="23.5" cy="17.5" rx="2" ry="2" fill="#3E2000" className="wow-pupil-r"/></g>
      <g className="wow-mouth"><ellipse cx="18" cy="26" rx="4" ry="4.5" fill="#5C3800"/><ellipse cx="18" cy="26" rx="3" ry="3.5" fill="#3E1500"/></g>
    </svg>
  ),
  sad: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sad-face-g" cx="42%" cy="35%" r="60%"><stop offset="0%" stopColor="#B8D4F0"/><stop offset="100%" stopColor="#6B9FD4"/></radialGradient>
      </defs>
      <circle cx="18" cy="20" r="13" fill="url(#sad-face-g)"/>
      <g className="sad-brow-l"><path d="M9 13 Q13 15 15 13" stroke="#2A4A7F" strokeWidth="2" strokeLinecap="round" fill="none"/></g>
      <g className="sad-brow-r"><path d="M27 13 Q23 15 21 13" stroke="#2A4A7F" strokeWidth="2" strokeLinecap="round" fill="none"/></g>
      <g className="sad-eye-l"><ellipse cx="13" cy="19.5" rx="2.5" ry="2.8" fill="#fff"/><ellipse cx="13" cy="18.8" rx="1.4" ry="1.6" fill="#2A4A7F"/><circle cx="13.7" cy="18.2" r="0.55" fill="#fff"/></g>
      <g className="sad-eye-r"><ellipse cx="23" cy="19.5" rx="2.5" ry="2.8" fill="#fff"/><ellipse cx="23" cy="18.8" rx="1.4" ry="1.6" fill="#2A4A7F"/><circle cx="23.7" cy="18.2" r="0.55" fill="#fff"/></g>
      <g className="sad-face"><path d="M12 28 Q18 24 24 28" stroke="#2A4A7F" strokeWidth="1.8" strokeLinecap="round" fill="none"/></g>
      <g className="sad-tear-l"><path d="M12 22 Q11 24 12 27 Q13 24 12 22Z" fill="#4A90D9"/></g>
      <g className="sad-tear-r"><path d="M24 22 Q23 24 24 27 Q25 24 24 22Z" fill="#4A90D9"/></g>
    </svg>
  ),
  angry: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="angry-face-g" cx="42%" cy="35%" r="60%"><stop offset="0%" stopColor="#FF8C42"/><stop offset="100%" stopColor="#E84000"/></radialGradient>
      </defs>
      <g className="angry-face">
        <circle cx="18" cy="18" r="13" fill="url(#angry-face-g)"/>
        <g className="angry-brow-l"><path d="M8 13 Q13 16 15 13" stroke="#5C0000" strokeWidth="2.5" strokeLinecap="round" fill="none"/></g>
        <g className="angry-brow-r"><path d="M28 13 Q23 16 21 13" stroke="#5C0000" strokeWidth="2.5" strokeLinecap="round" fill="none"/></g>
        <g className="angry-eye-l"><ellipse cx="12" cy="18" rx="2.5" ry="2.2" fill="#fff"/><ellipse cx="12" cy="18.5" rx="1.4" ry="1.3" fill="#1A0000"/></g>
        <g className="angry-eye-r"><ellipse cx="24" cy="18" rx="2.5" ry="2.2" fill="#fff"/><ellipse cx="24" cy="18.5" rx="1.4" ry="1.3" fill="#1A0000"/></g>
        <g className="angry-mouth"><path d="M10 26.5 Q18 22.5 26 26.5" stroke="#6B1000" strokeWidth="2.5" strokeLinecap="round" fill="none"/></g>
        <g className="angry-vein"><path d="M24 9.5 L25.2 8 L26.2 9.5 L27.5 7.5" stroke="#8B2000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></g>
        <g className="angry-steam-l"><path d="M9 10 Q8.2 8 9 6.5" stroke="#FFB08C" strokeWidth="1.8" strokeLinecap="round" fill="none"/></g>
        <g className="angry-steam-r"><path d="M12 8.5 Q11.2 6.5 12 5" stroke="#FFB08C" strokeWidth="1.8" strokeLinecap="round" fill="none"/></g>
      </g>
    </svg>
  ),
};
