import { queryOptions } from '@tanstack/react-query';
import { API_ROUTES, type Paginated, type SendDto } from '@conduit/contracts';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { SendFilters } from '@/lib/filters';

function toParams(f: SendFilters): string {
  const p = new URLSearchParams();
  if (f.status) p.set('status', f.status);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const sendsQueryOptions = (filters: SendFilters) =>
  queryOptions({
    queryKey: queryKeys.sends.list(filters),
    queryFn: () => api.get<Paginated<SendDto>>(`${API_ROUTES.sends.list}${toParams(filters)}`),
  });
