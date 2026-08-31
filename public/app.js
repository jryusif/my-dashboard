// =============================================================================
// 🔐 JWT AUTHENTICATION & MULTI-TENANT CLIENT INTERCEPTOR
// =============================================================================

let authToken = localStorage.getItem('antigravity_token') || null;
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('antigravity_user') || 'null');
} catch {
  currentUser = null;
}

// Global fetch interceptor to inject Authorization header
const _originalFetch = window.fetch;
window.fetch = async function(resource, init = {}) {
  const url = typeof resource === 'string' ? resource : (resource.url || '');
  if (url.startsWith('/api/') && !url.startsWith('/api/auth/login') && !url.startsWith('/api/auth/register') && !url.startsWith('/api/finance/assets/gold-price')) {
    init = init || {};
    init.headers = init.headers || {};
    if (authToken) {
      if (init.headers instanceof Headers) {
        init.headers.set('Authorization', `Bearer ${authToken}`);
      } else {
        init.headers['Authorization'] = `Bearer ${authToken}`;
      }
    }
  }

  const response = await _originalFetch(resource, init);
  if (response.status === 401 && url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
    openAuthModal();
  }
  return response;
};

// =============================================================================
// CONSTANTS & CONFIG
// =============================================================================

const CATEGORY_ICON = {
  'Analytics & Progress': '📊',
  'Dental Cases':     '🦷',
  'Work':             '💼',
  'Studies':          '📚',
  'Workouts':         '🏋️',
  'Us stocks trading':'📈',
  'Religion':         '🕌',
  'Routine':          '🧴',
  'Finance':          '💰',
  'Gold & Assets':    '🪙',
  'Roadmaps & Master Plan': '🧭',
};

