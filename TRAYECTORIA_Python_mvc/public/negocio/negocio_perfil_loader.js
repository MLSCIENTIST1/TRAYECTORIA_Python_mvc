/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BIZSCORE - PERFIL PÚBLICO DE NEGOCIO v2.6
 * Loader JS - Conecta con API y renderiza datos dinámicos
 * Soporta: horarios, redes sociales, video portafolio, ciudad, email, sitio web
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const CONFIG = {
    API_BASE_URL: 'https://trayectoria-backend.onrender.com',
    ENDPOINTS: {
        PERFIL: '/api/negocio/perfil-publico'
    },
    // Mapeo de días para horarios
    DAYS_MAP: {
        'lunes': 'Lunes',
        'martes': 'Martes',
        'miercoles': 'Miércoles',
        'jueves': 'Jueves',
        'viernes': 'Viernes',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
    },
    DAYS_ORDER: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    DAYS_INDEX: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
};

// =====================================================
// PERFIL MODE DETECTOR
// =====================================================

/**
 * Detecta el modo de visualización del perfil
 * @returns {Object} { isEditMode, isOwner, isInIframe, slug }
 */
function detectProfileMode() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const mode = {
        slug: urlParams.get('slug'),
        isEditMode: urlParams.get('mode') === 'edit',
        isOwner: urlParams.get('owner') === 'true',
        isInIframe: window.self !== window.top,
        canEdit: false
    };
    
    // Solo puede editar si está en modo edit + es owner + está en iframe
    mode.canEdit = mode.isEditMode && mode.isOwner && mode.isInIframe;
    
    console.log('🔍 Profile Mode:', mode);
    
    return mode;
}

/**
 * Configura la UI según el modo de visualización
 */
function setupProfileUI(mode) {
    const editControls = document.getElementById('editControls');
    const editToolbar = document.getElementById('editToolbar');
    const publicBanner = document.getElementById('publicBanner');
    const dragDropHints = document.querySelectorAll('.drag-drop-hint');
    
    if (mode.canEdit) {
        // MODO EDICIÓN - Dueño viendo su perfil
        document.body.classList.add('edit-mode');
        document.body.classList.add('owner-view');
        
        if (editControls) editControls.style.display = 'flex';
        if (editToolbar) editToolbar.style.display = 'flex';
        if (publicBanner) publicBanner.style.display = 'none';
        
        dragDropHints.forEach(el => el.style.display = 'block');
        
        enableDragAndDrop();
        showSaveButton();
        
        console.log('✏️ Modo EDICIÓN activado');
        
    } else {
        // MODO VISUALIZACIÓN - Visitante externo
        document.body.classList.add('view-mode');
        document.body.classList.add('public-view');
        
        if (editControls) editControls.style.display = 'none';
        if (editToolbar) editToolbar.style.display = 'none';
        if (publicBanner) publicBanner.style.display = 'block';
        
        dragDropHints.forEach(el => el.style.display = 'none');
        
        disableEditInteractions();
        
        console.log('👁️ Modo VISUALIZACIÓN activado');
    }
    
    if (mode.isInIframe) {
        document.body.classList.add('in-iframe');
        const backToHome = document.getElementById('backToHome');
        if (backToHome) backToHome.style.display = 'none';
    }
}

function enableDragAndDrop() {
    const sections = document.querySelectorAll('.profile-section');
    
    sections.forEach(section => {
        section.classList.add('draggable');
        section.setAttribute('draggable', 'true');
        
        const handle = section.querySelector('.drag-handle');
        if (handle) handle.style.display = 'flex';
        
        const configBtn = section.querySelector('.section-config-btn');
        if (configBtn) configBtn.style.display = 'flex';
    });
    
    console.log('🎯 Drag & Drop habilitado para', sections.length, 'secciones');
}

function disableEditInteractions() {
    document.querySelectorAll('[draggable]').forEach(el => {
        el.removeAttribute('draggable');
    });
    
    document.querySelectorAll('.drag-handle, .section-config-btn, .edit-btn, .edit-only').forEach(el => {
        el.style.display = 'none';
    });
}

function showSaveButton() {
    let saveBtn = document.getElementById('floatingSaveBtn');
    
    if (!saveBtn) {
        saveBtn = document.createElement('button');
        saveBtn.id = 'floatingSaveBtn';
        saveBtn.className = 'floating-save-btn';
        saveBtn.innerHTML = `
            <i class="bi bi-check-lg"></i>
            <span>Guardar Cambios</span>
        `;
        saveBtn.onclick = saveProfileChanges;
        document.body.appendChild(saveBtn);
    }
    
    saveBtn.style.display = 'none';
}

function markUnsavedChanges() {
    const saveBtn = document.getElementById('floatingSaveBtn');
    if (saveBtn) {
        saveBtn.style.display = 'flex';
        saveBtn.classList.add('has-changes');
    }
    
    window.onbeforeunload = function() {
        return '¿Seguro que quieres salir? Tienes cambios sin guardar.';
    };
}

async function saveProfileChanges() {
    const saveBtn = document.getElementById('floatingSaveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
        saveBtn.disabled = true;
    }
    
    try {
        const profileConfig = collectProfileConfig();
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/negocio/perfil-config/${slug}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ config_perfil: profileConfig })
        });
        
        if (!response.ok) throw new Error('Error al guardar');
        
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> ¡Guardado!';
            saveBtn.classList.remove('has-changes');
            saveBtn.classList.add('saved');
            
            setTimeout(() => {
                saveBtn.style.display = 'none';
                saveBtn.innerHTML = '<i class="bi bi-check-lg"></i><span>Guardar Cambios</span>';
                saveBtn.classList.remove('saved');
                saveBtn.disabled = false;
            }, 2000);
        }
        
        window.onbeforeunload = null;
        showToast('Perfil guardado correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando perfil:', error);
        
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-x-lg"></i> Error';
            saveBtn.disabled = false;
            
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="bi bi-check-lg"></i><span>Guardar Cambios</span>';
            }, 2000);
        }
        
        showToast('Error al guardar el perfil', 'error');
    }
}

