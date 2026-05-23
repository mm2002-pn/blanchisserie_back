import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { ApiError } from '@/lib/api/client';
import { login as loginApi, logoutApi, mapApiUser } from '@/lib/api/auth.api';

/**
 * Hook d'authentification — branché sur l'API réelle.
 *  - login   : POST /auth/login → store user + tokens
 *  - logout  : best-effort POST /auth/logout puis flush local
 */
export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    logout: logoutStore,
    setLoading,
    setError,
    clearError,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    clearError();
    try {
      const res = await loginApi(email, password);
      const mapped = mapApiUser(res.user);
      setUser(mapped, res.accessToken, res.refreshToken);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.code === 'UNAUTHORIZED'
            ? 'Email ou mot de passe incorrect'
            : err.message
          : err instanceof Error
            ? err.message
            : 'Erreur de connexion';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutApi(refreshToken);
    logoutStore();
    navigate(ROUTES.LOGIN);
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}
