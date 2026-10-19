# Handoff: where Easy Quizy stands

Written 2026-10-19, at the end of a long working session, for whoever (a new Claude chat, or the author) picks the
project up next. Read this first, then `SPEC.md` (what the app is and why), `COMPONENTS.md` (the UI rules, which are
binding) and `AGENTS.md` (Expo has changed: read the versioned docs before writing Expo code).

## 1. What this is, and who it is for

**Easy Quizy** (the welcome screen says "easy quizy words") is an iPhone app for learning German vocabulary. It is
built by one person, **Taya**, a UX designer (not a developer) who is at B1-B2 German and lacks vocabulary. She steers
by feel, in short opinionated notes, often with annotated screenshots, and tries every change on her own phone.

The idea in one paragraph: no level picker and no decks. You see one word in a circle and **draw a circle round it
with your finger to show how well you know it** (an almost empty ring = don't know, a full ring = know it for sure;
a small cross under the word = not at all). The app picks the next words to fit your level, schedules the ones you
want to learn with FSRS (spaced repetition), and shows your growing vocabulary as a **map of stars** (one star per
topic). Three tabs plus a profile: **Explore** (meet words), **Study** (learn them), **Map** (watch it grow), **Profile**.

## 2. How to work with her (read this before replying)

- **She is a designer, not a developer.** Explain technical things in plain language: what it costs, what she has to
  do. No jargon, no long surveys of options. Give a recommendation, not a menu.
