export function getErrorMessage(error: unknown, fallback = 'Не удалось выполнить запрос. Проверьте соединение.') {
  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'Время ожидания ответа истекло. Попробуйте ещё раз.';
  }
  if (error instanceof TypeError || error instanceof SyntaxError) return fallback;
  return error instanceof Error ? error.message : fallback;
}
