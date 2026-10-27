import { useEffect, useRef, useState } from "react";
import type { TemplateFormat } from "../types";

const FRAME_WIDTH = 600;

/** A real, scaled-down rendering of a template, so people recognise it by sight, not by name. */
export function TemplateThumb({ format, body, className = "" }: { format: TemplateFormat; body: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [height, setHeight] = useState(500);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const next = el.clientWidth / FRAME_WIDTH;
      setScale(next);
      setHeight(el.clientHeight / next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className={`relative overflow-hidden bg-white ${className}`} aria-hidden="true">
      {format === "HTML" ? (
        <iframe
          title="Template thumbnail"
          sandbox=""
          loading="lazy"
          tabIndex={-1}
          srcDoc={body}
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width: FRAME_WIDTH, height, transform: `scale(${scale})` }}
        />
      ) : (
        <pre className="absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-3 font-mono text-[9px] leading-[1.5] text-ink-2">{body}</pre>
      )}
    </div>
  );
}
