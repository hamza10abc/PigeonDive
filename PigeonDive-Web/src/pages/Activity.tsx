import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { api } from "../api";
import { EmailPreview } from "../components/EmailPreview";
import { describe, FlightTracker, TrackerDots } from "../components/FlightTracker";
import { EmptyActivity } from "../components/Illustrations";
import { Button, Eyebrow, PageHeader, Segmented, Skeleton, Status } from "../components/ui";
import { fullDate, percent, timeAgo } from "../lib/format";
import type { EmailDetail, EmailListItem, EmailPage, EmailStats, EmailView } from "../types";

type Headline = { tone: "neutral" | "green" | "blue" | "amber" | "red"; label: string };

function headline(email: EmailListItem): Headline {
  if (email.status === "FAILED") return { tone: "red", label: "Failed" };
  if (email.status === "BOUNCED") return { tone: "red", label: "Bounced" };
  if (email.status === "COMPLAINED") return { tone: "red", label: "Spam report" };
  if (email.clickCount > 0) return { tone: "green", label: "Clicked" };
  if (email.openCount > 0) return { tone: "blue", label: "Opened" };
  if (email.status === "DELIVERED") return { tone: "green", label: "Delivered" };
  if (email.status === "DELAYED") return { tone: "amber", label: "Delayed" };
  if (email.status === "QUEUED") return { tone: "neutral", label: "Queued" };
  return { tone: "neutral", label: "Sent" };
}

const EVENT_LABEL: Record<string, string> = {
  "email.sent": "Sent",
  "email.delivered": "Delivered",
  "email.delivery_delayed": "Delivery delayed",
  "email.opened": "Opened",
  "email.clicked": "Link clicked",
  "email.bounced": "Bounced",
  "email.complained": "Marked as spam",
  "email.failed": "Failed",
};

