import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { addSecurityAttributes } from '../src/index.ts';

describe('Hash', () => {
  const dir = '.';

  const inlineCSS = 'body { background-color: #ffffff; }';
  const inlineScript = 'console.log("Inline script test");';
  const externalCSS = 'html, body { background-color: #fff; }';
  const externalScript = 'export function test() { return 0; }';

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <style>
      ${inlineCSS}
    </style>
    <link rel="stylesheet" href="external.css">
    <script>
      ${inlineScript}
    </script>
    <script src="external.js"></script>
  </head>
  <body>
    <p>This is a test</p>
  </body>
</html>`;

  beforeAll(() => {
    vi.spyOn(fs, 'readFile').mockImplementation(
      async (path: string | Buffer) => {
        if (path.endsWith('external.css')) {
          return Buffer.from(externalCSS, 'utf-8');
        }
        if (path.endsWith('external.js')) {
          return Buffer.from(externalScript, 'utf-8');
        }
        return Buffer.from('', 'utf-8');
      },
    );
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('Inline Style', async () => {
    const hash = createHash('sha256').update(inlineCSS.trim()).digest('base64');
    const out = await addSecurityAttributes(html, dir);
    expect(out).toContain(`<style integrity="sha256-${hash}"`);
  });

  test('Inline Script', async () => {
    const hash = createHash('sha256')
      .update(inlineScript.trim())
      .digest('base64');
    const out = await addSecurityAttributes(html, dir);
    expect(out).toContain(`<script integrity="sha256-${hash}"`);
  });

  test('External Style', async () => {
    const hash = createHash('sha384')
      .update(externalCSS.trim())
      .digest('base64');
    const out = await addSecurityAttributes(html, dir);
    expect(out).toContain(
      `<link rel="stylesheet" href="external.css" integrity="sha384-${hash}"`,
    );
  });

  test('External Script', async () => {
    const hash = createHash('sha384')
      .update(externalScript.trim())
      .digest('base64');
    const out = await addSecurityAttributes(html, dir);
    expect(out).toContain(
      `<script src="external.js" integrity="sha384-${hash}"`,
    );
  });
});
