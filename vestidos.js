// ==============================================================================
// VESTIDOS.JS - CATÁLOGO DE VESTIDOS PARA DAMA (NARANJA MANDARINA)
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar catálogo desde Supabase
    if (typeof initCatalog === 'function') {
        await initCatalog({
            category: 'vestidos',
            gridId: 'catalog-grid',
            whatsappNumber: '573152791288'
        });
    } else {
        console.error('initCatalog no está disponible. Verifica que catalog-common.js esté cargado.');
    }

    // 2. Conectar controles de filtros avanzados
    const filterColorSelect = document.getElementById('filter-color');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const sortBySelect = document.getElementById('sort-by');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const priceMin = priceMinInput && priceMinInput.value ? Number(priceMinInput.value) : null;
            const priceMax = priceMaxInput && priceMaxInput.value ? Number(priceMaxInput.value) : null;
            const sortBy = sortBySelect ? sortBySelect.value : '';
            const activeColor = filterColorSelect ? filterColorSelect.value : 'all';

            document.dispatchEvent(new CustomEvent('filterChange', {
                detail: { color: activeColor, priceMin, priceMax, sortBy }
            }));
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (priceMinInput) priceMinInput.value = '';
            if (priceMaxInput) priceMaxInput.value = '';
            if (sortBySelect) sortBySelect.value = '';
            if (filterColorSelect) filterColorSelect.value = 'all';

            document.dispatchEvent(new CustomEvent('filterChange', {
                detail: { color: 'all', priceMin: null, priceMax: null, sortBy: '' }
            }));
        });
    }
});