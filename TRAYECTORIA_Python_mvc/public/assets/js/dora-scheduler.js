/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        DORA SCHEDULER — TuKomercio                      ║
 * ║  Notificaciones inteligentes y proactivas de Dora IA    ║
 * ║  Configurable por el usuario · Powered by Groq          ║
 * ╚══════════════════════════════════════════════════════════╝
 */

(function () {
    'use strict';

    const API    = (window.APP_CONFIG?.API_BASE_URL) || 'https://trayectoria-backend.onrender.com/api';
    const CFG_KEY = 'dora_scheduler_cfg';
    const PURPLE  = '#a855f7';

    // ── Configuración por defecto ──────────────────────────────────────────
    const DEFAULTS = {
        habilitado:         false,
        intervalo_min:      60,        // minutos entre notificaciones
        hora_inicio:        '08:00',
        hora_fin:           '21:00',
        tipos: {
            ventas:     true,
            inventario: true,
            tips:       true,
            fechas:     true,
            motivacion: false,
            sabias_que: true,          // ★ tips de funcionalidades de TuKomercio
        },
        primera_vez:        true,
        ultima_notif:       null,      // ISO timestamp
        total_enviadas:     0,
        sabias_que_idx:     0,         // índice rotativo del pool
    };

    // ── Prompts por tipo de sugerencia ────────────────────────────────────
    const PROMPTS = {
        ventas:     'Dame un tip concreto y accionable para aumentar las ventas HOY en una tienda colombiana de barrio. Máximo 2 oraciones.',
        inventario: 'Dame un consejo de gestión de inventario para una tienda colombiana pequeña. Algo que muchos tenderos ignoran y les cuesta plata. Máximo 2 oraciones.',
        tips:       'Dame un consejo de negocio práctico para un tendero colombiano que usa TuKomercio. Que sea sorprendente o poco conocido. Máximo 2 oraciones.',
        fechas:     `¿Qué fecha especial, temporada o evento colombiano se aproxima en ${new Date().toLocaleString('es-CO',{month:'long'})} que un tendero debería aprovechar para vender más? Da un consejo específico. Máximo 2 oraciones.`,
        motivacion: 'Escribe un mensaje motivador y auténtico para un tendero colombiano que trabaja duro todos los días. Que sea cálido, en español colombiano. Máximo 2 oraciones.',
    };

    const TIPO_LABELS = {
        ventas:     { icon: '📈', label: 'Consejo de ventas' },
        inventario: { icon: '📦', label: 'Gestión de inventario' },
        tips:       { icon: '💡', label: 'Tip de negocio' },
        fechas:     { icon: '📅', label: 'Fecha importante' },
        motivacion: { icon: '🔥', label: 'Motivación' },
        sabias_que: { icon: '✨', label: '¿Sabías que...?' },
    };

    // ── Pool estático de "¿Sabías que...?" — giran sin llamar al API ────────
    // Estos datos hablan de funcionalidades REALES de TuKomercio
    const SABIAS_QUE_POOL = [
        '¿Sabías que en TuKomercio puedes crear cupones de descuento para tus clientes? Puedes poner código, porcentaje o valor fijo, fecha de vencimiento y límite de usos — todo desde tu panel.',
        '¿Sabías que tus clientes pueden dejarte reseñas con estrellas directamente en tu tienda? Las reseñas de compradores verificados se publican automáticamente y aumentan la confianza de nuevos compradores.',
        '¿Sabías que tu tienda online en TuKomercio tiene una URL propia? Compártela por WhatsApp o redes y tus clientes pueden ver y comprar tus productos 24/7 sin que estés presente.',
        '¿Sabías que puedes configurar cuánto cobra cada transportadora a cada ciudad? Así el sistema le muestra al comprador el precio exacto del envío al momento del checkout.',
        '¿Sabías que puedes activar la opción de "Recoger en tienda" (pickup) en el checkout? Es gratis para el cliente y te ahorra el costo del envío en ventas locales.',
        '¿Sabías que cada pedido de tu tienda genera automáticamente un mensaje de WhatsApp listo para enviarle al cliente? Solo haces clic y ya va con todos los detalles del pedido.',
        '¿Sabías que tus clientes pueden rastrear su pedido en tiempo real? Cuando marcas un pedido como "enviado" y pones el número de guía, el cliente recibe un enlace con toda la info y el estado actualizado.',
        '¿Sabías que puedes subir tu logo animado en GIF a la tienda? La tienda lo muestra en movimiento — es una forma sencilla de destacar tu marca.',
        '¿Sabías que Dora puede escanear tu inventario y detectar productos mal categorizados? Solo haz clic en "Escanear productos" en el módulo de Inventario PRO.',
        '¿Sabías que puedes importar productos de proveedores masivamente con CSV? Defines tu margen de ganancia y Dora aplica el precio de venta automáticamente.',
        '¿Sabías que puedes registrar "prospectos" — clientes que dijeron "llámame después"? TuKomercio te recuerda cuándo tienes que hacer el seguimiento con una alerta de colores.',
        '¿Sabías que el módulo de Punto de Venta te permite cobrar en el local sin necesidad de internet? Registras la venta, descuenta el stock y queda en tu contabilidad al instante.',
        '¿Sabías que en tu tienda puedes mostrar badges automáticos en los productos como "🔥 Popular", "🆕 Nuevo" o "⚠️ Última unidad"? Se activan desde el Diseñador de Tienda.',
        '¿Sabías que las reseñas de clientes que realmente compraron se marcan con "Compra verificada ✓"? Eso le da mucha más credibilidad a tu tienda ante compradores nuevos.',
        '¿Sabías que puedes crear cupones de temporada para fechas especiales? Amor y Amistad, Navidad, Black Friday... un buen cupón a tiempo puede multiplicar tus ventas.',
        '¿Sabías que TuKomercio tiene un sistema de gamificación? Completa retos, gana insignias y sube de nivel como tendero en la plataforma.',
        '¿Sabías que puedes configurar envío gratis automático cuando el pedido supera cierto monto? Es una táctica comprobada para que los clientes agreguen más productos al carrito.',
        '¿Sabías que la página de confirmación de pedido que ve tu cliente también muestra productos sugeridos de tu tienda? Es cross-sell automático sin que hagas nada extra.',
        '¿Sabías que puedes personalizar los colores, fuente y banners de tu tienda libremente? No necesitas saber de diseño — el Diseñador de Tienda lo hace visual y sencillo.',
        '¿Sabías que Dora IA puede escribirte la descripción completa de un producto en segundos? Solo dile el nombre y ella genera un texto atractivo y optimizado para vender.',
    ];

    // ── Estado ─────────────────────────────────────────────────────────────
    let cfg = loadCfg();
    let timerId = null;
    let notifQueue = [];

    function loadCfg() {
        try {
            const saved = localStorage.getItem(CFG_KEY);
            return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
        } catch { return { ...DEFAULTS }; }
    }

    function saveCfg() {
        localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    }

    // ── Inyectar estilos ──────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('dora-sched-styles')) return;
        const s = document.createElement('style');
        s.id = 'dora-sched-styles';
        s.textContent = `
        /* ── Notificación flotante ── */
        .dora-notif {
            position: fixed; bottom: 28px; right: 28px; z-index: 99999;
            width: 340px; background: #13131f;
            border: 1px solid rgba(168,85,247,0.35);
            border-left: 4px solid #a855f7;
            border-radius: 16px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(168,85,247,0.1);
            font-family: 'Segoe UI', system-ui, sans-serif;
            overflow: hidden;
            animation: dora-notif-in 0.4s cubic-bezier(.34,1.56,.64,1);
            transform-origin: bottom right;
        }
        @keyframes dora-notif-in {
            from { opacity:0; transform: scale(0.8) translateY(20px); }
            to   { opacity:1; transform: scale(1)   translateY(0); }
        }
        .dora-notif.saliendo {
            animation: dora-notif-out 0.3s ease-in forwards;
        }
        @keyframes dora-notif-out {
            to { opacity:0; transform: scale(0.85) translateY(16px); }
        }
        .dora-notif-header {
            display: flex; align-items: center; gap: 10px;
            padding: 12px 14px 10px;
            background: rgba(168,85,247,0.07);
            border-bottom: 1px solid rgba(168,85,247,0.12);
        }
        .dora-notif-avatar {
            width: 32px; height: 32px; border-radius: 50%;
            background: linear-gradient(135deg,#7c3aed,#a855f7);
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; flex-shrink: 0;
            box-shadow: 0 0 12px rgba(168,85,247,0.4);
        }
        .dora-notif-meta { flex: 1; }
        .dora-notif-titulo {
            font-size: 12px; font-weight: 700;
            color: #c084fc; letter-spacing: 0.3px;
        }
        .dora-notif-subtitulo { font-size: 11px; color: #8888aa; margin-top: 1px; }
        .dora-notif-close {
            background: transparent; border: none;
            color: #8888aa; cursor: pointer; font-size: 16px;
            padding: 2px 4px; border-radius: 4px; line-height: 1;
            transition: color 0.2s;
        }
        .dora-notif-close:hover { color: #e8e8f0; }
        .dora-notif-body {
            padding: 14px 16px;
            font-size: 13.5px; line-height: 1.6; color: #e8e8f0;
        }
        .dora-notif-progress {
            height: 3px; background: rgba(168,85,247,0.15);
        }
        .dora-notif-progress-bar {
            height: 100%;
            background: linear-gradient(90deg,#7c3aed,#a855f7);
            animation: dora-progress var(--dur,8s) linear forwards;
        }
        @keyframes dora-progress { from{width:100%} to{width:0} }
        .dora-notif-footer {
            display: flex; gap: 8px; padding: 0 14px 12px;
        }
        .dora-notif-btn {
            flex: 1; padding: 7px; border-radius: 9px;
            font-size: 12px; font-weight: 600; cursor: pointer;
            border: none; transition: all 0.2s;
        }
        .dora-notif-btn.primary {
            background: linear-gradient(135deg,#7c3aed,#a855f7);
            color: #fff;
        }
        .dora-notif-btn.secondary {
            background: rgba(255,255,255,0.06);
            color: #8888aa; border: 1px solid rgba(255,255,255,0.08);
        }
        .dora-notif-btn:hover { opacity: 0.85; }

        /* ── Modal de configuración ── */
        #doraSchedOverlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.65);
            backdrop-filter: blur(6px);
            z-index: 99998; display: none;
            align-items: center; justify-content: center;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        #doraSchedOverlay.open { display: flex; }
        #doraSchedModal {
            background: #13131f;
            border: 1px solid rgba(168,85,247,0.25);
            border-radius: 22px;
            width: 90%; max-width: 480px;
            max-height: 90vh; overflow-y: auto;
            box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            animation: dora-notif-in 0.3s ease-out;
        }
        #doraSchedModal::-webkit-scrollbar { width: 4px; }
        #doraSchedModal::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 4px; }
        .dsm-header {
            display: flex; align-items: center; gap: 12px;
            padding: 22px 24px 16px;
            border-bottom: 1px solid rgba(168,85,247,0.12);
        }
        .dsm-avatar-big {
            width: 48px; height: 48px; border-radius: 50%;
            background: linear-gradient(135deg,#7c3aed,#a855f7);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; flex-shrink: 0;
            box-shadow: 0 0 20px rgba(168,85,247,0.4);
        }
        .dsm-header h2 { color: #e8e8f0; font-size: 17px; font-weight: 800; }
        .dsm-header p  { color: #8888aa; font-size: 12px; margin-top: 2px; }
        .dsm-close {
            margin-left: auto; background: transparent; border: none;
            color: #8888aa; font-size: 22px; cursor: pointer; padding: 4px;
            transition: color 0.2s;
        }
        .dsm-close:hover { color: #e8e8f0; }
        .dsm-body { padding: 20px 24px; }
        .dsm-section { margin-bottom: 22px; }
        .dsm-label {
            font-size: 11px; font-weight: 700; color: #a855f7;
            text-transform: uppercase; letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .dsm-toggle-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px;
            background: rgba(168,85,247,0.06);
            border: 1px solid rgba(168,85,247,0.15);
            border-radius: 12px;
        }
        .dsm-toggle-info h4 { color: #e8e8f0; font-size: 14px; }
        .dsm-toggle-info p  { color: #8888aa; font-size: 12px; margin-top: 2px; }
        .dsm-switch {
            position: relative; width: 48px; height: 26px; flex-shrink: 0;
        }
        .dsm-switch input { opacity: 0; width: 0; height: 0; }
        .dsm-slider {
            position: absolute; inset: 0; cursor: pointer;
            background: #2d2d45; border-radius: 13px;
            transition: background 0.3s;
        }
        .dsm-slider::before {
            content: ''; position: absolute;
            width: 20px; height: 20px; border-radius: 50%;
            background: #fff; left: 3px; top: 3px;
            transition: transform 0.3s;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input:checked + .dsm-slider { background: #a855f7; }
        input:checked + .dsm-slider::before { transform: translateX(22px); }

        .dsm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dsm-select, .dsm-time {
            width: 100%; background: #1a1a2e;
            border: 1px solid rgba(168,85,247,0.2);
            border-radius: 10px; color: #e8e8f0;
            padding: 10px 12px; font-size: 13px;
            font-family: inherit; outline: none;
            transition: border-color 0.2s;
        }
        .dsm-select:focus, .dsm-time:focus { border-color: #a855f7; }
        .dsm-time::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }

        .dsm-chips-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .dsm-tipo-chip {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 12px;
            background: rgba(168,85,247,0.05);
            border: 1px solid rgba(168,85,247,0.15);
            border-radius: 10px; cursor: pointer;
            transition: all 0.2s; user-select: none;
        }
        .dsm-tipo-chip:hover { border-color: #a855f7; background: rgba(168,85,247,0.1); }
        .dsm-tipo-chip.activo {
            background: rgba(168,85,247,0.15);
            border-color: #a855f7;
        }
        .dsm-tipo-chip input { display: none; }
        .dsm-tipo-icon { font-size: 16px; }
        .dsm-tipo-label { font-size: 12px; color: #e8e8f0; font-weight: 500; }

        .dsm-footer { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 10px; }
        .dsm-btn-primary {
            width: 100%; padding: 13px; border-radius: 12px;
            background: linear-gradient(135deg,#7c3aed,#a855f7);
            color: #fff; border: none; font-size: 14px;
            font-weight: 700; cursor: pointer; transition: opacity 0.2s;
        }
        .dsm-btn-primary:hover { opacity: 0.88; }
        .dsm-btn-test {
            width: 100%; padding: 11px; border-radius: 12px;
            background: rgba(168,85,247,0.08);
            border: 1px solid rgba(168,85,247,0.2);
            color: #c084fc; font-size: 13px; cursor: pointer;
            font-family: inherit; transition: all 0.2s;
        }
        .dsm-btn-test:hover { background: rgba(168,85,247,0.15); }
        .dsm-stats {
            display: flex; gap: 8px; flex-wrap: wrap;
            padding: 12px 14px;
            background: rgba(168,85,247,0.05);
            border-radius: 10px; margin-top: 4px;
        }
        .dsm-stat { font-size: 12px; color: #8888aa; }
        .dsm-stat strong { color: #c084fc; }

        /* ── Onboarding card ── */
        .dora-onboard {
            position: fixed; bottom: 28px; right: 28px; z-index: 99999;
            width: 360px; background: #13131f;
            border: 1px solid rgba(168,85,247,0.35);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            font-family: 'Segoe UI', system-ui, sans-serif;
            animation: dora-notif-in 0.45s cubic-bezier(.34,1.56,.64,1);
            overflow: hidden;
        }
        .dora-onboard-hero {
            background: linear-gradient(135deg,#1a0a2e,#13131f);
            padding: 24px; text-align: center;
            border-bottom: 1px solid rgba(168,85,247,0.15);
        }
        .dora-onboard-robot {
            width: 64px; height: 64px; border-radius: 50%;
            background: linear-gradient(135deg,#7c3aed,#a855f7);
            margin: 0 auto 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 32px;
            box-shadow: 0 0 30px rgba(168,85,247,0.5);
            animation: dora-onboard-pulse 2.5s ease-in-out infinite;
        }
        @keyframes dora-onboard-pulse {
            0%,100%{ box-shadow: 0 0 30px rgba(168,85,247,0.5); }
            50%     { box-shadow: 0 0 50px rgba(168,85,247,0.8); }
        }
        .dora-onboard-hero h3 {
            color: #e8e8f0; font-size: 16px; font-weight: 800; margin-bottom: 6px;
        }
        .dora-onboard-hero p { color: #8888aa; font-size: 13px; line-height: 1.5; }
        .dora-onboard-body { padding: 18px 20px; }
        .dora-preview-item {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
            font-size: 12.5px; color: #c8c8d8; line-height: 1.4;
        }
        .dora-preview-item:last-child { border: none; }
        .dora-preview-item .pi-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .dora-onboard-footer { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 8px; }
        `;
        document.head.appendChild(s);
    }

    // ── Onboarding (primera vez) ──────────────────────────────────────────
    function mostrarOnboarding() {
        if (!cfg.primera_vez) return;
        const card = document.createElement('div');
        card.className = 'dora-onboard';
        card.id = 'doraOnboard';
        card.innerHTML = `
            <div class="dora-onboard-hero">
                <div class="dora-onboard-robot">🤖</div>
                <h3>¡Hola! Soy Dora IA 👋</h3>
                <p>Puedo enviarte sugerencias inteligentes mientras trabajas en tu tienda — ventas, inventario, tips del mercado colombiano y más.</p>
            </div>
            <div class="dora-onboard-body">
                <div class="dora-preview-item">
                    <span class="pi-icon">📈</span>
                    <span><strong style="color:#e8e8f0">Consejos de ventas</strong> en el momento justo del día</span>
                </div>
                <div class="dora-preview-item">
                    <span class="pi-icon">📅</span>
                    <span><strong style="color:#e8e8f0">Fechas y temporadas</strong> colombianas que puedes aprovechar</span>
                </div>
                <div class="dora-preview-item">
                    <span class="pi-icon">💡</span>
                    <span><strong style="color:#e8e8f0">Tips de negocio</strong> que los tenderos exitosos aplican</span>
                </div>
                <div class="dora-preview-item">
                    <span class="pi-icon">⏰</span>
                    <span>Tú decides <strong style="color:#e8e8f0">cada cuánto</strong> y en qué horario</span>
                </div>
            </div>
            <div class="dora-onboard-footer">
                <button class="dsm-btn-primary" onclick="DoraScheduler.abrirConfig(); document.getElementById('doraOnboard').remove();">
                    ✨ Configurar mis alertas
                </button>
                <button class="dsm-btn-test" onclick="document.getElementById('doraOnboard').remove(); DoraScheduler._marcarVisto();">
                    Ahora no
                </button>
            </div>`;
        document.body.appendChild(card);
    }

    // ── Modal de configuración ────────────────────────────────────────────
    function buildModal() {
        if (document.getElementById('doraSchedOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'doraSchedOverlay';
        overlay.innerHTML = `
        <div id="doraSchedModal">
            <div class="dsm-header">
                <div class="dsm-avatar-big">🤖</div>
                <div>
                    <h2>Dora IA · Alertas inteligentes</h2>
                    <p>Configura cuándo y cómo quieres recibir sugerencias</p>
                </div>
                <button class="dsm-close" onclick="DoraScheduler.cerrarConfig()">✕</button>
            </div>
            <div class="dsm-body">

                <!-- Toggle principal -->
                <div class="dsm-section">
                    <div class="dsm-toggle-row">
                        <div class="dsm-toggle-info">
                            <h4>Alertas de Dora activas</h4>
                            <p>Recibir sugerencias inteligentes mientras trabajas</p>
                        </div>
                        <label class="dsm-switch">
                            <input type="checkbox" id="ds-habilitado">
                            <span class="dsm-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Frecuencia y horario -->
                <div class="dsm-section" id="ds-opciones">
                    <div class="dsm-label">Frecuencia y horario</div>
                    <div class="dsm-grid">
                        <div>
                            <div style="font-size:12px;color:#8888aa;margin-bottom:6px;">Cada cuánto</div>
                            <select id="ds-intervalo" class="dsm-select">
                                <option value="15">Cada 15 minutos</option>
                                <option value="30">Cada 30 minutos</option>
                                <option value="60" selected>Cada hora</option>
                                <option value="120">Cada 2 horas</option>
                                <option value="240">Cada 4 horas</option>
                                <option value="480">Cada 8 horas</option>
                                <option value="1440">Una vez al día</option>
                            </select>
                        </div>
                        <div>
                            <div style="font-size:12px;color:#8888aa;margin-bottom:6px;">Solo entre</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <input type="time" id="ds-hora-inicio" class="dsm-time" value="08:00">
                                <span style="color:#8888aa;font-size:12px">y</span>
                                <input type="time" id="ds-hora-fin" class="dsm-time" value="21:00">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tipos de sugerencias -->
                <div class="dsm-section" id="ds-tipos-section">
                    <div class="dsm-label">Qué tipo de sugerencias quieres</div>
                    <div class="dsm-chips-grid" id="ds-tipos-grid">
                        ${Object.entries(TIPO_LABELS).map(([key, t]) => `
                        <label class="dsm-tipo-chip ${cfg.tipos[key] ? 'activo' : ''}" data-tipo="${key}">
                            <input type="checkbox" id="ds-tipo-${key}" ${cfg.tipos[key] ? 'checked' : ''}>
                            <span class="dsm-tipo-icon">${t.icon}</span>
                            <span class="dsm-tipo-label">${t.label}</span>
                        </label>`).join('')}
                    </div>
                </div>

                <!-- Estadísticas -->
                <div class="dsm-stats">
                    <div class="dsm-stat">Enviadas: <strong id="ds-stat-total">0</strong></div>
                    <div class="dsm-stat">·</div>
                    <div class="dsm-stat">Última: <strong id="ds-stat-ultima">Nunca</strong></div>
                    <div class="dsm-stat">·</div>
                    <div class="dsm-stat">Próxima: <strong id="ds-stat-proxima">—</strong></div>
                </div>

            </div>
            <div class="dsm-footer">
                <button class="dsm-btn-primary" onclick="DoraScheduler.guardar()">
                    Guardar configuración ✓
                </button>
                <button class="dsm-btn-test" onclick="DoraScheduler.probar()">
                    🤖 Recibir una sugerencia ahora
                </button>
            </div>
        </div>`;

        overlay.addEventListener('click', e => { if (e.target === overlay) cerrarConfig(); });
        document.body.appendChild(overlay);

        // Chip toggles — skip the synthetic checkbox click the browser fires after the label click
        document.getElementById('ds-tipos-grid').addEventListener('click', e => {
            if (e.target.tagName === 'INPUT') return;
            const chip = e.target.closest('.dsm-tipo-chip');
            if (!chip) return;
            chip.classList.toggle('activo');
            chip.querySelector('input').checked = chip.classList.contains('activo');
        });

        // Toggle principal muestra/oculta opciones
        document.getElementById('ds-habilitado').addEventListener('change', e => {
            document.getElementById('ds-opciones').style.opacity       = e.target.checked ? '1' : '0.4';
            document.getElementById('ds-tipos-section').style.opacity  = e.target.checked ? '1' : '0.4';
        });

        sincronizarModal();
    }

    function sincronizarModal() {
        const hab = document.getElementById('ds-habilitado');
        if (!hab) return;
        hab.checked = cfg.habilitado;
        document.getElementById('ds-intervalo').value    = cfg.intervalo_min;
        document.getElementById('ds-hora-inicio').value  = cfg.hora_inicio;
        document.getElementById('ds-hora-fin').value     = cfg.hora_fin;

        document.getElementById('ds-stat-total').textContent   = cfg.total_enviadas;
        document.getElementById('ds-stat-ultima').textContent  = cfg.ultima_notif
            ? new Date(cfg.ultima_notif).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
            : 'Nunca';
        document.getElementById('ds-stat-proxima').textContent = calcProxima();

        Object.keys(TIPO_LABELS).forEach(key => {
            const cb   = document.getElementById(`ds-tipo-${key}`);
            const chip = document.querySelector(`.dsm-tipo-chip[data-tipo="${key}"]`);
            if (cb && chip) {
                cb.checked = !!cfg.tipos[key];
                chip.classList.toggle('activo', !!cfg.tipos[key]);
            }
        });

        document.getElementById('ds-opciones').style.opacity       = cfg.habilitado ? '1' : '0.4';
        document.getElementById('ds-tipos-section').style.opacity  = cfg.habilitado ? '1' : '0.4';
    }

    function calcProxima() {
        if (!cfg.habilitado || !cfg.ultima_notif) return 'Al activar';
        const ultima = new Date(cfg.ultima_notif);
        const prox   = new Date(ultima.getTime() + cfg.intervalo_min * 60000);
        const ahora  = new Date();
        if (prox <= ahora) return 'Muy pronto';
        const diff = Math.round((prox - ahora) / 60000);
        return `en ~${diff} min`;
    }

    function abrirConfig() {
        buildModal();
        sincronizarModal();
        document.getElementById('doraSchedOverlay').classList.add('open');
    }

    function cerrarConfig() {
        document.getElementById('doraSchedOverlay')?.classList.remove('open');
    }

    function guardar() {
        cfg.habilitado      = document.getElementById('ds-habilitado').checked;
        cfg.intervalo_min   = parseInt(document.getElementById('ds-intervalo').value);
        cfg.hora_inicio     = document.getElementById('ds-hora-inicio').value;
        cfg.hora_fin        = document.getElementById('ds-hora-fin').value;
        cfg.primera_vez     = false;

        Object.keys(TIPO_LABELS).forEach(key => {
            cfg.tipos[key] = document.getElementById(`ds-tipo-${key}`)?.checked ?? false;
        });

        saveCfg();
        cerrarConfig();
        arrancarTimer();

        if (cfg.habilitado) {
            const inter = cfg.intervalo_min < 60
                ? `${cfg.intervalo_min} minutos`
                : `${cfg.intervalo_min / 60} hora${cfg.intervalo_min > 60 ? 's' : ''}`;
            mostrarNotifSimple('✅ ¡Configurado!', `Dora te enviará sugerencias cada ${inter} entre ${cfg.hora_inicio} y ${cfg.hora_fin}.`);
        }
    }

    // ── Temporizador ──────────────────────────────────────────────────────
    function arrancarTimer() {
        if (timerId) clearInterval(timerId);
        if (!cfg.habilitado) return;

        timerId = setInterval(intentarEnviar, 60 * 1000); // revisar cada minuto
        intentarEnviar(); // chequear inmediatamente al activar
    }

    function intentarEnviar() {
        if (!cfg.habilitado) return;

        const ahora = new Date();
        const [hI, mI] = cfg.hora_inicio.split(':').map(Number);
        const [hF, mF] = cfg.hora_fin.split(':').map(Number);
        const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
        const minInicio = hI * 60 + mI;
        const minFin    = hF * 60 + mF;

        if (minAhora < minInicio || minAhora > minFin) return; // fuera de horario

        if (cfg.ultima_notif) {
            const diff = (ahora - new Date(cfg.ultima_notif)) / 60000; // minutos
            if (diff < cfg.intervalo_min) return; // aún no es el momento
        }

        enviarSugerencia();
    }

    // ── Elegir tipo de sugerencia ─────────────────────────────────────────
    function elegirTipo() {
        const activos = Object.keys(cfg.tipos).filter(k => cfg.tipos[k]);
        if (activos.length === 0) return 'tips';
        return activos[Math.floor(Math.random() * activos.length)];
    }

    // ── Enviar sugerencia con Groq (o del pool estático) ─────────────────
    async function enviarSugerencia(tipo = null, esManual = false) {
        tipo = tipo || elegirTipo();
        const meta = TIPO_LABELS[tipo] || TIPO_LABELS.tips;

        // ★ "¿Sabías que...?" — pool estático, sin llamada API
        if (tipo === 'sabias_que') {
            const idx = (cfg.sabias_que_idx || 0) % SABIAS_QUE_POOL.length;
            const texto = SABIAS_QUE_POOL[idx];
            cfg.sabias_que_idx  = idx + 1;
            cfg.ultima_notif    = new Date().toISOString();
            cfg.total_enviadas  = (cfg.total_enviadas || 0) + 1;
            saveCfg();
            mostrarNotif(meta.icon, meta.label, texto, tipo);
            return;
        }

        const prompt = PROMPTS[tipo] || PROMPTS.tips;

        try {
            const resp = await fetch(`${API}/ia/contexto-modulo`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modulo: 'general',
                    pregunta: prompt,
                    negocio_nombre: localStorage.getItem('negocio_nombre'),
                    negocio_tipo:   localStorage.getItem('negocio_tipo'),
                })
            });

            if (!resp.ok) {
                if (esManual) mostrarNotifSimple('⚠️ Sin conexión', 'No pude conectar con el servidor. Verifica que el backend esté activo.');
                return;
            }
            const data = await resp.json();
            if (!data.reply) {
                if (esManual) mostrarNotifSimple('⚠️ Sin respuesta', 'Dora no respondió. Intenta de nuevo en un momento.');
                return;
            }

            cfg.ultima_notif   = new Date().toISOString();
            cfg.total_enviadas = (cfg.total_enviadas || 0) + 1;
            saveCfg();

            mostrarNotif(meta.icon, meta.label, data.reply, tipo);

        } catch (e) {
            if (esManual) mostrarNotifSimple('⚠️ Error de red', 'No se pudo conectar con Dora. Revisa tu conexión.');
        }
    }

    // ── Mostrar notificación flotante ─────────────────────────────────────
    function mostrarNotif(icon, titulo, texto, tipo) {
        // Máximo 1 notificación a la vez
        document.querySelectorAll('.dora-notif').forEach(n => n.remove());

        const DURACION = 12000; // ms
        const notif = document.createElement('div');
        notif.className = 'dora-notif';
        notif.innerHTML = `
            <div class="dora-notif-header">
                <div class="dora-notif-avatar">${icon}</div>
                <div class="dora-notif-meta">
                    <div class="dora-notif-titulo">Dora IA · ${titulo}</div>
                    <div class="dora-notif-subtitulo">${new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <button class="dora-notif-close" onclick="this.closest('.dora-notif').remove()">✕</button>
            </div>
            <div class="dora-notif-body">${escHtml(texto)}</div>
            <div class="dora-notif-footer">
                <button class="dora-notif-btn primary" onclick="DoraScheduler._abrirDora(); this.closest('.dora-notif').remove();">
                    💬 Preguntarle a Dora
                </button>
                <button class="dora-notif-btn secondary" onclick="this.closest('.dora-notif').remove();">
                    Listo, gracias
                </button>
            </div>
            <div class="dora-notif-progress">
                <div class="dora-notif-progress-bar" style="--dur:${DURACION/1000}s"></div>
            </div>`;

        document.body.appendChild(notif);

        setTimeout(() => {
            if (notif.parentNode) {
                notif.classList.add('saliendo');
                setTimeout(() => notif.remove(), 350);
            }
        }, DURACION);
    }

    function mostrarNotifSimple(titulo, texto) {
        mostrarNotif('✅', titulo, texto, 'tips');
    }

    // ── Botón de config en la UI principal ───────────────────────────────
    function inyectarBotonConfig() {
        // Busca la barra de acciones de la grilla o el header
        setTimeout(() => {
            const existente = document.getElementById('doraSchedFab');
            if (existente) return;

            const fab = document.createElement('button');
            fab.id = 'doraSchedFab';
            fab.title = 'Configurar alertas de Dora IA';
            fab.style.cssText = `
                position: fixed; bottom: 28px; left: 28px; z-index: 9998;
                background: rgba(168,85,247,0.12);
                border: 1px solid rgba(168,85,247,0.25);
                color: #c084fc; border-radius: 50px;
                padding: 8px 14px; font-size: 12px;
                font-family: 'Segoe UI',system-ui,sans-serif;
                cursor: pointer; display: flex; align-items: center; gap: 6px;
                transition: all 0.2s;
            `;
            fab.innerHTML = `<span>🤖</span><span>Alertas IA</span>`;
            fab.addEventListener('click', abrirConfig);
            fab.addEventListener('mouseenter', () => fab.style.background = 'rgba(168,85,247,0.22)');
            fab.addEventListener('mouseleave', () => fab.style.background = 'rgba(168,85,247,0.12)');
            document.body.appendChild(fab);
        }, 1000);
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    function escHtml(str) {
        return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function _marcarVisto() {
        cfg.primera_vez = false;
        saveCfg();
    }

    function _abrirDora() {
        const fn = window.createAndActivateTab || window.top?.createAndActivateTab;
        if (fn) fn('Dora IA', 'ia_chat/chat_ia.html');
        else window.open('/ia_chat/chat_ia.html', '_blank');
    }

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
        injectStyles();
        inyectarBotonConfig();
        arrancarTimer();

        // Mostrar onboarding si es la primera vez, después de 4 segundos
        if (cfg.primera_vez) {
            setTimeout(mostrarOnboarding, 4000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.DoraScheduler = {
        abrirConfig,
        cerrarConfig,
        guardar,
        probar: async () => {
            const btn = document.querySelector('.dsm-btn-test');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '⏳ Generando...';
                btn.disabled = true;
                await enviarSugerencia(null, true);
                btn.innerHTML = original;
                btn.disabled = false;
            } else {
                await enviarSugerencia(null, true);
            }
        },
        _marcarVisto,
        _abrirDora,
    };

})();
