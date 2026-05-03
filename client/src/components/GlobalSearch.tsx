import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, User, FileText, Loader2, TrendingUp } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface SearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: SearchProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: () => apiRequest("GET", `/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
  });

  const handleUserClick = (userId: number) => {
    setLocation(`/user/${userId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handlePostClick = (postId: number) => {
    setLocation(`/report/${postId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleSearchSubmit = () => {
    if (query.length >= 2) {
      setLocation(`/search?q=${encodeURIComponent(query)}`);
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[70vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          <div className="border-b border-border p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Buscar en EcoGuardián</DialogTitle>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Busca personas, reportes, publicaciones..."
                autoFocus
                className="pl-10 bg-background border-border h-12 text-base rounded-full"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && debouncedQuery.length >= 2 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && debouncedQuery.length >= 2 && results &&
              results.users?.length === 0 && results.posts?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron resultados para "{query}"</p>
              </div>
            )}

            {!isLoading && results && debouncedQuery.length >= 2 && (
              <div className="space-y-6">
                {/* Usuarios */}
                {results.users && results.users.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      PERSONAS
                    </h3>
                    <div className="space-y-2">
                      {results.users.slice(0, 5).map((user: any) => (
                        <motion.button
                          key={user.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handleUserClick(user.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                        >
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.city || user.country || "Sin ubicación"}</p>
                          </div>
                          <span className="text-xs font-bold text-yellow-600 flex-shrink-0">{user.points} 🌱</span>
                        </motion.button>
                      ))}
                    </div>
                    {results.users.length > 5 && (
                      <button 
                        onClick={handleSearchSubmit}
                        className="w-full mt-2 py-2 text-primary text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        Ver todos ({results.users.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Publicaciones */}
                {results.posts && results.posts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PUBLICACIONES Y REPORTES
                    </h3>
                    <div className="space-y-2">
                      {results.posts.slice(0, 5).map((post: any) => (
                        <motion.button
                          key={post.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handlePostClick(post.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                          <p className="font-medium text-sm line-clamp-1">{post.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.author?.name} • {post.category && `En ${post.category}`}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                    {results.posts.length > 5 && (
                      <button 
                        onClick={handleSearchSubmit}
                        className="w-full mt-2 py-2 text-primary text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        Ver todos ({results.posts.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!debouncedQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm mb-4">Escribe para buscar personas, reportes y publicaciones</p>
                <p className="text-xs opacity-70">Presiona Enter para ver todos los resultados</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
