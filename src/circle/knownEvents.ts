// A tiny event channel: the Circle says "a word was just marked known, here is where its ring is on the
// screen" and the layer that draws the stardust (above the whole app) listens.
/** How long a known word's celebration lasts: the stardust leaves the screen and the glow of the ring fades with it. */
export const KNOWN_MS = 3600;

export type KnownPoint = { x: number; y: number; r: number };

const listeners = new Set<(p: KnownPoint) => void>();

export function emitKnown(p: KnownPoint) {
  listeners.forEach((f) => f(p));
}
export function onKnownWord(f: (p: KnownPoint) => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}