const CATEGORY_ILLUSTRATION_SVG = {
  'Analytics & Progress': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient>
        <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>
        <linearGradient id="splineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#38bdf8"/><stop offset="50%" stop-color="#c084fc"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
        <filter id="glowAna"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#38bdf8" flood-opacity="0.5"/></filter>
      </defs>
      <rect x="8" y="10" width="48" height="44" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
      <rect x="15" y="32" width="8" height="16" rx="3" fill="url(#barGrad1)" />
      <rect x="28" y="24" width="8" height="24" rx="3" fill="url(#barGrad2)" />
      <rect x="41" y="16" width="8" height="32" rx="3" fill="url(#barGrad3)" />
      <path d="M 14 36 Q 26 26 32 25 T 48 14" stroke="url(#splineGrad)" stroke-width="3.5" stroke-linecap="round" filter="url(#glowAna)" />
      <circle cx="48" cy="14" r="3.5" fill="#fff" stroke="#34d399" stroke-width="2" />
    </svg>
  `,
  'Dental Cases': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="toothGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#7dd3fc"/></linearGradient>
        <filter id="glowTooth"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#38bdf8" flood-opacity="0.5"/></filter>
      </defs>
      <path d="M20 12 C14 12 12 20 12 28 C12 38 18 52 24 52 C28 52 30 42 32 42 C34 42 36 52 40 52 C46 52 52 38 52 28 C52 20 50 12 44 12 C38 12 34 16 32 16 C30 16 26 12 20 12 Z" 
            fill="url(#toothGrad)" stroke="rgba(255,255,255,0.9)" stroke-width="1.5" filter="url(#glowTooth)"/>
      <path d="M19 16 C16 19 15 26 16 32 C17 26 21 18 26 16 C23 15 20 15 19 16 Z" fill="rgba(255,255,255,0.8)" />
      <path d="M46 16 L47.5 21 L52.5 22.5 L47.5 24 L46 29 L44.5 24 L39.5 22.5 L44.5 21 Z" fill="#38bdf8" />
      <circle cx="16" cy="40" r="1.5" fill="#38bdf8" />
    </svg>
  `,
  'Work': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="briefcaseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient>
        <linearGradient id="leatherTop" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient>
        <linearGradient id="goldLock" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
        <filter id="glowWork"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#6366f1" flood-opacity="0.45"/></filter>
      </defs>
      <path d="M24 18 C24 13 40 13 40 18" stroke="url(#goldLock)" stroke-width="3" stroke-linecap="round" fill="none" />
      <rect x="10" y="20" width="44" height="32" rx="7" fill="url(#briefcaseGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" filter="url(#glowWork)" />
      <path d="M10 24 Q32 37 54 24 L54 20 L10 20 Z" fill="url(#leatherTop)" />
      <rect x="28" y="28" width="8" height="8" rx="2" fill="url(#goldLock)" />
      <circle cx="32" cy="32" r="1.5" fill="#78350f" />
    </svg>
  `,
  'Studies': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="book1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#7e22ce"/></linearGradient>
        <linearGradient id="book2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#3730a3"/></linearGradient>
        <linearGradient id="book3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0369a1"/></linearGradient>
        <filter id="glowStudy"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#c084fc" flood-opacity="0.45"/></filter>
      </defs>
      <path d="M14 46 C22 43 42 43 50 46 L50 51 C42 48 22 48 14 51 Z" fill="#e2e8f0" />
      <path d="M12 40 C22 37 42 37 52 40 L52 46 C42 43 22 43 12 46 Z" fill="url(#book1)" filter="url(#glowStudy)" />
      <path d="M16 32 C24 29 40 29 48 32 L48 37 C40 34 24 34 16 37 Z" fill="url(#book2)" />
      <path d="M18 18 C25 21 31 23 32 25 C33 23 39 21 46 18 C46 24 45 28 32 30 C19 28 18 24 18 18 Z" fill="url(#book3)" />
      <path d="M32 25 L32 38 L35 35 L38 38 L38 25 Z" fill="#fbbf24" />
    </svg>
  `,
  'Workouts': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="50%" stop-color="#10b981"/><stop offset="100%" stop-color="#047857"/></linearGradient>
        <linearGradient id="barSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#cbd5e1"/><stop offset="50%" stop-color="#ffffff"/><stop offset="100%" stop-color="#64748b"/></linearGradient>
        <filter id="glowGym"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#10b981" flood-opacity="0.55"/></filter>
      </defs>
      <rect x="10" y="30" width="44" height="4" rx="2" fill="url(#barSteel)" />
      <rect x="14" y="16" width="6" height="32" rx="3" fill="url(#metalGrad)" filter="url(#glowGym)" />
      <rect x="8" y="20" width="5" height="24" rx="2.5" fill="url(#metalGrad)" />
      <rect x="20" y="25" width="3" height="14" rx="1.5" fill="#f8fafc" />
      <rect x="44" y="16" width="6" height="32" rx="3" fill="url(#metalGrad)" filter="url(#glowGym)" />
      <rect x="51" y="20" width="5" height="24" rx="2.5" fill="url(#metalGrad)" />
      <rect x="41" y="25" width="3" height="14" rx="1.5" fill="#f8fafc" />
      <line x1="28" y1="30" x2="36" y2="30" stroke="#10b981" stroke-width="2" stroke-dasharray="2 1" />
    </svg>
  `,
  'Us stocks trading': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="stockArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b" stop-opacity="0.45"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/></linearGradient>
        <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
        <filter id="glowStock"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.6"/></filter>
      </defs>
      <path d="M12 44 L20 34 L32 38 L42 22 L52 16 L52 48 L12 48 Z" fill="url(#stockArea)" />
      <line x1="12" y1="48" x2="52" y2="48" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
      <path d="M12 44 L20 34 L32 38 L42 22 L52 16" stroke="url(#goldLine)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glowStock)" />
      <rect x="22" y="28" width="3" height="8" fill="#10b981" rx="0.5" />
      <line x1="23.5" y1="25" x2="23.5" y2="39" stroke="#10b981" stroke-width="1" />
      <rect x="36" y="24" width="3" height="10" fill="#f59e0b" rx="0.5" />
      <line x1="37.5" y1="21" x2="37.5" y2="37" stroke="#f59e0b" stroke-width="1" />
      <circle cx="52" cy="16" r="3.5" fill="#f59e0b" />
    </svg>
  `,
  'Religion': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="domeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2dd4bf"/><stop offset="100%" stop-color="#0f766e"/></linearGradient>
        <linearGradient id="crescentGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
        <filter id="glowRel"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#2dd4bf" flood-opacity="0.5"/></filter>
      </defs>
      <path d="M22 36 C22 22 32 16 32 14 C32 16 42 22 42 36 Z" fill="url(#domeGrad)" filter="url(#glowRel)" />
      <rect x="18" y="36" width="28" height="16" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
      <path d="M26 52 C26 44 38 44 38 52 Z" fill="#0f766e" />
      <rect x="12" y="24" width="4" height="28" rx="1" fill="url(#domeGrad)" />
      <path d="M11 24 L14 18 L17 24 Z" fill="url(#crescentGrad)" />
      <rect x="48" y="24" width="4" height="28" rx="1" fill="url(#domeGrad)" />
      <path d="M47 24 L50 18 L53 24 Z" fill="url(#crescentGrad)" />
      <path d="M34 10 C32 11 31 13 31 15 C31 17 33 19 35 19 C34 18 33 17 33 15 C33 13 34 11 34 10 Z" fill="url(#crescentGrad)" />
    </svg>
  `,
  'Finance': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="finGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4ade80"/><stop offset="100%" stop-color="#166534"/></linearGradient>
        <linearGradient id="finCoin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
        <filter id="glowFin"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#4ade80" flood-opacity="0.55"/></filter>
      </defs>
      <path d="M22 22 C22 17 42 17 42 22 L46 26 L48 48 C48 52 16 52 16 48 L18 26 Z" fill="url(#finGrad)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" filter="url(#glowFin)" />
      <ellipse cx="32" cy="24" rx="8" ry="3" fill="#fbbf24" />
      <circle cx="32" cy="38" r="9" fill="url(#finCoin)" />
      <text x="32" y="43" font-size="14" font-weight="900" text-anchor="middle" fill="#78350f" font-family="sans-serif">$</text>
    </svg>
  `,
  'Gold & Assets': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient>
        <linearGradient id="goldCoinGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#a16207"/></linearGradient>
        <filter id="glowGold"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#eab308" flood-opacity="0.6"/></filter>
      </defs>
      <path d="M14 36 L24 24 L48 24 L42 36 Z" fill="url(#goldBar)" filter="url(#glowGold)" />
      <path d="M14 36 L42 36 L38 48 L10 48 Z" fill="url(#goldCoinGrad)" />
      <path d="M42 36 L48 24 L54 36 L48 48 Z" fill="#854d0e" />
      <circle cx="42" cy="36" r="14" fill="url(#goldBar)" stroke="#fef08a" stroke-width="1.5" />
      <circle cx="42" cy="36" r="11" fill="none" stroke="rgba(113,63,18,0.4)" stroke-width="1" stroke-dasharray="2 1" />
      <path d="M36 39 L48 39 M37 39 L37 34 M42 39 L42 34 M47 39 L47 34 M36 34 L48 34 M42 30 L35 34 L49 34 Z" stroke="#713f12" stroke-width="1.2" stroke-linecap="round" fill="none" />
    </svg>
  `,
  'Roadmaps & Master Plan': `
    <svg viewBox="0 0 64 64" class="card-svg-art" fill="none">
      <defs>
        <linearGradient id="compRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
        <linearGradient id="needleNorth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></linearGradient>
        <linearGradient id="needleSouth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#475569"/></linearGradient>
        <filter id="glowCompass"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#f59e0b" flood-opacity="0.6"/></filter>
      </defs>
      <circle cx="32" cy="32" r="24" fill="rgba(15,23,42,0.8)" stroke="url(#compRing)" stroke-width="2.5" filter="url(#glowCompass)" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="2 2" />
      <line x1="32" y1="12" x2="32" y2="16" stroke="#fde047" stroke-width="2" stroke-linecap="round" />
      <line x1="32" y1="48" x2="32" y2="52" stroke="#fde047" stroke-width="2" stroke-linecap="round" />
      <line x1="12" y1="32" x2="16" y2="32" stroke="#fde047" stroke-width="2" stroke-linecap="round" />
      <line x1="48" y1="32" x2="52" y2="32" stroke="#fde047" stroke-width="2" stroke-linecap="round" />
      <polygon points="32,15 27,32 32,29" fill="url(#needleNorth)" />
      <polygon points="32,15 37,32 32,29" fill="#f87171" />
      <polygon points="32,49 27,32 32,35" fill="url(#needleSouth)" />
      <polygon points="32,49 37,32 32,35" fill="#cbd5e1" />
      <circle cx="32" cy="32" r="3.5" fill="#fef08a" stroke="#78350f" stroke-width="1" />
    </svg>
  `
};

const CATEGORY_COLOR = {
  'Analytics & Progress': 'analytics',
  'Work':             'work',
  'Studies':          'studies',
  'Workouts':         'workouts',
  'Us stocks trading':'trading',
  'Religion':         'religion',
  'Finance':          'finance',
  'Gold & Assets':    'gold',
  'Dental Cases':     'dental',
  'Roadmaps & Master Plan': 'gold',
};

// Category pages that have real task lists (not Finance/Gold which are custom)
const TASK_CATEGORY_PAGES = ['Work', 'Studies', 'Workouts', 'Us stocks trading', 'Religion'];

const DASHBOARD_CARDS = [
  { category: 'Analytics & Progress', desc: 'Weekly, monthly & yearly progress analytics & charts' },
  { category: 'Dental Cases',      desc: 'Step-by-step clinical photos, X-rays & patient gallery' },
  { category: 'Work',              desc: 'Clinic shifts and insurance follow-ups' },
  { category: 'Studies',           desc: 'Dental study sessions and coursework' },
  { category: 'Workouts',          desc: 'Training days and workout plans' },
  { category: 'Us stocks trading', desc: 'Watchlists, trades, and research' },
  { category: 'Religion',          desc: 'Reading, reflection, and reminders' },
  { category: 'Finance',           desc: 'Income, expenses, goals, and net worth' },
  { category: 'Gold & Assets',     desc: 'Gold holdings, planned buys, and live prices' },
  { category: 'Roadmaps & Master Plan', desc: 'Strategic horizons for Trading, Studies, Dental & Wealth' },
];

// =============================================================================
// DOM REFS
// =============================================================================

const board          = document.getElementById('board');
const dateLabel      = document.getElementById('dateLabel');
const progressLabel  = document.getElementById('progressLabel');
const ringFill       = document.getElementById('ringFill');
const ringCount      = document.getElementById('ringCount');
const toast          = document.getElementById('toast');

const weekTabs       = document.getElementById('weekTabs');
const weekIndicator  = document.getElementById('weekIndicator');
const weeklyBoard    = document.getElementById('weeklyBoard');

const dashboardSection  = document.getElementById('dashboardSection');
const dashboardGrid     = document.getElementById('dashboardGrid');

const financeSection    = document.getElementById('financeSection');
const financeContent    = document.getElementById('financeContent');
const financeMonthNav   = document.getElementById('financeMonthNav');

const assetsSection     = document.getElementById('assetsSection');
const assetsContent     = document.getElementById('assetsContent');

const categoryPageSection = document.getElementById('categoryPageSection');
const categoryPageIcon    = document.getElementById('categoryPageIcon');
const categoryPageEyebrow = document.getElementById('categoryPageEyebrow');
const categoryPageTitle   = document.getElementById('categoryPageTitle');
const categoryStats       = document.getElementById('categoryStats');
const categoryTaskArea    = document.getElementById('categoryTaskArea');

// =============================================================================
// SHARED STATE
// =============================================================================

let meta = { categories: [], segmentsByCategory: {}, priorities: [] };
let weekDates = [];
let selectedDayIndex = 0;

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function monthTitleForDate(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// Finance month nav state
let currentFinanceMonth = monthTitleForDate(new Date());
let lastLoadedFinanceMonth = null;
let financeMeta = { incomeSources: [], incomeStatuses: [], expenseCategories: [], paymentMethods: [] };
let incomeFormSelection = { source: '', status: '' };

// Gold state
const GRAMS_PER_TROY_OUNCE = 31.1034768;
const UNIT_TO_GRAMS = { gram: 1, ounce: GRAMS_PER_TROY_OUNCE, kg: 1000 };
const KARAT_PURITY  = { '24k': 1, '21k': 21/24, '18k': 18/24 };
const KARAT_OPTIONS = ['21k', '24k', '18k'];
let latestGoldPrice     = null;
let prevGoldPricePerGram24 = null;
let goldPriceTimer      = null;
let lastLoadedAssets    = [];
let lastLoadedLots      = [];
let goldLotsAvailable   = true;
let editingLotId        = null;

// Current category page
let currentCategoryPage = null;

// =============================================================================
// HELPERS
// =============================================================================

function toISODate(d) {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
}

function escapeHtml(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

let toastTimer;
function showToast(msg, duration = 3000) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
}

function fmtMoney(n) {
  if (n === null || n === undefined) return '—';
  return 'E£' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(1)}%`;
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtDateFull(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysInMonthOf(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// =============================================================================
// PAGE VISIBILITY MANAGER
// =============================================================================

function hideAllTopLevelSections() {
  dashboardSection.hidden     = true;
  categoryPageSection.hidden  = true;
  financeSection.hidden       = true;
  assetsSection.hidden        = true;
  const dentalSec = document.getElementById('dentalCasesSection');
  if (dentalSec) dentalSec.hidden = true;
  const analyticsSec = document.getElementById('analyticsProgressSection');
  if (analyticsSec) analyticsSec.hidden = true;
  const roadmapSec = document.getElementById('roadmapSection');
  if (roadmapSec) roadmapSec.hidden = true;
}

function showDashboard() {
  hideAllTopLevelSections();
  dashboardSection.hidden = false;
  stopGoldPricePolling();
  currentCategoryPage = null;
}

// =============================================================================
// TODAY'S TASKS (SIDEBAR)
// =============================================================================

async function loadTasks() {
  const todayStr = toISODate(new Date());
  renderDateLabel(todayStr);
  const res = await fetch(`/api/tasks?date=${todayStr}`);
  if (!res.ok) return showToast('Could not load today\'s tasks.');
  const { date, tasks: allTasks } = await res.json();
  renderDateLabel(date || todayStr);
  const tasks = allTasks.filter(t => t.category !== 'Routine');
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  updateRing(done, total);
  updateSidebarGlassProgress({ done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) });
  progressLabel.textContent = total === 0 ? 'Your day at a glance' : `${done} of ${total} done`;
  renderBoard(board, tasks, {
    emptyGlyph: '🌤️',
    emptyTitle: 'Clear day',
    emptyText:  'No tasks scheduled for today.',
    compact:    true,
    onToggled:  syncBoards,
    onEdited:   syncBoards,
    onDeleted:  syncBoards,
  });
}

function renderDateLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  dateLabel.textContent = d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function updateRing(done, total) {
  const circumference = 327;
  const pct = total === 0 ? 0 : done / total;
  ringFill.style.strokeDashoffset = String(circumference * (1 - pct));
  ringCount.textContent = `${done}/${total}`;
}

// =============================================================================
// COMPACT MINI GLASS PROGRESS BAR CONTROLLERS
// =============================================================================

function updateSidebarGlassProgress(todayStats) {
  const sidebarProgressFill = document.getElementById('sidebarProgressFill');
  const sidebarProgressPct  = document.getElementById('sidebarProgressPct');
  if (!sidebarProgressFill || !sidebarProgressPct || !todayStats) return;
  const { done = 0, total = 0, pct = 0 } = todayStats;
  sidebarProgressFill.style.width = `${pct}%`;
  sidebarProgressPct.textContent = total === 0 ? 'All clear · 0 tasks' : `${pct}% (${done}/${total})`;
}

async function loadWeeklyProgress() {
  const weeklyProgressFill = document.getElementById('weeklyProgressFill');
  const weeklyProgressVal  = document.getElementById('weeklyProgressVal');
  if (!weeklyProgressFill || !weeklyProgressVal) return;

  try {
    const res = await fetch('/api/tasks/analytics');
    if (!res.ok) return;
    const data = await res.json();
    if (data.week) {
      const { done = 0, total = 0, pct = 0 } = data.week;
      weeklyProgressFill.style.width = `${pct}%`;
      weeklyProgressVal.textContent = total === 0 ? 'No tasks this week' : `${pct}% (${done}/${total} done)`;
    }
    if (data.today) {
      updateSidebarGlassProgress(data.today);
    }
  } catch (err) {
    console.warn('Could not load weekly progress:', err);
  }
}

// =============================================================================
// SHARED BOARD RENDERER
// =============================================================================

function renderBoard(containerEl, tasks, opts) {
  containerEl.innerHTML = '';

  if (tasks.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <span class="glyph">${opts.emptyGlyph}</span>
        <h2>${opts.emptyTitle}</h2>
        <p>${opts.emptyText}</p>
      </div>`;
    return;
  }

  const byCategory = groupBy(tasks, t => t.category || 'Other');
  for (const category of Object.keys(byCategory)) {
    containerEl.appendChild(renderCategorySection(category, byCategory[category], opts));
  }
}

function renderCategorySection(category, tasks, opts) {
  const section = document.createElement('section');
  section.className = 'category-section';

  const header = document.createElement('div');
  header.className = 'category-header';
  header.innerHTML = `
    <span class="category-icon">${CATEGORY_ICON[category] || '•'}</span>
    <span class="category-title">${category}</span>
    <span class="category-count">${tasks.length} task${tasks.length === 1 ? '' : 's'}</span>
  `;
  section.appendChild(header);

  const card = document.createElement('div');
  card.className = 'card';
  tasks.forEach(task => card.appendChild(renderTaskRow(task, opts)));
  section.appendChild(card);

  return section;
}

function renderTaskRow(task, opts) {
  const row = document.createElement('div');
  row.className = 'task-row' + (task.completed ? ' done' : '');
  row.dataset.id = task.id;

  // Check for time/appointment in task name (e.g. "(09:00 AM - 05:00 PM)" or "[09:00 AM]")
  let displayTitle = task.task;
  let appointmentTime = '';
  const timeMatch = task.task.match(/\(([^)]*(?:AM|PM|am|pm|\d{1,2}:\d{2})[^)]*)\)/) || task.task.match(/\[([^\]]*(?:AM|PM|am|pm|\d{1,2}:\d{2})[^\]]*)\]/);
  if (timeMatch) {
    appointmentTime = timeMatch[1];
    displayTitle = task.task.replace(timeMatch[0], '').trim();
  }

  const metaBits = [task.segment, task.priority].filter(Boolean);
  const compact  = opts.compact;

  row.innerHTML = `
    <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}
           aria-label="Mark '${escapeHtml(task.task)}' complete" />
    <div class="task-main">
      <div class="task-name-row" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <span class="task-name">${escapeHtml(displayTitle || task.task)}</span>
        ${appointmentTime ? `<span class="task-appointment-badge" title="Scheduled Appointment / Shift">🕒 ${escapeHtml(appointmentTime)}</span>` : ''}
      </div>
      ${metaBits.length ? `
        <div class="task-meta">
          ${task.priority ? `<span class="priority-dot priority-${task.priority}"></span>` : ''}
          ${metaBits.join(' · ')}
          ${!compact && task.dueDate ? ` · ${fmtDateFull(task.dueDate)}` : ''}
        </div>` : ''}
    </div>
    ${compact ? '' : `
      <span class="task-date-badge">${task.dueDate ? fmtDate(task.dueDate) : ''}</span>
    `}
    <div class="task-row-actions">
      <button type="button" class="task-action-btn edit-task-btn" data-id="${task.id}" data-name="${escapeHtml(task.task)}" data-date="${task.dueDate || ''}" data-priority="${task.priority || ''}" aria-label="Edit task">Edit</button>
      <button type="button" class="task-action-btn danger delete-task-btn" data-id="${task.id}" aria-label="Delete task">Delete</button>
    </div>
  `;

  row.querySelector('.checkbox').addEventListener('change', e => {
    toggleTask(task.id, e.target.checked, row, opts.onToggled);
  });

  row.querySelector('.edit-task-btn').addEventListener('click', () => {
    openEditModal(task, opts.onEdited);
  });

  row.querySelector('.delete-task-btn').addEventListener('click', () => {
    deleteTask(task.id, row, opts.onDeleted);
  });

  return row;
}

// =============================================================================
// TASK TOGGLE (complete / uncomplete)
// =============================================================================

async function toggleTask(id, completed, row, onToggled) {
  row.classList.toggle('done', completed);
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('failed');
    if (onToggled) await onToggled();
  } catch {
    row.classList.toggle('done', !completed);
    row.querySelector('.checkbox').checked = !completed;
    showToast('Could not update that task — please try again.');
  }
}

async function syncBoards() {
  await loadTasks();
  await loadWeekDay();
  loadWeeklyProgress();
  loadCardBadges();
  // Also refresh category page if open
  if (currentCategoryPage) {
    await loadCategoryPage(currentCategoryPage);
  }
}

// =============================================================================
// EDIT TASK MODAL
// =============================================================================

const editModalBackdrop = document.getElementById('editModalBackdrop');
const editTaskForm      = document.getElementById('editTaskForm');
const editCancelBtn     = document.getElementById('editCancelBtn');
let onEditCompletedCallback = null;

editCancelBtn.addEventListener('click', closeEditModal);
editModalBackdrop.addEventListener('click', e => { if (e.target === editModalBackdrop) closeEditModal(); });

function openEditModal(task, onDone) {
  document.getElementById('editTaskId').value       = task.id;
  document.getElementById('editTaskName').value     = task.task;
  document.getElementById('editTaskDueDate').value  = task.dueDate || '';

  // Populate priority dropdown from meta
  const prioritySelect = document.getElementById('editTaskPriority');
  prioritySelect.innerHTML = meta.priorities.map(p =>
    `<option value="${p}" ${p === task.priority ? 'selected' : ''}>${p}</option>`
  ).join('');

  onEditCompletedCallback = onDone;
  editModalBackdrop.hidden = false;
  document.getElementById('editTaskName').focus();
}

function closeEditModal() {
  editModalBackdrop.hidden = true;
  onEditCompletedCallback = null;
}

editTaskForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id       = document.getElementById('editTaskId').value;
  const taskName = document.getElementById('editTaskName').value.trim();
  const dueDate  = document.getElementById('editTaskDueDate').value;
  const priority = document.getElementById('editTaskPriority').value;

  if (!taskName) { showToast('Task name cannot be empty.'); return; }

  const submitBtn = editTaskForm.querySelector('[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskName, dueDate, priority }),
    });
    if (!res.ok) throw new Error('failed');
    closeEditModal();
    showToast('Task updated.');
    if (onEditCompletedCallback) await onEditCompletedCallback();
  } catch {
    showToast('Could not update that task — please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
});

// =============================================================================
// DELETE TASK
// =============================================================================

async function deleteTask(id, row, onDone) {
  // Optimistic UI: fade out the row
  row.style.opacity = '0.4';
  row.style.transition = 'opacity 0.2s ease';

  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('failed');
    showToast('Task deleted.');
    if (onDone) await onDone();
  } catch {
    row.style.opacity = '1';
    showToast('Could not delete that task — please try again.');
  }
}

const CATEGORY_SUBTITLE = {
  'Analytics & Progress': 'Progress Charts & Trends',
  'Dental Cases': 'Patient Gallery & Records',
  'Work': 'Tasks, Shifts & Projects',
  'Studies': 'Courses, Notes & Research',
  'Workouts': '6-Day Split & PR Studio',
  'Us stocks trading': 'Watchlists & Market Analysis',
  'Religion': 'Daily Prayers & Habits',
  'Finance': 'Income, Expenses & Budget',
  'Gold & Assets': 'Net Worth & Gold Holdings',
  'Roadmaps & Master Plan': 'Dental, Trading, Studies & Wealth'
};

// =============================================================================
// DASHBOARD CARDS
// =============================================================================

function renderDashboard() {
  dashboardGrid.innerHTML = DASHBOARD_CARDS.map(c => {
    const colorVar = CATEGORY_COLOR[c.category] || 'work';
    const icon = CATEGORY_ICON[c.category] || '•';
    const illustrationSvg = CATEGORY_ILLUSTRATION_SVG[c.category] || '';
    const subtitle = CATEGORY_SUBTITLE[c.category] || c.desc || 'Area of focus';
    const badgeId = `badge-${c.category.replace(/[^a-z]/gi,'_')}`;

    return `
    <button type="button" class="dashboard-card"
            data-category="${escapeHtml(c.category)}"
            style="--card-color: var(--${colorVar})">
      <div class="card-shimmer-sweep"></div>
      <div class="card-visual">
        <div class="card-aura-glow"></div>
        <div class="card-emblem-orb">
          ${illustrationSvg ? illustrationSvg : `<span class="card-icon-main">${icon}</span>`}
        </div>
        <span class="card-badge" id="${badgeId}">—</span>
      </div>
      <div class="card-label">
        <div class="card-text-group">
          <div class="card-label-top">
            <span class="card-label-icon">${icon}</span>
            <span class="card-label-title">${escapeHtml(c.category)}</span>
          </div>
          <span class="card-label-sub">${escapeHtml(subtitle)}</span>
        </div>
        <span class="card-arrow-indicator">➔</span>
      </div>
    </button>
  `;
  }).join('') + `
    <button type="button" class="dashboard-card dashboard-card-new" id="newPageCard">
      <div class="new-plus-orb">+</div>
      <span class="new-label">New Space</span>
    </button>
  `;

  dashboardGrid.querySelectorAll('.dashboard-card[data-category]').forEach(btn => {
    btn.addEventListener('click', () => openPage(btn.dataset.category));
  });
  document.getElementById('newPageCard').addEventListener('click', () => {
    showToast('Custom spaces coming soon.');
  });

  // Load task counts for each badge asynchronously
  loadCardBadges();
}

async function loadCardBadges() {
  // Load counts for task-based category cards
  for (const cat of TASK_CATEGORY_PAGES) {
    const badgeEl = document.getElementById(`badge-${cat.replace(/[^a-z]/gi,'_')}`);
    if (!badgeEl) continue;
    try {
      const res = await fetch(`/api/tasks?category=${encodeURIComponent(cat)}`);
      if (!res.ok) continue;
      const { tasks } = await res.json();
      const pending = tasks.filter(t => !t.completed).length;
      badgeEl.textContent = pending > 0 ? `${pending} pending` : 'all done';
    } catch {
      badgeEl.textContent = '';
    }
  }

  // Load Dental Cases count badge
  const dentalBadge = document.getElementById('badge-Dental_Cases');
  if (dentalBadge) {
    try {
      const res = await fetch('/api/dental-cases');
      if (res.ok) {
        const data = await res.json();
        dentalBadge.textContent = `${data.count || data.cases?.length || 0} cases`;
      }
    } catch {
      dentalBadge.textContent = '';
    }
  }

  // Load Roadmap count badge
  const rmBadge = document.getElementById('badge-Roadmaps___Master_Plan');
  if (rmBadge) {
    try {
      const res = await fetch('/api/roadmap');
      if (res.ok) {
        const list = await res.json();
        const activeCount = list.filter(m => m.status === 'in_progress').length;
        rmBadge.textContent = `${activeCount} active`;
      }
    } catch {
      rmBadge.textContent = '';
    }
  }
}

function openPage(category) {
  if (category === 'Analytics & Progress') { openAnalyticsPage(); return; }
  if (category === 'Finance') { openFinancePage(); return; }
  if (category === 'Gold & Assets') { openAssetsPage(); return; }
  if (category === 'Dental Cases') { openDentalCasesPage(); return; }
  if (category === 'Roadmaps & Master Plan') { openRoadmapPage(); return; }
  if (TASK_CATEGORY_PAGES.includes(category)) { openCategoryPage(category); return; }
  showToast(`${category} page coming soon.`);
}

// =============================================================================
// CATEGORY PAGES (Work, Studies, Workouts, Religion, Trading)
// =============================================================================

async function openCategoryPage(category) {
  currentCategoryPage = category;
  const color = CATEGORY_COLOR[category] || 'ink-soft';

  categoryPageIcon.textContent = CATEGORY_ICON[category] || '•';
  categoryPageIcon.style.setProperty('--card-color', `var(--${color})`);
  categoryPageEyebrow.textContent = 'Category';
  categoryPageTitle.textContent   = category;

  // Reset view switcher to active tasks
  switchCategoryView('tasks', false);

  // Show skeleton stats immediately
  categoryStats.innerHTML = ['Total', 'Done', 'Pending'].map(label => `
    <div class="cat-stat">
      <div class="cat-stat-label">${label}</div>
      <div class="cat-stat-value skeleton-block" style="height:36px;width:70px;border-radius:8px;"></div>
    </div>
  `).join('');

  categoryTaskArea.innerHTML = '<div class="skeleton-block" style="height:180px;border-radius:16px;"></div>';

  hideAllTopLevelSections();
  categoryPageSection.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  await loadCategoryPage(category);
}

async function loadCategoryPage(category) {
  if (category === 'Workouts') {
    return loadWorkoutsPage();
  }

  const color = CATEGORY_COLOR[category] || 'ink-soft';

  try {
    const res = await fetch(`/api/tasks?category=${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error('failed');
    const { tasks } = await res.json();

    const done    = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);

    // Stats
    categoryStats.innerHTML = [
      { label: 'Total Tasks', value: tasks.length, cls: '' },
      { label: 'Completed',   value: done.length,    cls: 'is-done' },
      { label: 'Pending',     value: pending.length,  cls: 'is-pending' },
    ].map(s => `
      <div class="cat-stat">
        <div class="cat-stat-label">${s.label}</div>
        <div class="cat-stat-value ${s.cls}">${s.value}</div>
      </div>
    `).join('');

    // Glass Category Progress Bar
    const catPct = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;
    const catProgPctEl = document.getElementById('catProgressPct');
    const catProgFillEl = document.getElementById('catProgressFill');
    if (catProgPctEl && catProgFillEl) {
      catProgPctEl.textContent = tasks.length === 0 ? '0% · 0 tasks' : `${catPct}% · ${done.length}/${tasks.length} done`;
      catProgFillEl.style.width = `${catPct}%`;
      catProgFillEl.style.background = `var(--${color})`;
      catProgPctEl.style.color = `var(--${color})`;
    }

    // Quick-add form
    const segments = meta.segmentsByCategory[category] || [];
    const segmentHtml = segments.length ? `
      <select id="catQuickSegment" style="--card-color: var(--${color})">
        <option value="">Segment…</option>
        ${segments.map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>` : '';

    const priorityHtml = meta.priorities.length ? `
      <select id="catQuickPriority">
        <option value="">Priority…</option>
        ${meta.priorities.map(p => `<option value="${p}">${p}</option>`).join('')}
      </select>` : '';

    categoryTaskArea.innerHTML = `
      <div class="category-add-area" style="--card-color: var(--${color})">
        <h3>Add to ${escapeHtml(category)}</h3>
        <form class="category-quick-form" id="catQuickForm" style="--card-color: var(--${color})">
          <input type="text" id="catQuickName" placeholder="New task…" required />
          ${segmentHtml}
          ${priorityHtml}
          <input type="date" id="catQuickDate" value="${toISODate(new Date())}" required />
          <button type="submit" class="btn-primary">Add</button>
        </form>
      </div>

      <div class="category-tasks-header">
        <h3>All Tasks</h3>
      </div>

      <div id="categoryBoard" class="board" aria-live="polite"></div>
    `;

    // Render tasks board
    const catBoard = document.getElementById('categoryBoard');
    if (tasks.length === 0) {
      catBoard.innerHTML = `
        <div class="empty-state">
          <span class="glyph">${CATEGORY_ICON[category] || '📋'}</span>
          <h2>No tasks yet</h2>
          <p>Add your first ${escapeHtml(category)} task above or switch to Repeating Schedule Template.</p>
        </div>`;
    } else {
      // Group by date
      const byDate = groupBy(tasks, t => t.dueDate || 'No date');
      const sortedDates = Object.keys(byDate).sort((a, b) => {
        if (a === 'No date') return 1;
        if (b === 'No date') return -1;
        return b.localeCompare(a); // newest first
      });

      catBoard.innerHTML = '';
      for (const dateKey of sortedDates) {
        const dateTasks = byDate[dateKey];
        const sec = document.createElement('section');
        sec.className = 'category-section';

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
          <span class="category-title">${dateKey === 'No date' ? 'No Date' : fmtDateFull(dateKey)}</span>
          <span class="category-count">${dateTasks.length} task${dateTasks.length === 1 ? '' : 's'}</span>
        `;
        sec.appendChild(header);

        const card = document.createElement('div');
        card.className = 'card';
        dateTasks.forEach(task => {
          const rowOpts = {
            compact: false,
            onToggled: () => loadCategoryPage(category),
            onEdited:  () => loadCategoryPage(category),
            onDeleted: () => loadCategoryPage(category),
          };
          card.appendChild(renderTaskRow(task, rowOpts));
        });
        sec.appendChild(card);
        catBoard.appendChild(sec);
      }
    }

    // Wire up quick-add form
    document.getElementById('catQuickForm').addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('catQuickName').value.trim();
      const dueDate  = document.getElementById('catQuickDate').value;
      const segment  = document.getElementById('catQuickSegment')?.value || undefined;
      const priority = document.getElementById('catQuickPriority')?.value || undefined;
      if (!name) return;

      const btn = e.target.querySelector('[type=submit]');
      btn.disabled = true; btn.textContent = 'Adding…';

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: name, category, segment, priority, dueDate }),
        });
        if (!res.ok) throw new Error('failed');
        showToast('Task added.');
        document.getElementById('catQuickName').value = '';
        await Promise.all([loadCategoryPage(category), loadTasks(), loadWeekDay()]);
        loadCardBadges();
      } catch {
        showToast('Could not add that task — please try again.');
      } finally {
        btn.disabled = false; btn.textContent = 'Add';
      }
    });

  } catch {
    categoryTaskArea.innerHTML = `
      <div class="empty-state">
        <span class="glyph">⚠️</span>
        <h2>Could not load</h2>
        <p>Failed to load ${escapeHtml(category)} tasks. Please sign in or try again.</p>
      </div>`;
  }
}

// =============================================================================
// 🔁 WEEKLY SCHEDULE & REPEATING TEMPLATES CONTROLLER
// =============================================================================

let currentCategoryViewTab = 'tasks'; // 'tasks' | 'template'
let loadedCategoryTemplates = {};

function switchCategoryView(tabName, triggerLoad = true) {
  currentCategoryViewTab = tabName;
  const btnCatViewTasks = document.getElementById('btnCatViewTasks');
  const btnCatViewTemplate = document.getElementById('btnCatViewTemplate');
  const catTasksViewWrap = document.getElementById('catTasksViewWrap');
  const catTemplateViewWrap = document.getElementById('catTemplateViewWrap');

  if (btnCatViewTasks) btnCatViewTasks.classList.toggle('active', tabName === 'tasks');
  if (btnCatViewTemplate) btnCatViewTemplate.classList.toggle('active', tabName === 'template');

  if (catTasksViewWrap) catTasksViewWrap.hidden = (tabName !== 'tasks');
  if (catTemplateViewWrap) catTemplateViewWrap.hidden = (tabName !== 'template');

  if (triggerLoad) {
    if (tabName === 'template' && currentCategoryPage) {
      loadCategoryTemplate(currentCategoryPage);
    } else if (tabName === 'tasks' && currentCategoryPage) {
      loadCategoryPage(currentCategoryPage);
    }
  }
}

const btnCatViewTasks = document.getElementById('btnCatViewTasks');
const btnCatViewTemplate = document.getElementById('btnCatViewTemplate');
if (btnCatViewTasks) btnCatViewTasks.addEventListener('click', () => switchCategoryView('tasks'));
if (btnCatViewTemplate) btnCatViewTemplate.addEventListener('click', () => switchCategoryView('template'));

async function loadCategoryTemplate(category) {
  const catTemplateViewWrap = document.getElementById('catTemplateViewWrap');
  if (!catTemplateViewWrap) return;

  catTemplateViewWrap.innerHTML = '<div class="skeleton-block" style="height:260px;border-radius:18px;"></div>';

  try {
    const res = await fetch(`/api/weekly-templates/${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error('Failed to load template');
    const tpl = await res.json();
    loadedCategoryTemplates[category] = tpl;
    renderCategoryTemplateHub(category, tpl);
  } catch (err) {
    console.error('Error loading category template:', err);
    catTemplateViewWrap.innerHTML = `
      <div class="empty-state">
        <span class="glyph">⚠️</span>
        <h2>Could not load weekly template</h2>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  }
}

function renderCategoryTemplateHub(category, tpl) {
  const catTemplateViewWrap = document.getElementById('catTemplateViewWrap');
  if (!catTemplateViewWrap) return;

  const color = CATEGORY_COLOR[category] || 'dental';
  const weekDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  const daysData = tpl.days || {};
  let totalItems = 0;
  let offDaysCount = 0;

  weekDays.forEach(d => {
    const items = daysData[d] || [];
    totalItems += items.length;
    if (items.some(it => it.isOff)) offDaysCount++;
  });

  catTemplateViewWrap.innerHTML = `
    <div class="template-hero-card" style="--dental: var(--${color})">
      <div class="template-hero-left">
        <h2><span>🔁</span> ${escapeHtml(category)} Weekly Repeating Schedule Template</h2>
        <p>Configure recurring clinic shifts, trading routines, workout splits, or study blocks that repeat automatically every week (Saturday through Friday).</p>
        <div style="display:flex; align-items:center; gap:10px; margin-top:8px; font-size:12px; color:var(--ink-mid); flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">📅 7 Days Configured</span>
          <span style="background:rgba(56,189,248,0.12); color:#38bdf8; padding:2px 8px; border-radius:6px; border:1px solid rgba(56,189,248,0.3);">⚡ ${totalItems} Repeating Task${totalItems === 1 ? '' : 's'}</span>
          ${offDaysCount > 0 ? `<span style="background:rgba(255,255,255,0.05); color:#a1a1aa; padding:2px 8px; border-radius:6px;">🌴 ${offDaysCount} Rest/Off Day${offDaysCount === 1 ? '' : 's'}</span>` : ''}
        </div>
      </div>
      <div class="template-hero-actions">
        <button type="button" class="btn-apply-template" onclick="applyWeeklyTemplateToCurrentWeek('${escapeHtml(category)}')">
          <span>✨</span> Apply Template to This Week
        </button>
        <button type="button" class="btn-add-template-item" onclick="openWeeklyTemplateModal('${escapeHtml(category)}')">
          <span>➕</span> Add Repeating Task
        </button>
      </div>
    </div>

    <div class="template-week-grid">
      ${weekDays.map(dayName => {
        const isToday = (dayName === todayDayName);
        const items = daysData[dayName] || [];
        const isOffDay = items.some(it => it.isOff);

        return `
          <div class="template-day-col ${isToday ? 'is-today' : ''} ${isOffDay ? 'is-off-day' : ''}" style="--dental: var(--${color})">
            <div class="day-col-header">
              <span class="day-name">${dayName}</span>
              ${isToday ? '<span class="day-today-pill">TODAY</span>' : ''}
              ${isOffDay ? '<span class="day-off-pill">OFF DAY</span>' : ''}
            </div>

            <div class="template-items-list">
              ${items.length === 0 ? `
                <div style="font-size:12px; color:var(--ink-soft); text-align:center; padding:18px 8px;">
                  No repeating tasks set.
                </div>
              ` : items.map(it => `
                <div class="template-task-card ${it.isOff ? 'is-off' : ''}">
                  ${it.time ? `<span class="tpl-time-badge">🕒 ${escapeHtml(it.time)}</span>` : ''}
                  <div class="tpl-task-name">${escapeHtml(it.task)}</div>
                  
                  <div class="tpl-meta-row">
                    ${it.segment ? `<span class="tpl-segment-pill">📍 ${escapeHtml(it.segment)}</span>` : `<span class="tpl-segment-pill">${category}</span>`}
                    
                    <div class="tpl-card-actions">
                      <button type="button" class="btn-tpl-action" onclick="editWeeklyTemplateItem('${escapeHtml(category)}', '${escapeHtml(dayName)}', '${escapeHtml(it.id)}')" title="Edit task">✏️</button>
                      <button type="button" class="btn-tpl-action delete" onclick="deleteWeeklyTemplateItem('${escapeHtml(category)}', '${escapeHtml(it.id)}')" title="Delete task">🗑️</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <button type="button" class="btn-add-day-task" onclick="openWeeklyTemplateModal('${escapeHtml(category)}', '${dayName}')">
              ➕ Add for ${dayName}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Modal and CRUD logic for Weekly Repeating Templates
const weeklyTemplateModalBackdrop = document.getElementById('weeklyTemplateModalBackdrop');
const weeklyTemplateForm          = document.getElementById('weeklyTemplateForm');
const weeklyTemplateModalTitle     = document.getElementById('weeklyTemplateModalTitle');
const tplFormCategory             = document.getElementById('tplFormCategory');
const tplFormItemId               = document.getElementById('tplFormItemId');
const tplFormDay                  = document.getElementById('tplFormDay');
const tplFormTask                 = document.getElementById('tplFormTask');
const tplFormTime                 = document.getElementById('tplFormTime');
const tplFormPriority             = document.getElementById('tplFormPriority');
const tplFormSegment              = document.getElementById('tplFormSegment');
const tplFormIsOff                = document.getElementById('tplFormIsOff');
const weeklyTemplateCancelBtn     = document.getElementById('weeklyTemplateCancelBtn');

window.openWeeklyTemplateModal = function(category, defaultDay = 'Saturday', item = null) {
  if (!weeklyTemplateModalBackdrop) return;

  const targetCategory = category || currentCategoryPage || 'Work';
  tplFormCategory.value = targetCategory;
  tplFormItemId.value   = item ? item.id : '';
  tplFormDay.value      = item ? (item.day || defaultDay) : defaultDay;
  tplFormTask.value     = item ? item.task : '';
  tplFormTime.value     = item ? (item.time || '') : '';
  tplFormPriority.value = item ? (item.priority || 'Medium') : 'Medium';
  tplFormSegment.value  = item ? (item.segment || '') : '';
  tplFormIsOff.checked  = item ? Boolean(item.isOff) : false;

  weeklyTemplateModalTitle.textContent = item
    ? `Edit Repeating Task (${targetCategory})`
    : `Add Repeating Task for ${tplFormDay.value}`;

  weeklyTemplateModalBackdrop.hidden = false;
  setTimeout(() => tplFormTask.focus(), 50);
};

window.editWeeklyTemplateItem = function(category, dayName, itemId) {
  const tpl = loadedCategoryTemplates[category];
  if (!tpl || !tpl.days || !tpl.days[dayName]) return;
  const item = tpl.days[dayName].find(it => it.id === itemId);
  if (item) {
    openWeeklyTemplateModal(category, dayName, { ...item, day: dayName });
  }
};

window.deleteWeeklyTemplateItem = async function(category, itemId) {
  if (!confirm('Remove this repeating weekly task from template?')) return;
  try {
    const res = await fetch(`/api/weekly-templates/${encodeURIComponent(category)}/item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete failed');
    const data = await res.json();
    loadedCategoryTemplates[category] = data.template;
    renderCategoryTemplateHub(category, data.template);
    showToast('Repeating task removed from template.');
  } catch (err) {
    console.error(err);
    showToast('Could not delete template item.');
  }
};

window.applyWeeklyTemplateToCurrentWeek = async function(category) {
  showToast(`Generating tasks for this week from ${category} template...`);
  try {
    const res = await fetch(`/api/weekly-templates/${encodeURIComponent(category)}/apply-to-week`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Apply failed');
    const data = await res.json();
    showToast(data.message || 'Weekly tasks generated successfully!');
    await Promise.all([loadTasks(), loadWeekDay(), loadCardBadges()]);
  } catch (err) {
    console.error(err);
    showToast('Could not generate weekly tasks.');
  }
};

if (weeklyTemplateCancelBtn) {
  weeklyTemplateCancelBtn.addEventListener('click', () => {
    if (weeklyTemplateModalBackdrop) weeklyTemplateModalBackdrop.hidden = true;
  });
}
if (weeklyTemplateModalBackdrop) {
  weeklyTemplateModalBackdrop.addEventListener('click', e => {
    if (e.target === weeklyTemplateModalBackdrop) weeklyTemplateModalBackdrop.hidden = true;
  });
}

if (weeklyTemplateForm) {
  weeklyTemplateForm.addEventListener('submit', async e => {
    e.preventDefault();
    const category = tplFormCategory.value;
    const itemId   = tplFormItemId.value;
    const day      = tplFormDay.value;
    const task     = tplFormTask.value.trim();
    const time     = tplFormTime.value.trim();
    const priority = tplFormPriority.value;
    const segment  = tplFormSegment.value.trim();
    const isOff    = tplFormIsOff.checked;

    if (!task) return showToast('Please enter a task title.');

    const submitBtn = document.getElementById('weeklyTemplateSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

    try {
      let res;
      if (itemId) {
        // Edit existing item
        res = await fetch(`/api/weekly-templates/${encodeURIComponent(category)}/item/${encodeURIComponent(itemId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day, task, time, priority, segment, isOff })
        });
      } else {
        // Create new item
        res = await fetch(`/api/weekly-templates/${encodeURIComponent(category)}/item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day, task, time, priority, segment, isOff })
        });
      }

      if (!res.ok) throw new Error('Failed to save template item');
      const data = await res.json();
      weeklyTemplateModalBackdrop.hidden = true;
      loadedCategoryTemplates[category] = data.template;
      renderCategoryTemplateHub(category, data.template);
      showToast('Weekly repeating schedule updated.');
    } catch (err) {
      console.error(err);
      showToast('Could not save repeating task.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Repeating Item'; }
    }
  });
}

// =============================================================================
// WORKOUTS HUB & 6-DAY TRAINING PROGRAM (Custom Split Builder & Media Studio)
// =============================================================================

let workoutProgramData = null;
let selectedWorkoutDayId = null;
let workoutViewTab = 'program'; // 'program' | 'tasks'
let workoutDbTasks = [];

async function loadWorkoutsPage() {
  categoryPageIcon.textContent = '🏋️';
  categoryPageEyebrow.textContent = 'Training Program';
  categoryPageTitle.textContent = 'Workouts & Exercises';

  try {
    const [progRes, tasksRes] = await Promise.all([
      fetch('/api/workout-program'),
      fetch(`/api/tasks?category=Workouts`),
    ]);

    if (!progRes.ok) throw new Error('Could not load workout program');
    workoutProgramData = await progRes.json();
    workoutDbTasks = tasksRes.ok ? (await tasksRes.json()).tasks : [];

    if (!selectedWorkoutDayId) {
      selectedWorkoutDayId = workoutProgramData.todayDayId || 'saturday';
    }

    renderWorkoutsView();
  } catch (err) {
    console.error('Workouts load error:', err);
    categoryTaskArea.innerHTML = `
      <div class="empty-state">
        <span class="glyph">⚠️</span>
        <h2>Could not load Workouts</h2>
        <p>Please check your connection and try again.</p>
      </div>`;
  }
}

function renderWorkoutsView() {
  const { days, todayDayId, todayDate, todayCompleted } = workoutProgramData;
  const currentDay = days.find(d => d.id === selectedWorkoutDayId) || days[0];
  const todayDay = days.find(d => d.id === todayDayId) || days[0];

  // Stats Bar
  const activeDaysCount = days.filter(d => !d.isRestDay).length;
  const todayExCount = todayDay.exercises ? todayDay.exercises.length : 0;
  const todayDoneCount = todayCompleted ? todayCompleted.length : 0;

  categoryStats.innerHTML = [
    { label: 'Weekly Split', value: `${activeDaysCount} Days Active`, cls: '' },
    { label: "Today's Focus", value: todayDay.isRestDay ? 'Rest & Recovery' : escapeHtml(todayDay.title.split('—')[0] || todayDay.title), cls: '' },
    { label: "Today's Session", value: todayDay.isRestDay ? '🌴 Rest Day' : `${todayDoneCount}/${todayExCount} Done`, cls: todayDoneCount === todayExCount && todayExCount > 0 ? 'is-done' : 'is-pending' },
  ].map(s => `
    <div class="cat-stat">
      <div class="cat-stat-label">${s.label}</div>
      <div class="cat-stat-value ${s.cls}">${s.value}</div>
    </div>
  `).join('');

  // Top Switcher & Action Bar
  categoryTaskArea.innerHTML = `
    <!-- Mode Switcher & Quick Actions -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div class="portfolio-filter-bar" style="margin:0;">
        <button type="button" class="portfolio-filter-btn ${workoutViewTab === 'program' ? 'is-active' : ''}" id="wTabProgram">🏋️ Training Program</button>
        <button type="button" class="portfolio-filter-btn ${workoutViewTab === 'tasks' ? 'is-active' : ''}" id="wTabTasks">📋 Tasks &amp; Reminders (${workoutDbTasks.length})</button>
      </div>

      <div style="display:flex;gap:8px;">
        <button type="button" class="asset-action-btn" id="btnOpenTemplateModal" style="font-size:12px;">
          ⚙️ Customize Routine / Split
        </button>
      </div>
    </div>

    <div id="workoutViewContainer"></div>
  `;

  document.getElementById('wTabProgram').addEventListener('click', () => {
    workoutViewTab = 'program';
    renderWorkoutsView();
  });
  document.getElementById('wTabTasks').addEventListener('click', () => {
    workoutViewTab = 'tasks';
    renderWorkoutsView();
  });
  document.getElementById('btnOpenTemplateModal').addEventListener('click', () => {
    document.getElementById('programTemplateModalBackdrop').hidden = false;
  });

  const container = document.getElementById('workoutViewContainer');

  if (workoutViewTab === 'program') {
    renderWorkoutProgramView(container, currentDay, todayDayId, todayDate, todayCompleted);
  } else {
    renderWorkoutTasksView(container);
  }
}

function renderWorkoutProgramView(container, currentDay, todayDayId, todayDate, todayCompleted) {
  const { days } = workoutProgramData;
  const isSelectedToday = currentDay.id === todayDayId;
  const dayExercises = currentDay.exercises || [];

  container.innerHTML = `
    <div class="workout-program-container">
      <!-- 7-Day Navigation Tabs -->
      <nav class="workout-days-nav" aria-label="Workout days">
        ${days.map(d => {
          const isToday = d.id === todayDayId;
          const isActive = d.id === currentDay.id;
          const exCount = d.isRestDay ? 'Rest' : `${d.exercises ? d.exercises.length : 0} ex`;
          return `
            <button type="button" class="workout-day-tab ${isActive ? 'is-active' : ''} ${isToday ? 'is-today' : ''}" data-day-id="${d.id}">
              <span class="w-day-name">${d.dayName}</span>
              <span class="w-day-badge">${exCount}</span>
            </button>
          `;
        }).join('')}
      </nav>

      <!-- Day Header Card -->
      <div class="workout-day-header-card">
        <div>
          <div class="w-day-title-row">
            <h2 class="w-day-title">${currentDay.dayName} &middot; ${escapeHtml(currentDay.title)}</h2>
            ${isSelectedToday ? '<span class="asset-type-badge" style="background:var(--workouts);color:#0A1A12;">TODAY</span>' : ''}
            ${currentDay.isRestDay ? '<span class="asset-type-badge">REST DAY</span>' : ''}
          </div>
          ${currentDay.targetMuscles && currentDay.targetMuscles.length ? `
            <div class="w-day-tags">
              ${currentDay.targetMuscles.map(m => `<span class="w-day-tag highlight">${escapeHtml(m)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-primary" id="addExerciseBtn" style="padding:8px 18px;font-size:13px;">+ Add Exercise</button>
          <button type="button" class="asset-action-btn" id="editDaySplitBtn">Edit Day Focus</button>
        </div>
      </div>

      <!-- Rest Timer Bar -->
      ${!currentDay.isRestDay ? `
      <div class="darebee-timer-bar">
        <span class="darebee-timer-bar-label">⏱ Rest Timer:</span>
        <button class="darebee-timer-btn" id="timerBtn30">30s</button>
        <button class="darebee-timer-btn" id="timerBtn60">60s</button>
        <button class="darebee-timer-btn" id="timerBtn90">90s</button>
        <button class="darebee-timer-btn" id="timerBtn120">2 min</button>
        <span id="timerDisplay" style="margin-left:auto;font-size:13px;font-weight:700;color:var(--workouts);display:none;"></span>
      </div>
      ` : ''}

      <!-- Exercise Cards Grid -->
      <div class="exercise-list">
        ${currentDay.isRestDay ? `
          <div class="empty-state" style="grid-column:1/-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:36px 20px;">
            <span class="glyph">🧘</span>
            <h2>Rest &amp; Active Recovery</h2>
            <p>Allow your muscles to repair and grow. Focus on hydration, mobility, and high protein intake.</p>
          </div>
        ` : (dayExercises.length === 0 ? `
          <div class="empty-state" style="grid-column:1/-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:40px 20px;">
            <span class="glyph">🏋️</span>
            <h2>No exercises for ${currentDay.dayName}</h2>
            <p>Click <strong>+ Add Exercise</strong> above to build your workout.</p>
          </div>
        ` : dayExercises.map((ex, idx) => renderExerciseCard(ex, isSelectedToday, todayCompleted, idx, dayExercises.length, currentDay.id)).join(''))}
      </div>
    </div>
  `;

  // Wire Day Tabs
  container.querySelectorAll('.workout-day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedWorkoutDayId = btn.dataset.dayId;
      renderWorkoutsView();
    });
  });

  // Add Exercise Button
  const addBtn = document.getElementById('addExerciseBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => openExerciseModal(null, currentDay.id));
  }

  // Edit Day Button
  const editDayBtn = document.getElementById('editDaySplitBtn');
  if (editDayBtn) {
    editDayBtn.addEventListener('click', () => openEditDayModal(currentDay));
  }

  // Rest Timer Buttons
  let restTimerInterval = null;
  const timerDisplay = document.getElementById('timerDisplay');
  function startRestTimer(seconds) {
    if (restTimerInterval) clearInterval(restTimerInterval);
    let remaining = seconds;
    if (timerDisplay) {
      timerDisplay.style.display = 'inline';
      timerDisplay.textContent = `${remaining}s`;
    }
    restTimerInterval = setInterval(() => {
      remaining--;
      if (timerDisplay) timerDisplay.textContent = `${remaining}s`;
      if (remaining <= 0) {
        clearInterval(restTimerInterval);
        restTimerInterval = null;
        if (timerDisplay) { timerDisplay.textContent = '✅ Done!'; }
        setTimeout(() => { if (timerDisplay) timerDisplay.style.display = 'none'; }, 2000);
      }
    }, 1000);
  }
  ['timerBtn30','timerBtn60','timerBtn90','timerBtn120'].forEach((id, i) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => startRestTimer([30,60,90,120][i]));
  });

  // Exercise Check-off Buttons
  container.querySelectorAll('[data-exercise-check]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.dataset.exerciseCheck;
      const isDone = btn.classList.contains('is-filled');
      toggleExerciseCheck(exId, !isDone, todayDate);
    });
  });

  // Exercise Video Play Buttons
  container.querySelectorAll('[data-video-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.videoPlay;
      const name = btn.dataset.videoName || 'Exercise Tutorial';
      openVideoModal(url, name);
    });
  });

  // Exercise Reorder Buttons (Move Up / Down)
  container.querySelectorAll('[data-reorder]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const exId = btn.dataset.reorder;
      const dir = btn.dataset.dir;
      const dayId = btn.dataset.day;
      await reorderExercise(dayId, exId, dir);
    });
  });

  // Exercise Edit Buttons
  container.querySelectorAll('[data-exercise-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.dataset.exerciseEdit;
      const ex = dayExercises.find(e => e.id === exId);
      if (ex) openExerciseModal(ex, currentDay.id);
    });
  });

  // Exercise Log Weight & PR Buttons
  container.querySelectorAll('[data-log-weight]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.dataset.logWeight;
      const ex = dayExercises.find(e => e.id === exId);
      if (ex) openExerciseWeightModal(ex, currentDay.id);
    });
  });

  // Exercise Delete Buttons
  container.querySelectorAll('[data-exercise-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this exercise from your program?')) {
        deleteExercise(btn.dataset.exerciseDelete);
      }
    });
  });
}

function renderExerciseCard(ex, isSelectedToday, todayCompleted, index, totalCount, dayId) {
  const isDone = todayCompleted && todayCompleted.includes(ex.id);
  const numStr = String(index + 1).padStart(2, '0');

  const bubblesHtml = Array.from({ length: ex.sets || 4 }).map((_, i) =>
    `<button type="button" class="darebee-bubble ${isDone ? 'is-filled' : ''}" data-exercise-check="${ex.id}" title="Set ${i+1}">${i + 1}</button>`
  ).join('');

  const prBadgeHtml = ex.personalRecord ? `
    <span class="darebee-pr-badge" title="All-Time Personal Record: ${ex.personalRecord.weight} kg (${ex.personalRecord.reps || ''} reps)">
      🏆 PR: ${ex.personalRecord.weight} kg
    </span>
  ` : '';

  return `
    <div class="darebee-card ${isDone ? 'is-completed' : ''}" id="card-${ex.id}">

      <!-- Image Frame (full bleed top) -->
      <div class="darebee-img-wrap">
        ${ex.imageUrl
          ? `<img src="${escapeHtml(ex.imageUrl)}" alt="${escapeHtml(ex.name)}" loading="lazy" />`
          : `<span class="darebee-img-placeholder">🏋️</span>`
        }
        <div class="darebee-img-gradient"></div>

        <!-- Number badge top-left -->
        <span class="darebee-card-number">#${numStr}</span>

        <!-- Muscle badge top-right -->
        <span class="darebee-card-muscle">${escapeHtml(ex.muscleGroup || 'General')}</span>

        <!-- Video button centered bottom -->
        ${ex.videoUrl ? `
          <button type="button" class="exercise-play-btn"
            data-video-play="${escapeHtml(ex.videoUrl)}"
            data-video-name="${escapeHtml(ex.name)}">
            ▶ Watch Form
          </button>
        ` : ''}
      </div>

      <!-- Card Body -->
      <div class="darebee-card-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <div class="darebee-title">${escapeHtml(ex.name)}</div>
          ${prBadgeHtml}
        </div>

        <div class="darebee-stats-row">
          <span class="darebee-chip accent">${ex.sets} sets &times; ${escapeHtml(ex.reps)} reps</span>
          ${ex.weight  ? `<span class="darebee-chip">🏋️ ${escapeHtml(ex.weight)}</span>` : ''}
          ${ex.restTime ? `<span class="darebee-chip">⏱ ${escapeHtml(ex.restTime)}</span>` : ''}
        </div>

        ${ex.notes ? `<div class="darebee-notes">${escapeHtml(ex.notes)}</div>` : ''}

        <!-- Interactive Weight & PR Log Button -->
        <button type="button" class="btn-log-weight" data-log-weight="${ex.id}" data-day="${dayId}">
          <span>⚖️</span> Log Weight &amp; Track PR
        </button>
      </div>

      <!-- Set Tracker -->
      <div class="darebee-set-tracker">
        <span class="darebee-set-label">Sets</span>
        ${bubblesHtml}
      </div>

      <!-- Footer Actions -->
      <div class="darebee-actions">
        <div class="exercise-action-btns">
          ${index > 0 ? `<button type="button" class="exercise-icon-btn" data-reorder="${ex.id}" data-day="${dayId}" data-dir="up" title="Move Up">▲</button>` : ''}
          ${index < totalCount - 1 ? `<button type="button" class="exercise-icon-btn" data-reorder="${ex.id}" data-day="${dayId}" data-dir="down" title="Move Down">▼</button>` : ''}
          <button type="button" class="exercise-icon-btn" data-exercise-edit="${ex.id}" title="Edit">✏️</button>
          <button type="button" class="exercise-icon-btn danger" data-exercise-delete="${ex.id}" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

function renderWorkoutTasksView(container) {
  const segments = meta.segmentsByCategory['Workouts'] || [];
  const segmentHtml = segments.length ? `
    <select id="catQuickSegment" style="--card-color: var(--workouts)">
      <option value="">Workout Day…</option>
      ${segments.map(s => `<option value="${s}">${s}</option>`).join('')}
    </select>` : '';

  const priorityHtml = meta.priorities.length ? `
    <select id="catQuickPriority">
      <option value="">Priority…</option>
      ${meta.priorities.map(p => `<option value="${p}">${p}</option>`).join('')}
    </select>` : '';

  container.innerHTML = `
    <div class="category-add-area" style="--card-color: var(--workouts)">
      <h3>Add Workout Task</h3>
      <form class="category-quick-form" id="catQuickForm" style="--card-color: var(--workouts)">
        <input type="text" id="catQuickName" placeholder="e.g. Buy gym straps, drink protein shake…" required />
        ${segmentHtml}
        ${priorityHtml}
        <input type="date" id="catQuickDate" value="${toISODate(new Date())}" required />
        <button type="submit" class="btn-primary">Add Task</button>
      </form>
    </div>

    <div class="category-tasks-header" style="margin-top: 24px;">
      <h3>Workout Tasks &amp; Reminders</h3>
    </div>

    <div id="categoryBoard" class="board" aria-live="polite"></div>
  `;

  // Render tasks board
  const catBoard = document.getElementById('categoryBoard');
  if (workoutDbTasks.length === 0) {
    catBoard.innerHTML = `
      <div class="empty-state">
        <span class="glyph">📋</span>
        <h2>No standalone tasks</h2>
        <p>Add workout reminders or schedule tasks above.</p>
      </div>`;
  } else {
    const byDate = groupBy(workoutDbTasks, t => t.dueDate || 'No date');
    const sortedDates = Object.keys(byDate).sort((a, b) => {
      if (a === 'No date') return 1;
      if (b === 'No date') return -1;
      return b.localeCompare(a);
    });

    catBoard.innerHTML = '';
    for (const dateKey of sortedDates) {
      const dateTasks = byDate[dateKey];
      const sec = document.createElement('section');
      sec.className = 'category-section';

      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="category-title">${dateKey === 'No date' ? 'No Date' : fmtDateFull(dateKey)}</span>
        <span class="category-count">${dateTasks.length} task${dateTasks.length === 1 ? '' : 's'}</span>
      `;
      sec.appendChild(header);

      const card = document.createElement('div');
      card.className = 'card';
      dateTasks.forEach(task => {
        const rowOpts = {
          compact: false,
          onToggled: () => loadWorkoutsPage(),
          onEdited:  () => loadWorkoutsPage(),
          onDeleted: () => loadWorkoutsPage(),
        };
        card.appendChild(renderTaskRow(task, rowOpts));
      });
      sec.appendChild(card);
      catBoard.appendChild(sec);
    }
  }

  // Wire up quick-add form
  document.getElementById('catQuickForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name     = document.getElementById('catQuickName').value.trim();
    const dueDate  = document.getElementById('catQuickDate').value;
    const segment  = document.getElementById('catQuickSegment')?.value || undefined;
    const priority = document.getElementById('catQuickPriority')?.value || undefined;
    if (!name) return;

    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Adding…';

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: name, category: 'Workouts', segment, priority, dueDate }),
      });
      if (!res.ok) throw new Error('failed');
      showToast('Workout task added.');
      await Promise.all([loadWorkoutsPage(), loadTasks(), loadWeekDay()]);
      loadCardBadges();
    } catch {
      showToast('Could not add that task — please try again.');
    } finally {
      btn.disabled = false; btn.textContent = 'Add Task';
    }
  });
}

// Exercise Actions
async function toggleExerciseCheck(exerciseId, completed, date) {
  try {
    const res = await fetch('/api/workout-program/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, completed, date }),
    });
    if (!res.ok) throw new Error('failed');
    const { completedExercises } = await res.json();
    if (workoutProgramData) {
      workoutProgramData.todayCompleted = completedExercises;
    }
    showToast(completed ? 'Exercise marked complete! 💪' : 'Marked incomplete.');
    renderWorkoutsView();
  } catch {
    showToast('Could not update exercise completion.');
  }
}

async function reorderExercise(dayId, exerciseId, direction) {
  try {
    const res = await fetch('/api/workout-program/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayId, exerciseId, direction }),
    });
    if (!res.ok) throw new Error('failed');
    await loadWorkoutsPage();
  } catch {
    showToast('Could not reorder exercise.');
  }
}

async function deleteExercise(exerciseId) {
  try {
    const res = await fetch(`/api/workout-program/exercises/${exerciseId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('failed');
    showToast('Exercise removed from program.');
    await loadWorkoutsPage();
  } catch {
    showToast('Could not delete exercise.');
  }
}

// Video Modal Player (In-App Lightbox)
const videoModalBackdrop = document.getElementById('videoModalBackdrop');
const videoIframeContainer = document.getElementById('videoIframeContainer');
const videoModalTitle    = document.getElementById('videoModalTitle');
const videoExternalLink  = document.getElementById('videoExternalLink');
const videoModalCloseBtn = document.getElementById('videoModalCloseBtn');

function closeVideoModal() {
  if (videoModalBackdrop) videoModalBackdrop.hidden = true;
  if (videoIframeContainer) videoIframeContainer.innerHTML = '';
}

// Close on × button
if (videoModalCloseBtn) {
  videoModalCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeVideoModal();
  });
}

// Close when clicking the dark backdrop (outside the inner box)
if (videoModalBackdrop) {
  videoModalBackdrop.addEventListener('click', (e) => {
    if (e.target === videoModalBackdrop) closeVideoModal();
  });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && videoModalBackdrop && !videoModalBackdrop.hidden) {
    closeVideoModal();
  }
});

function openVideoModal(url, title) {
  if (!url) return;
  videoModalTitle.textContent = title || 'Exercise Video Tutorial';
  videoExternalLink.href = url;

  let embedHtml = '';
  // Check for YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    embedHtml = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (url.includes('vimeo.com')) {
    const vimeoId = url.split('/').pop();
    embedHtml = `<iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  } else if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    embedHtml = `<video src="${escapeHtml(url)}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>`;
  } else {
    // If it's a general link or search URL, embed search or open
    embedHtml = `
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px;">
        <span style="font-size:40px;margin-bottom:12px;">🎬</span>
        <h3 style="margin-bottom:8px;">Tutorial Video Link</h3>
        <p style="margin-bottom:16px;color:#94A3B8;max-width:400px;">Click below to watch this exercise technique tutorial in a new tab.</p>
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="btn-primary" style="padding:10px 24px;">Open Video &UpperRightArrow;</a>
      </div>
    `;
  }

  videoIframeContainer.innerHTML = embedHtml;
  videoModalBackdrop.hidden = false;
}

// Exercise Modal Handlers (With File Upload & Live Preview)
const exerciseModalBackdrop     = document.getElementById('exerciseModalBackdrop');
const exerciseForm              = document.getElementById('exerciseForm');
const exerciseCancelBtn         = document.getElementById('exerciseCancelBtn');
const exerciseImageDropzone     = document.getElementById('exerciseImageDropzone');
const exerciseImageFileInput    = document.getElementById('exerciseImageFileInput');
const exerciseUploadPrompt      = document.getElementById('exerciseUploadPrompt');
const exercisePreviewContainer  = document.getElementById('exercisePreviewContainer');
const exercisePreviewImg        = document.getElementById('exercisePreviewImg');
const exerciseRemoveImgBtn      = document.getElementById('exerciseRemoveImgBtn');
const exerciseImageUrlInput     = document.getElementById('exerciseImageUrl');

if (exerciseCancelBtn) {
  exerciseCancelBtn.addEventListener('click', () => { exerciseModalBackdrop.hidden = true; });
}
if (exerciseModalBackdrop) {
  exerciseModalBackdrop.addEventListener('click', e => {
    if (e.target === exerciseModalBackdrop) exerciseModalBackdrop.hidden = true;
  });
}

// Direct File Upload & Drag-and-Drop
if (exerciseImageDropzone && exerciseImageFileInput) {
  exerciseImageDropzone.addEventListener('click', (e) => {
    if (e.target === exerciseRemoveImgBtn) return;
    exerciseImageFileInput.click();
  });

  exerciseImageDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    exerciseImageDropzone.classList.add('drag-over');
  });

  exerciseImageDropzone.addEventListener('dragleave', () => {
    exerciseImageDropzone.classList.remove('drag-over');
  });

  exerciseImageDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    exerciseImageDropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileUpload(e.dataTransfer.files[0]);
    }
  });

  exerciseImageFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFileUpload(e.target.files[0]);
    }
  });
}

if (exerciseRemoveImgBtn) {
  exerciseRemoveImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exerciseImageUrlInput.value = '';
    exercisePreviewContainer.hidden = true;
    exerciseUploadPrompt.hidden = false;
    exerciseImageFileInput.value = '';
  });
}

