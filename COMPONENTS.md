# Components and UI patterns

The list of what already exists, and the rules for using it. **Read this before adding or changing any
screen.** If a pattern is here, use it; do not invent a second one (for example a "close" button where the
back chevron already exists). If something is missing, say so and ask before adding a new pattern.

## Rules (decided with the author)
- **Going back or closing is the chevron-left icon** (`ChevronLeftIcon`, orange, size 28, in a 32 px tall row at
  the top left). Never a "close" or "back" button, never the word "close". Used on the word card and on the pages
  one level down from Profile (Credits, Interests); Profile itself is a tab and has no chevron.
- **One title style:** `TabHeader` (22, medium, top left) for Explore, Study, Map and Profile. Explore's title reads as
  a sentence over two lines: "explore" in the header row, and under it, small, "by association" (when exploring by
  theme: "by theme in kitchen"): "by" and "in" are white, the choices after them are grey, and each part is a select (tap
  it; no chevron; the options in its menu are white). The
  top right of the header holds small status or tools: the filter icon, a filled funnel (Explore), the sort and search icons
  (Study), the camera button (Map), the counter (the first-run test only).
- **Choices that are not worth a screen are menus that open from an icon or a select** (the sort menu, the "explore
  by" menu, the filters). They open over everything and close with a tap anywhere else.
- **One gesture everywhere:** draw a circle to rate a word; swipe up to move on to the next word (Explore, the
  Study test) and to the next card (Study word cards; swipe down goes back). Pinch to zoom the Map.
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
| `TabHeader` | the title row (title left, status or tools right); `onTitleLongPress` is a testing hook | Explore, Study, Map, Study session |
| `ExploreControls` | the Explore title select ("explore by ..."), the filter icon, the theme row (only "by theme") and the menus | Explore |
| `Avatar` | the user's initial in a round badge with an orange rim | Profile |
| `Icons` | `ExploreIcon`, `StudyIcon`, `MapIcon`, `LookIcon`, `SwipeUpIcon`, `TapIcon`, `TrashIcon`, `SortIcon`, `SearchIcon`, `FilterIcon` (filled), `ChevronLeftIcon` (back), `ChevronRightIcon` (a row that opens a page), `ChevronDownIcon`, `ProfileIcon` | tab bar and screens |
| `FloatingTabBar` | the pill with four tabs (Explore, Study, Map, Profile); `useTabBarSpace()` says how much room to leave | tabs |
| `WordFace` | the German word inside the circle (article above, lemma below) | the circle |
| `Translation` | the English meaning, sized to fit the circle | the circle |
| `FlipReveal` | what sits in the circle after rating: the translation, tap to flip to the German word | Explore, Study, Practice |
| `UndoToast` | the plate "added to study · undo" | Explore, Practice |
| `WordCard` | a word's card: tag, word, meaning, plural, example | Study word list |
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
Name, Intro, Practice, QuizIntro, CalibrationDone (the first run); Explore (`ExploreView`), Study (`StudyTab`:
the list in `WordsScreen` with the word-card pager, the session in `StudyScreen`), Map, Profile (with Credits one
level down: a row on Profile opens it, its chevron goes back to Profile).

## Patterns worth reusing
- A menu that opens from an icon: the sort menu in `WordsScreen` (a card under the icon, a dot marks the choice).
- A card that is swiped through: `CardPager` in `WordsScreen` (swipe up, swipe down; the position lives inside it so
  the list behind does not redraw).
- A confirmation before something is lost: `Alert.alert` with cancel and a destructive action (delete a word,
  start over).
- Permission asked only when the user turns something on (the reminder switch).
