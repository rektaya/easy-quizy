#!/usr/bin/env python3
"""Step 8: extra things to show on a word's card, from Tatoeba.

* `together`: the words of the list that most often stand in the same sentence as this one (a cosine score over
  short sentences), for "often comes with ...".
* `examples`: up to two more example sentences (German and English), different from the one the word already has.

Writes src/data/words.extra.ts. Needs data-sources/ (the Tatoeba files) and the Wiktionary cache.
Run after the word list changes: python3 scripts/words/extra_info.py
"""
import collections, difflib, math, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT, DATA, resolve
from compose_raw import slug

TOKEN = re.compile(r"[A-Za-zÄÖÜäöüß]+")

# Small words that are also a rare verb's inflected form in the dictionary ("mal" is an imperative of malen, "gar" a form of garen,
# "halt" of halten), but in a sentence they are the particles of "noch mal", "gar nicht", "ist halt so". Never counted for the verb.
PARTICLE_FORMS = {'mal', 'gar', 'halt'}
# vulgar or sexual words: a sentence with one is never an example (the app is for learning, not for shock)
VULGAR = re.compile(r"(?i)(scheiß|scheiss|fick|arsch|kack|wichs|hure|nutte|schlampe|titten|fotze|schwanz|pimmel|wixx|nazi|hitler|vergewalt|bumsen|pisse|pissen|verdammt|verfickt|idiot|blöd|dumm)")
STOCK_NAMES = re.compile(r"\b(Tom|Mary|Maria|John|Boston|Tatoeba|Fyodor|Sysko|Bob|Paul|Hiroko|Amy|Antina|Tusnelda|Layla|Sami|Tim|David|Yoko|Kimura|Erkin|Mike|Takashi|Kelly|Miho|Peter|Dean|Sara|Anne|Ann|Jiro|Taro|Helen|Shai|Muiriel|Samuel|Mayuko|Taninna|Skura|Leon|Viviana|Wladimir|Janni|Perry|Stephen King|Justin Bieber|Hu Jintao|Pierce|James|Ziri|Liisa|Ken|Jack|Jane|Thomas|Haschimoto|Kensaku|Markku|Midori|Lucario|Frau Schneider)(s|\u2019s)?\b")
# sad, violent or sexual sentences are never examples (the headword itself is excused in main(), e.g. Krieg, Waffe)
SENSITIVE = re.compile(r"(?i)(getötet|töten|tötet|ermordet|mord\b|erschossen|erschiess|gestorben|starb|verstorben|selbstmord|suizid|terror|bombe|vergewalt|folter|sklaverei|erbrach|betrog|betrügt|FKK|saufen|besoffen|leiche|kannibal|todesstrafe|leichte mädchen|schnaps|Satz \d{3,}|furigana|CC-BY|Kriegstreiber|abartig|ward\b|bukst|Netzpost|im Stich)")

# Very common words that are partners of everything ("das Kind ... haben"): useless as "often together with".
GENERIC_PARTNERS = {'haben', 'sein', 'werden', 'koennen', 'muessen', 'sollen', 'wollen', 'duerfen', 'moegen', 'tun', 'machen', 'sagen', 'gehen',
                    'kommen', 'geben', 'nehmen', 'meinen', 'lassen', 'noch', 'nur', 'auch', 'schon', 'wieder', 'mehr', 'sehr', 'viel', 'wenig',
                    'immer', 'nie', 'dann', 'jetzt', 'hier', 'heute', 'ganz', 'gut', 'bitte', 'weg', 'zurueck', 'jahr', 'tag', 'zeit', 'mal',
                    'woche', 'morgen', 'stehen', 'bleiben', 'sehen', 'finden', 'brauchen', 'wissen', 'noch'}
# possessive pronouns are written like the verbs meinen and sein (meine, meinen, seine ...): never counted for the verb
POSSESSIVE_FORMS = {'meinen': {'mein', 'meine', 'meinen', 'meiner', 'meinem', 'meines'},
                    'sein': {'sein', 'seine', 'seinen', 'seiner', 'seinem', 'seines'}}

def load_word_blocklist():
    """scripts/words/extras_blocklist.txt: `id both|extras|together` for words whose Tatoeba sentences are about another word (Herd / Herde)."""
    path = os.path.join(os.path.dirname(__file__), 'extras_blocklist.txt')
    out = {}
    if os.path.exists(path):
        for l in open(path, encoding='utf8'):
            l = l.split('#')[0].strip()
            if l:
                wid, what = l.split()
                out[wid] = what
    return out

def load_blocked():
    """Tatoeba sentences with typos or errors, never used as examples (scripts/words/bad_sentences.txt, one per line)."""
    path = os.path.join(os.path.dirname(__file__), 'bad_sentences.txt')
    if not os.path.exists(path):
        return set()
    return {l.strip() for l in open(path, encoding='utf8') if l.strip() and not l.startswith('#')}

