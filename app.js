// --- DOM Elements ---
const els = {
  todayInput: document.getElementById('todayLine'),
  saveBtn: document.getElementById('btnSave'),
  loadBtn: document.getElementById('btnLoad'),
  exportBtn: document.getElementById('btnExport'),
  importBtn: document.getElementById('btnImport'),
  // Add other DOM elements as needed
};

/* ---------- Date helpers (local ISO yyyy-mm-dd) ---------- */
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------- Storage ---------- */
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

/* ---------- Tags ---------- */
function extractTags(text) {
  const matches = (text || "").match(/#[\p{L}\p{N}_-]+/gu) || [];
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

/* ---------- Mood (Cup) ---------- */
function getMood() {
  const moods = ['empty', 'full', 'overflowing'];
  return moods[Math.floor(Math.random() * moods.length)];
}

// ...existing code...
  "Elephants have rituals for mourning the dead — they return to bones years later.",
  // History & Oddities
  "Cleopatra lived closer to the invention of the iPhone than to the pyramids being built.",
  "The first alarm clocks only rang at one time (4am), for farmers.",
  "Medieval jesters could tell the king the truth without being killed — comedy has always been a loophole.",
  "In Rome, purple dye was so expensive that an emperor banned anyone else from wearing it.",
  "Paper money originated in China 1,400 years ago because metal coins were too heavy to carry.",
  // Existing (short) facts
  `Sharks existed before trees.`,
  `Some sharks are older than the rings of Saturn.`,
  `Pigeons were once used to guide missiles.`,
  `Octopuses have three hearts and still get overwhelmed.`,
  `A group of flamingos is called a flamboyance.`,
  `Octopuses can taste with their arms.`,
  `Bees can recognise human faces.`,
  `Some turtles breathe through their butts.`,
  `Wombat poop is cube-shaped.`,
  `Butterflies remember being caterpillars.`,
  `Rats laugh when tickled.`,
  `Ants hold funerals.`,
  `Sloths can hold their breath longer than dolphins.`,
  `Elephants know when bones are bones.`,
  `Saturn could float in water if you had a big enough ocean.`,
  `Light from some stars started travelling before humans existed.`,
  `Time moves slightly faster at the top of your head than your feet.`,
  `You are made of atoms formed in dying stars.`,
  `Space smells faintly of burnt steak.`,
  `Venus flytraps can count.`,
  `Neutron stars are so dense a teaspoon would weigh billions of tonnes.`,
  `There are galaxies we will never be able to reach.`,
  `The universe is expanding and nothing is slowing it down.`,
  `Oxford University is older than the Aztec Empire.`,
  `The Eiffel Tower grows in summer.`,
  `Humans glow faintly in the dark.`,
  `Bananas are radioactive.`,
  `The shortest war lasted under an hour.`,
  `Music can reduce the sensation of pain.`,
  `Your brain predicts the next note before it happens.`,
  `Some songs feel nostalgic even the first time you hear them.`,
  `Fonts can change how things taste.`,
  `Silence in music is intentional.`,
  `Stories change when retold, even by the same person.`,
  `Noticing is a skill.`,
  `Facts can feel like secrets.`,
  `Curiosity counts as attention.`,
  `Learning something small can change the day.`,
  `Not everything meaningful is emotional.`,
  `Sometimes the world just hands you a strange detail.`
// end FACTS array

async function searchEntries(query) {
  const entries = loadAll();
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    return Object.entries(entries)
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) => (b.createdAt || b.updatedAt || '').localeCompare(a.createdAt || a.updatedAt || ''));
  }
  const terms = q.split(/\s+/).filter(Boolean);
  return Object.entries(entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .filter((item) => {
      const content = (item.content || "").toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase());
      return terms.every((term) => {
        if (term.startsWith("#")) return tags.includes(term);
        return content.includes(term) || tags.some(t => t.includes(term));
      });
    })
    .sort((a, b) => (b.createdAt || b.updatedAt || '').localeCompare(a.createdAt || a.updatedAt || ''));
}

async function deleteFromDisplay(id) {
  const confirmed = confirm('Remove this entry from display? (It will still be searchable)');
  if (!confirmed) return;

  const entries = loadAll();
  if (entries[id]) {
    entries[id].isDeleted = true;
    saveAll(entries);
    // keep silent when removing from display
    setStatus('');
    showHistory();
  }
}

