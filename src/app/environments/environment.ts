function readRuntimeApiUrl(): string | null {
  try {
    const w = window as unknown as { __env?: { apiUrl?: unknown } };
    const value = w.__env?.apiUrl;
    if (typeof value === 'string' && value.trim()) return value.trim();
  } catch {
    // ignore
  }
  return null;
}

export const environment = {
  production: true,
  apiUrl: readRuntimeApiUrl() ?? 'http://localhost:3000/api',
};
