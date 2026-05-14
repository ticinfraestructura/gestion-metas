const getToken = (): string | null => {
  try {
    const raw = sessionStorage.getItem('auth-session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
};

const handleUnauthorized = () => {
  try {
    sessionStorage.removeItem('auth-session');
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (response.status === 401) {
    handleUnauthorized();
  }
  return response;
};

export const apiGet  = (url: string) => apiFetch(url);
export const apiPost = (url: string, body: unknown) =>
  apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
export const apiPut  = (url: string, body: unknown) =>
  apiFetch(url, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (url: string) => apiFetch(url, { method: 'DELETE' });