if (exerciseImageUrlInput) {
  exerciseImageUrlInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      exercisePreviewImg.src = val;
      exercisePreviewContainer.hidden = false;
      exerciseUploadPrompt.hidden = true;
    } else {
      exercisePreviewContainer.hidden = true;
      exerciseUploadPrompt.hidden = false;
    }
  });
}

async function handleImageFileUpload(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, WEBP, GIF).');
    return;
  }

  showToast('Uploading image…');
  const reader = new FileReader();
  reader.onload = async (event) => {
    const dataUrl = event.target.result;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      exerciseImageUrlInput.value = data.url;
      exercisePreviewImg.src = data.url;
      exercisePreviewContainer.hidden = false;
      exerciseUploadPrompt.hidden = true;
      showToast('Image uploaded successfully! 📸');
    } catch (err) {
      console.error(err);
      showToast('Could not upload image. You can also paste an image URL directly.');
    }
  };
  reader.readAsDataURL(file);
}

function openExerciseModal(exercise = null, defaultDayId = 'saturday') {
  document.getElementById('exerciseModalTitle').textContent = exercise ? 'Edit Exercise' : 'Add Exercise';
  document.getElementById('exerciseId').value = exercise ? exercise.id : '';
  document.getElementById('exerciseDaySelect').value = defaultDayId;
  document.getElementById('exerciseName').value = exercise ? exercise.name : '';
  document.getElementById('exerciseMuscleGroup').value = exercise ? (exercise.muscleGroup || '') : '';
  document.getElementById('exerciseSets').value = exercise ? exercise.sets : 4;
  document.getElementById('exerciseReps').value = exercise ? exercise.reps : '8-10';
  document.getElementById('exerciseWeight').value = exercise ? (exercise.weight || '') : '';
  document.getElementById('exerciseRestTime').value = exercise ? (exercise.restTime || '') : '90s';
  document.getElementById('exerciseNotes').value = exercise ? (exercise.notes || '') : '';
  document.getElementById('exerciseImageUrl').value = exercise ? (exercise.imageUrl || '') : '';
  document.getElementById('exerciseVideoUrl').value = exercise ? (exercise.videoUrl || '') : '';

  if (exercise && exercise.imageUrl) {
    exercisePreviewImg.src = exercise.imageUrl;
    exercisePreviewContainer.hidden = false;
    exerciseUploadPrompt.hidden = true;
  } else {
    exercisePreviewContainer.hidden = true;
    exerciseUploadPrompt.hidden = false;
  }

  exerciseModalBackdrop.hidden = false;
  document.getElementById('exerciseName').focus();
}

if (exerciseForm) {
  exerciseForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id          = document.getElementById('exerciseId').value;
    const dayId       = document.getElementById('exerciseDaySelect').value;
    const name        = document.getElementById('exerciseName').value.trim();
    const muscleGroup = document.getElementById('exerciseMuscleGroup').value.trim();
    const sets        = parseInt(document.getElementById('exerciseSets').value, 10) || 3;
    const reps        = document.getElementById('exerciseReps').value.trim();
    const weight      = document.getElementById('exerciseWeight').value.trim();
    const restTime    = document.getElementById('exerciseRestTime').value.trim();
    const notes       = document.getElementById('exerciseNotes').value.trim();
    const imageUrl    = document.getElementById('exerciseImageUrl').value.trim();
    const videoUrl    = document.getElementById('exerciseVideoUrl').value.trim();

    if (!name) return;

    const saveBtn = document.getElementById('exerciseSaveBtn');
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

    const payload = { dayId, name, muscleGroup, sets, reps, weight, restTime, notes, imageUrl, videoUrl };

    try {
      const url = id ? `/api/workout-program/exercises/${id}` : '/api/workout-program/exercises';
      const method = id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('failed');

      exerciseModalBackdrop.hidden = true;
      showToast(id ? 'Exercise updated.' : 'Exercise added to routine.');
      selectedWorkoutDayId = dayId;
      await loadWorkoutsPage();
    } catch {
      showToast('Could not save exercise — please try again.');
    } finally {
      saveBtn.disabled = false; saveBtn.textContent = 'Save Exercise';
    }
  });
}

// Edit Day Modal Handlers
const editDayModalBackdrop = document.getElementById('editDayModalBackdrop');
const editDayForm          = document.getElementById('editDayForm');
const editDayCancelBtn     = document.getElementById('editDayCancelBtn');

if (editDayCancelBtn) {
  editDayCancelBtn.addEventListener('click', () => { editDayModalBackdrop.hidden = true; });
}
if (editDayModalBackdrop) {
  editDayModalBackdrop.addEventListener('click', e => {
    if (e.target === editDayModalBackdrop) editDayModalBackdrop.hidden = true;
  });
}

function openEditDayModal(day) {
  document.getElementById('editDayModalTitle').textContent = `Edit ${day.dayName} Workout`;
  document.getElementById('editDayId').value = day.id;
  document.getElementById('editDayTitle').value = day.title || '';
  document.getElementById('editDayMuscles').value = (day.targetMuscles || []).join(', ');
  document.getElementById('editDayIsRest').checked = !!day.isRestDay;

  editDayModalBackdrop.hidden = false;
  document.getElementById('editDayTitle').focus();
}

if (editDayForm) {
  editDayForm.addEventListener('submit', async e => {
    e.preventDefault();
    const dayId     = document.getElementById('editDayId').value;
    const title     = document.getElementById('editDayTitle').value.trim();
    const isRestDay = document.getElementById('editDayIsRest').checked;
    const musclesStr= document.getElementById('editDayMuscles').value.trim();
    const targetMuscles = musclesStr ? musclesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    const submitBtn = editDayForm.querySelector('[type=submit]');
    submitBtn.disabled = true; submitBtn.textContent = 'Saving…';

    try {
      const res = await fetch(`/api/workout-program/days/${dayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, isRestDay, targetMuscles }),
      });
      if (!res.ok) throw new Error('failed');

      editDayModalBackdrop.hidden = true;
      showToast(`${title} updated.`);
      await loadWorkoutsPage();
    } catch {
      showToast('Could not update day split.');
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = 'Save Day';
    }
  });
}

// =============================================================================
// EXERCISE WEIGHT LOGGING & PERSONAL RECORD (PR) STUDIO CONTROLLER
// =============================================================================

let activeWeightModalExercise = null;
let activeWeightModalDayId = null;
let exerciseWeightChartInstance = null;

const exerciseWeightModalBackdrop   = document.getElementById('exerciseWeightModalBackdrop');
const btnCloseExerciseWeightModal    = document.getElementById('btnCloseExerciseWeightModal');
const exWeightModalTitle             = document.getElementById('exWeightModalTitle');
const exWeightModalMuscle            = document.getElementById('exWeightModalMuscle');
const exPRCelebrationBanner          = document.getElementById('exPRCelebrationBanner');
const exPRCelebrationTitle           = document.getElementById('exPRCelebrationTitle');
const exPRCelebrationSub             = document.getElementById('exPRCelebrationSub');
const exModalPRValue                 = document.getElementById('exModalPRValue');
const exModalPRDate                  = document.getElementById('exModalPRDate');
const exModalRecentValue             = document.getElementById('exModalRecentValue');
const exModalRecentDate              = document.getElementById('exModalRecentDate');
const exModalDeltaValue              = document.getElementById('exModalDeltaValue');
const exModalSessionsCount           = document.getElementById('exModalSessionsCount');
const exWeightLogForm                = document.getElementById('exWeightLogForm');
const exLogExerciseId                = document.getElementById('exLogExerciseId');
const exLogWeight                    = document.getElementById('exLogWeight');
const exLogSets                      = document.getElementById('exLogSets');
const exLogReps                      = document.getElementById('exLogReps');
const exLogDate                      = document.getElementById('exLogDate');
const exLogNotes                     = document.getElementById('exLogNotes');
const exWeightHistoryTbody           = document.getElementById('exWeightHistoryTbody');
const canvasExerciseWeightChart      = document.getElementById('canvasExerciseWeightChart');

function playPRCelebrationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Triumphant Fanfare arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + (i * 0.11);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  } catch (_) {}
}

function openExerciseWeightModal(ex, dayId) {
  activeWeightModalExercise = ex;
  activeWeightModalDayId = dayId;
  
  if (exLogExerciseId) exLogExerciseId.value = ex.id;
  if (exWeightModalTitle) exWeightModalTitle.textContent = ex.name;
  if (exWeightModalMuscle) exWeightModalMuscle.textContent = `${ex.muscleGroup || 'General'} • Strength & Progression Tracker`;
  
  if (exLogDate) exLogDate.value = toISODate(new Date());
  
  // Fill default values from recent log or exercise preset
  const recentLog = ex.weightLogs && ex.weightLogs.length ? ex.weightLogs[0] : null;
  if (exLogWeight) exLogWeight.value = recentLog ? recentLog.weight : (parseFloat(ex.weight) || '');
  if (exLogSets) exLogSets.value = recentLog ? recentLog.sets : (ex.sets || 4);
  if (exLogReps) exLogReps.value = recentLog ? recentLog.reps : (ex.reps || '8-10');
  if (exLogNotes) exLogNotes.value = '';
  
  if (exPRCelebrationBanner) exPRCelebrationBanner.style.display = 'none';
  
  updateWeightModalStatsAndHistory(ex);
  if (exerciseWeightModalBackdrop) exerciseWeightModalBackdrop.hidden = false;
}

function updateWeightModalStatsAndHistory(ex) {
  const pr = ex.personalRecord;
  const logs = ex.weightLogs || [];
  
  // Scorecard 1: PR
  if (exModalPRValue) exModalPRValue.textContent = pr ? `${pr.weight} kg` : '0 kg';
  if (exModalPRDate) exModalPRDate.textContent = pr ? `${fmtDate(pr.date)} · ${pr.reps || '8'} reps` : 'No record set yet';
  
  // Scorecard 2: Recent
  const recent = logs.length ? logs[0] : null;
  if (exModalRecentValue) exModalRecentValue.textContent = recent ? `${recent.weight} kg` : (ex.weight || '0 kg');
  if (exModalRecentDate) exModalRecentDate.textContent = recent ? `${fmtDate(recent.date)} · ${recent.sets}x${recent.reps}` : '--';
  
  // Scorecard 3: Delta
  if (logs.length > 0) {
    const oldest = logs[logs.length - 1];
    const diff = (pr ? pr.weight : recent.weight) - oldest.weight;
    const diffSign = diff >= 0 ? `+${diff}` : `${diff}`;
    if (exModalDeltaValue) exModalDeltaValue.textContent = `${diffSign} kg`;
    if (exModalSessionsCount) exModalSessionsCount.textContent = `${logs.length} logged session${logs.length === 1 ? '' : 's'}`;
  } else {
    if (exModalDeltaValue) exModalDeltaValue.textContent = '+0 kg';
    if (exModalSessionsCount) exModalSessionsCount.textContent = '0 total sessions';
  }
  
  // Render History Table
  if (exWeightHistoryTbody) {
    if (!logs.length) {
      exWeightHistoryTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:24px;color:var(--ink-soft);">
            No weight entries logged yet for this exercise. Enter your weight and sets above to begin tracking!
          </td>
        </tr>
      `;
    } else {
      exWeightHistoryTbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-weight:600;white-space:nowrap;">${fmtDate(l.date)}</td>
          <td style="font-weight:800;color:#34d399;font-size:13.5px;">${l.weight} kg</td>
          <td>${l.sets} sets &times; ${escapeHtml(l.reps)}</td>
          <td>${l.isPR ? '<span class="table-pr-badge">🏆 PR RECORD</span>' : '<span style="color:var(--ink-soft);font-size:11px;">Standard</span>'}</td>
          <td style="color:var(--ink-soft);max-width:180px;">${escapeHtml(l.notes || '--')}</td>
          <td>
            <button type="button" class="btn-del-log" onclick="handleDeleteWeightLog('${ex.id}', '${l.id}')" title="Delete entry">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }
  
  renderExerciseWeightChart(ex);
}

function renderExerciseWeightChart(ex) {
  if (!canvasExerciseWeightChart) return;
  const logs = [...(ex.weightLogs || [])].reverse(); // Oldest to newest for trajectory
  
  if (exerciseWeightChartInstance) {
    exerciseWeightChartInstance.destroy();
    exerciseWeightChartInstance = null;
  }
  
  if (!logs.length) {
    const ctx = canvasExerciseWeightChart.getContext('2d');
    ctx.clearRect(0, 0, canvasExerciseWeightChart.width, canvasExerciseWeightChart.height);
    return;
  }
  
  const labels = logs.map((l, i) => `S${i + 1}: ${fmtDate(l.date)}`);
  const weights = logs.map(l => l.weight);
  const pointColors = logs.map(l => l.isPR ? '#fde047' : '#10b981');
  const pointRadii = logs.map(l => l.isPR ? 7 : 5);
  
  const ctx = canvasExerciseWeightChart.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
  
  exerciseWeightChartInstance = new Chart(canvasExerciseWeightChart, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data: weights,
        borderColor: '#10b981',
        backgroundColor: gradient,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#0b101b',
        pointBorderWidth: 2,
        pointRadius: pointRadii,
        pointHoverRadius: 9,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13, 17, 23, 0.95)',
          titleColor: '#34d399',
          bodyColor: '#fff',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const item = logs[context.dataIndex];
              return `${context.parsed.y} kg (${item.sets}x${item.reps})${item.isPR ? ' 🏆 PR' : ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10.5 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            font: { size: 11 },
            callback: v => `${v} kg`
          }
        }
      }
    }
  });
}

// Quick Steppers
document.querySelectorAll('.stepper-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!exLogWeight) return;
    const step = parseFloat(btn.dataset.step);
    const curr = parseFloat(exLogWeight.value) || 0;
    exLogWeight.value = Math.max(0, curr + step);
  });
});

// Close Weight Modal
if (btnCloseExerciseWeightModal) {
  btnCloseExerciseWeightModal.addEventListener('click', () => {
    if (exerciseWeightModalBackdrop) exerciseWeightModalBackdrop.hidden = true;
  });
}
if (exerciseWeightModalBackdrop) {
  exerciseWeightModalBackdrop.addEventListener('click', (e) => {
    if (e.target === exerciseWeightModalBackdrop) exerciseWeightModalBackdrop.hidden = true;
  });
}

// Submit Weight Log
if (exWeightLogForm) {
  exWeightLogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeWeightModalExercise) return;
    
    const weight = parseFloat(exLogWeight.value);
    const sets   = parseInt(exLogSets.value, 10) || 4;
    const reps   = exLogReps.value.trim() || '8';
    const date   = exLogDate.value || toISODate(new Date());
    const notes  = exLogNotes.value.trim();
    
    if (!weight || weight <= 0) {
      showToast('Please enter a valid positive weight.');
      return;
    }
    
    const submitBtn = document.getElementById('exLogSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }
    
    try {
      const res = await fetch(`/api/workout-program/exercises/${activeWeightModalExercise.id}/log-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight, sets, reps, date, notes }),
      });
      
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      
      activeWeightModalExercise = data.exercise;
      updateWeightModalStatsAndHistory(data.exercise);
      
      if (data.isNewPR) {
        if (exPRCelebrationBanner) {
          exPRCelebrationTitle.textContent = `🏆 NEW PERSONAL RECORD: ${data.newPR} kg!`;
          exPRCelebrationSub.textContent = data.previousPR > 0 
            ? `🔥 Outstanding! +${data.delta} kg progress from your previous record of ${data.previousPR} kg!`
            : `🔥 First milestone recorded! Benchmark established at ${data.newPR} kg.`;
          exPRCelebrationBanner.style.display = 'flex';
        }
        playPRCelebrationChime();
        showToast(`🏆 NEW PERSONAL RECORD! ${activeWeightModalExercise.name}: ${data.newPR} kg!`);
        
        // Dispatch in-app notification
        dispatchNotification({
          type: 'workouts',
          title: `🏆 New PR: ${activeWeightModalExercise.name}`,
          message: `Logged ${data.newPR} kg (${sets}x${reps})! Previous record: ${data.previousPR || 0} kg (+${data.delta} kg progression).`,
          linkCategory: 'Workouts'
        });
      } else {
        showToast(`Session logged: ${weight} kg (${sets}x${reps}).`);
      }
      
      await loadWorkoutsPage();
    } catch (err) {
      showToast('Could not log exercise weight — please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>💾</span> Log Weight &amp; Update Record';
      }
    }
  });
}

window.handleDeleteWeightLog = async function(exerciseId, logId) {
  if (!confirm('Delete this training session log?')) return;
  try {
    const res = await fetch(`/api/workout-program/exercises/${exerciseId}/log-weight/${logId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    activeWeightModalExercise = data.exercise;
    updateWeightModalStatsAndHistory(data.exercise);
    showToast('Session log removed.');
    await loadWorkoutsPage();
  } catch {
    showToast('Could not delete session log.');
  }
};

// Custom Program Template Modal Handlers
const programTemplateModalBackdrop = document.getElementById('programTemplateModalBackdrop');
const templateModalCancelBtn       = document.getElementById('templateModalCancelBtn');
const btnTemplateBlank             = document.getElementById('btnTemplateBlank');
const btnTemplateCurated           = document.getElementById('btnTemplateCurated');

if (templateModalCancelBtn) {
  templateModalCancelBtn.addEventListener('click', () => {
    programTemplateModalBackdrop.hidden = true;
  });
}
if (programTemplateModalBackdrop) {
  programTemplateModalBackdrop.addEventListener('click', (e) => {
    if (e.target === programTemplateModalBackdrop) programTemplateModalBackdrop.hidden = true;
  });
}

if (btnTemplateBlank) {
  btnTemplateBlank.addEventListener('click', async () => {
    if (confirm('Start with a blank program? You will be able to build all 6 days with your own custom exercises, uploaded images, and video links.')) {
      try {
        const res = await fetch('/api/workout-program/reset-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'empty' }),
        });
        if (!res.ok) throw new Error('failed');
        programTemplateModalBackdrop.hidden = true;
        showToast('Blank custom routine ready. Start adding your exercises! 🚀');
        await loadWorkoutsPage();
      } catch {
        showToast('Could not reset program.');
      }
    }
  });
}

if (btnTemplateCurated) {
  btnTemplateCurated.addEventListener('click', async () => {
    programTemplateModalBackdrop.hidden = true;
    showToast('Loaded active routine.');
    await loadWorkoutsPage();
  });
}

// Wire back buttons
document.getElementById('backToDashboardFromCategory').addEventListener('click', () => {
  showDashboard();
  dashboardSection.hidden = false;
});

// =============================================================================
// TOTAL WEALTH CARD
// =============================================================================

const wealthValueEl     = document.getElementById('wealthValue');
const wealthMetaEl      = document.getElementById('wealthMeta');
const wealthToggleEl    = document.getElementById('wealthToggle');
const wealthToggleIconEl= document.getElementById('wealthToggleIcon');

let wealthRevealed = false;
let lastNetWorth   = null;

function renderWealthValue() {
  if (!lastNetWorth) {
    wealthValueEl.textContent = wealthRevealed ? '—' : '••••••';
    return;
  }
  wealthValueEl.textContent = wealthRevealed ? fmtMoney(lastNetWorth.netWorth) : '••••••';
}

async function loadWealthCard() {
  try {
    const res = await fetch('/api/finance/overview');
    if (!res.ok) throw new Error('failed');
    const overview = await res.json();
    lastNetWorth = overview.netWorth;
    renderWealthValue();
    if (lastNetWorth) {
      const goldNote = lastNetWorth.liveGoldValue > 0
        ? ` · incl. live gold ${fmtMoney(lastNetWorth.liveGoldValue)}`
        : '';
      wealthMetaEl.textContent = `Assets ${fmtMoney(lastNetWorth.totalAssets)} − Liabilities ${fmtMoney(lastNetWorth.totalLiabilities)}${goldNote}`;
    } else {
      wealthMetaEl.textContent = 'No Net Worth snapshot yet — open Finances to add one.';
    }
  } catch {
    wealthMetaEl.textContent = 'Could not load your net worth right now.';
  }
}

wealthToggleEl.addEventListener('click', () => {
  wealthRevealed = !wealthRevealed;
  wealthValueEl.classList.toggle('is-hidden', !wealthRevealed);
  wealthToggleEl.setAttribute('aria-pressed', String(wealthRevealed));
  wealthToggleEl.setAttribute('aria-label', wealthRevealed ? 'Hide total wealth' : 'Show total wealth');
  wealthToggleIconEl.textContent = wealthRevealed ? '🙈' : '👁️';
  renderWealthValue();
});

// =============================================================================
// FINANCE PAGE
// =============================================================================

document.getElementById('backToDashboardFromFinance').addEventListener('click', () => {
  hideAllTopLevelSections();
  dashboardSection.hidden = false;
});

async function openFinancePage(view = null) {
  hideAllTopLevelSections();
  financeSection.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view) financeViewMode = view;
  switchFinanceView(financeViewMode);
  if (financeViewMode === 'ledger') {
    renderMonthNav();
    await loadFinancePage();
  }
}

// Month navigator
function renderMonthNav() {
  financeMonthNav.innerHTML = `
    <button type="button" class="month-nav-btn" id="monthNavPrev" aria-label="Previous month">&#8592;</button>
    <span class="month-nav-label" id="monthNavLabel">${escapeHtml(currentFinanceMonth)}</span>
    <button type="button" class="month-nav-btn" id="monthNavNext" aria-label="Next month">&#8594;</button>
    <button type="button" class="month-nav-today-btn" id="monthNavToday">This Month</button>
  `;

  document.getElementById('monthNavPrev').addEventListener('click', () => {
    currentFinanceMonth = shiftMonth(currentFinanceMonth, -1);
    document.getElementById('monthNavLabel').textContent = currentFinanceMonth;
    loadFinancePage();
  });
  document.getElementById('monthNavNext').addEventListener('click', () => {
    currentFinanceMonth = shiftMonth(currentFinanceMonth, +1);
    document.getElementById('monthNavLabel').textContent = currentFinanceMonth;
    loadFinancePage();
  });
  document.getElementById('monthNavToday').addEventListener('click', () => {
    currentFinanceMonth = monthTitleForDate(new Date());
    document.getElementById('monthNavLabel').textContent = currentFinanceMonth;
    loadFinancePage();
  });
}

function shiftMonth(monthTitle, delta) {
  const idx  = MONTH_NAMES.findIndex(m => monthTitle.startsWith(m));
  const year = parseInt(monthTitle.split(' ')[1], 10);
  const d    = new Date(year, idx + delta, 1);
  return monthTitleForDate(d);
}

async function loadFinancePage() {
  financeContent.innerHTML = `
    <div class="skeleton-block" style="height:88px;"></div>
    <div class="skeleton-block" style="height:180px;"></div>
    <div class="skeleton-block" style="height:140px;"></div>
  `;
  try {
    const month = currentFinanceMonth;
    const [overviewRes, metaRes, incomeRes, expensesRes, breakdownRes] = await Promise.all([
      fetch(`/api/finance/overview?month=${encodeURIComponent(month)}`),
      fetch('/api/finance/meta'),
      fetch('/api/finance/income?limit=8'),
      fetch('/api/finance/expenses?limit=8'),
      fetch(`/api/finance/breakdown?month=${encodeURIComponent(month)}`),
    ]);
    if (!overviewRes.ok || !metaRes.ok || !incomeRes.ok || !expensesRes.ok || !breakdownRes.ok) throw new Error('failed');

    const overview     = await overviewRes.json();
    financeMeta        = await metaRes.json();
    const { items: incomeItems   } = await incomeRes.json();
    const { items: expenseItems  } = await expensesRes.json();
    const breakdown                = await breakdownRes.json();

    lastLoadedFinanceMonth = overview.budget?.month || month;

    // Update month nav label in case it changed
    const navLabel = document.getElementById('monthNavLabel');
    if (navLabel) navLabel.textContent = currentFinanceMonth;

    renderFinancePage(overview, incomeItems, expenseItems, breakdown);
  } catch {
    financeContent.innerHTML = '<div class="finance-error">Could not load finances — please sign in or try again.</div>';
  }
}

function renderPaceCard(budget) {
  const now = new Date();
  if (!budget || budget.month !== monthTitleForDate(now)) return '';
  const dayOfMonth   = now.getDate();
  const totalDays    = daysInMonthOf(now);
  const daysLeft     = totalDays - dayOfMonth;
  const avgDailySpend= budget.totalExpenses / dayOfMonth;
  const projectedSpend = avgDailySpend * totalDays;
  const overIncome   = budget.totalIncome !== null && projectedSpend > budget.totalIncome;
  return `
    <div class="pace-card ${overIncome ? 'is-over' : 'is-ok'}">
      <div class="pace-stat">
        <div class="pace-stat-label">Day ${dayOfMonth} of ${totalDays}</div>
        <div class="pace-stat-value">${daysLeft} day${daysLeft === 1 ? '' : 's'} left</div>
      </div>
      <div class="pace-stat">
        <div class="pace-stat-label">Avg. daily spend</div>
        <div class="pace-stat-value">${fmtMoney(avgDailySpend)}</div>
      </div>
      <div class="pace-stat">
        <div class="pace-stat-label">Projected month-end</div>
        <div class="pace-stat-value">${fmtMoney(projectedSpend)}</div>
      </div>
      <div class="pace-verdict">
        ${overIncome
          ? `⚠️ At this pace you'll spend ${fmtMoney(projectedSpend - budget.totalIncome)} more than you bring in.`
          : `✅ On track to stay within this month's income.`}
      </div>
    </div>
  `;
}

function renderBreakdownBars(items, kind) {
  if (!items || !items.length) return `<p class="finance-empty">Nothing to break down yet.</p>`;
  return `
    <div class="breakdown-list">
      ${items.map(item => `
        <div class="breakdown-row">
          <div class="breakdown-row-top">
            <span class="breakdown-name">${escapeHtml(item.name)}</span>
            <span class="breakdown-amount ${kind}">${fmtMoney(item.total)} · ${fmtPct(item.pct)}</span>
          </div>
          <div class="breakdown-bar"><div class="breakdown-bar-fill ${kind}" style="width:${Math.max(item.pct, 2)}%"></div></div>
        </div>
      `).join('')}
    </div>
  `;
}

function allocTile(label, alloc) {
  return `
    <div class="alloc-tile">
      <div class="alloc-label">${escapeHtml(label)}</div>
      <div class="alloc-amount">${fmtMoney(alloc.amount)}</div>
      <div class="alloc-pct">${fmtPct(alloc.pct)}</div>
    </div>
  `;
}

function renderGoalCard(goal) {
  const pct = Math.max(0, Math.min(100, goal.progressPct || 0));
  return `
    <div class="goal-card">
      <div class="goal-card-header">
        <span class="goal-name">${escapeHtml(goal.goal)}</span>
        <span class="goal-type">${escapeHtml(goal.type || '')}</span>
      </div>
      <div class="goal-amounts">
        <span><strong>${fmtMoney(goal.current)}</strong> of ${fmtMoney(goal.target)}</span>
        <span>${fmtPct(goal.progressPct)}</span>
      </div>
      <div class="goal-bar"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
      ${goal.deadline ? `<div class="goal-meta">Deadline: ${fmtDate(goal.deadline)} · Remaining: ${fmtMoney(goal.remaining)}</div>` : ''}
    </div>
  `;
}

function renderFinanceList(containerId, items, kind, mapFn) {
  const el = document.getElementById(containerId);
  if (!items.length) { el.innerHTML = `<p class="finance-empty">Nothing added yet.</p>`; return; }
  el.innerHTML = items.map(item => {
    const { name, meta: m, amount } = mapFn(item);
    return `
      <div class="finance-row">
        <div class="finance-row-main">
          <div class="finance-row-name">${escapeHtml(name)}</div>
          <div class="finance-row-meta">${escapeHtml(m)}</div>
        </div>
        <div class="finance-row-amount ${kind}">${fmtMoney(amount)}</div>
      </div>
    `;
  }).join('');
}

function populateSelect(id, options, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` +
    options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
}

function wireDateQuickButtons(scopeEl) {
  scopeEl.querySelectorAll('.date-input-row').forEach(row => {
    const dateInput = row.querySelector('input[type="date"]');
    row.querySelectorAll('.date-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = new Date();
        d.setDate(d.getDate() - Number(btn.dataset.daysAgo || 0));
        dateInput.value = toISODate(d);
        dateInput.dispatchEvent(new Event('input'));
      });
    });
  });
}

function renderChoiceRow(options, selected, className) {
  if (!options.length) return `<p class="finance-empty" style="padding:0;">None set up yet.</p>`;
  return options.map(opt => `
    <button type="button" class="${className}${opt === selected ? ' is-selected' : ''}" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
  `).join('');
}

function setupIncomeForm() {
  incomeFormSelection.source = financeMeta.incomeSources[0] || '';
  incomeFormSelection.status = financeMeta.incomeStatuses.includes('Received')
    ? 'Received' : (financeMeta.incomeStatuses[0] || '');

  const chipsEl = document.getElementById('incomeSourceChips');
  const pillsEl = document.getElementById('incomeStatusPills');
  if (!chipsEl || !pillsEl) return;

  chipsEl.innerHTML = renderChoiceRow(financeMeta.incomeSources, incomeFormSelection.source, 'chip');
  pillsEl.innerHTML = renderChoiceRow(financeMeta.incomeStatuses, incomeFormSelection.status, 'pill');

  chipsEl.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      incomeFormSelection.source = btn.dataset.value;
      chipsEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-selected', c === btn));
    });
  });
  pillsEl.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      incomeFormSelection.status = btn.dataset.value;
      pillsEl.querySelectorAll('.pill').forEach(p => p.classList.toggle('is-selected', p === btn));
    });
  });

  const entryInput  = document.getElementById('incomeEntryInput');
  const amountInput = document.getElementById('incomeAmountInput');
  const preview     = document.getElementById('incomeAmountPreview');
  const dateInput   = document.getElementById('incomeDateInput');
  const submitBtn   = document.getElementById('incomeSubmitBtn');

  function updatePreview() {
    const val = parseFloat(amountInput.value);
    preview.textContent = Number.isFinite(val) && val > 0 ? `= ${fmtMoney(val)}` : '\u00a0';
  }
  function updateSubmitState() {
    const val = parseFloat(amountInput.value);
    submitBtn.disabled = !(entryInput.value.trim().length > 0 && Number.isFinite(val) && val > 0 && !!dateInput.value);
  }

  amountInput.addEventListener('input', () => { updatePreview(); updateSubmitState(); });
  entryInput.addEventListener('input', updateSubmitState);
  dateInput.addEventListener('input', updateSubmitState);
  dateInput.value = toISODate(new Date());
  updatePreview();
  updateSubmitState();
}

