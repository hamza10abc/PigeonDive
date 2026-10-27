import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { SettingsService } from "../settings/settings.service";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./email-provider";

@Injectable()
export class ResendProvider implements EmailProvider {
  private client: { key: string; resend: Resend } | null = null;

  constructor(private readonly settings: SettingsService) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = await this.settings.get("resendApiKey");
    if (!apiKey) return { ok: false, error: "Add your Resend API key in Settings first" };
    // The key can change from the Settings page, so the client is rebuilt when it does.
    if (this.client?.key !== apiKey) this.client = { key: apiKey, resend: new Resend(apiKey) };

    try {
      const { data, error } = await this.client.resend.emails.send(
        {
          from: input.from,
          to: input.to,
          subject: input.subject,
          ...(input.format === "HTML" ? { html: input.body } : { text: input.body }),
        },
        { idempotencyKey: input.idempotencyKey },
      );
      if (error || !data) return { ok: false, error: error?.message ?? "Resend returned no data" };
      return { ok: true, providerId: data.id };
    } catch (caught) {
      return { ok: false, error: caught instanceof Error ? caught.message : "Unknown send error" };
    }
  }
}
