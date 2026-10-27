import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Plus } from "lucide-react";
import { api, ApiError } from "../api";
import { DartPath } from "../components/Illustrations";
import { EmailPreview } from "../components/EmailPreview";
import { describe, FlightTracker } from "../components/FlightTracker";
import { SetupChecklist } from "../components/SetupChecklist";
import { TemplateThumb } from "../components/TemplateThumb";
import { Button, ErrorNote, Eyebrow, PageHeader, Skeleton } from "../components/ui";
import type { EmailDetail, EmailListItem, SetupState, Sender, Template } from "../types";

const POLL_MS = 3000;
const POLL_FOR_MS = 3 * 60 * 1000;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 last:border-b-0">
      <span className="w-[62px] shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">{label}</span>
      {children}
    </div>
  );
}

const bareInput = "min-w-0 flex-1 bg-transparent py-4 text-ink outline-none placeholder:text-ink-3";

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
  const [showPreview, setShowPreview] = useState(false);
  const [sent, setSent] = useState<{ email: EmailListItem; at: number } | null>(null);

  const selected = templates.data?.find((t) => t.id === templateId);
  const domain = meta.data?.senderDomain ?? null;

  // The most recently used sender name is the likeliest one, so offer it without being asked.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!prefilled.current && senders.data?.length) {
      prefilled.current = true;
      setFromLocalPart((current) => current || senders.data![0].localPart);
    }
  }, [senders.data]);

  function pickTemplate(template: Template) {
    setTemplateId(template.id);
    setSubject(template.subject);
  }

  const send = useMutation({
    mutationFn: () => api<EmailListItem>("/emails", { method: "POST", body: JSON.stringify({ to, templateId, subject, fromLocalPart }) }),
    onSuccess: (email) => {
      setSent({ email, at: Date.now() });
      void queryClient.invalidateQueries({ queryKey: ["senders"] });
      void queryClient.invalidateQueries({ queryKey: ["emails"] });
      void queryClient.invalidateQueries({ queryKey: ["setup"] });
    },
  });

  // After sending, follow the email for a few minutes so the tracker fills in on its own.
  const live = useQuery({
    queryKey: ["email", sent?.email.id],
    queryFn: () => api<EmailDetail>(`/emails/${sent!.email.id}`),
    enabled: !!sent && sent.email.status !== "FAILED",
    refetchInterval: () => (sent && Date.now() - sent.at < POLL_FOR_MS ? POLL_MS : false),
    initialData: sent && sent.email.status !== "FAILED" ? ({ ...sent.email, body: "", events: [] } as EmailDetail) : undefined,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    send.mutate();
  }

  function again() {
    setSent(null);
    setTo("");
    send.reset();
  }

  const ready = !!to.trim() && !!templateId && !!subject.trim() && !!fromLocalPart.trim();
  const tracked = sent ? (live.data ?? sent.email) : null;
  const sendError = send.error instanceof ApiError ? send.error.message : send.error ? "Could not send" : null;
  const needsSettings = !!sendError && /settings/i.test(sendError);

  const form = (
    <form onSubmit={submit} className="space-y-8 animate-rise">
      <div>
        <Eyebrow>1 · Template</Eyebrow>
        {templates.isLoading ? (
          <div className="mt-3 flex gap-3">
            <Skeleton className="h-[188px] w-[132px]" />
            <Skeleton className="h-[188px] w-[132px]" />
          </div>
        ) : (
          <div className="no-scrollbar -mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
            {templates.data?.map((t) => {
              const on = t.id === templateId;
              return (
                <button key={t.id} type="button" onClick={() => pickTemplate(t)} aria-pressed={on} className="group w-[132px] shrink-0 snap-start text-left">
                  <span className={`relative block overflow-hidden rounded-lg border transition ${on ? "border-ink ring-2 ring-ink" : "border-line-2 group-hover:border-ink-3"}`}>
                    <TemplateThumb format={t.format} body={t.body} className="aspect-[4/5]" />
                    {on ? (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 block truncate text-[13px] font-medium">{t.name}</span>
                </button>
              );
            })}
            <Link to="/templates/new" className="flex aspect-[4/5] w-[132px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-2 text-[13px] text-ink-3 transition hover:border-ink-3 hover:text-ink">
              <Plus size={18} strokeWidth={1.5} />
              New template
            </Link>
          </div>
        )}
      </div>

      <div>
        <Eyebrow>2 · Address it</Eyebrow>
        <div className="mt-3 overflow-hidden rounded-panel border border-line-2 bg-white transition focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/[0.07]">
          <Row label="To">
            <input type="email" required inputMode="email" autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="name@example.com" value={to} onChange={(e) => setTo(e.target.value)} className={bareInput} />
          </Row>
          <div className="flex flex-wrap items-center gap-x-3 border-b border-line px-4">
            <span className="w-[62px] shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">From</span>
            <input required autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="hello" aria-label="Sender name" value={fromLocalPart} onChange={(e) => setFromLocalPart(e.target.value)} className={`${bareInput} min-w-[90px] text-left sm:text-right`} />
            <span className="truncate font-mono text-[13px] text-ink-3 max-sm:-mt-2 max-sm:basis-full max-sm:pb-3 max-sm:pl-[74px] sm:py-4">@{domain ?? "…"}</span>
          </div>
          <Row label="Subject">
            <input required placeholder="What is it about?" value={subject} onChange={(e) => setSubject(e.target.value)} className={bareInput} />
          </Row>
        </div>

        {senders.data && senders.data.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[13px] text-ink-3">Used before:</span>
            {senders.data.slice(0, 6).map((s) => (
              <button key={s.localPart} type="button" onClick={() => setFromLocalPart(s.localPart)} className={`rounded-full border px-3 py-1 font-mono text-[12px] transition ${fromLocalPart === s.localPart ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink-3"}`}>
                {s.localPart}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-ink-3">Type any name for “From”. It will be remembered next time.</p>
        )}
        {!domain && !meta.isLoading ? (
          <p className="mt-3 text-[13px] text-amber">
            Choose your sending domain in <Link to="/settings" className="underline underline-offset-2">Settings</Link> before sending.
          </p>
        ) : null}
      </div>

      {/* Phones get the preview inline; wide screens keep it beside the form. */}
      <div className="lg:hidden">
        <button type="button" onClick={() => setShowPreview(!showPreview)} className="flex w-full items-center justify-between rounded-field border border-line-2 bg-white px-4 py-3 text-[14px] font-medium">
          Preview what they'll see
          <ChevronDown size={17} className={`transition ${showPreview ? "rotate-180" : ""}`} />
        </button>
        {showPreview ? <div className="mt-3"><PreviewPane template={selected} subject={subject} from={fromLocalPart && domain ? `${fromLocalPart}@${domain}` : ""} to={to} /></div> : null}
      </div>

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
        <Button type="submit" loading={send.isPending} disabled={!ready} className="w-full sm:w-auto sm:min-w-[180px]">
          Send email
        </Button>
        <p className="text-[13px] text-ink-3">The message itself comes from the template. The subject is yours to change.</p>
      </div>
    </form>
  );

  const sentPanel = tracked ? (
    <section className="animate-rise rounded-panel border border-line bg-surface p-6 md:p-8">
      <Eyebrow>{tracked.status === "FAILED" ? "It didn't go" : "On its way"}</Eyebrow>
      <h2 className="mt-2 break-words font-display text-[28px] leading-tight tracking-tight">
        {tracked.status === "FAILED" ? "Sending failed" : <>To <em className="italic">{tracked.toEmail}</em></>}
      </h2>
      <div className="mt-8">
        <FlightTracker email={tracked} />
      </div>
      <div className="perforation my-7" />
      <p className="text-[14px] leading-relaxed text-ink-2">{describe(tracked)}</p>
      {tracked.status === "FAILED" && /settings/i.test(tracked.error ?? "") ? (
        <Link to="/settings" className="mt-3 inline-block text-[14px] font-medium underline underline-offset-2">Open Settings</Link>
      ) : null}
      <div className="mt-7 flex flex-wrap gap-2">
        <Button onClick={again}>Send another</Button>
        <Link to="/activity" className="inline-flex min-h-[46px] items-center rounded-field px-4 text-[15px] font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink">
          View in Activity
        </Link>
      </div>
    </section>
  ) : null;

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <PageHeader title={<>Send an <em className="italic">email</em></>} lead="Pick a template, say who it's for, and send. We'll show you what happens next." />
        {setup.data ? <SetupChecklist setup={setup.data} /> : null}
        {sentPanel ?? form}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <Eyebrow>What they'll see</Eyebrow>
          <div className="mt-3">
            <PreviewPane template={selected} subject={subject} from={fromLocalPart && domain ? `${fromLocalPart}@${domain}` : ""} to={to} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function PreviewPane({ template, subject, from, to }: { template?: Template; subject: string; from: string; to: string }) {
  if (!template) {
    return (
      <div className="flex flex-col items-center rounded-panel border border-dashed border-line-2 px-6 py-16 text-center">
        <DartPath className="w-44 opacity-90" />
        <p className="mt-4 font-display text-[20px] leading-tight">Nothing to show yet</p>
        <p className="mt-1 text-[14px] text-ink-3">Choose a template and it appears here, just as it will in their inbox.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-panel border border-line-2 bg-white">
      <div className="px-5 pb-4 pt-5">
        <p className="break-words font-display text-[22px] leading-snug tracking-tight">{subject || <span className="text-ink-3">No subject</span>}</p>
        <p className="mt-2 font-mono text-[12px] leading-relaxed text-ink-3">
          <span className="text-ink-2">{from || "from"}</span> → {to || "recipient"}
        </p>
      </div>
      <div className="perforation" />
      <div className="p-3">
        <EmailPreview format={template.format} body={template.body} height={520} />
      </div>
    </div>
  );
}
