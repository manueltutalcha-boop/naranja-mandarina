-- ==============================================================================
-- PARCHE DE CIBERSEGURIDAD Y HARDENING PARA SUPABASE
-- Proyecto: Naranja Mandarina
-- ==============================================================================
-- Instrucciones de ejecución:
-- 1. Ve a tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. Abre el "SQL Editor" en el menú lateral.
-- 3. Pega este script completo y haz clic en "RUN".
-- ==============================================================================

-- 1. RESTRICCIÓN DE SEGURIDAD EN EL BUCKET DE STORAGE 'productos'
-- Límite máximo de archivo: 2MB (2 * 1024 * 1024 = 2,097,152 bytes)
-- Tipos MIME estrictamente permitidos: JPEG, PNG y WebP (bloquea ejecutables, SVG maliciosos, scripts, etc.)
UPDATE storage.buckets
SET 
    file_size_limit = 2097152, -- 2MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[],
    public = true
WHERE id = 'productos';

-- Si por alguna razón el bucket no existía, se crea con las reglas estrictas:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos',
    'productos',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[],
    public = true;

-- 2. REFORZAMIENTO DE POLÍTICAS RLS EN STORAGE (storage.objects)
-- Garantiza que NADIE sin sesión autenticada pueda subir, modificar o borrar archivos.
DROP POLICY IF EXISTS "Lectura pública de imágenes de productos" ON storage.objects;
DROP POLICY IF EXISTS "Subida de imágenes solo autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Modificación de imágenes solo autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación de imágenes solo autenticados" ON storage.objects;

-- A) Solo lectura para el público en el bucket 'productos'
CREATE POLICY "Lectura pública de imágenes de productos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'productos');

-- B) Inserción restringida: solo usuarios autenticados con sesión Supabase
CREATE POLICY "Subida de imágenes solo autenticados"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'productos');

-- C) Modificación restringida: solo usuarios autenticados
CREATE POLICY "Modificación de imágenes solo autenticados"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'productos')
    WITH CHECK (bucket_id = 'productos');

-- D) Eliminación restringida: solo usuarios autenticados
CREATE POLICY "Eliminación de imágenes solo autenticados"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'productos');

-- 3. REFORZAMIENTO DE SEGURIDAD EN TABLA 'productos'
-- Validación estricta para evitar datos corruptos o valores negativos:
ALTER TABLE public.productos 
    ADD CONSTRAINT check_precio_positivo CHECK (precio >= 0),
    ADD CONSTRAINT check_nombre_no_vacio CHECK (length(trim(nombre)) > 0);

-- Confirmación del estado
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'productos';
