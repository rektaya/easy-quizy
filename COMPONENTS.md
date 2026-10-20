# Components and UI patterns

The list of what already exists, and the rules for using it. **Read this before adding or changing any
screen.** If a pattern is here, use it; do not invent a second one (for example a "close" button where the
back chevron already exists). If something is missing, say so and ask before adding a new pattern.

## Rules (decided with the author)
- **Going back or closing is the chevron-left icon** (`ChevronLeftIcon`, white (`colors.text`, like every chevron: the one that opens a page, the ones on selects), size 28, in a 32 px tall row at
  the top left, **with the screen's title in the middle of that row**: "add new word", the name of a topic on the Map's word list, "credits"). Never a "close" or "back" button, never the word "close". Used on "add new word" (Study), on the Map's
  word list and on the page one level down from Profile (Credits); Profile itself is a tab and has no chevron.
  **The one exception is the word card**, which is a card laid over a page, not a page: it closes with a **cross in a
  small round button at the top right of the card** (`XIcon`, in the card's top row, opposite the status circle at the left), or with a
  tap outside the card. (Decided with the author on 2026-10-20.)
- **One title style:** `TabHeader` (22, medium, top left) for Explore, Study, Map and Profile. The top right of the
  header holds small status or tools, as icons: in Explore none (its level and words are selects, below); Study: the sort, search
  and plus icons (the plus adds a word of your own); Map: the camera button; the first-run test: the counter. Explore's title also
  holds, next to "explore", two selects on glass pills (`ExploreTitle`): the way of exploring ("by association" by default;
  the others are by theme, by usefulness, by free) and, only when exploring by theme, a second select for the topic ("in travel"), then the level ("my level", "easier", "harder") and the kind of words ("all words", "nouns", "verbs", "adj & adv"), each a select with its own menu; when they do not fit on one line the next ones go on to a second line. The little word ("by", "in") is grey, the choice white.
- **Choices that are not worth a screen are menus that open from an icon or a select** (the sort menu, the "explore
  by" menu, the filters). They open over everything and close with a tap anywhere else.
- **One gesture everywhere:** draw a circle to rate a word; swipe up to move on to the next word (Explore, the
  Study test) and to the next card (Study word cards; swipe down goes back). Pinch to zoom the Map.
- **Not knowing a word is one tap:** a small cross (`DontKnowButton`) inside the circle, right under the word, for a word you do not know at
  all, so there is no need to draw. It is on Explore, the first-run test, the practice screen and the Study test, and
  only while the word is still to be rated and no circle is being drawn. It rates the word at the lowest value and the ring then draws itself, in dark blue.
- **A word's state is a circle** (`StatusRing`), never a word plus a dot: empty = new, a little filled = shaky,
  more = getting there, full = learned. It is on the right of a word row and of an open card (no name beside it).
- **Small things in the circle (the cross, the loudspeaker) stay mounted and fade with a `visible` prop**, they are never taken away while fading: Reanimated can move a view that is leaving to another place for a moment (they used to slip down when a drawing began).
- **Nothing shows through what floats over content.** The tab bar is opaque (`colors.surfaceSolid`, the look of a frosted card on the navy night, but solid): a screen that scrolls under it never shows its text behind the icons. Any new floating thing (a bar, a plate over a list) gets a solid background too.
- **Nothing pops.** Whatever appears or disappears (a menu, an overlay card, a page, a row that opens, the next
  onboarding step) fades in and out (about 160 to 260 ms) with `entering` and `exiting` or a layout transition. A
  new menu, card or page gets the same.
- **Interface text is lowercase** (German words keep their capitals). No full stops at the end of a short line.
- **One main button per screen**, orange (`Button`, primary). A second, quieter one is `ghost`. Dismissing is not
  a button's job (see the first rule).
- **What a word's answer is** is said by one badge, `RatingBadge`, always in the **same place** (just under the first line of the screen, at the top of the safe area plus 54), on every screen that has one: Explore (also the first-run test); the Study test and the practice screen have none. Never inside the circle, never a second position. There is no undo: a rated word's answer is changed with the handle on its ring (dragging the dot).
- **No tutorials.** The gesture is taught once, on the practice screen; after that only the first-visit cards.
- The look: deep navy `#0C1927`, light ink, one orange accent, Figtree (`src/theme.ts`).

## Components (`src/components/`)
| Component | What it is | Used on |
|---|---|---|
| `Button` | orange main button, or `ghost` | everywhere |
| `TabHeader` | the title row (title left, optional `center` select, status or tools right); `onTitleLongPress` is a testing hook | Explore, Study, Map, Study session |
| `ExploreControls` | `ExploreTitle` ("explore" with the way of exploring, by theme the topic, the level and the kind of words, as glass pills next to it), the filter icon and the menus | Explore |
| `OnboardingProgress` | a thin band of stars (two or three deep) at the top of the first-run screens: the circle's stardust laid out flat, stars up to the current step shining (animates between steps) | first run |
| `StatusRing` | a word's state as a circle (new, shaky, getting there, learned) | word rows, word cards, "add new word" |
| `FallingStar` | the falling star drawn on the welcome screen (drifts slowly) | welcome |
| `DontKnowButton` | the small cross in the circle, under the word: "i don't know this word at all" | Explore, Study test, practice |
| `WordRow` | a row of a word list: article + word, meaning, status ring, bin | Study list, the Map's sheet |
| `CardPager` | the swipeable stack of word cards over a list (swipe up next, down back, the cross on the card or a tap outside closes) | Study list, the Map's sheet |
| `Avatar` | the user's initial in a round badge with an orange rim | Profile |
| `Icons` | `SpeakerIcon`, `ExploreIcon`, `StudyIcon`, `MapIcon`, `LookIcon`, `SwipeUpIcon`, `TapIcon`, `TrashIcon`, `SortIcon`, `SearchIcon`, `ChevronLeftIcon` (back), `ChevronRightIcon` (a row that opens a page), `ChevronDownIcon`, `PlusIcon`, `XIcon`, `ProfileIcon` | tab bar and screens |
| `FloatingTabBar` | the pill with four tabs (Explore, Study, Map, Profile); `useTabBarSpace()` says how much room to leave; `useTabRepress(fn)` runs `fn` when the tab you are already on is pressed again (every tab with a deeper level uses it to go back to its first level: Study to the list, Map out to the whole sky, Profile out of the credits) | tabs |
| `WordFace` | the German word inside the circle (article above, lemma below). (Long words step down just enough to fit the ring.) On the word card the word is **32 when it fits and 24 when it does not**, and only a very long word goes below that | the circle |
| `Translation` | the English meaning, sized to fit the circle | the circle |
| `WordChip` | a word as a small pill (the similar words in Explore, the words a word often comes with on its card); tapping goes to the word | Explore, word card |
| `FlipReveal` | what sits in the circle after rating: the translation, tap to flip to the German word | Explore, Study, Practice |
| `RatingBadge` | the badge with the word's answer ("added to study", "marked as known"), in its one place, following the handle | Explore |
| `AdjustHint` | the hint "hint: if you were wrong, drag the dot on the ring to change your initial answer" on a plate, directly above the circle (`HINT_GAP` above its box) | first test word in Explore, the first Study word (once) |
| `SpeakButton` (`speakTop`) | the small loudspeaker in the circle above the word, in the style of the cross under it: says the German word aloud (`src/audio/speak.ts`, the voice of the phone) | Explore, Study test, first-run test, practice |
| `VerbForms` | a verb's forms on one line, "geht · ging · ist gegangen" | under the circle in Explore and Study  |
| `WeekCard` | the week as seven glowing round stars (dark blue for a day without study up to a golden star when the day's goal, the words of a session, is done), with the letters m t w t f s s; no text. The shine is the circle's (`src/circle/shine.ts`) | Profile |
| `WordCard` | a word's card: the status ring at the top left, the cross at the top right; the loudspeaker, the word and the meaning above one line; under it the verb's forms, plural, the words it often comes with (as `WordChip`s that open the word in the Map tab), your note, two examples and, last, the topic. Scrolls when it holds more than fits | `CardPager` |
| `RevealDetails` | example and similar words under the circle after rating | Explore |
| `Ring` | a small progress ring (the counter) | the first-run test, Study session |
| `SessionSizePicker` | the size of a Study session, the chosen one orange: three tiles (10, 20, 40 words, each with about how long it takes) | first run (`PaceStep`), the panel of `SessionSizeSetting` |
| `SessionSizeSetting` | the Profile setting: a card with a select ("20 words" and a chevron) that opens a `BottomSheet` with the picker and a "save" button | Profile |
| `BottomSheet` | a panel that slides up from the bottom over everything, on a dimmed screen: closes with a tap outside or a drag down (nothing is saved then); a "save" button inside saves and closes | Profile |
| `ReminderCard` | the daily reminder: a switch and the time | Profile, "nicely done" |
| `Starry` / `StarBackground` | the night sky behind every screen, one more star per rated word | everywhere |
| `KnownDust` | the stardust that floats out of the screen when a word is marked known | app root |

## The Circle (`src/circle/`)
`Circle` (the touch area is the whole working area of the screen; the circle's box sits inside it at `x`, `y`; with the `adjust` prop a handle on the ring, with a touch area of its own, changes the answer after rating),
`useRing` (the gesture and its shared values), `StardustRing` (what you see), `geometry` (pure maths, tested).

## Screens (`src/screens/`)
Welcome (with `FallingStar`), Name, ExploreWayStep, PaceStep, Intro, Practice, QuizIntro, CalibrationDone (the first run, with the progress bar);
Explore (`ExploreView`), Study (`StudyTab`: the list in `WordsScreen` with the card pager, `AddWordScreen` for a word
of your own, the session in `StudyScreen`), Map (a topic opens as a sphere with a small card; tapping the sphere or "see words" goes one level further in, to a page with the topic's words), Profile (with
Credits one level down: a row on Profile opens it, its chevron goes back to Profile).

## Patterns worth reusing
- A drop-down select in a form: the topic in `AddWordScreen` (a field with a chevron; its list opens over what is below,
  scrolls, a dot marks the choice).
- A panel from the bottom for a setting with more to say than a menu: `BottomSheet` (the words per session in Profile): a select opens it, "save" applies, a tap outside or a drag down discards.
- A menu that opens from an icon: the sort menu in `WordsScreen` (a card under the icon, a dot marks the choice).
- A card that is swiped through: `CardPager` (used by the Study list and the Map's sheet; swipe up, swipe down; the
  position lives inside it so the list behind does not redraw).
- A confirmation before something is lost: `Alert.alert` with cancel and a destructive action (delete a word,
  start over).
- Permission asked only when the user turns something on (the reminder switch).
