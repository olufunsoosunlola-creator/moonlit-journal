/* ==========================================================================
   app.js — the app's memory (state), its actions, and how taps reach them
   --------------------------------------------------------------------------
   The whole app follows one simple loop:

       1. Everything the app knows lives in the `state` object.
       2. render() turns `state` into HTML (using the functions in screens.js).
       3. Buttons carry a data-action="…" attribute. When you tap one, the
          matching function in `actions` changes `state` and calls render().

   Text boxes carry data-field="…" instead. Typing updates `state` quietly,
   without redrawing the screen, so the keyboard never loses its place.
   ========================================================================== */

/* ---------- The state ---------- */

const TIMER_KEY = 'moonlit-journal.timer';

const state = {
  data: Storage.load(),   // your saved tables + settings (see storage.js)

  screen: 'home',         // which screen is showing
  prev: 'home',           // where "Back" goes

  // Passcode lock
  unlocked: false, pin: '', pinErr: false, newPin: '',

  // Journal
  tag: null,              // tag filter on the journal list
  readId: null,           // the entry being read
  draft: null,            // the entry being written or edited

  // Mood tracker
  calOffset: 0,           // 0 = this month, -1 = last month…
  day: null,              // the date tapped on the calendar (opens a sheet)

  // Dreams
  dreamId: null, dreamDraft: null, dreamFilter: null,

  // Prompts
  promptTheme: 'all', promptPick: null, promptLimit: 12, promptOffset: 0,

  // Study
  timer: loadTimer(), studyView: 'day', subjectInput: '',

  // Savings
  saveOffset: 0, deposit: null, goalEdit: null, bloom: false,

  // Little overlays
  quick: null,            // the quick-capture sheet
  confirm: null,          // "are you sure?" dialog
  toast: null             // the short message at the bottom
};

/* ---------- Small helpers used everywhere ---------- */

// Makes text safe to place inside HTML (so "<" in an entry can't break the page).
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function now() { return new Date(); }
function today() { return Data.ymd(now()); }
function timeNow() { const n = now(); return Data.pad(n.getHours()) + ':' + Data.pad(n.getMinutes()); }

