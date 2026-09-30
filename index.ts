import { registerRootComponent } from 'expo';
import { loadSkia } from './src/loadSkia';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
//
// The app is registered once Skia (the shaders on the Map) is ready: at once on the phone, after the
// CanvasKit engine has loaded on the web.
loadSkia().then(() => {
  registerRootComponent(require('./App').default);
});
