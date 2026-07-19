import { mockEventDetail, mockEvents, mockReport, mockSends, mockStats } from './fixtures';

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
}

/** Resolve a request path to a typed fixture. Types are identical to the real API. */
export function mockResolve<T>(path: string, init?: RequestInit): Promise<T> {
  const rawPath = path.split('?')[0] ?? path;

  const eventDetail = rawPath.match(/^\/events\/([^/]+)$/);
  if (eventDetail) return Promise.resolve(mockEventDetail(eventDetail[1]) as T);
  if (rawPath === '/events') return Promise.resolve(mockEvents as T);

  const replay = rawPath.match(/^\/sends\/([^/]+)\/replay$/);
  if (replay && init?.method === 'POST') {
    return Promise.resolve({ ...mockSends.items[0], status: 'pending' } as T);
  }
  if (rawPath === '/sends') return Promise.resolve(mockSends as T);

  if (rawPath === '/reconcile') return Promise.resolve(mockReport as T);
  if (rawPath === '/stats') return Promise.resolve(mockStats as T);

  return Promise.reject(new Error(`No mock registered for ${path}`));
}
