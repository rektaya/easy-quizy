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
- **Ask before committing and before pushing** (since 2026-10-28 there is a **private** GitHub repository, `git@github.com:rektaya/easy-quizy.git`, remote `origin`; she asked for it and `gh` is signed in as rektaya; before 2026-10-28 everything was local only). **Never start an EAS
  build or a TestFlight submit unless she says so.** She often says "commit but do not build yet".
- **Interface text rules** (also in `COMPONENTS.md`): all lowercase (German words keep their capitals), no full stop at
  the end of a short line, the typographic apostrophe `’`, one orange accent `#F75831` on deep navy `#0C1927`, Satoshi at -1% letter-spacing.
- **UI rules that she enforces strictly:** going back is the chevron (never a "close" button); nothing pops, everything
  fades; the rating badge is always in the same place (there is no undo any more: the handle on the ring changes an answer); one way of doing a thing, not two; labels on the Map never
  overlap; reuse the existing patterns in `COMPONENTS.md`.
- **Do not put secrets in files or messages.** An old chat contains a password typed in plain text; it is not
  reproduced anywhere in the repo. Credentials (the App Store Connect API key) live on EAS, not here.
- Keep `SPEC.md` and `COMPONENTS.md` updated in the same change as the code (she expects it).

## 3. State of the project (2026-10-20)

- **Code:** branch `master`, last commit is in `git log -1`; remote `origin` = the private GitHub repo `rektaya/easy-quizy` (pushed 2026-10-28, `master` tracks `origin/master`).
  `npm run typecheck` is clean and `npm test` passes (106 tests).
- **TestFlight builds 8 and 9 (2026-10-21):** build 9 (EAS `f083f15f`, commit `7dde4ff`) has the whole design-system tidy-up, the new app icon and the menu fix. Build 8 (`bc684ef1`, commit `87ebcc7`) was started by mistake (a build command that looked rejected had run) and is the same without the menu fix: ignore it. Android APK versionCode 3 (EAS `1e249bf3`, same commit as build 9, new icon); the first APK (versionCode 2, `9a474384`) has the old icon and the old design.
- **TestFlight, build 7 (2026-10-20):** built from commit `f32708e` (EAS build `3ac05935`, started 2026-10-20, sent to TestFlight automatically). On top of build 6 it has the week-of-stars card in Profile
  (replaces the streak card), the redesigned word card (status top left, cross top right, chips for "often together with"
  that open the Map, topic last), the Profile scroll fix, the keyboard fixes in the add-word form, the handle/swipe fix,
  and the onboarding text changes, and pressing the tab you are on takes you back to its first level. Not yet checked on a real phone: audio, verb forms, the daily reminder (Taya thinks it
  did not arrive in build 6: see the reasons in the chat of 2026-10-20: it is only set when something is ready, after "save", and
  it stays quiet while the app is open).
- **TestFlight, build 6** (version 1.0.0, built 2026-10-19 from commit `98dcb70`) was uploaded to App Store Connect
  (EAS build `c857722a`); Apple processes it for 5-10 minutes and sends an email. It has everything of the 2026-10-19
  session: the handle on the ring, words per session, the new first run, rank-based calibration, verb forms, audio
  (expo-speech, new in this build: not yet heard on a real phone), the streak card (build 6 only: replaced after by the week card), the note field. Builds 1-5 are older.
