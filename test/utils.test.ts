import { describe, expect, test } from 'vitest'
import { createHash } from 'crypto';

import { computeHash } from '../src/utils.ts';

describe('Hash', () => {
  const data = 'test string 123';

  test('sha256', async () => {
    const alg = 'sha-256';
    const hash = computeHash(data.trim(), alg);
    expect(hash).toBe(`${alg}-${createHash(alg)
      .update(data.trim())
      .digest('base64')}`
    );
  });

  test('sha384', async () => {
    const alg = 'sha-384';
    const hash = computeHash(data.trim(), alg);
    expect(hash).toBe(`${alg}-${createHash(alg)
      .update(data.trim())
      .digest('base64')}`
    );
  });
})
