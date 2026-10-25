// ==============================================================================
// CONFIGURACIÓN CENTRAL DE SUPABASE - NARANJA MANDARINA
// ==============================================================================
// Credenciales oficiales del proyecto Naranja Mandarina
// ==============================================================================

const SUPABASE_CONFIG = {
    url: 'https://nuzwirezbyrgbougzhlv.supabase.co',
    anonKey: 'sb_publishable_CtosCzFqlqXM0V2EE8A7gQ_8HkxWpZP'
};

// Cliente singleton
let _supabaseClient = null;

/**
 * Inicializa y retorna el cliente de Supabase
 */
function getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            console.log('✅ [Supabase] Conectado exitosamente con Naranja Mandarina.');
        } catch (err) {
            console.error('❌ [Supabase] Error inicializando cliente:', err);
        }
    } else {
        console.warn('⚠️ [Supabase] SDK no detectado en window.supabase.');
    }

    return _supabaseClient;
}

/**
 * Sanitiza cualquier texto para prevenir ataques XSS (Cross-Site Scripting)
 * @param {string|any} str
 * @returns {string}
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Valida y sanitiza URLs de imágenes para prevenir esquemas maliciosos (ej. javascript:)
 * @param {string} url
 * @returns {string}
 */
function sanitizeImageUrl(url) {
    if (!url || typeof url !== 'string') return 'images/catalogo/placeholder.jpg';
    const trimmed = url.trim();
    if (/^(https?:\/\/|\/|\.\/|images\/|data:image\/|blob:)/i.test(trimmed)) {
        return escapeHTML(trimmed);
    }
    return 'images/catalogo/placeholder.jpg';
}

if (typeof window !== 'undefined') {
    window.escapeHTML = escapeHTML;
    window.sanitizeImageUrl = sanitizeImageUrl;
}

/**
 * Comprueba si el cliente está listo
 */
function isSupabaseReady() {
    return Boolean(getSupabaseClient());
}

/**
 * Obtiene los productos públicos de una categoría desde Supabase
 * @param {string} categoria - Slug de la categoría (ej: 'balacas', 'accesorios')
 */
async function fetchCategoryProducts(categoria) {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('⚠️ [Supabase] Usando catálogo de respaldo local (cliente no listo).');
        return getFallbackProducts(categoria);
    }

    try {
        const { data, error } = await client
            .from('productos')
            .select('*')
            .eq('categoria', categoria)
            .eq('disponible', true)
            .order('creado_en', { ascending: false });

        if (error) {
            console.error(`❌ [Supabase] Error al consultar '${categoria}':`, error.message);
            return getFallbackProducts(categoria);
        }

        // Si la tabla no tiene productos aún, usamos los fallback para que la tienda nunca se vea vacía
        if (!data || data.length === 0) {
            console.log(`ℹ️ [Supabase] Categoría '${categoria}' sin registros aún en Supabase. Mostrando productos iniciales.`);
            return getFallbackProducts(categoria);
        }

        return data;
    } catch (err) {
        console.error(`❌ [Supabase] Error de conexión:`, err);
        return getFallbackProducts(categoria);
    }
}

/**
 * Obtiene todos los productos para el panel de administración (incluyendo pausados)
 */