- **External testing:** the external group "easy quizy explorers" has a public link, but Apple must approve a build
  in a short Beta App Review before outsiders can join ("Testers cannot join public link until this group has an
  approved build"). Whether any build was submitted for that review was not confirmed. Drafts of the "What to test" and
  "Beta app description" texts were written in the chat (short, lowercase, plain); rewrite them if asked.
- **The simulator and the dev server were stopped** at the end of the session.

**The GitHub repository must stay PRIVATE (decided 2026-10-28).** Reasons, all still open: (1) the Satoshi font files are in the git history since commit
`16de369` (and in `assets/fonts/`, `landing/fonts/`), and the ITF Free Font License forbids passing the files to other people: a public repo, or inviting
anyone, would do exactly that; to go public the font must first be removed from the whole history (rewrite it or start from a clean snapshot) and
Satoshi loaded some other allowed way. (2) `LICENSE` is still the Expo template's MIT text, not hers. (3) the word list is built from Wiktionary (CC BY-SA 4.0)
and Tatoeba (CC BY 2.0 FR): a public repo needs the right attribution and a share-alike licence for the data, to be checked. (4) this file names a friend and his
Apple account. No passwords or keys were ever committed (history scanned 2026-10-28); `*.apk` builds and `landing-publish/` are git-ignored.

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
  number auto-increments (build 9 is the latest).
- The Apple Developer account belongs to a **friend (a friend), a personal account**. Taya has the **App Manager** role.
  The App Store Connect API key was created for EAS and is stored on EAS's servers. Certificates are managed by EAS.
- Build and send to TestFlight in one go: `npx eas-cli build --platform ios --profile production --non-interactive
  --auto-submit` (about 15-25 minutes, then Apple processes it for 5-10 minutes and sends an email).
  If it ever asks to log in to Apple, answer **n** (the stored key is used).
- **Design system tidy-up (2026-10-21, after build 7, not in any build yet):** one star palette in `theme.ts` (`stars`: deep, blue, ice, cream, gold, ember), the unused red-to-green ring colours removed, ten font sizes (12 13 15 16 18 22 24 28 32 36), gaps 2 4 6 8 12 16 24, four corner radii, and `src/scale.test.ts` keeps the scales. Repeated patterns became components: `Card`, `Plate`, `Menu`/`MenuItem`, `Choice`/`Pill`, `PageHeader`, `CircleAction` (`WordChip` is now `Pill`). A chosen option is filled orange everywhere (the "how well do you know it" items in add word and the explore-way rows changed the most: **look at them on the phone**); a menu marks its current item with a dot. Paddings and margins were not put on a scale.
- **Type (2026-10-22, not in any build yet):** the app now uses **Satoshi** everywhere (Regular and Medium, `assets/fonts/satoshi/`, loaded by `src/useAppFonts.ts`) instead of Figtree, with **letter-spacing -1%**, which `components/Text.tsx` adds to every `Text`/`TextInput` (see COMPONENTS.md; a test keeps screens from importing them from react-native). Taya tried nine fonts with a temporary picker in Profile and rated them (out of 10): satoshi 10 (but close to figtree), cabinet grotesk 6, clash grotesk 6 (too square, bad small), work sans 6, plus jakarta sans 5, pally 2, alpino 1, asap 0, public sans 0; she also tried Century Schoolbook (her own copy) and TeX Gyre Schola (its free look-alike). **Then she chose Satoshi for now and removed all the others and the picker** (it is in git history if wanted again). Her idea, still open: a decorative font for headlines and big text (clash or cabinet grotesk) with Satoshi, figtree or work sans for small and important text; `fonts.display` exists so that is one file in `useAppFonts.ts` away. Satoshi's license (ITF Free Font License, text in `assets/fonts/satoshi/FFL.txt`) allows it in an app but forbids editing, subsetting or converting the files and handing them to anyone else: **never put `assets/fonts/` in a public repo** (there is no remote today). The Credits screen names Satoshi. Production builds carry only the two Satoshi files.
- **Pilot of 839 new words (2026-10-22, not committed):** `scripts/words/pilot_pick.py` picks lemmas from the frequency list (with checks for pronominal adverbs, bad glosses, participles, same-spelling words, reflexive verbs skipped) into `data-sources/pilot.json`; `data-sources/pilot_themes.txt` assigns each a theme; `pilot_compose.py` adds them to `words.raw.txt`. Claude then read all 839 (main example, meaning, plural, article, not the generated extras) and recorded 401 fixes in `scripts/words/review_patch_pilot.txt` (applied with `apply_review.py --patch review_patch_pilot.txt --apply`, also supports an `article` field). **354 of 839 words (42%) needed at least one fix** (230 main examples replaced, 168 meanings reworded, 18 plurals, 2 articles, 2 removed): worse than the old list (27%). The generated extras of the new words were read afterwards (all 837 words, German sentences only, not the English): ~230 more sentences went into `bad_sentences.txt` (names, idioms, wrong-word, sad or religious sentences) and `extra_info.py` now (a) drops a sentence for a word when its matching form is a Wiktionary word of its own (*schade* ≠ *schaden*; fetches ~7,000 forms, cached), (b) needs 7 shared sentences for a partner (was 5), (c) skips company names and the core examples. Total now 2,311 words. Reflexive verbs (76 candidates) and the proper-name glosses were left out.
- **Word review (2026-10-22):** all 1,474 words were read, topic by topic, by Claude. About one word in four had something wrong: examples about a different word with the same spelling (*Wolle* = the verb *wollen*, *Reis* = *Reise*, *Kissen* = *Küssen*), cut-off or wrong meanings, names in examples, idioms, sad sentences, wrong plurals, wrong tiers. **399 changes were proposed in `docs/word-review/proposals.md`** (source: `scripts/words/review_patch.txt`, applied by `scripts/words/apply_review.py --groups A,B --apply`); Taya approved all groups but I (the 6 removals: Gym, Baseballspiel, Grabstein, Zement, garen, Rekordhalter, still open) and they were applied and rebuilt on 2026-10-22 (not committed yet). After changing tiers run `scripts/words/sort_themes.py` (the related-words ladder needs the words of a theme in tier order). `rank_overrides.txt` holds the hand-set ranks of the words whose spelling is shared with a more common word. Already fixed in `extra_info.py` (the generated extras): possessive forms (meine/meinen) and particles (mal, gar, halt) no longer count for verbs, generic partners (haben, sein, können...) are dropped, names, vulgar/sad/violent sentences, cut-off translations and near-copies of the main example are skipped, `extras_blocklist.txt` blocks homograph words per id, `bad_sentences.txt` blocks single sentences. Ranks are the position of the word's own spelling in the frequency list, so a word that shares its spelling with another (*Wolle*, *Sage*, *Würde*, *Leid*, *Glaube*) looks far more common than it is: tiers E-group fixes it by hand. Before adding more words (the 10,000-word idea), run the same kind of check on every new batch: about 25% of the machine-picked words need a human or Claude pass. Still open: the app has only Monday, Sunday, January, December (add the rest or remove these four), and 49 words have no frequency rank.
- **App icon (changed 2026-10-21):** an orange four-pointed star with three small tan stars on navy. `assets/icon-source.png` is Taya's original (rounded corners,
  transparent corners); `assets/icon.png` is the same picture as an opaque full-bleed square (the App Store refuses transparency and the phone rounds the
  corners itself); `assets/android-icon-foreground.png` is the shapes alone on transparency, 84% size, over the navy `#0D1C2C` (Android crops the icon to a circle or
  squircle); `assets/favicon.png` is 48 px for the web. The new icon is in TestFlight build 9 and in the Android APK versionCode 3 (build 7 and the first APK have the old one).
