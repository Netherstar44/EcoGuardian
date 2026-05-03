# 🌱 EcoGuardian - Plataforma Ambiental Social

> Una aplicación web moderna enfocada en problemas ambientales. Permite que los usuarios reporten incidentes ecológicos, compartan consejos, calculen su huella de carbono y creen una comunidad de guardianes ambientales.

---

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [✨ Novedades Recientes](#-novedades-recientes)
- [📱 Características Principales](#-características-principales)
- [🏗️ Stack Tecnológico](#-stack-tecnológico)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [🔧 Configuración](#-configuración)
- [📚 Documentación Adicional](#-documentación-adicional)

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar migraciones de base de datos
npm run migrate

# 3. Iniciar servidor en desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

---

## ✨ Novedades Recientes

### 🔍 Búsqueda Global Mejorada (v2.1)

**Problema Resuelto:**
- La página de búsqueda no mostraba los mismos elementos que Community
- Las reacciones no funcionaban (emojis)
- Los comentarios no tenían la misma funcionalidad
- No se podía buscar nuevamente sin presionar un botón

**Soluciones Implementadas:**

#### 1️⃣ **Búsqueda Automática con Debounce**
```typescript
const debouncedQuery = useDebounce(searchInput, 500);
```
- Busca automáticamente mientras escribes (sin presionar botón)
- Debounce de 500ms para evitar requests excesivos
- La URL se actualiza automáticamente

#### 2️⃣ **Reacciones Funcionales y Animadas**
- ✅ Emojis de reacciones (Me gusta, Me encanta, Me importa, Me divierte, Me asombra, Me entristece, Me enoja)
- ✅ Animaciones al pasar el mouse
- ✅ Panel de selección de reacciones
- ✅ Contador de reacciones totales
- **Fix:** Cambio de payload `reaction: id` → `type: id`

#### 3️⃣ **Comentarios con Soporte Emoji**
- ✅ Botón emoji (😀) en la sección de comentarios
- ✅ Emoji picker integrado
- ✅ Insertar emojis en tiempo real
- ✅ Ver nombre de autor en cada comentario
- ✅ Timestamp formateado en español

#### 4️⃣ **UI/UX Consistente con Community**
- ✅ Misma galería de imágenes con lightbox (keyboard nav, thumbnails)
- ✅ Mismos datos de autor (nombre, puntos)
- ✅ Categoría de reporte visible
- ✅ Ubicación si está disponible
- ✅ Formato de fecha consistente

#### 5️⃣ **Datos Enriquecidos del Backend**
```typescript
// globalSearch ahora incluye author info completo
const postResults = await Promise.all(postResultsRaw.map(async (p) => {
  const author = await this.getUser(p.userId);
  return {
    ...p,
    author: { id: author!.id, name: author!.name, points: author!.points }
  };
}));
```

### 📋 Cambios Técnicos

**Archivo Modificado:** `client/src/pages/SearchResults.tsx`

```diff
✅ Agregado: useDebounce hook para búsqueda automática
✅ Agregado: useMutation para reacciones con invalidación
✅ Agregado: useMutation para comentarios con invalidación
✅ Agregado: EmojiPicker para comentarios
✅ Arreglado: API payload (type vs reaction)
✅ Arreglado: Falta de imports (buildUrl, format, createPortal)
✅ Agregado: queryClient para invalidar queries después de mutaciones
```

---

## 📱 Características Principales

### 🏠 Community
**URL:** `/community`
- Feed de posts ambientales
- Reacciones animadas con emojis
- Comentarios con emoji picker
- Galerías de imágenes con lightbox
- Crear posts nuevos

### 🔍 Búsqueda Global (NEW!)
**URL:** `/search?q=...`
- Búsqueda automática mientras escribes
- Filtro por tipo (Personas / Publicaciones)
- Resultados en tiempo real
- Misma experiencia que Community

### 📍 Mapa de Reportes
**URL:** `/dashboard`
- Visualización de reportes en mapa interactivo
- Vista de lista alternativa
- Gráficas por categoría
- Análisis de problemas ambientales

### 📝 Crear Reporte
**URL:** `/create-report`
- Formulario estructurado
- Selección de ubicación en mapa
- Carga de imágenes
- Categorización automática

### 🌡️ Calculadora de Huella de Carbono
**URL:** `/carbon`
- Cálculo de emisiones CO2
- Métricas de transporte, energía, dieta, residuos
- Historial mensual
- Recomendaciones personalizadas

### 🛍️ Marketplace Ecológico
**URL:** `/marketplace`
- Compra/venta de productos sostenibles
- Categorías especializadas
- Filtrado por precio
- Sistema de vendedores

### 🎬 Reels
**URL:** `/reels`
- Videos cortos sobre sostenibilidad
- Reacciones y comentarios
- Interfaz TikTok-like

### 👥 Amigos & Mensajes
**URL:** `/friends` y `/messages`
- Solicitudes de amistad
- Mensajes directos
- Gestión de contactos

### 🏆 Leaderboard
**URL:** `/leaderboard`
- Ranking de eco-guardianes
- Podio para top 3
- Tu posición y percentil
- Eco-puntos como moneda

### 📚 Educación
**URL:** `/education`
- Contenido educativo
- Trivia ambiental
- Consejos de sostenibilidad

### 🌤️ Clima
**URL:** `/weather`
- Pronóstico del clima
- Alertas ambientales
- Datos en tiempo real

---

## 🏗️ Stack Tecnológico

### **Frontend**
- **React 18** con TypeScript
- **Wouter** para routing SPA
- **TanStack Query** para data fetching y caching
- **Framer Motion** para animaciones
- **Tailwind CSS** para estilos
- **Shadcn/ui** para componentes accesibles
- **Emoji Picker React** para emojis
- **Date-fns** para manipulación de fechas

### **Backend**
- **Node.js + Express** 
- **Drizzle ORM** para gestión de BD
- **PostgreSQL** para persistencia
- **TypeScript** para seguridad de tipos

### **DevOps**
- **Vite** para build y dev server
- **npm** para package management
- **Git** para versionado

---

## 📂 Estructura del Proyecto

```
EcoGuardian/
├── client/                    # Código frontend React
│   ├── src/
│   │   ├── pages/            # Página de cada sección
│   │   │   ├── Community.tsx  # Feed social
│   │   │   ├── SearchResults.tsx  # [NEW] Búsqueda mejorada
│   │   │   ├── CreateReport.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── layout/       # AppLayout, Sidebars
│   │   │   └── ui/           # Componentes Shadcn
│   │   ├── hooks/            # Custom hooks (useDebounce, useAuth, etc.)
│   │   └── lib/              # Utilidades (queryClient, etc.)
│   └── index.html
├── server/                    # Código backend Node.js
│   ├── routes.ts             # Rutas API
│   ├── storage.ts            # Base de datos (globalSearch mejorado)
│   └── index.ts              # Servidor Express
├── shared/                    # Código compartido
│   ├── routes.ts             # Definición de rutas API
│   └── schema.ts             # Esquemas Zod
└── README.md                 # Este archivo
```

---

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/ecog

# API (si aplica)
VITE_API_URL=http://localhost:5173

# Otros
VITE_MODE=development
```

### Migrar Base de Datos

```bash
npm run migrate
```

### Seed de Datos (Opcional)

```bash
npm run seed
```

---

## 🔍 SearchResults - Detalles de Implementación

### Flujo de Búsqueda

```
Usuario escribe → Debounce 500ms → useQuery ejecuta búsqueda
                                  ↓
                           Backend /api/search
                                  ↓
                        Posts + Users con autor info
                                  ↓
                          Mostrar resultados filtrados
```

### Mutaciones (Reacciones & Comentarios)

```typescript
// Reacciones
POST /api/posts/:id/reactions
Body: { type: "like" | "love" | "care" | ... }
Response: { success: true }

// Comentarios
POST /api/posts/:id/comments
Body: { content: "Mi comentario 😊" }
Response: { id, content, author, createdAt, ... }

GET /api/posts/:id/comments
Response: [{ ...comment1 }, { ...comment2 }, ...]
```

### Query Invalidation

Después de cualquier mutación (reacción o comentario), invalidamos:
```typescript
queryClient.invalidateQueries({ queryKey: [reactionsUrl] });
queryClient.invalidateQueries({ queryKey: [commentsUrl] });
```

Esto fuerza un re-fetch automático, manteniendo la UI sincronizada.

---

## 📚 Documentación Adicional

- **[BUGS_FIXED.md](./BUGS_FIXED.md)** - Bugs corregidos en desarrollo
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Mejoras realizadas
- **[QUICK_START.md](./QUICK_START.md)** - Guía rápida de inicio
- **[SETUP.md](./SETUP.md)** - Instrucciones de configuración detallada

---

## 🚀 Próximas Mejoras Planificadas

- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Modo offline con ServiceWorker
- [ ] Temas personalizados (dark/light mode)
- [ ] Exportar datos de usuario
- [ ] Integración con redes sociales
- [ ] Caché mejorado con IndexedDB
- [ ] Analytics y tracking mejorado

---

## 🤝 Contribuir

Este es un proyecto en desarrollo activo. Para contribuir:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-caracteristica`
3. Commitea cambios: `git commit -m 'Agregar nueva característica'`
4. Push a la rama: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

---

## 📝 Notas de Desarrollo

### Comandos útiles

```bash
# Desarrollo
npm run dev          # Inicia servidor en localhost:5173

# Build
npm run build        # Compilar para producción

# Testing
npm run test         # Ejecutar tests (si existen)

# Base de datos
npm run migrate      # Ejecutar migraciones
npm run seed         # Seed con datos iniciales

# Limpieza
npm run clean        # Limpiar dist/build
```

### Debugging

- Usa React DevTools para inspeccionar componentes
- Usa Redux DevTools para ver query cache (TanStack Query)
- Revisa la consola del navegador para errores
- Backend logs en terminal

---

## 📄 Licencia

Proyecto educativo. Todos los derechos reservados © 2026.

---

## 👨‍💻 Autor

Desarrollado como plataforma ambiental social moderna.

**Última actualización:** Marzo 7, 2026  
**Versión:** 2.1 (Búsqueda Mejorada)
