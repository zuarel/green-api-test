import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import type { ActiveChat, Credentials } from '../types.ts';
import { useChat } from '../hooks/useChat.ts';
import styles from './ChatWindow.module.css';
import LogoutButton from './LogoutButton.tsx';

interface ChatWindowProps {
  credentials: Credentials;
  chat: ActiveChat;
  onBack: () => void;
}

export default function ChatWindow({ credentials, chat, onBack }: ChatWindowProps) {
  const { phone, chatId } = chat;
  const [draft, setDraft] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);
  const {
    messages, isHistoryLoading, historyError, isSending, sendError, notificationError,
    sendMessage, reloadHistory, clearSendError,
  } = useChat(credentials, chatId);

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, [messages]);

  async function handleSend(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await sendMessage(draft)) setDraft('');
  }

  return (
    <main className={styles.page}>
      <section className={styles.window} aria-labelledby="conversation-title">
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={onBack} disabled={isSending} aria-label="Назад к выбору номера">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m12 5-7 7 7 7M5 12h15" />
            </svg>
          </button>
          <div className={styles.avatar} aria-hidden="true">{phone.slice(-2)}</div>
          <div className={styles.contact}>
            <h1 id="conversation-title">{phone}</h1>
            <p>Личный чат</p>
          </div>
          <LogoutButton disabled={isSending} />
        </header>

        <div ref={historyRef} className={`${styles.history}${messages.length ? ` ${styles.historyWithMessages}` : ''}`} role="log" aria-label="Сообщения чата" aria-busy={isHistoryLoading}>
          {isHistoryLoading ? <p className={styles.historyStatus} role="status">Загрузка истории…</p>
            : historyError ? <div className={styles.empty} role="status">
              <p>{historyError}</p>
              <button className={styles.historyRetry} type="button" disabled={isSending} onClick={() => reloadHistory()}>
                Повторить
              </button>
            </div> : null}
          {messages.length ? messages.map((item) => (
            <div className={`${styles.bubble}${item.type === 'incoming' ? ` ${styles.incoming}` : ''}`} key={item.id} aria-label={item.type === 'incoming' ? 'Входящее сообщение' : 'Исходящее сообщение'}>
              <p>{item.text}</p>
              <span className={styles.messageTime}>{item.time}</span>
            </div>
          )) : !isHistoryLoading && !historyError && <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">✉</span>
            <h2>Начните разговор</h2>
            <p>Здесь появятся ваши сообщения</p>
          </div>}
        </div>

        <footer className={styles.footer}>
          <form className={styles.composer} onSubmit={handleSend} aria-busy={isSending}>
            <input
              aria-label="Сообщение"
              name="message"
              placeholder="Написать сообщение…"
              autoComplete="off"
              value={draft}
              readOnly={isSending}
              onChange={(event) => {
                setDraft(event.target.value);
                clearSendError();
              }}
            />
            <button className={styles.send} type="submit" disabled={isSending || isHistoryLoading || !draft.trim()} aria-label={isSending ? 'Отправка сообщения' : 'Отправить сообщение'}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.4 2.7a1 1 0 0 0-1.3 1.2L5 11l9 1-9 1-2.9 7.1a1 1 0 0 0 1.3 1.2l18-8.4a1 1 0 0 0 0-1.8z" />
              </svg>
            </button>
          </form>
          {isSending && <p className={styles.notice} role="status">Отправка…</p>}
          {sendError && <p className={styles.notice} role="status">{sendError}</p>}
          {notificationError && <p className={styles.notice} role="status">{notificationError}</p>}
        </footer>
      </section>
    </main>
  );
}
