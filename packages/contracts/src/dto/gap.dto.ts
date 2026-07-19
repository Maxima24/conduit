import type { GapType } from '../enums';

export interface GapDto {
  id: string;
  type: GapType;
  eventId: string | null;
  sendId: string | null;
  detail: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface ReconcileReportDto {
  gaps: GapDto[];
  summary: Record<GapType, number> & { total: number };
  lastRunAt: string;
  invariantHolds: boolean;
}
