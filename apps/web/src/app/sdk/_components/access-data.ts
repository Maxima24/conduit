export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ScopeDefinition = {
  id: string;
  label: string;
  description: string;
  grants: string[];
  risk: RiskLevel;
};

export type ScopeGroup = {
  id: string;
  label: string;
  scopes: ScopeDefinition[];
};

export type AccessEntity = {
  id: string;
  label: string;
  shortLabel: string;
  type: 'team' | 'key';
};

export const SCOPE_GROUPS: ScopeGroup[] = [
  {
    id: 'events',
    label: 'Events',
    scopes: [
      { id: 'events:read', label: 'events:read', description: 'Read normalized webhook events and their delivery state.', grants: ['event payloads', 'delivery status', 'event detail'], risk: 'low' },
      { id: 'events:stream', label: 'events:stream', description: 'Consume real-time SSE updates from the stream endpoint.', grants: ['live event changes', 'send updates', 'gap signals'], risk: 'low' },
      { id: 'events:filter', label: 'events:filter', description: 'Query event history using source, status, and time filters.', grants: ['advanced filters', 'saved queries', 'cursor traversal'], risk: 'low' },
    ],
  },
  {
    id: 'sends',
    label: 'Sends',
    scopes: [
      { id: 'sends:read', label: 'sends:read', description: 'Inspect outbound delivery attempts and provider responses.', grants: ['attempt history', 'response codes', 'delivery timing'], risk: 'low' },
      { id: 'sends:replay', label: 'sends:replay', description: 'Replay an individual failed delivery to its destination.', grants: ['manual replay', 'retry scheduling', 'payload delivery'], risk: 'high' },
      { id: 'sends:dlq:read', label: 'sends:dlq:read', description: 'Read deliveries held in the dead-letter queue.', grants: ['DLQ inventory', 'failure detail', 'attempt history'], risk: 'medium' },
      { id: 'sends:dlq:replay', label: 'sends:dlq:replay', description: 'Replay dead-lettered deliveries in bulk or individually.', grants: ['DLQ replay', 'bulk retry', 'delivery mutation'], risk: 'high' },
    ],
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    scopes: [
      { id: 'reconcile:read', label: 'reconcile:read', description: 'Read reconciliation reports across event and send records.', grants: ['health summary', 'report detail', 'consistency state'], risk: 'low' },
      { id: 'reconcile:export', label: 'reconcile:export', description: 'Export reconciliation evidence for external audit.', grants: ['report export', 'audit bundle', 'historical evidence'], risk: 'medium' },
      { id: 'gaps:read', label: 'gaps:read', description: 'Inspect missing, orphaned, and terminal delivery gaps.', grants: ['gap inventory', 'gap detail', 'detection metadata'], risk: 'low' },
      { id: 'gaps:deeplink', label: 'gaps:deeplink', description: 'Follow a reconciliation gap into its underlying event.', grants: ['event linkage', 'trace navigation', 'record correlation'], risk: 'medium' },
    ],
  },
  {
    id: 'stats',
    label: 'Stats',
    scopes: [
      { id: 'stats:read', label: 'stats:read', description: 'Read aggregate delivery and reliability metrics.', grants: ['delivery totals', 'success rates', 'latency metrics'], risk: 'low' },
      { id: 'stats:export', label: 'stats:export', description: 'Export aggregate metrics for downstream analysis.', grants: ['CSV export', 'time-series export', 'metric snapshots'], risk: 'medium' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    scopes: [
      { id: 'webhooks:ingest', label: 'webhooks:ingest', description: 'Submit signed webhooks into the Conduit ingestion layer.', grants: ['webhook ingestion', 'signature validation', 'event creation'], risk: 'high' },
      { id: 'webhooks:configure', label: 'webhooks:configure', description: 'Change webhook sources, secrets, and delivery policy.', grants: ['source mutation', 'secret rotation', 'delivery policy'], risk: 'critical' },
      { id: 'sdk:manage', label: 'sdk:manage', description: 'Publish SDK permissions and manage access entities.', grants: ['scope publishing', 'team access', 'permission mutation'], risk: 'critical' },
      { id: 'keys:read', label: 'keys:read', description: 'Inspect API key metadata without revealing key material.', grants: ['key inventory', 'usage metadata', 'team assignment'], risk: 'medium' },
      { id: 'keys:rotate', label: 'keys:rotate', description: 'Generate, revoke, and rotate production API keys.', grants: ['key generation', 'key revocation', 'credential rotation'], risk: 'critical' },
    ],
  },
];

export const ALL_SCOPES = SCOPE_GROUPS.flatMap((group) => group.scopes);

export const ENTITIES: AccessEntity[] = [
  { id: 'team-alpha', label: 'Team Alpha', shortLabel: 'Alpha', type: 'team' },
  { id: 'team-beta', label: 'Team Beta', shortLabel: 'Beta', type: 'team' },
  { id: 'key-001', label: 'KEY-001', shortLabel: '001', type: 'key' },
  { id: 'key-002', label: 'KEY-002', shortLabel: '002', type: 'key' },
  { id: 'key-003', label: 'KEY-003', shortLabel: '003', type: 'key' },
];

export const INITIAL_GRANTS: Record<string, string[]> = {
  'team-alpha': ['events:read', 'events:stream', 'events:filter', 'sends:read', 'sends:dlq:read', 'reconcile:read', 'stats:read'],
  'team-beta': ['events:read', 'events:filter', 'sends:read', 'reconcile:read'],
  'key-001': ['events:read', 'events:stream', 'sends:read', 'stats:read'],
  'key-002': ['events:read', 'sends:read', 'sends:dlq:read'],
  'key-003': ['sends:read'],
};

export const getScope = (scopeId: string) =>
  ALL_SCOPES.find((scope) => scope.id === scopeId) ?? ALL_SCOPES[0];
