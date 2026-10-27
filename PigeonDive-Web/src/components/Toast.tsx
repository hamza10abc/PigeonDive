import { createContext, ReactNode, useCallback, useContext, useState } from "react";

type ToastItem = { id: number; message: string; tone: "ok" | "error" };
type ToastApi = { ok: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const api: ToastApi = { ok: (m) => push(m, "ok"), error: (m) => push(m, "error") };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm animate-slide-up items-center gap-2.5 rounded-full bg-ink py-2.5 pl-3.5 pr-5 text-[14px] text-white shadow-float">
            <span className={`h-2 w-2 shrink-0 rounded-full ${t.tone === "ok" ? "bg-[#4fd1a5]" : "bg-[#ff8a78]"}`} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
