/**
 * Mock authentication for Phase H — UI only. No real credentials or API.
 */

const STORAGE_KEY = "adam-mock-session";

export interface MockSession {
  email: string;
  loggedInAt: string; // ISO
}

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MockSession;
    if (data?.email && data?.loggedInAt) return data;
    return null;
  } catch {
    return null;
  }
}

export function setMockSession(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const session: MockSession = {
      email,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearMockSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
