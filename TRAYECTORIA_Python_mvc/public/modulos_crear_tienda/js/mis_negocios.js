(function() {
    'use strict';
    
    // =====================================================
    // CONFIGURACIÓN DEL API
    // =====================================================
    
    const CONFIG = {
        API_BASE: window.parent?.APP_CONFIG?.API_BASE_URL 
            || window.APP_CONFIG?.API_BASE_URL 
            || 'https://trayectoria-backend.onrender.com/api',
        
        ENDPOINTS: {
            MIS_NEGOCIOS: '/mis_negocios',
            NEGOCIO: (id) => `/negocio/${id}`,
            REGISTRAR: '/registrar_negocio',
            SUCURSALES: (id) => `/negocios/${id}/sucursales`,
            HEALTH: '/negocio/health',
            USUARIO: '/usuarios/perfil'
        },
        
        DEBUG: true,
        TIMEOUT: 15000
    };
    
    // =====================================================
    // ESTADO DE LA APLICACIÓN
    // =====================================================
    
    let state = {
        negocios: [],
        currentView: 'grid',
        negocioActivoId: localStorage.getItem('negocio_id'),
        isLoading: false,
        isAuthenticated: false,
        user: null,
        connectionStatus: 'checking'
    };
    
    const gradients = [
        'gradient-1', 'gradient-2', 'gradient-3', 'gradient-4',
        'gradient-5', 'gradient-6', 'gradient-7', 'gradient-8',
        'gradient-9', 'gradient-10', 'gradient-11', 'gradient-12'
    ];
    
    const categoryIcons = {
        'restaurante': 'bi-cup-hot-fill',
        'cafeteria': 'bi-cup-hot',
        'tienda_ropa': 'bi-bag-heart',
        'tienda_online': 'bi-globe2',
        'peluqueria': 'bi-scissors',
        'barberia': 'bi-scissors',
        'gimnasio': 'bi-bicycle',
        'consultorio_medico': 'bi-hospital-fill',
        'desarrollo_web': 'bi-code-slash',
        'diseno_grafico': 'bi-palette2',
        'marketing_digital': 'bi-graph-up-arrow',
        'contador': 'bi-calculator-fill',
        'abogado': 'bi-briefcase-fill',
        'fotografo': 'bi-camera-fill',
        'tecnologia': 'bi-cpu',
        'educacion': 'bi-book',
        'salud': 'bi-heart-pulse',
        'transporte': 'bi-truck',
        'construccion': 'bi-building',
        'alimentos': 'bi-basket',
        'automotriz': 'bi-car-front-fill',
        'belleza': 'bi-stars',
        'mascotas': 'bi-heart-pulse-fill',
        'default': 'bi-shop'
    };
    
    // =====================================================
    // UTILIDADES DE AUTENTICACIÓN
    // =====================================================
    
    const Auth = {
        getToken() {
            return localStorage.getItem('bf_access_token')
                || localStorage.getItem('authToken')
                || localStorage.getItem('token');
        },
        
        getUserId() {
            return localStorage.getItem('usuario_id');
        },
        
        getBusinessId() {
            return localStorage.getItem('negocio_id');
        },
        
        isAuthenticated() {
            if (window.authClient && window.authClient.isLoggedIn()) {
                return true;
            }
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const hasToken = !!this.getToken();
            const hasUserId = !!this.getUserId();
            return isLoggedIn && (hasToken || hasUserId);
        },
        
        getUserFromToken() {
            if (window.authClient && window.authClient.getCurrentUser()) {
                const user = window.authClient.getCurrentUser();
                return {
                    id: user.id_usuario || user.id,
                    email: user.correo || user.email,
                    nombre: user.nombre
                };
            }
            try {
                const userData = localStorage.getItem('userData');
                if (userData) {
                    const user = JSON.parse(userData);
                    return {
                        id: user.id_usuario || user.id,
                        email: user.correo || user.email,
                        nombre: user.nombre
                    };
                }
            } catch (e) {}
            const userId = this.getUserId();
            return userId ? { id: userId } : null;
        },
        
        clearSession() {
            const keys = [
                'usuario_id', 'userData', 'authToken', 'isLoggedIn',
                'negocio_id', 'sucursal_id', 'active_business_name', 'active_branch_name',
                'bf_access_token', 'bf_refresh_token', 'bf_token_expiry', 'bf_session_fp',
                'negocio_nombre', 'sucursal_nombre'
            ];
            keys.forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
        },
        
        getAuthHeaders() {
            const headers = {};
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const userId = this.getUserId();
            if (userId) headers['X-User-ID'] = String(userId);
            const businessId = this.getBusinessId();
            if (businessId) headers['X-Business-ID'] = String(businessId);
            const fingerprint = localStorage.getItem('bf_session_fp');
            if (fingerprint) headers['X-Session-FP'] = fingerprint;
            return headers;
        }
    };
    
    // =====================================================
    // CLIENTE HTTP
    // =====================================================
    
    const HttpClient = {
        async request(endpoint, options = {}) {
            const url = `${CONFIG.API_BASE}${endpoint}`;
            const defaultOptions = {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeaders()
                }
            };
            const finalOptions = {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...options.headers }
            };
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
            finalOptions.signal = controller.signal;
            
            try {
                console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
                const response = await fetch(url, finalOptions);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw {
                        status: response.status,
                        statusText: response.statusText,
                        message: errorData.message || errorData.error || `Error ${response.status}`,
                        data: errorData
                    };
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                return await response.text();
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw { message: 'La solicitud tardó demasiado tiempo', timeout: true };
                }
                if (!navigator.onLine) {
                    throw { message: 'Sin conexión a internet', offline: true };
                }
                throw error;
            }
        },
        
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
        post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); },
        put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); },
        delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
    };
    
    // =====================================================
    // SISTEMA DE SONIDO
    // =====================================================
    
    const SoundSystem = {
        enabled: true,
        audioContext: null,
        masterVolume: 0.4,
        
        init() {
            const savedPref = localStorage.getItem('bizflow_sound_enabled');
            this.enabled = savedPref !== 'false';
            this.updateUI();
            document.addEventListener('click', () => this.ensureContext(), { once: true });
            document.addEventListener('touchstart', () => this.ensureContext(), { once: true });
        },
        
        ensureContext() {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') this.audioContext.resume();
        },
        
        toggle() {
            this.enabled = !this.enabled;
            localStorage.setItem('bizflow_sound_enabled', this.enabled);
            this.updateUI();
            this.showIndicator();
            if (this.enabled) this.play('toggle');
        },
        
        updateUI() {
            const btn = document.getElementById('btnSoundToggle');
            const indicator = document.getElementById('soundIndicator');
            const statusText = document.getElementById('soundStatusText');
            if (btn) {
                const icon = btn.querySelector('i');
                btn.classList.toggle('muted', !this.enabled);
                icon.className = this.enabled ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill';
            }
            if (indicator) indicator.classList.toggle('muted', !this.enabled);
            if (statusText) statusText.textContent = this.enabled ? 'Sonido activado' : 'Sonido silenciado';
        },
        
        showIndicator() {
            const indicator = document.getElementById('soundIndicator');
            if (indicator) {
                indicator.classList.add('visible');
                setTimeout(() => indicator.classList.remove('visible'), 2000);
            }
        },
        
        play(type) {
            if (!this.enabled || !this.audioContext) return;
            this.ensureContext();
            const sounds = {
                hover: () => this.createTone(800, 0.05, 'sine', 0.08),
                click: () => this.createTone(600, 0.08, 'sine', 0.15),
                success: () => this.createChord([523, 659, 784], 0.2, 0.18),
                select: () => this.createSweep(400, 800, 0.15, 0.18),
                toggle: () => this.createTone(1000, 0.1, 'sine', 0.12),
                error: () => this.createTone(200, 0.2, 'sawtooth', 0.1),
                whoosh: () => this.createNoise(0.1, 0.06),
                notification: () => this.createChord([880, 1100], 0.15, 0.12)
            };
            try { sounds[type]?.(); } catch (e) { console.warn('Sound error:', e); }
        },
        
        createTone(freq, duration, type = 'sine', volume = 0.2) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
        },
        
        createChord(frequencies, duration, volume = 0.15) {
            frequencies.forEach((freq, i) => {
                setTimeout(() => this.createTone(freq, duration, 'sine', volume / frequencies.length), i * 50);
            });
        },
        
        createSweep(startFreq, endFreq, duration, volume = 0.15) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
        },
        
        createNoise(duration, volume = 0.1) {
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            const source = this.audioContext.createBufferSource();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            source.buffer = buffer;
            gain.gain.value = volume * this.masterVolume;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            source.start();
        }
    };
    
    // =====================================================
    // UI HELPERS
    // =====================================================
    
    function generateStars() {
        const container = document.getElementById('starsContainer');
        if (!container) return;
        for (let i = 0; i < 80; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.animationDuration = `${2 + Math.random() * 3}s`;
            container.appendChild(star);
        }
    }
    
    function initTiltEffect() {
        document.querySelectorAll('.business-card').forEach(card => {
            card.addEventListener('mousemove', handleTilt);
            card.addEventListener('mouseleave', resetTilt);
            card.addEventListener('mouseenter', () => SoundSystem.play('hover'));
        });
    }
    
    function handleTilt(e) {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${percentX}%`);
        card.style.setProperty('--mouse-y', `${percentY}%`);
    }
    
    function resetTilt(e) {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
    
    function animateCounter(element, target, duration = 1000) {
        if (!element) return;
        const startTime = performance.now();
        element.classList.add('counting');
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            element.textContent = Math.floor(target * easeOutQuart);
            if (progress < 1) requestAnimationFrame(update);
            else {
                element.textContent = target;
                setTimeout(() => element.classList.remove('counting'), 100);
            }
        }
        requestAnimationFrame(update);
    }
    
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        SoundSystem.play(type === 'success' ? 'success' : type === 'error' ? 'error' : 'notification');
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        const icons = { 
            success: 'bi-check-circle-fill', 
            error: 'bi-x-circle-fill', 
            info: 'bi-info-circle-fill',
            warning: 'bi-exclamation-triangle-fill'
        };
        toast.innerHTML = `
            <i class="bi ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    function updateConnectionStatus(status) {
        state.connectionStatus = status;
        const dot = document.getElementById('connectionStatus');
        const debugDot = document.getElementById('debugApiStatus');
        if (dot) {
            dot.classList.remove('disconnected');
            if (status === 'offline') dot.classList.add('disconnected');
        }
        if (debugDot) {
            debugDot.classList.remove('online', 'offline');
            debugDot.classList.add(status === 'online' ? 'online' : 'offline');
        }
    }
    
    function updateDebugPanel() {
        if (!CONFIG.DEBUG) {
            document.getElementById('debugPanel')?.classList.add('hidden');
            return;
        }
        const userId = Auth.getUserId();
        const isAuth = Auth.isAuthenticated();
        document.getElementById('debugApiUrl').textContent = CONFIG.API_BASE.replace('https://', '');
        document.getElementById('debugUserId').textContent = userId || 'N/A';
        document.getElementById('debugTokenStatus').textContent = isAuth ? '✓ Auth' : '✗ No auth';
    }
    
    // =====================================================
    // RENDERIZADO
    // =====================================================
    
    function getIcon(categoria) {
        return categoryIcons[categoria] || categoryIcons.default;
    }
    
    function formatCategory(cat) {
        if (!cat) return 'General';
        return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    function showSkeletons() {
        const grid = document.getElementById('businessesGrid');
        if (!grid) return;
        grid.innerHTML = Array(6).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-body">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton-tags">
                        <div class="skeleton skeleton-tag"></div>
                        <div class="skeleton skeleton-tag"></div>
                    </div>
                    <div class="skeleton-footer">
                        <div class="skeleton skeleton-tag"></div>
                        <div style="display: flex; gap: 0.5rem;">
                            <div class="skeleton skeleton-btn"></div>
                            <div class="skeleton skeleton-btn"></div>
                            <div class="skeleton skeleton-btn"></div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    function showErrorState(message, canRetry = true) {
        const grid = document.getElementById('businessesGrid');
        if (!grid) return;
        grid.innerHTML = `
            <div class="error-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar</h3>
                <p>${message}</p>
                ${canRetry ? `<button class="btn-retry" onclick="loadBusinesses()"><i class="bi bi-arrow-clockwise"></i> Reintentar</button>` : ''}
            </div>
        `;
    }
    
    // =====================================================
    // RE-APLICAR FEATUREGATE DESPUÉS DE RENDERIZAR
    // =====================================================
    
    function reapplyGating() {
        if (window.TukoGate) {
            // Aplicar inmediatamente y con retries para cubrir render async
            window.TukoGate.applyGating(document);
            setTimeout(() => window.TukoGate.applyGating(document), 150);
            setTimeout(() => window.TukoGate.applyGating(document), 400);
        }
    }
    
    // =====================================================
    // RENDER CARDS (GRID VIEW)
    // =====================================================
    
    function renderCards(data) {
        const grid = document.getElementById('businessesGrid');
        if (!grid) return;
        
        if (state.negocios.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-illustration">
                        <div class="orbit orbit-1"></div>
                        <div class="orbit orbit-2"></div>
                        <div class="planet planet-main"><i class="bi bi-rocket-takeoff-fill"></i></div>
                        <div class="planet planet-small"></div>
                        <div class="planet planet-tiny"></div>
                        <div class="stars-mini star-1"></div>
                        <div class="stars-mini star-2"></div>
                        <div class="stars-mini star-3"></div>
                        <div class="stars-mini star-4"></div>
                    </div>
                    <div class="empty-state-content">
                        <h3>¡Comienza tu aventura empresarial!</h3>
                        <p>Aún no tienes negocios registrados. Crea tu primer emprendimiento.</p>
                        <button class="btn-create-first" onclick="createNewBusiness()">
                            <i class="bi bi-plus-lg"></i> Crear mi primer negocio
                        </button>
                        <div class="empty-features">
                            <div class="empty-feature"><i class="bi bi-shop"></i> Negocios</div>
                            <div class="empty-feature"><i class="bi bi-person-badge"></i> Servicios</div>
                            <div class="empty-feature"><i class="bi bi-globe"></i> Micrositios</div>
                            <div class="empty-feature"><i class="bi bi-graph-up"></i> Analytics</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        if (data.length === 0) {
            grid.innerHTML = `
                <div class="no-results-message" style="grid-column: 1 / -1;">
                    <i class="bi bi-search"></i>
                    <p>No se encontraron negocios con los filtros aplicados</p>
                    <button class="modal-btn modal-btn-cancel" style="margin-top: 1rem;" onclick="clearFilters()">
                        <i class="bi bi-x-circle"></i> Limpiar filtros
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = data.map((n, idx) => {
            const id = n.id || n.id_negocio || n._id;
            const isActive = String(id) === String(state.negocioActivoId);
            const icon = getIcon(n.categoria);
            const gradient = gradients[idx % gradients.length];
            const isService = n.tipo === 'servicio';
            const nombre = n.nombre_negocio || n.nombre || 'Sin nombre';
            const descripcion = n.descripcion || 'Sin descripción disponible.';
            
            return `
                <div class="business-card ${isActive ? 'is-active' : ''}" data-id="${id}" onclick="selectBusiness('${id}')">
                    <div class="card-header-visual">
                        <div class="header-bg ${gradient}"></div>
                        <i class="bi ${icon} header-icon"></i>
                        <span class="type-badge ${isService ? 'servicio' : 'negocio'}">
                            ${isService ? '👤 Servicio' : '🏢 Negocio'}
                        </span>
                        ${isActive ? '<span class="active-badge"><i class="bi bi-check-circle-fill"></i> Activo</span>' : ''}
                    </div>
                    <div class="card-body-content">
                        <h3 class="card-title">
                            ${nombre}
                            <div class="dropdown" onclick="event.stopPropagation()">
                                <button class="dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item" href="#" onclick="editBusiness('${id}'); return false;"><i class="bi bi-pencil"></i> Editar</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="viewProfile('${id}'); return false;" data-feature="ver_perfil"><i class="bi bi-person-badge"></i> Ver Perfil</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="viewBranches('${id}'); return false;" data-feature="ver_sucursales"><i class="bi bi-shop-window"></i> Sucursales</a></li>
                                    ${n.tiene_pagina 
                                        ? `<li><a class="dropdown-item" href="${n.url_sitio || '#'}" target="_blank"><i class="bi bi-globe"></i> Ver micrositio</a></li>`
                                        : `<li><a class="dropdown-item" href="#" onclick="activateSite('${id}'); return false;"><i class="bi bi-globe"></i> Activar sitio</a></li>`
                                    }
                                    <li><div class="dropdown-divider"></div></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteBusiness('${id}', '${nombre.replace(/'/g, "\\'")}'); return false;" data-feature="eliminar_negocio"><i class="bi bi-trash"></i> Eliminar</a></li>
                                </ul>
                            </div>
                        </h3>
                        <p class="card-description">${descripcion}</p>
                        <div class="card-tags">
                            <span class="tag category"><i class="bi ${icon}"></i> ${formatCategory(n.categoria)}</span>
                            ${n.ciudad_nombre || n.ciudad ? `<span class="tag location"><i class="bi bi-geo-alt-fill"></i> ${n.ciudad_nombre || n.ciudad}</span>` : ''}
                        </div>
                        <div class="card-footer-stats">
                            <div class="footer-info">
                                <span class="info-item"><i class="bi bi-shop-window"></i> ${n.sucursales_count || n.total_sucursales || 0}</span>
                            </div>
                            <div class="footer-actions" onclick="event.stopPropagation()">
                                <button class="action-btn" onclick="viewProfile('${id}')" title="Ver Perfil" data-feature="ver_perfil"><i class="bi bi-person-badge"></i></button>
                                <button class="action-btn" onclick="editBusiness('${id}')" title="Editar"><i class="bi bi-pencil"></i></button>
                                <button class="action-btn" onclick="viewBranches('${id}')" title="Sucursales" data-feature="ver_sucursales"><i class="bi bi-shop-window"></i></button>
                                <button class="action-btn qr-btn" onclick="showQRModal('${id}')" title="Ver QR" data-feature="ver_qr"><i class="bi bi-qr-code"></i></button>
                                <button class="action-btn danger" onclick="deleteBusiness('${id}', '${nombre.replace(/'/g, "\\'")}')" title="Eliminar" data-feature="eliminar_negocio"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                    ${n.tiene_pagina ? '<div class="micrositio-banner"><i class="bi bi-globe"></i> Micrositio activo</div>' : ''}
                </div>
            `;
        }).join('');
        
        initTiltEffect();
        reapplyGating();
    }
    
    // =====================================================
    // RENDER TABLE
    // =====================================================
    
    function renderTable(data) {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4" style="color: var(--bf-text-muted);">No se encontraron resultados</td></tr>`;
            return;
        }
        
        tbody.innerHTML = data.map((n, idx) => {
            const id = n.id || n.id_negocio || n._id;
            const isActive = String(id) === String(state.negocioActivoId);
            const icon = getIcon(n.categoria);
            const gradient = gradients[idx % gradients.length];
            const isService = n.tipo === 'servicio';
            const nombre = n.nombre_negocio || n.nombre || 'Sin nombre';
            
            return `
                <tr class="${isActive ? 'is-active' : ''}" onclick="selectBusiness('${id}')">
                    <td>
                        <div class="table-business-name">
                            <div class="icon-mini ${gradient}"><i class="bi ${icon}"></i></div>
                            <span class="name">${nombre}</span>
                            ${isActive ? '<span class="table-badge active">Activo</span>' : ''}
                        </div>
                    </td>
                    <td><span class="table-badge ${isService ? 'servicio' : 'negocio'}">${isService ? '👤 Servicio' : '🏢 Negocio'}</span></td>
                    <td>${formatCategory(n.categoria)}</td>
                    <td>${n.ciudad_nombre || n.ciudad || '—'}</td>
                    <td>${n.sucursales_count || n.total_sucursales || 0}</td>
                    <td><span class="table-badge ${n.tiene_pagina ? 'online' : 'offline'}">${n.tiene_pagina ? '🌐 Online' : 'Offline'}</span></td>
                    <td onclick="event.stopPropagation()">
                        <div class="table-actions">
                            <button class="action-btn" onclick="editBusiness('${id}')" title="Editar"><i class="bi bi-pencil"></i></button>
                            <button class="action-btn" onclick="viewBranches('${id}')" title="Sucursales" data-feature="ver_sucursales"><i class="bi bi-shop-window"></i></button>
                            <button class="action-btn qr-btn" onclick="showQRModal('${id}')" title="Ver QR" data-feature="ver_qr"><i class="bi bi-qr-code"></i></button>
                            <button class="action-btn danger" onclick="deleteBusiness('${id}', '${nombre.replace(/'/g, "\\'")}')" title="Eliminar" data-feature="eliminar_negocio"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        reapplyGating();
    }
    
    // =====================================================
    // FILTRADO Y STATS
    // =====================================================
    
    function filterAndRender() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
        const filterType = document.getElementById('filterType')?.value || '';
        const filterCategory = document.getElementById('filterCategory')?.value || '';
        
        let filtered = state.negocios.filter(n => {
            const nombre = (n.nombre_negocio || n.nombre || '').toLowerCase();
            const matchName = nombre.includes(searchTerm);
            const matchType = !filterType || (n.tipo || 'negocio') === filterType;
            const matchCategory = !filterCategory || n.categoria === filterCategory;
            return matchName && matchType && matchCategory;
        });
        
        if (state.currentView === 'grid') renderCards(filtered);
        else renderTable(filtered);
    }
    
    function populateCategoryFilter() {
        const select = document.getElementById('filterCategory');
        if (!select) return;
        const categories = [...new Set(state.negocios.map(n => n.categoria).filter(Boolean))].sort();
        select.innerHTML = '<option value="">🏷️ Categorías</option>' + 
            categories.map(cat => `<option value="${cat}">${formatCategory(cat)}</option>`).join('');
    }
    
    function updateStats() {
        const total = state.negocios.length;
        const sucursales = state.negocios.reduce((acc, n) => acc + (n.sucursales_count || n.total_sucursales || 0), 0);
        const online = state.negocios.filter(n => n.tiene_pagina).length;
        const activeName = localStorage.getItem('negocio_nombre') || '—';
        
        animateCounter(document.getElementById('statTotal'), total, 800);
        animateCounter(document.getElementById('statSucursales'), sucursales, 1000);
        animateCounter(document.getElementById('statOnline'), online, 900);
        
        const activeEl = document.getElementById('statActivo');
        if (activeEl) activeEl.textContent = activeName.length > 8 ? activeName.substring(0, 7) + '…' : activeName;
    }
    
    function getBizContext() {
        return window.parent?.BizContext || window.BizContext || null;
    }
    
    function updateLocalStorage(id, nombre, negocio) {
        localStorage.setItem('negocio_id', id);
        localStorage.setItem('negocio_nombre', nombre);
        if (negocio.slug) localStorage.setItem('negocio_slug', negocio.slug);
        window.dispatchEvent(new CustomEvent('businessChanged', { detail: { id, nombre, negocio } }));
        
        // Refrescar featureGate con el nuevo negocio
        if (window.parent?.TukoGate) {
            window.parent.TukoGate.refresh();
        } else if (window.TukoGate) {
            window.TukoGate.refresh();
        }
    }
    
    // =====================================================
    // ACCIONES DE NEGOCIOS
    // =====================================================
    
    window.selectBusiness = function(id) {
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (!negocio) return;
        
        const nombre = negocio.nombre_negocio || negocio.nombre;
        const bizContext = getBizContext();
        
        if (bizContext) {
            try {
                bizContext.setNegocioActivo({ id, id_negocio: id, nombre, nombre_negocio: nombre, ...negocio });
            } catch (error) {
                updateLocalStorage(id, nombre, negocio);
            }
        } else {
            updateLocalStorage(id, nombre, negocio);
        }
        
        state.negocioActivoId = id;
        SoundSystem.play('select');
        showToast(`"${nombre}" seleccionado como activo`, 'success');
        filterAndRender();
        updateStats();
        
        setTimeout(() => {
            const card = document.querySelector(`.business-card[data-id="${id}"]`);
            if (card) {
                card.classList.add('just-selected');
                setTimeout(() => card.classList.remove('just-selected'), 600);
            }
        }, 100);
    };
    
    // =====================================================
    // EDICIÓN DE NEGOCIO - VARIABLES GLOBALES
    // =====================================================
    
    let editTarget = null;
    let newLogoFile = null;
    
    // =====================================================
    // EDICIÓN DE NEGOCIO - ABRIR MODAL
    // =====================================================
    
    window.editBusiness = async function(id) {
        SoundSystem.play('click');
        
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (!negocio) {
            showToast('Negocio no encontrado', 'error');
            return;
        }
        
        editTarget = { id, negocio };
        newLogoFile = null;
        
        // ID
        document.getElementById('editNegocioId').value = id;
        
        // Información básica
        document.getElementById('editNombre').value = negocio.nombre_negocio || negocio.nombre || '';
        document.getElementById('editDescripcion').value = negocio.descripcion || '';
        document.getElementById('editCategoria').value = negocio.categoria || '';
        document.getElementById('editCiudad').value = negocio.ciudad || '';
        document.getElementById('editDireccion').value = negocio.direccion || '';
        
        // Contacto
        document.getElementById('editTelefono').value = negocio.telefono || '';
        document.getElementById('editWhatsapp').value = negocio.whatsapp || '';
        document.getElementById('editEmail').value = negocio.email || '';
        document.getElementById('editSitioWeb').value = negocio.sitio_web || '';
        
        // Configuración del perfil
        document.getElementById('editSlug').value = negocio.slug || '';
        document.getElementById('editColorTema').value = negocio.color_tema || '#4cd137';
        document.getElementById('colorValue').textContent = negocio.color_tema || '#4cd137';
        
        // Toggles
        const tienePaginaCheckbox = document.getElementById('editTienePagina');
        const perfilPublicoCheckbox = document.getElementById('editPerfilPublico');
        
        if (tienePaginaCheckbox) {
            tienePaginaCheckbox.checked = negocio.tiene_pagina || false;
            updateToggleLabel('editTienePagina', 'toggleTienePaginaLabel', 'Activada', 'Desactivada');
        }
        
        if (perfilPublicoCheckbox) {
            perfilPublicoCheckbox.checked = negocio.perfil_publico !== false;
            updateToggleLabel('editPerfilPublico', 'togglePerfilPublicoLabel', 'Visible', 'Oculto');
        }
        
        // Logo
        const logoPreview = document.getElementById('editLogoPreview');
        const logoPlaceholder = document.getElementById('editLogoPlaceholder');
        const btnRemoveLogo = document.getElementById('btnRemoveLogo');
        
        if (negocio.logo_url) {
            logoPreview.src = negocio.logo_url;
            logoPreview.classList.remove('hidden', 'd-none');
            logoPlaceholder.classList.add('hidden', 'd-none');
            if (btnRemoveLogo) btnRemoveLogo.style.display = 'flex';
        } else {
            logoPreview.src = '';
            logoPreview.classList.add('hidden', 'd-none');
            logoPlaceholder.classList.remove('hidden', 'd-none');
            if (btnRemoveLogo) btnRemoveLogo.style.display = 'none';
        }
        
        // Video portafolio
        const videoInput = document.getElementById('editVideoPortafolio');
        if (videoInput) {
            videoInput.value = negocio.video_portafolio || '';
            if (negocio.video_portafolio) {
                previewVideo();
            } else {
                const videoContainer = document.getElementById('videoPreviewContainer');
                if (videoContainer) videoContainer.style.display = 'none';
            }
        }
        
        // Redes sociales
        const redes = negocio.redes_sociales || {};
        document.getElementById('editInstagram').value     = (redes.instagram || '').replace('@', '');
        document.getElementById('editFacebookPagina').value = redes.facebook_pagina || redes.facebook || '';
        document.getElementById('editFacebookGrupo').value  = redes.facebook_grupo || '';
        document.getElementById('editTiktok').value       = (redes.tiktok || '').replace('@', '');
        document.getElementById('editTwitter').value      = (redes.twitter || '').replace('@', '');
        document.getElementById('editLinkedin').value     = redes.linkedin || '';
        document.getElementById('editYoutube').value      = (redes.youtube || '').replace('@', '');
        
        // Horario de atención
        populateHorario(negocio.horario_atencion || {});
        
        // Contador de caracteres
        updateCharCount();
        
        // Abrir modal
        document.getElementById('editModal').classList.add('active');
        SoundSystem.play('whoosh');
        
        // Re-aplicar gating dentro del modal
        reapplyGating();
        
        // Focus en el primer campo
        setTimeout(() => {
            document.getElementById('editNombre').focus();
        }, 300);
    };
    
    // =====================================================
    // EDICIÓN DE NEGOCIO - CERRAR MODAL
    // =====================================================
    
    window.closeEditModal = function() {
        document.getElementById('editModal').classList.remove('active');
        editTarget = null;
        newLogoFile = null;
        
        document.getElementById('editBusinessForm').reset();
        
        const videoContainer = document.getElementById('videoPreviewContainer');
        if (videoContainer) videoContainer.style.display = 'none';
        
        const logoPreview = document.getElementById('editLogoPreview');
        const logoPlaceholder = document.getElementById('editLogoPlaceholder');
        if (logoPreview) logoPreview.classList.add('hidden', 'd-none');
        if (logoPlaceholder) logoPlaceholder.classList.remove('hidden', 'd-none');
    };
    
    // =====================================================
    // EDICIÓN - HORARIO DE ATENCIÓN
    // =====================================================
    
    function populateHorario(horario) {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        dias.forEach(dia => {
            const diaData = horario[dia] || {};
            const checkbox = document.getElementById(`horario_${dia}_activo`);
            const abreInput = document.getElementById(`horario_${dia}_abre`);
            const cierraInput = document.getElementById(`horario_${dia}_cierra`);
            const horasContainer = document.getElementById(`horas_${dia}`);
            
            if (checkbox && abreInput && cierraInput) {
                const estaActivo = diaData.abierto || (!diaData.cerrado && (diaData.abre || diaData.apertura));
                
                checkbox.checked = !!estaActivo;
                abreInput.value = diaData.apertura || diaData.abre || '08:00';
                cierraInput.value = diaData.cierre || diaData.cierra || '18:00';
                
                abreInput.disabled = !estaActivo;
                cierraInput.disabled = !estaActivo;
                
                if (horasContainer) {
                    horasContainer.classList.toggle('disabled', !estaActivo);
                }
            }
        });
    }
    
    window.toggleDia = function(dia) {
        const checkbox = document.getElementById(`horario_${dia}_activo`);
        const abreInput = document.getElementById(`horario_${dia}_abre`);
        const cierraInput = document.getElementById(`horario_${dia}_cierra`);
        const horasContainer = document.getElementById(`horas_${dia}`);
        
        if (!checkbox) return;
        
        const activo = checkbox.checked;
        
        if (abreInput) abreInput.disabled = !activo;
        if (cierraInput) cierraInput.disabled = !activo;
        if (horasContainer) horasContainer.classList.toggle('disabled', !activo);
    };
    
    window.setHorarioPreset = function(preset) {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        let config = {};
        
        switch (preset) {
            case 'lunes-viernes':
                config = { lunes: { activo: true, abre: '08:00', cierra: '18:00' }, martes: { activo: true, abre: '08:00', cierra: '18:00' }, miercoles: { activo: true, abre: '08:00', cierra: '18:00' }, jueves: { activo: true, abre: '08:00', cierra: '18:00' }, viernes: { activo: true, abre: '08:00', cierra: '18:00' }, sabado: { activo: false, abre: '09:00', cierra: '14:00' }, domingo: { activo: false, abre: '10:00', cierra: '14:00' } };
                break;
            case 'lunes-sabado':
                config = { lunes: { activo: true, abre: '08:00', cierra: '18:00' }, martes: { activo: true, abre: '08:00', cierra: '18:00' }, miercoles: { activo: true, abre: '08:00', cierra: '18:00' }, jueves: { activo: true, abre: '08:00', cierra: '18:00' }, viernes: { activo: true, abre: '08:00', cierra: '18:00' }, sabado: { activo: true, abre: '09:00', cierra: '14:00' }, domingo: { activo: false, abre: '10:00', cierra: '14:00' } };
                break;
            case 'todos':
                config = { lunes: { activo: true, abre: '08:00', cierra: '18:00' }, martes: { activo: true, abre: '08:00', cierra: '18:00' }, miercoles: { activo: true, abre: '08:00', cierra: '18:00' }, jueves: { activo: true, abre: '08:00', cierra: '18:00' }, viernes: { activo: true, abre: '08:00', cierra: '18:00' }, sabado: { activo: true, abre: '09:00', cierra: '18:00' }, domingo: { activo: true, abre: '10:00', cierra: '16:00' } };
                break;
            case 'limpiar':
                config = { lunes: { activo: false, abre: '08:00', cierra: '18:00' }, martes: { activo: false, abre: '08:00', cierra: '18:00' }, miercoles: { activo: false, abre: '08:00', cierra: '18:00' }, jueves: { activo: false, abre: '08:00', cierra: '18:00' }, viernes: { activo: false, abre: '08:00', cierra: '18:00' }, sabado: { activo: false, abre: '09:00', cierra: '14:00' }, domingo: { activo: false, abre: '10:00', cierra: '14:00' } };
                break;
        }
        
        dias.forEach(dia => {
            const diaConfig = config[dia];
            const checkbox = document.getElementById(`horario_${dia}_activo`);
            const abreInput = document.getElementById(`horario_${dia}_abre`);
            const cierraInput = document.getElementById(`horario_${dia}_cierra`);
            
            if (checkbox && diaConfig) {
                checkbox.checked = diaConfig.activo;
                if (abreInput) abreInput.value = diaConfig.abre;
                if (cierraInput) cierraInput.value = diaConfig.cierra;
                toggleDia(dia);
            }
        });
        
        SoundSystem.play('success');
        showToast(`Horario configurado: ${preset.replace('-', ' a ').replace('limpiar', 'Limpiado')}`, 'success');
    };
    
    function buildHorarioObject() {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const horario = {};
        
        dias.forEach(dia => {
            const checkbox = document.getElementById(`horario_${dia}_activo`);
            const abreInput = document.getElementById(`horario_${dia}_abre`);
            const cierraInput = document.getElementById(`horario_${dia}_cierra`);
            
            if (checkbox) {
                horario[dia] = {
                    abierto: checkbox.checked,
                    apertura: checkbox.checked ? abreInput?.value : null,
                    cierre: checkbox.checked ? cierraInput?.value : null
                };
            }
        });
        
        return horario;
    }
    
    // =====================================================
    // EDICIÓN - TOGGLE SECCIONES COLAPSABLES
    // =====================================================
    
    window.toggleSection = function(containerId, chevronId) {
        const container = document.getElementById(containerId);
        const chevron = document.getElementById(chevronId);
        
        if (container) container.classList.toggle('collapsed');
        if (chevron) {
            chevron.classList.toggle('bi-chevron-down');
            chevron.classList.toggle('bi-chevron-up');
        }
    };
    
    // =====================================================
    // EDICIÓN - VIDEO PORTAFOLIO
    // =====================================================
    
    window.previewVideo = function() {
        const input = document.getElementById('editVideoPortafolio');
        const container = document.getElementById('videoPreviewContainer');
        const iframe = document.getElementById('videoPreviewFrame');
        
        if (!input || !container || !iframe) return;
        
        const url = input.value.trim();
        
        if (!url) { container.style.display = 'none'; return; }
        
        const embedUrl = getVideoEmbedUrl(url);
        
        if (embedUrl) {
            iframe.src = embedUrl;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    };
    
    function getVideoEmbedUrl(url) {
        if (!url) return null;
        if (url.includes('youtube.com/watch')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtube.com/shorts/')) {
            const videoId = url.split('shorts/')[1]?.split('?')[0];
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            if (videoId) return `https://player.vimeo.com/video/${videoId}`;
        }
        return null;
    }
    
    window.removeVideo = function() {
        const input = document.getElementById('editVideoPortafolio');
        const container = document.getElementById('videoPreviewContainer');
        const iframe = document.getElementById('videoPreviewFrame');
        if (input) input.value = '';
        if (container) container.style.display = 'none';
        if (iframe) iframe.src = '';
        SoundSystem.play('click');
    };
    
    // =====================================================
    // EDICIÓN - REDES SOCIALES
    // =====================================================
    
    function buildRedesSocialesObject() {
        const redes = {};
        const instagram       = document.getElementById('editInstagram')?.value.trim();
        const facebookPagina  = document.getElementById('editFacebookPagina')?.value.trim();
        const facebookGrupo   = document.getElementById('editFacebookGrupo')?.value.trim();
        const tiktok          = document.getElementById('editTiktok')?.value.trim();
        const twitter         = document.getElementById('editTwitter')?.value.trim();
        const linkedin        = document.getElementById('editLinkedin')?.value.trim();
        const youtube         = document.getElementById('editYoutube')?.value.trim();
        if (instagram)      redes.instagram        = instagram;
        if (facebookPagina) redes.facebook_pagina  = facebookPagina;
        if (facebookGrupo)  redes.facebook_grupo   = facebookGrupo;
        if (tiktok)         redes.tiktok           = tiktok;
        if (twitter)        redes.twitter          = twitter;
        if (linkedin)       redes.linkedin         = linkedin;
        if (youtube)        redes.youtube          = youtube;
        return Object.keys(redes).length > 0 ? redes : null;
    }
    
    // =====================================================
    // EDICIÓN - LOGO
    // =====================================================
    
    window.previewLogo = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Por favor selecciona una imagen válida', 'error'); return; }
        if (file.size > 2 * 1024 * 1024) { showToast('La imagen no debe superar los 2MB', 'error'); return; }
        newLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('editLogoPreview');
            const logoPlaceholder = document.getElementById('editLogoPlaceholder');
            const btnRemoveLogo = document.getElementById('btnRemoveLogo');
            if (logoPreview) { logoPreview.src = e.target.result; logoPreview.classList.remove('hidden', 'd-none'); }
            if (logoPlaceholder) logoPlaceholder.classList.add('hidden', 'd-none');
            if (btnRemoveLogo) btnRemoveLogo.style.display = 'flex';
            SoundSystem.play('success');
        };
        reader.readAsDataURL(file);
    };
    
    window.removeLogo = function() {
        const logoPreview = document.getElementById('editLogoPreview');
        const logoPlaceholder = document.getElementById('editLogoPlaceholder');
        const btnRemoveLogo = document.getElementById('btnRemoveLogo');
        const logoInput = document.getElementById('editLogoInput');
        if (logoPreview) { logoPreview.src = ''; logoPreview.classList.add('hidden', 'd-none'); }
        if (logoPlaceholder) logoPlaceholder.classList.remove('hidden', 'd-none');
        if (btnRemoveLogo) btnRemoveLogo.style.display = 'none';
        if (logoInput) logoInput.value = '';
        newLogoFile = null;
        if (editTarget && editTarget.negocio.logo_url) editTarget.removeLogo = true;
        SoundSystem.play('click');
    };
    
    // =====================================================
    // EDICIÓN - HELPERS
    // =====================================================
    
    function updateToggleLabel(checkboxId, labelId, activeText, inactiveText) {
        const checkbox = document.getElementById(checkboxId);
        const label = document.getElementById(labelId);
        if (checkbox && label) label.textContent = checkbox.checked ? activeText : inactiveText;
    }
    
    function updateCharCount() {
        const textarea = document.getElementById('editDescripcion');
        const counter = document.getElementById('descCharCount');
        if (textarea && counter) counter.textContent = textarea.value.length;
    }
    
    async function uploadLogo(file, negocioId) {
        try {
            const formData = new FormData();
            formData.append('logo', file);
            formData.append('negocio_id', negocioId);
            const response = await fetch(`${CONFIG.API_BASE}/negocio/${negocioId}/upload-logo`, {
                method: 'POST', headers: Auth.getAuthHeaders(), credentials: 'include', body: formData
            });
            if (!response.ok) throw new Error('Error al subir logo');
            const data = await response.json();
            return data.logo_url || data.url;
        } catch (error) {
            console.warn('Upload de logo no disponible, usando base64');
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
    }
    
    // =====================================================
    // EDICIÓN - GUARDAR CAMBIOS
    // =====================================================
    
    window.saveBusinessChanges = async function(event) {
        event.preventDefault();
        if (!editTarget) return;
        
        const btn = document.getElementById('btnSaveChanges');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Guardando...';
        SoundSystem.play('click');
        
        try {
            const formData = {
                nombre_negocio: document.getElementById('editNombre').value.trim(),
                descripcion: document.getElementById('editDescripcion').value.trim(),
                categoria: document.getElementById('editCategoria').value,
                ciudad: document.getElementById('editCiudad').value.trim(),
                direccion: document.getElementById('editDireccion').value.trim(),
                telefono: document.getElementById('editTelefono').value.trim(),
                whatsapp: document.getElementById('editWhatsapp').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                sitio_web: document.getElementById('editSitioWeb').value.trim(),
                slug: document.getElementById('editSlug').value.trim().toLowerCase(),
                color_tema: document.getElementById('editColorTema').value,
                tiene_pagina: document.getElementById('editTienePagina').checked,
                perfil_publico: document.getElementById('editPerfilPublico').checked,
                video_portafolio: document.getElementById('editVideoPortafolio').value.trim(),
                horario_atencion: buildHorarioObject(),
                redes_sociales: buildRedesSocialesObject()
            };
            
            // Validaciones
            if (!formData.nombre_negocio) { showToast('El nombre del negocio es requerido', 'error'); btn.disabled = false; btn.innerHTML = originalContent; return; }
            if (!formData.categoria) { showToast('La categoría es requerida', 'error'); btn.disabled = false; btn.innerHTML = originalContent; return; }
            if (formData.slug && !/^[a-z0-9\-]+$/.test(formData.slug)) { showToast('El slug solo puede contener letras minúsculas, números y guiones', 'error'); btn.disabled = false; btn.innerHTML = originalContent; return; }
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { showToast('El correo electrónico no es válido', 'error'); btn.disabled = false; btn.innerHTML = originalContent; return; }
            
            // Logo
            if (newLogoFile) {
                try {
                    showToast('Subiendo logo...', 'info');
                    formData.logo_url = await uploadLogo(newLogoFile, editTarget.id);
                } catch (error) {
                    console.error('Error subiendo logo:', error);
                    showToast('Error al subir el logo, pero se guardarán los demás cambios', 'warning');
                }
            } else if (editTarget.removeLogo) {
                formData.logo_url = null;
            }
            
            const response = await HttpClient.put(CONFIG.ENDPOINTS.NEGOCIO(editTarget.id), formData);
            if (response.success === false) throw new Error(response.error || 'Error al actualizar el negocio');
            
            // Actualizar estado local
            const index = state.negocios.findIndex(n => String(n.id || n.id_negocio || n._id) === String(editTarget.id));
            if (index !== -1) {
                state.negocios[index] = { ...state.negocios[index], ...formData, nombre: formData.nombre_negocio };
                if (String(state.negocioActivoId) === String(editTarget.id)) {
                    localStorage.setItem('negocio_nombre', formData.nombre_negocio);
                    if (formData.slug) localStorage.setItem('negocio_slug', formData.slug);
                }
            }
            
            closeEditModal();
            SoundSystem.play('success');
            showToast(`"${formData.nombre_negocio}" actualizado correctamente`, 'success');
            populateCategoryFilter();
            filterAndRender();
            updateStats();
            
        } catch (error) {
            console.error('Error guardando cambios:', error);
            SoundSystem.play('error');
            showToast(error.message || 'Error al guardar los cambios', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };
    
    // =====================================================
    // ACCIONES: VER SUCURSALES, ACTIVAR SITIO, ELIMINAR
    // =====================================================
    
    window.viewBranches = function(id) {
        SoundSystem.play('click');
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (negocio) {
            localStorage.setItem('negocio_id', id);
            localStorage.setItem('negocio_nombre', negocio.nombre_negocio || negocio.nombre);
        }
        if (window.parent?.createAndActivateTab) {
            window.parent.createAndActivateTab('Mis Sucursales', 'modulos/mis_sucursales.html');
        } else {
            showToast('Navegando a sucursales...', 'info');
        }
    };
    
    window.activateSite = function(id) {
        SoundSystem.play('click');
        showToast('Función de micrositio próximamente', 'info');
    };
    
    let deleteTarget = null;
    
    window.deleteBusiness = function(id, nombre) {
        SoundSystem.play('click');
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (!negocio) return;
        
        deleteTarget = { id, nombre, negocio };
        const icon = getIcon(negocio.categoria);
        const gradient = gradients[state.negocios.indexOf(negocio) % gradients.length];
        const isService = negocio.tipo === 'servicio';
        
        document.getElementById('deleteTargetName').textContent = nombre;
        document.getElementById('deleteTargetType').textContent = isService ? '👤 Servicio' : '🏢 Negocio';
        
        const iconEl = document.getElementById('deleteTargetIcon');
        iconEl.className = `target-icon ${gradient}`;
        iconEl.innerHTML = `<i class="bi ${icon}"></i>`;
        
        openDeleteModal();
    };
    
    window.openDeleteModal = function() {
        const modal = document.getElementById('deleteModal');
        if (modal) { modal.classList.add('active'); SoundSystem.play('whoosh'); }
    };
    
    window.closeDeleteModal = function() {
        const modal = document.getElementById('deleteModal');
        if (modal) { modal.classList.remove('active'); deleteTarget = null; }
    };
    
    window.confirmDelete = async function() {
        if (!deleteTarget) return;
        const btn = document.getElementById('btnConfirmDelete');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Eliminando...';
        SoundSystem.play('click');
        
        try {
            await HttpClient.delete(CONFIG.ENDPOINTS.NEGOCIO(deleteTarget.id));
            state.negocios = state.negocios.filter(n => String(n.id || n.id_negocio || n._id) !== String(deleteTarget.id));
            
            if (String(state.negocioActivoId) === String(deleteTarget.id)) {
                if (state.negocios.length > 0) {
                    const firstId = state.negocios[0].id || state.negocios[0].id_negocio || state.negocios[0]._id;
                    state.negocioActivoId = firstId;
                    localStorage.setItem('negocio_id', firstId);
                    localStorage.setItem('negocio_nombre', state.negocios[0].nombre_negocio || state.negocios[0].nombre);
                } else {
                    state.negocioActivoId = null;
                    localStorage.removeItem('negocio_id');
                    localStorage.removeItem('negocio_nombre');
                }
            }
            
            closeDeleteModal();
            SoundSystem.play('success');
            showToast(`"${deleteTarget.nombre}" eliminado correctamente`, 'success');
            populateCategoryFilter();
            filterAndRender();
            updateStats();
        } catch (error) {
            SoundSystem.play('error');
            showToast(error.message || 'Error al eliminar el negocio', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };
    
    window.clearFilters = function() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('filterCategory').value = '';
        SoundSystem.play('click');
        filterAndRender();
    };
    
    // =====================================================
    // FUNCIÓN viewProfile
    // =====================================================
    
    window.viewProfile = function(id) {
        SoundSystem.play('click');
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (!negocio) { showToast('Negocio no encontrado', 'error'); return; }
        if (!negocio.slug) { showToast('Este negocio no tiene perfil público configurado', 'warning'); return; }
        
        const currentUserId = Auth.getUserId();
        const negocioUserId = negocio.usuario_id || negocio.id_usuario || negocio.owner_id;
        const isOwner = currentUserId && String(currentUserId) === String(negocioUserId);
        const isInMisNegocios = true;
        const baseUrl = 'negocio/negocio_perfil.html';
        
        if (isOwner || isInMisNegocios) {
            const iframePath = `${baseUrl}?slug=${negocio.slug}&mode=edit&owner=true`;
            if (window.parent?.createAndActivateTab) {
                window.parent.createAndActivateTab(`Perfil: ${negocio.nombre_negocio || negocio.nombre}`, iframePath);
            } else if (window.createAndActivateTab) {
                window.createAndActivateTab(`Perfil: ${negocio.nombre_negocio || negocio.nombre}`, iframePath);
            } else {
                window.location.href = iframePath;
            }
            showToast('Abriendo perfil en modo edición...', 'info');
        } else {
            const publicUrl = `https://tuko.pages.dev/negocio/negocio_perfil.html?slug=${negocio.slug}`;
            window.open(publicUrl, '_blank');
        }
    };
    
    window.previewProfileAsPublic = function(id) {
        SoundSystem.play('click');
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (!negocio || !negocio.slug) { showToast('Este negocio no tiene perfil público configurado', 'warning'); return; }
        const publicUrl = `https://tuko.pages.dev/negocio/negocio_perfil.html?slug=${negocio.slug}`;
        window.open(publicUrl, '_blank');
        showToast('Abriendo vista pública del perfil...', 'info');
    };
    
    // =====================================================
    // QR MODAL
    // =====================================================
    
    let qrTarget = null;
    
    window.showQRModal = async function(id) {
        const negocio = state.negocios.find(n => String(n.id || n.id_negocio || n._id) === String(id));
        if (!negocio) return;
        qrTarget = { id, negocio };
        SoundSystem.play('click');
        
        const nombre = negocio.nombre_negocio || negocio.nombre;
        const slug = negocio.slug;
        
        document.getElementById('qrNegocioName').textContent = nombre;
        document.getElementById('qrPublicUrl').textContent = slug ? `tuko.pages.dev/negocio/${slug}` : 'Sin URL configurada';
        document.getElementById('qrPublicUrl').href = slug ? `https://tuko.pages.dev/negocio/negocio_perfil.html?slug=${slug}` : '#';
        
        const qrImage = document.getElementById('qrImage');
        const qrLoading = document.getElementById('qrLoading');
        const qrError = document.getElementById('qrError');
        const qrActions = document.getElementById('qrActions');
        
        qrImage.classList.add('d-none');
        qrError.classList.add('d-none');
        qrLoading.classList.remove('d-none');
        qrActions.classList.add('d-none');
        
        document.getElementById('qrModal').classList.add('active');
        SoundSystem.play('whoosh');
        
        if (!slug) {
            qrLoading.classList.add('d-none');
            qrError.classList.remove('d-none');
            qrError.querySelector('p').textContent = 'Este negocio no tiene slug configurado. Activa la página web primero.';
            return;
        }
        
        try {
            const response = await HttpClient.get(`/negocio/${id}/qr?format=base64`);
            if (response.success && response.data) {
                qrImage.src = response.data.base64;
                qrImage.classList.remove('d-none');
                qrActions.classList.remove('d-none');
                SoundSystem.play('success');
            } else {
                throw new Error(response.error || 'Error al generar QR');
            }
        } catch (error) {
            console.error('Error cargando QR:', error);
            qrError.classList.remove('d-none');
            qrError.querySelector('p').textContent = error.message || 'No se pudo cargar el código QR';
            SoundSystem.play('error');
        } finally {
            qrLoading.classList.add('d-none');
        }
    };
    
    window.closeQRModal = function() {
        document.getElementById('qrModal').classList.remove('active');
        qrTarget = null;
    };
    
    window.downloadQR = async function() {
        if (!qrTarget) return;
        SoundSystem.play('click');
        const btn = document.getElementById('btnDownloadQR');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Descargando...';
        
        try {
            const url = `${CONFIG.API_BASE}/negocio/${qrTarget.id}/qr/download`;
            const response = await fetch(url, { method: 'GET', headers: Auth.getAuthHeaders(), credentials: 'include' });
            if (!response.ok) throw new Error('Error al descargar');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `QR_${qrTarget.negocio.nombre_negocio || 'negocio'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            SoundSystem.play('success');
            showToast('QR descargado correctamente', 'success');
        } catch (error) {
            console.error('Error descargando QR:', error);
            SoundSystem.play('error');
            showToast('Error al descargar el QR', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };
    
    window.copyQRUrl = function() {
        if (!qrTarget || !qrTarget.negocio.slug) return;
        const url = `https://tuko.pages.dev/negocio/negocio_perfil.html?slug=${qrTarget.negocio.slug}`;
        navigator.clipboard.writeText(url).then(() => {
            SoundSystem.play('success');
            showToast('URL copiada al portapapeles', 'success');
        }).catch(() => {
            SoundSystem.play('error');
            showToast('No se pudo copiar la URL', 'error');
        });
    };
    
    window.shareQR = async function() {
        if (!qrTarget || !qrTarget.negocio.slug) return;
        const url = `https://tuko.pages.dev/negocio/negocio_perfil.html?slug=${qrTarget.negocio.slug}`;
        const nombre = qrTarget.negocio.nombre_negocio || qrTarget.negocio.nombre;
        if (navigator.share) {
            try {
                await navigator.share({ title: nombre, text: `Visita ${nombre} en TuKomercio`, url: url });
                SoundSystem.play('success');
            } catch (err) {
                if (err.name !== 'AbortError') copyQRUrl();
            }
        } else {
            copyQRUrl();
        }
    };
    
    window.createNewBusiness = function() {
        SoundSystem.play('click');
        if (window.parent?.createAndActivateTab) {
            window.parent.createAndActivateTab('Nuevo Emprendimiento', 'modulos_crear_tienda/registrar_negocio.html');
        } else {
            window.location.href = 'registrar_negocio.html';
        }
    };
    
    window.redirectToLogin = function() {
        if (window.parent?.createAndActivateTab) {
            window.parent.createAndActivateTab('Iniciar Sesión', 'modulos/login.html');
        } else {
            window.location.href = 'login.html';
        }
    };
    
    // =====================================================
    // CAMBIO DE VISTA
    // =====================================================
    
    function switchView(view) {
        state.currentView = view;
        SoundSystem.play('whoosh');
        const grid = document.getElementById('businessesGrid');
        const table = document.getElementById('tableView');
        const btnGrid = document.getElementById('btnViewGrid');
        const btnTable = document.getElementById('btnViewTable');
        
        if (view === 'grid') {
            grid.classList.remove('d-none'); table.classList.add('d-none');
            btnGrid.classList.add('active'); btnTable.classList.remove('active');
        } else {
            grid.classList.add('d-none'); table.classList.remove('d-none');
            btnGrid.classList.remove('active'); btnTable.classList.add('active');
        }
        filterAndRender();
    }
    
    // =====================================================
    // CARGA DE DATOS
    // =====================================================
    
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    }
    
    async function loadBusinesses() {
        if (state.isLoading) return;
        state.isLoading = true;
        
        const refreshBtn = document.getElementById('btnRefresh');
        if (refreshBtn) refreshBtn.classList.add('loading');
        
        showSkeletons();
        updateConnectionStatus('checking');
        
        try {
            if (!Auth.isAuthenticated()) {
                document.getElementById('authWarning').style.display = 'flex';
                updateConnectionStatus('offline');
                hideLoadingOverlay();
                showErrorState('Debes iniciar sesión para ver tus negocios', false);
                return;
            }
            
            document.getElementById('authWarning').style.display = 'none';
            let response = await HttpClient.get(CONFIG.ENDPOINTS.MIS_NEGOCIOS);
            if (response.success === false) throw new Error(response.error || 'Error del servidor');
            
            let negociosData = [];
            if (Array.isArray(response)) negociosData = response;
            else if (response.data && Array.isArray(response.data)) negociosData = response.data;
            else if (response.negocios && Array.isArray(response.negocios)) negociosData = response.negocios;
            else if (response.results && Array.isArray(response.results)) negociosData = response.results;
            
            state.negocios = negociosData;
            
            if (!state.negocioActivoId && state.negocios.length > 0) {
                const firstId = state.negocios[0].id || state.negocios[0].id_negocio || state.negocios[0]._id;
                const firstName = state.negocios[0].nombre_negocio || state.negocios[0].nombre;
                state.negocioActivoId = firstId;
                localStorage.setItem('negocio_id', firstId);
                localStorage.setItem('negocio_nombre', firstName);
                
                // Refrescar featureGate con el negocio recién asignado
                if (window.parent?.TukoGate) {
                    window.parent.TukoGate.refresh();
                } else if (window.TukoGate) {
                    window.TukoGate.refresh();
                }
            }
            
            updateConnectionStatus('online');
            hideLoadingOverlay();
            populateCategoryFilter();
            filterAndRender();
            updateStats();
            
            if (state.negocios.length > 0) {
                setTimeout(() => SoundSystem.play('success'), 300);
                showToast(`${state.negocios.length} negocio(s) cargado(s)`, 'success');
            }
        } catch (error) {
            updateConnectionStatus('offline');
            hideLoadingOverlay();
            
            let errorMessage = 'No se pudieron cargar los negocios';
            if (error.status === 401) {
                errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                Auth.clearSession();
                document.getElementById('authWarning').style.display = 'flex';
            } else if (error.status === 403) errorMessage = 'No tienes permiso para ver estos negocios';
            else if (error.offline) errorMessage = 'Sin conexión a internet';
            else if (error.timeout) errorMessage = 'El servidor tardó demasiado en responder';
            else if (error.message) errorMessage = error.message;
            
            SoundSystem.play('error');
            showToast(errorMessage, 'error');
            showErrorState(errorMessage);
        } finally {
            state.isLoading = false;
            if (refreshBtn) refreshBtn.classList.remove('loading');
        }
    }
    
    window.loadBusinesses = loadBusinesses;
    
    // =====================================================
    // INICIALIZACIÓN
    // =====================================================
    
    function initScrollToTop() {
        const btn = document.getElementById('scrollTopBtn');
        if (!btn) return;
        window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
        btn.addEventListener('click', () => {
            SoundSystem.play('whoosh');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    function initEditModalListeners() {
        const toggleTienePagina = document.getElementById('editTienePagina');
        if (toggleTienePagina) {
            toggleTienePagina.addEventListener('change', function() {
                updateToggleLabel('editTienePagina', 'toggleTienePaginaLabel', 'Activada', 'Desactivada');
            });
        }
        
        const togglePerfilPublico = document.getElementById('editPerfilPublico');
        if (togglePerfilPublico) {
            togglePerfilPublico.addEventListener('change', function() {
                updateToggleLabel('editPerfilPublico', 'togglePerfilPublicoLabel', 'Visible', 'Oculto');
            });
        }
        
        const descTextarea = document.getElementById('editDescripcion');
        if (descTextarea) descTextarea.addEventListener('input', updateCharCount);
        
        const colorInput = document.getElementById('editColorTema');
        if (colorInput) {
            colorInput.addEventListener('input', function() {
                document.getElementById('colorValue').textContent = this.value;
            });
        }
        
        const editModal = document.getElementById('editModal');
        if (editModal) {
            editModal.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal-overlay')) closeEditModal();
            });
        }
        
        const slugInput = document.getElementById('editSlug');
        if (slugInput) {
            slugInput.addEventListener('input', function() {
                this.value = this.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
            });
        }
        
        const videoInput = document.getElementById('editVideoPortafolio');
        if (videoInput) videoInput.addEventListener('input', debounce(previewVideo, 500));
    }
    
    function init() {
        console.log('🚀 Command Center - Mis Negocios v2.7 (FeatureGate Ready)');
        console.log('📡 API Base:', CONFIG.API_BASE);
        
        SoundSystem.init();
        generateStars();
        updateDebugPanel();
        
        document.getElementById('btnSoundToggle')?.addEventListener('click', () => SoundSystem.toggle());
        document.getElementById('btnNuevoNegocio')?.addEventListener('click', createNewBusiness);
        document.getElementById('btnRefresh')?.addEventListener('click', () => loadBusinesses());
        document.getElementById('btnViewGrid')?.addEventListener('click', () => switchView('grid'));
        document.getElementById('btnViewTable')?.addEventListener('click', () => switchView('table'));
        document.getElementById('fabCreate')?.addEventListener('click', createNewBusiness);
        
        document.getElementById('searchInput')?.addEventListener('input', debounce(filterAndRender, 300));
        document.getElementById('filterType')?.addEventListener('change', filterAndRender);
        document.getElementById('filterCategory')?.addEventListener('change', filterAndRender);
        
        document.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape') { closeDeleteModal(); closeQRModal(); closeEditModal(); }
        });
        
        document.getElementById('deleteModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) closeDeleteModal();
        });
        document.getElementById('qrModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) closeQRModal();
        });
        
        initEditModalListeners();
        initScrollToTop();
        loadBusinesses();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.BizFlowDebug = { state, CONFIG, Auth, HttpClient, loadBusinesses, SoundSystem, showToast, getBizContext };
})();