- **Android (since 2026-10-21):** a file friends install themselves, no store. `npx eas-cli build --platform android --profile android-apk --non-interactive --no-wait`
  builds an `.apk` (profile `android-apk` in `eas.json`, package `com.tayarekhova.easyquizy`, icon = the orange four-pointed star on navy, see `assets/icon.png`). The first build is
  `9a474384`. The build page on expo.dev gives the install link / file to send. Friends must allow "install from unknown sources" and may see a
  Play Protect warning. Every new version is a new build and a new link (installs over the old one, data stays: EAS keeps one keystore).
  **Never run on an Android phone yet**: unchecked are the time picker of the reminder (a dialog on Android), keyboard in the add-word form,
  the German voice (depends on the phone), the notification permission on Android 13+.
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
landing/                     the landing page (plain HTML/CSS/JS, no build; from her Figma draft "easy-quizy-3.0", node 5:502).
                             One gradient frame: the hero (a flipping german word, 20 words from the app's list, a waitlist form), a ring of
                             stars that draws itself round "Feierabend" as you scroll, a bento grid of frosted feature cards, three phones with
                             real screens (img/screen-*.webp: since 2026-10-28 real iPhone screenshots taken by her, 923x2000, they carry the phone's own status bar so the page draws no status bar or island; the earlier ones came from the web build with sample data: capture/seed-profile.mjs, which is still there), and the
                             waitlist form again. Preview: `python3 -m http.server 4173` in the project root, then /landing/ (also the "landing"
                             entry in .claude/launch.json).
                             LIVE: https://easyquizywords.netlify.app (Netlify project easyquizywords in "taya's team", site id f27bead4-9533-42a5-add7-2010b847838c, first dragged
                             in by her and updated by Claude with the command below on 2026-10-28; Netlify keeps every deploy, so a bad one can be rolled back in the
                             Deploys tab). To update: `sh landing/make-publish-folder.sh`, then
                             `npx netlify-cli deploy --prod --dir landing-publish --site f27bead4-9533-42a5-add7-2010b847838c` (her Netlify login is already
                             saved on this Mac). Form detection was off for this site (ignore_html_forms) and was turned on through the API on 2026-10-28.
                             PUBLISHING (Netlify, 2026-10-28): `sh landing/make-publish-folder.sh` builds ../landing-publish (only what the site
                             needs, 296 KB); drag that folder onto https://app.netlify.com/drop. The two forms use Netlify Forms (name + data-netlify in
                             the HTML, honeypot field "company"); the emails appear in Netlify under Forms > waitlist-hero / waitlist-end (they work only
                             on the published site; on this computer the form says so). Fonts: the two official unmodified Satoshi WOFF2 files in
                             landing/fonts (ITF Free Font License v2.0 allows self-hosting on her own website, forbids changing, subsetting or converting
                             the files, and forbids passing them on: so landing/fonts and assets/fonts must never go into a public repo).
                             landing/privacy.html (written 2026-10-28, linked under both forms) names "Taya" and rektaya@gmail.com as the contact (she chose this;
                             a full name is better legally). Her choices there (kept 'until the app is released or until she asks', Netlify as the only
                             processor) should be read by her, ideally by a lawyer; if the emails ever go to a mailing service, the text must change.
                             Still open: a share image (og:image), a custom domain.
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
- **Two answers per word (since 2026-10-19, in build 6):** the first, drawn before the meaning is seen (`confidence`), and the one after it was changed with the handle (`value`, what the app uses). Undo is gone. Explore: `ratings[id].confidence`; Study: `reviewLog` in the profile. Idea behind it: the first answer is "how sure was I", the second "was I right", so overconfidence can be measured later. The badge replaces the undo plate; where the Explore selects wrap to a second line, the badge covers them (accepted for consistency).
- **Things tried and removed for good:** the red-to-green arc, fireworks, a pale light fill that hid the word, comet and
  liquid circle looks, a visible ring at the start, a Study dashboard with a donut, the filter funnel icon, the compass
  icon, the interests row in settings.
- **Reflexive verbs** always carry "sich" (20 of them), with a reflexive example sentence.

## 9. Open items and ideas (none is started)

- **Release prep:** a **privacy policy** text (offered, not requested); the **credits licence sentence** (the word list
  is shared under the same share-alike terms) needs her or a lawyer's check; **remove "start over"** and the hidden
  map-title gesture; Beta App Review for the public link; "What to test" text for build 6 (what is new: the handle on the ring, audio, verb forms, the week of study).
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
