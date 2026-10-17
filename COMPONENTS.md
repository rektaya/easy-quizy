# Components and UI patterns

The list of what already exists, and the rules for using it. **Read this before adding or changing any
screen.** If a pattern is here, use it; do not invent a second one (for example a "close" button where the
back chevron already exists). If something is missing, say so and ask before adding a new pattern.

## Rules (decided with the author)
- **Going back or closing is the chevron-left icon** (`ChevronLeftIcon`, orange, size 28, in a 32 px tall row at
  the top left). Never a "close" or "back" button, never the word "close". Used on the word card, on "add new word"
  (Study), on the Map's word list and on the page one level down from Profile (Credits); Profile itself is a tab and has no chevron.
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
- **Nothing pops.** Whatever appears or disappears (a menu, an overlay card, a page, a row that opens, the next
  onboarding step) fades in and out (about 160 to 260 ms) with `entering` and `exiting` or a layout transition. A
  new menu, card or page gets the same.
- **Interface text is lowercase** (German words keep their capitals). No full stops at the end of a short line.
- **One main button per screen**, orange (`Button`, primary). A second, quieter one is `ghost`. Dismissing is not
  a button's job (see the first rule).
- **Messages that can be undone** are a plate at the top, under the header (`UndoToast`), never inside the circle.
- **No tutorials.** The gesture is taught once, on the practice screen; after that only the first-visit cards.
- The look: deep navy `#0C1927`, light ink, one orange accent, Figtree (`src/theme.ts`).

## Components (`src/components/`)
| Component | What it is | Used on |
|---|---|---|
| `Button` | orange main button, or `ghost` | everywhere |
| `TabHeader` | the title row (title left, optional `center` select, status or tools right); `onTitleLongPress` is a testing hook | Explore, Study, Map, Study session |
| `ExploreControls` | `ExploreTitle` ("explore" with the way of exploring, by theme the topic, the level and the kind of words, as glass pills next to it), the filter icon and the menus | Explore |
| `OnboardingProgress` | the thin progress bar at the top of the first-run screens (animates between steps) | first run |
| `StatusRing` | a word's state as a circle (new, shaky, getting there, learned) | word rows, word cards, "add new word" |
| `FallingStar` | the falling star drawn on the welcome screen (drifts slowly) | welcome |
| `DontKnowButton` | the small cross in the circle, under the word: "i don't know this word at all" | Explore, Study test, practice |
| `WordRow` | a row of a word list: article + word, meaning, status ring, bin | Study list, the Map's sheet |
| `CardPager` | the swipeable stack of word cards over a list (swipe up next, down back, chevron closes) | Study list, the Map's sheet |
| `Avatar` | the user's initial in a round badge with an orange rim | Profile |
| `Icons` | `ExploreIcon`, `StudyIcon`, `MapIcon`, `LookIcon`, `SwipeUpIcon`, `TapIcon`, `TrashIcon`, `SortIcon`, `SearchIcon`, `ChevronLeftIcon` (back), `ChevronRightIcon` (a row that opens a page), `ChevronDownIcon`, `PlusIcon`, `XIcon`, `ProfileIcon` | tab bar and screens |
| `FloatingTabBar` | the pill with four tabs (Explore, Study, Map, Profile); `useTabBarSpace()` says how much room to leave | tabs |
| `WordFace` | the German word inside the circle (article above, lemma below) | the circle |
| `Translation` | the English meaning, sized to fit the circle | the circle |
| `FlipReveal` | what sits in the circle after rating: the translation, tap to flip to the German word | Explore, Study, Practice |
| `UndoToast` | the plate "added to study · undo" | Explore, Practice |
| `WordCard` | a word's card: topic and status ring on the top row, word, meaning, plural, words it often comes with, how common, examples | `CardPager` |
| `RevealDetails` | example and similar words under the circle after rating | Explore |
| `Ring` | a small progress ring (the counter) | the first-run test, Study session |
| `SettingToggle` | a setting that is on or off, with a line that explains it | Profile |
| `ReminderCard` | the daily reminder: a switch and the time | Profile, "nicely done" |
| `Starry` / `StarBackground` | the night sky behind every screen, one more star per rated word | everywhere |
| `KnownDust` | the stardust that floats out of the screen when a word is marked known | app root |

## The Circle (`src/circle/`)
`Circle` (the touch area is the whole working area of the screen; the circle's box sits inside it at `x`, `y`),
`useRing` (the gesture and its shared values), `StardustRing` (what you see), `geometry` (pure maths, tested).

## Screens (`src/screens/`)
Welcome (with `FallingStar`), Name, InterestsStep, Intro, Practice, QuizIntro, CalibrationDone (the first run, with the progress bar);
Explore (`ExploreView`), Study (`StudyTab`: the list in `WordsScreen` with the card pager, `AddWordScreen` for a word
of your own, the session in `StudyScreen`), Map (a topic opens as a sphere with a small card; tapping the sphere or "see words" goes one level further in, to a page with the topic's words), Profile (with
Credits one level down: a row on Profile opens it, its chevron goes back to Profile).

## Patterns worth reusing
- A drop-down select in a form: the topic in `AddWordScreen` (a field with a chevron; its list opens over what is below,
  scrolls, a dot marks the choice).
- A menu that opens from an icon: the sort menu in `WordsScreen` (a card under the icon, a dot marks the choice).
- A card that is swiped through: `CardPager` (used by the Study list and the Map's sheet; swipe up, swipe down; the
  position lives inside it so the list behind does not redraw).
- A confirmation before something is lost: `Alert.alert` with cancel and a destructive action (delete a word,
  start over).
- Permission asked only when the user turns something on (the reminder switch).
