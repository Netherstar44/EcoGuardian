import { Smartphone, Download, ShieldCheck, Zap, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DownloadApp() {
  const handleDownload = () => {
    // This would ideally point to the actual APK file
    // For now, it's a placeholder as requested
    window.location.href = "/EcoGuardian.apk";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 pb-20">
      <header className="w-full max-w-md flex items-center mb-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="flex-1 text-center font-bold text-xl pr-10">Descargar App</h1>
      </header>

      <main className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary to-accent p-8 rounded-[2.5rem] shadow-2xl">
            <Smartphone className="h-24 w-24 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tight">EcoGuardian Native</h2>
          <p className="text-muted-foreground text-lg px-4">
            Lleva la protección del medio ambiente en tu bolsillo con nuestra app oficial para Android.
          </p>
        </div>

        <div className="w-full grid gap-4">
          <Button 
            size="lg" 
            className="h-16 text-lg font-bold rounded-2xl shadow-lg gap-3"
            onClick={handleDownload}
          >
            <Download className="h-6 w-6" /> Descargar APK
          </Button>
          <p className="text-[10px] text-muted-foreground">Versión 1.0.0 (Android 8.0+)</p>
        </div>

        <div className="w-full pt-6 grid grid-cols-1 gap-6 text-left">
          <div className="flex gap-4 items-start bg-muted/50 p-4 rounded-2xl">
            <Zap className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-bold">Más rápida</p>
              <p className="text-sm text-muted-foreground">Navegación fluida y carga instantánea de contenido.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start bg-muted/50 p-4 rounded-2xl">
            <Globe className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-bold">Fuera de línea</p>
              <p className="text-sm text-muted-foreground">Guarda reportes y consulta información sin conexión.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start bg-muted/50 p-4 rounded-2xl">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-bold">Notificaciones</p>
              <p className="text-sm text-muted-foreground">Alertas en tiempo real sobre tu comunidad.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground opacity-50">
        EcoGuardian © 2026 • Advanced Agentic Coding
      </footer>
    </div>
  );
}
