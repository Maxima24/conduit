import type { EventStatus } from '@conduit/contracts';
import { Badge } from '@/components/ui/badge';

const TONE: Record<EventStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  received: 'neutral',
  processing: 'info',
  processed: 'success',
  failed: 'danger',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge tone={TONE[status]}>{status}</Badge>;
}
