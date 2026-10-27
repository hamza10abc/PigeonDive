import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import type { SetupState } from "../types";
import { Eyebrow } from "./ui";

/** Shown on the first page until the essentials are in place, so nobody has to guess what to do first. */
export function SetupChecklist({ setup }: { setup: SetupState }) {
  const steps = [
    { done: setup.apiKey, title: "Connect Resend", text: "Paste your Resend API key. This is what actually delivers your email.", to: "/settings", cta: "Add key" },
    { done: setup.domain, title: "Choose where emails come from", text: "Pick the domain you verified in Resend.", to: "/settings", cta: "Choose domain" },
    { done: setup.templates > 0, title: "Make your first template", text: "The words and design of what you'll send.", to: "/templates/new", cta: "Create template" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const current = steps.findIndex((s) => !s.done);

  return (
    <section className="mb-10 rounded-panel border border-line bg-surface p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Eyebrow>Get ready to send</Eyebrow>
        <span className="font-mono text-[12px] text-ink-3">
          {doneCount} of {steps.length}
        </span>
      </div>
      <ol className="divide-y divide-line">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-medium ${
                step.done ? "bg-sheen text-white" : index === current ? "bg-ink text-white" : "border border-line-2 text-ink-3"
              }`}
            >
              {step.done ? <Check size={14} strokeWidth={2.5} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${step.done ? "text-ink-3 line-through decoration-line-2" : ""}`}>{step.title}</p>
              {!step.done ? <p className="mt-0.5 text-[14px] text-ink-2">{step.text}</p> : null}
            </div>
            {index === current ? (
              <Link to={step.to} className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white">
                {step.cta} <ArrowRight size={14} />
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