function renderFinancePage(overview, incomeItems, expenseItems, breakdown) {
  const { budget, goals, netWorth } = overview;

  // Mini Glass Finance Progress Bar update
  const financeProgFill = document.getElementById('financeProgressFill');
  const financeProgVal  = document.getElementById('financeProgressVal');
  if (financeProgFill && financeProgVal) {
    if (budget && budget.totalIncome > 0) {
      const savingsRate = Math.max(0, Math.min(100, Math.round(((budget.totalIncome - budget.totalExpenses) / budget.totalIncome) * 100)));
      financeProgFill.style.width = `${savingsRate}%`;
      financeProgVal.textContent = `${savingsRate}% savings rate (${budget.netIncome >= 0 ? '+' : ''}${fmtMoney(budget.netIncome)})`;
    } else if (budget && budget.totalExpenses > 0) {
      financeProgFill.style.width = '0%';
      financeProgVal.textContent = `Expenses: ${fmtMoney(budget.totalExpenses)}`;
    } else {
      financeProgFill.style.width = '0%';
      financeProgVal.textContent = 'No budget activity';
    }
  }

  const overviewHtml = budget ? `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Total Income</div><div class="stat-value positive">${fmtMoney(budget.totalIncome)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value negative">${fmtMoney(budget.totalExpenses)}</div></div>
      <div class="stat-card"><div class="stat-label">Net Income</div><div class="stat-value">${fmtMoney(budget.netIncome)}</div></div>
      <div class="stat-card"><div class="stat-label">Savings Rate</div><div class="stat-value">${fmtPct(budget.savingsRatePct)}</div></div>
      <div class="stat-card"><div class="stat-label">Expense Rate</div><div class="stat-value">${fmtPct(budget.expenseRatePct)}</div></div>
    </div>
    <div class="alloc-grid" style="margin-top:12px">
      ${allocTile('Construction', budget.allocations.construction)}
      ${allocTile('Emergency',    budget.allocations.emergency)}
      ${allocTile('Investment',   budget.allocations.investment)}
      ${allocTile('Other Goals',  budget.allocations.otherGoals)}
      ${allocTile('Flexible Cash',budget.allocations.flexible)}
    </div>
    ${renderPaceCard(budget)}
  ` : `<p class="finance-empty">No Monthly Budget row for ${escapeHtml(currentFinanceMonth)} yet.</p>`;

  const goalsHtml = goals && goals.length
    ? `<div class="goal-list">${goals.map(renderGoalCard).join('')}</div>`
    : `<p class="finance-empty">No financial goals yet.</p>`;

  const netWorthHtml = netWorth ? `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Total Assets</div><div class="stat-value positive">${fmtMoney(netWorth.totalAssets)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Liabilities</div><div class="stat-value negative">${fmtMoney(netWorth.totalLiabilities)}</div></div>
      <div class="stat-card"><div class="stat-label">Net Worth</div><div class="stat-value">${fmtMoney(netWorth.netWorth)}</div></div>
    </div>
    <p class="finance-row-meta" style="margin-top:8px;font-size:12px;color:var(--ink-soft)">
      ${escapeHtml(netWorth.snapshot)} · ${fmtDate(netWorth.date)} · Cash: ${fmtMoney(netWorth.breakdown?.cash)}
      ${netWorth.liveGoldValue > 0 ? ` · Gold: ${fmtMoney(netWorth.liveGoldValue)} (live)` : ''}
    </p>
  ` : `<p class="finance-empty">No Net Worth snapshot yet — enter your saved cash below to start one.</p>`;

  const alreadyHaveHtml = `
    <div class="already-have-card">
      <div class="already-have-head">
        <span class="already-have-icon">💵</span>
        <div>
          <p class="already-have-title">Money I Already Have</p>
          <p class="already-have-sub">Cash already saved — separate from this month's income</p>
        </div>
      </div>
      <form class="cash-update-form" id="cashUpdateForm" novalidate>
        <div class="amount-input-wrap">
          <span class="amount-prefix">E£</span>
          <input type="number" id="cashUpdateInput" step="0.01" min="0" inputmode="decimal" placeholder="0.00"
                 value="${netWorth && netWorth.breakdown?.cash != null ? netWorth.breakdown.cash : ''}" />
        </div>
        <button type="submit" class="btn-primary" id="cashUpdateBtn">Save</button>
      </form>
    </div>
  `;

  const breakdownHtml = `
    <div class="breakdown-grid">
      <div>
        <h3 class="finance-panel-title finance-panel-title-sm">Income by Source</h3>
        ${renderBreakdownBars(breakdown?.incomeBySource, 'income')}
      </div>
      <div>
        <h3 class="finance-panel-title finance-panel-title-sm">Expenses by Category</h3>
        ${renderBreakdownBars(breakdown?.expensesByCategory, 'expense')}
      </div>
    </div>
  `;

  financeContent.innerHTML = `
    <section>
      <h2 class="finance-block-title">💎 Total Wealth (Net Worth)</h2>
      ${netWorthHtml}
    </section>
    <section>
      <h2 class="finance-block-title">🪙 Gold &amp; Assets</h2>
      <div id="financeAssetsQuickGlance">${renderQuickGlanceLoading()}</div>
    </section>
    <section>
      <h2 class="finance-block-title">📅 ${escapeHtml(currentFinanceMonth)}</h2>
      ${overviewHtml}
    </section>
    <section>
      <h2 class="finance-block-title">📊 This Month's Breakdown</h2>
      ${breakdownHtml}
    </section>
    <section>
      <h2 class="finance-block-title">🎯 Goals Progress</h2>
      ${goalsHtml}
    </section>
    <section class="finance-panels">
      <div class="finance-panel">
        <h3 class="finance-panel-title">💰 Income</h3>
        ${alreadyHaveHtml}
        <div class="finance-list" id="incomeList"></div>
        <form class="finance-add-form income-add-form" id="incomeAddForm" novalidate>
          <div class="field-group span-2">
            <label class="field-label" for="incomeEntryInput">What's this income?</label>
            <input type="text" id="incomeEntryInput" placeholder="e.g. Clinic salary, dividend…" required />
          </div>
          <div class="field-group span-2">
            <label class="field-label" for="incomeAmountInput">Amount</label>
            <div class="amount-input-wrap">
              <span class="amount-prefix">E£</span>
              <input type="number" id="incomeAmountInput" step="0.01" min="0" inputmode="decimal" placeholder="0.00" required />
            </div>
            <p class="amount-preview" id="incomeAmountPreview">&nbsp;</p>
          </div>
          <div class="field-group span-2">
            <label class="field-label">Source</label>
            <div class="chip-row" id="incomeSourceChips"></div>
          </div>
          <div class="field-group span-2">
            <label class="field-label">Status</label>
            <div class="pill-row" id="incomeStatusPills"></div>
          </div>
          <div class="field-group span-2">
            <label class="field-label" for="incomeDateInput">Date</label>
            <div class="date-input-row">
              <input type="date" id="incomeDateInput" required />
              <button type="button" class="date-quick-btn" data-days-ago="0">Today</button>
              <button type="button" class="date-quick-btn" data-days-ago="1">Yesterday</button>
            </div>
          </div>
          <button type="submit" class="btn-primary income-submit-btn" id="incomeSubmitBtn" disabled>Add Income</button>
        </form>
      </div>
      <div class="finance-panel">
        <h3 class="finance-panel-title">💸 Expenses</h3>
        <div class="finance-list" id="expenseList"></div>
        <form class="finance-add-form" id="expenseAddForm">
          <input type="text" id="expenseNameInput" class="span-2" placeholder="What's this expense?" required />
          <select id="expenseCategoryInput"></select>
          <select id="expensePaymentInput"></select>
          <div class="amount-input-wrap span-2">
            <span class="amount-prefix">E£</span>
            <input type="number" id="expenseAmountInput" step="0.01" min="0" placeholder="0.00" required />
          </div>
          <div class="date-input-row span-2">
            <input type="date" id="expenseDateInput" required />
            <button type="button" class="date-quick-btn" data-days-ago="0">Today</button>
            <button type="button" class="date-quick-btn" data-days-ago="1">Yesterday</button>
          </div>
          <button type="submit" class="btn-primary">Add Expense</button>
        </form>
      </div>
    </section>
  `;

  renderFinanceList('incomeList', incomeItems, 'income', item => ({
    name: item.entry,
    meta: [item.source, item.status].filter(Boolean).join(' · ') + (item.date ? ` · ${fmtDate(item.date)}` : ''),
    amount: item.amount,
  }));
  renderFinanceList('expenseList', expenseItems, 'expense', item => ({
    name: item.expense,
    meta: [item.category, item.paymentMethod].filter(Boolean).join(' · ') + (item.date ? ` · ${fmtDate(item.date)}` : ''),
    amount: item.amount,
  }));

  populateSelect('expenseCategoryInput', financeMeta.expenseCategories, 'Category');
  populateSelect('expensePaymentInput',  financeMeta.paymentMethods,    'Payment method');

  setupIncomeForm();

  document.getElementById('expenseDateInput').value = toISODate(new Date());
  wireDateQuickButtons(financeContent);

  document.getElementById('incomeAddForm').addEventListener('submit',   handleAddIncome);
  document.getElementById('expenseAddForm').addEventListener('submit',  handleAddExpense);
  document.getElementById('cashUpdateForm').addEventListener('submit',  handleUpdateCash);

  loadFinanceAssetsQuickGlance();
}

// ---- Finance form handlers ----

async function handleUpdateCash(e) {
  e.preventDefault();
  const btn    = document.getElementById('cashUpdateBtn');
  const input  = document.getElementById('cashUpdateInput');
  const amount = parseFloat(input.value);
  if (!Number.isFinite(amount) || amount < 0) { showToast('Enter a valid amount first.'); return; }
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const res = await fetch('/api/finance/networth/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('failed');
    showToast('Saved cash updated.');
    await loadFinancePage();
    await loadWealthCard();
  } catch {
    btn.disabled = false; btn.textContent = 'Save';
    showToast('Could not update your saved cash — please try again.');
  }
}

async function handleAddIncome(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('incomeSubmitBtn');
  const payload = {
    entry:  document.getElementById('incomeEntryInput').value.trim(),
    source: incomeFormSelection.source || undefined,
    status: incomeFormSelection.status || undefined,
    amount: parseFloat(document.getElementById('incomeAmountInput').value),
    date:   document.getElementById('incomeDateInput').value,
  };
  submitBtn.disabled = true; submitBtn.textContent = 'Adding…';
  try {
    const res = await fetch('/api/finance/income', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('failed');
    showToast('Income added.');
    await loadFinancePage();
  } catch {
    submitBtn.disabled = false; submitBtn.textContent = 'Add Income';
    showToast('Could not add that income entry — please try again.');
  }
}

async function handleAddExpense(e) {
  e.preventDefault();
  const payload = {
    expense:       document.getElementById('expenseNameInput').value.trim(),
    category:      document.getElementById('expenseCategoryInput').value || undefined,
    paymentMethod: document.getElementById('expensePaymentInput').value  || undefined,
    amount:        parseFloat(document.getElementById('expenseAmountInput').value),
    date:          document.getElementById('expenseDateInput').value,
  };
  try {
    const res = await fetch('/api/finance/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('failed');
    showToast('Expense added.');
    await loadFinancePage();
  } catch {
    showToast('Could not add that expense — please try again.');
  }
}

// =============================================================================
// UNIFIED GOLD & ASSETS PORTFOLIO
// =============================================================================

let portfolioData = null;
let portfolioFilter = 'all';

document.getElementById('backToDashboardFromAssets').addEventListener('click', () => {
  hideAllTopLevelSections();
  dashboardSection.hidden = false;
  stopGoldPricePolling();
});

async function openAssetsPage() {
  hideAllTopLevelSections();
  assetsSection.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await loadPortfolioPage();
  startGoldPricePolling();
}

async function fetchGoldPrice() {
  try {
    const res = await fetch('/api/gold/price');
    if (!res.ok) return null;
    const data = await res.json();
    prevGoldPricePerGram24 = latestGoldPrice ? latestGoldPrice.pricePerGramEgp24 : null;
    latestGoldPrice = data;
    return latestGoldPrice;
  } catch { return null; }
}

function goldPriceDirection() {
  if (prevGoldPricePerGram24 == null || !latestGoldPrice || latestGoldPrice.pricePerGramEgp24 == null) return null;
  if (latestGoldPrice.pricePerGramEgp24 > prevGoldPricePerGram24) return 'up';
  if (latestGoldPrice.pricePerGramEgp24 < prevGoldPricePerGram24) return 'down';
  return null;
}

function startGoldPricePolling() {
  stopGoldPricePolling();
  goldPriceTimer = setInterval(async () => {
    await fetchPortfolioQuietly();
  }, 60 * 1000);
}

function stopGoldPricePolling() {
  if (goldPriceTimer) clearInterval(goldPriceTimer);
  goldPriceTimer = null;
}

async function fetchPortfolioQuietly() {
  try {
    const res = await fetch('/api/portfolio');
    if (!res.ok) return;
    const data = await res.json();
    prevGoldPricePerGram24 = latestGoldPrice ? latestGoldPrice.pricePerGramEgp24 : null;
    portfolioData = data;
    latestGoldPrice = data.goldPrice;
    updatePortfolioInPlace();
    loadWealthCard();
  } catch {}
}

function fmtGoldUpdated(price) {
  if (!price || !price.updatedAt) return '';
  const t = new Date(price.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return price.stale ? `Last known · ${t}` : `Updated ${t}`;
}

function renderGoldTicker() {
  if (!latestGoldPrice || latestGoldPrice.pricePerGramEgp24 == null) {
    return `<div class="gold-ticker" id="goldTicker"><span class="finance-empty" style="padding:0;">Live gold price unavailable right now.</span></div>`;
  }
  const p = latestGoldPrice;
  const direction = goldPriceDirection();
  const karatRows = [
    { label: '24K', value: p.pricePerGramEgp24 },
    { label: '21K', value: p.pricePerGramEgp21 },
    { label: '18K', value: p.pricePerGramEgp18 },
  ];
  return `
    <div class="gold-ticker${direction ? ` flash-${direction}` : ''}" id="goldTicker">
      <div class="gold-ticker-head">
        <span class="gold-ticker-dot${p.stale ? ' is-stale' : ''}"></span>
        <span class="gold-ticker-oz">${p.pricePerOunceUsd ? `$${p.pricePerOunceUsd.toLocaleString()}` : (p.priceEgp ? fmtMoney(p.priceEgp) : 'Live Spot')} / troy oz</span>
        ${direction ? `<span class="gold-ticker-arrow ${direction}">${direction === 'up' ? '▲' : '▼'}</span>` : ''}
      </div>
      <div class="gold-karat-grid">
        ${karatRows.map(r => `
          <div class="gold-karat-tile">
            <span class="gold-karat-label">${r.label}</span>
            <span class="gold-karat-value">${fmtMoney(r.value)}<span class="gold-karat-unit">/g</span></span>
          </div>
        `).join('')}
      </div>
      <span class="gold-ticker-updated">${fmtGoldUpdated(p)} · refreshes live every minute</span>
    </div>
  `;
}

function pnlHtml(pnl) {
  if (!pnl) return '';
  const sign = pnl.isGain ? '+' : '';
  return `
    <span class="pnl-arrow">${pnl.isGain ? '▲' : '▼'}</span>
    <span class="pnl-amount">${sign}${fmtMoney(pnl.diff)}</span>
    <span class="pnl-pct">(${sign}${pnl.pct.toFixed(1)}%)</span>
  `;
}

async function loadPortfolioPage() {
  assetsContent.innerHTML = `
    <div class="skeleton-block" style="height:120px;margin-bottom:16px;"></div>
    <div class="skeleton-block" style="height:140px;margin-bottom:16px;"></div>
    <div class="skeleton-block" style="height:100px;"></div>
  `;

  try {
    const res = await fetch('/api/portfolio');
    if (!res.ok) throw new Error('failed');
    portfolioData = await res.json();
    latestGoldPrice = portfolioData.goldPrice;
    renderPortfolioPage();
  } catch (err) {
    console.error(err);
    assetsContent.innerHTML = '<div class="finance-error">Could not load your portfolio — please sign in or try again.</div>';
  }
}

function renderPortfolioSummary(summary) {
  const { totalInvested, currentValue, totalPnl, goldWeight, counts } = summary;

  // Mini Glass Assets Progress Bar update
  const assetsProgFill = document.getElementById('assetsProgressFill');
  const assetsProgVal  = document.getElementById('assetsProgressVal');
  if (assetsProgFill && assetsProgVal) {
    const totalCount = (counts.owned || 0) + (counts.planned || 0);
    const pct = totalCount > 0 ? Math.round(((counts.owned || 0) / totalCount) * 100) : 0;
    assetsProgFill.style.width = `${pct}%`;
    assetsProgVal.textContent = totalCount > 0
      ? `${pct}% owned (${counts.owned || 0} owned / ${counts.planned || 0} planned)`
      : 'No holdings registered';
  }

  return `
    <div class="lots-summary-card" id="portfolioSummaryCard">
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Portfolio Value</div><div class="stat-value positive">${fmtMoney(currentValue)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Invested</div><div class="stat-value">${fmtMoney(totalInvested)}</div></div>
        <div class="stat-card"><div class="stat-label">Owned Holdings</div><div class="stat-value">${counts.owned}</div></div>
        <div class="stat-card"><div class="stat-label">Wishlist / Planned</div><div class="stat-value">${counts.planned}</div></div>
      </div>

      ${totalInvested > 0 ? `
        <div class="lots-total-pnl ${totalPnl.isGain ? 'is-gain' : 'is-loss'}" id="portfolioTotalPnl">
          <span class="pnl-arrow">${totalPnl.isGain ? '▲' : '▼'}</span>
          <span class="pnl-amount">${totalPnl.isGain ? '+' : ''}${fmtMoney(totalPnl.diff)}</span>
          <span class="pnl-pct">(${totalPnl.isGain ? '+' : ''}${totalPnl.pct.toFixed(1)}%)</span>
          <span class="lots-total-label">${totalPnl.isGain ? 'overall gain' : 'overall loss'} across your entire portfolio</span>
        </div>
      ` : ''}

      ${goldWeight && goldWeight.totalGrams > 0 ? `
        <div class="gold-weight-chips">
          <span class="gold-weight-chip">Total Gold: ${goldWeight.totalGrams.toLocaleString(undefined, { maximumFractionDigits: 3 })} g</span>
          ${goldWeight.byKarat['24k'] > 0 ? `<span class="gold-weight-chip">24K: ${goldWeight.byKarat['24k']}g</span>` : ''}
          ${goldWeight.byKarat['21k'] > 0 ? `<span class="gold-weight-chip">21K: ${goldWeight.byKarat['21k']}g</span>` : ''}
          ${goldWeight.byKarat['18k'] > 0 ? `<span class="gold-weight-chip">18K: ${goldWeight.byKarat['18k']}g</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function renderHoldingCard(h) {
  const isGold = h.assetType === 'Gold';
  const karatLabel = isGold && h.karat ? `${h.karat.toUpperCase()} ` : '';
  const qtyStr = h.quantity != null ? `${h.quantity} ${h.unit || 'g'}` : '';
  const dateStr = h.date ? fmtDate(h.date) : '';
  const costStr = typeof h.purchasePrice === 'number' ? `Cost: ${fmtMoney(h.purchasePrice)}` : '';
  const metaBits = [karatLabel ? `${karatLabel}Gold` : h.assetType, qtyStr, costStr, dateStr].filter(Boolean);

  return `
    <div class="asset-card lot-card" data-holding-id="${h.id}">
      <div class="asset-card-main">
        <div class="asset-name-row">
          <span class="asset-type-badge ${isGold ? 'gold' : ''}">${isGold ? '🪙 ' + (h.karat ? h.karat.toUpperCase() : 'GOLD') : h.assetType}</span>
          <span class="asset-name">${escapeHtml(h.name)}</span>
          <span class="asset-badge ${h.status === 'Owned' ? 'is-owned' : 'is-planned'}">${escapeHtml(h.status || 'Planned')}</span>
        </div>
        <div class="asset-meta">${escapeHtml(metaBits.join(' · '))}</div>
        ${h.pnl ? `<div class="asset-pnl ${h.pnl.isGain ? 'is-gain' : 'is-loss'}" data-holding-pnl="${h.id}">${pnlHtml(h.pnl)}</div>` : ''}
      </div>
      <div class="asset-card-actions">
        <span class="asset-value value-pulse" data-holding-value="${h.id}">${h.liveValue != null ? fmtMoney(h.liveValue) : (h.purchasePrice != null ? fmtMoney(h.purchasePrice) : '—')}</span>
        ${h.status !== 'Owned' ? `<button type="button" class="asset-action-btn" data-holding-buy="${h.id}">Mark Bought</button>` : ''}
        <button type="button" class="asset-action-btn" data-holding-edit="${h.id}">Edit</button>
        <button type="button" class="asset-action-btn danger" data-holding-delete="${h.id}">Remove</button>
      </div>
    </div>
  `;
}

function renderPortfolioPage() {
  if (!portfolioData) return;
  const { holdings, summary } = portfolioData;

  // Filter holdings
  let filtered = holdings;
  if (portfolioFilter === 'gold') {
    filtered = holdings.filter(h => h.assetType === 'Gold');
  } else if (portfolioFilter === 'other') {
    filtered = holdings.filter(h => h.assetType !== 'Gold');
  } else if (portfolioFilter === 'planned') {
    filtered = holdings.filter(h => h.status !== 'Owned');
  }

  const goldCount    = holdings.filter(h => h.assetType === 'Gold').length;
  const otherCount   = holdings.filter(h => h.assetType !== 'Gold').length;
  const plannedCount = holdings.filter(h => h.status !== 'Owned').length;

  assetsContent.innerHTML = `
    <!-- Top Live Rates -->
    <section>
      ${renderGoldTicker()}
      ${renderPortfolioSummary(summary)}
    </section>

    <!-- Unified Add Form Section -->
    <section class="finance-panels" style="margin-top: 18px;">
      <div class="finance-panel" style="grid-column: 1 / -1;">
        <h3 class="finance-panel-title">➕ Add Gold or Asset to Portfolio</h3>
        <form class="finance-add-form" id="portfolioAddForm">
          <div class="field-group">
            <label class="field-label">Asset Type</label>
            <select id="portAssetType">
              <option value="Gold">Gold 🪙</option>
              <option value="Silver">Silver 🥈</option>
              <option value="Stocks">Stocks 📈</option>
              <option value="Real Estate">Real Estate 🏢</option>
              <option value="Other">Other Asset 💎</option>
            </select>
          </div>

          <div class="field-group">
            <label class="field-label">Status</label>
            <select id="portStatus">
              <option value="Owned">Owned (Purchase Log)</option>
              <option value="Planned">Planned to Buy (Wishlist)</option>
            </select>
          </div>

          <div class="field-group" id="portKaratGroup">
            <label class="field-label">Karat</label>
            <select id="portKarat">
              <option value="24k">24K (Pure Gold)</option>
              <option value="21k" selected>21K (Standard)</option>
              <option value="18k">18K (Jewelry)</option>
            </select>
          </div>

          <div class="field-group" id="portQtyGroup">
            <label class="field-label" id="portQtyLabel">Grams Bought</label>
            <input type="number" id="portQuantity" step="0.001" min="0" placeholder="e.g. 1, 5, 10, 31.1" required />
          </div>

          <div class="field-group span-2">
            <label class="field-label">Total Cost / Price Paid</label>
            <div class="amount-input-wrap">
              <span class="amount-prefix">E£</span>
              <input type="number" id="portPrice" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>

          <div class="field-group span-2">
            <label class="field-label">Date</label>
            <div class="date-input-row">
              <input type="date" id="portDate" required />
              <button type="button" class="date-quick-btn" data-days-ago="0">Today</button>
              <button type="button" class="date-quick-btn" data-days-ago="1">Yesterday</button>
            </div>
          </div>

          <div class="field-group span-2">
            <label class="field-label">Label / Name (optional)</label>
            <input type="text" id="portName" placeholder="e.g. BTC Gold Bar, Wedding Ring, AAPL..." />
          </div>

          <button type="submit" class="btn-primary span-2" id="portSubmitBtn">Add to Portfolio</button>
        </form>
      </div>
    </section>

    <!-- Unified Holdings List -->
    <section style="margin-top: 24px;">
      <h2 class="finance-block-title">📜 Portfolio Holdings &amp; History</h2>
      
      <div class="portfolio-filter-bar">
        <button type="button" class="portfolio-filter-btn ${portfolioFilter === 'all' ? 'is-active' : ''}" data-filter="all">All (${holdings.length})</button>
        <button type="button" class="portfolio-filter-btn ${portfolioFilter === 'gold' ? 'is-active' : ''}" data-filter="gold">Gold Lots 🪙 (${goldCount})</button>
        <button type="button" class="portfolio-filter-btn ${portfolioFilter === 'other' ? 'is-active' : ''}" data-filter="other">Other Assets 📦 (${otherCount})</button>
        <button type="button" class="portfolio-filter-btn ${portfolioFilter === 'planned' ? 'is-active' : ''}" data-filter="planned">Wishlist 🕓 (${plannedCount})</button>
      </div>

      <div class="asset-list" id="portfolioList">
        ${filtered.length ? filtered.map(renderHoldingCard).join('') : `<p class="finance-empty">No items found in this view.</p>`}
      </div>
    </section>
  `;

  // Set default date
  document.getElementById('portDate').value = toISODate(new Date());
  wireDateQuickButtons(assetsContent);

  // Dynamic form toggles
  const typeSelect = document.getElementById('portAssetType');
  const karatGroup = document.getElementById('portKaratGroup');
  const qtyLabel   = document.getElementById('portQtyLabel');
  
  function updateFormFields() {
    const isGold = typeSelect.value === 'Gold';
    karatGroup.style.display = isGold ? '' : 'none';
    qtyLabel.textContent = isGold ? 'Grams Bought' : 'Quantity';
  }
  typeSelect.addEventListener('change', updateFormFields);
  updateFormFields();

  // Filter bar
  assetsContent.querySelectorAll('.portfolio-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      portfolioFilter = btn.dataset.filter;
      renderPortfolioPage();
    });
  });

  // Add Form Submit
  document.getElementById('portfolioAddForm').addEventListener('submit', handleAddPortfolio);

  // Card Actions (Edit, Mark Bought, Delete)
  assetsContent.querySelectorAll('[data-holding-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = holdings.find(h => h.id === btn.dataset.holdingEdit);
      if (item) openEditHoldingModal(item);
    });
  });

  assetsContent.querySelectorAll('[data-holding-buy]').forEach(btn => {
    btn.addEventListener('click', () => handleMarkHoldingBought(btn.dataset.holdingBuy));
  });

  assetsContent.querySelectorAll('[data-holding-delete]').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteHolding(btn.dataset.holdingDelete));
  });
}

function updatePortfolioInPlace() {
  if (!portfolioData) return;
  const { holdings, summary } = portfolioData;

  const tickerEl = document.getElementById('goldTicker');
  if (tickerEl) tickerEl.outerHTML = renderGoldTicker().trim();

  const summaryEl = document.getElementById('portfolioSummaryCard');
  if (summaryEl) summaryEl.outerHTML = renderPortfolioSummary(summary).trim();

  holdings.forEach(h => {
    const valEl = document.querySelector(`[data-holding-value="${h.id}"]`);
    if (valEl) {
      valEl.textContent = h.liveValue != null ? fmtMoney(h.liveValue) : (h.purchasePrice != null ? fmtMoney(h.purchasePrice) : '—');
      valEl.classList.remove('value-pulse'); void valEl.offsetWidth; valEl.classList.add('value-pulse');
    }
    const pnlEl = document.querySelector(`[data-holding-pnl="${h.id}"]`);
    if (pnlEl && h.pnl) {
      pnlEl.className = `asset-pnl ${h.pnl.isGain ? 'is-gain' : 'is-loss'}`;
      pnlEl.innerHTML = pnlHtml(h.pnl);
    }
  });
}

// ---- Portfolio Actions ----

async function handleAddPortfolio(e) {
  e.preventDefault();
  const btn = document.getElementById('portSubmitBtn');
  const assetType = document.getElementById('portAssetType').value;
  const status    = document.getElementById('portStatus').value;
  const karat     = document.getElementById('portKarat').value;
  const quantity  = parseFloat(document.getElementById('portQuantity').value);
  const priceVal  = document.getElementById('portPrice').value;
  const date      = document.getElementById('portDate').value;
  const name      = document.getElementById('portName').value.trim();

  if (!Number.isFinite(quantity) || quantity <= 0) {
    showToast('Please enter a valid weight / quantity.');
    return;
  }

  const payload = {
    name: name || undefined,
    assetType,
    status,
    karat: assetType === 'Gold' ? karat : undefined,
    quantity,
    grams: quantity,
    unit: assetType === 'Gold' ? 'gram' : 'unit',
    purchasePrice: priceVal ? parseFloat(priceVal) : undefined,
    pricePaid: priceVal ? parseFloat(priceVal) : undefined,
    date,
  };

  btn.disabled = true;
  btn.textContent = 'Adding…';

  try {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('failed');
    showToast('Added to portfolio.');
    await loadPortfolioPage();
    await loadWealthCard();
    loadFinanceAssetsQuickGlance();
  } catch {
    showToast('Could not add to portfolio — please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add to Portfolio';
  }
}

async function handleMarkHoldingBought(id) {
  try {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Owned' }),
    });
    if (!res.ok) throw new Error('failed');
    showToast('Marked as owned.');
    await loadPortfolioPage();
    await loadWealthCard();
    loadFinanceAssetsQuickGlance();
  } catch {
    showToast('Could not update holding.');
  }
}

async function handleDeleteHolding(id) {
  try {
    const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('failed');
    showToast('Holding removed.');
    await loadPortfolioPage();
    await loadWealthCard();
    loadFinanceAssetsQuickGlance();
  } catch {
    showToast('Could not remove holding.');
  }
}

// ---- Edit Holding Modal ----

const editHoldingModalBackdrop = document.getElementById('editHoldingModalBackdrop');
const editHoldingForm          = document.getElementById('editHoldingForm');
const editHoldingCancelBtn     = document.getElementById('editHoldingCancelBtn');

editHoldingCancelBtn.addEventListener('click', closeEditHoldingModal);
editHoldingModalBackdrop.addEventListener('click', e => {
  if (e.target === editHoldingModalBackdrop) closeEditHoldingModal();
});

function openEditHoldingModal(item) {
  document.getElementById('editHoldingId').value        = item.id;
  document.getElementById('editHoldingIsLot').value     = String(!!item.isGoldLot);
  document.getElementById('editHoldingName').value      = item.name || '';
  document.getElementById('editHoldingQuantity').value  = item.quantity ?? '';
  document.getElementById('editHoldingPrice').value     = item.purchasePrice ?? '';
  document.getElementById('editHoldingDate').value      = item.date || toISODate(new Date());
  document.getElementById('editHoldingStatus').value    = item.status || 'Owned';

  const karatField = document.getElementById('editHoldingKaratField');
  if (item.assetType === 'Gold') {
    karatField.style.display = '';
    document.getElementById('editHoldingKarat').value = (item.karat || '21k').toLowerCase();
  } else {
    karatField.style.display = 'none';
  }

  editHoldingModalBackdrop.hidden = false;
  document.getElementById('editHoldingName').focus();
}

function closeEditHoldingModal() {
  editHoldingModalBackdrop.hidden = true;
}

editHoldingForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id       = document.getElementById('editHoldingId').value;
  const name     = document.getElementById('editHoldingName').value.trim();
  const karat    = document.getElementById('editHoldingKarat').value;
  const quantity = parseFloat(document.getElementById('editHoldingQuantity').value);
  const priceVal = document.getElementById('editHoldingPrice').value;
  const date     = document.getElementById('editHoldingDate').value;
  const status   = document.getElementById('editHoldingStatus').value;

  const payload = {
    name,
    karat,
    quantity,
    grams: quantity,
    purchasePrice: priceVal ? parseFloat(priceVal) : undefined,
    pricePaid: priceVal ? parseFloat(priceVal) : undefined,
    date,
    status,
  };

  const submitBtn = editHoldingForm.querySelector('[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('failed');
    closeEditHoldingModal();
    showToast('Holding updated.');
    await loadPortfolioPage();
    await loadWealthCard();
    loadFinanceAssetsQuickGlance();
  } catch {
    showToast('Could not update holding.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
});

// =============================================================================
// FINANCE ASSETS QUICK GLANCE (embedded in Finance page)
// =============================================================================

function renderQuickGlanceLoading() {
  return `<p class="finance-empty">Loading…</p>`;
}

async function loadFinanceAssetsQuickGlance() {
  const el = document.getElementById('financeAssetsQuickGlance');
  if (!el) return;
  try {
    const res = await fetch('/api/portfolio');
    if (!res.ok) throw new Error('failed');
    const { summary } = await res.json();

    el.innerHTML = `
      <div class="quickglance-card">
        <div class="quickglance-stats">
          <div><div class="stat-label">Total Portfolio</div><div class="stat-value positive">${fmtMoney(summary.currentValue)}</div></div>
          <div><div class="stat-label">Invested</div><div class="stat-value">${fmtMoney(summary.totalInvested)}</div></div>
          <div><div class="stat-label">Unrealized P&amp;L</div><div class="stat-value ${summary.totalPnl.isGain ? 'positive' : 'negative'}">${summary.totalPnl.isGain ? '+' : ''}${fmtMoney(summary.totalPnl.diff)}</div></div>
          <div><div class="stat-label">Holdings</div><div class="stat-value">${summary.counts.owned} owned · ${summary.counts.planned} planned</div></div>
        </div>
        <button type="button" class="quickglance-open-btn" id="quickGlanceOpenBtn">Open Gold &amp; Assets &rarr;</button>
      </div>
    `;
    document.getElementById('quickGlanceOpenBtn').addEventListener('click', () => openPage('Gold & Assets'));
  } catch {
    el.innerHTML = `<p class="finance-empty">Could not load Gold &amp; Assets.</p>`;
  }
}

// =============================================================================
// MORNING / EVENING ROUTINES
// =============================================================================

const morningRoutineBtn    = document.getElementById('morningRoutineBtn');
const eveningRoutineBtn    = document.getElementById('eveningRoutineBtn');
const routineModalBackdrop = document.getElementById('routineModalBackdrop');
const routineModalTitle    = document.getElementById('routineModalTitle');
const routineList          = document.getElementById('routineList');
const routineAddForm       = document.getElementById('routineAddForm');
const routineAddInput      = document.getElementById('routineAddInput');
const routineCloseBtn      = document.getElementById('routineCloseBtn');

let currentRoutineSlot = null;

morningRoutineBtn.addEventListener('click', () => openRoutineModal('Morning'));
eveningRoutineBtn.addEventListener('click', () => openRoutineModal('Evening'));
routineCloseBtn.addEventListener('click', closeRoutineModal);
routineModalBackdrop.addEventListener('click', e => { if (e.target === routineModalBackdrop) closeRoutineModal(); });

async function openRoutineModal(slot) {
  currentRoutineSlot = slot;
  routineModalTitle.textContent = slot === 'Morning' ? '🌅 Morning Routine' : '🌙 Evening Routine';
  const sub = document.getElementById('routineModalSubtitle');
  if (sub) {
    sub.textContent = slot === 'Morning'
      ? 'Check off your morning habits for today — they repeat automatically every day.'
      : 'Check off your evening habits for today — they repeat automatically every day.';
  }
  routineModalBackdrop.hidden   = false;
  await loadRoutineItems();
  routineAddInput.focus();
}

function closeRoutineModal() {
  routineModalBackdrop.hidden = true;
  currentRoutineSlot = null;
}

async function loadRoutineItems() {
  routineList.innerHTML = '<p class="routine-loading">Loading…</p>';
  try {
    const res = await fetch(`/api/routines?slot=${currentRoutineSlot}`);
    if (!res.ok) throw new Error('failed');
    const { items } = await res.json();
    renderRoutineItems(items);
  } catch {
    routineList.innerHTML = '<p class="routine-loading">Could not load this routine — please try again.</p>';
  }
}

function renderRoutineItems(items) {
  if (!items.length) {
    routineList.innerHTML = '<p class="routine-empty">Nothing added yet — add your first habit below.</p>';
    return;
  }
  routineList.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'routine-row' + (item.completed ? ' done' : '');
    row.dataset.id = item.id;
    row.innerHTML = `
      <input type="checkbox" class="checkbox" ${item.completed ? 'checked' : ''} aria-label="Mark '${escapeHtml(item.name)}' complete" />
      <span class="routine-item-name">${escapeHtml(item.name)}</span>
      <button type="button" class="routine-delete-btn" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">✕</button>
    `;
    row.querySelector('.checkbox').addEventListener('change', e => {
      toggleRoutineItem(item.id, e.target.checked, row);
    });
    row.querySelector('.routine-delete-btn').addEventListener('click', () => {
      deleteRoutineItem(item.id, row);
    });
    routineList.appendChild(row);
  });
}

async function toggleRoutineItem(id, completed, row) {
  row.classList.toggle('done', completed);
  try {
    const res = await fetch(`/api/routines/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('failed');
  } catch {
    row.classList.toggle('done', !completed);
    row.querySelector('.checkbox').checked = !completed;
    showToast('Could not update that item — please try again.');
  }
}

async function deleteRoutineItem(id, row) {
  row.style.opacity = '0.4';
  try {
    const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('failed');
    await loadRoutineItems();
    showToast('Habit removed.');
  } catch {
    row.style.opacity = '1';
    showToast('Could not remove that habit — please try again.');
  }
}

routineAddForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = routineAddInput.value.trim();
  if (!name || !currentRoutineSlot) return;
  try {
    const res = await fetch('/api/routines', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slot: currentRoutineSlot }),
    });
    if (!res.ok) throw new Error('failed');
    routineAddInput.value = '';
    await loadRoutineItems();
    showToast(`Added to your daily ${currentRoutineSlot.toLowerCase()} routine (repeats every day).`);
  } catch { showToast('Could not add that item — please try again.'); }
});

