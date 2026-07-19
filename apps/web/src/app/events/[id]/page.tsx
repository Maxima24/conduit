import { EventDetailView } from '@/features/events/components/event-detail-view';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetailView id={id} />;
}
