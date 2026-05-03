# Guía de Despliegue en Vercel - EcoGuardián

He dejado listos los archivos base (`blueprint`) para que puedas subir la aplicación a Vercel con unos pocos clics. 

## 1. Archivos Creados
- **`vercel.json`**: Le dice a Vercel que el frontend (Vite) va como estático y todo lo que apunte a `/api` debe ser procesado como funciones *Serverless* usando Node.js.
- **`api/index.ts`**: Es el punto de entrada oficial que requiere Vercel para ejecutar tu backend de Express.
- **`server/index.ts`**: Fue modificado ligeramente para que sea compatible tanto con tu servidor local como con el entorno *Serverless* de Vercel.

## 2. Pasos para el Despliegue

1. **Sube tu código a GitHub** (asegúrate de que no se suba tu archivo `.env`).
2. Crea una cuenta gratuita en [Vercel](https://vercel.com) e inicia sesión con GitHub.
3. Haz clic en **"Add New"** > **"Project"** y selecciona tu repositorio de EcoGuardián.

## 3. Variables de Entorno
Antes de darle al botón "Deploy" en Vercel, despliega la pestaña de **Environment Variables** y añade las siguientes claves (usando los datos reales de tu nube):

| Clave | Valor (Ejemplo) |
|---|---|
| `DATABASE_URL` | `postgresql://usuario:password@host/database` (Obtenlo de Neon.tech o Supabase) |
| `SESSION_SECRET` | `un_secreto_super_seguro_para_produccion_123` (Cualquier texto aleatorio) |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `GROK_API_KEY` | `gsk_tu_clave_de_groq...` |
| `GOOGLE_CLIENT_ID` | `tu_google_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `tu_google_client_secret` |
| `GOOGLE_CALLBACK_URL` | `https://TU_DOMINIO_DE_VERCEL.vercel.app/api/auth/google/callback` |
| `NODE_ENV` | `production` |
| `VERCEL` | `1` |

Una vez puestas, dale a **Deploy**.

## 4. Conectar la App Móvil
Cuando Vercel termine, te dará un enlace como `https://ecoguardian.vercel.app`.
En ese momento, solo ve a tu archivo `capacitor.config.ts`, cambia la url y compila:

```ts
server: {
  url: 'https://ecoguardian.vercel.app',
  cleartext: true,
}
```
¡Y tu app será totalmente independiente del PC local!
