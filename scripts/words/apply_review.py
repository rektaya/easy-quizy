#!/usr/bin/env python3
"""Shows or applies the fixes of the word review (scripts/words/review_patch.txt).

  python3 scripts/words/apply_review.py                      # a report of every change: current -> new, grouped (nothing is written)
  python3 scripts/words/apply_review.py --groups A,B --apply # applies only these groups
After applying: npm run build:words, python3 scripts/words/rank_table.py, python3 scripts/words/extra_info.py,
python3 scripts/words/verb_forms.py, npm run typecheck && npm test.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT
from compose_raw import slug

PATCH = os.path.join(os.path.dirname(__file__), 'review_patch.txt')
RAW = os.path.join(ROOT, 'src/data/words.raw.txt')
CORE = os.path.join(ROOT, 'src/data/words.core.ts')
RENAMED = os.path.join(ROOT, 'src/data/renamedWords.ts')
OVERRIDES = os.path.join(os.path.dirname(__file__), 'rank_overrides.txt')
TIER_RANK = {1: 300, 2: 1200, 3: 2900, 4: 6000, 5: 12000, 6: 24000}
GROUP_NAMES = {
    'A': 'The example is about another word', 'B': 'Wrong or broken meaning', 'C': 'Meaning wording',
    'D': 'Main example replaced (names, idioms, sad or odd sentences)', 'E': 'Tier', 'F': 'Plural', 'G': 'Family words that are not family',
    'H': 'Lemma form (adjective nouns, spelling)', 'I': 'Remove the word', 'K': 'Translation of the example',
}

def load_patch():
    items, seen = [], set()
    for line in open(PATCH, encoding='utf8'):
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        parts = [x.strip() for x in line.rstrip('\n').split('|')]
        parts += [''] * (5 - len(parts))
        key = tuple(parts)
        if key in seen:
            continue
        seen.add(key)
        items.append(tuple(parts[:5]))
    return items  # (group, lemma, field, value, value2)

def load_raw():
    lines = open(RAW, encoding='utf8').read().split('\n')
    index = {}
    for i, l in enumerate(lines):
        f = l.split('|')
        if len(f) == 8 and re.fullmatch(r'[1-6]', f[0]):
            index[f[2]] = i
    return lines, index

def core_block(text, lemma):
    m = re.search(r"lemma:\s*'%s'," % re.escape(lemma), text)
    if not m:
        return None
    start = text.rfind('{', 0, m.start())
    end = text.find('\n  },', m.end())
    return start, end

def current(lines, index, core, item):
    group, lemma, field, value, value2 = item
    if lemma in index:
        f = lines[index[lemma]].split('|')
        return {'en': f[4], 'ex': f[5] + ' // ' + f[6], 'exen': f[6], 'plural': f[3] or '(none)', 'tier': f[0], 'lemma': f[2], 'remove': f'{f[1]} {f[2]}',
                'family-': f[7], 'family>': f[7]}[field]
    blk = core_block(core, lemma)
    if blk:
        b = core[blk[0]:blk[1]]
        if field == 'en':
            return re.search(r"\n    en: '([^']*)'", b).group(1)
        if field == 'tier':
            return re.search(r"\b%s: (\d)" % slug(lemma).replace('-', r'-'), core.split('CORE_TIERS')[-1]).group(1)
    return '??? (not found)'

def report(items, groups):
    lines, index = load_raw()
    core = open(CORE, encoding='utf8').read()
    out = []
    for g in sorted({i[0] for i in items}):
        if groups and g not in groups:
            continue
        rows = [i for i in items if i[0] == g]
        out.append(f'\n## {g}. {GROUP_NAMES[g]} ({len(rows)})\n')
        for it in rows:
            _, lemma, field, value, value2 = it
            new = value + (f' // {value2}' if value2 else '')
            out.append(f'- **{lemma}** `{field}`: {current(lines, index, core, it)}  →  {new if new else "(none)"}')
    return '\n'.join(out)

def apply(items, groups):
    lines, index = load_raw()
    core = open(CORE, encoding='utf8').read()
    renamed, removed, overrides = {}, [], []
    for g, lemma, field, value, value2 in items:
        if groups and g not in groups:
            continue
        if lemma in index:
            i = index[lemma]
            f = lines[i].split('|')
            if field == 'en': f[4] = value
            elif field == 'ex': f[5], f[6] = value, value2
            elif field == 'exen': f[6] = value
            elif field == 'plural': f[3] = value
            elif field == 'tier':
                f[0] = value; overrides.append((lemma, TIER_RANK[int(value)]))
            elif field == 'family-': f[7] = ','.join(x for x in f[7].split(',') if x != value)
            elif field == 'family>':
                a, b = value.split('>'); f[7] = ','.join(b if x == a else x for x in f[7].split(','))
            elif field == 'lemma':
                renamed[slug(lemma)] = slug(value); f[2] = value
            elif field == 'remove':
                removed.append(lemma); lines[i] = None; continue
            lines[i] = '|'.join(f)
        else:
            blk = core_block(core, lemma)
            assert blk, f'not found: {lemma}'
            b = core[blk[0]:blk[1]]
            if field == 'en':
                b = re.sub(r"(\n    en: ')[^']*(')", lambda m: m.group(1) + value.replace("'", "\\'") + m.group(2), b, count=1)
                core = core[:blk[0]] + b + core[blk[1]:]
            elif field == 'tier':
                head, tail = core.split('export const CORE_TIERS', 1)
                tail = re.sub(r"(\b%s: )\d" % re.escape(slug(lemma)), lambda m: m.group(1) + value, tail, count=1)
                core = head + 'export const CORE_TIERS' + tail
                overrides.append((lemma, TIER_RANK[int(value)]))
            else:
                raise SystemExit(f'core word {lemma}: field {field} is not supported')
    open(RAW, 'w', encoding='utf8').write('\n'.join(l for l in lines if l is not None))
    open(CORE, 'w', encoding='utf8').write(core)
    if renamed:
        t = open(RENAMED, encoding='utf8').read()
        add = ''.join(f"  {old}: '{new}',\n" for old, new in renamed.items())
        t = t.replace('};\n\n/** The same record', add + '};\n\n/** The same record', 1)
        open(RENAMED, 'w', encoding='utf8').write(t)
    if overrides:
        with open(OVERRIDES, 'a', encoding='utf8') as fh:
            for lemma, r in overrides:
                fh.write(f'{lemma} {r}\n')
    print('applied; renamed ids:', renamed, '| removed:', removed, '| rank overrides:', len(overrides))

if __name__ == '__main__':
    items = load_patch()
    groups = None
    if '--groups' in sys.argv:
        groups = set(sys.argv[sys.argv.index('--groups') + 1].split(','))
    if '--apply' in sys.argv:
        apply(items, groups)
    else:
        text = report(items, groups)
        print(text)
        print(f'\n{len(items)} changes in total', file=sys.stderr)
