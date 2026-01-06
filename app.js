/* One-Line Journal — app.js
   - Saves one entry per day (ISO date)
   - Supports hashtags (#work #mead)
   - Search by tag/word
   - History list
   - Export JSON
   - Facts + quotes (50/50)
   - Theme toggle (dark → light → gold, remembers)
*/

const $ = (sel) => document.querySelector(sel);

const STORAGE_KEY = "oneLineJournal.entries.v1";
const THEME_KEY = "oneLineJournal.theme.v2";

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
  themeBtn: $("#btnTheme"),
};

const QUOTES = [
  `What you repeat becomes what you believe.`,
  `A small honest line is still a whole truth.`,
  `Write it gently. Keep it anyway.`,
  `One quiet line from today.`,
  `Something today wants remembering.`,
  `Just breathe.`,
  `A single thought worth keeping.`,
  `Open your eyes.`,
  `Remember the little things.`,
  `You don’t have to finish everything you start.`,
  `Pay attention to what you’re drawn to.`,
  `Most things don’t need fixing.`,
  `Not everything needs a response.`,
  `It’s allowed to be unfinished.`,
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

/* ---------- Theme ---------- */
const THEMES = ["dark", "light", "gold"];

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
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
function renderEntries(entriesObj, filterQuery = "") {
  const all = Object.entries(entriesObj)
    .map(([date, entry]) => ({ date, ...entry }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const q = (filterQuery || "").trim().toLowerCase();
  let filtered = all;

  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    filtered = all.filter((item) => {
      const text = (item.text || "").toLowerCase();
      const tags = (item.tags || []).map((t) => t.toLowerCase());
      return terms.every((term) => {
        if (term.startsWith("#")) return tags.includes(term);
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
  setStatus(entries[iso]?.text ? `Saved ✓ (${iso})` : `Not saved yet (${iso})`);
}

/* ---------- Actions ---------- */
function saveToday() {
  const text = (els.todayInput?.value || "").trim();
  if (!text) {
    setStatus("Write one line first 🙂");
    return;
  }

  const entries = loadAll();
  const iso = todayISO();
  entries[iso] = {
    text,
    tags: extractTags(text),
    updatedAt: new Date().toISOString(),
  };

  saveAll(entries);
  setStatus(`Saved ✓ (${iso})`);
  showHistory();
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
  if (els.results) els.results.innerHTML = renderEntries(entries, els.searchInput?.value || "");
}

function clearSearch() {
  if (els.searchInput) els.searchInput.value = "";
  showHistory();
}

function runSearch() {
  showHistory();
}

function exportData() {
  const entries = loadAll();
  const payload = { exportedAt: new Date().toISOString(), entries };

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

/* ---------- Bind + Init ---------- */
function bind() {
  els.saveBtn?.addEventListener("click", saveToday);
  els.loadBtn?.addEventListener("click", loadToday);
  els.exportBtn?.addEventListener("click", exportData);
  els.historyBtn?.addEventListener("click", showHistory);
  els.searchInput?.addEventListener("input", runSearch);
  els.clearSearchBtn?.addEventListener("click", clearSearch);
  els.themeBtn?.addEventListener("click", toggleTheme);

  // Ctrl/Cmd+Enter = save
  els.todayInput?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveToday();
  });
}

function init() {
  initTheme();
  pickQuote();
  bind();
  updateSavedState();
  showHistory();
}

init();
