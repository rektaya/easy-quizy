#!/usr/bin/env python3
"""Fixes the capital letters of the word-family field in src/data/words.raw.txt: a family word is capitalised when it is a
noun and lower case when it is an adjective, adverb or verb ("Machbar" -> "machbar"), by its Wiktionary entry.
Prints what it changes; run `npm run build:words` after.  Usage: python3 scripts/words/fix_family_case.py [--apply]"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import ROOT, fetch

def pos_set(word):
    try:
        return {e.get('pos') for e in fetch(word) if e.get('lang_code', 'de') == 'de' and not all(s.get('form_of') or s.get('alt_of') for s in e.get('senses', []) or [{}])}
    except Exception:
        return set()

def main():
    apply = '--apply' in sys.argv
    path = os.path.join(ROOT, 'src/data/words.raw.txt')
    lines = open(path, encoding='utf8').read().split('\n')
    changes = []
    for n, line in enumerate(lines):
        f = line.split('|')
        if len(f) != 8 or not f[7].strip():
            continue
        out = []
        for item in f[7].split(','):
            w = item.strip()
            new = w
            if w[:1].isupper() and ' ' not in w:
                cap, low = pos_set(w), pos_set(w[:1].lower() + w[1:])
                if 'noun' not in cap and (low & {'adj', 'adv', 'verb'}):
                    new = w[:1].lower() + w[1:]
            elif w[:1].islower() and ' ' not in w:
                cap, low = pos_set(w[:1].upper() + w[1:]), pos_set(w)
                if 'noun' in cap and not (low & {'adj', 'adv', 'verb'}):
                    new = w[:1].upper() + w[1:]
            if new != w:
                changes.append((f[2], w, new))
            out.append(new)
        f[7] = ','.join(out)
        lines[n] = '|'.join(f)
    for lemma, a, b in changes:
        print(f'{lemma}: {a} -> {b}')
    print(len(changes), 'changes')
    if apply:
        open(path, 'w', encoding='utf8').write('\n'.join(lines))

if __name__ == '__main__':
    main()
