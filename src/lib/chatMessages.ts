import type { ApiNotification, ChatMessage, HistoryMessage, MessageDirection } from '../types.ts';

export function formatMessageTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function mergeMessages(previous: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  const byId = new Map(previous.map((message) => [message.id, message]));
  for (const message of next) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function historyToMessages(history: HistoryMessage[]): ChatMessage[] {
  return history
    .filter((item) => item && (item.type === 'incoming' || item.type === 'outgoing'))
    .map((item) => ({
      id: item.idMessage || crypto.randomUUID(),
      type: item.type,
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0,
      text: item.isDeleted ? 'Сообщение удалено' : item.textMessage ?? 'Нетекстовое сообщение',
      time: typeof item.timestamp === 'number' ? formatMessageTime(item.timestamp) : '',
    }));
}

export function notificationToMessage(notification: ApiNotification, chatId: string): ChatMessage | null {
  const body = notification.body;
  if (!body || String(body.senderData?.chatId ?? body.chatId ?? '') !== String(chatId)) return null;

  const types: Record<string, MessageDirection> = {
    incomingMessageReceived: 'incoming',
    outgoingMessageReceived: 'outgoing',
    outgoingAPIMessageReceived: 'outgoing',
  };
  const type = types[body.typeWebhook];
  if (!type || !body.idMessage) return null;

  const timestamp = typeof body.timestamp === 'number' ? body.timestamp : Date.now() / 1000;
  return {
    id: body.idMessage,
    type,
    timestamp,
    text: body.messageData?.textMessageData?.textMessage
      ?? body.messageData?.extendedTextMessageData?.text
      ?? 'Нетекстовое сообщение',
    time: formatMessageTime(timestamp),
  };
}
