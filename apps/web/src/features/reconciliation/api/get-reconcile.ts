import { queryOptions } from '@tanstack/react-query';
import { API_ROUTES, type ReconcileReportDto } from '@conduit/contracts';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const reconcileQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.reconcile.report(),
    queryFn: () => api.get<ReconcileReportDto>(API_ROUTES.reconcile.report),
  });
