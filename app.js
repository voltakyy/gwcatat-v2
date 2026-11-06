// ==========================================================================
// GWCATAT V2 — Local-First iOS 18 Controller
// Zero-Login Wall · LocalStorage Offline-First · Accounting & 50/30/20 Engine
// ==========================================================================

const STORAGE_KEY = 'gwcatat_v2_transactions';
const ALLOWANCE_KEY = 'gwcatat_v2_allowance';
const SAVINGS_GOAL_KEY = 'gwcatat_v2_savings_goal';
const THEME_KEY = 'gwcatat_theme';

// =================== 1. KATEGORI & SISTEM HIG APPLE ===================
const CATEGORIES = {
  // Pemasukan
  gaji:        { name: 'Gaji Pokok', icon: '💰', grad: 'var(--grad-emerald)', type: 'in', pillar: 'income' },
  usaha:       { name: 'Usaha / Bisnis', icon: '💼', grad: 'var(--grad-emerald)', type: 'in', pillar: 'income' },
  bonus:       { name: 'Bonus & Hadiah', icon: '🎁', grad: 'var(--grad-amber)', type: 'in', pillar: 'income' },
  uang_jajan:  { name: 'Uang Jajan / Kiriman', icon: '🪙', grad: 'var(--grad-teal)', type: 'in', pillar: 'income' },
  investasi:   { name: 'Hasil Investasi', icon: '📈', grad: 'var(--grad-blue)', type: 'in', pillar: 'income' },

  // Pengeluaran: Kebutuhan Pokok (50%)
  makan:       { name: 'Makan & Minum', icon: '🍔', grad: 'var(--grad-coral)', type: 'out', pillar: 'kebutuhan' },
  transport:   { name: 'Transport & Bensin', icon: '🚗', grad: 'var(--grad-blue)', type: 'out', pillar: 'kebutuhan' },
  tagihan:     { name: 'Listrik & Wifi', icon: '⚡', grad: 'var(--grad-amber)', type: 'out', pillar: 'kebutuhan' },
  kebutuhan:   { name: 'Kebutuhan Rumah', icon: '🛒', grad: 'var(--grad-teal)', type: 'out', pillar: 'kebutuhan' },

  // Pengeluaran: Keinginan (30%)
  keinginan:   { name: 'Belanja & Pakaian', icon: '🛍️', grad: 'var(--grad-purple)', type: 'out', pillar: 'keinginan' },
  hiburan:     { name: 'Nongkrong & Hiburan', icon: '🍿', grad: 'var(--grad-rose)', type: 'out', pillar: 'keinginan' },

  // Pengeluaran / Alokasi: Tabungan (20%)
  tabungan:    { name: 'Tabungan Masa Depan', icon: '🏦', grad: 'var(--grad-teal)', type: 'out', pillar: 'tabungan' },
  darurat:     { name: 'Dana Darurat', icon: '🛡️', grad: 'var(--grad-emerald)', type: 'out', pillar: 'darurat' },

  // Lainnya
  lainnya:     { name: 'Lain-lain', icon: '🏷️', grad: 'var(--grad-wallet)', type: 'out', pillar: 'keinginan' },

  // Utang & Piutang
  piutang:     { name: 'Piutang (Diterima Nanti)', icon: '🤝', grad: 'var(--grad-blue)', type: 'piutang', pillar: 'piutang' },
  utang:       { name: 'Utang (Dibayar Nanti)', icon: '💳', grad: 'var(--grad-rose)', type: 'utang', pillar: 'utang' }
};

// =================== 2. STATE APLIKASI ===================
let transactions = [];
let activeTab = 'beranda';
let currentMonth = getCurrentMonthKey();
let txFilterType = 'all'; // all, in, out
let txSearchKeyword = '';
let chartInstances = { cashflow: null, category: null };

function getCurrentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Format Rupiah rapi
function fmtRp(num) {
  const n = Math.round(Number(num) || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
}

function fmtTanggalID(dateStr) {
  if (!dateStr) return '–';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function monthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-');
  const d = new Date(y, Number(m) - 1, 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

// =================== 3. LOCAL STORAGE & DATA SEEDER ===================
function loadTransactions() {
  // 1. Coba v2 local storage
  const rawV2 = localStorage.getItem(STORAGE_KEY);
  if (rawV2) {
    try {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // 2. Coba migrasi dari v1 gwcatat jika ada
  const rawV1 = localStorage.getItem('gwcatat_transactions');
  if (rawV1) {
    try {
      const parsed = JSON.parse(rawV1);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveTransactions(parsed);
        showDynamicIsland('Data lama gwcatat berhasil dipulihkan!', 'success');
        return parsed;
      }
    } catch (e) {}
  }

  // 3. Muat Data Awal yang Segar & Kaya (November 2026)
  const initialData = generateDemoTransactions();
  saveTransactions(initialData);
  return initialData;
}

function saveTransactions(data) {
  transactions = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan ke localStorage:', e);
  }
}

function generateDemoTransactions() {
  const curM = getCurrentMonthKey();
  return [
    { id: 'tx-1', date: `${curM}-01`, description: 'Gaji Pokok & Tunjangan', amount: 6500000, type: 'in', category: 'gaji', status: 'settled' },
    { id: 'tx-2', date: `${curM}-01`, description: 'Alokasi Simpanan Dana Darurat', amount: 650000, type: 'out', category: 'darurat', status: 'settled' },
    { id: 'tx-3', date: `${curM}-02`, description: 'Belanja Sembako Supermarket', amount: 480000, type: 'out', category: 'kebutuhan', status: 'settled' },
    { id: 'tx-4', date: `${curM}-03`, description: 'Tagihan Listrik & Internet Wifi', amount: 375000, type: 'out', category: 'tagihan', status: 'settled' },
    { id: 'tx-5', date: `${curM}-04`, description: 'Bensin & Transportasi Kerja', amount: 120000, type: 'out', category: 'transport', status: 'settled' },
    { id: 'tx-6', date: `${curM}-05`, description: 'Makan Bersama & Kopi Teman', amount: 85000, type: 'out', category: 'hiburan', status: 'settled' },
    { id: 'tx-7', date: `${curM}-05`, description: 'Hasil Project Freelance Desain', amount: 1200000, type: 'in', category: 'usaha', status: 'settled' },
    { id: 'tx-8', date: `${curM}-06`, description: 'Tabungan Reksadana Masa Depan', amount: 800000, type: 'out', category: 'tabungan', status: 'settled' },
    { id: 'tx-9', date: `${curM}-06`, description: 'Beli Buku & Pelatihan KKI', amount: 150000, type: 'out', category: 'keinginan', status: 'settled' },
    { id: 'tx-10', date: `${curM}-06`, description: 'Pinjaman ke Dito (Tugas Kelompok)', amount: 200000, type: 'piutang', category: 'piutang', counterparty: 'Dito', due_date: `${curM}-20`, status: 'open' }
  ];
}

// =================== 4. DYNAMIC ISLAND TOAST (iOS NOTIFICATION) ===================
let toastTimer = null;
function showDynamicIsland(message, type = 'success') {
  const el = document.getElementById('dynamicIsland');
  if (!el) return;
  const msgEl = document.getElementById('dynamicIslandMsg');
  const iconEl = document.getElementById('dynamicIslandIcon');

  el.className = `dynamic-island show ${type}`;
  if (msgEl) msgEl.textContent = message;
  if (iconEl) {
    iconEl.textContent = type === 'success' ? '✓' : type === 'warning' ? '!' : '✕';
  }

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 3200);
}

// =================== 5. KALKULASI FINANSIAL & 50/30/20 ===================
function getPillar(cat) {
  return CATEGORIES[cat]?.pillar || 'keinginan';
}

function getCategoryInfo(cat) {
  return CATEGORIES[cat] || { name: cat || 'Lainnya', icon: '🏷️', grad: 'var(--grad-wallet)' };
}

// Perhitungan Kas Bulan Aktif
function getMonthData(mKey = currentMonth) {
  const allTx = transactions.filter(t => t.date);
  const mTx = allTx.filter(t => t.date.startsWith(mKey));

  const totalIn = mTx.filter(t => t.type === 'in').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalOut = mTx.filter(t => t.type === 'out').reduce((acc, t) => acc + Number(t.amount), 0);
  const netSavings = totalIn - totalOut;

  // Kumulatif Seluruh Waktu untuk Saldo Kas
  const cumIn = allTx.filter(t => t.type === 'in').reduce((acc, t) => acc + Number(t.amount), 0);
  const cumOut = allTx.filter(t => t.type === 'out').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalKas = cumIn - cumOut;

  // 50/30/20 Breakdown
  const outTx = mTx.filter(t => t.type === 'out');
  const kebutuhan = outTx.filter(t => getPillar(t.category) === 'kebutuhan').reduce((a, t) => a + Number(t.amount), 0);
  const keinginan = outTx.filter(t => getPillar(t.category) === 'keinginan').reduce((a, t) => a + Number(t.amount), 0);
  const tabungan = outTx.filter(t => getPillar(t.category) === 'tabungan' || getPillar(t.category) === 'darurat').reduce((a, t) => a + Number(t.amount), 0);

  // Basis persentase: gunakan totalIn jika > 0, atau totalOut jika in=0
  const base = totalIn > 0 ? totalIn : (totalOut > 0 ? totalOut : 1);
  const pctKebutuhan = Math.min(100, Math.round((kebutuhan / base) * 100));
  const pctKeinginan = Math.min(100, Math.round((keinginan / base) * 100));
  const pctTabungan = Math.min(100, Math.round((tabungan / base) * 100));

  // Utang & Piutang Terbuka
  const piutangOpen = allTx.filter(t => t.type === 'piutang' && (t.status || 'open') === 'open').reduce((a, t) => a + Number(t.amount), 0);
  const utangOpen = allTx.filter(t => t.type === 'utang' && (t.status || 'open') === 'open').reduce((a, t) => a + Number(t.amount), 0);

  // Dana Darurat Tersimpan (Kumulatif)
  const danaDarurat = allTx.filter(t => t.type === 'out' && getPillar(t.category) === 'darurat').reduce((a, t) => a + Number(t.amount), 0);

  return {
    mTx,
    totalIn,
    totalOut,
    netSavings,
    totalKas,
    kebutuhan,
    keinginan,
    tabungan,
    pctKebutuhan,
    pctKeinginan,
    pctTabungan,
    piutangOpen,
    utangOpen,
    danaDarurat
  };
}

// 5 Indikator Kesehatan Finansial
function calculateHealth(data) {
  const { totalIn, totalOut, kebutuhan, keinginan, tabungan, totalKas, danaDarurat, utangOpen } = data;

  // 1. Rasio Tabungan (Target: >= 20%)
  const savingsRatio = totalIn > 0 ? Math.round((tabungan / totalIn) * 100) : 0;
  const savingsStatus = savingsRatio >= 20 ? 'good' : savingsRatio >= 10 ? 'warning' : 'bad';

  // 2. Rasio Gaya Hidup (Target: <= 30%)
  const lifestyleRatio = totalOut > 0 ? Math.round((keinginan / totalOut) * 100) : 0;
  const lifestyleStatus = lifestyleRatio <= 30 ? 'good' : lifestyleRatio <= 45 ? 'warning' : 'bad';

  // 3. Rasio Likuiditas (Kas / Pengeluaran Bulanan)
  const monthlyExpense = totalOut > 0 ? totalOut : 1500000;
  const liquidityMonths = totalKas > 0 ? (totalKas / monthlyExpense).toFixed(1) : '0';
  const liquidityStatus = Number(liquidityMonths) >= 3 ? 'good' : Number(liquidityMonths) >= 1 ? 'warning' : 'bad';

  // 4. Target Dana Darurat (Misal target: 3x Pengeluaran Bulanan)
  const targetDarurat = monthlyExpense * 3;
  const emergencyPct = Math.min(100, Math.round((danaDarurat / (targetDarurat || 1)) * 100));
  const emergencyStatus = emergencyPct >= 80 ? 'good' : emergencyPct >= 40 ? 'warning' : 'bad';

  // 5. Rasio Beban Utang (DSR: Utang / Pemasukan Bulanan)
  const dsr = totalIn > 0 ? Math.round((utangOpen / totalIn) * 100) : (utangOpen > 0 ? 100 : 0);
  const debtStatus = dsr <= 30 ? 'good' : dsr <= 50 ? 'warning' : 'bad';

  return {
    savings: { val: `${savingsRatio}%`, badge: savingsRatio >= 20 ? 'Optimal' : 'Perlu Tambah', status: savingsStatus, num: savingsRatio },
    lifestyle: { val: `${lifestyleRatio}%`, badge: lifestyleRatio <= 30 ? 'Terkendali' : 'Boros', status: lifestyleStatus, num: lifestyleRatio },
    liquidity: { val: `${liquidityMonths} Bln`, badge: Number(liquidityMonths) >= 3 ? 'Aman' : 'Rentan', status: liquidityStatus, num: Number(liquidityMonths) },
    emergency: { val: `${emergencyPct}%`, badge: emergencyPct >= 80 ? 'Kokoh' : 'Bangun Lagi', status: emergencyStatus, num: emergencyPct },
    debt: { val: `${dsr}%`, badge: dsr <= 30 ? 'Bebas Risiko' : 'Waspada', status: debtStatus, num: dsr }
  };
}

// =================== 6. RENDER VIEW ENGINE ===================
function renderAll() {
  const data = getMonthData(currentMonth);
  const health = calculateHealth(data);

  // Update Period Badges
  const mLabel = monthLabel(currentMonth);
  document.querySelectorAll('.current-month-label').forEach(el => el.textContent = mLabel);

  renderWalletWidget(data);
  renderRuleWidget(data);
  renderHealthCards(health);
  renderRecentTransactions(data.mTx);
  renderTransactionsPage();
  renderSavingsPage(data);
  renderReportsPage(data);
  renderCharts(data);
}

// 6a. Render Wallet Hero Widget
function renderWalletWidget(data) {
  const saldoEl = document.getElementById('walletBalance');
  const inEl = document.getElementById('walletIn');
  const outEl = document.getElementById('walletOut');

  if (saldoEl) saldoEl.textContent = fmtRp(data.totalKas);
  if (inEl) inEl.textContent = `+${fmtRp(data.totalIn)}`;
  if (outEl) outEl.textContent = `-${fmtRp(data.totalOut)}`;
}

// 6b. Render 50/30/20 Rule
function renderRuleWidget(data) {
  const fillKebutuhan = document.getElementById('fillKebutuhan');
  const fillKeinginan = document.getElementById('fillKeinginan');
  const fillTabungan = document.getElementById('fillTabungan');

  const valKebutuhan = document.getElementById('valKebutuhan');
  const valKeinginan = document.getElementById('valKeinginan');
  const valTabungan = document.getElementById('valTabungan');

  if (fillKebutuhan) fillKebutuhan.style.width = `${data.pctKebutuhan}%`;
  if (fillKeinginan) fillKeinginan.style.width = `${data.pctKeinginan}%`;
  if (fillTabungan) fillTabungan.style.width = `${data.pctTabungan}%`;

  if (valKebutuhan) valKebutuhan.textContent = `${fmtRp(data.kebutuhan)} (${data.pctKebutuhan}% / ideal 50%)`;
  if (valKeinginan) valKeinginan.textContent = `${fmtRp(data.keinginan)} (${data.pctKeinginan}% / ideal 30%)`;
  if (valTabungan) valTabungan.textContent = `${fmtRp(data.tabungan)} (${data.pctTabungan}% / ideal 20%)`;
}

// 6c. Render 5 Health Indicator Cards
function renderHealthCards(health) {
  const updateCard = (id, key, title) => {
    const el = document.getElementById(id);
    if (!el) return;
    const h = health[key];
    el.innerHTML = `
      <div class="health-card-top">
        <div class="health-card-icon" style="background: rgba(0, 122, 255, 0.1);">
          ${key === 'savings' ? '🏦' : key === 'lifestyle' ? '☕' : key === 'liquidity' ? '💧' : key === 'emergency' ? '🛡️' : '💳'}
        </div>
        <span class="health-badge ${h.status}">${h.badge}</span>
      </div>
      <div class="health-card-bottom">
        <div class="health-card-value">${h.val}</div>
        <div class="health-card-title">${title}</div>
      </div>
    `;
    el.onclick = () => openHealthModal(key);
  };

  updateCard('cardSavings', 'savings', 'Rasio Tabungan');
  updateCard('cardLifestyle', 'lifestyle', 'Rasio Gaya Hidup');
  updateCard('cardLiquidity', 'liquidity', 'Daya Tahan Likuiditas');
  updateCard('cardEmergency', 'emergency', 'Kesiapan Dana Darurat');
  updateCard('cardDebt', 'debt', 'Beban Utang (DSR)');
}

// 6d. Render Recent Transactions (Beranda)
function renderRecentTransactions(mTx) {
  const container = document.getElementById('recentTransactionsList');
  if (!container) return;

  const sorted = [...mTx].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);
  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">Belum Ada Transaksi Bulan Ini</div>
        <div class="empty-state-text">Tekan tombol Catat Transaksi di atas untuk mulai mencatat keuanganmu.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = sorted.map(t => renderTxRowHtml(t)).join('');
}

function renderTxRowHtml(t) {
  const cat = getCategoryInfo(t.category);
  const isIn = t.type === 'in';
  const isDebt = t.type === 'utang' || t.type === 'piutang';
  const amtClass = isIn ? 'income' : isDebt ? 'debt' : 'expense';
  const prefix = isIn ? '+' : isDebt ? '' : '-';

  return `
    <div class="tx-row" onclick="viewTxDetail('${t.id}')">
      <div class="tx-icon-squircle" style="background: ${cat.grad}; color:#ffffff;">
        ${cat.icon}
      </div>
      <div class="tx-info">
        <div class="tx-title">${t.description || cat.name}</div>
        <div class="tx-meta">
          <span>${fmtTanggalID(t.date)}</span>
          <span class="tx-tag">${cat.name}</span>
          ${t.counterparty ? `<span class="tx-tag">Pihak: ${t.counterparty}</span>` : ''}
          ${t.status === 'open' && isDebt ? `<span class="tx-tag" style="color:var(--ios-orange)">Belum Lunas</span>` : ''}
        </div>
      </div>
      <div class="tx-amount-box">
        <div class="tx-amount mono ${amtClass}">${prefix}${fmtRp(t.amount)}</div>
      </div>
      <button class="tx-delete-btn" onclick="event.stopPropagation(); deleteTransaction('${t.id}')" title="Hapus">
        ✕
      </button>
    </div>
  `;
}

// 6e. Render Full Transactions Page
function renderTransactionsPage() {
  const listEl = document.getElementById('fullTransactionsList');
  if (!listEl) return;

  let filtered = transactions.filter(t => t.date && t.date.startsWith(currentMonth));

  if (txFilterType === 'in') {
    filtered = filtered.filter(t => t.type === 'in');
  } else if (txFilterType === 'out') {
    filtered = filtered.filter(t => t.type === 'out');
  }

  if (txSearchKeyword.trim()) {
    const kw = txSearchKeyword.toLowerCase();
    filtered = filtered.filter(t => 
      (t.description || '').toLowerCase().includes(kw) ||
      (t.category || '').toLowerCase().includes(kw) ||
      (t.counterparty || '').toLowerCase().includes(kw)
    );
  }

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">Tidak Ada Transaksi Sesuai Filter</div>
        <div class="empty-state-text">Coba ganti filter atau cari kata kunci lain.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = sorted.map(t => renderTxRowHtml(t)).join('');
}

// 6f. Render Tabungan & Utang-Piutang Page
function renderSavingsPage(data) {
  const daruratAmountEl = document.getElementById('pgDanaDaruratAmount');
  if (daruratAmountEl) daruratAmountEl.textContent = fmtRp(data.danaDarurat);

  // Utang / Piutang list
  const piutangList = document.getElementById('piutangList');
  const utangList = document.getElementById('utangList');

  const piutangItems = transactions.filter(t => t.type === 'piutang');
  const utangItems = transactions.filter(t => t.type === 'utang');

  if (piutangList) {
    if (piutangItems.length === 0) {
      piutangList.innerHTML = '<div class="empty-state" style="padding:18px"><div class="empty-state-title">Tidak ada catatan piutang.</div></div>';
    } else {
      piutangList.innerHTML = piutangItems.map(t => renderDebtRow(t)).join('');
    }
  }

  if (utangList) {
    if (utangItems.length === 0) {
      utangList.innerHTML = '<div class="empty-state" style="padding:18px"><div class="empty-state-title">Tidak ada catatan utang.</div></div>';
    } else {
      utangList.innerHTML = utangItems.map(t => renderDebtRow(t)).join('');
    }
  }
}

function renderDebtRow(t) {
  const isSettled = t.status === 'settled';
  const cat = getCategoryInfo(t.category);

  return `
    <div class="debt-status-card">
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="tx-icon-squircle" style="background:${cat.grad}; color:#fff; width:36px; height:36px; font-size:15px;">
          ${cat.icon}
        </div>
        <div>
          <div style="font-weight:700; font-size:14px; color:var(--ios-label);">${t.description || (t.type === 'piutang' ? 'Piutang ke ' + (t.counterparty || 'Teman') : 'Utang ke ' + (t.counterparty || 'Teman'))}</div>
          <div style="font-size:11.5px; color:var(--ios-label-secondary); margin-top:2px;">
            ${fmtTanggalID(t.date)} ${t.due_date ? `· Tenggat: ${fmtTanggalID(t.due_date)}` : ''}
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="mono" style="font-size:14px; font-weight:800; color:var(--ios-label); margin-bottom:4px;">${fmtRp(t.amount)}</div>
        <button class="btn-lunas-toggle ${isSettled ? 'paid' : 'unpaid'}" onclick="toggleDebtSettled('${t.id}')">
          ${isSettled ? '✓ Lunas' : 'Belum Lunas'}
        </button>
      </div>
    </div>
  `;
}

function toggleDebtSettled(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  t.status = t.status === 'settled' ? 'open' : 'settled';
  saveTransactions([...transactions]);
  renderAll();
  showDynamicIsland(t.status === 'settled' ? 'Status diubah ke LUNAS ✓' : 'Status diubah ke BELUM LUNAS', 'success');
}

// 6g. Render Laporan Keuangan SAK EMKM
function renderReportsPage(data) {
  const { mTx, totalIn, totalOut, netSavings } = data;

  // Laba Rugi
  const labaEl = document.getElementById('repLabaBersih');
  const marginEl = document.getElementById('repMargin');
  const revEl = document.getElementById('repPendapatan');
  const expEl = document.getElementById('repBeban');

  const marginPct = totalIn > 0 ? Math.round((netSavings / totalIn) * 100) : 0;
  if (labaEl) {
    labaEl.textContent = fmtRp(netSavings);
    labaEl.style.color = netSavings >= 0 ? 'var(--ios-green)' : 'var(--ios-red)';
  }
  if (marginEl) marginEl.textContent = `Margin: ${marginPct}%`;
  if (revEl) revEl.textContent = fmtRp(totalIn);
  if (expEl) expEl.textContent = fmtRp(totalOut);

  // Neraca Sederhana
  const allTx = transactions.filter(t => t.date);
  const kas = data.totalKas;
  const piutang = allTx.filter(t => t.type === 'piutang' && (t.status || 'open') === 'open').reduce((a, t) => a + Number(t.amount), 0);
  const simpanan = allTx.filter(t => t.type === 'out' && (getPillar(t.category) === 'tabungan' || getPillar(t.category) === 'darurat')).reduce((a, t) => a + Number(t.amount), 0);
  const totalAset = kas + piutang + simpanan;
  const utang = allTx.filter(t => t.type === 'utang' && (t.status || 'open') === 'open').reduce((a, t) => a + Number(t.amount), 0);
  const ekuitas = totalAset - utang;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setT('neracaKas', fmtRp(kas));
  setT('neracaPiutang', fmtRp(piutang));
  setT('neracaSimpanan', fmtRp(simpanan));
  setT('neracaTotalAset', fmtRp(totalAset));
  setT('neracaUtang', fmtRp(utang));
  setT('neracaEkuitas', fmtRp(ekuitas));

  const seimbangEl = document.getElementById('neracaStatus');
  if (seimbangEl) {
    const isOk = totalAset === utang + ekuitas;
    seimbangEl.textContent = isOk ? '✓ Neraca Seimbang' : '⚠ Perlu Koreksi';
    seimbangEl.style.color = isOk ? 'var(--ios-green)' : 'var(--ios-red)';
  }

  // Tabel Arus Kas Harian
  renderCashFlowTable(mTx);
}

function renderCashFlowTable(mTx) {
  const tableEl = document.getElementById('cashFlowTableBody');
  if (!tableEl) return;

  const sorted = [...mTx].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  let running = 0;

  tableEl.innerHTML = sorted.map(t => {
    const isIn = t.type === 'in';
    const amt = Number(t.amount) || 0;
    if (isIn) running += amt;
    else if (t.type === 'out') running -= amt;

    return `
      <tr>
        <td class="mono" style="white-space:nowrap">${fmtTanggalID(t.date)}</td>
        <td><strong>${t.description || getCategoryInfo(t.category).name}</strong></td>
        <td class="mono" style="color:var(--ios-green); text-align:right">${isIn ? fmtRp(amt) : '–'}</td>
        <td class="mono" style="color:var(--ios-red); text-align:right">${!isIn && t.type === 'out' ? fmtRp(amt) : '–'}</td>
        <td class="mono" style="font-weight:700; text-align:right">${fmtRp(running)}</td>
      </tr>
    `;
  }).join('');
}

// 6h. Interactive Chart.js Rendering
function renderCharts(data) {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Cashflow Overview Doughnut (Kebutuhan vs Keinginan vs Tabungan)
  const ctxCat = document.getElementById('chartCategory');
  if (ctxCat) {
    if (chartInstances.category) chartInstances.category.destroy();

    const keb = data.kebutuhan || 0;
    const kei = data.keinginan || 0;
    const tab = data.tabungan || 0;

    chartInstances.category = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Kebutuhan (50%)', 'Keinginan (30%)', 'Tabungan (20%)'],
        datasets: [{
          data: [keb, kei, tab],
          backgroundColor: ['#007aff', '#af52de', '#34c759'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: '-apple-system, sans-serif', size: 11 } }
          }
        },
        cutout: '72%'
      }
    });
  }
}

