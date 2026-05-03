# 🚀 Guía Rápida - EcoGuardian Nuevas Características

## 🎯 Para Empezar

### 1. Primero, ejecuta la migración de base de datos:
```bash
npm run migrate
```

### 2. Inicia el servidor en desarrollo:
```bash
npm run dev
```

---

## 📱 Nuevas Características Disponibles

### 🌡️ Calculadora de Huella de Carbono
**URL:** `/carbon`

**Qué hace:**
- Calcula tu impacto ambiental en CO2
- Registra métricas de transporte, energía, dieta y residuos
- Muestra información de tu entorno (clima, calidad del aire)
- Proporciona recomendaciones personalizadas
- Historial mensual con gráficos

**Cómo usar:**
1. Ingresa tus datos mensuales de emisiones
2. Completa información sobre tu ubicación y clima
3. Haz clic en "Calcular Huella de Carbono"
4. Revisa tu perfil ambiental y obtén consejos

---

### 🛍️ Marketplace Ecológico
**URL:** `/marketplace`

**Qué hace:**
- Mercado de productos sostenibles
- Categorías: abono, semillas, composteras, botellas, bolsas, filtros, etc.
- Búsqueda y filtrado avanzado

**Cómo usar:**
1. Navega por productos o busca por nombre
2. Filtra por categoría o precio
3. Haz clic en "Vender Producto" para publicar tus artículos
4. Mira detalles de productos y carro de compra

---

### 🎬 EcoReels - Videos Ecológicos
**URL:** `/reels`

**Qué hace:**
- Plataforma tipo TikTok para videos ambientales
- Reacciones, comentarios, categorización
- Sube tus propios videos ecológicos

**Cómo usar:**
1. Mira videos deslizándote hacia arriba/abajo
2. Dale "Like" o reacciona con emojis
3. Lee y escribe comentarios
4. Haz clic en "+Subir Video" para compartir contenido

---

### 🧠 Minijuegos Diarios
**URL:** `/minigames`

**Qué hace:**
- Trivia diaria sobre medio ambiente
- Gana eco-puntos por respuestas correctas
- Diferentes niveles de dificultad

**Cómo usar:**
1. Responde la pregunta del día
2. Selecciona una opción A, B, C o D
3. Obtén feedback inmediato
4. Vuelve mañana para un nuevo desafío

---

### 👥 Perfiles de Usuario
**URL:** `/user/:id`

**Qué hace:**
- Ver perfiles completos de otros usuarios
- Agregar como amigo
- Ver publicaciones y logros
- Compartir perfil

**Cómo usar:**
1. Busca usuarios con la búsqueda global (lupa)
2. Haz clic en un nombre
3. Agrega como amigo
4. Mira sus publicaciones y logros

---

### 🔍 Búsqueda Global
**Acceso:** Barra superior o  botón móvil (🔍)

**Qué hace:**
- Busca personas en tiempo real
- Busca publicaciones
- Navegación rápida a perfiles

**Cómo usar:**
1. Haz clic en el buscador
2. Escribe el nombre de la persona o tema
3. Haz clic en un resultado para ir directo

---

## 🏆 Sistema de Badges/Rangos

Gana rangos a medida que acumulas eco-puntos:

| Rango | Puntos Requeridos | Icono |
|-------|-------------------|-------|
| Eco-Novato | 50 | 🥚 |
| Guardián Verde | 200 | 🌱 |
| Ecologista Pro | 500 | 🌿 |
| Héroe del Planeta | 1000 | 🌍 |
| Maestro Sostenible | 2000 | ♻️ |

---

## 💡 Tips Útiles

### Gana Eco-Puntos:
- ✅ Responde trivias diarias (+10 puntos)
- ✅ Crea publicaciones (+5 puntos)
- ✅ Obtiene reacciones en posts (+1 punto cada una)
- ✅ Calcula tu huella de carbono (+20 puntos)
- ✅ Invita amigos a unirse

### Mejora tu Perfil:
- 📸 Agrega un avatar (foto de perfil)
- ✍️ Escribe una biografía
- 📍 Agrega tu ubicación
- 🌍 Comparte tu visión ambiental

### Monetiza tu Tienda:
- 🛍️ Vende productos ecológicos en el marketplace
- 💰 Establece precios competitivos
- 📸 Usa fotos de buena calidad
- 📝 Escribe descripciones claras

---

## 🐛 Solución de Problemas

### "Me pide login en todas partes"
→ Asegúrate de estar registrado. Ve a `/auth`

### "No veo mis eco-puntos actualizados"
→ Actualiza la página (F5)

### "Error al subir video/foto"
→ Verifica el tamaño del archivo (máx 50MB video, 10MB foto)

### "No puedo agregar amigo"
→ Asegúrate de estar logueado y no ser la misma persona

---

## 📚 Documentación Completa

Ver el archivo `IMPROVEMENTS.md` para:
- Lista completa de rutas API
- Estructura de tablas de BD
- Especificaciones técnicas
- Características futuras

---

## ❓ Preguntas Frecuentes

**¿Puedo ganar dinero real?**
No aún. Los eco-puntos son un sistema de gamificación. La tienda del marketplace está en desarrollo.

**¿Mi comida se rastrea?**
No. Ingresas manualmente tus datos - todo es privado.

**¿Puedo exportar mis datos?**
Sí, pedirlo en el perfil (función en desarrollo).

**¿Hay API pública?**
No aún, pero pronto estará disponible.

---

## 🎨 Personalizaciones

Todas las nuevas páginas usan:
- ✨ Animaciones suaves (Framer Motion)
- 🎨 Tema oscuro/claro (TailwindCSS)
- 📱 Diseño responsivo
- ♿ Accesibilidad completa

---

**¡Disfruta ayudando al planeta con EcoGuardian! 🌍💚**

Última actualización: Marzo 2026
