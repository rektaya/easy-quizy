#!/usr/bin/env python3
"""Step 1 of the word pipeline: pick new words from a real frequency list.

Reads data-sources/de_50k.txt (German subtitles frequency list, word forms, most frequent first),
looks each form up in Wiktionary (one small file per word from kaikki.org, cached in
data-sources/wikt/), resolves inflected forms to their dictionary form (gehe -> gehen), keeps nouns,
verbs, adjectives and adverbs, and fills a quota of new words per difficulty tier. Writes
data-sources/picked.json. Words already in the app are skipped.

Tier by the rank of the word in the list (an approximation, the list holds word forms):
  1: rank <= 600, 2: <= 1800, 3: <= 4000, 4: <= 8000, 5: <= 16000, 6: beyond.
"""
import json, os, re, random, subprocess, sys, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATA = os.path.join(ROOT, 'data-sources')
CACHE = os.path.join(DATA, 'wikt')
os.makedirs(CACHE, exist_ok=True)

TIER_EDGES = [600, 1800, 4000, 8000, 16000]  # upper rank of tiers 1..5
QUOTA = {1: 160, 2: 210, 3: 245, 4: 195, 5: 165, 6: 125}  # a little over target; some get dropped later
CONTENT = {'noun', 'verb', 'adj', 'adv'}
BAD_TAGS = {'vulgar', 'offensive', 'slang', 'dialectal', 'regional', 'archaic', 'obsolete', 'dated',
            'derogatory', 'ethnic-slur', 'abbreviation', 'initialism', 'acronym', 'Swiss', 'Austria',
            'Switzerland', 'Austrian', 'Bavarian', 'Low-German', 'poetic', 'proscribed', 'nonstandard'}

def tier_of(rank):
    for i, edge in enumerate(TIER_EDGES, 1):
        if rank <= edge:
            return i
    return 6

def existing_lemmas():
    out = set()
    raw = open(os.path.join(ROOT, 'src/data/words.raw.txt'), encoding='utf8').read().split('\n')
    for line in raw:
        if not line or line.startswith('#') or line.startswith('@') or line.startswith('##'):
            continue
        f = line.split('|')
        if len(f) == 8:
            out.add(f[2].strip().casefold())
    core = open(os.path.join(ROOT, 'src/data/words.core.ts'), encoding='utf8').read()
    out.update(m.casefold() for m in re.findall(r"lemma:\s*'([^']+)'", core))
    return out

def cache_name(word):
    return os.path.join(CACHE, ('U_' if word[:1].isupper() else 'l_') + urllib.parse.quote(word, safe=''))

def fetch(word):
    """The Wiktionary entries (list of dicts) for exactly this spelling; cached; [] when there is none."""
    path = cache_name(word)
    if os.path.exists(path):
        raw = open(path, encoding='utf8').read()
    else:
        key = f"{urllib.parse.quote(word[0])}/{urllib.parse.quote(word[:2])}/{urllib.parse.quote(word)}"
        url = f"https://kaikki.org/dictionary/German/meaning/{key}.jsonl"
        raw = None
        for attempt in range(4):
            # (curl, because the Python on this Mac has no certificate store of its own)
            res = subprocess.run(['curl', '-sSL', '--max-time', '30', '-A', 'easy-quizy-word-pipeline/1.0 (personal project)',
                                  '-w', '\n%{http_code}', url], capture_output=True)
            body, _, code = res.stdout.decode('utf8', 'replace').rpartition('\n')
            if res.returncode == 0 and code == '200':
                raw = body
                break
            if res.returncode == 0 and code == '404':
                raw = ''
                break
            time.sleep(1 + attempt)
        if raw is None:
            raise RuntimeError(f'could not fetch {url}')  # not cached: a failure is not "no entry"
        open(path, 'w', encoding='utf8').write(raw)
        time.sleep(0.15)
    return [json.loads(l) for l in raw.split('\n') if l.strip()]

def is_form_of(e):
    senses = e.get('senses', [])
    return bool(senses) and all(s.get('form_of') or s.get('alt_of') for s in senses)

def shorten(g):
    g = re.sub(r'^\([^)]*\)\s*', '', g).strip()
    g = re.sub(r'\s*\([^)]*\)', '', g).strip()
    return g