// =================== 7. CRUD TRANSAKSI ===================
function openAddModal(defaultType = 'out') {
  const modal = document.getElementById('txModalOverlay');
  if (!modal) return;

  document.getElementById('txModalTitle').textContent = 'Tambah Transaksi';
  document.getElementById('txForm').reset();
  document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
  
  // Set default segment type
  setModalTxType(defaultType);
  modal.classList.add('open');
}

function closeAddModal() {
  const modal = document.getElementById('txModalOverlay');
  if (modal) modal.classList.remove('open');
}

let modalSelectedType = 'out';
let modalSelectedCategory = 'makan';

function setModalTxType(type) {
  modalSelectedType = type;
  document.querySelectorAll('.modal-segment-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Render Kategori Picker yang relevan
  renderModalCategoryPicker(type);

  // Atur field counterparty / tenggat
  const partyGroup = document.getElementById('partyGroup');
  if (partyGroup) {
    partyGroup.style.display = (type === 'utang' || type === 'piutang') ? 'block' : 'none';
  }
}

function renderModalCategoryPicker(type) {
  const grid = document.getElementById('catPickerGrid');
  if (!grid) return;

  const validCats = Object.entries(CATEGORIES).filter(([k, v]) => {
    if (type === 'in') return v.type === 'in';
    if (type === 'out') return v.type === 'out';
    if (type === 'utang') return v.type === 'utang';
    if (type === 'piutang') return v.type === 'piutang';
    return true;
  });

  if (validCats.length > 0) {
    modalSelectedCategory = validCats[0][0];
  }

  grid.innerHTML = validCats.map(([k, v], idx) => `
    <div class="cat-picker-item ${idx === 0 ? 'selected' : ''}" data-cat="${k}" onclick="selectModalCategory('${k}')">
      <div class="cat-picker-icon" style="background:${v.grad}; color:#fff;">${v.icon}</div>
      <div class="cat-picker-name">${v.name}</div>
    </div>
  `).join('');
}

function selectModalCategory(catKey) {
  modalSelectedCategory = catKey;
  document.querySelectorAll('.cat-picker-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.cat === catKey);
  });
}

