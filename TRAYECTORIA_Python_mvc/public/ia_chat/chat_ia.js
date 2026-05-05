/**
 * DORA IA — TuKomercio
 * Asistente inteligente para tenderos colombianos
 * Powered by Groq (Llama 3) via /api/ia/*
 */

const API_BASE = "https://trayectoria-backend.onrender.com/api";

const DoraIA = (() => {
    const STORAGE_KEY = 'dora_chat_history';
    const MAX_HISTORY = 20; // max mensajes en contexto

    let conversationHistory = [];
    let isThinking = false;
    let negocioCtx = { nombre: null, tipo: null, id: null };

    // ── Init ──────────────────────────────────────────────────────────────
    function init() {
        loadNegocioContext();
        loadHistory();
        setupInput();

        if (conversationHistory.length === 0) {
            showWelcome();
        } else {
            renderHistory();
            document.getElementById('suggestedPrompts').classList.add('hidden');
        }

        // Si viene desde la búsqueda global con un tool específico
        const pendingTool = localStorage.getItem('dora_open_tool');
        if (pendingTool) {
            localStorage.removeItem('dora_open_tool');
            setTimeout(() => openTool(pendingTool), 400);
        }
    }

    function loadNegocioContext() {
        try {
            const ctx = window.parent?.bizContext?.getContexto?.() || null;
            if (ctx) {
                negocioCtx.nombre = ctx.negocio_nombre || null;
                negocioCtx.tipo = ctx.tipo_negocio || null;
                negocioCtx.id = ctx.negocio_id || ctx.id_negocio || null;
            }
        } catch(e) {}

        if (!negocioCtx.nombre) {
            negocioCtx.nombre = localStorage.getItem('negocio_nombre') || null;
            negocioCtx.tipo = localStorage.getItem('negocio_tipo') || null;
        }
        if (!negocioCtx.id) {
            negocioCtx.id = localStorage.getItem('negocio_id') || localStorage.getItem('id_negocio') || null;
        }
    }

    function loadHistory() {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) conversationHistory = JSON.parse(saved);
        } catch(e) { conversationHistory = []; }
    }

    function saveHistory() {
        try {
            const trimmed = conversationHistory.slice(-MAX_HISTORY);
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch(e) {}
    }

    // ── Welcome message ────────────────────────────────────────────────────
    function showWelcome() {
        const name = negocioCtx.nombre ? ` de **${negocioCtx.nombre}**` : '';
        const hora = new Date().getHours();
        const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

        appendBotMessage(`${saludo}! 👋 Soy **Dora IA**, tu asistente de TuKomercio${name}.\n\nPuedo ayudarte con tu tienda, generar descripciones de productos, crear avisos, clasificar gastos y mucho más. ¿En qué te ayudo hoy?`);
    }

    function renderHistory() {
        conversationHistory.forEach(msg => {
            if (msg.role === 'user') appendUserBubble(msg.content);
            else if (msg.role === 'assistant') appendBotBubble(msg.content);
        });
    }

    // ── Input setup ────────────────────────────────────────────────────────
    function setupInput() {
        const input = document.getElementById('messageInput');
        const btn = document.getElementById('sendMessageButton');

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });
    }

    // ── Detección de intención de stock ───────────────────────────────────
    function detectStockIntent(text) {
        const re = /(?:actualiz[ao]|cambi[ao]|pon(?:er)?|ajust[ao]|modific[ao]|sube|baj[ao])\s+(?:el\s+)?stock\s+(?:de\s+)?(.+?)\s+(?:a|en|:)\s*(\d+)/i;
        const match = text.match(re);
        if (match) return { nombre: match[1].trim(), cantidad: parseInt(match[2]) };
        // "stock de X: Y" o "X tiene Y en stock"
        const re2 = /stock\s+de\s+(.+?)(?:\s+a|\s+en|\s*:)\s*(\d+)/i;
        const m2 = text.match(re2);
        if (m2) return { nombre: m2[1].trim(), cantidad: parseInt(m2[2]) };
        return null;
    }

    async function handleStockUpdate(nombre, cantidad) {
        const typingEl = appendTypingIndicator();
        try {
            const res = await fetch(`${API_BASE}/ia/buscar-producto`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, negocio_id: negocioCtx.id })
            });
            removeTyping(typingEl);
            const data = await res.json();

            if (!data.productos || data.productos.length === 0) {
                appendBotMessage(`No encontré ningún producto con el nombre **"${nombre}"** en tu inventario. ¿Puedes escribir el nombre exacto?`);
                return;
            }

            // Si hay varios productos, mostrar opciones; si es uno, confirmar directo
            const producto = data.productos[0];
            appendStockConfirmCard(producto, cantidad);
        } catch(e) {
            removeTyping(typingEl);
            appendBotMessage(`⚠️ Error buscando el producto: ${e.message}`);
        }
    }

    function appendStockConfirmCard(producto, nuevaCantidad) {
        const area = document.getElementById('messageArea');
        const card = document.createElement('div');
        card.className = 'message-container bot-message';
        card.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="message-content">
                <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin-top:4px;">
                    <p style="margin:0 0 8px;font-weight:600;">📦 Confirmar cambio de stock</p>
                    <p style="margin:0 0 4px;font-size:0.9em;">Producto: <strong>${escapeHtml(producto.nombre)}</strong></p>
                    <p style="margin:0 0 4px;font-size:0.9em;">Stock actual: <strong>${producto.stock}</strong> unidades</p>
                    <p style="margin:0 0 12px;font-size:0.9em;">Nuevo stock: <strong style="color:#a855f7;">${nuevaCantidad}</strong> unidades</p>
                    <div style="display:flex;gap:8px;">
                        <button onclick="window.DoraConfirmarStock(${producto.id}, ${nuevaCantidad})"
                            style="background:#a855f7;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;">
                            ✅ Confirmar
                        </button>
                        <button onclick="this.closest('.message-container').remove()"
                            style="background:rgba(255,255,255,0.1);color:#ccc;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>`;
        area.appendChild(card);
        scrollBottom();
    }

    async function confirmarStock(productoId, nuevoStock) {
        const typingEl = appendTypingIndicator();
        try {
            const res = await fetch(`${API_BASE}/ia/actualizar-stock`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producto_id: productoId, nuevo_stock: nuevoStock, negocio_id: negocioCtx.id })
            });
            removeTyping(typingEl);
            const data = await res.json();
            if (data.ok) {
                appendBotMessage(`✅ Listo, el stock de **${data.producto}** fue actualizado: ${data.stock_anterior} → **${data.stock_nuevo}** unidades.`);
                // Eliminar la card de confirmación
                document.querySelector('.message-container:last-of-type')?.previousElementSibling?.remove();
            } else {
                appendBotMessage(`⚠️ No se pudo actualizar: ${data.error}`);
            }
        } catch(e) {
            removeTyping(typingEl);
            appendBotMessage(`⚠️ Error actualizando el stock: ${e.message}`);
        }
    }

    // Exponer para los botones inline
    window.DoraConfirmarStock = confirmarStock;

    // ── Send message ───────────────────────────────────────────────────────
    async function send() {
        if (isThinking) return;

        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';

        document.getElementById('suggestedPrompts').classList.add('hidden');

        appendUserBubble(text);
        conversationHistory.push({ role: 'user', content: text });
        saveHistory();

        // Detectar intención de actualizar stock
        const stockIntent = detectStockIntent(text);
        if (stockIntent) {
            setThinking(true);
            await handleStockUpdate(stockIntent.nombre, stockIntent.cantidad);
            setThinking(false);
            return;
        }

        setThinking(true);
        const typingEl = appendTypingIndicator();

        try {
            const messages = conversationHistory.slice(-MAX_HISTORY);
            const response = await fetch(`${API_BASE}/ia/chat`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    negocio_nombre: negocioCtx.nombre,
                    negocio_tipo: negocioCtx.tipo,
                    negocio_id: negocioCtx.id
                })
            });

            removeTyping(typingEl);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Error ${response.status}`);
            }

            const data = await response.json();
            const reply = data.reply || '(Sin respuesta)';

            conversationHistory.push({ role: 'assistant', content: reply });
            saveHistory();
            appendBotMessage(reply);

        } catch(err) {
            removeTyping(typingEl);
            const msg = err.message.includes('Failed to fetch')
                ? 'Sin conexión con el servidor. Verifica que el backend esté activo.'
                : err.message;
            appendBotMessage(`⚠️ ${msg}`);
        } finally {
            setThinking(false);
        }
    }

    function sendQuick(text) {
        document.getElementById('messageInput').value = text;
        send();
    }

    // ── UI helpers ─────────────────────────────────────────────────────────
    function appendUserBubble(text) {
        const area = document.getElementById('messageArea');
        const el = document.createElement('div');
        el.className = 'message-container user-message';
        el.innerHTML = `
            <div class="avatar">Tú</div>
            <div class="message-content">${escapeHtml(text)}</div>`;
        area.appendChild(el);
        scrollBottom();
    }

    function appendBotBubble(text) {
        const area = document.getElementById('messageArea');
        const el = document.createElement('div');
        el.className = 'message-container bot-message';
        el.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="message-content">${renderMarkdown(text)}</div>`;
        area.appendChild(el);
        scrollBottom();
        return el;
    }

    function appendBotMessage(text) {
        return appendBotBubble(text);
    }

    function appendTypingIndicator() {
        const area = document.getElementById('messageArea');
        const el = document.createElement('div');
        el.className = 'message-container bot-message typing-indicator';
        el.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="message-content">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>`;
        area.appendChild(el);
        scrollBottom();
        return el;
    }

    function removeTyping(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function setThinking(val) {
        isThinking = val;
        const btn = document.getElementById('sendMessageButton');
        const dot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        btn.disabled = val;
        if (val) {
            dot.classList.add('thinking');
            statusText.textContent = 'Pensando...';
        } else {
            dot.classList.remove('thinking');
            statusText.textContent = 'Lista para ayudarte';
        }
    }

    function scrollBottom() {
        const area = document.getElementById('messageArea');
        setTimeout(() => { area.scrollTop = area.scrollHeight; }, 50);
    }

    function clearChat() {
        conversationHistory = [];
        sessionStorage.removeItem(STORAGE_KEY);
        document.getElementById('messageArea').innerHTML = '';
        document.getElementById('suggestedPrompts').classList.remove('hidden');
        showWelcome();
        showToast('Chat limpiado ✨');
    }

    function showToast(msg) {
        const existing = document.querySelector('.dora-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'dora-toast';
        toast.textContent = msg;
        document.getElementById('chatInterface').appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    // ── Mini-markdown renderer ─────────────────────────────────────────────
    function renderMarkdown(text) {
        return escapeHtml(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Tool modals ────────────────────────────────────────────────────────
    function openTool(tool) {
        const modal = document.getElementById('doraTool');
        const content = document.getElementById('doraToolContent');

        const tools = {
            describir: {
                titulo: '✏️ Describir Producto',
                html: `
                    <h3 style="color:#c084fc;margin-bottom:16px;font-size:16px;">✏️ Generar descripción de producto</h3>
                    <input id="t-nombre" placeholder="Nombre del producto *" style="${inputStyle()}">
                    <input id="t-precio" placeholder="Precio (ej: $15.000)" style="${inputStyle()}">
                    <input id="t-categoria" placeholder="Categoría (ej: Bebidas, Snacks...)" style="${inputStyle()}">
                    <textarea id="t-detalles" placeholder="Detalles adicionales (opcional)" rows="2" style="${inputStyle()}resize:vertical;"></textarea>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button onclick="DoraIA.runTool('describir')" style="${btnStyle('#7c3aed','#a855f7')}">Generar ✨</button>
                        <button onclick="DoraIA.closeTool()" style="${btnStyle('#333','#444')}">Cancelar</button>
                    </div>
                    <div id="tool-result" style="margin-top:12px;"></div>`,
            },
            promo: {
                titulo: '📣 Crear Aviso',
                html: `
                    <h3 style="color:#c084fc;margin-bottom:16px;font-size:16px;">📣 Generar texto de aviso o banner</h3>
                    <textarea id="t-contexto" placeholder="¿Qué quieres promocionar? (ej: 'Descuento del 30% en lácteos este fin de semana')" rows="3" style="${inputStyle()}resize:vertical;"></textarea>
                    <select id="t-tipo" style="${inputStyle()}">
                        <option value="banner">Banner principal</option>
                        <option value="promo">Aviso de promoción</option>
                        <option value="WhatsApp">Mensaje de WhatsApp</option>
                        <option value="redes sociales">Publicación de redes sociales</option>
                    </select>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button onclick="DoraIA.runTool('promo')" style="${btnStyle('#7c3aed','#a855f7')}">Crear ✨</button>
                        <button onclick="DoraIA.closeTool()" style="${btnStyle('#333','#444')}">Cancelar</button>
                    </div>
                    <div id="tool-result" style="margin-top:12px;"></div>`,
            },
            gasto: {
                titulo: '🧾 Clasificar Gasto',
                html: `
                    <h3 style="color:#c084fc;margin-bottom:16px;font-size:16px;">🧾 Clasificar gasto contable</h3>
                    <input id="t-gasto" placeholder="Describe el gasto (ej: 'Pago domicilio proveedor frutas')" style="${inputStyle()}">
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button onclick="DoraIA.runTool('gasto')" style="${btnStyle('#7c3aed','#a855f7')}">Clasificar ✨</button>
                        <button onclick="DoraIA.closeTool()" style="${btnStyle('#333','#444')}">Cancelar</button>
                    </div>
                    <div id="tool-result" style="margin-top:12px;"></div>`,
            },
            precio: {
                titulo: '💰 Sugerir Precio',
                html: `
                    <h3 style="color:#c084fc;margin-bottom:16px;font-size:16px;">💰 Sugerir precio de venta</h3>
                    <input id="t-nombre" placeholder="Nombre del producto *" style="${inputStyle()}">
                    <input id="t-costo" placeholder="Costo de compra (ej: $8.500)" style="${inputStyle()}">
                    <input id="t-categoria" placeholder="Categoría (ej: Lácteos, Bebidas...)" style="${inputStyle()}">
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button onclick="DoraIA.runTool('precio')" style="${btnStyle('#10b981','#059669')}">Calcular 💰</button>
                        <button onclick="DoraIA.closeTool()" style="${btnStyle('#333','#444')}">Cancelar</button>
                    </div>
                    <div id="tool-result" style="margin-top:12px;"></div>`,
            },
            campana: {
                titulo: '🌟 Campaña Completa',
                html: `
                    <h3 style="color:#c084fc;margin-bottom:16px;font-size:16px;">🌟 Generador de Campaña Completa</h3>
                    <p style="color:#8888aa;font-size:12px;margin-bottom:12px;">Genera en un clic: banner · WhatsApp · Instagram · precio promo · consejo táctico</p>
                    <input id="t-producto" placeholder="¿Qué vas a promocionar? *" style="${inputStyle()}">
                    <input id="t-precio-actual" placeholder="Precio actual (opcional, ej: $12.000)" style="${inputStyle()}">
                    <select id="t-objetivo" style="${inputStyle()}">
                        <option value="vender más">Vender más en general</option>
                        <option value="liquidar inventario">Liquidar inventario</option>
                        <option value="atraer clientes nuevos">Atraer clientes nuevos</option>
                        <option value="aumentar ticket promedio">Aumentar ticket promedio</option>
                        <option value="celebrar una fecha especial">Fecha especial / temporada</option>
                    </select>
                    <input id="t-publico" placeholder="¿A quién va? (ej: familias, jóvenes, mamás)" style="${inputStyle()}">
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button onclick="DoraIA.runTool('campana')" style="${btnStyle('#7c3aed','#ec4899')}">Generar campaña 🌟</button>
                        <button onclick="DoraIA.closeTool()" style="${btnStyle('#333','#444')}">Cancelar</button>
                    </div>
                    <div id="tool-result" style="margin-top:12px;"></div>`,
            },
        };

        if (!tools[tool]) return;
        content.innerHTML = tools[tool].html;
        modal.style.display = 'flex';

        // focus first input
        setTimeout(() => content.querySelector('input,textarea')?.focus(), 100);
    }

    async function runTool(tool) {
        const resultEl = document.getElementById('tool-result');
        resultEl.innerHTML = `<div style="color:#a855f7;font-size:13px;">Generando... ✨</div>`;

        try {
            let url, body;

            if (tool === 'describir') {
                url = `${API_BASE}/ia/describir-producto`;
                body = {
                    nombre: document.getElementById('t-nombre')?.value?.trim() || '',
                    precio: document.getElementById('t-precio')?.value?.trim() || '',
                    categoria: document.getElementById('t-categoria')?.value?.trim() || '',
                    detalles: document.getElementById('t-detalles')?.value?.trim() || ''
                };
                if (!body.nombre) { resultEl.innerHTML = '<span style="color:#f87171">Ingresa el nombre del producto</span>'; return; }
            } else if (tool === 'promo') {
                url = `${API_BASE}/ia/generar-promo`;
                body = {
                    contexto: document.getElementById('t-contexto')?.value?.trim() || '',
                    tipo: document.getElementById('t-tipo')?.value || 'banner'
                };
                if (!body.contexto) { resultEl.innerHTML = '<span style="color:#f87171">Describe qué quieres promocionar</span>'; return; }
            } else if (tool === 'gasto') {
                url = `${API_BASE}/ia/clasificar-gasto`;
                body = { descripcion: document.getElementById('t-gasto')?.value?.trim() || '' };
                if (!body.descripcion) { resultEl.innerHTML = '<span style="color:#f87171">Describe el gasto</span>'; return; }
            } else if (tool === 'precio') {
                url = `${API_BASE}/ia/sugerir-precio`;
                body = {
                    nombre: document.getElementById('t-nombre')?.value?.trim() || '',
                    costo: document.getElementById('t-costo')?.value?.trim() || '',
                    categoria: document.getElementById('t-categoria')?.value?.trim() || '',
                };
                if (!body.nombre) { resultEl.innerHTML = '<span style="color:#f87171">Ingresa el nombre del producto</span>'; return; }
            } else if (tool === 'campana') {
                url = `${API_BASE}/ia/generar-campana`;
                body = {
                    producto: document.getElementById('t-producto')?.value?.trim() || '',
                    precio_actual: document.getElementById('t-precio-actual')?.value?.trim() || '',
                    objetivo: document.getElementById('t-objetivo')?.value || 'vender más',
                    publico: document.getElementById('t-publico')?.value?.trim() || 'clientes habituales',
                };
                if (!body.producto) { resultEl.innerHTML = '<span style="color:#f87171">¿Qué vas a promocionar?</span>'; return; }
            }

            const resp = await fetch(url, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) throw new Error(`Error ${resp.status}`);
            const data = await resp.json();

            if (tool === 'describir') {
                resultEl.innerHTML = toolResultCard('Descripción generada', data.descripcion, true);
            } else if (tool === 'promo') {
                resultEl.innerHTML = toolResultCard('Texto del aviso', data.texto, true);
            } else if (tool === 'gasto') {
                resultEl.innerHTML = `
                    <div class="tool-result-card">
                        <div class="result-label">Categoría</div>
                        <div class="result-category">${escapeHtml(data.categoria)}</div>
                        <div class="result-text" style="font-size:12px;color:#8888aa;">${escapeHtml(data.razon)}</div>
                    </div>`;
            } else if (tool === 'precio') {
                const pid = 'p-' + Math.random().toString(36).slice(2);
                resultEl.innerHTML = `
                    <div class="tool-result-card">
                        <div class="result-label">Precio sugerido</div>
                        <div style="font-size:22px;font-weight:800;color:#10b981;margin:4px 0" id="${pid}">${escapeHtml(data.precio_sugerido)}</div>
                        <div class="result-label" style="margin-top:8px">Rango del mercado</div>
                        <div class="result-text">${escapeHtml(data.rango)}</div>
                        <div class="result-text" style="font-size:11px;color:#8888aa;margin-top:6px">${escapeHtml(data.razon)}</div>
                        <button class="copy-btn" onclick="DoraIA.copyText('${pid}')">📋 Copiar precio</button>
                    </div>`;
            } else if (tool === 'campana') {
                const fields = [
                    { label: '🖼️ Banner', val: data.banner, key: 'banner' },
                    { label: '💬 WhatsApp', val: data.whatsapp, key: 'whatsapp' },
                    { label: '📸 Instagram', val: data.instagram, key: 'instagram' },
                    { label: '🏷️ Precio Promo', val: data.precio_promo, key: 'precio_promo' },
                    { label: '🎯 Consejo táctico', val: data.consejo, key: 'consejo' },
                ];
                resultEl.innerHTML = `<div class="tool-result-card">
                    <div class="result-label" style="font-size:12px;margin-bottom:10px">🌟 Campaña generada</div>
                    ${fields.filter(f => f.val).map(f => {
                        const fid = 'c-' + Math.random().toString(36).slice(2);
                        return `<div style="margin-bottom:10px">
                            <div class="result-label">${escapeHtml(f.label)}</div>
                            <div class="result-text" id="${fid}">${escapeHtml(f.val)}</div>
                            <button class="copy-btn" onclick="DoraIA.copyText('${fid}')">📋 Copiar</button>
                        </div>`;
                    }).join('')}
                </div>`;
            }

        } catch(err) {
            resultEl.innerHTML = `<span style="color:#f87171;font-size:13px;">⚠️ ${escapeHtml(err.message)}</span>`;
        }
    }

    function toolResultCard(label, text, withCopy = false) {
        const id = 'trc-' + Math.random().toString(36).slice(2);
        return `<div class="tool-result-card">
            <div class="result-label">${escapeHtml(label)}</div>
            <div class="result-text" id="${id}">${escapeHtml(text)}</div>
            ${withCopy ? `<button class="copy-btn" onclick="DoraIA.copyText('${id}')">📋 Copiar</button>` : ''}
        </div>`;
    }

    function copyText(id) {
        const el = document.getElementById(id);
        if (!el) return;
        navigator.clipboard.writeText(el.textContent).then(() => showToast('¡Copiado! 📋'));
    }

    function closeTool() {
        document.getElementById('doraTool').style.display = 'none';
    }

    // Close modal on backdrop click
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('doraTool');
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeTool(); });
        init();
    });

    // ── Style helpers ──────────────────────────────────────────────────────
    function inputStyle() {
        return 'width:100%;background:#1a1a2e;border:1px solid rgba(168,85,247,0.2);border-radius:10px;color:#e8e8f0;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;margin-bottom:8px;display:block;';
    }
    function btnStyle(from, to) {
        return `flex:1;padding:9px;border:none;border-radius:10px;background:linear-gradient(135deg,${from},${to});color:#fff;font-size:13px;cursor:pointer;font-weight:600;`;
    }

    return { send, sendQuick, clearChat, openTool, runTool, closeTool, copyText };
})();
