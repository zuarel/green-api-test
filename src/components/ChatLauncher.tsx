import styles from '../styles/Auth.module.css';
import { useEffect, useRef } from 'react';
import type { SubmitEvent } from 'react';
import type { ActiveChat, Credentials } from '../types.ts';
import { useAccountCheck } from '../hooks/useAccountCheck.ts';
import LogoutButton from './LogoutButton.tsx';

interface ChatLauncherProps {
  credentials: Credentials;
  onOpen: (chat: ActiveChat) => void;
}

export default function ChatLauncher({ credentials, onOpen }: ChatLauncherProps) {
  const { isLoading, error, isNotFound, checkPhone, closeNotFound } = useAccountCheck(credentials, onOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isNotFound && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [isNotFound]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    void checkPhone(String(new FormData(event.currentTarget).get('phone') ?? ''));
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="chat-title">
        <h1 id="chat-title">Новый чат</h1>
        <p className={styles.description}>Введите номер с кодом страны: только цифры, без знаков и пробелов</p>
        <form onSubmit={handleSubmit} aria-busy={isLoading}>
          <label htmlFor="phone">Номер телефона</label>
          <input
            id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel"
            placeholder="79991234567" pattern="[1-9][0-9]{6,14}"
            title="Введите от 7 до 15 цифр с кодом страны, без знаков и пробелов" required
          />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Проверка…' : 'начать чат'}</button>
          {error && <p className={styles.message} role="status">{error}</p>}
        </form>
        <LogoutButton className={styles.sessionActions} appearance="link" />
      </section>
      <dialog
        ref={dialogRef} onClose={closeNotFound} className={`${styles.card} ${styles.dialog}`}
        aria-labelledby="user-not-found-title" aria-describedby="user-not-found-description"
      >
        <h2 id="user-not-found-title">Пользователь не найден</h2>
        <p id="user-not-found-description" className={styles.description}>
          Пользователь с указанным номером телефона не найден. Проверьте номер и попробуйте ещё раз.
        </p>
        <form method="dialog"><button type="submit" autoFocus>Закрыть</button></form>
      </dialog>
    </main>
  );
}
