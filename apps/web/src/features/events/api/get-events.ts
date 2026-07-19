import { queryOptions } from '@tanstack/react-query';
import { API_ROUTES, type EventDto, type Paginated } from '@conduit/contracts';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { EventFilters } from '@/lib/filters';

function toParams(f: EventFilters): string {
  const p = new URLSearchParams();
  if (f.status) p.set('status', f.status);
  if (f.source) p.set('source', f.source);
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const eventsQueryOptions = (filters: EventFilters) =>
  queryOptions({
    queryKey: queryKeys.events.list(filters),
    queryFn: () =>
      api.get<Paginated<EventDto>>(`${API_ROUTES.events.list}${toParams(filters)}`),
  });
