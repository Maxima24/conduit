import { API_ROUTES, type SendDto } from '@conduit/contracts';
import { api } from '@/lib/api-client';

export function replaySend(id: string): Promise<SendDto> {
  return api.post<SendDto>(API_ROUTES.sends.replay(id));
}
