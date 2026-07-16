import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { apiUrl, token, logout } = useAuth();

  const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}/api/admin${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        logout();
        throw new Error('Session expired or unauthorized');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return res.json();
  };

  return { apiRequest };
}
