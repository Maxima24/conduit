/** Cursor-paginated envelope used by every list endpoint. `nextCursor: null` means end. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}
