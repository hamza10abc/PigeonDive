import { FormEvent, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { api, ApiError } from "../api";
import { describe, FlightTracker } from "../components/FlightTracker";
import { TemplateThumb } from "../components/TemplateThumb";
import { Button, ErrorNote, Eyebrow, Skeleton, Status } from "../components/ui";
import type { EmailDetail, EmailListItem, SetupState, Sender, Template } from "../types";

const POLL_MS = 3000;
const POLL_FOR_MS = 3 * 60 * 1000;
const LAST_TEMPLATE_KEY = "pigeondive_last_template";
const EMAIL_SHAPE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** "a@x.com, b@x.com" or one per line → the unique addresses, plus anything that doesn't look like one. */
function parseRecipients(text: string) {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of text.split(/[\s,;]+/).filter(Boolean)) {
    const address = part.toLowerCase();
    if (!EMAIL_SHAPE.test(address)) invalid.push(part);
    else if (!seen.has(address)) {
      seen.add(address);
      valid.push(address);
    }
  }
  return { valid, invalid };
}

function rememberedTemplate() {
  try {
    return localStorage.getItem(LAST_TEMPLATE_KEY);
  } catch {
    return null;
  }
}

export function ComposePage() {
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => api<Template[]>("/templates") });
  const senders = useQuery({ queryKey: ["senders"], queryFn: () => api<Sender[]>("/senders") });
  const meta = useQuery({ queryKey: ["meta"], queryFn: () => api<{ senderDomain: string | null }>("/meta") });
  const setup = useQuery({ queryKey: ["setup"], queryFn: () => api<SetupState>("/setup") });

  const [to, setTo] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [fromLocalPart, setFromLocalPart] = useState("");
  const [sent, setSent] = useState<{ emails: EmailListItem[]; at: number } | null>(null);

  const selected = templates.data?.find((t) => t.id === templateId);
  const domain = meta.data?.senderDomain ?? null;
  const recipients = useMemo(() => parseRecipients(to), [to]);

  // Start with a template already chosen (the one used last, else the first), so step 1 is done on arrival.
  const templateDefaulted = useRef(false);
  useEffect(() => {
    const list = templates.data;
    if (templateDefaulted.current || !list?.length) return;
    templateDefaulted.current = true;
    const start = list.find((t) => t.id === rememberedTemplate()) ?? list[0];
    setTemplateId(start.id);
    setSubject(start.subject);
  }, [templates.data]);

  // The most recently used sender name is the likeliest one, so it is there without being asked.
  const senderDefaulted = useRef(false);
  useEffect(() => {
    if (!senderDefaulted.current && senders.data?.length) {
      senderDefaulted.current = true;
      setFromLocalPart((current) => current || senders.data![0].localPart);
    }
  }, [senders.data]);

  // The recipients box starts as one line and grows as addresses are added.
  const toBox = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = toBox.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.style.overflowY = el.scrollHeight > 220 ? "auto" : "hidden";
  }, [to, sent]);

  function pickTemplate(template: Template) {
    setTemplateId(template.id);
    setSubject(template.subject);
  }

  const send = useMutation({
    mutationFn: () =>
      api<EmailListItem[]>("/emails", { method: "POST", body: JSON.stringify({ to: recipients.valid, templateId, subject, fromLocalPart }) }),
    onSuccess: (emails) => {
      try {
        localStorage.setItem(LAST_TEMPLATE_KEY, templateId);
      } catch {
        /* remembering the template is a convenience only */
      }
      setSent({ emails, at: Date.now() });
      void queryClient.invalidateQueries({ queryKey: ["senders"] });
      void queryClient.invalidateQueries({ queryKey: ["emails"] });
      void queryClient.invalidateQueries({ queryKey: ["setup"] });
    },
  });

  // One recipient: follow the email for a few minutes so the tracker fills in on its own.
  const only = sent?.emails.length === 1 ? sent.emails[0] : null;
  const live = useQuery({
    queryKey: ["email", only?.id],
    queryFn: () => api<EmailDetail>(`/emails/${only!.id}`),
    enabled: !!only && only.status !== "FAILED",
    refetchInterval: () => (sent && Date.now() - sent.at < POLL_FOR_MS ? POLL_MS : false),
    initialData: only && only.status !== "FAILED" ? ({ ...only, body: "", events: [] } as EmailDetail) : undefined,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (ready) send.mutate();
  }

  function again() {
    setSent(null);
    setTo("");
    send.reset();
  }

  const count = recipients.valid.length;
  const templateDone = !!selected;
  const detailsDone = !!subject.trim() && !!fromLocalPart.trim();
  const recipientsDone = count > 0 && recipients.invalid.length === 0;
  const ready = templateDone && detailsDone && recipientsDone;
  const needsSetup = !!setup.data && !(setup.data.apiKey && setup.data.domain);
  const sendError = send.error instanceof ApiError ? send.error.message : send.error ? "Could not send" : null;
  const needsSettings = !!sendError && /settings/i.test(sendError);

  const nextStep = !templateDone ? "Pick a template" : !detailsDone ? "Add a subject and sender" : !recipientsDone ? "Add who it's for" : null;

  const form = (
    <form onSubmit={submit} className="animate-rise space-y-7">
      <Step n={1} done={templateDone} title={<>Pick a <em className="italic">template</em></>}>
        {templates.isLoading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : !templates.data?.length ? (
          <Link to="/templates/new" className="flex h-[180px] items-center justify-center gap-2 rounded-panel border border-dashed border-line-2 text-[15px] text-ink-2 hover:border-ink-3 hover:text-ink">
            <Plus size={18} strokeWidth={1.5} /> Make your first template
          </Link>
        ) : (
          <>
            {/* The chosen template as a sheet of paper on top of a small stack. */}
            <div className="relative pb-4">
              <span className="absolute inset-x-4 bottom-0 top-4 rounded-panel border border-line bg-white/60" />
              <span className="absolute inset-x-2 bottom-2 top-2 rounded-panel border border-line-2 bg-white/80" />
              <div key={templateId} className="relative animate-rise overflow-hidden rounded-panel border border-line-2 bg-white shadow-float">
                {selected ? <TemplateThumb format={selected.format} body={selected.body} className="h-[140px] md:h-[170px]" /> : null}
              </div>
            </div>
            <div className="no-scrollbar -mx-5 mt-3 flex snap-x gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
              {templates.data.map((t) => {
                const on = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t)}
                    aria-pressed={on}
                    className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 text-[14px] font-medium transition ${on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink-3 hover:text-ink"}`}
                  >
                    {t.name}
                  </button>
                );
              })}
              <Link to="/templates/new" className="shrink-0 snap-start whitespace-nowrap rounded-full border border-dashed border-line-2 px-4 py-2 text-[14px] text-ink-3 transition hover:border-ink-3 hover:text-ink">
                + New
              </Link>
            </div>
          </>
        )}
      </Step>

      <Step n={2} done={detailsDone} title={<>Check the <em className="italic">subject</em> and sender</>}>
        <div className="overflow-hidden rounded-panel border border-line-2 bg-white transition focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/[0.07]">
          <label className="flex items-center gap-2.5 border-b border-line px-3.5">
            <span className="w-[50px] shrink-0 text-[13px] text-ink-3">Subject</span>
            <input required placeholder="What is it about?" value={subject} onChange={(e) => setSubject(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-ink outline-none placeholder:text-ink-3" />
          </label>
          <label className="flex items-center gap-2.5 px-3.5">
            <span className="w-[50px] shrink-0 text-[13px] text-ink-3">From</span>
            {/* The name hugs its text so it reads as one address: contact@your-domain. */}
            <span className="flex min-w-0 flex-1 items-baseline py-3.5">
              <input
                required
                aria-label="Sender name"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="hello"
                value={fromLocalPart}
                onChange={(e) => setFromLocalPart(e.target.value)}
                style={{ width: `${Math.max(fromLocalPart.length, 5)}ch` }}
                className="max-w-[55%] shrink-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3"
              />
              <span className="min-w-0 truncate text-[13px] text-ink-3">@{domain ?? "your-domain"}</span>
            </span>
          </label>
        </div>
        {senders.data && senders.data.length > 1 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
            Also used:
            {senders.data
              .filter((s) => s.localPart !== fromLocalPart)
              .slice(0, 4)
              .map((s) => (
                <button key={s.localPart} type="button" onClick={() => setFromLocalPart(s.localPart)} className="underline decoration-line-2 underline-offset-4 hover:text-ink">
                  {s.localPart}
                </button>
              ))}
          </div>
        ) : null}
      </Step>

      <Step n={3} done={recipientsDone} title={<>Who is it <em className="italic">for</em>?</>}>
        <textarea
          ref={toBox}
          required
          rows={1}
          inputMode="email"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          aria-label="Recipient email addresses"
          placeholder="name@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="block max-h-[220px] w-full resize-none rounded-panel border border-line-2 bg-white px-4 py-3.5 text-[16px] leading-normal text-ink outline-none transition placeholder:text-ink-3 focus:border-ink focus:ring-4 focus:ring-ink/[0.07]"
        />
        <p className={`mt-2.5 text-[13px] ${recipients.invalid.length ? "text-alert" : "text-ink-3"}`}>
          {recipients.invalid.length
            ? `“${recipients.invalid[0]}” doesn't look like an email address.`
            : count > 1
              ? `${count} people. Each gets a private copy.`
              : "Add several by separating them with commas."}
        </p>
      </Step>

      <div className="space-y-3">
        <ErrorNote>
          {sendError ? (
            <>
              {sendError}
              {needsSettings ? (
                <>
                  {" "}
                  <Link to="/settings" className="font-medium underline underline-offset-2">Open Settings</Link>
                </>
              ) : null}
            </>
          ) : null}
        </ErrorNote>
        {needsSetup ? (
          <Link to="/settings" className="flex min-h-[54px] w-full items-center justify-center rounded-field border border-ink text-[16px] font-medium text-ink transition hover:bg-ink hover:text-white">
            Finish setup to start sending →
          </Link>
        ) : (
          <>
            <Button type="submit" loading={send.isPending} disabled={!ready} className="group relative min-h-[54px] w-full overflow-hidden text-[16px]">
              {count > 1 ? `Send to ${count} people` : "Send"}
              <Dart className="transition group-enabled:group-hover:translate-x-0.5" />
              {ready ? <span className="bg-sheen absolute inset-x-0 bottom-0 h-[3px]" /> : null}
            </Button>
            {nextStep ? <p className="text-center text-[13px] text-ink-3">{nextStep}</p> : null}
          </>
        )}
      </div>
    </form>
  );

  const sentPanel = sent ? (
    only ? <SingleSent email={live.data ?? only} onAgain={again} /> : <BatchSent emails={sent.emails} onAgain={again} />
  ) : null;

  return <div className="mx-auto w-full max-w-[520px] md:-mt-5">{sentPanel ?? form}</div>;
}

