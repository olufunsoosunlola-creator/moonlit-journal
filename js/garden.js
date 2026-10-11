/* ==========================================================================
   garden.js — the Garden tab and its Time-Lapse
   --------------------------------------------------------------------------
   The garden is built from data you already have:
     • each journal entry is a THOUGHT: a glowing point in its mood's color
     • each tag is a ROOT: thoughts gather around it, and it swells as
       more of them arrive
     • entries that share a tag are joined by a THREAD of silk
   Every piece has a "birth day" taken from the entry's saved date, so the
   garden can be rebuilt exactly as it was on any day. Nothing extra is stored.

   It's drawn on a <canvas> (a drawing surface) rather than with HTML
   elements, which keeps it smooth even with hundreds of thoughts.
   ========================================================================== */

const Garden = (function () {
  const D = Data;

  // Playback speeds, in days of garden time per second.
  const SPEEDS = { slow: 3.5, gentle: 7, swift: 21 };

  // What the Garden screen is showing (screens.js reads this).
  const view = {
    lapse: false,       // is Time-Lapse mode open?
    t: 0,               // the day being shown, counted from the first thought (can be fractional while playing)
    playing: false,
    speed: 'gentle',
    ended: false,       // playback reached today
    selected: null      // id of the thought you tapped
  };

  /* ---------- 1. Build the garden from your entries ---------- */

  let model = null, modelFor = null;

  // Golden angle: spreading things out by this angle never lines them up,
  // the same trick sunflowers use for their seeds.
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  function build(data) {
    const entries = data.journal_entries
      .filter(e => e.date)
      .slice()
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    if (!entries.length) return { empty: true };

    const first = entries[0].date;
    const lastDay = Math.max(0, D.diffDays(today(), first)); // "today", in garden days
    const dayOf = date => D.diffDays(date, first);

    // Roots: one per tag, in the order they first appeared
    const roots = [], rootByTag = new Map();
    entries.forEach(e => (e.tags || []).forEach(tag => {
      if (!rootByTag.has(tag)) {
        const root = { tag, day: dayOf(e.date), memberDays: [], members: [] };
        rootByTag.set(tag, root);
        roots.push(root);
      }
      const root = rootByTag.get(tag);
      root.members.push(e);
      root.memberDays.push(dayOf(e.date));
    }));
    // Place roots on a sunflower spiral, earliest roots near the center
    roots.forEach((r, i) => {
      const angle = i * GOLDEN + 0.6;
      const dist = 0.78 * Math.sqrt((i + 0.6) / (roots.length + 0.6));
      r.x = Math.cos(angle) * dist;
      r.y = Math.sin(angle) * dist;
      r.id = 'root:' + r.tag;
    });

    // Thoughts: gather around their first tag's root
    const placedIn = new Map();
    const thoughts = entries.map(e => {
      const root = (e.tags || []).length ? rootByTag.get(e.tags[0]) : null;
      let x, y;
      if (root) {
        const k = placedIn.get(root) || 0;
        placedIn.set(root, k + 1);
        const a = k * GOLDEN + hash(root.tag) * 6.28;
        const r = 0.07 + 0.04 * Math.sqrt(k);
        x = root.x + Math.cos(a) * r;
        y = root.y + Math.sin(a) * r;
      } else {
        // Untagged thoughts drift around the edge of the garden
        const a = hash(e.id) * Math.PI * 2;
        x = Math.cos(a) * 0.9;
        y = Math.sin(a) * 0.9;
      }
      return {
        id: e.id, entry: e, day: dayOf(e.date), root,
        x: Math.max(-0.95, Math.min(0.95, x)),
        y: Math.max(-0.95, Math.min(0.95, y)),
        color: D.MOOD_COLOR[e.mood] || '#F3C9D6'
      };
    });
    const indexOf = new Map(thoughts.map((t, i) => [t.id, i]));

    // Threads: join each thought to the previous thought with the same tag
    const threads = [], seen = new Set();
    roots.forEach(r => {
      for (let i = 1; i < r.members.length; i++) {
        const a = indexOf.get(r.members[i - 1].id), b = indexOf.get(r.members[i].id);
        const key = a < b ? a + '-' + b : b + '-' + a;
        if (a === b || seen.has(key)) continue;
        seen.add(key);
        threads.push({ id: 'thread:' + key, a, b, day: Math.max(thoughts[a].day, thoughts[b].day), bend: hash(key) - 0.5 });
      }
    });
    threads.sort((p, q) => p.day - q.day);

    // Slider markers: the day each root first appeared, and the busiest week
    const weekCounts = {};
    thoughts.forEach(t => { const w = weekStartDay(t.day, first); weekCounts[w] = (weekCounts[w] || 0) + 1; });
    let busiest = null;
    for (const w in weekCounts) if (!busiest || weekCounts[w] > weekCounts[busiest]) busiest = w;
    const markers = roots.filter(r => r.day > 0).map(r => ({ day: r.day, kind: 'root', label: 'New root: #' + r.tag }));
    if (busiest != null) markers.push({ day: Number(busiest), kind: 'busy', label: 'Busiest week: ' + weekCounts[busiest] + ' thoughts' });

    return { empty: false, first, lastDay, roots, thoughts, threads, markers };
  }

  // Rebuild only when your data changes (state.data is replaced on every save).
  function getModel() {
    if (modelFor !== state.data) { model = build(state.data); modelFor = state.data; }
    return model;
  }

  /* ---------- 2. Date helpers for the slider ---------- */

  // Garden day → the Monday that starts its week (also as a garden day)
  function weekStartDay(day, first) {
    const date = D.addDays(first, Math.floor(day));
    const back = (D.parse(date).getDay() + 6) % 7; // Monday = 0
    return Math.floor(day) - back;
  }
  function dateOf(day) { return D.addDays(getModel().first, Math.floor(day)); }
  function weekLabel(day) {
    const m = getModel();
    const d = D.parse(D.addDays(m.first, weekStartDay(day, m.first)));
    return `Week of ${D.MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // What happened in the week being shown, e.g. "4 thoughts planted · 1 new root: #mysticism."
  function weekSummary(day) {
    const m = getModel(), ws = weekStartDay(day, m.first), we = Math.min(ws + 6, Math.floor(day));
    const planted = m.thoughts.filter(t => t.day >= ws && t.day <= we).length;
    const newRoots = m.roots.filter(r => r.day >= ws && r.day <= we).map(r => '#' + r.tag);
    if (!planted && !newRoots.length) return 'A quiet week. The garden rested, and that\'s okay.';
    let line = `${planted} ${planted === 1 ? 'thought' : 'thoughts'} planted`;
    if (newRoots.length) line += ` · ${newRoots.length} new ${newRoots.length === 1 ? 'root' : 'roots'}: ${newRoots.join(', ')}`;
    return line + '.';
  }

  // How many items in a list sorted by day were born on or before `day`
  function countUpTo(list, day, get) {
    let lo = 0, hi = list.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (get(list[mid]) <= day) lo = mid + 1; else hi = mid; }
    return lo;
  }

  /* ---------- 3. Drawing ---------- */

  let canvas = null, ctx = null, W = 0, H = 0, dpr = 1;
  let raf = null, lastFrame = 0, rippleAt = 0;
  const appeared = new Map();   // id → the moment (ms) it appeared, for bloom animations
  const rootSize = new Map();   // root id → its current drawn size, so roots swell smoothly
  let shownThoughts = 0, shownThreads = 0;

  function reducedMotion() {
    return state.data.settings.reduced_motion ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // A soft glow "sticker" for each color, drawn once and reused (much faster
  // than drawing a fresh gradient for every point, every frame).
  const glowCache = {};
  function glow(color) {
    if (glowCache[color]) return glowCache[color];
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color + 'AA');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return (glowCache[color] = c);
  }

  const px = t => W / 2 + t.x * W * 0.44;
  const py = t => H / 2 + t.y * H * 0.44;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const easeOut = p => 1 - Math.pow(1 - p, 3);
  const easeBack = p => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);

  // How far along an item's appearance animation is (0 → 1)
  function progress(id, now, ms) {
    if (!appeared.has(id)) appeared.set(id, now);
    return clamp01((now - appeared.get(id)) / ms);
  }

  // Treat everything currently visible as already fully grown (no bloom).
  function settleAll() {
    const m = getModel();
    appeared.clear();
    rootSize.clear();
    if (m.empty) return;
    m.thoughts.forEach(t => { if (t.day <= view.t) appeared.set(t.id, -1e9); });
    m.threads.forEach(t => { if (t.day <= view.t) appeared.set(t.id, -1e9); });
  }

  function frame(now) {
    raf = null;
    if (!canvas || !canvas.isConnected) return; // the screen changed; stop drawing
    const m = getModel();
    if (m.empty) return;
    const reduce = reducedMotion();
    const dt = Math.min(0.1, (now - (lastFrame || now)) / 1000);
    lastFrame = now;
    let busy = false; // does anything still need animating?

    // Advance playback
    if (view.playing) {
      view.t = Math.min(m.lastDay, view.t + dt * SPEEDS[view.speed]);
      updatePanel();
      if (view.t >= m.lastDay) finish();
      busy = true;
    }
    const day = view.t;
    const nThoughts = countUpTo(m.thoughts, day, t => t.day);
    const nThreads = countUpTo(m.threads, day, t => t.day);
    // Scrubbed backwards? Forget those items so they bloom again next time.
    for (let i = nThoughts; i < shownThoughts; i++) appeared.delete(m.thoughts[i].id);
    for (let i = nThreads; i < shownThreads; i++) appeared.delete(m.threads[i].id);
    shownThoughts = nThoughts; shownThreads = nThreads;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Breath: a faint ripple of light passes through now and then (Time-Lapse only)
    let rippleR = -1;
    if (view.lapse && !reduce) {
      if (now - rippleAt > 7000) rippleAt = now;
      const p = (now - rippleAt) / 2600;
      if (p < 1) {
        rippleR = easeOut(p) * Math.hypot(W, H) * 0.6;
        ctx.strokeStyle = `rgba(243,201,214,${0.16 * (1 - p)})`;
        ctx.lineWidth = 18 * (1 - p) + 2;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rippleR, 0, Math.PI * 2); ctx.stroke();
      }
      busy = true;
    }

    // Threads, spun like silk from one thought to the next
    ctx.lineCap = 'round';
    for (let i = 0; i < nThreads; i++) {
      const th = m.threads[i], A = m.thoughts[th.a], B = m.thoughts[th.b];
      const p = progress(th.id, now, reduce ? 500 : 1600);
      if (p < 1) busy = true;
      const ax = px(A), ay = py(A), bx = px(B), by = py(B);
      const cx = (ax + bx) / 2 - (by - ay) * th.bend * 0.5, cy = (ay + by) / 2 + (bx - ax) * th.bend * 0.5;
      ctx.strokeStyle = `rgba(243,201,214,${0.28 * (reduce ? p : 1)})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      if (reduce || p >= 1) ctx.quadraticCurveTo(cx, cy, bx, by);
      else {
        const s = easeOut(p); // draw the curve only part of the way
        for (let k = 1; k <= 14; k++) {
          const u = (k / 14) * s;
          ctx.lineTo((1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx,
                     (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by);
        }
      }
      ctx.stroke();
    }

    // Roots: swell and brighten as thoughts gather
    ctx.textAlign = 'center';
    ctx.font = 'italic 15px "Cormorant Garamond", serif';
    m.roots.forEach(r => {
      if (r.day > day) { rootSize.delete(r.id); return; }
      const count = countUpTo(r.memberDays, day, d => d);
      const target = 4 + 2.6 * Math.sqrt(count);
      const cur = rootSize.has(r.id) ? rootSize.get(r.id) : (reduce ? target : 0);
      const size = reduce ? target : cur + (target - cur) * Math.min(1, dt * 2.5);
      if (Math.abs(target - size) > 0.05) busy = true;
      rootSize.set(r.id, size);
      const bright = 0.35 + 0.65 * Math.min(1, count / 8);
      const x = px(r), y = py(r);
      ctx.globalAlpha = bright * 0.9;
      const g = glow('#FBEFF3'), s = size * 5;
      ctx.drawImage(g, x - s / 2, y - s / 2, s, s);
      ctx.globalAlpha = bright;
      ctx.fillStyle = '#FFF6F2';
      ctx.beginPath(); ctx.arc(x, y, Math.max(1, size * 0.45), 0, Math.PI * 2); ctx.fill();
      if (count >= 2) {
        ctx.globalAlpha = 0.45 + 0.5 * Math.min(1, count / 6);
        ctx.fillStyle = '#F3C9D6';
        ctx.fillText('#' + r.tag, x, y - size * 1.4 - 6);
      }
      ctx.globalAlpha = 1;
    });

    // Thoughts: a tiny spark that softly blooms into a glowing point
    for (let i = 0; i < nThoughts; i++) {
      const t = m.thoughts[i];
      const p = progress(t.id, now, reduce ? 400 : 1100);
      if (p < 1) busy = true;
      const x = px(t), y = py(t);
      const scale = reduce ? 1 : easeBack(p);
      let alpha = reduce ? p : Math.min(1, p * 3);
      if (rippleR > 0 && Math.abs(Math.hypot(x - W / 2, y - H / 2) - rippleR) < 26) alpha = Math.min(1, alpha + 0.3);
      if (t.root) { // a faint stem down to its root
        ctx.strokeStyle = `rgba(243,201,214,${0.12 * alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px(t.root), py(t.root)); ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      const s = 26 * scale;
      if (s > 0) ctx.drawImage(glow(t.color), x - s / 2, y - s / 2, s, s);
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, 3.4 * scale), 0, Math.PI * 2); ctx.fill();
      if (!reduce && p < 0.45) { // the first spark
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 1 - p / 0.45;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      if (t.id === view.selected) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#FBF3EA'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (busy) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) { lastFrame = 0; raf = requestAnimationFrame(frame); }
  }

  /* ---------- 4. Connecting to the page ---------- */

  // render() rebuilds the screen's HTML, so after each render we attach the
  // new <canvas> and keep drawing. The animation memory above survives.
  function mount() {
    canvas = document.getElementById('garden-canvas');
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    canvas.addEventListener('click', onTap);
    if (!view.lapse) { const m = getModel(); if (!m.empty && view.t !== m.lastDay) { view.t = m.lastDay; settleAll(); } }
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    kick();
  }

  // Tap a glowing point to read that thought (not while playing).
  function onTap(e) {
    if (view.playing) return;
    const m = getModel(), rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let best = null, bestDist = 22;
    const n = countUpTo(m.thoughts, view.t, t => t.day);
    for (let i = 0; i < n; i++) {
      const t = m.thoughts[i], d = Math.hypot(px(t) - x, py(t) - y);
      if (d < bestDist) { best = t; bestDist = d; }
    }
    view.selected = best ? best.id : null;
    render();
  }

  // While playing, update the date and slider without redrawing the page.
  function updatePanel() {
    const label = document.getElementById('g-date');
    if (label) label.textContent = weekLabel(view.t);
    const slider = document.getElementById('g-slider');
    if (slider) slider.value = view.t;
  }

  function finish() {
    view.playing = false;
    view.ended = true;
    render();
  }

  // Dragging the slider
  document.addEventListener('input', e => {
    if (e.target.id !== 'g-slider') return;
    view.playing = false;
    view.ended = false;
    view.selected = null;
    view.t = Number(e.target.value);
    updatePanel();
    kick();
    // Show the week card once you let go
    clearTimeout(scrubTimer);
    scrubTimer = setTimeout(render, 250);
  });
  let scrubTimer = null;

  /* ---------- 5. Controls (called from app.js actions) ---------- */

  function open() {
    view.lapse = true; view.selected = null; view.ended = false;
    view.t = 0;
    appeared.clear(); rootSize.clear(); shownThoughts = shownThreads = 0;
    view.playing = !reducedMotion(); // with reduced motion, you step week by week instead
    rippleAt = performance.now();
    render();
  }
  function close() {
    view.lapse = false; view.playing = false; view.ended = false; view.selected = null;
    view.t = getModel().lastDay || 0;
    settleAll();
    render();
  }
  function togglePlay() {
    const m = getModel();
    if (view.playing) { view.playing = false; return render(); }
    if (view.t >= m.lastDay) { // start again from the first seed
      view.t = 0; appeared.clear(); rootSize.clear(); shownThoughts = shownThreads = 0;
    }
    view.ended = false; view.selected = null; view.playing = true;
    render();
  }
  function step(weeks) {
    const m = getModel();
    view.playing = false; view.selected = null;
    view.t = Math.max(0, Math.min(m.lastDay, Math.floor(view.t) + 7 * weeks));
    view.ended = false;
    render();
  }
  function setSpeed(s) { view.speed = s; render(); }

  return { view, getModel, mount, open, close, togglePlay, step, setSpeed, weekLabel, weekSummary, dateOf, reducedMotion };
})();
