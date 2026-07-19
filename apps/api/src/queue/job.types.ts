/** Payload enqueued after a webhook event is persisted — the BE1 → BE2 hand-off. */
export interface DeliveryJobData {
  eventId: string;
}

export const DELIVERY_JOB_NAME = 'deliver';
