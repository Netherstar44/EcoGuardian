import { Link } from "wouter";
import { motion } from "framer-motion";
import { Leaf, Shield, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-[80vh] py-12">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto text-center px-4 mb-20 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20">
            Juntos por una Colombia más limpia 🇨🇴
          </span>
          <h1 className="text-5xl md:text-7xl font-bold font-display text-foreground leading-tight mb-6">
            Conviértete en un <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              EcoGuardián
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Reporta problemáticas ambientales en tu comunidad, gana eco-puntos, y únete a miles de ciudadanos que están marcando la diferencia.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create-report">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all h-14">
                Reportar Problema <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 rounded-full h-14 hover:bg-secondary">
                Ver Mapa de Reportes
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Shield className="h-8 w-8 text-primary" />}
            title="Reporta con Precisión"
            description="Toma una foto, ubica el problema en el mapa y clasifícalo para que las autoridades y la comunidad actúen."
            delay={0.2}
          />
          <FeatureCard 
            icon={<Leaf className="h-8 w-8 text-primary" />}
            title="Gana Eco-Puntos"
            description="Cada reporte válido te otorga puntos. Sube de nivel y conviértete en un líder ambiental de tu región."
            delay={0.4}
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Comunidad Activa"
            description="Comenta en los reportes de otros, valida información y organiza jornadas de limpieza con tus vecinos."
            delay={0.6}
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-card p-8 rounded-3xl shadow-lg shadow-black/5 border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all group"
    >
      <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
