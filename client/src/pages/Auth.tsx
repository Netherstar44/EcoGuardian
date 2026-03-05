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
          <div className="inline-flex bg-primary/10 p-3 rounded-2xl mb-4">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
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
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
