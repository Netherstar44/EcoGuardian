import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Cloud, Leaf, Droplets, Zap, Trash2, Wind } from "lucide-react";
import { motion } from "framer-motion";

export default function CarbonCalculator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    transportCo2: 0,
    energyCo2: 0,
    dietCo2: 0,
    wasteCo2: 0,
    city: "",
    climate: "temperate",
    airQuality: "moderate",
    thermalSensation: "mild",
  });

  const { data: currentFootprint } = useQuery({
    queryKey: ["/api/carbon/current"],
    queryFn: () => apiRequest("GET", "/api/carbon/current").then(r => r.json()),
    enabled: !!user,
  });

  const { data: history } = useQuery({
    queryKey: ["/api/carbon/history"],
    queryFn: () => apiRequest("GET", "/api/carbon/history").then(r => r.json()),
    enabled: !!user,
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      
      return apiRequest("POST", "/api/carbon/calculate", {
        ...formData,
        totalCo2: formData.transportCo2 + formData.energyCo2 + formData.dietCo2 + formData.wasteCo2,
        monthYear,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carbon/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carbon/history"] });
      toast({ title: "✅ Huella de carbono calculada", description: "Tu datos fueron guardados" });
      setFormData({
        transportCo2: 0,
        energyCo2: 0,
        dietCo2: 0,
        wasteCo2: 0,
        city: "",
        climate: "temperate",
        airQuality: "moderate",
        thermalSensation: "mild",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo calcular la huella de carbono" });
    },
  });

  const categories = [
    { key: "transportCo2", label: "Transporte", icon: Cloud, color: "#3b82f6" },
    { key: "energyCo2", label: "Energía", icon: Zap, color: "#fbbf24" },
    { key: "dietCo2", label: "Dieta", icon: Leaf, color: "#10b981" },
    { key: "wasteCo2", label: "Residuos", icon: Trash2, color: "#ef4444" },
  ];

  const getRecommendations = () => {
    const total = formData.transportCo2 + formData.energyCo2 + formData.dietCo2 + formData.wasteCo2;
    const recommendations = [];

    if (formData.transportCo2 > 5) {
      recommendations.push("🚗 Usa transporte público o bicicleta cuando sea posible");
    }
    if (formData.energyCo2 > 3) {
      recommendations.push("⚡ Cambia a energías renovables y reduce el consumo de electricidad");
    }
    if (formData.dietCo2 > 4) {
      recommendations.push("🌱 Considera una dieta más basada en plantas");
    }
    if (formData.wasteCo2 > 2) {
      recommendations.push("♻️ Aumenta el reciclaje y reduce el consumo");
    }

    return recommendations.length > 0 ? recommendations : ["✨ ¡Excelente! Mantén tus hábitos sostenibles"];
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Inicia sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Debes iniciar sesión para usar la calculadora de huella de carbono</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <Cloud className="h-10 w-10 text-blue-500" />
          Calculadora de Huella de Carbono
        </h1>
        <p className="text-muted-foreground">Calcula y monitorea tu impacto ambiental</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calcula tu huella de carbono</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Métricas de CO2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4" />
                      {label} (kg CO2/mes)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={(formData as any)[key]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="bg-background border-border"
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>

              {/* Información ambiental */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-sm">Tu Entorno</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Tu ciudad"
                    className="bg-background border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="climate">Clima</Label>
                    <Select value={formData.climate} onValueChange={(v) => setFormData(prev => ({ ...prev, climate: v }))}>
                      <SelectTrigger id="climate" className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tropical">Tropical</SelectItem>
                        <SelectItem value="temperate">Templado</SelectItem>
                        <SelectItem value="arid">Árido</SelectItem>
                        <SelectItem value="cold">Frío</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thermal">Sensación Térmica</Label>
                    <Select value={formData.thermalSensation} onValueChange={(v) => setFormData(prev => ({ ...prev, thermalSensation: v }))}>
                      <SelectTrigger id="thermal" className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Caluroso</SelectItem>
                        <SelectItem value="warm">Cálido</SelectItem>
                        <SelectItem value="mild">Templado</SelectItem>
                        <SelectItem value="cold">Frío</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="air">Calidad del Aire</Label>
                  <Select value={formData.airQuality} onValueChange={(v) => setFormData(prev => ({ ...prev, airQuality: v }))}>
                    <SelectTrigger id="air" className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Buena</SelectItem>
                      <SelectItem value="moderate">Moderada</SelectItem>
                      <SelectItem value="poor">Pobre</SelectItem>
                      <SelectItem value="hazardous">Peligrosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => calculateMutation.mutate()}
                disabled={calculateMutation.isPending}
                className="w-full h-12 text-base font-semibold"
              >
                {calculateMutation.isPending ? "Calculando..." : "Calcular Huella de Carbono"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resumen actual */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {currentFootprint && (
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Huella Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {currentFootprint.totalCo2?.toFixed(1) || "0.0"} kg
                </div>
                <p className="text-sm text-muted-foreground">CO2 este mes</p>

                <div className="space-y-2 pt-4 border-t border-border/50">
                  {categories.map(({ key, label }) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{(currentFootprint as any)[key]?.toFixed(1) || "0.0"} kg</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/50 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">RECOMENDACIONES</p>
                  {getRecommendations().map((rec, i) => (
                    <p key={i} className="text-xs text-foreground">{rec}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!currentFootprint && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Wind className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">Calcula tu primera huella de carbono</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Historial */}
      {history && history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Historial de Huella de Carbono</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={history.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthYear" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalCo2" stroke="#3b82f6" name="Total CO2" />
                  <Line type="monotone" dataKey="transportCo2" stroke="#ef4444" name="Transporte" />
                  <Line type="monotone" dataKey="energyCo2" stroke="#fbbf24" name="Energía" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
