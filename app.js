/* One-Line Journal — app.js (v2 - Local Storage + File Export)
   - Saves entries to browser localStorage (private/searchable)
   - Privacy controls: mark entries as private
   - Entries can be deleted from display but remain searchable
   - Theme toggle (dark → light → gold, remembers)
   - Full-text search across all entries
   - Import/Export JSON for backup
*/

const $ = (sel) => document.querySelector(sel);

const STORAGE_KEY = "oneLineJournal.entries.v2";
const THEME_KEY = "oneLineJournal.theme.v2";

// Password for viewing all entries (client-side only). Change as you like.
const SHOW_ALL_PASSWORD = "letmein";

let selectedMood = "full"; // Default mood selection

const els = {
  todayInput: $("#todayLine"),
  saveBtn: $("#btnSave"),
  loadBtn: $("#btnLoad"),
  exportBtn: $("#btnExport"),
  historyBtn: $("#btnHistory"),
  status: $("#status"),
  showAllBtn: $("#btnShowAll"),
  searchInput: $("#search"),
  clearSearchBtn: $("#btnClearSearch"),
  results: $("#results"),
  quote: $("#quoteText"),
  themeBtn: $("#btnTheme"),
  moodBtns: document.querySelectorAll(".mood-btn"),
};

const QUOTES = [
  `Track the things you can’t ignore.`,
  `What you repeat becomes what you believe.`,
  `Brief doesn’t mean untrue.`,
  `Write it gently. Keep it anyway.`,
  `One quiet line from today.`,
  `Something today wants remembering.`,
  `Just breathe.`,
  `A single thought worth keeping.`,
  `Open your eyes.`,
  `Remember the little things.`,
  `My unfinished things aren’t abandoned, they’re mid-air.`,
  `Stopping for breath is still progress.`,
  `Not everything needs finishing.`,
  `Pay attention to what you’re drawn to.`,
  `Most things don’t need fixing.`,
  `Not everything needs a response.`,
  `Follow what wakes you up.`,
  `Some days are for maintenance.`,
  `You can move slowly and still arrive.`,
  `This is enough for today.`,
  `Be where your feet are.`,
  `Look around you.`,
  `Nothing is wasted if you noticed it.`,
  `You are shiny.`,
  `Rest is not a reward.`,
  `You’re allowed to pause.`,
  `Small things count more often than big ones.`,
  `Gentle is a legitimate strategy.`,
  `You don’t need permission to care less.`,
  `It’s okay to want a quieter life.`,
  `Turns out, that mattered.`,
  `This wasn’t nothing.`,
  `That stayed longer than expected.`,
  `Some things only make sense later.`,
  `I didn’t plan for this.`,
  `This wasn’t the point, but it mattered.`,
  `That’s going in the mental footnotes.`,
  `Interesting. Noted.`,
  `What you notice says more than what you plan.`,
  `Memory is selective for a reason.`,
  `Most meaning is accidental.`,
  `You become what you pay attention to.`,
  `There’s always more going on than you think.`,
  `Some things are only clear in hindsight.`,
  `Attention is a form of care.`,
  `Time reveals patterns.`,
  `Noted.`,
  `Still thinking about it.`,
  `That lingered.`,
  `But, how did it make you feel?`,
  `Worth keeping.`,
  `Do you feel alive?`,
  `This came back.`,
  `Nothing urgent.`,
  `Unfinished.`,
  `Something clicked.`,
  `Didn’t disappear.`,
  `Held.`,
  `Still there.`,
  `That landed.`,
  `No rush.`,
  `Enough.`,
  `Carried forward.`,
  `Stuck with me.`,
  `That stayed.`,
  `Unresolved, but fine.`,
  `Not nothing.`,
  `Filed.`,
  `Observed.`,
  `Left a mark.`,
  `Pay attention.`,
  `Nothing happens by accident.`,
  `Most things reveal themselves slowly.`,
  `You don’t notice everything the first time.`,
  `This wasn’t obvious at the time.`,
  `Some things only make sense later.`,
  `Patterns matter more than moments.`,
  `What you ignore shapes you.`,
  `Not everything needs interpretation.`,
  `Clarity comes after movement.`,
  `Silence is information.`,
  `You already know more than you think.`,
  `What repeats is worth watching.`,
  `Time is the real editor.`,
  `Things settle when you stop forcing them.`,
  `Attention changes outcomes.`,
  `Interesting isn’t neutral.`,
  `Distance clarifies.`,
  `Nothing real is rushed.`,
  `You don’t need the whole picture.`,
  `Meaning accumulates.`,
  `What lasts is usually quiet.`,
  `Most change is incremental.`,
  `This will look different tomorrow.`,
  `Hold off on conclusions.`,
  `What feels small now may not stay that way.`,
  `Notice what you return to.`,
  `Some decisions are made gradually.`,
  `What you keep says something.`,
  `Time tests everything.`,
  `Consistency outperforms intensity.`,
  `Let things unfold.`,
  `Small joys always pay in interest.`,
`Sometimes the best apology is showing up differently.`,
`One quiet act of care can change someone’s entire week.`,
`You don’t need to be loud to be powerful.`,
`Healing isn’t linear — it’s noodles.`,
`There is no such thing as wasted kindness.`,
`Confidence is mostly remembering that everyone else is winging it too.`,
`Love is often measured in the things you don’t advertise.`,
`You are allowed to be a beginner at the things you want.`,
`Peace feels suspicious until you’re used to it.`,
`Closure is just the moment you stop arguing with the past.`,
`If it feels too late, it’s probably the perfect time.`,
`Soft isn’t weak. Soft is precision.`,
`You don’t find your people — you recognise them.`,
`The right person won’t need you to shrink.`,
`It’s okay if you’re rebuilding.`,
`Some days are for collecting energy, not using it.`,
`Rest is productive when nothing else is.`,
`You get better without noticing — slowly, then suddenly.`,
`You are not meant to feel the same every day.`,


];