// 'morning' (5am–noon), 'afternoon' (noon–6pm) or 'night'
function period() {
  const h = now().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

// Night palette: chosen in Settings, or automatically after 6pm.
// The Dream Journal always wears the mauve night colors.
// (The Garden glows best at dusk too, so it shares the night palette.)
const DREAM_SCREENS = ['dreams', 'dreamRead', 'dreamEdit', 'garden'];
function isNight() {
  const t = state.data.settings.theme;
  if (DREAM_SCREENS.includes(state.screen)) return true;
  if (t === 'day') return false;
  if (t === 'night') return true;
  const h = now().getHours();
  return h >= 18 || h < 5;
}

// One mood per day for the calendar. A mood from a journal entry wins over
// a quick "just a mood" check-in on the same day.
function moodByDate() {
  const map = {};
  const rows = state.data.moods.slice().sort((a, b) => (a.source === 'entry') - (b.source === 'entry'));
  rows.forEach(m => { map[m.date] = m; });
  return map;
}

// Days with any journal entry or mood in a month ("2026-10"). No streaks.
function daysJournaledIn(monthKey) {
  const d = state.data;
  const dates = d.journal_entries.map(e => e.date).concat(d.moods.map(m => m.date));
  return new Set(dates.filter(x => x.startsWith(monthKey))).size;
}

function lockOn() {
  const s = state.data.settings;
  return !!(s.lock_enabled && s.passcode);
}
const LOCKABLE = ['journal', 'reader', 'editor', 'mood'].concat(DREAM_SCREENS);
function isLocked() {
  return lockOn() && !state.unlocked && LOCKABLE.includes(state.screen);
}

// The prompt shown on tonight's home card (changes daily, or with "another").
function tonightsPrompt() {
  const R = Data.ROTATION;
  const dayNumber = Math.floor(Data.parse(today()) / 864e5);
  const i = (((dayNumber + state.promptOffset) % R.length) + R.length) % R.length;
  return Data.PROMPTS.find(p => p.id === R[i]);
}
function dailyPromptId() {
  return Data.ROTATION[Math.floor(Data.parse(today()) / 864e5) % Data.ROTATION.length];
}

/* ---------- Saving and moving around ---------- */

// Save new data to the device, redraw, and optionally show a message.
function commit(newData, message) {
  state.data = newData;
  if (!Storage.save(newData)) message = "Couldn't save on this device. Is storage full?";
  if (message) flash(message); else render();
}

let toastTimer = null;
function flash(message) {
  clearTimeout(toastTimer);
  state.toast = message;
  render();
  toastTimer = setTimeout(() => { state.toast = null; render(); }, 2600);
}

function go(screen, extra) {
  stopDictation(); // leaving a screen always stops the microphone
  if (screen !== 'garden') Garden.view.playing = false;
  state.prev = state.screen;
  state.screen = screen;
  Object.assign(state, extra || {});
  render();
  window.scrollTo(0, 0);
}

function setSetting(key, value, message) {
  const d = state.data;
  commit(Object.assign({}, d, { settings: Object.assign({}, d.settings, { [key]: value }) }), message);
}

/* ---------- Journal helpers ---------- */

function openDraft(fields) {
  go('editor', {
    draft: Object.assign({
      id: null, date: today(), time: timeNow(), title: '', body: '',
      mood: null, tags: [], tagInput: '', prompt: ''
    }, fields || {})
  });
}

function draftCanSave() {
  const dr = state.draft;
  return !!(dr && (dr.mood || dr.body.trim() || dr.title.trim()));
}

function toggleRest(date) {
  const d = state.data;
  const has = d.rest_days.some(r => r.date === date);
  const rest_days = has
    ? d.rest_days.filter(r => r.date !== date)
    : d.rest_days.concat([{ id: Data.uid(), date: date, note: '' }]);
  commit(Object.assign({}, d, { rest_days }), has ? 'Rest day removed.' : 'Rest day noted. Be easy on yourself.');
}

function addTag(text) {
  const dr = state.draft;
  const t = text.trim().replace(/^#/, '');
  dr.tagInput = '';
  if (t && !dr.tags.includes(t)) dr.tags = dr.tags.concat([t]);
  render();
  focusField('draft.tagInput');
}

function addSymbol(text) {
  const dd = state.dreamDraft;
  const t = text.trim();
  dd.symInput = '';
  if (t && !dd.symbols.includes(t)) dd.symbols = dd.symbols.concat([t]);
  render();
  focusField('dreamDraft.symInput');
}

/* ---------- Speaking a dream (speech to text) ----------
   Uses the browser's built-in speech recognition (the Web Speech API).
   Words appear in the description as you speak; you can edit them after.
   Note: the browser, not this app, turns speech into text. Chrome sends the
   audio to Google to do this, and Safari may use Apple's servers. Only the
   finished text is saved, and only on this phone. */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const dictation = { listening: false, interim: '' }; // interim = words still being heard
let recognizer = null;

function dictationSupported() { return !!SpeechRecognition; }

function startDictation() {
  recognizer = new SpeechRecognition();
  recognizer.lang = navigator.language || 'en-US';
  recognizer.continuous = true;      // keep listening through pauses
  recognizer.interimResults = true;  // show words while you're still speaking

  recognizer.onresult = event => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) appendToDream(result[0].transcript);
      else interim += result[0].transcript;
    }
    dictation.interim = interim;
    Screens.updateDictation();
  };
  recognizer.onerror = event => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      flash('Microphone access is off. You can allow it in your browser settings.');
    } else if (event.error === 'no-speech') {
      flash("I didn't hear anything. Tap the microphone to try again.");
    }
  };
  // Listening ends when you tap stop, after a long silence, or on an error.
  recognizer.onend = () => {
    dictation.listening = false;
    dictation.interim = '';
    recognizer = null;
    Screens.updateDictation();
  };

  try {
    recognizer.start();
    dictation.listening = true;
  } catch (err) {
    recognizer = null;
    flash("The microphone couldn't start. Try again in a moment.");
  }
  Screens.updateDictation();
}

