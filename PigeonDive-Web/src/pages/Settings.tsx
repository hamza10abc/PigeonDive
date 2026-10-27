import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";
import { Button, ErrorNote, Eyebrow, Field, Input, PageHeader, Status } from "../components/ui";
import { timeAgo } from "../lib/format";
import type { ResendDomain, SettingsData } from "../types";

function Step({ n, done, title, lead, children }: { n: number; done: boolean; title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line py-9 md:grid-cols-[240px_minmax(0,1fr)] md:gap-12">
      <div>
        <span className={`mb-3 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium ${done ? "bg-sheen text-white" : "border border-line-2 text-ink-3"}`}>
          {done ? <Check size={15} strokeWidth={2.5} /> : n}
        </span>
        <h2 className="font-display text-[24px] leading-tight tracking-tight">{title}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{lead}</p>
      </div>
      <div className="min-w-0 max-w-xl">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, logout } = useAuth();

  const settings = useQuery({ queryKey: ["settings"], queryFn: () => api<SettingsData>("/settings") });
  const hasKey = !!settings.data?.resendKeyHint;

  const domains = useQuery({
    queryKey: ["domains", settings.data?.resendKeyHint],
    queryFn: () => api<{ domains: ResendDomain[] }>("/settings/resend/domains", { method: "POST" }),
    enabled: hasKey,
    retry: false,
    staleTime: 60_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["settings"] });
    void queryClient.invalidateQueries({ queryKey: ["setup"] });
    void queryClient.invalidateQueries({ queryKey: ["meta"] });
  };

  const update = useMutation({
    mutationFn: (body: Partial<{ resendApiKey: string; webhookSecret: string; senderDomain: string }>) => api<SettingsData>("/settings", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: refresh,
  });

  // — Step 1: key
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  async function saveKey(event: FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync({ resendApiKey: keyInput.trim() });
      setKeyInput("");
      await queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.ok("Key saved");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Could not save the key");
    }
  }

  // — Step 2: domain
  const [domainInput, setDomainInput] = useState("");
  useEffect(() => setDomainInput(settings.data?.senderDomain ?? ""), [settings.data?.senderDomain]);
  const chosen = domains.data?.domains.find((d) => d.name === settings.data?.senderDomain);
  async function saveDomain(name: string) {
    try {
      await update.mutateAsync({ senderDomain: name.trim() });
      toast.ok(name.trim() ? "Sending domain saved" : "Sending domain cleared");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Could not save the domain");
    }
  }

  // — Step 3: webhook
  const webhookUrl = `${window.location.origin}/api/webhooks/resend`;
  const [secretInput, setSecretInput] = useState("");
  const [copied, setCopied] = useState(false);
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy isn't available here. Select the address and copy it by hand.");
    }
  }
  async function saveSecret(event: FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync({ webhookSecret: secretInput.trim() });
      setSecretInput("");
      toast.ok("Signing secret saved");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Could not save the secret");
    }
  }

  // — Account
  const [pw, setPw] = useState({ current: "", next: "" });
  const changePassword = useMutation({
    mutationFn: () => api("/auth/password", { method: "POST", body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) }),
    onSuccess: () => {
      setPw({ current: "", next: "" });
      toast.ok("Password changed");
    },
  });

  const steps = [!!settings.data?.resendKeyHint, !!settings.data?.senderDomain, !!settings.data?.lastWebhookAt];
  const doneCount = steps.filter(Boolean).length;
  const domainError = domains.error instanceof ApiError ? domains.error.message : null;

  return (
    <div>
      <PageHeader title={<>Your <em className="italic">settings</em></>} lead="Connect PigeonDive to Resend once, and everything else takes care of itself." />

      <div className="mb-2 flex items-center gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-sheen transition-[width] duration-700" style={{ width: `${(doneCount / 3) * 100}%` }} />
        </div>
        <span className="font-mono text-[12px] text-ink-3">{doneCount} of 3 connected</span>
      </div>

      <Step n={1} done={steps[0]} title="Connect Resend" lead={<>Resend is the service that delivers your email. Create an API key in your Resend dashboard under <b className="font-medium">API Keys</b>, and paste it here.</>}>
        <form onSubmit={saveKey} className="space-y-3">
          {settings.data?.resendKeyHint ? (
            <p className="flex items-center gap-2 text-[14px]">
              <Status tone="green">Connected</Status>
              <span className="font-mono text-[13px] text-ink-3">{settings.data.resendKeyHint}</span>
            </p>
          ) : null}
          <Field label={hasKey ? "Replace key" : "Resend API key"}>
            <div className="relative">
              <Input type={showKey ? "text" : "password"} autoComplete="off" spellCheck={false} placeholder="re_…" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} className="pr-11 font-mono text-[14px]" />
              <button type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "Hide key" : "Show key"} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-3 hover:text-ink">
                {showKey ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
              </button>
            </div>
          </Field>
          <Button type="submit" loading={update.isPending} disabled={!keyInput.trim()}>
            Save key
          </Button>
        </form>
      </Step>

      <Step n={2} done={steps[1]} title="Where emails come from" lead="Choose the domain you've verified in Resend. People will see addresses like hello@your-domain.">
        {!hasKey ? (
          <p className="text-[14px] text-ink-3">Connect Resend first and your domains will appear here.</p>
        ) : (
          <div className="space-y-4">
            {domains.isLoading ? <p className="text-[14px] text-ink-3">Asking Resend for your domains…</p> : null}
            <ErrorNote>{domainError}</ErrorNote>
            {domains.data?.domains.length === 0 ? <p className="text-[14px] text-ink-2">Resend has no domains on this account yet. Add and verify one there, then come back.</p> : null}
            <div className="flex flex-wrap gap-2">
              {domains.data?.domains.map((d) => {
                const on = d.name === settings.data?.senderDomain;
                return (
                  <button key={d.name} type="button" onClick={() => saveDomain(d.name)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] transition ${on ? "border-ink bg-ink text-white" : "border-line-2 bg-white hover:border-ink-3"}`}>
                    <span className="font-mono text-[13px]">{d.name}</span>
                    <span className={`text-[11px] ${on ? "text-white/60" : d.status === "verified" ? "text-feather" : "text-amber"}`}>{d.status === "verified" ? "verified" : d.status}</span>
                  </button>
                );
              })}
            </div>
            {chosen && (chosen.openTracking === false || chosen.clickTracking === false) ? (
              <p className="rounded-field border border-amber/30 bg-amber/[0.07] px-3.5 py-2.5 text-[13px] leading-snug text-amber">
                {[chosen.openTracking === false ? "Open" : null, chosen.clickTracking === false ? "click" : null].filter(Boolean).join(" and ")} tracking is switched off for this domain in Resend, so those will never appear in Activity. You can turn it on in Resend under Domains.
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Or type one yourself">
                  <Input placeholder="mail.example.com" autoCapitalize="none" spellCheck={false} value={domainInput} onChange={(e) => setDomainInput(e.target.value)} className="font-mono text-[14px]" />
                </Field>
              </div>
              <Button variant="secondary" onClick={() => saveDomain(domainInput)} disabled={domainInput.trim() === (settings.data?.senderDomain ?? "")}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Step>

      <Step n={3} done={steps[2]} title="See what happens next" lead="Resend tells PigeonDive when an email is delivered, opened or clicked. This is how Activity stays up to date.">
        <ol className="space-y-6 text-[14px] leading-relaxed text-ink-2">
          <li>
            <p className="mb-2 font-medium text-ink">In Resend, add a webhook that points here</p>
            <div className="flex items-stretch gap-2">
              <input readOnly value={webhookUrl} onFocus={(e) => e.currentTarget.select()} aria-label="Webhook address" className="min-w-0 flex-1 rounded-field border border-line-2 bg-surface px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none" />
              <Button variant="secondary" onClick={copyUrl} aria-label="Copy address">
                {copied ? <Check size={16} /> : <Copy size={16} strokeWidth={1.6} />}
              </Button>
            </div>
            <p className="mt-2 text-[13px] text-ink-3">Resend must be able to reach this address from the internet, so use your public web address (or a tunnel) rather than localhost. Tick every email event.</p>
          </li>
          <li>
            <p className="mb-2 font-medium text-ink">Paste its signing secret</p>
            <form onSubmit={saveSecret} className="flex items-end gap-2">
              <div className="flex-1">
                <Input type="password" autoComplete="off" spellCheck={false} placeholder={settings.data?.webhookSecretSet ? "Saved. Paste a new one to replace it" : "whsec_…"} value={secretInput} onChange={(e) => setSecretInput(e.target.value)} className="font-mono text-[14px]" aria-label="Signing secret" />
              </div>
              <Button type="submit" variant="secondary" disabled={!secretInput.trim()} loading={update.isPending && !!secretInput}>
                Save
              </Button>
            </form>
          </li>
          <li className="flex items-center gap-3 border-t border-line pt-5">
            {settings.data?.lastWebhookAt ? (
              <Status tone="green">Live. Last update {timeAgo(settings.data.lastWebhookAt)}</Status>
            ) : (
              <Status tone="neutral">{settings.data?.webhookSecretSet ? "Waiting for the first update from Resend" : "Not connected yet. You can still send; Activity just won't update."}</Status>
            )}
          </li>
        </ol>
      </Step>

      <section className="grid gap-5 border-t border-line py-9 md:grid-cols-[240px_minmax(0,1fr)] md:gap-12">
        <div>
          <Eyebrow>Account</Eyebrow>
          <h2 className="mt-3 font-display text-[24px] leading-tight tracking-tight">Your login</h2>
          <p className="mt-1.5 text-[14px] text-ink-2">
            Signed in as <span className="font-mono text-[13px]">{user?.username}</span>.
          </p>
        </div>
        <div className="max-w-xl space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePassword.mutate();
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Field label="Current password">
              <Input type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="New password" hint="At least 6 characters">
              <Input type="password" autoComplete="new-password" required minLength={6} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <ErrorNote>{changePassword.error instanceof ApiError ? changePassword.error.message : null}</ErrorNote>
              <div className="mt-3 flex items-center gap-2">
                <Button type="submit" variant="secondary" loading={changePassword.isPending}>
                  Change password
                </Button>
                <Button type="button" variant="ghost" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

    </div>
  );
}
