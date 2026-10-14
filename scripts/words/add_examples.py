#!/usr/bin/env python3
"""Step 2: an example sentence (German + English) for every picked word.

Candidates come from Wiktionary (the entry's own examples with translation) and from Tatoeba (German
sentences that contain a form of the word and have an English translation). The best one is the one that
is short, natural and has the word as a whole token. Reads and rewrites data-sources/picked.json.
"""
import json, os, re, collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATA = os.path.join(ROOT, 'data-sources')
TOKEN = re.compile(r"[A-Za-zÄÖÜäöüß]+")

def main():
    picked = json.load(open(os.path.join(DATA, 'picked.json'), encoding='utf8'))
    need = collections.defaultdict(list)  # form (nouns: exactly as written; others: lowercased) -> picked words
    for i, w in enumerate(picked):
        for f in w['forms']:
            need[f if w['pos'] == 'noun' else f.casefold()].append(i)
    print('forms looked for:', len(need), flush=True)

    # German sentences that contain a wanted form (and are a sensible length)
    deu = {}
    hits = collections.defaultdict(list)  # picked index -> [(sentence id, text)]
    for line in open(os.path.join(DATA, 'deu_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        if not (22 <= len(text) <= 75) or text.count(' ') < 3:
            continue
        words = TOKEN.findall(text)
        found = set()
        for t in set(words) | {t.casefold() for t in words}:
            for i in need.get(t, ()):
                if picked[i]['pos'] == 'noun' and t != t.casefold() or picked[i]['pos'] != 'noun' and t == t.casefold():
                    found.add(i)
        for i in found:
            if len(hits[i]) < 60:
                hits[i].append((sid, text))
            deu[sid] = text
    print('german sentences kept:', len(deu), flush=True)

    # their English translations
    wanted = {sid for lst in hits.values() for sid, _ in lst}
    trans = collections.defaultdict(list)
    for line in open(os.path.join(DATA, 'deu-eng_links.tsv'), encoding='utf8'):
        a, b = line.rstrip('\n').split('\t')
        if a in wanted:
            trans[a].append(b)
    eng_ids = {b for lst in trans.values() for b in lst}
    eng = {}
    for line in open(os.path.join(DATA, 'eng_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        if sid in eng_ids:
            eng[sid] = text

    def score(de, en, forms):
        n = len(de)
        s = -abs(n - 42)
        words = len(de.split())
        if words < 4 or words > 10: s -= 25
        if not re.search(r'[.!?]$', de): s -= 20
        if re.search(r'["„“”()]', de + en): s -= 15
        if re.search(r'\b(Tom|Mary|Maria|John|Boston)\b', de): s -= 12  # Tatoeba's favourite names: fine, but a little dull
        return s

    stats = collections.Counter()
    used = set()  # a German sentence is used for one word only
    for i, w in enumerate(picked):
        forms = {f.casefold() for f in w['forms']}
        cands = []
        for de, en in w.get('examples', []):
            toks = TOKEN.findall(de)
            ok = bool(set(w['forms']) & set(toks)) if w['pos'] == 'noun' else bool(forms & {t.casefold() for t in toks})
            if ok:
                cands.append((score(de, en, forms) + 6, de, en, 'wiktionary'))
        for sid, de in hits.get(i, []):
            for eid in trans.get(sid, []):
                en = eng.get(eid)
                if en and len(en) <= 90:
                    cands.append((score(de, en, forms), de, en, 'tatoeba'))
        cands = [c for c in cands if c[1] not in used]
        if cands:
            cands.sort(reverse=True)
            _, de, en, src = cands[0]
            used.add(de)
            w['example'] = {'de': de, 'en': en, 'source': src}
            stats[src] += 1
        else:
            stats['none'] += 1
    json.dump(picked, open(os.path.join(DATA, 'picked.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('examples:', dict(stats), flush=True)

if __name__ == '__main__':
    main()
