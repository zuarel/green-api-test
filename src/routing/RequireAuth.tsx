import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import type { Credentials } from '../types.ts';
import { paths } from './paths.ts';

interface AuthContext {
  credentials: Credentials;
  logout: () => void;
}

interface RequireAuthProps {
  credentials: Credentials | null;
  logout: () => void;
}

export default function RequireAuth({ credentials, logout }: RequireAuthProps) {
  const location = useLocation();

  if (!credentials) {
    return (
      <Navigate
        to={paths.login} replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <Outlet context={{ credentials, logout } satisfies AuthContext} />;
}

export function useCredentials(): Credentials {
  return useOutletContext<AuthContext>().credentials;
}

export function useLogout(): () => void {
  return useOutletContext<AuthContext>().logout;
}
