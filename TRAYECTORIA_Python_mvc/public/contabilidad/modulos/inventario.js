/**
 * ARCHIVO: inventario.js
 * SISTEMA: Gestión de Inventario BizFlow Studio - Neon DB & Cloudinary
 * ESTADO: Blindado contra colisiones de ID y errores de tipado (Firefox/Chrome)
 * ACTUALIZADO: Sistema de contexto robusto para iframe, móvil e incógnito
 */

const API_BASE = "https://trayectoria-backend.onrender.com/api";

let contextWatcher = null;

// ==========================================
// SISTEMA DE CONTEXTO ROBUSTO
// ==========================================

/**
 * Obtener BizContext desde cualquier contexto
 */
function getBizContext() {
    if (window.bizContext) return window.bizContext;
    try {
        if (window.parent && window.parent !== window && window.parent.bizContext) {
            return window.parent.bizContext;
        }
    } catch (e) {}
    return null;
}

/**
 * Obtener negocio activo
 */
function obtenerNegocioActivo() {
    const bizContext = getBizContext();
    if (bizContext && bizContext.hasNegocio()) {
        const ctx = bizContext.getContexto();
        return { id: ctx.negocio_id, nombre: ctx.negocio_nombre };
    }
    
    const nId = localStorage.getItem('negocio_id');
    const nNombre = localStorage.getItem('negocio_nombre');
    if (nId && nId !== 'undefined' && nId !== 'null') {
        return { id: nId, nombre: nNombre };
    }
    return null;
}

/**
 * Vigilancia de cambios de contexto
 */
function iniciarVigilanciaContexto() {
    let ultimoId = obtenerNegocioActivo()?.id;
    
    // Escuchar eventos si BizContext está disponible
    const bizContext = getBizContext();
    if (bizContext) {
        const targetWindow = window.parent && window.parent.bizContext ? window.parent : window;
        targetWindow.addEventListener('bizContextChanged', handleContextChange);
        targetWindow.addEventListener('bizContextCleared', handleContextCleared);
        console.log('✅ Escuchando eventos de BizContext (inventario)');
    }
    
    // Polling como fallback universal
    contextWatcher = setInterval(() => {
        const nuevoId = localStorage.getItem('negocio_id');
        if (nuevoId !== ultimoId && nuevoId !== 'undefined' && nuevoId !== 'null') {
            console.log('🔄 Negocio cambió, recargando inventario...');
            ultimoId = nuevoId;
            
            // Actualizar nombre en header
            const businessNameEl = document.getElementById('active-business-name');
            const negocio = obtenerNegocioActivo();
            if (businessNameEl && negocio) {
                businessNameEl.textContent = negocio.nombre || 'Mi Inventario';
            }
            
            cargarInventario();
        }
    }, 1000);
    
    console.log('✅ Vigilancia de contexto iniciada (inventario)');
}

function handleContextChange(event) {
    if (event.detail.type === 'negocio') {
        console.log('🔄 Evento bizContextChanged recibido (inventario)');
        const businessNameEl = document.getElementById('active-business-name');
        if (businessNameEl) {
            businessNameEl.textContent = event.detail.negocio.nombre || event.detail.negocio.nombre_negocio;
        }
        cargarInventario();
    }
}

