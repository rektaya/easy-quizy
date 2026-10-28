# Easy Quizy

An iPhone app for learning German vocabulary. No level picker, no decks: you see one word in a circle, **draw a circle round it with your finger to show how well
you know it**, and the app picks the next words to fit your level. The words you want to learn come back at the right time (spaced repetition, FSRS), and what
you have learned grows as a **map of stars**, one star per topic.

Landing page: <https://easyquizywords.netlify.app> (its source is in `landing/`).

Built with Expo / React Native (TypeScript), Skia for the circle and the map, Reanimated and Gesture Handler for the gestures. Everything is stored on the
device; there is no backend and no account. Made by one person (rektaya), a UX designer learning German.

## Run it

```bash
npm install            # also copies canvaskit.wasm into public/ (Skia on the web)
npx expo start         # then press i for the iOS simulator, or w for the web
npm run typecheck
npm test
npm run build:words    # words.raw.txt -> src/data/words.generated.ts
```

## The font is not in the repository

The app uses **Satoshi** (Regular and Medium). Its licence (ITF Free Font License) does not allow passing the font files on, so they are not here and the app
will not bundle without them. Download Satoshi from [Fontshare](https://www.fontshare.com/fonts/satoshi) and put these two files in `assets/fonts/satoshi/`:

```
assets/fonts/satoshi/Satoshi-Regular.ttf
assets/fonts/satoshi/Satoshi-Medium.ttf
```

For the landing page (`landing/`), take the two official WOFF2 files of the same fonts from Fontshare and put them in `landing/fonts/`
(`Satoshi-Regular.woff2`, `Satoshi-Medium.woff2`). `.easignore` makes sure EAS builds still include the fonts from your computer.

## Where things are

| | |
|---|---|
| `SPEC.md` | what the product is and how every part behaves |
| `COMPONENTS.md` | the UI patterns and rules |
| `HANDOFF.md` | the state of the project, how to build and release, how the author works |
| `scripts/words/README.md` | how the word list is made |
| `docs/portfolio/ITERATIONS.md` | the history of the design, with reasons |
| `landing/` | the landing page (plain HTML/CSS/JS), published on Netlify |

## Licences

- **Code:** MIT, see `LICENSE`.
- **Word list:** CC BY-SA 4.0 with credit to Wiktionary, Tatoeba and FrequencyWords, see `DATA-LICENSE.md`.
- **Font (Satoshi):** not included, see above.
