/**
 * 🛒 TIENDA PÚBLICA - JS v5.7 CON BADGES v2.3
 * ★ SINCRONIZADO CON BACKEND v2.3 - Sistema de 9 Badges Manuales
 * ★ Los badges vienen calculados desde el backend (badges_data JSON)
 * ★ Store Designer controla VISIBILIDAD de badges (auto + manual)
 * ★ NUEVO v5.7: Soporte completo para 9 badges manuales
 * ★ Actualizado: 24 Enero 2026
 * 
 * BADGES AUTOMÁTICOS (calculados por backend):
 * - descuento, nuevo, ultima_unidad, agotado, mejor_valorado, popular
 * 
 * BADGES MANUALES (9 tipos - asignados en Inventario PRO):
 * - destacado, envio_gratis, pre_orden, edicion_limitada
 * - oferta_flash, combo, garantia_extendida, eco_friendly
 * - badge_personalizado (texto libre)
 */

const API_URL = 'https://trayectoria-backend.onrender.com/api';

// ==========================================
// ESTADO GLOBAL
// ==========================================
let tiendaConfig = {
    negocio_id: null,
    slug: null,
    nombre: 'Mi Tienda',
    color: '#2563eb',
    whatsapp: '',
    config_tienda: {}
};

let productos = [];
let carrito = [];
let currentSlide = 0;
let sidebarCollapsed = false;
let splashDismissed = false;
let sliderInterval = null;

// ★ v3.6 SCROLL INFINITO — estado de paginación frontend
let productosFiltrados = [];          // array filtrado actual (por categoría/búsqueda)
let paginaActual = 0;                 // página renderizada hasta el momento (0 = nada)
const ITEMS_POR_PAGINA = 36;          // productos por chunk al hacer scroll
let scrollObserver = null;            // IntersectionObserver activo

// Variables para GIFs rotativos
let splashImageRotationInterval = null;
let currentSplashImageIndex = 0;
let logoImageRotationInterval = null;
let currentLogoImageIndex = 0;

// Variable para video hover
let videoHoverTimeout = null;

// ==========================================
// MAPA DE ICONOS PARA CATEGORÍAS
// ==========================================
const iconMap = {
    // ── Grid / General ──
    'grid': 'fa-th-large',
    'list': 'fa-list',
    'tags': 'fa-tags',
    'tag': 'fa-tag',
    'bookmark': 'fa-bookmark',
    'flag': 'fa-flag',
    'check': 'fa-check-circle',
    'info': 'fa-info-circle',

    // ── Favoritos / Valoración ──
    'star': 'fa-star',
    'fire': 'fa-fire',
    'heart': 'fa-heart',
    'diamond': 'fa-gem',
    'crown': 'fa-crown',
    'medal': 'fa-medal',
    'trophy': 'fa-trophy',
    'award': 'fa-award',
    'thumbsup': 'fa-thumbs-up',

    // ── Descuentos / Ofertas ──
    'percent': 'fa-percent',
    'lightning': 'fa-bolt',
    'new': 'fa-certificate',
    'gift': 'fa-gift',
    'money': 'fa-money-bill-wave',
    'coins': 'fa-coins',
    'wallet': 'fa-wallet',
    'creditcard': 'fa-credit-card',

    // ── Compras / Tienda ──
    'box': 'fa-box',
    'boxes': 'fa-boxes',
    'bag': 'fa-shopping-bag',
    'cart': 'fa-shopping-cart',
    'store': 'fa-store',
    'receipt': 'fa-receipt',
    'barcode': 'fa-barcode',

    // ══════════════════════════════════════════════════
    // ★ VEHÍCULOS / MOVILIDAD (AMPLIADO)
    // ══════════════════════════════════════════════════
    'car': 'fa-car',
    'car_alt': 'fa-car-alt',
    'car_side': 'fa-car-side',
    'car_crash': 'fa-car-crash',
    'car_battery': 'fa-car-battery',
    'motorcycle': 'fa-motorcycle',
    'bicycle': 'fa-bicycle',
    'biking': 'fa-biking',
    'truck': 'fa-truck',
    'truck_loading': 'fa-truck-loading',
    'truck_moving': 'fa-truck-moving',
    'truck_pickup': 'fa-truck-pickup',
    'truck_monster': 'fa-truck-monster',
    'shuttle': 'fa-shuttle-van',
    'bus': 'fa-bus',
    'bus_alt': 'fa-bus-alt',
    'taxi': 'fa-taxi',
    'plane': 'fa-plane',
    'ship': 'fa-ship',
    'helicopter': 'fa-helicopter',
    'tractor': 'fa-tractor',
    'trailer': 'fa-trailer',
    'caravan': 'fa-caravan',
    'snowplow': 'fa-snowplow',
    'ambulance': 'fa-ambulance',

    // ── Combustible / Estación ──
    'gas': 'fa-gas-pump',
    'charging': 'fa-charging-station',
    'oil': 'fa-oil-can',
    'parking': 'fa-parking',

    // ── Carretera / Vías ──
    'road': 'fa-road',
    'route': 'fa-route',
    'directions': 'fa-directions',
    'traffic_light': 'fa-traffic-light',
    'map_signs': 'fa-map-signs',

    // ── Patinetas / Alternativo ──
    // FA Free no tiene patineta, usamos íconos cercanos:
    'skateboard': 'fa-skating',       // patineta → skating
    'scooter': 'fa-motorcycle',       // scooter → motorcycle
    'wheelchair': 'fa-wheelchair',     // movilidad reducida
    'walking': 'fa-walking',
    'running': 'fa-running',

    // ══════════════════════════════════════════════════
    // ★ SEGURIDAD VIAL (AMPLIADO)
    // ══════════════════════════════════════════════════
    'shield': 'fa-shield-alt',
    'helmet': 'fa-hard-hat',
    'cone': 'fa-exclamation-triangle',
    'vest': 'fa-vest',
    'vest_patches': 'fa-vest-patches',
    'eye': 'fa-eye',
    'eye_slash': 'fa-eye-slash',
    'bell_alert': 'fa-bell',
    'siren': 'fa-bullhorn',
    'first_aid': 'fa-first-aid',
    'fire_ext': 'fa-fire-extinguisher',
    'lock': 'fa-lock',
    'unlock': 'fa-unlock',
    'key': 'fa-key',
    'id_card': 'fa-id-card',
    'id_badge': 'fa-id-badge',
    'camera_sec': 'fa-video',
    'sign': 'fa-sign',
    'stop': 'fa-hand-paper',
    'ban': 'fa-ban',
    'caution': 'fa-radiation',
    'hazard': 'fa-biohazard',
    'hard_hat': 'fa-hard-hat',

    // ── Luces / Visibilidad ──
    'lightbulb': 'fa-lightbulb',
    'flashlight': 'fa-bolt',
    'sun_bright': 'fa-sun',
    'moon_night': 'fa-moon',
    'low_vision': 'fa-low-vision',
    'glasses_safety': 'fa-glasses',
    'searchlight': 'fa-search',
    'satellite_dish': 'fa-satellite-dish',
    'broadcast': 'fa-broadcast-tower',

    // ══════════════════════════════════════════════════
    // ★ HERRAMIENTAS (AMPLIADO)
    // ══════════════════════════════════════════════════
    'tools': 'fa-tools',
    'wrench': 'fa-wrench',
    'hammer': 'fa-hammer',
    'screwdriver': 'fa-screwdriver',
    'cog': 'fa-cog',
    'cogs': 'fa-cogs',
    'toolbox': 'fa-toolbox',
    'ruler': 'fa-ruler',
    'ruler_combined': 'fa-ruler-combined',
    'ruler_horizontal': 'fa-ruler-horizontal',
    'ruler_vertical': 'fa-ruler-vertical',
    'tape': 'fa-tape',
    'paintroller': 'fa-paint-roller',
    'paintbrush': 'fa-paint-brush',
    'broom': 'fa-broom',
    'drafting': 'fa-drafting-compass',
    'cut': 'fa-cut',
    'magnet': 'fa-magnet',
    'plug': 'fa-plug',
    'battery_full': 'fa-battery-full',
    'battery_half': 'fa-battery-half',
    'battery_empty': 'fa-battery-empty',
    'microscope': 'fa-microscope',
    'vial': 'fa-vial',
    'flask': 'fa-flask',
    'compress': 'fa-compress-arrows-alt',
    'expand': 'fa-expand-arrows-alt',
    'level': 'fa-level-up-alt',
    'weight': 'fa-weight-hanging',
    'balance': 'fa-balance-scale',
    'tachometer': 'fa-tachometer-alt',
    'thermometer': 'fa-thermometer-half',
    'fan': 'fa-fan',
    'power': 'fa-power-off',

    // ── Mecánica / Auto ──
    'car_mechanic': 'fa-car-alt',
    'tire': 'fa-circle-notch',         // rueda/llanta
    'gauge': 'fa-tachometer-alt',      // velocímetro/manómetro
    'engine': 'fa-cog',                // motor
    'piston': 'fa-cogs',              // pistón
    'chain': 'fa-link',               // cadena
    'spring': 'fa-compress-arrows-alt', // resorte/amortiguador
    'filter': 'fa-filter',            // filtro
    'funnel': 'fa-filter',
    'spray': 'fa-spray-can',          // spray/pintura
    'tape_measure': 'fa-tape',
    'compass_draw': 'fa-drafting-compass',

    // ══════════════════════════════════════════════════
    // ★ ACCESORIOS VEHÍCULOS (NUEVO)
    // ══════════════════════════════════════════════════
    'mirror': 'fa-clone',              // espejo
    'speaker': 'fa-volume-up',         // parlante/bocina
    'music_car': 'fa-music',           // audio carro
    'headset': 'fa-headset',           // audifonos
    'bluetooth': 'fa-bluetooth-b',     // bluetooth
    'usb': 'fa-usb',                   // USB
    'wifi': 'fa-wifi',                 // wifi
    'signal': 'fa-signal',             // señal
    'satellite': 'fa-satellite',       // GPS/satélite
    'map_pin': 'fa-map-marker-alt',    // ubicación GPS
    'compass': 'fa-compass',           // brújula
    'dashboard': 'fa-digital-tachograph', // tablero
    'display': 'fa-desktop',           // pantalla
    'solar': 'fa-solar-panel',         // panel solar
    'wind_power': 'fa-wind',           // ventilación
    'snowflake': 'fa-snowflake',       // A/C
    'temp_hot': 'fa-temperature-high', // temperatura alta
    'temp_cold': 'fa-temperature-low', // temperatura baja

    // ══════════════════════════════════════════════════
    // ★ BICICLETAS / CICLISMO (NUEVO)
    // ══════════════════════════════════════════════════
    'bike': 'fa-bicycle',
    'bike_rider': 'fa-biking',
    'wheel': 'fa-circle-notch',        // rueda
    'pump': 'fa-compress-arrows-alt',  // inflador
    'water_bottle': 'fa-wine-bottle',  // botella agua
    'backpack': 'fa-shopping-bag',     // morral
    'gloves': 'fa-hand-paper',         // guantes
    'stopwatch': 'fa-stopwatch',       // cronómetro
    'heartrate': 'fa-heartbeat',       // ritmo cardíaco

    // ── Ropa / Moda ──
    'shirt': 'fa-tshirt',
    'shoe': 'fa-shoe-prints',
    'glasses': 'fa-glasses',
    'hat': 'fa-hat-wizard',
    'ring': 'fa-ring',

    // ── Tecnología ──
    'phone': 'fa-mobile-alt',
    'laptop': 'fa-laptop',
    'desktop': 'fa-desktop',
    'tablet': 'fa-tablet-alt',
    'headphones': 'fa-headphones',
    'camera': 'fa-camera',
    'gamepad': 'fa-gamepad',
    'tv': 'fa-tv',
    'keyboard': 'fa-keyboard',
    'mouse': 'fa-mouse',
    'microchip': 'fa-microchip',
    'robot': 'fa-robot',
    'print': 'fa-print',
    'memory': 'fa-memory',
    'hdd': 'fa-hdd',
    'code': 'fa-code',

    // ── Hogar / Muebles ──
    'home': 'fa-home',
    'sofa': 'fa-couch',
    'lamp': 'fa-lightbulb',
    'kitchen': 'fa-utensils',
    'bed': 'fa-bed',
    'bath': 'fa-bath',
    'chair': 'fa-chair',
    'door': 'fa-door-open',
    'shower': 'fa-shower',
    'trash': 'fa-trash',
    'recycle': 'fa-recycle',
    'blender': 'fa-blender',

    // ── Belleza / Salud ──
    'sparkles': 'fa-magic',
    'pill': 'fa-pills',
    'fitness': 'fa-dumbbell',
    'spa': 'fa-spa',
    'heartbeat': 'fa-heartbeat',
    'syringe': 'fa-syringe',
    'stethoscope': 'fa-stethoscope',
    'tooth': 'fa-tooth',
    'brain': 'fa-brain',
    'swimmer': 'fa-swimmer',

    // ── Comida / Bebida ──
    'food': 'fa-hamburger',
    'pizza': 'fa-pizza-slice',
    'fruit': 'fa-apple-alt',
    'coffee': 'fa-coffee',
    'wine': 'fa-wine-glass-alt',
    'beer': 'fa-beer',
    'cocktail': 'fa-cocktail',
    'icecream': 'fa-ice-cream',
    'leaf': 'fa-leaf',
    'seedling': 'fa-seedling',
    'carrot': 'fa-carrot',
    'bread': 'fa-bread-slice',
    'cheese': 'fa-cheese',
    'fish': 'fa-fish',
    'pepper': 'fa-pepper-hot',
    'cookie': 'fa-cookie-bite',
    'utensils': 'fa-utensils',

    // ── Mascotas ──
    'pet': 'fa-paw',
    'dog': 'fa-dog',
    'cat': 'fa-cat',
    'horse': 'fa-horse',
    'dove': 'fa-dove',
    'bone': 'fa-bone',

    // ── Niños / Juguetes ──
    'baby': 'fa-baby',
    'toy': 'fa-puzzle-piece',
    'dice': 'fa-dice',
    'chess': 'fa-chess',
    'babycarriage': 'fa-baby-carriage',

    // ── Educación / Cultura ──
    'book': 'fa-book',
    'books': 'fa-book-open',
    'music': 'fa-music',
    'guitar': 'fa-guitar',
    'microphone': 'fa-microphone',
    'film': 'fa-film',
    'palette': 'fa-palette',
    'pen': 'fa-pen',
    'pencil': 'fa-pencil-alt',
    'graduation': 'fa-graduation-cap',
    'globe': 'fa-globe-americas',
    'newspaper': 'fa-newspaper',
    'theater': 'fa-theater-masks',

    // ── Deportes ──
    'sports': 'fa-futbol',
    'basketball': 'fa-basketball-ball',
    'football': 'fa-football-ball',
    'golf': 'fa-golf-ball',
    'hiking': 'fa-hiking',
    'mountain': 'fa-mountain',
    'campground': 'fa-campground',
    'skating': 'fa-skating',
    'skiing': 'fa-skiing',

    // ── Naturaleza / Clima ──
    'sun': 'fa-sun',
    'moon': 'fa-moon',
    'cloud': 'fa-cloud',
    'snow': 'fa-snowflake',
    'rain': 'fa-cloud-rain',
    'wind': 'fa-wind',
    'tree': 'fa-tree',
    'water': 'fa-water',
    'umbrella': 'fa-umbrella',
    'rainbow': 'fa-rainbow',

    // ── Envío / Logística ──
    'shipping': 'fa-shipping-fast',
    'dolly': 'fa-dolly',
    'warehouse': 'fa-warehouse',
    'pallet': 'fa-pallet',
    'handshake': 'fa-handshake',
    'clipboard': 'fa-clipboard-list',
    'calculator': 'fa-calculator',
    'chart': 'fa-chart-line',

    // ── Ubicación / Tiempo / Social ──
    'map': 'fa-map-marked-alt',
    'location': 'fa-map-marker-alt',
    'clock': 'fa-clock',
    'watch': 'fa-stopwatch',
    'hourglass': 'fa-hourglass-half',
    'calendar': 'fa-calendar-alt',
    'envelope': 'fa-envelope',
    'comment': 'fa-comment',
    'share': 'fa-share-alt',
    'bell': 'fa-bell',
    'megaphone': 'fa-bullhorn',
    'users': 'fa-users',
    'user': 'fa-user',
};


