/**
 * Shared string unions. Defined as `as const` tuples so both the runtime array
 * (for validation / iteration) and the literal union type are available.
 */

export const EVENT_STATUS = ['received', 'processing', 'processed', 'failed'] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const SEND_STATUS = ['pending', 'sent', 'failed', 'dead_lettered'] as const;
export type SendStatus = (typeof SEND_STATUS)[number];

export const CHANNEL = ['email', 'sms', 'webhook'] as const;
export type Channel = (typeof CHANNEL)[number];

export const GAP_TYPE = ['no_send', 'orphan_send', 'duplicate_send', 'stuck'] as const;
export type GapType = (typeof GAP_TYPE)[number];
