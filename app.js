// One-Line Journal v2 — Local Storage Edition
// Completely client-side. No server needed.

// ---------- Constants ----------
const STORAGE_KEY = 'oneLineJournal.entries.v2';
const THEME_KEY = 'oneLineJournal.theme';
const SHOW_ALL_PASSWORD = 'turtle'; // change if you want 🐢

// All available themes in rotation order
const THEME_ORDER = [
  'dark', 'light', 'gold',
  'robotheart-drawing', 'agendanote-paper', 'fieldballoon-photo', 'boatballoon-photo',
  'robotheart', 'agendanote', 'fieldballoon', 'boatballoon',
  'kaomoji', 'pastel', 'rainbow', 'retro', 'cosmic', 'cherry', 'mint', 'lavender',
  'coral', 'electric', 'ink', 'obsidian', 'cyberpunk', 'forest', 'ocean', 'sunset',
  'nord', 'dracula', 'abyss', 'void', 'black-gold', 'midnight', 'glow',
  'wine', 'silver', 'glow-sunset', 'deep-ocean'
];

// ---------- DOM Elements ----------
const els = {
  todayInput: document.getElementById('todayLine'),
  saveBtn: document.getElementById('btnSave'),
  loadBtn: document.getElementById('btnLoad'),
  exportBtn: document.getElementById('btnExport'),
  importBtn: document.getElementById('btnImport'),
  searchInput: document.getElementById('search'),
  clearSearchBtn: document.getElementById('btnClearSearch'),
  historyBtn: document.getElementById('btnHistory'),
  showAllBtn: document.getElementById('btnShowAll'),
  results: document.getElementById('results'),
  status: document.getElementById('status'),
  themeBtn: document.getElementById('btnTheme'),
  moodBtns: Array.from(document.querySelectorAll('.mood-btn') || []),
  quoteText: document.getElementById('quoteText')
};

let selectedMood = 'full'; // matches default active in HTML

// ---------- Date helpers ----------
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------- Storage ----------
function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