const emojiToIconKey = {
    // ── General ──
    '⊞': 'grid', '📋': 'list', '🏷️': 'tag', '🏷': 'tag',
    '🔖': 'bookmark', '🚩': 'flag', '✅': 'check',

    // ── Favoritos / Valoración ──
    '⭐': 'star', '🌟': 'star', '🔥': 'fire',
    '❤️': 'heart', '❤': 'heart', '💖': 'heart',
    '💎': 'diamond', '👑': 'crown', '🏅': 'medal',
    '🏆': 'trophy', '🥇': 'award', '👍': 'thumbsup',

    // ── Ofertas ──
    '%': 'percent', '⚡': 'lightning', '🆕': 'new',
    '🎁': 'gift', '💵': 'money', '💰': 'coins',
    '👛': 'wallet', '💳': 'creditcard',

    // ── Compras ──
    '📦': 'box', '🛍️': 'bag', '🛍': 'bag',
    '🛒': 'cart', '🏪': 'store', '🧾': 'receipt',

    // ══════════════════════════════════════════════════
    // ★ VEHÍCULOS / MOVILIDAD (AMPLIADO)
    // ══════════════════════════════════════════════════
    '🚗': 'car', '🏎️': 'car', '🏎': 'car',
    '🚙': 'car_side', '🚘': 'car_side',
    '💥': 'car_crash',
    '🏍️': 'motorcycle', '🏍': 'motorcycle',
    '🛵': 'scooter',
    '🚲': 'bicycle', '🚴': 'biking', '🚴‍♂️': 'biking', '🚴‍♀️': 'biking',
    '🛴': 'skateboard',          // patineta/scooter eléctrico
    '🛹': 'skateboard',          // skateboard
    '🛼': 'skating',             // patines
    '⛸️': 'skating', '⛸': 'skating',
    '🚚': 'truck', '🚛': 'truck_loading',
    '🛻': 'truck_pickup',
    '🚌': 'bus', '🚍': 'bus_alt',
    '🚕': 'taxi',
    '✈️': 'plane', '✈': 'plane',
    '🚢': 'ship', '⛵': 'ship',
    '🚁': 'helicopter',
    '🚜': 'tractor',
    '🚐': 'shuttle',
    '🏕️': 'caravan', '🏕': 'caravan',
    '🚑': 'ambulance',
    '♿': 'wheelchair',
    '🚶': 'walking', '🚶‍♂️': 'walking',
    '🏃': 'running', '🏃‍♂️': 'running',

    // ── Combustible / Estación ──
    '⛽': 'gas',
    '🔋': 'battery_full',
    '🪫': 'battery_empty',
    '🛢️': 'oil', '🛢': 'oil',
    '🅿️': 'parking', '🅿': 'parking',
    '🔌': 'charging',

    // ── Carretera / Vías ──
    '🛣️': 'road', '🛣': 'road',
    '🚦': 'traffic_light', '🚥': 'traffic_light',
    '🛤️': 'route', '🛤': 'route',

    // ══════════════════════════════════════════════════
    // ★ SEGURIDAD VIAL (AMPLIADO)
    // ══════════════════════════════════════════════════
    '🛡️': 'shield', '🛡': 'shield',
    '⛑️': 'helmet', '⛑': 'helmet',
    '🦺': 'vest',
    '⚠️': 'cone', '⚠': 'cone',
    '🚨': 'siren',
    '🚒': 'fire_ext',
    '🧯': 'fire_ext',
    '⛔': 'ban',
    '🚫': 'stop',
    '✋': 'stop',
    '🔒': 'lock',
    '🔓': 'unlock',
    '🔑': 'key',
    '🪪': 'id_card',
    '📹': 'camera_sec',
    '⚕️': 'first_aid',
    '🏥': 'first_aid',
    '🩹': 'first_aid',
    '🆘': 'first_aid',

    // ── Luces / Visibilidad ──
    '💡': 'lightbulb',
    '🔦': 'flashlight',
    '👁️': 'eye', '👁': 'eye',
    '👓': 'glasses_safety',
    '🔍': 'searchlight',
    '📡': 'satellite_dish',
    '📻': 'broadcast',

    // ══════════════════════════════════════════════════
    // ★ HERRAMIENTAS (AMPLIADO)
    // ══════════════════════════════════════════════════
    '🛠️': 'tools', '🛠': 'tools',
    '🔧': 'wrench',
    '🔨': 'hammer',
    '🪛': 'screwdriver',
    '⚙️': 'cog', '⚙': 'cog',
    '🧰': 'toolbox',
    '📏': 'ruler',
    '📐': 'ruler_combined',
    '🖌️': 'paintbrush', '🖌': 'paintbrush',
    '🧹': 'broom',
    '✂️': 'cut', '✂': 'cut',
    '🧲': 'magnet',
    '🔬': 'microscope',
    '🧪': 'flask',
    '⚖️': 'balance', '⚖': 'balance',
    '🌡️': 'thermometer', '🌡': 'thermometer',

    // ── Mecánica / Auto ──
    '🛞': 'tire',                 // llanta/neumático
    '⏱️': 'gauge', '⏱': 'gauge', // velocímetro
    '🔗': 'chain',               // cadena
    '🧴': 'spray',               // spray/lubricante
    '⛓️': 'chain', '⛓': 'chain',

    // ── Accesorios Vehículos ──
    '🪞': 'mirror',
    '🔊': 'speaker',
    '🎵': 'music_car', '🎶': 'music_car',
    '🎧': 'headphones',
    '🎙️': 'headset', '🎙': 'headset',
    // bluetooth/usb/wifi no tienen emoji directo
    '📶': 'signal',
    '🛰️': 'satellite', '🛰': 'satellite',
    '📍': 'map_pin',
    '🧭': 'compass',
    '🖥️': 'display', '🖥': 'display',
    '❄️': 'snowflake',           // A/C
    '🥵': 'temp_hot',
    '🥶': 'temp_cold',
    '☀️': 'sun_bright',

    // ── Bicicletas / Ciclismo ──
    // (🚲 y 🚴 ya mapeados arriba)
    '🍶': 'water_bottle',
    '🎒': 'backpack',
    '🧤': 'gloves',
    '⏱': 'stopwatch',
    '💓': 'heartrate',

    // ── Ropa / Moda ──
    '👕': 'shirt', '👟': 'shoe', '👞': 'shoe',
    '🎩': 'hat', '💍': 'ring',

    // ── Tecnología ──
    '📱': 'phone', '💻': 'laptop',
    '📟': 'tablet', '📷': 'camera',
    '🎮': 'gamepad', '📺': 'tv',
    '⌨️': 'keyboard', '⌨': 'keyboard',
    '🖱️': 'mouse', '🖱': 'mouse',
    '🤖': 'robot', '🖨️': 'print', '🖨': 'print',

    // ── Hogar ──
    '🏠': 'home', '🏡': 'home', '🛋️': 'sofa', '🛋': 'sofa',
    '🍳': 'kitchen', '🛏️': 'bed', '🛏': 'bed',
    '🛁': 'bath', '🪑': 'chair', '🚪': 'door',
    '🚿': 'shower', '🗑️': 'trash', '🗑': 'trash',
    '♻️': 'recycle',

    // ── Belleza / Salud ──
    '✨': 'sparkles', '💊': 'pill', '🏋️': 'fitness', '🏋': 'fitness',
    '💆': 'spa', '💉': 'syringe',
    '🩺': 'stethoscope', '🦷': 'tooth', '🧠': 'brain',
    '🏊': 'swimmer',

    // ── Comida / Bebida ──
    '🍔': 'food', '🍕': 'pizza', '🍎': 'fruit',
    '☕': 'coffee', '🍷': 'wine', '🍺': 'beer',
    '🍹': 'cocktail', '🍦': 'icecream',
    '🍃': 'leaf', '🌿': 'leaf', '🌱': 'seedling',
    '🥕': 'carrot', '🍞': 'bread', '🧀': 'cheese',
    '🐟': 'fish', '🌶️': 'pepper', '🌶': 'pepper', '🍪': 'cookie',

    // ── Mascotas ──
    '🐾': 'pet', '🐕': 'dog', '🐶': 'dog',
    '🐈': 'cat', '🐱': 'cat', '🐴': 'horse',
    '🕊️': 'dove', '🕊': 'dove', '🦴': 'bone',

    // ── Niños / Juguetes ──
    '👶': 'baby', '🧩': 'toy', '🧸': 'toy',
    '🎲': 'dice', '♟️': 'chess', '♟': 'chess',

    // ── Educación / Cultura ──
    '📚': 'book', '📖': 'books',
    '🎸': 'guitar', '🎤': 'microphone', '🎬': 'film',
    '🎨': 'palette', '🖊️': 'pen', '✏️': 'pencil', '✏': 'pencil',
    '🎓': 'graduation', '🏛️': 'university', '🏛': 'university',
    '🌎': 'globe', '🌍': 'globe', '🌏': 'globe',
    '📰': 'newspaper', '🎭': 'theater',

    // ── Deportes ──
    '⚽': 'sports', '🏀': 'basketball', '🏈': 'football',
    '⛳': 'golf', '🥾': 'hiking',
    '⛰️': 'mountain', '⛰': 'mountain',

    // ── Naturaleza ──
    '🌙': 'moon', '☁️': 'cloud',
    '🌧️': 'rain', '💨': 'wind',
    '🌳': 'tree', '🌲': 'tree', '🌊': 'water',
    '☂️': 'umbrella', '🌈': 'rainbow',

    // ── Envío / Logística ──
    '📮': 'shipping', '🏭': 'warehouse',
    '🤝': 'handshake', '📊': 'chart', '🧮': 'calculator',

    // ── Ubicación / Tiempo / Social ──
    '🗺️': 'map', '🗺': 'map',
    '🕐': 'clock', '⏳': 'hourglass', '📅': 'calendar',
    '✉️': 'envelope', '💬': 'comment', '🔔': 'bell',
    '📢': 'megaphone', '👥': 'users', '👤': 'user',
};

/**
 * Resuelve el icono FontAwesome a partir de cualquier formato:
 * - value directo: "fire" → iconMap["fire"] → "fa-fire"
 * - emoji: "🔥" → emojiToIconKey["🔥"] → "fire" → iconMap["fire"] → "fa-fire"
 * - fallback: "fa-tag"
 */
function resolveIconClass(iconOrEmoji) {
    if (!iconOrEmoji) return 'fa-tag';
    
    // 1. Intentar como key directo del iconMap (value: "fire", "star", etc.)
    if (iconMap[iconOrEmoji]) return iconMap[iconOrEmoji];
    
    // 2. Intentar como emoji → convertir a key → buscar en iconMap
    const key = emojiToIconKey[iconOrEmoji];
    if (key && iconMap[key]) return iconMap[key];
    
    // 3. Si ya es una clase FA (viene como "fa-fire"), usarla directo
    if (iconOrEmoji.startsWith('fa-')) return iconOrEmoji;
    
    // 4. Fallback
    return 'fa-tag';
}
// ==========================================
// ★ CONFIGURACIÓN DEFAULT v5.7 - BADGES ACTUALIZADOS
// ==========================================
function getDefaultProductCardConfig() {
    return {
        // ═══════════════════════════════════════
        // BADGES v2.3 - Nueva estructura
        // ═══════════════════════════════════════
        badges: {
            // Badges AUTOMÁTICOS (mostrar/ocultar - calculados por backend)
            auto: {
    discount: true,      
    new: true,           
    lastUnit: true,      
    soldOut: true,       
    topRated: false,     
    popular: true,
    personalizable: true  // ★ NUEVO v5.8
},
            

            // Badges MANUALES (9 tipos v2.3 - asignados en Inventario PRO)
            manual: {
                featured: true,          // destacado
                freeShip: true,          // envio_gratis
                preOrder: true,          // pre_orden
                limitedEdition: true,    // edicion_limitada
                flashSale: true,         // oferta_flash
                combo: true,             // combo
                warranty: true,          // garantia_extendida
                ecoFriendly: true,       // eco_friendly
                custom: true             // badge_personalizado
            },
            
            // Configuración visual
            position: 'top-left',
            style: 'rounded',
            size: 'medium',
            
            // Colores personalizados
            colors: {
    discount: '#ef4444',
    new: '#22c55e',
    featured: '#f59e0b',
    flash: '#8b5cf6',
    freeShip: '#0ea5e9',
    preOrder: '#6366f1',
    limitedEdition: '#ec4899',
    combo: '#14b8a6',
    warranty: '#0891b2',
    ecoFriendly: '#22c55e',
    custom: '#6366f1',
    personalizable: '#ec4899'  // ★ NUEVO v5.8
}
        },
        
        // Precios
        pricing: { 
            showOriginal: true, 
            showSavings: true, 
            showPercent: true, 
            showUnit: false,
            showFrom: false,
            currency: 'COP', 
            thousandsSep: '.' 
        },
        
        // Rating
        rating: { 
            showStars: true, 
            showCount: true,
            showViewing: false,
            showSold: false,
            showRecent: false,
            showWishlist: false,
            showViews: true, 
            starsColor: '#fbbf24',
            starsSize: 'medium'
        },
        
        // Stock
        stock: { 
            showStatus: true, 
            showQuantity: false,
            showBar: false,
            showLowAlert: true, 
            showNotify: true,
            threshold: 5,
            style: 'text'
        },
        
        // Botones
        buttons: { 
            cart: true, 
            favorite: false, 
            whatsapp: false,
            compare: false,
            quickView: false,
            variants: false,
            position: 'below-info', 
            style: 'rounded', 
            cartText: 'Agregar al carrito' 
        },
        
        // Urgencia
        urgency: { 
            timer: false, 
            message: false,
            flashSale: false,
            priceIncrease: false,
            customText: '¡Oferta termina pronto!'
        },
        
        // Descripción
        description: { 
            show: false, 
            maxLength: 100 
        },
        
        // Video Hover
        videoHover: { 
            enabled: false, 
            behavior: 'replace', 
            muted: true 
        }
    };
}

// ==========================================
// ★ MERGE CONFIG CON MIGRACIÓN v5.6 → v5.7
// ==========================================
function mergeProductCardConfig(defaultConfig, userConfig) {
    if (!userConfig) return defaultConfig;
    
    const result = JSON.parse(JSON.stringify(defaultConfig));
    
    // ═══════════════════════════════════════
    // MIGRAR BADGES: Detectar estructura vieja vs nueva
    // ═══════════════════════════════════════
    if (userConfig.badges) {
        const b = userConfig.badges;
        
        // Detectar si es estructura nueva (tiene auto/manual) o vieja
        if (b.auto || b.manual) {
            // ✅ Estructura NUEVA v5.7
            if (b.auto) result.badges.auto = { ...result.badges.auto, ...b.auto };
            if (b.manual) result.badges.manual = { ...result.badges.manual, ...b.manual };
            if (b.colors) result.badges.colors = { ...result.badges.colors, ...b.colors };
            if (b.position) result.badges.position = b.position;
            if (b.style) result.badges.style = b.style;
            if (b.size) result.badges.size = b.size;
        } else {
            // 🔄 Estructura VIEJA v5.6 - Migrar automáticamente
            console.log('🔄 Migrando badges de v5.6 a v5.7...');
            
            result.badges.auto = {
                discount: b.discount ?? true,
                new: b.new ?? true,
                lastUnit: b.lastUnit ?? true,
                soldOut: b.soldOut ?? true,
                topRated: b.topRated ?? false,
                popular: b.popular ?? false
            };
            
            result.badges.manual = {
                featured: b.featured ?? true,
                freeShip: b.freeShip ?? true,
                preOrder: true,
                limitedEdition: true,
                flashSale: true,
                combo: true,
                warranty: true,
                ecoFriendly: true,
                custom: b.custom ?? false
            };
            
            if (b.position) result.badges.position = b.position;
            if (b.style) result.badges.style = b.style;
            if (b.size) result.badges.size = b.size;
            if (b.customColor) result.badges.colors.custom = b.customColor;
        }
    }
    
    // Mergear resto de configuraciones
    if (userConfig.pricing) result.pricing = { ...result.pricing, ...userConfig.pricing };
    if (userConfig.rating) result.rating = { ...result.rating, ...userConfig.rating };
    if (userConfig.stock) result.stock = { ...result.stock, ...userConfig.stock };
    if (userConfig.buttons) result.buttons = { ...result.buttons, ...userConfig.buttons };
    if (userConfig.urgency) result.urgency = { ...result.urgency, ...userConfig.urgency };
    if (userConfig.description) result.description = { ...result.description, ...userConfig.description };
    if (userConfig.videoHover) result.videoHover = { ...result.videoHover, ...userConfig.videoHover };
    
    return result;
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🛒 Tienda v5.8 - Analytics + Trust Edition iniciando...');

    const slug = getSlugFromURL();
    if (!slug) {
        showError('No se especificó ninguna tienda');
        return;
    }

    try {
        await loadStoreConfig(slug);
        loadCarrito();
        await loadProducts();
        initProductDetailFromConfig();
        checkUrlForProduct();
        hideLoading();

        // ★ v5.8: Analytics + Trust strip (no bloquean la carga)
        if (tiendaConfig.negocio_id) {
            registrarVisita(tiendaConfig.negocio_id);
            loadTrustData(tiendaConfig.negocio_id);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('No pudimos cargar la tienda');
    }
});

// ══════════════════════════════════════════════════════════════════════
// ★ v5.8: ANALYTICS — registrar visita (fire and forget)
// ══════════════════════════════════════════════════════════════════════
function registrarVisita(negocioId) {
    fetch(`${API_URL}/negocio/${negocioId}/analytics/visita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(() => {}); // silencioso: nunca bloquea la tienda
}

// ══════════════════════════════════════════════════════════════════════
// ★ v5.8: TRUST STRIP — indicadores de confianza del vendedor
// ══════════════════════════════════════════════════════════════════════
async function loadTrustData(negocioId) {
    const strip = document.getElementById('trustStrip');
    if (!strip) return;
    try {
        const res = await fetch(`${API_URL}/negocio/${negocioId}/trust`);
        if (!res.ok) return;
        const t = await res.json();

        // Solo mostrar si hay al menos un dato útil
        const tieneAlgo = t.pedidos_completados > 0 || t.rating_promedio || t.verificado
                        || t.num_badges > 0 || t.miembro_desde;
        if (!tieneAlgo) return;

        const items = [];

        // Verificado
        if (t.verificado) {
            items.push(`<div class="trust-item">
                <span class="trust-verified">✓ Verificado</span>
            </div>`);
            items.push('<div class="trust-sep"></div>');
        }

        // Rating y reseñas
        if (t.rating_promedio) {
            const estrellas = _trustStars(t.rating_promedio);
            items.push(`<div class="trust-item">
                <span class="trust-stars">${estrellas}</span>
                <strong>${t.rating_promedio}</strong>
                <span>(${t.num_resenas} reseña${t.num_resenas !== 1 ? 's' : ''})</span>
            </div>`);
            items.push('<div class="trust-sep"></div>');
        }

        // Pedidos completados
        if (t.pedidos_completados > 0) {
            const label = t.pedidos_completados >= 1000
                ? `${(t.pedidos_completados/1000).toFixed(1)}k`
                : t.pedidos_completados;
            items.push(`<div class="trust-item">
                <span class="ti-icon">📦</span>
                <strong>${label}</strong>
                <span>pedido${t.pedidos_completados !== 1 ? 's' : ''} entregados</span>
            </div>`);
            items.push('<div class="trust-sep"></div>');
        }

        // Badges BizScore
        if (t.num_badges > 0) {
            items.push(`<div class="trust-item">
                <span class="ti-icon">🏆</span>
                <strong>${t.num_badges}</strong>
                <span>badge${t.num_badges !== 1 ? 's' : ''} ganados</span>
            </div>`);
            items.push('<div class="trust-sep"></div>');
        }

        // Miembro desde
        if (t.miembro_desde) {
            items.push(`<div class="trust-item">
                <span class="ti-icon">🗓️</span>
                <span>Miembro desde <strong>${t.miembro_desde}</strong></span>
            </div>`);
        }

        // Limpiar separadores al final
        while (items.length && items[items.length - 1].includes('trust-sep')) items.pop();

        if (items.length === 0) return;

        strip.innerHTML = `<div class="trust-inner">${items.join('')}</div>`;
        strip.style.display = 'block';
        console.log('✅ Trust strip renderizada');
    } catch (e) {
        console.warn('⚠️ Trust data no disponible:', e.message);
    }
}

function _trustStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slug')) return params.get('slug');
    const match = window.location.pathname.match(/\/tienda\/([^\/]+)/);
    return match ? match[1] : null;
}

// ==========================================
// CARGAR CONFIGURACIÓN
// ==========================================
async function loadStoreConfig(slug) {
    const response = await fetch(`${API_URL}/negocio/slug/${slug}`);
    if (!response.ok) throw new Error('Tienda no encontrada');
    
    const data = await response.json();
    const negocio = data.data || data;
    
    tiendaConfig.negocio_id = negocio.id_negocio || negocio.id;
    tiendaConfig.slug = negocio.slug;
    tiendaConfig.nombre = negocio.nombre_negocio;
    tiendaConfig.whatsapp = negocio.whatsapp || negocio.telefono || '';
    tiendaConfig.color = negocio.color_tema || '#2563eb';
    tiendaConfig.config_tienda = negocio.config_tienda || {};
    
    console.log('✅ Config cargada v5.7');
    
    applyStoreConfig();
}

async function loadCategoriasFromAPI(negocioId) {
    if (!negocioId) return null;
    
    try {
        const response = await fetch(`${API_URL}/categorias?negocio_id=${negocioId}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        const categoriasAPI = Array.isArray(data) ? data : (data.categorias || data.data || []);
        
        if (categoriasAPI.length > 0) {
            console.log(`✅ ${categoriasAPI.length} categorías cargadas de la BD`);
            
            // Mapear al formato que espera renderCustomCategories
            return categoriasAPI.map((cat, index) => ({
                id: cat.id || cat.id_categoria || index,
                name: cat.nombre || cat.name || 'Sin nombre',
                // Guardar tanto el icono original como el key resuelto
                icon: cat.icono || cat.icon || '📦',
                color: cat.color || '#6366f1',
                featured: cat.featured !== undefined ? cat.featured : index < 3
            }));
        }
    } catch (error) {
        console.warn('⚠️ Error cargando categorías de API:', error);
    }
    
    return null;
}

// ══════════════════════════════════════════════════════════════════════
// FIN SESIÓN 1/5
// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// SESIÓN 2/5 - APLICAR CONFIGURACIÓN E INYECTAR CSS
// ══════════════════════════════════════════════════════════════════════

