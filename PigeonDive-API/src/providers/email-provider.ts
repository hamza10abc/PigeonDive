export type SendEmailInput = {
  from: string;
  to: string;
  subject: string;
  format: "HTML" | "TEXT";
  body: string;
  /** Lets a retried request be a no-op at the provider instead of a duplicate send. */
  idempotencyKey: string;
};

export type SendEmailResult = { ok: true; providerId: string } | { ok: false; error: string };

export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");

/** The only thing the rest of the app knows about sending — Resend today, anything later. */
export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
