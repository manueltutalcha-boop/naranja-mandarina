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

// Catálogos iniciales de respaldo
const DEFAULT_CATEGORIES = [
    {
        id: "cbb08cda-f9f0-4a6a-a278-85155c4e63ff",
        slug: "balacas",
        nombre: "Diademas y Balacas",
        descripcion: "Diseños exclusivos hechos a mano con amor",
        icono: "🎀",
        imagen_portada: "images/catalogo/portadas/balacas.jpg",
        disponible: true
    },
    {
        id: "36abbc4d-d735-437a-bbbc-f7ec7990b3ca",
        slug: "accesorios",
        nombre: "Accesorios",
        descripcion: "Complementos únicos para resaltar tu estilo",
        icono: "✨",
        imagen_portada: "images/catalogo/portadas/cintillos.png",
        disponible: true
    },
    {
        id: "b786f4ba-468d-4e9c-8de9-2217aa481b64",
        slug: "blusas",
        nombre: "Blusas",
        descripcion: "Prendas frescas, elegantes y con estilo",
        icono: "👚",
        imagen_portada: "images/catalogo/portadas/blusas.jpg",
        disponible: true
    },
    {
        id: "b4934e3c-7e29-4be6-9973-a340794ad4d4",
        slug: "faldas",
        nombre: "Faldas",
        descripcion: "Diseños cómodos y versátiles para toda ocasión",
        icono: "👗",
        imagen_portada: "images/catalogo/portadas/falda.jpg",
        disponible: true
    },
    {
        id: "40b4bd32-da1f-469a-90d7-3ec91088bdab",
        slug: "vestidos",
        nombre: "Vestidos",
        descripcion: "Elegancia y frescura en cada detalle",
        icono: "💃",
        imagen_portada: "images/catalogo/portadas/vestidos.jpg",
        disponible: true
    },
    {
        id: "4746373f-9707-4132-8759-968711e6d950",
        slug: "banos",
        nombre: "Trajes de Baño",
        descripcion: "Diseños únicos para disfrutar el sol",
        icono: "👙",
        imagen_portada: "images/catalogo/portadas/traje.png",
        disponible: true
    }
];

/**
 * Convierte un texto a slug URL amigable (ej. 'Ropa de Bebé' -> 'ropa-de-bebe')
 */
function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

/**
 * Obtiene todas las categorías desde la tabla 'categorias' de Supabase
 */
async function fetchCategories({ onlyAvailable = true } = {}) {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('⚠️ [Supabase] Cliente no disponible. Retornando categorías por defecto.');
        return DEFAULT_CATEGORIES;
    }

    try {
        let query = client.from('categorias').select('*').order('creado_en', { ascending: true });
        if (onlyAvailable) {
            query = query.eq('disponible', true);
        }
        const { data, error } = await query;
        if (error) {
            console.error('❌ [Supabase] Error consultando categorías:', error);
            return DEFAULT_CATEGORIES;
        }

        if (!data || data.length === 0) {
            return DEFAULT_CATEGORIES;
        }

        const portadasFallback = {
            balacas: 'images/catalogo/portadas/balacas.jpg',
            accesorios: 'images/catalogo/portadas/cintillos.png',
            blusas: 'images/catalogo/portadas/blusas.jpg',
            faldas: 'images/catalogo/portadas/falda.jpg',
            vestidos: 'images/catalogo/portadas/vestidos.jpg',
            banos: 'images/catalogo/portadas/traje.png'
        };

        return data.map(cat => ({
            ...cat,
            imagen_portada: cat.imagen_portada || portadasFallback[cat.slug] || 'images/catalogo/placeholder.jpg'
        }));
    } catch (err) {
        console.error('❌ [Supabase] Excepción en fetchCategories:', err);
        return DEFAULT_CATEGORIES;
    }
}

/**
 * Crea una nueva categoría o catálogo en la tabla 'categorias'
 */
async function createCategory(catData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const nombre = String(catData.nombre || '').trim();
    if (!nombre) throw new Error('El nombre de la categoría es requerido.');

    const slug = slugify(catData.slug || nombre);
    if (!slug) throw new Error('No se pudo generar un identificador para la categoría.');

    const payload = {
        slug,
        nombre,
        descripcion: String(catData.descripcion || '').trim(),
        icono: String(catData.icono || '🛍️').trim(),
        imagen_portada: String(catData.imagen_portada || '').trim(),
        disponible: catData.disponible !== undefined ? Boolean(catData.disponible) : true
    };

    const { data, error } = await client
        .from('categorias')
        .insert([payload])
        .select();

    if (error) {
        if (error.code === '23505') {
            payload.slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
            const retry = await client.from('categorias').insert([payload]).select();
            if (retry.error) throw retry.error;
            return (retry.data && retry.data.length > 0) ? retry.data[0] : payload;
        }
        console.error('❌ [Supabase] Error al crear categoría:', error);
        throw error;
    }

    return (Array.isArray(data) && data.length > 0) ? data[0] : payload;
}

/**
 * Elimina una categoría por su ID
 */