// ==========================================
// APLICAR CONFIGURACIÓN
// ==========================================
function applyStoreConfig() {
    const config = tiendaConfig.config_tienda;
    
    console.log('🎨 Aplicando configuración del designer v5.7...');

    // ★ SEO / PWA — actualizar metas dinámicamente (Sprint 7: +seo)
    if (typeof window.actualizarMetasTienda === 'function') {
        window.actualizarMetasTienda({
            nombre:      tiendaConfig.nombre,
            descripcion: tiendaConfig.config_tienda?.splash?.subtitle || tiendaConfig.config_tienda?.hero?.subtitle || '',
            logo_url:    tiendaConfig.config_tienda?.logo?.url || tiendaConfig.logo_url || '',
            slug:        tiendaConfig.slug,
            color:       tiendaConfig.config_tienda?.styles?.primaryColor || tiendaConfig.color,
            seo:         config.seo || {},   // ★ Sprint 7
        });
    }

    // Título (con SEO personalizado tiene prioridad)
    document.title = config.seo?.titulo || `${tiendaConfig.nombre} | Tienda Online`;
    
    // Nombre de la tienda
    const showName = config.logo?.showName !== false;
    const nameEl = document.getElementById('storeNameDisplay');
    if (nameEl) {
        nameEl.textContent = tiendaConfig.nombre;
        nameEl.style.display = showName ? 'inline' : 'none';
    }
    
    // Color principal
    const primaryColor = config.styles?.primaryColor || tiendaConfig.color;
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-dark', adjustColor(primaryColor, -30));
    document.documentElement.style.setProperty('--primary-light', adjustColor(primaryColor, 30));

    // ★ Sprint 5: Tema visual ecommerce (light / dark / vibrant)
    const ecommerceTema = config.ecommerce?.tema || 'light';
    applyEcommerceTema(ecommerceTema, primaryColor);

    // ★ Sincronizar product-detail.css con el tema y color de la tienda
    applyProductDetailTheme(primaryColor, ecommerceTema);

    // ★ Sprint 5: Layout de productos (grid / lista / masonry)
    applyEcommerceLayout(config.ecommerce?.layout || 'grid');

    // ★ Sprint 6: Tipografía personalizable
    applyEcommerceFuente(config.tipografia?.body || 'Inter');

    // ★ Sprint 7: Redes sociales flotantes
    applyRedesSociales(config.redesSociales);

    // ★ Sprint 8: Testimonios de clientes
    renderTiendaTestimonios(config.testimonios);

    // ★ Sprint 9: Stats / Contadores personalizados
    renderTiendaStats(config.stats);

    // ★ Sprint 10: Galería de fotos
    renderTiendaGaleria(config.galeria);
    
    // ★ Mergear configuración del usuario con defaults v5.7
    const pcConfig = mergeProductCardConfig(getDefaultProductCardConfig(), config.productCard);
    
    // ★ Inyectar CSS dinámico para Product Card v5.7
    injectProductCardStyles(pcConfig);
    
    // Splash Screen
    if (config.splash?.enabled) {
        showSplashScreen(config.splash);
    } else {
        hideSplashScreen();
    }
    
    // Logo
    applyLogo(config.logo);
    
    // Navbar layout
    if (config.navbar?.layout) {
        applyNavbarLayout(config.navbar.layout);
    }
    
    // Sidebar
    if (config.sidebar?.width) {
        document.documentElement.style.setProperty('--sidebar-width', config.sidebar.width + 'px');
    }
    if (config.sidebar?.startCollapsed) {
        toggleSidebar(true);
    }
    
    // Banners
    applyTopBanner(config.banner);
    applyHeroBanner(config.heroBanner);
    applyPromoBanner(config.promoBanner);
    
    // Categorías
    loadCategoriasFromAPI(tiendaConfig.negocio_id).then(categoriasAPI => {
        if (categoriasAPI && categoriasAPI.length > 0) {
            // ★ Categorías de la BD (fuente principal desde v5.8)
            renderCustomCategories(categoriasAPI);
            
            // También actualizar featured categories si están habilitadas
            if (config.featuredCategories?.enabled) {
                // Remover las viejas si ya se renderizaron
                const existing = document.getElementById('featuredCategoriesSection');
                if (existing) existing.remove();
                renderFeaturedCategories(categoriasAPI, config.featuredCategories);
            }
        } else if (config.categories?.length > 0) {
            // Fallback: usar categorías de config_tienda
            renderCustomCategories(config.categories);
        }
    });
    
    // Featured Categories
    if (config.featuredCategories?.enabled && config.categories?.length > 0) {
        renderFeaturedCategories(config.categories, config.featuredCategories);
    }
    
    // Slider
    if (config.slider?.enabled !== false && config.slider?.images?.length > 0) {
        renderSlider(config.slider.images, config.slider.speed || 5000);
    } else {
        const sliderSection = document.getElementById('sliderSection');
        if (sliderSection) sliderSection.style.display = 'none';
    }
    
    // WhatsApp
    applyWhatsApp(config.whatsapp);
    
    console.log('✅ Configuración v5.7 aplicada completamente');
}

// ==========================================
// ★ Sprint 10: GALERÍA DE FOTOS
// ==========================================
function renderTiendaGaleria(galeria) {
    const section = document.getElementById('galeriaSection');
    const grid    = document.getElementById('galeriaGrid');
    const titulo  = document.getElementById('galeriaTitulo');
    if (!section || !grid) return;

    if (!galeria?.enabled || !galeria?.fotos?.length) {
        section.style.display = 'none';
        return;
    }

    if (titulo && galeria.titulo) titulo.textContent = galeria.titulo;

    const cols = Math.min(4, Math.max(2, galeria.columnas || 3));
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;`;

    grid.innerHTML = galeria.fotos.map((src, i) => `
        <div style="aspect-ratio:1;border-radius:12px;overflow:hidden;background:#f1f5f9;cursor:zoom-in;"
             onclick="abrirFotoGaleria('${src}')">
            <img src="${src}" alt="Foto ${i+1}"
                 style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
                 onmouseover="this.style.transform='scale(1.06)'"
                 onmouseout="this.style.transform='scale(1)'">
        </div>`).join('');

    section.style.display = 'block';
    console.log(`🖼️ Galería renderizada: ${galeria.fotos.length} fotos, ${cols} cols`);
}

// Lightbox mínimo para la galería
window.abrirFotoGaleria = function(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    overlay.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.5);">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
};

// ==========================================
// ★ Sprint 9: STATS / CONTADORES PERSONALIZADOS
// ==========================================
function renderTiendaStats(stats) {
    const section = document.getElementById('statsSection');
    if (!section) return;

    if (!stats?.enabled || !stats?.items?.length) {
        section.style.display = 'none';
        return;
    }

    section.innerHTML = `
    <div style="background:#fff;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:18px 20px;">
        <div style="max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:32px;">
            ${stats.items.map(s => `
            <div style="text-align:center;min-width:100px;">
                <div style="font-size:1.6rem;margin-bottom:2px;">${s.icono || '📊'}</div>
                <div style="font-size:1.4rem;font-weight:800;color:var(--primary);">${s.numero || '—'}</div>
                <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">${s.label || ''}</div>
            </div>`).join('')}
        </div>
    </div>`;

    section.style.display = 'block';
    console.log(`📊 Stats renderizados: ${stats.items.length}`);
}

// ==========================================
// ★ Sprint 8: TESTIMONIOS DE CLIENTES
// ==========================================
function renderTiendaTestimonios(testimonios) {
    const section = document.getElementById('testimoniosSection');
    const grid    = document.getElementById('testimoniosGrid');
    const titulo  = document.getElementById('testimoniosTitulo');
    if (!section || !grid) return;

    if (!testimonios?.enabled || !testimonios?.items?.length) {
        section.style.display = 'none';
        return;
    }

    if (titulo && testimonios.titulo) titulo.textContent = testimonios.titulo;

    const COLORS = ['#8b5cf6','#3b82f6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16'];
    const stars  = n => '★'.repeat(Math.min(5, Math.max(0, n || 5))) + '☆'.repeat(5 - Math.min(5, n || 5));

    grid.innerHTML = testimonios.items.map((t, i) => {
        const color  = t.color || COLORS[i % COLORS.length];
        const letra  = (t.nombre || '?')[0].toUpperCase();
        const rating = t.rating || 5;
        return `
        <div style="background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.07);display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:44px;height:44px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;flex-shrink:0;">${letra}</div>
                <div>
                    <div style="font-weight:600;font-size:0.95rem;color:#1a1a1a;">${t.nombre || 'Cliente'}</div>
                    <div style="color:#f59e0b;font-size:0.85rem;letter-spacing:1px;">${stars(rating)}</div>
                </div>
            </div>
            <p style="color:#555;font-size:0.88rem;line-height:1.55;margin:0;">"${t.texto || ''}"</p>
        </div>`;
    }).join('');

    section.style.display = 'block';
    console.log(`⭐ Testimonios renderizados: ${testimonios.items.length}`);
}

// ==========================================
// ★ Sprint 7: REDES SOCIALES FLOTANTES
// ==========================================
function applyRedesSociales(redes) {
    const stack = document.getElementById('socialFloatStack');
    if (!stack) return;

    if (!redes) { stack.style.display = 'none'; return; }

    const links = [
        { key: 'instagram', url: redes.instagramUrl, icon: 'fab fa-instagram',   cls: 'instagram', label: 'Instagram' },
        { key: 'tiktok',    url: redes.tiktokUrl,    icon: 'fab fa-tiktok',       cls: 'tiktok',    label: 'TikTok' },
        { key: 'facebook',  url: redes.facebookUrl,  icon: 'fab fa-facebook-f',   cls: 'facebook',  label: 'Facebook' },
        { key: 'youtube',   url: redes.youtubeUrl,   icon: 'fab fa-youtube',      cls: 'youtube',   label: 'YouTube' },
    ];

    const visibles = links.filter(l => redes[l.key] && l.url);

    if (!visibles.length) { stack.style.display = 'none'; return; }

    stack.innerHTML = visibles.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener"
           class="social-float-btn ${l.cls}" title="${l.label}" aria-label="${l.label}">
            <i class="${l.icon}"></i>
        </a>`).join('');

    stack.style.display = 'flex';
    console.log(`📱 Redes sociales aplicadas: ${visibles.map(l=>l.key).join(', ')}`);
}

// ==========================================
// ★ Sprint 5: TEMA VISUAL ECOMMERCE
// ==========================================
function applyEcommerceTema(tema, primaryColor) {
    // Eliminar estilos previos de tema
    const prev = document.getElementById('temaEcommerceDynamic');
    if (prev) prev.remove();

    let css = '';

    if (tema === 'dark') {
        css = `
body { background: #111 !important; color: #f0f0f0 !important; }
.navbar { background: #1a1a1a !important; border-bottom: 1px solid #2a2a2a !important; }
.navbar-brand, .store-name, #storeNameDisplay { color: #f0f0f0 !important; }
.sidebar { background: #1a1a1a !important; border-right: 1px solid #2a2a2a !important; }
.sidebar-title, .category-item, .price-range-label { color: #ddd !important; }
.category-item:hover, .category-item.active { background: #2a2a2a !important; }
.product-card { background: #1e1e1e !important; border: 1px solid #2a2a2a !important; }
.product-name { color: #f0f0f0 !important; }
.product-description { color: #aaa !important; }
.product-price { color: #7cb9ff !important; }
.products-section { background: #111 !important; }
.products-header { background: #111 !important; }
.products-title { color: #f0f0f0 !important; }
.products-count { color: #888 !important; }
.view-btn { background: #2a2a2a !important; color: #ccc !important; border-color: #333 !important; }
.view-btn.active { background: #333 !important; }
.search-input { background: #2a2a2a !important; color: #f0f0f0 !important; border-color: #333 !important; }
.main-layout { background: #111 !important; }
.cart-sidebar { background: #1a1a1a !important; color: #f0f0f0 !important; }
.cart-title { color: #f0f0f0 !important; }
.empty-cart { color: #888 !important; }
.footer-section { background: #1a1a1a !important; color: #888 !important; }`;
    } else if (tema === 'vibrant') {
        css = `
body { background: #1a0533 !important; color: #f0e6ff !important; }
.navbar { background: #250848 !important; border-bottom: 1px solid #3d1f6e !important; }
.navbar-brand, .store-name, #storeNameDisplay { color: #f0e6ff !important; }
.sidebar { background: #250848 !important; border-right: 1px solid #3d1f6e !important; }
.sidebar-title, .category-item, .price-range-label { color: #c4a8ff !important; }
.category-item:hover, .category-item.active { background: #3d1f6e !important; color: #fff !important; }
.product-card { background: #2d1b4e !important; border: 1px solid #3d1f6e !important; }
.product-name { color: #f0e6ff !important; }
.product-description { color: #c4a8ff !important; }
.product-price { color: #d8b4fe !important; }
.btn-add-cart, .btn-primary { background: #a855f7 !important; border-color: #a855f7 !important; }
.products-section { background: #1a0533 !important; }
.products-header { background: #1a0533 !important; }
.products-title { color: #f0e6ff !important; }
.products-count { color: #c4a8ff !important; }
.view-btn { background: #3d1f6e !important; color: #c4a8ff !important; border-color: #5b2d8e !important; }
.view-btn.active { background: #5b2d8e !important; color: #fff !important; }
.search-input { background: #3d1f6e !important; color: #f0e6ff !important; border-color: #5b2d8e !important; }
.main-layout { background: #1a0533 !important; }
.cart-sidebar { background: #250848 !important; color: #f0e6ff !important; }
.cart-title { color: #f0e6ff !important; }
.empty-cart { color: #c4a8ff !important; }
.footer-section { background: #250848 !important; color: #c4a8ff !important; }`;
    }
    // tema 'light' = default, no CSS overrides needed

    if (css) {
        const style = document.createElement('style');
        style.id = 'temaEcommerceDynamic';
        style.textContent = css;
        document.head.appendChild(style);
    }

    console.log(`🎨 Tema ecommerce aplicado: ${tema}`);
}

// ==========================================
// ★ SINCRONIZAR PRODUCT DETAIL CON EL TEMA DE LA TIENDA
// ==========================================
function applyProductDetailTheme(primaryColor, tema) {
    const prev = document.getElementById('pdThemeOverride');
    if (prev) prev.remove();

    if (!primaryColor) return;

    // Calcular variantes del color primario
    const colorDark  = adjustColor(primaryColor, -30);
    const colorLight = adjustColor(primaryColor, 30);

    // Convertir hex → rgba helper
    function hexToRgba(hex, alpha) {
        try {
            hex = hex.replace('#','');
            if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
            const r = parseInt(hex.slice(0,2), 16);
            const g = parseInt(hex.slice(2,4), 16);
            const b = parseInt(hex.slice(4,6), 16);
            return `rgba(${r},${g},${b},${alpha})`;
        } catch(_) { return `rgba(37,99,235,${alpha})`; }
    }

    // ══════════════════════════════════════════
    // BASE: variables que se aplican en TODOS los temas.
    // El acento y sus derivados siempre siguen el color del designer.
    // El header siempre usa el color primario → coherencia con el navbar.
    // ══════════════════════════════════════════
    let css = `
/* ── Variables de acento ── */
:root {
    --pd-accent:        ${primaryColor};
    --pd-accent-light:  ${colorLight};
    --pd-accent-dark:   ${colorDark};
    --pd-accent-glow:   ${hexToRgba(primaryColor, 0.35)};
    --pd-accent-soft:   ${hexToRgba(primaryColor, 0.10)};
    --pd-border-accent: ${hexToRgba(primaryColor, 0.28)};
    --pd-shadow-glow:   0 0 32px ${hexToRgba(primaryColor, 0.20)};
}

/* ── Header: siempre en el color de la tienda (igual que el navbar) ── */
.pd-header {
    background: ${primaryColor} !important;
    border-bottom: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
}

/* ── Breadcrumb y "Volver" sobre header de color ── */
.pd-breadcrumb a,
.pd-breadcrumb i,
.pd-breadcrumb span,
#pdProductName { color: rgba(255,255,255,0.88) !important; }
.pd-breadcrumb span,
#pdProductName { color: #fff !important; font-weight: 600 !important; }
.pd-breadcrumb a:hover { color: #fff !important; opacity: 0.75; }

/* ── Botón "Volver" sobre header de color ── */
.pd-close {
    background: rgba(255,255,255,0.15) !important;
    border-color: rgba(255,255,255,0.30) !important;
    color: #fff !important;
}
.pd-close * { color: #fff !important; }
.pd-close:hover {
    background: rgba(255,255,255,0.28) !important;
    border-color: rgba(255,255,255,0.50) !important;
    transform: scale(1.04) !important;
}

/* ── Línea decorativa superior: color de tienda, no dorado ── */
.pd-panel::before {
    background: linear-gradient(
        90deg,
        transparent 0%,
        ${hexToRgba(primaryColor, 0.6)} 20%,
        ${primaryColor} 50%,
        ${hexToRgba(primaryColor, 0.6)} 80%,
        transparent 100%
    ) !important;
    opacity: 0.7 !important;
}

/* ── Brillo en esquina imagen: color de tienda, no dorado ── */
.pd-gallery-main::before {
    background: radial-gradient(
        circle at 30% 30%,
        ${hexToRgba(primaryColor, 0.07)} 0%,
        transparent 55%
    ) !important;
}

/* ── Categoría badge ── */
.pd-category {
    background: ${hexToRgba(primaryColor, 0.10)} !important;
    border-color: ${hexToRgba(primaryColor, 0.28)} !important;
    color: ${primaryColor} !important;
}
.pd-category:hover {
    background: ${primaryColor} !important;
    color: #fff !important;
}

/* ── Botones primarios de acción ── */
.pd-btn-primary {
    background: linear-gradient(135deg, ${primaryColor}, ${colorDark}) !important;
    box-shadow: 0 4px 16px ${hexToRgba(primaryColor, 0.35)} !important;
    color: #fff !important;
}
.pd-btn-primary:hover {
    background: linear-gradient(135deg, ${colorLight}, ${primaryColor}) !important;
    box-shadow: 0 6px 20px ${hexToRgba(primaryColor, 0.45)} !important;
}

/* ── Botones secundarios: borde del color de tienda en hover ── */
.pd-btn-secondary:hover {
    border-color: ${primaryColor} !important;
    color: ${primaryColor} !important;
}

/* ── Cantidad: hover en color tienda ── */
.pd-quantity-btn:hover {
    background: ${hexToRgba(primaryColor, 0.10)} !important;
    color: ${primaryColor} !important;
}

/* ── Thumbnail activo ── */
.pd-thumbnail.active {
    border-color: ${primaryColor} !important;
    box-shadow: 0 0 0 2px ${hexToRgba(primaryColor, 0.20)} !important;
}
.pd-thumbnail .video-thumb-icon { color: ${primaryColor} !important; }

/* ── Dot activo en galería ── */
.pd-dot.active {
    background: ${primaryColor} !important;
    box-shadow: 0 0 10px ${hexToRgba(primaryColor, 0.40)} !important;
}

/* ── Navegación galería hover ── */
.pd-gallery-nav:hover {
    border-color: ${primaryColor} !important;
    color: ${primaryColor} !important;
}

/* ── Precio: color del acento ── */
.pd-price { color: ${primaryColor} !important; }

/* ── Rating stars ── */
.pd-rating-star.filled { color: ${primaryColor} !important; }

/* ── Tabs activos ── */
.pd-tab.active {
    border-bottom-color: ${primaryColor} !important;
    color: ${primaryColor} !important;
}

/* ── Badge en galería (destacado) ── */
.pd-gallery-badge {
    background: linear-gradient(135deg, ${primaryColor}, ${colorDark}) !important;
    box-shadow: ${hexToRgba(primaryColor, 0.35)} !important;
}
`;

    // ══════════════════════════════════════════
    // TEMA LIGHT: fondo blanco, textos oscuros, estilo moderno y limpio
    // ══════════════════════════════════════════
    if (tema === 'light') {
        css += `
:root {
    --pd-bg-primary:      #ffffff;
    --pd-bg-secondary:    #f8fafc;
    --pd-bg-tertiary:     #f1f5f9;
    --pd-bg-glass:        rgba(0,0,0,0.02);
    --pd-bg-glass-hover:  rgba(0,0,0,0.04);
    --pd-bg-glass-active: rgba(0,0,0,0.06);
    --pd-border-glass:    rgba(0,0,0,0.08);
    --pd-border-glow:     rgba(0,0,0,0.13);
    --pd-text-primary:    #1e293b;
    --pd-text-secondary:  rgba(30,41,59,0.70);
    --pd-text-muted:      rgba(30,41,59,0.45);
    --pd-text-micro:      rgba(30,41,59,0.25);
    --pd-shadow-sm:  0 1px 4px rgba(0,0,0,0.07);
    --pd-shadow-md:  0 4px 20px rgba(0,0,0,0.10);
    --pd-shadow-lg:  0 12px 48px rgba(0,0,0,0.13);
    --pd-shadow-inner: inset 0 1px 0 rgba(255,255,255,0.8);
    --pd-font-display: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
/* Panel con fondo blanco limpio, sin textura de ruido */
.pd-panel {
    background: #fff !important;
    background-image: none !important;
    box-shadow: -2px 0 24px rgba(0,0,0,0.12) !important;
}
/* Overlay más suave */
.pd-overlay { background: rgba(0,0,0,0.45) !important; }
/* Cuerpo del panel */
.pd-body { background: #fff; }
/* Cards glass → blancas con borde suave */
.pd-glass-card {
    background: #f8fafc !important;
    border-color: rgba(0,0,0,0.08) !important;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
}
/* Sección de precio */
.pd-price-section {
    background: #f1f5f9 !important;
    border-color: rgba(0,0,0,0.08) !important;
}
/* Precio principal en color tienda */
.pd-price { color: ${primaryColor} !important; }
/* Control de cantidad */
.pd-quantity-control {
    background: #f8fafc !important;
    border-color: rgba(0,0,0,0.10) !important;
}
.pd-quantity-input { color: #1e293b !important; }
/* Scrollbar claro */
.pd-body { scrollbar-color: #cbd5e1 transparent !important; }
/* Tabs */
.pd-tab:not(.active) { color: rgba(30,41,59,0.55) !important; border-bottom-color: transparent !important; }
.pd-tab { border-bottom-width: 2px !important; }
`;
    }

    // ══════════════════════════════════════════
    // TEMA DARK: fondo negro profundo, acento = color tienda
    // ══════════════════════════════════════════
    if (tema === 'dark') {
        css += `
:root {
    --pd-bg-primary:   #08080c;
    --pd-bg-secondary: #0f0f15;
    --pd-bg-tertiary:  #16161f;
}
/* Panel oscuro con textura sutil */
.pd-panel {
    box-shadow: -2px 0 32px rgba(0,0,0,0.6) !important;
}
`;
    }

    // ══════════════════════════════════════════
    // TEMA VIBRANT: fondo púrpura profundo, acento = color tienda
    // ══════════════════════════════════════════
    if (tema === 'vibrant') {
        css += `
:root {
    --pd-bg-primary:     #1a0533;
    --pd-bg-secondary:   #250848;
    --pd-bg-tertiary:    #2d1b4e;
    --pd-border-glass:   rgba(255,255,255,0.08);
    --pd-text-secondary: rgba(255,255,255,0.72);
}
`;
    }

    const style = document.createElement('style');
    style.id = 'pdThemeOverride';
    style.textContent = css;
    document.head.appendChild(style);

    console.log(`🎨 Product Detail rediseñado: tema=${tema}, color=${primaryColor}`);
}

