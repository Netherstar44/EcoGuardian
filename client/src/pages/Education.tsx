import { BookOpen, TreePine, Droplets, Wind, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const articles = [
  {
    title: "El impacto de la basura en el ecosistema",
    description: "Conoce cómo una simple botella plástica puede alterar toda una cadena alimenticia en nuestros páramos.",
    icon: Trash2,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Protegiendo nuestros ríos",
    description: "Los ríos en Colombia son las venas del país. Aprende prácticas desde casa para evitar contaminarlos.",
    icon: Droplets,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Deforestación: El pulmón en peligro",
    description: "La tala indiscriminada afecta la Amazonía. Descubre qué productos evitar para no fomentar esta práctica.",
    icon: TreePine,
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Calidad del aire urbano",
    description: "Bogotá y Medellín enfrentan retos de aire. Tips para reducir tu huella de carbono en la ciudad.",
    icon: Wind,
    color: "bg-slate-100 text-slate-600",
  }
];

export default function Education() {
  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" /> Centro de Aprendizaje
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">La educación es el primer paso para la conservación.</p>
        </div>
      </div>

      {/* Hero Article */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-12 group">
        {/* landing page hero scenic mountain landscape */}
        <img 
          src="https://pixabay.com/get/gd84da7edb74fe0bec0588643b454d9981e4d17c2e55a0b3a2862048e00765bb620c1371c70f695259f88f673e2f408d17e6e17a905414dcb891241a3397dbf5a_1280.jpg" 
          alt="Bosque colombiano" 
          className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12">
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-max mb-4">
            Lectura Recomendada
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
            Biodiversidad en Colombia: <br/>Nuestro Tesoro Nacional
          </h2>
          <p className="text-gray-200 max-w-2xl text-lg mb-6">
            Colombia es el segundo país más biodiverso del mundo. Entender nuestro ecosistema es vital para las futuras generaciones.
          </p>
          <button className="bg-white text-black font-bold py-3 px-8 rounded-full w-max hover:bg-gray-100 transition-colors">
            Leer Artículo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-3xl p-6 shadow-lg shadow-black/5 border border-border hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${article.color}`}>
              <article.icon className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg mb-3 text-foreground font-display">{article.title}</h3>
            <p className="text-muted-foreground text-sm flex-1 leading-relaxed">{article.description}</p>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="text-primary font-semibold text-sm hover:underline">Leer más →</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sección de Creadores */}
      <div className="mt-20 pt-20 border-t border-border/50">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-4xl font-display font-bold text-foreground text-center mb-3">
            Los Guardianes de EcoGuardian
          </h2>
          <p className="text-muted-foreground text-lg text-center max-w-2xl">
            Conoce al equipo de desarrolladores apasionados por proteger nuestro planeta
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Borde gradiente decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-green-500/30 rounded-3xl blur-xl -z-10" />
          
          {/* Borde alusivo con efecto eco */}
          <div className="p-1 rounded-3xl bg-gradient-to-br from-primary via-accent to-green-500">
            <div className="rounded-3xl overflow-hidden bg-background">
              <img 
                src="/creators.png" 
                alt="Equipo de desarrolladores de EcoGuardian" 
                className="w-full h-auto object-cover rounded-3xl hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Decoración de hojas */}
          <div className="absolute -top-4 -left-4 text-primary opacity-50 text-3xl">🌿</div>
          <div className="absolute -bottom-4 -right-4 text-accent opacity-50 text-3xl">🍃</div>
        </motion.div>
      </div>
    </div>
  );
}
