const AUTH_KEY = 'auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
  return getAuthToken() !== null;
}

export async function login(password: string): Promise<boolean> {
  try {
    const res = await fetch(`${window.location.origin}/api/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return false;
    setAuthToken(password);
    return true;
  } catch {
    return false;
  }
}

export function logout(): void {
  clearAuthToken();
}