- **Answer in the language she writes in** (she writes English or Russian; the app's text is English).
- **She sends numbered lists of changes**, often half in English. Do all of them, then report one line per item and
  say honestly what you did not check.
- **Always check visual changes yourself in the iOS Simulator** (see section 4) and say what you saw. Do not tell
  her to "go and test it on the phone": she already does that (this was a correction she gave once).
- **Ask before committing; never push** (there is no git remote, everything is local on her Mac). **Never start an EAS
  build or a TestFlight submit unless she says so.** She often says "commit but do not build yet".
- **Interface text rules** (also in `COMPONENTS.md`): all lowercase (German words keep their capitals), no full stop at
  the end of a short line, the typographic apostrophe `’`, one orange accent `#F75831` on deep navy `#0C1927`, Figtree.
- **UI rules that she enforces strictly:** going back is the chevron (never a "close" button); nothing pops, everything
  fades; the rating badge is always in the same place (there is no undo any more: the handle on the ring changes an answer); one way of doing a thing, not two; labels on the Map never
  overlap; reuse the existing patterns in `COMPONENTS.md`.
- **Do not put secrets in files or messages.** An old chat contains a password typed in plain text; it is not
  reproduced anywhere in the repo. Credentials (the App Store Connect API key) live on EAS, not here.
- Keep `SPEC.md` and `COMPONENTS.md` updated in the same change as the code (she expects it).

## 3. State of the project (2026-10-19)

- **Code:** branch `master`, last code commit `3c51484` (the documentation written on 2026-10-19 may sit in a later
  commit). No remote.
  `npm run typecheck` is clean and `npm test` passes (93 tests).
- **TestFlight:** **build 5** (version 1.0.0) is uploaded to App Store Connect and available to internal testers. It
  contains everything up to commit `4d8df4e`. It does **not** contain the last commit `3c51484` (one undo plate in
  one place, undo in the Study test, the first-word spacing, the Map on the shared starry background, the settings
  headline removed). **A new build (6) is waiting for her go.**
- **External testing:** the external group "easy quizy explorers" has a public link, but Apple must approve a build
  in a short Beta App Review before outsiders can join ("Testers cannot join public link until this group has an
  approved build"). Whether build 5 was submitted for that review was not confirmed. Drafts of the "What to test" and
  "Beta app description" texts were written in the chat (short, lowercase, plain); rewrite them if asked.
- **The simulator and the dev server were stopped** at the end of the session.

## 4. How to run, test and verify

```bash
npm install                  # also copies canvaskit.wasm into public/ (Skia on web)
npx expo start               # Metro on port 8081
npm run typecheck            # tsc --noEmit
npm test                     # node's test runner on src/**/*.test.ts (type stripping: imports end in .ts)
npm run build:words          # words.raw.txt -> src/data/words.generated.ts
```

**The iOS Simulator works** (Xcode 26.6, iOS 26.5 runtime, device "iPhone 17 Pro", id
`82F7C119-5B7C-4B22-B1BB-1ED671CFF287`; Expo Go is installed in it). To look at the app:
`xcrun simctl boot <id>; open -a Simulator; npx expo start`, then `xcrun simctl openurl booted exp://127.0.0.1:8081`.
Screenshots and taps go through the iOS-simulator control tool (coordinates are 402x874 points). Quirks:
- Expo Go draws a round blue **gear button** over the screen (it can cover a button; drag it away).
- Screenshots **lag one step behind** taps; take a second screenshot or wait a few seconds after a reload.
- Saving a file reloads the app and **resets the screen** (often back to Explore); the state in storage stays.
- To test the first run: Profile tab, scroll down, "start over", confirm.
- The Mac's Wi-Fi to the phone does not work, so the **phone** version of Expo Go needed the iPhone's Personal
  Hotspot; the simulator avoids all that. A tunnel (`expo start --tunnel`) is the other way round it.
- The Mac has limited disk space; a native build with Xcode (`expo run:ios`) was never needed.

## 5. Building and releasing (EAS, TestFlight)

- Expo account **rektaya**, project `easy-quizy`, bundle id `com.tayarekhova.easyquizy`, App Store Connect app id
  `6823929317` (set in `eas.json`, so EAS Submit needs no Apple login). `appVersionSource` is remote and the build
  number auto-increments (build 5 is the latest).
- The Apple Developer account belongs to a **friend (a friend), a personal account**. Taya has the **App Manager** role.
  The App Store Connect API key was created for EAS and is stored on EAS's servers. Certificates are managed by EAS.
- Build and send to TestFlight in one go: `npx eas-cli build --platform ios --profile production --non-interactive
  --auto-submit` (about 15-25 minutes, then Apple processes it for 5-10 minutes and sends an email).
  If it ever asks to log in to Apple, answer **n** (the stored key is used).
- The build prints "Detected that your app uses Expo Go for development". It is a harmless warning (set
  `EAS_BUILD_NO_EXPO_GO_WARNING=true` to silence it). Build 5 worked.
- Things never verified on a real phone since the first build: the daily reminder notification arriving, and the time
  picker. Everything else she has seen on her phone through Expo Go.
- `usesNonExemptEncryption` is false (standard encryption only), so Apple's export question answers itself.

## 6. Map of the code

```
App.tsx                      providers, tabs, the first-run path (phases), the progress bar
src/screens/                 Welcome, Name, ExploreWayStep, PaceStep, Intro, Practice, QuizIntro, CalibrationDone (first run);
                             ExploreScreen (ExploreView also runs the 15-word test); StudyTab (list + add + session);
                             WordsScreen (the list), AddWordScreen, StudyScreen (the test); MapScreen; ProfileScreen,
                             CreditsScreen
src/circle/                  the rating gesture: geometry.ts (pure maths, tested), useRing.ts (gesture + shared
                             values), StardustRing.tsx (Skia drawing), Circle.tsx
src/components/              see the table in COMPONENTS.md (RatingBadge, AdjustHint, ExploreTitle, DontKnowButton, StatusRing,
                             WordRow, CardPager, StarBackground, GlowShader, ...)
src/state/                   profile.tsx (name, phase, FSRS cards, answers, removed words, own words, explore
                             settings, interests, reminder), ratings.tsx (one rating per word); both saved with
                             AsyncStorage (keys easyquizy.profile.v1, easyquizy.ratings.v1)
src/onboarding/              feed.ts (which word next: association / theme / usefulness / free + filters),
                             calibration.ts, batch.ts (study sessions), status.ts, mapdata.ts, sky.ts (Map layout,
                             label placement, star spacing), camera.ts, tilt.ts, viewport.ts
src/audio/speak.ts            says a word aloud (expo-speech, German, the phone's voice)
src/srs/scheduler.ts         FSRS (ts-fsrs) wrapper: first card seeded from the Explore rating
src/data/                    words.core.ts (33 hand-written words), words.raw.txt -> words.generated.ts (1,441
                             words, GENERATED), words.rank.ts, words.extra.ts (GENERATED), words.verbs.ts (GENERATED: verb forms), themeLinks.ts (which
                             topics are neighbours, how hard each is), renamedWords.ts (old id -> new id),
                             words.ts (assembles everything, THEMES, own words, search)
src/notifications/           the daily reminder (a local notification set when the app goes to the background)
scripts/                     build-words.mjs, words/*.py (the word pipeline; see scripts/words/README.md)
docs/portfolio/              the iterations story and old screenshots, for her portfolio
```

**Data facts:** 1,474 words (33 hand-written + 1,441 generated), 24 topics (themes), each word has a
tier 1-6 (from a real frequency list), a rank, a part of speech, one example, and in `words.extra.ts` up to four "often
together with" words and two more examples (computed from Tatoeba by `scripts/words/extra_info.py`). The raw data
(`data-sources/`, about 230 MB of Tatoeba, Wiktionary extracts and the frequency list) is **not in git; it exists
only on her Mac**. Sources and licences are on the Credits screen (Wiktionary CC BY-SA, Tatoeba CC BY 2.0 FR,
FrequencyWords CC BY-SA 4.0).

**Words that changed id:** reflexive verbs now carry "sich" (`sich-ernaehren`, ...). `src/data/renamedWords.ts` maps
old ids to new ones and `ratings.tsx` / `profile.tsx` carry saved data across on load. If you ever rename a word id again,
add it there. Topic ids that were merged are handled by `currentTheme()` in `words.ts`.

## 7. The app today, screen by screen (details in SPEC.md)

1. **First run** (a thin band of stars on top as the progress bar): welcome (falling star) -> name -> "Name, here is how easy quizy
   works" (3 steps) -> how to explore (association / theme / usefulness / free) -> session size (10 / 20 / 40 words) ->
   practice word *Feierabend* (circle or the cross, then the handle must be used before "continue") -> "let us calibrate
   to your level" -> 15 adaptive test words (in Explore; the picks are random among equally good words) -> "got it, name"
   -> the tabs open on Study. (A three-second "calibrating" animation was tried and removed.)
2. **Explore:** endless feed, no limit. Title row: "explore" + selects on glass pills: **by association** (default) /
   theme / usefulness / free; the topic ("in travel") only when by theme; level (my level / easier / harder); kind of
   words (all words / nouns / verbs / adj & adv). Rate with the circle or the cross; swipe up for the next word; the
   badge ("added to study" / "marked as known") appears under the first line, and a handle on the ring changes the answer (it cannot be raised into "known"). Similar-word chips under the example.
3. **Study:** the list of words you are learning (status as a small circle: new, shaky, getting there, solid, learned;
   before the first study the circle follows how you rated it), sort / search / **+ add your own word** (with a check
   against our list, part of speech, topic, how well you know it). Tap a word for its card (swipe up/down). The "study"
   button starts a session that looks like Explore; there is no badge in the test; the handle on the ring changes the answer (the review is redone with the new value).
4. **Map:** a sky of 24 topic stars, joined by threads **only between topics you have explored**; untouched topics are
   identical dim discs; names never overlap; tap a star (or pinch in) to open it as a sphere of dots, then "see words" /
   tap the sphere for a page with the topic's words (explored first); "explore from here" jumps to Explore by theme.
   Camera mode (turn the phone) and tilt parallax work only on a phone.
5. **Profile:** name, three numbers, words per session (10 / 20 / 40), daily reminder (switch, time, "save"), credits, and
   "start over" (a testing aid; **remove before a public release**, together with the hidden long-press on the "map"
   title that does the same).

## 8. Decisions that are not obvious from the code

- **The rating is shown by brightness, not by colour.** A red-to-green arc was built first and dropped. The ring is
  invisible until you draw it; stars appear along your finger. A cross (don't know) draws a deep-blue ring by itself.
- **The Map has no small stars of its own** any more; every tab sits on the same starry paper, which fills with one star
  per rated word.
- **Topics:** five small hand-written topics were folded into the big generated ones (work -> work and business,
  getting around -> travel, kitchen -> food and drink, home -> house and furniture, decisions and feelings -> ideas and
  plans / feelings and character / time and calendar).
- **Interests are no longer asked** (the step was replaced on 2026-10-19 by "how would you want to explore new
  words?"). The field `interests` and the preference in `feed.ts` stay (people who chose some keep them), but nothing
  sets them now: delete them if the idea is dropped for good.
- **Two answers per word (since 2026-10-19, not in build 5 or 6):** the first, drawn before the meaning is seen (`confidence`), and the one after it was changed with the handle (`value`, what the app uses). Undo is gone. Explore: `ratings[id].confidence`; Study: `reviewLog` in the profile. Idea behind it: the first answer is "how sure was I", the second "was I right", so overconfidence can be measured later. The badge replaces the undo plate; where the Explore selects wrap to a second line, the badge covers them (accepted for consistency).
- **Things tried and removed for good:** the red-to-green arc, fireworks, a pale light fill that hid the word, comet and
  liquid circle looks, a visible ring at the start, a Study dashboard with a donut, the filter funnel icon, the compass
  icon, the interests row in settings.
- **Reflexive verbs** always carry "sich" (20 of them), with a reflexive example sentence.

## 9. Open items and ideas (none is started)

- **Release prep:** a **privacy policy** text (offered, not requested); the **credits licence sentence** (the word list
  is shared under the same share-alike terms) needs her or a lawyer's check; **remove "start over"** and the hidden
  map-title gesture; Beta App Review for the public link; "What to test" text for build 6.
- **Postponed on purpose:** a **widget** (needs a native build and a call with a friend about his account), **Storybook**
  (maybe web only, later), **Reduce Motion** support for the newer animations.
- **Product ideas:** what to do with the unused interests in `feed.ts`; a better "known word" moment (testers did not read the first
  one; stardust rising from the ring is the current answer, not yet re-tested); spot-checks of known words; a recorded voice (the phone's voice is built);
  word-family clusters on the Map; accounts and sync (none, everything is on the device); a proper identity pass.
- **Content:** more reflexive-style fixes if she finds more (borderline: treffen, merken, ansehen); more example
  sentences; a licence check of every source before release.
- **Known rough edges:** the long topic name "family and relationships" is cut to "family and rel..." when two selects
  share a line; Explore's title area can take two lines; `SPEC.md` section 12b is a historical snapshot (2026-09-30)
  and is out of date, trust this file and the rest of `SPEC.md` instead.

## 10. Where to look for what

| Question | File |
|---|---|
| What is the product, why, how does each part behave? | `SPEC.md` |
| Which component or pattern do I reuse? | `COMPONENTS.md` |
| How was the word list made? | `scripts/words/README.md` |
| How did the app evolve, with dates, reasons and screenshots? | `docs/portfolio/ITERATIONS.md` |
| What changed in each step? | `git log` (with long messages) |