// =============================================================================
// 🦷 DENTAL CLINICAL CASES & PATIENT GALLERY LOGIC
// =============================================================================

const dentalCasesSection        = document.getElementById('dentalCasesSection');
const backToDashboardFromDental = document.getElementById('backToDashboardFromDental');
const dentalCasesGrid           = document.getElementById('dentalCasesGrid');
const dentalSearchInput         = document.getElementById('dentalSearchInput');
const dentalSearchClearBtn      = document.getElementById('dentalSearchClearBtn');
const dentalSpecialtyPills      = document.getElementById('dentalSpecialtyPills');
const dentalShowcaseOnlyToggle  = document.getElementById('dentalShowcaseOnlyToggle');
const dentalSortSelect          = document.getElementById('dentalSortSelect');
const dentalProgressFill        = document.getElementById('dentalProgressFill');
const dentalProgressVal         = document.getElementById('dentalProgressVal');

const btnOpenNewCaseModal       = document.getElementById('btnOpenNewCaseModal');
const btnLaunchPresentationMode = document.getElementById('btnLaunchPresentationMode');

// Case Details Drawer
const dentalCaseDrawerBackdrop  = document.getElementById('dentalCaseDrawerBackdrop');
const btnDentalDrawerClose      = document.getElementById('btnDentalDrawerClose');
const btnDrawerPresentCase      = document.getElementById('btnDrawerPresentCase');
const btnDrawerEditCase         = document.getElementById('btnDrawerEditCase');
const drawerSpecialtyBadge      = document.getElementById('drawerSpecialtyBadge');
const drawerTeethChip           = document.getElementById('drawerTeethChip');
const drawerDateBadge           = document.getElementById('drawerDateBadge');
const drawerShowcaseBadge       = document.getElementById('drawerShowcaseBadge');
const dentalDrawerTitle         = document.getElementById('dentalDrawerTitle');
const dentalDrawerPatientCode   = document.getElementById('dentalDrawerPatientCode');
const drawerStepsCount          = document.getElementById('drawerStepsCount');
const drawerXraysCount          = document.getElementById('drawerXraysCount');
const tabBtnSteps               = document.getElementById('tabBtnSteps');
const tabBtnXrays               = document.getElementById('tabBtnXrays');
const tabBtnProtocol            = document.getElementById('tabBtnProtocol');
const tabContentSteps           = document.getElementById('tabContentSteps');
const tabContentXrays           = document.getElementById('tabContentXrays');
const tabContentProtocol        = document.getElementById('tabContentProtocol');
const drawerBeforeAfterWrap     = document.getElementById('drawerBeforeAfterWrap');
const drawerBaSlider            = document.getElementById('drawerBaSlider');
const drawerBaAfterImg          = document.getElementById('drawerBaAfterImg');
const drawerBaBeforeWrap        = document.getElementById('drawerBaBeforeWrap');
const drawerBaBeforeImg         = document.getElementById('drawerBaBeforeImg');
const drawerBaHandle            = document.getElementById('drawerBaHandle');
const drawerStepsTimeline       = document.getElementById('drawerStepsTimeline');
const drawerXraysGrid           = document.getElementById('drawerXraysGrid');
const drawerDiagnosisText       = document.getElementById('drawerDiagnosisText');
const drawerTreatmentPlanText   = document.getElementById('drawerTreatmentPlanText');
const drawerClinicalNotesText   = document.getElementById('drawerClinicalNotesText');
const drawerTagsList            = document.getElementById('drawerTagsList');
const btnXrayInvert             = document.getElementById('btnXrayInvert');
const btnXrayEnhance            = document.getElementById('btnXrayEnhance');

// Patient Presentation Theater
const dentalPresentationTheater = document.getElementById('dentalPresentationTheater');
const btnTheaterClose           = document.getElementById('btnTheaterClose');
const theaterCaseTitle          = document.getElementById('theaterCaseTitle');
const theaterCaseSubtitle       = document.getElementById('theaterCaseSubtitle');
const theaterScopePill          = document.getElementById('theaterScopePill');
const theaterCaseNavigator      = document.getElementById('theaterCaseNavigator');
const btnTheaterPrevCase        = document.getElementById('btnTheaterPrevCase');
const btnTheaterNextCase        = document.getElementById('btnTheaterNextCase');
const theaterCaseSelect         = document.getElementById('theaterCaseSelect');
const theaterCaseCounterBadge   = document.getElementById('theaterCaseCounterBadge');
const btnTheaterModeSplit       = document.getElementById('btnTheaterModeSplit');
const btnTheaterModeStep        = document.getElementById('btnTheaterModeStep');
const theaterStepFocusWrap      = document.getElementById('theaterStepFocusWrap');
const theaterStepFocusImg       = document.getElementById('theaterStepFocusImg');
const btnTheaterPrev            = document.getElementById('btnTheaterPrev');
const btnTheaterNext            = document.getElementById('btnTheaterNext');
const theaterFocusStepBadge     = document.getElementById('theaterFocusStepBadge');
const theaterFocusStepTitle     = document.getElementById('theaterFocusStepTitle');
const theaterFocusStepDesc      = document.getElementById('theaterFocusStepDesc');
const theaterBaSliderWrap       = document.getElementById('theaterBaSliderWrap');
const theaterBaSlider           = document.getElementById('theaterBaSlider');
const theaterBaAfterImg         = document.getElementById('theaterBaAfterImg');
const theaterBaBeforeWrap       = document.getElementById('theaterBaBeforeWrap');
const theaterBaBeforeImg        = document.getElementById('theaterBaBeforeImg');
const theaterBaHandle           = document.getElementById('theaterBaHandle');
const theaterStepCount          = document.getElementById('theaterStepCount');
const theaterStepsScroll        = document.getElementById('theaterStepsScroll');

// Add/Edit Form Modal
const dentalCaseModalBackdrop   = document.getElementById('dentalCaseModalBackdrop');
const dentalCaseForm            = document.getElementById('dentalCaseForm');
const dentalFormModalTitle      = document.getElementById('dentalFormModalTitle');
const dentalFormCaseId          = document.getElementById('dentalFormCaseId');
const dentalFormTitle           = document.getElementById('dentalFormTitle');
const dentalFormPatientCode     = document.getElementById('dentalFormPatientCode');
const dentalFormDate            = document.getElementById('dentalFormDate');
const dentalFormSpecialty       = document.getElementById('dentalFormSpecialty');
const dentalFormTeeth           = document.getElementById('dentalFormTeeth');
const dentalFormDiagnosis       = document.getElementById('dentalFormDiagnosis');
const dentalFormTreatmentPlan   = document.getElementById('dentalFormTreatmentPlan');
const dentalFormClinicalNotes   = document.getElementById('dentalFormClinicalNotes');
const dentalFormTags            = document.getElementById('dentalFormTags');
const dentalFormShowcase        = document.getElementById('dentalFormShowcase');
const dentalFormCancelBtn       = document.getElementById('dentalFormCancelBtn');

// Before/After Form Uploads
const beforeFileInput           = document.getElementById('beforeFileInput');
const beforeUrlInput            = document.getElementById('beforeUrlInput');
const beforeImgPreview          = document.getElementById('beforeImgPreview');
const beforeEmptyPlaceholder    = document.getElementById('beforeEmptyPlaceholder');
const afterFileInput            = document.getElementById('afterFileInput');
const afterUrlInput             = document.getElementById('afterUrlInput');
const afterImgPreview           = document.getElementById('afterImgPreview');
const afterEmptyPlaceholder     = document.getElementById('afterEmptyPlaceholder');

const btnAddFormStep            = document.getElementById('btnAddFormStep');
const dentalFormStepsContainer  = document.getElementById('dentalFormStepsContainer');
const btnAddFormXray            = document.getElementById('btnAddFormXray');
const dentalFormXraysContainer  = document.getElementById('dentalFormXraysContainer');

let loadedDentalCases = [];
let activeDentalCase = null;
let currentDentalSpecialty = 'All';
let dentalSearchDebounceTimer = null;
let activeFormSteps = [];
let activeFormXrays = [];

// Page Navigation
if (backToDashboardFromDental) {
  backToDashboardFromDental.addEventListener('click', showDashboard);
}

function openDentalCasesPage() {
  hideAllTopLevelSections();
  stopGoldPricePolling();
  currentCategoryPage = null;
  if (dentalCasesSection) dentalCasesSection.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadDentalCases();
}

async function loadDentalCases() {
  if (!dentalCasesGrid) return;
  dentalCasesGrid.innerHTML = `
    <div class="skeleton-block" style="height:260px;border-radius:16px;"></div>
    <div class="skeleton-block" style="height:260px;border-radius:16px;"></div>
    <div class="skeleton-block" style="height:260px;border-radius:16px;"></div>
  `;

  try {
    const query = dentalSearchInput ? dentalSearchInput.value.trim() : '';
    const specialty = currentDentalSpecialty;
    const showcase = dentalShowcaseOnlyToggle && dentalShowcaseOnlyToggle.checked ? 'true' : 'false';
    const sortBy = dentalSortSelect ? dentalSortSelect.value : 'date_desc';

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (specialty && specialty !== 'All') params.set('specialty', specialty);
    if (showcase === 'true') params.set('showcase', 'true');
    if (sortBy) params.set('sortBy', sortBy);

    const res = await fetch(`/api/dental-cases?${params.toString()}`);
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    loadedDentalCases = data.cases || [];

    renderDentalCasesGrid(loadedDentalCases);
    updateDentalProgressMetrics(loadedDentalCases);
    loadCardBadges();
  } catch (err) {
    console.error('Error loading dental cases:', err);
    dentalCasesGrid.innerHTML = `
      <div class="finance-error" style="grid-column: 1 / -1;">
        Could not load dental cases — please check your server connection.
      </div>
    `;
  }
}

function updateDentalProgressMetrics(cases) {
  if (!dentalProgressVal || !dentalProgressFill) return;
  const count = cases.length;
  const withXrays = cases.filter(c => c.xrays && c.xrays.length > 0).length;
  const showcaseCount = cases.filter(c => c.showcaseForPatients).length;

  dentalProgressVal.textContent = count === 0
    ? 'No cases found'
    : `${count} case${count === 1 ? '' : 's'} archived (${showcaseCount} showcase · ${withXrays} with X-rays)`;
  dentalProgressFill.style.width = count > 0 ? '100%' : '0%';
}

function formatDentalDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getSpecialtyBadgeHtml(specialty) {
  const spec = specialty || 'General';
  let specClass = 'spec-general';
  const lower = spec.toLowerCase();
  if (lower.includes('restor') || lower.includes('aesthet')) specClass = 'spec-restorative';
  else if (lower.includes('endo')) specClass = 'spec-endo';
  else if (lower.includes('prostho') || lower.includes('veneer')) specClass = 'spec-prostho';
  else if (lower.includes('bleach') || lower.includes('whiten')) specClass = 'spec-bleach';
  else if (lower.includes('implant') || lower.includes('surg')) specClass = 'spec-implant';
  else if (lower.includes('ortho')) specClass = 'spec-ortho';
  else if (lower.includes('perio')) specClass = 'spec-perio';

  return `<span class="case-specialty-badge ${specClass}">
    <span class="specialty-indicator-dot"></span>
    ${escapeHtml(spec)}
  </span>`;
}

function getDateBadgeHtml(dateStr) {
  const formatted = formatDentalDate(dateStr);
  return `<span class="case-date-badge" title="Clinical Date: ${escapeHtml(dateStr || '')}">
    <span class="date-badge-icon">📅</span>
    <span>${escapeHtml(formatted || dateStr || 'N/A')}</span>
  </span>`;
}

function renderDentalCasesGrid(cases) {
  if (!dentalCasesGrid) return;
  if (!cases.length) {
    dentalCasesGrid.innerHTML = `
      <div class="empty-board-state" style="grid-column: 1 / -1; padding: 48px 20px;">
        <span class="empty-glyph">🦷</span>
        <h3>No Clinical Cases Found</h3>
        <p>No dental cases match your current filters or search terms. Try clearing filters or add a new case.</p>
        <button type="button" class="btn-primary" style="margin-top:14px;" onclick="openDentalCaseFormModal()">
          ➕ Record First Case
        </button>
      </div>
    `;
    return;
  }

  dentalCasesGrid.innerHTML = cases.map((c, idx) => {
    const coverUrl = c.beforeAfter?.afterImageUrl || c.beforeAfter?.beforeImageUrl || (c.steps && c.steps[0]?.imageUrl) || '';
    const stepCount = c.steps ? c.steps.length : 0;
    const xrayCount = c.xrays ? c.xrays.length : 0;

    return `
      <div class="dental-case-card" data-id="${escapeHtml(c.id)}" style="--i: ${idx}">
        <div class="case-cover-wrap" onclick="viewCaseById('${escapeHtml(c.id)}')">
          ${coverUrl ? `
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(c.title)}" class="case-cover-img" loading="lazy" />
          ` : `
            <div class="case-empty-cover">
              <span>🦷</span>
              <span>No Images Attached</span>
            </div>
          `}
          ${c.beforeAfter?.beforeImageUrl && c.beforeAfter?.afterImageUrl ? `
            <span class="case-ba-pill">⚡ Before &amp; After</span>
          ` : ''}
          ${c.showcaseForPatients ? `
            <span class="case-showcase-badge-card">🌟 Showcase</span>
          ` : ''}
        </div>

        <div class="case-card-body">
          <div class="case-meta-top">
            ${getSpecialtyBadgeHtml(c.specialty)}
            ${getDateBadgeHtml(c.date)}
          </div>

          <h3 class="case-card-title">${escapeHtml(c.title)}</h3>

          <div class="case-patient-tooth-row">
            <span class="case-patient-code">ID: ${escapeHtml(c.patientCode || 'Anonymous')}</span>
            ${c.teeth ? `<span class="case-tooth-chip">🦷 ${escapeHtml(c.teeth)}</span>` : ''}
          </div>

          ${c.diagnosis ? `
            <p class="case-diag-snippet">${escapeHtml(c.diagnosis)}</p>
          ` : ''}

          <div class="case-badges-row">
            <span class="case-count-pill">📸 ${stepCount} step${stepCount === 1 ? '' : 's'}</span>
            <span class="case-count-pill">🩻 ${xrayCount} X-ray${xrayCount === 1 ? '' : 's'}</span>
          </div>

          <div class="case-actions-row">
            <button type="button" class="btn-case-view" onclick="viewCaseById('${escapeHtml(c.id)}')">
              <span>👁️</span> View Case
            </button>
            <button type="button" class="btn-case-present-sm" onclick="presentCaseById('${escapeHtml(c.id)}')" title="Present to Patient">
              🖥️
            </button>
            <button type="button" class="btn-case-present-sm" onclick="editCaseById('${escapeHtml(c.id)}')" title="Edit Case">
              ✏️
            </button>
            <button type="button" class="btn-case-delete-sm" onclick="deleteCaseById('${escapeHtml(c.id)}')" title="Delete Case">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Global case helpers
window.viewCaseById = function(caseId) {
  const found = loadedDentalCases.find(c => c.id === caseId);
  if (found) openDentalCaseDrawer(found);
};

window.presentCaseById = function(caseId) {
  const found = loadedDentalCases.find(c => c.id === caseId);
  if (found) openPatientPresentation(found, loadedDentalCases);
};

window.editCaseById = function(caseId) {
  const found = loadedDentalCases.find(c => c.id === caseId);
  if (found) openDentalCaseFormModal(found);
};

window.deleteCaseById = async function(caseId) {
  if (!confirm('Are you sure you want to delete this dental clinical case?')) return;
  try {
    const res = await fetch(`/api/dental-cases/${encodeURIComponent(caseId)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('failed');
    showToast('Clinical case deleted.');
    if (dentalCaseDrawerBackdrop && !dentalCaseDrawerBackdrop.hidden) {
      dentalCaseDrawerBackdrop.hidden = true;
    }
    await loadDentalCases();
  } catch (err) {
    showToast('Could not delete case.');
  }
};

// Search & Filter Events
if (dentalSearchInput) {
  dentalSearchInput.addEventListener('input', () => {
    if (dentalSearchClearBtn) {
      dentalSearchClearBtn.hidden = !dentalSearchInput.value;
    }
    clearTimeout(dentalSearchDebounceTimer);
    dentalSearchDebounceTimer = setTimeout(loadDentalCases, 250);
  });
}

if (dentalSearchClearBtn) {
  dentalSearchClearBtn.addEventListener('click', () => {
    dentalSearchInput.value = '';
    dentalSearchClearBtn.hidden = true;
    loadDentalCases();
  });
}

if (dentalSpecialtyPills) {
  dentalSpecialtyPills.querySelectorAll('.dental-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      dentalSpecialtyPills.querySelectorAll('.dental-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentDentalSpecialty = pill.dataset.specialty || 'All';
      loadDentalCases();
    });
  });
}

if (dentalShowcaseOnlyToggle) {
  dentalShowcaseOnlyToggle.addEventListener('change', loadDentalCases);
}
if (dentalSortSelect) {
  dentalSortSelect.addEventListener('change', loadDentalCases);
}

// Presentation Mode launch from header
if (btnLaunchPresentationMode) {
  btnLaunchPresentationMode.addEventListener('click', () => {
    const targetCase = loadedDentalCases[0];
    if (!targetCase) {
      return showToast('No clinical cases available to present in current view.');
    }
    openPatientPresentation(targetCase, loadedDentalCases);
  });
}

if (btnOpenNewCaseModal) {
  btnOpenNewCaseModal.addEventListener('click', () => openDentalCaseFormModal());
}

// =============================================================================
// CASE DETAILS DRAWER & INTERACTIVE SLIDER
// =============================================================================

function openDentalCaseDrawer(c) {
  activeDentalCase = c;
  if (!dentalCaseDrawerBackdrop) return;

  const spec = c.specialty || 'General';
  let specClass = 'spec-general';
  const lower = spec.toLowerCase();
  if (lower.includes('restor') || lower.includes('aesthet')) specClass = 'spec-restorative';
  else if (lower.includes('endo')) specClass = 'spec-endo';
  else if (lower.includes('prostho') || lower.includes('veneer')) specClass = 'spec-prostho';
  else if (lower.includes('bleach') || lower.includes('whiten')) specClass = 'spec-bleach';
  else if (lower.includes('implant') || lower.includes('surg')) specClass = 'spec-implant';
  else if (lower.includes('ortho')) specClass = 'spec-ortho';
  else if (lower.includes('perio')) specClass = 'spec-perio';

  if (drawerSpecialtyBadge) {
    drawerSpecialtyBadge.className = `dental-specialty-badge ${specClass}`;
    drawerSpecialtyBadge.innerHTML = `<span class="specialty-indicator-dot"></span> ${escapeHtml(spec)}`;
  }
  if (drawerTeethChip) {
    drawerTeethChip.textContent = c.teeth ? `🦷 ${c.teeth}` : '🦷 Teeth N/A';
  }
  if (drawerDateBadge) {
    drawerDateBadge.innerHTML = `<span class="date-badge-icon">📅</span> ${escapeHtml(formatDentalDate(c.date) || c.date || 'N/A')}`;
  }
  if (drawerShowcaseBadge) {
    drawerShowcaseBadge.hidden = !c.showcaseForPatients;
  }

  dentalDrawerTitle.textContent = c.title || 'Clinical Case';
  dentalDrawerPatientCode.textContent = `Patient ID: ${c.patientCode || 'Anonymous'}`;

  const stepCount = c.steps ? c.steps.length : 0;
  const xrayCount = c.xrays ? c.xrays.length : 0;
  drawerStepsCount.textContent = stepCount;
  drawerXraysCount.textContent = xrayCount;

  // Render Before / After Hero
  if (c.beforeAfter?.beforeImageUrl && c.beforeAfter?.afterImageUrl) {
    drawerBeforeAfterWrap.hidden = false;
    drawerBaBeforeImg.src = c.beforeAfter.beforeImageUrl;
    drawerBaAfterImg.src = c.beforeAfter.afterImageUrl;
    setupComparisonSlider(drawerBaSlider, drawerBaBeforeWrap, drawerBaHandle, 50);
  } else {
    drawerBeforeAfterWrap.hidden = true;
  }

  // Render Steps
  if (drawerStepsTimeline) {
    if (c.steps && c.steps.length) {
      drawerStepsTimeline.innerHTML = c.steps.map((s, idx) => `
        <div class="dental-step-card">
          ${s.imageUrl ? `
            <div class="step-card-img-wrap">
              <img src="${escapeHtml(s.imageUrl)}" alt="${escapeHtml(s.title || '')}" class="step-card-img" onclick="openImageLightbox('${escapeHtml(s.imageUrl)}')" />
            </div>
          ` : ''}
          <div class="step-card-info">
            <span class="step-card-num-badge">Step ${s.stepNumber || idx + 1}</span>
            <h4 class="step-card-title">${escapeHtml(s.title || `Clinical Step ${idx + 1}`)}</h4>
            <p class="step-card-desc">${escapeHtml(s.description || '')}</p>
          </div>
        </div>
      `).join('');
    } else {
      drawerStepsTimeline.innerHTML = '<p class="finance-empty">No clinical photos attached to this case yet.</p>';
    }
  }

  // Render X-Rays
  if (drawerXraysGrid) {
    if (c.xrays && c.xrays.length) {
      drawerXraysGrid.innerHTML = c.xrays.map(xr => `
        <div class="dental-xray-card">
          <div class="xray-card-head">
            <span class="xray-label">${escapeHtml(xr.label || 'Periapical X-Ray')}</span>
            <span class="xray-date">${escapeHtml(xr.date || c.date || '')}</span>
          </div>
          <div class="xray-img-wrap">
            <img src="${escapeHtml(xr.url)}" alt="${escapeHtml(xr.label)}" class="xray-img" onclick="openImageLightbox('${escapeHtml(xr.url)}')" />
          </div>
          ${xr.notes ? `<p class="xray-notes"><strong>Findings:</strong> ${escapeHtml(xr.notes)}</p>` : ''}
        </div>
      `).join('');
    } else {
      drawerXraysGrid.innerHTML = '<p class="finance-empty" style="grid-column:1/-1;">No radiographs attached to this case.</p>';
    }
  }

  // Render Protocol
  if (drawerDiagnosisText) drawerDiagnosisText.textContent = c.diagnosis || 'No pre-op diagnosis recorded.';
  if (drawerTreatmentPlanText) drawerTreatmentPlanText.textContent = c.treatmentPlan || 'No protocol recorded.';
  if (drawerClinicalNotesText) drawerClinicalNotesText.textContent = c.clinicalNotes || 'No notes.';

  if (drawerTagsList) {
    if (c.tags && c.tags.length) {
      drawerTagsList.innerHTML = c.tags.map(t => `<span class="dental-tag-pill">#${escapeHtml(t)}</span>`).join('');
    } else {
      drawerTagsList.innerHTML = '<span style="color:var(--ink-soft);font-size:12px;">No tags</span>';
    }
  }

  // Switch to first tab
  switchDrawerTab('steps');

  dentalCaseDrawerBackdrop.hidden = false;
}

function switchDrawerTab(tabId) {
  [tabBtnSteps, tabBtnXrays, tabBtnProtocol].forEach(btn => {
    if (btn) btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  if (tabContentSteps) tabContentSteps.hidden = tabId !== 'steps';
  if (tabContentXrays) tabContentXrays.hidden = tabId !== 'xrays';
  if (tabContentProtocol) tabContentProtocol.hidden = tabId !== 'protocol';
}

if (tabBtnSteps) tabBtnSteps.addEventListener('click', () => switchDrawerTab('steps'));
if (tabBtnXrays) tabBtnXrays.addEventListener('click', () => switchDrawerTab('xrays'));
if (tabBtnProtocol) tabBtnProtocol.addEventListener('click', () => switchDrawerTab('protocol'));

if (btnDentalDrawerClose) {
  btnDentalDrawerClose.addEventListener('click', () => {
    if (dentalCaseDrawerBackdrop) dentalCaseDrawerBackdrop.hidden = true;
  });
}
if (dentalCaseDrawerBackdrop) {
  dentalCaseDrawerBackdrop.addEventListener('click', e => {
    if (e.target === dentalCaseDrawerBackdrop) dentalCaseDrawerBackdrop.hidden = true;
  });
}

if (btnDrawerPresentCase) {
  btnDrawerPresentCase.addEventListener('click', () => {
    if (activeDentalCase) {
      dentalCaseDrawerBackdrop.hidden = true;
      openPatientPresentation(activeDentalCase, loadedDentalCases);
    }
  });
}
if (btnDrawerEditCase) {
  btnDrawerEditCase.addEventListener('click', () => {
    if (activeDentalCase) {
      dentalCaseDrawerBackdrop.hidden = true;
      openDentalCaseFormModal(activeDentalCase);
    }
  });
}

// X-ray enhancement buttons
if (btnXrayInvert) {
  btnXrayInvert.addEventListener('click', () => {
    btnXrayInvert.classList.toggle('active');
    document.querySelectorAll('.xray-img').forEach(img => img.classList.toggle('inverted'));
  });
}
if (btnXrayEnhance) {
  btnXrayEnhance.addEventListener('click', () => {
    btnXrayEnhance.classList.toggle('active');
    document.querySelectorAll('.xray-img').forEach(img => img.classList.toggle('enhanced'));
  });
}

// Generic interactive Before/After comparison slider handler
function setupComparisonSlider(sliderEl, beforeWrapEl, handleEl, initialPct = 50) {
  if (!sliderEl || !beforeWrapEl || !handleEl) return;

  function updatePos(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    beforeWrapEl.style.width = `${clamped}%`;
    handleEl.style.left = `${clamped}%`;
  }

  updatePos(initialPct);

  let isDragging = false;

  function onPointerDown(e) {
    isDragging = true;
    onPointerMove(e);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const rect = sliderEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    updatePos(pct);
  }

  function onPointerUp() {
    isDragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  sliderEl.onpointerdown = onPointerDown;
}

// =============================================================================
// FULLSCREEN CHAIRSIDE PATIENT PRESENTATION THEATER
// =============================================================================

let currentTheaterCase = null;
let currentTheaterStepIndex = 0;
let currentTheaterMode = 'step'; // 'step' | 'split'
let theaterPlaylist = [];
let currentTheaterCaseIndex = 0;

function openPatientPresentation(c, customPlaylist = null) {
  if (!dentalPresentationTheater) return;

  // Determine active playlist (e.g. filtered cases or all cases)
  if (Array.isArray(customPlaylist) && customPlaylist.length > 0) {
    theaterPlaylist = [...customPlaylist];
  } else if (Array.isArray(loadedDentalCases) && loadedDentalCases.length > 0) {
    theaterPlaylist = [...loadedDentalCases];
  } else {
    theaterPlaylist = c ? [c] : [];
  }

  // Ensure current case c is in the playlist
  let targetIdx = c ? theaterPlaylist.findIndex(item => item.id === c.id) : 0;
  if (targetIdx === -1 && c) {
    theaterPlaylist.unshift(c);
    targetIdx = 0;
  }
  currentTheaterCaseIndex = Math.max(0, targetIdx);

  renderTheaterCase(theaterPlaylist[currentTheaterCaseIndex]);
  dentalPresentationTheater.hidden = false;
  document.body.style.overflow = 'hidden';
}

function renderTheaterCase(c) {
  if (!c) return;
  currentTheaterCase = c;
  currentTheaterStepIndex = 0;

  // Update Topbar Info
  theaterCaseTitle.textContent = c.title || 'Clinical Treatment Presentation';
  theaterCaseSubtitle.textContent = `${c.teeth ? `Tooth ${c.teeth} • ` : ''}${c.specialty || 'Restorative'} • Patient ID: ${c.patientCode || 'Anonymous'}`;

  // Update Scope Pill
  if (theaterScopePill) {
    const isFiltered = (currentDentalSpecialty && currentDentalSpecialty !== 'All') || (dentalSearchInput && dentalSearchInput.value) || (dentalShowcaseOnlyToggle && dentalShowcaseOnlyToggle.checked);
    theaterScopePill.textContent = isFiltered
      ? `🔍 Filtered Cases (${theaterPlaylist.length})`
      : `📂 All Cases (${theaterPlaylist.length})`;
  }

  // Update Dropdown Selector
  if (theaterCaseSelect) {
    theaterCaseSelect.innerHTML = theaterPlaylist.map((item, idx) => `
      <option value="${escapeHtml(item.id)}" ${idx === currentTheaterCaseIndex ? 'selected' : ''}>
        ${idx + 1}. ${escapeHtml(item.title)} ${item.teeth ? `(🦷 ${escapeHtml(item.teeth)})` : ''}
      </option>
    `).join('');
  }

  // Update Counter Badge
  if (theaterCaseCounterBadge) {
    theaterCaseCounterBadge.textContent = `${currentTheaterCaseIndex + 1} / ${theaterPlaylist.length}`;
  }

  // Update Next/Prev Case Buttons
  if (btnTheaterPrevCase) btnTheaterPrevCase.disabled = (currentTheaterCaseIndex === 0);
  if (btnTheaterNextCase) btnTheaterNextCase.disabled = (currentTheaterCaseIndex === theaterPlaylist.length - 1);

  // Setup presentation comparison slider
  const beforeUrl = c.beforeAfter?.beforeImageUrl || (c.steps && c.steps[0]?.imageUrl) || (c.photos && c.photos[0]?.url) || '';
  const afterUrl  = c.beforeAfter?.afterImageUrl || (c.steps && c.steps[c.steps.length - 1]?.imageUrl) || (c.photos && c.photos[c.photos.length - 1]?.url) || '';

  if (beforeUrl && afterUrl) {
    theaterBaBeforeImg.src = beforeUrl;
    theaterBaAfterImg.src = afterUrl;
    setupComparisonSlider(theaterBaSlider, theaterBaBeforeWrap, theaterBaHandle, 50);
  } else {
    theaterBaBeforeImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%230b0e14" width="600" height="400"/><text fill="%2394a3b8" font-family="sans-serif" font-size="18" font-weight="bold" x="50%" y="45%" text-anchor="middle">🦷 No Initial Case Photos</text><text fill="%2364748b" font-family="sans-serif" font-size="14" x="50%" y="55%" text-anchor="middle">Upload before/after photos in case editor</text></svg>';
    theaterBaAfterImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%230f172a" width="600" height="400"/><text fill="%2338bdf8" font-family="sans-serif" font-size="18" font-weight="bold" x="50%" y="45%" text-anchor="middle">✨ Treatment Outcome</text><text fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%" y="55%" text-anchor="middle">Post-op photos will appear here</text></svg>';
    setupComparisonSlider(theaterBaSlider, theaterBaBeforeWrap, theaterBaHandle, 50);
  }

  // Render Stepped Walkthrough Rail
  if (theaterStepsScroll) {
    const steps = c.steps || [];
    theaterStepCount.textContent = `${steps.length} Step${steps.length === 1 ? '' : 's'}`;

    if (steps.length) {
      theaterStepsScroll.innerHTML = steps.map((s, idx) => `
        <div class="theater-step-card ${idx === 0 ? 'active' : ''}" id="theaterStepCard_${idx}" onclick="selectTheaterStep(${idx})">
          ${s.imageUrl ? `
            <img src="${escapeHtml(s.imageUrl)}" alt="${escapeHtml(s.title || '')}" class="theater-step-card-img" />
          ` : ''}
          <div class="theater-step-card-title">Step ${s.stepNumber || idx + 1}: ${escapeHtml(s.title || '')}</div>
          <div class="theater-step-card-desc">${escapeHtml(s.description || '')}</div>
        </div>
      `).join('');
    } else {
      theaterStepsScroll.innerHTML = '<p style="color:var(--ink-soft);font-size:13px;padding:12px;">No clinical steps added for this case.</p>';
    }
  }

  // Open in Step Focus View if steps exist, else Split Slider
  if (c.steps && c.steps.length > 0) {
    displayTheaterStep(0);
  } else {
    displayTheaterSplit();
  }
}

function switchTheaterCase(newIndex) {
  if (newIndex < 0 || newIndex >= theaterPlaylist.length) return;
  currentTheaterCaseIndex = newIndex;
  renderTheaterCase(theaterPlaylist[currentTheaterCaseIndex]);
}

function theaterNextCase() {
  if (currentTheaterCaseIndex < theaterPlaylist.length - 1) {
    switchTheaterCase(currentTheaterCaseIndex + 1);
  } else {
    showToast('You are on the last case in this view.');
  }
}

function theaterPrevCase() {
  if (currentTheaterCaseIndex > 0) {
    switchTheaterCase(currentTheaterCaseIndex - 1);
  } else {
    showToast('You are on the first case.');
  }
}

// Case Navigator Listeners
if (btnTheaterPrevCase) btnTheaterPrevCase.addEventListener('click', theaterPrevCase);
if (btnTheaterNextCase) btnTheaterNextCase.addEventListener('click', theaterNextCase);
if (theaterCaseSelect) {
  theaterCaseSelect.addEventListener('change', (e) => {
    const idx = theaterPlaylist.findIndex(c => c.id === e.target.value);
    if (idx !== -1) switchTheaterCase(idx);
  });
}

function displayTheaterStep(index = 0) {
  if (!currentTheaterCase) return;
  const steps = currentTheaterCase.steps || [];

  currentTheaterMode = 'step';
  if (theaterStepFocusWrap) theaterStepFocusWrap.hidden = false;
  if (theaterBaSliderWrap) theaterBaSliderWrap.hidden = true;
  if (btnTheaterModeStep) btnTheaterModeStep.classList.add('active');
  if (btnTheaterModeSplit) btnTheaterModeSplit.classList.remove('active');

  if (!steps.length) {
    if (theaterStepFocusImg) {
      const casePhoto = (currentTheaterCase.photos && currentTheaterCase.photos[0]?.url) || currentTheaterCase.beforeAfter?.afterImageUrl || '';
      theaterStepFocusImg.src = casePhoto || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%230b0e14" width="600" height="400"/><text fill="%2338bdf8" font-family="sans-serif" font-size="20" font-weight="bold" x="50%" y="45%" text-anchor="middle">📸 Step Focus Mode</text><text fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%" y="55%" text-anchor="middle">No individual procedure steps added yet</text></svg>';
      theaterStepFocusImg.alt = currentTheaterCase.title || 'Case Overview';
    }
    if (theaterFocusStepBadge) theaterFocusStepBadge.textContent = 'Overview · 0 Steps';
    if (theaterFocusStepTitle) theaterFocusStepTitle.textContent = currentTheaterCase.title || 'Clinical Case';
    if (theaterFocusStepDesc) theaterFocusStepDesc.textContent = currentTheaterCase.diagnosis || 'Add detailed procedure steps in the Case Editor to walkthrough each step.';
    if (btnTheaterPrev) btnTheaterPrev.disabled = true;
    if (btnTheaterNext) btnTheaterNext.disabled = true;
    return;
  }

  currentTheaterStepIndex = Math.max(0, Math.min(steps.length - 1, index));
  const step = steps[currentTheaterStepIndex];

  // Update big screen image with smooth fade
  if (theaterStepFocusImg) {
    theaterStepFocusImg.classList.remove('fade-in');
    void theaterStepFocusImg.offsetWidth; // force reflow for animation
    theaterStepFocusImg.src = step.imageUrl || currentTheaterCase.beforeAfter?.afterImageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%230f172a" width="600" height="400"/><text fill="%2338bdf8" font-family="sans-serif" font-size="18" font-weight="bold" x="50%" y="45%" text-anchor="middle">🦷 Step</text></svg>';
    theaterStepFocusImg.alt = step.title || 'Clinical Step';
    theaterStepFocusImg.classList.add('fade-in');
  }

  if (theaterFocusStepBadge) {
    theaterFocusStepBadge.textContent = `Step ${step.stepNumber || currentTheaterStepIndex + 1} of ${steps.length}`;
  }
  if (theaterFocusStepTitle) {
    theaterFocusStepTitle.textContent = step.title || `Clinical Step ${currentTheaterStepIndex + 1}`;
  }
  if (theaterFocusStepDesc) {
    theaterFocusStepDesc.textContent = step.description || '';
  }

  // Update prev / next button states
  if (btnTheaterPrev) btnTheaterPrev.disabled = (currentTheaterStepIndex === 0);
  if (btnTheaterNext) btnTheaterNext.disabled = (currentTheaterStepIndex === steps.length - 1);

  // Highlight step card on right rail and scroll it into view
  const cards = document.querySelectorAll('.theater-step-card');
  cards.forEach((card, i) => {
    const isActive = (i === currentTheaterStepIndex);
    card.classList.toggle('active', isActive);
    if (isActive) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

window.displayTheaterStep = displayTheaterStep;
window.displayTheaterSplit = displayTheaterSplit;

function displayTheaterSplit() {
  currentTheaterMode = 'split';
  if (theaterStepFocusWrap) theaterStepFocusWrap.hidden = true;
  if (theaterBaSliderWrap) theaterBaSliderWrap.hidden = false;
  if (btnTheaterModeSplit) btnTheaterModeSplit.classList.add('active');
  if (btnTheaterModeStep) btnTheaterModeStep.classList.remove('active');

  // De-activate rail step items
  document.querySelectorAll('.theater-step-card').forEach(c => c.classList.remove('active'));
}

window.selectTheaterStep = function(stepIdx) {
  displayTheaterStep(stepIdx);
};

function theaterNextStep() {
  if (!currentTheaterCase) return;
  const steps = currentTheaterCase.steps || [];
  if (currentTheaterMode === 'split') {
    displayTheaterStep(0);
  } else if (currentTheaterStepIndex < steps.length - 1) {
    displayTheaterStep(currentTheaterStepIndex + 1);
  }
}

function theaterPrevStep() {
  if (!currentTheaterCase) return;
  if (currentTheaterMode === 'split') {
    displayTheaterStep(0);
  } else if (currentTheaterStepIndex > 0) {
    displayTheaterStep(currentTheaterStepIndex - 1);
  }
}

// Stage toolbar mode switchers
if (btnTheaterModeSplit) {
  btnTheaterModeSplit.addEventListener('click', displayTheaterSplit);
}
if (btnTheaterModeStep) {
  btnTheaterModeStep.addEventListener('click', () => displayTheaterStep(currentTheaterStepIndex));
}

// Stage floating navigation buttons
if (btnTheaterPrev) {
  btnTheaterPrev.addEventListener('click', theaterPrevStep);
}
if (btnTheaterNext) {
  btnTheaterNext.addEventListener('click', theaterNextStep);
}

function closePatientPresentation() {
  if (dentalPresentationTheater) {
    dentalPresentationTheater.hidden = true;
    document.body.style.overflow = '';
  }
}

if (btnTheaterClose) {
  btnTheaterClose.addEventListener('click', closePatientPresentation);
}

// Keyboard shortcuts for presentation mode:
// - Left / Right Arrow, PageUp / PageDown, Space to step through
// - [ / ] or P / N or Alt+Left/Right to switch cases
// - B to toggle Before/After comparison
// - Home / End to jump
// - Escape to exit
window.addEventListener('keydown', e => {
  if (!dentalPresentationTheater || dentalPresentationTheater.hidden) return;

  // Don't intercept if user is typing in an input
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closePatientPresentation();
  } else if (e.key === 'BracketRight' || e.key === ']' || e.key === 'KeyN' || e.key === 'n' || e.key === 'N' || (e.altKey && e.key === 'ArrowRight')) {
    e.preventDefault();
    theaterNextCase();
  } else if (e.key === 'BracketLeft' || e.key === '[' || e.key === 'KeyP' || e.key === 'p' || e.key === 'P' || (e.altKey && e.key === 'ArrowLeft')) {
    e.preventDefault();
    theaterPrevCase();
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    theaterNextStep();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    theaterPrevStep();
  } else if (e.key === 'KeyB' || e.key === 'b' || e.key === 'B') {
    e.preventDefault();
    if (currentTheaterMode === 'split') {
      displayTheaterStep(currentTheaterStepIndex);
    } else {
      displayTheaterSplit();
    }
  } else if (e.key === 'Home') {
    e.preventDefault();
    displayTheaterStep(0);
  } else if (e.key === 'End') {
    if (currentTheaterCase && currentTheaterCase.steps) {
      e.preventDefault();
      displayTheaterStep(currentTheaterCase.steps.length - 1);
    }
  }
});

// Simple Image Lightbox Viewer
window.openImageLightbox = function(url) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out;backdrop-filter:blur(10px);';
  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:12px;box-shadow:0 0 50px rgba(0,0,0,0.8);';
  modal.appendChild(img);
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
};

// =============================================================================
// ADD / EDIT DENTAL CASE MODAL LOGIC
// =============================================================================

function openDentalCaseFormModal(caseToEdit = null) {
  if (!dentalCaseModalBackdrop || !dentalCaseForm) return;

  dentalCaseForm.reset();
  activeFormSteps = [];
  activeFormXrays = [];

  if (caseToEdit) {
    dentalFormModalTitle.textContent = 'Edit Clinical Case';
    dentalFormCaseId.value = caseToEdit.id;
    dentalFormTitle.value = caseToEdit.title || '';
    dentalFormPatientCode.value = caseToEdit.patientCode || '';
    dentalFormDate.value = caseToEdit.date || toISODate(new Date());
    dentalFormSpecialty.value = caseToEdit.specialty || 'Restorative & Aesthetics';
    dentalFormTeeth.value = caseToEdit.teeth || '';
    dentalFormDiagnosis.value = caseToEdit.diagnosis || '';
    dentalFormTreatmentPlan.value = caseToEdit.treatmentPlan || '';
    dentalFormClinicalNotes.value = caseToEdit.clinicalNotes || '';
    dentalFormTags.value = caseToEdit.tags ? caseToEdit.tags.join(', ') : '';
    dentalFormShowcase.checked = !!caseToEdit.showcaseForPatients;

    // Before / After
    if (caseToEdit.beforeAfter?.beforeImageUrl) {
      beforeImgPreview.src = caseToEdit.beforeAfter.beforeImageUrl;
      beforeImgPreview.hidden = false;
      beforeEmptyPlaceholder.hidden = true;
      beforeUrlInput.value = caseToEdit.beforeAfter.beforeImageUrl;
    } else {
      beforeImgPreview.hidden = true;
      beforeEmptyPlaceholder.hidden = false;
    }

    if (caseToEdit.beforeAfter?.afterImageUrl) {
      afterImgPreview.src = caseToEdit.beforeAfter.afterImageUrl;
      afterImgPreview.hidden = false;
      afterEmptyPlaceholder.hidden = true;
      afterUrlInput.value = caseToEdit.beforeAfter.afterImageUrl;
    } else {
      afterImgPreview.hidden = true;
      afterEmptyPlaceholder.hidden = false;
    }

    // Steps
    activeFormSteps = caseToEdit.steps ? JSON.parse(JSON.stringify(caseToEdit.steps)) : [];
    // X-rays
    activeFormXrays = caseToEdit.xrays ? JSON.parse(JSON.stringify(caseToEdit.xrays)) : [];
  } else {
    dentalFormModalTitle.textContent = 'New Clinical Case';
    dentalFormCaseId.value = '';
    dentalFormDate.value = toISODate(new Date());
    beforeImgPreview.hidden = true;
    beforeEmptyPlaceholder.hidden = false;
    afterImgPreview.hidden = true;
    afterEmptyPlaceholder.hidden = false;
    activeFormSteps = [];
    activeFormXrays = [];
  }

  renderFormStepsList();
  renderFormXraysList();

  dentalCaseModalBackdrop.hidden = false;
  dentalFormTitle.focus();
}

function closeDentalCaseFormModal() {
  if (dentalCaseModalBackdrop) dentalCaseModalBackdrop.hidden = true;
}

if (dentalFormCancelBtn) dentalFormCancelBtn.addEventListener('click', closeDentalCaseFormModal);
if (dentalCaseModalBackdrop) {
  dentalCaseModalBackdrop.addEventListener('click', e => {
    if (e.target === dentalCaseModalBackdrop) closeDentalCaseFormModal();
  });
}

// File upload preview handlers for Before & After
function setupImageUploadPreview(fileInput, urlInput, imgPreview, emptyPlaceholder) {
  if (!fileInput) return;

  fileInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imgPreview.src = reader.result;
      imgPreview.hidden = false;
      emptyPlaceholder.hidden = true;
      if (urlInput) urlInput.value = '';
    };
    reader.readAsDataURL(file);
  });

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim()) {
        imgPreview.src = urlInput.value.trim();
        imgPreview.hidden = false;
        emptyPlaceholder.hidden = true;
      }
    });
  }
}

