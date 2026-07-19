import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../../../config/config.service';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface ProviderResult {
  statusCode: number;
  providerId: string | null;
  error: string | null;
}

/**
 * Wraps the Resend SDK. Scaffold returns a stubbed success so the module wires up
 * without a live API key.
 *
 * TODO(BE2 · P0): perform the real send and capture the provider response into an Attempt.
 */
@Injectable()
export class ResendProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly client: Resend;

  constructor(private readonly config: AppConfigService) {
    // Fall back to a dummy key so construction never throws in local/dev.
    this.client = new Resend(this.config.resendApiKey || 're_stub');
  }

  async send(input: SendEmailInput): Promise<ProviderResult> {
    this.logger.debug(`(stub) would send email to ${input.to}: "${input.subject}"`);
    // Reference the client so the dependency is real once BE2 implements the send.
    void this.client;
    return { statusCode: 202, providerId: null, error: null };
  }
}