function collectProfileConfig() {
    const sections = document.querySelectorAll('.profile-section');
    const config = {
        tema: document.body.dataset.theme || 'dark',
        secciones: []
    };
    
    sections.forEach((section, index) => {
        config.secciones.push({
            id: section.id,
            tipo: section.dataset.sectionType,
            orden: index,
            visible: !section.classList.contains('hidden'),
            config: JSON.parse(section.dataset.config || '{}')
        });
    });
    
    return config;
}

function notifyParent(action, data = {}) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ action, ...data }, '*');
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS ADICIONALES PARA MODOS
// ═══════════════════════════════════════════════════════════════════════════════
const profileModeStyles = `
/* Modo edición */
body.edit-mode .profile-section {
    position: relative;
    transition: all 0.3s ease;
}

body.edit-mode .profile-section:hover {
    outline: 2px dashed rgba(168, 85, 247, 0.5);
    outline-offset: 4px;
}

body.edit-mode .profile-section.dragging {
    opacity: 0.5;
    transform: scale(0.98);
}

body.edit-mode .drag-handle {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 32px;
    height: 32px;
    background: rgba(168, 85, 247, 0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    opacity: 0;
    transition: opacity 0.2s;
}

body.edit-mode .profile-section:hover .drag-handle {
    opacity: 1;
}

body.edit-mode .drag-handle:active {
    cursor: grabbing;
}

body.edit-mode .section-config-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: rgba(168, 85, 247, 0.2);
    border: none;
    border-radius: 8px;
    color: #a855f7;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

body.edit-mode .profile-section:hover .section-config-btn {
    opacity: 1;
}

/* Botón flotante de guardar */
.floating-save-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
}

.floating-save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5);
}

.floating-save-btn.has-changes {
    animation: pulse-save 2s infinite;
}

.floating-save-btn.saved {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.floating-save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

@keyframes pulse-save {
    0%, 100% { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); }
    50% { box-shadow: 0 4px 30px rgba(16, 185, 129, 0.7); }
}

.floating-save-btn .spin {
    animation: spin 1s linear infinite;
}

/* Modo visualización pública */
body.view-mode .edit-only {
    display: none !important;
}

/* Ajustes para iframe */
body.in-iframe .back-to-home,
body.in-iframe .external-nav {
    display: none;
}

/* Banner de vista pública */
#publicBanner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    padding: 10px 16px;
    text-align: center;
    font-size: 0.85rem;
    z-index: 1000;
    display: none;
}

#publicBanner a {
    color: #fbbf24;
    text-decoration: none;
    font-weight: 600;
    margin-left: 8px;
}

#publicBanner a:hover {
    text-decoration: underline;
}

/* Drag & drop hints */
.drag-drop-hint {
    display: none;
    padding: 12px;
    border: 2px dashed rgba(168, 85, 247, 0.3);
    border-radius: 12px;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    margin: 8px 0;
}

body.edit-mode .drag-drop-hint {
    display: block;
}

/* Video portafolio destacado */
.video-card.portfolio-featured {
    border: 2px solid rgba(168, 85, 247, 0.4);
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
}

.video-card.portfolio-featured:hover {
    border-color: var(--primary);
    box-shadow: 0 12px 40px rgba(168, 85, 247, 0.2);
}

.portfolio-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: 2;
}
`;

function injectModeStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'profile-mode-styles';
    styleEl.textContent = profileModeStyles;
    document.head.appendChild(styleEl);
}

function initProfileMode() {
    injectModeStyles();
    const mode = detectProfileMode();
    setupProfileUI(mode);
    return mode;
}

