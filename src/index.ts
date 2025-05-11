import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

import { computeHash, getFiles, readOrFetchFile } from './utils.js';

const PKG_NAME = '@ezhuk/astro-hash';

async function addSecurityAttributes(
  html: string,
  dir: string,
): Promise<string> {
  const changes: Array<{ from: string; to: string }> = [];
  const RE =
    /<(script|style|link)\b(?:[^>]*?\b(?:src|href)\s*=\s*["']([^"']*)["'][^>]*?|[^>]*?)(?:>([\s\S]*?)<\/\1\s*>|\s*\/?>)/gim;
  for (const match of html.matchAll(RE)) {
    const [full, tag, url, content] = match;
    let hash: string | undefined;
    if (url && (tag === 'script' || tag === 'link')) {
      const data = await readOrFetchFile(url, dir);
      if (!data) {
        continue;
      }
      hash = computeHash(data, 'sha384');
    } else if (content != null && (tag === 'script' || tag === 'style')) {
      const data = content.trim();
      if (!data) {
        continue;
      }
      hash = computeHash(data, 'sha256');
    } else {
      continue;
    }
    const cleaned = full
      .replace(/\s+integrity="[^"]*"/gi, '')
      .replace(/\s+crossorigin="[^"]*"/gi, '');
    const closing = cleaned.endsWith('/>') ? '/>' : '>';
    const opening = `${cleaned.replace(/>.*$/, '')} integrity="${hash}"${tag === 'link' && url?.startsWith('/') && url.endsWith('.css') ? '' : ` crossorigin="anonymous"`}${closing}`;
    const replacement =
      content != null ? `${opening + content}</${tag}>` : opening;
    changes.push({ from: full, to: replacement });
  }
  let out = html;
  for (const { from, to } of changes) {
    out = out.replace(from, to);
  }
  return out;
}

export function security(): AstroIntegration {
  return {
    name: PKG_NAME,

    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const files = await getFiles(dist);
        await Promise.all(
          files.map(async (file) => {
            let html = await fs.readFile(file, 'utf-8');
            html = await addSecurityAttributes(html, dist);
            await fs.writeFile(file, html, 'utf-8');
          }),
        );
      },
    },
  };
}

export { addSecurityAttributes };
export * from './utils.js';
