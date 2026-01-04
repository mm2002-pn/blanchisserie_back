import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

/**
 * Custom hook for authentication
 */
export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    logout: logoutStore,
    setLoading,
    setError,
    clearError,
  } = useAuthStore();

  const login = async (email: string, _password: string) => {
    setLoading(true);
    clearError();

    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock user data
      const mockUser = {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email,
        role: 'Administrateur' as const,
        isActive: true,
      };

      const mockToken = 'mock-jwt-token';

      setUser(mockUser, mockToken);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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