setupImageUploadPreview(beforeFileInput, beforeUrlInput, beforeImgPreview, beforeEmptyPlaceholder);
setupImageUploadPreview(afterFileInput, afterUrlInput, afterImgPreview, afterEmptyPlaceholder);

// Dynamic Steps Builder
function renderFormStepsList() {
  if (!dentalFormStepsContainer) return;
  dentalFormStepsContainer.innerHTML = activeFormSteps.map((step, idx) => `
    <div class="builder-row" data-step-idx="${idx}">
      <div class="builder-row-header">
        <span>Step ${idx + 1}</span>
        <button type="button" class="btn-remove-builder-row" onclick="removeFormStep(${idx})">&times; Remove</button>
      </div>
      <div class="dental-form-grid">
        <div class="form-group full-width">
          <input type="text" placeholder="Step title (e.g. Rubber Dam &amp; Bevel Prep)" value="${escapeHtml(step.title || '')}" onchange="updateFormStep(${idx}, 'title', this.value)" required />
        </div>
        <div class="form-group full-width">
          <input type="text" placeholder="Image URL or upload below..." value="${escapeHtml(step.imageUrl || '')}" onchange="updateFormStep(${idx}, 'imageUrl', this.value)" />
        </div>
        <div class="form-group full-width">
          <input type="file" accept="image/*" onchange="uploadStepImageFile(${idx}, this)" />
        </div>
        <div class="form-group full-width">
          <textarea rows="2" placeholder="Clinical technique description..." onchange="updateFormStep(${idx}, 'description', this.value)">${escapeHtml(step.description || '')}</textarea>
        </div>
      </div>
    </div>
  `).join('');
}

if (btnAddFormStep) {
  btnAddFormStep.addEventListener('click', () => {
    activeFormSteps.push({
      stepNumber: activeFormSteps.length + 1,
      title: '',
      imageUrl: '',
      description: '',
      isBefore: activeFormSteps.length === 0,
      isAfter: false,
    });
    renderFormStepsList();
  });
}

window.removeFormStep = function(idx) {
  activeFormSteps.splice(idx, 1);
  renderFormStepsList();
};

window.updateFormStep = function(idx, field, val) {
  if (activeFormSteps[idx]) activeFormSteps[idx][field] = val;
};

window.uploadStepImageFile = function(idx, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/dental-cases/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: reader.result, filename: file.name, type: 'step' }),
      });
      const data = await res.json();
      if (data.url && activeFormSteps[idx]) {
        activeFormSteps[idx].imageUrl = data.url;
        renderFormStepsList();
      }
    } catch {
      if (activeFormSteps[idx]) {
        activeFormSteps[idx].imageUrl = reader.result;
        renderFormStepsList();
      }
    }
  };
  reader.readAsDataURL(file);
};

// Dynamic X-Ray Builder
function renderFormXraysList() {
  if (!dentalFormXraysContainer) return;
  dentalFormXraysContainer.innerHTML = activeFormXrays.map((xr, idx) => `
    <div class="builder-row" data-xray-idx="${idx}">
      <div class="builder-row-header">
        <span>X-Ray ${idx + 1}</span>
        <button type="button" class="btn-remove-builder-row" onclick="removeFormXray(${idx})">&times; Remove</button>
      </div>
      <div class="dental-form-grid">
        <div class="form-group">
          <select onchange="updateFormXray(${idx}, 'label', this.value)">
            <option value="Pre-op Periapical" ${xr.label === 'Pre-op Periapical' ? 'selected' : ''}>Pre-op Periapical</option>
            <option value="Working Length" ${xr.label === 'Working Length' ? 'selected' : ''}>Working Length / Master Cone</option>
            <option value="Post-op Obturation" ${xr.label === 'Post-op Obturation' ? 'selected' : ''}>Post-op Obturation</option>
            <option value="Bitewing" ${xr.label === 'Bitewing' ? 'selected' : ''}>Bitewing</option>
            <option value="Panoramic OPG" ${xr.label === 'Panoramic OPG' ? 'selected' : ''}>Panoramic OPG</option>
            <option value="Follow-up 6 Months" ${xr.label === 'Follow-up 6 Months' ? 'selected' : ''}>Follow-up 6 Months</option>
          </select>
        </div>
        <div class="form-group">
          <input type="date" value="${escapeHtml(xr.date || '')}" onchange="updateFormXray(${idx}, 'date', this.value)" />
        </div>
        <div class="form-group full-width">
          <input type="text" placeholder="X-Ray Image URL or upload below..." value="${escapeHtml(xr.url || '')}" onchange="updateFormXray(${idx}, 'url', this.value)" />
        </div>
        <div class="form-group full-width">
          <input type="file" accept="image/*" onchange="uploadXrayImageFile(${idx}, this)" />
        </div>
        <div class="form-group full-width">
          <input type="text" placeholder="Radiographic findings / notes..." value="${escapeHtml(xr.notes || '')}" onchange="updateFormXray(${idx}, 'notes', this.value)" />
        </div>
      </div>
    </div>
  `).join('');
}

if (btnAddFormXray) {
  btnAddFormXray.addEventListener('click', () => {
    activeFormXrays.push({
      id: `xr_${Date.now()}`,
      label: 'Pre-op Periapical',
      url: '',
      date: dentalFormDate.value || toISODate(new Date()),
      notes: '',
    });
    renderFormXraysList();
  });
}

window.removeFormXray = function(idx) {
  activeFormXrays.splice(idx, 1);
  renderFormXraysList();
};

window.updateFormXray = function(idx, field, val) {
  if (activeFormXrays[idx]) activeFormXrays[idx][field] = val;
};

window.uploadXrayImageFile = function(idx, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/dental-cases/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: reader.result, filename: file.name, type: 'xray' }),
      });
      const data = await res.json();
      if (data.url && activeFormXrays[idx]) {
        activeFormXrays[idx].url = data.url;
        renderFormXraysList();
      }
    } catch {
      if (activeFormXrays[idx]) {
        activeFormXrays[idx].url = reader.result;
        renderFormXraysList();
      }
    }
  };
  reader.readAsDataURL(file);
};

// Form Submit Handler
if (dentalCaseForm) {
  dentalCaseForm.addEventListener('submit', async e => {
    e.preventDefault();
    const caseId = dentalFormCaseId.value;

    const beforeUrl = beforeImgPreview.src && !beforeImgPreview.hidden ? beforeImgPreview.src : beforeUrlInput.value.trim();
    const afterUrl  = afterImgPreview.src && !afterImgPreview.hidden ? afterImgPreview.src : afterUrlInput.value.trim();

    const payload = {
      title: dentalFormTitle.value.trim(),
      patientCode: dentalFormPatientCode.value.trim() || 'Anonymous',
      date: dentalFormDate.value,
      specialty: dentalFormSpecialty.value,
      teeth: dentalFormTeeth.value.trim(),
      diagnosis: dentalFormDiagnosis.value.trim(),
      treatmentPlan: dentalFormTreatmentPlan.value.trim(),
      clinicalNotes: dentalFormClinicalNotes.value.trim(),
      tags: dentalFormTags.value.split(',').map(t => t.trim()).filter(Boolean),
      showcaseForPatients: dentalFormShowcase.checked,
      beforeAfter: {
        beforeImageUrl: beforeUrl || '',
        afterImageUrl: afterUrl || '',
        beforeLabel: 'Initial Condition',
        afterLabel: 'Final Result',
      },
      steps: activeFormSteps,
      xrays: activeFormXrays,
    };

    const submitBtn = document.getElementById('dentalFormSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Case...';

    try {
      const url = caseId ? `/api/dental-cases/${encodeURIComponent(caseId)}` : '/api/dental-cases';
      const method = caseId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('failed');
      closeDentalCaseFormModal();
      showToast(caseId ? 'Clinical case updated.' : 'New clinical case saved to archive.');
      await loadDentalCases();
    } catch (err) {
      console.error('Error saving dental case:', err);
      showToast('Could not save case — please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Clinical Case';
    }
  });
}

// =============================================================================
// WEEKLY PLANNER
// =============================================================================


const DAY_LABELS = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

function getWeekDates(reference) {
  const dayOfWeek        = reference.getDay();
  const diffFromSaturday = (dayOfWeek + 1) % 7;
  const saturday         = new Date(reference);
  saturday.setDate(reference.getDate() - diffFromSaturday);
  saturday.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDate(a, b) { return toISODate(a) === toISODate(b); }

function initWeekTabs() {
  const today = new Date();
  weekDates          = getWeekDates(today);
  selectedDayIndex   = weekDates.findIndex(d => isSameDate(d, today));
  if (selectedDayIndex === -1) selectedDayIndex = 0;

  weekTabs.querySelectorAll('button.day-tab').forEach(btn => btn.remove());

  weekDates.forEach((date, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-tab';
    btn.setAttribute('role', 'tab');
    btn.dataset.index = String(index);
    btn.innerHTML = `<span class="day-name">${DAY_LABELS[index]}</span><span class="day-num">${date.getDate()}</span>`;
    if (isSameDate(date, today)) btn.classList.add('is-today');
    btn.addEventListener('click', () => selectDay(index));
    weekTabs.appendChild(btn);
  });

  updateIndicator();
  selectDay(selectedDayIndex);
}

function updateIndicator() {
  weekIndicator.style.transform = `translateX(${selectedDayIndex * 100}%)`;
}

function updateTodayMarkers() {
  const today = new Date();
  weekTabs.querySelectorAll('.day-tab').forEach((btn, i) => {
    btn.classList.toggle('is-today', isSameDate(weekDates[i], today));
  });
}

async function selectDay(index) {
  selectedDayIndex = index;
  updateIndicator();
  weekTabs.querySelectorAll('.day-tab').forEach((btn, i) => {
    btn.classList.toggle('is-active', i === index);
    btn.setAttribute('aria-selected', String(i === index));
  });
  await loadWeekDay();
}

async function loadWeekDay() {
  const date = toISODate(weekDates[selectedDayIndex]);
  weeklyBoard.classList.add('is-loading');
  try {
    const res = await fetch(`/api/tasks?date=${date}`);
    if (!res.ok) throw new Error('failed');
    const { tasks: allTasks } = await res.json();
    const tasks = allTasks.filter(t => t.category !== 'Routine');
    renderBoard(weeklyBoard, tasks, {
      compact:   false,
      emptyGlyph:'🗓️',
      emptyTitle:'Nothing planned',
      emptyText: 'No tasks scheduled for this day yet.',
      onToggled: syncBoards,
      onEdited:  syncBoards,
      onDeleted: syncBoards,
    });
  } catch {
    showToast('Could not load that day\'s tasks.');
  } finally {
    weeklyBoard.classList.remove('is-loading');
  }
}

// =============================================================================
// ADD TASK MODAL
// =============================================================================

const modalBackdrop  = document.getElementById('modalBackdrop');
const taskForm       = document.getElementById('taskForm');
const taskCategory   = document.getElementById('taskCategory');
const taskSegment    = document.getElementById('taskSegment');
const segmentField   = document.getElementById('segmentField');
const taskPriority   = document.getElementById('taskPriority');
const taskDueDate    = document.getElementById('taskDueDate');

document.getElementById('addTaskBtn').addEventListener('click', openAddModal);
document.getElementById('cancelBtn').addEventListener('click', closeAddModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeAddModal(); });

async function loadMeta() {
  const res = await fetch('/api/meta');
  meta = await res.json();
  taskCategory.innerHTML = meta.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  taskPriority.innerHTML = meta.priorities.map(p => `<option value="${p}">${p}</option>`).join('');
  // Also populate edit modal priority dropdown
  document.getElementById('editTaskPriority').innerHTML = meta.priorities.map(p => `<option value="${p}">${p}</option>`).join('');
  updateSegmentOptions();
}

taskCategory.addEventListener('change', updateSegmentOptions);

function updateSegmentOptions() {
  const options = meta.segmentsByCategory[taskCategory.value] || [];
  if (!options.length) { segmentField.style.display = 'none'; return; }
  segmentField.style.display = '';
  taskSegment.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
}

function openAddModal() {
  taskForm.reset();
  const defaultDate = weekDates.length ? weekDates[selectedDayIndex] : new Date();
  taskDueDate.value = toISODate(defaultDate);
  updateSegmentOptions();
  modalBackdrop.hidden = false;
  document.getElementById('taskName').focus();
}

function closeAddModal() { modalBackdrop.hidden = true; }

taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    task:     document.getElementById('taskName').value.trim(),
    category: taskCategory.value,
    segment:  segmentField.style.display === 'none' ? null : taskSegment.value,
    priority: taskPriority.value,
    dueDate:  taskDueDate.value,
  };
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('failed');
    closeAddModal();
    showToast('Task added.');
    await syncBoards();
    loadCardBadges();
  } catch { showToast('Could not add that task — please try again.'); }
});

// =============================================================================
// INTERACTIVE SIDEBAR & 3D MECHANICAL PAPER FLIP-CLOCK ENGINE
// =============================================================================

const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed';

const btnSidebarCollapse = document.getElementById('btnSidebarCollapse');
const btnSidebarToggle   = document.getElementById('btnSidebarToggle');

let prevHoursStr   = null;
let prevMinutesStr = null;
let prevSecondsStr = null;

function initSidebarState() {
  const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  document.body.classList.toggle('sidebar-is-collapsed', isCollapsed);
}

function toggleSidebar(collapsed) {
  const willCollapse = typeof collapsed === 'boolean' 
    ? collapsed 
    : !document.body.classList.contains('sidebar-is-collapsed');
  
  document.body.classList.toggle('sidebar-is-collapsed', willCollapse);
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, willCollapse ? '1' : '0');
  } catch (_) {}
  
  if (willCollapse) {
    showToast('Sidebar hidden — Clock & Date transferred to main screen ⏰');
  }
}

if (btnSidebarCollapse) {
  btnSidebarCollapse.addEventListener('click', () => toggleSidebar(true));
}
if (btnSidebarToggle) {
  btnSidebarToggle.addEventListener('click', () => toggleSidebar(false));
}

// Keyboard shortcut: Ctrl + \ or Cmd + \
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
    e.preventDefault();
    toggleSidebar();
  }
});

function flipFlapDigit(unit, newStr, prevStr) {
  const tile = document.getElementById(`flipTile${unit}`);
  const valEl= document.getElementById(`flipVal${unit}`);
  if (!tile || !valEl) return;

  if (prevStr === null) {
    valEl.textContent = newStr;
    return;
  }

  if (newStr !== prevStr) {
    tile.classList.remove('flip-animate');
    void tile.offsetWidth; // Trigger reflow
    tile.classList.add('flip-animate');
    
    // Halfway through 3D flip at 215ms
    setTimeout(() => {
      valEl.textContent = newStr;
    }, 215);
  } else {
    valEl.textContent = newStr;
  }
}

function tickClock() {
  const now = new Date();

  // 1. Sidebar Classic Clock & Date
  const sidebarClock = document.getElementById('clock');
  if (sidebarClock) {
    sidebarClock.textContent = now.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  const sidebarDate = document.getElementById('dateLabel');
  const fullDateStr = now.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  if (sidebarDate && sidebarDate.textContent !== fullDateStr) {
    sidebarDate.textContent = fullDateStr;
  }

  // 2. Floating 3D Mechanical Split-Flap Clock & Date
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 12-hour format
  
  const hoursStr   = String(hours).padStart(2, '0');
  const minutesStr = String(now.getMinutes()).padStart(2, '0');
  const secondsStr = String(now.getSeconds()).padStart(2, '0');

  flipFlapDigit('Hours', hoursStr, prevHoursStr);
  flipFlapDigit('Minutes', minutesStr, prevMinutesStr);
  flipFlapDigit('Seconds', secondsStr, prevSecondsStr);

  prevHoursStr   = hoursStr;
  prevMinutesStr = minutesStr;
  prevSecondsStr = secondsStr;

  const flipAmpm = document.getElementById('flipAmpmTag');
  if (flipAmpm && flipAmpm.textContent !== ampm) {
    flipAmpm.textContent = ampm;
  }

  const headerDateText = document.getElementById('headerFlipDateText');
  if (headerDateText && headerDateText.textContent !== fullDateStr) {
    headerDateText.textContent = fullDateStr;
  }
}

initSidebarState();
tickClock();
setInterval(tickClock, 1000);

// =============================================================================
// DATE-ROLLOVER WATCHER
// =============================================================================

let lastSeenDateStr = toISODate(new Date());

function checkForDateRollover() {
  const now       = new Date();
  const nowDateStr= toISODate(now);
  if (nowDateStr === lastSeenDateStr) return;
  lastSeenDateStr = nowDateStr;

  loadTasks();

  const stillInDisplayedWeek = weekDates.some(d => isSameDate(d, now));
  if (!stillInDisplayedWeek) {
    initWeekTabs();
  } else {
    updateTodayMarkers();
    loadWeekDay();
  }

  if (!financeSection.hidden && lastLoadedFinanceMonth && monthTitleForDate(now) !== lastLoadedFinanceMonth) {
    currentFinanceMonth = monthTitleForDate(now);
    renderMonthNav();
    loadFinancePage();
  }
}
setInterval(checkForDateRollover, 60 * 1000);

// =============================================================================
// ANALYTICS & PROGRESS INTELLIGENCE HUB (Weekly, Monthly, Yearly Charts)
// =============================================================================

const analyticsProgressSection      = document.getElementById('analyticsProgressSection');
const backToDashboardFromAnalytics  = document.getElementById('backToDashboardFromAnalytics');
const btnRefreshAnalytics           = document.getElementById('btnRefreshAnalytics');
const sidebarAnalyticsBtn           = document.getElementById('sidebarAnalyticsBtn');
const analyticsHorizonTabs          = document.getElementById('analyticsHorizonTabs');
const analyticsCategoryPills        = document.getElementById('analyticsCategoryPills');
const analyticsKpiGrid              = document.getElementById('analyticsKpiGrid');
const mainChartTitle                = document.getElementById('mainChartTitle');
const mainChartSub                  = document.getElementById('mainChartSub');
const mainChartHorizonBadge         = document.getElementById('mainChartHorizonBadge');
const categoryMatrixGrid            = document.getElementById('categoryMatrixGrid');

let comprehensiveAnalyticsData = null;
let activeAnalyticsHorizon = 'overview'; // 'overview' | 'weekly' | 'monthly' | 'yearly'
let activeAnalyticsCategory = 'ALL';     // 'ALL' | 'Work' | 'Us stocks trading' | 'Workouts' | 'Studies' | 'Religion' | 'Dental'

// Chart.js instances map to prevent canvas re-use collision
let chartInstances = {
  velocity: null,
  categoryShare: null,
  dayRhythm: null,
  priority: null,
  yearlyTrajectory: null,
};

function destroyChart(name) {
  if (chartInstances[name]) {
    try { chartInstances[name].destroy(); } catch (_) {}
    chartInstances[name] = null;
  }
}

function destroyAllAnalyticsCharts() {
  Object.keys(chartInstances).forEach(destroyChart);
}

async function openAnalyticsPage(horizon = 'overview', category = 'ALL') {
  activeAnalyticsHorizon = horizon;
  activeAnalyticsCategory = category;

  hideAllTopLevelSections();
  if (analyticsProgressSection) analyticsProgressSection.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update tabs UI
  if (analyticsHorizonTabs) {
    analyticsHorizonTabs.querySelectorAll('.horizon-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.horizon === activeAnalyticsHorizon);
    });
  }
  if (analyticsCategoryPills) {
    analyticsCategoryPills.querySelectorAll('.cat-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.cat === activeAnalyticsCategory);
    });
  }

  await loadComprehensiveAnalytics();
}

async function loadComprehensiveAnalytics() {
  if (analyticsKpiGrid) {
    analyticsKpiGrid.innerHTML = `
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
    `;
  }

  try {
    const res = await fetch('/api/analytics/comprehensive');
    if (!res.ok) throw new Error('Network failed');
    comprehensiveAnalyticsData = await res.json();
    renderAnalyticsIntelligence();
  } catch (err) {
    console.error('Analytics load error:', err);
    showToast('Could not load analytics. Please try again.');
  }
}

function renderAnalyticsIntelligence() {
  if (!comprehensiveAnalyticsData || !comprehensiveAnalyticsData.overall) return;

  renderAnalyticsKpiScorecards();
  renderAnalyticsCharts();
  renderCategoryMatrixGrid();
}

// 1. KPI Scorecards
function renderAnalyticsKpiScorecards() {
  if (!analyticsKpiGrid || !comprehensiveAnalyticsData) return;
  const { overall, categoryProfiles, dentalStats } = comprehensiveAnalyticsData;

  let totalTasks = 0;
  let doneTasks = 0;
  let pct = 0;
  let horizonLabel = 'Overall All-Time';

  if (activeAnalyticsCategory === 'ALL') {
    if (activeAnalyticsHorizon === 'weekly') {
      totalTasks = overall.currentWeek.total;
      doneTasks = overall.currentWeek.done;
      pct = overall.currentWeek.pct;
      horizonLabel = 'This Week (Sat–Fri)';
    } else if (activeAnalyticsHorizon === 'monthly') {
      totalTasks = overall.currentMonth.total;
      doneTasks = overall.currentMonth.done;
      pct = overall.currentMonth.pct;
      horizonLabel = `This Month (${overall.currentMonth.monthName})`;
    } else if (activeAnalyticsHorizon === 'yearly') {
      totalTasks = overall.currentYear.total;
      doneTasks = overall.currentYear.done;
      pct = overall.currentYear.pct;
      horizonLabel = `Year ${overall.currentYear.year}`;
    } else {
      totalTasks = overall.totalTasks;
      doneTasks = overall.doneTasks;
      pct = overall.overallPct;
      horizonLabel = 'All Horizons Combined';
    }
  } else if (activeAnalyticsCategory === 'Dental') {
    totalTasks = dentalStats.totalCases || 0;
    doneTasks = dentalStats.showcaseCases || 0;
    pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;
    horizonLabel = 'Dental Clinical Archive';
  } else {
    const p = categoryProfiles[activeAnalyticsCategory] || { allTime: { total: 0, done: 0, pct: 0 } };
    if (activeAnalyticsHorizon === 'weekly') {
      totalTasks = p.weekly.total;
      doneTasks = p.weekly.done;
      pct = p.weekly.pct;
      horizonLabel = `${activeAnalyticsCategory} • Weekly`;
    } else if (activeAnalyticsHorizon === 'monthly') {
      totalTasks = p.monthly.total;
      doneTasks = p.monthly.done;
      pct = p.monthly.pct;
      horizonLabel = `${activeAnalyticsCategory} • Monthly`;
    } else if (activeAnalyticsHorizon === 'yearly') {
      totalTasks = p.yearly.total;
      doneTasks = p.yearly.done;
      pct = p.yearly.pct;
      horizonLabel = `${activeAnalyticsCategory} • Yearly (${overall.currentYear.year})`;
    } else {
      totalTasks = p.allTime.total;
      doneTasks = p.allTime.done;
      pct = p.allTime.pct;
      horizonLabel = `${activeAnalyticsCategory} • All-Time`;
    }
  }

  const catDisplay = activeAnalyticsCategory === 'ALL'
    ? 'All Categories'
    : (activeAnalyticsCategory === 'Us stocks trading' ? 'US Stocks' : activeAnalyticsCategory);

  analyticsKpiGrid.innerHTML = `
    <div class="analytics-kpi-card" style="--kpi-glow: #38bdf8;">
      <div class="kpi-card-label">
        <span>Total Workload</span>
        <span class="kpi-badge-pill">${escapeHtml(catDisplay)}</span>
      </div>
      <div class="kpi-card-value">${totalTasks}</div>
      <div class="kpi-card-sub">${escapeHtml(horizonLabel)}</div>
    </div>

    <div class="analytics-kpi-card" style="--kpi-glow: #22c55e;">
      <div class="kpi-card-label">
        <span>Completed</span>
        <span class="kpi-badge-pill" style="color:#22c55e;border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.1);">✓ DONE</span>
      </div>
      <div class="kpi-card-value" style="color:#22c55e;">${doneTasks}</div>
      <div class="kpi-card-sub">${totalTasks - doneTasks} pending completion</div>
    </div>

    <div class="analytics-kpi-card" style="--kpi-glow: #eab308;">
      <div class="kpi-card-label">
        <span>Completion Velocity</span>
        <span class="kpi-badge-pill" style="color:#eab308;border-color:rgba(234,179,8,0.3);background:rgba(234,179,8,0.1);">RATE</span>
      </div>
      <div class="kpi-card-value" style="color:#eab308;">${pct}%</div>
      <div class="kpi-card-sub">Execution efficiency</div>
    </div>

    <div class="analytics-kpi-card" style="--kpi-glow: #a855f7;">
      <div class="kpi-card-label">
        <span>Consistency Horizon</span>
        <span class="kpi-badge-pill" style="color:#a855f7;border-color:rgba(168,85,247,0.3);background:rgba(168,85,247,0.1);">SCOPE</span>
      </div>
      <div class="kpi-card-value" style="font-size:20px;text-transform:capitalize;padding-top:4px;">
        ${activeAnalyticsHorizon === 'overview' ? '⚡ 360° Matrix' : (activeAnalyticsHorizon === 'weekly' ? '📅 7-Day Cycle' : (activeAnalyticsHorizon === 'monthly' ? '🗓️ 6-Month Flow' : '📆 12-Month Year'))}
      </div>
      <div class="kpi-card-sub">Active analytical perspective</div>
    </div>
  `;
}

