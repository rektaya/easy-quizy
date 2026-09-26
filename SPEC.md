# Product Spec v0.4: Easy Quizy

A vocabulary app for German learners.

## 1. Context

**Problem.** The author is at B1-B2 German. The bottleneck is vocabulary: it blocks speaking, writing and understanding people. Vocabulary is the fastest lever, and cognitive science says how to pull it: active recall and spaced repetition (the Anki approach).

**Why not just Anki.** Anki asks you to choose a deck and a level up front, and it feels like admin. Easy Quizy has no level picker and no deck. You start with one word, words appear by association, and the app works out where your knowledge ends.

**Scope for v1.** A personal tool for the author, German only, English as the bridge language, iOS first. It should be possible to hand to Android-using friends later without a rewrite.

## 2. Principles

1. **One gesture everywhere.** The Circle is used to rate a word in Explore and in Study.
2. **Minimal setup.** No level, no deck. The app asks for a name once and learns the rest from the first ten words.
3. **Recall over recognition.** You commit to an answer before you see it.
4. **Never overwhelm.** New words wait in a pile and enter Study in small batches.
5. **Words in context, but concise.** Gender (through the article), plural, an example sentence and audio belong to the word, but the reveal must be concise and easy to take in at a glance. The user decides what the reveal shows (see Settings).

## 3. The Circle (core interaction)

