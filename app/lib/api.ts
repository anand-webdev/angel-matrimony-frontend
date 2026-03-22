export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export const BACKEND_URL = API_URL.replace('/api', '');

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Bearer token and handles 401 responses
 * by clearing the token and redirecting to the login page.
 */
export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const token = localStorage.getItem('access_token');

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }

  return res;
}
