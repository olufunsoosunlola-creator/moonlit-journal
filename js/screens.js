/* ==========================================================================
   screens.js — turns `state` into HTML
   --------------------------------------------------------------------------
   Each screen is a function that returns a string of HTML. render() (at the
   bottom) picks the right one and puts it on the page. Buttons say what they
   do with data-action="…"; those names match the functions in app.js.
   Any text you typed is passed through esc() so it shows exactly as written.
   ========================================================================== */

const Screens = (function () {
  const D = Data;

  /* ---------- small building blocks ---------- */
  const kicker = t => `<div class="kicker">${t}</div>`;
  const chip = (label, on, action, attrs, extra) =>
    `<button class="chip ${on ? 'on' : ''} ${extra || ''}" data-action="${action}" ${attrs || ''}>${label}</button>`;
  const backBtn = (action, label) =>
    `<button class="btn-plain back" data-action="${action}">${Icons.back}${label}</button>`;

  // The eight pastel mood buttons. `action` is called with data-mood.
  function moodGrid(selected, action) {
    return `<div class="mood-grid">${D.MOODS.map(m => {
      const on = selected === m.k;
      return `<button class="mood-btn ${on ? 'on' : ''}" data-action="${action}" data-mood="${m.k}" aria-pressed="${on}">
        <span class="dot" style="background:${m.c};${on ? `box-shadow:0 0 0 4px ${m.c}55, 0 0 18px ${m.c}` : ''}"></span>${m.k}</button>`;
    }).join('')}</div>`;
  }

  /* ======================= HOME ======================= */
  function home() {
    const d = state.data, n = now(), t = today(), per = period(), night = isNight();
    const restSet = new Set(d.rest_days.map(r => r.date));
    const mbd = moodByDate();

    // Welcome back after 4+ quiet days (never a guilt message)
    const dates = d.journal_entries.map(e => e.date).concat(d.moods.map(m => m.date)).filter(x => x <= t).sort();
    const last = dates[dates.length - 1];
    const welcome = last && D.diffDays(t, last) >= 4;

    const greetings = {
      morning: ['Good morning.', 'Dreams fade quickly. Catch one before the day takes over, if you like.'],
      afternoon: ['Good afternoon.', 'Your timer is ready whenever you are.'],
      night: ['Good evening.', 'A quiet page is waiting for you.']
    };
    const monthKey = t.slice(0, 7);
    const jn = daysJournaledIn(monthKey);
    const daysInMonth = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    const strip = Array.from({ length: daysInMonth }, (_, i) => {
      const ds = `${monthKey}-${D.pad(i + 1)}`, m = mbd[ds];
      const style = m ? `background:${D.MOOD_COLOR[m.mood]}`
        : restSet.has(ds) ? 'border:1px dashed var(--lineStrong)'
        : i + 1 > n.getDate() ? '' : 'border-color:var(--line)';
      return `<span title="${ds}" style="${style}"></span>`;
    }).join('');

    const prompt = tonightsPrompt();
    const focus = d.settings.study_focus, brk = d.settings.study_break;
    const resting = restSet.has(t);

    return `
    <div class="home-top">
      <div class="home-date">${D.DAYS[n.getDay()]}, ${D.MONTHS[n.getMonth()]} ${n.getDate()}</div>
      <button class="icon-btn" data-action="goSettings" aria-label="Settings and your data">${Icons.settings}</button>
    </div>
    <div class="home-hero ${night ? 'night' : ''}">
      <div class="img"></div>
      <div class="month-script">${D.MONTHS[n.getMonth()]}\n'${String(n.getFullYear()).slice(2)}</div>
    </div>
    <div class="greeting">
      <h1>${greetings[per][0]}</h1>
      <p>${welcome ? 'Take your time settling in.' : greetings[per][1]}</p>
    </div>
    <div class="home-stack">
      ${welcome ? `<div class="card banner"><div>
        <div class="kicker">welcome back</div>
        <div class="muted" style="font-size:15px">It's good to see you. Nothing to catch up on; start wherever you are.</div></div></div>` : ''}

      ${D.isPayday(t) ? `<div class="banner payday">
        <span style="color:var(--accent);flex:none;display:grid;transform:scale(1.6);margin:0 6px">${Icons.sprout}</span>
        <div style="flex:1;min-width:0"><div class="h-card" style="font-size:22px">It's payday.</div>
        <div class="muted small">Whenever you're ready, note what you set aside.</div></div>
        <button class="btn btn-soft" style="min-height:44px;padding:0 16px;border-color:var(--accent)" data-action="paydayLog">Log it</button></div>` : ''}

      ${per === 'morning' ? `<div class="dream-card">
        <div class="kicker" style="color:#F3C9D6">while it's still fresh</div>
        <div class="serif" style="font-size:30px;line-height:1.1">What did you dream last night?</div>
        <div style="margin-top:10px"><button class="btn-glass" data-action="newDream">Record a dream</button></div></div>` : ''}

      ${per === 'afternoon' ? `<div class="card focus-card">
        <div class="mini-ring"><svg width="104" height="104" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r="44" fill="none" stroke="var(--line)" stroke-width="5"/>
          <circle cx="52" cy="52" r="44" fill="none" stroke="#E9B8C9" stroke-width="5" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="230" transform="rotate(-90 52 52)"/></svg>
          <div class="serif tnum" style="font-size:28px">${focus}</div></div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          ${kicker('this afternoon')}
          <div class="serif" style="font-size:26px;line-height:1.1">${focus} minutes of focus</div>
          <div class="muted small">Then a ${brk}-minute rest.</div>
          <div style="margin-top:8px"><button class="btn btn-accent" data-action="startFromHome">${state.timer.startedAt ? 'Back to focus' : 'Start focus'}</button></div>
        </div></div>` : ''}

      ${per === 'night' ? `<div class="prompt-card" id="home-prompt">
        <div class="row"><div class="kicker" style="color:inherit">tonight's prompt</div>
          <div class="theme-pill">${esc(D.themeLabel(prompt.theme))}</div></div>
        <p class="text">${esc(prompt.text)}</p>
        <div class="actions">
          <button class="btn-prompt" data-action="beginTonight">Begin tonight's entry</button>
          <button class="round-prompt" data-action="anotherPrompt" aria-label="Another prompt">${Icons.refresh}</button>
        </div></div>` : ''}

      <div style="padding:4px 4px 0">
        <div class="kicker" style="font-size:20px;margin-bottom:10px">or, just a little</div>
        <div class="quick-grid">
          <button class="quick-tile" data-action="quickMood"><div style="display:flex">
            <span class="dot-sm" style="width:14px;height:14px;background:#F8D3C5"></span>
            <span class="dot-sm" style="width:14px;height:14px;background:#CFE0EC;margin-left:-4px"></span>
            <span class="dot-sm" style="width:14px;height:14px;background:#DCCFEA;margin-left:-4px"></span></div>Just a mood</button>
          <button class="quick-tile" data-action="quickLine"><div style="width:30px;height:1.5px;background:var(--ink2);border-radius:2px;margin:6px 0"></div>One line</button>
          <button class="quick-tile ${resting ? 'resting' : ''}" data-action="restToday">${Icons.line('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', 20)}${resting ? 'Resting today' : 'Rest today'}</button>
        </div>
      </div>

      <button class="card month-card" data-action="goMood">
        <div style="display:flex;justify-content:space-between;align-items:baseline;width:100%">
          <div class="h-card">${D.MONTHS[n.getMonth()]} so far</div>
          <div class="muted small">${jn} ${jn === 1 ? 'day' : 'days'} journaled</div></div>
        <div class="strip">${strip}</div>
        <div class="muted small">Open the meadow →</div>
      </button>
    </div>`;
  }

  /* ======================= LOCK ======================= */
  function lock() {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    return `<div class="lock">
      <div class="lock-glow"></div>
      <div class="serif" style="font-size:30px">Your pages are resting</div>
      <div class="pin-dots">${[0, 1, 2, 3].map(i => `<span class="${i < state.pin.length ? 'on' : ''}"></span>`).join('')}</div>
      ${state.pinErr ? '<div class="muted small">Not quite. Try again, no rush.</div>' : ''}
      <div class="keypad">${keys.map(k => k === ''
        ? '<span class="key blank"></span>'
        : `<button class="key ${k === 'del' ? 'del' : ''}" data-action="pinKey" data-key="${k}" aria-label="${k === 'del' ? 'Delete digit' : k}">${k === 'del' ? '⌫' : k}</button>`).join('')}</div>
    </div>`;
  }

  /* ======================= JOURNAL ======================= */
  function journal() {
    const d = state.data;
    const allTags = [...new Set(d.journal_entries.flatMap(e => e.tags || []))].sort((a, b) => a.localeCompare(b));
    const entries = d.journal_entries
      .filter(e => !state.tag || (e.tags || []).includes(state.tag))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    let lastMonth = '';
    const list = entries.map((e, i) => {
      const month = e.date.slice(0, 7);
      let header = '';
      if (month !== lastMonth) {
        const x = D.parse(e.date);
        header = `<div class="month-header">${D.MONTHS[x.getMonth()]} '${String(x.getFullYear()).slice(2)}</div>`;
      }
      lastMonth = month;
      const tilt = ['-0.6deg', '0.5deg', '-0.2deg'][i % 3];
      return header + `<button class="card entry" style="transform:rotate(${tilt})" data-action="openEntry" data-id="${esc(e.id)}">
        <div class="entry-meta"><span>${D.short(e.date)}</span>
          ${e.mood ? `<span style="display:flex;align-items:center;gap:6px;margin-left:auto"><span class="dot-sm" style="background:${D.MOOD_COLOR[e.mood]}"></span>${e.mood}</span>` : ''}</div>
        ${e.title ? `<div class="entry-title">${esc(e.title)}</div>` : ''}
        <div class="clamp">${esc(e.body || '(a mood only)')}</div>
        ${(e.tags || []).length ? `<div class="tags-line">${e.tags.map(t => '#' + esc(t)).join('  ')}</div>` : ''}
      </button>`;
    }).join('');

    return `<div class="page-head">
      <div>${kicker('journal')}<h1 class="page-title">Your pages</h1></div>
      <button class="btn btn-accent" style="padding:0 18px 0 14px;flex:none" data-action="newEntry">${Icons.plus}New entry</button>
    </div>
    <div class="chips scroll" style="padding:18px 22px 4px">
      ${chip('All', !state.tag, 'filterTag', 'data-tag=""')}
      ${allTags.map(t => chip('#' + esc(t), state.tag === t, 'filterTag', `data-tag="${esc(t)}"`)).join('')}
    </div>
    ${entries.length ? '' : `<div class="empty"><div><div class="serif" style="font-size:26px">A blank page, waiting kindly.</div>
      <div class="muted" style="font-size:15px">When you're ready, one line is plenty.</div></div></div>`}
    <div class="list">${list}</div>`;
  }

  function reader() {
    const e = state.data.journal_entries.find(x => x.id === state.readId);
    if (!e) return journal();
    return `<div class="top-bar">${backBtn('back', 'Back')}
      <button class="btn btn-soft" style="min-height:44px;padding:0 18px;border-color:var(--accent)" data-action="editEntry">Edit</button></div>
    <article class="card page">
      <div class="kicker" style="font-size:24px">${D.scriptDate(e.date)}</div>
      ${e.mood ? `<div class="mood-pill"><span class="dot-sm" style="width:16px;height:16px;background:${D.MOOD_COLOR[e.mood]}"></span>${e.mood}</div>` : ''}
      ${e.prompt ? `<div class="quote">${esc(e.prompt)}</div>` : ''}
      ${e.title ? `<h2>${esc(e.title)}</h2>` : ''}
      <p class="body">${esc(e.body)}</p>
      ${(e.tags || []).length ? `<div class="tags-line" style="margin-top:18px;font-size:14px">${e.tags.map(t => '#' + esc(t)).join('  ')}</div>` : ''}
    </article>
    <div style="padding:18px 22px;display:flex;justify-content:center">
      <button class="btn-link" data-action="deleteEntry">Delete this entry</button></div>`;
  }

  function editor() {
    const dr = state.draft;
    if (!dr) return journal();
    const allTags = [...new Set(state.data.journal_entries.flatMap(e => e.tags || []))].sort();
    const question = period() === 'night' && dr.date === today() ? 'How are you tonight?' : 'How did it feel?';
    return `<div class="top-bar">
      <button class="btn-plain" data-action="cancelEdit">Cancel</button>
      <div class="kicker" style="font-size:20px">${dr.id ? 'edit entry' : 'new entry'}</div>
      <button class="btn btn-accent" style="min-height:44px" data-action="saveDraft" data-save="draft" ${draftCanSave() ? '' : 'disabled'}>Save</button>
    </div>
    <div class="editor">
      ${dr.prompt ? `<div class="editor-prompt">${esc(dr.prompt)}</div>` : ''}
      <label class="field caps">Date
        <input class="input" type="date" data-field="draft.date" value="${esc(dr.date)}" style="text-transform:none;letter-spacing:0;font-weight:400"></label>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="h-card">${question}</div>
        ${moodGrid(dr.mood, 'draftMood')}
      </div>
      <input class="title-input" data-field="draft.title" value="${esc(dr.title)}" placeholder="A title, if you like">
      <textarea class="textarea" data-field="draft.body" placeholder="Write as much or as little as you want.">${esc(dr.body)}</textarea>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="caps">Tags</div>
        <div class="chips">
          ${dr.tags.map(t => `<button class="chip chip-remove" data-action="removeTag" data-tag="${esc(t)}" aria-label="Remove tag ${esc(t)}">#${esc(t)}${Icons.close}</button>`).join('')}
          <input class="chip-input" data-field="draft.tagInput" data-enter="addTagFromInput" value="${esc(dr.tagInput)}" placeholder="add a tag, press enter">
        </div>
        <div class="chips" style="gap:6px">${allTags.filter(t => !dr.tags.includes(t)).slice(0, 8)
          .map(t => `<button class="chip chip-suggest" data-action="addTagSuggestion" data-tag="${esc(t)}">+ ${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="muted small" style="text-align:center" data-save-hint="draft" ${draftCanSave() ? 'hidden' : ''}>A mood or a few words is all it takes to save.</div>
    </div>`;
  }

  /* ======================= MOOD TRACKER ======================= */
  function mood() {
    const d = state.data, n = now(), t = today(), mbd = moodByDate();
    const restSet = new Set(d.rest_days.map(r => r.date));
    const vm = new Date(n.getFullYear(), n.getMonth() + state.calOffset, 1);
    const vk = `${vm.getFullYear()}-${D.pad(vm.getMonth() + 1)}`;
    const dim = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < vm.getDay(); i++) cells += '<span class="cal-day blank"></span>';
    for (let i = 1; i <= dim; i++) {
      const ds = `${vk}-${D.pad(i)}`, m = mbd[ds], future = ds > t, rest = restSet.has(ds);
      const cls = ['cal-day', m ? 'has-mood' : '', rest && !m ? 'rest' : '', ds === t ? 'today' : ''].join(' ');
      cells += `<button class="${cls}" style="${m ? 'background:' + D.MOOD_COLOR[m.mood] : ''}" ${future ? 'disabled' : ''}
        data-action="openDay" data-date="${ds}" aria-label="${D.scriptDate(ds)}${m ? ', ' + m.mood : ''}${rest ? ', rest day' : ''}">${i}</button>`;
    }

    // Insights: most common mood this month vs. last month
    const countIn = key => { const c = {}; Object.values(mbd).filter(m => m.date.startsWith(key)).forEach(m => { c[m.mood] = (c[m.mood] || 0) + 1; }); return c; };
    const pm = new Date(vm.getFullYear(), vm.getMonth() - 1, 1);
    const cc = countIn(vk), pc = countIn(`${pm.getFullYear()}-${D.pad(pm.getMonth() + 1)}`);
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
    const t1 = top(cc), t0 = top(pc), pmName = D.MONTHS[pm.getMonth()];
    const compare = !t1 ? '' : !t0 ? `Nothing noted in ${pmName} to compare with.`
      : t0[0] === t1[0] ? `${t1[0][0].toUpperCase() + t1[0].slice(1)} led ${pmName} too, on ${t0[1]} days.`
      : `${pmName} leaned ${t0[0]} (${t0[1]} days). This month leans ${t1[0]}.`;
    const maxC = Math.max(1, ...Object.values(cc));
    const vjn = daysJournaledIn(vk);

    return `<div class="mood-hero"><div class="sky"></div><div class="hills"></div>
      <div class="head">
        <div>${kicker('the meadow')}<h1 class="page-title" style="font-size:40px">${D.MONTHS[vm.getMonth()]} ${vm.getFullYear()}</h1></div>
        <div class="month-nav">
          <button data-action="prevMonth" aria-label="Previous month">${Icons.prev}</button>
          <button data-action="nextMonth" aria-label="Next month" ${state.calOffset < 0 ? '' : 'disabled'}>${Icons.next}</button>
        </div></div></div>
    <div class="cal-glass">
      <div class="weekdays"><div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div></div>
      <div class="cal">${cells}</div>
      <div class="legend">${D.MOODS.map(m => `<div><span class="dot-sm" style="width:11px;height:11px;background:${m.c}"></span>${m.k}</div>`).join('')}
        <div><span class="dot-sm" style="width:11px;height:11px;border:1.5px dashed var(--lineStrong)"></span>rest</div></div>
    </div>
    <div class="card section" style="padding:20px;gap:16px;border-radius:18px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div class="h-card">This month's weather</div><div class="muted small">${vjn} ${vjn === 1 ? 'day' : 'days'} journaled</div></div>
      ${t1 ? `<div style="display:flex;gap:14px;align-items:center">
          <div style="width:52px;height:52px;border-radius:50%;background:${D.MOOD_COLOR[t1[0]]};flex:none;box-shadow:0 0 0 6px var(--tint)"></div>
          <div><div class="caps" style="font-size:13px">Most often</div>
          <div class="serif" style="font-size:28px;line-height:1.05">${t1[0]}, ${t1[1]} ${t1[1] === 1 ? 'day' : 'days'}</div></div></div>
        <div class="muted" style="font-size:15px">${compare}</div>`
        : '<div class="muted" style="font-size:15px">No moods noted this month yet. The meadow will keep.</div>'}
      <div class="mood-hills">${D.MOODS.map(m => { const c = cc[m.k] || 0;
        return `<div title="${m.k}: ${c}" style="height:${14 + (c / maxC) * 86}px;background:${m.c};z-index:${c}"></div>`; }).join('')}</div>
      <div class="mood-hill-counts">${D.MOODS.map(m => `<div class="tnum">${cc[m.k] || 0}</div>`).join('')}</div>
    </div>`;
  }

  /* ======================= SETTINGS ======================= */
  function settings() {
    const d = state.data, s = d.settings, hasSample = Storage.hasSample(d);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return `<div style="padding:18px 14px 0">${backBtn('goHome', 'Home')}</div>
    <div style="padding:6px 22px 0">${kicker('keeping house')}<h1 class="page-title">Settings</h1></div>
    <div class="settings">
      <div class="setting"><h3>Light</h3>
        <div class="seg">${[['auto', 'Auto'], ['day', 'Day'], ['night', 'Night']].map(([v, l]) =>
          `<button class="${s.theme === v ? 'on' : ''}" data-action="setTheme" data-value="${v}">${l}</button>`).join('')}</div>
        <div class="muted small">Auto turns to the mauve glow after 6pm.</div></div>

      <div class="setting" style="flex-direction:row;justify-content:space-between;align-items:center;gap:16px">
        <div><h3>Reduce motion</h3><div class="muted small">Keeps everything still.</div></div>
        <button class="switch ${s.reduced_motion ? 'on' : ''}" role="switch" aria-checked="${!!s.reduced_motion}" aria-label="Reduce motion" data-action="toggleMotion"><span></span></button></div>

      <div class="setting"><h3>Passcode for your pages</h3>
        <div class="muted small">${lockOn() ? 'On. Journal, mood and dream pages ask for your passcode each time the app opens.' : 'Off. Set a 4-digit passcode to keep your journal, mood and dream pages private.'}</div>
        <div style="display:flex;gap:10px">
          <input class="input" data-field="newPin" value="${esc(state.newPin)}" inputmode="numeric" type="password" maxlength="4" placeholder="4 digits" style="flex:1;min-width:0;font-size:18px;letter-spacing:.3em" autocomplete="off">
          <button class="btn btn-accent" data-action="setPin">${lockOn() ? 'Change' : 'Turn on'}</button></div>
        ${lockOn() ? '<button class="btn-link" style="align-self:flex-start;padding:0" data-action="clearPin">Turn the lock off</button>' : ''}
        <div class="muted small">If you forget it, clearing this site's data in your browser resets the lock (and erases your pages, so keep a backup).</div></div>

      <div class="setting"><h3>Your data</h3>
        <div class="muted small">Everything lives only on this phone. No account, no cloud, no notifications. The backup file keeps each table separate and dated, ready for a SQL database later.</div>
        <div class="two-col">
          <button class="btn btn-accent" data-action="exportData">Export backup</button>
          <button class="btn" data-action="importClick">Import backup</button></div>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
        <div class="muted small">${d.journal_entries.length} entries · ${d.moods.length} moods · ${d.rest_days.length} rest days · ${d.dreams.length} dreams · ${d.study_sessions.length} study sessions · ${d.savings_deposits.length} deposits</div></div>

      <div class="setting"><h3>Sample month</h3>
        <div class="muted small">${hasSample ? 'A month of sample pages is showing so you can look around. Clear it when you begin for real; your own entries stay.' : 'No sample data. Everything here is yours.'}</div>
        <button class="btn btn-soft" style="align-self:flex-start" data-action="sampleAction">${hasSample ? 'Clear sample data' : 'Load sample month'}</button></div>

      ${standalone ? '' : `<div class="setting"><h3>Keep it on your home screen</h3>
        ${installPrompt ? '<button class="btn btn-accent" style="align-self:flex-start" data-action="install">Install the app</button>' : ''}
        <div class="muted small">${isIOS ? 'In Safari, tap the Share button, then “Add to Home Screen”.' : 'In your browser menu, choose “Install app” or “Add to Home screen”.'} It will open full-screen and work offline.</div></div>`}
    </div>`;
  }

  /* ======================= DREAMS ======================= */
  function dreams() {
    const all = state.data.dreams.slice().sort((a, b) => b.date.localeCompare(a.date));
    const df = state.dreamFilter;
    const symCount = {};
    all.forEach(x => (x.symbols || []).forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
    const list = all.filter(x => !df || (x.symbols || []).includes(df) || (x.feelings || []).includes(df));
    const recurring = Object.entries(symCount).filter(e => e[1] > 1).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const fchip = (label, v) => chip(esc(label), df === v, 'dreamFilter', `data-value="${esc(v)}"`);

    return `<div class="dream-hero"><div class="img"></div><div class="shade"></div>
      <div class="head"><div>${kicker('dream journal')}<h1 class="page-title">Night pages</h1></div>
        <button class="btn btn-accent glow-btn" data-action="newDream">Record a dream</button></div></div>
    <div class="muted small" style="padding:6px 22px 0">${all.length} ${all.length === 1 ? 'dream' : 'dreams'} recorded</div>
    ${all.length ? `<div class="card section">
      <div class="h-card" style="font-size:22px">Patterns in the night</div>
      <div class="muted small">Symbols and people that have appeared more than once. Tap one to gather those dreams.</div>
      <div class="chips">${recurring.map(([s, c]) => fchip(s + ' · ' + c, s)).join('')}</div>
      <div class="chips" style="padding-top:12px;border-top:1px solid var(--line)">${D.FEELINGS.map(f => fchip(f, f)).join('')}</div>
    </div>` : ''}
    ${df ? `<div class="muted small" style="margin:14px 22px 0;display:flex;justify-content:space-between;align-items:center;gap:10px">
      <span>Dreams with “${esc(df)}”</span><button class="btn-link" style="color:var(--ink)" data-action="clearDreamFilter">Show all</button></div>` : ''}
    ${list.length ? '' : `<div class="card" style="margin:22px 16px;padding:24px"><div class="serif" style="font-size:24px">No dreams written yet.</div>
      <div class="muted" style="font-size:15px">The best time is right after waking, before the day takes them.</div></div>`}
    <div class="list" style="gap:12px;padding:16px 16px 0">${list.map(x => `
      <button class="card dream-item" data-action="openDream" data-id="${esc(x.id)}">
        <div class="dream-date">${D.short(x.date)}</div>
        <div class="entry-title">${esc(x.title || 'Untitled dream')}</div>
        <div class="clamp" style="opacity:.9">${esc(x.description)}</div>
        ${(x.feelings || []).length ? `<div class="feel-line">${x.feelings.map(esc).join(' · ')}</div>` : ''}
      </button>`).join('')}</div>`;
  }

  function dreamRead() {
    const x = state.data.dreams.find(r => r.id === state.dreamId);
    if (!x) return dreams();
    return `<div class="top-bar">${backBtn('dreamsBack', 'Dreams')}
      <button class="btn btn-soft" style="min-height:44px;padding:0 18px;border-color:var(--accent)" data-action="editDream">Edit</button></div>
    <article class="card page" style="margin:14px 16px 0;border-radius:16px;box-shadow:var(--shadow),0 0 50px rgba(243,201,214,.18)">
      <div class="kicker" style="font-size:22px">${D.scriptDate(x.date)}</div>
      <h2 style="margin-top:12px">${esc(x.title || 'Untitled dream')}</h2>
      ${(x.feelings || []).length ? `<div class="feel-line" style="margin-top:10px;font-size:14px">${x.feelings.map(esc).join(' · ')}</div>` : ''}
      <p class="body">${esc(x.description)}</p>
      ${(x.symbols || []).length ? `<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line)">
        <span class="caps">Symbols &amp; people</span><div style="margin-top:4px;font-size:15px">${x.symbols.map(esc).join(', ')}</div></div>` : ''}
    </article>
    <div style="padding:18px 22px;display:flex;justify-content:center"><button class="btn-link" data-action="deleteDream">Delete this dream</button></div>`;
  }

  function dreamEdit() {
    const dd = state.dreamDraft;
    if (!dd) return dreams();
    const symCount = {};
    state.data.dreams.forEach(x => (x.symbols || []).forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
    const suggestions = Object.keys(symCount).filter(s => !dd.symbols.includes(s)).sort((a, b) => symCount[b] - symCount[a]).slice(0, 8);
    const canSave = !!(dd.title.trim() || dd.description.trim());
    return `<div class="top-bar">
      <button class="btn-plain" data-action="cancelDream">Cancel</button>
      <div class="kicker">${dd.id ? 'edit dream' : 'new dream'}</div>
      <button class="btn btn-accent" style="min-height:44px" data-action="saveDream" data-save="dream" ${canSave ? '' : 'disabled'}>Save</button></div>
    <div class="editor">
      <label class="field caps">Date
        <input class="input" type="date" data-field="dreamDraft.date" value="${esc(dd.date)}" style="text-transform:none;letter-spacing:0;font-weight:400"></label>
      <input class="title-input" data-field="dreamDraft.title" value="${esc(dd.title)}" placeholder="Give the dream a name">
      <div style="display:flex;flex-direction:column;gap:10px">
        <textarea class="textarea" id="dream-desc" style="min-height:220px" data-field="dreamDraft.description" placeholder="What happened? Fragments are enough.">${esc(dd.description)}</textarea>
        ${dictationSupported() ? `
          <button class="btn btn-soft mic-btn ${dictation.listening ? 'on' : ''}" id="mic-btn" style="align-self:flex-start" data-action="toggleDictation" aria-pressed="${dictation.listening}">
            ${Icons.mic}<span>${dictation.listening ? 'Listening… tap to stop' : 'Speak your dream'}</span></button>
          <div id="dictate-interim" class="dictate-interim">${esc(dictation.interim)}</div>`
        : '<div class="muted small">Tip: tap the microphone on your keyboard to speak instead of typing.</div>'}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px"><div class="caps">How it felt</div>
        <div class="chips">${D.FEELINGS.map(f => chip(f, dd.feelings.includes(f), 'toggleFeeling', `data-value="${f}"`, 'glow')).join('')}</div></div>
      <div style="display:flex;flex-direction:column;gap:10px"><div class="caps">Symbols &amp; people</div>
        <div class="chips">
          ${dd.symbols.map(s => `<button class="chip chip-remove" data-action="removeSymbol" data-value="${esc(s)}" aria-label="Remove ${esc(s)}">${esc(s)}${Icons.close}</button>`).join('')}
          <input class="chip-input" style="min-width:160px" data-field="dreamDraft.symInput" data-enter="addSymbolFromInput" value="${esc(dd.symInput)}" placeholder="moon, Grandma… press enter"></div>
        <div class="chips" style="gap:6px">${suggestions.map(s => `<button class="chip chip-suggest" data-action="addSymbolSuggestion" data-value="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div>
      </div>
    </div>`;
  }

  /* ======================= PROMPTS ======================= */
  function favSet() { return new Set(state.data.favorite_prompts.map(f => f.prompt_id)); }
  function promptPool() {
    const t = state.promptTheme, favs = favSet();
    return D.PROMPTS.filter(p => t === 'all' || (t === 'favorites' ? favs.has(p.id) : p.theme === t));
  }
  function favButton(id, isFav, cls) {
    return `<button class="${cls}" data-action="toggleFav" data-id="${id}" aria-label="${isFav ? 'Remove from favorites' : 'Save as favorite'}">${Icons.daisy(isFav)}</button>`;
  }

  function prompts() {
    const favs = favSet(), pool = promptPool(), daily = dailyPromptId();
    const heroId = state.promptPick || daily;
    const hp = D.PROMPTS.find(p => p.id === heroId);
    const themes = [['all', 'All 150'], ['favorites', 'Favorites · ' + favs.size]].concat(D.THEMES.map(t => [t.k, t.label]));
    return `<div class="page-head" style="display:block">${kicker('spiritual prompts')}<h1 class="page-title">A lantern for tonight</h1></div>
    <div class="prompt-card prompts-hero" id="prompts-hero">
      <div class="row"><div class="kicker" style="color:inherit;font-size:20px">${heroId === daily ? "today's prompt" : 'a prompt for you'}</div>
        <div class="theme-pill">${esc(D.themeLabel(hp.theme))}</div></div>
      <p class="text">${esc(hp.text)}</p>
      <div class="actions">
        <button class="btn-prompt" data-action="writeFromPrompt" data-id="${hp.id}">Write from this</button>
        ${favButton(hp.id, favs.has(hp.id), 'round-prompt')}
        <button class="round-prompt" data-action="newPrompt" aria-label="New prompt">${Icons.refresh}</button>
      </div></div>
    <div class="chips scroll" style="padding:20px 16px 4px">${themes.map(([k, l]) => chip(esc(l), state.promptTheme === k, 'promptTheme', `data-value="${k}"`)).join('')}</div>
    <div class="muted small" style="padding:10px 22px 0">${state.promptTheme === 'favorites' && !pool.length ? 'No favorites yet. Tap a daisy to keep one.' : pool.length + ' prompts'}</div>
    <div style="display:flex;flex-direction:column;padding:6px 16px 0">${pool.slice(0, state.promptLimit).map(p => `
      <div class="prompt-row"><div style="flex:1;min-width:0">
        <div class="text">${esc(p.text)}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:6px"><span class="caps">${esc(D.themeLabel(p.theme))}</span>
          <button class="write-link" data-action="writeFromPrompt" data-id="${p.id}">Write</button></div></div>
        ${favButton(p.id, favs.has(p.id), 'icon-btn')}</div>`).join('')}</div>
    ${pool.length > state.promptLimit ? '<div style="display:flex;justify-content:center;padding:18px"><button class="btn" data-action="morePrompts">Show more</button></div>' : ''}`;
  }

  /* ======================= STUDY ======================= */
  const RING_C = 2 * Math.PI * 112; // circumference of the ring
  const hrs = m => String(Math.round(m / 6) / 10);

  // The parts of the timer that change every second
  function timerView() {
    const t = state.timer, s = state.data.settings, total = phaseSeconds();
    const el = Math.min(timerElapsed(), total), rem = Math.max(0, total - el), prog = el / total;
    const running = !!t.startedAt;
    return {
      time: D.pad(Math.floor(rem / 60)) + ':' + D.pad(Math.floor(rem % 60)),
      offset: RING_C * (1 - prog),
      glow: .1 + .75 * prog,
      phase: t.phase === 'focus' ? (running ? 'focusing' : el > 0 ? 'paused' : 'ready when you are') : (running ? 'resting' : 'time to rest'),
      sub: t.phase === 'focus' ? esc(s.study_subject) + ' · ' + s.study_focus + ' minutes' : s.study_break + '-minute rest'
    };
  }
  // Called each second by app.js — updates just the clock, not the whole page.
  function updateTimer() {
    const v = timerView(), $ = id => document.getElementById(id);
    if (!$('t-time')) return;
    $('t-time').textContent = v.time;
    $('t-ring').setAttribute('stroke-dashoffset', v.offset);
    $('t-glow').style.opacity = v.glow;
    $('t-phase').textContent = v.phase;
  }

  function study() {
    const d = state.data, s = d.settings, t = state.timer, v = timerView();
    const running = !!t.startedAt, el = timerElapsed(), busy = running || el > 0;
    const sessions = d.study_sessions, total = totalStudyMinutes(), td = today();
    const minOn = ds => sessions.filter(x => x.date === ds).reduce((a, x) => a + Number(x.minutes), 0);

    // Chart values: last 7 days, last 6 weeks, or totals by subject
    let vals = [], labels = [];
    if (state.studyView === 'week') {
      const weekStart = D.addDays(td, -D.parse(td).getDay());
      for (let i = 5; i >= 0; i--) {
        const st = D.addDays(weekStart, -7 * i); let m = 0;
        for (let j = 0; j < 7; j++) m += minOn(D.addDays(st, j));
        vals.push(m / 60); const sd = D.parse(st); labels.push(D.MONTHS[sd.getMonth()].slice(0, 3) + ' ' + sd.getDate());
      }
    } else {
      for (let i = 6; i >= 0; i--) { const ds = D.addDays(td, -i); vals.push(minOn(ds) / 60); labels.push(D.DAYS[D.parse(ds).getDay()].slice(0, 3)); }
    }
    const hill = D.hillPath(vals, 320, 130, 18);
    const bySubject = {}; sessions.forEach(x => { bySubject[x.subject] = (bySubject[x.subject] || 0) + Number(x.minutes); });
    const sMax = Math.max(1, ...Object.values(bySubject));
    const colors = ['#F4D4DE', '#CFE0EC', '#DCCFEA', '#F8D3C5', '#CDD3F0'];
    let weekMin = 0; for (let i = 0; i < 7; i++) weekMin += minOn(D.addDays(td, -i));
    const earned = KEEPSAKES.filter(k => total >= k.need).length;

    let buttons = `<button class="btn btn-accent" style="min-width:150px" data-action="${running ? 'pauseTimer' : 'startTimer'}">
      ${running ? 'Pause' : el > 0 ? 'Resume' : t.phase === 'focus' ? 'Begin focus' : 'Begin rest'}</button>`;
    if (el > 0) buttons += `<button class="btn btn-soft" data-action="stopTimer">${t.phase === 'focus' && el >= 60 ? 'End &amp; keep ' + Math.floor(el / 60) + ' min' : 'Reset'}</button>`;
    if (t.phase === 'break' && !busy) buttons += '<button class="btn btn-soft" data-action="skipBreak">Skip rest</button>';

    return `<div class="page-head" style="display:block">${kicker('study companion')}<h1 class="page-title">Focus</h1></div>
    <div class="card timer-card">
      <div class="ring">
        <div class="glow" id="t-glow" style="opacity:${v.glow}"></div>
        <svg width="260" height="260" viewBox="0 0 260 260">
          <defs><linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8D3C5"/><stop offset=".5" stop-color="#EDB9CB"/><stop offset="1" stop-color="#DCCFEA"/></linearGradient></defs>
          <circle cx="130" cy="130" r="112" fill="none" stroke="var(--line)" stroke-width="8"/>
          <circle id="t-ring" class="progress" cx="130" cy="130" r="112" fill="none" stroke="url(#ring-grad)" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${RING_C}" stroke-dashoffset="${v.offset}" transform="rotate(-90 130 130)"/>
        </svg>
        <div class="face"><div class="kicker" style="font-size:19px" id="t-phase">${v.phase}</div>
          <div class="time" id="t-time">${v.time}</div><div class="muted small">${v.sub}</div></div>
      </div>
      <div class="timer-actions">${buttons}</div>
      <div class="grass"><div class="g1"></div><div class="g2"></div></div>
    </div>

    <div class="card section" style="gap:16px">
      <div style="display:flex;flex-direction:column;gap:8px"><div class="caps">Focus, in minutes</div>
        <div class="minutes">${[45, 50, 60, 75, 90].map(m => chip(m, s.study_focus === m, 'setFocus', `data-value="${m}" ${busy ? 'disabled' : ''}`)).join('')}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><div class="caps">Rest</div>
        <div class="chips">${[10, 15].map(m => chip(m + ' min', s.study_break === m, 'setBreak', `data-value="${m}" ${busy ? 'disabled' : ''}`)).join('')}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><div class="caps">Subject</div>
        <div class="chips" style="align-items:center">${s.subjects.map(x => chip(esc(x), s.study_subject === x, 'setSubject', `data-value="${esc(x)}"`)).join('')}
          <input class="chip-input" style="min-width:120px" data-field="subjectInput" data-enter="addSubject" value="${esc(state.subjectInput)}" placeholder="+ new subject"></div></div>
    </div>

    <div class="card section">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <div class="h-card">Hours studied</div><div class="muted small" style="white-space:nowrap">${hrs(weekMin)} h this week</div></div>
      <div class="views">${[['day', 'By day'], ['week', 'By week'], ['subject', 'By subject']].map(([k, l]) => chip(l, state.studyView === k, 'studyView', `data-value="${k}"`)).join('')}</div>
      ${state.studyView !== 'subject' ? `
        <svg viewBox="0 0 320 130" width="100%" height="130" preserveAspectRatio="none" style="display:block;overflow:visible">
          <defs><linearGradient id="study-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EDB9CB" stop-opacity=".75"/><stop offset="1" stop-color="#DCCFEA" stop-opacity=".12"/></linearGradient></defs>
          <path d="${hill.area}" fill="url(#study-area)"/><path d="${hill.line}" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div class="chart-labels">${labels.map((l, i) => `<div><b>${vals[i] ? Math.round(vals[i] * 10) / 10 + 'h' : '·'}</b><span>${l}</span></div>`).join('')}</div>`
      : `<div class="bars">${Object.entries(bySubject).map(([x, m], i) => `<div style="height:${16 + (m / sMax) * 110}px;background:${colors[i % 5]};box-shadow:0 0 20px ${colors[i % 5]}"></div>`).join('')}</div>
        <div class="bar-labels">${Object.entries(bySubject).map(([x, m]) => `<div><div style="font-weight:700">${hrs(m)}h</div><div class="muted">${esc(x)}</div></div>`).join('')}</div>`}
      <div class="muted small">${hrs(total)} hours in all. Every minute counts, whenever it happens.</div>
    </div>

    <div class="card section keepsakes-card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <div class="h-card">Keepsakes</div><div class="muted small">${earned} of ${KEEPSAKES.length} collected</div></div>
      <div class="keepsakes">${KEEPSAKES.map(k => { const on = total >= k.need;
        return `<div class="keepsake ${on ? 'earned' : ''}"><div class="frame"><div class="art" style="background:${k.art}"></div></div>
          <div class="name">${k.name}</div><div class="need">${on ? k.label : k.need === 1 ? 'after your first session' : hrs(k.need - total) + ' h to go'}</div></div>`; }).join('')}</div>
    </div>`;
  }

  /* ======================= SAVINGS ======================= */
  function savings() {
    const d = state.data, n = now(), td = today();
    const goal = Number(d.settings.monthly_goal) || 0;
    const deps = d.savings_deposits.slice().sort((a, b) => b.date.localeCompare(a.date));
    const mTotal = key => deps.filter(x => x.date.startsWith(key)).reduce((a, x) => a + Number(x.amount), 0);
    const cur = mTotal(td.slice(0, 7)), pct = goal ? Math.min(1, cur / goal) : 0;
    const np = D.nextPayday(td), daysTo = D.diffDays(np, td);

    // Calendar for the month being viewed
    const sv = new Date(n.getFullYear(), n.getMonth() + state.saveOffset, 1);
    const svKey = sv.getFullYear() + '-' + D.pad(sv.getMonth() + 1);
    const paydays = D.paydaysIn(sv.getFullYear(), sv.getMonth()), pdSet = new Set(paydays);
    const depByDate = {}; deps.forEach(x => { depByDate[x.date] = (depByDate[x.date] || 0) + Number(x.amount); });
    let cells = '';
    for (let i = 0; i < sv.getDay(); i++) cells += '<span class="save-day blank"></span>';
    const dim = new Date(sv.getFullYear(), sv.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= dim; i++) {
      const ds = svKey + '-' + D.pad(i), isP = pdSet.has(ds), dep = depByDate[ds];
      cells += `<span class="save-day ${isP ? 'payday' : ''} ${dep ? 'deposit' : ''} ${ds === td ? 'today' : ''}"
        title="${isP ? 'Payday' : ''}${dep ? ' · ' + D.money(dep) + ' saved' : ''}">${i}</span>`;
    }
    // Some months hold three paydays
    let three = '';
    if (paydays.length === 3) three = D.MONTHS[sv.getMonth()] + ' holds three paydays. Your goal stays the same, so the third one is extra breathing room.';
    else for (let i = 1; i <= 24; i++) {
      const m = new Date(sv.getFullYear(), sv.getMonth() + i, 1);
      if (D.paydaysIn(m.getFullYear(), m.getMonth()).length === 3) { three = 'Most months hold two paydays. ' + D.MONTHS[m.getMonth()] + ' ' + m.getFullYear() + ' will hold three.'; break; }
    }
    // Six months chart
    const mv = [], ml = [];
    for (let i = 5; i >= 0; i--) { const m = new Date(n.getFullYear(), n.getMonth() - i, 1); mv.push(mTotal(m.getFullYear() + '-' + D.pad(m.getMonth() + 1))); ml.push(D.MONTHS[m.getMonth()].slice(0, 3)); }
    const cMax = Math.max(goal, ...mv, 1) * 1.08, hill = D.hillPath(mv, 320, 130, 18, cMax);
    const goalY = 130 - 6 - (goal / cMax) * (130 - 6 - 18);
    const HILL = 'M0,110 L0,96 C40,74 90,40 150,34 C215,28 270,52 320,84 L320,110 Z';

    return `<div class="page-head">
      <div>${kicker('savings')}<h1 class="page-title">A little for later</h1></div>
      <button class="btn btn-accent" style="flex:none" data-action="openDeposit">Log deposit</button></div>

    <div class="card countdown">
      <div class="num">${daysTo === 0 ? '✦' : daysTo}</div>
      <div style="flex:1;min-width:0">
        <div class="h-card">${daysTo === 0 ? 'Today is payday.' : (daysTo === 1 ? '1 day' : daysTo + ' days') + ' until payday'}</div>
        <div class="kicker" style="font-size:18px;margin-top:4px">${D.long(np)}</div>
        <div class="muted small" style="margin-top:4px">Every other Friday.</div></div></div>

    <div class="card section" style="padding:20px 18px 18px;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <div class="h-card">${D.MONTHS[n.getMonth()]}'s goal</div><button class="btn-link" style="padding:0" data-action="editGoal">Change goal</button></div>
      <div style="display:flex;align-items:baseline;gap:8px"><span class="big-num">${D.money(cur)}</span>
        <span class="muted" style="font-size:15px">${goal ? 'of ' + D.money(goal) : 'no goal set'}</span></div>
      <svg viewBox="0 0 320 110" width="100%" height="110" preserveAspectRatio="none" style="display:block">
        <defs><linearGradient id="hill-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#F8D3C5"/><stop offset=".5" stop-color="#F4D4DE"/><stop offset="1" stop-color="#DCCFEA"/></linearGradient>
          <clipPath id="hill-clip"><rect x="0" y="0" width="${320 * pct}" height="110"/></clipPath></defs>
        <path d="${HILL}" fill="var(--tint)" stroke="var(--line)"/>
        <path d="${HILL}" fill="url(#hill-grad)" clip-path="url(#hill-clip)" style="filter:drop-shadow(0 0 10px rgba(243,201,214,.7))"/></svg>
      <div class="muted small">${!goal ? 'Set a monthly goal to watch the hill fill.' : cur >= goal ? 'Reached. Anything more is a gift to future you.' : D.money(goal - cur) + ' to go, at whatever pace feels right.'}</div>
      ${state.goalEdit != null ? `<div style="display:flex;gap:10px">
        <input class="input" data-field="goalEdit" value="${esc(state.goalEdit)}" inputmode="decimal" placeholder="Monthly goal" style="flex:1;min-width:0">
        <button class="btn btn-accent" data-action="saveGoal">Save</button></div>` : ''}
      ${three ? `<div class="note-dashed">${three}</div>` : ''}
    </div>

    <div class="card" style="margin:16px 16px 0;padding:16px 14px 18px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px 10px">
        <div class="h-card" style="font-size:22px">${D.MONTHS[sv.getMonth()]} ${sv.getFullYear()}</div>
        <div class="month-nav"><button style="width:40px;height:40px;background:transparent;border-color:var(--line)" data-action="savePrev" aria-label="Previous month">${Icons.prev}</button>
          <button style="width:40px;height:40px;background:transparent;border-color:var(--line)" data-action="saveNext" aria-label="Next month">${Icons.next}</button></div></div>
      <div class="weekdays" style="margin-bottom:6px"><div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div></div>
      <div class="cal">${cells}</div>
      <div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:13px;color:var(--ink2)">
        <span style="display:flex;align-items:center;gap:6px"><span class="dot-sm" style="border:1.5px solid var(--accent);background:var(--tint2)"></span>payday</span>
        <span style="display:flex;align-items:center;gap:6px"><span class="dot-sm" style="background:#F4D4DE"></span>deposit</span></div>
    </div>

    <div class="card section" style="gap:12px">
      <div class="h-card">Across the months</div>
      <svg viewBox="0 0 320 130" width="100%" height="130" preserveAspectRatio="none" style="display:block;overflow:visible">
        <defs><linearGradient id="month-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4D4DE" stop-opacity=".9"/><stop offset="1" stop-color="#CFE0EC" stop-opacity=".15"/></linearGradient></defs>
        <path d="${hill.area}" fill="url(#month-area)"/><path d="${hill.line}" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
        ${goal ? `<line x1="0" x2="320" y1="${goalY}" y2="${goalY}" stroke="var(--lineStrong)" stroke-dasharray="4 5"/>` : ''}</svg>
      <div class="chart-labels">${ml.map((l, i) => `<div><b>${mv[i] ? D.money(mv[i]) : '·'}</b><span>${l}</span></div>`).join('')}</div>
      <div class="muted" style="font-size:13px">Dashed line: your monthly goal.</div>
    </div>

    <div class="card" style="margin:16px 16px 0;padding:6px 18px">
      ${deps.length ? '' : '<div class="muted" style="padding:16px 0;font-size:15px">No deposits logged yet.</div>'}
      ${deps.slice(0, 12).map(x => `<div class="deposit-row">
        <div style="flex:1;min-width:0"><div class="kicker" style="font-size:17px">${D.short(x.date)}</div>
          ${x.note ? `<div class="muted small">${esc(x.note)}</div>` : ''}</div>
        <div class="serif tnum" style="font-size:24px">${D.money(Number(x.amount))}</div>
        <button class="icon-btn" style="width:40px;height:40px;border:0" data-action="deleteDeposit" data-id="${esc(x.id)}" aria-label="Delete deposit">${Icons.close}</button></div>`).join('')}
    </div>
    <div class="muted" style="padding:14px 22px 0;font-size:13px;text-align:center">Manual entries only. This mirrors your savings account; it never connects to it.</div>`;
  }

  /* ======================= NAV + OVERLAYS ======================= */
  const NAV = [['home', 'Home', 'home'], ['journal', 'Journal', 'feather'], ['mood', 'Mood', 'wave'], ['dreams', 'Dreams', 'moon'],
    ['prompts', 'Prompts', null], ['study', 'Study', 'hourglass'], ['savings', 'Savings', 'sprout']];
  function nav() {
    const s = state.screen;
    const current = ['reader', 'editor'].includes(s) ? 'journal' : ['dreamRead', 'dreamEdit'].includes(s) ? 'dreams' : s === 'settings' ? 'home' : s;
    return NAV.map(([k, label, icon]) => `<button class="${current === k ? 'on' : ''}" data-action="nav" data-to="${k}" aria-label="${label}" ${current === k ? 'aria-current="page"' : ''}>
      <span class="pill">${icon ? Icons[icon] : Icons.daisy(false, 22)}</span><span class="label">${label}</span></button>`).join('');
  }

  function overlays() {
    let html = '';
    const q = state.quick;
    if (q) {
      html += `<div class="backdrop" data-action="closeQuick"><div class="sheet" data-action="noop">
        <div class="handle"></div><h2>${q.mode === 'line' ? 'Just one line' : 'How are you, right now?'}</h2>
        ${q.mode === 'line' ? `<input class="input" style="min-height:52px;font-size:17px" data-field="quick.text" value="${esc(q.text)}" placeholder="One line about today">` : ''}
        ${moodGrid(q.mood, 'quickPick')}
        <button class="btn btn-accent" style="min-height:52px" data-action="saveQuick" data-save="quick" ${q.mood || q.text.trim() ? '' : 'disabled'}>Keep it</button>
      </div></div>`;
    }
    if (state.day) {
      const ds = state.day, m = moodByDate()[ds], rest = state.data.rest_days.some(r => r.date === ds);
      html += `<div class="backdrop" data-action="closeDay"><div class="sheet" data-action="noop" style="gap:14px">
        <div class="handle"></div><div class="kicker" style="font-size:22px">${D.scriptDate(ds)}</div>
        <div class="muted">${m ? `You noted feeling ${m.mood}. No words that day, and that's fine.` : rest ? 'A rest day.' : 'A quiet day. Nothing needed.'}</div>
        <div class="two-col"><button class="btn btn-accent" data-action="dayWrite">Write about it</button>
          <button class="btn btn-soft" data-action="dayRest">${rest ? 'Unmark rest' : 'Mark as rest'}</button></div>
      </div></div>`;
    }
    const dep = state.deposit;
    if (dep) {
      html += `<div class="backdrop" data-action="closeDeposit"><div class="sheet" data-action="noop" style="gap:14px">
        <div class="handle"></div><h2>${D.isPayday(today()) ? 'Payday deposit' : 'Log a deposit'}</h2>
        <label class="field caps">Amount<input class="input serif" style="font-size:28px;text-transform:none;letter-spacing:0;font-weight:400" data-field="deposit.amount" value="${esc(dep.amount)}" inputmode="decimal" placeholder="$0"></label>
        <label class="field caps">Date<input class="input" type="date" style="text-transform:none;letter-spacing:0;font-weight:400" data-field="deposit.date" value="${esc(dep.date)}"></label>
        <label class="field caps">Note, optional<input class="input" style="text-transform:none;letter-spacing:0;font-weight:400" data-field="deposit.note" value="${esc(dep.note)}" placeholder="What it's for, or how it felt"></label>
        <button class="btn btn-accent" style="min-height:52px" data-action="saveDeposit">Keep it</button>
      </div></div>`;
    }
    if (state.confirm) {
      const c = state.confirm;
      html += `<div class="dialog-wrap"><div class="dialog" role="dialog" aria-modal="true">
        <h2>${esc(c.title)}</h2><div class="muted" style="font-size:15px">${esc(c.body)}</div>
        <div class="actions"><button class="btn btn-soft" style="border-color:var(--line)" data-action="closeConfirm">Keep</button>
          <button class="btn btn-accent" data-action="confirmOk">${esc(c.okLabel)}</button></div></div></div>`;
    }
    if (state.bloom) {
      const cols = ['#F8D3C5', '#F4D4DE', '#DCCFEA', '#CFE0EC', '#F2C6C8'];
      const petals = Array.from({ length: 24 }, (_, i) => {
        const a = i / 24 * Math.PI * 2, r = 110 + (i % 3) * 45;
        return `<div class="petal" style="background:${cols[i % 5]};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px;--r:${i * 37}deg;animation-delay:${(i % 6) * .09}s"></div>`;
      }).join('');
      html += `<div class="bloom" data-action="closeBloom">${petals}<div class="bloom-card">
        <div class="kicker" style="font-size:20px">in full bloom</div>
        <div class="serif" style="font-size:30px;line-height:1.1;margin:4px 0 8px">You reached this month's goal.</div>
        <div class="muted" style="font-size:15px">Tap anywhere to continue.</div></div></div>`;
    }
    if (state.toast) html += `<div class="toast" role="status">${esc(state.toast)}</div>`;
    return html;
  }

  /* ---------- helpers called from app.js ---------- */

  // While typing, enable or disable Save buttons without redrawing.
  function refreshSaveButtons() {
    document.querySelectorAll('[data-save]').forEach(btn => {
      const kind = btn.dataset.save;
      let ok = false;
      if (kind === 'draft') ok = draftCanSave();
      if (kind === 'dream') ok = !!(state.dreamDraft && (state.dreamDraft.title.trim() || state.dreamDraft.description.trim()));
      if (kind === 'quick') ok = !!(state.quick && (state.quick.mood || state.quick.text.trim()));
      btn.disabled = !ok;
    });
    const hint = document.querySelector('[data-save-hint]');
    if (hint) hint.hidden = draftCanSave();
  }

  // Updates just the microphone button and the words-in-progress line,
  // so speaking never redraws the page or moves your cursor.
  function updateDictation() {
    const btn = document.getElementById('mic-btn');
    if (btn) {
      btn.classList.toggle('on', dictation.listening);
      btn.setAttribute('aria-pressed', dictation.listening);
      btn.querySelector('span').textContent = dictation.listening ? 'Listening… tap to stop' : 'Speak your dream';
    }
    const interim = document.getElementById('dictate-interim');
    if (interim) interim.textContent = dictation.interim;
    const box = document.getElementById('dream-desc');
    if (box && state.dreamDraft && box.value !== state.dreamDraft.description) box.value = state.dreamDraft.description;
    refreshSaveButtons();
  }

  // A gentle windswept drift when a new prompt appears.
  function drift(selector) {
    const el = document.querySelector(selector);
    if (!el || !el.animate || state.data.settings.reduced_motion) return;
    el.animate([
      { opacity: 0, transform: 'translate(-18px,8px) rotate(-1.6deg)' },
      { opacity: 1, transform: 'translate(3px,-1px) rotate(.4deg)', offset: .7 },
      { opacity: 1, transform: 'none' }
    ], { duration: 1100, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }

  const SCREENS = { home, journal, reader, editor, mood, settings, dreams, dreamRead, dreamEdit, prompts, study, savings };

  return { SCREENS, nav, overlays, lock, promptPool, updateTimer, refreshSaveButtons, updateDictation, drift };
})();

/* ---------- render(): draw the current screen ---------- */
function render() {
  const night = isNight();
  document.body.className = (night ? 'theme-night' : 'theme-day') + (state.data.settings.reduced_motion ? ' reduce-motion' : '');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', night ? '#4A3443' : '#FBF8F1');
  const screen = isLocked() ? Screens.lock : (Screens.SCREENS[state.screen] || Screens.SCREENS.home);
  document.getElementById('app').innerHTML = screen();
  document.getElementById('nav').innerHTML = Screens.nav();
  document.getElementById('overlays').innerHTML = Screens.overlays();
}
