import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../prisma/prisma.service";
import type { EmailProvider } from "../providers/email-provider";
import type { SettingsService } from "../settings/settings.service";
import { EmailsService, whereForView } from "./emails.service";

function setup(
  format: "HTML" | "TEXT",
  providerResult: Awaited<ReturnType<EmailProvider["send"]>>,
  domain: string | null = "notifications.cozmolabs.com",
) {
  const created = { id: "email-1", toEmail: "to@example.com", fromEmail: "", subject: "", format, body: "BODY" };
  const prisma = {
    template: { findUnique: vi.fn().mockResolvedValue({ id: "tpl-1", format, body: "BODY" }) },
    email: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...created, ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...created, ...data })),
    },
    senderIdentity: { upsert: vi.fn().mockResolvedValue({}) },
  };
  const provider: EmailProvider = {
    send: vi.fn().mockResolvedValue(providerResult),
    sendBatch: vi.fn().mockImplementation((inputs: unknown[]) => Promise.resolve(inputs.map(() => providerResult))),
  };
  const settings = { get: vi.fn().mockResolvedValue(domain) };
  const service = new EmailsService(
    prisma as unknown as PrismaService,
    provider,
    settings as unknown as SettingsService,
  );
  return { service, prisma, provider };
}

const input = { to: ["To@Example.com"], templateId: "tpl-1", subject: "Hi", fromLocalPart: "Hello" };

describe("EmailsService.send", () => {
  it("sends HTML templates as html and records the provider id", async () => {
    const { service, provider, prisma } = setup("HTML", { ok: true, providerId: "re_123" });
    const [email] = await service.send("user-1", input);

    expect(provider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "hello@notifications.cozmolabs.com",
        to: "to@example.com",
        format: "HTML",
        body: "BODY",
        idempotencyKey: "email-1",
      }),
    );
    expect(email.status).toBe("SENT");
    expect(email.resendId).toBe("re_123");
    expect(prisma.senderIdentity.upsert).toHaveBeenCalled();
  });

  it("passes plain-text templates through as text", async () => {
    const { service, provider } = setup("TEXT", { ok: true, providerId: "re_456" });
    await service.send("user-1", input);
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({ format: "TEXT" }));
  });

  it("marks the email FAILED with the provider's reason", async () => {
    const { service } = setup("HTML", { ok: false, error: "domain not verified" });
    const [email] = await service.send("user-1", input);
    expect(email.status).toBe("FAILED");
    expect(email.error).toBe("domain not verified");
  });

  it("sends each recipient a separate email, so none can see the others", async () => {
    const { service, provider, prisma } = setup("HTML", { ok: true, providerId: "re_9" });
    const emails = await service.send("user-1", { ...input, to: ["a@x.com", "B@x.com", "a@x.com"] });

    expect(prisma.email.create).toHaveBeenCalledTimes(2);
    expect(provider.send).not.toHaveBeenCalled();
    const batch = (provider.sendBatch as ReturnType<typeof vi.fn>).mock.calls[0][0] as { to: string }[];
    expect(batch.map((e) => e.to)).toEqual(["a@x.com", "b@x.com"]);
    expect(emails).toHaveLength(2);
  });

  it("rejects a sender name that is not a plain local part, without sending", async () => {
    const { service, provider } = setup("HTML", { ok: true, providerId: "x" });
    await expect(service.send("user-1", { ...input, fromLocalPart: "evil@other.com" })).rejects.toThrow();
    expect(provider.send).not.toHaveBeenCalled();
  });

  it("refuses to send until a sending domain is set in Settings", async () => {
    const { service, provider, prisma } = setup("HTML", { ok: true, providerId: "x" }, null);
    await expect(service.send("user-1", input)).rejects.toThrow(/sending domain/i);
    expect(prisma.email.create).not.toHaveBeenCalled();
    expect(provider.send).not.toHaveBeenCalled();
  });
});

describe("whereForView", () => {
  it("maps each Activity filter to a query", () => {
    expect(whereForView(undefined)).toEqual({});
    expect(whereForView("all")).toEqual({});
    expect(whereForView("opened")).toEqual({ openCount: { gt: 0 } });
    expect(whereForView("clicked")).toEqual({ clickCount: { gt: 0 } });
    expect(whereForView("delivered")).toEqual({ deliveredAt: { not: null } });
    expect(whereForView("problems")).toEqual({ status: { in: ["BOUNCED", "COMPLAINED", "FAILED"] } });
  });
});
