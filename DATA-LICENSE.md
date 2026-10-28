# Licence of the word data

The code of this repository is under the MIT licence (see `LICENSE`). **The word list is different.** It is built from other people's work, under licences
that ask for credit and that the result is shared under the same terms, so it is licensed separately:

**Covered:** the word list and its derived files: `src/data/words.raw.txt`, `src/data/words.generated.ts`, `src/data/words.extra.ts`, `src/data/words.verbs.ts`,
`src/data/words.rank.ts`, and the lists in `scripts/words/` (blocklists, review patches, theme assignments). Their text, meanings, example sentences and
rankings are adapted from the sources below.

**Licence:** [Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/), with credit to the sources.

## Sources

- **Words, articles, plurals, meanings, verb forms:** [Wiktionary](https://www.wiktionary.org), through [Wiktextract](https://github.com/tatuylonen/wiktextract) and
  [kaikki.org](https://kaikki.org). CC BY-SA 4.0 (and GFDL).
- **Example sentences and the words that often go together:** [Tatoeba](https://tatoeba.org), contributed by its community. CC BY 2.0 FR.
- **How common a word is (frequency ranks):** [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave, from OpenSubtitles. CC BY-SA 4.0.

The words were also read, checked and corrected by hand (see `scripts/words/README.md`). The raw source files are not in the repository (`data-sources/` is
git-ignored; the pipeline in `scripts/words/` rebuilds the list from them).

## Not included: the Satoshi font

The app and the landing page use the typeface Satoshi (Indian Type Foundry, ITF Free Font License 2.0). Its licence does not allow passing the font files on, so
they are **not** in this repository. Get them from [Fontshare](https://www.fontshare.com/fonts/satoshi) (see `README.md`).
