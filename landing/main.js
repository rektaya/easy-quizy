// Easy Quizy landing page: the flipping hero word, a starry sky, and a circle that draws itself as you scroll.
(() => {
  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // a small seeded random, so the sky is the same on every visit
  const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // ---- the hero word: a split-flap board that flips the german word every 3 seconds ----
  // all 20 words are in the app's own word list (german, english meaning as the app gives it)
  (() => {
    const WORDS = [
      ['der Feierabend', 'end of the work day'],
      ['die Sehnsucht', 'longing'],
      ['die Schadenfreude', 'malicious joy'],
      ['der Handschuh', 'glove'],
      ['der Schmetterling', 'butterfly'],
      ['das Eichhörnchen', 'squirrel'],
      ['die Heimat', 'home, home town'],
      ['der Regenschirm', 'umbrella'],
      ['das Abenteuer', 'adventure'],
      ['die Mitternacht', 'midnight'],
      ['der Wasserfall', 'waterfall'],
      ['das Geheimnis', 'secret'],
      ['der Hausschuh', 'slipper'],
      ['das Feuerwerk', 'fireworks'],
      ['der Reißverschluss', 'zipper'],
      ['die Eifersucht', 'jealousy'],
      ['das Gewissen', 'conscience'],
      ['der Fingerabdruck', 'fingerprint'],
      ['die Windmühle', 'windmill'],
      ['die Zuversicht', 'confidence, optimism'],
    ];
    const deEl = $('boardDe'), enBox = $('enBox'), enText = $('enText'), sr = $('wordSr');
    if (!deEl || !enBox || !('animate' in Element.prototype)) return;
    const DUR = 80, PERIOD = 3000;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const LETTERS = 'abcdefghijklmnoprstuwyzäöüß';
    const rand = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

    const makeBoard = (host, length) => {
      host.textContent = '';
      const cells = [];
      for (let i = 0; i < length; i++) {
        const c = document.createElement('span');
        c.className = 'cell';
        c.innerHTML = '<span class="h t"><span></span></span><span class="h b"><span></span></span><span class="h f ft"><span></span></span><span class="h f fb"><span></span></span>';
        c.ch = ' ';
        host.appendChild(c);
        cells.push(c);
      }
      return cells;
    };
    // every letter gets its own natural width (in em, so it follows the board's font size)
    const mctx = document.createElement('canvas').getContext('2d');
    const widths = {};
    const emOf = (ch) => { if (!(ch in widths)) { mctx.font = '500 100px Satoshi, system-ui, sans-serif'; if ('letterSpacing' in mctx) mctx.letterSpacing = '-4px'; widths[ch] = mctx.measureText(ch).width / 100; } return widths[ch]; };
    const fit = (c, ch, trailing) => { c.style.width = trailing ? '0' : emOf(ch) + 'em'; };
    const paint = (c, ch, trailing) => { fit(c, ch, trailing); c.querySelectorAll('.h > span').forEach((s) => { s.textContent = ch; }); c.ch = ch; };
    // one flip: the top half falls away, the bottom half of the new letter falls into place
    const step = async (c, next) => {
      const [t, b, ft, fb] = c.children;
      t.firstChild.textContent = next; b.firstChild.textContent = c.ch;
      ft.firstChild.textContent = c.ch; fb.firstChild.textContent = next;
      ft.style.visibility = fb.style.visibility = 'visible';
      const a = ft.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: DUR / 2, easing: 'ease-in', fill: 'forwards' });
      const z = fb.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: DUR / 2, delay: DUR / 2, easing: 'ease-out', fill: 'both' });
      // without a backing the old and new letters would show through each other: the old halves go at the
      // half-way point, exactly when the new ones arrive
      const swap = (from, to) => [{ opacity: from, offset: 0 }, { opacity: from, offset: 0.5 }, { opacity: to, offset: 0.5 }, { opacity: to, offset: 1 }];
      const ta = t.animate(swap(0, 1), { duration: DUR, fill: 'both' });
      const ba = b.animate(swap(1, 0), { duration: DUR, fill: 'both' });
      await Promise.all([a.finished, z.finished, ta.finished, ba.finished]);
      b.firstChild.textContent = next;
      ft.style.visibility = fb.style.visibility = 'hidden';
      a.cancel(); z.cancel(); ta.cancel(); ba.cancel();
      c.ch = next;
    };
    const flip = async (c, target, i, trailing) => {
      if (c.ch === target) { fit(c, target, trailing); return; } // already right, only the width may need fixing
      await sleep(i * 30);
      if (!trailing) fit(c, target);
      for (let n = 2 + Math.floor(Math.random() * 3); n > 0; n--) { const r = rand(); if (r !== c.ch && r !== target) await step(c, r); }
      await step(c, target);
      if (trailing) fit(c, target, true); // an empty card at the end takes no room
    };

    const init = () => {
      const de = makeBoard(deEl, Math.max(...WORDS.map((w) => w[0].length)));
      const show = async (index, animate) => {
        const [g, e] = WORDS[index];
        sr.textContent = `${g}: ${e}`;
        if (animate) enBox.style.opacity = 0; // the meaning fades out, the german word flips, then the meaning fades back in
        const jobs = [];
        de.forEach((c, i) => { const ch = g[i] || ' ', tail = i >= g.length; animate ? jobs.push(flip(c, ch, i, tail)) : paint(c, ch, tail); });
        await Promise.all(jobs);
        enText.textContent = e; enBox.style.opacity = 1;
      };

      let index = 0, busy = false, visible = true;
      show(0, false); // start with the first word, already in place
      // the board starts blank, then flips into the first word, so the page opens with the effect
      if (!reduce) { de.forEach((c) => paint(c, ' ', true)); enBox.style.opacity = 0; sleep(500).then(() => { busy = true; show(0, true).then(() => { busy = false; }); }); }
      const next = async () => {
        if (busy || !visible || document.hidden) return;
        busy = true; index = (index + 1) % WORDS.length;
        await show(index, !reduce); busy = false;
      };
      setInterval(next, PERIOD);
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(deEl);
    };
    // measure the letters only once the font is there
    (document.fonts && document.fonts.load ? document.fonts.load('500 28px Satoshi').catch(() => {}) : Promise.resolve()).then(init);
  })();


  // ---- the sky behind the page: the same quiet stars as the app, a few more of them the further you scroll ----
  // (src/components/StarBackground.tsx and ambientStars in src/onboarding/sky.ts: one small star per cell of a grid, most cells,
  // at a random spot in the cell, so there are no clumps and no gaps; the first stars a little brighter and bigger, then they settle)
  (() => {
    const cv = $('sky'); const ctx = cv.getContext('2d');
    const CELL = 72, FIRST = 26, SETTLE_AT = 60;
    const DIM_EARLY = 1.15, DIM_SETTLED = 0.55, SIZE_EARLY = 1.5, SIZE_SETTLED = 0.9;
    let W = 0, H = 0, lastW = 0, lastH = 0, field = [], progress = 0, lit = -1, raf = 0, lastDraw = 0;
    const build = () => {
      const rnd = seeded(42), stars = [];
      for (let gy = 0; gy < Math.ceil(H / CELL); gy++) {
        for (let gx = 0; gx < Math.ceil(W / CELL); gx++) {
          const s = { x: (gx + rnd()) * CELL, y: (gy + rnd()) * CELL, r: 0.5 + rnd() * 1.1, o: 0.25 + rnd() * 0.5, now: 0 };
          if (rnd() < 0.3) continue; // leave some cells empty, so it is not a grid
          if (s.x > W || s.y > H) continue;
          stars.push(s);
        }
      }
      // a scrambled order, so the sky fills up all over and not from a corner
      const mix = seeded(7);
      for (let i = stars.length - 1; i > 0; i--) { const k = Math.floor(mix() * (i + 1)); [stars[i], stars[k]] = [stars[k], stars[i]]; }
      field = stars;
    };
    // The sky is only redrawn when a star is arriving: a canvas that changes every frame makes the browser re-blur the frosted cards over it
    // on every frame, and that is what makes scrolling feel jerky.
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const size = () => {
      const w = innerWidth, h = innerHeight;
      if (lastW && w === lastW && Math.abs(h - lastH) < 160) return; // a phone's address bar sliding in and out is no reason to redo the sky
      lastW = w; lastH = h;
      const d = Math.min(devicePixelRatio || 1, 1.5); W = w; H = h; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); build(); lit = -1; kick();
    };
    const count = () => Math.min(field.length, Math.round(FIRST + progress * (field.length - FIRST)));
    const scroll = () => { const max = document.documentElement.scrollHeight - innerHeight; progress = max > 0 ? clamp(scrollY / max, 0, 1) : 0; if (count() !== lit) kick(); };
    const frame = (now) => {
      raf = 0;
      if (now - lastDraw < 50) { raf = requestAnimationFrame(frame); return; } // a slow background does not need more than ~20 redraws a second
      lastDraw = now;
      ctx.clearRect(0, 0, W, H);
      const shown = count();
      const settle = Math.min(1, shown / SETTLE_AT);
      const dim = DIM_EARLY + (DIM_SETTLED - DIM_EARLY) * settle, grow = SIZE_EARLY + (SIZE_SETTLED - SIZE_EARLY) * settle;
      ctx.fillStyle = '#EFF2F5';
      let busy = false;
      field.forEach((s, i) => {
        const goal = i < shown ? 1 : 0, diff = goal - s.now;
        if (Math.abs(diff) > 0.004) { s.now += diff * (reduce ? 1 : 0.05); busy = true; } else s.now = goal; // a new star fades in, nothing pops
        if (s.now < 0.01) return;
        ctx.globalAlpha = Math.min(1, s.o * dim) * s.now;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * grow, 0, TAU); ctx.fill();
      });
      lit = shown;
      if (busy) raf = requestAnimationFrame(frame);
    };
    scroll(); size();
    addEventListener('resize', () => { size(); scroll(); }); addEventListener('scroll', scroll, { passive: true });
  })();

  // ---- the circle, drawn by scrolling: the app's own stardust ring, with the scroll in place of the finger ----
  // Follows src/circle/StardustRing.tsx, src/circle/shine.ts and src/components/KnownDust.tsx: 210 stars that arrive from
  // slightly outside and then drift and twinkle, a colour and a shine that grow with the rating, a glow at the finger, the last
  // tenth snapping shut, an orange-gold flare and stardust floating up out of the screen for a known word, and the handle.
  (() => {
    const section = $('draw'), stage = $('stage'), cv = $('ring'), ctx = cv.getContext('2d'), caption = $('caption');
    const dustCv = $('dust'), dctx = dustCv.getContext('2d');
    if (!section || !cv || !dustCv) return;
    const PAD = 72, STROKE = 14, DOTS = 210, KNOWN_MS = 3600;
    const ease = (t) => { const k = clamp(t, 0, 1); return k * k * (3 - 2 * k); };
    const inOut = (t) => { const k = clamp(t, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };

    // the six colours of the app (src/theme.ts) and the ramps of src/circle/shine.ts
    const BLUE = [110, 165, 255], ICE = [201, 221, 255], CREAM = [255, 244, 220], GOLD = [255, 180, 94], EMBER = [255, 150, 55], DEEP = [64, 104, 216];
    const CORE_RAMP = [[0, ...BLUE], [0.24, 150, 195, 255], [0.5, ...ICE], [0.7, 255, 236, 205], [1, ...CREAM]];
    const HALO_RAMP = [[0, 70, 130, 255], [0.3, 90, 150, 255], [0.55, 230, 140, 80], [0.8, ...EMBER], [1, ...EMBER]];
    const SHINE_STEPS = [[0, 0.09], [0.3, 0.24], [0.6, 0.5], [0.9, 0.85], [1, 1]];
    const shineOf = (p) => { for (let i = 1; i < SHINE_STEPS.length; i++) { const [x1, y1] = SHINE_STEPS[i]; if (p <= x1) { const [x0, y0] = SHINE_STEPS[i - 1]; return y0 + ((p - x0) / (x1 - x0)) * (y1 - y0); } } return 1; };
    const ramp = (stops, t) => {
      for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i], k = (t - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k]; }
      const z = stops[stops.length - 1]; return [z[1], z[2], z[3]];
    };
    const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
    // how strongly a known word's celebration glows over the burst, 0..1: it rises at once and dies away quickly
    const celebration = (b) => (b <= 0 || b >= 1 ? 0 : ease(b / 0.05) * (1 - ease((b - 0.1) / 0.2)));

    const rnd = seeded(77);
    const dots = Array.from({ length: DOTS }, (_, i) => ({ s: (i + 0.5) / DOTS, jitter: (rnd() - 0.5) * 9, big: rnd() < 0.3, fly: 0.4 + rnd() * 0.9, phase: rnd() * 6.283 }));
    const drnd = seeded(311);
    const waves = Array.from({ length: 12 }, (_, w) => ({ delay: (w / 12) * 0.3, size: 3.2 + drnd() * 2.6, motes: Array.from({ length: 14 }, () => ({ ang: drnd() * TAU, drift: (drnd() - 0.5) * 70, speed: 1 + drnd() * 0.4, phase: drnd() * 6.283 })) }));

    let S = 320, W = 392, dpr = 1, ddpr = 1, DW = 0, DH = 0;
    let dustShown = false, target = 0, display = 0, speed = 0, pulse = 0, pulseAt = -1e9, burstAt = null, handle = 0, handleAt = -1e9;
    let known = false, running = false, raf = 0, lastText = '', lastDisplay = 0, lastBurst = -1e9;
    const clearDust = () => { dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dustCv.width, dustCv.height); };

    let glowSprite = null; const sprites = new Map();
    let VH = innerHeight, lastIW = innerWidth; // the height the scene is measured against: it ignores a phone's address bar sliding in and out
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const s = stage.getBoundingClientRect().width || 320;
      if (s !== S || cv.width !== (s + 2 * PAD) * dpr) { S = s; W = S + 2 * PAD; cv.width = W * dpr; cv.height = W * dpr; glowSprite = null; sprites.clear(); } // setting a canvas size clears it: only when it really changed
      // the dust only needs a column as wide as the ring and its drift, as tall as the screen (it floats up and out of the top): a small layer, not a full-screen one
      const dw = Math.min(560, innerWidth);
      if (dw !== DW || Math.abs(innerHeight - DH) >= 160) { DW = dw; DH = innerHeight; ddpr = Math.min(dpr, 1.5); dustCv.width = Math.round(DW * ddpr); dustCv.height = Math.round(DH * ddpr); }
      if (innerWidth !== lastIW || Math.abs(innerHeight - VH) > VH * 0.2) { VH = innerHeight; lastIW = innerWidth; }
    };
    size();

    // 0 when the stage has just come into view, 1 when the page is about to leave it
    const progress = () => { const r = section.getBoundingClientRect(), vh = VH; return clamp((vh * 0.55 - r.top) / (r.height - vh * 0.45), 0, 1); };
    const levelText = (v) => (v < 0.02 ? 'how well do you know it?' : v < 0.3 ? 'you don’t know it' : v < 0.6 ? 'vaguely familiar' : v < 0.9 ? 'you know it, but want to study it' : 'you know it for sure');
    const onScroll = () => {
      // the scroll is the finger: it draws the first 90%, and the last tenth snaps shut, as in the app
      const f = clamp(progress() / 0.78, 0, 1) * 0.92;
      const isKnown = f >= 0.9;
      target = isKnown ? 1 : f;
      if (isKnown && !known) {
        const t = performance.now();
        // a new burst only if the last one is long over: scrolling to and fro across the line must not keep launching stars
        burstAt = t - lastBurst > KNOWN_MS + 1500 ? (lastBurst = t) : lastBurst; handleAt = burstAt;
      }
      if (!isKnown && known) { burstAt = null; clearDust(); }
      known = isKnown;
      section.classList.toggle('done', known); // the waitlist form shows once the ring has closed
      stage.classList.toggle('rated', known);
      const text = levelText(target);
      if (text !== lastText) { lastText = text; caption.style.opacity = 0; setTimeout(() => { caption.textContent = text; caption.style.opacity = 1; }, 160); }
    };

    // the soft glow round a star: a blurred round dot (sigma 6-7 in the app) drawn as a radial gradient, which every browser can do
    const blob = (g, width, sigma, rgb) => {
      const rho = width / 2, v = sigma * sigma + (rho * rho) / 4, peak = Math.min(1, (rho * rho) / (2 * v)), R = 4 * Math.sqrt(v);
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, R);
      for (let k = 0; k <= 10; k++) grad.addColorStop(k / 10, rgba(rgb, (peak * Math.exp(-Math.pow((k / 10) * R, 2) / (2 * v))).toFixed(4)));
      return { grad, R };
    };
    const place = (g, x, y) => g.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr);
    // a soft ring all the way round: a really blurred stroke, with no visible steps. The stroke is drawn far off to the side and only its
    // shadow is brought into the picture, because a canvas shadow is a true gaussian blur in every browser (sigma = shadowBlur / 2)
    const OFF = 4000;
    const blurRing = (g, cx, cy, r, width, sigma, rgb, a) => {
      g.save();
      g.setTransform(dpr, 0, 0, dpr, (cx - OFF) * dpr, cy * dpr);
      g.shadowColor = rgba(rgb, a); g.shadowBlur = sigma * 2 * dpr; g.shadowOffsetX = OFF * dpr; g.shadowOffsetY = 0;
      g.lineWidth = width; g.strokeStyle = '#000';
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
      g.restore();
    };

    // A soft glow round a star is the same picture for every star: draw it once into a small canvas and stamp it (a textured square is far cheaper
    // for the graphics card than a gradient fill per star per frame). Pictures are remembered by size and colour.
    const sprite = (width, sigma, rgb, scale) => {
      const key = `${Math.round(width * 2)}|${sigma}|${rgb.map((v) => Math.round(v / 3)).join(',')}|${scale}`;
      let s = sprites.get(key); if (s) return s;
      const { grad, R } = blob(ctx, Math.round(width * 2) / 2, sigma, rgb), size = Math.ceil(2 * R * scale);
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = size;
      const g = cvs.getContext('2d'); g.setTransform(scale, 0, 0, scale, size / 2, size / 2); g.fillStyle = grad; g.fillRect(-R, -R, 2 * R, 2 * R);
      if (sprites.size > 120) sprites.clear();
      s = { cv: cvs, R }; sprites.set(key, s); return s;
    };
    // the orange-gold light round the whole ring for a known word: blurred once into a picture, then faded in and out
    const ensureGlow = () => {
      if (glowSprite) return glowSprite;
      const o = document.createElement('canvas'); o.width = o.height = Math.round(W * dpr);
      const c = S / 2 + PAD, r = S / 2 - STROKE, og = o.getContext('2d');
      blurRing(og, c, c, r, 34, 20, EMBER, 0.55); blurRing(og, c, c, r, 14, 9, GOLD, 0.6);
      return (glowSprite = o);
    };
    const idle = (f) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 600 }) : setTimeout(f, 80));

    const frame = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const time = reduce ? 0 : now / 1000;
      const c = S / 2, r = c - STROKE;

      // the finger's state: the scroll follows softly; crossing a 30/60/90% line pulses the glow at the end
      const before = display;
      display += (target - display) * (reduce ? 1 : 0.22);
      if (Math.abs(target - display) < 0.0015) display = target;
      for (const line of [0.3, 0.6, 0.9]) if ((before - line) * (display - line) < 0 || display === line) { pulse = 1; pulseAt = now; }
      speed = Math.max(speed * 0.9, Math.min(1, (Math.abs(display - before) * TAU * 60) / 8));
      const pulseV = pulse ? 1 - inOut((now - pulseAt) / 650) : 0;
      const b = burstAt === null ? 0 : clamp((now - burstAt) / KNOWN_MS, 0, 1); // 0 idle, runs 0 -> 1 for a known word
      const celeb = display < 1 ? 0 : celebration(b);
      const flare = b > 0 && b < 1 ? Math.sin(Math.PI * Math.min(1, b / 0.22)) * 0.45 : 0;
      const shine = shineOf(display) + flare;
      const core = ramp(CORE_RAMP, shine), haloC = ramp(HALO_RAMP, shine);
      const twinkle = (extra) => (reduce ? 1 : 0.72 + 0.28 * Math.sin(now / 480 + extra));
      const coreOp = (extra) => Math.min(1, (0.7 + 0.3 * shine) * twinkle(extra));
      const haloOp = (extra) => Math.min(1, (0.22 + 0.55 * Math.pow(shine, 1.6)) * (reduce ? 1 : 0.75 + 0.25 * Math.sin(now / 480 + extra)));
      const haloW = 5 + 15 * shine + 9 * celeb;
      const sizeBig = 3.3 + 2.4 * shine, sizeSmall = 2.4 + 1.9 * shine;

      // where every star is right now: nearest the finger they are still arriving from outside
      const arriving = display < 1;
      const pts = dots.map((d) => {
        const a = d.s * TAU + Math.sin(time * 0.5 + d.phase * 1.7) * 0.012;
        const settle = arriving ? Math.exp(-(display - d.s) * 15) : 0;
        const rad = r + d.jitter * 0.55 + Math.sin(time * 0.7 + d.phase) * 1.8 + settle * 15 * d.fly;
        return { x: c + PAD + rad * Math.sin(a), y: c + PAD - rad * Math.cos(a), lit: d.s <= display, big: d.big };
      });

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (display > 0.004) {
        for (const big of [true, false]) { // glow first, then the bright centres
          const sp = sprite(haloW, big ? 7 : 6, haloC, dpr);
          ctx.globalAlpha = haloOp(big ? 0 : 3.1);
          for (let i = 0; i < DOTS; i++) if (pts[i].lit && pts[i].big === big) ctx.drawImage(sp.cv, pts[i].x - sp.R, pts[i].y - sp.R, 2 * sp.R, 2 * sp.R);
        }
        for (const big of [true, false]) { // all stars of one size in a single fill
          ctx.globalAlpha = coreOp(big ? 0 : 3.1); ctx.fillStyle = rgba(core, 1);
          const rad = (big ? sizeBig : sizeSmall) / 2;
          ctx.beginPath();
          for (let i = 0; i < DOTS; i++) if (pts[i].lit && pts[i].big === big) { ctx.moveTo(pts[i].x + rad, pts[i].y); ctx.arc(pts[i].x, pts[i].y, rad, 0, TAU); }
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (celeb > 0.002) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = celeb; ctx.drawImage(ensureGlow(), 0, 0); ctx.globalAlpha = 1; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } // a known word: a soft orange-gold light all round the ring
      // the glow at the end of what is drawn, where the finger is (the colour of the stars it runs along)
      if (display > 0.004 && display < 1) {
        const a = display * TAU, hx = c + PAD + r * Math.sin(a), hy = c + PAD - r * Math.cos(a), hr = 14 + 12 * speed + 12 * pulseV;
        place(ctx, hx, hy);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, hr);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, rgba(ramp(HALO_RAMP, shineOf(display)), 0.5)); g.addColorStop(1, rgba(ramp(HALO_RAMP, shineOf(display)), 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.fill();
      }
      // the handle: a dot on the ring where the answer ends, with one soft pulse when it appears
      handle += ((known ? 1 : 0) - handle) * 0.3; if (handle < 0.005) handle = 0;
      if (handle > 0) {
        const hp = (() => { const t = now - handleAt - 120; return t < 0 ? 0 : t < 450 ? inOut(t / 450) : t < 1100 ? 1 - inOut((t - 450) / 650) : 0; })();
        const a = display * TAU, hx = c + PAD + r * Math.sin(a), hy = c + PAD - r * Math.cos(a);
        place(ctx, hx, hy);
        const hr = 21 + 10 * hp, soft = ctx.createRadialGradient(0, 0, 0, 0, 0, hr * 1.5);
        soft.addColorStop(0, rgba(haloC, 1)); soft.addColorStop(0.45, rgba(haloC, 0.8)); soft.addColorStop(0.7, rgba(haloC, 0.3)); soft.addColorStop(1, rgba(haloC, 0));
        ctx.globalAlpha = handle * (0.3 + 0.35 * hp); ctx.fillStyle = soft; ctx.beginPath(); ctx.arc(0, 0, hr * 1.5, 0, TAU); ctx.fill();
        ctx.globalAlpha = handle; ctx.fillStyle = rgba(core, 1); ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, TAU); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(haloC, 1); ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      lastDisplay = display;

      // the stardust of a known word: stars come loose from the ring in waves and drift up like fireflies, out of the top of the screen
      const sec = section.getBoundingClientRect(), leave = clamp((sec.bottom - VH * 0.4) / (VH * 0.6), 0, 1); // 1 while the scene is pinned, 0 once it has scrolled away
      if (known && b > 0 && b < 1 && leave > 0.01 && !document.hidden) {
        dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dustCv.width, dustCv.height); dctx.setTransform(ddpr, 0, 0, ddpr, 0, 0);
        const box = stage.getBoundingClientRect(), dl = (innerWidth - DW) / 2; // the dust layer is a column in the middle of the screen
        const fx = box.left + box.width / 2 - dl, fy = box.top + box.height / 2, reach = fy + 60;
        for (const w of waves) {
          const life = clamp((b - w.delay) / 0.6, 0, 1); if (life <= 0) continue;
          const op = ease(life / 0.1) * leave, sp = sprite(w.size * 3.4, 7, EMBER, ddpr);
          for (const m of w.motes) {
            const x = fx + r * Math.sin(m.ang) + m.drift * life + Math.sin(life * 8 + m.phase) * 7;
            const y = fy - r * Math.cos(m.ang) - reach * m.speed * Math.pow(life / 0.8, 1.15);
            if (y < -30) continue;
            dctx.globalAlpha = op * 0.55; dctx.drawImage(sp.cv, x - sp.R, y - sp.R, 2 * sp.R, 2 * sp.R);
            dctx.globalAlpha = op; dctx.fillStyle = rgba(CREAM, 1); dctx.beginPath(); dctx.arc(x, y, w.size / 2, 0, TAU); dctx.fill();
          }
        }
        dctx.globalAlpha = 1; dustShown = true;
      } else if (dustShown) { clearDust(); dustShown = false; }
    };
    const start = () => { if (!running) { running = true; dustCv.style.visibility = 'visible'; raf = requestAnimationFrame(frame); idle(ensureGlow); } }; // the (empty) dust layer exists from the moment the scene is near: it is not created at the moment the ring snaps shut
    const stop = () => { running = false; cancelAnimationFrame(raf); clearDust(); dustCv.style.visibility = 'hidden'; dustShown = false; };
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearDust(); });
    let queued = false;
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; onScroll(); }); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', () => { size(); queue(); });
    onScroll();
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { if (es[es.length - 1].isIntersecting) start(); else stop(); }, { rootMargin: '0px 0px -25% 0px' }).observe(section); // it runs from when the scene is well into view
    else start();
  })();

  // ---- the bento grid: small star pictures in the cards, and the cards fade in one after another ----
  (() => {
    const grid = $('grid'); if (!grid) return;
    const rnd = seeded(5);
    const BLUE = [110, 165, 255], ICE = [201, 221, 255], CREAM = [255, 244, 220], GOLD = [255, 180, 94], EMBER = [255, 150, 55], DEEP = [64, 104, 216];
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const core = (t) => (t < 0.5 ? mix(BLUE, ICE, t / 0.5) : mix(ICE, CREAM, (t - 0.5) / 0.5)); // blue, icy, cream: how much a star shines
    const halo = (t) => mix([70, 130, 255], EMBER, Math.min(1, t * 1.15));
    const svg = (host, w, h, inner) => { host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="presentation"><defs><filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter><filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter><radialGradient id="head"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="${rgba(halo(0.85), 0.5)}"/><stop offset="1" stop-color="${rgba(halo(0.85), 0)}"/></radialGradient></defs>${inner}</svg>`; };

    // a ring of stardust, drawn most of the way round, the blue stars turning cream and warm along it
    const ring = () => {
      const host = $('vizRing'); if (!host) return;
      const N = 150, frac = 0.86, c = 115, r = 88; let glow = '', dots = '';
      for (let i = 0; i < N; i++) {
        const t = i / N / frac, a = (i / N) * frac * TAU, rad = r + (rnd() - 0.5) * 5;
        const x = (c + rad * Math.sin(a)).toFixed(1), y = (c - rad * Math.cos(a)).toFixed(1);
        glow += `<circle cx="${x}" cy="${y}" r="${(3 + 6 * t).toFixed(1)}" fill="${rgba(halo(t), 0.5)}"/>`;
        dots += `<circle class="${rnd() < 0.2 ? 'tw' : ''}" style="animation-delay:${(rnd() * 3).toFixed(1)}s" cx="${x}" cy="${y}" r="${(1 + 1.3 * t + rnd() * 0.7).toFixed(1)}" fill="${rgba(core(t))}"/>`;
      }
      const ha = frac * TAU, hx = (c + r * Math.sin(ha)).toFixed(1), hy = (c - r * Math.cos(ha)).toFixed(1);
      svg(host, 230, 230, `<g filter="url(#b4)">${glow}</g>${dots}<circle cx="${hx}" cy="${hy}" r="20" fill="url(#head)"/>`);
    };

    // a few topic stars, lit more or less, with threads between the lit ones
    const map = () => {
      const host = $('vizMap'); if (!host) return;
      const S = [[24, 78, 0.95], [88, 34, 0.7], [152, 84, 0.4], [214, 38, 0.2], [268, 80, 0], [118, 112, 0], [182, 14, 0]];
      const T = [[0, 1], [1, 2], [2, 3]];
      let g = '';
      T.forEach(([p, q]) => { g += `<line x1="${S[p][0]}" y1="${S[p][1]}" x2="${S[q][0]}" y2="${S[q][1]}" stroke="${rgba(GOLD, 0.35)}" stroke-width="1"/>`; });
      S.forEach(([x, y, l]) => {
        if (l <= 0) { g += `<circle cx="${x}" cy="${y}" r="3" fill="${rgba(CREAM, 0.35)}"/>`; return; }
        g += `<circle cx="${x}" cy="${y}" r="${(8 + 20 * l).toFixed(0)}" fill="${rgba(EMBER, 0.12 + 0.3 * l)}" filter="url(#b4)"/>`;
        if (l > 0.3) { const k = 5 + 12 * l; g += `<path d="M${x - k} ${y}H${x + k}M${x} ${y - k}V${y + k}" stroke="${rgba(GOLD, 0.35 + 0.4 * l)}" stroke-width="1"/>`; }
        g += `<circle cx="${x}" cy="${y}" r="${(2.5 + 2.5 * l).toFixed(1)}" fill="${rgba(mix(CREAM, GOLD, 1 - l * 0.6))}"/>`;
      });
      svg(host, 296, 124, g);
    };

    // the week as seven stars: dark blue for a day without study, up to a golden star for a day done
    const week = () => {
      const host = $('vizWeek'); if (!host) return;
      const L = [0.3, 0.6, 1, 0.75, 0.45, 0, 0], D = 'mtwtfss'; let g = '';
      L.forEach((l, i) => {
        const x = 18 + i * 34;
        if (l <= 0) g += `<circle cx="${x}" cy="22" r="5" fill="${rgba(DEEP, 0.85)}"/>`;
        else g += `<circle cx="${x}" cy="22" r="${(8 + 10 * l).toFixed(0)}" fill="${rgba(halo(l), 0.2 + 0.5 * l)}" filter="url(#b4)"/><circle class="tw" style="animation-delay:${(i * 0.4).toFixed(1)}s" cx="${x}" cy="22" r="${(5 + 2.5 * l).toFixed(1)}" fill="${rgba(core(l))}"/>`;
        g += `<text x="${x}" y="60" text-anchor="middle" font-size="15" fill="${rgba(CREAM, i === 5 ? 0.95 : 0.6)}" font-family="Satoshi, system-ui, sans-serif">${D[i]}</text>`;
      });
      svg(host, 242, 68, g);
    };
    ring(); map(); week();

    // fifteen dots that light up one by one (the first fifteen words)
    const row = grid.querySelector('.dots15');
    if (row) for (let i = 0; i < 15; i++) row.appendChild(document.createElement('i'));
    const lightRow = () => row && [...row.children].forEach((d, i) => setTimeout(() => d.classList.add('lit'), 500 + i * 110));

    // the cards appear one at a time: each when you scroll to it, and cards that arrive together come one after another
    const cards = [...grid.children];
    if (reduce || !('IntersectionObserver' in window)) { lightRow(); return; }
    grid.classList.add('armed');
    const GAP = 300; // ms between two cards that come into view together
    let nextFree = 0; // the earliest time the next card may start, so that cards never appear at once
    const show = (c) => { c.classList.add('in'); if (c.classList.contains('c-levels')) lightRow(); };
    const io = new IntersectionObserver((es) => {
      const entering = es.filter((e) => e.isIntersecting).map((e) => e.target).sort((x, y) => cards.indexOf(x) - cards.indexOf(y));
      entering.forEach((c) => {
        io.unobserve(c);
        const at = Math.max(performance.now(), nextFree);
        nextFree = at + GAP;
        setTimeout(() => show(c), at - performance.now());
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -14% 0px' }); // a card starts when its top edge is well inside the screen
    cards.forEach((c) => io.observe(c));
  })();

  // ---- the three screens: they come in one at a time, each when you scroll to it ----
  (() => {
    const row = $('shots'); if (!row) return;
    const shots = [...row.children];
    // decode the three big screenshots while the page is idle, not at the moment they scroll into view
    (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(() => row.querySelectorAll('img').forEach((im) => { if (im.decode) im.decode().catch(() => {}); }));
    if (reduce || !('IntersectionObserver' in window)) return;
    row.classList.add('armed');
    // The three phones come in left to right, 0.45 s apart, started by the row as a whole. (Started by each phone on its own, the middle one,
    // which the parallax holds 150 px lower, reached the trigger last and came in third.)
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      // never fade in a phone whose screen has not been unpacked yet (it would show an empty screen for a moment); wait for the pictures, but not for long
      const ready = Promise.all([...row.querySelectorAll('img')].map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())));
      Promise.race([ready, new Promise((r) => setTimeout(r, 1200))]).then(() => shots.forEach((s, i) => setTimeout(() => s.classList.add('in'), i * 450)));
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });
    io.observe(row);
  })();

  // ---- the waitlist forms (hero and end of the page): sent to Netlify Forms (the form's name and data-netlify attributes), no page reload ----
  (() => {
    const forms = [...document.querySelectorAll('form.wait')]; if (!forms.length) return;
    const DEFAULT = 'we will only write when easy quizy is ready';
    // on this computer there is no Netlify to receive the form: say so instead of failing
    const local = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname);
    const say = (form, text, error) => { const n = form.querySelector('.wait-note'); n.textContent = text; n.classList.toggle('error', !!error); };
    forms.forEach((form) => {
      const field = form.querySelector('.wait-email'), button = form.querySelector('button');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = field.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say(form, 'please check the email address', true); field.focus(); return; }
        if (local) { say(form, 'the waitlist works on the published site', true); return; }
        button.disabled = true; say(form, 'one moment…');
        try {
          const res = await fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
          if (!res.ok) throw new Error('status ' + res.status);
          forms.forEach((f) => { f.classList.add('sent'); say(f, 'thank you! you are on the list'); }); // once signed up, both forms say so
        } catch (err) { button.disabled = false; say(form, 'that did not work, please try again', true); }
      });
      field.addEventListener('input', () => { if (form.querySelector('.wait-note').classList.contains('error')) say(form, DEFAULT); });
    });
  })();
})();