const FACTS = [
  `Sharks existed before trees.`,
  `Some sharks are older than the rings of Saturn.`,
  `Pigeons were once used to guide missiles.`,
  `Octopuses have three hearts and still get overwhelmed.`,
  `Crows remember faces for years.`,
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
  `There are more stars in the universe than grains of sand on Earth.`,
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
  `Cleopatra lived closer to the moon landing than the pyramids.`,
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
  `Sometimes the world just hands you a strange detail.`,
  `The Milky Way is moving through space at 1.3 million mph.`,
`Black holes warp time as well as space.`,
`Saturn would float in water.`,
`Compressed to a black hole, Earth would be the size of a pea.`,
`The universe has no centre because space expands everywhere.`,
`The northern lights are painted by solar particles and Earth’s magnetic field.`,
`Space smells like burnt metal and welding fumes.`,
`There are more stars in the universe than grains of sand on Earth.`,
`A single grain of sand contains more atoms than stars in the universe.`,
`Tears have different chemistry depending on emotion.`,
`Humans are the only animals that blush.`,
`The brain isn’t fully developed until around age 25.`,
`We take roughly 23,000 breaths per day.`,
`Memory is reconstructed every time we recall it.`,
`The body glows faintly with bioluminescence.`,
`Hands and cheeks flush when we like someone.`,
`Crows remember faces and hold grudges for years.`,
`Dolphins have names for each other.`,
`Octopuses dream and change colour while doing it.`,
`Sloths poop once a week and risk predators to do it.`,
`Sea otters hold hands when they sleep.`,
`Elephants mourn their dead and revisit bones.`,
`Cleopatra lived closer to the iPhone than the pyramids.`,
`The first alarm clocks rang only at 4am.`,
`Medieval jesters used humour as a diplomatic loophole.`,
`Roman emperors restricted who could wear purple dye.`,
`Paper money began in China 1,400 years ago.`,

];

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

function getMoodEmoji(mood) {
  const emojis = {
    empty: '🕳️',
    full: '�',
    overflowing: '☀️'
  };
  return emojis[mood] || '🕳️';
}

/* ---------- Theme ---------- */
const THEMES = [
  "dark", "light", "gold", "obsidian", "cyberpunk", "forest", "ocean", "sunset", "nord", "dracula",
  "abyss", "void", "black-gold", "pastel", "rainbow", "retro", "cosmic", "cherry", "mint", "lavender",
  "coral", "electric", "ink", "midnight", "glow", "wine", "silver", "glow-sunset", "deep-ocean", "kaomoji"
];

