# 🚀 Desplegando Sigma AI (GitHub & Vercel)

Sigue estos pasos para publicar tu aplicación en internet.

## 1. Preparar para GitHub
Si aún no tienes el código en GitHub, abre la terminal en la carpeta del proyecto y ejecuta:

```bash
# Inicializar git
git init

# Añadir archivos (asegúrate de que .gitignore incluya .env)
git add .
git commit -m "Sigma AI: Login con Google y Onboarding"

# Crear repo en GitHub y subirlo
git remote add origin https://github.com/TU_USUARIO/sigma-ai.git
git branch -M main
git push -u origin main
```

## 2. Desplegar en Vercel
1. Ve a [Vercel](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **"Add New"** -> **"Project"**.
3. Importa tu repositorio `sigma-ai`.
4. **Configuración de Variables de Entorno**:
   En la sección "Environment Variables", añade todas las de tu archivo `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENROUTER_API_KEY`
   - `TAVILY_API_KEY`
5. Haz clic en **"Deploy"**.

## 3. Configurar Supabase (CRÍTICO para Google Login)
Para que el login con Google funcione en producción:
1. Ve a tu panel de **Supabase** -> **Authentication** -> **URL Configuration**.
2. En **Site URL**, pon la URL de tu app en Vercel (ej: `https://sigma-ai-tu-nombre.vercel.app`).
3. En **Redirect URLs**, añade:
   - `http://localhost:3000/auth/callback` (para local)
   - `https://sigma-ai-tu-nombre.vercel.app/auth/callback` (para producción)

## 4. Activar Google Auth en Supabase
1. En Supabase: **Authentication** -> **Providers** -> **Google**.
2. Activa el interruptor **"Enable Google"**.
3. Sigue los pasos para obtener el `Client ID` y `Secret` desde la [Google Cloud Console](https://console.cloud.google.com/).

---
¡Listo! Tu app estará volando en la nube. 🚀✨