// ==========================================
// ★ Sprint 6: TIPOGRAFÍA PERSONALIZABLE
// ==========================================
const TIENDA_FONT_MAP = {
    'Inter':            'Inter:wght@300;400;500;600;700;800',
    'Poppins':          'Poppins:wght@300;400;500;600;700',
    'Roboto':           'Roboto:wght@300;400;500;700',
    'Playfair Display': 'Playfair+Display:wght@400;600;700',
    'Bebas Neue':       'Bebas+Neue',
};

function applyEcommerceFuente(fuente) {
    if (!fuente || fuente === 'Inter') {
        // Inter ya está cargada en tienda/index.html
        document.body.style.fontFamily = "'Inter', -apple-system, sans-serif";
        return;
    }

    // Inyectar Google Font si no está cargada
    const fontId = `tiendaFont_${fuente.replace(/\s+/g, '_')}`;
    if (!document.getElementById(fontId)) {
        const gParam = TIENDA_FONT_MAP[fuente] || encodeURIComponent(fuente);
        const link = document.createElement('link');
        link.id   = fontId;
        link.rel  = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${gParam}&display=swap`;
        document.head.appendChild(link);
    }

    // Aplicar en toda la tienda
    document.body.style.fontFamily = `'${fuente}', sans-serif`;

    // También headings
    const prev = document.getElementById('tiendaFontDynamic');
    if (prev) prev.remove();
    const style = document.createElement('style');
    style.id = 'tiendaFontDynamic';
    style.textContent = `
body, .product-name, .navbar-brand, .store-name,
.products-title, .sidebar-title, .category-item,
.product-price, .btn-add-cart {
    font-family: '${fuente}', sans-serif !important;
}`;
    document.head.appendChild(style);

    console.log(`🔤 Fuente aplicada: ${fuente}`);
}

// ==========================================
// ★ Sprint 5: LAYOUT DE PRODUCTOS
// ==========================================
function applyEcommerceLayout(layout) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Limpiar clases de layout previas
    grid.classList.remove('view-grid', 'view-list', 'view-masonry');

    // Eliminar CSS de masonry previo
    const prevMasonry = document.getElementById('layoutMasonryDynamic');
    if (prevMasonry) prevMasonry.remove();

    if (layout === 'lista') {
        grid.classList.add('view-list');
        // Sincronizar botones de vista
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        const listBtn = document.querySelector('.view-btn[onclick*="list"]');
        if (listBtn) listBtn.classList.add('active');

    } else if (layout === 'masonry') {
        grid.classList.add('view-masonry');
        // Inyectar CSS de masonry
        const style = document.createElement('style');
        style.id = 'layoutMasonryDynamic';
        style.textContent = `
.products-grid.view-masonry {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
}
.products-grid.view-masonry .product-card:nth-child(odd)  .product-image { height: 200px; }
.products-grid.view-masonry .product-card:nth-child(even) .product-image { height: 140px; }`;
        document.head.appendChild(style);

    } else {
        // 'grid' — default
        grid.classList.add('view-grid');
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        const gridBtn = document.querySelector('.view-btn[onclick*="grid"]');
        if (gridBtn) gridBtn.classList.add('active');
    }

    console.log(`📐 Layout productos aplicado: ${layout}`);
}

// ==========================================
// ★ INYECTAR CSS DINÁMICO PARA PRODUCT CARD v5.7
// ==========================================
function injectProductCardStyles(pcConfig) {
    if (!pcConfig) {
        console.log('⚠️ No hay configuración de productCard, usando defaults');
        pcConfig = getDefaultProductCardConfig();
    }
    
    console.log('🎨 Inyectando Product Card styles v5.7 con badges v2.3...');
    
    // Remover estilos anteriores si existen
    const existingStyle = document.getElementById('productCardDynamicStyles');
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'productCardDynamicStyles';
    
    // Obtener configuraciones
    const btnStyle = pcConfig.buttons?.style || 'rounded';
    const btnRadius = btnStyle === 'pill' ? '50px' : btnStyle === 'square' ? '4px' : '8px';
    const badgeStyle = pcConfig.badges?.style || 'rounded';
    const badgeRadius = badgeStyle === 'pill' ? '50px' : badgeStyle === 'square' ? '2px' : badgeStyle === 'ribbon' ? '0' : '4px';
    const starsColor = pcConfig.rating?.starsColor || '#fbbf24';
    
    // ★ Colores de badges v5.7
    const colors = pcConfig.badges?.colors || {};
    const discountColor = colors.discount || '#ef4444';
    const newColor = colors.new || '#22c55e';
    const featuredColor = colors.featured || '#f59e0b';
    const flashColor = colors.flash || '#8b5cf6';
    const freeShipColor = colors.freeShip || '#0ea5e9';
    const preOrderColor = colors.preOrder || '#6366f1';
    const limitedColor = colors.limitedEdition || '#ec4899';
    const comboColor = colors.combo || '#14b8a6';
    const warrantyColor = colors.warranty || '#0891b2';
    const ecoColor = colors.ecoFriendly || '#22c55e';
    const customColor = colors.custom || '#6366f1';
    const personalizableColor = colors.personalizable || '#ec4899';
    
    style.textContent = `
        /* ★ Product Card Dynamic Styles v5.7 - Badges v2.3 */
        
        /* ═══════════════════════════════════════
           ESTILOS DE BOTONES
           ═══════════════════════════════════════ */
        .product-card .btn-add-cart,
        .product-card .btn-action {
            border-radius: ${btnRadius} !important;
        }
        
        .product-card .product-badge {
            border-radius: ${badgeRadius} !important;
        }
        
        .product-card .product-rating .stars {
            color: ${starsColor};
        }
        
        /* ═══════════════════════════════════════
           POSICIÓN DE BADGES
           ═══════════════════════════════════════ */
        .product-card .badges-container {
            position: absolute;
            top: 8px;
            ${pcConfig.badges?.position === 'top-right' ? 'right: 8px; left: auto;' : 
              pcConfig.badges?.position === 'top-center' ? 'left: 50%; transform: translateX(-50%);' : 
              'left: 8px;'}
            display: flex;
            flex-direction: column;
            gap: 4px;
            z-index: 10;
        }
        
        /* ═══════════════════════════════════════
           TAMAÑOS DE BADGES
           ═══════════════════════════════════════ */
        .product-badge.size-small { font-size: 0.65rem; padding: 2px 6px; }
        .product-badge.size-medium { font-size: 0.75rem; padding: 3px 8px; }
        .product-badge.size-large { font-size: 0.85rem; padding: 4px 10px; }
        
        /* ═══════════════════════════════════════
           ★ COLORES DE BADGES v5.7 - AUTOMÁTICOS
           ═══════════════════════════════════════ */
        .product-badge.badge-discount { 
            background: ${discountColor}; 
            color: white; 
        }
        .product-badge.badge-new { 
            background: ${newColor}; 
            color: white; 
        }
        .product-badge.badge-lastunit { 
            background: #f97316; 
            color: white; 
        }
        .product-badge.badge-soldout { 
            background: #6b7280; 
            color: white; 
        }
        .product-badge.badge-toprated { 
            background: #fbbf24; 
            color: #1f2937; 
        }
        .product-badge.badge-popular { 
            background: #3b82f6; 
            color: white; 
        }
        
        /* ═══════════════════════════════════════
           ★ COLORES DE BADGES v5.7 - MANUALES (9 tipos)
           ═══════════════════════════════════════ */
        .product-badge.badge-featured { 
            background: ${featuredColor}; 
            color: white; 
        }
        .product-badge.badge-freeship { 
            background: ${freeShipColor}; 
            color: white; 
        }
        .product-badge.badge-preorder { 
            background: ${preOrderColor}; 
            color: white; 
        }
        .product-badge.badge-limited { 
            background: ${limitedColor}; 
            color: white; 
        }
        .product-badge.badge-flash { 
            background: ${flashColor}; 
            color: white; 
        }
        .product-badge.badge-combo { 
            background: ${comboColor}; 
            color: white; 
        }
        .product-badge.badge-warranty { 
            background: ${warrantyColor}; 
            color: white; 
        }
        .product-badge.badge-eco { 
            background: ${ecoColor}; 
            color: white; 
        }
        .product-badge.badge-custom { 
            background: ${customColor}; 
            color: white; 
        }
        
        /* ★ NUEVO v5.8: Badge Personalizable */
.product-badge.badge-personalizable { 
    background: ${personalizableColor}; 
    color: white; 
}
        
        /* Badge de promo (legacy) */
        .product-badge.badge-promo { 
            background: linear-gradient(135deg, #ec4899, #8b5cf6); 
            color: white; 
        }
        
        /* Badge bestseller (legacy) */
        .product-badge.badge-bestseller { 
            background: #8b5cf6; 
            color: white; 
        }
        
        /* ═══════════════════════════════════════
           RIBBON STYLE
           ═══════════════════════════════════════ */
        .product-badge.style-ribbon {
            position: relative;
            padding-left: 10px;
            padding-right: 14px;
        }
        .product-badge.style-ribbon::after {
            content: '';
            position: absolute;
            right: -8px;
            top: 0;
            border: 10px solid transparent;
            border-left-color: inherit;
        }
        
        /* ═══════════════════════════════════════
           STOCK BAR
           ═══════════════════════════════════════ */
        .stock-bar-container {
            width: 100%;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
            margin-top: 4px;
        }
        .stock-bar-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease;
        }
        .stock-bar-fill.high { background: linear-gradient(90deg, #22c55e, #84cc16); }
        .stock-bar-fill.medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .stock-bar-fill.low { background: linear-gradient(90deg, #ef4444, #f97316); }
        
        /* ═══════════════════════════════════════
           RATING STARS
           ═══════════════════════════════════════ */
        .product-rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            margin: 4px 0;
        }
        .product-rating .stars {
            display: flex;
            gap: 1px;
        }
        .product-rating .count {
            color: #6b7280;
            font-size: 0.7rem;
        }
        
        /* ═══════════════════════════════════════
           SOCIAL PROOF
           ═══════════════════════════════════════ */
        .social-proof {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            font-size: 0.65rem;
            color: #6b7280;
            margin: 4px 0;
        }
        .social-proof-item {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .social-proof-item.viewing { color: #f59e0b; }
        .social-proof-item.sold { color: #22c55e; }
        
        /* ═══════════════════════════════════════
           ACTION BUTTONS
           ═══════════════════════════════════════ */
        .product-actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }
        .product-actions.position-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px;
            background: linear-gradient(transparent, rgba(0,0,0,0.7));
            opacity: 0;
            transition: opacity 0.2s;
        }
        .product-card:hover .product-actions.position-overlay {
            opacity: 1;
        }
        .product-actions.position-below-image {
            padding: 8px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .btn-action-icon {
            width: 32px;
            height: 32px;
            border-radius: ${btnRadius};
            border: 1px solid #e5e7eb;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
        }
        .btn-action-icon:hover { background: #f8fafc; transform: scale(1.05); }
        .btn-action-icon.favorite { color: #ef4444; }
        .btn-action-icon.whatsapp { color: #25D366; }
        .btn-action-icon.compare { color: #6366f1; }
        .btn-action-icon.quickview { color: #8b5cf6; }
        
        /* ═══════════════════════════════════════
           URGENCY
           ═══════════════════════════════════════ */
        .product-urgency {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 8px;
            background: linear-gradient(90deg, rgba(239,68,68,0.1), rgba(249,115,22,0.1));
            border-radius: 6px;
            font-size: 0.7rem;
            color: #ef4444;
            margin-top: 6px;
        }
        .product-urgency i { font-size: 0.9rem; }
        .urgency-timer {
            display: flex;
            gap: 4px;
        }
        .timer-unit {
            background: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        
        /* ═══════════════════════════════════════
           PRICE STYLING
           ═══════════════════════════════════════ */
        .product-price-container {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .price-original {
            font-size: 0.75rem;
            color: #9ca3af;
            text-decoration: line-through;
        }
        .price-current {
            font-size: 1rem;
            font-weight: 700;
            color: #1f2937;
        }
        .price-savings {
            font-size: 0.7rem;
            color: #22c55e;
            font-weight: 600;
        }
        .price-unit {
            font-size: 0.65rem;
            color: #9ca3af;
        }
        
        /* ═══════════════════════════════════════
           STOCK TEXT
           ═══════════════════════════════════════ */
        .stock-indicator {
            font-size: 0.7rem;
            margin-top: 4px;
        }
        .stock-indicator.in-stock { color: #22c55e; }
        .stock-indicator.low-stock { color: #f59e0b; }
        .stock-indicator.out-of-stock { color: #ef4444; }
        
        /* ═══════════════════════════════════════
           NOTIFY BUTTON
           ═══════════════════════════════════════ */
        .btn-notify {
            width: 100%;
            padding: 8px;
            background: #f3f4f6;
            border: 1px dashed #d1d5db;
            border-radius: ${btnRadius};
            color: #6b7280;
            font-size: 0.75rem;
            cursor: pointer;
            margin-top: 6px;
            transition: all 0.2s;
        }
        .btn-notify:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
        }
        
        /* ═══════════════════════════════════════
           PRODUCT DESCRIPTION
           ═══════════════════════════════════════ */
        .product-description {
            font-size: 0.75rem;
            color: #6b7280;
            line-height: 1.4;
            margin: 4px 0 6px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        /* ═══════════════════════════════════════
           VIDEO HOVER
           ═══════════════════════════════════════ */
        .product-card.has-video-hover .product-image {
            position: relative;
        }
        .video-hover-indicator {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            background: rgba(0,0,0,0.6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8rem;
            opacity: 0.7;
            transition: opacity 0.2s;
            z-index: 5;
        }
        .product-card.has-video-hover:hover .video-hover-indicator {
            opacity: 0;
        }
        .video-hover-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 15;
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: inherit;
            overflow: hidden;
        }
        .video-hover-container.behavior-overlay {
            background: rgba(0,0,0,0.3);
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Product Card styles v5.7 inyectados correctamente');
}

// ══════════════════════════════════════════════════════════════════════
// FIN SESIÓN 2/5
// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// SESIÓN 3/5 - RENDERIZADO DE PRODUCTOS CON BADGES v2.3
// ══════════════════════════════════════════════════════════════════════

// ==========================================
// ★ RENDERIZAR PRODUCTOS v5.7
// ==========================================
function renderProducts(items) {
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = items.length;

    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // ★ v3.6 SCROLL INFINITO: guardamos el array filtrado y reseteamos paginación
    productosFiltrados = items;
    paginaActual = 0;

    if (items.length === 0) {
        grid.innerHTML = `<div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <h3>No hay productos</h3>
                            <p>Aún no se han agregado productos a esta tienda</p>
                          </div>`;
        if (scrollObserver) scrollObserver.disconnect();
        const sentinel = document.getElementById('scrollSentinel');
        if (sentinel) sentinel.style.display = 'none';
        return;
    }

    // ★ Mergear configuración del usuario con defaults v5.7
    const pcConfig = mergeProductCardConfig(
        getDefaultProductCardConfig(),
        tiendaConfig.config_tienda.productCard || {}
    );

    const primaryColor = tiendaConfig.config_tienda.styles?.primaryColor || tiendaConfig.color;

    console.log('🛍️ Renderizando productos con badges v2.3 (scroll infinito v3.6)');

    // Renderizar SOLO la primera página
    paginaActual = 1;
    const firstPage = items.slice(0, ITEMS_POR_PAGINA);
    grid.innerHTML = firstPage
        .map((p, index) => renderProductCard(p, pcConfig, primaryColor, index))
        .join('');

    console.log(`✅ Página 1 renderizada: ${firstPage.length} de ${items.length} productos`);

    // Activar / desactivar observer según si hay más páginas
    if (items.length > ITEMS_POR_PAGINA) {
        setupInfiniteScroll();
    } else {
        if (scrollObserver) scrollObserver.disconnect();
        const sentinel = document.getElementById('scrollSentinel');
        if (sentinel) sentinel.style.display = 'none';
    }
}

// ==========================================
// ★ v3.6 SCROLL INFINITO — sentinel + observer + carga incremental
// ==========================================
function ensureScrollSentinel() {
    let sentinel = document.getElementById('scrollSentinel');
    const grid = document.getElementById('productsGrid');
    if (!grid) return null;
    if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.id = 'scrollSentinel';
        // Sentinel invisible justo después del grid; sirve de trigger del observer
        sentinel.style.cssText = 'width:100%;height:1px;margin:24px 0 0 0;padding:0;pointer-events:none;';
        sentinel.setAttribute('aria-hidden', 'true');
        grid.parentNode.insertBefore(sentinel, grid.nextSibling);
    }
    sentinel.style.display = 'block';
    return sentinel;
}

function setupInfiniteScroll() {
    const sentinel = ensureScrollSentinel();
    if (!sentinel) return;
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) cargarMasProductos();
    }, { rootMargin: '400px 0px' }); // pre-carga 400px antes de llegar
    scrollObserver.observe(sentinel);
}

function cargarMasProductos() {
    // ¿Ya se renderizó todo lo filtrado?
    if (paginaActual * ITEMS_POR_PAGINA >= productosFiltrados.length) {
        if (scrollObserver) scrollObserver.disconnect();
        const sentinel = document.getElementById('scrollSentinel');
        if (sentinel) sentinel.style.display = 'none';
        return;
    }

    paginaActual++;
    const start = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const end = start + ITEMS_POR_PAGINA;
    const nextChunk = productosFiltrados.slice(start, end);

    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const pcConfig = mergeProductCardConfig(
        getDefaultProductCardConfig(),
        tiendaConfig.config_tienda.productCard || {}
    );
    const primaryColor = tiendaConfig.config_tienda.styles?.primaryColor || tiendaConfig.color;

    const newHtml = nextChunk
        .map((p, i) => renderProductCard(p, pcConfig, primaryColor, start + i))
        .join('');
    grid.insertAdjacentHTML('beforeend', newHtml);

    console.log(`➕ Página ${paginaActual} cargada: ${nextChunk.length} productos (total renderizados: ${end > productosFiltrados.length ? productosFiltrados.length : end} / ${productosFiltrados.length})`);

    // Si llegamos al final, desmontar
    if (end >= productosFiltrados.length) {
        if (scrollObserver) scrollObserver.disconnect();
        const sentinel = document.getElementById('scrollSentinel');
        if (sentinel) sentinel.style.display = 'none';
    }
}

// ==========================================
// ★ RENDERIZAR PRODUCT CARD CON BADGES v2.3
// ==========================================
function renderProductCard(p, pcConfig, primaryColor, index) {
    const badgesConfig = pcConfig.badges || {};
    const autoBadges = badgesConfig.auto || {};
    const manualBadges = badgesConfig.manual || {};
    const badgeColors = badgesConfig.colors || {};
    
    const pricing = pcConfig.pricing || {};
    const ratingConfig = pcConfig.rating || {};
    const stockConfig = pcConfig.stock || {};
    const buttons = pcConfig.buttons || {};
    const urgency = pcConfig.urgency || {};
    const descriptionConfig = pcConfig.description || {};
    const videoHoverConfig = pcConfig.videoHover || {};
    
    // ★ BADGES VIENEN DEL BACKEND (p.badges) - Ya calculados
    const badges = p.badges || {};
    
    // Datos de precio del backend
    const precio = p.precio || 0;
    const precioOriginal = p.precio_original || null;
    const tieneDescuento = badges.descuento || false;
    const descuentoPorcentaje = badges.descuento_porcentaje || 0;
    const descuentoAhorro = badges.descuento_ahorro || 0;
    
    // Datos de stock
    const stockNum = p.stock ?? null;
    const estaAgotado = badges.agotado || false;
    const ultimasUnidades = badges.ultimas_unidades || false;
    const stockBajo = badges.stock_bajo || false;
    const stockPercent = stockNum !== null ? Math.min(100, (stockNum / 20) * 100) : 100;
    
    // Datos de rating del backend
    const rating = badges.rating || 0;
    const totalReviews = badges.total_reviews || 0;
    const totalVentas = badges.total_ventas || 0;
    
    // Video Hover
    const videoUrl = getProductVideoUrl(p);
    const videoHoverEnabled = videoHoverConfig.enabled && videoUrl;
    const videoHoverClass = videoHoverEnabled ? 'has-video-hover' : '';
    const videoHoverBehavior = videoHoverConfig.behavior || 'replace';
    const videoHoverMuted = videoHoverConfig.muted !== false;
    
    // ==========================================
    // ★ CONSTRUIR BADGES HTML v2.3
    // ==========================================
    let badgesHtml = '<div class="badges-container">';
    const badgeSize = `size-${badgesConfig.size || 'medium'}`;
    const badgeStyleClass = badgesConfig.style === 'ribbon' ? 'style-ribbon' : '';
    
    // ═══════════════════════════════════════
    // BADGE AGOTADO (prioridad máxima)
    // ═══════════════════════════════════════
    if (estaAgotado && autoBadges.soldOut !== false) {
        badgesHtml += `<span class="product-badge badge-soldout ${badgeSize} ${badgeStyleClass}">😱 Agotado</span>`;
    } else {
        // ═══════════════════════════════════════
        // BADGES AUTOMÁTICOS (del backend)
        // ═══════════════════════════════════════
        
        // Descuento
        if (tieneDescuento && autoBadges.discount !== false) {
            badgesHtml += `<span class="product-badge badge-discount ${badgeSize} ${badgeStyleClass}">-${descuentoPorcentaje}%</span>`;
        }
        
        
        // Nuevo
        if (badges.nuevo && autoBadges.new !== false) {
            badgesHtml += `<span class="product-badge badge-new ${badgeSize} ${badgeStyleClass}">🆕 Nuevo</span>`;
        }
        
        // Últimas unidades
        if (ultimasUnidades && autoBadges.lastUnit !== false) {
            badgesHtml += `<span class="product-badge badge-lastunit ${badgeSize} ${badgeStyleClass}">⚠️ Última unidad</span>`;
        }
        
        // Mejor valorado (automático por rating)
        if (badges.mejor_valorado && autoBadges.topRated) {
            badgesHtml += `<span class="product-badge badge-toprated ${badgeSize} ${badgeStyleClass}">⭐ Top valorado</span>`;
        }
        
        // Popular (automático por visitas)
        if (badges.popular && autoBadges.popular) {
            badgesHtml += `<span class="product-badge badge-popular ${badgeSize} ${badgeStyleClass}">🔥 Popular</span>`;
        }
        
        // ═══════════════════════════════════════
        // ★ BADGES MANUALES v2.3 (9 tipos - del backend)
        // ═══════════════════════════════════════
        
        // 1. Destacado
        if (badges.destacado && manualBadges.featured !== false) {
            badgesHtml += `<span class="product-badge badge-featured ${badgeSize} ${badgeStyleClass}">⭐ Destacado</span>`;
        }
        
        // 2. Envío Gratis
        if (badges.envio_gratis && manualBadges.freeShip !== false) {
            badgesHtml += `<span class="product-badge badge-freeship ${badgeSize} ${badgeStyleClass}">🚚 Envío gratis</span>`;
        }
        
        // 3. Pre-orden
        if (badges.pre_orden && manualBadges.preOrder !== false) {
            badgesHtml += `<span class="product-badge badge-preorder ${badgeSize} ${badgeStyleClass}">📅 Pre-orden</span>`;
        }
        
        // 4. Edición Limitada
        if (badges.edicion_limitada && manualBadges.limitedEdition !== false) {
            badgesHtml += `<span class="product-badge badge-limited ${badgeSize} ${badgeStyleClass}">💎 Ed. Limitada</span>`;
        }
        
        // 5. Oferta Flash
        if (badges.oferta_flash && manualBadges.flashSale !== false) {
            badgesHtml += `<span class="product-badge badge-flash ${badgeSize} ${badgeStyleClass}">⚡ Flash</span>`;
        }
        
        // 6. Combo/Pack
        if (badges.combo && manualBadges.combo !== false) {
            badgesHtml += `<span class="product-badge badge-combo ${badgeSize} ${badgeStyleClass}">📦 Combo</span>`;
        }
        
        // 7. Garantía Extendida
        if (badges.garantia_extendida && manualBadges.warranty !== false) {
            badgesHtml += `<span class="product-badge badge-warranty ${badgeSize} ${badgeStyleClass}">🛡️ Garantía+</span>`;
        }
        
        // 8. Eco-Friendly
        if (badges.eco_friendly && manualBadges.ecoFriendly !== false) {
            badgesHtml += `<span class="product-badge badge-eco ${badgeSize} ${badgeStyleClass}">🌿 Eco</span>`;
        }
        
        // 9. Badge Personalizado
        if (badges.badge_personalizado && manualBadges.custom !== false) {
            const customText = badges.badge_personalizado_texto || 'Especial';
            badgesHtml += `<span class="product-badge badge-custom ${badgeSize} ${badgeStyleClass}">✨ ${escapeHtml(customText)}</span>`;
        
        // ═══════════════════════════════════════
// ★ BADGE PERSONALIZABLE v5.8
// ═══════════════════════════════════════
const esPersonalizable = p.personalizacion_activa === true || 
                         p.personalizable === true || 
                         badges.personalizable === true;

if (esPersonalizable && autoBadges.personalizable !== false) {
    badgesHtml += `<span class="product-badge badge-personalizable ${badgeSize} ${badgeStyleClass}">🎨 Personalizable</span>`;
}
        }
        
        // ═══════════════════════════════════════
        // BADGES LEGACY (compatibilidad)
        // ═══════════════════════════════════════
        
        // Más Vendido (legacy - ahora puede venir de badges_data)
        if (badges.mas_vendido && manualBadges.featured !== false) {
            // Solo mostrar si no hay otro badge de destacado
            if (!badges.destacado) {
                badgesHtml += `<span class="product-badge badge-bestseller ${badgeSize} ${badgeStyleClass}">🔥 Más vendido</span>`;
            }
        }
        
        // Promo activa (con countdown)
        if (badges.promo_activa) {
            const promoTexto = badges.promo_texto || '🎉 Promo';
            badgesHtml += `<span class="product-badge badge-promo ${badgeSize} ${badgeStyleClass}">${promoTexto}</span>`;
        }
    }
    badgesHtml += '</div>';
    
    // ==========================================
    // CONSTRUIR PRECIO HTML
    // ==========================================
    let priceHtml = '<div class="product-price-container">';
    if (tieneDescuento && pricing.showOriginal) {
        priceHtml += `<span class="price-original">${formatPriceWithConfig(precioOriginal, pricing)}</span>`;
    }
    priceHtml += `<span class="price-current">${formatPriceWithConfig(precio, pricing)}</span>`;
    if (tieneDescuento) {
        let savingsText = '';
        if (pricing.showSavings && pricing.showPercent) {
            savingsText = `Ahorras ${formatPriceWithConfig(descuentoAhorro, pricing)} (${descuentoPorcentaje}%)`;
        } else if (pricing.showSavings) {
            savingsText = `Ahorras ${formatPriceWithConfig(descuentoAhorro, pricing)}`;
        } else if (pricing.showPercent) {
            savingsText = `${descuentoPorcentaje}% OFF`;
        }
        if (savingsText) {
            priceHtml += `<span class="price-savings">${savingsText}</span>`;
        }
    }
    priceHtml += '</div>';
    
    // ==========================================
    // CONSTRUIR DESCRIPCIÓN HTML
    // ==========================================
    let descriptionHtml = '';
    if (descriptionConfig.show && p.descripcion) {
        const maxLen = descriptionConfig.maxLength || 100;
        let desc = p.descripcion;
        
        if (maxLen > 0 && desc.length > maxLen) {
            desc = desc.substring(0, maxLen).trim() + '...';
        }
        
        descriptionHtml = `<p class="product-description">${escapeHtml(desc)}</p>`;
    }
    
    // ==========================================
    // CONSTRUIR RATING HTML
    // ==========================================
    let ratingHtml = '';
    if ((ratingConfig.showStars || ratingConfig.showCount) && (rating > 0 || totalReviews > 0)) {
        ratingHtml = '<div class="product-rating">';
        if (ratingConfig.showStars && rating > 0) {
            const fullStars = Math.floor(rating);
            const hasHalf = rating % 1 >= 0.5;
            ratingHtml += '<div class="stars">';
            for (let i = 0; i < 5; i++) {
                if (i < fullStars) {
                    ratingHtml += '<i class="fas fa-star"></i>';
                } else if (i === fullStars && hasHalf) {
                    ratingHtml += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    ratingHtml += '<i class="far fa-star"></i>';
                }
            }
            ratingHtml += '</div>';
        }
        if (ratingConfig.showCount && totalReviews > 0) {
            ratingHtml += `<span class="count">${rating.toFixed(1)} (${totalReviews})</span>`;
        }
        ratingHtml += '</div>';
    }
    
    // ==========================================
    // CONSTRUIR SOCIAL PROOF HTML
    // ==========================================
    // ==========================================
// CONSTRUIR SOCIAL PROOF HTML
// ==========================================
let socialProofHtml = '';
if (ratingConfig.showViewing || ratingConfig.showSold || ratingConfig.showViews) {
    socialProofHtml = '<div class="social-proof">';
    
    // ★ VISTAS (visitas_7_dias del backend)
    if (ratingConfig.showViews && p.visitas_7_dias > 0) {
        socialProofHtml += `<span class="social-proof-item views"><i class="fas fa-eye"></i> ${p.visitas_7_dias} vistas</span>`;
    }
    
    // Vendidos
    if (ratingConfig.showSold && totalVentas > 0) {
        socialProofHtml += `<span class="social-proof-item sold"><i class="fas fa-shopping-bag"></i> ${totalVentas}+ vendidos</span>`;
    }
    
    socialProofHtml += '</div>';
}
    
    // ==========================================
    // CONSTRUIR STOCK HTML
    // ==========================================
    let stockHtml = '';
    if (!estaAgotado && stockNum !== null) {
        if (stockConfig.showBar) {
            const barClass = stockPercent > 50 ? 'high' : stockPercent > 20 ? 'medium' : 'low';
            stockHtml += `<div class="stock-bar-container"><div class="stock-bar-fill ${barClass}" style="width: ${stockPercent}%"></div></div>`;
        }
        if (stockConfig.showStatus || (stockConfig.showLowAlert && (ultimasUnidades || stockBajo))) {
            if (ultimasUnidades || stockBajo) {
                stockHtml += `<div class="stock-indicator low-stock">⚠️ ¡Solo quedan ${stockNum} unidades!</div>`;
            } else if (stockConfig.showStatus) {
                stockHtml += `<div class="stock-indicator in-stock">✓ En stock${stockConfig.showQuantity ? ` (${stockNum})` : ''}</div>`;
            }
        }
    }
    
    // ==========================================
    // CONSTRUIR BOTONES DE ACCIÓN HTML
    // ==========================================
    const btnPosition = buttons.position || 'below-info';
    let actionsHtml = `<div class="product-actions position-${btnPosition}">`;
    
    if (!estaAgotado) {
        if (buttons.cart) {
            actionsHtml += `<button class="btn-add-cart" style="background: ${primaryColor}; flex: 1;" onclick="event.stopPropagation(); addToCart(${p.id})">
                <i class="fas fa-cart-plus"></i> ${buttons.cartText || 'Agregar'}
            </button>`;
        }
        if (buttons.favorite) {
            actionsHtml += `<button class="btn-action-icon favorite" onclick="event.stopPropagation(); toggleFavorite(${p.id})" title="Favoritos">
                <i class="far fa-heart"></i>
            </button>`;
        }
        if (buttons.whatsapp) {
            const waNumber = tiendaConfig.config_tienda.whatsapp?.numero || tiendaConfig.whatsapp;
            const waMsg = encodeURIComponent(`Hola, me interesa: ${p.nombre}`);
            actionsHtml += `<a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" class="btn-action-icon whatsapp" onclick="event.stopPropagation()" title="WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </a>`;
        }
        if (buttons.compare) {
            actionsHtml += `<button class="btn-action-icon compare" onclick="event.stopPropagation(); addToCompare(${p.id})" title="Comparar">
                <i class="fas fa-exchange-alt"></i>
            </button>`;
        }
        if (buttons.quickView) {
            actionsHtml += `<button class="btn-action-icon quickview" onclick="event.stopPropagation(); quickView(${p.id})" title="Vista rápida">
                <i class="fas fa-eye"></i>
            </button>`;
        }
    } else if (stockConfig.showNotify) {
        actionsHtml += `<button class="btn-notify" onclick="event.stopPropagation(); notifyWhenAvailable(${p.id})">
            <i class="fas fa-bell"></i> Avisarme cuando llegue
        </button>`;
    }
    actionsHtml += '</div>';
    
    // ==========================================
    // CONSTRUIR URGENCIA HTML
    // ==========================================
    let urgencyHtml = '';
    if (!estaAgotado && badges.promo_activa && badges.promo_segundos_restantes && urgency.timer) {
        const segundos = badges.promo_segundos_restantes;
        const hours = Math.floor(segundos / 3600);
        const mins = Math.floor((segundos % 3600) / 60);
        
        urgencyHtml = '<div class="product-urgency">';
        urgencyHtml += '<i class="fas fa-clock"></i>';
        urgencyHtml += `<div class="urgency-timer">
            <span class="timer-unit">${hours.toString().padStart(2, '0')}h</span>
            <span class="timer-unit">${mins.toString().padStart(2, '0')}m</span>
        </div>`;
        urgencyHtml += `<span>${badges.promo_texto || '¡Oferta termina pronto!'}</span>`;
        urgencyHtml += '</div>';
    } else if (!estaAgotado && urgency.message && urgency.customText) {
        urgencyHtml = '<div class="product-urgency">';
        urgencyHtml += '<i class="fas fa-bolt"></i>';
        urgencyHtml += `<span>${urgency.customText}</span>`;
        urgencyHtml += '</div>';
    }
    
    // ==========================================
    // ★ CONSTRUIR CARD HTML COMPLETO v5.7
    // ==========================================
    return `
        <div class="product-card ${estaAgotado ? 'sold-out' : ''} ${videoHoverClass}" 
             onclick="openProductDetail(productos.find(x => x.id === ${p.id}))"
             ${videoHoverEnabled ? `data-video-url="${escapeHtml(videoUrl)}" data-video-behavior="${videoHoverBehavior}" data-video-muted="${videoHoverMuted}"` : ''}
             style="animation-delay: ${Math.min(index * 0.05, 0.3)}s">
            
            <div class="product-image" ${videoHoverEnabled ? 'onmouseenter="activateVideoHover(this)" onmouseleave="deactivateVideoHover(this)"' : ''}>
                <img src="${p.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+imagen'}" 
                     alt="${p.nombre}" 
                     loading="lazy"
                     class="product-main-image">
                ${badgesHtml}
                ${buttons.favorite ? `<button class="btn-action-icon favorite" style="position:absolute;top:8px;right:8px;z-index:20;" onclick="event.stopPropagation(); toggleFavorite(${p.id})"><i class="far fa-heart"></i></button>` : ''}
                ${btnPosition === 'overlay' ? actionsHtml : ''}
                ${videoHoverEnabled ? '<div class="video-hover-indicator"><i class="fas fa-play-circle"></i></div>' : ''}
            </div>
            
            ${btnPosition === 'below-image' ? actionsHtml : ''}
            
            <div class="product-info">
                <div class="product-category">${p.categoria || 'General'}</div>
                <h3 class="product-name">${p.nombre}</h3>
                
                ${descriptionHtml}
                ${ratingHtml}
                ${socialProofHtml}
                ${priceHtml}
                ${stockHtml}
                ${urgencyHtml}
                
                ${btnPosition === 'below-info' ? actionsHtml : ''}
            </div>
        </div>
    `;
}

// ══════════════════════════════════════════════════════════════════════
// FIN SESIÓN 3/5
// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// SESIÓN 4/5 - FUNCIONES AUXILIARES, VIDEO HOVER, ACCIONES
// ══════════════════════════════════════════════════════════════════════

// ==========================================
// FUNCIONES DE VIDEO HOVER
// ==========================================
function activateVideoHover(imageContainer) {
    // Solo en desktop
    if (window.innerWidth < 768) return;
    
    const card = imageContainer.closest('.product-card');
    if (!card || !card.classList.contains('has-video-hover')) return;
    
    const videoUrl = card.dataset.videoUrl;
    const behavior = card.dataset.videoBehavior || 'replace';
    const muted = card.dataset.videoMuted !== 'false';
    
    if (!videoUrl) return;
    
    // Delay para evitar activación accidental
    videoHoverTimeout = setTimeout(() => {
        const img = imageContainer.querySelector('.product-main-image');
        if (!img) return;
        
        // Crear contenedor de video
        const videoContainer = document.createElement('div');
        videoContainer.className = `video-hover-container behavior-${behavior}`;
        videoContainer.innerHTML = renderVideoForCard(videoUrl, muted);
        
        if (behavior === 'replace') {
            img.style.opacity = '0';
            setTimeout(() => {
                imageContainer.appendChild(videoContainer);
                requestAnimationFrame(() => {
                    videoContainer.style.opacity = '1';
                });
            }, 200);
        } else {
            imageContainer.appendChild(videoContainer);
            requestAnimationFrame(() => {
                videoContainer.style.opacity = '1';
            });
        }
    }, 300);
}

function deactivateVideoHover(imageContainer) {
    if (videoHoverTimeout) {
        clearTimeout(videoHoverTimeout);
        videoHoverTimeout = null;
    }
    
    const videoContainer = imageContainer.querySelector('.video-hover-container');
    const img = imageContainer.querySelector('.product-main-image');
    
    if (videoContainer) {
        videoContainer.style.opacity = '0';
        setTimeout(() => {
            videoContainer.remove();
            if (img) img.style.opacity = '1';
        }, 200);
    }
}

function renderVideoForCard(videoUrl, muted = true) {
    const mutedAttr = muted ? 'muted' : '';
    const autoplayAttr = 'autoplay playsinline';
    
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeIdSimple(videoUrl);
        return `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${videoId}&playsinline=1" 
                frameborder="0"
                allow="autoplay; encrypted-media"
                style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">
            </iframe>
        `;
    } else if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.split('/').pop();
        return `
            <iframe 
                src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=${muted ? 1 : 0}&loop=1&background=1" 
                frameborder="0"
                allow="autoplay; fullscreen"
                style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">
            </iframe>
        `;
    } else {
        return `<video src="${videoUrl}" ${autoplayAttr} ${mutedAttr} loop style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"></video>`;
    }
}

function extractYouTubeIdSimple(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ==========================================
// OBTENER VIDEO URL DEL PRODUCTO
// ==========================================
function getProductVideoUrl(p) {
    if (!p) return null;
    
    // 1. Intentar desde video_url directo
    if (p.video_url) {
        return p.video_url;
    }
    
    // 2. Intentar desde columna videos (PostgreSQL text[] viene como array JS)
    if (p.videos) {
        if (Array.isArray(p.videos) && p.videos.length > 0) {
            const firstVideo = p.videos[0];
            if (typeof firstVideo === 'object' && firstVideo !== null && firstVideo.url) {
                return firstVideo.url;
            } else if (typeof firstVideo === 'string' && firstVideo.trim()) {
                return firstVideo.trim();
            }
        }
        
        if (typeof p.videos === 'string' && p.videos.trim()) {
            try {
                const videosArray = JSON.parse(p.videos);
                if (Array.isArray(videosArray) && videosArray.length > 0) {
                    const firstVideo = videosArray[0];
                    if (typeof firstVideo === 'object' && firstVideo.url) {
                        return firstVideo.url;
                    } else if (typeof firstVideo === 'string') {
                        return firstVideo.trim();
                    }
                }
            } catch (e) {
                return p.videos.trim();
            }
        }
    }
    
    // 3. Intentar desde youtube_links
    if (p.youtube_links) {
        if (Array.isArray(p.youtube_links) && p.youtube_links.length > 0) {
            const firstLink = p.youtube_links[0];
            if (typeof firstLink === 'object' && firstLink !== null && firstLink.url) {
                return firstLink.url;
            } else if (typeof firstLink === 'string' && firstLink.trim()) {
                return firstLink.trim();
            }
        }
        
        if (typeof p.youtube_links === 'string' && p.youtube_links.trim()) {
            try {
                const youtubeArray = JSON.parse(p.youtube_links);
                if (Array.isArray(youtubeArray) && youtubeArray.length > 0) {
                    const firstLink = youtubeArray[0];
                    if (typeof firstLink === 'object' && firstLink.url) {
                        return firstLink.url;
                    } else if (typeof firstLink === 'string') {
                        return firstLink.trim();
                    }
                }
            } catch (e) {
                return p.youtube_links.trim();
            }
        }
    }
    
    return null;
}

// ==========================================
// HELPERS
// ==========================================
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatPriceWithConfig(price, pricingConfig) {
    if (!price && price !== 0) return '';
    
    const currency = pricingConfig?.currency || 'COP';
    const sep = pricingConfig?.thousandsSep || '.';
    
    const symbols = { COP: '$', USD: '$', MXN: '$', EUR: '€' };
    const symbol = symbols[currency] || '$';
    
    let formatted = Math.round(price).toString();
    if (sep === '.') {
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else if (sep === ',') {
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    
    return `${symbol}${formatted}`;
}

function formatPrice(p) { 
    return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0 
    }).format(p || 0); 
}

function adjustColor(color, amount) {
    if (!color || !color.startsWith('#')) return color;
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ==========================================
// FUNCIONES DE ACCIONES DE PRODUCTO
// ==========================================
function toggleFavorite(productId) {
    const favorites = JSON.parse(localStorage.getItem(`favorites_${tiendaConfig.negocio_id}`) || '[]');
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('❤️ Eliminado de favoritos');
    } else {
        favorites.push(productId);
        showToast('❤️ Agregado a favoritos');
    }
    
    localStorage.setItem(`favorites_${tiendaConfig.negocio_id}`, JSON.stringify(favorites));
    
    document.querySelectorAll(`.product-card[onclick*="${productId}"] .favorite i`).forEach(icon => {
        icon.className = index > -1 ? 'far fa-heart' : 'fas fa-heart';
    });
}

function addToCompare(productId) {
    const compare = JSON.parse(localStorage.getItem(`compare_${tiendaConfig.negocio_id}`) || '[]');
    
    if (compare.length >= 4) {
        showToast('⚠️ Máximo 4 productos para comparar');
        return;
    }
    
    if (!compare.includes(productId)) {
        compare.push(productId);
        localStorage.setItem(`compare_${tiendaConfig.negocio_id}`, JSON.stringify(compare));
        showToast(`⚖️ Producto agregado para comparar (${compare.length}/4)`);
    } else {
        showToast('ℹ️ Este producto ya está en la comparación');
    }
}

function quickView(productId) {
    const product = productos.find(p => p.id === productId);
    if (product && typeof openProductDetail === 'function') {
        openProductDetail(product);
    }
}

function notifyWhenAvailable(productId) {
    const product = productos.find(p => p.id === productId);
    if (!product) return;
    
    const email = prompt(`📧 Ingresa tu email para avisarte cuando "${product.nombre}" esté disponible:`);
    
    if (email && email.includes('@')) {
        showToast('✅ Te avisaremos cuando llegue el producto');
        console.log('Notify request:', { productId, email });
    }
}

// ==========================================
// SPLASH SCREEN
// ==========================================
function showSplashScreen(splash) {
    const el = document.getElementById('splashScreen');
    if (!el) return;

    const logoContainer = el.querySelector('.splash-logo');
    const titleEl = document.getElementById('splashTitle');
    const subtitleEl = document.getElementById('splashSubtitle');
    const spinnerEl = el.querySelector('.splash-spinner');

    // Fondo
    if (splash.backgroundImage) {
        el.style.backgroundImage = `url(${splash.backgroundImage})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.classList.add('with-image');
    } else {
        el.style.backgroundImage = '';
        el.style.backgroundColor = splash.backgroundColor || '#ffffff';
    }

    // Color texto
    const textColor = splash.textColor || '#1e293b';
    if (titleEl) titleEl.style.color = textColor;
    if (subtitleEl) subtitleEl.style.color = textColor;

    // Logo / imágenes rotativas
    if (logoContainer) {
        const images = (splash.images || []).filter(img => img?.url);
        const size = splash.imageSize || { width: 120, height: 120 };
        logoContainer.style.width = `${size.width}px`;
        logoContainer.style.height = `${size.height}px`;

        if (images.length > 0) {
            setupSplashImageRotation(logoContainer, images, splash.rotation || {});
        } else {
            logoContainer.innerHTML = `<i class="fas fa-store"></i>`;
        }
    }

    // Título
    if (titleEl) {
        titleEl.textContent = splash.title || tiendaConfig.nombre;
        titleEl.style.display = splash.showTitle !== false ? 'block' : 'none';
    }

    // Subtítulo
    if (subtitleEl) {
        subtitleEl.textContent = splash.subtitle || 'Bienvenido';
        subtitleEl.style.display = splash.showSubtitle !== false ? 'block' : 'none';
    }

    // Spinner
    if (spinnerEl) {
        const showSp = splash.showSpinner !== false;
        spinnerEl.style.display = showSp ? 'block' : 'none';
        if (showSp) {
            const style = splash.spinnerStyle || 'circle';
            spinnerEl.className = `splash-spinner splash-spinner--${style}`;
            if (splash.spinnerColor) {
                spinnerEl.style.borderTopColor = splash.spinnerColor;
                spinnerEl.style.setProperty('--spinner-color', splash.spinnerColor);
            }
        }
    }

    el.classList.add('active');
    el.classList.remove('hidden');

    if (splash.autoClose !== false) {
        const delay = splash.autoCloseDelay || 3000;
        setTimeout(() => hideSplashScreen(), delay);
    }

    if (splash.closeOnClick !== false) {
        el.addEventListener('click', hideSplashScreen, { once: true });
    }
}

function setupSplashImageRotation(container, images, rotationConfig) {
    container.innerHTML = '';
    const rotation = rotationConfig || {};
    
    const imagesWrapper = document.createElement('div');
    imagesWrapper.className = 'splash-logo-images';
    imagesWrapper.classList.add(`effect-${rotation.effect || 'fade'}`);
    
    images.forEach((img, index) => {
        const imgEl = document.createElement('img');
        imgEl.src = img.url;
        imgEl.className = 'splash-logo-image';
        imgEl.alt = `Logo ${index + 1}`;
        if (index === 0) imgEl.classList.add('active');
        imagesWrapper.appendChild(imgEl);
    });
    
    container.appendChild(imagesWrapper);
    
    if (images.length > 1) {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'splash-image-dots';
        images.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = 'splash-image-dot';
            if (index === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        });
        container.parentNode.insertBefore(dotsContainer, container.nextSibling);
    }
    
    if (rotation.enabled && images.length > 1) {
        currentSplashImageIndex = 0;
        splashImageRotationInterval = setInterval(() => {
            rotateSplashImage(imagesWrapper, images.length, rotation.order);
        }, rotation.interval || 3000);
    }
}

function rotateSplashImage(wrapper, totalImages, order = 'sequential') {
    const imageElements = wrapper.querySelectorAll('.splash-logo-image');
    const dotsContainer = document.querySelector('.splash-image-dots');
    
    let nextIndex;
    if (order === 'random') {
        do { nextIndex = Math.floor(Math.random() * totalImages); } 
        while (nextIndex === currentSplashImageIndex && totalImages > 1);
    } else {
        nextIndex = (currentSplashImageIndex + 1) % totalImages;
    }
    
    imageElements.forEach((img, index) => {
        img.classList.remove('active', 'prev');
        if (index === nextIndex) img.classList.add('active');
        else if (index === currentSplashImageIndex) img.classList.add('prev');
    });
    
    if (dotsContainer) {
        dotsContainer.querySelectorAll('.splash-image-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === nextIndex);
        });
    }
    
    currentSplashImageIndex = nextIndex;
}

function hideSplashScreen() {
    if (splashDismissed) return;
    splashDismissed = true;
    
    if (splashImageRotationInterval) {
        clearInterval(splashImageRotationInterval);
        splashImageRotationInterval = null;
    }
    
    const el = document.getElementById('splashScreen');
    if (el) {
        el.classList.add('hidden');
        el.classList.remove('active');
        const dots = document.querySelector('.splash-image-dots');
        if (dots) dots.remove();
        setTimeout(() => { el.style.display = 'none'; }, 500);
    }
}

// ==========================================
// LOGO
// ==========================================
function applyLogo(logoConfig) {
    if (!logoConfig) return;
    
    const logoImg = document.getElementById('storeLogo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    
    const images = logoConfig.images || [];
    const singleUrl = logoConfig.url;
    const rotation = logoConfig.rotation || {};
    const size = logoConfig.size || 48;
    const shape = logoConfig.shape || 'rounded';
    
    if (logoImg) {
        logoImg.style.width = `${size}px`;
        logoImg.style.height = `${size}px`;
        logoImg.style.transition = 'opacity 0.25s ease';
        logoImg.style.borderRadius = shape === 'circular' ? '50%' : shape === 'square' ? '4px' : '10px';
        logoImg.style.objectFit = 'cover';
    }
    
    if (images.length > 0) {
        setupLogoImageRotation(logoImg, logoPlaceholder, images, rotation);
    } else if (singleUrl) {
        if (logoImg) { 
            logoImg.src = singleUrl; 
            logoImg.classList.remove('hidden'); 
        }
        if (logoPlaceholder) logoPlaceholder.classList.add('hidden');
    } else {
        if (logoImg) logoImg.classList.add('hidden');
        if (logoPlaceholder) logoPlaceholder.classList.remove('hidden');
    }
}

function setupLogoImageRotation(logoImg, placeholder, images, rotationConfig) {
    if (!logoImg) return;
    
    logoImg.src = images[0].url;
    logoImg.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    
    if (rotationConfig.enabled && images.length > 1) {
        currentLogoImageIndex = 0;
        logoImageRotationInterval = setInterval(() => {
            rotateLogoImage(logoImg, images, rotationConfig);
        }, rotationConfig.interval || 3000);
    }
}

function rotateLogoImage(logoImg, images, rotationConfig) {
    const order = rotationConfig.order || 'sequential';
    const effect = rotationConfig.effect || 'fade';
    
    let nextIndex;
    if (order === 'random') {
        do { nextIndex = Math.floor(Math.random() * images.length); } 
        while (nextIndex === currentLogoImageIndex && images.length > 1);
    } else {
        nextIndex = (currentLogoImageIndex + 1) % images.length;
    }
    
    if (effect === 'fade') {
        logoImg.style.opacity = '0';
        setTimeout(() => {
            logoImg.src = images[nextIndex].url;
            logoImg.style.opacity = '1';
        }, 250);
    } else {
        logoImg.src = images[nextIndex].url;
    }
    
    currentLogoImageIndex = nextIndex;
}

// ══════════════════════════════════════════════════════════════════════
// FIN SESIÓN 4/5
// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// SESIÓN 5/5 - NAVBAR, SIDEBAR, BANNERS, CATEGORÍAS, SLIDER, CARRITO
// ══════════════════════════════════════════════════════════════════════

// ==========================================
// NAVBAR Y SIDEBAR
// ==========================================
function applyNavbarLayout(layout) {
    const navbar = document.querySelector('.navbar-content');
    if (!navbar) return;
    
    const menuToggle = navbar.querySelector('.menu-toggle');
    const logo = navbar.querySelector('.navbar-brand');
    const search = navbar.querySelector('.search-bar');
    const cart = navbar.querySelector('.cart-btn');
    
    if (menuToggle) menuToggle.style.order = '0';
    
    switch(layout) {
        case 'logo-search-cart':
            if (logo) logo.style.order = '1';
            if (search) search.style.order = '2';
            if (cart) cart.style.order = '3';
            break;
        case 'cart-logo-search':
            if (cart) cart.style.order = '1';
            if (logo) logo.style.order = '2';
            if (search) search.style.order = '3';
            break;
        case 'logo-cart-search':
            if (logo) logo.style.order = '1';
            if (cart) cart.style.order = '2';
            if (search) search.style.order = '3';
            break;
        case 'search-logo-cart':
            if (search) search.style.order = '1';
            if (logo) logo.style.order = '2';
            if (cart) cart.style.order = '3';
            break;
    }
}

function toggleSidebar(forceCollapse = null) {
    const mainContainer = document.querySelector('.main-container');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarCollapsed = forceCollapse !== null ? forceCollapse : !sidebarCollapsed;
    
    if (mainContainer) mainContainer.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    
    const toggleBtn = document.querySelector('.sidebar-toggle-btn i');
    if (toggleBtn) toggleBtn.className = sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    
    if (window.innerWidth <= 900) {
        if (sidebar) sidebar.classList.toggle('mobile-open', !sidebarCollapsed);
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.toggle('active', !sidebarCollapsed);
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('sidebar-overlay')) toggleSidebar(true);
});

// ==========================================
// BANNERS
// ==========================================
function applyTopBanner(banner) {
    const bannerEl = document.getElementById('topBanner');
    if (!bannerEl) return;
    
    if (banner?.enabled === false) {
        bannerEl.style.display = 'none';
        bannerEl.classList.add('hidden');
    } else if (banner) {
        bannerEl.style.display = 'flex';
        bannerEl.classList.remove('hidden');
        const textEl = document.getElementById('bannerText');
        if (textEl) textEl.textContent = banner.text || 'Envío gratis';
        if (banner.color) bannerEl.style.background = banner.color;
    }
}

function applyHeroBanner(heroBanner) {
    const heroEl = document.getElementById('heroBanner');
    if (!heroEl) return;
    
    if (!heroBanner?.enabled) {
        heroEl.style.display = 'none';
        heroEl.classList.remove('active');
        return;
    }
    
    heroEl.style.display = 'block';
    heroEl.classList.add('active');
    
    if (heroBanner.backgroundImage) {
        heroEl.classList.add('with-image');
        heroEl.style.backgroundImage = `url(${heroBanner.backgroundImage})`;
    } else if (heroBanner.backgroundColor) {
        heroEl.style.background = heroBanner.backgroundColor;
    }
    
    const titleEl = document.getElementById('heroBannerTitle');
    const subtitleEl = document.getElementById('heroBannerSubtitle');
    if (titleEl) titleEl.textContent = heroBanner.title || '';
    if (subtitleEl) subtitleEl.textContent = heroBanner.subtitle || '';
    
    const badgesEl = document.getElementById('heroBannerBadges');
    if (badgesEl && heroBanner.badges?.length > 0) {
        badgesEl.innerHTML = heroBanner.badges.map(b => 
            `<div class="hero-badge"><i class="fas ${b.icon || 'fa-check'}"></i><span>${b.text}</span></div>`
        ).join('');
    }
}

function applyPromoBanner(promo) {
    const promoEl = document.getElementById('promoBanner');
    if (!promoEl) return;
    
    if (!promo || promo.enabled === false) {
        promoEl.style.display = 'none';
        promoEl.classList.add('hidden');
        return;
    }
    
    promoEl.style.display = 'flex';
    promoEl.classList.remove('hidden');
    
    const textEl = document.getElementById('promoText');
    if (textEl) textEl.textContent = promo.text || '¡OFERTAS!';
    if (promo.bgColor) promoEl.style.background = promo.bgColor;
    if (promo.textColor) promoEl.style.color = promo.textColor;
}

function applyWhatsApp(waConfig) {
    const waBtn = document.getElementById('whatsappBtn');
    if (!waBtn) return;

    const whatsappNumber = waConfig?.numero || tiendaConfig.whatsapp;

    if (waConfig?.enabled === false) {
        waBtn.style.display = 'none';
        waBtn.classList.add('hidden');
    } else if (whatsappNumber) {
        const cleanNumber = whatsappNumber.replace(/[\s\-\(\)]/g, '');
        const msg = waConfig?.message || 'Hola, vi tu tienda online';
        waBtn.href = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
        waBtn.style.display = 'flex';
        waBtn.classList.remove('hidden');
    } else {
        waBtn.style.display = 'none';
        waBtn.classList.add('hidden');
    }

    // ★ Sprint 9: CTA avanzado (llamada + Instagram + posición + horario)
    applyCTAAvanzado(waConfig?.cta);
}

// ==========================================
// ★ Sprint 9: CTA FLOTANTE AVANZADO
// ==========================================
function applyCTAAvanzado(cta) {
    // Limpiar CTAs previos
    const prev = document.getElementById('ctaAvanzadoGroup');
    if (prev) prev.remove();
    if (!cta) return;

    const posicion = cta.posicion || 'bottom-right';
    const posCSS   = posicion === 'bottom-left'   ? 'left:25px;right:auto;'
                   : posicion === 'bottom-center'  ? 'left:50%;transform:translateX(-50%);right:auto;'
                   : /* bottom-right */              'right:25px;left:auto;';

    // Verificar horario de atención
    const abierto = esHorarioAtencion(cta.horaAbre, cta.horaCierra);

    // Aplicar posición al botón WhatsApp si el horario lo controla
    const waBtn = document.getElementById('whatsappBtn');
    if (waBtn) {
        if (posicion === 'bottom-left') {
            waBtn.style.right = 'auto'; waBtn.style.left = '25px';
        } else if (posicion === 'bottom-center') {
            waBtn.style.right = 'auto'; waBtn.style.left = '50%'; waBtn.style.transform = 'translateX(-50%)';
        } else {
            waBtn.style.right = '25px'; waBtn.style.left = 'auto'; waBtn.style.transform = '';
        }
        // Tooltip de horario si está cerrado
        const tooltip = waBtn.querySelector('.whatsapp-tooltip');
        if (tooltip && !abierto) tooltip.textContent = '⏰ Fuera de horario';
        if (!abierto) waBtn.style.opacity = '0.65';
    }

    // Contenedor de botones extra
    const btns = [];
    if (cta.callEnabled && cta.callNumber) {
        btns.push({ href: `tel:${cta.callNumber.replace(/\s/g,'')}`, color:'#2563eb', icon:'📞', title:'Llamar' });
    }
    if (cta.instaEnabled && cta.instaUrl) {
        btns.push({ href: cta.instaUrl, color:'#e1306c', icon:'📸', title:'Instagram', target:'_blank' });
    }

    if (!btns.length) return;

    const group = document.createElement('div');
    group.id = 'ctaAvanzadoGroup';
    group.style.cssText = `position:fixed;bottom:92px;${posCSS}display:flex;flex-direction:column;gap:8px;z-index:999;align-items:center;`;
    group.innerHTML = btns.map(b => `
        <a href="${b.href}" ${b.target ? `target="${b.target}"` : ''} title="${b.title}"
           style="width:44px;height:44px;border-radius:50%;background:${b.color};display:flex;align-items:center;
                  justify-content:center;font-size:1.1rem;text-decoration:none;
                  box-shadow:0 3px 12px rgba(0,0,0,.25);transition:transform .2s;"
           onmouseover="this.style.transform='scale(1.12)'" onmouseout="this.style.transform='scale(1)'">
            ${b.icon}
        </a>`).join('');
    document.body.appendChild(group);
}

function esHorarioAtencion(abre, cierra) {
    if (!abre || !cierra) return true; // sin horario = siempre abierto
    const ahora  = new Date();
    const [ha, ma] = abre.split(':').map(Number);
    const [hc, mc] = cierra.split(':').map(Number);
    const mins    = ahora.getHours() * 60 + ahora.getMinutes();
    const minAbre = ha * 60 + ma;
    const minCierra = hc * 60 + mc;
    return mins >= minAbre && mins <= minCierra;
}

// ==========================================
// CATEGORÍAS
// ==========================================
function renderFeaturedCategories(categories, featuredConfig) {
    const featuredCats = categories.filter(c => c.featured).slice(0, 6);
    if (featuredCats.length === 0) return;
    
    const existing = document.getElementById('featuredCategoriesSection');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'featuredCategoriesSection';
    container.className = 'featured-categories-section';
    
    const style = featuredConfig.style || 'pills';
    
    let html = `<div class="featured-categories ${style}">`;
    featuredCats.forEach((cat, i) => {
        const catName = cat.name || cat.nombre || '';
        html += `<button class="featured-cat-btn ${i === 0 ? 'active' : ''}" 
                         onclick="filterCategoryFromFeatured('${catName}', this)">
                    <i class="fas ${resolveIconClass(cat.icon || cat.icono)}"></i>
                    <span>${catName}</span>
                </button>`;
    });
    html += '</div>';
    container.innerHTML = html;
    
    const position = featuredConfig.position || 'above-slider';
    let referenceEl = null;
    
    switch(position) {
        case 'above-slider':
            referenceEl = document.getElementById('sliderSection');
            if (referenceEl) referenceEl.parentNode.insertBefore(container, referenceEl);
            break;
        case 'below-promo':
            referenceEl = document.getElementById('promoBanner');
            if (referenceEl) referenceEl.parentNode.insertBefore(container, referenceEl.nextSibling);
            break;
        case 'above-promo':
            referenceEl = document.getElementById('promoBanner');
            if (referenceEl) referenceEl.parentNode.insertBefore(container, referenceEl);
            break;
        default:
            referenceEl = document.querySelector('.navbar');
            if (referenceEl) referenceEl.parentNode.insertBefore(container, referenceEl.nextSibling);
    }
}

function filterCategoryFromFeatured(catName, btn) {
    document.querySelectorAll('.featured-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.category-item').forEach(item => {
        const itemCat = item.dataset.category;
        item.classList.toggle('active', itemCat === catName.toLowerCase());
    });
    
    const cat = catName.toLowerCase().trim();
    let filtered = (cat === 'todas' || cat === 'todos') 
        ? productos 
        : productos.filter(p => (p.categoria || '').toLowerCase().trim() === cat);
    
    document.getElementById('productsTitle').textContent = (cat === 'todas' || cat === 'todos') 
        ? 'Todos los productos' 
        : catName;
    renderProducts(filtered);
}

function renderCustomCategories(cats) {
    const list = document.getElementById('categoryList');
    if (!list) return;
    
    list.innerHTML = cats.map((c, i) => `
        <li class="category-item ${i === 0 ? 'active' : ''}" 
            data-category="${(c.name || c.nombre || '').toLowerCase()}" 
            onclick="filterCategory('${c.name || c.nombre || ''}', this)">
            <i class="fas ${resolveIconClass(c.icon || c.icono)}"></i>
            <span>${c.name || c.nombre || 'Sin nombre'}</span>
            ${c.featured ? '<i class="fas fa-star featured-star"></i>' : ''}
        </li>
    `).join('');
}

function filterCategory(cat, el) {
    document.querySelectorAll('.category-item').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    
    document.querySelectorAll('.featured-cat-btn').forEach(btn => {
        const btnText = btn.querySelector('span')?.textContent?.toLowerCase();
        btn.classList.toggle('active', btnText === cat.toLowerCase());
    });
    
    const categoria = cat.toLowerCase().trim();
    let filtered = (categoria === 'todas' || categoria === 'todos') 
        ? productos 
        : productos.filter(p => (p.categoria || '').toLowerCase().trim() === categoria);
    
    document.getElementById('productsTitle').textContent = (categoria === 'todas' || categoria === 'todos') 
        ? 'Todos los productos' 
        : cat;
    
    renderProducts(filtered);
    
    if (window.innerWidth <= 900) toggleSidebar(true);
}

function renderProductCategories(cats) {
    const list = document.getElementById('categoryList');
    if (!list) return;
    
    let html = `<li class="category-item active" data-category="todas" onclick="filterCategory('todas', this)">
                    <i class="fas fa-th-large"></i><span>Todas</span>
                </li>`;
    cats.forEach(c => { 
        html += `<li class="category-item" data-category="${c.toLowerCase()}" onclick="filterCategory('${c}', this)">
                    <i class="fas fa-tag"></i><span>${c}</span>
                </li>`; 
    });
    list.innerHTML = html;
}

// ==========================================
// SLIDER
// ==========================================
function renderSlider(images, speed = 5000) {
    const section = document.getElementById('sliderSection');
    if (!section) return;
    
    if (sliderInterval) {
        clearInterval(sliderInterval);
        sliderInterval = null;
    }
    
    section.style.display = 'block';
    section.classList.add('active');
    
    const track = document.getElementById('sliderTrack');
    const dots = document.getElementById('sliderDots');
    
    if (track) {
        track.innerHTML = images.map((img, i) => {
            const src = typeof img === 'string' ? img : (img.src || img.url);
            return `<div class="slider-slide">
                        <img src="${src}" alt="Banner ${i + 1}" loading="lazy">
                    </div>`;
        }).join('');
    }
    
    if (dots && images.length > 1) {
        dots.innerHTML = images.map((_, i) => 
            `<span class="slider-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`
        ).join('');
    }
    
    if (images.length > 1) {
        sliderInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % images.length;
            updateSlider();
        }, speed);
    }
}

function slideMove(dir) {
    const slides = document.querySelectorAll('.slider-slide');
    if (slides.length === 0) return;
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    updateSlider();
}

function goToSlide(i) {
    currentSlide = i;
    updateSlider();
}

function updateSlider() {
    const track = document.getElementById('sliderTrack');
    if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.slider-dot').forEach((d, i) => 
        d.classList.toggle('active', i === currentSlide)
    );
}

// ==========================================
// VIDEOS
// ==========================================
function renderVideos(videos) {
    if (!videos || videos.length === 0) return;
    
    document.querySelectorAll('.video-section').forEach(el => el.remove());
    
    const videosByPosition = {
        'after-slider': [],
        'after-promo': [],
        'before-products': []
    };
    
    videos.forEach(video => {
        if (!video.enabled) return;
        const pos = video.position || 'after-slider';
        if (videosByPosition[pos]) {
            videosByPosition[pos].push(video);
        }
    });
    
    Object.entries(videosByPosition).forEach(([position, posVideos]) => {
        if (posVideos.length === 0) return;
        
        posVideos.forEach((video, index) => {
            const container = document.createElement('section');
            container.className = 'video-section active';
            container.style.width = `${video.width || 100}%`;
            container.style.maxWidth = '100%';
            container.style.padding = '10px';
            container.style.boxSizing = 'border-box';
            
            if (video.align === 'center') {
                container.style.margin = '0 auto';
            } else if (video.align === 'right') {
                container.style.marginLeft = 'auto';
                container.style.marginRight = '0';
            }
            
            let videoHtml = '';
            if (video.type === 'youtube') {
                videoHtml = `<iframe src="https://www.youtube.com/embed/${extractYouTubeId(video.url)}" 
                                     allowfullscreen 
                                     style="width:100%;height:100%;border:none;"></iframe>`;
            } else if (video.type === 'vimeo') {
                videoHtml = `<iframe src="https://player.vimeo.com/video/${extractVimeoId(video.url)}" 
                                     allowfullscreen
                                     style="width:100%;height:100%;border:none;"></iframe>`;
            } else {
                videoHtml = `<video src="${video.url}" controls style="width:100%;height:100%;"></video>`;
            }
            
            container.innerHTML = `
                <div class="video-container" style="
                    height: ${video.height || 400}px;
                    border-radius: ${video.borderRadius || '16px'};
                    overflow: hidden;
                    background: #000;
                ">
                    ${videoHtml}
                </div>
            `;
            
            let refEl = null;
            switch(position) {
                case 'after-slider':
                    refEl = document.getElementById('sliderSection');
                    if (refEl) refEl.parentNode.insertBefore(container, refEl.nextSibling);
                    break;
                case 'after-promo':
                    refEl = document.getElementById('promoBoxesSection');
                    if (refEl) refEl.parentNode.insertBefore(container, refEl.nextSibling);
                    break;
                case 'before-products':
                    refEl = document.getElementById('mainContainer');
                    if (refEl) refEl.parentNode.insertBefore(container, refEl);
                    break;
            }
        });
    });
}

function extractYouTubeId(url) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:.*v=|.*\/embed\/|.*\/v\/))([\w\-]{10,12})/);
    return match ? match[1] : url;
}

function extractVimeoId(url) {
    if (!url) return '';
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : url;
}

// ==========================================
// PRODUCTOS
// ==========================================
async function loadProducts() {
    if (!tiendaConfig.negocio_id) { 
        renderProducts([]); 
        return; 
    }
    
    try {
        // ★ v3.6: pedimos hasta 2000 al backend (cap del backend),
        // y el frontend pagina localmente con scroll infinito (36 productos por chunk).
        const response = await fetch(`${API_URL}/productos/publicos/${tiendaConfig.negocio_id}?limit=2000`);
        const data = await response.json();
        productos = data.productos || data.data || [];
        console.log('📦 Productos cargados:', productos.length);
        
        // Debug: ver badges del primer producto
        if (productos.length > 0) {
            console.log('🏷️ Ejemplo de badges v2.3 del backend:', productos[0].badges);
        }
        
        if (!tiendaConfig.config_tienda.categories?.length) {
    const existingItems = document.querySelectorAll('#categoryList li');
    if (!existingItems || existingItems.length <= 1) {
        const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
        renderProductCategories(cats);
    }
}
        
        initFiltrosBar();
        renderProducts(productos);

        if (tiendaConfig.config_tienda.promoBoxes?.length > 0 && productos.length > 0) {
            renderPromoBoxes(tiendaConfig.config_tienda.promoBoxes);
        }

        if (tiendaConfig.config_tienda.videos?.length > 0) {
            renderVideos(tiendaConfig.config_tienda.videos);
        }

    } catch (e) {
        console.error('Error cargando productos:', e);
        renderProducts([]);
    }
}

function initProductDetailFromConfig() {
    const pdConfig = tiendaConfig.config_tienda.productDetail || {};
    if (typeof initProductDetail === 'function') {
        initProductDetail(pdConfig);
    }
}

function checkUrlForProduct() {
    const hash = window.location.hash;
    if (hash.startsWith('#producto-')) {
        const productId = parseInt(hash.replace('#producto-', ''));
        const product = productos.find(p => p.id === productId);
        if (product) setTimeout(() => openProductDetail(product), 500);
    }
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash.startsWith('#producto-')) {
            const productId = parseInt(hash.replace('#producto-', ''));
            const product = productos.find(p => p.id === productId);
            if (product) openProductDetail(product);
        }
    });
}

// ★ v3.6: limpiar input de búsqueda (botón X del search-bar)
function clearSearchInput() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.value = '';
    // Disparamos el evento 'input' para que el listener de búsqueda
    // re-renderice el catálogo completo automáticamente.
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
}
window.clearSearchInput = clearSearchInput;

