import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf } from "lucide-react";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Nombre requerido"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    if ((window as any).Capacitor?.isNative) {
      try {
        const result = await GoogleAuth.signIn();
        if (result && result.email) {
          const res = await fetch("/api/auth/google/native", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: result.email, name: result.name })
          });
          if (res.ok) {
            toast({ title: "¡Bienvenido!", description: "Has iniciado sesión con Google exitosamente." });
            window.location.href = "/dashboard";
          } else {
            const data = await res.json();
            toast({ variant: "destructive", title: "Error", description: data.message || "Error al iniciar sesión con Google." });
          }
        }
      } catch (err: any) {
        console.error("Google Auth Error:", err);
        toast({ variant: "destructive", title: "Error", description: "Error en Google Auth: " + (err.message || "desconocido") });
      }
    } else {
      // Inicia el flujo OAuth en el backend
      window.location.href = "/api/auth/google";
    }
  };

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      toast({ title: "¡Bienvenido de vuelta!", description: "Has iniciado sesión exitosamente." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
      toast({ title: "¡Cuenta creada!", description: "Bienvenido a EcoGuardián." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">

          <h1 className="text-3xl font-display font-bold text-foreground">
            {isLogin ? "Inicia Sesión" : "Únete a la Causa"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Ingresa para continuar reportando" : "Crea tu cuenta y empieza a ganar eco-puntos"}
          </p>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-3xl shadow-xl shadow-black/5 border border-border">
          <div className="flex bg-muted p-1 rounded-xl mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Ingresar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Registrarse
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <div>
                  <Input 
                    type="email" 
                    placeholder="Correo electrónico" 
                    className="h-12 bg-background border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && <p className="text-destructive text-xs mt-1 px-1">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Input 
                    type="password" 
                    placeholder="Contraseña" 
                    className="h-12 bg-background border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && <p className="text-destructive text-xs mt-1 px-1">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" disabled={isLoggingIn} className="w-full h-12 rounded-xl text-md font-semibold bg-primary hover:bg-primary/90 shadow-md">
                  {isLoggingIn ? "Ingresando..." : "Ingresar"}
                </Button>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">o continúa con</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-sm font-semibold text-foreground shadow-sm active:scale-[0.98]"
                >
                  <GoogleIcon />
                  Ingresar con Google
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="space-y-4"
              >
                <div>
                  <Input 
                    placeholder="Nombre completo" 
                    className="h-12 bg-background border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                    {...registerForm.register("name")}
                  />
                  {registerForm.formState.errors.name && <p className="text-destructive text-xs mt-1 px-1">{registerForm.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Input 
                    type="email" 
                    placeholder="Correo electrónico" 
                    className="h-12 bg-background border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && <p className="text-destructive text-xs mt-1 px-1">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Input 
                    type="password" 
                    placeholder="Contraseña" 
                    className="h-12 bg-background border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && <p className="text-destructive text-xs mt-1 px-1">{registerForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" disabled={isRegistering} className="w-full h-12 rounded-xl text-md font-semibold bg-primary hover:bg-primary/90 shadow-md">
                  {isRegistering ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">o regístrate con</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-sm font-semibold text-foreground shadow-sm active:scale-[0.98]"
                >
                  <GoogleIcon />
                  Registrarse con Google
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}