import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Home, MapPin, Trophy, BookOpen, Cloud,
  ShoppingCart, Film, Zap, UserPlus, CloudSun, PlusCircle, Trash2
} from "lucide-react";

const navItems = [
  { href: "/community", label: "Comunidad", icon: Home },
  { href: "/dashboard", label: "Mapa de Reportes", icon: MapPin },
  { href: "/friends", label: "Amigos", icon: UserPlus },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
];

const secondaryNav = [
  { href: "/weather", label: "Clima", icon: CloudSun },
  { href: "/carbon", label: "Huella de Carbono", icon: Cloud },
  { href: "/marketplace", label: "EcoMarket", icon: ShoppingCart },
  { href: "/reels", label: "Reels", icon: Film },
  { href: "/minigames", label: "Juegos", icon: Zap },
  { href: "/education", label: "Aprende", icon: BookOpen },
  { href: "/cronograma", label: "Cronograma de Basura", icon: Trash2 },
];

export function LeftSidebar() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const isLoggedIn = user != null;

  // Hide sidebar entirely when not logged in or still loading
  if (!isLoggedIn || isLoading) return null;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-background border-r border-border/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0">

      {/* Create report CTA */}
      <div className="p-4 pb-2">
        <Link href="/create-report">
          <div className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20">
            <PlusCircle className="h-4 w-4" />
            Crear Reporte
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <div className="space-y-0.5 px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Principal</p>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all font-medium
              ${location === item.href
                ? "text-primary bg-primary/10 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            `}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="h-px bg-border/50 mx-4" />

      {/* Secondary nav */}
      <div className="space-y-0.5 px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Explorar</p>
        {secondaryNav.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all font-medium
              ${location === item.href
                ? "text-primary bg-primary/10 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            `}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>


    </aside>
  );
}