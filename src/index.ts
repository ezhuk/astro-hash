import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'crypto';

import type { AstroIntegration } from 'astro'

const PKG_NAME = 'security';

async function getFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  return files;
}

async function readOrFetchFile(url: string, dir: string): Promise<Buffer|null> {
  try {
    if (/^(https?:)?\/\//.test(url)) {
      const fetchUrl = url.startsWith('//') ? `https:${url}` : url;
      const res = await fetch(fetchUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Origin': new URL(fetchUrl).origin
        }
      });
      if (!res.ok) {
        return null;
      }
      return Buffer.from(await res.arrayBuffer());
    } else {
      const localPath = url.startsWith('/') ? url.slice(1) : url;
      return await fs.readFile(path.join(dir, localPath));
    }
  } catch {
    return null;
  }
}

async function addSecurityAttributes(html: string, dir: string): Promise<string> {
  const changes: Array<{ from: string; to: string }> = [];
  const RE = /<(script|style|link)\b(?:[^>]*?\b(?:src|href)\s*=\s*["']([^"']*)["'][^>]*?|[^>]*?)(?:>([\s\S]*?)<\/\1\s*>|\s*\/?>)/gim;
  for (const match of html.matchAll(RE)) {
    const [full, tag, url, content] = match;
    let hash: string | undefined;
    if (url && (tag === 'script' || tag === 'link')) {
      const data = await readOrFetchFile(url, dir);
      if (!data) {
        continue;
      }
      hash = `sha384-${createHash('sha384').update(data).digest('base64')}`;
    } else if (content != null && (tag === 'script' || tag === 'style')) {
      const data = content.trim();
      if (!data) {
        continue;
      }
      hash = `sha256-${createHash('sha256').update(data).digest('base64')}`;
    } else {
      continue;
    }
    const cleaned = full
      .replace(/\s+integrity="[^"]*"/gi, '')
      .replace(/\s+crossorigin="[^"]*"/gi, '');
    const closing = cleaned.endsWith('/>') ? '/>' : '>';
    const opening = cleaned.replace(/>.*$/, '') +
      ` integrity="${hash}"` +
      (tag === 'link' && url?.startsWith('/') && url.endsWith('.css') ? '' : ` crossorigin="anonymous"`) +
      closing;
    const replacement = content != null
      ? opening + content + `</${tag}>`
      : opening;
    changes.push({ from: full, to: replacement });
  }
  for (const { from, to } of changes) {
    html = html.replace(from, to);
  }
  return html;
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
          })
        );
      },
    },
  };
}

export { addSecurityAttributes };
