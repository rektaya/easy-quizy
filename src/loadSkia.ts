// On the phone Skia is ready at once, so there is nothing to wait for. The web version of this
// file (loadSkia.web.ts) loads the CanvasKit engine first.
export function loadSkia(): Promise<void> {
  return Promise.resolve();
}
