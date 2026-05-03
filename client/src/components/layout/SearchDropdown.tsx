import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, FileText, Loader2, X } from "lucide-react";

export function SearchDropdown() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: () => apiRequest("GET", `/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = (userId: number) => {
    setLocation(`/user/${userId}`);
    setIsOpen(false);
    setQuery("");
  };

  const handlePostClick = (postId: number) => {
    setLocation(`/community`);
    setIsOpen(false);
    setQuery("");
  };

  const handleSearchSubmit = () => {
    if (query.length >= 2) {
      setLocation(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative hidden md:block" ref={dropdownRef}>
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyPress}
            placeholder="Buscar en EcoGuardian..."
            className="bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground flex-1 min-w-[200px]"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden"
          >
            <div className="p-4">
              {isLoading && debouncedQuery.length >= 2 && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && debouncedQuery.length >= 2 && results &&
                results.users?.length === 0 && results.posts?.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No se encontraron resultados</p>
                </div>
              )}

              {!isLoading && results && debouncedQuery.length >= 2 && (
                <div className="space-y-4">
                  {/* Usuarios */}
                  {results.users && results.users.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="h-3 w-3" />
                        PERSONAS
                      </h3>
                      <div className="space-y-1">
                        {results.users.slice(0, 3).map((user: any) => (
                          <button
                            key={user.id}
                            onClick={() => handleUserClick(user.id)}
                            className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                          >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.city || user.country || "Sin ubicación"}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-yellow-600 flex-shrink-0">
                              {user.points} 🌱
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Publicaciones */}
                  {results.posts && results.posts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        PUBLICACIONES
                      </h3>
                      <div className="space-y-1">
                        {results.posts.slice(0, 3).map((post: any) => (
                          <button
                            key={post.id}
                            onClick={() => handlePostClick(post.id)}
                            className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors"
                          >
                            <p className="font-medium text-sm line-clamp-1">{post.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.author?.name} • {post.category && `En ${post.category}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {query && debouncedQuery.length >= 2 && (results?.users?.length > 0 || results?.posts?.length > 0) && (
                <div className="border-t border-border pt-3 mt-4">
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-2 text-primary text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    Ver todos los resultados
                  </button>
                </div>
              )}

              {!query && (
                <div className="text-center py-4 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Escribe para buscar</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}