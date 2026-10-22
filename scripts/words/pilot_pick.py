#!/usr/bin/env python3
"""Picks new words from the frequency list with the checks that the review of 2026-10-22 showed were needed.

Goes down data-sources/de_50k.txt (word forms, most common first), resolves each form to its dictionary word (Wiktionary, cached in
data-sources/wikt/) and keeps nouns (with article), verbs, adjectives and adverbs that are not in the app yet. A word is dropped when:
  * it shares its spelling with another word (Wolle / wolle = wollen, schick = imperative of schicken, Reis / Reise): "homograph";
  * it is a participle used as an adjective (gebraucht), a nominalisation (der Schöne), a comparative or another inflected form;
  * its first meaning is a grammar note, is cut off ("As a copulative verb:"), or is tagged vulgar, archaic, dialect or abbreviation;
  * it has no good example: 4-10 words, 22-75 characters, whole word, correct spelling of the word, a translation, no names, no
    vulgar, violent or sad words (the filters of extra_info.py), no quotes or digits, and the word of the example is not a form of
    another word;
  * it was considered and left out in the first round (data-sources/picked.json words that are not in the app).
The tier comes from the rank in the list like for the older words. Writes data-sources/pilot.json (the words, in order of rank) and
data-sources/pilot_rejects.tsv (word, reason).

  python3 scripts/words/pilot_pick.py [--count 1000] [--skip-forms N] [--limit-forms N]
"""
import collections, difflib, json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(__file__))
import pick_lemmas as P
from compose_raw import slug
from extra_info import STOCK_NAMES, SENSITIVE, VULGAR

TOKEN = re.compile(r"[A-Za-zÄÖÜäöüß]+")
BAD_GLOSS = re.compile(r"(?i)^(inflection|nominali[sz]ation|substantivi[sz]ation|alternative|obsolete|dated|abbreviation|initialism|acronym|"
                       r"comparative|superlative|present participle|past participle|plural of|genitive|dative|accusative|diminutive|"
                       r"agent noun|gerund|used to|as a |in the |forms the|used as|only used|used in|a prefix|alternative)")
PRONOMINAL = re.compile(r"^(da|wo|hier)(r)?(an|auf|aus|bei|durch|für|gegen|hinter|in|mit|nach|neben|über|um|unter|von|vor|zu|zwischen)$")

def existing_slugs():
    have = set()
    for lemma in P.existing_lemmas():
        have.add(slug(lemma))
        have.add(slug(lemma.replace('sich ', '', 1)))
    return have

def previously_left_out(have_lemmas):
    path = os.path.join(P.DATA, 'picked.json')
    out = set()
    if os.path.exists(path):
        for w in json.load(open(path, encoding='utf8')):
            if w['lemma'].casefold() not in have_lemmas:
                out.add(slug(w['lemma']))
    return out

def entries(word):
    """Every German Wiktionary entry that is spelled like this (in the spelling as given, lower case and capitalised)."""
    out = []
    for v in {word, word.lower(), word[:1].upper() + word[1:]}:
        try:
            out += [e for e in P.fetch(v) if e.get('lang_code', 'de') == 'de']
        except Exception:
            pass
    return out

def homograph(record):
    """None, 'true' (another word is spelled the same: drop the word) or 'inflated' (a noun whose lower-case spelling is a form of
    another word: wolle = wollen. The noun is fine, but its rank in the list is inflated, so the rank is estimated from the sentences).
    An entry that is only a form of this very word (the noun "das Träumen"), a name (a town, a surname) or, for a verb or an adjective,
    a capitalised noun is no clash: a lower-case word in a sentence is never that noun."""
    lemma, pos = record['lemma'], record['pos']
    own = {lemma, lemma.lower(), lemma[:1].upper() + lemma[1:]}
    kind, same_nouns = None, []
    for e in entries(lemma):
        if e.get('pos') == 'name':
            continue
        if e.get('word') == lemma and e.get('pos') == pos and not P.is_form_of(e):
            if pos == 'noun':
                same_nouns.append(e)
            continue
        if P.is_form_of(e):
            targets = {fo.get('word') for s in e.get('senses', []) for fo in (s.get('form_of') or s.get('alt_of') or []) if fo.get('word')}
            if targets and targets <= own:
                continue
        if pos != 'noun':
            if e.get('word') == lemma and not (pos in ('adj', 'adv') and e.get('pos') in ('adj', 'adv') and not P.is_form_of(e)):
                return 'true'  # (an adjective that is also an adverb is one word)
            continue          # a capitalised noun is spelled like the verb: harmless
        if e.get('word') == lemma:
            return 'true'     # a second noun with this spelling (der / die See)
        kind = 'inflated'     # the lower-case spelling is a form of another word
    if len({tuple(sorted(set(t for s in e.get('senses', []) for t in s.get('tags', []) if t in ('masculine', 'feminine', 'neuter')))) for e in same_nouns}) > 1:
        return 'true'
    return kind