function stopDictation() {
  if (recognizer) recognizer.stop();
}

// Adds a finished phrase to the end of the dream description.
function appendToDream(text) {
  const dd = state.dreamDraft;
  text = text.trim();
  if (!dd || !text) return;
  const needsSpace = dd.description && !/\s$/.test(dd.description);
  dd.description += (needsSpace ? ' ' : '') + text;
}

function focusField(name) {
  const el = document.querySelector(`[data-field="${name}"]`);
  if (el) el.focus();
}

/* ---------- Study timer ----------
   The timer remembers when it started rather than counting ticks, so it stays
   right even if the phone sleeps or the app is closed mid-session. */

function loadTimer() {
  try {
    const t = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (t && t.phase) return t;
  } catch (err) { /* start fresh */ }
  return { phase: 'focus', elapsedBefore: 0, startedAt: null };
}
function saveTimer() {
  try { localStorage.setItem(TIMER_KEY, JSON.stringify(state.timer)); } catch (err) { /* ignore */ }
}
function setTimer(t) { state.timer = t; saveTimer(); }

// Seconds that have passed in the current phase
function timerElapsed() {
  const t = state.timer;
  return t.elapsedBefore + (t.startedAt ? (Date.now() - t.startedAt) / 1000 : 0);
}
function phaseSeconds() {
  const s = state.data.settings;
  return (state.timer.phase === 'focus' ? s.study_focus : s.study_break) * 60;
}

// Keepsakes earned by total minutes studied
const KEEPSAKES = [
  { name: 'Pressed petal', need: 1,    label: 'first session', art: 'radial-gradient(ellipse 24% 40% at 42% 50%, #EDB9CB, #F4D4DE 60%, transparent 64%), radial-gradient(ellipse 22% 36% at 60% 54%, #F8D3C5, transparent 64%), #FBF4F2' },
  { name: 'Meadow daisy',  need: 60,   label: 'first hour',    art: 'url(assets/grass.jpg) 86% 58% / 520%' },
  { name: 'Crescent moon', need: 300,  label: '5 hours',       art: 'radial-gradient(circle at 60% 42%, #B892AA 0 32%, transparent 33%), radial-gradient(circle at 47% 50%, #FFF3EA 0 34%, transparent 35%), #B892AA' },
  { name: 'Glowing lily',  need: 600,  label: '10 hours',      art: 'url(assets/lily.jpg) 26% 50% / 320%' },
  { name: 'Meadow hills',  need: 1500, label: '25 hours',      art: 'url(assets/meadow.jpg) 72% 80% / 260%' },
  { name: 'Full moon',     need: 3000, label: '50 hours',      art: 'radial-gradient(circle, #FFF8F0 0 30%, #F3E3EA 40%, transparent 43%), #A8849C' },
  { name: 'Lily in bloom', need: 6000, label: '100 hours',     art: 'url(assets/lily.jpg) 80% 28% / 230%' }
];

function totalStudyMinutes() {
  return state.data.study_sessions.reduce((sum, s) => sum + Number(s.minutes || 0), 0);
}

// Save a finished study session. `when` is the moment it ended.
function logSession(minutes, when) {
  const d = state.data;
  const end = when || now();
  const before = totalStudyMinutes();
  const after = before + minutes;
  const start = new Date(end.getTime() - minutes * 60000);
  const row = {
    id: Data.uid(),
    date: Data.ymd(start),
    start_time: Data.pad(start.getHours()) + ':' + Data.pad(start.getMinutes()),
    minutes: minutes,
    subject: d.settings.study_subject || 'SQL'
  };
  const newKeepsake = KEEPSAKES.find(k => before < k.need && after >= k.need);
  commit(Object.assign({}, d, { study_sessions: d.study_sessions.concat([row]) }),
    newKeepsake ? 'A new keepsake: ' + newKeepsake.name + '.' : minutes + ' minutes kept. Time to rest.');
}

