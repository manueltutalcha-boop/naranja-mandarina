# 🧪 Checklist de Pruebas - Balacas Editor Mode

## ✅ Verificaciones Realizadas

### 1. Editor Mode Activation
- [x] localStorage 'editorMode' === 'true' activa botones
- [x] Botón "Agregar Producto" visible solo en modo editor
- [x] Botón "Salir modo editor" visible solo en modo editor
- [x] Console log confirma modo: `✅ Modo editor activado para balacas`

### 2. Modal Agregar Producto (#add-product-modal)
- [x] Se abre al clickear "Agregar Producto"
- [x] Form con campos: nombre, precio, descripción, materiales, imágenes
- [x] Textarea con drag-drop zone (borde naranja punteado)
- [x] Preview grid (3 columnas)

### 3. Drag & Drop Funcionalidad
- [x] setupDragDrop() se llama al abrir modales
- [x] Detecta archivos imagen (JPG, PNG, GIF)
- [x] FileReader.readAsDataURL() genera base64
- [x] Agrega URLs al textarea automáticamente
- [x] Actualiza previews en tiempo real
- [x] Valida límite máximo de 6 imágenes

### 4. Previews Interactivos
**showPreviews() y showAddPreviews():**
- [x] Thumbnails con borde naranja (hover effect)
- [x] Botón X rojo aparece en hover
- [x] Clic en imagen abre full (URLs en nueva tab, base64 en ventana)
- [x] Botón X remueve imagen correctamente
- [x] Numeración (1-6) en badge negro
- [x] Mensajes dinámicos:
  - "📷 No hay imágenes..." (0 imágenes)
  - "⚠️ Necesitas X imagen(es) más" (< 3)
  - "✅ Máximo alcanzado" (= 6)

### 5. Validación de Imágenes
**Modal Editar:**
- [x] Alerta si < 3 imágenes: "⚠️ ¡Agrega al menos 3 imágenes..."
- [x] Trunca a 6 si > 6: "✂️ Tomamos solo las primeras 6..."

**Modal Agregar:**
- [x] Valida nombre no vacío
- [x] Valida precio > 0
- [x] Alerta si < 3 imágenes con contador actual
- [x] Trunca a 6 si > 6

### 6. Guardar Producto
**Proceso completo:**
- [x] Genera ID auto-incremental (max + 1)
- [x] Crea objeto producto con imagenes: []
- [x] POST a `/.netlify/functions/update_catalogo`
- [x] Body: `{ categoria: 'balacas', productos: balacasProducts }`
- [x] Actualiza localStorage para feedback inmediato
- [x] Re-render grid con initCatalog()
- [x] Cierra modal con alerta éxito
- [x] Fallback local si error servidor

### 7. Textarea Input Listener
- [x] Modal Editar: listener agregado en openEditModal() con flag 'data-listener-added'
- [x] Modal Agregar: listener en setup inicial
- [x] Actualiza previews al escribir URLs manualmente

### 8. Integridad de Datos
- [x] balacasImages[id] = array de URLs/base64
- [x] vincha.imagenes guarda array completo
- [x] No interfiere con filtros (CustomEvent 'filterChange')
- [x] No afecta WhatsApp float
- [x] catalog-common.js sigue funcionando

## 🐛 Bugs Corregidos

1. **Botón X desincronización:** Ahora lee textarea actual antes de splice
2. **Base64 no abre:** Usa window.open() con document.write() para base64
3. **Listener duplicado:** Flag 'data-listener-added' previene múltiples listeners
4. **Validación específica:** Mensajes con contadores exactos

## 🧪 Pasos para Probar en localhost:3000

### Prueba 1: Agregar Producto con URLs
1. Login → `localStorage.setItem('editorMode', 'true')`
2. Ir a `/balacas.html`
3. Clic "Agregar Producto" (botón naranja)
4. Llenar:
   - Nombre: "Balaca Flores Rojas"
   - Precio: 15000
   - Descripción: "Hermosa balaca artesanal"
   - Materiales: "Tela, flores, encaje"
   - Imágenes: Pegar 4 URLs de Google Drive (una por línea)
5. Ver previews aparecer automáticamente
6. Submit → Verificar alerta éxito
7. Ver producto en grid con thumbnail

### Prueba 2: Drag & Drop Archivos
1. Clic "Agregar Producto"
2. Llenar nombre y precio
3. Arrastrar 3 imágenes JPG desde PC al textarea naranja
4. Ver highlight naranja durante drag
5. Ver previews con base64 automático
6. Clic en preview → abre en ventana nueva
7. Submit → producto guardado

### Prueba 3: Validación < 3 Imágenes
1. Clic "Agregar Producto"
2. Llenar nombre y precio
3. Pegar solo 1 URL
4. Ver warning "⚠️ Necesitas 2 imagen(es) más"
5. Submit → alerta detallada con contador
6. Agregar 2 URLs más
7. Warning desaparece
8. Submit exitoso

### Prueba 4: Remover Imágenes
1. Editar producto existente
2. Hover sobre preview → botón X aparece
3. Clic X → imagen removida
4. Textarea actualizado
5. Previews re-renderizados con numeración correcta

### Prueba 5: Límite 6 Imágenes
1. Arrastrar 8 imágenes a textarea
2. Alerta: "⚠️ Máximo 6 imágenes..."
3. Solo primeras 6 agregadas
4. Submit → guarda exactamente 6

## 📊 Console Logs Esperados (sin errores)

```
✅ Modo editor activado para balacas
🔍 [BALACAS DEBUG] Intentando cargar desde servidor...
🔍 [BALACAS DEBUG] Response status: 200 true
🔍 [BALACAS DEBUG] Datos recibidos del servidor: {...}
🔍 [BALACAS DEBUG] Productos cargados del servidor: X
```

**No debe haber:**
- ❌ "Uncaught TypeError..."
- ❌ "Cannot read property..."
- ❌ "Failed to fetch..."

## ✅ Resultado Final

Todo funcional:
- ✅ Editor mode verifica localStorage correctamente
- ✅ Drag-drop con FileReader funciona
- ✅ Previews interactivos (clic, remover)
- ✅ Validación 3-6 imágenes estricta
- ✅ POST a Functions con array imagenes
- ✅ Re-render grid automático
- ✅ Fallback local si servidor falla
- ✅ Sin errores en console

---

**Desarrollado con amor 🧡 - MC Digital Solutions**
