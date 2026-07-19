import { EventsView } from '@/features/events/components/events-view';
import { LegacyPageFrame } from '../_components/legacy-page-frame';

export default function EventsPage() {
  return <LegacyPageFrame><EventsView /></LegacyPageFrame>;
}
