import type { Paginated } from '@conduit/contracts';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizeLimit(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

/**
 * Build a `Paginated<T>` from a page fetched with `take: limit + 1`.
 * The extra row signals a next page; `getId` extracts the cursor from the last kept row.
 */
export function toPage<T>(
  rows: T[],
  limit: number,
  total: number,
  getId: (row: T) => string,
): Paginated<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? getId(last) : null,
    total,
  };
}
