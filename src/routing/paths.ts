import type { ActiveChat } from '../types.ts';

export const paths = {
  login: '/login',
  newChat: '/chats/new',
};

export function chatPath(chat: ActiveChat): string {
  const query = new URLSearchParams({ phone: chat.phone });
  return `/chats/${encodeURIComponent(chat.chatId)}?${query}`;
}

export function getLoginDestination(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') {
    // Only return to a protected route inside this application.
    if (state.from.startsWith('/chats/')) return state.from;
  }
  return paths.newChat;
}
