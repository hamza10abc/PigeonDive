import { describe, expect, it } from "vitest";
import { isLikelyBotClick, nextStatus, statusForEvent } from "./email-status";
import { buildFromAddress, normalizeLocalPart } from "./from-address";

describe("normalizeLocalPart", () => {
  it("lowercases and trims valid names", () => {
    expect(normalizeLocalPart("  Hello.Team ")).toBe("hello.team");
    expect(normalizeLocalPart("no-reply")).toBe("no-reply");
    expect(normalizeLocalPart("a")).toBe("a");
  });

  it("rejects anything that could smuggle a domain or break the address", () => {
    for (const bad of ["", "a@b.com", "a b", ".start", "end.", "a..b", "-x", "x-", "a/b", "é"]) {
      expect(normalizeLocalPart(bad), bad).toBeNull();
    }
    expect(normalizeLocalPart("a".repeat(65))).toBeNull();
  });

  it("always builds on the fixed domain", () => {
    expect(buildFromAddress("hello", "notifications.cozmolabs.com")).toBe("hello@notifications.cozmolabs.com");
  });
});

describe("email status", () => {
  it("only moves forward", () => {
    expect(nextStatus("DELIVERED", "SENT")).toBe("DELIVERED");
    expect(nextStatus("SENT", "DELIVERED")).toBe("DELIVERED");
    expect(nextStatus("DELIVERED", "BOUNCED")).toBe("BOUNCED");
    expect(nextStatus("COMPLAINED", "DELIVERED")).toBe("COMPLAINED");
  });

  it("maps webhook events and ignores open/click", () => {
    expect(statusForEvent("email.delivered")).toBe("DELIVERED");
    expect(statusForEvent("email.delivery_delayed")).toBe("DELAYED");
    expect(statusForEvent("email.opened")).toBeNull();
    expect(statusForEvent("email.clicked")).toBeNull();
  });

  it("flags clicks within seconds of delivery as likely bots", () => {
    const delivered = new Date("2026-01-01T10:00:00Z");
    expect(isLikelyBotClick(delivered, new Date("2026-01-01T10:00:02Z"))).toBe(true);
    expect(isLikelyBotClick(delivered, new Date("2026-01-01T10:00:30Z"))).toBe(false);
    expect(isLikelyBotClick(null, new Date())).toBe(false);
  });
});
