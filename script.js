// ==============================================================================
// SCRIPT.JS - PORTADA PRINCIPAL DINÁMICA (NARANJA MANDARINA)
// Soporta categorías dinámicas creadas desde el panel de administración
// ==============================================================================

// Datos de las 6 categorías principales (base)
const baseCategories = [
    { 
        id: 'balacas', 
        name: "Diademas y Balacas", 
        price: "Desde $8.500 COP", 
        slug: "balacas", 
        description: "Moños artesanales, cintas y diademas hechas a mano con amor.", 
        page: "balacas.html", 
        image: "images/catalogo/portadas/balacas.jpg",
        icon: "🎀"
    },
    { 
        id: 'accesorios', 
        name: "Cintillos y Accesorios", 
        price: "Desde $3.000 COP", 
        slug: "accesorios", 
        description: "Pequeños detalles brillantes y elegantes que realzan tu peinado.", 
        page: "accesorios.html", 
        image: "images/catalogo/portadas/cintillos.png",
        icon: "✨"
    },
    { 
        id: 'blusas', 
        name: "Blusas para Dama", 
        price: "Desde $30.000 COP", 
        slug: "blusas", 
        description: "Blusas frescas, cómodas y estilosas para tus mejores outfits diarios.", 
        page: "blusas.html", 
        image: "images/catalogo/portadas/blusas.jpg",
        icon: "👚"
    },
    { 
        id: 'faldas', 
        name: "Faldas para Dama", 
        price: "Desde $60.000 COP", 
        slug: "faldas", 
        description: "Faldas elegantes con cortes favorecedores para toda ocasión.", 
        page: "faldas.html", 
        image: "images/catalogo/portadas/falda.jpg",
        icon: "👗"
    },
    { 
        id: 'vestidos', 
        name: "Vestidos para Dama", 
        price: "Desde $250.000 COP", 
        slug: "vestidos", 
        description: "Diseños sofisticados y exclusivos para eventos especiales.", 
        page: "vestidos.html", 
        image: "images/catalogo/portadas/vestidos.jpg",
        icon: "💃"
    },
    { 
        id: 'banos', 
        name: "Trajes de Baño", 
        price: "Desde $30.000 COP", 
        slug: "banos", 
        description: "Prendas cómodas y en tendencia para la playa o piscina.", 
        page: "banos.html", 
        image: "images/catalogo/portadas/traje.png",
        icon: "👙"
    }
];