def participle_adjective(record):
    lemma = record['lemma']
    if record['pos'] != 'adj':
        return False
    stems = set()
    if lemma.startswith('ge') and lemma.endswith('t'):
        stems.add(lemma[2:-1] + 'en')
    if lemma.endswith('t'):
        stems.add(lemma[:-1] + 'en')
    if lemma.startswith('ge') and lemma.endswith('en'):
        stems.add(lemma[2:])
    for v in stems:
        for e in entries(v):
            if e.get('pos') == 'verb' and not P.is_form_of(e):
                return True
    return False

def bad_gloss(g):
    return (not g or len(g) < 3 or BAD_GLOSS.search(g) is not None or g.endswith(':') or '...' in g or '[' in g
            or re.search(r'\bof\b.*\b(verb|noun|adjective)\b', g) is not None)

def reflexive(entry_senses):
    return any('reflexive' in set(s.get('tags', [])) for s in entry_senses[:2])

def accept(record, entry_cache):
    """None when the word is good, otherwise the reason."""
    lemma, pos = record['lemma'], record['pos']
    if re.search(r'\b(Briton|Englishman|given name|surname|nickname)\b', record['en']):
        return 'a name'
    if PRONOMINAL.match(lemma):
        return 'pronominal adverb'
    if bad_gloss(record['en']):
        return 'gloss: ' + record['en']
    if participle_adjective(record):
        return 'participle used as adjective'
    kind = homograph(record)
    if kind == 'true':
        return 'homograph'
    record['rank_unreliable'] = kind == 'inflated'
    for e in entries(lemma):
        if e.get('word') == lemma and e.get('pos') == pos and not P.is_form_of(e) and reflexive(e.get('senses', [])):
            return 'reflexive verb (to do later: needs "sich" and a reflexive example)'
    return None

def forms_for_matching(record):
    """Single-token forms, and (stem, particle) pairs for separable verbs."""
    singles, pairs = set(), []
    for f in record['forms']:
        f = f.strip()
        if ' ' in f:
            parts = f.split()
            if len(parts) == 2 and all(p.isalpha() for p in parts):
                pairs.append((parts[0], parts[1]))
        elif f.isalpha() and len(f) >= 3:
            singles.add(f)
    singles.add(record['lemma'])
    return singles, pairs

def sentence_ok(de, en):
    if STOCK_NAMES.search(de) or STOCK_NAMES.search(en) or VULGAR.search(de) or SENSITIVE.search(de):
        return False
    if re.search(r'["„“”«»()\[\]\d:;/]', de + en) or not re.search(r'[.!?]$', de) or re.search(r'(\.\.\.|…)$', en):
        return False
    n = len(de.split())
    return 4 <= n <= 10 and 22 <= len(de) <= 75 and len(en) <= 90

