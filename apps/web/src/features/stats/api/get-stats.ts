import { queryOptions } from '@tanstack/react-query';
import { API_ROUTES, type StatsDto } from '@conduit/contracts';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const statsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.stats.current(),
    queryFn: () => api.get<StatsDto>(API_ROUTES.stats.get),
  });
