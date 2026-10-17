#!/usr/bin/env python3
"""Step 8: extra things to show on a word's card, from Tatoeba.

* `together`: the words of the list that most often stand in the same sentence as this one (a cosine score over
  short sentences), for "often comes with ...".
* `examples`: up to two more example sentences (German and English), different from the one the word already has.

Writes src/data/words.extra.ts. Needs data-sources/ (the Tatoeba files) and the Wiktionary cache.
Run after the word list changes: python3 scripts/words/extra_info.py
"""
import collections, math, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT, DATA, resolve
from compose_raw import slug

TOKEN = re.compile(r"[A-Za-zÄÖÜäöüß]+")

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
    # token -> word ids (nouns: the capitalised spelling; others: lower case)
    index = collections.defaultdict(set)
    for wid, fs in forms.items():
        for f in fs:
            index[f if noun[wid] else f.casefold()].add(wid)
    main_example = {wid: de for wid, _, _, de, _ in words}

    sent_words, sent_text = {}, {}
    count = collections.Counter()
    pair = collections.Counter()
    for line in open(os.path.join(DATA, 'deu_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        toks = TOKEN.findall(text)
        if not (4 <= len(toks) <= 12) or len(text) > 80:
            continue
        ids = set()
        for t in toks:
            for key in (t, t.casefold()):
                for wid in index.get(key, ()):
                    if (noun[wid] and key == t and t[:1].isupper()) or (not noun[wid] and key == t.casefold()):
                        ids.add(wid)
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
        if n < 3:
            continue
        score = n / math.sqrt(count[a] * count[b])
        partners[a].append((score, n, b))
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
        for sid in wanted.get(wid, []):
            de = sent_text[sid]
            if de in used:
                continue
            for eid in trans.get(sid, []):
                en = eng.get(eid)
                if en and len(en) <= 90:
                    cands.append((score(de, en), de, en))
        cands.sort(reverse=True)
        picked = []
        for _, de, en in cands:
            if de not in used and all(de != p[0] for p in picked):
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