// ==========================================
// ★ v3.7 SEARCH OVERLAY — Fullscreen mobile-first con resultados en vivo
// ==========================================
let _searchOverlayOpen = false;
const SEARCH_MOBILE_BREAKPOINT = 768;

function isMobileViewport() {
    return window.innerWidth <= SEARCH_MOBILE_BREAKPOINT;
}

function openSearchOverlay() {
    if (_searchOverlayOpen) return;
    const overlay = document.getElementById('searchOverlay');
    const overlayInput = document.getElementById('searchOverlayInput');
    const navInput = document.getElementById('searchInput');
    if (!overlay || !overlayInput) return;

    _searchOverlayOpen = true;

    // Sincronizar valor desde el input del navbar (por si ya tenía búsqueda)
    overlayInput.value = navInput?.value || '';

    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-overlay-open');

    // Trigger animación en el siguiente frame
    requestAnimationFrame(() => {
        overlay.dataset.active = 'true';
    });

    // Focus al input del overlay (con delay para que termine la animación)
    setTimeout(() => {
        overlayInput.focus();
        // Mover cursor al final si había texto
        const len = overlayInput.value.length;
        try { overlayInput.setSelectionRange(len, len); } catch (e) {}
    }, 220);

    // Renderizar estado inicial (vacío con sugerencias o resultados si había query)
    renderSearchOverlayResults(overlayInput.value);

    // Empujar entrada al historial para que el botón atrás del celular cierre el overlay
    if (!window.history.state?.searchOverlayOpen) {
        history.pushState({ searchOverlayOpen: true }, '', '');
    }
}

