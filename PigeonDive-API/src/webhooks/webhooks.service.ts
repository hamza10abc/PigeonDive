import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Webhook } from "svix";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { isLikelyBotClick, nextStatus, statusForEvent } from "../emails/email-status";

export type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    click?: { link?: string; userAgent?: string };
    bounce?: { message?: string };
  };
};

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Verifies the Svix signature against the raw body, then applies the event. */
  async handleResend(rawBody: string, headers: Record<string, string | string[] | undefined>) {
    const secret = await this.settings.get("webhookSecret");
    if (!secret) throw new ServiceUnavailableException("Add the webhook signing secret in Settings first");

    const svixHeaders = {
      "svix-id": String(headers["svix-id"] ?? ""),
      "svix-timestamp": String(headers["svix-timestamp"] ?? ""),
      "svix-signature": String(headers["svix-signature"] ?? ""),
    };
    let payload: ResendWebhookPayload;
    try {
      // verify() only throws on a bad signature/timestamp; the payload is parsed from the same
      // bytes that were verified, never from a re-serialised copy.
      new Webhook(secret).verify(rawBody, svixHeaders);
      payload = JSON.parse(rawBody) as ResendWebhookPayload;
    } catch {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    // Lets the Settings page say "events are arriving" without anyone reading logs.
    await this.settings.set("lastWebhookAt", new Date().toISOString());
    return this.applyEvent(payload, svixHeaders["svix-id"]);
  }

  async applyEvent(payload: ResendWebhookPayload, providerEventId: string) {
    const resendId = payload.data?.email_id;
    if (!resendId) return { status: "ignored" as const };

    // Unknown ids are ignored rather than errored: the same Resend account may send mail from
    // other apps, and a non-2xx here would make Resend retry those for nothing.
    const email = await this.prisma.email.findUnique({ where: { resendId } });
    if (!email) return { status: "ignored" as const };

    const occurredAt = payload.created_at ? new Date(payload.created_at) : new Date();
    const data: Prisma.EmailUpdateInput = {};
    let metadata: Prisma.InputJsonValue | undefined;

    const implied = statusForEvent(payload.type);
    if (implied) data.status = nextStatus(email.status, implied);
    if (payload.type === "email.delivered") data.deliveredAt = occurredAt;

    if (payload.type === "email.opened") {
      data.openCount = { increment: 1 };
      if (!email.firstOpenedAt) data.firstOpenedAt = occurredAt;
    }
    if (payload.type === "email.clicked") {
      const likelyBot = isLikelyBotClick(email.deliveredAt, occurredAt);
      metadata = {
        link: payload.data?.click?.link ?? null,
        userAgent: payload.data?.click?.userAgent ?? null,
        likelyBot,
      };
      if (!likelyBot) {
        data.clickCount = { increment: 1 };
        if (!email.firstClickedAt) data.firstClickedAt = occurredAt;
      }
    }
    if (payload.type === "email.bounced" || payload.type === "email.failed") {
      const reason = payload.data?.bounce?.message;
      if (reason) data.error = reason;
    }

    try {
      await this.prisma.$transaction([
        this.prisma.emailEvent.create({
          data: { emailId: email.id, type: payload.type, occurredAt, metadata, providerEventId },
        }),
        this.prisma.email.update({ where: { id: email.id }, data }),
      ]);
    } catch (error) {
      // A redelivered webhook hits the unique providerEventId, which is a no-op, not a failure.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { status: "duplicate" as const };
      }
      throw error;
    }
    return { status: "applied" as const };
  }
}
