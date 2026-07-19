/**
 * SSE contract (GET /stream). Deliberately dumb: broadcast "something changed,"
 * the client maps each kind to a TanStack Query invalidation and refetches.
 */
export type StreamEvent =
  | { kind: 'event.created'; eventId: string }
  | { kind: 'event.updated'; eventId: string }
  | { kind: 'send.updated'; sendId: string; causedBy: string }
  | { kind: 'gap.detected'; gapId: string }
  | { kind: 'heartbeat'; at: string };

/** Heartbeat cadence — keeps Render/Vercel proxies from closing the connection. */
export const STREAM_HEARTBEAT_MS = 15_000;
