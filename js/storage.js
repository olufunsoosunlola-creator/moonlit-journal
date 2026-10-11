/* ==========================================================================
   storage.js — saving, loading, backing up and restoring your data
   --------------------------------------------------------------------------
   All data lives in the browser's localStorage on this device, under one key.
   localStorage only stores text, so we turn the data into JSON text when we
   save and back into objects when we load.

   The data is organised as separate "tables" (arrays of rows), each row
   carrying its own date. See README.md for the full structure.
   ========================================================================== */

const Storage = (function () {

  const KEY = 'moonlit-journal.v1';

  // The tables, in the order they appear in a backup file.
  const TABLES = ['journal_entries', 'dreams', 'moods', 'study_sessions',
    'savings_deposits', 'rest_days', 'favorite_prompts'];

  // A brand new, empty set of data with default settings.
  function emptyData() {
    return {
      journal_entries: [],
      dreams: [],
      moods: [],
      study_sessions: [],
      savings_deposits: [],
      rest_days: [],
      favorite_prompts: [],
      settings: {
        theme: 'auto',          // 'auto' (night after 6pm), 'day' or 'night'
        reduced_motion: false,
        lock_enabled: false,
        passcode: '',
        monthly_goal: 400,
        study_focus: 45,        // minutes, never below 45
        study_break: 10,        // 10 or 15
        study_subject: 'SQL',
        subjects: ['SQL', 'Python']
      }
    };
  }

  // Adds the sample month to some data (replacing any older sample rows).
  function withSample(data) {
    const sample = Data.sampleRows();
    const out = Object.assign({}, data);
    for (const table in sample) {
      const yours = (data[table] || []).filter(row => !row.sample);
      out[table] = yours.concat(sample[table]);
    }
    return out;
  }

  // Removes every row marked `sample: true`. Your own rows stay.
  function withoutSample(data) {
    const out = Object.assign({}, data);
    TABLES.forEach(t => { out[t] = (data[t] || []).filter(row => !row.sample); });
    return out;
  }

  function hasSample(data) {
    return TABLES.some(t => (data[t] || []).some(row => row.sample));
  }

  // Makes sure every table and setting exists, even in older or partial data.
  function normalise(raw) {
    const base = emptyData();
    const out = { settings: Object.assign({}, base.settings) };
    TABLES.forEach(t => { out[t] = Array.isArray(raw[t]) ? raw[t] : []; });
    const s = raw.settings || {};
    for (const k in s) {
      if (s[k] !== null && s[k] !== undefined) out.settings[k] = s[k];
    }
    return out;
  }

  // Load saved data. The very first time, start with the sample month
  // so every screen has something to show.
  function load() {
    try {
      const text = localStorage.getItem(KEY);
      if (text) return normalise(JSON.parse(text));
    } catch (err) {
      console.warn('Could not read saved data', err);
    }
    return withSample(emptyData());
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.warn('Could not save', err);
      return false;
    }
  }

  // Ask the browser to keep our storage even when the phone is low on space.
  // (Supported browsers may say no; that's fine.)
  function askToPersist() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }

  /* ---------- Export: download everything as a .json file ---------- */
  function exportBackup(data) {
    const payload = {
      app: 'moonlit-journal',
      version: 1,
      exported_at: new Date().toISOString(),
      tables: {},
      // The passcode is never written into the backup file.
      settings: Object.assign({}, data.settings, { passcode: '', lock_enabled: false })
    };
    TABLES.forEach(t => { payload.tables[t] = data[t]; });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moonlit-journal-backup-${Data.ymd(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- Import: read a backup file and return the data ----------
     Returns a Promise, because reading a file takes a moment.
     `current` is used to keep your existing passcode. */
  function importBackup(file, current) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          // Accept both our format ({ tables: {...} }) and a plain object of tables.
          const tables = parsed.tables || parsed;
          if (!TABLES.some(t => Array.isArray(tables[t]))) throw new Error('No tables found');
          const restored = normalise(Object.assign({}, tables, { settings: parsed.settings || {} }));
          restored.settings.passcode = current.settings.passcode;
          restored.settings.lock_enabled = current.settings.lock_enabled;
          resolve(restored);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  return { TABLES, emptyData, withSample, withoutSample, hasSample, load, save, askToPersist, exportBackup, importBackup };
})();
