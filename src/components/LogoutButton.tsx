import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../lib/errors.ts';
import { paths } from '../routing/paths.ts';
import { useLogout } from '../routing/RequireAuth.tsx';
import styles from './LogoutButton.module.css';

interface LogoutButtonProps {
  className?: string;
  disabled?: boolean;
  appearance?: 'button' | 'link';
}

export default function LogoutButton({ className = '', disabled = false, appearance = 'button' }: LogoutButtonProps) {
  const logout = useLogout();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  function handleLogout() {
    try {
      logout();
      navigate(paths.login, { replace: true, state: null });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <button className={`${styles.button}${appearance === 'link' ? ` ${styles.link}` : ''}`} type="button" onClick={handleLogout} disabled={disabled}>
        Выйти
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
