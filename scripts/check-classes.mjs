#!/usr/bin/env node
/* 存在しない色クラスを見つけて落とす。
 *
 * Mado は @theme inline で意味のある色名（bg-surface / text-subtle …）を
 * 作っている。**そこに無い名前を書いても Tailwind は黙って無視する** ――
 * クラスが効かないだけで、エラーも警告も出ない。
 *
 *   2026-08-22  bg-primary-light が 7 箇所。--color-primary-light は
 *               定義されておらず（あるのは accent-light）、7 箇所とも
 *               「薄い青の下地」を意図して書かれて何も起きていなかった。
 *
 * wixdex の check-bridge.mjs と同じ発想。あちらは「対応表に無い色が
 * Tailwind の生の色で素通り」、こちらは「そもそも定義が無い」。
 * どちらも黙って何も起きないので、目では見つからない。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const UTIL = 'bg|text|border|ring|fill|stroke|divide|from|via|to|placeholder|caret|outline|decoration|shadow';
/* Tailwind が最初から持っている色。@theme の定義が無くても効く */
const BUILTIN = new Set(['inherit', 'current', 'transparent', 'black', 'white']);
const PALETTE = /^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+$/;

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  if (f === 'node_modules' || f === '.svelte-kit') return [];
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.svelte') ? [p] : [];
});

const css = readFileSync('src/app.css', 'utf8');
const defined = new Set([...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));

const re = new RegExp(`(?:^|[\\s"'\`])(?:[a-z-]+:)*(?:${UTIL})-([a-z][a-z0-9-]*)(?:/\\d+)?(?=[\\s"'\`]|$)`, 'g');
const bad = new Map();
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/class(?:Name)?=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g)) {
    for (const hit of (m[1] ?? m[2] ?? m[3] ?? '').matchAll(re)) {
      const tok = hit[1];
      if (defined.has(tok) || BUILTIN.has(tok) || PALETTE.test(tok)) continue;
      // 色以外のユーティリティ（text-center, border-t, bg-clip-padding …）は対象外
      if (!/^(surface|elevated|subtle|primary|secondary|muted|accent|destructive|success|warning|error|background|foreground|card|popover|border|input|ring)([a-z0-9-]*)$/.test(tok)) continue;
      if (defined.has(tok)) continue;
      if (!bad.has(tok)) bad.set(tok, new Set());
      bad.get(tok).add(file);
    }
  }
}

if (bad.size === 0) {
  console.log(`クラス検査: 未定義の色クラスなし（@theme の定義 ${defined.size} 色）`);
  process.exit(0);
}
console.error('★存在しない色クラスがあります。書いても何も起きません。\n');
for (const [tok, files] of [...bad].sort()) {
  console.error(`  ${tok}`);
  for (const f of files) console.error(`      ${f}`);
}
console.error(`
直し方:
  1. 打ち間違いなら正しい名前に（@theme の定義を確認）
  2. 本当に要るなら src/app.css の @theme inline に --color-<名前> を足す
`);
process.exit(1);
