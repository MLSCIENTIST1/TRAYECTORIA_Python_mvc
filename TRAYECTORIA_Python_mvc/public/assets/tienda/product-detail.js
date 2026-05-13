/**
 * 🛍️ PRODUCT DETAIL PANEL - v3.4 "LEGAL PERSONALIZATION EDITION"
 * ★ NUEVO v3.4: Aceptación legal para subida de imágenes
 * ★ Checkbox obligatorio de propiedad intelectual
 * ★ Disclaimer visible antes de subir archivo
 * ★ Validación legal en carrito y checkout
 * ★ Actualizado: Febrero 2026
 * 
 * CAMBIOS v3.4 vs v3.3:
 * - Checkbox legal obligatorio para subir imagen
 * - Texto de términos y condiciones de uso de imagen
 * - Validación: no se puede subir sin aceptar
 * - Validación: no se puede agregar al carrito sin aceptar
 * - Estado de aceptación guardado con la personalización
 * - Estilos CSS para la sección legal
 */

// Estado global del panel
let currentProduct = null;
let currentImageIndex = 0;
let isZoomed = false;
let isShowingVideo = false;

// ★ ACTUALIZADO v3.4: Estado de personalización con campo legal
let personalizacionState = {
    activa: false,
    imagen: null,
    imagenPreview: null,
    imagenNombre: null,
    texto: '',
    costoAdicional: 0,
    // ★ NUEVO v3.4: Aceptación legal
    legalAceptado: false
};