// 2. Main Chart Renderers
function renderAnalyticsCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not yet ready');
    return;
  }

  // Set Global Chart.js Defaults for Ultra Dark Glass Aesthetic
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 18, 26, 0.94)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(56, 189, 248, 0.4)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold', size: 12 };

  renderVelocityTrajectoryChart();
  renderCategoryShareDoughnut();
  renderDayRhythmRadarChart();
  renderPriorityMatrixChart();
  renderYearlyProgressSpline();
}

// Chart 1: Main Velocity Trajectory
function renderVelocityTrajectoryChart() {
  const canvas = document.getElementById('canvasVelocityChart');
  if (!canvas) return;
  destroyChart('velocity');

  const { overall } = comprehensiveAnalyticsData;
  let labels = [];
  let totalData = [];
  let doneData = [];
  let horizonBadgeText = '';

  if (activeAnalyticsHorizon === 'weekly') {
    labels = overall.currentWeek.days.map(d => `${d.dayLabel} (${d.date.slice(5)})`);
    if (activeAnalyticsCategory === 'ALL') {
      totalData = overall.currentWeek.days.map(d => d.total);
      doneData = overall.currentWeek.days.map(d => d.done);
    } else {
      totalData = overall.currentWeek.days.map(d => d.byCategory?.[activeAnalyticsCategory]?.total || 0);
      doneData = overall.currentWeek.days.map(d => d.byCategory?.[activeAnalyticsCategory]?.done || 0);
    }
    horizonBadgeText = 'Weekly (7 Days)';
    if (mainChartTitle) mainChartTitle.textContent = '📈 Current Week Daily Execution Velocity';
    if (mainChartSub) mainChartSub.textContent = 'Saturday to Friday daily task load and completed count';
  } else if (activeAnalyticsHorizon === 'monthly') {
    labels = overall.last6Months.map(m => m.label);
    if (activeAnalyticsCategory === 'ALL') {
      totalData = overall.last6Months.map(m => m.total);
      doneData = overall.last6Months.map(m => m.done);
    } else {
      totalData = overall.last6Months.map(m => m.byCategory?.[activeAnalyticsCategory]?.total || 0);
      doneData = overall.last6Months.map(m => m.byCategory?.[activeAnalyticsCategory]?.done || 0);
    }
    horizonBadgeText = 'Monthly (Last 6 Months)';
    if (mainChartTitle) mainChartTitle.textContent = '🗓️ Month-by-Month Completion Trends';
    if (mainChartSub) mainChartSub.textContent = 'Task volume and completed outputs across the last 6 months';
  } else if (activeAnalyticsHorizon === 'yearly') {
    labels = overall.currentYear.months.map(m => m.shortName);
    if (activeAnalyticsCategory === 'ALL') {
      totalData = overall.currentYear.months.map(m => m.total);
      doneData = overall.currentYear.months.map(m => m.done);
    } else {
      totalData = overall.currentYear.months.map(m => m.byCategory?.[activeAnalyticsCategory]?.total || 0);
      doneData = overall.currentYear.months.map(m => m.byCategory?.[activeAnalyticsCategory]?.done || 0);
    }
    horizonBadgeText = `Year ${overall.currentYear.year} (12 Months)`;
    if (mainChartTitle) mainChartTitle.textContent = `📆 Full Annual Trajectory (${overall.currentYear.year})`;
    if (mainChartSub) mainChartSub.textContent = '12-month January to December workload and completion';
  } else {
    labels = overall.last4Weeks.map(w => `${w.label} (${w.dateRange})`);
    if (activeAnalyticsCategory === 'ALL') {
      totalData = overall.last4Weeks.map(w => w.total);
      doneData = overall.last4Weeks.map(w => w.done);
    } else {
      totalData = overall.last4Weeks.map(w => w.byCategory?.[activeAnalyticsCategory]?.total || 0);
      doneData = overall.last4Weeks.map(w => w.byCategory?.[activeAnalyticsCategory]?.done || 0);
    }
    horizonBadgeText = '4-Week Rolling Trend';
    if (mainChartTitle) mainChartTitle.textContent = '📈 Multi-Week Execution Velocity & Momentum';
    if (mainChartSub) mainChartSub.textContent = 'Rolling 4-week task volume vs completed milestones';
  }

  if (mainChartHorizonBadge) mainChartHorizonBadge.textContent = horizonBadgeText;

  const ctx = canvas.getContext('2d');
  const gradientDone = ctx.createLinearGradient(0, 0, 0, 260);
  gradientDone.addColorStop(0, 'rgba(34, 197, 94, 0.85)');
  gradientDone.addColorStop(1, 'rgba(34, 197, 94, 0.15)');

  const gradientTotal = ctx.createLinearGradient(0, 0, 0, 260);
  gradientTotal.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  gradientTotal.addColorStop(1, 'rgba(56, 189, 248, 0.08)');

  chartInstances.velocity = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Completed Tasks',
          data: doneData,
          backgroundColor: gradientDone,
          borderColor: '#22c55e',
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32,
        },
        {
          label: 'Total Tasks Assigned',
          data: totalData,
          backgroundColor: gradientTotal,
          borderColor: 'rgba(56, 189, 248, 0.6)',
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', color: '#e2e8f0' }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: { stepSize: 2, color: '#94a3b8' }
        }
      }
    }
  });
}

// Chart 2: Category Distribution Doughnut
function renderCategoryShareDoughnut() {
  const canvas = document.getElementById('canvasCategoryShareChart');
  if (!canvas) return;
  destroyChart('categoryShare');

  const { overall, dentalStats } = comprehensiveAnalyticsData;
  const cats = ['Work', 'Us stocks trading', 'Workouts', 'Studies', 'Religion', 'Dental'];
  const labels = ['Work / Clinic', 'US Stocks', 'Workouts', 'Studies', 'Religion', 'Dental Cases'];
  
  const values = cats.map(c => {
    if (c === 'Dental') return dentalStats.totalCases || 0;
    if (activeAnalyticsHorizon === 'weekly') return overall.currentWeek.byCategory?.[c]?.total || 0;
    if (activeAnalyticsHorizon === 'monthly') return overall.currentMonth.byCategory?.[c]?.total || 0;
    if (activeAnalyticsHorizon === 'yearly') return overall.currentYear.byCategory?.[c]?.total || 0;
    return overall.last4Weeks?.[0]?.byCategory?.[c]?.total || overall.currentWeek?.byCategory?.[c]?.total || 1;
  });

  const bgColors = [
    '#38bdf8', // Work
    '#eab308', // Trading
    '#22c55e', // Workouts
    '#a855f7', // Studies
    '#06b6d4', // Religion
    '#00f2fe', // Dental
  ];

  chartInstances.categoryShare = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values.every(v => v === 0) ? [1, 1, 1, 1, 1, 1] : values,
        backgroundColor: bgColors,
        borderColor: '#0f121a',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', color: '#cbd5e1', padding: 12 }
        }
      }
    }
  });
}

// Chart 3: Weekly Day-by-Day Adherence Rhythm
function renderDayRhythmRadarChart() {
  const canvas = document.getElementById('canvasDayRhythmChart');
  if (!canvas) return;
  destroyChart('dayRhythm');

  const { overall, categoryProfiles } = comprehensiveAnalyticsData;
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const shortDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  let completionData = [];
  if (activeAnalyticsCategory === 'ALL') {
    completionData = overall.currentWeek.days.map(d => d.total);
  } else if (categoryProfiles[activeAnalyticsCategory]) {
    const dist = categoryProfiles[activeAnalyticsCategory].dayDistribution;
    completionData = days.map(d => dist?.[d]?.total || 0);
  } else {
    completionData = [0, 0, 0, 0, 0, 0, 0];
  }

  chartInstances.dayRhythm = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: shortDays,
      datasets: [{
        label: 'Task Intensity & Load',
        data: completionData,
        backgroundColor: 'rgba(56, 189, 248, 0.25)',
        borderColor: '#38bdf8',
        borderWidth: 2,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#fff',
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          pointLabels: { color: '#cbd5e1', font: { weight: 'bold', size: 11 } },
          ticks: { backdropColor: 'transparent', color: '#64748b', stepSize: 2 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Chart 4: Priority & Intensity Velocity
function renderPriorityMatrixChart() {
  const canvas = document.getElementById('canvasPriorityChart');
  if (!canvas) return;
  destroyChart('priority');

  const { categoryProfiles } = comprehensiveAnalyticsData;
  let highTotal = 0, highDone = 0;
  let medTotal = 0, medDone = 0;
  let lowTotal = 0, lowDone = 0;

  if (activeAnalyticsCategory === 'ALL') {
    Object.values(categoryProfiles).forEach(p => {
      if (p.priorities) {
        highTotal += p.priorities.High?.total || 0;
        highDone += p.priorities.High?.done || 0;
        medTotal += p.priorities.Medium?.total || 0;
        medDone += p.priorities.Medium?.done || 0;
        lowTotal += p.priorities.Low?.total || 0;
        lowDone += p.priorities.Low?.done || 0;
      }
    });
  } else if (categoryProfiles[activeAnalyticsCategory]?.priorities) {
    const prio = categoryProfiles[activeAnalyticsCategory].priorities;
    highTotal = prio.High?.total || 0;
    highDone = prio.High?.done || 0;
    medTotal = prio.Medium?.total || 0;
    medDone = prio.Medium?.done || 0;
    lowTotal = prio.Low?.total || 0;
    lowDone = prio.Low?.done || 0;
  }

  chartInstances.priority = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['🔴 High Priority', '🟡 Medium Priority', '🟢 Low Priority'],
      datasets: [
        {
          label: 'Completed',
          data: [highDone, medDone, lowDone],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Pending / Remaining',
          data: [Math.max(0, highTotal - highDone), Math.max(0, medTotal - medDone), Math.max(0, lowTotal - lowDone)],
          backgroundColor: ['rgba(239, 68, 68, 0.25)', 'rgba(245, 158, 11, 0.25)', 'rgba(16, 185, 129, 0.25)'],
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', stepSize: 2 }
        },
        y: {
          stacked: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#cbd5e1' }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 10, color: '#e2e8f0', usePointStyle: true }
        }
      }
    }
  });
}

// Chart 5: 12-Month Year Progress Curve
function renderYearlyProgressSpline() {
  const canvas = document.getElementById('canvasYearlyTrajectoryChart');
  if (!canvas) return;
  destroyChart('yearlyTrajectory');

  const { overall } = comprehensiveAnalyticsData;
  const months = overall.currentYear.months || [];
  const labels = months.map(m => m.name);

  let dataPoints = [];
  if (activeAnalyticsCategory === 'ALL') {
    dataPoints = months.map(m => m.total);
  } else {
    dataPoints = months.map(m => m.byCategory?.[activeAnalyticsCategory]?.total || 0);
  }

  const ctx = canvas.getContext('2d');
  const gradientFill = ctx.createLinearGradient(0, 0, 0, 260);
  gradientFill.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  gradientFill.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  chartInstances.yearlyTrajectory = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${activeAnalyticsCategory === 'ALL' ? 'Overall' : activeAnalyticsCategory} Workload Curve`,
        data: dataPoints,
        borderColor: '#38bdf8',
        borderWidth: 2.5,
        backgroundColor: gradientFill,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: { stepSize: 5, color: '#94a3b8' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// 3. Category Matrix Grid
function renderCategoryMatrixGrid() {
  if (!categoryMatrixGrid || !comprehensiveAnalyticsData) return;
  const { categoryProfiles, dentalStats } = comprehensiveAnalyticsData;

  const catMeta = [
    { key: 'Work',              title: 'Work / Clinic', icon: '💼', color: '#38bdf8' },
    { key: 'Us stocks trading', title: 'US Stocks',     icon: '📈', color: '#eab308' },
    { key: 'Workouts',          title: 'Workouts',      icon: '🏋️', color: '#22c55e' },
    { key: 'Studies',           title: 'Studies',       icon: '📚', color: '#a855f7' },
    { key: 'Religion',          title: 'Religion',      icon: '🌙', color: '#06b6d4' },
    { key: 'Dental',            title: 'Dental Cases',  icon: '🦷', color: '#00f2fe' },
  ];

  categoryMatrixGrid.innerHTML = catMeta.map(c => {
    let total = 0;
    let done = 0;
    let pct = 0;

    if (c.key === 'Dental') {
      total = dentalStats.totalCases || 0;
      done = dentalStats.showcaseCases || 0;
      pct = 100;
    } else {
      const prof = categoryProfiles?.[c.key];
      if (prof) {
        if (activeAnalyticsHorizon === 'weekly') {
          total = prof.weekly?.total ?? prof.total ?? 0;
          done = prof.weekly?.done ?? prof.done ?? 0;
          pct = prof.weekly?.pct ?? prof.pct ?? 0;
        } else if (activeAnalyticsHorizon === 'monthly') {
          total = prof.monthly?.total ?? (prof.total ? prof.total * 4 : 0);
          done = prof.monthly?.done ?? (prof.done ? prof.done * 4 : 0);
          pct = prof.monthly?.pct ?? prof.pct ?? 0;
        } else if (activeAnalyticsHorizon === 'yearly') {
          total = prof.yearly?.total ?? (prof.total ? prof.total * 48 : 0);
          done = prof.yearly?.done ?? (prof.done ? prof.done * 48 : 0);
          pct = prof.yearly?.pct ?? prof.pct ?? 0;
        } else {
          total = prof.allTime?.total ?? prof.total ?? 0;
          done = prof.allTime?.done ?? prof.done ?? 0;
          pct = prof.allTime?.pct ?? prof.pct ?? 0;
        }
      }
    }

    const isSelected = activeAnalyticsCategory === c.key;

    return `
      <div class="cat-matrix-card ${isSelected ? 'active' : ''}"
           style="--matrix-card-color: ${c.color}; ${isSelected ? `border-color:${c.color};box-shadow:0 0 20px ${c.color}40;` : ''}"
           onclick="selectAnalyticsCategory('${c.key}')">
        <div class="cat-matrix-header">
          <div class="cat-matrix-title-row">
            <span class="cat-matrix-icon">${c.icon}</span>
            <span class="cat-matrix-title">${c.title}</span>
          </div>
          <div class="cat-matrix-pct">${pct}%</div>
        </div>

        <div class="cat-matrix-meter">
          <div class="cat-matrix-fill" style="width: ${pct}%;"></div>
        </div>

        <div class="cat-matrix-stats-row">
          <span>${done} Completed</span>
          <span>${total} Total Assigned</span>
        </div>
      </div>
    `;
  }).join('');
}

window.selectAnalyticsCategory = function(catKey) {
  activeAnalyticsCategory = catKey || 'ALL';
  if (analyticsCategoryPills) {
    analyticsCategoryPills.querySelectorAll('.cat-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.cat === activeAnalyticsCategory);
    });
  }
  if (catKey === 'Finance') {
    openFinancePage('analytics');
    return;
  }
  renderAnalyticsIntelligence();
};

// Event Listeners
if (backToDashboardFromAnalytics) {
  backToDashboardFromAnalytics.addEventListener('click', showDashboard);
}
if (btnRefreshAnalytics) {
  btnRefreshAnalytics.addEventListener('click', () => {
    showToast('Refreshing live intelligence...');
    loadComprehensiveAnalytics();
  });
}
if (sidebarAnalyticsBtn) {
  sidebarAnalyticsBtn.addEventListener('click', () => openAnalyticsPage());
}

window.selectAnalyticsHorizon = function(horizonKey) {
  activeAnalyticsHorizon = horizonKey || 'overview';
  if (analyticsHorizonTabs) {
    analyticsHorizonTabs.querySelectorAll('.horizon-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.horizon === activeAnalyticsHorizon);
    });
  }
  renderAnalyticsIntelligence();
};

// =============================================================================
// FINANCIAL ANALYTICS & MULTI-HORIZON CHARTS CONTROLLER
// =============================================================================

let financeViewMode = 'ledger'; // 'ledger' | 'analytics'
let financeAnalyticsData = null;
let activeFinHorizon = 'overview'; // 'overview' | 'weekly' | 'monthly' | 'yearly'

let finChartInstances = {
  flow: null,
  income: null,
  expense: null,
  rhythm: null,
  cumulative: null,
};

function destroyFinChart(name) {
  if (finChartInstances[name]) {
    try { finChartInstances[name].destroy(); } catch (_) {}
    finChartInstances[name] = null;
  }
}

function destroyAllFinCharts() {
  Object.keys(finChartInstances).forEach(destroyFinChart);
}

const btnFinViewLedger     = document.getElementById('btnFinViewLedger');
const btnFinViewAnalytics  = document.getElementById('btnFinViewAnalytics');
const finLedgerViewWrap    = document.getElementById('finLedgerViewWrap');
const finAnalyticsViewWrap = document.getElementById('finAnalyticsViewWrap');
const finHorizonTabs       = document.getElementById('finHorizonTabs');
const finKpiGrid           = document.getElementById('finKpiGrid');
const finFlowChartTitle    = document.getElementById('finFlowChartTitle');
const finFlowChartSub      = document.getElementById('finFlowChartSub');
const finFlowChartBadge    = document.getElementById('finFlowChartBadge');
const finStreamsMatrixGrid = document.getElementById('finStreamsMatrixGrid');

function switchFinanceView(viewMode) {
  financeViewMode = viewMode;
  if (btnFinViewLedger) btnFinViewLedger.classList.toggle('active', viewMode === 'ledger');
  if (btnFinViewAnalytics) btnFinViewAnalytics.classList.toggle('active', viewMode === 'analytics');

  if (finLedgerViewWrap) finLedgerViewWrap.hidden = (viewMode !== 'ledger');
  if (finAnalyticsViewWrap) finAnalyticsViewWrap.hidden = (viewMode !== 'analytics');

  if (viewMode === 'analytics') {
    loadFinanceAnalytics();
  } else {
    loadFinancePage();
  }
}

if (btnFinViewLedger) {
  btnFinViewLedger.addEventListener('click', () => switchFinanceView('ledger'));
}
if (btnFinViewAnalytics) {
  btnFinViewAnalytics.addEventListener('click', () => switchFinanceView('analytics'));
}

async function loadFinanceAnalytics() {
  if (finKpiGrid) {
    finKpiGrid.innerHTML = `
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
      <div class="analytics-kpi-card skeleton-block" style="height: 100px;"></div>
    `;
  }

  try {
    const res = await fetch('/api/finance/analytics');
    if (!res.ok) throw new Error('Network failed');
    financeAnalyticsData = await res.json();
    renderFinanceAnalyticsIntelligence();
  } catch (err) {
    console.error('Finance analytics error:', err);
    showToast('Could not load financial analytics. Please try again.');
  }
}

function renderFinanceAnalyticsIntelligence() {
  if (!financeAnalyticsData || !financeAnalyticsData.overview) return;

  renderFinanceKpiScorecards();
  renderFinanceCharts();
  renderFinanceStreamsMatrix();
}

function renderFinanceKpiScorecards() {
  if (!finKpiGrid || !financeAnalyticsData) return;
  const { overview } = financeAnalyticsData;

  let inc = 0;
  let exp = 0;
  let net = 0;
  let rate = 0;
  let horizonLabel = 'All-Time';

  if (activeFinHorizon === 'weekly') {
    inc = overview.weekly.income;
    exp = overview.weekly.expenses;
    net = overview.weekly.net;
    rate = overview.weekly.savingsRatePct;
    horizonLabel = 'This Week (Sat–Fri)';
  } else if (activeFinHorizon === 'monthly') {
    const currM = overview.monthly.last6Months[overview.monthly.last6Months.length - 1];
    inc = currM ? currM.income : 0;
    exp = currM ? currM.expenses : 0;
    net = currM ? currM.net : 0;
    rate = currM ? currM.savingsRatePct : 0;
    horizonLabel = `This Month (${currM ? currM.monthName : ''})`;
  } else if (activeFinHorizon === 'yearly') {
    inc = overview.yearly.months.reduce((s, m) => s + m.income, 0);
    exp = overview.yearly.months.reduce((s, m) => s + m.expenses, 0);
    net = inc - exp;
    rate = inc > 0 ? Math.round((net / inc) * 100) : 0;
    horizonLabel = `Year ${overview.yearly.year} (Jan–Dec)`;
  } else {
    inc = overview.totalIncome;
    exp = overview.totalExpenses;
    net = overview.netSavings;
    rate = overview.savingsRatePct;
    horizonLabel = 'All Horizons Combined';
  }

  finKpiGrid.innerHTML = `
    <div class="analytics-kpi-card" style="--kpi-glow: #22c55e;">
      <div class="kpi-card-label">
        <span>Total Inflows / Revenue</span>
        <span class="kpi-badge-pill" style="color:#22c55e;border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.1);">INCOME</span>
      </div>
      <div class="kpi-card-value" style="color:#22c55e;">${fmtMoney(inc)}</div>
      <div class="kpi-card-sub">${escapeHtml(horizonLabel)}</div>
    </div>

    <div class="analytics-kpi-card" style="--kpi-glow: #ef4444;">
      <div class="kpi-card-label">
        <span>Total Outflows / Spend</span>
        <span class="kpi-badge-pill" style="color:#ef4444;border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.1);">EXPENSES</span>
      </div>
      <div class="kpi-card-value" style="color:#ef4444;">${fmtMoney(exp)}</div>
      <div class="kpi-card-sub">Recorded expenditure</div>
    </div>

    <div class="analytics-kpi-card" style="--kpi-glow: #38bdf8;">
      <div class="kpi-card-label">
        <span>Net Savings / Surplus</span>
        <span class="kpi-badge-pill" style="color:#38bdf8;border-color:rgba(56,189,248,0.3);background:rgba(56,189,248,0.1);">SURPLUS</span>
      </div>
      <div class="kpi-card-value" style="color:#38bdf8;">${fmtMoney(net)}</div>
      <div class="kpi-card-sub">Retained capital</div>
    </div>

    <div class="analytics-kpi-card" style="--kpi-glow: #eab308;">
      <div class="kpi-card-label">
        <span>Savings &amp; Net Rate</span>
        <span class="kpi-badge-pill" style="color:#eab308;border-color:rgba(234,179,8,0.3);background:rgba(234,179,8,0.1);">EFFICIENCY</span>
      </div>
      <div class="kpi-card-value" style="color:#eab308;">${rate}%</div>
      <div class="kpi-card-sub">Net savings efficiency</div>
    </div>
  `;
}

function renderFinanceCharts() {
  if (typeof Chart === 'undefined') return;

  renderFinFlowTrajectoryChart();
  renderFinIncomeDoughnut();
  renderFinExpenseDoughnut();
  renderFinRhythmRadarChart();
  renderFinCumulativeSpline();
}

function renderFinFlowTrajectoryChart() {
  const canvas = document.getElementById('canvasFinFlowChart');
  if (!canvas) return;
  destroyFinChart('flow');

  const { overview } = financeAnalyticsData;
  let labels = [];
  let incomeData = [];
  let expenseData = [];
  let netData = [];
  let badgeText = '';

  if (activeFinHorizon === 'weekly') {
    labels = overview.weekly.days.map(d => `${d.dayLabel} (${d.date.slice(5)})`);
    incomeData = overview.weekly.days.map(d => d.income);
    expenseData = overview.weekly.days.map(d => d.expenses);
    netData = overview.weekly.days.map(d => d.net);
    badgeText = 'Weekly 7-Day Flow';
    if (finFlowChartTitle) finFlowChartTitle.textContent = '📈 Current Week Daily Cash Flow';
    if (finFlowChartSub) finFlowChartSub.textContent = 'Saturday to Friday daily inflows, expenses, and net surplus';
  } else if (activeFinHorizon === 'monthly') {
    labels = overview.monthly.last6Months.map(m => m.label);
    incomeData = overview.monthly.last6Months.map(m => m.income);
    expenseData = overview.monthly.last6Months.map(m => m.expenses);
    netData = overview.monthly.last6Months.map(m => m.net);
    badgeText = 'Monthly (Last 6 Months)';
    if (finFlowChartTitle) finFlowChartTitle.textContent = '🗓️ Month-by-Month Financial Performance';
    if (finFlowChartSub) finFlowChartSub.textContent = 'Monthly income vs expenses and net savings rate over 6 months';
  } else if (activeFinHorizon === 'yearly') {
    labels = overview.yearly.months.map(m => m.shortName);
    incomeData = overview.yearly.months.map(m => m.income);
    expenseData = overview.yearly.months.map(m => m.expenses);
    netData = overview.yearly.months.map(m => m.net);
    badgeText = `Year ${overview.yearly.year} (12 Months)`;
    if (finFlowChartTitle) finFlowChartTitle.textContent = `📆 Annual Financial Trajectory (${overview.yearly.year})`;
    if (finFlowChartSub) finFlowChartSub.textContent = '12-month January to December revenue and expenditure';
  } else {
    labels = overview.weekly.last4Weeks.map(w => `${w.label} (${w.dateRange})`);
    incomeData = overview.weekly.last4Weeks.map(w => w.income);
    expenseData = overview.weekly.last4Weeks.map(w => w.expenses);
    netData = overview.weekly.last4Weeks.map(w => w.net);
    badgeText = '4-Week Rolling Trend';
    if (finFlowChartTitle) finFlowChartTitle.textContent = '📈 Rolling Multi-Week Financial Rhythm';
    if (finFlowChartSub) finFlowChartSub.textContent = 'Rolling 4-week income, expenses, and net cash trajectory';
  }

  if (finFlowChartBadge) finFlowChartBadge.textContent = badgeText;

  const ctx = canvas.getContext('2d');
  const gradInc = ctx.createLinearGradient(0, 0, 0, 260);
  gradInc.addColorStop(0, 'rgba(34, 197, 94, 0.85)');
  gradInc.addColorStop(1, 'rgba(34, 197, 94, 0.15)');

  const gradExp = ctx.createLinearGradient(0, 0, 0, 260);
  gradExp.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
  gradExp.addColorStop(1, 'rgba(239, 68, 68, 0.15)');

  finChartInstances.flow = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Net Surplus (E£)',
          data: netData,
          borderColor: '#38bdf8',
          borderWidth: 2.5,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#fff',
          pointRadius: 4,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: 'Income (E£)',
          data: incomeData,
          backgroundColor: gradInc,
          borderColor: '#22c55e',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 32,
          yAxisID: 'y'
        },
        {
          label: 'Expenses (E£)',
          data: expenseData,
          backgroundColor: gradExp,
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 32,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', color: '#e2e8f0' }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${fmtMoney(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: '#94a3b8',
            callback: (v) => 'E£' + Number(v).toLocaleString()
          }
        }
      }
    }
  });
}

function renderFinIncomeDoughnut() {
  const canvas = document.getElementById('canvasFinIncomeChart');
  if (!canvas) return;
  destroyFinChart('income');

  const { breakdowns } = financeAnalyticsData;
  const sources = breakdowns.incomeBySource || [];
  const labels = sources.length ? sources.map(s => s.name) : ['White Plus Clinic', 'Crystal Clinic', 'Trading Dividends'];
  const data = sources.length ? sources.map(s => s.total || 0) : [1, 1, 1];

  const colors = ['#22c55e', '#38bdf8', '#eab308', '#a855f7', '#06b6d4', '#ec4899'];

  finChartInstances.income = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: data.every(v => v === 0) ? [1, 1, 1] : data,
        backgroundColor: colors,
        borderColor: '#0f121a',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', color: '#cbd5e1', padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${fmtMoney(ctx.raw)}`
          }
        }
      }
    }
  });
}

function renderFinExpenseDoughnut() {
  const canvas = document.getElementById('canvasFinExpenseChart');
  if (!canvas) return;
  destroyFinChart('expense');

  const { breakdowns } = financeAnalyticsData;
  const categories = breakdowns.expensesByCategory || [];
  const labels = categories.length ? categories.map(c => c.name) : ['Housing / Clinic', 'Equipment & Materials', 'Personal', 'Food'];
  const data = categories.length ? categories.map(c => c.total || 0) : [1, 1, 1, 1];

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

  finChartInstances.expense = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: data.every(v => v === 0) ? [1, 1, 1, 1] : data,
        backgroundColor: colors,
        borderColor: '#0f121a',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', color: '#cbd5e1', padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${fmtMoney(ctx.raw)}`
          }
        }
      }
    }
  });
}

function renderFinRhythmRadarChart() {
  const canvas = document.getElementById('canvasFinRhythmChart');
  if (!canvas) return;
  destroyFinChart('rhythm');

  const { breakdowns } = financeAnalyticsData;
  const dist = breakdowns.spendingDayDist || {};
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const shortDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const incomePoints = days.map(d => dist[d]?.income || 0);
  const expensePoints = days.map(d => dist[d]?.expenses || 0);

  finChartInstances.rhythm = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: shortDays,
      datasets: [
        {
          label: 'Inflows',
          data: incomePoints,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: '#22c55e',
          borderWidth: 2,
          pointBackgroundColor: '#22c55e'
        },
        {
          label: 'Outflows',
          data: expensePoints,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#ef4444',
          borderWidth: 2,
          pointBackgroundColor: '#ef4444'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          pointLabels: { color: '#cbd5e1', font: { weight: 'bold', size: 11 } },
          ticks: { backdropColor: 'transparent', color: '#64748b' }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 10, color: '#e2e8f0', usePointStyle: true }
        }
      }
    }
  });
}

