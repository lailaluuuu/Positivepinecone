// One-Line Journal v2 — Local Storage Edition
// Completely client-side. No server needed.

// ---------- Constants ----------
const STORAGE_KEY = 'oneLineJournal.entries.v2';
const THEME_KEY = 'oneLineJournal.theme';
const SHOW_ALL_PASSWORD = 'turtle'; // change this if you like 🐢

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
  quoteText: document.getElementById('quoteText'),
};

let selectedMood = 'full'; // default matches the active mood button in HTML

// ---------- Date helpers (local ISO yyyy-mm-dd) ----------
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
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

// ---------- Moods ----------
function getMoodIcon(mood) {
  if (mood === 'empty') return '🥣 empty';
  if (mood === 'overflowing') return '☕ overflowing';
  return '🍵 full';
}

// ---------- Little Facts / Quote Nudge ----------
const FACTS = [
  'Sharks existed before trees.',
  'Some sharks are older than the rings of Saturn.',
  'Pigeons were once used to guide missiles.',
  'Octopuses have three hearts and still get overwhelmed.',
  'A group of flamingos is called a flamboyance.',
  'Octopuses can taste with their arms.',
  'Bees can recognise human faces.',
  'Some turtles breathe through their butts.',
  'Wombat poop is cube-shaped.',
  'Butterflies remember being caterpillars.',
  'Rats laugh when tickled.',
  'Ants hold funerals.',
  'Sloths can hold their breath longer than dolphins.',
  'Elephants have rituals for mourning the dead — they return to bones years later.',
  'Cleopatra lived closer to the invention of the iPhone than to the pyramids being built.',
  'Oxford University is older than the Aztec Empire.',
  'The Eiffel Tower grows a little in summer heat.',
  'Time moves slightly faster at the top of your head than at your feet.',
  'You are made of atoms forged in dying stars.',
  'Noticing is a skill.',
  'Learning something small can change the day.',
];

function nudgeQuote() {
  if (!els.quoteText) return;
  const base = 'Something today wants remembering.';
  const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
  els.quoteText.textContent = `“${fact || base}”`;

  // trigger soft animation
  els.quoteText.classList.remove('nudge-animate');
  // force reflow so animation can restart
  void els.quoteText.offsetWidth;
  els.quoteText.classList.add('nudge-animate');
}

// ---------- Helpers ----------
function setStatus(msg) {
  if (!els.status) return;
  els.status.textContent = msg || '';
}

function generateId() {
  // Sortable, mostly-unique id: yyyy-mm-ddThh:mm:ss.mmm + random
  return `${new Date().toISOString()}_${Math.random().toString(16).slice(2, 8)}`;
}

// ---------- Core Entry API (localStorage) ----------
function saveEntry(dateISO, content, isPrivate = false, tags = [], mood = 'full') {
  const all = loadAll();
  const now = new Date().toISOString();

  // Allow multiple entries per day: always new id
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
    updatedAt: now,
  };

  saveAll(all);
  return id;
}

function getEntry(dateISO) {
  const all = loadAll();
  const list = Object.values(all).filter(
    (e) => e.date === dateISO && !e.isDeleted
  );
  if (!list.length) return null;
  // latest updated
  list.sort(
    (a, b) =>
      (b.updatedAt || b.createdAt || '').localeCompare(
        a.updatedAt || a.createdAt || ''
      )
  );
  return list[0];
}

function getPublicEntries() {
  const all = loadAll();
  return Object.values(all)
    .filter((e) => !e.isDeleted && !e.isPrivate)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function getAllEntries() {
  const all = loadAll();
  return Object.values(all)
    .filter((e) => !e.isDeleted)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

// ---------- Search ----------
async function searchEntries(query) {
  const entries = loadAll();
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return Object.entries(entries)
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) =>
        (b.createdAt || b.updatedAt || '').localeCompare(
          a.createdAt || a.updatedAt || ''
        )
      );
  }
  const terms = q.split(/\s+/).filter(Boolean);
  return Object.entries(entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .filter((item) => {
      const content = (item.content || '').toLowerCase();
      const tags = (item.tags || []).map((t) => t.toLowerCase());
      return terms.every((term) => {
        if (term.startsWith('#')) {
          return tags.includes(term);
        }
        return (
          content.includes(term) || tags.some((t) => t.includes(term))
        );
      });
    })
    .sort((a, b) =>
      (b.createdAt || b.updatedAt || '').localeCompare(
        a.createdAt || a.updatedAt || ''
      )
    );
}

