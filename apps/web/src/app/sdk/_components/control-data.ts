export type CapabilityDefinition = {
  id: string;
  code: string;
  title: string;
  description: string;
  scopes: string[];
};

export const CAPABILITIES: CapabilityDefinition[] = [
  {
    id: 'events',
    code: 'CAP-01',
    title: 'Event Fabric',
    description: 'Read, filter, and inspect normalized event traffic.',
    scopes: ['events:read', 'events:filter'],
  },
  {
    id: 'realtime',
    code: 'CAP-02',
    title: 'Realtime',
    description: 'Open the live event and delivery state stream.',
    scopes: ['events:stream'],
  },
  {
    id: 'delivery',
    code: 'CAP-03',
    title: 'Delivery',
    description: 'Inspect sends and operate failed-delivery replay.',
    scopes: ['sends:read', 'sends:replay', 'sends:dlq:read', 'sends:dlq:replay'],
  },
  {
    id: 'reconcile',
    code: 'CAP-04',
    title: 'Reconciliation',
    description: 'Trace consistency gaps and export audit evidence.',
    scopes: ['reconcile:read', 'reconcile:export', 'gaps:read', 'gaps:deeplink'],
  },
  {
    id: 'analytics',
    code: 'CAP-05',
    title: 'Analytics',
    description: 'Expose delivery health, latency, and metric exports.',
    scopes: ['stats:read', 'stats:export'],
  },
  {
    id: 'webhooks',
    code: 'CAP-06',
    title: 'Webhooks',
    description: 'Ingest signed events and change source policy.',
    scopes: ['webhooks:ingest', 'webhooks:configure'],
  },
  {
    id: 'credentials',
    code: 'CAP-07',
    title: 'Credentials',
    description: 'Inspect, rotate, and govern production API keys.',
    scopes: ['keys:read', 'keys:rotate', 'sdk:manage'],
  },
  {
    id: 'storage',
    code: 'CAP-08',
    title: 'Evidence Store',
    description: 'Reach retained failures, exports, and audit records.',
    scopes: ['sends:dlq:read', 'reconcile:export'],
  },
];

export const MATRIX_ACTIONS = ['Read', 'Create', 'Update', 'Delete', 'Replay', 'Admin'] as const;

export type MatrixAction = (typeof MATRIX_ACTIONS)[number];

export type MatrixRow = {
  id: string;
  label: string;
  actions: Partial<Record<MatrixAction, string>>;
};

export const MATRIX_ROWS: MatrixRow[] = [
  { id: 'events', label: 'Events', actions: { Read: 'events:read', Update: 'events:filter' } },
  { id: 'realtime', label: 'Realtime', actions: { Read: 'events:stream' } },
  { id: 'sends', label: 'Sends', actions: { Read: 'sends:read', Replay: 'sends:replay' } },
  { id: 'dlq', label: 'Dead letter', actions: { Read: 'sends:dlq:read', Replay: 'sends:dlq:replay' } },
  { id: 'reconcile', label: 'Reconcile', actions: { Read: 'reconcile:read', Update: 'gaps:deeplink' } },
  { id: 'analytics', label: 'Analytics', actions: { Read: 'stats:read', Create: 'stats:export' } },
  { id: 'webhooks', label: 'Webhooks', actions: { Create: 'webhooks:ingest', Update: 'webhooks:configure' } },
  { id: 'credentials', label: 'Credentials', actions: { Read: 'keys:read', Update: 'keys:rotate', Admin: 'sdk:manage' } },
];

export const ENDPOINTS = [
  { method: 'GET', path: '/events', scope: 'events:read' },
  { method: 'GET', path: '/stream', scope: 'events:stream' },
  { method: 'POST', path: '/sends/:id/replay', scope: 'sends:replay' },
  { method: 'GET', path: '/reconcile', scope: 'reconcile:read' },
  { method: 'GET', path: '/stats', scope: 'stats:read' },
  { method: 'POST', path: '/webhooks', scope: 'webhooks:ingest' },
  { method: 'POST', path: '/keys/rotate', scope: 'keys:rotate' },
];