let productDetailConfig = {
    showGallery: true,
    showZoom: true,
    showVideo: true,
    showStock: true,
    showQuantity: true,
    showBuyNow: true,
    showWhatsapp: true,
    showShare: true,
    showTabs: true,
    showSpecs: true,
    showReviews: true,
    showRelated: true,
    showBreadcrumb: true,
    showDiscount: true,
    showPersonalization: true,
    requireLegalAcceptance: true,
    legalText: null,
    layout: 'panel-right',
    panelWidth: 520,
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
function initProductDetail(config = {}) {
    productDetailConfig = { ...productDetailConfig, ...config };
    createProductDetailPanel();

    // ★ v3.5 FIX: Interceptar el botón "atrás" del celular/navegador.
    // Sin esto, atrás cerraba la tienda completa en vez de solo el detalle.
    if (!window._pdPopStateBound) {
        window._pdPopStateBound = true;
        window.addEventListener('popstate', () => {
            const panel = document.getElementById('productDetailPanel');
            if (panel?.classList.contains('active')) {
                // El historial ya retrocedió por sí solo; solo cerramos UI.
                closeProductDetail(true);
            }
        });
    }

    console.log('🛍️ Product Detail v3.5 Sticky Header + Back Button Fix inicializado');
}

function _pdLayoutClass() {
    const layout = productDetailConfig.layout || 'panel-right';
    const map = { 'panel-right': 'right', 'panel-left': 'left', 'modal': 'modal', 'bottom-sheet': 'bottom' };
    return 'pd-panel pd-panel--' + (map[layout] || 'right');
}

function createProductDetailPanel() {
    // Si ya existe, actualizar layout y ancho (cuando el designer preview cambia)
    const existing = document.getElementById('productDetailPanel');
    if (existing) {
        existing.className = _pdLayoutClass();
        const w = productDetailConfig.panelWidth;
        if (w && productDetailConfig.layout !== 'modal' && productDetailConfig.layout !== 'bottom-sheet') {
            existing.style.maxWidth = w + 'px';
        }
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'productDetailOverlay';
    overlay.className = 'pd-overlay';
    overlay.onclick = closeProductDetail;

    const panel = document.createElement('div');
    panel.id = 'productDetailPanel';
    panel.className = _pdLayoutClass();
    const w = productDetailConfig.panelWidth;
    if (w && productDetailConfig.layout !== 'modal' && productDetailConfig.layout !== 'bottom-sheet') {
        panel.style.maxWidth = w + 'px';
    }
    panel.innerHTML = `
        <div class="pd-header">
            <nav id="pdBreadcrumb" class="pd-breadcrumb">
                <a href="#" onclick="closeProductDetail(); return false;">Inicio</a>
                <i class="fas fa-chevron-right"></i>
                <a href="#" id="pdCategoryLink">Categoría</a>
                <i class="fas fa-chevron-right"></i>
                <span id="pdProductName">Producto</span>
            </nav>
            <button class="pd-close" onclick="closeProductDetail()" aria-label="Volver al catálogo">
                <i class="fas fa-chevron-left"></i>
                <span class="pd-close-label">Volver</span>
            </button>
        </div>
        <div class="pd-body" id="pdBody"></div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    
    injectPersonalizationStyles();
    
    document.addEventListener('keydown', handleKeyDown);
}

// ★ ACTUALIZADO v3.4: Estilos con sección legal
function injectPersonalizationStyles() {
    if (document.getElementById('pdPersonalizationStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'pdPersonalizationStyles';
    style.textContent = `
        /* ═══════════════════════════════════════
           PERSONALIZACIÓN - ESTILOS v3.4
           ═══════════════════════════════════════ */
        
        .pd-personalization {
            margin: 20px 0;
            padding: 16px;
            background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.08));
            border: 2px solid rgba(236, 72, 153, 0.3);
            border-radius: 16px;
            animation: pd-pulse-border 2s ease-in-out infinite;
        }
        
        @keyframes pd-pulse-border {
            0%, 100% { border-color: rgba(236, 72, 153, 0.3); }
            50% { border-color: rgba(236, 72, 153, 0.6); }
        }
        
        .pd-personalization-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }
        
        .pd-personalization-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #ec4899, #a855f7);
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            border-radius: 20px;
        }
        
        .pd-personalization-badge i {
            font-size: 1rem;
        }
        
        .pd-personalization-cost {
            margin-left: auto;
            font-size: 0.9rem;
            color: #22c55e;
            font-weight: 600;
        }
        
        .pd-personalization-toggle {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }
        
        .pd-personalization-toggle:hover {
            background: rgba(255, 255, 255, 0.8);
            border-color: rgba(236, 72, 153, 0.3);
        }
        
        .pd-personalization-toggle.active {
            background: rgba(236, 72, 153, 0.1);
            border-color: #ec4899;
        }
        
        .pd-toggle-switch {
            position: relative;
            width: 48px;
            height: 26px;
            background: #cbd5e1;
            border-radius: 13px;
            transition: background 0.3s;
            flex-shrink: 0;
        }
        
        .pd-toggle-switch::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .pd-personalization-toggle.active .pd-toggle-switch {
            background: linear-gradient(135deg, #ec4899, #a855f7);
        }
        
        .pd-personalization-toggle.active .pd-toggle-switch::after {
            transform: translateX(22px);
        }
        
        .pd-toggle-label {
            flex: 1;
        }
        
        .pd-toggle-label strong {
            display: block;
            font-size: 0.95rem;
            color: #1f2937;
        }
        
        .pd-toggle-label span {
            font-size: 0.8rem;
            color: #64748b;
        }
        
        .pd-personalization-form {
            display: none;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed rgba(236, 72, 153, 0.3);
        }
        
        .pd-personalization-form.show {
            display: block;
            animation: pd-slide-down 0.3s ease;
        }
        
        @keyframes pd-slide-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .pd-personalization-instructions {
            padding: 12px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.85rem;
            color: #1e40af;
            line-height: 1.5;
        }
        
        .pd-personalization-instructions i {
            margin-right: 6px;
        }
        
        /* Upload de imagen */
        .pd-upload-section {
            margin-bottom: 16px;
        }
        
        .pd-upload-label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        
        .pd-upload-label .required {
            color: #ef4444;
        }
        
        .pd-upload-area {
            position: relative;
            border: 2px dashed #d1d5db;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.5);
        }
        
        .pd-upload-area:hover {
            border-color: #ec4899;
            background: rgba(236, 72, 153, 0.05);
        }
        
        .pd-upload-area.has-file {
            border-color: #22c55e;
            border-style: solid;
            background: rgba(34, 197, 94, 0.05);
        }
        
        .pd-upload-area.dragover {
            border-color: #ec4899;
            background: rgba(236, 72, 153, 0.1);
            transform: scale(1.02);
        }
        
        /* ★ NUEVO v3.4: Upload deshabilitado sin aceptar legal */
        .pd-upload-area.disabled {
            opacity: 0.5;
            pointer-events: none;
            cursor: not-allowed;
            border-color: #e5e7eb;
        }
        
        .pd-upload-icon {
            font-size: 2.5rem;
            color: #9ca3af;
            margin-bottom: 12px;
        }
        
        .pd-upload-area.has-file .pd-upload-icon {
            color: #22c55e;
        }
        
        .pd-upload-text {
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        .pd-upload-text strong {
            color: #ec4899;
        }
        
        .pd-upload-formats {
            font-size: 0.75rem;
            color: #9ca3af;
            margin-top: 8px;
        }
        
        .pd-upload-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        
        .pd-upload-preview {
            display: none;
            margin-top: 12px;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .pd-upload-preview.show {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .pd-preview-image {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .pd-preview-info {
            flex: 1;
        }
        
        .pd-preview-name {
            font-size: 0.85rem;
            font-weight: 500;
            color: #1f2937;
            word-break: break-all;
        }
        
        .pd-preview-size {
            font-size: 0.75rem;
            color: #6b7280;
        }
        
        .pd-preview-remove {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: #fee2e2;
            color: #ef4444;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .pd-preview-remove:hover {
            background: #ef4444;
            color: white;
        }
        
        /* Campo de texto */
        .pd-text-section {
            margin-bottom: 16px;
        }
        
        .pd-text-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 0.95rem;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.8);
            resize: vertical;
            min-height: 60px;
        }
        
        .pd-text-input:focus {
            outline: none;
            border-color: #ec4899;
            box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
        }
        
        .pd-text-counter {
            text-align: right;
            font-size: 0.75rem;
            color: #9ca3af;
            margin-top: 4px;
        }
        
        .pd-text-counter.warning { color: #f59e0b; }
        .pd-text-counter.error { color: #ef4444; }
        
        /* ═══════════════════════════════════════
           ★ NUEVO v3.4: SECCIÓN LEGAL
           ═══════════════════════════════════════ */
        
        .pd-legal-section {
            margin: 16px 0;
            padding: 14px;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 12px;
            transition: all 0.3s;
        }
        
        .pd-legal-section.accepted {
            background: #f0fdf4;
            border-color: #86efac;
        }
        
        .pd-legal-section.error {
            background: #fef2f2;
            border-color: #fca5a5;
            animation: pd-shake 0.4s ease;
        }
        
        @keyframes pd-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
        
        .pd-legal-checkbox-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            cursor: pointer;
        }
        
        .pd-legal-checkbox {
            position: relative;
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .pd-legal-checkbox input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
            z-index: 2;
        }
        
        .pd-legal-checkmark {
            position: absolute;
            top: 0;
            left: 0;
            width: 22px;
            height: 22px;
            background: white;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .pd-legal-checkmark i {
            font-size: 0.7rem;
            color: white;
            opacity: 0;
            transform: scale(0);
            transition: all 0.2s;
        }
        
        .pd-legal-checkbox input:checked + .pd-legal-checkmark {
            background: #22c55e;
            border-color: #22c55e;
        }
        
        .pd-legal-checkbox input:checked + .pd-legal-checkmark i {
            opacity: 1;
            transform: scale(1);
        }
        
        .pd-legal-text {
            flex: 1;
            font-size: 0.82rem;
            line-height: 1.5;
            color: #374151;
        }
        
        .pd-legal-text strong {
            color: #1f2937;
        }
        
        .pd-legal-text a {
            color: #3b82f6;
            text-decoration: underline;
            cursor: pointer;
        }
        
        .pd-legal-text a:hover {
            color: #2563eb;
        }
        
        .pd-legal-icon {
            font-size: 1.1rem;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .pd-legal-section:not(.accepted) .pd-legal-icon { color: #f59e0b; }
        .pd-legal-section.accepted .pd-legal-icon { color: #22c55e; }
        
        .pd-legal-detail {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed rgba(0,0,0,0.1);
            font-size: 0.75rem;
            color: #6b7280;
            line-height: 1.6;
            display: none;
        }
        
        .pd-legal-detail.show {
            display: block;
            animation: pd-slide-down 0.3s ease;
        }
        
        .pd-legal-detail ul {
            margin: 6px 0;
            padding-left: 18px;
        }
        
        .pd-legal-detail ul li {
            margin-bottom: 4px;
        }
        
        .pd-legal-toggle-detail {
            background: none;
            border: none;
            color: #3b82f6;
            font-size: 0.78rem;
            cursor: pointer;
            padding: 4px 0;
            margin-top: 6px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .pd-legal-toggle-detail:hover {
            color: #2563eb;
            text-decoration: underline;
        }
        
        /* Resumen de costo */
        .pd-personalization-summary {
            margin-top: 16px;
            padding: 12px;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .pd-summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 0.9rem;
        }
        
        .pd-summary-row.total {
            border-top: 1px dashed rgba(34, 197, 94, 0.3);
            margin-top: 8px;
            padding-top: 12px;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .pd-summary-label { color: #374151; }
        .pd-summary-value { color: #22c55e; font-weight: 600; }
        .pd-summary-row.total .pd-summary-value { color: #15803d; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .pd-personalization {
                padding: 12px;
                margin: 16px 0;
            }
            
            .pd-personalization-header { flex-wrap: wrap; }
            
            .pd-personalization-cost {
                margin-left: 0;
                margin-top: 8px;
                width: 100%;
            }
            
            .pd-upload-area { padding: 16px; }
            .pd-upload-icon { font-size: 2rem; }
            
            .pd-legal-section { padding: 12px; }
            .pd-legal-text { font-size: 0.78rem; }
        }

        /* ═══════════════════════════════════════
           VARIANTES - ESTILOS v3.6
           ═══════════════════════════════════════ */
        .pd-variantes-section {
            margin: 18px 0;
            padding: 14px 16px;
            background: rgba(124, 58, 237, 0.06);
            border: 1.5px solid rgba(124, 58, 237, 0.25);
            border-radius: 14px;
        }
        .pd-variantes-title {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #a78bfa;
            margin-bottom: 12px;
        }
        .pd-variante-grupo { margin-bottom: 14px; }
        .pd-variante-grupo:last-child { margin-bottom: 0; }
        .pd-variante-label {
            font-size: 0.82rem;
            font-weight: 600;
            color: rgba(255,255,255,0.75);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .pd-variante-sel {
            font-weight: 400;
            color: #a78bfa;
            font-size: 0.8rem;
        }
        .pd-variante-opciones {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .pd-variante-pill {
            padding: 6px 14px;
            border-radius: 20px;
            border: 1.5px solid rgba(124, 58, 237, 0.4);
            background: transparent;
            color: rgba(255,255,255,0.8);
            font-size: 0.82rem;
            cursor: pointer;
            transition: all 0.18s ease;
        }
        .pd-variante-pill:hover {
            border-color: #7c3aed;
            color: white;
            background: rgba(124, 58, 237, 0.15);
        }
        .pd-variante-pill.selected {
            background: #7c3aed;
            border-color: #7c3aed;
            color: white;
            font-weight: 600;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
        }
        @media (prefers-color-scheme: light) {
            .pd-variantes-section { background: rgba(124,58,237,0.05); }
            .pd-variante-label { color: #4b5563; }
            .pd-variante-pill { color: #374151; }
        }
    `;

    document.head.appendChild(style);
}

function handleKeyDown(e) {
    if (!document.getElementById('productDetailPanel')?.classList.contains('active')) return;
    
    if (e.key === 'Escape') closeProductDetail();
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
}

// ==========================================
// ABRIR/CERRAR PANEL
// ==========================================
function openProductDetail(product) {
    if (!product) {
        console.error('❌ No se proporcionó producto');
        return;
    }
    
    createProductDetailPanel();

    // ★ Sprint 3: Re-aplicar el tema del designer CADA VEZ que se abre el panel.
    // Esto garantiza coherencia visual incluso si el CSS tuvo un race condition
    // al cargar la página (product-detail.css vs el <style> inyectado).
    if (window.__tiendaTema && typeof applyProductDetailTheme === 'function') {
        try { applyProductDetailTheme(window.__tiendaTema.color, window.__tiendaTema.tema); } catch(_) {}
    }

    currentProduct = product;
    currentImageIndex = 0;
    isZoomed = false;
    isShowingVideo = false;

    resetPersonalizacionState();
    resetVariantesState(); // ★ v3.6: reset variantes al abrir producto

    // ★ v3.5 FIX: usar pushState (en vez de asignar a window.location.hash)
    // para que el botón "atrás" del celular cierre el detalle, no la tienda.
    // Si el panel ya estaba abierto (navegación entre productos relacionados),
    // usamos replaceState para no acumular entradas en el historial.
    const _pdNewUrl = window.location.pathname + window.location.search + `#producto-${product.id}`;
    const _pdAlreadyOpen = document.getElementById('productDetailPanel')?.classList.contains('active');
    if (_pdAlreadyOpen && window.history.state?.pdOpen) {
        history.replaceState({ pdOpen: true, productId: product.id }, '', _pdNewUrl);
    } else {
        history.pushState({ pdOpen: true, productId: product.id }, '', _pdNewUrl);
    }

    renderProductDetail();

    // ★ v3.5: Registrar vista del producto
    registrarVistaProducto(product.id);

    // ★★★ CORREGIDO: Animar entrada del panel ★★★
    requestAnimationFrame(() => {
        document.body.classList.add('pd-open');
        document.getElementById('productDetailOverlay')?.classList.add('active');
        const panel = document.getElementById('productDetailPanel');
        panel?.classList.add('active');

        // ★ Sprint 4: Aplicar color directamente al header vía inline style
        // (bypass TOTAL del cascade CSS — es la forma más segura y definitiva)
        if (window.__tiendaTema?.color) {
            const header = panel?.querySelector('.pd-header');
            if (header) {
                header.style.cssText += `;background:${window.__tiendaTema.color}!important;border-bottom:none!important;`;
            }
            // Panel light: eliminar fondo oscuro / textura
            if (window.__tiendaTema.tema === 'light') {
                if (panel) {
                    panel.style.background = '#fff';
                    panel.style.backgroundImage = 'none';
                }
            }
        }
    });
    
    // Analytics
    if (typeof gtag === 'function') {
        gtag('event', 'view_item', {
            item_id: product.id,
            item_name: product.nombre
        });
    }
}

function closeProductDetail(fromPopState = false) {
    const panel = document.getElementById('productDetailPanel');
    const wasActive = panel?.classList.contains('active');

    document.body.classList.remove('pd-open');
    document.getElementById('productDetailOverlay')?.classList.remove('active');
    panel?.classList.remove('active');

    // ★ v3.5 FIX: Si el cierre lo dispara el usuario (X / "Volver" / ESC / overlay),
    // retrocedemos en el historial para limpiar la URL y eliminar la entrada del modal.
    // Si viene de popstate (botón atrás del celular), el navegador ya retrocedió, no
    // tocamos historial para evitar bucles.
    if (!fromPopState && wasActive && window.history.state?.pdOpen) {
        history.back();
    }

    currentProduct = null;
    currentImageIndex = 0;
    isZoomed = false;
    isShowingVideo = false;

    resetPersonalizacionState();
}

// ★ ACTUALIZADO v3.4: Reset incluye campo legal
function resetPersonalizacionState() {
    personalizacionState = {
        activa: false,
        imagen: null,
        imagenPreview: null,
        imagenNombre: null,
        texto: '',
        costoAdicional: 0,
        legalAceptado: false
    };
}

// ==========================================
// RENDERIZADO PRINCIPAL
// ==========================================
function renderProductDetail() {
    const p = currentProduct;
    if (!p) return;

    const body = document.getElementById('pdBody');
    if (!body) return;

    // ★ v3.6 FIX: resetear scroll del body al abrir un nuevo producto.
    // Sin esto, si el usuario scrolleó en un producto anterior, el siguiente
    // se abre con esa posición de scroll y el header queda fuera de vista.
    body.scrollTop = 0;
    
    if (productDetailConfig.showBreadcrumb) {
        document.getElementById('pdCategoryLink').textContent = p.categoria || 'Productos';
        document.getElementById('pdProductName').textContent = truncate(p.nombre, 25);
        document.getElementById('pdBreadcrumb').style.display = 'flex';
    } else {
        document.getElementById('pdBreadcrumb').style.display = 'none';
    }
    
    let html = '';
    
    if (productDetailConfig.showGallery) {
        html += renderGallery(p);
    }
    
    html += `<div class="pd-info pd-animate-in">`;
    
    if (p.categoria) {
        html += `<span class="pd-category"><i class="fas fa-tag"></i> ${p.categoria}</span>`;
    }
    
    html += `<h1 class="pd-title">${p.nombre}</h1>`;

    // ★ Sprint 5 FIX: La descripción completa vive en la pestaña "Descripción".
    // Si las tabs están activas, NO la mostramos aquí para evitar duplicado.
    // Solo la mostramos inline cuando showTabs=false (modo sin pestañas).
    if (p.descripcion && !productDetailConfig.showTabs) {
        html += `<p class="pd-description-main">${p.descripcion}</p>`;
    }

    html += renderPriceSection(p);

    // ★ v3.6: Variantes — se muestran antes que personalización
    if (p.tiene_variantes && p.variantes?.tipos?.length > 0) {
        html += renderVariantesSection(p);
    }

    if (productDetailConfig.showPersonalization && isProductPersonalizable(p)) {
        html += renderPersonalizationSection(p);
    }

    if (productDetailConfig.showStock) {
        html += renderStock(p);
    }

    if (productDetailConfig.showQuantity) {
        html += renderQuantitySelector();
    }

    html += renderActionButtons(p);

    if (productDetailConfig.showShare) {
        html += renderShareButtons(p);
    }

    html += `</div>`;

    if (productDetailConfig.showTabs) {
        html += renderTabs(p);
    }

    if (productDetailConfig.showRelated) {
        html += renderRelatedProducts(p);
    }

    body.innerHTML = html;

    initGalleryEvents();
    initPersonalizationEvents();
}

// ==========================================
// ★ VARIANTES v3.6
// ==========================================

// Estado de variantes seleccionadas { 'Talla': 'M', 'Color': 'Rojo' }
let variantesSeleccionadas = {};

function resetVariantesState() {
    variantesSeleccionadas = {};
}

function renderVariantesSection(p) {
    const tipos = p.variantes?.tipos || [];
    if (!tipos.length) return '';
    let html = `<div class="pd-variantes-section" id="pdVariantesSection">
        <div class="pd-variantes-title">Elige las opciones</div>`;
    tipos.forEach((tipo, i) => {
        html += `<div class="pd-variante-grupo">
            <div class="pd-variante-label">${tipo.nombre}
                <span class="pd-variante-sel" id="pdVarianteSel_${i}"></span>
            </div>
            <div class="pd-variante-opciones">
                ${(tipo.opciones || []).map(op => `
                    <button type="button"
                        class="pd-variante-pill"
                        data-tipo="${escapeHtml(tipo.nombre)}"
                        data-valor="${escapeHtml(op)}"
                        onclick="seleccionarVariante(${i},'${escapeHtml(tipo.nombre)}','${escapeHtml(op)}',this)">
                        ${op}
                    </button>
                `).join('')}
            </div>
        </div>`;
    });
    html += `</div>`;
    return html;
}

function escapeHtml(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function seleccionarVariante(idx, tipoNombre, valor, btn) {
    // Deseleccionar hermanos
    const grupo = btn.closest('.pd-variante-opciones');
    if (grupo) {
        grupo.querySelectorAll('.pd-variante-pill').forEach(b => b.classList.remove('selected'));
    }
    btn.classList.add('selected');
    variantesSeleccionadas[tipoNombre] = valor;

    // Actualizar texto "seleccionado"
    const selEl = document.getElementById(`pdVarianteSel_${idx}`);
    if (selEl) selEl.textContent = `— ${valor}`;
}

function getVarianteTexto() {
    return Object.entries(variantesSeleccionadas)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
}

function getVarianteId() {
    return Object.entries(variantesSeleccionadas)
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
}

function validarVariantesSeleccionadas() {
    if (!currentProduct?.tiene_variantes) return { valid: true };
    const tipos = currentProduct.variantes?.tipos || [];
    for (const tipo of tipos) {
        if (!variantesSeleccionadas[tipo.nombre]) {
            return { valid: false, error: `Selecciona una opción para: ${tipo.nombre}` };
        }
    }
    return { valid: true };
}

// ==========================================
// ★ PERSONALIZACIÓN v3.4 CON LEGAL
// ==========================================

function isProductPersonalizable(p) {
    return p.personalizacion_activa === true || 
           p.personalizable === true ||
           (p.badges && p.badges.personalizable);
}

function getPersonalizacionConfig(p) {
    let config = {
        permite_imagen: true,
        permite_texto: true,
        imagen_requerida: false,
        texto_requerida: false,
        max_size_mb: 5,
        formatos: ['png', 'jpg', 'jpeg', 'pdf'],
        max_caracteres: 100,
        instrucciones: 'Sube tu diseño en alta resolución (mínimo 300 DPI).',
        placeholder_texto: 'Escribe tu nombre o frase',
        costo_adicional: 0
    };
    
    if (p.personalizacion_config) {
        try {
            const parsed = typeof p.personalizacion_config === 'string' 
                ? JSON.parse(p.personalizacion_config) 
                : p.personalizacion_config;
            config = { ...config, ...parsed };
        } catch (e) {
            console.warn('⚠️ Error parseando personalizacion_config:', e);
        }
    }
    
    return config;
}

// ★ ACTUALIZADO v3.4: Sección con legal
function renderPersonalizationSection(p) {
    const config = getPersonalizacionConfig(p);
    const costoAdicional = parseFloat(config.costo_adicional) || 0;
    
    personalizacionState.costoAdicional = costoAdicional;
    
    let html = `
        <div class="pd-personalization" id="pdPersonalization">
            <div class="pd-personalization-header">
                <span class="pd-personalization-badge">
                    <i class="fas fa-palette"></i>
                    Personalizable
                </span>
                ${costoAdicional > 0 ? `
                    <span class="pd-personalization-cost">
                        +${formatPrice(costoAdicional)} por personalización
                    </span>
                ` : ''}
            </div>
            
            <div class="pd-personalization-toggle ${personalizacionState.activa ? 'active' : ''}" 
                 onclick="togglePersonalizacion()" id="pdPersonalizacionToggle">
                <div class="pd-toggle-switch"></div>
                <div class="pd-toggle-label">
                    <strong>Quiero personalizar este producto</strong>
                    <span>Agrega tu diseño o texto personalizado</span>
                </div>
            </div>
            
            <div class="pd-personalization-form ${personalizacionState.activa ? 'show' : ''}" id="pdPersonalizacionForm">
    `;
    
    // Instrucciones
    if (config.instrucciones) {
        html += `
            <div class="pd-personalization-instructions">
                <i class="fas fa-info-circle"></i>
                ${config.instrucciones}
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════
    // ★★★ NUEVO v3.4: SECCIÓN LEGAL - ANTES DEL UPLOAD ★★★
    // ═══════════════════════════════════════════════════
    if (config.permite_imagen && productDetailConfig.requireLegalAcceptance) {
        html += renderLegalSection();
    }
    
    // Upload de imagen (se deshabilita si no se acepta legal)
    if (config.permite_imagen) {
        const formatosTexto = config.formatos.map(f => f.toUpperCase()).join(', ');
        const disabledClass = productDetailConfig.requireLegalAcceptance ? 'disabled' : '';
        
        html += `
            <div class="pd-upload-section" id="pdUploadSection">
                <label class="pd-upload-label">
                    <i class="fas fa-image"></i> Sube tu diseño
                    ${config.imagen_requerida ? '<span class="required">*</span>' : ''}
                </label>
                <div class="pd-upload-area ${disabledClass}" id="pdUploadArea">
                    <input type="file" 
                           class="pd-upload-input" 
                           id="pdUploadInput"
                           accept="${config.formatos.map(f => '.' + f).join(',')}"
                           onchange="handleFileUpload(event)"
                           ${productDetailConfig.requireLegalAcceptance ? 'disabled' : ''}>
                    <div class="pd-upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="pd-upload-text" id="pdUploadText">
                        ${productDetailConfig.requireLegalAcceptance 
                            ? '<span style="color: #9ca3af;">⬆️ Primero acepta los términos de uso de imagen</span>' 
                            : '<strong>Haz clic</strong> o arrastra tu archivo aquí'}
                    </div>
                    <div class="pd-upload-formats">
                        Formatos: ${formatosTexto} • Máximo ${config.max_size_mb}MB
                    </div>
                </div>
                <div class="pd-upload-preview" id="pdUploadPreview">
                    <img src="" alt="Preview" class="pd-preview-image" id="pdPreviewImage">
                    <div class="pd-preview-info">
                        <div class="pd-preview-name" id="pdPreviewName"></div>
                        <div class="pd-preview-size" id="pdPreviewSize"></div>
                    </div>
                    <button class="pd-preview-remove" onclick="removeUploadedFile()" title="Eliminar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Campo de texto
    if (config.permite_texto) {
        html += `
            <div class="pd-text-section">
                <label class="pd-upload-label">
                    <i class="fas fa-font"></i> Texto personalizado
                    ${config.texto_requerida ? '<span class="required">*</span>' : ''}
                </label>
                <textarea 
                    class="pd-text-input" 
                    id="pdTextInput"
                    placeholder="${config.placeholder_texto}"
                    maxlength="${config.max_caracteres}"
                    oninput="handleTextInput(event)"
                >${personalizacionState.texto}</textarea>
                <div class="pd-text-counter" id="pdTextCounter">
                    <span id="pdTextCount">0</span>/${config.max_caracteres} caracteres
                </div>
            </div>
        `;
    }
    
    // Resumen de costo
    if (costoAdicional > 0) {
        html += `
            <div class="pd-personalization-summary" id="pdPersonalizacionSummary">
                <div class="pd-summary-row">
                    <span class="pd-summary-label">Precio base</span>
                    <span class="pd-summary-value">${formatPrice(p.precio)}</span>
                </div>
                <div class="pd-summary-row">
                    <span class="pd-summary-label">Personalización</span>
                    <span class="pd-summary-value">+${formatPrice(costoAdicional)}</span>
                </div>
                <div class="pd-summary-row total">
                    <span class="pd-summary-label">Total</span>
                    <span class="pd-summary-value" id="pdPrecioTotal">${formatPrice(p.precio + costoAdicional)}</span>
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// ═══════════════════════════════════════════════════════════
// ★★★ NUEVO v3.4: RENDERIZAR SECCIÓN LEGAL ★★★
// ═══════════════════════════════════════════════════════════
function renderLegalSection() {
    const customText = productDetailConfig.legalText;
    
    return `
        <div class="pd-legal-section" id="pdLegalSection">
            <label class="pd-legal-checkbox-row" for="pdLegalCheckbox">
                <span class="pd-legal-icon">⚖️</span>
                <div class="pd-legal-checkbox">
                    <input type="checkbox" id="pdLegalCheckbox" onchange="handleLegalAcceptance(event)">
                    <div class="pd-legal-checkmark">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
                <div class="pd-legal-text">
                    ${customText || `
                        <strong>Declaro que tengo los derechos</strong> sobre las imágenes y/o diseños 
                        que subo para personalizar este producto. Confirmo que no infringen derechos 
                        de autor, marcas registradas ni propiedad intelectual de terceros.
                    `}
                </div>
            </label>
            
            <button class="pd-legal-toggle-detail" onclick="toggleLegalDetail(event)" type="button">
                <i class="fas fa-chevron-down" id="pdLegalToggleIcon"></i>
                Ver términos completos
            </button>
            
            <div class="pd-legal-detail" id="pdLegalDetail">
                <p>Al subir una imagen o diseño para personalización, el comprador declara y acepta que:</p>
                <ul>
                    <li><strong>Propiedad:</strong> Es el autor original o tiene autorización expresa del titular de los derechos para usar la imagen con fines de personalización del producto.</li>
                    <li><strong>No infracción:</strong> La imagen no infringe derechos de autor, marcas registradas, patentes, derechos de imagen de terceros, ni ninguna otra forma de propiedad intelectual.</li>
                    <li><strong>Contenido lícito:</strong> La imagen no contiene material ilegal, ofensivo, difamatorio, obsceno o que incite a la violencia o discriminación.</li>
                    <li><strong>Uso limitado:</strong> La imagen será utilizada exclusivamente para la personalización del producto solicitado y no será compartida, redistribuida ni utilizada para otros fines comerciales por la tienda.</li>
                    <li><strong>Responsabilidad:</strong> El comprador asume toda la responsabilidad legal y económica por cualquier reclamación de terceros derivada del uso de la imagen proporcionada.</li>
                    <li><strong>Exoneración:</strong> La tienda y la plataforma TuKomercio quedan exoneradas de cualquier responsabilidad por el contenido de las imágenes subidas por el comprador.</li>
                </ul>
                <p style="margin-top: 8px; font-style: italic;">
                    Al marcar la casilla, confirmas que has leído y aceptas estos términos en su totalidad.
                </p>
            </div>
        </div>
    `;
}

// ★ NUEVO v3.4: Manejar aceptación legal
function handleLegalAcceptance(event) {
    const checked = event.target.checked;
    personalizacionState.legalAceptado = checked;
    
    const legalSection = document.getElementById('pdLegalSection');
    const uploadArea = document.getElementById('pdUploadArea');
    const uploadInput = document.getElementById('pdUploadInput');
    const uploadText = document.getElementById('pdUploadText');
    
    // Actualizar visual de la sección legal
    if (legalSection) {
        legalSection.classList.toggle('accepted', checked);
        legalSection.classList.remove('error');
    }
    
    // Habilitar/deshabilitar upload
    if (uploadArea) {
        uploadArea.classList.toggle('disabled', !checked);
    }
    if (uploadInput) {
        uploadInput.disabled = !checked;
    }
    if (uploadText) {
        uploadText.innerHTML = checked 
            ? '<strong>Haz clic</strong> o arrastra tu archivo aquí' 
            : '<span style="color: #9ca3af;">⬆️ Primero acepta los términos de uso de imagen</span>';
    }
    
    console.log('⚖️ Aceptación legal:', checked ? 'ACEPTADO ✅' : 'NO ACEPTADO ❌');
}

// ★ NUEVO v3.4: Toggle detalle legal
function toggleLegalDetail(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const detail = document.getElementById('pdLegalDetail');
    const icon = document.getElementById('pdLegalToggleIcon');
    const btn = event.currentTarget;
    
    if (detail) {
        const isOpen = detail.classList.contains('show');
        detail.classList.toggle('show');
        
        if (icon) {
            icon.className = isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        }
        if (btn) {
            btn.innerHTML = `<i class="${isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up'}" id="pdLegalToggleIcon"></i> ${isOpen ? 'Ver términos completos' : 'Ocultar términos'}`;
        }
    }
}

// Toggle personalización
function togglePersonalizacion() {
    personalizacionState.activa = !personalizacionState.activa;
    
    const toggle = document.getElementById('pdPersonalizacionToggle');
    const form = document.getElementById('pdPersonalizacionForm');
    
    if (toggle) toggle.classList.toggle('active', personalizacionState.activa);
    if (form) form.classList.toggle('show', personalizacionState.activa);
    
    updateDisplayedPrice();
    
    console.log('🎨 Personalización:', personalizacionState.activa ? 'ACTIVADA' : 'DESACTIVADA');
}

// Manejar subida de archivo
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // ★ NUEVO v3.4: Verificar aceptación legal antes de procesar
    if (productDetailConfig.requireLegalAcceptance && !personalizacionState.legalAceptado) {
        showDetailToast('⚖️ Debes aceptar los términos antes de subir una imagen', 'error');
        event.target.value = '';
        
        // Resaltar sección legal
        const legalSection = document.getElementById('pdLegalSection');
        if (legalSection) {
            legalSection.classList.add('error');
            legalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => legalSection.classList.remove('error'), 2000);
        }
        return;
    }
    
    const config = getPersonalizacionConfig(currentProduct);
    const maxSizeBytes = (config.max_size_mb || 5) * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
        showDetailToast(`❌ El archivo excede ${config.max_size_mb}MB`, 'error');
        event.target.value = '';
        return;
    }
    
    const extension = file.name.split('.').pop().toLowerCase();
    if (!config.formatos.includes(extension)) {
        showDetailToast(`❌ Formato no permitido. Usa: ${config.formatos.join(', ')}`, 'error');
        event.target.value = '';
        return;
    }
    
    personalizacionState.imagen = file;
    personalizacionState.imagenNombre = file.name;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        personalizacionState.imagenPreview = e.target.result;
        
        const previewContainer = document.getElementById('pdUploadPreview');
        const previewImage = document.getElementById('pdPreviewImage');
        const previewName = document.getElementById('pdPreviewName');
        const previewSize = document.getElementById('pdPreviewSize');
        const uploadArea = document.getElementById('pdUploadArea');
        
        if (previewContainer) previewContainer.classList.add('show');
        if (previewImage) {
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
                previewImage.src = e.target.result;
            } else {
                previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlYzQ4OTkiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTE0IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY4eiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjE0IDIgMTQgOCAyMCA4Ij48L3BvbHlsaW5lPjwvc3ZnPg==';
            }
        }
        if (previewName) previewName.textContent = file.name;
        if (previewSize) previewSize.textContent = formatFileSize(file.size);
        if (uploadArea) uploadArea.classList.add('has-file');
    };
    reader.readAsDataURL(file);
    
    showDetailToast('✓ Archivo cargado correctamente', 'success');
}

function removeUploadedFile() {
    personalizacionState.imagen = null;
    personalizacionState.imagenPreview = null;
    personalizacionState.imagenNombre = null;
    
    const previewContainer = document.getElementById('pdUploadPreview');
    const uploadArea = document.getElementById('pdUploadArea');
    const uploadInput = document.getElementById('pdUploadInput');
    
    if (previewContainer) previewContainer.classList.remove('show');
    if (uploadArea) uploadArea.classList.remove('has-file');
    if (uploadInput) uploadInput.value = '';
    
    showDetailToast('Archivo eliminado', 'info');
}

function handleTextInput(event) {
    const text = event.target.value;
    personalizacionState.texto = text;
    
    const config = getPersonalizacionConfig(currentProduct);
    const maxChars = config.max_caracteres || 100;
    const currentChars = text.length;
    
    const counter = document.getElementById('pdTextCounter');
    const countSpan = document.getElementById('pdTextCount');
    
    if (countSpan) countSpan.textContent = currentChars;
    
    if (counter) {
        counter.classList.remove('warning', 'error');
        if (currentChars >= maxChars) {
            counter.classList.add('error');
        } else if (currentChars >= maxChars * 0.8) {
            counter.classList.add('warning');
        }
    }
}

function initPersonalizationEvents() {
    const uploadArea = document.getElementById('pdUploadArea');
    if (!uploadArea) return;
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        // ★ v3.4: No permitir drag si no se aceptó legal
        if (productDetailConfig.requireLegalAcceptance && !personalizacionState.legalAceptado) return;
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        // ★ v3.4: Verificar legal antes de procesar drop
        if (productDetailConfig.requireLegalAcceptance && !personalizacionState.legalAceptado) {
            showDetailToast('⚖️ Debes aceptar los términos antes de subir una imagen', 'error');
            const legalSection = document.getElementById('pdLegalSection');
            if (legalSection) {
                legalSection.classList.add('error');
                setTimeout(() => legalSection.classList.remove('error'), 2000);
            }
            return;
        }
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const input = document.getElementById('pdUploadInput');
            if (input) {
                input.files = files;
                handleFileUpload({ target: input });
            }
        }
    });
}

function updateDisplayedPrice() {
    if (!currentProduct) return;
    
    const priceSection = document.querySelector('.pd-price');
    if (!priceSection) return;
    
    let precio = currentProduct.precio;
    
    if (personalizacionState.activa && personalizacionState.costoAdicional > 0) {
        precio += personalizacionState.costoAdicional;
    }
    
    priceSection.textContent = formatPrice(precio);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ★ ACTUALIZADO v3.4: Validar personalización incluye legal
function validatePersonalizacion() {
    if (!personalizacionState.activa) return { valid: true };
    
    const config = getPersonalizacionConfig(currentProduct);
    
    // ★ NUEVO v3.4: Validar aceptación legal si hay imagen
    if (config.permite_imagen && personalizacionState.imagen && 
        productDetailConfig.requireLegalAcceptance && !personalizacionState.legalAceptado) {
        return { 
            valid: false, 
            error: 'Debes aceptar los términos de propiedad de imagen para continuar',
            field: 'legal'
        };
    }
    
    if (config.imagen_requerida && config.permite_imagen && !personalizacionState.imagen) {
        // ★ v3.4: Si imagen requerida, también debe aceptar legal
        if (productDetailConfig.requireLegalAcceptance && !personalizacionState.legalAceptado) {
            return { 
                valid: false, 
                error: 'Acepta los términos y sube tu diseño para personalizar este producto',
                field: 'legal'
            };
        }
        return { valid: false, error: 'Debes subir un diseño para personalizar este producto' };
    }
    
    if (config.texto_requerida && config.permite_texto && !personalizacionState.texto.trim()) {
        return { valid: false, error: 'Debes ingresar el texto de personalización' };
    }
    
    return { valid: true };
}

// ==========================================
// HELPER: Video URL
// ==========================================
function getProductVideoUrl(p) {
    if (!p) return null;
    return p.video_url || 
           (p.videos && Array.isArray(p.videos) && p.videos[0]) || 
           (p.youtube_links && Array.isArray(p.youtube_links) && p.youtube_links[0]) || 
           null;
}

function getTotalSlides(p) {
    const images = getProductImages(p);
    const hasVideo = getProductVideoUrl(p) && productDetailConfig.showVideo;
    return images.length + (hasVideo ? 1 : 0);
}

function isVideoIndex(index, p) {
    const images = getProductImages(p);
    const hasVideo = getProductVideoUrl(p) && productDetailConfig.showVideo;
    return hasVideo && index === images.length;
}

// ==========================================
// GALERÍA
// ==========================================
function renderGallery(p) {
    const images = getProductImages(p);
    const videoUrl = getProductVideoUrl(p);
    const hasVideo = videoUrl && productDetailConfig.showVideo;
    const totalSlides = getTotalSlides(p);
    const hasDiscount = productDetailConfig.showDiscount && p.precio_original && p.precio_original > p.precio;
    const discount = hasDiscount ? Math.round((1 - p.precio / p.precio_original) * 100) : 0;
    
    let html = `<div class="pd-gallery pd-animate-in">`;
    
    html += `
        <div class="pd-gallery-main" id="pdGalleryMain" ${productDetailConfig.showZoom && !isShowingVideo ? 'onclick="toggleZoom()"' : ''}>
            <div id="pdMediaContainer" style="width: 100%; height: 100%; min-height: 300px; display: flex; align-items: center; justify-content: center; position: relative;">
                ${isShowingVideo ? renderVideoEmbed(videoUrl) : `<img src="${images[currentImageIndex] || images[0]}" alt="${p.nombre}" id="pdMainImage" loading="lazy" style="max-width: 100%; max-height: 100%; object-fit: contain;">`}
            </div>
            
            ${hasDiscount ? `<div class="pd-gallery-discount">-${discount}%</div>` : ''}
            ${p.destacado ? `<div class="pd-gallery-badge"><i class="fas fa-star"></i> Destacado</div>` : ''}
            
            ${totalSlides > 1 ? `
                <button class="pd-gallery-nav prev" onclick="event.stopPropagation(); changeSlide(-1)" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="pd-gallery-nav next" onclick="event.stopPropagation(); changeSlide(1)" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="pd-gallery-counter">
                    <strong>${currentImageIndex + 1}</strong> / ${totalSlides}
                    ${isShowingVideo ? ' <i class="fas fa-video"></i>' : ''}
                </div>
            ` : ''}
            
            ${productDetailConfig.showZoom && !isShowingVideo ? `
                <div class="pd-zoom-hint">
                    <i class="fas fa-search-plus"></i>
                    <span>Toca para ampliar</span>
                </div>
            ` : ''}
        </div>
    `;
    
    if (totalSlides > 1) {
        html += `<div class="pd-gallery-thumbnails" id="pdThumbnails">`;
        images.forEach((img, i) => {
            const isActive = !isShowingVideo && i === currentImageIndex;
            html += `
                <div class="pd-thumbnail ${isActive ? 'active' : ''}" onclick="goToSlide(${i})" tabindex="0" role="button">
                    <img src="${img}" alt="Vista ${i + 1}" loading="lazy">
                </div>
            `;
        });
        if (hasVideo) {
            html += `
                <div class="pd-thumbnail video-thumb ${isShowingVideo ? 'active' : ''}" onclick="goToSlide(${images.length})" tabindex="0" role="button">
                    <div class="video-thumb-icon">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    if (totalSlides > 1) {
        html += `<div class="pd-gallery-dots" id="pdDots">`;
        for (let i = 0; i < totalSlides; i++) {
            const isActive = i === currentImageIndex;
            const isVideo = isVideoIndex(i, p);
            html += `<div class="pd-dot ${isActive ? 'active' : ''} ${isVideo ? 'video-dot' : ''}" onclick="goToSlide(${i})"></div>`;
        }
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}

function renderVideoEmbed(videoUrl) {
    if (!videoUrl) return '';
    
    const containerStyle = `position: relative; width: 100%; height: 100%; min-height: 300px; background: #000; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;`;
    const iframeStyle = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 12px;`;
    const shortsContainerStyle = `position: relative; width: 100%; height: 100%; min-height: 400px; background: #000; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;`;
    const shortsIframeStyle = `width: 100%; max-width: 315px; height: 560px; border: none; border-radius: 12px;`;
    const videoStyle = `width: 100%; height: 100%; object-fit: contain; border-radius: 12px;`;
    
    let embedHtml = '';
    
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(videoUrl);
        const isShort = videoUrl.includes('/shorts/');
        
        if (videoId) {
            if (isShort) {
                embedHtml = `<div class="pd-video-container" style="${shortsContainerStyle}"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1" style="${shortsIframeStyle}" title="YouTube Short" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
            } else {
                embedHtml = `<div class="pd-video-container" style="${containerStyle}"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" style="${iframeStyle}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
            }
        }
    } else if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.split('/').pop();
        embedHtml = `<div class="pd-video-container" style="${containerStyle}"><iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1" style="${iframeStyle}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    } else {
        embedHtml = `<div class="pd-video-container" style="${containerStyle}"><video src="${videoUrl}" style="${videoStyle}" controls autoplay></video></div>`;
    }
    
    return embedHtml;
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getProductImages(p) {
    if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) return p.imagenes;
    if (p.imagen_url) return [p.imagen_url];
    return ['https://via.placeholder.com/400x400/16161f/d4af37?text=Sin+imagen'];
}

function changeSlide(direction) {
    const totalSlides = getTotalSlides(currentProduct);
    currentImageIndex = (currentImageIndex + direction + totalSlides) % totalSlides;
    isShowingVideo = isVideoIndex(currentImageIndex, currentProduct);
    updateGalleryDisplay();
}

function goToSlide(index) {
    currentImageIndex = index;
    isShowingVideo = isVideoIndex(index, currentProduct);
    updateGalleryDisplay();
}

function changeImage(direction) { changeSlide(direction); }
function goToImage(index) { goToSlide(index); }

function updateGalleryDisplay() {
    const images = getProductImages(currentProduct);
    const videoUrl = getProductVideoUrl(currentProduct);
    const totalSlides = getTotalSlides(currentProduct);
    const mediaContainer = document.getElementById('pdMediaContainer');
    const galleryMain = document.getElementById('pdGalleryMain');
    
    if (mediaContainer) {
        mediaContainer.style.opacity = '0';
        setTimeout(() => {
            if (isShowingVideo && videoUrl) {
                mediaContainer.innerHTML = renderVideoEmbed(videoUrl);
                if (galleryMain) galleryMain.removeAttribute('onclick');
                const zoomHint = document.querySelector('.pd-zoom-hint');
                if (zoomHint) zoomHint.style.display = 'none';
            } else {
                mediaContainer.innerHTML = `<img src="${images[currentImageIndex]}" alt="${currentProduct.nombre}" id="pdMainImage" loading="lazy" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
                if (galleryMain && productDetailConfig.showZoom) galleryMain.setAttribute('onclick', 'toggleZoom()');
                const zoomHint = document.querySelector('.pd-zoom-hint');
                if (zoomHint) zoomHint.style.display = '';
            }
            mediaContainer.style.opacity = '1';
        }, 150);
    }
    
    const counter = document.querySelector('.pd-gallery-counter');
    if (counter) {
        counter.innerHTML = `<strong>${currentImageIndex + 1}</strong> / ${totalSlides}${isShowingVideo ? ' <i class="fas fa-video"></i>' : ''}`;
    }
    
    const thumbnails = document.querySelectorAll('.pd-thumbnail');
    thumbnails.forEach((thumb, i) => {
        const isVideoThumb = thumb.classList.contains('video-thumb');
        if (isVideoThumb) {
            thumb.classList.toggle('active', isShowingVideo);
        } else {
            thumb.classList.toggle('active', !isShowingVideo && i === currentImageIndex);
        }
    });
    
    document.querySelectorAll('.pd-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentImageIndex);
    });
}

function toggleZoom() {
    if (!productDetailConfig.showZoom || isShowingVideo) return;
    isZoomed = !isZoomed;
    document.getElementById('pdGalleryMain')?.classList.toggle('zoomed', isZoomed);
}

function showProductVideo() {
    const images = getProductImages(currentProduct);
    const videoUrl = getProductVideoUrl(currentProduct);
    if (!videoUrl) return;
    currentImageIndex = images.length;
    isShowingVideo = true;
    updateGalleryDisplay();
}

function closeProductVideo() {
    currentImageIndex = 0;
    isShowingVideo = false;
    updateGalleryDisplay();
}

function initGalleryEvents() {
    const main = document.getElementById('pdGalleryMain');
    if (!main) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    main.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    main.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) changeSlide(diff > 0 ? 1 : -1);
    }, { passive: true });
}

// ==========================================
// PRECIO
// ==========================================
function renderPriceSection(p) {
    const hasDiscount = productDetailConfig.showDiscount && p.precio_original && p.precio_original > p.precio;
    const discount = hasDiscount ? Math.round((1 - p.precio / p.precio_original) * 100) : 0;
    
    let html = `<div class="pd-price-section">`;
    html += `<span class="pd-price">${formatPrice(p.precio)}</span>`;
    
    if (hasDiscount) {
        html += `<span class="pd-price-original">${formatPrice(p.precio_original)}</span>`;
        html += `<span class="pd-discount-badge">-${discount}%</span>`;
    }
    
    html += `</div>`;
    return html;
}

// ==========================================
// STOCK
// ==========================================
function renderStock(p) {
    const stock = p.stock ?? p.cantidad ?? null;
    
    if (stock === null) return `<div class="pd-stock in-stock"><i class="fas fa-check-circle"></i><span>Disponible</span></div>`;
    if (stock === 0) return `<div class="pd-stock out-of-stock"><i class="fas fa-times-circle"></i><span>Agotado</span></div>`;
    if (stock <= 5) return `<div class="pd-stock low-stock"><i class="fas fa-exclamation-triangle"></i><span>¡Solo quedan ${stock} unidades!</span></div>`;
    return `<div class="pd-stock in-stock"><i class="fas fa-check-circle"></i><span>En stock (${stock} disponibles)</span></div>`;
}

// ==========================================
// CANTIDAD
// ==========================================
function renderQuantitySelector() {
    return `
        <div class="pd-quantity">
            <span class="pd-quantity-label">Cantidad:</span>
            <div class="pd-quantity-control">
                <button class="pd-quantity-btn" onclick="changeQuantity(-1)" aria-label="Disminuir"><i class="fas fa-minus"></i></button>
                <input type="number" class="pd-quantity-input" id="pdQuantityInput" value="1" min="1" max="99" onchange="validateQuantity()">
                <button class="pd-quantity-btn" onclick="changeQuantity(1)" aria-label="Aumentar"><i class="fas fa-plus"></i></button>
            </div>
        </div>
    `;
}

function changeQuantity(delta) {
    const input = document.getElementById('pdQuantityInput');
    if (!input) return;
    let value = parseInt(input.value) || 1;
    value = Math.max(1, Math.min(99, value + delta));
    input.value = value;
}

function validateQuantity() {
    const input = document.getElementById('pdQuantityInput');
    if (!input) return;
    let value = parseInt(input.value) || 1;
    input.value = Math.max(1, Math.min(99, value));
}

function getSelectedQuantity() {
    return parseInt(document.getElementById('pdQuantityInput')?.value) || 1;
}

// ==========================================
// BOTONES DE ACCIÓN
// ==========================================
function renderActionButtons(p) {
    let html = `<div class="pd-actions"><div class="pd-actions-row">`;
    
    html += `<button class="pd-btn pd-btn-primary" onclick="addToCartFromDetail()"><i class="fas fa-shopping-bag"></i><span>Agregar</span></button>`;
    
    if (productDetailConfig.showBuyNow) {
        html += `<button class="pd-btn pd-btn-secondary" onclick="buyNowFromDetail()"><i class="fas fa-bolt"></i><span>Comprar</span></button>`;
    }
    
    html += `</div>`;
    
    if (productDetailConfig.showWhatsapp) {
        html += `<button class="pd-btn pd-btn-whatsapp" onclick="askViaWhatsApp()"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</button>`;
    }
    
    html += `</div>`;
    return html;
}

// ★ ACTUALIZADO v3.6: Agregar al carrito con validación legal + variantes
function addToCartFromDetail() {
    if (!currentProduct) return;

    // ★ v3.6: Validar variantes primero
    const varValidation = validarVariantesSeleccionadas();
    if (!varValidation.valid) {
        showDetailToast(`❌ ${varValidation.error}`, 'error');
        const seccion = document.getElementById('pdVariantesSection');
        if (seccion) {
            seccion.style.outline = '2px solid #ef4444';
            seccion.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { seccion.style.outline = ''; }, 2000);
        }
        return;
    }

    const validation = validatePersonalizacion();
    if (!validation.valid) {
        showDetailToast(`❌ ${validation.error}`, 'error');

        // ★ v3.4: Scroll a sección legal si es error legal
        if (validation.field === 'legal') {
            const legalSection = document.getElementById('pdLegalSection');
            if (legalSection) {
                legalSection.classList.add('error');
                legalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => legalSection.classList.remove('error'), 2000);
            }
        }
        return;
    }

    const quantity = getSelectedQuantity();

    // ★ v3.6: Construir datos de variante seleccionada
    const tieneVariantes = currentProduct.tiene_variantes && Object.keys(variantesSeleccionadas).length > 0;
    const varianteTexto  = tieneVariantes ? getVarianteTexto() : null;
    const varianteId     = tieneVariantes ? getVarianteId()    : null;

    // Usar un id de carrito único por combinación: id_producto + variante
    const carritoItemId = tieneVariantes
        ? `${currentProduct.id}__${varianteId}`
        : currentProduct.id;

    const cartItem = {
        ...currentProduct,
        // Sobreescribir id para que variantes distintas sean items distintos en carrito
        _carritoId: carritoItemId,
        cantidad: quantity,
        variante_seleccionada: tieneVariantes ? { ...variantesSeleccionadas } : null,
        variante_id: varianteId,
        variante_texto: varianteTexto,
        personalizacion: personalizacionState.activa ? {
            activa: true,
            imagen_nombre: personalizacionState.imagenNombre,
            imagen_preview: personalizacionState.imagenPreview,
            texto: personalizacionState.texto,
            costo_adicional: personalizacionState.costoAdicional,
            // ★ NUEVO v3.4: Guardar que se aceptó legal
            legal_aceptado: personalizacionState.legalAceptado,
            legal_fecha: new Date().toISOString()
        } : null,
        precio_con_personalizacion: personalizacionState.activa
            ? currentProduct.precio + personalizacionState.costoAdicional
            : currentProduct.precio
    };

    if (typeof window.addToCartWithPersonalization === 'function') {
        window.addToCartWithPersonalization(cartItem);
    } else if (typeof window.addToCartItem === 'function') {
        window.addToCartItem(cartItem);
    } else if (typeof addToCart === 'function') {
        // Fallback: si no hay variantes, usar addToCart normal
        if (!tieneVariantes) {
            for (let i = 0; i < quantity; i++) {
                addToCart(currentProduct.id);
            }
        } else {
            // Con variantes: insertar directamente en el carrito
            addToCartVariante(cartItem);
        }

        if (personalizacionState.activa) {
            savePersonalizacionToCart(currentProduct.id, cartItem.personalizacion);
        }
    }

    const sufijo = [
        personalizacionState.activa ? '(personalizado)' : '',
        varianteTexto ? `(${varianteTexto})` : ''
    ].filter(Boolean).join(' ');

    showDetailToast(`✓ ${quantity}x ${truncate(currentProduct.nombre, 20)} agregado ${sufijo}`.trim(), 'success');
    setTimeout(closeProductDetail, 1500);
}

// ★ ACTUALIZADO v3.4: Guardar con datos legales
function savePersonalizacionToCart(productId, personalizacionData) {
    const key = `personalizacion_${window.tiendaConfig?.negocio_id || 'default'}`;
    let personalizaciones = {};
    
    try {
        personalizaciones = JSON.parse(localStorage.getItem(key) || '{}');
    } catch (e) {
        personalizaciones = {};
    }
    
    personalizaciones[productId] = personalizacionData;
    localStorage.setItem(key, JSON.stringify(personalizaciones));
    
    console.log('🎨 Personalización guardada (con legal):', personalizacionData);
}

function getPersonalizacionFromCart(productId) {
    const key = `personalizacion_${window.tiendaConfig?.negocio_id || 'default'}`;
    try {
        const personalizaciones = JSON.parse(localStorage.getItem(key) || '{}');
        return personalizaciones[productId] || null;
    } catch (e) {
        return null;
    }
}

function buyNowFromDetail() {
    if (!currentProduct) return;
    
    const validation = validatePersonalizacion();
    if (!validation.valid) {
        showDetailToast(`❌ ${validation.error}`, 'error');
        if (validation.field === 'legal') {
            const legalSection = document.getElementById('pdLegalSection');
            if (legalSection) {
                legalSection.classList.add('error');
                legalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => legalSection.classList.remove('error'), 2000);
            }
        }
        return;
    }
    
    const quantity = getSelectedQuantity();
    
    if (typeof addToCart === 'function') {
        for (let i = 0; i < quantity; i++) {
            addToCart(currentProduct.id);
        }
        
        if (personalizacionState.activa) {
            savePersonalizacionToCart(currentProduct.id, {
                activa: true,
                imagen_nombre: personalizacionState.imagenNombre,
                imagen_preview: personalizacionState.imagenPreview,
                texto: personalizacionState.texto,
                costo_adicional: personalizacionState.costoAdicional,
                legal_aceptado: personalizacionState.legalAceptado,
                legal_fecha: new Date().toISOString()
            });
        }
    }
    
    closeProductDetail();
    if (typeof goToCart === 'function') goToCart();
}

// ★ ACTUALIZADO v3.4: WhatsApp con datos de personalización
function askViaWhatsApp() {
    if (!currentProduct) return;
    
    const phone = window.tiendaConfig?.whatsapp || '';
    const productUrl = `${window.location.origin}${window.location.pathname}#producto-${currentProduct.id}`;
    
    let message = `Hola, me interesa este producto:\n\n*${currentProduct.nombre}*\nPrecio: ${formatPrice(currentProduct.precio)}`;
    
    if (personalizacionState.activa) {
        message += `\n\n🎨 *PERSONALIZACIÓN:*`;
        if (personalizacionState.texto) message += `\n📝 Texto: "${personalizacionState.texto}"`;
        if (personalizacionState.imagenNombre) message += `\n🖼️ Diseño: ${personalizacionState.imagenNombre}`;
        if (personalizacionState.costoAdicional > 0) {
            message += `\n💰 Costo adicional: +${formatPrice(personalizacionState.costoAdicional)}`;
            message += `\n💵 Total: ${formatPrice(currentProduct.precio + personalizacionState.costoAdicional)}`;
        }
    }
    
    message += `\n\n${productUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ==========================================
// COMPARTIR
// ==========================================
function renderShareButtons(p) {
    return `
        <div class="pd-share">
            <span class="pd-share-label">Compartir:</span>
            <div class="pd-share-btns">
                <button class="pd-share-btn facebook" onclick="shareOnFacebook()" aria-label="Facebook"><i class="fab fa-facebook-f"></i></button>
                <button class="pd-share-btn twitter" onclick="shareOnTwitter()" aria-label="Twitter"><i class="fab fa-twitter"></i></button>
                <button class="pd-share-btn whatsapp" onclick="shareOnWhatsApp()" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></button>
                <button class="pd-share-btn copy" onclick="copyProductLink()" aria-label="Copiar enlace"><i class="fas fa-link"></i></button>
            </div>
        </div>
    `;
}

function getProductShareUrl() {
    return `${window.location.origin}${window.location.pathname}#producto-${currentProduct?.id}`;
}

function shareOnFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getProductShareUrl())}`, '_blank', 'width=600,height=400');
}

function shareOnTwitter() {
    const text = `Mira esto: ${currentProduct?.nombre}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getProductShareUrl())}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp() {
    const text = `Mira este producto: ${currentProduct?.nombre} - ${formatPrice(currentProduct?.precio)}\n${getProductShareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function copyProductLink() {
    navigator.clipboard.writeText(getProductShareUrl()).then(() => {
        showDetailToast('✓ Enlace copiado', 'success');
    }).catch(() => {
        const input = document.createElement('input');
        input.value = getProductShareUrl();
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showDetailToast('✓ Enlace copiado', 'success');
    });
}

// ==========================================
// TABS
// ==========================================
function renderTabs(p) {
    const tabs = [];
    
    tabs.push({ id: 'description', label: '<i class="fas fa-align-left"></i> Descripción', content: renderDescriptionTab(p) });
    
    if (productDetailConfig.showSpecs && p.especificaciones) {
        tabs.push({ id: 'specs', label: '<i class="fas fa-list-ul"></i> Especificaciones', content: renderSpecsTab(p) });
    }
    
    if (productDetailConfig.showReviews) {
        tabs.push({ id: 'reviews', label: '<i class="fas fa-star"></i> Opiniones', content: renderReviewsTab(p) });
    }
    
    if (tabs.length <= 1 && !p.descripcion) return '';
    
    let html = `<div class="pd-tabs pd-animate-in"><div class="pd-tabs-header">`;
    tabs.forEach((tab, i) => {
        html += `<button class="pd-tab-btn ${i === 0 ? 'active' : ''}" data-tab="${tab.id}" onclick="switchTab('${tab.id}')">${tab.label}</button>`;
    });
    html += `</div>`;
    
    tabs.forEach((tab, i) => {
        html += `<div class="pd-tab-content ${i === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.content}</div>`;
    });
    
    html += `</div>`;
    return html;
}

