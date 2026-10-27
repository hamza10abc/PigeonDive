import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../api";
import { EmptyTemplates } from "../components/Illustrations";
import { TemplateThumb } from "../components/TemplateThumb";
import { useToast } from "../components/Toast";
import { PageHeader, Skeleton, Tag } from "../components/ui";
import { timeAgo } from "../lib/format";
import type { Template } from "../types";

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => api<Template[]>("/templates") });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      void queryClient.invalidateQueries({ queryKey: ["setup"] });
      toast.ok("Template deleted");
    },
  });

  const newButton = (
    <Link to="/templates/new" className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-field bg-ink px-5 text-[15px] font-medium text-white shadow-press transition active:translate-y-px">
      <Plus size={17} strokeWidth={1.8} />
      <span className="hidden sm:inline">New template</span>
      <span className="sm:hidden">New</span>
    </Link>
  );

  return (
    <div>
      <PageHeader title={<>Your <em className="italic">templates</em></>} lead="The wording and design of the emails you send. Make one once, use it as often as you like." action={newButton} />

      {templates.isLoading ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      ) : null}

      {templates.data?.length === 0 ? (
        <div className="flex flex-col items-center rounded-panel border border-dashed border-line-2 px-6 py-20 text-center">
          <EmptyTemplates className="w-40" />
          <h2 className="mt-5 font-display text-[26px] leading-tight tracking-tight">Nothing here yet</h2>
          <p className="mt-1.5 max-w-sm text-[15px] text-ink-2">Start from a ready-made layout and change the words. It takes a minute.</p>
          <Link to="/templates/new" className="mt-6 inline-flex min-h-[46px] items-center rounded-field bg-ink px-5 text-[15px] font-medium text-white">
            Create your first template
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
        {templates.data?.map((t) => (
          <article key={t.id} className="group relative">
            <Link to={`/templates/${t.id}`} className="block">
              <span className="block overflow-hidden rounded-lg border border-line-2 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-ink-3 group-hover:shadow-float">
                <TemplateThumb format={t.format} body={t.body} className="aspect-[4/5]" />
              </span>
              <h2 className="mt-3 truncate text-[15px] font-medium">{t.name}</h2>
              <p className="truncate text-[13px] text-ink-3">{t.subject || "No subject"}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-3">
                <Tag>{t.format === "HTML" ? "Design" : "Text"}</Tag>
                edited {timeAgo(t.updatedAt)}
              </p>
            </Link>
            <button
              type="button"
              aria-label={`Delete ${t.name}`}
              onClick={() => window.confirm(`Delete “${t.name}”? Emails you already sent keep their content.`) && remove.mutate(t.id)}
              className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-ink-3 opacity-100 ring-1 ring-line transition hover:text-alert md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <Trash2 size={14} strokeWidth={1.7} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
