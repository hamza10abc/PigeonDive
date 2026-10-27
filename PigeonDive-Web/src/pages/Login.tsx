import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ApiError } from "../api";
import { useAuth } from "../auth";
import { Wordmark } from "../components/Logo";
import { Button, ErrorNote, Field, Input } from "../components/ui";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      {/* Brand side: a flight path from "sent" to "opened", with the dart travelling along it. */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white md:flex md:flex-col md:justify-between">
        <Wordmark light />

        <svg viewBox="0 0 520 380" fill="none" className="pointer-events-none absolute inset-x-0 top-[18%] w-full opacity-95" aria-hidden="true">
          <defs>
            <linearGradient id="dart" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#12A37F" />
              <stop offset="0.6" stopColor="#7FB84A" />
              <stop offset="1" stopColor="#E0B13C" />
            </linearGradient>
          </defs>
          <path d="M-10 330C90 330 120 120 250 130S400 250 540 70" stroke="#3A4149" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
          {[
            { cx: 40, cy: 329, label: "Sent" },
            { cx: 232, cy: 131, label: "Delivered" },
            { cx: 420, cy: 207, label: "Opened" },
          ].map((p) => (
            <g key={p.label}>
              <circle cx={p.cx} cy={p.cy} r="5" fill="#111418" stroke="#8A918D" strokeWidth="1.5" />
              <text x={p.cx + 12} y={p.cy + 22} fill="#8A918D" fontSize="11" fontFamily="JetBrains Mono Variable, monospace" letterSpacing="1.2">
                {p.label.toUpperCase()}
              </text>
            </g>
          ))}
          <g>
            <path d="M-13 -8 15 0 -13 8 -8 0Z" fill="url(#dart)" />
            <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path="M-10 330C90 330 120 120 250 130S400 250 540 70" />
          </g>
        </svg>

        <div className="relative max-w-md">
          <h1 className="font-display text-[56px] leading-[1.02] tracking-tight">
            Send it.
            <br />
            Watch it <em className="italic text-[#8fd6b4]">land.</em>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/60">
            Write an email, send it, and see exactly when it arrives, gets opened, and gets clicked.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-10 md:hidden">
            <Wordmark />
          </div>
          <h2 className="font-display text-[34px] leading-tight tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-[15px] text-ink-2">Sign in to send and track your email.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Username">
              <Input autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-3 hover:text-ink"
                >
                  {show ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
                </button>
              </div>
            </Field>
            <ErrorNote>{error}</ErrorNote>
            <Button type="submit" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
