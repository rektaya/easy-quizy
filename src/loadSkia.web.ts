import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// Skia on the web needs its CanvasKit engine (public/canvaskit.wasm) loaded before the app starts.
export function loadSkia(): Promise<void> {
  return LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
}
