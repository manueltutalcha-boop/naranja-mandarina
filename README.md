# Naranja Mandarina - Catálogo Virtual y Panel de Administración

Plataforma web de catálogo virtual y comercio electrónico para **Naranja Mandarina**, desarrollada con arquitectura moderna, rápida y ligera (Vanilla HTML5, CSS3, JavaScript ES6+ y Supabase).

---

## 🚀 Características Principales

### 🛍️ Para Clientes (Tienda Virtual)
- **Navegación por Categorías**: Balacas, Accesorios, Blusas, Faldas, Vestidos y Trajes de Baño.
- **Carrito de Compras Inteligente**: 
  - Cálculo de subtotal y total en tiempo real.
  - Descuento automático por compras al por mayor (30% de descuento al llevar 10 o más prendas).
- **Checkout directo a WhatsApp**: Generación automática de mensaje detallado con lista de productos, cantidades, colores y total a pagar.
- **Visor Multimedia de Producto**: Modal interactivo para ver detalles, fotos ampliadas y selección de colores.
- **Sincronización en Tiempo Real**: Los cambios de inventario se reflejan inmediatamente gracias a Supabase Realtime Channels.
- **Diseño 100% Responsivo**: Adaptado para smartphones, tablets y computadores de escritorio con menú interactivo optimizado.

### 🔐 Para Administradores (`/admin.html`)
- **Autenticación Segura**: Inicio de sesión mediante Supabase Auth.
- **Gestión Completa de Catálogo (CRUD)**:
  - Creación de nuevos productos con múltiples fotos.
  - Edición en caliente de precios, nombres, materiales, garantía y colores.
  - Pausar / Activar disponibilidad de productos al instante.
  - Eliminación segura con confirmación.
- **Optimización Automática de Imágenes**: Compresión en el cliente vía Canvas/WebP antes de subir al bucket de Supabase Storage para máxima velocidad y ahorro de almacenamiento.

---

## 🛠️ Tecnologías

- **Frontend**: HTML5 Semántico, CSS3 Moderno (Glassmorphism, Variables CSS, Grid, Flexbox), JavaScript ES6+ Vanilla.
- **Backend / Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL + RLS Security Policies).
- **Almacenamiento**: Supabase Storage (Bucket público `productos`).
- **Despliegue**: [Vercel](https://vercel.com/) con soporte para rutas limpias (`vercel.json`).

---

## 💻 Ejecución Local

Para probar o ejecutar el proyecto localmente:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd "PROYECTO NYM"
   ```

2. Inicia cualquier servidor web estático local:
   ```bash
   # Opción con Python:
   python -m http.server 3000

   # O con Node.js / npx:
   npx serve .
   ```

3. Abre en tu navegador:
   - Catálogo: `http://localhost:3000`
   - Panel de administración: `http://localhost:3000/admin.html`

---

## 🌐 Despliegue en Vercel

El proyecto incluye el archivo de configuración `vercel.json` con reescrituras de URLs limpias (permite acceder a `/admin` directamente sin escribir `.html`).

1. Conecta tu repositorio en [Vercel](https://vercel.com/).
2. Haz clic en **Deploy**. ¡Listo en segundos!

---

Desarrollado con dedicación para **Naranja Mandarina**.
