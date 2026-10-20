import test from 'node:test';
import assert from 'node:assert/strict';
import { credentialsStorage } from '../src/lib/credentialsStorage.ts';

function mockStorage(context: { after: (cleanup: () => void) => void }, storage: Pick<Storage, 'getItem' | 'setItem'> & Partial<Pick<Storage, 'removeItem'>>) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  context.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
}

test('credentials use the existing localStorage keys and can be read on reload', (context) => {
  const values = new Map<string, string>();
  mockStorage(context, {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  });

  assert.equal(credentialsStorage.read(), null);
  credentialsStorage.save({ idInstance: 'test-id', apiTokenInstance: 'test-token' });
  assert.equal(values.get('idInstance'), 'test-id');
  assert.equal(values.get('apiTokenInstance'), 'test-token');
  assert.deepEqual(credentialsStorage.read(), { idInstance: 'test-id', apiTokenInstance: 'test-token' });
});

test('incomplete saved credentials do not restore a session', (context) => {
  mockStorage(context, { getItem: (key) => key === 'idInstance' ? 'test-id' : null, setItem: () => {} });
  assert.equal(credentialsStorage.read(), null);
});

test('blocked storage produces a readable error', (context) => {
  mockStorage(context, {
    getItem: () => { throw new Error('Storage is disabled'); },
    setItem: () => { throw new Error('Storage is disabled'); },
  });
  assert.throws(() => credentialsStorage.read(), /Не удалось прочитать локальное хранилище/);
  assert.throws(() => credentialsStorage.save({ idInstance: 'id', apiTokenInstance: 'token' }), /Не удалось сохранить данные/);
});

test('logout removes both credentials, preserves other data, and prevents session restoration', (context) => {
  const values = new Map([
    ['idInstance', 'old-id'], ['apiTokenInstance', 'old-token'], ['theme', 'dark'],
  ]);
  mockStorage(context, {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  });

  credentialsStorage.clear();
  assert.equal(values.has('idInstance'), false);
  assert.equal(values.has('apiTokenInstance'), false);
  assert.equal(values.get('theme'), 'dark');
  assert.equal(credentialsStorage.read(), null);

  credentialsStorage.save({ idInstance: 'new-id', apiTokenInstance: 'new-token' });
  assert.deepEqual(credentialsStorage.read(), { idInstance: 'new-id', apiTokenInstance: 'new-token' });
});

test('logout reports storage deletion failure', (context) => {
  mockStorage(context, {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => { throw new Error('Storage is disabled'); },
  });
  assert.throws(() => credentialsStorage.clear(), /Не удалось удалить данные сессии/);
});