// ---------- Delete / Privacy ----------
async function deleteFromDisplay(id) {
  const confirmed = confirm(
    'Remove this entry from display? (It will still be in your backup export)'
  );
  if (!confirmed) return;

  const entries = loadAll();
  if (entries[id]) {
    entries[id].isDeleted = true;
    saveAll(entries);
    setStatus('');
    showHistory();
  }
}

async function permanentDelete(id) {
  const confirmed = confirm(
    'Permanently delete this entry? This cannot be undone.'
  );
  if (!confirmed) return;

  const entries = loadAll();
  if (entries[id]) {
    delete entries[id];
    saveAll(entries);
    setStatus('');
    showAllHistory();
  }
}

async function togglePrivacy(id) {
  const entries = loadAll();
  if (!entries[id]) return;
  entries[id].isPrivate = !entries[id].isPrivate;
  saveAll(entries);
  setStatus(entries[id].isPrivate ? 'Marked private 🔒' : 'Marked public');
  showAllHistory();
}

// Expose some functions globally for inline buttons in rendered HTML
window.deleteFromDisplay = deleteFromDisplay;
window.permanentDelete = permanentDelete;
window.togglePrivacy = togglePrivacy;

// ---------- Rendering ----------
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderEntries(entriesObj, _query, showAllMode) {
  const entries = Object.values(entriesObj || {});
  if (!entries.length) {
    return '<p class="muted">(No entries yet. Today is a good day to start.)</p>';
  }

  // sort newest first by date, then createdAt
  entries.sort((a, b) => {
    const d = (b.date || '').localeCompare(a.date || '');
    if (d !== 0) return d;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  let html = '';
  for (const entry of entries) {
    const tagsArr = Array.isArray(entry.tags) ? entry.tags : [];
    const tagsStr = tagsArr.join(' ');
    const mood = entry.mood || 'full';

    html += `
      <div class="result-item">
        <div class="result-date">
          <span>${escapeHtml(entry.date || '')}</span>
          <span class="mood-cup">${escapeHtml(getMoodIcon(mood))}</span>
          ${
            entry.isPrivate
              ? '<span class="badge-private">Private</span>'
              : ''
          }
          ${
            tagsStr
              ? `<span class="tags">${escapeHtml(tagsStr)}</span>`
              : ''
          }
        </div>
        <div class="result-content">
          ${escapeHtml(entry.content || '')}
        </div>
        <div class="result-actions">
          <button class="btn-small" onclick="deleteFromDisplay('${entry.id}')">
            Remove from display
          </button>
          ${
            showAllMode
              ? `
            <button class="btn-small" onclick="togglePrivacy('${entry.id}')">
              ${entry.isPrivate ? 'Make public' : 'Make private'}
            </button>
            <button class="btn-delete" onclick="permanentDelete('${entry.id}')">
              Delete forever
            </button>`
              : ''
          }
        </div>
      </div>
    `;
  }
  return html;
}

// ---------- Actions ----------
async function saveToday() {
  const content = (els.todayInput?.value || '').trim();
  if (!content) {
    setStatus('Write one line first 🙂');
    return;
  }

  const tags = extractTags(content);
  const date = todayISO();

  // default: public (not private)
  saveEntry(date, content, false, tags, selectedMood);
  setStatus(`Saved ✓ (${date})`);
  if (els.todayInput) els.todayInput.value = '';
  nudgeQuote();
  showHistory();
}

async function loadToday() {
  const date = todayISO();
  const entry = getEntry(date);

  if (entry && els.todayInput) {
    els.todayInput.value = entry.content || '';
    setStatus(`Loaded today (${date})`);
  } else {
    setStatus(`No entry for today yet (${date})`);
  }
}

async function showHistory() {
  const entries = getPublicEntries();
  const entriesObj = {};
  entries.forEach((e, idx) => {
    entriesObj[`${e.id || e.date}__${idx}`] = e;
  });

  if (els.results) {
    els.results.innerHTML = renderEntries(
      entriesObj,
      els.searchInput?.value || '',
      false
    );
  }
}

async function runSearch() {
  const query = (els.searchInput?.value || '').trim();
  if (!query) {
    showHistory();
    return;
  }

  const results = await searchEntries(query);
  const entriesObj = {};
  results.forEach((e, idx) => {
    entriesObj[`${e.id || e.date}__${idx}`] = e;
  });

  if (els.results) {
    // results already filtered; don’t filter again here
    els.results.innerHTML = renderEntries(entriesObj, '', true);
  }
}

async function showAllProtected() {
  const attempt = prompt('Enter password to view all entries:');
  if (attempt === null) return;
  if (attempt === SHOW_ALL_PASSWORD) {
    showAllHistory();
  } else {
    alert('Wrong password');
  }
}

async function showAllHistory() {
  const entries = getAllEntries();
  const entriesObj = {};
  entries.forEach((e) => {
    entriesObj[e.id] = e;
  });
  if (els.results) {
    els.results.innerHTML = renderEntries(
      entriesObj,
      els.searchInput?.value || '',
      true
    );
  }
}

function clearSearch() {
  if (els.searchInput) els.searchInput.value = '';
  showHistory();
}

// ---------- Export / Import ----------
async function exportData() {
  const entriesObj = loadAll();
  const minimalEntries = Object.values(entriesObj).map((e) => ({
    date: e.date,
    content: e.content,
    tags: e.tags || [],
    isPrivate: !!e.isPrivate,
    isDeleted: !!e.isDeleted,
    mood: e.mood || 'full',
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
  const payload = {
    exportedAt: new Date().toISOString(),
    entries: minimalEntries,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `one-line-journal-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  setStatus('Exported ✓ (downloaded JSON)');
}

function importData() {
  const input = document.getElementById('importFile');
  if (!input) return;
  input.value = '';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const entries = Array.isArray(data.entries) ? data.entries : [];
        entries.forEach((e) => {
          if (!e || !e.date || !e.content) return;
          const tags = Array.isArray(e.tags)
            ? e.tags
            : extractTags(e.content || '');
          saveEntry(
            e.date,
            e.content,
            !!e.isPrivate,
            tags,
            e.mood || 'full'
          );
        });
        setStatus(`Imported ${entries.length} entries ✓`);
        showHistory();
      } catch (err) {
        console.error(err);
        setStatus('Import failed: Invalid JSON');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ---------- Theme ----------
function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const root = document.documentElement;
  const current = stored || root.getAttribute('data-theme') || 'dark';
  root.setAttribute('data-theme', current);
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'dark';
  let next = 'light';
  if (current === 'light') next = 'gold';
  else if (current === 'gold') next = 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

// ---------- Bind + Init ----------
function bind() {
  // Save today's entry
  els.saveBtn?.addEventListener('click', saveToday);
  // Load today's entry
  els.loadBtn?.addEventListener('click', loadToday);
  // Export all entries
  els.exportBtn?.addEventListener('click', exportData);
  // Import all entries
  els.importBtn?.addEventListener('click', importData);
  // Show history
  els.historyBtn?.addEventListener('click', showHistory);
  // Show all (password protected)
  els.showAllBtn?.addEventListener('click', showAllProtected);
  // Search input
  els.searchInput?.addEventListener('input', runSearch);
  // Clear search
  els.clearSearchBtn?.addEventListener('click', clearSearch);
  // Theme toggle
  els.themeBtn?.addEventListener('click', toggleTheme);
  // Mood button clicks
  if (els.moodBtns && els.moodBtns.length) {
    els.moodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedMood = btn.dataset.mood || 'full';
        els.moodBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  // Ctrl/Cmd+Enter = save
  els.todayInput?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveToday();
    }
  });
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bind();
  nudgeQuote();
  showHistory();
});
