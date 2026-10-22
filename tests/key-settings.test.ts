import test from 'node:test';
import assert from 'node:assert/strict';
import { readKeySettings, saveKeySettings } from '../services/keySettings.ts';

function memoryStore(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => {values.set(key, value);}, removeItem: (key: string) => {values.delete(key);}};
}

test('keys persist only after explicit opt-in and clearing removes them', () => {
  const storage = memoryStore();
  assert.deepEqual(readKeySettings(storage), {key: '', remember: false});
  assert.equal(saveKeySettings(storage, ' VISITOR_TEST_KEY ', false), true);
  assert.equal(storage.getItem('gemini_api_key'), null);
  saveKeySettings(storage, ' VISITOR_TEST_KEY ', true);
  assert.deepEqual(readKeySettings(storage), {key: 'VISITOR_TEST_KEY', remember: true});
  saveKeySettings(storage, '', false);
  assert.deepEqual(readKeySettings(storage), {key: '', remember: false});
});

test('a legacy remembered key remains usable this session without silently opting in', () => {
  const storage = memoryStore({gemini_api_key: 'LEGACY_TEST_KEY'});
  const settings = readKeySettings(storage);
  assert.deepEqual(settings, {key: 'LEGACY_TEST_KEY', remember: false});
  saveKeySettings(storage, settings.key, settings.remember);
  assert.equal(storage.getItem('gemini_api_key'), null);
});

test('blocked storage does not prevent memory-only use', () => {
  const storage = {getItem: () => {throw Error('blocked');}, setItem: () => {throw Error('blocked');}, removeItem: () => {throw Error('blocked');}};
  assert.deepEqual(readKeySettings(storage), {key: '', remember: false});
  assert.equal(saveKeySettings(storage, 'TEST', true), false);
});