function handleSaveTransaction(e) {
  e.preventDefault();
  const desc = document.getElementById('txDesc').value.trim();
  const amtRaw = document.getElementById('txAmount').value.replace(/[^0-9]/g, '');
  const date = document.getElementById('txDate').value;
  const counterparty = document.getElementById('txParty')?.value.trim() || '';
  const due = document.getElementById('txDue')?.value || '';

  const amount = Number(amtRaw);
  if (!amount || amount <= 0) {
    showDynamicIsland('Nominal harus lebih dari Rp 0', 'error');
    return;
  }

  const newTx = {
    id: 'tx-' + Date.now(),
    date: date || new Date().toISOString().slice(0, 10),
    description: desc || getCategoryInfo(modalSelectedCategory).name,
    amount,
    type: modalSelectedType,
    category: modalSelectedCategory,
    counterparty,
    due_date: due,
    status: (modalSelectedType === 'utang' || modalSelectedType === 'piutang') ? 'open' : 'settled'
  };

  transactions.unshift(newTx);
  saveTransactions(transactions);
  closeAddModal();
  renderAll();
  showDynamicIsland('Transaksi berhasil disimpan! 🎉', 'success');
}

function deleteTransaction(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions(transactions);
  renderAll();
  showDynamicIsland('Transaksi dihapus', 'warning');
}