/** One of the three things to do. The marker fills in once that step is complete. */
function Step({ n, done, title, children }: { n: number; done: boolean; title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3.5 flex items-center gap-3 font-display text-[23px] leading-tight tracking-tight">
        <span
          aria-hidden="true"
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border font-sans text-[11px] font-medium transition ${done ? "border-ink bg-ink text-white" : "border-line-2 text-ink-3"}`}
        >
          {done ? <Check size={12} strokeWidth={3} /> : n}
        </span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Dart({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="-14 -9 30 18" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M-13 -8 15 0 -13 8 -8 0Z" />
    </svg>
  );
}

function SingleSent({ email, onAgain }: { email: EmailDetail | EmailListItem; onAgain: () => void }) {
  return (
    <section className="animate-rise rounded-panel border border-line bg-surface p-6 md:p-8">
      <Eyebrow>{email.status === "FAILED" ? "It didn't go" : "On its way"}</Eyebrow>
      <h2 className="mt-2 break-words font-display text-[28px] leading-tight tracking-tight">
        {email.status === "FAILED" ? "Sending failed" : <>To <em className="italic">{email.toEmail}</em></>}
      </h2>
      <div className="mt-8">
        <FlightTracker email={email} />
      </div>
      <div className="perforation my-7" />
      <p className="text-[14px] leading-relaxed text-ink-2">{describe(email)}</p>
      {email.status === "FAILED" && /settings/i.test(email.error ?? "") ? (
        <Link to="/settings" className="mt-3 inline-block text-[14px] font-medium underline underline-offset-2">Open Settings</Link>
      ) : null}
      <SentActions onAgain={onAgain} />
    </section>
  );
}

function BatchSent({ emails, onAgain }: { emails: EmailListItem[]; onAgain: () => void }) {
  const failed = emails.filter((e) => e.status === "FAILED");
  const went = emails.length - failed.length;
  return (
    <section className="animate-rise rounded-panel border border-line bg-surface p-6 md:p-8">
      <Eyebrow>{went > 0 ? "On their way" : "It didn't go"}</Eyebrow>
      <h2 className="mt-2 font-display text-[28px] leading-tight tracking-tight">
        {went > 0 ? <>Sent to <em className="italic">{went} {went === 1 ? "person" : "people"}</em></> : "Sending failed"}
      </h2>
      <p className="mt-2 text-[14px] text-ink-2">
        {failed.length > 0 ? `${failed.length} didn't go through.` : "Each one was sent separately. Follow them in Activity."}
      </p>
      <ul className="mt-6 divide-y divide-line rounded-field border border-line bg-white">
        {emails.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 break-all font-mono text-[13px]">{e.toEmail}</span>
              <span className="shrink-0">
                <Status tone={e.status === "FAILED" ? "red" : "green"}>{e.status === "FAILED" ? "Failed" : "Sent"}</Status>
              </span>
            </div>
            {e.status === "FAILED" && e.error ? <p className="mt-1 text-[12px] text-ink-3">{e.error}</p> : null}
          </li>
        ))}
      </ul>
      <SentActions onAgain={onAgain} />
    </section>
  );
}

function SentActions({ onAgain }: { onAgain: () => void }) {
  return (
    <div className="mt-7 flex flex-wrap gap-2">
      <Button onClick={onAgain}>Send another</Button>
      <Link to="/activity" className="inline-flex min-h-[46px] items-center rounded-field px-4 text-[15px] font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink">
        View in Activity
      </Link>
    </div>
  );
}