const KAOMOJIS = [
  // Cute
  '♡', '⊹', '₊', '.♡', '‧₊˚.', '· ˚⊹', '⋆',
  '╭◜◝ ͡ ◜◝╮', '⋆╭◜◝ ͡ ◜◝╮. ⊹',
  '( .◜◡◝     )♡', '( .◜◡◝     ) ₊ ♡',
  '╰◟◞ ͜ ◟◞╭◜◝ ͡ ◜◝╮ ͜ ◟◞╯.  ⊹ ⋆',
  '.  ⋆ ♡︎ ⊹ ( .◜◡◝      ) ₊  . ⊹ ♡',
  '₊ 　⋆      ╰◟◞ ͜ ◟◞╯  . ⊹ ⋆♡ . ⊹',
  '• (๑˃ᴗ˂)ﻭ', '• (•̤̀ᵕ•̤́๑)♡', '• (づ｡◕‿‿◕｡)づ', '• ( ´ ꒳ ` )੭', '• ( ˘͈ ᵕ ˘͈♡)',
  // Smug / cheeky
  '• (ᵔ ᵕ ᵔ)✧', '• (¬‿¬ )', '• (￣﹃￣)', '• (≖‿≖ )', '• (๑˃́ε˂̀๑ )',
  // Chaotic energy
  '• (⊙_◎)', '• (°ロ°) !?', '• (ﾉಥ益ಥ)ﾉ', '• (╯°□°)╯︵ ┻━┻', '• (☉｡☉)!',
  // Soft / wholesome
  '• ( ˘͈ ᵕ ˘͈ )', '• (っ´▽)っ', '• (´｡• ω •｡)', '• ⊹(｡•́‿•̀｡)⊹', '• (ෆ˙ᵕ˙ෆ)',
  // Flirty / teasing
  '• ( ͡° ͜ʖ ͡°)', '• ( •͈ᴗ•͈)', '• (๑ˊ͈ ꇴ ˋ͈)', '• (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)', '• ( ˵ ͡° ͜ʖ ͡°˵ )',
  // Sleepy / tired
  '• ( -_-) zzz', '• (。-ω-)zzz', '• (｡•́︿•̀｡)', '• (︶ω︶)', '• (´-﹏-`；)',
  // Existential / dramatic
  '• (￣□￣」)', '• (◎_◎;)', '• (ಥ﹏ಥ)', '• (Ｔ▽Ｔ)', '• (´；д；`)',
];

function showKaomojiBanner() {
  let banner = document.getElementById('kaomojiBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'kaomojiBanner';
    banner.style.textAlign = 'center';
    banner.style.fontSize = '1.5em';
    banner.style.margin = '10px 0 20px 0';
    banner.style.lineHeight = '2';
    banner.style.userSelect = 'text';
    document.body.prepend(banner);
  }
  banner.innerHTML = KAOMOJIS.map(k => `<span style="margin:0 0.5em;">${k}</span>`).join('');
}

