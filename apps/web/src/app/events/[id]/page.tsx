import { EventDetailView } from '@/features/events/components/event-detail-view';
import { LegacyPageFrame } from '../../_components/legacy-page-frame';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LegacyPageFrame><EventDetailView id={id} /></LegacyPageFrame>;
}