// Runs every second. Finishes a phase when its time is up, and keeps the
// ring and clock on the Study screen moving.
function tickTimer() {
  const t = state.timer;
  if (!t.startedAt) return;
  const total = phaseSeconds();
  if (timerElapsed() >= total) {
    const finishedAt = new Date(t.startedAt + (total - t.elapsedBefore) * 1000);
    if (t.phase === 'focus') {
      setTimer({ phase: 'break', elapsedBefore: 0, startedAt: null });
      logSession(state.data.settings.study_focus, finishedAt);
    } else {
      setTimer({ phase: 'focus', elapsedBefore: 0, startedAt: null });
      flash('Rest complete. Ready when you are.');
    }
    return;
  }
  if (state.screen === 'study') Screens.updateTimer();
}

/* ---------- Install as an app ---------- */
let installPrompt = null; // Android/Chrome hands us this when the app can be installed
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  if (state.screen === 'settings') render();
});

/* ==========================================================================
   Actions — one function per data-action name used in screens.js.
   `ds` is the button's dataset (its data-… attributes).
   ========================================================================== */

const actions = {
  noop() {},

  /* --- moving around --- */
  nav(ds) { go(ds.to, ds.to === 'mood' ? { calOffset: 0 } : {}); },
  goSettings() { go('settings'); },
  goHome() { go('home'); },
  goMood() { go('mood', { calOffset: 0 }); },
  back() {
    const p = state.prev;
    go(p === 'reader' || p === 'editor' || !p ? 'journal' : p);
  },

  /* --- garden & time-lapse (see garden.js) --- */
  gardenOpen() { Garden.open(); },
  gardenClose() { Garden.close(); },
  gardenPlay() { Garden.togglePlay(); },
  gardenStep(ds) { Garden.step(Number(ds.weeks)); },
  gardenSpeed(ds) { Garden.setSpeed(ds.value); },

  /* --- passcode keypad --- */
  pinKey(ds) {
    if (ds.key === 'del') { state.pin = state.pin.slice(0, -1); state.pinErr = false; return render(); }
    const pin = (state.pin + ds.key).slice(0, 4);
    if (pin.length < 4) { state.pin = pin; state.pinErr = false; return render(); }
    if (pin === state.data.settings.passcode) { state.unlocked = true; state.pin = ''; state.pinErr = false; }
    else { state.pin = ''; state.pinErr = true; }
    render();
  },

  /* --- home --- */
  newDream() { go('dreamEdit', { dreamDraft: { id: null, date: today(), title: '', description: '', feelings: [], symbols: [], symInput: '' } }); },
  beginTonight() { openDraft({ prompt: tonightsPrompt().text }); },
  anotherPrompt() {
    state.promptOffset += 1;
    render();
    Screens.drift('#home-prompt');
  },
  quickMood() { state.quick = { mode: 'mood', mood: null, text: '' }; render(); },
  quickLine() { state.quick = { mode: 'line', mood: null, text: '' }; render(); focusField('quick.text'); },
  quickPick(ds) { state.quick.mood = state.quick.mood === ds.mood ? null : ds.mood; render(); },
  closeQuick() { state.quick = null; render(); },
  saveQuick() {
    const q = state.quick, d = state.data, date = today(), time = timeNow();
    if (!q || !(q.mood || q.text.trim())) return;
    state.quick = null;
    // Remove any earlier quick mood for today; the newest check-in wins.
    let moods = d.moods.filter(m => !(m.source === 'quick' && m.date === date));
    if (q.text.trim()) {
      // One line becomes a tiny journal entry.
      const id = Data.uid();
      if (q.mood) moods = moods.concat([{ id: 'm-' + id, date, mood: q.mood, entry_id: id, source: 'entry' }]);
      const entry = { id, date, time, title: '', body: q.text.trim(), mood: q.mood, tags: ['one line'], prompt: '', created_at: `${date}T${time}:00` };
      commit(Object.assign({}, d, { journal_entries: d.journal_entries.concat([entry]), moods }), "Kept. That's enough for today.");
    } else {
      const hasEntryMood = d.moods.some(m => m.date === date && m.source === 'entry');
      moods = moods.concat([{ id: Data.uid(), date, mood: q.mood, entry_id: null, source: 'quick' }]);
      commit(Object.assign({}, d, { moods }), hasEntryMood ? "Noted. Tonight's entry keeps its own mood." : 'Noted. Thank you for checking in.');
    }
  },
  restToday() { toggleRest(today()); },
  paydayLog() { go('savings'); actions.openDeposit(); },
  startFromHome() { go('study'); if (!state.timer.startedAt) actions.startTimer(); },

  /* --- journal --- */
  newEntry() { openDraft(); },
  filterTag(ds) { state.tag = ds.tag || null; render(); },
  openEntry(ds) { go('reader', { readId: ds.id }); },
  editEntry() {
    const e = state.data.journal_entries.find(x => x.id === state.readId);
    go('editor', { draft: Object.assign({}, e, { tags: (e.tags || []).slice(), tagInput: '', title: e.title || '', body: e.body || '' }) });
  },
  deleteEntry() {
    const id = state.readId;
    state.confirm = {
      title: 'Let this page go?',
      body: "It will be removed from this phone. This can't be undone unless you have a backup.",
      okLabel: 'Delete',
      onOk() {
        const d = state.data;
        state.screen = 'journal';
        commit(Object.assign({}, d, {
          journal_entries: d.journal_entries.filter(e => e.id !== id),
          moods: d.moods.filter(m => m.entry_id !== id)
        }), 'Entry deleted.');
      }
    };
    render();
  },
  draftMood(ds) { state.draft.mood = state.draft.mood === ds.mood ? null : ds.mood; render(); },
  addTagSuggestion(ds) { addTag(ds.tag); },
  addTagFromInput() { addTag(state.draft.tagInput); },
  removeTag(ds) { state.draft.tags = state.draft.tags.filter(t => t !== ds.tag); render(); },
  cancelEdit() {
    const dr = state.draft;
    go(dr && dr.id ? 'reader' : (state.prev === 'editor' ? 'journal' : state.prev), { draft: null });
  },
  saveDraft() {
    if (!draftCanSave()) return;
    const dr = state.draft, d = state.data;
    const id = dr.id || Data.uid();
    const old = d.journal_entries.find(e => e.id === id);
    const entry = Object.assign({}, old || {}, {
      id, date: dr.date, time: dr.time, title: dr.title.trim(), body: dr.body.trim(),
      mood: dr.mood, tags: dr.tags, prompt: dr.prompt || '',
      created_at: old ? old.created_at : `${dr.date}T${dr.time}:00`,
      updated_at: new Date().toISOString()
    });
    const journal_entries = old ? d.journal_entries.map(e => (e.id === id ? entry : e)) : d.journal_entries.concat([entry]);
    // Keep the moods table in step: one mood row per entry with a mood.
    let moods = d.moods.filter(m => m.entry_id !== id);
    if (dr.mood) {
      moods = moods.filter(m => !(m.source === 'quick' && m.date === dr.date));
      moods.push({ id: 'm-' + id, date: dr.date, mood: dr.mood, entry_id: id, source: 'entry' });
    }
    state.screen = 'reader'; state.readId = id; state.draft = null; state.prev = 'journal';
    commit(Object.assign({}, d, { journal_entries, moods }), old ? 'Saved.' : "Kept. That's enough for today.");
    window.scrollTo(0, 0);
  },

  /* --- mood tracker --- */
  prevMonth() { state.calOffset -= 1; render(); },
  nextMonth() { if (state.calOffset < 0) { state.calOffset += 1; render(); } },
  openDay(ds) {
    const date = ds.date, d = state.data, m = moodByDate()[date];
    const ent = (m && m.entry_id && d.journal_entries.find(e => e.id === m.entry_id)) || d.journal_entries.find(e => e.date === date);
    if (ent) return go('reader', { readId: ent.id });
    state.day = date; render();
  },
  closeDay() { state.day = null; render(); },
  dayWrite() {
    const date = state.day, m = moodByDate()[date];
    state.day = null;
    openDraft({ date, time: '21:00', mood: m ? m.mood : null });
  },
  dayRest() { const date = state.day; state.day = null; toggleRest(date); },

  /* --- dreams --- */
  dreamFilter(ds) { state.dreamFilter = state.dreamFilter === ds.value ? null : ds.value; render(); },
  clearDreamFilter() { state.dreamFilter = null; render(); },
  openDream(ds) { go('dreamRead', { dreamId: ds.id }); },
  dreamsBack() { go('dreams'); },
  editDream() {
    const x = state.data.dreams.find(r => r.id === state.dreamId);
    go('dreamEdit', { dreamDraft: Object.assign({}, x, { feelings: (x.feelings || []).slice(), symbols: (x.symbols || []).slice(), symInput: '', title: x.title || '', description: x.description || '' }) });
  },
  deleteDream() {
    const id = state.dreamId;
    state.confirm = {
      title: 'Let this dream go?', body: 'It will be removed from this phone.', okLabel: 'Delete',
      onOk() {
        state.screen = 'dreams';
        commit(Object.assign({}, state.data, { dreams: state.data.dreams.filter(x => x.id !== id) }), 'Dream deleted.');
      }
    };
    render();
  },
  toggleFeeling(ds) {
    const dd = state.dreamDraft, f = ds.value;
    dd.feelings = dd.feelings.includes(f) ? dd.feelings.filter(x => x !== f) : dd.feelings.concat([f]);
    render();
  },
  toggleDictation() {
    if (dictation.listening) stopDictation(); else startDictation();
  },
  addSymbolSuggestion(ds) { addSymbol(ds.value); },
  addSymbolFromInput() { addSymbol(state.dreamDraft.symInput); },
  removeSymbol(ds) { state.dreamDraft.symbols = state.dreamDraft.symbols.filter(s => s !== ds.value); render(); },
  cancelDream() { go(state.dreamDraft && state.dreamDraft.id ? 'dreamRead' : 'dreams', { dreamDraft: null }); },
  saveDream() {
    stopDictation();
    const dd = state.dreamDraft, d = state.data;
    if (!dd || !(dd.title.trim() || dd.description.trim())) return;
    const id = dd.id || Data.uid();
    const old = d.dreams.find(x => x.id === id);
    const row = Object.assign({}, old || {}, {
      id, date: dd.date, title: dd.title.trim(), description: dd.description.trim(),
      feelings: dd.feelings, symbols: dd.symbols,
      created_at: old ? old.created_at : new Date().toISOString(), updated_at: new Date().toISOString()
    });
    state.screen = 'dreamRead'; state.dreamId = id; state.dreamDraft = null; state.prev = 'dreams';
    commit(Object.assign({}, d, { dreams: old ? d.dreams.map(x => (x.id === id ? row : x)) : d.dreams.concat([row]) }), old ? 'Saved.' : 'Dream kept.');
    window.scrollTo(0, 0);
  },

  /* --- prompts --- */
  promptTheme(ds) { state.promptTheme = ds.value; state.promptLimit = 12; render(); },
  newPrompt() {
    const pool = Screens.promptPool();
    const current = state.promptPick || dailyPromptId();
    const choices = pool.filter(p => p.id !== current);
    const from = choices.length ? choices : Data.PROMPTS;
    state.promptPick = from[Math.floor(Math.random() * from.length)].id;
    render();
    Screens.drift('#prompts-hero');
  },
  toggleFav(ds) {
    const d = state.data, id = ds.id;
    const has = d.favorite_prompts.some(f => f.prompt_id === id);
    const favorite_prompts = has
      ? d.favorite_prompts.filter(f => f.prompt_id !== id)
      : d.favorite_prompts.concat([{ id: Data.uid(), prompt_id: id, saved_at: today() }]);
    commit(Object.assign({}, d, { favorite_prompts }), has ? 'Removed from favorites.' : 'Kept with a daisy.');
  },
  writeFromPrompt(ds) {
    const p = Data.PROMPTS.find(x => x.id === ds.id);
    openDraft({ prompt: p.text });
  },
  morePrompts() { state.promptLimit += 24; render(); },

  /* --- study --- */
  startTimer() {
    const t = state.timer;
    setTimer({ phase: t.phase, elapsedBefore: t.elapsedBefore, startedAt: Date.now() });
    render();
  },
  pauseTimer() {
    setTimer({ phase: state.timer.phase, elapsedBefore: timerElapsed(), startedAt: null });
    render();
  },
  stopTimer() {
    const t = state.timer, minutes = Math.floor(timerElapsed() / 60);
    setTimer({ phase: 'focus', elapsedBefore: 0, startedAt: null });
    if (t.phase === 'focus' && minutes >= 1) logSession(minutes); else render();
  },
  skipBreak() { setTimer({ phase: 'focus', elapsedBefore: 0, startedAt: null }); render(); },
  setFocus(ds) { setSetting('study_focus', Number(ds.value)); },
  setBreak(ds) { setSetting('study_break', Number(ds.value)); },
  setSubject(ds) { setSetting('study_subject', ds.value); },
  addSubject() {
    const v = state.subjectInput.trim(), d = state.data, s = d.settings;
    if (!v) return;
    state.subjectInput = '';
    const subjects = s.subjects.includes(v) ? s.subjects : s.subjects.concat([v]);
    commit(Object.assign({}, d, { settings: Object.assign({}, s, { subjects, study_subject: v }) }));
  },
  studyView(ds) { state.studyView = ds.value; render(); },

  /* --- savings --- */
  openDeposit() { state.deposit = { amount: '', date: today(), note: '' }; render(); focusField('deposit.amount'); },
  closeDeposit() { state.deposit = null; render(); },
  saveDeposit() {
    const dep = state.deposit, d = state.data;
    const amount = parseFloat(String(dep.amount).replace(/[^0-9.]/g, ''));
    if (!(amount > 0)) return flash('Enter an amount above zero.');
    const goal = Number(d.settings.monthly_goal) || 0;
    const month = dep.date.slice(0, 7);
    const before = d.savings_deposits.filter(x => x.date.startsWith(month)).reduce((s, x) => s + Number(x.amount), 0);
    const reached = goal && before < goal && before + amount >= goal;
    const row = { id: Data.uid(), date: dep.date, amount: Math.round(amount * 100) / 100, note: dep.note.trim(), created_at: new Date().toISOString() };
    state.deposit = null;
    commit(Object.assign({}, d, { savings_deposits: d.savings_deposits.concat([row]) }), reached ? null : 'Deposit kept.');
    if (reached) {
      // A gentle bloom of petals for reaching the month's goal
      state.bloom = true; render();
      setTimeout(() => { state.bloom = false; render(); }, 5200);
    }
  },
  closeBloom() { state.bloom = false; render(); },
  deleteDeposit(ds) {
    const x = state.data.savings_deposits.find(r => r.id === ds.id);
    state.confirm = {
      title: 'Remove this deposit?',
      body: Data.money(Number(x.amount)) + ' on ' + Data.short(x.date) + '. This only changes the log here, not your account.',
      okLabel: 'Remove',
      onOk() { commit(Object.assign({}, state.data, { savings_deposits: state.data.savings_deposits.filter(r => r.id !== x.id) }), 'Deposit removed.'); }
    };
    render();
  },
  editGoal() { state.goalEdit = state.goalEdit == null ? String(state.data.settings.monthly_goal || '') : null; render(); },
  saveGoal() {
    const v = parseFloat(String(state.goalEdit).replace(/[^0-9.]/g, ''));
    if (!(v > 0)) return flash('Enter an amount above zero.');
    state.goalEdit = null;
    setSetting('monthly_goal', v, 'Goal saved.');
  },
  savePrev() { state.saveOffset -= 1; render(); },
  saveNext() { state.saveOffset += 1; render(); },

  /* --- dialogs --- */
  closeConfirm() { state.confirm = null; render(); },
  confirmOk() { const c = state.confirm; state.confirm = null; c.onOk(); },

  /* --- settings --- */
  setTheme(ds) { setSetting('theme', ds.value); },
  toggleMotion() { setSetting('reduced_motion', !state.data.settings.reduced_motion); },
  setPin() {
    if (!/^\d{4}$/.test(state.newPin)) return flash('Choose four digits.');
    const d = state.data;
    state.unlocked = true;
    const pin = state.newPin; state.newPin = '';
    commit(Object.assign({}, d, { settings: Object.assign({}, d.settings, { passcode: pin, lock_enabled: true }) }), 'Passcode set.');
  },
  clearPin() {
    const d = state.data;
    commit(Object.assign({}, d, { settings: Object.assign({}, d.settings, { passcode: '', lock_enabled: false }) }), 'Lock turned off.');
  },
  exportData() { Storage.exportBackup(state.data); flash('Backup downloaded.'); },
  importClick() { document.getElementById('import-file').click(); },
  sampleAction() {
    if (Storage.hasSample(state.data)) commit(Storage.withoutSample(state.data), 'Sample cleared. Welcome in.');
    else commit(Storage.withSample(state.data), 'Sample month loaded.');
  },
  install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(() => { installPrompt = null; render(); });
  }
};

