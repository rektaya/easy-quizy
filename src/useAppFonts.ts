import { useFonts } from 'expo-font';
import { fonts } from './theme';

// Loads the app's type, Satoshi (Indian Type Foundry, from Fontshare), under the names in theme.ts. Nothing else in the app
// names a typeface. The files are used as downloaded: its license forbids editing, subsetting or converting them, and giving
// them to anyone else (so never put assets/fonts in a public repo). Regular and Medium are all the app uses.
// `true` once the fonts are ready.
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.regular]: require('../assets/fonts/satoshi/Satoshi-Regular.ttf'),
    [fonts.medium]: require('../assets/fonts/satoshi/Satoshi-Medium.ttf'),
    [fonts.display]: require('../assets/fonts/satoshi/Satoshi-Medium.ttf'), // headlines and big text; give it its own file to set them in another typeface
  });
  return loaded || !!error; // if a font cannot load, show the app in the system font rather than nothing
}
