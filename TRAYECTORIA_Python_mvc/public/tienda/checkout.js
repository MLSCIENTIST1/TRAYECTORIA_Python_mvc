/**
 * =========================================================
 * CHECKOUT.JS - tukomercio v8.0 WOMPI EDITION
 * ★ v5.6: Confirmación legal en checkout
 * ★ v6.0: Sistema de envíos inteligente
 *   - Lee config_envios del negocio (JSONB)
 *   - Modo pickup con enlace a Google Maps
 *   - Comparación de transportadoras con precio + días
 *   - Advertencia al elegir transportadora más cara
 *   - Flete gratis automático según umbral configurado
 *   - Flete "A confirmar" si ciudad sin tarifas
 * ★ v7.0: Cupones de descuento
 * ★ v8.0: Wompi — Pagos en línea (tarjeta, PSE, Nequi)
 *   - Detecta si el negocio tiene Wompi activo
 *   - Muestra botón "Pagar en línea" dinámicamente
 *   - Genera firma de integridad vía backend
 *   - Abre widget Wompi en modal nativo
 * ★ Actualizado: Mayo 2026
 * =========================================================
 */

const API_URL = 'https://trayectoria-backend.onrender.com/api';

let tiendaConfig = {
    negocio_id: null,
    nombre: 'Tienda',
    whatsapp: '',
    slug: ''
};

let storeConfigCompleta = null;
let carrito = [];
let compradorToken = null;
let compradorData = null;
let selectedAddressType = 'residencia';
let selectedPaymentMethod = 'efectivo';

let personalizaciones = {};

// ★ v6.0: Envíos
let configEnvios = null;           // config_envios JSONB del negocio
let selectedDeliveryMode = 'domicilio';  // 'domicilio' | 'pickup'
let selectedTransportadora = null; // nombre de la transportadora elegida
let selectedFletePrice = null;     // precio del flete seleccionado (número)

// ★ v7.0: Cupones
let cuponAplicado = null;          // { codigo, descuento, tipo, valor, descripcion }

// ★ v8.0: Wompi
let wompiConfig = null;            // { activo, public_key, ambiente } o null
let _wompiScriptLoaded = false;    // evita cargar el script dos veces

// ==========================================
// DEPARTAMENTOS Y CIUDADES DE COLOMBIA
// ==========================================
const departamentos = {
    'Amazonas': ['Leticia', 'Puerto Nariño'],
    'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Apartadó', 'Turbo', 'Caucasia'],
    'Arauca': ['Arauca', 'Saravena', 'Tame'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia'],
    'Bogotá D.C.': ['Bogotá'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar'],
    'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa'],
    'Caldas': ['Manizales', 'La Dorada', 'Villamaría', 'Chinchiná'],
    'Caquetá': ['Florencia', 'San Vicente del Caguán'],
    'Casanare': ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena'],
    'Cauca': ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'],
    'Cesar': ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi'],
    'Chocó': ['Quibdó', 'Istmina', 'Tadó'],
    'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún'],
    'Cundinamarca': ['Soacha', 'Girardot', 'Zipaquirá', 'Facatativá', 'Chía', 'Fusagasugá', 'Madrid', 'Mosquera'],
    'Guainía': ['Inírida'],
    'Guaviare': ['San José del Guaviare'],
    'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
    'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Manaure'],
    'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco'],
    'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
    'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'La Unión'],
    'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
    'Putumayo': ['Mocoa', 'Puerto Asís', 'Orito'],
    'Quindío': ['Armenia', 'Calarcá', 'Montenegro', 'La Tebaida'],
    'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
    'San Andrés y Providencia': ['San Andrés', 'Providencia'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
    'Sucre': ['Sincelejo', 'Corozal', 'San Marcos'],
    'Tolima': ['Ibagué', 'Espinal', 'Melgar', 'Chaparral', 'Honda'],
    'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Cartago', 'Buga', 'Yumbo', 'Jamundí'],
    'Vaupés': ['Mitú'],
    'Vichada': ['Puerto Carreño']
};

// ==========================================
// FUNCIONES DEL CARRITO
// ==========================================
function getCarritoKey() {
    return `carrito_${tiendaConfig.negocio_id || tiendaConfig.slug || 'default'}`;
}

function getPersonalizacionKey() {
    return `personalizacion_${tiendaConfig.negocio_id || tiendaConfig.slug || 'default'}`;
}

function loadCarrito() {
    const key = getCarritoKey();
    const data = localStorage.getItem(key);
    carrito = data ? JSON.parse(data) : [];
    loadPersonalizaciones();
}

function loadPersonalizaciones() {
    const key = getPersonalizacionKey();
    try {
        personalizaciones = JSON.parse(localStorage.getItem(key) || '{}');
        console.log('🎨 Personalizaciones cargadas:', Object.keys(personalizaciones).length);
    } catch (e) {
        personalizaciones = {};
    }
}

function clearCarrito() {
    const key = getCarritoKey();
    localStorage.removeItem(key);
    carrito = [];
    
    const persKey = getPersonalizacionKey();
    localStorage.removeItem(persKey);
    personalizaciones = {};
}

function getPersonalizacion(productId) {
    return personalizaciones[productId] || null;
}

function calcularCostoPersonalizacion() {
    let costoTotal = 0;
    carrito.forEach(item => {
        const pers = getPersonalizacion(item.id);
        if (pers && pers.activa && pers.costo_adicional) {
            costoTotal += parseFloat(pers.costo_adicional) * item.cantidad;
        }
    });
    return costoTotal;
}

// ★ NUEVO v5.6: Verificar si hay productos personalizados con imagen
function hayProductosConImagenPersonalizada() {
    return carrito.some(item => {
        const pers = getPersonalizacion(item.id);
        return pers && pers.activa && pers.imagen_nombre;
    });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Checkout v5.6 Legal Personalization Edition iniciando...');
    
    const slug = getSlugFromURL();
    
    if (slug) {
        await loadStoreConfig(slug);
    } else {
        console.error('❌ No se encontró el slug de la tienda');
        showToast('Error: Tienda no encontrada', 'error');
        return;
    }
    
    loadCarrito();
    console.log('🛒 Carrito cargado:', carrito);
    console.log('🎨 Personalizaciones:', personalizaciones);
    
    const savedToken = localStorage.getItem('comprador_token');
    if (savedToken) {
        await verifyAndLoadComprador(savedToken);
    }
    
    loadDepartamentos();
    renderOrderSummary();
    
    // ★ NUEVO v5.6: Renderizar sección legal si hay personalización con imagen
    renderLegalCheckoutSection();
    
    if (carrito.length === 0) {
        showToast('Tu carrito está vacío', 'error');
        setTimeout(() => {
            window.location.href = `/tienda/?slug=${tiendaConfig.slug}`;
        }, 2000);
    }
});

function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slug')) return params.get('slug');
    
    const path = window.location.pathname;
    const match = path.match(/\/tienda\/([^\/]+)/);
    if (match && !match[1].includes('.html')) return match[1];
    
    return null;
}

// ==========================================
// CARGAR CONFIG
// ==========================================
async function loadStoreConfig(slug) {
    try {
        console.log(`📡 Cargando config de tienda: ${slug}`);
        const response = await fetch(`${API_URL}/negocio/slug/${slug}`);
        
        if (response.ok) {
            const data = await response.json();
            const negocio = data.data || data;
            
            tiendaConfig.negocio_id = negocio.id_negocio || negocio.id;
            tiendaConfig.nombre = negocio.nombre_negocio;
            tiendaConfig.slug = slug;

            // ★ v6.0: cargar config de envíos de este negocio
            await loadConfigEnvios(tiendaConfig.negocio_id);

            // ★ v8.0: cargar config Wompi (no bloquea si falla)
            loadWompiConfig(tiendaConfig.negocio_id).catch(() => {});

            const primaryColor = negocio.config_tienda?.styles?.primaryColor || negocio.color_tema || '#2563eb';
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--primary-dark', primaryColor);

            console.log('✅ Negocio ID cargado:', tiendaConfig.negocio_id);
            
            let whatsappNumber = negocio.whatsapp || negocio.telefono || negocio.celular || '';
            
            const configKey = `tienda_personalizacion_${tiendaConfig.negocio_id}`;
            const savedConfig = localStorage.getItem(configKey);
            
            if (savedConfig) {
                try {
                    storeConfigCompleta = JSON.parse(savedConfig);
                    if (storeConfigCompleta?.whatsapp?.numero) {
                        whatsappNumber = storeConfigCompleta.whatsapp.numero;
                    } else if (storeConfigCompleta?.datos_negocio?.whatsapp) {
                        whatsappNumber = storeConfigCompleta.datos_negocio.whatsapp;
                    }
                } catch (e) {
                    console.warn('⚠️ Error parseando config:', e);
                    storeConfigCompleta = null;
                }
            }
            
            tiendaConfig.whatsapp = whatsappNumber;
            
            if (!storeConfigCompleta) {
                storeConfigCompleta = {
                    nombre: tiendaConfig.nombre,
                    negocio_id: tiendaConfig.negocio_id,
                    slug: slug,
                    whatsapp: { enabled: true, numero: whatsappNumber },
                    datos_negocio: {
                        nombre_negocio: tiendaConfig.nombre,
                        whatsapp: whatsappNumber,
                        telefono: whatsappNumber
                    }
                };
            }
            
            document.getElementById('storeName').textContent = tiendaConfig.nombre;
            document.getElementById('backLink').href = `/tienda/carrito.html?slug=${slug}`;
            document.title = `Checkout | ${tiendaConfig.nombre}`;
            
        } else {
            console.error('❌ Error HTTP:', response.status);
            showToast('Error cargando tienda', 'error');
        }
    } catch (e) {
        console.error('❌ Error cargando config:', e);
        showToast('Error de conexión', 'error');
    }
}

