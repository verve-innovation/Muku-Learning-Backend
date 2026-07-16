import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export function useTabData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { apiRequest } = useApi();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest<T[]>(endpoint);
      setData(result || []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteRecord = async (id: string, deleteEndpoint?: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this record?')) return false;
    try {
      await apiRequest(deleteEndpoint || `${endpoint}/${id}`, { method: 'DELETE' });
      await fetchData();
      return true;
    } catch (err: any) {
      alert(`Error deleting record: ${err.message}`);
      return false;
    }
  };

  return { data, loading, error, refetch: fetchData, deleteRecord };
}
