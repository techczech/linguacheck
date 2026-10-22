import test from 'node:test';
import assert from 'node:assert/strict';
import { translateSegment } from '../services/geminiService.ts';

test('cancelling after a rate limit prevents a delayed request with the old key', async () => {
  const oldFetch = globalThis.fetch;
  const controller = new AbortController();
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    controller.abort();
    return new Response(JSON.stringify({error: {code: 429, message: 'Rate limit'}}), {status: 429});
  };
  try {
    await assert.rejects(() => translateSegment('Hello', 'Hello', '', 'English', 'Czech', 'test-model', '', 'VISITOR_TEST_KEY', controller.signal), /stopped/i);
    assert.equal(requests, 1);
  } finally { globalThis.fetch = oldFetch; }
});
