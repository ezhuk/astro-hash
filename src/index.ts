import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { JSDOM } from 'jsdom';

import { computeHash, getFiles, readOrFetchFile } from './utils.js';

const PKG_NAME = '@ezhuk/astro-hash';

async function addSecurityAttributes(
  html: string,
  dir: string,
): Promise<string> {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  for (const elem of Array.from(document.querySelectorAll('style'))) {
    const text = (elem.textContent ?? '').trim();
    const hash = computeHash(text, 'sha256');
    elem.setAttribute('integrity', `${hash}`);
  }
  for (const elem of Array.from(
    document.querySelectorAll('link[rel="stylesheet"][href]'),
  )) {
    const url = elem.getAttribute('href');
    if (url) {
      const data = await readOrFetchFile(url, dir);
      if (data) {
        const hash = computeHash(data, 'sha384');
        elem.setAttribute('integrity', `${hash}`);
        elem.setAttribute('crossorigin', 'anonymous');
      }
    }
  }
  for (const elem of Array.from(document.querySelectorAll('script'))) {
    if (elem.hasAttribute('src')) {
      const url = elem.getAttribute('src');
      if (url) {
        const data = await readOrFetchFile(url, dir);
        if (data) {
          const hash = computeHash(data, 'sha384');
          elem.setAttribute('integrity', `${hash}`);
          elem.setAttribute('crossorigin', 'anonymous');
        }
      }
    } else {
      const text = (elem.textContent ?? '').trim();
      const hash = computeHash(text, 'sha256');
      elem.setAttribute('integrity', `${hash}`);
      elem.setAttribute('crossorigin', 'anonymous');
    }
  }
  return dom.serialize();
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