async function deleteCategory(id) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const { error } = await client
        .from('categorias')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
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
 * Obtiene todos los productos para el panel de administración (incluyendo pausados).
 * Si la base de datos está vacía, devuelve el catálogo semilla inicial.
 */
async function fetchAllAdminProducts() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const { data, error } = await client
        .from('productos')
        .select('*')
        .order('creado_en', { ascending: false });

    if (error) {
        console.error('❌ [Supabase] Error al consultar admin productos:', error);
        throw error;
    }

    if (data && data.length > 0) {
        return data;
    }

    // Fallback: si aún no hay productos en la BD, devolver el catálogo semilla
    console.log('ℹ️ [Supabase] Sin productos en BD aún. Mostrando catálogo semilla.');
    const categories = ['balacas', 'accesorios', 'blusas', 'faldas', 'vestidos', 'banos'];
    const initialList = [];
    categories.forEach(cat => {
        const fallbacks = getFallbackProducts(cat);
        if (Array.isArray(fallbacks)) {
            initialList.push(...fallbacks);
        }
    });
    return initialList;
}

/**
 * Crea un nuevo producto en la tabla 'productos'
 * Envía ÚNICAMENTE las columnas reales y evita .single() para prevenir errores de coerción
 */
async function createProduct(productData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const payload = {
        categoria: String(productData.categoria || 'balacas').trim().toLowerCase(),
        nombre: String(productData.nombre || '').trim(),
        precio: Math.max(0, Number(productData.precio) || 0),
        descripcion: String(productData.descripcion || '').trim(),
        materiales: String(productData.materiales || '').trim(),
        garantia: String(productData.garantia || 'Garantía por defectos de confección y costuras.').trim(),
        colores: Array.isArray(productData.colores) && productData.colores.length ? productData.colores : ['multicolor'],
        imagenes: Array.isArray(productData.imagenes) ? productData.imagenes : [],
        disponible: productData.disponible !== undefined ? Boolean(productData.disponible) : true
    };

    // Asegurarse de NUNCA enviar un id vacío ni IDs que no sean UUID para que PostgreSQL genere gen_random_uuid()
    if (productData.id && typeof productData.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.id.trim())) {
        payload.id = productData.id.trim();
    }

    const { data, error } = await client
        .from('productos')
        .insert([payload])
        .select();

    if (error) {
        console.error('❌ [Supabase] Error al insertar producto:', error);
        throw error;
    }

    return (Array.isArray(data) && data.length > 0) ? data[0] : payload;
}

/**
 * Actualiza un producto existente en Supabase.
 * Usa .maybeSingle() en lugar de .single(). Si la fila no existe (ej. era producto semilla),
 * lo inserta automáticamente como producto nuevo para no perder lo que se escribió.
 */
async function updateProduct(id, productData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const payload = {
        categoria: String(productData.categoria || 'balacas').trim().toLowerCase(),
        nombre: String(productData.nombre || '').trim(),
        precio: Math.max(0, Number(productData.precio) || 0),
        descripcion: String(productData.descripcion || '').trim(),
        materiales: String(productData.materiales || '').trim(),
        garantia: String(productData.garantia || 'Garantía por defectos de confección y costuras.').trim(),
        colores: Array.isArray(productData.colores) && productData.colores.length ? productData.colores : ['multicolor'],
        imagenes: Array.isArray(productData.imagenes) ? productData.imagenes : [],
        disponible: Boolean(productData.disponible),
        actualizado_en: new Date().toISOString()
    };

    const cleanId = id ? String(id).trim() : '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    if (isUUID) {
        try {
            const { data, error } = await client
                .from('productos')
                .update(payload)
                .eq('id', cleanId)
                .select()
                .maybeSingle();

            if (error) {
                console.warn('⚠️ [Supabase] Error en update, reintentando como inserción:', error.message);
            } else if (data) {
                return data;
            }
        } catch (updateErr) {
            console.warn('⚠️ [Supabase] Excepción en update:', updateErr);
        }
    }

    // Si el ID era de un producto local/semilla o no existía en la BD, lo insertamos como nuevo
    console.log('ℹ️ [Supabase] ID no encontrado en BD. Creando automáticamente como nuevo producto.');
    return await createProduct(productData);
}

/**
 * Alterna la disponibilidad (pausar/activar) de un producto
 */
async function toggleProductAvailability(id, currentStatus) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const cleanId = id ? String(id).trim() : '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    const newStatus = !currentStatus;

    if (isUUID) {
        const { data, error } = await client
            .from('productos')
            .update({ disponible: newStatus, actualizado_en: new Date().toISOString() })
            .eq('id', cleanId)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    return { id: cleanId, disponible: newStatus };
}

/**
 * Elimina un producto de la base de datos
 */
async function deleteProduct(id) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase no disponible.');

    const cleanId = id ? String(id).trim() : '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    if (!isUUID) {
        return true;
    }

    const { error } = await client
        .from('productos')
        .delete()
        .eq('id', cleanId);

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
        slugify,
        fetchCategories,
        createCategory,
        deleteCategory,
        DEFAULT_CATEGORIES,
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
