import type {
  ApiNotification, CheckAccountResponse, Credentials, HistoryMessage,
  InstanceStateResponse, SendMessageRequest, SendMessageResponse,
} from '../types.ts';

const API_ORIGIN = 'https://4100.api.green-api.com';
const REQUEST_TIMEOUT = 15_000;

export type FetchClient = (url: string, options?: RequestInit) => Promise<Response>;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Ошибка API (${status}).`);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function createGreenApi(credentials: Credentials, fetchClient: FetchClient = fetch) {
  const baseUrl = `${API_ORIGIN}/waInstance${encodeURIComponent(credentials.idInstance)}`;
  const token = encodeURIComponent(credentials.apiTokenInstance);

  async function request<T>(
    methodName: string,
    method: 'GET' | 'POST' | 'DELETE',
    signal?: AbortSignal,
    payload?: unknown,
    suffix = '',
  ): Promise<T> {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT);
    const response = await fetchClient(`${baseUrl}/${methodName}/${token}${suffix}`, {
      method,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      ...(payload === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    });

    if (!response.ok) throw new ApiError(response.status);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  return {
    async getStateInstance(signal?: AbortSignal) {
      const data = await request<InstanceStateResponse>('getStateInstance', 'GET', signal);
      if (typeof data?.stateInstance !== 'string') throw new Error('API вернул ответ без состояния инстанса.');
      return data;
    },

    async checkAccount(phone: string, signal?: AbortSignal) {
      const data = await request<CheckAccountResponse>('checkAccount', 'POST', signal, { phoneNumber: Number(phone) });
      if (typeof data?.exist !== 'boolean') throw new Error('API вернул результат проверки в неожиданном формате.');
      return data;
    },

    async getChatHistory(chatId: string, signal?: AbortSignal) {
      const data = await request<HistoryMessage[]>('getChatHistory', 'POST', signal, { chatId });
      if (!Array.isArray(data)) throw new Error('API вернул историю в неожиданном формате.');
      return data;
    },

    sendMessage(payload: SendMessageRequest, signal?: AbortSignal) {
      return request<SendMessageResponse>('sendMessage', 'POST', signal, payload);
    },

    async receiveNotification(signal?: AbortSignal): Promise<ApiNotification[]> {
      const data = await request<ApiNotification | ApiNotification[] | null>('receiveNotification', 'GET', signal);
      const notifications = data == null ? [] : Array.isArray(data) ? data : [data];
      if (notifications.some((item) => !item || !['number', 'string'].includes(typeof item.receiptId) || String(item.receiptId).trim() === '')) {
        throw new Error('API вернул уведомление без receiptId.');
      }
      return notifications;
    },

    async deleteNotification(receiptId: ApiNotification['receiptId'], signal?: AbortSignal) {
      await request<unknown>('deleteNotification', 'DELETE', signal, undefined, `/${encodeURIComponent(receiptId)}`);
    },
  };
}

export type GreenApi = ReturnType<typeof createGreenApi>;
