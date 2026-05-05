import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  Leaf, MapPin, Trophy, BookOpen,
  LogOut, Menu, X, Users, Cloud,
  ShoppingCart, Film, Zap, Bell, User, UserPlus,
  CloudSun, Home, PlusCircle, MessageCircle, Check,
  ChevronDown, ChevronUp, Settings, HelpCircle, Briefcase,
  Clock, Bookmark, Rss, Search, Moon, Sun
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FloatingChat from "@/components/FloatingChat";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { SearchDropdown } from "@/components/layout/SearchDropdown";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { href: "/community", label: "Comunidad", icon: Home },
  { href: "/dashboard", label: "Mapa", icon: MapPin },
  { href: "/friends", label: "Amigos", icon: UserPlus },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
  { href: "/marketplace", label: "EcoMarket", icon: ShoppingCart },
  { href: "/reels", label: "Reels", icon: Film },
];

// Quick-access shortcuts shown at the top of the drawer (like Facebook groups)
const quickAccessItems = [
  { href: "/dashboard", label: "Mapa Reportes", icon: MapPin, color: "bg-blue-500" },
  { href: "/leaderboard", label: "Ranking", icon: Trophy, color: "bg-yellow-500" },
  { href: "/marketplace", label: "EcoMarket", icon: ShoppingCart, color: "bg-green-500" },
];

// Grid menu items (2-column grid, like Facebook's "Páginas", "Grupos", etc.)
const gridMenuItems = [
  { href: "/friends",     label: "Amigos",    icon: Users,       color: "bg-blue-100 text-blue-700" },
  { href: "/reels",       label: "Reels",     icon: Film,        color: "bg-pink-100 text-pink-700" },
  { href: "/community",   label: "Comunidad", icon: Rss,         color: "bg-green-100 text-green-700" },
  { href: "/marketplace", label: "EcoMarket", icon: ShoppingCart,color: "bg-orange-100 text-orange-700" },
  { href: "/weather",     label: "Clima",     icon: CloudSun,    color: "bg-sky-100 text-sky-700" },
  { href: "/carbon",      label: "Carbono",   icon: Cloud,       color: "bg-slate-100 text-slate-700" },
  { href: "/minigames",   label: "Juegos",    icon: Zap,         color: "bg-purple-100 text-purple-700" },
  { href: "/education",   label: "Aprende",   icon: BookOpen,    color: "bg-teal-100 text-teal-700" },
];