export function ActivityPage() {
  const [view, setView] = useState<EmailView>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useQuery({ queryKey: ["emails", "stats"], queryFn: () => api<EmailStats>("/emails/stats"), refetchInterval: 15_000 });
  const emails = useQuery({
    queryKey: ["emails", view, page],
    queryFn: () => api<EmailPage>(`/emails?view=${view}&page=${page}&pageSize=15`),
    refetchInterval: 15_000,
  });

  const totalPages = emails.data ? Math.max(1, Math.ceil(emails.data.total / emails.data.pageSize)) : 1;
  const nothingEver = stats.data?.sent === 0 && !stats.data.problems;

  return (
    <div>
      <PageHeader title={<>Activity</>} lead="Everything you've sent, and what happened next." />

      {nothingEver ? (
        <div className="flex flex-col items-center rounded-panel border border-dashed border-line-2 px-6 py-20 text-center">
          <EmptyActivity className="w-44" />
          <h2 className="mt-5 font-display text-[26px] leading-tight tracking-tight">No flights yet</h2>
          <p className="mt-1.5 max-w-sm text-[15px] text-ink-2">Send your first email and you'll watch it travel here: sent, delivered, opened, clicked.</p>
          <Link to="/" className="mt-6 inline-flex min-h-[46px] items-center rounded-field bg-ink px-5 text-[15px] font-medium text-white">
            Send an email
          </Link>
        </div>
      ) : (
        <>
          <dl className="mb-10 grid grid-cols-2 border-y border-line md:grid-cols-4 md:divide-x md:divide-line">
            <Figure label="Sent" value={stats.data?.sent} note="emails" />
            <Figure label="Delivered" value={stats.data?.delivered} note={stats.data ? `${percent(stats.data.delivered, stats.data.sent)} of sent` : ""} />
            <Figure label="Opened" value={stats.data?.opened} note={stats.data ? `${percent(stats.data.opened, stats.data.delivered)} of delivered` : ""} />
            <Figure label="Clicked" value={stats.data?.clicked} note={stats.data ? `${percent(stats.data.clicked, stats.data.delivered)} of delivered` : ""} />
          </dl>

          <div className="no-scrollbar -mx-5 mb-5 overflow-x-auto px-5 md:mx-0 md:px-0">
            <Segmented
              value={view}
              onChange={(v) => {
                setView(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "delivered", label: "Delivered" },
                { value: "opened", label: "Opened" },
                { value: "clicked", label: "Clicked" },
                { value: "problems", label: <span className={stats.data?.problems ? "text-alert" : ""}>Problems{stats.data?.problems ? ` ${stats.data.problems}` : ""}</span> },
              ]}
            />
          </div>

          {emails.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[68px]" />
              ))}
            </div>
          ) : null}
          {emails.data?.items.length === 0 ? <p className="rounded-panel border border-dashed border-line-2 px-6 py-14 text-center text-[15px] text-ink-3">Nothing matches this filter yet.</p> : null}

          <ul className="divide-y divide-line border-y border-line">
            {emails.data?.items.map((email) => {
              const h = headline(email);
              return (
                <li key={email.id}>
                  <button type="button" onClick={() => setSelectedId(email.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-1 py-4 text-left transition hover:bg-white md:grid-cols-[minmax(0,1fr)_auto_104px_84px] md:px-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{email.toEmail}</span>
                      <span className="block truncate text-[14px] text-ink-3">{email.subject}</span>
                    </span>
                    <span className="hidden md:block">
                      <TrackerDots email={email} />
                    </span>
                    <span className="justify-self-end md:justify-self-start">
                      <Status tone={h.tone}>{h.label}</Status>
                    </span>
                    <span className="col-span-2 flex items-center justify-between font-mono text-[12px] text-ink-3 md:col-span-1 md:justify-end">
                      <span className="md:hidden">
                        <TrackerDots email={email} />
                      </span>
                      {timeAgo(email.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {emails.data && totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-[14px] text-ink-2">
              <span className="font-mono text-[12px] text-ink-3">
                {(page - 1) * emails.data.pageSize + 1}–{Math.min(page * emails.data.pageSize, emails.data.total)} of {emails.data.total}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
                  <ChevronLeft size={15} /> Newer
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
                  Older <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {selectedId ? <Sheet id={selectedId} onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value?: number; note: string }) {
  return (
    <div className="px-1 py-6 md:px-8 md:first:pl-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{label}</dt>
      <dd className="mt-2 font-display text-[48px] leading-none tracking-tight md:text-[56px]">{value ?? "–"}</dd>
      <p className="mt-2 text-[13px] text-ink-3">{note}</p>
    </div>
  );
}

function Sheet({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useQuery({ queryKey: ["email", id], queryFn: () => api<EmailDetail>(`/emails/${id}`), refetchInterval: 10_000 });
  const email = detail.data;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-ink/40 md:items-stretch" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Email details"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full animate-slide-up overflow-y-auto rounded-t-[20px] bg-paper p-6 shadow-float md:max-h-none md:w-[520px] md:animate-slide-in md:rounded-none md:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>Flight details</Eyebrow>
            <h2 className="mt-1.5 break-words font-display text-[28px] leading-tight tracking-tight">{email?.toEmail ?? <Skeleton className="h-8 w-56" />}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 shrink-0 rounded-full p-2 text-ink-3 hover:bg-ink/[0.06] hover:text-ink">
            <X size={19} strokeWidth={1.6} />
          </button>
        </div>

        {!email ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-8">
            <div>
              <FlightTracker email={email} />
              <p className="mt-6 text-[14px] leading-relaxed text-ink-2">{describe(email)}</p>
            </div>

            <div className="perforation" />

            <dl className="space-y-3 text-[14px]">
              <Detail label="Subject">{email.subject}</Detail>
              <Detail label="From"><span className="font-mono text-[13px]">{email.fromEmail}</span></Detail>
              <Detail label="Sent">{fullDate(email.sentAt ?? email.createdAt)}</Detail>
              <Detail label="Opens">{email.openCount}</Detail>
              <Detail label="Clicks">{email.clickCount}</Detail>
            </dl>

            <div>
              <Eyebrow>Timeline</Eyebrow>
              {email.events.length === 0 ? (
                <p className="mt-3 text-[14px] text-ink-3">Nothing reported back yet. Updates arrive through the Resend webhook, set up in Settings.</p>
              ) : (
                <ol className="relative mt-4 space-y-4 border-l border-line-2 pl-5">
                  {email.events.map((event) => (
                    <li key={event.id} className="relative">
                      <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-paper ${event.type.match(/bounce|complain|fail/) ? "bg-alert" : "bg-sheen"}`} />
                      <p className="text-[14px] font-medium">
                        {EVENT_LABEL[event.type] ?? event.type}
                        {event.metadata?.likelyBot ? <span className="ml-2 text-[12px] font-normal text-amber">probably a mail scanner, not counted</span> : null}
                      </p>
                      <p className="font-mono text-[12px] text-ink-3">{fullDate(event.occurredAt)}</p>
                      {event.metadata?.link ? <p className="mt-0.5 break-all font-mono text-[12px] text-sky">{event.metadata.link}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <Eyebrow>What was sent</Eyebrow>
              <div className="mt-3">
                <EmailPreview format={email.format} body={email.body} height={340} toggle={false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-16 shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
