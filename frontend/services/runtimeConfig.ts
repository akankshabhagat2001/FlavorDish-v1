const normalizeBaseUrl = (url: string): string => {
  let normalized = url.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
};

const getEnv = (key: string): string | undefined => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value?.trim() ? value.trim() : undefined;
};

export const resolveApiBaseUrl = (): string => {
  const envUrl = getEnv('VITE_API_URL') || getEnv('VITE_API_BASE_URL');
  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
