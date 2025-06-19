import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function getFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function readOrFetchFile(
  url: string,
  distDir: string,
): Promise<Buffer | null> {
  try {
    if (/^(https?:)?\/\//.test(url)) {
      const fetchUrl = url.startsWith('//') ? `https:${url}` : url;
      const res = await fetch(fetchUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    const relative = url.startsWith('/') ? url.slice(1) : url;
    return fs.readFile(path.join(distDir, relative));
  } catch {
    return null;
  }
}

export function computeHash(
  data: Buffer | string,
  algorithm: 'sha256' | 'sha384',
): string {
  const hash = createHash(algorithm).update(data).digest('base64');
  return `${algorithm}-${hash}`;
}
