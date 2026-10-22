import test from 'node:test';
import assert from 'node:assert/strict';
import { translateSegment, backTranslateSegment, evaluateTranslationSegment } from '../services/geminiService.ts';

const calls = (key?: string) => [
  () => translateSegment('Hello', 'Hello', '', 'English', 'Czech', 'test-model', '', key),
  () => backTranslateSegment('Ahoj', 'English', 'Czech', 'test-model', key),
  () => evaluateTranslationSegment('Hello', 'Ahoj', 'Hello', 'English', 'Czech', 'Hello', 'test-model', key),
];

test('all AI operations reject a missing visitor key even when an owner environment key exists', async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.API_KEY;
  process.env.API_KEY = 'OWNER_KEY_MUST_NOT_BE_USED';
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Ahoj' }] } }] }), { status: 200 });
  };
  try {
    for (const key of [undefined, '', '   ']) {
      for (const operation of calls(key)) await assert.rejects(operation, /Add your Gemini API key in Settings/);
    }
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.API_KEY; else process.env.API_KEY = oldKey;
  }
});

test('a visitor key is sent only to the Gemini API and never in the request URL', async () => {
  const oldFetch = globalThis.fetch;
  const requests: {url: string; key: string | null}[] = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push({url: request.url, key: request.headers.get('x-goog-api-key')});
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Ahoj' }] } }] }), { status: 200 });
  };
  try {
    const result = await translateSegment('Hello', 'Hello', '', 'English', 'Czech', 'test-model', '', ' VISITOR_TEST_KEY ');
    assert.equal(result.text, 'Ahoj');
    assert.equal(requests.length, 1);
    assert.equal(new URL(requests[0].url).origin, 'https://generativelanguage.googleapis.com');
    assert.equal(new URL(requests[0].url).searchParams.has('key'), false);
    assert.equal(requests[0].key, 'VISITOR_TEST_KEY');
  } finally { globalThis.fetch = oldFetch; }
});

test('provider authentication errors are actionable and never echo credentials', async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({error: {code: 401, message: 'Invalid VISITOR_TEST_KEY'}}), {status: 401});
  try {
    await assert.rejects(calls('VISITOR_TEST_KEY')[0], (error: Error) => {
      assert.match(error.message, /key.*Settings/i);
      assert.doesNotMatch(error.message, /VISITOR_TEST_KEY/);
      return true;
    });
  } finally { globalThis.fetch = oldFetch; }
});
