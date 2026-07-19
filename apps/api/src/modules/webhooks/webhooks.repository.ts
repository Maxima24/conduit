import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Prisma, WebhookEvent } from '../../generated/prisma/client';

export type WebhookEventRow = WebhookEvent;

export interface CreateEventData {
  source: string;
  type: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  signature?: string | null;
}

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent insert. Lets the DB enforce uniqueness (unique constraint on
   * idempotencyKey) and catches the violation — never check-then-insert, which races.
   */
  async createIfNew(
    data: CreateEventData,
  ): Promise<{ event: WebhookEventRow; duplicate: boolean }> {
    try {
      const event = await this.prisma.webhookEvent.create({
        data: {
          source: data.source,
          type: data.type,
          idempotencyKey: data.idempotencyKey,
          // Parsed JSON body — safe to store as Prisma Json input.
          payload: data.payload as Prisma.InputJsonValue,
          signature: data.signature ?? null,
        },
      });
      return { event, duplicate: false };
    } catch (error) {
      if (isUniqueViolation(error, 'idempotencyKey')) {
        const existing = await this.prisma.webhookEvent.findUniqueOrThrow({
          where: { idempotencyKey: data.idempotencyKey },
        });
        return { event: existing, duplicate: true };
      }
      throw error;
    }
  }
}

/** Prisma unique-constraint failure is code P2002; `meta.target` names the field(s). */
function isUniqueViolation(error: unknown, field: string): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  if ((error as { code?: string }).code !== 'P2002') return false;
  const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
  if (!target) return true;
  return Array.isArray(target) ? target.includes(field) : String(target).includes(field);
}