/* ==========================================================================
   Wiring: one listener for each kind of event, for the whole page.
   ========================================================================== */

// Taps
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el.dataset, e);
});

// Typing: store the value in state (e.g. data-field="draft.title" → state.draft.title)
document.addEventListener('input', e => {
  const el = e.target, path = el.dataset.field;
  if (!path) return;
  const keys = path.split('.');
  let target = state;
  for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
  let value = el.value;
  if (path === 'newPin') { value = value.replace(/\D/g, '').slice(0, 4); el.value = value; }
  target[keys[keys.length - 1]] = value;

  // A comma finishes a tag or symbol, just like Enter
  if (path === 'draft.tagInput' && value.endsWith(',')) return addTag(value.slice(0, -1));
  if (path === 'dreamDraft.symInput' && value.endsWith(',')) return addSymbol(value.slice(0, -1));
  Screens.refreshSaveButtons();
});

// Enter key inside small inputs (tags, symbols, subjects)
document.addEventListener('keydown', e => {
  const el = e.target;
  if (e.key === 'Enter' && el.dataset && el.dataset.enter) {
    e.preventDefault();
    actions[el.dataset.enter](el.dataset);
  }
});

// Choosing a backup file to import
document.addEventListener('change', e => {
  if (e.target.id !== 'import-file') return;
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  Storage.importBackup(file, state.data)
    .then(restored => commit(restored, 'Restored from backup.'))
    .catch(() => flash("That file couldn't be read."));
});

// When the app is hidden, lock the private pages again; when it comes back,
// redraw (the time of day, and so the colors, may have changed).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { state.unlocked = false; state.pin = ''; stopDictation(); }
  else { tickTimer(); render(); }
});

// Redraw once a minute on the home screen so the greeting follows the clock,
// but never while you're typing.
let lastClockKey = '';
setInterval(() => {
  const key = today() + period() + isNight();
  const typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (key !== lastClockKey && !typing) { lastClockKey = key; render(); }
}, 60000);

setInterval(tickTimer, 1000);

/* ---------- Start ---------- */
Storage.askToPersist();
tickTimer();
render();

// Register the service worker, which lets the app open offline.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Offline mode unavailable', err));
  });
}