async function verifyAndLoadComprador(token) {
    try {
        const response = await fetch(`${API_URL}/compradores/${token}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            compradorToken = token;
            compradorData = data.comprador || data;
            fillCompradorData();
            selectAuthOption('guest');
            showToast('¡Bienvenido de vuelta!', 'success');
        } else {
            localStorage.removeItem('comprador_token');
        }
    } catch (e) {
        console.error('Error verificando comprador:', e);
        localStorage.removeItem('comprador_token');
    }
}

function fillCompradorData() {
    if (!compradorData) return;
    const nombre = document.getElementById('nombre');
    const correo = document.getElementById('correo');
    const telefono = document.getElementById('telefono');
    if (nombre) nombre.value = compradorData.nombre || '';
    if (correo) correo.value = compradorData.correo || '';
    if (telefono) telefono.value = compradorData.telefono || '';
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
function selectAuthOption(option) {
    document.querySelectorAll('.auth-option').forEach(el => el.classList.remove('active'));
    const optionEl = document.querySelector(`.auth-option[data-option="${option}"]`);
    if (optionEl) optionEl.classList.add('active');
    
    const loginForm = document.getElementById('loginForm');
    const guestForm = document.getElementById('guestForm');
    if (loginForm) loginForm.classList.toggle('show', option === 'login');
    if (guestForm) guestForm.classList.toggle('show', option === 'guest');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Ingresa correo y contraseña', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/compradores/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            compradorToken = data.token;
            compradorData = data.comprador;
            localStorage.setItem('comprador_token', data.token);
            fillCompradorData();
            selectAuthOption('guest');
            showToast('¡Bienvenido de vuelta!', 'success');
        } else {
            showToast(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (e) {
        console.error('Error login:', e);
        showToast('Error de conexión', 'error');
    }
}

function togglePasswordField() {
    const checkbox = document.getElementById('crearCuenta');
    const field = document.getElementById('passwordField');
    if (checkbox && field) field.classList.toggle('show', checkbox.checked);
}

// ==========================================
// TIPOS DE DIRECCIÓN
// ==========================================
function selectAddressType(type) {
    selectedAddressType = type;
    document.querySelectorAll('.address-type').forEach(el => el.classList.remove('active'));
    const typeEl = document.querySelector(`.address-type[data-type="${type}"]`);
    if (typeEl) typeEl.classList.add('active');
    showSpecialFields(type);
}

function showSpecialFields(type) {
    const container = document.getElementById('specialFields');
    const title = document.getElementById('specialFieldsTitle');
    const content = document.getElementById('specialFieldsContent');
    
    if (!container || !title || !content) return;
    
    const specialTypes = {
        'centro_penitenciario': {
            title: 'Datos del centro penitenciario',
            fields: `<div class="form-row"><div class="form-group"><label>Nombre del centro <span class="required">*</span></label><input type="text" id="nombreEstablecimiento" placeholder="Ej: La Picota"></div><div class="form-group"><label>Patio/Pabellón</label><input type="text" id="datoPatio" placeholder="Patio 5"></div></div>`
        },
        'guarnicion_militar': {
            title: 'Datos de la guarnición militar',
            fields: `<div class="form-row"><div class="form-group"><label>Nombre de la base <span class="required">*</span></label><input type="text" id="nombreEstablecimiento" placeholder="Batallón"></div><div class="form-group"><label>Compañía/Unidad</label><input type="text" id="datoCompania" placeholder="Compañía A"></div></div>`
        },
        'kilometro': {
            title: 'Ubicación por kilómetro',
            fields: `<div class="form-row"><div class="form-group"><label>Vía/Carretera <span class="required">*</span></label><input type="text" id="datoVia" placeholder="Vía Bogotá - Melgar"></div><div class="form-group"><label>Kilómetro <span class="required">*</span></label><input type="text" id="datoKilometro" placeholder="Km 45"></div></div>`
        },
        'vereda': {
            title: 'Ubicación rural',
            fields: `<div class="form-row"><div class="form-group"><label>Nombre de la vereda <span class="required">*</span></label><input type="text" id="datoVereda" placeholder="Vereda El Carmen"></div><div class="form-group"><label>Corregimiento</label><input type="text" id="datoCorregimiento" placeholder="Corregimiento"></div></div>`
        }
    };
    
    if (specialTypes[type]) {
        container.classList.add('show');
        title.textContent = specialTypes[type].title;
        content.innerHTML = specialTypes[type].fields;
    } else {
        container.classList.remove('show');
        content.innerHTML = '';
    }
}

// ==========================================
// DEPARTAMENTOS Y CIUDADES
// ==========================================
function loadDepartamentos() {
    const select = document.getElementById('departamento');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar departamento...</option>';
    Object.keys(departamentos).sort().forEach(dep => {
        select.innerHTML += `<option value="${dep}">${dep}</option>`;
    });
}

function loadCities() {
    const depSelect = document.getElementById('departamento');
    const citySelect = document.getElementById('ciudad');
    if (!depSelect || !citySelect) return;

    const dep = depSelect.value;
    citySelect.innerHTML = '<option value="">Seleccionar ciudad...</option>';
    if (dep && departamentos[dep]) {
        departamentos[dep].forEach(city => {
            citySelect.innerHTML += `<option value="${city}">${city}</option>`;
        });
    }

    // ★ v6.0: reset flete cuando cambia el departamento
    selectedTransportadora = null;
    selectedFletePrice = null;
    actualizarFletes();
}

// ==========================================
// MÉTODOS DE PAGO
// ==========================================
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('active'));
    const methodEl = document.querySelector(`.payment-method[data-method="${method}"]`);
    if (methodEl) methodEl.classList.add('active');
}

// ==========================================
// RESUMEN DEL PEDIDO CON PERSONALIZACIÓN
// ==========================================
function renderOrderSummary() {
    const container = document.getElementById('summaryProducts');
    if (!container) return;
    
    if (carrito.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b;">Carrito vacío</p>';
        return;
    }
    
    container.innerHTML = carrito.map(item => {
        const pers = getPersonalizacion(item.id);
        const tienePersonalizacion = pers && pers.activa;
        const costoAdicional = tienePersonalizacion ? (parseFloat(pers.costo_adicional) || 0) : 0;
        const precioItem = (item.precio + costoAdicional) * item.cantidad;
        
        let persHtml = '';
        if (tienePersonalizacion) {
            persHtml = `
                <div class="summary-item-personalization">
                    <span class="pers-badge">🎨 Personalizado</span>
                    ${pers.texto ? `<span class="pers-texto">📝 "${truncateText(pers.texto, 30)}"</span>` : ''}
                    ${pers.imagen_nombre ? `<span class="pers-imagen">🖼️ ${truncateText(pers.imagen_nombre, 20)}</span>` : ''}
                    ${costoAdicional > 0 ? `<span class="pers-costo">+${formatPrice(costoAdicional)}</span>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="summary-item ${tienePersonalizacion ? 'has-personalization' : ''}">
                <img src="${item.imagen_url || 'https://via.placeholder.com/60x60?text=Producto'}" 
                    alt="${item.nombre}"
                    onerror="this.src='https://via.placeholder.com/60x60?text=Producto'">
                <div class="summary-item-info">
                    <h4>${item.nombre}</h4>
                    <p>Cantidad: ${item.cantidad}</p>
                    ${persHtml}
                </div>
                <div class="summary-item-price">${formatPrice(precioItem)}</div>
            </div>
        `;
    }).join('');
    
    const subtotal = getSubtotal();

    // ★ v6.0: flete desde estado actual de envíos
    let shippingCost = 0;
    let shippingLabel;
    if (selectedDeliveryMode === 'pickup') {
        shippingLabel = '<span class="free">Recogida gratis</span>';
    } else if (selectedFletePrice === null) {
        shippingLabel = '<span style="color:#94a3b8;font-size:0.85rem">A confirmar</span>';
        shippingCost = 0;
    } else if (selectedFletePrice === 0) {
        shippingLabel = '<span class="free">Gratis 🎉</span>';
        shippingCost = 0;
    } else {
        shippingCost = selectedFletePrice;
        shippingLabel = formatPrice(shippingCost);
    }

    // ★ v7.0: descuento por cupón
    const descuento = cuponAplicado ? cuponAplicado.descuento : 0;
    const total = Math.max(0, subtotal - descuento + shippingCost);

    const subtotalEl       = document.getElementById('summarySubtotal');
    const shippingEl       = document.getElementById('summaryShipping');
    const totalEl          = document.getElementById('summaryTotal');
    const descuentoRow     = document.getElementById('summaryDescuentoRow');
    const descuentoEl      = document.getElementById('summaryDescuento');
    const descuentoCodeEl  = document.getElementById('summaryDescuentoCodigo');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.innerHTML   = shippingLabel;
    if (totalEl)    totalEl.textContent    = formatPrice(total);

    if (descuentoRow) {
        if (descuento > 0 && cuponAplicado) {
            descuentoRow.style.display = 'flex';
            if (descuentoEl) descuentoEl.textContent = '-' + formatPrice(descuento);
            if (descuentoCodeEl) descuentoCodeEl.textContent = `(${cuponAplicado.codigo})`;
        } else {
            descuentoRow.style.display = 'none';
        }
    }
    
    injectPersonalizationStyles();
}

function injectPersonalizationStyles() {
    if (document.getElementById('checkoutPersStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'checkoutPersStyles';
    style.textContent = `
        .summary-item.has-personalization {
            border-left: 3px solid #ec4899;
            background: linear-gradient(to right, rgba(236, 72, 153, 0.05), transparent);
        }
        .summary-item-personalization {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 6px;
            font-size: 0.75rem;
        }
        .pers-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: linear-gradient(135deg, #ec4899, #a855f7);
            color: white;
            border-radius: 10px;
            font-weight: 600;
        }
        .pers-texto { color: #6b7280; font-style: italic; }
        .pers-imagen { color: #3b82f6; }
        .pers-costo { color: #22c55e; font-weight: 600; }
        
        /* ═══════════════════════════════════════
           ★ NUEVO v5.6: LEGAL SECTION IN CHECKOUT
           ═══════════════════════════════════════ */
        .checkout-legal-section {
            background: #fffbeb;
            border: 2px solid #fcd34d;
            border-radius: 12px;
            padding: 16px 20px;
            margin-top: 16px;
            display: none;
        }
        
        .checkout-legal-section.show {
            display: block;
            animation: legalFadeIn 0.3s ease;
        }
        
        @keyframes legalFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .checkout-legal-section.accepted {
            background: #f0fdf4;
            border-color: #86efac;
        }
        
        .checkout-legal-section.error {
            background: #fef2f2;
            border-color: #fca5a5;
            animation: legalShake 0.4s ease;
        }
        
        @keyframes legalShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-5px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
        }
        
        .checkout-legal-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            color: #92400e;
        }
        
        .checkout-legal-section.accepted .checkout-legal-header {
            color: #166534;
        }
        
        .checkout-legal-checkbox-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
        }
        
        .checkout-legal-cb {
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            margin-top: 2px;
            accent-color: #22c55e;
            cursor: pointer;
        }
        
        .checkout-legal-text {
            flex: 1;
            font-size: 0.82rem;
            line-height: 1.6;
            color: #374151;
        }
        
        .checkout-legal-text strong {
            color: #1f2937;
        }
        
        .checkout-legal-detail-toggle {
            background: none;
            border: none;
            color: #3b82f6;
            font-size: 0.78rem;
            cursor: pointer;
            padding: 4px 0;
            margin-top: 8px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .checkout-legal-detail-toggle:hover {
            color: #2563eb;
            text-decoration: underline;
        }
        
        .checkout-legal-detail {
            display: none;
            margin-top: 10px;
            padding: 12px;
            background: rgba(255,255,255,0.7);
            border-radius: 8px;
            font-size: 0.75rem;
            color: #6b7280;
            line-height: 1.6;
        }
        
        .checkout-legal-detail.show {
            display: block;
        }
        
        .checkout-legal-detail ul {
            margin: 6px 0;
            padding-left: 18px;
        }
        
        .checkout-legal-detail ul li {
            margin-bottom: 4px;
        }
        
        .checkout-legal-productos {
            margin-top: 10px;
            padding: 10px;
            background: rgba(236, 72, 153, 0.08);
            border-radius: 8px;
            font-size: 0.8rem;
        }
        
        .checkout-legal-productos strong {
            display: block;
            margin-bottom: 6px;
            color: #be185d;
        }
        
        .checkout-legal-productos .prod-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 0;
            color: #4b5563;
        }
    `;
    
    document.head.appendChild(style);
}

// ==========================================
// ★★★ NUEVO v5.6: SECCIÓN LEGAL EN CHECKOUT ★★★
// ==========================================
function renderLegalCheckoutSection() {
    // Solo mostrar si hay productos con imagen personalizada
    if (!hayProductosConImagenPersonalizada()) {
        console.log('⚖️ No hay productos con imagen personalizada, sección legal no necesaria');
        return;
    }
    
    // Buscar el contenedor (antes del botón de submit)
    const legalContainer = document.getElementById('checkoutLegalSection');
    if (!legalContainer) {
        console.log('⚖️ Creando sección legal dinámicamente...');
        
        // Buscar dónde insertar: antes del botón de submit
        const submitBtn = document.getElementById('submitBtn');
        if (!submitBtn) return;
        
        const section = document.createElement('div');
        section.id = 'checkoutLegalSection';
        section.className = 'checkout-legal-section show';
        
        // Listar productos personalizados con imagen
        const productosPersonalizados = carrito.filter(item => {
            const pers = getPersonalizacion(item.id);
            return pers && pers.activa && pers.imagen_nombre;
        });
        
        let productosHtml = '';
        if (productosPersonalizados.length > 0) {
            productosHtml = `
                <div class="checkout-legal-productos">
                    <strong>🎨 Productos con imagen personalizada:</strong>
                    ${productosPersonalizados.map(item => {
                        const pers = getPersonalizacion(item.id);
                        return `<div class="prod-item">
                            <span>🖼️</span>
                            <span>${item.nombre} — <em>${pers.imagen_nombre}</em></span>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }
        
        section.innerHTML = `
            <div class="checkout-legal-header">
                <span>⚖️</span>
                <span>Declaración de propiedad de imágenes</span>
            </div>
            
            ${productosHtml}
            
            <label class="checkout-legal-checkbox-row" for="checkoutLegalCheckbox" style="margin-top: 12px;">
                <input type="checkbox" 
                       class="checkout-legal-cb" 
                       id="checkoutLegalCheckbox"
                       onchange="handleCheckoutLegalChange(event)">
                <div class="checkout-legal-text">
                    <strong>Declaro que soy el propietario o tengo autorización</strong> para usar 
                    las imágenes y diseños proporcionados en la personalización de los productos de 
                    este pedido. Confirmo que no infringen derechos de autor, marcas registradas 
                    ni propiedad intelectual de terceros, y asumo toda responsabilidad sobre su contenido.
                </div>
            </label>
            
            <button class="checkout-legal-detail-toggle" onclick="toggleCheckoutLegalDetail()" type="button">
                <i class="fas fa-chevron-down" id="checkoutLegalToggleIcon"></i>
                Ver términos completos
            </button>
            
            <div class="checkout-legal-detail" id="checkoutLegalDetail">
                <p>Al confirmar este pedido con productos personalizados, el comprador declara y acepta que:</p>
                <ul>
                    <li><strong>Propiedad:</strong> Es el autor original del diseño o cuenta con autorización expresa del titular de los derechos para usar la imagen en la personalización del producto solicitado.</li>
                    <li><strong>No infracción:</strong> Las imágenes proporcionadas no infringen derechos de autor, marcas registradas, patentes, derechos de imagen de terceros, ni ninguna forma de propiedad intelectual protegida por la ley colombiana o internacional.</li>
                    <li><strong>Contenido lícito:</strong> Las imágenes no contienen material ilegal, ofensivo, difamatorio, obsceno, que promueva la violencia, la discriminación o que atente contra los derechos fundamentales de cualquier persona.</li>
                    <li><strong>Uso limitado:</strong> Las imágenes proporcionadas serán utilizadas exclusivamente para la elaboración del producto personalizado solicitado. La tienda no redistribuirá ni utilizará las imágenes para fines distintos a los del pedido.</li>
                    <li><strong>Responsabilidad del comprador:</strong> El comprador asume toda la responsabilidad legal, civil y económica ante cualquier reclamación de terceros que surja del uso de las imágenes proporcionadas para la personalización.</li>
                    <li><strong>Exoneración:</strong> La tienda y la plataforma TuKomercio quedan exoneradas de cualquier responsabilidad directa o indirecta relacionada con el contenido de las imágenes subidas por el comprador.</li>
                    <li><strong>Aceptación irrevocable:</strong> Al marcar esta casilla y completar el pedido, el comprador reconoce haber leído, entendido y aceptado la totalidad de estos términos.</li>
                </ul>
            </div>
        `;
        
        // Insertar antes del botón de submit
        submitBtn.parentNode.insertBefore(section, submitBtn);
    }
}

// ★ NUEVO v5.6: Manejar cambio en checkbox legal del checkout
function handleCheckoutLegalChange(event) {
    const checked = event.target.checked;
    const section = document.getElementById('checkoutLegalSection');
    
    if (section) {
        section.classList.toggle('accepted', checked);
        section.classList.remove('error');
    }
    
    console.log('⚖️ Legal checkout:', checked ? 'ACEPTADO ✅' : 'NO ACEPTADO ❌');
}

// ★ NUEVO v5.6: Toggle detalle legal en checkout
function toggleCheckoutLegalDetail() {
    const detail = document.getElementById('checkoutLegalDetail');
    const icon = document.getElementById('checkoutLegalToggleIcon');
    
    if (detail) {
        const isOpen = detail.classList.contains('show');
        detail.classList.toggle('show');
        if (icon) {
            icon.className = isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        }
    }
}

// Helper para truncar texto
function truncateText(str, maxLength) {
    if (!str) return '';
    return str.length <= maxLength ? str : str.substring(0, maxLength) + '...';
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

// ==========================================
// VALIDACIÓN DEL FORMULARIO
// ==========================================
function validateForm() {
    const nombre = document.getElementById('nombre');
    const correo = document.getElementById('correo');
    const telefono = document.getElementById('telefono');
    
    if (!nombre || !nombre.value.trim()) {
        showToast('Ingresa tu nombre', 'error');
        if (nombre) nombre.focus();
        return false;
    }
    
    if (!correo || !correo.value.trim() || !correo.value.includes('@')) {
        showToast('Ingresa un correo válido', 'error');
        if (correo) correo.focus();
        return false;
    }
    
    if (!telefono || !telefono.value.trim()) {
        showToast('Ingresa tu número de WhatsApp', 'error');
        if (telefono) telefono.focus();
        return false;
    }
    
    // ★ v6.0: en modo pickup no se necesita dirección
    if (selectedDeliveryMode !== 'pickup') {
        const departamento = document.getElementById('departamento');
        const ciudad = document.getElementById('ciudad');
        const barrio = document.getElementById('barrio');
        const direccion = document.getElementById('direccion');

        if (!departamento || !departamento.value) {
            showToast('Selecciona un departamento', 'error');
            if (departamento) departamento.focus();
            return false;
        }

        if (!ciudad || !ciudad.value) {
            showToast('Selecciona una ciudad', 'error');
            if (ciudad) ciudad.focus();
            return false;
        }

        if (!barrio || !barrio.value.trim()) {
            showToast('Ingresa el barrio', 'error');
            if (barrio) barrio.focus();
            return false;
        }

        if (!direccion || !direccion.value.trim()) {
            showToast('Ingresa la dirección', 'error');
            if (direccion) direccion.focus();
            return false;
        }
    }
    
    const crearCuenta = document.getElementById('crearCuenta');
    if (crearCuenta && crearCuenta.checked) {
        const password = document.getElementById('password');
        if (!password || !password.value || password.value.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            if (password) password.focus();
            return false;
        }
    }
    
    // ★★★ NUEVO v5.6: Validar aceptación legal si hay productos personalizados con imagen ★★★
    if (hayProductosConImagenPersonalizada()) {
        const legalCheckbox = document.getElementById('checkoutLegalCheckbox');
        if (!legalCheckbox || !legalCheckbox.checked) {
            showToast('⚖️ Debes aceptar los términos de propiedad de imágenes', 'error');
            
            const legalSection = document.getElementById('checkoutLegalSection');
            if (legalSection) {
                legalSection.classList.add('error');
                legalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => legalSection.classList.remove('error'), 2000);
            }
            return false;
        }
    }
    
    return true;
}

// ==========================================
// ★★★ ENVIAR PEDIDO v5.6 CON LEGAL ★★★
// ==========================================
async function submitOrder(metodoPagoOverride = null, wompiRef = null) {
    console.log('\n📤 ===== INICIANDO ENVÍO DE PEDIDO v8.0 =====');

    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('loadingSpinner');
    
    if (!validateForm()) {
        console.log('❌ Validación falló');
        return;
    }
    
    if (!tiendaConfig.negocio_id) {
        console.error('❌ ERROR CRÍTICO: No hay negocio_id');
        showToast('Error: No se pudo identificar la tienda', 'error');
        return;
    }
    
    if (!tiendaConfig.whatsapp && !storeConfigCompleta?.whatsapp?.numero) {
        console.error('❌ No hay número de WhatsApp configurado');
        showToast('Error: La tienda no tiene WhatsApp configurado', 'error');
        return;
    }
    
    btn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    
    try {
        const subtotal = getSubtotal();

        // ★ v6.0: usar flete calculado por config_envios
        const costoEnvio = (selectedDeliveryMode === 'pickup' || selectedFletePrice === 0)
            ? 0
            : (selectedFletePrice || 0);

        // ★ v7.0: descuento por cupón
        const descuento = cuponAplicado ? cuponAplicado.descuento : 0;
        const total = Math.max(0, subtotal - descuento + costoEnvio);
        
        const dept = document.getElementById('departamento').value;
        const city = document.getElementById('ciudad').value;
        const barr = document.getElementById('barrio').value.trim();
        const dir = document.getElementById('direccion').value.trim();
        const comp = document.getElementById('complemento')?.value.trim() || '';
        
        const direccionCompleta = `${dir}${comp ? ', ' + comp : ''}, ${barr}, ${city}, ${dept}`;
        
        const productosPayload = carrito.map(item => {
            const pers = getPersonalizacion(item.id);
            const costoAdicional = (pers && pers.activa) ? (parseFloat(pers.costo_adicional) || 0) : 0;
            
            return {
                producto_id: item.id || item.id_producto,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                precio_con_personalizacion: item.precio + costoAdicional,
                personalizacion: (pers && pers.activa) ? {
                    activa: true,
                    texto: pers.texto || null,
                    imagen_nombre: pers.imagen_nombre || null,
                    costo_adicional: costoAdicional,
                    // ★ NUEVO v5.6: Datos de aceptación legal
                    legal_aceptado: pers.legal_aceptado || false,
                    legal_fecha_producto: pers.legal_fecha || null
                } : null
            };
        });
        
        // ★ NUEVO v5.6: Datos de aceptación legal del checkout
        const tienePersonalizacion = productosPayload.some(p => p.personalizacion !== null);
        const legalCheckbox = document.getElementById('checkoutLegalCheckbox');
        const legalAceptadoCheckout = legalCheckbox ? legalCheckbox.checked : false;
        
        const payload = {
            negocio_id: tiendaConfig.negocio_id,
            comprador: {
                nombre: document.getElementById('nombre').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                email: document.getElementById('correo').value.trim()
            },
            direccion: {
                direccion_completa: direccionCompleta,
                ciudad: city,
                departamento: dept,
                codigo_postal: null,
                tipo: selectedAddressType
            },
            productos: productosPayload,
            subtotal: subtotal,
            descuento: descuento,
            costo_envio: costoEnvio,
            total: total,
            metodo_pago: metodoPagoOverride || selectedPaymentMethod,
            // ★ v8.0: referencia Wompi si aplica
            wompi_referencia: wompiRef || null,
            // ★ v6.0: entrega
            modo_entrega: selectedDeliveryMode,
            transportadora: selectedDeliveryMode === 'domicilio' ? (selectedTransportadora || null) : null,
            // ★ v7.0: cupón
            codigo_cupon: cuponAplicado ? cuponAplicado.codigo : null,
            notas: document.getElementById('notas')?.value.trim() || null,
            tiene_personalizacion: tienePersonalizacion,
            // ★ NUEVO v5.6: Info legal en payload
            legal: tienePersonalizacion ? {
                propiedad_imagenes_aceptada: legalAceptadoCheckout,
                fecha_aceptacion: new Date().toISOString(),
                ip_comprador: null
            } : null
        };
        
        console.log('📦 Payload v5.6 con legal:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(`${API_URL}/tiendas/${tiendaConfig.slug}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (response.ok && data.success) {
            console.log('✅ Pedido creado exitosamente');

            // ★ v9.0: marcar carrito como recuperado (silencioso)
            const _nid = tiendaConfig && (tiendaConfig.negocio_id || tiendaConfig.id);
            const _tel = document.getElementById('telefono')?.value?.trim();
            const _pid = data.pedido?.id_pedido || data.pedido?.id || null;
            if (_nid && _tel) marcarCarritoRecuperado(_nid, _tel, _pid);

            if (data.comprador && data.comprador.token) {
                localStorage.setItem('comprador_token', data.comprador.token);
            }
            
            const pedidoParaWhatsApp = {
                numero_pedido: data.pedido?.numero_pedido || data.pedido?.id || `TK-${Date.now()}`,
                productos: productosPayload,
                subtotal: subtotal,
                descuento: descuento,
                costo_envio: costoEnvio,
                total: total,
                cupon: cuponAplicado || null,
                direccion: { direccion_completa: direccionCompleta },
                metodo_pago: selectedPaymentMethod,
                notas: payload.notas,
                tiene_personalizacion: payload.tiene_personalizacion,
                legal_aceptada: legalAceptadoCheckout,
                // ★ v6.0
                modo_entrega: selectedDeliveryMode,
                transportadora: payload.transportadora
            };
            
            showToast('¡Pedido creado exitosamente!', 'success');

            // Código del pedido para la página de seguimiento
            const _codigoPedido = data.pedido?.codigo_pedido || data.pedido?.numero_pedido || null;

            setTimeout(() => {
                enviarPedidoPorWhatsApp(pedidoParaWhatsApp);
            }, 1000);

            clearCarrito();

            setTimeout(() => {
                if (_codigoPedido && tiendaConfig?.slug) {
                    // ★ v10.0: redirigir a página de seguimiento personalizada
                    window.location.href = `/heyden.html?c=${encodeURIComponent(_codigoPedido)}&slug=${tiendaConfig.slug}`;
                } else {
                    window.location.href = `/tienda/?slug=${tiendaConfig.slug}&pedido_exitoso=true`;
                }
            }, 2000);
            
        } else {
            console.error('❌ Error del servidor:', data);
            showToast(data.error || data.message || 'Error al crear el pedido', 'error');
        }
        
    } catch (e) {
        console.error('❌ Error:', e);
        showToast('Error de conexión. Intenta de nuevo.', 'error');
    } finally {
        btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
    }
}

// ★ ACTUALIZADO v5.6: WhatsApp con nota legal
function enviarPedidoPorWhatsApp(pedido) {
    const whatsappNumero = storeConfigCompleta?.whatsapp?.numero || 
                          storeConfigCompleta?.datos_negocio?.whatsapp || 
                          tiendaConfig.whatsapp || '';
    
    if (!whatsappNumero) {
        console.warn('⚠️ No hay número de WhatsApp');
        return;
    }
    
    const numeroLimpio = whatsappNumero.replace(/[^\d]/g, '');
    
    let productosTexto = pedido.productos.map(item => {
        let linea = `• ${item.nombre} x${item.cantidad} - ${formatPrice(item.precio_con_personalizacion * item.cantidad)}`;
        
        if (item.personalizacion && item.personalizacion.activa) {
            linea += '\n  🎨 *PERSONALIZADO:*';
            if (item.personalizacion.texto) {
                linea += `\n  📝 Texto: "${item.personalizacion.texto}"`;
            }
            if (item.personalizacion.imagen_nombre) {
                linea += `\n  🖼️ Diseño: ${item.personalizacion.imagen_nombre}`;
            }
            if (item.personalizacion.costo_adicional > 0) {
                linea += `\n  💰 Costo personalización: +${formatPrice(item.personalizacion.costo_adicional)}`;
            }
        }
        
        return linea;
    }).join('\n\n');
    
    // ★ v6.0: línea de entrega
    const modoEntregaLinea = pedido.modo_entrega === 'pickup'
        ? '🏪 *Entrega:* Recoge en tienda'
        : `🚚 *Entrega:* A domicilio${pedido.transportadora ? ' · ' + pedido.transportadora : ''}`;

    const envioLinea = pedido.modo_entrega === 'pickup'
        ? 'RECOGIDA EN TIENDA 🏪'
        : (pedido.costo_envio === 0 ? 'GRATIS 🎉' : formatPrice(pedido.costo_envio));

    // ★ v7.0: línea de descuento en WhatsApp
    const descLinea = (pedido.descuento > 0 && pedido.cupon)
        ? `*Descuento (${pedido.cupon.codigo}):* -${formatPrice(pedido.descuento)}\n`
        : '';

    let mensaje = `¡Hola! Acabo de hacer un pedido en *${tiendaConfig.nombre}*

*📦 Pedido #${pedido.numero_pedido}*

${productosTexto}

───────────────
*Subtotal:* ${formatPrice(pedido.subtotal)}
${descLinea}*Envío:* ${envioLinea}
*TOTAL:* ${formatPrice(pedido.total)}
───────────────

${modoEntregaLinea}
${pedido.modo_entrega !== 'pickup' ? `📍 *Dirección:* ${pedido.direccion.direccion_completa}` : ''}
💳 *Pago:* ${pedido.metodo_pago}`;

    if (pedido.notas) {
        mensaje += `\n📝 *Notas:* ${pedido.notas}`;
    }
    
    if (pedido.tiene_personalizacion) {
        mensaje += `\n\n⚠️ *Este pedido incluye productos personalizados. Por favor confirmar recepción de los archivos de diseño.*`;
        // ★ NUEVO v5.6: Nota legal en WhatsApp
        if (pedido.legal_aceptada) {
            mensaje += `\n✅ *El comprador aceptó los términos de propiedad intelectual sobre las imágenes proporcionadas.*`;
        }
    }
    
    console.log('📱 Enviando a WhatsApp:', mensaje);
    window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// ==========================================
// ★ v6.0: SISTEMA DE ENVÍOS
// ==========================================

async function loadConfigEnvios(negocioId) {
    if (!negocioId || negocioId === '0') return;
    try {
        const res = await fetch(`${API_URL}/negocio/${negocioId}/config-envios`);
        if (res.ok) {
            const data = await res.json();
            configEnvios = data.data?.config_envios || null;
            console.log('🚚 config_envios cargado:', configEnvios);
            renderEnviosSection();
        }
    } catch (e) {
        console.log('ℹ️ config_envios no disponible:', e.message);
    }
}

/** Encuentra el tier de cantidad correcto en las tarifas */
function getBestTier(ciudadTarifas, qty) {
    if (!ciudadTarifas) return null;
    const strQty = String(qty);
    if (ciudadTarifas[strQty]) return strQty;

    // Buscar tiers con "+" (ej "3+") de mayor a menor
    const plusKeys = Object.keys(ciudadTarifas)
        .filter(k => k.endsWith('+'))
        .sort((a, b) => parseInt(b) - parseInt(a));
    for (const key of plusKeys) {
        if (qty >= parseInt(key)) return key;
    }

    // Fallback al tier más alto disponible
    const allKeys = Object.keys(ciudadTarifas)
        .filter(k => !isNaN(parseInt(k)))
        .sort((a, b) => parseInt(b) - parseInt(a));
    return allKeys[0] || null;
}

/**
 * Calcula opciones de flete para una ciudad + cantidad de carrito.
 * Retorna array [{nombre, precio, dias}] ordenado por precio ASC.
 * Retorna null si ciudad sin tarifa configurada.
 */
function calcularOpciones(ciudad, cantidadTotal) {
    if (!configEnvios?.tarifas || !ciudad) return null;
    const ciudadTarifas = configEnvios.tarifas[ciudad];
    if (!ciudadTarifas) return null;

    const tier = getBestTier(ciudadTarifas, cantidadTotal);
    if (!tier) return null;

    const opciones = [];
    const transportadoras = ciudadTarifas[tier] || {};
    for (const [nombre, datos] of Object.entries(transportadoras)) {
        opciones.push({
            nombre,
            precio: parseFloat(datos.precio) || 0,
            dias: datos.dias || '?'
        });
    }
    return opciones.sort((a, b) => a.precio - b.precio);
}

function getCantidadTotal() {
    return carrito.reduce((s, item) => s + (item.cantidad || 1), 0);
}

function getSubtotal() {
    return carrito.reduce((sum, item) => {
        const pers = getPersonalizacion(item.id);
        const extra = (pers && pers.activa) ? (parseFloat(pers.costo_adicional) || 0) : 0;
        return sum + ((item.precio + extra) * item.cantidad);
    }, 0);
}

/** Actualiza la sección de envíos cuando cambia la ciudad seleccionada */
function actualizarFletes() {
    const ciudad = document.getElementById('ciudad')?.value || '';
    const qty    = getCantidadTotal();
    const subtotal = getSubtotal();
    const contenedor = document.getElementById('enviosCarriers');
    if (!contenedor) return;

    selectedTransportadora = null;
    selectedFletePrice = null;

    // Flete gratis por umbral
    const fleteGratisDesde = configEnvios?.flete_gratis_desde;
    if (fleteGratisDesde && subtotal >= fleteGratisDesde) {
        selectedFletePrice = 0;
        selectedTransportadora = 'gratis';
        contenedor.innerHTML = `
            <div class="envio-gratis-badge">
                🎉 <strong>¡Envío gratis!</strong> Tu pedido supera el mínimo de ${formatPrice(fleteGratisDesde)}
            </div>`;
        renderOrderSummary();
        return;
    }

    if (!ciudad) {
        contenedor.innerHTML = `<p class="envio-hint">Selecciona tu ciudad para ver los precios de envío.</p>`;
        renderOrderSummary();
        return;
    }

    const opciones = calcularOpciones(ciudad, qty);

    if (!opciones || opciones.length === 0) {
        selectedFletePrice = null;
        contenedor.innerHTML = `
            <div class="envio-confirmar">
                💬 <strong>El valor del envío a ${ciudad} lo confirmaremos contigo por WhatsApp</strong>
                <br><small>El vendedor te informará el costo exacto antes de preparar tu pedido.</small>
            </div>`;
        renderOrderSummary();
        return;
    }

    // Preseleccionar el más barato
    const cheapest = opciones[0];
    if (!selectedTransportadora) {
        selectedTransportadora = cheapest.nombre;
        selectedFletePrice = cheapest.precio;
    }

    contenedor.innerHTML = opciones.map((op, i) => {
        const isCheapest = i === 0 && opciones.length > 1;
        const isSelected = op.nombre === selectedTransportadora;
        return `
            <div class="carrier-card ${isSelected ? 'selected' : ''}" onclick="selectTransportadora('${op.nombre}', ${op.precio})">
                <div class="carrier-radio ${isSelected ? 'checked' : ''}"></div>
                <div class="carrier-info">
                    <div class="carrier-name">${op.nombre}</div>
                    <div class="carrier-days">⏱ ${op.dias} días hábiles</div>
                </div>
                <div class="carrier-right">
                    <div class="carrier-price">${formatPrice(op.precio)}</div>
                    ${isCheapest ? '<span class="carrier-badge cheapest">💰 Más económico</span>' : ''}
                </div>
            </div>`;
    }).join('');

    actualizarAdvertenciaTransportadora(opciones);
    renderOrderSummary();
}

function selectTransportadora(nombre, precio) {
    selectedTransportadora = nombre;
    selectedFletePrice = precio;

    // Refrescar cards
    document.querySelectorAll('.carrier-card').forEach(card => {
        const isThis = card.querySelector('.carrier-name')?.textContent === nombre;
        card.classList.toggle('selected', isThis);
        card.querySelector('.carrier-radio')?.classList.toggle('checked', isThis);
    });

    const ciudad  = document.getElementById('ciudad')?.value || '';
    const qty     = getCantidadTotal();
    const opciones = calcularOpciones(ciudad, qty) || [];
    actualizarAdvertenciaTransportadora(opciones);
    renderOrderSummary();
}

function actualizarAdvertenciaTransportadora(opciones) {
    const contenedor = document.getElementById('enviosAdvertencia');
    if (!contenedor || opciones.length < 2) { if(contenedor) contenedor.innerHTML = ''; return; }

    const cheapest = opciones[0];
    if (selectedTransportadora && selectedTransportadora !== cheapest.nombre) {
        const selected = opciones.find(o => o.nombre === selectedTransportadora);
        if (selected) {
            const diff = selected.precio - cheapest.precio;
            contenedor.innerHTML = `
                <div class="carrier-warning">
                    ⚠️ Estás pagando <strong>${formatPrice(diff)} más</strong> de lo necesario.
                    Por <strong>${cheapest.nombre}</strong> pagarías solo <strong>${formatPrice(cheapest.precio)}</strong>.
                </div>`;
            return;
        }
    }
    contenedor.innerHTML = '';
}

function selectDeliveryMode(mode) {
    selectedDeliveryMode = mode;
    selectedTransportadora = null;
    selectedFletePrice = mode === 'pickup' ? 0 : null;

    document.querySelectorAll('.delivery-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === mode);
    });

    const domPanel    = document.getElementById('enviosDomicilio');
    const pickupPanel = document.getElementById('enviosPickup');
    if (domPanel)    domPanel.style.display   = mode === 'domicilio' ? 'block' : 'none';
    if (pickupPanel) pickupPanel.style.display = mode === 'pickup'   ? 'block' : 'none';

    // Dirección — skip si pickup
    const addrSection = document.getElementById('newAddressForm');
    if (addrSection) addrSection.style.opacity = mode === 'pickup' ? '0.4' : '1';

    if (mode === 'domicilio') actualizarFletes();
    else renderOrderSummary();
}

function renderEnviosSection() {
    const sec = document.getElementById('enviosSection');
    if (!sec) return;

    const pickup = configEnvios?.pickup || {};
    const hasPickup = pickup.activo && pickup.direccion;

    const mapsLink = pickup.coordenadas
        ? `https://www.google.com/maps/dir/?api=1&destination=${pickup.coordenadas.lat},${pickup.coordenadas.lng}`
        : pickup.direccion
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.direccion)}`
            : null;

    const tabPickup = hasPickup ? `
        <button class="delivery-tab" data-mode="pickup" onclick="selectDeliveryMode('pickup')">
            🏪 Recoger en tienda
        </button>` : '';

    const pickupPanel = hasPickup ? `
        <div id="enviosPickup" style="display:none">
            <div class="pickup-card">
                <div class="pickup-icon">🏪</div>
                <div class="pickup-info">
                    <div class="pickup-label">Retira tu pedido en:</div>
                    <div class="pickup-address">${pickup.direccion}</div>
                    ${pickup.instrucciones ? `<div class="pickup-instructions">📝 ${pickup.instrucciones}</div>` : ''}
                </div>
            </div>
            ${mapsLink ? `
                <a href="${mapsLink}" target="_blank" rel="noopener" class="pickup-maps-btn">
                    🗺️ Ver ruta en Google Maps
                </a>` : ''}
            <p class="pickup-hint">💬 El vendedor te avisará cuando tu pedido esté listo.</p>
        </div>` : '';

    sec.style.display = 'block';
    sec.innerHTML = `
        <div class="card-header">
            <i class="fas fa-truck"></i>
            <h2>Forma de entrega</h2>
            <span class="step-number">2.5</span>
        </div>
        <div class="card-body">
            <div class="delivery-tabs">
                <button class="delivery-tab active" data-mode="domicilio" onclick="selectDeliveryMode('domicilio')">
                    🚚 A domicilio
                </button>
                ${tabPickup}
            </div>

            <div id="enviosDomicilio">
                <div id="enviosCarriers">
                    <p class="envio-hint">Selecciona tu ciudad para ver los precios de envío.</p>
                </div>
                <div id="enviosAdvertencia"></div>
            </div>

            ${pickupPanel}
        </div>`;

    injectEnviosStyles();
    actualizarFletes();
}

function injectEnviosStyles() {
    if (document.getElementById('checkoutEnviosStyles')) return;
    const style = document.createElement('style');
    style.id = 'checkoutEnviosStyles';
    style.textContent = `
        /* ─── Delivery tabs ─── */
        .delivery-tabs { display:flex; gap:8px; margin-bottom:16px; }
        .delivery-tab {
            flex:1; padding:10px 0; border:2px solid #e2e8f0; border-radius:10px;
            background:#fff; cursor:pointer; font-size:0.9rem; font-weight:600; color:#475569;
            transition:all 0.2s;
        }
        .delivery-tab:hover { border-color:var(--primary,#3b82f6); }
        .delivery-tab.active {
            border-color:var(--primary,#3b82f6); background:#eff6ff; color:var(--primary,#3b82f6);
        }

        /* ─── Carrier cards ─── */
        .carrier-card {
            display:flex; align-items:center; gap:12px; padding:12px 14px;
            border:2px solid #e2e8f0; border-radius:10px; margin-bottom:8px;
            cursor:pointer; transition:all 0.2s;
        }
        .carrier-card:hover { border-color:var(--primary,#3b82f6); }
        .carrier-card.selected { border-color:var(--primary,#3b82f6); background:#eff6ff; }
        .carrier-radio {
            width:20px; height:20px; border:2px solid #cbd5e1; border-radius:50%;
            flex-shrink:0; position:relative;
        }
        .carrier-radio.checked { border-color:var(--primary,#3b82f6); }
        .carrier-radio.checked::after {
            content:''; position:absolute; top:50%; left:50%;
            transform:translate(-50%,-50%); width:10px; height:10px;
            background:var(--primary,#3b82f6); border-radius:50%;
        }
        .carrier-info { flex:1; }
        .carrier-name { font-weight:600; font-size:0.9rem; color:#1e293b; }
        .carrier-days { font-size:0.75rem; color:#64748b; margin-top:2px; }
        .carrier-right { text-align:right; }
        .carrier-price { font-weight:700; font-size:1rem; color:#0f172a; }
        .carrier-badge { display:block; font-size:0.7rem; margin-top:3px; }
        .carrier-badge.cheapest { color:#16a34a; }

        /* ─── Carrier warning ─── */
        .carrier-warning {
            background:#fffbeb; border:1.5px solid #fcd34d; border-radius:8px;
            padding:10px 14px; font-size:0.82rem; color:#78350f; margin-top:8px;
        }

        /* ─── Flete gratis ─── */
        .envio-gratis-badge {
            background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px;
            padding:12px 14px; font-size:0.9rem; color:#166534;
        }

        /* ─── A confirmar ─── */
        .envio-confirmar {
            background:#eff6ff; border:1.5px solid #93c5fd; border-radius:8px;
            padding:12px 14px; font-size:0.85rem; color:#1e40af; line-height:1.5;
        }
        .envio-hint { color:#94a3b8; font-size:0.85rem; margin:4px 0; }

        /* ─── Pickup ─── */
        .pickup-card {
            display:flex; gap:12px; align-items:flex-start; padding:14px;
            background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; margin-bottom:12px;
        }
        .pickup-icon { font-size:2rem; }
        .pickup-label { font-size:0.75rem; color:#64748b; margin-bottom:2px; }
        .pickup-address { font-weight:600; font-size:0.95rem; color:#1e293b; }
        .pickup-instructions { font-size:0.8rem; color:#64748b; margin-top:4px; }
        .pickup-maps-btn {
            display:flex; align-items:center; justify-content:center; gap:8px;
            width:100%; padding:10px; border-radius:8px;
            background:#1a73e8; color:#fff; font-weight:600; font-size:0.9rem;
            text-decoration:none; margin-bottom:10px;
        }
        .pickup-maps-btn:hover { background:#1558b0; }
        .pickup-hint { font-size:0.8rem; color:#64748b; text-align:center; }
    `;
    document.head.appendChild(style);
}

// ==========================================
// ★ v8.0: WOMPI — PAGOS EN LÍNEA
// ==========================================

/**
 * Carga la config pública de Wompi del negocio.
 * Si está activo, inyecta el botón "Pagar en línea" en el resumen.
 */
async function loadWompiConfig(negocioId) {
    try {
        const res = await fetch(`${API_URL}/negocio/${negocioId}/wompi/config-pub`);
        if (!res.ok) return;
        const cfg = await res.json();
        wompiConfig = cfg;
        renderWompiButton();
    } catch (e) {
        console.warn('⚠️ Wompi config no disponible:', e.message);
        wompiConfig = null;
    }
}

/**
 * Muestra u oculta el botón de pago Wompi en el resumen del pedido.
 * Lo inserta dinámicamente después del botón de WhatsApp.
 */
function renderWompiButton() {
    const existing = document.getElementById('wompiPayBtn');
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    if (!wompiConfig || !wompiConfig.activo || !wompiConfig.public_key) {
        // Wompi no activo — remover si existía
        if (existing) existing.remove();
        return;
    }

    if (existing) return; // ya insertado

    // Contenedor separador
    const divider = document.createElement('div');
    divider.id = 'wompiDivider';
    divider.style.cssText = 'display:flex;align-items:center;gap:8px;margin:12px 0;';
    divider.innerHTML = `
        <span style="flex:1;height:1px;background:#e2e8f0;"></span>
        <span style="font-size:0.75rem;color:#94a3b8;white-space:nowrap;">o paga en línea</span>
        <span style="flex:1;height:1px;background:#e2e8f0;"></span>
    `;

    // Botón Wompi
    const btn = document.createElement('button');
    btn.id = 'wompiPayBtn';
    btn.type = 'button';
    btn.onclick = () => pagarConWompi();
    btn.style.cssText = `
        width:100%;padding:15px 24px;
        background:linear-gradient(135deg,#7B3FE4 0%,#4F46E5 100%);
        color:white;border:none;border-radius:12px;
        font-size:1rem;font-weight:700;cursor:pointer;
        display:flex;align-items:center;justify-content:center;gap:10px;
        transition:all .3s;font-family:inherit;
    `;
    btn.innerHTML = `
        <i class="fas fa-credit-card"></i>
        <span>Pagar en línea</span>
        <span style="font-size:0.75rem;opacity:.8;margin-left:2px;">(Tarjeta · PSE · Nequi)</span>
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-2px)'; btn.style.opacity = '.92'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; btn.style.opacity = '1'; });

    // Insertar después del botón WhatsApp
    submitBtn.parentNode.insertBefore(divider, submitBtn.nextSibling);
    submitBtn.parentNode.insertBefore(btn, divider.nextSibling);

    console.log('✅ Botón Wompi insertado');
}

/**
 * Carga el script del widget Wompi (solo una vez).
 */
function cargarScriptWompi() {
    return new Promise((resolve, reject) => {
        if (_wompiScriptLoaded || window.WidgetCheckout) {
            _wompiScriptLoaded = true;
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://checkout.wompi.co/widget.js';
        s.async = true;
        s.onload  = () => { _wompiScriptLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('No se pudo cargar el widget de Wompi'));
        document.head.appendChild(s);
    });
}

/**
 * Flujo completo de pago con Wompi:
 *  1. Valida el formulario
 *  2. Llama backend → recibe referencia + firma
 *  3. Carga script Wompi y abre el modal
 */
async function pagarConWompi() {
    if (!validateForm()) return;

    const btn = document.getElementById('wompiPayBtn');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Preparando pago...'; }

    try {
        // Calcular total igual que submitOrder
        const subtotal  = getSubtotal();
        const costoEnvio = (selectedDeliveryMode === 'pickup' || selectedFletePrice === 0)
            ? 0 : (selectedFletePrice || 0);
        const descuento = cuponAplicado ? cuponAplicado.descuento : 0;
        const total = Math.max(0, subtotal - descuento + costoEnvio);

        if (total <= 0) {
            showToast('El total debe ser mayor a cero', 'error');
            return;
        }

        // URL de retorno tras el pago
        const slug = tiendaConfig.slug;
        const redirectUrl = `${location.origin}/tienda/pago-exitoso.html?slug=${slug}`;

        // Pedir sesión al backend
        const sesRes = await fetch(`${API_URL}/negocio/${tiendaConfig.negocio_id}/wompi/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total, redirect_url: redirectUrl })
        });
        const sesData = await sesRes.json();
        if (!sesRes.ok) throw new Error(sesData.error || 'Error creando sesión Wompi');

        // Cargar widget
        await cargarScriptWompi();

        // Abrir modal Wompi
        const checkout = new window.WidgetCheckout({
            currency:       sesData.currency,
            amountInCents:  sesData.amount_in_cents,
            reference:      sesData.reference,
            publicKey:      sesData.public_key,
            redirectUrl:    sesData.redirect_url,
            signature: {
                integrity: sesData.signature
            }
        });

        checkout.open(async function(result) {
            const tx = result.transaction;
            if (!tx) return;

            if (tx.status === 'APPROVED') {
                showToast('✅ Pago aprobado. Generando pedido...', 'success');
                // Crear el pedido con método de pago "wompi" y referencia
                document.getElementById('submitBtn').dataset.wompiRef = sesData.reference;
                document.getElementById('submitBtn').dataset.wompiStatus = tx.status;
                await submitOrder('wompi', sesData.reference);
            } else if (tx.status === 'DECLINED') {
                showToast('❌ Pago rechazado. Intenta con otro medio.', 'error');
            } else {
                showToast(`Estado del pago: ${tx.status}`, 'error');
            }
        });

    } catch (e) {
        console.error('❌ Error Wompi:', e);
        showToast(e.message || 'Error iniciando el pago', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <i class="fas fa-credit-card"></i>
                <span>Pagar en línea</span>
                <span style="font-size:0.75rem;opacity:.8;margin-left:2px;">(Tarjeta · PSE · Nequi)</span>
            `;
        }
    }
}

// ==========================================
// ★ v7.0: CUPONES DE DESCUENTO
// ==========================================

function toggleCuponInput() {
    const wrap = document.getElementById('cuponInputWrap');
    const chevron = document.getElementById('cuponChevron');
    if (!wrap) return;
    const isOpen = wrap.classList.contains('open');
    wrap.classList.toggle('open', !isOpen);
    if (chevron) chevron.className = isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

async function aplicarCupon() {
    const input = document.getElementById('cuponCodigo');
    const btn   = document.getElementById('cuponBtn');
    const msg   = document.getElementById('cuponMsg');
    if (!input || !msg) return;

    const codigo = input.value.trim().toUpperCase();
    if (!codigo) {
        _cuponMsg(msg, '⚠️ Escribe un código de cupón', 'err');
        return;
    }

    if (!tiendaConfig.negocio_id) {
        _cuponMsg(msg, '⚠️ Tienda no cargada', 'err');
        return;
    }

    const subtotal = getSubtotal();
    if (btn) btn.disabled = true;
    if (btn) btn.textContent = '...';
    _cuponMsg(msg, '', '');

    try {
        const res = await fetch(`${API_URL}/cupones/validar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                negocio_id: tiendaConfig.negocio_id,
                codigo,
                subtotal
            })
        });
        const data = await res.json();

        if (data.success) {
            cuponAplicado = {
                codigo: data.cupon.codigo,
                descuento: data.descuento,
                tipo: data.cupon.tipo,
                valor: data.cupon.valor,
                descripcion: data.cupon.descripcion || ''
            };

            const desc = data.cupon.tipo === 'porcentaje'
                ? `${data.cupon.valor}% de descuento`
                : `${formatPrice(data.cupon.valor)} de descuento`;

            _cuponMsg(msg, `✅ Cupón aplicado — ${desc}`, 'ok');
            input.disabled = true;
            if (btn) { btn.textContent = 'Quitar'; btn.disabled = false; btn.onclick = limpiarCupon; }
            renderOrderSummary();
        } else {
            _cuponMsg(msg, `❌ ${data.error || 'Cupón no válido'}`, 'err');
            if (btn) { btn.textContent = 'Aplicar'; btn.disabled = false; }
        }
    } catch (e) {
        console.error('Error validando cupón:', e);
        _cuponMsg(msg, '❌ Error de conexión', 'err');
        if (btn) { btn.textContent = 'Aplicar'; btn.disabled = false; }
    }
}

function limpiarCupon() {
    cuponAplicado = null;
    const input = document.getElementById('cuponCodigo');
    const btn   = document.getElementById('cuponBtn');
    const msg   = document.getElementById('cuponMsg');
    if (input) { input.value = ''; input.disabled = false; }
    if (btn)   { btn.textContent = 'Aplicar'; btn.disabled = false; btn.onclick = aplicarCupon; }
    if (msg)   { msg.textContent = ''; msg.className = ''; }
    renderOrderSummary();
}

function _cuponMsg(el, text, cls) {
    if (!el) return;
    el.textContent = text;
    el.className = cls;
}

// ==========================================
// UTILIDADES
// ==========================================
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.log('Toast:', message, type);
        return;
    }
    
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// FUNCIONES GLOBALES
// ==========================================
window.selectAuthOption = selectAuthOption;
window.handleLogin = handleLogin;
window.togglePasswordField = togglePasswordField;
window.selectAddressType = selectAddressType;
window.loadCities = loadCities;
window.selectPaymentMethod = selectPaymentMethod;
window.submitOrder = submitOrder;
window.handleCheckoutLegalChange = handleCheckoutLegalChange;
window.toggleCheckoutLegalDetail = toggleCheckoutLegalDetail;
// ★ v6.0
window.selectDeliveryMode    = selectDeliveryMode;
window.selectTransportadora  = selectTransportadora;
window.actualizarFletes      = actualizarFletes;
// ★ v7.0: cupones
window.toggleCuponInput      = toggleCuponInput;
window.aplicarCupon          = aplicarCupon;
window.limpiarCupon          = limpiarCupon;
// ★ v8.0: wompi
window.pagarConWompi         = pagarConWompi;
window.loadWompiConfig       = loadWompiConfig;

// ==========================================
// ★ v9.0: CARRITO ABANDONADO
// ==========================================

/**
 * Envía snapshot del carrito al backend cuando el comprador llena su teléfono
 * pero podría no terminar la compra. Fire-and-forget: nunca bloquea el checkout.
 */
async function registrarCarritoAbandonado() {
    try {
        const nid = tiendaConfig && (tiendaConfig.negocio_id || tiendaConfig.id);
        if (!nid || !carrito || carrito.length === 0) return;

        const telefono = (document.getElementById('telefono')?.value || '').trim();
        if (!telefono || telefono.replace(/\D/g,'').length < 7) return;

        const nombre = (document.getElementById('nombre')?.value || '').trim() || null;
        const correo = (document.getElementById('correo')?.value  || '').trim() || null;

        const total = carrito.reduce((s, item) =>
            s + (parseFloat(item.precio || 0) * (item.cantidad || 1)), 0);

        const productos = carrito.map(item => ({
            id:       item.id,
            nombre:   item.nombre || item.name || 'Producto',
            precio:   parseFloat(item.precio || 0),
            cantidad: item.cantidad || 1,
            imagen_url: item.imagen_url || item.imagen || null,
        }));

        await fetch(`${API_URL}/negocio/${nid}/carrito/guardar`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ telefono, nombre, correo, productos, total }),
        });
    } catch (_) { /* silencioso — nunca bloquear el checkout */ }
}

/**
 * Marca el carrito como recuperado después de un pedido exitoso.
 * Llamado internamente por submitOrder() al completarse.
 */
async function marcarCarritoRecuperado(negocioId, telefono, pedidoId) {
    try {
        if (!negocioId || !telefono) return;
        await fetch(`${API_URL}/negocio/${negocioId}/carrito/recuperado`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ telefono, pedido_id: pedidoId }),
        });
    } catch (_) { /* silencioso */ }
}

// Escuchar blur del campo teléfono con event delegation (capture phase)
// para no depender del orden de inicialización del DOM.
document.addEventListener('blur', function(e) {
    if (e.target && e.target.id === 'telefono') {
        registrarCarritoAbandonado();
    }
}, true);

window.registrarCarritoAbandonado = registrarCarritoAbandonado;
window.marcarCarritoRecuperado    = marcarCarritoRecuperado;

console.log('✅ Checkout.js v9.0 Carritos Abandonados cargado ✅');