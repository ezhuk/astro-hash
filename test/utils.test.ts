import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { computeHash, getFiles, readOrFetchFile } from '../src/utils.ts';

describe('computeHash', () => {
  const data = 'test string 123';

  test('sha256', async () => {
    const alg = 'sha-256';
    const hash = computeHash(data.trim(), alg);
    expect(hash).toBe(
      `${alg}-${createHash(alg).update(data.trim()).digest('base64')}`,
    );
  });

  test('sha384', async () => {
    const alg = 'sha-384';
    const hash = computeHash(data.trim(), alg);
    expect(hash).toBe(
      `${alg}-${createHash(alg).update(data.trim()).digest('base64')}`,
    );
  });
});

describe('getFiles', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-hash-'));
    await fs.writeFile(path.join(tmpDir, 'README.md'), '## README');
    await fs.writeFile(path.join(tmpDir, 'index.html'), '<html></html>');
    await fs.mkdir(path.join(tmpDir, 'sub'));
    await fs.writeFile(path.join(tmpDir, 'sub', 'page.html'), '<html></html>');
  });

  afterAll(() => fs.rm(tmpDir, { recursive: true, force: true }));

  test('html', async () => {
    const files = await getFiles(tmpDir);
    expect(files).toHaveLength(2);
    expect(files).toEqual(
      expect.arrayContaining([
        path.join(tmpDir, 'index.html'),
        path.join(tmpDir, 'sub', 'page.html'),
      ]),
    );
  });
});

describe('readOrFetchFile', () => {
  const localContent = 'local content';
  const remoteContent = 'remote content';
  let tmpDir: string;
  let tmpFile: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-hash-'));
    tmpFile = path.join(tmpDir, 'index.html');
    await fs.writeFile(tmpFile, localContent, 'utf-8');

    vi.stubGlobal('fetch', async (input: RequestInfo) => {
      return {
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode(remoteContent),
      };
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    return fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('local', async () => {
    const buf = await readOrFetchFile(path.basename(tmpFile), tmpDir);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.toString()).toBe(localContent);
  });

  test('remote', async () => {
    const buf = await readOrFetchFile('//example.com/index.html', tmpDir);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.toString()).toBe(remoteContent);
  });
});
