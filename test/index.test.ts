import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { addSecurityAttributes } from '../src/index.ts';

describe('Hash', () => {
  const dir = '.';

  test('Style', async () => {
    const css = 'body { background-color: #ffffff; }';
    const hash = createHash('sha256').update(css.trim()).digest('base64');
    const out = await addSecurityAttributes(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <style>${css}</style>
        </head>
        <body>
          <p>Inline style test</p>
        </body>
      </html>`,
      dir,
    );
    expect(out).toContain(`integrity="sha256-${hash}"`);
  });
});
