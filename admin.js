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
    const tabContentCreate = document.getElementById('tab-content-create');
    const tabContentList = document.getElementById('tab-content-list');
    const tabCount = document.getElementById('tab-count');
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

    // Subida de Fotos
    const uploadDropzone = document.getElementById('upload-dropzone');
    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    const prodImagesInput = document.getElementById('prod-images-input');
    const uploadStatus = document.getElementById('upload-status');
    const photoPreviews = document.getElementById('photo-previews');

    // Lista de Productos
    const adminProductsList = document.getElementById('admin-products-list');
    const adminSearch = document.getElementById('admin-search');
    const filterChips = document.querySelectorAll('.admin-filter-chip');

    // Modal de confirmación para eliminar
    const deleteModal = document.getElementById('delete-modal');
    const deleteProductName = document.getElementById('delete-product-name');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // Estado local
    let currentSession = null;
    let productsList = [];
    let currentUploadedImages = []; // URLs públicas de imágenes del producto actual
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

    function updateAuthState(session) {
        currentSession = session;
        if (session && session.user) {
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            btnLogout.style.display = 'inline-flex';
            userEmailBadge.textContent = `Sesión activa: ${session.user.email}`;
            loadAdminProducts();
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
        if (tab === 'create') {
            tabBtnCreate.classList.add('active');
            tabBtnList.classList.remove('active');
            tabContentCreate.style.display = 'block';
            tabContentList.style.display = 'none';
        } else {
            tabBtnCreate.classList.remove('active');
            tabBtnList.classList.add('active');
            tabContentCreate.style.display = 'none';
            tabContentList.style.display = 'block';
            renderProductsList();
        }
    }

    if (tabBtnCreate) tabBtnCreate.addEventListener('click', () => switchTab('create'));
    if (tabBtnList) tabBtnList.addEventListener('click', () => switchTab('list'));

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

            const isEditing = Boolean(editProductId.value);
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
                    await window.NaranjaMandarinaSupabase.updateProduct(editProductId.value, payload);
                    showAlert(`¡Producto "${nombre}" actualizado correctamente!`, 'success');
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
        prodGarantia.value = 'Garantía de confección artesanal y costuras por 30 días.';
        prodDisponible.checked = true;
        formHeading.innerHTML = '<span>➕</span> Nuevo Producto';
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
    // 5. CARGAR Y RENDERIZAR LISTA DE PRODUCTOS
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

            renderProductsList();
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

        const categoryNames = {
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
            const catLabel = categoryNames[prod.categoria] || prod.categoria;
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

    // Filtros de categoría en la lista
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategoryFilter = chip.getAttribute('data-filter') || 'all';
            renderProductsList();
        });
    });

    // Buscador en tiempo real
    if (adminSearch) {
        adminSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProductsList();
        });
    }

    // Cierre del modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && deleteModal.style.display === 'flex') {
            closeDeleteModal();
        }
    });
});
