import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Trophy, Zap, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Minigames() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: game, isLoading, isError, error } = useQuery({
    queryKey: ["/api/minigames/daily"],
    queryFn: () => apiRequest("GET", "/api/minigames/daily").then(r => r.json()),
    enabled: !!user,
  });

  const { data: history } = useQuery({
    queryKey: ["/api/minigames/history"],
    queryFn: () => apiRequest("GET", "/api/minigames/history").then(r => r.json()),
    enabled: !!user,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnswer || !game) throw new Error("No answer selected");
      return apiRequest("POST", "/api/minigames/submit", {
        gameId: game.id,
        answer: selectedAnswer,
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      setResult(data);
      setAnswered(true);
      queryClient.invalidateQueries({ queryKey: ["/api/minigames/history"] });
      
      if (data?.isCorrect) {
        toast({
          title: "🎉 ¡Respuesta Correcta!",
          description: `Ganaste ${data.points || 10} eco-puntos`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Respuesta Incorrecta",
          description: "Intenta mañana para ganar eco-puntos",
        });
      }
    },
    onError: (error: any) => {
      console.error("Error submitting answer:", error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: error?.message || "Error al responder la pregunta",
      });
      setSelectedAnswer(null);
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Inicia sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Debes iniciar sesión para jugar minijuegos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="h-12 w-12 animate-spin mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Cargando desafío diario...</p>
        </div>
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error al cargar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">No se pudo cargar el desafío diario.</p>
            <Button onClick={() => location.reload()} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = game?.options ? JSON.parse(game.options) : [];
  const totalGames = Array.isArray(history) ? history.length : 0;
  const correctAnswers = Array.isArray(history) ? history.filter((h: any) => h.isCorrect).length : 0;
  const totalPoints = Array.isArray(history) ? history.reduce((sum: number, h: any) => sum + (h.pointsEarned || 0), 0) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <Brain className="h-10 w-10 text-purple-500" />
          Minijuegos Diarios
        </h1>
        <p className="text-muted-foreground">Aprende sobre medio ambiente y gana eco-puntos cada día</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-purple-600">{correctAnswers}/{totalGames}</p>
              <p className="text-sm text-muted-foreground">Respuestas Correctas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-3xl font-bold text-yellow-600">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Eco-Puntos Ganados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold text-green-600">{totalGames} días</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Challenge */}
      {!answered || !result ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-purple-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Desafío de Hoy</CardTitle>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Disponible 24 horas</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8">
              {game?.imageUrl && (
                <motion.img
                  src={game.imageUrl}
                  alt="Pregunta"
                  className="w-full max-h-64 object-cover rounded-lg mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                />
              )}

              {/* Pregunta */}
              <div className="mb-8">
                <p className="text-sm text-muted-foreground mb-2">PREGUNTA {game?.difficulty?.toUpperCase() || "MEDIA"}</p>
                <h2 className="text-2xl font-bold text-foreground mb-4">{game?.question}</h2>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-600">+{game?.points || 10} eco-puntos</span>
                </div>
              </div>

              {/* Opciones */}
              <div className="space-y-3">
                {options.map((option: string, idx: number) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !selectedAnswer && setSelectedAnswer(option)}
                    disabled={!!selectedAnswer}
                    className={`w-full p-4 text-left rounded-lg border-2 font-medium transition-all ${
                      selectedAnswer === option
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : selectedAnswer
                        ? "border-gray-200 bg-gray-50 text-gray-400"
                        : "border-gray-200 hover:border-purple-300 bg-background hover:bg-purple-50/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full font-bold ${
                          selectedAnswer === option
                            ? "bg-purple-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      {option}
                    </div>
                  </motion.button>
                ))}
              </div>

              <Button
                onClick={() => submitAnswerMutation.mutate()}
                disabled={!selectedAnswer || submitAnswerMutation.isPending}
                className="w-full mt-8 h-12 text-base font-semibold"
              >
                {submitAnswerMutation.isPending ? "Verificando..." : "Responder"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card
              className={`border-2 overflow-hidden ${
                result.isCorrect
                  ? "border-green-200 bg-green-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <CardHeader
                className={`bg-gradient-to-r ${
                  result.isCorrect
                    ? "from-green-500 to-emerald-500"
                    : "from-red-500 to-orange-500"
                } text-white`}
              >
                <CardTitle className="text-white text-center text-3xl">
                  {result.isCorrect ? "🎉 ¡CORRECTO!" : "❌ INCORRECTO"}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 text-center space-y-6">
                <div>
                  <p className="text-lg text-muted-foreground mb-2">La respuesta correcta era:</p>
                  <p className="text-2xl font-bold text-foreground bg-white/50 p-4 rounded-lg">
                    {game?.correctAnswer}
                  </p>
                </div>

                {result.isCorrect ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6"
                  >
                    <p className="text-4xl font-bold text-yellow-600 mb-2">+{result.points}</p>
                    <p className="text-lg font-semibold text-yellow-700">eco-puntos ganados</p>
                  </motion.div>
                ) : (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <p className="text-lg font-semibold text-blue-700">
                      Vuelve mañana para conseguir tu próximo desafío
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => location.reload()}
                  variant="outline"
                  className="w-full h-12 text-base"
                >
                  Volver a Inicio
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Historial */}
      {history && history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Últimos Desafíos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((h: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {h.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(h.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`font-bold ${h.isCorrect ? "text-green-600" : "text-red-600"}`}>
                      +{h.pointsEarned}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
