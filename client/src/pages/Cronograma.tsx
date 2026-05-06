import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, Clock, AlertTriangle, CheckCircle, Bell, RefreshCw, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useToast } from "@/hooks/use-toast";

export default function Cronograma() {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [hasTakenOutTrash, setHasTakenOutTrash] = useState(false);
  const [remindersActive, setRemindersActive] = useState(false);

  // Get user location
  const getLocation = async () => {
    setLocating(true);
    try {
      const position = await Geolocation.getCurrentPosition();
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (e) {
      console.error("Error getting location", e);
      // Fallback a Neiva para demostración si falla el GPS
      toast({
        title: "Usando ubicación de prueba (Neiva)",
        description: "No se pudo obtener tu ubicación actual.",
        variant: "destructive",
      });
      setLocation({ lat: 2.9273, lng: -75.28189 }); // Neiva, Huila
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    getLocation();
    
    // Request notification permissions gracefully
    try {
      LocalNotifications.requestPermissions().then((res) => {
        if (res.display !== 'granted') {
          console.warn("Notification permissions not granted");
        }
      });
    } catch (e) {
      console.warn("LocalNotifications not available on this platform");
    }

    // Cleanup notifications if component unmounts
    return () => {
      try {
        LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      } catch (e) {}
    };
  }, []);

  // Fetch garbage collection schedule based on location
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["garbage-schedule", location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return null;
      
      const url = `https://services3.arcgis.com/AXq3Dn4HcfwK4wcs/arcgis/rest/services/Recoleccion_202305_NEW1/FeatureServer/1/query?geometry={"x":${location.lng},"y":${location.lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&f=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].attributes;
      }
      return null;
    },
    enabled: !!location,
  });

  // Setup reminders
  const startReminders = async () => {
    setRemindersActive(true);
    setHasTakenOutTrash(false);
    toast({
      title: "Recordatorios activados",
      description: "Te avisaremos para que saques la basura.",
    });

    // Schedule a recurring notification (every 5 minutes)
    // Note: LocalNotifications on Capacitor doesn't easily do "every X minutes" precisely via schedule, 
    // but we can schedule a bunch of them or use a background task. 
    // For demo purposes, we schedule one in 10 seconds and simulate the loop.
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "¡Hora de sacar la basura! ♻️",
            body: "¿Ya sacaste la basura? Entra a EcoGuardian y confirma para dejar de recibir alertas.",
            id: 1,
            schedule: { at: new Date(Date.now() + 1000 * 10), repeats: true, every: 'minute' }, // Repeats every minute for testing
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } catch (e) {
      console.warn("Could not schedule local notification", e);
      toast({
        title: "Recordatorio Local",
        description: "En la versión web, recibirás un recordatorio en pantalla pronto.",
      });
    }
  };

  const confirmTrashTakenOut = async () => {
    setHasTakenOutTrash(true);
    setRemindersActive(false);
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    } catch (e) {
      console.warn("Could not cancel local notification", e);
    }
    
    toast({
      title: "¡Gracias por cuidar el planeta! 🌍",
      description: "Has confirmado que sacaste la basura.",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Cronograma de Recolección</h1>
        <p className="text-muted-foreground">
          Conoce los horarios de recolección de residuos en tu zona y configura recordatorios.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Schedule Info */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Tu Zona Actual
            </CardTitle>
            <CardDescription>Basado en tu ubicación GPS</CardDescription>
          </CardHeader>
          <CardContent>
            {locating ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <p className="text-sm text-muted-foreground animate-pulse">Obteniendo ubicación...</p>
              </div>
            ) : !location ? (
              <div className="text-center py-4">
                <Button onClick={getLocation}>Obtener Mi Ubicación</Button>
              </div>
            ) : isLoadingSchedule ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : schedule ? (
              <div className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Días de recolección</h3>
                    <p className="text-lg font-medium">{schedule.FRECUENCIA}</p>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Horario ({schedule.TURNO})</h3>
                    <p className="text-lg font-medium">{schedule.HORAINICIO} - {schedule.HORAFIN}</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Macrorruta: {schedule.MACRORRUTA} | Servicio: {schedule.SERVICIO}
                </p>
              </div>
            ) : (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <p>No se encontraron horarios para tu ubicación actual.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t bg-muted/50 p-4">
             {schedule && (
               <div className="w-full flex flex-col items-center gap-3">
                 {!remindersActive && !hasTakenOutTrash ? (
                   <Button onClick={startReminders} className="w-full bg-green-600 hover:bg-green-700">
                     <Bell className="mr-2 h-4 w-4" /> Notificarme cuando pase
                   </Button>
                 ) : remindersActive ? (
                   <div className="w-full space-y-3">
                     <div className="flex items-center justify-center gap-2 text-amber-600 font-medium">
                       <RefreshCw className="h-4 w-4 animate-spin" />
                       Esperando confirmación...
                     </div>
                     <Button onClick={confirmTrashTakenOut} className="w-full bg-primary hover:bg-primary/90">
                       <CheckCircle className="mr-2 h-5 w-5" /> ¡Ya saqué la basura!
                     </Button>
                   </div>
                 ) : (
                   <div className="flex items-center justify-center gap-2 text-green-600 font-medium w-full p-2 bg-green-50 rounded-md">
                     <CheckCircle className="h-5 w-5" />
                     Basura sacada correctamente hoy
                   </div>
                 )}
               </div>
             )}
          </CardFooter>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Tips para sacar la basura
            </CardTitle>
            <CardDescription>Ayuda a preservar el medio ambiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex gap-3 items-start border-b pb-3">
              <div className="bg-green-100 p-2 rounded-full text-green-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Separa los residuos</h4>
                <p className="text-sm text-muted-foreground">Usa bolsas distintas para reciclables (plástico, cartón, latas) y orgánicos/no aprovechables.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-b pb-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Cuidado con el Vidrio</h4>
                <p className="text-sm text-muted-foreground">Envuelve los vidrios rotos en papel periódico o mételos en una caja de cartón marcada para evitar cortes a los recolectores.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-b pb-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Sácala a tiempo</h4>
                <p className="text-sm text-muted-foreground">Presenta los residuos en la acera máximo 2 horas antes de que pase el camión para evitar desorden o que los animales la rompan.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="bg-purple-100 p-2 rounded-full text-purple-700">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Evita obstruir</h4>
                <p className="text-sm text-muted-foreground">Coloca las bolsas en el andén frente a tu predio, sin obstaculizar el paso peatonal.</p>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
