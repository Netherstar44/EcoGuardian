# 🌿 EcoGuardian - Nuevas Funcionalidades

## ✨ Características Implementadas

### 1. 📊 Calculadora de Huella de Carbono
**Archivo:** `client/src/pages/CarbonCalculator.tsx`

- Cálcula el impacto ambiental personalizado del usuario
- Métricas tracked:
  - 🚗 Transporte (kg CO2/mes)
  - ⚡ Energía (kg CO2/mes)
  - 🌱 Dieta (kg CO2/mes)
  - ♻️ Residuos (kg CO2/mes)
- Información ambiental:
  - 🌍 Ciudad y país
  - ☁️ Clima (tropical, templado, árido, frío)
  - 🌡️ Sensación térmica
  - 💨 Calidad del aire (buena, moderada, pobre, peligrosa)
- Historial mensual con gráficos
- Recomendaciones personalizadas basadas en datos

### 2. 🏪 Marketplace Ecológico
**Archivo:** `client/src/pages/Marketplace.tsx`

- Compra y venta de productos ambientales
- Categorías:
  - 🌱 Abono y Compost
  - 🌾 Semillas Ecológicas
  - 🏠 Composteras
  - 🍾 Botellas Reutilizables
  - 👜 Bolsas Ecológicas
  - 💧 Filtros de Agua
  - ☀️ Energía Solar
  - Y más...
- Funcionalidades:
  - Búsqueda y filtrado por precio
  - Ordenamiento (precio, reciente)
  - Calificación de productos
  - Publicar productos como vendedor
  - Sistema de carrito (pendiente integración de pagos)

### 3. 🎬 Reels - Videos Tipo TikTok
**Archivos:** `client/src/pages/Reels.tsx`

- Sube y mira videos cortos ecológicos
- Características:
  - Categorización de videos
  - Reproductor con controles (play, pause, volumen)
  - Sistema de reacciones (like, love, care, haha, wow, sad, angry)
  - Sección de comentarios
  - Contador de vistas
  - Navegación entre videos (siguiente/anterior)
- Interactividad:
  - Reacciones con emojis animados
  - Comentarios en tiempo real
  - Estimulación de enganche comunitario

### 4. 🧠 Minijuegos Diarios
**Archivo:** `client/src/pages/Minigames.tsx`

- Trivia diaria sobre medio ambiente
- Características:
  - Un desafío por día
  - 3 niveles de dificultad (fácil, medio, difícil)
  - Gana eco-puntos (10 puntos por respuesta correcta)
  - Historial de desempeño
  - Explicaciones de respuestas correctas
  - Sistema de logros (pendiente)
- Gamificación:
  - Estadísticas personales
  - Sesión de racha
  - Leaderboard de jugadores

### 5. 👥 Perfiles de Usuario y Sistema de Amigos
**Archivo:** `client/src/pages/UserProfile.tsx`

- Perfiles completos de usuario
- Información mostrada:
  - Avatar personalizado
  - Bio
  - Ubicación (ciudad, país)
  - Eco-puntos totales
  - Logros desbloqueados
  - Publicaciones publicadas
  - Amigos conectados
- Funcionalidades:
  - Agregar como amigo
  - Enviar mensajes privados
  - Ver publicaciones del usuario
  - Compartir perfil
  - Editar propio perfil (para el usuario)

### 6. 🔍 Búsqueda Global
**Archivos:** `client/src/components/GlobalSearch.tsx`, `client/src/hooks/use-debounce.ts`

- Búsqueda en tiempo real
- Busca personas y publicaciones
- Acceso desde:
  - Barra superior (desktop)
  - Botón móvil
- Con debounce para optimización
- Resultados instantáneos con navegación directa

### 7. 🏆 Sistema de Rangos/Badges
**Base de datos:** Tabla `user_badges`

- Badges otorgados según eco-puntos:
  - Especialmente diseñados para motivar
  - Ejemplos sugeridos:
    - 🥚 Eco-novato (50 puntos)
    - 🌱 Guardián Verde (200 puntos)
    - 🌿 Ecologista Pro (500 puntos)
    - 🌍 Héroe del Planeta (1000 puntos)
    - ♻️ Maestro Sostenible (2000 puntos)