/* ---------- Actions ---------- */
async function saveToday() {
  const content = (els.todayInput?.value || "").trim();
  if (!content) {
    setStatus("Write one line first 🙂");
    return;
  }

  const tags = extractTags(content);
  const date = todayISO();

  // saveEntry will create a timestamp id and record the ISO date internally
  await saveEntry(todayISO(), content, true, tags, selectedMood);
  setStatus(`Saved ✓ (${date})`);
  if (els.todayInput) els.todayInput.value = "";
  showHistory();
}

async function loadToday() {
  const date = todayISO();
  const entry = await getEntry(date);

  if (entry) {
    if (els.todayInput) els.todayInput.value = entry.content;
    setStatus(`Loaded today (${date})`);
  } else {
    setStatus(`No entry for today yet (${date})`);
  }
}

async function showHistory() {
  const entries = await getPublicEntries();
  const entriesObj = {};
  entries.forEach((e, idx) => { entriesObj[`${e.id || e.date}__${idx}`] = e; });
  
  if (els.results) {
    els.results.innerHTML = renderEntries(entriesObj, els.searchInput?.value || "", false);
  }
}

async function runSearch() {
  const query = (els.searchInput?.value || "").trim();
  if (!query) {
    showHistory();
    return;
  }

  console.debug && console.debug('runSearch()', { query });
  const results = await searchEntries(query);
  const entriesObj = {};
  results.forEach((e, idx) => { entriesObj[`${e.id || e.date}__${idx}`] = e; });
  
  if (els.results) {
    // results are already filtered by searchEntries — avoid re-filtering here
    els.results.innerHTML = renderEntries(entriesObj, "", true);
  }
}

async function showAllProtected() {
  const attempt = prompt('Enter password to view all entries:');
  if (attempt === null) return; // cancelled
  if (attempt === SHOW_ALL_PASSWORD) {
    showAllHistory();
  } else {
    alert('Wrong password');
  }
}

async function permanentDelete(id) {
  const confirmed = confirm('Permanently delete this entry? This cannot be undone.');
  if (!confirmed) return;

  const entries = loadAll();
  if (entries[id]) {
    delete entries[id];
    saveAll(entries);
    setStatus('');
    // refresh show-all view
    showAllHistory();
  }
}

async function showAllHistory() {
  // Render every entry, including those marked deleted
  const entries = loadAll();
  const entriesObj = {};
  Object.entries(entries).forEach(([id, entry]) => { entriesObj[id] = { id, ...entry }; });
  if (els.results) {
    els.results.innerHTML = renderEntries(entriesObj, els.searchInput?.value || "", true);
  }
}

function clearSearch() {
  if (els.searchInput) els.searchInput.value = "";
  showHistory();
}

async function exportData() {
  const entries = loadAll();
  // Only export date and content
  const minimalEntries = Object.values(entries).map(e => ({ date: e.date, content: e.content }));
  const payload = {
    exportedAt: new Date().toISOString(),
    entries: minimalEntries,
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
        const entries = data.entries || {};
        saveAll(entries);
        setStatus(`Imported ${Object.keys(entries).length} entries ✓`);
        showHistory();
      } catch (err) {
        setStatus(`Import failed: Invalid JSON`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}


/* ---------- Bind + Init ---------- */
function bind() {
  // Save today's entry
  els.saveBtn?.addEventListener("click", saveToday);
  // Load today's entry
  els.loadBtn?.addEventListener("click", loadToday);
  // Export all entries
  els.exportBtn?.addEventListener("click", exportData);
  // Import all entries
  const importBtn = document.getElementById('btnImport');
  if (importBtn) importBtn.addEventListener('click', importData);
  // Show history
  els.historyBtn?.addEventListener("click", showHistory);
  // Show all (password protected)
  els.showAllBtn?.addEventListener("click", showAllProtected);
  // Search input
  els.searchInput?.addEventListener("input", runSearch);
  // Clear search
  els.clearSearchBtn?.addEventListener("click", clearSearch);
  // Theme toggle
  els.themeBtn?.addEventListener("click", toggleTheme);
  // Mood button clicks
  els.moodBtns?.forEach(btn => {
    btn.addEventListener("click", (e) => {
      selectedMood = btn.dataset.mood;
      els.moodBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  // Ctrl/Cmd+Enter = save
  els.todayInput?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveToday();
  });
}
