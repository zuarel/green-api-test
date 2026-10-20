import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGreenApi } from '../api/greenApi.ts';
import { formatMessageTime, historyToMessages, mergeMessages } from '../lib/chatMessages.ts';
import { getErrorMessage } from '../lib/errors.ts';
import type { ChatMessage, Credentials } from '../types.ts';
import { useChatNotifications } from './useChatNotifications.ts';

export function useChat(credentials: Credentials, chatId: string) {
  const api = useMemo(() => createGreenApi(credentials), [credentials]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const sendRequest = useRef<AbortController | null>(null);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((previous) => mergeMessages(previous, [message]));
  }, []);

  const notificationError = useChatNotifications(api, chatId, addMessage);

  useEffect(() => {
    const controller = new AbortController();
    setIsHistoryLoading(true);
    setHistoryError('');

    async function loadHistory() {
      try {
        const history = await api.getChatHistory(chatId, controller.signal);
        if (controller.signal.aborted) return;
        // A notification may arrive while history is loading; keep both sources.
        setMessages((previous) => mergeMessages(historyToMessages(history), previous));
      } catch (error) {
        if (!controller.signal.aborted) setHistoryError(getErrorMessage(error, 'Не удалось загрузить историю. Проверьте соединение.'));
      } finally {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [api, chatId, historyAttempt]);

  useEffect(() => () => sendRequest.current?.abort(), []);

  async function sendMessage(text: string): Promise<boolean> {
    const message = text.trim();
    if (sendRequest.current || isHistoryLoading || !message) return false;

    const controller = new AbortController();
    sendRequest.current = controller;
    setIsSending(true);
    setSendError('');

    try {
      const data = await api.sendMessage({ chatId, message, typingTime: 1000 }, controller.signal);
      if (controller.signal.aborted) return false;
      const timestamp = Date.now() / 1000;
      addMessage({
        id: data?.idMessage || crypto.randomUUID(),
        type: 'outgoing',
        text: message,
        timestamp,
        time: formatMessageTime(timestamp),
      });
      return true;
    } catch (error) {
      if (!controller.signal.aborted) setSendError(getErrorMessage(error, 'Не удалось подтвердить отправку сообщения. Проверьте соединение.'));
      return false;
    } finally {
      sendRequest.current = null;
      if (!controller.signal.aborted) setIsSending(false);
    }
  }

  return {
    messages, isHistoryLoading, historyError, isSending, sendError, notificationError,
    sendMessage,
    reloadHistory: () => setHistoryAttempt((attempt) => attempt + 1),
    clearSendError: () => setSendError(''),
  };
}