// Exportar para uso global
window.ProfileMode = {
    detect: detectProfileMode,
    setup: setupProfileUI,
    init: initProfileMode,
    markUnsavedChanges,
    saveChanges: saveProfileChanges,
    notifyParent
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════
let PROFILE_DATA = null;
let VIDEOS_DATA = [];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════
function obtenerSlugDeURL() {
    const path = window.location.pathname;
    
    // Método 1: URL limpia /n/{slug}
    const matchPath = path.match(/\/n\/([^\/]+)/);
    if (matchPath) return matchPath[1];
    
    // Método 2: Query param ?slug={slug}
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('slug');
    if (slugParam) return slugParam;
    
    return null;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function formatTimeAgo(minutes) {
    if (!minutes) return '---';
    if (minutes < 60) return `~${minutes}min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `~${hours}h`;
    const days = Math.round(hours / 24);
    return `~${days}d`;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

/**
 * Formatea hora de 24h a 12h AM/PM
 */
function formatTime12h(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

/**
 * Obtiene el día actual en formato key (lunes, martes, etc.)
 */
function getCurrentDayKey() {
    return CONFIG.DAYS_INDEX[new Date().getDay()];
}

/**
 * Verifica si el negocio está abierto ahora
 */
function isBusinessOpenNow(horario) {
    if (!horario) return false;
    
    const currentDay = getCurrentDayKey();
    const daySchedule = horario[currentDay];
    
    if (!daySchedule) return false;
    
    // ✅ Soportar ambos formatos
    const estaAbierto = daySchedule.abierto === true || 
        (daySchedule.cerrado === false && (daySchedule.abre || daySchedule.apertura)) ||
        (!daySchedule.hasOwnProperty('abierto') && !daySchedule.cerrado && (daySchedule.abre || daySchedule.apertura));
    
    if (!estaAbierto) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const horaAbre = daySchedule.apertura || daySchedule.abre || '09:00';
    const horaCierra = daySchedule.cierre || daySchedule.cierra || '18:00';
    
    const [openH, openM] = horaAbre.split(':').map(Number);
    const [closeH, closeM] = horaCierra.split(':').map(Number);
    
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Extrae ID de video de YouTube
 */
function extractYouTubeId(url) {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Extrae ID de video de Vimeo
 */
function extractVimeoId(url) {
    if (!url) return null;
    const regex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Genera URL de thumbnail para video
 */
function getVideoThumbnail(url) {
    const ytId = extractYouTubeId(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    
    const vimeoId = extractVimeoId(url);
    if (vimeoId) return `https://vumbnail.com/${vimeoId}.jpg`;
    
    return null;
}
/**
 * Genera thumbnail desde URL de Cloudinary video
 */
function getCloudinaryThumbnail(url) {
    if (!url) return null;
    if (!url.includes('cloudinary.com')) return null;
    // Reemplazar extensión de video por .jpg
    return url.replace(/\.(mp4|webm|mov|avi|mkv)$/i, '.jpg');
}

/**
 * Genera URL de embed para video
 */
function getVideoEmbedUrl(url) {
    const ytId = extractYouTubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    
    const vimeoId = extractVimeoId(url);
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
    
    return url;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING / ERROR
// ═══════════════════════════════════════════════════════════════════════════════
function mostrarLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function ocultarLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
}

function mostrarError(mensaje) {
    ocultarLoading();
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="bi bi-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px; display: block;"></i>
                <h2 style="color: #fff; margin-bottom: 12px;">Negocio no encontrado</h2>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 24px;">${mensaje}</p>
                <a href="/" style="display: inline-block; padding: 12px 24px; background: var(--primary); color: white; border-radius: 12px; text-decoration: none;">
                    Volver al inicio
                </a>
            </div>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH DATA FROM API
// ═══════════════════════════════════════════════════════════════════════════════
async function cargarPerfilNegocio(slug) {
    try {
        const url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.PERFIL}/${slug}`;
        console.log('🔄 Cargando perfil desde:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('El negocio solicitado no existe o no está disponible.');
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Datos recibidos:', result);
        
        if (result.success && result.data) {
            const data = result.data;
            
            // Guardar ID del negocio globalmente
            window.NEGOCIO_ID = data.negocio?.id || null;
            
            // Mostrar botón de subir video si es dueño
            if (window.currentProfileMode?.canEdit && window.NEGOCIO_ID) {
                const btnSubirVideo = document.getElementById('btnSubirVideo');
                if (btnSubirVideo) btnSubirVideo.style.display = 'flex';
            }
            
            return data;
        }
        
        throw new Error(result.error || 'Respuesta inválida del servidor');
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - HEADER
// ═══════════════════════════════════════════════════════════════════════════════
function renderHeader(data) {
    const negocio = data.negocio || data;
    
    // Logo
    const logoEl = document.getElementById('businessLogo');
    if (logoEl) {
        if (negocio.logo_url) {
            logoEl.src = negocio.logo_url;
        } else {
            const nombre = negocio.nombre || 'N';
            logoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=a855f7&color=fff&size=200&bold=true&format=svg`;
        }
        logoEl.alt = `Logo de ${negocio.nombre}`;
    }
    
    // Badge verificado
    const verifiedBadge = document.querySelector('.verified-badge');
    if (verifiedBadge) {
        verifiedBadge.style.display = negocio.verificado ? 'flex' : 'none';
    }
    
    // Nombre
    const nombreEl = document.getElementById('businessName');
    if (nombreEl) nombreEl.textContent = negocio.nombre || 'Sin nombre';
    
    // Categoría
    const categoriaEl = document.getElementById('businessCategory');
    if (categoriaEl) categoriaEl.textContent = negocio.categoria || 'Sin categoría';
    
    // Ubicación - AHORA INCLUYE CIUDAD
    const ubicacionEl = document.getElementById('businessLocation');
    if (ubicacionEl) {
        let locationText = '';
        if (negocio.ciudad) {
            locationText = negocio.ciudad;
            if (negocio.ubicacion && negocio.ubicacion !== negocio.ciudad) {
                locationText += `, ${negocio.ubicacion}`;
            }
        } else {
            locationText = negocio.ubicacion || 'Colombia';
        }
        ubicacionEl.textContent = locationText;
    }
    
    // Año de registro
    const sinceEl = document.getElementById('businessSince');
    if (sinceEl && negocio.fecha_registro) {
        sinceEl.textContent = new Date(negocio.fecha_registro).getFullYear();
    }
    
    // Tiempo de respuesta
    const responseTimeEl = document.getElementById('businessResponseTime');
    if (responseTimeEl) {
        responseTimeEl.textContent = `Responde en ${formatTimeAgo(negocio.tiempo_respuesta_minutos || 60)}`;
    }
    
    // Actualizar meta tags para SEO
    document.title = `${negocio.nombre} | BizScore - tukomercio`;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = `Perfil verificado de ${negocio.nombre} en tukomercio. ${negocio.descripcion || ''}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - SCORE
// ═══════════════════════════════════════════════════════════════════════════════
function renderScore(data) {
    const score = data.score || data;
    const scoreValue = score.valor || score.score || 0;
    
    // Actualizar título según nivel
    const scoreTitleEl = document.querySelector('.score-title');
    if (scoreTitleEl) {
        if (scoreValue >= 90) scoreTitleEl.textContent = 'Reputación Excelente';
        else if (scoreValue >= 70) scoreTitleEl.textContent = 'Reputación Muy Buena';
        else if (scoreValue >= 50) scoreTitleEl.textContent = 'Reputación Buena';
        else scoreTitleEl.textContent = 'En Construcción';
    }
    
    // Actualizar descripción - USA LA DEL NEGOCIO
    const scoreDescEl = document.querySelector('.score-description');
    if (scoreDescEl) {
        const negocio = data.negocio || {};
        scoreDescEl.textContent = negocio.descripcion || score.descripcion || 
            'Este negocio ha demostrado consistencia en calidad, tiempos de entrega y satisfacción del cliente.';
    }
    
    // Nivel/Percentil
    const levelTitleEl = document.querySelector('.score-level-title');
    const levelSubtitleEl = document.querySelector('.score-level-subtitle');
    if (levelTitleEl && score.percentil) {
        levelTitleEl.textContent = `Top ${100 - score.percentil}% en su categoría`;
    }
    if (levelSubtitleEl && score.percentil) {
        levelSubtitleEl.textContent = `Mejor que el ${score.percentil}% de negocios similares`;
    }
    
    // Mini stats
    const contractsEl = document.getElementById('totalContracts');
    if (contractsEl) contractsEl.textContent = formatNumber(score.total_contratos || 0);
    
    const successEl = document.getElementById('successRate');
    if (successEl) successEl.textContent = `${score.tasa_exito || 0}%`;
    
    const repeatEl = document.getElementById('repeatClients');
    if (repeatEl) repeatEl.textContent = formatNumber(score.clientes_recurrentes || 0);
    
    // Animar el score con delay
    setTimeout(() => {
        if (typeof ScoreAnimator !== 'undefined') {
            const animator = new ScoreAnimator(scoreValue);
            animator.animate();
        }
    }, 500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - BADGES
// ═══════════════════════════════════════════════════════════════════════════════
function renderBadges(badges) {
    const grid = document.getElementById('badgesGrid');
    if (!grid || !badges || badges.length === 0) {
        // Mostrar mensaje de sin badges
        if (grid) {
            grid.innerHTML = `
                <div class="badge-card" style="--badge-color: #6b7280; --badge-bg: rgba(107,114,128,0.15); --badge-glow: rgba(107,114,128,0.2); grid-column: span 2;">
                    <div class="badge-icon-wrapper">
                        <div class="badge-icon"><i class="bi bi-award"></i></div>
                    </div>
                    <div class="badge-name">Sin insignias aún</div>
                    <div class="badge-description">Este negocio está trabajando para obtener sus primeras insignias</div>
                </div>
            `;
        }
        return;
    }
    
    grid.innerHTML = '';
    
    badges.forEach((badge, index) => {
        const color = badge.color || '#a855f7';
        const colorRgb = hexToRgb(color);
        const bgColor = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.15)`;
        const glowColor = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.2)`;
        
        const nivel = badge.nivel || 1;
        const stars = Array(4).fill(0).map((_, i) => 
            `<i class="bi bi-star${i < nivel ? '-fill' : ''}"></i>`
        ).join('');
        
        const card = document.createElement('div');
        card.className = `badge-card fade-in-up ${badge.especial ? 'special' : ''}`;
        card.style.cssText = `--badge-color: ${color}; --badge-bg: ${bgColor}; --badge-glow: ${glowColor}; animation-delay: ${0.1 * index}s;`;
        
        card.innerHTML = `
            <div class="badge-icon-wrapper">
                <div class="badge-shine"></div>
                <div class="badge-icon">
                    <i class="bi ${badge.icono || 'bi-award-fill'}"></i>
                </div>
            </div>
            <div class="badge-name">${badge.nombre || 'Badge'}</div>
            <div class="badge-description">${badge.descripcion || ''}</div>
            <div class="badge-level">
                ${stars}
                Nivel ${nivel}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - STATS
// ═══════════════════════════════════════════════════════════════════════════════
function renderStats(data) {
    const stats = data.estadisticas || data.stats || {};
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    const statsConfig = [
        { key: 'cumplimiento', icon: 'bi-check-circle-fill', label: 'Cumplimiento', unit: '%', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        { key: 'tiempo_promedio', icon: 'bi-clock-history', label: 'Tiempo Promedio', unit: 'días', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
        { key: 'disputas', icon: 'bi-shield-fill-check', label: 'Disputas', unit: '', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
        { key: 'recomendacion', icon: 'bi-hand-thumbs-up-fill', label: 'Lo Recomiendan', unit: '%', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    ];
    
    statsGrid.innerHTML = '';
    
    statsConfig.forEach(config => {
        const valor = stats[config.key];
        const trend = stats[`${config.key}_trend`] || stats.trends?.[config.key];
        
        let trendHTML = '<div class="stat-trend neutral"><i class="bi bi-dash"></i> Sin cambios</div>';
        if (trend) {
            const isUp = trend.direccion === 'up' || trend.valor > 0;
            const isDown = trend.direccion === 'down' || trend.valor < 0;
            
            if (isUp) {
                trendHTML = `<div class="stat-trend up"><i class="bi bi-arrow-up"></i> ${trend.texto || `+${Math.abs(trend.valor)}${trend.unidad || ''}`}</div>`;
            } else if (isDown) {
                trendHTML = `<div class="stat-trend ${config.key === 'tiempo_promedio' ? 'up' : 'down'}"><i class="bi bi-arrow-down"></i> ${trend.texto || `-${Math.abs(trend.valor)}${trend.unidad || ''}`}</div>`;
            }
        }
        
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.cssText = `--stat-color: ${config.color}; --stat-bg: ${config.bg};`;
        
        card.innerHTML = `
            <div class="stat-icon"><i class="bi ${config.icon}"></i></div>
            <div class="stat-value">${valor !== undefined ? valor : 0}${config.unit ? `<span class="stat-unit">${config.unit}</span>` : ''}</div>
            <div class="stat-label">${config.label}</div>
            ${trendHTML}
        `;
        
        statsGrid.appendChild(card);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - ETAPAS/STAGES
// ═══════════════════════════════════════════════════════════════════════════════
function renderStages(data) {
    const etapas = data.etapas || data.stages || [];
    if (!etapas.length) return;
    
    const container = document.getElementById('stagesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const colores = ['#a855f7', '#22d3ee', '#10b981', '#f59e0b'];
    
    etapas.forEach((etapa, index) => {
        const color = colores[index % colores.length];
        const colorRgb = hexToRgb(color);
        const bgColor = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.15)`;
        const score = etapa.score || etapa.valor || 0;
        
        let criteriosHTML = '';
        if (etapa.criterios && etapa.criterios.length > 0) {
            const criteriosItems = etapa.criterios.map(c => `
                <div class="criteria-item">
                    <div class="criteria-icon"><i class="bi ${c.icono || 'bi-check-circle'}"></i></div>
                    <div class="criteria-text">
                        <div class="criteria-name">${c.nombre}</div>
                        <div class="criteria-score">${c.score || c.valor}/100</div>
                    </div>
                </div>
            `).join('');
            
            criteriosHTML = `
                <div class="stage-details">
                    <div class="stage-criteria">${criteriosItems}</div>
                </div>
            `;
        }
        
        const stageEl = document.createElement('div');
        stageEl.className = 'stage-item';
        stageEl.style.cssText = `--stage-color: ${color}; --stage-bg: ${bgColor}; --stage-gradient: linear-gradient(90deg, ${color} 0%, ${color}99 100%);`;
        stageEl.dataset.score = score;
        
        stageEl.innerHTML = `
            <div class="stage-info">
                <div class="stage-number">${index + 1}</div>
                <div class="stage-text">
                    <h4>${etapa.nombre || `Etapa ${index + 1}`}</h4>
                    <p>${etapa.descripcion || ''}</p>
                </div>
            </div>
            <div class="stage-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar" data-width="${score}"></div>
                </div>
                <div class="progress-labels">
                    <span>${etapa.total_calificaciones || 0} calificaciones</span>
                    <span>${score}%</span>
                </div>
            </div>
            <div class="stage-score">
                <div class="stage-score-value">${score}</div>
                <div class="stage-score-max">/ 100</div>
            </div>
            ${criteriosHTML}
        `;
        
        container.appendChild(stageEl);
    });
    
    calculateAverageStageScore(etapas);
}

function calculateAverageStageScore(etapas) {
    if (!etapas || !etapas.length) return 0;
    
    let total = 0;
    let count = 0;
    
    etapas.forEach(etapa => {
        const score = etapa.score || etapa.valor || 0;
        if (score > 0) { total += score; count++; }
    });
    
    const average = count > 0 ? Math.round(total / count) : 0;
    
    const avgElement = document.getElementById('avgStageScore');
    if (avgElement) {
        const duration = 1500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            avgElement.textContent = Math.round(average * easeOut);
            
            if (progress < 1) requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    return average;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - VIDEO PORTAFOLIO (NUEVO v2.6)
// ═══════════════════════════════════════════════════════════════════════════════
function renderVideoPortafolio(data) {
    const negocio = data.negocio || data;
    const videoUrl = negocio.video_portafolio;
    
    if (!videoUrl) return;
    
    const grid = document.getElementById('videosGrid');
    if (!grid) return;
    
    const thumbnail = getVideoThumbnail(videoUrl);
    const embedUrl = getVideoEmbedUrl(videoUrl);
    
    // Crear card del video portafolio (destacado)
    const card = document.createElement('div');
    card.className = 'video-card featured portfolio-featured';
    card.dataset.videoId = 'portfolio';
    card.dataset.category = 'destacados';
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${thumbnail || ''}" 
                 alt="Video Portafolio de ${negocio.nombre}"
                 onerror="this.onerror=null;this.style.background='#1a1a2e';this.alt='Video'">
            <div class="video-play-btn">
                <i class="bi bi-play-fill"></i>
            </div>
            <span class="portfolio-badge">
                <i class="bi bi-star-fill" style="margin-right: 4px;"></i> PORTAFOLIO
            </span>
        </div>
        <div class="video-info">
            <h4 class="video-title">Conoce nuestro trabajo</h4>
            <div class="video-meta">
                <span class="video-meta-item">
                    <i class="bi bi-collection-play"></i> Video destacado
                </span>
            </div>
        </div>
    `;
    
    // Click handler para abrir modal
    card.addEventListener('click', () => {
        openVideoModal({
            url: embedUrl,
            titulo: `Video Portafolio - ${negocio.nombre}`,
            descripcion: negocio.descripcion || `Conoce el trabajo de ${negocio.nombre}`
        });
    });
    
    // Insertar al inicio del grid (antes de los otros videos)
    grid.insertBefore(card, grid.firstChild);
}

/**
 * Abre el modal de video
 */
function openVideoModal(videoData) {
    const modal = document.getElementById('videoModal');
    const playerContainer = document.getElementById('videoPlayerContainer');
    const titleEl = document.getElementById('modalVideoTitle');
    const descEl = document.getElementById('modalVideoDescription');
    const badgesContainer = document.getElementById('modalVideoBadges');
    
    if (!modal) return;
    
    // Cargar video
    if (playerContainer) {
        const rawUrl = videoData.url || videoData.video_url;
        const embedUrl = rawUrl ? getVideoEmbedUrl(rawUrl) : '';
        
        if (!embedUrl) {
            playerContainer.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff;font-size:1.2rem;">
                    <i class="bi bi-exclamation-triangle" style="margin-right:10px;font-size:2rem;color:#f59e0b;"></i>
                    Video no disponible
                </div>
            `;
        } else {
            playerContainer.innerHTML = `
                <iframe src="${embedUrl}?autoplay=1&rel=0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
            `;
        }
    }
    
    // Info
    if (titleEl) titleEl.textContent = videoData.titulo || 'Video';
    if (descEl) descEl.textContent = videoData.descripcion || '';
    
    // Badges
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        if (videoData.badges && videoData.badges.length > 0) {
            videoData.badges.forEach(badge => {
                const badgeEl = document.createElement('div');
                badgeEl.className = 'modal-badge';
                badgeEl.style.cssText = `--badge-color: ${badge.color || '#a855f7'}; --badge-bg: ${badge.color || '#a855f7'}20;`;
                badgeEl.innerHTML = `
                    <i class="bi ${badge.icono || 'bi-award'}"></i>
                    <span>${badge.nombre}</span>
                `;
                badgesContainer.appendChild(badgeEl);
            });
        }
    }
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
    

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - VIDEOS DEL FEED
// ═══════════════════════════════════════════════════════════════════════════════
function renderVideos(data) {
    const videos = data.videos || [];
    VIDEOS_DATA = videos;
    
    if (!videos.length) {
        // Si no hay videos del feed pero sí video portafolio, la sección ya se muestra
        const negocio = data.negocio || {};
        if (!negocio.video_portafolio) {
            const section = document.querySelector('.videos-section');
            if (section) section.style.display = 'none';
        }
        return;
    }
    
    const grid = document.getElementById('videosGrid');
    if (!grid) return;
    
    videos.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id || index;
        card.dataset.category = video.categoria || 'todos';
        
        // Badges del video
        let badgesHTML = '';
        if (video.badges && video.badges.length > 0) {
            badgesHTML = `<div class="video-badges-overlay">
                ${video.badges.map(b => `
                    <div class="video-badge-mini" style="--badge-color: ${b.color || '#f59e0b'};">
                        <i class="bi ${b.icono || 'bi-award-fill'}"></i>
                        <span>${b.nombre}</span>
                    </div>
                `).join('')}
            </div>`;
        }
        
        // Métrica del video
        let metricaHTML = '';
        if (video.metrica) {
            metricaHTML = `
                <div class="video-metric" style="--metric-color: ${video.metrica.color || '#10b981'}; --metric-bg: ${video.metrica.color || '#10b981'}15; --metric-border: ${video.metrica.color || '#10b981'}30;">
                    <span class="video-metric-label">
                        <i class="bi bi-graph-up"></i>
                        ${video.metrica.nombre}
                    </span>
                    <span class="video-metric-value">
                        ${video.metrica.valor} <i class="bi bi-arrow-up trend"></i>
                    </span>
                </div>
            `;
        }
        
       card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.url_thumbnail || video.thumbnail_url || getVideoThumbnail(video.video_url) || getVideoThumbnail(video.url) || getCloudinaryThumbnail(video.video_url) || getCloudinaryThumbnail(video.url) || ''}"
                     alt="${video.titulo || 'Video'}"
                     onerror="this.onerror=null;if(this.src.includes('maxresdefault')){this.src=this.src.replace('maxresdefault','hqdefault')}else{this.style.background='#1a1a2e';this.alt=''}">
                <div class="video-play-btn">
                    <i class="bi bi-play-fill"></i>
                </div>
                ${video.calidad ? `<span class="video-quality">${video.calidad}</span>` : ''}
                ${video.duracion_segundos ? `<span class="video-duration">${video.duracion_segundos}</span>` : ''}
                ${badgesHTML}
            </div>
            <div class="video-info">
                <h4 class="video-title">${video.titulo || 'Sin título'}</h4>
                <div class="video-meta">
                    <span class="video-meta-item">
                        <i class="bi bi-eye"></i> ${formatNumber(video.vistas || 0)} vistas
                    </span>
                    <span class="video-meta-item">
                        <i class="bi bi-heart-fill"></i> ${formatNumber(video.likes || 0)}
                    </span>
                    <span class="video-meta-item">
                        <i class="bi bi-calendar3"></i> ${formatDate(video.fecha)}
                    </span>
                </div>
                ${metricaHTML}
            </div>
        `;
        
        // Click handler
        card.addEventListener('click', (e) => {
             e.stopPropagation();  // ← Evitar que el handler delegado del HTML también dispare
             openVideoModal({
                 url: video.video_url || video.url,
                 titulo: video.titulo,
                 descripcion: video.descripcion,
                 badges: video.badges
             });
         });
        
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        grid.appendChild(card);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════
function renderReviews(data) {
    const reviews = data.resenas || data.reviews || [];
    const resumen = data.resumen_resenas || {};
    
    if (!reviews.length) {
        const section = document.querySelector('.reviews-section');
        if (section) section.style.display = 'none';
        return;
    }
    
    // Resumen
    const scoreValueEl = document.querySelector('.reviews-score-value');
    if (scoreValueEl) scoreValueEl.textContent = resumen.promedio?.toFixed(1) || '0.0';
    
    // Estrellas
    const starsContainer = document.querySelector('.reviews-score-stars');
    if (starsContainer && resumen.promedio) {
        const promedio = resumen.promedio;
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(promedio)) starsHTML += '<i class="bi bi-star-fill"></i>';
            else if (i - 0.5 <= promedio) starsHTML += '<i class="bi bi-star-half"></i>';
            else starsHTML += '<i class="bi bi-star"></i>';
        }
        starsContainer.innerHTML = starsHTML;
    }
    
    const countEl = document.querySelector('.reviews-score-count');
    if (countEl) countEl.textContent = `${resumen.total || reviews.length} reseñas`;
    
    // Distribución
    const distribution = resumen.distribucion || {};
    for (let i = 5; i >= 1; i--) {
        const row = document.querySelector(`.distribution-row:nth-child(${6-i})`);
        if (row) {
            const fill = row.querySelector('.distribution-fill');
            const count = row.querySelector('.distribution-count');
            const total = resumen.total || reviews.length || 1;
            const cantidad = distribution[i] || 0;
            const porcentaje = (cantidad / total) * 100;
            
            if (fill) fill.style.width = `${porcentaje}%`;
            if (count) count.textContent = cantidad;
        }
    }
    
    // Lista de reseñas
    const list = document.getElementById('reviewsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    reviews.slice(0, 5).forEach((review, idx) => {
        const calificacion = review.calificacion || review.rating || 5;
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="bi bi-star${i <= calificacion ? '-fill' : ''} ${i > calificacion ? 'empty' : ''}"></i>`;
        }
        
        let etapaHTML = '';
        if (review.etapa || review.servicio) {
            etapaHTML = `
                <div class="review-stage">
                    <i class="bi bi-check-circle-fill"></i>
                    Servicio completado: ${review.etapa || review.servicio}
                </div>
            `;
        }
        
        let respuestaHTML = '';
        if (review.respuesta) {
            respuestaHTML = `
                <div class="review-response">
                    <div class="review-response-header">
                        <img src="${review.respuesta.avatar || 'https://ui-avatars.com/api/?name=N&background=a855f7&color=fff&size=64'}" 
                             alt="Respuesta" class="review-response-avatar">
                        <span>${review.respuesta.autor || 'Negocio'} respondió</span>
                        <small>· ${formatDate(review.respuesta.fecha)}</small>
                    </div>
                    <p class="review-response-text">${review.respuesta.texto || ''}</p>
                </div>
            `;
        }
        
        let metaHTML = '';
        if (review.verificado) metaHTML += '<span><i class="bi bi-patch-check-fill" style="color: #3b82f6;"></i> Compra verificada</span>';
        if (review.recurrente) metaHTML += '<span><i class="bi bi-arrow-repeat"></i> Cliente recurrente</span>';
        
        const textoId = `review${idx}Text`;
        const textoLargo = (review.texto || review.contenido || '').length > 200;
        
        const card = document.createElement('div');
        card.className = 'review-card';
        
        card.innerHTML = `
            <div class="review-header">
                <div class="review-author">
                    <img src="${review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.autor || 'U')}&background=6366f1&color=fff&size=96`}" 
                         alt="${review.autor || 'Usuario'}" class="review-avatar">
                    <div class="review-author-info">
                        <h4>${review.autor || 'Usuario'}</h4>
                        <div class="review-author-meta">${metaHTML}</div>
                    </div>
                </div>
                <div class="review-rating">
                    <div class="review-stars">${starsHTML}</div>
                    <span class="review-date">${formatDate(review.fecha)}</span>
                </div>
            </div>
            ${etapaHTML}
            <div class="review-content">
                <p class="review-text ${textoLargo ? 'truncated' : ''}" id="${textoId}">
                    ${review.texto || review.contenido || ''}
                </p>
                ${textoLargo ? `
                    <span class="review-read-more" onclick="toggleReviewText('${textoId}', this)">
                        Leer más <i class="bi bi-chevron-down"></i>
                    </span>
                ` : ''}
            </div>
            ${respuestaHTML}
            <div class="review-actions">
                <button class="review-action-btn" onclick="this.classList.toggle('liked')">
                    <i class="bi bi-hand-thumbs-up"></i>
                    <span>Útil (${review.util || review.likes || 0})</span>
                </button>
                <button class="review-action-btn">
                    <i class="bi bi-share"></i>
                    <span>Compartir</span>
                </button>
            </div>
        `;
        
        list.appendChild(card);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - CONTACTO (ACTUALIZADO v2.6)
// ═══════════════════════════════════════════════════════════════════════════════
function renderContacto(data) {
    const negocio = data.negocio || data;
    const contacto = data.contacto || negocio;
    
    // WhatsApp link
    const whatsappBtn = document.querySelector('.contact-btn.whatsapp');
    if (whatsappBtn) {
        const phone = (contacto.whatsapp || contacto.telefono || '').replace(/\D/g, '');
        if (phone) {
            const msg = encodeURIComponent(`Hola, vi su perfil en tukomercio y me gustaría más información sobre ${negocio.nombre}`);
            whatsappBtn.href = `https://wa.me/${phone}?text=${msg}`;
            whatsappBtn.style.display = 'flex';
        } else {
            whatsappBtn.style.display = 'none';
        }
    }
    
    // Tienda / Sitio web link
    const storeBtn = document.querySelector('.contact-btn.store');
    if (storeBtn) {
        if (negocio.micrositio_activo && negocio.slug) {
            storeBtn.href = `/tienda/${negocio.slug}`;
            storeBtn.innerHTML = '<i class="bi bi-shop"></i><span>Ver Tienda Online</span>';
            storeBtn.style.display = 'flex';
        } else if (negocio.sitio_web) {
            // NUEVO: Usar sitio web externo
            let url = negocio.sitio_web;
            if (!url.startsWith('http')) url = 'https://' + url;
            storeBtn.href = url;
            storeBtn.target = '_blank';
            storeBtn.rel = 'noopener noreferrer';
            storeBtn.innerHTML = '<i class="bi bi-globe"></i><span>Visitar Sitio Web</span>';
            storeBtn.style.display = 'flex';
        } else {
            storeBtn.style.display = 'none';
        }
    }
    
    // Info de contacto
    const phoneEl = document.querySelector('.contact-info-item:nth-child(1) .contact-info-value');
    if (phoneEl) {
        phoneEl.textContent = contacto.telefono || contacto.whatsapp || 'No disponible';
    }
    
    // NUEVO: Email
    const emailEl = document.querySelector('.contact-info-item:nth-child(2) .contact-info-value');
    if (emailEl) {
        emailEl.textContent = negocio.email || contacto.email || 'No disponible';
        // Hacer clickeable si hay email
        const emailItem = emailEl.closest('.contact-info-item');
        if (emailItem && (negocio.email || contacto.email)) {
            emailItem.style.cursor = 'pointer';
            emailItem.onclick = () => window.location.href = `mailto:${negocio.email || contacto.email}`;
        }
    }
    
    // Ubicación - INCLUYE CIUDAD
    const ubicacionEl = document.querySelector('.contact-info-item:nth-child(3) .contact-info-value');
    if (ubicacionEl) {
        let location = '';
        if (negocio.direccion) {
            location = negocio.direccion;
            if (negocio.ciudad) location += `, ${negocio.ciudad}`;
        } else if (negocio.ciudad) {
            location = negocio.ciudad;
            if (negocio.ubicacion) location += `, ${negocio.ubicacion}`;
        } else {
            location = negocio.ubicacion || contacto.ubicacion || 'Colombia';
        }
        ubicacionEl.textContent = location;
    }
    
    // Tiempo de respuesta
    const tiempoEl = document.querySelector('.contact-info-item:nth-child(4) .contact-info-value');
    if (tiempoEl) {
        tiempoEl.textContent = formatTimeAgo(contacto.tiempo_respuesta_minutos || negocio.tiempo_respuesta_minutos) || 'Responde rápido';
    }
    
    // NUEVO: Renderizar horarios desde horario_atencion
    renderHorarios(negocio.horario_atencion || contacto.horarios);
    
    // NUEVO: Renderizar redes sociales desde redes_sociales
    renderRedes(negocio.redes_sociales || contacto.redes);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - HORARIOS (ACTUALIZADO v2.6)
// ═══════════════════════════════════════════════════════════════════════════════
function renderHorarios(horario) {
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = '';
    
    const currentDay = getCurrentDayKey();
    
    CONFIG.DAYS_ORDER.forEach(dayKey => {
        const dayName = CONFIG.DAYS_MAP[dayKey];
        const daySchedule = horario ? horario[dayKey] : null;
        
        const item = document.createElement('div');
        item.className = 'schedule-item';
        if (dayKey === currentDay) {
            item.classList.add('today');
        }
        
        // ✅ Soportar ambos formatos: {abierto} y {cerrado/abre}
        const estaAbierto = daySchedule && (
            daySchedule.abierto === true || 
            (daySchedule.cerrado === false && (daySchedule.abre || daySchedule.apertura)) ||
            (!daySchedule.hasOwnProperty('abierto') && !daySchedule.cerrado && (daySchedule.abre || daySchedule.apertura))
        );
        
        let hoursText = 'Cerrado';
        if (estaAbierto) {
            const horaAbre = formatTime12h(daySchedule.apertura || daySchedule.abre || '09:00');
            const horaCierra = formatTime12h(daySchedule.cierre || daySchedule.cierra || '18:00');
            hoursText = `${horaAbre} - ${horaCierra}`;
        } else {
            item.classList.add('closed');
        }
        
        item.innerHTML = `
            <span class="schedule-day">${dayName}</span>
            <span class="schedule-hours">${hoursText}</span>
        `;
        
        scheduleList.appendChild(item);
    });
    
    // Actualizar estado abierto/cerrado
    const statusEl = document.querySelector('.schedule-status');
    if (statusEl) {
        const isOpen = isBusinessOpenNow(horario);
        statusEl.className = `schedule-status ${isOpen ? 'open' : 'closed'}`;
        statusEl.innerHTML = `
            <div class="pulse"></div>
            ${isOpen ? 'Abierto ahora' : 'Cerrado'}
        `;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS - REDES SOCIALES (ACTUALIZADO v2.6)
// ═══════════════════════════════════════════════════════════════════════════════
function renderRedes(redes) {
    const socialContainer = document.querySelector('.contact-social');
    if (!socialContainer) return;
    
    socialContainer.innerHTML = '';
    
    if (!redes || Object.keys(redes).length === 0) {
        socialContainer.style.display = 'none';
        return;
    }
    
    socialContainer.style.display = 'flex';
    
    const redesConfig = {
        instagram:        { icon: 'bi-instagram',  class: 'instagram',        label: 'Instagram',        urlBase: 'https://instagram.com/' },
        facebook:         { icon: 'bi-facebook',   class: 'facebook',         label: 'Facebook',         urlBase: 'https://facebook.com/' },
        facebook_pagina:  { icon: 'bi-facebook',   class: 'facebook_pagina',  label: 'Página Facebook',  urlBase: 'https://facebook.com/' },
        facebook_grupo:   { icon: 'bi-people-fill',class: 'facebook_grupo',   label: 'Grupo Facebook',   urlBase: 'https://facebook.com/groups/' },
        tiktok:           { icon: 'bi-tiktok',     class: 'tiktok',           label: 'TikTok',           urlBase: 'https://tiktok.com/@' },
        twitter:          { icon: 'bi-twitter-x',  class: 'twitter',          label: 'X / Twitter',      urlBase: 'https://twitter.com/' },
        linkedin:         { icon: 'bi-linkedin',   class: 'linkedin',         label: 'LinkedIn',         urlBase: 'https://linkedin.com/in/' },
        youtube:          { icon: 'bi-youtube',    class: 'youtube',          label: 'YouTube',          urlBase: 'https://youtube.com/@' },
    };

    Object.entries(redes).forEach(([red, username]) => {
        if (!username || !redesConfig[red]) return;

        const config = redesConfig[red];

        // Si ya es URL completa la usamos directamente
        let finalUrl = username.startsWith('http') ? username : config.urlBase + username.replace('@', '');

        const btn = document.createElement('a');
        btn.href = finalUrl;
        btn.className = `social-btn ${config.class}`;
        btn.title = config.label;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.innerHTML = `<i class="bi ${config.icon}"></i>`;

        socialContainer.appendChild(btn);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARTIR PERFIL
// ═══════════════════════════════════════════════════════════════════════════════
function compartirPerfil() {
    const nombre = PROFILE_DATA?.negocio?.nombre || 'Negocio';
    const score = PROFILE_DATA?.score?.valor || 0;
    
    const shareData = {
        title: `${nombre} - Perfil BizScore`,
        text: `Mira este negocio verificado en tukomercio. Tiene un BizScore de ${score}/100.`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(console.log);
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('¡Link copiado al portapapeles!');
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
async function inicializarPerfil() {
    const profileMode = ProfileMode.init();
    window.currentProfileMode = profileMode;
    mostrarLoading();
    
    const slug = obtenerSlugDeURL();
    
    if (!slug) {
        mostrarError('No se especificó un negocio. Usa /n/{slug} o ?slug={slug}');
        return;
    }
    
    try {
        const data = await cargarPerfilNegocio(slug);
        PROFILE_DATA = data;
        
        // Renderizar todas las secciones
        renderHeader(data);
        renderScore(data);
        
        if (data.badges && data.badges.length > 0) {
            renderBadges(data.badges);
        } else {
            renderBadges([]);
        }
        
        if (data.estadisticas) {
            renderStats(data);
        }
        
        if (data.etapas && data.etapas.length > 0) {
            renderStages(data);
        }
        
        // NUEVO: Renderizar video portafolio si existe
        renderVideoPortafolio(data);
        
        if (data.videos && data.videos.length > 0) {
            renderVideos(data);
        }
        
        if (data.resenas || data.reviews) {
            renderReviews(data);
        }
        
        renderContacto(data);
        
        // Ocultar loading
        ocultarLoading();
        
        console.log('✅ Perfil cargado completamente');
        
    } catch (error) {
        mostrarError(error.message || 'Error al cargar el perfil del negocio.');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    inicializarPerfil();
    
    // Botón compartir
    const btnCompartir = document.getElementById('btnCompartir');
    if (btnCompartir) {
        btnCompartir.addEventListener('click', compartirPerfil);
    }
    
    // Cerrar modal de video
    const closeVideoModal = document.getElementById('closeVideoModal');
    if (closeVideoModal) {
        closeVideoModal.addEventListener('click', () => {
            const modal = document.getElementById('videoModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                const playerContainer = document.getElementById('videoPlayerContainer');
                if (playerContainer) playerContainer.innerHTML = '';
            }
        });
    }
    
    // Click fuera del modal para cerrar
    const videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                videoModal.classList.remove('active');
                document.body.style.overflow = '';
                const playerContainer = document.getElementById('videoPlayerContainer');
                if (playerContainer) playerContainer.innerHTML = '';
            }
        });
    }
    
    // ESC para cerrar modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('videoModal');
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                const playerContainer = document.getElementById('videoPlayerContainer');
                if (playerContainer) playerContainer.innerHTML = '';
            }
        }
    });
});

// Exponer funciones globales necesarias
window.compartirPerfil = compartirPerfil;
window.openVideoModal = openVideoModal;
window.PROFILE_DATA = PROFILE_DATA;
window.VIDEOS_DATA = VIDEOS_DATA;