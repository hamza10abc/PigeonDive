import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { SettingsService } from "../settings/settings.service";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./email-provider";

const body = (input: SendEmailInput) => (input.format === "HTML" ? { html: input.body } : { text: input.body });

@Injectable()
export class ResendProvider implements EmailProvider {
  private client: { key: string; resend: Resend } | null = null;

  constructor(private readonly settings: SettingsService) {}

  private async resend(): Promise<Resend | null> {
    const apiKey = await this.settings.get("resendApiKey");
    if (!apiKey) return null;
    // The key can change from the Settings page, so the client is rebuilt when it does.
    if (this.client?.key !== apiKey) this.client = { key: apiKey, resend: new Resend(apiKey) };
    return this.client.resend;
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const resend = await this.resend();
    if (!resend) return { ok: false, error: "Add your Resend API key in Settings first" };

    try {
      const { data, error } = await resend.emails.send(
        { from: input.from, to: input.to, subject: input.subject, ...body(input) },
        { idempotencyKey: input.idempotencyKey },
      );
      if (error || !data) return { ok: false, error: error?.message ?? "Resend returned no data" };
      return { ok: true, providerId: data.id };
    } catch (caught) {
      return { ok: false, error: caught instanceof Error ? caught.message : "Unknown send error" };
    }
  }

  async sendBatch(inputs: SendEmailInput[]): Promise<SendEmailResult[]> {
    const fail = (error: string): SendEmailResult[] => inputs.map(() => ({ ok: false, error }));
    const resend = await this.resend();
    if (!resend) return fail("Add your Resend API key in Settings first");

    try {
      // Each entry is its own email with a single recipient. "permissive" lets one bad address fail
      // alone instead of rejecting the whole batch.
      const { data, error } = await resend.batch.send(
        inputs.map((input) => ({ from: input.from, to: input.to, subject: input.subject, ...body(input) })),
        { idempotencyKey: `batch-${inputs[0].idempotencyKey}-${inputs.length}`, batchValidation: "permissive" },
      );
      if (error || !data) return fail(error?.message ?? "Resend returned no data");

      const rejected = new Map(data.errors.map((e) => [e.index, e.message]));
      const ids = [...data.data];
      return inputs.map((_, index) => {
        const reason = rejected.get(index);
        if (reason !== undefined) return { ok: false, error: reason };
        const id = ids.shift()?.id;
        return id ? { ok: true, providerId: id } : { ok: false, error: "Resend returned no id" };
      });
    } catch (caught) {
      return fail(caught instanceof Error ? caught.message : "Unknown send error");
    }
  }
}
