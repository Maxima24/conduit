import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Seeds realistic stored state for the demo: events across sources/statuses, delivered
 * sends with attempt histories (retries + backoff gaps), dead-lettered sends for the DLQ,
 * and one injected `no_send` gap so the reconciliation dashboard has something to show.
 *
 * Live duplicate/idempotency behaviour is exercised by firing POST /webhooks twice with
 * the same idempotencyKey — the DB unique constraint rejects the second (see WebhooksRepository).
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SOURCES = ['stripe', 'github', 'slack'] as const;
const TYPES: Record<(typeof SOURCES)[number], string[]> = {
  stripe: ['payment_intent.succeeded', 'charge.refunded', 'invoice.paid'],
  github: ['push', 'pull_request.opened', 'issues.closed'],
  slack: ['message.channels', 'app_mention', 'reaction_added'],
};

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T;
}

async function reset(): Promise<void> {
  await prisma.attempt.deleteMany();
  await prisma.reconcileGap.deleteMany();
  await prisma.send.deleteMany();
  await prisma.webhookEvent.deleteMany();
}

async function main(): Promise<void> {
  await reset();

  const base = Date.now();
  let delivered = 0;
  let deadLettered = 0;

  for (let i = 0; i < 40; i++) {
    const source = pick(SOURCES, i);
    const type = pick(TYPES[source], i);
    const receivedAt = new Date(base - i * 60_000);

    // Every 7th event is left `processed` with NO send → an injected reconciliation gap.
    const injectGap = i % 7 === 0 && i > 0;
    // Every 5th (non-gap) event fails all attempts → dead-lettered (DLQ).
    const fails = !injectGap && i % 5 === 0;
    const status = injectGap || fails ? (fails ? 'failed' : 'processed') : 'processed';

    const event = await prisma.webhookEvent.create({
      data: {
        source,
        type,
        idempotencyKey: `${source}_evt_${i.toString().padStart(4, '0')}`,
        status,
        payload: { seq: i, source, type, amount: 1000 + i * 13 },
        receivedAt,
        processedAt: new Date(receivedAt.getTime() + 800),
      },
    });

    if (injectGap) {
      await prisma.reconcileGap.create({
        data: {
          type: 'no_send',
          eventId: event.id,
          detail: `Processed event ${event.id} has no send in a terminal state.`,
          detectedAt: new Date(receivedAt.getTime() + 30_000),
        },
      });
      continue;
    }

    const send = await prisma.send.create({
      data: {
        causedBy: event.id,
        channel: 'email',
        to: `user${i}@example.com`,
        payload: { eventId: event.id },
        status: fails ? 'dead_lettered' : 'sent',
        attempts: fails ? 5 : i % 3 === 0 ? 2 : 1,
        lastError: fails ? 'provider_timeout' : null,
        createdAt: receivedAt,
        deliveredAt: fails ? null : new Date(receivedAt.getTime() + 3_000),
      },
    });

    const attemptCount = send.attempts;
    for (let n = 1; n <= attemptCount; n++) {
      const isLast = n === attemptCount;
      const succeeded = !fails && isLast;
      await prisma.attempt.create({
        data: {
          sendId: send.id,
          attemptNo: n,
          statusCode: succeeded ? 202 : 500,
          error: succeeded ? null : 'provider_unavailable',
          durationMs: 100 + n * 120,
          at: new Date(receivedAt.getTime() + n * 2_000),
          // Exponential-ish backoff gap, except after the final attempt.
          nextRetryAt: isLast ? null : new Date(receivedAt.getTime() + n * 2_000 + 2 ** n * 1_000),
        },
      });
    }

    if (fails) deadLettered++;
    else delivered++;
  }

  const [events, sends, attempts, gaps] = await Promise.all([
    prisma.webhookEvent.count(),
    prisma.send.count(),
    prisma.attempt.count(),
    prisma.reconcileGap.count(),
  ]);

  // eslint-disable-next-line no-console
  console.log(
    `Seeded: ${events} events, ${sends} sends (${delivered} delivered, ${deadLettered} dead-lettered), ${attempts} attempts, ${gaps} gaps.`,
  );
}

main()
  .catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