// Bottom collapsible sections
const bottomSections = [
  {
    label: "Ayuda y soporte técnico",
    icon: HelpCircle,
    items: [
      { label: "Centro de ayuda", href: "/education" },
      { label: "Reportar un problema", href: "/create-report" },
    ],
  },
  {
    label: "Configuración y privacidad",
    icon: Settings,
    items: [
      { label: "Configuración", href: "#settings" },
    ],
  },
  {
    label: "Acceso profesional",
    icon: Briefcase,
    items: [
      { label: "Calculadora de Carbono", href: "/carbon" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

// ── Mobile inline search bar ────────────────────────────────────────────────
// ── Mobile Search Modal ─────────────────────────────────────────────────────
function MobileSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQ = q.trim();

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else setQ("");
  }, [open]);

  const submit = () => {
    if (debouncedQ.length >= 2) {
      setLocation(`/search?q=${encodeURIComponent(debouncedQ)}`);
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          {/* Search sheet — slides down from top */}
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[61] bg-background shadow-2xl rounded-b-2xl p-4 pt-safe"
          >
            {/* Input row */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
                  placeholder="Buscar en EcoGuardián..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {q && (
                  <button onClick={() => setQ("")} className="text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button onClick={onClose} className="text-muted-foreground font-medium text-sm shrink-0 px-1">
                Cancelar
              </button>
            </div>

            {/* Quick suggestions */}
            {!q && (
              <div className="mt-4 space-y-1 pb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase px-1 mb-2">Búsquedas rápidas</p>
                {["Deforestación", "Residuos", "Ríos", "Incendios"].map(s => (
                  <button key={s} onClick={() => { setLocation(`/search?q=${encodeURIComponent(s)}`); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{s}</span>
                  </button>
                ))}
              </div>
            )}

            {/* If query entered, show search button */}
            {q.length >= 2 && (
              <button onClick={submit}
                className="w-full mt-3 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                Buscar "{q}"
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showMoreGrid, setShowMoreGrid] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const hideSidebarAndChat = ["/messages", "/reels"].some((p) => location.startsWith(p));
  const isLoggedIn = user != null;
  const isAuthReady = !authLoading;
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Close drawer on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [isMobileMenuOpen]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const { data: friendRequests = [] } = useQuery({
    queryKey: ["/api/friends/requests"],
    queryFn: () => apiRequest("GET", "/api/friends/requests").then(r => r.json()),
    enabled: isLoggedIn,
    refetchInterval: 30000,
  });
  const pendingCount = Array.isArray(friendRequests) ? friendRequests.length : 0;

  const acceptMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/friends/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/friends/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    }
  });

  const closeMenu = () => setIsMobileMenuOpen(false);
  const visibleGridItems = showMoreGrid ? gridMenuItems : gridMenuItems.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── TOP NAVBAR ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">

            {/* Logo — always visible, title shows on mobile too */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="rounded-md group-hover:bg-primary/20 transition-colors">
                <img src="/favicon.png" alt="EcoGuardian" className="h-8 w-8 object-contain" />
              </div>
              <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EcoGuardián
              </span>
            </Link>

            {/* Search — desktop only inline, mobile gets icon button */}
            {isLoggedIn && (
              <div className="hidden md:flex items-center">
                <SearchDropdown />
              </div>
            )}

            {/* Center nav — desktop */}
            {isLoggedIn && (
              <div className="flex-1 flex justify-center">
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className={`
                        flex items-center justify-center px-5 py-3 transition-all cursor-pointer
                        ${location === item.href
                          ? "text-primary border-b-4 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        }
                      `}>
                        <item.icon className="h-6 w-6" />
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto">

              {isLoggedIn && isAuthReady && (
                <Link href="/leaderboard">
                  <div className="hidden sm:flex items-center gap-1.5 border px-3 py-1.5 rounded-2xl shadow-sm cursor-pointer hover:bg-muted/20 transition-colors">
                    <Leaf className="h-4 w-4 text-primary" />
                    <span className="font-black text-base text-foreground">{user!.points ?? 0}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">pts</span>
                  </div>
                </Link>
              )}

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden md:flex p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground mr-1"
                aria-label="Alternar modo oscuro"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications bell — desktop */}
              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 rounded-full hover:bg-muted transition-colors hidden md:flex">
                      <Bell className="h-5 w-5" />
                      {pendingCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <p className="px-3 py-2 font-semibold border-b border-border">Notificaciones</p>
                    {pendingCount === 0 ? (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">Sin notificaciones nuevas</p>
                    ) : (
                      friendRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {req.requester?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm truncate">{req.requester?.name} te envió solicitud</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => acceptMutation.mutate(req.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-full">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => rejectMutation.mutate(req.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-full">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Messages icon — desktop */}
              {isLoggedIn && (
                <Link href="/messages">
                  <div className={`hidden md:flex p-2 rounded-full transition-colors cursor-pointer
                    ${location === "/messages" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </div>
                </Link>
              )}

              {/* Avatar dropdown — desktop */}
              {isAuthReady && (
                isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hidden md:flex items-center px-1.5 py-1 rounded-full hover:bg-muted transition-colors">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                          {user!.name.charAt(0).toUpperCase()}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="font-semibold text-sm truncate">{user!.name}</p>
                        <p className="text-xs text-green-600 font-bold mt-0.5">🌱 {user!.points ?? 0} eco-puntos</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href={`/user/${user!.id}`} className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" /> Ver Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/friends" className="flex items-center gap-2 cursor-pointer">
                          <Bell className="h-4 w-4" /> Solicitudes
                          {pendingCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{pendingCount}</span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/create-report" className="flex items-center gap-2 cursor-pointer">
                          <PlusCircle className="h-4 w-4" /> Crear Reporte
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/auth">
                    <Button className="hidden md:flex rounded-full shadow-md shadow-primary/20 font-semibold">
                      Iniciar Sesión
                    </Button>
                  </Link>
                )
              )}

              {/* Search icon — mobile only, opens modal */}
              {isLoggedIn && (
                <button
                  className="md:hidden p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                  onClick={() => setIsMobileSearchOpen(true)}
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              {/* Hamburger — mobile only */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                onClick={() => setIsMobileMenuOpen(v => !v)}
                aria-label="Menú"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile search modal ───────────────────────────────────────────── */}
      <MobileSearchModal open={isMobileSearchOpen} onClose={() => setIsMobileSearchOpen(false)} />

      {/* ── MOBILE BOTTOM NAV BAR ─────────────────────────────────────────── */}
      {isLoggedIn && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2 py-1">

          {/* Inicio */}
          <Link href="/community">
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all ${location === "/community" ? "text-primary" : "text-muted-foreground"}`}>
              <Home className="h-6 w-6" />
              <span className="text-[10px] font-medium">Inicio</span>
            </div>
          </Link>

          {/* Mapa */}
          <Link href="/dashboard">
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all ${location === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}>
              <MapPin className="h-6 w-6" />
              <span className="text-[10px] font-medium">Mapa</span>
            </div>
          </Link>

          {/* Mensajes */}
          <Link href="/messages">
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all ${location === "/messages" ? "text-primary" : "text-muted-foreground"}`}>
              <MessageCircle className="h-6 w-6" />
              <span className="text-[10px] font-medium">Mensajes</span>
            </div>
          </Link>

          {/* Notificaciones — con badge */}
          <button
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all text-muted-foreground relative"
            onClick={() => setIsMobileMenuOpen(v => !v)}
          >
            <div className="relative">
              <Bell className="h-6 w-6" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Alertas</span>
          </button>

          {/* Menú / Avatar */}
          <button
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(v => !v)}
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="text-[10px] font-medium">Menú</span>
          </button>

        </nav>
      )}

      {/* ── FACEBOOK-STYLE LEFT DRAWER ────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={closeMenu}
            />

            {/* Drawer panel — slides in from RIGHT (like Facebook) */}
            <motion.div
              ref={drawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-background z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* ── DRAWER HEADER: Avatar + name + close ── */}
              <div className="flex items-center justify-between p-4 pt-12 border-b border-border/50">
                {isLoggedIn ? (
                  <Link href={`/user/${user!.id}`} onClick={closeMenu} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 text-base">
                      {user!.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{user!.name}</p>
                      <p className="text-xs text-green-600 font-semibold">🌱 {user!.points ?? 0} eco-puntos</p>
                    </div>
                    {pendingCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-1.5 shrink-0">
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  <p className="font-bold text-lg text-foreground">EcoGuardián</p>
                )}
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-muted transition-colors shrink-0">
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                  <button onClick={closeMenu} className="p-2 rounded-full hover:bg-muted transition-colors shrink-0">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">

                {/* ── QUICK ACCESS (like Facebook's "Tus accesos directos") ── */}
                {isLoggedIn && (
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-sm font-bold text-foreground mb-3">Tus accesos directos</p>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {quickAccessItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={closeMenu}>
                          <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
                            <div className={`h-14 w-14 rounded-xl ${item.color} flex items-center justify-center shadow-sm`}>
                              <item.icon className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xs font-medium text-foreground text-center leading-tight">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-border/50 mx-4 my-3" />

                {/* ── GRID MENU (2 columns, like Facebook) ── */}
                <div className="px-4 pb-2">
                  <div className="grid grid-cols-2 gap-2">
                    {visibleGridItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={closeMenu}>
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted active:bg-muted transition-colors border border-border/50 bg-card">
                          <div className={`h-9 w-9 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium text-foreground leading-tight">{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Ver más / menos */}
                  <button
                    onClick={() => setShowMoreGrid(v => !v)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 text-sm font-semibold text-foreground"
                  >
                    {showMoreGrid ? (
                      <><ChevronUp className="h-4 w-4" /> Ver menos</>
                    ) : (
                      <><ChevronDown className="h-4 w-4" /> Ver más</>
                    )}
                  </button>
                </div>

                <div className="h-px bg-border/50 mx-4 my-3" />

                {/* ── CREATE REPORT CTA ── */}
                {isLoggedIn && (
                  <div className="px-4 pb-3">
                    <Link href="/create-report" onClick={closeMenu}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">
                        <PlusCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm">Crear Reporte Ambiental</span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* ── NOTIFICATIONS (friend requests) ── */}
                {isLoggedIn && pendingCount > 0 && (
                  <div className="px-4 pb-3">
                    <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                      <Bell className="h-3.5 w-3.5 text-red-500" />
                      Solicitudes de amistad ({pendingCount})
                    </p>
                    <div className="space-y-2">
                      {friendRequests.slice(0, 3).map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {req.requester?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium truncate">{req.requester?.name}</span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => acceptMutation.mutate(req.id)} className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg">
                              Confirmar
                            </button>
                            <button onClick={() => rejectMutation.mutate(req.id)} className="px-2.5 py-1 bg-muted text-foreground text-xs font-bold rounded-lg">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-border/50 mx-4 my-1" />

                {/* ── COLLAPSIBLE BOTTOM SECTIONS (like Facebook) ── */}
                <div className="px-4 pb-4">
                  {bottomSections.map((section) => (
                    <div key={section.label}>
                      <button
                        onClick={() => setExpandedSection(expandedSection === section.label ? null : section.label)}
                        className="w-full flex items-center justify-between py-3 text-foreground"
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">{section.label}</span>
                        </div>
                        {expandedSection === section.label
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </button>
                      <AnimatePresence>
                        {expandedSection === section.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-8 pb-2 space-y-1">
                              {section.items.map((item) => (
                                <Link key={item.href} href={item.href} onClick={closeMenu}>
                                  <div className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    {item.label}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* ── LOGOUT ── */}
                {isLoggedIn && (
                  <div className="px-4 pb-8">
                    <button
                      onClick={() => { logout(); closeMenu(); }}
                      className="w-full flex items-center gap-3 py-3 text-destructive text-sm font-medium"
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar sesión
                    </button>
                  </div>
                )}

                {!isLoggedIn && (
                  <div className="px-4 pb-8 pt-2">
                    <Link href="/auth" onClick={closeMenu}>
                      <Button className="w-full h-12 text-base font-semibold rounded-xl">
                        Iniciar Sesión / Registrarse
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex">
        {!hideSidebarAndChat && <LeftSidebar />}
        <main className={`flex-1 min-h-0 overflow-auto ${isLoggedIn ? "pb-20 md:pb-0" : "pb-4"}`}>
          {children}
        </main>
      </div>

      {/* FloatingChat — CSS nudges it above the mobile bottom nav */}
      {isLoggedIn && !hideSidebarAndChat && (
        <>
          <style>{`
            @media (max-width: 767px) {
              /* Push FloatingChat button above the bottom nav bar (~56px tall) */
              [data-floating-chat],
              .floating-chat-root {
                bottom: 5.5rem !important;
              }
            }
          `}</style>
          <FloatingChat />
        </>
      )}
    </div>
  );
}