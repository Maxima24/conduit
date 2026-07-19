/** Header carrying the HMAC signature over the raw request body. */
export const SIGNATURE_HEADER = 'x-signature';

/** Response of POST /webhooks/:source. */
export interface WebhookIngestResponse {
  id: string;
  duplicate: boolean;
}