function renderDescriptionTab(p) {
    const desc = p.descripcion || 'Este producto no tiene descripción disponible.';
    return `<div class="pd-description"><p>${desc.replace(/\n/g, '</p><p>')}</p></div>`;
}

function renderSpecsTab(p) {
    const specs = p.especificaciones;
    if (!specs || (Array.isArray(specs) && specs.length === 0)) {
        return '<p style="color: var(--pd-text-muted); text-align: center; padding: 20px;">No hay especificaciones disponibles.</p>';
    }
    
    let html = `<div class="pd-specs-table">`;
    
    if (Array.isArray(specs)) {
        specs.forEach(spec => {
            html += `<div class="pd-specs-row"><div class="pd-specs-label">${spec.label || spec.nombre}</div><div class="pd-specs-value">${spec.value || spec.valor}</div></div>`;
        });
    } else if (typeof specs === 'object') {
        Object.entries(specs).forEach(([key, value]) => {
            html += `<div class="pd-specs-row"><div class="pd-specs-label">${key}</div><div class="pd-specs-value">${value}</div></div>`;
        });
    }
    
    html += `</div>`;
    return html;
}

// ── Tab de Opiniones — carga reseñas reales desde la API ──
function renderReviewsTab(p) {
    const negocioId = tiendaConfig?.negocio_id || window._tkNegocioId;
    const productoId = p.id || p.id_producto;
    const placeholderId = `reviews-container-${productoId}`;

    // Disparar fetch async — llenar el placeholder cuando responda
    setTimeout(() => _loadAndRenderResenas(negocioId, productoId, placeholderId), 0);

    return `
        <div id="${placeholderId}">
            <div class="pd-reviews-loading">
                <div class="pd-rev-spinner"></div>
                <span>Cargando opiniones…</span>
            </div>
        </div>`;
}

