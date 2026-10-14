# How the word list is made

The app's words live in `src/data/words.raw.txt` (and the 33 hand-written ones in `words.core.ts`).
`npm run build:words` turns the raw file into `words.generated.ts`. The raw file is made by a small pipeline,
run once per batch of words. Nothing in here runs inside the app.

Raw data (not in git, in `data-sources/`): a frequency list of German word forms (hermitdave/FrequencyWords,
from OpenSubtitles), Tatoeba sentences (German, English, and the links between them), and one Wiktionary
entry per word (from kaikki.org, cached in `data-sources/wikt/`).

1. `pick_lemmas.py`: goes down the frequency list, looks each form up in Wiktionary, resolves it to its
   dictionary form (gehe to gehen), keeps nouns, verbs, adjectives and adverbs, and fills a quota per
   difficulty tier. The tier is the word's place in the frequency list (up to 600 = 1, 1,800 = 2, 4,000 = 3,
   8,000 = 4, 16,000 = 5, beyond = 6). It also takes the article, plural and English meaning from Wiktionary.
2. `wishlist.py`: the same for words chosen by theme (the frequency list holds few topic words: animals,
   clothes, nature). Edit the lists in the file.
3. `add_examples.py`: an example sentence with an English translation for each word, from Wiktionary or
   Tatoeba, short and natural, the word as a whole token; no sentence is used twice.
4. By hand: read `data-sources/review.txt` and write down, for every word, the theme number (1 to 24, in the
   order of the themes in the raw file) or leave it out (`data-sources/themes_part*.txt`, `fixes.txt` for
   corrected meanings). Words chosen by theme already have their theme.
5. `retier.py --apply`: gives the words that are already in the raw file their tier from the same list.
6. `compose_raw.py`: puts the chosen words into their themes in the raw file; then `npm run build:words`.
7. `rank_table.py`: writes `src/data/words.rank.ts` (how common each word is), used by Explore's usefulness mode.

Licences: Wiktionary text is CC BY-SA, Tatoeba is CC BY 2.0 FR (some CC0), the frequency list is CC BY-SA 4.0
(to be checked again before release). The app needs a credits screen that names all three.