const esc = window.escapeHTML || function(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

const safeImg = window.sanitizeImageUrl || function(u) {
    if (!u || typeof u !== 'string') return 'images/catalogo/placeholder.jpg';
    const trimmed = u.trim();
    if (/^(https?:\/\/|\/|\.\/|images\/|data:image\/|blob:)/i.test(trimmed)) {
        return esc(trimmed);
    }
    return 'images/catalogo/placeholder.jpg';
};

/**
 * Renderiza las colecciones en la portada principal
 * Combina las colecciones fijas con cualquier nueva colección creada en Supabase
 */
async function renderCategories() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let displayList = [...baseCategories];

    // Consultar categorías desde Supabase
    if (window.NaranjaMandarinaSupabase) {
        try {
            const supabaseCategories = await window.NaranjaMandarinaSupabase.fetchCategories({ onlyAvailable: true });
            if (Array.isArray(supabaseCategories) && supabaseCategories.length > 0) {
                // Actualizar las iniciales si tienen fotos o descripciones nuevas
                supabaseCategories.forEach(sCat => {
                    const existingIdx = displayList.findIndex(c => c.slug === sCat.slug);
                    if (existingIdx !== -1) {
                        if (sCat.imagen_portada) displayList[existingIdx].image = sCat.imagen_portada;
                        if (sCat.descripcion) displayList[existingIdx].description = sCat.descripcion;
                        if (sCat.nombre) displayList[existingIdx].name = sCat.nombre;
                        if (sCat.icono) displayList[existingIdx].icon = sCat.icono;
                    } else {
                        // Nueva categoría creada por la mamá
                        displayList.push({
                            id: sCat.id || sCat.slug,
                            name: sCat.nombre,
                            icon: sCat.icono || '🛍️',
                            price: "Colección Exclusiva",
                            slug: sCat.slug,
                            description: sCat.descripcion || "Hermosa colección artesanal confeccionada con amor y dedicación.",
                            page: `catalogo.html?categoria=${encodeURIComponent(sCat.slug)}`,
                            image: sCat.imagen_portada || 'images/catalogo/placeholder.jpg'
                        });
                    }
                });
            }
        } catch (err) {
            console.warn('Error consultando categorías para la portada:', err);
        }
    }

    grid.innerHTML = '';

    displayList.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const displayTitle = cat.icon ? `${cat.icon} ${cat.name}` : cat.name;

        card.innerHTML = `
            <div class="product-image">
                <img src="${safeImg(cat.image)}" alt="${esc(cat.name)}" loading="lazy" onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
            </div>
            <div class="product-info">
                <h3 class="product-name">${esc(displayTitle)}</h3>
                <p class="product-desc">${esc(cat.description)}</p>
                <div class="mt-4">
                    <span class="product-price">${esc(cat.price)}</span>
                    <a href="${esc(cat.page)}" class="block w-full text-center bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 font-semibold transition-colors mt-2 shadow-sm" style="text-decoration:none;">
                        Ver Colección
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Configuración del menú móvil para index
function setupIndexMobileMenu() {
    const toggleBtn = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!toggleBtn || !mobileMenu) return;

    if (toggleBtn.dataset.menuAttached) return;
    toggleBtn.dataset.menuAttached = 'true';

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isClosed = mobileMenu.classList.contains('hidden');
        if (isClosed) {
            mobileMenu.classList.remove('hidden');
            toggleBtn.classList.add('active');
        } else {
            mobileMenu.classList.add('hidden');
            toggleBtn.classList.remove('active');
        }
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            toggleBtn.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !toggleBtn.contains(e.target) && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            toggleBtn.classList.remove('active');
        }
    });
}

/**
 * Sincroniza dinámicamente los menús de navegación con las categorías de Supabase
 */
async function syncIndexNavigation() {
    if (!window.NaranjaMandarinaSupabase) return;
    try {
        const categories = await window.NaranjaMandarinaSupabase.fetchCategories({ onlyAvailable: true });
        if (!categories || !categories.length) return;

        const desktopNav = document.querySelector('header nav.hidden.md\\:flex');
        const mobileMenuUl = document.querySelector('#mobile-menu ul');
        const adminDesktopLink = document.getElementById('admin-link');
        const adminMobileItem = mobileMenuUl ? mobileMenuUl.querySelector('li.border-t') : null;

        const defaultSlugs = ['balacas', 'accesorios', 'blusas', 'faldas', 'vestidos', 'banos'];

        categories.forEach(cat => {
            const isBase = defaultSlugs.includes(cat.slug);
            const targetUrl = isBase ? `${cat.slug}.html` : `catalogo.html?categoria=${encodeURIComponent(cat.slug)}`;

            // 1. Escritorio
            if (desktopNav) {
                const existingDesktop = desktopNav.querySelector(`a[href*="${cat.slug}"]`);
                if (!existingDesktop && !isBase) {
                    const newLink = document.createElement('a');
                    newLink.href = targetUrl;
                    newLink.className = 'text-white hover:text-orange-200 font-medium transition-colors dynamic-nav-item';
                    newLink.style.textDecoration = 'none';
                    newLink.textContent = cat.nombre;
                    if (adminDesktopLink) {
                        desktopNav.insertBefore(newLink, adminDesktopLink);
                    } else {
                        desktopNav.appendChild(newLink);
                    }
                }
            }

            // 2. Móvil
            if (mobileMenuUl) {
                const existingMobile = mobileMenuUl.querySelector(`a[href*="${cat.slug}"]`);
                if (!existingMobile && !isBase) {
                    const li = document.createElement('li');
                    li.className = 'dynamic-menu-item';
                    const a = document.createElement('a');
                    a.href = targetUrl;
                    a.textContent = `${cat.icono ? cat.icono + ' ' : '🛍️ '}${cat.nombre}`;
                    li.appendChild(a);

                    if (adminMobileItem) {
                        mobileMenuUl.insertBefore(li, adminMobileItem);
                    } else {
                        mobileMenuUl.appendChild(li);
                    }
                }
            }
        });
    } catch (err) {
        console.warn('Error sincronizando navegación en index:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    setupIndexMobileMenu();
    await renderCategories();
    await syncIndexNavigation();

    // Comprobar si hay sesión admin activa en Supabase
    const adminLink = document.getElementById('admin-link');
    if (window.NaranjaMandarinaSupabase) {
        const client = window.NaranjaMandarinaSupabase.getClient();
        if (client && client.auth) {
            client.auth.getSession().then(({ data: { session } }) => {
                if (session && adminLink) {
                    adminLink.textContent = '⚙️ Panel Admin';
                }
            }).catch(() => {});
        }
    }
});