def load_words():
    words = []  # (id, lemma, article, pos_guess_noun)
    for line in open(os.path.join(ROOT, 'src/data/words.raw.txt'), encoding='utf8').read().split('\n'):
        f = line.split('|')
        if len(f) == 8 and re.fullmatch(r'[1-6]', f[0]):
            words.append((slug(f[2]), f[2].replace('sich ', '', 1), f[1], f[5], f[6]))
    core = open(os.path.join(ROOT, 'src/data/words.core.ts'), encoding='utf8').read()
    for m in re.finditer(r"id:\s*'([^']+)',\s*lemma:\s*'([^']+)'(?:,\s*article:\s*'([^']*)')?", core):
        words.append((m.group(1), m.group(2), m.group(3) or '', '', ''))
    return words

def main():
    words = load_words()
    print('words:', len(words), flush=True)
    forms = {}  # id -> set of exact forms
    for i, (wid, lemma, article, _, _) in enumerate(words):
        fs = {lemma}
        try:
            for r in resolve(lemma):
                if r['lemma'] == lemma:
                    fs |= set(r['forms'])
        except Exception:
            pass
        forms[wid] = fs
        if i % 200 == 0:
            print('forms', i, flush=True)
    noun = {wid: bool(a) for wid, _, a, _, _ in words}
    lemma_of_early = {wid: lemma for wid, lemma, _, _, _ in words}
    # token -> word ids (nouns: the capitalised spelling; others: lower case)
    index = collections.defaultdict(set)
    for wid, fs in forms.items():
        for f in fs:
            if f.casefold() in PARTICLE_FORMS and f.casefold() != lemma_of_early[wid].casefold():
                continue
            if f.casefold() in POSSESSIVE_FORMS.get(wid, ()):
                continue
            index[f if noun[wid] else f.casefold()].add(wid)
    main_example = {wid: de for wid, _, _, de, _ in words}
    lemma_of = {wid: lemma for wid, lemma, _, _, _ in words}
    blocked = load_blocked()
    word_block = load_word_blocklist()
    reflexive = set()  # reflexive verbs ("sich legen"): a sentence only counts for them when it has a reflexive pronoun
    for line in open(os.path.join(ROOT, 'src/data/words.raw.txt'), encoding='utf8').read().split('\n'):
        f = line.split('|')
        if len(f) == 8 and re.fullmatch(r'[1-6]', f[0]) and f[2].startswith('sich '):
            reflexive.add(slug(f[2]))
    REFLEXIVE_PRONOUNS = {'mich', 'dich', 'sich', 'uns', 'euch'}

    sent_words, sent_text = {}, {}
    count = collections.Counter()
    pair = collections.Counter()
    for line in open(os.path.join(DATA, 'deu_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        toks = TOKEN.findall(text)
        if not (4 <= len(toks) <= 12) or len(text) > 80:
            continue
        ids = set()
        for pos, t in enumerate(toks):
            cands = set()
            for key in (t, t.casefold()):
                for wid in index.get(key, ()):
                    # a noun is a capitalised token; any other word is a lower-case token (or the first one of the sentence),
                    # so the noun "Mal" is not the verb "malen" (whose imperative is "mal")
                    if (noun[wid] and key == t and t[:1].isupper()) or (not noun[wid] and key == t.casefold() and (t[:1].islower() or pos == 0)):
                        cands.add(wid)
            # a token that IS the dictionary form of a word belongs to that word, not to the words that only share an inflected
            # form with it ("schon" is the adverb schon, not the verb schonen, whose imperative it is)
            # the first word of a sentence is capitalised, so "Würden Sie bitte ..." must not count as the noun Würde: at the start of
            # a sentence a token that is an inflected form of a verb or adjective (not its dictionary form) is that word, not a noun
            if pos == 0 and any(noun[w] for w in cands) and any(not noun[w] for w in cands):
                cands = {w for w in cands if not noun[w] or lemma_of[w] == t}
            exact = {w for w in cands if lemma_of[w] == t or (not noun[w] and lemma_of[w].casefold() == t.casefold())}
            ids |= exact or cands
        if reflexive and not ({t.casefold() for t in toks} & REFLEXIVE_PRONOUNS):
            ids -= reflexive
        ids -= {w for w in ids if word_block.get(w) == 'both'}
        if not ids:
            continue
        sent_words[sid] = ids
        sent_text[sid] = text
        for a in ids:
            count[a] += 1
        if len(ids) <= 6:
            ids_l = sorted(ids)
            for x in range(len(ids_l)):
                for y in range(x + 1, len(ids_l)):
                    pair[(ids_l[x], ids_l[y])] += 1
    print('sentences kept:', len(sent_words), flush=True)

    # partners by a cosine score
    partners = collections.defaultdict(list)
    for (a, b), n in pair.items():
        if n < 5:
            continue
        if word_block.get(a) in ('both', 'together') or word_block.get(b) in ('both', 'together'):
            continue
        if lemma_of[b].casefold() in {f.casefold() for f in forms[a]} or lemma_of[a].casefold() in {f.casefold() for f in forms[b]}:
            continue  # one is a form of the other (schon / schonen, mal / malen)
        la, lb = lemma_of[a].casefold().replace('sich ', ''), lemma_of[b].casefold().replace('sich ', '')
        if (len(la) >= 4 and la in lb) or (len(lb) >= 4 and lb in la):
            continue  # one is inside the other (Fledermaus / Maus)
        score = n / math.sqrt(count[a] * count[b])
        if b not in GENERIC_PARTNERS:
            partners[a].append((score, n, b))
        if a not in GENERIC_PARTNERS:
            partners[b].append((score, n, a))
    together = {}
    for wid, lst in partners.items():
        lst.sort(reverse=True)
        together[wid] = [b for _, _, b in lst[:4]]

    # extra examples, with their English translations
    wanted = collections.defaultdict(list)
    for sid, ids in sent_words.items():
        for wid in ids:
            wanted[wid].append(sid)
    need_ids = set()
    for wid, sids in wanted.items():
        wanted[wid] = [s for s in sids if sent_text[s] != main_example.get(wid)][:60]
        need_ids.update(wanted[wid])
    trans = collections.defaultdict(list)
    for line in open(os.path.join(DATA, 'deu-eng_links.tsv'), encoding='utf8'):
        a, b = line.rstrip('\n').split('\t')
        if a in need_ids:
            trans[a].append(b)
    eng_ids = {b for lst in trans.values() for b in lst}
    eng = {}
    for line in open(os.path.join(DATA, 'eng_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        if sid in eng_ids:
            eng[sid] = text

    def score(de, en):
        s = -abs(len(de) - 42)
        if not re.search(r'[.!?]$', de): s -= 20
        if re.search(r'["„“”()]', de + en): s -= 15
        if re.search(r'\b(Tom|Mary|Maria|John|Boston)\b', de): s -= 8
        return s

    used = set(main_example.values())
    examples = {}
    for wid, _, _, _, _ in words:
        cands = []
        if word_block.get(wid) in ('both', 'extras'):
            continue
        for sid in wanted.get(wid, []):
            de = sent_text[sid]
            if de in used or de in blocked:
                continue
            if STOCK_NAMES.search(de) or VULGAR.search(de) or SENSITIVE.search(de):
                continue
            if difflib.SequenceMatcher(None, de, main_example.get(wid, '')).ratio() >= 0.6:
                continue  # too like the main example of the word
            for eid in trans.get(sid, []):
                en = eng.get(eid)
                # no names, no translation that is cut off ("What to tell..."), nothing too long
                if en and len(en) <= 90 and not STOCK_NAMES.search(en) and not re.search(r'(\.\.\.|…)$', en):
                    cands.append((score(de, en), de, en))
        cands.sort(reverse=True)
        picked = []
        for _, de, en in cands:
            # the two extra examples must differ: not the same sentence with one word changed
            if de not in used and all(de != p[0] and difflib.SequenceMatcher(None, de, p[0]).ratio() < 0.6 for p in picked):
                picked.append((de, en))
                used.add(de)
            if len(picked) == 2:
                break
        if picked:
            examples[wid] = picked

    def js(s):
        return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"
    lines = []
    for wid, _, _, _, _ in sorted(words):
        parts = []
        if together.get(wid):
            parts.append('together: [' + ', '.join(js(x) for x in together[wid]) + ']')
        if examples.get(wid):
            parts.append('examples: [' + ', '.join('[' + js(de) + ', ' + js(en) + ']' for de, en in examples[wid]) + ']')
        if parts:
            lines.append(f"  {js(wid)}: {{ {', '.join(parts)} }},")
    open(os.path.join(ROOT, 'src/data/words.extra.ts'), 'w', encoding='utf8').write(
        "// GENERATED by scripts/words/extra_info.py. Do not edit by hand.\n"
        "// For a word's card, from Tatoeba: `together` are the words of the list that most often stand in the same\n"
        "// sentence as it (ids), `examples` are up to two more example sentences [German, English].\n"
        "export type Extra = { together?: string[]; examples?: [string, string][] };\n"
        "export const EXTRA: Record<string, Extra> = {\n" + '\n'.join(lines) + "\n};\n")
    print('words with partners:', len(together), 'with extra examples:', len(examples), flush=True)

if __name__ == '__main__':
    main()
