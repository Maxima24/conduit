export const QUEUE_NAMES = {
  delivery: 'delivery',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