function hideKaomojiBanner() {
  const banner = document.getElementById('kaomojiBanner');
  if (banner) banner.remove();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (theme === "kaomoji") {
    showKaomojiBanner();
  } else {
    hideKaomojiBanner();
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (THEMES.includes(saved)) applyTheme(saved);
  else applyTheme("dark");
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "dark";
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

/* ---------- Quote / Fact (50/50) ---------- */
function pickNudge() {
  // 50% quotes, 50% facts
  const useQuote = Math.random() < 0.5;
  return useQuote
    ? QUOTES[Math.floor(Math.random() * QUOTES.length)]
    : FACTS[Math.floor(Math.random() * FACTS.length)];
}

function pickQuote() {
  if (!els.quote) return;

  // re-trigger subtle animation
  els.quote.classList.remove("nudge-animate");
  void els.quote.offsetWidth;
  els.quote.classList.add("nudge-animate");

  els.quote.textContent = pickNudge();
}

/* ---------- UI helpers ---------- */
function setStatus(msg) {
  if (els.status) els.status.textContent = msg;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- Rendering ---------- */
function renderEntries(entries, filterQuery = "", includeDeleted = false) {
  if (!entries || Object.keys(entries).length === 0) {
    return `<div class="muted">🐢</div>`;
  }

  // Convert to array and sort by creation time descending
  const entriesArray = Object.entries(entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .filter(item => includeDeleted ? true : !item.isDeleted)
    .sort((a, b) => (b.createdAt || b.updatedAt || '').localeCompare(a.createdAt || a.updatedAt || ''));

  const q = (filterQuery || "").trim().toLowerCase();

  let filtered = entriesArray;
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    filtered = entriesArray.filter((item) => {
      const content = (item.content || "").toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase());
      return terms.every((term) => {
        if (term.startsWith("#")) return tags.includes(term);
        return content.includes(term) || tags.some(t => t.includes(term));
      });
    });
  }

  if (filtered.length === 0) {
    return `<div class="muted">No matches — try #work or quiet</div>`;
  }

  return filtered
    .map((item) => {
      const privacyBadge = item.isPrivate ? `<span class="badge-private">🔒 Private</span>` : '';
      const tagsHtml = item.tags && item.tags.length > 0 ? `<span class="tags">${item.tags.map(t => escapeHtml(t)).join(' ')}</span>` : '';
      const moodEmoji = getMoodEmoji(item.mood || 'full');
      return `
        <div class="result-item" data-entry-id="${escapeHtml(item.id)}">
          <div class="result-date">${escapeHtml(item.date)} <span class="mood-cup">${moodEmoji}</span> ${tagsHtml} ${privacyBadge}</div>
          <div class="result-content">${escapeHtml(item.content)}</div>
          <div class="result-actions">
            <button class="btn-small btn-delete" onclick="deleteFromDisplay('${escapeHtml(item.id)}')">Remove from display</button>
            <button class="btn-small btn-permadelete" onclick="permanentDelete('${escapeHtml(item.id)}')">Delete permanently</button>
          </div>
        </div>
      `;
    })
    .join("");
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

/* ---------- API Calls (local storage) ---------- */
async function saveEntry(date, content, isPrivate, tags, mood = "full") {
  // Store entries by unique timestamp id so multiple entries per day are allowed.
  const entries = loadAll();
  const id = new Date().toISOString();
  entries[id] = {
    id,
    date: todayISO(),
    content,
    isPrivate: isPrivate || false,
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(/\s+/) : []),
    mood: mood || "full",
    isDeleted: false,
    createdAt: id,
    updatedAt: new Date().toISOString(),
  };
  saveAll(entries);
  return { success: true, id };
}

async function getEntry(date) {
  // Return the most recent non-deleted entry for a given ISO date (today)
  const entries = loadAll();
  const matches = Object.entries(entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .filter(e => !e.isDeleted && e.date === date)
    .sort((a, b) => (b.createdAt || b.updatedAt || '').localeCompare(a.createdAt || a.updatedAt || ''));

  return matches.length ? matches[0] : null;
}

async function getPublicEntries() {
  const entries = loadAll();
  return Object.entries(entries)
    .filter(([_, entry]) => !entry.isDeleted)
    .map(([id, entry]) => ({ id, ...entry }));
}

async function searchEntries(query) {
  const entries = loadAll();
  const searchTerm = query.toLowerCase();
  console.debug && console.debug('searchEntries()', { query, searchTerm });
  
  return Object.entries(entries)
    .filter(([id, entry]) => {
      const content = (entry.content || "").toLowerCase();
      const tags = entry.tags || [];
      return content.includes(searchTerm) || tags.some(t => t.toLowerCase().includes(searchTerm));
    })
    .map(([id, entry]) => ({ id, ...entry }))
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
  els.saveBtn?.addEventListener("click", saveToday);
  els.loadBtn?.addEventListener("click", loadToday);
  els.exportBtn?.addEventListener("click", exportData);
  els.historyBtn?.addEventListener("click", showHistory);
  els.searchInput?.addEventListener("input", runSearch);
  els.clearSearchBtn?.addEventListener("click", clearSearch);
  els.themeBtn?.addEventListener("click", toggleTheme);
  els.showAllBtn?.addEventListener("click", showAllHistory);

  // Import button
  const importBtn = document.getElementById('btnImport');
  if (importBtn) {
    importBtn.addEventListener('click', importData);
  }

  // Mood button clicks
  els.moodBtns?.forEach(btn => {
    btn.addEventListener("click", (e) => {
      selectedMood = btn.dataset.mood;
      // Update active state
      els.moodBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Ctrl/Cmd+Enter = save
  els.todayInput?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveToday();
  });
}

function init() {
  initTheme();
  pickQuote();
  bind();
  setStatus("Ready");
  loadToday();
  showHistory();
  if (document.documentElement.dataset.theme === "kaomoji") {
    showKaomojiBanner();
  }
}

init();
