export interface StripeEventMetadata {
  eventId: string;
  type: string;
  receivedAt: Date;
}

export interface WebhookValidator {
  verify(signature: string, payload: string): boolean;
}

export class NoopWebhookValidator implements WebhookValidator {
  verify() {
    return true;
  }
}
