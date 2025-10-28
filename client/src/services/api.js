import axios from 'axios';
import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export function useApi() {
  const { token } = useAuth();

  const instance = useMemo(
    () =>
      axios.create({
        baseURL: '/api',
      }),
    []
  );

  useEffect(() => {
    const interceptor = instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
      return config;
    });

    return () => {
      instance.interceptors.request.eject(interceptor);
    };
  }, [instance, token]);

  return instance;
}

const api = axios.create({ baseURL: '/api' });
export default api;
