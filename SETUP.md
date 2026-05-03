# 🚀 Guía de Inicialización - EcoGuardian

## Paso 1: Crear las tablas en la BD
Ejecuta las migraciones para crear todas las tablas necesarias:

```bash
npm run migrate
```

**Lo que hace:**
- ✅ Crea todas las tablas nuevas (badges, amigos, carbono, etc.)
- ✅ Agrega columnas a la tabla de usuarios (avatar, bio, ciudad, etc.)

## Paso 2: Cargar datos de ejemplo de trivia

```bash
npm run seed:trivia
```

**Lo que hace:**
- ✅ Inserta 10 preguntas de trivia de diferentes categorías
- ✅ Necesario para que los minijuegos funcionen

## Paso 3: Inicia el servidor en desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

---

## ✅ Verificar que todo funciona

### 1. **Perfil de Usuario** (http://localhost:5000/user/1)
- [ ] Debe mostrar nombre, bio, ciudad
- [ ] Debe mostrar botón "Editar Perfil"
- [ ] Al hacer clic en editar, debe cargar datos actuales
- [ ] Debe permitir cambiar foto de perfil

### 2. **Minijuegos** (http://localhost:5000/minigames)
- [ ] Debe cargar una pregunta diaria
- [ ] Debe mostrar 4 opciones de respuesta
- [ ] Debe tener un botón "Responder"
- [ ] Al responder, debe mostrar si es correcto o incorrecto

### 3. **Marketplace** (http://localhost:5000/marketplace)
- [ ] Debe listar productos
- [ ] Debe permitir crear nuevo producto
- [ ] Debe permitir filtrar por categoría

### 4. **Reels** (http://localhost:5000/reels)
- [ ] Debe mostrar videos
- [ ] Debe permitir reaccionar
- [ ] Debe permitir comentar

### 5. **Calculadora de Carbono** (http://localhost:5000/carbon)
- [ ] Debe permitir ingresar datos
- [ ] Debe mostrar gráfico
- [ ] Debe guardar histórico

---

## 🐛 Troubleshooting

### El perfil no muestra datos
→ Verifica que el usuario exista en la BD. Usa `/user/1` en la URL.

### Los minijuegos no cargan
→ Ejecuta `npm run seed:trivia` para cargar preguntas de ejemplo.

### Error "column does not exist"
→ Ejecuta `npm run migrate` para crear las nuevas columnas.

### Las fotos no se suben
→ Verifica que las credenciales de Cloudinary estén en `.env`

---

## 📋 Orden de ejecución recomendado

1. `npm run migrate` (crear tablas)
2. `npm run seed:trivia` (cargar preguntas)
3. `npm run dev` (iniciar servidor)
4. Abre http://localhost:5000 en el navegador

¡Listo! 🎉
