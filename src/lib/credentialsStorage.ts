import type { Credentials } from '../types.ts';

export const credentialsStorage = {
  read(): Credentials | null {
    try {
      const idInstance = localStorage.getItem('idInstance')?.trim();
      const apiTokenInstance = localStorage.getItem('apiTokenInstance')?.trim();
      return idInstance && apiTokenInstance ? { idInstance, apiTokenInstance } : null;
    } catch {
      throw new Error('Не удалось прочитать локальное хранилище. Введите данные для входа.');
    }
  },

  save(credentials: Credentials): void {
    try {
      localStorage.setItem('idInstance', credentials.idInstance);
      localStorage.setItem('apiTokenInstance', credentials.apiTokenInstance);
    } catch {
      throw new Error('Не удалось сохранить данные. Разрешите локальное хранилище в браузере и попробуйте снова.');
    }
  },

  clear(): void {
    try {
      localStorage.removeItem('idInstance');
      localStorage.removeItem('apiTokenInstance');
    } catch {
      throw new Error('Не удалось удалить данные сессии из локального хранилища. Попробуйте ещё раз.');
    }
  },
};