function viewTxDetail(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  alert(`Detail Transaksi:\n\nDeskripsi: ${t.description}\nNominal: ${fmtRp(t.amount)}\nKategori: ${getCategoryInfo(t.category).name}\nTanggal: ${fmtTanggalID(t.date)}\nTipe: ${t.type.toUpperCase()}`);
}

// =================== 8. MODAL INDIKATOR KESEHATAN FINANSIAL ===================
const HEALTH_GUIDE = {
  savings: {
    title: 'Rasio Tabungan & Investasi',
    formula: 'Rasio Tabungan = (Total Tabungan + Dana Darurat) ÷ Total Pemasukan × 100%',
    rule: 'Target Sehat: Minimal 20% dari seluruh pemasukan dialokasikan ke tabungan & investasi.',
    tips: 'Jika rasio di bawah 20%, prioritaskan sistem "bayar diri sendiri lebih dulu" (pay yourself first) segera setelah menerima penghasilan.'
  },
  lifestyle: {
    title: 'Rasio Gaya Hidup (Keinginan)',
    formula: 'Rasio Gaya Hidup = Total Belanja Keinginan ÷ Total Pengeluaran × 100%',
    rule: 'Target Sehat: Maksimal 30% dari pengeluaran bulanan.',
    tips: 'Gaya hidup berlebih dapat menggerogoti potensi tabungan masa depan. Terapkan jeda 24 jam sebelum belanja barang non-pokok.'
  },
  liquidity: {
    title: 'Daya Tahan Likuiditas Kas',
    formula: 'Rasio Likuiditas = Total Kas Bersih Tersedia ÷ Pengeluaran Rata-rata Bulanan',
    rule: 'Target Sehat: Mampu bertahan minimal 3 hingga 6 bulan tanpa pemasukan baru.',
    tips: 'Simpan dana likuid di rekening terpisah atau reksadana pasar uang agar tidak mudah terpakai belanja impulsif.'
  },
  emergency: {
    title: 'Kesiapan Dana Darurat',
    formula: 'Kesiapan = Dana Darurat Terkumpul ÷ (3 × Pengeluaran Bulanan) × 100%',
    rule: 'Target Sehat: 80% – 100% dari target dana darurat minimal 3 bulan hidup.',
    tips: 'Dana darurat adalah benteng terpenting agar kamu tidak perlu berutang saat terjadi hal darurat (sakit, gawai rusak, dll).'
  },
  debt: {
    title: 'Beban Cicilan Utang (DSR)',
    formula: 'Debt Service Ratio (DSR) = Total Utang Terbuka ÷ Total Pemasukan Bulanan × 100%',
    rule: 'Target Sehat: Maksimal 30% dari total pemasukan bulanan.',
    tips: 'Hindari utang konsumtif dengan bunga tinggi. Jika ada utang berbunga, prioritaskan metode Avalanche (lunasi bunga tertinggi dulu).'
  }
};