def parse_lemma_entry(e):
    """A record for one lemma entry, or None when it is not a good word for the app."""
    pos = e.get('pos')
    word = e.get('word', '')
    if pos not in CONTENT or not re.fullmatch(r"[A-Za-zÄÖÜäöüß-]{3,}", word) or word.isupper():
        return None
    senses = [s for s in e.get('senses', []) if s.get('glosses') and not s.get('form_of') and not s.get('alt_of')]
    if not senses:
        return None
    if set(senses[0].get('tags', [])) & BAD_TAGS:
        return None
    # gloss: the first meaning only (its first two short items); other meanings of the word are not for the card
    items = []
    for sense in senses[:3]:
        if set(sense.get('tags', [])) & BAD_TAGS:
            continue
        g = shorten(sense['glosses'][0])
        if g.startswith(('inflection of', 'plural of')):
            continue
        for part in re.split(r'[;,]', g):
            part = part.strip().rstrip('.')
            if part and len(part) <= 24 and part.casefold() not in [x.casefold() for x in items]:
                items.append(part)
        if items:
            break
    if not items:
        return None
    gloss = ', '.join(items[:2])
    if len(gloss) > 40:
        gloss = items[0]
    article = ''
    plural = ''
    if pos == 'noun':
        tags = set(t for s in senses[:2] for t in s.get('tags', []))
        head = ' '.join(h.get('expansion', '') for h in e.get('head_templates', []))
        if 'masculine' in tags: article = 'der'
        elif 'feminine' in tags: article = 'die'
        elif 'neuter' in tags: article = 'das'
        else:
            m = re.match(r'^\S+\s+(m|f|n)\b', head)
            article = {'m': 'der', 'f': 'die', 'n': 'das'}.get(m.group(1), '') if m else ''
        if not article:
            return None
        if re.search(r'\b(plural|plurale tantum)\b', head) is None and 'plural' not in head:
            plural = ''
        for f in e.get('forms', []):
            t = set(f.get('tags', []))
            if 'plural' in t and not (t & {'diminutive', 'genitive', 'dative', 'accusative'}) and f.get('form') and f['form'] not in ('-', '—'):
                plural = f['form']
                break
    skip = {'auxiliary', 'masculine', 'feminine', 'diminutive', 'abbreviation', 'participle-2-auxiliary'}
    forms = {word} | {f['form'] for f in e.get('forms', [])
                      if f.get('form') and len(f['form']) > 2 and not (set(f.get('tags', [])) & skip)
                      and f['form'] not in ('haben', 'sein', 'werden', 'hat', 'ist', 'wird', 'sind', 'hatte', 'war')}
    examples = []
    for s in senses[:4]:
        for x in s.get('examples', []):
            de = (x.get('text') or '').strip()
            en = (x.get('translation') or x.get('english') or '').strip()
            if de and en and 15 <= len(de) <= 90 and len(en) <= 110 and '[' not in de + en:
                examples.append((de, en))
    return {'lemma': word, 'pos': pos, 'article': article, 'plural': plural, 'en': gloss,
            'forms': sorted(forms), 'examples': examples[:3]}

def resolve(form):
    """All good lemma records that this surface form points at."""
    out, seen = [], set()
    variants = [form, form[:1].upper() + form[1:]]
    for v in variants:
        for e in fetch(v):
            if e.get('lang_code', 'de') != 'de':
                continue
            targets = []
            if is_form_of(e):
                for s in e['senses']:
                    for fo in (s.get('form_of') or s.get('alt_of') or []):
                        targets.append(fo.get('word'))
            else:
                targets.append(None)
            for t in targets:
                entries = [e] if t is None else fetch(t)
                for le in entries:
                    if is_form_of(le):
                        continue
                    r = parse_lemma_entry(le)
                    if r and (r['lemma'], r['pos']) not in seen:
                        seen.add((r['lemma'], r['pos']))
                        out.append(r)
    return out

def main():
    freq = []
    for line in open(os.path.join(DATA, 'de_50k.txt'), encoding='utf8'):
        w, n = line.split()
        freq.append((w, int(n)))
    rank_of = {w: i + 1 for i, (w, _) in enumerate(freq)}
    have = existing_lemmas()
    print(f'{len(have)} words already in the app', flush=True)

    # candidate forms per band: in order for the common bands, shuffled (seeded) for the rare ones
    bands = {t: [] for t in range(1, 7)}
    for w, _ in freq:
        if re.fullmatch(r"[a-zäöüß]{3,}", w):
            bands[tier_of(rank_of[w])].append(w)
    rnd = random.Random(7)
    for t in (4, 5, 6):
        rnd.shuffle(bands[t])
    cursor = {t: 0 for t in bands}
    picked = {}  # lemma -> record
    count = {t: 0 for t in bands}
    lemma_rank = {}
    rounds = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        while any(count[t] < QUOTA[t] for t in bands) and any(cursor[t] < len(bands[t]) for t in bands):
            batch = []
            for t in bands:
                if count[t] < QUOTA[t]:
                    batch += bands[t][cursor[t]:cursor[t] + 6]
                    cursor[t] += 6
            results = list(pool.map(resolve, batch))
            for form, recs in zip(batch, results):
                for r in recs:
                    key = r['lemma']
                    if key.casefold() in have or key in picked:
                        continue
                    rank = min(rank_of[form], rank_of.get(key.casefold(), 10**9))
                    t = tier_of(rank)
                    if count[t] >= QUOTA[t]:
                        continue
                    r['rank'] = rank
                    r['tier'] = t
                    picked[key] = r
                    count[t] += 1
            rounds += 1
            if rounds % 20 == 0:
                print(f'round {rounds}: picked {len(picked)} {count}', flush=True)
    out = sorted(picked.values(), key=lambda r: r['rank'])
    json.dump(out, open(os.path.join(DATA, 'picked.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('done', len(out), count, flush=True)

if __name__ == '__main__':
    main()
