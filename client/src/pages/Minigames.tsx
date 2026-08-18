import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Trophy, Zap, CheckCircle, XCircle, Clock, Award, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono font-bold tracking-wider">{timeLeft}</span>;
}

export default function Minigames() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<any>(null);

  const { data: game, isLoading, isError, refetch: refetchDaily } = useQuery<any>({
    queryKey: ["/api/minigames/daily"],
    queryFn: () => apiRequest("GET", "/api/minigames/daily").then(r => r.json()),
    enabled: !!user,
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["/api/minigames/history"],
    queryFn: () => apiRequest("GET", "/api/minigames/history").then(r => r.json()),
    enabled: !!user,
  });

  // Check if today's game was already completed in history or in daily response
  const existingAttempt = (Array.isArray(history) ? history.find((h: any) => h.gameId === game?.id) : null) || game?.userPlay;
  const isAlreadyPlayed = !!existingAttempt || !!game?.alreadyPlayed || !!localResult;
  const activeResult = localResult || (existingAttempt ? {
    isCorrect: existingAttempt.isCorrect,
    points: existingAttempt.pointsEarned,
    answer: existingAttempt.answer,
  } : null);

  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnswer || !game?.id) throw new Error("Debes seleccionar una respuesta");
      const res = await apiRequest("POST", "/api/minigames/submit", {
        gameId: game.id,
        answer: selectedAnswer,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLocalResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/minigames/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/minigames/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (data?.isCorrect) {
        toast({
          title: "🎉 ¡Respuesta Correcta!",
          description: `Ganaste ${data.points || 10} eco-puntos`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Respuesta Incorrecta",
          description: "Has consumido tu intento diario. ¡Vuelve mañana para ganar más eco-puntos!",
        });
      }
    },
    onError: (error: any) => {
      // If user already played (e.g. 409 or already recorded)
      if (error?.message?.includes("ya has completado") || error?.message?.includes("409")) {
        toast({
          title: "ℹ️ Desafío ya completado",
          description: "Ya has respondido la pregunta de hoy.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/minigames/daily"] });
        queryClient.invalidateQueries({ queryKey: ["/api/minigames/history"] });
      } else {
        console.error("Error submitting answer:", error);
        toast({
          variant: "destructive",
          title: "❌ Error",
          description: error?.message || "Error al enviar la respuesta",
        });
      }
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center">
            <Brain className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Inicia sesión</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-sm">
              Debes iniciar sesión con tu cuenta para jugar a los minijuegos diarios y acumular eco-puntos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Zap className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando desafío diario...</p>
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-destructive">Error al cargar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">No se pudo cargar el desafío diario de hoy.</p>
            <Button onClick={() => refetchDaily()} className="w-full rounded-full gap-2 font-semibold">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = game?.options ? (typeof game.options === "string" ? JSON.parse(game.options) : game.options) : [];
  const totalGames = Array.isArray(history) ? history.length : 0;
  const correctAnswers = Array.isArray(history) ? history.filter((h: any) => h.isCorrect).length : 0;
  const totalPoints = Array.isArray(history) ? history.reduce((sum: number, h: any) => sum + (h.pointsEarned || 0), 0) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Desafío Diario
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pon a prueba tus conocimientos ecológicos y gana eco-puntos
              </p>
            </div>
          </div>

          {/* Daily Attempts Badge (Live status) */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-sm transition-all ${
            isAlreadyPlayed
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isAlreadyPlayed ? "bg-amber-500" : "bg-emerald-500"}`} />
            <span>
              {isAlreadyPlayed ? "Intentos hoy: 0 / 1 (Consumido)" : "Intentos hoy: 1 / 1 disponible"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">{correctAnswers} / {totalGames}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Aciertos / Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">+{totalPoints}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Eco-puntos ganados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">{totalGames} {totalGames === 1 ? "día" : "días"}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Racha de participación</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Challenge Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className={`overflow-hidden border-2 shadow-lg transition-all ${
          isAlreadyPlayed 
            ? "border-border bg-card" 
            : "border-primary/40 bg-card"
        }`}>
          
          {/* Challenge Card Header */}
          <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-primary text-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <CardTitle className="text-lg sm:text-xl font-bold text-white">
                  Pregunta de Hoy
                </CardTitle>
              </div>

              {isAlreadyPlayed ? (
                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white/90 border border-white/20">
                  <Clock className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Nuevo en: </span>
                  <MidnightCountdown />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white">
                  <Award className="h-3.5 w-3.5 text-yellow-300" />
                  <span>+{game?.points || 10} Eco-puntos</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-7 space-y-6">
            
            {/* If user ALREADY completed today's challenge */}
            {isAlreadyPlayed && activeResult ? (
              <div className="space-y-6">
                
                {/* Result Status Banner */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                  activeResult.isCorrect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
                }`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    activeResult.isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {activeResult.isCorrect ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">
                      {activeResult.isCorrect ? "¡Has acertado la pregunta de hoy!" : "Respuesta incorrecta"}
                    </h3>
                    <p className="text-xs opacity-90">
                      {activeResult.isCorrect 
                        ? `Has ganado +${activeResult.points || 10} eco-puntos para tu perfil.`
                        : "No sumaste eco-puntos hoy, ¡pero aprendiste algo nuevo!"}
                    </p>
                  </div>
                </div>

                {/* Question Info */}
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-2">
                    Dificultad: {game?.difficulty?.toUpperCase() || "MEDIA"}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                    {game?.question}
                  </h2>
                </div>

                {/* Options showing correct answer & user's choice */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Opciones y Resultado:
                  </p>
                  {options.map((option: string, idx: number) => {
                    const isCorrectAnswer = option === game?.correctAnswer;
                    const isUserChoice = option === activeResult.answer || option === selectedAnswer;

                    let optionStyle = "border-border/60 bg-muted/30 text-muted-foreground opacity-70";
                    let badge = null;

                    if (isCorrectAnswer) {
                      optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold opacity-100 shadow-sm";
                      badge = <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">✓ Correcta</span>;
                    } else if (isUserChoice && !activeResult.isCorrect) {
                      optionStyle = "border-red-500 bg-red-500/10 text-red-900 dark:text-red-200 font-semibold opacity-100";
                      badge = <span className="ml-auto text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">✗ Tu elección</span>;
                    }

                    return (
                      <div
                        key={idx}
                        className={`w-full p-3.5 sm:p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${optionStyle}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCorrectAnswer 
                            ? "bg-emerald-500 text-white" 
                            : isUserChoice && !activeResult.isCorrect 
                            ? "bg-red-500 text-white" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm flex-1">{option}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Consumed attempts notice */}
                <div className="p-4 rounded-2xl bg-muted/60 border border-border text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Has consumido tu intento diario (1/1)</span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    El próximo minijuego y oportunidad para sumar eco-puntos estará disponible en{" "}
                    <MidnightCountdown />.
                  </p>
                </div>

              </div>
            ) : (
              /* User has NOT yet answered today's challenge */
              <div className="space-y-6">
                
                {/* Question Image if present */}
                {game?.imageUrl && (
                  <img
                    src={game.imageUrl}
                    alt="Desafío"
                    className="w-full max-h-60 object-cover rounded-2xl border border-border"
                  />
                )}

                {/* Question Text */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                      Dificultad: {game?.difficulty?.toUpperCase() || "MEDIA"}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      +{game?.points || 10} Eco-puntos
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                    {game?.question}
                  </h2>
                </div>

                {/* Selectable Options */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Selecciona tu respuesta:
                  </p>
                  {options.map((option: string, idx: number) => {
                    const isSelected = selectedAnswer === option;
                    return (
                      <motion.button
                        key={idx}
                        type="button"
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedAnswer(option)}
                        disabled={submitAnswerMutation.isPending}
                        className={`w-full p-3.5 sm:p-4 text-left rounded-xl border-2 font-medium transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-md shadow-primary/10"
                            : "border-border hover:border-primary/40 bg-card hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm flex-1">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Submit Action Button */}
                <Button
                  onClick={() => submitAnswerMutation.mutate()}
                  disabled={!selectedAnswer || submitAnswerMutation.isPending}
                  className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                  {submitAnswerMutation.isPending ? "Verificando respuesta..." : "Enviar Respuesta (1 Intento)"}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>

      {/* History Section */}
      {history && history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Historial de Desafíos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2.5">
                {history.slice(0, 7).map((h: any, idx: number) => (
                  <div
                    key={h.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        h.isCorrect ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}>
                        {h.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {h.isCorrect ? "Respuesta Correcta" : "Respuesta Incorrecta"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(h.completedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full ${
                      h.isCorrect 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      +{h.pointsEarned || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  );
}
