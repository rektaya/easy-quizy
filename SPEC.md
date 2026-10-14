# Product Spec v0.4: Easy Quizy

A vocabulary app for German learners.

## 1. Context

**Problem.** The author is at B1-B2 German. The bottleneck is vocabulary: it blocks speaking, writing and understanding people. Vocabulary is the fastest lever, and cognitive science says how to pull it: active recall and spaced repetition (the Anki approach).

**Why not just Anki.** Anki asks you to choose a deck and a level up front, and it feels like admin. Easy Quizy has no level picker and no deck. You start with one word, words appear by association, and the app works out where your knowledge ends.

**Scope for v1.** A personal tool for the author, German only, English as the bridge language, iOS first. It should be possible to hand to Android-using friends later without a rewrite.

## 2. Principles

1. **One gesture everywhere.** The Circle is used to rate a word in Explore and in Study.
2. **Minimal setup.** No level, no deck. The app asks for a name once and learns the rest from the first fifteen words (adaptive calibration, section 8), goes straight into learning them, then keeps every word at the right difficulty.
3. **Recall over recognition.** You commit to an answer before you see it.
4. **Never overwhelm.** New words wait in a pile and enter Study in small batches.
5. **Words in context, but concise.** Gender (through the article), plural, an example sentence and audio belong to the word, but the reveal must be concise and easy to take in at a glance. The user decides what the reveal shows (see Settings).

## 3. The Circle (core interaction)

- One word sits in a circle in the center of the screen. Nouns always show their article: **das Haus**. The article already conveys gender, so there is **no separate gender color-coding**.
- **There is no visible ring.** The user draws a circle round the word with a finger, and the app tracks it along an invisible ring (the drawing may start anywhere round the word: on the word, on the ring, or a little outside it; only the exact centre does not count. Usability tests showed people could not find an invisible ring). It can be drawn **either way round**, clockwise or counter-clockwise; a full circle means coming back to where you started. The app tracks how far the finger has turned around the circle's centre, so it works from any starting point.
- **Stardust.** Stars appear where the finger goes (up to 210 of them along the circle), each settling in from slightly outside and then drifting and twinkling in its own way, with a soft glow at the finger. **The colour does not go from red to green; the rating shows as how much the stars shine**, in clear steps that match the hidden segments: "don't know" is a few small but clear **blue** stars with a soft blue glow; "hard" a little bigger and brighter, an icy blue-white; "good" warm cream with an orange glow; "know" large golden-white stars in a strong orange-gold glow. The user rates by feel, not by picking a named level.
- **When the finger lets go early**, the ring carries on by itself to the end (about 1.5 s), in the same colour and brightness the finger stopped at: the rating is carried by how bright the stars are, not by whether the ring is complete.
- **Hidden segments.** The user never sees them, but the arc is divided into four:

| Segment | Share of the arc | Meaning in Explore | Grade in Study |
|---|---|---|---|
| 1 | first 30% | don't know it | Again |
| 2 | next 30% | vaguely familiar | Hard |
| 3 | next 30% | know it, still want to study | Good |
| 4 ("know") | last 10% | know it for sure | Easy |

- **Haptic ticks between the sections.** A light tick as the arc crosses from one hidden section into the next (at 30% and at 60%), and a firmer tick with the visual snap to a full ring when it enters the last 10% ("know") section. Ticks fire when drawing back across a boundary too, with a small buffer so a finger resting on a boundary does not buzz. Only the last section snaps visually, and there is **no visual hint** for any of the sections.
- **A plain tap (no drag) does nothing.**
- **What the rating does in Explore:**
  - In the "know" segment: the word is treated as known and is not added to the pile (silent spot-checks later).
  - In any other segment: the word goes to the pile, and the exact continuous value is kept for scheduling.
