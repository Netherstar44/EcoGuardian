# 📐 Layout Facebook - Documentación

## Estructura del Nuevo Layout

Tu aplicación ahora tiene una estructura de **3 columnas tipo Facebook**:

### 1. **Componentes Creados**

#### `LeftSidebar.tsx`
- **Ubicación**: `client/src/components/layout/LeftSidebar.tsx`
- **Contenido**:
  - Navegación principal (Reportar, Crear, Muro, Ranking)
  - Navegación secundaria (Carbono, Marketplace, Reels, Juegos, Aprende)
  - Se muestra solo en pantallas `lg` (≥1024px)
  - Estilos: Mantiene tus colores y componentes actuales

#### `RightSidebar.tsx`
- **Ubicación**: `client/src/components/layout/RightSidebar.tsx`
- **Contenido**:
  - Widget de Info del Usuario
  - Widget de Actividad Reciente
  - Widget de Sugerencias
  - Widget de Ayuda
- Se muestra solo en pantallas `xl` (≥1280px)
- Estilos: Usa tus componentes de card y colores

### 2. **Cambios en AppLayout.tsx**

**Estructura anterior:**
```
Header
└─ Main Content (full width)
└─ Mobile Bottom Nav
```

**Nueva estructura (3 columnas):**
```
Header (fijo en top)
├─ Left Sidebar (navegación)
│  ├─ Principal
│  └─ Explorar
├─ Main Content (children)
│  └─ El contenido de tus páginas
└─ Right Sidebar (widgets)
   ├─ Info Usuario
   ├─ Actividad
   ├─ Sugerencias
   └─ Ayuda
```

### 3. **Comportamiento Responsivo**

#### Pantallas Móviles (< 768px)
- Solo se muestra: **Header + Main Content + Bottom Nav**
- Sidebars ocultos
- Layout: 1 columna
- Ancho completo

#### Tablets (768px - 1023px)
- Se muestra: **Header + Left Sidebar + Main Content + Bottom Nav**
- Right Sidebar oculto
- Layout: 2 columnas
- Left Sidebar visible

#### Desktop Pequeño (1024px - 1279px)
- Se muestra: **Header + Left Sidebar + Main Content + Bottom Nav**
- Right Sidebar oculto
- Layout: 2 columnas

#### Desktop Grande (≥ 1280px)
- Se muestra: **Toda la estructura de 3 columnas**
- Header + Left + Main + Right + Bottom Nav
- Layout: 3 columnas
- Experiencia completa tipo Facebook

### 4. **Classes y Tailwind Usados**

```tailwind
grid grid-cols-1              /* 1 columna en móvil */
md:grid-cols-[1fr_1fr]        /* 2 columnas en tablet */
lg:grid-cols-[256px_1fr_256px] /* 3 columnas en lg */
xl:grid-cols-[256px_1fr_256px] /* 3 columnas en xl */
```

### 5. **Personalización**

#### Cambiar el ancho del sidebar izquierdo:
```tsx
// En AppLayout.tsx, línea del grid:
lg:grid-cols-[256px_1fr_256px]
//              ↑ cambiar 256px
//              por el tamaño que quieras (ej: 300px, 280px)
```

#### Cambiar el ancho del sidebar derecho:
```tsx
lg:grid-cols-[256px_1fr_256px]
//                      ↑ cambiar aquí
```

#### Cambiar gap (espaciado entre columnas):
```tsx
gap-4  // cambiar por gap-6, gap-8, etc.
```

#### Agregar más items al Left Sidebar:
Edita `client/src/components/layout/LeftSidebar.tsx`:
```tsx
const navItems = [
  { href: "/ruta", label: "Mi Sección", icon: MiIcono },
  // agregar más aquí
];
```

#### Agregar widgets al Right Sidebar:
Edita `client/src/components/layout/RightSidebar.tsx` y añade más `<div>` con clase `bg-card border border-border rounded-2xl p-6 shadow-sm`

## 6. **¿Por qué este diseño?**

✅ **Ventajas**:
- Similar a Facebook/redes sociales conocidas
- Escalable: Fácil agregar/quitar sidebars
- Responsivo: Se adapta a cualquier pantalla
- Mantiene tus estilos actuales
- No rompe componentes existentes

## 7. **Pruebas Necesarias**

1. **Móvil** (< 768px):
   - [ ] Solo se ve el feed central
   - [ ] Bottom nav funciona correctamente
   - [ ] Header visible y funcional

2. **Tablet** (768px - 1023px):
   - [ ] Se ve Left Sidebar + Main Content
   - [ ] Right Sidebar oculto
   - [ ] Bottom nav visible

3. **Desktop** (≥ 1280px):
   - [ ] 3 columnas visibles
   - [ ] Left y Right Sidebar visibles
   - [ ] Main content al centro ancho

## 8. **Próximos Pasos Opcionales**

1. Personalizar contenido de Right Sidebar con datos reales
2. Hacer Left Sidebar colapsable en desktop
3. Agregar sidebar drawer en móvil
4. Sincronizar estado del menú móvil con ubicación
