import { API_ROUTES, type GapDto } from '@conduit/contracts';

/**
 * Deep-link a gap to the offending event or send.
 *
 * Route contract agreed with FE1: a gap opens the event detail view, and the
 * implicated send (if any) is highlighted via `?highlight=<sendId>`. Orphan
 * sends have no source event, so they cannot open an event detail — those return
 * null and the UI renders the send reference without a link.
 */
export function gapDeepLink(gap: GapDto): string | null {
  if (!gap.eventId) return null;
  const base = API_ROUTES.events.detail(gap.eventId);
  return gap.sendId ? `${base}?highlight=${encodeURIComponent(gap.sendId)}` : base;
}
