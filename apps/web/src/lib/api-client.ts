import type { ApiError } from '@conduit/contracts';
import { isMockMode, mockResolve } from '@/mocks';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiClientError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Mock adapter — every view works before the API lands (env-var flip to go live).
  if (isMockMode()) {
    return mockResolve<T>(path, init);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const parsed = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      parsed ?? {
        statusCode: res.status,
        code: 'UNKNOWN',
        message: res.statusText || 'Request failed',
        timestamp: new Date().toISOString(),
        path,
      },
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
};
