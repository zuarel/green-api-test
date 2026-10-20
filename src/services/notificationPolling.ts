import type { GreenApi } from '../api/greenApi.ts';
import type { ApiNotification } from '../types.ts';
import { getErrorMessage } from '../lib/errors.ts';

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
}

interface PollingOptions {
  api: Pick<GreenApi, 'receiveNotification' | 'deleteNotification'>;
  signal: AbortSignal;
  onNotification: (notification: ApiNotification) => void;
  onError: (error: string) => void;
  retryDelay?: number;
}

export async function pollNotifications({ api, signal, onNotification, onError, retryDelay = 3000 }: PollingOptions) {
  const pending: ApiNotification[] = [];

  while (!signal.aborted) {
    try {
      if (!pending.length) {
        const notifications = await api.receiveNotification(signal);
        if (signal.aborted) return;
        pending.push(...notifications);

        if (!pending.length) {
          onError('');
          await pause(200, signal);
          continue;
        }
      }

      const notification = pending[0];
      await api.deleteNotification(notification.receiptId, signal);
      if (signal.aborted) return;
      onNotification(notification);
      pending.shift();
      onError('');
    } catch (error) {
      if (signal.aborted) return;
      onError(`${getErrorMessage(error, 'Не удалось получить уведомления.')} Переподключаемся…`);
      await pause(retryDelay, signal);
    }
  }
}
