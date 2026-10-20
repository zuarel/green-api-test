import test from 'node:test';
import assert from 'node:assert/strict';
import { matchRoutes } from 'react-router-dom';
import { chatPath, getLoginDestination, paths } from '../src/routing/paths.ts';

test('a chat URL preserves the API chatId and phone across reloads', () => {
  const path = chatPath({ chatId: '283839219@c.us', phone: '79991234567' });
  const url = new URL(path, 'https://example.test');
  const match = matchRoutes([{ path: '/chats/:chatId' }], url.pathname);
  assert.equal(match?.[0].params.chatId, '283839219@c.us');
  assert.equal(url.searchParams.get('phone'), '79991234567');
});

test('login returns to the complete requested chat URL', () => {
  const from = chatPath({ chatId: 'server-chat-id', phone: '79991234567' });
  assert.equal(getLoginDestination({ from }), from);
});

test('invalid or external login destinations fall back to the number selection', () => {
  for (const state of [null, {}, { from: '/login' }, { from: '//example.test' }, { from: 'https://example.test' }]) {
    assert.equal(getLoginDestination(state), paths.newChat);
  }
});
