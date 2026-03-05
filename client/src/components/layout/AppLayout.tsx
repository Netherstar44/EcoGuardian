import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, MapPin, PlusCircle, Trophy, BookOpen, 
  LogOut, User as UserIcon, Menu, X, Users
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Explorar", icon: MapPin },
  { href: "/create-report", label: "Reportar", icon: PlusCircle, primary: true },
  { href: "/community", label: "Muro", icon: Users },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
  { href: "/education", label: "Aprende", icon: BookOpen },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Top Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EcoGuardián
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`
                    flex items-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer
                    ${location === item.href 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                    }
                    ${item.primary ? "px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 shadow-sm hover:shadow hover:-translate-y-0.5" : ""}
                  `}>
                    <item.icon className="h-4 w-4" />
                    <span className={item.primary ? "text-primary-foreground" : ""}>{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Desktop Auth/User */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
                    <span className="text-sm font-semibold text-secondary-foreground">{user.points} 🌱</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => logout()} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button className="rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                    Ingresar
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-16 bg-background/95 backdrop-blur-xl border-b z-40 p-4"
          >
            <div className="flex flex-col gap-4">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-primary font-bold">{user.points} 🌱 Eco-puntos</p>
                  </div>
                </div>
              )}
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${
                      location === item.href ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              ))}
              {user ? (
                <Button variant="outline" className="w-full justify-start gap-2 text-destructive" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </Button>
              ) : (
                <Link href="/auth">
                  <Button className="w-full" onClick={() => setIsMobileMenuOpen(false)}>Ingresar / Registrarse</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background/90 backdrop-blur-lg border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-1 p-2 cursor-pointer">
                  <div className={`
                    p-2 rounded-xl transition-all duration-300
                    ${isActive && !item.primary ? "bg-primary/15 text-primary" : ""}
                    ${!isActive && !item.primary ? "text-muted-foreground hover:bg-muted" : ""}
                    ${item.primary ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 -mt-6 rounded-full" : ""}
                  `}>
                    <item.icon className={item.primary ? "h-6 w-6" : "h-5 w-5"} />
                  </div>
                  {!item.primary && (
                    <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
