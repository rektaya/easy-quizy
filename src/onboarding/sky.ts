// The Map's night sky. Every theme is one big star, spread evenly over a sky of small ones; a
// theme's cluster of word-points only appears when you zoom in on its star. Everything is drawn
// from a seeded random source, so the sky is the same every time it opens.

export type SkyPoint = { x: number; y: number; r: number };

export type SkyCluster = {
  id: string;
  /** Where the theme's big star sits, in the stage's pixels. */
  cx: number;
  cy: number;
  /** Core radius of the big star: bigger for a theme with more words. */
  heroR: number;
  /** Tilt of the cluster when it is opened up, and how wide it spreads (about 0.85 to 1.15). */
  angle: number;
  spread: number;
  seed: number;
};

/** A small, fast seeded random source (mulberry32). */
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * n points scattered in a tilted ellipse (denser towards the middle, ragged at the edge), sorted
 * from the centre outwards. `size` is the range of the points' core radius.
 */
export function blob(
  seed: number,
  n: number,
  rx: number,
  ry: number,
  angle: number,
  size: [number, number],
): SkyPoint[] {
  const rnd = random(seed);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const points = Array.from({ length: n }, () => {
    const a = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.7); // more points near the middle than at the rim
    const ex = Math.cos(a) * rx * d;
    const ey = Math.sin(a) * ry * d;
    return { x: ex * cos - ey * sin, y: ex * sin + ey * cos, r: size[0] + rnd() * (size[1] - size[0]) };
  });
  return points.sort((p, q) => Math.hypot(p.x, p.y) - Math.hypot(q.x, q.y));
}

/** Core radius of a theme's big star: a bigger theme is a bigger star, but not by much. */
export function heroSize(words: number): number {
  return Math.min(10, 3.4 + 0.7 * Math.sqrt(words));
}

const COLS = 5;
/** The range of the points' core radius when a cluster is opened up. */
export const WORD_POINT_SIZE: [number, number] = [3.4, 8];

/**
 * Place every theme's big star. They sit on a jittered grid, which reads as an even scatter (no
 * two close together, none in a clump), not as a table.
 */
export function layoutSky(
  items: { id: string; words: number }[],
  w: number,
  h: number,
  links: { a: number; b: number; weight: number }[] = [],
  /** Makes the sky one of a kind: a different seed gives a different arrangement of the themes. */
  seed = 0,
): SkyCluster[] {
  const rows = Math.ceil(items.length / COLS);
  const cellW = w / COLS;
  const cellH = h / rows;
  // which theme starts in which cell of the grid depends on the seed (seed 0 keeps the order)
  const cells = seed ? shuffled(items.map((_, i) => i), seed) : items.map((_, i) => i);
  const start = items.map((_, i) => {
    const rnd = random(1000 + i * 7919 + seed * 31);
    const cell = cells[i];
    return {
      x: ((cell % COLS) + 0.5) * cellW + (rnd() - 0.5) * cellW * 0.6,
      y: (Math.floor(cell / COLS) + 0.5) * cellH + (rnd() - 0.5) * cellH * 0.6,
    };
  });
  const placed = links.length ? relax(start, links, w, h) : start;
  return items.map((item, i) => {
    const rnd = random(1000 + i * 7919 + seed * 31);
    rnd();
    rnd();
    return {
      id: item.id,
      cx: placed[i].x,
      cy: placed[i].y,
      heroR: heroSize(item.words),
      angle: (rnd() - 0.5) * (Math.PI * 0.7),
      spread: 0.85 + rnd() * 0.3,
      seed: 5000 + i * 104729 + seed,
    };
  });
}

/**
 * Pull linked stars together and push every pair apart (a small Fruchterman-Reingold pass that
 * starts from the even scatter), so that linked themes sit near each other but the sky stays
 * evenly filled and inside its edges.
 */
const REPEL = 0.3;
const GRAVITY = 0.12;

export function relax(
  start: { x: number; y: number }[],
  links: { a: number; b: number; weight: number }[],
  w: number,
  h: number,
): { x: number; y: number }[] {
  const n = start.length;
  const pos = start.map((p) => ({ ...p }));
  const k = Math.sqrt((w * h) / n); // the ideal gap between neighbours
  const margin = Math.min(w, h) * 0.06;
  let heat = k * 0.5;
  for (let it = 0; it < 180; it++) {
    const move = pos.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        let d = Math.hypot(dx, dy);
        if (d < 0.01) {
          dx = 0.01;
          dy = 0.01;
          d = 0.0141;
        }
        const f = (REPEL * k * k) / d / d; // repulsion, as a share of the offset
        move[i].x += dx * f;
        move[i].y += dy * f;
        move[j].x -= dx * f;
        move[j].y -= dy * f;
      }
    }
    for (const l of links) {
      const dx = pos[l.a].x - pos[l.b].x;
      const dy = pos[l.a].y - pos[l.b].y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d / k) * (1 + 0.25 * Math.min(l.weight, 4)); // attraction
      move[l.a].x -= dx * f;
      move[l.a].y -= dy * f;
      move[l.b].x += dx * f;
      move[l.b].y += dy * f;
    }
    for (let i = 0; i < n; i++) {
      // a light pull to the middle keeps the stars from piling up against the edges
      move[i].x += (w / 2 - pos[i].x) * GRAVITY;
      move[i].y += (h / 2 - pos[i].y) * GRAVITY;
      const m = Math.hypot(move[i].x, move[i].y) || 1;
      const s = Math.min(m, heat) / m;
      pos[i].x = Math.min(w - margin, Math.max(margin, pos[i].x + move[i].x * s));
      pos[i].y = Math.min(h - margin, Math.max(margin, pos[i].y + move[i].y * s));
    }
    heat *= 0.97;
  }
  return pos;
}

/**
 * The small stars of the sky, spread evenly: one per cell of a fine grid (most cells), at a random
 * spot in the cell, so there are no clumps and no gaps. Stars too near a big star are left out.
 */
export function ambientStars(
  w: number,
  h: number,
  avoid: { x: number; y: number }[] = [],
  cell = 22,
  /** A different seed scatters the stars differently (0 is the default sky). */
  seed = 0,
): (SkyPoint & { o: number })[] {
  const rnd = random(42 + seed);
  const stars: (SkyPoint & { o: number })[] = [];
  for (let gy = 0; gy < Math.ceil(h / cell); gy++) {
    for (let gx = 0; gx < Math.ceil(w / cell); gx++) {
      const s = {
        x: (gx + rnd()) * cell,
        y: (gy + rnd()) * cell,
        r: 0.5 + rnd() * 1.1,
        o: 0.25 + rnd() * 0.5,
      };
      if (rnd() < 0.3) continue; // leave some cells empty, so it is not a grid
      if (s.x > w || s.y > h) continue;
      if (avoid.some((a) => Math.hypot(a.x - s.x, a.y - s.y) < 18)) continue;
      stars.push(s);
    }
  }
  return stars;
}

/** The same items in a repeatable, scrambled order (a seeded Fisher-Yates shuffle). */
export function shuffled<T>(items: T[], seed: number): T[] {
  const rnd = random(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