function openHealthModal(key) {
  const g = HEALTH_GUIDE[key];
  if (!g) return;

  const modal = document.getElementById('healthModalOverlay');
  if (!modal) return;

  document.getElementById('healthModalTitle').textContent = g.title;
  document.getElementById('healthModalFormula').textContent = g.formula;
  document.getElementById('healthModalRule').textContent = g.rule;
  document.getElementById('healthModalTips').textContent = g.tips;

  modal.classList.add('open');
}

function closeHealthModal() {
  const modal = document.getElementById('healthModalOverlay');
  if (modal) modal.classList.remove('open');
}

// =================== 9. EKSPOR EXCEL XLSX (5 SHEET SAK EMKM) & JSON BACKUP ===================
function exportToExcel() {
  if (typeof XLSX === 'undefined') {
    showDynamicIsland('Pustaka Excel belum siap. Cek koneksi internet.', 'error');
    return;
  }

  const data = getMonthData(currentMonth);
  const mTx = data.mTx;

  // 1. Sheet Laporan Kas
  const kasRows = mTx.map((t, idx) => ({
    No: idx + 1,
    Tanggal: t.date,
    Keterangan: t.description || getCategoryInfo(t.category).name,
    Kategori: getCategoryInfo(t.category).name,
    Pemasukan: t.type === 'in' ? t.amount : '',
    Pengeluaran: t.type === 'out' ? t.amount : '',
    Tipe: t.type.toUpperCase()
  }));
  const wsKas = XLSX.utils.json_to_sheet(kasRows);

  // 2. Sheet Laba Rugi
  const wsLaba = XLSX.utils.aoa_to_sheet([
    ['LAPORAN LABA RUGI SAK EMKM', monthLabel(currentMonth)],
    [],
    ['Total Pendapatan', data.totalIn],
    ['Total Beban Pokok & Operasional', data.totalOut],
    ['LABA BERSIH (SURPLUS)', data.netSavings],
    ['Margin Tabungan', `${data.totalIn > 0 ? Math.round((data.netSavings / data.totalIn) * 100) : 0}%`]
  ]);

  // 3. Sheet Neraca
  const allTx = transactions.filter(t => t.date);
  const kas = data.totalKas;
  const piutang = allTx.filter(t => t.type === 'piutang' && t.status === 'open').reduce((a, t) => a + Number(t.amount), 0);
  const simpanan = allTx.filter(t => t.type === 'out' && (getPillar(t.category) === 'tabungan' || getPillar(t.category) === 'darurat')).reduce((a, t) => a + Number(t.amount), 0);
  const utang = allTx.filter(t => t.type === 'utang' && t.status === 'open').reduce((a, t) => a + Number(t.amount), 0);
  const totalAset = kas + piutang + simpanan;
  const ekuitas = totalAset - utang;

  const wsNeraca = XLSX.utils.aoa_to_sheet([
    ['NERACA SEDERHANA SAK EMKM', monthLabel(currentMonth)],
    [],
    ['ASET LANCAR', ''],
    ['Kas di Tangan / Bank', kas],
    ['Piutang Terbuka', piutang],
    ['Simpanan Tabungan & Darurat', simpanan],
    ['TOTAL ASET', totalAset],
    [],
    ['KEWAJIBAN & EKUITAS', ''],
    ['Utang Belum Lunas', utang],
    ['Ekuitas (Modal Bersih Pemilik)', ekuitas],
    ['TOTAL KEWAJIBAN & EKUITAS', utang + ekuitas]
  ]);

  // 4. Sheet Jurnal Umum
  const jurnalRows = mTx.map((t, idx) => {
    const cat = getCategoryInfo(t.category).name;
    const debit = t.type === 'in' ? 'Kas' : `Beban / Tabungan (${cat})`;
    const kredit = t.type === 'in' ? `Pendapatan (${cat})` : 'Kas';
    return {
      No: idx + 1,
      Tanggal: t.date,
      Keterangan: t.description || cat,
      AkunDebit: debit,
      AkunKredit: kredit,
      NominalDebit: t.amount,
      NominalKredit: t.amount
    };
  });
  const wsJurnal = XLSX.utils.json_to_sheet(jurnalRows);

  // 5. Sheet Ringkasan 50/30/20
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['ANALISIS BUDGETING 50/30/20', monthLabel(currentMonth)],
    [],
    ['Pilar', 'Realisasi', 'Persentase', 'Target Ideal'],
    ['Kebutuhan Pokok', data.kebutuhan, `${data.pctKebutuhan}%`, '50%'],
    ['Keinginan & Belanja', data.keinginan, `${data.pctKeinginan}%`, '30%'],
    ['Tabungan & Darurat', data.tabungan, `${data.pctTabungan}%`, '20%']
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsKas, 'Kas Masuk-Keluar');
  XLSX.utils.book_append_sheet(wb, wsLaba, 'Laba Rugi');
  XLSX.utils.book_append_sheet(wb, wsNeraca, 'Neraca');
  XLSX.utils.book_append_sheet(wb, wsJurnal, 'Jurnal Umum');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Budget 50-30-20');

  XLSX.writeFile(wb, `gwcatat-v2-${currentMonth}.xlsx`);
  showDynamicIsland('File Excel 5 Sheet berhasil diunduh! 📥', 'success');
}