- **Discoverability:** the gesture is taught on a screen of its own before the test (see section 8): the first word, *Feierabend*, with a ghost finger, the line "draw a circle around the word to show how well you know it, from not knowing at all to knowing it well", and after the first drawing a "great job" note with captions on the small things (undo, flipping the word). Nowhere else is the drawing explained.
- **Undo:** the "undo" in the status pill inside the circle, for a few seconds after each draw (mirrors Anki's undo).
- **Moving on (two ways, one motion):**
  - **Tap any similar word** below the circle to go to it. Words you have already rated are not shown as chips.
  - **Swipe up** to keep going: it follows the current word's associations first (the first unrated related word), then falls back to the trail order.
  - Both use the same motion: the word glides up and away, and the next one rises in from below and grows into place. Weak or short swipes spring back. There is no "next" button.
- **Layout.** The circle sits a little above the middle of the screen so the example sentence and similar words have room below it.
- **Flip the word.** After rating, tap anywhere inside the circle (the tap area is round, like the circle) to see the original German word again (with its article, exactly as before rating), and tap again to get the translation back. It resets to the translation on every new word.
- **Status plate.** After you rate a word, a small plate appears **at the top of the screen**, under the header ("added to study" or "marked as known", and an orange **undo** beside it). It fades away after a few seconds (on the practice screen it stays until you continue). Tapping the translation in the circle flips it to the German word and back (also in Study).
- **A known word glows and sends stardust up.** Marking a word as known makes the ring flare and glow orange-gold all round while a crowd of small stars (about 170, in waves) comes loose from the ring and drifts up like fireflies, steadily, out of the top of the screen (about 3.6 s). When the last star has left, the glow fades and the ring is simply a full golden ring, which it stays for as long as the word is shown. (This replaces the old star and wave of light across the screen, which testers did not read as "a star lit up".) It is drawn on a layer above the whole app, only while the stardust is on its way.
- **Tips.** Only one is left: on the first three words of the test a small, quiet "swipe up for the next word" shows after rating.
- **In Study,** typed answers are auto-graded. The circle animates to the grade the app decided (for example, a typo lands in the "Good" segment). The user can override by drawing.

## 4. The three tabs (in this order)

### 4.1 Explore (home)
- An endless feed of words, one at a time, each rated with the Circle.
- **"Explore by ..." (built, replaces the old lens idea):** the header row says "explore" with the filter icon at its end; under it a small grey line continues the sentence, "by association" ("by theme in kitchen"), and each part is a select (no chevron, white options in its menu), with three ways: **association** (follows the words linked to the one on screen), **theme** (stays in one topic; "in kitchen" on the same line picks it; "explore from here" on the Map sets it) and **usefulness** (the most common words first). **Filters** sit behind a filled funnel icon at the end of the title row: level (easier, my level, harder: moves the target tier by one) and words (all, nouns, verbs, adj & adv). **Interests** (profile): themes the user likes, which association and usefulness prefer when there are words at the right level. **Changing the way of exploring or a filter changes the word on screen too:** a word that has not been rated yet and does not suit the new settings glides away and one that does takes its place (a word that already fits stays; a word just rated is left alone, and the next one follows the new settings). All of it keeps to the user's level and has no randomness. Word families and "words that go together" are not built yet.
- **Lens** (the user's chosen way of exploring), one selectable control:
  - **Themes**: words from the same situation (Küche → Herd, Pfanne, Spülmaschine)
  - **Word families**: fahren → Fahrer, Fahrzeug, Abfahrt
  - **Most useful**: the frequency ladder, filling the most valuable gaps first
  - **In sentences**: words that co-occur (Entscheidung + treffen)
- **Words always fit the user.** The association trail decides *which area* to explore, and the user's estimated level decides *which words within it*: not too easy, not too hard (see "Calibration" in section 8). The estimate keeps updating from every rating: many high ratings push toward rarer words, many low ratings ease back toward common ones. **Pure Wander** (follow the trail regardless of difficulty) is an option in **Settings**, off by default.
- **Top right is the filter icon** (a filled funnel; orange when a filter is on). During the first-run test it is the counter instead (below). The profile is the fourth tab (section 5).
- **Counter.** Small, in grey: a mini ring and "n / 20", where n is the number of gathered words waiting to be studied and 20 is the point where Explore pauses. (During the first-run test it counts "n / 15" instead.) **Explore pauses when the pile gets large:** once 20 gathered words are waiting to be studied, the Explore tab shows "explore is paused" with a button to Study, and opens again as words are studied. **When the word that fills the pile is rated, Explore closes and the user is taken to Study automatically** (after about two seconds, so the rating's animation is not cut off); coming to Explore while it is already closed just shows the "paused" screen. (The threshold, 20, is a first guess to tune.) The similar-word chips only offer words within one tier of the user's level, so they are never far too easy or too hard.
- **Word graph rule.** Semantically close pairs (opposites, near-synonyms) are not introduced back to back, to avoid interference. Theme and word-family links are preferred for new material.
- **First word for everyone:** *Feierabend* (a delightful, very German word). After roughly ten words, the first stars appear on the Map.

### 4.2 Study
- **The tab opens on a list of the words you are learning** (gathered, not yet learned; the title row holds two small icons on the right: a magnifier for search and a sort icon whose menu holds the ways to sort (status, a-z, newest); a bin to delete a word for good: it asks "are you sure?" in a window first). Tapping a word opens its full card (article, word, meaning, plural, example); **the card can be swiped up for the next word of the list and down for the previous one** (the same motion as in Explore; a small nudge the first time says so). The way back is a chevron at the top left (no "close" button, no counter). Below the list sit the session buttons (see below). When no session is ready (fewer than 3 new words are waiting and no review is due) it is disabled, with a line saying how many are gathered. Every time the tab is opened it starts on the list again.
- **One button by default: "study"** (everything that is waiting or due, up to 50 words, with the number under it). **The setting "quick sessions" (off by default)** adds a second size: two buttons side by side, **quick study** (up to 10 words, at most 5 of them new) and **study all** (up to 50); "study all" shows only when it holds more than the quick one.
- **The test looks exactly like Explore:** the same header (title "study", a grey counter "n / 5" on the right), the same circle in the same place and size, the German word in it; you draw how well you know it, the English appears, the example sentence under it in German with its English translation. No instructions above or below. **A swipe up moves on**, as in Explore.
- **The prompt type changes with how well the word is known** (later): recognition with the Circle first; then cloze, then typing.
- **Celebration:** a word rated above 75% in Study gives a success haptic.
- **When the batch is done:** "nicely done" and "the key is in daily practice, so come back to your words regularly!", and nothing else but the **daily reminder** (a switch, and the time of day when it is on); the tab bar is the way on.
- **A session needs at least 3 new words waiting** (or a review that is due). The 20 that pauses Explore is only the ceiling, not a gate.
- Words are **not** drip-fed daily. They enter only when a session begins.

### 4.3 Map
- A **night sky** for motivation and overview. The Map is the one dark screen (deep navy `#0C1927`, light status bar), so that glowing stars can read as light.
- **It looks like a starred sky with a web of threads.** Small dim stars are spread evenly over it. Each theme is **one bigger star** with four thin rays and its English name under it (29 in the current list). A theme with more words is a slightly bigger star, but only a little and with a cap. **Related themes are joined by thin lines**, from a **hand-made list of neighbours in meaning** (`src/data/themeLinks.ts`: kitchen next to food and drink and to house and furniture, weather next to animals and environment, and so on; the links that fall out of the words' own related lists were too noisy). The stars are placed so that neighbours in meaning are neighbours on screen, **and the easy themes sit at the top left and the hard ones at the bottom right** (a hand-set level per theme, 1 to 5, in the same file): **the arrangement is the same for everyone** (the best of 16 pulls-together of the linked stars, stretched to fill the sky). **Every user still gets a sky of their own:** a random seed is chosen once on the first launch (and again if onboarding restarts); it nudges every star a little and decides where the small stars fall. The map is never mirrored, so the corners always mean the same. There is no line between two dark (untouched) stars; a line is faint and cool when one of its stars is lit, and warm and brighter where both are.
- **A star shines as more of its theme is taken, in steps by share (so it keeps working when a theme has thousands of words).** The share is the part of the theme's words the user has taken (met and rated). **Under 1%** the star is still dark: a small dim dot with no halo, no rays, a quiet name. **From 1% to 10%** it is the same warm point as a glowing star, with only a tiny glow and no rays. **From 10%** it starts to glow, and then more and more: about 25% a small halo with rays, 50% clearly bright, 75% large, all words a full blaze (larger core, wider orange halo, longer rays, a soft nebula behind it). So a new user's map is quiet and dim: mostly dark stars and a few yellow points. A word is *known* once it was marked known in Explore, or its FSRS card lasts 21+ days (this still decides how the words of a theme look inside its sphere).
- **The sky is bigger than the screen (about 2 screens wide and 2 tall).** The Map opens already zoomed in on the middle of it, so stars run off the edges, and the user **drags in any direction to look around** (a flick keeps gliding to a stop, and it stops at the edge of the sky). The sky fills the whole screen, behind the header, the info card and the tab bar, so there are no bare bands at the top or bottom. Under the header one dim line explains the sky: "every star is a topic. it lights up as you learn its words." It hides while a theme is open.
- **Tap a big star, or pinch in on it once the camera is already close, and the sky zooms in on it** (pinching zooms into the point between the fingers, not the middle of the map; pinching out on an open theme closes it, following the fingers; the camera has three rests: the whole sky, the sky close up, and one theme). The rest of the sky grows and dims (the other big stars fade out) and the star slides to the middle, where the theme opens as **a slowly turning sphere of dots** (fine dust gives it its shape, the near side brighter and bigger than the far side). **Each word of the theme is one point of the sphere** (an even sample beyond 60 words), scattered over it so none clump. **The words you have taken into study shine** (orange while being learned, warm yellow once known); words you have not met are dim dots. The more words are learned, the more of the sphere shines. Drawn by the same shader as the big stars. Inspired by the dotted "thinking orbs" of libraries.dev, redrawn on our own Skia, no code taken from there.
- **A card below the cluster** shows only the theme's name in English and German and how many of its words are explored. There is no breakdown by state.
- **When every word of a theme is explored**, the card says so ("all the words in this cluster are already explored, so it's time to study them") and the button becomes **study**, which goes to the Study tab.
- **One action:** **explore from here** on that card switches to Explore, which starts on an unexplored word of that theme closest to the user's level. The button reads "explore is paused" while Explore is locked (20 words waiting) and "all explored" when nothing is left. Tapping the sky zooms back out (the card has no "close" label). It is not a full navigation surface.
- The header shows only how many words have been explored ("25 words", plain text), never the total, so how many words the app holds stays a surprise. **The list of words is no longer on the Map: it lives in Study.** The first time the Map tab is opened (and it never comes back after leaving the tab or tapping "got it"), a card says what it is (every star is a topic, it lights up as you learn its words; tap a star, pinch, drag) with a "got it" button.
- Clusters follow **themes**. Word-family clusters are not built yet (the family links in the data are only strings, not connections between words).

## 5. Profile and settings

**The fourth tab** of the bottom bar (Explore, Study, Map, Profile; a head-and-shoulders icon), titled "profile" like the other tabs. Credits and Interests open one level down from it, with a chevron back.
- **Profile:** the avatar (the initial), the name (tap to change it), and three numbers: words explored, in study, learned.
- **Daily reminder** (built): a switch and a time (default 19:00). It is a local notification, set by the app each time it goes to the background: **one** reminder, on the first day when something is ready (reviews that are due, or at least 3 new words waiting), and none if nothing will be ready. It stays quiet while the app is open. It is offered on the "nicely done" screen after a finished session (the same switch and time as here); the phone's permission is asked when the switch is turned on.
- **Credits** (a page one level down, opened from a row "credits" under "about"): where the words and meanings (Wiktionary, via Wiktextract and kaikki.org; CC BY-SA 4.0), the sentences (Tatoeba; CC BY 2.0 FR), the word frequencies (FrequencyWords by Hermit Dave, from OpenSubtitles; CC BY-SA 4.0), the scheduling (FSRS, ts-fsrs; MIT), the type (Figtree; SIL OFL 1.1) and the libraries come from, with a tappable link to each. A note says the word list is shared under the same share-alike terms.
- **Quick sessions** (a switch, off by default): adds the "quick study" button to Study.
- **Start over** (a testing aid, to remove before release).
- **Not built yet:** what the reveal card shows (meaning, plural, example, audio, word family chips, memory hook), Wander or Guided exploring.

## 6. Card and content model

- **Unit:** single words, one card per **sense** (Bank as bench and Bank as bank are separate). Phrases and collocations are a later addition, so the data model must be able to hold them.
- **Fields per entry:** lemma, sense id, part of speech, article, gender, plural, English gloss, frequency rank, example sentence(s) with audio, word-family links, association links (`related`: the words you can travel to), theme tags, co-occurrence links, memory hook.
- **Dataset size:** 3,000-5,000 senses for the full first version. **Now 1,474 words** (33 hand-written, 1,441 from the pipeline in `scripts/words/`, see its README): tiers from a real frequency list, article, plural and meaning from Wiktionary, examples from Tatoeba and Wiktionary, themes chosen by hand. The data is licensed CC BY-SA / CC BY 2.0 FR, so a credits screen is needed before release.
- **Data source (pre-built dataset bundled in the app):**
  - Frequency lists for ranking
  - Wiktionary extracts for senses, gender, plural and word families
  - Tatoeba for example sentences
  - TTS for audio
  - An LLM-assisted, human-checked step for themes, links and memory hooks
  - **Check licenses and attribution** (Wiktionary and Tatoeba are share-alike or attribution licenses)
- No live LLM in v1. No backend.

## 7. Scheduling

- Spaced repetition with **FSRS** (built: the `ts-fsrs` library, wrapped in `src/srs/scheduler.ts`). Intervals are whole days (no minutes-long learning steps) and there is no fuzz.
- **A Study batch** is the reviews that are due (up to 10, most overdue first) followed by up to 5 new words from the pile (rated lowest first). Reviews have no card: they only appear in the Circle part.
- **Seed the initial state from the Circle value** in Explore. A word rated near green starts with a longer first interval than one rated near red. This is a departure from Anki, which starts every card the same.
- The four hidden segments map onto the four standard grades (Again / Hard / Good / Easy) for the scheduler.
- **Spot-checks of "known" words (proposal):**
  - A known word is scheduled like any other card, but with a high starting stability, so its first check comes after roughly 3 weeks.
  - At most 1-2 spot-checks are mixed into a session, and they look like ordinary cards (no special screen).
  - If the user passes, the next check moves far out (months).
  - If the user fails, the word moves quietly into the pile, with a light note on the reveal ("Added to your pile") and no penalty message.
- Prompt type advances with word strength, from recognition to production.

## 8. Onboarding, reminders

- **First launch, in order:** (1) the name; (2) **one intro screen**: "welcome, Name" and the three steps, *explore: meet new words / study: learn the ones you gathered / map: watch your vocabulary grow on a map*; (3) **a practice screen** with *Feierabend* only: "let's roll, Name", the instruction, the ghost finger, no counter, no test; after the first drawing "great job! you will explore and study words this way. we encourage you to draw the circle intuitively" with captions (you can undo; tap the word to flip it) and "continue" (the rating is not saved); (4) **the quick-test screen**: "here is a quick test to adjust new words you explore to your vocabulary level. show how well you know these 15 words" and "start"; (5) the 15 test words in Explore (counter top right); after the 15th is rated the user swipes up once more (a tip says so); (6) "got it, Name. we adjusted the words you'll explore so they match your level. now let's study the words you gathered." and "study".
- **Calibration (the first 15 words).** There is no separate test screen: the opening words are ordinary Explore words, rated with the Circle. But they are chosen adaptively to find where the user's knowledge ends.
  - The words come from a **frequency ladder**, and each rating moves the next pick. A high rating (know it) jumps to a rarer word. A low rating (don't know) steps back to a more common one. Big jumps at first, smaller steps as the estimate settles, like a binary search.
  - **No similar-word chips and no association trail during calibration.** Words linked by association sit in one thematic zone, which would make the estimate read one area of knowledge instead of the level. Instead the picks are spread across themes (ties go to a theme not yet met), and the user just swipes up for the next word. The screen shows a small progress count ("3 / 15").
  - The first word carries a greeting above the circle: "let’s roll, Name" / "here is your first word", the same distance above the circle as the tip sits below it. The background is still an empty navy: the first star appears when this word is rated.
  - The result is a **level estimate** (a position on the frequency ladder plus how sure the app is). The estimate keeps refining after calibration ends, from every later rating.
  - **The user is told what it did, the moment the 15th word is rated** (after a short beat, so the ring's snap is not cut off): "got it, Name. we adjusted the words you’ll explore so they match your level." No score, no level name, no swipe needed. The words themselves then prove it.
  - Words rated during calibration count like any other: they go to the pile or are marked as known.
  - **Straight into Study.** The onboarding does not end in Explore. When the 15th word is rated, the message above appears and the user is taken **directly into a first Study session** to learn the words they just gathered, so the first minutes already deliver the app's real loop (find words, then learn them).
    - The session is the usual small batch: **up to 5 words from the pile**, the ones the user rated lowest first (the ones they most need), first as cards, then in the Circle (the same two parts as any session). It is a normal Study session in every way (12-20 card badge does not apply, it ends when the batch is done), with a friendly closing line and a choice: "keep going" or "back to Explore".
    - Study is where the Circle's value seeds the scheduler (section 7), so the calibration ratings directly set the first review intervals.
    - **Few words in the pile:** if the user knew most of the 15 (only 1-2 in the pile), do not force a tiny session. Say so ("you know a lot already"), keep exploring further up the ladder, and start Study once at least 3 words have gathered.
    - The tab bar is hidden until the 15 words are rated and **appears with the first Study visit** (the tabs open on Study, on the list of words), so the user can leave at any moment. Later launches open on Explore.
  - **Edge cases:** if the ratings are inconsistent, keep the estimate wide and keep probing a bit longer. If the user rates everything as known or everything as unknown, move to the far end of the ladder quickly, then settle.
- **Reminders:** one gentle daily nudge at a time the user chooses, only if something is waiting.

## 9. Tech direction

- **Expo / React Native (TypeScript)**, iOS first. The same codebase can target Android later.
- Reanimated + Gesture Handler for the Circle, Skia for the Circle and the Map, `expo-haptics` for the top-of-scale tick.
- Local, offline-first storage (SQLite), with the dataset bundled. The name is stored on the device. No real accounts and no sync in v1. A manual export/import backup can be added later.

## 10. Visual direction

- **A deep navy night, everywhere.** The whole app is dark: background `#0C1927`, **at the start the sky is empty, plain navy.** Every word the user rates, whatever the rating (known or to study), lights one more small star somewhere on the background of every screen (with a soft ring that spreads and fades on the new one), so the further they get, the more stars there are. The stars are the same evenly scattered small ones as on the Map, in a scrambled order so the sky fills up all over, not from a corner. The first stars are a little brighter and bigger so each one is noticed; as the sky fills they settle to a small, dim level (after about 80 stars), so the background never competes with the content. Undoing a rating removes its star. The Map draws its own, full sky with the big theme stars on top of it.
- **Ink and greys are cool and light:** text and icons `#EFF2F5`, secondary text `#A5B0BD`, quiet text `#6F7E90`, the empty ring of the Circle `#22364B`. Cards and fields are frosted (white at 7%, with a white 12% border), a solid card `#15263A` is used where something must hide what is behind it (the new-word card, the Map's info card), and small pills are white at 10%.
- **One accent: orange `#F75831`** for the main button, the active tab, the counter and its ring, and selected options. Text on it is white.
- **No red-to-green anywhere:** the Circle's rating is shown by how much its stars shine (blue and dim for "don't know" up to a golden blaze for "know"), not by a colour scale.
- Type is Figtree, lowercase for the interface text (German words keep their capitals).
- The colors live in `src/theme.ts`. A proper visual identity comes later, once the author has collected references (Mobbin) and the interactions are proven.

## 11. Out of scope for v1

Multiple languages, phrases and collocations, spoken/pronunciation-graded prompts, live LLM features, real accounts and sync, monetization, social features, gender color-coding, a coverage meter (an idea we did not choose; revisit later).

## 12. Open questions

1. Visual identity, deferred until the prototype has proven the interactions (the prototype is greyscale plus orange).
2. The exact position of the circle's starting handle 
3. Whether the spot-check proposal in section 7 feels right in practice (first check after about 3 weeks, at most 1-2 per session).
4. Calibration (15 words, decided): whether the "not too easy, not too hard" message feels reassuring or like an exam result, and whether hiding the tab bar until the first Study session feels guided or restrictive. It needs a frequency-ranked word list with enough words at each step of the ladder (the 33-word sample is too small to test it).

## 12b. Where we are, and the next steps (written 2026-09-30)

**State of the app (all committed: see `git log`).** Expo prototype with: onboarding (name, 15 adaptive words, first Study session); **Explore** (endless feed, the stardust Circle, similar words, pause at 20 waiting words and an automatic move to Study when it closes); **Study** (a session in two parts: new-word cards, then every word in the Circle; FSRS scheduling; automatic move to Explore when nothing is left); **Map** (Skia night sky: theme stars in steps by share of words taken, threads between related themes, a turning sphere of dots per theme, pinch to the whole sky with a snap, camera mode that turns the phone into a camera pointed at the sky, tilt parallax, a unique sky per user, the list of all words with a card per word). 65 unit tests, `npm run typecheck` clean.

**How it was checked:** the author has been running every step on her own iPhone in Expo Go and steering by feel, so the animations, the Circle, the sensors (tilt, camera mode) and the snap have all been seen on a real phone and adjusted from her feedback. Claude additionally checks in a browser (web build, phone-sized, scripted with puppeteer); sensors do not work there, so those were only ever judged on her phone.

**Next time:** start by asking what she wants to change or build next; there is no open list of "things to verify on the phone". Two things were never reached in testing and are worth a glance: Study's automatic move to Explore when a finished session leaves nothing to study (the test profiles always had more words waiting), and very long words in the Circle.

**From the first usability tests (2 people, 2026-10-10).** Done: one intro screen, the drawing tip above the circle, drawing may start anywhere round the word, the swipe tip larger and for three words, Study available at 3 waiting words and refreshed on open, swipe up in the Study test, English example in the Study test, bigger theme stars, the tab bar in the first session. **Done in round two (2026-10-10):** the flow above (practice screen, quick-test screen, Study as a list plus a test with a "study" button, closing screen to the Map, a first-visit card on the Map, the words list moved from the Map to Study, English example in the Study test, grey counter on the right). **Decided, not built yet:** the "known word" animation is not understood (people did not see a star light up): design a new one; a Map where themes that are close in meaning sit close on screen (keep the structure the same for everyone, randomise only rotation, mirroring and the background); a choice between a short session (10 words) and a normal one; a smooth zoom on the Map at all levels. **No undo in Study for now.** **Later:** adding your own words; more example sentences per word (data work). Temporary: holding the "map" title offers "start over" (for testing on friends); remove before release.

**Known gaps and ideas, roughly in the order Claude would do them**
- **Reduce Motion:** the stardust (twinkle), the light across the screen and the Map's parallax/camera mode should respect the phone's setting (the old fireworks did; the new animations do not yet, except the tilt).
- **First-word hint** without a ring: maybe a few faint stars or a clearer tip; watch a new user try.
- **Study order in the test part:** reviews first, then new words (as now), or new words first while they are fresh?
- **The ring's meaning after letting go early:** any ring now completes itself, so brightness alone carries the rating; consider making the completed part a little fainter than the drawn part.
- **Map:** tapping a star while pulled back could zoom in on it; cluster card and sphere polish; word-family clusters (the family links are only strings in the data).
- **Not built yet from the spec:** spot-checks of known words, reminders, Settings, audio, a real frequency list to check the difficulty tiers, a credits screen for the free fonts (Figtree, OFL) before shipping.
- **Accounts and sync:** none yet, everything is on the device (the name, ratings, FSRS cards, the sky seed).
- **Cleanups:** `summarize` in `onboarding/status.ts`, `WORD_POINT_SIZE` in `sky.ts` and `zoomStates`/`glowOf`-style leftovers may now be unused; the ghost-finger arc in `circle/Circle.tsx` is the only old-style piece of the Circle.
- **Sharing:** the walkthrough page made at the start (an Artifact, Russian captions) shows the **old** app (red-to-green Circle, Study dashboard, no sphere); redo the screenshots with `puppeteer-core` against `expo start` web (390x844) when the app is worth showing colleagues.

**How to run it:** `npx expo start` in the project folder (use the iPhone Personal Hotspot; Expo Go and `npx expo login` must use the same Expo account). Web: `http://localhost:8081` (needs `public/canvaskit.wasm`, copied by `npm install`). Tests: `npm test`.

## 13. Suggested build order

1. **Circle prototype** on a real device (stars that shine more with the rating, snap at the top, ghost hint). This is the riskiest and most distinctive piece.
2. **Data pipeline** for a small slice (around 300-500 senses) with all fields filled.
3. **Explore loop** on local data: lenses, Wander, pile counter, reveal settings.
4. **Study** with FSRS, seeded from the Circle, plus the session badge.
5. **Map**, then reminders and polish.

## 14. Verification

- Run the Circle prototype on the iOS Simulator and on the author's iPhone. Check that the continuous scale feels natural and that the top snap is noticeable but not annoying.
- Unit-test the scheduler seeding (Circle value → initial state), the segment-to-grade mapping (30/30/30/10), and the lens ranking on a small fixture dataset.
- Use the app for a week with the small dataset, and confirm that the pile stays manageable, the reveal card feels concise, and sessions feel finished at 12-20 cards.

- **Moving between the three tabs is animated:** the old screen slides a little to the side, shrinks slightly and fades while the new one comes in from the side of the tab you pressed (about 0.4 s, easing out), and the orange tile in the tab bar glides to the new tab with a soft spring.
- **The Map reacts to the phone's tilt (gyroscope).** Tilting nudges the layers of the sky by different amounts, so it has depth (the small far stars move least, the big stars and their names most), and in an opened theme the sphere turns a little further and leans with the tilt. The tilt is measured from where the phone was held a moment ago (the zero slowly follows it) and smoothed. The sensor runs only while the Map is on screen, and not at all when the phone's Reduce Motion is on. Not available on the web.
- **Pinch to pull the camera back (with a snap).** Two fingers pulling together zoom the Map out, smoothly, down to a view of the **whole sky at once**; spreading them brings it back. As the camera pulls back the theme names fade out, so the far view shows only the stars and the threads between themes (the shape of the whole sky, and where it shines). While pulled back, tapping a star does nothing; pinch back in to open a theme. Dragging still works at every distance (and the sky is centred when it fits the screen). **The map only rests at two distances, close up and the whole sky:** while the fingers are down the map follows them, and when they lift it snaps (about a third of a second, with a light haptic tick) to the nearer of the two; a pinch that covered about a fifth of the way flips it, a smaller one springs back.
- **Camera mode (Map, phone only).** A small viewfinder button next to "words ›" turns the phone into a camera pointed at the sky: where the back of the phone points decides which part of the map is on screen, so the user finds a star by turning round like looking for it in the real sky. **The sky is above you**, so when the mode is switched on the view glides to the **bottom** of the map, and the phone has to be **raised** to climb (120 degrees of raising from the starting angle goes from the bottom of the map to the top); looking lower than where it started changes nothing. Sideways, 120 degrees of turning crosses the whole width. The view glides after the phone, and pinch still works. While it is on, dragging and the tilt parallax are off; it pauses while a theme is open (and afterwards carries on from the same view) and is off by default. There is no re-centre gesture (switch it off and on to start again).
- **The sky extends well past the outermost theme stars** (about half a screen of empty starry sky on every side), so no theme star sits near the edge of the sky, and the camera always has sky to look at beyond them.