async function _loadAndRenderResenas(negocioId, productoId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const apiUrl = (typeof API_URL !== 'undefined' ? API_URL : window._tkApiBase || '');
        const res = await fetch(`${apiUrl}/resenas/${negocioId}/productos/${productoId}?limit=10`);
        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        const { resenas = [], total = 0, promedio = 0, distribucion = {} } = data;

        // ── Barra de distribución
        const distHtml = [5,4,3,2,1].map(n => {
            const count = distribucion[String(n)] || 0;
            const pct   = total > 0 ? Math.round(count / total * 100) : 0;
            return `<div class="pd-dist-row">
                <span class="pd-dist-label">${n}★</span>
                <div class="pd-dist-bar"><div class="pd-dist-fill" style="width:${pct}%"></div></div>
                <span class="pd-dist-count">${count}</span>
            </div>`;
        }).join('');

        // ── Cards de reseñas
        const reviewsHtml = resenas.length === 0
            ? `<div class="pd-reviews-empty"><i class="far fa-comment-dots"></i><p>Sé el primero en opinar sobre este producto.</p></div>`
            : resenas.map(r => {
                const fecha = r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'}) : '';
                return `
                <div class="pd-review-item">
                    <div class="pd-review-header">
                        <span class="pd-review-author">${_escHtml(r.cliente_nombre || 'Anónimo')}</span>
                        ${r.verificado ? '<span class="pd-rev-badge">✅ Compra verificada</span>' : ''}
                        <span class="pd-review-date">${fecha}</span>
                    </div>
                    <div class="pd-review-stars">${renderStars(r.rating)}</div>
                    ${r.titulo ? `<div class="pd-review-titulo"><strong>${_escHtml(r.titulo)}</strong></div>` : ''}
                    ${r.comentario ? `<p class="pd-review-text">${_escHtml(r.comentario)}</p>` : ''}
                </div>`;
            }).join('');

        // ── Formulario para dejar reseña
        const formHtml = `
            <div class="pd-rev-form" id="rev-form-${productoId}">
                <h4 class="pd-rev-form__title">✍️ Deja tu opinión</h4>
                <div class="pd-rev-stars-pick" id="star-pick-${productoId}">
                    ${[1,2,3,4,5].map(n => `<span class="pd-rev-star" data-val="${n}" onclick="_pickStar(${productoId},${n})">☆</span>`).join('')}
                </div>
                <input class="pd-rev-input" id="rev-nombre-${productoId}" placeholder="Tu nombre (opcional)">
                <input class="pd-rev-input" id="rev-titulo-${productoId}" placeholder="Título de tu reseña (opcional)">
                <textarea class="pd-rev-input pd-rev-textarea" id="rev-comment-${productoId}" placeholder="Cuéntanos tu experiencia con este producto…" rows="3"></textarea>
                <button class="pd-rev-submit" onclick="_submitResena(${negocioId},${productoId},'${containerId}')">
                    Publicar opinión
                </button>
                <p class="pd-rev-note">Las opiniones son revisadas antes de publicarse.</p>
                <div id="rev-msg-${productoId}" style="display:none;"></div>
            </div>`;

        container.innerHTML = `
            <div class="pd-reviews-summary">
                <div class="pd-rating-big">
                    <div class="pd-rating-number">${promedio.toFixed(1)}</div>
                    <div class="pd-rating-stars">${renderStars(promedio)}</div>
                    <div class="pd-rating-count">${total} opinión${total !== 1 ? 'es' : ''}</div>
                </div>
                ${total > 0 ? `<div class="pd-dist">${distHtml}</div>` : ''}
            </div>
            <div class="pd-reviews-list">${reviewsHtml}</div>
            ${formHtml}
        `;

    } catch(e) {
        if (container) container.innerHTML = `<div class="pd-reviews-empty"><i class="far fa-comment-dots"></i><p>No se pudieron cargar las opiniones.</p></div>`;
    }
}