function exportJSONBackup() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `gwcatat-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showDynamicIsland('Cadangan JSON berhasil disimpan! 💾', 'success');
}

function importJSONBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        saveTransactions(imported);
        renderAll();
        showDynamicIsland(`Berhasil memulihkan ${imported.length} transaksi! ✨`, 'success');
      } else {
        showDynamicIsland('Format file JSON tidak valid', 'error');
      }
    } catch (err) {
      showDynamicIsland('Gagal membaca file JSON', 'error');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (!confirm('PERINGATAN: Semua data transaksi akan dihapus dari penyimpanan browser ini. Lanjutkan?')) return;
  saveTransactions([]);
  renderAll();
  showDynamicIsland('Seluruh data berhasil direset bersih', 'warning');
}

function loadSampleData() {
  const demo = generateDemoTransactions();
  saveTransactions(demo);
  renderAll();
  showDynamicIsland('Data contoh lengkap berhasil dimuat! 🎉', 'success');
}

// =================== 10. TEMA & NAVIGASI ===================
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
  renderCharts(getMonthData(currentMonth));
  showDynamicIsland(`Mode ${next === 'dark' ? 'Gelap' : 'Terang'} aktif`, 'success');
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function switchTab(tabId) {
  activeTab = tabId;

  // Toggle view containers
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${tabId}`);
  });

  // Toggle bottom bar tabs
  document.querySelectorAll('.tab-bar-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Toggle desktop tabs
  document.querySelectorAll('.desktop-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Month Navigation (‹ Bulan Lalu | Bulan Depan ›)
function changeMonth(delta) {
  const [y, m] = currentMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const nextY = d.getFullYear();
  const nextM = String(d.getMonth() + 1).padStart(2, '0');
  currentMonth = `${nextY}-${nextM}`;
  renderAll();
}

// =================== 11. BOOTSTRAP INISIALISASI ===================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  transactions = loadTransactions();
  renderAll();

  // Event Listeners: Filter Segmented Control di Transaksi
  document.querySelectorAll('.tx-filter-segment').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tx-filter-segment').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      txFilterType = this.dataset.filter;
      renderTransactionsPage();
    });
  });

  // Event Listener: Search Bar
  const searchInput = document.getElementById('txSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      txSearchKeyword = this.value;
      renderTransactionsPage();
    });
  }

  // Keyboard Shortcuts: 'n' untuk transaksi baru
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'n' || e.key === 'N') {
      openAddModal('out');
    }
  });

  console.log('gwcatat v2 siap dijalankan secara lokal!');
});
