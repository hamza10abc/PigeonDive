import { ButtonHTMLAttributes, forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const field =
  "block w-full rounded-field border border-line-2 bg-white px-3.5 py-3 text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3 focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/[0.07] disabled:bg-surface disabled:text-ink-3";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} {...props} className={`${field} ${props.className ?? ""}`} />;
});

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${field} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 ${props.className ?? ""}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23848B87' stroke-width='1.5'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")` }} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${field} ${props.className ?? ""}`} />;
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[13px] leading-snug text-ink-3">{hint}</span> : null}
    </label>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "md" | "sm";
};

const variants = {
  primary: "bg-ink text-white hover:bg-[#262b31] disabled:bg-ink-3 shadow-press",
  secondary: "border border-line-2 bg-white text-ink hover:border-ink-3 disabled:text-ink-3",
  ghost: "text-ink-2 hover:bg-ink/[0.05] hover:text-ink disabled:text-ink-3",
  danger: "text-alert hover:bg-alert/[0.07] disabled:text-ink-3",
};

export function Button({ variant = "primary", size = "md", loading, children, className = "", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-field font-medium transition active:translate-y-px disabled:cursor-not-allowed ${
        size === "md" ? "min-h-[46px] px-5 text-[15px]" : "min-h-[36px] px-3 text-[13px]"
      } ${variants[variant]} ${className}`}
    >
      {loading ? <Dots /> : children}
    </button>
  );
}

export function Dots() {
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-label="Working">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-beat rounded-full bg-current" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div role="tablist" className={`inline-flex rounded-full bg-ink/[0.06] p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-[34px] whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition ${
            value === option.value ? "bg-white text-ink shadow-press ring-1 ring-line" : "text-ink-2 hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const pillTones = {
  neutral: { text: "text-ink-2", dot: "bg-ink-3" },
  green: { text: "text-feather", dot: "bg-[#12a37f]" },
  blue: { text: "text-sky", dot: "bg-sky" },
  amber: { text: "text-amber", dot: "bg-[#d99a1f]" },
  red: { text: "text-alert", dot: "bg-alert" },
};

export function Status({ tone = "neutral", children }: { tone?: keyof typeof pillTones; children: ReactNode }) {
  const t = pillTones[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${t.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded border border-line-2 px-1.5 py-px font-mono text-[11px] uppercase tracking-wide text-ink-3">{children}</span>;
}

export function PageHeader({ title, lead, action }: { title: ReactNode; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-8 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight md:text-[44px]">{title}</h1>
        {lead ? <p className="mt-2 max-w-xl text-[15px] text-ink-2">{lead}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-field border border-alert/25 bg-alert/[0.06] px-3.5 py-2.5 text-[14px] text-alert">{children}</p>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{children}</p>;
}
