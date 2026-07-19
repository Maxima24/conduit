import type { EventStatus, SendStatus } from '@conduit/contracts';

/** View-model filter shapes (client/UI intent). Never wire types. */
export interface EventFilters {
  status?: EventStatus;
  source?: string;
  from?: string;
  to?: string;
}

export interface SendFilters {
  status?: SendStatus;
}

export const DEFAULT_EVENT_FILTERS: EventFilters = {};
export const DEFAULT_SEND_FILTERS: SendFilters = { status: 'dead_lettered' };