function handleContextCleared() {
    console.log('🧹 Evento bizContextCleared recibido (inventario)');
    const businessNameEl = document.getElementById('active-business-name');
    if (businessNameEl) {
        businessNameEl.textContent = 'Selecciona un negocio';
    }
    
    const lista = document.getElementById('lista-productos');
    if (lista) {
        lista.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#f59e0b;">
            <i class="bi bi-building-exclamation" style="font-size: 2rem; display:block; margin-bottom:10px;"></i>
            <b>Selecciona un negocio</b><br>
            <small>Debes seleccionar un negocio en el panel lateral para ver su inventario.</small>
        </td></tr>`;
    }
}

function detenerVigilanciaContexto() {
    if (contextWatcher) {
        clearInterval(contextWatcher);
        contextWatcher = null;
    }
    
    const bizContext = getBizContext();
    if (bizContext) {
        const targetWindow = window.parent && window.parent.bizContext ? window.parent : window;
        targetWindow.removeEventListener('bizContextChanged', handleContextChange);
        targetWindow.removeEventListener('bizContextCleared', handleContextCleared);
    }
    
    console.log('🛑 Vigilancia de contexto detenida (inventario)');
}

/**
 * 0. CARGAR CATEGORÍAS PERSONALIZADAS
 * Lee las categorías desde config_tienda del negocio
 */
async function cargarCategorias() {
    const selectCategoria = document.getElementById('selectCategoria');
    if (!selectCategoria) return;

    const negocio = obtenerNegocioActivo();
    const nId = negocio?.id;

    // Fallback hardcodeado solo si todo falla
    const DEFAULTS = ['General', 'Accesorios', 'Herramientas', 'Repuestos', 'Ropa'];

    let nombres = [];

    // ── Fuente única: /api/categorias (misma que usa el Designer) ──
    if (nId) {
        try {
            const res = await fetch(`${API_BASE}/categorias?negocio_id=${nId}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                const lista = data.categorias || data;
                if (Array.isArray(lista) && lista.length > 0) {
                    nombres = lista.map(c => c.nombre || c.name || c).filter(Boolean);
                    console.log('✅ Categorías desde BD:', nombres);
                }
            }
        } catch (e) {
            console.warn('⚠️ Error cargando categorías desde API:', e);
        }
    }

    // Fallback: categorías extraídas de los productos existentes en el inventario
    if (nombres.length === 0) {
        try {
            const rows = document.querySelectorAll('#lista-productos tr[data-categoria]');
            const fromTable = [...new Set([...rows].map(r => r.dataset.categoria).filter(Boolean))];
            if (fromTable.length > 0) {
                nombres = fromTable;
                console.log('✅ Categorías desde tabla de inventario:', nombres);
            }
        } catch (e) {}
    }

    if (nombres.length === 0) nombres = DEFAULTS;

    selectCategoria.innerHTML =
        nombres.map(n => `<option value="${n}">${n}</option>`).join('') +
        `<option value="OTRA">-- Nueva Categoría --</option>`;
}

/**
 * 1. CARGAR PRODUCTOS (GET)
 * Renderiza la tabla de inventario consumiendo la ruta /mis-productos
 * CORREGIDO: Ahora filtra por negocio_id para evitar mezcla de productos
 */
