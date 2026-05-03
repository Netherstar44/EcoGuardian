import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RightSidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden xl:flex flex-col w-64 space-y-6">
      {/* User Info Widget */}
      {user && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-foreground">{user.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 mt-1">Eco-guardián activo</p>
            <div className="bg-yellow-100/50 text-yellow-700 rounded-lg py-2 px-3 text-sm font-bold mb-4">
              {user.points} 🌱 Eco-puntos
            </div>
            <Button variant="outline" className="w-full text-xs" size="sm">
              Ver perfil completo
            </Button>
          </div>
        </div>
      )}

      {/* Activity Widget */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">Actividad Reciente</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-b-0 last:pb-0">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {i % 3 === 0 ? (
                  <Heart className="h-4 w-4 text-primary" />
                ) : i % 3 === 1 ? (
                  <MessageCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Share2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="text-muted-foreground line-clamp-2">
                  {i === 1 && "Se dio me gusta a tu publicación"}
                  {i === 2 && "Alguien comentó tu post"}
                  {i === 3 && "Nueva sugerencia de amigo"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">hace {i} horas</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions Widget */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">Sugerencias para ti</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Usuario {i}</p>
                <p className="text-xs text-muted-foreground">Se une a EcoGuardián</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Seguir
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Help Widget */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-2">¿Necesitas ayuda?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Consulta nuestros tutoriales y guías sobre medio ambiente.
        </p>
        <Button variant="outline" className="w-full text-xs" size="sm">
          Centro de ayuda
        </Button>
      </div>
    </aside>
  );
}
