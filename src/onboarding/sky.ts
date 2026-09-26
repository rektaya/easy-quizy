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
  return Math.min(7, 2.4 + 0.5 * Math.sqrt(words));
}

const COLS = 5;
/** The range of the points' core radius when a cluster is opened up. */
export const WORD_POINT_SIZE: [number, number] = [3.4, 8];

/**
 * Place every theme's big star. They sit on a jittered grid, which reads as an even scatter (no
 * two close together, none in a clump), not as a table.
 */
export function layoutSky(items: { id: string; words: number }[], w: number, h: number): SkyCluster[] {
  const rows = Math.ceil(items.length / COLS);
  const cellW = w / COLS;
  const cellH = h / rows;
  return items.map((item, i) => {
    const rnd = random(1000 + i * 7919);
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      id: item.id,
      cx: (col + 0.5) * cellW + (rnd() - 0.5) * cellW * 0.6,
      cy: (row + 0.5) * cellH + (rnd() - 0.5) * cellH * 0.6,
      heroR: heroSize(item.words),
      angle: (rnd() - 0.5) * (Math.PI * 0.7),
      spread: 0.85 + rnd() * 0.3,
      seed: 5000 + i * 104729,
    };
  });
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
): (SkyPoint & { o: number })[] {
  const rnd = random(42);
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
