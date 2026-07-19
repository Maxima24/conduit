'use client';

import { useFiltersStore } from '@/stores/filters.store';

export function useEventFilters() {
  const filters = useFiltersStore((s) => s.events);
  const setEventFilters = useFiltersStore((s) => s.setEventFilters);
  const resetEventFilters = useFiltersStore((s) => s.resetEventFilters);
  return { filters, setEventFilters, resetEventFilters };
}