async function fetchAllAdminProducts() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const { data, error } = await client
        .from('productos')
        .select('*')
        .order('creado_en', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Crea un nuevo producto en la tabla 'productos'
 */
async function createProduct(productData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const payload = {
        categoria: productData.categoria,
        nombre: productData.nombre,
        precio: Number(productData.precio) || 0,
        descripcion: productData.descripcion || '',
        materiales: productData.materiales || '',
        garantia: productData.garantia || 'Garantía por defectos de confección y costuras.',
        colores: Array.isArray(productData.colores) ? productData.colores : ['multicolor'],
        imagenes: Array.isArray(productData.imagenes) ? productData.imagenes : [],
        disponible: productData.disponible !== undefined ? Boolean(productData.disponible) : true
    };

    const { data, error } = await client
        .from('productos')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Actualiza un producto existente
 */
async function updateProduct(id, productData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const payload = {
        categoria: productData.categoria,
        nombre: productData.nombre,
        precio: Number(productData.precio) || 0,
        descripcion: productData.descripcion || '',
        materiales: productData.materiales || '',
        garantia: productData.garantia || 'Garantía por defectos de confección y costuras.',
        colores: Array.isArray(productData.colores) ? productData.colores : ['multicolor'],
        imagenes: Array.isArray(productData.imagenes) ? productData.imagenes : [],
        disponible: Boolean(productData.disponible),
        actualizado_en: new Date().toISOString()
    };

    const { data, error } = await client
        .from('productos')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Alterna la disponibilidad (pausar/activar) de un producto
 */
async function toggleProductAvailability(id, currentStatus) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const newStatus = !currentStatus;
    const { data, error } = await client
        .from('productos')
        .update({ disponible: newStatus, actualizado_en: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Elimina un producto de la base de datos
 */
async function deleteProduct(id) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const { error } = await client
        .from('productos')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

/**
 * Sube una imagen al bucket público 'productos' de Supabase Storage
 * @param {Blob|File} fileOrBlob - Archivo o Blob de imagen optimizado
 * @param {string} [originalName] - Nombre de archivo opcional
 * @returns {Promise<string>} URL pública de la imagen
 */
async function uploadProductImage(fileOrBlob, originalName = 'foto.jpg') {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase no está listo. Verifica la conexión.');
    }

    const fileExt = originalName.split('.').pop() || 'jpg';
    const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt || 'jpg'}`;
    const filePath = `catalogo/${fileName}`;

    const { error: uploadError } = await client.storage
        .from('productos')
        .upload(filePath, fileOrBlob, {
            contentType: fileOrBlob.type || 'image/jpeg',
            cacheControl: '31536000',
            upsert: false
        });

    if (uploadError) {
        console.error('❌ [Storage Upload Error]:', uploadError);
        throw uploadError;
    }

    const { data } = client.storage
        .from('productos')
        .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen subida.');
    }

    return data.publicUrl;
}

/**
 * Datos de demostración de respaldo (garantiza que la tienda jamás se vea en blanco)
 */
function getFallbackProducts(categoria) {
    const demos = {
        balacas: [
            {
                id: 'demo-balaca-1',
                categoria: 'balacas',
                nombre: 'Moño Artesanal Fresa',
                precio: 8500,
                descripcion: 'Hermoso moño confeccionado a mano con cinta de satín roja y apliques florales.',
                materiales: 'Cinta de satín, hilo reforzado y broche antialérgico.',
                garantia: 'Garantía de confección artesanal de 30 días.',
                colores: ['rojo', 'blanco', 'multicolor'],
                imagenes: ['images/catalogo/portadas/balacas.jpg'],
                disponible: true
            },
            {
                id: 'demo-balaca-2',
                categoria: 'balacas',
                nombre: 'Diadema Perlas & Seda',
                precio: 14000,
                descripcion: 'Diadema acolchada forrada en tela suave con detalle de perlas para peinados elegantes.',
                materiales: 'Organza, perlas de fantasía y diadema flexible.',
                garantia: 'Garantía por defecto de fabricación.',
                colores: ['blanco', 'dorado', 'rosa'],
                imagenes: ['images/catalogo/portadas/balacas.jpg'],
                disponible: true
            }
        ],
        accesorios: [
            {
                id: 'demo-acc-1',
                categoria: 'accesorios',
                nombre: 'Set de Cintillos y Ganchos',
                precio: 5000,
                descripcion: 'Pequeños detalles dorados y nacarados que realzan cualquier peinado.',
                materiales: 'Aleación metálica inoxidable y resina acrílica.',
                garantia: 'Garantía de satisfacción.',
                colores: ['dorado', 'plateado', 'blanco'],
                imagenes: ['images/catalogo/portadas/cintillos.png'],
                disponible: true
            }
        ],
        blusas: [
            {
                id: 'demo-blu-1',
                categoria: 'blusas',
                nombre: 'Blusa Campesina Floral',
                precio: 45000,
                descripcion: 'Blusa fresca con hombros descubiertos, ideal para clima cálido y estilo casual.',
                materiales: 'Chalis estampado suave al tacto.',
                garantia: 'Garantía por costura y tela.',
                colores: ['blanco', 'azul', 'multicolor'],
                imagenes: ['images/catalogo/portadas/blusas.jpg'],
                disponible: true
            }
        ],
        faldas: [
            {
                id: 'demo-fal-1',
                categoria: 'faldas',
                nombre: 'Falda Larga Plisada',
                precio: 75000,
                descripcion: 'Falda de caída elegante con pretina elástica y movimiento fluido.',
                materiales: 'Seda poliéster con acabado mate.',
                garantia: 'Garantía de calidad garantizada.',
                colores: ['negro', 'verde', 'rosa'],
                imagenes: ['images/catalogo/portadas/falda.jpg'],
                disponible: true
            }
        ],
        vestidos: [
            {
                id: 'demo-ves-1',
                categoria: 'vestidos',
                nombre: 'Vestido Gala Midi',
                precio: 280000,
                descripcion: 'Vestido sofisticado para eventos especiales, matrimonios o grados.',
                materiales: 'Crepé con forro interior suave.',
                garantia: 'Garantía de confección premium.',
                colores: ['azul', 'rojo', 'negro'],
                imagenes: ['images/catalogo/portadas/vestidos.jpg'],
                disponible: true
            }
        ],
        banos: [
            {
                id: 'demo-ban-1',
                categoria: 'banos',
                nombre: 'Traje de Baño Enterizo Tropical',
                precio: 48000,
                descripcion: 'Bañador con control de abdomen y copas removibles con estampado tropical.',
                materiales: 'Lycra de alta compresión resistente al cloro.',
                garantia: 'Garantía de confección.',
                colores: ['multicolor', 'verde'],
                imagenes: ['images/catalogo/portadas/traje.png'],
                disponible: true
            }
        ]
    };

    return demos[categoria] || [];
}

// Inicialización automática al cargar el script si window.supabase ya existe
if (typeof window !== 'undefined') {
    window.NaranjaMandarinaSupabase = {
        config: SUPABASE_CONFIG,
        getClient: getSupabaseClient,
        isReady: isSupabaseReady,
        escapeHTML,
        sanitizeImageUrl,
        fetchCategoryProducts,
        fetchAllAdminProducts,
        createProduct,
        updateProduct,
        toggleProductAvailability,
        deleteProduct,
        uploadProductImage,
        getFallbackProducts
    };

    // Auto-conectar si el SDK ya fue cargado previamente
    if (window.supabase) {
        getSupabaseClient();
    }
}
