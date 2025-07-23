import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { JSDOM } from 'jsdom';

import { computeHash, getFiles, readOrFetchFile } from './utils.js';

const PKG_NAME = '@ezhuk/astro-hash';

export interface Options {
  printHashes?: boolean;
}

async function addSecurityAttributes(
  html: string,
  dir: string,
  out: boolean,
  logger: Logger,
): Promise<string> {
  const dom = new JSDOM(html);
  const elems = Array.from(
    dom.window.document.querySelectorAll(
      'style, link[rel="stylesheet"][href], script',
    ),
  );
  await Promise.all(
    elems.map(async (elem) => {
      const url = elem.getAttribute('src') || elem.getAttribute('href');
      const data = url
        ? await readOrFetchFile(url, dir)
        : (elem.textContent ?? '').trim();
      if (data) {
        const hash = computeHash(data, url ? 'sha384' : 'sha256');
        elem.setAttribute('integrity', `${hash}`);
        if (url) {
          elem.setAttribute('crossorigin', 'anonymous');
        }
        if (out) {
          logger.info(`${url ?? 'inline'}: ${hash}`);
        }
      }
    }),
  );
  return dom.serialize();
}

export function security(options: Options = {}): AstroIntegration {
  const { printHashes = true } = options;

  return {
    name: PKG_NAME,

    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const files = await getFiles(dist);
        await Promise.all(
          files.map(async (file) => {
            let html = await fs.readFile(file, 'utf-8');
            html = await addSecurityAttributes(html, dist, printHashes, logger);
            await fs.writeFile(file, html, 'utf-8');
          }),
        );
      },
    },
  };
}

export { addSecurityAttributes };
export * from './utils.js';
