// Kodla cizilen piksel sahneler. Tum sahneler 160x90'lik sanal alanda cizilir.
(function () {
  const VW = 160, VH = 90;

  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function sky(c, top, bottom, t, seed = 7, stars = true) {
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      c.fillStyle = mix(top, bottom, i / (bands - 1));
      c.fillRect(0, Math.floor(i * VH / bands), VW, Math.ceil(VH / bands) + 1);
    }
    if (!stars) return;
    const r = rng(seed);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(r() * VW), y = Math.floor(r() * VH * 0.6), ph = r() * 6;
      const on = Math.sin(t * 2 + ph) > -0.3;
      c.fillStyle = on ? '#ffffff' : '#9fb4ff';
      c.fillRect(x, y, 1, 1);
      if (i % 9 === 0 && on) { c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); }
    }
  }
  function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function mix(a, b, k) { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; }
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
  function circle(c, cx, cy, r, col) { c.fillStyle = col; for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); c.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
  function label(c, text, x, y, size, col, shadow) {
    c.font = size + 'px Dogica, monospace'; c.textBaseline = 'alphabetic'; y += Math.round(size * .875);
    if (shadow) { c.fillStyle = shadow; c.fillText(text, x + 1, y + 1); }
    c.fillStyle = col; c.fillText(text, x, y);
  }
  function ctext(c, text, y, size, col, shadow) { c.font = size + 'px Dogica, monospace'; const w = c.measureText(text).width; label(c, text, Math.round((VW - w) / 2), y, size, col, shadow); }

  const SCENES = {
    // Baslik ekrani: ay isiginda deniz ve yelkenli (Hydro = su)
    title(c, t) {
      sky(c, '#0b1033', '#3a2f7a', t, 3);
      circle(c, 128, 20, 8, '#fff6d5'); circle(c, 131, 18, 2, '#e8dfb8'); circle(c, 125, 23, 1, '#e8dfb8');
      // uzak sehir isiklari
      for (let i = 0; i < 18; i++) { const h = 3 + (i * 7) % 9; px(c, 4 + i * 5, 58 - h, 4, h, '#1b1846'); if ((i + Math.floor(t)) % 3) px(c, 5 + i * 5, 56 - h + 2, 1, 1, '#ffd166'); }
      // deniz
      for (let y = 58; y < VH; y++) { px(c, 0, y, VW, 1, mix('#2340a8', '#0a1546', (y - 58) / 32)); }
      for (let i = 0; i < 26; i++) { const y = 60 + (i * 5) % 28, x = ((i * 37 + t * (6 + i % 4)) % (VW + 20)) - 10; px(c, x, y, 6 + i % 5, 1, '#5b8cff'); }
      // ayin denizdeki yansimasi
      for (let y = 60; y < 86; y += 3) px(c, 124 + Math.sin(t * 3 + y) * 2, y, 8 - (y - 60) / 5, 1, '#fff2b0');
      // yelkenli
      const bx = ((t * 8) % (VW + 40)) - 30, by = 54 + Math.sin(t * 2) * 1;
      px(c, bx, by + 6, 18, 3, '#3a1d12'); px(c, bx + 2, by + 9, 14, 1, '#2a120a');
      px(c, bx + 8, by - 8, 1, 14, '#e9e6ff');
      for (let i = 0; i < 12; i++) px(c, bx + 9, by - 8 + i, Math.floor(i * 0.7), 1, '#ffffff');
      for (let i = 0; i < 8; i++) px(c, bx + 7 - Math.floor(i * 0.6), by - 4 + i, Math.floor(i * 0.6), 1, '#ff9ccc');
    },
    perfume(c, t) {
      sky(c, '#3d0f4f', '#ff7eb6', t, 11);
      px(c, 0, 72, VW, 18, '#2a0b36');
      // sise
      px(c, 66, 28, 28, 40, '#ffc2e2'); px(c, 68, 30, 24, 36, '#ff8fc8');
      px(c, 70, 34, 6, 26, '#ffd9ee');
      px(c, 74, 20, 12, 8, '#f5d36b'); px(c, 76, 16, 8, 4, '#d4a73a');
      px(c, 72, 44, 16, 10, '#fff4fb'); label(c, 'H', 77, 46, 8, '#9b2f73');
      px(c, 62, 68, 36, 3, '#1a0622');
      // parlamalar
      for (let i = 0; i < 6; i++) { const a = t * 1.5 + i; const x = 80 + Math.cos(a) * (30 + i * 3), y = 40 + Math.sin(a * 1.3) * 20; px(c, x, y, 1, 1, '#ffffff'); if (i % 2) { px(c, x - 1, y, 3, 1, '#ffffff'); px(c, x, y - 1, 1, 3, '#ffffff'); } }
    },
    pizza(c, t) {
      sky(c, '#3a1405', '#f3722c', t, 19, false);
      for (let i = 0; i < 10; i++) px(c, i * 16 + ((Math.floor(t * 2) + i) % 2) * 4, 6 + (i % 3) * 8, 6, 2, '#ffb26b');
      px(c, 0, 74, VW, 16, '#5c2a12'); for (let x = 0; x < VW; x += 8) px(c, x, 74, 4, 16, '#6e3417');
      circle(c, 80, 46, 30, '#e0a050'); circle(c, 80, 46, 26, '#f6c453'); circle(c, 80, 46, 24, '#f2a93b');
      [[70, 36], [90, 34], [82, 52], [64, 54], [96, 54], [78, 44], [92, 46]].forEach(([x, y]) => { circle(c, x, y, 3, '#c0392b'); px(c, x - 1, y - 1, 1, 1, '#e35d4f'); });
      [[74, 30], [86, 58], [100, 42], [60, 44]].forEach(([x, y]) => px(c, x, y, 3, 2, '#2e8b57'));
      // dilim + buhar
      for (let i = 0; i < 3; i++) { const y = 10 + ((t * 10 + i * 8) % 18); px(c, 70 + i * 10 + Math.sin(t * 3 + i) * 2, y, 1, 3, 'rgba(255,255,255,.7)'); }
    },
    building(c, t) {
      sky(c, '#07142e', '#28527a', t, 23);
      circle(c, 30, 18, 6, '#e8f8ff');
      px(c, 0, 80, VW, 10, '#0b1a2e');
      // rezidans kulesi
      px(c, 60, 14, 40, 66, '#1d3557'); px(c, 58, 12, 44, 4, '#457b9d'); px(c, 78, 4, 2, 8, '#a8dadc'); px(c, 78, 3, 2, 1, Math.sin(t * 4) > 0 ? '#ff4d4d' : '#7a1a1a');
      for (let y = 18; y < 76; y += 6) for (let x = 63; x < 98; x += 6) {
        const on = ((x * 7 + y * 3 + Math.floor(t / 2)) % 5) > 1;
        px(c, x, y, 4, 3, on ? '#ffd166' : '#2b4a6f');
      }
      px(c, 20, 60, 22, 20, '#14243d'); px(c, 120, 58, 26, 22, '#14243d');
    },
    csharp(c, t) {
      sky(c, '#1e0b33', '#68217a', t, 31);
      // altigen
      for (let y = -24; y <= 24; y++) { const w = 26 - Math.max(0, Math.abs(y) - 10); px(c, 80 - w, 45 + y, w * 2, 1, Math.abs(y) > 21 ? '#9b4dca' : '#7b2fa8'); }
      ctext(c, 'C#', 33, 24, '#ffffff', '#3d0f4f');
      for (let i = 0; i < 5; i++) label(c, ['{ }', ';', '=>', '[ ]', '()'][i], 8 + i * 32, 74 + Math.sin(t * 2 + i) * 2, 8, '#c9a6ff');
    },
    python(c, t) {
      sky(c, '#0d1b2a', '#1f4e79', t, 37);
      px(c, 52, 22, 30, 24, '#3776ab'); px(c, 62, 16, 20, 8, '#3776ab'); px(c, 66, 18, 3, 3, '#ffffff');
      px(c, 78, 44, 30, 24, '#ffd43b'); px(c, 78, 66, 20, 8, '#ffd43b'); px(c, 91, 69, 3, 3, '#ffffff');
      px(c, 40, 34, 14, 12, '#3776ab'); px(c, 106, 44, 14, 12, '#ffd43b');
      ctext(c, 'PYTHON', 78, 8, '#e0f0ff', '#0d1b2a');
      label(c, '>>>', 6 + (Math.floor(t * 2) % 2), 6, 8, '#7fd4ff');
    },
    unity(c, t) {
      sky(c, '#111317', '#3b3f48', t, 41);
      // donen kup (izometrik tel cerceve)
      const a = t * 0.8, cx = 80, cy = 44, s = 20;
      const P = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => {
        const X = x * Math.cos(a) - z * Math.sin(a), Z = x * Math.sin(a) + z * Math.cos(a);
        const Y = y * Math.cos(0.5) - Z * Math.sin(0.5);
        return [cx + X * s, cy + Y * s];
      });
      c.fillStyle = '#ffffff';
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => {
        const [x1, y1] = P[i], [x2, y2] = P[j], n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        for (let k = 0; k <= n; k++) c.fillRect(Math.round(x1 + (x2 - x1) * k / n), Math.round(y1 + (y2 - y1) * k / n), 1, 1);
      });
      ctext(c, 'UNITY', 78, 8, '#ffffff', '#000000');
    },
    prompt(c, t) {
      sky(c, '#04130c', '#0b3d2e', t, 43);
      px(c, 24, 14, 112, 64, '#0a0f0d'); px(c, 24, 14, 112, 8, '#1f2d27');
      circle(c, 29, 17, 1, '#ff5f56'); circle(c, 34, 17, 1, '#ffbd2e'); circle(c, 39, 17, 1, '#27c93f');
      const lines = ['> fikir', '> prompt yaz', '> sonucu incele', '> tekrar dene'];
      const shown = Math.floor(t * 1.2) % (lines.length + 2);
      lines.slice(0, Math.min(shown, lines.length)).forEach((l, i) => label(c, l, 30, 26 + i * 11, 8, '#7CFFB2'));
      if (Math.floor(t * 3) % 2) px(c, 30 + (shown < lines.length ? 0 : 0), 26 + Math.min(shown, lines.length - 1) * 11 + 9, 6, 1, '#7CFFB2');
      for (let i = 0; i < 4; i++) { const x = 140 + Math.cos(t + i) * 8, y = 30 + i * 12; px(c, x, y, 1, 1, '#b8ffd9'); px(c, x - 1, y, 3, 1, '#b8ffd9'); px(c, x, y - 1, 1, 3, '#b8ffd9'); }
    },
    about(c, t) {
      sky(c, '#07070c', '#1a1240', t, 51);
      for (let i = 0; i < 10; i++) { const x = (i * 37 + t * 6) % 170 - 5, y = 70 + (i * 13) % 18; px(c, x, y, 1, 1, '#ffd166'); if (Math.sin(t * 3 + i) > .5) { px(c, x - 1, y, 3, 1, '#ffd166'); px(c, x, y - 1, 1, 3, '#ffd166'); } }
    }
  };

  // Sahneyi 160x90'lik ortak bir tuvale cizer ve o tuvali dondurur
  const buf = document.createElement('canvas'); buf.width = VW; buf.height = VH;
  const bctx = buf.getContext('2d');
  function renderArt(kind, t) {
    bctx.imageSmoothingEnabled = false;
    bctx.clearRect(0, 0, VW, VH);
    (SCENES[kind] || SCENES.title)(bctx, t);
    return buf;
  }

  window.PixelArt = { renderArt, VW, VH };
})();
