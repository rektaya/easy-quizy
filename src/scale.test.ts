import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';

// The type scale and the spacing scale of the app (COMPONENTS.md): no screen invents a size of its own.
const FONT_SIZES = [12, 13, 15, 16, 18, 22, 24, 28, 32, 36];
const GAPS = [2, 4, 6, 8, 12, 16, 24];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

function literals(re: RegExp): { file: string; value: number }[] {
  return sources('src').flatMap((file) => [...readFileSync(file, 'utf8').matchAll(re)].map((m) => ({ file, value: Number(m[1]) })));
}

test('every font size written in a screen or component is on the type scale', () => {
  const off = literals(/fontSize: *(\d+(?:\.\d+)?)\b/g).filter((l) => !FONT_SIZES.includes(l.value));
  assert.deepEqual(off, []);
});

test('every gap written in a screen or component is on the spacing scale', () => {
  const off = literals(/\b(?:gap|columnGap|rowGap): *(\d+)\b/g).filter((l) => !GAPS.includes(l.value));
  assert.deepEqual(off, []);
});
