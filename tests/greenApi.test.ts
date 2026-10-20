import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createGreenApi } from '../src/api/greenApi.ts';

const credentials = { idInstance: 'test-id', apiTokenInstance: 'test-token' };

test('account check sends the phone as a JSON number', async () => {
  const api = createGreenApi(credentials, async (url, options) => {
    assert.equal(url, 'https://4100.api.green-api.com/waInstancetest-id/checkAccount/test-token');
    assert.equal(options?.method, 'POST');
    assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
    assert.deepEqual(JSON.parse(String(options.body)), { phoneNumber: 79991234567 });
    return Response.json({ exist: true, chatId: 'server-chat-id' });
  });

  assert.deepEqual(await api.checkAccount('79991234567'), { exist: true, chatId: 'server-chat-id' });
});

test('sendMessage preserves the server chatId and numeric typingTime', async () => {
  const api = createGreenApi(credentials, async (url, options) => {
    assert.equal(url, 'https://4100.api.green-api.com/waInstancetest-id/sendMessage/test-token');
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(String(options.body)), {
      chatId: '283839219', message: 'Привет', typingTime: 1000,
    });
    return Response.json({ idMessage: 'message-id' });
  });

  assert.equal((await api.sendMessage({ chatId: '283839219', message: 'Привет', typingTime: 1000 })).idMessage, 'message-id');
});

test('history requests use the supplied chatId and reject an unexpected response', async () => {
  const api = createGreenApi(credentials, async (url, options) => {
    assert.ok(url.includes('/getChatHistory/'));
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(String(options.body)), { chatId: 'history-chat' });
    return Response.json({ unexpected: true });
  });

  await assert.rejects(api.getChatHistory('history-chat'), /неожиданном формате/);
});

test('instance check is a GET without a request body', async () => {
  const api = createGreenApi(credentials, async (url, options) => {
    assert.ok(url.includes('/getStateInstance/'));
    assert.equal(options?.method, 'GET');
    assert.equal(options.body, undefined);
    return Response.json({ stateInstance: 'authorized' });
  });

  assert.equal((await api.getStateInstance()).stateInstance, 'authorized');
});

test('HTTP errors expose the status without leaking response bodies or credentials', async () => {
  const api = createGreenApi(credentials, async () => Response.json({ message: 'private server data' }, { status: 401 }));

  await assert.rejects(api.getStateInstance(), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, 'Ошибка API (401).');
    return true;
  });
});

test('caller cancellation reaches the request signal', async () => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | null | undefined;
  const api = createGreenApi(credentials, async (_, options) => {
    requestSignal = options?.signal;
    return Response.json({ stateInstance: 'authorized' });
  });

  await api.getStateInstance(controller.signal);
  assert.ok(requestSignal);
  assert.equal(requestSignal.aborted, false);
  controller.abort();
  assert.equal(requestSignal.aborted, true);
});
