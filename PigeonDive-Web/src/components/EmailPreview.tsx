import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Segmented } from "./ui";
import type { TemplateFormat } from "../types";

/** Renders a template or a sent email. HTML goes in a fully sandboxed iframe (no scripts, no
 * same-origin access), so pasted markup can't run code inside the app. */
export function EmailPreview({
  format,
  body,
  height = 460,
  toggle = true,
}: {
  format: TemplateFormat;
  body: string;
  height?: number;
  toggle?: boolean;
}) {
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");

  if (format === "TEXT") {
    return (
      <pre
        className="overflow-auto whitespace-pre-wrap break-words rounded-panel border border-line bg-white p-5 font-mono text-[13px] leading-relaxed text-ink"
        style={{ minHeight: 120, maxHeight: height }}
      >
        {body || "Nothing to preview yet."}
      </pre>
    );
  }

  return (
    <div>
      {toggle ? (
        <div className="mb-3 flex justify-end">
          <Segmented
            value={device}
            onChange={setDevice}
            options={[
              { value: "desktop", label: <Monitor size={15} strokeWidth={1.6} aria-label="Desktop" /> },
              { value: "phone", label: <Smartphone size={15} strokeWidth={1.6} aria-label="Phone" /> },
            ]}
          />
        </div>
      ) : null}
      <div className="overflow-auto rounded-panel border border-line bg-surface p-3">
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={body || "<p style='font-family:sans-serif;color:#848b87'>Nothing to preview yet.</p>"}
          className={`mx-auto block bg-white ${device === "phone" ? "rounded-[22px] border-[6px] border-ink" : "rounded-lg"}`}
          style={{ width: device === "phone" ? 375 : "100%", maxWidth: "100%", height, border: device === "phone" ? undefined : 0 }}
        />
      </div>
    </div>
  );
}
