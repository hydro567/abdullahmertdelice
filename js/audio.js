// 8-bit ses motoru: efektler + ozgun chiptune muzikler (kare dalga melodi, ucgen bas, gurultu davul)
(function () {
  let ctx = null, master = null, musicBus = null, sfxBus = null;
  let level = 2; // 0 sessiz .. 3 yuksek
  try { const v = parseInt(localStorage.getItem('hydro-vol'), 10); if (v >= 0 && v <= 3) level = v; } catch (e) {}
  const GAIN = [0, .35, .65, 1];
  let noiseBuf = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = GAIN[level]; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = .55; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { return false; }
  }
  function setLevel(v) { level = (v + 4) % 4; if (master) master.gain.setTargetAtTime(GAIN[level], ctx.currentTime, .02); try { localStorage.setItem('hydro-vol', level); } catch (e) {} return level; }

  function tone(freq, dur, type = 'square', vol = .05, when = 0, bus = null, slide = 0) {
    if (!ensure() || !level) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol = .05, when = 0, bus = null, hp = 1000) {
    if (!ensure() || !level) return;
    const t = ctx.currentTime + when, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + dur + .02);
  }

  // ---- notalar ----
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(n) { if (!n || n === '.') return 0; const m = n.match(/^([A-G]#?)(\d)$/); return 440 * Math.pow(2, (NOTE[m[1]] + (m[2] - 4) * 12 - 9) / 12); }
  const seq = s => s.trim().split(/\s+/);

  // Ozgun parcalar (her adim 1/8 nota). '.' = sus, '-' = onceki notayi uzat
  const SONGS = {
    menu: { bpm: 112,
      lead: seq('E5 - G5 . A5 - G5 E5 D5 - E5 . C5 - . . E5 - G5 . A5 - C6 A5 G5 - E5 . D5 - . . C5 - E5 . F5 - E5 D5 C5 - D5 . A4 - . . B4 - D5 . G5 - F5 D5 E5 - - - . . . .'),
      bass: seq('C3 . G3 . C3 . G3 . A2 . E3 . A2 . E3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . C3 . G3 . C3 . G3 . A2 . E3 . A2 . E3 . F2 . C3 . G2 . D3 . C3 . G2 . C3 . . .'),
      drum: seq('k . h . s . h . k . h . s . h h') },
    race: { bpm: 150,
      lead: seq('A4 C5 E5 A5 G5 E5 C5 E5 F5 A5 C6 A5 G5 E5 D5 E5 A4 C5 E5 A5 B5 A5 G5 E5 F5 E5 D5 C5 D5 - - . E5 - E5 G5 A5 - G5 E5 F5 - F5 A5 C6 - B5 A5 G5 - G5 B5 D6 - C6 B5 A5 - - - . . . .'),
      bass: seq('A2 A2 A3 A2 A2 A2 A3 A2 F2 F2 F3 F2 F2 F2 F3 F2 C3 C3 C4 C3 C3 C3 C4 C3 G2 G2 G3 G2 G2 G2 G3 G2 A2 A2 A3 A2 A2 A2 A3 A2 F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2 E2 E2 E3 E2 E2 E2 E3 E2'),
      drum: seq('k h s h k k s h k h s h k k s s') },
    plat: { bpm: 132,
      lead: seq('C5 . E5 G5 . E5 C6 . B5 . G5 . A5 G5 E5 . F5 . A5 C6 . A5 F5 . G5 . E5 . D5 . . . C5 . E5 G5 . E5 C6 . D6 . B5 . C6 B5 G5 . A5 . F5 . G5 . B5 . C6 - - - . . . .'),
      bass: seq('C3 . G2 . C3 . G2 . E3 . B2 . E3 . B2 . F3 . C3 . F3 . C3 . G2 . D3 . G2 . B2 . C3 . G2 . C3 . G2 . G2 . D3 . G2 . D3 . F2 . C3 . G2 . D3 . C3 . G2 . C3 . . .'),
      drum: seq('k . h k s . h . k . h k s . h h') },
    shoot: { bpm: 140,
      lead: seq('D5 . D5 F5 . D5 G5 . F5 . D5 . C5 . A4 . D5 . D5 F5 . G5 A5 . C6 . A5 . G5 . F5 . A#4 . A#4 D5 . F5 A#5 . A5 . F5 . D5 . C5 . A4 . C5 E5 . G5 A5 . G5 F5 E5 . D5 - - .'),
      bass: seq('D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 C2 C3 C2 C3 D2 D3 D2 D3 D2 D3 D2 D3 F2 F3 F2 F3 C2 C3 C2 C3 A#1 A#2 A#1 A#2 A#1 A#2 A#1 A#2 A1 A2 A1 A2 A1 A2 A1 A2 C2 C3 C2 C3 C2 C3 C2 C3 A1 A2 A1 A2 D2 D3 D2 D3'),
      drum: seq('k h s h k h s h k h s h k s s s') }
  };

  let cur = null, step = 0, nextT = 0, timer = null;
  function schedule() {
    if (!cur || !ctx) return;
    const S = SONGS[cur], dt = 60 / S.bpm / 2;
    while (nextT < ctx.currentTime + .15) {
      const when = nextT - ctx.currentTime;
      const L = S.lead[step % S.lead.length], B = S.bass[step % S.bass.length], Dr = S.drum[step % S.drum.length];
      if (L && L !== '.' && L !== '-') {
        let len = 1; while (S.lead[(step + len) % S.lead.length] === '-') len++;
        tone(hz(L), dt * len * .95, 'square', .045, Math.max(0, when), musicBus);
        tone(hz(L) * 2, dt * len * .6, 'square', .008, Math.max(0, when), musicBus);
      }
      if (B && B !== '.' && B !== '-') tone(hz(B), dt * .9, 'triangle', .11, Math.max(0, when), musicBus);
      if (Dr === 'k') tone(150, .12, 'sine', .14, Math.max(0, when), musicBus, .3);
      if (Dr === 's') noise(.09, .06, Math.max(0, when), musicBus, 1500);
      if (Dr === 'h') noise(.03, .025, Math.max(0, when), musicBus, 6000);
      step++; nextT += dt;
    }
  }
  function play(name) {
    if (name === cur) return;
    cur = name; step = 0;
    if (!name) return;
    if (!ensure()) return;
    nextT = ctx.currentTime + .05;
    if (!timer) timer = setInterval(schedule, 40);
  }
  function stop() { cur = null; }

  window.HydroAudio = { ensure, tone, noise, play, stop, setLevel, get level() { return level; }, get song() { return cur; } };
})();
