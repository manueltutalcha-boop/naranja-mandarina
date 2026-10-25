// ==============================================================================
// SCRIPT.JS - PORTADA PRINCIPAL (NARANJA MANDARINA)
// ==============================================================================

// Datos de las 6 categorías principales
const categories = [
    { 
        id: 1, 
        name: "Diademas y Balacas", 
        price: "Desde $8.500 COP", 
        category: "balacas", 
        description: "Moños artesanales, cintas y diademas hechas a mano con amor.", 
        page: "balacas.html", 
        image: "images/catalogo/portadas/balacas.jpg" 
    },
    { 
        id: 2, 
        name: "Cintillos y Accesorios", 
        price: "Desde $3.000 COP", 
        category: "accesorios", 
        description: "Pequeños detalles brillantes y elegantes que realzan tu peinado.", 
        page: "accesorios.html", 
        image: "images/catalogo/portadas/cintillos.png" 
    },
    { 
        id: 3, 
        name: "Blusas para Dama", 
        price: "Desde $30.000 COP", 
        category: "blusas", 
        description: "Blusas frescas, cómodas y estilosas para tus mejores outfits diarios.", 
        page: "blusas.html", 
        image: "images/catalogo/portadas/blusas.jpg" 
    },
    { 
        id: 4, 
        name: "Faldas para Dama", 
        price: "Desde $60.000 COP", 
        category: "faldas", 
        description: "Faldas elegantes con cortes favorecedores para toda ocasión.", 
        page: "faldas.html", 
        image: "images/catalogo/portadas/falda.jpg" 
    },
    { 
        id: 5, 
        name: "Vestidos para Dama", 
        price: "Desde $250.000 COP", 
        category: "vestidos", 
        description: "Diseños sofisticados y exclusivos para eventos especiales.", 
        page: "vestidos.html", 
        image: "images/catalogo/portadas/vestidos.jpg" 
    },
    { 
        id: 6, 
        name: "Trajes de Baño", 
        price: "Desde $30.000 COP", 
        category: "banos", 
        description: "Prendas cómodas y en tendencia para la playa o piscina.", 
        page: "banos.html", 
        image: "images/catalogo/portadas/traje.png" 
    }
];

function renderCategories() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const esc = window.escapeHTML || function(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
    const safeImg = window.sanitizeImageUrl || function(u) { return esc(u || 'images/catalogo/placeholder.jpg'); };

    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${safeImg(cat.image)}" alt="${esc(cat.name)}" loading="lazy" onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
            </div>
            <div class="product-info">
                <h3 class="product-name">${esc(cat.name)}</h3>
                <p class="product-desc">${esc(cat.description)}</p>
                <div class="mt-4">
                    <span class="product-price">${esc(cat.price)}</span>
                    <a href="${esc(cat.page)}" class="block w-full text-center bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 font-semibold transition-colors mt-2 shadow-sm">
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

document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    setupIndexMobileMenu();

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