async function cargarInventario() {
    const lista = document.getElementById('lista-productos');
    if (!lista) return;

    // --- IDENTIDAD ESTRICTA ---
    const uId = localStorage.getItem('usuario_id');
    const token = localStorage.getItem("authToken");
    
    const negocio = obtenerNegocioActivo();
    const nId = negocio?.id;

    // Bloqueo preventivo: Si no hay ID de usuario válido
    if (!uId || uId === 'undefined' || uId === 'null' || uId === '1') {
        console.error("☣️ CRÍTICO: Identidad no válida o ID genérico detectado. Abortando.");
        lista.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#e11d48;">
            <i class="bi bi-shield-exclamation"></i> Sesión no válida. Por favor, reingresa desde el Panel Maestro.
        </td></tr>`;
        return;
    }

    // Bloqueo preventivo: Si no hay negocio seleccionado
    if (!nId || nId === 'undefined' || nId === 'null') {
        console.error("☣️ CRÍTICO: No hay negocio seleccionado.");
        lista.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#f59e0b;">
            <i class="bi bi-building-exclamation" style="font-size: 2rem; display:block; margin-bottom:10px;"></i>
            <b>Selecciona un negocio</b><br>
            <small>Debes seleccionar un negocio en el panel lateral para ver su inventario.</small>
        </td></tr>`;
        return;
    }

    // --- ANTI-CACHÉ Y TIPADO LIMPIO ---
    const cleanUserId = String(uId).trim();
    const cleanNegocioId = String(nId).trim();
    
    // ==========================================
    // CORREGIDO: Incluir negocio_id en la consulta
    // ==========================================
    const urlBusqueda = `${API_BASE}/mis-productos?usuario_id=${cleanUserId}&negocio_id=${cleanNegocioId}&t=${new Date().getTime()}`;

    console.log(`📡 Sincronizando Catálogo para Usuario: ${cleanUserId}, Negocio: ${cleanNegocioId}...`);

    // Actualizar nombre del negocio en header
    const businessNameEl = document.getElementById('active-business-name');
    if (businessNameEl && negocio) {
        businessNameEl.textContent = negocio.nombre || 'Mi Inventario';
    }

    try {
        const res = await fetch(urlBusqueda, { 
            method: 'GET',
            mode: 'cors',
            headers: { 
                'X-User-ID': cleanUserId,
                'X-Business-ID': cleanNegocioId,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            } 
        });
        
        if (!res.ok) throw new Error(`Error en servidor: ${res.status}`);
        
        const result = await res.json();

        // --- VERIFICACIÓN DE INTEGRIDAD DE RESPUESTA ---
        if (result.debug_user && String(result.debug_user) !== cleanUserId) {
            console.warn("🚨 ALERTA DE SEGURIDAD: Desincronización de identidad detectada.");
            location.reload();
            return;
        }

        if (result.success && Array.isArray(result.data)) {
            // ==========================================
            // FILTRO ADICIONAL EN FRONTEND (doble seguridad)
            // ==========================================
            const productosDelNegocio = result.data.filter(p => {
                // Si el producto tiene negocio_id, verificar que coincida
                if (p.negocio_id) {
                    return String(p.negocio_id) === cleanNegocioId;
                }
                return true; // Si no tiene negocio_id, mostrar (compatibilidad)
            });

            if (productosDelNegocio.length === 0) {
                lista.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
                    <i class="bi bi-box-seam" style="font-size: 2rem; display:block; margin-bottom:10px;"></i>
                    No tienes productos registrados en este negocio.<br>
                    <small style="color:#94a3b8;">Haz clic en "Nuevo Producto" para agregar tu primer producto.</small>
                </td></tr>`;
                return;
            }

            lista.innerHTML = productosDelNegocio.map(p => {
                const precio = parseFloat(p.precio) || 0;
                const costo = parseFloat(p.costo) || 0;
                const stock = parseInt(p.stock) || 0;
                const pId = p.id_producto || p.id;
                const fotoUrl = p.imagen_url || 'https://via.placeholder.com/150?text=No+Img';

                return `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: 0.2s;">
                    <td style="padding:12px; display: flex; align-items: center; gap: 15px;">
                        <img src="${fotoUrl}" width="50" height="50" 
                             style="border-radius:12px; object-fit: cover; border: 2px solid #f8fafc; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
                             onerror="this.src='https://via.placeholder.com/150?text=Error'">
                        <div>
                            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${p.nombre}</div>
                            <span style="background:#e2e8f0; color:#475569; padding:2px 8px; border-radius:6px; font-size:0.7rem; font-weight:700;">
                                ${p.categoria || 'General'}
                            </span>
                        </div>
                    </td>
                    <td style="font-size:0.85rem; color:#64748b; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${p.descripcion || 'Sin descripción'}
                    </td>
                    <td style="font-weight: 600; color: #64748b;">$ ${costo.toLocaleString('es-CO')}</td>
                    <td style="font-weight: 700; color: #0ea5e9;">$ ${precio.toLocaleString('es-CO')}</td>
                    <td>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight: 800; color:${stock > 0 ? '#10b981' : '#ef4444'}; font-size:0.9rem;">
                                ${stock} unid.
                            </span>
                            <small style="font-size:0.65rem; color:#94a3b8;">DISPONIBLE</small>
                        </div>
                    </td>
                    <td style="text-align: center;">
                        <button onclick="eliminarProducto(${pId})" 
                                style="background:#fff1f2; border:1px solid #fecdd3; color:#e11d48; padding: 8px 12px; border-radius: 10px; cursor:pointer; font-size:0.8rem; font-weight:700;">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }
    } catch (err) { 
        console.error("❌ Error al cargar inventario:", err);
        lista.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ef4444;">
            <b>Error de Sincronización (Backend)</b><br>${err.message}</td></tr>`;
    }
}

/**
 * 2. AGREGAR PRODUCTO (POST)
 * Maneja FormData para enviar archivos a Cloudinary y datos a Neon DB
 */
async function guardarProducto() {
    const form = document.getElementById('formProducto');
    const btn = document.getElementById('btnGuardar');
    if (!form || !btn) return;

    const uId = localStorage.getItem('usuario_id');
    const negocio = obtenerNegocioActivo();
    const nId = negocio?.id;
    const sId = localStorage.getItem('sucursal_id') || '1';

    if (!uId || uId === '1' || uId === '0') {
        alert("❌ Error de seguridad: No puedes guardar productos sin una sesión válida propia.");
        return;
    }

    if (!nId || nId === 'undefined' || nId === 'null') {
        alert("❌ Debes seleccionar un negocio antes de agregar productos.");
        return;
    }

    const nombreVal = form.nombre.value.trim();
    if (!nombreVal) return alert("⚠️ El nombre es obligatorio.");

    const selectCat = document.getElementById('selectCategoria').value;
    const inputNueva = document.getElementById('categoriaPersonalizada') || document.getElementById('inputNuevaCategoria');
    const categoriaNuevaTexto = inputNueva?.value.trim() || '';
    const categoriaFinal = selectCat === 'OTRA' ? (categoriaNuevaTexto || 'General') : selectCat;

    // Persistir categoría nueva en la tabla categorias_producto (misma fuente que el Designer)
    if (selectCat === 'OTRA' && categoriaNuevaTexto && nId) {
        fetch(`${API_BASE}/categorias`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: categoriaNuevaTexto, negocio_id: nId, icono: '📦' })
        }).catch(() => {});
    }

    const formData = new FormData();
    formData.append('nombre', nombreVal);
    formData.append('categoria', categoriaFinal);
    formData.append('descripcion', form.descripcion.value.trim());
    formData.append('costo', parseFloat(form.costo.value) || 0); 
    formData.append('precio', parseFloat(form.precio.value) || 0);
    formData.append('stock', parseInt(form.stock.value) || 0);
    formData.append('usuario_id', uId);
    formData.append('negocio_id', nId);  // ← Importante: enviar negocio_id
    formData.append('sucursal_id', sId);
    formData.append('tipo', 'COMPRA');

    const fileInput = document.getElementById('imagen_file');
    if (fileInput && fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]);
    }

    try {
        btn.innerText = "⏳ Guardando...";
        btn.disabled = true;

        const res = await fetch(`${API_BASE}/catalogo/producto/guardar`, {
            method: 'POST',
            mode: 'cors',
            headers: { 
                'X-User-ID': String(uId).trim(),
                'X-Business-ID': String(nId).trim()
            },
            body: formData 
        });

        const result = await res.json();

        if (result.success) {
            alert("✅ Producto guardado correctamente.");
            toggleModal(false);
            form.reset();
            await cargarInventario();
        } else {
            throw new Error(result.message || "Error al guardar");
        }
    } catch (err) { 
        alert("❌ Error al guardar: " + err.message); 
    } finally {
        btn.innerText = "Guardar";
        btn.disabled = false;
    }
}

/**
 * 3. ELIMINAR PRODUCTO (DELETE)
 */
async function eliminarProducto(id) {
    if (!id) return alert("ID de producto no válido");
    
    const uId = localStorage.getItem('usuario_id');
    const negocio = obtenerNegocioActivo();
    const nId = negocio?.id;
    
    if (!uId || uId === '1') return alert("❌ Acción no autorizada.");

    if (!confirm("¿Eliminar este producto permanentemente?")) return;

    try {
        const res = await fetch(`${API_BASE}/producto/eliminar/${id}`, { 
            method: 'DELETE',
            mode: 'cors',
            headers: { 
                'X-User-ID': String(uId).trim(),
                'X-Business-ID': String(nId).trim()
            }
        });
        
        const result = await res.json();
        if (result.success || res.ok) {
            await cargarInventario();
        } else {
            alert("❌ No se pudo eliminar: " + (result.message || "Error desconocido"));
        }
    } catch (err) { 
        console.error("Error al eliminar:", err); 
        alert("❌ Error de conexión al eliminar.");
    }
}

/**
 * UTILIDADES DE UI
 */
function toggleModal(show) {
    const modal = document.getElementById('modalProducto');
    if(modal) modal.style.display = show ? 'flex' : 'none';
}

// ==========================================
// INICIALIZACIÓN Y CLEANUP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar nombre del negocio en el header
    const negocio = obtenerNegocioActivo();
    const businessNameEl = document.getElementById('active-business-name');
    if (businessNameEl) {
        businessNameEl.textContent = negocio?.nombre || 'Selecciona un negocio';
    }
    
    // Cargar categorías personalizadas
    cargarCategorias();
    
    // Cargar inventario
    cargarInventario();
    
    // Iniciar vigilancia de cambios
    iniciarVigilanciaContexto();
});

window.addEventListener('beforeunload', () => {
    detenerVigilanciaContexto();
});