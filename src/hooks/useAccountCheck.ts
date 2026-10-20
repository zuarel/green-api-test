import { useEffect, useRef, useState } from 'react';
import { createGreenApi } from '../api/greenApi.ts';
import { getErrorMessage } from '../lib/errors.ts';
import type { ActiveChat, Credentials } from '../types.ts';

export function useAccountCheck(credentials: Credentials, onOpen: (chat: ActiveChat) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function checkPhone(phone: string) {
    if (request.current) return;
    if (!/^[1-9][0-9]{6,14}$/.test(phone)) {
      setError('Введите от 7 до 15 цифр с кодом страны, без знаков и пробелов.');
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setIsLoading(true);
    setError('');
    setIsNotFound(false);

    try {
      const data = await createGreenApi(credentials).checkAccount(phone, controller.signal);
      if (controller.signal.aborted) return;

      if (!data.exist) {
        setIsNotFound(true);
        return;
      }

      if (typeof data.chatId !== 'string' || !data.chatId.trim()) {
        setError('API не вернул chatId. Не удалось открыть чат.');
        return;
      }
      onOpen({ phone, chatId: data.chatId });
    } catch (error) {
      if (!controller.signal.aborted) setError(getErrorMessage(error));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  return { isLoading, error, isNotFound, checkPhone, closeNotFound: () => setIsNotFound(false) };
}