function renderFinCumulativeSpline() {
  const canvas = document.getElementById('canvasFinCumulativeChart');
  if (!canvas) return;
  destroyFinChart('cumulative');

  const { overview } = financeAnalyticsData;
  const months = overview.yearly.months || [];
  const labels = months.map(m => m.name);
  const data = months.map(m => m.cumulativeSavings);

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  finChartInstances.cumulative = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Cumulative Net Savings Trajectory (E£)',
        data,
        borderColor: '#38bdf8',
        borderWidth: 2.5,
        backgroundColor: grad,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: '#94a3b8',
            callback: (v) => 'E£' + Number(v).toLocaleString()
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Cumulative Savings: ${fmtMoney(ctx.raw)}`
          }
        }
      }
    }
  });
}

function renderFinanceStreamsMatrix() {
  if (!finStreamsMatrixGrid || !financeAnalyticsData) return;
  const { breakdowns, overview } = financeAnalyticsData;

  const incomeSources = breakdowns.incomeBySource || [];
  const expenseCategories = breakdowns.expensesByCategory || [];

  const streamCards = [];

  // Income Sources
  incomeSources.forEach(s => {
    const pct = overview.totalIncome > 0 ? Math.round((s.total / overview.totalIncome) * 100) : 0;
    streamCards.push(`
      <div class="cat-matrix-card" style="--matrix-card-color: #22c55e;">
        <div class="cat-matrix-header">
          <div class="cat-matrix-title-row">
            <span class="cat-matrix-icon">💵</span>
            <span class="cat-matrix-title">${escapeHtml(s.name)}</span>
          </div>
          <div class="cat-matrix-pct">${fmtMoney(s.total)}</div>
        </div>
        <div class="cat-matrix-meter">
          <div class="cat-matrix-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="cat-matrix-stats-row">
          <span>Income Stream</span>
          <span>${pct}% of Total Revenue</span>
        </div>
      </div>
    `);
  });

  // Expense Categories
  expenseCategories.forEach(c => {
    const pct = overview.totalExpenses > 0 ? Math.round((c.total / overview.totalExpenses) * 100) : 0;
    streamCards.push(`
      <div class="cat-matrix-card" style="--matrix-card-color: #ef4444;">
        <div class="cat-matrix-header">
          <div class="cat-matrix-title-row">
            <span class="cat-matrix-icon">💳</span>
            <span class="cat-matrix-title">${escapeHtml(c.name)}</span>
          </div>
          <div class="cat-matrix-pct">${fmtMoney(c.total)}</div>
        </div>
        <div class="cat-matrix-meter">
          <div class="cat-matrix-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="cat-matrix-stats-row">
          <span>Expense Outflow</span>
          <span>${pct}% of Total Spend</span>
        </div>
      </div>
    `);
  });

  if (!streamCards.length) {
    finStreamsMatrixGrid.innerHTML = `
      <div class="cat-matrix-card" style="--matrix-card-color: #38bdf8;">
        <div class="cat-matrix-header">
          <div class="cat-matrix-title">No detailed categorical entries yet for this period.</div>
        </div>
        <p style="font-size:12.5px;color:var(--ink-soft);margin-top:6px;">Add income and expense entries via the Monthly Budget ledger tab to see stream shares.</p>
      </div>
    `;
  } else {
    finStreamsMatrixGrid.innerHTML = streamCards.join('');
  }
}

// =============================================================================
// NOTIFICATION & REMINDER INTELLIGENCE ENGINE (Tasks & Reports)
// =============================================================================

const NOTIF_SETTINGS_KEY = 'dashboard_notif_settings';
const NOTIF_HISTORY_KEY  = 'dashboard_notif_history';
const NOTIF_TRIGGERED_KEY= 'dashboard_notif_triggered_dates';

let notifSettings = {
  desktopEnabled: true,
  audioChime: true,
  morningBriefing: true,
  morningTime: '08:30',
  eveningReport: true,
  eveningTime: '21:00',
  taskReminders: true,
  weeklyDigest: true,
  monthlyFinance: true,
};

let notifHistory = [];
let notifFilter = 'all'; // 'all' | 'tasks' | 'reports' | 'routines'

// DOM Elements
const btnNotificationBell              = document.getElementById('btnNotificationBell');
const notificationBadge                = document.getElementById('notificationBadge');
const btnHeaderNotificationBell        = document.getElementById('btnHeaderNotificationBell');
const headerNotificationBadge          = document.getElementById('headerNotificationBadge');
const btnHeaderNotificationSettings    = document.getElementById('btnHeaderNotificationSettings');
const notificationStatusDot            = document.getElementById('notificationStatusDot');
const notificationStatusText           = document.getElementById('notificationStatusText');
const notificationStatusCapsule        = document.getElementById('notificationStatusCapsule');
const btnOpenNotificationSettings      = document.getElementById('btnOpenNotificationSettings');
const notificationCenterModalBackdrop  = document.getElementById('notificationCenterModalBackdrop');
const btnCloseNotificationCenter       = document.getElementById('btnCloseNotificationCenter');
const notificationPermissionCard       = document.getElementById('notificationPermissionCard');
const btnRequestNotificationPermission = document.getElementById('btnRequestNotificationPermission');
const notificationFilterPills          = document.getElementById('notificationFilterPills');
const btnMarkAllNotifsRead             = document.getElementById('btnMarkAllNotifsRead');
const btnClearAllNotifs                = document.getElementById('btnClearAllNotifs');
const btnOpenNotifSettingsFromCenter   = document.getElementById('btnOpenNotifSettingsFromCenter');
const notificationItemsList            = document.getElementById('notificationItemsList');

const notificationSettingsModalBackdrop= document.getElementById('notificationSettingsModalBackdrop');
const btnCloseNotificationSettings     = document.getElementById('btnCloseNotificationSettings');
const settingDesktopNotifs             = document.getElementById('settingDesktopNotifs');
const settingAudioChime                = document.getElementById('settingAudioChime');
const settingMorningBriefing           = document.getElementById('settingMorningBriefing');
const settingMorningTime               = document.getElementById('settingMorningTime');
const settingEveningReport             = document.getElementById('settingEveningReport');
const settingEveningTime               = document.getElementById('settingEveningTime');
const settingTaskReminders             = document.getElementById('settingTaskReminders');
const settingWeeklyDigest              = document.getElementById('settingWeeklyDigest');
const settingMonthlyFinance            = document.getElementById('settingMonthlyFinance');
const btnTestNotification              = document.getElementById('btnTestNotification');
const btnSaveNotificationSettings      = document.getElementById('btnSaveNotificationSettings');

// Load stored settings & history
function loadNotificationStorage() {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
    if (raw) notifSettings = { ...notifSettings, ...JSON.parse(raw) };
  } catch (_) {}

  try {
    const rawH = localStorage.getItem(NOTIF_HISTORY_KEY);
    if (rawH) notifHistory = JSON.parse(rawH);
  } catch (_) {}

  updateNotificationStatusUI();
  updateNotificationBadge();
}

function saveNotificationSettingsToStorage() {
  try {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(notifSettings));
  } catch (_) {}
}

function saveNotificationHistoryToStorage() {
  try {
    localStorage.setItem(NOTIF_HISTORY_KEY, JSON.stringify(notifHistory.slice(0, 50))); // Keep last 50
  } catch (_) {}
}

// Pleasant Audio Synthesizer (Crystal Chime)
function playNotificationChime() {
  if (!notifSettings.audioChime) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.log('Audio chime error:', err);
  }
}

// Permission Manager
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications are not supported by this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    updateNotificationStatusUI();
    if (permission === 'granted') {
      showToast('🔔 Reminders & Notifications Enabled!');
      playNotificationChime();
      dispatchNotification({
        type: 'reports',
        title: '🔔 Reminders Activated',
        message: 'You will now receive timely alerts for your daily clinic shifts, tasks, workouts & progress digests!',
        linkCategory: 'Analytics & Progress'
      });
      return true;
    } else if (permission === 'denied') {
      showToast('Notifications blocked in browser settings.');
      return false;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

function updateNotificationStatusUI() {
  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  const isGranted = (perm === 'granted');

  if (notificationStatusDot) {
    notificationStatusDot.classList.toggle('active', isGranted && notifSettings.desktopEnabled);
  }
  if (notificationStatusText) {
    if (perm === 'granted') {
      notificationStatusText.textContent = notifSettings.desktopEnabled ? 'Reminders: ON' : 'Reminders: PAUSED';
    } else if (perm === 'denied') {
      notificationStatusText.textContent = 'Reminders: BLOCKED';
    } else {
      notificationStatusText.textContent = 'Reminders: OFF';
    }
  }
  if (notificationPermissionCard) {
    notificationPermissionCard.style.display = isGranted ? 'none' : 'flex';
  }
  if (settingDesktopNotifs) {
    settingDesktopNotifs.checked = isGranted && notifSettings.desktopEnabled;
    settingDesktopNotifs.disabled = (perm === 'denied');
  }
}

function updateNotificationBadge() {
  const unreadCount = notifHistory.filter(n => !n.read).length;
  const badgeText = unreadCount > 9 ? '9+' : unreadCount;
  const displayVal = unreadCount > 0 ? 'flex' : 'none';

  if (notificationBadge) {
    notificationBadge.textContent = badgeText;
    notificationBadge.style.display = displayVal;
  }
  if (headerNotificationBadge) {
    headerNotificationBadge.textContent = badgeText;
    headerNotificationBadge.style.display = displayVal;
  }
}

// Dispatcher Function
function dispatchNotification({ type = 'tasks', title, message, linkCategory = null }) {
  const notifItem = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type,
    title,
    message,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: toISODate(new Date()),
    read: false,
    linkCategory
  };

  notifHistory.unshift(notifItem);
  saveNotificationHistoryToStorage();
  updateNotificationBadge();
  renderNotificationItems();

  // Play audio chime
  playNotificationChime();

  // Native Browser Notification
  if ('Notification' in window && Notification.permission === 'granted' && notifSettings.desktopEnabled) {
    try {
      const nativeNotif = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notifItem.id
      });
      nativeNotif.onclick = () => {
        window.focus();
        if (linkCategory) openPage(linkCategory);
        nativeNotif.close();
      };
    } catch (_) {}
  }

  // Also trigger in-app toast
  showToast(`${title}: ${message}`);
}

// Render Notification Center Items
function renderNotificationItems() {
  if (!notificationItemsList) return;

  let items = notifHistory;
  if (notifFilter !== 'all') {
    items = items.filter(n => n.type === notifFilter);
  }

  if (!items.length) {
    notificationItemsList.innerHTML = `
      <div class="notif-empty-state">
        <div class="notif-empty-icon">🔔</div>
        <p>No ${notifFilter === 'all' ? '' : notifFilter} notifications yet.</p>
        <p style="font-size: 11.5px; margin-top: 4px;">Automated task reminders and daily reports will appear here.</p>
      </div>
    `;
    return;
  }

  const icons = {
    tasks: '💼',
    reports: '📊',
    routines: '🌅',
    finance: '💰',
    workouts: '🏋️'
  };

  notificationItemsList.innerHTML = items.map(n => {
    const icon = icons[n.type] || '🔔';
    return `
      <div class="notif-item-card ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
        <span class="notif-item-icon">${icon}</span>
        <div class="notif-item-content">
          <div class="notif-item-title-row">
            <span class="notif-item-title">${escapeHtml(n.title)}</span>
            <span class="notif-item-time">${n.time}</span>
          </div>
          <p class="notif-item-msg">${escapeHtml(n.message)}</p>
          <div class="notif-item-actions">
            ${n.linkCategory ? `<button type="button" class="btn-notif-link" onclick="handleNotifNavigate('${n.id}', '${escapeHtml(n.linkCategory)}')">Open ${escapeHtml(n.linkCategory)} &rarr;</button>` : ''}
            <button type="button" class="btn-notif-dismiss" onclick="handleDismissNotif('${n.id}')">Dismiss</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.handleNotifNavigate = function(notifId, category) {
  const item = notifHistory.find(n => n.id === notifId);
  if (item) {
    item.read = true;
    saveNotificationHistoryToStorage();
    updateNotificationBadge();
  }
  if (notificationCenterModalBackdrop) notificationCenterModalBackdrop.hidden = true;
  openPage(category);
};

window.handleDismissNotif = function(notifId) {
  notifHistory = notifHistory.filter(n => n.id !== notifId);
  saveNotificationHistoryToStorage();
  updateNotificationBadge();
  renderNotificationItems();
};

// Scheduler & Periodic Reminder Check
function checkAutomatedReminders() {
  const now = new Date();
  const todayStr = toISODate(now);
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];

  let triggered = {};
  try {
    const raw = localStorage.getItem(NOTIF_TRIGGERED_KEY);
    if (raw) triggered = JSON.parse(raw);
  } catch (_) {}

  if (!triggered[todayStr]) triggered[todayStr] = {};

  // 1. Morning Briefing
  if (notifSettings.morningBriefing && !triggered[todayStr].morningBriefing) {
    if (currentTime >= notifSettings.morningTime) {
      triggered[todayStr].morningBriefing = true;
      const pendingCount = (allTasks || []).filter(t => !t.done).length;
      dispatchNotification({
        type: 'routines',
        title: '🌅 Good Morning Briefing',
        message: `Today is ${dayName}. You have ${pendingCount} active items scheduled on your board. Have a productive day!`,
        linkCategory: 'Work'
      });
    }
  }

  // 2. Evening Progress Report
  if (notifSettings.eveningReport && !triggered[todayStr].eveningReport) {
    if (currentTime >= notifSettings.eveningTime) {
      triggered[todayStr].eveningReport = true;
      const total = (allTasks || []).length;
      const done = (allTasks || []).filter(t => t.done).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 100;
      dispatchNotification({
        type: 'reports',
        title: '🌙 Daily Wrap-up & Progress Report',
        message: `Daily Completion: ${pct}% (${done}/${total} tasks finished). Click to view your full analytics & log your evening routine!`,
        linkCategory: 'Analytics & Progress'
      });
    }
  }

  // 3. Weekly Digest (Friday evening)
  if (notifSettings.weeklyDigest && dayName === 'Friday' && !triggered[todayStr].weeklyDigest) {
    if (currentTime >= '18:00') {
      triggered[todayStr].weeklyDigest = true;
      dispatchNotification({
        type: 'reports',
        title: '📊 Weekly Review & Performance Digest',
        message: 'Your weekly performance and execution trajectory is ready in the Analytics Hub!',
        linkCategory: 'Analytics & Progress'
      });
    }
  }

  // 4. Monthly Finance Digest (1st of month)
  if (notifSettings.monthlyFinance && now.getDate() === 1 && !triggered[todayStr].monthlyFinance) {
    if (currentTime >= '09:00') {
      triggered[todayStr].monthlyFinance = true;
      dispatchNotification({
        type: 'finance',
        title: '💰 Monthly Finance & Wealth Digest',
        message: 'New month started! Review your savings rate, budget allocations, and net worth progress.',
        linkCategory: 'Finance'
      });
    }
  }

  try {
    localStorage.setItem(NOTIF_TRIGGERED_KEY, JSON.stringify(triggered));
  } catch (_) {}
}

// Event Listeners for Notification Modals & Settings
if (btnNotificationBell) {
  btnNotificationBell.addEventListener('click', () => {
    renderNotificationItems();
    if (notificationCenterModalBackdrop) notificationCenterModalBackdrop.hidden = false;
  });
}

if (btnHeaderNotificationBell) {
  btnHeaderNotificationBell.addEventListener('click', () => {
    renderNotificationItems();
    if (notificationCenterModalBackdrop) notificationCenterModalBackdrop.hidden = false;
  });
}

if (btnHeaderNotificationSettings) {
  btnHeaderNotificationSettings.addEventListener('click', openNotificationSettingsModal);
}

if (notificationStatusCapsule) {
  notificationStatusCapsule.addEventListener('click', () => {
    if (('Notification' in window) && Notification.permission !== 'granted') {
      requestNotificationPermission();
    } else {
      if (notificationCenterModalBackdrop) notificationCenterModalBackdrop.hidden = false;
    }
  });
}

if (btnCloseNotificationCenter) {
  btnCloseNotificationCenter.addEventListener('click', () => {
    if (notificationCenterModalBackdrop) notificationCenterModalBackdrop.hidden = true;
  });
}

if (btnRequestNotificationPermission) {
  btnRequestNotificationPermission.addEventListener('click', () => {
    requestNotificationPermission();
  });
}

if (btnMarkAllNotifsRead) {
  btnMarkAllNotifsRead.addEventListener('click', () => {
    notifHistory.forEach(n => { n.read = true; });
    saveNotificationHistoryToStorage();
    updateNotificationBadge();
    renderNotificationItems();
    showToast('All notifications marked as read.');
  });
}

if (btnClearAllNotifs) {
  btnClearAllNotifs.addEventListener('click', () => {
    notifHistory = [];
    saveNotificationHistoryToStorage();
    updateNotificationBadge();
    renderNotificationItems();
    showToast('Notification history cleared.');
  });
}

if (notificationFilterPills) {
  notificationFilterPills.querySelectorAll('.notif-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      notificationFilterPills.querySelectorAll('.notif-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      notifFilter = pill.dataset.filter || 'all';
      renderNotificationItems();
    });
  });
}

function openNotificationSettingsModal() {
  if (notificationCenterModalBackdrop) notificationCenterModalBackdrop.hidden = true;
  if (settingDesktopNotifs) settingDesktopNotifs.checked = notifSettings.desktopEnabled && ('Notification' in window) && Notification.permission === 'granted';
  if (settingAudioChime) settingAudioChime.checked = notifSettings.audioChime;
  if (settingMorningBriefing) settingMorningBriefing.checked = notifSettings.morningBriefing;
  if (settingMorningTime) settingMorningTime.value = notifSettings.morningTime || '08:30';
  if (settingEveningReport) settingEveningReport.checked = notifSettings.eveningReport;
  if (settingEveningTime) settingEveningTime.value = notifSettings.eveningTime || '21:00';
  if (settingTaskReminders) settingTaskReminders.checked = notifSettings.taskReminders;
  if (settingWeeklyDigest) settingWeeklyDigest.checked = notifSettings.weeklyDigest;
  if (settingMonthlyFinance) settingMonthlyFinance.checked = notifSettings.monthlyFinance;

  if (notificationSettingsModalBackdrop) notificationSettingsModalBackdrop.hidden = false;
}

if (btnOpenNotificationSettings) {
  btnOpenNotificationSettings.addEventListener('click', openNotificationSettingsModal);
}
if (btnOpenNotifSettingsFromCenter) {
  btnOpenNotifSettingsFromCenter.addEventListener('click', openNotificationSettingsModal);
}
if (btnCloseNotificationSettings) {
  btnCloseNotificationSettings.addEventListener('click', () => {
    if (notificationSettingsModalBackdrop) notificationSettingsModalBackdrop.hidden = true;
  });
}

if (btnSaveNotificationSettings) {
  btnSaveNotificationSettings.addEventListener('click', () => {
    notifSettings.desktopEnabled = settingDesktopNotifs.checked;
    notifSettings.audioChime = settingAudioChime.checked;
    notifSettings.morningBriefing = settingMorningBriefing.checked;
    notifSettings.morningTime = settingMorningTime.value || '08:30';
    notifSettings.eveningReport = settingEveningReport.checked;
    notifSettings.eveningTime = settingEveningTime.value || '21:00';
    notifSettings.taskReminders = settingTaskReminders.checked;
    notifSettings.weeklyDigest = settingWeeklyDigest.checked;
    notifSettings.monthlyFinance = settingMonthlyFinance.checked;

    saveNotificationSettingsToStorage();
    updateNotificationStatusUI();

    if (notificationSettingsModalBackdrop) notificationSettingsModalBackdrop.hidden = true;
    showToast('Notification preferences saved.');
  });
}

if (btnTestNotification) {
  btnTestNotification.addEventListener('click', async () => {
    if (('Notification' in window) && Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    dispatchNotification({
      type: 'reports',
      title: '🧪 Test Reminder Alert',
      message: 'Everything is set up! Tasks, clinic shifts & progress digests will remind you right on time.',
      linkCategory: 'Analytics & Progress'
    });
  });
}

// Background Worker for Reminders
setInterval(checkAutomatedReminders, 30 * 1000);
loadNotificationStorage();

// =============================================================================
// 🧭 LIFE MASTER ROADMAP & VISION SPACE
// =============================================================================

let roadmapMilestones = [];
let activeRoadmapPillar = 'All';

const roadmapSection          = document.getElementById('roadmapSection');
const backToDashboardFromRoadmap = document.getElementById('backToDashboardFromRoadmap');
const btnOpenNewMilestoneModal  = document.getElementById('btnOpenNewMilestoneModal');
const roadmapPillarPills       = document.getElementById('roadmapPillarPills');
const roadmapPhasesContainer   = document.getElementById('roadmapPhasesContainer');

const rmTotalCount             = document.getElementById('rmTotalCount');
const rmInProgressCount        = document.getElementById('rmInProgressCount');
const rmCompletedCount         = document.getElementById('rmCompletedCount');
const rmGlobalProgressVal      = document.getElementById('rmGlobalProgressVal');

const roadmapModalBackdrop     = document.getElementById('roadmapModalBackdrop');
const roadmapMilestoneForm     = document.getElementById('roadmapMilestoneForm');
const btnCancelRoadmapModal    = document.getElementById('btnCancelRoadmapModal');
const roadmapModalTitle        = document.getElementById('roadmapModalTitle');
const roadmapMilestoneId       = document.getElementById('roadmapMilestoneId');
const roadmapPillarSelect      = document.getElementById('roadmapPillarSelect');
const roadmapPhaseSelect       = document.getElementById('roadmapPhaseSelect');
const roadmapTitleInput        = document.getElementById('roadmapTitleInput');
const roadmapHorizonInput      = document.getElementById('roadmapHorizonInput');
const roadmapStatusSelect      = document.getElementById('roadmapStatusSelect');
const roadmapStrategyInput     = document.getElementById('roadmapStrategyInput');
const roadmapKeyResultsInput   = document.getElementById('roadmapKeyResultsInput');

function initRoadmapEvents() {
  if (backToDashboardFromRoadmap) {
    backToDashboardFromRoadmap.addEventListener('click', showDashboard);
  }

  if (roadmapPillarPills) {
    roadmapPillarPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.rm-pill');
      if (!btn) return;
      roadmapPillarPills.querySelectorAll('.rm-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRoadmapPillar = btn.dataset.pillar;
      renderRoadmapPhases();
    });
  }

  if (btnOpenNewMilestoneModal) {
    btnOpenNewMilestoneModal.addEventListener('click', () => openRoadmapModal());
  }

  if (btnCancelRoadmapModal) {
    btnCancelRoadmapModal.addEventListener('click', closeRoadmapModal);
  }

  if (roadmapMilestoneForm) {
    roadmapMilestoneForm.addEventListener('submit', handleSaveRoadmapMilestone);
  }
}

async function openRoadmapPage() {
  hideAllTopLevelSections();
  if (roadmapSection) roadmapSection.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await loadRoadmap();
}

async function loadRoadmap() {
  try {
    const res = await fetch('/api/roadmap');
    if (!res.ok) throw new Error('Failed to fetch roadmap');
    roadmapMilestones = await res.json();
    updateRoadmapScorecards();
    renderRoadmapPhases();
  } catch (err) {
    console.error('Error loading roadmap:', err);
    showToast('Could not load life roadmap.');
  }
}

function updateRoadmapScorecards() {
  const total = roadmapMilestones.length;
  const inProgress = roadmapMilestones.filter(m => m.status === 'in_progress').length;
  const completed = roadmapMilestones.filter(m => m.status === 'completed').length;
  
  let avgProgress = 0;
  if (total > 0) {
    const sum = roadmapMilestones.reduce((acc, m) => acc + (m.progressPct || 0), 0);
    avgProgress = Math.round(sum / total);
  }

  if (rmTotalCount) rmTotalCount.textContent = total;
  if (rmInProgressCount) rmInProgressCount.textContent = inProgress;
  if (rmCompletedCount) rmCompletedCount.textContent = completed;
  if (rmGlobalProgressVal) rmGlobalProgressVal.textContent = `${avgProgress}%`;
}

const ROADMAP_PHASES_ORDER = [
  'Phase 1: Foundation (Now)',
  'Phase 2: Acceleration (6-12M)',
  'Phase 3: Mastery & Scale (1-3Y)',
  'Phase 4: Freedom & Legacy (5Y+)'
];

const PILLAR_COLOR_MAP = {
  'Dental Career': '#38bdf8',
  'Trading & Markets': '#f59e0b',
  'Studies & Knowledge': '#c084fc',
  'Wealth & Freedom': '#10b981'
};

const PILLAR_ICON_MAP = {
  'Dental Career': '🦷',
  'Trading & Markets': '📈',
  'Studies & Knowledge': '📚',
  'Wealth & Freedom': '💎'
};

function renderRoadmapPhases() {
  if (!roadmapPhasesContainer) return;

  const filtered = roadmapMilestones.filter(m => {
    if (activeRoadmapPillar === 'All') return true;
    return m.pillar === activeRoadmapPillar;
  });

  if (filtered.length === 0) {
    roadmapPhasesContainer.innerHTML = `
      <div class="empty-roadmap-state">
        <div class="empty-icon">🧭</div>
        <h3>No milestones found for ${escapeHtml(activeRoadmapPillar)}</h3>
        <p>Set a new strategic target to begin mapping out your journey.</p>
        <button type="button" class="btn-primary" onclick="openRoadmapModal('${activeRoadmapPillar !== 'All' ? activeRoadmapPillar : 'Dental Career'}')">
          + Add First Milestone
        </button>
      </div>
    `;
    return;
  }

  // Group by Phase
  const html = ROADMAP_PHASES_ORDER.map(phaseTitle => {
    const phaseItems = filtered.filter(m => m.phase === phaseTitle);
    if (phaseItems.length === 0) return '';

    const phaseCompleted = phaseItems.filter(m => m.status === 'completed').length;
    const phaseTotal = phaseItems.length;
    const phasePct = Math.round((phaseCompleted / phaseTotal) * 100);

    return `
      <div class="roadmap-phase-card">
        <div class="phase-header">
          <div class="phase-header-left">
            <span class="phase-badge">${escapeHtml(phaseTitle)}</span>
            <span class="phase-count">${phaseCompleted}/${phaseTotal} Completed</span>
          </div>
          <div class="phase-progress-wrap">
            <div class="phase-progress-bar" style="width: ${phasePct}%;"></div>
          </div>
        </div>

        <div class="phase-milestones-grid">
          ${phaseItems.map(m => renderMilestoneCard(m)).join('')}
        </div>
      </div>
    `;
  }).join('');

  roadmapPhasesContainer.innerHTML = html;
}

function renderMilestoneCard(m) {
  const pillarColor = PILLAR_COLOR_MAP[m.pillar] || '#38bdf8';
  const pillarIcon = PILLAR_ICON_MAP[m.pillar] || '🎯';
  const statusLabel = m.status === 'completed' ? '✓ Achieved' : (m.status === 'in_progress' ? '● In Progress' : '🔒 Upcoming');
  const statusClass = m.status === 'completed' ? 'status-completed' : (m.status === 'in_progress' ? 'status-progress' : 'status-upcoming');

  const keyResultsHtml = Array.isArray(m.keyResults) && m.keyResults.length > 0 ? `
    <div class="rm-key-results-list">
      ${m.keyResults.map(kr => `
        <div class="rm-kr-item ${kr.done ? 'is-done' : ''}" onclick="toggleRoadmapKeyResult('${m.id}', '${kr.id}')">
          <span class="rm-kr-checkbox">${kr.done ? '✓' : ''}</span>
          <span class="rm-kr-title">${escapeHtml(kr.title)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const strategyHtml = m.actionStrategy ? `
    <div class="rm-strategy-box">
      <div class="rm-strat-icon">💡</div>
      <div class="rm-strat-text"><strong>Strategy:</strong> ${escapeHtml(m.actionStrategy)}</div>
    </div>
  ` : '';

  return `
    <div class="milestone-glass-card ${m.status === 'completed' ? 'milestone-completed' : ''}" style="--pillar-glow: ${pillarColor};">
      <div class="milestone-top-row">
        <span class="milestone-pillar-tag" style="background: color-mix(in srgb, ${pillarColor} 18%, transparent); color: ${pillarColor}; border-color: color-mix(in srgb, ${pillarColor} 40%, transparent);">
          <span>${pillarIcon}</span> ${escapeHtml(m.pillar)}
        </span>
        <span class="milestone-status-pill ${statusClass}">${statusLabel}</span>
      </div>

      <h3 class="milestone-title">${escapeHtml(m.title)}</h3>

      <div class="milestone-meta-row">
        <span class="milestone-horizon-badge">📅 Target: <strong>${escapeHtml(m.targetHorizon || 'TBD')}</strong></span>
        <span class="milestone-priority-badge">${escapeHtml(m.priority || 'High')} Priority</span>
      </div>

      <div class="milestone-progress-bar-wrap">
        <div class="milestone-progress-header">
          <span>Execution Progress</span>
          <span class="milestone-pct-num">${m.progressPct || 0}%</span>
        </div>
        <div class="milestone-progress-track">
          <div class="milestone-progress-fill" style="width: ${m.progressPct || 0}%; background: ${pillarColor};"></div>
        </div>
      </div>

      ${strategyHtml}
      ${keyResultsHtml}

      <div class="milestone-footer-actions">
        <button type="button" class="btn-rm-action" onclick="openRoadmapModal(null, '${m.id}')" title="Edit Milestone">
          ✏️ Edit
        </button>
        <button type="button" class="btn-rm-action btn-rm-del" onclick="deleteRoadmapMilestone('${m.id}')" title="Delete Milestone">
          🗑️
        </button>
      </div>
    </div>
  `;
}

async function toggleRoadmapKeyResult(milestoneId, keyResultId) {
  try {
    const res = await fetch(`/api/roadmap/${milestoneId}/toggle-key-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyResultId })
    });
    if (!res.ok) throw new Error('failed');
    const updated = await res.json();
    const idx = roadmapMilestones.findIndex(m => m.id === milestoneId);
    if (idx !== -1) roadmapMilestones[idx] = updated;
    updateRoadmapScorecards();
    renderRoadmapPhases();
  } catch (err) {
    console.error('Error toggling key result:', err);
    showToast('Could not update key result.');
  }
}

function openRoadmapModal(defaultPillar = null, editMilestoneId = null) {
  if (editMilestoneId) {
    const m = roadmapMilestones.find(item => item.id === editMilestoneId);
    if (!m) return;
    if (roadmapModalTitle) roadmapModalTitle.textContent = 'Edit Life Milestone';
    if (roadmapMilestoneId) roadmapMilestoneId.value = m.id;
    if (roadmapPillarSelect) roadmapPillarSelect.value = m.pillar;
    if (roadmapPhaseSelect) roadmapPhaseSelect.value = m.phase;
    if (roadmapTitleInput) roadmapTitleInput.value = m.title;
    if (roadmapHorizonInput) roadmapHorizonInput.value = m.targetHorizon || '';
    if (roadmapStatusSelect) roadmapStatusSelect.value = m.status || 'in_progress';
    if (roadmapStrategyInput) roadmapStrategyInput.value = m.actionStrategy || '';
    if (roadmapKeyResultsInput) {
      const lines = Array.isArray(m.keyResults) ? m.keyResults.map(k => k.title).join('\n') : '';
      roadmapKeyResultsInput.value = lines;
    }
  } else {
    if (roadmapModalTitle) roadmapModalTitle.textContent = 'Add Life Milestone';
    if (roadmapMilestoneId) roadmapMilestoneId.value = '';
    if (roadmapPillarSelect) roadmapPillarSelect.value = defaultPillar || 'Dental Career';
    if (roadmapPhaseSelect) roadmapPhaseSelect.value = 'Phase 1: Foundation (Now)';
    if (roadmapTitleInput) roadmapTitleInput.value = '';
    if (roadmapHorizonInput) roadmapHorizonInput.value = 'Q4 2026';
    if (roadmapStatusSelect) roadmapStatusSelect.value = 'in_progress';
    if (roadmapStrategyInput) roadmapStrategyInput.value = '';
    if (roadmapKeyResultsInput) roadmapKeyResultsInput.value = '';
  }

  if (roadmapModalBackdrop) roadmapModalBackdrop.hidden = false;
}

function closeRoadmapModal() {
  if (roadmapModalBackdrop) roadmapModalBackdrop.hidden = true;
}

async function handleSaveRoadmapMilestone(e) {
  e.preventDefault();
  const id = roadmapMilestoneId.value;
  const rawKeyResults = roadmapKeyResultsInput.value.split('\n').map(l => l.trim()).filter(Boolean);
  
  let keyResults = [];
  if (id) {
    const existing = roadmapMilestones.find(m => m.id === id);
    const existingKrs = existing?.keyResults || [];
    keyResults = rawKeyResults.map((title, i) => {
      const matched = existingKrs.find(k => k.title === title) || existingKrs[i];
      return {
        id: matched?.id || `kr_${Date.now()}_${i}`,
        title,
        done: matched ? matched.done : false
      };
    });
  } else {
    keyResults = rawKeyResults.map((title, i) => ({
      id: `kr_${Date.now()}_${i}`,
      title,
      done: false
    }));
  }

  const payload = {
    pillar: roadmapPillarSelect.value,
    phase: roadmapPhaseSelect.value,
    title: roadmapTitleInput.value.trim(),
    targetHorizon: roadmapHorizonInput.value.trim(),
    status: roadmapStatusSelect.value,
    actionStrategy: roadmapStrategyInput.value.trim(),
    keyResults
  };

  try {
    if (id) {
      const res = await fetch(`/api/roadmap/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('failed');
      showToast('Milestone updated.');
    } else {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('failed');
      showToast('New milestone established!');
    }
    closeRoadmapModal();
    await loadRoadmap();
  } catch (err) {
    console.error('Error saving milestone:', err);
    showToast('Could not save milestone.');
  }
}

async function deleteRoadmapMilestone(id) {
  if (!confirm('Are you sure you want to remove this milestone from your roadmap?')) return;
  try {
    const res = await fetch(`/api/roadmap/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('failed');
    showToast('Milestone removed.');
    await loadRoadmap();
  } catch (err) {
    console.error('Error deleting milestone:', err);
    showToast('Could not delete milestone.');
  }
}

// =============================================================================
// 🔐 USER AUTHENTICATION & PROFILE CONTROLLERS
// =============================================================================

const userAuthCapsule = document.getElementById('userAuthCapsule');
const btnAuthProfile = document.getElementById('btnAuthProfile');
const btnAuthLogout = document.getElementById('btnAuthLogout');
const userEmailLabel = document.getElementById('userEmailLabel');

const authModalBackdrop = document.getElementById('authModalBackdrop');
const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
const authCalloutBanner = document.getElementById('authCalloutBanner');
const btnBannerSignIn = document.getElementById('btnBannerSignIn');

const authModalTitle = document.getElementById('authModalTitle');
const authModalSubtitle = document.getElementById('authModalSubtitle');
const authTabLogin = document.getElementById('authTabLogin');
const authTabRegister = document.getElementById('authTabRegister');
const authForm = document.getElementById('authForm');
const authNameGroup = document.getElementById('authNameGroup');
const authNameInput = document.getElementById('authNameInput');
const authEmailInput = document.getElementById('authEmailInput');
const authPasswordInput = document.getElementById('authPasswordInput');
const authErrorMsg = document.getElementById('authErrorMsg');
const authSubmitBtn = document.getElementById('authSubmitBtn');

let authMode = 'login'; // 'login' | 'register'

function initAuthEvents() {
  if (btnAuthProfile) {
    btnAuthProfile.addEventListener('click', () => {
      if (!authToken) {
        openAuthModal('login');
      } else {
        showToast(`Signed in as: ${currentUser?.email || 'User'}`);
      }
    });
  }

  if (btnBannerSignIn) {
    btnBannerSignIn.addEventListener('click', () => openAuthModal('login'));
  }

  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener('click', closeAuthModal);
  }

  if (authModalBackdrop) {
    authModalBackdrop.addEventListener('click', (e) => {
      if (e.target === authModalBackdrop) closeAuthModal();
    });
  }

  if (btnAuthLogout) {
    btnAuthLogout.addEventListener('click', handleSignOut);
  }

  if (authTabLogin) {
    authTabLogin.addEventListener('click', () => setAuthMode('login'));
  }

  if (authTabRegister) {
    authTabRegister.addEventListener('click', () => setAuthMode('register'));
  }

  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  updateUserUi();
  checkAuthSession();
}

function setAuthMode(mode) {
  authMode = mode;
  const errorMsg = document.getElementById('authErrorMsg');
  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const nameGroup = document.getElementById('authNameGroup');
  const modalTitle = document.getElementById('authModalTitle');
  const modalSub = document.getElementById('authModalSubtitle');
  const submitBtn = document.getElementById('authSubmitBtn');

  if (errorMsg) errorMsg.style.display = 'none';

  if (mode === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (nameGroup) nameGroup.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Welcome Back';
    if (modalSub) modalSub.textContent = 'Sign in to access your Neon PostgreSQL workspace';
    if (submitBtn) submitBtn.innerHTML = '<span>🚀</span> Sign In';
  } else {
    if (tabRegister) tabRegister.classList.add('active');
    if (tabLogin) tabLogin.classList.remove('active');
    if (nameGroup) nameGroup.style.display = 'flex';
    if (modalTitle) modalTitle.textContent = 'Create Master Account';
    if (modalSub) modalSub.textContent = 'Get your personal cloud PostgreSQL workspace';
    if (submitBtn) submitBtn.innerHTML = '<span>✨</span> Create Account';
  }
}

function openAuthModal(mode = 'login') {
  setAuthMode(mode);
  const backdrop = document.getElementById('authModalBackdrop');
  const emailInput = document.getElementById('authEmailInput');
  if (backdrop) {
    backdrop.hidden = false;
    backdrop.removeAttribute('hidden');
    backdrop.style.setProperty('display', 'flex', 'important');
  }
  if (emailInput) {
    setTimeout(() => emailInput.focus(), 100);
  }
}

function closeAuthModal() {
  const backdrop = document.getElementById('authModalBackdrop');
  const errorMsg = document.getElementById('authErrorMsg');
  if (backdrop) {
    backdrop.hidden = true;
    backdrop.setAttribute('hidden', '');
    backdrop.style.setProperty('display', 'none', 'important');
  }
  if (errorMsg) errorMsg.style.display = 'none';
}

// Expose globally so inline onclick always succeeds immediately
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.setAuthMode = setAuthMode;

async function handleAuthSubmit(e) {
  e.preventDefault();
  if (authErrorMsg) authErrorMsg.style.display = 'none';

  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  const name = authNameInput ? authNameInput.value.trim() : '';

  if (!email || !password) {
    showAuthError('Please fill in all required fields.');
    return;
  }

  const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const payload = authMode === 'register' ? { email, password, name } : { email, password };

  try {
    authSubmitBtn.disabled = true;
    authSubmitBtn.innerHTML = '<span>⏳</span> Processing...';

    const res = await _originalFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.error || 'Authentication failed.');
      return;
    }

    // Save token and user
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('antigravity_token', authToken);
    localStorage.setItem('antigravity_user', JSON.stringify(currentUser));

    updateUserUi();
    closeAuthModal();
    showToast(`Welcome ${currentUser.name || currentUser.email}!`);

    // Reload all dashboard data for the authenticated tenant
    loadMeta();
    loadTasks();
    loadWeeklyProgress();
    loadWealthCard();
  } catch (err) {
    console.error('Auth submit error:', err);
    showAuthError('Network error connecting to server.');
  } finally {
    if (authSubmitBtn) {
      authSubmitBtn.disabled = false;
      authSubmitBtn.innerHTML = authMode === 'register' ? '<span>✨</span> Create Account' : '<span>🚀</span> Sign In';
    }
  }
}

function showAuthError(msg) {
  if (authErrorMsg) {
    authErrorMsg.textContent = msg;
    authErrorMsg.style.display = 'block';
  }
}

function handleSignOut(promptModal = true) {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('antigravity_token');
  localStorage.removeItem('antigravity_user');
  updateUserUi();
  showToast('Signed out successfully.');
  if (promptModal) openAuthModal('login');
}

function updateUserUi() {
  if (currentUser && authToken) {
    if (userEmailLabel) userEmailLabel.textContent = currentUser.name || currentUser.email.split('@')[0];
    if (btnAuthLogout) btnAuthLogout.style.display = 'flex';
    if (authCalloutBanner) authCalloutBanner.style.display = 'none';
  } else {
    if (userEmailLabel) userEmailLabel.textContent = 'Sign In';
    if (btnAuthLogout) btnAuthLogout.style.display = 'none';
    if (authCalloutBanner) authCalloutBanner.style.display = 'flex';
  }
}

async function checkAuthSession() {
  if (!authToken) {
    openAuthModal('login');
    return;
  }

  try {
    const res = await _originalFetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      localStorage.setItem('antigravity_user', JSON.stringify(currentUser));
      updateUserUi();
    } else {
      handleSignOut(true);
    }
  } catch (err) {
    console.warn('Session check warning:', err);
  }
}

// =============================================================================
// INIT
// =============================================================================

initAuthEvents();
renderDashboard();
loadMeta();
loadTasks();
loadWeeklyProgress();
initWeekTabs();
loadWealthCard();
initRoadmapEvents();
