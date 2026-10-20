import test from 'node:test';
import assert from 'node:assert/strict';
import { pollNotifications } from '../src/services/notificationPolling.ts';
import { createGreenApi } from '../src/api/greenApi.ts';
import type { ApiNotification, ChatMessage } from '../src/types.ts';
import { mergeMessages, notificationToMessage } from '../src/lib/chatMessages.ts';

const notification: ApiNotification = {
  receiptId: 1234567,
  body: {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1763115112,
    idMessage: 'incoming-1',
    senderData: { chatId: '283839219' },
    messageData: { textMessageData: { textMessage: 'Привет от Green-API!' } },
  },
};

test('empty receive is repeated; notification is rendered only after deletion', async () => {
  const controller = new AbortController();
  const calls: string[] = [];
  let received = 0;
  const rendered: ApiNotification[] = [];

  await pollNotifications({
    signal: controller.signal,
    onError: (error) => assert.equal(error, ''),
    onNotification: (item) => {
      assert.deepEqual(calls, ['GET', 'GET', 'DELETE']);
      rendered.push(item);
      controller.abort();
    },
    api: createGreenApi({ idInstance: 'test-id', apiTokenInstance: 'test-token' }, async (url, options) => {
      calls.push(options?.method ?? 'GET');
      if (options?.method === 'GET') {
        return Response.json(received++ === 0 ? [] : notification);
      }
      assert.equal(url, 'https://4100.api.green-api.com/waInstancetest-id/deleteNotification/test-token/1234567');
      assert.deepEqual(rendered, []);
      return Response.json({ result: true });
    }),
  });

  assert.deepEqual(rendered, [notification]);
});

test('failed deletion retries the saved receipt before receiving another notification', async () => {
  const controller = new AbortController();
  const calls: string[] = [];
  const errors: string[] = [];
  let deletes = 0;
  let rendered = 0;

  await pollNotifications({
    signal: controller.signal,
    retryDelay: 1,
    onError: (error) => { if (error) errors.push(error); },
    onNotification: () => { rendered++; controller.abort(); },
    api: createGreenApi({ idInstance: 'test-id', apiTokenInstance: 'test-token' }, async (url, options) => {
      calls.push(options?.method ?? 'GET');
      if (options?.method === 'GET') return Response.json([notification]);
      assert.equal(url, 'https://4100.api.green-api.com/waInstancetest-id/deleteNotification/test-token/1234567');
      return ++deletes === 1 ? new Response(null, { status: 500 }) : Response.json({ result: true });
    }),
  });

  assert.deepEqual(calls, ['GET', 'DELETE', 'DELETE']);
  assert.equal(rendered, 1);
  assert.equal(errors.length, 1);
});

test('leaving the chat aborts the pending receive without deleting or rendering', async () => {
  const controller = new AbortController();
  const calls: string[] = [];

  await pollNotifications({
    signal: controller.signal,
    onError: () => assert.fail('aborted request must not show an error'),
    onNotification: () => assert.fail('aborted request must not render'),
    api: createGreenApi({ idInstance: 'test-id', apiTokenInstance: 'test-token' }, async (_, options) => {
      calls.push(options?.method ?? 'GET');
      controller.abort();
      return Response.json(notification);
    }),
  });

  assert.deepEqual(calls, ['GET']);
});

test('history loading after a notification preserves it without duplicate messages', () => {
  const incoming = notificationToMessage(notification, '283839219');
  assert.ok(incoming);
  assert.equal(incoming.text, 'Привет от Green-API!');
  assert.equal(incoming.type, 'incoming');
  assert.equal(notificationToMessage(notification, 'another-chat'), null);

  const older: ChatMessage = { time: '12:00', id: 'older', timestamp: incoming.timestamp - 10, type: 'outgoing', text: 'Ранее' };
  const merged = mergeMessages([older, incoming], [incoming]);
  assert.deepEqual(merged.map((message) => message.id), ['older', 'incoming-1']);
});
