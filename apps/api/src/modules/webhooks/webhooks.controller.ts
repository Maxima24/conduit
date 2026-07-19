import { Controller, Headers, Param, Post, type RawBodyRequest, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SIGNATURE_HEADER, type WebhookIngestResponse } from '@conduit/contracts';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post(':source')
  ingest(
    @Param('source') source: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers(SIGNATURE_HEADER) signature?: string,
  ): Promise<WebhookIngestResponse> {
    // rawBody is populated by NestFactory({ rawBody: true }); fall back for safety.
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.webhooks.ingest(source, raw, signature);
  }
}
