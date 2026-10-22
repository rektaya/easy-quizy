#!/usr/bin/env python3
"""Keeps the words of every theme in words.raw.txt in order of tier (the "related words" ladder in build-words.mjs links neighbours).
Run it after a tier changed by hand (apply_review.py does not reorder). A stable sort: words of the same tier keep their order."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT

def is_word(line):
    f = line.split('|')
    return len(f) == 8 and re.fullmatch(r'[1-6]', f[0]) is not None

def main():
    path = os.path.join(ROOT, 'src/data/words.raw.txt')
    lines = open(path, encoding='utf8').read().split('\n')
    out, block, moved = [], [], 0
    def flush():
        nonlocal moved
        if block:
            s = sorted(block, key=lambda l: int(l[0]))
            moved += sum(1 for a, b in zip(block, s) if a != b)
            out.extend(s)
            block.clear()
    for l in lines:
        if is_word(l):
            block.append(l)
        else:
            flush()
            out.append(l)
    flush()
    open(path, 'w', encoding='utf8').write('\n'.join(out))
    print('lines moved:', moved)

if __name__ == '__main__':
    main()