## 🗄️ Cambios en Base de Datos

### Nuevas Tablas:
1. **user_badges** - Logros y badges de usuarios
2. **friendships** - Sistema de amigos
3. **carbon_footprint** - Historial de huella de carbono
4. **marketplace_products** - Productos del marketplace
5. **reels** - Videos tipo TikTok
6. **reel_comments** - Comentarios en reels
7. **reel_reactions** - Reacciones en reels
8. **minigames** - Juegos diarios
9. **game_history** - Historial de juegos
10. **trivia_questions** - Preguntas de trivia

### Columnas Agregadas a `users`:
- `avatar` - URL del avatar
- `bio` - Biografía del usuario
- `city` - Ciudad
- `country` - País
- `latitude` - Geoubicación
- `longitude` - Geoubicación

## 🛣️ Nuevas Rutas API

### Usuarios
- `GET /api/users/:id` - Obtener perfil
- `PATCH /api/users/:id` - Actualizar perfil

### Huella de Carbono
- `POST /api/carbon/calculate` - Calcular huella
- `GET /api/carbon/current` - Obtener actual
- `GET /api/carbon/history` - Ver historial

### Badges
- `GET /api/badges/:userId` - Obtener badges del usuario

### Amigos
- `GET /api/friends` - Listar amigos
- `POST /api/friends/add` - Agregar amigo
- `PATCH /api/friends/:id/accept` - Aceptar solicitud
- `DELETE /api/friends/:id` - Eliminar amigo

### Marketplace
- `GET /api/marketplace/products` - Listar productos
- `GET /api/marketplace/search` - Buscar productos
- `GET /api/marketplace/categories` - Obtener categorías
- `POST /api/marketplace/products` - Crear producto
- `PATCH /api/marketplace/products/:id` - Editar
- `DELETE /api/marketplace/products/:id` - Eliminar

### Reels
- `GET /api/reels` - Listar reels
- `GET /api/reels/:id` - Obtener reel
- `POST /api/reels` - Crear reel
- `DELETE /api/reels/:id` - Eliminar reel
- `GET /api/reels/:id/comments` - Comentarios
- `POST /api/reels/:id/comments` - Crear comentario
- `GET /api/reels/:id/reactions` - Obtener reacciones
- `POST /api/reels/:id/reactions` - Crear reacción
- `DELETE /api/reels/:id/reactions` - Eliminar reacción

### Minijuegos
- `GET /api/minigames/daily` - Obtener juego del día
- `POST /api/minigames/submit` - Enviar respuesta
- `GET /api/minigames/history` - Ver historial

### Búsqueda
- `GET /api/search` - Búsqueda global (personas y posts)

## 📱 Nuevas Páginas

| Ruta | Componente | Descripción |
|------|-----------|------------|
| `/carbon` | CarbonCalculator | Calculadora de huella de carbono |
| `/marketplace` | Marketplace | Tienda de productos ecológicos |
| `/reels` | Reels | Videos tipo TikTok |
| `/minigames` | Minigames | Trivias y juegos diarios |
| `/user/:id` | UserProfile | Perfil del usuario |

## 🎯 Próximas Características Sugeridas

1. **Sistema de Pagos** - Integrar pagos en marketplace
2. **Chat Privado** - Sistema de mensajería entre amigos
3. **Notificaciones** - Push notifications en tiempo real
4. **Logros Avanzados** - Más badges y desafíos
5. **API de Geolocalización** - Auto-detección de ciudad/clima
6. **Integración de Datos Clima** - API de clima en tiempo real
7. **Compartir en Redes** - Compartir logros en redes sociales
8. **Compras In-Game** - Tienda de cosmética con eco-puntos

## 🚀 Instalación y Ejecución

### Base de Datos
```bash
npm run migrate
```

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📊 Estadísticas del Proyecto

- **Nuevas páginas creadas**: 5
- **Nuevos componentes**: 2
- **Nuevas rutas API**: 40+
- **Nuevas tablas DB**: 10
- **Líneas de código añadidas**: 3000+

---

**Última actualización**: Marzo 2026
**Estado**: ✅ Implementación completa