- One word sits in a circle in the center of the screen. Nouns always show their article: **das Haus**. The article already conveys gender, so there is **no separate gender color-coding**.
- **The drawing starts wherever the finger lands on the ring** (on the ring itself, or within about a thumb's width of it; touching the word in the middle does nothing). The arc grows from that spot, and can be drawn **either way round**, clockwise or counter-clockwise. A full circle means coming back to where you started. The app tracks how far the finger has turned around the circle's centre, so it works from any starting point.
- **A continuous scale with no labels.** The arc fills up gradually, and its color moves from **red** (don't know it at all) through to **green** (know it for sure). The user rates by feel, not by picking a named level.
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
- **Discoverability:** on the very first word only (*Feierabend*), a ghost finger draws an arc, with a tip below the circle: "start anywhere on the ring and draw around". There is no other tutorial.
- **Undo:** the "undo" in the status pill inside the circle, for a few seconds after each draw (mirrors Anki's undo).
- **Moving on (two ways, one motion):**
  - **Tap any similar word** below the circle to go to it. Words you have already rated are not shown as chips.
  - **Swipe up** to keep going: it follows the current word's associations first (the first unrated related word), then falls back to the trail order.
  - Both use the same motion: the word glides up and away, and the next one rises in from below and grows into place. Weak or short swipes spring back. There is no "next" button.
- **Layout.** The circle sits a little above the middle of the screen so the example sentence and similar words have room below it.
- **Flip the word.** After rating, tap anywhere inside the circle (the tap area is round, like the circle) to see the original German word again (with its article, exactly as before rating), and tap again to get the translation back. It resets to the translation on every new word.
- **Status line.** After you rate a word, a small line of text appears **inside the circle, above the word** ("added to study", or "marked as known"), with an orange **undo** beside it, and no background. It floats on top of the circle, so the translation stays exactly centred. It fades away after a few seconds.
- **Fireworks.** Marking a word as known sets off a short firework animation over the circle: a few bursts of little streaks in greens, amber and orange that fly outward and fade. It is skipped when the phone's "reduce motion" setting is on.
- **Tips.** The gestures are taught once, on the very first word, with tips **below** the circle: "start anywhere on the ring and draw around…" before rating, and "tap a word to travel, or swipe up" after.
- **In Study,** typed answers are auto-graded. The circle animates to the grade the app decided (for example, a typo lands in the "Good" segment). The user can override by drawing.

## 4. The three tabs (in this order)

### 4.1 Explore (home)
- An endless feed of words, one at a time, each rated with the Circle.
- **Lens** (the user's chosen way of exploring), one selectable control:
  - **Themes**: words from the same situation (Küche → Herd, Pfanne, Spülmaschine)
  - **Word families**: fahren → Fahrer, Fahrzeug, Abfahrt
  - **Most useful**: the frequency ladder, filling the most valuable gaps first
  - **In sentences**: words that co-occur (Entscheidung + treffen)
- **Wander is the default:** the app follows the association trail regardless of difficulty. **Guided mode** (which steers toward the user's frontier: many high ratings push toward rarer words, many low ratings ease back toward common ones) is an option in **Settings**, not on the main screen.
- **Pile counter.** Just the number of gathered words, left-aligned at the top of the screen. As the user starts studying, it also shows how many words are already in study. A gentle warning appears when the pile gets large.
- **Word graph rule.** Semantically close pairs (opposites, near-synonyms) are not introduced back to back, to avoid interference. Theme and word-family links are preferred for new material.
- **First word for everyone:** *Feierabend* (a delightful, very German word). After roughly ten words, the first stars appear on the Map.

### 4.2 Study
- **Sessions are an endless stream** (like Explore). Each session starts with a **small batch of 3-5 new words from the pile** mixed with **reviews that are due**, plus occasional spot-checks of "known" words.
- After **12-20 cards** the user gets an achievement badge: "good for this session", with the option to continue.
- **The prompt type changes with how well the word is known:**
  1. Recognition (see the German word, recall the meaning), rated with the Circle
  2. Cloze (a sentence with a gap; for nouns, also a check of the article, such as "___ Haus")
  3. Typing the word from its meaning
- **Spoken prompts are not in v1** (possible later).
- New words in a session get a short "meet it" step first (reveal, then an immediate small test).
- Words are **not** drip-fed daily. They enter only when a session begins.

### 4.3 Map
- A **living vocabulary constellation** for motivation and overview. Star states: unexplored (dim), gathered (outline), learning (glow), known (solid).
- Clusters follow themes and word families.
- **One action:** tap a cluster, then "Explore from here", which starts Explore with that area as the seed. It is not a full navigation surface.

## 5. Settings

- **Reveal content:** the user chooses what appears on the reveal card (meaning, plural, example sentence, audio, word family chips, memory hook). The default is the concise set.
- **Exploration mode:** Wander (default) or Guided.
- **Reminder time** for the daily nudge.
- **Name** (stored on the device).

## 6. Card and content model

- **Unit:** single words, one card per **sense** (Bank as bench and Bank as bank are separate). Phrases and collocations are a later addition, so the data model must be able to hold them.
- **Fields per entry:** lemma, sense id, part of speech, article, gender, plural, English gloss, frequency rank, example sentence(s) with audio, word-family links, association links (`related`: the words you can travel to), theme tags, co-occurrence links, memory hook.
- **Dataset size:** 3,000-5,000 senses for the full first version. The first build uses a small slice of 300-500 senses with all fields filled.
- **Data source (pre-built dataset bundled in the app):**
  - Frequency lists for ranking
  - Wiktionary extracts for senses, gender, plural and word families
  - Tatoeba for example sentences
  - TTS for audio
  - An LLM-assisted, human-checked step for themes, links and memory hooks
  - **Check licenses and attribution** (Wiktionary and Tatoeba are share-alike or attribution licenses)
- No live LLM in v1. No backend.

## 7. Scheduling

- Spaced repetition with **FSRS** (a maintained TypeScript implementation exists).
- **Seed the initial state from the Circle value** in Explore. A word rated near green starts with a longer first interval than one rated near red. This is a departure from Anki, which starts every card the same.
- The four hidden segments map onto the four standard grades (Again / Hard / Good / Easy) for the scheduler.
- **Spot-checks of "known" words (proposal):**
  - A known word is scheduled like any other card, but with a high starting stability, so its first check comes after roughly 3 weeks.
  - At most 1-2 spot-checks are mixed into a session, and they look like ordinary cards (no special screen).
  - If the user passes, the next check moves far out (months).
  - If the user fails, the word moves quietly into the pile, with a light note on the reveal ("Added to your pile") and no penalty message.
- Prompt type advances with word strength, from recognition to production.

## 8. Onboarding, reminders

- **First launch:** the app asks for a name once (stored on the device, used for greetings and the achievement moments). No login. The first word is then *Feierabend* in the circle, and the ghost finger shows the gesture.
- **Reminders:** one gentle daily nudge at a time the user chooses, only if something is waiting.

## 9. Tech direction

- **Expo / React Native (TypeScript)**, iOS first. The same codebase can target Android later.
- Reanimated + Gesture Handler for the Circle, Skia for the Circle and the Map, `expo-haptics` for the top-of-scale tick.
- Local, offline-first storage (SQLite), with the dataset bundled. The name is stored on the device. No real accounts and no sync in v1. A manual export/import backup can be added later.

## 10. Visual direction

- **The first prototype is clean and straightforward: greyscale, with orange as the accent color only where color is needed.** No visual exploration for now.
- **One functional exception:** the Circle's arc keeps its red→green color scale, because the color is the rating signal itself (data), not decoration. Everything else stays greyscale plus orange. If red→green clashes with the orange accent in practice, we revisit.
- A proper visual identity comes later, once the author has collected references (Mobbin) and the interactions are proven.

## 11. Out of scope for v1

Multiple languages, phrases and collocations, spoken/pronunciation-graded prompts, live LLM features, real accounts and sync, monetization, social features, gender color-coding, a coverage meter (an idea we did not choose; revisit later).

## 12. Open questions

1. Visual identity, deferred until the prototype has proven the interactions (the prototype is greyscale plus orange).
2. The exact position of the circle's starting handle 
3. Whether the spot-check proposal in section 7 feels right in practice (first check after about 3 weeks, at most 1-2 per session).

## 12b. Immediate next step: the first prototype

A clean, greyscale prototype (orange accent only where color is needed) that proves the core loop on the author's phone.

**In scope**
- New Expo (React Native, TypeScript) project in `/Users/taya/Documents/design/vibecoding/better-anki`.
- Three-tab shell in the agreed order: Explore, Study, Map. Study and Map are simple placeholders.
- **Explore tab, working end to end:**
  - The word in a circle, with the article for nouns.
  - The Circle gesture: start anywhere on the ring and draw either way round, continuous arc fill, red→green color, hidden 30/30/30/10 segments with haptic ticks between them, snap in the last 10%, plain tap does nothing, ghost-finger hint on the first word, brief undo toast.
  - The reveal after the gesture: English meaning, one example sentence, word family chips.
  - The pile counter ("You've gathered X words"), fed by the ratings.
  - "Know" (last 10%) words are kept out of the pile.
- A hard-coded list of around 30 German words as sample data (mostly nouns with articles), so the gesture and reveal can be judged without building the data pipeline.
- Local persistence of the pile (a simple store is enough for now).

**Out of scope for the prototype:** the real dataset, lenses, Guided mode, Study sessions and FSRS, the Map, Settings, reminders, audio, name entry.

**Done when:** the Circle feels natural on a real iPhone, and a short Explore session produces a sensible pile count.

## 13. Suggested build order

1. **Circle prototype** on a real device (continuous fill, red→green scale, snap at the top, ghost hint). This is the riskiest and most distinctive piece.
2. **Data pipeline** for a small slice (around 300-500 senses) with all fields filled.
3. **Explore loop** on local data: lenses, Wander, pile counter, reveal settings.
4. **Study** with FSRS, seeded from the Circle, plus the session badge.
5. **Map**, then reminders and polish.

## 14. Verification

- Run the Circle prototype on the iOS Simulator and on the author's iPhone. Check that the continuous scale feels natural and that the top snap is noticeable but not annoying.
- Unit-test the scheduler seeding (Circle value → initial state), the segment-to-grade mapping (30/30/30/10), and the lens ranking on a small fixture dataset.
- Use the app for a week with the small dataset, and confirm that the pile stays manageable, the reveal card feels concise, and sessions feel finished at 12-20 cards.
