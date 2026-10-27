import type { EmailStatus } from "@prisma/client";

// Webhooks can arrive out of order (e.g. "delivered" before "sent"). A status only ever moves
// forward in this ranking, so a late event can't pull DELIVERED back to SENT.
const RANK: Record<EmailStatus, number> = {
  QUEUED: 0,
  SENT: 1,
  DELAYED: 2,
  DELIVERED: 3,
  FAILED: 4,
  BOUNCED: 4,
  COMPLAINED: 5,
};

export function nextStatus(current: EmailStatus, candidate: EmailStatus): EmailStatus {
  return RANK[candidate] > RANK[current] ? candidate : current;
}

/** Resend webhook event type → the status it implies (opened/clicked don't change status). */
export function statusForEvent(type: string): EmailStatus | null {
  switch (type) {
    case "email.sent":
      return "SENT";
    case "email.delivery_delayed":
      return "DELAYED";
    case "email.delivered":
      return "DELIVERED";
    case "email.bounced":
      return "BOUNCED";
    case "email.complained":
      return "COMPLAINED";
    case "email.failed":
      return "FAILED";
    default:
      return null;
  }
}

/** Mail scanners (Outlook Safe Links, Proofpoint…) pre-click links within seconds of delivery. */
export const LIKELY_BOT_CLICK_MS = 5_000;

export function isLikelyBotClick(deliveredAt: Date | null, clickedAt: Date): boolean {
  if (!deliveredAt) return false;
  const delta = clickedAt.getTime() - deliveredAt.getTime();
  return delta >= 0 && delta < LIKELY_BOT_CLICK_MS;
}