function closeSearchOverlay(fromPopState = false) {
    if (!_searchOverlayOpen) return;
    _searchOverlayOpen = false;

    const overlay = document.getElementById('searchOverlay');
    const overlayInput = document.getElementById('searchOverlayInput');
    const navInput = document.getElementById('searchInput');

    // Sincronizar valor del overlay → input del navbar y disparar búsqueda en catálogo
    if (overlayInput && navInput) {
        navInput.value = overlayInput.value;
        navInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (overlay) {
        overlay.dataset.active = 'false';
        overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('search-overlay-open');

    // Quitar foco del input para que se cierre el teclado del celular
    overlayInput?.blur();

    // Si el cierre lo dispara el usuario (X / backdrop / botón atrás interno),
    // retrocedemos en historial. Si viene de popstate, ya retrocedió solo.
    if (!fromPopState && window.history.state?.searchOverlayOpen) {
        history.back();
    }
}

function clearSearchOverlayInput() {
    const input = document.getElementById('searchOverlayInput');
    if (!input) return;
    input.value = '';
    input.focus();
    renderSearchOverlayResults('');
}

function renderSearchOverlayResults(query) {
    const body = document.getElementById('searchOverlayBody');
    if (!body) return;

    query = (query || '').toLowerCase().trim();

    // Estado vacío: invitación + categorías rápidas
    if (!query) {
        const cats = [...new Set((productos || []).map(p => p.categoria).filter(Boolean))].slice(0, 8);
        const catsHtml = cats.length ? `
            <div class="search-quick-cats">
                <div class="search-quick-cats-title">Explorar por categoría</div>
                <div class="search-quick-cats-list">
                    ${cats.map(c => `<button type="button" class="search-quick-cat" onclick="searchByCategory('${escapeHtml(c).replace(/'/g, "\\'")}')">${escapeHtml(c)}</button>`).join('')}
                </div>
            </div>` : '';

        body.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-search"></i>
                <h3>Buscar productos</h3>
                <p>Escribe el nombre, categoría o descripción de lo que necesitas.</p>
            </div>
            ${catsHtml}
        `;
        return;
    }

    // Si aún no hay productos cargados
    if (!productos || !productos.length) {
        body.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Cargando productos…</h3>
                <p>Un momento mientras traemos el catálogo.</p>
            </div>`;
        return;
    }

    // Filtrar
    const matches = productos.filter(p =>
        (p.nombre || '').toLowerCase().includes(query) ||
        (p.categoria || '').toLowerCase().includes(query) ||
        (p.descripcion || '').toLowerCase().includes(query)
    );

    if (!matches.length) {
        body.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-search-minus"></i>
                <h3>Sin resultados</h3>
                <p>No encontramos productos para <strong>"${escapeHtml(query)}"</strong>. Intenta con otra palabra o revisa la ortografía.</p>
            </div>`;
        return;
    }

    const top = matches.slice(0, 8);
    const hasMore = matches.length > top.length;

    let html = `<div class="search-results-meta">${matches.length} resultado${matches.length === 1 ? '' : 's'}</div>`;
    html += top.map(p => `
        <div class="search-result-item" onclick="selectSearchResult(${p.id})">
            <img class="search-result-img"
                 src="${p.imagen_url || 'https://via.placeholder.com/120?text=Sin+img'}"
                 alt="${escapeHtml(p.nombre || '')}"
                 loading="lazy">
            <div class="search-result-info">
                <div class="search-result-name">${highlightSearchMatch(escapeHtml(p.nombre || ''), query)}</div>
                <div class="search-result-meta">
                    <span class="search-result-category">${escapeHtml(p.categoria || 'Producto')}</span>
                    <span class="search-result-price">${formatPrice(p.precio || 0)}</span>
                </div>
            </div>
        </div>
    `).join('');

    if (hasMore) {
        html += `
            <button type="button" class="search-see-all" onclick="seeAllSearchResults()">
                <i class="fas fa-list"></i>
                Ver los ${matches.length} resultados en el catálogo
            </button>`;
    }

    body.innerHTML = html;
}

function highlightSearchMatch(text, query) {
    if (!query) return text;
    // Escapar caracteres regex en el query
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safe})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function selectSearchResult(productId) {
    const product = (productos || []).find(p => p.id === productId);
    if (!product) return;
    closeSearchOverlay();
    setTimeout(() => {
        if (typeof openProductDetail === 'function') openProductDetail(product);
    }, 220);
}

