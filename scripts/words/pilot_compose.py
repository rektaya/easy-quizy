#!/usr/bin/env python3
"""Adds the words of data-sources/pilot.json to src/data/words.raw.txt, each in its theme.

The theme of every word is in data-sources/pilot_themes.txt, one line per word: `lemma|theme number` (1-24, the order of the themes
in the raw file). A word without a theme is left out. Then run: npm run build:words, rank_table.py, extra_info.py, verb_forms.py.
Words of a theme stay in order of tier (a stable sort: the old words keep their order).
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT, DATA
from compose_raw import slug, clean

def main():
    words = json.load(open(os.path.join(DATA, 'pilot.json'), encoding='utf8'))
    theme_of = {}
    for line in open(os.path.join(DATA, 'pilot_themes.txt'), encoding='utf8'):
        if '|' in line:
            lemma, code = line.rstrip('\n').rsplit('|', 1)
            theme_of[lemma.strip()] = int(code)
    raw_path = os.path.join(ROOT, 'src/data/words.raw.txt')
    lines = open(raw_path, encoding='utf8').read().split('\n')
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
    taken = {slug(w.split('|')[2]) for sec in sections for w in sec['words']}
    core = open(os.path.join(ROOT, 'src/data/words.core.ts'), encoding='utf8').read()
    taken |= {slug(m) for m in re.findall(r"lemma:\s*'([^']+)'", core)}
    added, no_theme = 0, []
    for w in words:
        code = theme_of.get(w['lemma'])
        if not code:
            no_theme.append(w['lemma'])
            continue
        if slug(w['lemma']) in taken:
            continue
        taken.add(slug(w['lemma']))
        gloss = clean(w['en']).rstrip('.')
        gloss = gloss[:1].lower() + gloss[1:] if not re.match(r'^[A-Z]{2,}', gloss) else gloss
        line = '|'.join([str(w['tier']), w['article'] or '', clean(w['lemma']), clean(w['plural'] or ''), gloss,
                         clean(w['example']['de']), clean(w['example']['en']), ''])
        sections[code - 1]['words'].append(line)
        added += 1
    for sec in sections:
        sec['words'].sort(key=lambda l: int(l.split('|')[0]))
    out = head + [x for sec in sections for x in [sec['title']] + sec['words'] + ['']] + tail
    open(raw_path, 'w', encoding='utf8').write('\n'.join(out))
    print('added', added, '| without a theme (left out):', len(no_theme), no_theme[:20])
    print({sec['title'][3:25]: len(sec['words']) for sec in sections})

if __name__ == '__main__':
    main()
