#!/usr/bin/env python3
"""Step 3: put the reviewed words into src/data/words.raw.txt.

Takes data-sources/picked.json (the frequency picks, whose theme the author chose by hand in
data-sources/themes_part*.txt, and the words chosen by theme), drops everything not chosen, and adds each word
to its theme in words.raw.txt, the words of a theme kept in order of difficulty. Then run `npm run build:words`.
"""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT, DATA

def slug(lemma):
    s = lemma.lower().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s))

def clean(text):
    return re.sub(r'\s+', ' ', text.replace('|', '/')).strip()

def main():
    picked = json.load(open(os.path.join(DATA, 'picked.json'), encoding='utf8'))
    theme_of = {}
    for path in sorted(glob.glob(os.path.join(DATA, 'themes_part*.txt'))):
        for tok in open(path).read().split():
            i, c = tok.split(':')
            theme_of[int(i)] = int(c)
    fixes = {}
    for line in open(os.path.join(DATA, 'fixes.txt'), encoding='utf8'):
        if '|' in line:
            i, g = line.rstrip('\n').split('|', 1)
            fixes[int(i)] = g

    raw_path = os.path.join(ROOT, 'src/data/words.raw.txt')
    lines = open(raw_path, encoding='utf8').read().split('\n')
    # sections: header lines until the first theme, then each "## name | english" with its word lines, then the links tail
    head, sections, tail, cur = [], [], [], None
    for line in lines:
        if line.startswith('## ') and 'Verbindungen' in line:
            cur = 'tail'
        if cur == 'tail':
            tail.append(line)
        elif line.startswith('## '):
            cur = {'title': line, 'words': []}
            sections.append(cur)
        elif cur is None:
            head.append(line)
        elif line.strip():
            cur['words'].append(line)
    taken = set()
    for sec in sections:
        for w in sec['words']:
            taken.add(slug(w.split('|')[2]))
    core = open(os.path.join(ROOT, 'src/data/words.core.ts'), encoding='utf8').read()
    taken |= {slug(m) for m in re.findall(r"lemma:\s*'([^']+)'", core)}

    added, skipped = 0, []
    for i, w in enumerate(picked):
        code = w.get('theme') if w.get('extra') else theme_of.get(i)
        if not code:
            continue
        ex = w.get('example')
        if not ex:
            skipped.append(w['lemma'])
            continue
        if slug(w['lemma']) in taken:
            continue
        taken.add(slug(w['lemma']))
        gloss = clean(fixes.get(i, w['en'])).rstrip('.')
        line = '|'.join([str(w['tier']), w['article'] or '', clean(w['lemma']), clean(w['plural'] or ''), gloss,
                         clean(ex['de']), clean(ex['en']), ''])
        sections[code - 1]['words'].append(line)
        added += 1
    for sec in sections:
        sec['words'].sort(key=lambda l: int(l.split('|')[0]))  # stable: the old words keep their order within a tier
    out = head + [x for sec in sections for x in [sec['title']] + sec['words'] + ['']] + tail
    open(raw_path, 'w', encoding='utf8').write('\n'.join(out))
    print('added', added, 'without an example (left out):', skipped)
    print({sec['title'][3:25]: len(sec['words']) for sec in sections})

if __name__ == '__main__':
    main()