function seeAllSearchResults() {
    closeSearchOverlay();
    setTimeout(() => {
        document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 280);
}

function searchByCategory(catName) {
    const overlayInput = document.getElementById('searchOverlayInput');
    if (overlayInput) {
        overlayInput.value = catName;
        renderSearchOverlayResults(catName);
    }
}

// Bind eventos del overlay (una sola vez)
(function bindSearchOverlay() {
    const overlay = document.getElementById('searchOverlay');
    const overlayInput = document.getElementById('searchOverlayInput');
    const closeBtn = document.getElementById('searchOverlayClose');
    const clearBtn = document.getElementById('searchOverlayClear');
    const backdrop = document.getElementById('searchOverlayBackdrop');
    const navInput = document.getElementById('searchInput');

    if (!overlay || !overlayInput) return;

    // Live search mientras el usuario escribe
    overlayInput.addEventListener('input', (e) => {
        renderSearchOverlayResults(e.target.value);
    });

    // Cerrar con botón atrás del overlay
    closeBtn?.addEventListener('click', () => closeSearchOverlay());

    // Cerrar tocando el backdrop (fuera del panel)
    backdrop?.addEventListener('click', () => closeSearchOverlay());

    // Limpiar
    clearBtn?.addEventListener('click', clearSearchOverlayInput);

    // Tecla Escape (desktop / teclado externo)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _searchOverlayOpen) closeSearchOverlay();
    });

    // Botón atrás del celular / navegador
    window.addEventListener('popstate', () => {
        if (_searchOverlayOpen) closeSearchOverlay(true);
    });

    // En MÓVIL, interceptar el tap en el input del navbar:
    // — readonly evita que se abra el teclado del celular ahí
    // — onclick abre el overlay (donde sí se escribe en grande)
    if (navInput) {
        const applyMobileMode = () => {
            if (isMobileViewport()) {
                navInput.setAttribute('readonly', 'readonly');
                navInput.style.cursor = 'pointer';
            } else {
                navInput.removeAttribute('readonly');
                navInput.style.cursor = '';
            }
        };
        applyMobileMode();
        window.addEventListener('resize', applyMobileMode);

        navInput.addEventListener('click', (e) => {
            if (isMobileViewport()) {
                e.preventDefault();
                navInput.blur();
                openSearchOverlay();
            }
        });
        navInput.addEventListener('focus', (e) => {
            if (isMobileViewport()) {
                e.preventDefault();
                navInput.blur();
                openSearchOverlay();
            }
        });
    }
})();

