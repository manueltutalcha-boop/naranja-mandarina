// ==============================================================================
// ADMIN.JS - PANEL DE ADMINISTRACIÓN MÓVIL (NARANJA MANDARINA)
// Diseñado especialmente para administración sencilla desde celulares.
// Incluye autenticación con Supabase, compresión de fotos y gestión de catálogo.
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos DOM
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const btnLogout = document.getElementById('btn-logout');
    const userEmailBadge = document.getElementById('user-email-badge');
    const globalAlert = document.getElementById('global-alert');

    // Tabs
    const tabBtnCreate = document.getElementById('tab-btn-create');
    const tabBtnList = document.getElementById('tab-btn-list');
    const tabBtnCats = document.getElementById('tab-btn-cats');
    const tabContentCreate = document.getElementById('tab-content-create');
    const tabContentList = document.getElementById('tab-content-list');
    const tabContentCats = document.getElementById('tab-content-cats');
    const tabCount = document.getElementById('tab-count');
    const catsCount = document.getElementById('cats-count');
    const statsPill = document.getElementById('stats-pill');

    // Formulario de Producto
    const productForm = document.getElementById('product-form');
    const formHeading = document.getElementById('form-heading');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const editProductId = document.getElementById('edit-product-id');
    const prodCategoria = document.getElementById('prod-categoria');
    const prodNombre = document.getElementById('prod-nombre');
    const prodPrecio = document.getElementById('prod-precio');
    const prodColores = document.getElementById('prod-colores');
    const prodDescripcion = document.getElementById('prod-descripcion');
    const prodMateriales = document.getElementById('prod-materiales');
    const prodGarantia = document.getElementById('prod-garantia');
    const prodDisponible = document.getElementById('prod-disponible');
    const btnSaveProduct = document.getElementById('btn-save-product');

    // Subida de Fotos Producto
    const uploadDropzone = document.getElementById('upload-dropzone');
    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    const prodImagesInput = document.getElementById('prod-images-input');
    const uploadStatus = document.getElementById('upload-status');
    const photoPreviews = document.getElementById('photo-previews');

    // Lista de Productos y Filtros
    const adminProductsList = document.getElementById('admin-products-list');
    const adminSearch = document.getElementById('admin-search');
    const adminFilterContainer = document.getElementById('admin-filter-container');

    // Gestión de Categorías / Colecciones
    const adminCategoriesList = document.getElementById('admin-categories-list');
    const btnOpenCategoryModal = document.getElementById('btn-open-category-modal');
    const btnCreateCatFromTab = document.getElementById('btn-create-cat-from-tab');
    const modalCreateCategory = document.getElementById('modal-create-category');
    const btnCloseCatModal = document.getElementById('btn-close-cat-modal');
    const btnCancelCatModal = document.getElementById('btn-cancel-cat-modal');
    const categoryForm = document.getElementById('category-form');
    const catNombre = document.getElementById('cat-nombre');
    const catIcono = document.getElementById('cat-icono');
    const catDescripcion = document.getElementById('cat-descripcion');
    const catCoverInput = document.getElementById('cat-cover-input');
    const catCoverPreview = document.getElementById('cat-cover-preview');
    const catCoverImg = document.getElementById('cat-cover-img');
    const btnRemoveCatCover = document.getElementById('btn-remove-cat-cover');
    const btnSubmitCat = document.getElementById('btn-submit-cat');
    const quickEmojiBtns = document.querySelectorAll('.quick-emoji-btn');

    // Modal de confirmación para eliminar
    const deleteModal = document.getElementById('delete-modal');
    const deleteProductName = document.getElementById('delete-product-name');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // Estado local
    let currentSession = null;
    let productsList = [];
    let categoriesList = [];
    let currentUploadedImages = []; // URLs públicas de imágenes del producto actual
    let selectedCatCoverBlob = null; // Blob de portada para nueva categoría
    let activeCategoryFilter = 'all';
    let searchQuery = '';
    let pendingDeleteId = null;

    // Helper: Formato de precio en pesos colombianos
    function formatCOP(num) {
        return Number(num || 0).toLocaleString('es-CO');
    }

    // Funciones de sanitización contra XSS
    const escapeHTML = window.escapeHTML || function(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const sanitizeImageUrl = window.sanitizeImageUrl || function(url) {
        if (!url || typeof url !== 'string') return 'images/catalogo/placeholder.jpg';
        const trimmed = url.trim();
        if (/^(https?:\/\/|\/|\.\/|images\/|data:image\/|blob:)/i.test(trimmed)) {
            return escapeHTML(trimmed);
        }
        return 'images/catalogo/placeholder.jpg';
    };

    // Helper: Mostrar alertas seguro (sin innerHTML para mensajes dinámicos)
    function showAlert(message, type = 'success', duration = 4000) {
        if (!globalAlert) return;
        globalAlert.className = `admin-alert ${type}`;
        globalAlert.textContent = '';
        
        const iconSpan = document.createElement('span');
        iconSpan.textContent = type === 'success' ? '✅' : '❌';
        const msgSpan = document.createElement('span');
        msgSpan.textContent = ` ${message}`;
        
        globalAlert.appendChild(iconSpan);
        globalAlert.appendChild(msgSpan);
        globalAlert.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (duration > 0) {
            setTimeout(() => {
                globalAlert.style.display = 'none';
            }, duration);
        }
    }

    // Helper: Compresión automática de imágenes mediante HTML5 Canvas
    // Reduce fotos de celular de 8MB-12MB a ~150KB-250KB con calidad impecable
    async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Error al comprimir la imagen.'));
                                return;
                            }
                            resolve(blob);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Error al leer los datos de la imagen.'));
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        });
    }

    // ==============================================================================
    // 1. GESTIÓN DE AUTENTICACIÓN
    // ==============================================================================

    const supabase = window.NaranjaMandarinaSupabase ? window.NaranjaMandarinaSupabase.getClient() : null;

    if (!supabase) {
        showAlert('No se pudo conectar con el servicio de Supabase. Revisa tu conexión a internet.', 'error', 0);
        return;
    }

    // Verificar sesión existente
    try {
        const { data: { session } } = await supabase.auth.getSession();
        updateAuthState(session);
    } catch (err) {
        console.error('Error comprobando sesión:', err);
    }

    // Escuchar cambios de sesión en tiempo real
    supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthState(session);
    });

    async function updateAuthState(session) {
        currentSession = session;
        if (session && session.user) {
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            btnLogout.style.display = 'inline-flex';
            userEmailBadge.textContent = `Sesión activa: ${session.user.email}`;
            await loadCategories();
            await loadAdminProducts();
        } else {
            authSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            btnLogout.style.display = 'none';
        }
    }

    // Ver/Ocultar contraseña
    if (togglePasswordBtn && loginPasswordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = loginPasswordInput.type === 'password';
            loginPasswordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.textContent = isPassword ? '🙈 Ocultar' : '👁️ Ver';
        });
    }

    // Iniciar Sesión
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value;

            if (!email || !password) {
                showAlert('Por favor ingresa tu correo y contraseña.', 'error');
                return;
            }

            btnLoginSubmit.disabled = true;
            btnLoginSubmit.textContent = 'Verificando datos... ⏳';

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                showAlert('¡Bienvenida! Accediendo a tu panel...', 'success');
                updateAuthState(data.session);
            } catch (err) {
                console.error('Error de login:', err);
                showAlert(`Error al entrar: ${err.message || 'Verifica tu correo y contraseña.'}`, 'error');
            } finally {
                btnLoginSubmit.disabled = false;
                btnLoginSubmit.textContent = 'Entrar al Administrador 🍊';
            }
        });
    }

    // Cerrar Sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (confirm('¿Deseas cerrar tu sesión?')) {
                await supabase.auth.signOut();
                showAlert('Has cerrado sesión correctamente.', 'success');
                updateAuthState(null);
            }
        });
    }

    // ==============================================================================
    // 2. NAVEGACIÓN POR PESTAÑAS (TABS)
    // ==============================================================================

    function switchTab(tab) {
        tabBtnCreate.classList.toggle('active', tab === 'create');
        tabBtnList.classList.toggle('active', tab === 'list');
        if (tabBtnCats) tabBtnCats.classList.toggle('active', tab === 'cats');

        tabContentCreate.style.display = tab === 'create' ? 'block' : 'none';
        tabContentList.style.display = tab === 'list' ? 'block' : 'none';
        if (tabContentCats) tabContentCats.style.display = tab === 'cats' ? 'block' : 'none';

        if (tab === 'list') {
            renderProductsList();
        } else if (tab === 'cats') {
            renderCategoriesList();
        }
    }

    if (tabBtnCreate) tabBtnCreate.addEventListener('click', () => switchTab('create'));
    if (tabBtnList) tabBtnList.addEventListener('click', () => switchTab('list'));
    if (tabBtnCats) tabBtnCats.addEventListener('click', () => switchTab('cats'));

    // Chips rápidos de color
    document.querySelectorAll('.chip-btn').forEach(chip => {
        chip.addEventListener('click', () => {
            const color = chip.getAttribute('data-color');
            if (!color) return;
            const current = prodColores.value.trim();
            if (!current) {
                prodColores.value = color;
            } else {
                const parts = current.split(',').map(s => s.trim().toLowerCase());
                if (!parts.includes(color.toLowerCase())) {
                    prodColores.value = `${current}, ${color}`;
                }
            }
        });
    });

    // ==============================================================================
    // 3. SUBIDA Y COMPRESIÓN DE FOTOS
    // ==============================================================================

    if (btnTriggerUpload && prodImagesInput) {
        btnTriggerUpload.addEventListener('click', (e) => {
            e.preventDefault();
            prodImagesInput.click();
        });
    }

    if (uploadDropzone && prodImagesInput) {
        uploadDropzone.addEventListener('click', (e) => {
            if (e.target !== btnTriggerUpload) {
                prodImagesInput.click();
            }
        });
    }

    if (prodImagesInput) {
        prodImagesInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            uploadStatus.style.display = 'block';
            uploadStatus.textContent = `⏳ Comprimiendo y subiendo ${files.length} foto(s)...`;
            btnSaveProduct.disabled = true;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                uploadStatus.textContent = `⏳ Comprimiendo foto ${i + 1} de ${files.length}...`;

                try {
                    // Comprimir en el navegador
                    const compressedBlob = await compressImage(file, 1200, 1200, 0.82);

                    uploadStatus.textContent = `⏳ Subiendo foto ${i + 1} a la nube...`;
                    
                    // Subir a Supabase Storage bucket 'productos'
                    const publicUrl = await window.NaranjaMandarinaSupabase.uploadProductImage(
                        compressedBlob, 
                        file.name || `foto-${Date.now()}.jpg`
                    );

                    if (publicUrl) {
                        currentUploadedImages.push(publicUrl);
                    }
                } catch (uploadErr) {
                    console.error('Error subiendo imagen:', uploadErr);
                    showAlert(`Error subiendo la foto "${file.name}": ${uploadErr.message}`, 'error');
                }
            }

            uploadStatus.style.display = 'none';
            btnSaveProduct.disabled = false;
            prodImagesInput.value = ''; // Reset input
            renderPhotoPreviews();
        });
    }

    function renderPhotoPreviews() {
        if (!photoPreviews) return;
        photoPreviews.innerHTML = '';

        if (!currentUploadedImages.length) {
            photoPreviews.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:10px; color:#94a3b8; font-size:0.85rem;">
                    Aún no has agregado fotos a este producto.
                </div>
            `;
            return;
        }

        currentUploadedImages.forEach((imgUrl, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'preview-thumb';
            thumb.innerHTML = `
                <img src="${sanitizeImageUrl(imgUrl)}" alt="Foto ${index + 1}" onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
                ${index === 0 ? '<span class="primary-badge">Principal</span>' : ''}
                <button type="button" class="btn-remove-thumb" data-index="${index}" title="Quitar foto">✕</button>
            `;
            photoPreviews.appendChild(thumb);
        });

        // Eventos para quitar fotos
        photoPreviews.querySelectorAll('.btn-remove-thumb').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                currentUploadedImages.splice(idx, 1);
                renderPhotoPreviews();
            });
        });
    }

    // ==============================================================================
    // 4. CREAR Y ACTUALIZAR PRODUCTO
    // ==============================================================================

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentId = editProductId.value ? editProductId.value.trim() : '';
            const isEditing = Boolean(currentId);
            const nombre = prodNombre.value.trim();
            const categoria = prodCategoria.value;
            const precio = parseInt(prodPrecio.value, 10);
            const descripcion = prodDescripcion.value.trim();
            const materiales = prodMateriales.value.trim();
            const garantia = prodGarantia.value.trim();
            const disponible = prodDisponible.checked;

            // Procesar colores como array
            const coloresRaw = prodColores.value.trim();
            const colores = coloresRaw 
                ? coloresRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
                : ['multicolor'];

            // Validar campos mínimos
            if (!nombre || isNaN(precio) || precio <= 0) {
                showAlert('Por favor ingresa un nombre y un precio válido en COP.', 'error');
                return;
            }

            if (!currentUploadedImages.length) {
                showAlert('Por favor agrega al menos una foto para el producto.', 'error');
                return;
            }

            btnSaveProduct.disabled = true;
            btnSaveProduct.textContent = isEditing ? 'Guardando cambios... ⏳' : 'Subiendo producto a la tienda... ⏳';

            // ÚNICAMENTE columnas reales de la tabla public.productos
            const payload = {
                categoria,
                nombre,
                precio,
                descripcion,
                materiales,
                garantia,
                colores,
                imagenes: currentUploadedImages,
                disponible
            };

            try {
                if (isEditing) {
                    await window.NaranjaMandarinaSupabase.updateProduct(currentId, payload);
                    showAlert(`¡Producto "${nombre}" guardado y actualizado correctamente!`, 'success');
                } else {
                    await window.NaranjaMandarinaSupabase.createProduct(payload);
                    showAlert(`¡Producto "${nombre}" publicado exitosamente en la tienda!`, 'success');
                }

                resetForm();
                await loadAdminProducts();
                switchTab('list');
            } catch (saveErr) {
                console.error('Error guardando producto:', saveErr);
                showAlert(`No se pudo guardar el producto: ${saveErr.message || 'Error en la base de datos.'}`, 'error');
            } finally {
                btnSaveProduct.disabled = false;
                btnSaveProduct.textContent = isEditing ? '💾 Actualizar Producto' : '💾 Guardar Producto en la Tienda';
            }
        });
    }

    function resetForm() {
        productForm.reset();
        editProductId.value = '';
        currentUploadedImages = [];
        prodGarantia.value = 'Garantía por defectos de confección y costuras.';
        prodDisponible.checked = true;
        formHeading.textContent = '';
        const addIcon = document.createElement('span');
        addIcon.textContent = '➕ ';
        formHeading.appendChild(addIcon);
        formHeading.appendChild(document.createTextNode('Nuevo Producto'));
        btnSaveProduct.textContent = '💾 Guardar Producto en la Tienda';
        btnCancelEdit.style.display = 'none';
        renderPhotoPreviews();
    }

    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            resetForm();
            showAlert('Edición cancelada.', 'success', 2000);
        });
    }

    // ==============================================================================
    // 5. GESTIÓN DE CATEGORÍAS / COLECCIONES DINÁMICAS
    // ==============================================================================

    async function loadCategories() {
        try {
            categoriesList = await window.NaranjaMandarinaSupabase.fetchCategories({ onlyAvailable: false });
            if (catsCount) catsCount.textContent = categoriesList.length;

            // Actualizar selector desplegable del formulario de producto
            if (prodCategoria) {
                const currentVal = prodCategoria.value;
                prodCategoria.innerHTML = '';
                categoriesList.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.slug;
                    opt.textContent = `${cat.icono || '🛍️'} ${cat.nombre}`;
                    prodCategoria.appendChild(opt);
                });
                if (currentVal && categoriesList.some(c => c.slug === currentVal)) {
                    prodCategoria.value = currentVal;
                }
            }

            renderFilterChips();
            renderCategoriesList();
        } catch (err) {
            console.error('Error cargando categorías:', err);
        }
    }

    function renderFilterChips() {
        if (!adminFilterContainer) return;
        adminFilterContainer.innerHTML = '';

        // Chip 'Todas'
        const allChip = document.createElement('button');
        allChip.type = 'button';
        allChip.className = `admin-filter-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`;
        allChip.setAttribute('data-filter', 'all');
        allChip.textContent = `Todas (${productsList.length})`;
        allChip.addEventListener('click', () => {
            activeCategoryFilter = 'all';
            renderFilterChips();
            renderProductsList();
        });
        adminFilterContainer.appendChild(allChip);

        // Chips por categoría dinámica
        categoriesList.forEach(cat => {
            const count = productsList.filter(p => p.categoria === cat.slug).length;
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `admin-filter-chip ${activeCategoryFilter === cat.slug ? 'active' : ''}`;
            chip.setAttribute('data-filter', cat.slug);
            chip.textContent = `${cat.icono || '🛍️'} ${cat.nombre} (${count})`;
            chip.addEventListener('click', () => {
                activeCategoryFilter = cat.slug;
                renderFilterChips();
                renderProductsList();
            });
            adminFilterContainer.appendChild(chip);
        });
    }

    function renderCategoriesList() {
        if (!adminCategoriesList) return;
        adminCategoriesList.innerHTML = '';

        if (!categoriesList.length) {
            adminCategoriesList.innerHTML = `
                <div style="text-align:center; padding:30px; color:#64748b; grid-column:1/-1;">
                    No hay colecciones registradas aún.
                </div>
            `;
            return;
        }

        categoriesList.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'admin-cat-card';
            card.style.cssText = 'background:white; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.04); display:flex; flex-direction:column;';

            const coverUrl = sanitizeImageUrl(cat.imagen_portada || 'images/catalogo/placeholder.jpg');
            const safeName = escapeHTML(cat.nombre || '');
            const safeIcon = escapeHTML(cat.icono || '🛍️');
            const safeDesc = escapeHTML(cat.descripcion || 'Colección exclusiva');
            const safeSlug = escapeHTML(cat.slug);
            const prodsInCat = productsList.filter(p => p.categoria === cat.slug).length;

            card.innerHTML = `
                <div style="height:120px; position:relative; overflow:hidden; background:#ffedd5;">
                    <img src="${coverUrl}" alt="${safeName}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
                    <div style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.65); color:white; padding:3px 8px; border-radius:8px; font-size:0.75rem; font-weight:700;">
                        ${prodsInCat} productos
                    </div>
                </div>
                <div style="padding:14px; flex:1; display:flex; flex-direction:column;">
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                        <span style="font-size:1.3rem;">${safeIcon}</span>
                        <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:#0f172a;">${safeName}</h4>
                    </div>
                    <p style="margin:0 0 10px 0; font-size:0.8rem; color:#64748b; line-height:1.3; flex:1;">${safeDesc}</p>
                    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px; word-break:break-all;">
                        🔗 <code>catalogo.html?categoria=${safeSlug}</code>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <a href="catalogo.html?categoria=${safeSlug}" target="_blank" style="flex:1; text-align:center; padding:8px; background:#fff7ed; color:#ea580c; border:1px solid #fed7aa; border-radius:10px; font-weight:700; font-size:0.85rem; text-decoration:none;">
                            👁️ Ver Catálogo
                        </a>
                        <button type="button" class="btn-delete-cat" data-id="${escapeHTML(cat.id || '')}" data-name="${safeName}" style="padding:8px 12px; background:#fee2e2; color:#dc2626; border:none; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer;" title="Eliminar colección">
                            🗑️
                        </button>
                    </div>
                </div>
            `;

            adminCategoriesList.appendChild(card);
        });

        // Eventos de eliminar categoría
        adminCategoriesList.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                if (!id) {
                    showAlert('Esta es una categoría base del sistema.', 'error');
                    return;
                }
                if (confirm(`¿Segura que deseas eliminar la colección "${name}"? Los productos asignados a ella deberán reubicarse.`)) {
                    btn.disabled = true;
                    btn.textContent = '...';
                    try {
                        await window.NaranjaMandarinaSupabase.deleteCategory(id);
                        showAlert(`Colección "${name}" eliminada.`, 'success');
                        await loadCategories();
                        await loadAdminProducts();
                    } catch (err) {
                        showAlert(`Error al eliminar colección: ${err.message}`, 'error');
                        btn.disabled = false;
                        btn.textContent = '🗑️';
                    }
                }
            });
        });
    }

    // Modal de Crear Colección
    function openCategoryModal() {
        if (!modalCreateCategory) return;
        categoryForm.reset();
        selectedCatCoverBlob = null;
        if (catCoverPreview) catCoverPreview.style.display = 'none';
        if (catCoverImg) catCoverImg.src = '';
        if (catIcono) catIcono.value = '🛍️';
        modalCreateCategory.style.display = 'flex';
        setTimeout(() => catNombre && catNombre.focus(), 150);
    }

    function closeCategoryModal() {
        if (modalCreateCategory) modalCreateCategory.style.display = 'none';
    }

    if (btnOpenCategoryModal) btnOpenCategoryModal.addEventListener('click', openCategoryModal);
    if (btnCreateCatFromTab) btnCreateCatFromTab.addEventListener('click', openCategoryModal);
    if (btnCloseCatModal) btnCloseCatModal.addEventListener('click', closeCategoryModal);
    if (btnCancelCatModal) btnCancelCatModal.addEventListener('click', closeCategoryModal);

    // Emojis rápidos
    quickEmojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.getAttribute('data-emoji');
            if (emoji && catIcono) catIcono.value = emoji;
        });
    });

    // Input foto de portada de colección
    if (catCoverInput) {
        catCoverInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                showAlert('Optimizando foto de portada... ⏳', 'success', 2000);
                const compressed = await compressImage(file, 1000, 1000, 0.85);
                selectedCatCoverBlob = compressed;

                const previewUrl = URL.createObjectURL(compressed);
                catCoverImg.src = previewUrl;
                catCoverPreview.style.display = 'block';
            } catch (err) {
                showAlert(`No se pudo procesar la foto: ${err.message}`, 'error');
            }
        });
    }

    if (btnRemoveCatCover) {
        btnRemoveCatCover.addEventListener('click', () => {
            selectedCatCoverBlob = null;
            catCoverInput.value = '';
            catCoverImg.src = '';
            catCoverPreview.style.display = 'none';
        });
    }

    // Envío del formulario de nueva categoría
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = catNombre.value.trim();
            const icono = catIcono.value.trim() || '🛍️';
            const descripcion = catDescripcion.value.trim();

            if (!nombre) {
                showAlert('Por favor escribe un nombre para la colección.', 'error');
                return;
            }

            btnSubmitCat.disabled = true;
            btnSubmitCat.innerHTML = 'Guardando colección... ⏳';

            try {
                let coverUrl = '';
                if (selectedCatCoverBlob) {
                    const cleanSlug = window.NaranjaMandarinaSupabase.slugify(nombre);
                    coverUrl = await window.NaranjaMandarinaSupabase.uploadProductImage(
                        selectedCatCoverBlob,
                        `portada-${cleanSlug}.jpg`
                    );
                }

                const newCategory = await window.NaranjaMandarinaSupabase.createCategory({
                    nombre,
                    icono,
                    descripcion,
                    imagen_portada: coverUrl
                });

                closeCategoryModal();
                showAlert(`¡Colección "${nombre}" creada exitosamente! 🎉`, 'success', 4000);

                // Recargar categorías y seleccionarla automáticamente en el formulario
                await loadCategories();
                if (prodCategoria && newCategory && newCategory.slug) {
                    prodCategoria.value = newCategory.slug;
                }

                // Llevar a la pestaña de subir producto
                switchTab('create');
            } catch (err) {
                console.error('Error guardando categoría:', err);
                showAlert(`No se pudo crear la colección: ${err.message}`, 'error');
            } finally {
                btnSubmitCat.disabled = false;
                btnSubmitCat.innerHTML = '<span>💾</span> Guardar Catálogo';
            }
        });
    }

    // ==============================================================================
    // 6. CARGAR Y RENDERIZAR LISTA DE PRODUCTOS
    // ==============================================================================

    async function loadAdminProducts() {
        try {
            adminProductsList.innerHTML = `
                <div style="text-align:center; padding:30px; color:#64748b;">
                    <div style="font-size:2rem; margin-bottom:8px;">⏳</div>
                    Cargando productos desde Supabase...
                </div>
            `;

            productsList = await window.NaranjaMandarinaSupabase.fetchAllAdminProducts();
            
            // Actualizar contadores
            tabCount.textContent = productsList.length;
            const activeCount = productsList.filter(p => p.disponible).length;
            statsPill.textContent = `${activeCount} activos / ${productsList.length} total`;

            renderFilterChips();
            renderProductsList();
            renderCategoriesList();
        } catch (err) {
            console.error('Error cargando lista admin:', err);
            adminProductsList.innerHTML = `
                <div style="text-align:center; padding:30px; color:#dc2626;">
                    <div style="font-size:2rem; margin-bottom:8px;">⚠️</div>
                    <p style="font-weight:700;">Error cargando productos.</p>
                    <p style="font-size:0.85rem; color:#64748b;">${err.message}</p>
                    <button onclick="window.location.reload()" style="margin-top:10px; padding:8px 16px; background:#ea580c; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    function renderProductsList() {
        if (!adminProductsList) return;
        adminProductsList.innerHTML = '';

        // Filtro por categoría y búsqueda
        let filtered = [...productsList];

        if (activeCategoryFilter !== 'all') {
            filtered = filtered.filter(p => p.categoria === activeCategoryFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(q)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(q))
            );
        }

        if (!filtered.length) {
            adminProductsList.innerHTML = `
                <div style="text-align:center; padding:40px 16px; background:white; border-radius:14px; border:1px dashed #cbd5e1;">
                    <div style="font-size:2.5rem; margin-bottom:8px;">🎀</div>
                    <h3 style="font-size:1.15rem; font-weight:800; color:#1e293b; margin:0 0 6px 0;">
                        No hay productos para mostrar
                    </h3>
                    <p style="font-size:0.9rem; color:#64748b; margin:0 0 16px 0;">
                        ${productsList.length === 0 ? 'Aún no has agregado productos a tu tienda.' : 'Ningún producto coincide con tu búsqueda o filtro.'}
                    </p>
                    <button type="button" onclick="document.getElementById('tab-btn-create').click()" style="padding:10px 18px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;">
                        ➕ Agregar el primer producto
                    </button>
                </div>
            `;
            return;
        }

        const fallbackNames = {
            balacas: '🎀 Balacas',
            accesorios: '✨ Accesorios',
            blusas: '👚 Blusas',
            faldas: '👗 Faldas',
            vestidos: '💃 Vestidos',
            banos: '👙 Baños'
        };

        filtered.forEach(prod => {
            const card = document.createElement('div');
            card.className = `product-item-card ${prod.disponible ? '' : 'is-paused'}`;

            const mainImg = (prod.imagenes && prod.imagenes[0]) || 'images/catalogo/placeholder.jpg';
            const catObj = categoriesList.find(c => c.slug === prod.categoria);
            const catLabel = catObj ? `${catObj.icono || '🛍️'} ${catObj.nombre}` : (fallbackNames[prod.categoria] || prod.categoria);
            const safeName = escapeHTML(prod.nombre || '');
            const safeCat = escapeHTML(catLabel);
            const safeId = escapeHTML(prod.id);
            const safeImg = sanitizeImageUrl(mainImg);

            card.innerHTML = `
                <div class="item-thumb-wrapper">
                    <img src="${safeImg}" alt="${safeName}" loading="lazy" onerror="this.onerror=null;this.src='images/catalogo/placeholder.jpg';">
                </div>
                <div class="item-info">
                    <span class="item-category-tag">${safeCat}</span>
                    <h3 class="item-name">${safeName}</h3>
                    <p class="item-price">$${formatCOP(prod.precio)} COP</p>
                    <div class="item-status-badge ${prod.disponible ? 'active' : 'paused'}">
                        ${prod.disponible ? '● Visible en tienda' : '⏸️ Pausado'}
                    </div>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn-action-icon btn-action-edit" data-id="${safeId}" title="Editar">
                        ✏️ Editar
                    </button>
                    <button type="button" class="btn-action-icon btn-action-pause" data-id="${safeId}" data-status="${Boolean(prod.disponible)}" title="${prod.disponible ? 'Pausar' : 'Activar'}">
                        ${prod.disponible ? '⏸️ Pausar' : '▶️ Activar'}
                    </button>
                    <button type="button" class="btn-action-icon btn-action-delete" data-id="${safeId}" data-name="${safeName}" title="Eliminar">
                        🗑️
                    </button>
                </div>
            `;

            adminProductsList.appendChild(card);
        });

        // Conectar botones de cada tarjeta
        adminProductsList.querySelectorAll('.btn-action-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const prod = productsList.find(p => String(p.id) === String(id));
                if (prod) startEditProduct(prod);
            });
        });

        adminProductsList.querySelectorAll('.btn-action-pause').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const currentStatus = btn.getAttribute('data-status') === 'true';
                btn.disabled = true;
                btn.textContent = '...';

                try {
                    await window.NaranjaMandarinaSupabase.toggleProductAvailability(id, currentStatus);
                    showAlert(`Producto ${currentStatus ? 'pausado (ya no se ve en tienda)' : 'activado (visible en tienda)'}.`, 'success', 2500);
                    await loadAdminProducts();
                } catch (err) {
                    showAlert(`Error al cambiar estado: ${err.message}`, 'error');
                }
            });
        });

        adminProductsList.querySelectorAll('.btn-action-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                openDeleteModal(id, name);
            });
        });
    }

    // Iniciar edición de un producto
    function startEditProduct(prod) {
        editProductId.value = prod.id;
        prodCategoria.value = prod.categoria || 'balacas';
        prodNombre.value = prod.nombre || '';
        prodPrecio.value = prod.precio || '';
        prodDescripcion.value = prod.descripcion || '';
        prodMateriales.value = prod.materiales || '';
        prodGarantia.value = prod.garantia || '';
        prodDisponible.checked = Boolean(prod.disponible);
        prodColores.value = Array.isArray(prod.colores) ? prod.colores.join(', ') : (prod.colores || '');

        currentUploadedImages = Array.isArray(prod.imagenes) ? [...prod.imagenes] : [];
        renderPhotoPreviews();

        formHeading.textContent = '';
        const editIcon = document.createElement('span');
        editIcon.textContent = '✏️ ';
        formHeading.appendChild(editIcon);
        formHeading.appendChild(document.createTextNode(`Editando: ${prod.nombre || ''}`));
        btnSaveProduct.textContent = '💾 Actualizar Cambios del Producto';
        btnCancelEdit.style.display = 'inline-block';

        switchTab('create');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Modal de eliminación
    function openDeleteModal(id, name) {
        pendingDeleteId = id;
        deleteProductName.textContent = `¿Segura que deseas eliminar "${name}"? Desaparecerá de la tienda.`;
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() {
        pendingDeleteId = null;
        deleteModal.style.display = 'none';
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!pendingDeleteId) return;

            btnConfirmDelete.disabled = true;
            btnConfirmDelete.textContent = 'Eliminando...';

            try {
                await window.NaranjaMandarinaSupabase.deleteProduct(pendingDeleteId);
                closeDeleteModal();
                showAlert('Producto eliminado correctamente.', 'success');
                await loadAdminProducts();
            } catch (err) {
                showAlert(`No se pudo eliminar: ${err.message}`, 'error');
            } finally {
                btnConfirmDelete.disabled = false;
                btnConfirmDelete.textContent = 'Sí, Eliminar';
            }
        });
    }

    // Buscador en tiempo real
    if (adminSearch) {
        adminSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProductsList();
        });
    }

    // Cierre del modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (deleteModal && deleteModal.style.display === 'flex') closeDeleteModal();
            if (modalCreateCategory && modalCreateCategory.style.display === 'flex') closeCategoryModal();
        }
    });
});
