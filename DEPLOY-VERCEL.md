# Naranja Mandarina - Deploy en Vercel

## Configuración completada ✅

### Estructura del proyecto:
```
/
├── api/                    # Vercel Functions
│   ├── auth-login.js      # Legacy (reemplazado por Supabase Auth)
│   ├── save-catalog.js    # Guardar catálogos
│   └── load-catalog.js    # Cargar catálogos
├── data/
│   └── catalogos/         # JSON de productos
│       ├── balacas.json
│       ├── accesorios.json
│       ├── banos.json
│       ├── blusas.json
│       ├── faldas.json
│       └── vestidos.json
├── images/                # Imágenes estáticas
├── *.html                 # Páginas del sitio
├── *.js                   # Scripts del frontend
├── styles.css             # Estilos
└── vercel.json            # Configuración Vercel
```

## Deploy en Vercel

### Opción 1: Desde GitHub (RECOMENDADO)

1. **Sube tu código a GitHub:**
```bash
cd "c:\Users\manue\Desktop\HTML Y CSS\PROYECTO NYM"
git init
git add .
git commit -m "Migración a Vercel"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/naranja-mandarina.git
git push -u origin main
```

2. **Deploy desde Vercel Dashboard:**
   - Ve a https://vercel.com/new
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio `naranja-mandarina`
   - Click "Deploy"
   - ¡Listo! Tu sitio estará en https://naranja-mandarina.vercel.app

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy a producción
vercel --prod
```

## Credenciales de Acceso

- **Autenticación:** Gestionada a través de Supabase Auth (`admin.html`).
- Las cuentas de administración se gestionan desde el panel de Supabase Dashboard (Auth > Users).

## Funcionalidades

✅ Login simple con 2 usuarios
✅ Modo editor (agregar/editar productos)
✅ Guardar catálogos en servidor (JSON)
✅ Sincronización entre dispositivos
✅ Panel flotante "💾 Guardar Todos"
✅ Responsive design
✅ WhatsApp float button

## Notas importantes

- ⚠️ **IMPORTANTE:** En Vercel, el filesystem es de solo lectura EXCEPTO en `/tmp`
- Los archivos JSON se guardan pero pueden perderse entre deploys
- Para producción real, considera usar:
  - Vercel KV (key-value store)
  - Vercel Postgres
  - MongoDB Atlas
  - Supabase

## Testing local

No incluido en esta migración. Para testing local, usa `vercel dev`.
