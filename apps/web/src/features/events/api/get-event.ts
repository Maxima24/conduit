import { queryOptions } from '@tanstack/react-query';
import { API_ROUTES, type EventDetailDto } from '@conduit/contracts';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const eventQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => api.get<EventDetailDto>(API_ROUTES.events.detail(id)),
  });
