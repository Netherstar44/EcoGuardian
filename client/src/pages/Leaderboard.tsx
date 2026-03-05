import { useLeaderboard } from "@/hooks/use-leaderboard";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: users = [], isLoading } = useLeaderboard();

  if (isLoading) return (
    <div className="flex justify-center p-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-8 w-8 text-yellow-500" />;
    if (index === 1) return <Medal className="h-7 w-7 text-gray-400" />;
    if (index === 2) return <Medal className="h-7 w-7 text-amber-700" />;
    return <span className="font-bold text-muted-foreground w-8 text-center">{index + 1}</span>;
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in pb-20">
      <div className="text-center mb-10 mt-6">
        <div className="inline-flex bg-accent/20 p-4 rounded-full mb-4">
          <Trophy className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">Top EcoGuardianes</h1>
        <p className="text-muted-foreground mt-2 text-lg">Los héroes que más protegen nuestro medio ambiente.</p>
      </div>

      <div className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border overflow-hidden">
        {users.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Aún no hay puntos registrados. ¡Sé el primero!</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user: any, index: number) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center p-4 md:p-6 transition-colors hover:bg-muted/50 ${index < 3 ? 'bg-secondary/30' : ''}`}
              >
                <div className="flex-shrink-0 mr-4 md:mr-6 flex items-center justify-center w-12">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                    {user.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">Unido en 2024</p>
                </div>

                <div className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-2xl shadow-sm">
                  <Star className={`h-5 w-5 ${index < 3 ? 'text-yellow-500 fill-yellow-500' : 'text-primary'}`} />
                  <span className="font-black text-xl font-display">{user.points}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
