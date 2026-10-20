import { useEffect, useRef, useState } from 'react';
import { createGreenApi } from '../api/greenApi.ts';
import { credentialsStorage } from '../lib/credentialsStorage.ts';
import { getErrorMessage } from '../lib/errors.ts';
import type { Credentials } from '../types.ts';

export function useAuth() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const loginRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function restoreSession() {
      try {
        const saved = credentialsStorage.read();

        if (!saved) return;

        const data = await createGreenApi(saved).getStateInstance(controller.signal);

        if (controller.signal.aborted) return;

        if (data.stateInstance === 'authorized') setCredentials(saved);
        else setError('Сохранённый инстанс не авторизован. Введите данные для входа.');
      } catch (error) {
        if (!controller.signal.aborted) setError(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) setIsChecking(false);
      }
    }

    void restoreSession();
    return () => {
      controller.abort();
      loginRequest.current?.abort();
    };
  }, []);

  async function login(values: Credentials) {
    if (loginRequest.current) return;
    const normalized = { idInstance: values.idInstance.trim(), apiTokenInstance: values.apiTokenInstance.trim() };
    if (!normalized.idInstance || !normalized.apiTokenInstance) {
      setError('Заполните idInstance и apiTokenInstance.');
      return;
    }

    const controller = new AbortController();
    loginRequest.current = controller;
    setIsLoading(true);
    setError('');

    try {
      const data = await createGreenApi(normalized).getStateInstance(controller.signal);
      if (controller.signal.aborted) return;
      if (data.stateInstance !== 'authorized') {
        setError(`Состояние инстанса: ${data.stateInstance}`);
        return;
      }
      credentialsStorage.save(normalized);
      setCredentials(normalized);
    } catch (error) {
      if (!controller.signal.aborted) setError(getErrorMessage(error));
    } finally {
      loginRequest.current = null;
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  function logout() {
    credentialsStorage.clear();
    loginRequest.current?.abort();
    loginRequest.current = null;
    setCredentials(null);
    setIsLoading(false);
    setError('');
  }

  return { credentials, isChecking, isLoading, error, login, logout };
}
