import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, FileText, LogOut, PenLine, Settings } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { SetupState } from "../types";
import { Wordmark } from "./Logo";

const NAV = [
  { to: "/", label: "Compose", icon: PenLine, end: true },
  { to: "/templates", label: "Templates", icon: FileText, end: false },
  { to: "/activity", label: "Activity", icon: Activity, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const setup = useQuery({ queryKey: ["setup"], queryFn: () => api<SetupState>("/setup") });
  // A dot on Settings while the essentials (key + domain) are missing: the one nudge that matters.
  const needsSetup = setup.data ? !(setup.data.apiKey && setup.data.domain) : false;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden border-b border-line bg-paper md:block">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-10 px-8">
          <NavLink to="/" aria-label="PigeonDive home">
            <Wordmark />
          </NavLink>
          <nav className="flex flex-1 items-center gap-1" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${isActive ? "bg-white text-ink ring-1 ring-line" : "text-ink-2 hover:text-ink"}`
                }
              >
                {item.label}
                {item.to === "/settings" && needsSetup ? <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-amber" /> : null}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-[13px] text-ink-2">
            <span className="font-mono text-[12px]">{user?.username}</span>
            <button onClick={logout} className="rounded-full p-2 text-ink-3 transition hover:bg-ink/[0.06] hover:text-ink" aria-label="Sign out" title="Sign out">
              <LogOut size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="flex h-14 items-center justify-between border-b border-line bg-paper px-5 md:hidden">
        <Wordmark />
        <button onClick={logout} aria-label="Sign out" className="-mr-2 rounded-full p-2 text-ink-3">
          <LogOut size={18} strokeWidth={1.6} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-32 pt-8 md:px-8 md:pb-16 md:pt-12">
        <div key={location.pathname} className="mx-auto w-full max-w-[1120px] animate-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper md:hidden" aria-label="Main">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium">
            {({ isActive }) => (
              <>
                <span className={`absolute top-0 h-[2px] w-8 rounded-full transition-opacity ${isActive ? "bg-sheen opacity-100" : "opacity-0"}`} />
                <span className="relative">
                  <item.icon size={21} strokeWidth={1.5} className={isActive ? "text-ink" : "text-ink-3"} />
                  {item.to === "/settings" && needsSetup ? <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-amber" /> : null}
                </span>
                <span className={isActive ? "text-ink" : "text-ink-3"}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
