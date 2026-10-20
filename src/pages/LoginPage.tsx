import { Navigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm.tsx';
import type { useAuth } from '../hooks/useAuth.ts';
import { getLoginDestination } from '../routing/paths.ts';

export default function LoginPage({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const location = useLocation();

  if (auth.credentials) return <Navigate to={getLoginDestination(location.state)} replace />;

  return <LoginForm isLoading={auth.isLoading} error={auth.error} onLogin={auth.login} />;
}
