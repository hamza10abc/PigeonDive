import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { Webhook } from "svix";
import type { PrismaService } from "../prisma/prisma.service";
import type { SettingsService } from "../settings/settings.service";
import { WebhooksService } from "./webhooks.service";

const SECRET = "whsec_" + Buffer.from("pigeondive-test-secret-key").toString("base64");

function setup(email: Record<string, unknown> | null) {
  const prisma = {
    email: {
      findUnique: vi.fn().mockResolvedValue(email),
      update: vi.fn().mockImplementation((args) => args),
    },
    emailEvent: { create: vi.fn().mockImplementation((args) => args) },
    $transaction: vi.fn().mockResolvedValue([]),
  };
  const settings = { get: vi.fn().mockResolvedValue(SECRET), set: vi.fn().mockResolvedValue(undefined) };
  const service = new WebhooksService(prisma as unknown as PrismaService, settings as unknown as SettingsService);
  return { service, prisma, settings };
}

const baseEmail = { id: "e1", status: "SENT", deliveredAt: null, firstOpenedAt: null, firstClickedAt: null };

function signed(payload: object) {
  const body = JSON.stringify(payload);
  const id = "msg_1";
  const timestamp = new Date();
  const signature = new Webhook(SECRET).sign(id, timestamp, body);
  return {
    body,
    headers: { "svix-id": id, "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)), "svix-signature": signature },
  };
}

describe("WebhooksService signature", () => {
  it("accepts a correctly signed payload", async () => {
    const { service, prisma, settings } = setup(baseEmail);
    const { body, headers } = signed({ type: "email.delivered", created_at: "2026-01-01T10:00:00Z", data: { email_id: "re_1" } });
    await expect(service.handleResend(body, headers)).resolves.toEqual({ status: "applied" });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(settings.set).toHaveBeenCalledWith("lastWebhookAt", expect.any(String));
  });

  it("explains how to fix it when no signing secret is saved yet", async () => {
    const { service, settings } = setup(baseEmail);
    settings.get.mockResolvedValue(null);
    const { body, headers } = signed({ type: "email.delivered", data: { email_id: "re_1" } });
    await expect(service.handleResend(body, headers)).rejects.toMatchObject({ status: 503 });
  });

  it("rejects a bad signature with 401 and touches nothing", async () => {
    const { service, prisma } = setup(baseEmail);
    const { body, headers } = signed({ type: "email.delivered", data: { email_id: "re_1" } });
    await expect(service.handleResend(body + " ", headers)).rejects.toMatchObject({ status: 401 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("WebhooksService.applyEvent", () => {
  it("ignores emails it did not send", async () => {
    const { service } = setup(null);
    await expect(service.applyEvent({ type: "email.delivered", data: { email_id: "x" } }, "m1")).resolves.toEqual({ status: "ignored" });
  });

  it("does not let a late 'sent' event downgrade DELIVERED", async () => {
    const { service, prisma } = setup({ ...baseEmail, status: "DELIVERED" });
    await service.applyEvent({ type: "email.sent", data: { email_id: "re_1" } }, "m2");
    const updateArgs = prisma.email.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe("DELIVERED");
  });

  it("counts a real click but only flags a click right after delivery as a bot", async () => {
    const delivered = new Date("2026-01-01T10:00:00Z");
    const { service, prisma } = setup({ ...baseEmail, status: "DELIVERED", deliveredAt: delivered });

    await service.applyEvent({ type: "email.clicked", created_at: "2026-01-01T10:00:01Z", data: { email_id: "re_1", click: { link: "https://x.com" } } }, "m3");
    expect(prisma.email.update.mock.calls[0][0].data.clickCount).toBeUndefined();
    expect(prisma.emailEvent.create.mock.calls[0][0].data.metadata.likelyBot).toBe(true);

    await service.applyEvent({ type: "email.clicked", created_at: "2026-01-01T10:05:00Z", data: { email_id: "re_1", click: { link: "https://x.com" } } }, "m4");
    expect(prisma.email.update.mock.calls[1][0].data.clickCount).toEqual({ increment: 1 });
  });

  it("treats a redelivered event (unique providerEventId) as a no-op", async () => {
    const { service, prisma } = setup(baseEmail);
    prisma.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
    await expect(service.applyEvent({ type: "email.delivered", data: { email_id: "re_1" } }, "m5")).resolves.toEqual({ status: "duplicate" });
  });
});
