/* ==========================================================================
   icons.js — the delicate line icons, as SVG text
   --------------------------------------------------------------------------
   Most are from the Lucide icon set (lucide.dev). Each function returns a
   string of SVG markup that the screens drop straight into their HTML.
   ========================================================================== */

const Icons = (function () {

  // Wraps SVG paths in a standard 24×24 line-icon frame.
  function line(paths, size, stroke) {
    return `<svg width="${size || 21}" height="${size || 21}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="${stroke || 1.4}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  // A daisy made of eight petals around a center.
  // filled = a saved favorite (white petals, golden center)
  function daisy(filled, size) {
    let petals = '';
    for (let a = 0; a < 360; a += 45) {
      petals += `<ellipse cx="12" cy="6" rx="2" ry="3.6" transform="rotate(${a} 12 12)"></ellipse>`;
    }
    if (filled) {
      return `<svg width="${size || 24}" height="${size || 24}" viewBox="0 0 24 24" aria-hidden="true">
        <g fill="#FFFDF8" stroke="#C9A3B8" stroke-width=".8">${petals}</g>
        <circle cx="12" cy="12" r="2.6" fill="#EBCB8B"></circle></svg>`;
    }
    return `<svg width="${size || 24}" height="${size || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.1" aria-hidden="true">${petals}<circle cx="12" cy="12" r="2.6"></circle></svg>`;
  }

  return {
    line: line,
    daisy: daisy,
    // Bottom navigation
    home: line('<path d="M3 18h18"/><path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V7"/><path d="m6.3 11.3-1.4-1.4"/><path d="m17.7 11.3 1.4-1.4"/><path d="M6 21h12"/>'),
    feather: line('<path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>'),
    wave: line('<path d="M2 16c2.5-4.5 5.5-6.5 9-6.5s5.5 2.5 7.5 2.5c1.5 0 2.7-.6 3.5-1.5"/><path d="M2 20.5c3-2 6.5-3 10-3s7 1 10 3"/>'),
    moon: line('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    hourglass: line('<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>', 20),
    sprout: line('<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'),
    // Everyday controls
    settings: line('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', 19, 1.6),
    back: line('<path d="m15 18-6-6 6-6"/>', 22, 1.7),
    prev: line('<path d="m15 18-6-6 6-6"/>', 20, 1.7),
    next: line('<path d="m9 18 6-6-6-6"/>', 20, 1.7),
    plus: line('<path d="M5 12h14"/><path d="M12 5v14"/>', 18, 1.8),
    close: line('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14, 2),
    mic: line('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>', 20, 1.6),
    refresh: line('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>', 18, 1.7)
  };
})();