window.openSearchOverlay = openSearchOverlay;
window.closeSearchOverlay = closeSearchOverlay;

// ==========================================
// ★ FILTROS Y ORDENAMIENTO v1.0
// ==========================================
let filtrosState = {
    busqueda: '',
    orden: 'newest',
    categoria: null,
    precioMin: null,
    precioMax: null,
    soloDisponibles: false,
};

function aplicarFiltros() {
    let result = [...productos];

    if (filtrosState.soloDisponibles) {
        result = result.filter(p => (p.stock == null || p.stock > 0));
    }
    if (filtrosState.categoria) {
        result = result.filter(p => p.categoria === filtrosState.categoria);
    }
    if (filtrosState.busqueda) {
        const q = filtrosState.busqueda.toLowerCase();
        result = result.filter(p => (p.nombre || '').toLowerCase().includes(q));
    }
    if (filtrosState.precioMin != null) {
        result = result.filter(p => (p.precio || 0) >= filtrosState.precioMin);
    }
    if (filtrosState.precioMax != null) {
        result = result.filter(p => (p.precio || 0) <= filtrosState.precioMax);
    }

    switch (filtrosState.orden) {
        case 'best_seller':
            result.sort((a, b) => {
                const av = (a.total_ventas || 0) || (a.badges?.total_ventas || 0);
                const bv = (b.total_ventas || 0) || (b.badges?.total_ventas || 0);
                return bv - av;
            });
            break;
        case 'price_asc':
            result.sort((a, b) => (a.precio || 0) - (b.precio || 0));
            break;
        case 'price_desc':
            result.sort((a, b) => (b.precio || 0) - (a.precio || 0));
            break;
        case 'name_asc':
            result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            break;
        case 'newest':
        default:
            result.sort((a, b) => (b.id_producto || b.id || 0) - (a.id_producto || a.id || 0));
            break;
    }

    renderProducts(result);
}

function initFiltrosBar() {
    const cfg = tiendaConfig.config_tienda.filtros || {};
    const enabled       = cfg.enabled       !== false;
    const showOrden     = cfg.ordenamiento  !== false;
    const showCats      = cfg.categorias    !== false;
    const showPrecio    = cfg.rangoPrecio   !== false;
    const showDisponibles = cfg.soloDisponibles === true;
    const ordenDefault  = cfg.ordenDefault  || 'newest';

    if (!enabled) return;

    if (document.getElementById('filtros-bar')) return; // ya montado

    filtrosState.orden = ordenDefault;

    const primary = tiendaConfig.config_tienda.styles?.primaryColor || tiendaConfig.color || '#2563eb';

    // Calcular rango de precios
    const precios = productos.map(p => p.precio || 0).filter(v => v > 0);
    const precioMin = precios.length ? Math.floor(Math.min(...precios)) : 0;
    const precioMax = precios.length ? Math.ceil(Math.max(...precios)) : 999999;

    // Categorías únicas
    const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();

    // Opciones de ordenamiento
    const ordenOpciones = [
        { value: 'newest',      label: 'Más recientes' },
        { value: 'best_seller', label: 'Más vendidos' },
        { value: 'price_asc',   label: 'Precio: menor a mayor' },
        { value: 'price_desc',  label: 'Precio: mayor a menor' },
        { value: 'name_asc',    label: 'Nombre A–Z' },
    ];

    // Construir HTML
    let html = `<div id="filtros-bar" style="
        display:flex; flex-wrap:wrap; gap:10px; align-items:center;
        padding:10px 16px; background:#f8fafc;
        border:1px solid #e2e8f0; border-radius:10px;
        margin-bottom:14px; font-size:14px;
    ">`;

    if (showOrden) {
        const optHtml = ordenOpciones.map(o =>
            `<option value="${o.value}"${o.value === ordenDefault ? ' selected' : ''}>${o.label}</option>`
        ).join('');
        html += `
        <div style="display:flex;align-items:center;gap:6px;">
            <i class="fas fa-sort" style="color:#94a3b8"></i>
            <select id="filtro-orden"
                style="border:1px solid #cbd5e1;border-radius:6px;padding:5px 10px;font-size:13px;outline:none;background:#fff;cursor:pointer;"
                onchange="window._filtrosOrden(this.value)">
                ${optHtml}
            </select>
        </div>`;
    }

    if (showCats && cats.length > 1) {
        const chipsHtml = cats.map(c => `
            <button class="filtro-cat-chip" data-cat="${c}"
                style="padding:4px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:12px;white-space:nowrap;transition:all .15s;"
                onclick="window._filtrosCategoria(this, '${c.replace(/'/g, "\\'")}')">
                ${c}
            </button>`).join('');
        html += `
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
            <button class="filtro-cat-chip filtro-cat-active" data-cat=""
                style="padding:4px 12px;border-radius:20px;border:1px solid ${primary};background:${primary};color:#fff;cursor:pointer;font-size:12px;white-space:nowrap;"
                onclick="window._filtrosCategoria(this, '')">
                Todos
            </button>
            ${chipsHtml}
        </div>`;
    }

    if (showPrecio && precioMax > precioMin) {
        html += `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <i class="fas fa-dollar-sign" style="color:#94a3b8"></i>
            <span style="color:#64748b;font-size:12px;">Precio:</span>
            <input id="filtro-precio-min" type="number" min="${precioMin}" max="${precioMax}" placeholder="Mín"
                style="width:80px;border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px;font-size:12px;outline:none;"
                oninput="window._filtrosPrecio()">
            <span style="color:#94a3b8">–</span>
            <input id="filtro-precio-max" type="number" min="${precioMin}" max="${precioMax}" placeholder="Máx"
                style="width:80px;border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px;font-size:12px;outline:none;"
                oninput="window._filtrosPrecio()">
        </div>`;
    }

    if (showDisponibles) {
        html += `
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#475569;white-space:nowrap;">
            <input id="filtro-disponibles" type="checkbox"${filtrosState.soloDisponibles ? ' checked' : ''}
                style="accent-color:${primary};width:15px;height:15px;"
                onchange="window._filtrosDisponibles(this.checked)">
            Solo disponibles
        </label>`;
    }

    // Botón limpiar
    html += `
        <button onclick="window._filtrosLimpiar()"
            style="margin-left:auto;padding:4px 12px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;color:#64748b;">
            <i class="fas fa-times"></i> Limpiar
        </button>
    </div>`;

    // Inyectar antes de #productsGrid
    const grid = document.getElementById('productsGrid');
    if (grid) grid.insertAdjacentHTML('beforebegin', html);

    // Handlers expuestos globalmente (inline onclick)
    window._filtrosOrden = (val) => {
        filtrosState.orden = val;
        aplicarFiltros();
    };
    window._filtrosCategoria = (btn, cat) => {
        filtrosState.categoria = cat || null;
        document.querySelectorAll('.filtro-cat-chip').forEach(b => {
            b.style.background = '#fff';
            b.style.color = '#374151';
            b.style.borderColor = '#cbd5e1';
        });
        btn.style.background = primary;
        btn.style.color = '#fff';
        btn.style.borderColor = primary;
        aplicarFiltros();
    };
    window._filtrosPrecio = () => {
        const minEl = document.getElementById('filtro-precio-min');
        const maxEl = document.getElementById('filtro-precio-max');
        filtrosState.precioMin = minEl?.value ? parseFloat(minEl.value) : null;
        filtrosState.precioMax = maxEl?.value ? parseFloat(maxEl.value) : null;
        aplicarFiltros();
    };
    window._filtrosDisponibles = (checked) => {
        filtrosState.soloDisponibles = checked;
        aplicarFiltros();
    };
    window._filtrosLimpiar = () => {
        filtrosState = { busqueda: '', orden: ordenDefault, categoria: null, precioMin: null, precioMax: null, soloDisponibles: false };
        const bar = document.getElementById('filtros-bar');
        if (bar) bar.remove();
        initFiltrosBar();
        aplicarFiltros();
    };

    console.log('🔍 Filtros v1.0 montados');
}
window.clearSearchOverlayInput = clearSearchOverlayInput;
window.selectSearchResult = selectSearchResult;
window.seeAllSearchResults = seeAllSearchResults;
window.searchByCategory = searchByCategory;
window.renderSearchOverlayResults = renderSearchOverlayResults;

// Buscador
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { 
        renderProducts(productos); 
        document.getElementById('productsTitle').textContent = 'Todos los productos'; 
        return; 
    }
    const filtered = productos.filter(p => 
        p.nombre.toLowerCase().includes(q) || 
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
    document.getElementById('productsTitle').textContent = `Resultados: "${q}"`;
    renderProducts(filtered);
});

// ==========================================
// PROMO BOXES
// ==========================================
function renderPromoBoxes(boxes) {
    const enabledBoxes = boxes.filter(b => b.enabled !== false);
    if (enabledBoxes.length === 0) return;
    
    const section = document.getElementById('promoBoxesSection');
    if (!section) return;
    section.style.display = 'block';
    section.classList.add('active');
    
    const grid = document.getElementById('promoBoxesGrid');
    if (!grid) return;
    
    grid.innerHTML = enabledBoxes.map((box, index) => {
        const cols = parseInt(box.gridCols) || 2;
        const rows = parseInt(box.gridRows) || 2;
        const width = box.width || 100;
        const height = box.height || 300;
        const animation = box.animation || 'fade';
        const hoverEffect = box.hoverEffect || 'lift';
        
        let productsHtml = `<div class="promo-box-products cols-${cols}">`;
        for (let i = 0; i < cols * rows; i++) {
            const producto = productos[i];
            if (producto?.imagen_url) {
                productsHtml += `
                    <div class="promo-box-product" onclick="openProductFromPromo(${producto.id})">
                        <img src="${producto.imagen_url}" alt="${producto.nombre}" loading="lazy">
                    </div>`;
            } else {
                productsHtml += `<div class="promo-box-product placeholder"></div>`;
            }
        }
        productsHtml += '</div>';
        
        return `
            <div class="promo-box anim-${animation} hover-${hoverEffect}" 
                 style="
                     background: ${box.bgColor || '#fff'};
                     width: ${width}%;
                     min-height: ${height}px;
                     animation-delay: ${index * 0.1}s;
                 ">
                <div class="promo-box-header">
                    <span class="promo-box-title" style="color: ${box.titleColor || '#ea580c'}">
                        ${box.title || 'Promoción'}
                    </span>
                    <a href="${box.link || '#'}" class="promo-box-link">
                        ${box.linkText || 'Ver más'} 
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </div>
                ${productsHtml}
                ${box.bottomText ? `
                    <div class="promo-box-bottom" style="color: ${box.bottomTextColor || '#16a34a'}">
                        ${box.bottomText}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openProductFromPromo(productId) { 
    const product = productos.find(p => p.id === productId); 
    if (product && typeof openProductDetail === 'function') {
        openProductDetail(product); 
    }
}

// ==========================================
// CARRITO
// ==========================================
function getCarritoKey() { 
    return `carrito_${tiendaConfig.negocio_id || 'default'}`; 
}

function loadCarrito() { 
    carrito = JSON.parse(localStorage.getItem(getCarritoKey()) || '[]'); 
    updateCartBadge(); 
}

function saveCarrito() { 
    localStorage.setItem(getCarritoKey(), JSON.stringify(carrito)); 
}

function addToCart(id) {
    const p = productos.find(x => x.id === id);
    if (!p) return;

    // ★ v5.8: Si el producto tiene variantes, abrir detalle para seleccionarlas
    if (p.tiene_variantes && p.variantes?.tipos?.length > 0) {
        if (typeof openProductDetail === 'function') {
            openProductDetail(p);
        }
        return;
    }

    const existing = carrito.find(x => x.id === id && !x.variante_id);
    if (existing) {
        existing.cantidad++;
    } else {
        carrito.push({ ...p, cantidad: 1 });
    }

    saveCarrito();
    updateCartBadge();
    showToast(`✓ ${p.nombre} agregado al carrito`);
}

// ★ v5.8: Agregar al carrito con variante (llamado desde product-detail.js)
function addToCartVariante(cartItem) {
    if (!cartItem) return;
    const carritoKey = cartItem._carritoId || cartItem.id;
    const existing = carrito.find(x => (x._carritoId || x.id) === carritoKey);
    if (existing) {
        existing.cantidad += (cartItem.cantidad || 1);
    } else {
        carrito.push({ ...cartItem });
    }
    saveCarrito();
    updateCartBadge();
}

// Exponer globalmente para product-detail.js
window.addToCartVariante = addToCartVariante;

// addToCartItem: handler general — acepta cartItem completo con variante + personalización
function addToCartItem(cartItem) {
    if (!cartItem) return;
    const carritoKey = cartItem._carritoId || cartItem.id;
    const existing = carrito.find(x => (x._carritoId || x.id) === carritoKey);
    if (existing) {
        existing.cantidad += (cartItem.cantidad || 1);
    } else {
        carrito.push({ ...cartItem });
    }
    saveCarrito();
    updateCartBadge();
}
window.addToCartItem = addToCartItem;

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) { 
        const total = carrito.reduce((s, i) => s + i.cantidad, 0); 
        badge.textContent = total; 
        badge.style.display = total > 0 ? 'flex' : 'none'; 
    }
}

function goToCart() { 
    window.location.href = `/tienda/carrito.html?slug=${tiendaConfig.slug}`; 
}

// ==========================================
// UTILIDADES
// ==========================================
function hideLoading() { 
    const loading = document.getElementById('loadingScreen'); 
    if (loading) loading.style.display = 'none'; 
}

function showError(msg) { 
    hideLoading(); 
    const error = document.getElementById('errorScreen'); 
    if (error) error.style.display = 'flex'; 
    const errorMsg = document.getElementById('errorMessage'); 
    if (errorMsg) errorMsg.textContent = msg; 
}

function showToast(msg) { 
    const t = document.getElementById('toast'); 
    if (!t) return; 
    t.textContent = msg; 
    t.classList.add('show'); 
    setTimeout(() => t.classList.remove('show'), 3000); 
}

// ==========================================
// EXPONER GLOBALMENTE
// ==========================================
window.slideMove = slideMove;
window.goToSlide = goToSlide;
window.toggleSidebar = toggleSidebar;
window.filterCategory = filterCategory;
window.filterCategoryFromFeatured = filterCategoryFromFeatured;
window.addToCart = addToCart;
window.goToCart = goToCart;
window.openProductFromPromo = openProductFromPromo;
window.showToast = showToast;
window.productos = productos;
window.tiendaConfig = tiendaConfig;
window.carrito = carrito;
window.toggleFavorite = toggleFavorite;
window.addToCompare = addToCompare;
window.quickView = quickView;
window.notifyWhenAvailable = notifyWhenAvailable;
window.activateVideoHover = activateVideoHover;
window.deactivateVideoHover = deactivateVideoHover;
window.formatPriceCOP = formatPrice;

console.log('🛒 Tienda v5.7 - Badges v2.3 Edition - Cargado ✅');

// ══════════════════════════════════════════════════════════════════════
// FIN SESIÓN 5/5 - TIENDA.JS v5.7 COMPLETO
// ══════════════════════════════════════════════════════════════════════