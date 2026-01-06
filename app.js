/* One-Line Journal — app.js
   - Saves one entry per day (ISO date)
   - Supports hashtags (#work #mead)
   - Search by tag/word
   - History list
   - Export JSON
*/

const $ = (sel) => document.querySelector(sel);

const STORAGE_KEY = "oneLineJournal.entries.v1";

const els = {
  todayInput: $("#todayLine"),
  saveBtn: $("#btnSave"),
  loadBtn: $("#btnLoad"),
  exportBtn: $("#btnExport"),
  historyBtn: $("#btnHistory"),
  status: $("#status"),
  searchInput: $("#search"),
  clearSearchBtn: $("#btnClearSearch"),
  results: $("#results"),
  quote: $("#quoteText"),
};

const QUOTES = [
  "What you repeat becomes what you believe.",
  "A small honest line is still a whole truth.",
  "Write it gently. Keep it anyway.",
  "One quiet line from today.",
  "Something today wants remembering.",
  "A single thought worth keeping.",
];

function todayISO() {
  // local date -> yyyy-mm-dd
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

function normalizeQuery(q) {
  return (q || "").trim().toLowerCase();
}

function extractTags(text) {
  // tags like #work #quietwins
  const matches = (text || "").match(/#[\p{L}\p{N}_-]+/gu) || [];
  // unique + lowercase
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

function pickQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  if (els.quote) els.quote.textContent = q;
}

function setStatus(msg) {
  if (els.status) els.status.textContent = msg;
}

function setResults(html) {
  if (els.results) els.results.innerHTML = html;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEntries(entriesObj, filterQuery = "") {
  const all = Object.entries(entriesObj)
    .map(([date, entry]) => ({ date, ...entry }))
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  const q = normalizeQuery(filterQuery);

  let filtered = all;

  if (q) {
    const terms = q.split(/\s+/).filter(Boolean); // allow "#work #mead" or words
    filtered = all.filter((item) => {
      const text = (item.text || "").toLowerCase();
      const tags = (item.tags || []).map((t) => t.toLowerCase());
      // every term must match somewhere
      return terms.every((term) => {
        if (term.startsWith("#")) {
          return tags.includes(term);
        }
        return text.includes(term) || tags.some((t) => t.includes(term));
      });
    });
  }

  if (filtered.length === 0) {
    return `<div class="muted">No matches yet — try <b>#work</b> or <b>mead</b>.</div>`;
  }

  return filtered
    .map((item) => {
      const tags = (item.tags || []).join(" ");
      return `
        <div class="result-item">
          <div class="result-date">${escapeHtml(item.date)} ${tags ? "• " + escapeHtml(tags) : ""}</div>
          <div>${escapeHtml(item.text || "")}</div>
        </div>
      `;
    })
    .join("");
}

function updateSavedState() {
  const entries = loadAll();
  const iso = todayISO();
  if (entries[iso]?.text) {
    setStatus(`Saved ✓ (${iso})`);
  } else {
    setStatus(`Not saved yet (${iso})`);
  }
}

function saveToday() {
  const text = (els.todayInput?.value || "").trim();
  if (!text) {
    setStatus("Write one line first 🙂");
    return;
  }

  const entries = loadAll();
  const iso = todayISO();
  const tags = extractTags(text);

  entries[iso] = {
    text,
    tags,
    updatedAt: new Date().toISOString(),
  };

  saveAll(entries);
  setStatus(`Saved ✓ (${iso})`);
}

function loadToday() {
  const entries = loadAll();
  const iso = todayISO();
  const existing = entries[iso]?.text || "";
  if (els.todayInput) els.todayInput.value = existing;
  setStatus(existing ? `Loaded today (${iso})` : `No entry for today yet (${iso})`);
}

function showHistory() {
  const entries = loadAll();
  setResults(renderEntries(entries));
}

function runSearch() {
  const q = els.searchInput?.value || "";
  const entries = loadAll();
  setResults(renderEntries(entries, q));
}

function clearSearch() {
  if (els.searchInput) els.searchInput.value = "";
  const entries = loadAll();
  setResults(renderEntries(entries));
}

function exportData() {
  const entries = loadAll();
  const payload = {
    exportedAt: new Date().toISOString(),
    entries,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `one-line-journal-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  setStatus("Exported ✓ (downloaded JSON)");
}

function bind() {
  els.saveBtn?.addEventListener("click", saveToday);
  els.loadBtn?.addEventListener("click", loadToday);
  els.exportBtn?.addEventListener("click", exportData);
  els.historyBtn?.addEventListener("click", showHistory);

  els.searchInput?.addEventListener("input", runSearch);
  els.clearSearchBtn?.addEventListener("click", clearSearch);

  // Ctrl/Cmd+Enter = save
  els.todayInput?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveToday();
  });
}

function init() {
  pickQuote();
  bind();
  updateSavedState();
  showHistory();
}

init();
