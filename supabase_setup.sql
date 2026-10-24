-- ==============================================================================
-- SCRIPT DE CONFIGURACIÓN TODO-EN-UNO PARA SUPABASE
-- Proyecto: Naranja Mandarina (Catálogo y Tienda Web)
-- ==============================================================================
-- Instrucciones:
-- 1. Entra a tu proyecto en https://supabase.com
-- 2. Ve a la pestaña "SQL Editor" en el menú lateral izquierdo.
-- 3. Pega todo este contenido y haz clic en "RUN".
-- ==============================================================================

-- 1. TABLA PRINCIPAL DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL, -- 'balacas', 'accesorios', 'blusas', 'faldas', 'vestidos', 'banos'
    nombre TEXT NOT NULL,
    precio INTEGER NOT NULL DEFAULT 0, -- Precio unitario en COP
    descripcion TEXT DEFAULT '',
    materiales TEXT DEFAULT '',
    garantia TEXT DEFAULT 'Garantía por defectos de confección y costuras.',
    colores TEXT[] DEFAULT ARRAY['multicolor']::TEXT[],
    imagenes TEXT[] DEFAULT ARRAY[]::TEXT[],
    disponible BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas y filtros rápidos
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON public.productos (disponible);
CREATE INDEX IF NOT EXISTS idx_productos_creado_en ON public.productos (creado_en DESC);

-- Trigger para actualizar campo actualizado_en automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_actualizado_en ON public.productos;
CREATE TRIGGER set_actualizado_en
    BEFORE UPDATE ON public.productos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 2. SEGURIDAD (ROW LEVEL SECURITY - RLS) EN TABLA PRODUCTOS
-- ==============================================================================
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existían
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.productos;
DROP POLICY IF EXISTS "Inserción solo para administradores autenticados" ON public.productos;
DROP POLICY IF EXISTS "Edición solo para administradores autenticados" ON public.productos;
DROP POLICY IF EXISTS "Eliminación solo para administradores autenticados" ON public.productos;

-- A) Cualquier visitante (público) puede leer y ver productos disponibles
CREATE POLICY "Lectura pública de productos"
    ON public.productos
    FOR SELECT
    USING (true);

-- B) Solo usuarios autenticados (tu mamá o tú con sesión iniciada) pueden insertar
CREATE POLICY "Inserción solo para administradores autenticados"
    ON public.productos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- C) Solo usuarios autenticados pueden actualizar productos
CREATE POLICY "Edición solo para administradores autenticados"
    ON public.productos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- D) Solo usuarios autenticados pueden eliminar productos
CREATE POLICY "Eliminación solo para administradores autenticados"
    ON public.productos
    FOR DELETE
    TO authenticated
    USING (true);

-- ==============================================================================
-- 3. CONFIGURACIÓN DEL BUCKET DE FOTOS (STORAGE)
-- ==============================================================================
-- Crear bucket público 'productos' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos',
    'productos',
    true,
    5242880, -- 5MB máx por imagen
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas de seguridad para storage.objects
DROP POLICY IF EXISTS "Lectura pública de imágenes de productos" ON storage.objects;
DROP POLICY IF EXISTS "Subida de imágenes solo autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Modificación de imágenes solo autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación de imágenes solo autenticados" ON storage.objects;

-- A) Lectura pública de cualquier imagen en el bucket 'productos'
CREATE POLICY "Lectura pública de imágenes de productos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'productos');

-- B) Subida permitida solo a usuarios autenticados
CREATE POLICY "Subida de imágenes solo autenticados"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'productos');

-- C) Actualización permitida solo a usuarios autenticados
CREATE POLICY "Modificación de imágenes solo autenticados"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'productos');

-- D) Eliminación permitida solo a usuarios autenticados
CREATE POLICY "Eliminación de imágenes solo autenticados"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'productos');

-- ==============================================================================
-- 4. INSERT INICIAL DE PRUEBA (DATOS EXISTENTES DE BALACAS Y CATEGORÍAS)
-- ==============================================================================
-- Insertamos el producto existente en balacas.json para que el catálogo tenga datos reales inmediatamente
INSERT INTO public.productos (
    categoria,
    nombre,
    precio,
    descripcion,
    materiales,
    garantia,
    colores,
    imagenes,
    disponible
) VALUES
(
    'balacas',
    'Moños Artesanales Elegance',
    8500,
    'Moños creados a mano con amor para ocasiones especiales, peinados de gala y eventos infantiles.',
    'Cinta de satín premium, hilo de alta resistencia y cinta encaje.',
    'Garantía de 30 días por defectos de costura o confección.',
    ARRAY['rojo', 'rosa', 'blanco', 'multicolor']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    true
),
(
    'balacas',
    'Diadema Flores & Perlas',
    14000,
    'Hermosa diadema artesanal adornada con flores y perlas delicadas para niñas y novias.',
    'Base flexible acolchada, perlas de fantasía y tela de organza.',
    'Garantía total de satisfacción y confección.',
    ARRAY['blanco', 'rosa', 'dorado']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    true
),
(
    'accesorios',
    'Set de Cintillos y Ganchos Perla',
    5000,
    'Juego de ganchos decorativos ideales para complementar cualquier peinado diario o festivo.',
    'Metal inoxidable, resina y perlas acrílicas.',
    'Garantía por defecto de fábrica.',
    ARRAY['dorado', 'plateado', 'blanco']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1617059063772-34532796cdb5?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    true
);

-- Mensaje de confirmación final
DO $$
BEGIN
    RAISE NOTICE '✅ Configuración de base de datos y storage para Naranja Mandarina completada con éxito.';
END $$;
