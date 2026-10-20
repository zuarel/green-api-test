import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.ts';
import LoginPage from './pages/LoginPage.tsx';
import NewChatPage from './pages/NewChatPage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import RequireAuth from './routing/RequireAuth.tsx';
import { paths } from './routing/paths.ts';
import styles from './styles/Auth.module.css';

export default function App() {
  const auth = useAuth();

  if (auth.isChecking) {
    return (
      <main className={styles.page}>
        <section className={styles.card} aria-busy="true" aria-labelledby="session-title">
          <h1 id="session-title">Проверка авторизации</h1>
          <p className={styles.message} role="status">Проверяем сохранённые данные…</p>
        </section>
      </main>
    );
  }

  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage auth={auth} />} />
      <Route element={<RequireAuth credentials={auth.credentials} logout={auth.logout} />}>
        <Route path={paths.newChat} element={<NewChatPage />} />
        <Route path="/chats/:chatId" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to={paths.newChat} replace />} />
    </Routes>
  );
}