let _starPicks = {};
function _pickStar(productoId, val) {
    _starPicks[productoId] = val;
    const container = document.getElementById(`star-pick-${productoId}`);
    if (!container) return;
    container.querySelectorAll('.pd-rev-star').forEach((s, i) => {
        s.textContent = i < val ? '★' : '☆';
        s.classList.toggle('selected', i < val);
    });
}

async function _submitResena(negocioId, productoId, containerId) {
    const rating = _starPicks[productoId] || 0;
    const nombre    = document.getElementById(`rev-nombre-${productoId}`)?.value.trim();
    const titulo    = document.getElementById(`rev-titulo-${productoId}`)?.value.trim();
    const comentario = document.getElementById(`rev-comment-${productoId}`)?.value.trim();
    const msgEl     = document.getElementById(`rev-msg-${productoId}`);

    if (!rating) { _showRevMsg(msgEl, '⚠️ Selecciona una calificación de estrellas', 'warn'); return; }

    const apiUrl = (typeof API_URL !== 'undefined' ? API_URL : window._tkApiBase || '');
    try {
        const res = await fetch(`${apiUrl}/resenas/${negocioId}/productos/${productoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, nombre, titulo, comentario })
        });
        const data = await res.json();
        if (data.success) {
            _showRevMsg(msgEl, `✅ ${data.message}`, 'ok');
            document.getElementById(`rev-form-${productoId}`)?.querySelectorAll('input,textarea').forEach(el => el.value = '');
            _starPicks[productoId] = 0;
            document.getElementById(`star-pick-${productoId}`)?.querySelectorAll('.pd-rev-star').forEach(s => { s.textContent = '☆'; s.classList.remove('selected'); });
            setTimeout(() => _loadAndRenderResenas(negocioId, productoId, containerId), 1500);
        } else {
            _showRevMsg(msgEl, `❌ ${data.error || 'Error al publicar'}`, 'error');
        }
    } catch(e) {
        _showRevMsg(msgEl, '❌ Error de conexión', 'error');
    }
}

function _showRevMsg(el, text, type) {
    if (!el) return;
    el.style.display = 'block';
    el.style.cssText = `display:block;margin-top:8px;padding:8px 12px;border-radius:8px;font-size:.82rem;font-weight:600;background:${type==='ok'?'rgba(34,197,94,.12)':type==='warn'?'rgba(245,158,11,.12)':'rgba(239,68,68,.12)'};color:${type==='ok'?'#22c55e':type==='warn'?'#f59e0b':'#ef4444'}`;
    el.textContent = text;
}

function _escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) stars += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function switchTab(tabId) {
    document.querySelectorAll('.pd-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    document.querySelectorAll('.pd-tab-content').forEach(content => content.classList.toggle('active', content.dataset.tab === tabId));
}

// ==========================================
// PRODUCTOS RELACIONADOS
// ==========================================
function renderRelatedProducts(p) {
    const allProducts = window.productos || [];
    const related = allProducts.filter(prod => prod.id !== p.id && prod.categoria === p.categoria).slice(0, 4);
    
    if (related.length === 0) return '';
    
    let html = `<div class="pd-related pd-animate-in"><h3 class="pd-related-title">También te puede interesar</h3><div class="pd-related-grid">`;
    
    related.forEach(prod => {
        html += `
            <div class="pd-related-item" onclick="openProductDetail(productos.find(p => p.id === ${prod.id}))">
                <div class="pd-related-img"><img src="${prod.imagen_url || 'https://via.placeholder.com/150/16161f/d4af37?text=Producto'}" alt="${prod.nombre}" loading="lazy"></div>
                <div class="pd-related-info">
                    <div class="pd-related-name">${truncate(prod.nombre, 30)}</div>
                    <div class="pd-related-price">${formatPrice(prod.precio)}</div>
                </div>
                <button class="pd-related-quick-add" onclick="event.stopPropagation(); quickAddToCart(${prod.id})" aria-label="Agregar al carrito"><i class="fas fa-plus"></i></button>
            </div>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

function quickAddToCart(productId) {
    if (typeof addToCart === 'function') {
        addToCart(productId);
        showDetailToast('✓ Producto agregado', 'success');
    }
}

// ==========================================
// HELPERS
// ==========================================
function formatPrice(price) {
    if (typeof window.formatPriceCOP === 'function') return window.formatPriceCOP(price);
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price || 0);
}

function truncate(str, length) {
    if (!str) return '';
    return str.length <= length ? str : str.substring(0, length) + '...';
}

function showDetailToast(message, type = 'success') {
    document.querySelector('.pd-toast')?.remove();
    
    const toast = document.createElement('div');
    toast.className = `pd-toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==========================================
// ★ NUEVO v3.5: REGISTRAR VISTA DE PRODUCTO
// ==========================================

/**
 * Registra una vista del producto en el backend
 * Se usa para el badge "popular" (50+ vistas)
 */
function registrarVistaProducto(productId) {
    if (!productId) return;
    
    // Evitar múltiples registros de la misma vista en la sesión
    const viewedKey = `viewed_${productId}_${Date.now().toString().slice(0, -4)}`; // Por cada 10 segundos
    if (sessionStorage.getItem(viewedKey)) return;
    
    // ★ CORREGIDO: Usar URL completa del backend
    const API_URL = window.API_URL || 'https://trayectoria-backend.onrender.com/api';
    
    fetch(`${API_URL}/producto/${productId}/vista`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`👁️ Vista registrada: Producto ${productId} | Total: ${data.visitas}`);
            sessionStorage.setItem(viewedKey, '1');
            
            // Actualizar el producto local si existe
            if (currentProduct && currentProduct.id === productId) {
                currentProduct.visitas_7_dias = data.visitas;
                if (currentProduct.badges) {
                    currentProduct.badges.visitas_7_dias = data.visitas;
                    currentProduct.badges.popular = data.visitas >= 50;
                }
            }
        }
    })
    .catch(error => {
        // Silencioso - no es crítico si falla
        console.debug('Vista no registrada:', error.message);
    });
}

// ==========================================
// EXPONER GLOBALMENTE
// ==========================================
window.initProductDetail = initProductDetail;
window.openProductDetail = openProductDetail;
window.closeProductDetail = closeProductDetail;
window.changeImage = changeImage;
window.changeSlide = changeSlide;
window.goToImage = goToImage;
window.goToSlide = goToSlide;
window.toggleZoom = toggleZoom;
window.showProductVideo = showProductVideo;
window.closeProductVideo = closeProductVideo;
window.changeQuantity = changeQuantity;
window.validateQuantity = validateQuantity;
window.addToCartFromDetail = addToCartFromDetail;
window.buyNowFromDetail = buyNowFromDetail;
window.askViaWhatsApp = askViaWhatsApp;
window.shareOnFacebook = shareOnFacebook;
window.shareOnTwitter = shareOnTwitter;
window.shareOnWhatsApp = shareOnWhatsApp;
window.copyProductLink = copyProductLink;
window.switchTab = switchTab;
window.quickAddToCart = quickAddToCart;
window.getProductVideoUrl = getProductVideoUrl;

// ★ v3.4: Exponer funciones de personalización + legal
window.togglePersonalizacion = togglePersonalizacion;
window.handleFileUpload = handleFileUpload;
window.removeUploadedFile = removeUploadedFile;
window.handleTextInput = handleTextInput;
window.getPersonalizacionFromCart = getPersonalizacionFromCart;
window.isProductPersonalizable = isProductPersonalizable;
window.personalizacionState = personalizacionState;
window.handleLegalAcceptance = handleLegalAcceptance;
window.toggleLegalDetail = toggleLegalDetail;

// ★ v3.6: Exponer funciones de variantes
window.seleccionarVariante = seleccionarVariante;
window.variantesSeleccionadas = variantesSeleccionadas;
window.getVarianteTexto = getVarianteTexto;
window.getVarianteId = getVarianteId;

console.log('🛍️ Product Detail Panel v3.6 "Variantes Edition" cargado ✅');