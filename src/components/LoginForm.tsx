import styles from '../styles/Auth.module.css';
import type { SubmitEvent } from 'react';
import type { Credentials } from '../types.ts';

interface LoginFormProps {
  isLoading: boolean;
  error: string;
  onLogin: (credentials: Credentials) => Promise<void>;
}

export default function LoginForm({ isLoading, error, onLogin }: LoginFormProps) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onLogin({
      idInstance: String(data.get('idInstance') ?? ''),
      apiTokenInstance: String(data.get('apiTokenInstance') ?? ''),
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <h1 id="auth-title">Вход</h1>
        <p className={styles.description}>Введите данные для авторизации</p>
        <form onSubmit={handleSubmit} aria-busy={isLoading}>
          <label htmlFor="idInstance">idInstance</label>
          <input id="idInstance" name="idInstance" type="text" autoComplete="username" placeholder="Введите idInstance" required />
          <label htmlFor="apiTokenInstance">apiTokenInstance</label>
          <input id="apiTokenInstance" name="apiTokenInstance" type="password" autoComplete="current-password" placeholder="Введите apiTokenInstance" required />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Проверка…' : 'Войти'}</button>
          {error && <p className={styles.message} role="status">{error}</p>}
        </form>
      </section>
    </main>
  );
}
