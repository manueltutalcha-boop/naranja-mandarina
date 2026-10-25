// ==============================================================================
// CATALOG-COMMON.JS - MOTOR PRINCIPAL DEL CATÁLOGO (NARANJA MANDARINA)
// Conexión directa a Supabase con soporte offline/fallback, modal de fotos,
// filtros por color/precio, cálculo del 30% descuento x docena y pedidos por WhatsApp.
// ==============================================================================

(function(window){
    let currentProductId = null;
    let currentImageIndex = 0;
    let scrollPosition = 0;
    let cfg = {};
    let state = { color: 'all', priceMin: null, priceMax: null, sortBy: '' };

    function formatPrice(n){
        return Number(n || 0).toLocaleString('es-CO');
    }

    function escapeHTML(s){
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    const esc = escapeHTML;

    function sanitizeImageUrl(url){
        if (!url || typeof url !== 'string') return 'images/catalogo/placeholder.jpg';
        const trimmed = url.trim();
        if (/^(https?:\/\/|\/|\.\/|images\/|data:image\/|blob:)/i.test(trimmed)) {
            return esc(trimmed);
        }
        return 'images/catalogo/placeholder.jpg';
    }

    function getBasePrice(prod){
        return Number(prod.precio || prod.originalPrice || prod.price || 0);
    }

    function getDiscountedUnitPrice(basePrice, quantity){
        // Descuento del 30% para compras a partir de 10 unidades (docena/mayorista)
        return quantity >= 10 ? Math.round(basePrice * 0.7) : basePrice;
    }

    function getTotalPrice(basePrice, quantity){
        return getDiscountedUnitPrice(basePrice, quantity) * quantity;
    }

    function getProductImages(prod){
        if (Array.isArray(prod.imagenes) && prod.imagenes.length) {
            return prod.imagenes;
        }
        if (Array.isArray(prod.images) && prod.images.length) {
            return prod.images;
        }
        if (cfg.imagesMap && cfg.imagesMap[prod.id] && Array.isArray(cfg.imagesMap[prod.id])) {
            return cfg.imagesMap[prod.id];
        }
        return ['images/catalogo/placeholder.jpg'];
    }

    function showImageModal(imgSrc, productId, imageIndex){
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-image');
        if (!modal || !modalImg) return;

        scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        currentProductId = productId;
        currentImageIndex = imageIndex || 0;
        modalImg.src = imgSrc;
        modal.classList.remove('hidden');
        updateNavigationButtons();

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = '100%';
    }

    function closeImageModal(){
        const modal = document.getElementById('image-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollPosition);
    }

    function navigateImages(direction){
        const prod = (cfg.products || []).find(p => String(p.id) === String(currentProductId));
        if (!prod) return;
        const images = getProductImages(prod);
        if (!images.length) return;

        currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
        const modalImg = document.getElementById('modal-image');
        if (modalImg) {
            modalImg.src = images[currentImageIndex];
        }
        updateNavigationButtons();
    }

    function updateNavigationButtons(){
        const prod = (cfg.products || []).find(p => String(p.id) === String(currentProductId));
        const images = prod ? getProductImages(prod) : [];
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');
        if (!prevBtn || !nextBtn) return;

        if (images.length <= 1){
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }

    function renderCatalog(filter){
        const grid = document.getElementById(cfg.gridId);
        if (!grid) return;
        grid.innerHTML = '';

        const color = typeof filter !== 'undefined' && filter !== null ? filter : state.color;
        state.color = color || 'all';

        let filtered = Array.isArray(cfg.products) ? [...cfg.products] : [];

        // Filtro de color (soporta string o array de colores)
        if (state.color && state.color !== 'all') {
            const targetColor = String(state.color).toLowerCase();
            filtered = filtered.filter(p => {
                if (Array.isArray(p.colores) && p.colores.length) {
                    return p.colores.some(c => String(c).toLowerCase().includes(targetColor));
                }
                const colorStr = String(p.color || '').toLowerCase();
                return colorStr.includes(targetColor) || colorStr === 'multicolor';
            });
        }

        // Filtro de rango de precios
        if (state.priceMin !== null && state.priceMin !== '' && !isNaN(state.priceMin)) {
            filtered = filtered.filter(p => getBasePrice(p) >= Number(state.priceMin));
        }
        if (state.priceMax !== null && state.priceMax !== '' && !isNaN(state.priceMax)) {
            filtered = filtered.filter(p => getBasePrice(p) <= Number(state.priceMax));
        }

        // Ordenamiento
        if (state.sortBy === 'price-asc') {
            filtered.sort((a,b) => getBasePrice(a) - getBasePrice(b));
        } else if (state.sortBy === 'price-desc') {
            filtered.sort((a,b) => getBasePrice(b) - getBasePrice(a));
        } else if (state.sortBy === 'name-asc') {
            filtered.sort((a,b) => String(a.nombre || a.name || '').localeCompare(String(b.nombre || b.name || '')));
        } else if (state.sortBy === 'name-desc') {
            filtered.sort((a,b) => String(b.nombre || b.name || '').localeCompare(String(a.nombre || a.name || '')));
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-16 text-center" style="grid-column: 1 / -1;">
                    <div style="font-size:3rem;margin-bottom:1rem;">🎀</div>
                    <h3 class="text-2xl font-bold text-gray-700 mb-2">No encontramos productos con estos filtros</h3>
                    <p class="text-gray-500 mb-6">Prueba seleccionando otro color o limpiando los filtros de precio.</p>
                    <button onclick="document.dispatchEvent(new CustomEvent('filterChange', { detail: { color: 'all', priceMin: null, priceMax: null, sortBy: '' } }));"
                            class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-colors">
                        Ver todos los productos
                    </button>
                </div>
            `;
            return;
        }

        filtered.forEach(prod => {
            const images = getProductImages(prod);
            const mainImg = images[0] || 'images/catalogo/placeholder.jpg';
            const basePrice = getBasePrice(prod);
            const prodName = prod.nombre || prod.name || 'Accesorio Naranja Mandarina';
            const prodDesc = prod.descripcion || prod.description || 'Elaborado artesanalmente con amor y dedicación.';
            const prodMat = prod.materiales || prod.materials || 'Materiales seleccionados de alta calidad.';
            const prodGar = prod.garantia || prod.guarantee || 'Garantía por defectos de confección.';

            const card = document.createElement('div');
            card.className = 'product-card-vincha product-card relative';
            card.setAttribute('data-id', prod.id);

            card.innerHTML = `
                <div class="product-image-vincha relative overflow-hidden">
                    ${images.length > 1 ? `
                    <div class="thumbs-container flex justify-center space-x-2 p-2 bg-white rounded-t-lg">
                        ${images.map((img, idx) => `
                            <img src="${sanitizeImageUrl(img)}" 
                                 alt="Vista ${idx+1}" 
                                 class="thumb w-12 h-12 object-cover rounded cursor-pointer border-2 ${idx === 0 ? 'border-orange-500' : 'border-gray-200'} hover:border-orange-500 transition-all duration-200" 
                                 data-index="${idx}" 
                                 data-id="${esc(prod.id)}"
                                 loading="lazy"
                                 onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
                        `).join('')}
                    </div>` : ''}
                    <div class="main-image-container product-image-wrapper">
                        <img src="${sanitizeImageUrl(mainImg)}" 
                             alt="${esc(prodName)}" 
                             class="main-image w-full h-64 object-cover transition-all duration-300 mx-auto block" 
                             data-id="${esc(prod.id)}"
                             loading="lazy"
                             onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
                        <button class="view-large-btn" type="button" data-id="${esc(prod.id)}" data-idx="0">
                            🔍 Ver en grande
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2 text-gray-800">${esc(prodName)}</h3>
                    
                    <!-- Control de Cantidad -->
                    <div class="flex justify-center items-center mb-4 space-x-4 qty-controls">
                        <button class="quantity-btn qty-minus" aria-label="Disminuir cantidad">-</button>
                        <span class="quantity-text text-lg font-semibold" data-quantity="1">1</span>
                        <button class="quantity-btn qty-plus" aria-label="Aumentar cantidad">+</button>
                    </div>

                    <p class="text-xl font-bold text-orange-600 mb-2 product-price">$${formatPrice(basePrice)} COP (unidad)</p>
                    <p class="text-lg font-semibold text-gray-700 total-price mb-2">Precio a pagar: $${formatPrice(basePrice)} COP</p>
                    
                    <p class="text-xs text-gray-500 mb-4 discount-notice" style="display:none;color:#16a34a;font-weight:600;">
                        🎉 ¡30% de descuento por docena aplicado!
                    </p>

                    <button class="w-full whatsapp-btn bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold transition-colors flex items-center justify-center gap-2" 
                            data-id="${esc(prod.id)}" 
                            data-name="${esc(prodName)}" 
                            data-qty="1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.954 2.8.954l.003-.001c3.182 0 5.77-2.587 5.77-5.768 0-3.181-2.588-5.768-5.777-5.768zm7.399 5.768c0 4.086-3.322 7.409-7.406 7.409-1.282 0-2.484-.33-3.565-.929l-3.959 1.038 1.056-3.86c-.663-1.121-1.042-2.428-1.042-3.658 0-4.087 3.322-7.41 7.409-7.41 4.085 0 7.407 3.323 7.407 7.41z"/>
                        </svg>
                        Pedir por WhatsApp
                    </button>
                </div>
                <div class="product-details bg-gray-50 p-4 mt-2 rounded border-t border-gray-100">
                    <h4 class="text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Detalles del Producto</h4>
                    <p class="text-sm mb-1 text-gray-600"><strong>Descripción:</strong> ${esc(prodDesc)}</p>
                    <p class="text-sm mb-1 text-gray-600"><strong>Materiales:</strong> ${esc(prodMat)}</p>
                    <p class="text-sm text-gray-600"><strong>Garantía:</strong> ${esc(prodGar)}</p>
                </div>
            `;
            grid.appendChild(card);

            // Control de cantidad reactivo
            const qtyMinus = card.querySelector('.qty-minus');
            const qtyPlus = card.querySelector('.qty-plus');
            const qtyText = card.querySelector('.quantity-text');
            let quantity = 1;

            if (qtyMinus && qtyPlus && qtyText) {
                qtyMinus.addEventListener('click', () => {
                    quantity = Math.max(1, quantity - 1);
                    qtyText.textContent = quantity;
                    qtyText.setAttribute('data-quantity', quantity);
                    updateCardPrice(card, prod, quantity);
                });

                qtyPlus.addEventListener('click', () => {
                    quantity = quantity + 1;
                    qtyText.textContent = quantity;
                    qtyText.setAttribute('data-quantity', quantity);
                    updateCardPrice(card, prod, quantity);
                });
            }

            // Botón ver en grande
            const viewBtn = card.querySelector('.view-large-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const imgs = getProductImages(prod);
                    const idx = Number(viewBtn.getAttribute('data-idx') || 0);
                    showImageModal(imgs[idx] || imgs[0], prod.id, idx);
                });
            }

            // Doble clic en imagen abre modal
            const mainImgEl = card.querySelector('.main-image');
            if (mainImgEl) {
                mainImgEl.addEventListener('dblclick', () => {
                    const imgs = getProductImages(prod);
                    showImageModal(imgs[0], prod.id, 0);
                });
            }
        });

        // Thumbs interaction
        grid.querySelectorAll('.thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = thumb.closest('.product-card-vincha');
                if (!card) return;
                const idx = Number(thumb.dataset.index || 0);
                const prodId = thumb.dataset.id;
                const prod = (cfg.products || []).find(p => String(p.id) === String(prodId));
                if (!prod) return;
                const images = getProductImages(prod);
                const mainImg = card.querySelector('.main-image');
                const viewBtn = card.querySelector('.view-large-btn');

                if (mainImg && images[idx]) {
                    mainImg.style.opacity = '0.4';
                    setTimeout(() => {
                        mainImg.src = images[idx];
                        mainImg.style.opacity = '1';
                        card.querySelectorAll('.thumb').forEach(t => t.classList.remove('border-orange-500'));
                        thumb.classList.add('border-orange-500');
                        if (viewBtn) viewBtn.setAttribute('data-idx', idx);
                    }, 120);
                }
            });
        });

        // WhatsApp handlers
        grid.querySelectorAll('.whatsapp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prodId = btn.dataset.id;
                const prod = (cfg.products || []).find(p => String(p.id) === String(prodId));
                if (!prod) return;

                const card = btn.closest('.product-card-vincha');
                const qtyText = card ? card.querySelector('.quantity-text') : null;
                const quantity = parseInt(qtyText ? qtyText.textContent : '1', 10) || 1;
                const basePrice = getBasePrice(prod);
                const total = getTotalPrice(basePrice, quantity);
                const prodName = prod.nombre || prod.name || 'Accesorio Naranja Mandarina';

                let discountText = '';
                if (quantity >= 10) {
                    discountText = ' (¡Aplica 30% descuento por docena/mayorista!)';
                }

                const message = encodeURIComponent(
                    `¡Hola Naranja Mandarina! 🍊 Me interesa comprar:\n\n` +
                    `🛍️ *Producto:* ${prodName}\n` +
                    `📦 *Cantidad:* ${quantity} unidad(es)${discountText}\n` +
                    `💰 *Total a pagar:* $${formatPrice(total)} COP\n\n` +
                    `¿Cómo coordinamos el pago y envío? ¡Muchas gracias!`
                );

                window.open(`https://wa.me/${cfg.whatsappNumber || '573152791288'}?text=${message}`, '_blank');
            });
        });
    }

    function updateCardPrice(card, prod, quantity){
        const priceEl = card.querySelector('.product-price');
        const totalEl = card.querySelector('.total-price');
        const discountNotice = card.querySelector('.discount-notice');
        const basePrice = getBasePrice(prod);

        const discountedUnit = getDiscountedUnitPrice(basePrice, quantity);
        const total = getTotalPrice(basePrice, quantity);

        if (priceEl) {
            priceEl.textContent = `$${formatPrice(discountedUnit)} COP (unidad)`;
            priceEl.classList.toggle('discounted', quantity >= 10);
        }
        if (totalEl) {
            totalEl.textContent = `Precio a pagar: $${formatPrice(total)} COP`;
            totalEl.classList.toggle('discounted', quantity >= 10);
        }
        if (discountNotice) {
            discountNotice.style.display = quantity >= 10 ? 'block' : 'none';
        }

        const waBtn = card.querySelector('.whatsapp-btn');
        if (waBtn) waBtn.setAttribute('data-qty', quantity);
    }

    // Configuración y apertura del menú móvil en todas las páginas
    function setupMobileMenu(){
        const toggleBtn = document.getElementById('menu-toggle') || document.querySelector('.hamburger');
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

        // Cerrar al dar clic en enlaces del menú
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                toggleBtn.classList.remove('active');
            });
        });

        // Cerrar si se da clic fuera
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !toggleBtn.contains(e.target) && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                toggleBtn.classList.remove('active');
            }
        });
    }

    /**
     * Inicialización pública del catálogo
     */
    window.initCatalog = async function(options){
        cfg.category = options.category || options.categoria || '';
        cfg.gridId = options.gridId || 'catalog-grid';
        cfg.filterSelector = options.filterSelector || '.filter-vincha';
        cfg.whatsappNumber = options.whatsappNumber || '573152791288';
        cfg.imagesMap = options.imagesMap || {};

        setupMobileMenu();

        const grid = document.getElementById(cfg.gridId);
        if (grid && (!options.products || !options.products.length)) {
            grid.innerHTML = `
                <div class="col-span-full py-12 text-center" style="grid-column: 1 / -1;">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-3" style="border-radius:50%;border:4px solid #ea580c;border-top-color:transparent;width:32px;height:32px;animation:spin 1s linear infinite;"></div>
                    <p class="text-gray-600 font-medium">Cargando catálogo con amor... 🍊</p>
                </div>
            `;
        }

        // Si se especificó categoría y window.NaranjaMandarinaSupabase está disponible, consultar Supabase
        if (cfg.category && window.NaranjaMandarinaSupabase) {
            try {
                const supabaseProducts = await window.NaranjaMandarinaSupabase.fetchCategoryProducts(cfg.category);
                if (supabaseProducts && supabaseProducts.length) {
                    cfg.products = supabaseProducts;
                } else if (options.products && options.products.length) {
                    cfg.products = options.products;
                } else {
                    cfg.products = window.NaranjaMandarinaSupabase.getFallbackProducts(cfg.category);
                }
            } catch (err) {
                console.warn('Usando catálogo local de fallback:', err);
                cfg.products = options.products || window.NaranjaMandarinaSupabase.getFallbackProducts(cfg.category);
            }
        } else {
            cfg.products = options.products || [];
        }

        state = { color: 'all', priceMin: null, priceMax: null, sortBy: '' };

        // Exponer helper para modal de fotos
        window._catalog_showImageModal = function(productId, idx){
            const prod = (cfg.products || []).find(p => String(p.id) === String(productId));
            const imgs = prod ? getProductImages(prod) : [];
            const src = imgs[idx] || imgs[0] || 'images/catalogo/placeholder.jpg';
            showImageModal(src, productId, idx);
        };

        // Render inicial
        renderCatalog('all');

        // Conexión en tiempo real con Supabase para actualización instantánea
        if (cfg.category && window.NaranjaMandarinaSupabase) {
            const client = window.NaranjaMandarinaSupabase.getClient();
            if (client && typeof client.channel === 'function') {
                try {
                    client.channel(`realtime-cat-${cfg.category}`)
                        .on('postgres_changes', { 
                            event: '*', 
                            schema: 'public', 
                            table: 'productos',
                            filter: `categoria=eq.${cfg.category}`
                        }, async (payload) => {
                            console.log('🔄 [Realtime] Cambio detectado en categoría:', cfg.category, payload.eventType);
                            const updated = await window.NaranjaMandarinaSupabase.fetchCategoryProducts(cfg.category);
                            if (updated && updated.length) {
                                cfg.products = updated;
                                renderCatalog();
                            }
                        })
                        .subscribe();
                } catch(subErr) {
                    console.warn('Realtime no disponible en este momento:', subErr);
                }
            }
        }

        // Escuchar eventos de filtros avanzados
        document.addEventListener('filterChange', (ev) => {
            const d = (ev && ev.detail) || {};
            state.color = typeof d.color !== 'undefined' ? d.color : state.color;
            state.priceMin = typeof d.priceMin !== 'undefined' ? d.priceMin : state.priceMin;
            state.priceMax = typeof d.priceMax !== 'undefined' ? d.priceMax : state.priceMax;
            state.sortBy = typeof d.sortBy !== 'undefined' ? d.sortBy : state.sortBy;
            renderCatalog();
        });

        // Controles del modal de imágenes
        const imageModal = document.getElementById('image-modal');
        const closeModal = document.getElementById('close-modal');
        if (closeModal) closeModal.addEventListener('click', closeImageModal);
        if (imageModal) {
            imageModal.addEventListener('click', (e) => {
                if (e.target === imageModal) closeImageModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeImageModal();
            else if (e.key === 'ArrowLeft') navigateImages(-1);
            else if (e.key === 'ArrowRight') navigateImages(1);
        });

        const prev = document.getElementById('prev-image');
        const next = document.getElementById('next-image');
        if (prev) prev.addEventListener('click', () => navigateImages(-1));
        if (next) next.addEventListener('click', () => navigateImages(1));
    };

    // Auto-setup mobile menu on DOMContentLoaded for all pages
    document.addEventListener('DOMContentLoaded', setupMobileMenu);

})(window);