// ---------- Tags ----------
function extractTags(text) {
  const matches = (text || '').match(/#[\p{L}\p{N}_-]+/gu) || [];
  return [...new Set(matches.map(t => t.toLowerCase()))];
}

// ---------- Mood icons ----------
function getMoodIcon(mood) {
  if (mood === 'empty') return '🥣 empty';
  if (mood === 'overflowing') return '☕ overflowing';
  return '🍵 full';
}

// ---------- Quote animation (no content change) ----------
function nudgeQuote() {
  if (!els.quoteText) return;
  els.quoteText.classList.remove('nudge-animate');
  void els.quoteText.offsetWidth; // force reflow
  els.quoteText.classList.add('nudge-animate');
}

// ---------- Status ----------
function setStatus(msg) {
  if (els.status) els.status.textContent = msg || '';
}

// ---------- ID generator ----------
function generateId() {
  return `${new Date().toISOString()}_${Math.random().toString(16).slice(2, 8)}`;
}

// ---------- Core Entry API ----------
function saveEntry(dateISO, content, isPrivate = false, tags = [], mood = 'full') {
  const all = loadAll();
  const now = new Date().toISOString();
  const id = generateId();

  all[id] = {
    id,
    date: dateISO,
    content,
    isPrivate: !!isPrivate,
    isDeleted: false,
    tags: Array.isArray(tags) ? tags : [],
    mood: mood || 'full',
    createdAt: now,
    updatedAt: now
  };

  saveAll(all);
  return id;
}

function getEntry(dateISO) {
  const all = loadAll();
  const list = Object.values(all).filter(e => e.date === dateISO && !e.isDeleted);
  if (!list.length) return null;
  list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return list[0];
}

function getPublicEntries() {
  return Object.values(loadAll())
    .filter(e => !e.isDeleted && !e.isPrivate)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function getAllEntries() {
  return Object.values(loadAll())
    .filter(e => !e.isDeleted)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

// ---------- Search ----------
async function searchEntries(query) {
  const entries = loadAll();
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return Object.entries(entries).map(([id, e]) => ({ id, ...e }));
  }
  const terms = q.split(/\s+/).filter(Boolean);
  return Object.entries(entries)
    .map(([id, e]) => ({ id, ...e }))
    .filter(item => {
      const content = (item.content || '').toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase());
      return terms.every(term => {
        if (term.startsWith('#')) return tags.includes(term);
        return content.includes(term) || tags.some(t => t.includes(term));
      });
    });
}

// ---------- Delete / Privacy ----------
async function deleteFromDisplay(id) {
  if (!confirm('Remove this entry from display?')) return;
  const entries = loadAll();
  if (entries[id]) {
    entries[id].isDeleted = true;
    saveAll(entries);
    showHistory();
  }
}

async function permanentDelete(id) {
  if (!confirm('Permanently delete this entry?')) return;
  const entries = loadAll();
  delete entries[id];
  saveAll(entries);
  showAllHistory();
}

async function togglePrivacy(id) {
  const entries = loadAll();
  if (!entries[id]) return;
  entries[id].isPrivate = !entries[id].isPrivate;
  saveAll(entries);
  showAllHistory();
}

// expose to inline buttons
window.deleteFromDisplay = deleteFromDisplay;
window.permanentDelete = permanentDelete;
window.togglePrivacy = togglePrivacy;

// ---------- Rendering ----------
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderEntries(entriesObj, _q, showAllMode) {
  const entries = Object.values(entriesObj || {});
  if (!entries.length) {
    return '<p class="muted">(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ 🐢</p>';
  }

  entries.sort((a, b) => {
    const d = (b.date || '').localeCompare(a.date || '');
    if (d !== 0) return d;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  let html = '';
  for (const e of entries) {
    html += `
      <div class="result-item">
        <div class="result-date">
          <span>${escapeHtml(e.date || '')}</span>
          <span class="mood-cup">${escapeHtml(getMoodIcon(e.mood))}</span>
          ${e.isPrivate ? '<span class="badge-private">Private</span>' : ''}
          ${e.tags?.length ? `<span class="tags">${escapeHtml(e.tags.join(' '))}</span>` : ''}
        </div>
        <div class="result-content">${escapeHtml(e.content || '')}</div>
        <div class="result-actions">
          <button class="btn-small" onclick="deleteFromDisplay('${e.id}')">Remove from display</button>
          ${showAllMode ? `
            <button class="btn-small" onclick="togglePrivacy('${e.id}')">${e.isPrivate ? 'Make public' : 'Make private'}</button>
            <button class="btn-delete" onclick="permanentDelete('${e.id}')">Delete forever</button>
          ` : ''}
        </div>
      </div>`;
  }
  return html;
}

// ---------- Actions ----------
async function saveToday() {
  const content = (els.todayInput?.value || '').trim();
  if (!content) return setStatus('Write one line first 🙂');
  const tags = extractTags(content);
  const date = todayISO();
  saveEntry(date, content, false, tags, selectedMood);
  els.todayInput.value = '';
  setStatus(`Saved ✓ (${date})`);
  nudgeQuote();
  showHistory();
}

async function loadToday() {
  const date = todayISO();
  const e = getEntry(date);
  if (!e) return setStatus(`No entry for today (${date})`);
  els.todayInput.value = e.content || '';
  setStatus(`Loaded today (${date})`);
}

async function runSearch() {
  const q = (els.searchInput?.value || '').trim();
  if (!q) return showHistory();
  const results = await searchEntries(q);
  const obj = {};
  results.forEach((e, i) => (obj[`${e.id}__${i}`] = e));
  els.results.innerHTML = renderEntries(obj, '', true);
}

async function showHistory() {
  const list = getPublicEntries();
  const obj = {};
  list.forEach((e, i) => (obj[`${e.id}__${i}`] = e));
  els.results.innerHTML = renderEntries(obj, '', false);
}

async function showAllHistory() {
  const list = getAllEntries();
  const obj = {};
  list.forEach(e => (obj[e.id] = e));
  els.results.innerHTML = renderEntries(obj, '', true);
}

function showAllProtected() {
  const attempt = prompt('Enter password to view all entries:');
  if (attempt === SHOW_ALL_PASSWORD) return showAllHistory();
  if (attempt !== null) alert('Wrong password');
}

function clearSearch() {
  els.searchInput.value = '';
  showHistory();
}

// ---------- Export / Import ----------
async function exportData() {
  const entriesObj = loadAll();
  const minimal = Object.values(entriesObj).map(e => ({
    date: e.date, content: e.content, tags: e.tags,
    isPrivate: e.isPrivate, isDeleted: e.isDeleted,
    mood: e.mood, createdAt: e.createdAt, updatedAt: e.updatedAt
  }));
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), entries: minimal }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `one-line-journal-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus('Exported ✓');
}

function importData() {
  const input = document.getElementById('importFile');
  input.value = '';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const entries = Array.isArray(data.entries) ? data.entries : [];
        entries.forEach(e => {
          if (!e || !e.date || !e.content) return;
          saveEntry(e.date, e.content, !!e.isPrivate, e.tags || [], e.mood || 'full');
        });
        setStatus(`Imported ${entries.length} entries ✓`);
        showHistory();
      } catch {
        setStatus('Import failed');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ---------- Theme ----------
function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem(THEME_KEY);
  const fallback = root.getAttribute('data-theme') || 'dark';
  let current = stored || fallback;
  if (!THEME_ORDER.includes(current)) current = 'dark';
  root.setAttribute('data-theme', current);
  localStorage.setItem(THEME_KEY, current);
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'dark';
  let idx = THEME_ORDER.indexOf(current);
  if (idx < 0) idx = 0;
  const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
  root.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

// ---------- Bind + Init ----------
function bind() {
  els.saveBtn?.addEventListener('click', saveToday);
  els.loadBtn?.addEventListener('click', loadToday);
  els.exportBtn?.addEventListener('click', exportData);
  els.importBtn?.addEventListener('click', importData);
  els.historyBtn?.addEventListener('click', showHistory);
  els.showAllBtn?.addEventListener('click', showAllProtected);
  els.searchInput?.addEventListener('input', runSearch);
  els.clearSearchBtn?.addEventListener('click', clearSearch);
  els.themeBtn?.addEventListener('click', toggleTheme);

  els.moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMood = btn.dataset.mood || 'full';
      els.moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  els.todayInput?.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveToday();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bind();
  nudgeQuote();
  showHistory();
});
