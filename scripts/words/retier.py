#!/usr/bin/env python3
"""Difficulty tier of the words that are already in words.raw.txt, from the real frequency list.

Prints how the old hand-made tiers compare with the ones the frequency list gives. With --apply it
rewrites the tier of every word the list knows (the others keep their hand-made tier).
"""
import collections, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT, DATA, tier_of

def main():
    apply = '--apply' in sys.argv
    rank = {}
    for i, line in enumerate(open(os.path.join(DATA, 'de_50k.txt'), encoding='utf8')):
        rank.setdefault(line.split()[0], i + 1)
    path = os.path.join(ROOT, 'src/data/words.raw.txt')
    out, matrix, unknown = [], collections.Counter(), []
    for line in open(path, encoding='utf8').read().split('\n'):
        f = line.split('|')
        if len(f) == 8 and re.fullmatch(r'[1-6]', f[0]):
            lemma = f[2].strip().casefold()
            r = rank.get(lemma)
            if r is None and f[2].startswith('sich '):
                r = rank.get(lemma[5:])
            if r is not None:
                new = tier_of(r)
                matrix[(int(f[0]), new)] += 1
                f[0] = str(new)
            else:
                unknown.append(f[2])
        out.append('|'.join(f) if len(f) == 8 else line)
    print('old tier -> tier from the list:')
    for old in range(1, 7):
        print(f'  {old}:', ' '.join(f'{matrix[(old, new)]:3d}' for new in range(1, 7)))
    print('not in the list (keep hand-made tier):', len(unknown), unknown[:25])
    if apply:
        open(path, 'w', encoding='utf8').write('\n'.join(out))
        print('rewritten')

if __name__ == '__main__':
    main()