def main():
    count = int(sys.argv[sys.argv.index('--count') + 1]) if '--count' in sys.argv else 1000
    limit = int(sys.argv[sys.argv.index('--limit-forms') + 1]) if '--limit-forms' in sys.argv else 60000
    freq = [l.split()[0] for l in open(os.path.join(P.DATA, 'de_50k.txt'), encoding='utf8')]
    rank_of = {w: i + 1 for i, w in enumerate(freq)}
    have_lemmas = P.existing_lemmas()
    have = existing_slugs()
    left_out = previously_left_out(have_lemmas)
    rejects = collections.OrderedDict()
    cands, seen = collections.OrderedDict(), set()

    skip = int(sys.argv[sys.argv.index('--skip-forms') + 1]) if '--skip-forms' in sys.argv else 0
    forms = [w for w in freq if re.fullmatch(r"[a-zäöüß]{3,}", w)][skip:limit]
    print('forms to resolve:', len(forms), flush=True)

    def work(form):
        try:
            return form, P.resolve(form), None
        except Exception as ex:
            return form, [], str(ex)

    target = int(count * 1.6)  # more than needed: some words lose their example later
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as pool:
        for n in range(0, len(forms), 120):
            batch = forms[n:n + 120]
            for form, recs, err in pool.map(work, batch):
                for r in recs:
                    key = slug(r['lemma'])
                    if key in have or key in seen:
                        continue
                    seen.add(key)
                    if key in left_out:
                        rejects[r['lemma']] = 'left out in the first round'
                        continue
                    r['rank'] = min(rank_of.get(form, 10**9), rank_of.get(r['lemma'].casefold(), 10**9))
                    why = accept(r, None)
                    if why:
                        rejects[r['lemma']] = why
                    else:
                        cands[r['lemma']] = r
            print(f'{n + len(batch)}/{len(forms)} forms, {len(cands)} candidates, {len(rejects)} dropped, {int(time.time() - t0)}s', flush=True)
            if len(cands) >= target:
                break

    # examples from Tatoeba
    wanted = collections.defaultdict(set)  # token -> candidate lemmas (nouns: exact capitalised spelling; others: lower case)
    sep = collections.defaultdict(list)    # stem token -> candidates (separable verbs)
    info = {}
    for lemma, r in cands.items():
        singles, pairs = forms_for_matching(r)
        info[lemma] = (singles, pairs)
        for f in singles:
            wanted[f if r['pos'] == 'noun' else f.casefold()].add(lemma)
        for stem, part in pairs:
            sep[stem.casefold()].append((lemma, part.casefold()))
    # how often each noun stands in a short sentence (capitalised, not at the start), to estimate the rank of nouns whose rank is inflated
    watch = set()
    known = []  # (count key, rank) of the nouns already in the app
    for line in open(os.path.join(P.ROOT, 'src/data/words.raw.txt'), encoding='utf8').read().split('\n'):
        f = line.split('|')
        if len(f) == 8 and re.fullmatch(r'[1-6]', f[0]) and f[1]:
            watch |= {f[2], f[3]} - {''}
            known.append((f[2], f[3]))
    for r in cands.values():
        if r['pos'] == 'noun':
            watch |= {r['lemma'], r['plural']} - {''}
    noun_count = collections.Counter()
    hits = collections.defaultdict(list)
    for line in open(os.path.join(P.DATA, 'deu_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        if not (22 <= len(text) <= 75):
            continue
        toks = TOKEN.findall(text)
        if not (4 <= len(toks) <= 10):
            continue
        for t in set(toks[1:]) & watch:
            noun_count[t] += 1
        low = [t.casefold() for t in toks]
        found = {}
        for i, t in enumerate(toks):
            for lemma in wanted.get(t, ()):
                if cands[lemma]['pos'] == 'noun':
                    found.setdefault(lemma, t)
            for lemma in wanted.get(t.casefold(), ()):
                if cands[lemma]['pos'] != 'noun' and (t[:1].islower() or i == 0):
                    found.setdefault(lemma, t)
            for lemma, part in sep.get(t.casefold(), ()):
                if part in low[i + 1:]:
                    found.setdefault(lemma, t)
        for lemma, tok in found.items():
            if len(hits[lemma]) < 40:
                hits[lemma].append((sid, text, tok))
    need = {sid for lst in hits.values() for sid, _, _ in lst}
    trans = collections.defaultdict(list)
    for line in open(os.path.join(P.DATA, 'deu-eng_links.tsv'), encoding='utf8'):
        a, b = line.rstrip('\n').split('\t')
        if a in need:
            trans[a].append(b)
    eng_ids = {b for lst in trans.values() for b in lst}
    eng = {}
    for line in open(os.path.join(P.DATA, 'eng_sentences.tsv'), encoding='utf8'):
        sid, _, text = line.rstrip('\n').split('\t')
        if sid in eng_ids:
            eng[sid] = text

    # calibration: the median rank of the known nouns for each size of count (log scale)
    bins = collections.defaultdict(list)
    for lemma, plural in known:
        c = noun_count[lemma] + (noun_count[plural] if plural else 0)
        rk = rank_of.get(lemma.casefold())
        if rk:
            bins[c.bit_length()].append(rk)
    def estimate(c):
        b = c.bit_length()
        for d in (0, 1, -1, 2, -2):
            if bins.get(b + d):
                return sorted(bins[b + d])[len(bins[b + d]) // 2]
        return 10**9

    used = set()
    result = []
    for lemma, r in cands.items():
        options = []
        for sid, de, tok in hits.get(lemma, []):
            if de in used:
                continue
            for eid in trans.get(sid, []):
                en = eng.get(eid)
                if en and sentence_ok(de, en):
                    options.append((-abs(len(de) - 42), de, en, tok))
        options.sort(reverse=True)
        chosen = None
        for _, de, en, tok in options:
            # the word of the example must not be a form of another word (Wollen Sie ... is the verb, not the noun Wolle)
            clash = [e for e in entries(tok) if not (e.get('word') == lemma or lemma in [fo.get('word') for s in e.get('senses', []) for fo in (s.get('form_of') or [])])]
            if r['pos'] == 'noun' or not clash:
                if r['pos'] == 'noun' and any(e.get('pos') != 'noun' for e in entries(tok) if e.get('word', '').casefold() == tok.casefold() and e.get('word') != tok):
                    continue
                chosen = (de, en, tok)
                break
        if not chosen:
            rejects[lemma] = 'no good example sentence'
            continue
        used.add(chosen[0])
        r['example'] = {'de': chosen[0], 'en': chosen[1], 'source': 'tatoeba'}
        r['rank'] = min(r['rank'], rank_of.get(chosen[2].casefold(), 10**9))
        if r.get('rank_unreliable'):
            c = noun_count[lemma] + (noun_count[r['plural']] if r['plural'] else 0)
            r['rank'] = max(r['rank'], estimate(c))
        r['tier'] = P.tier_of(r['rank'])
        r['reflexive'] = False
        result.append(r)
    result.sort(key=lambda r: r['rank'])
    result = result[:count]
    json.dump(result, open(os.path.join(P.DATA, 'pilot.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    with open(os.path.join(P.DATA, 'pilot_rejects.tsv'), 'w', encoding='utf8') as fh:
        for k, v in rejects.items():
            fh.write(f'{k}\t{v}\n')
    print('words:', len(result), '| tiers:', dict(collections.Counter(r['tier'] for r in result)), '| dropped:', len(rejects),
          dict(collections.Counter(v.split(':')[0] for v in rejects.values())), flush=True)

if __name__ == '__main__':
    main()
