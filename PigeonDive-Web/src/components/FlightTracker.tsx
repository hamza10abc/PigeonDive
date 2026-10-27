import { Check, X } from "lucide-react";
import { clock } from "../lib/format";
import type { EmailListItem } from "../types";

type Stage = { key: "sent" | "delivered" | "opened" | "clicked"; label: string; at: string | null; reached: boolean; failed?: boolean };

/** Turns an email's raw fields into the four stages of its journey, and says which one broke. */
export function stagesOf(email: EmailListItem): { stages: Stage[]; reachedCount: number; failure: string | null } {
  const accepted = email.status !== "QUEUED" && email.status !== "FAILED";
  const bounced = email.status === "BOUNCED";
  const complained = email.status === "COMPLAINED";
  const failed = email.status === "FAILED";

  const stages: Stage[] = [
    { key: "sent", label: failed ? "Not sent" : "Sent", at: email.sentAt, reached: accepted, failed },
    { key: "delivered", label: bounced ? "Bounced" : "Delivered", at: email.deliveredAt, reached: !!email.deliveredAt, failed: bounced },
    { key: "opened", label: "Opened", at: email.firstOpenedAt, reached: email.openCount > 0 },
    { key: "clicked", label: "Clicked", at: email.firstClickedAt, reached: email.clickCount > 0, failed: false },
  ];
  const reachedCount = stages.filter((s) => s.reached).length;
  const failure = failed ? "failed" : bounced ? "bounced" : complained ? "complained" : null;
  return { stages, reachedCount, failure };
}

/** One plain-language sentence about where this email is right now. */
export function describe(email: EmailListItem): string {
  switch (email.status) {
    case "FAILED":
      return email.error ?? "It could not be sent.";
    case "BOUNCED":
      return "It bounced: that address doesn't exist or the inbox can't take it.";
    case "COMPLAINED":
      return "The recipient marked it as spam. Avoid writing to them again.";
    case "DELAYED":
      return "Delivery is delayed. Their mail server hasn't accepted it yet; it will keep trying.";
    case "QUEUED":
      return "Getting ready to send…";
    default:
  }
  if (email.clickCount > 0) return "A link was clicked. Someone is interested.";
  if (email.openCount > 0) return "Opened. Their mail app loaded the message. Apple Mail and Gmail can do this automatically, so treat it as a hint.";
  if (email.deliveredAt) return "Delivered to their inbox. Opens and clicks show up here as they happen.";
  return "On its way. It usually lands within a minute.";
}

export function FlightTracker({ email, animate = true }: { email: EmailListItem; animate?: boolean }) {
  const { stages, reachedCount, failure } = stagesOf(email);
  const lastReached = Math.max(0, reachedCount - 1);
  const pending = !failure && reachedCount < 2 && email.status !== "QUEUED";
  // Position of the filled line: from the first node's centre to the last reached node's centre.
  const fill = (lastReached / (stages.length - 1)) * 100;

  return (
    <div>
      <div className="relative px-[12.5%]">
        <div className="absolute inset-x-[12.5%] top-[13px] h-px bg-line-2" />
        <div
          className={`absolute left-[12.5%] top-[12px] h-[3px] rounded-full ${failure ? "bg-alert" : "bg-sheen"} ${animate ? "transition-[width] duration-1000 ease-out" : ""}`}
          style={{ width: `calc((100% - 25%) * ${fill / 100})` }}
        />
        <ol className="relative -mx-[12.5%] grid grid-cols-4">
          {stages.map((stage, index) => {
            const isCurrent = index === lastReached && !failure;
            const bad = stage.failed === true;
            return (
              <li key={stage.key} className="flex flex-col items-center text-center">
                <span
                  className={`relative flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 transition-colors duration-500 ${
                    bad
                      ? "border-alert bg-alert text-white"
                      : stage.reached
                        ? "border-transparent bg-sheen text-white"
                        : "border-line-2 bg-paper text-transparent"
                  }`}
                >
                  {bad ? <X size={14} strokeWidth={2.5} /> : stage.reached ? <Check size={14} strokeWidth={2.5} /> : null}
                  {pending && index === 1 ? <span className="absolute inset-[-5px] animate-beat rounded-full border border-feather/40" /> : null}
                  {isCurrent && stage.reached && index > 0 ? <span className="absolute inset-[-4px] rounded-full ring-2 ring-feather/20" /> : null}
                </span>
                <span className={`mt-2 text-[13px] font-medium ${bad ? "text-alert" : stage.reached ? "text-ink" : "text-ink-3"}`}>{stage.label}</span>
                <span className="mt-0.5 font-mono text-[11px] text-ink-3">{stage.at ? clock(stage.at) : "–"}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** The same journey as four tiny dots, for dense lists. */
export function TrackerDots({ email }: { email: EmailListItem }) {
  const { stages, failure } = stagesOf(email);
  return (
    <span className="inline-flex items-center" aria-hidden="true">
      {stages.map((stage, index) => (
        <span key={stage.key} className="inline-flex items-center">
          {index > 0 ? <span className={`h-px w-2.5 ${stage.reached ? (failure ? "bg-alert" : "bg-feather/60") : "bg-line-2"}`} /> : null}
          <span
            className={`h-2 w-2 rounded-full ${stage.failed ? "bg-alert" : stage.reached ? "bg-sheen" : "border border-line-2 bg-transparent"}`}
          />
        </span>
      ))}
    </span>
  );
}
