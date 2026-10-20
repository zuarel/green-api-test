import { useEffect, useState } from 'react';
import type { GreenApi } from '../api/greenApi.ts';
import type { ChatMessage } from '../types.ts';
import { notificationToMessage } from '../lib/chatMessages.ts';
import { pollNotifications } from '../services/notificationPolling.ts';

export function useChatNotifications(api: GreenApi, chatId: string, onMessage: (message: ChatMessage) => void) {
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setError('');

    void pollNotifications({
      api,
      signal: controller.signal,
      onError: setError,
      onNotification: (notification) => {
        const message = notificationToMessage(notification, chatId);
        if (message) onMessage(message);
      },
    });

    return () => controller.abort();
  }, [api, chatId, onMessage]);

  return error;
}
