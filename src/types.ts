export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export interface ActiveChat {
  phone: string;
  chatId: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

export interface ChatMessage {
  id: string;
  type: MessageDirection;
  timestamp: number;
  text: string;
  time: string;
}

export interface InstanceStateResponse {
  stateInstance: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
  typingTime: number;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface HistoryMessage {
  idMessage?: string;
  type: MessageDirection;
  timestamp?: number;
  textMessage?: string;
  isDeleted?: boolean;
}

export interface ApiNotification {
  receiptId: string | number;
  body?: {
    typeWebhook: string;
    idMessage?: string;
    timestamp?: number;
    chatId?: string;
    senderData?: {
      chatId?: string;
      senderName?: string;
    };
    messageData?: {
      textMessageData?: { textMessage: string };
      extendedTextMessageData?: { text: string };
    };
  };
}
