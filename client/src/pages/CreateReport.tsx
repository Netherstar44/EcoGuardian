import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateReport } from "@/hooks/use-reports";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, UploadCloud } from "lucide-react";

// Use partial schema rules but strict for form
const reportSchema = z.object({
  title: z.string().min(5, "El título debe ser más descriptivo"),
  description: z.string().min(10, "Describe un poco más el problema"),
  type: z.enum(['basura', 'contaminación de agua', 'deforestación', 'contaminación del aire'], {
    required_error: "Selecciona un tipo",
  }),
  location: z.string().min(3, "Ingresa una referencia de ubicación"),
});

export default function CreateReport() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { mutateAsync: createReport, isPending } = useCreateReport();
  const { toast } = useToast();
  
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [imageStr, setImageStr] = useState<string | null>(null);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
  });

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Archivo muy grande", description: "Máximo 5MB permitidos." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageStr(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: z.infer<typeof reportSchema>) => {
    if (!coordinates) {
      toast({ variant: "destructive", title: "Ubicación requerida", description: "Por favor marca el punto en el mapa." });
      return;
    }

    try {
      await createReport({
        ...data,
        latitude: coordinates[0],
        longitude: coordinates[1],
        imageBase64: imageStr || undefined,
      });
      toast({ title: "¡Reporte creado!", description: "Has ganado eco-puntos por tu contribución. 🌱" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-display font-bold text-foreground">Reportar Problema</h1>
        <p className="text-muted-foreground mt-2">Ayuda a tu comunidad documentando incidencias ambientales.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-card p-6 md:p-8 rounded-3xl shadow-lg border border-border space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Título del reporte</label>
            <Input 
              placeholder="Ej: Basurero clandestino en el parque" 
              className="h-12 bg-background rounded-xl focus-visible:ring-primary"
              {...form.register("title")}
            />
            {form.formState.errors.title && <p className="text-xs text-destructive px-1">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Categoría</label>
            <select 
              className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              {...form.register("type")}
            >
              <option value="">Selecciona el tipo de problema...</option>
              <option value="basura">Residuos y Basuras</option>
              <option value="contaminación de agua">Contaminación de Agua</option>
              <option value="deforestación">Deforestación / Tala</option>
              <option value="contaminación del aire">Contaminación del Aire</option>
            </select>
            {form.formState.errors.type && <p className="text-xs text-destructive px-1">{form.formState.errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Descripción detallada</label>
            <Textarea 
              placeholder="Describe lo que ves, desde cuándo está el problema, etc..." 
              className="min-h-[120px] bg-background rounded-xl focus-visible:ring-primary resize-none"
              {...form.register("description")}
            />
            {form.formState.errors.description && <p className="text-xs text-destructive px-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Evidencia Fotográfica (Opcional)</label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-xl bg-background hover:bg-secondary/50 transition-colors">
              <div className="space-y-2 text-center">
                {imageStr ? (
                  <div className="relative inline-block">
                    <img src={imageStr} alt="Preview" className="max-h-48 rounded-lg shadow-md" />
                    <button type="button" onClick={() => setImageStr(null)} className="absolute -top-3 -right-3 bg-destructive text-white rounded-full p-1 shadow-lg">✕</button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-primary hover:text-primary/80 focus-within:outline-none">
                        <span>Sube un archivo</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="bg-card p-6 md:p-8 rounded-3xl shadow-lg border border-border space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Ubicación
            </label>
            <Input 
              placeholder="Dirección o barrio (Ej: Carrera 7 # 45, Chapinero)" 
              className="h-12 bg-background rounded-xl focus-visible:ring-primary mb-4"
              {...form.register("location")}
            />
            {form.formState.errors.location && <p className="text-xs text-destructive px-1 mb-4">{form.formState.errors.location.message}</p>}
            
            <LocationPicker 
              onLocationSelect={(lat, lng) => setCoordinates([lat, lng])} 
            />
            {!coordinates && <p className="text-xs text-destructive mt-2">Haz clic en el mapa para confirmar las coordenadas exactas.</p>}
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full md:w-auto h-14 px-10 text-lg font-bold rounded-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1"
          >
            {isPending ? "Enviando Reporte..." : "Publicar Reporte"}
          </Button>
        </div>
      </form>
    </div>
  );
}
