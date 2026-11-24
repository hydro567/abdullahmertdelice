// HYDRO kaset oyunlari: TURBO HYDRO (yaris), HYDRO HERO (platform), HYDRO STRIKE (uzay)
// Her oyun: reset(), update(dt, I), draw(g)  — I = { held:{up,down,left,right,a,b,start}, hit:Set }
(function () {
  const W = 160, H = 144;
  const A = () => window.HydroAudio;
  const F8 = '8px Dogica, monospace', F16 = '16px Dogica, monospace';
  function txt(g, s, x, y, c = '#fff', f = F8, sh = '#000') { g.font = f; g.textBaseline = 'alphabetic'; y += Math.round(parseInt(f, 10) * .875); if (sh) { g.fillStyle = sh; g.fillText(s, x + 1, y + 1); } g.fillStyle = c; g.fillText(s, x, y); }
  function ctxt(g, s, y, c = '#fff', f = F8, sh = '#000') { g.font = f; txt(g, s, Math.round((W - g.measureText(s).width) / 2), y, c, f, sh); }
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function panel(g, y, h) { rect(g, 14, y, 132, h, '#000'); rect(g, 15, y + 1, 130, h - 2, '#1d2a6b'); rect(g, 15, y + 1, 130, 2, '#4dabf7'); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // =====================================================================
  // 1) TURBO HYDRO — sozde 3D yaris (segment tabanli yol)
  // =====================================================================
  const Race = (() => {
    const segLen = 200, roadW = 1800, rumbleLen = 3, lanes = 3, drawDist = 80, camH = 900, camDepth = 1 / Math.tan(50 * Math.PI / 180);
    const playerZ = camH * camDepth, maxSpeed = segLen * 60, accel = maxSpeed / 5, brake = -maxSpeed, decel = -maxSpeed / 5;
    const offDecel = -maxSpeed / 2, offLimit = maxSpeed / 4, centrifugal = .3, LAPS = 3;
    let segs = [], trackLen = 0, s = {};
    const COL = {
      light: { road: '#6b6b78', grass: '#3fbf5f', rumble: '#ffffff', lane: '#ffffff' },
      dark: { road: '#62626e', grass: '#35a852', rumble: '#e33b3b', lane: null },
      start: { road: '#ffffff', grass: '#3fbf5f', rumble: '#ffffff', lane: null }
    };
    function lastY() { return segs.length ? segs[segs.length - 1].p2.world.y : 0; }
    function addSeg(curve, y) {
      const n = segs.length;
      segs.push({ index: n, p1: { world: { y: lastY(), z: n * segLen }, cam: {}, scr: {} }, p2: { world: { y, z: (n + 1) * segLen }, cam: {}, scr: {} },
        curve, sprites: [], cars: [], color: Math.floor(n / rumbleLen) % 2 ? COL.dark : COL.light });
    }
    const easeIn = (a, b, p) => a + (b - a) * Math.pow(p, 2), easeIO = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + .5);
    function addRoad(enter, hold, leave, curve, hill) {
      const sy = lastY(), ey = sy + hill * segLen, tot = enter + hold + leave;
      for (let n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), easeIO(sy, ey, n / tot));
      for (let n = 0; n < hold; n++) addSeg(curve, easeIO(sy, ey, (enter + n) / tot));
      for (let n = 0; n < leave; n++) addSeg(easeIO(curve, 0, n / leave), easeIO(sy, ey, (enter + hold + n) / tot));
    }
    function build() {
      segs = [];
      addRoad(10, 25, 10, 0, 0);
      addRoad(25, 40, 25, 2, 10);
      addRoad(20, 20, 20, 0, -10);
      addRoad(25, 30, 25, -3, 0);
      addRoad(15, 15, 15, 2, 15);
      addRoad(15, 15, 15, -2, -15);
      addRoad(30, 50, 30, 4, 0);
      addRoad(20, 30, 20, 0, 20);
      addRoad(20, 30, 20, -4, -20);
      addRoad(25, 25, 25, 2, 0);
      addRoad(20, 40, 20, -1, 10);
      addRoad(20, 20, 20, 0, -10);
      addRoad(10, 20, 10, 0, 0);
      trackLen = segs.length * segLen;
      for (let i = 0; i < 4; i++) segs[i].color = COL.start;
      // yol kenari: palmiye, tabela, kayalar
      for (let i = 12; i < segs.length; i += 4) {
        const side = (i / 4) % 2 ? 1 : -1;
        segs[i].sprites.push({ kind: (i % 40 === 0) ? 'sign' : (i % 12 === 0 ? 'rock' : 'palm'), off: side * (1.6 + ((i * 7) % 10) / 10) });
        if (i % 16 === 0) segs[i].sprites.push({ kind: 'palm', off: -side * (2.2 + ((i * 3) % 10) / 10) });
      }
    }
    const segAt = z => segs[Math.floor(z / segLen) % segs.length];
    function reset() {
      build();
      const cars = [];
      const cols = ['#e33b3b', '#ffd93d', '#9775fa', '#ff9f43', '#4dabf7', '#ff6bcb', '#ffffff'];
      for (let i = 0; i < 7; i++) cars.push({ off: [-.6, 0, .6][i % 3], z: (8 + i * 14) * segLen, speed: maxSpeed * (.55 + i * .03), col: cols[i], dist: (8 + i * 14) * segLen });
      s = { pos: 0, x: 0, speed: 0, dist: 0, lap: 1, time: 0, lapTime: 0, best: 0, sky: 0, hills: 0, cars, count: 3.5, done: false, steer: 0, bump: 0, shake: 0, rank: 8 };
    }
    function project(p, cx, cy, cz) {
      p.cam.x = (p.world.x || 0) - cx; p.cam.y = p.world.y - cy; p.cam.z = p.world.z - cz;
      p.scr.scale = camDepth / p.cam.z;
      p.scr.x = Math.round(W / 2 + p.scr.scale * p.cam.x * W / 2);
      p.scr.y = Math.round(H / 2 - p.scr.scale * p.cam.y * H / 2);
      p.scr.w = Math.round(p.scr.scale * roadW * W / 2);
    }
    function update(dt, I) {
      if (s.done) { if (I.hit.has('start') || I.hit.has('a')) reset(); return; }
      if (s.count > 0) { const c0 = Math.ceil(s.count); s.count -= dt; const c1 = Math.ceil(s.count); if (c1 !== c0) A().tone(c1 > 0 ? 440 : 880, .2, 'square', .06); return; }
      const pseg = segAt(s.pos + playerZ), pct = s.speed / maxSpeed, dx = dt * 2 * pct;
      s.time += dt; s.lapTime += dt;
      s.steer = 0;
      if (I.held.left) { s.x -= dx; s.steer = -1; } else if (I.held.right) { s.x += dx; s.steer = 1; }
      s.x -= dx * pct * pseg.curve * centrifugal;
      if (I.held.a || I.held.up) s.speed += accel * dt;
      else if (I.held.b || I.held.down) s.speed += brake * dt;
      else s.speed += decel * dt;
      if ((s.x < -1 || s.x > 1) && s.speed > offLimit) { s.speed += offDecel * dt; s.shake = 1; } else s.shake = 0;
      // carpismalar
      for (const c of s.cars) {
        c.z = (c.z + c.speed * dt) % trackLen; c.dist += c.speed * dt;
        const cseg = segAt(c.z), carW = .35;
        if (cseg === pseg && s.speed > c.speed && Math.abs(s.x - c.off) < carW * 1.3) {
          s.speed = c.speed * (c.speed / s.speed); s.pos = (c.z - playerZ + trackLen) % trackLen; s.dist -= 50;
          s.bump = .3; A().noise(.2, .12, 0, null, 400);
        }
        // yapay zeka: oyuncunun hemen onundeyse yan sereve kac
        const ahead = ((c.z - (s.pos + playerZ)) + trackLen) % trackLen;
        if (ahead < segLen * 6 && Math.abs(c.off - s.x) < .4) c.off = clamp(c.off + (c.off > s.x ? 1 : -1) * dt * .6, -.85, .85);
      }
      s.x = clamp(s.x, -2.5, 2.5); s.speed = clamp(s.speed, 0, maxSpeed);
      const before = s.pos;
      s.pos = (s.pos + s.speed * dt) % trackLen; s.dist += s.speed * dt;
      s.sky += .002 * pseg.curve * pct; s.hills += .004 * pseg.curve * pct;
      if (s.bump > 0) s.bump -= dt;
      if (s.pos < before) { // tur tamam
        if (!s.best || s.lapTime < s.best) s.best = s.lapTime;
        s.lapTime = 0; s.lap++; A().tone(1046, .25, 'square', .06);
        if (s.lap > LAPS) { s.done = true; s.lap = LAPS; A().play('menu'); }
      }
      s.rank = 1 + s.cars.filter(c => c.dist > s.dist + playerZ).length;
      // motor sesi
      if (Math.random() < .25) A().tone(60 + pct * 140, .06, 'sawtooth', .012);
    }
    function poly(g, x1, y1, x2, y2, x3, y3, x4, y4, c) { g.fillStyle = c; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath(); g.fill(); }
    function drawSprite(g, sp, scale, x, y, clip) {
      const S = scale * W / 2;
      let w, h;
      g.save(); g.beginPath(); g.rect(0, 0, W, clip); g.clip();
      if (sp.kind === 'palm') {
        w = 260 * S; h = 900 * S; const bx = x - w / 2, by = y - h;
        rect(g, x - w * .07, by + h * .25, w * .14, h * .75, '#8a5a2b'); rect(g, x - w * .07, by + h * .25, w * .05, h * .75, '#a8743c');
        g.fillStyle = '#1f9e4a';
        for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(x + k * w * .2, by + h * .27 + Math.abs(k) * h * .04, w * .28, h * .06, k * .3, 0, 7); g.fill(); }
        g.fillStyle = '#2fd16a'; g.beginPath(); g.ellipse(x, by + h * .22, w * .2, h * .07, 0, 0, 7); g.fill();
      } else if (sp.kind === 'rock') {
        w = 400 * S; h = 260 * S; g.fillStyle = '#8b8f9c'; g.beginPath(); g.ellipse(x, y - h / 2, w / 2, h / 2, 0, 0, 7); g.fill();
        g.fillStyle = '#a9adba'; g.beginPath(); g.ellipse(x - w * .12, y - h * .62, w / 4, h / 4, 0, 0, 7); g.fill();
      } else if (sp.kind === 'sign') {
        w = 900 * S; h = 700 * S; rect(g, x - w * .4, y - h * .5, w * .06, h * .5, '#444'); rect(g, x + w * .34, y - h * .5, w * .06, h * .5, '#444');
        rect(g, x - w / 2, y - h, w, h * .55, '#0b1033'); rect(g, x - w / 2 + w * .03, y - h + h * .05, w * .94, h * .45, '#1d2a6b');
        if (w > 18) { g.save(); g.font = Math.max(8, Math.round(w / 7)) + 'px Dogica, monospace'; g.fillStyle = '#ffd166'; g.textAlign = 'center'; g.fillText('HYDRO', x, y - h * .62); g.restore(); }
      } else if (sp.kind === 'car') {
        w = 330 * S; h = 200 * S; const bx = x - w / 2, by = y - h;
        rect(g, bx, by + h * .45, w, h * .45, sp.col); rect(g, bx + w * .18, by + h * .1, w * .64, h * .4, sp.col);
        rect(g, bx + w * .25, by + h * .16, w * .5, h * .26, '#1a2240');
        rect(g, bx + w * .05, by + h * .55, w * .14, h * .12, '#ff3030'); rect(g, bx + w * .81, by + h * .55, w * .14, h * .12, '#ff3030');
        rect(g, bx + w * .02, by + h * .86, w * .22, h * .14, '#111'); rect(g, bx + w * .76, by + h * .86, w * .22, h * .14, '#111');
      }
      g.restore();
    }
    function drawPlayer(g) {
      const bounce = (s.speed > 0 ? (Math.random() < .5 ? 0 : 1) : 0) + (s.shake ? (Math.random() * 2 | 0) : 0);
      const x = 80 - 18, y = 112 + bounce, t = s.steer;
      g.save(); g.translate(80, y + 10); g.transform(1, 0, t * .12, 1, 0, 0); g.translate(-80, -(y + 10));
      rect(g, x + 2, y + 20, 32, 3, 'rgba(0,0,0,.35)');
      rect(g, x, y + 8, 36, 10, '#18c4c4'); rect(g, x + 6, y + 1, 24, 8, '#18c4c4');
      rect(g, x + 8, y + 2, 20, 6, '#14213d'); rect(g, x + 9, y + 3, 6, 2, '#4dabf7');
      rect(g, x, y + 8, 36, 2, '#7fffff');
      rect(g, x + 2, y + 11, 6, 3, '#ff3b3b'); rect(g, x + 28, y + 11, 6, 3, '#ff3b3b');
      rect(g, x + 13, y + 12, 10, 4, '#0b6f6f'); txt(g, 'H', x + 15, y + 9, '#ffd166', F8, null);
      rect(g, x - 1, y + 16, 8, 5, '#111'); rect(g, x + 29, y + 16, 8, 5, '#111');
      if (I_gas && s.speed > maxSpeed * .8 && Math.random() < .6) { rect(g, x + 8, y + 19, 3, 2, '#ffd93d'); rect(g, x + 25, y + 19, 3, 2, '#ff9f43'); }
      g.restore();
    }
    let I_gas = false;
    function fmt(t) { const m = Math.floor(t / 60), sec = (t % 60).toFixed(1).padStart(4, '0'); return m + "'" + sec; }
    function draw(g, I) {
      I_gas = I && (I.held.a || I.held.up);
      // gokyuzu, gunes, daglar
      const sky = g.createLinearGradient(0, 0, 0, 80); sky.addColorStop(0, '#2b6cff'); sky.addColorStop(1, '#ffb36b');
      g.fillStyle = sky; g.fillRect(0, 0, W, 80);
      g.fillStyle = '#fff3a8'; g.beginPath(); g.arc(120 - s.sky * 200 % 200, 34, 11, 0, 7); g.fill();
      for (let layer = 0; layer < 2; layer++) {
        g.fillStyle = layer ? '#3a4a8a' : '#5b5fa8';
        g.beginPath(); g.moveTo(0, 80);
        for (let x = 0; x <= W; x += 4) { const o = (layer ? s.hills : s.sky) * 400 + x; g.lineTo(x, 60 + layer * 8 - Math.abs(Math.sin(o * .045 + layer)) * (14 - layer * 4) - Math.sin(o * .11) * 3); }
        g.lineTo(W, 80); g.fill();
      }
      const base = segAt(s.pos), bp = (s.pos % segLen) / segLen;
      const pseg = segAt(s.pos + playerZ), pp = ((s.pos + playerZ) % segLen) / segLen;
      const py = pseg.p1.world.y + (pseg.p2.world.y - pseg.p1.world.y) * pp;
      let maxy = H, x = 0, dx = -(base.curve * bp);
      for (let n = 0; n < drawDist; n++) {
        const seg = segs[(base.index + n) % segs.length], looped = seg.index < base.index;
        seg.p1.world.x = 0; seg.p2.world.x = 0;
        project(seg.p1, s.x * roadW - x, py + camH, s.pos - (looped ? trackLen : 0));
        project(seg.p2, s.x * roadW - x - dx, py + camH, s.pos - (looped ? trackLen : 0));
        x += dx; dx += seg.curve; seg.clip = maxy;
        if (seg.p1.cam.z <= camDepth || seg.p2.scr.y >= seg.p1.scr.y || seg.p2.scr.y >= maxy) continue;
        const a = seg.p1.scr, b = seg.p2.scr, c = seg.color;
        rect(g, 0, b.y, W, a.y - b.y + 1, c.grass);
        const r1 = a.w / 6, r2 = b.w / 6;
        poly(g, a.x - a.w - r1, a.y, a.x - a.w, a.y, b.x - b.w, b.y, b.x - b.w - r2, b.y, c.rumble);
        poly(g, a.x + a.w + r1, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x + b.w + r2, b.y, c.rumble);
        poly(g, a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y, c.road);
        if (c.lane) { const l1 = a.w / 32, l2 = b.w / 32, lw1 = a.w * 2 / lanes, lw2 = b.w * 2 / lanes;
          for (let l = 1; l < lanes; l++) poly(g, a.x - a.w + lw1 * l - l1 / 2, a.y, a.x - a.w + lw1 * l + l1 / 2, a.y, b.x - b.w + lw2 * l + l2 / 2, b.y, b.x - b.w + lw2 * l - l2 / 2, b.y, c.lane); }
        maxy = a.y;
      }
      for (const sg of segs) sg.cars.length = 0;
      for (const c of s.cars) segAt(c.z).cars.push(c);
      for (let n = drawDist - 1; n > 0; n--) {
        const seg = segs[(base.index + n) % segs.length];
        if (seg.p1.cam.z <= camDepth) continue;
        for (const sp of seg.sprites) { const sc = seg.p1.scr.scale; drawSprite(g, sp, sc, seg.p1.scr.x + sc * sp.off * roadW * W / 2, seg.p1.scr.y, seg.clip); }
        for (const c of seg.cars) {
          const pc = (c.z % segLen) / segLen, sc = seg.p1.scr.scale + (seg.p2.scr.scale - seg.p1.scr.scale) * pc;
          const sx = seg.p1.scr.x + (seg.p2.scr.x - seg.p1.scr.x) * pc + sc * c.off * roadW * W / 2;
          const sy = seg.p1.scr.y + (seg.p2.scr.y - seg.p1.scr.y) * pc;
          drawSprite(g, { kind: 'car', col: c.col }, sc, sx, sy, seg.clip);
        }
      }
      drawPlayer(g);
      // HUD
      rect(g, 0, 0, W, 12, 'rgba(0,0,0,.55)');
      txt(g, 'TUR ' + s.lap + '/' + LAPS, 3, 2, '#fff');
      txt(g, fmt(s.time), 98, 2, '#ffd93d');
      const kmh = Math.round(s.speed / maxSpeed * 240);
      rect(g, 0, 132, W, 12, 'rgba(0,0,0,.55)');
      txt(g, String(kmh).padStart(3, ' ') + ' KM/S', 3, 134, '#7fd4ff');
      txt(g, s.rank + '. SIRA', 104, 134, s.rank <= 3 ? '#6bdb6b' : '#ff9f43');
      for (let i = 0; i < 10; i++) rect(g, 70 + i * 3, 136, 2, 5, i < kmh / 24 ? (i > 7 ? '#ff4d6d' : '#6bdb6b') : '#333');
      if (s.count > 0) { const c = Math.ceil(s.count); ctxt(g, c > 3 ? 'HAZIR' : String(c), 52, c === 1 ? '#6bdb6b' : '#ffd93d', F16); }
      else if (s.time < 1) ctxt(g, 'BASLA!', 52, '#6bdb6b', F16);
      if (s.done) { panel(g, 40, 62); ctxt(g, 'YARIS BITTI', 48, '#ffd93d'); ctxt(g, s.rank + '. OLDUN', 62, '#fff'); ctxt(g, 'SURE ' + fmt(s.time), 74, '#7fd4ff'); ctxt(g, 'START: TEKRAR', 88, '#fff'); }
    }
    return { name: 'TURBO HYDRO', color: '#ff4d6d', music: 'race', help: 'A/YUKARI: GAZ  B: FREN', reset, update, draw };
  })();

  // =====================================================================
  // 2) HYDRO HERO — yandan kaydirmali platform
  // =====================================================================
  const Plat = (() => {
    const T = 8, ROWS = 18;
    let map, LW, s, enemies, coins, parts, pops;
    function gen() {
      LW = 210; map = Array.from({ length: ROWS }, () => Array(LW).fill(' '));
      const set = (x, y, c) => { if (x >= 0 && x < LW && y >= 0 && y < ROWS) map[y][x] = c; };
      const gaps = [[34, 36], [58, 61], [96, 99], [131, 134], [160, 163]];
      for (let x = 0; x < LW; x++) { if (gaps.some(([a, b]) => x >= a && x <= b)) continue; set(x, 16, '#'); set(x, 17, '#'); }
      const plats = [[14, 12, 5, '?B?B?'], [26, 9, 3, 'BBB'], [42, 12, 4, 'B??B'], [50, 8, 5, 'BBBBB'], [66, 11, 3, '?B?'], [74, 13, 2, 'BB'], [78, 10, 4, 'BBBB'],
        [88, 12, 5, 'B?B?B'], [104, 11, 6, 'BBBBBB'], [112, 7, 3, '?B?'], [120, 12, 3, 'BBB'], [140, 12, 4, '?BB?'], [146, 9, 4, 'BBBB'], [170, 12, 3, 'B?B']];
      plats.forEach(([x, y, , str]) => [...str].forEach((c, i) => set(x + i, y, c)));
      // basamaklar (bloklar)
      const stair = (x, n, dir) => { for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) set(x + (dir > 0 ? i : n - 1 - i), 15 - j, 'S'); };
      stair(28, 4, 1); stair(37, 4, -1); stair(152, 5, 1); stair(182, 7, 1);
      for (let y = 9; y <= 15; y++) set(189, y, 'S');
      // su kuleleri (engel)
      [[70, 3], [116, 4], [126, 2]].forEach(([x, h]) => { for (let j = 0; j < h; j++) { set(x, 15 - j, 'W'); set(x + 1, 15 - j, 'w'); } });
      set(198, 15, 'F');
      coins = [];
      const coinArc = (x, y, n) => { for (let i = 0; i < n; i++) coins.push({ x: (x + i) * T + 2, y: (y - Math.round(Math.sin(i / (n - 1) * Math.PI) * 2)) * T + 1, got: false }); };
      coinArc(8, 13, 4); coinArc(33, 12, 5); coinArc(51, 6, 5); coinArc(57, 13, 6); coinArc(95, 12, 6); coinArc(105, 9, 6); coinArc(130, 12, 6); coinArc(159, 12, 6); coinArc(171, 10, 3);
      enemies = [[20, 15], [46, 15], [53, 7], [64, 15], [84, 15], [92, 15], [108, 15], [122, 15], [138, 15], [148, 15], [166, 15], [175, 15]]
        .map(([x, y], i) => ({ x: x * T, y: y * T - 1, vx: i % 2 ? 18 : -18, vy: 0, w: 8, h: 7, dead: 0, kind: i % 3 === 2 ? 'beetle' : 'crab' }));
    }
    const tileAt = (px, py) => { const x = Math.floor(px / T), y = Math.floor(py / T); if (y >= ROWS) return ' '; if (x < 0 || x >= LW || y < 0) return 'X'; return map[y][x]; };
    const solid = c => c !== ' ' && c !== 'F' && c !== 'o';
    function reset() {
      gen(); parts = []; pops = [];
      s = { x: 16, y: 100, vx: 0, vy: 0, w: 6, h: 11, face: 1, ground: false, coins: 0, score: 0, lives: 3, time: 300, cam: 0, inv: 0, walk: 0, check: 16, won: false, over: false, winT: 0, dead: 0 };
    }
    function collideX(o) {
      const dir = Math.sign(o.vx); if (!dir) return false;
      const edge = dir > 0 ? o.x + o.w : o.x;
      for (const yy of [o.y + 1, o.y + o.h / 2, o.y + o.h - 1]) if (solid(tileAt(edge, yy))) { o.x = dir > 0 ? Math.floor(edge / T) * T - o.w - .01 : Math.floor(edge / T + 1) * T + .01; return true; }
      return false;
    }
    function collideY(o, isPlayer) {
      o.ground = false;
      if (o.vy > 0) { for (const xx of [o.x + 1, o.x + o.w - 1]) if (solid(tileAt(xx, o.y + o.h))) { o.y = Math.floor((o.y + o.h) / T) * T - o.h; o.vy = 0; o.ground = true; return; } }
      else if (o.vy < 0) {
        for (const xx of [o.x + 1, o.x + o.w - 1]) {
          const c = tileAt(xx, o.y);
          if (solid(c)) {
            o.y = Math.floor(o.y / T + 1) * T; o.vy = 0;
            if (isPlayer) {
              const tx = Math.floor(xx / T), ty = Math.floor((o.y - 1) / T);
              if (c === '?') { map[ty][tx] = 'U'; s.coins++; s.score += 200; pops.push({ x: tx * T + 2, y: ty * T - 8, t: .5 }); A().tone(988, .06); A().tone(1318, .2, 'square', .05, .06); }
              else if (c === 'B') { A().noise(.08, .05, 0, null, 800); for (let i = 0; i < 4; i++) parts.push({ x: tx * T + 4, y: ty * T, vx: (i % 2 ? 1 : -1) * (20 + i * 10), vy: -80 - i * 20, t: .8, c: '#e07a3c' }); if (s.coins >= 0) { map[ty][tx] = ' '; s.score += 50; } }
              else A().tone(120, .06, 'square', .04);
            }
            return;
          }
        }
      }
    }
    function hurt() {
      if (s.inv > 0 || s.dead) return;
      s.lives--; s.dead = 1.2; s.vy = -160; A().tone(400, .5, 'square', .06, 0, null, .25);
      if (s.lives < 0) { s.over = true; s.lives = 0; A().play('menu'); }
    }
    function update(dt, I) {
      if (s.over || (s.won && s.winT > 2.5)) { if (I.hit.has('start') || I.hit.has('a')) reset(); return; }
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.t -= dt; }
      parts = parts.filter(p => p.t > 0); pops.forEach(p => { p.t -= dt; p.y -= 30 * dt; }); pops = pops.filter(p => p.t > 0);
      if (s.dead) { s.dead -= dt; s.y += s.vy * dt; s.vy += 500 * dt; if (s.dead <= 0) { s.dead = 0; if (!s.over) { s.x = s.check; s.y = 100; s.vx = 0; s.vy = 0; s.inv = 1.5; } } return; }
      if (s.won) { s.winT += dt; if (s.y < 15 * T - s.h) s.y += 40 * dt; else if (s.x < 202 * T) { s.x += 30 * dt; s.walk += dt; } return; }
      s.time -= dt; if (s.time <= 0) { s.time = 0; hurt(); s.time = 300; }
      const run = I.held.b, max = run ? 105 : 68, acc = s.ground ? 420 : 260;
      if (I.held.left) { s.vx = Math.max(-max, s.vx - acc * dt); s.face = -1; }
      else if (I.held.right) { s.vx = Math.min(max, s.vx + acc * dt); s.face = 1; }
      else { const f = (s.ground ? 380 : 120) * dt; s.vx = Math.abs(s.vx) < f ? 0 : s.vx - Math.sign(s.vx) * f; }
      if ((I.hit.has('a') || I.hit.has('up')) && s.ground) { s.vy = -235 - Math.abs(s.vx) * .25; s.ground = false; A().tone(520, .12, 'square', .05, 0, null, 1.8); }
      const jumpHeld = I.held.a || I.held.up;
      s.vy += (s.vy < 0 && jumpHeld ? 520 : 1000) * dt; s.vy = Math.min(s.vy, 300);
      s.x += s.vx * dt; if (collideX(s)) s.vx = 0;
      s.y += s.vy * dt; collideY(s, true);
      s.x = Math.max(s.cam, s.x);
      if (s.y > H + 10) hurt();
      if (s.inv > 0) s.inv -= dt;
      if (Math.abs(s.vx) > 1 && s.ground) s.walk += dt * Math.abs(s.vx) / 40;
      if (s.x > 100 * T && s.check < 100 * T) s.check = 100 * T;
      // paralar
      for (const c of coins) if (!c.got && Math.abs(c.x + 2 - (s.x + 3)) < 6 && Math.abs(c.y + 3 - (s.y + 5)) < 8) { c.got = true; s.coins++; s.score += 100; A().tone(988, .05); A().tone(1318, .15, 'square', .045, .05); }
      // dusmanlar
      for (const e of enemies) {
        if (e.dead) { e.dead -= dt; continue; }
        if (Math.abs(e.x - s.x) > 200) continue;
        e.vy += 800 * dt; e.x += e.vx * dt;
        if (collideX(e)) e.vx *= -1;
        else { const ahead = e.vx > 0 ? e.x + e.w + 1 : e.x - 1; if (!solid(tileAt(ahead, e.y + e.h + 2)) && e.ground) e.vx *= -1; }
        e.y += e.vy * dt; collideY(e, false);
        if (e.y > H + 20) e.dead = 99;
        if (s.x < e.x + e.w && s.x + s.w > e.x && s.y < e.y + e.h && s.y + s.h > e.y) {
          if (s.vy > 0 && s.y + s.h - e.y < 7) { e.dead = 99; e.flat = .4; s.vy = -170; s.score += 300; A().tone(300, .1, 'square', .06, 0, null, 2); pops.push({ x: e.x, y: e.y - 6, t: .5, txt: '300' }); }
          else hurt();
        }
      }
      // bayrak
      if (s.x + s.w >= 198 * T) { s.won = true; s.score += Math.round(s.time) * 10; A().play(null); [523, 659, 784, 1046, 784, 1046].forEach((f, i) => A().tone(f, .18, 'square', .06, i * .14)); }
      s.cam = clamp(s.x - 64, s.cam, LW * T - W);
    }
    function tile(g, c, x, y, tx, ty) {
      if (c === '#') {
        const top = ty === 0 || map[ty - 1][tx] === ' ' || map[ty - 1][tx] === 'o';
        rect(g, x, y, T, T, '#a0522d'); rect(g, x + (tx % 2) * 4, y + 3 + (ty % 2) * 2, 2, 2, '#8b4513');
        if (top) { rect(g, x, y, T, 3, '#3fbf5f'); rect(g, x, y + 3, T, 1, '#2e8b45'); rect(g, x + (tx % 3) * 2, y - 1, 1, 1, '#6bdb6b'); }
      } else if (c === 'B') { rect(g, x, y, T, T, '#e07a3c'); rect(g, x, y + 3, T, 1, '#7a3412'); rect(g, x, y + 7, T, 1, '#7a3412'); rect(g, x + 3, y, 1, 3, '#7a3412'); rect(g, x + 6, y + 4, 1, 3, '#7a3412'); rect(g, x, y, T, 1, '#ffb27a'); }
      else if (c === '?') { const f = Math.floor(s.t2 * 4) % 4; rect(g, x, y, T, T, ['#ffc93c', '#ffd93d', '#ffe57a', '#ffd93d'][f]); rect(g, x, y + 7, T, 1, '#b8860b'); rect(g, x + 7, y, 1, T, '#b8860b'); txt(g, 'H', x + 1, y, '#8b4513', F8, null); }
      else if (c === 'U') { rect(g, x, y, T, T, '#8b5a2b'); rect(g, x + 1, y + 1, T - 2, T - 2, '#6b4423'); }
      else if (c === 'S') { rect(g, x, y, T, T, '#7f8c9f'); rect(g, x, y, T, 1, '#b8c2d1'); rect(g, x, y, 1, T, '#b8c2d1'); rect(g, x + 7, y, 1, T, '#4a5568'); rect(g, x, y + 7, T, 1, '#4a5568'); }
      else if (c === 'W') { rect(g, x, y, T, T, '#2f7dd1'); rect(g, x + 1, y, 2, T, '#7fc3ff'); }
      else if (c === 'w') { rect(g, x, y, T, T, '#1f5fa8'); rect(g, x + 6, y, 2, T, '#14467d'); }
      else if (c === 'F') {
        rect(g, x + 3, y - 80, 2, 88, '#ddd'); rect(g, x + 2, y - 84, 4, 4, '#ffd93d');
        const fy = y - 78 + (s.won ? Math.min(60, s.winT * 40) : 0);
        rect(g, x - 14, fy, 17, 11, '#18c4c4'); txt(g, 'H', x - 10, fy + 1, '#ffd93d', F8, null);
        rect(g, x - 4, y, 16, 8, '#7f8c9f');
      }
    }
    function drawHero(g, x, y) {
      if (s.inv > 0 && Math.floor(s.inv * 12) % 2) return;
      const f = s.face, leg = s.ground ? Math.floor(s.walk * 6) % 2 : 2, X = v => f > 0 ? x + v : x + 6 - v;
      const px = (v, yy, w, h, c) => rect(g, f > 0 ? x + v : x + 6 - v - w + 1, y + yy, w, h, c);
      px(0, 0, 6, 2, '#1d4ed8'); px(4, 1, 3, 1, '#1d4ed8');                 // sapka
      px(1, 2, 5, 3, '#f2c9a0'); px(4, 3, 1, 1, '#111'); px(1, 2, 1, 2, '#5a3a22');  // yuz, goz, sac
      px(0, 5, 6, 3, '#18c4c4'); px(2, 5, 2, 3, '#ffd93d');                   // tisort
      if (leg === 2) { px(0, 8, 2, 2, '#14213d'); px(4, 7, 2, 2, '#14213d'); px(0, 10, 2, 1, '#5a3a22'); px(4, 9, 2, 1, '#5a3a22'); }
      else if (leg) { px(0, 8, 2, 2, '#14213d'); px(4, 8, 2, 2, '#14213d'); px(-1, 10, 3, 1, '#5a3a22'); px(4, 10, 3, 1, '#5a3a22'); }
      else { px(1, 8, 4, 2, '#14213d'); px(1, 10, 4, 1, '#5a3a22'); }
      // kucuk altin mizrak
      px(6, 3, 1, 7, '#c9a227'); px(5, 2, 3, 1, '#ffd93d');
    }
    function draw(g) {
      s.t2 = (s.t2 || 0) + 1 / 60;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#5ec8ff'); sky.addColorStop(1, '#bfefff');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) { const cx = ((i * 70 - s.cam * .2) % 420 + 420) % 420 - 40, cy = 18 + (i % 3) * 14; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, cy, 14, 5, 0, 0, 7); g.ellipse(cx + 8, cy - 3, 8, 5, 0, 0, 7); g.fill(); }
      g.fillStyle = '#7fd49a'; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) g.lineTo(x, 104 - Math.abs(Math.sin((x + s.cam * .4) * .025)) * 26);
      g.lineTo(W, H); g.fill();
      const cam = Math.floor(s.cam), t0 = Math.floor(cam / T);
      for (let ty = 0; ty < ROWS; ty++) for (let tx = t0; tx < t0 + 22; tx++) { const c = map[ty] && map[ty][tx]; if (c && c !== ' ') tile(g, c, tx * T - cam, ty * T, tx, ty); }
      for (const c of coins) if (!c.got) { const w = [4, 3, 1, 3][Math.floor(s.t2 * 8) % 4]; rect(g, c.x - cam + (4 - w) / 2, c.y, w, 6, '#ffd93d'); rect(g, c.x - cam + (4 - w) / 2, c.y, 1, 6, '#fff3a8'); }
      for (const e of enemies) {
        if (e.dead && !(e.flat > 0)) continue;
        const x = Math.round(e.x - cam), y = Math.round(e.y);
        if (e.flat > 0) { e.flat -= 1 / 60; rect(g, x, y + 5, 8, 2, e.kind === 'crab' ? '#e33b3b' : '#6b21a8'); continue; }
        const st = Math.floor(s.t2 * 6) % 2;
        if (e.kind === 'crab') { rect(g, x, y + 2, 8, 4, '#e33b3b'); rect(g, x + 1, y, 2, 2, '#fff'); rect(g, x + 5, y, 2, 2, '#fff'); rect(g, x + 2, y + 1, 1, 1, '#000'); rect(g, x + 5, y + 1, 1, 1, '#000'); rect(g, x - 1 + st, y + 6, 2, 1, '#a11'); rect(g, x + 6 - st, y + 6, 2, 1, '#a11'); }
        else { rect(g, x, y + 1, 8, 5, '#6b21a8'); rect(g, x + 1, y + 1, 6, 2, '#a855f7'); rect(g, x + (e.vx > 0 ? 6 : 0), y + 3, 2, 2, '#fff'); rect(g, x + st, y + 6, 2, 1, '#222'); rect(g, x + 6 - st, y + 6, 2, 1, '#222'); }
      }
      for (const p of parts) rect(g, p.x - cam, p.y, 3, 3, p.c);
      for (const p of pops) { if (p.txt) txt(g, p.txt, p.x - cam, p.y, '#fff'); else { rect(g, p.x - cam, p.y, 4, 6, '#ffd93d'); } }
      drawHero(g, Math.round(s.x - cam), Math.round(s.y));
      rect(g, 0, 0, W, 11, 'rgba(0,0,0,.45)');
      txt(g, 'x' + s.lives, 3, 2, '#ff6b6b'); rect(g, 26, 3, 4, 6, '#ffd93d'); txt(g, String(s.coins).padStart(2, '0'), 32, 2, '#ffd93d');
      txt(g, String(s.score).padStart(6, '0'), 56, 2, '#fff'); txt(g, String(Math.ceil(s.time)).padStart(3, '0'), 132, 2, '#7fd4ff');
      if (s.won && s.winT > 1) { panel(g, 44, 50); ctxt(g, 'BOLUM TAMAM!', 52, '#ffd93d'); ctxt(g, 'PUAN ' + s.score, 66, '#fff'); if (s.winT > 2.5) ctxt(g, 'START: TEKRAR', 80, '#7fd4ff'); }
      if (s.over) { panel(g, 48, 42); ctxt(g, 'OYUN BITTI', 56, '#ff6b6b'); ctxt(g, 'START: TEKRAR', 72, '#fff'); }
    }
    return { name: 'HYDRO HERO', color: '#3fbf5f', music: 'plat', help: 'A: ZIPLA  B: KOS', reset, update, draw };
  })();

  // =====================================================================
  // 3) HYDRO STRIKE — dikey uzay atis
  // =====================================================================
  const Shoot = (() => {
    let s, stars;
    function reset() {
      stars = Array.from({ length: 60 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, z: 1 + i % 3 }));
      s = { x: 76, y: 120, cd: 0, bullets: [], foes: [], eb: [], fx: [], power: 1, lives: 3, score: 0, wave: 0, waveT: 1.5, inv: 2, boss: null, over: false, shake: 0, items: [], t: 0 };
    }
    function spawnWave() {
      s.wave++;
      if (s.wave % 5 === 0) { s.boss = { x: 56, y: -40, hp: 80 + s.wave * 8, max: 80 + s.wave * 8, t: 0, cd: 1 }; A().tone(110, .6, 'sawtooth', .08, 0, null, .5); return; }
      const type = s.wave % 3, n = 6 + Math.min(6, s.wave);
      for (let i = 0; i < n; i++) {
        if (type === 0) s.foes.push({ kind: 'drone', x: 10 + (i % 6) * 26, y: -12 - Math.floor(i / 6) * 18, vx: 0, vy: 22, hp: 1, t: i * .3, sx: 10 + (i % 6) * 26 });
        else if (type === 1) s.foes.push({ kind: 'diver', x: i % 2 ? -10 : W + 10, y: 10 + i * 6, vx: i % 2 ? 50 : -50, vy: 0, hp: 2, t: -i * .35 });
        else s.foes.push({ kind: 'tank', x: 14 + (i % 5) * 30, y: -14 - Math.floor(i / 5) * 22, vx: 0, vy: 14, hp: 4, t: 0, cd: 1 + Math.random() * 2 });
      }
    }
    function boom(x, y, n = 10, c = '#ffd93d') { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = 20 + Math.random() * 60; s.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: .4 + Math.random() * .4, c: Math.random() < .5 ? c : '#ff6b3b' }); } }
    function hitPlayer() { if (s.inv > 0) return; s.lives--; s.inv = 2; s.power = 1; s.shake = .4; boom(s.x + 5, s.y + 5, 20, '#7fffff'); A().noise(.5, .15, 0, null, 200); if (s.lives < 0) { s.lives = 0; s.over = true; A().play('menu'); } }
    function update(dt, I) {
      s.t += dt;
      for (const st of stars) { st.y += st.z * 25 * dt; if (st.y > H) { st.y = 0; st.x = Math.random() * W; } }
      for (const f of s.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; } s.fx = s.fx.filter(f => f.t > 0);
      if (s.shake > 0) s.shake -= dt;
      if (s.over) { if (I.hit.has('start') || I.hit.has('a')) reset(); return; }
      const sp = 95;
      if (I.held.left) s.x -= sp * dt; if (I.held.right) s.x += sp * dt; if (I.held.up) s.y -= sp * dt; if (I.held.down) s.y += sp * dt;
      s.x = clamp(s.x, 0, W - 11); s.y = clamp(s.y, 16, H - 12);
      if (s.inv > 0) s.inv -= dt;
      s.cd -= dt;
      if ((I.held.a || I.held.b) && s.cd <= 0) {
        s.cd = .14; A().tone(880, .04, 'square', .025, 0, null, .5);
        const xs = s.power === 1 ? [5] : s.power === 2 ? [2, 8] : [0, 5, 10];
        xs.forEach((o, i) => s.bullets.push({ x: s.x + o, y: s.y - 2, vx: s.power === 3 ? (i - 1) * 25 : 0 }));
      }
      for (const b of s.bullets) { b.y -= 200 * dt; b.x += b.vx * dt; } s.bullets = s.bullets.filter(b => b.y > -6);
      for (const b of s.eb) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.abs(b.x - (s.x + 5)) < 4 && Math.abs(b.y - (s.y + 5)) < 4) { b.y = 999; hitPlayer(); } } s.eb = s.eb.filter(b => b.y < H + 4 && b.y > -4 && b.x > -4 && b.x < W + 4);
      for (const it of s.items) { it.y += 30 * dt; if (Math.abs(it.x - (s.x + 5)) < 8 && Math.abs(it.y - (s.y + 5)) < 8) { it.y = 999; s.power = Math.min(3, s.power + 1); s.score += 500; A().tone(660, .08); A().tone(990, .15, 'square', .05, .08); } } s.items = s.items.filter(i => i.y < H);
      // dusmanlar
      for (const f of s.foes) {
        f.t += dt; if (f.t < 0) continue;
        if (f.kind === 'drone') { f.y += f.vy * dt; f.x = f.sx + Math.sin(f.t * 2) * 14; }
        else if (f.kind === 'diver') { f.x += f.vx * dt; f.y += Math.sin(f.t * 3) * 30 * dt + 10 * dt; if (f.x < -12 || f.x > W + 12) f.vx *= -1; if (f.t > 4) f.y += 60 * dt; }
        else { f.y += f.vy * dt; f.cd -= dt; if (f.cd <= 0 && f.y > 0) { f.cd = 1.8; const a = Math.atan2(s.y - f.y, s.x - f.x); s.eb.push({ x: f.x + 6, y: f.y + 10, vx: Math.cos(a) * 55, vy: Math.sin(a) * 55 }); } }
        if (Math.abs(f.x + 5 - (s.x + 5)) < 8 && Math.abs(f.y + 5 - (s.y + 5)) < 8) { f.hp = 0; hitPlayer(); }
        for (const b of s.bullets) if (b.x > f.x - 1 && b.x < f.x + 12 && b.y > f.y && b.y < f.y + 11) { b.y = -99; f.hp--; f.flash = .06; if (f.hp <= 0) { s.score += f.kind === 'tank' ? 300 : 100; boom(f.x + 5, f.y + 5); A().noise(.15, .08, 0, null, 600); if (Math.random() < .08) s.items.push({ x: f.x + 5, y: f.y }); } }
      }
      s.foes = s.foes.filter(f => f.hp > 0 && f.y < H + 16);
      // boss
      const B = s.boss;
      if (B) {
        B.t += dt; if (B.y < 20) B.y += 20 * dt; else { B.x = 56 + Math.sin(B.t * .8) * 50; B.cd -= dt;
          if (B.cd <= 0) { B.cd = B.hp < B.max / 2 ? .7 : 1.1; for (let k = -2; k <= 2; k++) s.eb.push({ x: B.x + 24, y: B.y + 22, vx: k * 22, vy: 60 }); A().tone(200, .1, 'sawtooth', .04); } }
        for (const b of s.bullets) if (b.x > B.x && b.x < B.x + 48 && b.y > B.y && b.y < B.y + 24) { b.y = -99; B.hp--; B.flash = .05; }
        if (B.hp <= 0) { for (let i = 0; i < 6; i++) boom(B.x + Math.random() * 48, B.y + Math.random() * 24, 14); s.score += 5000; s.boss = null; s.shake = .6; s.items.push({ x: 80, y: 40 }); A().noise(.8, .2, 0, null, 150); }
      }
      if (!s.boss && !s.foes.length) { s.waveT -= dt; if (s.waveT <= 0) { spawnWave(); s.waveT = 1.5; } }
    }
    function ship(g, x, y) {
      rect(g, x + 4, y, 3, 3, '#7fffff'); rect(g, x + 3, y + 3, 5, 5, '#18c4c4'); rect(g, x, y + 6, 11, 3, '#18c4c4');
      rect(g, x + 4, y + 3, 3, 2, '#14213d'); rect(g, x, y + 5, 2, 4, '#ff4d6d'); rect(g, x + 9, y + 5, 2, 4, '#ff4d6d');
      rect(g, x + 4, y + 9, 3, 2 + (Math.random() * 2 | 0), '#ffd93d');
    }
    function draw(g) {
      g.save(); if (s.shake > 0) g.translate((Math.random() - .5) * 4, (Math.random() - .5) * 4);
      rect(g, -4, -4, W + 8, H + 8, '#050816');
      for (const st of stars) rect(g, st.x, st.y, 1, st.z > 2 ? 2 : 1, ['#555b88', '#9fb4ff', '#ffffff'][st.z - 1]);
      for (const it of s.items) { rect(g, it.x - 4, it.y - 4, 9, 9, Math.floor(s.t * 8) % 2 ? '#ffd93d' : '#ff9f43'); txt(g, 'P', it.x - 3, it.y - 4, '#000', F8, null); }
      for (const f of s.foes) {
        if (f.t < 0) continue; const x = Math.round(f.x), y = Math.round(f.y), fl = f.flash > 0;
        if (f.flash > 0) f.flash -= 1 / 60;
        if (f.kind === 'drone') { rect(g, x + 2, y, 7, 7, fl ? '#fff' : '#ff4d6d'); rect(g, x, y + 2, 11, 3, fl ? '#fff' : '#c81d4f'); rect(g, x + 4, y + 2, 3, 2, '#ffd93d'); }
        else if (f.kind === 'diver') { rect(g, x, y + 3, 11, 3, fl ? '#fff' : '#9775fa'); rect(g, x + 3, y, 5, 9, fl ? '#fff' : '#6741d9'); rect(g, x + 4, y + 5, 3, 2, '#7fffff'); }
        else { rect(g, x, y, 12, 10, fl ? '#fff' : '#ff9f43'); rect(g, x + 2, y + 2, 8, 6, '#a64b00'); rect(g, x + 5, y + 8, 2, 4, '#ffd93d'); }
      }
      const B = s.boss;
      if (B) { const fl = B.flash > 0; if (fl) B.flash -= 1 / 60; const x = Math.round(B.x), y = Math.round(B.y);
        rect(g, x, y + 6, 48, 12, fl ? '#fff' : '#6b21a8'); rect(g, x + 8, y, 32, 22, fl ? '#fff' : '#9333ea'); rect(g, x + 18, y + 6, 12, 8, '#ff4d6d'); rect(g, x + 22, y + 8, 4, 4, '#ffd93d');
        rect(g, x + 2, y + 18, 6, 4, '#a855f7'); rect(g, x + 40, y + 18, 6, 4, '#a855f7'); rect(g, x + 22, y + 22, 4, 3, '#ffd93d');
        rect(g, 20, 14, 120, 4, '#333'); rect(g, 20, 14, 120 * B.hp / B.max, 4, '#ff4d6d'); }
      for (const b of s.bullets) rect(g, b.x, b.y, 1, 4, '#7fffff');
      for (const b of s.eb) { rect(g, b.x - 1, b.y - 1, 3, 3, '#ff6bcb'); rect(g, b.x, b.y, 1, 1, '#fff'); }
      for (const f of s.fx) rect(g, f.x, f.y, 2, 2, f.c);
      if (!s.over && !(s.inv > 0 && Math.floor(s.inv * 10) % 2)) ship(g, Math.round(s.x), Math.round(s.y));
      g.restore();
      rect(g, 0, 0, W, 11, 'rgba(0,0,0,.55)');
      txt(g, String(s.score).padStart(6, '0'), 3, 2, '#fff'); txt(g, 'DALGA ' + s.wave, 64, 2, '#ffd93d');
      for (let i = 0; i < s.lives; i++) rect(g, 150 - i * 7, 3, 5, 5, '#18c4c4');
      if (s.waveT < 1.4 && s.waveT > .2 && !s.foes.length && !s.boss && !s.over) ctxt(g, (s.wave + 1) % 5 === 0 ? 'DIKKAT: BOSS!' : 'DALGA ' + (s.wave + 1), 64, (s.wave + 1) % 5 === 0 ? '#ff4d6d' : '#7fd4ff');
      if (s.over) { panel(g, 44, 50); ctxt(g, 'OYUN BITTI', 52, '#ff6b6b'); ctxt(g, 'PUAN ' + s.score, 66, '#fff'); ctxt(g, 'START: TEKRAR', 80, '#7fd4ff'); }
    }
    return { name: 'HYDRO STRIKE', color: '#9775fa', music: 'shoot', help: 'A: ATES  YON: HAREKET', reset, update, draw };
  })();

  window.HydroGames = { race: Race, plat: Plat, shoot: Shoot };
})();
