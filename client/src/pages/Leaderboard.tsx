import { useLeaderboard } from "@/hooks/use-leaderboard";
import { Trophy, Medal, Crown, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useRef, useState, useEffect } from "react";

export default function Leaderboard() {
  const { data: users = [], isLoading } = useLeaderboard();
  const { user } = useAuth();

  // determine current user position
  const myIndex = users.findIndex(u => u.id === user?.id);
  const total = users.length;
  const percentile = myIndex >= 0 ? Math.round((1 - myIndex / total) * 100) : 0;

  // animation state for rank changes
  const prevIndexRef = useRef<number | null>(null);
  const [animateChange, setAnimateChange] = useState<Record<number, 'up'|'down'>>({});
  useEffect(() => {
    if (prevIndexRef.current != null && myIndex !== prevIndexRef.current) {
      setAnimateChange({
        [myIndex]: 'up',
        [prevIndexRef.current]: 'down',
      });
      setTimeout(() => setAnimateChange({}), 600);
    }
    prevIndexRef.current = myIndex;
  }, [myIndex]);

  // message templates by rank category
  const messagesByRank = [
    `¡Imparable! Has superado al ${percentile}% de los EcoGuardianes y ocupas el puesto ${myIndex + 1}.`,
    `Gran trabajo, estás en el puesto ${myIndex + 1} y superas al ${percentile}% de la comunidad.`,
    `Sigue así: eres el #${myIndex + 1}, por encima de ${percentile}% de los guardines.`
  ];
  const myMessage = myIndex >= 0 ? messagesByRank[myIndex % messagesByRank.length] : "";

  if (isLoading) return (
    <div className="flex justify-center p-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-8 w-8 text-yellow-500 fill-yellow-400" />;
    if (index === 1) return <Medal className="h-7 w-7 text-gray-400 fill-gray-300" />;
    if (index === 2) return <Medal className="h-7 w-7 text-amber-700 fill-amber-600" />;
    return <span className="font-bold text-muted-foreground w-8 text-center text-sm">{index + 1}</span>;
  };

  const getBadgeStyle = (index: number) => {
    if (index === 0) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700";
    if (index === 1) return "bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-600";
    if (index === 2) return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700";
    return "bg-background border-border";
  };

  const getLeafClass = (index: number) => {
    if (index === 0) return "text-yellow-500 fill-yellow-400";
    if (index === 1) return "text-slate-400 fill-slate-300";
    if (index === 2) return "text-amber-600 fill-amber-500";
    return "text-primary fill-primary/50";
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in pb-20 px-4">
      <div className="text-center mb-10 mt-6">
        <div className="inline-flex bg-accent/20 p-4 rounded-full mb-4">
          <Trophy className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">Top EcoGuardianes</h1>
        <p className="text-muted-foreground mt-2 text-lg">Los héroes que más protegen nuestro medio ambiente.</p>
        {myIndex >= 0 && (
          <p className="mt-2 text-green-600 font-semibold">{myMessage}</p>
        )}
      </div>

      {/* Podium for top 3 */}
      {users.length >= 3 && (
        <div className="flex items-end justify-center gap-1 sm:gap-3 mb-8">
          {/* 2nd */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-2 flex-1 max-w-[110px]">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              {(users[1] as any)?.name?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-center truncate w-full">{(users[1] as any)?.name}</p>
            <div className="flex items-center gap-0.5">
              <Leaf className="h-3 w-3 text-slate-400 fill-slate-300" />
              <span className="text-xs font-black text-slate-500">{(users[1] as any)?.points}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-14 flex items-center justify-center">
              <span className="text-lg font-black text-slate-400">2</span>
            </div>
          </motion.div>

          {/* 1st */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
            <Crown className="h-5 w-5 text-yellow-500 fill-yellow-400" />
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-yellow-300/50">
              {(users[0] as any)?.name?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-center truncate w-full">{(users[0] as any)?.name}</p>
            <div className="flex items-center gap-0.5">
              <Leaf className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
              <span className="text-xs font-black text-yellow-600">{(users[0] as any)?.points}</span>
            </div>
            <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 rounded-t-xl h-20 flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </motion.div>

          {/* 3rd */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2 flex-1 max-w-[110px]">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              {(users[2] as any)?.name?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-center truncate w-full">{(users[2] as any)?.name}</p>
            <div className="flex items-center gap-0.5">
              <Leaf className="h-3 w-3 text-amber-600 fill-amber-500" />
              <span className="text-xs font-black text-amber-700">{(users[2] as any)?.points}</span>
            </div>
            <div className="w-full bg-amber-50 dark:bg-amber-900/20 rounded-t-xl h-10 flex items-center justify-center">
              <span className="text-lg font-black text-amber-600">3</span>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border">
        {users.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Aún no hay puntos registrados. ¡Sé el primero!</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user: any, index: number) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: animateChange[index] === 'up' ? -10 : animateChange[index] === 'down' ? 10 : 0,
                  scale: index === myIndex ? [1, 1.08, 1] : 1,
                }}
                transition={{ delay: index * 0.04, duration: 0.5 }}
                className={`relative flex items-center p-4 md:p-5 transition-colors hover:bg-muted/50 ${index < 3 ? "bg-secondary/30" : ""} ${index === myIndex ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-background animate-pulse' : ''}`}
              >
                <div className="flex-shrink-0 mr-4 flex items-center justify-center w-10">
                  {getRankIcon(index)}
                </div>

                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-white text-sm font-bold mr-3 shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate ${index === 0 ? "text-primary" : "text-foreground"}`}>
                    {user.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Desde {user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
                  </p>
                </div>

                <div className={`flex items-center gap-1.5 border px-3 py-2 rounded-2xl shadow-sm ${getBadgeStyle(index)}`}>
                  <Leaf className={`h-4 w-4 ${getLeafClass(index)}`} />
                  <span className="font-black text-lg font-display">{user.points}</span>
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